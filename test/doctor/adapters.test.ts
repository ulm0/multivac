// State and binary probing, the registry's contracts, and the one resolver.

import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  binaryMissing,
  grapherNames,
  grapherSpec,
  sddNames,
  sddSpec,
  doorTargets,
  unverifiedGrapher,
  type AdapterSpec,
} from '../../src/adapters/registry.js';
import {
  NO_ADAPTER,
  adapterFor,
  adaptersByRoot,
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

/** A declared (not registry-verified) grapher, for the probes below. */
const acme = { acmegraph: { artifact: 'acmegraph-out/graph.json', refresh: 'acmegraph update .' } };

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
  const shipped: [string, AdapterSpec][] = [
    ...sddNames.map((n) => [n, sddSpec(n)!] as [string, AdapterSpec]),
    ...grapherNames.map((n) => [n, grapherSpec(n)!] as [string, AdapterSpec]),
  ];
  assert.deepEqual(
    Object.fromEntries(shipped.map(([n, s]) => [n, s.required])),
    { opsx: ['openspec'], speckit: ['specify'], graphify: ['graphify'], codegraph: ['codegraph'] },
  );
  for (const [name, s] of shipped) {
    const cmds = [
      s.refresh,
      s.create,
      s.scaffold?.run,
      ...(s.steps ?? []).map((st) => st.validate),
    ].filter((c): c is string => Boolean(c));
    for (const c of cmds) assert.ok(s.required.includes(c.split(' ')[0]), `${name}: \`${c}\` runs a binary it does not require`);
  }
  // A config-declared grapher requires its `binary`, or else refresh's first word.
  assert.deepEqual(grapherSpec('acmegraph', acme)!.required, ['acmegraph']);
  assert.deepEqual(
    grapherSpec('weird', { weird: { artifact: 'o', refresh: 'npx weirdgraph index', binary: 'weirdgraph' } })!.required,
    ['weirdgraph'],
  );
});

test('a missing binary names itself, its adapter, the install line and the vendor', () => {
  for (const [name, spec] of [
    ...sddNames.map((n) => [n, sddSpec(n)!] as const),
    ...grapherNames.map((n) => [n, grapherSpec(n)!] as const),
  ]) {
    const line = binaryMissing(name, spec, spec.required, 'api');
    for (const part of [`\`${spec.required[0]}\``, name, spec.installHint, spec.source!, 'PATH', "api's node_modules/.bin"]) {
      assert.ok(line.includes(part), `${name}: "${line}" does not name ${part}`);
    }
    assert.doesNotMatch(line, /not on PATH/);
  }
  // A declared grapher has no vendor on record: it says where it was declared.
  const declared = binaryMissing('acmegraph', grapherSpec('acmegraph', acme)!, ['acmegraph'], 'brain');
  assert.match(declared, /declared in \.multivac\/config\.yml/);
  assert.doesNotMatch(declared, /https?:/);
});

test('an unknown grapher is UNVERIFIED — nothing is derived from the name', () => {
  assert.equal(grapherSpec('acmegraph'), null);
  const msg = unverifiedGrapher('acmegraph');
  // The refusal names the fields and the file, or it is just a dead end.
  assert.match(msg, /not verified/);
  assert.match(msg, /graphers:/);
  assert.match(msg, /artifact:/);
  assert.match(msg, /refresh:/);
  assert.match(msg, /\.multivac\/config\.yml/);
  // And it must not print the shape it used to invent.
  assert.doesNotMatch(msg, /acmegraph-out\/graph\.json/);
  assert.doesNotMatch(msg, /npm i -g acmegraph/);
});

test('a config-declared grapher is usable without a registry MR', async () => {
  const spec = grapherSpec('acmegraph', acme);
  assert.ok(spec);
  assert.deepEqual(spec.artifacts, ['acmegraph-out/graph.json']);
  assert.deepEqual(spec.binaries, ['acmegraph']); // first word of refresh
  assert.equal(spec.refresh, 'acmegraph update .');
  assert.equal(spec.automation, 'grapher-refresh');
  assert.match(spec.installHint, /UNVERIFIED/); // never guessed
  const proj = join(tmp, 'graphed');
  mkdirSync(join(proj, 'acmegraph-out'), { recursive: true });
  writeFileSync(join(proj, 'acmegraph-out', 'graph.json'), '{}');
  assert.equal((await initState(spec, proj)).state, 'installed');
  assert.equal((await initState(spec, emptyDir)).state, 'missing');
  // Its artifact is shared, as it always was, and it declares no opt-outs.
  assert.equal(spec.artifactKind, 'shared');
  assert.deepEqual(spec.shared, ['acmegraph-out/graph.json']);
  assert.deepEqual(spec.env, {});
});

