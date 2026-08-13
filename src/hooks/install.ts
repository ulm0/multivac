// Git hook shims: versioned under .multivac/hooks/, activated by pointing
// core.hooksPath at that directory so the hooks travel with the clone.
// Same mechanism for the brain and every consumer repo.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { chmod, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { onPath, pathExists } from '../adapters/detect.js';

const execFileP = promisify(execFile);

export const HOOKS_DIR = '.multivac/hooks';

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

function shim(args: string): string {
  return [
    '#!/bin/sh',
    '# multivac hook shim — managed by `multivac doors`; regenerate, do not edit.',
    '# Runner order: mvac on PATH, npx --no-install, repo-local build. No runnable',
    '# multivac never blocks a commit: it warns loudly and exits 0.',
    'case $0 in */*) hookdir=${0%/*} ;; *) hookdir=. ;; esac',
    'root=$(CDPATH= cd -- "$hookdir/../.." && pwd) || exit 0',
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

/**
 * Write pre-commit and pre-push shims into <repo>/.multivac/hooks/ and set
 * core.hooksPath. Both run the default policy; pass strictPrePush to gate
 * pushes with --strict.
 */
export async function installHooks(
  repo: string,
  opts: { strictPrePush?: boolean } = {},
): Promise<void> {
  const dir = join(repo, HOOKS_DIR);
  await mkdir(dir, { recursive: true });
  const hooks: Record<string, string> = {
    'pre-commit': shim('verify'),
    'pre-push': shim(opts.strictPrePush ? 'verify --strict' : 'verify'),
  };
  for (const [name, content] of Object.entries(hooks)) {
    const file = join(dir, name);
    await writeFile(file, content);
    await chmod(file, 0o755);
  }
  await execFileP('git', ['-C', repo, 'config', 'core.hooksPath', HOOKS_DIR]);
}
