import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  parseAnchors,
  collectBrainAnchors,
  readClaimRows,
  parseClaimRows,
} from '../../src/anchor/parse.js';

test('parses the full grammar: legs, excludes, flags, modes', () => {
  const text = [
    '| INV-01 | row | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-01 api:db/migrations/*.sql /revoke[[:space:]]+update/i -->',
    '<!-- @anchor INV-01 api:db/** !db/tests/** !db/tmp/** /grant[[:space:]]+update/i absent -->',
    '<!-- @anchor INV-01 api:db/migrations/*.sql /update[[:space:]]+accounts/i count=2 -->',
    '<!-- @anchor INV-02 *:AGENTS.md /(^|[^[:alnum:]_])FLUXCAP([^[:alnum:]_]|$)/ absent -->',
    '<!-- @anchor INV-03 web:src/** /x\\/y z/ unique -->',
  ].join('\n');
  const { anchors, diagnostics } = parseAnchors(text, 'invariants.md');
  assert.deepEqual(diagnostics, []);
  assert.equal(anchors.length, 5);
  const [a, b, c, d, e] = anchors;
  assert.equal(a.claimId, 'INV-01');
  assert.equal(a.repoKey, 'api');
  assert.equal(a.include, 'db/migrations/*.sql');
  assert.equal(a.mode, 'present');
  assert.equal(a.regexFlags, 'i');
  assert.deepEqual(a, { ...a, file: 'invariants.md', line: 2 });
  assert.deepEqual(b.excludes, [{ glob: 'db/tests/**' }, { glob: 'db/tmp/**' }]);
  assert.equal(b.mode, 'absent');
  assert.equal(c.mode, 'count');
  assert.equal(c.count, 2);
  assert.equal(d.repoKey, '*');
  // regex may contain slashes and spaces
  assert.equal(e.regexSource, 'x\\/y z');
  assert.equal(e.mode, 'unique');
});

test('each and each! parse: one mode, the ! carries the polarity', () => {
  const { anchors, diagnostics } = parseAnchors(
    [
      '<!-- @anchor INV-1 api:k8s/*.yaml /limits:/ each -->',
      '<!-- @anchor INV-1 api:k8s/*.yaml /privileged:[[:space:]]*true/ each! -->',
    ].join('\n'),
    'f.md',
  );
  assert.deepEqual(diagnostics, []);
  assert.equal(anchors.length, 2);
  assert.equal(anchors[0].mode, 'each');
  assert.equal(anchors[0].negated, false);
  assert.equal(anchors[1].mode, 'each');
  assert.equal(anchors[1].negated, true);
});

test('near-each spellings are loud rejects naming the real modes', () => {
  for (const tok of ['each=2', 'every', '!each', 'each!!']) {
    const { anchors, diagnostics } = parseAnchors(
      `<!-- @anchor INV-1 api:k8s/*.yaml /x/ ${tok} -->`,
      'f.md',
    );
    assert.equal(anchors.length, 0, tok);
    assert.equal(diagnostics.length, 1, tok);
    assert.match(diagnostics[0].message, /unknown mode/, tok);
    assert.match(diagnostics[0].message, /each or each!/, tok);
  }
});

test('PCRE shorthand is a diagnostic with a translation hint, never a skip', () => {
  const { anchors, diagnostics } = parseAnchors(
    'x\n<!-- @anchor INV-1 api:db/** /\\snope/ absent -->\n',
    'law.md',
  );
  assert.equal(anchors.length, 0);
  assert.equal(diagnostics.length, 1);
  assert.equal(diagnostics[0].file, 'law.md');
  assert.equal(diagnostics[0].line, 2);
  assert.ok(diagnostics[0].message.includes('[[:space:]]'));
});

