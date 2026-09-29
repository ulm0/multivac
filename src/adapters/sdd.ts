// The SDD flow: each tool's OWN ordered steps, and the gates that check what
// those steps really produce.
//
// Two halves, deliberately separate. PRINTING is what the lifecycle has always
// done — the steps are what the agent runs: chat commands for spec-kit, and
// openspec's own terminal verbs for opsx (MV-147), each a call the agent makes
// and multivac never spawns. GATING is the half that makes the printing mean
// something: a step declares the artifact that PROVES it happened, and the
// next lifecycle command refuses while that path is missing. A step whose tool
// leaves nothing behind is declared `ungateable` with its reason and is never
// gated — an honest gap beats a green light nobody earned.
//
// The only subprocess here is the TOOL'S OWN VALIDATOR, run for its verdict.
// A step is never faked by shelling out something that looks like it.

import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { promisify } from 'node:util';
import type { Config } from '../types.js';
import { CONFIG_PATH } from '../lib/config.js';
import {
  binaryMissing,
  sddNames,
  sddSpec,
  type AdapterSpec,
  type GatePoint,
  type LifecyclePoint,
  type SddStep,
  type SddScaffold,
} from './registry.js';
import {
  adapterFor,
  adaptersByRoot,
  artifactHit,
  findBinary,
  missingRequired,
  pathExists,
  sddRoots,
  type SddRoot,
} from './detect.js';
import { projectDocVerdict } from '../lib/repo-state.js';
import { initState, stateLabel } from '../lib/init-state.js';
import { quoteFailure, say, warn } from '../lib/out.js';

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

/**
 * Where a project-level document is checked. `plan` and only `plan`: it is the
 * first lifecycle point at which the document's absence changes the outcome —
 * spec-kit's `/speckit.plan` opens with a Constitution Check that reads it —
 * and refusing at `new` would block writing a spec that does not depend on it.
 *
 * A constant with its reason, not a per-adapter field: this is the lifecycle's
 * decision and it is the same for every tool, so a field would only ever hold
 * one value.
 */
const PROJECT_DOC_GATE: GatePoint = 'plan';

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

/**
 * MV-147. Why the brain's SDD cannot create a change named `slug`, or null.
 *
 * The slug outlives every switch: it names the change file, the branch and the
 * tool's own change directory, and the printed `new` step's first command is
 * the tool's create. A slug the tool refuses opens a change whose first step
 * fails, so `change new` and `roadmap add` ask here first, whatever `sdd_auto`
 * and `--no-sdd` say. No SDD, or one that records no grammar: null, and both
 * accept what they always did. Pure — the grammar is the entry's, measured.
 */
export function sddSlugWhy(cfg: Config, slug: string): string | null {
  const name = adapterFor(cfg, 'brain', 'sdd');
  const grammar = name ? sddSpec(name)?.slug : undefined;
  if (!grammar) return null;
  if (!new RegExp(grammar.pattern).test(slug) || grammar.reserved.includes(slug)) return grammar.why;
  return null;
}

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
  /**
   * The tool ran and was satisfied. `notes`: the messages of its passing
   * output that the step's `validateNotes` names (MV-147), each printed and
   * none refusing.
   */
  | { kind: 'ok'; notes: string[] }
  /** A required binary is not found for this root, so the gate has nothing to ask. */
  | { kind: 'missing'; bins: string[] }
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
 *
 * MV-123: the binary is found by the one lookup, in the root the command runs
 * in — PATH, then that root's node_modules/.bin, where `npm i -D` puts a
 * project's own tooling — and what runs is the path it found, so the copy on
 * PATH wins where both exist. Every `required` binary must be found, and so
 * must the command's own first word.
 *
 * MV-147: `notes`, an ERE, is read over the issue messages of a PASSING run's
 * JSON. openspec 1.13.2 validates a delta its own archive will refuse with
 * exit 0 and an INFO issue saying so; the pass stays a pass. Parsed inside a
 * try, because a pass owes the gate no output: empty, whitespace or anything
 * not JSON is a pass with no note — the suite's stubs print only a newline.
 * The scaffold's calls pass none.
 */
async function toolVerdict(spec: AdapterSpec, cmd: string, cwd: string, notes?: string): Promise<Verdict> {
  const [bin, ...args] = cmd.split(' ');
  const bins = await missingRequired(spec, cwd);
  const exe = await findBinary(bin, cwd);
  if (exe === null && !bins.includes(bin)) bins.push(bin);
  if (exe === null || bins.length > 0) return { kind: 'missing', bins };
  try {
    // MV-124: the entry's opt-outs over whatever the parent had, the command untouched.
    const { stdout } = await execFileP(exe, args, { cwd, env: { ...process.env, ...spec.env } });
    return { kind: 'ok', notes: notes ? passingNotes(stdout, notes) : [] };
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
      /* not JSON — fall through to the quote */
    }
    return { kind: 'failed', message: quoteFailure(err) };
  }
}

/**
 * The issue messages of a passing validator's JSON that `pattern` matches, in
 * the tool's order; none when the output is not the vendor's JSON. A note is
 * never a reason to refuse, so nothing here can fail the gate.
 */
