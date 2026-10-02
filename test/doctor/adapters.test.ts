// State and binary probing, the registry's contracts, and the one resolver.

import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  binaryMissing,
  sddNames,
  sddSpec,
  doorTargets,
  type AdapterSpec,
} from '../../src/adapters/registry.js';
import {
  NO_ADAPTER,
  adapterFor,
  adaptersByRoot,
  brainHoldsCode,
  findBinary,
  localBin,
  missingRequired,
  sddDeclarationRefusal,
  sddGoverning,
  sddRoots,
} from '../../src/adapters/detect.js';
import { loadConfig } from '../../src/lib/config.js';
import { parseAnchors } from '../../src/anchor/parse.js';
import { compileAnchorRegex } from '../../src/lib/regex.js';
import { initState } from '../../src/lib/init-state.js';

const tmp = mkdtempSync(join(tmpdir(), 'mvac-adapters-'));
const emptyDir = join(tmp, 'empty');
mkdirSync(emptyDir);

/** An executable (or, with `mode`, a plain) file at `dir/name`. */
const exe = (dir: string, name: string, mode = 0o755): string => {
  mkdirSync(dir, { recursive: true });
  const p = join(dir, name);
  writeFileSync(p, '#!/bin/sh\nexit 0\n');
  chmodSync(p, mode);
  return p;
};

/** A darwin-shaped environment whose PATH is exactly `dirs` — never the host's. */
const posix = (...dirs: string[]) => ({ platform: 'darwin', PATH: dirs.join(':'), PATHEXT: '.EXE' });

// --- MV-123: one lookup, in the root the command runs in ---

test('findBinary looks on PATH, then in the root node_modules/.bin, and PATH wins', async () => {
  const onPath = join(tmp, 'fb-path');
  const root = join(tmp, 'fb-root');
  const pathCopy = exe(onPath, 'both');
  const onlyPath = exe(onPath, 'only-path');
  const localCopy = exe(localBin(root), 'only-local');
  exe(localBin(root), 'both');
  const env = posix(join(tmp, 'fb-none'), onPath);
  assert.equal(await findBinary('only-path', root, env), onlyPath);
  assert.equal(await findBinary('only-local', root, env), localCopy);
  assert.equal(await findBinary('both', root, env), pathCopy, 'the copy on PATH is the one found');
  assert.equal(await findBinary('nowhere', root, env), null);
});

test('findBinary finds nothing that is not an executable file in this root', async () => {
  const dir = join(tmp, 'fb-not');
  exe(dir, 'plain', 0o644);
  mkdirSync(join(dir, 'adir'), { recursive: true });
  const other = join(tmp, 'fb-other-root');
  exe(localBin(other), 'theirs');
  const env = posix(dir);
  assert.equal(await findBinary('plain', emptyDir, env), null, 'a non-executable file');
  assert.equal(await findBinary('adir', emptyDir, env), null, 'a directory');
  assert.equal(await findBinary('theirs', emptyDir, env), null, "another root's copy");
  assert.equal(await findBinary('theirs', other, env), join(localBin(other), 'theirs'));
});

test('findBinary takes a relative PATH entry from the root, and returns the absolute file it stat-ed', async () => {
  const root = join(tmp, 'fb-rel-root');
  const theirs = exe(join(root, 'tools'), 'rel');
  const brain = join(tmp, 'fb-rel-brain');
  exe(join(brain, 'tools'), 'rel');
  const saved = process.cwd();
  process.chdir(brain);
  try {
    assert.equal(await findBinary('rel', root, posix('tools')), theirs, "the root's tools/, not the cwd's");
  } finally {
    process.chdir(saved);
  }
});

test('findBinary skips an empty PATH segment rather than reading the current directory', async () => {
  const cwd = join(tmp, 'fb-cwd');
  exe(cwd, 'here');
  const saved = process.cwd();
  process.chdir(cwd);
  try {
    assert.equal(await findBinary('here', emptyDir, { platform: 'darwin', PATH: ':' }), null);
  } finally {
    process.chdir(saved);
  }
});

test('findBinary tries PATHEXT on win32, in its order, and ignores it elsewhere', async () => {
  const dir = join(tmp, 'fb-win');
  exe(dir, 'specify.exe');
  exe(dir, 'both.exe');
  exe(dir, 'both.com');
  const win = { platform: 'win32', PATH: `${join(tmp, 'fb-none')};${dir}`, PATHEXT: '.COM;.EXE' };
  assert.match((await findBinary('specify', emptyDir, win)) ?? '', /specify\.exe$/i);
  assert.match((await findBinary('both', emptyDir, win)) ?? '', /both\.com$/i, "PATHEXT's order");
  // Elsewhere the name is the name: `specify.exe` is not `specify`.
  assert.equal(await findBinary('specify', emptyDir, posix(dir)), null);
  exe(dir, 'specify');
  assert.equal(await findBinary('specify', emptyDir, posix(dir)), join(dir, 'specify'));
});

