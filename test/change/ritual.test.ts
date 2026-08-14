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
