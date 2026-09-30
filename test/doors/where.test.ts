// MV-148. The brain door says where each code repo's graph is asked. The bare
// verb asks the graph in the session's directory, which is the brain; a brain
// that holds no code keeps no code graph, and the door names each code repo's
// graph with the flag that points a verb at it, and where the answers' paths
// are placed. A brain that holds code keeps its two lines and adds its
// worktrees' form. The consumer door does not move.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initRepo } from '../helpers/fixture.js';
import { loadConfig } from '../../src/lib/config.js';
import { grapherLines, renderBrainDoor, whereLines } from '../../src/doors/brain.js';
import { renderConsumerDoor } from '../../src/doors/consumer.js';
import type { Config } from '../../src/types.js';

async function cfg(yml: string): Promise<Config> {
  const b = join(mkdtempSync(join(tmpdir(), 'mvac-where-')), 'brain');
  initRepo(b, { '.multivac/config.yml': yml, '.multivac/invariants.md': '# Invariants\n' });
  return loadConfig(b);
}

/** contracts/cli-output.md, byte for byte. */
const HEAD =
  "- This brain holds no code, so it keeps no code graph: each code repo keeps its own. ASK IT BEFORE READING THE TREE RAW, from here, with each verb's flag pointed at a repo below — in a change, the flag `change apply` printed under that repo's checkout; paths in its answers are relative to the checkout the flag names.";
const SIBLINGS_HEAD =
  "- The other code repos keep their own graphs. ASK IT BEFORE READING THE TREE RAW, from here, with each verb's flag pointed at a repo below — in a change, the flag `change apply` printed under that repo's checkout; paths in its answers are relative to the checkout the flag names.";
const GRAPHIFY_VERBS = [
  '    - `graphify query "<question>" --graph <checkout>/graphify-out/graph.json` — a question in plain words — returns the subgraph that answers it, walked outward from the best-matching nodes',
  '    - `graphify explain "<node>" --graph <checkout>/graphify-out/graph.json` — one node and its neighbours, described in prose',
  '    - `graphify path "<A>" "<B>" --graph <checkout>/graphify-out/graph.json` — the shortest path between two nodes — how A actually reaches B',
];
const GRAPHIFY_BLOCK = [
  '  - `graphify` at `graphify-out/graph.json` (web: `../web`, api: `../api`), refreshed after your edits there, and committed on the change branch by `change land`:',
  ...GRAPHIFY_VERBS,
];
// MV-149: each verb at `-p <checkout>`, and the group line says `change apply`
// builds each worktree's index — with the condition beside it. The four verbs
// that were run, each saying what it misses.
const CODEGRAPH_VERBS = [
  "    - `codegraph query <symbol> -p <checkout>` — a name's definitions and imports, each with kind, file:line and signature, best 10 first (`--limit N`)",
  '    - `codegraph callers <symbol> -p <checkout>` — the functions calling it, with file:line, module-level callers as their file — 20 unless `--limit N`, counted as listed; aliased imports missed, same-named symbols merged',
  '    - `codegraph impact <symbol> -p <checkout>` — what may break if it changes: symbols and tests within two calls, by file — a lower bound; aliased imports missed, same-named symbols merged',
  '    - `codegraph node <symbol> -p <checkout>` — its body with line numbers, what it calls and its callers; `-f <file>`, spelled as answers print it, picks one of several same-named',
];
const CODEGRAPH_GROUP = (fresh: string): string =>
  `  - \`codegraph\` at \`.codegraph/codegraph.db\` (svc: \`../svc\`), ${fresh}; built in each checkout, never committed — each change worktree's by \`change apply\`, which prints \`its index: -p <worktree>\`; where \`apply\` printed no such line, \`-p\` at that worktree answers from the nearest index above it, or fails:`;
const CODEGRAPH_BLOCK = [CODEGRAPH_GROUP('refreshed after your edits there'), ...CODEGRAPH_VERBS];
/** `grapherLines`' list header (MV-149): it claims no saving over grep. */
const LIST_HEADER = "  ASK IT BEFORE READING THE TREE RAW. These are this tool's own verbs, not a generic one — each line says what it answers:";
const UNRESOLVED =
  '  - `graphify` at `graphify-out/graph.json`: no writable code repo resolves it yet — each one that does gets its own when `repos sync` or a change reaches it';
const HOLDS_GRAPHIFY =
  "  It answers for this checkout, with the law, the changes and their specs kept out of it: the ecosystem graph above relates them. A change's worktree has its own, as of its last refresh: add `--graph <worktree>/graphify-out/graph.json` (`change apply` prints it); paths in its answers are relative to that worktree.";
