// `change close` runs the declared grapher's refresh — for real. A fake
// grapher binary on PATH touches the artifact; close reports the run and the
// artifact changed and stays uncommitted (graph output lands only in
// dedicated chore commits). An absent binary degrades to the install notice,
// and a grapher that exits non-zero never fails the close.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmdirSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initRepo } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { loadChange, saveChange } from '../../src/change/file.js';
import { GRAPH_LOCK } from '../../src/doors/settings.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();

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

/**
 * `fakegraph` is not in the registry, so its contract has to be STATED —
 * which is the point: an unknown tool is usable without a merge request, and
 * multivac never derives one of these lines from the name.
 */
const DECL =
  'graphers:\n' +
  '  fakegraph:\n' +
  '    artifact: fakegraph-out/graph.json\n' +
  '    refresh: fakegraph update .\n' +
  '    install: npm i -g fakegraph\n';

/** Brain==code repo declaring the fake grapher, artifact committed. */
function makeBrain(tmp: string, config = `doors: [agents]\ngrapher: fakegraph\n${DECL}repos:\n  brain: .\n`): string {
  const brain = join(tmp, 'acme-brain');
  initRepo(brain, {
    'AGENTS.md': '# door\n',
    '.multivac/config.yml': config,
    '.multivac/invariants.md':
      '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n',
    'fakegraph-out/graph.json': '{"nodes":0}\n',
  });
  return brain;
}

/** A fake `fakegraph` binary: `fakegraph update .` appends to the artifact. */
function makeGrapherBin(tmp: string, script: string): string {
  const bin = join(tmp, 'bin');
  mkdirSync(bin, { recursive: true });
  const file = join(bin, 'fakegraph');
  writeFileSync(file, script);
  chmodSync(file, 0o755);
  return bin;
}

/** Walk one change to the brink of close: new, declare brain, apply, land. */
async function landedChange(brain: string, slug: string): Promise<void> {
  const ctx = { cwd: brain };
  assert.equal(await change.run(['new', slug, `Graph check ${slug}`], ctx), 0);
  const parsed = await loadChange(brain, slug);
  parsed.change.repos = { brain: { status: 'planned' } };
  parsed.change.landing_order = [['brain']];
  parsed.change.invariants.adds = [];
  await saveChange(brain, parsed);
  assert.equal(await change.run(['apply', slug], ctx), 0);
  assert.equal(await change.run(['land', slug, '--landed', 'brain'], ctx), 0);
}

/** Run `fn` with the fake grapher's bin dir prepended to PATH. */
const withPath = async (dir: string, fn: () => Promise<void>): Promise<void> => {
  const orig = process.env.PATH ?? '';
  process.env.PATH = `${dir}:${orig}`;
  try {
    await fn();
  } finally {
    process.env.PATH = orig;
  }
};

test('close runs the grapher refresh: artifact changed and stays uncommitted', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-graph-'));
  const brain = makeBrain(tmp);
  const bin = makeGrapherBin(tmp, '#!/bin/sh\necho refreshed >> fakegraph-out/graph.json\n');
  await landedChange(brain, 'graph-run');
  const before = readFileSync(join(brain, 'fakegraph-out/graph.json'), 'utf8');
  await withPath(bin, async () => {
    const { code, out } = await capture(() => change.run(['close', 'graph-run'], { cwd: brain }));
    assert.equal(code, 0);
    assert.match(out, /graph fakegraph @ brain: refreshed \(`fakegraph update \.`\) — artifact left uncommitted/);
  });
  const after = readFileSync(join(brain, 'fakegraph-out/graph.json'), 'utf8');
  assert.notEqual(after, before, 'the refresh touched the artifact');
  assert.match(after, /refreshed/);
  // never staged, never committed: git sees the modified artifact in the tree
  assert.match(git(brain, 'status', '--porcelain'), /^ M fakegraph-out\/graph\.json$/m);
  const lastCommit = git(brain, 'show', '--stat', '--name-only', '--format=', 'HEAD');
  assert.ok(!lastCommit.includes('fakegraph-out'), 'no commit carries the artifact');
});

