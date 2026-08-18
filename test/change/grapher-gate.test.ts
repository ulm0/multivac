// MV-90: a declared grapher leaves a graph in every declared, present root, or
// `change close` refuses. The graphers here are DECLARED (graphers: in the
// config), never a tool that has to be installed on the host: `true` is the
// refresh that succeeds and writes nothing, so a root stays ungraphed with the
// binary present — the exact state the gate exists to catch.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { doorsCommand } from '../../src/commands/doors.js';
import { loadConfig } from '../../src/lib/config.js';
import { renderConsumerDoor } from '../../src/doors/consumer.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

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

/** A brain with two declared repos and a declared grapher, ready to close. */
function ecosystem(cfgExtra: string[], repoExtra: string[] = []): { brain: string; ctx: { cwd: string }; slug: string } {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-ggate-'));
  const eco = makeScratchEcosystem(tmp);
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    [
      'doors: [agents]',
      'graphers:',
      '  writes-nothing:',
      '    artifact: graph-out/graph.json',
      '    refresh: "true"',        // succeeds, writes nothing: the root stays ungraphed
      '  never-installed:',
      '    artifact: graph-out/graph.json',
      '    refresh: mvac-no-such-binary build',
      '    install: install it however that tool says',
      ...cfgExtra,
      'repos:',
      '  api: ../acme-api',
      '  web: ../acme-web',
      ...repoExtra,
      '',
    ].join('\n'),
  );
  return { brain: eco.brain, ctx: { cwd: eco.brain }, slug: 'points-expire' };
}

/** Open a change, declare both repos landed, and stop just before close. */
async function readyToClose(brain: string, ctx: { cwd: string }, slug: string): Promise<void> {
  await capture(() => change.run(['new', slug, 'Points expire'], ctx));
  const file = join(brain, '.multivac/changes', `${slug}.md`);
  const text = readFileSync(file, 'utf8');
  writeFileSync(
    file,
    text
      .replace('repos: {}', 'repos:\n  api:\n    status: landed\n  web:\n    status: landed')
      .replace('landing_order: []', 'landing_order:\n  - - api\n    - web'),
  );
}

// Written AND tracked: MV-103 makes an untracked graph its own refusal, so a
// fixture that only writes the file would be testing this gate through the
// next one.
const graph = (dir: string): void => {
  mkdirSync(join(dir, 'graph-out'), { recursive: true });
  writeFileSync(join(dir, 'graph-out/graph.json'), '{}\n');
  execFileSync('git', ['-C', dir, 'add', 'graph-out/graph.json']);
  execFileSync('git', ['-C', dir, 'commit', '-qm', 'chore: track the graph']);
};

// --- US1: the gate ---

