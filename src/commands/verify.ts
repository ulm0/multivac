// multivac verify — anchors + tombstones + derived numbers. Deterministic,
// offline, sub-second. Exit matrix: blocking modes (absent/count/each) gate
// always; present/unique gate only under --strict; moved self-heals, exit 0.

import { parseArgs, type ArgsDef } from 'citty';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename, join, relative, resolve } from 'node:path';
import { changesDir, parseChange } from '../change/file.js';
import { surfaceFrom, undeclared } from '../lib/args.js';
import {
  channelRef,
  loadConfig,
  ConfigError,
  CONFIG_PATH,
  DEFAULT_CHANNEL,
  LAW_PATH,
} from '../lib/config.js';
import {
  currentBranch,
  lastFetchAge,
  lsTreeGitlink,
  revParse,
  unmergedFiles,
  run as git,
} from '../lib/git.js';
import { samePath } from '../lib/paths.js';
import { dim, green, red, say, warn, yellow } from '../lib/out.js';
import {
  collectBrainAnchors,
  parseClaimRows,
  readClaimRows,
  type ParseDiagnostic,
} from '../anchor/parse.js';
import { excludeGlobs, makeMatcher } from '../lib/glob.js';
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

/** What the open change files say, read once per run. */
interface OpenChanges {
  /** claim id -> slug of the open change declaring it. */
  pendingBy: Map<string, string>;
  /** Slugs whose every declared repo is recorded `landed`. */
  landed: Set<string>;
}

/**
 * claim id -> slug of the open change declaring it. Declare-first is the
 * lifecycle's flow, so those claims are pending, not regressions. Only
 * `.multivac/changes/<slug>.md` counts: its `archive/` is closed and confers
 * nothing. A change file that will not parse is `change`'s diagnostic to
 * raise, never a reason for verify to say anything.
 *
 * The landing statuses come back from the same parse, because MV-80 needs
 * them and a second read of the same files would be a second chance to
 * disagree with this one.
 */
async function openChangeClaims(brainDir: string): Promise<OpenChanges> {
  const dir = changesDir(brainDir);
  const out: OpenChanges = { pendingBy: new Map(), landed: new Set() };
  let names: string[];
  try {
    // Sorted, because the next loop resolves a collision by first-wins: two
    // open changes declaring the same claim would otherwise be settled by
    // whatever order the filesystem handed back (MV-80, 2026-08-17).
    names = readdirSync(dir)
      .filter((n) => n.endsWith('.md'))
      .sort();
  } catch {
    return out;
  }
  for (const name of names) {
    try {
      const { change } = parseChange(await readFile(join(dir, name), 'utf8'), name);
      // Open only, and MV-89 makes that deliberate rather than incidental: a
      // `planned` change contributes neither a pending claim nor a landed repo,
      // so `finishedChanges` can never name it and a roadmap of any length
      // cannot delay a release. The comparison is the guarantee — do not
      // widen it to "not archived".
      if (change.status !== 'open') continue;
      for (const c of change.claims) {
        if (!out.pendingBy.has(c.id)) out.pendingBy.set(c.id, change.slug);
      }
      const repos = Object.values(change.repos);
      if (repos.length > 0 && repos.every((r) => r.status === 'landed')) {
        out.landed.add(change.slug);
      }
    } catch {
      continue;
    }
  }
  return out;
}

/**
 * Open changes that are **finished, not pending**: every declared claim
 * resolves, and every declared repo is recorded landed. MV-17's pendency is a
 * grace for work not yet written; a change in this state is not waiting for
 * anything, so every claim it still holds is a claim the gate is not
 * enforcing — and it stays that way until somebody runs `close`.
 *
 * Three conditions, and each earns its place (MV-80):
 *
 * - **at least one claim.** A universal over the empty set is true, so a
 *   change scaffolded a minute ago would read as finished by vacuity. That is
 *   excluded by construction rather than by a guard: `pendingBy` only ever
 *   holds claims, so a change declaring none never reaches this map. Two
 *   changes declaring the same claim inherit the same rule — the grace
 *   attributes it to the FIRST change file in filename order, and the second
 *   is judged on what is left, so a genuinely finished second change can be
 *   invisible here. Inherited from MV-17's pendency map and unchanged; this
 *   gate makes it load-bearing, so the order is at least sorted rather than
 *   whatever `readdirSync` returned (MV-80, 2026-08-17).
 * - **every declared claim `ok`.** The grace rewrites every non-`ok` leg of a
 *   declared claim into `pending`, so `ok` is the only other state reachable
 *   and this is one comparison. A claim nothing anchors produces no result at
 *   all, and no result is not a resolution (Principle II).
 * - **every declared repo landed.** The only thing this gate prints is
 *   `change close <slug>`, and close refuses a change with a repo outstanding.
 *   Without this, the gate would fire on the author's own branch the moment
 *   their tests went green — telling them to run a command that would refuse.
 */
