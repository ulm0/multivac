// MV-127. `repos sync` reconciles the brain mount in every declared repo it
// finds on disk — it does not only clone. A repo declared today and a repo
// declared last August get the same pass, so a half-done manual rollout heals
// on the next sync instead of staying half-done forever.
//
// git blocks the `file` transport for submodules (CVE-2022-39253), and multivac
// deliberately never passes `-c protocol.file.allow=always` into somebody
// else's repo. The tests allow it for THEMSELVES, through the environment, so
// no host git config is read or written.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gitInit } from '../helpers/fixture.js';
import { reposSync } from '../../src/commands/repos.js';

const tmp = mkdtempSync(join(tmpdir(), 'mvac-mount-'));

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', ['-C', cwd, ...args], { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
}

/** A git repo with one commit. */
function repo(dir: string, file = 'README.md', body = '# x\n'): string {
  gitInit(dir);
  git(dir, 'config', 'user.email', 'test@acme.example');
  git(dir, 'config', 'user.name', 'Acme Test');
  writeFileSync(join(dir, file), body);
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'init');
  return dir;
}

/**
 * Let git clone a submodule from a local path, for the duration of `fn`.
 * Through GIT_CONFIG_*, which survives the env scrub in lib/git.ts, so nothing
 * is written to the machine's git config — the suite must not depend on host
 * configuration.
 */