test('absent grapher binary degrades to the install notice, close still 0', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-graph-'));
  const brain = makeBrain(tmp);
  await landedChange(brain, 'graph-absent');
  const before = readFileSync(join(brain, 'fakegraph-out/graph.json'), 'utf8');
  // no bin dir on PATH: `fakegraph` is nowhere — declared, absent, degraded
  const { code, out } = await capture(() => change.run(['close', 'graph-absent'], { cwd: brain }));
  assert.equal(code, 0);
  assert.match(out, /graph fakegraph @ brain: binary not found — refresh skipped; npm i -g fakegraph/);
  assert.equal(readFileSync(join(brain, 'fakegraph-out/graph.json'), 'utf8'), before);
});

test('close takes the SAME lock the post-edit hook takes, and waits for it', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-graph-'));
  const brain = makeBrain(tmp);
  // The grapher records the moment it ran, so "after the lock was released"
  // is a fact and not a hope.
  const bin = makeGrapherBin(tmp, '#!/bin/sh\ndate +%s%N > fakegraph-out/ran-at\n');
  await landedChange(brain, 'graph-lock');
  const lock = join(brain, GRAPH_LOCK);
  mkdirSync(lock, { recursive: true }); // an in-flight hook refresh holds it
  let released = 0n;
  setTimeout(() => {
    released = BigInt(Date.now()) * 1_000_000n;
    rmdirSync(lock);
  }, 700);
  await withPath(bin, async () => {
    const { code, out } = await capture(() => change.run(['close', 'graph-lock'], { cwd: brain }));
    assert.equal(code, 0);
    assert.match(out, /refreshed \(`fakegraph update \.`\)/);
  });
  // It WAITED — did not skip (the artifact was rewritten) and did not race
  // (it ran only after the other holder let go).
  const ranAt = BigInt(readFileSync(join(brain, 'fakegraph-out/ran-at'), 'utf8').trim());
  assert.ok(released > 0n, 'the holder released before close finished');
  assert.ok(ranAt > released, `refresh ran at ${ranAt}, lock released at ${released}`);
  // And it cleaned up after itself: the next hook must not find a stale lock.
  assert.equal(existsSync(lock), false);
});

test('an unverified grapher refuses at close: fields to declare, nothing run', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-graph-'));
  // Declared by name only — no registry entry, no `graphers:` block.
  const brain = makeBrain(tmp, 'doors: [agents]\ngrapher: fakegraph\nrepos:\n  brain: .\n');
  const bin = makeGrapherBin(tmp, '#!/bin/sh\necho refreshed >> fakegraph-out/graph.json\n');
  await landedChange(brain, 'graph-unknown');
  const before = readFileSync(join(brain, 'fakegraph-out/graph.json'), 'utf8');
  await withPath(bin, async () => {
    const { code, out } = await capture(() =>
      change.run(['close', 'graph-unknown'], { cwd: brain }),
    );
    assert.equal(code, 0); // a refusal to guess never fails the close
    assert.match(out, /fakegraph" is not verified/);
    assert.match(out, /graphers:/);
    // The invented contract is gone: nothing named it, nothing ran it.
    assert.doesNotMatch(out, /npm i -g fakegraph/);
    assert.doesNotMatch(out, /refreshed \(/);
  });
  assert.equal(readFileSync(join(brain, 'fakegraph-out/graph.json'), 'utf8'), before);
});

test('a grapher that exits non-zero is a warning, never a failed close', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-graph-'));
  const brain = makeBrain(tmp);
  // Writes its cause where a real tool writes it — depcruise's ENOENT, a
  // parse error — and exits 1. What comes back must be THAT, not node's
  // `Command failed: fakegraph update .`, which repeats a command the same
  // warning prints again two clauses later.
  const bin = makeGrapherBin(
    tmp,
    '#!/bin/sh\necho >&2\necho "  ERROR: cannot write out/graph.json: ENOENT" >&2\nexit 1\n',
  );
  await landedChange(brain, 'graph-fail');
  await withPath(bin, async () => {
    const { code, out } = await capture(() => change.run(['close', 'graph-fail'], { cwd: brain }));
    assert.equal(code, 0);
    assert.match(out, /graph fakegraph @ brain: refresh failed .*— run `fakegraph update \.` there by hand/);
    assert.match(out, /ERROR: cannot write out\/graph\.json: ENOENT/);
    assert.doesNotMatch(out, /Command failed/);
  });
  // the close went through: the change is archived despite the failing tool
  assert.match(
    readFileSync(join(brain, '.multivac/changes/archive/graph-fail.md'), 'utf8'),
    /status: archived/,
  );
});
