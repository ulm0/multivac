// `change close` runs the declared grapher's refresh — for real. A fake
// grapher, found on a PATH this file builds, touches the artifact; close
// reports the run and prints an archive commit that carries the artifact
// (MV-134). `change land` refreshes and commits it on the change branch. An
// absent binary degrades to the install notice, and a grapher that exits
// non-zero never fails the close.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmdirSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { initRepo, vendorPath } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { reposCommand } from '../../src/commands/repos.js';
import { doorsCommand } from '../../src/commands/doors.js';
import { doctorReport } from '../../src/commands/doctor.js';
import { verify } from '../../src/commands/verify.js';
import { loadChange, saveChange } from '../../src/change/file.js';
import { GRAPH_LOCK } from '../../src/doors/settings.js';
import { ignoredDirs, ignoreLinesToAdd } from '../../src/adapters/refresh.js';
import { GRAPHIFY_0929_READONLY } from '../helpers/recorded.js';

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

/** Run `fn` on a PATH this file builds — the fake grapher's bin dir, then git's — never the host's. */
const withPath = async (dir: string, fn: () => Promise<void>): Promise<void> => {
  const orig = process.env.PATH ?? '';
  process.env.PATH = `${dir}:/usr/bin:/bin`;
  try {
    await fn();
  } finally {
    process.env.PATH = orig;
  }
};

test('close refreshes before its archive commit, and that commit carries the graph', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-graph-'));
  const brain = makeBrain(tmp);
  const bin = makeGrapherBin(tmp, '#!/bin/sh\necho refreshed >> fakegraph-out/graph.json\n');
  await landedChange(brain, 'graph-run');
  const before = readFileSync(join(brain, 'fakegraph-out/graph.json'), 'utf8');
  await withPath(bin, async () => {
    const { code, out } = await capture(() => change.run(['close', 'graph-run'], { cwd: brain }));
    assert.equal(code, 0);
    const refreshed = out.search(/graph fakegraph @ brain: refreshed \(`fakegraph update \.`\)/);
    const recipe = out.search(/archived — commit this: git -C .* add -- \.multivac\/changes\/archive\/graph-run\.md \.multivac\/changes\/graph-run\.md \.multivac\/invariants\.md fakegraph-out\/graph\.json /);
    assert.ok(refreshed >= 0 && recipe > refreshed, out);
  });
  const after = readFileSync(join(brain, 'fakegraph-out/graph.json'), 'utf8');
  assert.notEqual(after, before, 'the refresh touched the artifact');
  // close prints the commit and makes none: the refresh module touches no git (MV-50)
  assert.match(git(brain, 'status', '--porcelain'), /^ M fakegraph-out\/graph\.json$/m);
});

/** Open `slug` on the brain and apply it: a worktree on the change branch. */
async function appliedChange(brain: string, slug: string): Promise<string> {
  const ctx = { cwd: brain };
  assert.equal(await change.run(['new', slug, `Graph land ${slug}`], ctx), 0);
  const parsed = await loadChange(brain, slug);
  parsed.change.repos = { brain: { status: 'planned' } };
  parsed.change.landing_order = [['brain']];
  parsed.change.invariants.adds = [];
  await saveChange(brain, parsed);
  assert.equal(await change.run(['apply', slug], ctx), 0);
  return join(brain, '.multivac/worktrees', slug, 'brain');
}

test('land refreshes the graph on the change branch and commits it there, before the land line — MV-134', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-graph-land-'));
  const brain = makeBrain(tmp);
  const bin = makeGrapherBin(tmp, '#!/bin/sh\necho refreshed >> fakegraph-out/graph.json\n');
  const wt = await appliedChange(brain, 'graph-land');
  const mainHead = git(brain, 'rev-parse', 'HEAD');
  await withPath(bin, async () => {
    const { code, out } = await capture(() => change.run(['land', 'graph-land'], { cwd: brain }));
    assert.equal(code, 0, out);
    const committed = out.search(/committed: graph: graph-land — refreshed on the change branch/);
    assert.ok(committed >= 0 && out.search(/brain: no origin remote — land locally/) > committed, out);
  });
  assert.equal(git(wt, 'log', '-1', '--format=%s'), 'graph: graph-land — refreshed on the change branch');
  assert.match(git(wt, 'show', 'HEAD:fakegraph-out/graph.json'), /refreshed/);
  assert.equal(git(wt, 'status', '--porcelain'), '');
  assert.equal(git(brain, 'rev-parse', 'HEAD'), mainHead, 'the checkout is not touched');
  assert.doesNotMatch(git(brain, 'status', '--porcelain'), /fakegraph-out/);
});

test('land syncs a local index in the branch checkout and commits none — MV-149', async () => {
  // A brain that holds code on codegraph: apply built its worktree's index,
  // and land syncs it there after the agent's last edits. Nothing of it is
  // committed, so a detached HEAD there is passed over, not refused, and a
  // binary not found there says nothing: apply named it.
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-graph-land-local-')));
  const brain = join(tmp, 'acme-brain');
  initRepo(brain, {
    'AGENTS.md': '# door\n',
    '.gitignore': '.codegraph/\n',
    '.multivac/config.yml': 'doors: [agents]\ngrapher: codegraph\nrepos:\n  brain: .\n',
    '.multivac/invariants.md':
      '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n',
    'src/app.ts': 'export const app = 1;\n',
  });
  const { runs } = vendorPath(['codegraph']);
  const bin = dirname(runs);
  const logged = (): string[] => readFileSync(runs, 'utf8').split('\n').filter(Boolean);
  let wt = '';
  let applied = '';
  await withPath(bin, async () => {
    applied = (await capture(async () => { wt = await appliedChange(brain, 'idx-land'); return 0; })).out;
  });
  assert.ok(existsSync(join(wt, '.codegraph/codegraph.db')), 'apply built the worktree index');
  // US1 AS-1: the build line before where to work, and under the brain's
  // worktree its own index — as of this apply: `doors: [agents]` has no
  // post-edit hook.
  const lines = applied.split('\n');
  const built = lines.indexOf('graph codegraph @ brain worktree: built (`codegraph init`) — local artifact, never committed');
  assert.ok(built >= 0 && built < lines.findIndex((l) => l.startsWith('work here')), applied);
  const at = lines.indexOf(`  brain: ${wt}`);
  assert.ok(at >= 0, applied);
  assert.equal(
    lines[at + 1],
    `    its index: -p ${wt} — as of this apply, refreshed again at \`change land\`; paths in its answers are relative to this checkout`,
  );
  writeFileSync(join(wt, 'src/n.ts'), 'export const n = 2;\n');
  git(wt, 'add', 'src/n.ts');
  git(wt, 'commit', '-qm', 'n');
  const base = git(brain, 'rev-parse', '--abbrev-ref', 'HEAD');

  await withPath(bin, async () => {
    const { code, out } = await capture(() => change.run(['land', 'idx-land'], { cwd: brain }));
    assert.equal(code, 0, out);
    assert.match(out, /^graph codegraph @ brain: refreshed \(`codegraph sync`\) — local artifact, never committed$/m);
    assert.doesNotMatch(out, /committed: graph:/);
  });
  assert.ok(
    logged().includes(`codegraph sync cwd=${wt} DO_NOT_TRACK=1 CODEGRAPH_TELEMETRY=0 CODEGRAPH_NO_DOWNLOAD=1`),
    logged().join('\n'),
  );
  assert.doesNotMatch(git(wt, 'log', '--name-only', '--format=', `${base}..idx-land`), /\.codegraph/);
  assert.equal(git(wt, 'status', '--porcelain'), '');

  // No binary where land runs: nothing about codegraph, and land goes on.
  const bare = mkdtempSync(join(tmpdir(), 'mvac-graph-land-bare-'));
  const syncs = logged().length;
  await withPath(bare, async () => {
    const { code, out } = await capture(() => change.run(['land', 'idx-land'], { cwd: brain }));
    assert.equal(code, 0, out);
    assert.doesNotMatch(out, /codegraph/);
  });
  assert.equal(logged().length, syncs);

  // A detached HEAD in the worktree: no refusal, and nothing about codegraph.
  git(wt, 'checkout', '-q', '--detach');
  await withPath(bin, async () => {
    const { code, out } = await capture(() => change.run(['land', 'idx-land'], { cwd: brain }));
    assert.equal(code, 0, out);
    assert.doesNotMatch(out, /codegraph|cannot land/);
  });
  assert.equal(logged().length, syncs, 'nothing ran on a detached HEAD');
});

