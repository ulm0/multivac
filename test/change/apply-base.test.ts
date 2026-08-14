// `change apply` in a brain that has never been pushed: the base is the newer
// of local main and origin/main (printed, with why), and the change's own
// declaration file rides onto the branch instead of aborting the switch.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { loadChange, saveChange } from '../../src/change/file.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();

const capture = async (fn: () => Promise<number>): Promise<{ code: number; out: string }> => {
  const lines: string[] = [];
  const orig = console.log;
  console.log = (l: string) => lines.push(String(l));
  try {
    return { code: await fn(), out: lines.join('\n') };
  } finally {
    console.log = orig;
  }
};

/** Brain==code scratch repo whose main has an extra commit, plus a stale
 *  `origin/main` ref written by hand (no remote, no network). */
function brainWithStaleRemote(): { brain: string; behind: string; ahead: string } {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-base-')));
  writeFileSync(join(eco.brain, '.multivac/config.yml'), 'doors: [agents]\nrepos:\n  brain: .\n');
  git(eco.brain, 'add', '-A');
  git(eco.brain, 'commit', '-q', '-m', 'brain==code');
  const behind = git(eco.brain, 'rev-parse', 'HEAD');
  git(eco.brain, 'update-ref', 'refs/remotes/origin/main', behind);
  writeFileSync(join(eco.brain, 'notes.md'), '# later\n');
  git(eco.brain, 'add', '-A');
  git(eco.brain, 'commit', '-q', '-m', 'local-only commit');
  return { brain: eco.brain, behind, ahead: git(eco.brain, 'rev-parse', 'HEAD') };
}

async function declare(brain: string, slug: string): Promise<void> {
  const ctx = { cwd: brain };
  assert.equal(await change.run(['new', slug, 'Base check'], ctx), 0);
  const parsed = await loadChange(brain, slug);
  parsed.change.repos = { brain: { status: 'planned' } };
  parsed.change.landing_order = [['brain']];
  await saveChange(brain, parsed);
}

test('local main ahead of origin/main: apply bases on local, and says why', async () => {
  const { brain, ahead } = brainWithStaleRemote();
  await declare(brain, 'base-check');
  const { code, out } = await capture(() => change.run(['apply', 'base-check'], { cwd: brain }));
  assert.equal(code, 0);
  assert.match(out, /branched base-check from main [0-9a-f]{7} — local main is ahead of origin\/main/);
  assert.equal(git(brain, 'rev-parse', 'base-check^{commit}'), ahead);
});

test('origin/main ahead of local main: apply bases on the remote ref', async () => {
  const { brain, behind, ahead } = brainWithStaleRemote();
  git(brain, 'update-ref', 'refs/remotes/origin/main', ahead);
  git(brain, 'reset', '--hard', '-q', behind);
  await declare(brain, 'remote-newer');
  const { code, out } = await capture(() => change.run(['apply', 'remote-newer'], { cwd: brain }));
  assert.equal(code, 0);
  assert.match(out, /from origin\/main [0-9a-f]{7} — origin\/main is ahead of local main/);
  assert.equal(git(brain, 'rev-parse', 'remote-newer^{commit}'), ahead);
});

test('the uncommitted declaration file is carried onto the branch', async () => {
  const { brain } = brainWithStaleRemote();
  // origin/main has no .multivac/changes/ at all: a plain switch would abort on it.
  await declare(brain, 'carry-me');
  const decl = join(brain, '.multivac/changes/carry-me.md');
  const before = readFileSync(decl, 'utf8');
  assert.match(git(brain, 'status', '--porcelain', '-uall'), /\?\? \.multivac\/changes\/carry-me\.md/);

  const { code, out } = await capture(() => change.run(['apply', 'carry-me'], { cwd: brain }));
  assert.equal(code, 0);
  assert.doesNotMatch(out, /would be overwritten/);
  assert.match(out, /carried onto the branch: \.multivac\/changes\/carry-me\.md/);
  assert.equal(git(brain, 'rev-parse', '--abbrev-ref', 'HEAD'), 'carry-me');
  assert.ok(existsSync(decl));
  // same declaration, only the status bumped by apply itself
  assert.equal(before.replace('status: planned', 'status: branched'), readFileSync(decl, 'utf8'));
});

