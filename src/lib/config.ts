// Load and validate .multivac/config.yml. Every error says how to fix it.

import { access, lstat, readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import { samePath } from './paths.js';
import type { Config, Mode, RepoEntry } from '../types.js';

export class ConfigError extends Error {}

// THE source of truth for the anchor mode vocabulary. Code derives from it or
// from `Mode` in src/types.ts, but prose quotes the list by hand. Adding a
// mode, walk this checklist — every quoter, then `pnpm test` + `verify --strict`:
//   src/types.ts (Mode union)      src/anchor/parse.ts (GRAMMAR + mode reject)
//   src/commands/help.ts           src/commands/count.ts (usage + summary)
//   DESIGN.md                      site/content/_index.md
//   site/content/docs/guide/writing-anchors.md
//   site/content/docs/concepts/claims-and-anchors.md
//   site/content/docs/reference/commands.md
//   site/content/docs/reference/configuration.md
//   site/content/docs/reference/hooks.md
//   skills/multivac/references/anchors.md
const MODES: Mode[] = ['present', 'absent', 'unique', 'count', 'each'];
// Everything multivac creates lives here. AGENTS.md at the root is the one
// exception: harnesses read it there.
export const CONFIG_PATH = '.multivac/config.yml';
export const LAW_PATH = '.multivac/invariants.md';
export const CHANGES_DIR = '.multivac/changes';
/** The team's half of the closing ceremony — prose multivac prints, never parses. */
export const RITUAL_PATH = '.multivac/ritual.md';
/**
 * Every tracked file `init` writes — the check-ignore targets. A repo-level
 * ignore (saleor's `.gitignore` starts with `.*`) can swallow the whole brain
 * while every command stays green; init and doctor both check this list.
 */
export const BRAIN_PATHS = [
  'AGENTS.md',
  CONFIG_PATH,
  LAW_PATH,
  RITUAL_PATH,
  `${CHANGES_DIR}/.gitkeep`,
  '.multivac/hooks/pre-commit',
  '.multivac/hooks/pre-push',
];
/** Where the law and the changes used to live, before they moved. */
export const LEGACY: Array<[legacy: string, now: string]> = [
  ['invariants.md', LAW_PATH],
  ['changes', CHANGES_DIR],
];

const exists = (p: string): Promise<boolean> => access(p).then(() => true, () => false);

/** The law table's header row — the schema multivac writes and reads. */
const LAW_HEADER = /^\|\s*ID\s*\|\s*statement\s*\|\s*authority\s*\|\s*state\s*\|\s*date\s*\|\s*source\s*\|/m;

/** A change file is YAML frontmatter carrying a slug and a lifecycle status. */
function isChangeFile(text: string): boolean {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!m) return false;
  let fm: unknown;
  try {
    fm = parse(m[1]);
  } catch {
    return false;
  }
  const o = fm as { slug?: unknown; status?: unknown } | null;
  if (o === null || typeof o !== 'object') return false;
  return typeof o.slug === 'string' && (o.status === 'open' || o.status === 'archived');
}

/**
 * Is the thing at `abs` content multivac wrote, or content that merely shares
 * a name with it? `invariants.md` and `changes/` are ordinary names — plenty
 * of repos keep their own — so the name proves nothing and only the content
 * does: the law table's six-column header, or a directory holding at least one
 * parseable change file (its `archive/` counts; a closed brain has them all
 * there). Anything else is somebody else's file and multivac never touches it.
 *
 * A symlink is never ours: multivac writes real files. Moving one would carry
 * the link and leave its relative target dangling, so the answer is always no
 * and the author's indirection stays where they put it.
 */
