// MV-123: one lookup finds an adapter's binaries, in the root the command runs
// in, and every surface asks it. Two rules used to answer: the validator and
// the scaffold looked in node_modules/.bin, while doctor, doors, the refresh at
// close and the graph gate looked on PATH alone — so with `openspec` installed
// as a project dependency, doctor said missing for the validator the apply gate
// ran from that very directory.
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
import { loadChange, saveChange } from '../../src/change/file.js';
import { grapherSpec, sddSpec, type AdapterSpec } from '../../src/adapters/registry.js';

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
  write(
    join(dir, 'graphify'),
    `#!/bin/sh\necho graphify-${label} >> '${marker}'\nmkdir -p graphify-out\necho '{}' > graphify-out/graph.json\n`,
    0o755,
  );
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

/** One brain, opsx + graphify, walked through every surface with the stubs placed as `where`. */
async function walk(where: Placement) {
  const tmp = mkdtempSync(join(tmpdir(), `mvac-lookup-${where}-`));
  const brain = join(tmp, 'acme-brain');
  initRepo(brain, {
    'AGENTS.md': '# door\n',
    '.multivac/config.yml': 'doors: [agents, claude]\nsdd: opsx\ngrapher: graphify\nrepos:\n  brain: .\n',
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
    // The graph MV-103 wants committed, where the build could run.
    if (existsSync(join(brain, 'graphify-out/graph.json'))) {
      git(brain, 'add', '--', 'graphify-out');
      git(brain, 'commit', '-q', '-m', 'graph');
    }
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
    const hook = settings.hooks.PostToolUse.flatMap((e) => e.hooks.map((h) => h.command)).find((c) =>
      c.includes('graphify update .'),
    );
    return {
      brain,
      created,
      doctor,
      doctorAfter,
      applied,
      closed,
      doors,
      hook,
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
    assert.match(r.created.out, /graph graphify @ brain: built \(`graphify update \.`\)/, 'the build reaches it');
    assert.equal(r.closed.code, 0, `close passes its graph gate: ${r.closed.out}`);
    assert.match(r.closed.out, /graph graphify @ brain: refreshed \(`graphify update \.`\)/, 'the refresh reaches it');
    assert.match(r.doctorAfter.find((l) => l.startsWith('grapher') && l.includes('graphify @ brain'))!, /binary ok/);
    assert.ok(r.hook, 'doors wires the post-edit refresh');
    assert.deepEqual(missingLines(`${r.created.out}\n${r.applied.out}\n${r.closed.out}`), []);
    const label = where === 'local' ? 'local' : 'path';
    // What runs is what was found: the PATH copy wins where both exist.
    assert.deepEqual([...new Set(r.ran)].sort(), [`graphify-${label}`, `openspec-${label}`]);
    if (where === 'local') assert.match(r.hook!, /\$PWD\/node_modules\/\.bin/);
  });
}

test('found nowhere: every surface agrees, each line names the vendor, and outcomes are unchanged', async () => {
  const r = await walk('nowhere');
  const opsx = sddSpec('opsx')!;
  const graphify = grapherSpec('graphify')!;
  assert.equal(r.created.code, 0, 'new still exits 0');
  assert.equal(r.applied.code, 1, 'apply still refuses');
  assert.equal(r.closed.code, 1, 'close still refuses');
  assert.equal((await doctorReport(r.brain)).exit, 0, 'doctor still exits 0');
  assert.equal(r.hook, undefined, 'doors wires no hook');
  assert.deepEqual(r.ran, []);

  // Each surface's lines, by the tag it prints: apply and close also build.
  const tagged = (out: string, tag: string): string[] => missingLines(out).filter((l) => l.includes(tag));
  assertNames(tagged(r.applied.out, 'sdd opsx:'), 'opsx', opsx, 'the validator');
  assertNames(tagged(r.created.out, 'graph graphify @'), 'graphify', graphify, 'the build');
  assert.match(r.created.out, /graph graphify @ brain: build skipped — `graphify` found on neither PATH nor brain's node_modules\/\.bin/);
  assertNames(tagged(r.closed.out, 'graph graphify @'), 'graphify', graphify, 'the build at close');
  assertNames(tagged(r.closed.out, '  brain: '), 'graphify', graphify, 'the graph gate');
  assert.deepEqual(missingLines(`${r.created.out}\n${r.applied.out}\n${r.closed.out}`).filter((l) => /opsx|openspec/.test(l) && !l.includes('sdd opsx:')), []);
  assert.match(r.closed.out, /roots? cannot be checked/);
  const doc = r.doctor.filter((l) => /^(sdd|grapher)/.test(l));
  assertNames(missingLines(doc.filter((l) => l.includes('opsx @')).join('\n')), 'opsx', opsx, 'doctor');
  assertNames(missingLines(doc.filter((l) => l.includes('graphify @')).join('\n')), 'graphify', graphify, 'doctor');
  const all = `${r.created.out}\n${r.applied.out}\n${r.closed.out}\n${r.doctor.join('\n')}`;
  assert.doesNotMatch(all, /not on PATH|binary not found/);
});

test('found nowhere, speckit and codegraph: the scaffold, the build, the gate and doctor name the vendor', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-lookup-sk-'));
  const brain = join(tmp, 'acme-brain');
  initRepo(brain, {
    'AGENTS.md': '# door\n',
    '.multivac/config.yml': 'doors: [agents]\nsdd: speckit\ngrapher: codegraph\nrepos:\n  brain: .\n',
    '.multivac/invariants.md':
      '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n',
  });
  const speckit = sddSpec('speckit')!;
  const codegraph = grapherSpec('codegraph')!;
  const ctx = { cwd: brain };
  await onPath(join(tmp, 'empty'), async () => {
    const created = await capture(() => change.run(['new', 'sk', 'Sk'], ctx));
    assert.equal(created.code, 0);
    const out = missingLines(created.out);
    assertNames(out.filter((l) => l.startsWith('sdd speckit')), 'speckit', speckit, 'the scaffold');
    assertNames(out.filter((l) => l.startsWith('graph codegraph')), 'codegraph', codegraph, 'the build');
    const doctor = await doctorReport(brain);
    assert.equal(doctor.exit, 0);
    assertNames(missingLines(doctor.lines.filter((l) => l.includes('speckit @')).join('\n')), 'speckit', speckit, 'doctor');
    assertNames(missingLines(doctor.lines.filter((l) => l.includes('codegraph @')).join('\n')), 'codegraph', codegraph, 'doctor');

    await declareBrain(brain, 'sk');
    await capture(() => change.run(['apply', 'sk', '--no-sdd'], ctx));
    await capture(() => change.run(['land', 'sk', '--landed', 'brain', '--no-sdd'], ctx));
    const closed = await capture(() => change.run(['close', 'sk', '--no-sdd'], ctx));
    assert.equal(closed.code, 1, 'the graph gate still refuses');
    assertNames(missingLines(closed.out), 'codegraph', codegraph, 'the graph gate');
  });
});

test('a declared grapher that is missing says where it was declared, and names no vendor', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-lookup-decl-'));
  const brain = join(tmp, 'acme-brain');
  initRepo(brain, {
    'AGENTS.md': '# door\n',
    '.multivac/config.yml':
      'doors: [agents]\ngrapher: fakegraph\ngraphers:\n  fakegraph:\n    artifact: fakegraph-out/graph.json\n    refresh: fakegraph update .\n    install: npm i -g fakegraph\nrepos:\n  brain: .\n',
    '.multivac/invariants.md':
      '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n',
  });
  await onPath(join(tmp, 'empty'), async () => {
    const c = await capture(() => change.run(['new', 'decl', 'Decl'], { cwd: brain }));
    const [line] = missingLines(c.out);
    assert.match(line, /`fakegraph` found on neither PATH nor brain's node_modules\/\.bin — install fakegraph: npm i -g fakegraph/);
    assert.match(line, /declared in \.multivac\/config\.yml/);
    assert.doesNotMatch(line, /https?:/);
  });
});

test("a copy in api's node_modules/.bin runs in api and leaves the brain's missing", async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-lookup-sib-'));
  const eco = makeScratchEcosystem(tmp);
  writeFileSync(join(eco.brain, '.multivac/config.yml'), 'doors: [agents]\ngrapher: graphify\nrepos:\n  api: ../acme-api\n');
  stubs(join(eco.repos.api, 'node_modules', '.bin'), 'local', join(tmp, 'ran'));
  await onPath(join(tmp, 'empty'), async () => {
    const c = await capture(() => change.run(['new', 'sib', 'Sib'], { cwd: eco.brain }));
    assert.match(c.out, /graph graphify @ api: built \(`graphify update \.`\)/);
    assert.match(c.out, /graph graphify @ brain: build skipped — `graphify` found on neither PATH nor brain's node_modules\/\.bin/);
    const doctor = (await doctorReport(eco.brain)).lines.filter((l) => l.startsWith('grapher'));
    assert.match(doctor.find((l) => l.includes('graphify @ api'))!, /binary ok/);
    assert.match(doctor.find((l) => l.includes('graphify @ brain'))!, /binary missing → `graphify` found on neither/);
  });
});
