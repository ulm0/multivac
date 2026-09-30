// MV-151. A run reads the checkout that holds where it was asked. `verify`
// took its starting directory for the root: from a subdirectory it advised
// `multivac init .`, which git-inits a second brain there; from a brain change
// worktree's subdirectory it judged the main checkout's law; a monorepo
// subproject lost its verdict below its own directory. Every case here is a
// scratch checkout, run in-process with the colour stripped.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  appendFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initRepo, makeScratchEcosystem, publishRepo } from '../helpers/fixture.js';
import { followable, resolveRoot, verify } from '../../src/commands/verify.js';
import { doctorCommand } from '../../src/commands/doctor.js';
import { doorsCommand } from '../../src/commands/doors.js';
import { roadmap } from '../../src/commands/roadmap.js';
import { SHIM_HEADER } from '../../src/hooks/install.js';
import type { Command, CommandContext } from '../../src/types.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

/** A local path as a submodule source: explicit, never the host's config. */
const submodule = (repo: string, url: string, path: string): void => {
  git(repo, '-c', 'protocol.file.allow=always', 'submodule', 'add', '-q', url, path);
};

const scratch = (name: string): string => realpathSync(mkdtempSync(join(tmpdir(), `mvac-${name}-`)));

/** Both streams, in the order written, colour stripped. */
async function run(cmd: Command, cwd: string, args: string[] = [], ctx: Partial<CommandContext> = {}): Promise<{ code: number; out: string }> {
  const lines: string[] = [];
  const orig = { log: console.log, error: console.error };
  console.log = console.error = (...a: unknown[]) => {
    lines.push(a.map(String).join(' '));
  };
  try {
    const code = await cmd.run(args, { cwd, ...ctx });
    return { code, out: lines.join('\n').replace(/\x1b\[[0-9;]*m/g, '') };
  } finally {
    console.log = orig.log;
    console.error = orig.error;
  }
}
const v = (cwd: string, ...args: string[]) => run(verify, cwd, args);
const rootLines = (out: string): string[] => out.split('\n').filter((l) => l.startsWith('  root      '));
const withoutRoot = (out: string): string => out.split('\n').filter((l) => !l.startsWith('  root      ')).join('\n');

const HEADER = '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n';
const law = (...rows: string[]): string => HEADER + rows.join('\n') + '\n';

/** A brain==code brain with one green active row, committed. */
function codeBrain(tmp: string) {
  const e = makeScratchEcosystem(tmp, { brainIsCode: true });
  writeFileSync(
    join(e.brain, '.multivac/invariants.md'),
    law(
      '| INV-R1 | the app is named | published | active | 2026-09-29 | x |',
      '<!-- @anchor INV-R1 brain:src/*.ts /acme-brain/ -->',
      '| INV-R2 | no forbidden call | published | active | 2026-09-29 | x |',
      '<!-- @anchor INV-R2 brain:src/**/*.ts /FORBIDDEN_CALL/ absent -->',
    ),
  );
  writeFileSync(join(e.brain, '.gitignore'), '.multivac/worktrees/\n');
  git(e.brain, 'add', '-A');
  git(e.brain, 'commit', '-qm', 'law');
  return e;
}

/** A code-less brain whose law is committed, mounted by clone at acme-api/.brain. */
function mountedEco(tmp: string, ...rows: string[]) {
  const e = makeScratchEcosystem(tmp);
  writeFileSync(join(e.brain, '.multivac/invariants.md'), law(...rows));
  git(e.brain, 'add', '-A');
  git(e.brain, 'commit', '-qm', 'law');
  const mount = join(e.repos.api, '.brain');
  execFileSync('git', ['clone', '-q', e.brain, mount], { stdio: 'ignore' });
  return { ...e, mount };
}

const API_ROW = [
  '| INV-A1 | accounts table exists | published | active | 2026-09-29 | x |',
  '<!-- @anchor INV-A1 api:db/migrations/*.sql /create[[:space:]]+table[[:space:]]+accounts/i -->',
  '| INV-W1 | web names itself | published | active | 2026-09-29 | x |',
  '<!-- @anchor INV-W1 web:README.md /acme-web/ -->',
];

test("a run from any directory of a checkout prints its root's report and names the root — MV-151", async () => {
  const tmp = scratch('rooted');
  const e = codeBrain(join(tmp, 'b'));
  mkdirSync(join(e.brain, 'src/commands'), { recursive: true });
  mkdirSync(join(e.brain, '.multivac/hooks'), { recursive: true });
  const atRoot = await v(e.brain, '--check');
  assert.equal(atRoot.code, 0, atRoot.out);
  assert.deepEqual(rootLines(atRoot.out), [], 'a run at its root adds no root line');
  for (const d of ['src', 'src/commands', '.multivac/hooks']) {
    const r = await v(join(e.brain, d), '--check');
    assert.equal(r.code, 0, `${d}: ${r.out}`);
    assert.doesNotMatch(r.out, /multivac init/);
    assert.deepEqual(rootLines(r.out), [`  root      ${e.brain} (asked from ${d})`]);
    assert.equal(withoutRoot(r.out), atRoot.out, `${d}: the root's report, byte for byte`);
  }
  // [dir] names the directory asked, wherever the process stands.
  const byDir = await v(tmp, '--check', join(e.brain, 'src'));
  assert.deepEqual(rootLines(byDir.out), [`  root      ${e.brain} (asked from src)`]);

  // A consumer, from its subdirectories.
  const c = mountedEco(join(tmp, 'c'), ...API_ROW);
  const consumerRoot = await v(c.repos.api);
  assert.equal(consumerRoot.code, 0, consumerRoot.out);
  assert.match(consumerRoot.out, /scoped to repo "api"/);
  for (const d of ['src', 'db/migrations']) {
    const r = await v(join(c.repos.api, d));
    assert.equal(r.code, 0, `${d}: ${r.out}`);
    assert.deepEqual(rootLines(r.out), [`  root      ${c.repos.api} (asked from ${d})`]);
    assert.equal(withoutRoot(r.out), consumerRoot.out);
  }
});

test('a consumer whose root is not a git toplevel keeps its verdict from every directory in it — MV-151', async () => {
  const tmp = scratch('mono');
  const brain = join(tmp, 'brain');
  initRepo(brain, {
    '.multivac/config.yml': 'doors: [agents]\nrepos:\n  api: ../api\n',
    '.multivac/invariants.md': law(
      '| INV-M1 | no forbidden word | published | active | 2026-09-29 | x |',
      '<!-- @anchor INV-M1 api:src/*.ts /FORBIDDEN/ absent -->',
    ),
  });
  const mono = join(tmp, 'mono');
  initRepo(mono, { 'services/api/src/x.ts': 'export const x = "FORBIDDEN";\n', 'README.md': '# mono\n' });
  execFileSync('git', ['clone', '-q', brain, join(mono, 'services/api/.brain')], { stdio: 'ignore' });
  const sub = join(mono, 'services/api');
  const at = await v(sub, '--check');
  assert.equal(at.code, 1, at.out);
  assert.match(at.out, /scoped to repo "api"/);
  assert.match(at.out, /broken +INV-M1 \[absent\]/);
  const below = await v(join(sub, 'src'), '--check');
  assert.equal(below.code, 1, below.out);
  assert.deepEqual(rootLines(below.out), [`  root      ${sub} (asked from src)`]);
  assert.equal(withoutRoot(below.out), at.out);

  // A brain fixture committed in a consumer's tree is never its brain.
  const c = mountedEco(join(tmp, 'eco'), ...API_ROW);
  const fixture = join(c.repos.api, 'test/fixtures/brainx');
  mkdirSync(join(fixture, '.multivac'), { recursive: true });
  cpSync(join(c.brain, '.multivac/config.yml'), join(fixture, '.multivac/config.yml'));
  mkdirSync(join(c.repos.api, 'test/fixtures/other'), { recursive: true });
  for (const d of ['test/fixtures', 'test/fixtures/other']) {
    const r = await v(join(c.repos.api, d), '--check');
    assert.equal(r.code, 0, `${d}: ${r.out}`);
    assert.match(r.out, new RegExp(`scoped to repo "api" · brain at ${c.mount}`));
  }
});

test('a mount the brain names below the first level is found — MV-151', async () => {
  const tmp = scratch('nested');
  const e = makeScratchEcosystem(tmp);
  writeFileSync(join(e.brain, '.multivac/config.yml'), 'doors: [agents]\nmount: docs/brain\nrepos:\n  api: ../acme-api\n  web:\n    path: ../acme-web\n');
  writeFileSync(join(e.brain, '.multivac/invariants.md'), law(...API_ROW));
  git(e.brain, 'add', '-A');
  git(e.brain, 'commit', '-qm', 'law');
  mkdirSync(join(e.repos.api, 'docs'), { recursive: true });
  submodule(e.repos.api, e.brain, 'docs/brain');
  for (const d of ['.', 'src', 'docs']) {
    const r = await v(join(e.repos.api, d), '--check');
    assert.equal(r.code, 0, `${d}: ${r.out}`);
    assert.match(r.out, /scoped to repo "api"/, d);
  }
  const inside = await v(join(e.repos.api, 'docs/brain'), '--check');
  assert.doesNotMatch(inside.out, /scoped to repo/, 'inside the mount the run is brain-scoped');
  assert.match(inside.out, /^2 claims · 2 anchored/m);
});

test('a consumer subdirectory, a door and a stale pin answer as their toplevel — MV-151', async () => {
  const e = makeScratchEcosystem(scratch('door'));
  mkdirSync(join(e.repos.web, '.multivac', 'hooks'), { recursive: true });
  writeFileSync(join(e.repos.web, '.multivac', 'hooks', 'pre-commit'), `#!/bin/sh\n${SHIM_HEADER}\nexec mvac verify\n`);
  const door = await v(join(e.repos.web, 'src'));
  assert.equal(door.code, 0, door.out);
  assert.ok(door.out.startsWith(`${e.repos.web} was NOT verified — it carries a multivac door`), door.out);
  assert.doesNotMatch(door.out, /multivac init/);

  mkdirSync(join(e.repos.api, '.brain'));
  writeFileSync(join(e.repos.api, '.brain', 'README.md'), '# empty pin\n');
  const text =
    '.brain is mounted but is not a multivac brain — its pin predates the brain, or points at the wrong ' +
    'commit. Update the submodule (git submodule update --remote .brain) or fix the pin.';
  const host = await v(e.repos.api);
  assert.equal(host.code, 2);
  assert.equal(host.out, text, "from the host, MV-49's text byte for byte");
  const below = await v(join(e.repos.api, 'src'));
  assert.equal(below.code, 2);
  assert.equal(below.out, `${text} Run it in ${e.repos.api}.`);
});

test('a brain change worktree is its own brain from every directory in it — MV-151', async () => {
  const e = codeBrain(scratch('wtbrain'));
  const wt = join(e.brain, '.multivac/worktrees/demo/brain');
  git(e.brain, 'worktree', 'add', '-q', '-b', 'demo', wt);
  appendFileSync(
    join(wt, '.multivac/invariants.md'),
    '| MV-999 | probe | specified | active | 2026-09-29 | x |\n<!-- @anchor MV-999 brain:src/*.ts /THIS_STRING_IS_NOT_THERE/ unique -->\n',
  );
  git(wt, 'commit', '-qam', 'probe', '--no-verify');
  const r = await v(join(wt, 'src'), '--check', '--strict');
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /broken +MV-999 \[unique\] .* · blocking/);
  assert.doesNotMatch(r.out, /scoped to repo/);
  assert.deepEqual(rootLines(r.out), [`  root      ${wt} (asked from src)`]);

  // The slug directory is inside the main checkout: its report, named.
  const slug = await v(join(e.brain, '.multivac/worktrees/demo'), '--check');
  assert.equal(slug.code, 0, slug.out);
  assert.deepEqual(rootLines(slug.out), [`  root      ${e.brain} (asked from .multivac/worktrees/demo)`]);
  assert.equal(withoutRoot(slug.out), (await v(e.brain, '--check')).out);
});

