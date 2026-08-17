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
