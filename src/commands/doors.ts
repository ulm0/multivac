// `multivac doors` — project the door into the brain and each declared,
// present repo; install the git-hook shims. Writes working trees only, never
// commits, never clones. Missing repo -> notice, exit 0.

import {
  cpSync,
  existsSync,
  lstatSync,
  readlinkSync,
  symlinkSync,
} from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Command, CommandContext, Config } from '../types.js';
import { ConfigError, LAW_PATH, loadConfig } from '../lib/config.js';
import { say, warn } from '../lib/out.js';
import { applyManagedBlock } from '../doors/block.js';
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

/** Copy the packaged skill to where the target's `skill` path says it lives. */
function installSkill(dir: string, skill: string, notices: string[]): void {
  const root = packageRoot();
  const skillSrc = root ? join(root, 'skills', 'multivac') : null;
  if (skillSrc && existsSync(skillSrc)) {
    cpSync(skillSrc, join(dir, dirname(skill)), { recursive: true });
  } else {
    notices.push(
      'packaged skill skills/multivac missing — reinstall multivac to get it',
    );
  }
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
    await writeFile(settingsFile, merged);
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
  await writeFile(doorFile, applyManagedBlock(await readOrNull(doorFile), body));
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
      // Tool-owned stub file: frontmatter where the format needs one, then
      // the managed block.
      const file = join(dir, t.door);
      await mkdir(dirname(file), { recursive: true });
      const stub = applyManagedBlock(
        null,
        'Read `AGENTS.md` at the repo root — the multivac door: what is law here, where the brain lives. Run `multivac verify` before you commit.',
      );
      await writeFile(file, t.frontmatter ? `${t.frontmatter}\n\n${stub}` : stub);
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

async function run(_argv: string[], ctx: CommandContext): Promise<number> {
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

  const consumerBody = renderConsumerDoor(config);
  for (const [key, entry] of Object.entries(config.repos)) {
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
  return 0;
}

export const doorsCommand: Command = {
  name: 'doors',
  help: 'project doors + install git hooks into the brain and declared repos',
  usage: [
    'usage: multivac doors',
    'No arguments. Runs in the brain and acts on it plus every declared repo',
    'present on disk: writes AGENTS.md, projects it per declared door, installs',
    'the git hooks, and wires the grapher refresh into every harness that has a',
    'post-edit hook. Re-run it after editing doors: or grapher: in config.yml.',
  ],
  run,
};