test("a brain change worktree reads each sibling in the change's own worktree, else where the main checkout does — MV-151", async () => {
  const tmp = scratch('siblings');
  // A code-less brain whose siblings are published beside its main checkout.
  const e = makeScratchEcosystem(join(tmp, 'eco'));
  publishRepo(e.repos.api, join(tmp, 'eco'), 'acme-api');
  publishRepo(e.repos.web, join(tmp, 'eco'), 'acme-web');
  const wt = join(e.brain, '.multivac/worktrees/demo/brain');
  git(e.brain, 'worktree', 'add', '-q', '-b', 'demo', wt);
  for (const d of [wt, join(wt, '.multivac')]) {
    const r = await v(d, '--check');
    assert.equal(r.code, 0, r.out);
    assert.doesNotMatch(r.out, /not on disk|repos sync/);
    assert.match(r.out, /read +api: origin\/main @ [0-9a-f]{7} — the channel, as published/);
    assert.match(r.out, /read +web: origin\/main @ [0-9a-f]{7} — the channel, as published/);
  }

  // The change's own sibling worktree is read, found by key, in the default
  // layout (`path: ../<key>`) and in one whose last segment is not the key.
  const FLUX = [
    '| INV-3 | no flux capacitor | published | active | 2026-09-29 | x |',
    '<!-- @anchor INV-3 *:README.md /FLUXCAP/ absent -->',
    '| INV-4 | the lost repo has a readme | published | active | 2026-09-29 | x |',
    '<!-- @anchor INV-4 gone:README.md /x/ -->',
  ];
  for (const layout of ['same', 'renamed'] as const) {
    const root = join(tmp, layout);
    const apiDir = join(root, layout === 'same' ? 'api' : 'acme-api');
    const brain = join(root, 'brain');
    initRepo(brain, {
      '.multivac/config.yml': `doors: [agents]\nrepos:\n  api: ../${layout === 'same' ? 'api' : 'acme-api'}\n  gone: ../gone\n`,
      '.multivac/invariants.md': law(...FLUX),
      '.gitignore': '.multivac/worktrees/\n',
    });
    initRepo(apiDir, { 'README.md': '# api\n' });
    const bwt = join(brain, '.multivac/worktrees/demo/brain');
    git(brain, 'worktree', 'add', '-q', '-b', 'demo', bwt);
    const awt = join(brain, '.multivac/worktrees/demo/api');
    git(apiDir, 'worktree', 'add', '-q', '-b', 'demo', awt);
    appendFileSync(join(awt, 'README.md'), 'FLUXCAP\n');
    const r = await v(bwt, '--check', '--worktree');
    assert.equal(r.code, 1, `${layout}: ${r.out}`);
    assert.match(r.out, /read +api: working tree on demo @ [0-9a-f]{7} — /, layout);
    assert.match(r.out, /broken +INV-3 \[absent\] .*api:README\.md:2.* · blocking/, layout);
    // A sibling missing both ways names the main checkout, on its read line and in its legs.
    assert.match(r.out, new RegExp(`read +gone: not on disk — nothing read; run \`multivac repos sync\` in ${brain}$`, 'm'));
    assert.match(r.out, new RegExp(`INV-4 \\[present\\] .* · repo not on disk — run \`multivac repos sync\` in ${brain}`));
  }
});

