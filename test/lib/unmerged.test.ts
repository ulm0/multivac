// A tree mid-merge counted every match three times.
//
// git keeps three index entries for a conflicted path — base, ours, theirs —
// and `ls-files` prints one line per stage. So a `count=2` leg reported
// `found 6` and advised "revert the new occurrence, or ratchet to count=6":
// advice that, followed, writes a corrupted number into the law over a merge
// that has nothing to do with the claim. A miscount arriving with confident
// advice is worse than a crash.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gitInit } from '../helpers/fixture.js';
import { lsFiles, unmergedFiles } from '../../src/lib/git.js';

const git = (dir: string, ...args: string[]): string =>
  execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' });

/** A repo parked on an unresolved conflict in one file. */
function conflicted(): string {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-conflict-'));
  gitInit(dir);
  git(dir, 'config', 'user.email', 'test@invalid');
  git(dir, 'config', 'user.name', 'mvac-test');
  writeFileSync(join(dir, 'page.md'), 'grid\ngrid\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-qm', 'base');

  git(dir, 'checkout', '-q', '-b', 'other');
  writeFileSync(join(dir, 'page.md'), 'grid\ngrid\ntheirs\n');
  git(dir, 'commit', '-qam', 'theirs');

  git(dir, 'checkout', '-q', 'main');
  writeFileSync(join(dir, 'page.md'), 'grid\ngrid\nours\n');
  git(dir, 'commit', '-qam', 'ours');

  try {
    git(dir, 'merge', 'other');
  } catch {
    /* the conflict is the point */
  }
  return dir;
}

test('a conflicted file is listed once, not once per merge stage', async () => {
  const dir = conflicted();
  // git itself reports three, which is what the old code passed straight on.
  assert.equal(git(dir, 'ls-files', '-u').trim().split('\n').length, 3);
  assert.deepEqual(await lsFiles(dir), ['page.md']);
});

test('the mid-merge state is reported, not silently judged', async () => {
  const dir = conflicted();
  assert.deepEqual(await unmergedFiles(dir), ['page.md']);
});

test('a clean tree has nothing unmerged and lists each file once', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-clean-'));
  gitInit(dir);
  git(dir, 'config', 'user.email', 'test@invalid');
  git(dir, 'config', 'user.name', 'mvac-test');
  writeFileSync(join(dir, 'a.md'), 'x\n');
  writeFileSync(join(dir, 'b.md'), 'x\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-qm', 'clean');
  assert.deepEqual((await lsFiles(dir)).sort(), ['a.md', 'b.md']);
  assert.deepEqual(await unmergedFiles(dir), []);
});
