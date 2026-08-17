import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesInFile } from '../../src/anchor/match.js';
import { compileAnchorRegex } from '../../src/lib/regex.js';

// MV-82. The skip is for a line carrying an anchor COMMENT — an anchor's own
// regex text must not satisfy another leg. It is not for the word `@anchor`:
// that reach made every line mentioning it invisible to every leg, so
// `const evade = "user.name"; // @anchor` in src/ passed MV-04's tombstone.

test('a source line that mentions @anchor in a comment is scanned', () => {
  const re = compileAnchorRegex('user\\.(name|email)');
  assert.deepEqual(matchesInFile('src/lib/paths.ts', 'const evade = "user.name"; // @anchor\n', re), [
    { file: 'src/lib/paths.ts', line: 1 },
  ]);
});

test('the trailing comment changes nothing: same verdict, same line', () => {
  const re = compileAnchorRegex('user\\.(name|email)');
  const bare = matchesInFile('src/lib/paths.ts', 'const evade = "user.name";\n', re);
  const dressed = matchesInFile('src/lib/paths.ts', 'const evade = "user.name"; // @anchor\n', re);
  assert.deepEqual(dressed, bare);
});

test('a genuine anchor comment line is skipped, the line beside it is not', () => {
  const law = [
    '| MV-99 | no hard-coded credential in the source | specified | active | 2026-08-17 | DESIGN.md |',
    '<!-- @anchor MV-99 brain:src/** /SECRET_KEY/ absent -->',
    'const SECRET_KEY = "hunter2";',
  ].join('\n');
  // line 2 carries the leg's own regex text; only line 3 is code
  assert.deepEqual(matchesInFile('.multivac/invariants.md', law, compileAnchorRegex('SECRET_KEY')), [
    { file: '.multivac/invariants.md', line: 3 },
  ]);
});

test('a docs page quoting the grammar does not satisfy a leg', () => {
  const page = [
    'Write the leg on the line after the row it pins:',
    '',
    '```',
    '<!-- @anchor INV-01 api:db/migrations/*.sql /GRANT/ absent -->',
    '```',
    '',
    'The mode says what the leg must find.',
  ].join('\n');
  assert.deepEqual(matchesInFile('site/content/docs/guide/writing-anchors.md', page, compileAnchorRegex('GRANT')), []);
});

test('the skip is stateless — the same line answers the same twice', () => {
  const text = '<!-- @anchor MV-99 brain:src/** /SECRET_KEY/ absent -->\n';
  const re = compileAnchorRegex('SECRET_KEY');
  const first = matchesInFile('x.md', text, re);
  // fails if ANCHOR_LINE ever gains a `g` flag: lastIndex would carry over
  assert.deepEqual(matchesInFile('x.md', text, re), first);
  assert.deepEqual(first, []);
});

// MV-82, second pass. Narrowing the substring to the OPENER left the opener
// itself as the whole password: it needed no terminator, could sit anywhere in
// the line, in a file of any type. Each spelling below silenced MV-04's
// tombstone on one line. The skip now requires a COMPLETE anchor comment —
// `ANCHOR_LINE` plus the `-->` the parser demands before it accepts one — so
// each is scanned. One helper, one payload, so the name is the only variable.

const PII = () => compileAnchorRegex('user\\.(name|email)');
const scanned = (line: string) =>
  assert.deepEqual(matchesInFile('src/lib/paths.ts', line + '\n', PII()), [
    { file: 'src/lib/paths.ts', line: 1 },
  ]);

test('evasion: opener with no terminator — // <!-- @anchor', () => {
  scanned('const evade = "user.name"; // <!-- @anchor');
});

test('evasion: zero whitespace — <!--@anchor', () => {
  scanned('const evade = "user.name"; // <!--@anchor');
});

test('evasion: tab after the opener — <!--\\t@anchor', () => {
  scanned('const evade = "user.name"; // <!--\t@anchor');
});

test('evasion: non-word character satisfies \\b — <!-- @anchor.', () => {
  scanned('const evade = "user.name"; // <!-- @anchor.');
});

test('evasion: opener inside a plain string literal, never a comment', () => {
  scanned('const evade = "user.name" + "<!-- @anchor";');
});

test('evasion: opener inside a template literal', () => {
  scanned('const evade = `user.name <!-- @anchor`;');
});

test('the terminator is required in any file type, not just source', () => {
  for (const f of ['src/lib/paths.ts', 'config/app.yaml', 'notes.txt', 'Makefile']) {
    assert.deepEqual(matchesInFile(f, 'user.name  # <!-- @anchor\n', PII()), [{ file: f, line: 1 }]);
  }
});

// The ceiling, asserted so it is a decision and not a surprise. A FULLY forged
// anchor comment — opener and terminator both — still hides its line, in a
// block comment or ahead of the code. These two are indistinguishable, by line
// shape alone, from `test/verify/`'s fixtures quoting whole anchors inside
// string literals, which MUST stay hidden. Closing them needs something that
// is not a line-shape test.

test('ceiling: a fully forged anchor in a block comment still hides the line', () => {
  assert.deepEqual(matchesInFile('src/lib/paths.ts', 'const evade = "user.name"; /* <!-- @anchor --> */\n', PII()), []);
});

test('ceiling: a fully forged anchor ahead of the code still hides the line', () => {
  assert.deepEqual(matchesInFile('src/lib/paths.ts', '<!-- @anchor --> const evade = "user.name";\n', PII()), []);
});
