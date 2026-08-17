// MV-86. The brain records the version it was brought to; a binary that
// disagrees says so, on every command, and refuses nothing.
//
// The registry walk is borrowed from unknown-args.test.ts and is the point:
// the notice is emitted once from the dispatcher precisely so that no command
// can forget it, and only a test over the registry proves that for a command
// added later.
//
// Two assertions carry the design:
//   - no exit code moves with the notice present (FR-007). Nothing is refused
//     over a version, and a test that only checked the text would let a future
//     edit turn the notice into a gate without anyone noticing.
//   - no command but `init` and `doors --adopt` changes the record on disk
//     (FR-002). If bare `doors` restamped, the notice would vanish for anyone
//     who ran it for an unrelated reason — quiet, and looking resolved.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main } from '../../src/cli.js';
import { commands } from '../../src/commands/index.js';
import { versionNotice, PROJECTED_PATH } from '../../src/lib/version.js';

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

/** A brain that exists, with a record we control. */
function brainDir(record: string | null, requires?: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-skew-'));
  mkdirSync(join(dir, '.multivac'), { recursive: true });
  writeFileSync(
    join(dir, '.multivac', 'config.yml'),
    `doors: [agents]\nrepos:\n  brain: .\n${requires ? `requires: "${requires}"\n` : ''}`,
  );
  if (record !== null) writeFileSync(join(dir, PROJECTED_PATH), `version: ${record}\n`);
  return dir;
}

test('a stale record notices, and no exit code moves (MV-86)', async () => {
  const running = (
    JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }
  ).version;
  for (const c of commands) {
    // Two brains identical but for the record: one current, one stale. The
    // record is therefore the only thing that can explain a difference.
    const fresh = brainDir(running);
    const stale = brainDir('0.0.1');
    const a = await run([c.name, '--zzz'], stale);
    const b = await run([c.name, '--zzz'], fresh);
    assert.equal(a.code, b.code, `${c.name}: the notice moved the exit code`);
    assert.match(a.out, /brought to 0\.0\.1/, `${c.name} printed no notice on a stale brain`);
    rmSync(stale, { recursive: true, force: true });
    rmSync(fresh, { recursive: true, force: true });
  }
});

test('no command but init and doors --adopt touches the record (MV-86)', async () => {
  for (const c of commands) {
    if (c.name === 'init' || c.name === 'doors') continue;
    const dir = brainDir('0.0.1');
    const before = readFileSync(join(dir, PROJECTED_PATH), 'utf8');
    await run([c.name], dir).catch(() => undefined);
    assert.equal(
      readFileSync(join(dir, PROJECTED_PATH), 'utf8'),
      before,
      `${c.name} wrote the record; only init and doors --adopt may`,
    );
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an absent record is an absence, never version zero (MV-86)', () => {
  // Every brain in existence has no record. If that read as "very old", the
  // first run after upgrading would show the loudest notice to everybody.
  const n = versionNotice(brainDir(null), '0.3.0', 'doors: [agents]\n');
  assert.equal(n?.level, 'yellow', 'an absent record produced the severe notice');
  assert.match(n!.line, /no record/);
});

test('the floor outranks staleness, and a malformed one is refused (MV-86)', () => {
  const under = versionNotice(brainDir('0.0.1'), '0.3.0', 'requires: ">=99.0.0"\n');
  assert.equal(under?.level, 'red', 'below the floor is not the severe notice');
  assert.match(under!.line, /requires >=99\.0\.0/);

  // Silently ignoring a mistyped floor is MV-85's defect moved into a config
  // file: the reader believes a gate is declared that is not.
  const bad = versionNotice(brainDir(null), '0.3.0', 'requires: "^0.3"\n');
  assert.equal(bad?.level, 'red');
  assert.match(bad!.line, />=X\.Y\.Z/, 'the refusal does not name the accepted form');

  const ok = versionNotice(brainDir('0.3.0'), '0.3.0', 'requires: ">=0.1.0"\n');
  assert.equal(ok, null, 'a satisfied floor and a matching record should be silent');
});

test('the notice carries both versions and a command, always (MV-86)', () => {
  for (const n of [
    versionNotice(brainDir('0.0.1'), '0.3.0', 'doors: [agents]\n'),
    versionNotice(brainDir(null), '0.3.0', 'doors: [agents]\n'),
    versionNotice(brainDir(null), '0.3.0', 'requires: ">=9.0.0"\n'),
  ]) {
    assert.ok(n, 'expected a notice');
    assert.match(n!.line, /mvac (doors --adopt|i -g|: requires)|npm i -g/, `no action in: ${n!.line}`);
  }
});

test('a directory that is not a brain says nothing (MV-86)', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-skew-'));
  const { out } = await run(['help'], dir);
  assert.doesNotMatch(out, /brought to|no record/, 'noticed at a non-brain');
  assert.equal(existsSync(join(dir, PROJECTED_PATH)), false);
  rmSync(dir, { recursive: true, force: true });
});
