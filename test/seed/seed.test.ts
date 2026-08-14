import test from 'node:test';
import assert from 'node:assert/strict';
import { appendFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initRepo, makeScratchEcosystem } from '../helpers/fixture.js';
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
  assert.deepEqual(buckets.get('package manifests'), ['package.json']);
  // routes beat the runtime-config catch-all, wherever the file sits
  assert.deepEqual(buckets.get('routes'), ['config/routes.rb', 'src/routes/index.ts']);
  // unmatched files appear nowhere; empty buckets are dropped
  const all = [...buckets.values()].flat();
  assert.equal(all.length, 14);
  assert.ok(!all.includes('src/app.ts') && !all.includes('README.md'));
});

test('classify knows where architecture lives: gates, workspace, deploy, config, models, intent', () => {
  const buckets = classify([
    // policy gates — the project's law in machine form
    '.pre-commit-config.yaml',
    '.semgrep/imports.yaml',
    '.eslintrc.json',
    'biome.jsonc',
    'ruff.toml',
    '.github/CODEOWNERS',
    // workspace / build graph
    'pnpm-workspace.yaml',
    'turbo.json',
    'go.work',
    'src/cartservice/cartservice.sln',
    'src/cartservice/src/cartservice.csproj',
    '.changeset/config.json',
    // deploy manifests
    'kubernetes-manifests/frontend.yaml',
    'helm-chart/Chart.yaml',
    'helm-chart/values.yaml',
    'kustomize/kustomization.yaml',
    'istio-manifests/gateway.yaml',
    'skaffold.yaml',
    'cloudbuild.yaml',
    // runtime config
    'saleor/settings.py',
    'app.yaml',
    'Procfile',
    'netlify.toml',
    // models / schema
    'saleor/order/models.py',
    'prisma/schema.prisma',
    // decisions / intent
    'docs/adr/0001-payments.md',
    'AGENTS.md',
    'packages/astro/CLAUDE.md',
    'CONTRIBUTING.md',
    'ARCHITECTURE.md',
  ]);
  assert.deepEqual(buckets.get('policy gates'), [
    '.pre-commit-config.yaml',
    '.semgrep/imports.yaml',
    '.eslintrc.json',
    'biome.jsonc',
    'ruff.toml',
    '.github/CODEOWNERS',
  ]);
  assert.deepEqual(buckets.get('workspace / build graph'), [
    'pnpm-workspace.yaml',
    'turbo.json',
    'go.work',
    'src/cartservice/cartservice.sln',
    'src/cartservice/src/cartservice.csproj',
    '.changeset/config.json',
  ]);
  assert.deepEqual(buckets.get('deploy manifests'), [
    'kubernetes-manifests/frontend.yaml',
    'helm-chart/Chart.yaml',
    'helm-chart/values.yaml',
    'kustomize/kustomization.yaml',
    'istio-manifests/gateway.yaml',
    'skaffold.yaml',
    'cloudbuild.yaml',
  ]);
  assert.deepEqual(buckets.get('runtime config'), [
    'saleor/settings.py',
    'app.yaml',
    'Procfile',
    'netlify.toml',
  ]);
  assert.deepEqual(buckets.get('models / schema'), [
    'saleor/order/models.py',
    'prisma/schema.prisma',
  ]);
  assert.deepEqual(buckets.get('decisions / intent'), [
    'docs/adr/0001-payments.md',
    'AGENTS.md',
    'packages/astro/CLAUDE.md',
    'CONTRIBUTING.md',
    'ARCHITECTURE.md',
  ]);
});

