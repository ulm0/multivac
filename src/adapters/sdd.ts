// The SDD flow: each tool's OWN ordered steps, and the gates that check what
// those steps really produce.
//
// Two halves, deliberately separate. PRINTING is what the lifecycle has always
// done — the steps are chat commands the agent runs, never subcommands
// multivac could spawn. GATING is the half that makes the printing mean
// something: a step declares the artifact that PROVES it happened, and the
// next lifecycle command refuses while that path is missing. A step whose tool
// leaves nothing behind is declared `ungateable` with its reason and is never
// gated — an honest gap beats a green light nobody earned.
//
// The only subprocess here is the TOOL'S OWN VALIDATOR, run for its verdict.
// A step is never faked by shelling out something that looks like it.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { Config } from '../types.js';
import { CONFIG_PATH } from '../lib/config.js';
import {
  sddNames,
  sddSpec,
  type AdapterSpec,
  type GatePoint,
  type LifecyclePoint,
  type SddStep,
} from './registry.js';
import { artifactHit, onPath, sddRoots } from './detect.js';

const execFileP = promisify(execFile);

export const withSlug = (text: string, slug: string): string =>
  text.replaceAll('<slug>', slug);

/** Steps this lifecycle point prints, in declared order. */
export const stepsAt = (spec: AdapterSpec, at: LifecyclePoint): SddStep[] =>
  (spec.steps ?? []).filter((s) => s.at === at);

/** Steps this lifecycle command refuses without, in declared order. */
export const stepsGating = (spec: AdapterSpec, gate: GatePoint): SddStep[] =>
  (spec.steps ?? []).filter((s) => s.gate === gate && s.artifact);

/** What a step leaves behind, or why it can never leave anything. */
export function proofOf(step: SddStep, slug = '<slug>'): string {
  if (step.artifact) {
    return `proof: ${withSlug(step.artifact, slug)} — \`change ${step.gate}\` refuses without it`;
  }
  return `ungateable: ${step.ungateable ?? 'this tool leaves no artifact for this step'}`;
}

/** The tool's whole per-change flow, one line per step, lifecycle point first. */
export const flowLines = (spec: AdapterSpec, slug = '<slug>'): string[] =>
  (spec.steps ?? []).map(
    (s) => `${s.at}: ${withSlug(s.run, slug)} [${proofOf(s, slug)}]`,
  );

export interface GateResult {
  ok: boolean;
  lines: string[];
}

/**
 * Reuse the tool's own verdict. Its rules are its own — reimplementing them
 * here would guarantee drift — so the validator runs in the root that holds
 * the artifact and its message is quoted back verbatim. A validator whose
 * binary is missing is not a failure: the gate already passed on the artifact.
 */
async function toolVerdict(cmd: string, cwd: string): Promise<string | null> {
  const [bin, ...args] = cmd.split(' ');
  if (!(await onPath(bin))) return null;
  try {
    await execFileP(bin, args, { cwd });
    return null;
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; message: string };
    const raw = `${err.stdout ?? ''}${err.stderr ?? ''}`.trim();
    // The JSON shape is the tool's contract; the raw text is the fallback.
    try {
      const parsed = JSON.parse(raw) as {
        items?: Array<{ issues?: Array<{ level?: string; message?: string }> }>;
      };
      const issues = (parsed.items ?? [])
        .flatMap((i) => i.issues ?? [])
        .filter((i) => i.level !== 'INFO')
        .map((i) => i.message)
        .filter(Boolean);
      if (issues.length > 0) return issues.join('; ');
    } catch {
      /* not JSON — fall through to the raw text */
    }
    return raw.split('\n').filter(Boolean).slice(0, 3).join(' ') || err.message.split('\n')[0];
  }
}

/**
 * Refuse `multivac change <gate> <slug>` while the artifacts that prove the
 * earlier steps ran are missing. Every refusal names the exact agent command
 * and the path it looked for. Off entirely when no sdd is declared, when
 * `sdd_auto: false`, or when `--no-sdd` was passed — that is exploration mode.
 */
export async function sddGate(
  brain: string,
  cfg: Config,
  gate: GatePoint,
  slug: string,
  noSdd: boolean,
): Promise<GateResult> {
  if (!cfg.sdd || !cfg.sddAuto || noSdd) return { ok: true, lines: [] };
  const spec = sddSpec(cfg.sdd);
  if (!spec) {
    return {
      ok: true,
      lines: [
        `sdd ${cfg.sdd}: unknown adapter — known: ${sddNames.join(', ')}; fix sdd: in ${CONFIG_PATH}`,
      ],
    };
  }
  const gating = stepsGating(spec, gate);
  if (gating.length === 0) {
    // Never faked: a tool with no step to prove at this point is SAID to have
    // none. spec-kit has no archive equivalent, so `close` is simply not gated.
    return {
      ok: true,
      lines: [
        `sdd ${cfg.sdd}: \`change ${gate}\` is not gated — this tool declares no step whose artifact could prove it`,
      ],
    };
  }
  const roots = await sddRoots(brain, cfg);
  const lines: string[] = [];
  let ok = true;
  for (const step of gating) {
    const want = withSlug(step.artifact!, slug);
    let found: { root: string; rel: string } | null = null;
    for (const root of roots) {
      const hit = await artifactHit(root, want);
      if (hit) {
        found = { root, rel: hit };
        break;
      }
    }
    if (!found) {
      ok = false;
      lines.push(`sdd ${cfg.sdd}: \`change ${gate} ${slug}\` refused — ${want} is missing`);
      lines.push(`  ${withSlug(step.run, slug)}`);
      lines.push(`  then re-run: multivac change ${gate} ${slug}`);
      continue;
    }
    lines.push(`sdd ${cfg.sdd}: ${found.rel} ok`);
    if (!step.validate) continue;
    const verdict = await toolVerdict(withSlug(step.validate, slug), found.root);
    if (verdict !== null) {
      ok = false;
      lines.push(
        `sdd ${cfg.sdd}: \`change ${gate} ${slug}\` refused — \`${withSlug(step.validate, slug)}\` says: ${verdict}`,
      );
      lines.push(`  fix it in the tool, then re-run: multivac change ${gate} ${slug}`);
    }
  }
  if (!ok) {
    lines.push(
      `  (\`--no-sdd\` skips the SDD gates for one run; \`sdd_auto: false\` in ${CONFIG_PATH} turns them off)`,
    );
  }
  return { ok, lines };
}

/**
 * Print the steps this lifecycle point owns, in the tool's own order. An
 * ungateable step still prints — the agent must run it; only the CHECK is
 * missing, and the line says which.
 */
export function sddInstructions(
  cfg: Config,
  at: LifecyclePoint,
  slug: string,
  noSdd: boolean,
): string[] {
  if (!cfg.sdd || !cfg.sddAuto || noSdd) return [];
  const spec = sddSpec(cfg.sdd);
  if (!spec) {
    return [
      `sdd ${cfg.sdd}: unknown adapter — known: ${sddNames.join(', ')}; fix sdd: in ${CONFIG_PATH}`,
    ];
  }
  const steps = stepsAt(spec, at);
  if (steps.length === 0) {
    return [`sdd ${cfg.sdd}: ${at} — this tool has no agent-run ${at} step; nothing to run`];
  }
  return steps.map((s) => `sdd ${cfg.sdd}: ${withSlug(s.run, slug)} [${proofOf(s, slug)}]`);
}
