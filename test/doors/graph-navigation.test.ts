// MV-140. The door promises what the hooks do; the post-edit refresh runs in
// the repo of the file just edited; asking the graph is named as unchecked; a
// grapher's own install section is cited rather than repeated.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gitInit, initRepo } from '../helpers/fixture.js';
import { renderBrainDoor } from '../../src/doors/brain.js';
import { refreshHookCmd } from '../../src/doors/settings.js';
import { grapherSpec } from '../../src/adapters/registry.js';
import { doctorReport } from '../../src/commands/doctor.js';
import type { Config } from '../../src/types.js';
import { loadConfig } from '../../src/lib/config.js';

async function cfgWith(doors: string, grapher: string): Promise<Config> {
  const b = join(mkdtempSync(join(tmpdir(), 'mvac-nav-')), 'brain');
  initRepo(b, {
    '.multivac/config.yml': `doors: [${doors}]\ngrapher: ${grapher}\nrepos:\n  brain: .\n`,
    '.multivac/invariants.md': '# Invariants\n',
  });
  return loadConfig(b);
}

test('the door promises a refresh after edits only where a declared harness has the hook — MV-140', async () => {
  assert.match(renderBrainDoor(await cfgWith('agents', 'graphify'), 1), /kept fresh for you by `graphify` at `graphify-out\/graph\.json` — refreshed at `change land` and `change close`, and committed/);
  assert.match(renderBrainDoor(await cfgWith('agents, claude', 'graphify'), 1), /— refreshed after your edits, and committed/);
});

