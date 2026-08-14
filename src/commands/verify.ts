// multivac verify — anchors + tombstones + derived numbers. Deterministic,
// offline, sub-second. Exit matrix: blocking modes (absent/count) gate
// always; present/unique gate only under --strict; moved self-heals, exit 0.

import { existsSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { changesDir, parseChange } from '../change/file.js';
import { loadConfig, ConfigError, CONFIG_PATH } from '../lib/config.js';
import { lastFetchAge, lsTreeGitlink, run as git } from '../lib/git.js';
import { samePath } from '../lib/paths.js';
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
  LegResult,
  LegState,
  VerifyReport,
} from '../types.js';

const STATE_ORDER: LegState[] = [
  'ok',
  'pending',
  'moved',
  'broken',
  'vacuous',
  'unevaluated',
];

const paint = (state: LegState, s: string): string =>
  state === 'ok'
    ? green(s)
    : state === 'moved'
      ? yellow(s)
      : state === 'unevaluated' || state === 'pending'
        ? dim(s)
        : red(s);

/**
 * claim id -> slug of the open change declaring it. Declare-first is the
 * lifecycle's flow, so those claims are pending, not regressions. Only
 * `.multivac/changes/<slug>.md` counts: its `archive/` is closed and confers
 * nothing. A change file that will not parse is `change`'s diagnostic to
 * raise, never a reason for verify to say anything.
 */
async function openChangeClaims(brainDir: string): Promise<Map<string, string>> {
  const dir = changesDir(brainDir);
  const out = new Map<string, string>();
  let names: string[];
  try {
    names = readdirSync(dir).filter((n) => n.endsWith('.md'));
  } catch {
    return out;
  }
  for (const name of names) {
    try {
      const { change } = parseChange(await readFile(join(dir, name), 'utf8'), name);
      if (change.status !== 'open') continue;
      for (const c of change.claims) if (!out.has(c.id)) out.set(c.id, change.slug);
    } catch {
      continue;
    }
  }
  return out;
}

function fmtAge(ms: number): string {
  const h = Math.round(ms / 3_600_000);
  return h >= 24 ? `${Math.round(h / 24)}d` : h >= 1 ? `${h}h` : `${Math.round(ms / 60_000)}m`;
}

/**
 * A printed diagnostic and whether it gates the exit. One record, so the
 * text and the count can never disagree (DOGFOOD-01 polish 8).
 */
interface Diagnostic {
  text: string;
  gates: boolean;
}

/** Offline pin staleness: mount gitlink in each repo vs the brain's channel ref. */
async function stalenessLines(brainDir: string, cfg: Config): Promise<Diagnostic[]> {
  const lines: Diagnostic[] = [];
  const gate = cfg.staleness === 'block';
  for (const [key, entry] of Object.entries(cfg.repos)) {
    if (entry.isBrain) continue; // brain==code: no mount here, nothing to pin
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
      // Channel ref unknown locally: offline stays a report, never a guess.
      // Silence would sell false confidence under staleness: block.
      if (gate) {
        lines.push({
          text:
            `  stale?    ${key}: channel ${channel} unknown locally — reported only, ` +
            'cannot gate offline; `multivac repos sync` fetches it',
          gates: false,
        });
      }
      continue;
    }
    if (pin === channelSha) continue;
    const behind = await git(brainDir, ['rev-list', '--count', `${pin}..${channelSha}`]).catch(
      () => '?',
    );
    // "Behind" is the fact that gates: the channel has commits the pin lacks.
    // A pin ahead of the channel (behind 0) is not stale at all; a count that
    // cannot be computed ('?', pin object unknown locally) reports, never
    // gates — the same never-guess rule as an unresolvable channel ref.
    if (behind === '0') continue;
    // The one predicate for this line: it gates iff the config blocks AND the
    // count is real. The text below prints "blocking" from the same boolean.
    const gates = gate && behind !== '?';
    const age = await lastFetchAge(brainDir).catch(() => null);
    const ageStr = age === null ? 'never fetched' : `last fetch ${fmtAge(age)} ago`;
    lines.push({
      text:
        `  stale     ${key}: pin ${behind} behind ${channel} · ${ageStr} — ` +
        `${gates ? 'blocking (staleness: block); ' : ''}run \`multivac repos sync\``,
      gates,
    });
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
  const matched = keys.filter((key) => {
    const e = cfg.repos[key];
    if (e.url && origin && normUrl(e.url) === normUrl(origin)) return true;
    if (samePath(resolve(mount, e.path), consumerDir)) return true;
    return basename(e.path) === basename(consumerDir);
  });
  if (matched.length === 1) return matched[0];
  throw new ConfigError(
    matched.length === 0
      ? `this checkout matches no repo declared in the brain at ${mount} — run \`multivac verify --repo <key>\` (declared: ${keys.join(', ') || '(none)'})`
      : `this checkout matches several declared repos (${matched.join(', ')}) — disambiguate with \`multivac verify --repo <key>\``,
  );
}

