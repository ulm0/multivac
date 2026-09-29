// MV-148. `change apply` hands out a checkout per repo, and under each it says
// what reaches that checkout's graph from an agent working in the brain: the
// bare verb asks the brain's own directory. Stub graphers on a PATH this file
// builds write what each vendor's state probe reads, in the directory they run
// in; the host's tools never run. MV-149: a local index is built or synced in
// each checkout apply hands out, excluded from git through the repository's
// common `info/exclude`, synced at land and removed with the worktree at close.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { initRepo, vendorPath } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { loadChange, saveChange } from '../../src/change/file.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const INVARIANTS = '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n';
const GRAPH = '{"nodes":[],"links":[]}\n';

/** Stub graphers: any verb but `install` writes the artifact where it runs. */
function stubBin(tools: ('graphify' | 'codegraph')[]): string {
  const bin = mkdtempSync(join(tmpdir(), 'mvac-where-bin-'));
  const stub = (name: string, body: string): void => {
    writeFileSync(join(bin, name), `#!/bin/sh\n[ "$1" = install ] && exit 0\n${body}\n`);
    chmodSync(join(bin, name), 0o755);
  };
  if (tools.includes('graphify')) stub('graphify', `mkdir -p graphify-out && printf '${GRAPH.trim()}\\n' > graphify-out/graph.json`);
  if (tools.includes('codegraph')) stub('codegraph', 'mkdir -p .codegraph && printf x > .codegraph/codegraph.db');
  symlinkSync(process.execPath, join(bin, 'node'));
  return bin;
}

/** Capture stdout and stderr around `fn`, on `path` — a PATH this file builds, never the host's. */
async function on(path: string, fn: () => Promise<number>): Promise<{ code: number; out: string }> {
  const lines: string[] = [];
  const orig = { log: console.log, error: console.error, path: process.env.PATH };
  console.log = console.error = (...a: unknown[]) => { lines.push(a.map(String).join(' ')); };
  process.env.PATH = path;
  try {
    return { code: await fn(), out: lines.join('\n') };
  } finally {
    console.log = orig.log;
    console.error = orig.error;
    process.env.PATH = orig.path;
  }
}

/**
 * `change new <slug>` declaring `keys`, one stage. A file where a key in
 * `inPlace` would get its worktree: git cannot make one, so apply branches
 * that repo in place.
 */
async function opened(brain: string, slug: string, keys: string[], path: string, inPlace: string[] = []): Promise<void> {
  const created = await on(path, () => change.run(['new', slug, `Where ${slug}`], { cwd: brain }));
  assert.equal(created.code, 0, created.out);
  const parsed = await loadChange(brain, slug);
  parsed.change.repos = Object.fromEntries(keys.map((k) => [k, { status: 'planned' as const }]));
  parsed.change.landing_order = [keys];
  parsed.change.invariants.adds = [];
  await saveChange(brain, parsed);
  for (const k of inPlace) {
    mkdirSync(join(brain, '.multivac/worktrees', slug), { recursive: true });
    writeFileSync(join(brain, '.multivac/worktrees', slug, k), 'not a worktree\n');
  }
}

/** `change <verb> <slug> [...]` in `brain`, captured on `path`. */
const step = (brain: string, path: string, ...argv: string[]): Promise<{ code: number; out: string }> =>
  on(path, () => change.run(argv, { cwd: brain }));

/** Open `slug` and apply it on a PATH of `bin` and git's; apply's output. */
async function applied(brain: string, slug: string, keys: string[], bin: string, inPlace: string[] = []): Promise<string> {
  const path = `${bin}:/usr/bin:/bin`;
  await opened(brain, slug, keys, path, inPlace);
  const { code, out } = await step(brain, path, 'apply', slug);
  assert.equal(code, 0, out);
  return out;
}

/** The line apply printed under `  <key>: <ws>`, or undefined when the next one is not its. */
function under(out: string, key: string, ws: string): string | undefined {
  const lines = out.split('\n');
  const at = lines.indexOf(`  ${key}: ${ws}`);
  assert.ok(at >= 0, `no workspace line for ${key} at ${ws} in\n${out}`);
  const next = lines[at + 1];
  return next?.startsWith('    ') ? next.slice(4) : undefined;
}

const RELATIVE = 'paths in its answers are relative to';

