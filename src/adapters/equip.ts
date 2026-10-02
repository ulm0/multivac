// MV-129. What "equip" means, stated once: which declared tool would run in
// which root, which of those this machine cannot run, and running them. `init`,
// the change lifecycle and `repos sync` all ask here, so no two of them can
// disagree about whether a tool was going to run — which is the question a
// missing-binary refusal has to get exactly right, or it refuses over a tool
// nobody was about to use. MV-153: the declared SDD is the only tool equipped.

import type { Config } from '../types.js';
import { binaryMissing, sddSpec, type AdapterSpec } from './registry.js';
import { missingRequired, sddRoots, type ReadOnly } from './detect.js';
import { runScaffold } from './sdd.js';
import { initState } from '../lib/init-state.js';

/** A root as equip sees it: where it is, and the SDD that resolves there. */
export interface EquipRoot {
  scope: string;
  dir: string;
  sdd?: string;
  readOnly?: ReadOnly;
}

/** One tool that would run in one root. */
export interface ToolRun {
  scope: string;
  dir: string;
  name: string;
  spec: AdapterSpec;
}

/**
 * The tools `runScaffold` would run, and only those, asked before it runs: an
 * SDD whose recorded init exists and whose probe says missing, when SDD
 * automation is on. A read-only root runs nothing (MV-125).
 */
export async function toolsToRun(roots: EquipRoot[], opts: { sdd: boolean }): Promise<ToolRun[]> {
  const out: ToolRun[] = [];
  for (const r of roots) {
    if (r.readOnly) continue;
    const s = r.sdd && opts.sdd ? sddSpec(r.sdd) : null;
    if (r.sdd && s?.scaffold && (await initState(s, r.dir)).state === 'missing') {
      out.push({ scope: r.scope, dir: r.dir, name: r.sdd, spec: s });
    }
  }
  return out;
}

/**
 * MV-123's line for every tool `equip` would run and cannot find, named by
 * root. `sdd` false asks about nothing: the caller's `--no-sdd`.
 */
export async function missingTools(brain: string, cfg: Config, sdd: boolean): Promise<string[]> {
  const runs = await toolsToRun(await sddRoots(brain, cfg), { sdd: cfg.sddAuto && sdd });
  const lines: string[] = [];
  for (const t of runs) {
    const bins = await missingRequired(t.spec, t.dir);
    if (bins.length > 0) lines.push(`${t.name} @ ${t.scope}: ${binaryMissing(t.name, t.spec, bins, t.scope)}`);
  }
  return lines;
}

/**
 * Run the declared SDD's recorded init in every root that lacks it.
 * Self-limiting and never throwing: an installed tool runs nothing, and a
 * tool that fails is reported per root.
 */
export async function equip(brain: string, cfg: Config, noSdd: boolean): Promise<void> {
  await runScaffold(brain, cfg, noSdd);
}
