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
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
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
import {
  artifactHit,
  artifactPresent,
  onPath,
  pathExists,
  sddRoots,
  type SddRoot,
} from './detect.js';
import { say, warn } from '../lib/out.js';

const execFileP = promisify(execFile);

/**
 * Lines of `file` matching `pattern`, or none when it cannot be read.
 *
 * POSIX ERE, the same dialect anchors take, so a registry entry never has to
 * learn a second regex language. Unreadable is empty, not an error: this check
 * hardens a gate, it must never become a new way for the lifecycle to crash.
 */
async function openItems(file: string, pattern: string): Promise<string[]> {
  const text = await readText(file);
  if (text === null) return [];
  const re = new RegExp(pattern);
  return text.split('\n').filter((l) => re.test(l));
}

/** File contents, or null when it cannot be read. Unreadable is never a crash. */
async function readText(file: string): Promise<string | null> {
  try {
    return await readFile(file, 'utf8');
  } catch {
    return null;
  }
}

/**
 * The declared template `body` was copied from verbatim, or null.
 *
 * Whole-file equality, not a heuristic: a written artifact is never
 * byte-identical to the template it came from, so this has no false
 * positives — and a project that overrides its template is checked against
 * the file it actually copied, not against the vendor default.
 */
async function copiedFrom(
  root: string,
  templates: string[] | undefined,
  body: string,
): Promise<string | null> {
  for (const rel of templates ?? []) {
    if ((await readText(join(root, rel))) === body) return rel;
  }
  return null;
}

export const withSlug = (text: string, slug: string): string =>
  text.replaceAll('<slug>', slug);

/** Steps this lifecycle point prints, in declared order. */
export const stepsAt = (spec: AdapterSpec, at: LifecyclePoint): SddStep[] =>
  (spec.steps ?? []).filter((s) => s.at === at);

/** Steps this lifecycle command refuses without, in declared order. */
export const stepsGating = (spec: AdapterSpec, gate: GatePoint): SddStep[] =>
  (spec.steps ?? []).filter((s) => s.gate === gate && s.artifact);

/** Steps whose tool-kept ledger this lifecycle command reads, in declared order. */
export const stepsLedgered = (spec: AdapterSpec, gate: GatePoint): SddStep[] =>
  (spec.steps ?? []).filter((s) => s.unfinished?.gate === gate);

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

type Verdict =
  /** The tool ran and was satisfied. */
  | { kind: 'ok' }
  /** The tool is not installed here, so the gate has nothing to ask. */
  | { kind: 'missing'; bin: string }
  /** The tool ran and objected, in its own words. */
  | { kind: 'failed'; message: string };

/**
 * Reuse the tool's own verdict. Its rules are its own — reimplementing them
 * here would guarantee drift — so the validator runs in the root that holds
 * the artifact and its message is quoted back verbatim.
 *
 * A MISSING BINARY IS A FAILURE, not a pass. It used to return null and let
 * the gate stand on artifact existence alone, which is the quietest way this
 * tool could lie: the strongest half of the check silently absent, the same
 * command green on a machine that cannot run it. A gate that cannot be
 * evaluated says so and refuses.
 */
async function toolVerdict(cmd: string, cwd: string): Promise<Verdict> {
  const [bin, ...args] = cmd.split(' ');
  // `npm i -D @fission-ai/openspec` is an ordinary way to install a project's
  // own tooling, and it never touches $PATH — the binary lands in the repo's
  // node_modules/.bin. Refusing that install shape would push the operator
  // toward a global install or toward turning the gate off, for a validator
  // that is right there. $PATH first, then the local bin dir beside the
  // artifact; anything else is genuinely absent.
  const local = join(cwd, 'node_modules', '.bin', bin);
  const exe = (await onPath(bin)) ? bin : existsSync(local) ? local : null;
  if (exe === null) return { kind: 'missing', bin };
  try {
    await execFileP(exe, args, { cwd });
    return { kind: 'ok' };
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
      if (issues.length > 0) return { kind: 'failed', message: issues.join('; ') };
    } catch {
      /* not JSON — fall through to the raw text */
    }
    const message =
      raw.split('\n').filter(Boolean).slice(0, 3).join(' ') || err.message.split('\n')[0];
    return { kind: 'failed', message };
  }
}

