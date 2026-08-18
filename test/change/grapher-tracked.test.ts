// MV-103: a declared grapher's artifact is part of the repository it
// describes, not part of one checkout of it. `change close` refuses while a
// root keeps its graph untracked or ignored — and multivac still stages
// nothing, which is the assertion at the bottom of this file.
//
// The graphers here are DECLARED, never installed: `true` is a refresh that
// succeeds and writes nothing, so the fixture decides what is on disk.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { doctorReport } from '../../src/commands/doctor.js';

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

/** Write the artifact and leave it exactly as untracked as asked. */
const writeGraph = (dir: string, { track }: { track: boolean }): void => {
  mkdirSync(join(dir, 'graph-out'), { recursive: true });
  writeFileSync(join(dir, 'graph-out/graph.json'), '{}\n');
  if (!track) return;
  execFileSync('git', ['-C', dir, 'add', 'graph-out/graph.json']);
  execFileSync('git', ['-C', dir, 'commit', '-qm', 'chore: track the graph']);
};

const roots = (brain: string): string[] => [brain, join(brain, '../acme-api'), join(brain, '../acme-web')];

const staged = (dir: string): string =>
  execFileSync('git', ['-C', dir, 'diff', '--cached', '--name-only'], { encoding: 'utf8' });

// --- US1: untracked is refused ---

test('close refuses while a root keeps its graph untracked, naming the command', async () => {
  const { brain, ctx, slug } = ecosystem();
  await readyToClose(brain, ctx, slug);
  for (const d of roots(brain)) writeGraph(d, { track: false });

  const c = await capture(() => change.run(['close', slug], ctx));

  assert.equal(c.code, 1);
  assert.match(c.out, /refused — 3 roots keep their graph out of the repository/);
  assert.match(c.out, /brain: graph-out\/graph\.json is untracked — `git -C .* add graph-out\/graph\.json`/);
  assert.match(c.out, /a graph only one checkout has is a graph the next clone does not have/);
});

test('close proceeds once the graph is tracked', async () => {
  const { brain, ctx, slug } = ecosystem();
  await readyToClose(brain, ctx, slug);
  for (const d of roots(brain)) writeGraph(d, { track: true });

  const c = await capture(() => change.run(['close', slug], ctx));

  assert.equal(c.out.includes('out of the repository'), false);
});

test('every offending root lands in one refusal', async () => {
  const { brain, ctx, slug } = ecosystem();
  await readyToClose(brain, ctx, slug);
  writeGraph(brain, { track: true });
  writeGraph(join(brain, '../acme-api'), { track: false });
  writeGraph(join(brain, '../acme-web'), { track: false });

  const c = await capture(() => change.run(['close', slug], ctx));

  assert.equal(c.code, 1);
  assert.match(c.out, /refused — 2 roots keep their graph out of the repository/);
  assert.match(c.out, /api: graph-out\/graph\.json is untracked/);
  assert.match(c.out, /web: graph-out\/graph\.json is untracked/);
  assert.equal(/brain: graph-out/.test(c.out), false);
});

// --- US2: ignored names the rule, because `git add` will not fix it ---

test('an ignored graph is reported as ignored, with the rule named first', async () => {
  const { brain, ctx, slug } = ecosystem();
  await readyToClose(brain, ctx, slug);
  for (const d of roots(brain)) writeGraph(d, { track: false });
  appendFileSync(join(brain, '.gitignore'), 'graph-out/\n');

  const c = await capture(() => change.run(['close', slug], ctx));

  assert.equal(c.code, 1);
  assert.match(c.out, /brain: graph-out\/graph\.json is ignored by \.gitignore — remove the rule, then `git -C .* add/);
  // The other two are plain untracked: one message per cause, not per root.
  assert.match(c.out, /api: graph-out\/graph\.json is untracked/);
});

// --- boundaries ---

test('a missing artifact is the graph gate refusal, never reported as untracked', async () => {
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
  for (const d of roots(flag.brain)) writeGraph(d, { track: false });
  const a = await capture(() => change.run(['close', flag.slug, '--no-grapher'], flag.ctx));
  assert.equal(a.out.includes('out of the repository'), false);

  const off = ecosystem(['grapher_auto: false']);
  await readyToClose(off.brain, off.ctx, off.slug);
  for (const d of roots(off.brain)) writeGraph(d, { track: false });
  const b = await capture(() => change.run(['close', off.slug], off.ctx));
  assert.equal(b.out.includes('out of the repository'), false);
});

test('the gate stages nothing — every index is exactly as it was', async () => {
  // MV-50 keeps multivac out of the index, and the obvious implementation of
  // this feature is the one it forbids. The refusal must leave every repo's
  // staging area untouched.
  const { brain, ctx, slug } = ecosystem();
  await readyToClose(brain, ctx, slug);
  for (const d of roots(brain)) writeGraph(d, { track: false });
  const before = roots(brain).map(staged);

  assert.equal((await capture(() => change.run(['close', slug], ctx))).code, 1);

  assert.deepEqual(roots(brain).map(staged), before);
  for (const d of roots(brain)) {
    assert.equal(staged(d).includes('graph-out'), false, `${d} had the graph staged for it`);
  }
});

// --- the report says the same thing, without closing anything ---

test('doctor names an untracked graph and the command that tracks it', async () => {
  const { brain } = ecosystem();
  writeGraph(brain, { track: false });

  const { lines, exit } = await doctorReport(brain);

  assert.match(lines.join('\n'), /grapher.*UNTRACKED → `git -C .* add graph-out\/graph\.json`/);
  // doctor reports, it never gates: this state is not an exit code.
  assert.equal(exit, 0);
});

test('doctor says IGNORED where a rule is what blocks it', async () => {
  const { brain } = ecosystem();
  writeGraph(brain, { track: false });
  appendFileSync(join(brain, '.gitignore'), 'graph-out/\n');

  const { lines } = await doctorReport(brain);

  assert.match(lines.join('\n'), /grapher.*IGNORED by \.gitignore → remove the rule/);
});

test('doctor says nothing extra once the graph is tracked', async () => {
  const { brain } = ecosystem();
  writeGraph(brain, { track: true });

  const { lines } = await doctorReport(brain);

  const graphLines = lines.filter((l) => l.includes('grapher'));
  assert.equal(graphLines.join('\n').includes('UNTRACKED'), false);
  assert.equal(graphLines.join('\n').includes('IGNORED'), false);
});
