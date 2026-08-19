// Git hook shims: versioned under .multivac/hooks/, activated by pointing
// core.hooksPath at that directory so the hooks travel with the clone.
// Same mechanism for the brain and every consumer repo.
//
// A repo multivac did not write often has gates of its own — a pre-commit
// framework in .git/hooks/, a hooksPath already claimed by husky, a
// lefthook.yml waiting to install. Taking core.hooksPath over any of those
// silently disarms the project's real enforcement (measurement 2, blocker 2:
// saleor's ruff/mypy/semgrep gate stopped running and nothing said so).
// So install picks a strategy and reports it:
//
// - fresh:     nothing pre-exists — shims in .multivac/hooks, hooksPath ours.
// - chained:   .git/hooks/<name> (or a manager that installs there:
//              pre-commit, lefthook) pre-exists — same shims, but each one
//              runs the repo's own .git/hooks hook FIRST and preserves its
//              exit code. The chain is resolved at run time, so a manager
//              that installs after us is picked up too.
// - alongside: core.hooksPath already points elsewhere (or .husky/ will claim
//              it on install) — never repoint; write the shim INTO that
//              directory where the name is free, refuse with the exact manual
//              step where it is taken.
//
// Which directory that is gets decided BEFORE the strategy does, by
// resolveHooksPath, because the configured value is git's spelling and not
// ours to assume (MV-79).

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { access, chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { join, resolve } from 'node:path';
import { onPath, pathExists } from '../adapters/detect.js';

const execFileP = promisify(execFile);

export const HOOKS_DIR = '.multivac/hooks';
export const HOOK_NAMES = ['pre-commit', 'pre-push'] as const;
export type HookName = (typeof HOOK_NAMES)[number];

/** Manager artifacts that mean "this repo already has a hook set-up". */
const MANAGER_CONFIGS = ['.pre-commit-config.yaml', 'lefthook.yml'] as const;

export interface HooksReport {
  strategy: 'fresh' | 'chained' | 'alongside';
  /** The directory the shims live in, in the spelling git carries: repo-relative
   *  for ours and for most foreign dirs, absolute where the repo configured it
   *  that way. resolveHooksPath turns it into the path on disk. */
  dir: string;
  /** Hook names written by this call (or already ours). */
  installed: HookName[];
  /** Repo-relative pre-existing hooks the shims exec first (chained only). */
  chained: string[];
  /** Manager configs found (.pre-commit-config.yaml, lefthook.yml, .husky/). */
  managers: string[];
  /** Foreign hooks already running multivac — nothing to do (alongside only). */
  wired: string[];
  /** .pre-commit-config.yaml arming state (fresh/chained only; see PreCommitGate). */
  preCommit: PreCommitGate;
  /** Hooks that could not be installed, with the exact manual step. */
  refused: Array<{ name: HookName; path: string; fix: string }>;
}

/** How the shim would run multivac here, in the shim's own order; null = the
 *  hooks are installed but inactive. Node mirror of the sh below — keep both
 *  sides of this pair in step. */
export async function findRunner(repo: string): Promise<string | null> {
  // MV-92: most specific first. A repo that BUILDS or DECLARES a multivac has
  // stated which one governs it; whatever is on PATH is whatever the machine
  // happens to have, including a laptop a year behind. The order used to be
  // the exact inverse, and the cost was silent: an older global enforcing an
  // older law table against a repo that pinned something else. Measured here —
  // committing in this repository ran a 0.5.0 install against a 0.7.0 brain.
  //
  // A built dist/ with no node_modules is not runnable: node exits 1 on the
  // first bare import, and an exit 1 out of a pre-commit hook blocks the
  // commit. "Present" is a file test; "runnable" needs the dependencies too.
  if (
    (await pathExists(join(repo, 'dist/cli.js'))) &&
    (await pathExists(join(repo, 'node_modules'))) &&
    (await buildsMultivac(repo)) &&
    (await onPath('node'))
  ) {
    return 'node dist/cli.js';
  }
  if (
    (await pathExists(join(repo, 'node_modules/multivac/package.json'))) &&
    (await onPath('npx'))
  ) {
    return 'npx --no-install multivac';
  }
  if (await onPath('mvac')) return 'mvac on PATH';
  return null;
}

/** Fix line printed by the inactive shim and by doctor — one wording. */
export const INACTIVE_FIX =
  'install multivac (npm i -g multivac), or build it here (pnpm install && pnpm run build)';

/** The one line a taken foreign hook needs — refusal and doctor say the same. */
export const MANUAL_CHAIN_LINE = 'mvac verify || exit 1';

/** Fix for a .pre-commit-config.yaml with no pre-commit binary — one wording
 *  for the shim, init and doctor. */
export const PRECOMMIT_MISSING_FIX =
  'install pre-commit (pipx install pre-commit, or brew install pre-commit)';

/**
 * The pre-commit framework's arming state — the shim's fallback logic in
 * Node, so init and doctor report exactly what the shim will do.
 * - null: no .pre-commit-config.yaml.
 * - 'hook': .git/hooks/pre-commit installed — the normal run-time chain.
 * - 'run': hook absent, binary present — the fresh-clone shape
 *   (`pre-commit install` refuses while core.hooksPath is set), so the shim
 *   runs `pre-commit run --hook-stage <stage>` directly.
 * - 'no-binary': hook absent, binary missing — the project's gate cannot run.
 */
export type PreCommitGate = 'hook' | 'run' | 'no-binary' | null;

export async function preCommitGate(
  repo: string,
  chained?: string[],
): Promise<PreCommitGate> {
  if (!(await pathExists(join(repo, '.pre-commit-config.yaml')))) return null;
  const hooks = chained ?? (await chainedHooks(repo));
  if (hooks.includes('.git/hooks/pre-commit')) return 'hook';
  return (await onPath('pre-commit')) ? 'run' : 'no-binary';
}

/**
 * The shim. Two placements, one difference:
 * - in .multivac/hooks (core.hooksPath ours): `chain` names the hook, and the
 *   repo's own .git/hooks/<name> runs first — its exit code wins. Resolved at
 *   run time via `git rev-parse --git-common-dir` (NEVER `--git-path hooks`,
 *   which follows core.hooksPath straight back to this shim — a fork bomb),
 *   so hooks a manager installs later are chained too. The COMMON dir, not
 *   `--git-dir`: hooks/ is not a per-worktree path, so in a linked worktree
 *   `--git-dir` names .git/worktrees/<id>, which has no hooks/ at all — the
 *   probe found nothing and the repo's own gate was skipped, which is the one
 *   thing this shim exists never to do. Measured on git 2.55: the two
 *   spellings are byte-identical outside a worktree, so this is a no-op
 *   there (MV-115).
 * - inside a foreign hooksPath dir (`chain` null): root comes from git, not
 *   from $0 arithmetic, because the directory depth is not ours to know.
 */
/**
 * MV-108. The line every shim multivac writes carries, and the only thing that
 * makes a hook file identifiably OURS. A hook without it belongs to somebody
 * else whatever words it contains; a hook with it says, in its own text, that
 * it is regenerated rather than edited.
 */
export const SHIM_HEADER = '# multivac hook shim — managed by `multivac doors`; regenerate, do not edit.';

/** True when multivac wrote this hook, and may therefore rewrite it. */
export const isOurShim = (text: string): boolean => text.includes(SHIM_HEADER);

/**
 * MV-108. Does this hook RUN multivac, as opposed to mentioning it?
 *
 * It used to be `/\bmvac\b|multivac/` over the whole file, hand-copied into
 * two readers — so `# TODO: wire up multivac` reported the hook as wired and
 * armed `doctor --strict` over a gate that does not exist. The rule is the
 * smallest one that separates a wired hook from a hook that talks about being
 * wired: the mention must be on a line that is not a comment. Deliberately not
 * a shell parser, and deliberately not an exact-line match — people wire it in
 * their own words, and refusing those would teach them to turn the check off.
 */
export function runsMultivac(text: string): boolean {
  return text
    .split('\n')
    .some((l) => !l.trimStart().startsWith('#') && /\bmvac\b|multivac/.test(l));
}

function shim(args: string, chain: HookName | null): string {
  return [
    '#!/bin/sh',
    SHIM_HEADER,
    ...(chain
      ? ["# Chains the repo's own .git/hooks hook first; its exit code wins."]
      : []),
    '# Runner order, most specific first: this repo\'s build, its declared',
    '# dependency, then mvac on PATH. A repo that builds or declares a multivac',
    '# has said which one governs it; PATH is whatever the machine has. No runnable',
    '# multivac never blocks a commit: it warns loudly and exits 0.',
    ...(chain
      ? [
          'case $0 in */*) hookdir=${0%/*} ;; *) hookdir=. ;; esac',
          'root=$(CDPATH= cd -- "$hookdir/../.." && pwd) || exit 0',
          `prev=$(git rev-parse --git-common-dir 2>/dev/null)/hooks/${chain}`,
          'if [ -x "$prev" ]; then',
          '  "$prev" "$@" || exit $?',
          'elif [ -f "$root/.pre-commit-config.yaml" ]; then',
          '  # fresh clone: `pre-commit install` refuses while core.hooksPath is',
          '  # set, so run the config directly — the gate arms in every order.',
          '  if command -v pre-commit >/dev/null 2>&1; then',
          `    pre-commit run --hook-stage ${chain} || exit $?`,
          '  else',
          '    echo "multivac: .pre-commit-config.yaml present but pre-commit is not installed —' +
            ` the project's gate did NOT run. Fix: ${PRECOMMIT_MISSING_FIX}" >&2`,
          '  fi',
          'fi',
        ]
      : ['root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0']),
    '# The build is used only when this repo IS multivac: `dist/cli.js` plus',
    '# node_modules describes most Node CLI repos, and running THEIR binary as',
    '# multivac is the tool executing somebody else\'s program under its own name.',
    'if [ -f "$root/dist/cli.js" ] && [ -d "$root/node_modules" ] && \\',
    '   grep -q \'"name"[[:space:]]*:[[:space:]]*"multivac"\' "$root/package.json" 2>/dev/null && \\',
    '   command -v node >/dev/null 2>&1; then',
    `  exec node "$root/dist/cli.js" ${args}`,
    'fi',
    'if [ -f "$root/node_modules/multivac/package.json" ] && command -v npx >/dev/null 2>&1; then',
    `  exec npx --no-install multivac ${args}`,
    'fi',
    'if command -v mvac >/dev/null 2>&1; then',
    `  exec mvac ${args}`,
    'fi',
    `echo "multivac: hooks INACTIVE — no runnable multivac, nothing was verified. Fix: ${INACTIVE_FIX}" >&2`,
    'exit 0',
    '',
  ].join('\n');
}

function verifyArgs(name: HookName, strictPrePush: boolean): string {
  return name === 'pre-push' && strictPrePush ? 'verify --strict' : 'verify';
}

/**
 * A path-valued git config key, read the way git reads paths: `--path`.
 *
 * Plain `git config <key>` hands back the literal configured text, and a
 * leading `~` or `~user` is a legal spelling git expands to $HOME before it
 * ever looks at the directory. Without `--path` a value of `~/hooks` arrives
 * here as the literal `~/hooks`, resolves against the repo root and
 * lands the shims in a directory literally named `~` inside the checkout —
 * the same concatenation defect as the absolute spelling, one spelling down.
 * `--path` performs exactly git's own expansion (leading `~` only: `a~b`
 * stays `a~b`), and leaves relative and absolute values untouched.
 *
 * Exit non-zero — key unset, or a `~user` git cannot expand, which is a value
 * git itself fatals on for every hook-running command — reads as absent.
 */
async function gitConfigPath(repo: string, key: string): Promise<string | null> {
  try {
    const { stdout } = await execFileP('git', ['-C', repo, 'config', '--path', key]);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

/**
 * `core.hooksPath` as git reads it, and whether it names our own dir.
 *
 * git's rule (githooks(5)): it expands a leading `~`/`~user` to the home
 * directory first, then — because it moves to the root of the working tree
 * before running a hook — reads what is left relative to THERE, and an
 * absolute result is the directory itself. `--path` is the first half of that
 * rule (see gitConfigPath); `resolve` is the second. `join` is neither.
 * `join(repo, '/Users/me/proj/.multivac/hooks')` concatenates, so the shims
 * landed in a tree inside the repo named after the machine's filesystem while
 * the notice printed the absolute path as the place they went, and the commit
 * that followed was not verified. A linked worktree reaches that spelling
 * without anyone choosing it: it inherits the main checkout's value verbatim
 * through the shared config, so an absolute one names the MAIN checkout's hooks
 * dir — a foreign gate it installs alongside into, resolved, never concatenated.
 *
 * `own` is the identity test done on the resolved path, never on the configured
 * text: `.multivac/hooks` and its absolute spelling are the same gate.
 *
 * One computation for install and doctor — like chainedHooks and preCommitGate
 * — so the directory the shims are written into is the directory the report
 * reads them from and the directory git will run (MV-79).
 */
export function resolveHooksPath(
  repo: string,
  configured: string,
): { dir: string; own: boolean } {
  const dir = resolve(repo, configured);
  return { dir, own: dir === resolve(repo, HOOKS_DIR) };
}

/**
 * The repo's real hooks dir: $GIT_COMMON_DIR/hooks. NOT `rev-parse --git-path
 * hooks` — that follows core.hooksPath, which after install points at
 * multivac's own shims. And the COMMON dir rather than `--git-dir`, because
 * git runs hooks from there: hooks/ is not a per-worktree path, so in a linked
 * worktree `--git-dir` names .git/worktrees/<id> and this reported a directory
 * git never reads (MV-115). The two are identical everywhere else.
 */
export async function gitHooksDir(repo: string): Promise<string> {
  // MV-115: the COMMON dir, the same answer the shim asks for. git runs hooks
  // from there — hooks/ is not a per-worktree path — so in a linked worktree
  // `--git-dir` names .git/worktrees/<id> and doctor reported a directory git
  // never reads. Identical to `--git-dir` outside a worktree, measured.
  const { stdout } = await execFileP('git', ['-C', repo, 'rev-parse', '--git-common-dir']);
  const p = stdout.trim();
  return join(p.startsWith('/') ? p : join(repo, p), 'hooks');
}

/**
 * The repo's own .git/hooks hooks our shims would run first — exactly the
 * ones the shim's `[ -x ]` test will pick up. One computation for install
 * and doctor, so they cannot disagree.
 */
export async function chainedHooks(repo: string): Promise<string[]> {
  const dir = await gitHooksDir(repo).catch(() => null);
  if (dir === null) return [];
  const out: string[] = [];
  for (const name of HOOK_NAMES) {
    const ok = await access(join(dir, name), fsConstants.X_OK).then(
      () => true,
      () => false,
    );
    if (ok) out.push(`.git/hooks/${name}`);
  }
  return out;
}

/**
 * Never repoint a hooksPath the repo already claimed: install into it. A free
 * name gets the shim; a taken name that already runs multivac is left alone;
 * a taken name that does not is a refusal carrying the exact line to add.
 *
 * `dir` stays git's reading of the configured value — `git config --path`, so
 * relative and absolute spellings are printed back verbatim and a `~` one is
 * printed expanded, which is where the shims are. Every filesystem path goes
 * through the resolved base.
 */
async function installAlongside(
  repo: string,
  dir: string,
  strictPrePush: boolean,
  managers: string[],
): Promise<HooksReport> {
  const report: HooksReport = {
    strategy: 'alongside',
    dir,
    installed: [],
    chained: [],
    managers,
    wired: [],
    preCommit: null,
    refused: [],
  };
  const base = resolveHooksPath(repo, dir).dir;
  await mkdir(base, { recursive: true });
  for (const name of HOOK_NAMES) {
    const file = join(base, name);
    const existing = await readFile(file, 'utf8').catch(() => null);
    if (existing === null || isOurShim(existing)) {
      // MV-108: ours is regenerated, so `strict_pre_push` and every later shim
      // fix reach a repo that already has one. Recognising it only as
      // "mentions multivac" froze it at whatever version wrote it first.
      await writeFile(file, shim(verifyArgs(name, strictPrePush), null));
      await chmod(file, 0o755);
      report.installed.push(name);
    } else if (runsMultivac(existing)) {
      report.wired.push(`${dir}/${name}`);
    } else {
      report.refused.push({
        name,
        path: `${dir}/${name}`,
        fix: `append this line to ${dir}/${name}: ${MANUAL_CHAIN_LINE}`,
      });
    }
  }
  return report;
}

/**
 * Write pre-commit and pre-push shims and report the strategy used. Only the
 * fresh/chained strategies touch core.hooksPath; alongside never does. Pass
 * strictPrePush to gate pushes with --strict.
 */
export async function installHooks(
  repo: string,
  opts: { strictPrePush?: boolean } = {},
): Promise<HooksReport> {
  const strict = opts.strictPrePush === true;
  const hooksPath = await gitConfigPath(repo, 'core.hooksPath');
  const managers: string[] = [];
  for (const m of MANAGER_CONFIGS) {
    if (await pathExists(join(repo, m))) managers.push(m);
  }
  if (await pathExists(join(repo, '.husky'))) managers.push('.husky/');

  // A hooksPath the repo set itself is the repo's own gate: install into it.
  // "Ours" is decided on the resolved path, so our own dir spelled the long way
  // is not mistaken for somebody else's gate.
  if (hooksPath !== null && !resolveHooksPath(repo, hooksPath).own) {
    return installAlongside(repo, hooksPath, strict, managers);
  }
  // .husky/ with hooksPath still unset: husky's prepare script claims
  // core.hooksPath on install. Taking it now means being disarmed later, so
  // the shim goes where husky will look — .husky/<name> is its hook format.
  if (hooksPath === null && managers.includes('.husky/')) {
    return installAlongside(repo, '.husky', strict, managers);
  }

  // The path is (or becomes) ours. Every shim chains: a pre-existing
  // .git/hooks/<name> — saleor's pre-commit framework gate — runs first and
  // its exit code wins; the chain resolves at run time, so a manager that
  // installs into .git/hooks *after* init is chained too.
  const dir = join(repo, HOOKS_DIR);
  await mkdir(dir, { recursive: true });
  for (const name of HOOK_NAMES) {
    const file = join(dir, name);
    await writeFile(file, shim(verifyArgs(name, strict), name));
    await chmod(file, 0o755);
  }
  const chained = await chainedHooks(repo);
  await execFileP('git', ['-C', repo, 'config', 'core.hooksPath', HOOKS_DIR]);
  return {
    strategy: chained.length > 0 || managers.length > 0 ? 'chained' : 'fresh',
    dir: HOOKS_DIR,
    installed: [...HOOK_NAMES],
    chained,
    managers,
    wired: [],
    preCommit: await preCommitGate(repo, chained),
    refused: [],
  };
}

/**
 * MV-108. Does this repo build multivac itself?
 *
 * The one fact that separates "this repo's build IS the tool" from "this repo
 * builds a CLI": its own package.json says so. Read as text rather than parsed
 * — the shim asks the same question with `grep`, and the two sides of that
 * mirror have to agree (MV-92).
 */
async function buildsMultivac(repo: string): Promise<boolean> {
  const text = await readFile(join(repo, 'package.json'), 'utf8').catch(() => null);
  return text !== null && /"name"\s*:\s*"multivac"/.test(text);
}
