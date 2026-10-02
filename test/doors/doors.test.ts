import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { gitInit, makeScratchEcosystem } from '../helpers/fixture.js';
import { doorsCommand, installSkill } from '../../src/commands/doors.js';
import { installHooks } from '../../src/hooks/install.js';
import { countActiveInvariants, renderBrainDoor } from '../../src/doors/brain.js';
import { renderConsumerDoor } from '../../src/doors/consumer.js';
import { sddSpec } from '../../src/adapters/registry.js';
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
  assert.equal(merged.hooks.SessionStart[0].hooks[0].command, 'mvac verify 2>&1 || true');
});

test('cursor reads AGENTS.md: nothing projected, and the old stub retired — MV-143', async () => {
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    'doors: [agents, cursor]\nrepos:\n  api: ../acme-api\n',
  );
  // A rules file from the version that projected one: block only, plus the head
  // multivac wrote itself.
  const stubPath = join(eco.brain, '.cursor/rules/multivac.mdc');
  mkdirSync(dirname(stubPath), { recursive: true });
  writeFileSync(
    stubPath,
    '---\ndescription: multivac door — ecosystem law, brain location\nalwaysApply: true\n---\n\n<!-- multivac:begin -->\nRead `AGENTS.md`\n<!-- multivac:end -->\n',
  );
  const { code, out } = await runDoors();
  assert.equal(code, 0);
  assert.ok(!out.some((l) => l.includes('unknown door target')), out.join('\n'));
  assert.equal(existsSync(stubPath), false, 'the retired rules file is gone');
  assert.ok(
    out.some((l) => l.includes('.cursor/rules/multivac.mdc removed — this harness reads AGENTS.md')),
    out.join('\n'),
  );
  // The canonical door is where cursor reads, and it carries the door.
  assert.match(read(eco.brain, 'AGENTS.md'), /multivac:begin/);
  // A second run has nothing left to remove and says nothing about it.
  const again = await runDoors();
  assert.ok(!again.out.some((l) => l.includes('.cursor/rules/multivac.mdc')), again.out.join('\n'));
});

test("a retired rules file keeps the operator's own lines — MV-108, MV-143", async () => {
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    'doors: [agents, cursor]\nrepos:\n  api: ../acme-api\n',
  );
  const stubPath = join(eco.brain, '.cursor/rules/multivac.mdc');
  mkdirSync(dirname(stubPath), { recursive: true });
  writeFileSync(
    stubPath,
    '<!-- multivac:begin -->\nRead `AGENTS.md`\n<!-- multivac:end -->\n\nmy own rule: never touch main\n',
  );
  const { out } = await runDoors();
  assert.equal(existsSync(stubPath), true, 'a file with the operator\'s text survives');
  const left = read(eco.brain, '.cursor/rules/multivac.mdc');
  assert.match(left, /my own rule: never touch main/);
  assert.doesNotMatch(left, /multivac:begin/);
  assert.ok(
    out.some((l) => l.includes('.cursor/rules/multivac.mdc: managed block removed; the rest is yours')),
    out.join('\n'),
  );
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
    dropped: [],
    repos: {},
  };
  const door = renderBrainDoor(cfg, 1);
  assert.match(door, /Features gate through the `opsx` SDD, in that tool's OWN flow/);
  // Every step: what to run, and what will PROVE it ran — the path alone, or
  // `[ungateable]` (MV-146): the reason is the lifecycle's, doctor's and
  // flow.md's to print whole, where the step comes up.
  assert.match(door, /^ {2}- `change new` → in the brain checkout run `openspec new change <slug> --json`, .*\[proof: openspec\/changes\/<slug>\/proposal\.md\]$/m);
  assert.match(door, /^ {2}- `change apply` → where openspec\/changes\/<slug>\/ is .*run `openspec instructions apply --change <slug> --json` .*\[ungateable\]$/m);
  assert.doesNotMatch(door, /ungateable: apply leaves no artifact of its own/);
  // The archive-equivalent is printed a step BEFORE the gate that needs it.
  assert.match(door, /^ {2}- `change land` → after the merge, in the brain checkout .*run `openspec archive <slug> --json` to merge .*\[proof: openspec\/changes\/archive\/<n>-<n>-<n>-<slug>\]$/m);
  assert.doesNotMatch(door, /refuses without it/);
  // OpenSpec has no project-level document; that gap is stated, not invented.
  assert.match(door, /project context `openspec\/config\.yaml` `context:` — .*Optional: reported, never gated\./);
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
  assert.match(speckit, /`change plan` → run \/speckit\.tasks in your agent to break <slug> into phased tasks \[proof: specs\/<n>-<slug>\/tasks\.md\]$/m);
  assert.match(speckit, /`change apply` → run \/speckit\.analyze in your agent .* \[ungateable\]$/m);
  // no close step at all: spec-kit has no archive equivalent to print
  assert.doesNotMatch(speckit, /`change close` →/);
  // no sdd declared: no flow lines at all
  assert.doesNotMatch(renderBrainDoor({ ...cfg, sdd: undefined }, 1), /SDD/);
});

