// Probe a repo/brain for adapter artifacts and PATH binaries. Pure checks,
// no subprocess: a hand-rolled `which` over PATH plus fs existence.

import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { delimiter, join } from 'node:path';
import type { AdapterSpec } from './registry.js';

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
  if (await has('CLAUDE.md')) d.doors.push('claude');
  if (await has('.cursor')) d.doors.push('cursor');
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