/**
 * THE predicate: does this leg gate the exit? The exit matrix counts it and
 * the report line prints `· blocking` from it, so a printed line can never
 * contradict its own gate (DOGFOOD-01 polish 8, the "pin 0 behind" class of
 * bug). Proposed rows are informational; `pending`, `moved` and
 * `unevaluated` are not failures; everything else gates in a blocking mode,
 * or in any mode under --strict.
 */
function legGates(
  leg: LegResult,
  rowState: string | undefined,
  cfg: Config,
  strict: boolean,
): boolean {
  if (rowState === 'proposed') return false;
  if (leg.state !== 'broken' && leg.state !== 'vacuous') return false;
  return cfg.blocking.includes(leg.anchor.mode) || strict;
}

interface Evaluated {
  cfg: Config;
  rows: { id: string; state: string }[];
  anchors: Anchor[];
  allDiags: ParseDiagnostic[];
  states: Map<string, string>;
  claims: ClaimResult[];
  /** Legs that gate this run, by identity — what the report marks blocking. */
  gating: Set<LegResult>;
  /** claim id -> open change holding it pending. Empty in a claim-scoped run. */
  pendingBy: Map<string, string>;
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

  // Unknown repo keys are diagnostics, not silent skips — the leg's own scope
  // and every repo-qualified exclusion alike: a typo in `!brain:page.md`
  // exempts nothing, and silence would read as a passing anchor.
  const knownKey = (k: string): boolean => k === '*' || k === 'brain' || k in cfg.repos;
  const semantic: ParseDiagnostic[] = [];
  const refused = new Set<Anchor>();
  for (const a of anchors) {
    const unknown = [
      ...new Set([a.repoKey, ...a.excludes.map((e) => e.repoKey)]),
    ].filter((k): k is string => k !== undefined && !knownKey(k));
    for (const k of unknown) {
      semantic.push({
        file: a.file,
        line: a.line,
        message: `unknown repo key "${k}" — declare it under repos: in .multivac/config.yml`,
      });
    }
    if (unknown.length > 0) refused.add(a);
  }
  const allDiags = [...diagnostics, ...semantic];

  // Lifecycle: retired rows evaluate only their authored tombstone legs.
  const evalAnchors = anchors.filter(
    (a) => !refused.has(a) && (states.get(a.claimId) !== 'retired' || a.mode === 'absent'),
  );

  // Scoped: only the consumer checkout is a target — `*` legs see it alone.
  const handles: RepoHandle[] = opts.scope
    ? [{ key: opts.scope.repoKey, dir: opts.scope.dir }]
    : Object.entries(cfg.repos)
        // A declared `brain: .` is the implicit handle pushed below; any
        // other brain==code key resolves to the brain dir on its own, and
        // evaluateAnchors scans one directory once for `*` legs.
        .filter(([key]) => key !== 'brain')
        .map(([key, e]) => {
          const p = resolve(brainDir, e.path);
          return { key, dir: existsSync(p) ? p : null };
        });
  if (!opts.scope) handles.push({ key: 'brain', dir: brainDir });

  // Pendency is a reporting grace, and the close gate is where it ends: a
  // claim-scoped run (change close) asks for the unmasked truth.
  const pendingBy = opts.claimIds ? new Map<string, string>() : await openChangeClaims(brainDir);
  const claims = await evaluateAnchors(evalAnchors, handles, {
    brainDir,
    write: opts.write ?? false,
    pendingBy,
  });

