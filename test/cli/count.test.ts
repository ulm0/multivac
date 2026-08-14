// `count` is the ratchet dry-run: the same numbers verify uses, because it
// runs verify's own parser and matcher — never a reimplementation. Hand
// git-grep counts were wrong on 2 of 3 measurement-2 subjects.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem, type ScratchEcosystem } from '../helpers/fixture.js';
import { count } from '../../src/commands/count.js';
import { verify } from '../../src/commands/verify.js';

function eco(): ScratchEcosystem {
  return makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-count-')));
}

function commitFile(repo: string, rel: string, content: string): void {
  writeFileSync(join(repo, rel), content);
  execFileSync('git', ['-C', repo, 'add', '-A'], { stdio: 'ignore' });
  execFileSync('git', ['-C', repo, 'commit', '-q', '-m', `add ${rel}`], { stdio: 'ignore' });
}

async function run(argv: string[], cwd: string): Promise<{ code: number; out: string }> {
  const lines: string[] = [];
  const log = console.log;
  const err = console.error;
  console.log = (...a: unknown[]) => lines.push(a.map(String).join(' '));
  console.error = (...a: unknown[]) => lines.push(a.map(String).join(' '));
  try {
    const code = await count.run(argv, { cwd });
    return { code, out: lines.join('\n') };
  } finally {
    console.log = log;
    console.error = err;
  }
}

test('per-file breakdown and total, and the total is the ratchet verify pins', async () => {
  const e = eco();
  const spec = 'api:db/migrations/*.sql /balance/';
  const one = await run([spec], e.brain);
  assert.equal(one.code, 0);
  assert.match(one.out, /db\/migrations\/0001\.sql {2}1/);
  assert.match(one.out, /1 match in 1 tracked file — a ratchet pins count=1/);

  commitFile(e.repos.api, 'db/migrations/0002.sql', 'ALTER TABLE a ADD COLUMN balance_2 int;\n');
  const two = await run([spec], e.brain);
  assert.match(two.out, /db\/migrations\/0002\.sql {2}1/);
  assert.match(two.out, /2 matches in 2 tracked files — a ratchet pins count=2/);

  // The same numbers verify uses: pin what count said and verify is green.
  writeFileSync(
    join(e.brain, '.multivac/invariants.md'),
    [
      '# Invariants',
      '',
      '| ID | statement | authority | state | date | source |',
      '| --- | --- | --- | --- | --- | --- |',
      '| INV-01 | balance columns are ratcheted | published | active | 2026-01-01 | x |',
      `<!-- @anchor INV-01 ${spec} count=2 -->`,
      '',
    ].join('\n'),
  );
  assert.equal(await verify.run([], { cwd: e.brain }), 0);
});

test('SQL statements count per normalized statement — where hand grep goes wrong', async () => {
  const e = eco();
  // No single LINE of 0001.sql matches this; the normalized statement does.
  const { code, out } = await run(
    ['api:db/migrations/*.sql /grant[^;]*update[[:space:]]+on[[:space:]]+accounts/i'],
    e.brain,
  );
  assert.equal(code, 0);
  assert.match(out, /1 match in 1 tracked file — a ratchet pins count=1/);
});

test('a dry run answers and never writes', async () => {
  const e = eco();
  const before = execFileSync('git', ['-C', e.brain, 'status', '--porcelain']).toString();
  const zero = await run(['api:src/**/*.ts /nothing_matches_this/'], e.brain);
  assert.equal(zero.code, 0);
  assert.match(zero.out, /a ratchet pins count=0/);
  const after = execFileSync('git', ['-C', e.brain, 'status', '--porcelain']).toString();
  assert.equal(after, before, 'count wrote into the tree');
});

test('bad input is a usage answer, exit 2: malformed spec, unknown repo, PCRE shorthand', async () => {
  const e = eco();
  assert.equal((await run([], e.brain)).code, 2);
  assert.equal((await run(['no-colon-here'], e.brain)).code, 2);
  const unknown = await run(['nope:src/** /x/'], e.brain);
  assert.equal(unknown.code, 2);
  assert.match(unknown.out, /unknown repo key "nope"/);
  const pcre = await run(['api:src/** /\\d+/'], e.brain);
  assert.equal(pcre.code, 2);
  assert.match(pcre.out, /is not POSIX ERE/);
});
