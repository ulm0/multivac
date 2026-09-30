// MV-146. With an SDD declared, the SDD lives in the brain alone. Measured with
// the cascade: `repos sync` wrote 30 vendor files into each code repo, `change
// new` needed the vendor where no step would run, a proof was looked for in the
// worktree named after the root's scope (so a brain==code entry keyed `core`
// closed over an open task), and two changes open in one checkout shared
// spec-kit's feature pointer. Vendors are stubs on a PATH this file builds
// (Principle IV).

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { makeScratchEcosystem, vendorPath } from '../helpers/fixture.js';
import { SPECKIT_INTEGRATION_JSON } from '../helpers/recorded.js';
import { change } from '../../src/commands/change.js';
import { reposCommand } from '../../src/commands/repos.js';
import { loadChange, saveChange } from '../../src/change/file.js';
import { loadConfig } from '../../src/lib/config.js';
import { renderEcosystem } from '../../src/doors/ecosystem.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();

/** Run `fn` with PATH set to `path`, capturing stdout and stderr. */
async function run(fn: () => Promise<number>, path: string): Promise<{ code: number; out: string }> {
  const lines: string[] = [];
  const orig = { log: console.log, error: console.error, path: process.env.PATH };
  console.log = console.error = (...a: unknown[]) => { lines.push(a.map(String).join(' ')); };
  process.env.PATH = path;
  try {
    return { code: await fn(), out: lines.join('\n') };
  } finally {
    console.log = orig.log;
    console.error = orig.error;
    process.env.PATH = orig.path;
  }
}

const put = (root: string, rel: string, body = 'x\n'): void => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), body);
};

/**
 * A brain governing api and web with `sdd: speckit`. `installed` puts a written
 * constitution and spec-kit's state file in the brain, committed, the way a
 * brain looks once its scaffold has run; `repos` replaces the `repos:` lines.
 */
function eco({ installed = false, repos = ['  api: ../acme-api', '  web: ../acme-web'] } = {}) {
  const e = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-brain-only-')));
  writeFileSync(join(e.brain, '.multivac/config.yml'), ['doors: [agents]', 'sdd: speckit', 'repos:', ...repos, ''].join('\n'));
  put(e.brain, '.multivac/.gitignore', 'cache/\nworktrees/\n');
  if (installed) {
    put(e.brain, '.specify/integration.json', SPECKIT_INTEGRATION_JSON);
    put(e.brain, '.specify/memory/constitution.md', '# Acme Constitution\n\n### I. Law first\n');
    put(e.brain, '.specify/.gitignore', 'feature.json\n');
  }
  git(e.brain, 'add', '-A');
  git(e.brain, 'commit', '-q', '-m', 'config');
  return e;
}

/** Open `slug` naming `repos`, in one stage. */
async function open(brain: string, slug: string, repos: string[], path: string): Promise<void> {
  const c = await run(() => change.run(['new', slug, slug], { cwd: brain }), path);
  assert.equal(c.code, 0, c.out);
  const parsed = await loadChange(brain, slug);
  parsed.change.repos = Object.fromEntries(repos.map((k) => [k, { status: 'planned' as const }]));
  parsed.change.landing_order = [repos];
  parsed.change.invariants.adds = [];
  await saveChange(brain, parsed);
  git(brain, 'add', '-A');
  git(brain, 'commit', '-q', '-m', `declare ${slug}`);
}

const specifyRuns = (runs: string): number =>
  existsSync(runs) ? readFileSync(runs, 'utf8').split('\n').filter((l) => l.startsWith('specify ')).length : 0;

test('a top-level sdd scaffolds the brain alone, and no code repo', async () => {
  const v = vendorPath(['specify']);
  const e = eco();
  const sync = await run(() => reposCommand.run(['sync'], { cwd: e.brain }), v.path);
  assert.equal(sync.code, 0, sync.out);
  assert.equal(specifyRuns(v.runs), 1, `one init, in the brain:\n${sync.out}`);
  assert.ok(existsSync(join(e.brain, '.specify/integration.json')), 'the brain is installed');
  for (const repo of [e.repos.api, e.repos.web]) {
    assert.equal(existsSync(join(repo, '.specify')), false, `${repo} holds no SDD`);
    assert.equal(git(repo, 'status', '--porcelain'), '', `${repo} is untouched`);
  }
  assert.doesNotMatch(sync.out, /sdd speckit[^\n]*\b(api|web)\b/);
  // And the lifecycle agrees: nothing more runs anywhere.
  git(e.brain, 'add', '-A');
  git(e.brain, 'commit', '-q', '-m', 'scaffolded');
  const c = await run(() => change.run(['new', 'after-sync', 'After sync'], { cwd: e.brain }), v.path);
  assert.equal(c.code, 0, c.out);
  assert.equal(specifyRuns(v.runs), 1);
});

