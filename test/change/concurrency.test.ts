// Two agents, one checkout — the DOGFOOD-01 collision. Worktrees keep their
// edits apart; the law table hands out one ID per change.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { loadChange, saveChange } from '../../src/change/file.js';
import { nextFreeId, readLaw } from '../../src/change/reserve.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const tmp = mkdtempSync(join(tmpdir(), 'mvac-conc-'));
const eco = makeScratchEcosystem(tmp);
const ctx = { cwd: eco.brain };
const gitOut = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();
const wt = (slug: string, key: string): string =>
  join(eco.brain, '.multivac/worktrees', slug, key);

async function declare(slug: string, title: string): Promise<void> {
  assert.equal(await change.run(['new', slug, title], ctx), 0);
  const parsed = await loadChange(eco.brain, slug);
  parsed.change.repos = { api: { status: 'planned' } };
  parsed.change.landing_order = [['api']];
  await saveChange(eco.brain, parsed);
}

test('two applies in one checkout: two live worktrees, edits invisible to each other', async () => {
  await declare('alpha', 'Alpha');
  await declare('beta', 'Beta');
  const head = gitOut(eco.repos.api, 'rev-parse', '--abbrev-ref', 'HEAD');

  assert.equal(await change.run(['apply', 'alpha'], ctx), 0);
  assert.equal(await change.run(['apply', 'beta'], ctx), 0);

  // both live at once, on their own branch, and the shared tree never moved
  assert.equal(gitOut(wt('alpha', 'api'), 'rev-parse', '--abbrev-ref', 'HEAD'), 'alpha');
  assert.equal(gitOut(wt('beta', 'api'), 'rev-parse', '--abbrev-ref', 'HEAD'), 'beta');
  assert.equal(gitOut(eco.repos.api, 'rev-parse', '--abbrev-ref', 'HEAD'), head);

  // an edit in one is invisible in the other — the lost-edit scenario
  writeFileSync(join(wt('alpha', 'api'), 'src/server.ts'), 'export const port = 9000;\n');
  assert.match(readFileSync(join(wt('beta', 'api'), 'src/server.ts'), 'utf8'), /8080/);
  assert.match(readFileSync(join(eco.repos.api, 'src/server.ts'), 'utf8'), /8080/);
  assert.match(gitOut(wt('alpha', 'api'), 'status', '--porcelain'), /src\/server\.ts/);
  assert.equal(gitOut(wt('beta', 'api'), 'status', '--porcelain'), '');
});

test('close removes the worktree it created', async () => {
  assert.equal(await change.run(['land', 'beta', '--landed', 'api'], ctx), 0);
  assert.equal(await change.run(['close', 'beta'], ctx), 0);
  assert.ok(!existsSync(wt('beta', 'api')));
  assert.ok(existsSync(wt('alpha', 'api')), 'the other change keeps its worktree');
});

test('no worktree available: a tree holding another change\'s work is refused, not switched', async () => {
  // force the fallback the way an old git would: the worktree path cannot be
  // created (a file sits there), so apply drops back to switching in place.
  assert.equal(await change.run(['new', 'gamma', 'Gamma'], ctx), 0);
  const parsed = await loadChange(eco.brain, 'gamma');
  parsed.change.repos = { web: { status: 'planned' } };
  parsed.change.landing_order = [['web']];
  await saveChange(eco.brain, parsed);
  mkdirSync(join(eco.brain, '.multivac/worktrees/gamma'), { recursive: true });
  writeFileSync(wt('gamma', 'web'), 'not a worktree\n');

  const head = gitOut(eco.repos.web, 'rev-parse', '--abbrev-ref', 'HEAD');
  writeFileSync(join(eco.repos.web, 'src/index.ts'), 'export const app = "another agent";\n');
  assert.equal(await change.run(['apply', 'gamma'], ctx), 1);
  // refused: same branch, same uncommitted edit, no branch created
  assert.equal(gitOut(eco.repos.web, 'rev-parse', '--abbrev-ref', 'HEAD'), head);
  assert.match(readFileSync(join(eco.repos.web, 'src/index.ts'), 'utf8'), /another agent/);
  // clean tree: the fallback branches in place, the way apply always did
  execFileSync('git', ['-C', eco.repos.web, 'checkout', '--', 'src/index.ts']);
  assert.equal(await change.run(['apply', 'gamma'], ctx), 0);
  assert.equal(gitOut(eco.repos.web, 'rev-parse', '--abbrev-ref', 'HEAD'), 'gamma');
});