function finishedChanges(claims: ClaimResult[], open: OpenChanges): string[] {
  const declared = new Map<string, string[]>();
  for (const [id, slug] of open.pendingBy) {
    declared.set(slug, [...(declared.get(slug) ?? []), id]);
  }
  const resolved = new Set(claims.filter((c) => c.state === 'ok').map((c) => c.claimId));
  return [...declared]
    .filter(([slug, ids]) => open.landed.has(slug) && ids.every((id) => resolved.has(id)))
    .map(([slug]) => slug);
}

/** "2h", "3d", "45m" — how old a ref is, in the words every surface uses. */
export function fmtAge(ms: number): string {
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
export async function stalenessLines(brainDir: string, cfg: Config): Promise<Diagnostic[]> {
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
    // The command has to MOVE THE PIN. `repos sync` fetches — it never
    // touches a gitlink, so following it left the line saying the same thing
    // forever. `submodule update --remote` is the one that advances it, and
    // it is what `doctor` already prints for the same fact.
    lines.push({
      text:
        `  stale     ${key}: pin ${behind} behind ${channel} · ${ageStr} — ` +
        `${gates ? 'blocking (staleness: block); ' : ''}` +
        `git -C ${entry.path} submodule update --remote ${cfg.mount}`,
      gates,
    });
  }
  return lines;
}

/**
 * MV-81's ungateable half, written once and printed by `doctor` too. Two
 * hand-written copies of a declaration is the paraphrase that ages silently —
 * the reason Principle I exists — and this repo has already paid for the same
 * shape once, when MV-79's path arithmetic lived in two files and the two
 * disagreed. It lives here because it is verify's own statement about what
 * verify cannot check; `doctor`, whose job is what is armed, reports it.
 */
export const ENACTMENT_UNGATEABLE =
  'who enacts is not a fact on disk — multivac never fabricates git identity (MV-04), so an ' +
  'agent commits as the person, and a git hook runs with the caller\'s permissions, so a gate ' +
  'installed here is one the same process can skip. UNGATEABLE by design (MV-81), not an ' +
  'oversight; enforcement is the forge\'s merge button, held by an account the agent does not ' +
  'have. verify checks the other half — enactment lands in its own commit — from the index, ' +
  'so only while a commit is being composed.';

/**
 * MV-81's checkable half: not who enacts, but when.
 *
 * A row that goes `proposed → active` in the same commit that writes the code
 * it anchors is a rule nobody reviewed on its own — the claim and its evidence
 * arrive together under one hand. That is decidable, but not from what verify
 * normally reads: `git ls-files` shows a state, never a state *change*. The
 * only offline comparison that answers it without inventing a reference is
 * HEAD against the index, and the index is populated exactly while a commit is
 * being composed — the pre-commit run.
 *
 * So this can answer inside a commit and nowhere else, and it says which of
 * the two it is on every run. Staying quiet outside a commit would let a green
 * line imply a check that never happened, which is the lie the tool exists to
 * prevent.
 *
 * Cost: one `git diff --cached` in the ordinary case — a commit that does not
 * touch the law stops at step 2 — and three more only when the law is staged.
 */
/**
 * MV-97. The declared config decides which repos exist, which adapters bind and
 * which gates run — every one of those as load-bearing as a law row, and all of
 * them editable in a commit with no explanation and nobody noticing. A repo
 * dropped from `repos:` stops being verified; an adapter removed stops obliging
 * anything.
 *
 * So a MODIFIED config needs an open change. A CREATED one is free, and that is
 * the whole exemption story: exactly one code path writes this file — `init`,
 * and only when it is absent — so the rule reads what the commit DOES rather
 * than who claims to have done it, and there is nothing to forge.
 *
 * The weak reading, deliberately: ANY open change satisfies it. The strong one
 * — a change that NAMES the config — would need a field the change file does
 * not have, and adding one to make this check stronger would be a schema change
 * in service of a check rather than of the work. What this buys is that the
 * edit lands on a branch with a merge request describing it, which is where a
 * human reads it.
 *
 * The index, never the working tree: it is what is about to be committed. A
 * working-tree read would refuse a commit for an edit deliberately left
 * unstaged, and miss a staged edit since reverted from the file.
 */
/**
 * The paths this commit is composed of, or null when the index cannot be read.
 * One reader, because MV-81 and MV-97 ask the same question of it and two
 * copies is how two answers appear.
 */
async function stagedPaths(brainDir: string): Promise<string[] | null> {
  // MV-106: the ambient index, when this IS the repo the hook runs for. The
  // index on disk answers about a different commit under `git commit -a` and
  // under a pathspec commit, which is how both gates were walked past.
  return git(brainDir, ['diff', '--cached', '--name-only', '-z'], true)
    .then((t) => t.split('\0').filter(Boolean))
    .catch(() => null);
}

function openChangeSlugs(brainDir: string): string[] {
  const dir = changesDir(brainDir);
  try {
    return readdirSync(dir)
      .filter((n) => n.endsWith('.md'))
      .sort()
      .flatMap((n) => {
        try {
          const { change } = parseChange(readFileSync(join(dir, n), 'utf8'), n);
          return change.status === 'open' ? [change.slug] : [];
        } catch {
          return []; // a broken change file is `change`'s diagnostic to raise
        }
      });
  } catch {
    return [];
  }
}

