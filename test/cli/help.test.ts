// --help is an answer, never an action: every subcommand exits 0, prints
// usage, and leaves the tree untouched (measurement 2: `seed --help` wrote a
// seed-report into the tool's own repo). Plus `help anchor` — one screen.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main } from '../../src/cli.js';
import { commands } from '../../src/commands/index.js';

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

test('every subcommand answers --help and -h: usage, exit 0, tree untouched', async () => {
  for (const c of commands) {
    for (const flag of ['--help', '-h']) {
      const dir = mkdtempSync(join(tmpdir(), 'mvac-help-'));
      const { code, out } = await run([c.name, flag], dir);
      assert.equal(code, 0, `${c.name} ${flag} exited ${code}:\n${out}`);
      assert.match(out, new RegExp(`multivac ${c.name}`), `${c.name} ${flag} printed no usage`);
      // No side effect: the scratch dir is exactly as empty as it started.
      assert.deepEqual(readdirSync(dir), [], `${c.name} ${flag} touched the tree`);
    }
  }
});

test('--help wins even after other args — recognized before any side effect', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-help-'));
  const { code } = await run(['seed', '.', '--help'], dir);
  assert.equal(code, 0);
  assert.deepEqual(readdirSync(dir), [], 'seed ran instead of answering --help');
});

test('help anchor: the whole grammar on one screen', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-help-'));
  const { code, out } = await run(['help', 'anchor'], dir);
  assert.equal(code, 0);
  const lines = out.split('\n');
  assert.ok(lines.length <= 45, `not one screen: ${lines.length} lines`);
  // The findings that sent adopters into our TypeScript, each named here:
  assert.match(out, /POSIX ERE only/);
  assert.match(out, /\[\[:space:\]\]/); // the \s replacement
  assert.match(out, /\*\.sql/); // per-line except sql statements
  assert.match(out, /deletion ratchet/); // count across the glob
  assert.match(out, /ONE include glob/); // braces for alternatives
  assert.match(out, /\{a,b\}/);
  assert.match(out, /!<repo>:<glob>/); // qualified exclusions
  assert.match(out, /\.multivac\/changes\/\*\.md/); // where anchors live
});

test('help with a command name prints its usage; unknown topic exits 2', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-help-'));
  const v = await run(['help', 'verify'], dir);
  assert.equal(v.code, 0);
  assert.match(v.out, /multivac verify/);
  assert.match(v.out, /--strict/);
  const bad = await run(['help', 'frobnicate'], dir);
  assert.equal(bad.code, 2);
});

test('every command prints its own flags and arguments, not just a description', async () => {
  // The gap this closes: `mvac init --help` printed one line and said nothing
  // about [dir], --provider, --sdd, --grapher or --quiet. Five of nine were
  // the same. The dispatcher was already right; the data was missing.
  const dir = mkdtempSync(join(tmpdir(), 'mvac-help-'));
  for (const c of commands) {
    const { code, out } = await run([c.name, '--help'], dir);
    assert.equal(code, 0, `${c.name} --help must exit 0`);
    assert.ok(
      out.includes(`usage: multivac ${c.name}`),
      `${c.name} --help must print a usage line, got:\n${out}`,
    );
    assert.ok(
      out.split('\n').filter(Boolean).length >= 2,
      `${c.name} --help must say more than its one-line description`,
    );
  }
});

test("init's help lists the adapters the tool actually ships", async () => {
  // Rendered FROM the registry, so a new adapter cannot leave the help behind
  // — and `agents` is excluded, because agents.md is the format every door
  // projects from, not a coding agent anyone could have installed.
  const dir = mkdtempSync(join(tmpdir(), 'mvac-help-'));
  const { out } = await run(['init', '--help'], dir);
  for (const name of ['claude', 'cursor', 'copilot']) {
    assert.ok(out.includes(name), `--provider should list ${name}`);
  }
  // The line that enumerates the legal values, not the prose around it.
  const values = out.split('\n').find((l) => l.includes('claude, cursor'));
  assert.ok(values, 'the provider list should be on one line');
  assert.doesNotMatch(values, /\bagents\b/);
  for (const name of ['opsx', 'speckit']) assert.ok(out.includes(name));
  for (const name of ['graphify', 'codegraph']) assert.ok(out.includes(name));
});
