// MV-22 with teeth. Text anchors prove the strings exist; they cannot prove
// the two machine-read halves still agree — npm reads package.json's field,
// every scanner reads LICENSE, and a mismatch between them is the failure
// mode that matters before a publish. pnpm test runs from the repo root.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('the license is MIT in both the manifest and the file (MV-22)', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { license?: string };
  assert.equal(pkg.license, 'MIT');

  const license = readFileSync('LICENSE', 'utf8');
  assert.match(license, /^MIT License$/m);
  assert.match(license, /Copyright \(c\) 2026 Pierre Ugaz/);
  assert.match(license, /WITHOUT WARRANTY OF ANY KIND/);
});
