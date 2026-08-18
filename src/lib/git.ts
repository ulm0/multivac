// Read-only git helpers. execFile, never a shell. Never walk the tree:
// file enumeration is `git ls-files`.

import { execFile, spawn } from 'node:child_process';
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

/**
 * The one line of git's stderr worth showing.
 *
 * git puts the CAUSE in its `fatal:` line and then keeps talking — hints,
 * "Please make sure you have the correct access rights", "and the repository
 * exists." Taking the last line therefore reports a sentence fragment of
 * advice as if it were the error, and taking all of it buries the cause in a
 * paragraph. First `fatal:`, falling back to the last line for the commands
 * that fail without one.
 */
export function gitFailure(stderr: string | undefined, fallback: string): string {
  const lines = (stderr ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.find((l) => l.startsWith('fatal:')) ?? lines.at(-1) ?? fallback;
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
      `git ${args[0]} failed in ${repo}: ${gitFailure(err.stderr, err.message)}`,
    );
  }
}

/**
 * Tracked files, repo-relative, /-separated, each exactly once.
 *
 * The dedupe is not tidiness. During an unresolved merge git keeps three index
 * entries for every conflicted path — base, ours, theirs — and `ls-files`
 * prints one line per stage. Every match inside such a file was therefore
 * counted three times, so a `count=2` leg reported `found 6` and advised
 * "revert the new occurrence, or ratchet to count=6". Following that would
 * have written a corrupted number into the law, over a merge that had nothing
 * to do with the claim. A miscount that arrives with confident advice is worse
 * than a crash.
 *
 * `--deduplicate` is git's own answer, there since 2.31; the Set behind it
 * costs nothing and keeps this correct on older git.
 */
export async function lsFiles(repo: string): Promise<string[]> {
  const out = await run(repo, ['ls-files', '-z', '--deduplicate']);
  return [...new Set(out.split('\0').filter(Boolean))];
}

/**
 * Paths with unresolved merge conflicts, repo-relative. Empty is the norm.
 *
 * A verdict taken mid-merge is about a tree that does not exist yet: some
 * files are one side, some the other, and none of it is what will be
 * committed. verify says so instead of quietly judging it.
 */
export async function unmergedFiles(repo: string): Promise<string[]> {
  const out = await run(repo, ['diff', '--name-only', '--diff-filter=U', '-z']).catch(() => '');
  return [...new Set(out.split('\0').filter(Boolean))];
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

/** Tracked files at a ref, repo-relative, /-separated. The ls-files of a tree. */
export async function lsTree(repo: string, ref: string): Promise<string[]> {
  const out = await run(repo, ['ls-tree', '-r', '-z', '--name-only', '--full-tree', ref]);
  return out.split('\0').filter(Boolean);
}

/**
 * Blob text for `paths` at `ref`, in ONE `git cat-file --batch` process — the
 * whole reason a ref-scoped scan keeps the sub-second budget: `git show` per
 * file would spawn one process per glob hit. Missing paths, gitlinks and
 * anything not a blob come back absent; binary (NUL in the first 8KB) comes
 * back null, the same rule the working-tree read applies.
 */
export async function catFileBlobs(
  repo: string,
  ref: string,
  paths: string[],
): Promise<Map<string, string | null>> {
  const out = new Map<string, string | null>();
  // --batch is newline-delimited on stdin: a path containing one cannot be
  // asked for. Vanishingly rare, and "unreadable" is the honest answer.
  const wanted = paths.filter((p) => !p.includes('\n'));
  if (wanted.length === 0) return out;
  const chunks: Buffer[] = [];
  const child = spawn('git', ['-C', repo, 'cat-file', '--batch'], {
    env: cleanEnv(),
    stdio: ['pipe', 'pipe', 'ignore'],
  });
  child.stdout.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<void>((ok, ko) => {
    child.on('error', ko);
    child.on('close', () => ok());
  });
  child.stdin.on('error', () => {}); // EPIPE if git died first: `close` reports
  child.stdin.end(wanted.map((p) => `${ref}:${p}\n`).join(''));
  await done;
  // Responses come back in the order asked: "<oid> <type> <size>\n<bytes>\n",
  // or "<input> missing\n" (also "ambiguous"/"dangling" — anything but a
  // header with a size is a skip).
  const buf = Buffer.concat(chunks);
  let at = 0;
  for (const p of wanted) {
    const nl = buf.indexOf(10, at);
    if (nl < 0) break;
    const header = buf.subarray(at, nl).toString('utf8');
    at = nl + 1;
    const m = header.match(/^[0-9a-f]{40,} (\w+) (\d+)$/);
    if (!m) continue; // missing / not an object — leave it absent
    const size = Number(m[2]);
    const body = buf.subarray(at, at + size);
    at += size + 1; // git writes a trailing newline after the payload
    if (m[1] !== 'blob') continue;
    out.set(p, body.subarray(0, 8192).includes(0) ? null : body.toString('utf8'));
  }
  return out;
}

export async function headSha(repo: string): Promise<string> {
  return run(repo, ['rev-parse', 'HEAD']);
}

/** Resolved commit sha for `rev`, or null when the ref does not exist here. */
export async function revParse(repo: string, rev: string): Promise<string | null> {
  return run(repo, ['rev-parse', '--verify', '--quiet', `${rev}^{commit}`]).catch(() => null);
}

/** Branch HEAD is on, or null when detached (or not a repo). */
export async function currentBranch(repo: string): Promise<string | null> {
  const name = await run(repo, ['symbolic-ref', '--short', '--quiet', 'HEAD']).catch(() => null);
  return name || null;
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

/**
 * The subset of `paths` git would ignore in `repo`. The paths need not exist:
 * check-ignore answers for what a write there WOULD do — which is the whole
 * point, init asks before writing. Exit 1 (nothing ignored) and exit 128
 * (not a repo) both come back as "nothing ignored".
 */
/**
 * Is `path` in `repo`'s index — tracked, whatever its working-tree state.
 *
 * `ls-files --error-unmatch` is the question asked as a question: it exits
 * non-zero for a path git does not track, which is the answer, not a failure.
 */
export async function isTracked(repo: string, path: string): Promise<boolean> {
  return run(repo, ['ls-files', '--error-unmatch', '--', path]).then(
    () => true,
    () => false,
  );
}

export async function ignoredPaths(
  repo: string,
  paths: string[],
): Promise<string[]> {
  try {
    // No -z: check-ignore refuses it without --stdin. The paths asked about
    // are multivac's own constants — no newlines to be confused by.
    const out = await run(repo, ['check-ignore', '--', ...paths]);
    return out.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}
