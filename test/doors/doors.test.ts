import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { gitInit, makeScratchEcosystem } from '../helpers/fixture.js';
import { doorsCommand, installSkill } from '../../src/commands/doors.js';
import { installHooks } from '../../src/hooks/install.js';
import { countActiveInvariants, renderBrainDoor } from '../../src/doors/brain.js';
import type { Config } from '../../src/types.js';

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
  assert.match(apiDoor, /\.brain\/\.multivac\/invariants\.md/);
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
  writeFileSync(join(eco.brain, '.multivac/invariants.md'), `# Invariants\n\n${table}`);

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
  gitInit(dir);
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

test('brain door carries the SDD flow when one is declared', () => {
  const cfg: Config = {
    doors: ['agents'],
    sdd: 'opsx',
    sddAuto: true,
    authorities: [],
    blocking: ['absent', 'count', 'each'],
    staleness: 'report',
    strictPrePush: false,
    mount: '.brain',
    graphers: {},
    repos: {},
  };
  const door = renderBrainDoor(cfg, 1);
  assert.match(door, /Features gate through the `opsx` SDD, in that tool's OWN flow/);
  // Every step: what to run, and what will PROVE it ran.
  assert.match(door, /`change new` → run \/opsx:propose <slug> in your agent/);
  assert.match(door, /proof: openspec\/changes\/<slug>\/proposal\.md — `change plan` refuses/);
  assert.match(door, /`change apply` → run \/opsx:apply <slug> in your agent/);
  assert.match(door, /ungateable: apply leaves no artifact of its own/);
  // The archive-equivalent is printed a step BEFORE the gate that needs it.
  assert.match(door, /`change land` → run \/opsx:archive <slug> in your agent/);
  assert.match(door, /`change close` refuses without it/);
  // OpenSpec has no project-level document; that gap is stated, not invented.
  assert.match(door, /this tool has no project-level document/);
  // sdd_auto off: the flow still binds, the door says to run it unprompted
  assert.match(renderBrainDoor({ ...cfg, sddAuto: false }, 1), /run each step yourself/);

  // spec-kit: a longer flow, and a constitution the agent must create if absent
  const speckit = renderBrainDoor({ ...cfg, sdd: 'speckit' }, 1);
  assert.match(speckit, /project law `\.specify\/memory\/constitution\.md`/);
  assert.match(speckit, /run \/speckit\.constitution in your agent/);
  // …and the half that makes the imperative worth printing: the door names
  // what REFUSES, exactly as every per-change step line names its proof
  // (MV-76). Capitals alone are the discipline-nothing-verifies this tool
  // exists to end, and this line was that for as long as it existed.
  assert.match(
    speckit,
    /CREATE IT IF ABSENT — `change plan` refuses while it is missing, empty or still the template\./,
  );
  assert.match(speckit, /revisit: once at start, then on every principle change/);
  assert.match(speckit, /`change plan` → run \/speckit\.tasks in your agent/);
  // no close step at all: spec-kit has no archive equivalent to print
  assert.doesNotMatch(speckit, /`change close` →/);
  // no sdd declared: no flow lines at all
  assert.doesNotMatch(renderBrainDoor({ ...cfg, sdd: undefined }, 1), /SDD/);
});

// The graph refresh follows the AGENT: it rides the harness's post-edit hook,
// never the git shim. `node` stands in for a grapher here — it is the one
// binary certainly on PATH, so `grapher: node` is "declared and present".
test('grapher declared + present: harness post-edit entry, git shim untouched', async () => {
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    'doors: [agents, claude]\ngrapher: node\ngraphers:\n  node:\n    artifact: node-out/graph.json\n    refresh: node --version\nrepos:\n  api: ../acme-api\n',
  );
  const { code } = await runDoors();
  assert.equal(code, 0);

  for (const dir of [eco.brain, eco.repos.api]) {
    const hooks = JSON.parse(read(dir, '.claude/settings.json')).hooks as Record<
      string,
      { matcher?: string; hooks: { command: string }[] }[]
    >;
    const refresh = hooks.PostToolUse.map((e) => e.hooks[0].command).find((c) =>
      c.includes('node --version'),
    );
    assert.ok(refresh, 'post-edit refresh entry written');
    assert.match(refresh!, /graph-refresh\.lock/); // coalesced
    assert.match(refresh!, /& exit 0$/); // backgrounded, never a failure
    assert.equal(
      hooks.PostToolUse.find((e) => e.hooks[0].command.includes('node --version'))!.matcher,
      'Edit|Write|MultiEdit',
    );
    // the git shims stay verify-only — no grapher ever runs on the commit path
    for (const hook of ['pre-commit', 'pre-push']) {
      const shim = read(dir, `.multivac/hooks/${hook}`);
      assert.doesNotMatch(shim, /node --version|graph/);
      assert.match(shim, /mvac verify/);
    }
  }
});

