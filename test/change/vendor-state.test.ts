// MV-124 across the surfaces: `change new`, `apply`, `close`, `doctor` and
// `doors` act on the vendor's own state files, and every run carries the
// opt-outs its entry declares.
//
// Tools are STUBS on a PATH this file builds — `<bin>:/usr/bin:/bin` — never
// the host's (Principle IV). Each stub writes what the real tool writes, and
// appends its argv, or the environment it saw, to a marker.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { initRepo } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { doctorReport } from '../../src/commands/doctor.js';
import { doorsCommand } from '../../src/commands/doors.js';
import { loadChange, saveChange } from '../../src/change/file.js';
import { SPECKIT_INTEGRATION_JSON } from '../helpers/recorded.js';

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

const LAW = '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n';

const write = (file: string, body: string, mode?: number): void => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body);
  if (mode !== undefined) chmodSync(file, mode);
};

const lines = (file: string): string[] => (existsSync(file) ? readFileSync(file, 'utf8').split('\n').filter(Boolean) : []);

/** A brain repo with `config` and `files` committed, a stub bin, and its marker. */
function brainWith(config: string, files: Record<string, string> = {}) {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-vstate-'));
  const brain = join(tmp, 'acme-brain');
  initRepo(brain, { 'AGENTS.md': '# door\n', '.multivac/config.yml': config, '.multivac/invariants.md': LAW, ...files });
  const bin = join(tmp, 'bin');
  mkdirSync(bin, { recursive: true });
  return { tmp, brain, bin, marker: join(tmp, 'ran'), ctx: { cwd: brain } };
}

/** Run `fn` with PATH built from `bin`, and the parent opting IN to tracking. */
async function inEnv<T>(bin: string, fn: () => Promise<T>): Promise<T> {
  const keys = ['PATH', 'DO_NOT_TRACK', 'OPENSPEC_TELEMETRY'];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  process.env.PATH = [bin, '/usr/bin', '/bin'].join(delimiter);
  process.env.DO_NOT_TRACK = '0';
  for (const k of keys.slice(2)) delete process.env[k];
  try {
    return await fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

/** Open `slug` on the brain alone and walk it to just before close. */
async function toClose(brain: string, slug: string): Promise<void> {
  const ctx = { cwd: brain };
  await capture(() => change.run(['new', slug, slug], ctx));
  const parsed = await loadChange(brain, slug);
  parsed.change.repos = { brain: { status: 'planned' } };
  parsed.change.landing_order = [['brain']];
  parsed.change.invariants.adds = [];
  await saveChange(brain, parsed);
  await capture(() => change.run(['apply', slug, '--no-sdd'], ctx));
  await capture(() => change.run(['land', slug, '--landed', 'brain', '--no-sdd'], ctx));
}

// --- SC-002: the measured cases ---

test('a hand-made .specify is partial: change new runs no init and warns, and doctor says so', async () => {
  const b = brainWith('doors: [agents]\nsdd: speckit\nrepos:\n  brain: .\n');
  mkdirSync(join(b.brain, '.specify'));
  write(join(b.bin, 'specify'), `#!/bin/sh\necho "$@" >> '${b.marker}'\n`, 0o755);
  await inEnv(b.bin, async () => {
    const c = await capture(() => change.run(['new', 'by-hand', 'By hand'], b.ctx));
    assert.equal(c.code, 0);
    assert.deepEqual(lines(b.marker), [], 'the init ran over a directory made by hand');
    assert.match(c.out, /sdd speckit: brain is partial — \.specify is there and \.specify\/integration\.json is not/);
    const sdd = (await doctorReport(b.brain)).lines.find((l) => l.startsWith('sdd') && l.includes('speckit @ brain'))!;
    assert.match(sdd, /speckit @ brain: partial \(\.specify is there and \.specify\/integration\.json is not\) — the lifecycle will not run the init over it, since a re-run can revert edited files; run `specify init /);
  });
});

test('an unreadable integration.json runs no init and says it cannot be read', { skip: process.getuid?.() === 0 }, async () => {
  const b = brainWith('doors: [agents]\nsdd: speckit\nrepos:\n  brain: .\n');
  write(join(b.brain, '.specify/integration.json'), SPECKIT_INTEGRATION_JSON, 0o000);
  write(join(b.bin, 'specify'), `#!/bin/sh\necho "$@" >> '${b.marker}'\n`, 0o755);
  try {
    await inEnv(b.bin, async () => {
      const c = await capture(() => change.run(['new', 'locked', 'Locked'], b.ctx));
      assert.deepEqual(lines(b.marker), []);
      assert.match(c.out, /sdd speckit: brain is unevaluable — cannot read \.specify\/integration\.json: EACCES/);
      // Unreadable is a permissions problem: doctor names no init for it.
      const sdd = (await doctorReport(b.brain)).lines.find((l) => l.startsWith('sdd') && l.includes('speckit @ brain'))!;
      assert.match(sdd, /speckit @ brain: unevaluable \(cannot read \.specify\/integration\.json: EACCES\) — make it readable; no init is run over it · /);
      assert.doesNotMatch(sdd, /specify init/);
    });
  } finally {
    chmodSync(join(b.brain, '.specify/integration.json'), 0o644);
  }
});

test('opsx specs without its config are partial: warned with the install line, and nothing runs', async () => {
  const b = brainWith('doors: [agents]\nsdd: opsx\nrepos:\n  brain: .\n', { 'openspec/specs/auth/spec.md': '# Auth\n' });
  write(join(b.bin, 'openspec'), `#!/bin/sh\necho "$@" >> '${b.marker}'\n`, 0o755);
  await inEnv(b.bin, async () => {
    const c = await capture(() => change.run(['new', 'half', 'Half'], b.ctx));
    assert.deepEqual(lines(b.marker), []);
    assert.match(c.out, /sdd opsx: brain is partial — openspec is there and openspec\/config\.yaml or openspec\/config\.yml is not — the init is not run over it.*run `openspec init --tools none --no-animation \.` in brain yourself/);
  });
});

// --- SC-003: the opt-outs are applied on every run ---

test("opsx's validator at apply runs with the entry's opt-outs over the parent's", async () => {
  const b = brainWith('doors: [agents]\nsdd: opsx\nrepos:\n  brain: .\n', { 'openspec/config.yaml': 'schema: spec-driven\n' });
  write(join(b.bin, 'openspec'), `#!/bin/sh\necho "$DO_NOT_TRACK $OPENSPEC_TELEMETRY" >> '${b.marker}'\n`, 0o755);
  await inEnv(b.bin, async () => {
    await capture(() => change.run(['new', 'env-a', 'Env a'], b.ctx));
    write(join(b.brain, 'openspec/changes/env-a/proposal.md'), '# Proposal\n');
    write(join(b.brain, 'openspec/changes/env-a/tasks.md'), '- [x] 1.1 done\n');
    const c = await capture(() => change.run(['apply', 'env-a'], b.ctx));
    assert.deepEqual(lines(b.marker), ['1 0'], c.out);
  });
});
