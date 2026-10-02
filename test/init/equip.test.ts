// MV-128. `init --sdd speckit` wrote the name and installed nothing: measured
// 2026-09-16 on 0.12.0, a fresh repo got no `.specify/`, with the vendor on
// PATH or without it. init now runs the declared SDD in the brain, refuses
// before writing when the tool it would run is missing, and step zero commits
// what init wrote — never the user's work.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { init } from '../../src/commands/init.js';
import { change } from '../../src/commands/change.js';
import { doctorReport } from '../../src/commands/doctor.js';
import { gitInit, initRepo, scrubbedEnv, vendorPath } from '../helpers/fixture.js';

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
    ? readFileSync(vendors.runs, 'utf8').split('\n').filter((l) => l.startsWith(`${tool} `) && !l.startsWith(`${tool} install`)).length
    : 0;

test('declared at init, installed at init: spec-kit scaffolded — MV-128', async () => {
  const dir = tmp();
  initRepo(dir, { 'src/app.ts': 'export const app = 1;\n' });
  const specify = runsOf('specify');

  const { code, out } = await run(['--sdd', 'speckit'], dir);
  assert.equal(code, 0, out);
  assert.ok(existsSync(join(dir, '.specify/integration.json')), 'spec-kit is installed in the brain');
  assert.equal(runsOf('specify'), specify + 1);
  assert.match(out, /sdd speckit: scaffolded — brain:\.specify/);
  // MV-153: and nothing else is built.
  assert.equal(existsSync(join(dir, 'graphify-out')), false);

  // A re-run finds it installed and runs nothing.
  assert.equal((await run([], dir)).code, 0);
  assert.equal(runsOf('specify'), specify + 1, 'an installed SDD is not re-initialised');
});

test('sdd_auto: false runs nothing, and opsx is installed like speckit — MV-128, MV-130', async () => {
  const off = tmp();
  gitInit(off);
  mkdirSync(join(off, '.multivac'), { recursive: true });
  writeFileSync(join(off, '.multivac/config.yml'), 'doors: [agents]\nsdd: speckit\nsdd_auto: false\n');
  const before = runsOf('specify');
  assert.equal((await run([], off, bare)).code, 0, 'no binary is required for a tool init will not run');
  assert.equal(runsOf('specify'), before);
  assert.equal(existsSync(join(off, '.specify')), false);

  const missing = tmp();
  const refused = await run(['--sdd', 'opsx'], missing, bare);
  assert.equal(refused.code, 1, 'opsx has a measured init now, so its binary is required');
  assert.match(refused.out, /github\.com\/Fission-AI\/OpenSpec/);

  const opsx = tmp();
  gitInit(opsx);
  const { code, out } = await run(['--sdd', 'opsx'], opsx);
  assert.equal(code, 0, out);
  assert.ok(existsSync(join(opsx, 'openspec/config.yaml')));
});

