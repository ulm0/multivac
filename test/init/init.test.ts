import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { doctorReport } from '../../src/commands/doctor.js';
import { init } from '../../src/commands/init.js';
import { loadConfig } from '../../src/lib/config.js';

const tmp = (): string => mkdtempSync(join(tmpdir(), 'mvac-init-'));

/** Content snapshot of every file under dir, .git excluded. */
function snapshot(dir: string, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const e of readdirSync(join(dir, prefix), { withFileTypes: true })) {
    const rel = prefix === '' ? e.name : `${prefix}/${e.name}`;
    if (e.name === '.git') continue;
    if (e.isDirectory()) {
      for (const [k, v] of snapshot(dir, rel)) out.set(k, v);
    } else {
      out.set(rel, readFileSync(join(dir, rel), 'utf8'));
    }
  }
  return out;
}

test('init scaffolds the enumerated side effects and nothing more', async () => {
  const dir = tmp();
  assert.equal(await init.run(['--agent', 'claude'], { cwd: dir }), 0);

  // git repo created, hooks path pointed at versioned hooks
  execFileSync('git', ['-C', dir, 'rev-parse', '--git-dir']);
  const hooksPath = execFileSync('git', ['-C', dir, 'config', 'core.hooksPath'])
    .toString()
    .trim();
  assert.equal(hooksPath, '.multivac/hooks');
  for (const hook of ['pre-commit', 'pre-push']) {
    const mode = statSync(join(dir, '.multivac/hooks', hook)).mode;
    assert.ok(mode & 0o100, `${hook} must be executable`);
  }

  // config seeded from flags, loadable by the real loader
  const cfg = await loadConfig(dir);
  assert.deepEqual(cfg.doors, ['agents', 'claude']);
  assert.equal(readFileSync(join(dir, '.multivac/.gitignore'), 'utf8'), 'cache/\n');

  // door at the root with its managed block; law table and changes/ under .multivac/
  const door = readFileSync(join(dir, 'AGENTS.md'), 'utf8');
  assert.ok(door.includes('<!-- multivac:begin -->'));
  assert.ok(door.includes('<!-- multivac:end -->'));
  const inv = readFileSync(join(dir, '.multivac/invariants.md'), 'utf8');
  assert.ok(inv.includes('| ID | statement | authority | state | date | source |'));
  assert.ok(inv.includes('| --- | --- | --- | --- | --- | --- |'));
  statSync(join(dir, '.multivac/changes/.gitkeep'));

  // AGENTS.md is the one exception: everything else multivac owns is in .multivac/
  const roots = readdirSync(dir).filter((n) => n !== '.git');
  assert.deepEqual(roots.sort(), ['.multivac', 'AGENTS.md']);
});

test('init migrates a brain still holding the law and changes/ at its root', async () => {
  const dir = tmp();
  execFileSync('git', ['-C', dir, 'init', '-q']);
  execFileSync('git', ['-C', dir, 'config', 'user.email', 'test@acme.example']);
  execFileSync('git', ['-C', dir, 'config', 'user.name', 'Acme Test']);
  writeFileSync(join(dir, 'invariants.md'), '# Invariants\n\n| INV-01 | old law |\n');
  mkdirSync(join(dir, 'changes/archive'), { recursive: true });
  writeFileSync(join(dir, 'changes/archive/old.md'), 'archived\n');
  execFileSync('git', ['-C', dir, 'add', '-A'], { stdio: 'ignore' });
  execFileSync('git', ['-C', dir, 'commit', '-qm', 'legacy layout'], { stdio: 'ignore' });

  assert.equal(await init.run([], { cwd: dir }), 0);
  assert.match(readFileSync(join(dir, '.multivac/invariants.md'), 'utf8'), /old law/);
  assert.equal(readFileSync(join(dir, '.multivac/changes/archive/old.md'), 'utf8'), 'archived\n');
  assert.deepEqual(readdirSync(dir).filter((n) => n !== '.git').sort(), ['.multivac', 'AGENTS.md']);
  // git mv, so the move is staged as a rename and history follows the file
  const staged = execFileSync('git', ['-C', dir, 'diff', '--cached', '--name-status', '-M']).toString();
  assert.match(staged, /^R.*invariants\.md\t\.multivac\/invariants\.md$/m);
  // and the migrated brain loads
  assert.equal((await loadConfig(dir)).doors.length, 1);
});

