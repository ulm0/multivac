// doctor on a scratch ecosystem: full report, read-only, exit 0 unless the
// config itself is invalid.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { makeScratchEcosystem, publishRepo } from '../helpers/fixture.js';
import { SPECKIT_INTEGRATION_JSON } from '../helpers/recorded.js';
import { doctorReport } from '../../src/commands/doctor.js';
import { installHooks } from '../../src/hooks/install.js';
import { grapherSpec, sddSpec } from '../../src/adapters/registry.js';
import { leftoverGraphs } from '../../src/lib/repo-state.js';
import { renderBrainDoor } from '../../src/doors/brain.js';
import { graphIgnoreLines } from '../../src/lib/code-in-change.js';
import { loadConfig } from '../../src/lib/config.js';

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
  assert.match(repos, /2\/3 cloned/);
  assert.match(repos, /billing missing → `multivac repos sync`/);
  assert.match(repos, /git clone git@acme\.example:acme\/billing\.git/);

  const pins = line(lines, 'pins');
  // MV-127: multivac makes this mount now, so the fix is its own command.
  assert.match(pins, /api: no brain mount at \.brain — run `multivac repos sync` to add it/);
  assert.doesNotMatch(pins, /git submodule add/);
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
  assert.match(repos, /1\/2 cloned/);
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
    assert.match(sdd, /opsx @ brain: missing \(no openspec\)/);
    // MV-130: opsx's init is measured now, so doctor names the one the
    // lifecycle would run — MV-147: the same `--tools none` for any doors.
    assert.match(sdd, /declared but never run here; `change new` runs the tool's own `openspec init --tools none --no-animation \.`/);
    assert.match(sdd, /binary missing → `openspec` found on neither PATH nor brain's node_modules\/\.bin — install opsx: npm i -g @fission-ai\/openspec \(https:\/\/github\.com\/Fission-AI\/OpenSpec\)/);
    assert.match(sdd, /sdd_auto on — the lifecycle prints this tool's own steps and refuses/);
    // The flow lines name every step and what proves it.
    const all = lines.filter((l) => l.startsWith('sdd')).join('\n');
    assert.match(all, /flow — new: in the brain checkout run `openspec new change <slug> --json`/);
    assert.match(all, /flow — land: after the merge, in the brain checkout/);
    assert.match(all, /ungateable: apply leaves no artifact of its own/);
    // A step's guide is the lifecycle's, printed where the step comes up
    // (MV-147); a flow line carries the run alone.
    const flow = lines.filter((l) => l.includes('opsx flow — '));
    assert.equal(flow.length, 4, flow.join('\n'));
    for (const g of (sddSpec('opsx')!.steps ?? []).flatMap((s) => (s.guide ? [s.guide] : []))) {
      for (const l of flow) assert.ok(!l.includes(g), `a flow line carries a guide: ${l}`);
    }
    // ...and one line says exactly which lifecycle commands refuse.
    assert.match(all, /gates — change plan: refuses without openspec\/changes\/<slug>\/proposal\.md/);
    assert.match(all, /change close: refuses without openspec\/changes\/archive\/<n>-<n>-<n>-<slug>/);
    // OpenSpec has no project-level document; doctor says so rather than inventing one.
    assert.match(all, /opsx project law @ brain: openspec\/config\.yaml missing → write `context:` .*\(optional: reported, never gated\)/);
  } finally {
    process.env.PATH = old;
  }
});

/**
 * Declared but never run here: doctor NAMES the tool's own init and says who
 * runs it, because naming is all it may do — that command writes the vendor's
 * files into the tree, and a report writes nothing. Gone the moment the
 * vendor's state file is there: the clause reports a state, it is not
 * decoration on every absence. A hand-made directory is not that file (MV-124).
 */
test('doctor: a declared-but-unscaffolded sdd names the init, and says it never runs it', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-scaffold-')));
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    'doors: [agents]\nsdd: speckit\nrepos:\n  api: ../acme-api\n',
  );
  const sddLine = async (): Promise<string> => line((await doctorReport(eco.brain)).lines, 'sdd');

  const never = await sddLine();
  assert.match(never, /speckit @ brain: missing \(no \.specify\)/);
  assert.match(
    never,
    /declared but never run here; `change new` runs the tool's own `specify init --here --integration claude --force --ignore-agent-tools`, doctor never does \(it writes the vendor's files into the tree\)/,
  );
  // MV-146: the same run writes the skeleton, said after the run it follows.
  assert.match(
    never,
    /\(it writes the vendor's files into the tree\); that run then writes multivac's skeleton templates to \.specify\/templates\/overrides if it is absent/,
  );

  // A directory made by hand is partial: the reason, and the init to run by
  // hand, since the lifecycle will not run it over what is there.
  mkdirSync(join(eco.brain, '.specify'), { recursive: true });
  const partial = await sddLine();
  assert.match(partial, /speckit @ brain: partial \(\.specify is there and \.specify\/integration\.json is not\)/);
  assert.match(partial, /run `specify init --here --integration claude --force --ignore-agent-tools` there yourself/);
  assert.doesNotMatch(partial, /declared but never run here/);

  // Once it has run here there is no such state to report, and no command to
  // name: doctor drops the clause instead of nagging about a done thing.
  writeFileSync(join(eco.brain, '.specify/integration.json'), SPECKIT_INTEGRATION_JSON);
  const after = await sddLine();
  assert.match(after, /speckit @ brain: installed · binary/);
  assert.doesNotMatch(after, /declared but never run here|yourself/);
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
  // Per root, and the SDD runs in the brain alone (MV-146): the brain's
  // document, and no code repo's. One repo's constitution used to be reported
  // as the whole product's (MV-87).
  assert.match(missing, /project law @ brain: \.specify\/memory\/constitution\.md missing → run \/speckit\.constitution/);
  assert.doesNotMatch(missing, /project law @ api/);
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
    /is still the unfilled template shipped by the tool \(placeholders remain: \[[A-Z0-9_]+\]\) → run \/speckit\.constitution/,
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
 *
 * MV-146: the one root the SDD runs in is the brain. A code repo gets no
 * verdict of its own — one line names whose code the brain's SDD governs and
 * who is exempt, and a code repo's own install is a leftover, never a root.
 */
test('doctor: the sdd is reported for the brain alone, and an opted-out repo is named exempt', async () => {
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
  // Only api has a .specify — the directory somebody made by hand.
  mkdirSync(join(eco.repos.api, '.specify'), { recursive: true });

  const lines = (await doctorReport(eco.brain)).lines.filter((l) => l.startsWith('sdd'));
  const joined = lines.join('\n');

  // The brain's own verdict, and no code repo's.
  assert.match(joined, /speckit @ brain: missing \(no \.specify\)/);
  assert.doesNotMatch(joined, /speckit @ (api|web)/);
  // The opted-out repo is named as exempt, in the line naming what is governed.
  assert.match(joined, /^sdd {8}speckit governs the code of api — its steps run in the brain; exempt \(sdd: none\): web$/m);
  assert.doesNotMatch(joined, /no sdd declared for this repo/);
  // api's directory must not answer for the brain: that is the whole defect.
  // It is a leftover now, named as one.
  assert.doesNotMatch(joined, /speckit @ brain: installed/);
  assert.match(joined, /leftover speckit install @ api: \.specify \(untracked\)/);

  // The tool's own facts stay said ONCE.
  assert.equal(lines.filter((l) => / gates — /.test(l)).length, 1);
  assert.equal(lines.filter((l) => /flow — new: run \/speckit\.specify/.test(l)).length, 1);
  assert.equal(lines.filter((l) => /project law — revisit:/.test(l)).length, 1);

  // The project document is asked of the brain, and of no code repo.
  assert.match(joined, /project law @ brain: .*constitution\.md missing/);
  assert.doesNotMatch(joined, /project law @ (api|web)/);

  // A report, throughout: doctor never gates on any of it.
  assert.equal((await doctorReport(eco.brain)).exit, 0);
});

/**
 * MV-146: a code repo an earlier release equipped keeps the vendor's files.
 * Nothing reads them now, so doctor names each, tracked or not, with how to
 * remove it — and never fails over it. A read-only repo is never named
 * (MV-125): nothing may be removed there by this ecosystem.
 */
test('doctor: a leftover sdd install in a code repo is named with its removal, tracked or not, never a failure', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-leftover-')));
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    [
      'doors: [agents]',
      'sdd: speckit',
      'repos:',
      '  api: ../acme-api',
      '  web: ../acme-web',
      '  vendor:',
      '    path: ../acme-vendor',
      '    managed: false',
      '',
    ].join('\n'),
  );
  const git = (dir: string, ...args: string[]): void => {
    execFileSync('git', ['-C', dir, ...args], { stdio: 'ignore' });
  };
  // api: spec-kit, committed there by an earlier `repos sync`.
  mkdirSync(join(eco.repos.api, '.specify'), { recursive: true });
  writeFileSync(join(eco.repos.api, '.specify/integration.json'), SPECKIT_INTEGRATION_JSON);
  git(eco.repos.api, 'add', '.specify');
  git(eco.repos.api, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'speckit');
  // web: an openspec init nobody committed.
  mkdirSync(join(eco.repos.web, 'openspec'), { recursive: true });
  writeFileSync(join(eco.repos.web, 'openspec/config.yaml'), 'schema: spec-driven\n');
  // vendor: read-only, holding an install it is not ours to remove.
  const vendor = join(eco.brain, '../acme-vendor');
  mkdirSync(join(vendor, '.specify'), { recursive: true });
  writeFileSync(join(vendor, '.specify/integration.json'), SPECKIT_INTEGRATION_JSON);

  const { lines, exit } = await doctorReport(eco.brain);
  const sdd = lines.filter((l) => l.startsWith('sdd')).join('\n');
  assert.match(
    sdd,
    /^sdd {8}leftover speckit install @ api: \.specify\/integration\.json \(tracked\) — delete \.specify\/ there; `specify integration uninstall <key>` removes its skills and leaves \.specify\/$/m,
  );
  assert.match(
    sdd,
    /^sdd {8}leftover opsx install @ web: openspec\/config\.yaml \(untracked\) — delete openspec\/ and the openspec-\* skills and opsx commands its init wrote under each harness directory$/m,
  );
  assert.doesNotMatch(sdd, /@ vendor/);
  // Governed all the same: a leftover is not an exemption.
  assert.match(sdd, /speckit governs the code of api, web, vendor — its steps run in the brain$/m);
  assert.equal(exit, 0);
});

