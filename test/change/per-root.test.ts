// MV-122: every surface resolves an adapter PER ROOT, through one function.
//
// Twelve functions used to answer "which sdd, which grapher applies here" for
// themselves. The gate and the printed steps read only the ecosystem's `sdd:`,
// an opted-out repo still proved a step, `grapher: none` read as an unverified
// tool, and the brain ignored its own entry. Each test below is one of those
// measurements, run in a scratch ecosystem.
//
// Tools are STUBS on a PATH this file builds — `<bin>:/usr/bin:/bin` — never
// the host's: a developer's real spec-kit or graphify must not change what
// these tests say (Principle IV).
import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { reposCommand } from '../../src/commands/repos.js';
import { loadConfig } from '../../src/lib/config.js';
import { renderFlow } from '../../src/doors/flow.js';
import { sddInstructions } from '../../src/adapters/sdd.js';
import { SPECKIT_INTEGRATION_JSON } from '../helpers/recorded.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const bin = join(mkdtempSync(join(tmpdir(), 'mvac-perroot-bin-')), 'bin');
mkdirSync(bin, { recursive: true });
process.env.PATH = [bin, '/usr/bin', '/bin'].join(delimiter);

/** Stdout AND stderr lines around a command. */
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

/** A brain beside acme-api and acme-web, with exactly this config. */
function eco(lines: string[]): { brain: string; api: string; web: string; ctx: { cwd: string } } {
  const e = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-perroot-')));
  writeFileSync(join(e.brain, '.multivac/config.yml'), [...lines, ''].join('\n'));
  return { brain: e.brain, api: e.repos.api, web: e.repos.web, ctx: { cwd: e.brain } };
}

const write = (root: string, rel: string, body = 'x\n'): void => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), body);
};

// --- US1: the SDD gate and its steps follow each root ---

test('a per-repo sdd with no ecosystem sdd gates plan, looking only where it applies', async () => {
  const { ctx } = eco([
    'doors: [agents]',
    'repos:',
    '  api: ../acme-api',
    '  web:',
    '    path: ../acme-web',
    '    sdd: speckit',
  ]);
  await capture(() => change.run(['new', 'per-a', 'Per a'], ctx));
  const c = await capture(() => change.run(['plan', 'per-a'], ctx));
  assert.equal(c.code, 1, 'a declared sdd no longer turns the gate off');
  assert.match(c.out, /sdd speckit: `change plan per-a` refused — specs\/<n>-per-a\/spec\.md is missing — looked in web$/m);
  assert.match(c.out, /run \/speckit\.specify in your agent/);
});

test('an sdd only an absent repo resolves refuses, naming the root, never a silent pass', async () => {
  const { ctx } = eco([
    'doors: [agents]',
    'sdd: none',
    'repos:',
    '  web:',
    '    path: ../acme-not-cloned',
    '    sdd: speckit',
  ]);
  await capture(() => change.run(['new', 'gone', 'Gone'], ctx));
  const c = await capture(() => change.run(['plan', 'gone'], ctx));
  assert.equal(c.code, 1, 'flow.md says plan refuses without the spec, so it does');
  assert.match(c.out, /sdd speckit: `change plan gone` refused — no root that resolves speckit is on disk: web$/m);
  assert.match(c.out, /multivac repos sync, then re-run: multivac change plan gone/);
});

test('a per-repo sdd prints its steps at change new', async () => {
  const { web, ctx } = eco([
    'doors: [agents]',
    'repos:',
    '  web:',
    '    path: ../acme-web',
    '    sdd: speckit',
  ]);
  // Installed where it applies: this is about the steps, and since MV-129 a
  // spec-kit `change new` would have to run and cannot find is a refusal.
  write(web, '.specify/integration.json', SPECKIT_INTEGRATION_JSON);
  const c = await capture(() => change.run(['new', 'per-b', 'Per b'], ctx));
  assert.match(c.out, /sdd speckit: run \/speckit\.specify in your agent to write the spec for per-b/);
});

