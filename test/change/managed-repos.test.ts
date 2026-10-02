// MV-125: a repo multivac does not own is read, never written. A sibling whose
// entry says `managed: false`, or whose clone is shallow, gets no scaffold, no
// build, no refresh, no door and no gate, and is reported rather than failed.
//
// Tools are STUBS on a PATH this file builds — `<bin>:/usr/bin:/bin` — never
// the host's (Principle IV). Each stub appends `$PWD` to a marker, so a run is
// found by where it happened.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { appendFileSync, chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { initRepo, publishRepo, shallowClone } from '../helpers/fixture.js';
import { SPECKIT_INTEGRATION_JSON } from '../helpers/recorded.js';
import { readOnly } from '../../src/adapters/detect.js';
import { loadConfig } from '../../src/lib/config.js';
import { change } from '../../src/commands/change.js';
import { doorsCommand } from '../../src/commands/doors.js';
import { doctorReport } from '../../src/commands/doctor.js';
import { reposCommand, reposList, reposSync } from '../../src/commands/repos.js';
import { main } from '../../src/cli.js';
import { loadChange, saveChange } from '../../src/change/file.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

/** Run `fn` with PATH set to `path`, restored after. */
async function withPath<T>(path: string, fn: () => Promise<T>): Promise<T> {
  const saved = process.env.PATH;
  process.env.PATH = path;
  try {
    return await fn();
  } finally {
    process.env.PATH = saved;
  }
}

/** Run `fn` with PATH built from `bin` and the system directories only. */
const inEnv = <T>(bin: string, fn: () => Promise<T>): Promise<T> => withPath([bin, '/usr/bin', '/bin'].join(delimiter), fn);

/** Stdout AND stderr lines around a command. */
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

const LAW = '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n';

const write = (file: string, body: string, mode?: number): void => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body);
  if (mode !== undefined) chmodSync(file, mode);
};

const git = (dir: string, ...args: string[]): string =>
  execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

type Sibling = 'not managed' | 'shallow' | 'managed' | 'absent';

/**
 * A brain with speckit installed and committed, beside
 * `../acme-payments`: a full clone declared `managed: false`, a shallow clone,
 * a full clone with no `managed` key, or nothing at all. `head` replaces the
 * ecosystem's lines above `repos:`, and `more` is appended below payments'.
 * Each stub appends `<tool> <where it ran>` to a marker.
 */
function eco(
  sibling: Sibling,
  {
    head = ['doors: [agents]', 'sdd: speckit'],
    more = [] as string[],
    brainFiles = {} as Record<string, string>,
  } = {},
) {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-managed-')));
  const brain = join(tmp, 'acme-brain');
  const payments = join(tmp, 'acme-payments');
  const config = [
    ...head,
    'repos:',
    '  brain: .',
    ...(sibling === 'absent'
      ? []
      : ['  payments:', '    path: ../acme-payments', ...(sibling === 'not managed' ? ['    managed: false'] : []), ...more]),
    '',
  ].join('\n');
  initRepo(brain, {
    'AGENTS.md': '# door\n',
    '.multivac/config.yml': config,
    '.multivac/invariants.md': LAW,
    '.specify/integration.json': SPECKIT_INTEGRATION_JSON,
    ...brainFiles,
  });
  const files = { 'README.md': '# payments\n' };
  if (sibling === 'shallow') shallowClone(payments, files);
  else if (sibling !== 'absent') initRepo(payments, files);
  const bin = join(tmp, 'bin');
  const marker = join(tmp, 'ran');
  write(join(bin, 'specify'), `#!/bin/sh\necho "specify $(pwd -P)" >> '${marker}'\n`, 0o755);
  const ran = (tool: string, dir = payments): number =>
    (existsSync(marker) ? readFileSync(marker, 'utf8').split('\n') : []).filter((l) => l === `${tool} ${dir}`).length;
  return { tmp, brain, payments, bin, ctx: { cwd: brain }, ran };
}

