// doctor on a scratch ecosystem: full report, read-only, exit 0 unless the
// config itself is invalid.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { makeScratchEcosystem, publishRepo } from '../helpers/fixture.js';
import { SPECKIT_INTEGRATION_JSON } from '../helpers/recorded.js';
import { doctorCommand, doctorReport } from '../../src/commands/doctor.js';
import { installHooks } from '../../src/hooks/install.js';
import { sddSpec } from '../../src/adapters/registry.js';
import { leftoverVendors } from '../../src/lib/dropped.js';
import { doorsCommand } from '../../src/commands/doors.js';

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
 * MV-87: the SDD pass reports per root.
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

test('doctor: symlink door ok', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc3-')));
  writeFileSync(join(eco.brain, '.multivac/config.yml'), 'doors: [claude]\nrepos:\n  brain: .\n');
  symlinkSync('AGENTS.md', join(eco.brain, 'CLAUDE.md'));
  const { lines, exit } = await doctorReport(eco.brain);
  assert.equal(exit, 0);
  assert.match(line(lines, 'doors'), /claude: CLAUDE\.md ok \(symlink\)/);
  // MV-153: no graph is reported, stale or fresh.
  assert.equal(lines.some((l) => l.startsWith('grapher')), false, lines.join('\n'));
});

test('a codegraph.json with no index beside it is never named', async () => {
  // A brain that keeps only a codegraph.json: the human's config for an index
  // built elsewhere, never what an earlier release left (MV-149).
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doc-cgjson-human-')));
  writeFileSync(join(eco.brain, 'codegraph.json'), '{"exclude":["dist/"]}\n');
  assert.deepEqual(await leftoverVendors(eco.brain), []);
  assert.doesNotMatch((await doctorReport(eco.brain)).lines.join('\n'), /codegraph/);
  // Beside its index it is the install's, and named with it.
  mkdirSync(join(eco.brain, '.codegraph'));
  writeFileSync(join(eco.brain, '.codegraph/codegraph.db'), 'SQLite format 3\0');
  const kept = (await leftoverVendors(eco.brain)).find((l) => l.vendor.name === 'codegraph');
  assert.equal(kept?.ignoreFile, 'codegraph.json');
});

// --- MV-153: what an earlier release's graphers left, named with its removal ---

const put = (root: string, rel: string, body: string): void => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), body);
};

/** The post-edit refresh an earlier multivac wrote: what matters is its head. */
const OLD_REFRESH = (build: string): string =>
  `L=.multivac/cache/graph-refresh.lock; mkdir -p .multivac/cache && mkdir "$L" 2>/dev/null || exit 0; { ${build}; rmdir "$L"; } >/dev/null 2>&1 </dev/null & exit 0`;
const refreshes = (...builds: string[]): string =>
  JSON.stringify({ hooks: { PostToolUse: [{ matcher: 'Edit|Write|MultiEdit', hooks: builds.map((b) => ({ type: 'command', command: OLD_REFRESH(b) })) }] } });

/** Every file under `root` but git's own, by content hash. */
function checksums(root: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const e of readdirSync(root, { recursive: true, withFileTypes: true })) {
    const p = join(e.parentPath, e.name);
    if (!e.isFile() || /(^|\/)\.git(\/|$)/.test(p.slice(root.length))) continue;
    out.set(p, createHash('sha256').update(readFileSync(p)).digest('hex'));
  }
  return out;
}

/** A PATH where each vendor's binary only logs that it ran. */
function loggingVendors(): { path: string; log: string } {
  const bin = mkdtempSync(join(tmpdir(), 'mvac-vendor-log-'));
  const log = join(bin, 'ran.log');
  for (const name of ['graphify', 'codegraph']) {
    writeFileSync(join(bin, name), `#!/bin/sh\necho "${name} $*" >> '${log}'\nexit 0\n`);
    chmodSync(join(bin, name), 0o755);
  }
  return { path: [bin, '/usr/bin', '/bin'].join(delimiter), log };
}

const leftovers = (lines: string[]): string[] => lines.filter((l) => /^(config|leftover) /.test(l));

