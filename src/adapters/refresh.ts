// Run a grapher's refresh in one directory. Execution only: this module
// never spawns git, so the refreshed artifact cannot be staged here — the
// lifecycle commits a shared one from change.ts, on the change's branch at
// `land` (MV-134).
// Which roots are read-only is asked of `readOnly` (MV-125), whose one git
// read lives in src/lib/git.ts and asks, never stages.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, rmdir, writeFile } from 'node:fs/promises';
import { delimiter, dirname, join, resolve } from 'node:path';
import type { Config, GrapherDecl } from '../types.js';
import { binaryMissing, grapherSpec, unverifiedGrapher, type AdapterSpec } from './registry.js';
import { ignoredPaths } from '../lib/git.js';
import { adapterFor, adaptersByRoot, localBin, missingRequired, pathExists, readOnly, type ReadOnly } from './detect.js';
import { initState } from '../lib/init-state.js';
import { GRAPH_LOCK } from '../doors/settings.js';
import { CONFIG_PATH } from '../lib/config.js';
import { quoteFailure, say, warn } from '../lib/out.js';

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
 * The one way a grapher's declared command runs: through a shell (MV-115), in
 * the root, with the entry's opt-outs over the inherited environment (MV-124)
 * and the root's node_modules/.bin reachable after PATH (MV-123).
 */
async function runDeclared(spec: AdapterSpec, run: string, dir: string): Promise<void> {
  await execFileP('sh', ['-c', run], {
    cwd: dir,
    env: { ...process.env, ...spec.env, PATH: [process.env.PATH, localBin(dir)].filter(Boolean).join(delimiter) },
  });
}

/**
 * Refresh the graph for one scope (the brain, or one declared repo) — or BUILD
 * it, where the vendor is not installed there yet (MV-124): missing, or a
 * partial graph such as a 0-byte `graph.json` or a codegraph clone whose
 * `.codegraph/` holds no database. A graph is derived from the tree, so
 * rebuilding a partial one loses nothing. An unevaluable root gets neither.
 *
 * The two are not the same command for every tool: an adapter may declare a
 * `create` that differs from its `refresh`, and `doctor` has always printed
 * `create ?? refresh` for a missing artifact and `refresh` for a stale one. The
 * runner asked neither question and always ran `refresh`, so the distinction
 * existed in the report and nowhere else (MV-87).
 *
 * An unverified grapher = the fields to declare, and nothing is run — a
 * derived command would be a guess. A required binary not found = notice
 * naming it, the install line and the vendor; a run that exits non-zero =
 * warning quoting the tool's cause and handing the command back.
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
  // installed HERE or it is not, and the answer decides which command runs.
  const st = await initState(spec, dir);
  if (st.state === 'unevaluable') {
    warn(`graph ${name} @ ${scope}: build and refresh skipped — ${st.reason}`);
    return;
  }
  const first = st.state !== 'installed';
  const run = first ? (spec.create ?? spec.refresh) : spec.refresh;
  // MV-123: the one lookup, in this scope's own checkout.
  const missing = await missingRequired(spec, dir);
  if (missing.length > 0) {
    say(
      `graph ${name} @ ${scope}: ${first ? 'build' : 'refresh'} skipped — ${binaryMissing(name, spec, missing, scope)}, ` +
        `then \`${run}\` there`,
    );
    return;
  }
  const label = `graph ${name} @ ${scope}`;
  const release = await takeLock(dir, label);
  try {
    // MV-115: a shell, because the declared command's OTHER runner already is
    // one — the harness post-edit hook embeds this same string raw in a `sh`
    // line (src/doors/settings.ts). `split(' ')` made a quoted argument, a
    // redirect or an `&&` work after an edit and break at close: one declared
    // string, two dialects. The string is the operator's, so it means what a
    // shell says it means, everywhere.
    //
    // Ceiling: a declared grapher's `required` is the FIRST WORD of its
    // refresh unless it declares `binary:`, so a command beginning with `env`
    // or a variable assignment is looked up by the wrong name (MV-115).
    //
    // MV-123: the shell reaches this scope's node_modules/.bin after PATH, the
    // second place the lookup above found the binary in — so what runs is what
    // was found, and a copy on PATH still wins. MV-124: the entry's opt-outs
    // over the inherited environment, outside the declared command.
    await runDeclared(spec, run, dir);
    say(`${label}: ${first ? 'built' : 'refreshed'} (\`${run}\`) — ${spec.artifactKind === 'local' ? 'local artifact, never committed' : 'artifact left uncommitted'}`);
  } catch (e) {
    // The tool's cause, not node's `Command failed: <cmd>`, which only repeats
    // the command this line prints again, and not the tool's first lines, which
    // for graphify 0.9.29 are a traceback header and a path on this machine.
    // The one quote the scaffold and the validator get too (MV-123).
    const err = e as { stderr?: string; stdout?: string; message: string };
    const said = quoteFailure(err);
    warn(`${label}: ${first ? 'build' : 'refresh'} failed (${said}) — run \`${run}\` there by hand`);
  } finally {
    await release?.();
  }
}

/** One scope a grapher may run in, with the tool that applies THERE. */
export interface GraphScope {
  scope: string;
  dir: string;
  name?: string;
  /** Why multivac may not write here, from `readOnly` (MV-125); absent when it may. */
  readOnly?: ReadOnly;
}