/** Open `slug` on the brain alone and walk it to just before close. */
async function toClose(brain: string, slug: string): Promise<void> {
  const ctx = { cwd: brain };
  await capture(() => change.run(['new', slug, slug], ctx));
  const parsed = await loadChange(brain, slug);
  parsed.change.repos = { brain: { status: 'planned' } };
  parsed.change.landing_order = [['brain']];
  parsed.change.invariants.adds = [];
  await saveChange(brain, parsed);
  await capture(() => change.run(['apply', slug, '--no-sdd'], ctx));
  await capture(() => change.run(['land', slug, '--landed', 'brain', '--no-sdd'], ctx));
}

// --- the one answer ---

test('readOnly answers not managed, shallow or nothing, and never for the brain', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-readonly-'));
  const full = join(tmp, 'full');
  initRepo(full, { 'README.md': '# full\n' });
  const shallow = join(tmp, 'shallow');
  shallowClone(shallow);
  const cfg = {
    repos: {
      api: { path: '../full', managed: false },
      gone: { path: '../gone', managed: false },
      lib: { path: '../shallow' },
      both: { path: '../shallow', managed: false },
      web: { path: '../full' },
      self: { path: '.', isBrain: true },
    },
  };

  // The declaration is read before anything spawns: no git on PATH, same answer.
  await withPath('', async () => {
    assert.equal(await readOnly(cfg, 'api', full), 'not managed');
    assert.equal(await readOnly(cfg, 'gone', join(tmp, 'gone')), 'not managed');
  });
  assert.equal(await readOnly(cfg, 'lib', shallow), 'shallow');
  assert.equal(await readOnly(cfg, 'both', shallow), 'not managed', 'the declaration comes first');
  assert.equal(await readOnly(cfg, 'web', full), null);
  assert.equal(await readOnly(cfg, 'brain', shallow), null, 'the brain root is always in scope');
  assert.equal(await readOnly(cfg, 'self', shallow), null, 'so is the entry that is the brain');

  execFileSync('git', ['-C', shallow, 'fetch', '-q', '--unshallow'], { stdio: 'ignore' });
  assert.equal(await readOnly(cfg, 'lib', shallow), null, 'unshallowed, it is in scope with nothing edited');
});

// --- US1 and US2: nothing is written there ---

for (const sibling of ['not managed', 'shallow'] as const) {
  test(`change new runs no vendor in a ${sibling} sibling, names it nowhere, and leaves it clean`, async () => {
    const e = eco(sibling);
    await inEnv(e.bin, async () => {
      const c = await capture(() => change.run(['new', 'probe', 'Probe'], e.ctx));
      assert.equal(c.code, 0, c.out);
      assert.equal(e.ran('specify'), 0, c.out);
      assert.doesNotMatch(c.out, /payments/);
      assert.equal(git(e.payments, 'status', '--porcelain'), '');
      // `repos sync` reaches every declared repo, and still not this one.
      await capture(() => reposCommand.run(['sync'], e.ctx));
      assert.equal(e.ran('specify'), 0);
      assert.equal(git(e.payments, 'status', '--porcelain'), '');
    });
  });

  test(`doors projects nothing into a ${sibling} sibling, and says so in one line`, async () => {
    const e = eco(sibling, { head: ['doors: [agents, claude]', 'sdd: speckit'] });
    await inEnv(e.bin, async () => {
      const c = await capture(() => doorsCommand.run([], e.ctx));
      assert.equal(c.code, 0, c.out);
      const said = c.out.split('\n').filter((l) => l.startsWith('payments:'));
      assert.equal(said.length, 1, c.out);
      assert.match(said[0], /^payments: (not managed|shallow), read-only — nothing projected/);
      for (const f of ['AGENTS.md', 'CLAUDE.md', '.claude', '.multivac']) {
        assert.equal(existsSync(join(e.payments, f)), false, `${f} was written`);
      }
      assert.equal(git(e.payments, 'status', '--porcelain'), '');
      assert.throws(() => git(e.payments, 'config', '--local', 'core.hooksPath'), 'core.hooksPath was set');
    });
  });
}

