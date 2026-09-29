// MV-148, against the real graphify: the facts the ignore step and the
// forced rebuild are built on. Pinned to the version they were measured on
// (MV-121 says to re-measure on another one), so the test runs only where
// `graphify --version` prints exactly `graphify 0.9.29` and is skipped
// everywhere else — a host with another release has measured nothing. The
// vendor runs in a scratch repo, with HOME and git's global config isolated
// and telemetry off, so it writes nothing outside that repo.

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { grapherSpec } from '../../src/adapters/registry.js';
import { holdsIgnored, IGNORE_RECORD, writeIgnores } from '../../src/adapters/refresh.js';

const PINNED = 'graphify 0.9.29';

const isolated = (home: string): NodeJS.ProcessEnv => ({
  ...process.env,
  HOME: home,
  GIT_CONFIG_GLOBAL: '/dev/null',
  DO_NOT_TRACK: '1',
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
});

const home = mkdtempSync(join(tmpdir(), 'mvac-graphify-home-'));
const probe = spawnSync('graphify', ['--version'], { cwd: home, env: isolated(home), encoding: 'utf8' });
const skip = probe.status === 0 && probe.stdout.trim() === PINNED ? false : `${PINNED} is not reachable here`;

test('graphify refuses to shrink over a recorded line, the rebuild purges it, and an anchored line keeps nested code — MV-148', { skip }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-graphify-real-'));
  const env = isolated(home);
  const sh = (cmd: string) => spawnSync('sh', ['-c', cmd], { cwd: dir, env, encoding: 'utf8' });
  for (const [rel, body] of Object.entries({
    'src/a.ts': 'export function alpha() { return 1; }\n',
    'src/specs/b.ts': 'export function beta() { return 2; }\n',
    'specs/c.ts': 'export function gamma() { return 3; }\n',
    '.claude/d.ts': 'export function delta() { return 4; }\n',
  })) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), body);
  }
  assert.equal(sh('git init -q -b main && git add -A && git commit -qm init').status, 0);
  const spec = grapherSpec('graphify')!;
  const files = (): string[] =>
    [...new Set((JSON.parse(readFileSync(join(dir, 'graphify-out/graph.json'), 'utf8')) as { nodes: { source_file: string }[] }).nodes.map((n) => n.source_file))].sort();
  const nodes = (): number => (JSON.parse(readFileSync(join(dir, 'graphify-out/graph.json'), 'utf8')) as { nodes: unknown[] }).nodes.length;

  const built = sh(spec.refresh);
  assert.equal(built.status, 0, built.stderr);
  assert.deepEqual(files(), ['.claude/d.ts', 'specs/c.ts', 'src/a.ts', 'src/specs/b.ts']);
  const all = nodes();

  // The lines appended over a graph whose files lie under them.
  assert.equal(await writeIgnores('graphify', spec, dir, 'brain', ['/.claude/', '/specs/'], { gitignore: false, before: 'a test' }), true);
  assert.equal(await holdsIgnored(spec, dir), true);
  const refused = sh(spec.refresh);
  assert.equal(refused.status, 1, 'a plain refresh refuses to shrink');
  assert.match(`${refused.stdout}${refused.stderr}`, /Refusing to overwrite/);
  assert.equal(nodes(), all, 'and leaves the graph as it was');

  const rebuilt = sh(spec.rebuild!);
  assert.equal(rebuilt.status, 0, rebuilt.stderr);
  assert.ok(nodes() < all);
  // Anchored: `/specs/` keeps `src/specs/b.ts`, which an unanchored `specs/` hid.
  assert.deepEqual(files(), ['src/a.ts', 'src/specs/b.ts']);
  assert.equal(await holdsIgnored(spec, dir), false);

  // The record is a comment to graphify: without it, the same graph.
  const kept = nodes();
  const text = readFileSync(join(dir, '.graphifyignore'), 'utf8');
  assert.ok(text.includes(IGNORE_RECORD));
  writeFileSync(join(dir, '.graphifyignore'), text.split('\n').filter((l) => !l.startsWith('#')).join('\n'));
  const plain = sh(spec.refresh);
  assert.equal(plain.status, 0, plain.stderr);
  assert.equal(nodes(), kept);
});
