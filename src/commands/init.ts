// multivac init — scaffold the brain: everything multivac owns under
// .multivac/, AGENTS.md at the root (the one file harnesses read there).
// Enumerated side effects only (design §CLI). Idempotent: re-running updates
// managed blocks, never duplicates or destroys user content.

import { access, mkdir, readFile, realpath, rename, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { Command, CommandContext } from '../types.js';
import { CHANGES_DIR, LAW_PATH, RITUAL_PATH, layoutError, legacyLayout } from '../lib/config.js';
import { RITUAL_TEMPLATE } from '../lib/ritual.js';
import { lsFiles, run as git } from '../lib/git.js';
import { say, warn } from '../lib/out.js';
import { banner } from '../lib/banner.js';
import { applyManagedBlock } from '../doors/block.js';
import { installHooks } from '../hooks/install.js';
import { detectAdapters, type Detected } from '../adapters/detect.js';

export type { Detected };

// ---------------------------------------------------------------------------

const INVARIANTS_HEADER = `# Invariants

| ID | statement | authority | state | date | source |
| --- | --- | --- | --- | --- | --- |
`;

const DOOR_BODY = `# multivac

This brain is empty on purpose. Load the multivac skill and fill it:
- existing ecosystem: \`multivac seed\`, then validate the proposed rows
- from scratch: run the interview

The law lives in \`${LAW_PATH}\` (anchored claims); every decision enters
as a \`multivac change\`. The ritual — the closing ceremony no tool can
check — is \`${RITUAL_PATH}\`, printed by \`change close\`. Run
\`multivac verify\` before acting on anything you read here.`;

interface Flags {
  dir?: string;
  agents: string[];
  sdd?: string;
  grapher?: string;
  quiet: boolean;
}

/** Where init's report goes. `--quiet` swaps it for a sink that drops it. */
type Report = (line: string) => void;

function parseFlags(argv: string[]): Flags {
  const f: Flags = { agents: [], quiet: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const eq = a.indexOf('=');
    const key = eq === -1 ? a : a.slice(0, eq);
    const val = (): string => {
      const v = eq === -1 ? argv[++i] : a.slice(eq + 1);
      if (v === undefined || v === '') {
        throw new Error(`init: ${key} needs a value — e.g. ${key} <name>`);
      }
      return v;
    };
    switch (key) {
      case '--agent':
        f.agents.push(...val().split(',').filter(Boolean));
        break;
      case '--sdd':
        f.sdd = val();
        break;
      case '--grapher':
        f.grapher = val();
        break;
      case '--quiet':
        f.quiet = true;
        break;
      default:
        if (a.startsWith('-')) {
          throw new Error(
            `init: unknown flag ${a} — known: --agent <a,b>, --sdd <name>, --grapher <name>, --quiet`,
          );
        }
        f.dir = a;
    }
  }
  return f;
}

/** Render .multivac/config.yml: flags land as keys, detections as comment proposals. */
function renderConfig(f: Flags, d: Detected, brainIsCode: boolean): string {
  const doors = [...new Set(['agents', ...f.agents])];
  const lines = [
    '# multivac configuration — seeded by `multivac init`.',
    '# Edit directly; adopting a new agent later is one line here + `multivac doors`.',
    `doors: [${doors.join(', ')}]`,
  ];
  const proposed = d.doors.filter((x) => !doors.includes(x));
  if (proposed.length > 0) {
    lines.push(
      `# detected ${proposed.join(', ')} artifacts — to project the door there, use:`,
      `# doors: [${[...doors, ...proposed].join(', ')}]`,
    );
  }
  if (f.sdd) lines.push(`sdd: ${f.sdd}`);
  else if (d.sdd) {
    lines.push(`# detected ${d.sdd} artifacts — uncomment to enable:`, `# sdd: ${d.sdd}`);
  }
  if (f.grapher) lines.push(`grapher: ${f.grapher}`);
  else if (d.grapher) {
    lines.push(
      `# detected ${d.grapher} artifacts — uncomment to enable:`,
      `# grapher: ${d.grapher}`,
    );
  }
  if (brainIsCode) {
    // brain==code: this repo already has source, so it is its own code repo.
    lines.push(
      '# brain==code: this repo is both the brain and the code it governs.',
      '# `brain: .` says so — anchors target `brain:<glob>` and the change',
      '# lifecycle branches here. Add sibling repos as more keys.',
      'repos:',
      '  brain: .',
      '#   backend: ../backend   # bare string = { path }',
    );
  } else {
    lines.push('# repos:', '#   backend: ../backend   # bare string = { path }');
  }
  return lines.join('\n') + '\n';
}

async function exists(p: string): Promise<boolean> {
  return access(p).then(
    () => true,
    () => false,
  );
}

/** Write only when absent; returns whether it wrote. Never clobbers. */
async function writeIfMissing(p: string, content: string): Promise<boolean> {
  try {
    await writeFile(p, content, { flag: 'wx' });
    return true;
  } catch {
    return false;
  }
}

/** True when dir itself is a git repo root (not merely inside a parent repo). */
async function isRepoRoot(dir: string): Promise<boolean> {
  try {
    const top = await git(dir, ['rev-parse', '--show-toplevel']);
    return (await realpath(top)) === (await realpath(dir));
  } catch {
    return false;
  }
}

/**
 * Brains written before the move keep the law and the changes at the root.
 * init is the migration, and `legacyLayout` decides what it may touch: only
 * multivac's own files, in a directory that is already a brain — never a
 * same-named file the user wrote (see `looksLikeOurs`). It says every path
 * before it moves any of them, `git mv`s where the file is tracked so history
 * follows it, plain-renames otherwise, and never moves onto a path that
 * exists: an occupied target is a refusal, not an overwrite.
 */
async function migrateLegacy(dir: string, report: Report): Promise<void> {
  const { moves, ambiguous } = await legacyLayout(dir);
  // Half a migration is worse than none: with any pair unresolvable, the
  // refusal below is the whole answer and nothing moves.
  if (ambiguous || moves.length === 0) return;
  report('init: this brain still keeps the pre-.multivac layout — moving, in order:');
  for (const [legacy, now] of moves) report(`init:   ${legacy} -> ${now}`);
  for (const [legacy, now] of moves) {
    const from = join(dir, legacy);
    const to = join(dir, now);
    if (await exists(to)) {
      warn(`init: ${now} appeared — leaving ${legacy} where it is, nothing overwritten`);
      continue;
    }
    const moved = await git(dir, ['mv', legacy, now]).then(
      () => true,
      () => false,
    );
    if (!moved) await rename(from, to);
    report(`init: moved ${legacy} -> ${now}${moved ? ' (git mv, history preserved)' : ''}`);
  }
}

async function runInit(argv: string[], ctx: CommandContext): Promise<number> {
  const f = parseFlags(argv);
  // --quiet: the whole report goes, banner included. Refusals stay on stderr.
  const report: Report = f.quiet ? () => {} : say;
  const dir = resolve(ctx.cwd, f.dir ?? '.');
  await mkdir(dir, { recursive: true });

  // The mark, once, where a human is watching: `init` is the only command that
  // prints it. NO_COLOR drops the colour and keeps the drawing.
  const mark = banner({
    quiet: f.quiet,
    tty: process.stdout.isTTY === true,
    color: process.env.NO_COLOR === undefined,
  });
  if (mark !== null) say(mark);

  // 3. git init when the directory is not already a git repo.
  if (!(await isRepoRoot(dir))) {
    await git(dir, ['init', '-q']);
    report('init: git init — the brain is git-native');
  }

  // 0. an older brain gets moved, not clobbered — before anything is scaffolded,
  // or the scaffolding itself would create the second layout.
  await mkdir(join(dir, '.multivac'), { recursive: true });
  await migrateLegacy(dir, report);
  const stale = await layoutError(dir);
  if (stale) {
    warn(`init: ${stale}`);
    return 1;
  }

  // 2. machinery: config.yml (flags land here), gitignored cache/ + worktrees/
  // (change apply puts one checkout per change there — never committed).
  await mkdir(join(dir, '.multivac', 'cache'), { recursive: true });
  await writeIfMissing(join(dir, '.multivac', '.gitignore'), 'cache/\nworktrees/\n');
  const cfgPath = join(dir, '.multivac', 'config.yml');
  if (await exists(cfgPath)) {
    report('init: .multivac/config.yml kept — edit it directly, then `multivac doors`');
  } else {
    // Tracked source already here = the brain is its own code repo.
    const brainIsCode = (await lsFiles(dir).catch(() => [])).length > 0;
    await writeFile(cfgPath, renderConfig(f, await detectAdapters(dir), brainIsCode));
    report(
      brainIsCode
        ? 'init: wrote .multivac/config.yml — brain==code (repos: brain: .); add sibling repos there'
        : 'init: wrote .multivac/config.yml — declare your repos under repos:',
    );
  }

  // 1. the door — the one file that stays at the root, because that is where
  // harnesses look for it. Managed block only; user content untouched.
  const doorPath = join(dir, 'AGENTS.md');
  const existing = await readFile(doorPath, 'utf8').catch(() => null);
  const next = applyManagedBlock(existing, DOOR_BODY);
  if (next !== existing) {
    await writeFile(doorPath, next);
    report(
      existing === null
        ? 'init: wrote AGENTS.md — the door; your agent reads it first'
        : 'init: updated the managed block in AGENTS.md — your content untouched',
    );
  }
  if (await writeIfMissing(join(dir, LAW_PATH), INVARIANTS_HEADER)) {
    report(`init: wrote ${LAW_PATH} — the law table, zero rows`);
  }
  if (await writeIfMissing(join(dir, RITUAL_PATH), RITUAL_TEMPLATE)) {
    report(`init: wrote ${RITUAL_PATH} — empty; what you write there, \`change close\` prints`);
  }
  await mkdir(join(dir, CHANGES_DIR), { recursive: true });
  await writeIfMissing(join(dir, CHANGES_DIR, '.gitkeep'), '');

  // 4. enforcement floor: versioned hooks + core.hooksPath.
  await installHooks(dir);
  report('init: hooks in .multivac/hooks (core.hooksPath) — verify runs on commit');

  report('init: done — load the multivac skill to fill the brain (see AGENTS.md)');
  return 0;
}

export const init: Command = {
  name: 'init',
  help: 'scaffold the brain: everything multivac owns under .multivac/',
  run: runInit,
};
