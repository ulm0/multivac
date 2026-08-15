// The lifecycle's reporting: plan checks `adds` against the law table, land
// records with (or explicitly without) local merge evidence, close names the
// commit that stores the archive.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
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

/** Where apply puts the work: the per-change worktree (MV-25). */
const wt = (brain: string, slug: string): string =>
  join(brain, '.multivac/worktrees', slug, 'brain');

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

/** brain==code scratch repo with one law row (ACME-1) already written. */
function brain(): string {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-polish-')));
  writeFileSync(join(eco.brain, '.multivac/config.yml'), 'doors: [agents]\nrepos:\n  brain: .\n');
  writeFileSync(
    join(eco.brain, '.multivac/invariants.md'),
    [
      '# Invariants',
      '',
      '| ID | statement | authority | state | date | source |',
      '| --- | --- | --- | --- | --- | --- |',
      '| ACME-1 | points expire after a year. | specified | active | 2026-01-01 | design |',
      '',
    ].join('\n'),
  );
  git(eco.brain, 'add', '-A');
  git(eco.brain, 'commit', '-q', '-m', 'brain==code');
  return eco.brain;
}

async function declare(b: string, slug: string, adds: string[] = []): Promise<void> {
  assert.equal(await change.run(['new', slug, 'Polish check'], { cwd: b }), 0);
  const parsed = await loadChange(b, slug);
  parsed.change.repos = { brain: { status: 'planned' } };
  parsed.change.landing_order = [['brain']];
  parsed.change.invariants.adds = adds;
  await saveChange(b, parsed);
}

