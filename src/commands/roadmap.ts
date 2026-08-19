// multivac roadmap — the changes that have not started yet. MV-89.
//
// A roadmap is the list of things an ecosystem intends to do, and multivac
// already keeps that list: every entry is a change file, one state earlier.
// Keeping it here rather than in a second artifact is the whole point — two
// lists describing the same work drift apart, and whichever one the tool does
// not read becomes fiction.
//
// Nothing here reserves an invariant id, opens a branch or blocks a release,
// and nothing here gates. Requiring a feature to appear on the roadmap first
// would be unverifiable intent, the same category MV-27 keeps print-only.

import { parseArgs, type ArgsDef } from 'citty';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import {
  HORIZONS,
  type ChangeFile,
  type Horizon,
  changePath,
  changeRel,
  changesDir,
  parseChange,
  saveChange,
  scaffoldPlanned,
  serializeChange,
} from '../change/file.js';
import { CHANGES_DIR, CONFIG_PATH, loadConfig } from '../lib/config.js';
import { undeclared } from '../lib/args.js';
import {
  LABEL_PREFIX,
  NO_TRACKER,
  binaryReady,
  closeIssue,
  createIssue,
  notInstalled,
  trackerEntry,
  trackerNames,
  updateIssue,
} from '../adapters/tracker.js';
import { say, warn } from '../lib/out.js';
import { commitBookkeeping } from './change.js';
import type { Command, Config } from '../types.js';

interface Entry {
  slug: string;
  title: string;
  horizon: Horizon;
}

/** The body's first heading — the title recorded with the intention. */
const titleOf = (body: string): string => /^#[ \t]+(.+?)[ \t]*$/m.exec(body)?.[1] ?? '';

/**
 * Every change file, partitioned. `archive/` is never read: it is closed and
 * confers nothing, the same rule verify's scan follows.
 *
 * An unparseable file is skipped rather than fatal. A broken change file is
 * `change`'s diagnostic to raise, and a roadmap that will not print because
 * one entry is malformed is worse than a roadmap one line short.
 */
async function readRoadmap(brain: string): Promise<{ planned: Entry[]; open: string[] }> {
  const dir = changesDir(brain);
  const planned: Entry[] = [];
  const open: string[] = [];
  let names: string[];
  try {
    names = (await readdir(dir)).filter((n) => n.endsWith('.md')).sort();
  } catch {
    return { planned, open };
  }
  for (const name of names) {
    let parsed;
    try {
      parsed = parseChange(await readFile(join(dir, name), 'utf8'), name);
    } catch {
      continue;
    }
    const { change, body } = parsed;
    if (change.status === 'open') open.push(change.slug);
    else if (change.status === 'planned') {
      planned.push({
        slug: change.slug,
        title: titleOf(body),
        horizon: change.horizon ?? 'later',
      });
    }
  }
  return { planned, open };
}

/**
 * Horizons in declared order, empty ones omitted, slugs ordered by codepoint —
 * never `localeCompare`, whose answer depends on the host's locale and would
 * make this listing's order a property of the machine that printed it.
 */
function list(planned: Entry[], open: string[]): void {
  if (planned.length === 0) {
    say('roadmap: empty — record an intention with `multivac roadmap add <slug> "<title>"`');
  } else {
    say(`roadmap: ${planned.length} planned`);
    for (const h of HORIZONS) {
      const items = planned
        .filter((e) => e.horizon === h)
        .sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
      if (items.length === 0) continue;
      say(`  ${h}`);
      for (const e of items) say(`    ${e.slug}${e.title === '' ? '' : ` — ${e.title}`}`);
    }
  }
  // Under its own label, always printed: a roadmap read without it invites
  // reading intention as progress.
  say(
    open.length === 0
      ? 'in flight: no open change'
      : `in flight: ${open.length} open change${open.length > 1 ? 's' : ''} — ${open.join(', ')}`,
  );
}