/**
 * MV-146: under `sdd_auto: false` nothing refuses, so the door says nothing
 * does. The document is still the project's law, so the imperative stays.
 */
test('under sdd_auto: false the brain door claims no refusal, and still says to create the project law', () => {
  const cfg: Config = {
    doors: ['agents'],
    sdd: 'speckit',
    sddAuto: false,
    authorities: [],
    blocking: ['absent', 'count', 'each'],
    staleness: 'report',
    strictPrePush: false,
    mount: '.brain',
    dropped: [],
    repos: {},
  };
  const door = renderBrainDoor(cfg, 1);
  assert.match(door, /project law `\.specify\/memory\/constitution\.md` — .*\. CREATE IT IF ABSENT\.$/m);
  assert.doesNotMatch(door, /refuses/);
  // The step endings are the same either way: a proof path is what the step
  // leaves, whether or not a gate asks for it.
  assert.match(door, /\[proof: specs\/<n>-<slug>\/spec\.md\]$/m);
  assert.match(door, /\[ungateable\]$/m);
  // Nor does it say the lifecycle runs the init: under `sdd_auto: false` nothing does.
  assert.doesNotMatch(door, /lifecycle runs the tool's own init/);
  assert.match(door, /no command runs the tool's own init where it is missing — run it in the brain yourself/);
  assert.match(renderBrainDoor({ ...cfg, sddAuto: true }, 1), /the change lifecycle runs the tool's own init where it is missing/);
  // Automation on: the refusal is said, where the document is named.
  assert.match(renderBrainDoor({ ...cfg, sddAuto: true }, 1), /CREATE IT IF ABSENT — `change plan` refuses while it is missing, empty or still the template\./);
});

/**
 * MV-147. The door is the one surface every session reads, and under
 * `sdd_auto: false`, `--no-sdd` or after a context reset the only one: it
 * carries each opsx step's run — openspec's own verb, `<slug>` literal, the
 * human's question on it — and never a guide, which the lifecycle prints where
 * the step comes up.
 */
test('the door carries each opsx command and no guide', () => {
  const cfg: Config = {
    doors: ['agents'],
    sdd: 'opsx',
    sddAuto: true,
    authorities: [],
    blocking: ['absent', 'count', 'each'],
    staleness: 'report',
    strictPrePush: false,
    mount: '.brain',
    dropped: [],
    repos: {},
  };
  const door = renderBrainDoor(cfg, 1);
  const steps = door.split('\n').filter((l) => /^ {2}- `change \w+` → /.test(l));
  assert.deepEqual(steps, [
    "  - `change new` → in the brain checkout run `openspec new change <slug> --json`, then write each artifact `openspec status --change <slug>` marks `[ ]` from `openspec instructions <id> --change <slug> --json`; a material ambiguity is the human's question [proof: openspec/changes/<slug>/proposal.md]",
    '  - `change plan` → keep writing each artifact `openspec status --change <slug>` marks `[ ]` from `openspec instructions <id> --change <slug> --json` until tasks.md is written [proof: openspec/changes/<slug>/tasks.md]',
    "  - `change apply` → where openspec/changes/<slug>/ is (the brain's change worktree once `change apply` carried it there), run `openspec instructions apply --change <slug> --json` before the first task and after the last; tick `- [x]` only what is fully built, until its `state` is `all_done`; scope beyond the spec is the human's question [ungateable]",
    "  - `change land` → after the merge, in the brain checkout (never a change worktree), run `openspec archive <slug> --json` to merge the deltas into openspec/specs/ and archive the change; `archive_confirmation_required` is the human's question, and a flag its `fix` names is never yours [proof: openspec/changes/archive/<n>-<n>-<n>-<slug>]",
  ]);
  assert.ok(
    steps.reduce((n, l) => n + Buffer.byteLength(`${l}\n`), 0) <= 1300,
    `${steps.join('\n')}: over 1,300 bytes`,
  );
  // No guide, whichever steps carry one: the lifecycle prints it at the step.
  const guides = (sddSpec('opsx')!.steps ?? []).flatMap((s) => (s.guide ? [s.guide] : []));
  assert.ok(guides.length > 0, 'opsx carries at least one guide');
  for (const g of guides) assert.ok(!door.includes(g), `the door carries a guide: ${g}`);
  assert.doesNotMatch(door, /opsx[:]/);
  // Under `sdd_auto: false` the lifecycle prints nothing at its points, so the
  // door is the only surface left: the runs still name the human's question.
  const off = renderBrainDoor({ ...cfg, sddAuto: false }, 1);
  const offSteps = off.split('\n').filter((l) => /^ {2}- `change \w+` → /.test(l));
  assert.equal(offSteps.length, 4, off);
  for (const at of ['new', 'apply', 'land']) {
    const l = offSteps.find((s) => s.startsWith(`  - \`change ${at}\` → `));
    assert.ok(l && l.includes("the human's question"), `${at}: ${l}`);
  }
});

/**
 * MV-146's budgets, so they cannot regress silently: the brain door's step
 * lines were 1,654 bytes for spec-kit and 951 for openspec, each restating an
 * ungateable reason the lifecycle prints where the step comes up; a code
 * repo's door carried a 2,796-byte SDD block where one line now stands.
 */
test('the doors keep the SDD within its measured byte budgets', () => {
  const cfg: Config = {
    doors: ['agents'],
    sddAuto: true,
    authorities: [],
    blocking: ['absent', 'count', 'each'],
    staleness: 'report',
    strictPrePush: false,
    mount: '.brain',
    dropped: [],
    repos: { api: { path: '../acme-api' }, web: { path: '../acme-web', sdd: 'none' } },
  };
  const bytes = (lines: string[]): number => lines.reduce((n, l) => n + Buffer.byteLength(`${l}\n`), 0);
  // MV-147: opsx's four runs grew from 646 to 1,220 bytes when they became
  // openspec's own verbs with the human's question on each — still under the
  // 2,335 bytes of command-body listing they replace in a claude session.
  for (const [sdd, budget] of [['speckit', 910], ['opsx', 1300]] as const) {
    const steps = renderBrainDoor({ ...cfg, sdd }, 1).split('\n').filter((l) => /^ {2}- `change \w+` → /.test(l));
    assert.ok(steps.length > 0, sdd);
    assert.ok(bytes(steps) <= budget, `${sdd}: ${bytes(steps)} bytes of step lines, budget ${budget}`);
    // The consumer door: what the SDD adds over an exempt repo's door, at
    // least 2,500 bytes under the block it replaced.
    const extra = Buffer.byteLength(renderConsumerDoor({ ...cfg, sdd }, 'api')) - Buffer.byteLength(renderConsumerDoor({ ...cfg, sdd }, 'web'));
    assert.ok(extra <= 2796 - 2500, `${sdd}: the consumer door carries ${extra} bytes of SDD`);
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

test('doors writes no refresh hook, whatever the config declares', async () => {
  // MV-153: an old config's grapher keys load and change nothing here.
  for (const head of ['', 'grapher: graphify\n', 'grapher: codegraph\ngrapher_auto: maybe\ngraphers:\n  none: {}\n']) {
    writeFileSync(
      join(eco.brain, '.multivac/config.yml'),
      `doors: [agents, claude]\n${head}repos:\n  api:\n    path: ../acme-api\n${head ? '    grapher: codegraph\n' : ''}`,
    );
    const { code, out } = await runDoors();
    assert.equal(code, 0, out.join('\n'));
    for (const dir of [eco.brain, eco.repos.api]) {
      const settings = read(dir, '.claude/settings.json');
      assert.doesNotMatch(settings, /graph-refresh\.lock|graphify|codegraph/);
      assert.match(settings, /mvac verify/);
    }
    assert.equal(out.some((l) => /graph refresh/.test(l)), false, out.join('\n'));
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

test('doors names the repos it gated with no mount to read — offline, never mounting — MV-127', async () => {
  // The scratch ecosystem's consumers carry no .brain gitlink.
  const { code, out } = await runDoors();
  assert.equal(code, 0);
  const mounts = out.find((l) => l.startsWith('mounts'));
  assert.ok(mounts, 'a mounts line is printed');
  assert.match(mounts, /api/);
  assert.match(mounts, /no brain mount at \.brain — unverified there until `multivac repos sync`/);
  // doors reports; it never makes the mount (Principle IV: no network here).
  assert.equal(existsSync(join(eco.repos.api, '.gitmodules')), false);
  assert.equal(existsSync(join(eco.repos.api, '.brain')), false);

  // The consumer door names multivac's command before git's.
  assert.match(read(eco.repos.api, 'AGENTS.md'), /ask the brain's owner to run `multivac repos sync`/);
});

test('a consumer door names the law at the path that repo can open — MV-143', async () => {
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    'doors: [agents]\nsdd: speckit\nrepos:\n  api: ../acme-api\n',
  );
  const { code } = await runDoors();
  assert.equal(code, 0);
  const door = read(eco.repos.api, 'AGENTS.md');
  // The project-document line used to print the brain's own relative path in a
  // repo where the law is under the mount, so the agent opened nothing.
  assert.match(door, /`\.brain\/\.multivac\/invariants\.md`/);
  for (const line of door.split('\n')) {
    if (!line.includes('invariants.md')) continue;
    assert.doesNotMatch(line, /(^|[^.])`\.multivac\/invariants\.md`/, line);
  }
  // The brain's own door keeps the bare path: that is the path it can open.
  assert.match(read(eco.brain, 'AGENTS.md'), /`\.multivac\/invariants\.md`/);
});

/**
 * MV-146: the SDD runs in the brain alone, so a code repo's door carries no
 * step block, no project document and no ungateable reason — one line saying
 * where the steps run and where this repo's code belongs. A repo that opts out
 * with `sdd: none`, or an ecosystem with `sdd_auto: false`, gets none.
 */
test('a consumer door names the brain\'s SDD in one line, and none where nothing governs it', () => {
  const cfg: Config = {
    doors: ['agents'],
    sdd: 'speckit',
    sddAuto: true,
    authorities: [],
    blocking: ['absent', 'count', 'each'],
    staleness: 'report',
    strictPrePush: false,
    mount: '.brain',
    dropped: [],
    repos: {
      api: { path: '../acme-api' },
      web: { path: '../acme-web', sdd: 'none' },
    },
  };
  const api = renderConsumerDoor(cfg, 'api');
  const lines = api.split('\n').filter((l) => l.includes('speckit'));
  assert.deepEqual(lines, [
    "- The brain's `speckit` SDD runs in the brain checkout, never in this mount: specs, plans and tasks are written there. Code here lands only on the branch of an open change declaring this repo; `verify --strict` refuses it anywhere else.",
  ]);
  for (const gone of ['[ungateable', '[proof:', 'Features gate', 'project law', 'CREATE IT IF ABSENT', 'the row wins']) {
    assert.equal(api.includes(gone), false, gone);
  }
  // Opted out, or nothing gated: no line at all.
  assert.equal(renderConsumerDoor(cfg, 'web').includes('SDD'), false);
  assert.equal(renderConsumerDoor({ ...cfg, sddAuto: false }, 'api').includes('SDD'), false);
});

test('every shim exports MULTIVAC_QUIET after its chain block and before its runners — MV-151', async () => {
  const repo = mkdtempSync(join(tmpdir(), 'mvac-doors-quiet-'));
  gitInit(repo);
  await installHooks(repo, { strictPrePush: false });
  for (const name of ['pre-commit', 'pre-merge-commit', 'pre-push']) {
    const lines = read(repo, '.multivac/hooks', name).split('\n');
    const at = lines.indexOf('export MULTIVAC_QUIET=1');
    assert.ok(at > 0, `${name} exports the switch`);
    assert.equal(lines.filter((l) => l === 'export MULTIVAC_QUIET=1').length, 1, name);
    assert.deepEqual(lines.slice(at - 2, at), [
      '# One line when nothing is off; the full report otherwise. An env var, not a',
      '# flag: a binary that predates it ignores it and prints in full.',
    ]);
    // After the chain block (or the non-chain `root=` line), before the runners.
    assert.ok(lines[at - 3] === 'fi' || lines[at - 3]!.startsWith('root='), `${name}: ${lines[at - 3]}`);
    assert.match(lines[at + 1]!, /^# The build is used only when this repo IS multivac/);
    assert.ok(!lines.slice(0, at).some((l) => /exec (node|npx|mvac)/.test(l)), `${name}: no runner before the export`);
    // A shim lands in every repo of every ecosystem, where a row ID means nothing.
    assert.doesNotMatch(lines.join('\n'), /MV-[0-9]+/);
  }
});

test('doors from a subdirectory projects the brain that holds it and names it once — MV-151', async () => {
  const own = makeScratchEcosystem(realpathSync(mkdtempSync(join(tmpdir(), 'mvac-doors-root-'))));
  const src = join(own.brain, 'src');
  mkdirSync(src, { recursive: true });
  const at = async (cwd: string): Promise<{ code: number; out: string[] }> => {
    const out: string[] = [];
    const orig = { log: console.log, error: console.error };
    console.log = console.error = (line: string) => out.push(String(line));
    try {
      return { code: await doorsCommand.run([], { cwd }), out };
    } finally {
      console.log = orig.log;
      console.error = orig.error;
    }
  };
  const below = await at(src);
  assert.equal(below.code, 0, below.out.join('\n'));
  assert.equal(below.out[0], `root: ${own.brain} (asked from ${src})`);
  assert.equal(below.out.filter((l) => l.startsWith('root: ')).length, 1);
  assert.doesNotMatch(below.out.join('\n'), /multivac init/);
  const projected = read(own.brain, 'AGENTS.md');
  const atRoot = await at(own.brain);
  assert.equal(atRoot.code, 0);
  assert.equal(atRoot.out.filter((l) => l.startsWith('root: ')).length, 0);
  assert.deepEqual(atRoot.out, below.out.slice(1), 'the projection is the run at the root');
  assert.equal(read(own.brain, 'AGENTS.md'), projected);
});

// --- MV-153: an old brain gets back what multivac wrote, and nothing else ---

/** `doors` run at `cwd`, both streams in order. */
async function doorsAt(cwd: string): Promise<{ code: number; out: string[] }> {
  const out: string[] = [];
  const orig = { log: console.log, error: console.error };
  console.log = console.error = (line: string) => out.push(String(line));
  try {
    return { code: await doorsCommand.run([], { cwd }), out };
  } finally {
    console.log = orig.log;
    console.error = orig.error;
  }
}

const put = (root: string, rel: string, body: string): void => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), body);
};

/** The post-edit refresh an earlier multivac wrote: what matters is its head. */
const OLD_REFRESH = (build: string): string =>
  `L=.multivac/cache/graph-refresh.lock; mkdir -p .multivac/cache && mkdir "$L" 2>/dev/null || exit 0; { ${build}; rmdir "$L"; } >/dev/null 2>&1 </dev/null & exit 0`;

test('doors removes the ecosystem graph an earlier release rendered, and says so once — MV-153', async () => {
  const e = makeScratchEcosystem(realpathSync(mkdtempSync(join(tmpdir(), 'mvac-doors-old-'))));
  put(e.brain, '.multivac/config.yml', 'doors: [agents, claude]\ngrapher: graphify\nrepos:\n  api: ../acme-api\n  web: ../acme-web\n');
  put(e.brain, '.multivac/ecosystem.json', '{"nodes":[],"links":[]}\n');
  // What a vendor wrote, and the human's own copy: never multivac's to remove.
  const kept: Record<string, string> = {
    'graphify-out/graph.json': '{"nodes":[],"links":[]}\n',
    '.graphifyignore': '.multivac/\n',
    '.claude/settings.json.graphify-bak': '{"model":"opus"}\n',
    '.claude/skills/graphify/SKILL.md': 'graphify skill\n',
  };
  for (const [rel, body] of Object.entries(kept)) put(e.brain, rel, body);
  const guard = { matcher: 'Bash|Grep', hooks: [{ type: 'command', command: 'graphify hook-guard search' }] };
  put(e.brain, '.claude/settings.json', JSON.stringify({
    hooks: {
      PostToolUse: [{ hooks: [{ type: 'command', command: OLD_REFRESH('graphify update .') }], matcher: 'Edit|Write|MultiEdit' }],
      PreToolUse: [guard],
    },
  }, null, 2));
  put(e.repos.api, '.claude/settings.json', JSON.stringify({
    hooks: {
      PostToolUse: [{
        matcher: 'Edit|Write|MultiEdit',
        hooks: [{ type: 'command', command: 'echo saved' }, { type: 'command', command: OLD_REFRESH('codegraph sync') }],
      }],
    },
  }, null, 2));

  const first = await doorsAt(e.brain);
  assert.equal(first.code, 0, first.out.join('\n'));
  const said = (re: RegExp) => first.out.filter((l) => re.test(l));
  assert.deepEqual(said(/ecosystem\.json/), [
    'brain: .multivac/ecosystem.json removed — multivac no longer renders it; commit the removal',
  ]);
  assert.deepEqual(said(/refresh hook/), [
    'brain: notice: .claude/settings.json: removed 1 post-edit graph refresh hook an earlier multivac wrote — multivac keeps no code graph',
    'api: notice: .claude/settings.json: removed 1 post-edit graph refresh hook an earlier multivac wrote — multivac keeps no code graph',
  ]);
  assert.equal(existsSync(join(e.brain, '.multivac/ecosystem.json')), false);
  for (const [rel, body] of Object.entries(kept)) assert.equal(read(e.brain, rel), body, rel);
  const brainHooks = JSON.parse(read(e.brain, '.claude/settings.json')).hooks;
  assert.deepEqual(brainHooks.PreToolUse, [guard], "graphify's own hook stays");
  assert.doesNotMatch(read(e.brain, '.claude/settings.json'), /graph-refresh\.lock/);
  const apiPost = JSON.parse(read(e.repos.api, '.claude/settings.json')).hooks.PostToolUse;
  assert.deepEqual(apiPost[0], { matcher: 'Edit|Write|MultiEdit', hooks: [{ type: 'command', command: 'echo saved' }] });

  // Once: a second run finds nothing of either, and changes nothing more.
  const settings = [read(e.brain, '.claude/settings.json'), read(e.repos.api, '.claude/settings.json')];
  const second = await doorsAt(e.brain);
  assert.equal(second.code, 0);
  assert.doesNotMatch(second.out.join('\n'), /ecosystem\.json|refresh hook/);
  assert.deepEqual([read(e.brain, '.claude/settings.json'), read(e.repos.api, '.claude/settings.json')], settings);
});

test("a door names a vendor's install left beside it, and nothing where none is — MV-153", async () => {
  const e = makeScratchEcosystem(realpathSync(mkdtempSync(join(tmpdir(), 'mvac-doors-left-'))));
  put(e.brain, '.multivac/config.yml', 'doors: [agents, claude]\nrepos:\n  api: ../acme-api\n  web: ../acme-web\n');
  // The brain: graphify's output and two platforms, one with hooks.
  put(e.brain, 'graphify-out/graph.json', '{}\n');
  put(e.brain, '.agents/skills/graphify/SKILL.md', 'x\n');
  put(e.brain, '.claude/skills/graphify/SKILL.md', 'x\n');
  // api: one platform, no hooks, no output left.
  put(e.repos.api, '.cursor/rules/graphify.mdc', 'x\n');
  // web: a local index alone sends nobody anywhere.
  put(e.repos.web, '.codegraph/codegraph.db', 'x');
  put(e.repos.web, 'codegraph.json', '{}\n');

  const { code, out } = await doorsAt(e.brain);
  assert.equal(code, 0, out.join('\n'));
  const brainDoor = read(e.brain, 'AGENTS.md').split('\n');
  const line =
    "- graphify's own skills and hooks here still send you to `graphify-out/`, which multivac no longer refreshes: " +
    'it answers for an older tree than the one you edit. Read the tree; `multivac doctor` prints their removal.';
  assert.deepEqual(brainDoor.filter((l) => l.includes('graphify')), [line]);
  // In the list, straight after the line that says to verify.
  assert.match(brainDoor[brainDoor.indexOf(line) - 1], /^- Check the law against the code before acting/);
  const apiDoor = read(e.repos.api, 'AGENTS.md').split('\n');
  assert.deepEqual(apiDoor.filter((l) => l.includes('graphify')), [
    "- graphify's own skill here still sends you to a graph that is not here. Read the tree; `multivac doctor` prints its removal.",
  ]);
  assert.equal(apiDoor[apiDoor.indexOf('<!-- multivac:end -->') - 1], apiDoor.filter((l) => l.includes('graphify'))[0], 'the end of the consumer door');
  assert.doesNotMatch(read(e.repos.web, 'AGENTS.md'), /graph|codegraph/i);

  // Removed, the line goes with them; nothing else in either door moves.
  rmSync(join(e.brain, '.agents/skills/graphify'), { recursive: true });
  rmSync(join(e.brain, '.claude/skills/graphify'), { recursive: true });
  rmSync(join(e.repos.api, '.cursor'), { recursive: true });
  assert.equal((await doorsAt(e.brain)).code, 0);
  assert.deepEqual(read(e.brain, 'AGENTS.md').split('\n'), brainDoor.filter((l) => l !== line));
  assert.doesNotMatch(read(e.repos.api, 'AGENTS.md'), /graph/i);
});
