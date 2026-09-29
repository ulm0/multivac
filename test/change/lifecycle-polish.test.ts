// The lifecycle's reporting: plan checks `adds` against the law table, land
// records with (or explicitly without) local merge evidence, close names the
// commit that stores the archive.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem, publishRepo } from '../helpers/fixture.js';
import { SPECKIT_INTEGRATION_JSON } from '../helpers/recorded.js';
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
  assert.doesNotMatch(out, /no local merge commit/);
});

test('land without a local merge records anyway, and says what it could not see', async () => {
  const b = brain();
  await declare(b, 'trust-me');
  assert.equal(await change.run(['apply', 'trust-me'], { cwd: b }), 0);
  const { code, out } = await capture(() =>
    change.run(['land', 'trust-me', '--landed', 'brain'], { cwd: b }),
  );
  assert.equal(code, 0);
  // just branched: the tip equals main, which is no proof of anything
  assert.match(
    out,
    /recorded as landed — no local merge commit to confirm it \(trust-me and main are the same commit[^)]*\); normal for an MR merged on the remote, or squashed/,
  );
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
  assert.match(second.out, /no local merge commit to confirm it \(never-merged is not contained in main here/);
});

// --- MV-80: landing read from the channel, not from commit containment ----

/**
 * brain==code with an origin, one law row (ACME-1) anchored at `points.ts`.
 * `publishCode` decides whether that file is in what origin/main carries: true
 * is a change that landed, false is a change whose work exists only locally —
 * which is what "not landed" and "not fetched" both look like from here.
 */
function publishedBrain(publishCode: boolean, extraRepos = ''): string {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-channel-'));
  const eco = makeScratchEcosystem(tmp);
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    `doors: [agents]\nrepos:\n  brain: .\n${extraRepos}`,
  );
  writeFileSync(
    join(eco.brain, '.multivac/invariants.md'),
    [
      '# Invariants',
      '',
      '| ID | statement | authority | state | date | source |',
      '| --- | --- | --- | --- | --- | --- |',
      '| ACME-1 | points expire after a year. | specified | active | 2026-01-01 | design |',
      '<!-- @anchor ACME-1 brain:points.ts /expiresAt/ -->',
      '',
    ].join('\n'),
  );
  const code = (): void => {
    writeFileSync(join(eco.brain, 'points.ts'), 'export const expiresAt = 365;\n');
    git(eco.brain, 'add', '-A');
    git(eco.brain, 'commit', '-q', '-m', 'the work');
  };
  git(eco.brain, 'add', '-A');
  git(eco.brain, 'commit', '-q', '-m', 'brain==code');
  if (publishCode) code();
  publishRepo(eco.brain, tmp, 'brain');
  if (!publishCode) code();
  return eco.brain;
}

/** Declare the change and point it at ACME-1, the row `publishedBrain` anchors. */
async function claimAcme1(b: string, slug: string): Promise<void> {
  await declare(b, slug);
  const parsed = await loadChange(b, slug);
  parsed.change.claims = [{ id: 'ACME-1', statement: 'points expire after a year' }];
  await saveChange(b, parsed);
}

test('land reads landing from the channel: published bytes are the evidence a squash destroys', async () => {
  const b = publishedBrain(true);
  await claimAcme1(b, 'points-live');
  // The report offers the conclusion and the command that records it. It never
  // records anything itself: the assertion stays the operator's.
  const report = await capture(() => change.run(['land', 'points-live'], { cwd: b }));
  assert.equal(report.code, 0);
  assert.match(
    report.out,
    /channel: every declared claim resolves at origin\/main [0-9a-f]{7} \(never fetched here\) — the work is published there, however it got in — record it: multivac change land points-live --landed <repo>/,
  );
  assert.equal((await loadChange(b, 'points-live')).change.repos.brain.status, 'planned');

  const rec = await capture(() => change.run(['land', 'points-live', '--landed', 'brain'], { cwd: b }));
  assert.equal(rec.code, 0);
  // Two statements on two lines, each in its own scope: the repo line says
  // what was recorded and what could be seen locally, the channel line is the
  // verdict about the CHANGE. The command that records is not offered again.
  assert.match(rec.out, /^brain: recorded as landed — no local merge commit to confirm it/m);
  assert.match(
    rec.out,
    /^channel: every declared claim resolves at origin\/main [0-9a-f]{7} \(never fetched here\) — the work is published there, however it got in$/m,
  );
  assert.doesNotMatch(rec.out, /record it: multivac change land points-live --landed <repo>/);
});