test("apply names the flag that reaches each checkout's graph — MV-148", async () => {
  const outs: string[] = [];

  // One code-less brain, five repos: a committed graph, a graph equip built in
  // the checkout only, a local index, `none`, an unverified name, and a
  // committed graph that does not parse.
  {
    const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-where-')));
    const brain = join(tmp, 'acme-brain');
    const repo = (k: string): string => join(tmp, `acme-${k}`);
    initRepo(brain, {
      'AGENTS.md': '# door\n',
      '.multivac/invariants.md': INVARIANTS,
      '.multivac/config.yml':
        'doors: [agents]\nrepos:\n' +
        ['api:graphify', 'web:graphify', 'svc:codegraph', 'docs:none', 'misc:mystery', 'bad:graphify']
          .map((s) => s.split(':'))
          .map(([k, g]) => `  ${k}:\n    path: ../acme-${k}\n    grapher: ${g}\n`)
          .join(''),
    });
    initRepo(repo('api'), { 'src/a.ts': 'export const a = 1;\n', 'graphify-out/graph.json': GRAPH });
    initRepo(repo('web'), { 'src/w.ts': 'export const w = 1;\n' });
    // codegraph's own `.codegraph/.gitignore`, committed: every checkout of svc
    // holds the directory, which reads partial until apply builds the index.
    initRepo(repo('svc'), { 'src/s.ts': 'export const s = 1;\n', '.codegraph/.gitignore': '*\n!.gitignore\n' });
    initRepo(repo('docs'), { 'README.md': '# docs\n' });
    initRepo(repo('misc'), { 'README.md': '# misc\n' });
    initRepo(repo('bad'), { 'src/b.ts': 'export const b = 1;\n', 'graphify-out/graph.json': 'not json\n' });
    const out = await applied(brain, 'where', ['api', 'web', 'svc', 'docs', 'misc', 'bad'], stubBin(['graphify', 'codegraph']));
    outs.push(out);
    const wt = (k: string): string => join(brain, '.multivac/worktrees/where', k);

    // The worktree holds the committed graph: its flag.
    assert.equal(under(out, 'api', wt('api')),
      `its graph: --graph ${wt('api')}/graphify-out/graph.json — ${RELATIVE} this checkout`);
    // The first change after equip: the graph is in the checkout, not on the branch.
    assert.equal(under(out, 'web', wt('web')),
      `no graph in this checkout yet (\`change land\` commits one) — --graph ${repo('web')}/graphify-out/graph.json answers for the base, without this branch's edits; ${RELATIVE} ${repo('web')}`);
    // MV-149: a local index apply built in the worktree: its flag, as of this
    // apply — no declared door has a post-edit hook.
    assert.equal(under(out, 'svc', wt('svc')),
      `its index: -p ${wt('svc')} — as of this apply, refreshed again at \`change land\`; ${RELATIVE} this checkout`);
    // No codegraph worktree is ever given `-p <worktree>` unless its index is installed.
    for (const line of out.split('\n').filter((l) => /-p [^ ]*\.multivac\/worktrees/.test(l))) {
      const [, dir] = /-p ([^ ]*) /.exec(line)!;
      assert.ok(line.startsWith('    its index: -p '), line);
      assert.ok(existsSync(join(dir, '.codegraph/codegraph.db')), line);
    }
    // `none`, and a name the registry does not know: nothing.
    assert.equal(under(out, 'docs', wt('docs')), undefined);
    assert.equal(under(out, 'misc', wt('misc')), undefined);
    // A graph that does not parse: named, never pointed at.
    assert.equal(under(out, 'bad', wt('bad')), 'its graph cannot be pointed at — graphify-out/graph.json does not parse as JSON');
  }

  // No binary, so nothing was built anywhere: none yet, and what builds one.
  {
    const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-where-none-')));
    const brain = join(tmp, 'acme-brain');
    initRepo(brain, {
      'AGENTS.md': '# door\n',
      '.multivac/invariants.md': INVARIANTS,
      '.multivac/config.yml':
        'doors: [agents]\nrepos:\n  api:\n    path: ../acme-api\n    grapher: graphify\n  svc:\n    path: ../acme-svc\n    grapher: codegraph\n  part:\n    path: ../acme-part\n    grapher: codegraph\n  base:\n    path: ../acme-base\n    grapher: codegraph\n',
    });
    initRepo(join(tmp, 'acme-api'), { 'src/a.ts': 'export const a = 1;\n' });
    initRepo(join(tmp, 'acme-svc'), { 'src/s.ts': 'export const s = 1;\n' });
    // An index in the repo's checkout, and no binary to build the worktree's:
    // the checkout's, for the base — never the worktree's.
    initRepo(join(tmp, 'acme-base'), { 'src/b.ts': 'export const b = 1;\n', '.gitignore': '.codegraph/\n' });
    mkdirSync(join(tmp, 'acme-base/.codegraph'));
    writeFileSync(join(tmp, 'acme-base/.codegraph/codegraph.db'), 'x');
    // A local index's state read in the repo checkout, not the worktree:
    // a database that is a directory there.
    initRepo(join(tmp, 'acme-part'), { 'src/p.ts': 'export const p = 1;\n', '.gitignore': '.codegraph/\n' });
    mkdirSync(join(tmp, 'acme-part/.codegraph/codegraph.db'), { recursive: true });
    const out = await applied(brain, 'bare', ['api', 'svc', 'part', 'base'], stubBin([]));
    outs.push(out);
    const wt = (k: string): string => join(brain, '.multivac/worktrees/bare', k);
    assert.equal(under(out, 'api', wt('api')),
      `no graph here or in ${join(tmp, 'acme-api')} yet — \`change land\` builds and commits one here`);
    assert.equal(under(out, 'svc', wt('svc')),
      `no codegraph index here or in ${join(tmp, 'acme-svc')} yet — -p at either answers from the nearest index above it, or fails`);
    assert.equal(under(out, 'part', wt('part')),
      `its index cannot be pointed at — .codegraph/codegraph.db is not a file in ${join(tmp, 'acme-part')}`);
    assert.equal(under(out, 'base', wt('base')),
      `no codegraph index in this checkout — -p ${join(tmp, 'acme-base')} answers for the base, without this branch's edits; ${RELATIVE} ${join(tmp, 'acme-base')}; -p at this checkout answers from the nearest index above it, or fails`);
    assert.doesNotMatch(out, /-p [^ ]*\.multivac\/worktrees/);
  }

  // A quote in the path: single-quoted, the quote closed, escaped and reopened
  // as a shell reads it.
  {
    const tmp = realpathSync(mkdtempSync(join(tmpdir(), "mvac-where-o'q-")));
    const brain = join(tmp, 'acme-brain');
    initRepo(brain, {
      'AGENTS.md': '# door\n',
      '.multivac/invariants.md': INVARIANTS,
      '.multivac/config.yml': 'doors: [agents]\nrepos:\n  svc:\n    path: ../acme-svc\n    grapher: codegraph\n',
    });
    initRepo(join(tmp, 'acme-svc'), { '.gitignore': '.codegraph/\n', 'src/x.ts': 'export const x = 1;\n' });
    mkdirSync(join(tmp, 'acme-svc/.codegraph'));
    writeFileSync(join(tmp, 'acme-svc/.codegraph/codegraph.db'), 'x');
    const out = await applied(brain, 'quoted', ['svc'], stubBin([]), ['svc']);
    outs.push(out);
    const dir = join(tmp, 'acme-svc');
    assert.ok(dir.includes("'"));
    assert.equal(under(out, 'svc', dir),
      `its index: -p '${dir.replace(/'/g, "'\\''")}' — as of this apply, refreshed again at \`change land\`; ${RELATIVE} this checkout`);
  }

  // Branched in place, under a directory holding a space: the index there is
  // the checkout's own, and every path is single-quoted.
  {
    const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac where ')));
    const brain = join(tmp, 'acme-brain');
    initRepo(brain, {
      'AGENTS.md': '# door\n',
      '.multivac/invariants.md': INVARIANTS,
      '.multivac/config.yml':
        'doors: [agents]\nrepos:\n  svc:\n    path: ../acme-svc\n    grapher: codegraph\n  idx:\n    path: ../acme-idx\n    grapher: codegraph\n  api:\n    path: ../acme-api\n    grapher: graphify\n',
    });
    for (const k of ['svc', 'idx', 'api']) initRepo(join(tmp, `acme-${k}`), { '.gitignore': '.codegraph/\n', 'src/x.ts': 'export const x = 1;\n' });
    mkdirSync(join(tmp, 'acme-svc/.codegraph'));
    writeFileSync(join(tmp, 'acme-svc/.codegraph/codegraph.db'), 'x');
    const out = await applied(brain, 'inplace', ['svc', 'idx', 'api'], stubBin([]), ['svc', 'idx', 'api']);
    outs.push(out);
    const q = (k: string): string => `'${join(tmp, `acme-${k}`)}'`;
    assert.equal(under(out, 'svc', join(tmp, 'acme-svc')),
      `its index: -p ${q('svc')} — as of this apply, refreshed again at \`change land\`; ${RELATIVE} this checkout`);
    assert.equal(under(out, 'idx', join(tmp, 'acme-idx')),
      'no codegraph index here yet — -p here answers from the nearest index above it, or fails');
    assert.equal(under(out, 'api', join(tmp, 'acme-api')), 'no graph here yet — `change land` builds and commits one here');
  }

  // A brain that holds code: its worktree is pointed at, and its own main
  // checkout, which the door's bare verbs already ask, is not.
  {
    const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-where-code-')));
    const brain = join(tmp, 'acme-brain');
    initRepo(brain, {
      'AGENTS.md': '# door\n',
      '.multivac/invariants.md': INVARIANTS,
      '.multivac/config.yml': 'doors: [agents]\ngrapher: graphify\nrepos:\n  brain: .\n',
      'src/app.ts': 'export const app = 1;\n',
      'graphify-out/graph.json': GRAPH,
      '.agents/skills/graphify/SKILL.md': 'x\n',
    });
    const bin = stubBin(['graphify']);
    const first = await applied(brain, 'code-wt', ['brain'], bin);
    outs.push(first);
    const wt = join(brain, '.multivac/worktrees/code-wt/brain');
    assert.equal(under(first, 'brain', wt), `its graph: --graph ${wt}/graphify-out/graph.json — ${RELATIVE} this checkout`);
    const second = await applied(brain, 'code-here', ['brain'], bin, ['brain']);
    outs.push(second);
    assert.equal(under(second, 'brain', brain), undefined);
  }

  // Every line that offers a flag aimed at a checkout places its answers' paths.
  for (const line of outs.join('\n').split('\n')) {
    if (/(--graph|-p) '?\//.test(line)) assert.ok(line.includes(RELATIVE), line);
  }
});

// --- MV-149: a change's checkout has its own index -----------------------------

/** A code-less brain at `<tmp>/acme-brain` declaring `doors` and, per key, `../acme-<key>` on `grapher`. */
function codelessBrain(tmp: string, doors: string, repos: Record<string, string>, extra = ''): string {
  const brain = join(tmp, 'acme-brain');
  initRepo(brain, {
    'AGENTS.md': '# door\n',
    '.multivac/invariants.md': INVARIANTS,
    '.multivac/config.yml':
      `doors: [${doors}]\nrepos:\n` +
      Object.entries(repos).map(([k, g]) => `  ${k}:\n    path: ../acme-${k}\n    grapher: ${g}\n${extra}`).join(''),
  });
  return brain;
}

/** The lines `vendorPath`'s stubs logged, each `<tool> <argv> cwd=<dir> <opt-outs>`. */
const logged = (runs: string): string[] => (existsSync(runs) ? readFileSync(runs, 'utf8').split('\n').filter(Boolean) : []);

/** The opt-outs codegraph's entry sets on every run multivac makes (MV-124). */
const OPT_OUTS = 'DO_NOT_TRACK=1 CODEGRAPH_TELEMETRY=0 CODEGRAPH_NO_DOWNLOAD=1';

/** A graphify stub beside `vendorPath`'s codegraph that logs the directory it ran in. */
function graphifyBeside(runs: string): void {
  const p = join(dirname(runs), 'graphify');
  writeFileSync(
    p,
    `#!/bin/sh\necho "graphify $* cwd=$PWD" >> '${runs}'\n[ "$1" = install ] && exit 0\n` +
      `mkdir -p graphify-out && printf '${GRAPH.trim()}\\n' > graphify-out/graph.json\n`,
  );
  chmodSync(p, 0o755);
}

const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-c', 'core.hooksPath=/dev/null', '-C', cwd, ...args], { encoding: 'utf8' });

test('apply builds a local index in each checkout it hands out, never a shared one — MV-149', async () => {
  // A post-edit door, and every code repo on codegraph: the brain's hook
  // refreshes it, so the pointer says after your edits. web gets a worktree;
  // svc is branched in place, where `equip` built its index first.
  {
    const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-idx-')));
    const brain = codelessBrain(tmp, 'agents, claude', { web: 'codegraph', svc: 'codegraph' });
    for (const k of ['web', 'svc']) initRepo(join(tmp, `acme-${k}`), { 'src/x.ts': 'export const x = 1;\n', '.gitignore': '.codegraph/\n' });
    const { path, runs } = vendorPath(['codegraph']);
    await opened(brain, 'idx', ['web', 'svc'], path, ['svc']);
    const { code, out } = await step(brain, path, 'apply', 'idx');
    assert.equal(code, 0, out);
    const wt = join(brain, '.multivac/worktrees/idx/web');
    const svc = join(tmp, 'acme-svc');

    assert.ok(existsSync(join(wt, '.codegraph/codegraph.db')), 'the worktree holds its own index');
    assert.ok(logged(runs).includes(`codegraph init cwd=${wt} ${OPT_OUTS}`), logged(runs).join('\n'));
    assert.ok(logged(runs).includes(`codegraph sync cwd=${svc} ${OPT_OUTS}`), 'the repo branched in place is synced');
    const built = out.indexOf('graph codegraph @ web worktree: built (`codegraph init`) — local artifact, never committed');
    assert.ok(built >= 0 && built < out.indexOf('work here'), out);
    assert.match(out, /^graph codegraph @ svc: refreshed \(`codegraph sync`\) — local artifact, never committed$/m);
    assert.equal(under(out, 'web', wt), `its index: -p ${wt} — refreshed after your edits; ${RELATIVE} this checkout`);
    assert.equal(under(out, 'svc', svc), `its index: -p ${svc} — refreshed after your edits; ${RELATIVE} this checkout`);

    // Every apply syncs what an earlier one built: skipping it froze the index.
    const again = await step(brain, path, 'apply', 'idx');
    assert.equal(again.code, 0, again.out);
    assert.ok(logged(runs).includes(`codegraph sync cwd=${wt} ${OPT_OUTS}`), logged(runs).join('\n'));
    assert.match(again.out, /^graph codegraph @ web worktree: refreshed \(`codegraph sync`\) — local artifact, never committed$/m);
  }

  // No post-edit door, and a shared artifact beside it: the pointer says as
  // of this apply, and graphify never runs in a worktree — the branch carries
  // its committed graph.
  {
    const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-idx-mixed-')));
    const brain = codelessBrain(tmp, 'agents', { web: 'codegraph', api: 'graphify' });
    for (const k of ['web', 'api']) initRepo(join(tmp, `acme-${k}`), { 'src/x.ts': 'export const x = 1;\n', '.gitignore': '.codegraph/\n' });
    const { runs } = vendorPath(['codegraph']);
    graphifyBeside(runs);
    const out = await applied(brain, 'mixed', ['web', 'api'], dirname(runs));
    const wt = (k: string): string => join(brain, '.multivac/worktrees/mixed', k);
    assert.equal(under(out, 'web', wt('web')),
      `its index: -p ${wt('web')} — as of this apply, refreshed again at \`change land\`; ${RELATIVE} this checkout`);
    assert.ok(logged(runs).some((l) => l.startsWith('graphify update . cwd=') && l.endsWith(`cwd=${join(tmp, 'acme-api')}`)), 'equip built the repo checkout');
    assert.deepEqual(logged(runs).filter((l) => l.startsWith('graphify') && l.includes('.multivac/worktrees')), []);
    assert.equal(existsSync(join(wt('api'), 'graphify-out')), false);
    assert.doesNotMatch(out, /graph graphify @ api worktree/);
  }

  // codegraph only in the repo's own node_modules/.bin, which a worktree does
  // not hold: equip builds the checkout's index, the worktree gets none, one
  // line says why, and the pointer names the base.
  {
    const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-idx-local-')));
    const brain = codelessBrain(tmp, 'agents', { web: 'codegraph' });
    const web = join(tmp, 'acme-web');
    initRepo(web, { 'src/x.ts': 'export const x = 1;\n', '.gitignore': '.codegraph/\nnode_modules/\n' });
    const { runs } = vendorPath(['codegraph']);
    mkdirSync(join(web, 'node_modules/.bin'), { recursive: true });
    writeFileSync(join(web, 'node_modules/.bin/codegraph'), readFileSync(join(dirname(runs), 'codegraph')));
    chmodSync(join(web, 'node_modules/.bin/codegraph'), 0o755);
    const bare = mkdtempSync(join(tmpdir(), 'mvac-idx-bare-'));
    symlinkSync(process.execPath, join(bare, 'node'));
    const excludeBefore = readFileSync(join(web, '.git/info/exclude'), 'utf8');
    const out = await applied(brain, 'local', ['web'], bare);
    const wt = join(brain, '.multivac/worktrees/local/web');
    assert.ok(existsSync(join(web, '.codegraph/codegraph.db')), "equip built the repo's own checkout");
    assert.equal(existsSync(join(wt, '.codegraph/codegraph.db')), false, 'no worktree index');
    assert.equal(readFileSync(join(web, '.git/info/exclude'), 'utf8'), excludeBefore, 'no exclude write where nothing is built');
    const missing = out.split('\n').filter((l) => l.includes('found on neither PATH nor'));
    assert.deepEqual(missing.map((l) => l.split(' — ')[0]), ['graph codegraph @ web worktree: build skipped'], out);
    assert.match(missing[0], /`codegraph` found on neither PATH nor web worktree's node_modules\/\.bin — install codegraph: npm i -g @colbymchenry\/codegraph \(https:\/\/github\.com\/colbymchenry\/codegraph\), then `codegraph init` there$/);
    assert.equal(under(out, 'web', wt),
      `no codegraph index in this checkout — -p ${web} answers for the base, without this branch's edits; ${RELATIVE} ${web}; -p at this checkout answers from the nearest index above it, or fails`);
    assert.doesNotMatch(out, /-p [^ ]*\.multivac\/worktrees/);
  }

  // No codegraph anywhere, and the repo's own checkout never indexed: equip
  // named the binary for the repo, and the worktree adds no line of its own.
  {
    const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-idx-none-')));
    const brain = codelessBrain(tmp, 'agents', { web: 'codegraph' });
    initRepo(join(tmp, 'acme-web'), { 'src/x.ts': 'export const x = 1;\n' });
    const bare = mkdtempSync(join(tmpdir(), 'mvac-idx-bare-'));
    symlinkSync(process.execPath, join(bare, 'node'));
    const out = await applied(brain, 'none', ['web'], bare);
    const missing = out.split('\n').filter((l) => l.includes('found on neither PATH nor'));
    assert.ok(missing.length > 0, out);
    for (const l of missing) assert.match(l, /^graph codegraph @ web: build skipped — `codegraph` found on neither PATH nor web's node_modules/, l);
    assert.doesNotMatch(out, /web worktree/);
  }

  // A build that fails: a warning quoting the tool's cause, exit 0, and the
  // pointer names the base the repo's checkout holds.
  {
    const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-idx-fail-')));
    const brain = codelessBrain(tmp, 'agents', { web: 'codegraph' });
    const web = join(tmp, 'acme-web');
    initRepo(web, { 'src/x.ts': 'export const x = 1;\n', '.gitignore': '.codegraph/\n' });
    mkdirSync(join(web, '.codegraph'));
    writeFileSync(join(web, '.codegraph/codegraph.db'), 'x');
    const bin = mkdtempSync(join(tmpdir(), 'mvac-idx-failing-'));
    writeFileSync(join(bin, 'codegraph'), '#!/bin/sh\necho "Error: database is locked" >&2\nexit 1\n');
    chmodSync(join(bin, 'codegraph'), 0o755);
    symlinkSync(process.execPath, join(bin, 'node'));
    const out = await applied(brain, 'fails', ['web'], bin);
    const wt = join(brain, '.multivac/worktrees/fails/web');
    assert.match(out, /^graph codegraph @ web worktree: build failed \(Error: database is locked\) — run `codegraph init` there by hand$/m);
    assert.equal(under(out, 'web', wt),
      `no codegraph index in this checkout — -p ${web} answers for the base, without this branch's edits; ${RELATIVE} ${web}; -p at this checkout answers from the nearest index above it, or fails`);
  }

  // A repo multivac may not write in is refused before anything is built.
  {
    const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-idx-ro-')));
    const brain = codelessBrain(tmp, 'agents', { web: 'codegraph' }, '    managed: false\n');
    initRepo(join(tmp, 'acme-web'), { 'src/x.ts': 'export const x = 1;\n' });
    const { path, runs } = vendorPath(['codegraph']);
    await opened(brain, 'ro', ['web'], path);
    const refused = await step(brain, path, 'apply', 'ro');
    assert.equal(refused.code, 1, refused.out);
    assert.match(refused.out, /^web: not managed, read-only — /m);
    assert.deepEqual(logged(runs), []);
  }
});

test("a prompt on the grapher's stdin never hangs apply — MV-149", { timeout: 20_000 }, async () => {
  // codegraph 1.6.0 with its watcher off prompts on `init`: the runner closes
  // the child's stdin, so the prompt reads end-of-file and the build goes on.
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-idx-stdin-')));
  const brain = codelessBrain(tmp, 'agents', { web: 'codegraph' });
  initRepo(join(tmp, 'acme-web'), { 'src/x.ts': 'export const x = 1;\n', '.gitignore': '.codegraph/\n' });
  const { runs } = vendorPath(['codegraph'], { codegraphReads: true });
  const out = await applied(brain, 'stdin', ['web'], dirname(runs));
  const wt = join(brain, '.multivac/worktrees/stdin/web');
  assert.ok(existsSync(join(wt, '.codegraph/codegraph.db')), out);
  assert.match(out, /graph codegraph @ web worktree: built/);
});

test('the worktree index leaves the worktree clean and goes with it at close — MV-149', async () => {
  // web: no `.gitignore` committed — `equip` writes `.codegraph/` into an
  // untracked one in the repo's checkout, which the worktree never sees. api:
  // a committed `.gitignore` of `*.db` alone, which ignores the database and
  // not codegraph's own `.codegraph/.gitignore`. svc commits `.codegraph/`.
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-idx-clean-')));
  const brain = codelessBrain(tmp, 'agents', { web: 'codegraph', api: 'codegraph', svc: 'codegraph' });
  const repo = (k: string): string => join(tmp, `acme-${k}`);
  initRepo(repo('web'), { 'src/w.ts': 'export const w = 1;\n' });
  initRepo(repo('api'), { 'src/a.ts': 'export const a = 1;\n', '.gitignore': '*.db\n' });
  initRepo(repo('svc'), { 'src/s.ts': 'export const s = 1;\n', '.gitignore': '.codegraph/\n' });
  const { path } = vendorPath(['codegraph']);
  const wt = (k: string): string => join(brain, '.multivac/worktrees/clean', k);
  const exclude = (k: string): string => readFileSync(join(repo(k), '.git/info/exclude'), 'utf8');
  const svcExclude = exclude('svc');

  await opened(brain, 'clean', ['web', 'api', 'svc'], path);
  const first = await step(brain, path, 'apply', 'clean');
  assert.equal(first.code, 0, first.out);
  for (const k of ['web', 'api']) {
    const line = `${k}: .codegraph/ added to ${join(repo(k), '.git')}/info/exclude — git ignored no index here, and that file is never committed`;
    assert.ok(first.out.split('\n').includes(line), first.out);
    assert.equal(Buffer.byteLength(`${line}\n`), 104 + k.length - 3 + Buffer.byteLength(join(repo(k), '.git')));
    assert.match(exclude(k), /^\.codegraph\/$/m);
  }
  assert.equal(exclude('svc'), svcExclude, 'a repo that ignores it gets no exclude write');
  assert.doesNotMatch(first.out, /^svc: .* added to /m);
  for (const k of ['web', 'api', 'svc']) {
    assert.ok(existsSync(join(wt(k), '.codegraph/codegraph.db')), k);
    assert.equal(git(wt(k), 'status', '--porcelain'), '', `${k} worktree clean after apply`);
  }
  assert.equal(readFileSync(join(wt('api'), '.gitignore'), 'utf8'), '*.db\n', 'the tracked .gitignore is byte-identical');
  assert.equal(existsSync(join(wt('web'), '.gitignore')), false);

  // A second apply finds the line: nothing appended, nothing said.
  const second = await step(brain, path, 'apply', 'clean');
  assert.equal(second.code, 0, second.out);
  assert.doesNotMatch(second.out, /added to .*info\/exclude/);
  assert.equal(exclude('web').match(/^\.codegraph\/$/gm)?.length, 1);

  // An edit on the branch, then land: synced there, nothing written beside it.
  writeFileSync(join(wt('web'), 'src/n.ts'), 'export const n = 2;\n');
  git(wt('web'), 'add', 'src/n.ts');
  git(wt('web'), 'commit', '-qm', 'n');
  const landed = await step(brain, path, 'land', 'clean');
  assert.equal(landed.code, 0, landed.out);
  assert.match(landed.out, /^graph codegraph @ web: refreshed \(`codegraph sync`\) — local artifact, never committed$/m);
  for (const k of ['web', 'api', 'svc']) assert.equal(git(wt(k), 'status', '--porcelain'), '', `${k} worktree clean after land`);
  assert.equal(existsSync(join(wt('web'), '.gitignore')), false, 'land writes no .gitignore');
  assert.equal(readFileSync(join(wt('api'), '.gitignore'), 'utf8'), '*.db\n');

  // Merged: a plain removal takes each worktree and its index.
  for (const k of ['web', 'api', 'svc']) {
    const r = await step(brain, path, 'land', 'clean', '--landed', k);
    assert.equal(r.code, 0, r.out);
  }
  const closed = await step(brain, path, 'close', 'clean');
  assert.equal(closed.code, 0, closed.out);
  for (const k of ['web', 'api', 'svc']) {
    assert.ok(closed.out.split('\n').includes(`${k}: worktree removed (${wt(k)})`), closed.out);
    assert.equal(existsSync(wt(k)), false);
  }

  // apply with no codegraph, land with it: land builds the index after the
  // same exclude step, and the worktree is still clean and removed at close.
  {
    const late = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-idx-late-')));
    const lateBrain = codelessBrain(late, 'agents', { ops: 'codegraph' });
    const ops = join(late, 'acme-ops');
    initRepo(ops, { 'src/o.ts': 'export const o = 1;\n', '.gitignore': '*.db\n' });
    const bare = mkdtempSync(join(tmpdir(), 'mvac-idx-bare-'));
    symlinkSync(process.execPath, join(bare, 'node'));
    await applied(lateBrain, 'late', ['ops'], bare);
    const lateWt = join(lateBrain, '.multivac/worktrees/late/ops');
    assert.equal(existsSync(join(lateWt, '.codegraph')), false);
    const lateLand = await step(lateBrain, path, 'land', 'late');
    assert.equal(lateLand.code, 0, lateLand.out);
    assert.match(lateLand.out, /^ops: \.codegraph\/ added to .*info\/exclude — /m);
    assert.match(lateLand.out, /^graph codegraph @ ops: built \(`codegraph init`\) — local artifact, never committed$/m);
    assert.ok(existsSync(join(lateWt, '.codegraph/codegraph.db')));
    assert.equal(git(lateWt, 'status', '--porcelain'), '');
    assert.equal((await step(lateBrain, path, 'land', 'late', '--landed', 'ops')).code, 0);
    const lateClose = await step(lateBrain, path, 'close', 'late');
    assert.equal(lateClose.code, 0, lateClose.out);
    assert.ok(lateClose.out.split('\n').includes(`ops: worktree removed (${lateWt})`), lateClose.out);
  }
});

// MV-149. The exclude step asks git of the index's directory as git walks the
// tree. A repo's `.gitignore` can ignore everything under `.codegraph/` and
// still let codegraph's own `!.gitignore` back in: asked of the line's text,
// git answered "ignored" for these four spellings and the worktree then
// listed `?? .codegraph/`. Only a line excluding the directory itself keeps
// git out of it, and there nothing is written.
test("the exclude step asks git of the index's directory, as git walks it", async () => {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-idx-spell-')));
  const spellings: Record<string, [line: string, excluded: boolean]> = {
    star: ['.codegraph/*', false],
    globstar: ['.codegraph/**', false],
    anchored: ['/.codegraph/*', false],
    deep: ['**/.codegraph/*', false],
    bare: ['.codegraph', true],
    dir: ['/.codegraph/', true],
    deepdir: ['**/.codegraph', true],
  };
  const keys = Object.keys(spellings);
  const brain = codelessBrain(tmp, 'agents', Object.fromEntries(keys.map((k) => [k, 'codegraph'])));
  const repo = (k: string): string => join(tmp, `acme-${k}`);
  for (const [k, [line]] of Object.entries(spellings)) initRepo(repo(k), { 'src/x.ts': 'export const x = 1;\n', '.gitignore': `${line}\n` });
  const { path } = vendorPath(['codegraph']);
  const wt = (k: string): string => join(brain, '.multivac/worktrees/spell', k);
  const exclude = (k: string): string => readFileSync(join(repo(k), '.git/info/exclude'), 'utf8');
  const before = Object.fromEntries(keys.map((k) => [k, exclude(k)]));
  await opened(brain, 'spell', keys, path);
  const applied = await step(brain, path, 'apply', 'spell');
  assert.equal(applied.code, 0, applied.out);
  for (const [k, [line, excluded]] of Object.entries(spellings)) {
    assert.ok(existsSync(join(wt(k), '.codegraph/.gitignore')), `${k}: codegraph's own .gitignore`);
    assert.equal(git(wt(k), 'status', '--porcelain'), '', `${k} (${line}): the worktree lists nothing`);
    const said = applied.out.split('\n').some((l) => l.startsWith(`${k}: .codegraph/ added to `));
    assert.equal(said, !excluded, `${k} (${line}): ${applied.out}`);
    if (excluded) assert.equal(exclude(k), before[k], `${k} (${line}): nothing written`);
    else assert.match(exclude(k), /^\.codegraph\/$/m, k);
  }
  // Asked again once codegraph's own `*` stands in the worktree: without the
  // line, the directory is still not ignored, and the line comes back.
  writeFileSync(join(repo('star'), '.git/info/exclude'), before.star!);
  assert.match(git(wt('star'), 'status', '--porcelain'), /^\?\? \.codegraph\/$/m);
  const again = await step(brain, path, 'apply', 'spell');
  assert.equal(again.code, 0, again.out);
  assert.ok(again.out.split('\n').some((l) => l.startsWith('star: .codegraph/ added to ')), again.out);
  assert.equal(git(wt('star'), 'status', '--porcelain'), '');
  assert.doesNotMatch(again.out, /^(?!star)\w+: \.codegraph\/ added to /m);
});

// MV-149: one post-edit hook per grapher, so in a code-less brain whose repos
// resolve graphify and codegraph, codegraph's follow hook refreshes api's
// worktree index after an edit there — #5's one hook ran neither, and the
// pointer said as of this apply.
test("a mixed brain's codegraph worktree is refreshed after edits", async () => {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-idx-hooked-')));
  const brain = codelessBrain(tmp, 'agents, claude', { web: 'graphify', api: 'codegraph' });
  for (const k of ['web', 'api']) initRepo(join(tmp, `acme-${k}`), { 'src/x.ts': 'export const x = 1;\n', '.gitignore': '.codegraph/\n' });
  const { runs } = vendorPath(['codegraph']);
  graphifyBeside(runs);
  const out = await applied(brain, 'hooked', ['web', 'api'], dirname(runs));
  const wt = join(brain, '.multivac/worktrees/hooked/api');
  assert.equal(under(out, 'api', wt), `its index: -p ${wt} — refreshed after your edits; ${RELATIVE} this checkout`);
});
