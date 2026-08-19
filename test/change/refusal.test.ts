// MV-105. change is the one command that mutates the lifecycle record, and it
// was the one command that never reached the shared refusal: it kept a private
// check that saw only `--` tokens, so a surplus positional and a single-dash
// flag were dropped in silence. `change land <slug> api` exited 0 having
// recorded nothing, and the operator had no way to notice.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const tmp = mkdtempSync(join(tmpdir(), 'mvac-change-refusal-'));
const eco = makeScratchEcosystem(tmp);
const ctx = { cwd: eco.brain };
const law = join(eco.brain, '.multivac/invariants.md');

const capture = async (argv: string[]): Promise<{ code: number; out: string }> => {
  const lines: string[] = [];
  const log = console.log;
  const err = console.error;
  console.log = (...a: unknown[]) => lines.push(a.map(String).join(' '));
  console.error = (...a: unknown[]) => lines.push(a.map(String).join(' '));
  try {
    return { code: await change.run(argv, ctx), out: lines.join('\n') };
  } finally {
    console.log = log;
    console.error = err;
  }
};

test('a surplus positional is refused, and nothing is written', async () => {
  const before = readFileSync(law, 'utf8');
  const { code, out } = await capture(['land', 'some-slug', 'api']);
  assert.equal(code, 2, `exited ${code}:\n${out}`);
  assert.match(out, /unexpected argument "api"/);
  assert.equal(readFileSync(law, 'utf8'), before, 'the law moved before refusing');
});

test('a single-dash token is refused rather than dropped', async () => {
  const { code, out } = await capture(['land', 'some-slug', '-landed', 'api']);
  assert.equal(code, 2, `exited ${code}:\n${out}`);
  assert.match(out, /-landed/);
});

test('a valued flag with no value is refused', async () => {
  const { code, out } = await capture(['land', 'some-slug', '--landed']);
  assert.equal(code, 2, `exited ${code}:\n${out}`);
  assert.match(out, /--landed needs a value/);
});

test('the negation spellings citty consumes still reach the command', async () => {
  // `--no-sdd`/`--no-grapher` are read literally from argv because citty turns
  // them into `sdd: false` before the command sees the declared key. Sharing
  // the guard must not make them unknown flags: the failure here is exit 2.
  for (const flag of ['--no-sdd', '--no-grapher']) {
    const { code, out } = await capture(['close', 'not-a-real-change', flag]);
    assert.notEqual(code, 2, `${flag} was refused as undeclared:\n${out}`);
  }
});

test('both new forms stay legal', async () => {
  // `new "<title>"` (two positionals) and `new <slug> "<title>"` (three): the
  // cap is the subcommand's, not the declaration's.
  for (const argv of [['new', 'A title'], ['new', 'a-slug', 'A title']]) {
    const { code, out } = await capture(argv);
    assert.notEqual(code, 2, `${argv.join(' ')} was refused:\n${out}`);
  }
});
