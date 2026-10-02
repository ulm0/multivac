// The skill pack is data the tool ships; these tests keep it honest:
// files present, frontmatter valid, zero reference-ecosystem content, and
// every example anchor line parseable in the tool's own grammar + dialect.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parseAnchors } from '../src/anchor/parse.js';
import { renderBrainDoor } from '../src/doors/brain.js';
import { renderConsumerDoor } from '../src/doors/consumer.js';
import { LEFTOVER_VENDORS, type LeftoverVendor } from '../src/lib/dropped.js';
import type { Config } from '../src/types.js';

// compiled to dist-test/test/, so repo root is two levels up
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SKILL_DIR = join(ROOT, 'skills', 'multivac');

const FILES = [
  'SKILL.md',
  'references/discovery.md',
  'references/interview.md',
  'references/anchors.md',
  'references/change.md',
  'references/verify.md',
];

const packContents = FILES.map((rel) => ({
  rel,
  text: readFileSync(join(SKILL_DIR, rel), 'utf8'),
}));

test('all skill pack files exist and are non-trivial', () => {
  for (const { rel, text } of packContents) {
    assert.ok(text.length > 500, `${rel} is suspiciously short`);
  }
});

test('SKILL.md frontmatter: name multivac, description carries triggers', () => {
  const skill = packContents[0].text;
  const fm = /^---\n([\s\S]*?)\n---/.exec(skill);
  assert.ok(fm, 'SKILL.md must start with YAML frontmatter');
  assert.match(fm[1], /^name: multivac$/m);
  const desc = /^description: (.+)$/m.exec(fm[1]);
  assert.ok(desc, 'frontmatter must have a description');
  for (const trigger of ['empty', 'seed', 'anchor', 'change', 'retir']) {
    assert.ok(
      desc[1].toLowerCase().includes(trigger),
      `description must trigger on "${trigger}"`,
    );
  }
});

test('SKILL.md points at every reference file', () => {
  const skill = packContents[0].text;
  for (const rel of FILES.slice(1)) {
    assert.ok(skill.includes(rel.replace('references/', '')), `SKILL.md must mention ${rel}`);
  }
});

test('zero reference-ecosystem content anywhere in the pack', () => {
  for (const { rel, text } of packContents) {
    assert.doesNotMatch(text, /kaf+ee/i, `${rel} leaks reference-ecosystem content`);
  }
});

// Real example anchors (grammar-template lines with <placeholders> excluded)
// must parse in the tool's OWN parser — no shadow copy of the grammar here:
// parseAnchors compiles the regex too, so a skill teaching \s or an
// unparseable line fails through the same code path verify uses. Lines are
// fed one at a time because the examples sit inside ``` fences, which the
// parser rightly skips in full documents.
test('every example anchor line parses and compiles in the tool dialect', () => {
  let found = 0;
  for (const { rel, text } of packContents) {
    for (const line of text.split('\n')) {
      if (!line.includes('@anchor') || line.includes('<CLAIM-ID>')) continue;
      const { anchors, diagnostics } = parseAnchors(line.trim(), rel);
      assert.equal(
        diagnostics.length,
        0,
        `${rel}: anchor example rejected by the parser: ${line.trim()} — ${diagnostics[0]?.message}`,
      );
      assert.equal(anchors.length, 1, `${rel}: not an anchor line: ${line.trim()}`);
      found++;
      const a = anchors[0];
      assert.match(a.claimId, /^[A-Z]+-\d+$/, `${rel}: odd claim id ${a.claimId}`);
      assert.ok(a.repoKey === '*' || /^[a-z][a-z0-9_-]*$/.test(a.repoKey));
    }
  }
  assert.ok(found >= 6, `expected at least 6 example anchors, found ${found}`);
});

// MV-152. The door is loaded in every session and the lifecycle prints its own
// lines, so a clause the pack repeats is paid twice and drifts once. The doors
// are rendered here by the real renderers from literal configs — `isBrain` is
// set by hand because only loadConfig derives it, and a config without it
// renders a brain that holds no code — and each fixture proves its shape by a
// marker its door must carry. Clauses are the door's lines split on ` — `,
// `; ` and `. `, whitespace-normalised, thirty characters or more; the pack is
// every .md under the skill directory, normalised the same way. A paraphrase
// passes: this catches the verbatim copy a door edit leaves behind.
const norm = (text: string): string => text.replace(/\s+/g, ' ');

const BASE: Config = {
  doors: ['agents', 'claude'],
  sddAuto: true,
  dropped: [],
  authorities: [],
  blocking: ['absent', 'count', 'each'],
  staleness: 'report',
  strictPrePush: false,
  mount: '.brain',
  repos: {},
};
const BRAIN = { path: '.', isBrain: true };
const WEB = { path: '../web', url: 'git@x:web.git' };
const API = { path: '../api', url: 'git@x:api.git' };
// MV-153: what a caller's probe finds of an earlier install beside a door.
const GRAPHIFY = LEFTOVER_VENDORS.find((v) => v.name === 'graphify')!;
const LEFT_HOOKED: LeftoverVendor = { vendor: GRAPHIFY, dir: 'graphify-out', dirTracked: true, platforms: ['agents', 'claude'], gitignore: [], tracked: true };
const LEFT_RULE: LeftoverVendor = { vendor: GRAPHIFY, dirTracked: false, platforms: ['cursor'], gitignore: [], tracked: false };
interface DoorFixture {
  name: string;
  door: string;
  /** A substring the door must carry: the fixture renders the shape it names. */
  marker: string;
  /** A substring the door must not carry, where the shape is an absence. */
  lacks?: string;
}

