import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compileAnchorRegex,
  RegexDialectError,
} from '../../src/lib/regex.js';

test('compiles POSIX classes to a working RegExp', () => {
  const re = compileAnchorRegex(
    'revoke[[:space:]]+update[[:space:]]+on',
    'i',
  );
  assert.ok(re.test('REVOKE  update\ton accounts'));
  assert.ok(!re.test('revokeupdate on'));
});

test('negated class and digit class work', () => {
  assert.ok(compileAnchorRegex('[^[:space:]]+').test('abc'));
  assert.ok(compileAnchorRegex('v[[:digit:]]+').test('v42'));
  assert.ok(!compileAnchorRegex('^[[:digit:]]+$').test('4a2'));
});

test('rejects PCRE shorthands with translation hints', () => {
  for (const [src, hint] of [
    ['a\\sb', '[[:space:]]'],
    ['\\d+', '[[:digit:]]'],
    ['\\wx', '[[:alnum:]_]'],
    ['\\bword', '(^|[^[:alnum:]_])'],
  ] as const) {
    assert.throws(
      () => compileAnchorRegex(src),
      (e: unknown) =>
        e instanceof RegexDialectError && e.message.includes(hint),
      src,
    );
  }
});

test('escaped literals still pass, double backslash is not a shorthand', () => {
  assert.ok(compileAnchorRegex('a\\.b').test('a.b'));
  // \\s = literal backslash then "s", not the \s shorthand
  assert.ok(compileAnchorRegex('a\\\\s').test('a\\s'));
});

test('only flag i is allowed', () => {
  assert.ok(compileAnchorRegex('abc', 'i').test('ABC'));
  assert.throws(() => compileAnchorRegex('abc', 'g'), RegexDialectError);
  assert.throws(() => compileAnchorRegex('abc', 'im'), RegexDialectError);
});

test('unknown POSIX class and bad syntax are dialect errors', () => {
  assert.throws(() => compileAnchorRegex('[[:bogus:]]'), RegexDialectError);
  assert.throws(() => compileAnchorRegex('a(b'), RegexDialectError);
});
