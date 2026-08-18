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

import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
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
} from '../change/file.js';
import { CHANGES_DIR } from '../lib/config.js';
import { say, warn } from '../lib/out.js';
import { commitBookkeeping } from './change.js';
import type { Command } from '../types.js';

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

const USAGE = 'usage: multivac roadmap add <slug> "<title>" [--horizon now|next|later]';

export const roadmap: Command = {
  name: 'roadmap',
  help: 'the changes that have not started yet — list them, record one',
  usage: [
    'usage: multivac roadmap [add <slug> "<title>"] [--horizon now|next|later]',
    '  (no arguments)         list planned changes by horizon, and the count in flight',
    '  add <slug> "<title>"   record an intention: one change file, planned',
    'flags:',
    '  --horizon <value>      now, next or later. add only; defaults to later',
    'a planned change reserves no invariant id, opens no branch and never counts',
    'as unclosed. it is never a precondition: `change new` works without one.',
  ],
  async run(argv, ctx): Promise<number> {
    // MV-85, hand-rolled: the surface is one subcommand and one valued flag,
    // which the shared helper's positional model does not describe.
    const pos: string[] = [];
    let horizon: Horizon = 'later';
    let horizonGiven = false;
    for (let i = 0; i < argv.length; i++) {
      const a = argv[i];
      if (a === '--horizon') {
        const v = argv[++i];
        if (v === undefined || !HORIZONS.includes(v as Horizon)) {
          warn(`roadmap: unknown horizon "${v ?? ''}" — use ${HORIZONS.join(', ')}`);
          return 2;
        }
        horizon = v as Horizon;
        horizonGiven = true;
      } else if (a.startsWith('-')) {
        warn(
          `roadmap: unknown flag "${a}" — roadmap takes add <slug> "<title>" --horizon <value>`,
        );
        return 2;
      } else pos.push(a);
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