const DOOR_FIXTURES: DoorFixture[] = [
  {
    name: 'spec-kit, the brain holds code',
    door: renderBrainDoor({ ...BASE, sdd: 'speckit', repos: { brain: BRAIN, web: WEB } }, 1),
    marker: 'It is also the code it governs',
  },
  {
    name: 'openspec, the brain holds code',
    door: renderBrainDoor({ ...BASE, sdd: 'opsx', repos: { brain: BRAIN, web: WEB } }, 1),
    marker: 'Features gate through the `opsx` SDD',
  },
  {
    name: 'no adapter',
    door: renderBrainDoor({ ...BASE, repos: { brain: BRAIN, web: WEB } }, 1),
    marker: 'Check the law against the code before acting',
    lacks: '[proof:',
  },
  {
    name: 'code-less, spec-kit over two code repos',
    door: renderBrainDoor({ ...BASE, sdd: 'speckit', repos: { web: WEB, api: API } }, 1),
    marker: '- api: ../api',
    lacks: 'It is also the code it governs',
  },
  {
    name: 'spec-kit under sdd_auto: false',
    door: renderBrainDoor({ ...BASE, sdd: 'speckit', sddAuto: false, repos: { brain: BRAIN, web: WEB } }, 1),
    marker: '`sdd_auto: false` — nothing is printed and nothing is gated',
    lacks: 'REFUSES',
  },
  {
    name: 'an empty brain',
    door: renderBrainDoor({ ...BASE, sdd: 'speckit', repos: { brain: BRAIN } }, 0),
    marker: 'brain empty — load the multivac skill to fill it.',
  },
  {
    name: "a vendor's skills and hooks left beside the door, the brain holds code",
    door: renderBrainDoor({ ...BASE, sdd: 'speckit', repos: { brain: BRAIN, web: WEB } }, 1, [LEFT_HOOKED]),
    marker: "graphify's own skills and hooks here still send you to `graphify-out/`",
  },
  {
    name: 'consumer: one code repo under spec-kit',
    door: renderConsumerDoor({ ...BASE, sdd: 'speckit', repos: { web: WEB } }, 'web'),
    marker: "The brain's `speckit` SDD runs in the brain checkout",
  },
  {
    name: 'consumer: two code repos under spec-kit',
    door: renderConsumerDoor({ ...BASE, sdd: 'speckit', repos: { web: WEB, api: API } }, 'web'),
    marker: 'Repos in this ecosystem — these keys are what anchors and change files name',
  },
  {
    name: 'consumer: sdd_auto: false',
    door: renderConsumerDoor({ ...BASE, sdd: 'speckit', sddAuto: false, repos: { web: WEB, api: API } }, 'api'),
    marker: 'its brain is mounted at',
    lacks: 'SDD runs in the brain checkout',
  },
  {
    name: "consumer: a vendor's skill left beside the door",
    door: renderConsumerDoor({ ...BASE, sdd: 'speckit', repos: { web: WEB } }, 'web', [LEFT_RULE]),
    marker: "graphify's own skill here still sends you to a graph that is not here",
  },
];

function doorClauses(door: string): string[] {
  const out = new Set<string>();
  for (const line of door.split('\n')) {
    for (const part of norm(line.trim().replace(/^-\s*/, '')).split(/ — |; |\. /)) {
      const clause = part.trim();
      if (clause.length >= 30) out.add(clause);
    }
  }
  return [...out];
}

function packFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => join(e.parentPath, e.name));
}

test('the pack restates no clause a door renders — MV-152', () => {
  const pack = norm(packFiles(SKILL_DIR).map((f) => readFileSync(f, 'utf8')).join(' '));
  // Seven brain shapes and four consumer shapes: fewer is a fixture lost.
  assert.ok(DOOR_FIXTURES.length >= 11, `expected at least 11 doors, found ${DOOR_FIXTURES.length}`);
  const problems: string[] = [];
  for (const f of DOOR_FIXTURES) {
    if (!f.door.includes(f.marker)) {
      problems.push(`${f.name}: the door does not carry "${f.marker}" — the fixture does not render the shape it names`);
    }
    if (f.lacks !== undefined && f.door.includes(f.lacks)) {
      problems.push(`${f.name}: the door carries "${f.lacks}" — the fixture does not render the shape it names`);
    }
    for (const clause of doorClauses(f.door)) {
      if (pack.includes(clause)) problems.push(`${f.name}: ${clause}`);
    }
  }
  assert.deepEqual(problems, []);
});
