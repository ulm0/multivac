// The SDD gates its own flow: each tool's OWN ordered steps drive the
// lifecycle, and the gates refuse on the artifact the tool really produces.
//
// Four things this file pins down:
//   1. both tools' flows drive new/plan/apply/land/close — not a fixed triple;
//   2. plan/apply/close REFUSE while the proving artifact is missing, naming
//      the agent command and the path, and PASS once it exists;
//   3. an ungateable step is printed with its reason and never gated, and a
//      lifecycle point with nothing to prove says so instead of faking it;
//   4. --no-sdd and sdd_auto: false turn every step AND every gate off.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { delimiter, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { initRepo } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { doctorReport } from '../../src/commands/doctor.js';
import { loadChange, saveChange } from '../../src/change/file.js';
import { sddSpec } from '../../src/adapters/registry.js';
import { writeSkeleton } from '../../src/adapters/sdd.js';
import { renderBrainDoor } from '../../src/doors/brain.js';
import { loadConfig } from '../../src/lib/config.js';
import { SPECKIT_106_NO_CLAUDE, SPECKIT_INTEGRATION_JSON } from '../helpers/recorded.js';

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

/**
 * A stub `openspec` at the FRONT of PATH. The opsx tasks step reuses the
 * tool's own verdict, so the suite must decide that verdict itself: a real
 * openspec on the developer's machine and none in CI would otherwise make
 * these tests say different things in the two places.
 */
const bin = join(tmp, 'bin');
mkdirSync(bin, { recursive: true });
const stubOpenspec = (exit: number, stdout = ''): void => {
  const p = join(bin, 'openspec');
  writeFileSync(p, `#!/bin/sh\ncat <<'EOF'\n${stdout}\nEOF\nexit ${exit}\n`);
  chmodSync(p, 0o755);
};
stubOpenspec(0);

/**
 * What a real `specify init` leaves at .specify/memory/constitution.md: the
 * template, `[ALL_CAPS]` fill-in tokens intact. The stub writes THIS and not a
 * one-word stand-in, because the one-word stand-in is a fixture kinder than the
 * tool: it made the scaffold hand the project-document gate a document that
 * looked written, and the gate MV-76 exists to fire went green behind it.
 * A fixture that cannot reproduce the tool's own output cannot catch what the
 * tool's own output does.
 */
const CONSTITUTION_TEMPLATE =
  '# [PROJECT_NAME] Constitution\n\n## Core Principles\n\n' +
  '### [PRINCIPLE_1_NAME]\n\n[PRINCIPLE_1_DESCRIPTION]\n\n' +
  '**Version**: [CONSTITUTION_VERSION] | **Ratified**: [RATIFICATION_DATE]\n';

/**
 * A stub `specify` at the same front of PATH, for the same reason and one
 * more: the lifecycle now RUNS this one. A suite that let the real binary
 * through would depend on whatever the host has installed (Principle IV) and
 * write a different tree on every machine.
 *
 * `writes` is the whole point of the stub: a tool that exits 0 and creates
 * nothing is a real outcome the lifecycle has to refuse to call success. What
 * it writes is what the real init writes, `.specify/integration.json` included
 * (MV-124): the probe reads that file, and a stub that left a bare directory
 * would be scaffolding a tool that does not exist. `'memory-only'` writes the
 * constitution and no integration file, an init that stopped half way.
 *
 * It behaves as spec-kit 1.0.6 does where that decides an outcome (MV-123):
 * without `--ignore-agent-tools` and with no `claude` on its PATH it prints
 * 1.0.6's recorded output, writes nothing and exits 1, and any other argv than
 * the scaffold's, pinned below, fails the run with 97. `failIn` confines the failure
 * (`exit`, `stderr`) to the root whose path ends so, and every other root is
 * scaffolded; `says` is stdout printed before the failure.
 *
 * `templates` also writes the core spec, plan and tasks templates, as the real
 * init does (MV-146): the skeleton reads their headings, and without them it
 * writes nothing. Opt-in, because the MV-65 test writes its own core template
 * by hand and a tracked one would stop the carry before the gate it pins.
 * `version` is the one `integration.json` records, and `lose` a heading the
 * core templates drop.
 */
const runLog = join(tmp, 'specify-runs');
/**
 * The H2 headings of spec-kit 1.0.11's core spec, plan and tasks templates, as
 * its init wrote them (measured 2026-09-28) — headings only, since the
 * skeleton reads nothing else of a core template. Pinned here and not read off
 * the registry's `keeps`, for the reason SCAFFOLD_ARGV is: a stub copied from
 * the registry passes a registry that lost a heading.
 */
const CORE_HEADINGS: Record<string, string[]> = {
  'spec-template.md': [
    'User Scenarios & Testing *(mandatory)*', 'Requirements *(mandatory)*', 'Success Criteria *(mandatory)*', 'Assumptions',
  ],
  'plan-template.md': ['Summary', 'Technical Context', 'Constitution Check', 'Project Structure', 'Complexity Tracking'],
  'tasks-template.md': [
    'Format: `[ID] [P?] [Story] Description`', 'Path Conventions', 'Phase 1: Setup (Shared Infrastructure)',
    'Phase 2: Foundational (Blocking Prerequisites)', 'Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP',
    'Phase 4: User Story 2 - [Title] (Priority: P2)', 'Phase 5: User Story 3 - [Title] (Priority: P3)',
    'Phase N: Polish & Cross-Cutting Concerns', 'Dependencies & Execution Order', 'Parallel Example: User Story 1',
    'Implementation Strategy', 'Notes',
  ],
};
// Pinned, not read off the registry: a stub that compares the registry with
// itself would pass an argv that dropped `--here` (C57).
const SCAFFOLD_ARGV = 'init --here --integration claude --force --ignore-agent-tools';
/** Where spec-kit resolves templates first, and what the scaffold writes there (MV-146). */
const OVERRIDES = join(brain, '.specify/templates/overrides');
const SKELETON = sddSpec('speckit')!.scaffold!.skeleton!;
const stubSpecify = (
  exit: number,
  writes: boolean | 'memory-only' = true,
  stderr = '',
  {
    failIn,
    says,
    templates,
    version,
    lose,
  }: { failIn?: string; says?: string; templates?: boolean; version?: string; lose?: string } = {},
): void => {
  const p = join(bin, 'specify');
  const fail =
    (says ? `cat <<'EOF'\n${says}EOF\n` : '') + (stderr ? `echo '${stderr}' >&2\n` : '') + `exit ${exit}\n`;
  const memory = `mkdir -p .specify/memory\ncat > .specify/memory/constitution.md <<'EOF'\n${CONSTITUTION_TEMPLATE}EOF\n`;
  const recorded = version
    ? SPECKIT_INTEGRATION_JSON.replace('"version": "0.16.4"', `"version": "${version}"`)
    : SPECKIT_INTEGRATION_JSON;
  assert.ok(!version || recorded !== SPECKIT_INTEGRATION_JSON, 'the recorded integration.json names no version to replace');
  const core = !templates
    ? ''
    : 'mkdir -p .specify/templates\n' +
      Object.entries(CORE_HEADINGS)
        .map(([f, hs]) => {
          const body = hs.filter((h) => h !== lose).map((h) => `## ${h}\n\n[guidance]\n`).join('\n');
          return `cat > .specify/templates/${f} <<'EOF'\n# ${f}\n\n${body}EOF\n`;
        })
        .join('');
  const write =
    writes === 'memory-only'
      ? memory
      : writes
        ? `${memory}${core}cat > .specify/integration.json <<'EOF'\n${recorded}EOF\n`
        : '';
  writeFileSync(
    p,
    `#!/bin/sh\necho "$@" >> '${runLog}'\n` +
      `case "$*" in *--ignore-agent-tools*) ;; *) command -v claude >/dev/null 2>&1 || { cat <<'EOF'\n` +
      `${SPECKIT_106_NO_CLAUDE.stdout}EOF\nexit 1; } ;; esac\n` +
      `[ "$*" = '${SCAFFOLD_ARGV}' ] || { echo "specify stub: not the scaffold argv: $*" >&2; exit 97; }\n` +
      (failIn ? `case "$PWD" in *${failIn})\n${fail};;\nesac\n${write}exit 0\n` : `${write}${fail}`),
  );
  chmodSync(p, 0o755);
};
stubSpecify(0);
/** How many times the stub has been invoked, and with what. */
const specifyRuns = (): string[] =>
  existsSync(runLog) ? readFileSync(runLog, 'utf8').split('\n').filter(Boolean) : [];
const forgetSpecifyRuns = (): void => rmSync(runLog, { force: true });
/** Put the brain back in the state of a repo where spec-kit has never run. */
const unscaffold = (): void => rmSync(join(brain, '.specify'), { recursive: true, force: true });

// Built, never the host's: `git` from /usr/bin, and no `claude` anywhere on it.
process.env.PATH = [bin, '/usr/bin', '/bin'].join(delimiter);

const config = (lines: string[]): void =>
  writeFileSync(join(brain, '.multivac/config.yml'), lines.join('\n') + '\n');

/** Write a file under the brain, parents included — the SDD tool's artifact. */
const artifact = (rel: string, body = 'x\n'): void => {
  mkdirSync(dirname(join(brain, rel)), { recursive: true });
  writeFileSync(join(brain, rel), body);
};

/** close leaves the archive/law edits for a hand commit; tidy between tests. */
const commitAll = (): void => {
  execFileSync('git', ['-C', brain, 'add', '-A'], { stdio: 'ignore' });
  execFileSync('git', ['-C', brain, 'commit', '-q', '-m', 'tidy'], { stdio: 'ignore' });
};

/** Declare the brain as the only repo of `slug`. */
async function declareBrain(slug: string): Promise<void> {
  const parsed = await loadChange(brain, slug);
  parsed.change.repos = { brain: { status: 'planned' } };
  parsed.change.landing_order = [['brain']];
  parsed.change.invariants.adds = [];
  await saveChange(brain, parsed);
}

// --- opsx: the whole flow, gate by gate ---
//
// MV-147: each step is openspec's own terminal verbs, printed with the slug in
// them; none is a chat command, and no line spells one. A slash spelling is
// asserted absent as `/\/opsx[:]/`, whose source carries no literal to count.

