// MV-72 with teeth. `doors` writes `.claude/skills/multivac/` as a copy of
// `skills/multivac/`, and this repo tracks both, so an edit that lands in one
// and misses the other is invisible to git and to every text anchor: each
// tree still contains the string the anchor looks for. Only a file-by-file
// compare answers "are these the same tree". pnpm test runs from the repo root.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const SOURCE = 'skills/multivac';
const COPY = '.claude/skills/multivac';
const FIX = 'run `multivac doors` to rewrite the copy from skills/multivac';

function tree(root: string): string[] {
  const files: string[] = [];
  for (const e of readdirSync(root, { recursive: true, withFileTypes: true })) {
    if (e.isFile()) files.push(relative(root, join(e.parentPath, e.name)));
  }
  return files.sort();
}

test('the claude skill copy is byte-identical to its source (MV-72)', () => {
  const source = tree(SOURCE);
  assert.ok(source.length > 0, `${SOURCE} holds no files — the source tree is gone`);
  assert.deepEqual(tree(COPY), source, `${COPY} holds a different file list — ${FIX}`);
  for (const rel of source) {
    assert.deepEqual(
      readFileSync(join(COPY, rel)),
      readFileSync(join(SOURCE, rel)),
      `${rel} differs between the two trees — ${FIX}`,
    );
  }
});
