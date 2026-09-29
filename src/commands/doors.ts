// `multivac doors` — project the door into the brain and each declared repo
// on disk that is not read-only (MV-125); install the git-hook shims. Writes
// working trees only, never commits, never clones. Missing repo -> notice,
// read-only repo -> one line and nothing written, exit 0.

import {
  cpSync,
  type Dirent,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Command, CommandContext, Config } from '../types.js';
import { surfaceFrom, undeclared } from '../lib/args.js';
import { parseArgs, type ArgsDef } from 'citty';
import { PROJECTED_PATH, recordBody, selfVersion } from '../lib/version.js';
import { ConfigError, LAW_PATH, loadConfig,
  ECOSYSTEM_PATH,
  FLOW_PATH,
} from '../lib/config.js';
import { say, warn } from '../lib/out.js';
import { applyManagedBlock, stripManagedBlock } from '../doors/block.js';
import { CANONICAL_DOOR, linkDoor } from '../doors/link.js';
import { renderFlow } from '../doors/flow.js';
import { countActiveInvariants, renderBrainDoor } from '../doors/brain.js';
import { writeEcosystem } from '../doors/ecosystem.js';
import { renderConsumerDoor } from '../doors/consumer.js';
import { mergeClaudeSettings, type RefreshHook } from '../doors/settings.js';
import { installHooks } from '../hooks/install.js';
import { gitlinkInIndex, lsTreeGitlink } from '../lib/git.js';
import { leftoverGraphs } from '../lib/repo-state.js';
import {
  adapterFor,
  brainHoldsCode,
  brainHooks,
  brainRefreshGraphers,
  type BrainHook,
  missingRequired,
  readOnly,
  clashSentence,
  refreshClashes,
} from '../adapters/detect.js';
import {
  type AdapterSpec,
  type DoorTarget,
  doorTargets,
  grapherSpec,
  unverifiedGrapher,
} from '../adapters/registry.js';

const KNOWN_TARGETS = Object.keys(doorTargets);

async function readOrNull(file: string): Promise<string | null> {
  try {
    return await readFile(file, 'utf8');
  } catch {
    return null;
  }
}

