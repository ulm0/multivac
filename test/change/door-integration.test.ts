// MV-130. The SDD's own init installs the integration each declared door uses.
// The spec-kit init was `--integration claude` whatever `doors:` said; opsx had
// no init at all. Keys and multi-install flags measured 2026-09-16 on spec-kit
// 1.0.7 and openspec 1.13.0 (see the registry entries). opsx's init now
// installs none (MV-147): its steps need no harness file.

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

// MV-147: opsx's steps are openspec's own terminal verbs, which no harness file
// serves, so its init installs no door's integration — the same command for
// any doors, none and an unknown one included, and no door named as a gap.
test('a scaffold run with no placeholder is returned as it is, whatever the doors — MV-130, MV-147', () => {
  for (const doors of [['agents', 'claude', 'copilot'], [], ['nope']]) {
    assert.deepEqual(
      scaffoldCommands(opsx, doors),
      { commands: ['openspec init --tools none --no-animation .'], gaps: [] },
      doors.join(','),
    );
  }
});

// The `{keys}` path no entry takes any longer still joins every mapped door's
// key into the one run, and names what maps to nothing.
test('a run with {keys} installs every mapped door in one command — MV-130', () => {
  const keyed = { ...opsx, run: 'openspec init --tools {keys} --no-animation .' };
  assert.deepEqual(scaffoldCommands(keyed, ['agents', 'claude', 'copilot']), {
    commands: ['openspec init --tools agents,claude,github-copilot --no-animation .'],
    gaps: [],
  });
  assert.deepEqual(scaffoldCommands(keyed, ['nope']), {
    commands: [],
    gaps: ['nope has no verified integration for this tool', 'no declared door maps to an integration of this tool'],
  });
});
