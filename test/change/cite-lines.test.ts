// MV-150. A claim is its row's ID, so the row is the only place its rule is
// written, and close checks what each claim cites before anything is
// archived. One pure predicate says it — read by close, land, plan and
// verify's finished line alike — so each kind is pinned here without a brain.

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseClaimRows } from '../../src/anchor/parse.js';
import type { ChangeClaim, ChangeFile } from '../../src/change/file.js';
import { DECLARATION_KINDS, abandonLines, citeLines, type AnchorSite } from '../../src/change/reserve.js';

const SLUG = 'wsk';
const OWN = `[changes/${SLUG}.md](changes/${SLUG}.md)`;
const RESERVED = (slug: string): string => `RESERVED by change ${slug} — state the rule here before close.`;

const LAW = parseClaimRows(
  [
    '| ID | statement | authority | state | date | source |',
    '| --- | --- | --- | --- | --- | --- |',
    '| INV-01 | points expire after a year. | specified | active | 2026-01-01 | design |',
    '| INV-02 | the old rule. Retired: the new one replaced it. | specified | retired | 2026-01-01 | design |',
    '| INV-03 | too short |',
    `| INV-04 | ${RESERVED(SLUG)} | open | proposed | 2026-09-29 | ${OWN} |`,
    `| INV-05 | ${RESERVED('other')} | open | proposed | 2026-09-29 | [changes/other.md](changes/other.md) |`,
    '| INV-06 | refunds are idempotent. | specified | proposed | 2026-09-29 | design |',
    '| INV-07 |  | open | proposed | 2026-09-29 | design |',
    '',
  ].join('\n'),
);
/** The same law, INV-06's source naming this change: owned without being listed under adds. */
const OWNED = LAW.map((r) => (r.id === 'INV-06' ? { ...r, source: OWN } : r));

function change(
  claims: ChangeClaim[],
  inv: Partial<ChangeFile['invariants']> = {},
): ChangeFile {
  return {
    slug: SLUG,
    status: 'open',
    repos: { brain: { status: 'landed' } },
    landing_order: [['brain']],
    invariants: { touches: [], adds: [], retires: [], ...inv },
    claims,
  };
}

/** A site outside the change file, for each ID: anchored where close does not archive. */
const elsewhere = (...ids: string[]): AnchorSite[] => ids.map((claimId) => ({ claimId, file: '.multivac/invariants.md' }));
const inChangeFile = (...ids: string[]): AnchorSite[] =>
  ids.map((claimId) => ({ claimId, file: `.multivac/changes/${SLUG}.md` }));

