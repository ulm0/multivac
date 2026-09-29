// MV-124 across the surfaces: `change new`, `apply`, `close`, `doctor` and
// `doors` act on the vendor's own state files, codegraph's database stays in
// its checkout, and every run carries the opt-outs its entry declares.
//
// Tools are STUBS on a PATH this file builds — `<bin>:/usr/bin:/bin` — never
// the host's (Principle IV). Each stub writes what the real tool writes, and
// appends its argv, or the environment it saw, to a marker.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { initRepo } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { doctorReport } from '../../src/commands/doctor.js';
import { doorsCommand } from '../../src/commands/doors.js';
import { loadChange, saveChange } from '../../src/change/file.js';
import { SPECKIT_INTEGRATION_JSON } from '../helpers/recorded.js';
import { writeIgnores } from '../../src/adapters/refresh.js';
import { grapherSpec } from '../../src/adapters/registry.js';

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

const LAW = '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n';

const write = (file: string, body: string, mode?: number): void => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body);
  if (mode !== undefined) chmodSync(file, mode);
};

const lines = (file: string): string[] => (existsSync(file) ? readFileSync(file, 'utf8').split('\n').filter(Boolean) : []);

/** A brain repo with `config` and `files` committed, a stub bin, and its marker. */
function brainWith(config: string, files: Record<string, string> = {}) {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-vstate-'));
  const brain = join(tmp, 'acme-brain');
  initRepo(brain, { 'AGENTS.md': '# door\n', '.multivac/config.yml': config, '.multivac/invariants.md': LAW, ...files });
  const bin = join(tmp, 'bin');
  mkdirSync(bin, { recursive: true });
  return { tmp, brain, bin, marker: join(tmp, 'ran'), ctx: { cwd: brain } };
}