test('land commits codegraph.json alone for a consumer of a brain==code brain — MV-149', async () => {
  // Three consumers of a brain that holds code, each keeping the mount out of
  // its codegraph index: web commits a codegraph.json lacking the line; api
  // keeps an untracked one in its own checkout, which land may not write
  // beside; ops ignores the file, which no land could commit.
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-cgjson-land-')));
  const brain = join(tmp, 'acme-brain');
  const repo = (k: string): string => join(tmp, `acme-${k}`);
  initRepo(brain, {
    'AGENTS.md': '# door\n',
    '.gitignore': '.codegraph/\n',
    '.multivac/config.yml':
      'doors: [agents]\ngrapher: codegraph\nrepos:\n  brain: .\n  web: ../acme-web\n  api: ../acme-api\n  ops: ../acme-ops\n',
    '.multivac/invariants.md':
      '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n',
    'src/app.ts': 'export const app = 1;\n',
  });
  initRepo(repo('web'), { 'src/w.ts': 'export const w = 1;\n', 'codegraph.json': '{"exclude":["dist/"]}\n' });
  initRepo(repo('api'), { 'src/a.ts': 'export const a = 1;\n' });
  writeFileSync(join(repo('api'), 'codegraph.json'), '{"exclude":["tmp/"]}\n');
  initRepo(repo('ops'), { 'src/o.ts': 'export const o = 1;\n', '.gitignore': 'codegraph.json\n' });
  const { runs } = vendorPath(['codegraph']);
  const bin = dirname(runs);
  const slug = 'cg-json';
  const wt = (k: string): string => join(brain, '.multivac/worktrees', slug, k);
  const ctx = { cwd: brain };
  await withPath(bin, async () => {
    assert.equal((await capture(() => change.run(['new', slug, 'Codegraph json'], ctx))).code, 0);
    const parsed = await loadChange(brain, slug);
    parsed.change.repos = { web: { status: 'planned' }, api: { status: 'planned' }, ops: { status: 'planned' } };
    parsed.change.landing_order = [['web', 'api', 'ops']];
    parsed.change.invariants.adds = [];
    await saveChange(brain, parsed);
    const applied = await capture(() => change.run(['apply', slug], ctx));
    assert.equal(applied.code, 0, applied.out);
  });
  for (const k of ['web', 'api', 'ops']) assert.ok(existsSync(join(wt(k), '.codegraph/codegraph.db')), k);

  await withPath(bin, async () => {
    const { code, out } = await capture(() => change.run(['land', slug], ctx));
    assert.equal(code, 0, out);
    const lines = out.split('\n');
    const wrote = lines.indexOf('graph codegraph @ web: wrote codegraph.json (+1) before the refresh at `change land`');
    const synced = lines.indexOf('graph codegraph @ web: refreshed (`codegraph sync`) — local artifact, never committed');
    const subject = `graph: ${slug} — codegraph keeps /.brain/ out of its index`;
    const committed = lines.indexOf(`committed: ${subject}`);
    assert.ok(wrote >= 0 && synced > wrote && committed > synced, out);
    assert.equal(Buffer.byteLength(`${subject}\n`), 60 + slug.length - '<slug>'.length);
    // api: the rule lets land write nothing, and a local index says nothing.
    assert.doesNotMatch(out, /^api: .*codegraph\.json/m);
    assert.doesNotMatch(out, /codegraph @ api: wrote/);
    // ops: named, with the command that shows the rule; land goes on.
    const ignored =
      `ops: codegraph.json is ignored in ${wt('ops')} — ` +
      `\`git -C ${wt('ops')} check-ignore -v codegraph.json\` names the rule; nothing was written`;
    assert.ok(lines.includes(ignored), out);
    assert.equal(Buffer.byteLength(`${ignored.replaceAll(wt('ops'), '/srv/eco/web').replace('ops:', '<k>:')}\n`), 140);
    assert.ok(lines.includes('graph codegraph @ ops: refreshed (`codegraph sync`) — local artifact, never committed'), out);
  });
  assert.equal(git(wt('web'), 'log', '-1', '--format=%s'), `graph: ${slug} — codegraph keeps /.brain/ out of its index`);
  assert.equal(git(wt('web'), 'show', '--name-only', '--format=', 'HEAD'), 'codegraph.json');
  assert.equal(git(wt('web'), 'show', 'HEAD:codegraph.json'), '{"exclude":["dist/", "/.brain/"]}');
  assert.equal(existsSync(join(wt('api'), 'codegraph.json')), false, 'nothing created beside an untracked copy');
  assert.equal(readFileSync(join(repo('api'), 'codegraph.json'), 'utf8').includes('"tmp/"'), true);
  assert.equal(existsSync(join(wt('ops'), 'codegraph.json')), false, 'nothing written where it is ignored');
  for (const k of ['web', 'api', 'ops']) assert.equal(git(wt(k), 'status', '--porcelain'), '', `${k} worktree clean`);

  // A second land commits nothing.
  const head = git(wt('web'), 'rev-parse', 'HEAD');
  await withPath(bin, async () => {
    const { code, out } = await capture(() => change.run(['land', slug], ctx));
    assert.equal(code, 0, out);
    assert.doesNotMatch(out, /codegraph keeps|wrote codegraph\.json/);
  });
  assert.equal(git(wt('web'), 'rev-parse', 'HEAD'), head);
  for (const k of ['web', 'api', 'ops']) assert.equal(git(wt(k), 'status', '--porcelain'), '', `${k} worktree clean`);
});

