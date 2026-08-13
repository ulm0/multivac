// doctor on a scratch ecosystem: full report, read-only, exit 0 unless the
// config itself is invalid.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { doctorReport } from '../../src/commands/doctor.js';
import { installHooks } from '../../src/hooks/install.js';

const line = (lines: string[], section: string): string => {
  const l = lines.find((x) => x.startsWith(section));
  assert.ok(l, `no "${section}" line in:\n${lines.join('\n')}`);
  return l;
};

test('doctor: one repo missing, adapters undeclared stay silent, exit 0', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-')));
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    `doors: [agents, claude]
repos:
  api: ../acme-api
  web: ../acme-web
  billing:
    path: ../acme-billing
    url: git@acme.example:acme/billing.git
`,
  );
  const { lines, exit } = await doctorReport(eco.brain);
  assert.equal(exit, 0);

  const doors = line(lines, 'doors');
  // fixture AGENTS.md is hand-written, doors never projected into it
  assert.match(doors, /agents: AGENTS\.md missing managed block/);
  assert.match(doors, /claude: CLAUDE\.md missing → run `multivac doors`/);

  // not declared: not even a notice
  assert.equal(lines.some((l) => l.startsWith('sdd')), false);
  assert.equal(lines.some((l) => l.startsWith('grapher')), false);

  const repos = line(lines, 'repos');
  assert.match(repos, /2\/3 present/);
  assert.match(repos, /billing missing → `multivac repos sync`/);
  assert.match(repos, /git clone git@acme\.example:acme\/billing\.git/);

  const pins = line(lines, 'pins');
  assert.match(pins, /api: no brain mount at \.brain/);
  assert.match(pins, /billing: not cloned/);

  const hooks = line(lines, 'hooks');
  assert.match(hooks, /core\.hooksPath unset → git config core\.hooksPath/);
  assert.match(hooks, /pre-commit missing/);
});

test('doctor: url-only repo is declared-only — valid config, exit 0', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-url-')));
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    `doors: [agents]
repos:
  api: ../acme-api
  pagos:
    url: git@acme.example:acme/pagos.git
`,
  );
  const { lines, exit } = await doctorReport(eco.brain);
  assert.equal(exit, 0); // not "config invalid"
  const repos = line(lines, 'repos');
  assert.match(repos, /1\/2 present/);
  assert.match(repos, /pagos missing → `multivac repos sync`/);
  assert.match(repos, /git clone git@acme\.example:acme\/pagos\.git \.\.\/pagos/);
});

test('doctor: declared sdd with nothing present is a notice, still exit 0', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc2-')));
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    `doors: [agents]
sdd: opsx
repos:
  api: ../acme-api
`,
  );
  const old = process.env.PATH;
  process.env.PATH = eco.brain; // no binaries findable
  try {
    const { lines, exit } = await doctorReport(eco.brain);
    assert.equal(exit, 0);
    const sdd = line(lines, 'sdd');
    assert.match(sdd, /opsx: artifact missing/);
    assert.match(sdd, /binary missing → npm i -g @openspec\/cli/);
    assert.match(sdd, /feature off until installed — not an error/);
  } finally {
    process.env.PATH = old;
  }
});

test('doctor: symlink door ok, stale graph warned, fresh graph quiet', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc3-')));
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    `doors: [claude]
grapher: acmegraph
repos: {}
`,
  );
  symlinkSync('AGENTS.md', join(eco.brain, 'CLAUDE.md'));
  // fake grapher binary on PATH
  const binDir = join(eco.brain, '..', 'fakebin');
  mkdirSync(binDir, { recursive: true });
  writeFileSync(join(binDir, 'acmegraph'), '#!/bin/sh\nexit 0\n');
  chmodSync(join(binDir, 'acmegraph'), 0o755);
  // artifact older than the last commit -> stale
  mkdirSync(join(eco.brain, 'acmegraph-out'), { recursive: true });
  const graph = join(eco.brain, 'acmegraph-out', 'graph.json');
  writeFileSync(graph, '{}');
  utimesSync(graph, new Date(1000), new Date(1000));

  const old = process.env.PATH;
  process.env.PATH = [binDir, old].join(delimiter);
  try {
    let { lines, exit } = await doctorReport(eco.brain);
    assert.equal(exit, 0);
    assert.match(line(lines, 'doors'), /claude: CLAUDE\.md ok \(symlink\)/);
    let grapher = line(lines, 'grapher');
    assert.match(grapher, /acmegraph @ brain: artifact ok · binary ok · graph STALE/);
    assert.match(grapher, /→ run `acmegraph update \.` there/);

    // touch the artifact past the commit -> fresh
    const now = new Date();
    utimesSync(graph, now, now);
    ({ lines, exit } = await doctorReport(eco.brain));
    assert.match(line(lines, 'grapher'), /artifact ok · binary ok · fresh/);
  } finally {
    process.env.PATH = old;
  }
});