function passingNotes(stdout: string, pattern: string): string[] {
  try {
    const parsed = JSON.parse(stdout) as {
      items?: Array<{ issues?: Array<{ message?: unknown }> }>;
    };
    const re = new RegExp(pattern);
    return (parsed?.items ?? [])
      .flatMap((i) => i?.issues ?? [])
      .map((i) => i?.message)
      .filter((m): m is string => typeof m === 'string' && re.test(m));
  } catch {
    return [];
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
 * spec-kit in a repo where it has never run used to be a deadlock: `plan`
 * refuses without an artifact, that artifact comes from a chat command, and the
 * chat command does not exist until the tool's init has run — so the only exits
 * were `--no-sdd` and `sdd_auto: false`, each turning the gate off to fix the
 * very absence that fired it. The deadlock is spec-kit's (MV-147): opsx's steps
 * are openspec's own terminal verbs, there wherever the binary is, and
 * `openspec new change` creates a root where none resolves (1.13.2). Its
 * scaffold still runs where `openspec/config.yaml` is missing, so the brain gets
 * the vendor's own `config.yaml` and the probe reads an init, not a side effect
 * of the first step.
 *
 * This changes nothing about MV-51. The STEPS stay what the agent runs; the
 * scaffold is a terminal command with a vendor behind it, declared in the
 * registry and quoted verbatim. It never satisfies a step and is never printed
 * as one.
 *
 * Every outcome said out loud, and all of them PER ROOT (MV-87), on the state
 * `initState` reads from the vendor's own files (MV-124):
 *   - installed in THIS root          -> silent, nothing runs here;
 *   - partial or unevaluable          -> warned with the reason and the init
 *                                        to run by hand, nothing runs: a re-run
 *                                        reverts edited files;
 *   - missing, no scaffold declared   -> the gap, stated: no init is guessed;
 *   - missing, binary absent          -> the missing-binary line, nothing runs;
 *   - ran and the probe says installed -> scaffolded;
 *   - ran and it does not             -> the tool's own words, command handed
 *                                        back, and the gate that follows still
 *                                        refuses on its own terms.
 *
 * It used to ask presence of the whole list and stop at the first hit, then act
 * on `roots[0]` alone. Measured in an ecosystem of six: one sibling repo
 * somebody had run the init in by hand suppressed the scaffold everywhere, the
 * brain included, so declaring an SDD did nothing at all and the report said
 * `artifact ok`. A directory made by hand silenced it too, until the question
 * became the vendor's own state file (MV-124). A root that opted out
 * (`sdd: none`) is skipped as out of scope, never as deficient, and each root
 * is asked about the adapter that applies THERE — `sddRoots` resolves that per
 * root. Since MV-146 that is the brain alone: a code repo resolves no SDD, so
 * the loop never scaffolds one.
 *
 * Never throws: a foreign tool's failure is never the lifecycle's failure, and
 * one root's broken checkout never decides the fate of the rest — the loop
 * continues. It writes the vendor's files into the tree, and a re-run of
 * specify 1.0.6 reverts edited ones, so the commands that set a repo up call it
 * — `init` for the brain (MV-128) and the change lifecycle — and `verify`,
 * `doctor` and `doors` never do (MV-75).
 */
/**
 * MV-130. The vendor's own commands that set its tool up for the declared
 * doors, and the doors it has no verified integration for. The init was
 * `--integration claude` whatever the team used, so a cursor or codex brain got
 * spec-kit's claude skills and nothing its own harness reads.
 */
export function scaffoldCommands(
  scaffold: SddScaffold,
  doors: string[],
): { commands: string[]; gaps: string[] } {
  // MV-147: a run with no placeholder installs no door's integration, so it
  // is run as written whatever the doors, none included, and no door is a
  // gap — opsx's `--tools none` scaffold, whose steps no harness file serves.
  if (!scaffold.run.includes('{key}') && !scaffold.run.includes('{keys}')) {
    return { commands: [scaffold.run], gaps: [] };
  }
  const mapped = doors.filter((d) => scaffold.integrations[d]);
  const gaps = doors
    .filter((d) => d !== 'agents' && !scaffold.integrations[d])
    .map((d) => `${d} has no verified integration for this tool`);
  const keys = [...new Set(mapped.map((d) => scaffold.integrations[d].key))];
  if (scaffold.run.includes('{keys}')) {
    return keys.length > 0
      ? { commands: [scaffold.run.replace('{keys}', keys.join(','))], gaps }
      : { commands: [], gaps: [...gaps, 'no declared door maps to an integration of this tool'] };
  }
  const first = keys[0] ?? scaffold.fallback;
  if (first === undefined) {
    return { commands: [], gaps: [...gaps, 'no declared door maps to an integration of this tool'] };
  }
  const commands = [scaffold.run.replace('{key}', first)];
  const firstSafe = Object.values(scaffold.integrations).find((i) => i.key === first)?.safe ?? true;
  for (const key of keys.slice(1)) {
    const safe = Object.values(scaffold.integrations).find((i) => i.key === key)!.safe;
    if (scaffold.add && safe && firstSafe) commands.push(scaffold.add.replace('{key}', key));
    else gaps.push(`${key} cannot be installed beside ${first} without forcing it, and multivac never forces an integration`);
  }
  return { commands, gaps };
}

/**
 * The version a vendor recorded in its own state file (spec-kit writes
 * `version` into `.specify/integration.json`), or null. Read, never asked of
 * the binary: the probe that just said "installed" read the same file.
 */
async function recordedVersion(rootDir: string, spec: AdapterSpec): Promise<string | null> {
  if (spec.state.check !== 'json') return null;
  for (const f of spec.state.files) {
    try {
      const v = (JSON.parse((await readText(join(rootDir, f))) ?? 'null') as { version?: unknown } | null)?.version;
      if (typeof v === 'string' && v.trim()) return v.trim();
    } catch {
      // Unparseable is no record, never a guess.
    }
  }
  return null;
}

/**
 * `a` at or above `b`, both read as their leading three numbers. The same
 * grammar as `requires:` (version.ts): no range parser, and a pre-release
 * suffix is ignored, never guessed at. Unparseable is below.
 */
function atLeast(a: string, b: string): boolean {
  const n = (v: string): number[] | null => /^(\d+)\.(\d+)\.(\d+)/.exec(v)?.slice(1).map(Number) ?? null;
  const x = n(a);
  const y = n(b);
  if (!x || !y) return false;
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return true;
}

/** `dir/{spec,plan}-template.md` for files sharing a suffix, `dir/name` for one. */
function braced(dir: string, names: string[]): string {
  if (names.length === 1) return `${dir}/${names[0]}`;
  let suffix = names[0];
  for (const n of names) while (!n.endsWith(suffix)) suffix = suffix.slice(1);
  // Cut at a separator, so a shared letter is never pulled out of a name.
  const cut = suffix.search(/[-.]/);
  suffix = cut < 0 ? '' : suffix.slice(cut);
  return `${dir}/{${names.map((n) => n.slice(0, n.length - suffix.length)).join(',')}}${suffix}`;
}

/**
 * MV-146. The entry's skeleton, written where the tool resolves templates
 * first — called by the scaffold alone, on the run whose probe turned the root
 * from missing to installed, so a root installed before, by hand or by an
 * older multivac, never gets one: writing there would shadow a core template
 * the team may have edited, and re-create overrides a human deleted.
 *
 * Nothing is written when the directory is already there (a human's
 * overrides), or when the vendor recorded no version or one below the floor
 * that was measured to read the directory first — there an override would be
 * a file nothing reads. Per body, a core template that lost a heading the body
 * keeps is named and skipped: the step bodies fill those headings, and a body
 * kept past the vendor's own would serve a structure it dropped. `wx`, so a
 * file that appears meanwhile is never overwritten (MV-108: a path that
 * exists is not ours).
 */
export async function writeSkeleton(rootDir: string, spec: AdapterSpec): Promise<{ written: string[]; skipped: string[] }> {
  const sk = spec.scaffold?.skeleton;
  if (!sk) return { written: [], skipped: [] };
  if (await pathExists(join(rootDir, sk.dir))) return { written: [], skipped: [`${sk.dir} exists`] };
  // `measured` names the tool and the version it was measured on.
  const tool = sk.measured.replace(/ \S+$/, '');
  const v = await recordedVersion(rootDir, spec);
  if (v === null) return { written: [], skipped: ['no recorded version'] };
  if (!atLeast(v, sk.floor)) return { written: [], skipped: [`${tool} ${v} is below ${sk.floor}`] };
  const written: string[] = [];
  const skipped: string[] = [];
  for (const [file, body] of Object.entries(sk.files)) {
    // The core template sits one level above the directory that shadows it.
    const core = await readText(join(rootDir, dirname(sk.dir), file));
    if (core === null) {
      skipped.push(`${file}: the installed template is missing`);
      continue;
    }
    const lines = new Set(core.split('\n').map((l) => l.trimEnd()));
    const lost = (sk.keeps[file] ?? []).find((h) => !lines.has(`## ${h}`));
    if (lost !== undefined) {
      skipped.push(`${file}: the installed template has no "## ${lost}"`);
      continue;
    }
    try {
      await mkdir(join(rootDir, sk.dir), { recursive: true });
      await writeFile(join(rootDir, sk.dir, file), body, { flag: 'wx' });
      written.push(file);
    } catch (e) {
      skipped.push(`${file}: ${(e as NodeJS.ErrnoException).code ?? String(e)}`);
    }
  }
  return { written, skipped };
}

export async function runScaffold(brain: string, cfg: Config, noSdd: boolean): Promise<void> {
  if (!cfg.sddAuto || noSdd) return;
  const roots = await sddRoots(brain, cfg);
  for (const root of roots) {
    // Out of scope, not deficient: `sdd: none`, or no sdd resolves for this root.
    if (!root.sdd) continue;
    // Not multivac's to write (MV-125): the init writes the vendor's files, so
    // nothing runs and nothing is said. `doctor` reports why.
    if (root.readOnly) continue;
    const spec = sddSpec(root.sdd);
    // An unknown adapter already gets the known-names line from the gate and
    // the instructions; a second copy here would only repeat it.
    if (!spec) continue;
    const sc = spec.scaffold;
    const dir = stateLabel(spec);
    const before = await initState(spec, root.dir);
    if (before.state === 'installed') continue; // installed here: silence, not a line
    if (before.state !== 'missing') {
      // Something of the tool is here and it is not an install. Never run the
      // init over it: on spec-kit 1.0.6 a re-run reverts edited files.
      warn(
        `sdd ${root.sdd}: ${root.scope} is ${before.state} — ${before.reason} — ` +
          (sc
            ? `the init is not run over it, since a re-run can revert edited files; run \`${scaffoldCommands(sc, cfg.doors).commands.join(' && ')}\` in ${root.scope} yourself`
            : `multivac does not know this tool's init command and will not guess one. Install it (${spec.installHint}) and finish its own init there yourself`),
      );
      continue;
    }
    if (!sc) {
      warn(
        `sdd ${root.sdd}: declared, and nothing of it is in ${root.scope} — multivac does not know this tool's ` +
          `init command and will not guess one. Install it (${spec.installHint}) and run its own init ` +
          'there yourself, then re-run this command',
      );
      continue;
    }
    const { commands, gaps } = scaffoldCommands(sc, cfg.doors);
    for (const g of gaps) warn(`sdd ${root.sdd}: ${root.scope}: ${g} — install it there yourself if you need it`);
    if (commands.length === 0) continue;
    // Printed BEFORE it runs: it writes the vendor's files into the tree, and
    // then multivac writes the skeleton the entry records (MV-146).
    const sk = sc.skeleton;
    say(
      `sdd ${root.sdd}: ${dir} is missing in ${root.scope} — running the tool's own init ` +
        `there: \`${commands.join(' && ')}\`` +
        (sk ? `, then multivac writes its skeleton templates to ${sk.dir}` : ''),
    );
    let verdict: Verdict = { kind: 'ok', notes: [] };
    for (const cmd of commands) {
      verdict = await toolVerdict(spec, cmd, root.dir);
      if (verdict.kind !== 'ok') break;
    }
    if (verdict.kind === 'missing') {
      // One line per root: the lookup reads each root's own node_modules/.bin
      // (MV-123), so found or not is a fact about the root, not the machine.
      warn(`sdd ${root.sdd}: \`${commands.join(' && ')}\` cannot be run — ${binaryMissing(root.sdd, spec, verdict.bins, root.scope)}`);
      continue;
    }
    // The probe decides, not the exit code. A tool that returns 0 without
    // writing its state file has not scaffolded anything, and saying it did is
    // the quiet lie this whole module is built to avoid.
    const after = await initState(spec, root.dir);
    if (after.state === 'installed') {
      // Only here: missing before, installed now. Never over a root that was
      // already installed, and never after a partial or failed run.
      let skel = '';
      if (sk) {
        const { written, skipped } = await writeSkeleton(root.dir, spec);
        if (written.length > 0) skel += `; skeleton: ${braced(sk.dir, written)}`;
        if (skipped.length > 0) skel += `; skeleton skipped: ${skipped.join('; ')}`;
      }
      say(`sdd ${root.sdd}: scaffolded — ${root.scope}:${dir} is there now; its steps are runnable${skel}`);
      continue;
    }
    warn(
      `sdd ${root.sdd}: \`${commands.join(' && ')}\` ` +
        (after.state === 'missing' ? `left no ${dir}` : `left ${dir} ${after.state} (${after.reason})`) +
        ` in ${root.scope}` +
        (verdict.kind === 'failed'
          ? ` — it said: ${verdict.message}`
          : after.state === 'missing'
            ? ' — it exited 0 and wrote nothing there'
            : ' — it exited 0') +
        ` — run it in ${root.scope} by hand; until then the gates refuse on their own terms`,
    );
  }
}

/**
 * MV-133. A change's artifacts live on its branch: `change apply` carries them
 * into the change worktree and out of the checkout. So a proof for `slug` is
 * looked for in the checkout first and, when none is there, in the change's own
 * worktree for that root — the root handed back names where it was found, so
 * whatever reads the file reads it there.
 *
 * MV-146: the worktree is named by the root's KEY, not its scope. A brain==code
 * entry keyed `core` has scope `brain` and its worktree at `…/<slug>/core`, so
 * joining the scope looked in a directory that never exists, found no task
 * list, and let `close` pass over an open task.
 *
 * MV-147: every point but `land`. A step printed there runs after the merge,
 * so `judgeSdd` refuses a hit this hands back from the worktree for it, and
 * reads no ledger from one.
 */
async function slugHits(brain: string, root: SddRoot, slug: string, want: string): Promise<{ root: SddRoot; hits: string[] }> {
  const hits = await artifactHit(root.dir, want);
  if (hits.length > 0) return { root, hits };
  const wt = join(brain, '.multivac', 'worktrees', slug, root.key);
  if (!(await pathExists(wt))) return { root, hits };
  return { root: { ...root, dir: wt }, hits: await artifactHit(wt, want) };
}

/**
 * MV-146. A proof written where the SDD does not run, named and never read.
 * The SDD lives in the brain, so a spec an agent wrote into a code repo by
 * habit proves nothing — but a refusal that only says "missing" sends it
 * looking in the wrong checkout again. Asked only once a proof or a task
 * ledger is missing from the brain, over each code repo on disk and its change
 * worktree.
 *
 * Its own loop, not another `slugHits`: that read hands back a root whose file
 * the gate then reads and judges, and nothing here is judged. No read-only
 * guard either: listing a directory is no write, and the line only says where
 * a file is — MV-125 carries that as a note.
 */
async function strayLines(brain: string, name: string, others: SddRoot[], slug: string, want: string): Promise<string[]> {
  const lines: string[] = [];
  for (const r of others) {
    const wt = join(brain, '.multivac', 'worktrees', slug, r.key);
    for (const hit of await artifactHit(r.dir, want)) {
      lines.push(`sdd ${name}:   ${r.scope}: ${hit} — not read; the SDD runs only in the brain`);
    }
    for (const hit of await artifactHit(wt, want)) {
      lines.push(`sdd ${name}:   ${r.scope}: ${relative(brain, join(wt, hit))} — not read; the SDD runs only in the brain`);
    }
  }
  return lines;
}

/**
 * Refuse `multivac change <gate> <slug>` while the artifacts that prove the
 * earlier steps ran are missing. Every refusal names the exact agent command
 * and the path it looked for. Off entirely when no root resolves an sdd, when
 * `sdd_auto: false`, or when `--no-sdd` was passed — that is exploration mode.
 *
 * MV-122: once PER ADAPTER, over the present roots that resolve to it. This
 * read the ecosystem's `sdd:` alone, so a repo declaring its own was gated by
 * another tool's artifacts, or by nothing when the ecosystem declared none,
 * and a root that opted out still proved a step. A point passes only when
 * every adapter passes; with one adapter this is the single pass it always was.
 *
 * MV-146: the brain is the one root that resolves an SDD, so there is one
 * adapter and one root to judge, and the brain is never read-only (MV-125):
 * the branch that said every root resolving the adapter was read-only is gone
 * with the roots it named. A code repo is never judged — a proof found there
 * is only named.
 */
export async function sddGate(
  brain: string,
  cfg: Config,
  gate: GatePoint,
  slug: string,
  noSdd: boolean,
): Promise<GateResult> {
  if (!cfg.sddAuto || noSdd) return { ok: true, lines: [] };
  // Grouped over DECLARED roots, the groups flow.md and the printed steps
  // render, then searched only where on disk. A root resolving `none` is in no
  // group, so no loop below ever searches it.
  const present = await sddRoots(brain, cfg);
  const lines: string[] = [];
  let ok = true;
  for (const [name, declared] of adaptersByRoot(cfg, 'sdd')) {
    const roots = present.filter((r) => declared.includes(r.scope));
    // MV-146: every other root on disk is a code repo, where this SDD never runs.
    const others = present.filter((r) => r.scope !== 'brain');
    const one = await judgeSdd(brain, name, roots, declared, gate, slug, others);
    ok = ok && one.ok;
    lines.push(...one.lines);
  }
  if (!ok) {
    lines.push(
      `  (\`--no-sdd\` skips the SDD gates for one run; \`sdd_auto: false\` in ${CONFIG_PATH} turns them off)`,
    );
  }
  return { ok, lines };
}

/**
 * One adapter's verdict at `gate`, judged only in the roots that resolve to it.
 * `others` are never judged: a missing proof lists what they hold (MV-146).
 */
async function judgeSdd(
  brain: string,
  name: string,
  roots: SddRoot[],
  declared: string[],
  gate: GatePoint,
  slug: string,
  others: SddRoot[],
): Promise<GateResult> {
  const spec = sddSpec(name);
  if (!spec) {
    return {
      ok: true,
      lines: [
        `sdd ${name}: unknown adapter — known: ${sddNames.join(', ')}; fix sdd: in ${CONFIG_PATH}`,
      ],
    };
  }
  const gating = stepsGating(spec, gate);
  const ledgered = stepsLedgered(spec, gate);
  // A tool with no project-level document declares none (opsx declares
  // `projectSteps: []`, because its `context:` key is not one), and is
  // untouched by this pass.
  // A report-only document is never gated (MV-135).
  const projectDocs = gate === PROJECT_DOC_GATE ? (spec.projectSteps ?? []).filter((p) => !p.reportOnly) : [];
  if (gating.length === 0 && ledgered.length === 0 && projectDocs.length === 0) {
    // Never faked: a tool with no step to prove at this point is SAID to have
    // none. spec-kit has no archive equivalent, so `close` is simply not gated.
    return {
      ok: true,
      lines: [
        `sdd ${name}: \`change ${gate}\` is not gated — this tool declares no step whose artifact could prove it`,
      ],
    };
  }
  // Every root that resolves this adapter is declared and not cloned: nothing
  // can be searched, and a gate that cannot be evaluated refuses rather than
  // passes (MV-90) — never the silent pass under a door that says it refuses.
  if (roots.length === 0) {
    return {
      ok: false,
      lines: [
        `sdd ${name}: \`change ${gate} ${slug}\` refused — no root that resolves ${name} is on disk: ${declared.join(', ')}`,
        `  multivac repos sync, then re-run: multivac change ${gate} ${slug}`,
      ],
    };
  }
  const lines: string[] = [];
  let ok = true;
  // Which repos were searched is half the refusal: in an ecosystem of six,
  // "spec.md is missing" does not say where it was supposed to be, and the
  // agent writes it into the wrong one.
  const where = roots.map((r) => r.scope).join(', ');
  for (const step of gating) {
    const want = withSlug(step.artifact!, slug);
    // `asked` is the root the hits were asked through: when `root.dir` is not
    // its dir, they came from the change's worktree (MV-133's fallback).
    // MV-113: several directories proving one step is not a choice this probe
    // may make. Taking the first in sort order let an older foreign directory
    // shadow the right one, silently — so a clash is refused by name, in the
    // root where it collides. The first declared root holding ANY hit decides:
    // a single hit wins there, several refuse there, and a later root is never
    // consulted, which is the same root that decided under the old code.
    let hit: { root: SddRoot; rels: string[]; asked: SddRoot } | null = null;
    for (const r of roots) {
      const { root, hits } = await slugHits(brain, r, slug, want);
      if (hits.length > 0) {
        hit = { root, rels: hits, asked: r };
        break;
      }
    }
    // MV-147. A step printed at `land` runs after every stage has merged, in
    // the brain checkout, which is the only place its proof counts. Measured
    // in a brain==code change: `openspec archive` run in the change's worktree
    // after the merge let close pass while the checkout kept the change open
    // and `openspec/specs/` empty — the worktree's archive never reaches main.
    // Before the merge the fallback is right (MV-133), so only `land` is held.
    // Asked before the clash: two archives there are two that never reach the
    // checkout, not a clash in it.
    if (hit && step.at === 'land' && hit.root.dir !== hit.asked.dir) {
      ok = false;
      const wt = hit.root.dir;
      const paths = hit.rels.map((rel) => relative(brain, join(wt, rel))).join(', ');
      lines.push(
        `sdd ${name}: \`change ${gate} ${slug}\` refused — ${want} is only in the change's worktree, ${paths}, which never reaches the brain checkout`,
      );
      lines.push(`  ${withSlug(step.run, slug)}`);
      if (step.guide) lines.push(`    ${withSlug(step.guide, slug)}`);
      lines.push(`  then re-run: multivac change ${gate} ${slug}`);
      continue;
    }
    if (hit && hit.rels.length > 1) {
      ok = false;
      lines.push(
        `sdd ${name}: \`change ${gate} ${slug}\` refused — ${want} matches more than one place in ${hit.root.scope}: ${hit.rels.join(', ')} — one feature directory per slug; remove or renumber the strays`,
      );
      lines.push(`  then re-run: multivac change ${gate} ${slug}`);
      continue;
    }
    const found = hit && { root: hit.root, rel: hit.rels[0] };
    if (!found) {
      ok = false;
      lines.push(
        `sdd ${name}: \`change ${gate} ${slug}\` refused — ${want} is missing — looked in ${where}`,
      );
      lines.push(...(await strayLines(brain, name, others, slug, want)));
      lines.push(`  ${withSlug(step.run, slug)}`);
      // MV-147: a refusal re-prints the step, so it re-prints its guide too,
      // four spaces in under the run — the step comes up here again.
      if (step.guide) lines.push(`    ${withSlug(step.guide, slug)}`);
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
        `sdd ${name}: \`change ${gate} ${slug}\` refused — ${found.root.scope}:${found.rel} is empty`,
      );
      lines.push(`  ${withSlug(step.run, slug)}`);
      if (step.guide) lines.push(`    ${withSlug(step.guide, slug)}`);
      lines.push(`  then re-run: multivac change ${gate} ${slug}`);
      continue;
    }
    //   2. Byte-identical to the template it was copied from — the scaffolding
    //      wrote it, not the agent.
    const from = body === null ? null : await copiedFrom(found.root.dir, step.untouched, body);
    if (from !== null) {
      ok = false;
      lines.push(
        `sdd ${name}: \`change ${gate} ${slug}\` refused — ${found.root.scope}:${found.rel} is byte-identical to ${from}: the scaffolding wrote it, nobody has`,
      );
      lines.push(`  ${withSlug(step.run, slug)}`);
      if (step.guide) lines.push(`    ${withSlug(step.guide, slug)}`);
      lines.push(`  then re-run: multivac change ${gate} ${slug}`);
      continue;
    }
    lines.push(`sdd ${name}: ${found.root.scope}: ${found.rel} ok`);
    if (!step.validate) continue;
    const verdict = await toolVerdict(spec, withSlug(step.validate, slug), found.root.dir, step.validateNotes);
    if (verdict.kind === 'missing') {
      // Not a pass. The artifact is on disk and the tool that judges it is
      // not here, so the strongest half of this gate cannot run — say which
      // binary, how to get it and whose it is, instead of going green without it.
      ok = false;
      lines.push(
        `sdd ${name}: \`change ${gate} ${slug}\` refused — \`${withSlug(step.validate, slug)}\` cannot be run — ` +
          binaryMissing(name, spec, verdict.bins, found.root.scope),
      );
      // NOT "drop `sdd:`": that key also renders the whole SDD flow into the
      // brain door, so removing it deletes the agent's instructions along with
      // the gate. Only the two switches actually scoped to gating.
      lines.push(
        `  or skip the gates without losing the door: \`--no-sdd\` for one run, \`sdd_auto: false\` in ${CONFIG_PATH} for good`,
      );
    } else if (verdict.kind === 'failed') {
      ok = false;
      lines.push(
        `sdd ${name}: \`change ${gate} ${slug}\` refused — \`${withSlug(step.validate, slug)}\` says: ${verdict.message}`,
      );
      lines.push(`  fix it in the tool, then re-run: multivac change ${gate} ${slug}`);
    } else {
      // MV-147: the tool passed the artifact and, in the same output, named
      // what a later step of its own will refuse. Printed after the artifact
      // line and refusing nothing — stricter than the vendor would be a gate
      // the vendor does not define.
      for (const n of verdict.notes) {
        lines.push(
          `sdd ${name}: \`${withSlug(step.validate, slug)}\` passes and notes: ${n} — fix the delta before \`change land\``,
        );
      }
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
    // MV-113, the same rule for the ledger: a step proved by two books is a
    // step nobody can read. Refused by name rather than resolved by sort order.
    let clash: { root: SddRoot; rels: string[] } | null = null;
    for (const r of roots) {
      const { root, hits } = await slugHits(brain, r, slug, want);
      // MV-147: a land step's book is read in the checkout alone. Found only
      // in the change's worktree, once or more, it is neither read nor a
      // clash, and says nothing: a proof found there was refused by name above.
      if (hits.length > 0 && step.at === 'land' && root.dir !== r.dir) break;
      if (hits.length > 1) {
        clash = { root, rels: hits };
        break;
      }
      if (hits.length === 1) {
        hit = { root, rel: hits[0] };
        break;
      }
    }
    if (clash) {
      ok = false;
      lines.push(
        `sdd ${name}: \`change ${gate} ${slug}\` refused — ${want} matches more than one place in ${clash.root.scope}: ${clash.rels.join(', ')} — one feature directory per slug; remove or renumber the strays`,
      );
      lines.push(`  then re-run: multivac change ${gate} ${slug}`);
      continue;
    }
    // No ledger: the artifact gate above already refuses if this step was
    // supposed to leave one. Absence here is not evidence of completion, so
    // it is neither pass nor fail — it is simply nothing to read.
    //
    // MV-146, unless the ledger sits in a code repo: a change open across the
    // upgrade wrote it there, as the earlier release said to. It is named and
    // never read, and the gate refuses rather than pass over tasks it cannot
    // see (MV-90) — spec-kit's ledger is its whole close gate. Said once: when
    // the artifact loop already refused, it named the strays of that step.
    if (!hit) {
      const strays = ok ? await strayLines(brain, name, others, slug, want) : [];
      if (strays.length === 0) continue;
      ok = false;
      lines.push(
        `sdd ${name}: \`change ${gate} ${slug}\` refused — ${want}, the task ledger it reads, is not in ${where}; the one found outside the brain is not read`,
      );
      lines.push(...strays);
      lines.push(`  move the slug's directory into the brain and finish its tasks there, then re-run: multivac change ${gate} ${slug}`);
      continue;
    }
    const open = await openItems(join(hit.root.dir, hit.rel), led.pattern);
    // Principle II: name the file the ledger was READ from. After a carry it is
    // the change's worktree, not the checkout the root's name suggests.
    const read = hit.root.dir.startsWith(join(brain, '.multivac', 'worktrees'))
      ? relative(brain, join(hit.root.dir, hit.rel))
      : hit.rel;
    if (open.length === 0) {
      lines.push(`sdd ${name}: ${hit.root.scope}: ${read} — nothing left open`);
      continue;
    }
    ok = false;
    lines.push(
      `sdd ${name}: \`change ${gate} ${slug}\` refused — ${hit.root.scope}:${read} has ${open.length} open item(s) — ${led.why}`,
    );
    for (const l of open.slice(0, 3)) lines.push(`    ${l.trim()}`);
    if (open.length > 3) lines.push(`    …and ${open.length - 3} more`);
    lines.push(`  finish them in the tool, then re-run: multivac change ${gate} ${slug}`);
  }
  // The project-level document pass — the constitution, for a tool that has
  // one. Gated on EXISTING, never on its content: whether the principles are
  // any good is the part no machine can judge (MV-57), and this asks none of
  // it. What it asks are three facts (MV-76): is the file readable at all, is
  // there anything in it, and is it still carrying the fill-in tokens the
  // tool's own template ships.
  //
  // NOT `copiedFrom`. That comparison FAILS OPEN when the template cannot be
  // read — correct for a per-step artifact, and asserted by this file's tests
  // — but here it would pass a document nobody wrote whenever the template is
  // gone, which is the hole this pass exists to close. The `placeholder` ERE
  // needs no second file, so it has no such open door.
  //
  // Separate loop, like the ledger pass above: this document is per-project,
  // not per-change, so it takes no slug and has its own notion of untouched.
  //
  // PER ROOT (MV-87), and only of roots where this tool is INSTALLED — every
  // root whose state is not missing (MV-124), so a half-finished install still
  // owes its document. It used to take the first root that could answer, so
  // one repo's constitution satisfied the gate for an ecosystem of six and
  // five repos planned against a document they had never seen. "Installed" is the scope that keeps the
  // stricter question answerable: a repo that opted out, or that the tool has
  // never been scaffolded into, has no reason to own this document, and
  // refusing over it would be a gate nobody could satisfy without scaffolding
  // a repo they deliberately excluded.
  const owning: SddRoot[] = [];
  for (const root of roots) {
    if ((await initState(spec, root.dir)).state !== 'missing') owning.push(root);
  }
  for (const doc of projectDocs) {
    const refuse = (why: string): void => {
      ok = false;
      lines.push(`sdd ${name}: \`change ${gate} ${slug}\` refused — ${why}`);
      lines.push(`  ${doc.run}`);
      lines.push(`  then re-run: multivac change ${gate} ${slug}`);
    };
    // Installed nowhere: the document is missing everywhere, and the gate says
    // so once rather than falling silent for want of a root to blame.
    if (owning.length === 0) {
      refuse(`${doc.artifact} is missing or unreadable — looked in ${where}`);
      continue;
    }
    for (const root of owning) {
      // The one verdict `doctor` and `repos check` read too (MV-132, MV-135).
      // A directory, a broken symlink and an unreadable file are all missing.
      const { verdict, why } = await projectDocVerdict(root.dir, doc);
      const at = `${root.scope}:${doc.artifact}`;
      if (verdict === 'missing') {
        refuse(`${at} is missing or unreadable`);
        continue;
      }
      if (verdict === 'empty') {
        refuse(`${at} is empty`);
        continue;
      }
      // Worded apart from "missing" on purpose: the two are different problems
      // and the second one looks like success from a directory listing. Worded
      // apart from the artifact loop's template refusal too — MV-65 pins that
      // sentence to exactly one place, and this is a different check.
      if (verdict === 'template') {
        refuse(`${at} is still the unfilled template shipped by the tool (${why} — the tool asks the author to replace them)`);
        continue;
      }
      // Age is deliberately not read here. `doctor` reports STALE; the law
      // moving is not proof the principles must, and a gate on it would refuse
      // honest work on every unrelated row.
      lines.push(`sdd ${name}: ${root.scope}: ${doc.artifact} ok`);
    }
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
  if (!cfg.sddAuto || noSdd) return [];
  // MV-122: every adapter a DECLARED root resolves, not the ecosystem's alone.
  // With more than one, each line names the roots it is for, doctor's `@` form.
  const groups = adaptersByRoot(cfg, 'sdd');
  const lines: string[] = [];
  let after = -1;
  let tag = '';
  for (const [name, roots] of groups) {
    const t = groups.size > 1 ? `sdd ${name} @ ${roots.join(', ')}` : `sdd ${name}`;
    const one = stepLines(t, name, at, slug);
    lines.push(...one.lines);
    if (one.ran) {
      after = lines.length;
      tag = t;
    }
  }
  // MV-95: the chain runs unattended. The lifecycle already REFUSES to advance
  // without each step's artifact, so the sequence was never a choice — asking
  // permission between steps costs a confirmation per step and decides nothing.
  // The opt-out goes on the same line: that is the difference between a tool
  // that assumes and a tool that decides for you.
  //
  // "A question the tool itself raises" is not "may I continue". An agent that
  // cannot tell them apart will either never stop or always stop, so the line
  // names the distinction rather than leaving it to be inferred.
  //
  // MV-146: once per point, after its last step — the chain is the point's
  // steps together, and the same line after every step was seven copies per
  // spec-kit change. None when no step printed: there is no chain to run.
  if (after >= 0) {
    lines.splice(
      after,
      0,
      `${tag}: run the chain through without asking to continue — stop only for a ` +
        `question the tool itself raises (\`--no-sdd\` for one run, \`sdd_auto: false\` to stop printing these)`,
    );
  }
  return lines;
}

/**
 * One adapter's lines for this lifecycle point, each under `tag`, and whether
 * any of them is a step to run — the instruction after them is the caller's.
 */
function stepLines(tag: string, name: string, at: LifecyclePoint, slug: string): { lines: string[]; ran: boolean } {
  const spec = sddSpec(name);
  if (!spec) {
    return {
      lines: [`${tag}: unknown adapter — known: ${sddNames.join(', ')}; fix sdd: in ${CONFIG_PATH}`],
      ran: false,
    };
  }
  const steps = stepsAt(spec, at);
  if (steps.length === 0) {
    return { lines: [`${tag}: ${at} — this tool has no agent-run ${at} step; nothing to run`], ran: false };
  }
  // MV-147: a step's guide goes on the line under it, three spaces after the
  // tag — the rest of what the vendor's own command body said, printed where
  // the step comes up and nowhere else — so the caller's instruction, spliced
  // in after the point's last line, stays last.
  const lines: string[] = [];
  for (const s of steps) {
    lines.push(`${tag}: ${withSlug(s.run, slug)} [${proofOf(s, slug)}]`);
    if (s.guide) lines.push(`${tag}:   ${withSlug(s.guide, slug)}`);
  }
  return { lines, ran: true };
}