test('the channel verdict is per change, never behind the repo key --landed names', async () => {
  // Two declared repos, one channel read. Attributing that read to whichever
  // repo `--landed` happens to name would print the BRAIN's ref and sha as
  // api's evidence — an attribution nothing checked.
  const b = publishedBrain(true, '  api: ../acme-api\n');
  await declare(b, 'two-repos');
  const parsed = await loadChange(b, 'two-repos');
  parsed.change.claims = [{ id: 'ACME-1', statement: 'points expire after a year' }];
  parsed.change.repos = { brain: { status: 'planned' }, api: { status: 'planned' } };
  parsed.change.landing_order = [['brain', 'api']];
  await saveChange(b, parsed);

  const rec = await capture(() => change.run(['land', 'two-repos', '--landed', 'api'], { cwd: b }));
  assert.equal(rec.code, 0);
  assert.match(rec.out, /^channel: every declared claim resolves at origin\/main [0-9a-f]{7}/m);
  assert.doesNotMatch(rec.out, /api: recorded as landed — every declared claim resolves/);
  assert.doesNotMatch(rec.out, /api: .*origin\/main/);
  // ...and the gate the last repo would arm is not announced early: brain is
  // still outstanding, so nothing about `--strict` is true yet.
  assert.doesNotMatch(rec.out, /every repo is now landed/);
});

test('a channel that does not resolve says so, instead of going quiet about landing', async () => {
  // No origin anywhere: the report form used to print nothing at all about
  // landing, which reads as "checked, fine" and is neither.
  const b = brain();
  await claimAcme1(b, 'no-remote');
  const { code, out } = await capture(() => change.run(['land', 'no-remote'], { cwd: b }));
  assert.equal(code, 0);
  assert.match(
    out,
    /^channel: origin\/main does not resolve here \(no remote, or never fetched\) — nothing read, so landing is unverified either way: `multivac repos sync`, then re-read$/m,
  );
});

test('landing the last repo says the strict gate is now armed, and CI runs it', async () => {
  const b = publishedBrain(true);
  await claimAcme1(b, 'last-repo');
  const { code, out } = await capture(() =>
    change.run(['land', 'last-repo', '--landed', 'brain'], { cwd: b }),
  );
  assert.equal(code, 0);
  assert.match(
    out,
    /every repo is now landed — once every declared claim resolves, `verify --strict` refuses last-repo as unclosed \(MV-80\), here and in CI, until: multivac change close last-repo/,
  );
});

