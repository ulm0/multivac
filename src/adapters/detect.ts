// Probe a repo/brain for adapter binaries and step artifacts. Checks, no
// subprocess of their own: fs existence, one binary lookup over PATH and the
// root's node_modules/.bin (MV-123), and one read-only git question asked
// through src/lib/git.ts — is this sibling's clone shallow (MV-125). Whether a
// vendor is initialised is not asked here: `initState` in
// src/lib/init-state.ts reads its state files (MV-124).

import { access, readdir, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { delimiter, join, resolve } from 'node:path';
import { doorTargets, sddNames, sddSpec, type AdapterSpec, type SddScaffold } from './registry.js';
import { isShallow, run as gitRun } from '../lib/git.js';
import type { Config, RepoEntry } from '../types.js';

export async function pathExists(p: string): Promise<boolean> {
  return access(p).then(
    () => true,
    () => false,
  );
}

/** One place an SDD artifact may live, named the way the operator names it. */
export interface SddRoot {
  /** The repo key, or `brain` for the brain itself. */
  scope: string;
  /**
   * MV-146. The config key naming this root's change worktree: the repo key,
   * and for the brain the key of the entry that is the brain, `brain` when the
   * brain is no declared entry. `scope` says `brain` for a brain==code entry
   * keyed `core`, whose worktree is `.multivac/worktrees/<slug>/core`.
   */
  key: string;
  dir: string;
  /**
   * The adapter that applies HERE (MV-87), as `adapterFor` resolves it
   * (MV-122), and `undefined` when the root resolves none. Undefined is out of
   * scope, never deficient — no scaffold, no gate, no notice.
   */
  sdd?: string;
  /** Why multivac may not write here, from `readOnly` (MV-125); absent when it may. */
  readOnly?: ReadOnly;
}

/**
 * The opt-out token for `sdd:`, at repo or top level (MV-122). A value rather
 * than a parse case, so `repoEntry` keeps the one validator every repo key
 * goes through. It cannot collide with a tool: the registry names none this way.
 */
export const NO_ADAPTER = 'none';

/** What resolving needs of a config, and nothing more — `ritualSeed` passes init's flags. */
export interface AdapterDecls {
  sdd?: string;
  repos?: Record<string, Partial<RepoEntry>>;
}

/** The entry a root reads as its own: for `brain`, the declared entry that is the brain. */
function entryOf(cfg: AdapterDecls, root: string): Partial<RepoEntry> | undefined {
  const repos = cfg.repos ?? {};
  return root === 'brain' ? Object.values(repos).find((r) => r.isBrain) : repos[root];
}

/**
 * MV-122, MV-146. The ONE raw read of `sdd`: what `root`'s own entry
 * declares, or with no root the ecosystem's top level. Private, so the
 * resolvers below are the only answers anything else can get.
 *
 * An empty `sdd:` reads as unset (MV-146): a code repo's is not refused and
 * its code stays governed, and the brain entry's defers to the top level. It
 * used to stop the top level at that root and name nothing there.
 */
function ownDecl(cfg: AdapterDecls, root: string | null, kind: 'sdd'): string | undefined {
  const v = root === null ? cfg[kind] : entryOf(cfg, root)?.[kind];
  return v === '' ? undefined : v;
}

/**
 * MV-122. The one answer to "which adapter of this kind RUNS in this root":
 * the root's own entry first, the ecosystem's value otherwise, and `none` at
 * either level is no adapter at all. The brain root reads the declared entry
 * whose path is the brain (brain==code), so its override counts like any
 * repo's. Twelve functions used to answer this themselves, and they disagreed;
 * every surface asks here now, and nothing else reads the two keys to decide.
 *
 * MV-146: the SDD runs in the brain alone — the `brain` handle, or the entry
 * that is the brain under whatever key names it. A top-level `sdd:` used to
 * reach every declared repo, and each paid a vendor install, a door block and
 * a constitution for specs that are written in the brain. Which SDD governs a
 * code repo's CODE is a different question, `sddGoverning`'s.
 */
export function adapterFor(
  cfg: AdapterDecls,
  root: string,
  kind: 'sdd',
): string | undefined {
  const own = entryOf(cfg, root);
  if (kind === 'sdd' && root !== 'brain' && !own?.isBrain) return undefined;
  const name = ownDecl(cfg, root, kind) ?? ownDecl(cfg, null, kind);
  return name && name !== NO_ADAPTER ? name : undefined;
}

/**
 * MV-146. The one answer to "whose SDD rules govern this root's code": the
 * brain's, for the brain and every code repo, unless the root's own entry says
 * `none` — the one value a code repo's `sdd:` takes. `adapterFor` answers
 * where the SDD runs; answering this with it switched the code gate (MV-137)
 * off in every code repo, measured: `verify --strict` exit 1 became 0.
 */
export function sddGoverning(cfg: AdapterDecls, root: string): string | undefined {
  const own = entryOf(cfg, root);
  if (root !== 'brain' && !own?.isBrain && ownDecl(cfg, root, 'sdd') === NO_ADAPTER) return undefined;
  return adapterFor(cfg, 'brain', 'sdd');
}

/** The step every config refusal ends on: the edit itself needs an open change (MV-97). */
const CONFIG_EDIT = 'in .multivac/config.yml, then open a change for the config edit: `multivac change new <slug>`';

/**
 * MV-146. A declaration that resolves in no root, or null. Beside the
 * resolver, because the refusal is the resolver's own rule read backwards:
 * (i) a code repo's `sdd:` naming a tool — the SDD runs in the brain alone,
 * so it would install nowhere; (ii) a top-level tool the brain's own entry
 * contradicts, with another tool or `none` — the top level then reaches no
 * root at all; (iii) a name the registry does not know, which no scaffold,
 * gate or step could honour. Each is the silent no-op MV-122 exists to stop,
 * so `loadConfig` refuses it by name, with the fix.
 */
export function sddDeclarationRefusal(cfg: AdapterDecls): string | null {
  const repos = Object.entries(cfg.repos ?? {});
  for (const [k, e] of repos) {
    if (e.isBrain) continue;
    const v = ownDecl(cfg, k, 'sdd');
    if (v !== undefined && v !== NO_ADAPTER) {
      return `repos.${k}.sdd: ${v} — REFUSED: the SDD lives in the brain alone, so a code repo's sdd: takes only ${NO_ADAPTER}, which exempts its code from the change gate. Fix: remove repos.${k}.sdd or set it to ${NO_ADAPTER} ${CONFIG_EDIT}`;
    }
  }
  const brainKey = repos.find(([, e]) => e.isBrain)?.[0];
  const top = ownDecl(cfg, null, 'sdd');
  const own = brainKey === undefined ? undefined : ownDecl(cfg, brainKey, 'sdd');
  if (top !== undefined && top !== NO_ADAPTER && own !== undefined && own !== top) {
    return `sdd: ${top} — REFUSED: the brain's own entry repos.${brainKey}.sdd says ${own}, so ${top} resolves in no root. Fix: make them agree ${CONFIG_EDIT}`;
  }
  const name = adapterFor(cfg, 'brain', 'sdd');
  if (name !== undefined && sddSpec(name) === undefined) {
    const key = own !== undefined ? `repos.${brainKey}.sdd` : 'sdd';
    return `${key}: ${name} — REFUSED: no SDD adapter is named ${name} (known: ${sddNames.join(', ')}). Fix: correct ${key}: ${CONFIG_EDIT}`;
  }
  return null;
}

/** Why a declared repo is read-only (MV-125). */
export type ReadOnly = 'not managed' | 'shallow';

/**
 * MV-125. The one answer to "may multivac write in this root": `not managed`
 * when its entry says `managed: false`, `shallow` when `dir` is on disk and
 * git reports its clone shallow, and null otherwise. The brain root and the
 * entry that is the brain are never read-only, and are answered without a
 * spawn, as is a declaration. Asked fresh every time: a clone unshallowed
 * mid-process is in scope on the next question.
 *
 * Every surface that writes into a root, or gates on a file there, asks here
 * or reads the field `sddRoots` sets from it; nothing else reads the key or
 * asks git the question.
 */
export async function readOnly(cfg: AdapterDecls, root: string, dir: string): Promise<ReadOnly | null> {
  const own = root === 'brain' ? undefined : cfg.repos?.[root];
  if (!own || own.isBrain) return null;
  if (own.managed === false) return 'not managed';
  return (await pathExists(dir)) && (await isShallow(dir)) ? 'shallow' : null;
}

/**
 * Every DECLARED root grouped by the adapter it resolves, in order of first
 * appearance: the brain first, then declared repos in config order, absent
 * ones included — renderers work from declarations (MV-93), runs from roots on
 * disk. A root resolving no adapter is in no group, so an empty map means no
 * root resolves one.
 */
export function adaptersByRoot(cfg: AdapterDecls, kind: 'sdd'): Map<string, string[]> {
  const keys = Object.entries(cfg.repos ?? {}).filter(([, r]) => !r.isBrain).map(([k]) => k);
  const groups = new Map<string, string[]>();
  for (const root of ['brain', ...keys]) {
    const name = adapterFor(cfg, root, kind);
    if (name !== undefined) groups.set(name, [...(groups.get(name) ?? []), root]);
  }
  return groups;
}

/**
 * Whether the brain holds code: some repos entry is the brain — `brain: .`, or
 * any key whose path is the brain (`isBrain`, derived at load). A brain no
 * entry declares holds the law, the changes and their specs, which are not
 * code. `init`'s flows and `change plan`'s brain line ask it (MV-153).
 */
export function brainHoldsCode(cfg: AdapterDecls): boolean {
  return Object.values(cfg.repos ?? {}).some((r) => r.isBrain);
}

/**
 * MV-147. Where the entries a vendor's integration inits write can sit: for
 * each directory in any integration's `dirs` or in `bodies.dirs`, and each
 * name in `bodies.names`, the entry one or two levels below it — `<d>/<n>`
 * and `<d>/<sub>/<n>` — each with and without `/**`. `[]` for a scaffold that
 * records no `bodies`. Pure and derived once, so the code gate (every repo,
 * declared door or not) and `doctor`'s leftover line (the brain) never
 * disagree on what a body is.
 */
export function bodyGlobs(scaffold: SddScaffold | undefined): string[] {
  const bodies = scaffold?.bodies;
  if (!scaffold || !bodies) return [];
  const dirs = [...new Set([...Object.values(scaffold.integrations).flatMap((i) => i.dirs), ...bodies.dirs])];
  return dirs.flatMap((d) => bodies.names.flatMap((n) => [`${d}/${n}`, `${d}/${n}/**`, `${d}/*/${n}`, `${d}/*/${n}/**`]));
}

/**
 * Every directory an SDD tool's files may be found in: the brain plus each
 * declared, non-brain repo on disk. A gate that searched them all silently
 * would refuse without saying where it looked, so
 * each root carries the name the config gave it.
 *
 * MV-146: the SDD runs in the brain alone, so only the brain root resolves
 * one; the code repos stay in the list because `doctor` reports a leftover
 * install from them, and a gate skips a root that resolves none. The brain's
 * `key` is the entry that is the brain, so its proofs are looked for in the
 * change worktree that entry names.
 *
 * Each root also carries the adapter that applies to it, from `adapterFor`
 * (MV-122), and whether it is read-only, from `readOnly` (MV-125), so no
 * caller re-derives either differently. A read-only root stays in the list,
 * because `doctor` reports from it; every writer and gate skips it.
 */
export async function sddRoots(brain: string, cfg: Config): Promise<SddRoot[]> {
  const brainKey = Object.entries(cfg.repos).find(([, e]) => e.isBrain)?.[0] ?? 'brain';
  const roots: SddRoot[] = [{ scope: 'brain', key: brainKey, dir: brain, sdd: adapterFor(cfg, 'brain', 'sdd') }];
  for (const [key, e] of Object.entries(cfg.repos)) {
    if (e.isBrain) continue; // already the brain
    const d = resolve(brain, e.path);
    if (!(await pathExists(d))) continue;
    const why = await readOnly(cfg, key, d);
    roots.push({ scope: key, key, dir: d, sdd: adapterFor(cfg, key, 'sdd'), ...(why ? { readOnly: why } : {}) });
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
 * MV-123. The one lookup for an SDD binary: the absolute path of the first
 * executable regular file among PATH's non-empty entries in order, then
 * `root`'s own node_modules/.bin, or null. Two rules used to answer this and
 * disagreed: the validator looked in node_modules/.bin, and `doctor` and
 * `doors` never did.
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
  /**
   * MV-127. This repo's `origin` url, if it has one. A SUGGESTION for
   * `brain_url`, written commented out — never a declaration, because an
   * origin can be a machine-local ssh alias and the value ends up in every
   * consumer's `.gitmodules`.
   */
  origin?: string;
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
  // Door proposals come from the registry's own `detect` paths — a new
  // harness is an entry there, never a branch here.
  for (const [name, t] of Object.entries(doorTargets)) {
    if (t.detect && (await has(t.detect))) d.doors.push(name);
  }
  d.origin = (await gitRun(dir, ['remote', 'get-url', 'origin']).catch(() => '')) || undefined;
  return d;
}
