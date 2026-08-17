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
  rmSync,
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

/** A fake pre-commit binary that logs its argv and exits as told. */
function stubPreCommit(dir: string, exitCode = 0): string {
  const bin = join(dir, 'stub-bin');
  mkdirSync(bin, { recursive: true });
  writeFileSync(join(bin, 'pre-commit'), `#!/bin/sh\necho "PC-GATE $*"\nexit ${exitCode}\n`);
  chmodSync(join(bin, 'pre-commit'), 0o755);
  return bin;
}

/** Run fn with process.env.PATH pinned — onPath() reads it directly. */
async function withPath<T>(path: string, fn: () => Promise<T>): Promise<T> {
  const orig = process.env.PATH;
  process.env.PATH = path;
  try {
    return await fn();
  } finally {
    process.env.PATH = orig;
  }
}

/** Run fn with process.env.HOME pinned, so a `~` config value expands into a
 *  scratch directory instead of the developer's real home. git reads $HOME
 *  from the environment of the process we spawn, so this is what makes a tilde
 *  hooksPath testable at all. */
async function withHome<T>(home: string, fn: () => Promise<T>): Promise<T> {
  const orig = process.env.HOME;
  process.env.HOME = home;
  try {
    return await fn();
  } finally {
    if (orig === undefined) delete process.env.HOME;
    else process.env.HOME = orig;
  }
}

test('saleor fresh clone: config present, hook absent, binary present — the shim arms the gate itself', async () => {
  const dir = tmp();
  gitInit(dir);
  writeFileSync(join(dir, '.pre-commit-config.yaml'), 'repos: []\n');
  const bin = stubPreCommit(dir);

  // init tells the truth: the config runs via `pre-commit run`, not via a
  // .git/hooks hook that does not exist.
  const { code, out } = await withPath(`${bin}:${SYS}`, () =>
    capture(() => init.run([], { cwd: dir })),
  );
  assert.equal(code, 0);
  assert.match(
    out,
    /chained: \.pre-commit-config\.yaml via `pre-commit run` \(`pre-commit install` refuses while core\.hooksPath is set\) runs first, its exit code wins, then verify/,
  );
  assert.doesNotMatch(out, /\.git\/hooks\/pre-commit runs first/);

  // gate passes: pre-commit ran with the right stage, then the shim moved on
  let r = runHook(dir, '.multivac/hooks/pre-commit', `${bin}:${SYS}`);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /PC-GATE run --hook-stage pre-commit/);
  assert.match(r.stderr, /INACTIVE/);
  // pre-push shim runs the push stage of the same config
  r = runHook(dir, '.multivac/hooks/pre-push', `${bin}:${SYS}`);
  assert.match(r.stdout, /PC-GATE run --hook-stage pre-push/);

  // gate fails: its exit code IS the hook's exit code, verify never runs
  stubPreCommit(dir, 3);
  r = runHook(dir, '.multivac/hooks/pre-commit', `${bin}:${SYS}`);
  assert.equal(r.status, 3, 'the project gate blocks the commit, not us');
  assert.doesNotMatch(r.stderr, /INACTIVE/, 'the shim stopped at the failed gate');

  // once the real hook exists, it wins over the fallback (the original chain)
  saleorHooks(dir);
  r = runHook(dir, '.multivac/hooks/pre-commit', `${bin}:${SYS}`);
  assert.match(r.stdout, /SALEOR-GATE/);
  assert.doesNotMatch(r.stdout, /PC-GATE/);

  // doctor names the fallback state while the hook is absent
  rmSync(join(dir, git(dir, 'rev-parse', '--git-dir'), 'hooks', 'pre-commit'));
  const hooks = await withPath(`${bin}:${SYS}`, async () =>
    line((await doctorReport(dir)).lines, 'hooks'),
  );
  assert.match(hooks, /\.pre-commit-config\.yaml with no \.git\/hooks\/pre-commit/);
  assert.match(hooks, /pre-commit run --hook-stage/);
  assert.match(hooks, /refuses while core\.hooksPath is set/);
});

test('saleor fresh clone without the binary: loud warning, never a block, init and doctor say the gate cannot run', async () => {
  const dir = tmp();
  gitInit(dir);
  writeFileSync(join(dir, '.pre-commit-config.yaml'), 'repos: []\n');

  const errs: string[] = [];
  const orig = console.error;
  console.error = (l: string) => errs.push(String(l));
  let out = '';
  try {
    ({ out } = await withPath(SYS, () => capture(() => init.run([], { cwd: dir }))));
  } finally {
    console.error = orig;
  }
  assert.doesNotMatch(out, /runs first/, 'init does not claim a gate that cannot run');
  assert.match(
    errs.join('\n'),
    /\.pre-commit-config\.yaml present but the pre-commit binary is not installed — the project's gate will not run until it is/,
  );

  // the shim warns on stderr and never blocks — same posture as no runner
  const r = runHook(dir, '.multivac/hooks/pre-commit', SYS);
  assert.equal(r.status, 0, 'a missing binary never wedges the commit');
  assert.match(r.stderr, /pre-commit is not installed/);
  assert.match(r.stderr, /gate did NOT run/);

  // doctor: the state and the fix
  const hooks = await withPath(SYS, async () =>
    line((await doctorReport(dir)).lines, 'hooks'),
  );
  assert.match(hooks, /WARNING \.pre-commit-config\.yaml present, no \.git\/hooks\/pre-commit and no pre-commit binary/);
  assert.match(hooks, /gate cannot run → install pre-commit/);
});

