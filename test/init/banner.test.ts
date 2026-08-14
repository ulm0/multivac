// MV-33: the banner is init's alone, and it never pretends to measure
// anything. pnpm test runs from the repo root, so src/ is readable here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { banner } from '../../src/lib/banner.js';
import { init } from '../../src/commands/init.js';

const LIT = '●';
const FLIGHT = '◍';

/** Run `fn` with stdout claiming to be a terminal, capturing console.log. */
const capture = async (
  tty: boolean,
  fn: () => Promise<number>,
): Promise<{ code: number; out: string }> => {
  const lines: string[] = [];
  const log = console.log;
  const was = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');
  console.log = (l: string) => lines.push(String(l));
  Object.defineProperty(process.stdout, 'isTTY', { value: tty, configurable: true });
  try {
    return { code: await fn(), out: lines.join('\n') };
  } finally {
    console.log = log;
    if (was) Object.defineProperty(process.stdout, 'isTTY', was);
    else delete (process.stdout as { isTTY?: boolean }).isTTY;
  }
};

test('the banner draws the panel on a terminal, in colour', () => {
  const b = banner({ quiet: false, tty: true, color: true });
  assert.ok(b !== null);
  assert.ok(b.includes(LIT) && b.includes('○'), 'lit and unlit lamps');
  assert.match(b, /\x1b\[33m◍/, 'the lamp in flight is amber');
  assert.ok(b.includes('multivac') && b.includes('brain-driven development'));
});

test('--quiet and a pipe each drop the banner entirely', () => {
  assert.equal(banner({ quiet: true, tty: true, color: true }), null);
  assert.equal(banner({ quiet: false, tty: false, color: true }), null);
});

test('NO_COLOR drops the colour, not the banner', () => {
  const b = banner({ quiet: false, tty: true, color: false });
  assert.ok(b !== null);
  assert.ok(!b.includes('\x1b'), 'no ANSI anywhere');
  // Without colour the amber lamp needs a glyph of its own, or it reads as lit.
  assert.ok(b.includes('#') && b.includes('.') && b.includes('*'));
  assert.ok(!b.includes(LIT) && !b.includes(FLIGHT));
});

test('the lamp pattern is a fixed drawing: same brain or not, same panel', () => {
  assert.equal(
    banner({ quiet: false, tty: true, color: true }),
    banner({ quiet: false, tty: true, color: true }),
  );
});

test('init prints the banner on a terminal and nothing on --quiet', async () => {
  const lit = await capture(true, () => init.run([mkdtempSync(join(tmpdir(), 'mvac-b-'))], {
    cwd: tmpdir(),
  }));
  assert.equal(lit.code, 0);
  assert.ok(lit.out.includes(LIT), 'the panel is there');
  assert.ok(lit.out.includes('init: done'), 'and so is the report');

  const quiet = await capture(true, () =>
    init.run([mkdtempSync(join(tmpdir(), 'mvac-b-')), '--quiet'], { cwd: tmpdir() }),
  );
  assert.equal(quiet.code, 0);
  assert.equal(quiet.out, '', 'nothing at all — banner and report both gone');

  const piped = await capture(false, () => init.run([mkdtempSync(join(tmpdir(), 'mvac-b-'))], {
    cwd: tmpdir(),
  }));
  assert.equal(piped.code, 0);
  assert.ok(!piped.out.includes(LIT), 'no drawing when stdout is not a terminal');
  assert.ok(piped.out.includes('init: done'), 'the report still goes to the pipe');
});

test('never emitted by any other command: only init imports the banner', () => {
  const offenders: string[] = [];
  const walk = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.ts') && p !== join('src', 'lib', 'banner.ts')) {
        if (/banner/.test(readFileSync(p, 'utf8'))) offenders.push(p);
      }
    }
  };
  walk('src');
  assert.deepEqual(offenders, [join('src', 'commands', 'init.ts')]);
});
