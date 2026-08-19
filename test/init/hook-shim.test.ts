// The enforcement floor: which multivac the shim finds, and what it does when
// it finds none. Each candidate is exercised against a fixture PATH so the
// developer's own install cannot decide the outcome.

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gitInit } from '../helpers/fixture.js';
import { findRunner, installHooks } from '../../src/hooks/install.js';

/** Repo with shims installed plus a PATH dir holding only what we put there. */
async function fixture(): Promise<{ repo: string; bin: string }> {
  const repo = mkdtempSync(join(tmpdir(), 'mvac-shim-'));
  gitInit(repo);
  await installHooks(repo);
  const bin = join(repo, 'fixture-bin');
  mkdirSync(bin, { recursive: true });
  return { repo, bin };
}

/** A fake executable that prints "<name> <args>" and exits 0. */
function fake(bin: string, name: string): void {
  const p = join(bin, name);
  writeFileSync(p, `#!/bin/sh\necho "${name} $*"\n`);
  chmodSync(p, 0o755);
}

/** Run the pre-commit shim the way git does: cwd = repo, relative $0. */
function runHook(
  repo: string,
  path: string,
): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync('.multivac/hooks/pre-commit', {
    cwd: repo,
    env: { PATH: path },
    encoding: 'utf8',
    shell: false,
  });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

// System utilities the shim may need, minus any real multivac on the dev's PATH.
const SYS = '/usr/bin:/bin';

/** findRunner reads process.env.PATH — pin it to the fixture's. */
async function runnerWith(path: string, repo: string): Promise<string | null> {
  const saved = process.env.PATH;
  process.env.PATH = path;
  try {
    return await findRunner(repo);
  } finally {
    process.env.PATH = saved;
  }
}

// MV-92: most specific first. A repo that BUILDS or DECLARES a multivac has
// said which one governs it; whatever is on PATH is whatever the machine has.
// These three assertions were the exact inverse until 2026-08-18, and the cost
// was silent — a global a year behind enforcing an older law table against a
// repo that pinned something else.

test('shim prefers the build in this repo, over everything else available', async () => {
  const { repo, bin } = await fixture();
  fake(bin, 'mvac'); // present, and must LOSE
  fake(bin, 'npx');
  fake(bin, 'node');
  mkdirSync(join(repo, 'node_modules/multivac'), { recursive: true });
  writeFileSync(join(repo, 'node_modules/multivac/package.json'), '{}');
  mkdirSync(join(repo, 'dist'), { recursive: true });
  // MV-108: preferring this repo's build now requires the repo to BE
  // multivac — `dist/cli.js` plus node_modules describes most Node CLI
  // repos, and running theirs as multivac is the defect that closed.
  writeFileSync(join(repo, 'package.json'), '{"name":"multivac"}\n');
  writeFileSync(join(repo, 'dist/cli.js'), '// built cli\n');

  const path = `${bin}:${SYS}`;
  const r = runHook(repo, path);
  assert.equal(r.status, 0);
  // absolute path, from the hook's own location (tmpdir may be a symlink)
  assert.match(r.stdout.trim(), /^node \/\S+\/dist\/cli\.js verify$/);
  assert.equal(await runnerWith(path, repo), 'node dist/cli.js');
});

test('no build here: the multivac this repo DECLARES beats the one on PATH', async () => {
  const { repo, bin } = await fixture();
  fake(bin, 'mvac'); // present, and must lose to the declared dependency
  fake(bin, 'npx');
  mkdirSync(join(repo, 'node_modules/multivac'), { recursive: true });
  writeFileSync(join(repo, 'node_modules/multivac/package.json'), '{}');

  const path = `${bin}:${SYS}`;
  const r = runHook(repo, path);
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), 'npx --no-install multivac verify');
  assert.equal(await runnerWith(path, repo), 'npx --no-install multivac');
});

test('nothing declared and nothing built: whatever is on PATH runs', async () => {
  const { repo, bin } = await fixture();
  fake(bin, 'mvac');

  const path = `${bin}:${SYS}`;
  const r = runHook(repo, path);
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), 'mvac verify');
  assert.equal(await runnerWith(path, repo), 'mvac on PATH');
});

test('the repo-local build is found from the hook, not from cwd', async () => {
  const { repo, bin } = await fixture();
  fake(bin, 'node');
  mkdirSync(join(repo, 'dist'), { recursive: true });
  // MV-108: preferring this repo's build now requires the repo to BE
  // multivac — `dist/cli.js` plus node_modules describes most Node CLI
  // repos, and running theirs as multivac is the defect that closed.
  writeFileSync(join(repo, 'package.json'), '{"name":"multivac"}\n');
  writeFileSync(join(repo, 'dist/cli.js'), '// built cli\n');
  mkdirSync(join(repo, 'node_modules'), { recursive: true });
  mkdirSync(join(repo, 'sub'), { recursive: true });

  // git can invoke the hook by absolute path from anywhere in the tree
  const r = spawnSync(join(repo, '.multivac/hooks/pre-commit'), {
    cwd: join(repo, 'sub'),
    env: { PATH: `${bin}:${SYS}` },
    encoding: 'utf8',
  });
  assert.equal(r.status, 0);
  // absolute path, from the hook's own location (tmpdir may be a symlink)
  assert.match(r.stdout.trim(), /^node \/\S+\/dist\/cli\.js verify$/);
});

test('nothing runnable: loud warning on stderr, exit 0, commit not blocked', async () => {
  const { repo, bin } = await fixture();

  const path = `${bin}:${SYS}`;
  const r = runHook(repo, path);
  assert.equal(r.status, 0, 'a broken install must never wedge a commit');
  assert.equal(r.stdout, '');
  assert.match(r.stderr, /INACTIVE/);
  assert.match(r.stderr, /nothing was verified/);
  assert.match(r.stderr, /npm i -g multivac/);
  assert.equal(r.stderr.trim().split('\n').length, 1, 'one line, not a paragraph');
  assert.equal(await runnerWith(path, repo), null);
});

test('pre-push carries the same resolution as pre-commit', async () => {
  const { repo, bin } = await fixture();
  fake(bin, 'mvac');
  const r = spawnSync('.multivac/hooks/pre-push', {
    cwd: repo,
    env: { PATH: `${bin}:${SYS}` },
    encoding: 'utf8',
  });
  assert.equal(r.stdout.trim(), 'mvac verify');
});

test('a built dist with no node_modules is INACTIVE, never a blocked commit', async () => {
  // The failure this closes: `rm -rf node_modules` with dist/ still built.
  // The shim exec'd node, node exited 1 on the first bare import, and the
  // pre-commit hook blocked every commit in the repo with a stack trace —
  // the one thing the shim promises never to do.
  const { repo, bin } = await fixture();
  fake(bin, 'node');
  mkdirSync(join(repo, 'dist'), { recursive: true });
  writeFileSync(join(repo, 'package.json'), '{"name":"multivac"}\n');
  writeFileSync(join(repo, 'dist/cli.js'), "import 'yaml';\n");

  const path = `${bin}:${SYS}`;
  const r = runHook(repo, path);
  assert.equal(r.status, 0, 'a half-installed checkout must never wedge a commit');
  assert.equal(r.stdout, '');
  assert.match(r.stderr, /INACTIVE/);
  assert.equal(await runnerWith(path, repo), null);
});