/**
 * Run the declared tool's OWN init, once, when it has never run here.
 *
 * Printing is this module's rule, and this is its second exception:
 * the scaffold is what makes the steps runnable, so it is the one command
 * multivac spawns on the tool's behalf besides the tool's own validator.
 *
 * Declaring
 * an SDD in a repo where it has never run used to be a deadlock: `plan` refuses
 * without an artifact, that artifact comes from a chat command, and the chat
 * command does not exist until the tool's init has run — so the only exits were
 * `--no-sdd` and `sdd_auto: false`, each turning the gate off to fix the very
 * absence that fired it.
 *
 * This changes nothing about MV-51. The STEPS stay chat commands the agent
 * runs; the scaffold is a terminal command with a vendor behind it, declared in
 * the registry and quoted verbatim. It never satisfies a step and is never
 * printed as one.
 *
 * Five outcomes, all of them said out loud:
 *   - artifact present in any root  -> silent, nothing runs;
 *   - no scaffold declared          -> the gap, stated: no init is guessed;
 *   - binary absent                 -> the install hint, nothing runs;
 *   - ran and the artifact is there -> scaffolded;
 *   - ran and it is not             -> the tool's own words, command handed
 *                                      back, and the gate that follows still
 *                                      refuses on its own terms.
 *
 * Never throws: a foreign tool's failure is never the lifecycle's failure.
 * It reaches the network, so only the change lifecycle calls it — `verify`,
 * `doctor` and `doors` are bound offline by MV-01.
 */