test('a sibling with no managed key and a full clone is projected as before, and gets no SDD', async () => {
  const e = eco('managed');
  await inEnv(e.bin, async () => {
    const c = await capture(() => change.run(['new', 'probe', 'Probe'], e.ctx));
    assert.equal(c.code, 0, c.out);
    // MV-146: the SDD runs in the brain alone, which has it; nothing runs in the sibling.
    assert.equal(e.ran('specify'), 0, c.out);
    assert.equal(existsSync(join(e.payments, '.specify')), false);
    // MV-153: and `repos sync` builds nothing there either.
    await capture(() => reposCommand.run(['sync'], e.ctx));
    assert.equal(e.ran('specify'), 0);
    const d = await capture(() => doorsCommand.run([], e.ctx));
    assert.match(d.out, /^payments: door \+ hooks updated$/m);
    assert.ok(existsSync(join(e.payments, 'AGENTS.md')));
  });
});

// --- US3: reported, never failed ---

test('doctor and repos name each read-only sibling, and neither calls it deficient', async () => {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-managed-report-')));
  const head = ['doors: [agents]', 'sdd: speckit', 'repos:', '  brain: .'];
  const brainOf = (name: string, lines: string[]): string => {
    const brain = join(tmp, name);
    initRepo(brain, {
      'AGENTS.md': '# door\n',
      '.multivac/config.yml': [...lines, ''].join('\n'),
      '.multivac/invariants.md': LAW,
      '.specify/integration.json': SPECKIT_INTEGRATION_JSON,
    });
    return brain;
  };
  const brain = brainOf('acme-brain', [
    ...head,
    '  ledger:', '    path: ../acme-ledger', '    managed: false',
    '  vault:', '    path: ../acme-vault', '    managed: false',
    '  mirror:', '    path: ../acme-mirror',
  ]);
  const without = brainOf('acme-plain', head);
  initRepo(join(tmp, 'acme-ledger'), { 'README.md': '# ledger\n' });
  publishRepo(join(tmp, 'acme-ledger'), tmp, 'ledger');
  shallowClone(join(tmp, 'acme-mirror'));
  const bin = join(tmp, 'bin');
  write(join(bin, 'specify'), '#!/bin/sh\n', 0o755);
  const cases = [['ledger', 'not managed'], ['vault', 'not managed'], ['mirror', 'shallow']] as const;

  await inEnv(bin, async () => {
    const list = (await reposList(brain)).join('\n');
    for (const [key, why] of cases) assert.match(list, new RegExp(`^${key} .* — ${why}, read-only$`, 'm'), list);

    const report = await doctorReport(brain);
    const repos = report.lines.find((l) => l.startsWith('repos'))!;
    for (const [key, why] of cases) assert.match(repos, new RegExp(`${key}: ${why}, read-only`), repos);
    for (const [key] of cases.filter(([k]) => k !== 'vault')) {
      // MV-146: the SDD runs in the brain alone, so a sibling gets no sdd
      // verdict of its own, read-only or not; MV-153: and no graph line.
      const about = report.lines.filter((l) => /^(sdd|grapher|leftover)/.test(l) && l.includes(`@ ${key}`));
      assert.deepEqual(about, [], `no sdd line, no project law and no graph line: ${about.join(' / ')}`);
    }
    const pins = report.lines.find((l) => l.startsWith('pins'))!;
    for (const [key, why] of cases) assert.match(pins, new RegExp(`${key}: ${why}, read-only — no mount expected`), pins);
    assert.doesNotMatch(pins, /submodule/);
    // Every other line, and the exit code, is what the brain alone reports.
    const rest = (lines: string[], dir: string): string[] =>
      lines.filter((l) => !/^(repos|branches|pins) /.test(l) && !/ledger|vault|mirror/.test(l)).map((l) => l.split(dir).join('<brain>'));
    for (const strict of [false, true]) {
      const [a, b] = [await doctorReport(brain, strict), await doctorReport(without, strict)];
      assert.deepEqual(rest(a.lines, brain), rest(b.lines, without), `strict: ${strict}`);
      assert.equal(a.exit, b.exit, `strict: ${strict}`);
    }

    const sync = await reposSync(brain, false);
    assert.equal(sync.exit, 0, sync.lines.join('\n'));
    assert.match(sync.lines.join('\n'), /^ledger: present at \.\.\/acme-ledger — fetched$/m);
  });
});

