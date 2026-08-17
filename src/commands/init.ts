// multivac init — scaffold the brain: everything multivac owns under
// .multivac/, AGENTS.md at the root (the one file harnesses read there).
// Enumerated side effects only (design §CLI). Idempotent: re-running updates
// managed blocks, never duplicates or destroys user content.

import { access, mkdir, readFile, realpath, rename, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { Command, CommandContext } from '../types.js';
import { PROJECTED_PATH, recordBody, selfVersion } from '../lib/version.js';
import { doorTargets, grapherNames, sddNames } from '../adapters/registry.js';
import { doorsCommand } from './doors.js';
import {
  BRAIN_PATHS,
  CHANGES_DIR,
  LAW_PATH,
  RITUAL_PATH,
  layoutError,
  legacyLayout,
  loadConfig,
} from '../lib/config.js';
import { RITUAL_TEMPLATE } from '../lib/ritual.js';
import { ignoredPaths, lsFiles, run as git } from '../lib/git.js';
import { acid, bold, dim, say, warn } from '../lib/out.js';
import { banner } from '../lib/banner.js';
import { applyManagedBlock } from '../doors/block.js';
import { projectLawLines } from '../doors/brain.js';
import { PRECOMMIT_MISSING_FIX, installHooks } from '../hooks/install.js';
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
      case '--provider':
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
          // MV-85: a usage error is exit 2, and a throw is mapped to 1 by the
          // dispatcher. init refused correctly and reported the wrong code, so
          // the documented matrix was false for it alone.
          throw new UsageError(
            `init: unknown flag ${a} — known: --provider <a,b>, --sdd <name>, --grapher <name>, --quiet`,
          );
        }
        f.dir = a;
    }
  }
  return f;
}

/**
 * The record: which version this brain was deliberately brought to (MV-86).
 * Tool-owned, and written only here and by `doors --adopt` — a record that
 * moved as a side effect of any command would silence the notice without the
 * upgrade having been taken.
 */