test('opsx: new prints openspec new change, and plan REFUSES until proposal.md exists', async () => {
  const c1 = await capture(() => change.run(['new', 'gate-a', 'Gate a'], ctx));
  assert.equal(c1.code, 0);
  assert.match(
    c1.out,
    /^sdd opsx: in the brain checkout run `openspec new change gate-a --json`, then write each artifact `openspec status --change gate-a` marks `\[ \]` from `openspec instructions <id> --change gate-a --json`; a material ambiguity is the human's question \[/m,
  );
  // The printed step names what will prove it — the gate is not a surprise.
  assert.match(c1.out, /proof: openspec\/changes\/gate-a\/proposal\.md/);
  assert.doesNotMatch(c1.out, /\/opsx[:]/);

  await declareBrain('gate-a');
  const refused = await capture(() => change.run(['plan', 'gate-a'], ctx));
  assert.equal(refused.code, 1);
  // Names the artifact it looked for...
  assert.match(refused.out, /refused — openspec\/changes\/gate-a\/proposal\.md is missing/);
  // ...where it looked for it...
  assert.match(refused.out, /looked in brain/);
  // ...and the exact command to run, two spaces in.
  assert.match(refused.out, /^ {2}in the brain checkout run `openspec new change gate-a --json`, then write each artifact/m);
  assert.match(refused.out, /then re-run: multivac change plan gate-a/);
  assert.match(refused.out, /--no-sdd/);
  assert.doesNotMatch(refused.out, /\/opsx[:]/);

  artifact('openspec/changes/gate-a/proposal.md');
  const passed = await capture(() => change.run(['plan', 'gate-a'], ctx));
  assert.equal(passed.code, 0);
  // The hit names the repo it landed in, not only the path: in an ecosystem
  // of six, a bare relative path does not say which checkout satisfied it.
  assert.match(passed.out, /sdd opsx: brain: openspec\/changes\/gate-a\/proposal\.md ok/);
  // plan is also where the tasks step is printed — its own gate is apply —
  // and its guide rides on the line under it, three spaces after the tag.
  assert.match(
    passed.out,
    /^sdd opsx: keep writing each artifact `openspec status --change gate-a` marks `\[ \]` from `openspec instructions <id> --change gate-a --json` until tasks\.md is written \[proof: openspec\/changes\/gate-a\/tasks\.md/m,
  );
  assert.match(
    passed.out,
    /^sdd opsx: {3}design is optional where its instruction says so; skipped, write tasks from `openspec instructions tasks --change gate-a --json` though status marks it `\[-\]`\. Its `Next:` apply is not yours before `change apply`$/m,
  );
});

test('opsx: apply REFUSES until tasks.md exists, then branches', async () => {
  const refused = await capture(() => change.run(['apply', 'gate-a'], ctx));
  assert.equal(refused.code, 1);
  assert.match(refused.out, /refused — openspec\/changes\/gate-a\/tasks\.md is missing/);
  // The refusal re-prints the step, two spaces in, and its guide under it,
  // four spaces in, before the re-run line (MV-147).
  const lines = refused.out.split('\n');
  const run = lines.findIndex((l) =>
    l.startsWith('  keep writing each artifact `openspec status --change gate-a` marks `[ ]` from `openspec instructions <id> --change gate-a --json`'),
  );
  assert.ok(run >= 0, refused.out);
  assert.match(lines[run + 1], /^ {4}design is optional where its instruction says so; skipped, write tasks from `openspec instructions tasks --change gate-a --json`/);
  assert.equal(lines[run + 2], '  then re-run: multivac change apply gate-a');
  // A refused apply leaves the change exactly where it found it.
  assert.equal((await loadChange(brain, 'gate-a')).change.repos.brain.status, 'planned');

  // An empty task list is refused as if it were missing, and the step and its
  // guide are re-printed the same way.
  artifact('openspec/changes/gate-a/tasks.md', '\n');
  const empty = await capture(() => change.run(['apply', 'gate-a'], ctx));
  assert.equal(empty.code, 1);
  assert.match(empty.out, /refused — brain:openspec\/changes\/gate-a\/tasks\.md is empty/);
  assert.match(
    empty.out,
    /^ {2}keep writing each artifact .* until tasks\.md is written\n {4}design is optional where its instruction says so;.*\n {2}then re-run: multivac change apply gate-a$/m,
  );

  artifact('openspec/changes/gate-a/tasks.md', '- [ ] 1.1 do it\n');
  const passed = await capture(() => change.run(['apply', 'gate-a'], ctx));
  assert.equal(passed.code, 0);
  // apply's own step is ungateable, printed with the reason, never gated.
  assert.match(
    passed.out,
    /^sdd opsx: where openspec\/changes\/gate-a\/ is \(the brain's change worktree once `change apply` carried it there\), run `openspec instructions apply --change gate-a --json` before the first task and after the last; tick `- \[x\]` only what is fully built, until its `state` is `all_done`; scope beyond the spec is the human's question \[/m,
  );
  assert.match(passed.out, /ungateable: apply leaves no artifact of its own/);
  assert.doesNotMatch(passed.out, /\/opsx[:]/);
});

test("opsx: the tool's own validator is the verdict, not a reimplementation", async () => {
  // Same artifacts on disk, opposite outcome — the difference is openspec's
  // own exit code, quoted back in its own words.
  stubOpenspec(
    1,
    JSON.stringify({
      items: [
        {
          id: 'gate-a',
          issues: [
            { level: 'INFO', message: 'ignore me' },
            { level: 'ERROR', message: 'Change must have at least one delta' },
          ],
        },
      ],
    }),
  );
  const refused = await capture(() => change.run(['apply', 'gate-a'], ctx));
  assert.equal(refused.code, 1);
  assert.match(refused.out, /`openspec validate gate-a --json --no-interactive` says:/);
  assert.match(refused.out, /Change must have at least one delta/);
  // INFO is the tool's own severity floor — not a refusal.
  assert.doesNotMatch(refused.out, /ignore me/);
  stubOpenspec(0);
  assert.equal(await change.run(['apply', 'gate-a'], ctx), 0);
});

test('opsx: land prints archive, close REFUSES until the change is archived', async () => {
  const landed = await capture(() => change.run(['land', 'gate-a', '--landed', 'brain'], ctx));
  assert.equal(landed.code, 0);
  assert.match(landed.out, /^sdd opsx: after the merge, in the brain checkout \(never a change worktree\), run `openspec archive gate-a --json` to merge the deltas into openspec\/specs\/ and archive the change;/m);
  assert.match(landed.out, /proof: openspec\/changes\/archive\/<n>-<n>-<n>-gate-a/);
  assert.doesNotMatch(landed.out, /\/opsx[:]/);

  const refused = await capture(() => change.run(['close', 'gate-a'], ctx));
  assert.equal(refused.code, 1);
  assert.match(refused.out, /refused — openspec\/changes\/archive\/<n>-<n>-<n>-gate-a is missing/);
  assert.match(refused.out, /^ {2}after the merge, in the brain checkout \(never a change worktree\), run `openspec archive gate-a --json` to merge/m);

  // The date prefix is the tool's, not ours: the `*` segment matches it.
  artifact('openspec/changes/archive/2026-08-15-gate-a/proposal.md');
  const passed = await capture(() => change.run(['close', 'gate-a'], ctx));
  assert.equal(passed.code, 0);
  assert.match(passed.out, /openspec\/changes\/archive\/2026-08-15-gate-a ok/);
  commitAll();
});

test('opsx: multivac spawns only the scaffold and the validator, new to close', async () => {
  // MV-51, MV-147: the agent runs openspec's verbs; multivac runs two of its
  // commands over a whole change, each with the entry's opt-outs over the
  // environment. The test writes what the agent and the human would — the
  // artifacts, then the archive — and the stub logs every argv it is given.
  const b = join(tmp, 'spawn-brain');
  initRepo(b, {
    'AGENTS.md': '# door\n',
    '.multivac/config.yml': 'doors: [agents, claude]\nsdd: opsx\nrepos:\n  brain: .\n',
    '.multivac/invariants.md':
      '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n',
  });
  const log = join(tmp, 'openspec-spawns');
  rmSync(log, { force: true });
  writeFileSync(
    join(bin, 'openspec'),
    `#!/bin/sh\necho "$@ DO_NOT_TRACK=$DO_NOT_TRACK OPENSPEC_TELEMETRY=$OPENSPEC_TELEMETRY" >> '${log}'\n` +
      `case "$1" in init) mkdir -p openspec/specs openspec/changes/archive && printf 'schema: spec-driven\\n' > openspec/config.yaml;; esac\nexit 0\n`,
  );
  chmodSync(join(bin, 'openspec'), 0o755);
  const write = (rel: string, body: string): void => {
    mkdirSync(dirname(join(b, rel)), { recursive: true });
    writeFileSync(join(b, rel), body);
  };
  const at = { cwd: b };
  try {
    assert.equal((await capture(() => change.run(['new', 'walk-a', 'Walk a'], at))).code, 0);
    const parsed = await loadChange(b, 'walk-a');
    parsed.change.repos = { brain: { status: 'planned' } };
    parsed.change.landing_order = [['brain']];
    parsed.change.invariants.adds = [];
    await saveChange(b, parsed);
    write('openspec/changes/walk-a/proposal.md', '# Walk a\n');
    const plan = await capture(() => change.run(['plan', 'walk-a'], at));
    assert.equal(plan.code, 0, plan.out);
    write('openspec/changes/walk-a/tasks.md', '- [x] 1.1 walk\n');
    const apply = await capture(() => change.run(['apply', 'walk-a'], at));
    assert.equal(apply.code, 0, apply.out);
    const land = await capture(() => change.run(['land', 'walk-a', '--landed', 'brain'], at));
    assert.equal(land.code, 0, land.out);
    // What the human's `openspec archive walk-a --json --yes` leaves.
    write('openspec/changes/archive/2026-09-28-walk-a/proposal.md', '# Walk a\n');
    write('openspec/changes/archive/2026-09-28-walk-a/tasks.md', '- [x] 1.1 walk\n');
    const close = await capture(() => change.run(['close', 'walk-a'], at));
    assert.equal(close.code, 0, close.out);
    assert.deepEqual(readFileSync(log, 'utf8').split('\n').filter(Boolean), [
      'init --tools none --no-animation . DO_NOT_TRACK=1 OPENSPEC_TELEMETRY=0',
      'validate walk-a --json --no-interactive DO_NOT_TRACK=1 OPENSPEC_TELEMETRY=0',
    ]);
  } finally {
    stubOpenspec(0);
  }
});

/**
 * A fresh brain==code brain with opsx installed (its `openspec/config.yaml`
 * there, so no scaffold speaks), the brain entry keyed `key`, and a change
 * `slug` opened and declared on it.
 */
async function opsxBrain(dir: string, slug: string, key = 'brain'): Promise<string> {
  const b = join(tmp, dir);
  initRepo(b, {
    'AGENTS.md': '# door\n',
    '.multivac/config.yml': `doors: [agents]\nsdd: opsx\nrepos:\n  ${key}: .\n`,
    '.multivac/.gitignore': 'cache/\nworktrees/\n',
    '.multivac/invariants.md':
      '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n',
    'openspec/config.yaml': 'schema: spec-driven\n',
  });
  assert.equal((await capture(() => change.run(['new', slug, slug], { cwd: b }))).code, 0);
  const parsed = await loadChange(b, slug);
  parsed.change.repos = { [key]: { status: 'planned' } };
  parsed.change.landing_order = [[key]];
  parsed.change.invariants.adds = [];
  await saveChange(b, parsed);
  return b;
}

/** Write `body` at `rel` under `root`, parents included. */
const put = (root: string, rel: string, body = 'x\n'): void => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), body);
};