test('other uncommitted work is refused by name with the command, not a raw git error', async () => {
  // the base (origin/main, ahead) carries notes.md; locally it is untracked
  // and different, so git aborts the switch on it
  const { brain, behind, ahead } = brainWithStaleRemote();
  git(brain, 'update-ref', 'refs/remotes/origin/main', ahead);
  git(brain, 'reset', '--hard', '-q', behind);
  writeFileSync(join(brain, 'notes.md'), '# dirty\n');
  await declare(brain, 'blocked');

  const lines: string[] = [];
  const orig = console.error;
  console.error = (l: string) => lines.push(String(l));
  let code: number;
  try {
    code = await change.run(['apply', 'blocked'], { cwd: brain });
  } finally {
    console.error = orig;
  }
  assert.equal(code, 1);
  const msg = lines.join('\n');
  assert.match(msg, /cannot branch blocked — uncommitted work would be overwritten: notes\.md/);
  assert.match(msg, /git -C .* stash push -- notes\.md/);
  assert.match(msg, /multivac change apply blocked/);
  // nothing lost: the dirty file and the declaration are still there
  assert.equal(readFileSync(join(brain, 'notes.md'), 'utf8'), '# dirty\n');
  assert.ok(existsSync(join(brain, '.multivac/changes/blocked.md')));
  assert.equal(git(brain, 'rev-parse', '--abbrev-ref', 'HEAD'), 'main');
});

test('an existing branch is reused, not a failure', async () => {
  const { brain } = brainWithStaleRemote();
  await declare(brain, 'again');
  assert.equal(await change.run(['apply', 'again'], { cwd: brain }), 0);
  git(brain, 'switch', '-q', 'main');
  const { code, out } = await capture(() => change.run(['apply', 'again'], { cwd: brain }));
  assert.equal(code, 0);
  assert.match(out, /branch again already exists — switched to it, reusing/);
  assert.equal(git(brain, 'rev-parse', '--abbrev-ref', 'HEAD'), 'again');
});

test('origin/HEAD names the trunk when it is neither main nor master', async () => {
  const { brain } = brainWithStaleRemote();
  // A repo whose trunk is `trunk`: rename main, and record origin/HEAD the way
  // a clone does. No remote, no network — just the refs git already has.
  git(brain, 'branch', '-m', 'main', 'trunk');
  git(brain, 'update-ref', 'refs/remotes/origin/trunk', git(brain, 'rev-parse', 'trunk'));
  git(brain, 'symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/trunk');
  const trunk = git(brain, 'rev-parse', 'trunk');
  git(brain, 'switch', '-q', '-c', 'someone-elses-change');
  writeFileSync(join(brain, 'theirs.md'), '# not mine\n');
  git(brain, 'add', '-A');
  git(brain, 'commit', '-q', '-m', 'their work');

  await declare(brain, 'mine');
  const { code, out } = await capture(() => change.run(['apply', 'mine'], { cwd: brain }));
  assert.equal(code, 0);
  assert.match(out, /branched mine from trunk [0-9a-f]{7}/);
  assert.equal(git(brain, 'rev-parse', 'mine^{commit}'), trunk);
  // the other change's commit did not come along
  assert.ok(!existsSync(join(brain, 'theirs.md')));
});

test('no default branch at all: the fallback names the branch it is building on', async () => {
  const { brain } = brainWithStaleRemote();
  git(brain, 'update-ref', '-d', 'refs/remotes/origin/main');
  git(brain, 'branch', '-m', 'main', 'trunk');
  git(brain, 'config', 'init.defaultBranch', 'trunk');
  const trunk = git(brain, 'rev-parse', 'trunk');
  await declare(brain, 'no-trunk');
  const found = await capture(() => change.run(['apply', 'no-trunk'], { cwd: brain }));
  assert.match(found.out, /branched no-trunk from trunk [0-9a-f]{7}/);
  assert.equal(git(brain, 'rev-parse', 'no-trunk^{commit}'), trunk);

  // Now hide every hint: nothing offline can say which branch is the trunk,
  // so HEAD is all there is — and the message says whose commits come along.
  git(brain, 'config', '--unset', 'init.defaultBranch');
  git(brain, 'switch', '-q', 'trunk');
  git(brain, 'branch', '-m', 'trunk', 'somebodys-branch');
  await declare(brain, 'last-resort');
  const { code, out } = await capture(() => change.run(['apply', 'last-resort'], { cwd: brain }));
  assert.equal(code, 0);
  assert.match(out, /branching from the checked-out branch somebodys-branch/);
  assert.doesNotMatch(out, /no main or master/);
});
