// MV-153. The record of what multivac dropped when it stopped keeping a code
// graph, and the only module that still names the two vendors it once drove.
// It holds the four config keys an earlier release read, which the loader now
// records and ignores; the head every post-edit refresh hook multivac wrote
// began with, by which `doors` takes those hooks back; the file earlier
// releases rendered; and, as data, what graphify 0.9.29's and codegraph
// 1.6.0's own installs wrote (MV-131, MV-148, MV-149 measured them), so
// `doctor` can name what is left in a checkout with its removal, the door can
// say where a vendor's skill still sends an agent to a graph nothing
// refreshes, and the code gate can let that removal through (MV-137).
//
// Nothing here builds, refreshes or asks a graph, and nothing here writes or
// deletes a file or runs a vendor: it reads files and asks git one question.

import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { run as git } from './git.js';
import { andList } from './out.js';

/** The top-level keys an earlier release read, in the order the ignore line names them. */
export const DROPPED_KEYS = ['grapher', 'grapher_auto', 'graphers'] as const;

/** The repo-entry key an earlier release read, named as `repos.<key>.grapher`. */
export const DROPPED_REPO_KEY = 'grapher';

/**
 * The ignore line `verify` (in the brain checkout) and `doctor` print for the
 * keys a config still declares, in `Config.dropped`'s order. The config is
 * invariant (MV-97), so deleting them needs an open change, and the line says
 * so. Reported, never gating.
 */
export function droppedKeysLine(keys: readonly string[]): string {
  return `${keys.join(', ')} ignored — multivac keeps no code graph; delete ${keys.length > 1 ? 'them' : 'it'} from .multivac/config.yml with a change open (\`multivac change new <slug>\`)`;
}

/** The same fact as one clause of a quiet `verify`'s one line (MV-151). */
export function droppedKeysClause(keys: readonly string[]): string {
  return `${keys.join(', ')} ignored (delete from .multivac/config.yml)`;
}

/**
 * The head every post-edit refresh hook an earlier multivac wrote began with:
 * the lock it took (MV-52, MV-58). Identity is a command that STARTS with it;
 * a hook a human edited past it, or a vendor's own hook, is not ours (MV-74).
 */
export const OUR_REFRESH_HEAD = 'L=.multivac/cache/graph-refresh.lock;';

/**
 * How many hooks of ours a Claude Code settings text still holds: every
 * command, under any event, that starts with `OUR_REFRESH_HEAD`. 0 for a text
 * that does not parse, which `doors` leaves alone too. A read, for `doctor`.
 */
export function ourRefreshHooks(text: string): number {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return 0;
  }
  const hooks = (parsed as { hooks?: unknown } | null)?.hooks;
  if (hooks === null || typeof hooks !== 'object') return 0;
  let n = 0;
  for (const entries of Object.values(hooks as Record<string, unknown>)) {
    if (!Array.isArray(entries)) continue;
    for (const e of entries) {
      const list = (e as { hooks?: unknown } | null)?.hooks;
      if (!Array.isArray(list)) continue;
      for (const h of list) {
        const c = (h as { command?: unknown } | null)?.command;
        if (typeof c === 'string' && c.startsWith(OUR_REFRESH_HEAD)) n++;
      }
    }
  }
  return n;
}

/**
 * The file earlier releases rendered in the brain from its declarations, and
 * nothing reads: multivac wrote it, so `doors` removes it, and `doctor` names
 * one still there. Nothing renders it any more.
 */
export const ECOSYSTEM_JSON = '.multivac/ecosystem.json';

/** One harness platform a vendor's own install wrote into, as measured. */
export interface VendorPlatform {
  /** The vendor's own platform key, as its uninstall takes it. */
  key: string;
  /** The file that proves the platform was installed. */
  probe: string;
  /** Every path the platform's install wrote but the root door's section and the hook files. */
  files: string[];
  /** Its install wrote a hook that sends the agent to the graph. */
  hooks?: true;
  /** Its uninstall is printed before every other platform's: measured to stop early after another's. */
  first?: true;
}

