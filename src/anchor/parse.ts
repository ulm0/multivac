// Anchor grammar parsing + brain collection. A malformed anchor is a
// diagnostic naming file:line and the exact defect — never a silent skip.

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { compileAnchorRegex, RegexDialectError } from '../lib/regex.js';
import type { Anchor, Mode } from '../types.js';

export interface ParseDiagnostic {
  file: string;
  line: number;
  message: string;
}

export interface ParseResult {
  anchors: Anchor[];
  diagnostics: ParseDiagnostic[];
}

const GRAMMAR =
  '<!-- @anchor <CLAIM-ID> <repo>:<glob> [!<glob> ...] /<regex>/[i] [present|absent|unique|count=N] -->';

/** First whitespace-delimited token + the rest. */
const nibble = (s: string): [string, string] => {
  const m = s.match(/^(\S+)\s*/);
  return m ? [m[1], s.slice(m[0].length)] : ['', s];
};

/** Scan text for @anchor comment lines. `file` is echoed into results. */
export function parseAnchors(text: string, file: string): ParseResult {
  const anchors: Anchor[] = [];
  const diagnostics: ParseDiagnostic[] = [];
  const lines = text.split('\n');
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = i + 1;
    // Fenced code blocks are documentation, not law: an example anchor in a
    // ``` fence must never parse as a live anchor (found dogfooding on DESIGN.md).
    if (/^\s*(```|~~~)/.test(raw)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    // 4-space indent is a CommonMark code block; real anchors are flush-left.
    if (/^ {4,}/.test(raw)) continue;
    const bad = (message: string): void => {
      diagnostics.push({ file, line, message });
    };
    if (/^@anchor\b/.test(raw.trim())) {
      bad(`anchor is not an HTML comment — write: ${GRAMMAR}`);
      continue;
    }
    if (!/<!--\s*@anchor\b/.test(raw)) continue;
    const cm = raw.match(/<!--\s*@anchor\s+(.*?)\s*-->/);
    if (!cm) {
      bad(`unterminated anchor comment — write it on one line: ${GRAMMAR}`);
      continue;
    }
    let rest = cm[1];
    let claimId: string;
    [claimId, rest] = nibble(rest);
    if (!claimId || claimId.startsWith('/') || claimId.includes(':')) {
      bad(`missing claim id before the repo spec — ${GRAMMAR}`);
      continue;
    }
    let repoSpec: string;
    [repoSpec, rest] = nibble(rest);
    const colon = repoSpec.indexOf(':');
    if (colon <= 0 || colon === repoSpec.length - 1) {
      bad(`"${repoSpec || '(nothing)'}" is not <repo>:<glob> — add the repo key, a colon, and the glob`);
      continue;
    }
    const repoKey = repoSpec.slice(0, colon);
    const include = repoSpec.slice(colon + 1);
    const excludes: string[] = [];
    let malformed = false;
    while (rest.startsWith('!')) {
      let tok: string;
      [tok, rest] = nibble(rest);
      if (tok === '!') {
        bad('empty !exclusion — remove the bare "!" or attach a glob to it');
        malformed = true;
        break;
      }
      excludes.push(tok.slice(1));
    }
    if (malformed) continue;
    const rm = rest.match(/^\/(.*)\/([a-zA-Z]*)(?:\s+(\S+))?$/);
    if (!rm) {
      bad(`missing or malformed /regex/ — ${GRAMMAR}`);
      continue;
    }
    const [, regexSource, regexFlags, modeTok] = rm;
    try {
      compileAnchorRegex(regexSource, regexFlags);
    } catch (e) {
      if (e instanceof RegexDialectError) {
        bad(e.message);
        continue;
      }
      throw e;
    }
    let mode: Mode = 'present';
    let count: number | undefined;
    if (modeTok !== undefined) {
      const cnt = modeTok.match(/^count=(\d+)$/);
      if (cnt) {
        mode = 'count';
        count = Number(cnt[1]);
      } else if (modeTok === 'present' || modeTok === 'absent' || modeTok === 'unique') {
        mode = modeTok;
      } else {
        bad(`unknown mode "${modeTok}" — use present, absent, unique or count=N`);
        continue;
      }
    }
    anchors.push({
      claimId,
      repoKey,
      include,
      excludes,
      regexSource,
      regexFlags,
      mode,
      count,
      file,
      line,
    });
  }
  return { anchors, diagnostics };
}

/**
 * Collect anchors from the brain: every .md at the root (invariants.md
 * included) plus changes/*.md. Anchor.file is brain-relative.
 */
export async function collectBrainAnchors(brainDir: string): Promise<ParseResult> {
  const rels: string[] = [];
  for (const e of await readdir(brainDir, { withFileTypes: true })) {
    if (e.isFile() && e.name.endsWith('.md')) rels.push(e.name);
  }
  try {
    for (const e of await readdir(join(brainDir, 'changes'), { withFileTypes: true })) {
      if (e.isFile() && e.name.endsWith('.md')) rels.push(join('changes', e.name));
    }
  } catch {
    // no changes/ yet — fine
  }
  const result: ParseResult = { anchors: [], diagnostics: [] };
  for (const rel of rels.sort()) {
    const r = parseAnchors(await readFile(join(brainDir, rel), 'utf8'), rel);
    result.anchors.push(...r.anchors);
    result.diagnostics.push(...r.diagnostics);
  }
  return result;
}

/** One law-table row, as far as verify cares: the join key and lifecycle state. */
export interface ClaimRow {
  id: string;
  state: string;
}

/** Parse the law table in invariants.md. Missing file = zero claims. */
export async function readClaimRows(brainDir: string): Promise<ClaimRow[]> {
  let text: string;
  try {
    text = await readFile(join(brainDir, 'invariants.md'), 'utf8');
  } catch {
    return [];
  }
  const rows: ClaimRow[] = [];
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t.startsWith('|')) continue;
    if (/^[|\s:-]+$/.test(t)) continue; // separator row
    const cells = t.split('|').map((c) => c.trim());
    const id = cells[1] ?? '';
    if (!id || id === 'ID') continue;
    rows.push({ id, state: cells[4] ?? '' });
  }
  return rows;
}
