// MV-128. `init --sdd speckit --grapher graphify` wrote both names and installed
// neither: measured 2026-09-16 on 0.12.0, a fresh repo got no `.specify/` and no
// `graphify-out/`, with the vendors on PATH or without them. init now runs the
// declared tools in the brain, refuses before writing when one it would run is
// missing, and step zero commits what init wrote — never the user's work.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { init } from '../../src/commands/init.js';
import { gitInit, initRepo, vendorPath } from '../helpers/fixture.js';

const vendors = vendorPath();
const bare = [dirname(process.execPath), '/usr/bin', '/bin'].join(delimiter);
const tmp = (): string => mkdtempSync(join(tmpdir(), 'mvac-equip-'));

/** Everything init prints, both streams, under a PATH chosen by the test. */
async function run(argv: string[], cwd: string, path = vendors.path): Promise<{ code: number; out: string }> {
  const lines: string[] = [];
  const orig = { log: console.log, error: console.error, path: process.env.PATH };
  console.log = console.error = (...a: unknown[]) => {
    lines.push(a.map(String).join(' '));
  };
  process.env.PATH = path;
  try {
    return { code: await init.run(argv, { cwd }), out: lines.join('\n') };
  } finally {
    console.log = orig.log;
    console.error = orig.error;
    process.env.PATH = orig.path;
  }
}

const runsOf = (tool: string): number =>
  existsSync(vendors.runs)
    ? readFileSync(vendors.runs, 'utf8').split('\n').filter((l) => l.startsWith(`${tool} `)).length
    : 0;

test('declared at init, installed at init: spec-kit scaffolded and the graph built — MV-128', async () => {
  const dir = tmp();
  gitInit(dir);
  const specify = runsOf('specify');
  const graphify = runsOf('graphify');

  const { code, out } = await run(['--sdd', 'speckit', '--grapher', 'graphify'], dir);
  assert.equal(code, 0, out);
  assert.ok(existsSync(join(dir, '.specify/integration.json')), 'spec-kit is installed in the brain');
  assert.ok(existsSync(join(dir, 'graphify-out/graph.json')), 'the graph is built in the brain');
  assert.equal(runsOf('specify'), specify + 1);
  assert.equal(runsOf('graphify'), graphify + 1);
  assert.match(out, /sdd speckit: scaffolded — brain:\.specify/);

  // A re-run finds both installed and runs neither.
  assert.equal((await run([], dir)).code, 0);
  assert.equal(runsOf('specify'), specify + 1, 'an installed SDD is not re-initialised');
  assert.equal(runsOf('graphify'), graphify + 1, 'a built graph is not rebuilt');
});

