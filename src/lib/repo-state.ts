// MV-132. Two questions every surface that reports on a declared repo has to
// answer the same way: is this path the clone the config declares, and is a
// project document actually written. `repos`, `doctor` and the lifecycle each
// used to answer the first with "the directory exists" — measured on 0.13.0, a
// plain directory and a repo with no commit both read as `present`.

import { createHash } from 'node:crypto';
import { readdir, readFile, realpath, stat } from 'node:fs/promises';
import { join } from 'node:path';
import picomatch from 'picomatch';
import { parse } from 'yaml';
import { bodyGlobs, pathExists } from '../adapters/detect.js';
import { sddNames, sddSpec, type AdapterSpec, type SddProjectStep } from '../adapters/registry.js';
import { initState } from './init-state.js';
import { inHead, normUrl, run as git } from './git.js';
import type { RepoEntry } from '../types.js';

export type CloneState =
  | { state: 'cloned' }
  | { state: 'absent' }
  | { state: 'not-a-repo' }
  | { state: 'inside'; top: string }
  | { state: 'unborn' }
  | { state: 'remote-mismatch'; found: string[] };

/**
 * Is `dir` the clone `entry` declares? In order, and the first failing check
 * is the answer: the path exists; it is its own git toplevel, not a directory
 * inside another repository; HEAD resolves; and, when a url is declared, one of
 * its remotes is that url once normalized. The brain==code entry is the repo
 * this runs in, so it is cloned by definition. Offline: git's own answers only.
 */
export async function cloneState(entry: RepoEntry, dir: string): Promise<CloneState> {
  if (entry.isBrain) return { state: 'cloned' };
  if (!(await pathExists(dir))) return { state: 'absent' };
  const top = await git(dir, ['rev-parse', '--show-toplevel']).catch(() => null);
  if (top === null) return { state: 'not-a-repo' };
  const [realTop, realDir] = await Promise.all([realpath(top), realpath(dir)]);
  if (realTop !== realDir) return { state: 'inside', top: realTop };
  if ((await git(dir, ['rev-parse', '-q', '--verify', 'HEAD']).catch(() => null)) === null) return { state: 'unborn' };
  if (entry.url) {
    const remotes = (await git(dir, ['remote']).catch(() => '')).split('\n').filter(Boolean);
    const found: string[] = [];
    for (const r of remotes) {
      const url = await git(dir, ['remote', 'get-url', r]).catch(() => null);
      if (url) found.push(url);
    }
    if (!found.some((u) => normUrl(u) === normUrl(entry.url!))) return { state: 'remote-mismatch', found };
  }
  // Shallow is `readOnly`'s question (MV-125), asked by whoever needs it.
  return { state: 'cloned' };
}

/** The line a clone state earns when it is not `cloned`, with the fix. */
export function cloneFix(key: string, entry: RepoEntry, st: Exclude<CloneState, { state: 'cloned' }>): string {
  switch (st.state) {
    case 'absent':
      return entry.url
        ? `absent at ${entry.path} → \`multivac repos sync\``
        : `absent at ${entry.path}, no url → add \`url:\` under repos.${key}, or clone it there`;
    case 'not-a-repo':
      return `${entry.path} exists but is not a git repository`;
    case 'inside':
      return `${entry.path} is inside the repository at ${st.top}, not a clone of its own`;
    case 'unborn':
      return `${entry.path} is a repository with no commit (HEAD does not resolve)`;
    case 'remote-mismatch':
      return `${entry.path} has no remote matching ${entry.url} — found ${st.found.join(', ') || 'no remote'}`;
  }
}

export type DocVerdict = 'missing' | 'empty' | 'template' | 'written';

/**
 * MV-132. A project document is written only when it exists, holds something
 * beyond whitespace, and is not the template its tool shipped. An empty file
 * used to read as present.
 *
 * MV-135. The template is the tool's own: a file whose sha256 is the one the
 * tool recorded when it installed it, or one still carrying a token of the
 * template's vocabulary outside HTML comments. The pattern this replaced,
 * `\[[A-Z0-9_]+\]`, refused written documents citing `[1]` or `[API]`, and a
 * document that keeps the template's commented guidance is still written. A
 * report-only document is a YAML key instead. `why` says what decided.
 */
