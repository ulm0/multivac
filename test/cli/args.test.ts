// MV-104: one declaration, two readers — and the refusal reads it FIRST.
//
// The order is the point. Measured on citty 0.2.2, an undeclared flag is
// accepted, dropped, and the command runs; that is MV-85's original defect
// arriving inside a dependency. So `undeclared` is not a second opinion about
// what the parser did, it is what stops the parser being asked.
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, type ArgsDef } from 'citty';
import { surfaceFrom, undeclared } from '../../src/lib/args.js';

const ARGS = {
  dir: { type: 'positional', required: false },
  strict: { type: 'boolean' },
  repo: { type: 'string', alias: 'r' },
} satisfies ArgsDef;

test('the surface is derived from the declaration citty parses', () => {
  const s = surfaceFrom(ARGS);
  assert.deepEqual(s.flags, ['--strict']);
  assert.deepEqual(s.valued, ['--repo', '-r']);
  assert.equal(s.positionals, 1);
});

test('a flag added to the declaration is legal to both readers, with no second edit', () => {
  const grown = { ...ARGS, worktree: { type: 'boolean' } } satisfies ArgsDef;
  assert.equal(undeclared('verify', ['--worktree'], surfaceFrom(grown)), null);
  assert.equal(parseArgs(['--worktree'], grown).worktree, true);
  // And the same argument against the declaration WITHOUT it is refused.
  assert.match(String(undeclared('verify', ['--worktree'], surfaceFrom(ARGS))), /unknown flag "--worktree"/);
});

test('the refusal runs before the parser, because the parser would not refuse', () => {
  // What citty does with the same input, unguarded: it parses the flag into a
  // key nobody declared and hands it over. Nothing refuses; the command runs
  // and ignores it, which is exactly the silence MV-85 exists to end.
  assert.equal(parseArgs(['--nope'], ARGS).nope, true);
  assert.deepEqual(parseArgs(['--nope'], ARGS)._, []);
  // What the guard does with it.
  assert.match(String(undeclared('verify', ['--nope'], surfaceFrom(ARGS))), /unknown flag "--nope"/);
});

test('an extra positional is refused, where the parser would drop it', () => {
  assert.deepEqual(parseArgs(['a', 'b'], ARGS)._, ['a', 'b']);
  assert.equal(parseArgs(['a', 'b'], ARGS).dir, 'a'); // b is bound to nothing
  assert.match(String(undeclared('seed', ['a', 'b'], surfaceFrom(ARGS))), /unexpected argument "b"/);
});

test('a valued flag consumes its value, so a value is never a positional', () => {
  assert.equal(undeclared('verify', ['--repo', 'api'], surfaceFrom(ARGS)), null);
  assert.equal(parseArgs(['--repo', 'api'], ARGS).repo, 'api');
  assert.equal(parseArgs(['--repo=api'], ARGS).repo, 'api');
});

test('a command can keep its own wording while the check comes from the declaration', () => {
  const line = undeclared('verify', ['--loud'], surfaceFrom(ARGS), '[dir], --strict, --repo <key>');
  assert.equal(line, 'verify: unknown flag "--loud" — verify takes [dir], --strict, --repo <key>');
});
