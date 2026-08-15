// MV-53 — each context verifies what it is responsible for. The brain reads
// the ecosystem AS PUBLISHED (each repo at its channel ref); a consumer reads
// its own working tree, the content about to be committed there. Both say
// which bytes they read.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  makeScratchEcosystem,
  publishRepo,
  type ScratchEcosystem,
} from '../helpers/fixture.js';
import { verify } from '../../src/commands/verify.js';

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', ['-C', cwd, ...args], { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
}

const HEADER = [
  '# Invariants',
  '',
  '| ID | statement | authority | state | date | source |',
  '| --- | --- | --- | --- | --- | --- |',
];

function commitAll(repo: string, msg: string): void {
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', msg);
}

/**
 * api published clean on origin/main, then parked on a WIP branch whose
 * content violates the tombstone — the exact shape that used to paint the
 * brain's law red for a reason that had nothing to do with the ecosystem.
 */
function parkedEco(...law: string[]): ScratchEcosystem & { tmp: string } {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-scope-'));
  const e = makeScratchEcosystem(tmp);
  writeFileSync(join(e.brain, '.multivac/invariants.md'), [...HEADER, ...law, ''].join('\n'));
  commitAll(e.brain, 'law');
  publishRepo(e.repos.api, tmp, 'acme-api');
  git(e.repos.api, 'checkout', '-q', '-b', 'wip/refactor');
  writeFileSync(join(e.repos.api, 'src/server.ts'), 'const SECRET_KEY = "oops";\n');
  commitAll(e.repos.api, 'wip');
  return { ...e, tmp };
}

async function captured(cwd: string, ...flags: string[]): Promise<{ code: number; out: string }> {
  const lines: string[] = [];
  const orig = { log: console.log, error: console.error };
  console.log = console.error = (...a: unknown[]) => {
    lines.push(a.map(String).join(' '));
  };
  try {
    const code = await verify.run(flags, { cwd });
    return { code, out: lines.join('\n') };
  } finally {
    console.log = orig.log;
    console.error = orig.error;
  }
}

const TOMBSTONE = [
  '| INV-S1 | the api never hardcodes a secret | published | active | 2026-01-01 | x |',
  '<!-- @anchor INV-S1 api:src/*.ts /SECRET_KEY/ absent -->',
];

test('a sibling parked on a WIP branch does not redden the brain: the channel is read', async () => {
  const e = parkedEco(...TOMBSTONE);
  const { code, out } = await captured(e.brain);
  assert.equal(code, 0);
  // Says WHICH bytes: the ref and its short sha, never a bare verdict.
  const sha = git(e.repos.api, 'rev-parse', '--short=7', 'origin/main');
  assert.match(out, new RegExp(`read\\s+api: origin/main @ ${sha} — the channel, as published`));
  // And the off-channel checkout is legible, not mysterious.
  assert.match(out, /parked on wip\/refactor @ [0-9a-f]{7}, not read/);
});

test('the same tree, verified from the consumer repo, is red — and names the branch', async () => {
  const e = parkedEco(...TOMBSTONE);
  execFileSync('git', ['clone', '-q', e.brain, join(e.repos.api, '.brain')], { stdio: 'ignore' });
  const { code, out } = await captured(e.repos.api);
  assert.equal(code, 1);
  assert.match(out, /read\s+api: working tree on wip\/refactor @ [0-9a-f]{7}/);
  assert.match(out, /the content about to be committed here/);
  assert.match(out, /broken.*INV-S1/);
});

test('--worktree reproduces the old whole-ecosystem working-tree behaviour', async () => {
  const e = parkedEco(...TOMBSTONE);
  const { code, out } = await captured(e.brain, '--worktree');
  assert.equal(code, 1);
  assert.match(out, /read\s+api: working tree on wip\/refactor @ [0-9a-f]{7} — --worktree/);
  assert.match(out, /OFF channel origin\/main @ [0-9a-f]{7}/);
  assert.match(out, /broken.*INV-S1/);
});

test('an unresolvable channel falls back to the working tree and says so', async () => {
  // web is never published: it has no origin at all.
  const e = parkedEco(
    '| INV-S2 | the web app is named | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-S2 web:src/*.ts /acme-web/ -->',
  );
  const { code, out } = await captured(e.brain);
  assert.equal(code, 0);
  assert.match(
    out,
    /read\s+web: working tree on main @ [0-9a-f]{7} — channel origin\/main does not resolve here .* FELL BACK to the working tree/,
  );
});

test('the brain repo itself is always read as a working tree — its law gates its own commit', async () => {
  const e = parkedEco(
    '| INV-S3 | the brain door exists | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-S3 brain:AGENTS.md /Start here/ -->',
  );
  // Uncommitted, unpublished edit in the brain: still judged, because this is
  // where the author is working.
  writeFileSync(join(e.brain, 'AGENTS.md'), '# acme brain\n\nStop here.\n');
  const { code, out } = await captured(e.brain, '--strict');
  assert.equal(code, 1);
  assert.match(out, /read\s+brain: working tree on main @ [0-9a-f]{7} — the brain's own repo/);
});

test('the channel read spans many files: an each leg reads every blob in one batch', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-scope-'));
  const e = makeScratchEcosystem(tmp);
  writeFileSync(
    join(e.brain, '.multivac/invariants.md'),
    [
      ...HEADER,
      '| INV-S4 | every api source carries the licence header | published | active | 2026-01-01 | x |',
      '<!-- @anchor INV-S4 api:src/**/*.ts /SPDX-License-Identifier/ each -->',
      '',
    ].join('\n'),
  );
  commitAll(e.brain, 'law');
  for (const n of ['a', 'b', 'c', 'd']) {
    writeFileSync(join(e.repos.api, `src/${n}.ts`), `// SPDX-License-Identifier: MIT\nexport const ${n} = 1;\n`);
  }
  writeFileSync(join(e.repos.api, 'src/server.ts'), '// SPDX-License-Identifier: MIT\nexport const port = 8080;\n');
  commitAll(e.repos.api, 'headers');
  publishRepo(e.repos.api, tmp, 'acme-api');
  // The working tree loses one header; the channel still has it.
  git(e.repos.api, 'checkout', '-q', '-b', 'wip/strip');
  writeFileSync(join(e.repos.api, 'src/c.ts'), 'export const c = 1;\n');
  commitAll(e.repos.api, 'strip');
  assert.equal((await captured(e.brain)).code, 0);
  const local = await captured(e.brain, '--worktree');
  assert.equal(local.code, 1);
  assert.match(local.out, /each: 1 of 5 files lack the pattern \(src\/c\.ts\)/);
});