test('a declaration states the binary when it is not the first word', () => {
  const spec = grapherSpec('weird', {
    weird: { artifact: 'out.db', refresh: 'npx weirdgraph index', binary: 'npx', install: 'npm i -g weirdgraph' },
  });
  assert.deepEqual(spec!.binaries, ['npx']);
  assert.equal(spec!.installHint, 'npm i -g weirdgraph');
});

test('the table speaks two graphers, and everything else is UNVERIFIED', () => {
  // Narrowed on purpose. The four that went — code-review-graph, axon,
  // dependency-cruiser, scip-typescript — were verified but never exercised,
  // so their entries described a build and a refresh and nothing a reader
  // could ask the graph. They stay reachable through `graphers:` in config.
  assert.deepEqual(grapherNames, ['graphify', 'codegraph']);
  for (const gone of ['code-review-graph', 'axon', 'dependency-cruiser', 'scip-typescript']) {
    assert.equal(grapherSpec(gone), null, `${gone} must not resolve from the table`);
    assert.match(unverifiedGrapher(gone), /is not verified/);
  }
});

test('a grapher states its own query verbs — they are not interchangeable', () => {
  // The whole point of the narrowing: the door tells the agent what to ASK.
  // graphify takes a QUESTION and walks the graph; codegraph takes a SYMBOL.
  // Paraphrasing either into "query the graph" is wrong for the other.
  const g = grapherSpec('graphify')!;
  assert.deepEqual(
    g.queries?.map((q) => q.run),
    ['graphify query "<question>"', 'graphify explain "<node>"', 'graphify path "<A>" "<B>"'],
  );
  assert.match(g.queries![0].answers, /question in plain words/);

  const cg = grapherSpec('codegraph')!;
  assert.deepEqual(
    cg.queries?.map((q) => q.run),
    ['codegraph query <symbol>'],
  );
  assert.match(cg.queries![0].answers, /symbol search by name/);

  // A config-declared grapher has no query surface multivac can know about.
  const declared = grapherSpec('acmegraph', {
    acmegraph: { artifact: 'acmegraph-out/graph.json', refresh: 'acmegraph update .' },
  })!;
  assert.equal(declared.queries, undefined);
});

test('codegraph names its telemetry, because the refresh runs on every edit', () => {
  // The contract above the table says "no model and no network inside it".
  // codegraph ships telemetry ON by default, so the entry has to say so and
  // give the opt-out — a refresh fired from a post-edit hook would otherwise
  // phone home on every keystroke-sized change without the operator knowing.
  const cg = grapherSpec('codegraph')!;
  assert.match(cg.note ?? '', /TELEMETRY IS ON BY DEFAULT/);
  assert.match(cg.note ?? '', /codegraph telemetry off/);
  // Every opt-out as 1.6.0's README spells it, and the shim's second network
  // path — a bundle download that turning telemetry off leaves in place.
  assert.match(cg.note ?? '', /CODEGRAPH_TELEMETRY=0/);
  assert.match(cg.note ?? '', /DO_NOT_TRACK=1/);
  assert.match(cg.note ?? '', /GitHub Releases/);
  assert.match(cg.note ?? '', /CODEGRAPH_NO_DOWNLOAD=1/);
  // The MCP server the note names runs its own update check (1.6.0 source).
  assert.match(cg.note ?? '', /CODEGRAPH_NO_UPDATE_CHECK/);
});

