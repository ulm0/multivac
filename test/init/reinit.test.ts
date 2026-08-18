// MV-91: re-running `init` on a brain that already has a config never silently
// disagrees with it. The defect was measured, not reasoned about: `init --sdd
// speckit` then `init --sdd opsx` left `sdd: speckit` in the config and
// `Features gate through the \`opsx\` SDD` in the door.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initRepo } from '../helpers/fixture.js';
import { init } from '../../src/commands/init.js';

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

/** A git repo with one tracked file, so the brain reads as brain==code. */
function repo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-reinit-'));
  // MV-24: the shared fixture is the only place that initialises a repo.
  initRepo(dir, { 'a.ts': 'export const a = 1;\n' });
  return dir;
}

const cfgOf = (dir: string): string => readFileSync(join(dir, '.multivac/config.yml'), 'utf8');
const status = (dir: string): string =>
  execFileSync('git', ['-C', dir, 'status', '--porcelain'], { encoding: 'utf8' });

test('a flag disagreeing with the config refuses, naming both values', async () => {
  const dir = repo();
  await capture(() => init.run(['--sdd', 'speckit', '--quiet', dir], { cwd: dir }));
  const c = await capture(() => init.run(['--sdd', 'opsx', dir], { cwd: dir }));
  assert.equal(c.code, 1);
  assert.match(c.out, /init refused — \.multivac\/config\.yml already declares sdd: speckit and --sdd says opsx/);
  assert.match(c.out, /the config is authoritative on a re-run/);
  assert.match(c.out, /change it in \.multivac\/config\.yml then run `multivac doors`, or drop --sdd/);
});

test('a refused run writes nothing at all', async () => {
  const dir = repo();
  await capture(() => init.run(['--sdd', 'speckit', '--quiet', dir], { cwd: dir }));
  execFileSync('git', ['-C', dir, 'add', '-A']);
  execFileSync('git', ['-C', dir, 'commit', '-qm', 'init']);
  const before = status(dir);
  const doorBefore = readFileSync(join(dir, 'AGENTS.md'), 'utf8');

  const c = await capture(() => init.run(['--sdd', 'opsx', dir], { cwd: dir }));
  assert.equal(c.code, 1);
  assert.equal(status(dir), before);
  assert.equal(readFileSync(join(dir, 'AGENTS.md'), 'utf8'), doorBefore);
  // The door never learned the word.
  assert.equal(doorBefore.includes('opsx'), false);
});

test('two disagreements produce one refusal naming both', async () => {
  const dir = repo();
  await capture(() => init.run(['--sdd', 'speckit', '--grapher', 'graphify', '--quiet', dir], { cwd: dir }));
  const c = await capture(() => init.run(['--sdd', 'opsx', '--grapher', 'codegraph', dir], { cwd: dir }));
  assert.equal(c.code, 1);
  assert.match(c.out, /already declares sdd: speckit and --sdd says opsx/);
  assert.match(c.out, /already declares grapher: graphify and --grapher says codegraph/);
  assert.match(c.out, /or drop --sdd and --grapher/);
});

test('a flag that agrees is accepted and reported as already declared', async () => {
  const dir = repo();
  await capture(() => init.run(['--sdd', 'speckit', '--quiet', dir], { cwd: dir }));
  const c = await capture(() => init.run(['--sdd', 'speckit', dir], { cwd: dir }));
  assert.equal(c.code, 0);
  assert.match(c.out, /--sdd speckit is already what it declares — nothing to change/);
  assert.equal(c.out.includes('refused'), false);
});

test('a flag the config declares none of is reported, never refused', async () => {
  const dir = repo();
  await capture(() => init.run(['--quiet', dir], { cwd: dir }));
  assert.equal(/^sdd:/m.test(cfgOf(dir)), false);
  const c = await capture(() => init.run(['--sdd', 'speckit', dir], { cwd: dir }));
  assert.equal(c.code, 0);
  assert.match(c.out, /--sdd speckit is not in it: add `sdd: speckit` there, then `multivac doors`/);
  // Reported, and still not written: the config is only ever edited by hand.
  assert.equal(/^sdd:/m.test(cfgOf(dir)), false);
});

test('a re-run with no flags reports nothing extra', async () => {
  const dir = repo();
  await capture(() => init.run(['--sdd', 'speckit', '--quiet', dir], { cwd: dir }));
  const c = await capture(() => init.run([dir], { cwd: dir }));
  assert.equal(c.code, 0);
  assert.match(c.out, /config\.yml kept/);
  assert.equal(c.out.includes('already what it declares'), false);
  assert.equal(c.out.includes('is not in it'), false);
});

test('a first run is unchanged: the flags write the config and the door', async () => {
  const dir = repo();
  const c = await capture(() => init.run(['--sdd', 'speckit', '--grapher', 'graphify', dir], { cwd: dir }));
  assert.equal(c.code, 0);
  assert.match(cfgOf(dir), /^sdd: speckit$/m);
  assert.match(cfgOf(dir), /^grapher: graphify$/m);
  assert.match(readFileSync(join(dir, 'AGENTS.md'), 'utf8'), /speckit/);
  assert.ok(existsSync(join(dir, '.multivac/invariants.md')));
});

test('the door and the config can never name different adapters', async () => {
  const dir = repo();
  await capture(() => init.run(['--sdd', 'speckit', '--quiet', dir], { cwd: dir }));
  // Every route a flag could take on a re-run: refused, or agreeing.
  for (const flag of ['opsx', 'speckit']) {
    await capture(() => init.run(['--sdd', flag, dir], { cwd: dir }));
    const door = readFileSync(join(dir, 'AGENTS.md'), 'utf8');
    const declared = /^sdd: (\S+)$/m.exec(cfgOf(dir))?.[1];
    assert.equal(declared, 'speckit');
    assert.equal(door.includes('opsx'), false, `door named opsx after --sdd ${flag}`);
  }
});
