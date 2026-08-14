// MV-12: every registry entry round-trips through `doors` — written from the
// entry's kind, idempotent on a second run, and an unsupported entry refused
// with the reason the data carries. No entry is named here by hand: the loop
// reads the registry, so a new harness that breaks the contract fails this
// test on the day it is added.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  existsSync,
  lstatSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { doorsCommand } from '../../src/commands/doors.js';
import { doorTargets } from '../../src/adapters/registry.js';

const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-registry-')));
const names = Object.keys(doorTargets);

async function runDoors(): Promise<string[]> {
  const out: string[] = [];
  const orig = console.log;
  console.log = (line: string) => out.push(String(line));
  try {
    assert.equal(await doorsCommand.run([], { cwd: eco.brain }), 0);
    return out;
  } finally {
    console.log = orig;
  }
}

/** Every door file any entry could write, in both scopes. */
function snapshot(): Record<string, string> {
  const snap: Record<string, string> = {};
  for (const dir of [eco.brain, eco.repos.api]) {
    for (const t of Object.values(doorTargets)) {
      const p = join(dir, t.door);
      if (!existsSync(p)) continue;
      const st = lstatSync(p);
      snap[p] = st.isSymbolicLink() ? `-> ${readlinkSync(p)}` : readFileSync(p, 'utf8');
    }
  }
  return snap;
}

test('every declared target writes what its kind says, and only that', async () => {
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    `doors: [${names.join(', ')}]\nrepos:\n  api: ../acme-api\n`,
  );
  const out = await runDoors();
  assert.ok(!out.some((l) => l.includes('unknown door target')), out.join('\n'));

  for (const [name, t] of Object.entries(doorTargets)) {
    if (t.kind === 'unsupported') {
      assert.ok(!existsSync(join(eco.brain, t.door)), `${name}: wrote a door it cannot own`);
      continue;
    }
    const p = join(eco.brain, t.door);
    assert.ok(existsSync(p), `${name}: ${t.door} not written`);
    if (t.kind === 'symlink') {
      assert.ok(lstatSync(p).isSymbolicLink(), `${name}: ${t.door} is not a symlink`);
    } else {
      const text = readFileSync(p, 'utf8');
      assert.match(text, /multivac:begin/, `${name}: no managed block`);
      if (t.frontmatter) assert.ok(text.startsWith(t.frontmatter), `${name}: frontmatter first`);
      else assert.doesNotMatch(text, /^---\n/, `${name}: unasked-for frontmatter`);
    }
    // native targets read AGENTS.md itself — nothing else may appear for them
    if (t.kind === 'native') assert.equal(t.door, doorTargets.agents.door);
    if (t.skill) assert.ok(existsSync(join(eco.brain, t.skill)), `${name}: skill missing`);
    if (t.hookConfig) {
      assert.ok(existsSync(join(eco.brain, t.hookConfig.path)), `${name}: hook config missing`);
    }
  }
});

test('a second run is byte-identical — projection is idempotent', async () => {
  const once = snapshot();
  await runDoors();
  assert.deepEqual(snapshot(), once);
});

test('an unsupported entry is refused, and the notice carries its reason', async () => {
  const unsupported = Object.entries(doorTargets).filter(([, t]) => t.kind === 'unsupported');
  assert.ok(unsupported.length > 0, 'the registry records at least one honest gap');
  for (const [name, t] of unsupported) {
    assert.ok(t.reason, `${name}: unsupported without a reason`);
    writeFileSync(
      join(eco.brain, '.multivac/config.yml'),
      `doors: [agents, ${name}]\nrepos:\n  api: ../acme-api\n`,
    );
    const out = await runDoors();
    const notice = out.find((l) => l.includes(`${name}: no door written`));
    assert.ok(notice, `${name}: refused silently — ${out.join('\n')}`);
    assert.ok(notice.includes(t.reason!), `${name}: notice drops the reason`);
    assert.ok(!existsSync(join(eco.brain, t.door)), `${name}: wrote a door anyway`);
  }
});

test('every entry cites the vendor doc it was read from', () => {
  for (const [name, t] of Object.entries(doorTargets)) {
    assert.match(t.source, /^https:\/\//, `${name}: no primary source`);
    assert.ok(t.note.length > 0, `${name}: no note on what the harness reads`);
  }
});