// MV-73. `pnpm test` runs from the repo root, so the packaged skill `doors`
// projects from is `skills/multivac` right here — the same tree MV-72 pins the
// committed copy against.
const SKILL_SRC = 'skills/multivac';
const projected = join(eco.repos.api, '.claude/skills/multivac');
const skills = join(eco.repos.api, '.claude/skills');

/** Relative paths of every file under `root`, sorted. */
function tree(root: string): string[] {
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => relative(root, join(e.parentPath, e.name)))
    .sort();
}

async function doorsWithSkills(): Promise<void> {
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    'doors: [agents, claude]\nrepos:\n  api: ../acme-api\n',
  );
  assert.equal((await runDoors()).code, 0);
}

test('a file the source no longer has is deleted from the copy (MV-73)', async () => {
  await doorsWithSkills(); // first run: the copy exists and matches
  assert.deepEqual(tree(projected), tree(SKILL_SRC));

  // A file retired from the source, a whole directory retired with it, a file
  // a user added, and a projected file edited in place. On disk nothing tells
  // them apart, and the mirror does not try: the source decides all four.
  writeFileSync(join(projected, 'references/STALE.md'), '# retired page\n');
  mkdirSync(join(projected, 'old/deeper'), { recursive: true });
  writeFileSync(join(projected, 'old/deeper/gone.md'), '# from an old version\n');
  writeFileSync(join(projected, 'USER.md'), '# my own notes\n');
  writeFileSync(join(projected, 'SKILL.md'), '# edited by hand\n');

  await doorsWithSkills();

  assert.ok(!existsSync(join(projected, 'references/STALE.md')), 'retired file removed');
  assert.ok(!existsSync(join(projected, 'old')), 'retired directory removed with its subtree');
  assert.ok(!existsSync(join(projected, 'USER.md')), 'a file nobody shipped is not ours to keep');
  assert.equal(read(projected, 'SKILL.md'), read(SKILL_SRC, 'SKILL.md'));
  // The whole tree, not just the four plants: same file list, same bytes.
  assert.deepEqual(tree(projected), tree(SKILL_SRC));
  for (const rel of tree(SKILL_SRC)) {
    assert.deepEqual(readFileSync(join(projected, rel)), readFileSync(join(SKILL_SRC, rel)));
  }

  // Idempotent: the run after a correct mirror removes nothing.
  await doorsWithSkills();
  assert.deepEqual(tree(projected), tree(SKILL_SRC));
});

test('a file standing where the source has a directory is resolved, not copied over', async () => {
  rmSync(join(projected, 'references'), { recursive: true, force: true });
  writeFileSync(join(projected, 'references'), 'a file with a directory\'s name\n');

  await doorsWithSkills();

  assert.ok(statSync(join(projected, 'references')).isDirectory());
  assert.deepEqual(tree(projected), tree(SKILL_SRC));
});

