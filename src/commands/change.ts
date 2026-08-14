// multivac change — new / plan / apply / land / close. The mechanics are
// deterministic; SDD steps are adapter calls that degrade to notices.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, rm, rmdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import type { Command, Config, VerifyReport } from '../types.js';
import { CHANGES_DIR, CONFIG_PATH, LAW_PATH, RITUAL_PATH, loadConfig } from '../lib/config.js';
import { lsFiles, run as gitRun } from '../lib/git.js';
import { say, warn } from '../lib/out.js';
import { ritualChecklist } from '../lib/ritual.js';
import { applyManagedBlock } from '../doors/block.js';
import { renderConsumerDoor } from '../doors/consumer.js';
import { sddSpec } from '../adapters/registry.js';
import { binaryPresent } from '../adapters/detect.js';
import { evaluate } from './verify.js';
import {
  ChangeError,
  REPO_STATUSES,
  type ParsedChange,
  type RepoStatus,
  archiveChange,
  changePath,
  changeRel,
  closeGate,
  landingPlan,
  loadChange,
  saveChange,
  scaffoldChange,
} from '../change/file.js';
import { readLaw, releaseUnused, reserveId } from '../change/reserve.js';

const execFileP = promisify(execFile);


/** Run one SDD workflow step. Declared+absent binary = notice, never a failure. */
async function runSdd(
  cfg: Config,
  brain: string,
  step: 'propose' | 'apply' | 'archive',
  slug: string,
  noSdd: boolean,
): Promise<void> {
  if (!cfg.sdd || !cfg.sddAuto || noSdd) return;
  const spec = sddSpec(cfg.sdd);
  if (spec && !(await binaryPresent(spec))) {
    say(`sdd ${cfg.sdd}: binary not found — ${step} skipped; ${spec.installHint}`);
    return;
  }
  const bin = spec?.binaries[0] ?? cfg.sdd;
  const args = [step, slug];
  try {
    await execFileP(bin, args, { cwd: brain });
    say(`sdd ${cfg.sdd}: ${step} done`);
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      say(`sdd ${cfg.sdd}: binary not found — ${step} skipped; install it or set sdd_auto: false`);
    } else {
      warn(`sdd ${cfg.sdd}: ${step} failed (${err.message.split('\n')[0]}) — run it by hand`);
    }
  }
}

function repoEntryOf(cfg: Config, key: string): Config['repos'][string] {
  const entry = cfg.repos[key];
  if (entry) return entry;
  // `brain` is the reserved handle for the brain itself: a change may name it
  // whether or not the config spells out the `brain: .` (brain==code) idiom.
  if (key === 'brain') return { path: '.', isBrain: true };
  throw new ChangeError(
    `repo "${key}" not declared in .multivac/config.yml — add repos.${key} with a path, or use "brain" for the brain itself`,
  );
}

async function clone(url: string, abs: string, key: string): Promise<void> {
  await execFileP('git', ['clone', '--quiet', url, abs]);
  say(`${key}: cloned ${url} -> ${abs}`);
}

interface BranchBase {
  ref: string;
  sha: string;
  why: string;
}

const refSha = (repo: string, ref: string): Promise<string | null> =>
  gitRun(repo, ['rev-parse', '--verify', '--quiet', ref]).then(
    (s) => s,
    () => null,
  );

const containsCommit = (repo: string, ancestor: string, descendant: string): Promise<boolean> =>
  gitRun(repo, ['merge-base', '--is-ancestor', ancestor, descendant]).then(
    () => true,
    () => false,
  );

/**
 * Candidate default-branch names, most authoritative first. `main`/`master` is
 * a guess: a repo whose trunk is called anything else used to fall straight
 * through to HEAD. Ask git what it already knows offline first — where
 * `origin/HEAD` points, and the `init.defaultBranch` this machine creates
 * repos with — before guessing.
 */