export async function projectDocVerdict(dir: string, doc: SddProjectStep): Promise<{ verdict: DocVerdict; why?: string }> {
  const path = join(dir, doc.artifact);
  const st = await stat(path).catch(() => null);
  if (!st || !st.isFile()) return { verdict: 'missing' };
  const bytes = await readFile(path).catch(() => null);
  if (bytes === null) return { verdict: 'missing', why: 'unreadable' };
  const text = bytes.toString('utf8');
  if (doc.reportOnly) {
    const { key, limit } = doc.reportOnly;
    let value: unknown;
    try {
      value = (parse(text) as Record<string, unknown> | null)?.[key];
    } catch {
      return { verdict: 'missing', why: `${doc.artifact} does not parse as YAML` };
    }
    if (typeof value !== 'string' || value.trim() === '') return { verdict: 'empty', why: `no \`${key}:\`` };
    if (Buffer.byteLength(value) > limit) return { verdict: 'empty', why: `\`${key}:\` is over ${limit} bytes, which the tool ignores` };
    return { verdict: 'written' };
  }
  if (text.trim() === '') return { verdict: 'empty' };
  if (doc.templateRecord) {
    const rec = await readFile(join(dir, doc.templateRecord), 'utf8')
      .then((r) => (JSON.parse(r) as { sha256?: unknown }).sha256, () => undefined);
    if (typeof rec === 'string' && createHash('sha256').update(bytes).digest('hex') === rec) {
      return { verdict: 'template', why: `byte-identical to the template recorded in ${doc.templateRecord}` };
    }
  }
  const prose = text.replace(/<!--[\s\S]*?-->/g, '');
  const token = (doc.placeholders ?? []).find((p) => prose.includes(p));
  if (token) return { verdict: 'template', why: `placeholders remain: ${token}` };
  return { verdict: 'written' };
}

/** A known SDD's install found in a code repo (MV-146). */
export interface Leftover {
  sdd: string;
  /** The vendor's state file found there, else its directory. */
  file: string;
  /** Whether HEAD holds it: removed by a commit, or by a delete alone. */
  tracked: boolean;
}

/**
 * MV-146. Every KNOWN SDD whose state in a code repo is not missing. A
 * top-level `sdd:` used to reach every declared repo and `repos sync` ran the
 * vendor's init in each; the SDD runs in the brain alone now, so what an
 * earlier release installed there is a leftover nothing reads. One answer for
 * `doctor` and `repos check`, which report it and never fail over it — and
 * removing it is not code (MV-137), for every known SDD, not only the brain's.
 * Files only, and git's own answer for tracked: no vendor is run.
 */
export async function leftoverSdds(dir: string): Promise<Leftover[]> {
  const out: Leftover[] = [];
  for (const sdd of sddNames) {
    const spec = sddSpec(sdd);
    if (!spec || (await initState(spec, dir)).state === 'missing') continue;
    let file = spec.state.dir ?? spec.state.files[0];
    for (const f of spec.state.files) {
      if (await pathExists(join(dir, f))) {
        file = f;
        break;
      }
    }
    out.push({ sdd, file, tracked: await inHead(dir, file) });
  }
  return out;
}

/** A vendor's command body an earlier init left in the brain (MV-147). */
export interface Body {
  /** The entry, repo-relative: `<dir>[/<sub>]/<name>`, or `<parent>/openspec-*` for collapsed siblings. */
  path: string;
  /**
   * true: the files under it that git tracks, removed by `git rm -r`; false:
   * the untracked ones, removed by a delete. An entry holding both is listed
   * once as each.
   */
  tracked: boolean;
}

/**
 * MV-147. The command bodies and skills a vendor's integration init wrote in
 * `dir` — the brain — once its scaffold installs none: every file git lists
 * there, tracked or untracked and not ignored, matching `bodyGlobs`, reduced to
 * the entry that holds it (the shortest leading path a body glob names). A
 * brain an earlier multivac scaffolded keeps them, and nothing prints them any
 * more, so `doctor` names them — and naming by the recorded names is all it
 * does: which of them a human put there on purpose is not on disk.
 *
 * Tracked and untracked are told apart because the removal differs: `git rm -r`
 * refuses a pathspec that matches no tracked file, so an entry holding both
 * is listed once as each. Two or more siblings under one parent sharing a
 * prefix the scaffold's `bodies.names` records as `<prefix>*` (opsx's
 * `openspec-`, `.openspec-` and `opsx-`) collapse to `<parent>/<prefix>*` —
 * the registry entry's names, so no vendor's naming lives here — but only
 * when every entry that glob reaches is in the same list: a shell
 * expanding it must hand `git rm -r` nothing untracked. What the glob reaches
 * is read off the disk, where the shell reads it: git lists neither an ignored
 * sibling nor an empty directory, and one of them in the expansion failed
 * `git rm -r` as a whole, removing nothing. Sorted, so the line is stable.
 * Files only, git's own answers and one directory listing, no vendor run
 * (MV-75); `[]` for a scaffold recording no `bodies`, and when git cannot
 * answer.
 */