test('each malformation names the defect at file:line', () => {
  const cases: [string, RegExp][] = [
    ['<!-- @anchor INV-1 apiglob /re/ -->', /repo.*:.*glob|is not <repo>:<glob>/],
    ['<!-- @anchor api:x/** /re/ -->', /missing claim id/],
    ['<!-- @anchor INV-1 api:x/** /re/ sometimes -->', /unknown mode "sometimes"/],
    ['<!-- @anchor INV-1 api:x/** /re/g -->', /flags/],
    ['<!-- @anchor INV-1 api:x/** re -->', /regex/],
    ['<!-- @anchor INV-1 api:x/** ! /re/ -->', /exclusion/],
    ['<!-- @anchor INV-1 api:x/** !api: /re/ -->', /is not !<repo>:<glob>/],
    ['<!-- @anchor INV-1 api:x/** !:x.md /re/ -->', /is not !<repo>:<glob>/],
    ['<!-- @anchor INV-1 api:x/** /re/ absent extra -->', /regex/],
    ['<!-- @anchor INV-1 api:x/** /re/', /one line/],
    ['@anchor INV-1 api:x/** /re/', /HTML comment/],
  ];
  for (const [line, want] of cases) {
    const { anchors, diagnostics } = parseAnchors(line, 'f.md');
    assert.equal(anchors.length, 0, line);
    assert.equal(diagnostics.length, 1, line);
    assert.equal(diagnostics[0].line, 1);
    assert.match(diagnostics[0].message, want, line);
  }
});

test('an exclusion may name its repo; the bare form stays bare', () => {
  const { anchors, diagnostics } = parseAnchors(
    '<!-- @anchor INV-1 *:**.md !brain:07-rules.md !tmp/** !api:README.md /PIN/ absent -->\n',
    'f.md',
  );
  assert.deepEqual(diagnostics, []);
  assert.deepEqual(anchors[0].excludes, [
    { repoKey: 'brain', glob: '07-rules.md' },
    { glob: 'tmp/**' },
    { repoKey: 'api', glob: 'README.md' },
  ]);
});

test('prose lines without an anchor comment are ignored', () => {
  const { anchors, diagnostics } = parseAnchors(
    'the @anchor grammar is documented elsewhere\nplain text\n',
    'f.md',
  );
  assert.equal(anchors.length, 0);
  assert.deepEqual(diagnostics, []);
});

test('collectBrainAnchors reads root *.md, the law and .multivac/changes/*.md', async () => {
  const brain = mkdtempSync(join(tmpdir(), 'mvac-parse-'));
  mkdirSync(join(brain, '.multivac'));
  writeFileSync(
    join(brain, '.multivac/invariants.md'),
    '<!-- @anchor INV-1 api:src/** /a/ -->\n',
  );
  writeFileSync(join(brain, 'notes.md'), '<!-- @anchor INV-2 api:src/** /b/ absent -->\n');
  mkdirSync(join(brain, '.multivac/changes'), { recursive: true });
  writeFileSync(
    join(brain, '.multivac/changes', '0001-thing.md'),
    '<!-- @anchor CHG-1 web:src/** /c/ -->\n',
  );
  mkdirSync(join(brain, 'deep'));
  writeFileSync(join(brain, 'deep', 'hidden.md'), '<!-- @anchor NOPE-1 api:** /d/ -->\n');
  const { anchors, diagnostics } = await collectBrainAnchors(brain);
  assert.deepEqual(diagnostics, []);
  assert.deepEqual(
    anchors.map((a) => [a.claimId, a.file]).sort(),
    [
      ['CHG-1', join('.multivac/changes', '0001-thing.md')],
      ['INV-1', join('.multivac', 'invariants.md')],
      ['INV-2', 'notes.md'],
    ],
  );
});

