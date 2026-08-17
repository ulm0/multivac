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

test('close removes the worktree, and its printed commands touch only the closing slug', async () => {
  assert.equal(await change.run(['land', 'beta', '--landed', 'api'], ctx), 0);
  const lines: string[] = [];
  const orig = console.log;
  console.log = (l: string) => lines.push(String(l));
  let code: number;
  try {
    code = await change.run(['close', 'beta'], ctx);
  } finally {
    console.log = orig;
  }
  assert.equal(code, 0);
  assert.ok(!existsSync(wt('beta', 'api')));
  assert.ok(existsSync(wt('alpha', 'api')), 'the other change keeps its worktree');
  // scoped: beta's paths named one by one — alpha, open in the same checkout,
  // is never swept into beta's commit by an `add -A`
  const out = lines.join('\n');
  assert.match(
    out,
    /add -- \.multivac\/changes\/archive\/beta\.md \.multivac\/changes\/beta\.md \.multivac\/invariants\.md/,
  );
  assert.doesNotMatch(out, /add -A/);
  assert.doesNotMatch(out, /alpha/);
  // no origin remote in the fixture: the direct commit is the landing, and
  // close says so instead of pretending there is an MR to open
  assert.match(out, /no origin remote — the direct commit is the landing/);
  // follow the printed command, the way the author would
  execFileSync('git', ['-C', eco.brain, 'add', '--',
    '.multivac/changes/archive/beta.md', '.multivac/changes/beta.md', '.multivac/invariants.md']);
  execFileSync('git', ['-C', eco.brain, 'commit', '-q', '-m', 'Archive the beta change']);
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

test('new allocates distinct ids under a genuine race, both rows committed', async () => {
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
  // both rows committed: the ledger keeps itself — the shared tree is clean
  // at the bookkeeping paths, and HEAD's table carries both reservations
  assert.equal(
    gitOut(eco.brain, 'status', '--porcelain', '--',
      '.multivac/invariants.md', '.multivac/changes/race-one.md', '.multivac/changes/race-two.md'),
    '',
    'new leaves no bookkeeping floating in the shared checkout',
  );
  const law = gitOut(eco.brain, 'show', 'HEAD:.multivac/invariants.md');
  const subjects = gitOut(eco.brain, 'log', '--format=%s', '-4');
  for (const [id, slug] of [[one[0], 'race-one'], [two[0], 'race-two']] as const) {
    const row = law.split('\n').find((l) => l.trim().startsWith(`| ${id} |`));
    assert.ok(row, `${id} has a committed row`);
    assert.match(row, /\| proposed \|/);
    assert.match(row, new RegExp(`changes/${slug}\\.md`));
    assert.match(subjects, new RegExp(`change open: ${slug} — reserves ${id}`));
    assert.notEqual(gitOut(eco.brain, 'show', `HEAD:.multivac/changes/${slug}.md`), '');
  }
});

test('new refuses a tree that is dirty at the bookkeeping paths, naming the command', async () => {
  writeFileSync(join(eco.brain, '.multivac/invariants.md'),
    readFileSync(join(eco.brain, '.multivac/invariants.md'), 'utf8') + '\n<!-- floating edit -->\n');
  const lines: string[] = [];
  const orig = console.error;
  console.error = (l: string) => lines.push(String(l));
  let code: number;
  try {
    code = await change.run(['new', 'blocked-open', 'Blocked'], ctx);
  } finally {
    console.error = orig;
  }
  assert.equal(code, 1);
  const msg = lines.join('\n');
  assert.match(msg, /bookkeeping paths carry uncommitted edits: \.multivac\/invariants\.md/);
  assert.match(msg, /git -C .* add -- \.multivac\/invariants\.md && git commit/);
  assert.ok(!existsSync(join(eco.brain, '.multivac/changes/blocked-open.md')), 'nothing scaffolded');
  execFileSync('git', ['-C', eco.brain, 'checkout', '--', '.multivac/invariants.md']);
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
  // run the commit close printed: the next new refuses a tree dirty at the
  // bookkeeping paths — close→new serializes through this commit by design.
  execFileSync('git', ['-C', eco.brain, 'add', '-A'], { stdio: 'ignore' });
  execFileSync('git', ['-C', eco.brain, 'commit', '-q', '-m', 'Archive the kept-one change'], { stdio: 'ignore' });
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

// MV-45. `--abandon` used to release against an EMPTY anchor set, and to
// archive before reading it — so the row's condition ("no anchor names its
// ID") was never evaluated on that path. It refuses a change with claims,
// which makes an anchor on the reserved id unlikely, not impossible: one
// written by hand would send that id back to the pool with a live reference
// pointing at it, and the next `change new` would hand it to somebody else.
test('--abandon will not release a reservation an anchor names (MV-45)', async () => {
  // Its own ecosystem: the tests above share one brain and leave it mid-flight,
  // and this assertion is about a reservation's fate, not about surviving them.
  const solo = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-abandon-')));
  const soloCtx = { cwd: solo.brain };
  assert.equal(await change.run(['new', 'gamma', 'Gamma'], soloCtx), 0);

  const law = join(solo.brain, '.multivac/invariants.md');
  // The scratch ecosystem numbers its rows INV-nn, not MV-nn: read the prefix
  // from the table rather than assuming this repo's.
  const id = readFileSync(law, 'utf8').match(/\| ([A-Z]+-\d+) \| RESERVED by change gamma/)![1];

  // Somebody anchored the reserved id by hand. No claim was declared, so
  // --abandon is still willing to run — and used to release the id against an
  // EMPTY anchor set, sending it back to the pool with a live reference to it.
  writeFileSync(law, `${readFileSync(law, 'utf8')}\n<!-- @anchor ${id} brain:AGENTS.md /multivac/ -->\n`);

  assert.equal(await change.run(['close', 'gamma', '--abandon'], soloCtx), 0);
  assert.ok(
    readFileSync(law, 'utf8').includes(`| ${id} |`),
    `${id} was released while an anchor still names it — the next change new would reuse it`,
  );
});
