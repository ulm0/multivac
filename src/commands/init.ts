// multivac init — scaffold the brain: content at root, machinery in .multivac/.
// Enumerated side effects only (design §CLI). Idempotent: re-running updates
// managed blocks, never duplicates or destroys user content.

import { access, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { Command, CommandContext } from '../types.js';
import { lsFiles, run as git } from '../lib/git.js';
import { say } from '../lib/out.js';
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

The law lives in \`invariants.md\` (anchored claims); every decision enters
as a \`multivac change\`. Run \`multivac verify\` before acting on anything
you read here.`;

interface Flags {
  dir?: string;
  agents: string[];
  sdd?: string;
  grapher?: string;
}

function parseFlags(argv: string[]): Flags {
  const f: Flags = { agents: [] };
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
      default:
        if (a.startsWith('-')) {
          throw new Error(
            `init: unknown flag ${a} — known: --agent <a,b>, --sdd <name>, --grapher <name>`,
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

async function runInit(argv: string[], ctx: CommandContext): Promise<number> {
  const f = parseFlags(argv);
  const dir = resolve(ctx.cwd, f.dir ?? '.');
  await mkdir(dir, { recursive: true });

  // 3. git init when the directory is not already a git repo.
  if (!(await isRepoRoot(dir))) {
    await git(dir, ['init', '-q']);
    say('init: git init — the brain is git-native');
  }

  // 2. machinery: config.yml (flags land here), gitignored cache/.
  await mkdir(join(dir, '.multivac', 'cache'), { recursive: true });
  await writeIfMissing(join(dir, '.multivac', '.gitignore'), 'cache/\n');
  const cfgPath = join(dir, '.multivac', 'config.yml');
  if (await exists(cfgPath)) {
    say('init: .multivac/config.yml kept — edit it directly, then `multivac doors`');
  } else {
    // Tracked source already here = the brain is its own code repo.
    const brainIsCode = (await lsFiles(dir).catch(() => [])).length > 0;
    await writeFile(cfgPath, renderConfig(f, await detectAdapters(dir), brainIsCode));
    say(
      brainIsCode
        ? 'init: wrote .multivac/config.yml — brain==code (repos: brain: .); add sibling repos there'
        : 'init: wrote .multivac/config.yml — declare your repos under repos:',
    );
  }

  // 1. content at root: AGENTS.md (managed block only), invariants.md, changes/.
  const doorPath = join(dir, 'AGENTS.md');
  const existing = await readFile(doorPath, 'utf8').catch(() => null);
  const next = applyManagedBlock(existing, DOOR_BODY);
  if (next !== existing) {
    await writeFile(doorPath, next);
    say(
      existing === null
        ? 'init: wrote AGENTS.md — the door; your agent reads it first'
        : 'init: updated the managed block in AGENTS.md — your content untouched',
    );
  }
  if (await writeIfMissing(join(dir, 'invariants.md'), INVARIANTS_HEADER)) {
    say('init: wrote invariants.md — the law table, zero rows');
  }
  await mkdir(join(dir, 'changes'), { recursive: true });
  await writeIfMissing(join(dir, 'changes', '.gitkeep'), '');

  // 4. enforcement floor: versioned hooks + core.hooksPath.
  await installHooks(dir);
  say('init: hooks in .multivac/hooks (core.hooksPath) — verify runs on commit');

  say('init: done — load the multivac skill to fill the brain (see AGENTS.md)');
  return 0;
}

export const init: Command = {
  name: 'init',
  help: 'scaffold the brain: content at root, machinery in .multivac/',
  run: runInit,
};
