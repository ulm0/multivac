// `multivac doors` — project the door into the brain and each declared,
// present repo; install the git-hook shims. Writes working trees only, never
// commits, never clones. Missing repo -> notice, exit 0.

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
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Command, CommandContext, Config } from '../types.js';
import { surfaceFrom, undeclared } from '../lib/args.js';
import { parseArgs, type ArgsDef } from 'citty';
import { PROJECTED_PATH, recordBody, selfVersion } from '../lib/version.js';
import { ConfigError, LAW_PATH, loadConfig,
  FLOW_PATH,
} from '../lib/config.js';
import { say, warn } from '../lib/out.js';
import { applyManagedBlock } from '../doors/block.js';
import { renderFlow } from '../doors/flow.js';
import { countActiveInvariants, renderBrainDoor } from '../doors/brain.js';
import { renderConsumerDoor } from '../doors/consumer.js';
import { mergeClaudeSettings } from '../doors/settings.js';
import { installHooks } from '../hooks/install.js';
import { binaryPresent } from '../adapters/detect.js';
import {
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

/** <door> -> AGENTS.md symlink. Returns a notice line, or null when done. */
function linkDoor(dir: string, door: string): string | null {
  const link = join(dir, door);
  try {
    const st = lstatSync(link, { throwIfNoEntry: false });
    if (st?.isSymbolicLink()) {
      if (readlinkSync(link) === 'AGENTS.md') return null; // already ours
      return `${door} is a symlink elsewhere — repoint it at AGENTS.md or remove it`;
    }
    if (st) {
      return `${door} exists as a regular file — merge it into AGENTS.md and remove it to get the symlink`;
    }
    symlinkSync('AGENTS.md', link);
    return null;
  } catch {
    return `symlink not permitted on this platform — read AGENTS.md directly, or enable developer mode to get ${door}`;
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

/** Merge multivac's harness entries — verify, and the graph refresh — into
 *  the harness hook config. */
async function installHookConfig(
  dir: string,
  hookConfig: NonNullable<DoorTarget['hookConfig']>,
  refresh: string | null,
  notices: string[],
): Promise<void> {
  const settingsFile = join(dir, hookConfig.path);
  try {
    const merged = mergeClaudeSettings(await readOrNull(settingsFile), {
      // The refresh is the agent's navigation aid, so it rides the harness's
      // post-edit hook — only where the registry says the harness has one.
      refresh: hookConfig.postEdit ? refresh : null,
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
async function projectInto(
  dir: string,
  body: string,
  config: Config,
  grapher?: string,
): Promise<string[]> {
  const notices: string[] = [];
  // Declared AND installed, or no refresh entry at all — an absent binary
  // would only wire a hook that cannot run; doctor already says why. An
  // unverified grapher wires nothing either: a hook running a command
  // multivac guessed is worse than no hook at all.
  const spec = grapher === undefined ? null : grapherSpec(grapher, config.graphers);
  if (grapher !== undefined && spec === null) notices.push(unverifiedGrapher(grapher));
  const refresh = spec !== null && (await binaryPresent(spec)) ? spec.refresh : null;
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
    if (t.kind === 'symlink') {
      const linkNotice = linkDoor(dir, t.door);
      if (linkNotice) notices.push(linkNotice);
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
    if (t.hookConfig) await installHookConfig(dir, t.hookConfig, refresh, notices);
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

  report(
    'brain',
    await projectInto(brainDir, renderBrainDoor(config, active), config, config.grapher),
  );

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

  // Per repo, not once for all of them: MV-90 resolves the graph block with the
  // grapher that applies THERE, and a body rendered before the loop cannot know.
  for (const [key, entry] of Object.entries(config.repos)) {
    const consumerBody = renderConsumerDoor(config, key);
    if (entry.isBrain) {
      // brain==code: this entry IS the brain, which already carries the brain
      // door. A consumer door here would point at a mount that cannot exist.
      say(`${key}: brain==code — the brain door is this repo's door`);
      continue;
    }
    const dir = resolve(brainDir, entry.path);
    if (!existsSync(join(dir, '.git'))) {
      say(
        `${key}: notice: not found at ${entry.path} — run \`multivac repos sync\` to clone it`,
      );
      continue;
    }
    // Per-scope grapher, falling back to the global one — same rule as
    // doctor and `change close`.
    report(key, await projectInto(dir, consumerBody, config, entry.grapher ?? config.grapher));
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
    'Runs in the brain and acts on it plus every declared repo',
    'present on disk: writes AGENTS.md, projects it per declared door, installs',
    'the git hooks, and wires the grapher refresh into every harness that has a',
    'post-edit hook. Re-run it after editing doors: or grapher: in config.yml.',
  ],
  run,
};
