// `multivac doctor` — what is declared, what was found, what is degraded,
// how to fix it. Read-only, never mutates, never clones, exit 0 unless the
// config itself is invalid.

import { lstat, readFile, readlink, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { Anchor, Command, Config } from '../types.js';
import { surfaceFrom, undeclared } from '../lib/args.js';
import { parseArgs, type ArgsDef } from 'citty';
import {
  BRAIN_PATHS,
  CONFIG_PATH,
  ConfigError,
  channelRef,
  layoutError,
  loadConfig,
} from '../lib/config.js';
import { sectionDoors } from '../doors/brain.js';
import { CANONICAL_DOOR, hasGrapherSection } from '../doors/link.js';
import * as git from '../lib/git.js';
import { initState, stateLabel } from '../lib/init-state.js';
import { andList, say, warn } from '../lib/out.js';
import {
  binaryMissing,
  doorTargets,
  grapherSpec,
  unverifiedGrapher,
  sddSpec,
  type AdapterSpec,
} from '../adapters/registry.js';
import {
  adapterFor,
  adaptersByRoot,
  askedGraphers,
  brainHoldsCode,
  brainHooks,
  brainRefreshGraphers,
  type BrainHook,
  hookRefreshes,
  clashSentence,
  refreshClashes,
  type ReadOnly,
  type SddRoot,
  missingRequired,
  pathExists,
  readOnly,
  sddGoverning,
  sddRoots,
} from '../adapters/detect.js';
import { flowLines, proofOf, scaffoldCommands, stepsGating } from '../adapters/sdd.js';
import {
  cloneFix,
  cloneState,
  leftoverBodies,
  leftoverGraphs,
  leftoverNoun,
  leftoverSdds,
  projectDocVerdict,
  type LeftoverGraph,
} from '../lib/repo-state.js';
import { graphScopes, ignoredDirs, ignoreLinesToAdd, nodesUnder, readIgnoreLines, type GraphScope } from '../adapters/refresh.js';
import { graphIgnoreLines, mountDir } from '../lib/code-in-change.js';
import { readLaw } from '../change/reserve.js';
import {
  HOOKS_DIR,
  INACTIVE_FIX,
  MANUAL_CHAIN_LINE,
  PRECOMMIT_MISSING_FIX,
  chainedHooks,
  findRunner,
  preCommitGate,
  resolveHooksPath,
  runsMultivac,
} from '../hooks/install.js';
import { collectBrainAnchors } from '../anchor/parse.js';
import type { ParseResult } from '../anchor/parse.js';
import { excludeGlobs, makeMatcher } from '../lib/glob.js';
import { ENACTMENT_UNGATEABLE } from './verify.js';

const BEGIN = '<!-- multivac:begin -->';
const label = (s: string): string => s.padEnd(11);

/**
 * A root no adapter of this kind resolves for, while another root does — or a
 * read-only root, where `why` says why multivac may not write (MV-125). An
 * exclusion is an ordinary configuration, so it reads as a fact about scope and
 * never as a deficiency (MV-87, MV-122). No install state, no command to run:
 * either would read as a gap to fix by writing where nothing may be written.
 * The grapher's per root; the SDD's is the governs line since MV-146, which
 * runs it in the brain alone.
 */
const outOfScope = (kind: 'sdd' | 'grapher', scope: string, name?: string, why?: ReadOnly): string =>
  label(kind) +
  `${name ?? 'none'} @ ${scope}: ${why ? `${why}, read-only` : `no ${kind} declared for this repo`} — out of scope, not a gap`;

function fmtAge(ms: number): string {
  const m = Math.round(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

async function presentRepoDirs(brain: string, cfg: Config): Promise<string[]> {
  const dirs: string[] = [];
  for (const e of Object.values(cfg.repos)) {
    if (e.isBrain) continue; // the brain dir is always searched separately
    const d = resolve(brain, e.path);
    if (await pathExists(d)) dirs.push(d);
  }
  return dirs;
}

/** One door target's state: ok / stale / missing managed block / missing. */
async function doorState(brain: string, name: string): Promise<string> {
  const t = doorTargets[name];
  if (!t) {
    return `${name}: unknown target — known: ${Object.keys(doorTargets).join(', ')}; fix doors: in ${CONFIG_PATH}`;
  }
  // A harness that reads AGENTS.md itself needs no projection: its state is
  // the canonical door's state, and `init` is what writes that.
  const readsCanonical = t.kind === 'canonical' || t.kind === 'native';
  const p = join(brain, t.door);
  const st = await lstat(p).catch(() => null);
  if (!st) {
    const fix = readsCanonical ? 'multivac init .' : 'multivac doors';
    return `${name}: ${t.door} missing → run \`${fix}\``;
  }
  if (t.kind === 'symlink' && st.isSymbolicLink()) {
    const target = await readlink(p).catch(() => '');
    const canonical = doorTargets.agents.door;
    return resolve(dirname(p), target) === join(brain, canonical)
      ? `${name}: ${t.door} ok (symlink)`
      : `${name}: ${t.door} stale — symlink points at ${target}, expected ${canonical} → run \`multivac doors\``;
  }
  // canonical, native, or stub: the tool's content must live in the managed
  // block. A symlink target found as a regular file lands here too.
  const text = await readFile(p, 'utf8').catch(() => '');
  if (!text.includes(BEGIN)) {
    return `${name}: ${t.door} missing managed block → run \`multivac doors\``;
  }
  return `${name}: ${t.door} ok${t.kind === 'native' ? ' (read natively)' : ''}`;
}

/**
 * The project-level document — the constitution, for a tool that has one.
 * Reported here, never judged: whether its CONTENT still fits the product is a
 * judgement no machine can make (MV-57). What a machine CAN say is that the law
 * moved and the constitution did not — exactly the drift this tool hunts — and
 * that it is absent or still a template, which `change plan` refuses over
 * (MV-76). This report's own wording is unchanged by that gate: STALE stays a
 * report here and nowhere refuses.
 */
async function projectDocLines(
  brain: string,
  name: string,
  spec: AdapterSpec,
  roots: SddRoot[],
): Promise<string[]> {
  const steps = spec.projectSteps ?? [];
  if (steps.length === 0) {
    return [
      label('sdd') +
        `${name} project law — this tool has no project-level document; nothing to create, nothing to keep fresh`,
    ];
  }
  // The newest law row is the product's own high-water mark.
  const law = await readLaw(brain);
  const newest = (law?.rows ?? [])
    .map((r) => r.date)
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort()
    .at(-1);
  const out: string[] = [];
  for (const p of steps) {
    // Per root (MV-87). It used to take the first root that could answer, so
    // in an ecosystem of six one repo's constitution was reported as the
    // product's and five repos without one read as satisfied. Reported for
    // every root the tool APPLIES to, installed or not — since MV-146 the
    // brain alone — because a report that hid a missing document until
    // somebody scaffolded the root would hide it exactly when it is most worth
    // saying.
    for (const root of roots) {
      const path = join(root.dir, p.artifact);
      const st = await stat(path).catch(() => null);
      let found: string | null = null;
      // MV-132: one verdict for doctor, `repos check` and the gate. Scaffolded
      // is not written, and neither is empty: a 0-byte file used to read as present.
      const { verdict, why } = await projectDocVerdict(root.dir, p);
      if (p.reportOnly) {
        // MV-135: a report-only document is a key, reported and never gated.
        found = verdict === 'written'
          ? `${p.artifact} \`${p.reportOnly.key}:\` written — reported, never gated`
          : `${p.artifact} ${why ?? verdict} → ${p.run} (optional: reported, never gated)`;
      } else if (st && verdict === 'empty') {
        found = `${p.artifact} is empty → ${p.run}`;
      } else if (st) {
        if (verdict === 'template') {
          found = `${p.artifact} is still the unfilled template shipped by the tool (${why}) → ${p.run}`;
        } else {
          const day = new Date(st.mtimeMs).toISOString().slice(0, 10);
          found =
            newest && newest > day
              ? `${p.artifact} present (last modified ${day}) but the law's newest row is ${newest} — STALE: the law moved while this did not; a report, never a gate`
              : `${p.artifact} present (last modified ${day})${newest ? `, law's newest row ${newest}` : ''} — fresh`;
        }
      }
      out.push(
        label('sdd') +
          `${name} project law @ ${root.scope}: ${found ?? `${p.artifact} missing → ${p.run}`}`,
      );
    }
    // The revisit cadence is the tool's, not a checkout's: said once.
    out.push(label('sdd') + `${name} project law — revisit: ${p.revisit}`);
  }
  return out;
}

/**
 * MV-146. An enabled preset whose template a skeleton override outranks. The
 * vendor's resolver reads the override directory before any preset, so a
 * preset added after the scaffold is shadowed and says nothing about it; this
 * is where it is said, with the file to delete to let the preset win.
 *
 * Every path and id comes from the skeleton's `presets`, measured per version
 * (Principle V: the entry is data, the dispatch is never on a name). A preset
 * in `propagates` ships no template of its own and writes into the core ones
 * the skeleton shadows, so every override outranks it. Absent or unreadable
 * is silence — a report, never a guess.
 */
async function presetLines(rootDir: string, spec: AdapterSpec): Promise<string[]> {
  const sk = spec.scaffold?.skeleton;
  const layout = sk?.presets;
  if (!sk || !layout) return [];
  let presets: Record<string, { enabled?: unknown }>;
  try {
    const reg = JSON.parse(await readFile(join(rootDir, layout.registry), 'utf8')) as {
      presets?: Record<string, { enabled?: unknown }>;
    };
    presets = reg?.presets ?? {};
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const [id, p] of Object.entries(presets)) {
    if (p?.enabled !== true) continue;
    for (const file of Object.keys(sk.files)) {
      if (!(await pathExists(join(rootDir, sk.dir, file)))) continue;
      const ships = await pathExists(join(rootDir, layout.templates.replace('<id>', id), file));
      if (!ships && !layout.propagates.includes(id)) continue;
      out.push(
        label('sdd') + `preset ${id} is outranked for ${file} by ${sk.dir}/${file} — delete that override to let the preset win`,
      );
    }
  }
  return out;
}

/**
 * The SDD, per root (MV-87) — the shape `grapherLines` below has always had.
 *
 * It used to collapse every root into one boolean and stop at the first hit,
 * so a single sibling repo somebody had scaffolded by hand made the whole
 * ecosystem read `artifact ok` while the brain and four repos had nothing. The
 * state is the vendor's own files' now (MV-124), so a directory made by hand
 * reads partial rather than installed.
 *
 * MV-146: the one root the SDD runs in is the brain, so its install, flow,
 * gates and project document are the brain's alone. A code repo gets no
 * verdict of its own: one line names the repos whose code the brain's SDD
 * governs and those exempt by `sdd: none`, and a writable one still holding
 * an install from an earlier release gets a leftover line — a report, with the
 * removal, never a failure. A read-only repo is never named (MV-125). With no
 * SDD in the brain there is no line at all, as before. MV-147: the command
 * bodies an earlier init left in the brain itself get one such line too.
 */
async function sddLines(brain: string, cfg: Config): Promise<string[]> {
  const roots = await sddRoots(brain, cfg);
  const root = roots.find((r) => r.scope === 'brain')!;
  const name = root.sdd;
  const spec = name ? sddSpec(name) : undefined;
  // No SDD in the brain: silence, as it always was. `loadConfig` refuses a
  // name the registry does not know (MV-146), so a resolved name has a spec.
  // A code repo's own install of a tool this ecosystem declares nowhere is
  // that team's, not a leftover of an earlier release, so it is not named.
  if (!name || !spec) return [];
  const out: string[] = [];
  const auto = !cfg.sddAuto
    ? 'sdd_auto: false — the lifecycle prints nothing and gates nothing; run the steps yourself'
    : "sdd_auto on — the lifecycle prints this tool's own steps and refuses to move on without their artifacts";
  // The lookup reads the brain's own node_modules/.bin (MV-123).
  const missing = await missingRequired(spec, root.dir);
  // A declared tool that has never run here is a state worth reporting, and
  // reporting is all doctor may do: the init writes the vendor's files into
  // the tree, and doctor is a report. It names the command; the lifecycle
  // runs it — unless `sdd_auto: false`, under which nothing runs it (MV-146).
  const sc = spec.scaffold;
  const st = await initState(spec, root.dir);
  let state: string = st.state;
  if (st.state === 'missing') {
    state = `missing (no ${stateLabel(spec)})`;
    if (sc) {
      const init = scaffoldCommands(sc, cfg.doors).commands.join(' && ');
      const who = cfg.sddAuto
        ? `\`change new\` runs the tool's own \`${init}\``
        : `under \`sdd_auto: false\` no command runs the tool's own \`${init}\`: run it there yourself`;
      state += ` — declared but never run here; ${who}, doctor never does (it writes the vendor's files into the tree)`;
    }
    // MV-146: the same run is the only one that writes the skeleton, so the
    // report names it where it names the run, and not where no run will come.
    if (sc?.skeleton && cfg.sddAuto) state += `; that run then writes multivac's skeleton templates to ${sc.skeleton.dir} if it is absent`;
  } else if (st.state === 'unevaluable') {
    // Unreadable is not uninstalled: the fix is the file's permissions, never an init.
    state = `unevaluable (${st.reason}) — make it readable; no init is run over it`;
  } else if (st.state === 'partial') {
    state = `partial (${st.reason})`;
    if (sc) state += ` — the lifecycle will not run the init over it, since a re-run can revert edited files; run \`${scaffoldCommands(sc, cfg.doors).commands.join(' && ')}\` there yourself`;
  }
  const bin = missing.length === 0 ? 'binary ok' : `binary missing → ${binaryMissing(name, spec, missing, root.scope)}`;
  out.push(label('sdd') + `${name} @ ${root.scope}: ${state} · ${bin} · ${auto}`);
  // MV-147: the command bodies an earlier init left in the brain, once the
  // scaffold installs none. Nothing prints them any more, and a harness still
  // lists them every session, so the operator is told they are there and how
  // they go. A report, never a failure; no law ID, since the site shows the
  // line; `git rm -r` for tracked entries only, since it refuses a pathspec
  // matching no tracked file.
  const bodies = sc?.bodies ? await leftoverBodies(root.dir, spec) : [];
  if (bodies.length > 0) {
    const tracked = bodies.filter((b) => b.tracked).map((b) => b.path);
    const untracked = bodies.filter((b) => !b.tracked).map((b) => b.path);
    const notCode = 'they are not code, so the commit needs no open change';
    const rm = `\`git rm -r ${tracked.join(' ')}\` removes them`;
    const del = `${untracked.join(' ')} are untracked: delete them`;
    const how = untracked.length === 0 ? `${rm}; ${notCode}` : tracked.length === 0 ? del : `${rm}, and ${del}; ${notCode}`;
    out.push(label('sdd') + `${name} @ ${root.scope}: an earlier init left command bodies no printed step names — ${how}`);
  }
  // Whose code it governs, only where there is a code repo to name — a brain
  // that is its own only repo has nothing to add here — and only with the
  // automation on: under `sdd_auto: false` the code gate is off (MV-137), so
  // nothing governs anything, and the consumer door says nothing either.
  const code = Object.keys(cfg.repos).filter((k) => !cfg.repos[k].isBrain);
  if (cfg.sddAuto && code.length > 0) {
    const governed = code.filter((k) => sddGoverning(cfg, k) !== undefined);
    const exempt = code.filter((k) => sddGoverning(cfg, k) === undefined);
    out.push(
      label('sdd') +
        `${name} governs the code of ${governed.join(', ') || 'no code repo'} — its steps run in the brain` +
        (exempt.length > 0 ? `; exempt (sdd: none): ${exempt.join(', ')}` : ''),
    );
  }
  out.push(...(await presetLines(root.dir, spec)));
  // An install an earlier release left in a writable code repo: the same
  // leftover whichever SDD the brain now declares, and naming it is how it
  // goes away. A read-only repo is never named (MV-125).
  for (const r of roots) {
    if (r.scope === 'brain' || r.readOnly) continue;
    for (const l of await leftoverSdds(r.dir)) {
      const left = sddSpec(l.sdd)!;
      const fix = left.leftover ?? `delete ${stateLabel(left)} there`;
      out.push(label('sdd') + `leftover ${l.sdd} install @ ${r.scope}: ${l.file} (${l.tracked ? 'tracked' : 'untracked'}) — ${fix}`);
    }
  }
  // The tool's whole flow, in its own order and length, each step with the
  // artifact that proves it ran — or the reason nothing ever could. Under
  // `sdd_auto: false` no command refuses, and the lines do not say one does
  // (MV-146): the proof is still what the step leaves.
  const off = ' — not gated (`sdd_auto: false`)';
  const flow = cfg.sddAuto
    ? flowLines(spec)
    : (spec.steps ?? []).map((s) => `${s.at}: ${s.run} [${s.artifact ? `proof: ${s.artifact}${off}` : proofOf(s)}]`);
  for (const l of flow) out.push(label('sdd') + `${name} flow — ${l}`);
  // Which lifecycle commands actually refuse, and which cannot for this tool.
  const gates = (['plan', 'apply', 'close'] as const).map((g) => {
    if (!cfg.sddAuto) return `change ${g}: not gated (\`sdd_auto: false\`)`;
    const on = stepsGating(spec, g);
    return on.length > 0
      ? `change ${g}: refuses without ${on.map((s) => s.artifact).join(', ')}`
      : `change ${g}: not gated — this tool declares no step to prove there`;
  });
  out.push(label('sdd') + `${name} gates — ${gates.join(' · ')}`);
  out.push(...(await projectDocLines(brain, name, spec, [root])));
  return out;
}

/** Artifact older than the repo's last commit = stale. Best-effort. */
async function graphStale(dir: string, spec: AdapterSpec): Promise<boolean> {
  for (const a of spec.artifacts) {
    const st = await stat(join(dir, a)).catch(() => null);
    if (!st) continue;
    const ct = Number(
      await git.run(dir, ['log', '-1', '--format=%ct']).catch(() => 'NaN'),
    );
    return Number.isFinite(ct) && st.mtimeMs < ct * 1000;
  }
  return false;
}

/** A directory as the human types it: single-quoted when it holds whitespace or a quote. */
const typed = (dir: string): string => (/[\s'"]/.test(dir) ? `'${dir.replace(/'/g, `'\\''`)}'` : dir);

/**
 * A grapher's files removed from a checkout: the vendor's own removal where
 * the entry declares one (`remove`, codegraph's `uninit --force`), else its
 * artifact and ignore file out of git and off the disk, with the top directory
 * of its `local` globs.
 */
function removalOf(spec: AdapterSpec): string {
  const top = spec.local.map((g) => g.split('/')[0]).find((t) => !/[*?[{]/.test(t));
  const art = spec.artifacts[0];
  const files = [art, ...(spec.graphignoreFile ? [spec.graphignoreFile] : [])];
  const gone = [top ?? art, ...(spec.graphignoreFile ? [spec.graphignoreFile] : [])];
  return spec.remove ?? `git rm -q --ignore-unmatch -- ${files.join(' ')} && rm -${top ? 'rf' : 'f'} ${gone.join(' ')}`;
}

/**
 * MV-149. A code repo holding the artifact of a grapher it does not resolve,
 * while that grapher's hook would refresh it there: every hook of ours passes
 * its toplevel test in any repo holding its artifact, so two graphers' hooks
 * race for that repo's one lock on each edit and whichever takes it first
 * refreshes (MV-58). Only where the hook is declared (`hookRefreshes`), wired
 * on this machine — the brain's own by `doors`' lookup in the brain, a follow
 * hook by `brainHooks`' answer — and reaches the binary from this repo, where
 * it looks after moving in; the fact and the removal, never a fix. `doctor`
 * decides nothing by it: the exit code is unchanged.
 */
async function foreignFacts(brain: string, cfg: Config, s: GraphScope, hooks: BrainHook[]): Promise<string> {
  if (s.scope === 'brain' || s.readOnly) return '';
  let out = '';
  for (const l of await leftoverGraphs(cfg, s.dir, s.scope)) {
    const spec = grapherSpec(l.name, cfg.graphers);
    const listed = brainRefreshGraphers(cfg).find((g) => g.name === l.name);
    if (spec === null || l.artifact === undefined || listed === undefined || !hookRefreshes(cfg, l.name)) continue;
    const wired = listed.follow
      ? hooks.some((h) => h.kind === 'follow' && h.name === l.name)
      : (await missingRequired(spec, brain)).length === 0;
    if (!wired || (await missingRequired(spec, s.dir)).length > 0) continue;
    out +=
      ` · also holds ${l.artifact} of ${l.name}` + ', which it does not resolve — ' +
      `${l.name}'s post-edit hook refreshes it there; remove it: cd ${typed(s.dir)} && ${removalOf(spec)}`;
  }
  return out;
}

/**
 * MV-148. A grapher install kept in a brain that holds no code, with its
 * removal — printed, never run (MV-129: `doctor` runs no vendor). Everything
 * in it is read off the registry entry, never off the grapher's name: the
 * vendor's own uninstall per platform found, the one its entry marks
 * `uninstallFirst` leading (gemini's stops early once another's has removed
 * the shared section, measured on graphify 0.9.29); then the vendor's own
 * removal (`remove`, codegraph's `uninit --force`), or removing its files. The
 * uninstall drops the whole hook group it wrote, a command a human added to
 * it included, and leaves the emptied list behind, so the human is told to
 * review the diff before committing.
 */
function leftoverGraphLine(brain: string, cfg: Config, l: LeftoverGraph): string | null {
  const spec = grapherSpec(l.name, cfg.graphers);
  if (!spec) return null;
  const local = l.kind === 'local';
  const what = leftoverNoun(l);
  const file = l.artifact ?? (l.stateDir ? `${l.stateDir}/` : l.ignoreFile);
  const named = [...l.platforms, ...(file ? [file] : [])];
  const found = l.platforms.length > 0 ? `platforms ${andList(named)}` : andList(named);
  const state = local ? 'local' : l.tracked ? 'tracked' : 'untracked';
  const hooked = l.platforms.length > 0 && spec.harness;
  // MV-143: a section only where a platform found writes one, hooks only where
  // one writes a hook that sends the agent to the graph — graphify's `agents`
  // platform writes a skill and neither.
  const at = Object.values(spec.harness?.platforms ?? {}).filter((p) => l.platforms.includes(p.key));
  const section = at.some((p) => p.section !== 'none');
  const hooks = at.some((p) => p.hooks);
  const sends = section && hooks ? 'section and hooks still send' : section ? 'section still sends' : hooks ? 'hooks still send' : null;
  const kept =
    `kept until you remove it; it ${local ? 'indexes' : 'graphs'} none of the code` +
    (sends ? `, and ${l.name}'s own ${sends} agents to it` : '');
  const steps = [...(hooked ? l.platforms.map((k) => spec.harness!.uninstall.replace('{key}', k)) : []), removalOf(spec)];
  const tail = hooked
    ? '; review `git diff` (the uninstall drops the whole hook group it wrote, commands you added to it included, and leaves an emptied hook list in each settings file it touched), then `multivac doors` and commit'
    : local
      ? ', then `multivac doors`'
      : ', then `multivac doors` and commit';
  return (
    label('grapher') +
    `leftover ${l.name} ${what} @ brain: ${found} (${state}) — ${kept}. ` +
    `Remove: cd ${typed(brain)} && ${steps.join(' && ')}${tail}`
  );
}

async function grapherLines(brain: string, cfg: Config): Promise<string[]> {
  // The same list the lifecycle builds from, not a second copy of it: a report
  // and a runner that enumerate the scopes separately can disagree about which
  // scopes exist, and the report is the only one anybody reads.
  const scopes = await graphScopes(brain, cfg);
  // MV-148: a brain that holds no code resolves no grapher. Where one is asked
  // from it, or an install an earlier release left is found, it says so, in
  // place of the out-of-scope line: "no grapher declared" was false there.
  const holds = brainHoldsCode(cfg);
  const leftovers = holds ? [] : await leftoverGraphs(cfg, brain);
  const codeless = !holds && (askedGraphers(cfg).size > 0 || leftovers.length > 0);
  // No present root resolves a grapher: silence, as the SDD pass has it.
  if (!scopes.some((s) => s.name) && !codeless) return [];
  // MV-149: this machine's answer for each follow hook, the one `doors` wires
  // by, read once for the refresh path and each repo's foreign-artifact fact.
  const hooks = await brainHooks(cfg, brain);
  const out: string[] = [];
  for (const s of scopes) {
    if (s.scope === 'brain' && codeless) {
      // Never a refresh, a build or an install for this brain (MV-148): the
      // fact, then each kept install with its removal.
      out.push(
        label('grapher') +
          "brain: holds no code (no repos entry is the brain), so no code graph is built, gated or refreshed here — agents here ask the code repos' graphs; if this repo holds code, add `brain: .` under repos:",
      );
      for (const l of leftovers) {
        const line = leftoverGraphLine(brain, cfg, l);
        if (line !== null) out.push(line);
      }
      continue;
    }
    if (!s.name || s.readOnly) {
      // `grapher: none`, or nothing resolving here: scope, never an unverified
      // tool called `none` (MV-122). A read-only root is scope too, with no
      // NOT COMMITTED or IGNORED line: nothing may commit there (MV-125).
      out.push(outOfScope('grapher', s.scope, s.name, s.readOnly) + (await foreignFacts(brain, cfg, s, hooks)));
      continue;
    }
    const spec = grapherSpec(s.name, cfg.graphers);
    if (spec === null) {
      // Unverified: doctor cannot probe an artifact nobody declared, and it
      // will not invent one to probe. It says exactly what to write instead.
      out.push(label('grapher') + `${s.name} @ ${s.scope}: ${unverifiedGrapher(s.name)}`);
      continue;
    }
    const missing = await missingRequired(spec, s.dir);
    const bin = missing.length === 0;
    const st = await initState(spec, s.dir);
    const kind = spec.artifactKind ?? 'shared';
    const art = spec.artifacts[0];
    let msg = `${s.name} @ ${s.scope}: `;
    if (st.state !== 'installed') {
      // Not built here (MV-124): the command that BUILDS the graph, which is
      // not always the one that refreshes it. An unevaluable root gets neither.
      const create = spec.create ?? spec.refresh;
      msg += st.state === 'missing' ? `missing (no ${art})` : `${st.state} (${st.reason})`;
      if (st.state === 'unevaluable') msg += bin ? '' : ` · binary missing → ${binaryMissing(s.name, spec, missing, s.scope)}`;
      else msg += bin ? ` → run \`${create}\` there` : ` · binary missing → ${binaryMissing(s.name, spec, missing, s.scope)}, then \`${create}\``;
    } else if (!bin) {
      msg += `installed (${kind}) · binary missing → ${binaryMissing(s.name, spec, missing, s.scope)} (graph cannot refresh)`;
    } else if (await graphStale(s.dir, spec)) {
      msg += `installed (${kind}) · binary ok · graph STALE (older than last commit) → run \`${spec.refresh}\` there`;
    } else {
      msg += `installed (${kind}) · binary ok · fresh`;
    }
    // MV-103, reported here and gated at close: a shared graph HEAD does not
    // hold is one the next clone does not. A local one is never asked (MV-124).
    // `doctor` never gates, so it says it.
    if (st.state === 'installed' && kind === 'shared' && !(await git.inHead(s.dir, art))) {
      msg +=
        (await git.ignoredPaths(s.dir, [art])).length > 0
          ? ` · IGNORED by .gitignore → remove the rule, then \`git -C ${s.dir} add ${art}\`, then commit it`
          : ` · NOT COMMITTED → \`git -C ${s.dir} add ${art}\`, then commit it`;
    }
    if (st.state === 'installed') msg += await ignoreFacts(brain, cfg, s, spec);
    // MV-131: the grapher's own install into each declared harness. Reported
    // from its probe file; doctor runs nothing.
    if (spec.harness) {
      const absent: string[] = [];
      for (const door of cfg.doors) {
        const p = spec.harness.platforms[door];
        if (p && !(await pathExists(join(s.dir, p.probe)))) absent.push(p.key);
      }
      if (absent.length > 0) {
        msg += ` · harness install missing for ${absent.join(', ')} → ${absent.map((k) => `\`${spec.harness!.run.replace('{key}', k)}\``).join(', ')}`;
      }
      // MV-140: the door cites the tool's own section instead of its verbs, so
      // a door file without that section leaves the agent with names only.
      // MV-143: asked of the platforms that WRITE the section, by the same rule
      // the door uses, and the command offered is one of those platforms. This
      // named `--platform agents` for a platform that writes only a skill, so
      // the repair it printed could not repair anything. Where no declared
      // platform writes the section, the door does not cite it and there is
      // nothing to report.
      const writes = sectionDoors(cfg, spec);
      if (writes.length > 0 && !(await hasGrapherSection(s.dir, s.name))) {
        msg += ` · ${CANONICAL_DOOR} has no \`## ${s.name}\` section, which the door cites → \`${spec.harness.run.replace('{key}', spec.harness.platforms[writes[0]!]!.key)}\``;
      }
    }
    msg += await foreignFacts(brain, cfg, s, hooks);
    out.push(label('grapher') + msg);
  }
  // MV-140: asking the graph is the agent's, and nothing records it.
  if (out.length > 0) {
    out.push(label('grapher') + 'navigation: ungateable — no committed file records that a graph was asked before the tree was read; a nudge, never a gate');
  }
  if (out.length > 0) out.push(label('grapher') + (await refreshPath(cfg, hooks)));
  return out;
}

/**
 * MV-148, FR-030. What the grapher's ignore file lacks at an installed root
 * whose artifact is committed, read only — `doctor` never writes it, since a
 * line appended over a built graph made every plain refresh refuse; the next
 * `change land` naming the root appends, and rebuilds only where the graph
 * holds nodes under what it appended. The derived lines the file does not
 * hold in any spelling, a file no clone or worktree receives, and the nodes
 * the graph still holds under its directory lines, with the rebuild to run.
 * Only this root's grapher line is reached, so a read-only root gets none.
 * MV-149: a JSON ignore file has facts of its own (`jsonIgnoreFacts`).
 */
async function ignoreFacts(brain: string, cfg: Config, s: GraphScope, spec: AdapterSpec): Promise<string> {
  const file = spec.graphignoreFile;
  if (file && spec.graphignoreJson) return jsonIgnoreFacts(brain, cfg, s, spec, file, spec.graphignoreJson.key);
  if (!file || spec.artifactKind !== 'shared') return '';
  const text = await readFile(join(s.dir, file), 'utf8').catch(() => null);
  let out = '';
  const lack = ignoreLinesToAdd(text ?? '', graphIgnoreLines(cfg, brain, s.scope, spec));
  if (lack.length > 0) {
    out +=
      ` · ${file} lacks ${lack.length} line(s) multivac keeps out of the graph (${lack.join(', ')}) — ` +
      `the next \`change land\` naming ${s.scope} appends them, and rebuilds if the graph holds nodes under them`;
  }
  if (text !== null && !(await git.inHead(s.dir, file))) out += ` · ${file} is not committed — a clone or worktree graphs without it`;
  const held = await nodesUnder(spec, s.dir, ignoredDirs(text ?? '', false));
  if (held > 0 && spec.rebuild) {
    out += ` · the graph still holds ${held} node(s) under ${file}'s lines — a plain refresh refuses to shrink; run \`${spec.rebuild}\` there`;
  }
  return out;
}

/**
 * MV-149, FR-023. The facts of a root whose grapher's ignore file is JSON
 * (`graphignoreJson`: codegraph's `codegraph.json`), reading only — `doctor`
 * never writes it. One of four: a file that does not parse to an object
 * with its list, which the tool ignores too; a file git ignores, which land
 * refuses by name; a file no clone or worktree receives, since it is not
 * committed; or the lines it lacks, which the next `change land` naming the
 * root adds — land writes over none of the other three. No node count: that would read the vendor's database, outside the
 * files-only probe (MV-124), and its next `sync` purges what a line newly
 * excludes. Nothing where the root keeps no line out. The HEAD read is here,
 * never in refresh.ts (MV-103).
 */
async function jsonIgnoreFacts(
  brain: string,
  cfg: Config,
  s: GraphScope,
  spec: AdapterSpec,
  file: string,
  key: string,
): Promise<string> {
  const lines = graphIgnoreLines(cfg, brain, s.scope, spec);
  if (lines.length === 0) return '';
  const r = await readIgnoreLines(spec, s.dir, lines);
  if (r.malformed !== undefined) {
    return ` · ${file} does not parse to an object with an ${JSON.stringify(key)} list — ${s.name} ignores it too; add ${lines.join(' ')} by hand`;
  }
  const committed = await git.inHead(s.dir, file);
  // A file git ignores, which land refuses by name and never writes (FR-022):
  // "the next land adds them" would promise what land will not do.
  if (!committed && (await git.ignoredPaths(s.dir, [file])).length > 0) {
    return ` · ${file} is ignored in ${s.dir} — \`git -C ${s.dir} check-ignore -v ${file}\` names the rule; \`change land\` writes nothing while it is`;
  }
  if (r.exists && !committed) {
    const mount = mountDir(cfg);
    const indexes = mount !== undefined && lines.includes(`/${mount}/`)
      ? 'with its mount initialised indexes the mount'
      : `indexes what it keeps out (${lines.join(', ')})`;
    return ` · ${file} is not committed — a clone or worktree ${indexes}`;
  }
  if (r.lacking.length === 0) return '';
  return (
    ` · ${file} lacks ${r.lacking.length} line(s) multivac keeps out of the index (${r.lacking.join(', ')}) — ` +
    `the next \`change land\` naming ${s.scope} adds them`
  );
}

/**
 * Where the refresh actually comes from. The harness post-edit hook is the
 * live path when a declared door target has one; git hooks never refresh.
 *
 * MV-148: in a brain that holds no code that hook follows edits into the code
 * repos' checkouts, and `brainHooks` — the answers `doors` wires by — says
 * whether it is wired and, where it is not, why, in the words `doors` prints.
 * Where a repo reaches the binary only in its own node_modules/.bin, the hook
 * runs nothing in that repo's change worktrees, which hold none: said here,
 * the one place that reads this machine's disk for it. A brain that holds
 * code, with no sibling on another grapher, keeps the line it always had.
 *
 * MV-149: one hook per grapher. Where several are in play — a code-less
 * brain whose repos resolve several graphers, or a brain that holds code with
 * a sibling on another — the line names each grapher whose hook is wired, and
 * per grapher why one is not and where one does not reach. The land clause is
 * by the artifact's kind — a local index is built in each change worktree at
 * apply and synced at land, never committed, where a shared graph is
 * committed. Graphers writing one artifact are named in every shape of the
 * line, in the sentence `doors`' notice prints (`clashSentence`), so the two
 * surfaces give one answer (FR-016).
 */
async function refreshPath(cfg: Config, hooks: BrainHook[]): Promise<string> {
  const postEdit = cfg.doors.filter((d) => doorTargets[d]?.hookConfig?.postEdit);
  const only = 'refresh path: `change land` and `change close` only — ';
  const never = ' · git hooks never refresh';
  if (postEdit.length === 0) return `${only}no declared harness has a post-edit hook${never}`;
  const installed = ' (installed when the binary is present)';
  const net = ' · `change close` is the net';
  const verified = (name: string): boolean => grapherSpec(name, cfg.graphers) !== null;
  const isLocal = (name: string): boolean => grapherSpec(name, cfg.graphers)?.artifactKind === 'local';
  // MV-149: what land does, by the artifact's kind — a local index is built in
  // each change worktree at apply and synced at land, never committed. The
  // several-grapher clause says the apply half too, so no shape of this line
  // tells a session with a local grapher that land is where its index is made.
  const landOf = (names: string[]): string => {
    if (names.length <= 1) {
      return names.length === 1 && isLocal(names[0]!)
        ? '`change apply` builds the index in each change worktree and `change land` syncs it, never committed'
        : '`change land` commits it on the change branch';
    }
    const local = names.filter(isLocal).map((n) => `${n}'s`);
    const shared = names.filter((n) => !isLocal(n)).map((n) => `${n}'s`);
    return `\`change land\` ${[
      ...(shared.length > 0 ? [`commits ${andList(shared)} ${shared.length > 1 ? 'graphs' : 'graph'} on the change branch`] : []),
      ...(local.length > 0
        ? [`syncs ${andList(local)} ${local.length > 1 ? 'indexes' : 'index'}, which \`change apply\` builds in each change worktree, never committed`]
        : []),
    ].join(' and ')}`;
  };
  const holds = brainHoldsCode(cfg);
  const own = holds ? adapterFor(cfg, 'brain', 'grapher') : undefined;
  const clashes = refreshClashes(cfg).map(clashSentence);
  const clashed = clashes.map((c) => ` · ${c}`).join('');
  if (holds && hooks.length === 0) return `refresh path: ${postEdit.join(', ')} post-edit hook${installed}${clashed} · ${landOf(own === undefined ? [] : [own])}${net}${never}`;
  if (!holds && hooks.length <= 1) {
    const [hook] = hooks;
    // An unverified name is wired by nothing and refreshed by nothing (MV-59):
    // `doors` prints what to declare, and so does its line above.
    if ((hook?.kind === 'follow' || hook?.kind === 'unresolved') && !verified(hook.name)) {
      return `refresh path: none — ${hook.name} is not verified, so no post-edit hook, \`change land\` or \`change close\` runs it${never}`;
    }
    switch (hook?.kind) {
      case 'follow': {
        const local =
          hook.local.length === 0
            ? ''
            : ` · not into the change worktrees of ${andList(hook.local)}: they reach ${hook.name} only in their own node_modules/.bin, which a worktree does not hold`;
        return `refresh path: ${postEdit.join(', ')} post-edit hook follows your edits into the code repos' checkouts${installed}${local}${clashed} · ${landOf([hook.name])}${net}${never}`;
      }
      case 'unreachable':
        return `${only}\`${hook.bin}\` is not reachable from every code repo that resolves ${hook.name} (PATH, or each one's node_modules/.bin)${clashed}${never}`;
      case 'unresolved':
        return `refresh path: none yet — no writable code repo resolves ${hook.name}, so the brain's post-edit hook has no checkout to follow edits into${never}`;
      default:
        // Graphers writing one artifact get no follow hook (`doors` says so).
        return clashes.length === 0
          ? `refresh path: none yet — no writable code repo resolves a grapher, so the brain's post-edit hook has no checkout to follow edits into${never}`
          : `refresh path: no post-edit hook — ${clashes.join(' · ')}${never}`;
    }
  }
  // Several graphers: each one's own hook, and per grapher what it lacks.
  const hooked = [
    ...(own !== undefined && verified(own) ? [own] : []),
    ...hooks.flatMap((h) => (h.kind === 'follow' && verified(h.name) ? [h.name] : [])),
  ];
  // Why a grapher gets no hook, in `doors`' words, per grapher.
  const unwired = hooks.flatMap((h): [string, string][] =>
    h.kind === 'unreachable'
      ? [[h.name, `\`${h.bin}\` is not reachable from every code repo that resolves ${h.name} (PATH, or each one's node_modules/.bin)`]]
      : h.kind === 'follow' && !verified(h.name)
        ? [[h.name, `${h.name} is not verified, so no post-edit hook runs it`]]
        : [],
  );
  if (hooked.length === 0) return `${only}${unwired.map(([, why]) => why).join('; ')}${clashed}${never}`;
  const lacks = [
    ...unwired.map(([name, why]) => `no hook for ${name}: ${why}`),
    ...hooks.flatMap((h) =>
      h.kind === 'follow' && h.local.length > 0 && verified(h.name)
        ? [`${h.name}'s hook: not into the change worktrees of ${andList(h.local)}: they reach ${h.name} only in their own node_modules/.bin, which a worktree does not hold`]
        : [],
    ),
  ];
  const landed = [
    ...(own !== undefined && verified(own) ? [own] : []),
    ...hooks.flatMap((h) => (h.kind !== 'unresolved' && verified(h.name) ? [h.name] : [])),
  ];
  const head =
    hooked.length > 1
      ? `${postEdit.join(', ')} post-edit hooks follow your edits — ${andList(hooked.map((n) => `${n}'s`))} (each installed when its binary is present)`
      : `${postEdit.join(', ')} post-edit hook follows your edits — ${hooked[0]}'s${installed}`;
  return `refresh path: ${head}${lacks.map((l) => ` · ${l}`).join('')}${clashed} · ${landOf(landed)}${net}${never}`;
}

async function reposLine(brain: string, cfg: Config): Promise<string> {
  const entries = Object.entries(cfg.repos);
  if (entries.length === 0) return `none declared — add repos: to ${CONFIG_PATH}`;
  const missing: string[] = [];
  const notes: string[] = [];
  let cloned = 0;
  for (const [key, e] of entries) {
    const dir = resolve(brain, e.path);
    // MV-125: a fact about scope, noted whether or not the repo is on disk.
    const why = e.isBrain ? null : await readOnly(cfg, key, dir);
    if (why) notes.push(`${key}: ${why}, read-only`);
    // MV-141: MV-132's clone state, not a path being there.
    const st = await cloneState(e, dir);
    if (e.isBrain) {
      cloned++;
      notes.push(`${key}: brain==code (this repo)`);
    } else if (st.state === 'cloned') {
      cloned++;
    } else if (st.state !== 'absent') {
      notes.push(`${key}: ${cloneFix(key, e, st)}`);
    } else {
      missing.push(
        e.url
          ? `${key} missing → \`multivac repos sync\` (git clone ${e.url} ${e.path})`
          : `${key} missing, no url — add url: under repos.${key} in ${CONFIG_PATH}`,
      );
    }
  }
  return [`${cloned}/${entries.length} cloned`, ...notes, ...missing].join(' · ');
}

/**
 * Where each declared repo is parked, and whether that is its channel — the
 * diagnostic that explains a `verify` result at a glance. A brain-scoped
 * verify reads the channel, so a repo parked elsewhere is NOT what produced
 * the verdicts; before MV-53 it was, and the red it caused looked like a lie
 * because nothing in any report mentioned the branch.
 */
async function branchesLine(brain: string, cfg: Config): Promise<string> {
  const entries = Object.entries(cfg.repos);
  if (entries.length === 0) return `none declared — add repos: to ${CONFIG_PATH}`;
  const parts: string[] = [];
  for (const [key, e] of entries) {
    const dir = e.isBrain ? brain : resolve(brain, e.path);
    if (!(await pathExists(dir))) {
      parts.push(`${key}: not cloned`);
      continue;
    }
    const branch = (await git.currentBranch(dir)) ?? 'detached HEAD';
    const head = await git.revParse(dir, 'HEAD');
    const at = `${branch}${head ? ` @ ${head.slice(0, 7)}` : ''}`;
    const channel = channelRef(cfg, e);
    const sha = await git.revParse(dir, channel);
    if (e.isBrain || key === 'brain') {
      // Read as a working tree on purpose — but a brain BEHIND its own channel
      // judges a current ecosystem with an out-of-date law, and that reads as a
      // red nobody can explain. Behind, not merely different: a feature branch
      // is off its channel by construction, and saying so every run is noise.
      const behind =
        sha === null || sha === head
          ? '0'
          : await git.run(dir, ['rev-list', '--count', `HEAD..${sha}`]).catch(() => '0');
      parts.push(
        `${key}: on ${at} — brain==code, verify reads this working tree` +
          (behind === '0'
            ? ''
            : `; ${behind} behind its own channel ${channel} @ ${sha!.slice(0, 7)} → git -C ${e.path} pull`),
      );
      continue;
    }
    if (sha === null) {
      parts.push(
        `${key}: on ${at} — channel ${channel} does not resolve here; verify FALLS BACK to this working tree → git -C ${e.path} fetch`,
      );
    } else if (sha === head) {
      parts.push(`${key}: on ${at} = channel ${channel}`);
    } else {
      parts.push(
        `${key}: on ${at} — OFF channel ${channel} @ ${sha.slice(0, 7)}; verify reads the channel, not this tree`,
      );
    }
  }
  return parts.join(' · ');
}

async function pinsLine(brain: string, cfg: Config): Promise<string> {
  // brain==code entries have nothing to mount: the brain is already here.
  const entries = Object.entries(cfg.repos).filter(([, e]) => !e.isBrain);
  if (entries.length === 0) {
    return Object.keys(cfg.repos).length === 0
      ? 'no repos declared'
      : 'brain==code — no mount to pin';
  }
  const parts: string[] = [];
  for (const [key, e] of entries) {
    const dir = resolve(brain, e.path);
    // MV-125: a repo multivac does not own mounts nothing for it, and every fix
    // below — a submodule add or update — is a write there.
    const why = await readOnly(cfg, key, dir);
    if (why) {
      parts.push(`${key}: ${why}, read-only — no mount expected`);
      continue;
    }
    if (!(await pathExists(dir))) {
      parts.push(`${key}: not cloned`);
      continue;
    }
    const pin = await git.lsTreeGitlink(dir, cfg.mount).catch(() => null);
    if (!pin) {
      // MV-127: multivac makes this mount now, so the fix is multivac's own
      // command. A mount already in the index is not missing — telling a human
      // to create what they have staged is the report lying about the state.
      const staged = await git.gitlinkInIndex(dir, cfg.mount).catch(() => null);
      parts.push(
        staged
          ? `${key}: brain mount staged, not committed — commit it in ${e.path}`
          : `${key}: no brain mount at ${cfg.mount} — run \`multivac repos sync\` to add it`,
      );
      continue;
    }
    const channel = e.channel ?? cfg.channel;
    let chName = channel;
    let chSha: string | null = null;
    if (channel) {
      chSha = await git
        .run(brain, ['rev-parse', '--verify', channel])
        .catch(() => null);
    } else {
      const rt = await git.remoteTrackingRef(brain);
      if (rt) ({ name: chName, sha: chSha } = rt);
    }
    if (!chSha) {
      parts.push(
        `${key}: pin ${pin.slice(0, 7)} — no channel ref to compare; set channel: in ${CONFIG_PATH}`,
      );
      continue;
    }
    if (chSha === pin) {
      parts.push(`${key}: pin ok (${chName})`);
      continue;
    }
    const behind = await git
      .run(brain, ['rev-list', '--count', `${pin}..${chSha}`])
      .catch(() => '?');
    const age = await git.lastFetchAge(brain).catch(() => null);
    const fetched = age === null ? 'never fetched' : `last fetch ${fmtAge(age)} ago`;
    parts.push(
      `${key}: pin ${behind} behind ${chName}; ${fetched} → git -C ${e.path} submodule update --remote ${cfg.mount}`,
    );
  }
  return parts.join(' · ');
}

/** Coexistence with a foreign hook dir: multivac wired, refused, or absent.
 *  `armed` is the enforcement floor here: both shims run multivac AND a runner
 *  exists — the same condition `--strict` asserts.
 *
 *  Read through resolveHooksPath, so the shims are looked for where install put
 *  them and where git will run them. `join(brain, dir, shim)` reported both
 *  shims missing from a directory they were sitting in whenever `dir` was
 *  absolute — the spelling a linked worktree inherits verbatim from its main
 *  checkout, which names the main checkout's hooks dir (MV-79). */
async function alongsideParts(
  brain: string,
  dir: string,
): Promise<{ parts: string[]; armed: boolean }> {
  const parts: string[] = [];
  const base = resolveHooksPath(brain, dir).dir;
  let installed = true;
  for (const shim of ['pre-commit', 'pre-push']) {
    const text = await readFile(join(base, shim), 'utf8').catch(() => null);
    if (text === null) {
      installed = false;
      parts.push(`${shim} missing in ${dir} → run \`multivac init .\` to install alongside`);
    } else if (runsMultivac(text)) {
      parts.push(`${shim} runs multivac (${dir}/${shim})`);
    } else {
      installed = false;
      parts.push(
        `WARNING ${dir}/${shim} does not run multivac → append: ${MANUAL_CHAIN_LINE}`,
      );
    }
  }
  const runner = await findRunner(brain);
  if (installed) {
    parts.push(
      runner
        ? `active (${runner})`
        : `INACTIVE — no runnable multivac, the shims verify nothing → ${INACTIVE_FIX}`,
    );
  }
  return { parts, armed: installed && runner !== null };
}

/** The hooks report line, plus whether the enforcement gate is actually armed
 *  — the floor `--strict` asserts. Disarmed ⇒ a commit here is not verified. */
async function hooksLine(brain: string): Promise<{ line: string; armed: boolean }> {
  // `--path`, because that is how git reads it: a leading `~`/`~user` expands
  // to the home directory before anything resolves. Plain `git config` hands
  // back the literal text, so `~/hooks` would resolve against the repo root and
  // doctor would read a directory named `~` inside the checkout (MV-79).
  const hp = await git.run(brain, ['config', '--path', 'core.hooksPath']).catch(() => null);
  // Ours or foreign is decided on the resolved path (MV-79), never on the
  // configured text: `.multivac/hooks` and its absolute spelling are one gate.
  const ours = hp !== null && resolveHooksPath(brain, hp).own;
  // A hooksPath the repo set itself is its own gate: multivac coexists there,
  // it never repoints — advising `git config core.hooksPath` here would be
  // advising the user to disarm their own enforcement.
  if (hp !== null && !ours) {
    const { parts, armed } = await alongsideParts(brain, hp);
    return {
      line: [
        `core.hooksPath is ${hp} (this repo's own gate — multivac installs alongside, never repoints)`,
        ...parts,
      ].join(' · '),
      armed,
    };
  }
  if (hp === null && (await pathExists(join(brain, '.husky')))) {
    const { parts, armed } = await alongsideParts(brain, '.husky');
    return {
      line: [
        'core.hooksPath unset, .husky/ present (husky claims it on install — multivac installs alongside, never repoints)',
        ...parts,
      ].join(' · '),
      armed,
    };
  }
  const parts: string[] = [
    ours
      ? 'core.hooksPath ok'
      : `core.hooksPath unset → git config core.hooksPath ${HOOKS_DIR}`,
  ];
  let installed = true;
  const chained = await chainedHooks(brain);
  for (const shim of ['pre-commit', 'pre-push']) {
    // MV-115: presence is not identity, asked of OUR OWN directory too. This
    // tested that the file exists, so a shim edited down to `exit 0` reported
    // installed and armed `--strict` over a gate that does nothing — the class
    // MV-108 closed for a foreign hook, still open for ours.
    const text = await readFile(join(brain, HOOKS_DIR, shim), 'utf8').catch(() => null);
    const present = text !== null && runsMultivac(text);
    installed &&= present;
    parts.push(
      text === null
        ? `${shim} missing → run \`multivac init .\` to rewrite the shims`
        : present
          ? `${shim} installed`
          : `${shim} does not run multivac → run \`multivac init .\` to rewrite the shims`,
    );
    // The repo's own .git/hooks hook still runs: the shim chains it first.
    if (present && chained.includes(`.git/hooks/${shim}`)) {
      parts.push(`${shim} chains .git/hooks/${shim} (runs first, its exit code wins)`);
    }
  }
  // .pre-commit-config.yaml with no installed hook — the fresh-clone shape:
  // `pre-commit install` refuses while core.hooksPath is set, so the shim
  // arms the gate itself, or cannot when the binary is missing.
  const gate = await preCommitGate(brain, chained);
  if (gate === 'run') {
    parts.push(
      '.pre-commit-config.yaml with no .git/hooks/pre-commit — the shim runs `pre-commit run --hook-stage <stage>` directly (`pre-commit install` refuses while core.hooksPath is set)',
    );
  } else if (gate === 'no-binary') {
    parts.push(
      "WARNING .pre-commit-config.yaml present, no .git/hooks/pre-commit and no pre-commit binary — the project's gate cannot run → " +
        PRECOMMIT_MISSING_FIX,
    );
  }
  // Installed is not enforcing: the shim exits 0 when nothing can run it.
  const runner = await findRunner(brain);
  if (installed) {
    parts.push(
      runner
        ? `active (${runner})`
        : `INACTIVE — no runnable multivac, the shims verify nothing → ${INACTIVE_FIX}`,
    );
  }
  // Armed only when core.hooksPath is ours (unset ⇒ git never runs the shims —
  // measurement 3's exact disarm), both shims are present, and something can
  // run them. Any one missing and a commit here goes unverified.
  return { line: parts.join(' · '), armed: ours && installed && runner !== null };
}

/** Config file at a repo root: tsconfig*, package*, *.config.*, .*rc[.ext]. */
const ROOT_CONFIG = /^(tsconfig.*|package.*|.+\.config\..+|\.[^.]+rc(\..+)?)$/;

/** Scripts of a repo's package.json as one blob. Absent or broken = "". */
async function scriptText(dir: string): Promise<string> {
  try {
    const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    return Object.values(pkg.scripts ?? {}).join('\n');
  } catch {
    return '';
  }
}

/** Why an untracked file looks build-critical, or null. */
function buildCritical(
  file: string,
  scripts: string,
  anchored: (f: string) => boolean,
): string | null {
  if (!file.includes('/') && ROOT_CONFIG.test(file)) return 'root config';
  // ponytail: substring, not a shell parse — catches `tsc -p tsconfig.test.json`
  // and misses paths a script builds by concatenation. Upgrade when that bites.
  if (file && scripts.includes(file)) return 'package.json script';
  if (anchored(file)) return 'anchor glob';
  return null;
}

/**
 * Untracked-but-needed. A file that was never `git add`ed is invisible to
 * everything reading the tree through `git ls-files` — verify included — so a
 * repo can build here and fail on a fresh checkout. Name the untracked,
 * non-ignored files that look build-critical. Warning only: doctor diagnoses.
 *
 * Worse than untracked is *ignored*: a `.gitignore` that swallows a brain
 * path (saleor's opens with `.*`) means the law can never ship, while
 * `git add` stays silent and every command stays green. That is a WARNING
 * with the fix, ahead of the untracked report.
 */
async function untrackedLine(brain: string, cfg: Config, anchors: Anchor[]): Promise<string> {
  const ignored = await git.ignoredPaths(brain, BRAIN_PATHS).catch(() => []);
  const ignoredWarning =
    ignored.length === 0
      ? null
      : `WARNING ${ignored.length} brain path${ignored.length === 1 ? '' : 's'} ` +
        `IGNORED by .gitignore — ${ignored.join(', ')} — the law cannot ship; ` +
        'fix: run `multivac init .` (appends !.multivac/ negations to .gitignore)';
  const brainKeys = ['brain', '*'];
  const scopes = [{ name: 'brain', dir: brain, keys: brainKeys }];
  for (const [key, e] of Object.entries(cfg.repos)) {
    if (e.isBrain) {
      brainKeys.push(key); // an alias for this same tree
      continue;
    }
    const dir = resolve(brain, e.path);
    if (await pathExists(dir)) scopes.push({ name: key, dir, keys: [key, '*'] });
  }
  const flagged: string[] = [];
  for (const s of scopes) {
    const files = await git.untrackedFiles(s.dir).catch(() => []);
    if (files.length === 0) continue;
    const scripts = await scriptText(s.dir);
    const matchers = anchors
      .filter((a) => s.keys.includes(a.repoKey))
      .map((a) => makeMatcher(a.include, excludeGlobs(a.excludes, s.keys)));
    for (const f of files) {
      const why = buildCritical(f, scripts, (x) => matchers.some((m) => m(x)));
      if (why) flagged.push(`${f} (${s.name}, ${why})`);
    }
  }
  const untracked =
    flagged.length === 0
      ? 'nothing build-critical untracked'
      : `WARNING ${flagged.length} build-critical file${flagged.length === 1 ? '' : 's'} ` +
        `untracked — git add or ignore: ${flagged.slice(0, 8).join(', ')}` +
        (flagged.length > 8 ? ` · +${flagged.length - 8} more` : '');
  return ignoredWarning === null ? untracked : `${ignoredWarning} · ${untracked}`;
}

/** What a law that could not be read at all looks like: nothing, and no complaint. */
const EMPTY_LAW: ParseResult = { anchors: [], diagnostics: [] };

/**
 * What the law says about itself. An anchor that does not parse is a rule
 * nobody checks — `verify` prints it and refuses, and `doctor` said it exits 1
 * for it long before anything read the diagnostics that prove it.
 */
function lawLine(law: ParseResult): string {
  const { anchors, diagnostics } = law;
  if (diagnostics.length === 0) {
    return anchors.length === 0
      ? 'no anchors — a claim nobody checks decays (MV-01)'
      : `${anchors.length} anchor${anchors.length === 1 ? ' parses' : 's parse'}`;
  }
  const named = diagnostics
    .slice(0, 3)
    .map((d) => `${d.file}:${d.line} — ${d.message}`)
    .join(' · ');
  const more = diagnostics.length > 3 ? ` · +${diagnostics.length - 3} more` : '';
  return `invalid — ${diagnostics.length} anchor${diagnostics.length === 1 ? '' : 's'} do not parse: ${named}${more}`;
}

/**
 * Build the full report. Bare `doctor` exits 1 only when the config/law is
 * invalid. Under `strict`, a disarmed enforcement gate is also exit 1: the
 * assertion that the floor is actually armed, not merely described.
 */
export async function doctorReport(
  brainDir: string,
  strict = false,
): Promise<{ lines: string[]; exit: number }> {
  const stale = await layoutError(brainDir);
  if (stale) return { lines: [label('layout') + stale], exit: 1 };
  let cfg: Config;
  try {
    cfg = await loadConfig(brainDir);
  } catch (e) {
    if (e instanceof ConfigError) {
      return { lines: [label('config') + `invalid — ${e.message}`], exit: 1 };
    }
    throw e;
  }
  // The law, read once: `untrackedLine` wants the anchors, and the promise
  // this command's own help makes — "exit 1 only when the config/law is
  // invalid" — wants the diagnostics that used to be thrown away here.
  const law = await collectBrainAnchors(brainDir).catch(() => EMPTY_LAW);
  const doorParts: string[] = [];
  for (const name of cfg.doors) doorParts.push(await doorState(brainDir, name));
  const hooks = await hooksLine(brainDir);
  const lines: string[] = [
    label('doors') +
      (doorParts.join(' · ') ||
        `none declared — add doors: [agents] to ${CONFIG_PATH}`),
    ...(await sddLines(brainDir, cfg)),
    ...(await grapherLines(brainDir, cfg)),
    label('repos') + (await reposLine(brainDir, cfg)),
    label('branches') + (await branchesLine(brainDir, cfg)),
    label('pins') + (await pinsLine(brainDir, cfg)),
    label('hooks') + hooks.line,
    // Straight after the line that says what IS armed. `doctor --strict` is
    // the assertion that the enforcement gate is up, and a reader who takes
    // that as covering the whole law would be reading coverage out of silence
    // — the one rule no local gate can arm has to say so in the same report.
    label('enact') + ENACTMENT_UNGATEABLE,
    // MV-137: what makes code-in-change binding is a forge setting.
    ...(cfg.sddAuto && adaptersByRoot(cfg, 'sdd').size > 0
      ? [
          label('forge') +
            'code lands in a change only where the forge requires the merge request pipeline to run ' +
            '`multivac verify --strict --range <base>..<head> --branch <name>` and nobody can push to the default branch — ' +
            'ungateable from disk: multivac cannot read either setting, and a hook can be skipped',
        ]
      : []),
    label('law') + lawLine(law),
    label('untracked') + (await untrackedLine(brainDir, cfg, law.anchors)),
  ];
  // The one strict-only exit: a report that exits 0 while nothing is enforced
  // is the lie measurement 3 caught. `--strict` refuses to be that report.
  if (strict && !hooks.armed) {
    lines.push(
      label('strict') +
        'FAIL — the enforcement gate is not armed; a commit here is not verified (see hooks above)',
    );
    return { lines, exit: 1 };
  }
  // A law that does not parse is the other half of the exit this command
  // advertises. It is NOT a strict-only exit: an unreadable rule is invalid,
  // the same way an unreadable config is, and both are exit 1 bare.
  return { lines, exit: law.diagnostics.length === 0 ? 0 : 1 };
}

/** What doctor takes. One declaration: citty parses it, `undeclared` refuses against it. */
const ARGS = {
  strict: { type: 'boolean', description: 'exit 1 when the enforcement gate is disarmed' },
} satisfies ArgsDef;

export const doctorCommand: Command = {
  name: 'doctor',
  help: 'what is declared, what was found, what is degraded, how to fix it',
  usage: [
    'usage: multivac doctor [--strict]',
    'reports what is declared, found, degraded, and how to fix it.',
    'exit 0 even when degraded; exit 1 only when the config/law is invalid.',
    '--strict also exits 1 when the enforcement gate is disarmed — the shim',
    "  missing, core.hooksPath not multivac's with no shim chained, or no",
    '  runnable multivac — so `mvac doctor --strict` is an assertion',
    '  that the gate is armed, not just a report that describes it.',
  ],
  async run(argv, ctx) {
    // MV-85: before the report. `--sttrict` used to run the report without the
    // assertion and exit 0, and a named directory used to be discarded while
    // doctorReport read ctx.cwd — a truthful report about somewhere else.
    const bad = undeclared('doctor', argv, surfaceFrom(ARGS));
    if (bad) {
      warn(bad);
      return 2;
    }
    const strict = parseArgs(argv, ARGS).strict === true;
    const { lines, exit } = await doctorReport(ctx.cwd, strict);
    for (const l of lines) say(l);
    return exit;
  },
};
