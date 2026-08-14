// brain==code: the brain IS the code repo. `repos: { brain: . }` is the
// blessed idiom — brain door, no mount/pin nagging, a usable lifecycle key.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gitInit, makeScratchEcosystem } from '../helpers/fixture.js';
import { loadConfig, ConfigError } from '../../src/lib/config.js';
import { doorsCommand } from '../../src/commands/doors.js';
import { doctorReport } from '../../src/commands/doctor.js';
import { change } from '../../src/commands/change.js';
import { init } from '../../src/commands/init.js';
import { evaluate } from '../../src/commands/verify.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const BRAIN_IS_CODE = ['doors: [agents]', 'repos:', '  brain: .', ''].join('\n');

/** Scratch brain with `repos: { brain: . }` and one sibling repo declared. */
function brainIsCode(): string {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-bfc-')));
  writeFileSync(join(eco.brain, '.multivac/config.yml'), BRAIN_IS_CODE);
  return eco.brain;
}

const capture = async (fn: () => Promise<number>): Promise<{ code: number; out: string }> => {
  const lines: string[] = [];
  const orig = console.log;
  console.log = (l: string) => lines.push(String(l));
  try {
    return { code: await fn(), out: lines.join('\n') };
  } finally {
    console.log = orig;
  }
};

test('config: brain: . is brain==code; brain: elsewhere is still refused', async () => {
  const brain = brainIsCode();
  const cfg = await loadConfig(brain);
  assert.equal(cfg.repos.brain.isBrain, true);

  writeFileSync(
    join(brain, '.multivac/config.yml'),
    'doors: [agents]\nrepos:\n  brain: ../acme-api\n',
  );
  await assert.rejects(loadConfig(brain), (e: Error) => {
    assert.ok(e instanceof ConfigError);
    assert.match(e.message, /repos\.brain must be the brain itself \(path \.\)/);
    return true;
  });

  writeFileSync(join(brain, '.multivac/config.yml'), 'doors: [agents]\nrepos:\n  "*": ../x\n');
  await assert.rejects(loadConfig(brain), /reserved key/);
});

test('doors: the brain keeps the brain door, never a consumer door', async () => {
  const brain = brainIsCode();
  const { code, out } = await capture(() => doorsCommand.run([], { cwd: brain }));
  assert.equal(code, 0);
  assert.match(out, /brain==code/);
  const door = readFileSync(join(brain, 'AGENTS.md'), 'utf8');
  assert.match(door, /brain door/);
  assert.match(door, /anchors target `brain:<glob>`/);
  assert.doesNotMatch(door, /consumer door/);
  assert.doesNotMatch(door, /mounted at/);
});

test('doctor: brain==code needs no mount, no pin, no "add repos:" nudge', async () => {
  const brain = brainIsCode();
  const { lines, exit } = await doctorReport(brain);
  assert.equal(exit, 0);
  const repos = lines.find((l) => l.startsWith('repos'));
  const pins = lines.find((l) => l.startsWith('pins'));
  assert.match(String(repos), /1\/1 present · brain: brain==code \(this repo\)/);
  assert.doesNotMatch(String(repos), /add repos:/);
  assert.match(String(pins), /brain==code — no mount to pin/);
  assert.doesNotMatch(String(pins), /submodule add/);
});

test('change: brain is a lifecycle repo key, declared or not', async () => {
  const brain = brainIsCode();
  const ctx = { cwd: brain };
  assert.equal(await change.run(['new', 'law-row', 'Law row'], ctx), 0);
  const file = join(brain, '.multivac/changes/law-row.md');
  writeFileSync(
    file,
    readFileSync(file, 'utf8').replace(
      'repos: {}\nlanding_order: []',
      'repos:\n  brain:\n    status: planned\nlanding_order:\n  - - brain',
    ),
  );
  const plan = await capture(() => change.run(['plan', 'law-row'], ctx));
  assert.equal(plan.code, 0);
  assert.match(plan.out, /brain: .*\(brain==code\)/);

  // undeclared brain: the reserved handle still resolves to the brain root
  writeFileSync(join(brain, '.multivac/config.yml'), 'doors: [agents]\n');
  const bare = await capture(() => change.run(['plan', 'law-row'], ctx));
  assert.equal(bare.code, 0);
  assert.match(bare.out, /brain==code/);

  writeFileSync(join(brain, '.multivac/config.yml'), BRAIN_IS_CODE);
  const applied = await capture(() => change.run(['apply', 'law-row'], ctx));
  assert.equal(applied.code, 0);
  assert.equal(
    execFileSync('git', ['-C', brain, 'rev-parse', '--abbrev-ref', 'HEAD'], {
      encoding: 'utf8',
    }).trim(),
    'law-row',
  );
});