// --- US4: no gate demands a file there ---

/** What a brain needs for plan, apply and close to pass with speckit. */
const WALKED = {
  '.specify/memory/constitution.md': '# Acme constitution\n\nTests ship with behaviour.\n',
  'specs/001-gate/spec.md': '# Spec\n',
  'specs/001-gate/plan.md': '# Plan\n',
  'specs/001-gate/tasks.md': '- [X] T001 done\n',
};

/** Open `slug` on the brain alone, then plan, apply, land and close it. */
async function walk(e: ReturnType<typeof eco>, slug: string): Promise<{ codes: number[]; out: string }> {
  const codes: number[] = [];
  const outs: string[] = [];
  const run = async (args: string[]): Promise<void> => {
    const c = await capture(() => change.run(args, e.ctx));
    codes.push(c.code);
    outs.push(c.out);
  };
  await run(['new', slug, slug]);
  const parsed = await loadChange(e.brain, slug);
  parsed.change.repos = { brain: { status: 'planned' } };
  parsed.change.landing_order = [['brain']];
  parsed.change.invariants.adds = [];
  await saveChange(e.brain, parsed);
  for (const sub of ['plan', 'apply']) await run([sub, slug]);
  await run(['land', slug, '--landed', 'brain']);
  await run(['close', slug]);
  return { codes, out: outs.join('\n') };
}

const gateLines = (out: string): string[] => out.split('\n').filter((l) => /^sdd/.test(l));

test('no gate names a read-only sibling with no SDD state or spec, and the brain is gated as before', async () => {
  const alone = eco('absent', { brainFiles: WALKED });
  const control = await inEnv(alone.bin, () => walk(alone, 'gate'));
  assert.deepEqual(control.codes, [0, 0, 0, 0, 0], control.out);
  for (const sibling of ['not managed', 'shallow'] as const) {
    const e = eco(sibling, { brainFiles: WALKED });
    const w = await inEnv(e.bin, () => walk(e, 'gate'));
    assert.deepEqual(w.codes, control.codes, w.out);
    assert.doesNotMatch(w.out, /payments/);
    assert.deepEqual(gateLines(w.out), gateLines(control.out), sibling);
  }
});

for (const sibling of ['not managed', 'shallow'] as const) {
  test(`the SDD refusal leaves a ${sibling} sibling out of the repos it looked in`, async () => {
    const e = eco(sibling);
    await inEnv(e.bin, async () => {
      await capture(() => change.run(['new', 'look', 'Look'], e.ctx));
      const c = await capture(() => change.run(['plan', 'look'], e.ctx));
      assert.equal(c.code, 1, c.out);
      assert.match(c.out, /spec\.md is missing — looked in brain$/m);
      assert.doesNotMatch(c.out, /payments/);
    });
  });
}

/** `multivac <argv>` from the brain: its exit code and what it said on stderr. */
async function cli(brain: string, argv: string[]): Promise<{ code: number; err: string }> {
  const errs: string[] = [];
  const orig = { log: console.log, error: console.error };
  console.log = () => {};
  console.error = (...a: unknown[]) => { errs.push(a.map(String).join(' ')); };
  try {
    return { code: await main(argv, brain), err: errs.join('\n') };
  } finally {
    console.log = orig.log;
    console.error = orig.error;
  }
}

