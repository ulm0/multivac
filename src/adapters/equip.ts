// MV-129. What "equip" means, stated once: which declared tool would run in
// which root, which of those this machine cannot run, and running them. `init`,
// the change lifecycle and `repos sync` all ask here, so no two of them can
// disagree about whether a tool was going to run — which is the question a
// missing-binary refusal has to get exactly right, or it refuses over a tool
// nobody was about to use.

import type { Config, GrapherDecl } from '../types.js';
import { binaryMissing, grapherSpec, sddSpec, type AdapterSpec } from './registry.js';
import { missingRequired, sddRoots, type ReadOnly } from './detect.js';
import { ensureGraphs, graphScopes, installHarness } from './refresh.js';
import { runScaffold } from './sdd.js';
import { initState } from '../lib/init-state.js';

/** A root as equip sees it: where it is, and the tools that resolve there. */
export interface EquipRoot {
  scope: string;
  dir: string;
  sdd?: string;
  grapher?: string;
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
 * The tools `runScaffold` and `ensureGraphs` would run, and only those, asked
 * before either runs: an SDD whose recorded init exists and whose probe says
 * missing, when SDD automation is on; a known grapher whose probe says
 * anything but installed. A read-only root runs nothing (MV-125).
 */
export async function toolsToRun(
  roots: EquipRoot[],
  opts: { sdd: boolean; graphers: Record<string, GrapherDecl> },
): Promise<ToolRun[]> {
  const out: ToolRun[] = [];
  for (const r of roots) {
    if (r.readOnly) continue;
    const s = r.sdd && opts.sdd ? sddSpec(r.sdd) : null;
    if (r.sdd && s?.scaffold && (await initState(s, r.dir)).state === 'missing') {
      out.push({ scope: r.scope, dir: r.dir, name: r.sdd, spec: s });
    }
    const g = r.grapher ? grapherSpec(r.grapher, opts.graphers) : null;
    if (r.grapher && g && (await initState(g, r.dir)).state !== 'installed') {
      out.push({ scope: r.scope, dir: r.dir, name: r.grapher, spec: g });
    }
  }
  return out;
}

/** The brain and every declared repo on disk, with both tools resolved per root. */
async function equipRoots(brain: string, cfg: Config): Promise<EquipRoot[]> {
  const graphers = new Map((await graphScopes(brain, cfg)).map((g) => [g.scope, g.name]));
  return (await sddRoots(brain, cfg)).map((r) => ({ ...r, grapher: graphers.get(r.scope) }));
}

/**
 * MV-123's line for every tool `equip` would run and cannot find, named by
 * root. `which` narrows the kinds asked about: `change new` asks for the SDD
 * alone, because the steps it prints need that tool, while a missing graph is
 * a notice there and a refusal at `change close` (MV-90).
 */
export async function missingTools(
  brain: string,
  cfg: Config,
  which: { sdd: boolean; grapher: boolean },
): Promise<string[]> {
  const runs = await toolsToRun(await equipRoots(brain, cfg), {
    sdd: cfg.sddAuto && which.sdd,
    graphers: cfg.graphers,
  });
  const lines: string[] = [];
  for (const t of runs) {
    if (t.spec.kind === 'grapher' && !which.grapher) continue;
    const bins = await missingRequired(t.spec, t.dir);
    if (bins.length > 0) lines.push(`${t.name} @ ${t.scope}: ${binaryMissing(t.name, t.spec, bins, t.scope)}`);
  }
  return lines;
}

/**
 * Run the declared SDD's recorded init, then the grapher's first build, in
 * every root that lacks them. Self-limiting and never throwing: an installed
 * tool runs nothing, and a tool that fails is reported per root.
 */
export async function equip(brain: string, cfg: Config, noSdd: boolean, only?: string[]): Promise<void> {
  await runScaffold(brain, cfg, noSdd);
  // MV-134: in the lifecycle, the graph work stops at the brain and the repos
  // the change names; `repos sync` and `init` pass no `only` and reach every root.
  await ensureGraphs(brain, cfg, only);
  // MV-131: after the graph exists, the grapher's own install into each harness.
  await installHarness(brain, cfg, only);
}
