// `multivac repos` — list declared repos; `repos sync [--shallow]` clones
// every declared-with-url missing repo AND fetches every present one. The ONLY
// command besides `change` that touches the network. execFile git, clear
// auth-failure message, no retry.
//
// The fetch is not a nicety. Since MV-53 a brain-scoped `verify` judges each
// sibling at its channel ref — a LOCAL remote-tracking ref — so the whole
// ecosystem's verdict is only as true as the last fetch. Cloning alone left a
// day-old `origin/main` reading as "the ecosystem as published", and every
// staleness line in `verify` already names this command as the fix.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { readdir } from 'node:fs/promises';
import type { Command, Config, RepoEntry } from '../types.js';
import { CONFIG_PATH, ConfigError, loadConfig } from '../lib/config.js';
import { pathExists, readOnly } from '../adapters/detect.js';
import { gitFailure, gitlinkInIndex, inHead, lsTreeGitlink, submoduleAdd } from '../lib/git.js';
import { parseArgs, type ArgsDef } from 'citty';
import { surfaceFrom, undeclared } from '../lib/args.js';
import { quoteFailure, say, warn } from '../lib/out.js';
import { cloneFix, cloneState, projectDocVerdict } from '../lib/repo-state.js';
import { adapterFor } from '../adapters/detect.js';
import { grapherSpec, sddSpec } from '../adapters/registry.js';
import { initState } from '../lib/init-state.js';
import { equip, missingTools } from '../adapters/equip.js';

const execFileP = promisify(execFile);

const AUTH_RE =
  /authentication failed|permission denied|could not read username|could not read password|publickey|access denied/i;

export async function reposList(brainDir: string): Promise<string[]> {
  const cfg = await loadConfig(brainDir);
  const entries = Object.entries(cfg.repos);
  if (entries.length === 0) {
    return [`no repos declared — add repos: to ${CONFIG_PATH}`];
  }
  const lines: string[] = [];
  for (const [key, e] of entries) {
    const dir = resolve(brainDir, e.path);
    // MV-141: the clone state MV-132 decides, not a path being there — a plain
    // directory and a repository with no commit both read as present.
    const st = await cloneState(e, dir);
    const word = st.state === 'cloned' ? 'cloned ' : st.state === 'absent' ? 'missing' : 'invalid';
    const url = e.url ? `  (${e.url})` : st.state === 'absent' ? '  — no url, cannot sync' : '';
    const fix = st.state === 'cloned' || st.state === 'absent' ? '' : ` — ${cloneFix(key, e, st)}`;
    // MV-125: read, fetched and verified, never written.
    const why = await readOnly(cfg, key, dir);
    lines.push(`${key.padEnd(12)} ${word}  ${e.path}${url}${fix}${why ? ` — ${why}, read-only` : ''}`);
  }
  return lines;
}

