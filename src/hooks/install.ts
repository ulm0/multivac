// Git hook shims: versioned under .multivac/hooks/, activated by pointing
// core.hooksPath at that directory so the hooks travel with the clone.
// Same mechanism for the brain and every consumer repo.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { chmod, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const execFileP = promisify(execFile);

export const HOOKS_DIR = '.multivac/hooks';

function shim(args: string): string {
  return [
    '#!/bin/sh',
    '# multivac hook shim — managed by `multivac doors`; regenerate, do not edit.',
    '# Missing mvac never blocks a commit: enforcement degrades, it does not lock out.',
    'command -v mvac >/dev/null 2>&1 || exit 0',
    `exec mvac ${args}`,
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