test("doctor names what an earlier release's graphers left, with its removal, and runs nothing — MV-153", async () => {
  const eco = makeScratchEcosystem(realpathSync(mkdtempSync(join(tmpdir(), 'mvac-doc-left-'))));
  const root = dirname(eco.brain);
  const b = eco.brain;
  const web = eco.repos.web;
  put(b, '.multivac/config.yml', 'doors: [agents, claude]\ngrapher: graphify\nrepos:\n  api: ../acme-api\n  web:\n    path: ../acme-web\n    grapher: codegraph\n');
  put(b, '.multivac/ecosystem.json', '{"nodes":[],"links":[]}\n');
  put(b, '.claude/settings.json', refreshes('graphify update .'));
  put(b, '.claude/settings.json.graphify-bak', '{}\n');
  put(b, 'graphify-out/graph.json', '{"nodes":[],"links":[]}\n');
  put(b, '.graphifyignore', '.multivac/\n');
  put(b, '.agents/skills/graphify/SKILL.md', 'x\n');
  put(b, '.claude/skills/graphify/SKILL.md', 'x\n');
  put(b, '.gitignore', 'graphify-out/*\n!graphify-out/graph.json\n*.graphify-bak\n');
  execFileSync('git', ['-C', b, 'add', '-A']);
  execFileSync('git', ['-C', b, 'commit', '-q', '-m', 'an earlier release']);
  put(eco.repos.api, '.claude/settings.json', refreshes('graphify update .', 'codegraph sync'));
  put(web, '.codegraph/codegraph.db', 'SQLite format 3\0');
  put(web, 'codegraph.json', '{"exclude":["dist/"]}\n');
  put(web, '.gitignore', '.codegraph/\n');

  const vendors = loggingVendors();
  const before = checksums(root);
  const old = process.env.PATH;
  process.env.PATH = vendors.path;
  let report: { lines: string[]; exit: number };
  try {
    report = await doctorReport(b);
  } finally {
    process.env.PATH = old;
  }
  assert.equal(report.exit, 0, report.lines.join('\n'));
  assert.equal(existsSync(vendors.log), false, 'doctor ran a vendor');
  assert.deepEqual(checksums(root), before, 'doctor changed a file');
  const how = 'with a change open (`multivac change new <slug>`)';
  assert.deepEqual(leftovers(report.lines), [
    `config     grapher, repos.web.grapher ignored — multivac keeps no code graph; delete them from .multivac/config.yml ${how}`,
    'leftover   .multivac/ecosystem.json — no longer rendered or read; `multivac doors` removes it',
    'leftover   .claude/settings.json @ brain: 1 post-edit graph refresh hook an earlier multivac wrote — `multivac doors` removes it',
    'leftover   .claude/settings.json @ api: 2 post-edit graph refresh hooks an earlier multivac wrote — `multivac doors` removes them',
    `leftover   graphify @ brain: graphify-out/ (tracked), .graphifyignore, its agents and claude installs — left by an earlier release; ` +
      "nothing refreshes it, so it answers for an older tree, and graphify's own hooks still send agents to it. " +
      `Remove: cd ${b} && graphify uninstall --project --platform agents && graphify uninstall --project --platform claude && ` +
      'git rm -r -q --ignore-unmatch -- graphify-out .graphifyignore && rm -rf graphify-out .graphifyignore; ' +
      'drop `graphify-out/*` `!graphify-out/graph.json` from .gitignore; ' +
      '`.claude/settings.json.graphify-bak` is your own pre-install copy: keep `*.graphify-bak` in .gitignore while it is there; ' +
      'review `git diff` — each uninstall drops the whole hook group it wrote — then commit',
    `leftover   codegraph @ web: .codegraph/ (local), codegraph.json — left by an earlier release; nothing syncs it, so it answers for an older tree. ` +
      `Remove: cd ${web} && rm -rf .codegraph; drop \`.codegraph/\` from .gitignore; ` +
      'codegraph.json is codegraph\'s own config: delete it, or drop from its "exclude" the lines an earlier multivac added — then commit',
  ]);
  // After the head, before the repos.
  const at = (re: RegExp) => report.lines.findIndex((l) => re.test(l));
  assert.ok(at(/^doors /) < at(/^config /) && at(/^leftover .*codegraph @ web/) < at(/^repos /), report.lines.join('\n'));

  // What multivac wrote goes with `doors`; the rest by hand, as printed: then
  // only the config line is left.
  const quiet = console.log;
  console.log = () => {};
  try {
    assert.equal(await doorsCommand.run([], { cwd: b }), 0);
  } finally {
    console.log = quiet;
  }
  for (const p of ['graphify-out', '.graphifyignore', '.agents/skills/graphify', '.claude/skills/graphify']) rmSync(join(b, p), { recursive: true });
  for (const p of ['.codegraph', 'codegraph.json']) rmSync(join(web, p), { recursive: true });
  assert.deepEqual(leftovers((await doctorReport(b)).lines), [
    `config     grapher, repos.web.grapher ignored — multivac keeps no code graph; delete them from .multivac/config.yml ${how}`,
  ]);
});

