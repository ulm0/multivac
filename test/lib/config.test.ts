// MV-114: a boundary refuses what it cannot honour. A key this reader does not
// know is not "extra" — it is a declaration nothing honours, which is MV-85's
// defect relocated into a config file.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig } from '../../src/lib/config.js';

test('an unknown config key is refused by name, with its near miss — MV-114', () => {
  // `strict_prepush: true` loaded clean and armed nothing, and doctor still
  // called the gate armed: MV-85's defect relocated into a config file.
  const dir = mkdtempSync(join(tmpdir(), 'mvac-stray-'));
  mkdirSync(join(dir, '.multivac'), { recursive: true });
  const write = (body: string) => writeFileSync(join(dir, '.multivac/config.yml'), body);

  write('doors: [agents]\nstrict_prepush: true\nrepos:\n  brain: .\n');
  return assert.rejects(
    () => loadConfig(dir),
    (e: Error) => /unknown key "strict_prepush"/.test(e.message) && /strict_pre_push/.test(e.message),
  );
});

test('a stray under a repo entry and under a grapher is refused too — MV-114', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-stray2-'));
  mkdirSync(join(dir, '.multivac'), { recursive: true });
  const write = (body: string) => writeFileSync(join(dir, '.multivac/config.yml'), body);

  write('doors: [agents]\nrepos:\n  api:\n    path: ../api\n    chanel: origin/main\n');
  await assert.rejects(() => loadConfig(dir), /unknown key "repos\.api\.chanel"/);

  write('doors: [agents]\nrepos:\n  brain: .\ngraphers:\n  mine:\n    artifact: g/out\n    refresh: g update\n    binaryy: g\n');
  await assert.rejects(() => loadConfig(dir), /unknown key "graphers\.mine\.binaryy"/);

  // And a legal config still loads.
  write('doors: [agents]\nstrict_pre_push: true\nrepos:\n  brain: .\n');
  const cfg = await loadConfig(dir);
  assert.equal(cfg.strictPrePush, true);
});

test('a grapher declared under the name `none` is refused by name — MV-122', async () => {
  // `none` means no grapher at every level; a tool of that name would make the
  // token mean two things, so the declaration is what gives way.
  const dir = mkdtempSync(join(tmpdir(), 'mvac-none-decl-'));
  mkdirSync(join(dir, '.multivac'), { recursive: true });
  writeFileSync(
    join(dir, '.multivac/config.yml'),
    'doors: [agents]\ngrapher: none\ngraphers:\n  none:\n    artifact: out/graph.json\n    refresh: "true"\n',
  );
  await assert.rejects(() => loadConfig(dir), /graphers\.none/);
});

test('managed is a boolean on a repo entry, and only false is carried — MV-125', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-managed-'));
  mkdirSync(join(dir, '.multivac'), { recursive: true });
  const write = (body: string) => writeFileSync(join(dir, '.multivac/config.yml'), body);

  write('doors: [agents]\nrepos:\n  brain: .\n  api:\n    path: ../api\n    managed: false\n');
  assert.equal((await loadConfig(dir)).repos.api.managed, false);

  // The default is true, and an entry that says so keeps the shape it had.
  for (const line of ['    managed: true\n', '']) {
    write(`doors: [agents]\nrepos:\n  api:\n    path: ../api\n${line}`);
    assert.equal('managed' in (await loadConfig(dir)).repos.api, false);
  }

  for (const bad of ['"false"', '0', 'null']) {
    write(`doors: [agents]\nrepos:\n  api:\n    path: ../api\n    managed: ${bad}\n`);
    await assert.rejects(() => loadConfig(dir), /"repos\.api\.managed" must be true or false/, bad);
  }
});

test('the brain cannot be declared unmanaged, under any key — MV-125', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-managed-brain-'));
  mkdirSync(join(dir, '.multivac'), { recursive: true });
  const write = (body: string) => writeFileSync(join(dir, '.multivac/config.yml'), body);

  for (const key of ['brain', 'self']) {
    write(`doors: [agents]\nrepos:\n  ${key}:\n    path: .\n    managed: false\n`);
    await assert.rejects(() => loadConfig(dir), /the brain is always managed/, key);
  }
});

// MV-127. The address other people clone the brain from. Hand-authored: the
// tool writes it commented and never derives it, because a brain's own origin
// can be a machine-local ssh alias and this value lands in every consumer's
// `.gitmodules`.

test('brain_url loads, a misspelling is refused, an empty one is refused — MV-127', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-brainurl-'));
  mkdirSync(join(dir, '.multivac'), { recursive: true });
  const write = (body: string) => writeFileSync(join(dir, '.multivac/config.yml'), body);

  write('doors: [agents]\nbrain_url: git@github.com:acme/brain.git\nrepos:\n  brain: .\n');
  assert.equal((await loadConfig(dir)).brainUrl, 'git@github.com:acme/brain.git');

  write('doors: [agents]\nbrain_ur1: git@github.com:acme/brain.git\nrepos:\n  brain: .\n');
  await assert.rejects(() => loadConfig(dir), /unknown key "brain_ur1"/);

  write('doors: [agents]\nbrain_url: "   "\nrepos:\n  brain: .\n');
  await assert.rejects(() => loadConfig(dir), /"brain_url" is empty/);

  write('doors: [agents]\nrepos:\n  brain: .\n');
  assert.equal((await loadConfig(dir)).brainUrl, undefined, 'undeclared is undeclared');
});