/** Package root = first ancestor of this module with a package.json. */
function packageRoot(): string | null {
  let dir = dirname(fileURLToPath(import.meta.url));
  while (true) {
    if (existsSync(join(dir, 'package.json'))) return dir;
    const up = dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

/** Every entry under `root`: relative path -> what it is. Kind and not just
 *  name, so a file standing where the source has a directory is a difference. */
function treeKinds(root: string): Map<string, string> {
  const kind = (e: Dirent): string =>
    e.isDirectory() ? 'dir' : e.isFile() ? 'file' : 'other';
  const kinds = new Map<string, string>();
  for (const e of readdirSync(root, { recursive: true, withFileTypes: true })) {
    kinds.set(relative(root, join(e.parentPath, e.name)), kind(e));
  }
  return kinds;
}

/**
 * MV-73: the projection is a mirror, not an accretion. A file the source
 * stopped shipping belongs to a version of the skill that is gone, so the run
 * that notices is the run that removes it — and a file somebody added here is
 * removed by the same rule, because nothing on disk says who wrote it and
 * guessing would be claiming more than we checked.
 *
 * Bounded to `dest` — the directory the registry entry declared — and NEVER its
 * parent: `specify init` installs ten sibling skills in that same parent, and a
 * prune walking it would delete another tool's installation. The bound is a
 * rule about the data, checked over the registry in test/doors/registry.test.ts.
 *
 * Removal comes BEFORE the copy on purpose. It only ever touches what the
 * source does not have, so nothing a failed copy would leave missing is
 * deleted, and a file sitting where the source has a directory is resolved
 * rather than failing the copy.
 */
function mirror(src: string, dest: string): void {
  const keep = treeKinds(src);
  mkdirSync(dest, { recursive: true });
  for (const [rel, kind] of treeKinds(dest)) {
    if (keep.get(rel) !== kind) rmSync(join(dest, rel), { recursive: true, force: true });
  }
  cpSync(src, dest, { recursive: true });
}

/** Where this install's packaged skill tree would be. It may not be there:
 *  `files` could have dropped it, an install could be half-unpacked, and the
 *  caller has to answer for that case rather than assume it away. */
function packagedSkill(): string {
  const root = packageRoot();
  return root === null ? '' : join(root, 'skills', 'multivac');
}

/**
 * Mirror the packaged skill into where the target's `skill` path says it
 * lives — written, and pruned back to what the package still ships.
 *
 * `src` is a parameter because the missing-source branch is otherwise
 * unreachable from a test: the suite runs out of a tree that HAS the skill,
 * and a branch nothing can enter is a branch nothing pins.
 */
export function installSkill(
  dir: string,
  skill: string,
  notices: string[],
  src: string = packagedSkill(),
): void {
  // No source is not an empty source. Mirroring from nothing would delete
  // every file under the projected directory — this tool doing, over a broken
  // install of itself, exactly the damage it exists to report.
  if (!existsSync(src)) {
    notices.push(
      'packaged skill skills/multivac missing — reinstall multivac to get it',
    );
    return;
  }
  mirror(src, join(dir, dirname(skill)));
}

/**
 * MV-149. The one place a refresh hook is built from a grapher's entry: its
 * refresh, its opt-out environment (MV-124), the artifact its toplevel test
 * names — which is also how the merge tells one grapher's hook from another's
 * (MV-140, `refreshKey`) — and whether it follows edits out of the brain
 * (MV-148).
 */
function refreshHookOf(spec: AdapterSpec, follow: boolean): RefreshHook {
  return { refresh: spec.refresh, env: spec.env ?? {}, artifact: spec.artifacts[0], follow };
}

/** Merge multivac's harness entries — verify, and one graph refresh per
 *  grapher `refreshes` wants (MV-149) — into the harness hook config. */
async function installHookConfig(
  dir: string,
  hookConfig: NonNullable<DoorTarget['hookConfig']>,
  refreshes: RefreshHook[],
  notices: string[],
): Promise<void> {
  const settingsFile = join(dir, hookConfig.path);
  try {
    const merged = mergeClaudeSettings(await readOrNull(settingsFile), {
      // The refresh is the agent's navigation aid, so it rides the harness's
      // post-edit hook — only where the registry says the harness has one.
      refreshes: hookConfig.postEdit ? refreshes : [],
      matcher: hookConfig.postEdit,
    });
    await mkdir(dirname(settingsFile), { recursive: true });
    await writeFile(settingsFile, merged.text);
    // What the merge saw but will not act on — a duplicate an older multivac
    // left behind. It rides the notices this target already prints.
    notices.push(...merged.notices);
  } catch (e) {
    notices.push((e as Error).message);
  }
}

/** Door block into AGENTS.md + per-target projections + hook shims. */
/**
 * MV-143. Remove multivac's block from a path a target no longer projects, and
 * delete the file when nothing of the operator's is left — counting the
 * frontmatter multivac itself wrote at creation as its own, not theirs. A file
 * with no block, or with the broken marker pair `applyManagedBlock` refuses, is
 * left exactly as it is: this run removes what multivac wrote and never guesses
 * at the rest (MV-108).
 */
async function unproject(dir: string, t: DoorTarget, notices: string[]): Promise<void> {
  const { path, head } = t.retired!;
  const file = join(dir, path);
  const existing = await readOrNull(file);
  if (existing === null) return;
  const rest = stripManagedBlock(existing);
  if (rest === existing) return; // nothing of ours in there
  const onlyOurs = rest === null || rest.trim() === (head ?? '').trim();
  if (onlyOurs) {
    await rm(file, { force: true });
    notices.push(`${path} removed — this harness reads ${CANONICAL_DOOR}`);
    return;
  }
  await writeFile(file, rest);
  notices.push(`${path}: managed block removed; the rest is yours`);
}

/**
 * Write the door and the harness hooks into `dir`. `grapher` is the root's own
 * — a consumer's, or the brain's where it holds code — refreshed where it was
 * (MV-140); `follow` are the brain's follow hooks this machine can wire, one
 * per grapher (MV-148, MV-149).
 */
async function projectInto(
  dir: string,
  body: string,
  config: Config,
  grapher?: string,
  follow: string[] = [],
): Promise<string[]> {
  const notices: string[] = [];
  // Declared AND installed, or no refresh entry at all — an absent binary
  // would only wire a hook that cannot run; doctor already says why. Installed
  // means found by the one lookup for THIS root (MV-123), the lookup whose
  // node_modules/.bin half the hook reaches too. An unverified grapher wires
  // nothing either: a hook running a command multivac guessed is worse than no
  // hook at all.
  const spec = grapher === undefined ? null : grapherSpec(grapher, config.graphers);
  if (grapher !== undefined && spec === null) notices.push(unverifiedGrapher(grapher));
  const refreshes: RefreshHook[] = [];
  if (spec !== null && (await missingRequired(spec, dir)).length === 0) refreshes.push(refreshHookOf(spec, false));
  // MV-148: a follow hook never runs here — it moves into the code repo of the
  // file edited first — so each name in `follow` is one `brainHooks` already
  // found from every code repo that hook can move into, and a lookup from the
  // brain would decide on a copy the hook cannot reach. MV-149: one per grapher.
  for (const name of follow) {
    const f = grapherSpec(name, config.graphers);
    if (f === null) notices.push(unverifiedGrapher(name));
    else refreshes.push(refreshHookOf(f, true));
  }
  const doorFile = join(dir, 'AGENTS.md');
  // MV-115: a broken managed file is THAT file's notice, and the run goes on.
  // One mangled door used to abort the whole multi-repo pass, so every repo
  // after it got no door and no hooks — a projection that stops at the first
  // damaged file leaves the ecosystem worse than it found it.
  try {
    await writeFile(doorFile, applyManagedBlock(await readOrNull(doorFile), body, doorFile));
  } catch (e) {
    notices.push((e as Error).message);
  }
  // Dispatch on the registry entry's kind, never on its name: a new harness
  // is an entry in src/adapters/registry.ts and nothing else.
  for (const target of config.doors) {
    const t = doorTargets[target];
    if (!t) {
      notices.push(
        `unknown door target "${target}" — known: ${KNOWN_TARGETS.join(', ')}`,
      );
      continue;
    }
    // canonical and native both read AGENTS.md, already written above.
    // MV-143: a target that stopped projecting a file takes it with it. One
    // run removes multivac's block and deletes what is left when nothing of the
    // operator's remains — a stale second door is one an agent reads as current.
    if (t.retired) await unproject(dir, t, notices);
    if (t.kind === 'symlink') {
      const { notice } = linkDoor(dir, t.door);
      if (notice) notices.push(notice);
    } else if (t.kind === 'stub') {
      // Tool-owned stub file — but the file is not multivac's, only the block
      // inside it is (MV-108). Writing it whole destroyed whatever the
      // operator had put there, on every run, twenty lines below the branch
      // that already reads first. Frontmatter is written only on creation:
      // adding it to a file somebody else authored would rewrite their head.
      const file = join(dir, t.door);
      await mkdir(dirname(file), { recursive: true });
      const existing = await readOrNull(file);
      try {
        const stub = applyManagedBlock(
          existing,
          'Read `AGENTS.md` at the repo root — the multivac door: what is law here, where the brain lives. Run `multivac verify` before you commit.',
          file,
        );
        await writeFile(file, existing === null && t.frontmatter ? `${t.frontmatter}\n\n${stub}` : stub);
      } catch (e) {
        // The same rule as the canonical door: a stub target is a file
        // somebody else authored with our block inside it, and just as
        // mangle-able (MV-115).
        notices.push((e as Error).message);
      }
    }
    if (t.skill) installSkill(dir, t.skill, notices);
    if (t.hookConfig) await installHookConfig(dir, t.hookConfig, refreshes, notices);
  }
  const hooks = await installHooks(dir, { strictPrePush: config.strictPrePush });
  if (hooks.strategy === 'chained') {
    notices.push(
      `hooks chained — ${hooks.chained.join(', ') || hooks.managers.join(', ')} runs first, then verify`,
    );
  } else if (hooks.strategy === 'alongside') {
    notices.push(`hooks installed alongside into ${hooks.dir} — core.hooksPath not touched`);
  }
  for (const r of hooks.refused) {
    notices.push(`${r.path} exists and does not run multivac — NOT touched; ${r.fix}`);
  }
  return notices;
}

/**
 * MV-148, MV-149. Why a grapher the brain's session would refresh gets no
 * follow hook, in the words `doctor`'s refresh path uses; null when it gets
 * one. One per grapher: a second grapher no longer silences the first.
 * Printed only where a declared harness has the hook to wire: elsewhere the
 * refresh path already says none does.
 */
function noRefreshNotice(hook: BrainHook, several: boolean): string | null {
  // MV-149: where another grapher's hook can be wired, "no refresh here" would
  // be false of the brain, so the head names the grapher, as `doctor`'s "no
  // hook for <g>" does. One grapher in play keeps #5's words.
  const head = several ? `no post-edit refresh for ${hook.name} here — ` : 'no post-edit graph refresh here — ';
  const net = '`change land` and `change close` refresh them';
  switch (hook.kind) {
    case 'follow':
      return null;
    case 'unreachable':
      return `${head}\`${hook.bin}\` is not reachable from every code repo that resolves ${hook.name} (PATH, or each one's node_modules/.bin); ${net}`;
    case 'unresolved':
      return `${head}no writable code repo resolves ${hook.name} yet, so there is no checkout to follow edits into; \`multivac doors\` wires it once one does`;
  }
}

/** What doors takes. One declaration: citty parses it, `undeclared` refuses against it. */
const ARGS = {
  adopt: { type: 'boolean', description: 'record this version as the one this brain was brought to' },
} satisfies ArgsDef;

async function run(argv: string[], ctx: CommandContext): Promise<number> {
  // MV-85: doors declares no arguments and used to take `_argv` — anything you
  // passed was discarded in silence. Before loadConfig, before any write.
  const bad = undeclared('doors', argv, surfaceFrom(ARGS));
  if (bad) {
    warn(bad);
    return 2;
  }
  const adopt = parseArgs(argv, ARGS).adopt === true;
  const brainDir = ctx.cwd;
  let config: Config;
  try {
    config = await loadConfig(brainDir);
  } catch (e) {
    if (e instanceof ConfigError) {
      warn(e.message);
      return 1;
    }
    throw e;
  }

  const invariants = await readOrNull(join(brainDir, LAW_PATH));
  const active = invariants === null ? 0 : countActiveInvariants(invariants);
  const report = (name: string, notices: string[]): void => {
    say(`${name}: door + hooks updated`);
    for (const n of notices) say(`${name}: notice: ${n}`);
  };

  // MV-148: a brain that holds code refreshes its own graph, as it always has.
  // One that holds none keeps no graph: its hooks follow edits into the code
  // repos' checkouts. MV-149: one hook per grapher the brain's session
  // refreshes — its own where it holds code, and a follow hook for each other
  // grapher its code repos resolve — each wired by `brainHooks`' answer, the
  // one `doctor` reports, and where an answer is no hook, one notice says why.
  const holds = brainHoldsCode(config);
  const hooks = await brainHooks(config, brainDir);
  const brainNotices = await projectInto(
    brainDir,
    // MV-148: a kept grapher install gets its line, from the same probe `init`
    // passes, so a re-run of `init` writes these bytes too (MV-102).
    renderBrainDoor(config, active, await leftoverGraphs(config, brainDir)),
    config,
    holds ? adapterFor(config, 'brain', 'grapher') : undefined,
    hooks.flatMap((h) => (h.kind === 'follow' ? [h.name] : [])),
  );
  // An unverified name no repo resolves is never wired either (MV-59): the
  // notice says what to declare, where "wires it once one does" would not be
  // true. One that resolves got the same notice from `projectInto`.
  const postEdit = config.doors.some((d) => doorTargets[d]?.hookConfig?.postEdit);
  // MV-149: more than one grapher the brain's session refreshes, so a hook
  // missing for one is not a brain without a refresh.
  const several = new Set([...brainRefreshGraphers(config).map((g) => g.name), ...hooks.map((h) => h.name)]).size > 1;
  const unwired = hooks.flatMap((h) => {
    const n =
      h.kind === 'unresolved' && grapherSpec(h.name, config.graphers) === null
        ? unverifiedGrapher(h.name)
        : postEdit
          ? noRefreshNotice(h, several)
          : null;
    return n === null ? [] : [n];
  });
  const clashes = postEdit ? refreshClashes(config).map(clashSentence) : [];
  report('brain', [...brainNotices, ...unwired, ...clashes]);

  // MV-96: the derived page. Rewritten whole every projection — the ritual is
  // the operator's and is never overwritten, this is the tool's and always is.
  // Through the managed block so anything written outside it survives.
  const flowFile = join(brainDir, FLOW_PATH);
  try {
    await writeFile(flowFile, applyManagedBlock(await readOrNull(flowFile), renderFlow(config), flowFile));
    say(`brain: ${FLOW_PATH} — what your declarations oblige, sorted; generated, binds nothing`);
  } catch (e) {
    say(`brain: notice: ${(e as Error).message}`);
  }
  // MV-139: the governance graph, beside the page, from the same declarations.
  try {
    await writeEcosystem(brainDir, config);
    say(`brain: ${ECOSYSTEM_PATH} — how repos, rows, anchors and changes relate; generated`);
  } catch (e) {
    say(`brain: notice: ${(e as Error).message}`);
  }

  // Per repo, not once for all of them: MV-90 resolves the graph block with the
  // grapher that applies THERE, and a body rendered before the loop cannot know.
  const unmounted: string[] = [];
  for (const [key, entry] of Object.entries(config.repos)) {
    const consumerBody = renderConsumerDoor(config, key);
    if (entry.isBrain) {
      // brain==code: this entry IS the brain, which already carries the brain
      // door. A consumer door here would point at a mount that cannot exist.
      say(`${key}: brain==code — the brain door is this repo's door`);
      continue;
    }
    const dir = resolve(brainDir, entry.path);
    // MV-125: a repo multivac does not own gets no door, skill, hook config,
    // shim or core.hooksPath. One projected before it became read-only is left
    // in place, since removing it is a write too.
    const why = await readOnly(config, key, dir);
    if (why) {
      say(`${key}: ${why}, read-only — nothing projected (MV-125)`);
      continue;
    }
    if (!existsSync(join(dir, '.git'))) {
      say(
        `${key}: notice: not found at ${entry.path} — run \`multivac repos sync\` to clone it`,
      );
      continue;
    }
    // The grapher `adapterFor` resolves for this repo (MV-122) — the answer
    // doctor and `change close` get, so a `none` repo wires no refresh.
    // A consumer keeps its one hook, refreshed where it was (MV-140).
    report(key, await projectInto(dir, consumerBody, config, adapterFor(config, key, 'grapher')));
    // MV-127: the door just installed a gate that reads the brain through the
    // mount. Say which repos have no mount to read, so "door + hooks updated"
    // is not the last word on a repo where nothing can be verified. Offline:
    // `doors` reports the state and never makes the mount (Principle IV).
    if (!(await lsTreeGitlink(dir, config.mount).catch(() => null))
      && !(await gitlinkInIndex(dir, config.mount).catch(() => null))) {
      unmounted.push(key);
    }
  }
  if (unmounted.length > 0) {
    say(
      `mounts     ${unmounted.join(', ')}: no brain mount at ${config.mount} — ` +
        `unverified there until \`multivac repos sync\``,
    );
  }
  // MV-86. Bare `doors` re-projects and leaves the record alone, ON PURPOSE:
  // people run it after editing doors: or grapher:, and if that restamped, the
  // stale-version notice would vanish for a reason that has nothing to do with
  // the upgrade — quiet, and looking resolved. --adopt is somebody saying they
  // have taken this version.
  if (adopt) {
    const v = selfVersion();
    await writeFile(join(brainDir, PROJECTED_PATH), recordBody(v));
    say(`brain: adopted ${v} — recorded in ${PROJECTED_PATH}`);
  }
  return 0;
}

export const doorsCommand: Command = {
  name: 'doors',
  help: 'project doors + install git hooks into the brain and declared repos',
  usage: [
    'usage: multivac doors [--adopt]',
    '  --adopt  also record this version as the one this brain was brought to,',
    '           in .multivac/projected.yml — the stale-version notice stops.',
    '           Bare `doors` re-projects and leaves the record alone, so the',
    '           notice survives a run made for an unrelated reason.',
    'Runs in the brain and acts on it plus each declared repo on disk:',
    'writes AGENTS.md, projects it per declared door, installs the git hooks,',
    'and wires the grapher refresh into every harness that has a post-edit hook.',
    'A repo declared `managed: false`, or a shallow clone, is read-only: nothing',
    'is projected there (MV-125). Re-run it after editing doors: or grapher:.',
  ],
  run,
};
