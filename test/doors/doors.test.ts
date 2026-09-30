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
import { refreshHookCmd } from '../../src/doors/settings.js';
import { grapherSpec, sddSpec } from '../../src/adapters/registry.js';
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
  grapherAuto: true,
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
    grapherAuto: true,
    authorities: [],
    blocking: ['absent', 'count', 'each'],
    staleness: 'report',
    strictPrePush: false,
    mount: '.brain',
    graphers: {},
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
    grapherAuto: true,
    authorities: [],
    blocking: ['absent', 'count', 'each'],
    staleness: 'report',
    strictPrePush: false,
    mount: '.brain',
    graphers: {},
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
    grapherAuto: true,
    authorities: [],
    blocking: ['absent', 'count', 'each'],
    staleness: 'report',
    strictPrePush: false,
    mount: '.brain',
    graphers: {},
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

// The graph refresh follows the AGENT: it rides the harness's post-edit hook,
// never the git shim. A stub stands in for the grapher, on a PATH this test
// builds, so "declared and present" never depends on what the host installed.
test('grapher declared + present: harness post-edit entry, git shim untouched', async () => {
  writeFileSync(
    join(eco.brain, '.multivac/config.yml'),
    'doors: [agents, claude]\ngrapher: stubgraph\ngraphers:\n  stubgraph:\n    artifact: stubgraph-out/graph.json\n    refresh: stubgraph update .\nrepos:\n  api: ../acme-api\n',
  );
  const bin = mkdtempSync(join(tmpdir(), 'mvac-doors-bin-'));
  writeFileSync(join(bin, 'stubgraph'), '#!/bin/sh\nexit 0\n');
  chmodSync(join(bin, 'stubgraph'), 0o755);
  const savedPath = process.env.PATH;
  process.env.PATH = [bin, '/usr/bin', '/bin'].join(':');
  let code: number;
  try {
    ({ code } = await runDoors());
  } finally {
    process.env.PATH = savedPath;
  }
  assert.equal(code, 0);

  for (const dir of [eco.brain, eco.repos.api]) {
    const hooks = JSON.parse(read(dir, '.claude/settings.json')).hooks as Record<
      string,
      { matcher?: string; hooks: { command: string }[] }[]
    >;
    const refresh = hooks.PostToolUse.map((e) => e.hooks[0].command).find((c) =>
      c.includes('stubgraph update .'),
    );
    assert.ok(refresh, 'post-edit refresh entry written');
    assert.match(refresh!, /graph-refresh\.lock/); // coalesced
    assert.match(refresh!, /& exit 0$/); // backgrounded, never a failure
    // MV-148: this brain holds no code, so its hook follows edits into api's
    // checkouts and never runs in one of the brain's; api's is a consumer's.
    assert.equal(refresh!.includes('[ ! -e "$t/.multivac/config.yml" ] && '), dir === eco.brain, dir);
    assert.equal(
      hooks.PostToolUse.find((e) => e.hooks[0].command.includes('stubgraph update .'))!.matcher,
      'Edit|Write|MultiEdit',
    );
    // the git shims stay verify-only — no grapher ever runs on the commit path
    for (const hook of ['pre-commit', 'pre-push']) {
      const shim = read(dir, `.multivac/hooks/${hook}`);
      assert.doesNotMatch(shim, /stubgraph|graph/);
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
  const { code, out } = await runDoors();
  assert.equal(code, 0);
  for (const dir of [eco.brain, eco.repos.api]) {
    const settings = read(dir, '.claude/settings.json');
    assert.doesNotMatch(settings, /graph-refresh\.lock/);
    assert.match(settings, /mvac verify/);
  }
  // Nothing declared, nothing to explain (MV-148's notices are for a grapher).
  assert.equal(out.some((l) => l.includes('no post-edit graph refresh')), false, out.join('\n'));
});

// MV-148. A code-less brain's hook moves into the code repo of the file edited
// before it looks for the binary, so it is wired only where every code repo
// resolving the grapher finds it — PATH, or that repo's own node_modules/.bin.
// Where it cannot be wired, `doors` says why, once — MV-149: once per grapher,
// each grapher getting its own hook.
test('a code-less brain wires the hook that follows edits only where every code repo can run it, and says why not — MV-148', async () => {
  const e = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doors-follow-')));
  const doors = async (config: string): Promise<{ notices: string[]; hook?: string; out: string[]; door: string; flow: string }> => {
    writeFileSync(join(e.brain, '.multivac/config.yml'), config);
    const out: string[] = [];
    const orig = console.log;
    const savedPath = process.env.PATH;
    console.log = (line: string) => out.push(String(line));
    process.env.PATH = ['/usr/bin', '/bin'].join(':');
    try {
      assert.equal(await doorsCommand.run([], { cwd: e.brain }), 0);
    } finally {
      console.log = orig;
      process.env.PATH = savedPath;
    }
    const hooks = JSON.parse(read(e.brain, '.claude/settings.json')).hooks as Record<string, { hooks: { command: string }[] }[]>;
    return {
      notices: out.filter((l) => /^brain: notice: no post-edit (graph )?refresh (for \S+ )?here/.test(l)),
      hook: (hooks.PostToolUse ?? []).flatMap((x) => x.hooks.map((h) => h.command)).find((c) => c.includes('graph-refresh.lock')),
      out,
      door: read(e.brain, 'AGENTS.md'),
      flow: read(e.brain, '.multivac/flow.md'),
    };
  };
  const both = 'doors: [agents, claude]\ngrapher: graphify\nrepos:\n  web: ../acme-web\n  api: ../acme-api\n';

  // Two graphers over the code repos (MV-149): one hook each, and where
  // neither binary is found, one notice each, naming its grapher — the brain
  // has two refreshes to lose, never one hook for one command.
  let r = await doors(
    'doors: [agents, claude]\nrepos:\n  web:\n    path: ../acme-web\n    grapher: graphify\n  api:\n    path: ../acme-api\n    grapher: codegraph\n',
  );
  assert.equal(r.hook, undefined);
  assert.deepEqual(r.notices, [
    "brain: notice: no post-edit refresh for graphify here — `graphify` is not reachable from every code repo that resolves graphify (PATH, or each one's node_modules/.bin); `change land` and `change close` refresh them",
    "brain: notice: no post-edit refresh for codegraph here — `codegraph` is not reachable from every code repo that resolves codegraph (PATH, or each one's node_modules/.bin); `change land` and `change close` refresh them",
  ]);
  assert.equal(r.out.some((l) => l.includes('one hook runs one')), false);

  // The binary in web's node_modules/.bin alone: the hook, moved into api, would find none.
  const stub = (repo: string): void => {
    mkdirSync(join(repo, 'node_modules/.bin'), { recursive: true });
    writeFileSync(join(repo, 'node_modules/.bin/graphify'), '#!/bin/sh\nexit 0\n');
    chmodSync(join(repo, 'node_modules/.bin/graphify'), 0o755);
  };
  stub(e.repos.web);
  r = await doors(both);
  assert.equal(r.hook, undefined);
  assert.deepEqual(r.notices, [
    "brain: notice: no post-edit graph refresh here — `graphify` is not reachable from every code repo that resolves graphify (PATH, or each one's node_modules/.bin); `change land` and `change close` refresh them",
  ]);
  // web's own hook is a consumer's, wired by web's own lookup, as before.
  assert.match(read(e.repos.web, '.claude/settings.json'), /graph-refresh\.lock/);
  const unwired = r;

  // In each code repo's node_modules/.bin: wired, in the follow form, silently.
  stub(e.repos.api);
  r = await doors(both);
  assert.deepEqual(r.notices, []);
  assert.ok(r.hook?.includes('[ ! -e "$t/.multivac/config.yml" ] && [ -e "$t/graphify-out/graph.json" ] && cd "$t" || exit 0; '), r.hook);
  // Declarations, never disk (MV-93): the committed door and flow.md say what
  // the hook is declared to run, byte for byte on a machine that could not
  // wire it — there `doors`, above, and `doctor` say it is not wired.
  assert.equal(unwired.door, r.door);
  assert.equal(unwired.flow, r.flow);
  assert.ok(r.door.includes('(web: `../acme-web`, api: `../acme-api`), refreshed after your edits there'), r.door);
  assert.match(r.flow, /refreshed after each edit through the harness hook/);

  // No writable code repo resolves the grapher declared: no checkout to follow into.
  r = await doors('doors: [agents, claude]\ngrapher: graphify\nrepos:\n  web:\n    path: ../acme-web\n    grapher: none\n');
  assert.equal(r.hook, undefined);
  assert.deepEqual(r.notices, [
    'brain: notice: no post-edit graph refresh here — no writable code repo resolves graphify yet, so there is no checkout to follow edits into; `multivac doors` wires it once one does',
  ]);

  // Unverified, and no repo resolves it: what to declare, never "wires it
  // once one does" — nothing ever wires a name multivac cannot run (MV-59).
  r = await doors('doors: [agents, claude]\ngrapher: mystery\nrepos:\n  web:\n    path: ../acme-web\n    grapher: none\n');
  assert.equal(r.hook, undefined);
  assert.deepEqual(r.notices, []);
  assert.equal(r.out.filter((l) => l.startsWith('brain: notice: grapher "mystery" is not verified')).length, 1, r.out.join('\n'));

  // A brain that holds code: its own hook, today's bytes, no notice.
  r = await doors('doors: [agents, claude]\ngrapher: graphify\nrepos:\n  brain: .\n  web: ../acme-web\n');
  assert.deepEqual(r.notices, []);
  assert.equal(r.hook, undefined, 'graphify is found from neither PATH nor the brain');
  stub(e.brain);
  r = await doors('doors: [agents, claude]\ngrapher: graphify\nrepos:\n  brain: .\n  web: ../acme-web\n');
  assert.equal(r.hook, refreshHookCmd('graphify update .', {}, 'graphify-out/graph.json'));

  // No harness with a post-edit hook: nothing to wire, so nothing to explain.
  r = await doors('doors: [agents]\nrepos:\n  web:\n    path: ../acme-web\n    grapher: graphify\n  api:\n    path: ../acme-api\n    grapher: codegraph\n');
  assert.deepEqual(r.notices, []);
});

// MV-149. One post-edit hook per grapher the brain's session refreshes, each
// wired by its own lookup and removed with its own grapher; graphers writing
// one artifact cannot be told apart by a hook, so `doors` says which is wired.
test('two graphers over the code repos get one hook each, and each goes with its grapher — MV-149', async () => {
  const e = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-doors-two-')));
  const bin = mkdtempSync(join(tmpdir(), 'mvac-doors-two-bin-'));
  const put = (name: string): void => {
    writeFileSync(join(bin, name), '#!/bin/sh\nexit 0\n');
    chmodSync(join(bin, name), 0o755);
  };
  const doors = async (config: string): Promise<{ notices: string[]; out: string[]; refreshes: string[]; post: { hooks: { command: string }[] }[] }> => {
    writeFileSync(join(e.brain, '.multivac/config.yml'), config);
    const out: string[] = [];
    const orig = console.log;
    const savedPath = process.env.PATH;
    console.log = (line: string) => out.push(String(line));
    process.env.PATH = [bin, '/usr/bin', '/bin'].join(':');
    try {
      assert.equal(await doorsCommand.run([], { cwd: e.brain }), 0);
    } finally {
      console.log = orig;
      process.env.PATH = savedPath;
    }
    const post = (JSON.parse(read(e.brain, '.claude/settings.json')).hooks.PostToolUse ?? []) as { hooks: { command: string }[] }[];
    return {
      notices: out.filter((l) => l.startsWith('brain: notice: ')),
      out,
      refreshes: post.flatMap((x) => x.hooks.map((h) => h.command)).filter((c) => c.includes('graph-refresh.lock')),
      post,
    };
  };
  const mixed =
    'doors: [agents, claude]\nrepos:\n  web:\n    path: ../acme-web\n    grapher: graphify\n  api:\n    path: ../acme-api\n    grapher: codegraph\n';
  const graphify = refreshHookCmd('graphify update .', {}, 'graphify-out/graph.json', true);
  const cg = grapherSpec('codegraph')!;
  const codegraph = refreshHookCmd(cg.refresh, cg.env ?? {}, cg.artifacts[0], true);

  // codegraph found from no repo resolving it: graphify's hook alone, and
  // #5's unreachable notice for codegraph, its head naming codegraph — the
  // brain's session still refreshes graphify after each edit.
  put('graphify');
  let r = await doors(mixed);
  assert.deepEqual(r.refreshes, [graphify]);
  assert.deepEqual(r.notices, [
    "brain: notice: no post-edit refresh for codegraph here — `codegraph` is not reachable from every code repo that resolves codegraph (PATH, or each one's node_modules/.bin); `change land` and `change close` refresh them",
  ]);
  assert.equal(Buffer.byteLength(`${r.notices[0]}\n`), 220);

  // Both found: two refresh hooks, the follow form each, and no notice.
  put('codegraph');
  r = await doors(mixed);
  assert.deepEqual(r.refreshes, [graphify, codegraph]);
  assert.deepEqual(r.notices, []);
  assert.equal(r.out.some((l) => l.includes('one hook runs one')), false);
  const settings = read(e.brain, '.claude/settings.json');
  assert.equal((await doors(mixed)).refreshes.length, 2);
  assert.equal(read(e.brain, '.claude/settings.json'), settings, 'a second doors changes no byte');

  // A user's command beside codegraph's hook; api's grapher removed: exactly
  // the codegraph hook goes, the user's command and graphify's hook stay.
  const obj = JSON.parse(settings);
  const entry = (obj.hooks.PostToolUse as { hooks: { command: string }[] }[]).find((x) => x.hooks[0]!.command === codegraph)!;
  entry.hooks.push({ type: 'command', command: 'my-own-linter' } as never);
  writeFileSync(join(e.brain, '.claude/settings.json'), `${JSON.stringify(obj, null, 2)}\n`);
  r = await doors('doors: [agents, claude]\nrepos:\n  web:\n    path: ../acme-web\n    grapher: graphify\n  api:\n    path: ../acme-api\n    grapher: none\n');
  assert.deepEqual(r.refreshes, [graphify]);
  const commands = r.post.flatMap((x) => x.hooks.map((h) => h.command));
  assert.ok(commands.includes('my-own-linter'), commands.join('\n'));
  assert.equal(r.post.find((x) => x.hooks.some((h) => h.command === 'my-own-linter'))!.hooks.length, 1);

  // Two graphers writing one artifact: the brain's own keeps its hook, which
  // moves into any toplevel holding its artifact, so the notice says it runs
  // in the sibling's repos too; the sibling's gets none. Neither the brain's,
  // and neither gets one: a follow hook for the first would run it in the
  // second's repos.
  put('outgraph');
  const decl = 'graphers:\n  outgraph:\n    artifact: graphify-out/graph.json\n    refresh: outgraph update .\n';
  r = await doors(`doors: [agents, claude]\ngrapher: graphify\n${decl}repos:\n  brain: .\n  api:\n    path: ../acme-api\n    grapher: outgraph\n`);
  assert.deepEqual(r.refreshes, [refreshHookCmd('graphify update .', {}, 'graphify-out/graph.json')]);
  assert.deepEqual(r.notices, [
    "brain: notice: graphify and outgraph both write graphify-out/graph.json, so one hook cannot tell their repos apart — graphify is wired, and an edit in outgraph's repos runs graphify there; `change land` and `change close` refresh outgraph",
  ]);
  r = await doors(`doors: [agents, claude]\n${decl}repos:\n  web:\n    path: ../acme-web\n    grapher: graphify\n  api:\n    path: ../acme-api\n    grapher: outgraph\n`);
  assert.deepEqual(r.refreshes, []);
  assert.deepEqual(r.notices, [
    'brain: notice: graphify and outgraph both write graphify-out/graph.json, so one hook cannot tell their repos apart — neither is wired; `change land` and `change close` refresh them',
  ]);
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
    grapherAuto: true,
    authorities: [],
    blocking: ['absent', 'count', 'each'],
    staleness: 'report',
    strictPrePush: false,
    mount: '.brain',
    graphers: {},
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
