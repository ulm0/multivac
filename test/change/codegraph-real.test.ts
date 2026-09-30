// MV-149, against the real codegraph: the facts a change worktree's own index
// is built on. Pinned to the version they were measured on (MV-121 says to
// re-measure on another one), so the test runs only where `codegraph
// --version` prints exactly `1.6.0` and is skipped everywhere else. CI
// installs no vendor, so it runs locally only and pins nothing there. Its own
// codegraph calls would queue telemetry in the developer's real
// ~/.codegraph/telemetry-queue.jsonl, so every spawn gets HOME set to a
// scratch directory and the opt-outs the entry's `env` sets, plus the update
// check's; stdin is closed, as the grapher runner closes it.

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';

const PINNED = '1.6.0';

const isolated = (home: string): NodeJS.ProcessEnv => ({
  ...process.env,
  HOME: home,
  GIT_CONFIG_GLOBAL: '/dev/null',
  DO_NOT_TRACK: '1',
  CODEGRAPH_TELEMETRY: '0',
  CODEGRAPH_NO_DOWNLOAD: '1',
  CODEGRAPH_NO_UPDATE_CHECK: '1',
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
});

const home = mkdtempSync(join(tmpdir(), 'mvac-codegraph-home-'));
const run = (cwd: string, cmd: string, env: NodeJS.ProcessEnv = isolated(home)) =>
  spawnSync('sh', ['-c', cmd], { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const probe = run(home, 'codegraph --version');
const skip = probe.status === 0 && probe.stdout.trim() === PINNED ? false : `codegraph ${PINNED} is not reachable here`;

/** Every file under `dir`, relative, outside `.git`. */
function files(dir: string, at = dir): string[] {
  const out: string[] = [];
  for (const e of readdirSync(at, { withFileTypes: true })) {
    if (e.name === '.git') continue;
    const p = join(at, e.name);
    if (e.isDirectory()) out.push(...files(dir, p));
    else out.push(relative(dir, p));
  }
  return out.sort();
}

/** `codegraph query <symbol> -p <dir> --json`, parsed: never `grep -c`, which counts the name its miss echoes. */
function answers(cwd: string, symbol: string, dir: string): unknown[] {
  const r = run(cwd, `codegraph query ${symbol} -p '${dir}' --json`);
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout) as unknown[];
}

test("a change worktree's own codegraph index answers for the branch and writes nothing outside it — MV-149", { skip }, () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-codegraph-real-'));
  const repo = join(tmp, 'repo');
  const wt = join(tmp, 'wt');
  for (const [rel, body] of Object.entries({
    'src/a.ts': 'export function alphaTrunk() { return 1; }\n',
    '.gitignore': '.codegraph/\n',
  })) {
    mkdirSync(dirname(join(repo, rel)), { recursive: true });
    writeFileSync(join(repo, rel), body);
  }
  assert.equal(run(repo, 'git init -q -b main && git add -A && git commit -qm init').status, 0);
  const trunk = run(repo, 'codegraph init');
  assert.equal(trunk.status, 0, trunk.stderr);

  // A branch-only function, in a worktree of the repo.
  assert.equal(run(repo, `git worktree add -q -b feat '${wt}'`).status, 0);
  writeFileSync(join(wt, 'src/b.ts'), 'export function betaBranchOnly() { return 2; }\n');
  assert.equal(run(wt, 'git add -A && git commit -qm b').status, 0);
  const hooks = (): string[] => readdirSync(join(repo, '.git/hooks')).filter((f) => !f.endsWith('.sample'));
  const hooksBefore = hooks();
  const before = files(wt);

  // With its watcher off it prompts; stdin closed, it reads end-of-file and
  // goes on, and installs no git hook.
  const built = run(wt, 'codegraph init', { ...isolated(home), CODEGRAPH_NO_WATCH: '1' });
  assert.equal(built.status, 0, built.stderr);
  assert.deepEqual(hooks(), hooksBefore, 'no git hook installed');
  assert.deepEqual(
    files(wt).filter((f) => !before.includes(f)).filter((f) => !f.startsWith('.codegraph/')),
    [],
    'a worktree init writes only under .codegraph/',
  );
  assert.ok(files(wt).includes('.codegraph/codegraph.db'));
  assert.equal(run(wt, 'git status --porcelain').stdout, '', 'the committed ignore line keeps the worktree clean');

  // Asked from the repo's checkout: the worktree's index holds the branch's
  // function, the trunk's does not.
  assert.ok(answers(repo, 'betaBranchOnly', wt).length > 0, 'the worktree index answers for the branch');
  assert.equal(answers(repo, 'betaBranchOnly', repo).length, 0, 'the trunk index lacks it');
  assert.ok(answers(repo, 'alphaTrunk', wt).length > 0);
});

