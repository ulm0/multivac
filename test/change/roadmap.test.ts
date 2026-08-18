import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { roadmap } from '../../src/commands/roadmap.js';
import { verify } from '../../src/commands/verify.js';
import {
  loadChange,
  parseChange,
  scaffoldPlanned,
  serializeChange,
} from '../../src/change/file.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

/** Capture stdout AND stderr lines around a call. */
const capture = async (fn: () => Promise<number>): Promise<{ code: number; out: string }> => {
  const lines: string[] = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (l: string) => lines.push(String(l));
  console.error = (l: string) => lines.push(String(l));
  try {
    return { code: await fn(), out: lines.join('\n') };
  } finally {
    console.log = origLog;
    console.error = origErr;
  }
};

const tmp = mkdtempSync(join(tmpdir(), 'mvac-roadmap-'));
const eco = makeScratchEcosystem(tmp);
const ctx = { cwd: eco.brain };
const law = join(eco.brain, '.multivac/invariants.md');
const changeFile = (slug: string): string => join(eco.brain, '.multivac/changes', `${slug}.md`);
/** This repository, not the scratch one: the absent-refusal sweep reads real source. */
const repoRoot = join(import.meta.dirname, '../../..');
const gitOut = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();

// --- the state itself ---

test('the change file parses, validates and round-trips planned + horizon', () => {
  const p = scaffoldPlanned('a-thing', 'A thing', 'next');
  const round = parseChange(serializeChange(p.change, p.body), 'a-thing.md');
  assert.equal(round.change.status, 'planned');
  assert.equal(round.change.horizon, 'next');
  assert.equal(round.body, p.body);
});

test('a change with no horizon serializes without a horizon line', () => {
  const p = scaffoldPlanned('b-thing', 'B thing', 'later');
  delete p.change.horizon;
  const text = serializeChange(p.change, p.body);
  assert.equal(/^horizon:/m.test(text), false);
  assert.equal(parseChange(text, 'b-thing.md').change.horizon, undefined);
});

test('an unknown status names all three, and an unknown horizon names all three', () => {
  const bad = (fm: string): string => `---\n${fm}\n---\n\n# x\n`;
  assert.throws(
    () => parseChange(bad('slug: x\nstatus: someday\nrepos: {}'), 'x.md'),
    /"status" must be "planned", "open" or "archived"/,
  );
  assert.throws(
    () => parseChange(bad('slug: x\nstatus: planned\nhorizon: someday\nrepos: {}'), 'x.md'),
    /"horizon" must be one of now\|next\|later/,
  );
});

// --- US1: record and list ---

test('roadmap add records one file, reserves no id, opens no branch', async () => {
  const lawBefore = readFileSync(law, 'utf8');
  const branchesBefore = gitOut(eco.brain, 'branch', '--list');
  const c = await capture(() => roadmap.run(['add', 'later-thing', 'A later thing'], ctx));
  assert.equal(c.code, 0);
  assert.match(c.out, /recorded \.multivac\/changes\/later-thing\.md — planned, horizon later/);
  assert.match(c.out, /no invariant id is reserved until it starts/);
  const { change: rec } = await loadChange(eco.brain, 'later-thing');
  assert.equal(rec.status, 'planned');
  assert.equal(rec.horizon, 'later');
  assert.deepEqual(rec.invariants.adds, []);
  assert.equal(readFileSync(law, 'utf8'), lawBefore);
  assert.equal(gitOut(eco.brain, 'branch', '--list'), branchesBefore);
  // Committed by the tool, the way every other brain artifact is.
  assert.equal(gitOut(eco.brain, 'status', '--porcelain', '--', '.multivac/changes'), '');
});

test('roadmap lists by horizon, omits empty ones, and counts what is in flight', async () => {
  assert.equal(await roadmap.run(['add', 'now-thing', 'A now thing', '--horizon', 'now'], ctx), 0);
  assert.equal(await roadmap.run(['add', 'a-now-thing', 'Another now thing', '--horizon', 'now'], ctx), 0);
  const c = await capture(() => roadmap.run([], ctx));
  assert.equal(c.code, 0);
  const lines = c.out.split('\n').filter((l) => l !== '');
  assert.equal(lines[0], 'roadmap: 3 planned');
  assert.equal(lines[1], '  now');
  // Alphabetical within a horizon, by codepoint — not the filesystem's order.
  assert.equal(lines[2], '    a-now-thing — Another now thing');
  assert.equal(lines[3], '    now-thing — A now thing');
  assert.equal(lines[4], '  later');
  assert.equal(lines[5], '    later-thing — A later thing');
  // `next` holds nothing and is not printed at all.
  assert.equal(c.out.includes('  next'), false);
  assert.match(c.out, /^in flight: no open change$/m);
});