test('a grapher whose own install covers a declared door is cited, not repeated — MV-140', async () => {
  const cited = renderBrainDoor(await cfgWith('agents, claude', 'graphify'), 1);
  assert.match(cited, /ASK IT BEFORE READING THE TREE RAW\. `graphify query`, `graphify explain`, `graphify path` — how and when to use each is in the `## graphify` section graphify's own install writes into this file\./);
  assert.doesNotMatch(cited, /returns the subgraph that answers it/);
  const listed = renderBrainDoor(await cfgWith('agents', 'codegraph'), 1);
  assert.match(listed, /ASK IT BEFORE READING THE TREE RAW\. It answers in one call/);
});

test('the door cites the vendor section only where a declared platform writes it — MV-143', async () => {
  // graphify's `agents` platform writes a skill and no section anywhere
  // (measured on 0.9.29), so the door carries the verbs itself. It used to cite
  // a section no declared platform would ever write.
  const alone = renderBrainDoor(await cfgWith('agents', 'graphify'), 1);
  assert.match(alone, /ASK IT BEFORE READING THE TREE RAW\. It answers in one call/);
  assert.doesNotMatch(alone, /section graphify's own install writes into this file/);
  // codex writes it into AGENTS.md itself; claude through the CLAUDE.md link.
  for (const doors of ['agents, codex', 'agents, claude']) {
    assert.match(
      renderBrainDoor(await cfgWith(doors, 'graphify'), 1),
      /section graphify's own install writes into this file/,
      doors,
    );
  }
});

test('the post-edit refresh runs in the repo of the edited file when it holds the graph — MV-140', () => {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-nav-hook-')));
  const session = join(tmp, 'brain');
  const sibling = join(tmp, 'brain/.multivac/worktrees/feat/api');
  const bare = join(tmp, 'plain');
  for (const d of [session, sibling, bare]) {
    mkdirSync(d, { recursive: true });
    gitInit(d);
  }
  mkdirSync(join(sibling, 'src'));
  writeFileSync(join(sibling, 'src/a.ts'), '');
  writeFileSync(join(bare, 'x.ts'), '');
  for (const d of [session, sibling]) {
    mkdirSync(join(d, 'out'), { recursive: true });
    writeFileSync(join(d, 'out/graph.json'), '{}\n');
  }
  const marker = join(tmp, 'ran');
  const bin = join(tmp, 'bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'fakeg'), `#!/bin/sh\npwd -P >> '${marker}'\n`);
  chmodSync(join(bin, 'fakeg'), 0o755);
  const cmd = refreshHookCmd('fakeg update .', {}, 'out/graph.json');
  const fire = (file: string): string => {
    writeFileSync(marker, '');
    spawnSync('sh', ['-c', cmd], { cwd: session, input: JSON.stringify({ tool_input: { file_path: file } }), env: { ...process.env, PATH: `${bin}:/usr/bin:/bin` } });
    for (let i = 0; i < 50 && readFileSync(marker, 'utf8') === ''; i++) spawnSync('sleep', ['0.1']);
    return readFileSync(marker, 'utf8').trim();
  };
  assert.equal(fire(join(sibling, 'src/a.ts')), sibling, 'the edited repo');
  assert.equal(fire(join(bare, 'x.ts')), session, 'a repo with no graph leaves the refresh where it was');
  assert.equal(fire(''), session);
});

// MV-148. In a brain that holds no code the post-edit hook is the one refresh
// that follows an agent's edits, made from the brain session, into a code
// repo's worktree; and today's hook fell through to the session's directory —
// the brain — where one edit built a graph again after a human had removed
// the install. Run synchronously, so "nothing ran" is read, not waited for.
test("a code-less brain's hook never refreshes a checkout of the brain — MV-148", () => {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-nav-follow-')));
  const brain = join(tmp, 'brain');
  const web = join(tmp, 'web');
  const kept = '{"kept":"by a human"}\n';
  initRepo(brain, {
    '.multivac/config.yml': 'doors: [agents, claude]\ngrapher: fakeg\nrepos:\n  web: ../web\n',
    'tools/ledger.ts': '',
    'out/graph.json': kept,
  });
  initRepo(web, { 'src/util.ts': '', 'out/graph.json': '{}\n' });
  // The change's worktrees: the brain's, whose toplevel is not the session's
  // directory, and web's, nested under the brain's worktree root.
  const brainWt = join(brain, '.multivac/worktrees/x/brain');
  const webWt = join(brain, '.multivac/worktrees/x/web');
  execFileSync('git', ['-C', brain, 'worktree', 'add', '-q', '-b', 'x', brainWt], { stdio: 'ignore' });
  execFileSync('git', ['-C', web, 'worktree', 'add', '-q', '-b', 'x', webWt], { stdio: 'ignore' });
  const marker = join(tmp, 'ran');
  const bin = join(tmp, 'bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'fakeg'), `#!/bin/sh\npwd -P >> '${marker}'\necho '{"refreshed":true}' > out/graph.json\n`);
  chmodSync(join(bin, 'fakeg'), 0o755);
  const cmd = refreshHookCmd('fakeg update .', {}, 'out/graph.json', true);
  assert.ok(cmd.endsWith(' & exit 0'), cmd);
  const sync = `${cmd.slice(0, -' & exit 0'.length)}; exit 0`;
  const fire = (file: string): string => {
    writeFileSync(marker, '');
    const r = spawnSync('sh', ['-c', sync], {
      cwd: brain,
      input: JSON.stringify({ tool_input: { file_path: file } }),
      env: { ...process.env, PATH: `${bin}:/usr/bin:/bin` },
    });
    assert.equal(r.status, 0, String(r.stderr));
    return readFileSync(marker, 'utf8').trim();
  };
  const graph = (dir: string): string => readFileSync(join(dir, 'out/graph.json'), 'utf8');

  assert.equal(fire(join(brain, 'tools/ledger.ts')), '', 'a brain file');
  assert.equal(fire(join(brainWt, 'tools/ledger.ts')), '', "a file in the brain's worktree");
  assert.equal(fire(''), '', 'no file: the session directory, which is the brain');
  assert.equal(graph(brain), kept);
  assert.equal(graph(brainWt), kept);
  assert.equal(fire(join(web, 'src/util.ts')), web, 'a code repo file');
  assert.equal(fire(join(webWt, 'src/util.ts')), webWt, "a file in that repo's worktree");
  assert.equal(graph(webWt), '{"refreshed":true}\n');
  assert.equal(graph(brain), kept);
});

// MV-148, a stated ceiling. The follow hook moves into the edited file's repo
// and reaches a copy of the grapher in THAT checkout's node_modules/.bin, and
// `doors` wires it when every code repo finds one there. git never puts an
// untracked node_modules in a change worktree, so an edit there — the one
// this hook is for — runs nothing, silently; `doctor`'s refresh path says so.
test("a copy found only in a code repo's node_modules/.bin refreshes that checkout and not its change worktree — MV-148", () => {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'mvac-nav-local-')));
  const brain = join(tmp, 'brain');
  const web = join(tmp, 'web');
  initRepo(brain, { '.multivac/config.yml': 'doors: [agents, claude]\ngrapher: fakeg\nrepos:\n  web: ../web\n' });
  initRepo(web, { '.gitignore': 'node_modules/\n', 'src/util.ts': '', 'out/graph.json': '{}\n' });
  const marker = join(tmp, 'ran');
  mkdirSync(join(web, 'node_modules/.bin'), { recursive: true });
  writeFileSync(join(web, 'node_modules/.bin/fakeg'), `#!/bin/sh\npwd -P >> '${marker}'\n`);
  chmodSync(join(web, 'node_modules/.bin/fakeg'), 0o755);
  const webWt = join(brain, '.multivac/worktrees/x/web');
  execFileSync('git', ['-C', web, 'worktree', 'add', '-q', '-b', 'x', webWt], { stdio: 'ignore' });
  const cmd = refreshHookCmd('fakeg update .', {}, 'out/graph.json', true);
  const sync = `${cmd.slice(0, -' & exit 0'.length)}; exit 0`;
  const fire = (file: string): string => {
    writeFileSync(marker, '');
    const r = spawnSync('sh', ['-c', sync], {
      cwd: brain,
      input: JSON.stringify({ tool_input: { file_path: file } }),
      env: { ...process.env, PATH: '/usr/bin:/bin' },
    });
    assert.equal(r.status, 0, String(r.stderr));
    return readFileSync(marker, 'utf8').trim();
  };
  assert.equal(fire(join(web, 'src/util.ts')), web, "the repo's own checkout");
  assert.equal(readFileSync(join(webWt, 'out/graph.json'), 'utf8'), '{}\n');
  assert.equal(fire(join(webWt, 'src/util.ts')), '', 'its worktree: no node_modules, no binary, nothing run');
});

// The hook bytes a brain that holds code and a consumer write, pinned whole:
// MV-148 adds the follow form beside them and changes none of theirs.
test('the follow hook adds one guard, and every other hook keeps its bytes — MV-148', () => {
  const head =
    `L=.multivac/cache/graph-refresh.lock; f=$(sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\\([^"]*\\)".*/\\1/p' | head -n 1); ` +
    't=$(git -C "$(dirname "${f:-.}")" rev-parse --show-toplevel 2>/dev/null); ';
  const tail = (refresh: string, env: string): string =>
    `PATH="$PATH:$PWD/node_modules/.bin"; ${env}find "$L" -maxdepth 0 -mmin +30 -exec rmdir {} + 2>/dev/null; ` +
    `mkdir -p .multivac/cache && mkdir "$L" 2>/dev/null || exit 0; { ${refresh}; rmdir "$L"; } >/dev/null 2>&1 </dev/null & exit 0`;
  const graphify = grapherSpec('graphify')!;
  const codegraph = grapherSpec('codegraph')!;
  const hook = (s: typeof graphify, follow?: boolean): string => refreshHookCmd(s.refresh, s.env ?? {}, s.artifacts[0], follow);
  const cgEnv = 'export DO_NOT_TRACK=1 CODEGRAPH_TELEMETRY=0 CODEGRAPH_NO_DOWNLOAD=1; ';
  const today = {
    graphify: `${head}[ -n "$t" ] && [ -e "$t/graphify-out/graph.json" ] && cd "$t"; ${tail('graphify update .', '')}`,
    codegraph: `${head}[ -n "$t" ] && [ -e "$t/.codegraph/codegraph.db" ] && cd "$t"; ${tail('codegraph sync', cgEnv)}`,
  };
  assert.equal(hook(graphify), today.graphify);
  assert.equal(hook(graphify, false), today.graphify);
  assert.equal(hook(codegraph), today.codegraph);
  assert.equal(Buffer.byteLength(today.graphify), 492);
  assert.equal(Buffer.byteLength(today.codegraph), 558);
  const guard = '[ -n "$t" ] && [ ! -e "$t/.multivac/config.yml" ] && ';
  assert.equal(
    hook(graphify, true),
    `${head}${guard}[ -e "$t/graphify-out/graph.json" ] && cd "$t" || exit 0; ${tail('graphify update .', '')}`,
  );
  assert.equal(
    hook(codegraph, true),
    `${head}${guard}[ -e "$t/.codegraph/codegraph.db" ] && cd "$t" || exit 0; ${tail('codegraph sync', cgEnv)}`,
  );
  assert.equal(Buffer.byteLength(hook(graphify, true)), 540);
  assert.equal(Buffer.byteLength(hook(codegraph, true)), 606);
  assert.doesNotMatch(hook(graphify, true), /--force/);
});

test('doctor names asking the graph as unchecked, and offers a platform that writes the section — MV-140, MV-143', async () => {
  const b = join(mkdtempSync(join(tmpdir(), 'mvac-nav-doc-')), 'brain');
  initRepo(b, {
    '.multivac/config.yml': 'doors: [agents]\ngrapher: graphify\nrepos:\n  brain: .\n',
    '.multivac/invariants.md': '# Invariants\n',
    'graphify-out/graph.json': '{}\n',
  });
  // graphify's `agents` platform writes a skill and no section, so the door does
  // not cite one and there is nothing to repair. It used to offer
  // `--platform agents`, a command that cannot write what the line asked for.
  assert.doesNotMatch((await doctorReport(b)).lines.join('\n'), /has no `## graphify` section/);

  // codex writes the section into AGENTS.md itself (measured, MV-143).
  writeFileSync(join(b, '.multivac/config.yml'), 'doors: [agents, codex]\ngrapher: graphify\nrepos:\n  brain: .\n');
  assert.match(
    (await doctorReport(b)).lines.join('\n'),
    /AGENTS\.md has no `## graphify` section, which the door cites → `graphify install --project --platform codex`/,
  );

  // claude writes its own root door, which reaches AGENTS.md through the symlink
  // `installHarness` creates before the vendor runs.
  writeFileSync(join(b, '.multivac/config.yml'), 'doors: [agents, claude]\ngrapher: graphify\nrepos:\n  brain: .\n');
  assert.match(
    (await doctorReport(b)).lines.join('\n'),
    /which the door cites → `graphify install --project --platform claude`/,
  );

  writeFileSync(join(b, 'AGENTS.md'), '# door\n\n## graphify\n\nrules\n');
  assert.doesNotMatch((await doctorReport(b)).lines.join('\n'), /has no `## graphify` section/);
  assert.match((await doctorReport(b)).lines.join('\n'), /^grapher {4}navigation: ungateable — no committed file records that a graph was asked before the tree was read; a nudge, never a gate$/m);
});