test('the scaffold teaches: commented example with the status enum, and new prints the three edits', async () => {
  const b = brain();
  const { code, out } = await capture(() => change.run(['new', 'teach-me', 'Teach me'], { cwd: b }));
  assert.equal(code, 0);
  // the scaffold body carries a commented example naming the whole enum
  const body = readFileSync(join(b, '.multivac/changes/teach-me.md'), 'utf8');
  assert.match(body, /# repos: \{ api: \{ status: planned \} \} — planned\|branched\|committed\|mr\|landed/);
  // and new says exactly what the author has to edit before plan
  assert.match(out, /three edits before plan:/);
  assert.match(out, /1\. repos: \{ api: \{ status: planned \} \}\s+# status: planned\|branched\|committed\|mr\|landed/);
  assert.match(out, /2\. landing_order: \[\[api\]\]/);
  assert.match(out, /3\. claims: \[\{ id: ACME-2, statement: "\.\.\." \}\]/);
  // the bookkeeping went in as one commit on the current branch
  assert.match(out, /committed: change open: teach-me — reserves ACME-2/);
  assert.equal(git(b, 'status', '--porcelain', '--', '.multivac/changes/teach-me.md', '.multivac/invariants.md'), '');
});

test('plan checks adds against the law table, not only touches/retires', async () => {
  const b = brain();
  await declare(b, 'adds-check', ['ACME-1', 'ACME-9']);
  const { code, out } = await capture(() => change.run(['plan', 'adds-check'], { cwd: b }));
  assert.equal(code, 0);
  // the row exists: it is not new, whatever the change file says
  assert.match(out, /invariant ACME-1: already in \.multivac\/invariants\.md \(active\) — not new/);
  assert.doesNotMatch(out, /invariant ACME-1: new/);
  // the row that really is missing is reserved here, at declare time (MV-26)
  assert.match(out, /invariant ACME-9: reserved — proposed row in \.multivac\/invariants\.md/);
});

test('land records a local merge as evidence, and offers the local path with no origin', async () => {
  const b = brain();
  await declare(b, 'merged-here');
  // no origin remote in the fixture: push+MR is noise, the local merge is the path
  const ready = await capture(() => change.run(['land', 'merged-here'], { cwd: b }));
  assert.match(ready.out, /no origin remote — land locally: git -C .* switch main && git merge --no-ff merged-here/);
  assert.doesNotMatch(ready.out, /push -u origin/);

  assert.equal(await change.run(['apply', 'merged-here'], { cwd: b }), 0);
  // the work happens in the change's worktree; the shared tree stays on main.
  // The worktree starts clean — the bookkeeping came in committed — so the
  // work is a real edit.
  writeFileSync(join(wt(b, 'merged-here'), 'work.md'), '# the change\n');
  git(wt(b, 'merged-here'), 'add', '-A');
  git(wt(b, 'merged-here'), 'commit', '-q', '-m', 'the change');
  assert.equal(git(b, 'rev-parse', '--abbrev-ref', 'HEAD'), 'main');
  // the declaration is committed on both sides — the merge has no overlap
  git(b, 'merge', '-q', '--no-ff', '-m', 'merge', 'merged-here');

  const seen = await capture(() => change.run(['land', 'merged-here'], { cwd: b }));
  assert.match(seen.out, /merged-here is already merged into main — record it/);
  const { code, out } = await capture(() =>
    change.run(['land', 'merged-here', '--landed', 'brain'], { cwd: b }),
  );
  assert.equal(code, 0);
  assert.match(out, /brain: recorded as landed — merged-here is merged into main [0-9a-f]{7}/);
  assert.doesNotMatch(out, /without evidence/);
});

test('land without a local merge records anyway, and says it has no evidence', async () => {
  const b = brain();
  await declare(b, 'trust-me');
  assert.equal(await change.run(['apply', 'trust-me'], { cwd: b }), 0);
  const { code, out } = await capture(() =>
    change.run(['land', 'trust-me', '--landed', 'brain'], { cwd: b }),
  );
  assert.equal(code, 0);
  // just branched: the tip equals main, which is no proof of anything
  assert.match(out, /recorded as landed — recording without evidence: trust-me and main are the same commit/);
  const { change: c } = await loadChange(b, 'trust-me');
  assert.equal(c.repos.brain.status, 'landed'); // still recorded: trust, stated

  // real work on the branch, never merged: still recorded, still no evidence
  await declare(b, 'never-merged');
  assert.equal(await change.run(['apply', 'never-merged'], { cwd: b }), 0);
  writeFileSync(join(wt(b, 'never-merged'), 'work.md'), '# work\n');
  git(wt(b, 'never-merged'), 'add', '-A');
  git(wt(b, 'never-merged'), 'commit', '-q', '-m', 'work');
  const second = await capture(() =>
    change.run(['land', 'never-merged', '--landed', 'brain'], { cwd: b }),
  );
  assert.match(second.out, /without evidence: never-merged is not contained in main here/);
});

test('close names the commit that stores the archive, scoped to this change', async () => {
  const b = brain();
  await declare(b, 'say-commit');
  assert.equal(await change.run(['land', 'say-commit', '--landed', 'brain'], { cwd: b }), 0);
  const { code, out } = await capture(() => change.run(['close', 'say-commit'], { cwd: b }));
  assert.equal(code, 0);
  // scoped paths, never add -A; the released reservation's law edit rides too
  assert.match(
    out,
    /archived — commit this: git -C .* add -- \.multivac\/changes\/archive\/say-commit\.md \.multivac\/changes\/say-commit\.md \.multivac\/invariants\.md && git commit -m "Archive the say-commit change"/,
  );
  assert.doesNotMatch(out, /add -A/);
  // no origin remote: the direct commit is the landing, and close says so
  assert.match(out, /no origin remote — the direct commit is the landing/);
  assert.match(git(b, 'status', '--porcelain', '-uall'), /changes\/archive\/say-commit\.md/);
});

test('close on a trunk with a remote prints the branch+MR variant; on a branch, that branch', async () => {
  const b = brain();
  git(b, 'remote', 'add', 'origin', b);
  await declare(b, 'mr-close');
  assert.equal(await change.run(['land', 'mr-close', '--landed', 'brain'], { cwd: b }), 0);
  const onMain = await capture(() => change.run(['close', 'mr-close'], { cwd: b }));
  assert.equal(onMain.code, 0);
  // on the trunk of a brain with a remote: nothing lands on main directly
  assert.match(onMain.out, /archived — commit this on a branch; nothing lands on main directly:/);
  assert.match(onMain.out, /git -C .* switch -c close-mr-close && git add -- \.multivac\/changes\/archive\/mr-close\.md \.multivac\/changes\/mr-close\.md/);
  assert.match(onMain.out, /then open MR close-mr-close -> main/);
  assert.doesNotMatch(onMain.out, /add -A/);

  // standing on a working branch already: the commit flows through its MR
  git(b, 'add', '-A');
  git(b, 'commit', '-q', '-m', 'settle mr-close leftovers');
  await declare(b, 'branch-close');
  assert.equal(await change.run(['land', 'branch-close', '--landed', 'brain'], { cwd: b }), 0);
  git(b, 'add', '-A');
  git(b, 'commit', '-q', '-m', 'settle landed status');
  git(b, 'switch', '-q', '-c', 'some-working-branch');
  const onBranch = await capture(() => change.run(['close', 'branch-close'], { cwd: b }));
  assert.equal(onBranch.code, 0);
  assert.match(
    onBranch.out,
    /archived — commit this on some-working-branch \(it lands through that branch's MR\): git -C .* add -- \.multivac\/changes\/archive\/branch-close\.md/,
  );
});
