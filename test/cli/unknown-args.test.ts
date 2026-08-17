// MV-85. An undeclared argument is refused, never ignored.
//
// The measurement that opened this: `mvac doctor --sttrict` produced a full
// report and exited 0 — the strict assertion silently downgraded to a
// description, in the one command whose `--strict` exists to be an assertion.
// Three of nine commands did it with flags, and two of those also discarded a
// directory you named while reporting on the working one.
//
// The list is the REGISTRY, never nine names typed here. The defect is that
// three authors out of nine forgot; a hand-written list would be written by
// someone who could equally forget the tenth. This shape is borrowed from
// help.test.ts, which pins the mirror-image property.
//
// Both assertions are load-bearing. The exit code alone would pass for a
// command that writes its files and then refuses — so the scratch directory is
// checked too, and that is what makes "before any side effect" measured rather
// than assumed.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main } from '../../src/cli.js';
import { commands } from '../../src/commands/index.js';
import { undeclared } from '../../src/lib/args.js';

async function run(argv: string[], cwd: string): Promise<{ code: number; out: string }> {
  const lines: string[] = [];
  const log = console.log;
  const err = console.error;
  console.log = (...a: unknown[]) => lines.push(a.map(String).join(' '));
  console.error = (...a: unknown[]) => lines.push(a.map(String).join(' '));
  try {
    const code = await main(argv, cwd);
    return { code, out: lines.join('\n') };
  } finally {
    console.log = log;
    console.error = err;
  }
}

test('every command refuses an undeclared flag: exit 2, named, tree untouched', async () => {
  for (const c of commands) {
    const dir = mkdtempSync(join(tmpdir(), 'mvac-args-'));
    const { code, out } = await run([c.name, '--zzz-not-a-flag'], dir);
    assert.equal(code, 2, `${c.name} exited ${code} for an unknown flag:\n${out}`);
    assert.match(
      out,
      /--zzz-not-a-flag/,
      `${c.name} refused without naming the argument:\n${out}`,
    );
    // A command that refuses after writing has still written.
    assert.deepEqual(readdirSync(dir), [], `${c.name} touched the tree before refusing`);
  }
});

test('a command that declares no directory refuses one instead of reading the cwd', async () => {
  // doctor declares `[--strict]` and calls doctorReport(ctx.cwd); doors
  // declares no arguments at all. Both used to discard the path in silence and
  // answer about somewhere else — a truthful report about a repo nobody asked
  // about, which is worse than a refusal because nothing marks the swap.
  for (const name of ['doctor', 'doors']) {
    const dir = mkdtempSync(join(tmpdir(), 'mvac-args-'));
    const { code, out } = await run([name, '/tmp'], dir);
    assert.equal(code, 2, `${name} accepted a directory it does not declare:\n${out}`);
    assert.deepEqual(readdirSync(dir), [], `${name} touched the tree before refusing`);
  }
});

test('a declared positional is still accepted', async () => {
  // The refusal must not become "no arguments anywhere": seed declares [dir].
  // An empty scratch dir has no config, so seed gets as far as loading one and
  // fails there — which is the proof that the argument check let it through.
  // Reaching loadConfig IS the assertion; a refusal would never get that far.
  const dir = mkdtempSync(join(tmpdir(), 'mvac-args-'));
  await assert.rejects(
    () => run(['seed', dir], dir),
    /config\.yml/,
    'seed refused the [dir] it declares instead of reaching its config',
  );
});

test("a valued flag's value is not counted as an unexpected argument", async () => {
  // `--repo <key>`, `--landed <repo>`, `--provider a,b`: the value follows the
  // flag and looks exactly like a positional. Unit-level, because reaching this
  // through a command would run it.
  assert.equal(undeclared('t', ['--repo', 'api'], { valued: ['--repo'] }), null);
  assert.equal(undeclared('t', ['--repo', 'api', 'extra'], { valued: ['--repo'] })?.includes('extra'), true);
});

test('the refusal names the command and what it does take', async () => {
  // Never "see --help": the machine already knows the answer, so it says it.
  const dir = mkdtempSync(join(tmpdir(), 'mvac-args-'));
  const { out } = await run(['doctor', '--sttrict'], dir);
  assert.match(out, /doctor/, 'the refusal does not name the command');
  assert.match(out, /--strict/, 'the refusal does not state the declared surface');
});