test('change new needs no specify for a code repo', async () => {
  // Installed in the brain, absent from both code repos, and no `specify`
  // anywhere on PATH: the cascade refused here, over repos no step runs in.
  const e = eco({ installed: true });
  const none = vendorPath([]);
  const c = await run(() => change.run(['new', 'no-vendor', 'No vendor'], { cwd: e.brain }), none.path);
  assert.equal(c.code, 0, c.out);
  assert.doesNotMatch(c.out, /refused/);
  assert.doesNotMatch(c.out, /\b(api|web)\b.*specify/);
});

test('a spec written in a code repo is named, and never read', async () => {
  const e = eco({ installed: true });
  const v = vendorPath(['specify']);
  await open(e.brain, 'stray', ['api'], v.path);
  // By habit, in the code repo and in its change worktree: neither is the brain.
  put(e.repos.api, 'specs/001-stray/spec.md', '# the spec, in the wrong place\n');
  put(e.brain, '.multivac/worktrees/stray/api/specs/001-stray/spec.md', '# and again\n');
  const c = await run(() => change.run(['plan', 'stray'], { cwd: e.brain }), v.path);
  assert.equal(c.code, 1, c.out);
  assert.match(c.out, /specs\/<n>-stray\/spec\.md is missing — looked in brain$/m);
  assert.match(c.out, /^sdd speckit: {3}api: specs\/001-stray\/spec\.md — not read; the SDD runs only in the brain$/m);
  assert.match(c.out, /^sdd speckit: {3}api: \.multivac\/worktrees\/stray\/api\/specs\/001-stray\/spec\.md — not read; the SDD runs only in the brain$/m);
  // web holds nothing for this slug, and is not named.
  assert.doesNotMatch(c.out, /web:/);
  // Written in the brain, it is read there, and the strays are not named again.
  put(e.brain, 'specs/001-stray/spec.md', '# the spec\n');
  const ok = await run(() => change.run(['plan', 'stray'], { cwd: e.brain }), v.path);
  assert.equal(ok.code, 0, ok.out);
  assert.match(ok.out, /sdd speckit: brain: specs\/001-stray\/spec\.md ok/);
  assert.doesNotMatch(ok.out, /not read/);
});

test('change plan says where code goes only when the change names a code repo', async () => {
  const e = eco({ installed: true, repos: ['  brain: .', '  api: ../acme-api'] });
  const v = vendorPath(['specify']);
  const LINE = /its steps run from the brain checkout, which holds no code of this change/;

  await open(e.brain, 'brain-only', ['brain'], v.path);
  put(e.brain, 'specs/001-brain-only/spec.md', '# spec\n');
  const alone = await run(() => change.run(['plan', 'brain-only'], { cwd: e.brain }), v.path);
  assert.equal(alone.code, 0, alone.out);
  assert.doesNotMatch(alone.out, LINE);
  git(e.brain, 'add', '-A');
  git(e.brain, 'commit', '-q', '-m', 'first spec');

  await open(e.brain, 'with-api', ['brain', 'api'], v.path);
  put(e.brain, 'specs/002-with-api/spec.md', '# spec\n');
  const both = await run(() => change.run(['plan', 'with-api'], { cwd: e.brain }), v.path);
  assert.equal(both.code, 0, both.out);
  // Every repo the change names, the brain's own entry too: in brain==code its
  // code is written in its worktree, never in the checkout the steps run from.
  assert.match(
    both.out,
    /^sdd speckit: its steps run from the brain checkout, which holds no code of this change — tasks name code paths under \.multivac\/worktrees\/with-api\/\{brain,api\}\/, and code is written only there$/m,
  );
  git(e.brain, 'add', '-A');
  git(e.brain, 'commit', '-q', '-m', 'second spec');
  // A code repo alone: its worktree, and no brace.
  await open(e.brain, 'api-only', ['api'], v.path);
  put(e.brain, 'specs/003-api-only/spec.md', '# spec\n');
  const one = await run(() => change.run(['plan', 'api-only'], { cwd: e.brain }), v.path);
  assert.equal(one.code, 0, one.out);
  assert.match(one.out, /tasks name code paths under \.multivac\/worktrees\/api-only\/api\/, and code is written only there$/m);
  // Before the steps it is about, never after the instruction that closes them.
  const lines = both.out.split('\n');
  const at = lines.findIndex((l) => LINE.test(l));
  assert.ok(at < lines.findIndex((l) => l.includes('/speckit.plan')), both.out);

  // Off with the steps.
  const off = await run(() => change.run(['plan', 'with-api', '--no-sdd'], { cwd: e.brain }), v.path);
  assert.doesNotMatch(off.out, LINE);
});