test('land refuses a graph it cannot commit on the branch: ignored, or a detached HEAD — MV-134', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-graph-land-no-'));
  const brain = join(tmp, 'acme-brain');
  initRepo(brain, {
    'AGENTS.md': '# door\n',
    '.gitignore': 'fakegraph-out/\n',
    '.multivac/config.yml': `doors: [agents]\ngrapher: fakegraph\n${DECL_CREATE}repos:\n  brain: .\n`,
    '.multivac/invariants.md':
      '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n',
  });
  const bin = makeGrapherBin(tmp, BUILD_OR_REFRESH);
  await withPath(bin, async () => {
    const wt = await appliedChange(brain, 'graph-ignored');
    const ignored = await capture(() => change.run(['land', 'graph-ignored'], { cwd: brain }));
    assert.equal(ignored.code, 1, ignored.out);
    assert.match(ignored.out, /brain: the graph cannot land with graph-ignored — fakegraph-out\/graph\.json is ignored in .*; `git -C .* check-ignore -v fakegraph-out\/graph\.json` names the rule/);
    assert.doesNotMatch(ignored.out, /land locally/);

    git(wt, 'checkout', '-q', '--detach');
    const detached = await capture(() => change.run(['land', 'graph-ignored'], { cwd: brain }));
    assert.equal(detached.code, 1, detached.out);
    assert.match(detached.out, /brain: the graph cannot land with graph-ignored — .* is on a detached HEAD; `git -C .* switch graph-ignored`/);
  });
});

test('close removes a worktree whose only uncommitted file is the graph — MV-134', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-graph-wt-'));
  const brain = makeBrain(tmp);
  const bin = makeGrapherBin(tmp, '#!/bin/sh\necho refreshed >> fakegraph-out/graph.json\n');
  const wt = await appliedChange(brain, 'graph-wt');
  writeFileSync(join(wt, 'fakegraph-out/graph.json'), '{"nodes":1}\n'); // what a post-edit hook leaves
  assert.equal(await change.run(['land', 'graph-wt', '--landed', 'brain'], { cwd: brain }), 0);
  await withPath(bin, async () => {
    const { code, out } = await capture(() => change.run(['close', 'graph-wt'], { cwd: brain }));
    assert.equal(code, 0, out);
    assert.match(out, /brain: worktree removed/);
  });
  assert.equal(existsSync(wt), false);
});

test("a worktree holding only the grapher's outputs is removed at close — MV-148", async () => {
  // A `--graph` query writes its stamp next to the graph it read, and the
  // post-edit hook refreshes the graph: both are graphify's `local` outputs,
  // and `git worktree remove` refused the worktree over them (exit 128).
  const bin = mkdtempSync(join(tmpdir(), 'mvac-graph-out-bin-'));
  writeFileSync(
    join(bin, 'graphify'),
    '#!/bin/sh\n[ "$1" = install ] && exit 0\nmkdir -p graphify-out && echo \'{"nodes":[],"links":[]}\' > graphify-out/graph.json\n',
  );
  chmodSync(join(bin, 'graphify'), 0o755);
  const graphifyBrain = (tmp: string): string => {
    const brain = join(tmp, 'acme-brain');
    initRepo(brain, {
      'AGENTS.md': '# door\n',
      '.multivac/config.yml': 'doors: [agents]\ngrapher: graphify\nrepos:\n  brain: .\n',
      '.multivac/invariants.md':
        '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n',
      'src/app.ts': 'export const app = 1;\n',
      'graphify-out/graph.json': '{"nodes":[],"links":[]}\n',
      '.agents/skills/graphify/SKILL.md': 'x\n',
    });
    return brain;
  };
  const outputsOnly = (wt: string): void => {
    mkdirSync(join(wt, 'graphify-out/cache'), { recursive: true });
    writeFileSync(join(wt, 'graphify-out/cache/last_query_stamp'), '1\n');
    writeFileSync(join(wt, 'graphify-out/graph.json'), '{"nodes":[1],"links":[]}\n');
  };

  await withPath(bin, async () => {
    const brain = graphifyBrain(mkdtempSync(join(tmpdir(), 'mvac-graph-out-')));
    let wt = '';
    await capture(async () => { wt = await appliedChange(brain, 'outputs'); return 0; });
    assert.equal((await capture(() => change.run(['land', 'outputs', '--landed', 'brain'], { cwd: brain }))).code, 0);
    outputsOnly(wt);
    const status = execFileSync('git', ['-C', wt, 'status', '--porcelain'], { encoding: 'utf8' });
    assert.deepEqual(status.split('\n').filter(Boolean).sort(), [' M graphify-out/graph.json', '?? graphify-out/cache/']);
    const { code, out } = await capture(() => change.run(['close', 'outputs'], { cwd: brain }));
    assert.equal(code, 0, out);
    assert.match(out, /brain: worktree removed/);
    assert.equal(existsSync(wt), false);
  });

  await withPath(bin, async () => {
    const brain = graphifyBrain(mkdtempSync(join(tmpdir(), 'mvac-graph-work-')));
    let wt = '';
    await capture(async () => { wt = await appliedChange(brain, 'work'); return 0; });
    assert.equal((await capture(() => change.run(['land', 'work', '--landed', 'brain'], { cwd: brain }))).code, 0);
    outputsOnly(wt);
    writeFileSync(join(wt, 'notes.txt'), 'mine\n');
    const { code, out } = await capture(() => change.run(['close', 'work'], { cwd: brain }));
    assert.equal(code, 0, out);
    assert.match(out, /brain: worktree .* still has uncommitted work — `git -C .* worktree remove --force .*` when you are done with it/);
    assert.equal(existsSync(join(wt, 'notes.txt')), true, 'any other path keeps the worktree');
  });
});

// --- MV-148: the ignore lines land with the graph ---------------------------

/**
 * A graphify stub that shrinks as 0.9.29 does: over an ignore file, `update .`
 * refuses (exit 1, "Refusing to overwrite") while the graph holds a node under
 * one of its lines that no `!` line re-includes, and `update . --force` drops
 * those nodes. A `fail-once` file beside it fails the next forced run, once.
 * Every run is logged. A node script, so the `package.json` beside it says
 * CommonJS: node reads the nearest one, and a TMPDIR under an ESM package
 * would otherwise fail every run.
 */
