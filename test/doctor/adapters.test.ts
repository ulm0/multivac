// Three-state adapter policy + artifact/binary probing.

import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { grapherSpec, sddSpec, doorTargets } from '../../src/adapters/registry.js';
import {
  artifactPresent,
  binaryPresent,
  detect,
  policy,
} from '../../src/adapters/detect.js';

const tmp = mkdtempSync(join(tmpdir(), 'mvac-adapters-'));
const emptyDir = join(tmp, 'empty');
mkdirSync(emptyDir);

function withPath<T>(dirs: string[], fn: () => Promise<T>): Promise<T> {
  const old = process.env.PATH;
  process.env.PATH = dirs.join(delimiter);
  return fn().finally(() => {
    process.env.PATH = old;
  });
}

test('binary probe is a hand-rolled which over PATH', async () => {
  const binDir = join(tmp, 'bin');
  mkdirSync(binDir);
  writeFileSync(join(binDir, 'acmegraph'), '#!/bin/sh\nexit 0\n');
  chmodSync(join(binDir, 'acmegraph'), 0o755);
  await withPath([binDir], async () => {
    assert.equal(await binaryPresent(grapherSpec('acmegraph')), true);
    assert.equal(await binaryPresent(grapherSpec('acme-nope')), false);
  });
});

test('not declared = silent', () => {
  assert.equal(policy(null), 'silent');
});

test('declared + nothing present = notice (feature off, exit 0)', async () => {
  const spec = sddSpec('opsx');
  assert.ok(spec);
  await withPath([emptyDir], async () => {
    const s = await detect('opsx', spec, emptyDir);
    assert.deepEqual(s, {
      name: 'opsx',
      kind: 'sdd',
      declared: true,
      artifact: false,
      binary: false,
    });
    assert.equal(policy(s), 'notice');
  });
});

test('declared + artifact present = active even with no binary', async () => {
  const proj = join(tmp, 'proj');
  mkdirSync(join(proj, 'openspec', 'specs'), { recursive: true });
  const spec = sddSpec('opsx');
  assert.ok(spec);
  await withPath([emptyDir], async () => {
    const s = await detect('opsx', spec, proj);
    assert.equal(s.artifact, true);
    assert.equal(s.binary, false);
    assert.equal(policy(s), 'active');
  });
});

test('grapher spec is generic: derived from the declared name', async () => {
  const spec = grapherSpec('acmegraph');
  assert.deepEqual(spec.artifacts, ['acmegraph-out/graph.json']);
  assert.deepEqual(spec.binaries, ['acmegraph']);
  assert.equal(spec.refresh, 'acmegraph update .');
  assert.equal(spec.automation, 'grapher-refresh');
  const proj = join(tmp, 'graphed');
  mkdirSync(join(proj, 'acmegraph-out'), { recursive: true });
  writeFileSync(join(proj, 'acmegraph-out', 'graph.json'), '{}');
  assert.equal(await artifactPresent(spec, proj), true);
  assert.equal(await artifactPresent(spec, emptyDir), false);
});

test('registry door targets: canonical agents, symlink claude', () => {
  assert.equal(doorTargets.agents.kind, 'canonical');
  assert.equal(doorTargets.agents.door, 'AGENTS.md');
  assert.equal(doorTargets.claude.kind, 'symlink');
  assert.ok(doorTargets.claude.skill);
  assert.ok(doorTargets.claude.hookConfig?.path);
});