test('mixed adapters: each is judged by its own artifacts, in its own roots', async () => {
  const { web, ctx } = eco([
    'doors: [agents]',
    'sdd: opsx',
    'repos:',
    '  api: ../acme-api',
    '  web:',
    '    path: ../acme-web',
    '    sdd: speckit',
  ]);
  await capture(() => change.run(['new', 'mixed', 'Mixed'], ctx));
  write(web, 'specs/001-mixed/spec.md', '# The spec, written\n');
  const c = await capture(() => change.run(['plan', 'mixed'], ctx));
  assert.equal(c.code, 1);
  // opsx asks the brain and api for its proposal, and never web.
  assert.match(c.out, /sdd opsx: `change plan mixed` refused — openspec\/changes\/mixed\/proposal\.md is missing — looked in brain, api$/m);
  // speckit finds web's spec, which the opsx-only gate never looked for.
  assert.match(c.out, /sdd speckit: web: specs\/001-mixed\/spec\.md ok/);
  assert.doesNotMatch(c.out, /sdd opsx: .*web/);
  assert.doesNotMatch(c.out, /sdd speckit: .*(brain|api)/);
  // The --no-sdd hint is said once, however many adapters refused.
  assert.equal(c.out.split('`--no-sdd` skips the SDD gates for one run').length - 1, 1);
});

test('mixed adapters: flow.md and the printed steps name the roots each applies to', async () => {
  const { brain } = eco([
    'doors: [agents]',
    'sdd: opsx',
    'repos:',
    '  api: ../acme-api',
    '  web:',
    '    path: ../acme-web',
    '    sdd: speckit',
  ]);
  const cfg = await loadConfig(brain);
  const page = renderFlow(cfg);
  assert.match(page, /- `change plan` refuses without `openspec\/changes\/<slug>\/proposal\.md` — in brain, api$/m);
  assert.match(page, /- `change plan` refuses without `specs\/<n>-<slug>\/spec\.md` — in web$/m);
  assert.doesNotMatch(page, /no SDD tool is declared/);

  const steps = sddInstructions(cfg, 'new', 'mixed', false);
  assert.ok(steps.some((l) => l.startsWith('sdd opsx @ brain, api: ')), steps.join('\n'));
  assert.ok(steps.some((l) => l.startsWith('sdd speckit @ web: ')), steps.join('\n'));
});

test('a config naming only top-level adapters renders no roots anywhere', async () => {
  const { brain } = eco([
    'doors: [agents]',
    'sdd: speckit',
    'grapher: graphify',
    'repos:',
    '  api: ../acme-api',
    '  web: ../acme-web',
  ]);
  const cfg = await loadConfig(brain);
  for (const at of ['new', 'plan', 'apply'] as const) {
    for (const l of sddInstructions(cfg, at, 'x', false)) {
      assert.ok(l.startsWith('sdd speckit: '), l);
      assert.equal(l.includes('@'), false, l);
    }
  }
  const page = renderFlow(cfg);
  assert.equal(page.includes(' — in '), false);
  assert.equal(page.includes('@'), false);
});

// --- US2: `none` is a token, for both kinds ---

/** A declared grapher whose refresh really writes its artifact, with no host tool. */
const MK_GRAPHER = [
  'graphers:',
  '  mk:',
  '    artifact: g/graph.json',
  '    refresh: "mkdir -p g && touch g/graph.json"',
];

/** Written and committed, so the graph gates pass and close reaches its refresh. */
const trackGraph = (dir: string, rel: string): void => {
  write(dir, rel, '{}\n');
  execFileSync('git', ['-C', dir, 'add', rel]);
  execFileSync('git', ['-C', dir, 'commit', '-qm', 'chore: track the graph']);
};

/** Open a change with api and web landed, stopping just before close. */
async function readyToClose(brain: string, ctx: { cwd: string }, slug: string): Promise<void> {
  await capture(() => change.run(['new', slug, 'Points expire'], ctx));
  const file = join(brain, '.multivac/changes', `${slug}.md`);
  writeFileSync(
    file,
    readFileSync(file, 'utf8')
      .replace('repos: {}', 'repos:\n  api:\n    status: landed\n  web:\n    status: landed')
      .replace('landing_order: []', 'landing_order:\n  - - api\n    - web'),
  );
}