test('doctor: hooks installed but inactive is a warning, active names the runner', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-hooks-')));
  await installHooks(eco.brain);

  // empty PATH: shims are on disk, nothing can run them
  const old = process.env.PATH;
  process.env.PATH = mkdtempSync(join(tmpdir(), 'mvac-empty-bin-'));
  try {
    let hooks = line((await doctorReport(eco.brain)).lines, 'hooks');
    assert.match(hooks, /pre-commit installed/);
    assert.match(hooks, /INACTIVE — no runnable multivac/);
    assert.match(hooks, /npm i -g multivac/);

    // built but not installed: still inactive. node would exit 1 on the first
    // bare import, and an exit 1 out of pre-commit blocks the commit.
    mkdirSync(join(eco.brain, 'dist'), { recursive: true });
    writeFileSync(join(eco.brain, 'dist/cli.js'), '// built\n');
    const binDir = join(eco.brain, '..', 'nodebin');
    mkdirSync(binDir, { recursive: true });
    writeFileSync(join(binDir, 'node'), '#!/bin/sh\nexit 0\n');
    chmodSync(join(binDir, 'node'), 0o755);
    process.env.PATH = binDir;
    assert.match(line((await doctorReport(eco.brain)).lines, 'hooks'), /INACTIVE/);

    // built AND installed: active, and it says which runner
    mkdirSync(join(eco.brain, 'node_modules'), { recursive: true });
    hooks = line((await doctorReport(eco.brain)).lines, 'hooks');
    assert.match(hooks, /active \(node dist\/cli\.js\)/);
    assert.equal(/INACTIVE/.test(hooks), false);
  } finally {
    process.env.PATH = old;
  }
});

test('doctor: invalid config is the one exit-1 case', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-doc4-'));
  mkdirSync(join(dir, '.multivac'), { recursive: true });
  writeFileSync(join(dir, '.multivac/config.yml'), 'doors: "not-a-list"\n');
  const { lines, exit } = await doctorReport(dir);
  assert.equal(exit, 1);
  assert.match(line(lines, 'config'), /invalid/);
});

test('doctor: untracked build-critical files are a warning, scratch notes are not', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-untracked-')));
  // never `git add`ed: the file the build reads, and a note nobody builds with
  writeFileSync(join(eco.brain, 'tsconfig.test.json'), '{"extends": "./tsconfig.json"}\n');
  mkdirSync(join(eco.brain, 'notes'), { recursive: true });
  writeFileSync(join(eco.brain, 'notes/scratch.md'), 'thinking out loud\n');

  const { lines, exit } = await doctorReport(eco.brain);
  assert.equal(exit, 0); // a warning never gates: doctor diagnoses
  const untracked = line(lines, 'untracked');
  assert.match(untracked, /untracked — git add or ignore/);
  assert.match(untracked, /tsconfig\.test\.json \(brain, root config\)/);
  assert.equal(/scratch\.md/.test(untracked), false);
});

test('doctor: package.json scripts and anchor globs make a file build-critical', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-untracked2-')));
  writeFileSync(
    join(eco.brain, 'invariants.md'),
    `# Invariants

| ID | statement | authority | state | date | source |
| --- | --- | --- | --- | --- | --- |
| ACME-1 | the api ships a server | specified | active | 2026-08-13 | [x](x) |
<!-- @anchor ACME-1 api:src/**.ts /listen/ -->
`,
  );
  writeFileSync(
    join(eco.brain, 'package.json'),
    JSON.stringify({ scripts: { build: 'sh tools/build.sh' } }) + '\n',
  );
  mkdirSync(join(eco.brain, 'tools'), { recursive: true });
  writeFileSync(join(eco.brain, 'tools/build.sh'), 'echo build\n');
  // untracked in another declared repo, covered by that repo's anchor glob
  writeFileSync(join(eco.repos.api, 'src/routes.ts'), 'export const listen = 1;\n');
  writeFileSync(join(eco.repos.api, 'src/notes.txt'), 'scratch\n');

  const { lines, exit } = await doctorReport(eco.brain);
  assert.equal(exit, 0);
  const untracked = line(lines, 'untracked');
  assert.match(untracked, /tools\/build\.sh \(brain, package\.json script\)/);
  assert.match(untracked, /src\/routes\.ts \(api, anchor glob\)/);
  assert.equal(/notes\.txt/.test(untracked), false);
});

test('doctor: a tree with nothing untracked says so', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-untracked3-')));
  assert.match(
    line((await doctorReport(eco.brain)).lines, 'untracked'),
    /nothing build-critical untracked/,
  );
});
