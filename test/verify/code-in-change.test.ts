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
import { count } from '../../src/commands/count.js';
import { change } from '../../src/commands/change.js';
import { doctorReport } from '../../src/commands/doctor.js';
import { loadChange, saveChange } from '../../src/change/file.js';
import { loadConfig } from '../../src/lib/config.js';
import { nonCodeGlobs } from '../../src/lib/code-in-change.js';
import picomatch from 'picomatch';

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

test('a change closed on its own branch is judged as it was while open; one closed before the range is not — MV-142', async () => {
  const b = brain();
  const base = git(b, 'rev-parse', 'HEAD');
  git(b, 'switch', '-qc', 'feat');
  put(b, '.multivac/changes/feat.md', openChange('feat'));
  git(b, 'add', '.multivac/changes');
  git(b, 'commit', '-qm', 'open');
  stageCode(b);
  git(b, 'commit', '-qm', 'code', '--no-verify');
  mkdirSync(join(b, '.multivac/changes/archive'), { recursive: true });
  renameSync(join(b, '.multivac/changes/feat.md'), join(b, '.multivac/changes/archive/feat.md'));
  git(b, 'add', '-A', '.multivac/changes');
  git(b, 'commit', '-qm', 'archive');
  const head = git(b, 'rev-parse', 'HEAD');
  const ok = await verifyIn(b, '--strict', '--range', `${base}..${head}`, '--branch', 'feat');
  assert.equal(ok.code, 0, ok.out);
  assert.match(ok.out, /lands in open change feat/);

  // Closed already at the base: new code on its old branch is not its code.
  stageCode(b);
  git(b, 'commit', '-qm', 'late code', '--no-verify');
  const late = await verifyIn(b, '--strict', '--range', `${head}..HEAD`, '--branch', 'feat');
  assert.equal(late.code, 1, late.out);
  assert.match(late.out, /on branch feat, which is no open change declaring brain/);
});

