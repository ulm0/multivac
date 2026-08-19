import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  renameSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { doctorReport } from '../../src/commands/doctor.js';
import { init } from '../../src/commands/init.js';
import { doorsCommand } from '../../src/commands/doors.js';
import { layoutError, loadConfig } from '../../src/lib/config.js';
import { gitInit } from '../helpers/fixture.js';

const tmp = (): string => mkdtempSync(join(tmpdir(), 'mvac-init-'));

const capture = async (fn: () => Promise<number>): Promise<{ code: number; out: string }> => {
  const lines: string[] = [];
  const orig = console.log;
  console.log = (l: string) => lines.push(String(l));
  try {
    return { code: await fn(), out: lines.join('\n') };
  } finally {
    console.log = orig;
  }
};

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
  assert.equal(await init.run(['--provider', 'claude'], { cwd: dir }), 0);

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
  assert.equal(
    readFileSync(join(dir, '.multivac/.gitignore'), 'utf8'),
    'cache/\nworktrees/\n',
  );

  // door at the root with its managed block; law table and changes/ under .multivac/
  const door = readFileSync(join(dir, 'AGENTS.md'), 'utf8');
  assert.ok(door.includes('<!-- multivac:begin -->'));
  assert.ok(door.includes('<!-- multivac:end -->'));
  const inv = readFileSync(join(dir, '.multivac/invariants.md'), 'utf8');
  assert.ok(inv.includes('| ID | statement | authority | state | date | source |'));
  assert.ok(inv.includes('| --- | --- | --- | --- | --- | --- |'));
  statSync(join(dir, '.multivac/changes/.gitkeep'));

  // Everything multivac owns lives in .multivac/, except the doors themselves:
  // AGENTS.md always, plus whatever the declared harnesses read. `--provider
  // claude` PROJECTS claude — it does not merely write the name into config and
  // leave the user to discover that a second command was owed. init used to
  // end by telling you to load a skill it had not installed.
  const roots = readdirSync(dir).filter((n) => n !== '.git');
  assert.deepEqual(roots.sort(), ['.claude', '.multivac', 'AGENTS.md', 'CLAUDE.md']);
  statSync(join(dir, '.claude/skills/multivac/SKILL.md'));
  statSync(join(dir, '.claude/skills/multivac/references/verify.md'));
});

test('init with no provider writes only the canonical door — nothing to project', async () => {
  // The other half of the same rule: projecting is what was DECLARED, so a
  // bare init stays exactly as small as it was.
  const dir = tmp();
  assert.equal(await init.run([], { cwd: dir }), 0);
  const roots = readdirSync(dir).filter((n) => n !== '.git');
  assert.deepEqual(roots.sort(), ['.multivac', 'AGENTS.md']);
});

const LAW_TABLE = `# Invariants

| ID | statement | authority | state | date | source |
| --- | --- | --- | --- | --- | --- |
| INV-01 | old law | specified | active | 2026-01-01 | design |
`;

const CHANGE_FILE = `---
slug: old
status: archived
repos: {}
landing_order: []
invariants: { touches: [], adds: [], retires: [] }
claims: []
---

# An old change
`;

/** A brain from before the move: config where it always was, law and changes at the root. */
function legacyBrain(): string {
  const dir = tmp();
  gitInit(dir);
  execFileSync('git', ['-C', dir, 'config', 'user.email', 'test@acme.example']);
  execFileSync('git', ['-C', dir, 'config', 'user.name', 'Acme Test']);
  mkdirSync(join(dir, '.multivac'), { recursive: true });
  writeFileSync(join(dir, '.multivac/config.yml'), 'doors: [agents]\n');
  writeFileSync(join(dir, 'invariants.md'), LAW_TABLE);
  mkdirSync(join(dir, 'changes/archive'), { recursive: true });
  writeFileSync(join(dir, 'changes/archive/old.md'), CHANGE_FILE);
  execFileSync('git', ['-C', dir, 'add', '-A'], { stdio: 'ignore' });
  execFileSync('git', ['-C', dir, 'commit', '-qm', 'legacy layout'], { stdio: 'ignore' });
  return dir;
}

