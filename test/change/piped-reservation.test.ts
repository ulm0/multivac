// MV-119, the third consumer: `change`'s id reservation.
//
// `reserveIdLocked` refuses a reservation somebody else holds only when the
// existing row's state is `proposed`. There was a SECOND parser of the law
// table here, counting four cells from the left, so a row whose statement
// quotes a pipe parsed its state as prose — the refusal never fired, and the
// argument `change plan` exists to have at declare time happened in a merge
// conflict instead.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { reserveId } from '../../src/change/reserve.js';
import { countActiveInvariants } from '../../src/doors/brain.js';

const TABLE = [
  '# Invariants',
  '',
  '| ID | statement | authority | state | date | source |',
  '| --- | --- | --- | --- | --- | --- |',
  '| MV-01 | the gate runs `mvac verify 2>&1 || true`. | open | proposed | 2026-08-19 | [changes/other.md](changes/other.md) |',
  '| MV-02 | a rule that quotes `| a | b |`. | specified | retired | 2026-08-19 | [changes/gone.md](changes/gone.md) |',
  '| MV-03 | plain prose. | specified | active | 2026-08-19 | [changes/kept.md](changes/kept.md) |',
].join('\n');

function brain(): string {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-reserve-'));
  mkdirSync(join(dir, '.multivac'), { recursive: true });
  writeFileSync(join(dir, '.multivac/invariants.md'), `${TABLE}\n`);
  return dir;
}

test('a reservation another change holds is refused even when its statement has a pipe', async () => {
  await assert.rejects(
    () => reserveId(brain(), 'mine', 'MV-01'),
    /reserved by another change/,
    'the collision refusal failed open on a piped row',
  );
});

test('the refusal names the change that holds it, read from the source column', async () => {
  await assert.rejects(() => reserveId(brain(), 'mine', 'MV-01'), /changes\/other\.md/);
});

test('a row that is not proposed is reported, not refused', async () => {
  const r = await reserveId(brain(), 'mine', 'MV-03');
  assert.deepEqual(r, { id: 'MV-03', written: false, state: 'active' });
});

test('the brain door counts what is not retired, pipes and all', () => {
  // The door read the header for the `state` column and indexed the DATA row
  // at that position: right for a row with no pipe, wrong for MV-01 and MV-02,
  // so the retired row counted and the door reported one claim too many.
  assert.equal(countActiveInvariants(TABLE), 2);
});
