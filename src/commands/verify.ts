// multivac verify — anchors + tombstones + derived numbers. Deterministic,
// offline, sub-second. Exit matrix: blocking modes (absent/count) gate
// always; present/unique gate only under --strict; moved self-heals, exit 0.

import { existsSync, readdirSync, realpathSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { loadConfig, ConfigError, CONFIG_PATH } from '../lib/config.js';
import { lastFetchAge, lsTreeGitlink, run as git } from '../lib/git.js';
import { dim, green, red, say, warn, yellow } from '../lib/out.js';
import {
  collectBrainAnchors,
  readClaimRows,
  type ParseDiagnostic,
} from '../anchor/parse.js';
import { evaluateAnchors, type RepoHandle } from '../anchor/evaluate.js';
import type {
  Anchor,
  ClaimResult,
  Command,
  CommandContext,
  Config,
  LegState,
  VerifyReport,
} from '../types.js';

const STATE_ORDER: LegState[] = ['ok', 'moved', 'broken', 'vacuous', 'unevaluated'];

const paint = (state: LegState, s: string): string =>
  state === 'ok'
    ? green(s)
    : state === 'moved'
      ? yellow(s)
      : state === 'unevaluated'
        ? dim(s)
        : red(s);

function fmtAge(ms: number): string {
  const h = Math.round(ms / 3_600_000);
  return h >= 24 ? `${Math.round(h / 24)}d` : h >= 1 ? `${h}h` : `${Math.round(ms / 60_000)}m`;
}

/** Offline pin staleness: mount gitlink in each repo vs the brain's channel ref. */
async function stalenessLines(brainDir: string, cfg: Config): Promise<string[]> {
  const lines: string[] = [];
  for (const [key, entry] of Object.entries(cfg.repos)) {
    const channel = entry.channel ?? cfg.channel;
    if (!channel) continue;
    const dir = resolve(brainDir, entry.path);
    if (!existsSync(dir)) continue;
    const pin = await lsTreeGitlink(dir, cfg.mount).catch(() => null);
    if (!pin) continue;
    let channelSha: string;
    try {
      channelSha = await git(brainDir, ['rev-parse', '--verify', channel]);
    } catch {
      continue; // channel ref unknown locally — nothing to compare offline
    }
    if (pin === channelSha) continue;
    const behind = await git(brainDir, ['rev-list', '--count', `${pin}..${channelSha}`]).catch(
      () => '?',
    );
    const age = await lastFetchAge(brainDir).catch(() => null);
    const ageStr = age === null ? 'never fetched' : `last fetch ${fmtAge(age)} ago`;
    lines.push(
      `  stale     ${key}: pin ${behind} behind ${channel} · ${ageStr} — run \`multivac repos sync\``,
    );
  }
  return lines;
}

/** Consumer scope: evaluate one declared repo's anchors (+ `*` scoped to it). */
export interface VerifyScope {
  repoKey: string;
  /** The consumer checkout on disk (the cwd verify ran from). */
  dir: string;
}

export interface EvaluateOpts {
  /** Restrict evaluation to these claim ids (change close gate). */
  claimIds?: string[];
  strict?: boolean;
  /** false = --check: report moved without rewriting. Default false. */
  write?: boolean;
  /** Set when verify runs from a consumer repo instead of the brain. */
  scope?: VerifyScope;
}

/**
 * A cwd without a config may be a consumer repo with the brain mounted in a
 * subdirectory. A mount is any direct child directory that IS a brain (has
 * .multivac/config.yml); `.brain` — the default mount name — wins outright.
 * ponytail: one level deep, single-candidate only; ambiguity resolves to null
 * and the normal "no config" error names the fix.
 */
export function findMount(dir: string): string | null {
  const isBrain = (d: string): boolean => existsSync(join(d, CONFIG_PATH));
  const preferred = join(dir, '.brain');
  if (isBrain(preferred)) return preferred;
  let entries: import('node:fs').Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  const hits = entries
    .filter((e) => e.isDirectory() && isBrain(join(dir, e.name)))
    .map((e) => join(dir, e.name));
  return hits.length === 1 ? hits[0] : null;
}

/** git@host:a/b.git, https://host/a/b.git, host/a/b -> "host/a/b". */
const normUrl = (u: string): string =>
  u
    .trim()
    .replace(/\.git\/?$/, '')
    .replace(/^[a-z+]+:\/\/(?:[^@/]+@)?/, '')
    .replace(/^(?:[^@/]+@)?([^:/]+):/, '$1/')
    .toLowerCase();

const real = (p: string): string => {
  try {
    return realpathSync(p);
  } catch {
    return p;
  }
};

/**
 * Which registry key is this consumer checkout? Match by path (the entry
 * resolves to the checkout), by origin url, or by directory basename;
 * `--repo` overrides. Anything else is a ConfigError that says what to pass.
 */
export async function resolveRepoKey(
  cfg: Config,
  mount: string,
  consumerDir: string,
  flag?: string,
): Promise<string> {
  const keys = Object.keys(cfg.repos);
  if (flag !== undefined) {
    if (cfg.repos[flag]) return flag;
    throw new ConfigError(
      `--repo "${flag}" is not declared in the brain's config — declared: ${keys.join(', ') || '(none)'}`,
    );
  }
  const origin = await git(consumerDir, ['remote', 'get-url', 'origin']).catch(() => null);
  const consumerReal = real(consumerDir);
  const matched = keys.filter((key) => {
    const e = cfg.repos[key];
    if (e.url && origin && normUrl(e.url) === normUrl(origin)) return true;
    if (real(resolve(mount, e.path)) === consumerReal) return true;
    return basename(e.path) === basename(consumerDir);
  });
  if (matched.length === 1) return matched[0];
  throw new ConfigError(
    matched.length === 0
      ? `this checkout matches no repo declared in the brain at ${mount} — run \`multivac verify --repo <key>\` (declared: ${keys.join(', ') || '(none)'})`
      : `this checkout matches several declared repos (${matched.join(', ')}) — disambiguate with \`multivac verify --repo <key>\``,
  );
}

interface Evaluated {
  cfg: Config;
  rows: { id: string; state: string }[];
  anchors: Anchor[];
  allDiags: ParseDiagnostic[];
  states: Map<string, string>;
  claims: ClaimResult[];
  report: VerifyReport;
}

/** Config load + anchor collection + evaluation + exit matrix, no printing. */
async function evaluateCore(brainDir: string, opts: EvaluateOpts): Promise<Evaluated> {
  const cfg = await loadConfig(brainDir);
  const collected = await collectBrainAnchors(brainDir);
  const diagnostics = collected.diagnostics;
  let anchors = collected.anchors;
  if (opts.scope) {
    const k = opts.scope.repoKey;
    anchors = anchors.filter((a) => a.repoKey === k || a.repoKey === '*');
  }
  if (opts.claimIds) {
    const ids = new Set(opts.claimIds);
    anchors = anchors.filter((a) => ids.has(a.claimId));
  }
  const rows = await readClaimRows(brainDir);
  const states = new Map(rows.map((r) => [r.id, r.state]));

  // Unknown repo keys are diagnostics, not silent skips.
  const knownKey = (k: string): boolean => k === '*' || k === 'brain' || k in cfg.repos;
  const semantic: ParseDiagnostic[] = anchors
    .filter((a) => !knownKey(a.repoKey))
    .map((a) => ({
      file: a.file,
      line: a.line,
      message: `unknown repo key "${a.repoKey}" — declare it under repos: in .multivac/config.yml`,
    }));
  const allDiags = [...diagnostics, ...semantic];

  // Lifecycle: retired rows evaluate only their authored tombstone legs.
  const evalAnchors = anchors.filter(
    (a) => knownKey(a.repoKey) && (states.get(a.claimId) !== 'retired' || a.mode === 'absent'),
  );

  // Scoped: only the consumer checkout is a target — `*` legs see it alone.
  const handles: RepoHandle[] = opts.scope
    ? [{ key: opts.scope.repoKey, dir: opts.scope.dir }]
    : Object.entries(cfg.repos).map(([key, e]) => {
        const p = resolve(brainDir, e.path);
        return { key, dir: existsSync(p) ? p : null };
      });
  if (!opts.scope) handles.push({ key: 'brain', dir: brainDir });

  const claims = await evaluateAnchors(evalAnchors, handles, {
    brainDir,
    write: opts.write ?? false,
  });

  // Exit matrix. Proposed rows never block, not even under --strict.
  let blockingBroken = 0;
  let anyBad = false;
  for (const c of claims) {
    if (states.get(c.claimId) === 'proposed') continue;
    for (const l of c.legs) {
      if (l.state !== 'broken' && l.state !== 'vacuous') continue;
      anyBad = true;
      if (cfg.blocking.includes(l.anchor.mode)) blockingBroken++;
    }
  }
  const exitCode: 0 | 1 =
    allDiags.length > 0 || blockingBroken > 0 || (opts.strict === true && anyBad) ? 1 : 0;

  const counts: Record<LegState, number> = {
    ok: 0,
    moved: 0,
    broken: 0,
    vacuous: 0,
    unevaluated: 0,
  };
  for (const c of claims) counts[c.state]++;

  return {
    cfg,
    rows,
    anchors,
    allDiags,
    states,
    claims,
    report: { claims, counts, blockingBroken, exitCode },
  };
}

/** Programmatic entry point (change close gate). Never rewrites globs. */
export async function evaluate(
  brainDir: string,
  opts: EvaluateOpts = {},
): Promise<VerifyReport> {
  return (await evaluateCore(brainDir, opts)).report;
}

async function runVerify(argv: string[], ctx: CommandContext): Promise<number> {
  let strict = false;
  let check = false;
  let repoFlag: string | undefined;
  let dir = '.';
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--strict') strict = true;
    else if (a === '--check') check = true;
    else if (a === '--repo') repoFlag = argv[++i];
    else if (a.startsWith('-')) {
      warn(`unknown flag "${a}" — verify takes [dir], --strict, --check, --repo <key>`);
      return 2;
    } else dir = a;
  }
  const startDir = resolve(ctx.cwd, dir);

  let ev: Evaluated;
  let brainDir = startDir;
  let scope: VerifyScope | undefined;
  try {
    // Consumer repo: no config here, but the brain is mounted in a subdir.
    if (!existsSync(join(startDir, CONFIG_PATH))) {
      const mount = findMount(startDir);
      if (mount) {
        const cfg = await loadConfig(mount);
        scope = { repoKey: await resolveRepoKey(cfg, mount, startDir, repoFlag), dir: startDir };
        brainDir = mount;
      }
    }
    // Consumer mode never rewrites moved globs: the mount is usually a pinned
    // submodule — the heal belongs in the brain checkout.
    ev = await evaluateCore(brainDir, { strict, write: !check && !scope, scope });
  } catch (e) {
    if (e instanceof ConfigError) {
      warn(e.message);
      return 2;
    }
    throw e;
  }
  const { cfg, rows, anchors, allDiags, states, claims } = ev;
  const { blockingBroken, exitCode } = ev.report;

  // Report.
  if (scope) say(`scoped to repo "${scope.repoKey}" · brain at ${brainDir}`);
  const anchored = rows.filter((r) => anchors.some((a) => a.claimId === r.id)).length;
  const pct = rows.length ? ` (${Math.round((anchored / rows.length) * 100)}%)` : '';
  say(`${rows.length} claims · ${anchored} anchored${pct}`);
  say('');
  const counts = ev.report.counts;
  for (const s of STATE_ORDER) {
    if (counts[s] > 0) say(`  ${paint(s, s.padEnd(9))} ${String(counts[s]).padStart(3)}`);
  }
  for (const d of allDiags) {
    say(`  ${red('parse')}     ${d.file}:${d.line} — ${d.message}`);
  }
  for (const c of claims) {
    for (const l of c.legs) {
      if (l.state === 'ok') continue;
      const a = l.anchor;
      const note =
        states.get(c.claimId) === 'proposed' ? ' · proposed row — informational, never blocks' : '';
      say(
        `  ${paint(l.state, l.state.padEnd(9))} ${c.claimId} [${a.mode}] ${a.file}:${a.line}` +
          `${l.detail ? ` · ${l.detail}` : ''}${note}`,
      );
    }
  }
  // Staleness compares mounts across the whole ecosystem — brain-checkout
  // concern, meaningless relative to a mounted brain's own paths.
  if (!scope) for (const line of await stalenessLines(brainDir, cfg)) say(line);
  say('');
  say(
    `${blockingBroken} blocking broken · exit ${exitCode}` +
      (allDiags.length ? ` · ${allDiags.length} anchor parse errors` : ''),
  );
  return exitCode;
}

export const verify: Command = {
  name: 'verify',
  help: 'check anchors against the declared repos (deterministic, offline)',
  run: runVerify,
};

export default verify;
