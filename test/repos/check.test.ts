// MV-132. `repos check`: every declared repo cloned as declared and, where
// multivac may write, its tools set up and committed — offline, no vendor on
// PATH. Measured on 0.13.0: `repos` and `doctor` called a plain directory and
// a repo with no commit `present`.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { gitInit, initRepo } from '../helpers/fixture.js';
import { SPECKIT_INTEGRATION_JSON } from '../helpers/recorded.js';
import { reposCheck, reposCommand, reposList } from '../../src/commands/repos.js';
import { change } from '../../src/commands/change.js';
import { doctorReport } from '../../src/commands/doctor.js';

// No vendor on PATH: the check must not need one.
process.env.PATH = [dirname(process.execPath), '/usr/bin', '/bin'].join(delimiter);
for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const CONSTITUTION = '# Acme Constitution\n\n## Core Principles\n\n### I. Law first\n\nRows bind.\n';

function brain(repos: string, extra = ''): { root: string; brain: string } {
  const root = mkdtempSync(join(tmpdir(), 'mvac-check-'));
  const b = join(root, 'brain');
  initRepo(b, {
    '.multivac/config.yml': `doors: [agents]\nsdd: speckit\ngrapher: graphify\n${extra}repos:\n  brain: .\n${repos}`,
    '.multivac/invariants.md': '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n',
    '.specify/integration.json': SPECKIT_INTEGRATION_JSON,
    '.specify/memory/constitution.md': CONSTITUTION,
    'graphify-out/graph.json': '{"nodes":[],"links":[]}\n',
  });
  return { root, brain: b };
}

test('every root cloned and set up: exit 0, one ok line each — MV-132', async () => {
  const { root, brain: b } = brain('  api: ../api\n');
  initRepo(join(root, 'api'), {
    '.specify/integration.json': SPECKIT_INTEGRATION_JSON,
    '.specify/memory/constitution.md': CONSTITUTION,
    'graphify-out/graph.json': '{}\n',
  });
  const { lines, exit } = await reposCheck(b);
  assert.equal(exit, 0, lines.join('\n'));
  assert.match(lines.join('\n'), /^brain\s+ok\s+cloned · speckit installed and committed · \.specify\/memory\/constitution\.md written · graphify built and committed$/m);
  assert.match(lines.join('\n'), /^api\s+ok\s+cloned/m);
});

test('a root that is not the declared clone fails by name — MV-132', async () => {
  const { root, brain: b } = brain(
    '  gone:\n    path: ../gone\n    url: git@example.com:acme/gone.git\n' +
    '  plain: ../plain\n' +
    '  unborn: ../unborn\n' +
    '  nested: ../host/nested\n' +
    '  other:\n    path: ../other\n    url: git@example.com:acme/other.git\n',
  );
  mkdirSync(join(root, 'plain'));
  gitInit(join(root, 'unborn'));
  initRepo(join(root, 'host'), { 'nested/README.md': '# inside\n' });
  initRepo(join(root, 'other'), { 'README.md': '# x\n' });
  execFileSync('git', ['-C', join(root, 'other'), 'remote', 'add', 'origin', 'git@example.com:acme/elsewhere.git']);
  const { lines, exit } = await reposCheck(b);
  const out = lines.join('\n');
  assert.equal(exit, 1);
  assert.match(out, /^gone\s+FAIL absent at \.\.\/gone → `multivac repos sync`$/m);
  assert.match(out, /^plain\s+FAIL \.\.\/plain exists but is not a git repository$/m);
  assert.match(out, /^unborn\s+FAIL \.\.\/unborn is a repository with no commit/m);
  assert.match(out, /^nested\s+FAIL \.\.\/host\/nested is inside the repository at .*host, not a clone of its own$/m);
  assert.match(out, /^other\s+FAIL \.\.\/other has no remote matching git@example\.com:acme\/other\.git — found git@example\.com:acme\/elsewhere\.git$/m);
});

