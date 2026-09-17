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
  rmdirSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initRepo } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { reposCommand } from '../../src/commands/repos.js';
import { loadChange, saveChange } from '../../src/change/file.js';
import { GRAPH_LOCK } from '../../src/doors/settings.js';
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
