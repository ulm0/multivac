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
import { proofOf, sddInstructions, stepsAt, withSlug } from '../../src/adapters/sdd.js';
import { sddSpec } from '../../src/adapters/registry.js';
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

test("each lifecycle point's steps carry the instruction once, after the last step", async () => {
  // MV-146: the chain is the point's steps together. The same line after every
  // step was seven copies per spec-kit change; once per point is three.
  const cfg = await cfgWith(['doors: [agents]', 'sdd: speckit', 'repos:', '  api: ../acme-api']);
  const isClause = (l: string): boolean => l.includes('run the chain through without asking to continue');
  for (const [at, steps] of [['new', 2], ['plan', 2], ['apply', 3]] as const) {
    const lines = sddInstructions(cfg, at, 'points-expire', false);
    assert.equal(lines.filter(isClause).length, 1, `${at}: one clause`);
    assert.equal(lines.length, steps + 1, `${at}: every step, then the clause`);
    // After the last step, never between two: the last line is the clause.
    assert.ok(isClause(lines[lines.length - 1]), `${at}: the clause comes last`);
    assert.ok(lines.slice(0, -1).every((l) => /\[(proof|ungateable): /.test(l)), `${at}: the rest are steps`);
    // Unindented, under the tool's own tag, with its opt-out on the same line.
    assert.match(lines[lines.length - 1], /^sdd speckit: run the chain through without asking to continue — stop only for a question the tool itself raises/);
    assert.match(lines[lines.length - 1], /`--no-sdd` for one run, `sdd_auto: false` to stop printing these/);
  }
  // A point that prints no step prints no instruction: there is no chain to run.
  for (const at of ['land', 'close'] as const) {
    const lines = sddInstructions(cfg, at, 'points-expire', false);
    assert.deepEqual(lines, [`sdd speckit: ${at} — this tool has no agent-run ${at} step; nothing to run`]);
  }

  // MV-147: a step's guide rides on the line under it, three spaces after the
  // tag, and the clause still comes once, last and unindented.
  const opsx = await cfgWith(['doors: [agents]', 'sdd: opsx', 'repos:', '  api: ../acme-api']);
  const spec = sddSpec('opsx')!;
  for (const at of ['new', 'plan', 'apply', 'land'] as const) {
    const want: string[] = [];
    for (const s of stepsAt(spec, at)) {
      want.push(`sdd opsx: ${withSlug(s.run, 'points-expire')} [${proofOf(s, 'points-expire')}]`);
      if (s.guide) want.push(`sdd opsx:   ${withSlug(s.guide, 'points-expire')}`);
    }
    assert.ok(want.length > 0, `${at}: opsx prints a step`);
    const lines = sddInstructions(opsx, at, 'points-expire', false);
    assert.deepEqual(lines.slice(0, -1), want, `${at}: each step, then its guide`);
    assert.equal(lines.filter(isClause).length, 1, `${at}: one clause`);
    assert.match(lines[lines.length - 1], /^sdd opsx: run the chain through without asking to continue — /);
  }
  assert.ok(
    (spec.steps ?? []).some((s) => s.guide),
    'at least one opsx step carries a guide, or the loop above proves nothing about one',
  );
});

test('with the automation off, neither the steps nor the clause print', async () => {
  const off = await cfgWith([
    'doors: [agents]', 'sdd: speckit', 'sdd_auto: false', 'repos:', '  api: ../acme-api',
  ]);
  assert.deepEqual(sddInstructions(off, 'new', 'x', false), []);
  const on = await cfgWith(['doors: [agents]', 'sdd: speckit', 'repos:', '  api: ../acme-api']);
  assert.deepEqual(sddInstructions(on, 'new', 'x', true), []);
});