async function stamp(brainDir: string): Promise<void> {
  await writeFile(join(brainDir, PROJECTED_PATH), recordBody(selfVersion()));
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

/** First line of the block init appends to a swallowing .gitignore. */
export const GITIGNORE_MARKER =
  '# multivac: keep the brain visible to git — added by `multivac init`';

/**
 * A repo-level ignore can swallow the brain — saleor's `.gitignore` opens
 * with `.*`, so everything init writes is invisible to git while every
 * command stays green, and a stranger commits, pushes, and ships nothing
 * (measurement 2, blocker 1). init asks `git check-ignore` about every path
 * it writes and, on a hit, appends explicit negations to the repo's
 * .gitignore under a marker comment.
 *
 * Append, not refuse, because the negation order is easy to get wrong by
 * hand (a directory must be un-ignored before its contents can be), the
 * block is scoped to paths init owns, and a root-.gitignore negation
 * outranks .git/info/exclude and core.excludesFile — every source git
 * consults for these paths. A negation inside .multivac/.gitignore cannot
 * work: the ignore lives in the parent. Idempotent: lines already present
 * are never appended again, and a clean repo is never touched.
 */
async function ensureVisibleToGit(dir: string, report: Report): Promise<void> {
  const ignored = await ignoredPaths(dir, BRAIN_PATHS);
  if (ignored.length === 0) return;
  // `!.multivac/` first: git will not re-include files under a directory
  // that is itself still excluded.
  const negations: string[] = [];
  if (ignored.some((p) => p.startsWith('.multivac/'))) {
    negations.push('!.multivac/', '!.multivac/**');
  }
  if (ignored.includes('AGENTS.md')) negations.push('!AGENTS.md');
  const giPath = join(dir, '.gitignore');
  const text = await readFile(giPath, 'utf8').catch(() => '');
  const have = new Set(text.split('\n'));
  const add = negations.filter((l) => !have.has(l));
  report(
    `init: this repo's .gitignore would ignore ${ignored.join(', ')} — ` +
      'an invisible brain commits nothing',
  );
  if (add.length > 0) {
    const block = [
      ...(have.has(GITIGNORE_MARKER) ? [] : [GITIGNORE_MARKER]),
      ...add,
    ].join('\n');
    const sep = text === '' || text.endsWith('\n') ? '' : '\n';
    await writeFile(giPath, `${text}${sep}${block}\n`);
    report(`init: appended to .gitignore: ${add.join('  ')}`);
  }
  const still = await ignoredPaths(dir, BRAIN_PATHS);
  if (still.length > 0) {
    warn(
      `init: still ignored after the negations: ${still.join(', ')} — ` +
        'a deeper .gitignore is excluding them; remove that rule by hand',
    );
  } else {
    report('init: re-checked — every brain path is visible to git');
  }
}

/** A refusal about the command line itself: exit 2, never 1 (MV-85). */
class UsageError extends Error {}

async function runInit(argv: string[], ctx: CommandContext): Promise<number> {
  let f: Flags;
  try {
    f = parseFlags(argv);
  } catch (e) {
    if (e instanceof UsageError) {
      warn(e.message);
      return 2;
    }
    throw e;
  }
  // --quiet: the whole report goes, banner included. Refusals stay on stderr.
  //
  // Two voices. The scaffolding lines are a receipt — true, and read once —
  // so they go dim; the closing call to action is the only thing on screen a
  // reader has to act on, so it keeps full ink. Colour is never spliced into
  // the middle of a line: whole-line wrapping leaves every substring intact
  // for anything grepping this output, ANSI or not, and `dim`/`acid` are
  // already no-ops when stdout is not a TTY or NO_COLOR is set.
  const emit: Report = f.quiet ? () => {} : say;
  const report: Report = (l) => emit(l === '' ? l : dim(l));
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

  // The brain must be visible to git before anything is written into it.
  await ensureVisibleToGit(dir, report);

  // 2. machinery: config.yml (flags land here), gitignored cache/ + worktrees/
  // (change apply puts one checkout per change there — never committed).
  await mkdir(join(dir, '.multivac', 'cache'), { recursive: true });
  await writeIfMissing(join(dir, '.multivac', '.gitignore'), 'cache/\nworktrees/\n');
  await stamp(dir);
  const cfgPath = join(dir, '.multivac', 'config.yml');
  // Tracked source already here = the brain is its own code repo. Decided
  // before the config branch because the closing call to action needs it too:
  // it is what picks discovery over the interview.
  const brainIsCode = (await lsFiles(dir).catch(() => [])).length > 0;
  if (await exists(cfgPath)) {
    report('init: .multivac/config.yml kept — edit it directly, then `multivac doors`');
  } else {
    await writeFile(cfgPath, renderConfig(f, await detectAdapters(dir), brainIsCode));
    report(
      brainIsCode
        ? 'init: wrote .multivac/config.yml — brain==code (repos: brain: .); add sibling repos there'
        : 'init: wrote .multivac/config.yml — declare your repos under repos:',
    );
  }

  // 1. the door — the one file that stays at the root, because that is where
  // harnesses look for it. Managed block only; user content untouched.
  // An sdd declared here brings its project-level document with it: `doors`
  // is a later, separate command, and a constitution the agent is only told
  // about on the second command is one nobody writes.
  const sddName = f.sdd ?? (await loadConfig(dir).catch(() => null))?.sdd;
  const law = sddName ? projectLawLines(sddName) : [];
  const body =
    law.length > 0
      ? `${DOOR_BODY}\n\nFeatures gate through the \`${sddName}\` SDD, in that tool's OWN flow:\n${law.join('\n')}`
      : DOOR_BODY;
  const doorPath = join(dir, 'AGENTS.md');
  const existing = await readFile(doorPath, 'utf8').catch(() => null);
  const next = applyManagedBlock(existing, body);
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

  // 4. enforcement floor: versioned hooks + core.hooksPath — but never over
  // the repo's own gates. The strategy used is part of the report.
  const hooks = await installHooks(dir);
  switch (hooks.strategy) {
    case 'fresh':
      report('init: hooks in .multivac/hooks (core.hooksPath) — verify runs on commit');
      break;
    case 'chained': {
      // Name only what actually runs: a manager config with nothing installed
      // in .git/hooks is not "runs first" unless the shim can arm it itself.
      const first = [...hooks.chained];
      if (hooks.preCommit === 'run') {
        first.push(
          '.pre-commit-config.yaml via `pre-commit run` (`pre-commit install` refuses while core.hooksPath is set)',
        );
      }
      report(
        first.length > 0
          ? 'init: hooks in .multivac/hooks (core.hooksPath) — chained: ' +
              `${first.join(', ')} runs first, its exit code wins, then verify`
          : 'init: hooks in .multivac/hooks (core.hooksPath) — ' +
              `${hooks.managers.join(', ')} detected; its .git/hooks hooks chain first once installed, then verify`,
      );
      if (hooks.preCommit === 'no-binary') {
        warn(
          "init: .pre-commit-config.yaml present but the pre-commit binary is not installed — the project's gate will not run until it is; " +
            PRECOMMIT_MISSING_FIX,
        );
      }
      break;
    }
    case 'alongside':
      report(
        `init: hooks installed alongside into ${hooks.dir} ` +
          `(this repo's own hook dir${hooks.managers.length > 0 ? `: ${hooks.managers.join(', ')}` : ''}) — core.hooksPath not touched`,
      );
      for (const w of hooks.wired) report(`init: ${w} already runs multivac — left alone`);
      break;
  }
  // Refusals are loud even under --quiet: a gate that did not install is not
  // a detail.
  for (const r of hooks.refused) {
    warn(`init: ${r.path} exists and does not run multivac — NOT touched; ${r.fix}`);
  }

  // Project what was just declared. `init` already writes AGENTS.md and arms
  // the git hooks, so "flags configure, they never perform" was only ever half
  // true — and the half that was missing is the half a first-time user sees:
  // `init --provider claude` wrote `claude` into doors: and then told them to
  // load a skill it had not installed. `doors` is idempotent and is the one
  // code path that knows how to project every target, so call it rather than
  // grow a second one here. Nothing to project (`doors: [agents]` alone) is
  // the ordinary case and it is a no-op.
  if (f.agents.length > 0) await doorsCommand.run([], { cwd: dir });

  // The last word is a call to action, not a full stop. init leaves a brain
  // that is scaffolded and empty, and "load the skill" alone left the reader
  // to discover session zero — that there are two flows and which one is
  // theirs — from the door. Both are named here, and the branch is decided,
  // not asked: tracked source means there is an ecosystem to read, an empty
  // repo means there is one to invent. The steps stay pointers into the
  // skill; init does not restate a protocol that lives there.
  emit('');
  emit(bold(acid('init: done — the brain is scaffolded and empty. Session zero fills it:')));
  emit('init:   1. load the multivac skill in your agent — it carries both protocols');
  emit(
    brainIsCode
      ? 'init:   2. discovery — `multivac seed` inventories this code, then draft proposed claims from it'
      : 'init:   2. interview — no code here yet, so the law comes from a human, claim by claim',
  );
  emit('init:   3. a human enacts each row in .multivac/invariants.md, then `multivac verify`');
  return 0;
}

export const init: Command = {
  name: 'init',
  help: 'scaffold the brain: everything multivac owns under .multivac/',
  usage: [
    'usage: multivac init [dir] [--provider a,b] [--sdd <name>] [--grapher <name>] [--quiet]',
    '  dir                the brain; defaults to the working directory',
    `  --provider a,b     comma-separated coding agents to project the door for —`,
    `                     ${Object.keys(doorTargets).filter((k) => k !== 'agents').join(', ')}`,
    `  --sdd <name>       spec-driven-development adapter — ${sddNames.join(', ')}`,
    `  --grapher <name>   code-graph tool — ${grapherNames.join(', ')}, or one you declare in graphers:`,
    '  --quiet            no banner',
    'AGENTS.md is always written and is never a --provider value: agents.md is the',
    'open format every door projects FROM, not a tool you could have installed.',
    'Whatever you name here is projected right away — the door, the skill and the',
    "harness hooks — so init leaves nothing owed. `multivac doors` re-runs that",
    'projection after you edit doors: or grapher: by hand.',
  ],
  run: runInit,
};
