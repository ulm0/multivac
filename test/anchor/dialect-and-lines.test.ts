// MV-109. The gate refuses what it cannot honour, and a line is a line.
//
// The measurement that opened this: `PIN[:digit:]` — the canonical
// forgot-the-outer-bracket mistake — compiled to /PIN0-9/, which matches only
// the literal text "PIN0-9" and never "PIN4". As an `absent` leg that is green
// forever while real violations sit in the glob: a false green produced by the
// gate whose purpose is catching dialect mistakes at write time (MV-05).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RegexDialectError, compileAnchorRegex } from '../../src/lib/regex.js';
import { matchesInFile } from '../../src/anchor/match.js';
import { parseAnchors } from '../../src/anchor/parse.js';

test('a bare [:class:] is refused with grep’s own wording', () => {
  assert.throws(
    () => compileAnchorRegex('PIN[:digit:]'),
    (e: Error) =>
      e instanceof RegexDialectError && /character class syntax is \[\[:digit:\]\]/.test(e.message),
  );
  // And the correct form still means what it always meant.
  assert.equal(compileAnchorRegex('PIN[[:digit:]]').test('PIN4'), true);
  // And it is a CLASS, not the literal text the mistranslation produced: the
  // broken form's regex was /PIN0-9/, which matches "PIN0-9" and nothing else.
  assert.equal(compileAnchorRegex('PIN[[:digit:]]').test('PINx'), false);
});

test('the constructs POSIX ERE does not have are named, not compiled', () => {
  const refused: Array<[string, RegExp]> = [
    ['a(?=b)', /no `\(\?…\)`/],
    ['a(?:b)', /no `\(\?…\)`/],
    ['a*?b', /greedy/],
    ['a+?b', /greedy/],
    ['(a)\\1', /backreference/],
    ['x\\ty', /no meaning in POSIX ERE/],
    ['x\\ny', /no meaning in POSIX ERE/],
  ];
  for (const [src, message] of refused) {
    assert.throws(() => compileAnchorRegex(src), (e: Error) => e instanceof RegexDialectError && message.test(e.message), src);
  }
});

test('every dialect form in use keeps compiling', () => {
  const accepted = [
    '[[:digit:]]', '[[:alpha:][:digit:]]', '[[:digit:]x]', '[]]', '[^]]',
    '^foo$', 'a{2,3}', '[a-z]', 'a\\.b', '(a|b)+', '[^[:space:]]',
  ];
  for (const src of accepted) assert.doesNotThrow(() => compileAnchorRegex(src), src);
});

test("every anchor in this brain's own law still compiles", () => {
  // The guard that makes tightening the gate shippable at all: the corpus this
  // rule governs has to survive it. A dialect gate that refuses the law it was
  // written for is not a stricter gate, it is a broken one.
  const law = readFileSync(join(process.cwd(), '.multivac/invariants.md'), 'utf8');
  const { anchors, diagnostics } = parseAnchors(law, '.multivac/invariants.md');
  assert.ok(anchors.length > 100, `only ${anchors.length} anchors parsed`);
  assert.deepEqual(
    diagnostics.map((d) => d.message),
    [],
    'the widened gate refuses an anchor this brain already relies on',
  );
});

test('a CRLF line is a line: same verdicts, same numbers as the LF twin', () => {
  const lf = 'alpha\nbeta\ngamma\n';
  const crlf = 'alpha\r\nbeta\r\ngamma\r\n';
  for (const src of ['alpha$', '^beta$', 'gamma']) {
    const re = () => compileAnchorRegex(src);
    assert.deepEqual(
      matchesInFile('f.txt', crlf, re()).map((m) => m.line),
      matchesInFile('f.txt', lf, re()).map((m) => m.line),
      `${src} disagrees between CRLF and LF`,
    );
  }
  // And the $-anchored one actually matched, so the comparison is not two
  // empty lists agreeing.
  assert.deepEqual(matchesInFile('f.txt', crlf, compileAnchorRegex('alpha$')).map((m) => m.line), [1]);
});

test('a lone carriage return is still text, not a line ending', () => {
  // An old-Mac ending is out of scope, and staying out of scope is the
  // assertion: `b` is on line ONE, because `a\rb` was never split.
  assert.deepEqual(matchesInFile('f.txt', 'a\rb\n', compileAnchorRegex('b')).map((m) => m.line), [1]);
});