function shrinkingGraphify(tmp: string): { bin: string; runs: () => string[]; failOnce: () => void } {
  const bin = join(tmp, 'bin');
  mkdirSync(bin, { recursive: true });
  writeFileSync(join(bin, 'package.json'), '{"type":"commonjs"}\n');
  const log = join(bin, 'runs.log');
  const once = join(bin, 'fail-once');
  writeFileSync(
    join(bin, 'graphify'),
    `#!${process.execPath}\n` +
      "const fs = require('fs');\n" +
      'const a = process.argv.slice(2);\n' +
      `fs.appendFileSync(${JSON.stringify(log)}, a.join(' ') + '\\n');\n` +
      "if (a[0] === 'install') process.exit(0);\n" +
      `if (a.includes('--force') && fs.existsSync(${JSON.stringify(once)})) { fs.rmSync(${JSON.stringify(once)}); process.stderr.write('interrupted\\n'); process.exit(1); }\n` +
      "const text = fs.existsSync('.graphifyignore') ? fs.readFileSync('.graphifyignore', 'utf8') : '';\n" +
      "const bare = (l) => l.replace(/^!/, '').replace(/^\\/+|\\/+$/g, '');\n" +
      "const lines = text.split('\\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));\n" +
      "const back = lines.filter((l) => l.startsWith('!')).map(bare);\n" +
      "const dirs = lines.filter((l) => !l.startsWith('!')).map(bare).filter((d) => !back.includes(d));\n" +
      "const g = JSON.parse(fs.readFileSync('graphify-out/graph.json', 'utf8'));\n" +
      "const keep = g.nodes.filter((n) => !dirs.some((d) => n.source_file.startsWith(d + '/')));\n" +
      "if (keep.length < g.nodes.length && !a.includes('--force')) { process.stderr.write('Refusing to overwrite — pass --force\\n'); process.exit(1); }\n" +
      "g.nodes = keep; g.runs = (g.runs || 0) + 1;\n" +
      "fs.writeFileSync('graphify-out/graph.json', JSON.stringify(g) + '\\n');\n",
  );
  chmodSync(join(bin, 'graphify'), 0o755);
  return {
    bin,
    runs: () => (existsSync(log) ? readFileSync(log, 'utf8').split('\n').filter((l) => l.startsWith('update')) : []),
    failOnce: () => writeFileSync(once, ''),
  };
}

const graphOf = (...files: string[]): string =>
  JSON.stringify({ nodes: files.map((f, i) => ({ id: `n${i}`, source_file: f })), links: [] }) + '\n';

/** A brain that holds code, graphify declared, a graph committed with nodes from what is not code. */
function graphifyBrain(tmp: string, extra: Record<string, string> = {}): string {
  const brain = join(tmp, 'acme-brain');
  initRepo(brain, {
    'AGENTS.md': '# door\n',
    '.multivac/config.yml': 'doors: [agents]\ngrapher: graphify\nrepos:\n  brain: .\n',
    '.multivac/invariants.md':
      '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n',
    'src/app.ts': 'export const app = 1;\n',
    // Installed for the declared door already, so no install edits the tree.
    '.agents/skills/graphify/SKILL.md': 'x\n',
    'graphify-out/graph.json': graphOf('src/app.ts', '.multivac/config.yml', '.agents/skills/graphify/SKILL.md'),
    ...extra,
  });
  return brain;
}

/** This brain's eleven derived lines: doors [agents], no SDD, no mount. */
const DERIVED = '/.agents/ /.claude/ /.codex/ /.copilot/ /.cursor/ /.gemini/ /.husky/ /.multivac/ /.opencode/ /.specify/ /openspec/';

test('land appends the derived ignore lines, rebuilds and commits them with the graph — MV-148', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-graph-ignore-'));
  const brain = graphifyBrain(tmp);
  const g = shrinkingGraphify(tmp);
  await withPath(g.bin, async () => {
    let wt = '';
    await capture(async () => { wt = await appliedChange(brain, 'kept-out'); return 0; });
    const { code, out } = await capture(() => change.run(['land', 'kept-out'], { cwd: brain }));
    assert.equal(code, 0, out);
    // One append, before the refresh, into the grapher's file alone.
    assert.match(out, /graph graphify @ brain: wrote \.graphifyignore \(\+11\) before the refresh at `change land`\n/);
    assert.doesNotMatch(out, /\.gitignore \(\+/);
    // One rebuild: a plain refresh would have refused to shrink.
    assert.deepEqual(g.runs(), ['update . --force']);
    assert.match(out, /graph graphify @ brain: rebuilt \(`graphify update \. --force`\)/);
    // One commit, carrying both, on the change branch.
    assert.equal(git(wt, 'log', '-1', '--format=%s'), 'graph: kept-out — refreshed on the change branch');
    assert.deepEqual(
      git(wt, 'show', '--name-only', '--format=', 'HEAD').split('\n').filter((p) => p !== '.multivac/ecosystem.json').sort(),
      ['.graphifyignore', 'graphify-out/graph.json'],
    );
    assert.equal(
      git(wt, 'show', 'HEAD:.graphifyignore'),
      `${DERIVED.split(' ').join('\n')}\n# multivac: kept out of the graph — ${DERIVED}`,
    );
    assert.deepEqual(JSON.parse(git(wt, 'show', 'HEAD:graphify-out/graph.json')).nodes.map((n: { source_file: string }) => n.source_file), ['src/app.ts']);
    // Nothing left behind, and no `.gitignore` edit (critic gap 5).
    assert.equal(git(wt, 'status', '--porcelain'), '');

    // A second land appends nothing and forces nothing.
    const again = await capture(() => change.run(['land', 'kept-out'], { cwd: brain }));
    assert.equal(again.code, 0, again.out);
    assert.doesNotMatch(again.out, /wrote \.graphifyignore/);
    assert.deepEqual(g.runs(), ['update . --force', 'update .']);
    assert.equal(git(wt, 'status', '--porcelain'), '');
  });

  // A rebuild that fails once: the file is restored (land created it, so it
  // is gone), nothing of it is committed, and the next land rebuilds.
  const restoredLine =
    /graph graphify @ brain: the rebuild left 2 node\(s\) under the lines just added to \.graphifyignore — it is restored and not committed; the next `change land` naming brain appends them again and rebuilds/;
  const tmp2 = mkdtempSync(join(tmpdir(), 'mvac-graph-ignore-fail-'));
  const brain2 = graphifyBrain(tmp2);
  const g2 = shrinkingGraphify(tmp2);
  await withPath(g2.bin, async () => {
    let wt = '';
    await capture(async () => { wt = await appliedChange(brain2, 'kept-fail'); return 0; });
    const head = git(wt, 'rev-parse', 'HEAD');
    g2.failOnce();
    const failed = await capture(() => change.run(['land', 'kept-fail'], { cwd: brain2 }));
    assert.equal(failed.code, 0, failed.out);
    assert.match(failed.out, /graph graphify @ brain: rebuild failed \(interrupted\) — run `graphify update \. --force` there by hand/);
    assert.match(failed.out, restoredLine);
    assert.equal(existsSync(join(wt, '.graphifyignore')), false);
    assert.equal(git(wt, 'status', '--porcelain'), '');
    assert.equal(git(wt, 'rev-parse', 'HEAD'), head, 'nothing committed');

    const next = await capture(() => change.run(['land', 'kept-fail'], { cwd: brain2 }));
    assert.equal(next.code, 0, next.out);
    assert.deepEqual(g2.runs(), ['update . --force', 'update . --force']);
    assert.match(git(wt, 'show', '--name-only', '--format=', 'HEAD'), /\.graphifyignore/);
    assert.equal(git(wt, 'status', '--porcelain'), '');
  });

  // The same failure over a committed file: restored to its committed bytes,
  // nothing left modified, and the next land appends and rebuilds.
  const tmp3 = mkdtempSync(join(tmpdir(), 'mvac-graph-ignore-fail-tracked-'));
  const brain3 = graphifyBrain(tmp3, { '.graphifyignore': '/.claude/\n' });
  const g3 = shrinkingGraphify(tmp3);
  await withPath(g3.bin, async () => {
    let wt = '';
    await capture(async () => { wt = await appliedChange(brain3, 'kept-tracked'); return 0; });
    const head = git(wt, 'rev-parse', 'HEAD');
    g3.failOnce();
    const failed = await capture(() => change.run(['land', 'kept-tracked'], { cwd: brain3 }));
    assert.equal(failed.code, 0, failed.out);
    assert.match(failed.out, restoredLine);
    assert.equal(readFileSync(join(wt, '.graphifyignore'), 'utf8'), '/.claude/\n');
    assert.equal(git(wt, 'status', '--porcelain'), '');
    assert.equal(git(wt, 'rev-parse', 'HEAD'), head, 'nothing committed');

    const next = await capture(() => change.run(['land', 'kept-tracked'], { cwd: brain3 }));
    assert.equal(next.code, 0, next.out);
    assert.match(next.out, /wrote \.graphifyignore \(\+10\) before the refresh at `change land`/);
    assert.deepEqual(g3.runs(), ['update . --force', 'update . --force']);
    assert.match(git(wt, 'show', '--name-only', '--format=', 'HEAD'), /\.graphifyignore/);
    assert.equal(git(wt, 'status', '--porcelain'), '');
  });

  // Close never appends, so after a restored land it refreshes plainly: only
  // a later land retries the rebuild.
  const tmp4 = mkdtempSync(join(tmpdir(), 'mvac-graph-ignore-fail-close-'));
  const brain4 = graphifyBrain(tmp4);
  const g4 = shrinkingGraphify(tmp4);
  await withPath(g4.bin, async () => {
    await capture(async () => { await appliedChange(brain4, 'kept-close'); return 0; });
    g4.failOnce();
    const failed = await capture(() => change.run(['land', 'kept-close'], { cwd: brain4 }));
    assert.match(failed.out, restoredLine);
    assert.equal((await capture(() => change.run(['land', 'kept-close', '--landed', 'brain'], { cwd: brain4 }))).code, 0);
    const closed = await capture(() => change.run(['close', 'kept-close'], { cwd: brain4 }));
    assert.equal(closed.code, 0, closed.out);
    assert.match(closed.out, /graph graphify @ brain: refreshed \(`graphify update \.`\)/);
    assert.deepEqual(g4.runs(), ['update . --force', 'update .']);
    assert.equal(existsSync(join(brain4, '.graphifyignore')), false, 'close writes no ignore line');
  });
});

