// doctor on a scratch ecosystem: full report, read-only, exit 0 unless the
// config itself is invalid.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { makeScratchEcosystem, publishRepo } from '../helpers/fixture.js';
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
    // The scope is part of the verdict now (MV-87): a root, not an ecosystem.
    assert.match(sdd, /opsx @ brain: artifact missing/);
    // No init was verified for this tool, so none is named: the clause below
    // belongs to the adapter that declares a scaffold, not to every absence.
    assert.doesNotMatch(sdd, /declared but never run here/);
    assert.match(sdd, /binary missing → npm i -g @fission-ai\/openspec/);
    assert.match(sdd, /sdd_auto on — the lifecycle prints this tool's own steps and refuses/);
    // The flow lines name every step and what proves it.
    const all = lines.filter((l) => l.startsWith('sdd')).join('\n');
    assert.match(all, /flow — new: run \/opsx:propose <slug>/);
    assert.match(all, /flow — land: run \/opsx:archive <slug>/);
    assert.match(all, /ungateable: apply leaves no artifact of its own/);
    // ...and one line says exactly which lifecycle commands refuse.
    assert.match(all, /gates — change plan: refuses without openspec\/changes\/<slug>\/proposal\.md/);
    assert.match(all, /change close: refuses without openspec\/changes\/archive\/\*-<slug>/);
    // OpenSpec has no project-level document; doctor says so rather than inventing one.
    assert.match(all, /project law — this tool has no project-level document/);
  } finally {
    process.env.PATH = old;
  }
});

/**
 * Declared but never run here: doctor NAMES the tool's own init and says who
 * runs it, because naming is all it may do — that command downloads templates
 * and MV-01 keeps this report offline. Gone the moment the artifact is there:
 * the clause reports a state, it is not decoration on every absence.
 */
test('doctor: a declared-but-unscaffolded sdd names the init, and says it never runs it', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-scaffold-')));
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    'doors: [agents]\nsdd: speckit\nrepos:\n  api: ../acme-api\n',
  );
  const sddLine = async (): Promise<string> => line((await doctorReport(eco.brain)).lines, 'sdd');

  const never = await sddLine();
  assert.match(never, /artifact missing \(looked for \.specify\)/);
  assert.match(
    never,
    /declared but never run here; `change new` runs the tool's own `specify init --here --integration claude --force`, doctor never does \(it reaches the network\)/,
  );

  // Once it has run here there is no such state to report, and no command to
  // name: doctor drops the clause instead of nagging about a done thing.
  mkdirSync(join(eco.brain, '.specify'), { recursive: true });
  const after = await sddLine();
  assert.match(after, /artifact ok/);
  assert.doesNotMatch(after, /declared but never run here/);
});

/**
 * The project-level document, as `doctor` sees it. Missing names the command
 * that writes it; present-but-older-than-the-law's-newest-row is STALE — the
 * product's law moved while its constitution did not.
 *
 * `doctor` NEVER gates on any of it, and that is what the name says now: it
 * used to say "never gated" flat, which stopped being true when MV-76 made
 * `change plan` refuse over the first two states. What survives here is
 * doctor's own exit code — 0 through absent, template, STALE and fresh alike.
 * The gate is `test/change/sdd-gates.test.ts`'s business.
 */
