// MV-123: one lookup finds an adapter's binaries, in the root the command runs
// in, and every surface asks it. Two rules used to answer: the validator and
// the scaffold looked in node_modules/.bin, while doctor looked on PATH alone —
// so with `openspec` installed as a project dependency, doctor said missing for
// the validator the apply gate ran from that very directory.
//
// Tools are STUBS on a PATH this file builds — `<bin>:/usr/bin:/bin` — never
// the host's (Principle IV).
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { initRepo, makeScratchEcosystem } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { doctorReport } from '../../src/commands/doctor.js';
import { doorsCommand } from '../../src/commands/doors.js';
import { reposCommand } from '../../src/commands/repos.js';
import { loadChange, saveChange } from '../../src/change/file.js';
import { sddSpec, type AdapterSpec } from '../../src/adapters/registry.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

/** Stdout AND stderr lines around a command; console.log alone for doors. */
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

const git = (cwd: string, ...args: string[]): void => {
  execFileSync('git', ['-C', cwd, ...args], { stdio: 'ignore' });
};

const write = (file: string, body: string, mode?: number): void => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body);
  if (mode !== undefined) chmodSync(file, mode);
};

/** Stubs that record which copy ran: `label` lands in `marker`. */
function stubs(dir: string, label: string, marker: string): void {
  write(join(dir, 'openspec'), `#!/bin/sh\necho openspec-${label} >> '${marker}'\nexit 0\n`, 0o755);
}

/** Run `fn` with PATH = `dir` then git's, restoring the old value. */
async function onPath<T>(dir: string, fn: () => Promise<T>): Promise<T> {
  const saved = process.env.PATH;
  process.env.PATH = [dir, '/usr/bin', '/bin'].join(delimiter);
  try {
    return await fn();
  } finally {
    process.env.PATH = saved;
  }
}

/** Declare the brain as the only repo of `slug`, with no law. */
async function declareBrain(brain: string, slug: string): Promise<void> {
  const parsed = await loadChange(brain, slug);
  parsed.change.repos = { brain: { status: 'planned' } };
  parsed.change.landing_order = [['brain']];
  parsed.change.invariants.adds = [];
  await saveChange(brain, parsed);
}

/** What every missing-binary line must name for this adapter (FR-006). */
function assertNames(lines: string[], name: string, spec: AdapterSpec, where: string): void {
  assert.ok(lines.length > 0, `${where}: no missing-binary line for ${name}`);
  for (const l of lines) {
    for (const part of [`\`${spec.required[0]}\``, name, spec.installHint, spec.source!, 'PATH', 'node_modules/.bin']) {
      assert.ok(l.includes(part), `${where}: "${l}" does not name ${part}`);
    }
  }
}

const missingLines = (out: string): string[] => out.split('\n').filter((l) => l.includes('found on neither PATH nor'));

type Placement = 'path' | 'local' | 'both' | 'nowhere';

