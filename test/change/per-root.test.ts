// MV-122: every surface resolves an adapter PER ROOT, through one function.
//
// Twelve functions used to answer "which adapter applies here" for
// themselves. The gate and the printed steps read only the ecosystem's `sdd:`,
// an opted-out repo still proved a step, and the brain ignored its own entry.
// Each test below is one of those measurements, run in a scratch ecosystem.
//
// MV-146: for the SDD, per root is the brain alone. A code repo's `sdd:` takes
// only `none`; the per-repo SDD configs these tests used to run are refused at
// load now, and the tests below say so through the command a human would run.
//
// Tools are STUBS on a PATH this file builds — `<bin>:/usr/bin:/bin` — never
// the host's: a developer's real spec-kit must not change what these tests
// say (Principle IV).
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
import { main } from '../../src/cli.js';
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

// --- US1: the SDD gate and its steps follow the brain; a code repo's tool is refused ---

/**
 * Every command a per-repo SDD config used to run, and its exit now: 2 from
 * the load, except `doors` and `doctor`, which keep their documented exit 1
 * over a config they cannot load — `doctor` reports it on its `config` line.
 */
async function refusedEverywhere(lines: string[], want: RegExp): Promise<void> {
  const { brain } = eco(lines);
  for (const argv of [['change', 'new', 'per-a', 'Per a'], ['change', 'plan', 'per-a'], ['verify'], ['repos', 'sync'], ['doors'], ['doctor'], ['init', '.']]) {
    const c = await capture(() => main(argv, brain));
    // `doctor`, `doors` and `init` (MV-114) exit 1 on any config they cannot load.
    assert.equal(c.code, ['doors', 'doctor', 'init'].includes(argv[0]) ? 1 : 2, `${argv.join(' ')}: ${c.out}`);
    const body = want.source.replace(/^\^/, '');
    const line = argv[0] === 'doctor' ? new RegExp(`^config +invalid — ${body}`, 'm') : argv[0] === 'init' ? new RegExp(`^init: ${body}`, 'm') : want;
    assert.match(c.out, line, argv.join(' '));
    assert.match(c.out, /then open a change for the config edit: `multivac change new <slug>`/);
  }
  assert.equal(existsSync(join(brain, '.multivac/changes/per-a.md')), false, 'nothing ran over a refused config');
}

test('a per-repo sdd naming a tool is refused at load, by every command, naming the key — MV-146', async () => {
  // No ecosystem sdd: the repo's tool would run nowhere.
  await refusedEverywhere(
    ['doors: [agents]', 'repos:', '  api: ../acme-api', '  web:', '    path: ../acme-web', '    sdd: speckit'],
    /^repos\.web\.sdd: speckit — REFUSED: the SDD lives in the brain alone, so a code repo's sdd: takes only none/m,
  );
  // Mixed adapters: the brain's opsx and the repo's speckit.
  await refusedEverywhere(
    ['doors: [agents]', 'sdd: opsx', 'repos:', '  api: ../acme-api', '  web:', '    path: ../acme-web', '    sdd: speckit'],
    /^repos\.web\.sdd: speckit — REFUSED/m,
  );
  // A top-level none under a repo's own tool.
  await refusedEverywhere(
    ['doors: [agents]', 'sdd: none', 'repos:', '  api: ../acme-api', '  web:', '    path: ../acme-web', '    sdd: speckit'],
    /^repos\.web\.sdd: speckit — REFUSED/m,
  );
  // A repo that is declared and never cloned: refused on the declaration, not on disk.
  await refusedEverywhere(
    ['doors: [agents]', 'sdd: none', 'repos:', '  web:', '    path: ../acme-not-cloned', '    sdd: speckit'],
    /^repos\.web\.sdd: speckit — REFUSED/m,
  );
});

test("a brain whose own entry opts out of the ecosystem's sdd is refused: the tool resolves in no root — MV-146", async () => {
  await refusedEverywhere(
    ['doors: [agents]', 'sdd: speckit', 'repos:', '  brain:', '    path: .', '    sdd: none', '  api: ../acme-api'],
    /^sdd: speckit — REFUSED: the brain's own entry repos\.brain\.sdd says none, so speckit resolves in no root\. Fix: make them agree/m,
  );
});

test('a top-level sdd gates plan in the brain alone, and prints its steps at change new', async () => {
  const { brain, api, web, ctx } = eco(['doors: [agents]', 'sdd: speckit', 'repos:', '  api: ../acme-api', '  web: ../acme-web']);
  // Installed in the brain, where it runs: this is about the steps and the gate.
  write(brain, '.specify/integration.json', SPECKIT_INTEGRATION_JSON);
  // A spec left in a code repo proves nothing: the SDD does not run there.
  write(web, 'specs/001-per-b/spec.md', '# A spec in a code repo\n');
  const n = await capture(() => change.run(['new', 'per-b', 'Per b'], ctx));
  assert.match(n.out, /sdd speckit: run \/speckit\.specify in your agent to write the spec for per-b/);
  assert.doesNotMatch(n.out, /@ (api|web)/);
  const c = await capture(() => change.run(['plan', 'per-b'], ctx));
  assert.equal(c.code, 1);
  assert.match(c.out, /sdd speckit: `change plan per-b` refused — specs\/<n>-per-b\/spec\.md is missing — looked in brain$/m);
  assert.doesNotMatch(c.out, /web: specs\/001-per-b\/spec\.md ok/);
  assert.equal(existsSync(join(api, '.specify')), false, 'nothing was scaffolded in a code repo');
});

test('a config naming only top-level adapters renders no roots anywhere', async () => {
  const { brain } = eco([
    'doors: [agents]',
    'sdd: speckit',
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

// --- US2: `none` is a token ---

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
  // MV-146: the SDD runs in the brain alone, so the brain is where it looked.
  assert.match(c.out, /specs\/<n>-opted\/spec\.md is missing — looked in brain$/m);
  assert.doesNotMatch(c.out, /web: specs\/001-opted\/spec\.md ok/);
});

test('a top-level none names no `none` anywhere, and flow.md says nothing applies', async () => {
  const { brain } = eco([
    'doors: [agents]',
    'sdd: none',
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
  assert.doesNotMatch(page, /graph/);
  assert.equal(page.includes('`none`'), false);
});
