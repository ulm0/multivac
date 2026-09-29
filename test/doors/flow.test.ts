// MV-96: a derived page saying what this ecosystem's declarations oblige.
//
// The first design of this feature was killed in review for citing invariant
// identifiers in generated output. Ids are allocated from each brain's own
// table and `init` writes a table with zero rows, so a generated `MV-56` names
// a different rule — or none — in every ecosystem except the one it was
// written in. The identifier test below is the one that matters most.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { loadConfig, FLOW_PATH } from '../../src/lib/config.js';
import { renderFlow } from '../../src/doors/flow.js';
import { sddSpec } from '../../src/adapters/registry.js';
import { doorsCommand } from '../../src/commands/doors.js';

const quiet = async (fn: () => Promise<number>): Promise<number> => {
  const origLog = console.log;
  const origErr = console.error;
  console.log = () => {};
  console.error = () => {};
  try {
    return await fn();
  } finally {
    console.log = origLog;
    console.error = origErr;
  }
};

async function eco(lines: string[]) {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-flow-'));
  const e = makeScratchEcosystem(tmp);
  writeFileSync(join(e.brain, '.multivac/config.yml'), [...lines, ''].join('\n'));
  return { ...e, cfg: await loadConfig(e.brain) };
}

const DECLARED = [
  'doors: [agents]',
  'sdd: speckit',
  'grapher: graphify',
  'repos:',
  '  api: ../acme-api',
];

// --- US1: the three groups ---

test('the page sorts declared obligations into automatic, gate and yours', async () => {
  const { cfg } = await eco(DECLARED);
  const page = renderFlow(cfg);
  for (const h of [
    '## Automatic — multivac does it, you do not ask',
    '## Gate — multivac refuses without it',
    '## Yours — nobody can check these',
  ]) {
    assert.ok(page.includes(h), `missing heading: ${h}`);
  }
  // The grapher's work is automatic; its artifact is a gate.
  assert.match(page, /the code graph is built where `multivac repos sync` or a change reaches a repo with no `graphify-out\/graph\.json`, refreshed .*at `change land`, where it is committed on the change branch, and at `change close`/);
  assert.match(page, /`change close` refuses while the brain or a repo the change names has no `graphify-out\/graph\.json`/);
  // MV-140: asking the graph is named as unchecked, with graphify's own reason.
  assert.match(page, /^- asking `graphify` before reading the tree — no committed file records a query: graphify writes only an untracked `graphify-out\/cache\/last_query_stamp`/m);
});

test('a gating row leads with the command that refuses and names the artifact', async () => {
  const { cfg } = await eco(DECLARED);
  const page = renderFlow(cfg);
  assert.match(page, /- `change plan` refuses without `specs\/<n>-<slug>\/spec\.md`/);
  assert.match(page, /- `change apply` refuses without `specs\/<n>-<slug>\/plan\.md`/);
  assert.match(page, /- `change apply` refuses without `specs\/<n>-<slug>\/tasks\.md`/);
});

// MV-146: the SDD runs in the brain alone, so its rows say so and name no
// other root; with `sdd_auto: false` the lifecycle gates nothing, and no row
// says it refuses.
test('the SDD rows are the brain\'s, and under sdd_auto: false none says the lifecycle refuses', async () => {
  const { cfg } = await eco(DECLARED);
  const page = renderFlow(cfg);
  assert.match(page, /^- the `speckit` init is run in the brain when its `\.specify` is missing, or the lifecycle says why it could not$/m);
  assert.match(page, /^- `change plan` refuses while `\.specify\/memory\/constitution\.md` is missing, empty or still the template, in the brain$/m);
  assert.doesNotMatch(page, /refuses without `specs\/[^`]+`.* — in /);

  const off = renderFlow({ ...cfg, sddAuto: false });
  const gate = off.slice(off.indexOf('## Gate'), off.indexOf('## Yours'));
  assert.doesNotMatch(gate, /specs\/|constitution/);
  assert.doesNotMatch(off, /refuses without `specs|refuses while `\.specify/);
  assert.match(off, /^- `specs\/<n>-<slug>\/spec\.md` before `change plan` — not gated \(`sdd_auto: false`\)$/m);
  assert.match(off, /^- `\.specify\/memory\/constitution\.md` in the brain, before `change plan` — not gated \(`sdd_auto: false`\)$/m);
  // Nor that the lifecycle runs the init: under `sdd_auto: false` nothing does.
  assert.doesNotMatch(off, /init is run/);
  const yours = off.slice(off.indexOf('## Yours'));
  assert.match(yours, /^- the `speckit` init, in the brain when its `\.specify` is missing — not run \(`sdd_auto: false`\)$/m);
});

test("an unprovable step carries the adapter's own reason, verbatim", async () => {
  const { cfg } = await eco(DECLARED);
  const page = renderFlow(cfg);
  // Copied from the registry entry, not re-worded here: a paraphrase would age
  // beside its source.
  assert.match(page, /STRICTLY READ-ONLY by its own spec/);
  assert.match(page, /the agent grading its own homework/);
  assert.match(page, /invisible to the filesystem/);
});

// MV-147: an ungateable row leads with the command the step runs. opsx's apply
// run names `change apply` first and openspec's own verb after it, so the row
// takes the first backticked command whose first word is a required binary;
// spec-kit's runs hold no backtick and keep their chat command.
test('the ungateable verb is the first backticked command of a required binary', async () => {
  const { cfg } = await eco(DECLARED);
  const yours = (page: string): string => page.slice(page.indexOf('## Yours'));
  const opsx = yours(renderFlow({ ...cfg, sdd: 'opsx' }));
  assert.match(
    opsx,
    /^- `openspec instructions apply --change <slug> --json` — apply leaves no artifact of its own — its only trace is `- \[x\]` in tasks\.md/m,
  );
  assert.doesNotMatch(opsx, /^- `change apply` — /m);
  // A step's guide is the lifecycle's, printed where the step comes up; the
  // page carries none (MV-147).
  const page = renderFlow({ ...cfg, sdd: 'opsx' });
  const guides = (sddSpec('opsx')!.steps ?? []).flatMap((s) => (s.guide ? [s.guide] : []));
  assert.ok(guides.length > 0, 'opsx carries at least one guide');
  for (const g of guides) assert.ok(!page.includes(g), `flow.md carries a guide: ${g}`);
  const speckit = yours(renderFlow(cfg));
  for (const verb of ['/speckit.analyze', '/speckit.implement', '/speckit.converge']) {
    assert.ok(speckit.includes(`\n- \`${verb}\` — `), `${verb} names its row`);
  }
});

