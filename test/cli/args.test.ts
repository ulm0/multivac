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

// MV-105. The pair, about the SAME input — which is the seam MV-104 missed.
// 0.9.0 shipped a refusal for `init --provider=claude`, a form 0.8.0 accepted,
// because each reader was asked about a different input: the parser was asked
// about the equals form and the guard about the separated one, and nothing
// asked either about the other.
test('both readers agree about the same token, in both written forms', () => {
  for (const argv of [['--repo', 'api'], ['--repo=api']]) {
    assert.equal(undeclared('verify', argv, surfaceFrom(ARGS)), null, `refused ${argv.join(' ')}`);
    assert.equal(parseArgs(argv, ARGS).repo, 'api', `parsed ${argv.join(' ')} wrong`);
  }
});

test('an undeclared flag written with an equals is refused, and named as typed', () => {
  const line = String(undeclared('verify', ['--nope=1'], surfaceFrom(ARGS)));
  assert.match(line, /unknown flag "--nope=1"/);
});

test('a declared boolean may carry the value citty gives it', () => {
  // citty owns negation: `--strict=false` is the declared flag, so the guard
  // has no business refusing it.
  assert.equal(undeclared('verify', ['--strict=false'], surfaceFrom(ARGS)), null);
  assert.equal(parseArgs(['--strict=false'], ARGS).strict, false);
});

test('a short alias with an equals is refused, because the parser mis-reads it', () => {
  // Measured on citty 0.2.2: `-r=api` binds repo to "=api". Splitting the token
  // here would hand the parser a form it does not understand and call it
  // declared — the defect relocated, not fixed.
  assert.equal(parseArgs(['-r=api'], ARGS).repo, '=api');
  assert.match(String(undeclared('verify', ['-r=api'], surfaceFrom(ARGS))), /unknown flag "-r=api"/);
});

test('a valued flag never swallows the next flag, or the end of the line', () => {
  // What the parser does with both, unguarded — the reason the guard must
  // answer first. `verify --repo --strict` ran a NON-strict verify and said
  // nothing, which is `doctor --sttrict` inside the guard that ends it.
  assert.equal(parseArgs(['--repo', '--strict'], ARGS).repo, '--strict');
  assert.equal(parseArgs(['--repo'], ARGS).repo, '');
  assert.match(String(undeclared('verify', ['--repo', '--strict'], surfaceFrom(ARGS))), /--repo needs a value/);
  assert.match(String(undeclared('verify', ['--repo'], surfaceFrom(ARGS))), /--repo needs a value/);
  // The value is inside the token, so nothing was swallowed and a leading dash
  // is just a value.
  assert.equal(undeclared('verify', ['--repo=-x'], surfaceFrom(ARGS)), null);
  assert.equal(parseArgs(['--repo=-x'], ARGS).repo, '-x');
});

test("the missing-value refusal keeps the command's own wording (MV-69)", () => {
  const line = undeclared('verify', ['--repo'], surfaceFrom(ARGS), '[dir], --strict, --repo <key>');
  assert.equal(line, 'verify: --repo needs a value — verify takes [dir], --strict, --repo <key>');
});

test('a command can keep its own wording while the check comes from the declaration', () => {
  const line = undeclared('verify', ['--loud'], surfaceFrom(ARGS), '[dir], --strict, --repo <key>');
  assert.equal(line, 'verify: unknown flag "--loud" — verify takes [dir], --strict, --repo <key>');
});

test('the two stated edge cases: an empty value, and a bare double dash', () => {
  // `--repo=` names a declared flag, so the guard has nothing to say; what an
  // empty value means is the command's business, not the surface's.
  assert.equal(undeclared('verify', ['--repo='], surfaceFrom(ARGS)), null);
  assert.equal(parseArgs(['--repo='], ARGS).repo, '');
  // A bare `--` names no declared flag, so it is refused like any other.
  assert.match(String(undeclared('verify', ['--'], surfaceFrom(ARGS))), /unknown flag "--"/);
});