test('a tool init would run and cannot find refuses init before anything is written — MV-128', async () => {
  for (const flags of [['--sdd', 'speckit']]) {
    const dir = tmp(); // exists, and is not a repo yet
    const { code, out } = await run([...flags], dir, bare);
    assert.equal(code, 1, `${flags.join(' ')}: ${out}`);
    assert.match(out, /init refused — /);
    assert.match(out, /found on neither PATH nor brain's node_modules\/\.bin/);
    assert.match(out, /github\.com\/github\/spec-kit/);
    assert.equal(existsSync(join(dir, '.git')), false, 'no git init');
    assert.equal(existsSync(join(dir, '.multivac')), false, 'no brain');
    assert.equal(existsSync(join(dir, 'AGENTS.md')), false, 'no door');
  }
});

test('untracked source makes the brain code — MV-148', async () => {
  // Tracked files alone were asked: a repo whose source was not committed yet
  // got no `brain: .` (MV-153 keeps the rule MV-148 measured).
  const dir = tmp();
  gitInit(dir);
  mkdirSync(join(dir, 'src'), { recursive: true });
  writeFileSync(join(dir, 'src/server.ts'), 'export const port = 8080;\n');
  const { code, out } = await run([], dir);
  assert.equal(code, 0, out);
  assert.match(readFileSync(join(dir, '.multivac/config.yml'), 'utf8'), /^repos:\n {2}brain: \.$/m);
  assert.doesNotMatch(out, /holds no code/);
  assert.match(out, /← this repo holds code$/m);
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

  const { code, out } = await run(['--sdd', 'speckit'], dir);
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
  assert.doesNotMatch(zero, /graphify|\.graphifyignore/, 'nothing of a graph');

  // Running it verbatim commits exactly that, and leaves the user's work dirty.
  const cmd = zero.replace(/^.*?0\. commit what was just written: /, '');
  // Through the hooks init installed, run by THIS build's multivac and never the
  // host's: a fresh brain's step 0 has to pass the code-in-change gate (MV-142).
  const hookBin = mkdtempSync(join(tmpdir(), 'mvac-hookbin-'));
  writeFileSync(join(hookBin, 'mvac'), `#!/bin/sh\nexec '${process.execPath}' '${join(process.cwd(), 'dist/cli.js')}' "$@"\n`, { mode: 0o755 });
  execFileSync('sh', ['-c', `git -c user.email=t@acme.example -c user.name=t ${cmd.replace(/^git /, '').replace(/ && git commit/, ' && git -c user.email=t@acme.example -c user.name=t commit')}`], {
    cwd: dir,
    stdio: 'ignore',
    env: scrubbedEnv({ PATH: [hookBin, dirname(process.execPath), '/usr/bin', '/bin'].join(':') }),
  });
  const status = execFileSync('git', ['status', '--porcelain'], { cwd: dir, encoding: 'utf8' });
  assert.match(status, /^ M README\.md$/m);
  assert.match(status, /^\?\? notes\.txt$/m);
  assert.doesNotMatch(status, /\.multivac|AGENTS\.md|\.specify/);
});

test("a fresh opsx brain's step zero passes its own gate — MV-142, MV-144", async () => {
  const dir = tmp();
  initRepo(dir, { 'src/app.py': 'print(1)\n' });
  // openspec, no grapher: the shape that was refused. Its init wrote
  // `.agents/`, a directory no door of multivac's projects, so the gate called it
  // code landing outside a change. MV-147: the init is `--tools none` now and
  // writes nothing outside `openspec/`, so step zero has no body to commit.
  const { code, out } = await run(['--sdd', 'opsx'], dir);
  assert.equal(code, 0, out);
  const zero = out.split('\n').find((l) => /0\. commit what was just written/.test(l)) ?? '';
  assert.match(zero, /\sopenspec(\s|$)/, 'the tool wrote it, so step zero commits it');
  assert.doesNotMatch(zero, /\.agents/);
  const walk = (d: string): string[] =>
    readdirSync(join(dir, d), { withFileTypes: true }).flatMap((e) =>
      e.name === '.git' && d === '' ? [] : e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)],
    );
  const files = walk('');
  assert.deepEqual(files.filter((f) => /openspec-|opsx/.test(f)), [], 'no command body, no skill');
  assert.deepEqual(files.filter((f) => f.startsWith('openspec/')).sort(), [
    'openspec/changes/archive/.gitkeep',
    'openspec/config.yaml',
    'openspec/specs/.gitkeep',
  ]);
  const cmd = zero.replace(/^.*?0\. commit what was just written: /, '');
  const hookBin = mkdtempSync(join(tmpdir(), 'mvac-hookbin-opsx-'));
  writeFileSync(join(hookBin, 'mvac'), `#!/bin/sh\nexec '${process.execPath}' '${join(process.cwd(), 'dist/cli.js')}' "$@"\n`, { mode: 0o755 });
  execFileSync('sh', ['-c', `git -c user.email=t@acme.example -c user.name=t ${cmd.replace(/^git /, '').replace(/ && git commit/, ' && git -c user.email=t@acme.example -c user.name=t commit')}`], {
    cwd: dir,
    stdio: 'ignore',
    env: scrubbedEnv({ PATH: [hookBin, dirname(process.execPath), '/usr/bin', '/bin'].join(':') }),
  });
  const status = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: dir, encoding: 'utf8' });
  assert.equal(status, '', 'all of it committed');
});