/** Record an intention. One file, one commit, no id, no branch, no law lock. */
async function add(brain: string, slug: string, title: string, horizon: Horizon): Promise<number> {
  const rel = changeRel(slug);
  const file = changePath(brain, slug);
  if (existsSync(file)) {
    // Which state it is in decides which command moves forward, so the refusal
    // reads the file rather than guessing from its existence.
    let status: ChangeFile['status'] = 'open';
    try {
      status = parseChange(await readFile(file, 'utf8'), rel).change.status;
    } catch {
      // Unparseable is still occupied; `change` is the surface that explains why.
    }
    warn(
      status === 'planned'
        ? `${slug} is already planned — see it with \`multivac roadmap\`, or start it with \`multivac change new ${slug}\``
        : `${slug} is already open — it started; nothing to record`,
    );
    return 1;
  }
  if (existsSync(join(changesDir(brain), 'archive', `${slug}.md`))) {
    warn(
      `${slug} is already archived at ${CHANGES_DIR}/archive/${slug}.md — this change is closed; ` +
        'start a new one with a new slug, or read it there',
    );
    return 1;
  }
  await saveChange(brain, scaffoldPlanned(slug, title, horizon));
  await commitBookkeeping(brain, [rel], `roadmap: ${slug} planned (${horizon})`);
  say(`recorded ${rel} — planned, horizon ${horizon}`);
  say(`  no invariant id is reserved until it starts: multivac change new ${slug}`);
  return 0;
}


/**
 * MV-99: the roadmap, projected to a declared tracker. ONE WAY.
 *
 * The change files are the source; issues are their projection and never a
 * second source. A projection that reads back is two lists again, which is the
 * failure the roadmap exists to end — so nothing the tracker says ever reaches
 * a change file. Closing an issue by hand closes nothing; the next sync
 * restores it, because the file said so.
 *
 * The identity is the NUMBER recorded in the change file. It survives a title
 * edit, which is what breaks the alternative — searching the tracker for a
 * matching title, the way the SDD tool's own issue command does.
 *
 * Reaches the network, so it lives here and nowhere else: `verify`, `doctor`
 * and `doors` may not, and MV-99's `absent` leg keeps it that way.
 */
async function sync(brain: string, cfg: Config): Promise<number> {
  if (!cfg.tracker || cfg.tracker === NO_TRACKER) {
    say(
      `sync: no tracker declared — add \`tracker: ${trackerNames.join('\` or \`tracker: ')}\` to ${CONFIG_PATH}`,
    );
    return 0;
  }
  const entry = trackerEntry(cfg.tracker);
  if (!entry) {
    warn(`sync: \`${cfg.tracker}\` is not a tracker multivac has verified — known: ${trackerNames.join(', ')}`);
    return 1;
  }
  if (!(await binaryReady(entry))) {
    for (const l of notInstalled(cfg.tracker, entry)) warn(l);
    return 1;
  }

  const dir = changesDir(brain);
  const files: Array<{ file: string; archived: boolean }> = [];
  for (const [sub, archived] of [['', false], ['archive', true]] as const) {
    let names: string[];
    try {
      names = (await readdir(join(dir, sub))).filter((n) => n.endsWith('.md')).sort();
    } catch {
      continue;
    }
    for (const n of names) files.push({ file: join(dir, sub, n), archived });
  }
  if (files.length === 0) {
    say('sync: no changes to project');
    return 0;
  }

  say(`sync ${cfg.tracker}: ${files.length} change${files.length > 1 ? 's' : ''} to project`);
  let recorded = 0;
  for (const { file, archived } of files) {
    let parsed;
    try {
      parsed = parseChange(await readFile(file, 'utf8'), file);
    } catch {
      continue; // a broken change file is `change`'s diagnostic to raise
    }
    const { change, body } = parsed;
    const title = titleOf(body) || change.slug;
    const label = `${LABEL_PREFIX}${change.status}`;
    const state = change.status.padEnd(8);
    if (archived || change.status === 'archived') {
      if (change.issue === undefined) continue; // nothing to close, nothing to say
      // MV-110: a swallowed error printed as "closed" is the tool reporting an
      // outcome it never had.
      const failure = await closeIssue(brain, entry, change.issue).then(
        () => null,
        (e: unknown) => (e as Error).message.split('\n')[0],
      );
      say(
        failure === null
          ? `  ${state} ${change.slug} → #${change.issue} closed`
          : `  ${state} ${change.slug} → #${change.issue} NOT closed — ${failure}`,
      );
      continue;
    }
    if (change.issue !== undefined) {
      try {
        await updateIssue(brain, entry, change.issue, title, label);
        say(`  ${state} ${change.slug} → #${change.issue} up to date`);
      } catch (e) {
        // Never a second issue: silently re-creating is how a change ends up
        // with two, and nobody can tell which one people commented on. But the
        // reason is the tool's, not a guess: every failure used to be printed
        // as "not found", including a flag the vendor does not have (MV-110).
        say(`  ${state} ${change.slug} → #${change.issue} NOT updated — ${(e as Error).message.split('\n')[0]}`);
        say(
          `  ${state} ${change.slug} → #${change.issue} not found in the tracker — reported, not re-created; clear \`issue:\` to make a new one`,
        );
      }
      continue;
    }
    const n = await createIssue(brain, entry, title, body, label).catch(() => null);
    if (n === null) {
      warn(`  ${state} ${change.slug} → could not be created; nothing recorded`);
      continue;
    }
    change.issue = n;
    await writeFile(file, serializeChange(change, body));
    recorded++;
    say(`  ${state} ${change.slug} → #${n} created`);
  }
  if (recorded > 0) {
    say(
      `recorded ${recorded} issue number${recorded > 1 ? 's' : ''} in ${CHANGES_DIR}/ — commit them: the number is the identity`,
    );
  } else {
    say('nothing recorded — every change already carries its issue number');
  }
  return 0;
}

