// `change apply` in a brain that has never been pushed: the base is the newer
// of local main and origin/main (printed, with why), and the change's own
// bookkeeping — committed by `new` and by apply's status-bump commit — is
// inherited from the base by every checkout apply hands back.
//
// Since MV-25 the branch lands in a per-change worktree, so the shared tree
// stays where it was. The in-place switch — and its refusal — is the
// fallback, forced here the way an old git would force it.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { loadChange, saveChange } from '../../src/change/file.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();

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

/** Brain==code scratch repo whose main has an extra commit, plus a stale
 *  `origin/main` ref written by hand (no remote, no network). */
function brainWithStaleRemote(): { brain: string; behind: string; ahead: string } {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-base-')));
  writeFileSync(join(eco.brain, '.multivac/config.yml'), 'doors: [agents]\nrepos:\n  brain: .\n');
  git(eco.brain, 'add', '-A');
  git(eco.brain, 'commit', '-q', '-m', 'brain==code');
  const behind = git(eco.brain, 'rev-parse', 'HEAD');
  git(eco.brain, 'update-ref', 'refs/remotes/origin/main', behind);
  writeFileSync(join(eco.brain, 'notes.md'), '# later\n');
  git(eco.brain, 'add', '-A');
  git(eco.brain, 'commit', '-q', '-m', 'local-only commit');
  return { brain: eco.brain, behind, ahead: git(eco.brain, 'rev-parse', 'HEAD') };
}

/** Where apply puts the work for `slug` in a brain==code repo. */
const wt = (brain: string, slug: string): string =>
  join(brain, '.multivac/worktrees', slug, 'brain');

/** Make `worktree add` fail the way an old git does: a file sits on the path. */
function blockWorktree(brain: string, slug: string): void {
  mkdirSync(join(brain, '.multivac/worktrees', slug), { recursive: true });
  writeFileSync(wt(brain, slug), 'not a worktree\n');
}

async function declare(brain: string, slug: string): Promise<void> {
  const ctx = { cwd: brain };
  assert.equal(await change.run(['new', slug, 'Base check'], ctx), 0);
  const parsed = await loadChange(brain, slug);
  parsed.change.repos = { brain: { status: 'planned' } };
  parsed.change.landing_order = [['brain']];
  await saveChange(brain, parsed);
}

test('local main ahead of origin/main: apply bases on local, and says why', async () => {
  const { brain } = brainWithStaleRemote();
  await declare(brain, 'base-check');
  const { code, out } = await capture(() => change.run(['apply', 'base-check'], { cwd: brain }));
  assert.equal(code, 0);
  assert.match(out, /branched base-check from main [0-9a-f]{7} — local main is ahead of origin\/main/);
  // the base is main's tip AFTER the bookkeeping commits — they come along
  assert.equal(git(brain, 'rev-parse', 'base-check^{commit}'), git(brain, 'rev-parse', 'main'));
});

test('origin/main ahead of local main: apply bases on the remote ref', async () => {
  // In a code repo: the brain's own bookkeeping commits always put its local
  // main ahead, but a declared repo can well be behind its remote.
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-base-')));
  const api = eco.repos.api;
  writeFileSync(join(api, 'notes.md'), '# later\n');
  git(api, 'add', '-A');
  git(api, 'commit', '-q', '-m', 'remote-only commit');
  const ahead = git(api, 'rev-parse', 'HEAD');
  git(api, 'update-ref', 'refs/remotes/origin/main', ahead);
  git(api, 'reset', '--hard', '-q', 'HEAD~1');

  const ctx = { cwd: eco.brain };
  assert.equal(await change.run(['new', 'remote-newer', 'Remote newer'], ctx), 0);
  const parsed = await loadChange(eco.brain, 'remote-newer');
  parsed.change.repos = { api: { status: 'planned' } };
  parsed.change.landing_order = [['api']];
  await saveChange(eco.brain, parsed);

  const { code, out } = await capture(() => change.run(['apply', 'remote-newer'], ctx));
  assert.equal(code, 0);
  assert.match(out, /from origin\/main [0-9a-f]{7} — origin\/main is ahead of local main/);
  assert.equal(git(api, 'rev-parse', 'remote-newer^{commit}'), ahead);
});

