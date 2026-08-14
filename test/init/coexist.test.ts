// The two silent liars measurement 2 caught on saleor (blockers 1 and 2):
// a `.gitignore` that swallows the brain while init reports success, and an
// init that takes core.hooksPath over the repo's own gates. Both shapes are
// reproduced here exactly; every strategy branch has a test.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { doctorReport } from '../../src/commands/doctor.js';
import { init } from '../../src/commands/init.js';
import { installHooks } from '../../src/hooks/install.js';
import { gitInit } from '../helpers/fixture.js';

const tmp = (): string => mkdtempSync(join(tmpdir(), 'mvac-coexist-'));

const capture = async (fn: () => Promise<number>): Promise<{ code: number; out: string }> => {
  const lines: string[] = [];
  const orig = console.log;
  console.log = (l: string) => lines.push(String(l));
  try {
    return { code: await fn(), out: lines.join('\n') };
  } finally {
    console.log = orig;
  }
};

/** git in a fixture repo, trimmed stdout. */
function git(dir: string, ...args: string[]): string {
  return execFileSync('git', ['-C', dir, ...args]).toString().trim();
}

/** Exit status of `git check-ignore -q <path>`: 0 = ignored, 1 = visible. */
function isIgnored(dir: string, path: string): boolean {
  const r = spawnSync('git', ['-C', dir, 'check-ignore', '-q', '--', path]);
  return r.status === 0;
}

const line = (lines: string[], label: string): string =>
  lines.find((l) => l.startsWith(label)) ?? '';

// System utilities only — no real multivac reachable from the shims.
const SYS = '/usr/bin:/bin';

/** Run a hook file the way git does: cwd = repo, controlled PATH. */
function runHook(
  repo: string,
  hook: string,
  path = SYS,
): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync(hook, { cwd: repo, env: { PATH: path }, encoding: 'utf8' });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

// ---------------------------------------------------------------------------
// 1. init vs .gitignore

