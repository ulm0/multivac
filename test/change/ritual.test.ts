// The ritual: the team's half of the closing ceremony. `change close` prints
// it and nothing else — it never parses it, never gates on it.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { init } from '../../src/commands/init.js';
import { ritualChecklist } from '../../src/lib/ritual.js';
import { saveChange, scaffoldChange } from '../../src/change/file.js';

const tmp = (p: string): string => mkdtempSync(join(tmpdir(), p));

/** Run fn with console.log captured; returns the exit code and the lines. */
async function capture(
  fn: () => Promise<number>,
): Promise<{ rc: number; out: string }> {
  const real = console.log;
  const lines: string[] = [];
  console.log = (l: unknown): void => void lines.push(String(l));
  try {
    return { rc: await fn(), out: lines.join('\n') };
  } finally {
    console.log = real;
  }
}

/** A change on one repo, already landed and claiming nothing: close is free. */
async function landedChange(brain: string, slug: string): Promise<void> {
  const parsed = scaffoldChange(slug, slug);
  parsed.change.repos = { api: { status: 'landed' } };
  await saveChange(brain, parsed);
}

test('the scaffolded ritual is empty, and an empty ritual prints nothing', async () => {
  const dir = tmp('mvac-ritual-init-');
  assert.equal(await init.run([], { cwd: dir }), 0);
  // init wrote the file with its one what-belongs-here comment...
  assert.match(readFileSync(join(dir, '.multivac/ritual.md'), 'utf8'), /who reviews what/);
  // ...and a heading plus a comment is nothing to walk
  assert.deepEqual(await ritualChecklist(dir), []);
});

test('an absent ritual is not an error: no file, no lines', async () => {
  assert.deepEqual(await ritualChecklist(tmp('mvac-ritual-none-')), []);
});

test('close prints the ritual verbatim after archiving, and still exits 0', async () => {
  const eco = makeScratchEcosystem(tmp('mvac-ritual-close-'));
  writeFileSync(
    join(eco.brain, '.multivac/ritual.md'),
    '# Ritual\n\n<!-- what belongs here -->\n\n- [ ] tell the on-call\n- [ ] the site ships first\n',
  );
  await landedChange(eco.brain, 'ceremony');

  const { rc, out } = await capture(() => change.run(['close', 'ceremony'], { cwd: eco.brain }));
  assert.equal(rc, 0, 'the ritual gates nothing');
  assert.match(out, /archived -> /);
  assert.match(out, /ritual \(\.multivac\/ritual\.md\)/);
  assert.match(out, /- \[ \] tell the on-call/);
  assert.match(out, /- \[ \] the site ships first/);
  assert.doesNotMatch(out, /what belongs here/, 'the scaffolding comment is not ritual');
  assert.ok(out.indexOf('archived -> ') < out.indexOf('tell the on-call'), 'printed last');
});

test('a brain with no ritual closes exactly as before', async () => {
  // the prefix deliberately avoids the word: close echoes the brain path, and
  // a tmpdir spelling "ritual" would answer this assertion for the wrong reason
  const eco = makeScratchEcosystem(tmp('mvac-no-ceremony-'));
  await landedChange(eco.brain, 'quiet');

  const { rc, out } = await capture(() => change.run(['close', 'quiet'], { cwd: eco.brain }));
  assert.equal(rc, 0);
  assert.doesNotMatch(out, /ritual/);
});

// --- MV-98: the seed ---

test('a seeded ritual carries candidates, every one commented', async () => {
  const { ritualSeed } = await import('../../src/lib/ritual.js');
  const seed = ritualSeed({ sdd: 'speckit', repos: { api: {}, web: {} }, mount: '.brain' });
  const bullets = seed.split('\n').filter((l) => l.includes('- [ ]'));
  assert.ok(bullets.length >= 3, 'candidates were seeded');
  for (const b of bullets) {
    assert.match(b, /^<!-- - \[ \] .* -->$/, `not commented: ${b}`);
  }
});

test('a commented candidate prints nothing, and uncommenting one makes it print', async () => {
  const { ritualSeed, ritualChecklist } = await import('../../src/lib/ritual.js');
  const { mkdtempSync, mkdirSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join: j } = await import('node:path');
  const brain = mkdtempSync(j(tmpdir(), 'mvac-seed-'));
  mkdirSync(j(brain, '.multivac'), { recursive: true });
  const seed = ritualSeed({ sdd: 'speckit' });
  writeFileSync(j(brain, '.multivac/ritual.md'), seed);
  // A fresh brain still prints nothing: exactly what it did before the seed.
  assert.deepEqual(await ritualChecklist(brain), []);

  writeFileSync(
    j(brain, '.multivac/ritual.md'),
    `${seed}\n- [ ] Somebody who did not write it read it, and said so out loud.\n`,
  );
  const lines = await ritualChecklist(brain);
  assert.equal(lines.length, 1);
  assert.match(lines[0], /Somebody who did not write it read it/);
});

test('a declared grapher contributes no candidate — its work is automatic and already gated', async () => {
  const { ritualSeed } = await import('../../src/lib/ritual.js');
  const seed = ritualSeed({ sdd: 'speckit', repos: { api: {} } });
  assert.equal(/graph/i.test(seed), false, 'the seed mentions the graph');
});

test("this repo's own ritual keeps only what no check could decide", async () => {
  const { readFileSync } = await import('node:fs');
  const { join: j } = await import('node:path');
  const root = j(import.meta.dirname, '../../..');
  const text = readFileSync(j(root, '.multivac/ritual.md'), 'utf8');
  const live = text
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n')
    .filter((l) => l.includes('- [ ]'));
  assert.ok(live.length > 0, 'the ritual is not empty');
  // The three obligations that moved must not still be posted here.
  for (const gone of [/an MR is open/i, /landing order/i, /friction backlog/i]) {
    assert.equal(gone.test(live.join('\n')), false, `still posted: ${gone}`);
  }
});
