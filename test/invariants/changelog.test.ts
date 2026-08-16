// MV-78 with teeth. The two-surface half is structural — the site mounts
// ../CHANGELOG.md instead of copying it, so there is no second file to drift and
// anchors on hugo.yaml can pin the mount. What no anchor can ask is the other
// half: whether the version package.json currently declares has an entry. A leg
// pinned to the literal current version would need editing by the same hand that
// forgot the entry. pnpm test runs from the repo root.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const LOG = 'CHANGELOG.md';
const HUGO = 'site/hugo.yaml';

function entries(body: string): string[] {
  return [...body.matchAll(/^## ([0-9]+\.[0-9]+\.[0-9]+) — [0-9]{4}-[0-9]{2}-[0-9]{2}$/gm)].map((m) => m[1]);
}

test('the changelog has an entry for the version the package declares (MV-78)', () => {
  const { version } = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };
  const found = entries(readFileSync(LOG, 'utf8'));

  assert.ok(found.length > 0, `${LOG} carries no dated version entries`);
  assert.ok(
    found.includes(version),
    `${LOG} has no entry for ${version} — it has ${found.join(', ')}. A release nobody wrote a line for is not released.`,
  );
});

test('the site mounts the changelog rather than copying it (MV-78)', () => {
  const hugo = readFileSync(HUGO, 'utf8');
  assert.match(hugo, /source: \.\.\/CHANGELOG\.md/, `${HUGO} no longer mounts the repo changelog`);
  assert.match(hugo, /target: content\/docs\/changelog\.md/, `${HUGO} no longer targets the changelog page`);
  // Declaring any content mount replaces Hugo's default, so losing this line
  // silently empties the whole site rather than just the changelog.
  assert.match(hugo, /source: content\n\s+target: content/, `${HUGO} lost the default content mount`);
});

test('changelog entries are ordered newest first (MV-78)', () => {
  const found = entries(readFileSync(LOG, 'utf8'));
  const key = (v: string) => v.split('.').map((n) => Number(n).toString().padStart(6, '0')).join('.');
  const sorted = [...found].sort((a, b) => key(b).localeCompare(key(a)));
  assert.deepEqual(found, sorted, `${LOG} lists ${found.join(', ')} — newest first is ${sorted.join(', ')}`);
});