async function withLocalSubmodules<T>(fn: () => Promise<T>): Promise<T> {
  const saved = {
    count: process.env.GIT_CONFIG_COUNT,
    key: process.env.GIT_CONFIG_KEY_0,
    value: process.env.GIT_CONFIG_VALUE_0,
  };
  process.env.GIT_CONFIG_COUNT = '1';
  process.env.GIT_CONFIG_KEY_0 = 'protocol.file.allow';
  process.env.GIT_CONFIG_VALUE_0 = 'always';
  try {
    return await fn();
  } finally {
    for (const [k, v] of [
      ['GIT_CONFIG_COUNT', saved.count],
      ['GIT_CONFIG_KEY_0', saved.key],
      ['GIT_CONFIG_VALUE_0', saved.value],
    ] as const) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

/** A brain with `brain_url` pointing at itself, and `extra` appended to repos:. */
function eco(name: string, repos: string, brainUrl = true): { brain: string } {
  const root = join(tmp, name);
  const brain = join(root, 'brain');
  mkdirSync(join(brain, '.multivac'), { recursive: true });
  repo(brain, 'law.md', '# law\n');
  writeFileSync(
    join(brain, '.multivac/config.yml'),
    `${brainUrl ? `brain_url: ${brain}\n` : ''}repos:\n${repos}`,
  );
  git(brain, 'add', '-A');
  git(brain, 'commit', '-q', '-m', 'config');
  return { brain };
}

test('a declared repo with no mount gets one, staged, never committed — MV-127', async () => {
  const { brain } = eco('add', '  app: ../app\n');
  const app = repo(join(tmp, 'add', 'app'), 'a.txt', 'x\n');
  const before = git(app, 'rev-parse', 'HEAD');

  const { lines, exit } = await withLocalSubmodules(() => reposSync(brain, false));
  assert.equal(exit, 0);
  assert.match(lines.join('\n'), /app: mounted the brain at \.brain — staged in \.\.\/app, commit it there/);

  assert.match(git(app, 'status', '--short'), /^A {2}\.brain$/m);
  assert.match(git(app, 'status', '--short'), /^A {2}\.gitmodules$/m);
  assert.match(git(app, 'ls-files', '-s', '--', '.brain'), /^160000 [0-9a-f]{40} 0\t\.brain$/);
  assert.equal(git(app, 'rev-parse', 'HEAD'), before, 'multivac committed nothing in the consumer');
  assert.ok(existsSync(join(app, '.brain', '.multivac', 'config.yml')), 'the mount is a brain');
});

test('running sync twice does not re-add the mount it just made — MV-127', async () => {
  const { brain } = eco('twice', '  app: ../app\n');
  repo(join(tmp, 'twice', 'app'), 'a.txt', 'x\n');

  await withLocalSubmodules(() => reposSync(brain, false));
  // git answers a second add with `fatal: '.brain' already exists in the
  // index`, and the gitlink is not in HEAD until a human commits — so a pass
  // that asked HEAD alone would fail on its own work.
  const { lines, exit } = await withLocalSubmodules(() => reposSync(brain, false));
  assert.equal(exit, 0);
  assert.match(lines.join('\n'), /app: brain mounted at \.brain — staged, commit it in that repo/);
  assert.doesNotMatch(lines.join('\n'), /could not mount/);
});

test('a committed mount is left alone and reported as present — MV-127', async () => {
  const { brain } = eco('kept', '  app: ../app\n');
  const app = repo(join(tmp, 'kept', 'app'), 'a.txt', 'x\n');
  await withLocalSubmodules(() => reposSync(brain, false));
  git(app, 'commit', '-q', '-m', 'mount the brain');
  const head = git(app, 'rev-parse', 'HEAD');

  const { lines } = await withLocalSubmodules(() => reposSync(brain, false));
  assert.match(lines.join('\n'), /^app: brain mounted at \.brain$/m);
  assert.equal(git(app, 'rev-parse', 'HEAD'), head);
});

test('an existing checkout of the brain is adopted, with the declared url — MV-127', async () => {
  // The measured middle state: somebody ran `git submodule add` once and never
  // committed the gitlink, so the directory is there and git knows nothing.
  const { brain } = eco('adopt', '  app: ../app\n');
  const app = repo(join(tmp, 'adopt', 'app'), 'a.txt', 'x\n');
  const other = repo(join(tmp, 'adopt', 'mirror'), 'law.md', '# mirror\n');
  execFileSync('git', ['clone', '-q', other, join(app, '.brain')], { stdio: 'ignore' });

  const { lines, exit } = await withLocalSubmodules(() => reposSync(brain, false));
  assert.equal(exit, 0);
  assert.match(lines.join('\n'), /app: mounted the brain at \.brain/);
  // The url recorded is what the config declares, never the existing clone's.
  assert.equal(git(app, 'config', '-f', '.gitmodules', '--get', 'submodule..brain.url'), brain);
});

test('a gitlink whose checkout is empty is filled, not re-added — MV-127', async () => {
  const { brain } = eco('empty', '  app: ../app\n');
  const app = repo(join(tmp, 'empty', 'app'), 'a.txt', 'x\n');
  await withLocalSubmodules(() => reposSync(brain, false));
  git(app, 'commit', '-q', '-m', 'mount the brain');
  // What a fresh clone of the consumer looks like: pin committed, no checkout.
  execFileSync('rm', ['-rf', join(app, '.brain')], { stdio: 'ignore' });
  mkdirSync(join(app, '.brain'), { recursive: true });

  const { lines, exit } = await withLocalSubmodules(() => reposSync(brain, false));
  assert.equal(exit, 0);
  assert.match(lines.join('\n'), /app: filled the empty brain mount at \.brain/);
  assert.ok(existsSync(join(app, '.brain', '.multivac', 'config.yml')));
});

test('a mount that holds files but is not a brain is reported, never overwritten — MV-127', async () => {
  // A pin that predates the brain, or one somebody moved: `update --init`
  // would check out the recorded commit over it, and `--remote` moves the pin.
  const { brain } = eco('stale', '  app: ../app\n');
  const app = repo(join(tmp, 'stale', 'app'), 'a.txt', 'x\n');
  await withLocalSubmodules(() => reposSync(brain, false));
  git(app, 'commit', '-q', '-m', 'mount the brain');
  // The submodule checkout is a fresh clone: it has none of the identity
  // repo() set in its parent. Without one, a commit there leans on git
  // inventing an address from the hostname — which a CI container cannot do.
  git(join(app, '.brain'), 'config', 'user.email', 'test@acme.example');
  git(join(app, '.brain'), 'config', 'user.name', 'Acme Test');
  git(join(app, '.brain'), 'rm', '-q', '-r', '.multivac');
  git(join(app, '.brain'), 'commit', '-q', '-m', 'an older shape, no .multivac/');
  const moved = git(join(app, '.brain'), 'rev-parse', 'HEAD');

  const { lines, exit } = await withLocalSubmodules(() => reposSync(brain, false));
  assert.equal(exit, 0);
  assert.match(lines.join('\n'), /app: brain mount at \.brain is not a multivac brain — .*multivac does not move it/);
  assert.equal(git(join(app, '.brain'), 'rev-parse', 'HEAD'), moved, 'the checkout was left where it was');
});

test('a recorded url that is not brain_url is reported, never rewritten — MV-127', async () => {
  const { brain } = eco('drift', '  app: ../app\n');
  const app = repo(join(tmp, 'drift', 'app'), 'a.txt', 'x\n');
  await withLocalSubmodules(() => reposSync(brain, false));
  git(app, 'commit', '-q', '-m', 'mount the brain');
  git(app, 'config', '-f', '.gitmodules', 'submodule..brain.url', 'git@fork:acme/brain.git');

  const { lines } = await withLocalSubmodules(() => reposSync(brain, false));
  assert.match(lines.join('\n'), /recorded url git@fork:acme\/brain\.git is not brain_url/);
  assert.match(lines.join('\n'), /git submodule set-url \.brain/);
  // A consumer may point at a fork on purpose: multivac says so and stops.
  assert.equal(
    git(app, 'config', '-f', '.gitmodules', '--get', 'submodule..brain.url'),
    'git@fork:acme/brain.git',
  );
});

test('with no brain_url nothing is mounted and the key is named once — MV-127', async () => {
  const { brain } = eco('nourl', '  app: ../app\n  other: ../other\n', false);
  const app = repo(join(tmp, 'nourl', 'app'), 'a.txt', 'x\n');
  repo(join(tmp, 'nourl', 'other'), 'b.txt', 'y\n');
  git(brain, 'remote', 'add', 'origin', 'git@machine-local-alias:acme/brain.git');

  const { lines, exit } = await withLocalSubmodules(() => reposSync(brain, false));
  assert.equal(exit, 0);
  const out = lines.join('\n');
  assert.equal(out.match(/no brain_url in/g)?.length, 1, 'named once, not per repo');
  assert.match(out, /multivac will not guess it from a git remote/);
  assert.doesNotMatch(out, /machine-local-alias/);
  assert.ok(!existsSync(join(app, '.gitmodules')));
});

test('a mount that git refuses is quoted and the other repos still sync — MV-127', async () => {
  const { brain } = eco('fail', '  bad: ../bad\n  good: ../good\n');
  const bad = repo(join(tmp, 'fail', 'bad'), 'a.txt', 'x\n');
  repo(join(tmp, 'fail', 'good'), 'b.txt', 'y\n');
  mkdirSync(join(bad, '.brain'), { recursive: true });
  writeFileSync(join(bad, '.brain', 'junk'), 'not a repo\n');

  const { lines, exit } = await withLocalSubmodules(() => reposSync(brain, false));
  assert.equal(exit, 1);
  const out = lines.join('\n');
  assert.match(out, /^bad: could not mount the brain at \.brain — fatal: '\.brain' already exists and is not a valid git repo$/m);
  assert.doesNotMatch(out, /failed in \//, 'the key names the repo; the absolute path is noise');
  assert.match(out, /good: mounted the brain at \.brain/);
});

test('a repo multivac does not own is never mounted — MV-125, MV-127', async () => {
  const { brain } = eco('notmine', '  vendor:\n    path: ../vendor\n    managed: false\n');
  const vendor = repo(join(tmp, 'notmine', 'vendor'), 'v.txt', 'v\n');

  const { lines, exit } = await withLocalSubmodules(() => reposSync(brain, false));
  assert.equal(exit, 0);
  assert.match(lines.join('\n'), /vendor: not managed, read-only — no mount expected/);
  assert.ok(!existsSync(join(vendor, '.brain')));
  assert.ok(!existsSync(join(vendor, '.gitmodules')));
});

test('the brain itself is never mounted inside itself — MV-127', async () => {
  const { brain } = eco('selfbrain', '  brain: .\n  app: ../app\n');
  repo(join(tmp, 'selfbrain', 'app'), 'a.txt', 'x\n');

  const { lines } = await withLocalSubmodules(() => reposSync(brain, false));
  // The brain still gets its ordinary fetch line; what it must never get is a
  // mount line, or a mount.
  assert.match(lines.join('\n'), /^brain: present at \. — fetched$/m);
  assert.doesNotMatch(lines.join('\n'), /^brain: (mounted|brain mounted|filled)/m);
  assert.ok(!existsSync(join(brain, '.brain')));
});

test('a declared repo that is not cloned gets no mount line — MV-127', async () => {
  const { brain } = eco('absent', '  ghost: ../ghost\n');
  const { lines, exit } = await withLocalSubmodules(() => reposSync(brain, false));
  assert.equal(exit, 0);
  assert.match(lines.join('\n'), /ghost: missing and no url/);
  assert.doesNotMatch(lines.join('\n'), /mounted the brain/);
});
