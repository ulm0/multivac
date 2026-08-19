// MV-118. `doctor --help` and the reference both promise exit 1 when the
// config OR THE LAW is invalid. The law half was never implemented: the report
// collected the law's anchors with `.then((r) => r.anchors, () => [])`, the
// diagnostics discarded on the line that read them, so a law with an anchor
// that does not parse reported clean and exited 0.
//
// The config half is pinned in test/cli/exit-contract.test.ts; this is the
// half that was a sentence and nothing else.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { doctorReport } from '../../src/commands/doctor.js';
import { gitInit } from '../helpers/fixture.js';

function brain(law: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-law-exit-'));
  gitInit(dir);
  mkdirSync(join(dir, '.multivac'), { recursive: true });
  writeFileSync(join(dir, '.multivac/config.yml'), 'repos: {}\ndoors: []\n');
  writeFileSync(join(dir, '.multivac/invariants.md'), law);
  return dir;
}

const GOOD = '<!-- @anchor MV-01 brain:*.md /nothing/ absent -->\n';

test('an anchor that does not parse is exit 1, and the report names it', async () => {
  const dir = brain(`${GOOD}<!-- @anchor MV-02 brain:*.md /unclosed -->\n`);
  const { lines, exit } = await doctorReport(dir);
  assert.equal(exit, 1);
  const law = lines.find((l) => l.includes('law'));
  assert.ok(law?.includes('invalid'), `law line must say invalid: ${law}`);
  assert.ok(law?.includes('invariants.md'), `law line must name the file: ${law}`);
});

test('a law that parses is exit 0 and says how many anchors it read', async () => {
  const { lines, exit } = await doctorReport(brain(GOOD));
  assert.equal(exit, 0);
  assert.ok(lines.some((l) => l.includes('1 anchor parses')), lines.join('\n'));
});
