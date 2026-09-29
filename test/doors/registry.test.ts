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

/**
 * MV-146: a skeleton is served verbatim, so it keeps every heading the step
 * bodies fill by name and carries none of the tokens the init substitutes per
 * integration. Read off the registry, so a skeleton added to another SDD is
 * held to the same on the day it is added.
 */
test('every skeleton body keeps each heading it names and none of its tokens', () => {
  let seen = 0;
  for (const name of sddNames) {
    const sk = sddSpec(name)!.scaffold?.skeleton;
    if (!sk) continue;
    seen++;
    assert.deepEqual(
      Object.keys(sk.keeps).sort(),
      Object.keys(sk.files).sort(),
      `${name}: a body with no kept headings, or headings with no body`,
    );
    assert.match(sk.floor, /^\d+\.\d+\.\d+$/, `${name}: the floor is a version`);
    assert.match(sk.measured, / \d+\.\d+\.\d+$/, `${name}: the version measured is named`);
    assert.ok(sk.tokens.length > 0, `${name}: the substituted tokens are named`);
    for (const [file, body] of Object.entries(sk.files)) {
      const lines = body.split('\n');
      for (const h of sk.keeps[file]) assert.ok(lines.includes(`## ${h}`), `${name}/${file}: lost "## ${h}"`);
      for (const t of sk.tokens) assert.ok(!body.includes(t), `${name}/${file}: carries ${t}`);
    }
  }
  assert.ok(seen > 0, 'speckit records a skeleton');
});

/**
 * MV-146's budget: `/speckit.specify`, `/speckit.plan` and `/speckit.tasks`
 * read 18,004 bytes of template per change; with the skeletons in place the
 * three bodies they resolve first stay within 4,300.
 */
test('the skeleton bodies stay within the template budget they were measured at', () => {
  const sk = sddSpec('speckit')!.scaffold!.skeleton!;
  const total = Object.values(sk.files).reduce((n, b) => n + Buffer.byteLength(b), 0);
  assert.equal(Object.keys(sk.files).length, 3);
  assert.ok(total <= 4300, `${total} bytes of skeleton`);
});

test('this brain carries the skeleton byte for byte where spec-kit resolves first', () => {
  const sk = sddSpec('speckit')!.scaffold!.skeleton!;
  const repoRoot = join(import.meta.dirname, '../../..');
  for (const [file, body] of Object.entries(sk.files)) {
    assert.equal(readFileSync(join(repoRoot, sk.dir, file), 'utf8'), body, `${sk.dir}/${file}`);
  }
});

/**
 * MV-146: spec-kit calls the report scratch to remove before commit from
 * 1.0.6 on, and git keeps the amendment record, so the revisit says to commit
 * none. No retired wording is spelled here; `prepend` is simply absent.
 */
test('the speckit revisit says to commit no Sync Impact Report', () => {
  const revisit = sddSpec('speckit')!.projectSteps![0].revisit;
  assert.match(revisit, /; commit no Sync Impact Report\./);
  assert.doesNotMatch(revisit, /prepend/i);
});

/**
 * MV-147: opsx's scaffold installs no door's integration, and its map stays as
 * the record of what `openspec init --tools <key>` writes — the code gate reads
 * those directories as not code (MV-144) in a brain an earlier init left them in.
 */
test('a scaffold with no placeholder still records every integration\'s dirs', () => {
  const sc = sddSpec('opsx')!.scaffold!;
  assert.doesNotMatch(sc.run, /\{keys?\}/);
  const keys = Object.keys(sc.integrations);
  assert.ok(keys.length > 0, 'opsx keeps its integration record');
  for (const door of keys) {
    const dirs = sc.integrations[door].dirs;
    assert.ok(dirs.length > 0 && dirs.every((d) => d.length > 0), `${door}: no directory recorded`);
  }
});

/**
 * MV-147. `--yes`, `--skip-specs` and `--no-validate` answer a question the
 * tool asks the human — whether to merge, whether to skip its own validation.
 * A run is what the agent executes, so no run in any entry carries one; a
 * guide may name them only as the human's answer, or after `never`.
 */
const TOOL_ANSWER = /--(yes|skip-specs|no-validate)\b/;

/** Each clause of `guide` naming such a flag with neither `never` before it nor a human's answer leading it. */
const flaggedClauses = (guide: string): string[] =>
  [...guide.matchAll(new RegExp(TOOL_ANSWER.source, 'g'))]
    .map((m) => guide.slice(0, m.index).split(/[;.]\s|—\s/).pop()!)
    .filter((clause) => !/\bnever\b/.test(clause) && !/^\s*(yes|archive without merging): /.test(clause));

