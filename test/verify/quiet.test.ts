// MV-151. One line when nothing is off. A green report went whole into every
// session start and every agent commit; a quiet run prints one line that leads
// with the summary and carries the header, each plain read, the enact answer
// and the change the code lands in — and the whole report, byte for byte and
// both streams in their order, the moment anything is off.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { gitInit, initRepo, makeScratchEcosystem, publishRepo, scrubbedEnv } from '../helpers/fixture.js';
import { SPECKIT_INTEGRATION_JSON } from '../helpers/recorded.js';
import { verify } from '../../src/commands/verify.js';
import { doorTargets } from '../../src/adapters/registry.js';
import { loadConfig } from '../../src/lib/config.js';
import { writeEcosystem } from '../../src/doors/ecosystem.js';
import { say } from '../../src/lib/out.js';
import type { Command, CommandContext } from '../../src/types.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const put = (root: string, rel: string, body: string): void => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), body);
};
const scratch = (name: string): string => realpathSync(mkdtempSync(join(tmpdir(), `mvac-${name}-`)));
const short = (repo: string): string => git(repo, 'rev-parse', '--short=7', 'HEAD');

/** Both streams, in the order written — what `2>&1` reads — colour stripped. */
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
const loud = (cwd: string, ...args: string[]) => run(verify, cwd, args, { env: {} });
const quiet = (cwd: string, ...args: string[]) => run(verify, cwd, ['--quiet', ...args], { env: {} });
const byEnv = (cwd: string, ...args: string[]) => run(verify, cwd, args, { env: { MULTIVAC_QUIET: '1' } });

/** The quiet run equals the loud one byte for byte, exit code included. */
async function whole(cwd: string, label: string, ...args: string[]): Promise<string> {
  const l = await loud(cwd, ...args);
  const q = await quiet(cwd, ...args);
  assert.equal(q.out, l.out, `${label}: the quiet run printed something other than the whole report`);
  assert.equal(q.code, l.code, `${label}: the exit code moved`);
  assert.ok(l.out.split('\n').length > 3, `${label}: ${l.out}`);
  return l.out;
}

const HEADER = '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n';
const law = (...rows: string[]): string => HEADER + rows.join('\n') + '\n';
const ROW = '| INV-Q1 | the app exists | published | active | 2026-09-29 | x |';
const LEG = '<!-- @anchor INV-Q1 brain:src/*.ts /app/ -->';

const openChange = (slug: string, extra = ''): string =>
  `---\nslug: ${slug}\nstatus: open\nrepos:\n  brain:\n    status: branched\nlanding_order:\n  - - brain\ninvariants:\n  touches: []\n  adds: []\n  retires: []\nclaims: []\n${extra}---\n\n# ${slug}\n`;

/** A brain==code brain, green, its governance graph rendered and committed. */
async function lone(tmp: string, opts: { sdd?: true } = {}): Promise<string> {
  const b = join(tmp, 'b');
  initRepo(b, {
    '.multivac/config.yml': `doors: [agents]\n${opts.sdd ? 'sdd: speckit\n' : ''}repos:\n  brain: .\n`,
    '.multivac/invariants.md': law(ROW, LEG),
    '.multivac/.gitignore': 'cache/\nworktrees/\n',
    ...(opts.sdd ? { '.specify/integration.json': SPECKIT_INTEGRATION_JSON } : {}),
    'src/app.ts': 'export const app = 1;\n',
  });
  await writeEcosystem(b, await loadConfig(b));
  git(b, 'add', '-A');
  git(b, 'commit', '-qm', 'ecosystem');
  return b;
}