test('doctor: the constitution is reported present, missing and stale — doctor never gates', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-const-')));
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    'doors: [agents]\nsdd: speckit\nrepos:\n  api: ../acme-api\n',
  );
  const lawRow = (date: string): void =>
    writeFileSync(
      join(eco.brain, '.multivac/invariants.md'),
      '# Invariants\n\n| ID | statement | authority | state | date | source |\n' +
        '| --- | --- | --- | --- | --- | --- |\n' +
        `| INV-01 | the law moved | specified | active | ${date} | [x](x) |\n`,
    );
  const sddLines = async (): Promise<string> =>
    (await doctorReport(eco.brain)).lines.filter((l) => l.startsWith('sdd')).join('\n');

  lawRow('2026-08-15');
  // Absent: the exact agent command that creates it.
  const missing = await sddLines();
  // Per root, and every root: the brain AND the declared repo. One repo's
  // constitution used to be reported as the whole product's (MV-87).
  assert.match(missing, /project law @ brain: \.specify\/memory\/constitution\.md missing → run \/speckit\.constitution/);
  assert.match(missing, /project law @ api: \.specify\/memory\/constitution\.md missing → run \/speckit\.constitution/);
  assert.match(missing, /project law — revisit: once at start, then on every principle change/);
  // The state `change plan` REFUSES over (MV-76) is the state doctor still
  // exits 0 on: doctor reports, and gating is somebody else's job.
  assert.equal((await doctorReport(eco.brain)).exit, 0);

  // Scaffolded is not written: spec-kit installs constitution.md as its own
  // unfilled template, so "present" would be a lie an untouched repo earns.
  const doc = join(eco.brain, '.specify/memory/constitution.md');
  mkdirSync(join(eco.brain, '.specify/memory'), { recursive: true });
  writeFileSync(doc, '# [PROJECT_NAME] Constitution\n\n## [PRINCIPLE_1_NAME]\n');
  assert.match(
    await sddLines(),
    /is still the unfilled template shipped by the tool \(placeholders remain\) → run \/speckit\.constitution/,
  );

  // Present but older than the law's newest row: drift, reported as such.
  writeFileSync(doc, '# Constitution\n');
  const old = new Date('2026-08-01T00:00:00Z').getTime() / 1000;
  utimesSync(doc, old, old);
  const stale = await sddLines();
  assert.match(stale, /present \(last modified 2026-08-01\) but the law's newest row is 2026-08-15 — STALE/);

  // A law that has not moved past it: fresh. Exit 0 throughout — a report.
  lawRow('2026-07-01');
  const fresh = await sddLines();
  assert.match(fresh, /present \(last modified 2026-08-01\).*— fresh/);
  assert.equal((await doctorReport(eco.brain)).exit, 0);
});

/**
 * MV-87: the SDD pass reports per root, the way the grapher pass always has.
 * It used to collapse every root into one boolean and stop at the first hit,
 * so one repo somebody had scaffolded by hand made an ecosystem of unequipped
 * repos read `artifact ok` — a green report over nothing, which is the exact
 * failure the tool exists to prevent.
 */
test('doctor: the sdd is reported per root, and an opted-out repo is scope, not a gap', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-perroot-')));
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    [
      'doors: [agents]',
      'sdd: speckit',
      'repos:',
      '  api: ../acme-api',
      '  web:',
      '    path: ../acme-web',
      '    sdd: none',
      '',
    ].join('\n'),
  );
  // Only api has ever been scaffolded — the repo somebody did by hand.
  mkdirSync(join(eco.repos.api, '.specify'), { recursive: true });

  const lines = (await doctorReport(eco.brain)).lines.filter((l) => l.startsWith('sdd'));
  const joined = lines.join('\n');

  // One line per declared, present root, each with its OWN verdict.
  assert.match(joined, /speckit @ brain: artifact missing \(looked for \.specify\)/);
  assert.match(joined, /speckit @ api: artifact ok/);
  // The opted-out repo is named as out of scope, never as a deficiency.
  assert.match(joined, /none @ web: no sdd declared for this repo — out of scope, not a gap/);
  assert.doesNotMatch(joined, /speckit @ web/);

  // api's artifact must not answer for the brain: that is the whole defect.
  assert.doesNotMatch(joined, /speckit @ brain: artifact ok/);

  // The tool's own facts stay said ONCE — repeating a nine-line flow per root
  // would bury the lines that differ.
  assert.equal(lines.filter((l) => / gates — /.test(l)).length, 1);
  assert.equal(lines.filter((l) => /flow — new: run \/speckit\.specify/.test(l)).length, 1);
  assert.equal(lines.filter((l) => /project law — revisit:/.test(l)).length, 1);

  // The project document is asked of each root the tool applies to, and of no
  // root it does not.
  assert.match(joined, /project law @ brain: .*constitution\.md missing/);
  assert.match(joined, /project law @ api: .*constitution\.md missing/);
  assert.doesNotMatch(joined, /project law @ web/);

  // A report, throughout: doctor never gates on any of it.
  assert.equal((await doctorReport(eco.brain)).exit, 0);
});