export async function runScaffold(brain: string, cfg: Config, noSdd: boolean): Promise<void> {
  if (!cfg.sdd || !cfg.sddAuto || noSdd) return;
  const spec = sddSpec(cfg.sdd);
  // An unknown adapter already gets the known-names line from the gate and the
  // instructions; a second copy here would only repeat it.
  if (!spec) return;
  const sc = spec.scaffold;
  const roots = await sddRoots(brain, cfg);
  // Presence is asked the same way the gates ask it, over the same roots. With
  // no scaffold declared there is no artifact to name, so "has this tool left
  // anything here" is the registry's own read-capability probe.
  const present = (dir: string): Promise<boolean> =>
    sc ? pathExists(join(dir, sc.artifact)) : artifactPresent(spec, dir);
  for (const root of roots) {
    if (await present(root.dir)) return; // installed here: silence, not a line
  }
  const where = roots.map((r) => r.scope).join(', ');
  if (!sc) {
    warn(
      `sdd ${cfg.sdd}: declared, and nothing of it is in ${where} — multivac does not know this tool's ` +
        `init command and will not guess one. Install it (${spec.installHint}) and run its own init ` +
        'there yourself, then re-run this command',
    );
    return;
  }
  // Printed BEFORE it runs: it downloads templates and writes into the tree.
  // Only the brain is scaffolded — a sibling checkout is the operator's to
  // init, which is why every root that was searched is named.
  const scope = roots[0].scope;
  say(
    `sdd ${cfg.sdd}: ${sc.artifact} is in none of ${where} — running the tool's own init in ` +
      `${scope}: \`${sc.run}\``,
  );
  const verdict = await toolVerdict(sc.run, roots[0].dir);
  if (verdict.kind === 'missing') {
    warn(
      `sdd ${cfg.sdd}: \`${verdict.bin}\` is not on PATH, so \`${sc.run}\` cannot be run — ` +
        `install it: ${spec.installHint}`,
    );
    return;
  }
  // The artifact decides, not the exit code. A tool that returns 0 without
  // writing what the gates look for has not scaffolded anything, and saying it
  // did is the quiet lie this whole module is built to avoid.
  if (await present(roots[0].dir)) {
    say(`sdd ${cfg.sdd}: scaffolded — ${scope}:${sc.artifact} is there now; its steps are runnable`);
    return;
  }
  warn(
    `sdd ${cfg.sdd}: \`${sc.run}\` left no ${sc.artifact} in ${scope}` +
      (verdict.kind === 'failed'
        ? ` — it said: ${verdict.message}`
        : ' — it exited 0 and wrote nothing there') +
      ` — run it in ${scope} by hand; until then the gates refuse on their own terms`,
  );
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
  const ledgered = stepsLedgered(spec, gate);
  if (gating.length === 0 && ledgered.length === 0) {
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
  // Which repos were searched is half the refusal: in an ecosystem of six,
  // "spec.md is missing" does not say where it was supposed to be, and the
  // agent writes it into the wrong one.
  const where = roots.map((r) => r.scope).join(', ');
  for (const step of gating) {
    const want = withSlug(step.artifact!, slug);
    let found: { root: SddRoot; rel: string } | null = null;
    for (const root of roots) {
      const hit = await artifactHit(root.dir, want);
      if (hit) {
        found = { root, rel: hit };
        break;
      }
    }
    if (!found) {
      ok = false;
      lines.push(
        `sdd ${cfg.sdd}: \`change ${gate} ${slug}\` refused — ${want} is missing — looked in ${where}`,
      );
      lines.push(`  ${withSlug(step.run, slug)}`);
      lines.push(`  then re-run: multivac change ${gate} ${slug}`);
      continue;
    }
    // Existence is the weakest proof, and some tools give it away. Two ways
    // a present artifact still proves nothing, both refused as if it were
    // missing, because that is what they are.
    const body = await readText(join(found.root.dir, found.rel));
    //   1. Empty. spec-kit's setup-plan.sh falls back to `rm -f` + `touch`
    //      when it cannot resolve a template, leaving a 0-byte file. No
    //      declaration needed for this: a step's artifact is never legitimately
    //      empty, whatever the tool.
    if (body !== null && body.trim() === '') {
      ok = false;
      lines.push(
        `sdd ${cfg.sdd}: \`change ${gate} ${slug}\` refused — ${found.root.scope}:${found.rel} is empty`,
      );
      lines.push(`  ${withSlug(step.run, slug)}`);
      lines.push(`  then re-run: multivac change ${gate} ${slug}`);
      continue;
    }
    //   2. Byte-identical to the template it was copied from — the scaffolding
    //      wrote it, not the agent.
    const from = body === null ? null : await copiedFrom(found.root.dir, step.untouched, body);
    if (from !== null) {
      ok = false;
      lines.push(
        `sdd ${cfg.sdd}: \`change ${gate} ${slug}\` refused — ${found.root.scope}:${found.rel} is byte-identical to ${from}: the scaffolding wrote it, nobody has`,
      );
      lines.push(`  ${withSlug(step.run, slug)}`);
      lines.push(`  then re-run: multivac change ${gate} ${slug}`);
      continue;
    }
    lines.push(`sdd ${cfg.sdd}: ${found.root.scope}: ${found.rel} ok`);
    if (!step.validate) continue;
    const verdict = await toolVerdict(withSlug(step.validate, slug), found.root.dir);
    if (verdict.kind === 'missing') {
      // Not a pass. The artifact is on disk and the tool that judges it is
      // not here, so the strongest half of this gate cannot run — say which
      // binary, and how to get it, instead of going green without it.
      ok = false;
      lines.push(
        `sdd ${cfg.sdd}: \`change ${gate} ${slug}\` refused — \`${verdict.bin}\` is not on PATH, so \`${withSlug(step.validate, slug)}\` cannot be run`,
      );
      lines.push(`  install it: ${spec.installHint}`);
      // NOT "drop `sdd:`": that key also renders the whole SDD flow into the
      // brain door, so removing it deletes the agent's instructions along with
      // the gate. Only the two switches actually scoped to gating.
      lines.push(
        `  or skip the gates without losing the door: \`--no-sdd\` for one run, \`sdd_auto: false\` in ${CONFIG_PATH} for good`,
      );
    } else if (verdict.kind === 'failed') {
      ok = false;
      lines.push(
        `sdd ${cfg.sdd}: \`change ${gate} ${slug}\` refused — \`${withSlug(step.validate, slug)}\` says: ${verdict.message}`,
      );
      lines.push(`  fix it in the tool, then re-run: multivac change ${gate} ${slug}`);
    }
  }
  // The ledger pass. Separate from the artifact loop on purpose: these steps
  // may have no artifact of their own (spec-kit's implement leaves none), and
  // the question is different. The artifact asks "did this run"; the ledger
  // asks "does the tool's own book still say the work is open". Both SDD tools
  // ship a way to finish a step over their own objection, and gating only on
  // the artifact accepts that silently.
  for (const step of ledgered) {
    const led = step.unfinished!;
    const want = withSlug(led.artifact, slug);
    let hit: { root: SddRoot; rel: string } | null = null;
    for (const root of roots) {
      const rel = await artifactHit(root.dir, want);
      if (rel) {
        hit = { root, rel };
        break;
      }
    }
    // No ledger: the artifact gate above already refuses if this step was
    // supposed to leave one. Absence here is not evidence of completion, so
    // it is neither pass nor fail — it is simply nothing to read.
    if (!hit) continue;
    const open = await openItems(join(hit.root.dir, hit.rel), led.pattern);
    if (open.length === 0) {
      lines.push(`sdd ${cfg.sdd}: ${hit.root.scope}: ${hit.rel} — nothing left open`);
      continue;
    }
    ok = false;
    lines.push(
      `sdd ${cfg.sdd}: \`change ${gate} ${slug}\` refused — ${hit.root.scope}:${hit.rel} has ${open.length} open item(s) — ${led.why}`,
    );
    for (const l of open.slice(0, 3)) lines.push(`    ${l.trim()}`);
    if (open.length > 3) lines.push(`    …and ${open.length - 3} more`);
    lines.push(`  finish them in the tool, then re-run: multivac change ${gate} ${slug}`);
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
