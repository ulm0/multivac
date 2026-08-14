// Shared domain types. Every module codes against these; keep them boring.

/** Anchor evaluation modes. `count` carries its N in Anchor.count. */
export type Mode = 'present' | 'absent' | 'unique' | 'count';

/**
 * Per-leg verify states. `pending` is a claim an open change declares before
 * its code exists: informational, never blocking, never self-healed.
 */
export type LegState =
  | 'ok'
  | 'pending'
  | 'moved'
  | 'broken'
  | 'vacuous'
  | 'unevaluated';

/** One declared repo in .multivac/config.yml. Bare string = { path }. */
export interface RepoEntry {
  path: string;
  url?: string;
  grapher?: string;
  channel?: string;
  /**
   * brain==code: the path resolves to the brain root, so this entry IS the
   * brain. Set by loadConfig. Such an entry carries the brain door, is
   * reached through the implicit `brain` handle, and has no mount to pin.
   */
  isBrain?: boolean;
}

/** Parsed .multivac/config.yml with defaults applied. */
export interface Config {
  doors: string[];
  sdd?: string;
  /** yml key: sdd_auto. Default true. */
  sddAuto: boolean;
  grapher?: string;
  authorities: string[];
  /** Modes that gate (exit 1). Default [absent, count]; must include absent. */
  blocking: Mode[];
  /**
   * What a pin behind its channel does to verify. Default 'report';
   * 'block' makes a resolvable stale pin exit 1. An unresolvable channel
   * ref reports either way — offline never guesses, never gates.
   */
  staleness: 'report' | 'block';
  /** yml key: strict_pre_push. doors installs `verify --strict` as pre-push. */
  strictPrePush: boolean;
  channel?: string;
  /** Where the brain mounts inside code repos. Default ".brain". */
  mount: string;
  repos: Record<string, RepoEntry>;
}

/**
 * One `!` exclusion of an anchor leg. `repoKey` unset is the bare form:
 * repo-relative, biting in every repo the leg evaluates. Set, it names the
 * one declared repo the glob bites in — the only way to exempt a path in
 * one repo without exempting its namesake in the others.
 */
export interface Exclusion {
  repoKey?: string;
  glob: string;
}

/**
 * One anchor leg, parsed from
 * <!-- @anchor <CLAIM-ID> <repo-key>:<glob> [!<glob> ...] /<regex>/[flags] [mode] -->
 */
export interface Anchor {
  claimId: string;
  /** Registry key, or "*" for every declared repo plus the brain. */
  repoKey: string;
  include: string;
  excludes: Exclusion[];
  /** POSIX-ERE-with-classes source, uncompiled. */
  regexSource: string;
  /** Only "i" or "". */
  regexFlags: string;
  mode: Mode;
  /** Set iff mode === 'count'. */
  count?: number;
  /** Brain file the anchor comment lives in. */
  file: string;
  /** 1-based line of the comment. */
  line: number;
}

/** Result of evaluating one leg. */
export interface LegResult {
  anchor: Anchor;
  state: LegState;
  /** Matches found (files, or file:line). */
  matchCount?: number;
  /** For moved: the rewritten glob. */
  movedTo?: string;
  /** Terse, actionable: what to DO. */
  detail?: string;
}

/** All legs of one claim; state is the worst leg's. */
export interface ClaimResult {
  claimId: string;
  state: LegState;
  legs: LegResult[];
}

export interface VerifyReport {
  claims: ClaimResult[];
  counts: Record<LegState, number>;
  /** Broken/vacuous legs in a blocking mode — nonzero means exit 1 always. */
  blockingBroken: number;
  exitCode: 0 | 1;
}

export interface CommandContext {
  cwd: string;
}

/** A CLI subcommand. Dispatch is a lookup over a Command[], not a framework. */
export interface Command {
  name: string;
  help: string;
  /** Extra usage lines for `--help` / `multivac help <name>`; optional. */
  usage?: string[];
  run(argv: string[], ctx: CommandContext): Promise<number>;
}
