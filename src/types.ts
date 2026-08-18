// Shared domain types. Every module codes against these; keep them boring.

/**
 * Anchor evaluation modes. `count` carries its N in Anchor.count; `each`
 * carries its polarity in Anchor.negated (`each!` = every file has no match).
 */
export type Mode = 'present' | 'absent' | 'unique' | 'count' | 'each';

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

/**
 * A grapher declared inline in .multivac/config.yml under `graphers:`.
 * The escape hatch that keeps "unverified" from meaning "unusable": a tool
 * the registry has never seen is one config block away from working, with no
 * merge request against multivac. The operator STATES the contract; multivac
 * never infers one (src/adapters/registry.ts, `grapherSpec`).
 */
export interface GrapherDecl {
  /** Repo-relative path the tool writes — file or directory. */
  artifact: string;
  /** The one command safe to re-run. Its first word is the binary. */
  refresh: string;
  /** Build command, when it differs from the refresh. */
  create?: string;
  /** Binary on PATH, when it is not the first word of `refresh`. */
  binary?: string;
  /** Install line printed when the binary is missing. */
  install?: string;
}

/** One declared repo in .multivac/config.yml. Bare string = { path }. */
export interface RepoEntry {
  path: string;
  url?: string;
  grapher?: string;
  /**
   * This repo's SDD adapter, overriding the ecosystem's `sdd:` — the same
   * shape and the same fallback `grapher` above already has. The literal
   * `none` means this repo has no SDD flow: it is never scaffolded, never
   * gated, and never reported as lacking anything (MV-87). Not every repo in
   * an ecosystem wants a spec-driven flow, and scaffolding one that does not
   * is writing into somebody's checkout for no reason.
   */
  sdd?: string;
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
  /** yml key: grapher_auto. Default true. False keeps the tool and drops the gate. */
  grapherAuto: boolean;
  /**
   * yml key: graphers. Contracts for graphers the registry has not verified,
   * stated by the operator: name -> { artifact, refresh, create?, binary?,
   * install? }. This is what makes "unverified" mean "declare it here",
   * not "you need an MR against multivac".
   */
  graphers: Record<string, GrapherDecl>;
  authorities: string[];
  /** Modes that gate (exit 1). Default [absent, count, each]; must include absent. */
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
  /** Set iff mode === 'each': true = `each!`, every file must contain NO match. */
  negated?: boolean;
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
