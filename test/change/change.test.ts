import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { loadChange, saveChange, scaffoldChange } from '../../src/change/file.js';
import { main } from '../../src/cli.js';

// CI containers have no git identity; apply's greenfield commit inherits the
// environment (deliberately — multivac never fabricates identity), so the test
// provides one the way a real machine would.
for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const tmp = mkdtempSync(join(tmpdir(), 'mvac-change-'));
const eco = makeScratchEcosystem(tmp);
const ctx = { cwd: eco.brain };
const svc = join(tmp, 'acme-svc');

// svc: declared but nonexistent (greenfield); mirror: cloneable from a local url;
// grapher declared with an unknown adapter (must degrade to a notice, exit 0).
// An unknown SDD is refused at load instead (MV-146): no scaffold, gate or step
// could honour it, and the first test says so.
const CONFIG = [
  'doors: [agents]',
  'grapher: acme-graph',
  'repos:',
  '  api: ../acme-api',
  '  web: ../acme-web',
  '  svc: ../acme-svc',
  '  mirror:',
  '    path: ../acme-mirror',
  `    url: ${eco.repos.api}`,
  '',
].join('\n');
writeFileSync(join(eco.brain, '.multivac/config.yml'), CONFIG);

const gitOut = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();

test('new scaffolds the change file (unknown grapher = notice, still 0; unknown SDD = refused, 2)', async () => {
  writeFileSync(join(eco.brain, '.multivac/config.yml'), CONFIG.replace('doors: [agents]\n', 'doors: [agents]\nsdd: acme-sdd-not-installed\n'));
  const errs: string[] = [];
  const origErr = console.error;
  console.error = (...a: unknown[]) => { errs.push(a.map(String).join(' ')); };
  try {
    assert.equal(await main(['change', 'new', 'points-expire', 'Points expire'], eco.brain), 2);
  } finally {
    console.error = origErr;
  }
  assert.match(errs.join('\n'), /^sdd: acme-sdd-not-installed — REFUSED: no SDD adapter is named acme-sdd-not-installed/m);
  writeFileSync(join(eco.brain, '.multivac/config.yml'), CONFIG);

  assert.equal(await change.run(['new', 'points-expire', 'Points expire'], ctx), 0);
  const { change: c } = await loadChange(eco.brain, 'points-expire');
  assert.equal(c.status, 'open');
  assert.deepEqual(c.repos, {});
  // duplicate slug refused
  assert.equal(await change.run(['new', 'points-expire', 'Again'], ctx), 1);
});

test('new with title only derives the slug (design canonical form)', async () => {
  assert.equal(await change.run(['new', 'Tier limits apply!'], ctx), 0);
  const { change: c } = await loadChange(eco.brain, 'tier-limits-apply');
  assert.equal(c.status, 'open');
  assert.ok(existsSync(join(eco.brain, '.multivac/changes/tier-limits-apply.md')));
});

test('declare repos + landing order + claims, then plan', async () => {
  const parsed = await loadChange(eco.brain, 'points-expire');
  parsed.change.repos = {
    api: { status: 'planned' },
    web: { status: 'planned' },
    svc: { status: 'planned' },
  };
  parsed.change.landing_order = [['api'], ['web', 'svc']];
  parsed.change.invariants.touches = ['INV-1'];
  parsed.change.claims = [{ id: 'CLM-1', statement: 'expiry exists' }];
  await saveChange(eco.brain, parsed);
  assert.equal(await change.run(['plan', 'points-expire'], ctx), 0);
});

const wt = (key: string, slug = 'points-expire'): string =>
  join(eco.brain, '.multivac/worktrees', slug, key);

