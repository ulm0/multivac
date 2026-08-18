// MV-94: a pin behind its channel is said at the moment work starts.
//
// The tool already knew — `stalenessLines` computes it offline and `verify`
// reports it — but `change new` and `change apply` said nothing, and those are
// the two commands that mean "I am starting". Reports, never refuses: offline,
// a pin behind its channel means somebody landed work OR nobody fetched, and
// refusing on the second reading fails an ordinary morning.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const capture = async (fn: () => Promise<number>): Promise<{ code: number; out: string }> => {
  const lines: string[] = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (l: string) => lines.push(String(l));
  console.error = (l: string) => lines.push(String(l));
  try {
    return { code: await fn(), out: lines.join('\n') };
  } finally {
    console.log = origLog;
    console.error = origErr;
  }
};

const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();

/** api mounts the brain as a gitlink; the brain then moves one commit ahead. */
function staleEco(cfgExtra = ''): { brain: string; ctx: { cwd: string }; branch: string } {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-stale-'));
  const e = makeScratchEcosystem(tmp);
  const branch = git(e.brain, 'symbolic-ref', '--short', 'HEAD');
  const pin = git(e.brain, 'rev-parse', 'HEAD');
  git(e.repos.api, 'update-index', '--add', '--cacheinfo', `160000,${pin},.brain`);
  git(e.repos.api, 'commit', '-q', '-m', 'mount brain');
  // the brain moves ahead: the pin is now one behind its channel
  writeFileSync(join(e.brain, 'notes.md'), '# notes\n');
  git(e.brain, 'add', '-A');
  git(e.brain, 'commit', '-q', '-m', 'brain moves');
  writeFileSync(
    join(e.brain, '.multivac/config.yml'),
    `doors: [agents]\nmount: .brain\nchannel: ${branch}\n${cfgExtra}repos:\n  api: ../acme-api\n`,
  );
  return { brain: e.brain, ctx: { cwd: e.brain }, branch };
}

test('change new reports a pin behind its channel, and creates the change anyway', async () => {
  const { brain, ctx, branch } = staleEco();
  const c = await capture(() => change.run(['new', 'points-expire', 'Points expire'], ctx));
  assert.equal(c.code, 0, 'never refused');
  assert.match(c.out, /brain pins behind their channel — refresh before deciding against the law:/);
  assert.match(c.out, new RegExp(`api: pin \\d+ behind ${branch}`));
  assert.match(c.out, /submodule update --remote/);
  assert.match(c.out, /never fetched|last fetch/);
  assert.ok(existsSync(join(brain, '.multivac/changes/points-expire.md')), 'the change exists');
});

test('change apply reports it too — the other moment work starts', async () => {
  const { brain, ctx, branch } = staleEco();
  await capture(() => change.run(['new', 'points-expire', 'Points expire'], ctx));
  const file = join(brain, '.multivac/changes/points-expire.md');
  const { readFileSync, writeFileSync: wf } = await import('node:fs');
  wf(
    file,
    readFileSync(file, 'utf8')
      .replace('repos: {}', 'repos:\n  api:\n    status: planned')
      .replace('landing_order: []', 'landing_order:\n  - - api'),
  );
  const c = await capture(() => change.run(['apply', 'points-expire', '--no-sdd'], ctx));
  assert.match(c.out, new RegExp(`api: pin \\d+ behind ${branch}`));
});

test('current pins print nothing at all', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-fresh-'));
  const e = makeScratchEcosystem(tmp);
  const branch = git(e.brain, 'symbolic-ref', '--short', 'HEAD');
  const pin = git(e.brain, 'rev-parse', 'HEAD');
  git(e.repos.api, 'update-index', '--add', '--cacheinfo', `160000,${pin},.brain`);
  git(e.repos.api, 'commit', '-q', '-m', 'mount brain');
  writeFileSync(
    join(e.brain, '.multivac/config.yml'),
    `doors: [agents]\nmount: .brain\nchannel: ${branch}\nrepos:\n  api: ../acme-api\n`,
  );
  const c = await capture(() => change.run(['new', 'x', 'X'], { cwd: e.brain }));
  assert.equal(c.out.includes('brain pins behind their channel'), false);
  assert.equal(c.out.includes('stale'), false);
});

test('a channel that does not resolve locally is reported as uncomparable, never guessed', async () => {
  const { ctx } = staleEco('staleness: block\n');
  // Point the channel at a ref this checkout has never seen.
  const { readFileSync, writeFileSync: wf } = await import('node:fs');
  const cfg = join(ctx.cwd, '.multivac/config.yml');
  wf(cfg, readFileSync(cfg, 'utf8').replace(/^channel: .*$/m, 'channel: origin/never-fetched'));
  const c = await capture(() => change.run(['new', 'y', 'Y'], ctx));
  assert.equal(c.code, 0);
  assert.match(c.out, /channel origin\/never-fetched unknown locally — reported only, cannot gate offline/);
});

test('a stale pin never refuses, whatever staleness is set to', async () => {
  // `staleness: block` is the verifier's gate and stays there. The lifecycle
  // adds no second refusal: two places to be wrong about one question.
  const { brain, ctx } = staleEco('staleness: block\n');
  const c = await capture(() => change.run(['new', 'z', 'Z'], ctx));
  assert.equal(c.code, 0);
  assert.ok(existsSync(join(brain, '.multivac/changes/z.md')));
});