export async function reposSync(
  brainDir: string,
  shallow: boolean,
): Promise<{ lines: string[]; exit: number }> {
  const cfg = await loadConfig(brainDir);
  const entries = Object.entries(cfg.repos);
  if (entries.length === 0) {
    return { lines: [`no repos declared — add repos: to ${CONFIG_PATH}`], exit: 0 };
  }
  const lines: string[] = [];
  let exit = 0;
  // MV-127: a repo that wanted a mount and had no url to make one with. Named
  // once at the end, not once per repo — the missing key is one decision.
  let wantedUrl = false;
  for (const [key, e] of entries) {
    const dest = resolve(brainDir, e.path);
    if (await pathExists(dest)) {
      // Refresh the remote-tracking refs verify reads. Best-effort: a repo with
      // no remote, or a machine offline, still has a usable — if older — ref,
      // and verify's `read` line carries its age. So a failed refresh reports
      // and never gates; only a repo we could not GET at all does that.
      try {
        await execFileP('git', ['-C', dest, 'fetch', '--quiet'], { maxBuffer: 16 * 1024 * 1024 });
        lines.push(`${key}: present at ${e.path} — fetched`);
      } catch (err) {
        const stderr = ((err as { stderr?: string }).stderr ?? String(err)).trim();
        // First `fatal:`, not the last line: git's tail is advice, not cause.
        const last = gitFailure(stderr, 'git fetch failed');
        lines.push(
          `${key}: present at ${e.path} — could not fetch: ${last}; ` +
            `its channel ref stays as last fetched (\`git -C ${e.path} fetch\`)`,
        );
      }
      const m = await mountPass(cfg, key, e, dest);
      if (m.line) lines.push(m.line);
      if (m.wantedUrl) wantedUrl = true;
      if (m.failed) exit = 1;
      continue;
    }
    if (!e.url) {
      lines.push(
        `${key}: missing and no url — add url: under repos.${key} in ${CONFIG_PATH}`,
      );
      continue;
    }
    const args = ['clone', ...(shallow ? ['--depth', '1'] : []), e.url, dest];
    try {
      await execFileP('git', args, { maxBuffer: 16 * 1024 * 1024 });
      // Asked of the clone, not the flag: git ignores `--depth` for a local
      // path, and a full clone is one multivac writes in (MV-125).
      const ro = (await readOnly(cfg, key, dest)) ? ' — read-only: multivac will not write there' : '';
      lines.push(`${key}: cloned ${e.url} -> ${e.path}${shallow ? ' (shallow)' : ''}${ro}`);
      // A read-only clone has just said so on its own line; mountPass would only
      // repeat it. Every other state still reconciles (MV-127).
      if (!ro) {
        const m = await mountPass(cfg, key, e, dest);
        if (m.line) lines.push(m.line);
        if (m.wantedUrl) wantedUrl = true;
        if (m.failed) exit = 1;
      }
    } catch (err) {
      exit = 1;
      const stderr = ((err as { stderr?: string }).stderr ?? String(err)).trim();
      const last = gitFailure(stderr, 'git clone failed');
      lines.push(
        AUTH_RE.test(stderr)
          ? `${key}: auth failed cloning ${e.url} — fix your ssh key/token for this host, then re-run \`multivac repos sync\` (no retry was attempted)`
          : `${key}: clone failed — ${last} → check repos.${key}.url in ${CONFIG_PATH}, then re-run \`multivac repos sync\``,
      );
    }
  }
  if (wantedUrl) {
    lines.push(
      `no brain_url in ${CONFIG_PATH} — multivac will not guess it from a git remote; ` +
        `add the URL other people clone the brain from, then re-run \`multivac repos sync\``,
    );
  }
  return { lines, exit };
}

/**
 * MV-127. Bring one declared repo's brain mount into line with the config, and
 * say what a human still has to do. Called for every declared repo `repos sync`
 * finds on disk, so a repo declared today and a repo declared in August get the
 * same treatment: the pass is a reconciliation, not a step of the clone.
 *
 * The six states, and why each is separate:
 *
 * - **not ours** (MV-125): `managed: false` or shallow. Every branch below
 *   writes in the repo, so this one exits first.
 * - **the brain itself**: there is nothing to mount inside it.
 * - **no gitlink**: add it. git clones when the path is empty and ADOPTS an
 *   existing checkout of the brain without touching the network, which is what
 *   repairs a half-done manual rollout.
 * - **gitlink, empty checkout**: the pin is committed and the working tree is
 *   not there — a fresh clone of the consumer, or a rollout that added the
 *   gitlink and never initialised it. `submodule update --init` is the whole
 *   fix and it is safe to repeat.
 * - **gitlink, checkout with files that is not a brain**: a pin older than the
 *   brain, or one somebody moved. Filling it would overwrite a checkout and
 *   advancing it moves the pin, which is a decision — so it is reported.
 * - **gitlink, checkout present**: nothing to do. Report whether a human still
 *   owes a commit, and whether the recorded url still matches what the config
 *   declares.
 *
 * A url that no longer matches is REPORTED, never rewritten: a consumer may
 * point at a fork or a mirror on purpose, and rewriting it would change what
 * everyone else who clones that repo gets, on multivac's own initiative.
 */