test('apply gives every repo a worktree and creates the greenfield one', async () => {
  const apiHead = gitOut(eco.repos.api, 'rev-parse', '--abbrev-ref', 'HEAD');
  assert.equal(await change.run(['apply', 'points-expire'], ctx), 0);
  // the shared trees never move; the branch is checked out in the worktree
  assert.equal(gitOut(eco.repos.api, 'rev-parse', '--abbrev-ref', 'HEAD'), apiHead);
  assert.equal(gitOut(wt('api'), 'rev-parse', '--abbrev-ref', 'HEAD'), 'points-expire');
  assert.equal(gitOut(wt('web'), 'rev-parse', '--abbrev-ref', 'HEAD'), 'points-expire');
  // greenfield: real repo, one commit, door with the managed block, on the branch
  assert.equal(gitOut(wt('svc'), 'rev-parse', '--abbrev-ref', 'HEAD'), 'points-expire');
  assert.equal(gitOut(svc, 'rev-list', '--count', 'HEAD'), '1');
  assert.match(readFileSync(join(svc, 'AGENTS.md'), 'utf8'), /multivac:begin/);
  const { change: c } = await loadChange(eco.brain, 'points-expire');
  assert.deepEqual(
    Object.values(c.repos).map((r) => r.status),
    ['branched', 'branched', 'branched'],
  );
  // idempotent: re-apply reports existing branches, still 0
  assert.equal(await change.run(['apply', 'points-expire'], ctx), 0);
});

test('land enforces the landing order: out-of-order --landed refused', async () => {
  assert.equal(await change.run(['land', 'points-expire'], ctx), 0);
  // web is in stage 2, api (stage 1) has not landed -> refused, nothing recorded
  assert.equal(await change.run(['land', 'points-expire', '--landed', 'web'], ctx), 1);
  let { change: c } = await loadChange(eco.brain, 'points-expire');
  assert.equal(c.repos.web.status, 'branched');
  // close before landing is refused too
  assert.equal(await change.run(['close', 'points-expire'], ctx), 1);
  // in order: api, then web and svc
  assert.equal(await change.run(['land', 'points-expire', '--landed', 'api'], ctx), 0);
  assert.equal(await change.run(['land', 'points-expire', '--landed', 'web'], ctx), 0);
  assert.equal(await change.run(['land', 'points-expire', '--landed', 'svc'], ctx), 0);
  ({ change: c } = await loadChange(eco.brain, 'points-expire'));
  assert.deepEqual(
    Object.values(c.repos).map((r) => r.status),
    ['landed', 'landed', 'landed'],
  );
});

test('close with declared claims is blocked while claims cannot be proven green', async () => {
  // all repos landed, but CLM-1 has no anchor in the brain, so verify's
  // evaluate returns no claim for it -> close refused, the file stays put
  assert.equal(await change.run(['close', 'points-expire'], ctx), 1);
  assert.ok(existsSync(join(eco.brain, '.multivac/changes/points-expire.md')));
  assert.ok(!existsSync(join(eco.brain, '.multivac/changes/archive/points-expire.md')));
});

test('plan clones a declared-missing repo with a url (explicit path)', async () => {
  assert.equal(await change.run(['new', 'clone-check', 'Clone check'], ctx), 0);
  const parsed = await loadChange(eco.brain, 'clone-check');
  parsed.change.repos = { mirror: { status: 'planned' } };
  parsed.change.landing_order = [['mirror']];
  await saveChange(eco.brain, parsed);
  assert.equal(await change.run(['plan', 'clone-check'], ctx), 0);
  assert.ok(existsSync(join(tmp, 'acme-mirror', '.git')));
});

test('close with no claims archives the change', async () => {
  assert.equal(await change.run(['land', 'clone-check', '--landed', 'mirror'], ctx), 0);
  assert.equal(await change.run(['close', 'clone-check'], ctx), 0);
  assert.ok(!existsSync(join(eco.brain, '.multivac/changes/clone-check.md')));
  const archived = readFileSync(join(eco.brain, '.multivac/changes/archive/clone-check.md'), 'utf8');
  assert.match(archived, /status: archived/);
});

test('usage errors are exit 2', async () => {
  assert.equal(await change.run([], ctx), 2);
  assert.equal(await change.run(['bogus', 'x'], ctx), 2);
  assert.equal(await change.run(['new', '!!!'], ctx), 2); // title slugifies to nothing
  assert.equal(await change.run(['plan', 'has/slash'], ctx), 2);
  assert.equal(await change.run(['plan', 'x', '--wat'], ctx), 2);
});

