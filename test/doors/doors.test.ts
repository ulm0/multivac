import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  lstatSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { doorsCommand } from '../../src/commands/doors.js';
import { installHooks } from '../../src/hooks/install.js';
import { countActiveInvariants } from '../../src/doors/brain.js';

const eco = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doors-')));
const read = (...p: string[]): string => readFileSync(join(...p), 'utf8');

async function runDoors(): Promise<{ code: number; out: string[] }> {
  const out: string[] = [];
  const orig = console.log;
  console.log = (line: string) => out.push(String(line));
  try {
    const code = await doorsCommand.run([], { cwd: eco.brain });
    return { code, out };
  } finally {
    console.log = orig;
  }
}

test('empty brain: door says so; consumer doors + user content preserved', async () => {
  const userText = '# acme-api conventions\n\nTabs, not spaces.\n';
  writeFileSync(join(eco.repos.api, 'AGENTS.md'), userText);

  const { code } = await runDoors();
  assert.equal(code, 0);

  const brainDoor = read(eco.brain, 'AGENTS.md');
  assert.match(brainDoor, /brain empty — load the multivac skill/);
  assert.match(brainDoor, /Cite rows by ID/);
  assert.match(brainDoor, /multivac verify/);
  assert.match(brainDoor, /acme-api/); // repo map present

  const apiDoor = read(eco.repos.api, 'AGENTS.md');
  assert.ok(apiDoor.startsWith(userText)); // user bytes untouched
  assert.match(apiDoor, /The change may cross repos/);
  assert.match(apiDoor, /\.brain\/invariants\.md/);
  assert.match(apiDoor, /multivac verify/);
  assert.match(read(eco.repos.web, 'AGENTS.md'), /consumer door/);
});

test('populated brain drops the session-zero line; reruns are zero-diff', async () => {
  const table =
    '| ID | statement | authority | state | date | source |\n' +
    '| --- | --- | --- | --- | --- | --- |\n' +
    '| INV-01 | api owns accounts | api | active | 2026-08-13 | seed |\n' +
    '| INV-02 | dead rule | api | retired | 2026-08-13 | seed |\n';
  assert.equal(countActiveInvariants(table), 1);
  writeFileSync(join(eco.brain, 'invariants.md'), `# Invariants\n\n${table}`);

  await runDoors();
  const once = read(eco.brain, 'AGENTS.md');
  assert.doesNotMatch(once, /brain empty/);

  await runDoors();
  assert.equal(read(eco.brain, 'AGENTS.md'), once); // idempotent
  assert.equal(
    read(eco.repos.api, 'AGENTS.md'),
    (await runDoors(), read(eco.repos.api, 'AGENTS.md')),
  );
});

test('hook shims installed and core.hooksPath set, brain and consumers', () => {
  for (const repo of [eco.brain, eco.repos.api, eco.repos.web]) {
    const pc = join(repo, '.multivac/hooks/pre-commit');
    assert.match(read(pc), /^#!\/bin\/sh\n/);
    assert.match(read(pc), /exec mvac verify/);
    assert.ok(statSync(pc).mode & 0o111, 'pre-commit is executable');
    assert.match(read(repo, '.multivac/hooks/pre-push'), /exec mvac verify/);
    const hooksPath = execFileSync(
      'git',
      ['-C', repo, 'config', 'core.hooksPath'],
      { encoding: 'utf8' },
    ).trim();
    assert.equal(hooksPath, '.multivac/hooks');
  }
});

test('strict pre-push variant', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-hooks-'));
  execFileSync('git', ['-C', dir, 'init', '-q']);
  await installHooks(dir, { strictPrePush: true });
  assert.match(read(dir, '.multivac/hooks/pre-push'), /verify --strict/);
  assert.match(read(dir, '.multivac/hooks/pre-commit'), /exec mvac verify\n/);
});

test('strict_pre_push: true in config — doors installs verify --strict pre-push everywhere', async () => {
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    'strict_pre_push: true\nrepos:\n  api: ../acme-api\n  web: ../acme-web\n',
  );
  const { code } = await runDoors();
  assert.equal(code, 0);
  for (const repo of [eco.brain, eco.repos.api, eco.repos.web]) {
    assert.match(read(repo, '.multivac/hooks/pre-push'), /exec mvac verify --strict\n/);
    assert.match(read(repo, '.multivac/hooks/pre-commit'), /exec mvac verify\n/); // commit stays default policy
  }
  // and the consumer door names the staleness gate only when block is on
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    'staleness: block\nrepos:\n  api: ../acme-api\n  web: ../acme-web\n',
  );
  await runDoors();
  assert.match(read(eco.repos.api, 'AGENTS.md'), /A pin behind its channel makes `verify` exit 1/);
  assert.match(read(eco.repos.api, '.multivac/hooks/pre-push'), /exec mvac verify\n/); // strict off again
});

test('claude target: symlink + settings merge preserving foreign keys', async () => {
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    'doors: [agents, claude]\nrepos:\n  api: ../acme-api\n  web: ../acme-web\n',
  );
  const settingsFile = join(eco.repos.api, '.claude', 'settings.json');
  execFileSync('mkdir', ['-p', join(eco.repos.api, '.claude')]);
  writeFileSync(
    settingsFile,
    JSON.stringify({ model: 'opus', hooks: { Stop: [{ hooks: [] }] } }),
  );

  const { code } = await runDoors();
  assert.equal(code, 0);

  for (const dir of [eco.brain, eco.repos.api]) {
    assert.ok(lstatSync(join(dir, 'CLAUDE.md')).isSymbolicLink());
    assert.equal(readlinkSync(join(dir, 'CLAUDE.md')), 'AGENTS.md');
  }
  // packaged skill copied into the repo
  assert.ok(statSync(join(eco.repos.api, '.claude/skills/multivac/SKILL.md')).isFile());
  const merged = JSON.parse(read(settingsFile)) as {
    model: string;
    hooks: Record<string, { hooks: { command?: string }[] }[]>;
  };
  assert.equal(merged.model, 'opus');
  assert.ok(merged.hooks.Stop); // foreign event preserved
  assert.equal(merged.hooks.SessionStart[0].hooks[0].command, 'mvac verify');
});

test('cursor target: stub with frontmatter, no unknown-target notice', async () => {
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    'doors: [agents, cursor]\nrepos:\n  api: ../acme-api\n',
  );
  const { code, out } = await runDoors();
  assert.equal(code, 0);
  assert.ok(!out.some((l) => l.includes('unknown door target')), out.join('\n'));
  for (const dir of [eco.brain, eco.repos.api]) {
    const stub = read(dir, '.cursor/rules/multivac.mdc');
    assert.match(stub, /^---\n/); // frontmatter first
    assert.match(stub, /alwaysApply: true/);
    assert.match(stub, /multivac:begin/); // managed block present (doctor checks it)
    assert.match(stub, /AGENTS\.md/);
  }
  // idempotent
  const once = read(eco.brain, '.cursor/rules/multivac.mdc');
  await runDoors();
  assert.equal(read(eco.brain, '.cursor/rules/multivac.mdc'), once);
});

test('missing repo is a notice, not a failure', async () => {
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    'repos:\n  api: ../acme-api\n  ghost: ../acme-ghost\n',
  );
  const { code, out } = await runDoors();
  assert.equal(code, 0);
  const notice = out.find((l) => l.startsWith('ghost:'));
  assert.ok(notice, 'ghost repo produced a notice');
  assert.match(notice!, /repos sync/);
});
