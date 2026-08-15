// The SDD tells the agent: new/apply/close PRINT the declared tool's
// agent-step instruction (chat commands, never shelled out); --no-sdd and
// sdd_auto: false suppress it; an undeclared sdd prints nothing.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initRepo } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { loadChange, saveChange } from '../../src/change/file.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

/** Capture stdout AND stderr lines around a lifecycle call. */
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

const tmp = mkdtempSync(join(tmpdir(), 'mvac-sdd-'));
const brain = join(tmp, 'acme-brain');
initRepo(brain, {
  'AGENTS.md': '# door\n',
  '.multivac/config.yml': 'doors: [agents]\nsdd: opsx\nrepos:\n  brain: .\n',
  '.multivac/invariants.md':
    '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n',
});
const ctx = { cwd: brain };

const config = (lines: string[]): void =>
  writeFileSync(join(brain, '.multivac/config.yml'), lines.join('\n') + '\n');

/** close leaves the archive/law edits for a hand commit; tidy between tests. */
const commitAll = (): void => {
  execFileSync('git', ['-C', brain, 'add', '-A'], { stdio: 'ignore' });
  execFileSync('git', ['-C', brain, 'commit', '-q', '-m', 'tidy'], { stdio: 'ignore' });
};

/** Declare brain, apply, land — the brink of close. */
async function toLanded(slug: string): Promise<void> {
  const parsed = await loadChange(brain, slug);
  parsed.change.repos = { brain: { status: 'planned' } };
  parsed.change.landing_order = [['brain']];
  parsed.change.invariants.adds = [];
  await saveChange(brain, parsed);
  assert.equal(await change.run(['apply', slug], ctx), 0);
  assert.equal(await change.run(['land', slug, '--landed', 'brain'], ctx), 0);
}

test('new/apply/close print the opsx instructions, slug interpolated', async () => {
  const c1 = await capture(() => change.run(['new', 'sdd-a', 'SDD a'], ctx));
  assert.equal(c1.code, 0);
  assert.match(c1.out, /sdd opsx: run \/opsx:propose sdd-a in your agent to draft the spec change/);

  const parsed = await loadChange(brain, 'sdd-a');
  parsed.change.repos = { brain: { status: 'planned' } };
  parsed.change.landing_order = [['brain']];
  parsed.change.invariants.adds = [];
  await saveChange(brain, parsed);
  const c2 = await capture(() => change.run(['apply', 'sdd-a'], ctx));
  assert.equal(c2.code, 0);
  assert.match(c2.out, /sdd opsx: run \/opsx:apply sdd-a in your agent to implement the proposed tasks/);

  assert.equal(await change.run(['land', 'sdd-a', '--landed', 'brain'], ctx), 0);
  const c3 = await capture(() => change.run(['close', 'sdd-a'], ctx));
  assert.equal(c3.code, 0);
  assert.match(c3.out, /sdd opsx: run \/opsx:archive sdd-a in your agent to update the specs and archive the change/);
  commitAll();
});

test('--no-sdd suppresses the instruction for that run', async () => {
  const c = await capture(() => change.run(['new', 'sdd-b', 'SDD b', '--no-sdd'], ctx));
  assert.equal(c.code, 0);
  assert.doesNotMatch(c.out, /sdd opsx/);
});

test('sdd_auto: false suppresses every instruction', async () => {
  config(['doors: [agents]', 'sdd: opsx', 'sdd_auto: false', 'repos:', '  brain: .']);
  const c1 = await capture(() => change.run(['new', 'sdd-c', 'SDD c'], ctx));
  assert.equal(c1.code, 0);
  assert.doesNotMatch(c1.out, /sdd opsx/);
  await toLanded('sdd-c');
  const c2 = await capture(() => change.run(['close', 'sdd-c'], ctx));
  assert.equal(c2.code, 0);
  assert.doesNotMatch(c2.out, /sdd opsx/);
  commitAll();
});

test('undeclared sdd prints nothing', async () => {
  config(['doors: [agents]', 'repos:', '  brain: .']);
  const c = await capture(() => change.run(['new', 'quiet-d', 'Quiet d'], ctx));
  assert.equal(c.code, 0);
  assert.doesNotMatch(c.out, /^sdd /m);
});


test('a step with no agent-run equivalent is an honest gap (speckit archive)', async () => {
  config(['doors: [agents]', 'sdd: speckit', 'repos:', '  brain: .']);
  const c1 = await capture(() => change.run(['new', 'sdd-e', 'SDD e'], ctx));
  assert.equal(c1.code, 0);
  assert.match(c1.out, /sdd speckit: run \/speckit\.specify in your agent to write the spec for sdd-e/);
  await toLanded('sdd-e');
  const c2 = await capture(() => change.run(['close', 'sdd-e'], ctx));
  assert.equal(c2.code, 0);
  assert.match(c2.out, /sdd speckit: archive — this tool has no agent-run archive step; nothing to run/);
});
