// MV-124. Is a vendor initialised in this root? Its own state files say, and
// nothing else does: a directory is what `mkdir` leaves, and a 0-byte graph is
// what a killed build leaves. The one probe every surface asks — the scaffold,
// the build, both graph gates, the project-document gate and `doctor`.
//
// Files only, in a file of its own: MV-124 holds this module to spawning
// nothing and reaching no network, so `verify`, `doctor` and `doors` can ask it
// (MV-01).

import { lstat, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { AdapterSpec } from '../adapters/registry.js';

export interface InitState {
  /**
   * installed: a state file passes its check. missing: nothing of the vendor
   * is here. partial: its directory or a state file is here and fails.
   * unevaluable: a state file is here and cannot be read.
   */
  state: 'installed' | 'missing' | 'partial' | 'unevaluable';
  /** What failed, naming the path: partial and unevaluable only. */
  reason?: string;
}

/** What a surface names as the vendor's own: its directory, else its state files. */
export const stateLabel = (spec: Pick<AdapterSpec, 'state'>): string => spec.state.dir ?? spec.state.files.join(' or ');

const errCode = (e: unknown): string => (e as NodeJS.ErrnoException).code ?? String(e);

/** The root's state for this entry. The first file that passes wins. */
export async function initState(spec: Pick<AdapterSpec, 'state'>, dir: string): Promise<InitState> {
  const { dir: own, files, check, expect = {} } = spec.state;
  let unevaluable: string | undefined;
  let partial: string | undefined;
  for (const file of files) {
    const p = join(dir, file);
    try {
      await lstat(p);
    } catch (e) {
      if (errCode(e) !== 'ENOENT' && errCode(e) !== 'ENOTDIR') unevaluable ??= `cannot read ${file}: ${errCode(e)}`;
      continue;
    }
    const st = await stat(p).catch(() => null);
    if (check === 'exists') {
      if (st) return { state: 'installed' };
      continue;
    }
    // A directory, or a link to nothing, is not a state file.
    if (!st?.isFile()) {
      partial ??= `${file} is not a file`;
      continue;
    }
    if (check === 'file') return { state: 'installed' };
    let text: string;
    try {
      text = await readFile(p, 'utf8');
    } catch (e) {
      unevaluable ??= `cannot read ${file}: ${errCode(e)}`;
      continue;
    }
    let doc: Record<string, unknown> | null;
    try {
      doc = JSON.parse(text) as Record<string, unknown> | null;
    } catch {
      partial ??= `${file} does not parse as JSON`;
      continue;
    }
    const failed = Object.entries(expect).find(([key, want]) =>
      want === 'non-empty' ? !(Array.isArray(doc?.[key]) && (doc[key] as unknown[]).length > 0) : doc?.[key] !== want,
    );
    if (!failed) return { state: 'installed' };
    const [key, want] = failed;
    partial ??= `${file}: ${key} ${want === 'non-empty' ? 'is empty' : `is not ${want}`}`;
  }
  if (unevaluable) return { state: 'unevaluable', reason: unevaluable };
  if (partial) return { state: 'partial', reason: partial };
  if (own && (await lstat(join(dir, own)).then(() => true, () => false))) {
    return { state: 'partial', reason: `${own} is there and ${files.join(' or ')} is not` };
  }
  return { state: 'missing' };
}