test('close refuses while declared roots have no graph, naming every one at once', async () => {
  const { brain, ctx, slug } = ecosystem(['grapher: writes-nothing']);
  await readyToClose(brain, ctx, slug);
  const c = await capture(() => change.run(['close', slug], ctx));
  assert.equal(c.code, 1);
  assert.match(c.out, /graph: `change close points-expire` refused — 3 roots have no graph/);
  for (const scope of ['brain', 'api', 'web']) {
    assert.match(c.out, new RegExp(`  ${scope}: no graph-out/graph\\.json — \`true\` there`));
  }
  assert.match(c.out, /--no-grapher` for one run, `grapher_auto: false`/);
  // Refused means refused: the change is still open and still there.
  assert.ok(existsSync(join(brain, '.multivac/changes', `${slug}.md`)));
});

test('close proceeds when every declared root holds a graph', async () => {
  const { brain, ctx, slug } = ecosystem(['grapher: writes-nothing']);
  await readyToClose(brain, ctx, slug);
  for (const d of [brain, join(brain, '../acme-api'), join(brain, '../acme-web')]) graph(d);
  const c = await capture(() => change.run(['close', slug], ctx));
  assert.equal(c.out.includes('refused — '), false);
});

test('a declared repo that is not on disk is not counted as a gap', async () => {
  const { brain, ctx, slug } = ecosystem(['grapher: writes-nothing'], ['  gone: ../acme-gone']);
  await readyToClose(brain, ctx, slug);
  const c = await capture(() => change.run(['close', slug], ctx));
  assert.equal(c.out.includes('gone:'), false);
});

test('both switches skip the gate and say so', async () => {
  const flag = ecosystem(['grapher: writes-nothing']);
  await readyToClose(flag.brain, flag.ctx, flag.slug);
  const a = await capture(() => change.run(['close', flag.slug, '--no-grapher'], flag.ctx));
  assert.match(a.out, /graph: gate skipped \(--no-grapher\) — a root without a graph will not be reported/);
  assert.equal(a.out.includes('refused — '), false);

  const off = ecosystem(['grapher: writes-nothing', 'grapher_auto: false']);
  await readyToClose(off.brain, off.ctx, off.slug);
  const b = await capture(() => change.run(['close', off.slug], off.ctx));
  assert.match(b.out, /graph: gate off \(grapher_auto: false\)/);
  assert.equal(b.out.includes('refused — '), false);
});

// --- US2: evaluability ---

test('a declared grapher whose binary is absent refuses, naming binary and install hint', async () => {
  const { brain, ctx, slug } = ecosystem(['grapher: never-installed']);
  await readyToClose(brain, ctx, slug);
  const c = await capture(() => change.run(['close', slug], ctx));
  assert.equal(c.code, 1);
  assert.match(c.out, /roots cannot be checked/);
  assert.match(c.out, /`mvac-no-such-binary` is not on PATH — install it however that tool says/);
});

test('an unverified grapher name refuses nothing', async () => {
  const { brain, ctx, slug } = ecosystem(['grapher: acme-not-in-the-registry']);
  await readyToClose(brain, ctx, slug);
  const c = await capture(() => change.run(['close', slug], ctx));
  assert.equal(c.out.includes('refused — '), false);
});

// --- US3: out of scope ---

test('a repo opted out with grapher: none is not a gap', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-ggate-none-'));
  const eco = makeScratchEcosystem(tmp);
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    [
      'doors: [agents]',
      'graphers:',
      '  writes-nothing:',
      '    artifact: graph-out/graph.json',
      '    refresh: "true"',
      'grapher: writes-nothing',
      'repos:',
      '  api:',
      '    path: ../acme-api',
      '    grapher: none',
      '',
    ].join('\n'),
  );
  const ctx = { cwd: eco.brain };
  await readyToClose(eco.brain, ctx, 'points-expire');
  graph(eco.brain);
  const c = await capture(() => change.run(['close', 'points-expire'], ctx));
  assert.equal(c.out.includes('api: no graph-out'), false);
  assert.equal(c.out.includes('refused — '), false);
});

test('an ecosystem with no grapher declared says nothing about graphs at close', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-ggate-off-'));
  const eco = makeScratchEcosystem(tmp);
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    ['doors: [agents]', 'repos:', '  api: ../acme-api', ''].join('\n'),
  );
  const ctx = { cwd: eco.brain };
  await readyToClose(eco.brain, ctx, 'points-expire');
  const c = await capture(() => change.run(['close', 'points-expire'], ctx));
  assert.equal(/graph[: ]/.test(c.out), false);
});

// --- FR-012: existence, never freshness ---

test('a graph older than every file in the tree still satisfies the gate', async () => {
  const { brain, ctx, slug } = ecosystem(['grapher: writes-nothing']);
  await readyToClose(brain, ctx, slug);
  for (const d of [brain, join(brain, '../acme-api'), join(brain, '../acme-web')]) graph(d);
  // Every source file is newer than the artifact now. That is the state a fresh
  // clone is in, and it must not refuse: this gate asks existence, never currency.
  writeFileSync(join(brain, 'AGENTS.md'), `${readFileSync(join(brain, 'AGENTS.md'), 'utf8')}\n`);
  const c = await capture(() => change.run(['close', slug], ctx));
  assert.equal(c.out.includes('refused — '), false);
});

// --- --abandon stays exempt ---

test('--abandon is exempt: dropping work is not the moment to demand an artifact', async () => {
  const { brain, ctx, slug } = ecosystem(['grapher: writes-nothing']);
  await capture(() => change.run(['new', slug, 'Points expire'], ctx));
  const c = await capture(() => change.run(['close', slug, '--abandon'], ctx));
  assert.equal(c.code, 0);
  assert.equal(c.out.includes('refused — '), false);
});

// --- US4: the consumer door ---

test('a consumer door carries the graph block, resolved per repo', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-ggate-door-'));
  const eco = makeScratchEcosystem(tmp);
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    [
      'doors: [agents]',
      'graphers:',
      '  ecosystem-tool:',
      '    artifact: eco-out/graph.json',
      '    refresh: "true"',
      '  repo-tool:',
      '    artifact: repo-out/graph.json',
      '    refresh: "true"',
      'grapher: ecosystem-tool',
      'repos:',
      '  api: ../acme-api',
      '  web:',
      '    path: ../acme-web',
      '    grapher: repo-tool',
      '',
    ].join('\n'),
  );
  const cfg = await loadConfig(eco.brain);
  // The ecosystem's tool where nothing overrides it...
  const api = renderConsumerDoor(cfg, 'api');
  assert.match(api, /A code graph is kept fresh for you by `ecosystem-tool` at `eco-out\/graph\.json`/);
  // ...and the repo's own where it does.
  const web = renderConsumerDoor(cfg, 'web');
  assert.match(web, /by `repo-tool` at `repo-out\/graph\.json`/);
  assert.equal(web.includes('ecosystem-tool'), false);
});

test('a repo opted out of graphing gets no graph block in its door', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-ggate-door-none-'));
  const eco = makeScratchEcosystem(tmp);
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    [
      'doors: [agents]',
      'graphers:',
      '  t:',
      '    artifact: out/graph.json',
      '    refresh: "true"',
      'grapher: t',
      'repos:',
      '  api:',
      '    path: ../acme-api',
      '    grapher: none',
      '',
    ].join('\n'),
  );
  const cfg = await loadConfig(eco.brain);
  assert.equal(renderConsumerDoor(cfg, 'api').includes('code graph'), false);
  // And the doors command writes that same body into the repo.
  await capture(() => doorsCommand.run([], { cwd: eco.brain }));
  assert.equal(readFileSync(join(eco.repos.api, 'AGENTS.md'), 'utf8').includes('code graph'), false);
});

// --- FR-014: the refresh reaches every declared repo ---

test('close refreshes a declared repo the change never named', async () => {
  const { brain, ctx, slug } = ecosystem(['grapher: writes-nothing']);
  await capture(() => change.run(['new', slug, 'Points expire'], ctx));
  const file = join(brain, '.multivac/changes', `${slug}.md`);
  // Only `api` is declared by the change; `web` is declared by the ECOSYSTEM.
  writeFileSync(
    file,
    readFileSync(file, 'utf8')
      .replace('repos: {}', 'repos:\n  api:\n    status: landed')
      .replace('landing_order: []', 'landing_order:\n  - - api'),
  );
  for (const d of [brain, join(brain, '../acme-api'), join(brain, '../acme-web')]) graph(d);
  const c = await capture(() => change.run(['close', slug], ctx));
  assert.match(c.out, /graph writes-nothing @ web: refreshed/);
});