test('opsx names its telemetry, because the gates run openspec validate', () => {
  // Principle V covers every entry, not only graphers. MV-147: disclosed by
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

test('graphify itself is stated, not derived — the npm line was wrong', () => {
  const g = grapherSpec('graphify')!;
  assert.deepEqual(g.artifacts, ['graphify-out/graph.json']);
  assert.equal(g.refresh, 'graphify update .');
  assert.equal(g.installHint, 'uv tool install graphifyy');
  assert.ok(grapherNames.includes('graphify'));
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
  // The same shape `grapher` has, so the config teaches one mechanism; but the
  // SDD runs in the brain alone, so the only value a code repo's key takes is
  // `none`, and what it opts out of is the brain's SDD governing its code.
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
    grapher: 'graphify',
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
  // Graphers are unchanged: every root resolves its own.
  assert.equal(adapterFor(cfg, 'api', 'grapher'), 'graphify');

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

// --- MV-122: one resolver, both kinds, every root ---

test('one resolver answers for both kinds: a grapher per root, the SDD for the brain alone', () => {
  const cfg = {
    sdd: 'speckit',
    grapher: 'graphify',
    repos: {
      api: {},
      web: { grapher: 'codegraph' },
    },
  };
  assert.equal(adapterFor(cfg, 'api', 'grapher'), 'graphify', 'grapher: api inherits');
  assert.equal(adapterFor(cfg, 'web', 'grapher'), 'codegraph', 'grapher: web declares its own');
  assert.equal(adapterFor(cfg, 'brain', 'grapher'), 'graphify', "grapher: a brain with no entry takes the ecosystem's");
  assert.equal(adapterFor(cfg, 'undeclared', 'grapher'), 'graphify', 'grapher: an unknown key has no entry to read');
  assert.equal(adapterFor(cfg, 'brain', 'sdd'), 'speckit', "sdd: a brain with no entry takes the ecosystem's");
  for (const root of ['api', 'web', 'undeclared']) assert.equal(adapterFor(cfg, root, 'sdd'), undefined, `sdd: ${root}`);
});

test("the brain root reads the declared entry whose path is the brain, for both kinds", () => {
  const cfg = {
    sdd: 'speckit',
    grapher: 'graphify',
    repos: {
      self: { isBrain: true, sdd: 'opsx', grapher: 'codegraph' },
      api: {},
    },
  };
  assert.equal(adapterFor(cfg, 'brain', 'sdd'), 'opsx');
  assert.equal(adapterFor(cfg, 'brain', 'grapher'), 'codegraph');
  assert.equal(adapterFor(cfg, 'api', 'grapher'), 'graphify', 'the brain entry overrides only the brain');
});

test('`none` is no adapter for both kinds, at repo and at top level', () => {
  for (const kind of ['sdd', 'grapher'] as const) {
    const repoNone = { [kind]: 'x', repos: { api: { [kind]: NO_ADAPTER } } };
    assert.equal(adapterFor(repoNone, 'api', kind), undefined, `${kind}: repo-level none`);
    assert.equal(adapterFor(repoNone, 'brain', kind), 'x');

    const topNone = { [kind]: NO_ADAPTER, repos: { api: {} } };
    assert.equal(adapterFor(topNone, 'api', kind), undefined, `${kind}: top-level none`);
    assert.equal(adapterFor(topNone, 'brain', kind), undefined);
  }
  // A top-level `none` is the ecosystem's answer, never the root's own: a
  // grapher's in any repo, the SDD's in the brain entry alone.
  const own = { grapher: NO_ADAPTER, repos: { web: { grapher: 'y' } } };
  assert.equal(adapterFor(own, 'web', 'grapher'), 'y', "grapher: the repo's own adapter under a top-level none");
  const brainOwn = { sdd: NO_ADAPTER, repos: { self: { isBrain: true, sdd: 'y' } } };
  assert.equal(adapterFor(brainOwn, 'brain', 'sdd'), 'y', "sdd: the brain entry's own adapter under a top-level none");
});

/**
 * An empty value. A grapher's names nothing at that root and stops the top
 * level there, as it always did. An empty `sdd:` reads as unset (MV-146): a
 * code repo's is not refused and its code stays governed, and the brain
 * entry's defers to the top level.
 */
test('an empty grapher still names nothing at its root; an empty sdd reads as unset', () => {
  const graph = { grapher: 'graphify', repos: { api: { grapher: '' }, self: { isBrain: true, grapher: '' } } };
  assert.equal(adapterFor(graph, 'api', 'grapher'), undefined);
  assert.equal(adapterFor(graph, 'brain', 'grapher'), undefined);
  assert.equal(adapterFor({ grapher: '', repos: { api: {} } }, 'api', 'grapher'), undefined);

  const sdd = { sdd: 'speckit', repos: { api: { sdd: '' }, self: { isBrain: true, sdd: '' } } };
  assert.equal(adapterFor(sdd, 'brain', 'sdd'), 'speckit');
  assert.equal(sddGoverning(sdd, 'api'), 'speckit');
  assert.equal(sddDeclarationRefusal(sdd), null);
});

test('adapters by root: the brain first, absent repos included, `none` in no group', () => {
  const cfg = {
    sdd: 'speckit',
    grapher: 'graphify',
    repos: {
      self: { isBrain: true },
      api: {},
      web: { grapher: 'codegraph' },
      landing: { grapher: NO_ADAPTER, sdd: NO_ADAPTER },
      gone: {},
    },
  };
  assert.deepEqual(
    [...adaptersByRoot(cfg, 'grapher')],
    [
      ['graphify', ['brain', 'api', 'gone']],
      ['codegraph', ['web']],
    ],
  );
  // MV-146: the SDD's one group is the brain.
  assert.deepEqual([...adaptersByRoot(cfg, 'sdd')], [['speckit', ['brain']]]);
  assert.equal(adaptersByRoot({ ...cfg, grapher: undefined, repos: {} }, 'grapher').size, 0, 'nothing resolves a grapher');
  assert.equal(adaptersByRoot({ grapher: NO_ADAPTER, repos: {} }, 'grapher').size, 0);
});

// --- MV-124: what each entry declares about its own files and its runs ---

test('each shipped entry declares its state files, its shared and local paths, and its opt-outs', () => {
  const declared = (s: AdapterSpec) => ({
    state: s.state,
    shared: s.shared,
    local: s.local,
    ignore: s.ignore,
    graphignore: s.graphignore,
    artifactKind: s.artifactKind,
    env: s.env,
  });
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
    graphignore: undefined,
    artifactKind: undefined,
    env: {},
  });
  assert.deepEqual(declared(sddSpec('opsx')!), {
    state: { dir: 'openspec', files: ['openspec/config.yaml', 'openspec/config.yml'], check: 'file' },
    shared: ['openspec/config.yaml', 'openspec/config.yml', 'openspec/specs/**'],
    local: [],
    ignore: [],
    graphignore: undefined,
    artifactKind: undefined,
    env: { DO_NOT_TRACK: '1', OPENSPEC_TELEMETRY: '0' },
  });
  assert.deepEqual(declared(grapherSpec('graphify')!), {
    state: { dir: 'graphify-out', files: ['graphify-out/graph.json'], check: 'json' },
    shared: ['graphify-out/graph.json'],
    local: ['graphify-out/**'],
    ignore: ['graphify-out/*', '!graphify-out/graph.json'],
    graphignore: ['.claude/', '.multivac/', '.specify/', 'specs/', 'openspec/'],
    artifactKind: 'shared',
    env: {},
  });
  assert.deepEqual(declared(grapherSpec('codegraph')!), {
    state: { dir: '.codegraph', files: ['.codegraph/codegraph.db'], check: 'file' },
    shared: [],
    local: ['.codegraph/**'],
    ignore: ['.codegraph/'],
    graphignore: undefined,
    artifactKind: 'local',
    env: { DO_NOT_TRACK: '1', CODEGRAPH_TELEMETRY: '0', CODEGRAPH_NO_DOWNLOAD: '1' },
  });
  // The database is the artifact, not the directory around its own .gitignore.
  assert.deepEqual(grapherSpec('codegraph')!.artifacts, ['.codegraph/codegraph.db']);
  const declaredGrapher = grapherSpec('acmegraph', acme)!;
  assert.deepEqual(declared(declaredGrapher), {
    state: { files: ['acmegraph-out/graph.json'], check: 'exists' },
    shared: ['acmegraph-out/graph.json'],
    local: [],
    ignore: [],
    graphignore: undefined,
    artifactKind: 'shared',
    env: {},
  });
});

test('every declared opt-out is a bare word, so the hook never has to quote one', () => {
  for (const s of [...sddNames.map((n) => sddSpec(n)!), ...grapherNames.map((n) => grapherSpec(n)!)]) {
    for (const [k, v] of Object.entries(s.env)) {
      assert.match(k, /^[A-Za-z0-9_]+$/);
      assert.match(v, /^[A-Za-z0-9_]+$/);
    }
  }
});

test('a scaffold names its init, never an artifact of its own — the probe decides', () => {
  for (const n of sddNames) {
    const sc = sddSpec(n)!.scaffold;
    if (sc) assert.equal('artifact' in sc, false, `${n}'s scaffold still carries an artifact`);
  }
});

test('the telemetry notes say the entry applies the opt-outs, and still name each one', () => {
  const opsxNote = sddSpec('opsx')!.note ?? '';
  const cgNote = grapherSpec('codegraph')!.note ?? '';
  for (const note of [opsxNote, cgNote]) assert.doesNotMatch(note, /nothing here sets/);
  for (const v of ['OPENSPEC_TELEMETRY=0', 'DO_NOT_TRACK=1']) assert.ok(opsxNote.includes(v), v);
  for (const v of ['CODEGRAPH_TELEMETRY=0', 'DO_NOT_TRACK=1', 'CODEGRAPH_NO_DOWNLOAD=1']) assert.ok(cgNote.includes(v), v);
  // MV-121 as amended by MV-147: an entry also says its `env` does not reach
  // what it PRINTS for the agent to run.
  assert.match(cgNote, /`codegraph query` a door prints runs in the agent's own environment and carries none of that `env`/);
});
