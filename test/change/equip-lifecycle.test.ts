// MV-129. Every command that sets a repo up equips it. Measured 2026-09-16 on
// 0.13.0: `repos sync` left a declared sibling with no SDD and no graph and
// exited 0; `change new` with `specify` off PATH committed the change and only
// then said the tool could not run; `plan`/`apply` equipped before cloning.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem, vendorPath, type ScratchOpts } from '../helpers/fixture.js';
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

/** A brain declaring speckit, plus `extra` repos lines; with `brainIsCode`, a brain that holds code. */
function eco(extra: string[] = [], opts: ScratchOpts = {}) {
  const e = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-equip7-')), opts);
  writeFileSync(
    join(e.brain, '.multivac/config.yml'),
    [
      'doors: [agents]', 'sdd: speckit', 'repos:',
      ...(opts.brainIsCode ? ['  brain: .'] : []), '  api: ../acme-api', ...extra, '',
    ].join('\n'),
  );
  execFileSync('git', ['-C', e.brain, 'add', '-A'], { stdio: 'ignore' });
  execFileSync('git', ['-C', e.brain, 'commit', '-qm', 'config'], { stdio: 'ignore' });
  return e;
}

const head = (dir: string): string => execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

test('repos sync installs the SDD in the brain — MV-129', async () => {
  const e = eco(['  web:', '    path: ../acme-web', '    managed: false']);
  const { code, out } = await run(() => reposCommand.run(['sync'], { cwd: e.brain }), both.path);
  assert.equal(code, 0, out);
  // MV-146: the SDD lives in the brain alone; MV-153: a sibling gets no graph either.
  assert.ok(existsSync(join(e.brain, '.specify/integration.json')), 'spec-kit installed in the brain');
  assert.equal(existsSync(join(e.repos.api, '.specify')), false, 'and not in api');
  assert.equal(existsSync(join(e.repos.api, 'graphify-out')), false, 'no graph built in api');
  // read-only: nothing runs there
  assert.equal(existsSync(join(e.repos.web, '.specify')), false);

  // a second sync runs no tool
  const runs = readFileSync(both.runs, 'utf8').split('\n').filter(Boolean).length;
  assert.equal((await run(() => reposCommand.run(['sync'], { cwd: e.brain }), both.path)).code, 0);
  assert.equal(readFileSync(both.runs, 'utf8').split('\n').filter(Boolean).length, runs);
});

test('repos sync exits 1 over a missing tool and names it — MV-129', async () => {
  const e = eco();
  const { code, out } = await run(() => reposCommand.run(['sync'], { cwd: e.brain }), none.path);
  assert.equal(code, 1, out);
  assert.match(out, /^sdd speckit: .* cannot be run — `specify` found on neither PATH nor brain's node_modules\/\.bin/m);
  assert.equal(existsSync(join(e.brain, '.specify/integration.json')), false, 'nothing ran');
  assert.equal(existsSync(join(e.repos.api, '.specify')), false);
  // With the tool there, the same sync installs it in the brain alone.
  assert.equal((await run(() => reposCommand.run(['sync'], { cwd: e.brain }), onlySpecify.path)).code, 0);
  assert.ok(existsSync(join(e.brain, '.specify/integration.json')));
});

test('change new refuses the SDD its steps need, before writing anything — MV-129', async () => {
  const e = eco([], { brainIsCode: true });
  const before = head(e.brain);
  const { code, out } = await run(() => change.run(['new', 'nope', 'Nope'], { cwd: e.brain }), none.path);
  assert.equal(code, 1, out);
  assert.match(out, /change new refused — speckit @ (brain|api): `specify` found on neither PATH nor/);
  assert.match(out, /github\.com\/github\/spec-kit/);
  assert.equal(existsSync(join(e.brain, '.multivac/changes/nope.md')), false, 'no change file');
  assert.equal(head(e.brain), before, 'no commit');
  assert.doesNotMatch(readFileSync(join(e.brain, '.multivac/invariants.md'), 'utf8'), /RESERVED by change nope/);

  // --no-sdd lifts it, and no other tool is asked for (MV-153)
  const skipped = await run(() => change.run(['new', 'nope', 'Nope', '--no-sdd'], { cwd: e.brain }), none.path);
  assert.equal(skipped.code, 0, skipped.out);
  assert.doesNotMatch(skipped.out, /found on neither PATH/);
});

test('change new with the tools installed refuses nothing — MV-129', async () => {
  const e = eco();
  const { code, out } = await run(() => change.run(['new', 'yes', 'Yes'], { cwd: e.brain }), both.path);
  assert.equal(code, 0, out);
  assert.ok(existsSync(join(e.brain, '.specify/integration.json')));
  assert.equal(existsSync(join(e.repos.api, '.specify')), false, 'the SDD reaches no code repo (MV-146)');
});

test('apply makes a repo, equips it, and only then carries — MV-144', async () => {
  const e = eco([]);
  const b = e.brain;
  // Only the brain and the repo this change makes: a declared sibling with the
  // vendor's unfilled constitution would refuse `plan` on its own terms, which
  // is a different rule (MV-76) and not what this test is about.
  writeFileSync(
    join(b, '.multivac/config.yml'),
    ['doors: [agents]', 'sdd: speckit', 'repos:', '  brain: .', '  svc: ../acme-svc', ''].join('\n'),
  );
  execFileSync('git', ['-C', b, 'add', '-A'], { stdio: 'ignore' });
  execFileSync('git', ['-C', b, 'commit', '-qm', 'declare svc'], { stdio: 'ignore' });
  assert.equal((await run(() => change.run(['new', 'order-check'], { cwd: b }), both.path)).code, 0);
  const parsed = await loadChange(b, 'order-check');
  parsed.change.repos = { svc: { status: 'planned' } };
  parsed.change.landing_order = [['svc']];
  parsed.change.invariants.adds = [];
  await saveChange(b, parsed);
  // What /speckit.specify would have written, so plan and apply have their proof.
  mkdirSync(join(b, 'specs/001-order-check'), { recursive: true });
  for (const f of ['spec.md', 'plan.md', 'tasks.md']) {
    writeFileSync(join(b, 'specs/001-order-check', f), `# ${f}\n`);
  }
  writeFileSync(join(b, '.specify/memory/constitution.md'), '# Constitution\n\nCheck what you claim.\n');
  const planned = await run(() => change.run(['plan', 'order-check'], { cwd: b }), both.path);
  assert.equal(planned.code, 0, planned.out);
  const { code, out } = await run(() => change.run(['apply', 'order-check'], { cwd: b }), both.path);
  assert.equal(code, 0, out);
  const lines = out.split('\n');
  const at = (re: RegExp): number => lines.findIndex((l) => re.test(l));
  const created = at(/svc: created/);
  const carried = at(/svc: carried/);
  assert.ok(created !== -1, `a greenfield repo is created:\n${out}`);
  // MV-146, MV-153: equipping it runs no vendor there — the SDD lives in the
  // brain, and no graph is built — so it names no tool at svc.
  assert.equal(at(/@ svc:/), -1, `no vendor ran in svc:\n${out}`);
  if (carried !== -1) assert.ok(created < carried, `created before the carry:\n${out}`);
});