test('a repo with grapher: none is out of scope in doctor, doors and close', async () => {
  const { brain, api, web, ctx } = eco([
    'doors: [agents]',
    ...MK_GRAPHER,
    'grapher: mk',
    'repos:',
    '  api: ../acme-api',
    '  web:',
    '    path: ../acme-web',
    '    grapher: none',
  ]);
  const { doctorReport } = await import('../../src/commands/doctor.js');
  const report = (await doctorReport(brain)).lines.join('\n');
  assert.match(report, /none @ web: no grapher declared for this repo — out of scope, not a gap/);
  assert.doesNotMatch(report, /not verified/);

  const { doorsCommand } = await import('../../src/commands/doors.js');
  const doors = await capture(() => doorsCommand.run([], ctx));
  assert.doesNotMatch(doors.out, /not verified/);

  await readyToClose(brain, ctx, 'none-graph');
  trackGraph(brain, 'g/graph.json');
  trackGraph(api, 'g/graph.json');
  const c = await capture(() => change.run(['close', 'none-graph'], ctx));
  assert.match(c.out, /graph mk @ api: refreshed/, 'close reached its refresh');
  assert.doesNotMatch(c.out, /not verified/);
  assert.doesNotMatch(c.out, /@ web/);
  assert.equal(existsSync(join(web, 'g')), false, 'nothing was built in web');
});

test('a repo with sdd: none proves nothing: its spec does not satisfy plan', async () => {
  const { web, ctx } = eco([
    'doors: [agents]',
    'sdd: speckit',
    'repos:',
    '  api: ../acme-api',
    '  web:',
    '    path: ../acme-web',
    '    sdd: none',
  ]);
  await capture(() => change.run(['new', 'opted', 'Opted'], ctx));
  write(web, 'specs/001-opted/spec.md', '# A spec in the repo that opted out\n');
  const c = await capture(() => change.run(['plan', 'opted'], ctx));
  assert.equal(c.code, 1);
  assert.match(c.out, /specs\/<n>-opted\/spec\.md is missing — looked in brain, api$/m);
  assert.doesNotMatch(c.out, /web: specs\/001-opted\/spec\.md ok/);
});

test('a top-level none names no `none` anywhere, and flow.md says nothing applies', async () => {
  const { brain } = eco([
    'doors: [agents]',
    'sdd: none',
    'grapher: none',
    'repos:',
    '  api: ../acme-api',
    '  web: ../acme-web',
  ]);
  const cfg = await loadConfig(brain);
  const { renderBrainDoor } = await import('../../src/doors/brain.js');
  const { renderConsumerDoor } = await import('../../src/doors/consumer.js');
  for (const door of [renderBrainDoor(cfg, 1), renderConsumerDoor(cfg, 'api'), renderConsumerDoor(cfg, 'web')]) {
    assert.equal(door.includes('`none`'), false, door);
    assert.equal(door.includes('Features gate'), false);
    assert.equal(door.includes('code graph'), false);
  }
  const page = renderFlow(cfg);
  assert.match(page, /no SDD tool is declared/);
  assert.match(page, /no grapher is declared/);
  assert.equal(page.includes('`none`'), false);
});

test("a top-level none under a repo's own adapter: the repo's adapter applies", async () => {
  const { brain, ctx } = eco([
    'doors: [agents]',
    'sdd: none',
    'repos:',
    '  api: ../acme-api',
    '  web:',
    '    path: ../acme-web',
    '    sdd: speckit',
  ]);
  const page = renderFlow(await loadConfig(brain));
  assert.match(page, /- `change plan` refuses without `specs\/<n>-<slug>\/spec\.md` — in web$/m);
  await capture(() => change.run(['new', 'own', 'Own'], ctx));
  const c = await capture(() => change.run(['plan', 'own'], ctx));
  assert.equal(c.code, 1);
  assert.match(c.out, /sdd speckit: `change plan own` refused — specs\/<n>-own\/spec\.md is missing — looked in web$/m);
  assert.doesNotMatch(c.out, /sdd none/);
});

// --- US3: the brain reads its own entry ---

