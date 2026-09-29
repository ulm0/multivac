import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ChangeError,
  type ChangeFile,
  closeGate,
  landingPlan,
  parseChange,
  scaffoldChange,
  serializeChange,
} from '../../src/change/file.js';
import { repointLawLinks } from '../../src/change/file.js';
import { citeLine, citeSpec } from '../../src/change/cite.js';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { VerifyReport } from '../../src/types.js';

const sample: ChangeFile = {
  slug: 'points-expire',
  status: 'open',
  repos: {
    api: { status: 'branched' },
    web: { status: 'planned' },
    svc: { status: 'planned' },
  },
  landing_order: [['api'], ['web', 'svc']],
  invariants: { touches: ['INV-1'], adds: ['INV-9'], retires: [] },
  claims: [{ id: 'CLM-1', statement: 'points have an expiry column' }],
};

test('change file round-trips through serialize/parse', () => {
  const body = '# Points expire\n\nFree-form *markdown* body.\n\n- with a list\n';
  const text = serializeChange(sample, body);
  const back = parseChange(text, 'test');
  assert.deepEqual(back.change, sample);
  assert.equal(back.body, body);
});

test('scaffold is valid and round-trips', () => {
  const p = scaffoldChange('foo', 'Foo title');
  const back = parseChange(serializeChange(p.change, p.body), 'test');
  assert.deepEqual(back.change, p.change);
  assert.equal(back.change.status, 'open');
});

test('validation rejects bad status, unknown and duplicate landing keys', () => {
  const bad = serializeChange(sample, '').replace('status: branched', 'status: merged');
  assert.throws(() => parseChange(bad, 't'), (e: unknown) =>
    e instanceof ChangeError && e.message.includes('repos.api.status'));

  const unknownKey = { ...sample, landing_order: [['api'], ['web', 'svc', 'ghost']] };
  assert.throws(() => parseChange(serializeChange(unknownKey, ''), 't'), (e: unknown) =>
    e instanceof ChangeError && e.message.includes('"ghost"'));

  const dup = { ...sample, landing_order: [['api'], ['web', 'svc', 'api']] };
  assert.throws(() => parseChange(serializeChange(dup, ''), 't'), (e: unknown) =>
    e instanceof ChangeError && e.message.includes('twice'));

  const missing = { ...sample, landing_order: [['api'], ['web']] };
  assert.throws(() => parseChange(serializeChange(missing, ''), 't'), (e: unknown) =>
    e instanceof ChangeError && e.message.includes('missing from landing_order'));
});

test('any claim prose round-trips: colons, hashes, quotes, newlines, dashes', () => {
  const prose = [
    'staleness: block',
    'a # not a comment',
    'quotes "double" and \'single\'',
    'first line\nsecond line',
    '- leading dash',
    '  padded   inside  ',
    'a statement long enough to be folded by the default eighty-column line width, holding a run of words that must come back byte for byte',
  ];
  const c: ChangeFile = {
    ...sample,
    claims: prose.map((statement, i) => ({ id: `CLM-${i}`, statement })),
  };
  const text = serializeChange(c, '# body\n');
  const back = parseChange(text, 't');
  assert.deepEqual(back.change.claims.map((x) => x.statement), prose);
  // and again: what was written is what parses next time
  assert.equal(serializeChange(back.change, back.body), text);
  // no folding: every statement stays on the line it started on
  assert.ok(text.includes('statement: "staleness: block"'));
});

test('a colon in unquoted prose is an error naming the line and the quoted fix', () => {
  const broken = `---
slug: points-expire
status: open
claims:
  - id: CLM-1
    statement: staleness: block
---

# body
`;
  assert.throws(
    () => parseChange(broken, 'changes/points-expire.md'),
    (e: unknown) => {
      assert.ok(e instanceof ChangeError, 'ChangeError');
      // line 6 of the file, its source, and the exact rewrite to type
      assert.match(e.message, /at line 6/);
      assert.match(e.message, /6 \| {5}statement: staleness: block/);
      // only our line number, not the parser's frontmatter-relative one
      assert.doesNotMatch(e.message, /line 5/);
      assert.ok(e.message.includes('statement: "staleness: block"'), e.message);
      return true;
    },
  );
});

test('a frontmatter error with no quotable line still teaches quoting', () => {
  const broken = '---\nslug: "unterminated\nstatus: open\n---\n\n# body\n';
  assert.throws(() => parseChange(broken, 't'), (e: unknown) =>
    e instanceof ChangeError && /block scalar/.test(e.message));
});

test('missing frontmatter is a ChangeError that says what to do', () => {
  assert.throws(() => parseChange('# no frontmatter\n', 't'), (e: unknown) =>
    e instanceof ChangeError && e.message.includes('---'));
});