/**
 * MV-147: the scaffold installs no command body, so a brain an earlier
 * multivac scaffolded keeps the bodies its init wrote — listed by the harness
 * every session, named by no printed step. doctor names them on one line, with
 * a removal that works as printed: `git rm -r` for what git tracks, since it
 * refuses a pathspec matching nothing tracked, and a delete for the rest.
 * Under a door no longer declared and under `.codex/` (openspec 1.7.0's codex)
 * alike. A report, never a failure; nothing when none is left.
 */
test('doctor names opsx bodies an earlier init left in the brain', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-bodies-')));
  const git = (...args: string[]): string =>
    execFileSync('git', ['-C', eco.brain, '-c', 'user.email=t@t', '-c', 'user.name=t', ...args], { encoding: 'utf8' });
  const put = (rel: string, body = 'openspec body\n'): void => {
    mkdirSync(join(eco.brain, rel, '..'), { recursive: true });
    writeFileSync(join(eco.brain, rel), body);
  };
  writeFileSync(join(eco.brain, '.multivac/config.yml'), 'doors: [claude]\nsdd: opsx\nrepos:\n  api: ../acme-api\n');
  put('openspec/config.yaml', 'schema: spec-driven\n');
  for (const rel of [
    '.claude/commands/opsx/propose.md',
    '.claude/skills/openspec-propose/SKILL.md',
    '.claude/skills/openspec-apply-change/SKILL.md',
    '.agents/skills/openspec-propose/SKILL.md',
    '.agents/skills/.openspec-target',
    '.codex/skills/openspec-explore/SKILL.md',
    '.cursor/commands/opsx-propose.md',
    '.cursor/commands/opsx-apply.md',
  ]) put(rel);
  git('add', '-A');
  git('commit', '-qm', 'an earlier init');
  const bodyLines = (lines: string[]): string[] => lines.filter((l) => l.includes('an earlier init left command bodies'));

  const tracked = await doctorReport(eco.brain);
  assert.equal(tracked.exit, 0);
  assert.ok(!tracked.lines.some((l) => /\bFAIL\b/.test(l)), tracked.lines.join('\n'));
  // Siblings sharing `openspec-` or `opsx-` collapse, under a door no longer
  // declared (`.cursor/`) as under one that is.
  assert.deepEqual(bodyLines(tracked.lines), [
    'sdd        opsx @ brain: an earlier init left command bodies no printed step names — ' +
      '`git rm -r .agents/skills/.openspec-target .agents/skills/openspec-propose .claude/commands/opsx .claude/skills/openspec-* .codex/skills/openspec-explore .cursor/commands/opsx-*` removes them; ' +
      'they are not code, so the commit needs no open change',
  ]);
  // One line after the brain's install line.
  const install = tracked.lines.findIndex((l) => l.startsWith('sdd        opsx @ brain: ') && !l.includes('an earlier init'));
  assert.ok(install >= 0, tracked.lines.join('\n'));
  assert.equal(tracked.lines.indexOf(bodyLines(tracked.lines)[0]), install + 1, tracked.lines.join('\n'));
  // No law ID: the site shows the line.
  assert.doesNotMatch(bodyLines(tracked.lines)[0], /MV-\d/);
  // The collapsed form works as printed, through a shell that expands it.
  const printedRm = (l: string): string => /`(git rm -r [^`]+)`/.exec(l)![1];
  execFileSync('sh', ['-c', `${printedRm(bodyLines(tracked.lines)[0])} -q --dry-run`], { cwd: eco.brain });

  // A sibling git ignores is listed by no `git ls-files`, and the shell still
  // expands a glob into it: no pattern is printed that reaches it, and it is
  // not named, since nothing but the operator put it out of git's sight.
  put('.claude/skills/openspec-local/SKILL.md');
  writeFileSync(join(eco.brain, '.git/info/exclude'), '.claude/skills/openspec-local/\n');
  const ignored = bodyLines((await doctorReport(eco.brain)).lines);
  assert.deepEqual(ignored, [
    'sdd        opsx @ brain: an earlier init left command bodies no printed step names — ' +
      '`git rm -r .agents/skills/.openspec-target .agents/skills/openspec-propose .claude/commands/opsx .claude/skills/openspec-apply-change .claude/skills/openspec-propose .codex/skills/openspec-explore .cursor/commands/opsx-*` removes them; ' +
      'they are not code, so the commit needs no open change',
  ]);
  execFileSync('sh', ['-c', `${printedRm(ignored[0])} -q --dry-run`], { cwd: eco.brain });
  rmSync(join(eco.brain, '.claude/skills/openspec-local'), { recursive: true });
  writeFileSync(join(eco.brain, '.git/info/exclude'), '');

  // An untracked body is named to delete, outside the `git rm -r` — and a
  // sibling glob that would reach it is not printed, since a shell expanding
  // it would hand `git rm -r` a path git does not track. An entry holding
  // both is listed once as each.
  put('.gemini/skills/openspec-explore/SKILL.md');
  put('.claude/skills/openspec-explore/SKILL.md');
  put('.claude/commands/opsx/extra.md');
  const mixed = bodyLines((await doctorReport(eco.brain)).lines);
  assert.deepEqual(mixed, [
    'sdd        opsx @ brain: an earlier init left command bodies no printed step names — ' +
      '`git rm -r .agents/skills/.openspec-target .agents/skills/openspec-propose .claude/commands/opsx .claude/skills/openspec-apply-change .claude/skills/openspec-propose .codex/skills/openspec-explore .cursor/commands/opsx-*` removes them, ' +
      'and .claude/commands/opsx .claude/skills/openspec-explore .gemini/skills/openspec-explore are untracked: delete them; they are not code, so the commit needs no open change',
  ]);

  // The removal works as printed.
  execFileSync('sh', ['-c', `${printedRm(mixed[0])} -q`], { cwd: eco.brain });
  git('commit', '-qm', 'drop openspec bodies');
  const untracked = bodyLines((await doctorReport(eco.brain)).lines);
  assert.deepEqual(untracked, [
    'sdd        opsx @ brain: an earlier init left command bodies no printed step names — .claude/commands/opsx .claude/skills/openspec-explore .gemini/skills/openspec-explore are untracked: delete them',
  ]);
  rmSync(join(eco.brain, '.gemini'), { recursive: true });
  rmSync(join(eco.brain, '.claude/skills/openspec-explore'), { recursive: true });
  rmSync(join(eco.brain, '.claude/commands/opsx'), { recursive: true });
  const none = await doctorReport(eco.brain);
  assert.equal(none.exit, 0);
  assert.deepEqual(bodyLines(none.lines), [], 'none left, no line');

  // A speckit brain records no bodies, so the same files earn no line.
  put('.claude/skills/openspec-propose/SKILL.md');
  writeFileSync(join(eco.brain, '.multivac/config.yml'), 'doors: [claude]\nsdd: speckit\nrepos:\n  api: ../acme-api\n');
  assert.deepEqual(bodyLines((await doctorReport(eco.brain)).lines), []);
});

/**
 * MV-146: with no SDD in the brain, nothing about an SDD is said, as before
 * the rule. A code repo's own spec-kit install is that team's use of the tool,
 * not a leftover of an earlier release, and is not named — nor on its
 * `repos check` line.
 */
test('doctor: with no sdd in the brain a code repo\'s own install is not named a leftover', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-no-sdd-')));
  writeFileSync(join(eco.brain, '.multivac/config.yml'), 'doors: [agents]\nrepos:\n  api: ../acme-api\n');
  mkdirSync(join(eco.repos.api, '.specify'), { recursive: true });
  writeFileSync(join(eco.repos.api, '.specify/integration.json'), SPECKIT_INTEGRATION_JSON);
  const { lines, exit } = await doctorReport(eco.brain);
  assert.deepEqual(lines.filter((l) => l.startsWith('sdd')), []);
  assert.equal(exit, 0);
  // `none` at the top level is no SDD either.
  writeFileSync(join(eco.brain, '.multivac/config.yml'), 'doors: [agents]\nsdd: none\nrepos:\n  api: ../acme-api\n');
  assert.deepEqual((await doctorReport(eco.brain)).lines.filter((l) => l.startsWith('sdd')), []);
});

test('doctor: the governs line needs a code repo to name, and a brain that is its only repo prints none', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-governs-')));
  writeFileSync(join(eco.brain, '.multivac/config.yml'), 'doors: [agents]\nsdd: speckit\nrepos:\n  brain: .\n');
  const sdd = (await doctorReport(eco.brain)).lines.filter((l) => l.startsWith('sdd')).join('\n');
  assert.match(sdd, /speckit @ brain: /);
  assert.doesNotMatch(sdd, /governs|leftover|exempt/);

  // Every code repo exempt: the line says so rather than naming nothing.
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    'doors: [agents]\nsdd: speckit\nrepos:\n  api:\n    path: ../acme-api\n    sdd: none\n',
  );
  const exempt = (await doctorReport(eco.brain)).lines.filter((l) => l.startsWith('sdd')).join('\n');
  assert.match(exempt, /speckit governs the code of no code repo — its steps run in the brain; exempt \(sdd: none\): api$/m);
});

/**
 * MV-146: the skeleton outranks every preset, because spec-kit reads
 * `overrides/` first. doctor names each enabled preset that ships a template
 * an override shadows — and constitution-sync, which ships none and feeds the
 * core templates the overrides shadow — with the file to delete. Nothing else:
 * a disabled preset, one shipping only an unshadowed template, and no registry
 * at all are silence. The registry is the shape spec-kit 1.0.11 wrote.
 */
test('doctor: an enabled preset a skeleton outranks is named, with the override to delete', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-preset-')));
  writeFileSync(join(eco.brain, '.multivac/config.yml'), 'doors: [agents]\nsdd: speckit\nrepos:\n  brain: .\n');
  const at = (rel: string, body = 'x\n'): void => {
    mkdirSync(join(eco.brain, rel, '..'), { recursive: true });
    writeFileSync(join(eco.brain, rel), body);
  };
  at('.specify/integration.json', SPECKIT_INTEGRATION_JSON);
  at('.specify/templates/overrides/plan-template.md');
  at('.specify/templates/overrides/tasks-template.md');
  const registry = (presets: Record<string, { enabled: boolean; priority: number }>): void =>
    at('.specify/presets/.registry', JSON.stringify({ schema_version: '1.0', presets }, null, 2));
  const presets = async (): Promise<string[]> =>
    (await doctorReport(eco.brain)).lines.filter((l) => /^sdd +preset /.test(l)).map((l) => l.replace(/^sdd +/, ''));

  // No registry: nothing to name.
  assert.deepEqual(await presets(), []);

  at('.specify/presets/team/templates/plan-template.md');
  at('.specify/presets/team/templates/spec-template.md'); // no spec override: nothing shadows it
  at('.specify/presets/off/templates/plan-template.md');
  registry({ team: { enabled: true, priority: 10 }, off: { enabled: false, priority: 5 } });
  assert.deepEqual(await presets(), [
    'preset team is outranked for plan-template.md by .specify/templates/overrides/plan-template.md — delete that override to let the preset win',
  ]);

  // constitution-sync ships no template: every override present outranks it.
  registry({ 'constitution-sync': { enabled: true, priority: 10 } });
  assert.deepEqual(await presets(), [
    'preset constitution-sync is outranked for plan-template.md by .specify/templates/overrides/plan-template.md — delete that override to let the preset win',
    'preset constitution-sync is outranked for tasks-template.md by .specify/templates/overrides/tasks-template.md — delete that override to let the preset win',
  ]);

  // Unreadable is silence, not a crash.
  at('.specify/presets/.registry', '{ not json');
  assert.deepEqual(await presets(), []);
});

/**
 * MV-146: under `sdd_auto: false` the lifecycle refuses nothing and runs
 * nothing, and doctor says neither: no gate, no init `change new` would run,
 * no skeleton that run would write, and no code it governs — the code gate is
 * off too (MV-137), as the consumer door already says by saying nothing.
 */
test('doctor: under sdd_auto: false no sdd line says the lifecycle refuses', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-auto-off-')));
  writeFileSync(join(eco.brain, '.multivac/config.yml'), 'doors: [agents]\nsdd: speckit\nsdd_auto: false\nrepos:\n  api: ../acme-api\n');
  const sdd = (await doctorReport(eco.brain)).lines.filter((l) => l.startsWith('sdd')).join('\n');
  assert.doesNotMatch(sdd, /refuses/);
  assert.match(
    sdd,
    /speckit @ brain: missing \(no \.specify\) — declared but never run here; under `sdd_auto: false` no command runs the tool's own `specify init [^`]*`: run it there yourself, doctor never does \(it writes the vendor's files into the tree\) · /,
  );
  assert.doesNotMatch(sdd, /`change new` runs|skeleton|governs the code of/);
  assert.match(sdd, /speckit gates — change plan: not gated \(`sdd_auto: false`\) · change apply: not gated \(`sdd_auto: false`\) · change close: not gated \(`sdd_auto: false`\)$/m);
  assert.match(sdd, /speckit flow — new: run \/speckit\.specify .*\[proof: specs\/<n>-<slug>\/spec\.md — not gated \(`sdd_auto: false`\)\]$/m);
  // An ungateable step keeps its reason whole.
  assert.match(sdd, /speckit flow — apply: run \/speckit\.analyze .*\[ungateable: /);
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
repos:
  brain: .
`,
  );
  // MV-148: the brain holds code (`brain: .`), so it keeps a graph of its own.
  symlinkSync('AGENTS.md', join(eco.brain, 'CLAUDE.md'));
  // fake grapher binary, found through PATH
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
  process.env.PATH = [binDir, '/usr/bin', '/bin'].join(delimiter);
  try {
    let { lines, exit } = await doctorReport(eco.brain);
    assert.equal(exit, 0);
    assert.match(line(lines, 'doors'), /claude: CLAUDE\.md ok \(symlink\)/);
    let grapher = line(lines, 'grapher');
    assert.match(grapher, /acmegraph @ brain: installed \(shared\) · binary ok · graph STALE/);
    assert.match(grapher, /→ run `acmegraph update \.` there/);

    // touch the artifact past the commit -> fresh
    const now = new Date();
    utimesSync(graph, now, now);
    ({ lines, exit } = await doctorReport(eco.brain));
    assert.match(line(lines, 'grapher'), /installed \(shared\) · binary ok · fresh/);
  } finally {
    process.env.PATH = old;
  }
});

// MV-148. A brain that holds no code refreshes no graph of its own: its one
// post-edit hook follows edits into the code repos' checkouts, and the line
// says so where `doors` wires it, and why it wired none where it did not.
test("doctor: a code-less brain's refresh path says where its hook follows edits, or why it runs none", async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-follow-')));
  const binDir = join(eco.brain, '..', 'fakebin');
  mkdirSync(binDir, { recursive: true });
  writeFileSync(join(binDir, 'acmegraph'), '#!/bin/sh\nexit 0\n');
  chmodSync(join(binDir, 'acmegraph'), 0o755);
  const decl = 'graphers:\n  acmegraph:\n    artifact: acmegraph-out/graph.json\n    refresh: acmegraph update .\n';
  const refreshPath = async (config: string, path: string[]): Promise<string> => {
    writeFileSync(join(eco.brain, '.multivac/config.yml'), config);
    const old = process.env.PATH;
    process.env.PATH = [...path, '/usr/bin', '/bin'].join(delimiter);
    try {
      const l = (await doctorReport(eco.brain)).lines.filter((x) => x.startsWith('grapher    refresh path: '));
      assert.equal(l.length, 1, l.join('\n'));
      return l[0].slice('grapher    '.length);
    } finally {
      process.env.PATH = old;
    }
  };
  const two = `doors: [agents, claude]\ngrapher: acmegraph\n${decl}repos:\n  api: ../acme-api\n  web: ../acme-web\n`;
  const net = ' (installed when the binary is present) · `change land` commits it on the change branch · `change close` is the net · git hooks never refresh';

  assert.equal(await refreshPath(two, [binDir]), `refresh path: claude post-edit hook follows your edits into the code repos' checkouts${net}`);
  // MV-149: two graphers over the code repos, one hook each — the line names
  // each one wired, and per grapher why one is not; none found, neither is.
  const mixed = 'doors: [agents, claude]\nrepos:\n  web:\n    path: ../acme-web\n    grapher: graphify\n  api:\n    path: ../acme-api\n    grapher: codegraph\n';
  const unreachable = (b: string): string => `\`${b}\` is not reachable from every code repo that resolves ${b} (PATH, or each one's node_modules/.bin)`;
  assert.equal(
    await refreshPath(mixed, []),
    `refresh path: \`change land\` and \`change close\` only — ${unreachable('graphify')}; ${unreachable('codegraph')} · git hooks never refresh`,
  );
  const both = join(eco.brain, '..', 'bothbin');
  mkdirSync(both, { recursive: true });
  for (const b of ['graphify', 'codegraph']) {
    writeFileSync(join(both, b), '#!/bin/sh\nexit 0\n');
    chmodSync(join(both, b), 0o755);
  }
  const land = ' · `change land` commits graphify\'s graph on the change branch and syncs codegraph\'s index, which `change apply` builds in each change worktree, never committed · `change close` is the net · git hooks never refresh';
  const several = await refreshPath(mixed, [both]);
  assert.equal(several, `refresh path: claude post-edit hooks follow your edits — graphify's and codegraph's (each installed when its binary is present)${land}`);
  assert.equal(Buffer.byteLength(`grapher    ${several}\n`), 358);
  // codegraph found from neither repo: graphify's hook is wired, codegraph's
  // is not, and the line says which, in `doors`' words.
  rmSync(join(both, 'codegraph'));
  assert.equal(
    await refreshPath(mixed, [both]),
    `refresh path: claude post-edit hook follows your edits — graphify's (installed when the binary is present) · no hook for codegraph: ${unreachable('codegraph')}${land}`,
  );
  // In one of the two repos' node_modules/.bin: the hook, moved into the other, finds none.
  mkdirSync(join(eco.repos.web, 'node_modules', '.bin'), { recursive: true });
  writeFileSync(join(eco.repos.web, 'node_modules', '.bin', 'acmegraph'), '#!/bin/sh\nexit 0\n');
  chmodSync(join(eco.repos.web, 'node_modules', '.bin', 'acmegraph'), 0o755);
  assert.equal(
    await refreshPath(two, []),
    "refresh path: `change land` and `change close` only — `acmegraph` is not reachable from every code repo that resolves acmegraph (PATH, or each one's node_modules/.bin) · git hooks never refresh",
  );
  // In each repo's node_modules/.bin and not on PATH: wired, and the ceiling
  // stated — a change worktree holds no node_modules, so there the hook finds
  // no binary and runs nothing.
  mkdirSync(join(eco.repos.api, 'node_modules', '.bin'), { recursive: true });
  writeFileSync(join(eco.repos.api, 'node_modules', '.bin', 'acmegraph'), '#!/bin/sh\nexit 0\n');
  chmodSync(join(eco.repos.api, 'node_modules', '.bin', 'acmegraph'), 0o755);
  assert.equal(
    await refreshPath(two, []),
    "refresh path: claude post-edit hook follows your edits into the code repos' checkouts (installed when the binary is present) · not into the change worktrees of api and web: they reach acmegraph only in their own node_modules/.bin, which a worktree does not hold · `change land` commits it on the change branch · `change close` is the net · git hooks never refresh",
  );
  // On PATH too: found there first, from the worktrees as from the repos.
  assert.equal(await refreshPath(two, [binDir]), `refresh path: claude post-edit hook follows your edits into the code repos' checkouts${net}`);
  // The one repo resolving it is not multivac's to write: no checkout to follow into.
  assert.equal(
    await refreshPath(`doors: [agents, claude]\ngrapher: acmegraph\n${decl}repos:\n  web:\n    path: ../acme-web\n    managed: false\n`, [binDir]),
    "refresh path: none yet — no writable code repo resolves acmegraph, so the brain's post-edit hook has no checkout to follow edits into · git hooks never refresh",
  );
  // An unverified name, resolved by the repos or by none: nothing wires or
  // refreshes it (MV-59), where `doors` prints what to declare.
  for (const repos of ['repos:\n  api: ../acme-api\n  web: ../acme-web\n', 'repos: {}\n']) {
    assert.equal(
      await refreshPath(`doors: [agents, claude]\ngrapher: mystery\n${repos}`, [binDir]),
      'refresh path: none — mystery is not verified, so no post-edit hook, `change land` or `change close` runs it · git hooks never refresh',
      repos,
    );
  }
  // A brain that holds code keeps the line it had.
  assert.equal(
    await refreshPath(`doors: [agents, claude]\ngrapher: acmegraph\n${decl}repos:\n  brain: .\n  api: ../acme-api\n`, [binDir]),
    `refresh path: claude post-edit hook${net}`,
  );
  // No harness with a post-edit hook: the same line in every brain.
  assert.equal(
    await refreshPath(`doors: [agents]\ngrapher: acmegraph\n${decl}repos:\n  api: ../acme-api\n`, [binDir]),
    'refresh path: `change land` and `change close` only — no declared harness has a post-edit hook · git hooks never refresh',
  );
});