/** What one vendor's earlier install wrote in a checkout, measured at one version. */
export interface Vendor {
  name: string;
  /** The output directory. */
  dir: string;
  /** `shared`: committed by an earlier `change land`; `local`: built per checkout, never committed. */
  kind: 'shared' | 'local';
  /** The vendor's own word for bringing its output up to date, as the leftover line says it. */
  verb: 'refreshes' | 'syncs';
  /** The ignore file it reads, named only beside `dir`: alone it is the human's (MV-149). */
  ignoreFile: string;
  /** What to do with the ignore file where the line does not remove it. */
  ignoreNote?: string;
  /** The `.gitignore` lines an earlier multivac appended for it. */
  gitignore: string[];
  /** The vendor's own uninstall for one platform, `{key}` the platform's key. */
  uninstall?: string;
  /** The suffix of the copy its install left beside a hook file it rewrote: the human's own. */
  backup?: string;
  platforms: VendorPlatform[];
  /** The files its install wrote hook commands into. */
  hookFiles: string[];
}

/**
 * What graphify 0.9.29's and codegraph 1.6.0's installs wrote, as #5 and #6
 * measured them in scratch repos with HOME isolated. Data for naming
 * leftovers and letting their removal through the code gate, never for
 * dispatch. codegraph's own `uninit` sends an event without its opt-outs set
 * (MV-149), so its removal is a plain delete of a git-ignored directory.
 */
export const LEFTOVER_VENDORS: Vendor[] = [
  {
    name: 'graphify',
    dir: 'graphify-out',
    kind: 'shared',
    verb: 'refreshes',
    ignoreFile: '.graphifyignore',
    gitignore: ['graphify-out/*', '!graphify-out/graph.json', '*.graphify-bak'],
    uninstall: 'graphify uninstall --project --platform {key}',
    backup: '.graphify-bak',
    platforms: [
      { key: 'gemini', probe: '.gemini/skills/graphify/SKILL.md', files: ['.gemini/skills/graphify/**'], hooks: true, first: true },
      { key: 'agents', probe: '.agents/skills/graphify/SKILL.md', files: ['.agents/skills/graphify/**'] },
      { key: 'claude', probe: '.claude/skills/graphify/SKILL.md', files: ['.claude/skills/graphify/**', '.claude/CLAUDE.md'], hooks: true },
      { key: 'cursor', probe: '.cursor/rules/graphify.mdc', files: ['.cursor/rules/graphify.mdc'] },
      { key: 'codex', probe: '.codex/skills/graphify/SKILL.md', files: ['.codex/skills/graphify/**'] },
      {
        key: 'opencode',
        probe: '.opencode/skills/graphify/SKILL.md',
        files: ['.opencode/skills/graphify/**', '.opencode/plugins/graphify.js', '.opencode/opencode.json'],
      },
      { key: 'copilot', probe: '.copilot/skills/graphify/SKILL.md', files: ['.copilot/skills/graphify/**'] },
    ],
    hookFiles: ['.claude/settings.json', '.codex/hooks.json', '.gemini/settings.json'],
  },
  {
    name: 'codegraph',
    dir: '.codegraph',
    kind: 'local',
    verb: 'syncs',
    ignoreFile: 'codegraph.json',
    ignoreNote: 'codegraph.json is codegraph\'s own config: delete it, or drop from its "exclude" the lines an earlier multivac added',
    gitignore: ['.codegraph/'],
    platforms: [],
    hookFiles: [],
  },
];

/**
 * Every path the vendors' installs wrote, by name: each output directory, ignore
 * file, hook file and platform file. The code gate counts them not code in
 * every repo (MV-137), so removing what an earlier release left commits on any
 * branch; the rest of a directory they sit in stays code.
 */
export function leftoverGlobs(): string[] {
  const out = new Set<string>();
  for (const v of LEFTOVER_VENDORS) {
    out.add(`${v.dir}/**`);
    out.add(v.ignoreFile);
    for (const f of v.hookFiles) out.add(f);
    for (const p of v.platforms) for (const f of [p.probe, ...p.files]) out.add(f);
  }
  return [...out];
}