test('with two changes open, plan points spec-kit at the one being planned, and says so', async () => {
  const e = eco({ installed: true, repos: ['  brain: .'] });
  const v = vendorPath(['specify']);
  await open(e.brain, 'alpha', ['brain'], v.path);
  await open(e.brain, 'beta', ['brain'], v.path);
  put(e.brain, 'specs/001-alpha/spec.md', '# alpha\n');
  put(e.brain, 'specs/002-beta/spec.md', '# beta\n');
  // /speckit.specify for beta ran last, so the pointer names beta's directory.
  put(e.brain, '.specify/feature.json', '{\n  "feature_directory": "specs/002-beta"\n}\n');
  const pointer = (): string => JSON.parse(readFileSync(join(e.brain, '.specify/feature.json'), 'utf8')).feature_directory;

  const c = await run(() => change.run(['plan', 'alpha'], { cwd: e.brain }), v.path);
  assert.equal(c.code, 0, c.out);
  assert.match(c.out, /^sdd speckit: \.specify\/feature\.json named specs\/002-beta; it names specs\/001-alpha now$/m);
  assert.equal(pointer(), 'specs/001-alpha');
  // Already pointing there: nothing to say.
  const again = await run(() => change.run(['plan', 'alpha'], { cwd: e.brain }), v.path);
  assert.doesNotMatch(again.out, /feature\.json named/);
  // And back, for the other one.
  await run(() => change.run(['plan', 'beta'], { cwd: e.brain }), v.path);
  assert.equal(pointer(), 'specs/002-beta');
});

test('with two changes open, apply points spec-kit at the one being applied, and says so', async () => {
  // A code-less brain: the directory is never carried, so apply repoints it in
  // the checkout, where the apply steps write.
  const e = eco({ installed: true });
  const v = vendorPath(['specify']);
  await open(e.brain, 'alpha', ['api'], v.path);
  await open(e.brain, 'beta', ['api'], v.path);
  put(e.brain, 'specs/001-alpha/spec.md', '# alpha\n');
  put(e.brain, 'specs/001-alpha/plan.md', '# plan\n');
  put(e.brain, 'specs/001-alpha/tasks.md', '- [ ] T001 build it\n');
  put(e.brain, 'specs/002-beta/spec.md', '# beta\n');
  const pointer = (): string => JSON.parse(readFileSync(join(e.brain, '.specify/feature.json'), 'utf8')).feature_directory;
  assert.equal((await run(() => change.run(['plan', 'alpha'], { cwd: e.brain }), v.path)).code, 0);
  assert.equal(pointer(), 'specs/001-alpha');
  // /speckit.specify ran for beta since, so the pointer names beta's directory again.
  put(e.brain, '.specify/feature.json', '{\n  "feature_directory": "specs/002-beta"\n}\n');
  const a = await run(() => change.run(['apply', 'alpha'], { cwd: e.brain }), v.path);
  assert.equal(a.code, 0, a.out);
  assert.match(a.out, /^sdd speckit: \.specify\/feature\.json named specs\/002-beta; it names specs\/001-alpha now$/m);
  assert.equal(pointer(), 'specs/001-alpha');
  // Said before the apply steps that write there.
  const lines = a.out.split('\n');
  assert.ok(lines.findIndex((l) => l.includes('feature.json named')) < lines.findIndex((l) => l.includes('/speckit.implement')), a.out);
  assert.ok(existsSync(join(e.brain, 'specs/001-alpha/tasks.md')), 'nothing carried out of a code-less brain');
});