/**
 * The brain plus every declared repo on disk — or, given `only`, the brain
 * plus those of them a change names (MV-134) — each carrying the grapher that
 * applies to it — resolved by `adapterFor` for every root, the brain's own
 * entry included, and undefined where the root resolves `none` (MV-122) —
 * and whether it is read-only (MV-125). The same list `doctor` reports over,
 * so the report and the runner cannot disagree about which scopes exist; the
 * build, the refresh and both gates skip a read-only one.
 */
export async function graphScopes(brain: string, cfg: Config, only?: string[]): Promise<GraphScope[]> {
  const scopes: GraphScope[] = [{ scope: 'brain', dir: brain, name: adapterFor(cfg, 'brain', 'grapher') }];
  for (const [key, e] of Object.entries(cfg.repos)) {
    if (e.isBrain) continue; // already the brain
    if (only && !only.includes(key)) continue; // a repo the change does not name
    const dir = resolve(brain, e.path);
    if (!(await pathExists(dir))) continue;
    const why = await readOnly(cfg, key, dir);
    scopes.push({ scope: key, dir, name: adapterFor(cfg, key, 'grapher'), ...(why ? { readOnly: why } : {}) });
  }
  return scopes;
}

/**
 * Build the graph once in every scope on disk that has none and that
 * multivac may write in (MV-87, MV-125).
 *
 * The graph was only ever built for repos a change happened to touch, so a
 * repo had to be worked on before it could be navigated — backwards for an
 * agent that reads the graph in order to do the work. `doctor` named the
 * command per repo and nothing ever ran it.
 *
 * Self-limiting, which is why the lifecycle can call it at more than one
 * point: a scope the probe finds installed is skipped (MV-124), so this costs
 * one probe per scope on every run after the first, and a repo is built once
 * unless its graph is lost or left partial.
 * Refreshing an existing graph stays where it was — `change close`, over the
 * repos that change touched.
 */

/**
 * MV-128. Before a graph's first build, the lines that keep it worth reading:
 * the grapher's own ignore file keeps multivac's and the SDD's scaffolding out
 * of the graph, and `.gitignore` keeps the per-checkout outputs out of git while
 * the shared artifact stays in. Without them the first graph of a fresh brain
 * was mostly vendor skills and templates (measured on graphify 0.9.29, see the
 * registry entry), and seven outputs sat untracked beside the one to commit.
 *
 * Appended, never rewritten: a line already present is left, and every other
 * line is the user's. An existing rule can still ignore the shared artifact —
 * `graphify-out/` ignores the directory, and git cannot re-include a file under
 * an excluded directory — so that is said, never fixed by editing their line.
 */
async function writeIgnores(
  name: string,
  spec: AdapterSpec,
  dir: string,
  scope: string,
  before = 'the first build',
): Promise<void> {
  const wrote: string[] = [];
  const targets: [string | undefined, string[]][] = [
    [spec.graphignoreFile, spec.graphignore ?? []],
    ['.gitignore', spec.ignore],
  ];
  for (const [file, lines] of targets) {
    if (!file || lines.length === 0) continue;
    const path = join(dir, file);
    const text = await readFile(path, 'utf8').catch(() => '');
    const have = new Set(text.split('\n').map((l) => l.trim()));
    const add = lines.filter((l) => !have.has(l));
    if (add.length === 0) continue;
    const sep = text === '' || text.endsWith('\n') ? '' : '\n';
    await writeFile(path, `${text}${sep}${add.join('\n')}\n`);
    wrote.push(`${file} (+${add.length})`);
  }
  if (wrote.length > 0) say(`graph ${name} @ ${scope}: wrote ${wrote.join(' and ')} before ${before}`);
  if (spec.artifactKind !== 'shared') return;
  for (const shared of await ignoredPaths(dir, spec.shared)) {
    warn(
      `graph ${name} @ ${scope}: ${shared} is ignored by a rule already in this repo, so it cannot be committed — ` +
        `\`git check-ignore -v ${shared}\` names the rule`,
    );
  }
}