async function mountPass(
  cfg: Config,
  key: string,
  e: RepoEntry,
  dest: string,
): Promise<{ line?: string; wantedUrl?: boolean; failed?: boolean }> {
  if (e.isBrain) return {};
  const why = await readOnly(cfg, key, dest);
  if (why) return { line: `${key}: ${why}, read-only — no mount expected` };

  const mount = cfg.mount;
  const committed = await lsTreeGitlink(dest, mount);
  const staged = committed ? null : await gitlinkInIndex(dest, mount);

  if (!committed && !staged) {
    if (!cfg.brainUrl) return { wantedUrl: true };
    try {
      await submoduleAdd(dest, cfg.brainUrl, mount);
    } catch (err) {
      // lib/git's run() prefixes "git submodule failed in <abs path>: " — the
      // key already names the repo, so quote the cause alone (MV-123).
      const message = (err as Error).message.replace(/^git \S+ failed in .*?: (?=fatal:|error:)/, '');
      return {
        failed: true,
        line: `${key}: could not mount the brain at ${mount} — ${quoteFailure({ message })}`,
      };
    }
    return {
      line:
        `${key}: mounted the brain at ${mount} — staged in ${e.path}, ` +
        `commit it there (multivac does not commit in your repos)`,
    };
  }

  const owed = staged ? ' — staged, commit it in that repo' : '';
  const drift = await urlDrift(cfg, dest, mount);
  const checkout = resolve(dest, mount);
  if (!(await pathExists(resolve(checkout, CONFIG_PATH)))) {
    // Not a brain. EMPTY is safe to fill: nothing is there to lose. A checkout
    // with files in it is a pin that predates the brain, or one somebody moved
    // — `update --init` would check out the recorded commit over it, and
    // `update --remote` moves the pin, which is a decision. Report it.
    const entries = await readdir(checkout).catch(() => [] as string[]);
    if (entries.length > 0) {
      return {
        line:
          `${key}: brain mount at ${mount} is not a multivac brain — its pin predates the brain, ` +
          `or points at the wrong commit; multivac does not move it ` +
          `(git -C ${e.path} submodule update --remote ${mount})${owed}${drift}`,
      };
    }
    try {
      await execFileP('git', ['-C', dest, 'submodule', 'update', '--init', '--', mount], {
        maxBuffer: 16 * 1024 * 1024,
      });
    } catch (err) {
      const stderr = ((err as { stderr?: string }).stderr ?? String(err)).trim();
      return {
        failed: true,
        line:
          `${key}: brain mount at ${mount} is empty and could not be filled — ` +
          `${gitFailure(stderr, 'git submodule update failed')}`,
      };
    }
    return { line: `${key}: filled the empty brain mount at ${mount}${owed}${drift}` };
  }
  return { line: `${key}: brain mounted at ${mount}${owed}${drift}` };
}

/**
 * MV-127. The note a recorded submodule url earns when it is not the one the
 * config declares. Empty when they agree, when nothing is recorded, or when no
 * url is declared to compare against — a comparison with nothing is not drift.
 */
async function urlDrift(cfg: Config, dest: string, mount: string): Promise<string> {
  if (!cfg.brainUrl) return '';
  const recorded = await execFileP('git', [
    '-C', dest, 'config', '-f', '.gitmodules', '--get', `submodule.${mount}.url`,
  ])
    .then(({ stdout }) => stdout.trim())
    .catch(() => '');
  if (!recorded || recorded === cfg.brainUrl) return '';
  return (
    ` — recorded url ${recorded} is not brain_url ${cfg.brainUrl}; ` +
    `multivac does not rewrite it (git submodule set-url ${mount} ${cfg.brainUrl})`
  );
}

/**
 * MV-132. Is every declared repo cloned as declared and, where multivac may
 * write, set up — offline, with no vendor on PATH? One line per root; exit 1
 * when any root fails. The CI recipe is `repos sync --shallow && repos check`:
 * a shallow clone is read-only, so it is checked for its clone alone.
 */
