// One question, asked in three places: do these two paths name the same tree?
// `.`, `..` and symlinks all reach one directory under different spellings,
// and a directory counted twice double-counts every anchor over it.

import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';

/** Resolved, symlink-free path. Falls back to the literal path when absent. */
export function realPath(p: string): string {
  try {
    return realpathSync(resolve(p));
  } catch {
    return resolve(p);
  }
}

/** True when both paths name one directory on disk. */
export const samePath = (a: string, b: string): boolean => realPath(a) === realPath(b);