test('land writes the ignore file only where it is committed, or absent in both checkouts, and never over a line it holds — MV-148', async () => {
  // Committed with a human's lines: the directory itself negated, a path
  // under a directory, and a record whose line a human deleted — each of the
  // three is theirs, and land appends the rest after them.
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-graph-ignore-skip-'));
  const human = '!/.claude/\n.agents/skills/team/\n# multivac: kept out of the graph — /.codex/\n';
  const brain = graphifyBrain(tmp, { '.graphifyignore': human });
  const g = shrinkingGraphify(tmp);
  await withPath(g.bin, async () => {
    let wt = '';
    await capture(async () => { wt = await appliedChange(brain, 'kept-skip'); return 0; });
    const { code, out } = await capture(() => change.run(['land', 'kept-skip'], { cwd: brain }));
    assert.equal(code, 0, out);
    const rest = DERIVED.split(' ').filter((l) => !['/.agents/', '/.claude/', '/.codex/'].includes(l));
    assert.match(out, new RegExp(`wrote \\.graphifyignore \\(\\+${rest.length}\\) before the refresh`));
    assert.equal(git(wt, 'show', 'HEAD:.graphifyignore'), `${human}${rest.join('\n')}\n# multivac: kept out of the graph — ${rest.join(' ')}`);
    assert.equal(git(wt, 'status', '--porcelain'), '');
  });

  // Untracked in the repo's own checkout: named, and no copy created on the
  // branch — a pull over it would refuse.
  const tmp2 = mkdtempSync(join(tmpdir(), 'mvac-graph-ignore-untracked-'));
  const brain2 = graphifyBrain(tmp2);
  const g2 = shrinkingGraphify(tmp2);
  await withPath(g2.bin, async () => {
    let wt = '';
    await capture(async () => { wt = await appliedChange(brain2, 'kept-mine'); return 0; });
    writeFileSync(join(brain2, '.graphifyignore'), '/.claude/\n');
    const { code, out } = await capture(() => change.run(['land', 'kept-mine'], { cwd: brain2 }));
    assert.equal(code, 0, out);
    assert.ok(
      out.includes(`brain: .graphifyignore in ${brain2} is not committed — the graph on kept-mine is built without it; commit it there the way that repo lands work`),
      out,
    );
    assert.doesNotMatch(out, /wrote \.graphifyignore/);
    assert.equal(existsSync(join(wt, '.graphifyignore')), false);
    assert.deepEqual(g2.runs(), ['update .']);
    assert.equal(readFileSync(join(brain2, '.graphifyignore'), 'utf8'), '/.claude/\n');
  });
});