test('what init, the SDD and the grapher write for a harness is not code; .github workflows are — MV-142', async () => {
  const cfg = { ...(await loadConfig(brain())), grapher: 'graphify' } as Awaited<ReturnType<typeof loadConfig>>;
  const nonCode = picomatch(nonCodeGlobs(cfg), { dot: true });
  for (const p of ['.gitignore', '.graphifyignore', '.agents/skills/graphify/SKILL.md', '.agents/skills/speckit-plan/SKILL.md', '.claude/commands/opsx/propose.md', '.cursor/rules/graphify.mdc', '.claude/CLAUDE.md', '.github/copilot-instructions.md', 'AGENTS.md']) {
    assert.ok(nonCode(p), p);
  }
  for (const p of ['.github/workflows/ci.yml', 'src/a.ts', 'package.json']) assert.ok(!nonCode(p), p);
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

test('a door file and a retired door file are never code — MV-143', async () => {
  const b = join(mkdtempSync(join(tmpdir(), 'mvac-noncode-')), 'brain');
  initRepo(b, {
    '.multivac/config.yml': 'doors: [agents, claude, cursor, gemini]\ngrapher: graphify\nrepos:\n  brain: .\n',
    '.multivac/invariants.md': '# Invariants\n',
  });
  const cfg = await loadConfig(b);
  const globs = nonCodeGlobs(cfg);
  const nonCode = picomatch(globs, { dot: true });
  for (const p of [
    'AGENTS.md',
    'CLAUDE.md',
    'GEMINI.md',
    '.claude/settings.json',
    '.cursor/rules/multivac.mdc',
    '.cursor/rules/graphify.mdc',
  ]) {
    assert.ok(nonCode(p), `${p} must not count as code — the operator commits door files`);
  }
  assert.ok(!nonCode('src/cli.ts'), 'code is still code');
});

test('the directories a declared integration installs into are not code — MV-142, MV-144', async () => {
  const b = join(mkdtempSync(join(tmpdir(), 'mvac-integ-')), 'brain');
  initRepo(b, {
    '.multivac/config.yml': 'doors: [agents, claude]\nsdd: opsx\nrepos:\n  brain: .\n',
    '.multivac/invariants.md': '# Invariants\n',
  });
  const nonCode = picomatch(nonCodeGlobs(await loadConfig(b)), { dot: true });
  // openspec's `agents` integration writes `.agents/`, its `claude` one
  // `.claude/` — measured, and the reason a fresh opsx brain used to be refused
  // its own first commit.
  assert.ok(nonCode('.agents/skills/openspec/SKILL.md'), '.agents is the tool\'s');
  assert.ok(nonCode('.claude/commands/opsx/propose.md'), '.claude is the tool\'s');
  // A directory only an integration nobody declared would write stays code:
  // openspec's `windsurf` writes `.devin/`, and no door here asks for it.
  assert.ok(!nonCode('.devin/skills/openspec/SKILL.md'), 'not declared, so not exempt');
  assert.ok(!nonCode('src/cli.ts'), 'code is still code');
});

/**
 * MV-147: the scaffold installs no command body, so the ones in a brain are an
 * earlier init's, and `doctor` prints their removal. That commit is not code
 * under any integration's directory, declared door or not, nor under
 * `.codex/`, which openspec 1.7.0's codex wrote — by the entry names openspec's
 * inits write, so the rest of those directories stays code.
 */
test("the bodies an openspec init writes are not code under any integration's directory, declared or not", async () => {
  const b = join(mkdtempSync(join(tmpdir(), 'mvac-bodies-')), 'brain');
  initRepo(b, {
    '.multivac/config.yml': 'doors: [claude]\nsdd: opsx\nrepos:\n  brain: .\n',
    '.multivac/invariants.md': '# Invariants\n',
  });
  const nonCode = picomatch(nonCodeGlobs(await loadConfig(b)), { dot: true });
  for (const p of [
    '.devin/skills/openspec-propose/SKILL.md',
    '.codex/skills/openspec-explore/SKILL.md',
    '.github/prompts/opsx-apply.prompt.md',
    '.agents/skills/.openspec-target',
    '.gemini/commands/opsx/propose.toml',
    '.cursor/commands/opsx-apply.md',
  ]) {
    assert.ok(nonCode(p), `${p} is an init's body`);
  }
  for (const p of ['.devin/skills/openspec/SKILL.md', '.codex/config.toml', '.github/workflows/ci.yml', 'src/cli.ts']) {
    assert.ok(!nonCode(p), `${p} is code`);
  }
  // In a code repo too: a body is the vendor's wherever an earlier init left it.
  writeFileSync(join(b, '.multivac/config.yml'), 'doors: [claude]\nsdd: opsx\nrepos:\n  brain: .\n  api: ../api\n');
  const inApi = picomatch(nonCodeGlobs(await loadConfig(b), 'api'), { dot: true });
  assert.ok(inApi('.codex/skills/openspec-explore/SKILL.md'));
  assert.ok(!inApi('.codex/config.toml'));
});

// --- MV-146: the SDD runs in the brain alone, and governs every code repo's code ---

const LAW = '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n';

/** A code repo `api` with the brain mounted at `.brain`, declaring it under this config. */
function consumer(config: string): string {
  const api = join(mkdtempSync(join(tmpdir(), 'mvac-consumer-')), 'api');
  initRepo(api, { 'src/index.ts': 'export const app = 1;\n' });
  initRepo(join(api, '.brain'), { '.multivac/config.yml': config, '.multivac/invariants.md': LAW });
  return api;
}

const stageIn = (repo: string, rel: string): void => {
  put(repo, rel, `x ${Math.random()}\n`);
  git(repo, 'add', rel);
};

test("a code repo's code is governed by the brain's SDD: refused on main under --strict, exempt under sdd: none — MV-146", async () => {
  // The code repo declares no SDD of its own: it runs none, and the brain's governs it.
  const api = consumer('doors: [agents]\nsdd: speckit\nrepos:\n  api: ../api\n');
  stageIn(api, 'src/index.ts');
  const strict = await verifyIn(api, '--strict');
  assert.equal(strict.code, 1, strict.out);
  assert.match(strict.out, /code {6}1 code path \(src\/index\.ts\) on main, which is no open change declaring api — start a change .* · blocking/);
  // Without --strict the mount can lag: reported, not gated (MV-137).
  const lagging = await verifyIn(api);
  assert.equal(lagging.code, 0, lagging.out);
  assert.match(lagging.out, /which is no open change in the mounted brain/);

  const exempt = consumer('doors: [agents]\nsdd: speckit\nrepos:\n  api:\n    path: ../api\n    sdd: none\n');
  stageIn(exempt, 'src/index.ts');
  const r = await verifyIn(exempt, '--strict');
  assert.equal(r.code, 0, r.out);
  assert.doesNotMatch(r.out, /^ {2}code /m);
});

test("with no SDD in the brain, or sdd_auto off, a code repo's code is not judged — MV-146", async () => {
  for (const config of [
    'doors: [agents]\nrepos:\n  api: ../api\n',
    'doors: [agents]\nsdd: none\nrepos:\n  api: ../api\n',
    'doors: [agents]\nsdd: speckit\nsdd_auto: false\nrepos:\n  api: ../api\n',
  ]) {
    const api = consumer(config);
    stageIn(api, 'src/index.ts');
    const r = await verifyIn(api, '--strict');
    assert.equal(r.code, 0, `${config}\n${r.out}`);
    assert.doesNotMatch(r.out, /^ {2}code /m, config);
  }
});

test("a code repo's specs/ is code; the brain's is not, and every known SDD's install is nobody's code — MV-146", async () => {
  const b = join(mkdtempSync(join(tmpdir(), 'mvac-specs-')), 'brain');
  initRepo(b, {
    '.multivac/config.yml': 'doors: [agents, claude]\nsdd: speckit\nrepos:\n  brain: .\n  api: ../api\n',
    '.multivac/invariants.md': LAW,
  });
  const cfg = await loadConfig(b);
  const inBrain = picomatch(nonCodeGlobs(cfg, 'brain'), { dot: true });
  const inApi = picomatch(nonCodeGlobs(cfg, 'api'), { dot: true });
  // The SDD's step artifacts and project document are the brain's.
  for (const p of ['specs/001-x/spec.md', '.specify/memory/constitution.md']) assert.ok(inBrain(p), p);
  // In a code repo `specs/` is no SDD's directory — a test tree is code.
  assert.ok(!inApi('specs/001-x/spec.md'), 'specs/ is code in a code repo');
  assert.ok(!inApi('src/index.ts'));
  // A leftover install of ANY known SDD is vendor state, not code, in every repo —
  // opsx's artifact paths match no file below them, so its directory is taken whole.
  for (const p of [
    '.specify/x',
    '.specify/integration.json',
    'openspec/config.yaml',
    'openspec/specs/.gitkeep',
    'openspec/changes/archive/.gitkeep',
    '.claude/skills/speckit-plan/SKILL.md',
  ]) {
    assert.ok(inApi(p), `${p} in a code repo`);
    assert.ok(inBrain(p), `${p} in the brain`);
  }

  // The same verdicts through verify, in a consumer on main.
  const api = consumer('doors: [agents]\nsdd: speckit\nrepos:\n  api: ../api\n');
  stageIn(api, 'specs/x.ts');
  assert.equal((await verifyIn(api, '--strict')).code, 1, 'a staged specs/ file in a code repo is code');
  git(api, 'reset', '-q');
  for (const rel of ['.specify/x', 'openspec/config.yaml']) {
    stageIn(api, rel);
    const r = await verifyIn(api, '--strict');
    assert.equal(r.code, 0, `${rel}\n${r.out}`);
    assert.doesNotMatch(r.out, /^ {2}code /m, rel);
    git(api, 'reset', '-q');
  }
});

test("a consumer whose mounted config is refused prints the line, exits 0, and 1 under --strict — MV-146", async () => {
  // The mount lags its brain, and its owner fixes the config: a hook here must
  // not exit 2 over it — neither load on verify's path, nor count's. Each of
  // the three refusals, the same way.
  for (const [config, refusal] of [
    [
      'doors: [agents]\nsdd: speckit\nrepos:\n  api:\n    path: ../api\n    sdd: opsx\n',
      /repos\.api\.sdd: opsx — REFUSED: the SDD lives in the brain alone/,
    ],
    [
      'doors: [agents]\nsdd: speckit\nrepos:\n  brain:\n    path: .\n    sdd: none\n  api: ../api\n',
      /sdd: speckit — REFUSED: the brain's own entry repos\.brain\.sdd says none, so speckit resolves in no root/,
    ],
    ['doors: [agents]\nsdd: acme\nrepos:\n  api: ../api\n', /sdd: acme — REFUSED: no SDD adapter is named acme/],
  ] as const) {
    const api = consumer(config);
    const line = new RegExp(
      `^ {2}sdd {7}${refusal.source}.*\`multivac change new <slug>\` — in the mounted brain's config; its owner fixes it`,
      'm',
    );
    const r = await verifyIn(api);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, line);
    assert.doesNotMatch(r.out, /blocking under --strict/);

    const strict = await verifyIn(api, '--strict');
    assert.equal(strict.code, 1, strict.out);
    assert.match(strict.out, line);
    assert.match(strict.out, /its owner fixes it · blocking under --strict$/m);
    assert.match(strict.out, /^1 blocking broken · exit 1$/m);

    const counted = await run(() => count.run(['brain:.multivac/config.yml /sdd/'], { cwd: api }));
    assert.equal(counted.code, 0, counted.out);
    assert.match(counted.out, line);

    // In the brain itself the same config is refused at load.
    assert.equal((await verifyIn(join(api, '.brain'))).code, 2, refusal.source);
  }
});