test('classify drops fixtures, examples, vendored trees and migration __init__', () => {
  const buckets = classify([
    'packages/astro/package.json',
    'packages/astro/test/fixtures/basic/package.json',
    'packages/astro/e2e/fixtures/errors/package.json',
    'examples/blog/Dockerfile',
    'vendor/lib/setup.py',
    'third_party/protos/x.proto',
    'saleor/order/migrations/0001_initial.py',
    'saleor/order/migrations/__init__.py',
  ]);
  assert.deepEqual(buckets.get('package manifests'), ['packages/astro/package.json']);
  assert.equal(buckets.get('docker'), undefined);
  assert.equal(buckets.get('protobuf'), undefined);
  assert.deepEqual(buckets.get('migrations'), ['saleor/order/migrations/0001_initial.py']);
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
  // the three open questions are always put to the human
  assert.match(report, /## open questions — the interview needs these answered/);
  assert.match(report, /\*\*Debt or intent\?\*\*/);
  assert.match(report, /\*\*Law or taste\?\*\*/);
  assert.match(report, /\*\*Which authority wins\?\*\*/);
  // final handoff names the flow
  assert.match(report, /## next\n\nseed → questions → interview → law\./);

  // deterministic: second run is byte-identical (no timestamps)
  await seed.run([], { cwd: eco.brain });
  assert.equal(readFileSync(join(eco.brain, REPORT_PATH), 'utf8'), report);
});

/** Brain declaring exactly one code repo, for subject-shaped trees. */
function brainFor(tmp: string, repoFiles: Record<string, string>): string {
  const brain = join(tmp, 'brain');
  initRepo(brain, {
    '.multivac/config.yml': 'doors: [agents]\nrepos:\n  code: ../code\n',
    '.multivac/invariants.md': '# Invariants\n',
  });
  initRepo(join(tmp, 'code'), repoFiles);
  return brain;
}

test('seed on a Django-monolith-shaped tree finds the law sources and caps the flood', async () => {
  const migrations: Record<string, string> = {};
  for (let i = 1; i <= 28; i++) {
    migrations[`store/order/migrations/${String(i).padStart(4, '0')}_m.py`] = '# migration\n';
  }
  const brain = brainFor(mkdtempSync(join(tmpdir(), 'mvac-seed-s1-')), {
    ...migrations,
    'store/order/migrations/__init__.py': '',
    '.pre-commit-config.yaml': 'repos: []\n',
    '.semgrep/imports.yaml': 'rules: []\n',
    'store/settings.py': 'DEBUG = False\n',
    'store/order/models.py': 'class Order: pass\n',
    'store/api/schema.graphql': 'type Query { ok: Boolean }\n',
    'docs/adr/0001-payments.md': '# ADR 1\n',
    'AGENTS.md': '# agents\n',
    'pyproject.toml': '[tool.x]\n',
  });

  assert.equal(await seed.run([], { cwd: brain }), 0);
  const report = readFileSync(join(brain, REPORT_PATH), 'utf8');

  assert.match(report, /### policy gates \(2\)/);
  assert.match(report, /### runtime config \(1\)/);
  assert.ok(report.includes('- store/settings.py'));
  assert.match(report, /### models \/ schema \(1\)/);
  assert.ok(report.includes('- store/order/models.py'));
  assert.match(report, /### decisions \/ intent \(2\)/);
  // the flood is capped: 28 migrations -> 25 listed + a count, __init__ dropped
  assert.match(report, /### migrations \(28\)/);
  assert.ok(report.includes('- … and 3 more'));
  assert.ok(!report.includes('__init__.py'));
  // questions instantiated against what was found
  assert.match(report, /Rules in machine form found here: [^\n]*\.semgrep\/imports\.yaml/);
  assert.match(report, /prior art, read it first: [^\n]*AGENTS\.md/);
  assert.ok(report.includes('Machine gates and prose docs both exist here.'));
});

test('seed on a k8s-polyglot-shaped tree names the deploy stacks as rival authorities', async () => {
  const brain = brainFor(mkdtempSync(join(tmpdir(), 'mvac-seed-s2-')), {
    'kubernetes-manifests/frontend.yaml': 'kind: Deployment\n',
    'helm-chart/Chart.yaml': 'name: shop\n',
    'helm-chart/values.yaml': 'tag: v1\n',
    'kustomize/kustomization.yaml': 'resources: []\n',
    'istio-manifests/gateway.yaml': 'kind: Gateway\n',
    'skaffold.yaml': 'apiVersion: skaffold/v4\n',
    'protos/demo.proto': 'syntax = "proto3";\n',
    'src/cartservice/cartservice.sln': '\n',
    'src/cartservice/src/cartservice.csproj': '<Project/>\n',
    'src/frontend/go.mod': 'module frontend\n',
    'docs/adding-new-microservice.md': '# parity contract\n',
  });

  assert.equal(await seed.run([], { cwd: brain }), 0);
  const report = readFileSync(join(brain, REPORT_PATH), 'utf8');

  assert.match(report, /### deploy manifests \(6\)/);
  assert.ok(report.includes('- kubernetes-manifests/frontend.yaml'));
  // the C# service finally has a row
  assert.match(report, /### workspace \/ build graph \(2\)/);
  assert.ok(report.includes('- src/cartservice/src/cartservice.csproj'));
  assert.match(report, /### protobuf \(1\)/);
  // four parallel deploy stacks -> the authority question names them
  assert.ok(report.includes('This ecosystem deploys via helm, kustomize, skaffold, raw manifests in parallel.'));
});

test('seed on a pnpm-monorepo-shaped tree reads the build graph and ignores fixture noise', async () => {
  const brain = brainFor(mkdtempSync(join(tmpdir(), 'mvac-seed-s3-')), {
    'pnpm-workspace.yaml': 'packages:\n  - packages/*\n',
    'turbo.json': '{}\n',
    '.changeset/config.json': '{}\n',
    'biome.jsonc': '{}\n',
    'package.json': '{ "name": "root", "private": true }\n',
    'packages/astro/package.json': '{ "name": "astro" }\n',
    'packages/astro/test/fixtures/basic/package.json': '{ "name": "fx" }\n',
    'examples/blog/Dockerfile': 'FROM node\n',
    'AGENTS.md': '# agents\n',
    'CONTRIBUTING.md': '# contributing\n',
    '.github/workflows/ci.yml': 'on: push\n',
  });

  assert.equal(await seed.run([], { cwd: brain }), 0);
  const report = readFileSync(join(brain, REPORT_PATH), 'utf8');

  assert.match(report, /### workspace \/ build graph \(3\)/);
  assert.ok(report.includes('- pnpm-workspace.yaml') && report.includes('- turbo.json'));
  assert.match(report, /### policy gates \(1\)/);
  assert.ok(report.includes('- biome.jsonc'));
  // fixtures and examples never surface
  assert.match(report, /### package manifests \(2\)/);
  assert.ok(!report.includes('fixtures') && !report.includes('examples/blog'));
  // prose prior art is named to the interviewer
  assert.match(report, /prior art, read it first: [^\n]*CONTRIBUTING\.md/);
});