// The bound, and the reason it is load-bearing: `specify init --here` installs
// ten sibling skills into this very parent. A prune that walked
// `.claude/skills/` instead of `.claude/skills/multivac/` would delete another
// tool's installation as a side effect of writing a door.
test('sibling skills under the same parent survive — the prune never walks the parent', async () => {
  mkdirSync(join(skills, 'speckit-specify'), { recursive: true });
  writeFileSync(join(skills, 'speckit-specify/SKILL.md'), '# speckit specify\n');
  mkdirSync(join(skills, 'speckit-plan/references'), { recursive: true });
  writeFileSync(join(skills, 'speckit-plan/references/plan.md'), '# speckit plan\n');
  writeFileSync(join(skills, 'README.md'), '# what lives in this directory\n');

  await doorsWithSkills();

  assert.equal(read(skills, 'speckit-specify/SKILL.md'), '# speckit specify\n');
  assert.equal(read(skills, 'speckit-plan/references/plan.md'), '# speckit plan\n');
  assert.equal(read(skills, 'README.md'), '# what lives in this directory\n');
  // and the door's own AGENTS.md, one level further out again, is untouched
  assert.match(read(eco.repos.api, 'AGENTS.md'), /consumer door|multivac:begin/);
});

// The other half of the mirror: a run with nothing to mirror FROM. `files:` in
// package.json could stop shipping `skills`, an install could be half
// unpacked — and a prune that ran anyway would empty a user's skill directory
// over a broken install of multivac, this tool doing the damage it reports.
// `installSkill` takes the source so the branch is reachable here; the suite
// itself always runs out of a tree that has the skill.
test('a missing packaged skill leaves the projected directory alone', async () => {
  await doorsWithSkills();
  assert.deepEqual(tree(projected), tree(SKILL_SRC));
  writeFileSync(join(projected, 'USER.md'), '# mine\n');

  const notices: string[] = [];
  installSkill(
    eco.repos.api,
    '.claude/skills/multivac/SKILL.md',
    notices,
    join(eco.brain, 'no-such-install/skills/multivac'),
  );

  assert.deepEqual(tree(projected), [...tree(SKILL_SRC), 'USER.md'].sort());
  assert.equal(read(projected, 'SKILL.md'), read(SKILL_SRC, 'SKILL.md'));
  assert.match(notices.join('\n'), /packaged skill skills\/multivac missing/);

  // and a run that DOES have the source mirrors again, USER.md included
  await doorsWithSkills();
  assert.deepEqual(tree(projected), tree(SKILL_SRC));
});

test('no grapher declared: no refresh entry at all', async () => {
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    'doors: [agents, claude]\nrepos:\n  api: ../acme-api\n',
  );
  assert.equal((await runDoors()).code, 0);
  for (const dir of [eco.brain, eco.repos.api]) {
    const settings = read(dir, '.claude/settings.json');
    assert.doesNotMatch(settings, /graph-refresh\.lock/);
    assert.match(settings, /mvac verify/);
  }
});

// What the merge sees and refuses to settle has to REACH the human: a notice
// computed and dropped on the floor is the silence this change exists to end.
test('a duplicate gate left by an older doors is printed, and nothing is deleted', async () => {
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    'doors: [agents, claude]\nrepos:\n  api: ../acme-api\n',
  );
  const settingsFile = join(eco.brain, '.claude', 'settings.json');
  mkdirSync(join(eco.brain, '.claude'), { recursive: true });
  const entry = {
    matcher: 'Edit|Write|MultiEdit',
    hooks: [{ type: 'command', command: 'mvac verify' }],
  };
  writeFileSync(settingsFile, JSON.stringify({ hooks: { PostToolUse: [entry, entry] } }));

  const { code, out } = await runDoors();
  assert.equal(code, 0);
  const notice = out.find((l) => l.includes('runs `mvac verify` 2 times'));
  assert.ok(notice, out.join('\n')); // it reaches the printed output
  assert.match(notice!, /^brain: notice: /);
  assert.match(notice!, /by hand/); // and says who removes it
  assert.equal(JSON.parse(read(settingsFile)).hooks.PostToolUse.length, 2); // deleted nothing
});