async function configLine(brainDir: string): Promise<Diagnostic | null> {
  const staged = await stagedPaths(brainDir);
  if (staged === null) {
    return { text: `  ${dim('config')}    not answered — the index could not be read here`, gates: false };
  }
  if (!staged.includes(CONFIG_PATH)) return null; // untouched: this check is silent
  const head = await revParse(brainDir, 'HEAD');
  // No previous commit, or no previous config: a brain has to start somewhere.
  const before =
    head === null
      ? ''
      : await git(brainDir, ['cat-file', 'blob', `${head}:${CONFIG_PATH}`]).catch(() => '');
  if (before === '') {
    return {
      text: `  ${dim('config')}    ${CONFIG_PATH} is new here — creating one is free; a brain has to start somewhere`,
      gates: false,
    };
  }
  // ANY open change, read from the directory rather than from the pendency map:
  // that map only holds changes DECLARING a claim, and a change opened to make
  // this very edit has none yet — which is the common case and would have made
  // the rule unusable.
  const openSlugs = openChangeSlugs(brainDir);
  if (openSlugs.length > 0) {
    return {
      text: `  ${dim('config')}    ${CONFIG_PATH} is modified, declared by open change ${openSlugs.join(', ')}`,
      gates: false,
    };
  }
  return {
    text:
      `  ${paint('broken', 'config'.padEnd(9))} ${CONFIG_PATH} is modified and no change is open — ` +
      'it decides which repos are verified and which gates run\n' +
      '            open one first (`multivac change new "<title>"`), or drop the edit',
    gates: true,
  };
}

/**
 * MV-107. What the index does to rows that were `active`, as a diagnostic or
 * null when it does nothing.
 *
 * Retirement is the sanctioned way for a row to stop applying (MV-40's
 * procedure) and stays allowed; so does dropping a `proposed` row, which is a
 * reservation given back and exactly what `change close --abandon` does. What
 * is refused is a row that was law and is simply gone — and the whole file
 * leaving the commit, which is that offence for every row at once.
 */
function lawDeath(
  before: string,
  now: string,
  was: Map<string, string>,
): Diagnostic | null {
  if (before === '') return null; // nothing to have lost
  if (now === '') {
    return {
      text:
        `  ${red('law')}       REFUSED ${LAW_PATH} is removed by this commit · blocking — a brain ` +
        `with no law verifies nothing and says so in green. Restore it: git restore --staged ` +
        `--worktree -- ${LAW_PATH}`,
      gates: true,
    };
  }
  const here = new Set(parseClaimRows(now).map((r) => r.id));
  const gone = [...was].filter(([id, state]) => state === 'active' && !here.has(id)).map(([id]) => id);
  if (gone.length === 0) return null;
  return {
    text:
      `  ${red('law')}       REFUSED ${gone.join(', ')} ${gone.length > 1 ? 'were' : 'was'} active and ` +
      `${gone.length > 1 ? 'are' : 'is'} gone · blocking — a row stops applying by being RETIRED, in ` +
      `the open, not by being deleted: set its state to retired and leave the row where a reader can ` +
      `find it`,
    gates: true,
  };
}

/**
 * The two verdicts one index-vs-HEAD read of the law answers: what reached
 * `active` (MV-81) and what stopped existing (MV-107). Returned together
 * because they come from the same two blobs, and reading them twice is how two
 * answers appear.
 */
interface LawVerdicts {
  enact: Diagnostic;
  death: Diagnostic | null;
}

