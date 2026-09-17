// MV-137. With an SDD declared and its automation on, code lands only through
// the branch of an open change that declares the repo — at commit, at a local
// merge, and over a CI range.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, renameSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { initRepo } from '../helpers/fixture.js';
import { SPECKIT_INTEGRATION_JSON } from '../helpers/recorded.js';
import { verify } from '../../src/commands/verify.js';
import { change } from '../../src/commands/change.js';
import { doctorReport } from '../../src/commands/doctor.js';
import { loadChange, saveChange } from '../../src/change/file.js';

process.env.PATH = [dirname(process.execPath), '/usr/bin', '/bin'].join(delimiter);
for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();

async function run(fn: () => Promise<number>): Promise<{ code: number; out: string }> {
  const lines: string[] = [];
  const orig = { log: console.log, error: console.error };
  console.log = console.error = (...a: unknown[]) => { lines.push(a.map(String).join(' ')); };
  try {
    return { code: await fn(), out: lines.join('\n').replace(/\x1b\[[0-9;]*m/g, '') };
  } finally {
    console.log = orig.log;
    console.error = orig.error;
  }
}

const put = (root: string, rel: string, body: string): void => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), body);
};

const openChange = (slug: string, repo = 'brain'): string =>
  `---\nslug: ${slug}\nstatus: open\nrepos:\n  ${repo}:\n    status: branched\nlanding_order:\n  - - ${repo}\ninvariants:\n  touches: []\n  adds: []\n  retires: []\nclaims: []\n---\n\n# ${slug}\n`;

function brain(extra = ''): string {
  const b = join(mkdtempSync(join(tmpdir(), 'mvac-code-')), 'brain');
  initRepo(b, {
    '.multivac/config.yml': `doors: [agents]\nsdd: speckit\n${extra}repos:\n  brain: .\n`,
    '.multivac/invariants.md': '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n',
    '.multivac/.gitignore': 'cache/\nworktrees/\n',
    '.specify/integration.json': SPECKIT_INTEGRATION_JSON,
    'src/a.ts': 'export const a = 1;\n',
  });
  return b;
}

const stageCode = (b: string): void => {
  put(b, 'src/a.ts', `export const a = ${Math.random()};\n`);
  git(b, 'add', 'src/a.ts');
};

const verifyIn = (b: string, ...args: string[]) => run(() => verify.run(args, { cwd: b }));

test('code on main with no open change is refused; non-code alone is not judged — MV-137', async () => {
  const b = brain();
  stageCode(b);
  const r = await verifyIn(b);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /code {6}1 code path \(src\/a\.ts\) on main, which is no open change declaring brain — start a change .* · blocking/);

  git(b, 'reset', '-q');
  put(b, '.multivac/ritual.md', '- [ ] x\n');
  put(b, 'specs/001-x/spec.md', '# spec\n');
  put(b, 'AGENTS.md', '# door\n');
  git(b, 'add', '.multivac/ritual.md', 'specs', 'AGENTS.md');
  const quiet = await verifyIn(b);
  assert.equal(quiet.code, 0, quiet.out);
  assert.doesNotMatch(quiet.out, /^ {2}code /m);
});

test('the branch of an open change declaring the repo passes; another branch, or a change not declaring it, is refused — MV-137', async () => {
  const b = brain();
  put(b, '.multivac/changes/feat.md', openChange('feat'));
  put(b, '.multivac/changes/elsewhere.md', openChange('elsewhere', 'api'));
  git(b, 'add', '.multivac/changes');
  git(b, 'commit', '-qm', 'open changes');

  git(b, 'switch', '-qc', 'feat');
  stageCode(b);
  const ok = await verifyIn(b);
  assert.equal(ok.code, 0, ok.out);
  assert.match(ok.out, /code {6}1 code path \(src\/a\.ts\) lands in open change feat$/m);

  git(b, 'commit', '-qm', 'code');
  git(b, 'switch', '-qc', 'some-other');
  stageCode(b);
  const other = await verifyIn(b);
  assert.equal(other.code, 1, other.out);
  assert.match(other.out, /on some-other, which is no open change declaring brain/);

  git(b, 'switch', '-qc', 'elsewhere');
  const foreign = await verifyIn(b);
  assert.equal(foreign.code, 1, foreign.out);
  assert.match(foreign.out, /on elsewhere, whose change does not declare brain — add brain to its repos:/);
});

test('close-<slug> is read at HEAD, where the change it archives is still open — MV-137', async () => {
  const b = brain();
  put(b, '.multivac/changes/feat.md', openChange('feat'));
  git(b, 'add', '.multivac/changes');
  git(b, 'commit', '-qm', 'open');
  git(b, 'switch', '-qc', 'close-feat');
  mkdirSync(join(b, '.multivac/changes/archive'), { recursive: true });
  renameSync(join(b, '.multivac/changes/feat.md'), join(b, '.multivac/changes/archive/feat.md'));
  git(b, 'add', '-A', '.multivac/changes');
  stageCode(b);
  const r = await verifyIn(b);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /lands in open change feat$/m);
});