test('a quiet run with nothing off is one line carrying summary, header, reads and enact — MV-151', async () => {
  const tmp = scratch('quiet');
  const b = await lone(tmp);
  const line = `0 blocking broken · exit 0 · 1 claims · 1 anchored (100%) · read brain main @ ${short(b)} (working tree) · enact not answered (nothing staged)`;
  for (const d of [b, join(b, 'src')]) {
    const q = await quiet(d, '--check');
    assert.equal(q.code, 0, q.out);
    assert.equal(q.out, line, 'one line, and no root line on it');
    assert.equal((await byEnv(d, '--check')).out, line, 'MULTIVAC_QUIET=1 is the flag');
    assert.equal((await loud(d, '--check')).code, q.code);
  }

  // A code commit staged on an open change's branch.
  const s = await lone(join(tmp, 's'), { sdd: true });
  put(s, '.multivac/changes/feat.md', openChange('feat'));
  await writeEcosystem(s, await loadConfig(s)); // the graph names the change
  git(s, 'add', '-A');
  git(s, 'commit', '-qm', 'open feat');
  git(s, 'switch', '-qc', 'feat');
  put(s, 'src/b.ts', 'export const b = 1;\n');
  git(s, 'add', 'src/b.ts');
  const staged = await quiet(s, '--check');
  assert.equal(staged.code, 0, staged.out);
  assert.equal(staged.out, `0 blocking broken · exit 0 · 1 claims · 1 anchored (100%) · read brain feat @ ${short(s)} (working tree) · enact none (law untouched) · code → feat`);

  // A consumer, and a consumer's change worktree.
  const e = makeScratchEcosystem(join(tmp, 'eco'));
  writeFileSync(join(e.brain, '.multivac/invariants.md'), law(
    '| INV-A1 | accounts table exists | published | active | 2026-09-29 | x |',
    '<!-- @anchor INV-A1 api:db/migrations/*.sql /create[[:space:]]+table[[:space:]]+accounts/i -->',
  ));
  git(e.brain, 'add', '-A');
  git(e.brain, 'commit', '-qm', 'law');
  const mount = join(e.repos.api, '.brain');
  execFileSync('git', ['clone', '-q', e.brain, mount], { stdio: 'ignore' });
  const c = await quiet(join(e.repos.api, 'src'));
  assert.equal(c.code, 0, c.out);
  assert.equal(c.out, `0 blocking broken · exit 0 · 1 of 1 brain claims anchor into "api" · brain at ${mount} · read api main @ ${short(e.repos.api)} (working tree) · enact not answered (decided in the brain)`);
  const wt = join(e.brain, '.multivac/worktrees/demo/api');
  git(e.repos.api, 'worktree', 'add', '-q', '-b', 'demo', wt);
  const w = await quiet(wt);
  assert.equal(w.code, 0, w.out);
  assert.equal(w.out, `0 blocking broken · exit 0 · 1 of 1 brain claims anchor into "api" · brain at ${e.brain} (the change worktree for demo) · read api demo @ ${short(wt)} (working tree) · enact not answered (decided in the brain)`);
  assert.equal((await loud(wt)).code, w.code);
});

