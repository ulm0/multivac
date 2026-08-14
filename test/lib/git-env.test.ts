// Git's own environment overrides `git -C`. A hook runs with GIT_DIR and
// GIT_INDEX_FILE set to the repo being committed, so without scrubbing them
// every sibling repo is read through that repo's index and reports as empty
// or untracked — which surfaced as a whole ecosystem of phantom "vacuous"
// anchors on the first `multivac verify` ever run from a pre-commit hook.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { lsFiles } from '../../src/lib/git.js';

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
