// MV-103: a declared grapher's artifact is part of the repository it
// describes, not part of one checkout of it. `change close` refuses while a
// root's graph is not in its committed HEAD, or is ignored — and multivac still
// stages nothing, which is the assertion at the bottom of this file. Staged is
// not committed (MV-124): a clone gets HEAD, never somebody's index.
//
// The graphers here are DECLARED, never installed: `true` is a refresh that
// succeeds and writes nothing, so the fixture decides what is on disk.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gitInit, makeScratchEcosystem } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { doctorReport } from '../../src/commands/doctor.js';
import { graphTrackedGate } from '../../src/adapters/tracked.js';
import { loadConfig } from '../../src/lib/config.js';

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

function ecosystem(cfgExtra: string[] = []): { brain: string; ctx: { cwd: string }; slug: string } {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-gtrack-'));
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
      ...cfgExtra,
      'repos:',
      '  api: ../acme-api',
      '  web: ../acme-web',
      '',
    ].join('\n'),
  );
  return { brain: eco.brain, ctx: { cwd: eco.brain }, slug: 'points-expire' };
}

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

/** Write the artifact, then leave it only in the tree, staged, or committed. */
const writeGraph = (dir: string, { to }: { to: 'tree' | 'index' | 'head' }): void => {
  mkdirSync(join(dir, 'graph-out'), { recursive: true });
  writeFileSync(join(dir, 'graph-out/graph.json'), '{}\n');
  if (to === 'tree') return;
  execFileSync('git', ['-C', dir, 'add', 'graph-out/graph.json']);
  if (to === 'index') return;
  execFileSync('git', ['-C', dir, 'commit', '-qm', 'chore: commit the graph']);
};

const roots = (brain: string): string[] => [brain, join(brain, '../acme-api'), join(brain, '../acme-web')];

const staged = (dir: string): string =>
  execFileSync('git', ['-C', dir, 'diff', '--cached', '--name-only'], { encoding: 'utf8' });

const head = (dir: string): string => execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' });

// --- US1: not committed is refused ---

test('close refuses while a root has not committed its graph, naming the commands', async () => {
  const { brain, ctx, slug } = ecosystem();
  await readyToClose(brain, ctx, slug);
  for (const d of roots(brain)) writeGraph(d, { to: 'tree' });

  const c = await capture(() => change.run(['close', slug], ctx));

  assert.equal(c.code, 1);
  assert.match(c.out, /refused — 3 roots keep their graph out of the repository/);
  assert.match(c.out, /brain: graph-out\/graph\.json is not committed — `git -C .* add graph-out\/graph\.json && git -C .* commit -m "chore: commit the graph" -- graph-out\/graph\.json`/);
  assert.match(c.out, /a graph only one checkout has is a graph the next clone does not have/);
});

test('close proceeds once the graph is committed', async () => {
  const { brain, ctx, slug } = ecosystem();
  await readyToClose(brain, ctx, slug);
  for (const d of roots(brain)) writeGraph(d, { to: 'head' });

  const c = await capture(() => change.run(['close', slug], ctx));

  assert.equal(c.code, 0, c.out);
  assert.equal(c.out.includes('out of the repository'), false);
});

