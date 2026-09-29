// MV-131. graphify 0.9.29 ships a project install per harness — a skill, a
// rule, hooks — and nothing ran it; the hooks it writes name the binary by this
// machine's absolute path. Measured 2026-09-16 (see the registry entry).

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gitInit, initRepo, vendorPath } from '../helpers/fixture.js';
import { init } from '../../src/commands/init.js';
import { doctorReport } from '../../src/commands/doctor.js';
import { bareBinary } from '../../src/adapters/refresh.js';

const vendors = vendorPath();

async function run(argv: string[], cwd: string): Promise<{ code: number; out: string }> {
  const lines: string[] = [];
  const orig = { log: console.log, error: console.error, path: process.env.PATH };
  console.log = console.error = (...a: unknown[]) => {
    lines.push(a.map(String).join(' '));
  };
  process.env.PATH = vendors.path;
  try {
    return { code: await init.run(argv, { cwd }), out: lines.join('\n') };
  } finally {
    console.log = orig.log;
    console.error = orig.error;
    process.env.PATH = orig.path;
  }
}

// MV-148: a brain that holds code — a committed source file makes `init`
// declare `brain: .` — since only such a brain resolves the grapher, and is
// where the vendor's install goes.
const tmp = (): string => {
  const d = mkdtempSync(join(tmpdir(), 'mvac-harness-'));
  initRepo(d, { 'src/app.ts': 'export const app = 1;\n' });
  return d;
};

test('a code-less brain gets no harness install — MV-148', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mvac-harness-codeless-'));
  gitInit(dir);
  const { code, out } = await run(['--provider', 'claude,cursor', '--grapher', 'graphify'], dir);
  assert.equal(code, 0, out);
  for (const probe of ['.agents/skills/graphify/SKILL.md', '.claude/skills/graphify/SKILL.md', '.cursor/rules/graphify.mdc']) {
    assert.equal(existsSync(join(dir, probe)), false, probe);
  }
  assert.doesNotMatch(out, /installed into/);
  assert.equal(existsSync(join(dir, 'graphify-out')), false, 'and no graph');
  const gi = existsSync(join(dir, '.gitignore')) ? readFileSync(join(dir, '.gitignore'), 'utf8') : '';
  assert.doesNotMatch(gi, /graphify/, 'no ignore line of the grapher either');
  assert.match(out, /init: graphify is declared, and this brain holds no code \(no repos entry is the brain\)/);
});

test('a declared grapher is installed into each declared harness, once — MV-131', async () => {
  const dir = tmp();
  const { code, out } = await run(['--provider', 'claude,cursor', '--grapher', 'graphify'], dir);
  assert.equal(code, 0, out);
  for (const probe of ['.agents/skills/graphify/SKILL.md', '.claude/skills/graphify/SKILL.md', '.cursor/rules/graphify.mdc']) {
    assert.ok(existsSync(join(dir, probe)), probe);
  }
  assert.match(out, /graph graphify @ brain: installed into claude \(`graphify install --project --platform claude`\)/);
  assert.match(readFileSync(join(dir, '.gitignore'), 'utf8'), /^\*\.graphify-bak$/m);
  const again = await run([], dir);
  assert.doesNotMatch(again.out, /installed into/, 'an installed platform is not installed again');
});

test('a hook naming one machine\'s path to graphify is rewritten to the bare name — MV-131', async () => {
  const dir = tmp();
  mkdirSync(join(dir, '.claude'), { recursive: true });
  const abs = '{"hooks":{"PreToolUse":[{"hooks":[{"type":"command","command":"/Users/someone/.local/bin/graphify hook-guard read"}]}]}}\n';
  writeFileSync(join(dir, '.claude/settings.json'), abs);
  const { code, out } = await run(['--provider', 'claude', '--grapher', 'graphify'], dir);
  assert.equal(code, 0, out);
  const settings = readFileSync(join(dir, '.claude/settings.json'), 'utf8');
  assert.match(settings, /"graphify hook-guard read"/);
  assert.doesNotMatch(settings, /\/Users\/someone/);
  assert.match(out, /\.claude\/settings\.json named graphify by an absolute path — rewritten to `graphify`, found on PATH/);
});

test('bareBinary touches only a path ending in the binary and a space — MV-131', () => {
  assert.equal(bareBinary('"cmd": "/opt/x/graphify hook-guard read"', 'graphify'), '"cmd": "graphify hook-guard read"');
  assert.equal(bareBinary('"doc": "/usr/share/graphify-docs/readme"', 'graphify'), '"doc": "/usr/share/graphify-docs/readme"');
  assert.equal(bareBinary('"cmd": "graphify update ."', 'graphify'), '"cmd": "graphify update ."');
});

test('a door with no platform is named, and nothing runs for it — MV-131', async () => {
  const dir = tmp();
  const { code, out } = await run(['--provider', 'windsurf', '--grapher', 'graphify'], dir);
  assert.equal(code, 0, out);
  assert.match(out, /graph graphify @ brain: windsurf has no graphify platform — its own install is not run for it/);
});

