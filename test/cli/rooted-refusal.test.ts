// MV-151. Every command's refusal for a missing `.multivac/config.yml` names the
// brain whose checkout holds the directory. From a brain's `src`, `change new`,
// `repos sync` and `doors` all advised `multivac init .` — which would
// git-init a second brain inside the first. The walk runs no git and stops at
// the first `.git`, so a checkout root with no brain keeps today's advice.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initRepo } from '../helpers/fixture.js';
import { main } from '../../src/cli.js';

async function run(argv: string[], cwd: string): Promise<{ code: number; out: string }> {
  const lines: string[] = [];
  const orig = { log: console.log, error: console.error };
  console.log = console.error = (...a: unknown[]) => {
    lines.push(a.map(String).join(' '));
  };
  try {
    const code = await main(argv, cwd);
    return { code, out: lines.join('\n').replace(/\x1b\[[0-9;]*m/g, '') };
  } finally {
    console.log = orig.log;
    console.error = orig.error;
  }
}

const COMMANDS = [
  ['change', 'new', 'x', 'x'],
  ['repos', 'sync'],
];

test('a command refused below a brain names that brain — MV-151', async () => {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-refusal-')));
  const brain = join(tmp, 'b');
  initRepo(brain, {
    '.multivac/config.yml': 'doors: [agents]\nrepos:\n  brain: .\n',
    '.multivac/invariants.md': '# Invariants\n',
    '.multivac/.gitignore': 'worktrees/\n',
    'src/app.ts': 'export const app = 1;\n',
  });
  const wt = join(brain, '.multivac/worktrees/demo/brain');
  execFileSync('git', ['-C', brain, 'worktree', 'add', '-q', '-b', 'demo', wt], { stdio: 'ignore' });
  for (const [holder, dir] of [
    [brain, join(brain, 'src')],
    [wt, join(wt, 'src')],
  ]) {
    for (const argv of COMMANDS) {
      const r = await run(argv, dir);
      assert.equal(r.code, 2, `${argv.join(' ')}: ${r.out}`);
      assert.equal(r.out, `no .multivac/config.yml in ${dir} — it is inside the brain at ${holder}; run this there`);
      assert.doesNotMatch(r.out, /multivac init/);
    }
  }
  // A checkout root with no brain, and a directory in no repository: today's text.
  const plain = join(tmp, 'plain');
  initRepo(plain, { 'a.txt': 'a\n' });
  const loose = join(tmp, 'loose');
  mkdirSync(loose);
  for (const dir of [plain, loose]) {
    for (const argv of COMMANDS) {
      const r = await run(argv, dir);
      assert.equal(r.code, 2, `${argv.join(' ')}: ${r.out}`);
      assert.equal(r.out, `no .multivac/config.yml in ${dir} — run \`multivac init .\` to create it`);
    }
  }
});