/**
 * MV-131. Absolute paths to `bin` in hook commands, rewritten to the bare name.
 * A versioned hook that names `/Users/<user>/.local/bin/graphify` works on one
 * machine; the bare name is found on PATH everywhere, the same way multivac's
 * own hooks name `mvac` (MV-115). Only a path ending in `/<bin>` followed by a
 * space is touched, so a string that merely mentions the tool is left alone.
 */
export function bareBinary(text: string, bin: string): string {
  const esc = bin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(["'\\s])/[^"'\\s]*/${esc}(?= )`, 'g'), `$1${bin}`);
}

/**
 * MV-131. The grapher's own project install, per declared door, in every
 * writable root that lacks it. graphify ships one per harness — a skill, a
 * rule, hooks — and nothing ran it, so a declared grapher reached no agent but
 * through multivac's door. Measured on graphify 0.9.29 (see the registry).
 *
 * After the first build, because the install tells the agent to query a graph
 * that should already exist. A door with no measured platform is named and
 * skipped. The hooks it writes are rewritten to the bare binary name.
 */
export async function installHarness(brain: string, cfg: Config, only?: string[]): Promise<void> {
  for (const s of await graphScopes(brain, cfg, only)) {
    if (!s.name || s.readOnly) continue;
    const spec = grapherSpec(s.name, cfg.graphers);
    const h = spec?.harness;
    if (!spec || !h) continue;
    // Only over a graph that is there: the install points every agent at it,
    // and a root whose graph is missing or unreadable is the build's to report.
    if ((await initState(spec, s.dir)).state !== 'installed') continue;
    const label = `graph ${s.name} @ ${s.scope}`;
    const todo: string[] = [];
    for (const door of cfg.doors) {
      const p = h.platforms[door];
      if (!p) {
        warn(`${label}: ${door} has no ${s.name} platform — its own install is not run for it`);
        continue;
      }
      if (!(await pathExists(join(s.dir, p.probe)))) todo.push(p.key);
    }
    if (todo.length === 0) continue;
    const missing = await missingRequired(spec, s.dir);
    if (missing.length > 0) {
      say(`${label}: harness install not run — ${binaryMissing(s.name, spec, missing, s.scope)}`);
      continue;
    }
    await writeIgnores(s.name, { ...spec, graphignore: [], ignore: h.ignore }, s.dir, s.scope, 'its first project install');
    for (const key of todo) {
      const run = h.run.replace('{key}', key);
      try {
        await runDeclared(spec, run, s.dir);
        say(`${label}: installed into ${key} (\`${run}\`)`);
      } catch (e) {
        warn(`${label}: \`${run}\` failed (${quoteFailure(e as { stderr?: string; stdout?: string; message: string })}) — run it there by hand`);
      }
    }
    const bin = spec.required[0];
    for (const f of h.hookFiles) {
      const path = join(s.dir, f);
      const text = await readFile(path, 'utf8').catch(() => null);
      if (text === null) continue;
      const bare = bareBinary(text, bin);
      if (bare === text) continue;
      await writeFile(path, bare);
      say(`${label}: ${f} named ${bin} by an absolute path — rewritten to \`${bin}\`, found on PATH`);
    }
  }
}

export async function ensureGraphs(brain: string, cfg: Config, only?: string[]): Promise<void> {
  for (const s of await graphScopes(brain, cfg, only)) {
    if (!s.name) continue; // no grapher resolves for this scope: silence
    if (s.readOnly) continue; // not multivac's to write (MV-125): silence
    const spec = grapherSpec(s.name, cfg.graphers);
    // Unverified: `doctor` prints the fields to declare, and nothing is run.
    // Building from a guessed command is the one thing worse than no graph.
    if (spec === null) continue;
    if ((await initState(spec, s.dir)).state === 'installed') continue; // already built here
    // Only where the build will run: a missing binary writes nothing here and
    // refreshGraph says why.
    if ((await missingRequired(spec, s.dir)).length === 0) await writeIgnores(s.name, spec, s.dir, s.scope);
    await refreshGraph(s.name, s.dir, s.scope, cfg.graphers);
  }
}

export interface GateResult {
  ok: boolean;
  lines: string[];
}

/**
 * MV-90. A declared grapher leaves a graph in every declared root on disk that
 * is not read-only (MV-125), or `change close` refuses.
 *
 * Declaring `grapher: graphify` used to oblige nothing. The SDD adapter has
 * been gated at both ends since MV-56 — `plan` refuses without the spec,
 * `apply` without the plan and the tasks — so declaring an SDD tool MEANS
 * something. Every grapher failure path was a notice that kept going, so a
 * change could close with four declared repos ungraphed and say nothing. That
 * is how the ecosystem this tool was measured against ended up with a declared
 * grapher and five repos that never had a graph: MV-87 made the adapter REACH
 * every root, not reaching them REQUIRED.
 *
 * The cost is invisible by design, which is exactly why it needs a gate: the
 * door tells every agent to ask the graph before reading the tree, so a
 * missing graph does not fail — it degrades into agents grepping, which looks
 * like working.
 *
 * Build first, then judge: `ensureGraphs` is self-limiting, so the first close
 * in a fresh ecosystem builds rather than refuses. A gate that refuses what it
 * could have fixed teaches people to route around it.
 *
 * Existence, never freshness — and existence is the probe's installed
 * (MV-124), so a 0-byte or truncated graph is not one. Currency would have to
 * be defined — mtime? content hash? tracked files newer than the artifact? —
 * and every definition
 * is wrong for some adapter and wrong on a fresh clone, where everything is
 * newer than everything. Claiming existence and checking existence is
 * Principle II satisfied.
 *
 * `close` only: MV-01 keeps verify/doctor/doors offline and free of foreign
 * subprocesses, and this gate lets one run.
 */
export async function graphGate(
  brain: string,
  cfg: Config,
  slug: string,
  noGrapher: boolean,
  only?: string[],
): Promise<GateResult> {
  if (adaptersByRoot(cfg, 'grapher').size === 0) {
    return { ok: true, lines: [] }; // no declared root resolves a grapher: silence
  }
  if (noGrapher || !cfg.grapherAuto) {
    // Silence about a skipped check is the failure this gate exists to end.
    const why = noGrapher ? '--no-grapher' : 'grapher_auto: false';
    return {
      ok: true,
      lines: [`graph: gate ${noGrapher ? 'skipped' : 'off'} (${why}) — a root without a graph will not be reported`],
    };
  }
  // Build where not installed before judging. Idempotent and self-limiting: an
  // installed root costs one probe.
  await ensureGraphs(brain, cfg, only);

  const missing: string[] = [];
  const unevaluable: string[] = [];
  const lines: string[] = [];
  for (const s of await graphScopes(brain, cfg, only)) {
    const spec = s.name === undefined ? null : grapherSpec(s.name, cfg.graphers);
    // Unverified is out of scope, not a gap: demanding an artifact whose path
    // would have to be guessed is Principle V's invented integration wearing a
    // gate's clothes. `doctor` already prints the fields to declare.
    if (s.name === undefined || spec === null) continue;
    // Read-only is out of scope too (MV-125): the only fix would be a build
    // where multivac may not write, so the root is not judged and not named.
    if (s.readOnly) continue;
    // Installed passes. Missing or partial refuses as no graph; a state file
    // that cannot be read, or a binary not found, refuses as unable to be checked.
    const st = await initState(spec, s.dir);
    if (st.state === 'installed') continue;
    const bins = await missingRequired(spec, s.dir);
    const create = spec.create ?? spec.refresh;
    if (st.state === 'unevaluable') {
      unevaluable.push(`  ${s.scope}: cannot be checked — ${st.reason}`);
    } else if (bins.length > 0) {
      unevaluable.push(`  ${s.scope}: ${binaryMissing(s.name, spec, bins, s.scope)}, then \`${create}\` there`);
    } else {
      // A local artifact is never committed (MV-103, as amended), so the only
      // place it can come from is a build in the checkout that closes.
      const local = spec.artifactKind === 'local' ? ' — a local artifact is built in each checkout' : '';
      missing.push(`  ${s.scope}: ${st.state === 'partial' ? st.reason : `no ${spec.artifacts[0]}`} — \`${create}\` there${local}`);
    }
  }
  if (missing.length === 0 && unevaluable.length === 0) return { ok: true, lines };

  // Every offending root in ONE message: nobody should have to close
  // repeatedly to discover the rest of the list.
  const n = missing.length + unevaluable.length;
  lines.push(
    `graph: \`change close ${slug}\` refused — ${n} root${n > 1 ? 's' : ''} ` +
      `${unevaluable.length > 0 && missing.length === 0 ? 'cannot be checked' : 'have no graph'}`,
  );
  lines.push(...missing, ...unevaluable);
  lines.push(
    `  or skip the gate without losing the tool: \`--no-grapher\` for one run, ` +
      `\`grapher_auto: false\` in ${CONFIG_PATH} for good`,
  );
  return { ok: false, lines };
}