test('a mount is judged as the brain it is, and never advises repos sync — MV-151', async () => {
  const tmp = scratch('mount');
  const e = mountedEco(tmp, ...API_ROW);
  const r = await v(e.mount, '--check');
  assert.equal(r.code, 0, r.out);
  assert.doesNotMatch(r.out, /repos sync/);
  for (const key of ['api', 'web']) {
    const line = `  read      ${key}: not on disk beside this mount — nothing read; verify in ${e.repos.api} for its verdict, or from a brain checkout`;
    assert.equal(r.out.split('\n').filter((l) => l === line).length, 1, `${key}'s read line names the host once`);
  }
  assert.equal(r.out.split(e.repos.api).length - 1, 2, 'the host is named once per sibling, never per leg');
  assert.match(r.out, /INV-A1 \[present\] .* · repo not on disk beside this mount — verify from a brain checkout/);

  // Every brain gate holds there: a staged deletion of an active row is
  // refused, from the mount and from below it — a plain clone and a submodule.
  submodule(e.repos.web, e.brain, '.brain');
  for (const mount of [e.mount, join(e.repos.web, '.brain')]) {
    const lawFile = join(mount, '.multivac/invariants.md');
    writeFileSync(lawFile, readFileSync(lawFile, 'utf8').replace(/^\| INV-W1 .*\n/m, ''));
    git(mount, 'add', '.multivac/invariants.md');
    const at = await v(mount, '--check');
    assert.equal(at.code, 1, at.out);
    assert.match(at.out, /law +REFUSED INV-W1 was law and is gone · blocking/);
    const below = await v(join(mount, '.multivac'), '--check');
    assert.equal(below.code, 1, below.out);
    assert.match(below.out, /law +REFUSED INV-W1 was law and is gone · blocking/);
    assert.deepEqual(rootLines(below.out), [`  root      ${mount} (asked from .multivac)`]);
  }
});