test('a brain with nothing declared still gets a useful page', async () => {
  const { cfg } = await eco(['doors: [agents]', 'repos:', '  api: ../acme-api']);
  const page = renderFlow(cfg);
  assert.match(page, /## Gate — multivac refuses without it/);
  assert.match(page, /`change close` refuses while a declared claim does not resolve/);
  assert.match(page, /no SDD tool is declared/);
  assert.match(page, /no grapher is declared/);
});

test('an unverified adapter is named as declared-but-unknown, never guessed', async () => {
  const { cfg } = await eco([
    'doors: [agents]', 'grapher: acme-graph', 'repos:', '  api: ../acme-api',
  ]);
  const page = renderFlow(cfg);
  assert.match(page, /`acme-graph` is declared as the grapher but/);
  // Nothing invented.
  assert.equal(page.includes('refuses without `specs/'), false);
  // MV-146: an SDD name the registry does not know never reaches the page — no
  // scaffold, gate or step could honour it, so the config is refused at load.
  await assert.rejects(
    () => eco(['doors: [agents]', 'sdd: acme-not-real', 'grapher: acme-graph', 'repos:', '  api: ../acme-api']),
    /sdd: acme-not-real — REFUSED: no SDD adapter is named acme-not-real/,
  );
});

// --- US2: derived, and saying so ---

test('the page carries no invariant identifier', async () => {
  // The failure the first design would have shipped. Ids are per-brain; a
  // generated one is wrong everywhere but here.
  for (const lines of [DECLARED, ['doors: [agents]', 'repos:', '  api: ../acme-api']]) {
    const { cfg } = await eco(lines);
    assert.equal(/\bMV-\d+\b/.test(renderFlow(cfg)), false, 'an identifier reached the page');
  }
});

test('it says it is generated, what regenerates it, and that it binds nothing', async () => {
  const { cfg } = await eco(DECLARED);
  const page = renderFlow(cfg);
  assert.match(page, /Generated by `multivac doors`/);
  assert.match(page, /\*\*This page binds nothing\*\*/);
  assert.match(page, /the law in `\.multivac\/invariants\.md` binds/);
});

test('changing a declaration changes the page, with no hand editing', async () => {
  const a = await eco(DECLARED);
  const b = await eco(['doors: [agents]', 'repos:', '  api: ../acme-api']);
  assert.notEqual(renderFlow(a.cfg), renderFlow(b.cfg));
});

test('writing outside the managed block survives regeneration', async () => {
  const { brain } = await eco(DECLARED);
  const ctx = { cwd: brain };
  await quiet(() => doorsCommand.run([], ctx));
  const file = join(brain, FLOW_PATH);
  writeFileSync(file, `${readFileSync(file, 'utf8')}\n\n## Ours\n\nHand-written, and it stays.\n`);
  await quiet(() => doorsCommand.run([], ctx));
  const after = readFileSync(file, 'utf8');
  assert.match(after, /## Ours\n\nHand-written, and it stays\./);
  assert.match(after, /## Gate — multivac refuses without it/);
});
