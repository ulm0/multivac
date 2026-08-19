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
 * more: the lifecycle now RUNS this one. `specify init` downloads templates,
 * so a suite that let the real binary through would reach the network from a
 * unit test and write a different tree on every machine.
 *
 * `writes` is the whole point of the stub: a tool that exits 0 and creates
 * nothing is a real outcome the lifecycle has to refuse to call success.
 */
const runLog = join(tmp, 'specify-runs');
const stubSpecify = (exit: number, writes = true, stderr = ''): void => {
  const p = join(bin, 'specify');
  writeFileSync(
    p,
    `#!/bin/sh\necho "$@" >> '${runLog}'\n` +
      (writes
        ? `mkdir -p .specify/memory\ncat > .specify/memory/constitution.md <<'EOF'\n${CONSTITUTION_TEMPLATE}EOF\n`
        : '') +
      (stderr ? `echo '${stderr}' >&2\n` : '') +
      `exit ${exit}\n`,
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

process.env.PATH = `${bin}${delimiter}${process.env.PATH ?? ''}`;

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

test('opsx: new prints propose, and plan REFUSES until proposal.md exists', async () => {
  const c1 = await capture(() => change.run(['new', 'gate-a', 'Gate a'], ctx));
  assert.equal(c1.code, 0);
  assert.match(c1.out, /sdd opsx: run \/opsx:propose gate-a in your agent/);
  // The printed step names what will prove it — the gate is not a surprise.
  assert.match(c1.out, /proof: openspec\/changes\/gate-a\/proposal\.md/);

  await declareBrain('gate-a');
  const refused = await capture(() => change.run(['plan', 'gate-a'], ctx));
  assert.equal(refused.code, 1);
  // Names the artifact it looked for...
  assert.match(refused.out, /refused — openspec\/changes\/gate-a\/proposal\.md is missing/);
  // ...where it looked for it...
  assert.match(refused.out, /looked in brain/);
  // ...and the exact agent command to run.
  assert.match(refused.out, /run \/opsx:propose gate-a in your agent/);
  assert.match(refused.out, /then re-run: multivac change plan gate-a/);
  assert.match(refused.out, /--no-sdd/);

  artifact('openspec/changes/gate-a/proposal.md');
  const passed = await capture(() => change.run(['plan', 'gate-a'], ctx));
  assert.equal(passed.code, 0);
  // The hit names the repo it landed in, not only the path: in an ecosystem
  // of six, a bare relative path does not say which checkout satisfied it.
  assert.match(passed.out, /sdd opsx: brain: openspec\/changes\/gate-a\/proposal\.md ok/);
  // plan is also where the tasks step is printed — its own gate is apply.
  assert.match(passed.out, /proof: openspec\/changes\/gate-a\/tasks\.md/);
});

test('opsx: apply REFUSES until tasks.md exists, then branches', async () => {
  const refused = await capture(() => change.run(['apply', 'gate-a'], ctx));
  assert.equal(refused.code, 1);
  assert.match(refused.out, /refused — openspec\/changes\/gate-a\/tasks\.md is missing/);
  // A refused apply leaves the change exactly where it found it.
  assert.equal((await loadChange(brain, 'gate-a')).change.repos.brain.status, 'planned');

  artifact('openspec/changes/gate-a/tasks.md', '- [ ] 1.1 do it\n');
  const passed = await capture(() => change.run(['apply', 'gate-a'], ctx));
  assert.equal(passed.code, 0);
  // apply's own step is ungateable, printed with the reason, never gated.
  assert.match(passed.out, /run \/opsx:apply gate-a in your agent/);
  assert.match(passed.out, /ungateable: apply leaves no artifact of its own/);
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
  assert.match(landed.out, /run \/opsx:archive gate-a in your agent/);
  assert.match(landed.out, /proof: openspec\/changes\/archive\/<n>-<n>-<n>-gate-a/);

  const refused = await capture(() => change.run(['close', 'gate-a'], ctx));
  assert.equal(refused.code, 1);
  assert.match(refused.out, /refused — openspec\/changes\/archive\/<n>-<n>-<n>-gate-a is missing/);
  assert.match(refused.out, /run \/opsx:archive gate-a in your agent/);

  // The date prefix is the tool's, not ours: the `*` segment matches it.
  artifact('openspec/changes/archive/2026-08-15-gate-a/proposal.md');
  const passed = await capture(() => change.run(['close', 'gate-a'], ctx));
  assert.equal(passed.code, 0);
  assert.match(passed.out, /openspec\/changes\/archive\/2026-08-15-gate-a ok/);
  commitAll();
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
  // The specs live in the code repo, not the brain — the ordinary shape once
  // an ecosystem has more than one checkout.
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
  // Every root it searched, by the name the config gave it — otherwise the
  // agent writes the proposal into whichever checkout it happens to be in.
  assert.match(refused.out, /looked in brain, api/);

  mkdirSync(join(api, 'openspec/changes/gate-f'), { recursive: true });
  writeFileSync(join(api, 'openspec/changes/gate-f/proposal.md'), 'x\n');
  const passed = await capture(() => change.run(['plan', 'gate-f'], ctx));
  assert.equal(passed.code, 0);
  assert.match(passed.out, /sdd opsx: api: openspec\/changes\/gate-f\/proposal\.md ok/);
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
  // `openspec archive --yes` prints `Warning: N incomplete task(s) found.
  // Continuing due to --yes flag.` and archives regardless — so the archived
  // directory proves the archive ran and nothing more. close reads the task
  // list openspec itself just moved.
  const spec = sddSpec('opsx')!;
  const led = spec.steps!.find((s) => s.unfinished)!.unfinished!;
  assert.equal(led.gate, 'close');
  const re = new RegExp(led.pattern);
  assert.ok(re.test('- [ ] 1.2 Backfill existing rows'));
  assert.ok(re.test('  - [ ] nested still counts'));
  assert.ok(!re.test('- [x] 1.1 Add the expiry column'));
  assert.ok(!re.test('## 1. Implementation'));
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
    assert.match(c.out, /`openspec` is not on PATH/);
    assert.match(c.out, /install it: npm i -g @fission-ai\/openspec/);
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
    assert.doesNotMatch(c.out, /is not on PATH/);
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

  // And a tool that declares no project document is untouched: opsx's
  // `projectSteps` is deliberately empty, so there is nothing to gate on.
  assert.equal(sddSpec('opsx')!.projectSteps!.length, 0);
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
    /running the tool's own init there: `specify init --here --integration claude --force`/,
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
  // `specify init` downloads templates and can overwrite them; a lifecycle that
  // re-ran it on every command would be worse than the hole it fills.
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
  stubSpecify(2, false, 'error: failed to download template from GitHub');
  const c = await capture(() => change.run(['plan', 'scaffold-a'], ctx));
  assert.equal(specifyRuns().length, 1);
  // The TOOL'S words, not node's `Command failed: …`.
  assert.match(c.out, /it said: error: failed to download template from GitHub/);
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

test('a scaffold whose binary is missing prints the install line and runs nothing', async () => {
  unscaffold();
  forgetSpecifyRuns();
  stubSpecify(0);
  const savedPath = process.env.PATH;
  process.env.PATH = '/usr/bin:/bin'; // git stays reachable; specify does not
  try {
    const c = await capture(() => change.run(['plan', 'scaffold-a'], ctx));
    assert.match(c.out, /`specify` is not on PATH/);
    assert.match(c.out, /install it: uv tool install specify-cli/);
    assert.equal(specifyRuns().length, 0);
    assert.equal(c.code, 1);
  } finally {
    process.env.PATH = savedPath;
  }
});

test('an adapter with no verified init states the gap instead of guessing one', async () => {
  // openspec's CLI has an `init`, but what it writes was never verified by
  // running it — and a guessed command would run against someone's repo.
  // MV-59's rule, one layer up from graphers.
  rmSync(join(brain, 'openspec'), { recursive: true, force: true });
  config(['doors: [agents]', 'sdd: opsx', 'repos:', '  brain: .']);
  const c = await capture(() => change.run(['plan', 'scaffold-a'], ctx));
  assert.match(c.out, /sdd opsx: declared, and nothing of it is in brain/);
  assert.match(c.out, /will not guess one/);
  assert.match(c.out, /npm i -g @fission-ai\/openspec/);
  assert.equal(sddSpec('opsx')!.scaffold, undefined);
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

// --- the cascade: every declared, present root, not the first one that answers ---

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

test('the scaffold reaches every root that lacks the artifact, not the first one that has it', async () => {
  // The measured defect, at the size it was measured: one sibling repo somebody
  // ran `specify init` in by hand suppressed the scaffold in every other root,
  // the brain included, because presence was asked of the whole list and
  // answered by the first hit (MV-87).
  const api = sibling('acme-api');
  const web = sibling('acme-web');
  const landing = sibling('acme-landing');
  cascadeConfig();
  unscaffold();
  rmSync(join(api, '.specify'), { recursive: true, force: true });
  mkdirSync(join(web, '.specify'), { recursive: true }); // the one done by hand
  forgetSpecifyRuns();
  stubSpecify(0);

  const c = await capture(() => change.run(['new', 'cascade-a', 'Cascade a'], ctx));
  assert.equal(c.code, 0);
  // Every root that needed it, named — and the one that did not, silent.
  assert.match(c.out, /\.specify is missing in brain/);
  assert.match(c.out, /\.specify is missing in api/);
  assert.doesNotMatch(c.out, /missing in web/);
  // Out of scope, not deficient: `sdd: none`, and a repo that is not on disk.
  assert.doesNotMatch(c.out, /missing in landing/);
  assert.doesNotMatch(c.out, /missing in gone/);

  assert.equal(specifyRuns().length, 2, 'brain and api, once each — never web');
  assert.ok(existsSync(join(brain, '.specify')), 'the brain is scaffolded');
  assert.ok(existsSync(join(api, '.specify')), 'and so is the sibling that lacked it');
  assert.ok(!existsSync(join(landing, '.specify')), 'the opted-out repo is untouched');
  assert.ok(!existsSync(join(tmp, 'acme-gone')), 'an absent repo is never created');
  commitAll();
});

test('a second run over an equipped ecosystem scaffolds nothing and says nothing', async () => {
  // Silence is a contract: `specify init` downloads templates and can overwrite
  // them, so a lifecycle that re-ran it every command would be worse than the
  // hole it fills.
  forgetSpecifyRuns();
  const c = await capture(() => change.run(['new', 'cascade-b', 'Cascade b'], ctx));
  assert.equal(c.code, 0);
  assert.equal(specifyRuns().length, 0);
  assert.doesNotMatch(c.out, /running the tool's own init/);
  assert.doesNotMatch(c.out, /scaffolded/);
  // No commitAll: `change new` commits its own bookkeeping and this test
  // deliberately leaves nothing else behind — that is the whole assertion.
});

test('a root whose init fails does not decide the fate of the roots after it', async () => {
  // One broken checkout in an ecosystem of six is a report, not a stop.
  const api = join(tmp, 'acme-api');
  unscaffold();
  rmSync(join(api, '.specify'), { recursive: true, force: true });
  forgetSpecifyRuns();
  // Fails in api alone; the brain is scaffolded before it and must still land.
  writeFileSync(
    join(bin, 'specify'),
    `#!/bin/sh\necho "$@" >> '${runLog}'\n` +
      "case \"$PWD\" in *acme-api) echo 'error: failed to download template' >&2; exit 2;; esac\n" +
      `mkdir -p .specify/memory\ncat > .specify/memory/constitution.md <<'EOF'\n${CONSTITUTION_TEMPLATE}EOF\nexit 0\n`,
  );
  chmodSync(join(bin, 'specify'), 0o755);
  try {
    const c = await capture(() => change.run(['new', 'cascade-c', 'Cascade c'], ctx));
    assert.equal(c.code, 0, 'a foreign tool failing is never the lifecycle failing');
    assert.equal(specifyRuns().length, 2, 'both roots were attempted');
    assert.match(c.out, /left no \.specify in api/);
    assert.match(c.out, /it said: error: failed to download template/);
    assert.match(c.out, /run it in api by hand/);
    // ...and the root before it still got its artifact.
    assert.match(c.out, /scaffolded — brain:\.specify is there now/);
    assert.ok(existsSync(join(brain, '.specify')));
  } finally {
    stubSpecify(0);
  }
});

test('an adapter with no declared init states the gap once per root that lacks it', async () => {
  // MV-59's rule survives the cascade: a tool whose init was never verified
  // gets none, in every root, and the gap is stated where it applies rather
  // than once for an ecosystem.
  const api = join(tmp, 'acme-api');
  rmSync(join(brain, 'openspec'), { recursive: true, force: true });
  rmSync(join(api, 'openspec'), { recursive: true, force: true });
  cascadeConfig('opsx');
  const c = await capture(() => change.run(['new', 'cascade-d', 'Cascade d'], ctx));
  assert.match(c.out, /sdd opsx: declared, and nothing of it is in brain/);
  assert.match(c.out, /sdd opsx: declared, and nothing of it is in api/);
  assert.match(c.out, /will not guess one/);
  assert.equal(sddSpec('opsx')!.scaffold, undefined);
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

// --- the project document, asked of every root the tool is installed in ---

test('the project-document gate asks every installed root and names each that fails', async () => {
  // The measured defect: one repo's constitution satisfied the gate for an
  // ecosystem of six, so five repos planned against a document they had never
  // seen (MV-87 amending MV-76).
  const api = join(tmp, 'acme-api');
  const web = join(tmp, 'acme-web');
  cascadeConfig();
  for (const d of [brain, api, web]) rmSync(join(d, '.specify'), { recursive: true, force: true });
  // web's init fails, so the cascade leaves it uninstalled — the state that
  // must NOT be asked for a constitution. landing opted out of the SDD
  // entirely. Both are roots; neither owns this document.
  writeFileSync(
    join(bin, 'specify'),
    `#!/bin/sh\necho "$@" >> '${runLog}'\n` +
      "case \"$PWD\" in *acme-web) echo 'error: no network' >&2; exit 2;; esac\n" +
      `mkdir -p .specify/memory\ncat > .specify/memory/constitution.md <<'EOF'\n${CONSTITUTION_TEMPLATE}EOF\nexit 0\n`,
  );
  chmodSync(join(bin, 'specify'), 0o755);

  await capture(() => change.run(['new', 'doc-per-root', 'Doc per root'], ctx));
  assert.ok(existsSync(join(brain, '.specify')), 'the cascade installed the brain');
  assert.ok(existsSync(join(api, '.specify')), 'and api');
  assert.ok(!existsSync(join(web, '.specify')), 'and could not install web');
  const parsed = await loadChange(brain, 'doc-per-root');
  parsed.change.repos = { brain: { status: 'planned' } };
  parsed.change.landing_order = [['brain']];
  parsed.change.invariants.adds = [];
  await saveChange(brain, parsed);
  artifact('specs/001-doc-per-root/spec.md', '# Real spec\n');

  const refused = await capture(() => change.run(['plan', 'doc-per-root'], ctx));
  assert.equal(refused.code, 1);
  // BOTH installed roots, each named. One line naming one repo would leave the
  // other unfixed and unmentioned. What the scaffold left them is the UNFILLED
  // template, which MV-76 refuses in each root exactly as it refuses in one.
  assert.match(
    refused.out,
    /refused — brain:\.specify\/memory\/constitution\.md is still the unfilled template/,
  );
  assert.match(
    refused.out,
    /refused — api:\.specify\/memory\/constitution\.md is still the unfilled template/,
  );
  // Not installed here, and opted out there: neither is asked, so neither can
  // refuse work over a document it has no reason to own.
  assert.doesNotMatch(refused.out, /refused — web:/);
  assert.doesNotMatch(refused.out, /refused — landing:/);

  // Written in both: the gate passes, and each pass names its root.
  const real = '# Constitution\n\nOne principle, written by a human.\n';
  writeFileSync(join(brain, '.specify/memory/constitution.md'), real);
  writeFileSync(join(api, '.specify/memory/constitution.md'), real);
  const passed = await capture(() => change.run(['plan', 'doc-per-root'], ctx));
  assert.equal(passed.code, 0);
  assert.match(passed.out, /sdd speckit: brain: \.specify\/memory\/constitution\.md ok/);
  assert.match(passed.out, /sdd speckit: api: \.specify\/memory\/constitution\.md ok/);

  // One root regressing is enough to refuse again — the gate is an AND over
  // the installed roots, not a search that stops at the first satisfied one.
  rmSync(join(api, '.specify/memory/constitution.md'), { force: true });
  const again = await capture(() => change.run(['plan', 'doc-per-root'], ctx));
  assert.equal(again.code, 1);
  assert.match(again.out, /refused — api:\.specify\/memory\/constitution\.md is missing or unreadable/);
  assert.match(again.out, /sdd speckit: brain: \.specify\/memory\/constitution\.md ok/);
  stubSpecify(0);
  config(['doors: [agents]', 'sdd: speckit', 'repos:', '  brain: .']);
  commitAll();
});