test('outside a work tree nothing is walked, and no advice names another directory — MV-151', async () => {
  const tmp = scratch('ungoverned');
  const nogit = join(tmp, 'nogit');
  mkdirSync(nogit);
  let r = await v(nogit);
  assert.equal(r.code, 2);
  assert.equal(r.out, `no .multivac/config.yml in ${nogit} — run \`multivac init .\` to create it`);
  initRepo(join(nogit, 'child'), { '.multivac/config.yml': 'doors: [agents]\n', '.multivac/invariants.md': HEADER });
  r = await v(nogit);
  assert.equal(r.code, 2);
  assert.equal(r.out, `${nogit} is in no git repository — nothing was verified; the brain at ${join(nogit, 'child')} verifies from there`);

  // A dotfiles toplevel whose ignored work/ holds a workspace.
  const dot = join(tmp, 'dot');
  initRepo(dot, { '.gitignore': 'work/\n' });
  mkdirSync(join(dot, 'work/notes'), { recursive: true });
  initRepo(join(dot, 'work/acme-brain'), {
    '.multivac/config.yml': 'doors: [agents]\nrepos:\n  api: ../acme-api\n',
    '.multivac/invariants.md': HEADER,
  });
  r = await v(join(dot, 'work/notes'));
  assert.equal(r.code, 2);
  assert.equal(r.out, `${join(dot, 'work/notes')} is inside ${dot}, which no brain governs — nothing was verified`);
  r = await v(join(dot, 'work'));
  assert.equal(r.code, 2);
  assert.match(r.out, new RegExp(`this checkout matches no repo declared in the brain at ${join(dot, 'work/acme-brain')}`));
  assert.doesNotMatch(r.out, /init/);

  // A vendored submodule of a brain is the brain's to verify.
  const e = codeBrain(join(tmp, 'eco'));
  const lib = join(tmp, 'lib');
  initRepo(lib, { x: 'x\n' });
  submodule(e.brain, lib, 'vendor/lib');
  r = await v(join(e.brain, 'vendor/lib'));
  assert.equal(r.code, 2);
  assert.equal(r.out, `${join(e.brain, 'vendor/lib')} is a submodule of ${e.brain}, which multivac verifies from there — nothing was verified here`);

  // Inside a mount whose pin predates the brain.
  const s = makeScratchEcosystem(join(tmp, 'stale'));
  submodule(s.repos.web, s.brain, '.brain');
  rmSync(join(s.repos.web, '.brain/.multivac'), { recursive: true });
  r = await v(join(s.repos.web, '.brain'));
  assert.equal(r.code, 2);
  assert.match(r.out, /^\.brain is mounted but is not a multivac brain — .* Run it in /);
  assert.ok(r.out.endsWith(` Run it in ${s.repos.web}.`), r.out);
});

