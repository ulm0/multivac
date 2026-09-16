// MV-129. Every command that sets a repo up equips it. Measured 2026-09-16 on
// 0.13.0: `repos sync` left a declared sibling with no SDD and no graph and
// exited 0; `change new` with `specify` off PATH committed the change and only
// then said the tool could not run; `plan`/`apply` equipped before cloning.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem, vendorPath } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { reposCommand } from '../../src/commands/repos.js';
import { loadChange, saveChange } from '../../src/change/file.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const both = vendorPath();
const onlySpecify = vendorPath(['specify']);
const none = vendorPath([]);

async function run(
  fn: () => Promise<number>,
  path: string,
): Promise<{ code: number; out: string }> {
  const lines: string[] = [];
  const orig = { log: console.log, error: console.error, path: process.env.PATH };
  console.log = console.error = (...a: unknown[]) => {
    lines.push(a.map(String).join(' '));
  };
  process.env.PATH = path;
  try {
    return { code: await fn(), out: lines.join('\n') };
  } finally {
    console.log = orig.log;
    console.error = orig.error;
    process.env.PATH = orig.path;
  }
}

/** A brain declaring speckit and graphify, plus `extra` repos lines. */
function eco(extra: string[] = []) {
  const e = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-equip7-')));
  writeFileSync(
    join(e.brain, '.multivac/config.yml'),
    ['doors: [agents]', 'sdd: speckit', 'grapher: graphify', 'repos:', '  api: ../acme-api', ...extra, ''].join('\n'),
  );
  execFileSync('git', ['-C', e.brain, 'add', '-A'], { stdio: 'ignore' });
  execFileSync('git', ['-C', e.brain, 'commit', '-qm', 'config'], { stdio: 'ignore' });
  return e;
}

const head = (dir: string): string => execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

test('repos sync installs the SDD and builds the graph in a declared sibling — MV-129', async () => {
  const e = eco(['  web:', '    path: ../acme-web', '    managed: false']);
  const { code, out } = await run(() => reposCommand.run(['sync'], { cwd: e.brain }), both.path);
  assert.equal(code, 0, out);
  assert.ok(existsSync(join(e.repos.api, '.specify/integration.json')), 'spec-kit installed in api');
  assert.ok(existsSync(join(e.repos.api, 'graphify-out/graph.json')), 'graph built in api');
  // read-only: nothing runs there
  assert.equal(existsSync(join(e.repos.web, '.specify')), false);
  assert.equal(existsSync(join(e.repos.web, 'graphify-out')), false);

  // a second sync runs neither tool
  const runs = readFileSync(both.runs, 'utf8').split('\n').filter(Boolean).length;
  assert.equal((await run(() => reposCommand.run(['sync'], { cwd: e.brain }), both.path)).code, 0);
  assert.equal(readFileSync(both.runs, 'utf8').split('\n').filter(Boolean).length, runs);
});

test('repos sync exits 1 over a missing tool and still equips the rest — MV-129', async () => {
  const e = eco();
  const { code, out } = await run(() => reposCommand.run(['sync'], { cwd: e.brain }), onlySpecify.path);
  assert.equal(code, 1, out);
  assert.match(out, /graph graphify @ api: build skipped — `graphify` found on neither PATH nor api's node_modules\/\.bin/);
  assert.ok(existsSync(join(e.repos.api, '.specify/integration.json')), 'the SDD still went in');
});

test('change new refuses the SDD its steps need, before writing anything — MV-129', async () => {
  const e = eco();
  const before = head(e.brain);
  const { code, out } = await run(() => change.run(['new', 'nope', 'Nope'], { cwd: e.brain }), none.path);
  assert.equal(code, 1, out);
  assert.match(out, /change new refused — speckit @ (brain|api): `specify` found on neither PATH nor/);
  assert.match(out, /github\.com\/github\/spec-kit/);
  assert.equal(existsSync(join(e.brain, '.multivac/changes/nope.md')), false, 'no change file');
  assert.equal(head(e.brain), before, 'no commit');
  assert.doesNotMatch(readFileSync(join(e.brain, '.multivac/invariants.md'), 'utf8'), /RESERVED by change nope/);

  // --no-sdd lifts it; a missing grapher is only a notice at new
  const skipped = await run(() => change.run(['new', 'nope', 'Nope', '--no-sdd'], { cwd: e.brain }), none.path);
  assert.equal(skipped.code, 0, skipped.out);
  assert.match(skipped.out, /graph graphify @ .*: build skipped/);
});

test('change new with the tools installed refuses nothing — MV-129', async () => {
  const e = eco();
  const { code, out } = await run(() => change.run(['new', 'yes', 'Yes'], { cwd: e.brain }), both.path);
  assert.equal(code, 0, out);
  assert.ok(existsSync(join(e.repos.api, '.specify/integration.json')));
});

test('plan equips a repo it clones, and apply a repo it creates — MV-129', async () => {
  // Graph only (--no-sdd): the SDD gate would refuse before the clone for want
  // of a spec, and the graph is what shows whether equip ran after the clone.
  const e = eco();
  writeFileSync(
    join(e.brain, '.multivac/config.yml'),
    [
      'doors: [agents]', 'grapher: graphify', 'repos:', '  api: ../acme-api',
      '  mirror:', '    path: ../acme-mirror', `    url: ${e.repos.api}`,
      '  svc: ../acme-svc', '',
    ].join('\n'),
  );
  execFileSync('git', ['-C', e.brain, 'commit', '-qam', 'more repos'], { stdio: 'ignore' });
  const ctx = { cwd: e.brain };
  const mirror = join(e.brain, '..', 'acme-mirror');
  const svc = join(e.brain, '..', 'acme-svc');

  assert.equal((await run(() => change.run(['new', 'grow', 'Grow', '--no-sdd'], ctx), both.path)).code, 0);
  const parsed = await loadChange(e.brain, 'grow');
  parsed.change.repos = { mirror: { status: 'planned' }, svc: { status: 'planned' } };
  parsed.change.landing_order = [['mirror', 'svc']];
  parsed.change.invariants.adds = [];
  await saveChange(e.brain, parsed);

  const planned = await run(() => change.run(['plan', 'grow', '--no-sdd'], ctx), both.path);
  assert.equal(planned.code, 0, planned.out);
  assert.ok(existsSync(join(mirror, '.git')), 'plan cloned mirror');
  assert.ok(existsSync(join(mirror, 'graphify-out/graph.json')), 'and equipped it in the same run');

  const applied = await run(() => change.run(['apply', 'grow', '--no-sdd'], ctx), both.path);
  assert.equal(applied.code, 0, applied.out);
  assert.ok(existsSync(join(svc, '.git')), 'apply created svc');
  assert.ok(existsSync(join(svc, 'graphify-out/graph.json')), 'and equipped it in the same run');
});