test('change new says where the why goes, after the project document and before the steps, and only with the steps', async () => {
  const e = eco({ installed: true });
  // A constitution still the template, so the project-document line prints.
  put(e.brain, '.specify/memory/constitution.md', '# [PROJECT_NAME] Constitution\n');
  git(e.brain, 'add', '-A');
  git(e.brain, 'commit', '-q', '-m', 'template constitution');
  const v = vendorPath(['specify']);
  const CITE =
    /^sdd speckit: the why, the design and the tasks go into its files — the change body keeps what it held while planned, or one sentence, and `change close` cites the directory; do not cite it yourself$/;
  const c = await run(() => change.run(['new', 'cite-me', 'Cite me'], { cwd: e.brain }), v.path);
  assert.equal(c.code, 0, c.out);
  const lines = c.out.split('\n');
  const doc = lines.findIndex((l) => /^sdd speckit @ brain: \.specify\/memory\/constitution\.md is /.test(l));
  const cite = lines.findIndex((l) => CITE.test(l));
  const step = lines.findIndex((l) => l.includes('/speckit.specify'));
  assert.ok(doc >= 0 && doc < cite && cite < step, c.out);
  assert.equal(lines.filter((l) => CITE.test(l)).length, 1);

  // Off with the steps: `--no-sdd`, `sdd_auto: false`, and no SDD at all.
  const noSdd = await run(() => change.run(['new', 'no-sdd', 'No sdd', '--no-sdd'], { cwd: e.brain }), v.path);
  assert.equal(noSdd.code, 0, noSdd.out);
  assert.doesNotMatch(noSdd.out, /the why, the design/);
  for (const [slug, config] of [
    ['auto-off', 'doors: [agents]\nsdd: speckit\nsdd_auto: false\nrepos:\n  api: ../acme-api\n'],
    ['no-tool', 'doors: [agents]\nrepos:\n  api: ../acme-api\n'],
  ]) {
    writeFileSync(join(e.brain, '.multivac/config.yml'), config);
    git(e.brain, 'add', '-A');
    git(e.brain, 'commit', '-q', '-m', slug);
    const off = await run(() => change.run(['new', slug, slug], { cwd: e.brain }), v.path);
    assert.equal(off.code, 0, off.out);
    assert.doesNotMatch(off.out, /the why, the design/, slug);
  }
});

test('a task ledger left in a code repo refuses close, named and never read', async () => {
  // A change open across the upgrade: its specs were written in api, as the
  // earlier release said. Nothing of it is in the brain, so the ledger pass
  // would read nothing — and pass over the open task.
  const e = eco({ installed: true });
  const v = vendorPath(['specify']);
  await open(e.brain, 'mid', ['api'], v.path);
  put(e.repos.api, 'specs/001-mid/tasks.md', '- [ ] T1 still open\n');
  const parsed = await loadChange(e.brain, 'mid');
  parsed.change.repos = { api: { status: 'landed' } };
  await saveChange(e.brain, parsed);
  git(e.brain, 'add', '-A');
  git(e.brain, 'commit', '-q', '-m', 'landed before the upgrade');
  const c = await run(() => change.run(['close', 'mid'], { cwd: e.brain }), v.path);
  assert.equal(c.code, 1, c.out);
  assert.match(c.out, /refused — specs\/<n>-mid\/tasks\.md, the task ledger it reads, is not in brain; the one found outside the brain is not read$/m);
  assert.match(c.out, /^sdd speckit: {3}api: specs\/001-mid\/tasks\.md — not read; the SDD runs only in the brain$/m);
  // Not read: the open item is never quoted.
  assert.doesNotMatch(c.out, /T1 still open/);
  assert.equal(existsSync(join(e.brain, '.multivac/changes/archive/mid.md')), false, 'nothing archived');
  // Nowhere at all: nothing to read, as before.
  execFileSync('rm', ['-r', join(e.repos.api, 'specs')]);
  const none = await run(() => change.run(['close', 'mid'], { cwd: e.brain }), v.path);
  assert.doesNotMatch(none.out, /task ledger it reads/);
});