/** Run `fn` with PATH built from `bin`, and the parent opting IN to tracking. */
async function inEnv<T>(bin: string, fn: () => Promise<T>): Promise<T> {
  const keys = ['PATH', 'DO_NOT_TRACK', 'OPENSPEC_TELEMETRY', 'CODEGRAPH_TELEMETRY', 'CODEGRAPH_NO_DOWNLOAD'];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  process.env.PATH = [bin, '/usr/bin', '/bin'].join(delimiter);
  process.env.DO_NOT_TRACK = '0';
  for (const k of keys.slice(2)) delete process.env[k];
  try {
    return await fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

/** Open `slug` on the brain alone and walk it to just before close. */
async function toClose(brain: string, slug: string): Promise<void> {
  const ctx = { cwd: brain };
  await capture(() => change.run(['new', slug, slug], ctx));
  const parsed = await loadChange(brain, slug);
  parsed.change.repos = { brain: { status: 'planned' } };
  parsed.change.landing_order = [['brain']];
  parsed.change.invariants.adds = [];
  await saveChange(brain, parsed);
  await capture(() => change.run(['apply', slug, '--no-sdd'], ctx));
  await capture(() => change.run(['land', slug, '--landed', 'brain', '--no-sdd'], ctx));
}

/** A stub codegraph: `init` writes the database unless told not to; `sync` refuses without it, as 1.6.0 does. */
function stubCodegraph(bin: string, marker: string, { writes = true } = {}): void {
  write(
    join(bin, 'codegraph'),
    '#!/bin/sh\n' +
      `echo "$1 $([ -f .codegraph/codegraph.db ] && echo db || echo nodb) $DO_NOT_TRACK $CODEGRAPH_TELEMETRY $CODEGRAPH_NO_DOWNLOAD" >> '${marker}'\n` +
      'case "$1" in\n' +
      `  init) mkdir -p .codegraph${writes ? ' && : > .codegraph/codegraph.db' : ''} ;;\n` +
      '  sync) [ -f .codegraph/codegraph.db ] || { echo "✗ CodeGraph not initialized"; exit 1; } ;;\n' +
      'esac\n',
    0o755,
  );
}

const graphRefused = (out: string): boolean => /graph: `change close [^`]*` refused/.test(out);

// --- SC-002: the measured cases ---

test('a hand-made .specify is partial: change new runs no init and warns, and doctor says so', async () => {
  const b = brainWith('doors: [agents]\nsdd: speckit\nrepos:\n  brain: .\n');
  mkdirSync(join(b.brain, '.specify'));
  write(join(b.bin, 'specify'), `#!/bin/sh\necho "$@" >> '${b.marker}'\n`, 0o755);
  await inEnv(b.bin, async () => {
    const c = await capture(() => change.run(['new', 'by-hand', 'By hand'], b.ctx));
    assert.equal(c.code, 0);
    assert.deepEqual(lines(b.marker), [], 'the init ran over a directory made by hand');
    assert.match(c.out, /sdd speckit: brain is partial — \.specify is there and \.specify\/integration\.json is not/);
    const sdd = (await doctorReport(b.brain)).lines.find((l) => l.startsWith('sdd') && l.includes('speckit @ brain'))!;
    assert.match(sdd, /speckit @ brain: partial \(\.specify is there and \.specify\/integration\.json is not\) — the lifecycle will not run the init over it, since a re-run can revert edited files; run `specify init /);
  });
});

test('an unreadable integration.json runs no init and says it cannot be read', { skip: process.getuid?.() === 0 }, async () => {
  const b = brainWith('doors: [agents]\nsdd: speckit\nrepos:\n  brain: .\n');
  write(join(b.brain, '.specify/integration.json'), SPECKIT_INTEGRATION_JSON, 0o000);
  write(join(b.bin, 'specify'), `#!/bin/sh\necho "$@" >> '${b.marker}'\n`, 0o755);
  try {
    await inEnv(b.bin, async () => {
      const c = await capture(() => change.run(['new', 'locked', 'Locked'], b.ctx));
      assert.deepEqual(lines(b.marker), []);
      assert.match(c.out, /sdd speckit: brain is unevaluable — cannot read \.specify\/integration\.json: EACCES/);
      // Unreadable is a permissions problem: doctor names no init for it.
      const sdd = (await doctorReport(b.brain)).lines.find((l) => l.startsWith('sdd') && l.includes('speckit @ brain'))!;
      assert.match(sdd, /speckit @ brain: unevaluable \(cannot read \.specify\/integration\.json: EACCES\) — make it readable; no init is run over it · /);
      assert.doesNotMatch(sdd, /specify init/);
    });
  } finally {
    chmodSync(join(b.brain, '.specify/integration.json'), 0o644);
  }
});

test('opsx specs without its config are partial: warned with the install line, and nothing runs', async () => {
  const b = brainWith('doors: [agents]\nsdd: opsx\nrepos:\n  brain: .\n', { 'openspec/specs/auth/spec.md': '# Auth\n' });
  write(join(b.bin, 'openspec'), `#!/bin/sh\necho "$@" >> '${b.marker}'\n`, 0o755);
  await inEnv(b.bin, async () => {
    const c = await capture(() => change.run(['new', 'half', 'Half'], b.ctx));
    assert.deepEqual(lines(b.marker), []);
    assert.match(c.out, /sdd opsx: brain is partial — openspec is there and openspec\/config\.yaml or openspec\/config\.yml is not — the init is not run over it.*run `openspec init --tools none --no-animation \.` in brain yourself/);
  });
});

test('a committed 0-byte graph.json is rebuilt at close, and a build that leaves it is refused', async () => {
  for (const writes of [true, false]) {
    const b = brainWith('doors: [agents]\ngrapher: graphify\nrepos:\n  brain: .\n', { 'graphify-out/graph.json': '' });
    await inEnv(b.bin, async () => {
      await toClose(b.brain, 'zero');
      write(
        join(b.bin, 'graphify'),
        `#!/bin/sh\necho "$@" >> '${b.marker}'\n${writes ? "mkdir -p graphify-out && echo '{}' > graphify-out/graph.json\n" : ''}`,
        0o755,
      );
      const c = await capture(() => change.run(['close', 'zero'], b.ctx));
      assert.ok(lines(b.marker).includes('update .'), 'close built the graph');
      if (writes) {
        assert.match(c.out, /graph graphify @ brain: built/);
        assert.equal(graphRefused(c.out), false, c.out);
        assert.equal(c.code, 0, c.out);
      } else {
        assert.equal(c.code, 1);
        assert.match(c.out, /brain: graphify-out\/graph\.json does not parse as JSON — `graphify update \.` there/);
      }
    });
  }
});

test('an unreadable graph.json gets neither build nor refresh, close refuses it as unchecked, and doctor says so', { skip: process.getuid?.() === 0 }, async () => {
  const b = brainWith('doors: [agents]\ngrapher: graphify\nrepos:\n  brain: .\n', { 'graphify-out/graph.json': '{}\n' });
  const graph = join(b.brain, 'graphify-out/graph.json');
  try {
    await inEnv(b.bin, async () => {
      await toClose(b.brain, 'locked-graph');
      write(join(b.bin, 'graphify'), `#!/bin/sh\necho "$@" >> '${b.marker}'\n`, 0o755);
      chmodSync(graph, 0o000);
      const c = await capture(() => change.run(['close', 'locked-graph'], b.ctx));
      assert.deepEqual(lines(b.marker), [], 'a vendor ran over a graph that could not be read');
      assert.match(c.out, /graph graphify @ brain: build and refresh skipped — cannot read graphify-out\/graph\.json: EACCES/);
      assert.equal(c.code, 1, c.out);
      assert.match(c.out, /brain: cannot be checked — cannot read graphify-out\/graph\.json: EACCES/);
      const grapher = (await doctorReport(b.brain)).lines.find((l) => l.startsWith('grapher') && l.includes('graphify @ brain'))!;
      assert.match(grapher, /graphify @ brain: unevaluable \(cannot read graphify-out\/graph\.json: EACCES\)/);
      assert.doesNotMatch(grapher, /graphify update/);
    });
  } finally {
    chmodSync(graph, 0o644);
  }
});

test('doctor names a 0-byte graph.json partial, with the build to run', async () => {
  const b = brainWith('doors: [agents]\ngrapher: graphify\nrepos:\n  brain: .\n', { 'graphify-out/graph.json': '' });
  write(join(b.bin, 'graphify'), '#!/bin/sh\n', 0o755);
  await inEnv(b.bin, async () => {
    const grapher = (await doctorReport(b.brain)).lines.find((l) => l.startsWith('grapher') && l.includes('graphify @ brain'))!;
    assert.match(grapher, /graphify @ brain: partial \(graphify-out\/graph\.json does not parse as JSON\) → run `graphify update \.` there/);
  });
});

test('a codegraph clone without its database builds it at close, keeps it local, and passes both gates', async () => {
  for (const writes of [true, false]) {
    const origin = brainWith('doors: [agents]\ngrapher: codegraph\nrepos:\n  brain: .\n', {
      '.codegraph/.gitignore': 'codegraph.db\n',
    });
    const brain = join(origin.tmp, 'clone');
    execFileSync('git', ['clone', '-q', origin.brain, brain]);
    const ignoreBefore = readFileSync(join(brain, '.codegraph/.gitignore'));
    await inEnv(origin.bin, async () => {
      await toClose(brain, 'clone');
      stubCodegraph(origin.bin, origin.marker, { writes });
      const c = await capture(() => change.run(['close', 'clone'], { cwd: brain }));
      const ran = lines(origin.marker);
      assert.ok(ran.some((l) => l.startsWith('init nodb')), `init ran: ${ran.join(' / ')}`);
      assert.equal(ran.some((l) => l.startsWith('sync nodb')), false, 'sync ran on a clone with no database');
      if (!writes) {
        assert.equal(c.code, 1);
        assert.match(c.out, /brain: \.codegraph is there and \.codegraph\/codegraph\.db is not — `codegraph init` there — a local artifact is built in each checkout/);
        return;
      }
      assert.equal(c.code, 0, c.out);
      assert.equal(graphRefused(c.out), false);
      assert.ok(existsSync(join(brain, '.codegraph/codegraph.db')));
      assert.equal(execFileSync('git', ['-C', brain, 'ls-files', '.codegraph/codegraph.db'], { encoding: 'utf8' }), '');
      const grapher = (await doctorReport(brain)).lines.find((l) => l.startsWith('grapher') && l.includes('codegraph @ brain'))!;
      assert.match(grapher, /codegraph @ brain: installed \(local\) · binary ok/);
      assert.doesNotMatch(grapher, /NOT COMMITTED/);
      // Declared, not acted on: no ignore file is written by this change.
      assert.deepEqual(readFileSync(join(brain, '.codegraph/.gitignore')), ignoreBefore);
      assert.equal(existsSync(join(brain, '.graphifyignore')), false);
      // MV-149: a brain that holds code and nests no repo keeps no line out.
      assert.equal(existsSync(join(brain, 'codegraph.json')), false);
    });
  }
});

// --- SC-003: the opt-outs are applied on every run ---

test("opsx's validator at apply runs with the entry's opt-outs over the parent's", async () => {
  const b = brainWith('doors: [agents]\nsdd: opsx\nrepos:\n  brain: .\n', { 'openspec/config.yaml': 'schema: spec-driven\n' });
  write(join(b.bin, 'openspec'), `#!/bin/sh\necho "$DO_NOT_TRACK $OPENSPEC_TELEMETRY" >> '${b.marker}'\n`, 0o755);
  await inEnv(b.bin, async () => {
    await capture(() => change.run(['new', 'env-a', 'Env a'], b.ctx));
    write(join(b.brain, 'openspec/changes/env-a/proposal.md'), '# Proposal\n');
    write(join(b.brain, 'openspec/changes/env-a/tasks.md'), '- [x] 1.1 done\n');
    const c = await capture(() => change.run(['apply', 'env-a'], b.ctx));
    assert.deepEqual(lines(b.marker), ['1 0'], c.out);
  });
});

test("codegraph's build, refresh and post-edit hook carry its opt-outs; graphify inherits the parent's", async () => {
  const b = brainWith('doors: [agents, claude]\ngrapher: codegraph\nrepos:\n  brain: .\n', {
    '.codegraph/.gitignore': 'codegraph.db\n',
  });
  await inEnv(b.bin, async () => {
    await toClose(b.brain, 'env-b');
    stubCodegraph(b.bin, b.marker);
    const c = await capture(() => change.run(['close', 'env-b'], b.ctx));
    assert.equal(c.code, 0, c.out);
    assert.deepEqual(
      lines(b.marker).map((l) => l.split(' ').slice(0, 1).concat(l.split(' ').slice(2)).join(' ')),
      ['init 1 0 1', 'sync 1 0 1'],
    );

    rmSync(b.marker);
    assert.equal(await doorsCommand.run([], b.ctx), 0);
    const settings = JSON.parse(readFileSync(join(b.brain, '.claude/settings.json'), 'utf8')) as {
      hooks: { PostToolUse: { hooks: { command: string }[] }[] };
    };
    const hook = settings.hooks.PostToolUse.flatMap((e) => e.hooks.map((h) => h.command)).find((h) => h.includes('codegraph sync'))!;
    assert.ok(hook, 'doors wired the refresh');
    const r = spawnSync('sh', ['-c', hook], { cwd: b.brain, env: { PATH: [b.bin, '/usr/bin', '/bin'].join(delimiter), DO_NOT_TRACK: '0' } });
    assert.equal(r.status, 0);
    const deadline = Date.now() + 2000;
    while (lines(b.marker).length === 0 && Date.now() < deadline) await new Promise((res) => setTimeout(res, 25));
    assert.deepEqual(lines(b.marker), ['sync db 1 0 1']);
  });

  const g = brainWith('doors: [agents]\ngrapher: graphify\nrepos:\n  brain: .\n');
  // MV-131: the project install writes its probe and is not what this counts.
  write(join(g.bin, 'graphify'), `#!/bin/sh\n[ \"$1\" = install ] && { p=; for a; do p=$a; done; mkdir -p \".$p/skills/graphify\" && : > \".$p/skills/graphify/SKILL.md\"; exit 0; }\necho "$DO_NOT_TRACK" >> '${g.marker}'\nmkdir -p graphify-out && echo '{}' > graphify-out/graph.json\n`, 0o755);
  await inEnv(g.bin, async () => {
    await capture(() => change.run(['new', 'env-c', 'Env c'], g.ctx));
    assert.deepEqual(lines(g.marker), ['0'], 'an entry declaring no env leaves the parent environment alone');
  });
});

// --- MV-149: codegraph.json, spliced ---

/** codegraph's ignore write in a fresh directory holding `raw` (none when null): what it printed and the bytes after. */
async function spliceIn(raw: string | null, lines = ['/.brain/']): Promise<{ out: string; after: string | null; dir: string; wrote: boolean }> {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-cgjson-'));
  if (raw !== null) writeFileSync(join(dir, 'codegraph.json'), raw);
  let wrote = false;
  const c = await capture(async () => {
    wrote = await writeIgnores('codegraph', grapherSpec('codegraph')!, dir, 'web', lines, { gitignore: false });
    return 0;
  });
  const file = join(dir, 'codegraph.json');
  return { out: c.out, after: existsSync(file) ? readFileSync(file, 'utf8') : null, dir, wrote };
}

/** `after` with one contiguous inserted span taken out. */
const withoutInsert = (before: string, after: string): string => {
  let i = 0;
  while (i < before.length && before[i] === after[i]) i++;
  return after.slice(0, i) + after.slice(i + after.length - before.length);
};

test("codegraph's lines are spliced into codegraph.json, every other byte kept", async () => {
  // research.md R14's thirteen shapes: re-serialising dropped a duplicate
  // key, the CRLFs and a number's digits.
  const shapes: Record<string, string> = {
    crlf: '{\r\n  "maxFileSize": 1.50,\r\n  "exclude": [\r\n    "dist/"\r\n  ]\r\n}\r\n',
    'one line': '{"deprioritize":["legacy/"],"exclude":["dist/"]}',
    'human keys': '{\n  "include": ["src/"],\n  "languages": ["typescript"],\n  "exclude": ["dist/"]\n}\n',
    number: '{\n  "maxFileSize": 1.50,\n  "exclude": ["dist/"]\n}\n',
    'duplicate key': '{\n  "exclude": ["a/"],\n  "x": 1,\n  "exclude": [\n    "dist/"\n  ]\n}\n',
    'no trailing newline': '{\n  "exclude": [\n    "dist/"\n  ]\n}',
    escapes: '{\n  "na\\"me": "a\\\\b\\u00e9",\n  "exclude": ["d\\"x/"]\n}\n',
    'inline, key absent': '{"include":["src/"]}',
    'multi-line, key absent': '{\n  "include": [\n    "src/"\n  ],\n  "nested": {\n      "deep": 1\n  }\n}\n',
    '{}': '{}',
    'empty array': '{\n  "exclude": []\n}\n',
    tabs: '{\n\t"exclude": [\n\t\t"dist/"\n\t]\n}\n',
    'CRLF, key absent': '{\r\n  "maxFileSize": 1.50\r\n}\r\n',
  };
  assert.equal(Object.keys(shapes).length, 13);
  for (const [shape, raw] of Object.entries(shapes)) {
    const r = await spliceIn(raw);
    assert.ok(r.after !== null && r.wrote, shape);
    assert.equal(withoutInsert(raw, r.after!), raw, `${shape}: every byte kept`);
    const parsed = JSON.parse(r.after!) as { exclude: string[] };
    assert.equal(parsed.exclude[parsed.exclude.length - 1], '/.brain/', shape);
    assert.equal(r.out, 'graph codegraph @ web: wrote codegraph.json (+1) before the first build', shape);
    // A second write adds nothing and says nothing.
    const again = await capture(async () => {
      await writeIgnores('codegraph', grapherSpec('codegraph')!, r.dir, 'web', ['/.brain/'], { gitignore: false });
      return 0;
    });
    assert.equal(readFileSync(join(r.dir, 'codegraph.json'), 'utf8'), r.after, `${shape}: idempotent`);
    assert.equal(again.out, '', shape);
  }
  // The last `exclude` is the one JSON.parse and codegraph keep.
  const dup = await spliceIn(shapes['duplicate key']!);
  assert.match(dup.after!, /"exclude": \["a\/"\],\n {2}"x": 1,\n {2}"exclude": \[\n {4}"dist\/",\n {4}"\/\.brain\/"\n {2}\]/);
  // CRLF kept on the inserted line, and a key absent goes in at the top-level
  // members' indentation, never a nested one's.
  assert.match((await spliceIn(shapes.crlf!)).after!, /"dist\/",\r\n {4}"\/\.brain\/"\r\n/);
  assert.match((await spliceIn(shapes['multi-line, key absent']!)).after!, /\n {2}\},\n {2}"exclude": \["\/\.brain\/"\]\n\}\n$/);
  // Missing or empty: the 38-byte file.
  for (const raw of [null, '', '\n']) {
    const r = await spliceIn(raw);
    assert.equal(r.after, '{\n  "exclude": [\n    "/.brain/"\n  ]\n}\n');
    assert.equal(Buffer.byteLength(r.after!), 38);
  }
});

