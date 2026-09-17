// MV-130. The SDD's own init installs the integration each declared door uses.
// The spec-kit init was `--integration claude` whatever `doors:` said; opsx had
// no init at all. Keys and multi-install flags measured 2026-09-16 on spec-kit
// 1.0.7 and openspec 1.13.0 (see the registry entries).

import test from 'node:test';
import assert from 'node:assert/strict';
import { sddSpec } from '../../src/adapters/registry.js';
import { scaffoldCommands } from '../../src/adapters/sdd.js';

const speckit = sddSpec('speckit')!.scaffold!;
const opsx = sddSpec('opsx')!.scaffold!;

test('a cursor team gets spec-kit\'s cursor integration, not claude\'s — MV-130', () => {
  assert.deepEqual(scaffoldCommands(speckit, ['agents', 'cursor']), {
    commands: ['specify init --here --integration cursor-agent --force --ignore-agent-tools'],
    gaps: [],
  });
});

test('a second safe integration is added with the vendor\'s own install — MV-130', () => {
  assert.deepEqual(scaffoldCommands(speckit, ['agents', 'claude', 'cursor']).commands, [
    'specify init --here --integration claude --force --ignore-agent-tools',
    'specify integration install cursor-agent',
  ]);
});

test('an integration the vendor marks unsafe is never forced beside another — MV-130', () => {
  const r = scaffoldCommands(speckit, ['agents', 'claude', 'opencode']);
  assert.deepEqual(r.commands, ['specify init --here --integration claude --force --ignore-agent-tools']);
  assert.deepEqual(r.gaps, ['opencode cannot be installed beside claude without forcing it, and multivac never forces an integration']);
  assert.doesNotMatch(r.commands.join(' '), /--force.*opencode|opencode.*--force/);
});

test('no harness door keeps spec-kit on claude, and an unmapped door is named — MV-130', () => {
  assert.deepEqual(scaffoldCommands(speckit, ['agents']).commands, [
    'specify init --here --integration claude --force --ignore-agent-tools',
  ]);
  assert.deepEqual(scaffoldCommands(speckit, ['agents', 'windsurf']).gaps, ['windsurf has no verified integration for this tool']);
});

test('opsx installs every declared tool in one init — MV-130', () => {
  assert.deepEqual(scaffoldCommands(opsx, ['agents', 'claude', 'copilot']), {
    commands: ['openspec init --tools agents,claude,github-copilot --no-animation .'],
    gaps: [],
  });
});
