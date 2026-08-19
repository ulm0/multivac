// MV-108. Presence is not identity.
//
// Four places decided "is this mine?" by presence: a stub door overwrote
// whatever file it found, the hook shim executed any dist/cli.js, "runs
// multivac" was a substring of a hook's whole text, and our own shim was never
// rewritten because it merely mentioned the word.
//
// Two of these are asserted by EFFECT rather than by report, on purpose: the
// defects being fixed are the tool reporting that it checked, so a test that
// asserted the report would reproduce the mistake it is pinning.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { init } from '../../src/commands/init.js';
import { doorsCommand } from '../../src/commands/doors.js';
import { isOurShim, runsMultivac } from '../../src/hooks/install.js';
import { applyManagedBlock } from '../../src/doors/block.js';
import { gitInit } from '../helpers/fixture.js';

const tmp = (): string => mkdtempSync(join(tmpdir(), 'mvac-identity-'));

const quiet = async (fn: () => Promise<number>): Promise<number> => {
  const log = console.log;
  const err = console.error;
  console.log = () => {};
  console.error = () => {};
  try {
    return await fn();
  } finally {
    console.log = log;
    console.error = err;
  }
};

test('operator content in a stub door survives every doors run', async () => {
  const dir = tmp();
  gitInit(dir);
  assert.equal(await quiet(() => init.run(['--provider', 'copilot', '--quiet', dir], { cwd: dir })), 0);

  const stub = join(dir, '.github/copilot-instructions.md');
  mkdirSync(join(dir, '.github'), { recursive: true });
  writeFileSync(stub, 'my own guidance\nsecond line\n');

  await quiet(() => doorsCommand.run([], { cwd: dir }));
  let text = readFileSync(stub, 'utf8');
  assert.match(text, /my own guidance/, 'the operator content was overwritten');
  assert.match(text, /multivac:begin/, 'the managed block was not added');

  await quiet(() => doorsCommand.run([], { cwd: dir }));
  text = readFileSync(stub, 'utf8');
  assert.match(text, /my own guidance/, 'a second run overwrote it');
  assert.equal(text.match(/multivac:begin/g)?.length, 1, 'the block was duplicated');
});

test('a foreign dist/cli.js is never executed as multivac', async () => {
  // The repo builds a CLI — the most ordinary Node layout there is — and its
  // binary would leave a file behind if the hook ran it.
  const dir = tmp();
  gitInit(dir);
  assert.equal(await quiet(() => init.run(['--quiet', dir], { cwd: dir })), 0);
  mkdirSync(join(dir, 'dist'), { recursive: true });
  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  writeFileSync(join(dir, 'dist/cli.js'), 'require("fs").writeFileSync("EXECUTED","");\n');
  writeFileSync(join(dir, 'package.json'), '{"name":"someone-elses-cli","version":"1.0.0"}\n');

  execFileSync('git', ['-C', dir, 'add', '-A']);
  execFileSync('git', ['-C', dir, 'commit', '-qm', 'x'], {
    env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' },
  });

  assert.equal(existsSync(join(dir, 'EXECUTED')), false, "the repo's own CLI was run as multivac");
});

test('the shim asks whether the repo IS multivac before preferring its build', async () => {
  const dir = tmp();
  gitInit(dir);
  await quiet(() => init.run(['--quiet', dir], { cwd: dir }));
  const shim = readFileSync(join(dir, '.multivac/hooks/pre-commit'), 'utf8');
  assert.match(shim, /grep -q .*multivac.*package\.json/, 'the rung has no identity test');
});

test('a hook that only mentions multivac in a comment does not run it', () => {
  assert.equal(runsMultivac('#!/bin/sh\n# TODO: wire up multivac\n'), false);
  assert.equal(runsMultivac('#!/bin/sh\n   # multivac later\n'), false);
  assert.equal(runsMultivac('#!/bin/sh\nmvac verify || exit 1\n'), true);
  assert.equal(runsMultivac('#!/bin/sh\nnpx multivac verify\n'), true);
});

test('our own shim is identifiable, and somebody else\'s is not', () => {
  assert.equal(isOurShim('#!/bin/sh\n# multivac hook shim — managed by `multivac doors`; regenerate, do not edit.\n'), true);
  assert.equal(isOurShim('#!/bin/sh\nmvac verify || exit 1\n'), false);
});

test('a malformed managed block names the file it is in', () => {
  assert.throws(
    () => applyManagedBlock('<!-- multivac:begin -->\nno end marker\n', 'body', '/repo/AGENTS.md'),
    /\/repo\/AGENTS\.md: managed block is malformed/,
  );
});

test('an existing shim of ours is regenerated, so a declared gate reaches it', async () => {
  // The husky case: the shim is already installed, `strict_pre_push` is turned
  // on later, and nothing changes because "mentions multivac" made our own
  // shim look foreign. A declared gate that never arms is worse than none.
  const dir = tmp();
  gitInit(dir);
  await quiet(() => init.run(['--quiet', dir], { cwd: dir })), 0;
  const cfg = join(dir, '.multivac/config.yml');
  writeFileSync(cfg, `${readFileSync(cfg, 'utf8')}\nstrict_pre_push: true\n`);

  await quiet(() => doorsCommand.run([], { cwd: dir }));

  const prePush = readFileSync(join(dir, '.multivac/hooks/pre-push'), 'utf8');
  assert.match(prePush, /verify --strict/, 'strict_pre_push never reached the installed shim');
  assert.ok(isOurShim(prePush), 'the regenerated shim lost its ownership header');
});

test('init run twice leaves the strictness and the record where doors put them', async () => {
  const dir = tmp();
  gitInit(dir);
  await quiet(() => init.run(['--quiet', dir], { cwd: dir }));
  const cfg = join(dir, '.multivac/config.yml');
  writeFileSync(cfg, `${readFileSync(cfg, 'utf8')}\nstrict_pre_push: true\n`);
  await quiet(() => doorsCommand.run([], { cwd: dir }));

  const record = readFileSync(join(dir, '.multivac/projected.yml'), 'utf8');
  const prePush = readFileSync(join(dir, '.multivac/hooks/pre-push'), 'utf8');

  await quiet(() => init.run(['--quiet', dir], { cwd: dir }));

  assert.equal(
    readFileSync(join(dir, '.multivac/hooks/pre-push'), 'utf8'),
    prePush,
    'init downgraded the strict pre-push shim doors installed',
  );
  assert.equal(
    readFileSync(join(dir, '.multivac/projected.yml'), 'utf8'),
    record,
    'init restamped the version record without an act of adoption (MV-86)',
  );
});