test('an unresolved claim at the channel is not landed OR not fetched, and land says both', async () => {
  const b = publishedBrain(false);
  await claimAcme1(b, 'points-later');
  const rec = await capture(() => change.run(['land', 'points-later', '--landed', 'brain'], { cwd: b }));
  assert.equal(rec.code, 0);
  // MV-54's limit, carried: the ref's age is named and the negative is never
  // reported as "not landed" alone.
  assert.match(
    rec.out,
    /not every declared claim resolves at origin\/main [0-9a-f]{7} \(never fetched here\) — not landed, or not fetched: `multivac repos sync`, then re-read/,
  );
  // ...and the record is still written: the read offers, the human asserts.
  assert.equal((await loadChange(b, 'points-later')).change.repos.brain.status, 'landed');
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
    /archived — commit this: git -C .* add -- \.multivac\/changes\/archive\/say-commit\.md \.multivac\/changes\/say-commit\.md \.multivac\/invariants\.md \.multivac\/ecosystem\.json && git commit -m "Archive the say-commit change"/,
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
  // MV-110: this used to be `git add -A && git commit` — the sweep that hid the
  // defect. `land` commits its own status bump now, so the assertion is that
  // there is nothing left to settle. A test that sweeps the tree cannot see an
  // uncommitted lifecycle write, which is why the write went unnoticed.
  assert.equal(
    execFileSync('git', ['-C', b, 'status', '--porcelain', '--', '.multivac'], { encoding: 'utf8' }).trim(),
    '',
    'land left the bookkeeping paths dirty',
  );
  git(b, 'switch', '-q', '-c', 'some-working-branch');
  const onBranch = await capture(() => change.run(['close', 'branch-close'], { cwd: b }));
  assert.equal(onBranch.code, 0);
  assert.match(
    onBranch.out,
    /archived — commit this on some-working-branch \(it lands through that branch's MR\): git -C .* add -- \.multivac\/changes\/archive\/branch-close\.md/,
  );
});

/** A brain with speckit declared, its constitution written, and the vendor stubbed. */
function sddBrain(): string {
  const b = brain();
  writeFileSync(
    join(b, '.multivac/config.yml'),
    'doors: [agents]\nsdd: speckit\nrepos:\n  brain: .\n',
  );
  mkdirSync(join(b, '.specify/memory'), { recursive: true });
  writeFileSync(join(b, '.specify/memory/constitution.md'), '# Constitution\n\nOne principle: ship what you can check.\n');
  git(b, 'add', '-A');
  git(b, 'commit', '-q', '-m', 'sdd declared');
  return b;
}

/** What /speckit.specify and its siblings would have written for this slug. */
function featureDir(b: string, n: string, slug: string): string {
  const dir = join(b, 'specs', `${n}-${slug}`);
  mkdirSync(dir, { recursive: true });
  for (const f of ['spec.md', 'plan.md', 'tasks.md']) {
    writeFileSync(join(dir, f), `# ${f} for ${slug}\n`);
  }
  return dir;
}

test('close stages what the SDD wrote in the brain for this slug — MV-144', async () => {
  const b = sddBrain();
  await declare(b, 'artifacts-land');
  featureDir(b, '001', 'artifacts-land');
  assert.equal(await change.run(['land', 'artifacts-land', '--landed', 'brain'], { cwd: b }), 0);
  const { code, out } = await capture(() => change.run(['close', 'artifacts-land'], { cwd: b }));
  assert.equal(code, 0, out);
  const add = out.split('\n').find((l) => l.includes('add -- '))!;
  assert.ok(add.includes('specs/001-artifacts-land'), add);
  // Running the printed command leaves nothing of the change's own behind.
  const pathspec = add.slice(add.indexOf('add --') + 7, add.indexOf('&& git commit')).trim();
  git(b, 'add', '--', ...pathspec.split(/\s+/));
  const left = git(b, 'status', '--porcelain', '-uall')
    .split('\n')
    .filter((l) => l.includes('specs/001-artifacts-land') && !l.startsWith('A '));
  assert.deepEqual(left, [], 'every artifact path is staged');
});

test('a deletion inside the feature directory lands in the same commit — MV-144', async () => {
  const b = sddBrain();
  await declare(b, 'artifact-gone');
  const dir = featureDir(b, '002', 'artifact-gone');
  // A file that was committed and is now deleted: git reports it as ` D`.
  git(b, 'add', '--', 'specs/002-artifact-gone');
  git(b, 'commit', '-q', '-m', 'the artifacts, committed earlier');
  rmSync(join(dir, 'plan.md'));
  assert.equal(await change.run(['land', 'artifact-gone', '--landed', 'brain'], { cwd: b }), 0);
  const { out } = await capture(() => change.run(['close', 'artifact-gone'], { cwd: b }));
  const add = out.split('\n').find((l) => l.includes('add -- '))!;
  assert.ok(add.includes('specs/002-artifact-gone'), add);
  const pathspec = add.slice(add.indexOf('add --') + 7, add.indexOf('&& git commit')).trim();
  git(b, 'add', '--', ...pathspec.split(/\s+/));
  assert.match(git(b, 'status', '--porcelain'), /^D  specs\/002-artifact-gone\/plan\.md$/m);
});

test('a dirty file the change did not write is named, never staged — MV-46, MV-144', async () => {
  const b = sddBrain();
  await declare(b, 'not-mine');
  featureDir(b, '003', 'not-mine');
  writeFileSync(join(b, '.specify/memory/constitution.md'), '# Constitution\n\nEdited by a human, mid-change.\n');
  assert.equal(await change.run(['land', 'not-mine', '--landed', 'brain'], { cwd: b }), 0);
  const { out } = await capture(() => change.run(['close', 'not-mine'], { cwd: b }));
  assert.match(out, /sdd speckit: \.specify\/memory\/constitution\.md is dirty and was not staged — it is not this change's to commit/);
  const add = out.split('\n').find((l) => l.includes('add -- '))!;
  assert.ok(!add.includes('constitution.md'), add);
});

test('with no SDD declared the archive pathspec is what it always was — MV-144', async () => {
  const b = brain();
  await declare(b, 'no-sdd-here');
  assert.equal(await change.run(['land', 'no-sdd-here', '--landed', 'brain'], { cwd: b }), 0);
  const { out } = await capture(() => change.run(['close', 'no-sdd-here'], { cwd: b }));
  const add = out.split('\n').find((l) => l.includes('add -- '))!;
  assert.match(
    add,
    /add -- \.multivac\/changes\/archive\/no-sdd-here\.md \.multivac\/changes\/no-sdd-here\.md \.multivac\/invariants\.md \.multivac\/ecosystem\.json &&/,
  );
});

// --- MV-146: close lands the brain's specs whatever the flags say, and cites them ---

/** The pathspec of the commit close printed, and the result of running its `add`. */
function runPrintedAdd(b: string, out: string): string[] {
  const add = out.split('\n').find((l) => l.includes('add -- '))!;
  const pathspec = add.slice(add.indexOf('add --') + 7, add.indexOf('&& git commit')).trim().split(/\s+/);
  git(b, 'add', '--', ...pathspec);
  return pathspec;
}

/** Paths git still reports under `under` that are not staged. */
const unstaged = (b: string, under: string): string[] =>
  git(b, 'status', '--porcelain', '-uall')
    .split('\n')
    .filter((l) => l.includes(under) && (l[1] !== ' ' || l.startsWith('??')));

/** A code-less brain with spec-kit installed, governing api; `extra` lines go above `repos:`. */
function codeBrain(extra: string[] = []): string {
  const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-polish-code-')));
  const b = eco.brain;
  writeFileSync(join(b, '.multivac/config.yml'), ['doors: [agents]', 'sdd: speckit', ...extra, 'repos:', '  api: ../acme-api', ''].join('\n'));
  mkdirSync(join(b, '.specify/memory'), { recursive: true });
  writeFileSync(join(b, '.specify/integration.json'), SPECKIT_INTEGRATION_JSON);
  writeFileSync(join(b, '.specify/memory/constitution.md'), '# Constitution\n\nOne principle: ship what you can check.\n');
  git(b, 'add', '-A');
  git(b, 'commit', '-q', '-m', 'sdd declared');
  return b;
}

test('close cites and stages the directory, whatever --no-sdd says', async () => {
  for (const [label, extra, flags] of [
    ['--no-sdd', [], ['--no-sdd']],
    ['sdd_auto: false', ['sdd_auto: false'], []],
  ] as const) {
    const b = codeBrain([...extra]);
    const slug = 'cite-me';
    assert.equal(await change.run(['new', slug, 'Cite me'], { cwd: b }), 0, label);
    const parsed = await loadChange(b, slug);
    parsed.change.repos = { api: { status: 'landed' } };
    parsed.change.landing_order = [['api']];
    parsed.change.invariants.adds = [];
    await saveChange(b, parsed);
    const before = (await loadChange(b, slug)).body;
    featureDir(b, '001', slug);

    const { code, out } = await capture(() => change.run(['close', slug, ...flags], { cwd: b }));
    assert.equal(code, 0, `${label}\n${out}`);
    // The flags skip the steps and their gates; they never meant "leave what
    // was written uncommitted".
    assert.ok(runPrintedAdd(b, out).includes('specs/001-cite-me'), `${label}\n${out}`);
    assert.deepEqual(unstaged(b, 'specs/001-cite-me'), [], label);
    // The archived body is the body it held, byte for byte, and one line more.
    const archived = readFileSync(join(b, '.multivac/changes/archive', `${slug}.md`), 'utf8');
    const body = archived.slice(archived.indexOf('\n---\n') + 6);
    assert.ok(body.startsWith(before), label);
    assert.equal(body.slice(before.length), '\nSpecified in `specs/001-cite-me/` (speckit).\n', label);
    // No steps ran, so nothing is said about a directory that is there.
    assert.doesNotMatch(out, /nothing cited/, label);
  }
});

test('a close that finds no directory says it cited nothing, and only with the steps on', async () => {
  const b = sddBrain();
  await declare(b, 'no-dir');
  assert.equal(await change.run(['land', 'no-dir', '--landed', 'brain'], { cwd: b }), 0);
  const { code, out } = await capture(() => change.run(['close', 'no-dir'], { cwd: b }));
  assert.equal(code, 0, out);
  assert.match(out, /^sdd speckit: no directory for no-dir in the brain or its worktree — nothing cited$/m);
  const archived = readFileSync(join(b, '.multivac/changes/archive/no-dir.md'), 'utf8');
  assert.doesNotMatch(archived, /Specified in/);

  git(b, 'add', '-A');
  git(b, 'commit', '-q', '-m', 'settle');
  await declare(b, 'no-dir-skipped');
  assert.equal(await change.run(['land', 'no-dir-skipped', '--landed', 'brain', '--no-sdd'], { cwd: b }), 0);
  const skipped = await capture(() => change.run(['close', 'no-dir-skipped', '--no-sdd'], { cwd: b }));
  assert.equal(skipped.code, 0, skipped.out);
  assert.doesNotMatch(skipped.out, /nothing cited/);
});

/** Requirement blocks as `openspec instructions` guides a delta to carry them. */
const WEEKLY = [
  '### Requirement: Billing cadence',
  'The system SHALL bill weekly.',
  '',
  '#### Scenario: Weekly bill',
  '- **WHEN** a week ends',
  '- **THEN** one bill is sent',
].join('\n');
const REFUND = [
  '### Requirement: Refund window',
  'The system SHALL refund within 30 days.',
  '',
  '#### Scenario: Refund',
  '- **WHEN** a customer asks within 30 days',
  '- **THEN** the payment is refunded',
].join('\n');

/**
 * An opsx brain==code brain whose change `slug` is proposed, committed and
 * landed: a MODIFIED delta for `billing`, whose main spec exists, and an ADDED
 * one for the new capability `refunds`, each written with `eol`.
 */
async function opsxProposed(slug: string, eol = '\n'): Promise<{ b: string; arch: string; moved: string }> {
  const b = brain();
  writeFileSync(join(b, '.multivac/config.yml'), 'doors: [agents]\nsdd: opsx\nrepos:\n  brain: .\n');
  mkdirSync(join(b, 'openspec/specs/billing'), { recursive: true });
  writeFileSync(join(b, 'openspec/config.yaml'), 'schema: spec-driven\n');
  writeFileSync(
    join(b, 'openspec/specs/billing/spec.md'),
    '# billing Specification\n\n## Requirements\n\n### Requirement: Billing cadence\nThe system SHALL bill monthly.\n',
  );
  git(b, 'add', '-A');
  git(b, 'commit', '-q', '-m', 'opsx installed, one main spec');
  await declare(b, slug);
  // The change as `openspec instructions` guided it, committed — the way
  // brain==code lands it through the change's branch.
  const moved = join(b, 'openspec/changes', slug);
  for (const [f, body] of [
    ['proposal.md', '# Bill weekly\n'],
    ['tasks.md', '- [x] 1.1 bill weekly\n'],
    ['specs/billing/spec.md', `## MODIFIED Requirements\n\n${WEEKLY}\n`],
    ['specs/refunds/spec.md', `## ADDED Requirements\n\n${REFUND}\n`],
  ]) {
    mkdirSync(join(moved, f, '..'), { recursive: true });
    writeFileSync(join(moved, f), body.split('\n').join(eol));
  }
  git(b, 'add', '-A');
  git(b, 'commit', '-q', '-m', 'the change, proposed');
  assert.equal(await change.run(['land', slug, '--landed', 'brain', '--no-sdd'], { cwd: b }), 0);
  // Every archive moves the directory under a dated one, merged or not.
  const arch = `openspec/changes/archive/2026-09-28-${slug}`;
  mkdirSync(join(b, 'openspec/changes/archive'), { recursive: true });
  execFileSync('mv', [moved, join(b, arch)]);
  return { b, arch, moved: `openspec/changes/${slug}` };
}

test('an opsx archive lands with the specs it merged and the directory it moved', async () => {
  // A CRLF twin too: openspec 1.13.2 merges a CRLF delta and writes it LF,
  // so no block is in the main spec byte for byte, and the merge still lands.
  for (const eol of ['\n', '\r\n']) {
    const { b, arch, moved } = await opsxProposed('bill-weekly', eol);
    // What `openspec archive bill-weekly --json --yes` does, measured on 1.13.2:
    // each capability delta is merged into the main specs, block by block —
    // an existing one changed, a new one created — and written LF.
    writeFileSync(
      join(b, 'openspec/specs/billing/spec.md'),
      `# billing Specification\n\n## Requirements\n\n${WEEKLY}\n`,
    );
    mkdirSync(join(b, 'openspec/specs/refunds'), { recursive: true });
    writeFileSync(
      join(b, 'openspec/specs/refunds/spec.md'),
      `# refunds Specification\n\n## Purpose\nTBD - created by archiving change bill-weekly. Update Purpose after archive.\n\n## Requirements\n\n${REFUND}\n`,
    );

    const { code, out } = await capture(() => change.run(['close', 'bill-weekly'], { cwd: b }));
    assert.equal(code, 0, out);
    assert.doesNotMatch(out, /is dirty and was not staged/, JSON.stringify(eol));
    const pathspec = runPrintedAdd(b, out);
    // Each merged main spec by its file: the archive merged `<cap>/spec.md`, and
    // nothing else in the capability's directory is this close's.
    for (const p of [arch, moved, 'openspec/specs/billing/spec.md', 'openspec/specs/refunds/spec.md']) {
      assert.ok(pathspec.includes(p), `${JSON.stringify(eol)}: ${p} in ${pathspec.join(' ')}`);
    }
    // After the printed add, nothing of the change is left out of the commit.
    for (const under of ['bill-weekly', 'openspec/specs/']) assert.deepEqual(unstaged(b, under), [], under);
    assert.match(
      readFileSync(join(b, '.multivac/changes/archive/bill-weekly.md'), 'utf8'),
      /\nSpecified in `openspec\/changes\/archive\/2026-09-28-bill-weekly\/` \(opsx\)\.\n$/,
    );
  }
});

test('a main spec the archive did not merge into is named, not staged', async () => {
  // MV-147: `openspec archive <slug> --json --skip-specs` moves the change and
  // leaves every main spec as it was (1.13.2) — a human's uncommitted line in
  // one, and a human's untracked draft of the new capability, are theirs. A
  // CRLF delta is read as the merge reads it, never as a delta with no block.
  for (const eol of ['\n', '\r\n']) {
    const { b, arch, moved } = await opsxProposed('bill-skip', eol);
    writeFileSync(
      join(b, 'openspec/specs/billing/spec.md'),
      '# billing Specification\n\n## Requirements\n\n### Requirement: Billing cadence\nThe system SHALL bill monthly.\n\nA human note, uncommitted.\n',
    );
    mkdirSync(join(b, 'openspec/specs/refunds'), { recursive: true });
    writeFileSync(join(b, 'openspec/specs/refunds/spec.md'), '# refunds, a draft by a human\n');

    const { code, out } = await capture(() => change.run(['close', 'bill-skip'], { cwd: b }));
    assert.equal(code, 0, out);
    for (const p of ['openspec/specs/billing/spec.md', 'openspec/specs/refunds/spec.md']) {
      assert.match(
        out,
        new RegExp(`^sdd opsx: ${p.replace(/[./]/g, '\\$&')} is dirty and was not staged — it is not this change's to commit$`, 'm'),
        JSON.stringify(eol),
      );
    }
    const pathspec = runPrintedAdd(b, out);
    assert.ok(!pathspec.some((p) => p.startsWith('openspec/specs')), pathspec.join(' '));
    // The archive and the directory it moved still land.
    for (const p of [arch, moved]) assert.ok(pathspec.includes(p), `${p} in ${pathspec.join(' ')}`);
    assert.match(git(b, 'status', '--porcelain', '-uall'), /^ M openspec\/specs\/billing\/spec\.md$/m);
    assert.match(git(b, 'status', '--porcelain', '-uall'), /^\?\? openspec\/specs\/refunds\/spec\.md$/m);
  }
});

test('--abandon stages the slug\'s directory and cites it too', async () => {
  const b = sddBrain();
  assert.equal(await change.run(['new', 'drop-it', 'Drop it'], { cwd: b }), 0);
  const before = (await loadChange(b, 'drop-it')).body;
  featureDir(b, '004', 'drop-it');
  const { code, out } = await capture(() => change.run(['close', 'drop-it', '--abandon'], { cwd: b }));
  assert.equal(code, 0, out);
  assert.match(out, /^commit it: git -C .* add -- \.multivac\/changes\/archive\/drop-it\.md \.multivac\/changes\/drop-it\.md \.multivac\/invariants\.md specs\/004-drop-it && git commit -m "Abandon the drop-it change"$/m);
  const archived = readFileSync(join(b, '.multivac/changes/archive/drop-it.md'), 'utf8');
  const body = archived.slice(archived.indexOf('\n---\n') + 6);
  assert.ok(body.startsWith(before));
  assert.equal(body.slice(before.length), '\nSpecified in `specs/004-drop-it/` (speckit).\n');
});