// MV-146: a code repo's `sdd:` takes only `none`. A tool there used to resolve
// in that root alone — gated nowhere when the root was read-only, refused as
// "not on disk" when it was absent — and now names an SDD that runs nowhere,
// which the config load refuses before any command reads it.

test('a read-only sibling that names an SDD of its own is refused at load, naming its key', async () => {
  const e = eco('not managed', { head: ['doors: [agents]'], more: ['    sdd: speckit'] });
  await inEnv(e.bin, async () => {
    const c = await cli(e.brain, ['change', 'new', 'only', 'Only']);
    assert.equal(c.code, 2, c.err);
    assert.match(c.err, /^repos\.payments\.sdd: speckit — REFUSED: the SDD lives in the brain alone/m);
    assert.equal(existsSync(join(e.brain, '.multivac/changes/only.md')), false, 'nothing was opened');
  });
});

test('a sibling not on disk that names an SDD of its own is refused at load, and the refusal names only it', async () => {
  const e = eco('not managed', {
    head: ['doors: [agents]'],
    more: ['  ghost:', '    path: ../acme-ghost', '    sdd: speckit'],
  });
  await inEnv(e.bin, async () => {
    const c = await cli(e.brain, ['change', 'new', 'ghost', 'Ghost']);
    assert.equal(c.code, 2, c.err);
    assert.match(c.err, /^repos\.ghost\.sdd: speckit — REFUSED/m);
    assert.doesNotMatch(c.err, /payments/);
  });
});

// --- US5: a change cannot name one ---

/** Everything plan or apply could move: the change, the law, HEAD, branches, worktrees, a clone. */
const snapshot = (e: ReturnType<typeof eco>, slug: string) => ({
  change: readFileSync(join(e.brain, '.multivac/changes', `${slug}.md`), 'utf8'),
  law: readFileSync(join(e.brain, '.multivac/invariants.md'), 'utf8'),
  head: git(e.brain, 'rev-parse', 'HEAD'),
  branches: [e.brain, e.payments].map((d) => (existsSync(d) ? git(d, 'branch', '--list') : null)),
  worktrees: [e.brain, e.payments].map((d) => (existsSync(d) ? git(d, 'worktree', 'list', '--porcelain') : null)),
  cloned: existsSync(e.payments),
});

const NOT_MANAGED_FIX = /drop it from \S+, or remove `managed: false` through a change \(MV-97\)/;
for (const [label, sibling, fix] of [
  ['not managed sibling on disk', 'not managed', NOT_MANAGED_FIX],
  ['not managed sibling not yet cloned', 'not managed', NOT_MANAGED_FIX],
  ['shallow sibling', 'shallow', /drop it from \S+, or `git -C .* fetch --unshallow`/],
] as const) {
  test(`plan and apply refuse a change naming a ${label}, before anything moves`, async () => {
    const e = eco(sibling, { head: ['doors: [agents]'] });
    if (label.includes('not yet cloned')) {
      publishRepo(e.payments, e.tmp, 'payments');
      rmSync(e.payments, { recursive: true, force: true });
      appendFileSync(join(e.brain, '.multivac/config.yml'), `    url: file://${join(e.tmp, 'payments.git')}\n`);
    }
    await inEnv(e.bin, async () => {
      await capture(() => change.run(['new', 'named', 'Named'], e.ctx));
      const parsed = await loadChange(e.brain, 'named');
      parsed.change.repos = { brain: { status: 'planned' }, payments: { status: 'planned' } };
      parsed.change.landing_order = [['brain', 'payments']];
      parsed.change.invariants.adds = [];
      await saveChange(e.brain, parsed);
      const before = snapshot(e, 'named');
      for (const sub of ['plan', 'apply']) {
        const c = await capture(() => change.run([sub, 'named'], e.ctx));
        assert.equal(c.code, 1, c.out);
        assert.match(c.out, /^payments: (not managed|shallow), read-only — /m);
        assert.match(c.out, fix);
        assert.deepEqual(snapshot(e, 'named'), before, sub);
      }
    });
  });
}