test('opsx: land prints the archive with no flag, and the question under it', async () => {
  // MV-147: `openspec archive <slug> --json` never reads stdin, and on a
  // change carrying deltas answers `archive_confirmation_required` and writes
  // nothing (1.5.0 through 1.13.2). The run carries no flag; the question goes
  // to the human with the tool's own preview and answers, on the line under
  // the run — at its point, never in the door.
  const b = await opsxBrain('question-brain', 'gate-q');
  const at = { cwd: b };
  put(b, 'openspec/changes/gate-q/proposal.md', '# Gate q\n');
  put(b, 'openspec/changes/gate-q/tasks.md', '- [x] 1.1 ask\n');
  assert.equal((await capture(() => change.run(['plan', 'gate-q'], at))).code, 0);
  assert.equal((await capture(() => change.run(['apply', 'gate-q'], at))).code, 0);
  const landed = await capture(() => change.run(['land', 'gate-q', '--landed', 'brain'], at));
  assert.equal(landed.code, 0, landed.out);
  const sdd = landed.out.split('\n').filter((l) => l.startsWith('sdd opsx:'));
  assert.equal(sdd.length, 3, landed.out);
  assert.ok(sdd[0].includes('run `openspec archive gate-q --json` to merge'), sdd[0]);
  assert.doesNotMatch(sdd[0], /--(yes|skip-specs|no-validate)/);
  assert.ok(sdd[1].startsWith('sdd opsx:   `archive_confirmation_required` saying `Updating`'), sdd[1]);
  // The preview and the answers carry the slug, as every printed line does.
  assert.ok(sdd[1].includes('`openspec show gate-q --json --deltas-only`'), sdd[1]);
  assert.ok(sdd[1].includes('yes: `openspec archive gate-q --json --yes`'), sdd[1]);
  assert.ok(sdd[1].includes('archive without merging: `openspec archive gate-q --json --skip-specs`'), sdd[1]);
  assert.match(sdd[2], /^sdd opsx: run the chain through without asking to continue/);
  assert.match(landed.out, /^all stages landed — run `multivac change close gate-q`$/m);

  // Not archived yet: close re-prints the run and, four spaces in, its guide.
  const refused = await capture(() => change.run(['close', 'gate-q'], at));
  assert.equal(refused.code, 1);
  assert.match(
    refused.out,
    /^ {2}after the merge, in the brain checkout \(never a change worktree\), run `openspec archive gate-q --json` to merge.*\n {4}`archive_confirmation_required` saying `Updating`: nothing was written;.*\n {2}then re-run: multivac change close gate-q$/m,
  );
  // The door is the only surface a run has there: it carries the run alone.
  const door = renderBrainDoor(await loadConfig(b), 1);
  assert.match(door, /`change land` → after the merge, in the brain checkout/);
  assert.ok(!door.includes('saying `Updating`'), door);

  // Archived as the human answered, in the checkout: close passes.
  put(b, 'openspec/changes/archive/2026-09-28-gate-q/tasks.md', '- [x] 1.1 ask\n');
  const closed = await capture(() => change.run(['close', 'gate-q'], at));
  assert.equal(closed.code, 0, closed.out);
});

test("opsx: a land proof found only in the change's worktree is refused", async () => {
  // MV-147, measured end to end in a brain==code change: `openspec archive`
  // run in the change's worktree after the merge let close exit 0 while the
  // checkout kept the change open and `openspec/specs/` empty. The worktree
  // is named by the entry's KEY (MV-146), so this brain is keyed `core`.
  const slug = 'late-archive';
  const b = await opsxBrain('keyed-brain', slug, 'core');
  const at = { cwd: b };
  put(b, `openspec/changes/${slug}/proposal.md`, '# Late archive\n');
  put(b, `openspec/changes/${slug}/tasks.md`, '- [ ] 1.1 archive late\n');
  assert.equal((await capture(() => change.run(['plan', slug], at))).code, 0);
  const applied = await capture(() => change.run(['apply', slug], at));
  assert.equal(applied.code, 0, applied.out);
  const wt = join(b, '.multivac/worktrees', slug, 'core');
  assert.ok(existsSync(join(wt, `openspec/changes/${slug}/tasks.md`)), applied.out);
  assert.equal((await capture(() => change.run(['land', slug, '--landed', 'core'], at))).code, 0);

  // The archive, run where the agent had been working: only the worktree has it.
  const arch = `openspec/changes/archive/2026-09-28-${slug}`;
  put(wt, `${arch}/proposal.md`, '# Late archive\n');
  put(wt, `${arch}/tasks.md`, '- [ ] 1.1 archive late\n');
  const refused = await capture(() => change.run(['close', slug], at));
  assert.equal(refused.code, 1, refused.out);
  const lines = refused.out.split('\n');
  const at0 = lines.findIndex((l) =>
    l ===
    `sdd opsx: \`change close ${slug}\` refused — openspec/changes/archive/<n>-<n>-<n>-${slug} is only in the change's worktree, .multivac/worktrees/${slug}/core/${arch}, which never reaches the brain checkout`,
  );
  assert.ok(at0 >= 0, refused.out);
  assert.ok(lines[at0 + 1].startsWith(`  after the merge, in the brain checkout (never a change worktree), run \`openspec archive ${slug} --json\``), lines[at0 + 1]);
  assert.ok(lines[at0 + 2].startsWith('    `archive_confirmation_required` saying `Updating`'), lines[at0 + 2]);
  assert.equal(lines[at0 + 3], `  then re-run: multivac change close ${slug}`);
  // Its task list is not read from the worktree: no ledger line at all.
  assert.doesNotMatch(refused.out, /open item\(s\)/);
  assert.ok(!existsSync(join(b, `.multivac/changes/archive/${slug}.md`)), 'nothing archived');

  // Two archives of the slug there are two that never reach the checkout,
  // not a clash in it: the same refusal, naming both, and no ledger read.
  const arch2 = `openspec/changes/archive/2026-09-29-${slug}`;
  put(wt, `${arch2}/proposal.md`, '# Late archive\n');
  put(wt, `${arch2}/tasks.md`, '- [ ] 1.1 archive late\n');
  const twice = await capture(() => change.run(['close', slug], at));
  assert.equal(twice.code, 1, twice.out);
  const twiceLines = twice.out.split('\n');
  const at1 = twiceLines.indexOf(
    `sdd opsx: \`change close ${slug}\` refused — openspec/changes/archive/<n>-<n>-<n>-${slug} is only in the change's worktree, .multivac/worktrees/${slug}/core/${arch}, .multivac/worktrees/${slug}/core/${arch2}, which never reaches the brain checkout`,
  );
  assert.ok(at1 >= 0, twice.out);
  assert.ok(twiceLines[at1 + 1].startsWith(`  after the merge, in the brain checkout (never a change worktree), run \`openspec archive ${slug} --json\``), twice.out);
  assert.doesNotMatch(twice.out, /matches more than one place|open item\(s\)/);

  // Moved into the checkout, its tasks ticked: close passes.
  rmSync(join(wt, 'openspec/changes/archive'), { recursive: true });
  put(b, `${arch}/proposal.md`, '# Late archive\n');
  put(b, `${arch}/tasks.md`, '- [x] 1.1 archive late\n');
  const closed = await capture(() => change.run(['close', slug], at));
  assert.equal(closed.code, 0, closed.out);
  assert.match(closed.out, new RegExp(`sdd opsx: brain: ${arch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} ok`));
});

