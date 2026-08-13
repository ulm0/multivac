import test from 'node:test';
import assert from 'node:assert/strict';
import { appendFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { seed, REPORT_PATH } from '../../src/commands/seed.js';
import { classify } from '../../src/seed/inventory.js';

test('classify buckets boundary files, first category wins, rest dropped', () => {
  const buckets = classify([
    'db/migrations/0001.sql',
    'schema.sql',
    'openapi.yaml',
    'proto/billing.proto',
    'api/schema.graphql',
    'docker-compose.yml',
    'Dockerfile',
    'infra/main.tf',
    '.env.example',
    '.github/workflows/ci.yml',
    '.gitlab-ci.yml',
    'package.json',
    'config/routes.rb',
    'src/routes/index.ts',
    'src/app.ts',
    'README.md',
  ]);
  // migrations beat the bare *.sql bucket
  assert.deepEqual(buckets.get('migrations'), ['db/migrations/0001.sql']);
  assert.deepEqual(buckets.get('sql'), ['schema.sql']);
  assert.deepEqual(buckets.get('api specs'), ['openapi.yaml']);
  assert.deepEqual(buckets.get('protobuf'), ['proto/billing.proto']);
  assert.deepEqual(buckets.get('graphql'), ['api/schema.graphql']);
  assert.deepEqual(buckets.get('docker'), ['docker-compose.yml', 'Dockerfile']);
  assert.deepEqual(buckets.get('terraform'), ['infra/main.tf']);
  assert.deepEqual(buckets.get('env examples'), ['.env.example']);
  assert.deepEqual(buckets.get('ci'), ['.github/workflows/ci.yml', '.gitlab-ci.yml']);
  assert.deepEqual(buckets.get('manifests'), ['package.json']);
  assert.deepEqual(buckets.get('routes/config'), ['config/routes.rb', 'src/routes/index.ts']);
  // unmatched files appear nowhere; empty buckets are dropped
  const all = [...buckets.values()].flat();
  assert.equal(all.length, 14);
  assert.ok(!all.includes('src/app.ts') && !all.includes('README.md'));
});

test('seed inventories the scratch ecosystem deterministically', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-seed-')));
  // declare one repo that is not on disk -> must land in skipped, not error
  appendFileSync(join(eco.brain, '.multivac/config.yml'), '  pay: ../acme-pay\n');

  assert.equal(await seed.run([], { cwd: eco.brain }), 0);
  const report = readFileSync(join(eco.brain, REPORT_PATH), 'utf8');

  // per repo, per category, files with counts
  assert.match(report, /## api \(\.\.\/acme-api\)/);
  assert.match(report, /### migrations \(1\)/);
  assert.ok(report.includes('- db/migrations/0001.sql'));
  // present repo with no boundary files says so instead of vanishing
  assert.match(report, /## web \(\.\.\/acme-web\)\n\nNo boundary files found\./);
  // missing repo listed as skipped with the fix
  assert.match(report, /## skipped\n\n- pay \(\.\.\/acme-pay\) — not present; run `multivac repos sync`/);
  // final handoff section
  assert.match(report, /## next\n\nThe agent reads these files and drafts proposed claims — see the multivac skill\./);

  // deterministic: second run is byte-identical (no timestamps)
  await seed.run([], { cwd: eco.brain });
  assert.equal(readFileSync(join(eco.brain, REPORT_PATH), 'utf8'), report);
});
