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

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { access, chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { join } from 'node:path';
import { onPath, pathExists } from '../adapters/detect.js';

const execFileP = promisify(execFile);

export const HOOKS_DIR = '.multivac/hooks';
export const HOOK_NAMES = ['pre-commit', 'pre-push'] as const;
export type HookName = (typeof HOOK_NAMES)[number];

/** Manager artifacts that mean "this repo already has a hook set-up". */
const MANAGER_CONFIGS = ['.pre-commit-config.yaml', 'lefthook.yml'] as const;

export interface HooksReport {
  strategy: 'fresh' | 'chained' | 'alongside';
  /** Repo-relative directory the shims live in. */
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
  if (await onPath('mvac')) return 'mvac on PATH';
  if (
    (await pathExists(join(repo, 'node_modules/multivac/package.json'))) &&
    (await onPath('npx'))
  ) {
    return 'npx --no-install multivac';
  }
  // A built dist/ with no node_modules is not runnable: node exits 1 on the
  // first bare import, and an exit 1 out of a pre-commit hook blocks the
  // commit. "Present" is a file test; "runnable" needs the dependencies too.
  if (
    (await pathExists(join(repo, 'dist/cli.js'))) &&
    (await pathExists(join(repo, 'node_modules'))) &&
    (await onPath('node'))
  ) {
    return 'node dist/cli.js';
  }
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
 *   run time via `git rev-parse --git-dir` (NEVER `--git-path hooks`, which
 *   follows core.hooksPath straight back to this shim — a fork bomb), so
 *   hooks a manager installs later are chained too, and worktrees (where
 *   .git is a file) resolve.
 * - inside a foreign hooksPath dir (`chain` null): root comes from git, not
 *   from $0 arithmetic, because the directory depth is not ours to know.
 */
function shim(args: string, chain: HookName | null): string {
  return [
    '#!/bin/sh',
    '# multivac hook shim — managed by `multivac doors`; regenerate, do not edit.',
    ...(chain
      ? ["# Chains the repo's own .git/hooks hook first; its exit code wins."]
      : []),
    '# Runner order: mvac on PATH, npx --no-install, repo-local build. No runnable',
    '# multivac never blocks a commit: it warns loudly and exits 0.',
    ...(chain
      ? [
          'case $0 in */*) hookdir=${0%/*} ;; *) hookdir=. ;; esac',
          'root=$(CDPATH= cd -- "$hookdir/../.." && pwd) || exit 0',
          `prev=$(git rev-parse --git-dir 2>/dev/null)/hooks/${chain}`,
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
    'if command -v mvac >/dev/null 2>&1; then',
    `  exec mvac ${args}`,
    'fi',
    'if [ -f "$root/node_modules/multivac/package.json" ] && command -v npx >/dev/null 2>&1; then',
    `  exec npx --no-install multivac ${args}`,
    'fi',
    'if [ -f "$root/dist/cli.js" ] && [ -d "$root/node_modules" ] && command -v node >/dev/null 2>&1; then',
    `  exec node "$root/dist/cli.js" ${args}`,
    'fi',
    `echo "multivac: hooks INACTIVE — no runnable multivac, nothing was verified. Fix: ${INACTIVE_FIX}" >&2`,
    'exit 0',
    '',
  ].join('\n');
}

function verifyArgs(name: HookName, strictPrePush: boolean): string {
  return name === 'pre-push' && strictPrePush ? 'verify --strict' : 'verify';
}

async function gitConfig(repo: string, key: string): Promise<string | null> {
  try {
    const { stdout } = await execFileP('git', ['-C', repo, 'config', key]);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

/**
 * The repo's real hooks dir: $GIT_DIR/hooks, resolved through worktrees.
 * NOT `rev-parse --git-path hooks` — that follows core.hooksPath, which
 * after install points at multivac's own shims.
 */
export async function gitHooksDir(repo: string): Promise<string> {
  const { stdout } = await execFileP('git', ['-C', repo, 'rev-parse', '--git-dir']);
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
  await mkdir(join(repo, dir), { recursive: true });
  for (const name of HOOK_NAMES) {
    const file = join(repo, dir, name);
    const existing = await readFile(file, 'utf8').catch(() => null);
    if (existing === null) {
      await writeFile(file, shim(verifyArgs(name, strictPrePush), null));
      await chmod(file, 0o755);
      report.installed.push(name);
    } else if (/\bmvac\b|multivac/.test(existing)) {
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
  const hooksPath = await gitConfig(repo, 'core.hooksPath');
  const managers: string[] = [];
  for (const m of MANAGER_CONFIGS) {
    if (await pathExists(join(repo, m))) managers.push(m);
  }
  if (await pathExists(join(repo, '.husky'))) managers.push('.husky/');

  // A hooksPath the repo set itself is the repo's own gate: install into it.
  if (hooksPath !== null && hooksPath !== HOOKS_DIR) {
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
