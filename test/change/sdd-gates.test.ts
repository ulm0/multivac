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
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { delimiter, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { initRepo } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { loadChange, saveChange } from '../../src/change/file.js';

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
  // ...and the exact agent command to run.
  assert.match(refused.out, /run \/opsx:propose gate-a in your agent/);
  assert.match(refused.out, /then re-run: multivac change plan gate-a/);
  assert.match(refused.out, /--no-sdd/);

  artifact('openspec/changes/gate-a/proposal.md');
  const passed = await capture(() => change.run(['plan', 'gate-a'], ctx));
  assert.equal(passed.code, 0);
  assert.match(passed.out, /sdd opsx: openspec\/changes\/gate-a\/proposal\.md ok/);
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
  assert.match(landed.out, /proof: openspec\/changes\/archive\/\*-gate-a/);

  const refused = await capture(() => change.run(['close', 'gate-a'], ctx));
  assert.equal(refused.code, 1);
  assert.match(refused.out, /refused — openspec\/changes\/archive\/\*-gate-a is missing/);
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
  const c1 = await capture(() => change.run(['new', 'gate-b', 'Gate b'], ctx));
  assert.equal(c1.code, 0);
  assert.match(c1.out, /run \/speckit\.specify in your agent to write the spec for gate-b/);
  // clarify is part of spec-kit's flow and is honestly ungateable.
  assert.match(c1.out, /run \/speckit\.clarify/);
  assert.match(c1.out, /ungateable: optional, and its `## Clarifications` session/);

  await declareBrain('gate-b');
  const refused = await capture(() => change.run(['plan', 'gate-b'], ctx));
  assert.equal(refused.code, 1);
  assert.match(refused.out, /refused — specs\/\*gate-b\*\/spec\.md is missing/);

  // spec-kit numbers AND names the feature directory itself — verified against
  // a real create-new-feature.sh, which turned "user login with email" into
  // `001-user-login-email`. The `*`s on both sides of the slug match that.
  artifact('specs/001-gate-b-login/spec.md');
  const planned = await capture(() => change.run(['plan', 'gate-b'], ctx));
  assert.equal(planned.code, 0);
  assert.match(planned.out, /specs\/001-gate-b-login\/spec\.md ok/);
  // plan prints TWO steps here — the flow is not a triple.
  assert.match(planned.out, /run \/speckit\.plan in your agent/);
  assert.match(planned.out, /run \/speckit\.tasks in your agent/);
});

test('speckit: apply gates on plan.md AND tasks.md, and its steps are ungateable', async () => {
  const refused = await capture(() => change.run(['apply', 'gate-b'], ctx));
  assert.equal(refused.code, 1);
  assert.match(refused.out, /refused — specs\/\*gate-b\*\/plan\.md is missing/);
  assert.match(refused.out, /refused — specs\/\*gate-b\*\/tasks\.md is missing/);

  artifact('specs/001-gate-b-login/plan.md');
  const half = await capture(() => change.run(['apply', 'gate-b'], ctx));
  assert.equal(half.code, 1);
  assert.match(half.out, /specs\/001-gate-b-login\/plan\.md ok/);
  assert.match(half.out, /refused — specs\/\*gate-b\*\/tasks\.md is missing/);

  artifact('specs/001-gate-b-login/tasks.md');
  const passed = await capture(() => change.run(['apply', 'gate-b'], ctx));
  assert.equal(passed.code, 0);
  // analyze/implement/converge all print, none gate — each with its reason.
  assert.match(passed.out, /run \/speckit\.analyze[^\n]*STRICTLY READ-ONLY/);
  assert.match(passed.out, /run \/speckit\.implement[^\n]*grading its own homework/);
  assert.match(passed.out, /run \/speckit\.converge[^\n]*invisible to the filesystem/);
});

test('speckit: close is not gated — the missing archive step is stated, not faked', async () => {
  assert.equal(await change.run(['land', 'gate-b', '--landed', 'brain'], ctx), 0);
  const c = await capture(() => change.run(['close', 'gate-b'], ctx));
  assert.equal(c.code, 0);
  assert.match(
    c.out,
    /sdd speckit: `change close` is not gated — this tool declares no step whose artifact could prove it/,
  );
  assert.match(c.out, /sdd speckit: close — this tool has no agent-run close step; nothing to run/);
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
