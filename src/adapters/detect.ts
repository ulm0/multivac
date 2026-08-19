// Probe a repo/brain for adapter artifacts and PATH binaries. Pure checks,
// no subprocess: a hand-rolled `which` over PATH plus fs existence.

import { access, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { delimiter, join, resolve } from 'node:path';
import { doorTargets, type AdapterSpec } from './registry.js';
import type { Config, RepoEntry } from '../types.js';

export interface AdapterStatus {
  name: string;
  kind: 'sdd' | 'grapher';
  declared: boolean;
  /** Read capability: something the tool left on disk. */
  artifact: boolean;
  /** Run capability: the executable is on PATH. */
  binary: boolean;
}

/** declared+anything-present = active; declared+nothing = notice, feature off,
 *  exit 0; not declared (null) = silence. */
export type Policy = 'active' | 'notice' | 'silent';

export function policy(s: AdapterStatus | null): Policy {
  if (!s || !s.declared) return 'silent';
  return s.artifact || s.binary ? 'active' : 'notice';
}

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
   * The adapter that applies HERE (MV-87): this repo's own `sdd:` when it
   * declares one, the ecosystem's otherwise, and `undefined` when the repo
   * opted out. Undefined is out of scope, never deficient — no scaffold, no
   * gate, no notice.
   */
  sdd?: string;
}

/**
 * The opt-out token for `repos.<key>.sdd`. A value rather than a parse case,
 * so `repoEntry` keeps the one validator every repo key goes through; it
 * cannot collide, since the registry's names are `opsx` and `speckit` and an
 * unknown name is already reported with the known list.
 */
export const NO_SDD = 'none';

/** Which SDD applies in one declared repo: its own, the ecosystem's, or none. */
export const sddFor = (entry: RepoEntry | undefined, cfg: Config): string | undefined => {
  const declared = entry?.sdd ?? cfg.sdd;
  return declared === NO_SDD ? undefined : declared;
};

/**
 * Every directory an SDD tool's files may live in: the brain plus each
 * declared, present, non-brain repo. A gate that only looked in the brain
 * would refuse a change whose specs live in the code repo — and one that
 * searched them all silently would refuse without saying where it looked, so
 * each root carries the name the config gave it.
 *
 * Each root also carries the adapter that applies to it. Callers used to ask
 * `cfg.sdd` once and treat the answer as the ecosystem's; that is the read
 * MV-87 replaces, and resolving it here is what keeps every caller from
 * re-deriving it differently.
 */
export async function sddRoots(brain: string, cfg: Config): Promise<SddRoot[]> {
  // The brain's own entry when it declared one (brain==code), so a brain that
  // opted out is treated the same as any other root that did.
  const brainEntry = Object.values(cfg.repos).find((e) => e.isBrain);
  const roots: SddRoot[] = [{ scope: 'brain', dir: brain, sdd: sddFor(brainEntry, cfg) }];
  for (const [key, e] of Object.entries(cfg.repos)) {
    if (e.isBrain) continue; // already the brain
    const d = resolve(brain, e.path);
    if (await pathExists(d)) roots.push({ scope: key, dir: d, sdd: sddFor(e, cfg) });
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

/** True when `bin` is executable on PATH — the hook shim's `command -v`, in Node. */
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

/** True when any of the spec's binary names is executable on PATH. */
export async function binaryPresent(spec: AdapterSpec): Promise<boolean> {
  for (const bin of spec.binaries) {
    if (await onPath(bin)) return true;
  }
  return false;
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

/** Full probe of one declared adapter against one directory. */
export async function detect(
  name: string,
  spec: AdapterSpec,
  dir: string,
): Promise<AdapterStatus> {
  return {
    name,
    kind: spec.kind,
    declared: true,
    artifact: await artifactPresent(spec, dir),
    binary: await binaryPresent(spec),
  };
}
