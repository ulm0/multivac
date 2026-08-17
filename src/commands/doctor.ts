// `multivac doctor` — what is declared, what was found, what is degraded,
// how to fix it. Read-only, never mutates, never clones, exit 0 unless the
// config itself is invalid.

import { lstat, readFile, readlink, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { Command, Config } from '../types.js';
import {
  BRAIN_PATHS,
  CONFIG_PATH,
  ConfigError,
  channelRef,
  layoutError,
  loadConfig,
} from '../lib/config.js';
import * as git from '../lib/git.js';
import { say } from '../lib/out.js';
import {
  doorTargets,
  grapherSpec,
  unverifiedGrapher,
  sddNames,
  sddSpec,
  type AdapterSpec,
} from '../adapters/registry.js';
import {
  artifactPresent,
  binaryPresent,
  pathExists,
} from '../adapters/detect.js';
import { flowLines, stepsGating } from '../adapters/sdd.js';
import { readLaw } from '../change/reserve.js';
import {
  HOOKS_DIR,
  INACTIVE_FIX,
  MANUAL_CHAIN_LINE,
  PRECOMMIT_MISSING_FIX,
  chainedHooks,
  findRunner,
  preCommitGate,
  resolveHooksPath,
} from '../hooks/install.js';
import { collectBrainAnchors } from '../anchor/parse.js';
import { excludeGlobs, makeMatcher } from '../lib/glob.js';

const BEGIN = '<!-- multivac:begin -->';
const label = (s: string): string => s.padEnd(11);

function fmtAge(ms: number): string {
  const m = Math.round(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

async function presentRepoDirs(brain: string, cfg: Config): Promise<string[]> {
  const dirs: string[] = [];
  for (const e of Object.values(cfg.repos)) {
    if (e.isBrain) continue; // the brain dir is always searched separately
    const d = resolve(brain, e.path);
    if (await pathExists(d)) dirs.push(d);
  }
  return dirs;
}

/** One door target's state: ok / stale / missing managed block / missing. */
async function doorState(brain: string, name: string): Promise<string> {
  const t = doorTargets[name];
  if (!t) {
    return `${name}: unknown target — known: ${Object.keys(doorTargets).join(', ')}; fix doors: in ${CONFIG_PATH}`;
  }
  // A harness that reads AGENTS.md itself needs no projection: its state is
  // the canonical door's state, and `init` is what writes that.
  const readsCanonical = t.kind === 'canonical' || t.kind === 'native';
  const p = join(brain, t.door);
  const st = await lstat(p).catch(() => null);
  if (!st) {
    const fix = readsCanonical ? 'multivac init .' : 'multivac doors';
    return `${name}: ${t.door} missing → run \`${fix}\``;
  }
  if (t.kind === 'symlink' && st.isSymbolicLink()) {
    const target = await readlink(p).catch(() => '');
    const canonical = doorTargets.agents.door;
    return resolve(dirname(p), target) === join(brain, canonical)
      ? `${name}: ${t.door} ok (symlink)`
      : `${name}: ${t.door} stale — symlink points at ${target}, expected ${canonical} → run \`multivac doors\``;
  }
  // canonical, native, or stub: the tool's content must live in the managed
  // block. A symlink target found as a regular file lands here too.
  const text = await readFile(p, 'utf8').catch(() => '');
  if (!text.includes(BEGIN)) {
    return `${name}: ${t.door} missing managed block → run \`multivac doors\``;
  }
  return `${name}: ${t.door} ok${t.kind === 'native' ? ' (read natively)' : ''}`;
}

/**
 * The project-level document — the constitution, for a tool that has one.
 * Reported here, never judged: whether its CONTENT still fits the product is a
 * judgement no machine can make (MV-57). What a machine CAN say is that the law
 * moved and the constitution did not — exactly the drift this tool hunts — and
 * that it is absent or still a template, which `change plan` refuses over
 * (MV-76). This report's own wording is unchanged by that gate: STALE stays a
 * report here and nowhere refuses.
 */
async function projectDocLines(
  brain: string,
  cfg: Config,
  spec: AdapterSpec,
): Promise<string[]> {
  const steps = spec.projectSteps ?? [];
  if (steps.length === 0) {
    return [
      label('sdd') +
        `${cfg.sdd} project law — this tool has no project-level document; nothing to create, nothing to keep fresh`,
    ];
  }
  // The newest law row is the product's own high-water mark.
  const law = await readLaw(brain);
  const newest = (law?.rows ?? [])
    .map((r) => r.date)
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort()
    .at(-1);
  const roots = [brain, ...(await presentRepoDirs(brain, cfg))];
  const out: string[] = [];
  for (const p of steps) {
    let found: string | null = null;
    for (const root of roots) {
      const path = join(root, p.artifact);
      const st = await stat(path).catch(() => null);
      if (!st) continue;
      // Scaffolded is not written: spec-kit installs the constitution as its
      // own template, so a file full of placeholders is a placeholder, and
      // calling it "present" would be the fakery this report exists to avoid.
      if (p.placeholder) {
        const text = await readFile(path, 'utf8').catch(() => '');
        if (new RegExp(p.placeholder).test(text)) {
          found = `${p.artifact} is still the unfilled template shipped by the tool (placeholders remain) → ${p.run}`;
          break;
        }
      }
      const day = new Date(st.mtimeMs).toISOString().slice(0, 10);
      found =
        newest && newest > day
          ? `${p.artifact} present (last modified ${day}) but the law's newest row is ${newest} — STALE: the law moved while this did not; a report, never a gate`
          : `${p.artifact} present (last modified ${day})${newest ? `, law's newest row ${newest}` : ''} — fresh`;
      break;
    }
    out.push(
      label('sdd') + `${cfg.sdd} project law — ${found ?? `${p.artifact} missing → ${p.run}`}`,
    );
    out.push(label('sdd') + `${cfg.sdd} project law — revisit: ${p.revisit}`);
  }
  return out;
}

async function sddLines(brain: string, cfg: Config): Promise<string[]> {
  if (!cfg.sdd) return []; // not declared: silence
  const spec = sddSpec(cfg.sdd);
  if (!spec) {
    return [
      label('sdd') +
        `${cfg.sdd}: unknown adapter — known: ${sddNames.join(', ')}; fix sdd: in ${CONFIG_PATH}`,
    ];
  }
  let artifact = false;
  for (const d of [brain, ...(await presentRepoDirs(brain, cfg))]) {
    if (await artifactPresent(spec, d)) {
      artifact = true;
      break;
    }
  }
  const binary = await binaryPresent(spec);
  // A declared tool that has never run here is a state worth reporting, and
  // reporting is all doctor may do: the init downloads templates and MV-01
  // keeps this command offline. It names the command; the lifecycle runs it.
  const sc = spec.scaffold;
  const art = artifact
    ? 'artifact ok'
    : `artifact missing (looked for ${spec.artifacts.join(', ')})` +
      (sc
        ? ` — declared but never run here; \`change new\` runs the tool's own \`${sc.run}\`, doctor never does (it reaches the network)`
        : '');
  const bin = binary ? 'binary ok' : `binary missing → ${spec.installHint}`;
  const auto = !cfg.sddAuto
    ? 'sdd_auto: false — the lifecycle prints nothing and gates nothing; run the steps yourself'
    : "sdd_auto on — the lifecycle prints this tool's own steps and refuses to move on without their artifacts";
  const out = [label('sdd') + `${cfg.sdd}: ${art} · ${bin} · ${auto}`];
  // The tool's whole flow, in its own order and length, each step with the
  // artifact that proves it ran — or the reason nothing ever could.
  for (const l of flowLines(spec)) out.push(label('sdd') + `${cfg.sdd} flow — ${l}`);
  // Which lifecycle commands actually refuse, and which cannot for this tool.
  const gates = (['plan', 'apply', 'close'] as const).map((g) => {
    const on = stepsGating(spec, g);
    return on.length > 0
      ? `change ${g}: refuses without ${on.map((s) => s.artifact).join(', ')}`
      : `change ${g}: not gated — this tool declares no step to prove there`;
  });
  out.push(label('sdd') + `${cfg.sdd} gates — ${gates.join(' · ')}`);
  out.push(...(await projectDocLines(brain, cfg, spec)));
  return out;
}

/** Artifact older than the repo's last commit = stale. Best-effort. */
async function graphStale(dir: string, spec: AdapterSpec): Promise<boolean> {
  for (const a of spec.artifacts) {
    const st = await stat(join(dir, a)).catch(() => null);
    if (!st) continue;
    const ct = Number(
      await git.run(dir, ['log', '-1', '--format=%ct']).catch(() => 'NaN'),
    );
    return Number.isFinite(ct) && st.mtimeMs < ct * 1000;
  }
  return false;
}

async function grapherLines(brain: string, cfg: Config): Promise<string[]> {
  const scopes: Array<{ scope: string; dir: string; name?: string }> = [
    { scope: 'brain', dir: brain, name: cfg.grapher },
  ];
  for (const [key, e] of Object.entries(cfg.repos)) {
    if (e.isBrain) continue; // already covered by the brain scope above
    const dir = resolve(brain, e.path);
    if (await pathExists(dir)) {
      scopes.push({ scope: key, dir, name: e.grapher ?? cfg.grapher });
    }
  }
  const out: string[] = [];
  const binCache = new Map<string, boolean>();
  for (const s of scopes) {
    if (!s.name) continue; // not declared for this scope: silence
    const spec = grapherSpec(s.name, cfg.graphers);
    if (spec === null) {
      // Unverified: doctor cannot probe an artifact nobody declared, and it
      // will not invent one to probe. It says exactly what to write instead.
      out.push(label('grapher') + `${s.name} @ ${s.scope}: ${unverifiedGrapher(s.name)}`);
      continue;
    }
    let bin = binCache.get(s.name);
    if (bin === undefined) {
      bin = await binaryPresent(spec);
      binCache.set(s.name, bin);
    }
    const art = await artifactPresent(spec, s.dir);
    let msg = `${s.name} @ ${s.scope}: `;
    if (!art) {
      // Nothing on disk yet: the command that BUILDS the graph, which is not
      // always the one that refreshes it.
      const create = spec.create ?? spec.refresh;
      msg += bin
        ? `artifact missing → run \`${create}\` there`
        : `artifact missing · binary missing → ${spec.installHint}, then \`${create}\``;
    } else if (!bin) {
      msg += `artifact ok · binary missing → ${spec.installHint} (graph cannot refresh)`;
    } else if (await graphStale(s.dir, spec)) {
      msg += `artifact ok · binary ok · graph STALE (older than last commit) → run \`${spec.refresh}\` there`;
    } else {
      msg += 'artifact ok · binary ok · fresh';
    }
    out.push(label('grapher') + msg);
  }
  // Where the refresh actually comes from. The harness post-edit hook is the
  // live path when a declared door target has one; git hooks never refresh.
  if (out.length > 0) {
    const postEdit = cfg.doors.filter((d) => doorTargets[d]?.hookConfig?.postEdit);
    out.push(
      label('grapher') +
        (postEdit.length > 0
          ? `refresh path: ${postEdit.join(', ')} post-edit hook (installed when the binary is present) · ` +
            '`change close` is the net · git hooks never refresh'
          : 'refresh path: `change close` only — no declared harness has a post-edit hook · git hooks never refresh'),
    );
  }
  return out;
}

async function reposLine(brain: string, cfg: Config): Promise<string> {
  const entries = Object.entries(cfg.repos);
  if (entries.length === 0) return `none declared — add repos: to ${CONFIG_PATH}`;
  const missing: string[] = [];
  const notes: string[] = [];
  let present = 0;
  for (const [key, e] of entries) {
    if (e.isBrain) {
      present++;
      notes.push(`${key}: brain==code (this repo)`);
    } else if (await pathExists(resolve(brain, e.path))) {
      present++;
    } else {
      missing.push(
        e.url
          ? `${key} missing → \`multivac repos sync\` (git clone ${e.url} ${e.path})`
          : `${key} missing, no url — add url: under repos.${key} in ${CONFIG_PATH}`,
      );
    }
  }
  return [`${present}/${entries.length} present`, ...notes, ...missing].join(' · ');
}

/**
 * Where each declared repo is parked, and whether that is its channel — the
 * diagnostic that explains a `verify` result at a glance. A brain-scoped
 * verify reads the channel, so a repo parked elsewhere is NOT what produced
 * the verdicts; before MV-53 it was, and the red it caused looked like a lie
 * because nothing in any report mentioned the branch.
 */
async function branchesLine(brain: string, cfg: Config): Promise<string> {
  const entries = Object.entries(cfg.repos);
  if (entries.length === 0) return `none declared — add repos: to ${CONFIG_PATH}`;
  const parts: string[] = [];
  for (const [key, e] of entries) {
    const dir = e.isBrain ? brain : resolve(brain, e.path);
    if (!(await pathExists(dir))) {
      parts.push(`${key}: not cloned`);
      continue;
    }
    const branch = (await git.currentBranch(dir)) ?? 'detached HEAD';
    const head = await git.revParse(dir, 'HEAD');
    const at = `${branch}${head ? ` @ ${head.slice(0, 7)}` : ''}`;
    const channel = channelRef(cfg, e);
    const sha = await git.revParse(dir, channel);
    if (e.isBrain || key === 'brain') {
      // Read as a working tree on purpose — but a brain BEHIND its own channel
      // judges a current ecosystem with an out-of-date law, and that reads as a
      // red nobody can explain. Behind, not merely different: a feature branch
      // is off its channel by construction, and saying so every run is noise.
      const behind =
        sha === null || sha === head
          ? '0'
          : await git.run(dir, ['rev-list', '--count', `HEAD..${sha}`]).catch(() => '0');
      parts.push(
        `${key}: on ${at} — brain==code, verify reads this working tree` +
          (behind === '0'
            ? ''
            : `; ${behind} behind its own channel ${channel} @ ${sha!.slice(0, 7)} → git -C ${e.path} pull`),
      );
      continue;
    }
    if (sha === null) {
      parts.push(
        `${key}: on ${at} — channel ${channel} does not resolve here; verify FALLS BACK to this working tree → git -C ${e.path} fetch`,
      );
    } else if (sha === head) {
      parts.push(`${key}: on ${at} = channel ${channel}`);
    } else {
      parts.push(
        `${key}: on ${at} — OFF channel ${channel} @ ${sha.slice(0, 7)}; verify reads the channel, not this tree`,
      );
    }
  }
  return parts.join(' · ');
}

async function pinsLine(brain: string, cfg: Config): Promise<string> {
  // brain==code entries have nothing to mount: the brain is already here.
  const entries = Object.entries(cfg.repos).filter(([, e]) => !e.isBrain);
  if (entries.length === 0) {
    return Object.keys(cfg.repos).length === 0
      ? 'no repos declared'
      : 'brain==code — no mount to pin';
  }
  const parts: string[] = [];
  for (const [key, e] of entries) {
    const dir = resolve(brain, e.path);
    if (!(await pathExists(dir))) {
      parts.push(`${key}: not cloned`);
      continue;
    }
    const pin = await git.lsTreeGitlink(dir, cfg.mount).catch(() => null);
    if (!pin) {
      parts.push(
        `${key}: no brain mount at ${cfg.mount} — add the brain as a gitlink (git submodule add <brain-url> ${cfg.mount})`,
      );
      continue;
    }
    const channel = e.channel ?? cfg.channel;
    let chName = channel;
    let chSha: string | null = null;
    if (channel) {
      chSha = await git
        .run(brain, ['rev-parse', '--verify', channel])
        .catch(() => null);
    } else {
      const rt = await git.remoteTrackingRef(brain);
      if (rt) ({ name: chName, sha: chSha } = rt);
    }
    if (!chSha) {
      parts.push(
        `${key}: pin ${pin.slice(0, 7)} — no channel ref to compare; set channel: in ${CONFIG_PATH}`,
      );
      continue;
    }
    if (chSha === pin) {
      parts.push(`${key}: pin ok (${chName})`);
      continue;
    }
    const behind = await git
      .run(brain, ['rev-list', '--count', `${pin}..${chSha}`])
      .catch(() => '?');
    const age = await git.lastFetchAge(brain).catch(() => null);
    const fetched = age === null ? 'never fetched' : `last fetch ${fmtAge(age)} ago`;
    parts.push(
      `${key}: pin ${behind} behind ${chName}; ${fetched} → git -C ${e.path} submodule update --remote ${cfg.mount}`,
    );
  }
  return parts.join(' · ');
}

/** Coexistence with a foreign hook dir: multivac wired, refused, or absent.
 *  `armed` is the enforcement floor here: both shims run multivac AND a runner
 *  exists — the same condition `--strict` asserts.
 *
 *  Read through resolveHooksPath, so the shims are looked for where install put
 *  them and where git will run them. `join(brain, dir, shim)` reported both
 *  shims missing from a directory they were sitting in whenever `dir` was
 *  absolute — the spelling a linked worktree inherits verbatim from its main
 *  checkout, which names the main checkout's hooks dir (MV-79). */
async function alongsideParts(
  brain: string,
  dir: string,
): Promise<{ parts: string[]; armed: boolean }> {
  const parts: string[] = [];
  const base = resolveHooksPath(brain, dir).dir;
  let installed = true;
  for (const shim of ['pre-commit', 'pre-push']) {
    const text = await readFile(join(base, shim), 'utf8').catch(() => null);
    if (text === null) {
      installed = false;
      parts.push(`${shim} missing in ${dir} → run \`multivac init .\` to install alongside`);
    } else if (/\bmvac\b|multivac/.test(text)) {
      parts.push(`${shim} runs multivac (${dir}/${shim})`);
    } else {
      installed = false;
      parts.push(
        `WARNING ${dir}/${shim} does not run multivac → append: ${MANUAL_CHAIN_LINE}`,
      );
    }
  }
  const runner = await findRunner(brain);
  if (installed) {
    parts.push(
      runner
        ? `active (${runner})`
        : `INACTIVE — no runnable multivac, the shims verify nothing → ${INACTIVE_FIX}`,
    );
  }
  return { parts, armed: installed && runner !== null };
}

/** The hooks report line, plus whether the enforcement gate is actually armed
 *  — the floor `--strict` asserts. Disarmed ⇒ a commit here is not verified. */
async function hooksLine(brain: string): Promise<{ line: string; armed: boolean }> {
  // `--path`, because that is how git reads it: a leading `~`/`~user` expands
  // to the home directory before anything resolves. Plain `git config` hands
  // back the literal text, so `~/hooks` would resolve against the repo root and
  // doctor would read a directory named `~` inside the checkout (MV-79).
  const hp = await git.run(brain, ['config', '--path', 'core.hooksPath']).catch(() => null);
  // Ours or foreign is decided on the resolved path (MV-79), never on the
  // configured text: `.multivac/hooks` and its absolute spelling are one gate.
  const ours = hp !== null && resolveHooksPath(brain, hp).own;
  // A hooksPath the repo set itself is its own gate: multivac coexists there,
  // it never repoints — advising `git config core.hooksPath` here would be
  // advising the user to disarm their own enforcement.
  if (hp !== null && !ours) {
    const { parts, armed } = await alongsideParts(brain, hp);
    return {
      line: [
        `core.hooksPath is ${hp} (this repo's own gate — multivac installs alongside, never repoints)`,
        ...parts,
      ].join(' · '),
      armed,
    };
  }
  if (hp === null && (await pathExists(join(brain, '.husky')))) {
    const { parts, armed } = await alongsideParts(brain, '.husky');
    return {
      line: [
        'core.hooksPath unset, .husky/ present (husky claims it on install — multivac installs alongside, never repoints)',
        ...parts,
      ].join(' · '),
      armed,
    };
  }
  const parts: string[] = [
    ours
      ? 'core.hooksPath ok'
      : `core.hooksPath unset → git config core.hooksPath ${HOOKS_DIR}`,
  ];
  let installed = true;
  const chained = await chainedHooks(brain);
  for (const shim of ['pre-commit', 'pre-push']) {
    const present = await pathExists(join(brain, HOOKS_DIR, shim));
    installed &&= present;
    parts.push(
      present
        ? `${shim} installed`
        : `${shim} missing → run \`multivac init .\` to rewrite the shims`,
    );
    // The repo's own .git/hooks hook still runs: the shim chains it first.
    if (present && chained.includes(`.git/hooks/${shim}`)) {
      parts.push(`${shim} chains .git/hooks/${shim} (runs first, its exit code wins)`);
    }
  }
  // .pre-commit-config.yaml with no installed hook — the fresh-clone shape:
  // `pre-commit install` refuses while core.hooksPath is set, so the shim
  // arms the gate itself, or cannot when the binary is missing.
  const gate = await preCommitGate(brain, chained);
  if (gate === 'run') {
    parts.push(
      '.pre-commit-config.yaml with no .git/hooks/pre-commit — the shim runs `pre-commit run --hook-stage <stage>` directly (`pre-commit install` refuses while core.hooksPath is set)',
    );
  } else if (gate === 'no-binary') {
    parts.push(
      "WARNING .pre-commit-config.yaml present, no .git/hooks/pre-commit and no pre-commit binary — the project's gate cannot run → " +
        PRECOMMIT_MISSING_FIX,
    );
  }
  // Installed is not enforcing: the shim exits 0 when nothing can run it.
  const runner = await findRunner(brain);
  if (installed) {
    parts.push(
      runner
        ? `active (${runner})`
        : `INACTIVE — no runnable multivac, the shims verify nothing → ${INACTIVE_FIX}`,
    );
  }
  // Armed only when core.hooksPath is ours (unset ⇒ git never runs the shims —
  // measurement 3's exact disarm), both shims are present, and something can
  // run them. Any one missing and a commit here goes unverified.
  return { line: parts.join(' · '), armed: ours && installed && runner !== null };
}

/** Config file at a repo root: tsconfig*, package*, *.config.*, .*rc[.ext]. */
const ROOT_CONFIG = /^(tsconfig.*|package.*|.+\.config\..+|\.[^.]+rc(\..+)?)$/;

/** Scripts of a repo's package.json as one blob. Absent or broken = "". */
async function scriptText(dir: string): Promise<string> {
  try {
    const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    return Object.values(pkg.scripts ?? {}).join('\n');
  } catch {
    return '';
  }
}

/** Why an untracked file looks build-critical, or null. */
function buildCritical(
  file: string,
  scripts: string,
  anchored: (f: string) => boolean,
): string | null {
  if (!file.includes('/') && ROOT_CONFIG.test(file)) return 'root config';
  // ponytail: substring, not a shell parse — catches `tsc -p tsconfig.test.json`
  // and misses paths a script builds by concatenation. Upgrade when that bites.
  if (file && scripts.includes(file)) return 'package.json script';
  if (anchored(file)) return 'anchor glob';
  return null;
}

/**
 * Untracked-but-needed. A file that was never `git add`ed is invisible to
 * everything reading the tree through `git ls-files` — verify included — so a
 * repo can build here and fail on a fresh checkout. Name the untracked,
 * non-ignored files that look build-critical. Warning only: doctor diagnoses.
 *
 * Worse than untracked is *ignored*: a `.gitignore` that swallows a brain
 * path (saleor's opens with `.*`) means the law can never ship, while
 * `git add` stays silent and every command stays green. That is a WARNING
 * with the fix, ahead of the untracked report.
 */
async function untrackedLine(brain: string, cfg: Config): Promise<string> {
  const ignored = await git.ignoredPaths(brain, BRAIN_PATHS).catch(() => []);
  const ignoredWarning =
    ignored.length === 0
      ? null
      : `WARNING ${ignored.length} brain path${ignored.length === 1 ? '' : 's'} ` +
        `IGNORED by .gitignore — ${ignored.join(', ')} — the law cannot ship; ` +
        'fix: run `multivac init .` (appends !.multivac/ negations to .gitignore)';
  const anchors = await collectBrainAnchors(brain).then(
    (r) => r.anchors,
    () => [],
  );
  const brainKeys = ['brain', '*'];
  const scopes = [{ name: 'brain', dir: brain, keys: brainKeys }];
  for (const [key, e] of Object.entries(cfg.repos)) {
    if (e.isBrain) {
      brainKeys.push(key); // an alias for this same tree
      continue;
    }
    const dir = resolve(brain, e.path);
    if (await pathExists(dir)) scopes.push({ name: key, dir, keys: [key, '*'] });
  }
  const flagged: string[] = [];
  for (const s of scopes) {
    const files = await git.untrackedFiles(s.dir).catch(() => []);
    if (files.length === 0) continue;
    const scripts = await scriptText(s.dir);
    const matchers = anchors
      .filter((a) => s.keys.includes(a.repoKey))
      .map((a) => makeMatcher(a.include, excludeGlobs(a.excludes, s.keys)));
    for (const f of files) {
      const why = buildCritical(f, scripts, (x) => matchers.some((m) => m(x)));
      if (why) flagged.push(`${f} (${s.name}, ${why})`);
    }
  }
  const untracked =
    flagged.length === 0
      ? 'nothing build-critical untracked'
      : `WARNING ${flagged.length} build-critical file${flagged.length === 1 ? '' : 's'} ` +
        `untracked — git add or ignore: ${flagged.slice(0, 8).join(', ')}` +
        (flagged.length > 8 ? ` · +${flagged.length - 8} more` : '');
  return ignoredWarning === null ? untracked : `${ignoredWarning} · ${untracked}`;
}

/**
 * Build the full report. Bare `doctor` exits 1 only when the config/law is
 * invalid. Under `strict`, a disarmed enforcement gate is also exit 1: the
 * assertion that the floor is actually armed, not merely described.
 */
export async function doctorReport(
  brainDir: string,
  strict = false,
): Promise<{ lines: string[]; exit: number }> {
  const stale = await layoutError(brainDir);
  if (stale) return { lines: [label('layout') + stale], exit: 1 };
  let cfg: Config;
  try {
    cfg = await loadConfig(brainDir);
  } catch (e) {
    if (e instanceof ConfigError) {
      return { lines: [label('config') + `invalid — ${e.message}`], exit: 1 };
    }
    throw e;
  }
  const doorParts: string[] = [];
  for (const name of cfg.doors) doorParts.push(await doorState(brainDir, name));
  const hooks = await hooksLine(brainDir);
  const lines: string[] = [
    label('doors') +
      (doorParts.join(' · ') ||
        `none declared — add doors: [agents] to ${CONFIG_PATH}`),
    ...(await sddLines(brainDir, cfg)),
    ...(await grapherLines(brainDir, cfg)),
    label('repos') + (await reposLine(brainDir, cfg)),
    label('branches') + (await branchesLine(brainDir, cfg)),
    label('pins') + (await pinsLine(brainDir, cfg)),
    label('hooks') + hooks.line,
    label('untracked') + (await untrackedLine(brainDir, cfg)),
  ];
  // The one strict-only exit: a report that exits 0 while nothing is enforced
  // is the lie measurement 3 caught. `--strict` refuses to be that report.
  if (strict && !hooks.armed) {
    lines.push(
      label('strict') +
        'FAIL — the enforcement gate is not armed; a commit here is not verified (see hooks above)',
    );
    return { lines, exit: 1 };
  }
  return { lines, exit: 0 };
}

export const doctorCommand: Command = {
  name: 'doctor',
  help: 'what is declared, what was found, what is degraded, how to fix it',
  usage: [
    'usage: multivac doctor [--strict]',
    'reports what is declared, found, degraded, and how to fix it.',
    'exit 0 even when degraded; exit 1 only when the config/law is invalid.',
    '--strict also exits 1 when the enforcement gate is disarmed — the shim',
    "  missing, core.hooksPath not multivac's with no shim chained, or no",
    '  runnable multivac — so `mvac doctor --strict` is an assertion',
    '  that the gate is armed, not just a report that describes it.',
  ],
  async run(argv, ctx) {
    const strict = argv.includes('--strict');
    const { lines, exit } = await doctorReport(ctx.cwd, strict);
    for (const l of lines) say(l);
    return exit;
  },
};
