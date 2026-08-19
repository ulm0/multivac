// Anchor grammar parsing + brain collection. A malformed anchor is a
// diagnostic naming file:line and the exact defect — never a silent skip.

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CHANGES_DIR, LAW_PATH } from '../lib/config.js';
import { compileAnchorRegex, RegexDialectError } from '../lib/regex.js';
import type { Anchor, Exclusion, Mode } from '../types.js';

export interface ParseDiagnostic {
  file: string;
  line: number;
  message: string;
}

export interface ParseResult {
  anchors: Anchor[];
  diagnostics: ParseDiagnostic[];
}

/**
 * The opener of an anchor comment. The ONE definition of that shape,
 * deliberately shared: `parseAnchors` below uses it to decide a line is trying
 * to declare a leg, and `matchesInFile` uses it as the first half of deciding a
 * line contributes no matches. Two private copies of the shape is how MV-82's
 * defect happened — the scanner tested for the bare substring `@anchor`, so any
 * line of any file that merely mentioned the word went unscanned and a trailing
 * comment silenced any tombstone.
 *
 * What is shared is the PATTERN, not the verdict, and the difference matters:
 * this module only ever sees the handful of .md files `collectBrainAnchors`
 * reads, while the scanner sees every tracked file in every declared repo, so
 * the set of lines the reader calls anchors is a strict subset of the set the
 * scanner hides. Sharing the pattern keeps the two from disagreeing about the
 * SHAPE; it cannot make the two sets equal, and nothing here claims it does.
 *
 * Neither caller accepts the opener alone. `parseAnchors` refuses an
 * unterminated one, and `matchesInFile` requires the same `-->` before it will
 * hide a line.
 *
 * No `g` flag: a stateful literal would make one line's verdict depend on the
 * line tested before it.
 */
export const ANCHOR_LINE = /<!--\s*@anchor\b/;

const GRAMMAR =
  '<!-- @anchor <CLAIM-ID> <repo>:<glob> [![<repo>:]<glob> ...] /<regex>/[i] [present|absent|unique|count=N|each|each!] -->';

/** The glob dialect, named wherever a glob is rejected — it is not shell. */
const GLOB_DIALECT =
  'globs are picomatch patterns over repo-relative paths: `**` crosses directories, ' +
  '`{a,b}` alternates, and dotfiles match';

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
    if (!ANCHOR_LINE.test(raw)) continue;
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
      bad(
        `"${repoSpec || '(nothing)'}" is not <repo>:<glob> — add the repo key, a colon, and the glob; ` +
          GLOB_DIALECT,
      );
      continue;
    }
    const repoKey = repoSpec.slice(0, colon);
    const include = repoSpec.slice(colon + 1);
    const excludes: Exclusion[] = [];
    let malformed = false;
    while (rest.startsWith('!')) {
      let tok: string;
      [tok, rest] = nibble(rest);
      if (tok === '!') {
        bad(`empty !exclusion — remove the bare "!" or attach a glob to it; ${GLOB_DIALECT}`);
        malformed = true;
        break;
      }
      // Same shape as the include spec: the first colon separates the repo
      // qualifier from the glob. Bare stays bare — repo-relative everywhere.
      const g = tok.slice(1);
      const cut = g.indexOf(':');
      if (cut === -1) {
        excludes.push({ glob: g });
      } else if (cut === 0 || cut === g.length - 1) {
        bad(`"${tok}" is not !<repo>:<glob> — put a repo key before the colon and a glob after it`);
        malformed = true;
        break;
      } else {
        excludes.push({ repoKey: g.slice(0, cut), glob: g.slice(cut + 1) });
      }
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
    let negated: boolean | undefined;
    if (modeTok !== undefined) {
      const cnt = modeTok.match(/^count=(\d+)$/);
      if (cnt) {
        mode = 'count';
        count = Number(cnt[1]);
      } else if (modeTok === 'each' || modeTok === 'each!') {
        // The universal quantifier. `!` negates the predicate — the same
        // sigil that negates a glob in exclusions — one token, so the mode
        // slot stays a single word and the rejects stay loud.
        mode = 'each';
        negated = modeTok === 'each!';
      } else if (modeTok === 'present' || modeTok === 'absent' || modeTok === 'unique') {
        mode = modeTok;
      } else {
        bad(`unknown mode "${modeTok}" — use present, absent, unique, count=N, each or each!`);
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
      negated,
      file,
      line,
    });
  }
  return { anchors, diagnostics };
}

