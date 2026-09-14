// Git's own environment overrides `git -C`. A hook runs with GIT_DIR and
// GIT_INDEX_FILE set to the repo being committed, so without scrubbing them
// every sibling repo is read through that repo's index and reports as empty
// or untracked — which surfaced as a whole ecosystem of phantom "vacuous"
// anchors on the first `multivac verify` ever run from a pre-commit hook.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initRepo, makeScratchEcosystem, shallowClone } from '../helpers/fixture.js';
import { isShallow, lsFiles } from '../../src/lib/git.js';

test('lsFiles ignores ambient GIT_DIR / GIT_INDEX_FILE', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-gitenv-')));

  const clean = await lsFiles(eco.repos.api);
  assert.ok(clean.length > 0, 'fixture repo should have tracked files');

  // Point git at a *different* repo the way a pre-commit hook would.
  const prev = { dir: process.env.GIT_DIR, index: process.env.GIT_INDEX_FILE };
  process.env.GIT_DIR = join(eco.repos.web, '.git');
  process.env.GIT_INDEX_FILE = join(eco.repos.web, '.git', 'index');
  try {
    assert.deepEqual(
      await lsFiles(eco.repos.api),
      clean,
      'ambient git env must not redirect `git -C` at another repo',
    );
  } finally {
    if (prev.dir === undefined) delete process.env.GIT_DIR;
    else process.env.GIT_DIR = prev.dir;
    if (prev.index === undefined) delete process.env.GIT_INDEX_FILE;
    else process.env.GIT_INDEX_FILE = prev.index;
  }
});

test('isShallow reads the clone it is given, never the one GIT_DIR points at — MV-125', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-shallow-'));
  const shallow = join(tmp, 'shallow');
  shallowClone(shallow);
  const full = join(tmp, 'full');
  initRepo(full, { 'README.md': '# full\n' });
  const plain = join(tmp, 'plain');
  mkdirSync(plain);

  assert.equal(await isShallow(shallow), true);
  assert.equal(await isShallow(full), false);
  assert.equal(await isShallow(plain), false, 'an error is not an answer of true');

  const prev = process.env.GIT_DIR;
  process.env.GIT_DIR = join(shallow, '.git');
  try {
    assert.equal(await isShallow(full), false, 'ambient GIT_DIR must not answer for another clone');
  } finally {
    if (prev === undefined) delete process.env.GIT_DIR;
    else process.env.GIT_DIR = prev;
  }
});
