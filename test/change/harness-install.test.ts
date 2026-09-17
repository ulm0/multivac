// MV-131. graphify 0.9.29 ships a project install per harness — a skill, a
// rule, hooks — and nothing ran it; the hooks it writes name the binary by this
// machine's absolute path. Measured 2026-09-16 (see the registry entry).

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gitInit, vendorPath } from '../helpers/fixture.js';
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

const tmp = (): string => {
  const d = mkdtempSync(join(tmpdir(), 'mvac-harness-'));
  gitInit(d);
  return d;
};

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