test('saleor shape: a `.*` gitignore gets marked negations and the brain becomes visible', async () => {
  const dir = tmp();
  gitInit(dir);
  writeFileSync(join(dir, '.gitignore'), '*.pyc\n.*\n!.vscode/\n');

  const { code, out } = await capture(() => init.run([], { cwd: dir }));
  assert.equal(code, 0);
  // states the problem and what it appended
  assert.match(out, /\.gitignore would ignore .*\.multivac\/invariants\.md/);
  assert.match(out, /appended to \.gitignore: !\.multivac\/ {2}!\.multivac\/\*\*/);
  assert.match(out, /re-checked — every brain path is visible to git/);

  const gi = readFileSync(join(dir, '.gitignore'), 'utf8');
  assert.match(gi, /^# multivac: keep the brain visible to git/m);
  assert.match(gi, /^!\.multivac\/$/m);
  assert.match(gi, /^!\.multivac\/\*\*$/m);
  // user content untouched, negations appended below it
  assert.ok(gi.startsWith('*.pyc\n.*\n!.vscode/\n'));

  // the law is visible; machinery stays ignored (.multivac/.gitignore wins deeper)
  assert.equal(isIgnored(dir, '.multivac/invariants.md'), false);
  assert.equal(isIgnored(dir, 'AGENTS.md'), false);
  assert.equal(isIgnored(dir, '.multivac/cache/x'), true);
  assert.equal(isIgnored(dir, '.multivac/worktrees/x'), true);

  // idempotent: the second run appends nothing
  const before = readFileSync(join(dir, '.gitignore'), 'utf8');
  const second = await capture(() => init.run([], { cwd: dir }));
  assert.equal(second.code, 0);
  assert.doesNotMatch(second.out, /appended to \.gitignore/);
  assert.equal(readFileSync(join(dir, '.gitignore'), 'utf8'), before);
});

test('a gitignore that only swallows AGENTS.md gets only its negation', async () => {
  const dir = tmp();
  gitInit(dir);
  writeFileSync(join(dir, '.gitignore'), 'AGENTS.md\n');

  const { out } = await capture(() => init.run([], { cwd: dir }));
  assert.match(out, /appended to \.gitignore: !AGENTS\.md/);
  const gi = readFileSync(join(dir, '.gitignore'), 'utf8');
  assert.match(gi, /^!AGENTS\.md$/m);
  assert.doesNotMatch(gi, /^!\.multivac\/$/m, 'no negation for paths never ignored');
  assert.equal(isIgnored(dir, 'AGENTS.md'), false);
});

test('a clean repo never gets a .gitignore written by init', async () => {
  const dir = tmp();
  gitInit(dir);
  await capture(() => init.run([], { cwd: dir }));
  assert.equal(existsSync(join(dir, '.gitignore')), false);

  // and an unrelated ignore file is left byte-for-byte alone
  const dir2 = tmp();
  gitInit(dir2);
  writeFileSync(join(dir2, '.gitignore'), 'node_modules/\n*.log\n');
  await capture(() => init.run([], { cwd: dir2 }));
  assert.equal(readFileSync(join(dir2, '.gitignore'), 'utf8'), 'node_modules/\n*.log\n');
});

test('doctor: an ignored brain path is a WARNING with the fix, not "untracked ok"', async () => {
  const dir = tmp();
  await capture(() => init.run([], { cwd: dir }));
  // the lie arrives after init: somebody adds the swallowing rule later
  writeFileSync(join(dir, '.gitignore'), '.multivac/\n');

  const { lines, exit } = await doctorReport(dir);
  assert.equal(exit, 0, 'doctor diagnoses, it does not fail the run');
  const untracked = line(lines, 'untracked');
  assert.match(untracked, /WARNING \d+ brain paths? IGNORED by \.gitignore/);
  assert.match(untracked, /\.multivac\/invariants\.md/);
  assert.match(untracked, /the law cannot ship/);
  assert.match(untracked, /multivac init \./);

  // healed by init (the fix doctor names), the warning goes away
  await capture(() => init.run([], { cwd: dir }));
  assert.doesNotMatch(line((await doctorReport(dir)).lines, 'untracked'), /IGNORED/);
});

// ---------------------------------------------------------------------------
// 2. init vs existing hooks

/** saleor shape: pre-commit framework hook live in .git/hooks + its config. */
function saleorHooks(dir: string, exitCode = 0): void {
  writeFileSync(join(dir, '.pre-commit-config.yaml'), 'repos: []\n');
  const hook = join(git(dir, 'rev-parse', '--git-dir'), 'hooks', 'pre-commit');
  writeFileSync(join(dir, hook), `#!/bin/sh\necho SALEOR-GATE\nexit ${exitCode}\n`);
  chmodSync(join(dir, hook), 0o755);
}

test('fresh repo: strategy fresh, hooksPath ours', async () => {
  const dir = tmp();
  gitInit(dir);
  const r = await installHooks(dir);
  assert.equal(r.strategy, 'fresh');
  assert.equal(r.dir, '.multivac/hooks');
  assert.deepEqual(r.installed, ['pre-commit', 'pre-push']);
  assert.deepEqual(r.chained, []);
  assert.deepEqual(r.refused, []);
  assert.equal(git(dir, 'config', 'core.hooksPath'), '.multivac/hooks');
});

test('saleor shape: init chains — the repo gate runs first and its exit code wins', async () => {
  const dir = tmp();
  gitInit(dir);
  saleorHooks(dir);

  const { code, out } = await capture(() => init.run([], { cwd: dir }));
  assert.equal(code, 0);
  assert.match(out, /chained: \.git\/hooks\/pre-commit runs first, its exit code wins/);
  assert.equal(git(dir, 'config', 'core.hooksPath'), '.multivac/hooks');

  // gate passes: it ran, then the shim moved on to (unrunnable) verify, exit 0
  let r = runHook(dir, '.multivac/hooks/pre-commit');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /SALEOR-GATE/);
  assert.match(r.stderr, /INACTIVE/);

  // gate fails: its exit code IS the hook's exit code, verify never runs
  saleorHooks(dir, 3);
  r = runHook(dir, '.multivac/hooks/pre-commit');
  assert.equal(r.status, 3, 'the pre-existing gate blocks the commit, not us');
  assert.match(r.stdout, /SALEOR-GATE/);
  assert.doesNotMatch(r.stderr, /INACTIVE/, 'the shim stopped at the failed gate');

  // doctor names the coexistence
  const hooks = line((await doctorReport(dir)).lines, 'hooks');
  assert.match(hooks, /pre-commit chains \.git\/hooks\/pre-commit \(runs first, its exit code wins\)/);
});

test('a non-executable .git/hooks file is not a chain — git would not run it either', async () => {
  const dir = tmp();
  gitInit(dir);
  const hook = join(dir, git(dir, 'rev-parse', '--git-dir'), 'hooks', 'pre-commit');
  writeFileSync(hook, '#!/bin/sh\nexit 1\n');
  chmodSync(hook, 0o644);
  const r = await installHooks(dir);
  assert.deepEqual(r.chained, []);
  assert.equal(runHook(dir, '.multivac/hooks/pre-commit').status, 0);
});

test('a manager config alone (lefthook.yml) reads as chained: its hooks run once installed', async () => {
  const dir = tmp();
  gitInit(dir);
  writeFileSync(join(dir, 'lefthook.yml'), 'pre-commit:\n  commands: {}\n');
  const r = await installHooks(dir);
  assert.equal(r.strategy, 'chained');
  assert.deepEqual(r.managers, ['lefthook.yml']);
  // nothing in .git/hooks yet: the chain resolves at run time, shim still works
  assert.equal(runHook(dir, '.multivac/hooks/pre-commit').status, 0);
});