const USAGE = 'usage: multivac roadmap add <slug> "<title>" [--horizon now|next|later]';

/** What roadmap takes. One declaration: citty parses it, `undeclared` refuses against it. */
const ARGS = {
  sub: { type: 'positional', required: false, description: 'add' },
  slug: { type: 'positional', required: false },
  title: { type: 'positional', required: false },
  horizon: { type: 'string', description: 'now, next or later. add only; defaults to later' },
} satisfies ArgsDef;

export const roadmap: Command = {
  name: 'roadmap',
  help: 'the changes that have not started yet — list them, record one',
  usage: [
    'usage: multivac roadmap [add <slug> "<title>"] [--horizon now|next|later]',
    '  (no arguments)         list planned changes by horizon, and the count in flight',
    '  add <slug> "<title>"   record an intention: one change file, planned',
    '  sync                   project the changes to the declared tracker (reaches the network)',
    'flags:',
    '  --horizon <value>      now, next or later. add only; defaults to later',
    'a planned change reserves no invariant id, opens no branch and never counts',
    'as unclosed. it is never a precondition: `change new` works without one.',
  ],
  async run(argv, ctx): Promise<number> {
    // MV-85 first, in roadmap's own words. citty parses after: the surface is
    // one subcommand, two free positionals and one valued flag.
    const bad = undeclared(
      'roadmap',
      argv,
      { flags: [], valued: ['--horizon'], positionals: 3 },
      'add <slug> "<title>" --horizon <value>',
    );
    if (bad) {
      warn(bad);
      return 2;
    }
    const parsed = parseArgs(argv, ARGS);
    const pos = parsed._;
    const horizonGiven = typeof parsed.horizon === 'string';
    const horizon = (horizonGiven ? parsed.horizon : 'later') as Horizon;
    if (horizonGiven && !HORIZONS.includes(horizon)) {
      warn(`roadmap: unknown horizon "${String(parsed.horizon)}" — use ${HORIZONS.join(', ')}`);
      return 2;
    }
    const brain = ctx.cwd;
    if (pos.length === 0) {
      if (horizonGiven) {
        warn('roadmap: --horizon applies to `roadmap add` — the listing shows every horizon');
        return 2;
      }
      const { planned, open } = await readRoadmap(brain);
      list(planned, open);
      return 0;
    }
    if (pos[0] === 'sync') {
      if (pos.length > 1) {
        warn(`roadmap: unexpected argument "${pos[1]}" — sync takes none`);
        return 2;
      }
      return await sync(brain, await loadConfig(brain));
    }
    if (pos[0] !== 'add') {
      warn(`roadmap: unexpected argument "${pos[0]}" — ${USAGE}`);
      return 2;
    }
    const [, slug, title] = pos;
    if (!slug || !/^[a-z0-9][a-z0-9._-]*$/i.test(slug)) {
      warn(`${USAGE} — slug is letters/digits/dots/dashes`);
      return 2;
    }
    if (!title) {
      warn(USAGE);
      return 2;
    }
    if (pos.length > 3) {
      warn(`roadmap: unexpected argument "${pos[3]}" — ${USAGE}`);
      return 2;
    }
    return await add(brain, slug, title, horizon);
  },
};