// MV-149. What land does with the graph, by the artifact's kind: a local
// index is built in each change worktree at apply and synced at land, never
// committed, where a shared graph is committed on the change branch.
test('the refresh path of a local index says apply builds it and land syncs it', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-local-')), { brainIsCode: true });
  const binDir = join(eco.brain, '..', 'fakebin');
  mkdirSync(binDir, { recursive: true });
  for (const b of ['codegraph', 'graphify']) {
    writeFileSync(join(binDir, b), '#!/bin/sh\nexit 0\n');
    chmodSync(join(binDir, b), 0o755);
  }
  const refreshPath = async (config: string): Promise<string> => {
    writeFileSync(join(eco.brain, '.multivac/config.yml'), config);
    const old = process.env.PATH;
    process.env.PATH = [binDir, '/usr/bin', '/bin'].join(delimiter);
    try {
      const l = (await doctorReport(eco.brain)).lines.filter((x) => x.startsWith('grapher    refresh path: '));
      assert.equal(l.length, 1, l.join('\n'));
      return l[0];
    } finally {
      process.env.PATH = old;
    }
  };
  const local = '`change apply` builds the index in each change worktree and `change land` syncs it, never committed';
  const own = await refreshPath('doors: [agents, claude]\ngrapher: codegraph\nrepos:\n  brain: .\n');
  assert.equal(
    own,
    `grapher    refresh path: claude post-edit hook (installed when the binary is present) · ${local} · \`change close\` is the net · git hooks never refresh`,
  );
  assert.equal(Buffer.byteLength(`${own}\n`), 245);
  // A code-less brain's follow hook: its head kept, the land clause by kind.
  assert.equal(
    await refreshPath('doors: [agents, claude]\ngrapher: codegraph\nrepos:\n  api: ../acme-api\n  web: ../acme-web\n'),
    `grapher    refresh path: claude post-edit hook follows your edits into the code repos' checkouts (installed when the binary is present) · ${local} · \`change close\` is the net · git hooks never refresh`,
  );
  // A shared graph is committed on the change branch, as before.
  const shared = await refreshPath('doors: [agents, claude]\ngrapher: graphify\nrepos:\n  brain: .\n');
  assert.match(shared, / · `change land` commits it on the change branch · /);
  assert.doesNotMatch(shared, /change apply/);
});

