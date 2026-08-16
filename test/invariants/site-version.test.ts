// The site quotes a version; package.json declares one; npm serves whatever the
// tag said. Nothing kept the first two equal, and they drifted: the home badge
// read v0.1.0 while 0.1.1 was already published. A text anchor cannot catch it —
// `v0.1.0` is a perfectly well-formed badge, and an anchor pinned to the literal
// string would have to be edited by the same hand that forgets. Only comparing
// the two files answers it. pnpm test runs from the repo root.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const HOME = 'site/content/_index.md';

test('the version on the site home is the version the package declares', () => {
  const { version } = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };
  assert.match(version, /^[0-9]+\.[0-9]+\.[0-9]+$/, 'package.json version is not a plain semver');

  const home = readFileSync(HOME, 'utf8');
  const badge = /<span>v([0-9]+\.[0-9]+\.[0-9]+) · npx multivac init<\/span>/.exec(home);
  assert.ok(badge, `${HOME} no longer carries the version badge this test pins`);
  assert.equal(
    badge[1],
    version,
    `${HOME} says v${badge[1]}, package.json says ${version} — bump the badge in the release change`,
  );
});