/**
 * MV-147. A brain an earlier multivac scaffolded holds the command bodies its
 * `openspec init --tools <keys>` wrote — here the stub's, as 1.13.2 writes them
 * for `agents,claude`, beside the `.codex/skills/` 1.7.0's codex wrote. The
 * removal `doctor` prints commits through the hooks `init` installed with no
 * change open, because a body is not code under any integration's directory,
 * `.codex/` included (MV-142, MV-144); and the lifecycle there, with the
 * bodies still committed as after their removal, prints what it prints in a
 * fresh brain, running no init, since the probe reads the root as installed.
 */
test('bodies an earlier init left leave through any commit — MV-142, MV-144, MV-147', async () => {
  const dir = tmp();
  initRepo(dir, { 'src/app.py': 'print(1)\n' });
  const { code, out } = await run(['--sdd', 'opsx'], dir);
  assert.equal(code, 0, out);
  // Every commit below goes through the hooks init installed, run by THIS
  // build's multivac and never the host's.
  const hookBin = mkdtempSync(join(tmpdir(), 'mvac-hookbin-bodies-'));
  writeFileSync(join(hookBin, 'mvac'), `#!/bin/sh\nexec '${process.execPath}' '${join(process.cwd(), 'dist/cli.js')}' "$@"\n`, { mode: 0o755 });
  const hooked = [hookBin, dirname(process.execPath), '/usr/bin', '/bin'].join(':');
  const sh = (cmd: string, path = hooked): void => {
    execFileSync('sh', ['-c', cmd], { cwd: dir, stdio: 'pipe', env: scrubbedEnv({ PATH: path }) });
  };
  const zero = out.split('\n').find((l) => /0\. commit what was just written/.test(l)) ?? '';
  sh(zero.replace(/^.*?0\. commit what was just written: /, ''));
  assert.equal(execFileSync('git', ['status', '--porcelain'], { cwd: dir, encoding: 'utf8' }), '', 'step zero committed');

  // What an earlier multivac's init left, committed on main with no change open.
  sh('openspec init --tools agents,claude --no-animation .', vendors.path);
  mkdirSync(join(dir, '.codex/skills/openspec-propose'), { recursive: true });
  writeFileSync(join(dir, '.codex/skills/openspec-propose/SKILL.md'), 'openspec skill\n');
  sh('git add .agents .claude .codex openspec && git commit -qm "an earlier init"');

  // The lifecycle prints the step lines of a fresh brain, and runs no init.
  const lifecycle = async (cwd: string): Promise<void> => {
    const inits = runsOf('openspec');
    const lines: string[] = [];
    const orig = { log: console.log, error: console.error, path: process.env.PATH };
    console.log = console.error = (...a: unknown[]) => {
      lines.push(a.map(String).join(' '));
    };
    process.env.PATH = vendors.path;
    let newCode: number;
    try {
      newCode = await change.run(['new', 'probe', 'Probe'], { cwd });
    } finally {
      console.log = orig.log;
      console.error = orig.error;
      process.env.PATH = orig.path;
    }
    const said = lines.join('\n');
    assert.equal(newCode, 0, said);
    assert.match(said, /^sdd opsx: in the brain checkout run `openspec new change probe --json`/m);
    assert.doesNotMatch(said, /running the tool's own init|scaffolded —/);
    assert.equal(runsOf('openspec'), inits, 'no init ran');
  };
  // With the bodies still there (US4-AS4) — asked in a copy, so the removal
  // below still commits with no change open.
  const held = join(mkdtempSync(join(tmpdir(), 'mvac-bodies-held-')), 'brain');
  cpSync(dir, held, { recursive: true });
  await lifecycle(held);

  const report = await doctorReport(dir);
  assert.equal(report.exit, 0, report.lines.join('\n'));
  const left = report.lines.find((l) => l.includes('an earlier init left command bodies')) ?? '';
  const rm = /`(git rm -r [^`]+)`/.exec(left)?.[1];
  assert.equal(
    rm,
    'git rm -r .agents/skills/.openspec-target .agents/skills/openspec-propose .claude/commands/opsx .claude/skills/openspec-propose .codex/skills/openspec-propose',
    report.lines.join('\n'),
  );
  // The removal as printed, committed through the same hooks, still with no change open.
  sh(`${rm} -q && git commit -qm "drop openspec bodies"`);
  assert.equal(execFileSync('git', ['status', '--porcelain'], { cwd: dir, encoding: 'utf8' }), '');
  const strict = spawnSync(process.execPath, [join(process.cwd(), 'dist/cli.js'), 'verify', '--strict'], {
    cwd: dir,
    encoding: 'utf8',
    env: scrubbedEnv({ PATH: hooked }),
  });
  assert.equal(strict.status, 0, `${strict.stdout}${strict.stderr}`);
  assert.ok(!(await doctorReport(dir)).lines.some((l) => l.includes('an earlier init left')), 'none left, no line');

  // …and with them gone.
  await lifecycle(dir);
});

/**
 * MV-45, MV-150. A fresh claude-door brain carries the skill, whose examples
 * are anchor-shaped text naming INV-01 — the first ID `change new` reserves.
 * Read as a text scan of every tracked file, that example kept the brain's
 * first reservation forever; read as the anchors `verify` parses, it is none.
 */
test('a fresh claude-door brain gives its first unused reservation back — MV-45, MV-150', async () => {
  const dir = tmp();
  initRepo(dir, { 'app.py': 'print(1)\n' });
  const { code, out } = await run(['--provider', 'claude'], dir);
  assert.equal(code, 0, out);
  // A brain holding code: init declares `brain: .` itself.
  assert.match(readFileSync(join(dir, '.multivac/config.yml'), 'utf8'), /^ {2}brain: \.$/m);
  const hookBin = mkdtempSync(join(tmpdir(), 'mvac-hookbin-leak-'));
  writeFileSync(join(hookBin, 'mvac'), `#!/bin/sh\nexec '${process.execPath}' '${join(process.cwd(), 'dist/cli.js')}' "$@"\n`, { mode: 0o755 });
  const hooked = [hookBin, dirname(process.execPath), '/usr/bin', '/bin'].join(':');
  const zero = out.split('\n').find((l) => /0\. commit what was just written/.test(l)) ?? '';
  execFileSync('sh', ['-c', `${zero.replace(/^.*?0\. commit what was just written: /, '')} -q`], {
    cwd: dir,
    stdio: 'pipe',
    env: scrubbedEnv({ PATH: hooked }),
  });
  assert.match(readFileSync(join(dir, '.claude/skills/multivac/references/anchors.md'), 'utf8'), /@anchor INV-01 /, 'the example this test is about');

  const lines: string[] = [];
  const orig = { log: console.log, error: console.error, path: process.env.PATH };
  console.log = console.error = (...a: unknown[]) => {
    lines.push(a.map(String).join(' '));
  };
  process.env.PATH = hooked;
  let opened: number;
  let closed: number;
  try {
    opened = await change.run(['new', 'leak', 'Leak'], { cwd: dir });
    const file = join(dir, '.multivac/changes/leak.md');
    writeFileSync(
      file,
      readFileSync(file, 'utf8')
        .replace(/^repos: \{\}$/m, 'repos:\n  brain:\n    status: landed')
        .replace(/^landing_order: \[\]$/m, 'landing_order:\n  - - brain'),
    );
    execFileSync('git', ['commit', '-qam', 'leak: landed'], { cwd: dir, stdio: 'pipe', env: scrubbedEnv({ PATH: hooked }) });
    closed = await change.run(['close', 'leak'], { cwd: dir });
  } finally {
    console.log = orig.log;
    console.error = orig.error;
    process.env.PATH = orig.path;
  }
  const said = lines.join('\n');
  assert.equal(opened, 0, said);
  assert.equal(closed, 0, said);
  assert.ok(lines.includes('released unused reservation: INV-01'), said);
  assert.doesNotMatch(readFileSync(join(dir, '.multivac/invariants.md'), 'utf8'), /\| INV-01 \|/);
});
