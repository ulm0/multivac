// MV-124: a vendor is initialised in a root when its own state files say so.
// One probe answers for every surface, from files alone — so every case here
// runs with PATH empty, and a probe that shelled out would find nothing to run.
//
// Each shipped adapter is laid out four ways: nothing, the vendor's directory
// alone, a state file that fails its check, and the files a real init writes.

import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { initState } from '../../src/lib/init-state.js';
import { grapherSpec, sddSpec, type AdapterSpec } from '../../src/adapters/registry.js';
import { SPECKIT_INTEGRATION_JSON } from '../helpers/recorded.js';

process.env.PATH = '';

const tmp = mkdtempSync(join(tmpdir(), 'mvac-initstate-'));
let n = 0;

/** A fresh root holding `files` (a string is a file, null a directory). */
const root = (files: Record<string, string | null> = {}): string => {
  const dir = join(tmp, `r${n++}`);
  mkdirSync(dir, { recursive: true });
  for (const [rel, body] of Object.entries(files)) {
    const p = join(dir, rel);
    if (body === null) {
      mkdirSync(p, { recursive: true });
      continue;
    }
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, body);
  }
  return dir;
};

const speckit = sddSpec('speckit')!;
const opsx = sddSpec('opsx')!;
const graphify = grapherSpec('graphify')!;
const codegraph = grapherSpec('codegraph')!;

const expectState = async (spec: AdapterSpec, dir: string, state: string, reason?: RegExp): Promise<void> => {
  const got = await initState(spec, dir);
  assert.equal(got.state, state, `${dir}: ${JSON.stringify(got)}`);
  if (reason) assert.match(got.reason ?? '', reason);
  if (state === 'installed' || state === 'missing') assert.equal(got.reason, undefined);
};

test('speckit is installed by an integration.json that parses with schema 1 and an integration', async () => {
  const J = '.specify/integration.json';
  await expectState(speckit, root(), 'missing');
  // What `mkdir .specify` leaves: the directory, and no install.
  await expectState(speckit, root({ '.specify': null }), 'partial', /\.specify\/integration\.json/);
  await expectState(speckit, root({ [J]: '' }), 'partial', /\.specify\/integration\.json does not parse as JSON/);
  await expectState(speckit, root({ [J]: SPECKIT_INTEGRATION_JSON.slice(0, 40) }), 'partial', /does not parse as JSON/);
  const schema2 = SPECKIT_INTEGRATION_JSON.replace('"integration_state_schema": 1', '"integration_state_schema": 2');
  await expectState(speckit, root({ [J]: schema2 }), 'partial', /\.specify\/integration\.json: integration_state_schema is not 1/);
  const none = JSON.stringify({ integration_state_schema: 1, installed_integrations: [] });
  await expectState(speckit, root({ [J]: none }), 'partial', /\.specify\/integration\.json: installed_integrations is empty/);
  await expectState(speckit, root({ [J]: null }), 'partial', /\.specify\/integration\.json is not a file/);
  const link = root({ '.specify': null });
  symlinkSync(join(link, 'nowhere.json'), join(link, J));
  await expectState(speckit, link, 'partial', /\.specify\/integration\.json is not a file/);
  await expectState(speckit, root({ [J]: SPECKIT_INTEGRATION_JSON }), 'installed');
  // Which integration is the door map's question, not this one.
  const copilot = JSON.stringify({ integration_state_schema: 1, installed_integrations: ['copilot'] });
  await expectState(speckit, root({ [J]: copilot }), 'installed');
});

test('opsx is installed by its config, and its specs alone are partial', async () => {
  await expectState(opsx, root(), 'missing');
  await expectState(opsx, root({ 'openspec/specs': null }), 'partial', /openspec is there and openspec\/config\.yaml or openspec\/config\.yml is not/);
  await expectState(opsx, root({ 'openspec/config.yaml': 'schema: spec-driven\n' }), 'installed');
  await expectState(opsx, root({ 'openspec/config.yml': 'schema: spec-driven\n' }), 'installed');
});

test('graphify is installed by a graph.json that parses, and nothing less', async () => {
  const G = 'graphify-out/graph.json';
  await expectState(graphify, root(), 'missing');
  await expectState(graphify, root({ 'graphify-out': null }), 'partial', /graphify-out\/graph\.json/);
  await expectState(graphify, root({ [G]: '' }), 'partial', /graphify-out\/graph\.json does not parse as JSON/);
  await expectState(graphify, root({ [G]: '{"nodes": [' }), 'partial', /does not parse as JSON/);
  await expectState(graphify, root({ [G]: '<<<<<<< HEAD\n{}\n=======\n{"a":1}\n>>>>>>> theirs\n' }), 'partial', /does not parse/);
  await expectState(graphify, root({ [G]: '{}' }), 'installed');
});

test('codegraph is installed by its database, and its own .gitignore alone is partial', async () => {
  await expectState(codegraph, root(), 'missing');
  await expectState(codegraph, root({ '.codegraph/.gitignore': '*\n' }), 'partial', /\.codegraph is there and \.codegraph\/codegraph\.db is not/);
  await expectState(codegraph, root({ '.codegraph/codegraph.db': '' }), 'installed');
});

test('a state file that is there and cannot be read is unevaluable, naming the file and the error', { skip: process.getuid?.() === 0 }, async () => {
  const dir = root({ '.specify/integration.json': SPECKIT_INTEGRATION_JSON });
  chmodSync(join(dir, '.specify/integration.json'), 0o000);
  try {
    await expectState(speckit, dir, 'unevaluable', /cannot read \.specify\/integration\.json: EACCES/);
  } finally {
    chmodSync(join(dir, '.specify/integration.json'), 0o644);
  }
});

test('a declared grapher is installed when its artifact exists, file or directory, and missing otherwise', async () => {
  const file = grapherSpec('acmegraph', { acmegraph: { artifact: 'out/graph.json', refresh: 'acmegraph .' } })!;
  const dir = grapherSpec('dirgraph', { dirgraph: { artifact: 'out/index', refresh: 'dirgraph .' } })!;
  await expectState(file, root({ 'out/graph.json': 'not even json' }), 'installed');
  await expectState(dir, root({ 'out/index': null }), 'installed');
  // Never partial: a declaration names no vendor directory to be half there.
  await expectState(file, root({ out: null }), 'missing');
  await expectState(dir, root(), 'missing');
});
