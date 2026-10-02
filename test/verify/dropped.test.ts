// MV-153. A config an earlier release wrote still names its code-graph keys.
// They load and change nothing, and `verify` in the brain checkout names them
// once, with how to delete them: one line after the enact line, one clause at
// the end of a quiet run's one line. A consumer's run hears nothing of them —
// the brain's config is the brain's to fix. Reported, never gating.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initRepo, makeScratchEcosystem } from '../helpers/fixture.js';
import { verify } from '../../src/commands/verify.js';
import type { CommandContext } from '../../src/types.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const scratch = (name: string): string => realpathSync(mkdtempSync(join(tmpdir(), `mvac-${name}-`)));

/** Both streams, in the order written, colour stripped; no switch from the developer's shell. */
async function run(cwd: string, args: string[] = [], ctx: Partial<CommandContext> = {}): Promise<{ code: number; out: string }> {
  const lines: string[] = [];
  const orig = { log: console.log, error: console.error };
  console.log = console.error = (...a: unknown[]) => {
    lines.push(a.map(String).join(' '));
  };
  try {
    const code = await verify.run(args, { cwd, env: {}, ...ctx });
    return { code, out: lines.join('\n').replace(/\x1b\[[0-9;]*m/g, '') };
  } finally {
    console.log = orig.log;
    console.error = orig.error;
  }
}

const LAW =
  '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n' +
  '| INV-D1 | the app exists | published | active | 2026-10-02 | x |\n<!-- @anchor INV-D1 brain:src/*.ts /app/ -->\n';
const IGNORE = ' ignored — multivac keeps no code graph; ';
const HOW = ' from .multivac/config.yml with a change open (`multivac change new <slug>`)';

/** A brain==code brain, green and committed, whose config carries `head` and `repos`. */
function lone(tmp: string, head: string, repos = ''): string {
  const b = join(tmp, 'b');
  initRepo(b, {
    '.multivac/config.yml': `doors: [agents]\n${head}repos:\n  brain: .\n${repos}`,
    '.multivac/invariants.md': LAW,
    '.multivac/.gitignore': 'cache/\nworktrees/\n',
    'src/app.ts': 'export const app = 1;\n',
  });
  return b;
}

test('verify names the dropped keys in one line, and a quiet run in one clause — MV-153', async () => {
  const tmp = scratch('dropped');
  const b = lone(tmp, 'grapher: graphify\n');
  const loud = await run(b, ['--check']);
  assert.equal(loud.code, 0, loud.out);
  const lines = loud.out.split('\n');
  const config = lines.filter((l) => l.includes(IGNORE));
  assert.deepEqual(config, [`  config    grapher${IGNORE}delete it${HOW}`]);
  const enact = lines.findIndex((l) => l.startsWith('  enact '));
  assert.ok(enact >= 0 && lines.indexOf(config[0]) > enact, 'after the enact line');

  // Quiet: the one line, the clause last; the env switch is the flag.
  const sha = git(b, 'rev-parse', '--short=7', 'HEAD');
  const line =
    `0 blocking broken · exit 0 · 1 claims · 1 anchored (100%) · read brain main @ ${sha} (working tree) · ` +
    'enact not answered (nothing staged) · grapher ignored (delete from .multivac/config.yml)';
  for (const q of [await run(b, ['--check', '--quiet']), await run(b, ['--check'], { env: { MULTIVAC_QUIET: '1' } })]) {
    assert.equal(q.code, 0, q.out);
    assert.equal(q.out, line);
  }

  // All four, `them`; the values are never read.
  initRepo(join(tmp, 'all', 'web'), { 'README.md': '# web\n' });
  const all = lone(
    join(tmp, 'all'),
    'grapher: codegraph\ngrapher_auto: maybe\ngraphers:\n  none: {}\n',
    '  web:\n    path: ../web\n    grapher: graphify\n',
  );
  const four = await run(all, ['--check']);
  assert.equal(four.code, 0, four.out);
  assert.deepEqual(
    four.out.split('\n').filter((l) => l.includes(IGNORE)),
    [`  config    grapher, grapher_auto, graphers, repos.web.grapher${IGNORE}delete them${HOW}`],
  );

  // None declared, nothing said.
  const none = lone(join(tmp, 'none'), '');
  assert.doesNotMatch((await run(none, ['--check'])).out, /ignored|grapher/);
});

test("a consumer's verify says nothing of the brain's dropped keys — MV-153", async () => {
  const tmp = scratch('dropped-consumer');
  const e = makeScratchEcosystem(tmp);
  writeFileSync(
    join(e.brain, '.multivac/config.yml'),
    'doors: [agents]\ngrapher: graphify\nrepos:\n  api:\n    path: ../acme-api\n    grapher: codegraph\n  web:\n    path: ../acme-web\n',
  );
  writeFileSync(
    join(e.brain, '.multivac/invariants.md'),
    '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n' +
      '| INV-A1 | accounts table exists | published | active | 2026-10-02 | x |\n' +
      '<!-- @anchor INV-A1 api:db/migrations/*.sql /create[[:space:]]+table[[:space:]]+accounts/i -->\n',
  );
  git(e.brain, 'add', '-A');
  git(e.brain, 'commit', '-qm', 'an earlier release');
  execFileSync('git', ['clone', '-q', e.brain, join(e.repos.api, '.brain')], { stdio: 'ignore' });

  const loud = await run(e.repos.api, ['--check']);
  assert.equal(loud.code, 0, loud.out);
  assert.doesNotMatch(loud.out, /ignored|grapher|config +/);
  const quiet = await run(e.repos.api, ['--check', '--quiet']);
  assert.equal(quiet.code, 0, quiet.out);
  assert.doesNotMatch(quiet.out, /ignored|grapher/);
  assert.equal(quiet.out.split('\n').length, 1, quiet.out);

  // The brain checkout itself still names them.
  assert.match((await run(e.brain, ['--check'])).out, /^ {2}config {4}grapher, repos\.api\.grapher ignored — /m);
});
