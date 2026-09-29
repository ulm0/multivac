// MV-149. Lines spliced into one list of a JSON file a human owns, at the
// text level. Re-serialising a human's `codegraph.json` dropped a duplicate
// key, its CRLFs and a number's digits (`1.50` became `1.5`); a splice keeps
// every byte it did not insert — the output with the inserted spans removed is
// the input — so the file stays theirs. Measured on 13 shapes: CRLF, one line,
// human keys, numbers, a duplicate key, no trailing newline, escapes, an
// absent key inline and multi-line, `{}`, an empty array, tabs.
//
// Pure: no fs, no git. A line is quoted with `JSON.stringify(line)`, and no
// object is ever serialised.

/** What a splice gives back: the new text and what it inserted, or why it left the file alone. */
export type SpliceResult =
  | {
      ok: true;
      /** The spliced text; `raw` itself when nothing was added. */
      text: string;
      /** The lines inserted, in order. */
      added: string[];
      /** Lines another of the `reads` lists names: the human's, skipped with the list that names them. */
      skipped: { line: string; list: string }[];
    }
  | { ok: false; why: string };

/** `/x/`, `x/`, `!/x`, `**\/x`, `x/**` → `x`, `x/**`: an entry or a line, its negation, leading `**\/`, anchor and trailing slash aside. */
const bare = (s: string): string =>
  s.trim().replace(/^!/, '').replace(/^(\*\*\/)+/, '').replace(/^\/+/, '').replace(/\/+$/, '');

/**
 * Whether `entry`, one pattern of a list, names the directory `line` does:
 * `x`, `x/`, `/x`, `/x/`, `x/**` or `/x/**`, each also with a leading `**\/`,
 * negated or not — measured equivalent on 1.6.0, `**\/.brain/` and `**\/.brain`
 * keeping a root `.brain` out as `/.brain/` does — or a path under it
 * (`/.brain/test/`), which a line over the whole directory would override,
 * since the key list wins. Any other glob naming it (`.br*\/`) is not read.
 */
const names = (entry: string, line: string): boolean => {
  const d = bare(line);
  const e = bare(entry);
  return e === d || e.startsWith(`${d}/`);
};

/** The list of `reads` naming `line`, in the order given, or undefined. `parsed` is the file as JSON.parse keeps it. */
export function namedBy(parsed: unknown, reads: string[], line: string): string | undefined {
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined;
  const o = parsed as Record<string, unknown>;
  for (const list of reads) {
    const v = o[list];
    if (Array.isArray(v) && v.some((e) => typeof e === 'string' && names(e, line))) return list;
  }
  return undefined;
}

/** Past the string starting at `i` (its opening quote), escapes included. */
function skipString(text: string, i: number): number {
  for (let j = i + 1; j < text.length; j++) {
    if (text[j] === '\\') j++;
    else if (text[j] === '"') return j + 1;
  }
  return text.length;
}

/** Past the whitespace starting at `i`. */
function skipWs(text: string, i: number): number {
  while (i < text.length && /[ \t\r\n]/.test(text[i]!)) i++;
  return i;
}

/** Past the value starting at `i`: a string, an object, an array or a literal. The text already parsed. */
function skipValue(text: string, i: number): number {
  const c = text[i];
  if (c === '"') return skipString(text, i);
  if (c === '{' || c === '[') {
    let depth = 0;
    for (let j = i; j < text.length; j++) {
      const d = text[j];
      if (d === '"') j = skipString(text, j) - 1;
      else if (d === '{' || d === '[') depth++;
      else if (d === '}' || d === ']') {
        depth--;
        if (depth === 0) return j + 1;
      }
    }
    return text.length;
  }
  while (i < text.length && !/[,}\] \t\r\n]/.test(text[i]!)) i++;
  return i;
}

interface Member {
  key: string;
  keyStart: number;
  /** The text between the key and the value: `:` and any whitespace around it. */
  colon: string;
  valueStart: number;
  valueEnd: number;
}

/** The top-level object's members, in text order, and where its braces sit. */
function members(text: string): { open: number; close: number; list: Member[] } {
  const open = skipWs(text, 0);
  const list: Member[] = [];
  let i = skipWs(text, open + 1);
  while (text[i] === '"') {
    const keyEnd = skipString(text, i);
    const key = JSON.parse(text.slice(i, keyEnd)) as string;
    const valueStart = skipWs(text, skipWs(text, keyEnd) + 1);
    const valueEnd = skipValue(text, valueStart);
    list.push({ key, keyStart: i, colon: text.slice(keyEnd, valueStart), valueStart, valueEnd });
    i = skipWs(text, valueEnd);
    if (text[i] === ',') i = skipWs(text, i + 1);
  }
  return { open, close: i, list };
}