async function enactmentLine(
  brainDir: string,
  cfg: Config,
  anchors: Anchor[],
): Promise<LawVerdicts> {
  const unanswered = (why: string): LawVerdicts => ({
    enact: {
      text: `  ${dim('enact')}     not answered — ${why}; MV-81's check reads the index against HEAD`,
      gates: false,
    },
    death: null,
  });
  const staged = await stagedPaths(brainDir);
  if (staged === null) return unanswered('the index could not be read here');
  if (staged.length === 0) {
    return unanswered('nothing staged, so no commit is being composed');
  }
  const plural = `${staged.length} staged path${staged.length > 1 ? 's' : ''}`;
  const nothing = (why: string): LawVerdicts => ({
    enact: { text: `  ${dim('enact')}     no row enacted in this commit — ${why}`, gates: false },
    death: null,
  });
  if (!staged.includes(LAW_PATH)) return nothing(`${plural}, ${LAW_PATH} untouched`);
  const head = await revParse(brainDir, 'HEAD');
  if (head === null) return unanswered('no commit here yet, so there is no previous state');
  // `rev` empty means `:<path>` — the INDEX version, so it asks the commit
  // (MV-106). A named rev is history and never does.
  const blob = (rev: string): Promise<string> =>
    git(brainDir, ['cat-file', 'blob', `${rev}:${LAW_PATH}`], rev === '').catch(() => '');
  const [before, now] = await Promise.all([blob(head), blob('')]);
  const was = new Map(parseClaimRows(before).map((r) => [r.id, r.state]));
  // MV-107, from the blobs already in hand. Birth is gated and the config's
  // death is gated; the law's own death was the one edit nothing looked at, so
  // `git rm .multivac/invariants.md` printed `0 claims` and exited 0.
  const death = lawDeath(before, now, was);
  // A row absent from HEAD counts as not-previously-active: a row born
  // `active` skipped the same review, which is the stronger offence and not a
  // way around this check.
  const enacted = parseClaimRows(now)
    .filter((r) => r.state === 'active' && was.get(r.id) !== 'active')
    .map((r) => r.id);
  if (enacted.length === 0) {
    return { enact: nothing(`${plural}, no row reached active`).enact, death };
  }
  // Which anchors name THIS checkout: `brain`, `*`, and any config key that
  // resolves to the brain (MV-12's alias rule). A leg pointing at a sibling
  // repo cannot be offended here — those files are not in this commit.
  const brainKeys = new Set(['brain', '*']);
  for (const [key, e] of Object.entries(cfg.repos)) if (e.isBrain) brainKeys.add(key);
  // The law file carries the state change by definition. Counting it would
  // make enactment impossible rather than separate.
  const code = staged.filter((p) => p !== LAW_PATH);
  const offences: string[] = [];
  const unstage = new Set<string>();
  for (const id of enacted) {
    const hits = new Set<string>();
    for (const a of anchors) {
      if (a.claimId !== id || !brainKeys.has(a.repoKey)) continue;
      const m = makeMatcher(a.include, excludeGlobs(a.excludes, brainKeys));
      for (const p of code) if (m(p)) hits.add(p);
    }
    if (hits.size === 0) continue;
    const list = [...hits].sort();
    for (const p of list) unstage.add(p);
    offences.push(
      `${id} beside ${list.slice(0, 3).join(', ')}${list.length > 3 ? ` +${list.length - 3} more` : ''}`,
    );
  }
  if (offences.length === 0) {
    return {
      enact: {
        text:
          `  ${green('enact')}     ${enacted.join(', ')} → active, alone in this commit — ` +
          'the row is reviewable on its own',
        gates: false,
      },
      death,
    };
  }
  return {
    enact: {
      text:
        `  ${red('enact')}     REFUSED ${offences.join('; ')} · blocking — enactment lands in ` +
        `its own commit, never beside the code it anchors (MV-81): git restore --staged ` +
        `${[...unstage].sort().join(' ')}, commit ${LAW_PATH} alone, then the code`,
      gates: true,
    },
    death,
  };
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
  /** Brain-scoped only: read every sibling's working tree, the pre-MV-53 way. */
  worktree?: boolean;
  /**
   * Read the brain's OWN repo at its channel ref instead of its working tree.
   * MV-53 makes the brain the deliberate exception — a verify run gates the
   * commit in that tree — but `land` asks the other question, "is this
   * published?", and only published bytes answer it (MV-80). `land` is the
   * only caller; no CLI flag exposes it.
   */
  atChannel?: boolean;
}

/** Which bytes one repo contributed to this run, and how to say it out loud. */
export interface RepoSource {
  key: string;
  dir: string | null;
  /** The ref read, or undefined when the working tree was read. */
  ref?: string;
  /** Report line, minus the label: "api: origin/main @ 1a2b3c4 — …". */
  line: string;
}

const short = (sha: string): string => sha.slice(0, 7);

/** Where a checkout is parked: "on main @ 1a2b3c4", detached, or empty. */
async function worktreeAt(dir: string): Promise<{ text: string; head: string | null }> {
  const [branch, head] = await Promise.all([currentBranch(dir), revParse(dir, 'HEAD')]);
  const where = branch ? `on ${branch}` : head ? 'detached' : 'no commits';
  return { text: `${where}${head ? ` @ ${short(head)}` : ''}`, head };
}

/**
 * A brain==code tree behind its own channel, said out loud. The brain is read
 * as a working tree on purpose — it is the commit the run gates — but that
 * makes an out-of-date brain checkout indistinguishable from a red ecosystem:
 * an old law table judges a current sibling, and the operator, seeing a claim
 * whose fix is already on the brain's main, concludes the gate is broken. The
 * same "OFF channel" sentence siblings already get, for the one repo MV-53
 * exempted from the channel read.
 */
async function brainDrift(dir: string, channel: string, head: string | null): Promise<string> {
  const sha = await revParse(dir, channel);
  if (sha === null || sha === head) return '';
  // BEHIND, not merely different. A feature branch is off its channel by
  // construction and that is the normal state of a working brain — saying so
  // every run is noise, and noise is how a real line stops being read. Only
  // commits the channel has and this tree lacks can make the law out of date.
  const behind = await git(dir, ['rev-list', '--count', `HEAD..${sha}`]).catch(() => '0');
  if (behind === '0') return '';
  return (
    `; ${behind} behind its own channel ${channel} @ ${short(sha)}` +
    ' — an out-of-date law judges a current ecosystem'
  );
}

