// MV-132. Two questions every surface that reports on a declared repo has to
// answer the same way: is this path the clone the config declares, and is a
// project document actually written. `repos`, `doctor` and the lifecycle each
// used to answer the first with "the directory exists" — measured on 0.13.0, a
// plain directory and a repo with no commit both read as `present`.

import { createHash } from 'node:crypto';
import { readFile, realpath, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';
import { pathExists } from '../adapters/detect.js';
import type { SddProjectStep } from '../adapters/registry.js';
import { normUrl, run as git } from './git.js';
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
