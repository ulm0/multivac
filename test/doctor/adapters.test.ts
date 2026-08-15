// Three-state adapter policy + artifact/binary probing.

import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import {
  grapherNames,
  grapherSpec,
  sddSpec,
  doorTargets,
  unverifiedGrapher,
} from '../../src/adapters/registry.js';
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

/** A declared (not registry-verified) grapher, for the probes below. */
const acme = { acmegraph: { artifact: 'acmegraph-out/graph.json', refresh: 'acmegraph update .' } };

test('binary probe is a hand-rolled which over PATH', async () => {
  const binDir = join(tmp, 'bin');
  mkdirSync(binDir);
  writeFileSync(join(binDir, 'acmegraph'), '#!/bin/sh\nexit 0\n');
  chmodSync(join(binDir, 'acmegraph'), 0o755);
  await withPath([binDir], async () => {
    assert.equal(await binaryPresent(grapherSpec('acmegraph', acme)!), true);
    assert.equal(await binaryPresent(grapherSpec('graphify')!), false);
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

test('an unknown grapher is UNVERIFIED — nothing is derived from the name', () => {
  assert.equal(grapherSpec('acmegraph'), null);
  const msg = unverifiedGrapher('acmegraph');
  // The refusal names the fields and the file, or it is just a dead end.
  assert.match(msg, /not verified/);
  assert.match(msg, /graphers:/);
  assert.match(msg, /artifact:/);
  assert.match(msg, /refresh:/);
  assert.match(msg, /\.multivac\/config\.yml/);
  // And it must not print the shape it used to invent.
  assert.doesNotMatch(msg, /acmegraph-out\/graph\.json/);
  assert.doesNotMatch(msg, /npm i -g acmegraph/);
});

test('a config-declared grapher is usable without a registry MR', async () => {
  const spec = grapherSpec('acmegraph', acme);
  assert.ok(spec);
  assert.deepEqual(spec.artifacts, ['acmegraph-out/graph.json']);
  assert.deepEqual(spec.binaries, ['acmegraph']); // first word of refresh
  assert.equal(spec.refresh, 'acmegraph update .');
  assert.equal(spec.automation, 'grapher-refresh');
  assert.match(spec.installHint, /UNVERIFIED/); // never guessed
  const proj = join(tmp, 'graphed');
  mkdirSync(join(proj, 'acmegraph-out'), { recursive: true });
  writeFileSync(join(proj, 'acmegraph-out', 'graph.json'), '{}');
  assert.equal(await artifactPresent(spec, proj), true);
  assert.equal(await artifactPresent(spec, emptyDir), false);
});

test('a declaration states the binary when it is not the first word', () => {
  const spec = grapherSpec('weird', {
    weird: { artifact: 'out.db', refresh: 'npx weirdgraph index', binary: 'npx', install: 'npm i -g weirdgraph' },
  });
  assert.deepEqual(spec!.binaries, ['npx']);
  assert.equal(spec!.installHint, 'npm i -g weirdgraph');
});

test('the four verified entries carry their real contracts', () => {
  const crg = grapherSpec('code-review-graph')!;
  assert.deepEqual(crg.artifacts, ['.code-review-graph']);
  assert.equal(crg.create, 'code-review-graph build');
  assert.equal(crg.refresh, 'code-review-graph update');
  assert.match(crg.installHint, /UNVERIFIED/);

  const axon = grapherSpec('axon')!;
  assert.deepEqual(axon.artifacts, ['.axon']);
  // No update verb: build and refresh are the same idempotent command.
  assert.equal(axon.create, 'axon analyze .');
  assert.equal(axon.refresh, 'axon analyze .');
  assert.match(axon.installHint, /UNVERIFIED/);

  const dc = grapherSpec('dependency-cruiser')!;
  assert.deepEqual(dc.binaries, ['depcruise']); // NOT the adapter name
  assert.match(dc.refresh, /^depcruise /);
  // Caller-chosen output: the note has to say the path is multivac's.
  assert.match(dc.note ?? '', /multivac's choice/);

  const scip = grapherSpec('scip-typescript')!;
  assert.deepEqual(scip.artifacts, ['index.scip']);
  assert.equal(scip.create, undefined); // build and refresh are one command
  assert.equal(scip.refresh, 'scip-typescript index');
});

test('graphify itself is stated, not derived — the npm line was wrong', () => {
  const g = grapherSpec('graphify')!;
  assert.deepEqual(g.artifacts, ['graphify-out/graph.json']);
  assert.equal(g.refresh, 'graphify update .');
  assert.equal(g.installHint, 'uv tool install graphifyy');
  assert.ok(grapherNames.includes('graphify'));
});

test('registry door targets: canonical agents, symlink claude', () => {
  assert.equal(doorTargets.agents.kind, 'canonical');
  assert.equal(doorTargets.agents.door, 'AGENTS.md');
  assert.equal(doorTargets.claude.kind, 'symlink');
  assert.ok(doorTargets.claude.skill);
  assert.ok(doorTargets.claude.hookConfig?.path);
});
