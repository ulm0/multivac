// Run a grapher's refresh in one directory. Execution only: this module
// never spawns git, so the refreshed artifact cannot be staged — graph
// output is regenerated locally and lands only in dedicated chore commits.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, rmdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { GrapherDecl } from '../types.js';
import { grapherSpec, unverifiedGrapher } from './registry.js';
import { binaryPresent } from './detect.js';
import { GRAPH_LOCK } from '../doors/settings.js';
import { say, warn } from '../lib/out.js';

const execFileP = promisify(execFile);

/** How long close waits on a refresh already running, and how often it looks. */
const WAIT_MS = 60_000;
const POLL_MS = 250;

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * Take the SAME lock the post-edit hook takes, in that scope's own checkout —
 * `mkdir` of a directory, the one atomic create both a shell hook and node
 * agree on. Two graphers over one directory corrupt each other's output;
 * before this, `change close` and an in-flight hook refresh were measured
 * running 73ms apart on the same tree.
 *
 * Where the hook SKIPS, close WAITS: the hook's edit is already covered by
 * the refresh that holds the lock, but close is the net for edits made
 * outside a harness, so skipping would leave the graph stale with nobody
 * left to refresh it. After `WAIT_MS` it proceeds anyway and says so — a
 * bounded wait cannot tell a live refresh from a lock left by a killed
 * process, and blocking a close forever on that guess is worse than the
 * overlap it avoids.
 *
 * Returns the release function, or null when the wait ran out (nothing to
 * release: the lock belongs to whoever still holds it).
 */
async function takeLock(dir: string, label: string): Promise<(() => Promise<void>) | null> {
  const lock = join(dir, GRAPH_LOCK);
  await mkdir(dirname(lock), { recursive: true }).catch(() => {});
  const deadline = Date.now() + WAIT_MS;
  for (;;) {
    try {
      await mkdir(lock); // non-recursive: EEXIST is the whole signal
      return () => rmdir(lock).catch(() => {});
    } catch {
      if (Date.now() >= deadline) {
        warn(
          `${label}: another refresh has held ${GRAPH_LOCK} for ${WAIT_MS / 1000}s — ` +
            'refreshing anyway; if the graph looks wrong, rerun the refresh once nothing else is writing',
        );
        return null;
      }
      await sleep(POLL_MS);
    }
  }
}

/**
 * Refresh the graph for one scope (the brain, or one declared repo).
 * An unverified grapher = the fields to declare, and nothing is run — a
 * derived command would be a guess. Absent binary = notice with the install
 * hint; a refresh that exits non-zero = warning handing the command back.
 * Never throws: a foreign tool's failure is never the lifecycle's failure.
 */
export async function refreshGraph(
  name: string,
  dir: string,
  scope: string,
  decls: Record<string, GrapherDecl> = {},
): Promise<void> {
  const spec = grapherSpec(name, decls);
  if (spec === null) {
    warn(`graph @ ${scope}: ${unverifiedGrapher(name)}`);
    return;
  }
  if (!(await binaryPresent(spec))) {
    say(
      `graph ${name} @ ${scope}: binary not found — refresh skipped; ` +
        `${spec.installHint}, then \`${spec.refresh}\` there`,
    );
    return;
  }
  const label = `graph ${name} @ ${scope}`;
  const release = await takeLock(dir, label);
  const [bin, ...args] = spec.refresh.split(' ');
  try {
    await execFileP(bin, args, { cwd: dir });
    say(`${label}: refreshed (\`${spec.refresh}\`) — artifact left uncommitted`);
  } catch (e) {
    // The TOOL'S words, not node's. `Command failed: <cmd>` only repeats the
    // command this very line prints again two clauses later, while the cause
    // the tool wrote to stderr — depcruise's ENOENT, a parse error, a missing
    // config — was thrown away. Same three-line quote `toolVerdict` gives a
    // validator (src/adapters/sdd.ts).
    const err = e as { stderr?: string; stdout?: string; message: string };
    const said = `${err.stderr ?? ''}${err.stdout ?? ''}`
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(' ');
    warn(
      `${label}: refresh failed (${said || err.message.split('\n')[0]}) — ` +
        `run \`${spec.refresh}\` there by hand`,
    );
  } finally {
    await release?.();
  }
}