test('new allocates distinct ids under a genuine race', async () => {
  const before = (await readLaw(eco.brain))!;
  const expected = nextFreeId(before.rows);
  const [a, b] = await Promise.all([
    change.run(['new', 'race-one', 'Race one'], ctx),
    change.run(['new', 'race-two', 'Race two'], ctx),
  ]);
  assert.equal(a, 0);
  assert.equal(b, 0);
  const one = (await loadChange(eco.brain, 'race-one')).change.invariants.adds;
  const two = (await loadChange(eco.brain, 'race-two')).change.invariants.adds;
  assert.equal(one.length, 1);
  assert.equal(two.length, 1);
  assert.notEqual(one[0], two[0], 'two concurrent `new` runs must not claim the same id');
  assert.ok([one[0], two[0]].includes(expected));
  // both reservations are in the law table, proposed, naming their change
  const law = readFileSync(join(eco.brain, '.multivac/invariants.md'), 'utf8');
  for (const [id, slug] of [[one[0], 'race-one'], [two[0], 'race-two']] as const) {
    const row = law.split('\n').find((l) => l.trim().startsWith(`| ${id} |`));
    assert.ok(row, `${id} has a row`);
    assert.match(row, /\| proposed \|/);
    assert.match(row, new RegExp(`changes/${slug}\\.md`));
  }
});

test('a declared id another change reserved fails plan, loudly', async () => {
  const taken = (await loadChange(eco.brain, 'race-one')).change.invariants.adds[0];
  const parsed = await loadChange(eco.brain, 'race-two');
  parsed.change.repos = { api: { status: 'planned' } };
  parsed.change.landing_order = [['api']];
  parsed.change.invariants.adds = [taken];
  await saveChange(eco.brain, parsed);
  assert.equal(await change.run(['plan', 'race-two'], ctx), 1);
  // race-one still owns the row: the loser is told, the table is untouched
  const law = readFileSync(join(eco.brain, '.multivac/invariants.md'), 'utf8');
  const rows = law.split('\n').filter((l) => l.trim().startsWith(`| ${taken} |`));
  assert.equal(rows.length, 1);
  assert.match(rows[0], /race-one/);
});

test('close keeps a reservation whose rule has been stated', async () => {
  assert.equal(await change.run(['new', 'kept-one', 'Kept one'], ctx), 0);
  const id = (await loadChange(eco.brain, 'kept-one')).change.invariants.adds[0];
  const parsed = await loadChange(eco.brain, 'kept-one');
  parsed.change.repos = { api: { status: 'landed' } };
  parsed.change.landing_order = [['api']];
  await saveChange(eco.brain, parsed);
  const lawPath = join(eco.brain, '.multivac/invariants.md');
  writeFileSync(
    lawPath,
    readFileSync(lawPath, 'utf8').replace(
      `RESERVED by change kept-one — state the rule here before close.`,
      'The kept-one rule, stated.',
    ),
  );
  assert.equal(await change.run(['close', 'kept-one'], ctx), 0);
  const law = readFileSync(lawPath, 'utf8');
  assert.ok(law.includes(`| ${id} |`), 'a stated rule survives close, anchored or not');
});

test('close keeps a reservation anchored in the change file it archives', async () => {
  assert.equal(await change.run(['new', 'kept-two', 'Kept two'], ctx), 0);
  const id = (await loadChange(eco.brain, 'kept-two')).change.invariants.adds[0];
  const parsed = await loadChange(eco.brain, 'kept-two');
  parsed.change.repos = { api: { status: 'landed' } };
  parsed.change.landing_order = [['api']];
  parsed.change.invariants.adds = [id];
  parsed.body += `\n<!-- @anchor ${id} api:README.md /acme-api/ -->\n`;
  await saveChange(eco.brain, parsed);
  // the anchor lives in the change file, tracked — exactly what archive moves
  execFileSync('git', ['-C', eco.brain, 'add', '-A'], { stdio: 'ignore' });
  execFileSync('git', ['-C', eco.brain, 'commit', '-q', '-m', 'kept-two bookkeeping'], { stdio: 'ignore' });
  assert.equal(await change.run(['close', 'kept-two'], ctx), 0);
  const law = readFileSync(join(eco.brain, '.multivac/invariants.md'), 'utf8');
  assert.ok(law.includes(`| ${id} |`), 'anchors are read before archive moves the file');
});

test('close releases a reservation the change never used', async () => {
  const id = (await loadChange(eco.brain, 'race-one')).change.invariants.adds[0];
  const parsed = await loadChange(eco.brain, 'race-one');
  parsed.change.repos = { api: { status: 'landed' } };
  parsed.change.landing_order = [['api']];
  await saveChange(eco.brain, parsed);
  assert.equal(await change.run(['close', 'race-one'], ctx), 0);
  const law = readFileSync(join(eco.brain, '.multivac/invariants.md'), 'utf8');
  assert.ok(!law.includes(`| ${id} |`), 'an unused, unanchored reservation goes back to the pool');
});