  // Exit matrix — one loop, one predicate. `blockingBroken` is the headline
  // number (blocking modes alone); `gating` is what this run actually gates
  // on, --strict included, and it is what the report marks.
  const gating = new Set<LegResult>();
  let blockingBroken = 0;
  for (const c of claims) {
    const rowState = states.get(c.claimId);
    for (const l of c.legs) {
      if (legGates(l, rowState, cfg, false)) blockingBroken++;
      if (legGates(l, rowState, cfg, opts.strict === true)) gating.add(l);
    }
  }
  const exitCode: 0 | 1 = allDiags.length > 0 || gating.size > 0 ? 1 : 0;

  const counts: Record<LegState, number> = {
    ok: 0,
    pending: 0,
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
    gating,
    pendingBy,
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
    } else if (repoFlag !== undefined) {
      warn(`--repo only scopes verify from a consumer repo — ${startDir} is a brain; flag ignored`);
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
  const { cfg, rows, anchors, allDiags, states, claims, gating } = ev;
  const { exitCode } = ev.report;

  // Report. Scoped runs evaluate scope-filtered anchors, so the brain-wide
  // coverage percentage would read as a collapse ("11 claims · 3 anchored
  // (27%)") when nothing is wrong: say what was counted instead.
  const anchored = rows.filter((r) => anchors.some((a) => a.claimId === r.id)).length;
  if (scope) {
    say(`scoped to repo "${scope.repoKey}" · brain at ${brainDir}`);
    say(`${anchored} of ${rows.length} brain claims anchor into "${scope.repoKey}"`);
  } else {
    const pct = rows.length ? ` (${Math.round((anchored / rows.length) * 100)}%)` : '';
    say(`${rows.length} claims · ${anchored} anchored${pct}`);
  }
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
      // The gate marker comes from the gating set, never from a second
      // reading of the state: what this line says is what the exit does.
      const note = gating.has(l)
        ? ' · blocking'
        : states.get(c.claimId) === 'proposed'
          ? ' · proposed row — informational, never blocks'
          : l.state === 'broken' || l.state === 'vacuous'
            ? ` · reported only — "${a.mode}" is not in blocking: and this run is not --strict`
            : '';
      say(
        `  ${paint(l.state, l.state.padEnd(9))} ${c.claimId} [${a.mode}] ${a.file}:${a.line}` +
          `${l.detail ? ` · ${l.detail}` : ''}${note}`,
      );
    }
  }
  // Staleness compares mounts across the whole ecosystem — brain-checkout
  // concern, meaningless relative to a mounted brain's own paths.
  let staleBlocking = 0;
  if (!scope) {
    for (const d of await stalenessLines(brainDir, cfg)) {
      say(d.text);
      if (d.gates) staleBlocking++;
    }
  }
  const finalExit: 0 | 1 = staleBlocking > 0 ? 1 : exitCode;
  // The summary counts THE predicate — the same `gating` set the per-leg lines
  // read for their `· blocking` marker — never a second tally computed with
  // different arguments. `blockingBroken` answers a different question (blocking
  // modes alone, --strict ignored) and printing it here made `--strict` runs say
  // "0 blocking broken · exit 1" under a line marked blocking.
  const blocking = gating.size + staleBlocking;
  // A pending claim is a real failure a change file is holding back: exit 0 is
  // the grace, silence is not. Name what is masked and who masks it.
  const masking = [
    ...new Set(claims.filter((c) => c.state === 'pending').map((c) => ev.pendingBy.get(c.claimId))),
  ].filter((s): s is string => s !== undefined);
  say('');
  say(
    `${blocking} blocking broken · exit ${finalExit}` +
      (allDiags.length ? ` · ${allDiags.length} anchor parse errors` : '') +
      (staleBlocking ? ` · ${staleBlocking} stale pin${staleBlocking > 1 ? 's' : ''} blocking` : ''),
  );
  if (masking.length > 0) {
    say(
      `  ${ev.report.counts.pending} claim${ev.report.counts.pending > 1 ? 's' : ''} held pending ` +
        `by open change${masking.length > 1 ? 's' : ''} ${masking.join(', ')} — not gating; ` +
        'close or delete the change to unmask them',
    );
  }
  return finalExit;
}

export const verify: Command = {
  name: 'verify',
  help: 'check anchors against the declared repos (deterministic, offline)',
  run: runVerify,
};

export default verify;