/** One vendor's leftovers in one checkout. */
export interface LeftoverVendor {
  vendor: Vendor;
  /** The output directory, when it is there. */
  dir?: string;
  /** Whether git tracks anything under the output directory. */
  dirTracked: boolean;
  /** The ignore file, when it sits beside the output directory. */
  ignoreFile?: string;
  /** The platform keys whose probe is there, `first` ones first, then the table's order. */
  platforms: string[];
  /** The table's `.gitignore` lines the checkout's `.gitignore` still holds. */
  gitignore: string[];
  /** Whether git tracks any path found. */
  tracked: boolean;
}

async function here(dir: string, rel: string): Promise<boolean> {
  return access(join(dir, rel)).then(
    () => true,
    () => false,
  );
}

/**
 * The copies a vendor's install left beside a hook file it rewrote
 * (`.claude/settings.json.graphify-bak`): the human's own pre-install copy
 * (MV-148), named and kept, never removed. Repo-relative, in table order.
 */
export async function backupCopies(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const v of LEFTOVER_VENDORS) {
    if (!v.backup) continue;
    for (const f of v.hookFiles) if (await here(dir, f + v.backup)) out.push(f + v.backup);
  }
  return out;
}

/**
 * What each vendor's earlier install left in `dir`: its output directory, its
 * ignore file only beside that directory, and every platform whose probe is
 * there. A vendor with neither a directory nor a platform found yields
 * nothing, so a `codegraph.json` alone, the human's, is never named.
 * Files only, and one `git ls-files`: no vendor is run.
 */
export async function leftoverVendors(dir: string): Promise<LeftoverVendor[]> {
  const ignored = new Set(
    ((await readFile(join(dir, '.gitignore'), 'utf8').catch(() => '')) as string).split(/\r?\n/).map((l) => l.trim()),
  );
  const found: Omit<LeftoverVendor, 'dirTracked' | 'tracked'>[] = [];
  for (const v of LEFTOVER_VENDORS) {
    const out = (await here(dir, v.dir)) ? v.dir : undefined;
    const ignoreFile = out && (await here(dir, v.ignoreFile)) ? v.ignoreFile : undefined;
    const platforms: string[] = [];
    for (const p of [...v.platforms.filter((p) => p.first), ...v.platforms.filter((p) => !p.first)]) {
      if (await here(dir, p.probe)) platforms.push(p.key);
    }
    if (!out && platforms.length === 0) continue;
    found.push({
      vendor: v,
      ...(out ? { dir: out } : {}),
      ...(ignoreFile ? { ignoreFile } : {}),
      platforms,
      gitignore: v.gitignore.filter((l) => ignored.has(l)),
    });
  }
  if (found.length === 0) return [];
  const paths = found.flatMap((f) => [
    ...(f.dir ? [f.dir] : []),
    ...(f.ignoreFile ? [f.ignoreFile] : []),
    ...f.platforms.map((k) => f.vendor.platforms.find((p) => p.key === k)!.probe),
  ]);
  const listed = (await git(dir, ['ls-files', '-z', '--', ...paths]).catch(() => '')).split('\0').filter(Boolean);
  return found.map((f) => {
    const mine = [
      ...(f.dir ? [f.dir] : []),
      ...(f.ignoreFile ? [f.ignoreFile] : []),
      ...f.platforms.map((k) => f.vendor.platforms.find((p) => p.key === k)!.probe),
    ];
    const under = (p: string) => (t: string) => t === p || t.startsWith(`${p}/`);
    return {
      ...f,
      dirTracked: f.dir !== undefined && listed.some(under(f.dir)),
      tracked: mine.some((p) => listed.some(under(p))),
    };
  });
}