test('one line per claim, the first reason in order — MV-150', () => {
  // Each claim anchored somewhere close does not archive, unless a case says otherwise.
  const one = (
    claims: ChangeClaim[],
    inv: Partial<ChangeFile['invariants']> = {},
    sites = elsewhere(...claims.map((c) => c.id)),
  ) => citeLines(LAW, change(claims, inv), sites);

  // no-row
  assert.deepEqual(one([{ id: 'NOPE-1' }]), [
    {
      id: 'NOPE-1',
      kind: 'no-row',
      gates: true,
      text: 'NOPE-1: no row in .multivac/invariants.md — a claim cites a row of the law; add the row, or drop the claim',
    },
  ]);
  // short-row (MV-119): nothing is read from it, not even that it is undeclared
  assert.deepEqual(one([{ id: 'INV-03' }]).map((l) => [l.kind, l.text]), [
    ['short-row', 'INV-03: its row has fewer than six columns, so nothing is read from it (MV-119) — complete the row'],
  ]);
  // retired, and not this change's to retire: named once, never also "undeclared"
  assert.deepEqual(one([{ id: 'INV-02' }]).map((l) => [l.kind, l.text]), [
    [
      'retired',
      "INV-02: retired, and this change does not retire it — drop the claim; its tombstone's absent legs gate every verify run",
    ],
  ]);
  // retiring: under this change's retires, still in force
  assert.deepEqual(one([{ id: 'INV-01' }], { retires: ['INV-01'] }).map((l) => [l.kind, l.text]), [
    [
      'retiring',
      'INV-01: listed under invariants.retires, but its row still reads active — retire the row before close: ' +
        'state retired, its tombstone and absent legs, which this claim then verifies',
    ],
  ]);
  // ...and once it reads retired, the claim is its tombstone's to verify: no line
  assert.deepEqual(one([{ id: 'INV-02' }], { retires: ['INV-02'] }), []);
  // undeclared
  assert.deepEqual(one([{ id: 'INV-01' }]).map((l) => [l.kind, l.text]), [
    [
      'undeclared',
      'INV-01: claimed, but this change neither adds, touches nor retires it — drop the claim, or list it under ' +
        'invariants.touches if this change amends that row',
    ],
  ]);
  // reserved by another change, which names it
  assert.deepEqual(one([{ id: 'INV-05' }], { touches: ['INV-05'] }).map((l) => [l.kind, l.text]), [
    ['reserved-elsewhere', 'INV-05: reserved by change other, which has not stated it — close other first, or drop the claim'],
  ]);
  // unstated: reserved by this change, or empty — plain, and a legacy claim told to move its prose
  assert.deepEqual(one([{ id: 'INV-04' }], { adds: ['INV-04'] }).map((l) => [l.kind, l.gates, l.text]), [
    [
      'unstated',
      true,
      'INV-04: its row states no rule yet — the row is the only place the rule is stated; state it in .multivac/invariants.md',
    ],
  ]);
  assert.deepEqual(
    one([{ id: 'INV-04', statement: 'refunds are idempotent' }], { adds: ['INV-04'] }).map((l) => l.text),
    [
      "INV-04: its row states no rule yet — the row is the only place the rule is stated; move this claim's legacy statement: into the row",
    ],
  );
  assert.deepEqual(one([{ id: 'INV-07' }], { touches: ['INV-07'] }).map((l) => l.kind), ['unstated']);
  // orphan: every parsed anchor sits in the file close archives
  assert.deepEqual(
    citeLines(LAW, change([{ id: 'INV-06' }], { adds: ['INV-06'] }), inChangeFile('INV-06')).map((l) => [l.kind, l.text]),
    [['orphan', 'INV-06: anchored only in .multivac/changes/wsk.md, which close archives — move the anchor beside the code it pins']],
  );
  // ...and one site anywhere else is enough
  assert.deepEqual(
    citeLines(LAW, change([{ id: 'INV-06' }], { adds: ['INV-06'] }), [...inChangeFile('INV-06'), ...elsewhere('INV-06')]),
    [],
  );
  // one line per claim when two reasons hold: undeclared AND unstated says the first
  assert.deepEqual(one([{ id: 'INV-07' }]).map((l) => l.kind), ['undeclared']);

  // The rows this change owns that no claim cites.
  // not-new: an active row under adds — never "drop it from … the law", which law-death refuses
  const notNew = one([], { adds: ['INV-01'] });
  assert.deepEqual(notNew.map((l) => [l.kind, l.gates, l.text]), [
    ['not-new', true, 'INV-01: already in .multivac/invariants.md (active) — not new; move it to invariants.touches'],
  ]);
  assert.doesNotMatch(notNew[0].text, /drop it from/);
  // unclaimed: proposed, owned, anchored, claimed by nothing — reserved or stated alike
  assert.deepEqual(one([], { adds: ['INV-06'] }, elsewhere('INV-06')).map((l) => [l.kind, l.gates, l.text]), [
    [
      'unclaimed',
      true,
      'INV-06: added by this change and anchored, but claimed by nothing — close would enter it unverified; ' +
        'claim it, or drop it from invariants.adds and the law',
    ],
  ]);
  assert.deepEqual(one([], { adds: ['INV-04'] }, elsewhere('INV-04')).map((l) => l.kind), ['unclaimed']);
  // unanchored: stated, owned, nothing anchors it — said, never gating; by source alone or under adds
  assert.deepEqual(citeLines(OWNED, change([]), []).map((l) => [l.kind, l.gates, l.text]), [
    [
      'unanchored',
      false,
      'INV-06: enters the law stated but unanchored — nothing verifies it; claim and anchor it to have close verify it',
    ],
  ]);
  assert.deepEqual(one([], { adds: ['INV-06'] }).map((l) => [l.kind, l.gates]), [['unanchored', false]]);
  // a reservation never used — RESERVED, unanchored, unclaimed — is release's, and raises nothing
  assert.deepEqual(
    citeLines(LAW, change([], { adds: ['INV-04'] }), []).filter((l) => l.id === 'INV-04'),
    [],
  );
  // a claimed owned row is its claim's line alone
  assert.deepEqual(one([{ id: 'INV-06' }], { adds: ['INV-06'] }), []);

  // The declaration half plan says: what is fixable before anything is built or stated.
  assert.deepEqual([...DECLARATION_KINDS], ['no-row', 'short-row', 'retired', 'undeclared', 'reserved-elsewhere']);
});

test('--abandon is refused over a stated own row, never a reserved one — MV-150', () => {
  // INV-06 is stated and this change's; INV-04 still reads RESERVED; INV-01 is
  // active law the change lists by mistake — abandon never deletes law.
  const lines = abandonLines(OWNED, change([], { adds: ['INV-01', 'INV-04'] }));
  assert.deepEqual(lines, [
    'INV-06: states a rule this abandoned change never verified — delete the row from .multivac/invariants.md ' +
      '(a proposed row may be removed), or close the change properly',
  ]);
  assert.deepEqual(abandonLines(LAW, change([], { adds: ['INV-01', 'INV-04'] })), []);
});