test("codegraph.json's exclude of the mount keeps a mounted brain's files out of the consumer's index — MV-149", { skip }, () => {
  // A brain holding code, mounted as a submodule at `.brain` in a consumer:
  // without the line the consumer's index holds the brain's symbols too (2,247
  // of 2,254 nodes, measured on this repository mounted), and with the 38-byte
  // file multivac writes before the first build it holds its own alone.
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-codegraph-mount-'));
  const brain = join(tmp, 'brain');
  mkdirSync(join(brain, 'src'), { recursive: true });
  writeFileSync(join(brain, 'src/law.ts'), 'export function gammaBrainOnly() { return 3; }\n');
  assert.equal(run(brain, 'git init -q -b main && git add -A && git commit -qm brain').status, 0);
  const consumer = (name: string, json: string | null): string => {
    const dir = join(tmp, name);
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(join(dir, 'src/app.ts'), 'export function deltaConsumerOnly() { return 4; }\n');
    writeFileSync(join(dir, '.gitignore'), '.codegraph/\n');
    if (json !== null) writeFileSync(join(dir, 'codegraph.json'), json);
    const made = run(
      dir,
      `git init -q -b main && git -c protocol.file.allow=always submodule add -q '${brain}' .brain && git add -A && git commit -qm init`,
    );
    assert.equal(made.status, 0, made.stderr);
    const built = run(dir, 'codegraph init');
    assert.equal(built.status, 0, built.stderr);
    return dir;
  };
  const open = consumer('open', null);
  assert.ok(answers(open, 'gammaBrainOnly', open).length > 0, 'without the line the mount is indexed');
  const kept = consumer('kept', '{\n  "exclude": [\n    "/.brain/"\n  ]\n}\n');
  assert.equal(answers(kept, 'gammaBrainOnly', kept).length, 0, 'the mount is out of the index');
  assert.ok(answers(kept, 'deltaConsumerOnly', kept).length > 0, "the consumer's own symbols are in");
});

test('`node -f` narrows only to a text a printed path holds, and any other prints every definition, silently — MV-149', { skip }, () => {
  // The door's `node` answer says `-f <file>`, spelled as answers print it,
  // picks one of several same-named. What a miss does was first recorded as a
  // loud "No indexed file matches"; asked with a symbol it is silent: every
  // definition, exit 0. That message is file mode's alone, with no symbol.
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-codegraph-nodef-'));
  const repo = join(tmp, 'repo');
  for (const [rel, body] of Object.entries({
    'src/a/one.ts': 'export function twin() { return 1; }\n',
    'src/b/two.ts': 'export function twin() { return 2; }\n',
    '.gitignore': '.codegraph/\n',
  })) {
    mkdirSync(dirname(join(repo, rel)), { recursive: true });
    writeFileSync(join(repo, rel), body);
  }
  assert.equal(run(repo, 'git init -q -b main && git add -A && git commit -qm init').status, 0);
  const built = run(repo, 'codegraph init');
  assert.equal(built.status, 0, built.stderr);
  const node = (args: string): string => {
    const r = run(repo, `codegraph node ${args}`);
    assert.equal(r.status, 0, r.stderr);
    return r.stdout;
  };
  const every = node('twin');
  assert.match(every, /src\/a\/one\.ts/);
  assert.match(every, /src\/b\/two\.ts/);
  // The path as answers print it, a suffix of it, in any case: one definition.
  for (const f of ['src/a/one.ts', 'one.ts', 'ONE.ts']) {
    const one = node(`twin -f '${f}'`);
    assert.match(one, /src\/a\/one\.ts/, f);
    assert.doesNotMatch(one, /src\/b\/two\.ts/, f);
  }
  // A text no printed path holds: byte for byte what no `-f` prints, no warning.
  for (const f of ['./src/a/one.ts', join(repo, 'src/a/one.ts'), '../elsewhere/x.ts']) {
    const miss = node(`twin -f '${f}'`);
    assert.equal(miss, every, f);
    assert.doesNotMatch(miss, /No indexed file matches/, f);
  }
  assert.match(node("-f '../elsewhere/x.ts'"), /No indexed file matches/);
});
