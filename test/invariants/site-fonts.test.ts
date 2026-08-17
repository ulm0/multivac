// MV-83 pins that the site serves its own type. Two of its facts are the shape
// no anchor can state, for the reason MV-72 and MV-77 already carry: an anchor
// asserts a pattern inside one file set, never a correspondence between two.
//
//   - "every @font-face source resolves to a path git actually tracks" — an
//     anchor sees the string in the stylesheet and nothing about the file
//     behind it, so a typo'd filename passes every leg and 404s every reader.
//   - "every shipped font file has a licence beside it" — an anchor can name
//     one pair; it cannot say "for each font, a matching licence", so the third
//     font someone adds ships unlicensed and green.
//
// Both are cross-file, so both are here. pnpm test runs from the repo root.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const CSS = 'site/assets/css/custom.css';
const FONT_DIR = 'site/static/fonts';

/** Tracked paths, the same enumeration verify uses — never a tree walk. */
const tracked = (): Set<string> =>
  new Set(
    execFileSync('git', ['ls-files', '-z', 'site'], { encoding: 'utf8' })
      .split('\0')
      .filter(Boolean),
  );

test('every @font-face source resolves to a tracked file', () => {
  const css = readFileSync(CSS, 'utf8');
  const srcs = [...css.matchAll(/src:\s*url\('([^']+)'\)/g)].map((m) => m[1]);
  assert.ok(srcs.length > 0, `${CSS} declares no @font-face src — MV-83 has nothing to hold`);

  const files = tracked();
  for (const src of srcs) {
    assert.ok(
      src.startsWith('/fonts/'),
      `${CSS} loads ${src} — MV-83 requires a repo-local absolute path, and a host here would be a third-party request`,
    );
    // `/fonts/x.woff2` is served from site/static/fonts/x.woff2.
    const path = `site/static${src}`;
    assert.ok(
      files.has(path),
      `${CSS} loads ${src}, but ${path} is not tracked — the page 404s for every reader while every anchor stays green`,
    );
  }
});

test('every shipped font file has a licence beside it', () => {
  const entries = readdirSync(FONT_DIR);
  const fonts = entries.filter((f) => f.endsWith('.woff2'));
  assert.ok(fonts.length > 0, `${FONT_DIR} ships no font — MV-83 has nothing to hold`);

  const licences = entries.filter((f) => /^(OFL|LICEN[SC]E)/i.test(f));
  assert.ok(
    licences.length >= fonts.length,
    `${FONT_DIR} ships ${fonts.length} font(s) and ${licences.length} licence file(s) — redistributing a face without its licence is the one thing an open font licence asks`,
  );

  for (const l of licences) {
    const text = readFileSync(`${FONT_DIR}/${l}`, 'utf8');
    assert.match(
      text,
      /SIL OPEN FONT LICENSE Version 1\.1/,
      `${FONT_DIR}/${l} is not the OFL 1.1 text — a fetch that returned an error page would look exactly like this`,
    );
    assert.match(
      text,
      /^Copyright /m,
      `${FONT_DIR}/${l} carries no copyright line — the licence text alone does not say whose work it covers`,
    );
  }
});