test('a brain holding both layouts is refused, by init and by every loader', async () => {
  const dir = tmp();
  await init.run([], { cwd: dir });
  writeFileSync(join(dir, 'invariants.md'), '# a second law\n');

  assert.equal(await init.run([], { cwd: dir }), 1, 'init refuses to guess');
  await assert.rejects(loadConfig(dir), /has both invariants\.md and \.multivac\/invariants\.md/);
  const { exit, lines } = await doctorReport(dir);
  assert.equal(exit, 1);
  assert.match(lines.join('\n'), /has both invariants\.md and \.multivac\/invariants\.md/);
});

test('doctor names the migration command for a legacy brain', async () => {
  const dir = tmp();
  await init.run([], { cwd: dir });
  renameSync(join(dir, '.multivac/invariants.md'), join(dir, 'invariants.md'));

  const { exit, lines } = await doctorReport(dir);
  assert.equal(exit, 1);
  assert.match(lines.join('\n'), /multivac init /);
});

test('init is idempotent: second run is a zero-diff', async () => {
  const dir = tmp();
  await init.run(['--agent', 'claude', '--sdd', 'openspec'], { cwd: dir });
  const first = snapshot(dir);
  assert.equal(await init.run(['--agent', 'claude', '--sdd', 'openspec'], { cwd: dir }), 0);
  assert.deepEqual(snapshot(dir), first);
});

test('init never clobbers a pre-existing rich AGENTS.md', async () => {
  const dir = tmp();
  const rich = '# Our team door\n\nHard-won onboarding notes.\n\n## Rituals\n\n- reviews first\n';
  writeFileSync(join(dir, 'AGENTS.md'), rich);

  await init.run([], { cwd: dir });
  let door = readFileSync(join(dir, 'AGENTS.md'), 'utf8');
  assert.ok(door.startsWith(rich), 'user content preserved verbatim, block appended');
  assert.equal(door.split('<!-- multivac:begin -->').length, 2, 'exactly one block');

  // re-run: block replaced in place, still exactly one, user content intact
  await init.run([], { cwd: dir });
  door = readFileSync(join(dir, 'AGENTS.md'), 'utf8');
  assert.ok(door.startsWith(rich));
  assert.equal(door.split('<!-- multivac:begin -->').length, 2);
  assert.equal(door.split('<!-- multivac:end -->').length, 2);
});

test('init detects artifacts and proposes them as config comments', async () => {
  const dir = tmp();
  mkdirSync(join(dir, 'graphify-out'), { recursive: true });
  mkdirSync(join(dir, 'openspec'), { recursive: true });
  writeFileSync(join(dir, 'CLAUDE.md'), '# existing\n');

  await init.run([], { cwd: dir });
  const cfg = readFileSync(join(dir, '.multivac/config.yml'), 'utf8');
  assert.match(cfg, /^doors: \[agents\]$/m, 'default is no projection');
  assert.match(cfg, /^# grapher: graphify$/m, 'detected grapher proposed, not enacted');
  // registry name is opsx; openspec/ is the artifact dir it is detected by
  assert.match(cfg, /^# sdd: opsx$/m, 'detected sdd proposed, not enacted');
  assert.match(cfg, /^# doors: \[agents, claude\]$/m, 'detected door proposed');
  // proposals are comments: the loaded config carries none of them
  const loaded = await loadConfig(dir);
  assert.equal(loaded.grapher, undefined);
  assert.equal(loaded.sdd, undefined);
});

test('init keeps an existing config.yml untouched', async () => {
  const dir = tmp();
  await init.run(['--sdd', 'openspec'], { cwd: dir });
  const before = readFileSync(join(dir, '.multivac/config.yml'), 'utf8');
  await init.run(['--sdd', 'other', '--agent', 'cursor'], { cwd: dir });
  assert.equal(readFileSync(join(dir, '.multivac/config.yml'), 'utf8'), before);
});