test('landingPlan: first unlanded stage is ready, later stages blocked', () => {
  assert.deepEqual(landingPlan(sample), [
    { repos: ['api'], state: 'ready' },
    { repos: ['web', 'svc'], state: 'blocked' },
  ]);

  const apiLanded: ChangeFile = {
    ...sample,
    repos: { ...sample.repos, api: { status: 'landed' } },
  };
  assert.deepEqual(landingPlan(apiLanded).map((s) => s.state), ['landed', 'ready']);

  // empty landing_order = one stage with every repo
  const flat = { ...sample, landing_order: [] };
  assert.deepEqual(landingPlan(flat), [{ repos: ['api', 'web', 'svc'], state: 'ready' }]);
});

function report(states: Record<string, 'ok' | 'moved' | 'broken'>): VerifyReport {
  return {
    claims: Object.entries(states).map(([claimId, state]) => ({
      claimId,
      state,
      legs: state === 'broken'
        ? [{ anchor: {} as never, state, detail: 'add the marker back to src/x.ts' }]
        : [],
    })),
    counts: { ok: 0, pending: 0, moved: 0, broken: 0, vacuous: 0, unevaluated: 0 },
    blockingBroken: 0,
    exitCode: 0,
  };
}

test('closeGate: green and moved pass, broken and unanchored refuse', () => {
  const green = closeGate(report({ 'CLM-1': 'ok', 'CLM-2': 'moved' }), ['CLM-1', 'CLM-2']);
  assert.equal(green.ok, true);

  const red = closeGate(report({ 'CLM-1': 'ok', 'CLM-2': 'broken' }), ['CLM-1', 'CLM-2']);
  assert.equal(red.ok, false);
  assert.ok(red.lines.some((l) => l.includes('CLM-2') && l.includes('add the marker back')));

  const unanchored = closeGate(report({ 'CLM-1': 'ok' }), ['CLM-1', 'CLM-9']);
  assert.equal(unanchored.ok, false);
  assert.ok(unanchored.lines.some((l) => l.includes('CLM-9') && l.includes('add an anchor')));
});

// --- archiving repoints the law at the file it just moved ---

test('archiving rewrites every law row that cited the open change', async () => {
  const brain = mkdtempSync(join(tmpdir(), 'mvac-repoint-'));
  mkdirSync(join(brain, '.multivac', 'changes'), { recursive: true });
  // Two rows citing the change, one citing a different one, and the slug in
  // prose — only the link targets of THIS change may move.
  writeFileSync(
    join(brain, '.multivac', 'invariants.md'),
    [
      '| MV-1 | rule one | specified | active | 2026-08-16 | [changes/points.md](changes/points.md) |',
      '| MV-2 | rule two | specified | active | 2026-08-16 | [changes/points.md](changes/points.md) |',
      '| MV-3 | other    | specified | active | 2026-08-16 | [changes/other.md](changes/other.md) |',
      '| MV-4 | prose naming changes/points.md without citing it | open | proposed | 2026-08-16 | — |',
    ].join('\n'),
  );
  writeFileSync(join(brain, '.multivac', 'changes', 'points.md'), '---\nslug: points\n---\n');

  const moved = await repointLawLinks(brain, 'points');
  assert.equal(moved, 2);
  const law = readFileSync(join(brain, '.multivac', 'invariants.md'), 'utf8');
  assert.equal(law.split('(changes/archive/points.md)').length - 1, 2);
  assert.match(law, /\(changes\/other\.md\)/); // untouched
  // Prose is prose: only `(...)` link targets move.
  assert.match(law, /prose naming changes\/points\.md without citing it/);

  // Idempotent: a second archive of the same slug finds nothing left to move.
  assert.equal(await repointLawLinks(brain, 'points'), 0);
  rmSync(brain, { recursive: true, force: true });
});

test('repointing a brain with no law file is a no-op, never a crash', async () => {
  const brain = mkdtempSync(join(tmpdir(), 'mvac-repoint-none-'));
  assert.equal(await repointLawLinks(brain, 'whatever'), 0);
  rmSync(brain, { recursive: true, force: true });
});

// --- MV-146: the body cites its spec, and nothing else in it is written ---

test('citeSpec appends one line after the untrimmed body, and the body is a byte prefix of what is archived', () => {
  for (const body of ['# Points expire\n\nWhy, in a sentence.\n', '# No newline at the end', '# Trailing blank lines\n\n\n', '']) {
    const cited = citeSpec(body, 'specs/001-points-expire', 'speckit');
    assert.ok(cited.startsWith(body), JSON.stringify(body));
    assert.equal(cited.slice(body.length), '\nSpecified in `specs/001-points-expire/` (speckit).\n');
    // It survives the file: serialized, parsed, the same bytes.
    assert.equal(parseChange(serializeChange(sample, cited), 'test').body, cited);
    // And a second close writes it once.
    assert.equal(citeSpec(cited, 'specs/001-points-expire', 'speckit'), cited);
  }
});

