// MV-138. A consumer's change worktree, at <brain>/.multivac/worktrees/<slug>/<key>,
// is verified against the brain its path names — not against a mount that is
// an uninitialised submodule there.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { verify, worktreeBrain } from '../../src/commands/verify.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();

async function run(cwd: string, ...args: string[]): Promise<{ code: number; out: string }> {
  const lines: string[] = [];
  const orig = { log: console.log, error: console.error };
  console.log = console.error = (...a: unknown[]) => { lines.push(a.map(String).join(' ')); };
  try {
    return { code: await verify.run(args, { cwd }), out: lines.join('\n').replace(/\x1b\[[0-9;]*m/g, '') };
  } finally {
    console.log = orig.log;
    console.error = orig.error;
  }
}

const open = (slug: string, repo: string): string =>
  `---\nslug: ${slug}\nstatus: open\nrepos:\n  ${repo}:\n    status: branched\nlanding_order:\n  - - ${repo}\ninvariants:\n  touches: []\n  adds: []\n  retires: []\nclaims: []\n---\n\n# ${slug}\n`;

function eco() {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-wtbrain-')));
  const e = makeScratchEcosystem(tmp);
  writeFileSync(join(e.brain, '.multivac/config.yml'), 'doors: [agents]\nsdd: speckit\nrepos:\n  api: ../acme-api\n  web: ../acme-web\n');
  mkdirSync(join(e.brain, '.multivac/changes'), { recursive: true });
  writeFileSync(join(e.brain, '.multivac/changes/feat.md'), open('feat', 'api'));
  writeFileSync(join(e.brain, '.multivac/changes/webonly.md'), open('webonly', 'web'));
  const wt = (slug: string, key: string, repo: string): string => {
    const dir = join(e.brain, '.multivac/worktrees', slug, key);
    git(repo, 'worktree', 'add', '-q', '-b', slug, dir);
    mkdirSync(join(dir, '.brain')); // the mount: a submodule nobody initialised
    return dir;
  };
  return { ...e, wt };
}

test('the path names the brain, the change and the key — MV-138', () => {
  const e = eco();
  const dir = e.wt('feat', 'api', e.repos.api);
  assert.deepEqual(worktreeBrain(join(dir, 'src')), { brain: e.brain, slug: 'feat', key: 'api', root: dir });
  assert.equal(worktreeBrain(e.repos.api), null);
});

test('verify in a consumer change worktree scopes to its key and reads the brain, not the empty mount — MV-138', async () => {
  const e = eco();
  const dir = e.wt('feat', 'api', e.repos.api);
  const r = await run(dir);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, new RegExp(`scoped to repo "api" · brain at ${e.brain} \\(the change worktree for feat\\)`));
  assert.doesNotMatch(r.out, /is mounted but is not a multivac brain/);

  // Code staged here is judged against the brain itself, which does not lag.
  writeFileSync(join(dir, 'src/server.ts'), 'export const port = 9090;\n');
  git(dir, 'add', 'src/server.ts');
  const ok = await run(dir);
  assert.equal(ok.code, 0, ok.out);
  assert.match(ok.out, /1 code path \(src\/server\.ts\) lands in open change feat/);

  const foreign = e.wt('webonly', 'api', e.repos.api);
  writeFileSync(join(foreign, 'src/server.ts'), 'export const port = 7070;\n');
  git(foreign, 'add', 'src/server.ts');
  const bad = await run(foreign);
  assert.equal(bad.code, 1, bad.out);
  assert.match(bad.out, /on webonly, whose change does not declare api/);
});

test('a worktree for a key the brain does not declare names the declared keys — MV-138', async () => {
  const e = eco();
  const dir = e.wt('feat', 'nope', e.repos.api);
  const r = await run(dir);
  assert.equal(r.code, 2, r.out);
  assert.match(r.out, /this is feat's worktree for "nope", which the brain at .* does not declare — declared: api, web/);
});