test('sdd_auto: false and a tool with no recorded init run nothing — MV-128', async () => {
  const off = tmp();
  gitInit(off);
  mkdirSync(join(off, '.multivac'), { recursive: true });
  writeFileSync(join(off, '.multivac/config.yml'), 'doors: [agents]\nsdd: speckit\nsdd_auto: false\n');
  const before = runsOf('specify');
  assert.equal((await run([], off, bare)).code, 0, 'no binary is required for a tool init will not run');
  assert.equal(runsOf('specify'), before);
  assert.equal(existsSync(join(off, '.specify')), false);

  const opsx = tmp();
  gitInit(opsx);
  const { code, out } = await run(['--sdd', 'opsx'], opsx, bare);
  assert.equal(code, 0, 'opsx has no recorded init, so nothing runs and nothing is required');
  assert.match(out, /does not know this tool's init command and will not guess one/);
});

test('a tool init would run and cannot find refuses init before anything is written — MV-128', async () => {
  for (const flags of [['--sdd', 'speckit'], ['--grapher', 'graphify']]) {
    const dir = tmp(); // exists, and is not a repo yet
    const { code, out } = await run([...flags], dir, bare);
    assert.equal(code, 1, `${flags.join(' ')}: ${out}`);
    assert.match(out, /init refused — /);
    assert.match(out, /found on neither PATH nor brain's node_modules\/\.bin/);
    assert.match(out, flags[1] === 'speckit' ? /github\.com\/github\/spec-kit/ : /graphify/);
    assert.equal(existsSync(join(dir, '.git')), false, 'no git init');
    assert.equal(existsSync(join(dir, '.multivac')), false, 'no brain');
    assert.equal(existsSync(join(dir, 'AGENTS.md')), false, 'no door');
  }
});

test('an installed tool is not required: its binary may be missing — MV-128', async () => {
  const dir = tmp();
  gitInit(dir);
  assert.equal((await run(['--sdd', 'speckit', '--quiet'], dir)).code, 0);
  // Installed now; a machine without spec-kit can still re-run init here.
  assert.equal((await run(['--quiet'], dir, bare)).code, 0);
});

test('step zero names what init wrote, never the user\'s work, never -A — MV-128', async () => {
  const dir = tmp();
  initRepo(dir, { 'src/app.py': 'print(1)\n', 'README.md': '# app\n' });
  writeFileSync(join(dir, 'README.md'), '# app — my uncommitted edit\n');
  writeFileSync(join(dir, 'notes.txt'), 'mine, untracked\n');

  const { code, out } = await run(['--sdd', 'speckit', '--grapher', 'graphify'], dir);
  assert.equal(code, 0, out);
  const zero = out.split('\n').find((l) => /0\. commit what was just written/.test(l)) ?? '';
  assert.match(zero, /git add -- .* && git commit -m "multivac init"/);
  assert.doesNotMatch(zero, /-A/);
  for (const mine of ['README.md', 'notes.txt', 'src']) {
    assert.doesNotMatch(zero, new RegExp(`(?:^|\\s)${mine.replace('.', '\\.')}(?:\\s|$)`), `${mine} is the user's`);
  }
  assert.match(zero, /\s\.multivac(\s|$)/);
  assert.match(zero, /\sAGENTS\.md(\s|$)/);
  assert.match(zero, /\s\.specify(\s|$)/);
  assert.match(zero, /\sgraphify-out\/graph\.json(\s|$)/, 'the shared graph, by its literal path');
  assert.doesNotMatch(zero, /graphify-out\/cache|\sgraphify-out(\s|$)/, 'the vendor-local cache stays out');

  // Running it verbatim commits exactly that, and leaves the user's work dirty.
  const cmd = zero.replace(/^.*?0\. commit what was just written: /, '');
  execFileSync('sh', ['-c', `git -c user.email=t@acme.example -c user.name=t ${cmd.replace(/^git /, '').replace(/ && git commit/, ' && git -c user.email=t@acme.example -c user.name=t commit')}`], { cwd: dir, stdio: 'ignore' });
  const status = execFileSync('git', ['status', '--porcelain'], { cwd: dir, encoding: 'utf8' });
  assert.match(status, /^ M README\.md$/m);
  assert.match(status, /^\?\? notes\.txt$/m);
  assert.doesNotMatch(status, /\.multivac|AGENTS\.md|\.specify|graph\.json/);
});

test('before the first build, the ignore lines go in, appended — MV-128', async () => {
  const dir = tmp();
  initRepo(dir, { '.gitignore': 'node_modules/', 'app.py': 'print(1)\n' }); // no trailing newline: appended cleanly
  const { code, out } = await run(['--grapher', 'graphify'], dir);
  assert.equal(code, 0, out);
  assert.match(out, /graph graphify @ brain: wrote \.graphifyignore \(\+5\) and \.gitignore \(\+2\) before the first build/);
  assert.equal(readFileSync(join(dir, '.gitignore'), 'utf8'), 'node_modules/\ngraphify-out/*\n!graphify-out/graph.json\n');
  assert.match(readFileSync(join(dir, '.graphifyignore'), 'utf8'), /^\.claude\/\n\.multivac\/\n\.specify\/\nspecs\/\nopenspec\/\n$/);
  const zero = out.split('\n').find((l) => /0\. commit what was just written/.test(l)) ?? '';
  assert.match(zero, /\s\.gitignore(\s|$)/);
  assert.match(zero, /\s\.graphifyignore(\s|$)/);
  // Only graph.json of graphify's outputs is left for git to report.
  const status = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: dir, encoding: 'utf8' });
  assert.doesNotMatch(status, /graphify-out\/cache/);
  assert.match(status, /graphify-out\/graph\.json/);
});

test('a rule that already ignores the shared graph is named, and left alone — MV-128', async () => {
  const dir = tmp();
  initRepo(dir, { '.gitignore': 'graphify-out/\n', 'app.py': 'print(1)\n' });
  const { code, out } = await run(['--grapher', 'graphify'], dir);
  assert.equal(code, 0, out);
  assert.match(out, /graphify-out\/graph\.json is ignored by a rule already in this repo, so it cannot be committed — `git check-ignore -v graphify-out\/graph\.json` names the rule/);
  assert.match(readFileSync(join(dir, '.gitignore'), 'utf8'), /^graphify-out\/\n/, 'their line stays first and unedited');
});