async function looksLikeOurs(abs: string, kind: 'law' | 'changes'): Promise<boolean> {
  if (await lstat(abs).then((s) => s.isSymbolicLink(), () => false)) return false;
  if (kind === 'law') {
    const text = await readFile(abs, 'utf8').catch(() => null);
    // Fenced blocks are quotation, not schema: a doc that shows the law header
    // as an example is still the author's doc.
    return text !== null && LAW_HEADER.test(text.replace(/^```[\s\S]*?^```/gm, ''));
  }
  for (const dir of [abs, join(abs, 'archive')]) {
    const names = await readdir(dir).catch(() => [] as string[]);
    for (const name of names) {
      if (!name.endsWith('.md')) continue;
      const text = await readFile(join(dir, name), 'utf8').catch(() => null);
      if (text !== null && isChangeFile(text)) return true;
    }
  }
  return false;
}

export interface LegacyLayout {
  /** Root paths multivac owns that still have to move, in migration order. */
  moves: Array<[legacy: string, now: string]>;
  /** Set when both copies are multivac's: the tool cannot pick, the author must. */
  ambiguous: string | null;
}

/**
 * What of the pre-.multivac layout is still at the root of this brain.
 *
 * Two guards, because the alternative is moving a stranger's files. Nothing
 * counts outside a brain — `.multivac/config.yml` is the marker, and it
 * predates the move, so every brain written before it has one — and nothing
 * counts unless its content is multivac's own (`looksLikeOurs`). A repo that
 * keeps its own `invariants.md` next to multivac's is a legitimate steady
 * state, not a defect: it reports nothing at all.
 */
export async function legacyLayout(brainDir: string): Promise<LegacyLayout> {
  const out: LegacyLayout = { moves: [], ambiguous: null };
  if (!(await exists(join(brainDir, CONFIG_PATH)))) return out;
  for (const [legacy, now] of LEGACY) {
    const from = join(brainDir, legacy);
    if (!(await exists(from))) continue;
    const kind = legacy === 'changes' ? 'changes' : 'law';
    if (!(await looksLikeOurs(from, kind))) continue; // theirs — say nothing, move nothing
    if (!(await exists(join(brainDir, now)))) {
      out.moves.push([legacy, now]);
      continue;
    }
    if (await looksLikeOurs(join(brainDir, now), kind)) {
      out.ambiguous ??=
        `${brainDir}: both ${legacy} and ${now} read as multivac's own — ` +
        `multivac uses ${now} and ignores ${legacy}; merge anything you still ` +
        `want out of ${legacy} into ${now} and delete ${legacy}, or rename ` +
        `${legacy} if it is yours to keep`;
    }
  }
  return out;
}

/**
 * The pre-.multivac layout kept the law and the changes at the repo root.
 * Reading the brain there would find zero claims and pass silently, so every
 * command refuses instead — naming the command that migrates.
 */
export async function layoutError(brainDir: string): Promise<string | null> {
  const { moves, ambiguous } = await legacyLayout(brainDir);
  if (ambiguous) return ambiguous;
  if (moves.length === 0) return null;
  const names = moves.map(([legacy]) => legacy).join(' and ');
  return (
    `${brainDir} still keeps ${names} at the root — everything multivac owns ` +
    `now lives under .multivac/ (${moves.map(([, now]) => now).join(', ')}); ` +
    'run `multivac init .` there to move it (git mv, history preserved)'
  );
}

function fail(msg: string): never {
  throw new ConfigError(`${CONFIG_PATH}: ${msg}`);
}

function stringList(v: unknown, key: string): string[] {
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) {
    fail(`"${key}" must be a list of strings — e.g. ${key}: [a, b]`);
  }
  return v as string[];
}

function optString(v: unknown, key: string): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'string') fail(`"${key}" must be a string`);
  return v;
}

function repoEntry(key: string, v: unknown): RepoEntry {
  if (typeof v === 'string') return { path: v };
  if (v === null || typeof v !== 'object' || Array.isArray(v)) {
    fail(`repos.${key} must be a path string or { path, url?, grapher?, channel? }`);
  }
  const o = v as Record<string, unknown>;
  let path: string;
  if (typeof o.path === 'string' && o.path !== '') {
    path = o.path;
  } else if (typeof o.url === 'string' && o.url !== '') {
    // url-only: declared before cloned — unevaluated, not red. Default the
    // clone destination so `repos sync` knows where to put it.
    path = `../${key}`;
  } else {
    fail(`repos.${key} needs "path" or "url" — add path: ../${key}`);
  }
  return {
    path,
    url: optString(o.url, `repos.${key}.url`),
    grapher: optString(o.grapher, `repos.${key}.grapher`),
    channel: optString(o.channel, `repos.${key}.channel`),
  };
}

