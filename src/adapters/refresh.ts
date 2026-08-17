// Run a grapher's refresh in one directory. Execution only: this module
// never spawns git, so the refreshed artifact cannot be staged — graph
// output is regenerated locally and lands only in dedicated chore commits.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, rmdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { Config, GrapherDecl } from '../types.js';
import { grapherSpec, unverifiedGrapher } from './registry.js';
import { artifactPresent, binaryPresent, pathExists } from './detect.js';
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
 * Refresh the graph for one scope (the brain, or one declared repo) — or BUILD
 * it, where the scope has no artifact yet.
 *
 * The two are not the same command for every tool: an adapter may declare a
 * `create` that differs from its `refresh`, and `doctor` has always printed
 * `create ?? refresh` for a missing artifact and `refresh` for a stale one. The
 * runner asked neither question and always ran `refresh`, so the distinction
 * existed in the report and nowhere else (MV-87).
 *
 * An unverified grapher = the fields to declare, and nothing is run — a
 * derived command would be a guess. Absent binary = notice with the install
 * hint; a run that exits non-zero = warning handing the command back.
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
  // Per scope, like everything else about an adapter (MV-87): a graph is
  // missing HERE or it is not, and the answer decides which command runs.
  const first = !(await artifactPresent(spec, dir));
  const run = first ? (spec.create ?? spec.refresh) : spec.refresh;
  if (!(await binaryPresent(spec))) {
    say(
      `graph ${name} @ ${scope}: binary not found — ${first ? 'build' : 'refresh'} skipped; ` +
        `${spec.installHint}, then \`${run}\` there`,
    );
    return;
  }
  const label = `graph ${name} @ ${scope}`;
  const release = await takeLock(dir, label);
  const [bin, ...args] = run.split(' ');
  try {
    await execFileP(bin, args, { cwd: dir });
    say(`${label}: ${first ? 'built' : 'refreshed'} (\`${run}\`) — artifact left uncommitted`);
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
      `${label}: ${first ? 'build' : 'refresh'} failed (${said || err.message.split('\n')[0]}) — ` +
        `run \`${run}\` there by hand`,
    );
  } finally {
    await release?.();
  }
}

/** One scope a grapher may run in, with the tool that applies THERE. */
export interface GraphScope {
  scope: string;
  dir: string;
  name?: string;
}

/**
 * The brain plus every declared, present repo, each carrying the grapher that
 * applies to it — the per-scope override first, the ecosystem's otherwise.
 * The same list `doctor` reports over, so the report and the runner cannot
 * disagree about which scopes exist.
 */
export async function graphScopes(brain: string, cfg: Config): Promise<GraphScope[]> {
  const scopes: GraphScope[] = [{ scope: 'brain', dir: brain, name: cfg.grapher }];
  for (const [key, e] of Object.entries(cfg.repos)) {
    if (e.isBrain) continue; // already the brain
    const dir = resolve(brain, e.path);
    if (await pathExists(dir)) scopes.push({ scope: key, dir, name: e.grapher ?? cfg.grapher });
  }
  return scopes;
}

/**
 * Build the graph once in every declared, present scope that has none (MV-87).
 *
 * The graph was only ever built for repos a change happened to touch, so a
 * repo had to be worked on before it could be navigated — backwards for an
 * agent that reads the graph in order to do the work. `doctor` named the
 * command per repo and nothing ever ran it.
 *
 * Self-limiting, which is why the lifecycle can call it at more than one
 * point: a scope with an artifact is skipped, so this costs one `stat` per
 * scope on every run after the first, and a repo is built exactly once ever.
 * Refreshing an existing graph stays where it was — `change close`, over the
 * repos that change touched.
 */
export async function ensureGraphs(brain: string, cfg: Config): Promise<void> {
  for (const s of await graphScopes(brain, cfg)) {
    if (!s.name) continue; // no grapher declared for this scope: silence
    const spec = grapherSpec(s.name, cfg.graphers);
    // Unverified: `doctor` prints the fields to declare, and nothing is run.
    // Building from a guessed command is the one thing worse than no graph.
    if (spec === null) continue;
    if (await artifactPresent(spec, s.dir)) continue; // already built here
    await refreshGraph(s.name, s.dir, s.scope, cfg.graphers);
  }
}
