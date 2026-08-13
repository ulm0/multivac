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