test('a git refusal other than no repository is quoted, not read as none — MV-151', {
  skip: process.getuid?.() === 0 ? false : 'handing a copy to another owner needs root',
}, async () => {
  const tmp = scratch('dubious');
  const e = mountedEco(tmp, ...API_ROW);
  const dub = join(tmp, 'dub');
  cpSync(e.repos.api, dub, { recursive: true });
  execFileSync('chown', ['-R', 'nobody', dub]);
  // Git's own configuration is the test's, never the host's: a host that
  // trusts every directory would answer this repository.
  const empty = join(tmp, 'gitconfig');
  writeFileSync(empty, '');
  const prev = { g: process.env.GIT_CONFIG_GLOBAL, s: process.env.GIT_CONFIG_NOSYSTEM };
  process.env.GIT_CONFIG_GLOBAL = empty;
  process.env.GIT_CONFIG_NOSYSTEM = '1';
  try {
    for (const d of [dub, join(dub, 'src')]) {
      const r = await v(d);
      assert.equal(r.code, 2, r.out);
      assert.match(r.out, /^git rev-parse --show-toplevel failed in .*: fatal: detected dubious ownership/);
      assert.doesNotMatch(r.out, /multivac init/);
    }
  } finally {
    if (prev.g === undefined) delete process.env.GIT_CONFIG_GLOBAL;
    else process.env.GIT_CONFIG_GLOBAL = prev.g;
    if (prev.s === undefined) delete process.env.GIT_CONFIG_NOSYSTEM;
    else process.env.GIT_CONFIG_NOSYSTEM = prev.s;
  }
});