test('plan names a legacy statement as a restatement, and gates nothing — MV-150', async () => {
  const said = async (fn: () => Promise<number>): Promise<{ code: number; out: string }> => {
    const lines: string[] = [];
    const log = console.log;
    console.log = (...a: unknown[]) => { lines.push(a.map(String).join(' ')); };
    try {
      return { code: await fn(), out: lines.join('\n') };
    } finally {
      console.log = log;
    }
  };
  // Written directly: the file is what plan reads, however it got there.
  const parsed = scaffoldChange('restated', 'Restated');
  parsed.change.repos = { api: { status: 'planned' } };
  parsed.change.landing_order = [['api']];
  parsed.change.invariants.touches = ['INV-1'];
  parsed.change.claims = [{ id: 'CLM-7', statement: 'expiry exists' }, { id: 'CLM-8' }];
  await saveChange(eco.brain, parsed);
  const legacy = await said(() => change.run(['plan', 'restated'], ctx));
  const notices = legacy.out.split('\n').filter((l) => /restates the row — kept as written/.test(l));
  // One line per legacy claim, none for an ID-only one — and never "convert it".
  assert.deepEqual(notices, [
    'claim CLM-7: its statement: restates the row — kept as written; a claim is its ID, and the row states the rule (MV-111)',
  ]);
  assert.doesNotMatch(legacy.out, /convert/);

  parsed.change.claims = [{ id: 'CLM-7' }, { id: 'CLM-8' }];
  await saveChange(eco.brain, parsed);
  const cited = await said(() => change.run(['plan', 'restated'], ctx));
  assert.doesNotMatch(cited.out, /restates the row/);
  assert.equal(legacy.code, cited.code, 'the notice gates nothing');
  assert.equal(cited.code, 0, cited.out);
});

test('plan names what close will refuse on the declaration, and gates none of it — MV-150', async () => {
  const said = async (fn: () => Promise<number>): Promise<{ code: number; out: string }> => {
    const lines: string[] = [];
    const log = console.log;
    console.log = (...a: unknown[]) => { lines.push(a.map(String).join(' ')); };
    try {
      return { code: await fn(), out: lines.join('\n') };
    } finally {
      console.log = log;
    }
  };
  const law = join(eco.brain, '.multivac/invariants.md');
  writeFileSync(
    law,
    readFileSync(law, 'utf8') +
      [
        '| INV-40 | the ledger balances. | specified | active | 2026-01-01 | design |',
        '| INV-41 | the old export runs nightly. | specified | active | 2026-01-01 | design |',
        '| INV-42 |  | specified | proposed | 2026-01-01 | design |',
        '',
      ].join('\n'),
  );
  const parsed = scaffoldChange('declared-half', 'Declared half');
  parsed.change.repos = { api: { status: 'planned' } };
  parsed.change.landing_order = [['api']];
  parsed.change.invariants.touches = ['INV-42'];
  parsed.change.invariants.retires = ['INV-41'];
  await saveChange(eco.brain, parsed);
  const quiet = await said(() => change.run(['plan', 'declared-half'], ctx));

  // A claim of no row and a claim of a row the change never declared are
  // wrong at plan already: said there, where they are cheapest to fix. A row
  // still to retire and a row still to state are the ordinary state of a
  // change at plan — close asks those, plan does not.
  parsed.change.claims = [{ id: 'NOPE-1' }, { id: 'INV-40' }, { id: 'INV-41' }, { id: 'INV-42' }];
  await saveChange(eco.brain, parsed);
  const told = await said(() => change.run(['plan', 'declared-half'], ctx));
  assert.deepEqual(told.out.split('\n').filter((l) => l.endsWith(' — close refuses this')), [
    'claim NOPE-1: no row in .multivac/invariants.md — a claim cites a row of the law; add the row, or drop the claim — close refuses this',
    'claim INV-40: claimed, but this change neither adds, touches nor retires it — drop the claim, or list it under invariants.touches if this change amends that row — close refuses this',
  ]);
  assert.equal(told.code, quiet.code, 'the notices gate nothing');
  assert.equal(told.code, 0, told.out);
});