test('the in-flight line counts open changes, separately from the planned ones', async () => {
  assert.equal(await change.run(['new', 'in-flight-one', 'In flight one'], ctx), 0);
  const c = await capture(() => roadmap.run([], ctx));
  assert.match(c.out, /^roadmap: 3 planned$/m);
  assert.match(c.out, /^in flight: 1 open change — in-flight-one$/m);
});

test('an empty roadmap says so, and names the command that fills it', async () => {
  const bare = mkdtempSync(join(tmpdir(), 'mvac-roadmap-bare-'));
  const solo = makeScratchEcosystem(bare);
  const c = await capture(() => roadmap.run([], { cwd: solo.brain }));
  assert.equal(c.code, 0);
  assert.match(c.out, /roadmap: empty — record an intention with `multivac roadmap add/);
  assert.match(c.out, /in flight: no open change/);
});

test('roadmap add refuses a slug already planned, open, or archived', async () => {
  const planned = await capture(() => roadmap.run(['add', 'later-thing', 'Again'], ctx));
  assert.equal(planned.code, 1);
  assert.match(planned.out, /later-thing is already planned/);
  const open = await capture(() => roadmap.run(['add', 'in-flight-one', 'Again'], ctx));
  assert.equal(open.code, 1);
  assert.match(open.out, /in-flight-one is already open — it started; nothing to record/);
});

test('roadmap refuses an unknown horizon, an unknown flag and a stray argument', async () => {
  const h = await capture(() => roadmap.run(['add', 'x', 'X', '--horizon', 'someday'], ctx));
  assert.equal(h.code, 2);
  assert.match(h.out, /unknown horizon "someday" — use now, next, later/);
  const f = await capture(() => roadmap.run(['--planned'], ctx));
  assert.equal(f.code, 2);
  assert.match(f.out, /unknown flag "--planned"/);
  const p = await capture(() => roadmap.run(['list'], ctx));
  assert.equal(p.code, 2);
  assert.match(p.out, /unexpected argument "list"/);
  assert.equal(existsSync(changeFile('x')), false);
});

test('an unparseable change file is skipped by the listing, never fatal', async () => {
  writeFileSync(changeFile('broken'), 'no frontmatter here\n');
  const c = await capture(() => roadmap.run([], ctx));
  assert.equal(c.code, 0);
  assert.match(c.out, /^roadmap: 3 planned$/m);
});

// --- US2: promotion ---

test('change new promotes a planned slug: one file, body byte-identical, id reserved here', async () => {
  const before = readFileSync(changeFile('later-thing'), 'utf8');
  const bodyBefore = parseChange(before, 'later-thing.md').body;
  assert.deepEqual((await loadChange(eco.brain, 'later-thing')).change.invariants.adds, []);

  const c = await capture(() => change.run(['new', 'later-thing'], ctx));
  assert.equal(c.code, 0);
  assert.match(c.out, /promoted \.multivac\/changes\/later-thing\.md — planned since it was recorded, now open/);
  assert.match(c.out, /title ignored on promotion/);

  const after = await loadChange(eco.brain, 'later-thing');
  assert.equal(after.change.status, 'open');
  assert.equal(after.body, bodyBefore);
  assert.equal(after.change.invariants.adds.length, 1);
  assert.equal(
    readdirSync(join(eco.brain, '.multivac/changes')).filter((n) => n === 'later-thing.md').length,
    1,
  );
});

test('a hand-edited body survives promotion', async () => {
  assert.equal(await roadmap.run(['add', 'edited-thing', 'Edited thing'], ctx), 0);
  const path = changeFile('edited-thing');
  const parsed = parseChange(readFileSync(path, 'utf8'), 'edited-thing.md');
  const mine = `${parsed.body}\nA paragraph written when the idea was young.\n`;
  writeFileSync(path, serializeChange(parsed.change, mine));
  execFileSync('git', ['-C', eco.brain, 'commit', '-q', '-am', 'edit the intention']);

  assert.equal(await change.run(['new', 'edited-thing'], ctx), 0);
  assert.equal((await loadChange(eco.brain, 'edited-thing')).body, mine);
});

test('change new on a slug with no planned file behaves as it always did', async () => {
  const c = await capture(() => change.run(['new', 'never-planned', 'Never planned'], ctx));
  assert.equal(c.code, 0);
  assert.match(c.out, /created \.multivac\/changes\/never-planned\.md/);
  assert.equal(c.out.includes('promoted'), false);
  assert.equal((await loadChange(eco.brain, 'never-planned')).change.status, 'open');
});

test('change new still refuses a slug that is already open', async () => {
  const c = await capture(() => change.run(['new', 'never-planned', 'Again'], ctx));
  assert.equal(c.code, 1);
  assert.match(c.out, /already exists — edit it, or pick another slug/);
});

test('plan, apply, land and close each refuse a change that has not started', async () => {
  assert.equal(await roadmap.run(['add', 'not-started', 'Not started'], ctx), 0);
  for (const sub of ['plan', 'apply', 'land', 'close']) {
    const c = await capture(() => change.run([sub, 'not-started'], ctx));
    assert.equal(c.code, 1, `${sub} should refuse`);
    assert.match(
      c.out,
      /not-started is planned, not started — start it first: multivac change new not-started/,
      `${sub} should name the step that comes first`,
    );
  }
  // Still planned afterwards: a refusal that half-ran would be worse than none.
  assert.equal((await loadChange(eco.brain, 'not-started')).change.status, 'planned');
});

// --- US3: a roadmap never delays a release ---

test('a planned change is invisible to the unclosed-change gate, whatever it declares', async () => {
  // The sharp case: a planned change that LOOKS finished — a declared claim,
  // every declared repo recorded landed. `open` is the only status the scan
  // reads, so this contributes neither a pending claim nor a landed repo.
  const path = changeFile('looks-finished');
  assert.equal(await roadmap.run(['add', 'looks-finished', 'Looks finished'], ctx), 0);
  const parsed = parseChange(readFileSync(path, 'utf8'), 'looks-finished.md');
  parsed.change.repos = { api: { status: 'landed' } };
  parsed.change.landing_order = [['api']];
  parsed.change.claims = [{ id: 'INV-01', statement: 'A claim declared before the work started' }];
  writeFileSync(path, serializeChange(parsed.change, parsed.body));

  const c = await capture(() => verify.run(['--strict'], ctx));
  assert.equal(c.out.includes('looks-finished'), false);
  assert.equal(/finished change/.test(c.out), false);
});

test('planned changes do not move the blocking count, however many there are', async () => {
  const before = await capture(() => verify.run(['--strict'], ctx));
  const count = (out: string): string => /^(\d+) blocking broken/m.exec(out)?.[1] ?? 'none';
  const was = count(before.out);
  for (const n of ['bulk-a', 'bulk-b', 'bulk-c', 'bulk-d', 'bulk-e']) {
    assert.equal(await roadmap.run(['add', n, `Bulk ${n}`], ctx), 0);
  }
  const after = await capture(() => verify.run(['--strict'], ctx));
  assert.equal(count(after.out), was);
});

test('nothing anywhere refuses an operation for absence from the roadmap', async () => {
  // The property MV-89's `absent` leg holds in the law; asserted here too so a
  // failing build says which sentence appeared, not only which anchor broke.
  const files = execFileSync('git', ['-C', repoRoot, 'ls-files', 'src'], { encoding: 'utf8' })
    .split('\n')
    .filter((f) => f.endsWith('.ts'));
  for (const f of files) {
    const text = readFileSync(join(repoRoot, f), 'utf8');
    assert.equal(
      /not (?:on|in) the roadmap/i.test(text),
      false,
      `${f} refuses on roadmap membership — the roadmap is never a gate (MV-89)`,
    );
  }
});

// --- convergence ---

test('roadmap add refuses a slug that is already archived, and says where it is', async () => {
  const archived = join(eco.brain, '.multivac/changes/archive');
  mkdirSync(archived, { recursive: true });
  const p = scaffoldPlanned('was-closed', 'Was closed', 'later');
  p.change.status = 'archived';
  writeFileSync(join(archived, 'was-closed.md'), serializeChange(p.change, p.body));

  const c = await capture(() => roadmap.run(['add', 'was-closed', 'Again'], ctx));
  assert.equal(c.code, 1);
  assert.match(c.out, /was-closed is already archived at \.multivac\/changes\/archive\/was-closed\.md/);
  assert.match(c.out, /start a new one with a new slug/);
  assert.equal(existsSync(changeFile('was-closed')), false);
});

test('the roadmap command reaches no network', () => {
  // MV-01 binds verify/doctor/doors; roadmap is not in that set, so the
  // guarantee is asserted here rather than inherited. Freshness is bought only
  // in a command that says it fetches, and this one does not.
  const src = readFileSync(join(repoRoot, 'src/commands/roadmap.ts'), 'utf8');
  for (const forbidden of [/\bfetch\s*\(/, /node:https?/, /\bhttps?:\/\//, /XMLHttpRequest/]) {
    assert.equal(forbidden.test(src), false, `roadmap.ts matches ${forbidden}`);
  }
});