test('a merge is judged by the branch at MERGE_HEAD — MV-137', async () => {
  const b = brain();
  put(b, '.multivac/changes/feat.md', openChange('feat'));
  git(b, 'add', '.multivac/changes');
  git(b, 'commit', '-qm', 'open');
  for (const br of ['feat', 'stray']) {
    git(b, 'switch', '-qc', br, 'main');
    put(b, `src/${br}.ts`, `export const x = '${br}';\n`);
    git(b, 'add', `src/${br}.ts`);
    git(b, 'commit', '-qm', br);
  }
  git(b, 'switch', '-q', 'main');
  git(b, 'merge', '--no-ff', '--no-commit', 'feat');
  const ok = await verifyIn(b);
  assert.equal(ok.code, 0, ok.out);
  assert.match(ok.out, /1 code path \(src\/feat\.ts\) lands in open change feat/);
  git(b, 'merge', '--abort');

  git(b, 'merge', '--no-ff', '--no-commit', 'stray');
  const bad = await verifyIn(b);
  assert.equal(bad.code, 1, bad.out);
  assert.match(bad.out, /on stray, which is no open change declaring brain/);
  git(b, 'merge', '--abort');
});

test('CI judges a range against its branch, and a base not in the clone is not answered — MV-137', async () => {
  const b = brain();
  put(b, '.multivac/changes/feat.md', openChange('feat'));
  git(b, 'add', '.multivac/changes');
  git(b, 'commit', '-qm', 'open');
  const base = git(b, 'rev-parse', 'HEAD');
  git(b, 'switch', '-qc', 'feat');
  stageCode(b);
  git(b, 'commit', '-qm', 'code', '--no-verify');
  const head = git(b, 'rev-parse', 'HEAD');
  git(b, 'switch', '-q', 'main');

  const ok = await verifyIn(b, '--strict', '--range', `${base}..${head}`, '--branch', 'feat');
  assert.equal(ok.code, 0, ok.out);
  assert.match(ok.out, /lands in open change feat/);

  const bad = await verifyIn(b, '--strict', '--range', `${base}..${head}`, '--branch', 'hotfix');
  assert.equal(bad.code, 1, bad.out);
  assert.match(bad.out, /on branch hotfix, which is no open change declaring brain/);

  const gone = await verifyIn(b, '--strict', '--range', `0123456789abcdef0123456789abcdef01234567..${head}`, '--branch', 'feat');
  assert.equal(gone.code, 1, gone.out);
  assert.match(gone.out, /code {6}not answered — base 0123456789abcdef0123456789abcdef01234567 is not in this clone — fetch the whole history \(GIT_DEPTH: 0\) · blocking under --strict/);

  assert.equal((await verifyIn(b, '--range', `${base}..${head}`)).code, 2, '--range needs --branch');
});

test('with sdd_auto off, or no SDD, nothing is judged; doctor names what makes it binding — MV-137', async () => {
  const off = brain('sdd_auto: false\n');
  stageCode(off);
  const r = await verifyIn(off);
  assert.equal(r.code, 0, r.out);
  assert.doesNotMatch(r.out, /^ {2}code /m);
  assert.doesNotMatch((await doctorReport(off)).lines.join('\n'), /^forge/m);

  const on = brain();
  assert.match((await doctorReport(on)).lines.join('\n'), /^forge {6}code lands in a change only where the forge requires the merge request pipeline .* ungateable from disk/m);
});

test('a skipped SDD is recorded in the change — MV-137', async () => {
  const b = brain();
  put(b, '.specify/memory/constitution.md', '# Acme\n\n### I. Law\n');
  git(b, 'add', '.specify');
  git(b, 'commit', '-qm', 'constitution');
  assert.equal((await run(() => change.run(['new', 'skip-it', 'Skip it'], { cwd: b }))).code, 0);
  const p = await loadChange(b, 'skip-it');
  p.change.repos = { brain: { status: 'planned' } };
  p.change.landing_order = [['brain']];
  p.change.invariants.adds = [];
  await saveChange(b, p);
  git(b, 'add', '.multivac');
  git(b, 'commit', '-qm', 'declare');
  const planned = await run(() => change.run(['plan', 'skip-it', '--no-sdd'], { cwd: b }));
  assert.equal(planned.code, 0, planned.out);
  assert.deepEqual((await loadChange(b, 'skip-it')).change.sdd_skipped, ['plan']);
  assert.match(git(b, 'log', '-1', '--format=%s'), /change plan: skip-it — SDD skipped/);
});

test('a real git merge runs pre-merge-commit before MERGE_HEAD exists, and is judged by the branch it merges — MV-137', async () => {
  const b = brain();
  put(b, '.multivac/changes/feat.md', openChange('feat'));
  git(b, 'add', '.multivac/changes');
  git(b, 'commit', '-qm', 'open');
  for (const br of ['feat', 'stray']) {
    git(b, 'switch', '-qc', br, 'main');
    put(b, `src/${br}.ts`, `export const x = '${br}';\n`);
    git(b, 'add', `src/${br}.ts`);
    git(b, 'commit', '-qm', br);
  }
  git(b, 'switch', '-q', 'main');
  const cli = join(process.cwd(), 'dist/cli.js');
  put(b, '.git/hooks/pre-merge-commit', `#!/bin/sh\nexec '${process.execPath}' '${cli}' verify\n`);
  execFileSync('chmod', ['+x', join(b, '.git/hooks/pre-merge-commit')]);
  const merge = (br: string) => spawnSync('git', ['-C', b, 'merge', '--no-ff', '-q', br, '-m', `merge ${br}`], { encoding: 'utf8' });
  const ok = merge('feat');
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout + ok.stderr, /lands in open change feat/);
  const bad = merge('stray');
  assert.notEqual(bad.status, 0, bad.stdout + bad.stderr);
  assert.match(bad.stdout + bad.stderr, /on stray, which is no open change declaring brain/);
  git(b, 'merge', '--abort');
});
