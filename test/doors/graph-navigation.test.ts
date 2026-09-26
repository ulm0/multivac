// MV-140. The door promises what the hooks do; the post-edit refresh runs in
// the repo of the file just edited; asking the graph is named as unchecked; a
// grapher's own install section is cited rather than repeated.

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gitInit, initRepo } from '../helpers/fixture.js';
import { renderBrainDoor } from '../../src/doors/brain.js';
import { refreshHookCmd } from '../../src/doors/settings.js';
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