/** A directory as the human types it: single-quoted when it holds whitespace or a quote. */
const typed = (dir: string): string => (/[\s'"]/.test(dir) ? `'${dir.replace(/'/g, `'\\''`)}'` : dir);

/**
 * `doctor`'s `leftover` line for one vendor in one checkout: what is there,
 * why it misleads, and its removal — the vendor's own uninstall per platform
 * found, `first` ones first, then the output and ignore file out of git and
 * off the disk (a local index: the directory alone), the `.gitignore` lines
 * to drop, keeping the backup pattern while a backup copy is there. Printed,
 * never run; `at` is the checkout's directory, `baks` its backup copies.
 */
export function leftoverLine(l: LeftoverVendor, scope: string, at: string, baks: readonly string[]): string {
  const v = l.vendor;
  const plats = v.platforms.filter((p) => l.platforms.includes(p.key));
  const hooks = plats.some((p) => p.hooks);
  const found = [
    ...(l.dir ? [`${l.dir}/ (${v.kind === 'local' ? 'local' : l.dirTracked ? 'tracked' : 'untracked'})`] : []),
    ...(l.ignoreFile ? [l.ignoreFile] : []),
    ...(l.platforms.length > 0 ? [`its ${andList(l.platforms)} install${l.platforms.length > 1 ? 's' : ''}`] : []),
  ];
  const why = l.dir
    ? `nothing ${v.verb} it, so it answers for an older tree${hooks ? `, and ${v.name}'s own hooks still send agents to it` : ''}`
    : `no graph is here${hooks ? `, and ${v.name}'s own hooks still send agents to one` : ''}`;
  const gone = [...(l.dir ? [l.dir] : []), ...(v.kind === 'shared' && l.ignoreFile ? [l.ignoreFile] : [])];
  const steps = [
    ...(v.uninstall ? l.platforms.map((k) => v.uninstall!.replace('{key}', k)) : []),
    ...(gone.length === 0
      ? []
      : v.kind === 'shared'
        ? [`git rm -r -q --ignore-unmatch -- ${gone.join(' ')} && rm -rf ${gone.join(' ')}`]
        : [`rm -rf ${gone.join(' ')}`]),
  ];
  const mine = v.backup ? baks.filter((b) => b.endsWith(v.backup!)) : [];
  const keep = mine.length > 0 ? `*${v.backup}` : undefined;
  const drop = l.gitignore.filter((g) => g !== keep);
  const tail = [
    ...(drop.length > 0 ? [`drop ${drop.map((g) => `\`${g}\``).join(' ')} from .gitignore`] : []),
    ...(mine.length > 0
      ? [
          `${andList(mine.map((b) => `\`${b}\``))} ${mine.length > 1 ? 'are your own pre-install copies' : 'is your own pre-install copy'}: ` +
            `keep \`${keep}\` in .gitignore while ${mine.length > 1 ? 'they are' : 'it is'} there`,
        ]
      : []),
    ...(l.ignoreFile && v.ignoreNote ? [v.ignoreNote] : []),
    ...(v.uninstall && l.platforms.length > 0 ? ['review `git diff` — each uninstall drops the whole hook group it wrote'] : []),
  ];
  const remove = steps.length > 0 ? `cd ${typed(at)} && ${steps.join(' && ')}` : `cd ${typed(at)}`;
  return (
    `${v.name} @ ${scope}: ${found.join(', ')} — left by an earlier release; ${why}. ` +
    `Remove: ${remove}${tail.map((t) => `; ${t}`).join('')} — then commit`
  );
}

/**
 * The door's one line where a vendor's own skill (and hooks) sit beside it,
 * still sending agents to a graph nothing refreshes; null where no platform
 * of its install is there — a graph directory alone sends nobody, and
 * `doctor` names it. The caller probes (`leftoverVendors`); renderers read no
 * file (MV-93).
 */
export function leftoverDoorLine(l: LeftoverVendor): string | null {
  if (l.platforms.length === 0) return null;
  const v = l.vendor;
  const one = l.platforms.length === 1;
  const hooks = v.platforms.some((p) => p.hooks && l.platforms.includes(p.key));
  const what = `${one ? 'skill' : 'skills'}${hooks ? ' and hooks' : ''}`;
  const plural = !one || hooks;
  const to = l.dir
    ? `\`${l.dir}/\`, which multivac no longer refreshes: it answers for an older tree than the one you edit`
    : 'a graph that is not here';
  return (
    `- ${v.name}'s own ${what} here still ${plural ? 'send' : 'sends'} you to ${to}. ` +
    `Read the tree; \`multivac doctor\` prints ${plural ? 'their' : 'its'} removal.`
  );
}