test('foreign core.hooksPath: install alongside, never repoint', async () => {
  const dir = tmp();
  gitInit(dir);
  mkdirSync(join(dir, '.githooks'));
  git(dir, 'config', 'core.hooksPath', '.githooks');

  const r = await installHooks(dir);
  assert.equal(r.strategy, 'alongside');
  assert.equal(r.dir, '.githooks');
  assert.deepEqual(r.installed, ['pre-commit', 'pre-push']);
  assert.deepEqual(r.refused, []);
  assert.equal(git(dir, 'config', 'core.hooksPath'), '.githooks', 'never repointed');
  assert.equal(existsSync(join(dir, '.multivac/hooks/pre-commit')), false);

  // the alongside shim resolves the repo root through git, not $0 arithmetic
  const bin = join(dir, 'fixture-bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'mvac'), '#!/bin/sh\necho "mvac $*"\n');
  chmodSync(join(bin, 'mvac'), 0o755);
  const run = runHook(dir, '.githooks/pre-commit', `${bin}:${SYS}`);
  assert.equal(run.status, 0);
  assert.equal(run.stdout.trim(), 'mvac verify');
});

test('foreign hooksPath with the name taken: refusal names the exact step, file untouched', async () => {
  const dir = tmp();
  gitInit(dir);
  mkdirSync(join(dir, '.githooks'));
  const theirs = '#!/bin/sh\nmake lint\n';
  writeFileSync(join(dir, '.githooks/pre-commit'), theirs);
  chmodSync(join(dir, '.githooks/pre-commit'), 0o755);
  git(dir, 'config', 'core.hooksPath', '.githooks');

  const r = await installHooks(dir);
  assert.equal(r.strategy, 'alongside');
  assert.equal(r.refused.length, 1);
  assert.equal(r.refused[0].path, '.githooks/pre-commit');
  assert.match(r.refused[0].fix, /append this line to \.githooks\/pre-commit: mvac verify \|\| exit 1/);
  assert.equal(readFileSync(join(dir, '.githooks/pre-commit'), 'utf8'), theirs);
  // the free name still got the shim
  assert.deepEqual(r.installed, ['pre-push']);
  assert.equal(git(dir, 'config', 'core.hooksPath'), '.githooks');

  // and doctor reports the same state with the same fix
  await capture(() => init.run([], { cwd: dir }));
  const hooks = line((await doctorReport(dir)).lines, 'hooks');
  assert.match(hooks, /core\.hooksPath is \.githooks \(this repo's own gate/);
  assert.match(hooks, /never repoints/);
  assert.match(hooks, /WARNING \.githooks\/pre-commit does not run multivac → append: mvac verify \|\| exit 1/);
  assert.match(hooks, /pre-push runs multivac \(\.githooks\/pre-push\)/);
});

test('a taken foreign hook that already runs multivac is wired — no refusal, no rewrite', async () => {
  const dir = tmp();
  gitInit(dir);
  mkdirSync(join(dir, '.githooks'));
  const theirs = '#!/bin/sh\nmake lint\nmvac verify || exit 1\n';
  writeFileSync(join(dir, '.githooks/pre-commit'), theirs);
  git(dir, 'config', 'core.hooksPath', '.githooks');

  const r = await installHooks(dir);
  assert.deepEqual(r.wired, ['.githooks/pre-commit']);
  assert.deepEqual(r.refused, []);
  assert.equal(readFileSync(join(dir, '.githooks/pre-commit'), 'utf8'), theirs);
});

test('husky repo: shims go into .husky/, hooksPath stays unset for husky to claim', async () => {
  const dir = tmp();
  gitInit(dir);
  mkdirSync(join(dir, '.husky'));
  writeFileSync(join(dir, '.husky/pre-commit'), 'npm test\n');

  const { out } = await capture(() => init.run([], { cwd: dir }));
  assert.match(out, /alongside into \.husky/);
  assert.match(out, /core\.hooksPath not touched/);
  assert.equal(spawnSync('git', ['-C', dir, 'config', 'core.hooksPath']).status, 1, 'unset');
  assert.equal(readFileSync(join(dir, '.husky/pre-commit'), 'utf8'), 'npm test\n');
  assert.ok(existsSync(join(dir, '.husky/pre-push')), 'free name got the shim');

  const hooks = line((await doctorReport(dir)).lines, 'hooks');
  assert.match(hooks, /\.husky\/ present \(husky claims it on install/);
  assert.match(hooks, /WARNING \.husky\/pre-commit does not run multivac/);
});

test('init report and refusal are loud: refusals go to stderr even under --quiet', async () => {
  const dir = tmp();
  gitInit(dir);
  mkdirSync(join(dir, '.githooks'));
  writeFileSync(join(dir, '.githooks/pre-commit'), '#!/bin/sh\nmake lint\n');
  git(dir, 'config', 'core.hooksPath', '.githooks');

  const errs: string[] = [];
  const orig = console.error;
  console.error = (l: string) => errs.push(String(l));
  try {
    const { code, out } = await capture(() => init.run(['--quiet'], { cwd: dir }));
    assert.equal(code, 0);
    assert.equal(out, '', '--quiet drops the report');
    assert.match(errs.join('\n'), /\.githooks\/pre-commit exists and does not run multivac — NOT touched/);
  } finally {
    console.error = orig;
  }
});