/** The whitespace a line of `text` starts with, for the line holding `at`. */
function indentAt(text: string, at: number): string {
  const start = text.lastIndexOf('\n', at - 1) + 1;
  return /^[ \t]*/.exec(text.slice(start))![0];
}

/** The elements of the array spanning `[start, end)`: where each begins and ends. */
function elements(text: string, start: number, end: number): { s: number; e: number }[] {
  const out: { s: number; e: number }[] = [];
  let i = skipWs(text, start + 1);
  while (i < end - 1 && text[i] !== ']') {
    const e = skipValue(text, i);
    out.push({ s: i, e });
    i = skipWs(text, e);
    if (text[i] === ',') i = skipWs(text, i + 1);
  }
  return out;
}

/**
 * Insert each of `lines` that no list of `json.reads` names into the file's
 * `json.key` list, in its text. A line the key list already names is skipped
 * silently; one another list names is the human's, and is returned in
 * `skipped` with that list — `exclude` wins over `include` and
 * `deprioritize`, so an append there overrode what the human wrote. Where the
 * file holds the key more than once, the last occurrence, which JSON.parse and
 * the tool keep.
 *
 * - `''` or whitespace (the caller passes `''` for no file): the file created,
 *   two-space indented, one line per entry — 38 bytes for `/.brain/`.
 * - A multi-line list: `,`, the file's line ending, the previous element's
 *   indentation and the quoted line, after its last element. An inline list:
 *   `, "<line>"` after its last element. An empty one: the lines inside it.
 * - The key absent: a new member after the last top-level member — or inside
 *   an empty object — at the top-level members' indentation, never a nested
 *   one's, its list inline.
 * - Not JSON (comments, a BOM included), not an object, or a key whose value
 *   is not a list of strings: `ok: false` and why; nothing is inserted, and
 *   the tool ignores that file too.
 */
export function spliceJsonList(raw: string, json: { key: string; reads: string[] }, lines: string[]): SpliceResult {
  const want = [...new Set(lines)];
  if (raw.trim() === '') {
    if (want.length === 0) return { ok: true, text: raw, added: [], skipped: [] };
    const items = want.map((l) => `    ${JSON.stringify(l)}`).join(',\n');
    return { ok: true, text: `{\n  ${JSON.stringify(json.key)}: [\n${items}\n  ]\n}\n`, added: want, skipped: [] };
  }
  if (raw.charCodeAt(0) === 0xfeff) return { ok: false, why: 'it starts with a byte order mark' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { ok: false, why: `it is not JSON (${(e as Error).message})` };
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, why: 'it is not an object' };
  }
  const value = (parsed as Record<string, unknown>)[json.key];
  const has = Object.prototype.hasOwnProperty.call(parsed, json.key);
  if (has && !(Array.isArray(value) && value.every((e) => typeof e === 'string'))) {
    return { ok: false, why: `its ${JSON.stringify(json.key)} is not a list of strings` };
  }
  // The key list first, so a line it names is skipped silently even where
  // another list names it too.
  const order = [json.key, ...json.reads.filter((r) => r !== json.key)];
  const added: string[] = [];
  const skipped: { line: string; list: string }[] = [];
  for (const line of want) {
    const list = namedBy(parsed, order, line);
    if (list === undefined) added.push(line);
    else if (list !== json.key) skipped.push({ line, list });
  }
  if (added.length === 0) return { ok: true, text: raw, added, skipped };
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const quoted = added.map((l) => JSON.stringify(l));
  const { open, close, list } = members(raw);
  let at: number;
  let insert: string;
  const own = [...list].reverse().find((m) => m.key === json.key);
  if (own) {
    const els = elements(raw, own.valueStart, own.valueEnd);
    const last = els[els.length - 1];
    if (!last) {
      at = own.valueStart + 1;
      insert = quoted.join(', ');
    } else if (raw.slice(own.valueStart, own.valueEnd).includes('\n')) {
      const indent = indentAt(raw, last.s);
      at = last.e;
      insert = quoted.map((q) => `,${eol}${indent}${q}`).join('');
    } else {
      at = last.e;
      insert = quoted.map((q) => `, ${q}`).join('');
    }
  } else {
    const last = list[list.length - 1];
    const multi = raw.slice(open, close).includes('\n');
    const colon = last && !last.colon.includes('\n') ? last.colon : ': ';
    const member = `${JSON.stringify(json.key)}${colon}[${quoted.join(colon.endsWith(' ') ? ', ' : ',')}]`;
    if (!last) {
      at = open + 1;
      insert = multi ? `${eol}  ${member}` : member;
    } else if (multi) {
      at = last.valueEnd;
      insert = `,${eol}${indentAt(raw, last.keyStart)}${member}`;
    } else {
      at = last.valueEnd;
      insert = `,${colon.endsWith(' ') ? ' ' : ''}${member}`;
    }
  }
  return { ok: true, text: raw.slice(0, at) + insert + raw.slice(at), added, skipped };
}