// MV-149. doctor's refresh path names each grapher's own hook in every brain
// shape — a brain that holds code with a sibling on another grapher included —
// per grapher where one does not reach, and, in the words `doors` prints,
// graphers one hook cannot tell apart.
test("doctor's refresh path names each grapher's hook, where one does not reach, and graphers sharing one artifact", async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-several-')), { brainIsCode: true });
  const binDir = join(eco.brain, '..', 'fakebin');
  mkdirSync(binDir, { recursive: true });
  const put = (dir: string, b: string): void => {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, b), '#!/bin/sh\nexit 0\n');
    chmodSync(join(dir, b), 0o755);
  };
  const refreshPath = async (config: string, path: string[]): Promise<string> => {
    writeFileSync(join(eco.brain, '.multivac/config.yml'), config);
    const old = process.env.PATH;
    process.env.PATH = [...path, '/usr/bin', '/bin'].join(delimiter);
    try {
      const l = (await doctorReport(eco.brain)).lines.filter((x) => x.startsWith('grapher    refresh path: '));
      assert.equal(l.length, 1, l.join('\n'));
      return l[0].slice('grapher    '.length);
    } finally {
      process.env.PATH = old;
    }
  };
  const land = " · `change land` commits graphify's graph on the change branch and syncs codegraph's index, which `change apply` builds in each change worktree, never committed · `change close` is the net · git hooks never refresh";

  // A graphify brain that holds code, api on codegraph: the brain's own hook
  // and api's follow hook, both named.
  put(binDir, 'graphify');
  put(binDir, 'codegraph');
  const mixed = 'doors: [agents, claude]\ngrapher: graphify\nrepos:\n  brain: .\n  api:\n    path: ../acme-api\n    grapher: codegraph\n';
  assert.equal(
    await refreshPath(mixed, [binDir]),
    `refresh path: claude post-edit hooks follow your edits — graphify's and codegraph's (each installed when its binary is present)${land}`,
  );

  // A code-less brain, codegraph reachable only in api's node_modules/.bin:
  // wired, and not into api's change worktrees, said of codegraph's hook.
  const pathOnly = join(eco.brain, '..', 'graphifybin');
  put(pathOnly, 'graphify');
  put(join(eco.repos.api, 'node_modules', '.bin'), 'codegraph');
  assert.equal(
    await refreshPath('doors: [agents, claude]\nrepos:\n  web:\n    path: ../acme-web\n    grapher: graphify\n  api:\n    path: ../acme-api\n    grapher: codegraph\n', [pathOnly]),
    "refresh path: claude post-edit hooks follow your edits — graphify's and codegraph's (each installed when its binary is present)" +
      " · codegraph's hook: not into the change worktrees of api: they reach codegraph only in their own node_modules/.bin, which a worktree does not hold" +
      land,
  );

  // Two graphers writing one artifact, in `doors`' words: neither the brain's,
  // and no hook; the brain's own, and its hook runs in the other's repos too.
  const decl = 'graphers:\n  outgraph:\n    artifact: graphify-out/graph.json\n    refresh: outgraph update .\n';
  put(binDir, 'outgraph');
  assert.equal(
    await refreshPath(`doors: [agents, claude]\n${decl}repos:\n  web:\n    path: ../acme-web\n    grapher: graphify\n  api:\n    path: ../acme-api\n    grapher: outgraph\n`, [binDir]),
    'refresh path: no post-edit hook — graphify and outgraph both write graphify-out/graph.json, so one hook cannot tell their repos apart — neither is wired; `change land` and `change close` refresh them · git hooks never refresh',
  );
  const own = "graphify and outgraph both write graphify-out/graph.json, so one hook cannot tell their repos apart — graphify is wired, and an edit in outgraph's repos runs graphify there; `change land` and `change close` refresh outgraph";
  assert.equal(
    await refreshPath(`doors: [agents, claude]\ngrapher: graphify\n${decl}repos:\n  brain: .\n  api:\n    path: ../acme-api\n    grapher: outgraph\n`, [binDir]),
    `refresh path: claude post-edit hook (installed when the binary is present) · ${own} · \`change land\` commits it on the change branch · \`change close\` is the net · git hooks never refresh`,
  );
  // Beside another grapher's follow hook, the clash is still named.
  assert.equal(
    await refreshPath(
      `doors: [agents, claude]\ngrapher: graphify\n${decl}repos:\n  brain: .\n  api:\n    path: ../acme-api\n    grapher: outgraph\n  web:\n    path: ../acme-web\n    grapher: codegraph\n`,
      [binDir],
    ),
    `refresh path: claude post-edit hooks follow your edits — graphify's and codegraph's (each installed when its binary is present) · ${own}${land}`,
  );
});