test("change new refuses a slug the brain's SDD cannot create", async () => {
  // MV-147, measured on openspec 1.13.2: `new change` refuses `Fix_Auth`, and
  // in a scaffolded brain `archive` already exists. The printed `new` step's
  // first command would fail on either, so the change is never opened —
  // before anything is written, whatever the switches say, since the slug
  // outlives them.
  const why =
    "the brain's SDD takes no such slug — openspec 1.13.2's `new change` takes lowercase letters and digits in runs joined by single hyphens, and reserves `archive`";
  const brainAt = (dir: string, cfg: string, extra: Record<string, string> = {}): string => {
    const b = join(tmp, dir);
    initRepo(b, {
      'AGENTS.md': '# door\n',
      '.multivac/config.yml': cfg,
      '.multivac/.gitignore': 'cache/\nworktrees/\n',
      '.multivac/invariants.md':
        '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n',
      ...extra,
    });
    return b;
  };
  const refusesUntouched = async (b: string, argv: string[], slug: string, hint: string): Promise<void> => {
    const head = execFileSync('git', ['-C', b, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
    const lawBefore = readFileSync(join(b, '.multivac/invariants.md'), 'utf8');
    const c = await capture(() => change.run(argv, { cwd: b }));
    assert.equal(c.code, 1, `${argv.join(' ')}\n${c.out}`);
    assert.equal(c.out, `\`${slug}\`: ${why}; ${hint}`, argv.join(' '));
    assert.equal(execFileSync('git', ['-C', b, 'status', '--porcelain'], { encoding: 'utf8' }), '', argv.join(' '));
    assert.equal(execFileSync('git', ['-C', b, 'rev-parse', 'HEAD'], { encoding: 'utf8' }), head, argv.join(' '));
    assert.equal(readFileSync(join(b, '.multivac/invariants.md'), 'utf8'), lawBefore, argv.join(' '));
    assert.ok(!existsSync(join(b, '.multivac/changes', `${slug}.md`)), argv.join(' '));
  };
  const derives = '`multivac change new "<title>"` derives one';
  const openspecCfg = 'schema: spec-driven\n';

  const on = brainAt('slug-brain', 'doors: [agents]\nsdd: opsx\nrepos:\n  brain: .\n', { 'openspec/config.yaml': openspecCfg });
  for (const slug of ['Fix_Auth', 'archive']) {
    await refusesUntouched(on, ['new', slug, 'x'], slug, derives);
    await refusesUntouched(on, ['new', slug, 'x', '--no-sdd'], slug, derives);
  }
  // Derived from a title, a slug is in the grammar already and misses only on
  // a reserved name; deriving again would give it back, so it asks for one.
  await refusesUntouched(on, ['new', 'Archive'], 'archive', 'name one yourself: `multivac change new <slug> "Archive"`');

  const off = brainAt('slug-brain-off', 'doors: [agents]\nsdd: opsx\nsdd_auto: false\nrepos:\n  brain: .\n', {
    'openspec/config.yaml': openspecCfg,
  });
  for (const slug of ['Fix_Auth', 'archive']) await refusesUntouched(off, ['new', slug, 'x'], slug, derives);

  // The grammar's own slug proceeds, and its step names it.
  const ok = await capture(() => change.run(['new', 'fix-auth', 'x'], { cwd: on }));
  assert.equal(ok.code, 0, ok.out);
  assert.ok(ok.out.includes('run `openspec new change fix-auth --json`'), ok.out);
  assert.ok(existsSync(join(on, '.multivac/changes/fix-auth.md')));

  // spec-kit records no grammar: the slug it always took, it still takes.
  const sk = brainAt('slug-brain-speckit', 'doors: [agents]\nsdd: speckit\nrepos:\n  brain: .\n', {
    '.specify/integration.json': SPECKIT_INTEGRATION_JSON,
  });
  const taken = await capture(() => change.run(['new', 'Fix_Auth', 'x'], { cwd: sk }));
  assert.equal(taken.code, 0, taken.out);
  assert.ok(!taken.out.includes('takes no such slug'), taken.out);
  assert.ok(existsSync(join(sk, '.multivac/changes/Fix_Auth.md')));
});

test("the apply gate prints openspec's archive-would-refuse note and passes", async () => {
  // MV-147, measured on openspec 1.13.2: a MODIFIED delta whose header the
  // main spec lacks validates with exit 0 and this INFO issue — the archive
  // then fails only after the human's yes. The gate passes, as the tool does,
  // and prints the note where the delta can still be fixed.
  const b = await opsxBrain('note-brain', 'note-a');
  const at = { cwd: b };
  put(b, 'openspec/changes/note-a/proposal.md', '# Note a\n');
  put(b, 'openspec/changes/note-a/tasks.md', '- [ ] 1.1 bill yearly\n');
  assert.equal((await capture(() => change.run(['plan', 'note-a'], at))).code, 0);
  const refuse =
    'Archive would refuse this delta: billing MODIFIED failed for header "### Requirement: Yearly invoice" - not found';
  const noted = (out: string): string[] => out.split('\n').filter((l) => l.includes('passes and notes:'));
  try {
    stubOpenspec(
      0,
      JSON.stringify({
        items: [
          {
            id: 'note-a',
            valid: true,
            issues: [
              { level: 'INFO', path: 'billing/spec.md', message: refuse },
              { level: 'INFO', path: 'billing/spec.md', message: 'Requirement text is long' },
            ],
          },
        ],
        summary: { totals: { items: 1, passed: 1, failed: 0 } },
      }),
    );
    const applied = await capture(() => change.run(['apply', 'note-a'], at));
    assert.equal(applied.code, 0, applied.out);
    const lines = applied.out.split('\n');
    const ok = lines.findIndex((l) => /^sdd opsx: [a-z]+: openspec\/changes\/note-a\/tasks\.md ok$/.test(l));
    assert.ok(ok >= 0, applied.out);
    assert.equal(
      lines[ok + 1],
      `sdd opsx: \`openspec validate note-a --json --no-interactive\` passes and notes: ${refuse} — fix the delta before \`change land\``,
    );
    // Only the issue the step names is a note; the tool's other INFO is not.
    assert.equal(noted(applied.out).length, 1, applied.out);
    assert.ok(!applied.out.includes('Requirement text is long'), applied.out);

    // A pass owes the gate no output: empty, or not JSON, is a pass with no note.
    for (const stdout of ['', '   ', 'Change note-a is valid']) {
      stubOpenspec(0, stdout);
      const quiet = await capture(() => change.run(['apply', 'note-a'], at));
      assert.equal(quiet.code, 0, quiet.out);
      assert.deepEqual(noted(quiet.out), [], quiet.out);
    }
  } finally {
    stubOpenspec(0);
  }
});

// --- speckit: a different flow, a different shape of honesty ---

test('speckit: its own longer flow drives the lifecycle', async () => {
  config(['doors: [agents]', 'sdd: speckit', 'repos:', '  brain: .']);
  // spec-kit declares a project-level document, and `plan` gates on it
  // (MV-76). This test is about the per-change flow, so give it the
  // constitution a real spec-kit project has; the gate itself is pinned by
  // its own tests below.
  artifact('.specify/memory/constitution.md', '# Constitution\n\n## I. Ship it\n');
  const c1 = await capture(() => change.run(['new', 'gate-b', 'Gate b'], ctx));
  assert.equal(c1.code, 0);
  assert.match(c1.out, /run \/speckit\.specify in your agent to write the spec for gate-b/);
  // clarify is part of spec-kit's flow and is honestly ungateable.
  assert.match(c1.out, /run \/speckit\.clarify/);
  assert.match(c1.out, /ungateable: optional, and its `## Clarifications` session/);

  await declareBrain('gate-b');
  const refused = await capture(() => change.run(['plan', 'gate-b'], ctx));
  assert.equal(refused.code, 1);
  assert.match(refused.out, /refused — specs\/<n>-gate-b\/spec\.md is missing/);

  // spec-kit numbers AND names the feature directory itself — verified against
  // a real create-new-feature.sh, which turned "user login with email" into
  // `001-user-login-email`. The `*`s on both sides of the slug match that.
  artifact('specs/001-gate-b/spec.md');
  const planned = await capture(() => change.run(['plan', 'gate-b'], ctx));
  assert.equal(planned.code, 0);
  assert.match(planned.out, /specs\/001-gate-b\/spec\.md ok/);
  // The project document is reported by the same gate, in the same shape.
  assert.match(planned.out, /sdd speckit: brain: \.specify\/memory\/constitution\.md ok/);
  // plan prints TWO steps here — the flow is not a triple.
  assert.match(planned.out, /run \/speckit\.plan in your agent/);
  assert.match(planned.out, /run \/speckit\.tasks in your agent/);
});

test('speckit: apply gates on plan.md AND tasks.md, and its steps are ungateable', async () => {
  const refused = await capture(() => change.run(['apply', 'gate-b'], ctx));
  assert.equal(refused.code, 1);
  assert.match(refused.out, /refused — specs\/<n>-gate-b\/plan\.md is missing/);
  assert.match(refused.out, /refused — specs\/<n>-gate-b\/tasks\.md is missing/);

  artifact('specs/001-gate-b/plan.md');
  const half = await capture(() => change.run(['apply', 'gate-b'], ctx));
  assert.equal(half.code, 1);
  assert.match(half.out, /specs\/001-gate-b\/plan\.md ok/);
  assert.match(half.out, /refused — specs\/<n>-gate-b\/tasks\.md is missing/);

  artifact('specs/001-gate-b/tasks.md');
  const passed = await capture(() => change.run(['apply', 'gate-b'], ctx));
  assert.equal(passed.code, 0);
  // analyze/implement/converge all print, none gate — each with its reason.
  assert.match(passed.out, /run \/speckit\.analyze[^\n]*STRICTLY READ-ONLY/);
  assert.match(passed.out, /run \/speckit\.implement[^\n]*grading its own homework/);
  assert.match(passed.out, /run \/speckit\.converge[^\n]*invisible to the filesystem/);
});

test('speckit: close still has no archive step, but its task ledger is read', async () => {
  // spec-kit genuinely has no archive equivalent, so nothing here proves a
  // close step RAN — that gap stays stated. What close can read is the task
  // list implement keeps: every box ticked passes, an open one refuses.
  assert.equal(await change.run(['land', 'gate-b', '--landed', 'brain'], ctx), 0);
  const c = await capture(() => change.run(['close', 'gate-b'], ctx));
  assert.equal(c.code, 0);
  assert.match(c.out, /tasks\.md — nothing left open/);
  assert.match(c.out, /sdd speckit: close — this tool has no agent-run close step; nothing to run/);
  commitAll();
});

// --- where the gate looked ---

test('the gate names the repo it searched, and the one it found the artifact in', async () => {
  // A change of the code repo, whose spec was written there by habit. The SDD
  // runs in the brain alone (MV-146), so the brain is the one place a proof is
  // read — and the file in the code repo is named, so the agent is not left
  // looking for it in the wrong checkout again.
  const api = join(tmp, 'acme-api');
  initRepo(api, { 'README.md': '# api\n' });
  config(['doors: [agents]', 'sdd: opsx', 'repos:', '  brain: .', '  api: ../acme-api']);
  const c1 = await capture(() => change.run(['new', 'gate-f', 'Gate f'], ctx));
  assert.equal(c1.code, 0);
  const parsed = await loadChange(brain, 'gate-f');
  parsed.change.repos = { api: { status: 'planned' } };
  parsed.change.landing_order = [['api']];
  parsed.change.invariants.adds = [];
  await saveChange(brain, parsed);

  const refused = await capture(() => change.run(['plan', 'gate-f'], ctx));
  assert.equal(refused.code, 1);
  // The root it searched, by the name the config gave it — otherwise the
  // agent writes the proposal into whichever checkout it happens to be in.
  assert.match(refused.out, /is missing — looked in brain$/m);
  assert.doesNotMatch(refused.out, /not read/);

  mkdirSync(join(api, 'openspec/changes/gate-f'), { recursive: true });
  writeFileSync(join(api, 'openspec/changes/gate-f/proposal.md'), 'x\n');
  const stray = await capture(() => change.run(['plan', 'gate-f'], ctx));
  assert.equal(stray.code, 1, 'a proof in a code repo proves nothing');
  assert.match(stray.out, /is missing — looked in brain$/m);
  assert.match(stray.out, /^sdd opsx: {3}api: openspec\/changes\/gate-f\/proposal\.md — not read; the SDD runs only in the brain$/m);

  artifact('openspec/changes/gate-f/proposal.md');
  const passed = await capture(() => change.run(['plan', 'gate-f'], ctx));
  assert.equal(passed.code, 0);
  assert.match(passed.out, /sdd opsx: brain: openspec\/changes\/gate-f\/proposal\.md ok/);
  assert.doesNotMatch(passed.out, /not read/);
  rmSync(join(api, 'openspec'), { recursive: true, force: true });
  commitAll();
});

// --- the off switches ---

test('--no-sdd turns off the steps AND the gates', async () => {
  config(['doors: [agents]', 'sdd: opsx', 'repos:', '  brain: .']);
  const c1 = await capture(() => change.run(['new', 'off-c', 'Off c', '--no-sdd'], ctx));
  assert.equal(c1.code, 0);
  assert.doesNotMatch(c1.out, /sdd opsx/);
  await declareBrain('off-c');
  // Nothing on disk proves a single opsx step for off-c — every gate lets it by.
  for (const sub of ['plan', 'apply'] as const) {
    const c = await capture(() => change.run([sub, 'off-c', '--no-sdd'], ctx));
    assert.equal(c.code, 0, `${sub} must pass with --no-sdd`);
    assert.doesNotMatch(c.out, /sdd opsx/);
  }
  assert.equal(await change.run(['land', 'off-c', '--landed', 'brain', '--no-sdd'], ctx), 0);
  const c2 = await capture(() => change.run(['close', 'off-c', '--no-sdd'], ctx));
  assert.equal(c2.code, 0);
  assert.doesNotMatch(c2.out, /sdd opsx/);
  commitAll();
});

test('sdd_auto: false turns off every step and every gate, permanently', async () => {
  config(['doors: [agents]', 'sdd: opsx', 'sdd_auto: false', 'repos:', '  brain: .']);
  const c1 = await capture(() => change.run(['new', 'off-d', 'Off d'], ctx));
  assert.equal(c1.code, 0);
  assert.doesNotMatch(c1.out, /sdd opsx/);
  await declareBrain('off-d');
  for (const sub of ['plan', 'apply'] as const) {
    const c = await capture(() => change.run([sub, 'off-d'], ctx));
    assert.equal(c.code, 0, `${sub} must pass under sdd_auto: false`);
    assert.doesNotMatch(c.out, /sdd opsx/);
  }
  assert.equal(await change.run(['land', 'off-d', '--landed', 'brain'], ctx), 0);
  const c2 = await capture(() => change.run(['close', 'off-d'], ctx));
  assert.equal(c2.code, 0);
  assert.doesNotMatch(c2.out, /sdd opsx/);
  commitAll();
});

test('undeclared sdd prints nothing and gates nothing', async () => {
  config(['doors: [agents]', 'repos:', '  brain: .']);
  const c = await capture(() => change.run(['new', 'quiet-e', 'Quiet e'], ctx));
  assert.equal(c.code, 0);
  assert.doesNotMatch(c.out, /^sdd /m);
  await declareBrain('quiet-e');
  const p = await capture(() => change.run(['plan', 'quiet-e'], ctx));
  assert.equal(p.code, 0);
  assert.doesNotMatch(p.out, /^sdd /m);
});

// --- the tool's own ledger, read where its escape hatch would slip through ---

test('opsx: close refuses when the archived change still has open tasks', async () => {
  // `openspec archive <slug> --json --yes` archives over open tasks with exit
  // 0 and no warning at all (1.5.0 through 1.13.2; text mode's `Warning: N
  // incomplete task(s) found` never reaches `--json`) — so the archived
  // directory proves the archive ran and nothing more. The printed archive
  // carries no `--yes`, and openspec refuses open tasks itself; close reads
  // the task list openspec just moved, for the archive a human's `--yes` made.
  const spec = sddSpec('opsx')!;
  const led = spec.steps!.find((s) => s.unfinished)!.unfinished!;
  assert.equal(led.gate, 'close');
  assert.match(led.why, /archives over its own refusal/);
  assert.match(led.why, /under `--json` says nothing/);
  const re = new RegExp(led.pattern);
  assert.ok(re.test('- [ ] 1.2 Backfill existing rows'));
  assert.ok(re.test('  - [ ] nested still counts'));
  assert.ok(!re.test('- [x] 1.1 Add the expiry column'));
  assert.ok(!re.test('## 1. Implementation'));

  // The refusal prints that reason, over the archived task list in the checkout.
  const b = await opsxBrain('ledger-brain', 'gate-led');
  const at = { cwd: b };
  const arch = 'openspec/changes/archive/2026-09-28-gate-led';
  put(b, `${arch}/proposal.md`, '# Gate led\n');
  put(b, `${arch}/tasks.md`, '- [x] 1.1 Say hello\n- [ ] 1.2 Say farewell\n');
  assert.equal((await capture(() => change.run(['land', 'gate-led', '--landed', 'brain'], at))).code, 0);
  const refused = await capture(() => change.run(['close', 'gate-led'], at));
  assert.equal(refused.code, 1, refused.out);
  assert.ok(
    refused.out.includes(
      `sdd opsx: \`change close gate-led\` refused — brain:${arch}/tasks.md has 1 open item(s) — ${led.why}`,
    ),
    refused.out,
  );
  assert.match(refused.out, /^ {4}- \[ \] 1\.2 Say farewell$/m);
  put(b, `${arch}/tasks.md`, '- [x] 1.1 Say hello\n- [x] 1.2 Say farewell\n');
  assert.equal((await capture(() => change.run(['close', 'gate-led'], at))).code, 0);
});

test('speckit: the ledger is checked even though implement stays ungateable', async () => {
  // Two different questions about the same step. "Did implement run" is
  // unprovable — it is why the step carries `ungateable`. "Does its own task
  // list still have open boxes" is a fact on disk, so it gates at close.
  const spec = sddSpec('speckit')!;
  const step = spec.steps!.find((s) => s.run.includes('/speckit.implement'))!;
  assert.ok(step.ungateable, 'implement must stay ungateable for existence');
  assert.equal(step.artifact, undefined);
  assert.equal(step.unfinished?.gate, 'close');
  assert.match(step.unfinished!.artifact, /tasks\.md$/);
});

// --- a gate that cannot be evaluated refuses; it never passes quietly ---

/** A fresh opsx change with both gated artifacts already on disk. */
async function readyChange(slug: string): Promise<void> {
  config(['doors: [agents]', 'sdd: opsx', 'repos:', '  brain: .']);
  await change.run(['new', slug, `Binary ${slug}`], ctx);
  await declareBrain(slug);
  artifact(`openspec/changes/${slug}/proposal.md`);
  artifact(`openspec/changes/${slug}/tasks.md`, '- [ ] 1.1 do it\n');
}

test('a validator that is not installed REFUSES, naming the binary and the install line', async () => {
  // The regression this pins: toolVerdict used to return null when the binary
  // was absent, so the gate stood on artifact existence alone — green on a
  // machine that could not check anything. Reverting that change used to leave
  // the whole suite passing, which is the same hole one level up.
  await readyChange('gate-bin');
  const savedPath = process.env.PATH;
  process.env.PATH = '/usr/bin:/bin'; // git stays reachable; openspec does not
  try {
    const c = await capture(() => change.run(['apply', 'gate-bin'], ctx));
    assert.equal(c.code, 1);
    assert.match(c.out, /`openspec` found on neither PATH nor brain's node_modules\/\.bin/);
    assert.match(c.out, /install opsx: npm i -g @fission-ai\/openspec \(https:\/\/github\.com\/Fission-AI\/OpenSpec\)/);
    // NOT "drop `sdd:`": that key also renders the SDD flow into the brain
    // door, so removing it would delete the agent's instructions with the gate.
    assert.match(c.out, /--no-sdd/);
    assert.match(c.out, /sdd_auto: false/);
    assert.doesNotMatch(c.out, /drop `sdd:`/);
  } finally {
    process.env.PATH = savedPath;
  }
  commitAll();
});

test('a locally-installed validator is found in node_modules/.bin, not refused', async () => {
  // `npm i -D @fission-ai/openspec` never touches $PATH. Refusing that shape
  // would push the operator to a global install or to turning the gate off,
  // for a validator sitting right there.
  await readyChange('gate-localbin');
  const localBin = join(brain, 'node_modules', '.bin');
  mkdirSync(localBin, { recursive: true });
  writeFileSync(join(localBin, 'openspec'), '#!/bin/sh\nexit 0\n');
  chmodSync(join(localBin, 'openspec'), 0o755);
  const savedPath = process.env.PATH;
  process.env.PATH = '/usr/bin:/bin'; // git stays reachable; openspec does not
  try {
    const c = await capture(() => change.run(['apply', 'gate-localbin'], ctx));
    assert.equal(c.code, 0);
    assert.doesNotMatch(c.out, /found on neither PATH nor/);
  } finally {
    process.env.PATH = savedPath;
    rmSync(join(brain, 'node_modules'), { recursive: true, force: true });
  }
  commitAll();
});

// --- close is no weaker than its siblings, and has an exit for abandonment ---

test('close refuses a repo key that plan and apply already refuse', async () => {
  // Counting keys is not having repos: one invented name satisfied the
  // empty-map check while `plan` and `apply` both reject it, which left close
  // the weakest of the three doors.
  config(['doors: [agents]', 'repos:', '  brain: .']); // no sdd — this is about repos
  commitAll();
  await change.run(['new', 'ghost', 'Ghost'], ctx);
  const parsed = await loadChange(brain, 'ghost');
  parsed.change.repos = { 'totally-not-a-repo': { status: 'landed' } };
  parsed.change.landing_order = [['totally-not-a-repo']];
  parsed.change.invariants.adds = [];
  await saveChange(brain, parsed);

  const c = await capture(() => change.run(['close', 'ghost'], ctx));
  assert.equal(c.code, 1);
  assert.match(c.out, /repo "totally-not-a-repo" not declared/);
  assert.equal(existsSync(join(brain, '.multivac/changes/archive/ghost.md')), false);
  commitAll();
});

test('--abandon gives the reservation back; the refusal points at it', async () => {
  // `change new` reserves before anything is declared, and close is the only
  // caller of releaseUnused — so gating close on repos closed the only door
  // out. An abandoned change would leak its id forever, or force a false
  // `status: landed` to get through.
  const c1 = await capture(() => change.run(['new', 'regret', 'Regret'], ctx));
  assert.match(c1.out, /reserves/);
  const reserved = /reserves (\S+)/.exec(c1.out)![1];
  assert.match(readFileSync(join(brain, '.multivac/invariants.md'), 'utf8'), /RESERVED by change regret/);

  const refused = await capture(() => change.run(['close', 'regret'], ctx));
  assert.equal(refused.code, 1);
  assert.match(refused.out, /--abandon/);

  const done = await capture(() => change.run(['close', 'regret', '--abandon'], ctx));
  assert.equal(done.code, 0);
  assert.match(done.out, new RegExp(reserved));
  assert.match(done.out, /nothing was verified; nothing landed/);
  // Only THIS change's row leaves — other open changes keep theirs.
  assert.doesNotMatch(
    readFileSync(join(brain, '.multivac/invariants.md'), 'utf8'),
    /RESERVED by change regret/,
  );
  commitAll();
});

// --- a present artifact that proves nothing is treated as missing ---

test('an artifact byte-identical to its template, or empty, is refused', async () => {
  config(['doors: [agents]', 'sdd: speckit', 'repos:', '  brain: .']);
  commitAll(); // the lifecycle refuses to open a change over dirty bookkeeping
  await change.run(['new', 'tmpl', 'Template'], ctx);
  await declareBrain('tmpl');
  artifact('specs/001-tmpl/spec.md', '# Real spec\n');

  // 1. What setup-plan.sh actually does: write the resolved template into place.
  const template = '# Implementation Plan: [FEATURE]\n\n**Branch**: `[###-feature-name]`\n';
  artifact('.specify/templates/plan-template.md', template);
  artifact('specs/001-tmpl/plan.md', template);
  artifact('specs/001-tmpl/tasks.md', '- [x] T001 done\n');
  const copied = await capture(() => change.run(['apply', 'tmpl'], ctx));
  assert.equal(copied.code, 1);
  assert.match(copied.out, /byte-identical to \.specify\/templates\/plan-template\.md/);

  // 1a. MV-147: this refusal re-prints the step, so a step carrying a guide
  //     re-prints it too — four spaces in, under the run, before the re-run
  //     line. No shipped entry has both a guide and a template to compare
  //     against, so spec-kit's plan step is lent one for this run alone.
  const planStep = sddSpec('speckit')!.steps!.find((s) => s.artifact === 'specs/<n>-<slug>/plan.md')!;
  planStep.guide = 'the guide for <slug>';
  try {
    const guided = (await capture(() => change.run(['apply', 'tmpl'], ctx))).out.split('\n');
    const at = guided.findIndex((l) => /byte-identical to \.specify\/templates\/plan-template\.md/.test(l));
    assert.ok(at >= 0, guided.join('\n'));
    assert.ok(guided[at + 1].startsWith('  ') && !guided[at + 1].startsWith('   '), guided[at + 1]);
    assert.equal(guided[at + 2], '    the guide for tmpl');
    assert.equal(guided[at + 3], '  then re-run: multivac change apply tmpl');
  } finally {
    delete planStep.guide;
  }

  // 1b. The same, resolved from the skeleton the scaffold writes (MV-146):
  //     setup-plan.sh copies the override, and the refusal names it.
  const override = join(brain, '.specify/templates/overrides/plan-template.md');
  const hadOverride = existsSync(override) ? readFileSync(override, 'utf8') : null;
  artifact('.specify/templates/overrides/plan-template.md', SKELETON.files['plan-template.md']);
  artifact('specs/001-tmpl/plan.md', SKELETON.files['plan-template.md']);
  const skeletal = await capture(() => change.run(['apply', 'tmpl'], ctx));
  assert.equal(skeletal.code, 1);
  assert.match(skeletal.out, /byte-identical to \.specify\/templates\/overrides\/plan-template\.md/);
  if (hadOverride === null) rmSync(override);
  else writeFileSync(override, hadOverride);

  // 2. setup-plan.sh's own fallback when it cannot resolve a template:
  //    `rm -f` then `touch`, leaving nothing at all.
  artifact('specs/001-tmpl/plan.md', '   \n');
  const empty = await capture(() => change.run(['apply', 'tmpl'], ctx));
  assert.equal(empty.code, 1);
  assert.match(empty.out, /plan\.md is empty/);

  // 3. A real plan passes — including one that KEEPS the template's heading,
  //    which spec-kit never asks anyone to change.
  artifact('specs/001-tmpl/plan.md', `${template}\n## Summary\n\nA real plan.\n`);
  const real = await capture(() => change.run(['apply', 'tmpl'], ctx));
  assert.equal(real.code, 0);

  // 4. The comparison FAILS OPEN when it cannot be made. MV-65 chose whole-file
  //    equality over a placeholder pin, and that choice only holds because a
  //    repo whose templates were never fetched — or whose preset resolves one
  //    from somewhere these paths do not name — keeps its honest work. MV-76's
  //    row leans on this being deliberate, so it is pinned rather than left as
  //    an assertion about a branch nothing exercises.
  rmSync(join(brain, '.specify/templates/plan-template.md'), { force: true });
  const noTemplate = await capture(() => change.run(['apply', 'tmpl'], ctx));
  assert.equal(noTemplate.code, 0, 'an unreadable template must not refuse an authored artifact');
  assert.doesNotMatch(noTemplate.out, /byte-identical/);
  commitAll();
});

// --- the project-level document: gated on existing, never on its content ---

/** Where spec-kit puts the constitution, in the brain fixture. */
const constitution = join(brain, '.specify/memory/constitution.md');

test('plan refuses while the project document is absent or still the template', async () => {
  config(['doors: [agents]', 'sdd: speckit', 'repos:', '  brain: .']);
  rmSync(constitution, { force: true });
  commitAll();
  await change.run(['new', 'proj-doc', 'Project doc'], ctx);
  await declareBrain('proj-doc');
  artifact('specs/001-proj-doc/spec.md', '# Real spec\n'); // the per-change gate is satisfied
  // spec-kit has already run here, so MV-75's scaffold is a no-op and the five
  // states below are the gate's own doing. Stated, not assumed: the moment
  // .specify goes missing the init writes the constitution back as the
  // template, and "absent" stops being a state this test can reach. That case
  // has its own test at the bottom of this file.
  assert.ok(existsSync(join(brain, '.specify')), 'the scaffold must not fire during this test');

  // 1. Absent. The door has said CREATE IT IF ABSENT in capitals since the
  //    beginning and nothing ever refused for it.
  const absent = await capture(() => change.run(['plan', 'proj-doc'], ctx));
  assert.equal(absent.code, 1);
  // The refusal names the ROOT it is about (MV-87), not just the path: in an
  // ecosystem of six, "it is missing" does not say which checkout to open.
  assert.match(
    absent.out,
    /refused — brain:\.specify\/memory\/constitution\.md is missing or unreadable/,
  );
  // No "looked in <every root>" here any more: that list was what a first-hit
  // search had to disclose. A per-root refusal names the root in the sentence
  // itself, and the list survives only for the case where the tool is
  // installed in no root at all.
  assert.match(absent.out, /run \/speckit\.constitution in your agent/);
  assert.match(absent.out, /then re-run: multivac change plan proj-doc/);
  assert.match(absent.out, /--no-sdd/);

  // 2. A directory at the document's path. Present to `stat`, and not a
  //    written document by any reading — refused, and never a crash.
  mkdirSync(constitution, { recursive: true });
  const dir = await capture(() => change.run(['plan', 'proj-doc'], ctx));
  assert.equal(dir.code, 1);
  assert.match(dir.out, /constitution\.md is missing or unreadable/);
  rmSync(constitution, { recursive: true, force: true });

  // 3. What `specify init` actually leaves: the template, tokens and all.
  //    Refused in words of its own — "missing" would be a different problem.
  artifact('.specify/memory/constitution.md', '# [PROJECT_NAME] Constitution\n\n## [PRINCIPLE_1_NAME]\n');
  const tmplDoc = await capture(() => change.run(['plan', 'proj-doc'], ctx));
  assert.equal(tmplDoc.code, 1);
  assert.match(tmplDoc.out, /constitution\.md is still the unfilled template shipped by the tool \(placeholders remain/);
  assert.doesNotMatch(tmplDoc.out, /constitution\.md is missing or unreadable/);

  // 4. Empty — the weakest possible evidence anyone wrote one.
  artifact('.specify/memory/constitution.md', '   \n');
  const empty = await capture(() => change.run(['plan', 'proj-doc'], ctx));
  assert.equal(empty.code, 1);
  assert.match(empty.out, /constitution\.md is empty/);

  // 5. Written. No token left, and nothing else about it is judged — this
  //    constitution is three lines long and the gate has no opinion on that.
  artifact('.specify/memory/constitution.md', '# Acme Constitution\n\n## I. Ship it\n');
  const written = await capture(() => change.run(['plan', 'proj-doc'], ctx));
  assert.equal(written.code, 0);
  assert.match(written.out, /sdd speckit: brain: \.specify\/memory\/constitution\.md ok/);
  commitAll();
});

test('a stale project document still reports, never gates', async () => {
  // The law moved and the constitution did not. `doctor` calls that STALE;
  // the gate says nothing, because the law moving is not proof the principles
  // must move, and refusing here would block honest work on every unrelated row.
  config(['doors: [agents]', 'sdd: speckit', 'repos:', '  brain: .']);
  artifact('.specify/memory/constitution.md', '# Acme Constitution\n\n## I. Ship it\n');
  const old = new Date('2020-01-01T00:00:00Z').getTime() / 1000;
  utimesSync(constitution, old, old);
  const report = (await doctorReport(brain)).lines.join('\n');
  assert.match(report, /project law @ brain: .*STALE: the law moved while this did not/);

  const planned = await capture(() => change.run(['plan', 'proj-doc'], ctx));
  assert.equal(planned.code, 0);
  assert.match(planned.out, /sdd speckit: brain: \.specify\/memory\/constitution\.md ok/);

  // The off switches reach this gate exactly as they reach every other one.
  rmSync(constitution, { force: true });
  const off1 = await capture(() => change.run(['plan', 'proj-doc', '--no-sdd'], ctx));
  assert.equal(off1.code, 0);
  assert.doesNotMatch(off1.out, /constitution/);
  config(['doors: [agents]', 'sdd: speckit', 'sdd_auto: false', 'repos:', '  brain: .']);
  const off2 = await capture(() => change.run(['plan', 'proj-doc'], ctx));
  assert.equal(off2.code, 0);
  assert.doesNotMatch(off2.out, /constitution/);

  // And a tool whose project document is report-only is never gated on it:
  // opsx's `context:` is optional by the vendor's own word (MV-135).
  assert.ok(sddSpec('opsx')!.projectSteps!.every((p) => p.reportOnly));
  config(['doors: [agents]', 'sdd: opsx', 'repos:', '  brain: .']);
  artifact('openspec/changes/proj-doc/proposal.md');
  const opsx = await capture(() => change.run(['plan', 'proj-doc'], ctx));
  assert.equal(opsx.code, 0);
  assert.doesNotMatch(opsx.out, /constitution/);
  commitAll();
});

// --- the scaffold: the tool's own init, run once, before its steps are asked for ---

test('a declared SDD that is not installed scaffolds itself', async () => {
  // The deadlock this closes: `plan` refuses without spec.md, spec.md comes
  // from /speckit.specify, and that chat command does not exist until
  // `specify init` has run — so the only exits were the two switches that turn
  // the gate off to fix the reason it fired.
  config(['doors: [agents]', 'sdd: speckit', 'repos:', '  brain: .']);
  unscaffold();
  forgetSpecifyRuns();
  stubSpecify(0);

  const c = await capture(() => change.run(['new', 'scaffold-a', 'Scaffold a'], ctx));
  assert.equal(c.code, 0);
  // The command is the vendor's, verbatim, and it is printed before it runs.
  assert.match(
    c.out,
    /running the tool's own init there: `specify init --here --integration claude --force --ignore-agent-tools`/,
  );
  // The root it is missing FROM, named: presence is a per-root fact (MV-87),
  // so the line says which checkout is being scaffolded, not which list was
  // searched.
  assert.match(c.out, /\.specify is missing in brain/);
  assert.match(c.out, /scaffolded — brain:\.specify is there now/);
  assert.ok(existsSync(join(brain, '.specify')), 'the init must have written its artifact');
  assert.equal(specifyRuns().length, 1);
  // The steps stay chat commands: the scaffold satisfies none of them.
  assert.match(c.out, /run \/speckit\.specify in your agent/);
});

test('a scaffolded repo is left alone — the init runs once, not on every command', async () => {
  // `specify init` writes the vendor's files into the tree and, on 1.0.6, a
  // re-run reverts edited ones; a lifecycle that re-ran it on every command
  // would be worse than the hole it fills.
  //
  // BOTH halves, in one test and in this order: "it did not run" only means
  // something next to a run that did happen, on the same command, under the
  // same config — otherwise a lifecycle that scaffolds nothing at all passes.
  await declareBrain('scaffold-a');
  unscaffold();
  forgetSpecifyRuns();
  stubSpecify(0);
  const first = await capture(() => change.run(['plan', 'scaffold-a'], ctx));
  assert.match(first.out, /running the tool's own init/);
  assert.equal(specifyRuns().length, 1, 'an absent .specify must run the init exactly once');

  const c = await capture(() => change.run(['plan', 'scaffold-a'], ctx));
  assert.equal(c.code, 1); // no spec.md yet — that gate is unaffected
  assert.equal(specifyRuns().length, 1, 'a present .specify must run nothing');
  assert.doesNotMatch(c.out, /running the tool's own init/);
  assert.doesNotMatch(c.out, /scaffolded/);
});

test('a scaffold that fails says what the tool said, and the gate stays closed', async () => {
  unscaffold();
  forgetSpecifyRuns();
  stubSpecify(2, false, 'error: permission denied');
  const c = await capture(() => change.run(['plan', 'scaffold-a'], ctx));
  assert.equal(specifyRuns().length, 1);
  // The TOOL'S words, not node's `Command failed: …`.
  assert.match(c.out, /it said: error: permission denied/);
  assert.match(c.out, /left no \.specify in brain/);
  // Handed back so it can be run by hand.
  assert.match(c.out, /run it in brain by hand/);
  // A failed scaffold decides nothing on its own: the gate below still refuses
  // for its own reason, and the lifecycle did not throw.
  assert.equal(c.code, 1);
  assert.match(c.out, /refused — specs\/<n>-scaffold-a\/spec\.md is missing/);
});

test('a scaffold that exits 0 and writes nothing is a failure, not a success', async () => {
  // An exit code is the tool's claim; the artifact is the fact. The gates look
  // for the artifact, so the artifact is what decides.
  unscaffold();
  forgetSpecifyRuns();
  stubSpecify(0, false);
  const c = await capture(() => change.run(['plan', 'scaffold-a'], ctx));
  assert.equal(specifyRuns().length, 1);
  assert.match(c.out, /left no \.specify in brain — it exited 0 and wrote nothing there/);
  assert.doesNotMatch(c.out, /scaffolded —/);
});

test('an init that leaves .specify without its integration file is partial, not scaffolded', async () => {
  // MV-124: `scaffolded` is the probe's word after the run, not the directory's.
  unscaffold();
  forgetSpecifyRuns();
  stubSpecify(0, 'memory-only');
  try {
    const c = await capture(() => change.run(['plan', 'scaffold-a'], ctx));
    assert.equal(specifyRuns().length, 1);
    assert.match(c.out, /left \.specify partial \(\.specify is there and \.specify\/integration\.json is not\) in brain — it exited 0 — run it in brain by hand/);
    assert.doesNotMatch(c.out, /partial[^\n]*wrote nothing/);
    assert.doesNotMatch(c.out, /scaffolded/);
  } finally {
    stubSpecify(0);
  }
});

test('a scaffold whose binary is missing prints the install line and runs nothing', async () => {
  unscaffold();
  forgetSpecifyRuns();
  stubSpecify(0);
  const savedPath = process.env.PATH;
  process.env.PATH = '/usr/bin:/bin'; // git stays reachable; specify does not
  try {
    const c = await capture(() => change.run(['plan', 'scaffold-a'], ctx));
    assert.match(c.out, /`specify` found on neither PATH nor brain's node_modules\/\.bin/);
    assert.match(c.out, /install speckit: uv tool install specify-cli \(https:\/\/github\.com\/github\/spec-kit\)/);
    assert.equal(specifyRuns().length, 0);
    assert.equal(c.code, 1);
  } finally {
    process.env.PATH = savedPath;
  }
});

test('the scaffold runs where `claude` is not installed, because it passes --ignore-agent-tools', async () => {
  // spec-kit 1.0.6 checks for the integration's agent CLI before writing a
  // byte, and the stub above reproduces that check. This suite's PATH is built,
  // so `claude` is on it nowhere — stated rather than assumed.
  assert.equal(execFileSync('sh', ['-c', 'command -v claude || echo none'], { encoding: 'utf8' }).trim(), 'none');
  config(['doors: [agents]', 'sdd: speckit', 'repos:', '  brain: .']);
  unscaffold();
  forgetSpecifyRuns();
  stubSpecify(0);
  const c = await capture(() => change.run(['new', 'no-claude', 'No claude'], ctx));
  assert.equal(c.code, 0);
  assert.ok(existsSync(join(brain, '.specify')), 'the init wrote .specify with no claude to find');
  assert.match(c.out, /scaffolded — brain:\.specify is there now/);
  assert.equal(specifyRuns().length, 1);
  assert.match(specifyRuns()[0], /--ignore-agent-tools/);
});

test("a scaffold that fails as spec-kit 1.0.6 does is quoted by its cause, not its banner", async () => {
  unscaffold();
  forgetSpecifyRuns();
  stubSpecify(1, false, '', { says: SPECKIT_106_NO_CLAUDE.stdout });
  try {
    const c = await capture(() => change.run(['plan', 'no-claude'], ctx));
    assert.equal(specifyRuns().length, 1);
    const said = c.out.split('\n').find((l) => l.includes('left no .specify in brain')) ?? '';
    assert.match(said, /it said: Agent Detection Error; claude not found — run it in brain by hand/);
    assert.doesNotMatch(said, /[\u2500-\u259F]/);
  } finally {
    stubSpecify(0);
  }
});

// --- the skeleton: written once, by the scaffold, where spec-kit looks first ---

test('a scaffold writes the skeleton where spec-kit resolves templates first', async () => {
  // MV-146: every resolver spec-kit 1.0.11 ships reads overrides/ before its
  // core templates, so what the scaffold leaves there is what specify, plan
  // and tasks hand the agent. Said before the run and after it.
  config(['doors: [agents]', 'sdd: speckit', 'repos:', '  brain: .']);
  unscaffold();
  forgetSpecifyRuns();
  stubSpecify(0, true, '', { templates: true });
  const c = await capture(() => change.run(['plan', 'no-claude'], ctx));
  assert.equal(specifyRuns().length, 1);
  assert.match(c.out, /running the tool's own init there: `specify init [^`]*`, then multivac writes its skeleton templates to \.specify\/templates\/overrides$/m);
  assert.match(
    c.out,
    /scaffolded — brain:\.specify is there now; its steps are runnable; skeleton: \.specify\/templates\/overrides\/\{spec,plan,tasks\}-template\.md$/m,
  );
  for (const [file, body] of Object.entries(SKELETON.files)) {
    assert.equal(readFileSync(join(OVERRIDES, file), 'utf8'), body, `${file}: the recorded body, byte for byte`);
  }

  // Once. The next command finds spec-kit installed and writes nothing — not
  // over a skeleton a human has since edited, and not back where one was deleted.
  writeFileSync(join(OVERRIDES, 'plan-template.md'), '# TEAM RULE\n');
  rmSync(join(OVERRIDES, 'spec-template.md'));
  const again = await capture(() => change.run(['plan', 'no-claude'], ctx));
  assert.doesNotMatch(again.out, /skeleton/);
  assert.equal(readFileSync(join(OVERRIDES, 'plan-template.md'), 'utf8'), '# TEAM RULE\n');
  assert.ok(!existsSync(join(OVERRIDES, 'spec-template.md')), 'a deleted override stays deleted');
});

test('no skeleton after a failed or partial scaffold or below the floor; a lost heading skips its body by name', async () => {
  const plan = async (): Promise<string> => (await capture(() => change.run(['plan', 'no-claude'], ctx))).out;
  try {
    // Failed: nothing of spec-kit is there, so nothing of multivac either.
    unscaffold();
    stubSpecify(2, false, 'error: permission denied');
    assert.doesNotMatch(await plan(), /skeleton:|skeleton skipped/);
    assert.ok(!existsSync(OVERRIDES));

    // Partial: the probe never said installed.
    unscaffold();
    stubSpecify(0, 'memory-only');
    assert.doesNotMatch(await plan(), /skeleton:|skeleton skipped/);
    assert.ok(!existsSync(OVERRIDES));

    // Below the floor measured to read overrides/ first, an override is a
    // file nothing reads.
    unscaffold();
    stubSpecify(0, true, '', { templates: true, version: '0.9.3' });
    assert.match(await plan(), /; its steps are runnable; skeleton skipped: spec-kit 0\.9\.3 is below 0\.9\.4$/m);
    assert.ok(!existsSync(OVERRIDES));

    // A core template that dropped a heading its skeleton keeps: that body
    // alone is skipped, and the heading is named.
    unscaffold();
    stubSpecify(0, true, '', { templates: true, lose: 'Constitution Check' });
    assert.match(
      await plan(),
      /; skeleton: \.specify\/templates\/overrides\/\{spec,tasks\}-template\.md; skeleton skipped: plan-template\.md: the installed template has no "## Constitution Check"$/m,
    );
    assert.ok(existsSync(join(OVERRIDES, 'spec-template.md')));
    assert.ok(!existsSync(join(OVERRIDES, 'plan-template.md')));
  } finally {
    stubSpecify(0);
  }
});

test('the skeleton never writes into an overrides/ already there, nor without a recorded version', async () => {
  const spec = sddSpec('speckit')!;
  const root = mkdtempSync(join(tmpdir(), 'mvac-skeleton-'));
  const put = (rel: string, body: string): void => {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), body);
  };
  for (const [f, hs] of Object.entries(CORE_HEADINGS)) put(`.specify/templates/${f}`, hs.map((h) => `## ${h}\n`).join('\n'));
  const unversioned = SPECKIT_INTEGRATION_JSON.replace(/ {2}"version": "[^"]*",\n/, '');
  assert.notEqual(unversioned, SPECKIT_INTEGRATION_JSON);
  put('.specify/integration.json', unversioned);
  assert.deepEqual(await writeSkeleton(root, spec), { written: [], skipped: ['no recorded version'] });
  assert.ok(!existsSync(join(root, '.specify/templates/overrides')));

  // A human's overrides/ — or anything's: the directory is not ours to add to.
  put('.specify/integration.json', SPECKIT_INTEGRATION_JSON);
  put('.specify/templates/overrides/plan-template.md', '# TEAM RULE\n');
  assert.deepEqual(await writeSkeleton(root, spec), { written: [], skipped: ['.specify/templates/overrides exists'] });
  assert.equal(readFileSync(join(root, '.specify/templates/overrides/plan-template.md'), 'utf8'), '# TEAM RULE\n');
  assert.ok(!existsSync(join(root, '.specify/templates/overrides/spec-template.md')));

  // The control: the same root without overrides/ gets all three.
  rmSync(join(root, '.specify/templates/overrides'), { recursive: true });
  assert.deepEqual(await writeSkeleton(root, spec), {
    written: ['spec-template.md', 'plan-template.md', 'tasks-template.md'],
    skipped: [],
  });

  // No core template to read is no heading to check: that body is skipped, by name.
  rmSync(join(root, '.specify/templates/overrides'), { recursive: true });
  rmSync(join(root, '.specify/templates/tasks-template.md'));
  assert.deepEqual(await writeSkeleton(root, spec), {
    written: ['spec-template.md', 'plan-template.md'],
    skipped: ['tasks-template.md: the installed template is missing'],
  });
});

test('opsx runs its measured init, which installs no harness file — MV-130, MV-147', async () => {
  // openspec 1.13.2: `openspec init --tools none --no-animation .` was run in
  // a scratch repo and what it wrote recorded, so MV-59's "never guessed" is
  // met by measurement, not by a gap. The steps it serves are openspec's own
  // terminal verbs, so the declared doors change nothing: no integration is
  // installed and no door is named as a gap.
  rmSync(join(brain, 'openspec'), { recursive: true, force: true });
  const log = join(tmp, 'openspec-runs');
  rmSync(log, { force: true });
  writeFileSync(
    join(bin, 'openspec'),
    `#!/bin/sh\necho "$@ DO_NOT_TRACK=$DO_NOT_TRACK OPENSPEC_TELEMETRY=$OPENSPEC_TELEMETRY" >> '${log}'\ncase "$1" in init) mkdir -p openspec && printf 'schema: spec-driven\\n' > openspec/config.yaml;; esac\nexit 0\n`,
  );
  chmodSync(join(bin, 'openspec'), 0o755);
  config(['doors: [agents, claude]', 'sdd: opsx', 'repos:', '  brain: .']);
  const c = await capture(() => change.run(['plan', 'scaffold-a'], ctx));
  assert.match(c.out, /sdd opsx: scaffolded — brain:openspec is there now/);
  assert.match(c.out, /running the tool's own init there: `openspec init --tools none --no-animation \.`/);
  assert.doesNotMatch(c.out, /has no verified integration/);
  assert.equal(
    readFileSync(log, 'utf8').split('\n').find((l) => l.startsWith('init')),
    'init --tools none --no-animation . DO_NOT_TRACK=1 OPENSPEC_TELEMETRY=0',
  );
  rmSync(join(bin, 'openspec'), { force: true });
  rmSync(join(brain, 'openspec'), { recursive: true, force: true });
  config(['doors: [agents]', 'sdd: speckit', 'repos:', '  brain: .']);
});

test('--no-sdd and sdd_auto: false turn the scaffold off with everything else', async () => {
  // The scaffold is SDD automation, governed by the two switches that already
  // exist. A third switch would be a fourth state to explain.
  config(['doors: [agents]', 'sdd: speckit', 'repos:', '  brain: .']);
  unscaffold();
  forgetSpecifyRuns();
  stubSpecify(0);
  // The control the two silences are measured against: same repo, same absent
  // artifact, both switches on — it runs. Without this line "nothing ran" is
  // equally true of a lifecycle that never scaffolds at all.
  const on = await capture(() => change.run(['plan', 'scaffold-a'], ctx));
  assert.match(on.out, /running the tool's own init/);
  assert.equal(specifyRuns().length, 1);

  unscaffold();
  forgetSpecifyRuns();
  const off = await capture(() => change.run(['plan', 'scaffold-a', '--no-sdd'], ctx));
  assert.equal(off.code, 0);
  assert.doesNotMatch(off.out, /sdd speckit/);
  assert.equal(specifyRuns().length, 0);

  config(['doors: [agents]', 'sdd: speckit', 'sdd_auto: false', 'repos:', '  brain: .']);
  const never = await capture(() => change.run(['plan', 'scaffold-a'], ctx));
  assert.equal(never.code, 0);
  assert.doesNotMatch(never.out, /sdd speckit/);
  assert.equal(specifyRuns().length, 0);
  assert.ok(!existsSync(join(brain, '.specify')));
  commitAll();
});

// --- the brain alone: a code repo is never scaffolded, warned or asked ---

/** A sibling code repo beside the brain, the way a real ecosystem has them. */
const sibling = (name: string): string => {
  const dir = join(tmp, name);
  initRepo(dir, { 'README.md': `# ${name}\n` });
  return dir;
};

/** The five-root ecosystem these tests measure: two bare, one done by hand,
 *  one opted out, one declared but never cloned. */
const cascadeConfig = (sdd = 'speckit'): void =>
  config([
    'doors: [agents]',
    `sdd: ${sdd}`,
    'repos:',
    '  brain: .',
    '  api:',
    '    path: ../acme-api',
    '  web:',
    '    path: ../acme-web',
    '  landing:',
    '    path: ../acme-landing',
    '    sdd: none',
    '  gone:',
    '    path: ../acme-gone',
  ]);

test("a second run scaffolds nothing, and a code repo's hand-made .specify is never warned", async () => {
  // MV-146: the SDD runs in the brain alone. Measured with the cascade: one
  // `repos sync` wrote 30 files into each code repo, and a hand-made directory
  // in one of them was warned on every command. Now the brain is scaffolded,
  // once, and no code repo is scaffolded, warned or named — web's hand-made
  // directory is a leftover, `doctor`'s to report, not the lifecycle's.
  const api = sibling('acme-api');
  const web = sibling('acme-web');
  const landing = sibling('acme-landing');
  cascadeConfig();
  unscaffold();
  rmSync(join(api, '.specify'), { recursive: true, force: true });
  mkdirSync(join(web, '.specify'), { recursive: true }); // the one done by hand
  forgetSpecifyRuns();
  stubSpecify(0);

  const first = await capture(() => change.run(['new', 'cascade-a', 'Cascade a'], ctx));
  assert.equal(first.code, 0);
  assert.match(first.out, /\.specify is missing in brain/);
  assert.match(first.out, /scaffolded — brain:\.specify is there now/);
  assert.equal(specifyRuns().length, 1, 'the brain, once');
  for (const repo of ['api', 'web', 'landing', 'gone']) {
    assert.doesNotMatch(first.out, new RegExp(`(missing in|scaffolded — |sdd speckit: )${repo}\\b`));
  }
  assert.ok(!existsSync(join(api, '.specify')), 'a code repo that lacks it is left without it');
  assert.ok(!existsSync(join(landing, '.specify')), 'so is the opted-out one');
  assert.ok(!existsSync(join(tmp, 'acme-gone')), 'an absent repo is never created');
  commitAll();

  // Silence is a contract: `specify init` writes the vendor's files into the
  // tree and, on 1.0.6, a re-run reverts edited ones.
  forgetSpecifyRuns();
  const c = await capture(() => change.run(['new', 'cascade-b', 'Cascade b'], ctx));
  assert.equal(c.code, 0);
  assert.equal(specifyRuns().length, 0);
  assert.doesNotMatch(c.out, /running the tool's own init/);
  assert.doesNotMatch(c.out, /scaffolded/);
  assert.doesNotMatch(c.out, /is partial/);
  assert.doesNotMatch(c.out, /\bweb\b/);
  // No commitAll: `change new` commits its own bookkeeping and this test
  // deliberately leaves nothing else behind — that is the whole assertion.
});

test('opsx is initialised in the brain alone, never in a code repo that lacks it — MV-130', async () => {
  const api = join(tmp, 'acme-api');
  rmSync(join(brain, 'openspec'), { recursive: true, force: true });
  rmSync(join(api, 'openspec'), { recursive: true, force: true });
  writeFileSync(
    join(bin, 'openspec'),
    "#!/bin/sh\ncase \"$1\" in init) mkdir -p openspec && printf 'schema: spec-driven\\n' > openspec/config.yaml;; esac\nexit 0\n",
  );
  chmodSync(join(bin, 'openspec'), 0o755);
  cascadeConfig('opsx');
  const c = await capture(() => change.run(['new', 'cascade-d', 'Cascade d'], ctx));
  assert.match(c.out, /sdd opsx: scaffolded — brain:openspec is there now/);
  assert.doesNotMatch(c.out, /api:openspec/);
  assert.ok(!existsSync(join(api, 'openspec')), 'no init ran in api');
  rmSync(join(bin, 'openspec'), { force: true });
  rmSync(join(brain, 'openspec'), { recursive: true, force: true });
  config(['doors: [agents]', 'sdd: speckit', 'repos:', '  brain: .']);
  commitAll();
});

test('the scaffold does not satisfy the project-document gate it runs in front of', async () => {
  // Where MV-75 and MV-76 meet, and the only place either can undo the other.
  // `runScaffold` runs BEFORE `sddGate` in the same command, and what
  // `specify init` writes at .specify/memory/constitution.md is the UNFILLED
  // template — so one second after the init, the gate's artifact exists and
  // nobody has written it. If existence were the whole check, the scaffold
  // would hand the gate a pass on the exact document MV-76 was built to
  // refuse: the hole closed at the top and reopened one layer down, in a
  // command that prints "scaffolded" and green in the same breath.
  //
  // The placeholder pin is what stops it, so it is pinned here against the
  // stub that writes what the real init writes rather than a stand-in that is
  // kinder than the tool.
  config(['doors: [agents]', 'sdd: speckit', 'repos:', '  brain: .']);
  unscaffold();
  forgetSpecifyRuns();
  stubSpecify(0);
  await declareBrain('scaffold-a');
  artifact('specs/001-scaffold-a/spec.md', '# Real spec\n'); // the per-change gate is satisfied

  const c = await capture(() => change.run(['plan', 'scaffold-a'], ctx));
  assert.equal(specifyRuns().length, 1, 'the scaffold must have run in this very command');
  assert.match(c.out, /scaffolded — brain:\.specify is there now/);
  assert.ok(existsSync(constitution), 'the init writes the constitution, unfilled');
  assert.equal(c.code, 1);
  assert.match(
    c.out,
    /constitution\.md is still the unfilled template shipped by the tool \(placeholders remain/,
  );
  commitAll();
});

// --- the project document, asked of the brain alone ---

test("the project-document gate asks the brain alone; a code repo's template constitution never refuses", async () => {
  // It used to ask every root the tool was installed in, so each code repo
  // owed a constitution of its own before any change could plan (MV-87
  // amending MV-76). The SDD lives in the brain now (MV-146): one document per
  // ecosystem, and a code repo's copy — a leftover of an earlier release — is
  // `doctor`'s to report, never the gate's to refuse over.
  const api = join(tmp, 'acme-api');
  cascadeConfig();
  unscaffold();
  // A leftover install in api, holding the vendor's unfilled template.
  artifact('../acme-api/.specify/integration.json', SPECKIT_INTEGRATION_JSON);
  artifact('../acme-api/.specify/memory/constitution.md', CONSTITUTION_TEMPLATE);
  stubSpecify(0);

  await capture(() => change.run(['new', 'doc-per-root', 'Doc per root'], ctx));
  assert.ok(existsSync(join(brain, '.specify')), 'the brain is installed');
  const parsed = await loadChange(brain, 'doc-per-root');
  parsed.change.repos = { brain: { status: 'planned' } };
  parsed.change.landing_order = [['brain']];
  parsed.change.invariants.adds = [];
  await saveChange(brain, parsed);
  artifact('specs/001-doc-per-root/spec.md', '# Real spec\n');

  const refused = await capture(() => change.run(['plan', 'doc-per-root'], ctx));
  assert.equal(refused.code, 1);
  // The brain's, named. What the scaffold left it is the UNFILLED template,
  // which MV-76 refuses.
  assert.match(
    refused.out,
    /refused — brain:\.specify\/memory\/constitution\.md is still the unfilled template/,
  );
  assert.doesNotMatch(refused.out, /refused — (api|web|landing):/);

  // Written in the brain: the gate passes, and api's template decides nothing.
  writeFileSync(join(brain, '.specify/memory/constitution.md'), '# Constitution\n\nOne principle, written by a human.\n');
  const passed = await capture(() => change.run(['plan', 'doc-per-root'], ctx));
  assert.equal(passed.code, 0);
  assert.match(passed.out, /sdd speckit: brain: \.specify\/memory\/constitution\.md ok/);
  assert.doesNotMatch(passed.out, /\bapi\b/);
  assert.equal(readFileSync(join(api, '.specify/memory/constitution.md'), 'utf8'), CONSTITUTION_TEMPLATE, 'untouched');
  rmSync(join(api, '.specify'), { recursive: true, force: true });
  config(['doors: [agents]', 'sdd: speckit', 'repos:', '  brain: .']);
  commitAll();
});
