// Read-only git helpers. execFile, never a shell. Never walk the tree:
// file enumeration is `git ls-files`.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';

const execFileP = promisify(execFile);

/**
 * Git's own env overrides `-C`. A hook runs with GIT_DIR and GIT_INDEX_FILE
 * pointing at the repo being committed, so every sibling repo we inspect would
 * be read through *that* repo's index — reporting the whole ecosystem as
 * untracked. `-C` is the only thing that may choose the repo, so the ambient
 * pointers are dropped for the child.
 */
const AMBIENT_GIT_ENV = [
  'GIT_DIR',
  'GIT_INDEX_FILE',
  'GIT_WORK_TREE',
  'GIT_COMMON_DIR',
  'GIT_OBJECT_DIRECTORY',
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
  'GIT_PREFIX',
] as const;

function cleanEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  for (const key of AMBIENT_GIT_ENV) delete env[key];
  return env;
}

/** Run git in a repo, return trimmed stdout. Throws with stderr on failure. */
export async function run(repo: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileP('git', ['-C', repo, ...args], {
      maxBuffer: 64 * 1024 * 1024,
      env: cleanEnv(),
    });
    return stdout.replace(/\n$/, '');
  } catch (e) {
    const err = e as { stderr?: string; message: string };
    throw new Error(
      `git ${args[0]} failed in ${repo}: ${err.stderr?.trim() || err.message}`,
    );
  }
}

/** Tracked files, repo-relative, /-separated. */
export async function lsFiles(repo: string): Promise<string[]> {
  const out = await run(repo, ['ls-files', '-z']);
  return out.split('\0').filter(Boolean);
}

/**
 * Untracked, non-ignored files, repo-relative. Only ever a hint: a glob that
 * matches nothing tracked but hits one of these means `git add`, not a broken
 * glob.
 */
export async function untrackedFiles(repo: string): Promise<string[]> {
  const out = await run(repo, ['ls-files', '-z', '--others', '--exclude-standard']);
  return out.split('\0').filter(Boolean);
}

export async function headSha(repo: string): Promise<string> {
  return run(repo, ['rev-parse', 'HEAD']);
}

/** Upstream of HEAD, or null when none is configured. */
export async function remoteTrackingRef(
  repo: string,
): Promise<{ name: string; sha: string } | null> {
  try {
    const name = await run(repo, [
      'rev-parse',
      '--abbrev-ref',
      '--symbolic-full-name',
      '@{u}',
    ]);
    const sha = await run(repo, ['rev-parse', '@{u}']);
    return { name, sha };
  } catch {
    return null;
  }
}

/** Ms since last fetch (mtime of .git/FETCH_HEAD), or null if never fetched. */
export async function lastFetchAge(repo: string): Promise<number | null> {
  const gitDir = await run(repo, ['rev-parse', '--absolute-git-dir']);
  try {
    const s = await stat(join(gitDir, 'FETCH_HEAD'));
    return Date.now() - s.mtimeMs;
  } catch {
    return null;
  }
}

/** Sha of a gitlink (submodule entry) at HEAD for `path`, or null. */
export async function lsTreeGitlink(
  repo: string,
  path: string,
): Promise<string | null> {
  const out = await run(repo, ['ls-tree', 'HEAD', '--', path]).catch(() => '');
  const m = out.match(/^160000 commit ([0-9a-f]{40})\t/m);
  return m ? m[1] : null;
}