/** Load config from `<brainDir>/.multivac/config.yml`, defaults applied. */
export async function loadConfig(brainDir: string): Promise<Config> {
  const stale = await layoutError(brainDir);
  if (stale) throw new ConfigError(stale);
  const file = join(brainDir, CONFIG_PATH);
  let raw: string;
  try {
    raw = await readFile(file, 'utf8');
  } catch {
    throw new ConfigError(
      `no ${CONFIG_PATH} in ${brainDir} — run \`multivac init .\` to create it`,
    );
  }
  let doc: unknown;
  try {
    doc = parse(raw);
  } catch (e) {
    fail(`invalid YAML: ${(e as Error).message} — fix the syntax`);
  }
  if (doc === null || doc === undefined) doc = {};
  if (typeof doc !== 'object' || Array.isArray(doc)) {
    fail('top level must be a mapping of keys, not a list or scalar');
  }
  const o = doc as Record<string, unknown>;

  const blockingRaw = o.blocking ?? ['absent', 'count', 'each'];
  const blocking = stringList(blockingRaw, 'blocking') as Mode[];
  for (const m of blocking) {
    if (!MODES.includes(m)) {
      fail(`"blocking" has unknown mode "${m}" — allowed: ${MODES.join(', ')}`);
    }
  }
  if (!blocking.includes('absent')) {
    fail('"blocking" must include "absent" — the tombstone always blocks; add it back');
  }

  const sddAuto = o.sdd_auto ?? true;
  if (typeof sddAuto !== 'boolean') {
    fail('"sdd_auto" must be true or false');
  }

  const staleness = o.staleness ?? 'report';
  if (staleness !== 'report' && staleness !== 'block') {
    fail('"staleness" must be "report" or "block" — block makes a stale pin exit 1');
  }

  const strictPrePush = o.strict_pre_push ?? false;
  if (typeof strictPrePush !== 'boolean') {
    fail('"strict_pre_push" must be true or false');
  }

  const reposRaw = o.repos ?? {};
  if (typeof reposRaw !== 'object' || reposRaw === null || Array.isArray(reposRaw)) {
    fail('"repos" must be a mapping of key -> path or { path, ... }');
  }
  const repos: Record<string, RepoEntry> = {};
  for (const [k, v] of Object.entries(reposRaw as Record<string, unknown>)) {
    if (k === '*') {
      fail('repos."*" is a reserved key — "*" means every repo in anchor legs; rename the repo');
    }
    const entry = repoEntry(k, v);
    // brain==code: an entry whose path IS the brain root is the brain itself.
    // Through a symlink too — otherwise the brain is a "consumer repo" that
    // gets a consumer door, a mount nag, and a second scan of its own files.
    const isBrain = samePath(resolve(brainDir, entry.path), brainDir);
    if (isBrain) entry.isBrain = true;
    if (k === 'brain' && !isBrain) {
      // A "brain" key pointing elsewhere collides with the implicit brain
      // handle: consumer-scoped verify would evaluate the brain's own
      // anchors against a consumer checkout. `brain: .` is the one meaning.
      fail(
        `repos.brain must be the brain itself (path .) — it is "${entry.path}"; rename the repo`,
      );
    }
    repos[k] = entry;
  }

  return {
    doors: stringList(o.doors, 'doors'),
    sdd: optString(o.sdd, 'sdd'),
    sddAuto,
    grapher: optString(o.grapher, 'grapher'),
    authorities: stringList(o.authorities, 'authorities'),
    blocking,
    staleness,
    strictPrePush,
    channel: optString(o.channel, 'channel'),
    mount: optString(o.mount, 'mount') ?? '.brain',
    repos,
  };
}