test('readClaimRows parses the law table, skipping header and separator', async () => {
  const brain = mkdtempSync(join(tmpdir(), 'mvac-rows-'));
  mkdirSync(join(brain, '.multivac'));
  writeFileSync(
    join(brain, '.multivac/invariants.md'),
    [
      '# Invariants',
      '',
      '| ID | statement | authority | state | date | source |',
      '| --- | --- | --- | --- | --- | --- |',
      '| INV-01 | no writes to ledger | published | active | 2026-01-01 | x |',
      '<!-- @anchor INV-01 api:db/** /revoke/i -->',
      '| INV-02 | old flow gone | published | retired | 2026-02-01 | y |',
      '',
      'prose after the table',
    ].join('\n'),
  );
  const rows = await readClaimRows(brain);
  assert.deepEqual(rows, [
    {
      id: 'INV-01',
      statement: 'no writes to ledger',
      authority: 'published',
      state: 'active',
      date: '2026-01-01',
      source: 'x',
    },
    {
      id: 'INV-02',
      statement: 'old flow gone',
      authority: 'published',
      state: 'retired',
      date: '2026-02-01',
      source: 'y',
    },
  ]);
  // missing file = zero claims, not an error
  assert.deepEqual(await readClaimRows(mkdtempSync(join(tmpdir(), 'mvac-empty-'))), []);
});

// MV-119. The fixture above cannot tell the two arithmetics apart: its
// statements contain no `|`, so the fourth cell from the front and the fourth
// from the back are the SAME cell. That is why nothing caught the defect for
// fourteen rows — the corpus that exercised it was the real law file, which no
// test parsed. This one uses the input that separates the readings.
test('a statement that quotes a pipe does not move the columns after it', () => {
  const rows = parseClaimRows(
    [
      '| ID | statement | authority | state | date | source |',
      '| --- | --- | --- | --- | --- | --- |',
      '| MV-01 | the hook runs `mvac verify 2>&1 || true` | measured | proposed | 2026-01-01 | [a](a.md) |',
      '| MV-02 | plain prose | measured | active | 2026-01-02 | [b](b.md) |',
      '| MV-03 | a table of its own: `| x | y |` | measured | retired | 2026-01-03 | [c](c.md) |',
      '| MV-04 | short row missing its columns |',
    ].join('\n'),
  );
  assert.deepEqual(
    rows.map((r) => [r.id, r.state]),
    [
      ['MV-01', 'proposed'],
      ['MV-02', 'active'],
      ['MV-03', 'retired'],
      ['MV-04', ''],
    ],
  );
  // The statement is rejoined, not truncated at the first pipe: `change plan`
  // reads it to tell a reservation from a stated row.
  assert.equal(rows[0].statement, 'the hook runs `mvac verify 2>&1 || true`');
  assert.equal(rows[2].statement, 'a table of its own: `| x | y |`');
  assert.equal(rows[0].source, '[a](a.md)');
  // A row that does not carry its trailing columns claims nothing, rather than
  // reading a neighbour's cell as its state.
  assert.equal(rows[3].source, '');
});

test('code blocks are documentation, not law: fenced and indented anchors are skipped', () => {
  const text = [
    '```markdown',
    '<!-- @anchor INV-01 api:x/*.sql /revoke/ -->',
    '<!-- @anchor BAD this is malformed -->',
    '```',
    '    <!-- @anchor INV-02 api:*.md /also indented, also malformed -->',
    '~~~',
    '<!-- @anchor INV-03 api:*.md /fenced/ absent -->',
    '~~~',
    '<!-- @anchor INV-04 api:*.md /live/ absent -->',
  ].join('\n');
  const { anchors, diagnostics } = parseAnchors(text, 'DESIGN.md');
  assert.deepEqual(diagnostics, []);
  assert.equal(anchors.length, 1);
  assert.equal(anchors[0].claimId, 'INV-04');
});

test('a rejected glob names the dialect: picomatch, not shell', () => {
  const { diagnostics } = parseAnchors(
    ['<!-- @anchor INV-1 apiglob /re/ -->', '<!-- @anchor INV-2 api:src/** ! /re/ -->'].join('\n'),
    'invariants.md',
  );
  assert.equal(diagnostics.length, 2);
  for (const d of diagnostics) {
    assert.match(d.message, /picomatch/);
    assert.match(d.message, /\*\*/);
  }
});