test('doctor: symlink door ok, stale graph warned, fresh graph quiet', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc3-')));
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    `doors: [claude]
grapher: acmegraph
graphers:
  acmegraph:
    artifact: acmegraph-out/graph.json
    refresh: acmegraph update .
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
    writeFileSync(join(eco.brain, 'package.json'), '{"name":"multivac"}\n');
    writeFileSync(join(eco.brain, 'package.json'), '{"name":"multivac"}\n');
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
    join(eco.brain, '.multivac/invariants.md'),
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

test('doctor --strict exits 1 when the gate is disarmed; bare doctor stays 0', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-strict-')));
  await installHooks(eco.brain); // fresh: core.hooksPath = .multivac/hooks, both shims
  // runnable multivac, so the shim bites: a built dist with node_modules beside
  // it (node and git stay on the real PATH — nuking PATH would blind git too).
  mkdirSync(join(eco.brain, 'dist'), { recursive: true });
  writeFileSync(join(eco.brain, 'package.json'), '{"name":"multivac"}\n');
  writeFileSync(join(eco.brain, 'dist/cli.js'), '// built\n');
  mkdirSync(join(eco.brain, 'node_modules'), { recursive: true });

  // armed: hooksPath ours, both shims present, a runner exists
  const armed = await doctorReport(eco.brain, true);
  assert.equal(armed.exit, 0, 'armed passes --strict');
  assert.equal(/enforcement gate is not armed/.test(armed.lines.join('\n')), false);
  assert.equal((await doctorReport(eco.brain)).exit, 0, 'bare doctor is 0 when armed');

  // measurement 3's exact disarm: unset core.hooksPath — git never runs the
  // shims, so a commit here is unverified. bare stays a 0 report, strict is 1.
  execFileSync('git', ['-C', eco.brain, 'config', '--unset', 'core.hooksPath']);
  const bare = await doctorReport(eco.brain);
  assert.equal(bare.exit, 0, 'bare doctor still only reports');
  assert.equal(/enforcement gate is not armed/.test(bare.lines.join('\n')), false);
  const strict = await doctorReport(eco.brain, true);
  assert.equal(strict.exit, 1, 'strict fails on the disarm');
  assert.match(line(strict.lines, 'strict'), /enforcement gate is not armed/);

  // hooksPath ours again but the pre-commit shim is gone: the floor is down
  execFileSync('git', ['-C', eco.brain, 'config', 'core.hooksPath', '.multivac/hooks']);
  assert.equal((await doctorReport(eco.brain, true)).exit, 0, 'shim present again ⇒ armed');
  rmSync(join(eco.brain, '.multivac/hooks/pre-commit'));
  assert.equal((await doctorReport(eco.brain, true)).exit, 1, 'a missing shim is disarmed');
  assert.equal((await doctorReport(eco.brain)).exit, 0, 'bare doctor never gates on it');
});

test('doctor names the branch each repo is parked on, and whether it is the channel', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-doc-'));
  const eco = makeScratchEcosystem(tmp);
  const g = (cwd: string, ...args: string[]): string =>
    execFileSync('git', ['-C', cwd, ...args], { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  // api published, then parked on a WIP branch; web never published at all.
  publishRepo(eco.repos.api, tmp, 'acme-api');
  g(eco.repos.api, 'checkout', '-q', '-b', 'wip/refactor');
  writeFileSync(join(eco.repos.api, 'src/server.ts'), 'export const port = 9090;\n');
  g(eco.repos.api, 'add', '-A');
  g(eco.repos.api, 'commit', '-q', '-m', 'wip');

  const { lines, exit } = await doctorReport(eco.brain);
  assert.equal(exit, 0);
  const branches = line(lines, 'branches');
  // The diagnostic that explains a verify result at a glance: off channel,
  // and which bytes verify actually reads instead.
  assert.match(branches, /api: on wip\/refactor @ [0-9a-f]{7} — OFF channel origin\/main @ [0-9a-f]{7}/);
  assert.match(branches, /verify reads the channel, not this tree/);
  assert.match(branches, /web: on main @ [0-9a-f]{7} — channel origin\/main does not resolve here/);
  assert.match(branches, /verify FALLS BACK to this working tree/);

  // Back on the channel: no drama, and it says the two agree.
  g(eco.repos.api, 'checkout', '-q', 'main');
  assert.match(line((await doctorReport(eco.brain)).lines, 'branches'), /api: on main @ [0-9a-f]{7} = channel origin\/main/);
});
