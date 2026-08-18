// MV-100: a pasted link renders as itself.
//
// Measured before this landed: the deployed head served an EMPTY description,
// a whitespace `og:type`, and NO `og:image` on any page — which is the whole
// reason a pasted link came out bare, because a scraper that finds no image
// does not fall back to a favicon.
//
// This reads the DECLARATIONS, not a built site: the test job runs a node
// image with no site builder in it. A test that quietly checked something
// weaker depending on its environment would be worse than one that says what
// it checks. The built head is walked in the quickstart and is visible on the
// deployed page.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const repoRoot = join(import.meta.dirname, '../../..');
const site = join(repoRoot, 'site');
const config = parse(readFileSync(join(site, 'hugo.yaml'), 'utf8')) as {
  params?: { description?: string; images?: string[] };
  enableRobotsTXT?: boolean;
};

test('the site declares a card image, and the theme emits none without one', () => {
  const images = config.params?.images ?? [];
  assert.ok(images.length > 0, 'no params.images — every page would ship without og:image');
  for (const rel of images) {
    assert.ok(statSync(join(site, 'static', rel)).isFile(), `not in static/: ${rel}`);
  }
});

test('the card image is a raster of the dimensions link scrapers expect', () => {
  const buf = readFileSync(join(site, 'static', (config.params?.images ?? [])[0]));
  // PNG: 8-byte signature, then IHDR carrying width and height as big-endian.
  assert.equal(
    buf.subarray(1, 4).toString('latin1'),
    'PNG',
    'not a PNG — most scrapers do not read SVG cards',
  );
  assert.equal(buf.readUInt32BE(16), 1200);
  assert.equal(buf.readUInt32BE(20), 630);
});

test('the site declares a fallback description', () => {
  const d = config.params?.description ?? '';
  assert.ok(d.trim().length > 40, 'params.description missing or too short to be a summary');
});

test('every section landing authors its own description — including one added tomorrow', () => {
  // The theme derives a missing one from whatever prose comes first — a
  // sentence written to open a section, not to describe a page. A description
  // nobody wrote is a description nobody checked.
  //
  // Walked RECURSIVELY rather than listed: a listed set passes forever while
  // the section somebody adds next week ships without one, which is exactly
  // the silent regression this claim exists to catch.
  const content = join(site, 'content');
  const landings: string[] = [];
  const walk = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === '_index.md') landings.push(p);
    }
  };
  walk(content);
  assert.ok(landings.length >= 5, 'the walk found no sections — it is looking in the wrong place');
  for (const f of landings) {
    const fm = /^---\n([\s\S]*?)\n---/.exec(readFileSync(f, 'utf8'))?.[1] ?? '';
    const d = (parse(fm) as { description?: string } | null)?.description ?? '';
    assert.ok(d.trim().length > 40, `no description in ${f.replace(repoRoot, '')}`);
  }
});

test('the site is served from one absolute origin, so every canonical resolves', () => {
  const cfg = parse(readFileSync(join(site, 'hugo.yaml'), 'utf8')) as { baseURL?: string };
  assert.match(cfg.baseURL ?? '', /^https:\/\/\S+\/$/, 'baseURL must be absolute and end in a slash');
});

test('the empty taxonomy pages are not generated', () => {
  // `/categories/` and `/tags/` shipped in the sitemap with no content on
  // them. Thin pages in an index are a cost, not an omission — and these exist
  // only because the taxonomies are on by default and used by nothing here.
  const kinds = (parse(readFileSync(join(site, 'hugo.yaml'), 'utf8')) as {
    disableKinds?: string[];
  }).disableKinds ?? [];
  for (const k of ['taxonomy', 'term']) {
    assert.ok(kinds.includes(k), `${k} pages would be generated and indexed empty`);
  }
});

test('the sitemap can carry a freshness date', () => {
  // Every entry shipped without <lastmod>, because no page declares a date.
  // Git already knows when each page changed, so the signal costs a switch
  // rather than a field nobody would maintain.
  const cfg = parse(readFileSync(join(site, 'hugo.yaml'), 'utf8')) as { enableGitInfo?: boolean };
  assert.equal(cfg.enableGitInfo, true, 'sitemap entries would ship with no lastmod');
});

test('the language is declared with the key the generator actually reads', () => {
  // `locale:` was here and is not a Hugo key — an inert line that looked like a
  // setting, which is worse than an absent one.
  const raw = readFileSync(join(site, 'hugo.yaml'), 'utf8');
  const cfg = parse(raw) as { languageCode?: string };
  assert.match(cfg.languageCode ?? '', /^[a-z]{2}-[A-Z]{2}$/);
  assert.equal(/^locale:/m.test(raw), false, 'the inert key came back');
});

test('the head adds only tags the theme does not already emit', () => {
  // A duplicate tag is two sources for one fact, and the day they disagree the
  // wrong one may win. The theme emits og:title/description/type/url and the
  // card; these are the ones it does not.
  const head = readFileSync(join(site, 'layouts/_partials/custom/head-end.html'), 'utf8');
  for (const added of ['og:site_name', 'og:locale', 'og:image:width', 'application/ld+json']) {
    assert.ok(head.includes(added), `missing ${added}`);
  }
  for (const themes of ['og:title', 'og:description', 'og:url', 'twitter:card']) {
    assert.equal(head.includes(`"${themes}"`), false, `duplicates the theme's ${themes}`);
  }
});

test('the structured data is emitted in a JS context, not an HTML one', () => {
  // safeHTML leaves Go's JS escaper to JSON-encode the whole document into a
  // string, which is valid JSON and useless structured data. Measured, not
  // reasoned about: the first two attempts shipped exactly that.
  const head = readFileSync(join(site, 'layouts/_partials/custom/head-end.html'), 'utf8');
  assert.match(head, /jsonify \| safeJS/);
});

test('the crawler file is enabled and names the sitemap', () => {
  assert.equal(config.enableRobotsTXT, true, 'robots.txt would 404 while the sitemap returns 200');
  assert.match(
    readFileSync(join(site, 'layouts/robots.txt'), 'utf8'),
    /Sitemap:/,
    'the crawler file does not name the sitemap',
  );
});
