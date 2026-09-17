// MV-133. `change apply` carries a change's SDD files onto its branch. On every
// change from 052 to 057 in this repository `specs/<n>-<slug>/` was copied into
// the worktree by hand, and the untracked copy left behind stopped `git merge`.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { initRepo } from '../helpers/fixture.js';
import { SPECKIT_INTEGRATION_JSON } from '../helpers/recorded.js';
import { change } from '../../src/commands/change.js';
import { loadChange, saveChange } from '../../src/change/file.js';

process.env.PATH = [dirname(process.execPath), '/usr/bin', '/bin'].join(delimiter);
for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();

async function quiet(fn: () => Promise<number>): Promise<{ code: number; out: string }> {
  const lines: string[] = [];
  const orig = { log: console.log, error: console.error };
  console.log = console.error = (...a: unknown[]) => { lines.push(a.map(String).join(' ')); };
  try {
    return { code: await fn(), out: lines.join('\n') };
  } finally {
    console.log = orig.log;
    console.error = orig.error;
  }
}

const write = (root: string, rel: string, body = 'x\n'): void => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), body);
};

/** A brain==code repo with spec-kit installed and a written constitution, and a change `slug` declared on it. */
async function brainWithChange(slug: string): Promise<string> {
  const b = join(mkdtempSync(join(tmpdir(), 'mvac-carry-')), 'brain');
  initRepo(b, {
    '.multivac/config.yml': 'doors: [agents]\nsdd: speckit\nrepos:\n  brain: .\n',
    '.multivac/invariants.md': '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n',
    '.multivac/.gitignore': 'cache/\nworktrees/\n',
    '.specify/integration.json': SPECKIT_INTEGRATION_JSON,
    '.specify/memory/constitution.md': '# Acme Constitution\n\n### I. Law first\n',
    '.specify/.gitignore': 'feature.json\n',
  });
  assert.equal((await quiet(() => change.run(['new', slug, slug], { cwd: b }))).code, 0);
  const parsed = await loadChange(b, slug);
  parsed.change.repos = { brain: { status: 'planned' } };
  parsed.change.landing_order = [['brain']];
  parsed.change.invariants.adds = [];
  await saveChange(b, parsed);
  git(b, 'add', '-A');
  git(b, 'commit', '-qm', 'declare');
  return b;
}

const feature = (slug: string): string => `specs/001-${slug}`;

async function planned(b: string, slug: string): Promise<void> {
  write(b, `${feature(slug)}/spec.md`, '# spec\n');
  write(b, `${feature(slug)}/plan.md`, '# plan\n');
  write(b, `${feature(slug)}/tasks.md`, '- [x] T001 done\n');
  const p = await quiet(() => change.run(['plan', slug], { cwd: b }));
  assert.equal(p.code, 0, p.out);
}

test('apply carries the change\'s artifacts onto its branch, and the merge is clean — MV-133', async () => {
  const slug = 'carry-a';
  const b = await brainWithChange(slug);
  await planned(b, slug);
  write(b, '.specify/templates/new-template.md', '# vendor file\n');
  const a = await quiet(() => change.run(['apply', slug], { cwd: b }));
  assert.equal(a.code, 0, a.out);
  assert.match(a.out, /brain: carried 4 speckit files onto carry-a and committed them there$/m);

  const wt = join(b, '.multivac/worktrees', slug, 'brain');
  assert.match(git(wt, 'log', '-1', '--format=%s'), /change apply: carry-a — carry the speckit files onto the branch/);
  assert.equal(git(wt, 'ls-files', feature(slug)).split('\n').length, 3);
  assert.ok(git(wt, 'ls-files', '.specify/templates/new-template.md'));
  assert.equal(existsSync(join(b, feature(slug))), false, 'gone from the checkout');
  assert.equal(JSON.parse(readFileSync(join(wt, '.specify/feature.json'), 'utf8')).feature_directory, feature(slug));

  // Re-apply still passes: the gate finds the proofs on the change's worktree.
  assert.equal((await quiet(() => change.run(['apply', slug], { cwd: b }))).code, 0);
  // The merge no longer stops on an untracked copy.
  git(b, 'merge', '--no-ff', '-q', slug, '-m', 'merge');
  assert.ok(existsSync(join(b, feature(slug), 'tasks.md')));
});

test('nothing uncommitted: apply carries nothing and makes no carry commit — MV-133', async () => {
  const slug = 'carry-b';
  const b = await brainWithChange(slug);
  await planned(b, slug);
  git(b, 'add', '-A');
  git(b, 'commit', '-qm', 'artifacts committed by hand');
  const a = await quiet(() => change.run(['apply', slug], { cwd: b }));
  assert.equal(a.code, 0, a.out);
  assert.doesNotMatch(a.out, /carried/);
  const wt = join(b, '.multivac/worktrees', slug, 'brain');
  assert.doesNotMatch(git(wt, 'log', '-1', '--format=%s'), /carry the/);
});

test('a tracked, modified artifact is refused before anything moves — MV-133', async () => {
  const slug = 'carry-c';
  const b = await brainWithChange(slug);
  await planned(b, slug);
  git(b, 'add', '-A');
  git(b, 'commit', '-qm', 'artifacts');
  write(b, `${feature(slug)}/tasks.md`, '- [x] T001 done\n- [x] T002 edited\n');
  const before = git(b, 'rev-parse', 'HEAD');
  const a = await quiet(() => change.run(['apply', slug], { cwd: b }));
  assert.equal(a.code, 1, a.out);
  assert.match(a.out, /cannot be carried onto the change branch \(MV-133\) — nothing was branched or bumped/);
  assert.match(a.out, /brain: specs\/001-carry-c\/tasks\.md is tracked and modified here/);
  assert.equal(git(b, 'rev-parse', 'HEAD'), before, 'no bookkeeping commit');
  assert.equal(existsSync(join(b, '.multivac/worktrees', slug)), false, 'no worktree');
});

test('an ignored shared file is refused, naming how to find the rule — MV-133', async () => {
  const slug = 'carry-d';
  const b = await brainWithChange(slug);
  await planned(b, slug);
  write(b, '.gitignore', '.specify/extras/\n');
  git(b, 'add', '.gitignore');
  git(b, 'commit', '-qm', 'ignore');
  write(b, '.specify/extras/hidden.md', '# never committable\n');
  const a = await quiet(() => change.run(['apply', slug], { cwd: b }));
  assert.equal(a.code, 1, a.out);
  assert.match(a.out, /\.specify\/extras\/hidden\.md is ignored, so it cannot be committed — `git -C .* check-ignore -v \.specify\/extras\/hidden\.md` names the rule/);
});