/** Stubs that write what the real tools write, in the directory they run in. */
function stubGraphers(): void {
  const stub = (name: string, script: string): void => {
    writeFileSync(join(bin, name), `#!/bin/sh\n${script}\n`);
    chmodSync(join(bin, name), 0o755);
  };
  stub('graphify', 'mkdir -p graphify-out && echo {} > graphify-out/graph.json');
  stub('codegraph', 'mkdir -p .codegraph && : > .codegraph/codegraph.db');
}

test("the brain's own grapher wins over the ecosystem's everywhere the brain is graphed", async () => {
  stubGraphers();
  const { brain, api, ctx } = eco([
    'doors: [agents]',
    'grapher: graphify',
    'repos:',
    '  brain:',
    '    path: .',
    '    grapher: codegraph',
    '  api: ../acme-api',
  ]);
  const cfg = await loadConfig(brain);
  const { renderBrainDoor } = await import('../../src/doors/brain.js');
  const door = renderBrainDoor(cfg, 1);
  assert.match(door, /kept fresh for you by `codegraph` at `\.codegraph\/codegraph\.db` — refreshed at `change land` and `change close`; it is built in each checkout, so never commit it\./);
  assert.equal(door.includes('graphify'), false);

  const page = renderFlow(cfg);
  assert.match(page, /no `\.codegraph\/codegraph\.db`, refreshed .*at `change close`, in brain$/m);
  assert.match(page, /no `graphify-out\/graph\.json`, refreshed .*at `change close`, in api$/m);

  const { doctorReport } = await import('../../src/commands/doctor.js');
  const report = (await doctorReport(brain)).lines.join('\n');
  assert.match(report, /codegraph @ brain: /);
  assert.match(report, /graphify @ api: /);
  assert.doesNotMatch(report, /graphify @ brain/);

  await capture(() => change.run(['new', 'own-graph', 'Own graph'], ctx));
  // The change names no repo, so `repos sync` builds api (MV-134).
  await capture(() => reposCommand.run(['sync'], ctx));
  const c = await capture(() => change.run(['close', 'own-graph'], ctx));
  assert.ok(existsSync(join(brain, '.codegraph/codegraph.db')), 'the brain was built with its own grapher');
  assert.equal(existsSync(join(brain, 'graphify-out')), false, 'and not with the ecosystem one');
  assert.ok(existsSync(join(api, 'graphify-out/graph.json')));
  // Tracking policy is not asked here: only that nothing judged the brain by graphify's artifact.
  assert.doesNotMatch(c.out, /brain: graphify-out/, 'the gate judged the brain by its own artifact');
});

test('a brain entry grapher with no ecosystem grapher still builds and gates the brain', async () => {
  stubGraphers();
  const { brain, api, ctx } = eco([
    'doors: [agents]',
    'repos:',
    '  brain:',
    '    path: .',
    '    grapher: graphify',
    '  api: ../acme-api',
  ]);
  await capture(() => change.run(['new', 'brain-graph', 'Brain graph'], ctx));
  const c = await capture(() => change.run(['close', 'brain-graph'], ctx));
  assert.ok(existsSync(join(brain, 'graphify-out/graph.json')), 'built where the brain declared it');
  assert.equal(existsSync(join(api, 'graphify-out')), false);
  assert.equal(c.code, 1);
  assert.match(c.out, /brain: graphify-out\/graph\.json is not committed/);
});

test('a brain that opts out of the sdd has no block, while its sibling keeps the steps', async () => {
  const { brain } = eco([
    'doors: [agents]',
    'sdd: speckit',
    'repos:',
    '  brain:',
    '    path: .',
    '    sdd: none',
    '  api: ../acme-api',
  ]);
  const cfg = await loadConfig(brain);
  const { renderBrainDoor } = await import('../../src/doors/brain.js');
  assert.equal(renderBrainDoor(cfg, 1).includes('Features gate'), false);
  const steps = sddInstructions(cfg, 'new', 'x', false);
  assert.ok(steps.length > 0 && steps.every((l) => l.startsWith('sdd speckit: ')), steps.join('\n'));
  assert.match(renderFlow(cfg), /- `change plan` refuses without `specs\/<n>-<slug>\/spec\.md` — in api$/m);
});