export async function leftoverBodies(dir: string, spec: AdapterSpec): Promise<Body[]> {
  const globs = bodyGlobs(spec.scaffold);
  if (globs.length === 0) return [];
  // The collapse prefixes: each recorded name that ends in `-*`, less the
  // `*`, longest first, so a name takes the most specific one that fits.
  const prefixes = (spec.scaffold?.bodies?.names ?? [])
    .filter((n) => n.endsWith('-*'))
    .map((n) => n.slice(0, -1))
    .sort((a, b) => b.length - a.length);
  // The literal directories the globs sit under, so git lists only those.
  const literal = (g: string): string => {
    const segs = g.split('/');
    const wild = segs.findIndex((x) => /[*?[{]/.test(x));
    return segs.slice(0, wild < 0 ? segs.length : wild).join('/');
  };
  const roots = [...new Set(globs.map(literal))];
  const list = async (args: string[]): Promise<string[]> =>
    (await git(dir, ['ls-files', '-z', ...args, '--', ...roots])).split('\0').filter(Boolean);
  let tracked: string[];
  let untracked: string[];
  try {
    [tracked, untracked] = await Promise.all([list(['--cached']), list(['--others', '--exclude-standard'])]);
  } catch {
    return [];
  }
  const isBody = picomatch(globs, { dot: true });
  const isEntry = picomatch(globs.filter((g) => !g.endsWith('/**')), { dot: true });
  const entryOf = (file: string): string | null => {
    const segs = file.split('/');
    for (let k = 1; k <= segs.length; k++) {
      const p = segs.slice(0, k).join('/');
      if (isEntry(p)) return p;
    }
    return null;
  };
  // entry -> [has a tracked file, has an untracked file]
  const seen = new Map<string, [boolean, boolean]>();
  const note = (files: string[], i: 0 | 1): void => {
    for (const f of files) {
      if (!isBody(f)) continue;
      const e = entryOf(f);
      if (e === null) continue;
      const s = seen.get(e) ?? [false, false];
      s[i] = true;
      seen.set(e, s);
    }
  };
  note(tracked, 0);
  note(untracked, 1);
  const parentOf = (e: string): string => e.slice(0, e.lastIndexOf('/'));
  const nameOf = (e: string): string => e.slice(e.lastIndexOf('/') + 1);
  const out: Body[] = [];
  for (const [i, inGit] of [[0, true], [1, false]] as const) {
    const group = [...seen].filter(([, s]) => s[i]).map(([e]) => e);
    const inGroup = new Set(group);
    const done = new Set<string>();
    for (const e of group) {
      if (done.has(e)) continue;
      const parent = parentOf(e);
      const prefix = prefixes.find((x) => nameOf(e).startsWith(x));
      // Every entry the collapsed glob would reach, in either list — and on
      // disk, where the shell expands it, no other name.
      const siblings = prefix ? [...seen.keys()].filter((o) => parentOf(o) === parent && nameOf(o).startsWith(prefix)) : [];
      const reached =
        prefix && siblings.length >= 2
          ? ((await readdir(join(dir, parent)).catch(() => null)) ?? []).filter((n) => n.startsWith(prefix))
          : [];
      const exact = reached.length === siblings.length && reached.every((n) => siblings.includes(`${parent}/${n}`));
      if (siblings.length >= 2 && exact && siblings.every((o) => inGroup.has(o))) {
        for (const o of siblings) done.add(o);
        out.push({ path: `${parent}/${prefix}*`, tracked: inGit });
      } else {
        done.add(e);
        out.push({ path: e, tracked: inGit });
      }
    }
  }
  return out.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : Number(b.tracked) - Number(a.tracked)));
}