const HOLDS_CODEGRAPH =
  "  It answers for this checkout, with the law, the changes and their specs kept out of it: the ecosystem graph above relates them. `change apply` builds each change worktree its own index and prints `its index: -p <worktree>`; paths in its answers are relative to that worktree. Where `apply` printed no such line, `-p` there answers from this checkout's index, without the branch's edits. Never run the `codegraph init` its notices suggest.";

/** The door's lines from `first` on, `n` of them. */
function block(door: string, first: string, n: number): string[] {
  const lines = door.split('\n');
  const at = lines.indexOf(first);
  assert.ok(at >= 0, `no line ${first.slice(0, 60)}… in\n${door}`);
  return lines.slice(at, at + n);
}

const bytes = (lines: string[]): number => Buffer.byteLength(`${lines.join('\n')}\n`);

test("a code-less brain's door names each code repo's graph and the flag that reaches it — MV-148", async () => {
  const doors: string[] = [];
  const render = (c: Config): string => {
    const d = renderBrainDoor(c, 1);
    doors.push(d);
    return d;
  };

  // Two graphify repos and a post-edit door: the head and the block of the
  // contract, under 1,000 bytes, and no vendor section cited — it names the
  // bare verb, which asks the brain.
  const two = render(await cfg('doors: [agents, claude]\ngrapher: graphify\nrepos:\n  web: ../web\n  api: ../api\n'));
  const got = block(two, HEAD, 5);
  assert.deepEqual(got, [HEAD, ...GRAPHIFY_BLOCK]);
  assert.equal(bytes(got), 954);
  assert.ok(bytes(got) <= 1000);
  assert.doesNotMatch(two, /## graphify/);
  assert.doesNotMatch(two, /kept fresh for you by/, 'no grapher line of its own');

  // A local index: `-p <checkout>`, never `<repo>` — MV-149: `change apply`
  // builds each change worktree's, and the four verbs that were run each say
  // what they miss. The block grows from #5's 728 B to 1,411 B.
  const svc = render(await cfg('doors: [agents, claude]\ngrapher: codegraph\nrepos:\n  svc: ../svc\n'));
  assert.deepEqual(block(svc, HEAD, 6), [HEAD, ...CODEGRAPH_BLOCK]);
  assert.equal(bytes([CODEGRAPH_BLOCK[0]]), 332);
  assert.equal(bytes([CODEGRAPH_GROUP('refreshed at `change land` and `change close`')]), 345);
  assert.equal(bytes(block(svc, HEAD, 6)), 1411);
  assert.doesNotMatch(svc, /-p <repo>/);

  // No post-edit door: the lifecycle is the refresh.
  const lifecycle = render(await cfg('doors: [agents]\ngrapher: graphify\nrepos:\n  web: ../web\n  api: ../api\n'));
  assert.deepEqual(block(lifecycle, HEAD, 2)[1],
    '  - `graphify` at `graphify-out/graph.json` (web: `../web`, api: `../api`), refreshed at `change land` and `change close`, and committed on the change branch by `change land`:');
  assert.equal(bytes(block(lifecycle, HEAD, 5)), 967);

  // No repo resolves it — none declared, or every one opted out: one line, no verb.
  for (const yml of [
    'doors: [agents]\ngrapher: graphify\n',
    'doors: [agents]\ngrapher: graphify\nrepos:\n  web:\n    path: ../web\n    managed: false\n  api:\n    path: ../api\n    grapher: none\n',
  ]) {
    const none = render(await cfg(yml));
    assert.deepEqual(block(none, HEAD, 3), [HEAD, UNRESOLVED], yml);
    assert.equal(bytes([UNRESOLVED]), 160);
    assert.doesNotMatch(none, /--graph <checkout>/, yml);
  }

  // An unverified grapher: no group, and no head above nothing (MV-59).
  const unverified = render(await cfg('doors: [agents]\ngrapher: mystery\nrepos:\n  web: ../web\n'));
  assert.doesNotMatch(unverified, /holds no code/);
  assert.doesNotMatch(unverified, /mystery/);
  const c = await cfg('doors: [agents]\ngrapher: mystery\nrepos:\n  web: ../web\n');
  assert.deepEqual(whereLines(c, new Map([['mystery', ['web']]]), false), []);

  // Graphers the repos resolve, none at the top level: the bytes, pinned.
  // MV-149: one hook per grapher, so with two graphers each is refreshed after
  // an edit there — #5's one hook refreshed neither.
  const mixed = render(await cfg(
    'doors: [agents, claude]\nrepos:\n  web:\n    path: ../web\n    grapher: graphify\n  api:\n    path: ../api\n    grapher: graphify\n  svc:\n    path: ../svc\n    grapher: codegraph\n',
  ));
  assert.deepEqual(block(mixed, HEAD, 10), [HEAD, ...GRAPHIFY_BLOCK, ...CODEGRAPH_BLOCK]);

  // A brain that holds code: both grapher lines byte for byte, then its
  // worktrees' form, then its siblings under their own head.
  const holdsCfg = await cfg('doors: [agents, claude]\ngrapher: graphify\nrepos:\n  brain: .\n  api: ../api\n');
  const holds = render(holdsCfg);
  const own = [
    '- A code graph is kept fresh for you by `graphify` at `graphify-out/graph.json` — refreshed after your edits, and committed on the change branch by `change land`.',
    "  ASK IT BEFORE READING THE TREE RAW. `graphify query`, `graphify explain`, `graphify path` — how and when to use each is in the `## graphify` section graphify's own install writes into this file.",
  ];
  assert.deepEqual(grapherLines(holdsCfg, 'graphify'), own);
  assert.deepEqual(block(holds, own[0], 8), [
    ...own,
    HOLDS_GRAPHIFY,
    SIBLINGS_HEAD,
    '  - `graphify` at `graphify-out/graph.json` (api: `../api`), refreshed after your edits there, and committed on the change branch by `change land`:',
    ...GRAPHIFY_VERBS,
  ]);
  assert.equal(bytes([HOLDS_GRAPHIFY]), 316);
  assert.equal(bytes([SIBLINGS_HEAD]), 282);
  assert.doesNotMatch(holds, /holds no code/);

  const cgCfg = await cfg('doors: [agents]\ngrapher: codegraph\nrepos:\n  brain: .\n');
  const cg = render(cgCfg);
  const cgOwn = grapherLines(cgCfg, 'codegraph');
  assert.deepEqual(block(cg, cgOwn[0], cgOwn.length + 2), [...cgOwn, HOLDS_CODEGRAPH]);
  assert.equal(bytes([HOLDS_CODEGRAPH]), 441);
  assert.doesNotMatch(cg, /The other code repos/, 'no sibling, no head');

  // A grapher under `graphers:` records no verb and no ignore file: nothing
  // reads its artifact back and nothing keeps the law out of it, so no line
  // says it answers, or that anything is kept out.
  const md = render(await cfg(
    'doors: [agents]\ngrapher: mdgraph\ngraphers:\n  mdgraph:\n    artifact: mdgraph-out/graph.json\n    refresh: mdgraph update .\nrepos:\n  brain: .\n',
  ));
  assert.match(md, /`mdgraph` has NO query command/);
  assert.doesNotMatch(md, /It answers for this checkout|kept out of it/);

  // The consumer door moves only by MV-149's verb list (MV-90's shared
  // rendering): a graphify door citing its section is byte-identical, and
  // codegraph's block is 982 B with a post-edit door.
  const consumer = await cfg(
    'doors: [agents, claude, codex]\ngrapher: graphify\nsdd: speckit\nrepos:\n  api: ../api\n  web:\n    path: ../web\n    grapher: codegraph\n',
  );
  assert.equal(renderConsumerDoor(consumer, 'api'), CONSUMER_API);
  assert.equal(renderConsumerDoor(consumer, 'web'), CONSUMER_WEB);
  const cgBlock = CONSUMER_WEB.split('\n').slice(-6);
  assert.equal(bytes(cgBlock), 982);
  // No post-edit door: the lifecycle freshness, 1,001 B; graphify's list,
  // which cites no section, is 6 B shorter at the header (131 → 125 B).
  const lifecycleConsumer = await cfg(
    'doors: [agents]\ngrapher: graphify\nsdd: speckit\nrepos:\n  api: ../api\n  web:\n    path: ../web\n    grapher: codegraph\n',
  );
  const webLines = renderConsumerDoor(lifecycleConsumer, 'web').split('\n');
  assert.deepEqual(webLines.slice(-6), [
    '- A code graph is kept fresh for you by `codegraph` at `.codegraph/codegraph.db` — refreshed at `change land` and `change close`; it is built in each checkout, so never commit it.',
    ...cgBlock.slice(1),
  ]);
  assert.equal(bytes(webLines.slice(-6)), 1001);
  const apiLines = renderConsumerDoor(lifecycleConsumer, 'api').split('\n');
  assert.deepEqual(apiLines.slice(-4), [
    LIST_HEADER,
    ...GRAPHIFY_VERBS.map((l) => l.slice(2).replace(' --graph <checkout>/graphify-out/graph.json', '')),
  ]);
  assert.equal(bytes([LIST_HEADER]), 125);

  // The graph is not the code alone: the root's documents and site stay in it.
  for (const d of doors) assert.doesNotMatch(d, /code only/);
  // MV-149: no door line names a worktree's index without the condition
  // beside it, and no verb pairs codegraph with the repo.
  for (const line of doors.join('\n').split('\n')) {
    if (/-p <worktree>/.test(line)) assert.match(line, /here `apply` printed no such line/, line);
    assert.doesNotMatch(line, /codegraph[^\n]*-p <repo>/);
  }
});

// MV-149: one hook per grapher, so each group asks the one predicate for its
// own grapher. Declarations only (MV-93): the door is the same on a machine
// where a binary is missing, and `doors` and `doctor` say that one.
test('each group says after your edits only where its own hook is wired', async () => {
  const mixed =
    'repos:\n  web:\n    path: ../web\n    grapher: graphify\n  api:\n    path: ../api\n    grapher: graphify\n  svc:\n    path: ../svc\n    grapher: codegraph\n';
  const hooked = renderBrainDoor(await cfg(`doors: [agents, claude]\n${mixed}`), 1);
  assert.deepEqual(block(hooked, HEAD, 10), [HEAD, ...GRAPHIFY_BLOCK, ...CODEGRAPH_BLOCK]);
  // No declared door has a post-edit hook: the lifecycle refreshes both.
  const lifecycle = renderBrainDoor(await cfg(`doors: [agents]\n${mixed}`), 1);
  assert.equal(block(lifecycle, HEAD, 2)[1], GRAPHIFY_BLOCK[0].replace('refreshed after your edits there', 'refreshed at `change land` and `change close`'));
  assert.equal(block(lifecycle, HEAD, 6)[5], CODEGRAPH_GROUP('refreshed at `change land` and `change close`'));
  // Two graphers writing one artifact get no follow hook, and a hook cannot
  // tell their repos apart: their groups say the lifecycle, codegraph's
  // still says after your edits.
  const clash = renderBrainDoor(
    await cfg(
      'doors: [agents, claude]\ngraphers:\n  outgraph:\n    artifact: graphify-out/graph.json\n    refresh: outgraph update .\n' +
        'repos:\n  web:\n    path: ../web\n    grapher: graphify\n  api:\n    path: ../api\n    grapher: outgraph\n  svc:\n    path: ../svc\n    grapher: codegraph\n',
    ),
    1,
  );
  const groups = clash.split('\n').filter((l) => /^  - `[a-z]+` at /.test(l));
  assert.deepEqual(
    groups.map((l) => [l.slice(0, l.indexOf(' at ')), /refreshed after your edits there/.test(l)]),
    [
      ['  - `graphify`', false],
      ['  - `outgraph`', false],
      ['  - `codegraph`', true],
    ],
    groups.join('\n'),
  );
});

// MV-149: where the brain's own lines list its grapher's verbs, a sibling
// group on that grapher says they apply with the flag appended rather than
// listing them again; where those lines cite the vendor's section, which names
// the bare verb, the group lists them.
test("a sibling group on the brain's own grapher says the verbs above", async () => {
  const cgCfg = await cfg('doors: [agents, claude]\ngrapher: codegraph\nrepos:\n  brain: .\n  svc: ../svc\n');
  const door = renderBrainDoor(cgCfg, 1);
  const own = grapherLines(cgCfg, 'codegraph');
  assert.equal(own[1], LIST_HEADER);
  assert.equal(own.length, 6, 'the four verbs, listed once above');
  const dedup = '    - the verbs above, each with `-p <checkout>` appended';
  assert.deepEqual(block(door, SIBLINGS_HEAD, 3), [SIBLINGS_HEAD, CODEGRAPH_BLOCK[0], dedup]);
  assert.equal(bytes([dedup]), 58);
  // The group: 1,090 B with the verbs relisted, 390 B with the line in their place.
  assert.equal(bytes(CODEGRAPH_BLOCK), 1090);
  assert.equal(bytes(block(door, SIBLINGS_HEAD, 3).slice(1)), 390);
  for (const v of CODEGRAPH_VERBS) assert.ok(!door.includes(v), `relisted: ${v.slice(0, 50)}`);

  // graphify citing its section: the door names the bare verbs only, so the
  // sibling group lists them with the flag.
  const cited = renderBrainDoor(await cfg('doors: [agents, claude]\ngrapher: graphify\nrepos:\n  brain: .\n  api: ../api\n'), 1);
  assert.deepEqual(block(cited, SIBLINGS_HEAD, 5).slice(2), GRAPHIFY_VERBS);
  assert.doesNotMatch(cited, /the verbs above/);
  // graphify listing its verbs (no section door): the same line, its own flag.
  const listed = renderBrainDoor(await cfg('doors: [agents]\ngrapher: graphify\nrepos:\n  brain: .\n  api: ../api\n'), 1);
  assert.equal(block(listed, SIBLINGS_HEAD, 3)[2], '    - the verbs above, each with `--graph <checkout>/graphify-out/graph.json` appended');
  // A code-less brain lists every group's verbs: nothing above lists them.
  const codeless = renderBrainDoor(await cfg('doors: [agents, claude]\ngrapher: codegraph\nrepos:\n  svc: ../svc\n'), 1);
  assert.doesNotMatch(codeless, /the verbs above/);
});

/**
 * Rendered by the tree before MV-148, and pinned: the consumer door is
 * byte-identical but for MV-149's verb list — its header and codegraph's verbs.
 */
const CONSUMER_HEAD = [
  '## multivac — consumer door',
  '',
  'This repo belongs to an ecosystem; its brain is mounted at `.brain/`.',
  '',
  "**First, before reading anything in it:** if `.brain` is empty, ask the brain's owner to run `multivac repos sync`, or fill it yourself with `git submodule update --init --remote .brain`",
  'The pin stays where the last commit left it, so a present mount is not a',
  'current one — unrefreshed, you decide against the law as it was weeks ago.',
  '',
  '- Law: `.brain/.multivac/invariants.md` binds this repo. Cite rows by ID, never paraphrase without one.',
  '- The change may cross repos: check the brain before assuming a change is local to this repo.',
  '- Run `multivac verify` before acting; git hooks run it again at commit.',
];
const CONSUMER_SDD =
  "- The brain's `speckit` SDD runs in the brain checkout, never in this mount: specs, plans and tasks are written there. Code here lands only on the branch of an open change declaring this repo; `verify --strict` refuses it anywhere else.";
const CONSUMER_API = [
  ...CONSUMER_HEAD,
  "- How the repos, the law's rows, their anchors and the changes relate is `.brain/.multivac/ecosystem.json`, rendered from the brain's declarations. Ask it: `graphify query \"<question>\" --graph .brain/.multivac/ecosystem.json`, `graphify explain \"<row id or change slug>\" --graph .brain/.multivac/ecosystem.json`, `graphify path \"<A>\" \"<B>\" --graph .brain/.multivac/ecosystem.json`.",
  '',
  'Repos in this ecosystem — these keys are what anchors and change files name:',
  '',
  '- `brain` — the brain itself, mounted here at `.brain/`',
  '- `api` — ../api (this repo)',
  '- `web` — ../web',
  '',
  CONSUMER_SDD,
  '',
  '- A code graph is kept fresh for you by `graphify` at `graphify-out/graph.json` — refreshed after your edits, and committed on the change branch by `change land`.',
  "  ASK IT BEFORE READING THE TREE RAW. `graphify query`, `graphify explain`, `graphify path` — how and when to use each is in the `## graphify` section graphify's own install writes into this file.",
].join('\n');
const CONSUMER_WEB = [
  ...CONSUMER_HEAD,
  "- How the repos, the law's rows, their anchors and the changes relate is `.brain/.multivac/ecosystem.json`, rendered from the brain's declarations, as plain node-link JSON.",
  '',
  'Repos in this ecosystem — these keys are what anchors and change files name:',
  '',
  '- `brain` — the brain itself, mounted here at `.brain/`',
  '- `api` — ../api',
  '- `web` — ../web (this repo)',
  '',
  CONSUMER_SDD,
  '',
  '- A code graph is kept fresh for you by `codegraph` at `.codegraph/codegraph.db` — refreshed after your edits; it is built in each checkout, so never commit it.',
  LIST_HEADER,
  ...CODEGRAPH_VERBS.map((l) => l.slice(2).replace(' -p <checkout>', '')),
].join('\n');
