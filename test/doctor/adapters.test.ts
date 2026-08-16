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

test('the table speaks two graphers, and everything else is UNVERIFIED', () => {
  // Narrowed on purpose. The four that went — code-review-graph, axon,
  // dependency-cruiser, scip-typescript — were verified but never exercised,
  // so their entries described a build and a refresh and nothing a reader
  // could ask the graph. They stay reachable through `graphers:` in config.
  assert.deepEqual(grapherNames, ['graphify', 'codegraph']);
  for (const gone of ['code-review-graph', 'axon', 'dependency-cruiser', 'scip-typescript']) {
    assert.equal(grapherSpec(gone), null, `${gone} must not resolve from the table`);
    assert.match(unverifiedGrapher(gone), /is not verified/);
  }
});

test('a grapher states its own query verbs — they are not interchangeable', () => {
  // The whole point of the narrowing: the door tells the agent what to ASK.
  // graphify takes a QUESTION and walks the graph; codegraph takes a SYMBOL.
  // Paraphrasing either into "query the graph" is wrong for the other.
  const g = grapherSpec('graphify')!;
  assert.deepEqual(
    g.queries?.map((q) => q.run),
    ['graphify query "<question>"', 'graphify explain "<node>"', 'graphify path "<A>" "<B>"'],
  );
  assert.match(g.queries![0].answers, /question in plain words/);

  const cg = grapherSpec('codegraph')!;
  assert.deepEqual(
    cg.queries?.map((q) => q.run),
    ['codegraph query <symbol>'],
  );
  assert.match(cg.queries![0].answers, /symbol search by name/);

  // A config-declared grapher has no query surface multivac can know about.
  const declared = grapherSpec('acmegraph', {
    acmegraph: { artifact: 'acmegraph-out/graph.json', refresh: 'acmegraph update .' },
  })!;
  assert.equal(declared.queries, undefined);
});

test('codegraph names its telemetry, because the refresh runs on every edit', () => {
  // The contract above the table says "no model and no network inside it".
  // codegraph ships telemetry ON by default, so the entry has to say so and
  // give the opt-out — a refresh fired from a post-edit hook would otherwise
  // phone home on every keystroke-sized change without the operator knowing.
  const cg = grapherSpec('codegraph')!;
  assert.match(cg.note ?? '', /TELEMETRY IS ON BY DEFAULT/);
  assert.match(cg.note ?? '', /codegraph telemetry off/);
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
