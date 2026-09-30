// MV-148. A brain no repos entry declares holds the law, the changes and their
// specs — no code — and resolves no grapher. Measured before: `init` installed
// 23 graphify files and a 2-node graph of `CLAUDE.md`, the first close's
// archive commit carried 1,261 lines of a graph answering from graphify's own
// skill, and after a human removed that install the next `change new`
// reinstalled it. A stub grapher, on a PATH this file builds, logs the
// directory it runs in; the host's tools never run.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initRepo, makeScratchEcosystem } from '../helpers/fixture.js';
import { init } from '../../src/commands/init.js';
import { change } from '../../src/commands/change.js';
import { reposCommand } from '../../src/commands/repos.js';
import { doorsCommand } from '../../src/commands/doors.js';
import { loadChange, saveChange } from '../../src/change/file.js';
import { loadConfig } from '../../src/lib/config.js';
import { graphGate } from '../../src/adapters/refresh.js';
import { graphTrackedGate } from '../../src/adapters/tracked.js';
import { grapherSpec } from '../../src/adapters/registry.js';
import { graphIgnoreLines } from '../../src/lib/code-in-change.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const GRAPH = '{"nodes":[],"links":[]}\n';
/** The graph an earlier release built in the brain, kept: nothing may touch it. */
const KEPT = '{"nodes":[{"id":"CLAUDE.md","source_file":"CLAUDE.md"}],"links":[]}\n';

// No hook of the host's: `init` armed the brain's, and the host's multivac
// would answer them.
const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-c', 'core.hooksPath=/dev/null', '-C', cwd, ...args], { encoding: 'utf8' }).trim();

/** A graphify stub that logs `<cwd> <argv>` to `runs`, and writes the artifact where it runs. */
function stub(tmp: string): { bin: string; runs: string } {
  const bin = join(tmp, 'bin');
  const runs = join(tmp, 'runs.log');
  mkdirSync(bin, { recursive: true });
  writeFileSync(
    join(bin, 'graphify'),
    `#!/bin/sh\necho "$(pwd -P) $*" >> '${runs}'\n[ "$1" = install ] && exit 0\n` +
      `mkdir -p graphify-out && printf '${GRAPH.trim()}\\n' > graphify-out/graph.json\n`,
  );
  chmodSync(join(bin, 'graphify'), 0o755);
  return { bin, runs };
}

/** Run `fn` with stdout and stderr captured, on a PATH of `bin` and git's. */
async function on(bin: string, fn: () => Promise<number>): Promise<{ code: number; out: string }> {
  const lines: string[] = [];
  const orig = { log: console.log, error: console.error, path: process.env.PATH };
  console.log = console.error = (...a: unknown[]) => {
    lines.push(a.map(String).join(' '));
  };
  process.env.PATH = `${bin}:/usr/bin:/bin`;
  try {
    return { code: await fn(), out: lines.join('\n') };
  } finally {
    console.log = orig.log;
    console.error = orig.error;
    process.env.PATH = orig.path;
  }
}

