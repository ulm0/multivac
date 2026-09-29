// MV-148. `change apply` hands out a checkout per repo, and under each it says
// what reaches that checkout's graph from an agent working in the brain: the
// bare verb asks the brain's own directory. Stub graphers on a PATH this file
// builds write what each vendor's state probe reads, in the directory they run
// in; the host's tools never run.

import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, mkdtempSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initRepo } from '../helpers/fixture.js';
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

/** Capture stdout and stderr around a lifecycle call, on a PATH of `bin` and git's. */
async function applied(brain: string, slug: string, keys: string[], bin: string, inPlace: string[] = []): Promise<string> {
  const ctx = { cwd: brain };
  const lines: string[] = [];
  const orig = { log: console.log, error: console.error, path: process.env.PATH };
  console.log = console.error = (...a: unknown[]) => { lines.push(a.map(String).join(' ')); };
  process.env.PATH = `${bin}:/usr/bin:/bin`;
  try {
    assert.equal(await change.run(['new', slug, `Where ${slug}`], ctx), 0, lines.join('\n'));
    const parsed = await loadChange(brain, slug);
    parsed.change.repos = Object.fromEntries(keys.map((k) => [k, { status: 'planned' as const }]));
    parsed.change.landing_order = [keys];
    parsed.change.invariants.adds = [];
    await saveChange(brain, parsed);
    // A file where the worktree would go: git cannot make one, so apply
    // branches the repo in place.
    for (const k of inPlace) {
      mkdirSync(join(brain, '.multivac/worktrees', slug), { recursive: true });
      writeFileSync(join(brain, '.multivac/worktrees', slug, k), 'not a worktree\n');
    }
    lines.length = 0;
    const code = await change.run(['apply', slug], ctx);
    assert.equal(code, 0, lines.join('\n'));
  } finally {
    console.log = orig.log;
    console.error = orig.error;
    process.env.PATH = orig.path;
  }
  return lines.join('\n');
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
    // holds the directory, and a worktree's is never read as an index.
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
    // A local index: the checkout's, for the base — never the worktree's.
    assert.equal(under(out, 'svc', wt('svc')),
      `no codegraph index in this checkout — -p ${repo('svc')} answers for the base, without this branch's edits; ${RELATIVE} ${repo('svc')}; -p at this checkout answers from the nearest index above it, or fails`);
    assert.doesNotMatch(out, /-p [^ ]*\.multivac\/worktrees/);
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
        'doors: [agents]\nrepos:\n  api:\n    path: ../acme-api\n    grapher: graphify\n  svc:\n    path: ../acme-svc\n    grapher: codegraph\n  part:\n    path: ../acme-part\n    grapher: codegraph\n',
    });
    initRepo(join(tmp, 'acme-api'), { 'src/a.ts': 'export const a = 1;\n' });
    initRepo(join(tmp, 'acme-svc'), { 'src/s.ts': 'export const s = 1;\n' });
    // A local index's state read in the repo checkout, not the worktree:
    // a database that is a directory there.
    initRepo(join(tmp, 'acme-part'), { 'src/p.ts': 'export const p = 1;\n', '.gitignore': '.codegraph/\n' });
    mkdirSync(join(tmp, 'acme-part/.codegraph/codegraph.db'), { recursive: true });
    const out = await applied(brain, 'bare', ['api', 'svc', 'part'], stubBin([]));
    outs.push(out);
    const wt = (k: string): string => join(brain, '.multivac/worktrees/bare', k);
    assert.equal(under(out, 'api', wt('api')),
      `no graph here or in ${join(tmp, 'acme-api')} yet — \`change land\` builds and commits one here`);
    assert.equal(under(out, 'svc', wt('svc')),
      `no codegraph index here or in ${join(tmp, 'acme-svc')} yet — -p at either answers from the nearest index above it, or fails`);
    assert.equal(under(out, 'part', wt('part')),
      `its index cannot be pointed at — .codegraph/codegraph.db is not a file in ${join(tmp, 'acme-part')}`);
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
    assert.equal(under(out, 'svc', dir), `its index: -p '${dir.replace(/'/g, "'\\''")}' — ${RELATIVE} this checkout`);
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
    assert.equal(under(out, 'svc', join(tmp, 'acme-svc')), `its index: -p ${q('svc')} — ${RELATIVE} this checkout`);
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