// MV-149. Every hook of ours passes its toplevel test in any repo holding its
// artifact, so a repo holding the artifact of a grapher it does not resolve is
// refreshed by that grapher's hook too, racing its own for the one lock. doctor
// names it, with its removal, only while that hook is wired; it gates nothing.
test("a repo holding a grapher's artifact it does not resolve is named while that grapher's hook is wired", async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-foreign-')));
  const binDir = join(eco.brain, '..', 'fakebin');
  mkdirSync(binDir, { recursive: true });
  for (const b of ['graphify', 'codegraph']) {
    writeFileSync(join(binDir, b), '#!/bin/sh\nexit 0\n');
    chmodSync(join(binDir, b), 0o755);
  }
  mkdirSync(join(eco.repos.api, 'graphify-out'), { recursive: true });
  writeFileSync(join(eco.repos.api, 'graphify-out/graph.json'), '{}\n');
  const report = async (doors: string, path: string[]): Promise<{ api: string; exit: number }> => {
    writeFileSync(
      join(eco.brain, '.multivac/config.yml'),
      `doors: [${doors}]\nrepos:\n  web:\n    path: ../acme-web\n    grapher: graphify\n  api:\n    path: ../acme-api\n    grapher: codegraph\n`,
    );
    const old = process.env.PATH;
    process.env.PATH = [...path, '/usr/bin', '/bin'].join(delimiter);
    try {
      const { lines, exit } = await doctorReport(eco.brain);
      return { api: lines.find((l) => l.startsWith('grapher    codegraph @ api: ')) ?? '', exit };
    } finally {
      process.env.PATH = old;
    }
  };
  const fact =
    ` · also holds graphify-out/graph.json of graphify, which it does not resolve — graphify's post-edit hook refreshes it there; ` +
    `remove it: cd ${eco.repos.api} && git rm -q --ignore-unmatch -- graphify-out/graph.json .graphifyignore && rm -rf graphify-out .graphifyignore`;
  const wired = await report('agents, claude', [binDir]);
  assert.ok(wired.api.endsWith(fact), wired.api);
  assert.equal(Buffer.byteLength(`${fact.replace(eco.repos.api, '/srv/eco/api')}\n`), 267);
  // Not wired — no declared door has the hook, or graphify is found from
  // neither code repo — and nothing is said; the exit code never moves.
  const bare = await report('agents', [binDir]);
  assert.ok(bare.api.startsWith('grapher    codegraph @ api: '), bare.api);
  assert.doesNotMatch(bare.api, /which it does not resolve/);
  const unreached = await report('agents, claude', []);
  assert.doesNotMatch(unreached.api, /which it does not resolve/);
  assert.equal(wired.exit, bare.exit);
  assert.equal(wired.exit, unreached.exit);
  // The repo's own grapher's artifact is never foreign: web holds graphify's.
  mkdirSync(join(eco.repos.web, 'graphify-out'), { recursive: true });
  writeFileSync(join(eco.repos.web, 'graphify-out/graph.json'), '{}\n');
  const { lines } = await (async () => {
    const old = process.env.PATH;
    process.env.PATH = [binDir, '/usr/bin', '/bin'].join(delimiter);
    try {
      return await doctorReport(eco.brain);
    } finally {
      process.env.PATH = old;
    }
  })();
  assert.doesNotMatch(lines.find((l) => l.startsWith('grapher    graphify @ web: ')) ?? '', /which it does not resolve/);

  // A follow hook wired through web's own node_modules/.bin alone: moved
  // into api, the hook finds no graphify, so api holding its artifact is no
  // fact — the lookup is asked from the repo itself.
  const cgOnly = join(eco.brain, '..', 'cgbin');
  mkdirSync(cgOnly, { recursive: true });
  writeFileSync(join(cgOnly, 'codegraph'), '#!/bin/sh\nexit 0\n');
  chmodSync(join(cgOnly, 'codegraph'), 0o755);
  mkdirSync(join(eco.repos.web, 'node_modules', '.bin'), { recursive: true });
  writeFileSync(join(eco.repos.web, 'node_modules', '.bin', 'graphify'), '#!/bin/sh\nexit 0\n');
  chmodSync(join(eco.repos.web, 'node_modules', '.bin', 'graphify'), 0o755);
  const webOnly = await report('agents, claude', [cgOnly]);
  assert.ok(webOnly.api.startsWith('grapher    codegraph @ api: '), webOnly.api);
  assert.doesNotMatch(webOnly.api, /which it does not resolve/);
});

