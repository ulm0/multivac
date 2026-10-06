// MV-157: the site is published in English and Spanish, and the two cannot
// drift apart silently. Every fact here is a CORRESPONDENCE between two files,
// which is the shape an anchor cannot state (an anchor asserts a pattern inside
// one file set, never that file B mirrors file A), so it is a test, for the
// reason site-fonts.test.ts and changelog.test.ts already carry.
//
// The twin of `x.md` is `x.es.md`, beside it. Prose is translated; everything a
// reader runs, copies or follows is not: fenced blocks, inline code, link
// destinations and law ids must be the ones of the English page, so a Spanish
// page can never promise a flag, a path or a rule the English one does not. A
// Spanish heading keeps the English heading's id, so a link to `#some-anchor`
// works in both languages. pnpm test runs from the repo root.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parse as yaml } from 'yaml';

/** Tracked paths, the same enumeration verify uses — never a tree walk. */
const tracked = (): string[] =>
  execFileSync('git', ['ls-files', '-z', 'site/content'], { encoding: 'utf8' })
    .split('\0')
    .filter((p) => p.endsWith('.md'));

const isEs = (p: string): boolean => p.endsWith('.es.md');
const twinOf = (p: string): string => p.replace(/\.md$/, '.es.md');
const pairs = (): [string, string][] => tracked().filter((p) => !isEs(p)).map((p) => [p, twinOf(p)]);

/** Run `check` over every pair; one failure message names them all. */
function eachPair(check: (en: string, es: string, enSrc: string, esSrc: string) => string | null): void {
  const failures: string[] = [];
  for (const [en, es] of pairs()) {
    const msg = check(en, es, readFileSync(en, 'utf8'), readFileSync(es, 'utf8'));
    if (msg) failures.push(`${es}: ${msg}`);
  }
  assert.deepEqual(failures, [], `Spanish twins that differ from their English page:\n${failures.join('\n')}`);
}

interface Fence { info: string; body: string }

