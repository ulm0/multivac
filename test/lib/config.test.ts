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