test('rooting ignores an ambient GIT_DIR — MV-151', async () => {
  const e = codeBrain(scratch('gitdir'));
  const prev = process.env.GIT_DIR;
  process.env.GIT_DIR = join(e.repos.api, '.git');
  try {
    assert.deepEqual(await resolveRoot(join(e.brain, 'src')), { kind: 'brain', brain: e.brain, top: e.brain });
    const r = await v(join(e.brain, 'src'), '--check');
    assert.equal(r.code, 0, r.out);
    assert.deepEqual(rootLines(r.out), [`  root      ${e.brain} (asked from src)`]);
  } finally {
    if (prev === undefined) delete process.env.GIT_DIR;
    else process.env.GIT_DIR = prev;
  }
});

/** The edit payload Claude Code hands a PostToolUse hook, as its binary writes it. */
const edit = (file: string, cwd?: string) => async (): Promise<string> =>
  JSON.stringify({ hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: file }, ...(cwd ? { cwd } : {}) });
const sessionStart = (cwd?: string) => async (): Promise<string> =>
  JSON.stringify({ hook_event_name: 'SessionStart', source: 'resume', ...(cwd ? { cwd } : {}) });
const noRead = async (): Promise<string> => {
  throw new Error('stdin was read');
};

test('the post-edit run roots at the edited file when a brain governs it — MV-151', async () => {
  const tmp = scratch('follow');
  const e = codeBrain(join(tmp, 'b'));
  const wt = join(e.brain, '.multivac/worktrees/demo/brain');
  git(e.brain, 'worktree', 'add', '-q', '-b', 'demo', wt);
  appendFileSync(join(wt, 'src/app.ts'), "const x = 'FORBIDDEN_CALL';\n");
  const hook = (stdin: () => Promise<string>, env: Record<string, string> = { CLAUDE_PROJECT_DIR: e.brain }) =>
    run(verify, e.brain, [], { env, stdin });

  // An edit in the change worktree, from a session at the main checkout.
  const red = await hook(edit(join(wt, 'src/app.ts'), e.brain));
  assert.equal(red.code, 1, red.out);
  assert.match(red.out, /broken +INV-R2 \[absent\] .*src\/app\.ts.* · blocking/);
  assert.deepEqual(rootLines(red.out), [`  root      ${wt} (asked from ${e.brain})`]);
  // No marker, or a [dir]: stdin is never read, and the session's root is judged.
  const plain = await run(verify, e.brain, [], { env: {}, stdin: noRead });
  assert.equal(plain.code, 0, plain.out);
  const asked = await run(verify, e.brain, ['.'], { env: { CLAUDE_PROJECT_DIR: e.brain }, stdin: noRead });
  assert.equal(asked.code, 0, asked.out);
  // Another event, or input that does not parse, is no question.
  assert.equal((await hook(async () => JSON.stringify({ hook_event_name: 'Stop' }))).code, 0);
  assert.equal((await hook(async () => 'not json')).code, 0);

  // Where no brain governs the edited file, the session's own root.
  const nowhere = join(tmp, 'nowhere');
  mkdirSync(nowhere);
  const plainRepo = join(tmp, 'plain');
  initRepo(plainRepo, { 'a.txt': 'a\n' });
  const cacheOnly = join(tmp, 'cacheonly');
  initRepo(cacheOnly, { 'a.txt': 'a\n' });
  mkdirSync(join(cacheOnly, '.multivac/cache'), { recursive: true });
  mkdirSync(join(cacheOnly, 'graphify-out'), { recursive: true });
  writeFileSync(join(cacheOnly, 'graphify-out/graph.json'), '{}\n');
  for (const f of [join(nowhere, 'x.ts'), join(tmp, 'gone/x.ts'), join(plainRepo, 'a.txt'), join(cacheOnly, 'a.txt')]) {
    const r = await hook(edit(f, e.brain));
    assert.equal(r.code, 0, `${f}: ${r.out}`);
    assert.deepEqual(rootLines(r.out), [], f);
    assert.doesNotMatch(r.out, /multivac init/);
  }

  // A code-less brain session editing its own change worktree's law reads the
  // siblings at the channel on the change's branch; an edit in a consumer's
  // change worktree is that consumer's run.
  const c = makeScratchEcosystem(join(tmp, 'eco'));
  publishRepo(c.repos.api, join(tmp, 'eco'), 'acme-api');
  publishRepo(c.repos.web, join(tmp, 'eco'), 'acme-web');
  const bwt = join(c.brain, '.multivac/worktrees/demo/brain');
  git(c.brain, 'worktree', 'add', '-q', '-b', 'demo', bwt);
  const own = await run(verify, c.brain, [], {
    env: { CLAUDE_PROJECT_DIR: c.brain },
    stdin: edit(join(bwt, '.multivac/invariants.md'), c.brain),
  });
  assert.equal(own.code, 0, own.out);
  assert.match(own.out, /read +api: origin\/main @ [0-9a-f]{7} — the channel, as published/);
  assert.match(own.out, /read +brain: working tree on demo @/);
  const awt = join(c.brain, '.multivac/worktrees/demo/api');
  git(c.repos.api, 'worktree', 'add', '-q', '-b', 'demo', awt);
  const consumer = await run(verify, c.brain, [], {
    env: { CLAUDE_PROJECT_DIR: c.brain },
    stdin: edit(join(awt, 'src/server.ts'), c.brain),
  });
  assert.equal(consumer.code, 0, consumer.out);
  assert.match(consumer.out, new RegExp(`scoped to repo "api" · brain at ${c.brain} \\(the change worktree for demo\\)`));

  // What may be followed, by kind.
  assert.equal(followable({ kind: 'none', message: 'x' }), false);
  assert.equal(followable({ kind: 'door', top: tmp }), true);
  assert.equal(followable({ kind: 'brain', brain: e.brain, top: e.brain }), true);
  assert.equal(followable({ kind: 'brain', brain: join(e.brain, 'x'), top: e.brain }), false);
  assert.equal(followable({ kind: 'brain', brain: e.brain, top: null }), false);
});

