// MV-118. A config that will not load is an environment error, not a failed
// check, so every command that reads one exits 2 — `doors` and `doctor`
// excepted, because for them an unloadable config IS the diagnosis.
//
// The measurement that opened this: the rule is in the reference and was kept
// by two commands out of five. `verify` 2 and `count` 2, because they catch it
// themselves; `seed` 1, `repos` 1, `repos sync` 1 and `roadmap sync` 1,
// because they let it out and every rejection was mapped to 1. A script could
// not tell a broken environment from a gate that refused.
//
// Bare `roadmap` is absent on purpose: it does not read the config at all, so
// it has nothing to say about one, and an exit code about a file nobody opened
// would be the same lie in the other direction.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main } from '../../src/cli.js';
import { gitInit } from '../helpers/fixture.js';

function brokenBrain(): string {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-exit-'));
  gitInit(dir);
  mkdirSync(join(dir, '.multivac'), { recursive: true });
  writeFileSync(join(dir, '.multivac/config.yml'), 'repos: [not a map\n');
  return dir;
}

async function run(argv: string[], cwd: string): Promise<number> {
  const log = console.log;
  const err = console.error;
  console.log = () => {};
  console.error = () => {};
  try {
    return await main(argv, cwd);
  } finally {
    console.log = log;
    console.error = err;
  }
}

test('a config that will not load is exit 2 wherever it is read', async () => {
  const dir = brokenBrain();
  for (const argv of [['verify'], ['count'], ['seed'], ['repos'], ['repos', 'sync'], ['roadmap', 'sync']]) {
    assert.equal(await run(argv, dir), 2, `${argv.join(' ')} must exit 2 on an unloadable config`);
  }
});

test('doors and doctor are the two documented exceptions and stay exit 1', async () => {
  const dir = brokenBrain();
  for (const argv of [['doors'], ['doctor']]) {
    assert.equal(await run(argv, dir), 1, `${argv.join(' ')} diagnoses the config it cannot load`);
  }
});