test('missingRequired names every required binary that is not found, and only those', async () => {
  const dir = join(tmp, 'mr');
  exe(dir, 'a');
  const saved = process.env.PATH;
  process.env.PATH = dir;
  try {
    assert.deepEqual(await missingRequired({ required: ['a', 'b'] }, emptyDir), ['b']);
    assert.deepEqual(await missingRequired({ required: ['a'] }, emptyDir), []);
  } finally {
    process.env.PATH = saved;
  }
});

test('every shipped adapter declares what it requires, and each command it runs is covered', () => {
  const shipped: [string, AdapterSpec][] = sddNames.map((n) => [n, sddSpec(n)!] as [string, AdapterSpec]);
  assert.deepEqual(Object.fromEntries(shipped.map(([n, s]) => [n, s.required])), { opsx: ['openspec'], speckit: ['specify'] });
  for (const [name, s] of shipped) {
    const cmds = [
      s.refresh,
      s.scaffold?.run,
      ...(s.steps ?? []).map((st) => st.validate),
    ].filter((c): c is string => Boolean(c));
    for (const c of cmds) assert.ok(s.required.includes(c.split(' ')[0]), `${name}: \`${c}\` runs a binary it does not require`);
  }
});

test('a missing binary names itself, its adapter, the install line and the vendor', () => {
  for (const [name, spec] of sddNames.map((n) => [n, sddSpec(n)!] as const)) {
    const line = binaryMissing(name, spec, spec.required, 'api');
    for (const part of [`\`${spec.required[0]}\``, name, spec.installHint, spec.source!, 'PATH', "api's node_modules/.bin"]) {
      assert.ok(line.includes(part), `${name}: "${line}" does not name ${part}`);
    }
    assert.doesNotMatch(line, /not on PATH/);
  }
});