test("no SDD step's run carries a flag that answers the tool's own question", () => {
  // The check itself: a guide telling the agent to pass the flag is caught.
  assert.deepEqual(flaggedClauses('then run `openspec archive <slug> --json --yes` to finish'), [
    'then run `openspec archive <slug> --json ',
  ]);
  assert.deepEqual(flaggedClauses('re-run with no flag, never `--no-validate`'), []);
  let guided = 0;
  for (const name of sddNames) {
    for (const step of sddSpec(name)!.steps ?? []) {
      assert.doesNotMatch(step.run, TOOL_ANSWER, `${name} ${step.at}: ${step.run}`);
      if (!step.guide) continue;
      assert.deepEqual(flaggedClauses(step.guide), [], `${name} ${step.at}: ${step.guide}`);
      if (TOOL_ANSWER.test(step.guide)) guided++;
    }
  }
  // The land guide names all three, as the human's answers or after `never`.
  const land = sddSpec('opsx')!.steps!.find((s) => s.at === 'land')!;
  for (const flag of ['--yes', '--skip-specs', '--no-validate']) assert.ok(land.guide!.includes(flag), flag);
  assert.ok(guided > 0, 'at least one guide names a flag, so the clause check ran');
});

/**
 * MV-147. With the command bodies gone, the printed lines are the only carrier
 * of the questions openspec 1.13.2's bodies gave the human — MV-95's
 * run-the-chain line would otherwise have the agent answer them. The runs name
 * the human's question on every surface that prints them (the door included,
 * where the guides never go); the guides carry the rest, each keyed on what the
 * tool itself prints. Whether the agent asked is ungateable; the words are not.
 */
test("opsx's lines carry the questions its command bodies asked", () => {
  const steps = sddSpec('opsx')!.steps!;
  const at = (p: LifecyclePoint) => steps.find((s) => s.at === p)!;
  const has = (text: string | undefined, want: string[], where: string): void => {
    assert.ok(text, `${where} is missing`);
    for (const w of want) assert.ok(text.includes(w), `${where} does not name ${w}:\n${text}`);
  };
  // The runs: the human's question on the three steps whose bodies asked one.
  for (const p of ['new', 'apply', 'land'] as const) has(at(p).run, ["the human's question"], `${p} run`);
  has(at('apply').run, ['tick `- [x]` only what is fully built', 'until its `state` is `all_done`'], 'apply run');
  has(at('land').run, ['a flag its `fix` names is never yours'], 'land run');
  // The guides, one per point.
  has(
    at('new').guide,
    ['`already exists`', 'resolvedOutputPath', 'observable behaviour', 'root.source', 'any conflict with a main spec', "`unknown option '--json'`"],
    'new guide',
  );
  has(at('plan').guide, ['`[-]`', '`Next:`', 'openspec instructions tasks --change <slug> --json'], 'plan guide');
  has(
    at('apply').guide,
    ['an unclear task', 'a design issue', 'work beyond the spec and tasks', 'narrow, defer or drop', 'a blocker', 'never absorbed silently', '"ready to be archived"'],
    'apply guide',
  );
  has(
    at('land').guide,
    [
      '`archive_confirmation_required` saying `Updating`',
      'openspec show <slug> --json --deltas-only',
      '--skip-specs',
      'anything else: stop',
      'never `--no-validate`',
      '`archive_tasks_incomplete`',
      'never tick to pass',
      "`unknown option '--json'`",
    ],
    'land guide',
  );
  // The vendor's slash spelling is its bodies' surface, which no printed line may send the agent to.
  for (const s of steps) {
    assert.doesNotMatch(s.run, /opsx[:]/, `${s.at} run`);
    if (s.guide) assert.doesNotMatch(s.guide, /opsx[:]/, `${s.at} guide`);
  }
});

/**
 * MV-147. A slug grammar is the tool's own, measured on a named version: its
 * pattern accepts what the tool's create step accepted and refuses what it
 * refused, and a reserved name is one the pattern alone would let through —
 * otherwise listing it says nothing the pattern does not.
 */
test("a recorded slug grammar is the tool's own, measured", () => {
  for (const name of sddNames) {
    const slug = sddSpec(name)!.slug;
    if (!slug) continue;
    const re = new RegExp(slug.pattern);
    for (const r of slug.reserved) assert.ok(re.test(r), `${name}: reserved \`${r}\` is one the pattern already refuses`);
    assert.ok(slug.why.length > 0, `${name}: a refusal with no reason`);
  }
  // openspec 1.13.2's `new change`, measured name by name.
  const opsx = sddSpec('opsx')!.slug!;
  const re = new RegExp(opsx.pattern);
  for (const ok of ['ab-c', '1ab', 'a1', 'x']) assert.ok(re.test(ok), `opsx refuses ${ok}`);
  for (const no of ['Fix_Auth', 'a.b', 'a_b', 'a--b', 'Ab', 'a-b-', '-ab']) assert.ok(!re.test(no), `opsx accepts ${no}`);
  assert.deepEqual(opsx.reserved, ['archive']);
  // spec-kit's feature directory takes any short name the lifecycle takes.
  assert.equal(sddSpec('speckit')!.slug, undefined);
});
