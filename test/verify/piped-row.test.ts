// MV-119. A law row whose statement quotes a pipe.
//
// Found by the gate under-reporting: enacting fourteen rows, `verify` named
// twelve. The two it could not see were the two whose statement contains `|`,
// because the parser counted the state cell from the FRONT of the row and a
// body pipe moves every column after it.
//
// The three consumers are pinned here on the input that separates the two
// readings — a statement carrying `||`, which no existing fixture has.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { verify } from '../../src/commands/verify.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const capture = async (fn: () => Promise<number>): Promise<{ code: number; out: string }> => {
  const lines: string[] = [];
  const log = console.log;
  const err = console.error;
  console.log = (l: string) => lines.push(String(l));
  console.error = (l: string) => lines.push(String(l));
  try {
    return { code: await fn(), out: lines.join('\n') };
  } finally {
    console.log = log;
    console.error = err;
  }
};

const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();

const PIPED = (state: string): string =>
  `| MV-90 | the session gate runs \`mvac verify 2>&1 || true\`. | specified | ${state} | 2026-08-19 | [DESIGN.md](../DESIGN.md) |`;

/** A committed brain whose one extra row quotes a shell pipe. */
function brainWithPipedRow(state: string): string {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-piped-'));
  const e = makeScratchEcosystem(tmp);
  writeFileSync(join(e.brain, '.multivac/config.yml'), 'doors: [agents]\nrepos:\n  brain: .\n');
  appendFileSync(join(e.brain, '.multivac/invariants.md'), `${PIPED(state)}\n`);
  git(e.brain, 'add', '-A');
  git(e.brain, 'commit', '-q', '-m', 'law');
  return e.brain;
}

const swap = (brain: string, from: string, to: string): void => {
  const p = join(brain, '.multivac/invariants.md');
  writeFileSync(p, readFileSync(p, 'utf8').replace(from, to));
};

test('a piped row reaching active is named by the enactment check — MV-81', async () => {
  const brain = brainWithPipedRow('proposed');
  swap(brain, PIPED('proposed'), PIPED('active'));
  git(brain, 'add', '-A');

  const c = await capture(() => verify.run([brain], { cwd: brain }));

  // The ENACT line, not the output: MV-90 appears in the report either way, so
  // matching the whole thing would pass while the check said "no row enacted".
  const enact = c.out.split('\n').find((l) => l.includes('enact')) ?? '';
  assert.match(enact, /MV-90 → active/, `the enactment check did not see the row:\n${c.out}`);
});

test('a piped row that was law cannot be deleted in silence — MV-107', async () => {
  const brain = brainWithPipedRow('active');
  swap(brain, `${PIPED('active')}\n`, '');
  git(brain, 'add', '-A');

  const c = await capture(() => verify.run([brain], { cwd: brain }));

  assert.equal(c.code, 1, c.out);
  assert.match(c.out, /MV-90 was law and is gone/);
});

test('a piped row that is proposed does not gate — MV-85, via the state', async () => {
  // The inversion the left-counted read produced: a `proposed` row parsed as
  // neither `proposed` nor `drift`, so it was not exempt and its broken legs
  // went on to the blocking test. The anchor below is deliberately broken.
  const brain = brainWithPipedRow('proposed');
  appendFileSync(
    join(brain, '.multivac/invariants.md'),
    '<!-- @anchor MV-90 brain:src/**.ts /a string no file contains anywhere/ absent -->\n' +
      '<!-- @anchor MV-90 brain:src/**.ts /a string no file contains anywhere/ -->\n',
  );
  git(brain, 'add', '-A');

  const c = await capture(() => verify.run([brain], { cwd: brain }));

  assert.equal(c.code, 0, `a proposed row gated:\n${c.out}`);
  assert.match(c.out, /0 blocking broken/);
});
