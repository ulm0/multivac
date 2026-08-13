// Evaluate one leg's matching against one repo checkout. Files come from
// `git ls-files` only — never a tree walk — filtered by the anchor's globs.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { lsFiles } from '../lib/git.js';
import { filterFiles } from '../lib/glob.js';
import { compileAnchorRegex } from '../lib/regex.js';
import { sqlStatements } from './normalize.js';
import type { Anchor } from '../types.js';

export interface Match {
  file: string;
  line: number;
}

/** Caches ls-files and file text per repo checkout for one verify run. */
export class RepoScanner {
  private list?: Promise<string[]>;
  private texts = new Map<string, Promise<string | null>>();

  constructor(readonly dir: string) {}

  files(): Promise<string[]> {
    this.list ??= lsFiles(this.dir);
    return this.list;
  }

  /** File text, or null for binary (NUL in first 8KB) or unreadable files. */
  read(file: string): Promise<string | null> {
    let p = this.texts.get(file);
    if (!p) {
      p = readFile(join(this.dir, file)).then(
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
 * per-line otherwise. Anchor comment lines never match — an anchor's own
 * regex text must not satisfy (or break) another anchor.
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
    if (lines[i].includes('@anchor')) continue;
    if (re.test(lines[i])) out.push({ file, line: i + 1 });
  }
  return out;
}

export interface LegScan {
  /** Files surviving include + excludes. Empty = vacuous glob. */
  globFiles: string[];
  matches: Match[];
}

/** Evaluate one leg's glob + regex against one repo checkout. */
export async function scanLeg(anchor: Anchor, scanner: RepoScanner): Promise<LegScan> {
  const globFiles = filterFiles(await scanner.files(), anchor.include, anchor.excludes);
  const re = compileAnchorRegex(anchor.regexSource, anchor.regexFlags);
  const matches: Match[] = [];
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
export async function scanWholeRepo(anchor: Anchor, scanner: RepoScanner): Promise<Match[]> {
  const re = compileAnchorRegex(anchor.regexSource, anchor.regexFlags);
  const out: Match[] = [];
  for (const f of filterFiles(await scanner.files(), '**', anchor.excludes)) {
    const text = await scanner.read(f);
    if (text !== null) out.push(...matchesInFile(f, text, re));
  }
  return out;
}