test('doctor names a missing harness install and runs nothing — MV-131', async () => {
  const dir = tmp();
  assert.equal((await run(['--provider', 'claude', '--grapher', 'graphify', '--quiet'], dir)).code, 0);
  const probe = join(dir, '.claude/skills/graphify/SKILL.md');
  writeFileSync(probe, ''); // keep the file for the next line, then remove it
  const { rmSync } = await import('node:fs');
  rmSync(join(dir, '.claude/skills/graphify'), { recursive: true, force: true });
  const orig = process.env.PATH;
  process.env.PATH = vendors.path;
  try {
    const { lines } = await doctorReport(dir);
    const g = lines.find((l) => l.startsWith('grapher') && l.includes('graphify @ brain')) ?? '';
    assert.match(g, /harness install missing for claude → `graphify install --project --platform claude`/);
  } finally {
    process.env.PATH = orig;
  }
  assert.equal(existsSync(probe), false, 'doctor ran nothing');
});

test('the door is linked before the vendor writes there — MV-143', async () => {
  const dir = tmp();
  const first = await run(['--provider', 'claude', '--grapher', 'graphify'], dir);
  assert.equal(first.code, 0, first.out);
  assert.equal(readlinkSync(join(dir, 'CLAUDE.md')), 'AGENTS.md');
  // `repos sync` equips a repo it just cloned and projects no doors there, so
  // the vendor used to arrive first and leave a regular CLAUDE.md that MV-108
  // then forbids replacing. That state is this: no link, no probe.
  rmSync(join(dir, 'CLAUDE.md'));
  rmSync(join(dir, '.claude/skills/graphify'), { recursive: true });
  const again = await run([], dir);
  assert.equal(again.code, 0, again.out);
  assert.equal(readlinkSync(join(dir, 'CLAUDE.md')), 'AGENTS.md');
  const link = again.out.indexOf("linked CLAUDE.md -> AGENTS.md before graphify's own install");
  const install = again.out.indexOf('installed into claude');
  assert.ok(link !== -1, again.out);
  assert.ok(install !== -1, again.out);
  assert.ok(link < install, `the link must come first:\n${again.out}`);
  // Nothing to say once the link is ours.
  const third = await run([], dir);
  assert.doesNotMatch(third.out, /linked CLAUDE\.md/);
});

test('a door somebody else wrote is left alone, and the run names it — MV-108, MV-143', async () => {
  const dir = tmp();
  writeFileSync(join(dir, 'CLAUDE.md'), 'a human wrote this door\n');
  const { code, out } = await run(['--provider', 'claude', '--grapher', 'graphify'], dir);
  assert.equal(code, 0, out);
  assert.equal(readFileSync(join(dir, 'CLAUDE.md'), 'utf8'), 'a human wrote this door\n');
  assert.match(out, /CLAUDE\.md exists as a regular file — merge it into AGENTS\.md and remove it/);
});

test('the bare rewrite runs on a root whose platforms are all installed — MV-131', async () => {
  const dir = tmp();
  const first = await run(['--provider', 'claude', '--grapher', 'graphify'], dir);
  assert.equal(first.code, 0, first.out);
  // What a vendor install run by hand afterwards leaves behind. The rewrite used
  // to sit after an early return that fired as soon as every probe was present,
  // so this path was committed and broke for everyone but its author.
  writeFileSync(
    join(dir, '.claude/settings.json'),
    '{"hooks":{"PreToolUse":[{"hooks":[{"type":"command","command":"/opt/x/bin/graphify hook-guard read"}]}]}}\n',
  );
  const again = await run([], dir);
  assert.equal(again.code, 0, again.out);
  const settings = readFileSync(join(dir, '.claude/settings.json'), 'utf8');
  assert.match(settings, /"graphify hook-guard read"/);
  assert.doesNotMatch(settings, /opt\/x\/bin/);
  assert.match(again.out, /\.claude\/settings\.json named graphify by an absolute path — rewritten to `graphify`/);
  assert.doesNotMatch(again.out, /installed into/, 'nothing was installed on this run');
});

test('a platform whose file repeats the canonical section is skipped — MV-143', async () => {
  const dir = tmp();
  // The section a section-writing platform already put in the canonical door.
  writeFileSync(join(dir, 'AGENTS.md'), '# door\n\n## graphify\n\nask the graph first\n');
  const { code, out } = await run(['--provider', 'cursor', '--grapher', 'graphify'], dir);
  assert.equal(code, 0, out);
  assert.match(out, /cursor skipped — AGENTS\.md already carries the `## graphify` section/);
  assert.equal(existsSync(join(dir, '.cursor/rules/graphify.mdc')), false, 'no second copy written');
  assert.match(readFileSync(join(dir, 'AGENTS.md'), 'utf8'), /^## graphify$/m, 'the section is still there');
});

test('without the section, the redundant platform runs as before — MV-143', async () => {
  const dir = tmp();
  const { code, out } = await run(['--provider', 'cursor', '--grapher', 'graphify'], dir);
  assert.equal(code, 0, out);
  assert.ok(existsSync(join(dir, '.cursor/rules/graphify.mdc')), out);
  assert.doesNotMatch(out, /cursor skipped/);
});