/** Split a page into fenced blocks and the prose between them. */
function scan(src: string): { fences: Fence[]; prose: string[] } {
  const fences: Fence[] = [];
  const prose: string[] = [];
  let open: { marker: string; info: string; body: string[] } | null = null;
  for (const line of src.split('\n')) {
    if (open) {
      if (new RegExp(`^\\s*${open.marker[0]}{${open.marker.length},}\\s*$`).test(line)) {
        fences.push({ info: open.info, body: open.body.join('\n') });
        open = null;
      } else open.body.push(line);
      continue;
    }
    const f = /^\s*(`{3,}|~{3,})(.*)$/.exec(line);
    if (f) open = { marker: f[1], info: f[2].trim(), body: [] };
    else prose.push(line);
  }
  assert.equal(open, null, 'a fenced block is never closed');
  return { fences, prose };
}

const frontMatter = (src: string): Record<string, unknown> => {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(src);
  return m ? ((yaml(m[1]) as Record<string, unknown>) ?? {}) : {};
};
const body = (src: string): string => src.replace(/^---\n[\s\S]*?\n---\n/, '');

/** The id Hugo gives a heading: GitHub style, lower case, punctuation dropped. */
function anchorize(text: string): string {
  return text
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*?|__?/g, (m) => (m.includes('_') ? m : ''))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

/** Heading levels, text and ids in order; ids carry Hugo's `-1`, `-2` suffix on repeats. */
function headings(src: string): { level: number; text: string; id: string | null }[] {
  const out: { level: number; text: string; id: string | null }[] = [];
  for (const line of scan(body(src)).prose) {
    const m = /^(#{1,6}) +(.*?)(?: *\{#([^}\s]+)\})? *$/.exec(line);
    if (m) out.push({ level: m[1].length, text: m[2], id: m[3] ?? null });
  }
  return out;
}

function englishIds(src: string): string[] {
  const seen = new Map<string, number>();
  return headings(src).map((h) => {
    const base = anchorize(h.text);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n === 0 ? base : `${base}-${n}`;
  });
}

const sorted = (a: string[]): string[] => [...a].sort();

/** CommonMark code spans: a run of N backticks closes at the next run of exactly N; a newline reads as a space. */
function codeSpans(text: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] !== '`') { i++; continue; }
    let j = i;
    while (text[j] === '`') j++;
    const n = j - i;
    let k = j;
    let found = -1;
    while (k < text.length) {
      if (text[k] === '`') {
        let m = k;
        while (text[m] === '`') m++;
        if (m - k === n) { found = k; break; }
        k = m;
      } else k++;
    }
    if (found < 0) { i = j; continue; }
    out.push(text.slice(j, found).replace(/\s+/g, ' ').trim());
    i = found + n;
  }
  return out;
}
const proseOf = (src: string): string => scan(body(src)).prose.join('\n');

test('a Spanish twin exists for every English page and the reverse (MV-157)', () => {
  const all = tracked();
  const en = all.filter((p) => !isEs(p));
  const es = all.filter(isEs);
  assert.ok(en.length > 0, 'site/content holds no English page — MV-157 has nothing to hold');
  const missing = en.filter((p) => !all.includes(twinOf(p))).map((p) => `${p} has no ${twinOf(p)}`);
  const orphans = es.filter((p) => !all.includes(p.replace(/\.es\.md$/, '.md'))).map((p) => `${p} has no English page`);
  assert.deepEqual([...missing, ...orphans], [], 'the two languages list different pages');
});

test('a page and its twin carry the same fenced blocks in the same order (MV-157)', () => {
  eachPair((_en, _es, enSrc, esSrc) => {
    const a = scan(body(enSrc)).fences;
    const b = scan(body(esSrc)).fences;
    if (a.length !== b.length) return `${b.length} fenced blocks, the English page has ${a.length}`;
    const i = a.findIndex((f, k) => f.info !== b[k].info || f.body !== b[k].body);
    return i < 0 ? null : `fenced block ${i + 1} differs from the English page`;
  });
});

test('the headings of a twin match in level and count, and keep the English ids (MV-157)', () => {
  eachPair((_en, _es, enSrc, esSrc) => {
    const a = headings(enSrc);
    const b = headings(esSrc);
    if (a.length !== b.length) return `${b.length} headings, the English page has ${a.length}`;
    const ids = englishIds(enSrc);
    for (let k = 0; k < a.length; k++) {
      if (a[k].level !== b[k].level) return `heading ${k + 1} is level ${b[k].level}, the English one level ${a[k].level}`;
      const want = a[k].id ?? ids[k];
      if (b[k].id !== want) return `heading ${k + 1} ("${b[k].text}") must end with {#${want}} so links to it work in both languages`;
    }
    return null;
  });
});

test('a page and its twin carry the same shortcodes in the same order (MV-157)', () => {
  const codes = (src: string): string[] => [...src.matchAll(/\{\{<\s*(\/?[a-z][\w/-]*)/g)].map((m) => m[1]);
  eachPair((_en, _es, enSrc, esSrc) => {
    const a = codes(enSrc);
    const b = codes(esSrc);
    return a.join(' ') === b.join(' ') ? null : `shortcodes ${b.join(' ')} differ from the English page's ${a.join(' ')}`;
  });
});

test('a page and its twin share front matter keys and weight, and carry a description (MV-157)', () => {
  eachPair((en, es, enSrc, esSrc) => {
    const a = frontMatter(enSrc);
    const b = frontMatter(esSrc);
    // `aliases` is an address that moved; no Spanish address ever did, so a twin has none.
    const keys = (fm: Record<string, unknown>): string => sorted(Object.keys(fm).filter((k) => k !== 'aliases')).join();
    if (keys(a) !== keys(b)) {
      return `front matter keys ${keys(b)} differ from the English page's ${keys(a)}`;
    }
    if (a.weight !== b.weight) return `weight ${String(b.weight)}, the English page has ${String(a.weight)}`;
    for (const [p, fm] of [[en, a], [es, b]] as const) {
      if ('description' in fm && !String(fm.description ?? '').trim()) return `${p} has an empty description`;
    }
    return null;
  });
});

test('a twin names exactly the law ids its English page names (MV-157)', () => {
  const ids = (src: string): string[] => sorted(src.match(/\b(?:MV|INV)-\d+\b/g) ?? []);
  eachPair((_en, _es, enSrc, esSrc) => {
    const a = ids(enSrc);
    const b = ids(esSrc);
    return a.join() === b.join() ? null : `names ${b.join(',') || 'no law id'}, the English page names ${a.join(',') || 'none'}`;
  });
});

test('a twin uses the same inline code and the same link destinations as its page (MV-157)', () => {
  const code = (src: string): string[] => sorted(codeSpans(proseOf(src)));
  const links = (src: string): string[] =>
    sorted([
      ...[...proseOf(src).matchAll(/\]\(([^)\s]+)/g)].map((m) => m[1]),
      ...[...proseOf(src).matchAll(/\b(?:link|href)="([^"]+)"/g)].map((m) => m[1]),
    ]);
  eachPair((_en, _es, enSrc, esSrc) => {
    const [c1, c2] = [code(enSrc), code(esSrc)];
    if (c1.join('\n') !== c2.join('\n')) {
      const only = (x: string[], y: string[]): string[] => x.filter((v, i) => y[i] !== v).slice(0, 3);
      return `inline code differs from the English page (e.g. ${JSON.stringify(only(c2, c1))} vs ${JSON.stringify(only(c1, c2))})`;
    }
    const [l1, l2] = [links(enSrc), links(esSrc)];
    return l1.join('\n') === l2.join('\n') ? null : `link destinations differ from the English page`;
  });
});