// MV-149. The brain's own hook — no follow hook — moves into any repo holding
// its artifact too: in a graphify brain that holds code, api on codegraph
// holding a graphify graph is named while that hook is wired, which `doors`
// decides by the lookup in the brain.
test("a sibling holding the brain grapher's artifact is named while the brain's own hook is wired", async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-foreign-own-')), { brainIsCode: true });
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    'doors: [agents, claude]\ngrapher: graphify\nrepos:\n  brain: .\n  api:\n    path: ../acme-api\n    grapher: codegraph\n',
  );
  mkdirSync(join(eco.repos.api, 'graphify-out'), { recursive: true });
  writeFileSync(join(eco.repos.api, 'graphify-out/graph.json'), '{}\n');
  const bin = (name: string, ...tools: string[]): string => {
    const dir = join(eco.brain, '..', name);
    mkdirSync(dir, { recursive: true });
    for (const t of tools) {
      writeFileSync(join(dir, t), '#!/bin/sh\nexit 0\n');
      chmodSync(join(dir, t), 0o755);
    }
    return dir;
  };
  const api = async (path: string[]): Promise<string> => {
    const old = process.env.PATH;
    process.env.PATH = [...path, '/usr/bin', '/bin'].join(delimiter);
    try {
      return (await doctorReport(eco.brain)).lines.find((l) => l.startsWith('grapher    codegraph @ api: ')) ?? '';
    } finally {
      process.env.PATH = old;
    }
  };
  const fact = ` · also holds graphify-out/graph.json of graphify, which it does not resolve — graphify's post-edit hook refreshes it there; remove it: cd ${eco.repos.api} && `;
  assert.ok((await api([bin('both', 'graphify', 'codegraph')])).includes(fact));
  // graphify found from api alone, never from the brain: `doors` wires no
  // brain hook, so nothing refreshes api's copy and nothing is said.
  mkdirSync(join(eco.repos.api, 'node_modules', '.bin'), { recursive: true });
  writeFileSync(join(eco.repos.api, 'node_modules', '.bin', 'graphify'), '#!/bin/sh\nexit 0\n');
  chmodSync(join(eco.repos.api, 'node_modules', '.bin', 'graphify'), 0o755);
  const unwired = await api([bin('cg', 'codegraph')]);
  assert.ok(unwired.startsWith('grapher    codegraph @ api: '), unwired);
  assert.doesNotMatch(unwired, /which it does not resolve/);
});

// MV-148. A brain no repos entry declares holds no code and resolves no
// grapher; an install an earlier release left there is kept until a human
// removes it, and doctor prints that removal — the vendor's own uninstall per
// platform found, the one its registry entry marks first leading — and runs
// nothing.
test('doctor: a kept install in a code-less brain is named with its removal, gemini first', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-kept-')));
  const b = eco.brain;
  const config =
    'doors: [agents, claude]\ngrapher: graphify\ngraphers:\n  acme:\n    artifact: acme-out/graph.json\n    refresh: acme update .\nrepos:\n  api: ../acme-api\n  web: ../acme-web\n';
  writeFileSync(join(b, '.multivac/config.yml'), config);
  const git = (...a: string[]): void => {
    execFileSync('git', ['-C', b, ...a], { stdio: 'ignore' });
  };
  git('add', '-A');
  git('commit', '-qm', 'config');
  const old = process.env.PATH;
  process.env.PATH = ['/usr/bin', '/bin'].join(delimiter);
  const grapher = async (): Promise<{ lines: string[]; exit: number }> => {
    const r = await doctorReport(b);
    return { lines: r.lines.filter((l) => l.startsWith('grapher')), exit: r.exit };
  };
  const fact =
    "grapher    brain: holds no code (no repos entry is the brain), so no code graph is built, gated or refreshed here — agents here ask the code repos' graphs; if this repo holds code, add `brain: .` under repos:";
  try {
    const clean = await grapher();
    assert.ok(clean.lines.includes(fact), clean.lines.join('\n'));
    assert.ok(!clean.lines.some((l) => l.includes('leftover')), clean.lines.join('\n'));

    // What an earlier release left: graphify for agents, claude and gemini —
    // gemini is no declared door here — its graph and ignore file committed;
    // a codegraph index; a declared grapher's graph, untracked.
    const put = (rel: string, body = 'x\n'): void => {
      mkdirSync(join(b, rel, '..'), { recursive: true });
      writeFileSync(join(b, rel), body);
    };
    for (const p of ['agents', 'claude', 'gemini']) put(`.${p}/skills/graphify/SKILL.md`);
    put('graphify-out/graph.json', '{"nodes":[],"links":[]}\n');
    put('.graphifyignore', '.claude/\n');
    git('add', '-A');
    git('commit', '-qm', 'an earlier release');
    put('.codegraph/codegraph.db');
    put('acme-out/graph.json', '{}\n');

    const kept = await grapher();
    const out = kept.lines.join('\n');
    assert.equal(kept.exit, clean.exit, 'the exit code is unchanged');
    assert.ok(kept.lines.includes(fact), out);
    assert.ok(
      kept.lines.includes(
        `grapher    leftover graphify install @ brain: platforms gemini, agents, claude and graphify-out/graph.json (tracked) — kept until you remove it; it graphs none of the code, and graphify's own section and hooks still send agents to it. Remove: cd ${b} && graphify uninstall --project --platform gemini && graphify uninstall --project --platform agents && graphify uninstall --project --platform claude && git rm -q --ignore-unmatch -- graphify-out/graph.json .graphifyignore && rm -rf graphify-out .graphifyignore; review \`git diff\` (the uninstall drops the whole hook group it wrote, commands you added to it included, and leaves an emptied hook list in each settings file it touched), then \`multivac doors\` and commit`,
      ),
      out,
    );
    assert.ok(
      kept.lines.includes(
        `grapher    leftover codegraph index @ brain: .codegraph/codegraph.db (local) — kept until you remove it; it indexes none of the code. Remove: cd ${b} && codegraph uninit --force, then \`multivac doors\``,
      ),
      out,
    );
    assert.ok(
      kept.lines.includes(
        `grapher    leftover acme graph @ brain: acme-out/graph.json (untracked) — kept until you remove it; it graphs none of the code. Remove: cd ${b} && git rm -q --ignore-unmatch -- acme-out/graph.json && rm -f acme-out/graph.json, then \`multivac doors\` and commit`,
      ),
      out,
    );
    // Never a refresh, a build or an install for the brain, and no scope line.
    const brainLines = kept.lines.filter((l) => /@ brain|grapher {4}brain:/.test(l));
    assert.doesNotMatch(brainLines.join('\n'), /`graphify update \.`|`graphify install /);
    assert.doesNotMatch(out, /none @ brain/);

    // The probe reads every platform, declared door or not, and tracked is
    // git's answer over what it found.
    rmSync(join(b, 'graphify-out'), { recursive: true });
    rmSync(join(b, '.graphifyignore'));
    rmSync(join(b, '.agents'), { recursive: true });
    rmSync(join(b, '.claude/skills/graphify'), { recursive: true });
    git('add', '-A', '--', 'graphify-out', '.graphifyignore', '.agents', '.claude');
    git('commit', '-qm', 'half removed');
    const left = await leftoverGraphs(await loadConfig(b), b);
    assert.deepEqual(
      left.map((l) => [l.name, l.kind, l.tracked, l.platforms, l.artifact ?? null]),
      [
        ['graphify', 'shared', true, ['gemini'], null],
        ['codegraph', 'local', false, [], '.codegraph/codegraph.db'],
        ['acme', 'declared', false, [], 'acme-out/graph.json'],
      ],
    );
    // gemini's own door is not declared here, so its install wrote no section
    // this door carries: the line names the hooks alone (FR-022).
    const gemini = renderBrainDoor(await loadConfig(b), 1, left);
    assert.ok(
      gemini.includes(
        "- `.gemini/skills/graphify/SKILL.md` here is a leftover that holds no code: graphify's own hooks point at it — ask the code repos' graphs above instead; `multivac doctor` prints its removal.",
      ),
      gemini,
    );
    assert.doesNotMatch(gemini, /## graphify/);

    // Removed, as printed: only the fact line is left.
    rmSync(join(b, '.gemini'), { recursive: true });
    rmSync(join(b, '.codegraph'), { recursive: true });
    rmSync(join(b, 'acme-out'), { recursive: true });
    git('add', '-A');
    git('commit', '-qm', 'removed');
    const after = await grapher();
    assert.ok(after.lines.includes(fact), after.lines.join('\n'));
    assert.ok(!after.lines.some((l) => l.includes('leftover')), after.lines.join('\n'));
    assert.equal(after.exit, clean.exit);

    // An `agents` skill alone: that platform writes no section and no hook,
    // so neither the line nor the door claims one (MV-143), and the door names
    // what is there, not a `graphify-out/` that is not.
    put('.agents/skills/graphify/SKILL.md');
    const skill = await grapher();
    assert.ok(
      skill.lines.includes(
        `grapher    leftover graphify install @ brain: platforms agents (untracked) — kept until you remove it; it graphs none of the code. Remove: cd ${b} && graphify uninstall --project --platform agents && git rm -q --ignore-unmatch -- graphify-out/graph.json .graphifyignore && rm -rf graphify-out .graphifyignore; review \`git diff\` (the uninstall drops the whole hook group it wrote, commands you added to it included, and leaves an emptied hook list in each settings file it touched), then \`multivac doors\` and commit`,
      ),
      skill.lines.join('\n'),
    );
    const door = renderBrainDoor(await loadConfig(b), 1, await leftoverGraphs(await loadConfig(b), b));
    assert.ok(
      door.includes(
        "- `.agents/skills/graphify/SKILL.md` here is a leftover that holds no code — ask the code repos' graphs above instead; `multivac doctor` prints its removal.",
      ),
      door,
    );
    assert.doesNotMatch(door, /## graphify|own hooks/);
  } finally {
    process.env.PATH = old;
  }
});