test('init migrates a brain still holding the law and changes/ at its root', async () => {
  const dir = legacyBrain();

  const { code, out } = await capture(() => init.run([], { cwd: dir }));
  assert.equal(code, 0);
  // loud: every path is named before anything moves
  const plan = out.slice(0, out.indexOf('init: moved'));
  assert.match(plan, /invariants\.md -> \.multivac\/invariants\.md/);
  assert.match(plan, /changes -> \.multivac\/changes/);

  assert.match(readFileSync(join(dir, '.multivac/invariants.md'), 'utf8'), /old law/);
  assert.equal(readFileSync(join(dir, '.multivac/changes/archive/old.md'), 'utf8'), CHANGE_FILE);
  assert.deepEqual(readdirSync(dir).filter((n) => n !== '.git').sort(), ['.multivac', 'AGENTS.md']);
  // git mv, so the move is staged as a rename and history follows the file
  const staged = execFileSync('git', ['-C', dir, 'diff', '--cached', '--name-status', '-M']).toString();
  assert.match(staged, /^R.*invariants\.md\t\.multivac\/invariants\.md$/m);
  // and the migrated brain loads
  assert.equal((await loadConfig(dir)).doors.length, 1);
});

test('init never migrates files multivac did not write', async () => {
  // Somebody else's repo: `changes/` is their changelog, `invariants.md` a design note.
  const dir = tmp();
  const theirLaw = '# Invariants\n\nOur three product invariants, in prose.\n';
  const theirNotes = 'Q1 2026 release notes.\n';
  writeFileSync(join(dir, 'invariants.md'), theirLaw);
  mkdirSync(join(dir, 'changes'), { recursive: true });
  writeFileSync(join(dir, 'changes/2026-Q1.md'), theirNotes);

  assert.equal(await init.run([], { cwd: dir }), 0);

  // byte for byte, and still at the root
  assert.equal(readFileSync(join(dir, 'invariants.md'), 'utf8'), theirLaw);
  assert.equal(readFileSync(join(dir, 'changes/2026-Q1.md'), 'utf8'), theirNotes);
  // multivac's own law landed beside theirs, not on top of it
  assert.match(readFileSync(join(dir, '.multivac/invariants.md'), 'utf8'), /\| ID \| statement \|/);
  // and their files are not a defect: nothing reports a layout problem, ever
  assert.equal(await layoutError(dir), null);
  assert.equal((await doctorReport(dir)).exit, 0);
  assert.equal(await init.run([], { cwd: dir }), 0, 'still a steady state on re-run');
});

test('a doc that only quotes the law header is not the law', async () => {
  const dir = tmp();
  gitInit(dir);
  mkdirSync(join(dir, '.multivac'), { recursive: true });
  writeFileSync(join(dir, '.multivac/config.yml'), 'doors: [agents]\n');
  // Their design note explains multivac's schema inside a fence. Still theirs.
  const theirNote = `# How the law table looks\n\n\`\`\`\n${LAW_TABLE}\`\`\`\n\nOur notes.\n`;
  writeFileSync(join(dir, 'invariants.md'), theirNote);

  assert.equal(await layoutError(dir), null);
  assert.equal(await init.run([], { cwd: dir }), 0);
  assert.equal(readFileSync(join(dir, 'invariants.md'), 'utf8'), theirNote);
});

test('a symlink at changes/ is never migrated', async () => {
  const dir = tmp();
  gitInit(dir);
  mkdirSync(join(dir, '.multivac'), { recursive: true });
  writeFileSync(join(dir, '.multivac/config.yml'), 'doors: [agents]\n');
  // Their changes/ is a link into the repo: moving it would dangle the target.
  mkdirSync(join(dir, 'docs/real-changes'), { recursive: true });
  writeFileSync(join(dir, 'docs/real-changes/old.md'), CHANGE_FILE);
  symlinkSync('docs/real-changes', join(dir, 'changes'));

  assert.equal(await layoutError(dir), null);
  assert.equal(await init.run([], { cwd: dir }), 0);
  assert.equal(readlinkSync(join(dir, 'changes')), 'docs/real-changes');
  assert.equal(readFileSync(join(dir, 'docs/real-changes/old.md'), 'utf8'), CHANGE_FILE);
});

test('only two files that both read as multivac law are ambiguous', async () => {
  const dir = tmp();
  await init.run([], { cwd: dir });
  writeFileSync(join(dir, 'invariants.md'), LAW_TABLE);

  const expected = /both invariants\.md and \.multivac\/invariants\.md read as multivac's own/;
  assert.equal(await init.run([], { cwd: dir }), 1, 'init refuses to guess');
  await assert.rejects(loadConfig(dir), expected);
  const { exit, lines } = await doctorReport(dir);
  assert.equal(exit, 1);
  // says which one wins and how to resolve it
  assert.match(lines.join('\n'), expected);
  assert.match(lines.join('\n'), /multivac uses \.multivac\/invariants\.md and ignores invariants\.md/);
  assert.match(lines.join('\n'), /rename invariants\.md if it is yours to keep/);
  // and the refusal moved nothing
  assert.equal(readFileSync(join(dir, 'invariants.md'), 'utf8'), LAW_TABLE);
});

