import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { loadChange, saveChange } from '../../src/change/file.js';

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
// sdd declared with a missing binary (must degrade to a notice, exit 0).
writeFileSync(
  join(eco.brain, '.multivac/config.yml'),
  [
    'doors: [agents]',
    'sdd: acme-sdd-not-installed',
    'grapher: acme-graph',
    'repos:',
    '  api: ../acme-api',
    '  web: ../acme-web',
    '  svc: ../acme-svc',
    '  mirror:',
    '    path: ../acme-mirror',
    `    url: ${eco.repos.api}`,
    '',
  ].join('\n'),
);

const gitOut = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();

test('new scaffolds the change file (SDD binary absent = notice, still 0)', async () => {
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