test('a leftover in a read-only repo is not named — MV-153', async () => {
  const eco = makeScratchEcosystem(realpathSync(mkdtempSync(join(tmpdir(), 'mvac-doc-left-ro-'))));
  put(eco.brain, '.multivac/config.yml', 'doors: [agents, claude]\nrepos:\n  api:\n    path: ../acme-api\n    managed: false\n  web: ../acme-web\n');
  for (const dir of [eco.repos.api, eco.repos.web]) {
    put(dir, '.claude/settings.json', refreshes('graphify update .'));
    put(dir, 'graphify-out/graph.json', '{}\n');
    put(dir, '.cursor/rules/graphify.mdc', 'x\n');
    put(dir, '.codegraph/codegraph.db', 'x');
  }
  const found = leftovers((await doctorReport(eco.brain)).lines);
  assert.equal(found.some((l) => l.includes('@ api')), false, found.join('\n'));
  // The writable one beside it is named, each.
  assert.deepEqual(found.map((l) => l.replace(/:.*/, '')), [
    'leftover   .claude/settings.json @ web',
    'leftover   graphify @ web',
    'leftover   codegraph @ web',
  ]);
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

test('doctor in a brain change worktree finds the siblings the main checkout has — MV-151', async () => {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-doc-wt-')));
  const eco = makeScratchEcosystem(tmp);
  const g = (cwd: string, ...args: string[]): string =>
    execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    'doors: [agents]\nrepos:\n  api:\n    path: ../acme-api\n    url: git@acme.example:acme/api.git\n  web:\n    path: ../acme-web\n    url: git@acme.example:acme/web.git\n',
  );
  g(eco.brain, 'add', '-A');
  g(eco.brain, 'commit', '-qm', 'urls');
  // Clones of what the brain declares: each sibling's origin is its url.
  g(eco.repos.api, 'remote', 'add', 'origin', 'git@acme.example:acme/api.git');
  g(eco.repos.web, 'remote', 'add', 'origin', 'git@acme.example:acme/web.git');
  const wt = join(eco.brain, '.multivac/worktrees/demo/brain');
  g(eco.brain, 'worktree', 'add', '-q', '-b', 'demo', wt);
  // Beside the main checkout, not beside the worktree: found, never cloned again.
  const found = await doctorReport(wt);
  assert.match(line(found.lines, 'repos'), /^repos +2\/2 cloned/);
  assert.doesNotMatch(found.lines.join('\n'), /git clone/);
  // The change's own sibling worktree is the one read.
  g(eco.repos.api, 'worktree', 'add', '-q', '-b', 'demo', join(eco.brain, '.multivac/worktrees/demo/api'));
  assert.match(line((await doctorReport(wt)).lines, 'branches'), /api: on demo @ [0-9a-f]{7}/);
  // Missing both ways: the clone advice names the main checkout.
  rmSync(eco.repos.web, { recursive: true, force: true });
  const missing = line((await doctorReport(wt)).lines, 'repos');
  assert.match(missing, new RegExp(`web missing → \`multivac repos sync\` in ${eco.brain} \\(git clone git@acme\\.example:acme/web\\.git \\.\\./acme-web\\)`));
  // From the main checkout the advice is today's.
  assert.match(line((await doctorReport(eco.brain)).lines, 'repos'), /web missing → `multivac repos sync` \(git clone /);
});

test('doctor from a subdirectory reports the brain that holds it and names it — MV-151', async () => {
  const eco = makeScratchEcosystem(realpathSync(mkdtempSync(join(tmpdir(), 'mvac-doc-sub-'))), { brainIsCode: true });
  const src = join(eco.brain, 'src');
  const lines: string[] = [];
  const orig = { log: console.log, error: console.error };
  console.log = console.error = (...a: unknown[]) => {
    lines.push(a.map(String).join(' '));
  };
  let code: number;
  try {
    code = await doctorCommand.run([], { cwd: src });
  } finally {
    console.log = orig.log;
    console.error = orig.error;
  }
  assert.equal(code, 0, lines.join('\n'));
  assert.equal(lines[0], `root      ${eco.brain} (asked from ${src})`);
  assert.equal(lines.filter((l) => l.startsWith('root      ')).length, 1);
  assert.doesNotMatch(lines.join('\n'), /config invalid/);
});