/**
 * The brain read at its own channel, or null when that is not what this run
 * asked for. MV-53 reads the brain as a working tree on purpose; `land` needs
 * the published bytes instead, because a squashing forge leaves no commit
 * containment to test and content is what survives it (MV-80). A channel that
 * does not resolve returns null and the caller keeps the working-tree read it
 * already had — the same never-guess rule every other read follows.
 *
 * Only `ref` does work here. `line` is the interface's required field and
 * nothing prints it: `land` is the only caller that sets `atChannel`, and it
 * goes through `evaluate()`, which returns the report alone. So it stays the
 * bare sentence — 2026-08-17 removed an unreachable elaboration, the second
 * `lastFetchAge` subprocess it needed (the age `land` prints comes from
 * `land`'s own read), and the working tree's mid-merge suffix, which never
 * belonged on a ref read: a ref has no unmerged paths.
 */
async function brainAtChannel(
  key: string,
  dir: string,
  channel: string,
  atChannel: boolean,
): Promise<RepoSource | null> {
  if (!atChannel) return null;
  const sha = await revParse(dir, channel);
  if (sha === null) return null;
  return { key, dir, ref: channel, line: `${key}: ${channel} @ ${short(sha)} — the channel, as published` };
}

/**
 * THE decision this change exists for: which bytes each declared repo is
 * judged on, and the sentence that says so.
 *
 * The brain's law is about the ecosystem **as published**, so a sibling repo
 * is read at its channel ref — a teammate parked on a WIP branch is mid-task,
 * not a violation, and turning that into a red taught an agent to commit with
 * `--no-verify`. The brain's own repo is the exception: that is where the
 * author is working, and its law must gate its own commit. A channel ref that
 * cannot be resolved falls back to the working tree and SAYS SO — never a
 * silent change of meaning.
 */