test('a cloned root whose tools are not set up or not committed fails, naming each — MV-132', async () => {
  const { root, brain: b } = brain('  api: ../api\n  web: ../web\n');
  initRepo(join(root, 'api'), { 'README.md': '# api\n' }); // nothing installed
  initRepo(join(root, 'web'), {
    '.specify/integration.json': SPECKIT_INTEGRATION_JSON,
    '.specify/memory/constitution.md': '# [PROJECT_NAME] Constitution\n',
  });
  // web: graph built but never committed; constitution still the template
  mkdirSync(join(root, 'web/graphify-out'), { recursive: true });
  writeFileSync(join(root, 'web/graphify-out/graph.json'), '{}\n');
  const { lines, exit } = await reposCheck(b);
  const out = lines.join('\n');
  assert.equal(exit, 1);
  assert.match(out, /^api\s+FAIL .*speckit missing → `multivac repos sync`/m);
  assert.match(out, /^api\s+FAIL .*graphify missing → `multivac repos sync`/m);
  assert.match(out, /^web\s+FAIL .*\.specify\/memory\/constitution\.md template \(placeholders remain: \[PROJECT_NAME\]\) → run \/speckit\.constitution/m);
  assert.match(out, /^web\s+FAIL .*graphify built but graphify-out\/graph\.json is not committed → commit it/m);
});

test('an empty project document is empty, in repos check and in doctor — MV-132', async () => {
  const { brain: b } = brain('');
  writeFileSync(join(b, '.specify/memory/constitution.md'), '');
  const { lines, exit } = await reposCheck(b);
  assert.equal(exit, 1);
  assert.match(lines.join('\n'), /constitution\.md empty/);
  const doc = (await doctorReport(b)).lines.find((l) => l.includes('project law @ brain')) ?? '';
  assert.match(doc, /constitution\.md is empty/);
  assert.doesNotMatch(doc, /present/);
});

test('managed: false is checked for its clone alone — MV-132', async () => {
  const { root, brain: b } = brain('  vendor:\n    path: ../vendor\n    managed: false\n');
  initRepo(join(root, 'vendor'), { 'README.md': '# v\n' });
  const { lines, exit } = await reposCheck(b);
  assert.equal(exit, 0, lines.join('\n'));
  assert.match(lines.join('\n'), /^vendor\s+ok\s+cloned — not managed, read-only: its tools are not checked$/m);
});

test('an invalid config exits 2 — MV-132', async () => {
  const { brain: b } = brain('', 'nonsense_key: 1\n');
  const lines: string[] = [];
  const orig = { log: console.log, error: console.error };
  console.log = console.error = (...a: unknown[]) => { lines.push(a.map(String).join(' ')); };
  try {
    assert.equal(await reposCommand.run(['check'], { cwd: b }), 2);
  } finally {
    console.log = orig.log;
    console.error = orig.error;
  }
  assert.match(lines.join('\n'), /unknown key "nonsense_key"/);
});

test('plan refuses a named repo that is present but not the declared clone — MV-132', async () => {
  const { root, brain: b } = brain('  plain: ../plain\n');
  mkdirSync(join(root, 'plain'));
  const ctx = { cwd: b };
  const out: string[] = [];
  const orig = { log: console.log, error: console.error };
  console.log = console.error = (...a: unknown[]) => { out.push(a.map(String).join(' ')); };
  try {
    assert.equal(await change.run(['new', 'touch', 'Touch', '--no-sdd'], ctx), 0);
    const { loadChange, saveChange } = await import('../../src/change/file.js');
    const parsed = await loadChange(b, 'touch');
    parsed.change.repos = { plain: { status: 'planned' } };
    parsed.change.landing_order = [['plain']];
    parsed.change.invariants.adds = [];
    await saveChange(b, parsed);
    assert.equal(await change.run(['plan', 'touch', '--no-sdd'], ctx), 1);
  } finally {
    console.log = orig.log;
    console.error = orig.error;
  }
  assert.match(out.join('\n'), /names a repo present on disk but not the declared clone \(MV-132\)/);
  assert.match(out.join('\n'), /plain: \.\.\/plain exists but is not a git repository/);
});

test('repos and doctor report the clone state, not a path being there — MV-141', async () => {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-clonestate-')));
  const brain = join(tmp, 'brain');
  initRepo(brain, {
    '.multivac/config.yml': 'doors: [agents]\nrepos:\n  api: ../api\n  plain: ../plain\n  gone: ../gone\n',
    '.multivac/invariants.md': '# Invariants\n',
  });
  initRepo(join(tmp, 'api'), { 'README.md': '# api\n' });
  mkdirSync(join(tmp, 'plain'));
  const list = (await reposList(brain)).join('\n');
  assert.match(list, /^api\s+cloned\s+\.\.\/api$/m);
  assert.match(list, /^plain\s+invalid\s+\.\.\/plain — \.\.\/plain exists but is not a git repository$/m);
  assert.match(list, /^gone\s+missing\s+\.\.\/gone {2}— no url, cannot sync$/m);
  const repos = (await doctorReport(brain)).lines.find((l) => l.startsWith('repos'))!;
  assert.match(repos, /1\/3 cloned · plain: \.\.\/plain exists but is not a git repository/);
});
