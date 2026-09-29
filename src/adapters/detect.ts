// Probe a repo/brain for adapter binaries and step artifacts. Checks, no
// subprocess of their own: fs existence, one binary lookup over PATH and the
// root's node_modules/.bin (MV-123), and one read-only git question asked
// through src/lib/git.ts — is this sibling's clone shallow (MV-125). Whether a
// vendor is initialised is not asked here: `initState` in
// src/lib/init-state.ts reads its state files (MV-124).

import { access, readdir, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { delimiter, dirname, join, resolve } from 'node:path';
import { doorTargets, grapherSpec, sddNames, sddSpec, type AdapterSpec, type SddScaffold } from './registry.js';
import { isShallow, run as gitRun } from '../lib/git.js';
import { andList } from '../lib/out.js';
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

/** The entry a root reads as its own: for `brain`, the declared entry that is the brain. */
function entryOf(cfg: AdapterDecls, root: string): Partial<RepoEntry> | undefined {
  const repos = cfg.repos ?? {};
  return root === 'brain' ? Object.values(repos).find((r) => r.isBrain) : repos[root];
}

/**
 * MV-122, MV-146. The ONE raw read of `sdd` or `grapher`: what `root`'s own
 * entry declares, or with no root the ecosystem's top level. Private, so the
 * resolvers below are the only answers anything else can get.
 *
 * An empty `sdd:` reads as unset (MV-146): a code repo's is not refused and
 * its code stays governed, and the brain entry's defers to the top level. It
 * used to stop the top level at that root and name nothing there, which is
 * still what an empty `grapher:` does — the grapher half is unchanged.
 */
function ownDecl(cfg: AdapterDecls, root: string | null, kind: 'sdd' | 'grapher'): string | undefined {
  const v = root === null ? cfg[kind] : entryOf(cfg, root)?.[kind];
  return kind === 'sdd' && v === '' ? undefined : v;
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
 * code repo's CODE is a different question, `sddGoverning`'s. Graphers still
 * resolve per root, with one exception.
 *
 * MV-148: the brain resolves a grapher only where a repos entry is the brain
 * (`brainHoldsCode`). A brain no entry declares holds the law, the changes and
 * their specs, which are not code, and it resolved the ecosystem's grapher
 * for itself: `init` installed 23 graphify files and a 2-node graph of
 * `CLAUDE.md`, the first close committed 1,261 lines of a graph answering from
 * graphify's own skill, and codegraph built an index of 0 nodes. Every
 * surface reading through here — the build, the refresh, the harness install,
 * both graph gates, land, `repos check`, `doctor`, `init`'s lookup, the hook
 * wiring and the ecosystem graph — skips such a brain with no edit of its own.
 * A code repo keyed to the brain (`core: .`) is that entry, and resolves as
 * before.
 */
export function adapterFor(
  cfg: AdapterDecls,
  root: string,
  kind: 'sdd' | 'grapher',
): string | undefined {
  const own = entryOf(cfg, root);
  if (kind === 'sdd' && root !== 'brain' && !own?.isBrain) return undefined;
  if (kind === 'grapher' && root === 'brain' && own === undefined) return undefined;
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
 * or reads the field `sddRoots` and `graphScopes` set from it; nothing else
 * reads the key or asks git the question.
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
 * MV-148. Whether the brain holds code: some repos entry is the brain — `brain:
 * .`, or any key whose path is the brain (`isBrain`, derived at load). A brain
 * no entry declares holds the law, the changes and their specs, which are not
 * code, and its code graph answered questions about the code from them.
 */
export function brainHoldsCode(cfg: AdapterDecls): boolean {
  return Object.values(cfg.repos ?? {}).some((r) => r.isBrain);
}

/**
 * MV-148. Which graphers an agent in the brain asks, and in which repos: per
 * grapher, in order of first appearance, the brain's own under the key of the
 * entry that is the brain, where it holds code, then each code repo not marked
 * `managed: false`, in config order. Synchronous, so it asks git nothing: a
 * shallow or unsynced clone is still named — `readOnly` answers whether
 * multivac may write there (MV-125), not whether an agent may ask there. When
 * no repo resolves a grapher, the ecosystem's own declaration maps to no repo,
 * so the door can say no code repo resolves it; nothing declared is an empty
 * map. Every name goes through `adapterFor` or `ownDecl`, the one read.
 */
export function askedGraphers(cfg: AdapterDecls): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  const add = (name: string | undefined, key: string): void => {
    if (name !== undefined) groups.set(name, [...(groups.get(name) ?? []), key]);
  };
  const repos = Object.entries(cfg.repos ?? {});
  const brainKey = repos.find(([, r]) => r.isBrain)?.[0];
  if (brainKey !== undefined) add(adapterFor(cfg, 'brain', 'grapher'), brainKey);
  for (const [key, r] of repos) if (!r.isBrain && r.managed !== false) add(adapterFor(cfg, key, 'grapher'), key);
  if (groups.size === 0) {
    const top = ownDecl(cfg, null, 'grapher');
    if (top && top !== NO_ADAPTER) groups.set(top, []);
  }
  return groups;
}

/** One grapher the brain's session refreshes, and whether its hook follows edits (MV-148). */
export interface RefreshGrapher {
  name: string;
  /** false: the brain's own, which refreshes where it was (MV-52, MV-140); true: a follow hook. */
  follow: boolean;
}

/** Graphers one hook cannot tell apart: they write the same artifact. */
export interface RefreshClash {
  /** The graphers, config order; the brain's own first where it is one of them. */
  names: string[];
  artifact: string;
  /** The first name is the brain's own, whose hook stays; the others get none. */
  own: boolean;
}

/**
 * MV-149. What the brain's session refreshes, from declarations alone: the
 * listed graphers, the follow graphers dropped because they write an artifact
 * another listed one writes, and every follow candidate in config order,
 * unverified names included — `brainHooks` answers for those as #5 did.
 * Reads the top level only through `adapterFor`, like `askedGraphers`.
 */
function refreshPlan(cfg: AdapterDecls & { graphers?: Config['graphers'] }): {
  listed: RefreshGrapher[];
  clashes: RefreshClash[];
  candidates: string[];
} {
  const own = brainHoldsCode(cfg) ? adapterFor(cfg, 'brain', 'grapher') : undefined;
  const candidates: string[] = [];
  for (const [key, r] of Object.entries(cfg.repos ?? {})) {
    if (r.isBrain || r.managed === false) continue;
    const name = adapterFor(cfg, key, 'grapher');
    if (name !== undefined && name !== own && !candidates.includes(name)) candidates.push(name);
  }
  const artifactOf = (name: string): string | undefined => grapherSpec(name, cfg.graphers)?.artifacts[0];
  const ownArt = own === undefined ? undefined : artifactOf(own);
  // Each follow candidate's artifact, and who else writes it: the brain's own
  // first, then the other candidates in config order.
  const clashes: RefreshClash[] = [];
  const dropped = new Set<string>();
  for (const name of candidates) {
    const art = artifactOf(name);
    if (art === undefined || dropped.has(name)) continue;
    const same = candidates.filter((n) => artifactOf(n) === art);
    if (art === ownArt) {
      clashes.push({ names: [own!, ...same], artifact: art, own: true });
    } else if (same.length > 1) {
      clashes.push({ names: same, artifact: art, own: false });
    } else continue;
    for (const n of same) dropped.add(n);
  }
  const listed: RefreshGrapher[] = [];
  if (own !== undefined && ownArt !== undefined) listed.push({ name: own, follow: false });
  for (const name of candidates) {
    if (artifactOf(name) !== undefined && !dropped.has(name)) listed.push({ name, follow: true });
  }
  return { listed, clashes, candidates: candidates.filter((n) => !dropped.has(n)) };
}

/**
 * MV-149. The graphers the brain's session refreshes after an edit, in the
 * order their hooks are written: where the brain holds code, its own, the hook
 * it has always had (MV-52), then each other grapher the code repos not marked
 * `managed: false` resolve, each a follow hook (MV-148); where it holds none,
 * those alone. One hook ran one command, so a code-less brain whose repos
 * resolve two graphers wired none, and a brain==code brain refreshed its own
 * graph on an edit in a sibling of another grapher and left the sibling's
 * index without it.
 *
 * Declarations only, synchronous (MV-93): whether this machine can wire each is
 * `brainHooks`'. A name with no registry or config entry is left out — no hook
 * runs a command multivac guessed (MV-59). A hook knows its grapher by the
 * artifact its toplevel test names (`refreshKey`), so graphers writing one
 * artifact cannot each have one: a follow grapher writing the brain's own
 * artifact is left out, so are all the follow graphers sharing one, and `doors`
 * says so (`refreshClashes`).
 */
export function brainRefreshGraphers(cfg: AdapterDecls & { graphers?: Config['graphers'] }): RefreshGrapher[] {
  return refreshPlan(cfg).listed;
}

/** MV-149. The graphers `brainRefreshGraphers` leaves out for writing one artifact, for `doors`' notice and `doctor`'s refresh path. */
export function refreshClashes(cfg: AdapterDecls & { graphers?: Config['graphers'] }): RefreshClash[] {
  return refreshPlan(cfg).clashes;
}

/**
 * MV-149. What one clash means, in the one sentence `doors`' notice and
 * `doctor`'s refresh path both print, so the two cannot frame it apart.
 * Where the brain's own grapher is one of them, its hook stays — its bytes
 * are MV-52's — and, being no follow hook, it moves into any toplevel holding
 * its artifact: an edit in the others' repos runs the brain's grapher there,
 * and the sentence says so rather than name only land and close. Where none
 * is the brain's own, none is wired: a follow hook wired for the first would
 * pass its toplevel test in the others' repos and run the wrong grapher there.
 */
export function clashSentence(c: RefreshClash): string {
  const [first, ...rest] = c.names;
  return (
    `${andList(c.names)} ${c.names.length === 2 ? 'both' : 'all'} write ${c.artifact}, so one hook cannot tell their repos apart — ` +
    (c.own
      ? `${first} is wired, and an edit in ${andList(rest.map((n) => `${n}'s`))} repos runs ${first} there; ` +
        `\`change land\` and \`change close\` refresh ${andList(rest)}`
      : `${c.names.length === 2 ? 'neither' : 'none'} is wired; \`change land\` and \`change close\` refresh them`)
  );
}

/**
 * MV-149. Whether "after your edits" is true of `name`: a declared door's
 * harness has a post-edit hook, and the brain's session is declared to
 * refresh that grapher — `brainRefreshGraphers` lists it. One question, so the
 * surfaces that say it cannot disagree: the door's where-block, the apply
 * pointer and flow.md's refresh row ask it, where each asked its own copy of
 * it. Declarations only (MV-93): whether this machine found the binary and
 * wired the hook is `doors`' notice and `doctor`'s refresh path.
 */
export function hookRefreshes(cfg: AdapterDecls & { doors: readonly string[]; graphers?: Config['graphers'] }, name: string): boolean {
  return cfg.doors.some((d) => doorTargets[d]?.hookConfig?.postEdit) && brainRefreshGraphers(cfg).some((g) => g.name === name);
}

/**
 * MV-148, MV-149. A follow hook of the brain, or why it has none.
 * `follow`: it runs `name` in whichever of `dirs` holds the edited file;
 * `local` names the repos that reach its binary only in their own
 * node_modules/.bin, which their change worktrees do not hold. `unresolved`:
 * no writable code repo resolves the grapher declared, so there is no checkout
 * to follow edits into. `unreachable`: `bin` is not found from every one of
 * them.
 */
export type BrainHook =
  | { kind: 'follow'; name: string; dirs: string[]; local: string[] }
  | { kind: 'unresolved'; name: string }
  | { kind: 'unreachable'; name: string; bin: string };

/**
 * MV-148, MV-149. Which follow hooks the brain wires, one answer per grapher
 * `brainRefreshGraphers` lists as a follow hook, in its order, from the one
 * lookup (MV-123) made where the hook will run: the hook moves into the code
 * repo of the file edited before it looks, so it reaches PATH and THAT repo's
 * own node_modules/.bin, never the brain's. A copy in the brain, or in one of
 * two repos, wired a hook that refreshed nothing in the other. So the binary
 * must be found from every writable code repo resolving the grapher, which a
 * PATH entry satisfies for all of them. Ceiling: a copy found only in a repo's
 * node_modules/.bin is reached from that repo's checkout and not from its
 * change worktrees, where git never puts an untracked node_modules — there the
 * hook runs nothing, silently, and those are the edits it exists for. `local`
 * names those repos and `doctor` says it. `doors` wires by these answers and
 * `doctor` reports them, so the two cannot disagree; the door, flow.md and the
 * apply pointer, which read declarations alone (MV-93), say "after your edits"
 * of each grapher a hook is declared to run (`hookRefreshes`), and where this
 * machine cannot wire one, `doors` and `doctor` say so for that grapher.
 *
 * Where the brain holds no code, an unverified name the code repos resolve is
 * answered as it is, with no lookup: `doors` names it and wires nothing, as
 * for any root, and `doctor` says nothing refreshes it; and where no writable
 * code repo resolves any grapher, the one declared is `unresolved`. `[]` where
 * nothing follows edits — a brain that holds code with no sibling on another
 * grapher keeps its own hook, wired by `doors`' lookup in the brain.
 */
export async function brainHooks(cfg: Config, brain: string): Promise<BrainHook[]> {
  const holds = brainHoldsCode(cfg);
  const { listed, clashes, candidates } = refreshPlan(cfg);
  const follows = holds ? listed.filter((g) => g.follow).map((g) => g.name) : candidates;
  const asked = askedGraphers(cfg);
  if (!holds && follows.length === 0 && clashes.length === 0) {
    const [declared] = asked.keys();
    return declared === undefined ? [] : [{ kind: 'unresolved', name: declared }];
  }
  const out: BrainHook[] = [];
  next: for (const name of follows) {
    const keys = asked.get(name) ?? [];
    const dirs = keys.map((key) => resolve(brain, cfg.repos[key]!.path));
    const spec = grapherSpec(name, cfg.graphers);
    const local: string[] = [];
    if (spec !== null) {
      for (const [i, root] of dirs.entries()) {
        for (const bin of spec.required) {
          const found = await findBinary(bin, root);
          if (found === null) {
            out.push({ kind: 'unreachable', name, bin });
            continue next;
          }
          if (dirname(found) === localBin(resolve(root)) && !local.includes(keys[i]!)) local.push(keys[i]!);
        }
      }
    }
    out.push({ kind: 'follow', name, dirs, local });
  }
  return out;
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
  if (await has('graphify-out')) d.grapher = 'graphify';
  else if (await has('.codegraph')) d.grapher = 'codegraph';
  // Door proposals come from the registry's own `detect` paths — a new
  // harness is an entry there, never a branch here.
  for (const [name, t] of Object.entries(doorTargets)) {
    if (t.detect && (await has(t.detect))) d.doors.push(name);
  }
  d.origin = (await gitRun(dir, ['remote', 'get-url', 'origin']).catch(() => '')) || undefined;
  return d;
}