test('the worktree inherits the committed declaration, reservation and post-bump status', async () => {
  const { brain } = brainWithStaleRemote();
  // origin/main has no .multivac/changes/ at all; the bookkeeping is
  // committed on local main, so the branch base carries it anyway.
  await declare(brain, 'inherit-me');
  const id = (await loadChange(brain, 'inherit-me')).change.invariants.adds[0];

  const { code, out } = await capture(() => change.run(['apply', 'inherit-me'], { cwd: brain }));
  assert.equal(code, 0);
  assert.match(out, /committed: change apply: inherit-me — status branched/);
  assert.doesNotMatch(out, /carried onto the branch/);
  const w = wt(brain, 'inherit-me');
  assert.equal(git(w, 'rev-parse', '--abbrev-ref', 'HEAD'), 'inherit-me');
  // the declaration is in the worktree as a COMMITTED file, post-bump
  assert.equal(git(w, 'status', '--porcelain', '--', '.multivac'), '');
  assert.match(readFileSync(join(w, '.multivac/changes/inherit-me.md'), 'utf8'), /status: branched/);
  // the reserved row reached the worktree too
  assert.match(readFileSync(join(w, '.multivac/invariants.md'), 'utf8'), new RegExp(`\\| ${id} \\|`));
  // the shared tree never moved and is clean at the bookkeeping paths
  assert.equal(git(brain, 'rev-parse', '--abbrev-ref', 'HEAD'), 'main');
  assert.equal(
    git(brain, 'status', '--porcelain', '--', '.multivac/changes', '.multivac/invariants.md'),
    '',
  );
});

test('the in-place fallback inherits the committed bookkeeping the same way', async () => {
  const { brain } = brainWithStaleRemote();
  await declare(brain, 'in-place');
  blockWorktree(brain, 'in-place');
  const decl = join(brain, '.multivac/changes/in-place.md');

  const { code, out } = await capture(() => change.run(['apply', 'in-place'], { cwd: brain }));
  assert.equal(code, 0);
  assert.match(out, /no worktree available — branching in place/);
  assert.doesNotMatch(out, /carried onto the branch/);
  assert.equal(git(brain, 'rev-parse', '--abbrev-ref', 'HEAD'), 'in-place');
  assert.match(readFileSync(decl, 'utf8'), /status: branched/);
  assert.equal(git(brain, 'status', '--porcelain', '--', '.multivac/changes'), '');
});

test('other uncommitted work is refused by name with the command, not a raw git error', async () => {
  // the base (origin/main, ahead) carries notes.md; locally it is untracked
  // and different, so git aborts the switch on it
  const { brain, behind, ahead } = brainWithStaleRemote();
  git(brain, 'update-ref', 'refs/remotes/origin/main', ahead);
  git(brain, 'reset', '--hard', '-q', behind);
  writeFileSync(join(brain, 'notes.md'), '# dirty\n');
  await declare(brain, 'blocked');
  // only the in-place fallback can be blocked by the shared tree at all
  blockWorktree(brain, 'blocked');

  const lines: string[] = [];
  const orig = console.error;
  console.error = (l: string) => lines.push(String(l));
  let code: number;
  try {
    code = await change.run(['apply', 'blocked'], { cwd: brain });
  } finally {
    console.error = orig;
  }
  assert.equal(code, 1);
  const msg = lines.join('\n');
  assert.match(msg, /cannot branch blocked — .* carries uncommitted work: notes\.md/);
  assert.match(msg, /apply will not switch it to blocked under another change/);
  assert.match(msg, /git -C .* stash push -- notes\.md/);
  assert.match(msg, /multivac change apply blocked/);
  // nothing lost: the dirty file and the declaration are still there
  assert.equal(readFileSync(join(brain, 'notes.md'), 'utf8'), '# dirty\n');
  assert.ok(existsSync(join(brain, '.multivac/changes/blocked.md')));
  assert.equal(git(brain, 'rev-parse', '--abbrev-ref', 'HEAD'), 'main');
});