/**
 * Collect anchors from the brain: every .md at the root (the user's own
 * content may carry anchors) plus multivac's own — `.multivac/*.md`
 * (invariants.md) and `.multivac/changes/*.md`. Anchor.file is brain-relative.
 */
export async function collectBrainAnchors(brainDir: string): Promise<ParseResult> {
  const rels: string[] = [];
  for (const dir of ['.', '.multivac', CHANGES_DIR]) {
    try {
      for (const e of await readdir(join(brainDir, dir), { withFileTypes: true })) {
        if (e.isFile() && e.name.endsWith('.md')) {
          rels.push(dir === '.' ? e.name : join(dir, e.name));
        }
      }
    } catch {
      // directory not there yet — fine
    }
  }
  const result: ParseResult = { anchors: [], diagnostics: [] };
  for (const rel of rels.sort()) {
    const r = parseAnchors(await readFile(join(brainDir, rel), 'utf8'), rel);
    result.anchors.push(...r.anchors);
    result.diagnostics.push(...r.diagnostics);
  }
  return result;
}

/**
 * One law-table row: `| id | statement | authority | state | date | source |`.
 *
 * Every consumer of the table reads THIS shape — `verify`'s enactment and
 * death checks, its gating predicate, `change`'s id reservation, the brain
 * door's count. There were three parsers of it before MV-119 and they
 * disagreed, which is the whole reason the fields live in one place.
 */
export interface ClaimRow {
  id: string;
  statement: string;
  authority: string;
  state: string;
  date: string;
  source: string;
}

/** Parse the law table out of invariants.md text. Empty text = zero claims. */
export function parseClaimRows(text: string): ClaimRow[] {
  const rows: ClaimRow[] = [];
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t.startsWith('|')) continue;
    if (/^[|\s:-]+$/.test(t)) continue; // separator row
    // Untrimmed, because the statement is rejoined below and a trim per piece
    // would eat the spaces around the pipe it quotes.
    const raw = t.split('|');
    const cells = raw.map((c) => c.trim());
    const id = cells[1] ?? '';
    if (!id || id === 'ID') continue;
    // MV-119. The trailing columns are counted from the END. The statement is
    // prose about a command-line tool, so it quotes `||` and `2>&1 |`, and
    // every such pipe used to move the four columns after it — `cells[4]` read
    // the authority cell for MV-108 and read prose for MV-112, so both rows
    // enacted invisibly and were deletable in silence. A date and a markdown
    // link have no syntax for a pipe, so the end is the one edge that holds.
    // Below six columns nothing is claimed: an incomplete row must not read a
    // neighbour's cell as its state.
    if (cells.length < 8) {
      rows.push({ id, statement: '', authority: '', state: '', date: '', source: '' });
      continue;
    }
    rows.push({
      id,
      // What is left once both ends are known — rejoined, because a body that
      // contains a pipe was split by one.
      statement: raw.slice(2, -5).join('|').trim(),
      authority: cells[cells.length - 5] ?? '',
      state: cells[cells.length - 4] ?? '',
      date: cells[cells.length - 3] ?? '',
      source: cells[cells.length - 2] ?? '',
    });
  }
  return rows;
}

/**
 * Parse the law table in .multivac/invariants.md. Missing file = zero claims.
 *
 * The parse itself lives in `parseClaimRows` because MV-81 reads the same
 * table out of two git blobs — HEAD's and the index's — that are not files on
 * disk. A second parser of the law table is how the two would eventually
 * disagree about what a row's state is.
 */
export async function readClaimRows(brainDir: string): Promise<ClaimRow[]> {
  try {
    return parseClaimRows(await readFile(join(brainDir, LAW_PATH), 'utf8'));
  } catch {
    return [];
  }
}