test('a line codegraph.json already excludes, in any spelling, is skipped silently', async () => {
  // A leading `**/` too: on 1.6.0 `**/.brain/` and `**/.brain` kept a root
  // `.brain` out as `/.brain/` did (measured).
  for (const entry of ['/.brain/', '.brain/**', '!/.brain/', '/.brain/test/', '.brain', '/.brain/**', '**/.brain/', '**/.brain', '!**/.brain/']) {
    const raw = `{\n  "exclude": [${JSON.stringify(entry)}]\n}\n`;
    const r = await spliceIn(raw);
    assert.equal(r.after, raw, entry);
    assert.equal(r.out, '', entry);
    assert.equal(r.wrote, false, entry);
  }
  // Any other glob naming the mount is not read: the line goes in beside it,
  // a stated ceiling.
  const glob = await spliceIn('{"exclude":[".br*/"]}\n');
  assert.equal(glob.after, '{"exclude":[".br*/", "/.brain/"]}\n');
});

for (const list of ['include', 'includeIgnored', 'deprioritize']) {
  test(`a line codegraph.json's "${list}" names is yours: skipped, and the list named`, async () => {
    // SC-019: `exclude` wins, so an append there dropped the human's 2,247
    // mount nodes to 0 under their `deprioritize`.
    for (const entry of ['.brain/', '!/.brain/', '/.brain/test/', '**/.brain/']) {
      const raw = `{"${list}":[${JSON.stringify(entry)}],"exclude":["dist/"]}\n`;
      const r = await spliceIn(raw);
      assert.equal(r.after, raw, entry);
      assert.equal(r.out, `graph codegraph @ web: /.brain/ not added to codegraph.json — its "${list}" names it, which is yours`, entry);
      if (list === 'deprioritize') assert.equal(Buffer.byteLength(`${r.out}\n`), 108);
    }
  });
}

test('a codegraph.json that does not parse to an object with an "exclude" list is left as it is, and said', async () => {
  const line = 'graph codegraph @ web: codegraph.json does not parse to an object with an "exclude" list — left as it is; add /.brain/ to its "exclude" by hand';
  for (const raw of ['{"exclude":"dist/"}\n', '{\n  // mine\n  "exclude": []\n}\n', '﻿{"exclude":[]}\n', '["dist/"]\n', '{"exclude":[1]}\n', 'not json\n']) {
    const r = await spliceIn(raw);
    assert.equal(r.after, raw, JSON.stringify(raw));
    assert.equal(r.out, line, JSON.stringify(raw));
    assert.equal(r.wrote, false);
  }
  // The contract's 146 B, as printed: the line and its newline.
  assert.equal(Buffer.byteLength(`${line}\n`), 146);
});

test('an empty line set writes no codegraph.json, and says nothing', async () => {
  const r = await spliceIn(null, []);
  assert.equal(r.after, null);
  assert.equal(r.out, '');
  const human = await spliceIn('{bad', []);
  assert.equal(human.after, '{bad');
  assert.equal(human.out, '', 'nothing to add, so nothing to say about their file');
});
