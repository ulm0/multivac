// MV-93: a door in a code repo names the ecosystem it belongs to.
//
// The consumer door was four bullets while the brain's door listed the repos
// and carried every adapter block — so an operator entering through a code
// repo, which is the normal case, got an agent that never learned what else
// existed. Every assertion here is about what a DECLARATION produces; the door
// probes nothing, which the last test pins.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { loadConfig } from '../../src/lib/config.js';
import { renderConsumerDoor } from '../../src/doors/consumer.js';
import { renderBrainDoor } from '../../src/doors/brain.js';

const repoRoot = join(import.meta.dirname, '../../..');

/** A brain whose config is exactly the lines given. */
async function eco(lines: string[]) {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-eco-'));
  const e = makeScratchEcosystem(tmp);
  writeFileSync(join(e.brain, '.multivac/config.yml'), [...lines, ''].join('\n'));
  return { ...e, cfg: await loadConfig(e.brain) };
}

const MULTI = [
  'doors: [agents]',
  'repos:',
  '  api:',
  '    path: ../acme-api',
  '    role: the contract every surface consumes',
  '  web: ../acme-web',
  '  mobile:',
  '    path: ../acme-mobile',
  '    role: |',
  '      the phone app,',
  '      which consumes the contract',
];

// --- the role field ---

test('a role is parsed, reduced to one line, and optional', async () => {
  const { cfg } = await eco(MULTI);
  assert.equal(cfg.repos.api.role, 'the contract every surface consumes');
  // Declared across several lines, rendered as one: the list is a list.
  assert.equal(cfg.repos.mobile.role, 'the phone app, which consumes the contract');
  assert.equal(cfg.repos.web.role, undefined);
});

// --- US1: the ecosystem list ---

test('every declared repo appears, and the one being read is marked', async () => {
  const { cfg } = await eco(MULTI);
  const door = renderConsumerDoor(cfg, 'api');
  assert.match(door, /- `api` — \.\.\/acme-api \(this repo\)/);
  assert.match(door, /- `web` — \.\.\/acme-web$/m);
  assert.match(door, /- `mobile` — \.\.\/acme-mobile/);
  // ...and the marker moves with the door.
  assert.match(renderConsumerDoor(cfg, 'web'), /- `web` — \.\.\/acme-web \(this repo\)/);
});

test("the brain's handle is named, because it can never appear among the declared repos", async () => {
  const { cfg } = await eco(MULTI);
  assert.match(renderConsumerDoor(cfg, 'api'), /- `brain` — the brain itself, mounted here at `[^`]+\/`/);
});

test('a role appears when declared, and nothing is invented when it is not', async () => {
  const { cfg } = await eco(MULTI);
  const door = renderConsumerDoor(cfg, 'api');
  assert.match(door, /`api` — \.\.\/acme-api \(this repo\) · the contract every surface consumes/);
  // web declares none: its line stops at the path.
  assert.match(door, /^- `web` — \.\.\/acme-web$/m);
});

test('a declared repo absent from disk still appears — the list is of declarations', async () => {
  const { cfg } = await eco([...MULTI, '  gone: ../acme-never-cloned']);
  assert.match(renderConsumerDoor(cfg, 'api'), /- `gone` — \.\.\/acme-never-cloned/);
});

test('a single-repo ecosystem prints no list', async () => {
  const { cfg } = await eco(['doors: [agents]', 'repos:', '  api: ../acme-api']);
  const door = renderConsumerDoor(cfg, 'api');
  assert.equal(door.includes('Repos in this ecosystem'), false);
  assert.equal(door.includes('(this repo)'), false);
});

// --- US2: the refresh goes first ---

test('the refresh precedes the law, the list and the adapters', async () => {
  const { cfg } = await eco(MULTI);
  const door = renderConsumerDoor(cfg, 'api');
  const refresh = door.indexOf('**First, before reading anything in it:**');
  assert.ok(refresh > 0, 'the refresh is there');
  assert.ok(refresh < door.indexOf('- Law:'), 'before the law');
  assert.ok(refresh < door.indexOf('Repos in this ecosystem'), 'before the list');
  assert.match(door, /a present mount is not a\ncurrent one/);
});

test('staleness: block still adds its clause', async () => {
  const { cfg } = await eco([...MULTI, 'staleness: block']);
  assert.match(renderConsumerDoor(cfg, 'api'), /A pin behind its channel makes `verify` exit 1 here\./);
});

// --- US3: the adapters that apply here ---

// MV-146: the SDD runs in the brain alone. A sibling's door says where, in
// one line, and carries none of the flow a session there may not run.
test('a sibling door names where the brain\'s SDD runs, in one line, and none of its flow', async () => {
  const { cfg } = await eco([...MULTI, 'sdd: speckit']);
  const door = renderConsumerDoor(cfg, 'api');
  assert.match(door, /^- The brain's `speckit` SDD runs in the brain checkout, never in this mount: specs, plans and tasks are written there\. Code here lands only on the branch of an open change declaring this repo; `verify --strict` refuses it anywhere else\.$/m);
  assert.equal(door.split('\n').filter((l) => l.includes('speckit')).length, 1);
  assert.equal(door.includes('Features gate'), false);
  assert.equal(door.includes('change new` →'), false);
  assert.equal(door.includes("runs the tool's own init"), false);
});

test('no sibling carries a block; an exempt sibling carries no line', async () => {
  const { cfg } = await eco([
    'doors: [agents]',
    'sdd: speckit',
    'repos:',
    '  api:',
    '    path: ../acme-api',
    '    sdd: none',
    '  web: ../acme-web',
  ]);
  assert.equal(renderConsumerDoor(cfg, 'api').includes('speckit'), false);
  // No line at all, not one about a tool called `none` (MV-122).
  assert.equal(renderConsumerDoor(cfg, 'api').includes('SDD'), false);
  const web = renderConsumerDoor(cfg, 'web');
  assert.match(web, /The brain's `speckit` SDD runs in the brain checkout/);
  assert.equal(web.includes('Features gate'), false);
});

test("the brain's door is unchanged by the extraction", async () => {
  const { cfg } = await eco([...MULTI, 'sdd: speckit']);
  const brain = renderBrainDoor(cfg, 3);
  assert.match(brain, /Features gate through the `speckit` SDD/);
  assert.match(brain, /Law lives in `\.multivac\/invariants\.md`/);
  // The brain door lists repos its own way; this change did not touch it.
  assert.match(brain, /Repos in this ecosystem:/);
});

// --- FR-009: the door probes nothing ---

test('rendering a door makes no filesystem check', () => {
  const src = readFileSync(join(repoRoot, 'src/doors/consumer.ts'), 'utf8');
  // Narrow to the CALL shape: a leg over bare identifiers would go red the day
  // somebody writes "this door never calls existsSync" in a comment — MV-46's
  // mistake inverted, failing instead of passing.
  assert.equal(/(existsSync|readFileSync|readdir|statSync)\(/.test(src), false);
});
