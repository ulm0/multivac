// MV-02 enforcement with teeth. The invariant says "exactly two runtime
// dependencies", but a count anchor on package.json can only count the two
// known names — a third dependency slips past it. This test pins the actual
// set; the MV-02 anchor leg pins this test. pnpm test runs from the repo root.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('runtime dependencies are exactly picomatch and yaml (MV-02)', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
    dependencies: Record<string, string>;
  };
  assert.deepEqual(Object.keys(pkg.dependencies).sort(), ['citty', 'picomatch', 'yaml']);
});
