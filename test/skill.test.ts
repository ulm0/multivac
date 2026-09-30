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
  grapherAuto: true,
  graphers: {},
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
const MYGRAPH = { mygraph: { artifact: 'out/g.json', refresh: 'mygraph build' } };

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
    name: 'spec-kit + graphify, the brain holds code',
    door: renderBrainDoor({ ...BASE, sdd: 'speckit', grapher: 'graphify', repos: { brain: BRAIN, web: WEB } }, 1),
    marker: 'It is also the code it governs',
  },
  {
    name: 'openspec + codegraph, the brain holds code',
    door: renderBrainDoor({ ...BASE, sdd: 'opsx', grapher: 'codegraph', repos: { brain: BRAIN, web: WEB } }, 1),
    marker: '`codegraph callers <symbol>`',
  },
  {
    name: 'no adapter',
    door: renderBrainDoor({ ...BASE, repos: { brain: BRAIN, web: WEB } }, 1),
    marker: 'as plain node-link JSON',
    lacks: '[proof:',
  },
  {
    name: 'code-less, spec-kit + graphify over two code repos',
    door: renderBrainDoor({ ...BASE, sdd: 'speckit', grapher: 'graphify', repos: { web: WEB, api: API } }, 1),
    marker: 'This brain holds no code, so it keeps no code graph',
  },
  {
    name: 'spec-kit under sdd_auto: false',
    door: renderBrainDoor({ ...BASE, sdd: 'speckit', sddAuto: false, repos: { brain: BRAIN, web: WEB } }, 1),
    marker: '`sdd_auto: false` — nothing is printed and nothing is gated',
    lacks: 'REFUSES',
  },
  {
    name: 'a grapher declared under graphers:, the brain holds code',
    door: renderBrainDoor({ ...BASE, grapher: 'mygraph', graphers: MYGRAPH, repos: { brain: BRAIN, web: WEB } }, 1),
    marker: '`mygraph` has NO query command',
  },
  {
    name: 'an empty brain',
    door: renderBrainDoor({ ...BASE, sdd: 'speckit', grapher: 'graphify', repos: { brain: BRAIN } }, 0),
    marker: 'brain empty — load the multivac skill to fill it.',
  },
  {
    name: 'code-less, graphers per repo only',
    door: renderBrainDoor(
      { ...BASE, sdd: 'speckit', repos: { web: { ...WEB, grapher: 'codegraph' }, api: { ...API, grapher: 'graphify' } } },
      1,
    ),
    marker: '`codegraph query <symbol> -p <checkout>`',
  },
  {
    name: 'code-less, mixed graphers',
    door: renderBrainDoor(
      { ...BASE, sdd: 'speckit', grapher: 'graphify', repos: { web: { ...WEB, grapher: 'codegraph' }, api: API } },
      1,
    ),
    marker: '--graph <checkout>/graphify-out/graph.json',
  },
  {
    name: 'consumer: one code repo under spec-kit',
    door: renderConsumerDoor({ ...BASE, sdd: 'speckit', repos: { web: WEB } }, 'web'),
    marker: "The brain's `speckit` SDD runs in the brain checkout",
  },
  {
    name: 'consumer: two code repos under spec-kit + graphify',
    door: renderConsumerDoor({ ...BASE, sdd: 'speckit', grapher: 'graphify', repos: { web: WEB, api: API } }, 'web'),
    marker: 'A code graph is kept fresh for you by `graphify`',
  },
  {
    name: 'consumer: sdd_auto: false',
    door: renderConsumerDoor({ ...BASE, sdd: 'speckit', sddAuto: false, repos: { web: WEB, api: API } }, 'api'),
    marker: 'its brain is mounted at',
    lacks: 'SDD runs in the brain checkout',
  },
  {
    name: 'consumer: codegraph declared per repo',
    door: renderConsumerDoor({ ...BASE, repos: { web: { ...WEB, grapher: 'codegraph' } } }, 'web'),
    marker: '`codegraph callers <symbol>`',
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
  // Nine brain shapes and four consumer shapes: fewer is a fixture lost.
  assert.ok(DOOR_FIXTURES.length >= 13, `expected at least 13 doors, found ${DOOR_FIXTURES.length}`);
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
