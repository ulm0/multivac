// MV-114: a boundary refuses what it cannot honour. A key this reader does not
// know is not "extra" — it is a declaration nothing honours, which is MV-85's
// defect relocated into a config file.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigError, loadConfig } from '../../src/lib/config.js';
import { sddNames } from '../../src/adapters/registry.js';
import { verify } from '../../src/commands/verify.js';

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

// MV-146. The SDD lives in the brain alone, so a declaration that resolves in
// no root is a config nothing honours: refused at load, naming the key, the fix
// and the change the edit needs (MV-97). Exit 2 is the load's, through verify.

async function refusedAtLoad(body: string): Promise<{ message: string; code: number; out: string }> {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-sdd-decl-'));
  mkdirSync(join(dir, '.multivac'), { recursive: true });
  writeFileSync(join(dir, '.multivac/config.yml'), body);
  let message = '';
  await assert.rejects(() => loadConfig(dir), (e: Error) => {
    message = e.message;
    return e instanceof ConfigError;
  });
  const lines: string[] = [];
  const orig = { log: console.log, error: console.error };
  console.log = console.error = (...a: unknown[]) => { lines.push(a.map(String).join(' ')); };
  let code: number;
  try {
    code = await verify.run([], { cwd: dir });
  } finally {
    console.log = orig.log;
    console.error = orig.error;
  }
  return { message, code, out: lines.join('\n') };
}

const CHANGE_FOR_EDIT = 'then open a change for the config edit: `multivac change new <slug>`';

test("a code repo's sdd: takes only none; a tool there is refused at load, naming the key — MV-146", async () => {
  for (const tool of ['speckit', 'opsx']) {
    const r = await refusedAtLoad(`doors: [agents]\nsdd: speckit\nrepos:\n  brain: .\n  web:\n    path: ../web\n    sdd: ${tool}\n`);
    assert.equal(r.code, 2, r.out);
    assert.ok(r.message.startsWith(`repos.web.sdd: ${tool} — REFUSED: the SDD lives in the brain alone`), r.message);
    assert.ok(r.message.includes('Fix: remove repos.web.sdd or set it to none in .multivac/config.yml'), r.message);
    assert.ok(r.message.endsWith(CHANGE_FOR_EDIT), r.message);
    assert.ok(r.out.includes(r.message), 'verify prints the refusal it exits on');
  }
  // With no SDD anywhere else, too: the code repo's tool would run nowhere.
  const alone = await refusedAtLoad('doors: [agents]\nrepos:\n  web:\n    path: ../web\n    sdd: speckit\n');
  assert.match(alone.message, /^repos\.web\.sdd: speckit — REFUSED/);

  // `none` exempts the repo's code, and an empty value stays unset: both load.
  const dir = mkdtempSync(join(tmpdir(), 'mvac-sdd-none-'));
  mkdirSync(join(dir, '.multivac'), { recursive: true });
  for (const v of ['none', "''"]) {
    writeFileSync(join(dir, '.multivac/config.yml'), `doors: [agents]\nsdd: speckit\nrepos:\n  brain: .\n  web:\n    path: ../web\n    sdd: ${v}\n`);
    const cfg = await loadConfig(dir);
    assert.equal(cfg.sddRefusal, undefined, v);
  }
});

test("a top-level SDD the brain's own entry contradicts is refused; one it repeats loads — MV-146", async () => {
  for (const own of ['opsx', 'none']) {
    const r = await refusedAtLoad(`doors: [agents]\nsdd: speckit\nrepos:\n  core:\n    path: .\n    sdd: ${own}\n  api: ../api\n`);
    assert.equal(r.code, 2, r.out);
    assert.equal(
      r.message,
      `sdd: speckit — REFUSED: the brain's own entry repos.core.sdd says ${own}, so speckit resolves in no root. Fix: make them agree in .multivac/config.yml, ${CHANGE_FOR_EDIT}`,
    );
  }
  const dir = mkdtempSync(join(tmpdir(), 'mvac-sdd-agree-'));
  mkdirSync(join(dir, '.multivac'), { recursive: true });
  for (const body of [
    'doors: [agents]\nsdd: speckit\nrepos:\n  core:\n    path: .\n    sdd: speckit\n',
    // The brain entry alone, with no top level: it names the one root it runs in.
    'doors: [agents]\nrepos:\n  core:\n    path: .\n    sdd: opsx\n',
    // A top-level none under the brain's own tool: the brain's entry decides.
    'doors: [agents]\nsdd: none\nrepos:\n  core:\n    path: .\n    sdd: opsx\n',
  ]) {
    writeFileSync(join(dir, '.multivac/config.yml'), body);
    assert.equal((await loadConfig(dir)).sddRefusal, undefined, body);
  }
});

test('an SDD name the registry does not know is refused by the key that declares it — MV-146', async () => {
  const top = await refusedAtLoad('doors: [agents]\nsdd: acme-sdd\nrepos:\n  brain: .\n');
  assert.equal(top.code, 2, top.out);
  assert.equal(
    top.message,
    `sdd: acme-sdd — REFUSED: no SDD adapter is named acme-sdd (known: ${sddNames.join(', ')}). Fix: correct sdd: in .multivac/config.yml, ${CHANGE_FOR_EDIT}`,
  );
  const own = await refusedAtLoad('doors: [agents]\nrepos:\n  core:\n    path: .\n    sdd: acme-sdd\n');
  assert.match(own.message, /^repos\.core\.sdd: acme-sdd — REFUSED: no SDD adapter is named acme-sdd .* Fix: correct repos\.core\.sdd: in \.multivac\/config\.yml/);
});

test("a consumer's read of its mounted brain records the refusal instead of throwing — MV-146", async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-sdd-report-'));
  mkdirSync(join(dir, '.multivac'), { recursive: true });
  writeFileSync(join(dir, '.multivac/config.yml'), 'doors: [agents]\nsdd: speckit\nrepos:\n  web:\n    path: ../web\n    sdd: opsx\n');
  const cfg = await loadConfig(dir, { sddDeclaration: 'report' });
  assert.match(cfg.sddRefusal ?? '', /^repos\.web\.sdd: opsx — REFUSED/);
  assert.equal(cfg.repos.web.path, '../web', 'the rest of the config is loaded as declared');
  // The default is refuse, and saying so explicitly changes nothing.
  await assert.rejects(() => loadConfig(dir, { sddDeclaration: 'refuse' }), ConfigError);
});
