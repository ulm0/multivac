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
import { ConfigError, loadConfig } from '../lib/config.js';
import { say, warn } from '../lib/out.js';
import { applyManagedBlock } from '../doors/block.js';
import { countActiveInvariants, renderBrainDoor } from '../doors/brain.js';
import { renderConsumerDoor } from '../doors/consumer.js';
import { mergeClaudeSettings } from '../doors/settings.js';
import { installHooks } from '../hooks/install.js';
import { doorTargets } from '../adapters/registry.js';

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

/** CLAUDE.md -> AGENTS.md symlink. Returns a notice line, or null when done. */
function linkClaudeMd(dir: string): string | null {
  const link = join(dir, 'CLAUDE.md');
  try {
    const st = lstatSync(link, { throwIfNoEntry: false });
    if (st?.isSymbolicLink()) {
      if (readlinkSync(link) === 'AGENTS.md') return null; // already ours
      return 'CLAUDE.md is a symlink elsewhere — repoint it at AGENTS.md or remove it';
    }
    if (st) {
      return 'CLAUDE.md exists as a regular file — merge it into AGENTS.md and remove it to get the symlink';
    }
    symlinkSync('AGENTS.md', link);
    return null;
  } catch {
    return 'symlink not permitted on this platform — read AGENTS.md directly or enable developer mode';
  }
}

/** claude target: symlink + packaged skill + settings.json hook entries. */
async function projectClaude(dir: string, notices: string[]): Promise<void> {
  const linkNotice = linkClaudeMd(dir);
  if (linkNotice) notices.push(linkNotice);

  const root = packageRoot();
  const skillSrc = root ? join(root, 'skills', 'multivac') : null;
  if (skillSrc && existsSync(skillSrc)) {
    cpSync(skillSrc, join(dir, '.claude', 'skills', 'multivac'), {
      recursive: true,
    });
  } else {
    notices.push(
      'packaged skill skills/multivac missing — reinstall multivac to get it',
    );
  }

  const settingsFile = join(dir, '.claude', 'settings.json');
  try {
    const merged = mergeClaudeSettings(await readOrNull(settingsFile));
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
): Promise<string[]> {
  const notices: string[] = [];
  const doorFile = join(dir, 'AGENTS.md');
  await writeFile(doorFile, applyManagedBlock(await readOrNull(doorFile), body));
  for (const target of config.doors) {
    if (target === 'agents') continue; // the canonical file, already written
    if (target === 'claude') {
      await projectClaude(dir, notices);
      continue;
    }
    const t = doorTargets[target];
    if (t?.kind === 'stub-with-frontmatter') {
      // Tool-owned stub file: frontmatter first, then the managed block.
      const file = join(dir, t.door);
      await mkdir(dirname(file), { recursive: true });
      const stub = applyManagedBlock(
        null,
        'Read `AGENTS.md` at the repo root — the multivac door: what is law here, where the brain lives. Run `multivac verify` before you commit.',
      );
      await writeFile(file, `${t.frontmatter}\n\n${stub}`);
      continue;
    }
    notices.push(
      `unknown door target "${target}" — known: ${KNOWN_TARGETS.join(', ')}`,
    );
  }
  await installHooks(dir, { strictPrePush: config.strictPrePush });
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

  const invariants = await readOrNull(join(brainDir, 'invariants.md'));
  const active = invariants === null ? 0 : countActiveInvariants(invariants);
  const report = (name: string, notices: string[]): void => {
    say(`${name}: door + hooks updated`);
    for (const n of notices) say(`${name}: notice: ${n}`);
  };

  report('brain', await projectInto(brainDir, renderBrainDoor(config, active), config));

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
    report(key, await projectInto(dir, consumerBody, config));
  }
  return 0;
}

export const doorsCommand: Command = {
  name: 'doors',
  help: 'project doors + install git hooks into the brain and declared repos',
  run,
};