/** One brain, opsx, walked through every surface with the stubs placed as `where`. */
async function walk(where: Placement) {
  const tmp = mkdtempSync(join(tmpdir(), `mvac-lookup-${where}-`));
  const brain = join(tmp, 'acme-brain');
  initRepo(brain, {
    'AGENTS.md': '# door\n',
    '.multivac/config.yml': 'doors: [agents, claude]\nsdd: opsx\nrepos:\n  brain: .\n',
    // Installed: this walks the binary lookup across surfaces, and since
    // MV-130 an opsx that is missing runs `openspec init --tools none` first.
    'openspec/config.yaml': 'schema: spec-driven\n',
    '.multivac/invariants.md':
      '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n',
  });
  const marker = join(tmp, 'ran');
  const pathBin = join(tmp, 'bin');
  mkdirSync(pathBin, { recursive: true });
  if (where === 'path' || where === 'both') stubs(pathBin, 'path', marker);
  if (where === 'local' || where === 'both') stubs(join(brain, 'node_modules', '.bin'), 'local', marker);
  const ctx = { cwd: brain };
  const slug = `lookup-${where}`;

  return onPath(pathBin, async () => {
    const created = await capture(() => change.run(['new', slug, `Lookup ${where}`], ctx));
    await declareBrain(brain, slug);
    write(join(brain, `openspec/changes/${slug}/tasks.md`), '- [x] 1.1 done\n');
    const doctor = (await doctorReport(brain)).lines;
    const applied = await capture(() => change.run(['apply', slug], ctx));
    if (applied.code !== 0) await capture(() => change.run(['apply', slug, '--no-sdd'], ctx));
    await capture(() => change.run(['land', slug, '--landed', 'brain'], ctx));
    write(join(brain, `openspec/changes/archive/2026-09-14-${slug}/proposal.md`), 'x\n');
    const closed = await capture(() => change.run(['close', slug], ctx));
    const doctorAfter = (await doctorReport(brain)).lines;
    const doors = await capture(() => doorsCommand.run([], ctx));
    const settings = JSON.parse(readFileSync(join(brain, '.claude/settings.json'), 'utf8')) as {
      hooks: { PostToolUse: { hooks: { command: string }[] }[] };
    };
    const hooks = settings.hooks.PostToolUse.flatMap((e) => e.hooks.map((h) => h.command));
    return {
      brain,
      created,
      doctor,
      doctorAfter,
      applied,
      closed,
      doors,
      hooks,
      ran: existsSync(marker) ? readFileSync(marker, 'utf8').split('\n').filter(Boolean) : [],
    };
  });
}

for (const where of ['path', 'local', 'both'] as const) {
  test(`found ${where === 'both' ? 'on PATH and in node_modules/.bin' : where === 'path' ? 'on PATH only' : 'in node_modules/.bin only'}: every surface agrees it is there`, async () => {
    const r = await walk(where);
    const sdd = r.doctor.find((l) => l.startsWith('sdd') && l.includes('opsx @ brain'))!;
    assert.match(sdd, /binary ok/, 'doctor finds the validator');
    assert.equal(r.applied.code, 0, `apply runs the validator: ${r.applied.out}`);
    assert.equal(r.closed.code, 0, `close passes: ${r.closed.out}`);
    assert.match(r.doctorAfter.find((l) => l.startsWith('sdd') && l.includes('opsx @ brain'))!, /binary ok/);
    assert.deepEqual(r.hooks, ['mvac verify >&2 || exit 2'], 'doors wires the verify gate alone');
    assert.deepEqual(missingLines(`${r.created.out}\n${r.applied.out}\n${r.closed.out}`), []);
    const label = where === 'local' ? 'local' : 'path';
    // What runs is what was found: the PATH copy wins where both exist.
    assert.deepEqual([...new Set(r.ran)].sort(), [`openspec-${label}`]);
  });
}

test('found nowhere: every surface agrees, each line names the vendor, and apply still refuses', async () => {
  const r = await walk('nowhere');
  const opsx = sddSpec('opsx')!;
  assert.equal(r.created.code, 0, 'new still exits 0');
  assert.equal(r.applied.code, 1, 'apply still refuses');
  assert.equal(r.closed.code, 0, `close gates on no graph: ${r.closed.out}`);
  assert.equal((await doctorReport(r.brain)).exit, 0, 'doctor still exits 0');
  assert.deepEqual(r.hooks, ['mvac verify >&2 || exit 2'], 'doors wires the verify gate alone');
  assert.deepEqual(r.ran, []);

  // Each surface's lines, by the tag it prints.
  const tagged = (out: string, tag: string): string[] => missingLines(out).filter((l) => l.includes(tag));
  assertNames(tagged(r.applied.out, 'sdd opsx:'), 'opsx', opsx, 'the validator');
  assert.deepEqual(missingLines(`${r.created.out}\n${r.applied.out}\n${r.closed.out}`).filter((l) => /opsx|openspec/.test(l) && !l.includes('sdd opsx:')), []);
  const doc = r.doctor.filter((l) => /^sdd/.test(l));
  assertNames(missingLines(doc.filter((l) => l.includes('opsx @')).join('\n')), 'opsx', opsx, 'doctor');
  const all = `${r.created.out}\n${r.applied.out}\n${r.closed.out}\n${r.doctor.join('\n')}`;
  assert.doesNotMatch(all, /not on PATH|binary not found/);
});