async function resolveSources(
  brainDir: string,
  cfg: Config,
  worktreeMode: boolean,
  atChannel = false,
): Promise<RepoSource[]> {
  const out: RepoSource[] = [];
  for (const [key, e] of Object.entries(cfg.repos)) {
    if (key === 'brain') continue; // the implicit brain handle, added below
    const dir = resolve(brainDir, e.path);
    if (!existsSync(dir)) {
      out.push({ key, dir: null, line: `${key}: not on disk — nothing read; run \`multivac repos sync\`` });
      continue;
    }
    const wt = await worktreeAt(dir);
    // A tree mid-merge is not a tree anyone will commit: some files are one
    // side, some the other. Say it on the read line, because every verdict
    // below it is about that half-state — and because the miscount this used
    // to cause arrived dressed as a content problem, advising a ratchet.
    const unmerged = await unmergedFiles(dir);
    const conflicted =
      unmerged.length === 0
        ? ''
        : ` · ${unmerged.length} path(s) MID-MERGE (${unmerged.slice(0, 2).join(', ')}${unmerged.length > 2 ? ', …' : ''}) — resolve the merge before trusting any verdict here`;
    if (e.isBrain) {
      out.push(
        (await brainAtChannel(key, dir, channelRef(cfg, e), atChannel)) ?? {
          key,
          dir,
          line:
            `${key}: working tree ${wt.text} — brain==code, the commit this run gates` +
            (await brainDrift(dir, channelRef(cfg, e), wt.head)) +
            conflicted,
        },
      );
      continue;
    }
    const channel = channelRef(cfg, e);
    const sha = await revParse(dir, channel);
    // Off channel is a fact about the checkout, and it is printed either way:
    // the sibling defect this change also fixes is that a repo parked
    // somewhere else was invisible here, so its verdict read as mysterious.
    const off = sha !== wt.head;
    if (worktreeMode || sha === null) {
      const why =
        sha === null
          ? `channel ${channel} does not resolve here (no remote, or never fetched) — FELL BACK to the working tree`
          : '--worktree: local state, not the channel';
      const drift = sha !== null && off ? `; OFF channel ${channel} @ ${short(sha)}` : '';
      out.push({ key, dir, line: `${key}: working tree ${wt.text} — ${why}${drift}${conflicted}` });
      continue;
    }
    // "As published" is only as true as the last fetch: a remote-tracking ref
    // is a local snapshot, and verify never touches the network. Naming its age
    // here is the difference between a red an operator can act on and one that
    // reads as the tool lying about a fix that is already on main.
    const age = await lastFetchAge(dir).catch(() => null);
    out.push({
      key,
      dir,
      ref: channel,
      line:
        `${key}: ${channel} @ ${short(sha)} — the channel, as published ` +
        `${age === null ? '(never fetched here)' : `(last fetch ${fmtAge(age)} ago)`}` +
        (off ? ` (this checkout is parked ${wt.text}, not read)` : '') +
        conflicted,
    });
  }
  const bw = await worktreeAt(brainDir);
  const bu = await unmergedFiles(brainDir);
  const bConflicted =
    bu.length === 0
      ? ''
      : ` · ${bu.length} path(s) MID-MERGE (${bu.slice(0, 2).join(', ')}${bu.length > 2 ? ', …' : ''}) — resolve the merge before trusting any verdict here`;
  const bChannel = cfg.channel ?? DEFAULT_CHANNEL;
  out.push(
    (await brainAtChannel('brain', brainDir, bChannel, atChannel)) ?? {
      key: 'brain',
      dir: brainDir,
      line:
        `brain: working tree ${bw.text} — the brain's own repo, the commit this run gates` +
        (await brainDrift(brainDir, bChannel, bw.head)) +
        bConflicted,
    },
  );
  return out;
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

/**
 * A consumer whose mount is stale or empty: a mount-shaped subdirectory is
 * present but is not a brain (no `.multivac/config.yml`). The submodule pin
 * predates the brain's migration, or points at the wrong commit — so the mount
 * has no `.multivac/` for `findMount` to recognise. "run init" is wrong and
 * dangerous here: it would scaffold a SECOND brain beside the mount. Returns
 * the mount dir so verify can name the pin as the fix instead.
 * ponytail: recognised by name only — the default `.brain` and the common
 * `.knowledge`; the brain's real mount name lives in a config we cannot read
 * without the brain, so a mount under any other name falls through to the init
 * hint. Rename it, or `git submodule update` it into a real brain.
 */
export function findStaleMount(dir: string): string | null {
  for (const name of ['.brain', '.knowledge']) {
    const p = join(dir, name);
    try {
      if (statSync(p).isDirectory() && !existsSync(join(p, CONFIG_PATH))) return p;
    } catch {
      // not present — try the next candidate
    }
  }
  return null;
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
 * bug). Proposed rows are informational; a `drift` row is a recorded real
 * finding — reported, named in the summary, never gating, so writing down a
 * true-but-not-yet-fixable red cannot make the repo un-committable
 * (measurement 2, finding 12); `pending`, `moved` and `unevaluated` are not
 * failures; everything else gates in a blocking mode, or in any mode under
 * --strict.
 */
function legGates(
  leg: LegResult,
  rowState: string | undefined,
  cfg: Config,
  strict: boolean,
): boolean {
  if (rowState === 'proposed' || rowState === 'drift') return false;
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
  /** Open changes that are finished, not pending (MV-80). Empty in a partial run. */
  finished: string[];
  /** What each repo contributed, ref or branch and sha. The report prints it. */
  sources: RepoSource[];
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

  // What this run reads, per repo. Consumer-scoped: the consumer checkout's
  // working tree alone — that is the content about to be committed there, and
  // `*` legs see it alone. Brain-scoped: each sibling at its channel ref, the
  // brain itself at its working tree (resolveSources decides and says so).
  const sources: RepoSource[] = opts.scope
    ? [
        {
          key: opts.scope.repoKey,
          dir: opts.scope.dir,
          line:
            `${opts.scope.repoKey}: working tree ${(await worktreeAt(opts.scope.dir)).text} — ` +
            'this checkout, the content about to be committed here',
        },
      ]
    : await resolveSources(brainDir, cfg, opts.worktree === true, opts.atChannel === true);
  const handles: RepoHandle[] = sources.map((s) => ({ key: s.key, dir: s.dir, ref: s.ref }));

  // Pendency is a reporting grace, and the close gate is where it ends: a
  // claim-scoped run (change close) asks for the unmasked truth.
  const open = opts.claimIds
    ? { pendingBy: new Map<string, string>(), landed: new Set<string>() }
    : await openChangeClaims(brainDir);
  const pendingBy = open.pendingBy;
  const claims = await evaluateAnchors(evalAnchors, handles, {
    brainDir,
    write: opts.write ?? false,
    pendingBy,
  });

  // MV-80. Only a whole-brain run may reach this verdict: a consumer-scoped
  // run evaluated a subset of the legs, so "every declared claim resolves"
  // there would be a statement about bytes it never read — the invented pass
  // this tool exists to catch (Principle II). A claim-scoped run has no grace
  // to withdraw: `open` is empty above.
  const finished = opts.scope ? [] : finishedChanges(claims, open);

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
  const exitCode: 0 | 1 =
    allDiags.length > 0 || gating.size > 0 || (opts.strict === true && finished.length > 0)
      ? 1
      : 0;

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
    finished,
    sources,
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

/** What verify takes. One declaration: citty parses it, `undeclared` refuses against it. */
const ARGS = {
  dir: { type: 'positional', required: false, description: 'the brain; defaults to the working directory' },
  strict: { type: 'boolean', description: 'broken present/unique legs also exit 1' },
  check: { type: 'boolean', description: 'never writes: a moved leg is reported, not self-healed' },
  worktree: { type: 'boolean', description: "read every declared repo's working tree" },
  repo: { type: 'string', description: 'scope to one declared repo' },
} satisfies ArgsDef;

/** The surface as verify has always worded it; the check comes from ARGS. */
const TAKES = '[dir], --strict, --check, --worktree, --repo <key>';

async function runVerify(argv: string[], ctx: CommandContext): Promise<number> {
  const bad = undeclared('verify', argv, surfaceFrom(ARGS), TAKES);
  if (bad) {
    // The sentence verify shipped, minus the `verify: ` prefix `undeclared`
    // adds — documented output, kept byte for byte.
    warn(bad.replace(/^verify: /, ''));
    return 2;
  }
  const a = parseArgs(argv, ARGS);
  const strict = a.strict === true;
  const check = a.check === true;
  const worktree = a.worktree === true;
  const repoFlag = typeof a.repo === 'string' ? a.repo : undefined;
  const startDir = resolve(ctx.cwd, a.dir ?? '.');

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
      } else {
        // A mount directory that is not a brain is a stale/empty pin, never a
        // repo that needs `init`: advising init here would scaffold a second
        // brain beside the mount. Name the pin as the fix instead. Only when
        // no mount is in reach at all does the init hint below stand.
        const stale = findStaleMount(startDir);
        if (stale) {
          const rel = relative(startDir, stale) || stale;
          throw new ConfigError(
            `${rel} is mounted but is not a multivac brain — its pin predates the brain, ` +
              `or points at the wrong commit. Update the submodule ` +
              `(git submodule update --remote ${rel}) or fix the pin.`,
          );
        }
      }
    } else if (repoFlag !== undefined) {
      warn(`--repo only scopes verify from a consumer repo — ${startDir} is a brain; flag ignored`);
    }
    if (scope && worktree) {
      // Nothing to force: a consumer run is already the working tree.
      warn('--worktree only applies to a brain-scoped run — this checkout is already what is read');
    }
    // Consumer mode never rewrites moved globs: the mount is usually a pinned
    // submodule — the heal belongs in the brain checkout.
    ev = await evaluateCore(brainDir, { strict, write: !check && !scope, scope, worktree });
  } catch (e) {
    if (e instanceof ConfigError) {
      warn(e.message);
      return 2;
    }
    throw e;
  }
  const { cfg, rows, anchors, allDiags, states, claims, gating } = ev;
  const { exitCode } = ev.report;

  // Parse diagnostics print ABOVE the summary: a percentage that already
  // reflects them must not read as the headline over its own cause
  // (measurement 2, polish 13).
  for (const d of allDiags) {
    say(`  ${red('parse')}     ${d.file}:${d.line} — ${d.message}`);
  }
  if (allDiags.length > 0) say('');

  // Report. Scoped runs evaluate scope-filtered anchors, so the brain-wide
  // coverage percentage would read as a collapse ("11 claims · 3 anchored
  // (27%)") when nothing is wrong: say what was counted instead.
  const unanchored = rows.filter((r) => !anchors.some((a) => a.claimId === r.id));
  const anchored = rows.length - unanchored.length;
  if (scope) {
    say(`scoped to repo "${scope.repoKey}" · brain at ${brainDir}`);
    say(`${anchored} of ${rows.length} brain claims anchor into "${scope.repoKey}"`);
  } else {
    const pct = rows.length ? ` (${Math.round((anchored / rows.length) * 100)}%)` : '';
    say(`${rows.length} claims · ${anchored} anchored${pct}`);
    // The rows behind the percentage, not just the percentage: an unanchored
    // claim is exactly the row a reader must judge by hand.
    if (unanchored.length > 0) {
      say(`  unanchored: ${unanchored.map((r) => r.id).join(', ')}`);
    }
  }
  // What produced these verdicts. Printed on every run, brain or consumer:
  // an operator must never have to wonder which bytes a red came from — that
  // silence is what made a working-tree read look like a lying tool.
  for (const s of ev.sources) say(`  ${dim('read')}      ${s.line}`);
  say('');
  const counts = ev.report.counts;
  for (const s of STATE_ORDER) {
    if (counts[s] > 0) say(`  ${paint(s, s.padEnd(9))} ${String(counts[s]).padStart(3)}`);
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
          : states.get(c.claimId) === 'drift'
            ? ' · drift row — recorded finding, never blocks'
            : l.state === 'broken' || l.state === 'vacuous'
              ? ` · reported only — "${a.mode}" is not in blocking: and this run is not --strict`
              : '';
      say(
        `  ${paint(l.state, l.state.padEnd(9))} ${c.claimId} [${a.mode}] ${a.file}:${a.line}` +
          `${l.detail ? ` · ${l.detail}` : ''}${note}`,
      );
    }
  }
  // MV-80. Pendency is a grace for work not yet written; a change whose every
  // declared claim resolves, with every declared repo landed, is not waiting
  // for anything. Under --strict that stops the run, because the alternative
  // is this line scrolling past on every commit — which is exactly what
  // happened for weeks while fourteen claims sat unenforced. Closing stays the
  // operator's: the archive commit goes on a branch that belongs to them.
  const finishedBlocking = strict ? ev.finished.length : 0;
  for (const slug of ev.finished) {
    const held = [...ev.pendingBy.values()].filter((s) => s === slug).length;
    say(
      `  ${paint(strict ? 'broken' : 'pending', 'finished'.padEnd(9))} ${slug} — ` +
        `every declared claim resolves and every declared repo is landed ` +
        `(${held} claim${held > 1 ? 's' : ''} whose failure this run would not gate); ` +
        `finished, not pending — close it: multivac change close ${slug}` +
        (strict ? ' · blocking' : ' · reported only — this run is not --strict'),
    );
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
  // MV-81, on every run: which of the three things happened. A consumer
  // checkout has no law in its index, so there is no question to answer there
  // — said out loud rather than skipped, for the same reason as above.
  const { enact, death: lawGone } = scope
    ? {
        enact: {
          text: `  ${dim('enact')}     not answered — ${LAW_PATH} is not in this checkout's index; MV-81 is decided in the brain`,
          gates: false,
        },
        death: null,
      }
    : await enactmentLine(brainDir, cfg, anchors);
  say(enact.text);
  // MV-97, beside the enactment check because it is the same shape: an index
  // read deciding whether this commit may proceed. Silent unless it applies.
  const conf = scope ? null : await configLine(brainDir);
  if (conf) say(conf.text);
  // MV-107, answered by the same index-vs-HEAD read the enactment check just
  // made, so the law is compared once and reported twice rather than read twice.
  if (lawGone) say(lawGone.text);
  const finalExit: 0 | 1 =
    staleBlocking > 0 || enact.gates || conf?.gates === true || lawGone?.gates === true
      ? 1
      : exitCode;
  // The summary counts THE predicate — the same `gating` set the per-leg lines
  // read for their `· blocking` marker — never a second tally computed with
  // different arguments. `blockingBroken` answers a different question (blocking
  // modes alone, --strict ignored) and printing it here made `--strict` runs say
  // "0 blocking broken · exit 1" under a line marked blocking.
  const blocking = gating.size + staleBlocking + finishedBlocking + (enact.gates ? 1 : 0) + (conf?.gates ? 1 : 0) + (lawGone?.gates ? 1 : 0);
  // A pending claim is a real failure a change file is holding back: exit 0 is
  // the grace, silence is not. Name what is masked and who masks it.
  const masking = [
    ...new Set(claims.filter((c) => c.state === 'pending').map((c) => ev.pendingBy.get(c.claimId))),
  ].filter((s): s is string => s !== undefined);
  say('');
  say(
    `${blocking} blocking broken · exit ${finalExit}` +
      (allDiags.length ? ` · ${allDiags.length} anchor parse errors` : '') +
      (staleBlocking ? ` · ${staleBlocking} stale pin${staleBlocking > 1 ? 's' : ''} blocking` : '') +
      (finishedBlocking
        ? ` · ${finishedBlocking} finished change${finishedBlocking > 1 ? 's' : ''} unclosed`
        : '') +
      (enact.gates ? ' · enactment refused' : ''),
  );
  if (masking.length > 0) {
    say(
      `  ${ev.report.counts.pending} claim${ev.report.counts.pending > 1 ? 's' : ''} held pending ` +
        `by open change${masking.length > 1 ? 's' : ''} ${masking.join(', ')} — not gating; ` +
        'close or delete the change to unmask them',
    );
  }
  // A drift row is honesty on the record: a real finding, tracked in the law
  // table, deliberately not gating. The summary names the ids so the red
  // stays visible without punishing the act of writing it down.
  const drifting = claims
    .filter((c) => states.get(c.claimId) === 'drift' && c.legs.some((l) => l.state !== 'ok'))
    .map((c) => c.claimId);
  if (drifting.length > 0) {
    say(
      `  drift: ${drifting.join(', ')} — recorded finding${drifting.length > 1 ? 's' : ''}, ` +
        'tracked in the law table, not gating; fix the code or retire the row to clear it',
    );
  }
  return finalExit;
}

export const verify: Command = {
  name: 'verify',
  help: 'check anchors against the declared repos (deterministic, offline)',
  usage: [
    'usage: multivac verify [dir] [--strict] [--check] [--worktree] [--repo <key>]',
    '  --strict      broken present/unique legs also exit 1, not just tombstones;',
    '                and a finished change — every declared claim resolving,',
    '                every declared repo landed — is refused as unclosed',
    '  --check       never writes: a moved leg is reported, not self-healed',
    '  --worktree    read every declared repo\'s working tree instead of its',
    '                channel ref — local state across the ecosystem, on purpose',
    '  --repo <key>  scope to one declared repo (consumer checkouts only)',
    'from the brain, a sibling repo is read at its channel ref (the ecosystem',
    'as published) and the brain itself at its working tree; from a consumer',
    'repo, its working tree — the content about to be committed there. Every',
    'run prints a `read` line per repo naming the ref or branch and its sha,',
    'and one `enact` line (MV-81): a row reaching active beside the code it',
    'anchors is refused, or the line says why the question could not be asked.',
  ],
  run: runVerify,
};

export default verify;