test('husky arrangement has no such trap: hooksPath stays claimable and both gates run once husky arms', async () => {
  const dir = tmp();
  gitInit(dir);
  mkdirSync(join(dir, '.husky'));
  writeFileSync(join(dir, '.husky/pre-commit'), '#!/bin/sh\necho HUSKY-GATE\n');
  chmodSync(join(dir, '.husky/pre-commit'), 0o755);

  await capture(() => init.run([], { cwd: dir }));
  // init left core.hooksPath unset — husky's own `prepare` can still claim it
  assert.equal(spawnSync('git', ['-C', dir, 'config', 'core.hooksPath']).status, 1);
  git(dir, 'config', 'core.hooksPath', '.husky'); // husky arms
  // the project's gate runs untouched, and multivac's shim beside it runs too
  assert.match(runHook(dir, '.husky/pre-commit').stdout, /HUSKY-GATE/);
  const bin = join(dir, 'fixture-bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'mvac'), '#!/bin/sh\necho "mvac $*"\n');
  chmodSync(join(bin, 'mvac'), 0o755);
  const r = runHook(dir, '.husky/pre-push', `${bin}:${SYS}`);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /mvac verify/);
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

// ---------------------------------------------------------------------------
// 3. init vs an ABSOLUTE core.hooksPath (MV-79)
//
// git hands core.hooksPath back exactly as configured, and a full path is a
// legal spelling — the one every git worktree inherits from its main checkout
// through the shared config. `join(repo, dir)` concatenates an absolute dir
// onto the repo root instead of replacing it, so the shims used to land in a
// tree named after the machine's filesystem while the notice printed the
// absolute path as the place they went. Every shape MV-37 and MV-44 describe
// is exercised again under that spelling.

/** A hook dir OUTSIDE the repo, named the way git would hand it back. */
const foreignDir = (): string => join(tmp(), 'githooks');

test('an absolute foreign core.hooksPath: the shims land where git looks, not in a tree built by concatenation', async () => {
  const dir = tmp();
  gitInit(dir);
  const foreign = foreignDir();
  git(dir, 'config', 'core.hooksPath', foreign);

  const r = await installHooks(dir);
  assert.equal(r.strategy, 'alongside');
  assert.equal(r.dir, foreign, 'reported as configured, not rewritten');
  assert.deepEqual(r.installed, ['pre-commit', 'pre-push']);
  assert.deepEqual(r.refused, []);
  assert.equal(git(dir, 'config', 'core.hooksPath'), foreign, 'never repointed');

  for (const name of ['pre-commit', 'pre-push']) {
    assert.ok(existsSync(join(foreign, name)), `${name} is where git will look`);
    assert.equal(existsSync(join(dir, foreign, name)), false, 'nothing concatenated');
  }
  // not even the first segment of the machine path exists inside the repo
  assert.equal(existsSync(join(dir, foreign.split('/')[1])), false);
  assert.equal(existsSync(join(dir, '.multivac/hooks/pre-commit')), false);

  // and it runs: the alongside shim resolves the root through git, not from $0
  const bin = join(dir, 'fixture-bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'mvac'), '#!/bin/sh\necho "mvac $*"\n');
  chmodSync(join(bin, 'mvac'), 0o755);
  const run = runHook(dir, join(foreign, 'pre-commit'), `${bin}:${SYS}`);
  assert.equal(run.status, 0);
  assert.equal(run.stdout.trim(), 'mvac verify');
});

test('a `~` core.hooksPath expands to $HOME: the shims land where git looks, not in a directory named `~`', async () => {
  const dir = tmp();
  gitInit(dir);
  git(dir, 'config', 'user.email', 't@example.invalid');
  git(dir, 'config', 'user.name', 'T');
  const home = tmp();
  const expanded = join(home, 'githooks');
  // A leading `~` is a legal spelling and git expands it to $HOME before it
  // resolves anything. Read literally it resolves against the repo root, and
  // the shims land in a directory named `~` inside the checkout — the
  // concatenation defect of the absolute spelling, one spelling down (MV-79).
  git(dir, 'config', 'core.hooksPath', '~/githooks');

  const r = await withHome(home, () => installHooks(dir));
  assert.equal(r.strategy, 'alongside');
  assert.deepEqual(r.installed, ['pre-commit', 'pre-push']);
  assert.deepEqual(r.refused, []);
  for (const name of ['pre-commit', 'pre-push']) {
    assert.ok(existsSync(join(expanded, name)), `${name} is where git will look`);
  }
  assert.equal(existsSync(join(dir, '~')), false, 'no directory named `~` inside the repo');
  assert.equal(existsSync(join(dir, '.multivac/hooks/pre-commit')), false);
  assert.equal(r.dir, expanded, 'reported as git reads it — expanded');
  assert.equal(git(dir, 'config', 'core.hooksPath'), '~/githooks', 'never repointed');

  // and git agrees: with $HOME pointed here, a commit runs the shim we wrote
  const bin = join(dir, 'fixture-bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'mvac'), '#!/bin/sh\necho "FIXTURE-MVAC $*" >&2\nexit 9\n');
  chmodSync(join(bin, 'mvac'), 0o755);
  writeFileSync(join(dir, 'a.txt'), 'x\n');
  git(dir, 'add', 'a.txt');
  const commit = await withHome(home, async () =>
    spawnSync('git', ['-C', dir, 'commit', '-m', 'x'], {
      env: { ...process.env, PATH: `${bin}:${SYS}` },
    }),
  );
  assert.notEqual(commit.status, 0, 'the gate git found refused the commit');
  assert.match(commit.stderr.toString(), /FIXTURE-MVAC verify/);

  // doctor reads the same directory: nothing missing, and --strict passes
  await withHome(home, () => capture(() => init.run([], { cwd: dir })));
  mkdirSync(join(dir, 'dist'), { recursive: true });
  writeFileSync(join(dir, 'dist/cli.js'), '// built\n');
  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  const strict = await withHome(home, () => doctorReport(dir, true));
  const hooks = line(strict.lines, 'hooks');
  assert.ok(
    hooks.includes(`core.hooksPath is ${expanded} `),
    'doctor names the path git will use',
  );
  assert.doesNotMatch(hooks, /missing in/, 'a shim that is there is never reported missing');
  assert.match(hooks, /pre-commit runs multivac/);
  assert.match(hooks, /pre-push runs multivac/);
  assert.equal(strict.exit, 0, '--strict passes a gate that is armed');
});

test('an absolute foreign hooksPath refuses, wires and reports exactly as a relative one does', async () => {
  const dir = tmp();
  gitInit(dir);
  const foreign = foreignDir();
  mkdirSync(foreign, { recursive: true });
  const theirs = '#!/bin/sh\nmake lint\n';
  writeFileSync(join(foreign, 'pre-commit'), theirs);
  chmodSync(join(foreign, 'pre-commit'), 0o755);
  git(dir, 'config', 'core.hooksPath', foreign);

  const r = await installHooks(dir);
  assert.equal(r.strategy, 'alongside');
  assert.equal(r.refused.length, 1);
  assert.equal(r.refused[0].path, `${foreign}/pre-commit`);
  assert.match(r.refused[0].fix, /append this line to .*\/pre-commit: mvac verify \|\| exit 1/);
  assert.equal(readFileSync(join(foreign, 'pre-commit'), 'utf8'), theirs, 'byte-untouched');
  assert.deepEqual(r.installed, ['pre-push'], 'the free name still got the shim');

  // doctor names the same state, read from the same directory
  await capture(() => init.run([], { cwd: dir }));
  const hooks = line((await doctorReport(dir)).lines, 'hooks');
  assert.match(hooks, /never repoints/);
  assert.match(hooks, /pre-commit does not run multivac → append: mvac verify \|\| exit 1/);
  assert.match(hooks, /pre-push runs multivac/);
  assert.doesNotMatch(hooks, /pre-push missing/);

  // a taken name already running multivac is wired — no refusal, no rewrite
  const dir2 = tmp();
  gitInit(dir2);
  const wired = foreignDir();
  mkdirSync(wired, { recursive: true });
  const ours = '#!/bin/sh\nmake lint\nmvac verify || exit 1\n';
  writeFileSync(join(wired, 'pre-commit'), ours);
  git(dir2, 'config', 'core.hooksPath', wired);
  const r2 = await installHooks(dir2);
  assert.deepEqual(r2.wired, [`${wired}/pre-commit`]);
  assert.deepEqual(r2.refused, []);
  assert.equal(readFileSync(join(wired, 'pre-commit'), 'utf8'), ours);

  // husky's own directory named the long way: its gate is untouched, ours goes
  // in beside it, and hooksPath stays exactly as configured
  const dir3 = tmp();
  gitInit(dir3);
  mkdirSync(join(dir3, '.husky'));
  writeFileSync(join(dir3, '.husky/pre-commit'), 'npm test\n');
  git(dir3, 'config', 'core.hooksPath', join(dir3, '.husky'));
  const r3 = await installHooks(dir3);
  assert.equal(r3.strategy, 'alongside');
  assert.deepEqual(r3.managers, ['.husky/']);
  assert.equal(readFileSync(join(dir3, '.husky/pre-commit'), 'utf8'), 'npm test\n');
  assert.ok(existsSync(join(dir3, '.husky/pre-push')), 'free name got the shim');
  assert.equal(git(dir3, 'config', 'core.hooksPath'), join(dir3, '.husky'));
});

test('our own hooks dir spelled absolutely is ours, not a foreign gate', async () => {
  const dir = tmp();
  gitInit(dir);
  git(dir, 'config', 'core.hooksPath', join(dir, '.multivac/hooks'));

  const r = await installHooks(dir);
  assert.equal(r.strategy, 'fresh', 'the long spelling names the same directory');
  assert.equal(r.dir, '.multivac/hooks');
  assert.deepEqual(r.installed, ['pre-commit', 'pre-push']);
  assert.ok(existsSync(join(dir, '.multivac/hooks/pre-commit')));
  assert.equal(
    git(dir, 'config', 'core.hooksPath'),
    '.multivac/hooks',
    'normalised to the spelling that travels with a clone — the same directory',
  );
  await capture(() => init.run([], { cwd: dir }));
  const hooks = line((await doctorReport(dir)).lines, 'hooks');
  assert.match(hooks, /core\.hooksPath ok/);
  assert.doesNotMatch(hooks, /installs alongside/);

  // and doctor answers the same on a checkout nothing has normalised yet —
  // the long spelling is ours, so the gate is armed and --strict says so
  git(dir, 'config', 'core.hooksPath', join(dir, '.multivac/hooks'));
  mkdirSync(join(dir, 'dist'), { recursive: true });
  writeFileSync(join(dir, 'dist/cli.js'), '// built\n');
  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  const abs = await doctorReport(dir, true);
  assert.equal(abs.exit, 0, 'the long spelling of our own dir is armed too');
  assert.match(line(abs.lines, 'hooks'), /core\.hooksPath ok/);

  // the repo's own .git/hooks gate still chains first, and its exit code wins
  const dir2 = tmp();
  gitInit(dir2);
  git(dir2, 'config', 'core.hooksPath', join(dir2, '.multivac/hooks'));
  saleorHooks(dir2, 3);
  const r2 = await installHooks(dir2);
  assert.equal(r2.strategy, 'chained');
  assert.deepEqual(r2.chained, ['.git/hooks/pre-commit']);
  assert.equal(r2.preCommit, 'hook');
  assert.equal(runHook(dir2, '.multivac/hooks/pre-commit').status, 3);

  // and MV-44's fresh-clone fallback arms under the same spelling
  const dir3 = tmp();
  gitInit(dir3);
  git(dir3, 'config', 'core.hooksPath', join(dir3, '.multivac/hooks'));
  writeFileSync(join(dir3, '.pre-commit-config.yaml'), 'repos: []\n');
  const bin = stubPreCommit(dir3);
  const r3 = await withPath(`${bin}:${SYS}`, () => installHooks(dir3));
  assert.equal(r3.strategy, 'chained');
  assert.equal(r3.preCommit, 'run');
  assert.match(
    runHook(dir3, '.multivac/hooks/pre-commit', `${bin}:${SYS}`).stdout,
    /PC-GATE run --hook-stage pre-commit/,
  );
});

test('doctor reads the resolved directory: an inherited absolute hooksPath is not a missing shim', async () => {
  const dir = tmp();
  gitInit(dir);
  const foreign = foreignDir();
  git(dir, 'config', 'core.hooksPath', foreign);
  await capture(() => init.run([], { cwd: dir }));

  // a runner the shim can find, so `armed` is about the path, not the runner
  mkdirSync(join(dir, 'dist'), { recursive: true });
  writeFileSync(join(dir, 'dist/cli.js'), '// built\n');
  mkdirSync(join(dir, 'node_modules'), { recursive: true });

  const hooks = line((await doctorReport(dir)).lines, 'hooks');
  assert.match(hooks, /pre-commit runs multivac/);
  assert.match(hooks, /pre-push runs multivac/);
  assert.doesNotMatch(hooks, /missing in/, 'a shim that is there is never reported missing');
  assert.equal((await doctorReport(dir, true)).exit, 0, '--strict passes a gate that is armed');

  // and --strict still fails when the gate really is down
  rmSync(join(foreign, 'pre-commit'));
  const strict = await doctorReport(dir, true);
  assert.equal(strict.exit, 1);
  assert.match(line(strict.lines, 'hooks'), /pre-commit missing in/);
});