test('a code-less brain is never built, gated, refreshed or landed — MV-148', async () => {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-codeless-')));
  const brain = join(tmp, 'acme-brain');
  const api = join(tmp, 'acme-api');
  initRepo(api, { 'src/server.ts': 'export const port = 8080;\n' });
  mkdirSync(brain);
  const { bin, runs } = stub(tmp);
  const ranIn = (): string[] =>
    existsSync(runs) ? readFileSync(runs, 'utf8').split('\n').filter(Boolean).map((l) => l.split(' ')[0]) : [];
  // A checkout of the brain: the brain, or its change worktree `<slug>/brain`
  // — never a code repo's worktree, which lives under the brain's directory.
  const wts = join(brain, '.multivac/worktrees');
  const inBrain = (): string[] =>
    ranIn().filter((d) =>
      d.startsWith(`${wts}/`) ? /^\/[^/]+\/brain(\/|$)/.test(d.slice(wts.length)) : d === brain || d.startsWith(`${brain}/`),
    );
  const ctx = { cwd: brain };

  // init: an empty repo declaring graphify holds no code — no lookup, no
  // install, no build, and it says so.
  const inited = await on(bin, () => init.run(['--provider', 'claude', '--grapher', 'graphify'], ctx));
  assert.equal(inited.code, 0, inited.out);
  assert.match(inited.out, /^init: graphify is declared, and this brain holds no code/m);
  assert.equal(existsSync(join(brain, 'graphify-out')), false);
  assert.deepEqual(inBrain(), []);

  // The code repo, and a graph an earlier release built in the brain, kept.
  writeFileSync(join(brain, '.multivac/config.yml'), 'doors: [agents, claude]\ngrapher: graphify\nrepos:\n  api: ../acme-api\n');
  mkdirSync(join(brain, 'graphify-out'));
  writeFileSync(join(brain, 'graphify-out/graph.json'), KEPT);
  const projected = await on(bin, () => doorsCommand.run([], ctx));
  assert.equal(projected.code, 0, projected.out);
  assert.match(
    readFileSync(join(brain, 'AGENTS.md'), 'utf8'),
    /^- `graphify-out\/` here is a leftover that holds no code — ask the code repos' graphs above instead; `multivac doctor` prints its removal\.$/m,
  );
  git(brain, 'add', '-A');
  git(brain, 'commit', '-qm', 'multivac init');

  // repos sync builds the code repo's graph, and none in the brain.
  const synced = await on(bin, () => reposCommand.run(['sync'], ctx));
  assert.equal(synced.code, 0, synced.out);
  assert.match(synced.out, /graph graphify @ api: built/);
  assert.doesNotMatch(synced.out, /graph graphify @ brain/);
  assert.ok(ranIn().includes(api), 'the grapher ran in api');
  git(api, 'add', 'graphify-out/graph.json');
  git(api, 'commit', '-qm', 'graph');

  // A brain-file payload to the post-edit hook `doors` wired: it follows
  // edits into code repos only, so it refreshes nothing here.
  const settings = JSON.parse(readFileSync(join(brain, '.claude/settings.json'), 'utf8')) as {
    hooks: { PostToolUse: { hooks: { command: string }[] }[] };
  };
  const hook = settings.hooks.PostToolUse.flatMap((e) => e.hooks.map((h) => h.command)).find((c) => c.includes('graphify update .'));
  assert.ok(hook, 'doors wires the follow hook');
  execFileSync('sh', ['-c', hook!.replace(/ & exit 0$/, '; exit 0')], {
    cwd: brain,
    input: JSON.stringify({ tool_input: { file_path: join(brain, 'AGENTS.md') } }),
    env: { ...process.env, PATH: `${bin}:/usr/bin:/bin` },
  });
  assert.deepEqual(inBrain(), []);

  // A change naming the brain and api, from new to close.
  const created = await on(bin, () => change.run(['new', 'cl', 'Codeless'], ctx));
  assert.equal(created.code, 0, created.out);
  assert.doesNotMatch(created.out, /@ brain/);
  const parsed = await loadChange(brain, 'cl');
  parsed.change.repos = { brain: { status: 'planned' }, api: { status: 'planned' } };
  parsed.change.landing_order = [['brain', 'api']];
  parsed.change.invariants.adds = [];
  await saveChange(brain, parsed);
  git(brain, 'commit', '-qam', 'declare repos');

  const planned = await on(bin, () => change.run(['plan', 'cl'], ctx));
  assert.equal(planned.code, 0, planned.out);
  assert.match(planned.out, new RegExp(`^brain: ${brain} \\(the brain\\)$`, 'm'));
  assert.doesNotMatch(planned.out, /brain==code/);
  assert.match(
    planned.out,
    /^brain: named by this change, but no repos entry is the brain — no code graph is built, gated or landed here; if the change lands code in the brain, declare `brain: \.` under repos: in this change$/m,
  );

  const applied = await on(bin, () => change.run(['apply', 'cl'], ctx));
  assert.equal(applied.code, 0, applied.out);
  const landed = await on(bin, () => change.run(['land', 'cl'], ctx));
  assert.equal(landed.code, 0, landed.out);
  assert.doesNotMatch(landed.out, /graph graphify @ brain/);
  for (const k of ['brain', 'api']) {
    const r = await on(bin, () => change.run(['land', 'cl', '--landed', k], ctx));
    assert.equal(r.code, 0, r.out);
  }
  // Land committed no brain graph on the change branch.
  const base = git(brain, 'rev-parse', '--abbrev-ref', 'HEAD');
  assert.doesNotMatch(git(brain, 'log', '--name-only', '--format=', `${base}..cl`), /graphify-out/);

  const closed = await on(bin, () => change.run(['close', 'cl'], ctx));
  assert.equal(closed.code, 0, closed.out);
  assert.doesNotMatch(closed.out, /graph graphify @ brain|  brain: .*graph/);
  const archive = closed.out.split('\n').find((l) => l.includes('Archive the cl change')) ?? '';
  assert.ok(archive, closed.out);
  assert.doesNotMatch(archive, /graphify-out/, 'the archive commit names no brain graph');

  // Nothing of the grapher ran in the brain or any checkout of it, and the
  // kept graph is byte for byte what it was.
  assert.deepEqual(inBrain(), []);
  assert.equal(readFileSync(join(brain, 'graphify-out/graph.json'), 'utf8'), KEPT);
  for (const p of ['.graphifyignore', '.claude/skills/graphify', '.agents/skills/graphify']) {
    assert.equal(existsSync(join(brain, p)), false, p);
  }
});