test('verify: a brain==code entry scans the brain once, not twice', async () => {
  const brain = brainIsCode();
  writeFileSync(
    join(brain, '.multivac/invariants.md'),
    [
      '| ID | statement | authority | state | date | source |',
      '| --- | --- | --- | --- | --- | --- |',
      '| INV-01 | the door exists | specified | active | 2026-08-13 | brain |',
      '<!-- @anchor INV-01 *:AGENTS.md /acme brain/ unique -->',
      '',
    ].join('\n'),
  );
  execFileSync('git', ['-C', brain, 'add', '-A']);
  execFileSync('git', ['-C', brain, 'commit', '-q', '-m', 'law']);
  // Two handles name one directory; `unique` would see two matches if the
  // brain were scanned once per key.
  const report = await evaluate(brain);
  assert.equal(report.claims[0].state, 'ok');
});

test('init: a repo that already has source gets the brain==code idiom', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-bfc-init-'));
  gitInit(dir);
  writeFileSync(join(dir, 'index.js'), 'export const app = 1;\n');
  execFileSync('git', ['-C', dir, 'add', '-A']);
  execFileSync('git', ['-C', dir, 'commit', '-q', '-m', 'source']);

  assert.equal(await init.run([], { cwd: dir }), 0);
  const yml = readFileSync(join(dir, '.multivac/config.yml'), 'utf8');
  assert.match(yml, /# brain==code: this repo is both the brain and the code/);
  assert.match(yml, /^repos:\n {2}brain: \.$/m);
  const cfg = await loadConfig(dir);
  assert.equal(cfg.repos.brain.isBrain, true);

  // empty repo: no repos map, just the commented example
  const empty = mkdtempSync(join(tmpdir(), 'mvac-bfc-empty-'));
  assert.equal(await init.run([], { cwd: empty }), 0);
  assert.match(readFileSync(join(empty, '.multivac/config.yml'), 'utf8'), /^# repos:$/m);
});

test('a symlinked alias is the same tree: brain==code, and scanned once', async () => {
  const brain = brainIsCode();
  // `alias` reaches the brain through a symlink — a different spelling, one
  // directory. Comparing resolve()d strings missed it: the brain became a
  // "consumer repo" (mount nagging) and a second scan of its own files, so
  // every `*` leg saw each match twice.
  symlinkSync(brain, join(brain, '..', 'brain-link'));
  writeFileSync(
    join(brain, '.multivac/config.yml'),
    'doors: [agents]\nrepos:\n  brain: .\n  alias: ../brain-link\n',
  );
  writeFileSync(
    join(brain, '.multivac/invariants.md'),
    [
      '| ID | statement | authority | state | date | source |',
      '| --- | --- | --- | --- | --- | --- |',
      '| INV-02 | the door exists | specified | active | 2026-08-13 | brain |',
      '<!-- @anchor INV-02 *:AGENTS.md /acme brain/ unique -->',
      '',
    ].join('\n'),
  );
  execFileSync('git', ['-C', brain, 'add', '-A']);
  execFileSync('git', ['-C', brain, 'commit', '-q', '-m', 'law']);

  const cfg = await loadConfig(brain);
  assert.equal(cfg.repos.alias.isBrain, true, 'a symlinked path to the brain IS the brain');

  const report = await evaluate(brain);
  assert.equal(report.claims[0].state, 'ok', JSON.stringify(report.claims[0].legs));
  assert.equal(report.claims[0].legs[0].matchCount, 1);

  // and doctor stops telling the brain to submodule itself
  const { lines } = await doctorReport(brain);
  const pins = lines.find((l) => l.startsWith('pins'));
  assert.match(String(pins), /brain==code — no mount to pin/);
});
