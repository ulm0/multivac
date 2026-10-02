// MV-153. multivac keeps no code graph. No adapter is a grapher, no door or
// flow line names one whatever an old config still declares, and the package
// ships no module that builds, refreshes or renders one. The one module that
// may name the two vendors is the record of what was dropped, which writes,
// deletes and spawns nothing. pnpm test runs from the repo root.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { sddNames, sddSpec } from '../../src/adapters/registry.js';
import { loadConfig } from '../../src/lib/config.js';
import { renderBrainDoor } from '../../src/doors/brain.js';
import { renderConsumerDoor } from '../../src/doors/consumer.js';
import { renderFlow } from '../../src/doors/flow.js';

/** Configs an earlier release wrote, each key in every shape it took. */
const OLD_CONFIGS = [
  'grapher: graphify\n',
  'grapher: codegraph\ngrapher_auto: false\n',
  'grapher: mygraph\ngraphers:\n  mygraph:\n    artifact: out/g.json\n    refresh: mygraph build\n',
  'grapher_auto: maybe\ngraphers:\n  none: {}\n',
];

const GRAPH = /graph|ecosystem\.json|--graph/i;

test('no adapter is a grapher and no door renders a graph line, whatever an old config declares — MV-153', async () => {
  for (const name of sddNames) assert.equal(sddSpec(name)?.kind, 'sdd', name);
  for (const name of ['graphify', 'codegraph']) assert.equal(sddSpec(name), undefined, name);

  const tmp = mkdtempSync(join(tmpdir(), 'mvac-nograph-'));
  let n = 0;
  for (const head of OLD_CONFIGS) {
    for (const repos of [
      'repos:\n  brain: .\n  api:\n    path: ../api\n    grapher: codegraph\n',
      'repos:\n  api:\n    path: ../api\n    grapher: graphify\n  web: ../web\n',
    ]) {
      const brain = join(tmp, `b${n++}`);
      mkdirSync(join(brain, '.multivac'), { recursive: true });
      writeFileSync(join(brain, '.multivac/config.yml'), `doors: [agents, claude]\nsdd: speckit\n${head}${repos}`);
      const cfg = await loadConfig(brain);
      assert.ok(cfg.dropped.length > 0, `${head}: the keys are recorded`);
      const rendered = {
        brain: renderBrainDoor(cfg, 1),
        consumer: renderConsumerDoor(cfg, 'api'),
        flow: renderFlow(cfg),
      };
      for (const [door, text] of Object.entries(rendered)) {
        const lines = text.split('\n').filter((l) => GRAPH.test(l));
        assert.deepEqual(lines, [], `${door} door under ${JSON.stringify(head + repos)}`);
      }
    }
  }
});

/** Every file under `root`, relative to the repo root. */
function tree(root: string): string[] {
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => relative('.', join(e.parentPath, e.name)));
}

test('the package ships no module that builds, refreshes or renders a graph — MV-153', () => {
  // The package ships dist/, built one module per source file from src/.
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { files: string[] };
  assert.deepEqual(pkg.files, ['dist', 'skills']);
  for (const gone of ['src/doors/ecosystem.ts', 'src/adapters/refresh.ts', 'src/adapters/tracked.ts', 'src/lib/json-splice.ts']) {
    assert.equal(existsSync(gone), false, `${gone} is back`);
  }
  const RECORD = 'src/lib/dropped.ts';
  const problems: string[] = [];
  for (const rel of tree('src')) {
    const text = readFileSync(rel, 'utf8');
    text.split('\n').forEach((line, i) => {
      if (/^\s*export\s+(async\s+)?function\s+\w*graph\w*\s*\(/i.test(line)) problems.push(`${rel}:${i + 1}: ${line.trim()}`);
      if (rel !== RECORD && /graphify|codegraph|ecosystem\.json|graph-refresh\.lock/i.test(line)) {
        problems.push(`${rel}:${i + 1}: ${line.trim()}`);
      }
    });
  }
  assert.deepEqual(problems, []);
  // The record names the vendors to say what is left; it runs and removes nothing.
  assert.doesNotMatch(readFileSync(RECORD, 'utf8'), /(^|[^\w.])(rm|unlink|rmdir|writeFile|appendFile)\(|execFile|spawn/m);
});