async function baseNames(repo: string): Promise<string[]> {
  const names: string[] = [];
  const originHead = await gitRun(repo, [
    'symbolic-ref',
    '--short',
    'refs/remotes/origin/HEAD',
  ]).catch(() => null);
  if (originHead) names.push(originHead.replace(/^origin\//, ''));
  const configured = await gitRun(repo, ['config', '--get', 'init.defaultBranch']).catch(
    () => null,
  );
  if (configured) names.push(configured);
  return [...new Set([...names.filter(Boolean), 'main', 'master'])];
}

/** The branch HEAD is on, or null on a detached HEAD. */
const currentBranch = (repo: string): Promise<string | null> =>
  gitRun(repo, ['symbolic-ref', '--short', '--quiet', 'HEAD']).then(
    (s) => s || null,
    () => null,
  );

/**
 * The newer of the local default branch and its remote-tracking ref. A brain
 * that has never been pushed is normal, so a merely-existing `origin/main` is
 * not authority. No network: only refs git already has.
 */
async function branchBase(repo: string): Promise<BranchBase> {
  for (const name of await baseNames(repo)) {
    const local = await refSha(repo, `refs/heads/${name}`);
    const remote = await refSha(repo, `refs/remotes/origin/${name}`);
    if (!local && !remote) continue;
    if (local && !remote) return { ref: name, sha: local, why: `no origin/${name} known locally` };
    if (!local && remote) {
      return { ref: `origin/${name}`, sha: remote, why: `no local ${name}` };
    }
    if (local === remote) {
      return { ref: name, sha: local!, why: `${name} and origin/${name} are the same commit` };
    }
    if (await containsCommit(repo, remote!, local!)) {
      return { ref: name, sha: local!, why: `local ${name} is ahead of origin/${name}` };
    }
    if (await containsCommit(repo, local!, remote!)) {
      return { ref: `origin/${name}`, sha: remote!, why: `origin/${name} is ahead of local ${name}` };
    }
    return { ref: name, sha: local!, why: `${name} and origin/${name} diverged — keeping local` };
  }
  // Last resort. HEAD is the trunk in a fresh repo and somebody else's change
  // branch in a busy one, and nothing offline tells the two apart — so name the
  // branch being built on instead of hiding it behind the word "HEAD".
  const head = await refSha(repo, 'HEAD');
  const on = await currentBranch(repo);
  return {
    ref: 'HEAD',
    sha: head ?? '',
    why: `no default branch found — branching from the checked-out ${on ? `branch ${on}` : 'detached HEAD'}; its commits come along`,
  };
}

interface MergeEvidence extends BranchBase {
  merged: boolean;
  /** Why there is no evidence — only set when `merged` is false. */
  missing?: string;
}

/**
 * Local evidence that a change landed: the change branch is contained in the
 * repo's default branch, which has moved past it. Equality proves nothing —
 * that is equally a branch just created and a fast-forward — and absence
 * proves nothing either: a squash, or a merge that only happened on the
 * remote, leaves no local trace. Offline; never authority to refuse. Null when
 * there is no default branch to check against.
 */
async function mergedLocally(repo: string, slug: string): Promise<MergeEvidence | null> {
  const base = await branchBase(repo);
  if (!base.sha || base.ref === 'HEAD') return null;
  const head = await refSha(repo, `refs/heads/${slug}`);
  if (head === null) return { ...base, merged: false, missing: `no local branch ${slug}` };
  if (head === base.sha) {
    return {
      ...base,
      merged: false,
      missing: `${slug} and ${base.ref} are the same commit — a fresh branch looks exactly like a fast-forward`,
    };
  }
  if (await containsCommit(repo, head, base.sha)) return { ...base, merged: true };
  return { ...base, merged: false, missing: `${slug} is not contained in ${base.ref} here` };
}

const hasOrigin = (repo: string): Promise<boolean> =>
  gitRun(repo, ['remote']).then(
    (s) => s.split('\n').includes('origin'),
    () => false,
  );

/** Absolute path of a change repo key, or null when nothing declares it. */
function repoAbs(brain: string, cfg: Config, key: string): string | null {
  const entry = cfg.repos[key] ?? (key === 'brain' ? { path: '.' } : undefined);
  return entry ? resolve(brain, entry.path) : null;
}

/** Paths git lists (tab-indented) in a "would be overwritten by checkout" abort. */
const blockedPaths = (message: string): string[] =>
  [...message.matchAll(/^\t(.+?)\s*$/gm)].map((m) => m[1]);

/**
 * Switch `repo` onto the change branch, carrying `carry` (repo-relative paths,
 * the change's own declaration files) across the switch: git must never abort
 * on the files the lifecycle itself just wrote. Anything else that blocks the
 * switch is refused by name, with the command that unblocks it.
 */
async function ensureBranch(
  repo: string,
  slug: string,
  key: string,
  carry: string[],
): Promise<void> {
  const exists = (await refSha(repo, `refs/heads/${slug}`)) !== null;
  const base = exists ? null : await branchBase(repo);
  // git carries uncommitted edits onto a branch it creates at the same commit,
  // which is how one agent's work used to follow another onto the wrong branch.
  // Anything the lifecycle did not write itself refuses the switch, by name,
  // before git gets a chance to be helpful. Worktrees are machinery, not work.
  if ((await currentBranch(repo)) !== slug) {
    // -uall: an untracked directory collapses to `changes/`, which no carry
    // path would ever match — the files have to be named one by one.
    const busy = (await gitRun(repo, ['status', '--porcelain', '-uall']))
      .split('\n')
      .filter(Boolean)
      .map((l) => l.slice(3).trim())
      .filter((p) => !carry.includes(p) && !p.startsWith('.multivac/worktrees/'));
    if (busy.length > 0) {
      const list = busy.slice(0, 3).join(' ') + (busy.length > 3 ? ` +${busy.length - 3}` : '');
      throw new ChangeError(
        `${key}: cannot branch ${slug} — ${repo} carries uncommitted work: ${list}\n` +
          `  apply will not switch it to ${slug} under another change\n` +
          `  commit it, or park it: git -C ${repo} stash push -- ${list}\n` +
          `  then re-run: multivac change apply ${slug}`,
      );
    }
  }
  const held = new Map<string, string>();
  for (const rel of carry) {
    const abs = join(repo, rel);
    if (!existsSync(abs)) continue;
    held.set(rel, await readFile(abs, 'utf8'));
    await rm(abs);
  }
  try {
    await gitRun(repo, base ? ['switch', '-c', slug, base.ref] : ['switch', slug]);
  } catch (e) {
    const blocked = blockedPaths((e as Error).message);
    const list = blocked.length > 0 ? blocked.join(' ') : '.';
    throw new ChangeError(
      `${key}: cannot branch ${slug} — uncommitted work would be overwritten: ${list}\n` +
        `  commit it, or park it: git -C ${repo} stash push -- ${list}\n` +
        `  then re-run: multivac change apply ${slug}`,
    );
  } finally {
    for (const [rel, text] of held) {
      await mkdir(dirname(join(repo, rel)), { recursive: true });
      await writeFile(join(repo, rel), text);
    }
  }
  if (exists) say(`${key}: branch ${slug} already exists — switched to it, reusing`);
  else say(`${key}: branched ${slug} from ${base!.ref} ${base!.sha.slice(0, 7)} — ${base!.why}`);
  if (held.size > 0) say(`${key}: carried onto the branch: ${[...held.keys()].join(' ')}`);
}

/** Machinery, so it lives under `.multivac/` — and gitignored there. */
export const worktreePath = (brain: string, slug: string, key: string): string =>
  join(brain, '.multivac', 'worktrees', slug, key);

/**
 * The change gets its own checkout. Two agents in one repo must not share a
 * working tree: switching it under the other one moves their edits onto the
 * wrong branch. Returns the worktree, or null when git cannot make one.
 */
async function ensureWorktree(
  brain: string,
  repo: string,
  slug: string,
  key: string,
): Promise<string | null> {
  const wt = worktreePath(brain, slug, key);
  // A registration whose directory is gone refuses every later checkout.
  await gitRun(repo, ['worktree', 'prune']).catch(() => {});
  if (existsSync(join(wt, '.git'))) {
    say(`${key}: worktree ${wt} (already there)`);
    return wt;
  }
  const exists = (await refSha(repo, `refs/heads/${slug}`)) !== null;
  const base = exists ? null : await branchBase(repo);
  try {
    await gitRun(
      repo,
      base ? ['worktree', 'add', '-b', slug, wt, base.ref] : ['worktree', 'add', wt, slug],
    );
  } catch {
    return null;
  }
  // Same sentence the in-place switch prints: where the branch came from is
  // the same fact whichever checkout it lands in.
  if (base) say(`${key}: branched ${slug} from ${base.ref} ${base.sha.slice(0, 7)} — ${base.why}`);
  else say(`${key}: branch ${slug} already exists — switched to it, reusing`);
  say(`${key}: worktree ${wt}`);
  return wt;
}

/**
 * Where the agent works for this repo: the worktree, or — when git cannot make
 * one — the repo itself, branched in place by the same `ensureBranch` the
 * lifecycle has always used, refusal and carry included.
 */
async function ensureWorkspace(
  brain: string,
  repo: string,
  slug: string,
  key: string,
  carry: string[],
): Promise<string> {
  const wt = await ensureWorktree(brain, repo, slug, key);
  if (wt === null) {
    say(`${key}: no worktree available — branching in place`);
    await ensureBranch(repo, slug, key, carry);
    return repo;
  }
  // brain==code: the declaration is uncommitted in the brain tree, so the
  // worktree would not have it. Carry it, the way the in-place switch does.
  for (const rel of carry) {
    const from = join(repo, rel);
    const to = join(wt, rel);
    if (!existsSync(from) || existsSync(to)) continue;
    await mkdir(dirname(to), { recursive: true });
    await copyFile(from, to);
    say(`${key}: carried onto the branch: ${rel}`);
  }
  return wt;
}

/** close: the worktrees go with the change. Uncommitted work is never forced. */
async function removeWorktrees(
  brain: string,
  cfg: Config,
  keys: string[],
  slug: string,
): Promise<void> {
  for (const key of keys) {
    const wt = worktreePath(brain, slug, key);
    if (!existsSync(wt)) continue;
    const repo = repoAbs(brain, cfg, key);
    if (!repo) continue;
    try {
      await gitRun(repo, ['worktree', 'remove', wt]);
      say(`${key}: worktree removed (${wt})`);
    } catch {
      warn(
        `${key}: worktree ${wt} still has uncommitted work — ` +
          `\`git -C ${repo} worktree remove --force ${wt}\` when you are done with it`,
      );
    }
  }
  // rmdir, never recursive: a worktree that refused to go still holds work.
  await rmdir(join(brain, '.multivac', 'worktrees', slug)).catch(() => {});
}

/** Greenfield: git init, consumer door, first commit. Branching happens after. */
async function greenfield(abs: string, key: string, slug: string, cfg: Config): Promise<void> {
  await mkdir(abs, { recursive: true });
  await execFileP('git', ['init', '-q', abs]);
  await writeFile(join(abs, 'AGENTS.md'), applyManagedBlock(null, renderConsumerDoor(cfg)));
  await gitRun(abs, ['add', '-A']);
  await gitRun(abs, ['commit', '-q', '-m', `multivac: init ${key} (change ${slug})`]);
  say(`${key}: created ${abs} — git init, door written, first commit`);
}

/** Law table rows: id -> state cell (4th column). */
async function invariantStates(brain: string): Promise<Map<string, string>> {
  const law = await readLaw(brain);
  return new Map((law?.rows ?? []).map((r) => [r.id, r.state || '?']));
}

/** Every claim ID that has at least one @anchor line somewhere in the brain. */
async function anchoredClaimIds(brain: string): Promise<Set<string>> {
  const found = new Set<string>();
  for (const rel of await lsFiles(brain)) {
    let text: string;
    try {
      text = await readFile(join(brain, rel), 'utf8');
    } catch {
      continue;
    }
    for (const m of text.matchAll(/@anchor[ \t]+(\S+)/g)) found.add(m[1]);
  }
  return found;
}

const bump = (cur: RepoStatus, min: RepoStatus): RepoStatus =>
  REPO_STATUSES.indexOf(cur) >= REPO_STATUSES.indexOf(min) ? cur : min;

// --- subcommands ---

async function cmdNew(
  brain: string,
  cfg: Config,
  slug: string,
  title: string,
  noSdd: boolean,
): Promise<number> {
  if (existsSync(changePath(brain, slug))) {
    warn(`${changeRel(slug)} already exists — edit it, or pick another slug`);
    return 1;
  }
  const parsed = scaffoldChange(slug, title);
  // Allocate before anyone else reads the table: IDs picked by hand collide,
  // and the collision only shows up at merge.
  const reserved = await reserveId(brain, slug).catch((e) => {
    warn(`${(e as Error).message}`);
    return null;
  });
  if (reserved) parsed.change.invariants.adds = [reserved.id];
  await saveChange(brain, parsed);
  say(`created ${changeRel(slug)} — declare repos, landing_order, invariants, claims`);
  if (reserved) {
    say(
      `reserved ${reserved.id} — proposed row in ${LAW_PATH}, declared in invariants.adds; ` +
        'drop it from both if this change adds no law',
    );
  }
  await runSdd(cfg, brain, 'propose', slug, noSdd);
  return 0;
}

async function cmdPlan(brain: string, cfg: Config, slug: string): Promise<number> {
  const { change } = await loadChange(brain, slug);
  const keys = Object.keys(change.repos);
  if (keys.length === 0) {
    warn(`${changeRel(slug)} declares no repos — add repos: { <key>: { status: planned } }`);
    return 1;
  }
  let rc = 0;
  for (const key of keys) {
    let entry: Config['repos'][string];
    try {
      entry = repoEntryOf(cfg, key);
    } catch (e) {
      warn((e as Error).message);
      rc = 1;
      continue;
    }
    const abs = resolve(brain, entry.path);
    if (!existsSync(abs)) {
      if (entry.url) await clone(entry.url, abs, key);
      else say(`${key}: missing at ${abs}, no url — greenfield; \`change apply ${slug}\` creates it`);
    } else {
      say(`${key}: ${abs}${entry.isBrain ? ' (brain==code)' : ''}`);
    }
  }
  say('landing order:');
  landingPlan(change).forEach((s, i) => say(`  stage ${i + 1}: ${s.repos.join(', ')}`));
  const states = await invariantStates(brain);
  for (const id of [...change.invariants.touches, ...change.invariants.retires]) {
    const st = states.get(id);
    say(
      st
        ? `invariant ${id}: ${st}`
        : `invariant ${id}: not in ${LAW_PATH} — add the row or drop it from the change`,
    );
  }
  // Declared adds are reserved here, at declare time. An ID another change
  // already holds fails the plan — that argument belongs before the code, not
  // in a merge conflict.
  for (const id of change.invariants.adds) {
    try {
      const r = await reserveId(brain, slug, id);
      // A `proposed` row that survived reserveId is this change's own — the
      // one `new` allocated. Only law says "not new".
      say(
        r.state && r.state !== 'proposed'
          ? `invariant ${id}: already in ${LAW_PATH} (${r.state}) — not new; move it to touches, or pick a free id`
          : `invariant ${id}: reserved — proposed row in ${LAW_PATH}; state the rule before close`,
      );
    } catch (e) {
      warn((e as Error).message);
      rc = 1;
    }
  }
  const anchored = await anchoredClaimIds(brain);
  for (const c of change.claims) {
    if (!anchored.has(c.id)) {
      say(`claim ${c.id}: no anchor — add <!-- @anchor ${c.id} <repo>:<glob> /<regex>/ --> before close`);
    }
  }
  return rc;
}

async function cmdApply(
  brain: string,
  cfg: Config,
  slug: string,
  noSdd: boolean,
): Promise<number> {
  const parsed = await loadChange(brain, slug);
  const keys = Object.keys(parsed.change.repos);
  if (keys.length === 0) {
    warn(`${changeRel(slug)} declares no repos — declare them, then re-run apply`);
    return 1;
  }
  const workspaces: string[] = [];
  for (const key of keys) {
    const entry = repoEntryOf(cfg, key);
    const abs = resolve(brain, entry.path);
    if (!existsSync(abs)) {
      if (entry.url) await clone(entry.url, abs, key);
      else await greenfield(abs, key, slug, cfg);
    }
    // The declaration file and the reserved law row live in the brain and
    // belong to this change: they ride along instead of blocking the switch
    // that the lifecycle itself asked for.
    const carry =
      abs === resolve(brain) ? [relative(brain, changePath(brain, slug)), LAW_PATH] : [];
    workspaces.push(`${key}: ${await ensureWorkspace(brain, abs, slug, key, carry)}`);
    parsed.change.repos[key].status = bump(parsed.change.repos[key].status, 'branched');
    await saveChange(brain, parsed);
  }
  await runSdd(cfg, brain, 'apply', slug, noSdd);
  say(`work here — one checkout per repo, nobody else's tree moves:`);
  for (const w of workspaces) say(`  ${w}`);
  say(`then commit on branch ${slug} and run \`multivac change land ${slug}\``);
  return 0;
}

async function cmdLand(
  brain: string,
  cfg: Config,
  slug: string,
  landed: string | undefined,
): Promise<number> {
  const parsed = await loadChange(brain, slug);
  const { change } = parsed;
  if (Object.keys(change.repos).length === 0) {
    warn(`${changeRel(slug)} declares no repos — declare repos and landing_order first`);
    return 1;
  }
  if (landed !== undefined) {
    if (!change.repos[landed]) {
      warn(`repo "${landed}" is not in this change — check the frontmatter`);
      return 1;
    }
    if (change.repos[landed].status !== 'landed') {
      const plan = landingPlan(change);
      const idx = plan.findIndex((s) => s.repos.includes(landed));
      if (plan[idx].state === 'blocked') {
        const readyIdx = plan.findIndex((s) => s.state === 'ready');
        warn(
          `${landed} is in stage ${idx + 1}, which is blocked — land stage ${readyIdx + 1} first`,
        );
        return 1;
      }
      change.repos[landed].status = 'landed';
      await saveChange(brain, parsed);
      const abs = repoAbs(brain, cfg, landed);
      const ev = abs && existsSync(abs) ? await mergedLocally(abs, slug) : null;
      if (ev?.merged) {
        say(`${landed}: recorded as landed — ${slug} is merged into ${ev.ref} ${ev.sha.slice(0, 7)}`);
      } else {
        say(
          `${landed}: recorded as landed — recording without evidence: ` +
            `${ev?.missing ?? 'no local default branch to check a merge against'} ` +
            '(a squash or a remote-only merge looks like this too)',
        );
      }
    } else {
      say(`${landed}: already landed`);
    }
  }
  const plan = landingPlan(change);
  for (const [i, s] of plan.entries()) {
    say(`stage ${i + 1} [${s.state}] ${s.repos.map((k) => `${k}:${change.repos[k].status}`).join(' ')}`);
    if (s.state === 'ready') {
      for (const k of s.repos.filter((k) => change.repos[k].status !== 'landed')) {
        const abs = repoAbs(brain, cfg, k) ?? k;
        const ev = existsSync(abs) ? await mergedLocally(abs, slug) : null;
        if (ev?.merged) {
          say(`  ${k}: ${slug} is already merged into ${ev.ref} — record it: multivac change land ${slug} --landed ${k}`);
          continue;
        }
        // A repo with no origin lands locally; telling it to push is noise.
        if (await hasOrigin(abs)) {
          say(`  ${k}: git -C ${abs} push -u origin ${slug}`);
          say(`  ${k}: open MR ${slug} -> ${ev?.ref ?? 'main'} (state the landing order in the description)`);
        } else {
          say(
            `  ${k}: no origin remote — land locally: git -C ${abs} switch ${ev?.ref ?? 'main'} && git merge --no-ff ${slug}`,
          );
        }
        say(`  ${k}: once merged: multivac change land ${slug} --landed ${k}`);
      }
    }
    if (s.state === 'blocked') say('  waiting on an earlier stage — do not push yet');
  }
  if (plan.every((s) => s.state === 'landed')) {
    say(`all stages landed — run \`multivac change close ${slug}\``);
  }
  return 0;
}

async function cmdClose(
  brain: string,
  cfg: Config,
  slug: string,
  noSdd: boolean,
): Promise<number> {
  const parsed = await loadChange(brain, slug);
  const unlanded = Object.entries(parsed.change.repos).filter(([, r]) => r.status !== 'landed');
  if (unlanded.length > 0) {
    for (const [k, r] of unlanded) {
      warn(`${k}: ${r.status} — land every stage first (multivac change land ${slug})`);
    }
    return 1;
  }
  const ids = parsed.change.claims.map((c) => c.id);
  if (ids.length > 0) {
    const report = await evaluate(brain, { claimIds: ids });
    const gate = closeGate(report, ids);
    for (const l of gate.lines) say(l);
    if (!gate.ok) {
      warn('claims are not green — close refused; fix the red claims, then re-run close');
      return 1;
    }
  } else {
    say('no claims declared — nothing to verify');
  }
  await runSdd(cfg, brain, 'archive', slug, noSdd);
  const dest = await archiveChange(brain, parsed);
  say(`archived -> ${relative(brain, dest)}`);
  // The rename is a working-tree edit like any other: say so, with the command.
  say(
    `archived — commit this: git -C ${brain} add -A ${CHANGES_DIR} && git commit -m "Archive the ${slug} change"`,
  );
  // A reservation the change never used goes back to the pool; the worktrees
  // go with the change that owned them.
  const released = await releaseUnused(brain, slug, await anchoredClaimIds(brain));
  if (released.length > 0) {
    say(`released unused reservation${released.length > 1 ? 's' : ''}: ${released.join(', ')}`);
  }
  await removeWorktrees(brain, cfg, Object.keys(parsed.change.repos), slug);
  if (cfg.grapher) {
    say(`graph: refresh with \`${cfg.grapher} update .\` in the changed repos`);
  }
  // The rest of the ceremony is the team's: printed at the moment it matters,
  // never verified, never gating. Nothing written = nothing printed.
  const ritual = await ritualChecklist(brain);
  if (ritual.length > 0) {
    say('');
    say(`ritual (${RITUAL_PATH}) — multivac cannot check these; walk them with the user:`);
    for (const line of ritual) say(`  ${line}`);
  }
  return 0;
}

// --- dispatch ---

const SUBS = ['new', 'plan', 'apply', 'land', 'close'] as const;

/** "Points expire!" -> "points-expire". */
const slugify = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function usage(): void {
  say('multivac change <sub> <slug> [args]');
  say(`  new "<title>"          scaffold ${CHANGES_DIR}/<slug>.md + reserve the next invariant id`);
  say('  new <slug> "<title>"   same, with an explicit slug');
  say('  plan <slug>            resolve repos, landing graph, reserve declared ids, claims');
  say('  apply <slug>           worktree per repo (greenfield repos get created)');
  say('  land <slug>            landing-order report; --landed <repo> records a merge');
  say(`  close <slug>           verify claims, archive the change, print ${RITUAL_PATH}`);
  say('flags: --no-sdd (skip SDD steps), --landed <repo> (land only)');
}

export const change: Command = {
  name: 'change',
  help: 'new/plan/apply/land/close — the ecosystem change lifecycle',
  async run(argv, ctx): Promise<number> {
    const pos: string[] = [];
    let noSdd = false;
    let landed: string | undefined;
    for (let i = 0; i < argv.length; i++) {
      const a = argv[i];
      if (a === '--no-sdd') noSdd = true;
      else if (a === '--landed') landed = argv[++i];
      else if (a.startsWith('--')) {
        warn(`unknown flag ${a} — run \`multivac change\` for usage`);
        return 2;
      } else pos.push(a);
    }
    let [sub, slug, title] = pos;
    if (!sub || !(SUBS as readonly string[]).includes(sub)) {
      usage();
      return 2;
    }
    if (sub === 'new' && slug && title === undefined) {
      // canonical form: multivac change new "<title>" — derive the slug
      title = slug;
      slug = slugify(title);
    }
    if (!slug || !/^[a-z0-9][a-z0-9._-]*$/i.test(slug)) {
      warn(`usage: multivac change ${sub} <slug> — slug is letters/digits/dots/dashes`);
      return 2;
    }
    if (sub === 'new' && !title) {
      warn(`usage: multivac change new "<title>"`);
      return 2;
    }
    const brain = ctx.cwd;
    const cfg = await loadConfig(brain);
    try {
      switch (sub) {
        case 'new':
          return await cmdNew(brain, cfg, slug, title, noSdd);
        case 'plan':
          return await cmdPlan(brain, cfg, slug);
        case 'apply':
          return await cmdApply(brain, cfg, slug, noSdd);
        case 'land':
          return await cmdLand(brain, cfg, slug, landed);
        default:
          return await cmdClose(brain, cfg, slug, noSdd);
      }
    } catch (e) {
      if (e instanceof ChangeError) {
        warn(e.message);
        return 1;
      }
      throw e;
    }
  },
};