test('a half-migrated brain moves nothing: an occupied target is a refusal', async () => {
  const dir = legacyBrain();
  // half-migrated by hand: the changes already moved, the law did not
  mkdirSync(join(dir, '.multivac/changes'), { recursive: true });
  writeFileSync(join(dir, '.multivac/changes/kept.md'), CHANGE_FILE);

  // both sides read as multivac's: unresolvable, so nothing moves at all
  assert.equal(await init.run([], { cwd: dir }), 1);
  assert.equal(readFileSync(join(dir, 'changes/archive/old.md'), 'utf8'), CHANGE_FILE);
  assert.equal(readFileSync(join(dir, '.multivac/changes/kept.md'), 'utf8'), CHANGE_FILE);
  assert.equal(readFileSync(join(dir, 'invariants.md'), 'utf8'), LAW_TABLE);
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
  await init.run(['--provider', 'claude', '--sdd', 'opsx'], { cwd: dir });
  const first = snapshot(dir);
  assert.equal(await init.run(['--provider', 'claude', '--sdd', 'opsx'], { cwd: dir }), 0);
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

test('init carries the sdd project law into the door it writes', async () => {
  // `doors` is a second, separate command. A constitution the agent is only
  // told about after someone remembers to run it is one nobody writes.
  const dir = tmp();
  await init.run(['--sdd', 'speckit'], { cwd: dir });
  const door = readFileSync(join(dir, 'AGENTS.md'), 'utf8');
  assert.match(door, /project law `\.specify\/memory\/constitution\.md`/);
  assert.match(door, /CREATE IT IF ABSENT/);
  assert.match(door, /revisit: once at start/);

  // opsx has none, and the gap is stated rather than invented.
  const other = tmp();
  await init.run(['--sdd', 'opsx'], { cwd: other });
  assert.match(
    readFileSync(join(other, 'AGENTS.md'), 'utf8'),
    /this tool has no project-level document/,
  );

  // No sdd, no section — nothing invented for a brain that declared none.
  const bare = tmp();
  await init.run([], { cwd: bare });
  assert.doesNotMatch(readFileSync(join(bare, 'AGENTS.md'), 'utf8'), /project law/);
});

test('init closes on the session-zero call to action, its branch already decided', async () => {
  // Nothing tracked: no ecosystem to read, so the law has to come from a human.
  const bare = await capture(() => init.run([], { cwd: tmp() }));
  assert.match(bare.out, /init: done — the brain is scaffolded and empty/);
  assert.match(bare.out, /1\. load the multivac skill/);
  assert.match(bare.out, /2\. interview/);
  assert.doesNotMatch(bare.out, /discovery/);

  // Tracked source: there is an ecosystem to inventory, so `seed` leads.
  const code = tmp();
  gitInit(code);
  writeFileSync(join(code, 'index.ts'), 'export const one = 1;\n');
  execFileSync('git', ['add', 'index.ts'], { cwd: code });
  const seeded = await capture(() => init.run([], { cwd: code }));
  assert.match(seeded.out, /2\. discovery — `multivac seed`/);
  assert.doesNotMatch(seeded.out, /interview/);
});

test('init keeps an existing config.yml untouched', async () => {
  // Both names are registry names now: MV-114 refuses one that is not, so a
  // fixture naming a fiction would fail for the wrong reason.
  const dir = tmp();
  await init.run(['--sdd', 'opsx'], { cwd: dir });
  const before = readFileSync(join(dir, '.multivac/config.yml'), 'utf8');
  await init.run(['--sdd', 'speckit', '--provider', 'cursor'], { cwd: dir });
  assert.equal(readFileSync(join(dir, '.multivac/config.yml'), 'utf8'), before);
});

test('the scaffolded door names the declared grapher — MV-102', async () => {
  // The door a fresh brain gets is the door `doors` maintains, so what MV-90
  // put in it reaches the first reader rather than the second command's reader.
  const dir = tmp();
  assert.equal(await init.run(['--grapher', 'graphify', '--quiet', dir], { cwd: dir }), 0);

  const door = readFileSync(join(dir, 'AGENTS.md'), 'utf8');
  assert.match(door, /graphify/);
  assert.match(door, /graphify query/);
});

test('the scaffolded door lists the declared sibling repos — MV-102', async () => {
  const dir = tmp();
  assert.equal(await init.run(['--quiet', dir], { cwd: dir }), 0);
  const cfg = join(dir, '.multivac', 'config.yml');
  writeFileSync(cfg, `${readFileSync(cfg, 'utf8')}\nrepos:\n  api: ../acme-api\n`);

  assert.equal(await init.run(['--quiet', dir], { cwd: dir }), 0);

  assert.match(readFileSync(join(dir, 'AGENTS.md'), 'utf8'), /- api: \.\.\/acme-api/);
});

test('a brain with no rows still says it is empty — MV-102', async () => {
  const dir = tmp();
  assert.equal(await init.run(['--quiet', dir], { cwd: dir }), 0);

  assert.match(readFileSync(join(dir, 'AGENTS.md'), 'utf8'), /brain empty — load the multivac skill to fill it/);
});

test('the equals form is accepted again — MV-105', async () => {
  // 0.8.0 accepted `--provider=claude` and wrote it to disk; 0.9.0 refused it
  // with exit 2 and called the flag unknown. The guard compared whole tokens
  // while the parser behind it splits on `=`, so the parser was never reached.
  const dir = tmp();
  assert.equal(await init.run(['--provider=claude', '--sdd=speckit', '--quiet', dir], { cwd: dir }), 0);

  const cfg = readFileSync(join(dir, '.multivac', 'config.yml'), 'utf8');
  assert.match(cfg, /claude/, 'the provider written by the equals form is missing');
  assert.match(cfg, /speckit/, 'the sdd written by the equals form is missing');
});

test('the two written forms of a valued flag agree — MV-105', async () => {
  const a = tmp();
  const b = tmp();
  assert.equal(await init.run(['--provider', 'claude', '--quiet', a], { cwd: a }), 0);
  assert.equal(await init.run(['--provider=claude', '--quiet', b], { cwd: b }), 0);

  assert.equal(
    readFileSync(join(a, '.multivac', 'config.yml'), 'utf8'),
    readFileSync(join(b, '.multivac', 'config.yml'), 'utf8'),
  );
});

test('a valued flag with no value is refused, not defaulted — MV-105', async () => {
  const dir = tmp();
  assert.equal(await init.run(['--provider', '--quiet', dir], { cwd: dir }), 2);
  assert.deepEqual(readdirSync(dir), [], 'init wrote before refusing');
});

test('the closing report names the commit that unblocks the next command — MV-111', async () => {
  // init scaffolds everything UNTRACKED, and `change new` refuses while its
  // bookkeeping paths are unclean — so the very next lifecycle command in a
  // fresh brain always refused, and the one place a stranger is looking never
  // mentioned the commit that unblocks it.
  const dir = tmp();
  const c = await capture(() => init.run([dir], { cwd: dir }));

  assert.equal(c.code, 0);
  assert.match(c.out, /0\. commit what was just written/);
  assert.match(c.out, /git add -A && git commit/);
});

test('init refuses a config it cannot read, and the gate stays armed — MV-114', async () => {
  // The measurement: a strict pre-push shim went from three `verify --strict`
  // lines to zero after `init .` — the line doctor itself prints — because a
  // broken config was read as no config and every projection was re-rendered
  // from nothing. `doors` in the same state exited 1 and left the gate armed.
  const dir = tmp();
  gitInit(dir);
  assert.equal((await capture(() => init.run(['--quiet', dir], { cwd: dir }))).code, 0);
  const cfg = join(dir, '.multivac/config.yml');
  writeFileSync(cfg, `${readFileSync(cfg, 'utf8')}\nstrict_pre_push: true\n`);
  await capture(() => doorsCommand.run([], { cwd: dir }));
  const armed = readFileSync(join(dir, '.multivac/hooks/pre-push'), 'utf8');
  assert.match(armed, /verify --strict/, 'the fixture never armed the gate');

  writeFileSync(cfg, `${readFileSync(cfg, 'utf8')}\nrepos: [not a map\n`);
  assert.equal((await capture(() => init.run(['--quiet', dir], { cwd: dir }))).code, 1, 'init proceeded on a broken config');

  assert.equal(
    readFileSync(join(dir, '.multivac/hooks/pre-push'), 'utf8'),
    armed,
    'init rewrote the shim from a config it could not read',
  );
});

test('an unknown adapter name is refused before anything is written — MV-114', async () => {
  const dir = tmp();
  assert.equal((await capture(() => init.run(['--sdd', 'speckti', '--quiet', dir], { cwd: dir }))).code, 2);
  assert.deepEqual(readdirSync(dir), [], 'it wrote before refusing');
  // And the empty value in either written form, which used to exit 1.
  assert.equal((await capture(() => init.run(['--sdd=', '--quiet', dir], { cwd: dir }))).code, 2);
  assert.equal((await capture(() => init.run(['--grapher', '', '--quiet', dir], { cwd: dir }))).code, 2);
});
