// The skill pack is data the tool ships; these tests keep it honest:
// files present, frontmatter valid, zero reference-ecosystem content, and
// every example anchor line parseable in the tool's own grammar + dialect.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { compileAnchorRegex } from '../src/lib/regex.js';

// compiled to dist-test/test/, so repo root is two levels up
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SKILL_DIR = join(ROOT, 'skills', 'multivac');

const FILES = [
  'SKILL.md',
  'references/discovery.md',
  'references/interview.md',
  'references/anchors.md',
  'references/change.md',
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
// must parse and their regexes must compile in the tool's own dialect —
// a skill teaching \s or an unparseable line would teach users to write
// anchors verify rejects.
const ANCHOR_LINE =
  /<!-- @anchor (\S+) (\S+):(\S+)((?: !\S+)*) \/(.+)\/(i?)(?: (present|absent|unique|count=\d+|each!?))? -->/;

test('every example anchor line parses and compiles in the tool dialect', () => {
  let found = 0;
  for (const { rel, text } of packContents) {
    for (const line of text.split('\n')) {
      if (!line.includes('@anchor') || line.includes('<CLAIM-ID>')) continue;
      const m = ANCHOR_LINE.exec(line);
      assert.ok(m, `${rel}: unparseable anchor example: ${line.trim()}`);
      found++;
      const [, claimId, repoKey, , , source, flags] = m;
      assert.match(claimId, /^[A-Z]+-\d+$/, `${rel}: odd claim id ${claimId}`);
      assert.ok(repoKey === '*' || /^[a-z][a-z0-9_-]*$/.test(repoKey));
      // throws RegexDialectError on \s \b \d \w, bad classes, bad flags
      compileAnchorRegex(source, flags);
    }
  }
  assert.ok(found >= 6, `expected at least 6 example anchors, found ${found}`);
});
