// MV-116. A heal never crosses the include's own file kind, and a symlink is
// not file text.
//
// The heal path is the ONE code path that rewrites the law file, and it was
// fenced only against `.multivac/` — so `site/`, `docs/` and `specs/`, every
// one of them prose that quotes patterns, were legal targets. Healing onto
// prose retargets law at text that merely describes it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { lsFiles, lsTree } from '../../src/lib/git.js';
import { gitInit } from '../helpers/fixture.js';

const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-C', cwd, ...args], {
    encoding: 'utf8',
    env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' },
  }).trim();

test('a tracked symlink is listed by neither reader — MV-116', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-symlink-'));
  gitInit(dir);
  writeFileSync(join(dir, 'real.md'), 'the pattern lives here\n');
  symlinkSync('real.md', join(dir, 'link.md'));
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'a file and a link to it');

  return Promise.all([lsFiles(dir), lsTree(dir, 'HEAD')]).then(([work, ref]) => {
    // A working-tree read follows the link and sees the target's content; a
    // ref read sees the link TEXT. One leg, two verdicts — so neither lists it.
    assert.equal(work.includes('link.md'), false, 'the working-tree reader listed a symlink');
    assert.equal(ref.includes('link.md'), false, 'the ref reader listed a symlink');
    assert.equal(work.includes('real.md'), true, 'the real file went missing');
    assert.equal(ref.includes('real.md'), true, 'the real file went missing at the ref');
    assert.deepEqual(work.sort(), ref.sort(), 'the two readers disagree about what is there');
  });
});

test('a path at several merge stages is still listed once — MV-71 kept', () => {
  // `--deduplicate` gave way to a stage-aware parse; the Set is what keeps the
  // guarantee. Three index stages for one conflicted path must collapse.
  const dir = mkdtempSync(join(tmpdir(), 'mvac-merge-'));
  gitInit(dir);
  writeFileSync(join(dir, 'f.txt'), 'base\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'base');
  git(dir, 'checkout', '-q', '-b', 'side');
  writeFileSync(join(dir, 'f.txt'), 'theirs\n');
  git(dir, 'commit', '-q', '-am', 'theirs');
  git(dir, 'checkout', '-q', 'main');
  writeFileSync(join(dir, 'f.txt'), 'ours\n');
  git(dir, 'commit', '-q', '-am', 'ours');
  try {
    git(dir, 'merge', 'side');
  } catch {
    // the conflict is the point
  }

  return lsFiles(dir).then((files) => {
    assert.equal(files.filter((f) => f === 'f.txt').length, 1, 'a conflicted path was counted more than once');
  });
});