test('citeSpec leaves a body that already names the directory untouched', () => {
  for (const body of [
    '# Points expire\n\nSpec, plan and tasks: specs/001-points-expire/.\n',
    '# Points expire\n\nSee `specs/001-points-expire/spec.md`.\n',
  ]) {
    assert.equal(citeSpec(body, 'specs/001-points-expire', 'speckit'), body);
  }
  // A name that only starts the same is not the directory.
  const other = '# Points\n\nSee specs/001-points-expire-later/.\n';
  assert.notEqual(citeSpec(other, 'specs/001-points-expire', 'speckit'), other);
  // opsx cites where its archive put the change.
  assert.match(
    citeSpec('# Bill weekly\n', 'openspec/changes/archive/2026-09-28-bill-weekly', 'opsx'),
    /\nSpecified in `openspec\/changes\/archive\/2026-09-28-bill-weekly\/` \(opsx\)\.\n$/,
  );
});

test('the scaffold says close appends only the line citing the directory', () => {
  const { body } = scaffoldChange('foo', 'Foo title');
  assert.match(body, /below the closing ---, is yours: with an SDD declared, `change close` only\nappends the line citing its directory\.\n$/);
  // What `change new` prints about the body carries no instruction to continue:
  // that belongs to the steps, once (MV-95).
  assert.match(citeLine('speckit'), /^sdd speckit: the why, the design and the tasks go into its files — .*`change close` cites the directory; do not cite it yourself$/);
  assert.doesNotMatch(citeLine('speckit'), /continue|without asking/);
});

test("a claim is its row's ID — MV-150", () => {
  const fm = (claims: string): string =>
    `---\nslug: t\nstatus: open\nrepos: {}\nlanding_order: []\ninvariants:\n  touches: []\n  adds: []\n  retires: []\n${claims}---\n\n# b\n`;
  // The bare ID is the form every command writes.
  const bare = parseChange(fm('claims:\n  - MV-1\n'), 't');
  assert.deepEqual(bare.change.claims, [{ id: 'MV-1' }]);
  assert.equal(serializeChange(bare.change, bare.body), fm('claims:\n  - MV-1\n'));
  assert.doesNotMatch(serializeChange(bare.change, bare.body), /statement/);
  // A map holding only its ID is read, and written back bare.
  const map = parseChange(fm('claims:\n  - id: MV-2\n'), 't');
  assert.deepEqual(map.change.claims, [{ id: 'MV-2' }]);
  assert.equal(serializeChange(map.change, map.body), fm('claims:\n  - MV-2\n'));
  // A legacy statement beside a bare ID comes back byte for byte, never created.
  const mixed = fm('claims:\n  - MV-1\n  - id: MV-13\n    statement: "legacy: prose # kept"\n');
  const m = parseChange(mixed, 't');
  assert.deepEqual(m.change.claims, [{ id: 'MV-1' }, { id: 'MV-13', statement: 'legacy: prose # kept' }]);
  assert.equal(serializeChange(m.change, m.body), mixed);
  // Anything else is no claim: refused by every reader, whatever it does with a stray key.
  for (const bad of [
    'claims:\n  - statement: x\n',
    'claims:\n  - 1\n',
    'claims: MV-1\n',
    'claims:\n  - id: MV-1\n    statement: 3\n',
    'claims:\n  - id: ""\n',
    'claims:\n  - ""\n',
  ]) {
    for (const opts of [{}, { claimKeys: 'refuse' as const }]) {
      assert.throws(
        () => parseChange(fm(bad), 't', opts),
        (e: unknown) => e instanceof ChangeError && /claims: \[<ID>\]/.test(e.message),
        `${JSON.stringify(bad)} ${JSON.stringify(opts)}`,
      );
    }
  }
  // A stray key inside a claim: a writer refuses it by name, a reader names it
  // and reads the claim without it.
  const stray = fm('claims:\n  - id: MV-1\n    statment: Points carry an expiry.\n');
  const named = 'claim MV-1: unknown key "statment" — a claim is its row\'s ID; state the rule in the row';
  assert.throws(
    () => parseChange(stray, 't', { claimKeys: 'refuse' }),
    (e: unknown) => e instanceof ChangeError && e.message === `t: ${named} — fix the frontmatter`,
  );
  const said: string[] = [];
  const err = console.error;
  console.error = (...a: unknown[]) => { said.push(a.map(String).join(' ')); };
  let read: ReturnType<typeof parseChange>;
  try {
    read = parseChange(stray, 't');
  } finally {
    console.error = err;
  }
  assert.deepEqual(read.change.claims, [{ id: 'MV-1' }]);
  assert.deepEqual(said, [
    `t: ${named} (read without it here; every command that rewrites the file refuses it until it goes)`,
  ]);
});
