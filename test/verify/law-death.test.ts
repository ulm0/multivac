// MV-106 and MV-107, the two halves of "the gate reads the commit it gates".
//
// MV-106 can only be measured through a REAL commit. The defect lives in the
// environment git hands a hook — `GIT_INDEX_FILE` pointing at a temporary
// index for `git commit -a` and for a pathspec commit — so a test that calls
// verify directly would pass while the defect survived untouched. Measured on
// git 2.55: `GIT_DIR` is not set for hooks at all, only `GIT_INDEX_FILE`, with
// the cwd at the toplevel.
//
// MV-107 is the asymmetry: a row's birth is gated (MV-81) and the config's
// death is gated (MV-97), and deleting the law was the one edit nothing looked
// at. `git rm .multivac/invariants.md` printed `0 claims · 0 anchored`, exit 0.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { appendFileSync, chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { verify } from '../../src/commands/verify.js';
import { run as gitRun } from '../../src/lib/git.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const capture = async (fn: () => Promise<number>): Promise<{ code: number; out: string }> => {
  const lines: string[] = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (l: string) => lines.push(String(l));
  console.error = (l: string) => lines.push(String(l));
  try {
    return { code: await fn(), out: lines.join('\n') };
  } finally {
    console.log = origLog;
    console.error = origErr;
  }
};

const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();

const ROW = '| MV-77 | a rule that is law. | specified | active | 2026-08-18 | [DESIGN.md](../DESIGN.md) |';
const PROPOSED = '| MV-78 | RESERVED. | open | proposed | 2026-08-18 | [DESIGN.md](../DESIGN.md) |';

/** A committed brain carrying one active row and one proposed row. */
function brainWithLaw(): string {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-lawdeath-'));
  const e = makeScratchEcosystem(tmp);
  writeFileSync(join(e.brain, '.multivac/config.yml'), 'doors: [agents]\nrepos:\n  brain: .\n');
  appendFileSync(join(e.brain, '.multivac/invariants.md'), `${ROW}\n${PROPOSED}\n`);
  git(e.brain, 'add', '-A');
  git(e.brain, 'commit', '-q', '-m', 'law');
  return e.brain;
}

const dropLine = (brain: string, line: string): void => {
  const p = join(brain, '.multivac/invariants.md');
  writeFileSync(p, readFileSync(p, 'utf8').replace(`${line}\n`, ''));
};

test('a row that was active and is gone refuses the commit — MV-107', async () => {
  const brain = brainWithLaw();
  dropLine(brain, ROW);
  git(brain, 'add', '-A');

  const c = await capture(() => verify.run([brain], { cwd: brain }));

  assert.equal(c.code, 1, c.out);
  assert.match(c.out, /MV-77 was active and is gone/);
  assert.match(c.out, /RETIRED/, 'the refusal does not name the way out');
});

test('removing the law file refuses the commit, worded for the file — MV-107', async () => {
  const brain = brainWithLaw();
  git(brain, 'rm', '-q', '.multivac/invariants.md');

  const c = await capture(() => verify.run([brain], { cwd: brain }));

  assert.equal(c.code, 1, c.out);
  assert.match(c.out, /invariants\.md is removed by this commit/);
  assert.match(c.out, /a brain with no law verifies nothing/);
});

test('retiring a row is allowed, and dropping a reservation is too — MV-107', async () => {
  const brain = brainWithLaw();
  const p = join(brain, '.multivac/invariants.md');
  writeFileSync(p, readFileSync(p, 'utf8').replace('| specified | active |', '| specified | retired |'));
  dropLine(brain, PROPOSED);
  git(brain, 'add', '-A');

  const c = await capture(() => verify.run([brain], { cwd: brain }));

  assert.doesNotMatch(c.out, /was active and is gone/, 'retirement was refused');
  assert.doesNotMatch(c.out, /MV-78/, 'giving a reservation back was refused');
});

test('git commit -a is gated, not walked past — MV-106', async () => {
  // The bypass, exactly: the edit is NOT staged, so the index on disk does not
  // carry it. `-a` composes the commit in `.git/index.lock`, which only the
  // hook's environment names.
  const brain = brainWithLaw();
  mkdirSync(join(brain, 'hooks'), { recursive: true });
  const hook = join(brain, 'hooks/pre-commit');
  writeFileSync(hook, `#!/bin/sh\nexec node ${JSON.stringify(join(process.cwd(), 'dist/cli.js'))} verify\n`);
  chmodSync(hook, 0o755);
  git(brain, 'config', 'core.hooksPath', 'hooks');
  const before = git(brain, 'rev-parse', 'HEAD');

  dropLine(brain, ROW);
  let refused = false;
  try {
    execFileSync('git', ['-C', brain, 'commit', '-qam', 'delete a row with -a'], { stdio: 'pipe' });
  } catch {
    refused = true;
  }

  assert.ok(refused, 'the commit was not refused');
  assert.equal(git(brain, 'rev-parse', 'HEAD'), before, 'HEAD moved: the commit landed');
});

test('a pathspec commit is judged on the paths it contains — MV-106', async () => {
  // The other direction: the index on disk holds MORE than the commit does, so
  // reading it can refuse a commit over a path that is not in it.
  const brain = brainWithLaw();
  mkdirSync(join(brain, 'hooks'), { recursive: true });
  const hook = join(brain, 'hooks/pre-commit');
  writeFileSync(hook, `#!/bin/sh\nexec node ${JSON.stringify(join(process.cwd(), 'dist/cli.js'))} verify\n`);
  chmodSync(hook, 0o755);
  git(brain, 'config', 'core.hooksPath', 'hooks');

  writeFileSync(join(brain, 'one.txt'), 'a\n');
  dropLine(brain, ROW); // staged, but NOT part of the commit below
  git(brain, 'add', 'one.txt', '.multivac/invariants.md');

  execFileSync('git', ['-C', brain, 'commit', '-qm', 'only one.txt', '--', 'one.txt'], { stdio: 'pipe' });

  assert.equal(git(brain, 'show', '--name-only', '--format=', 'HEAD'), 'one.txt');
});

test("a sibling repo is still read through its own index — MV-106's other half", async () => {
  // The reason the ambient pointers are dropped at all: a hook committing in
  // one repo must not read another through that repo's index. This change
  // narrows the drop, so the narrowing is what needs pinning — an ambient
  // index belonging to A must not reach a read about B.
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-ambient-'));
  const e = makeScratchEcosystem(tmp);
  const other = e.repos.api;
  writeFileSync(join(other, 'staged-in-api.txt'), 'x\n');
  git(other, 'add', 'staged-in-api.txt');

  const saved = process.env.GIT_INDEX_FILE;
  process.env.GIT_INDEX_FILE = join(other, '.git/index');
  try {
    // Asked about the BRAIN while the ambient index is api's: api's staged
    // path must not appear, because the index does not belong to the brain.
    const staged = await gitRun(e.brain, ['diff', '--cached', '--name-only'], true);
    assert.doesNotMatch(staged, /staged-in-api/, "the brain was read through api's index");
    // And asked about api itself, the ambient index IS the right one.
    const own = await gitRun(other, ['diff', '--cached', '--name-only'], true);
    assert.match(own, /staged-in-api/, "api was not read through its own index");
  } finally {
    if (saved === undefined) delete process.env.GIT_INDEX_FILE;
    else process.env.GIT_INDEX_FILE = saved;
  }
});