test('anything off prints the whole report byte for byte — MV-151', async () => {
  const tmp = scratch('off');
  let n = 0;
  const fresh = async (opts: { sdd?: true } = {}): Promise<string> => lone(join(tmp, String(n++)), opts);
  const setLaw = (b: string, ...rows: string[]): void => {
    writeFileSync(join(b, '.multivac/invariants.md'), law(ROW, LEG, ...rows));
  };
  const commit = (b: string, msg: string): void => {
    git(b, 'add', '-A');
    git(b, 'commit', '-qm', msg);
  };

  // A reported-only broken leg, a vacuous leg, a pending claim, a drift row.
  let b = await fresh();
  setLaw(b, '| INV-Q2 | a marker | published | active | 2026-09-29 | x |', '<!-- @anchor INV-Q2 brain:src/*.ts /NOT_THERE/ unique -->');
  commit(b, 'broken');
  assert.match(await whole(b, 'broken', '--check'), /reported only/);
  b = await fresh();
  setLaw(b, '| INV-Q2 | a marker | published | active | 2026-09-29 | x |', '<!-- @anchor INV-Q2 brain:lib/*.ts /x/ absent -->');
  commit(b, 'vacuous');
  assert.match(await whole(b, 'vacuous', '--check'), /vacuous/);
  b = await fresh();
  setLaw(b, '| INV-Q2 | a marker | published | active | 2026-09-29 | x |', '<!-- @anchor INV-Q2 brain:src/*.ts /NOT_THERE/ -->');
  put(b, '.multivac/changes/work.md', openChange('work').replace('claims: []', 'claims: [INV-Q2]'));
  commit(b, 'pending');
  assert.match(await whole(b, 'pending', '--check'), /held pending by open change work/);
  b = await fresh();
  setLaw(b, '| INV-Q2 | a marker | published | drift | 2026-09-29 | x |', '<!-- @anchor INV-Q2 brain:src/*.ts /NOT_THERE/ -->');
  commit(b, 'drift');
  assert.match(await whole(b, 'drift', '--check'), /drift: INV-Q2/);

  // A moved leg under write: each run heals it, so each starts from the same law.
  b = await fresh();
  setLaw(b, '| INV-Q2 | a marker | published | active | 2026-09-29 | x |', '<!-- @anchor INV-Q2 brain:lib/*.ts /app/ -->');
  commit(b, 'moved');
  const healed = await loud(b);
  git(b, 'checkout', '--', '.multivac/invariants.md');
  const healedQuiet = await quiet(b);
  git(b, 'checkout', '--', '.multivac/invariants.md');
  assert.match(healed.out, /moved/);
  assert.equal(healedQuiet.out, healed.out, 'moved under write');

  // A parse error; an anchor on no row; an open change file that does not parse.
  b = await fresh();
  setLaw(b, '<!-- @anchor INV-Q1 brain:src/*.ts /app/ sometimes -->');
  commit(b, 'parse');
  assert.match(await whole(b, 'parse', '--check'), /parse/);
  b = await fresh();
  setLaw(b, '<!-- @anchor INV-404 brain:src/*.ts /app/ -->');
  commit(b, 'orphan');
  await whole(b, 'an anchor on no row', '--check');
  b = await fresh();
  put(b, '.multivac/changes/broken.md', '---\nslug: [unclosed\n---\n');
  commit(b, 'unparsable');
  await whole(b, 'an unparsable open change file', '--check');

  // A finished change, plain and strict — close's refusing variant included.
  b = await fresh();
  put(b, '.multivac/changes/done.md', openChange('done').replace('status: branched', 'status: landed').replace('claims: []', 'claims: [INV-Q1]'));
  commit(b, 'finished');
  assert.match(await whole(b, 'finished', '--check'), /finished, not pending — close refuses until: /);
  assert.match(await whole(b, 'finished, strict', '--check', '--strict'), /· blocking/);

  // The law staged: without enactment, an enactment, a refusal, a death.
  b = await fresh();
  setLaw(b, '| INV-Q2 | a marker | published | proposed | 2026-09-29 | x |');
  git(b, 'add', '-A');
  assert.match(await whole(b, 'a staged law', '--check'), /no row reached active/);
  b = await fresh();
  setLaw(b, '| INV-Q2 | a marker | published | proposed | 2026-09-29 | x |');
  commit(b, 'proposed');
  setLaw(b, '| INV-Q2 | a marker | published | active | 2026-09-29 | x |');
  git(b, 'add', '-A');
  assert.match(await whole(b, 'an enactment', '--check'), /→ active, alone in this commit/);
  setLaw(b, '| INV-Q2 | a marker | published | active | 2026-09-29 | x |', '<!-- @anchor INV-Q2 brain:src/*.ts /app/ -->');
  put(b, 'src/app.ts', 'export const app = 2;\n');
  git(b, 'add', '-A');
  assert.match(await whole(b, 'a refusal', '--check'), /enact +REFUSED/);
  b = await fresh();
  writeFileSync(join(b, '.multivac/invariants.md'), law());
  git(b, 'add', '-A');
  assert.match(await whole(b, 'law death', '--check'), /law +REFUSED INV-Q1 was law and is gone/);

  // Any config line: new here, modified under an open change, modified alone.
  const bare = join(tmp, 'bare');
  gitInit(bare);
  put(bare, '.multivac/config.yml', 'doors: [agents]\nrepos:\n  brain: .\n');
  put(bare, '.multivac/invariants.md', law(ROW, LEG));
  put(bare, 'src/app.ts', 'export const app = 1;\n');
  git(bare, 'add', '-A');
  assert.match(await whole(bare, 'config new here, no commit yet', '--check'), /is new here/);
  b = await fresh();
  appendFileSync(join(b, '.multivac/config.yml'), '# touched\n');
  git(b, 'add', '-A');
  assert.match(await whole(b, 'config modified alone', '--check'), /is modified and no change is open/);
  put(b, '.multivac/changes/cfg.md', openChange('cfg'));
  git(b, 'add', '-A');
  assert.match(await whole(b, 'config modified, declared', '--check'), /declared by open change cfg/);

  // The code line: an SDD step skipped, and code on no open change.
  b = await fresh({ sdd: true });
  put(b, '.multivac/changes/feat.md', openChange('feat', 'sdd_skipped: [specify]\n'));
  commit(b, 'open feat');
  git(b, 'switch', '-qc', 'feat');
  put(b, 'src/b.ts', 'export const b = 1;\n');
  git(b, 'add', 'src/b.ts');
  assert.match(await whole(b, 'SDD skipped', '--check'), /SDD skipped at specify/);
  b = await fresh({ sdd: true });
  put(b, 'src/b.ts', 'export const b = 1;\n');
  git(b, 'add', 'src/b.ts');
  assert.match(await whole(b, 'a refused code line', '--check'), /which is no open change declaring brain/);

  // A mounted brain whose SDD declaration is refused.
  const api = join(tmp, 'api');
  initRepo(api, { 'src/index.ts': 'export const app = 1;\n' });
  initRepo(join(api, '.brain'), { '.multivac/config.yml': 'doors: [agents]\nsdd: acme\nrepos:\n  api: ../api\n', '.multivac/invariants.md': law() });
  assert.match(await whole(api, 'a mounted SDD refusal'), /in the mounted brain's config; its owner fixes it/);

  // A pin that gates.
  const e = makeScratchEcosystem(join(tmp, 'pins'));
  writeFileSync(join(e.brain, '.multivac/config.yml'), 'doors: [agents]\nchannel: main\nstaleness: block\nrepos:\n  api: ../acme-api\n');
  git(e.brain, 'add', '-A');
  git(e.brain, 'commit', '-qm', 'channel');
  git(e.repos.api, '-c', 'protocol.file.allow=always', 'submodule', 'add', '-q', e.brain, '.brain');
  git(e.repos.api, 'commit', '-qm', 'mount');
  git(e.brain, 'commit', '-q', '--allow-empty', '-m', 'ahead');
  assert.match(await whole(e.brain, 'a gating pin', '--check'), /stale +api: pin 1 behind main .* blocking \(staleness: block\)/);
});

test('a read that is not plain and a pin that does not gate print under the one line — MV-151', async () => {
  const tmp = scratch('beneath');
  const e = makeScratchEcosystem(tmp);
  const extra: Record<string, string> = {};
  for (const name of ['parked', 'unfetched', 'merging', 'fallback']) {
    extra[name] = join(tmp, name);
    initRepo(extra[name], { 'README.md': `# ${name}\n` });
  }
  writeFileSync(
    join(e.brain, '.multivac/config.yml'),
    'doors: [agents]\nrepos:\n  api: ../acme-api\n  parked: ../parked\n  unfetched: ../unfetched\n  merging: ../merging\n  fallback: ../fallback\n  gone: ../gone\n',
  );
  git(e.brain, 'add', '-A');
  git(e.brain, 'commit', '-qm', 'repos');
  for (const name of ['acme-api', 'parked', 'unfetched', 'merging']) {
    const repo = join(tmp, name);
    publishRepo(repo, tmp, name);
    if (name !== 'unfetched') git(repo, 'fetch', '-q', 'origin');
  }
  git(extra.parked, 'switch', '-qc', 'wip');
  git(extra.parked, 'commit', '-q', '--allow-empty', '-m', 'wip');
  git(extra.merging, 'switch', '-qc', 'side');
  put(extra.merging, 'README.md', '# side\n');
  git(extra.merging, 'commit', '-qam', 'side');
  git(extra.merging, 'switch', '-q', 'main');
  put(extra.merging, 'README.md', '# main\n');
  git(extra.merging, 'commit', '-qam', 'main');
  spawnSync('git', ['-C', extra.merging, 'merge', '-q', 'side'], { stdio: 'ignore' });

  const l = await loud(e.brain, '--check');
  const q = await quiet(e.brain, '--check');
  assert.equal(q.code, l.code);
  const [one, ...beneath] = q.out.split('\n');
  assert.match(one, /^0 blocking broken · exit 0 · 0 claims · 0 anchored · read api origin\/main @ [0-9a-f]{7} \(last fetch \d+m ago\), brain main @ [0-9a-f]{7} \(working tree\) · enact not answered \(nothing staged\)/);
  for (const [key, why] of [
    ['parked', /the channel, as published \(last fetch \d+m ago\) \(this checkout is parked on wip @ [0-9a-f]{7}, not read\)$/],
    ['unfetched', /\(never fetched here\)$/],
    ['merging', /MID-MERGE/],
    ['fallback', /FELL BACK to the working tree$/],
    ['gone', /not on disk — nothing read; run `multivac repos sync`$/],
  ] as const) {
    const hits = beneath.filter((x) => x.startsWith(`  read      ${key}: `));
    assert.equal(hits.length, 1, `${key}: ${q.out}`);
    assert.match(hits[0], why);
    assert.ok(l.out.split('\n').includes(hits[0]), `${key}: its full line, as the full report prints it`);
  }
  assert.equal(beneath.length, 5, q.out);

  // --worktree reads every sibling's working tree: none of them folds.
  const wq = await quiet(e.brain, '--check', '--worktree');
  assert.match(wq.out.split('\n')[0], /^0 blocking broken · exit 0 · 0 claims · 0 anchored · read brain main @ [0-9a-f]{7} \(working tree\)/);
  assert.match(wq.out, /^ {2}read {6}api: working tree on main @ [0-9a-f]{7} — --worktree: local state, not the channel$/m);

  // Two pins one commit behind the channel, not gating: under the one line.
  const p = makeScratchEcosystem(join(tmp, 'pins'));
  writeFileSync(join(p.brain, '.multivac/config.yml'), 'doors: [agents]\nchannel: main\nrepos:\n  api: ../acme-api\n  web:\n    path: ../acme-web\n');
  git(p.brain, 'add', '-A');
  git(p.brain, 'commit', '-qm', 'channel');
  for (const [name, repo] of [['acme-api', p.repos.api], ['acme-web', p.repos.web]] as const) {
    git(repo, '-c', 'protocol.file.allow=always', 'submodule', 'add', '-q', p.brain, '.brain');
    git(repo, 'commit', '-qm', 'mount');
    // Fetched here, so each read folds and only the pins print beneath.
    publishRepo(repo, join(tmp, 'pins'), name);
    git(repo, 'fetch', '-q', 'origin');
  }
  git(p.brain, 'commit', '-q', '--allow-empty', '-m', 'ahead');
  const pl = await loud(p.brain, '--check');
  const pq = await quiet(p.brain, '--check');
  const [pOne, ...pins] = pq.out.split('\n');
  assert.match(pOne, /^0 blocking broken · exit 0 · /);
  assert.equal(pins.length, 2, pq.out);
  for (const pin of pins) {
    assert.match(pin, /^ {2}stale {5}(api|web): pin 1 behind main · /);
    assert.ok(pl.out.split('\n').includes(pin));
  }
});

test('any warning prints the whole report, streams in their order — MV-151', async () => {
  const tmp = scratch('warn');
  const b = await lone(tmp);
  const flagged = await whole(b, '--repo in a brain', '--check', '--repo', 'x');
  assert.match(flagged.split('\n')[0], /^--repo only scopes verify from a consumer repo — .* is a brain; flag ignored$/);
  // A planned change with a key multivac does not know warns as the change
  // files are read before the report, and again while the report is made.
  put(b, '.multivac/changes/later.md', '---\nslug: later\nstatus: planned\nhorizon: later\nrepos: {}\nlanding_order: []\ninvariants:\n  touches: []\n  adds: []\n  retires: []\nclaims: []\nnote: remember me\n---\n\n# later\n');
  git(b, 'add', '-A');
  git(b, 'commit', '-qm', 'later');
  const out = await whole(b, 'an unknown frontmatter key', '--check');
  const warnings = out.split('\n').filter((x) => /dropping frontmatter key multivac does not know — note/.test(x));
  assert.ok(warnings.length >= 1, out);
  assert.match(out.split('\n')[0], /dropping frontmatter key/);
});

test('a quiet run that throws still prints what it had — MV-151', async () => {
  const tmp = scratch('throw');
  const b = await lone(tmp, { sdd: true });
  // A door target whose reading throws, reached only by the code line — late
  // in the report, after the header, the reads and the enact line are held.
  Object.defineProperty(doorTargets, 'probe', {
    configurable: true,
    enumerable: true,
    get() {
      throw new Error('probe: a callee failed mid-report');
    },
  });
  const lines: string[] = [];
  const orig = { log: console.log, error: console.error };
  console.log = console.error = (...a: unknown[]) => {
    lines.push(a.map(String).join(' '));
  };
  try {
    await assert.rejects(verify.run(['--quiet', '--check', b], { cwd: b, env: {} }), /probe: a callee failed mid-report/);
    say('after');
  } finally {
    console.log = orig.log;
    console.error = orig.error;
    delete (doorTargets as Record<string, unknown>).probe;
  }
  const out = lines.join('\n').replace(/\x1b\[[0-9;]*m/g, '');
  assert.match(out, /^1 claims · 1 anchored \(100%\)$/m, 'what was held is printed');
  assert.match(out, /^ {2}enact {5}not answered — nothing staged/m);
  assert.equal(lines.at(-1), 'after', 'the hold is released');
});

test('through the shims, a code-only commit is one line and a law commit the whole report — MV-151', async () => {
  const tmp = scratch('shims');
  const b = join(tmp, 'b');
  gitInit(b);
  put(b, '.multivac/config.yml', 'doors: [agents]\nrepos:\n  brain: .\n');
  put(b, '.multivac/invariants.md', law(ROW, LEG));
  put(b, 'src/app.ts', 'export const app = 1;\n');
  // `doors --adopt` through the built CLI: shims, and the version record the
  // notice reads, so this binary has nothing to say before the report.
  const adopt = spawnSync(process.execPath, [join(process.cwd(), 'dist/cli.js'), 'doors', '--adopt'], { cwd: b, encoding: 'utf8', env: scrubbedEnv() });
  assert.equal(adopt.status, 0, adopt.stdout + adopt.stderr);
  assert.match(readFileSync(join(b, '.multivac/hooks/pre-commit'), 'utf8'), /^export MULTIVAC_QUIET=1$/m);
  // `mvac` on the PATH is this build; the shim finds it there.
  const bin = join(tmp, 'bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'mvac'), `#!/bin/sh\nexec '${process.execPath}' '${join(process.cwd(), 'dist/cli.js')}' "$@"\n`);
  chmodSync(join(bin, 'mvac'), 0o755);
  const path = [bin, dirname(process.execPath), '/usr/bin', '/bin'].join(':');
  const commit = (msg: string, env = scrubbedEnv({ PATH: path })): { status: number | null; out: string } => {
    const r = spawnSync('git', ['-C', b, 'commit', '-qm', msg], { encoding: 'utf8', env });
    return { status: r.status, out: (r.stdout + r.stderr).replace(/\x1b\[[0-9;]*m/g, '').trim() };
  };

  git(b, 'add', '-A');
  const first = commit('init');
  assert.equal(first.status, 0, first.out);
  assert.match(first.out, /is new here/, 'the root commit prints in full');
  assert.match(first.out, /^0 blocking broken · exit 0$/m);

  appendFileSync(join(b, '.multivac/invariants.md'), '| INV-Q2 | a later rule | published | proposed | 2026-09-29 | x |\n');
  git(b, 'add', '-A');
  const lawCommit = commit('law');
  assert.equal(lawCommit.status, 0, lawCommit.out);
  assert.match(lawCommit.out, /no row reached active/, 'a law commit prints in full');

  put(b, 'src/a.txt', 'x\n');
  git(b, 'add', 'src/a.txt');
  const code = commit('code');
  assert.equal(code.status, 0, code.out);
  assert.equal(code.out.split('\n').length, 1, code.out);
  assert.match(code.out, /^0 blocking broken · exit 0 · 2 claims · 1 anchored \(50%\) · unanchored: INV-Q2 · read brain main @ [0-9a-f]{7} \(working tree\) · enact none \(law untouched\)/);

  const text = readFileSync(join(b, '.multivac/invariants.md'), 'utf8');
  writeFileSync(join(b, '.multivac/invariants.md'), text.replace('the app exists', 'the app may exist'));
  git(b, 'add', '-A');
  const weakened = commit('weaken');
  assert.equal(weakened.status, 0, weakened.out);
  assert.match(weakened.out, /no row reached active/, 'a commit weakening a row prints in full');

  // A binary that refuses every flag it does not know still commits: the
  // switch is a variable, never a flag in the shim.
  const old = join(tmp, 'old');
  mkdirSync(old);
  writeFileSync(join(old, 'mvac'), '#!/bin/sh\nfor a; do case "$a" in --*) echo "unknown flag $a" >&2; exit 2;; esac; done\necho "the full report"\n');
  chmodSync(join(old, 'mvac'), 0o755);
  put(b, 'src/b.txt', 'y\n');
  git(b, 'add', 'src/b.txt');
  const older = commit('older', scrubbedEnv({ PATH: [old, '/usr/bin', '/bin'].join(':') }));
  assert.equal(older.status, 0, older.out);
  assert.match(older.out, /the full report/);
});

test('a session start is quiet through the hook payload, and the gate strings do not move — MV-151', async () => {
  const tmp = scratch('session');
  const b = await lone(tmp);
  const marker = { CLAUDE_PROJECT_DIR: b };
  const start = await run(verify, b, [], {
    env: marker,
    stdin: async () => JSON.stringify({ hook_event_name: 'SessionStart', source: 'startup', cwd: b }),
  });
  assert.equal(start.out, (await quiet(b)).out, 'the session start is the --quiet line');
  assert.equal(start.out.split('\n').length, 1);
  const edit = await run(verify, b, [], {
    env: marker,
    stdin: async () => JSON.stringify({ hook_event_name: 'PostToolUse', tool_input: { file_path: join(b, 'src/app.ts') }, cwd: b }),
  });
  assert.equal(edit.out, (await loud(b)).out, 'an edit is never quiet');
});