test('a hook starts where its payload says, and never follows into a nested brain — MV-151', async () => {
  const tmp = scratch('payload');
  const brain = join(tmp, 'b');
  initRepo(brain, {
    '.multivac/config.yml': 'doors: [agents]\nrepos:\n  brain: .\n',
    '.multivac/invariants.md': law(
      '| INV-P1 | the app exists | published | active | 2026-09-29 | x |',
      '<!-- @anchor INV-P1 brain:src/*.ts /app/ -->',
    ),
    'src/app.ts': 'export const app = 1;\n',
    // A committed fixture brain, deliberately red.
    'test/fixtures/red/.multivac/config.yml': 'doors: [agents]\nrepos:\n  brain: .\n',
    'test/fixtures/red/.multivac/invariants.md': law(
      '| INV-9 | never nope | published | active | 2026-09-29 | x |',
      '<!-- @anchor INV-9 brain:x.txt /NOPE/ absent -->',
    ),
    'test/fixtures/red/x.txt': 'NOPE\n',
  });
  const home = join(tmp, 'home');
  mkdirSync(home);
  const marker = { CLAUDE_PROJECT_DIR: brain };

  // A forwarded hook starts in the home directory: the payload's cwd is the session's.
  const start = await run(verify, home, [], { env: marker, stdin: sessionStart(brain) });
  assert.equal(start.code, 0, start.out);
  assert.match(start.out, /^0 blocking broken · exit 0 · 1 claims · 1 anchored \(100%\) · read brain main @ [0-9a-f]{7} \(working tree\)/);
  assert.doesNotMatch(start.out, /init/);
  assert.ok(!start.out.includes(home), start.out);
  const edited = await run(verify, home, [], { env: marker, stdin: edit(join(brain, 'src/app.ts'), brain) });
  assert.equal(edited.code, 0, edited.out);
  assert.match(edited.out, /^1 claims · 1 anchored/);
  assert.deepEqual(rootLines(edited.out), []);
  // No cwd in the payload: the marker's value; neither names a directory: the process's.
  const byMarker = await run(verify, home, [], { env: marker, stdin: sessionStart() });
  assert.equal(byMarker.out, start.out);
  const byProcess = await run(verify, join(brain, 'src'), [], {
    env: { CLAUDE_PROJECT_DIR: join(tmp, 'missing') },
    stdin: sessionStart(join(tmp, 'missing')),
  });
  assert.equal(byProcess.out, start.out, 'the quiet line carries no root line');

  // Asked directly, the fixture brain is judged; an edit to it is never followed.
  const direct = await v(join(brain, 'test/fixtures/red'), '--check');
  assert.equal(direct.code, 1, direct.out);
  assert.match(direct.out, /INV-9/);
  const followed = await run(verify, brain, [], { env: marker, stdin: edit(join(brain, 'test/fixtures/red/x.txt'), brain) });
  assert.equal(followed.code, 0, followed.out);
  assert.doesNotMatch(followed.out, /INV-9|NOPE/);
});

test('a symlinked path to the root is the root, and names no root — MV-151', async () => {
  const tmp = scratch('symlink');
  const e = codeBrain(join(tmp, 'b'));
  const link = join(tmp, 'link');
  symlinkSync(e.brain, link);
  const r = await v(link, '--check');
  assert.equal(r.code, 0, r.out);
  assert.deepEqual(rootLines(r.out), []);
  for (const [cmd, prefix] of [
    [doctorCommand, 'root      '],
    [doorsCommand, 'root: '],
    [roadmap, 'root: '],
  ] as const) {
    const out = (await run(cmd, link)).out;
    assert.equal(out.split('\n').filter((l) => l.startsWith(prefix)).length, 0, `${cmd.name}: ${out}`);
  }
});
