// MV-02 enforcement with teeth. A count anchor on package.json can only count
// the names it already knows, so one more dependency slips past it. This test
// pins the actual SET, whatever the number currently is; the MV-02 anchor leg
// pins this test. Read the number in MV-02, not here — a restatement of it in
// this comment is how the count came to be wrong in six places at once.
// pnpm test runs from the repo root.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('runtime dependencies are exactly picomatch and yaml (MV-02)', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
    dependencies: Record<string, string>;
  };
  assert.deepEqual(Object.keys(pkg.dependencies).sort(), ['citty', 'picomatch', 'yaml']);
});
