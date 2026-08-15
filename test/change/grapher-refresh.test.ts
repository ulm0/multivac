// `change close` runs the declared grapher's refresh — for real. A fake
// grapher binary on PATH touches the artifact; close reports the run and the
// artifact changed and stays uncommitted (graph output lands only in
// dedicated chore commits). An absent binary degrades to the install notice,
// and a grapher that exits non-zero never fails the close.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initRepo } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { loadChange, saveChange } from '../../src/change/file.js';

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

/** Brain==code repo declaring the fake grapher, artifact committed. */
function makeBrain(tmp: string): string {
  const brain = join(tmp, 'acme-brain');
  initRepo(brain, {
    'AGENTS.md': '# door\n',
    '.multivac/config.yml': 'doors: [agents]\ngrapher: fakegraph\nrepos:\n  brain: .\n',
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

test('a grapher that exits non-zero is a warning, never a failed close', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-graph-'));
  const brain = makeBrain(tmp);
  const bin = makeGrapherBin(tmp, '#!/bin/sh\nexit 1\n');
  await landedChange(brain, 'graph-fail');
  await withPath(bin, async () => {
    const { code, out } = await capture(() => change.run(['close', 'graph-fail'], { cwd: brain }));
    assert.equal(code, 0);
    assert.match(out, /graph fakegraph @ brain: refresh failed .*— run `fakegraph update \.` there by hand/);
  });
  // the close went through: the change is archived despite the failing tool
  assert.match(
    readFileSync(join(brain, '.multivac/changes/archive/graph-fail.md'), 'utf8'),
    /status: archived/,
  );
});
