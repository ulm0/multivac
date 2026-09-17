// MV-139. The brain keeps `.multivac/ecosystem.json`: how its repos, law rows,
// anchors and changes relate, rendered from declarations only.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { initRepo } from '../helpers/fixture.js';
import { loadConfig } from '../../src/lib/config.js';
import { ecosystemGraphLines, renderEcosystem } from '../../src/doors/ecosystem.js';
import { renderBrainDoor } from '../../src/doors/brain.js';
import { renderConsumerDoor } from '../../src/doors/consumer.js';
import { doorsCommand } from '../../src/commands/doors.js';
import { verify } from '../../src/commands/verify.js';
import { change } from '../../src/commands/change.js';

process.env.PATH = [dirname(process.execPath), '/usr/bin', '/bin'].join(delimiter);
for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();

async function quiet(fn: () => Promise<number>): Promise<{ code: number; out: string }> {
  const lines: string[] = [];
  const orig = { log: console.log, error: console.error };
  console.log = console.error = (...a: unknown[]) => { lines.push(a.map(String).join(' ')); };
  try {
    return { code: await fn(), out: lines.join('\n').replace(/\x1b\[[0-9;]*m/g, '') };
  } finally {
    console.log = orig.log;
    console.error = orig.error;
  }
}

const SECRET = 'Only billing may write balances';
const change_ = (slug: string, status: string, claims: string[], adds: string[] = []): string =>
  `---\nslug: ${slug}\nstatus: ${status}\nrepos:\n  api:\n    status: landed\n  web:\n    status: planned\nlanding_order:\n  - - api\n  - - web\ninvariants:\n  touches: []\n  adds: [${adds.join(', ')}]\n  retires: []\nclaims:\n${claims.map((c) => `  - id: ${c}\n    statement: x\n`).join('') || '  []\n'}---\n\n# ${slug}\n`;

function brain(grapher = 'graphify'): string {
  const b = join(mkdtempSync(join(tmpdir(), 'mvac-eco-')), 'brain');
  initRepo(b, {
    '.multivac/config.yml': `doors: [agents]\ngrapher: ${grapher}\nrepos:\n  api:\n    path: ../api\n    role: service\n  web: ../web\n`,
    '.multivac/invariants.md': [
      '# Invariants', '', '| ID | statement | authority | state | date | source |', '| --- | --- | --- | --- | --- | --- |',
      `| INV-01 | ${SECRET} | published | active | 2026-01-01 | [changes/archive/first.md](changes/archive/first.md) |`,
      '<!-- @anchor INV-01 api:db/*.sql /balance/ -->',
      '| INV-02 | every repo has a readme | owner | active | 2026-01-01 | x |',
      '<!-- @anchor INV-02 *:README.md /./ -->', '',
    ].join('\n'),
    '.multivac/changes/archive/first.md': change_('first', 'archived', ['INV-01']),
    '.multivac/changes/next.md': change_('next', 'open', ['INV-02', 'INV-99'], ['INV-99']),
  });
  return b;
}

test('the graph holds declarations only: repos, rows without text, anchors, changes — and the same bytes twice — MV-139', async () => {
  const b = brain();
  const cfg = await loadConfig(b);
  const text = await renderEcosystem(b, cfg);
  assert.equal(await renderEcosystem(b, cfg), text, 'deterministic');
  assert.ok(!text.includes(SECRET), 'no statement text');
  const g = JSON.parse(text) as { directed: boolean; nodes: { id: string; [k: string]: unknown }[]; links: { source: string; target: string; relation: string; [k: string]: unknown }[] };
  assert.equal(g.directed, true);
  const ids = g.nodes.map((n) => n.id);
  for (const id of ['repo:brain', 'repo:api', 'repo:web', 'law:INV-01', 'law:INV-02', 'change:first', 'change:next', 'glob:api:db/*.sql', 'glob:brain:README.md', 'glob:web:README.md']) {
    assert.ok(ids.includes(id), id);
  }
  const api = g.nodes.find((n) => n.id === 'repo:api')!;
  assert.equal(api.role, 'service');
  assert.equal(api.graph, 'graphify-out/graph.json');
  const has = (s: string, t: string, r: string): boolean => g.links.some((l) => l.source === s && l.target === t && l.relation === r);
  assert.ok(has('repo:brain', 'repo:api', 'declares'));
  assert.ok(has('repo:api', 'repo:brain', 'mounts'));
  assert.ok(has('law:INV-01', 'glob:api:db/*.sql', 'anchors'));
  assert.ok(has('glob:api:db/*.sql', 'repo:api', 'in_repo'));
  assert.ok(has('change:next', 'law:INV-02', 'claims'));
  assert.ok(has('law:INV-01', 'change:first', 'enacted_by'));
  assert.equal(g.links.find((l) => l.source === 'change:next' && l.target === 'repo:web')?.stage, 2);
  assert.ok(!ids.includes('law:INV-99') && !g.links.some((l) => l.target === 'law:INV-99'), 'a row not in the table is no node, and its links are dropped');
});

test('doors writes it; verify reports it stale, never gating; a brain bookkeeping commit carries it — MV-139', async () => {
  const b = brain();
  await quiet(() => doorsCommand.run([], { cwd: b }));
  git(b, 'add', '-A');
  git(b, 'commit', '-qm', 'doors');
  const fresh = await quiet(() => verify.run([], { cwd: b }));
  assert.doesNotMatch(fresh.out, /ecosystem\.json is/);

  writeFileSync(join(b, '.multivac/invariants.md'), readFileSync(join(b, '.multivac/invariants.md'), 'utf8') + '| INV-03 | new | owner | proposed | 2026-01-02 | x |\n');
  const stale = await quiet(() => verify.run([], { cwd: b }));
  assert.equal(stale.code, 0, stale.out);
  assert.match(stale.out, /ecosystem \.multivac\/ecosystem\.json is stale — `multivac doors` renders it; reported, never gating/);
  git(b, 'checkout', '--', '.multivac/invariants.md');

  mkdirSync(join(b, '.multivac/changes'), { recursive: true });
  assert.equal((await quiet(() => change.run(['new', 'third', 'Third'], { cwd: b }))).code, 0);
  assert.match(git(b, 'show', '--name-only', '--format=', 'HEAD'), /^\.multivac\/ecosystem\.json$/m);
  assert.match(readFileSync(join(b, '.multivac/ecosystem.json'), 'utf8'), /"change:third"/);
});

test('the doors name it, with graphify\'s --graph verbs only where graphify resolves — MV-139', async () => {
  const withG = await loadConfig(brain('graphify'));
  assert.match(renderBrainDoor(withG, 1), /`graphify explain "<row id or change slug>" --graph \.multivac\/ecosystem\.json`/);
  assert.match(renderConsumerDoor(withG, 'api'), /`graphify query "<question>" --graph \.brain\/\.multivac\/ecosystem\.json`/);
  const without = await loadConfig(brain('codegraph'));
  assert.deepEqual(ecosystemGraphLines(without, 'brain', ''), [
    "- How the repos, the law's rows, their anchors and the changes relate is `.multivac/ecosystem.json`, rendered from the brain's declarations, as plain node-link JSON.",
  ]);
});
