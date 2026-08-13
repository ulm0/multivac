import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from './fixture.js';
import { loadConfig, ConfigError } from '../../src/lib/config.js';
import { lsFiles, headSha, remoteTrackingRef } from '../../src/lib/git.js';
import { filterFiles } from '../../src/lib/glob.js';

const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-')));

test('fixture repos are real git repos with committed files', async () => {
  const files = await lsFiles(eco.repos.api);
  assert.ok(files.includes('db/migrations/0001.sql'));
  assert.match(await headSha(eco.brain), /^[0-9a-f]{40}$/);
  assert.equal(await remoteTrackingRef(eco.brain), null);
});

// Without -b, this passes on a machine whose init.defaultBranch is main and
// fails in CI, where git still falls back to master — which is exactly how a
// green working tree shipped a red pipeline. Asserted here so the regression
// fails everywhere, not only on the image that lacks the config.
test('fixture repos are on main whatever the host init.defaultBranch says', () => {
  for (const dir of [eco.brain, eco.repos.api, eco.repos.web]) {
    const branch = execFileSync('git', ['-C', dir, 'symbolic-ref', '--short', 'HEAD'], {
      encoding: 'utf8',
    }).trim();
    assert.equal(branch, 'main');
  }
});

test('config loads with defaults and bare-string repo shorthand', async () => {
  const cfg = await loadConfig(eco.brain);
  assert.equal(cfg.sddAuto, true);
  assert.equal(cfg.mount, '.brain');
  assert.deepEqual(cfg.blocking, ['absent', 'count']);
  assert.deepEqual(cfg.repos.api, { path: '../acme-api' });
  assert.equal(cfg.repos.web?.path, '../acme-web');
});

test('missing config is a typed error that says how to fix', async () => {
  await assert.rejects(
    loadConfig(eco.repos.api),
    (e: unknown) =>
      e instanceof ConfigError && e.message.includes('multivac init'),
  );
});

test('glob include + excludes over ls-files output', async () => {
  const files = await lsFiles(eco.repos.api);
  assert.deepEqual(filterFiles(files, 'db/migrations/*.sql'), [
    'db/migrations/0001.sql',
  ]);
  assert.deepEqual(filterFiles(files, '**', ['db/**', 'README.md']).sort(), [
    'src/server.ts',
  ]);
  // dotfiles are visible to **
  const brainFiles = await lsFiles(eco.brain);
  assert.ok(filterFiles(brainFiles, '**').includes('.multivac/config.yml'));
});
