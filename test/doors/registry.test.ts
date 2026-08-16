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
import { basename, dirname, isAbsolute, join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { doorsCommand } from '../../src/commands/doors.js';
import {
  doorTargets,
  sddNames,
  sddSpec,
  type LifecyclePoint,
} from '../../src/adapters/registry.js';

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

test('every entry is one multivac can actually own', async () => {
  // There is no `unsupported` kind any more, and that is the point: a harness
  // whose door multivac cannot write does not get an entry at all. `aider` had
  // one, and it appeared among the supported everywhere the registry is
  // enumerated — in --provider's legal values, in the reference table, in the
  // count — carrying a note explaining that none of it applied. An unknown
  // name already gets the list of what IS supported, which is the useful
  // answer; naming a tool you do not support reads as support.
  for (const [name, t] of Object.entries(doorTargets)) {
    assert.ok(
      ['canonical', 'native', 'symlink', 'stub'].includes(t.kind),
      `${name}: ${t.kind} is not a kind doors knows how to write`,
    );
    assert.ok(t.source, `${name}: an entry without a vendor source is a guess`);
  }
  assert.ok(!('aider' in doorTargets));
});

// MV-73 puts a delete pass inside the directory an entry's `skill` names, so
// that path is no longer only where bytes are written — it is the directory
// emptied of everything the package does not ship. Two shapes are catastrophic
// and neither is far-fetched: `SKILL.md` (dirname `.`) mirrors the target's
// whole REPOSITORY, and `.claude/SKILL.md` (dirname `.claude`) mirrors away
// settings.json and every sibling skill `specify init` installed there. The
// rule that excludes both, and any other shared parent, is that the mirrored
// directory is named for the tool that owns it: nothing but multivac installs
// into a directory called `multivac`. No user can cause this — the registry is
// data this repo ships — so the day such an entry could exist is the day it is
// added, and this is the check that fails on it.
test("a skill path names multivac's own directory, never a shared one", () => {
  for (const [name, t] of Object.entries(doorTargets)) {
    if (!t.skill) continue;
    const projected = dirname(t.skill);
    assert.ok(!isAbsolute(t.skill), `${name}: skill path is absolute: ${t.skill}`);
    assert.ok(
      !t.skill.split('/').includes('..'),
      `${name}: skill climbs out of the target: ${t.skill}`,
    );
    assert.equal(
      basename(projected),
      'multivac',
      `${name}: doors would mirror ${projected}/ — a directory multivac does not own`,
    );
  }
});

test('every entry cites the vendor doc it was read from', () => {
  for (const [name, t] of Object.entries(doorTargets)) {
    assert.match(t.source, /^https:\/\//, `${name}: no primary source`);
    assert.ok(t.note.length > 0, `${name}: no note on what the harness reads`);
  }
});

/**
 * The SDD flow contract, read off the registry so a tool added tomorrow fails
 * this test on the day it is added. The load-bearing rule: a step either
 * declares the artifact that PROVES it, or declares in words why nothing can.
 * Silence is the one thing the data may not say.
 */
const ORDER: LifecyclePoint[] = ['new', 'plan', 'apply', 'land', 'close'];

test('every SDD step proves itself or says why it cannot', () => {
  assert.ok(sddNames.length > 0, 'the registry ships at least one SDD adapter');
  for (const name of sddNames) {
    const spec = sddSpec(name)!;
    const steps = spec.steps ?? [];
    assert.ok(steps.length > 0, `${name}: no flow declared`);
    let previous = -1;
    for (const s of steps) {
      assert.ok(s.run.length > 0, `${name}: a step with nothing to run`);
      // Exactly one of the two — never both, never neither.
      assert.equal(
        Boolean(s.artifact) !== Boolean(s.ungateable),
        true,
        `${name}/${s.run}: declare an artifact OR an ungateable reason, not both or neither`,
      );
      if (s.artifact) {
        assert.ok(s.gate, `${name}/${s.run}: an artifact with no gate gates nothing`);
        // A gate can only look for what an earlier point produced.
        assert.ok(
          ORDER.indexOf(s.gate!) > ORDER.indexOf(s.at),
          `${name}/${s.run}: gate ${s.gate} is not after ${s.at}`,
        );
      } else {
        assert.ok(!s.gate, `${name}/${s.run}: ungateable steps are never gated`);
        assert.ok(s.ungateable!.length > 20, `${name}/${s.run}: give the real reason`);
      }
      // The flow is ORDERED: a step never sits earlier than the one before it.
      const at = ORDER.indexOf(s.at);
      assert.ok(at >= previous, `${name}: step at ${s.at} comes after a later point`);
      previous = at;
    }
    for (const p of spec.projectSteps ?? []) {
      assert.ok(p.artifact.length > 0, `${name}: a project document with no path`);
      assert.ok(p.run.length > 0, `${name}: a project document nothing writes`);
      assert.ok(p.revisit.length > 0, `${name}: a project document with no revisit rule`);
    }
    assert.match(spec.source ?? '', /^https:\/\//, `${name}: no primary source`);
  }
});
