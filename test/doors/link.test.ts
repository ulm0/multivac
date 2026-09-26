// MV-143. The door link and the block removal, at the unit: `installHarness`
// and `doors` both depend on these two answers, and every notice one of them
// prints is a human's repair instruction.

import test from 'node:test';
import assert from 'node:assert/strict';
import { lstatSync, mkdtempSync, readFileSync, readlinkSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CANONICAL_DOOR, hasGrapherSection, linkDoor } from '../../src/doors/link.js';
import { stripManagedBlock } from '../../src/doors/block.js';

const tmp = (): string => mkdtempSync(join(tmpdir(), 'mvac-link-'));

test('an absent door is linked, and linking twice says nothing the second time', () => {
  const dir = tmp();
  writeFileSync(join(dir, CANONICAL_DOOR), '# door\n');
  const first = linkDoor(dir, 'CLAUDE.md');
  assert.deepEqual(first, { created: true, notice: null });
  assert.equal(readlinkSync(join(dir, 'CLAUDE.md')), CANONICAL_DOOR);
  const second = linkDoor(dir, 'CLAUDE.md');
  assert.deepEqual(second, { created: false, notice: null }, 'idempotent and silent');
});

test('a dangling link is left alone — the vendor writes through it', () => {
  const dir = tmp();
  symlinkSync(CANONICAL_DOOR, join(dir, 'CLAUDE.md'));
  assert.deepEqual(linkDoor(dir, 'CLAUDE.md'), { created: false, notice: null });
  // Measured on graphify 0.9.29: writing through this link creates AGENTS.md.
  writeFileSync(join(dir, 'CLAUDE.md'), '## graphify\n\nrules\n');
  assert.match(readFileSync(join(dir, CANONICAL_DOOR), 'utf8'), /^## graphify$/m);
  assert.ok(lstatSync(join(dir, 'CLAUDE.md')).isSymbolicLink(), 'still a link');
});

test('a regular door file is never replaced — MV-108', () => {
  const dir = tmp();
  writeFileSync(join(dir, 'CLAUDE.md'), 'somebody wrote this\n');
  const { created, notice } = linkDoor(dir, 'CLAUDE.md');
  assert.equal(created, false);
  assert.match(notice!, /CLAUDE\.md exists as a regular file — merge it into AGENTS\.md and remove it/);
  assert.equal(readFileSync(join(dir, 'CLAUDE.md'), 'utf8'), 'somebody wrote this\n');
});

test('a link pointing somewhere else is reported, not repointed', () => {
  const dir = tmp();
  writeFileSync(join(dir, 'OTHER.md'), 'x\n');
  symlinkSync('OTHER.md', join(dir, 'CLAUDE.md'));
  const { created, notice } = linkDoor(dir, 'CLAUDE.md');
  assert.equal(created, false);
  assert.match(notice!, /CLAUDE\.md is a symlink elsewhere — repoint it at AGENTS\.md or remove it/);
  assert.equal(readlinkSync(join(dir, 'CLAUDE.md')), 'OTHER.md', 'left where it pointed');
});

test('the vendor section is asked of the canonical door, and a missing door has none', async () => {
  const dir = tmp();
  assert.equal(await hasGrapherSection(dir, 'graphify'), false);
  writeFileSync(join(dir, CANONICAL_DOOR), '# door\n\n## graphifyish\n');
  assert.equal(await hasGrapherSection(dir, 'graphify'), false, 'a longer heading is not the section');
  writeFileSync(join(dir, CANONICAL_DOOR), '# door\n\n## graphify\n\nrules\n');
  assert.equal(await hasGrapherSection(dir, 'graphify'), true);
});

test('stripping the managed block leaves the operator every other byte', () => {
  const block = '<!-- multivac:begin -->\nours\n<!-- multivac:end -->\n';
  assert.equal(stripManagedBlock(block), null, 'nothing but the block: the file may go');
  assert.equal(stripManagedBlock(`head\n\n${block}`), 'head\n\n');
  // One newline after the end marker belonged to the block, the same seam
  // `applyManagedBlock` keeps when it replaces one.
  assert.equal(stripManagedBlock(`${block}\ntail\n`), '\ntail\n');
  const noBlock = 'a file that was never ours\n';
  assert.equal(stripManagedBlock(noBlock), noBlock, 'untouched, and the caller can tell');
  const half = '<!-- multivac:begin -->\nours\n';
  assert.equal(stripManagedBlock(half), half, 'a broken pair is nobody to guess about');
});