test('every offending root lands in one refusal', async () => {
  const { brain, ctx, slug } = ecosystem();
  await readyToClose(brain, ctx, slug);
  writeGraph(brain, { to: 'head' });
  writeGraph(join(brain, '../acme-api'), { to: 'tree' });
  writeGraph(join(brain, '../acme-web'), { to: 'tree' });

  const c = await capture(() => change.run(['close', slug], ctx));

  assert.equal(c.code, 1);
  assert.match(c.out, /refused — 2 roots keep their graph out of the repository/);
  assert.match(c.out, /api: graph-out\/graph\.json is not committed — `git -C .* add graph-out\/graph\.json && git -C .* commit/);
  assert.match(c.out, /web: graph-out\/graph\.json is not committed/);
  assert.equal(/brain: graph-out/.test(c.out), false);
});

test('a graph staged and never committed is refused, and the refusal touches no index and no HEAD', async () => {
  // The measured defect (audit C22): `git add` alone passed this gate, and a
  // clone of that commit had no graph.
  const { brain, ctx, slug } = ecosystem();
  await readyToClose(brain, ctx, slug);
  for (const d of roots(brain)) writeGraph(d, { to: 'index' });
  const before = roots(brain).map((d) => [staged(d), head(d)]);

  const c = await capture(() => change.run(['close', slug], ctx));
  const { lines } = await doctorReport(brain);

  assert.equal(c.code, 1);
  assert.match(c.out, /brain: graph-out\/graph\.json is not committed/);
  assert.match(lines.join('\n'), /grapher.*NOT COMMITTED → `git -C .* add graph-out\/graph\.json`, then commit it/);
  assert.deepEqual(roots(brain).map((d) => [staged(d), head(d)]), before);
});

test('a committed graph changed in the working tree still passes: freshness is not this gate', async () => {
  const { brain, ctx, slug } = ecosystem();
  await readyToClose(brain, ctx, slug);
  for (const d of roots(brain)) {
    writeGraph(d, { to: 'head' });
    appendFileSync(join(d, 'graph-out/graph.json'), '\n');
  }
  const c = await capture(() => change.run(['close', slug], ctx));
  assert.equal(c.code, 0, c.out);
  assert.equal(c.out.includes('out of the repository'), false);
});

test('a repo with no commit yet has committed no graph', async () => {
  const { brain } = ecosystem();
  const api = join(brain, '../acme-api');
  rmSync(join(api, '.git'), { recursive: true, force: true });
  gitInit(api);
  // api has no HEAD to commit to, so the most it can hold is a staged graph.
  for (const d of roots(brain)) writeGraph(d, { to: d === api ? 'index' : 'head' });
  const gate = await graphTrackedGate(brain, await loadConfig(brain), 'points-expire', false);
  assert.equal(gate.ok, false);
  assert.match(gate.lines.join('\n'), /api: graph-out\/graph\.json is not committed/);
  assert.doesNotMatch(gate.lines.join('\n'), /(brain|web): graph-out/);
});

// --- US2: ignored names the rule, because `git add` will not fix it ---

test('an ignored graph is reported as ignored, with the rule named first', async () => {
  const { brain, ctx, slug } = ecosystem();
  await readyToClose(brain, ctx, slug);
  for (const d of roots(brain)) writeGraph(d, { to: 'tree' });
  appendFileSync(join(brain, '.gitignore'), 'graph-out/\n');

  const c = await capture(() => change.run(['close', slug], ctx));

  assert.equal(c.code, 1);
  assert.match(c.out, /brain: graph-out\/graph\.json is ignored by \.gitignore — remove the rule, then `git -C .* add/);
  // The other two are plain uncommitted: one message per cause, not per root.
  assert.match(c.out, /api: graph-out\/graph\.json is not committed — `git -C .* add graph-out\/graph\.json && git -C .* commit/);
});

// --- boundaries ---

test('a missing artifact is the graph gate refusal, never reported as not committed', async () => {
  const { brain, ctx, slug } = ecosystem();
  await readyToClose(brain, ctx, slug);

  const c = await capture(() => change.run(['close', slug], ctx));

  assert.equal(c.code, 1);
  assert.match(c.out, /roots have no graph/);
  assert.equal(c.out.includes('out of the repository'), false);
});

test('both switches skip this gate too', async () => {
  const flag = ecosystem();
  await readyToClose(flag.brain, flag.ctx, flag.slug);
  for (const d of roots(flag.brain)) writeGraph(d, { to: 'tree' });
  const a = await capture(() => change.run(['close', flag.slug, '--no-grapher'], flag.ctx));
  assert.equal(a.out.includes('out of the repository'), false);

  const off = ecosystem(['grapher_auto: false']);
  await readyToClose(off.brain, off.ctx, off.slug);
  for (const d of roots(off.brain)) writeGraph(d, { to: 'tree' });
  const b = await capture(() => change.run(['close', off.slug], off.ctx));
  assert.equal(b.out.includes('out of the repository'), false);
});

test('the gate stages nothing — every index is exactly as it was', async () => {
  // MV-50 keeps multivac out of the index, and the obvious implementation of
  // this feature is the one it forbids. The refusal must leave every repo's
  // staging area untouched.
  const { brain, ctx, slug } = ecosystem();
  await readyToClose(brain, ctx, slug);
  for (const d of roots(brain)) writeGraph(d, { to: 'tree' });
  const before = roots(brain).map(staged);

  assert.equal((await capture(() => change.run(['close', slug], ctx))).code, 1);

  assert.deepEqual(roots(brain).map(staged), before);
  for (const d of roots(brain)) {
    assert.equal(staged(d).includes('graph-out'), false, `${d} had the graph staged for it`);
  }
});

// --- the report says the same thing, without closing anything ---

test('doctor names an uncommitted graph and the commands that commit it', async () => {
  const { brain } = ecosystem();
  writeGraph(brain, { to: 'tree' });

  const { lines, exit } = await doctorReport(brain);

  assert.match(lines.join('\n'), /grapher.*NOT COMMITTED → `git -C .* add graph-out\/graph\.json`, then commit it/);
  // doctor reports, it never gates: this state is not an exit code.
  assert.equal(exit, 0);
});

test('doctor says IGNORED where a rule is what blocks it', async () => {
  const { brain } = ecosystem();
  writeGraph(brain, { to: 'tree' });
  appendFileSync(join(brain, '.gitignore'), 'graph-out/\n');

  const { lines } = await doctorReport(brain);

  assert.match(lines.join('\n'), /grapher.*IGNORED by \.gitignore → remove the rule/);
});

test('doctor says nothing extra once the graph is committed', async () => {
  const { brain } = ecosystem();
  writeGraph(brain, { to: 'head' });

  const { lines } = await doctorReport(brain);

  const graphLines = lines.filter((l) => l.includes('grapher'));
  assert.equal(graphLines.join('\n').includes('NOT COMMITTED'), false);
  assert.equal(graphLines.join('\n').includes('IGNORED'), false);
});
