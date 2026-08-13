// picomatch wrappers. Paths come from `git ls-files` — always /-separated,
// repo-relative. dot:true so `**` sees dotfiles like .multivac/config.yml.

import picomatch from 'picomatch';

const OPTS = { dot: true };

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