export async function reposCheck(brainDir: string): Promise<{ lines: string[]; exit: number }> {
  const cfg = await loadConfig(brainDir);
  const entries: [string, RepoEntry][] = Object.entries(cfg.repos);
  if (!entries.some(([, e]) => e.isBrain)) entries.unshift(['brain', { path: '.', isBrain: true }]);
  const lines: string[] = [];
  let exit = 0;
  const pad = Math.max(...entries.map(([k]) => k.length), 5);
  for (const [key, e] of entries) {
    const dir = resolve(brainDir, e.path);
    const st = await cloneState(e, dir);
    const head = `${key.padEnd(pad)}  `;
    if (st.state !== 'cloned') {
      exit = 1;
      lines.push(`${head}FAIL ${cloneFix(key, e, st)}`);
      continue;
    }
    const why = await readOnly(cfg, key, dir);
    if (why) {
      lines.push(`${head}ok   cloned — ${why}, read-only: its tools are not checked`);
      continue;
    }
    const facts: string[] = [];
    const fails: string[] = [];
    const sdd = adapterFor(cfg, key, 'sdd');
    const sddS = sdd ? sddSpec(sdd) : null;
    if (sdd && sddS) {
      const s = await initState(sddS, dir);
      if (s.state !== 'installed') fails.push(`${sdd} ${s.state}${s.state === 'missing' ? '' : ` (${s.reason})`} → \`multivac repos sync\``);
      else {
        const inHeadFile = [];
        for (const f of sddS.state.files) if (await inHead(dir, f)) inHeadFile.push(f);
        if (inHeadFile.length === 0) fails.push(`${sdd} installed but ${sddS.state.files.join(' or ')} is not committed → commit it`);
        else facts.push(`${sdd} installed and committed`);
      }
      for (const p of sddS.projectSteps ?? []) {
        const { verdict: v, why } = await projectDocVerdict(dir, p);
        if (v === 'written') facts.push(`${p.artifact} written`);
        // MV-135: a report-only document is a fact, never a failure.
        else if (p.reportOnly) facts.push(`${p.artifact} ${why ?? v} (optional, reported)`);
        else fails.push(`${p.artifact} ${v}${why ? ` (${why})` : ''} → ${p.run}`);
      }
    }
    const grapher = adapterFor(cfg, key, 'grapher');
    const gS = grapher ? grapherSpec(grapher, cfg.graphers) : null;
    if (grapher && gS) {
      const g = await initState(gS, dir);
      const art = gS.artifacts[0];
      if (g.state !== 'installed') fails.push(`${grapher} ${g.state}${g.state === 'missing' ? '' : ` (${g.reason})`} → \`multivac repos sync\``);
      else if (gS.artifactKind === 'local') facts.push(`${grapher} built here (local, never committed)`);
      else if (!(await inHead(dir, art))) fails.push(`${grapher} built but ${art} is not committed → commit it`);
      else facts.push(`${grapher} built and committed`);
    } else if (grapher) {
      facts.push(`${grapher} unverified, not checked`);
    }
    if (fails.length > 0) {
      exit = 1;
      lines.push(`${head}FAIL ${[...fails, ...facts].join(' · ')}`);
    } else {
      lines.push(`${head}ok   cloned${facts.length ? ` · ${facts.join(' · ')}` : ''}`);
    }
  }
  return { lines, exit };
}

/** What repos takes. One declaration: citty parses it, and the subcommand is a positional. */
const ARGS = {
  sub: { type: 'positional', required: false, description: 'list (default), sync or check' },
  shallow: { type: 'boolean', description: 'sync only: --depth 1' },
} satisfies ArgsDef;

export const reposCommand: Command = {
  name: 'repos',
  help: 'list declared repos; `repos sync [--shallow]` clones the missing, fetches the rest; `repos check` verifies them offline',
  usage: [
    'usage: multivac repos [sync [--shallow] | check]',
    '  (no sub)    list every declared repo: present or missing, and its path',
    '  sync        clone the missing ones, fetch the rest so the channel ref is current',
    '  check       offline: every declared repo cloned as declared, its tools set up and committed; exit 1 if not',
    '  --shallow   sync only: --depth 1 — a shallow clone is read-only: multivac will not write there',
    'verify never fetches, so a channel ref is only as current as the last sync.',
  ],
  async run(argv, ctx) {
    // MV-85, before the config is read. `repos` used to answer an unknown FLAG
    // with its unknown-subcommand line, which happened to exit 2 and happened
    // to name it — true by accident of the first positional being whatever you
    // typed. Refusing against the declaration says it on purpose.
    const bad = undeclared('repos', argv, surfaceFrom(ARGS));
    if (bad) {
      warn(bad);
      return 2;
    }
    const a = parseArgs(argv, ARGS);
    const sub = a.sub;
    if (sub === undefined || sub === 'list') {
      for (const l of await reposList(ctx.cwd)) say(l);
      return 0;
    }
    if (sub === 'sync') {
      const { lines, exit } = await reposSync(ctx.cwd, a.shallow === true);
      for (const l of lines) say(l);
      // MV-129: a repo that is cloned, fetched and mounted but has no SDD and
      // no graph is not set up — measured on 0.13.0, sync left a declared
      // sibling with neither and exited 0. Equip every writable repo on disk,
      // and exit 1 if a tool it would run cannot be found; each such repo is
      // named by the line the scaffold or the build prints for it, and every
      // other repo is still equipped.
      const cfg = await loadConfig(ctx.cwd);
      const missing = await missingTools(ctx.cwd, cfg, { sdd: true, grapher: true });
      await equip(ctx.cwd, cfg, false);
      return missing.length > 0 ? 1 : exit;
    }
    if (sub === 'check') {
      try {
        const { lines, exit } = await reposCheck(ctx.cwd);
        for (const l of lines) say(l);
        return exit;
      } catch (e) {
        if (e instanceof ConfigError) {
          warn(e.message);
          return 2;
        }
        throw e;
      }
    }
    say(`unknown subcommand "${sub}" — usage: multivac repos [sync [--shallow] | check]`);
    return 2;
  },
};