// MV-148 (FR-018, FR-021, FR-022). A code-less brain that declares no grapher
// asks none from itself, and an install an earlier release left there is found
// all the same: `doctor` states the fact and prints the removal, its exit
// unchanged, and the door names the leftover without pointing "above" at
// graphs it does not list.
test('doctor: a kept install in a code-less brain that declares no grapher is still named with its removal', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-kept-none-')));
  const b = eco.brain;
  writeFileSync(join(b, '.multivac/config.yml'), 'doors: [agents, claude]\nrepos:\n  api: ../acme-api\n  web: ../acme-web\n');
  const git = (...a: string[]): void => {
    execFileSync('git', ['-C', b, ...a], { stdio: 'ignore' });
  };
  git('add', '-A');
  git('commit', '-qm', 'config');
  const old = process.env.PATH;
  process.env.PATH = ['/usr/bin', '/bin'].join(delimiter);
  try {
    const clean = await doctorReport(b);
    // Nothing asked, nothing kept: silence, as ever.
    assert.deepEqual(clean.lines.filter((l) => l.startsWith('grapher')), []);

    for (const [rel, body] of [
      ['.claude/skills/graphify/SKILL.md', 'x\n'],
      ['graphify-out/graph.json', '{"nodes":[],"links":[]}\n'],
    ]) {
      mkdirSync(join(b, rel, '..'), { recursive: true });
      writeFileSync(join(b, rel), body);
    }
    git('add', '-A');
    git('commit', '-qm', 'an earlier release');
    const kept = await doctorReport(b);
    const lines = kept.lines.filter((l) => l.startsWith('grapher'));
    assert.equal(kept.exit, clean.exit, 'the exit code is unchanged');
    assert.ok(
      lines.includes(
        "grapher    brain: holds no code (no repos entry is the brain), so no code graph is built, gated or refreshed here — agents here ask the code repos' graphs; if this repo holds code, add `brain: .` under repos:",
      ),
      lines.join('\n'),
    );
    assert.ok(
      lines.includes(
        `grapher    leftover graphify install @ brain: platforms claude and graphify-out/graph.json (tracked) — kept until you remove it; it graphs none of the code, and graphify's own section and hooks still send agents to it. Remove: cd ${b} && graphify uninstall --project --platform claude && git rm -q --ignore-unmatch -- graphify-out/graph.json .graphifyignore && rm -rf graphify-out .graphifyignore; review \`git diff\` (the uninstall drops the whole hook group it wrote, commands you added to it included, and leaves an emptied hook list in each settings file it touched), then \`multivac doors\` and commit`,
      ),
      lines.join('\n'),
    );
    assert.doesNotMatch(lines.join('\n'), /`graphify update \.`|`graphify install /);

    // The door lists no code repo's graph here, so the line points at none.
    const door = renderBrainDoor(await loadConfig(b), 1, await leftoverGraphs(await loadConfig(b), b));
    assert.ok(
      door.includes(
        "- `graphify-out/` here is a leftover that holds no code: the `## graphify` section below and graphify's own hooks point at it — ask the code repos' graphs instead; `multivac doctor` prints its removal.",
      ),
      door,
    );
    assert.doesNotMatch(door, /graphs above/);
  } finally {
    process.env.PATH = old;
  }
});

// MV-148. The grapher's ignore file at an installed, writable root: what it
// lacks, whether a clone gets it, and what the graph still holds under it —
// read only, since a line appended over a built graph makes every plain
// refresh refuse; the next `change land` naming the root appends.
test("doctor: the ignore file's missing lines, its commit and the nodes under it are facts, never writes", async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-ignore-')));
  const b = eco.brain;
  const { api, web } = eco.repos;
  writeFileSync(
    join(b, '.multivac/config.yml'),
    'doors: [agents]\ngrapher: graphify\nrepos:\n  brain: .\n  api: ../acme-api\n  web:\n    path: ../acme-web\n    managed: false\n',
  );
  const git = (dir: string, ...a: string[]): void => {
    execFileSync('git', ['-C', dir, ...a], { stdio: 'ignore' });
  };
  const graph = (...files: string[]): string =>
    JSON.stringify({ nodes: files.map((f, i) => ({ id: `n${i}`, source_file: f })), links: [] }) + '\n';
  const cfg = await loadConfig(b);
  const spec = grapherSpec('graphify')!;
  // The brain: every derived line committed under its record — no fact.
  const brainLines = graphIgnoreLines(cfg, b, 'brain', spec);
  writeFileSync(join(b, '.graphifyignore'), `${brainLines.join('\n')}\n# multivac: kept out of the graph — ${brainLines.join(' ')}\n`);
  mkdirSync(join(b, 'graphify-out'), { recursive: true });
  writeFileSync(join(b, 'graphify-out/graph.json'), graph('src/app.ts'));
  git(b, 'add', '-A');
  git(b, 'commit', '-qm', 'graph');
  // api: a committed graph two of whose nodes sit under `.claude/`, and an
  // ignore file never committed that holds that line and a human's `docs/`.
  mkdirSync(join(api, 'graphify-out'), { recursive: true });
  writeFileSync(join(api, 'graphify-out/graph.json'), graph('src/server.ts', '.claude/skills/a/SKILL.md', '.claude/settings.json'));
  git(api, 'add', '-A');
  git(api, 'commit', '-qm', 'graph');
  const apiIgnore = join(api, '.graphifyignore');
  writeFileSync(apiIgnore, 'docs/\n/.claude/\n# multivac: kept out of the graph — /.claude/\n');
  utimesSync(apiIgnore, new Date(1000), new Date(1000));
  // web: read-only (MV-125) — the same state, and no fact.
  mkdirSync(join(web, 'graphify-out'), { recursive: true });
  writeFileSync(join(web, 'graphify-out/graph.json'), graph('.claude/x.md'));
  writeFileSync(join(web, '.graphifyignore'), '/.claude/\n');
  git(web, 'add', 'graphify-out');
  git(web, 'commit', '-qm', 'graph');

  const { lines, exit } = await doctorReport(b);
  const grapher = lines.filter((l) => l.startsWith('grapher'));
  const at = (scope: string): string => {
    const l = grapher.find((x) => x.includes(`@ ${scope}:`) || x.includes(`${scope}: `));
    assert.ok(l, `no ${scope} line in:\n${grapher.join('\n')}`);
    return l;
  };
  const apiLacks = graphIgnoreLines(cfg, b, 'api', spec).filter((l) => l !== '/.claude/');
  assert.ok(apiLacks.includes('/.brain/') && !apiLacks.includes('/specs/'), apiLacks.join(' '));
  assert.ok(
    at('api').includes(
      ` · .graphifyignore lacks ${apiLacks.length} line(s) multivac keeps out of the graph (${apiLacks.join(', ')}) — the next \`change land\` naming api appends them, and rebuilds if the graph holds nodes under them` +
        ' · .graphifyignore is not committed — a clone or worktree graphs without it' +
        " · the graph still holds 2 node(s) under .graphifyignore's lines — a plain refresh refuses to shrink; run `graphify update . --force` there",
    ),
    at('api'),
  );
  assert.doesNotMatch(at('brain'), /\.graphifyignore/);
  assert.doesNotMatch(at('web'), /\.graphifyignore|node\(s\)/);
  assert.equal(exit, 0);
  // Read only: the file keeps its bytes and its mtime.
  assert.equal(readFileSync(apiIgnore, 'utf8'), 'docs/\n/.claude/\n# multivac: kept out of the graph — /.claude/\n');
  assert.equal(statSync(apiIgnore).mtimeMs, 1000);

  // No ignore file at all: every derived line is missing, and nothing is
  // "not committed" — there is no file to commit, and none is written.
  rmSync(apiIgnore);
  const bare = (await doctorReport(b)).lines.find((x) => x.startsWith('grapher') && x.includes('@ api:'));
  const every = graphIgnoreLines(cfg, b, 'api', spec);
  assert.ok(
    bare?.includes(
      ` · .graphifyignore lacks ${every.length} line(s) multivac keeps out of the graph (${every.join(', ')}) — the next \`change land\` naming api appends them, and rebuilds if the graph holds nodes under them`,
    ),
    bare,
  );
  assert.doesNotMatch(bare!, /is not committed|node\(s\) under/);
  assert.equal(existsSync(apiIgnore), false);
});