test('brain==code keyed core: close cites the directory the carry moved into its worktree', async () => {
  const e = eco({ installed: true, repos: ['  core: .'] });
  const v = vendorPath(['specify']);
  await open(e.brain, 'moved', ['core'], v.path);
  put(e.brain, 'specs/001-moved/spec.md', '# spec\n');
  put(e.brain, 'specs/001-moved/plan.md', '# plan\n');
  put(e.brain, 'specs/001-moved/tasks.md', '- [x] T001 done\n');
  assert.equal((await run(() => change.run(['plan', 'moved'], { cwd: e.brain }), v.path)).code, 0);
  assert.equal((await run(() => change.run(['apply', 'moved'], { cwd: e.brain }), v.path)).code, 0);
  // Only the worktree holds it: the branch has not reached the checkout.
  assert.equal(existsSync(join(e.brain, 'specs/001-moved')), false);
  assert.ok(existsSync(join(e.brain, '.multivac/worktrees/moved/core/specs/001-moved/tasks.md')));
  assert.equal((await run(() => change.run(['land', 'moved', '--landed', 'core'], { cwd: e.brain }), v.path)).code, 0);
  const c = await run(() => change.run(['close', 'moved'], { cwd: e.brain }), v.path);
  assert.equal(c.code, 0, c.out);
  assert.doesNotMatch(c.out, /nothing cited/);
  assert.match(readFileSync(join(e.brain, '.multivac/changes/archive/moved.md'), 'utf8'), /\nSpecified in `specs\/001-moved\/` \(speckit\)\.\n$/);
});

test('brain==code keyed core: close refuses over a task left open in its worktree', async () => {
  const e = eco({ installed: true, repos: ['  core: .'] });
  const v = vendorPath(['specify']);
  await open(e.brain, 'keyed', ['core'], v.path);
  put(e.brain, 'specs/001-keyed/spec.md', '# spec\n');
  put(e.brain, 'specs/001-keyed/plan.md', '# plan\n');
  put(e.brain, 'specs/001-keyed/tasks.md', '- [x] T001 done\n- [ ] T002 still open\n');
  assert.equal((await run(() => change.run(['plan', 'keyed'], { cwd: e.brain }), v.path)).code, 0);
  const applied = await run(() => change.run(['apply', 'keyed'], { cwd: e.brain }), v.path);
  assert.equal(applied.code, 0, applied.out);
  // The carry moved the specs onto the change's branch, in the worktree the key names.
  const wt = join(e.brain, '.multivac/worktrees/keyed/core');
  assert.ok(existsSync(join(wt, 'specs/001-keyed/tasks.md')), applied.out);
  assert.equal(existsSync(join(e.brain, 'specs/001-keyed')), false);
  assert.equal((await run(() => change.run(['land', 'keyed', '--landed', 'core'], { cwd: e.brain }), v.path)).code, 0);
  const c = await run(() => change.run(['close', 'keyed'], { cwd: e.brain }), v.path);
  assert.equal(c.code, 1, c.out);
  assert.match(c.out, /refused — brain:\.multivac\/worktrees\/keyed\/core\/specs\/001-keyed\/tasks\.md has 1 open item\(s\)/);
  assert.match(c.out, /- \[ \] T002 still open/);
  assert.equal(existsSync(join(e.brain, '.multivac/changes/archive/keyed.md')), false, 'nothing archived');
});

test('ecosystem.json code nodes carry the SDD that governs them, and an exempt node none', async () => {
  const e = eco({ repos: ['  api: ../acme-api', '  web:', '    path: ../acme-web', '    sdd: none'] });
  const graph = JSON.parse(await renderEcosystem(e.brain, await loadConfig(e.brain))) as {
    nodes: Array<{ id: string; sdd?: string | null }>;
  };
  const sdd = (id: string): string | null | undefined => graph.nodes.find((n) => n.id === id)?.sdd;
  assert.equal(sdd('repo:brain'), 'speckit');
  assert.equal(sdd('repo:api'), 'speckit');
  assert.equal(sdd('repo:web'), null);
});