test('neither graph gate names a code-less brain — MV-148', async () => {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-codeless-gates-')));
  writeFileSync(join(eco.brain, '.multivac/config.yml'), 'doors: [agents]\ngrapher: graphify\nrepos:\n  api: ../acme-api\n  web: ../acme-web\n');
  const { bin } = stub(mkdtempSync(join(tmpdir(), 'mvac-codeless-bin-')));
  // The brain's graph uncommitted, the code repos' committed: only the brain
  // is out of step, and it is no root.
  mkdirSync(join(eco.brain, 'graphify-out'));
  writeFileSync(join(eco.brain, 'graphify-out/graph.json'), KEPT);
  for (const d of Object.values(eco.repos)) {
    mkdirSync(join(d, 'graphify-out'));
    writeFileSync(join(d, 'graphify-out/graph.json'), GRAPH);
    git(d, 'add', 'graphify-out/graph.json');
    git(d, 'commit', '-qm', 'graph');
  }
  const cfg = await loadConfig(eco.brain);
  let gate = { ok: false, lines: [] as string[] };
  let tracked = { ok: false, lines: [] as string[] };
  await on(bin, async () => {
    gate = await graphGate(eco.brain, cfg, 'x', false);
    tracked = await graphTrackedGate(eco.brain, cfg, 'x', false);
    return 0;
  });
  assert.equal(gate.ok, true, gate.lines.join('\n'));
  assert.equal(tracked.ok, true, tracked.lines.join('\n'));
  assert.doesNotMatch([...gate.lines, ...tracked.lines].join('\n'), /brain/);
  // With no graph at all in the brain, still nothing to judge there.
  rmSync(join(eco.brain, 'graphify-out'), { recursive: true });
  await on(bin, async () => {
    gate = await graphGate(eco.brain, cfg, 'x', false);
    return 0;
  });
  assert.equal(gate.ok, true, gate.lines.join('\n'));
  assert.equal(existsSync(join(eco.brain, 'graphify-out')), false, 'and nothing was built there');
});

// MV-148. A code repo's ignore lines are its own set — its brain mount, and
// never the brain's `specs/`, which in a code repo hid its own `specs/*.spec.ts`
// — written before its first build by `repos sync`, and at `change land` on the
// change's branch. No lifecycle command before land moves a main checkout
// (SC-023).
test("a code repo's ignore lines are its own, at its first build and at land — MV-148", async () => {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-codeless-scope-')));
  const brain = join(tmp, 'acme-brain');
  const api = join(tmp, 'acme-api');
  const web = join(tmp, 'acme-web');
  initRepo(api, { 'src/server.ts': 'export const port = 8080;\n', 'specs/add.spec.ts': 'export {};\n' });
  initRepo(web, { 'src/app.ts': 'export const app = 1;\n', 'graphify-out/graph.json': GRAPH });
  initRepo(brain, {
    '.multivac/config.yml': 'doors: [agents]\nsdd: speckit\nsdd_auto: false\ngrapher: graphify\nrepos:\n  api: ../acme-api\n  web: ../acme-web\n',
    '.multivac/invariants.md':
      '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n',
  });
  const { bin } = stub(tmp);
  const ctx = { cwd: brain };
  const cfg = await loadConfig(brain);
  const spec = grapherSpec('graphify')!;
  const record = (lines: string[]): string => `${lines.join('\n')}\n# multivac: kept out of the graph — ${lines.join(' ')}`;
  assert.ok(graphIgnoreLines(cfg, brain, 'brain', spec).includes('/specs/'), "the brain's own set keeps its specs out");

  // The first build: api's own set.
  const synced = await on(bin, () => reposCommand.run(['sync'], ctx));
  assert.equal(synced.code, 0, synced.out);
  assert.match(synced.out, /graph graphify @ api: built/);
  const apiLines = graphIgnoreLines(cfg, brain, 'api', spec);
  assert.ok(apiLines.includes('/.brain/') && !apiLines.includes('/specs/'), apiLines.join(' '));
  assert.equal(readFileSync(join(api, '.graphifyignore'), 'utf8').trim(), record(apiLines));

  // new, plan and apply over the built roots move no main checkout.
  const status = (): string[] => [api, web].map((d) => git(d, 'status', '--porcelain'));
  const before = status();
  assert.equal((await on(bin, () => change.run(['new', 'scope', 'Scope'], ctx))).code, 0);
  const parsed = await loadChange(brain, 'scope');
  parsed.change.repos = { web: { status: 'planned' } };
  parsed.change.landing_order = [['web']];
  parsed.change.invariants.adds = [];
  await saveChange(brain, parsed);
  git(brain, 'commit', '-qam', 'declare repos');
  for (const verb of ['plan', 'apply']) {
    const r = await on(bin, () => change.run([verb, 'scope'], ctx));
    assert.equal(r.code, 0, r.out);
  }
  assert.deepEqual(status(), before);
  assert.equal(existsSync(join(web, '.graphifyignore')), false);

  // Land: web's own set, appended on the change's branch and committed with the graph.
  const wt = join(brain, '.multivac/worktrees/scope/web');
  const landed = await on(bin, () => change.run(['land', 'scope'], ctx));
  assert.equal(landed.code, 0, landed.out);
  const webLines = graphIgnoreLines(cfg, brain, 'web', spec);
  assert.ok(webLines.includes('/.brain/') && !webLines.includes('/specs/'), webLines.join(' '));
  assert.equal(git(wt, 'show', 'HEAD:.graphifyignore'), record(webLines));
  assert.equal(git(wt, 'status', '--porcelain'), '');
  assert.deepEqual(status(), before, 'land writes in the checkout holding the branch alone');
});