// MV-149. codegraph's ignore file is its codegraph.json: doctor names what it
// lacks, a copy never committed and one that does not parse, reading only.
test("doctor: codegraph.json's missing lines, its commit and its parse are facts, never writes", async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-cgjson-')), { brainIsCode: true });
  const b = eco.brain;
  const { api, web } = eco.repos;
  writeFileSync(
    join(b, '.multivac/config.yml'),
    'doors: [agents]\ngrapher: codegraph\nrepos:\n  brain: .\n  api: ../acme-api\n  web:\n    path: ../acme-web\n    managed: false\n',
  );
  const git = (dir: string, ...a: string[]): void => {
    execFileSync('git', ['-C', dir, ...a], { stdio: 'ignore' });
  };
  // Each root built: the database is what the probe reads.
  for (const dir of [b, api, web]) {
    mkdirSync(join(dir, '.codegraph'), { recursive: true });
    writeFileSync(join(dir, '.codegraph/codegraph.db'), 'SQLite format 3\0');
  }
  const file = join(api, 'codegraph.json');
  const at = async (scope: string): Promise<string> => {
    const l = (await doctorReport(b)).lines.find((x) => x.startsWith(`grapher    codegraph @ ${scope}: `));
    assert.ok(l, `no ${scope} line`);
    return l;
  };
  const lacks = ' · codegraph.json lacks 1 line(s) multivac keeps out of the index (/.brain/) — the next `change land` naming api adds them';
  const uncommitted = ' · codegraph.json is not committed — a clone or worktree with its mount initialised indexes the mount';
  const malformed = ' · codegraph.json does not parse to an object with an "exclude" list — codegraph ignores it too; add /.brain/ by hand';
  assert.deepEqual([lacks, uncommitted, malformed].map((f) => Buffer.byteLength(`${f}\n`)), [126, 105, 121]);

  // Committed, lacking the mount: the next land adds it.
  writeFileSync(file, '{"exclude":["dist/"]}\n');
  git(api, 'add', 'codegraph.json');
  git(api, 'commit', '-qm', 'codegraph.json');
  utimesSync(file, new Date(1000), new Date(1000));
  assert.ok((await at('api')).endsWith(lacks), await at('api'));
  assert.equal(readFileSync(file, 'utf8'), '{"exclude":["dist/"]}\n');
  assert.equal(statSync(file).mtimeMs, 1000);
  // Absent: every line lacking, nothing to commit, and none written.
  git(api, 'rm', '-q', 'codegraph.json');
  git(api, 'commit', '-qm', 'no codegraph.json');
  assert.ok((await at('api')).endsWith(lacks), await at('api'));
  assert.equal(existsSync(file), false);
  // Holding the line, never committed: a clone indexes the mount.
  writeFileSync(file, '{\n  "exclude": [\n    "/.brain/"\n  ]\n}\n');
  assert.ok((await at('api')).endsWith(uncommitted), await at('api'));
  // Committed with the line: no fact.
  git(api, 'add', 'codegraph.json');
  git(api, 'commit', '-qm', 'codegraph.json');
  assert.doesNotMatch(await at('api'), /codegraph\.json/);
  // Not an object with an "exclude" list: said, and left as it is.
  writeFileSync(file, '{"exclude":"dist/"}\n');
  assert.ok((await at('api')).endsWith(malformed), await at('api'));
  assert.equal(readFileSync(file, 'utf8'), '{"exclude":"dist/"}\n');
  // A read-only root: the same state, no fact (MV-125). The brain that holds
  // code and nests no repo keeps nothing out: no fact either.
  writeFileSync(join(web, 'codegraph.json'), '{"exclude":["dist/"]}\n');
  const webLine = (await doctorReport(b)).lines.find((l) => l.startsWith('grapher') && /\bweb\b/.test(l));
  assert.ok(webLine, 'a grapher line for web');
  assert.doesNotMatch(webLine, /codegraph\.json/);
  assert.doesNotMatch((await at('brain')), /codegraph\.json/);
  assert.equal(readFileSync(join(web, 'codegraph.json'), 'utf8'), '{"exclude":["dist/"]}\n');
  assert.equal(existsSync(join(b, 'codegraph.json')), false);

  // Ignored by git, and absent: land would refuse it by name and write
  // nothing, so doctor names the rule instead of promising the lines.
  git(api, 'rm', '-qf', 'codegraph.json');
  writeFileSync(join(api, '.gitignore'), 'codegraph.json\n');
  git(api, 'add', '.gitignore');
  git(api, 'commit', '-qm', 'ignore codegraph.json');
  const ignored = ` · codegraph.json is ignored in ${api} — \`git -C ${api} check-ignore -v codegraph.json\` names the rule; \`change land\` writes nothing while it is`;
  assert.ok((await at('api')).endsWith(ignored), await at('api'));
  assert.equal(Buffer.byteLength(`${ignored.replaceAll(api, '/srv/eco/api')}\n`), 160);
  assert.doesNotMatch(await at('api'), /lacks 1 line/);
  assert.equal(existsSync(file), false);
  // Present and ignored: the rule still, never "not committed".
  writeFileSync(file, '{"exclude":["dist/"]}\n');
  assert.ok((await at('api')).endsWith(ignored), await at('api'));

  // A brain that holds code and nests a declared repo keeps that repo out,
  // no mount: an uncommitted file says what a clone indexes.
  writeFileSync(
    join(b, '.multivac/config.yml'),
    'doors: [agents]\ngrapher: codegraph\nrepos:\n  brain: .\n  inner: packages/inner\n',
  );
  writeFileSync(join(b, 'codegraph.json'), '{\n  "exclude": [\n    "/packages/inner/"\n  ]\n}\n');
  assert.ok(
    (await at('brain')).endsWith(' · codegraph.json is not committed — a clone or worktree indexes what it keeps out (/packages/inner/)'),
    await at('brain'),
  );
});

// MV-149. A repo's own grapher's artifact is its own, whoever else writes
// that path: a repo on a declared grapher writing graphify-out/graph.json is
// never told it also holds graphify's, with a removal of its own graph.
test("a repo's own grapher's artifact is never another grapher's leftover", async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-own-art-')));
  const decl = 'graphers:\n  outgraph:\n    artifact: graphify-out/graph.json\n    refresh: outgraph update .\n';
  mkdirSync(join(eco.repos.api, 'graphify-out'), { recursive: true });
  writeFileSync(join(eco.repos.api, 'graphify-out/graph.json'), '{}\n');
  writeFileSync(join(eco.brain, '.multivac/config.yml'), `doors: [agents]\n${decl}repos:\n  api:\n    path: ../acme-api\n    grapher: outgraph\n`);
  assert.deepEqual(await leftoverGraphs(await loadConfig(eco.brain), eco.repos.api, 'api'), []);
  // On codegraph, the same file is graphify's, which api does not resolve.
  writeFileSync(join(eco.brain, '.multivac/config.yml'), `doors: [agents]\n${decl}repos:\n  api:\n    path: ../acme-api\n    grapher: codegraph\n`);
  const other = await leftoverGraphs(await loadConfig(eco.brain), eco.repos.api, 'api');
  assert.deepEqual(other.map((l) => [l.name, l.artifact]), [['graphify', 'graphify-out/graph.json'], ['outgraph', 'graphify-out/graph.json']]);
});

test("a human's codegraph.json is never a leftover", async () => {
  // A brain that holds no code and keeps only a codegraph.json: the human's
  // config for an index built elsewhere, never a kept install.
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-cgjson-human-')));
  writeFileSync(join(eco.brain, 'codegraph.json'), '{"exclude":["dist/"]}\n');
  const cfg = await loadConfig(eco.brain);
  assert.deepEqual(await leftoverGraphs(cfg, eco.brain), []);
  assert.doesNotMatch((await doctorReport(eco.brain)).lines.join('\n'), /leftover codegraph/);
  // Beside its database it is the install's, and named with it.
  mkdirSync(join(eco.brain, '.codegraph'));
  writeFileSync(join(eco.brain, '.codegraph/codegraph.db'), 'SQLite format 3\0');
  const kept = (await leftoverGraphs(cfg, eco.brain)).find((l) => l.name === 'codegraph');
  assert.equal(kept?.ignoreFile, 'codegraph.json');
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

test('doctor: a mount staged but not committed is not called missing — MV-127', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-staged-')));
  // A gitlink in the index only — what `repos sync` leaves behind for a human
  // to commit. Telling that human to create what they already have staged is
  // the report lying about the state.
  const sha = execFileSync('git', ['-C', eco.brain, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  execFileSync('git', ['-C', eco.repos.api, 'update-index', '--add', '--cacheinfo', `160000,${sha},.brain`], {
    stdio: 'ignore',
  });
  const { lines } = await doctorReport(eco.brain);
  const pins = line(lines, 'pins');
  assert.match(pins, /api: brain mount staged, not committed — commit it in/);
  assert.doesNotMatch(pins, /api: no brain mount/);
});
