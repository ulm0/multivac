// MV-97: modifying the declared config needs an open change.
//
// The config decides which repos exist, which adapters bind and which gates
// run — every one as load-bearing as a law row, and all editable in a commit
// with no explanation and nobody noticing. Creating one is free: a brain has to
// start somewhere, and exactly one code path writes this file, so the rule can
// read what the commit DOES rather than who claims to have done it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gitInit, initRepo, makeScratchEcosystem } from '../helpers/fixture.js';
import { verify } from '../../src/commands/verify.js';
import { change } from '../../src/commands/change.js';

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

/** A committed brain whose config is already in HEAD. */
function committedBrain(): string {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-cfggate-'));
  const e = makeScratchEcosystem(tmp);
  writeFileSync(
    join(e.brain, '.multivac/config.yml'),
    'doors: [agents]\nrepos:\n  brain: .\n',
  );
  git(e.brain, 'add', '-A');
  git(e.brain, 'commit', '-q', '-m', 'config');
  return e.brain;
}

test('a modified config with no change open is refused, naming both ways forward', async () => {
  const brain = committedBrain();
  appendFileSync(join(brain, '.multivac/config.yml'), '# a quiet edit\n');
  git(brain, 'add', '.multivac/config.yml');
  const c = await capture(() => verify.run([brain], { cwd: brain }));
  assert.equal(c.code, 1);
  assert.match(c.out, /\.multivac\/config\.yml is modified and no change is open/);
  assert.match(c.out, /it decides which repos are verified and which gates run/);
  assert.match(c.out, /open one first \(`multivac change new "<title>"`\), or drop the edit/);
});

test('an open change allows it — including one opened for this very edit', async () => {
  const brain = committedBrain();
  const ctx = { cwd: brain };
  // A change opened a moment ago declares no claim yet. Reading the pendency
  // map instead of the directory would have missed exactly this, which is the
  // common case and would have made the rule unusable.
  await capture(() => change.run(['new', 'declare-web', 'Declare web'], ctx));
  appendFileSync(join(brain, '.multivac/config.yml'), '# now declared\n');
  git(brain, 'add', '.multivac/config.yml');
  const c = await capture(() => verify.run([brain], ctx));
  assert.equal(c.code, 0);
  assert.match(c.out, /config\.yml is modified, declared by open change declare-web/);
});

test('a commit that does not touch the config says nothing about it', async () => {
  const brain = committedBrain();
  writeFileSync(join(brain, 'notes.md'), '# notes\n');
  git(brain, 'add', 'notes.md');
  const c = await capture(() => verify.run([brain], { cwd: brain }));
  assert.equal(c.out.includes('config.yml is modified'), false);
  assert.equal(c.out.includes('is new here'), false);
});

test('creating a config is free — a brain has to start somewhere', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-cfgnew-'));
  const brain = join(tmp, 'fresh');
  initRepo(brain, {
    'README.md': '# fresh\n',
    '.multivac/invariants.md': '# Invariants\n',
  });
  writeFileSync(join(brain, '.multivac/config.yml'), 'doors: [agents]\nrepos:\n  brain: .\n');
  git(brain, 'add', '-A');
  const c = await capture(() => verify.run([brain], { cwd: brain }));
  assert.equal(c.code, 0);
  assert.match(c.out, /config\.yml is new here — creating one is free/);
});

test('a repo with no previous commit is never refused', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-cfgvirgin-'));
  const brain = join(tmp, 'virgin');
  // No commit at all. MV-24: the shared fixture is the only place that
  // initialises a repo, so `gitInit` is used and nothing is committed after it.
  mkdirSync(join(brain, '.multivac'), { recursive: true });
  gitInit(brain);
  writeFileSync(join(brain, '.multivac/invariants.md'), '# Invariants\n');
  writeFileSync(join(brain, '.multivac/config.yml'), 'doors: [agents]\nrepos:\n  brain: .\n');
  git(brain, 'add', '-A');
  const c = await capture(() => verify.run([brain], { cwd: brain }));
  assert.equal(c.code, 0);
});