test('land names an ignore file it may not write, and the graph lands without it — MV-148', async () => {
  // Committed, with an edit of yours on top: appending would carry your
  // pending bytes into multivac's graph commit.
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-graph-ignore-dirty-'));
  const brain = graphifyBrain(tmp, { '.graphifyignore': '/.claude/\n' });
  const g = shrinkingGraphify(tmp);
  await withPath(g.bin, async () => {
    let wt = '';
    await capture(async () => { wt = await appliedChange(brain, 'kept-dirty'); return 0; });
    writeFileSync(join(wt, '.graphifyignore'), '/.claude/\n/drafts/\n');
    const { code, out } = await capture(() => change.run(['land', 'kept-dirty'], { cwd: brain }));
    assert.equal(code, 0, out);
    assert.ok(
      out.includes(`brain: .graphifyignore in ${wt} has uncommitted edits — multivac appends nothing over them, and the graph lands without it; commit or discard them there, then re-run land`),
      out,
    );
    assert.doesNotMatch(out, /wrote \.graphifyignore/);
    assert.equal(readFileSync(join(wt, '.graphifyignore'), 'utf8'), '/.claude/\n/drafts/\n');
    assert.equal(git(wt, 'log', '-1', '--format=%s'), 'graph: kept-dirty — refreshed on the change branch');
    assert.doesNotMatch(git(wt, 'show', '--name-only', '--format=', 'HEAD'), /\.graphifyignore/);
    assert.equal(git(wt, 'status', '--porcelain'), 'M .graphifyignore');
  });

  // Ignored by the repo's own rules: a `git add` of it failed, and the graph
  // with it. Named, never created, and the graph lands alone.
  const tmp2 = mkdtempSync(join(tmpdir(), 'mvac-graph-ignore-ignored-'));
  const brain2 = graphifyBrain(tmp2, { '.gitignore': '.graphifyignore\n' });
  const g2 = shrinkingGraphify(tmp2);
  await withPath(g2.bin, async () => {
    let wt = '';
    await capture(async () => { wt = await appliedChange(brain2, 'kept-ignored'); return 0; });
    const { code, out } = await capture(() => change.run(['land', 'kept-ignored'], { cwd: brain2 }));
    assert.equal(code, 0, out);
    assert.ok(
      out.includes(`brain: .graphifyignore is ignored in ${wt} — the graph lands without it; \`git -C ${wt} check-ignore -v .graphifyignore\` names the rule: remove it to land the lines multivac keeps out`),
      out,
    );
    assert.equal(existsSync(join(wt, '.graphifyignore')), false);
    assert.equal(git(wt, 'log', '-1', '--format=%s'), 'graph: kept-ignored — refreshed on the change branch');
    assert.equal(git(wt, 'status', '--porcelain'), '');
    assert.match(out, /brain: no origin remote — land locally/);
  });

  // Committed on the repo's own branch after this one was cut: not missing
  // from the repo, only from the branch — said so, and nothing created.
  const tmp3 = mkdtempSync(join(tmpdir(), 'mvac-graph-ignore-behind-'));
  const brain3 = graphifyBrain(tmp3);
  const g3 = shrinkingGraphify(tmp3);
  await withPath(g3.bin, async () => {
    let wt = '';
    await capture(async () => { wt = await appliedChange(brain3, 'kept-behind'); return 0; });
    // Work on the branch, so it is not already merged once the trunk moves.
    writeFileSync(join(wt, 'src/b.ts'), 'export const b = 1;\n');
    git(wt, 'add', 'src/b.ts');
    git(wt, '-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'work');
    writeFileSync(join(brain3, '.graphifyignore'), '/.claude/\n');
    git(brain3, 'add', '.graphifyignore');
    git(brain3, '-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'ignore file on the trunk');
    const { code, out } = await capture(() => change.run(['land', 'kept-behind'], { cwd: brain3 }));
    assert.equal(code, 0, out);
    assert.ok(
      out.includes(`brain: .graphifyignore is committed in ${brain3} but not on kept-behind — the graph on kept-behind is built without it; merge that commit into kept-behind, or rebase kept-behind onto it, then re-run land`),
      out,
    );
    assert.doesNotMatch(out, /is not committed/);
    assert.equal(existsSync(join(wt, '.graphifyignore')), false);
  });
});

// MV-148 (FR-028). A graph commit that fails is a graph that did not land:
// no push or merge line follows it for that repo, the commit is named with
// the command to make it by hand, and land exits 1.
test('a graph commit that fails prints no push or merge line for that repo, and land exits 1 — MV-148', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-graph-commit-fail-'));
  const brain = graphifyBrain(tmp);
  const g = shrinkingGraphify(tmp);
  await withPath(g.bin, async () => {
    let wt = '';
    await capture(async () => { wt = await appliedChange(brain, 'kept-refused'); return 0; });
    // A pre-commit hook refusing every commit on the change's branch, alone:
    // worktrees share the repository's hooks.
    mkdirSync(join(brain, '.git/hooks'), { recursive: true });
    writeFileSync(join(brain, '.git/hooks/pre-commit'), '#!/bin/sh\n[ "$(git rev-parse --abbrev-ref HEAD)" = kept-refused ] && exit 1\nexit 0\n');
    chmodSync(join(brain, '.git/hooks/pre-commit'), 0o755);
    const head = git(wt, 'rev-parse', 'HEAD');
    const { code, out } = await capture(() => change.run(['land', 'kept-refused'], { cwd: brain }));
    assert.equal(code, 1, out);
    assert.match(
      out,
      /could not commit the bookkeeping \(.*\) — do it yourself: git -C \S+ add -- graphify-out\/graph\.json \.graphifyignore .*&& git commit -m "graph: kept-refused — refreshed on the change branch"/,
    );
    assert.doesNotMatch(out, /land locally|push -u origin|open MR|once merged/);
    assert.equal(git(wt, 'rev-parse', 'HEAD'), head, 'nothing committed');
  });
});

/** A brain that holds code, graphify declared, and no graph committed. */
function unbuiltBrain(tmp: string, extra: Record<string, string> = {}): string {
  const brain = join(tmp, 'acme-brain');
  initRepo(brain, {
    'AGENTS.md': '# door\n',
    '.multivac/config.yml': 'doors: [agents]\ngrapher: graphify\nrepos:\n  brain: .\n',
    '.multivac/invariants.md':
      '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n',
    'src/app.ts': 'export const app = 1;\n',
    ...extra,
  });
  return brain;
}

/** A graphify stub that builds a one-node graph where there is none, and installs nothing. */
function buildingGraphify(tmp: string): string {
  const bin = join(tmp, 'bin');
  mkdirSync(bin, { recursive: true });
  writeFileSync(
    join(bin, 'graphify'),
    '#!/bin/sh\n[ "$1" = install ] && exit 0\nmkdir -p graphify-out && ' +
      `printf '%s\\n' '${graphOf('src/app.ts').trim()}' > graphify-out/graph.json\n`,
  );
  chmodSync(join(bin, 'graphify'), 0o755);
  return bin;
}

// MV-148 (FR-028; data-model: Land's ignore step). A graph that is not built,
// or that `.gitignore` ignores, does not land, and neither do the lines land
// appended for it: the ignore file goes back to its committed bytes, or is
// gone where land created it.
test('land restores the ignore file it appended to when the graph is not built, or is ignored — MV-148', async () => {
  for (const [what, extra] of [
    ['created by land', {}],
    ['committed', { '.graphifyignore': '/.claude/\n' }],
  ] as const) {
    const restored = (wt: string): void => {
      if ('.graphifyignore' in extra) assert.equal(readFileSync(join(wt, '.graphifyignore'), 'utf8'), '/.claude/\n', what);
      else assert.equal(existsSync(join(wt, '.graphifyignore')), false, what);
    };
    // Not built: no binary before land nor at it, so the branch has no graph.
    const tmp = mkdtempSync(join(tmpdir(), 'mvac-graph-ignore-unbuilt-'));
    const brain = unbuiltBrain(tmp, extra);
    const none = join(tmp, 'nobin');
    mkdirSync(none);
    await withPath(none, async () => {
      let wt = '';
      await capture(async () => { wt = await appliedChange(brain, 'not-built'); return 0; });
      const { code, out } = await capture(() => change.run(['land', 'not-built'], { cwd: brain }));
      assert.equal(code, 0, out);
      assert.match(out, /graph graphify @ brain: wrote \.graphifyignore \(\+\d+\) before the refresh at `change land`/, what);
      assert.match(out, /`graphify` found on neither PATH nor/, what);
      assert.equal(existsSync(join(wt, 'graphify-out/graph.json')), false, what);
      restored(wt);
      assert.equal(git(wt, 'status', '--porcelain'), '', what);
    });

    // Ignored by `.gitignore`: built, refused by name, and land exits 1.
    const tmp2 = mkdtempSync(join(tmpdir(), 'mvac-graph-ignore-gitignored-'));
    const brain2 = unbuiltBrain(tmp2, { ...extra, '.gitignore': 'graphify-out/\n' });
    const none2 = join(tmp2, 'nobin');
    mkdirSync(none2);
    let wt = '';
    await withPath(none2, async () => {
      await capture(async () => { wt = await appliedChange(brain2, 'ignored'); return 0; });
    });
    await withPath(buildingGraphify(tmp2), async () => {
      const { code, out } = await capture(() => change.run(['land', 'ignored'], { cwd: brain2 }));
      assert.equal(code, 1, out);
      assert.match(out, /graph graphify @ brain: wrote \.graphifyignore \(\+\d+\) before the refresh at `change land`/, what);
      assert.match(out, /brain: the graph cannot land with ignored — graphify-out\/graph\.json is ignored in /, what);
      assert.equal(existsSync(join(wt, 'graphify-out/graph.json')), true, what);
      restored(wt);
      assert.equal(git(wt, 'status', '--porcelain'), '', what);
    });
  }
});

// MV-148 (FR-028; data-model: Ignore writing and the rebuild). A rule already
// ignoring the shared artifact is said once, before the first build: the
// harness install's `.gitignore` write does not repeat it, and neither does
// land's ignore step, since land refuses such a graph by name itself.
test('a rule ignoring the graph is warned of once, at the first build, not by the harness install or land — MV-148', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-graph-ignored-once-'));
  // No `agents` probe, so the harness install runs, and writes `.gitignore`.
  const brain = unbuiltBrain(tmp, { '.gitignore': 'graphify-out/\n' });
  const outs: string[] = [];
  const run = async (args: string[]): Promise<number> => {
    const r = await capture(() => change.run(args, { cwd: brain }));
    outs.push(r.out);
    return r.code;
  };
  await withPath(buildingGraphify(tmp), async () => {
    assert.equal(await run(['new', 'warned', 'Warned once']), 0, outs.join('\n'));
    assert.match(outs[0]!, /graph graphify @ brain: wrote \.graphifyignore \(\+11\) and \.gitignore \(\+2\) before the first build/);
    assert.match(outs[0]!, /graph graphify @ brain: wrote \.gitignore \(\+1\) before its first project install/);
    // Both files on the trunk, so the branch carries them and land's ignore
    // step reaches its write.
    git(brain, 'add', '.graphifyignore', '.gitignore');
    git(brain, '-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'ignore files');
    const parsed = await loadChange(brain, 'warned');
    parsed.change.repos = { brain: { status: 'planned' } };
    parsed.change.landing_order = [['brain']];
    parsed.change.invariants.adds = [];
    await saveChange(brain, parsed);
    assert.equal(await run(['apply', 'warned']), 0, outs.join('\n'));
    assert.equal(await run(['land', 'warned']), 1, outs.join('\n'));
    const all = outs.join('\n');
    assert.match(all, /brain: the graph cannot land with warned — graphify-out\/graph\.json is ignored in /);
    assert.equal(
      all.match(/graphify-out\/graph\.json is ignored by a rule already in this repo, so it cannot be committed/g)?.length,
      1,
      all,
    );
  });
});

test('only a recorded directory line no negation re-includes forces the rebuild — MV-148', async () => {
  const held = `${DERIVED.split(' ').join('\n')}\n# multivac: kept out of the graph — ${DERIVED}\n`;
  // A human's own `docs/` line, unrecorded, over a graph holding a node under
  // it: theirs to rebuild for — land refreshes plainly, and graphify refuses.
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-graph-force-human-'));
  const brain = graphifyBrain(tmp, {
    '.graphifyignore': `${held}docs/\n`,
    'graphify-out/graph.json': graphOf('src/app.ts', 'docs/guide.md'),
  });
  const g = shrinkingGraphify(tmp);
  await withPath(g.bin, async () => {
    await capture(async () => { await appliedChange(brain, 'force-human'); return 0; });
    const { code, out } = await capture(() => change.run(['land', 'force-human'], { cwd: brain }));
    assert.equal(code, 0, out);
    assert.doesNotMatch(out, /wrote \.graphifyignore/);
    assert.deepEqual(g.runs(), ['update .'], 'never --force for a line multivac did not record');
  });

  // A recorded line a human re-includes whole with `!`: nothing to force.
  const tmp2 = mkdtempSync(join(tmpdir(), 'mvac-graph-force-negated-'));
  const brain2 = graphifyBrain(tmp2, {
    '.graphifyignore': `${held}!/.agents/\n`,
    'graphify-out/graph.json': graphOf('src/app.ts', '.agents/skills/team/SKILL.md'),
  });
  const g2 = shrinkingGraphify(tmp2);
  await withPath(g2.bin, async () => {
    await capture(async () => { await appliedChange(brain2, 'force-negated'); return 0; });
    const { code, out } = await capture(() => change.run(['land', 'force-negated'], { cwd: brain2 }));
    assert.equal(code, 0, out);
    assert.deepEqual(g2.runs(), ['update .']);
    assert.match(out, /graph graphify @ brain: refreshed \(`graphify update \.`\)/);
  });
});

test('an ignore line is held in every spelling, and only recorded, un-negated directories count — MV-148', () => {
  for (const line of ['x', 'x/', '/x', '/x/', '!x', '!/x/']) {
    assert.deepEqual(ignoreLinesToAdd(`${line}\n`, ['/x/', '/y/']), ['/y/'], line);
  }
  assert.deepEqual(ignoreLinesToAdd('x/sub/\n', ['/x/']), [], 'a line under it is theirs');
  assert.deepEqual(ignoreLinesToAdd('!x/keep/\n', ['/x/']), [], 'a re-include under it too');
  assert.deepEqual(ignoreLinesToAdd('# multivac: kept out of the graph — /x/\n', ['/x/']), [], 'recorded, its line deleted');
  assert.deepEqual(ignoreLinesToAdd('xy/\n', ['/x/']), ['/x/'], 'another directory');
  const text = '/x/\n/y/\ndocs/\n*.md\nsrc/*/\n# multivac: kept out of the graph — /x/ /y/\n';
  assert.deepEqual(ignoredDirs(text, false).sort(), ['docs', 'x', 'y']);
  assert.deepEqual(ignoredDirs(text, true).sort(), ['x', 'y']);
  assert.deepEqual(ignoredDirs(`${text}!/y/\n`, true), ['x']);
  assert.deepEqual(ignoredDirs(`${text}!y\n`, true), ['x'], 'a negation in any spelling');
});

test('over an installed root, repos sync, doors, doctor and verify never write the ignore lines — MV-148', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-graph-ignore-ro-'));
  const brain = graphifyBrain(tmp, { '.graphifyignore': '/.claude/\n' });
  const g = shrinkingGraphify(tmp);
  const file = join(brain, '.graphifyignore');
  utimesSync(file, new Date(1000), new Date(1000));
  await withPath(g.bin, async () => {
    await capture(() => reposCommand.run(['sync'], { cwd: brain }));
    await capture(() => doorsCommand.run([], { cwd: brain }));
    await capture(async () => (await doctorReport(brain)).exit);
    await capture(() => verify.run([], { cwd: brain }));
  });
  assert.equal(readFileSync(file, 'utf8'), '/.claude/\n');
  assert.equal(statSync(file).mtimeMs, 1000);
  assert.deepEqual(g.runs(), [], 'nothing was refreshed or rebuilt');
});