test('opsx names its telemetry, because the gates run openspec validate', () => {
  // Principle V covers every entry. MV-147: disclosed by
  // version, as measured with a fetch recorder and HOME isolated — what the
  // two runs multivac makes send (none, under the entry's `env`), and what the
  // agent's own calls send and write, which that `env` never reaches.
  const note = sddSpec('opsx')!.note ?? '';
  for (const fact of [
    // The floors: the printed flow, its fields, the scaffold.
    '1.4.0', '1.5.0', '1.7.0',
    // The network, by version, and the first-run notice that starts it.
    'edge.openspec.dev', '1.13.1', 'first-run notice', 'registry.npmjs.org',
    // What a terminal call writes under HOME whatever the opt-outs, and what stops it.
    'completionTipSeen', 'OPENSPEC_NO_COMPLETIONS=1',
    // The opt-outs, and that the agent's calls carry none of the entry's.
    'OPENSPEC_TELEMETRY=0', 'DO_NOT_TRACK=1', 'carry none of `env`',
    'openspec validate',
  ]) assert.ok(note.includes(fact), fact);
  // Applied, not only disclosed (MV-124): the runs multivac makes carry the entry's `env`.
  assert.match(note, /each with this entry's `env`/);
  // The disclosure says nothing the law has retired: none of the phrases
  // MV-121's and MV-124's `absent` legs forbid, read from the law itself.
  const law = readFileSync(join(import.meta.dirname, '../../../.multivac/invariants.md'), 'utf8');
  const legs = parseAnchors(law, '.multivac/invariants.md').anchors.filter(
    (a) => (a.claimId === 'MV-121' || a.claimId === 'MV-124') && a.mode === 'absent',
  );
  // Eight today; none found would pass vacuously.
  assert.ok(legs.length >= 8, `found ${legs.length} absent legs`);
  for (const leg of legs) {
    assert.doesNotMatch(note, compileAnchorRegex(leg.regexSource, leg.regexFlags), `${leg.claimId} line ${leg.line}`);
  }
});

test('registry door targets: canonical agents, symlink claude', () => {
  assert.equal(doorTargets.agents.kind, 'canonical');
  assert.equal(doorTargets.agents.door, 'AGENTS.md');
  assert.equal(doorTargets.claude.kind, 'symlink');
  assert.ok(doorTargets.claude.skill);
  assert.ok(doorTargets.claude.hookConfig?.path);
});

// --- MV-87: which adapter applies is a per-root fact, resolved in one place ---
// --- MV-146: for the SDD, per root is the brain alone ---

test('repos.<key>.sdd takes only none, which opts the repo out of the change gate; a tool there is refused at load', async () => {
  // The SDD runs in the brain alone, so the only value a code repo's key takes
  // is `none`, and what it opts out of is the brain's SDD governing its code.
  const eco = mkdtempSync(join(tmpdir(), 'mvac-rootsdd-'));
  const brain = join(eco, 'brain');
  for (const d of ['brain', 'api', 'legacy', 'landing']) mkdirSync(join(eco, d), { recursive: true });
  mkdirSync(join(brain, '.multivac'), { recursive: true });
  const config = (legacy: string[]): string =>
    [
      'doors: [agents]',
      'sdd: speckit',
      'repos:',
      '  brain: .',
      '  api: ../api',
      '  legacy:',
      '    path: ../legacy',
      ...legacy,
      '  landing:',
      '    path: ../landing',
      '    sdd: none',
      '  gone: ../gone',
      '',
    ].join('\n');
  writeFileSync(join(brain, '.multivac/config.yml'), config(['    sdd: opsx']));
  await assert.rejects(() => loadConfig(brain), /repos\.legacy\.sdd: opsx — REFUSED: the SDD lives in the brain alone/);

  writeFileSync(join(brain, '.multivac/config.yml'), config([]));
  const cfg = await loadConfig(brain);
  assert.equal(cfg.repos.landing.sdd, NO_ADAPTER, 'the key parses like every other repo key');
  assert.equal(cfg.repos.api.sdd, undefined, 'absent is governed, it does not mean none');

  // Where the SDD runs: the brain, and no code repo.
  assert.equal(adapterFor(cfg, 'brain', 'sdd'), 'speckit');
  for (const k of ['api', 'legacy', 'landing']) assert.equal(adapterFor(cfg, k, 'sdd'), undefined, k);
  // Whose rules govern the code: the brain's, except where the repo says none.
  assert.equal(sddGoverning(cfg, 'api'), 'speckit');
  assert.equal(sddGoverning(cfg, 'legacy'), 'speckit');
  assert.equal(sddGoverning(cfg, 'landing'), undefined, '`none` is out of scope');
  assert.equal(sddGoverning(cfg, 'brain'), 'speckit');

  const roots = await sddRoots(brain, cfg);
  // The brain first, then declared repos in config order — and only the ones
  // that are on disk: `gone` is declared and never cloned.
  assert.deepEqual(
    roots.map((r) => [r.scope, r.key, r.sdd]),
    [
      ['brain', 'brain', 'speckit'],
      ['api', 'api', undefined],
      ['legacy', 'legacy', undefined],
      ['landing', 'landing', undefined],
    ],
  );
  assert.ok(!roots.some((r) => r.scope === 'gone'), 'an absent repo is not a root');
});

test('the SDD runs in the brain alone — the handle, or the entry that is the brain under any key — MV-146', async () => {
  const cfg = {
    sdd: 'speckit',
    repos: {
      core: { isBrain: true },
      api: {},
      web: { sdd: NO_ADAPTER },
    },
  };
  assert.equal(adapterFor(cfg, 'brain', 'sdd'), 'speckit');
  assert.equal(adapterFor(cfg, 'core', 'sdd'), 'speckit', 'the brain entry, by its own key');
  assert.equal(adapterFor(cfg, 'api', 'sdd'), undefined, 'a code repo runs no SDD');
  assert.equal(adapterFor(cfg, 'undeclared', 'sdd'), undefined);

  // Governing: the brain's for every root but the one that says none.
  for (const root of ['brain', 'core', 'api', 'undeclared']) assert.equal(sddGoverning(cfg, root), 'speckit', root);
  assert.equal(sddGoverning(cfg, 'web'), undefined);
  // The brain's own `none` is not an exemption of the brain: it is no SDD at all.
  const off = { sdd: NO_ADAPTER, repos: { api: {} } };
  assert.equal(sddGoverning(off, 'api'), undefined, 'nothing governs when the brain resolves none');
  assert.equal(sddGoverning({ repos: { api: {} } }, 'api'), undefined, 'nor when nothing is declared');

  // The brain entry's key names the worktree its proofs are looked for in.
  const eco = mkdtempSync(join(tmpdir(), 'mvac-corekey-'));
  mkdirSync(join(eco, 'brain/.multivac'), { recursive: true });
  writeFileSync(join(eco, 'brain/.multivac/config.yml'), 'doors: [agents]\nsdd: speckit\nrepos:\n  core: .\n');
  const loaded = await loadConfig(join(eco, 'brain'));
  assert.deepEqual((await sddRoots(join(eco, 'brain'), loaded)).map((r) => [r.scope, r.key, r.sdd]), [['brain', 'core', 'speckit']]);
});

// --- MV-122: one resolver, every root ---

test('the brain root reads the declared entry whose path is the brain', () => {
  const cfg = {
    sdd: 'speckit',
    repos: {
      self: { isBrain: true, sdd: 'opsx' },
      api: {},
    },
  };
  assert.equal(adapterFor(cfg, 'brain', 'sdd'), 'opsx');
  assert.equal(adapterFor(cfg, 'api', 'sdd'), undefined, 'the brain entry overrides only the brain');
});

test('`none` is no SDD, at repo and at top level', () => {
  const repoNone = { sdd: 'x', repos: { api: { sdd: NO_ADAPTER } } };
  assert.equal(adapterFor(repoNone, 'api', 'sdd'), undefined, 'repo-level none');
  assert.equal(adapterFor(repoNone, 'brain', 'sdd'), 'x', 'the SDD runs in the brain');

  const topNone = { sdd: NO_ADAPTER, repos: { api: {} } };
  assert.equal(adapterFor(topNone, 'api', 'sdd'), undefined, 'top-level none');
  assert.equal(adapterFor(topNone, 'brain', 'sdd'), undefined);
  // A top-level `none` is the ecosystem's answer, never the root's own: the
  // SDD's in the brain entry alone.
  const brainOwn = { sdd: NO_ADAPTER, repos: { self: { isBrain: true, sdd: 'y' } } };
  assert.equal(adapterFor(brainOwn, 'brain', 'sdd'), 'y', "sdd: the brain entry's own adapter under a top-level none");
});

/**
 * An empty value. An empty `sdd:` reads as unset (MV-146): a code repo's is
 * not refused and its code stays governed, and the brain entry's defers to the
 * top level.
 */
test('an empty sdd reads as unset', () => {
  const sdd = { sdd: 'speckit', repos: { api: { sdd: '' }, self: { isBrain: true, sdd: '' } } };
  assert.equal(adapterFor(sdd, 'brain', 'sdd'), 'speckit');
  assert.equal(sddGoverning(sdd, 'api'), 'speckit');
  assert.equal(sddDeclarationRefusal(sdd), null);
});

test('adapters by root: the brain first, absent repos included, `none` in no group', () => {
  const cfg = {
    sdd: 'speckit',
    repos: {
      self: { isBrain: true },
      api: {},
      landing: { sdd: NO_ADAPTER },
      gone: {},
    },
  };
  // MV-146: the SDD's one group is the brain.
  assert.deepEqual([...adaptersByRoot(cfg, 'sdd')], [['speckit', ['brain']]]);
  assert.equal(adaptersByRoot({ ...cfg, sdd: undefined }, 'sdd').size, 0, 'nothing resolves an SDD');
  assert.equal(adaptersByRoot({ sdd: NO_ADAPTER, repos: {} }, 'sdd').size, 0);
});

// --- MV-124: what each entry declares about its own files and its runs ---

test('each shipped entry declares its state files, its shared and local paths, and its opt-outs', () => {
  const declared = (s: AdapterSpec) => ({ state: s.state, shared: s.shared, local: s.local, ignore: s.ignore, env: s.env });
  assert.deepEqual(declared(sddSpec('speckit')!), {
    state: {
      dir: '.specify',
      files: ['.specify/integration.json'],
      check: 'json',
      expect: { integration_state_schema: 1, installed_integrations: 'non-empty' },
    },
    shared: ['.specify/**'],
    local: ['.specify/feature.json', '.specify/extensions/*/local-config.yml'],
    ignore: [],
    env: {},
  });
  assert.deepEqual(declared(sddSpec('opsx')!), {
    state: { dir: 'openspec', files: ['openspec/config.yaml', 'openspec/config.yml'], check: 'file' },
    shared: ['openspec/config.yaml', 'openspec/config.yml', 'openspec/specs/**'],
    local: [],
    ignore: [],
    env: { DO_NOT_TRACK: '1', OPENSPEC_TELEMETRY: '0' },
  });
});

test('a scaffold names its init, never an artifact of its own — the probe decides', () => {
  for (const n of sddNames) {
    const sc = sddSpec(n)!.scaffold;
    if (sc) assert.equal('artifact' in sc, false, `${n}'s scaffold still carries an artifact`);
  }
});

test('the telemetry notes say the entry applies the opt-outs, and still name each one', () => {
  const opsxNote = sddSpec('opsx')!.note ?? '';
  assert.doesNotMatch(opsxNote, /nothing here sets/);
  for (const v of ['OPENSPEC_TELEMETRY=0', 'DO_NOT_TRACK=1']) assert.ok(opsxNote.includes(v), v);
});
