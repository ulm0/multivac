// Probe a repo/brain for adapter artifacts and binaries. Pure checks, no
// subprocess: fs existence, and one binary lookup over PATH and the root's
// node_modules/.bin (MV-123).

import { access, readdir, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { delimiter, join, resolve } from 'node:path';
import { doorTargets, type AdapterSpec } from './registry.js';
import type { Config, RepoEntry } from '../types.js';

export async function pathExists(p: string): Promise<boolean> {
  return access(p).then(
    () => true,
    () => false,
  );
}

/** True when any of the spec's artifact paths exists under `dir`. */
export async function artifactPresent(
  spec: AdapterSpec,
  dir: string,
): Promise<boolean> {
  for (const a of spec.artifacts) {
    if (await pathExists(join(dir, a))) return true;
  }
  return false;
}

/** One place an SDD artifact may live, named the way the operator names it. */
export interface SddRoot {
  /** The repo key, or `brain` for the brain itself. */
  scope: string;
  dir: string;
  /**
   * The adapter that applies HERE (MV-87), as `adapterFor` resolves it
   * (MV-122), and `undefined` when the root resolves none. Undefined is out of
   * scope, never deficient — no scaffold, no gate, no notice.
   */
  sdd?: string;
}

/**
 * The opt-out token, for `sdd:` and `grapher:` alike, at repo or top level
 * (MV-122). A value rather than a parse case, so `repoEntry` keeps the one
 * validator every repo key goes through. It cannot collide with a tool: the
 * registry names none this way, and `graphers.none` is refused at load.
 */
export const NO_ADAPTER = 'none';

/** What resolving needs of a config, and nothing more — `ritualSeed` passes init's flags. */
export interface AdapterDecls {
  sdd?: string;
  grapher?: string;
  repos?: Record<string, Partial<RepoEntry>>;
}

/**
 * MV-122. The one answer to "which adapter of this kind applies to this root":
 * the root's own entry first, the ecosystem's value otherwise, and `none` at
 * either level is no adapter at all. The brain root reads the declared entry
 * whose path is the brain (brain==code), so its override counts like any
 * repo's. Twelve functions used to answer this themselves, and they disagreed;
 * every surface asks here now, and nothing else reads the two keys to decide.
 */
export function adapterFor(
  cfg: AdapterDecls,
  root: string,
  kind: 'sdd' | 'grapher',
): string | undefined {
  const repos = cfg.repos ?? {};
  const own = root === 'brain' ? Object.values(repos).find((r) => r.isBrain) : repos[root];
  const name = own?.[kind] ?? cfg[kind];
  // An empty value names nothing, which every reader already treated as unset.
  return name && name !== NO_ADAPTER ? name : undefined;
}

/**
 * Every DECLARED root grouped by the adapter it resolves, in order of first
 * appearance: the brain first, then declared repos in config order, absent
 * ones included — renderers work from declarations (MV-93), runs from roots on
 * disk. A root resolving no adapter is in no group, so an empty map means no
 * root resolves one.
 */
export function adaptersByRoot(cfg: AdapterDecls, kind: 'sdd' | 'grapher'): Map<string, string[]> {
  const keys = Object.entries(cfg.repos ?? {}).filter(([, r]) => !r.isBrain).map(([k]) => k);
  const groups = new Map<string, string[]>();
  for (const root of ['brain', ...keys]) {
    const name = adapterFor(cfg, root, kind);
    if (name !== undefined) groups.set(name, [...(groups.get(name) ?? []), root]);
  }
  return groups;
}

/**
 * Every directory an SDD tool's files may live in: the brain plus each
 * declared, present, non-brain repo. A gate that only looked in the brain
 * would refuse a change whose specs live in the code repo — and one that
 * searched them all silently would refuse without saying where it looked, so
 * each root carries the name the config gave it.
 *
 * Each root also carries the adapter that applies to it, from `adapterFor`
 * (MV-122), so no caller re-derives it differently.
 */
export async function sddRoots(brain: string, cfg: Config): Promise<SddRoot[]> {
  const roots: SddRoot[] = [{ scope: 'brain', dir: brain, sdd: adapterFor(cfg, 'brain', 'sdd') }];
  for (const [key, e] of Object.entries(cfg.repos)) {
    if (e.isBrain) continue; // already the brain
    const d = resolve(brain, e.path);
    if (await pathExists(d)) roots.push({ scope: key, dir: d, sdd: adapterFor(cfg, key, 'sdd') });
  }
  return roots;
}

/**
 * Every path under `root` that proves `rel`. `<n>` stands for one run of
 * digits and nothing else — spec-kit numbers its feature directory
 * (`specs/003-user-auth/`), openspec dates its archive (`2026-08-19-<slug>`)
 * — so the exact name is unknowable in advance but its SHAPE is not. The one
 * segment carrying `<n>` is matched by readdir, and `[0-9]+` cannot cross the
 * `-` separator, which is what ends the tail match MV-110 measured:
 * `^.*-expire$` took `030-points-expire`, so slug `expire` was proved by
 * another feature's directory. `*` is gone from this language rather than
 * merely unused — a wildcard that can swallow `030-points` IS the syntax the
 * defect was made of — and a stray star now matches a literal star.
 *
 * ALL hits come back, sorted. Choosing among several is a refusal the GATE
 * owes the operator by name: a probe that took the first in sort order let an
 * older foreign directory shadow the right one, silently.
 */
export async function artifactHit(root: string, rel: string): Promise<string[]> {
  if (!rel.includes('<n>')) return (await pathExists(join(root, rel))) ? [rel] : [];
  const parts = rel.split('/');
  const i = parts.findIndex((s) => s.includes('<n>'));
  const re = new RegExp(
    `^${parts[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replaceAll('<n>', '[0-9]+')}$`,
  );
  const parent = join(root, ...parts.slice(0, i));
  const rest = parts.slice(i + 1);
  const hits: string[] = [];
  for (const name of (await readdir(parent).catch(() => [])).sort()) {
    if (!re.test(name)) continue;
    if (await pathExists(join(parent, name, ...rest))) {
      hits.push([...parts.slice(0, i), name, ...rest].join('/'));
    }
  }
  return hits;
}

/**
 * True when `bin` is executable on PATH — the hook shim's `command -v`, in Node.
 * For multivac's own runner ladder (MV-92), the pre-commit framework and the
 * tracker CLIs, none of which is an adapter binary. An adapter's binary is
 * `findBinary`'s to find.
 */
export async function onPath(bin: string): Promise<boolean> {
  for (const dir of (process.env.PATH ?? '').split(delimiter)) {
    if (!dir) continue;
    const ok = await access(join(dir, bin), constants.X_OK).then(
      () => true,
      () => false,
    );
    if (ok) return true;
  }
  return false;
}

/** What the lookup reads of the environment. Explicit, so win32 is testable anywhere. */
export interface BinEnv {
  platform: string;
  PATH?: string;
  PATHEXT?: string;
}

/** A root's project-local install directory: where `npm i -D` puts a tool. */
export const localBin = (root: string): string => join(root, 'node_modules', '.bin');

/**
 * MV-123. The one lookup for an SDD or grapher binary: the absolute path of
 * the first executable regular file among PATH's non-empty entries in order,
 * then `root`'s own node_modules/.bin, or null. Two rules used to answer this
 * and disagreed: the validator looked in node_modules/.bin, and `doctor`,
 * `doors`, the refresh and the graph gate never did.
 *
 * On win32 each name is tried with PATHEXT's extensions, in its order, as
 * spelled and then lower-cased; node reads X_OK as F_OK there, so `specify.exe`
 * never matched `specify`. Elsewhere PATHEXT is ignored. Ceiling: never run on
 * win32, and node spawns a `.cmd` found this way only through a shell.
 */
export async function findBinary(
  bin: string,
  root: string,
  env: BinEnv = { platform: process.platform, PATH: process.env.PATH, PATHEXT: process.env.PATHEXT },
): Promise<string | null> {
  const win = env.platform === 'win32';
  // A relative PATH entry is taken from `root`, where the command runs, as a
  // shell there would take it; so the path returned is the file executed.
  const base = resolve(root);
  const dirs = [...(env.PATH ?? '').split(win ? ';' : ':').filter(Boolean), localBin(base)];
  const exts = win ? (env.PATHEXT ?? '').split(';').filter(Boolean) : [];
  const names = exts.length === 0 ? [bin] : [...new Set(exts.flatMap((e) => [bin + e, bin + e.toLowerCase()]))];
  for (const dir of dirs) {
    for (const name of names) {
      const p = resolve(base, dir, name);
      const file = await stat(p).then((s) => s.isFile(), () => false);
      if (file && (await access(p, constants.X_OK).then(() => true, () => false))) return p;
    }
  }
  return null;
}

/** The spec's `required` binaries this root cannot find, in declared order. Empty = runnable. */
export async function missingRequired(spec: Pick<AdapterSpec, 'required'>, root: string) {
  const missing: string[] = [];
  for (const bin of spec.required) {
    if ((await findBinary(bin, root)) === null) missing.push(bin);
  }
  return missing;
}

export interface Detected {
  doors: string[];
  sdd?: string;
  grapher?: string;
}

/**
 * Init-time proposal probe (design: "Detect before asking"): artifact
 * directories on disk -> config names. Config selects registry entries by
 * name, so the sdd name here is the registry key (opsx), not the tool's.
 */
export async function detectAdapters(dir: string): Promise<Detected> {
  const has = (p: string): Promise<boolean> => pathExists(join(dir, p));
  const d: Detected = { doors: [] };
  if (await has('openspec')) d.sdd = 'opsx';
  else if (await has('.specify')) d.sdd = 'speckit';
  if (await has('graphify-out')) d.grapher = 'graphify';
  else if (await has('.codegraph')) d.grapher = 'codegraph';
  // Door proposals come from the registry's own `detect` paths — a new
  // harness is an entry there, never a branch here.
  for (const [name, t] of Object.entries(doorTargets)) {
    if (t.detect && (await has(t.detect))) d.doors.push(name);
  }
  return d;
}
