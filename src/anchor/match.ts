// Evaluate one leg's matching against one repo checkout — or against one ref
// in it. Files come from `git ls-files` (working tree) or `git ls-tree` (ref)
// only — never a tree walk — filtered by the anchor's globs.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { catFileBlobs, lsFiles, lsTree, untrackedFiles } from '../lib/git.js';
import { excludeGlobs, filterFiles } from '../lib/glob.js';
import { compileAnchorRegex } from '../lib/regex.js';
import { sqlStatements } from './normalize.js';
import { ANCHOR_LINE } from './parse.js';
import type { Anchor } from '../types.js';

export interface Match {
  file: string;
  line: number;
}

/**
 * Caches the file list and file text of one repo for one verify run — of its
 * working tree, or of one ref in it when `ref` is set. Which of the two is not
 * this class's judgement: the caller resolves it and the report says it out
 * loud, because a verdict whose bytes are a mystery is the defect itself.
 */
export class RepoScanner {
  private list?: Promise<string[]>;
  private others?: Promise<string[]>;
  private texts = new Map<string, Promise<string | null>>();

  constructor(
    readonly dir: string,
    readonly ref?: string,
  ) {}

  files(): Promise<string[]> {
    this.list ??= this.ref ? lsTree(this.dir, this.ref) : lsFiles(this.dir);
    return this.list;
  }

  /**
   * Untracked, non-ignored files. Read only when a glob comes up empty, and
   * only for a working tree: a ref has no untracked side, so the `git add`
   * hint would be about bytes this run never looked at.
   */
  untracked(): Promise<string[]> {
    if (this.ref) return Promise.resolve([]);
    this.others ??= untrackedFiles(this.dir);
    return this.others;
  }

  /**
   * Warm the text cache for `files` in one shot. Free for a working tree;
   * for a ref it is the batch that keeps the budget — one `git cat-file`
   * process instead of one `git show` per file.
   */
  async prefetch(files: string[]): Promise<void> {
    if (!this.ref) return;
    const want = files.filter((f) => !this.texts.has(f));
    if (want.length === 0) return;
    const blobs = await catFileBlobs(this.dir, this.ref, want);
    for (const f of want) this.texts.set(f, Promise.resolve(blobs.get(f) ?? null));
  }

  /** File text, or null for binary (NUL in first 8KB) or unreadable files. */
  read(file: string): Promise<string | null> {
    let p = this.texts.get(file);
    if (!p) {
      p = this.ref
        ? catFileBlobs(this.dir, this.ref, [file]).then((b) => b.get(file) ?? null)
        : readFile(join(this.dir, file)).then(
            (buf) => (buf.subarray(0, 8192).includes(0) ? null : buf.toString('utf8')),
            () => null,
          );
      this.texts.set(file, p);
    }
    return p;
  }
}

/**
 * Matches of `re` in one file: per-statement for *.sql (normalized),
 * per-line otherwise. A line carrying a COMPLETE anchor comment never matches —
 * an anchor's own regex text must not satisfy (or break) another anchor, and
 * the law table, the change files, DESIGN.md, the guide page teaching the
 * grammar and this suite's own fixtures all quote whole anchors.
 *
 * MV-82: complete means both halves — the shared `ANCHOR_LINE` opener, the same
 * pattern `parseAnchors` uses to decide a line is trying to declare a leg, AND
 * the `-->` terminator that same parser demands before it will accept one. The
 * skip is never the substring `@anchor`, and never the opener alone: an opener
 * with no terminator is not an anchor to the reader either — `parseAnchors`
 * refuses it as `unterminated anchor comment` — so the scanner must not treat
 * it as one. That gap is what made `// <!-- @anchor` (and `<!--@anchor`, and a
 * tab, and `<!-- @anchor.`, and the opener inside a plain or template string)
 * silence a leg on any line of any file type.
 *
 * Ceiling, and it is a real one: a FULLY forged `<!-- @anchor ... -->` inside a
 * source comment or a string literal still hides its line. No test on a line's
 * shape can tell a forged instruction from a quoted one — the fixtures in
 * `test/verify/` quote whole anchors inside string literals and MUST stay
 * hidden, and they are byte-identical in shape to a forgery.
 */
export function matchesInFile(file: string, text: string, re: RegExp): Match[] {
  const out: Match[] = [];
  if (file.endsWith('.sql')) {
    for (const s of sqlStatements(text)) {
      if (re.test(s.text)) out.push({ file, line: s.line });
    }
    return out;
  }
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (ANCHOR_LINE.test(lines[i]) && lines[i].includes('-->')) continue;
    if (re.test(lines[i])) out.push({ file, line: i + 1 });
  }
  return out;
}

export interface LegScan {
  /** Files surviving include + excludes. Empty = vacuous glob. */
  globFiles: string[];
  matches: Match[];
}

/**
 * Evaluate one leg's glob + regex against one repo checkout. `keys` is every
 * registry key naming that checkout: a repo-qualified exclusion bites only
 * when it names this one.
 */
export async function scanLeg(
  anchor: Anchor,
  scanner: RepoScanner,
  keys: Iterable<string>,
): Promise<LegScan> {
  const globFiles = filterFiles(
    await scanner.files(),
    anchor.include,
    excludeGlobs(anchor.excludes, keys),
  );
  const re = compileAnchorRegex(anchor.regexSource, anchor.regexFlags);
  const matches: Match[] = [];
  await scanner.prefetch(globFiles);
  for (const f of globFiles) {
    const text = await scanner.read(f);
    if (text !== null) matches.push(...matchesInFile(f, text, re));
  }
  return { globFiles, matches };
}

/**
 * Whole-repo search (moved detection): every tracked text file except the
 * leg's !excludes — rewriting the glob to an excluded file would loop forever.
 */
export async function scanWholeRepo(
  anchor: Anchor,
  scanner: RepoScanner,
  keys: Iterable<string>,
): Promise<Match[]> {
  const re = compileAnchorRegex(anchor.regexSource, anchor.regexFlags);
  const out: Match[] = [];
  const all = filterFiles(await scanner.files(), '**', excludeGlobs(anchor.excludes, keys));
  await scanner.prefetch(all);
  for (const f of all) {
    const text = await scanner.read(f);
    if (text !== null) out.push(...matchesInFile(f, text, re));
  }
  return out;
}