test('an existing branch is reused, not a failure', async () => {
  const { brain } = brainWithStaleRemote();
  await declare(brain, 'again');
  // no worktree: the branch is created in place, then re-applied onto it
  blockWorktree(brain, 'again');
  assert.equal(await change.run(['apply', 'again'], { cwd: brain }), 0);
  git(brain, 'switch', '-q', 'main');
  const { code, out } = await capture(() => change.run(['apply', 'again'], { cwd: brain }));
  assert.equal(code, 0);
  assert.match(out, /branch again already exists — switched to it, reusing/);
  assert.equal(git(brain, 'rev-parse', '--abbrev-ref', 'HEAD'), 'again');
});

test('a worktree that is already there is reused, not re-created', async () => {
  const { brain } = brainWithStaleRemote();
  await declare(brain, 'twice');
  assert.equal(await change.run(['apply', 'twice'], { cwd: brain }), 0);
  const { code, out } = await capture(() => change.run(['apply', 'twice'], { cwd: brain }));
  assert.equal(code, 0);
  assert.match(out, /worktree .*twice.brain \(already there\)/);
  assert.equal(git(wt(brain, 'twice'), 'rev-parse', '--abbrev-ref', 'HEAD'), 'twice');
});

test('origin/HEAD names the trunk when it is neither main nor master', async () => {
  const { brain } = brainWithStaleRemote();
  // A repo whose trunk is `trunk`: rename main, and record origin/HEAD the way
  // a clone does. No remote, no network — just the refs git already has.
  git(brain, 'branch', '-m', 'main', 'trunk');
  git(brain, 'update-ref', 'refs/remotes/origin/trunk', git(brain, 'rev-parse', 'trunk'));
  git(brain, 'symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/trunk');
  const trunk = git(brain, 'rev-parse', 'trunk');
  git(brain, 'switch', '-q', '-c', 'someone-elses-change');
  writeFileSync(join(brain, 'theirs.md'), '# not mine\n');
  git(brain, 'add', '-A');
  git(brain, 'commit', '-q', '-m', 'their work');

  await declare(brain, 'mine');
  const { code, out } = await capture(() => change.run(['apply', 'mine'], { cwd: brain }));
  assert.equal(code, 0);
  assert.match(out, /branched mine from trunk [0-9a-f]{7}/);
  assert.equal(git(brain, 'rev-parse', 'mine^{commit}'), trunk);
  // the other change's commit did not come along into the new checkout
  assert.ok(!existsSync(join(wt(brain, 'mine'), 'theirs.md')));
  // and the other change's tree was left exactly where it was
  assert.equal(git(brain, 'rev-parse', '--abbrev-ref', 'HEAD'), 'someone-elses-change');
  assert.ok(existsSync(join(brain, 'theirs.md')));
});

test('no default branch at all: the fallback names the branch it is building on', async () => {
  const { brain } = brainWithStaleRemote();
  git(brain, 'update-ref', '-d', 'refs/remotes/origin/main');
  git(brain, 'branch', '-m', 'main', 'trunk');
  git(brain, 'config', 'init.defaultBranch', 'trunk');
  await declare(brain, 'no-trunk');
  const found = await capture(() => change.run(['apply', 'no-trunk'], { cwd: brain }));
  assert.match(found.out, /branched no-trunk from trunk [0-9a-f]{7}/);
  // trunk's tip moved under the bookkeeping commits; the branch sits on it
  assert.equal(git(brain, 'rev-parse', 'no-trunk^{commit}'), git(brain, 'rev-parse', 'trunk'));

  // Now hide every hint: nothing offline can say which branch is the trunk,
  // so HEAD is all there is — and the message says whose commits come along.
  git(brain, 'config', '--unset', 'init.defaultBranch');
  git(brain, 'switch', '-q', 'trunk');
  git(brain, 'branch', '-m', 'trunk', 'somebodys-branch');
  await declare(brain, 'last-resort');
  const { code, out } = await capture(() => change.run(['apply', 'last-resort'], { cwd: brain }));
  assert.equal(code, 0);
  assert.match(out, /branching from the checked-out branch somebodys-branch/);
  assert.doesNotMatch(out, /no main or master/);
});
