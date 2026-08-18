// MV-95: the tool says what it already computed, about parallelism and about
// continuing. Both are printed and never verified — no artifact proves an agent
// ran two things at once, and none proves it did not stop to ask.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { sddInstructions } from '../../src/adapters/sdd.js';
import { loadConfig } from '../../src/lib/config.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const capture = async (fn: () => Promise<number>): Promise<{ code: number; out: string }> => {
  const lines: string[] = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (l: string) => lines.push(String(l));
  console.error = (l: string) => lines.push(String(l));
  try {
    return { code: await fn(), out: lines.join('\n') };
  } finally {
    console.log = origLog;
    console.error = origErr;
  }
};

/** A change declaring the given landing order, applied. */
async function applied(order: string): Promise<{ code: number; out: string }> {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-urge-'));
  const e = makeScratchEcosystem(tmp);
  writeFileSync(
    join(e.brain, '.multivac/config.yml'),
    'doors: [agents]\nrepos:\n  api: ../acme-api\n  web: ../acme-web\n',
  );
  const ctx = { cwd: e.brain };
  await capture(() => change.run(['new', 'points-expire', 'Points expire'], ctx));
  const file = join(e.brain, '.multivac/changes/points-expire.md');
  writeFileSync(
    file,
    readFileSync(file, 'utf8')
      .replace('repos: {}', 'repos:\n  api:\n    status: planned\n  web:\n    status: planned')
      .replace('landing_order: []', order),
  );
  return capture(() => change.run(['apply', 'points-expire', '--no-sdd'], ctx));
}

// --- US1: what can be worked at once ---

test('two repos in one stage are named as workable at the same time', async () => {
  const c = await applied('landing_order:\n  - - api\n    - web');
  assert.equal(c.code, 0);
  assert.match(c.out, /these two are one stage: no ordering between them, and one checkout each — work them at once/);
});

test('the boundaries ride with the line, every time', async () => {
  const c = await applied('landing_order:\n  - - api\n    - web');
  assert.match(c.out, /never the same file twice at once \(a lost update\)/);
  assert.match(c.out, /never the law: ids are reserved one at a time and stages serialise there/);
});

test('one repo per stage says nothing about working at once', async () => {
  const c = await applied('landing_order:\n  - - api\n  - - web');
  assert.equal(c.code, 0);
  assert.equal(c.out.includes('work them at once'), false);
});

test('the urging refuses nothing', async () => {
  const c = await applied('landing_order:\n  - - api\n    - web');
  assert.equal(c.code, 0);
});

// --- US2: the chain says continue ---

async function cfgWith(lines: string[]) {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-urge-sdd-'));
  const e = makeScratchEcosystem(tmp);
  writeFileSync(join(e.brain, '.multivac/config.yml'), [...lines, ''].join('\n'));
  return loadConfig(e.brain);
}

test('every printed step carries the instruction to keep going, and the opt-out', async () => {
  const cfg = await cfgWith(['doors: [agents]', 'sdd: speckit', 'repos:', '  api: ../acme-api']);
  const lines = sddInstructions(cfg, 'new', 'points-expire', false);
  assert.ok(lines.length >= 2, 'a step and its clause');
  const clause = lines.filter((l) => l.includes('run the chain through without asking to continue'));
  // One clause per step, not one for the whole run.
  assert.equal(clause.length, lines.length / 2);
  assert.match(clause[0], /stop only for a question the tool itself raises/);
  assert.match(clause[0], /`--no-sdd` for one run, `sdd_auto: false` to stop printing these/);
});

test('with the automation off, neither the steps nor the clause print', async () => {
  const off = await cfgWith([
    'doors: [agents]', 'sdd: speckit', 'sdd_auto: false', 'repos:', '  api: ../acme-api',
  ]);
  assert.deepEqual(sddInstructions(off, 'new', 'x', false), []);
  const on = await cfgWith(['doors: [agents]', 'sdd: speckit', 'repos:', '  api: ../acme-api']);
  assert.deepEqual(sddInstructions(on, 'new', 'x', true), []);
});