test('absent grapher binary degrades to the install notice, close still 0', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-graph-'));
  const brain = makeBrain(tmp);
  await landedChange(brain, 'graph-absent');
  const before = readFileSync(join(brain, 'fakegraph-out/graph.json'), 'utf8');
  // an empty bin dir on PATH: `fakegraph` is nowhere — declared, absent, degraded
  let code = -1;
  let out = '';
  await withPath(join(tmp, 'nobin'), async () => {
    ({ code, out } = await capture(() => change.run(['close', 'graph-absent'], { cwd: brain })));
  });
  assert.equal(code, 0);
  assert.match(out, /graph fakegraph @ brain: refresh skipped — `fakegraph` found on neither PATH nor brain's node_modules\/\.bin — install fakegraph: npm i -g fakegraph \(declared in \.multivac\/config\.yml/);
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

test("a grapher that fails as graphify 0.9.29 does is quoted by its exception, not its traceback", async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-graph-'));
  const brain = makeBrain(tmp);
  const r = GRAPHIFY_0929_READONLY;
  const bin = makeGrapherBin(
    tmp,
    `#!/bin/sh\ncat <<'EOF'\n${r.stdout}EOF\ncat >&2 <<'EOF'\n${r.stderr}EOF\nexit 1\n`,
  );
  await landedChange(brain, 'graph-trace');
  await withPath(bin, async () => {
    const { code, out } = await capture(() => change.run(['close', 'graph-trace'], { cwd: brain }));
    assert.equal(code, 0, 'a failing refresh never fails the close');
    const warned = out.split('\n').find((l) => l.includes('refresh failed')) ?? '';
    assert.match(
      warned,
      /refresh failed \(PermissionError: \[Errno 13\] Permission denied: 'graphify-out\/\.rebuild\.lock'\) — run `fakegraph update \.` there by hand/,
    );
    assert.doesNotMatch(out, /Traceback|File "/);
  });
});

// --- MV-87: the first build reaches each declared repo on disk ---

/** A grapher whose BUILD command differs from its refresh — the distinction
 *  `doctor` has always printed and the runner never asked. */
const DECL_CREATE =
  'graphers:\n' +
  '  fakegraph:\n' +
  '    artifact: fakegraph-out/graph.json\n' +
  '    refresh: fakegraph update .\n' +
  '    create: fakegraph build .\n' +
  '    install: npm i -g fakegraph\n';

/** Writes the artifact on `build`, appends on `update`. */
const BUILD_OR_REFRESH =
  '#!/bin/sh\nmkdir -p fakegraph-out\n' +
  'case "$1" in build) echo built > fakegraph-out/graph.json;; *) echo refreshed >> fakegraph-out/graph.json;; esac\n';

test('repos sync builds a declared repo no change names; a change builds only what it names — MV-134', async () => {
  // The graph is what the agent reads in order to do the work, so `repos sync`
  // builds every declared repo. A change reaches the brain and the repos it
  // names, and leaves nothing behind in a repo nobody is working in.
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-graph-first-'));
  const brain = makeBrain(
    tmp,
    `doors: [agents]\ngrapher: fakegraph\n${DECL_CREATE}repos:\n  brain: .\n  api: ../acme-api\n  web: ../acme-web\n`,
  );
  initRepo(join(tmp, 'acme-api'), { 'README.md': '# api\n' });
  initRepo(join(tmp, 'acme-web'), { 'README.md': '# web\n' });
  const bin = makeGrapherBin(tmp, BUILD_OR_REFRESH);

  await withPath(bin, async () => {
    const opened = await capture(() => change.run(['new', 'graph-first', 'Graph first'], { cwd: brain }));
    assert.doesNotMatch(opened.out, /graph fakegraph @ (api|web):/);
    assert.ok(!existsSync(join(tmp, 'acme-api/fakegraph-out')));

    const { out } = await capture(() => reposCommand.run(['sync'], { cwd: brain }));
    // Built, not "refreshed", and with the adapter's OWN create command.
    assert.match(out, /graph fakegraph @ api: built \(`fakegraph build \.`\)/);
    assert.match(out, /graph fakegraph @ web: built \(`fakegraph build \.`\)/);
    // The brain already had one: nothing runs there, and nothing is said.
    assert.doesNotMatch(out, /graph fakegraph @ brain:/);
    assert.ok(existsSync(join(tmp, 'acme-api/fakegraph-out/graph.json')));
    assert.ok(existsSync(join(tmp, 'acme-web/fakegraph-out/graph.json')));

    // Self-limiting: the artifact now exists everywhere, so the next sync
    // builds nothing at all.
    const again = await capture(() => reposCommand.run(['sync'], { cwd: brain }));
    assert.doesNotMatch(again.out, /graph fakegraph @ .*: built/);
  });
});

test('a missing binary on the build path is a notice, never a failed lifecycle', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-graph-nobin-'));
  const brain = makeBrain(
    tmp,
    `doors: [agents]\ngrapher: fakegraph\n${DECL_CREATE}repos:\n  brain: .\n  api: ../acme-api\n`,
  );
  initRepo(join(tmp, 'acme-api'), { 'README.md': '# api\n' });
  // An empty bin dir on PATH: declared, absent, degraded — and the command it
  // names is the BUILD, because that is what this scope needs.
  let code = -1;
  let out = '';
  await withPath(join(tmp, 'nobin'), async () => {
    await capture(() => change.run(['new', 'graph-nobin', 'Graph nobin'], { cwd: brain }));
    const parsed = await loadChange(brain, 'graph-nobin');
    parsed.change.repos = { api: { status: 'planned' } };
    parsed.change.landing_order = [['api']];
    parsed.change.invariants.adds = [];
    await saveChange(brain, parsed);
    ({ code, out } = await capture(() => change.run(['plan', 'graph-nobin'], { cwd: brain })));
  });
  assert.equal(code, 0);
  assert.match(out, /graph fakegraph @ api: build skipped — `fakegraph` found on neither PATH nor api's node_modules\/\.bin — install fakegraph: npm i -g fakegraph \(.*\), then `fakegraph build \.` there/);
  assert.ok(!existsSync(join(tmp, 'acme-api/fakegraph-out/graph.json')));
});
