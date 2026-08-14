// picomatch wrappers. Paths come from `git ls-files` — always /-separated,
// repo-relative. dot:true so `**` sees dotfiles like .multivac/config.yml.

import picomatch from 'picomatch';
import type { Exclusion } from '../types.js';

const OPTS = { dot: true };

/**
 * The exclusion globs that bite in the checkout known by `keys` (every
 * registry key naming that one directory — aliases included). Bare
 * exclusions bite everywhere, and so does an explicit `*` qualifier;
 * a qualified one bites only where its key names the checkout.
 */
export function excludeGlobs(excludes: Exclusion[], keys: Iterable<string>): string[] {
  const known = new Set(keys);
  return excludes
    .filter((e) => e.repoKey === undefined || e.repoKey === '*' || known.has(e.repoKey))
    .map((e) => e.glob);
}

/** Matcher for one include glob minus an exclusion list. */
export function makeMatcher(
  include: string,
  excludes: string[] = [],
): (file: string) => boolean {
  const inc = picomatch(include, OPTS);
  const exc = excludes.map((g) => picomatch(g, OPTS));
  return (file) => inc(file) && !exc.some((m) => m(file));
}

/** Files surviving include + excludes. Zero survivors = vacuous glob. */
export function filterFiles(
  files: string[],
  include: string,
  excludes: string[] = [],
): string[] {
  return files.filter(makeMatcher(include, excludes));
}
