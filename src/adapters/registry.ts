import { PLAN_SKELETON, SPEC_SKELETON, TASKS_SKELETON } from './skeletons.js';

// Tool-shipped adapter/target registry — data, not code. Adding a harness or
// an SDD tool is ADDING AN ENTRY here (an MR to multivac), never a new module.
// Project config only SELECTS entries by name.
//
// Every entry carries the vendor doc it was read from. A format that cannot be
// verified from a primary source gets no entry at all — an honest gap beats an
// invented door, and a named tool reads as a supported one.

export type DoorKind =
  /** AGENTS.md itself — the one file every other kind projects from. */
  | 'canonical'
  /** The harness reads AGENTS.md itself: nothing to project, nothing to write. */
  | 'native'
  /** A second name for the same bytes. */
  | 'symlink'
  /** A tool-owned file: optional frontmatter, then the managed block. */
  | 'stub';

/**
 * MV-151. How a harness tells a hook command what fired it, as measured in its
 * own binary: a variable set only in hook processes, and the JSON on stdin —
 * the field naming the event, the two events multivac's gates run on, and the
 * dotted paths of the edited file and of the session's directory. `verify`
 * reads stdin only when `env` is set, so a terminal, CI and a git hook run
 * from the agent's shell never read it. Data, never a harness name: `verify`
 * dispatches on these fields, and a target that declares none keeps the
 * session's directory and the full report after every edit.
 */
export interface HookPayload {
  env: string;
  event: string;
  session: string;
  edit: string;
  file: string;
  cwd: string;
}

/** One harness target: what `doors` writes for it. */
export interface DoorTarget {
  /** The file the harness reads, repo-relative. */
  door: string;
  /** How the canonical AGENTS.md projects into `door`. */
  kind: DoorKind;
  /** What the harness actually reads, in its own vendor's words. */
  note: string;
  /** Vendor doc this entry was verified against. */
  source: string;
  /** Frontmatter for stub targets that need one; plain markdown otherwise. */
  frontmatter?: string;
  /** Where the multivac skill installs for this harness, if it has skills. */
  skill?: string;
  /**
   * Harness hook config: the file, the shape of the entries written there,
   * and — when the harness fires a hook after a file edit — `postEdit`, the
   * matcher naming its file-editing tools, which the verify gate runs on.
   * `payload` (MV-151) is what the harness hands each hook; it is never
   * written anywhere — `doors` reads `path` and `postEdit`.
   */
  hookConfig?: { path: string; shape: string; postEdit?: string; payload?: HookPayload };
  /** Path whose presence makes `init` propose this target. */
  detect?: string;
  /**
   * MV-143. A file this target used to project and no longer does, with the
   * `head` multivac itself wrote above the block when it created it. One `doors`
   * run removes multivac's block and deletes the file when nothing but that head
   * is left, so a retired target leaves no second door behind (MV-73) and an
   * operator's own lines survive (MV-108).
   */
  retired?: { path: string; head?: string };
}

/**
 * Where a step sits in multivac's lifecycle. Not a step NAME — the tools do
 * not agree on names, and a fixed propose/apply/archive triple is one tool's
 * shape imposed on the rest. A step declares the point that PRINTS it (`at`)
 * and, when the tool leaves proof behind, the point that REFUSES without that
 * proof (`gate`). `gate` always comes strictly after `at`.
 */
export type LifecyclePoint = 'new' | 'plan' | 'apply' | 'land' | 'close';

/** The lifecycle commands that refuse on a missing artifact. */
export type GatePoint = Extract<LifecyclePoint, 'plan' | 'apply' | 'close'>;

/** One step of a tool's OWN per-change flow. Ordered; arbitrary length. */
export interface SddStep {
  /** What the AGENT runs, in the tool's own words. `<slug>` is interpolated. */
  run: string;
  /** Lifecycle point that prints it. */
  at: LifecyclePoint;
  /**
   * Repo-relative path that PROVES this step ran. `<slug>` is interpolated;
   * one `*` segment is matched by readdir, for tools that name the feature
   * directory themselves. Absent ⇒ the step is ungateable and `ungateable`
   * says why.
   */
  artifact?: string;
  /** Lifecycle command that refuses while `artifact` is missing. */
  gate?: GatePoint;
  /**
   * Template files this artifact is COPIED FROM when the step begins. An
   * artifact byte-identical to any of them was written by the scaffolding,
   * not by the agent, and the gate refuses.
   *
   * Existence is the weakest possible proof and some tools hand it out for
   * free: spec-kit's `setup-plan.sh` runs
   * `resolve_template_content "plan-template" > "$IMPL_PLAN"` as part of
   * STARTING the step, so the gate went green on a file nobody had touched.
   * Its sibling `setup-tasks.sh` only writes the template to stdout, which is
   * why the tasks gate was honest by accident.
   *
   * Byte-identity rather than a placeholder regex, and the reason is a
   * measurement: the obvious pin — the template's own `# Implementation Plan:
   * [FEATURE]` heading — is a line spec-kit NEVER asks anyone to change.
   * Neither its plan skill nor the template's two ACTION REQUIRED markers
   * mention the title, so a complete, real plan keeps it and would have been
   * refused forever. Comparing whole files instead has no false positives at
   * all: a written plan is never byte-identical to the template it came from.
   *
   * Listing the override path too follows spec-kit's own documented stack
   * (`common.sh`: "Priority 1: Project overrides (always replace)"). What this
   * does NOT catch is stated rather than hidden: an agent that edits one line
   * and stops, or a preset resolving a template from outside these paths.
   */
  untouched?: string[];
  /**
   * Why this step can never be proven from the filesystem. Required whenever
   * `artifact` is absent: an ungateable step is STATED, never faked green.
   */
  ungateable?: string;
  /**
   * The tool's OWN validator for this artifact, `<slug>` interpolated. Run for
   * its verdict only — never to fake an agent-run step. Reusing the tool's
   * verdict beats reimplementing rules that would drift away from it.
   *
   * A validator whose binary cannot be found is a REFUSAL, not a pass. The
   * gate would otherwise stand on artifact existence alone wherever the tool
   * is not installed — the same command green on a machine that cannot check
   * anything, which is the quietest way this registry could lie.
   */
  validate?: string;
  /**
   * A ledger the TOOL ITSELF keeps, which can say the work is not finished.
   *
   * Distinct from `validate`, which asks the vendor's binary, and from
   * `artifact`, which only proves a step ran. Every SDD tool here ships an
   * escape hatch letting a step complete over its own objection — OpenSpec's
   * `openspec archive --yes` prints `Warning: 4 incomplete task(s) found` and
   * archives anyway in text mode, and under `--json` archives with no word at
   * all (1.5.0–1.13.2, MV-147) — and gating on the artifact alone accepts that
   * silently.
   * Reading the ledger is not reimplementing the tool's rules: the tool wrote
   * the file and already decided what the marker means.
   *
   * This proves the tool's own book does not say UNDONE. It does not prove the
   * work happened — `- [x]` is still a character an agent types about itself,
   * which is why the step that does the work stays `ungateable`.
   */
  unfinished?: {
    /** Repo-relative ledger path; `<slug>` interpolated, one `*` segment allowed. */
    artifact: string;
    /** ERE matching a line that means "not done". */
    pattern: string;
    /** What a match means, printed in the refusal. */
    why: string;
    /**
     * Lifecycle command that refuses while the ledger says UNDONE. Carried
     * here rather than reusing the step's own `gate` so an ungateable step
     * can still be checked: whether `/speckit.implement` RAN is unprovable,
     * but whether its task list still has open boxes is a fact on disk.
     */
    gate: GatePoint;
  };
  /**
   * MV-146. Where this step moves the change's own spec deltas when it runs:
   * each `<artifact dir>/<from>/<cap>/<file>` is merged into
   * `<into>/<cap>/<file>`. Close stages every such file, beside the directory
   * the step archived into and the one it moved from, so the merged main
   * specs land in the same commit as the archive instead of being named dirty
   * and left out.
   *
   * MV-147: `file` is the one name the tool merges. Any other file under
   * `<from>/` — notes kept beside a delta — has no main spec, so no path of a
   * human's under `<into>/` is staged in its name.
   */
  merges?: { from: string; into: string; file: string };
  /**
   * MV-147. What the lifecycle prints on the line under this step — at its
   * point and in every refusal that re-prints it, never in the door, `doctor`
   * or flow.md — `<slug>` interpolated: the rest of what the vendor's own
   * command body told the agent, measured on a named version, where `run` has
   * room only for the command and the human's question. Whether the agent
   * asked what it names is ungateable (MV-95).
   */
  guide?: string;
  /**
   * MV-147. An ERE over the issue messages of a PASSING `validate` verdict:
   * each match is printed as a note and refuses nothing — the tool said the
   * artifact is valid and, in the same output, what a later step of its own
   * will refuse.
   */
  validateNotes?: string;
}

/**
 * A project-level document: written once, then AMENDED as the product moves.
 * Not per-change — `doctor` reports it and `init`/`doors` tell the agent to
 * create it if absent.
 *
 * Its CONTENT is never machine-judged: no tool can decide whether a
 * constitution's principles still fit (MV-57). Its PRESENCE is a different
 * question with a machine answer, so `change plan` REFUSES while it is missing
 * (MV-76) — the gate MV-57 used to forbid along with the content check it was
 * really about.
 */
export interface SddProjectStep {
  /** What the AGENT runs to create or amend it. */
  run: string;
  /** Repo-relative path of the document. */
  artifact: string;
  /** When to revisit it, in the tool's own terms. */
  revisit: string;
  /**
   * The fill-in tokens only the SHIPPED TEMPLATE carries, literally. Some tools
   * scaffold the file unfilled, so its mere existence proves nothing —
   * spec-kit installs `constitution.md` byte-identical to the template. A
   * document still carrying one outside an HTML comment has not been written.
   *
   * This is the pin MV-65 rejected for a per-step artifact, and it is the
   * right one here for the reason MV-65 gives: `/speckit.constitution`
   * explicitly instructs the author to replace `[PROJECT_NAME]` and every
   * `[PRINCIPLE_N_*]`, so a written document carries none of them. Unlike
   * whole-file equality it needs no template on disk, so it cannot fail open
   * when the template is gone. MV-135: the tool's OWN tokens, not a pattern —
   * `\[[A-Z0-9_]+\]` refused a written document citing `[1]` or `[API]`.
   */
  placeholders?: string[];
  /**
   * MV-135. A JSON file the tool writes beside the document, whose `sha256` is
   * the template it installed. A document with that sha256 is the template,
   * whatever tokens it carries. Unreadable, it adds nothing: the tokens still decide.
   */
  templateRecord?: string;
  /**
   * MV-135. The document is a key of a YAML file (`artifact`), a non-empty
   * string of at most `limit` bytes, reported and never gated.
   */
  reportOnly?: { key: string; limit: number };
}

/**
 * The tool's OWN init.
 *
 * Beside the validator, the one command in this file multivac runs ITSELF.
 * Every `SddStep` is run by the agent and only printed here (MV-51) — a chat
 * command for spec-kit, the vendor's own terminal verbs for opsx (MV-147); a
 * scaffold is a terminal command multivac runs, so it lives in its own field
 * rather than as a step nothing could tell apart at the point steps are printed.
 *
 * It exists because declaring an SDD in a repo where it has never run was a
 * deadlock: `plan` refuses without an artifact, the artifact comes from a chat
 * command, and the chat command does not exist until the tool's own init has
 * run — the change that would install it being the change its own gate refused.
 * That deadlock is spec-kit's (MV-147): opsx's verbs are there wherever the
 * binary is, and `openspec new change` creates a root where none resolves
 * (1.13.2). Its scaffold still runs where the probe says missing, so the brain
 * gets the vendor's own `config.yaml` and the probe reads an init, not a side
 * effect.
 *
 * The command is STATED, never derived from the adapter's name. Whether it has
 * already run here is not this field's to say: the entry's `state` answers
 * that, through `initState` (MV-124), so a hand-made directory is not an install.
 * An init nobody has run gets no entry at all (MV-59's rule), and the lifecycle
 * says so instead of guessing a command to run on someone else's machine.
 */
export interface SddScaffold {
  /**
   * The vendor's own init command, verbatim but for a door placeholder when it
   * holds one: `{key}` takes the first declared door's integration, `{keys}`
   * all of them joined by commas. MV-147: a run with neither is run as
   * written, whatever the doors, and names no door as a gap. Runs in each root
   * that is missing the tool.
   */
  run: string;
  /** MV-130: the vendor's command adding one more integration, `{key}` per further door. */
  add?: string;
  /**
   * MV-130: door -> the vendor's own integration for it, measured on a named
   * version. `safe` is the vendor's multi-install flag: an integration that is
   * not safe is never installed beside another, and multivac never forces it.
   * A door missing here has no verified integration, and is named as a gap
   * only for a `run` with a door placeholder (MV-147).
   */
  /**
   * Per door target: the vendor's own integration key, whether installing it
   * over an existing project is safe, and — MV-144 — the directories it writes
   * OUTSIDE the tool's own store, measured per version. The code gate reads
   * `dirs`: what a declared tool installs there is the tool's, not code, and the
   * directory cannot be deduced from the key (openspec's `codex` writes
   * `.agents/`, its `windsurf` writes `.devin/`).
   */
  integrations: Record<string, { key: string; safe: boolean; dirs: string[] }>;
  /** MV-130: the integration used when no declared door maps to one. */
  fallback?: string;
  /**
   * MV-146. Templates multivac writes where the tool resolves them first, once,
   * on the run whose probe turns the root from missing to installed: `files`
   * maps each file name under `dir` to its body, `keeps` names the H2 headings
   * each body keeps, and none is written below `floor` — the lowest version
   * measured to read `dir` first — nor over a file already there. It sits on
   * the scaffold, not on an integration: an override is served verbatim, so it
   * carries none of the `tokens` the init substitutes per integration.
   */
  skeleton?: {
    dir: string;
    files: Record<string, string>;
    keeps: Record<string, string[]>;
    measured: string;
    floor: string;
    tokens: string[];
    /**
     * Where the tool records its presets, which the override directory
     * outranks: `registry` is the JSON file listing them (`{ presets: { <id>:
     * { enabled, … } } }`), `templates` the directory a preset ships its own
     * templates in, `<id>` interpolated, and `propagates` the presets that
     * ship none and instead write into the core templates a skeleton shadows.
     * Read by `doctor` alone, and only as a report.
     */
    presets?: { registry: string; templates: string; propagates: string[] };
  };
  /**
   * MV-147. What the vendor's integration inits write under a directory:
   * `names` are globs over an entry's name (depth one or two under the
   * directory), `dirs` the directories an earlier version wrote that
   * `integrations` no longer records. The code gate reads the entries as not
   * code under every integration's `dirs` and these, declared door or not;
   * `doctor` names those left in the brain once the scaffold installs none.
   */
  bodies?: { names: string[]; dirs: string[] };
  /** What running it actually wrote, and how that was established. */
  note: string;
}

/**
 * MV-124. The files a vendor's own init writes, and the check that proves it
 * finished. `initState` reads them and nothing else.
 */
export interface StateProbe {
  /** The vendor's own directory: there without a passing file is partial. */
  dir?: string;
  /** Repo-relative state files; any one passing `check` is installed. */
  files: string[];
  /** exists: any path. file: a regular file. json: a regular file that parses. */
  check: 'exists' | 'file' | 'json';
  /** json only: a key equal to a number, or holding a non-empty list. */
  expect?: Record<string, number | 'non-empty'>;
}

/** One SDD adapter: what to detect and what automation it carries. */
export interface AdapterSpec {
  kind: 'sdd';
  /**
   * Repo-relative paths the tool writes: a record for the reader, and no
   * command reads them. Whether the tool is initialised is `state`'s answer,
   * never these paths being there.
   */
  artifacts: string[];
  /** MV-124: the state files that say the vendor is initialised in a root. */
  state: StateProbe;
  /**
   * MV-124: which of the vendor's paths are versioned (`shared`) and which
   * belong to one checkout (`local`), plus the ignore lines that say so. A
   * literal path beats a glob, and between two globs `local` wins, so
   * `.specify/feature.json` is local under `.specify/**`. Read where they
   * decide something: the carry takes an SDD's `shared` files onto a change's
   * branch (MV-144), and the code-in-change gate counts all three as not
   * code (MV-137).
   */
  shared: string[];
  local: string[];
  ignore: string[];
  /**
   * MV-124: the vendor's opt-out variables, set over the inherited environment
   * on every command multivac runs for this entry. Bare words only.
   */
  env: Record<string, string>;
  /**
   * The names the tool's binary goes by; any one of them names this tool.
   * No command reads it (MV-123): whether a root can run the tool is `required`.
   */
  binaries: string[];
  /**
   * MV-123. Every binary this adapter's commands run, ALL of which must be
   * found (`findBinary`) before a root can run them. The first word of each
   * command the entry declares is in it, and a test holds that.
   */
  required: string[];
  /** Exact hint printed when a required binary is missing. */
  installHint: string;
  /** The command that brings the tool's own files up to date: a record, which no command runs. */
  refresh: string;
  /**
   * Automation contract: sdd_auto — the change lifecycle prints the tool's
   * agent instruction at each step unless sdd_auto: false / --no-sdd.
   */
  automation: 'sdd_auto';
  /**
   * SDD only: the tool's OWN per-change flow, in order, verified against its
   * own docs. A step is what the AGENT runs — a chat command for spec-kit, the
   * vendor's own terminal verbs for opsx (MV-147), measured on a named
   * version — and multivac runs none of them:
   * the lifecycle prints them and gates on what they leave behind, and never spawns one.
   * A lifecycle point no step declares is a point this tool has no equivalent
   * for; the lifecycle says so honestly instead of inventing one.
   */
  steps?: SddStep[];
  /**
   * SDD only: project-level documents — the law of the project, written once
   * and amended as it moves. Empty/absent for a tool that has none; that gap
   * is stated, never papered over with an invented file.
   */
  projectSteps?: SddProjectStep[];
  /**
   * SDD only: the tool's own init, run by the LIFECYCLE where `initState` says
   * missing — never by `verify`, `doctor` or `doors` (MV-75): the init writes
   * the vendor's files into the tree. Optional because an init nobody verified
   * by running it is a gap this registry states rather than fills.
   */
  scaffold?: SddScaffold;
  /**
   * MV-146. SDD only: the file and key where the tool records which feature
   * directory its steps write into. One per checkout, so two changes open in
   * the brain share it; the lifecycle points it at the slug's directory before
   * printing that slug's steps.
   */
  pointer?: { path: string; key: string };
  /**
   * MV-146. SDD only: how to remove an install an earlier release left in a
   * code repo, as measured. `doctor` prints it beside the leftover it
   * reports; absent, it names the state directory instead.
   */
  leftover?: string;
  /**
   * MV-147. SDD only: the slugs the tool's own create step accepts — an ERE,
   * the names it reserves, and the reason printed with a refusal. `change new`
   * and `roadmap add` refuse any other slug, whatever `sdd_auto` and `--no-sdd`
   * say; absent, they accept what they always did.
   */
  slug?: { pattern: string; reserved: string[]; why: string };
  /** What the tool's own docs say, where it matters. */
  note?: string;
  /** Vendor doc this entry was verified against. */
  source?: string;
}

/**
 * Known harness targets. `agents` is the canonical door; the rest project from
 * it or read it natively. Three of the eight read AGENTS.md as-is, and for
 * those the canonical door IS the integration — declaring them changes no
 * file, it only makes `doctor` account for them.
 *
 * A harness whose door multivac cannot own does not get an entry. It used to:
 * `aider` sat here as `kind: 'unsupported'`, listed among the supported
 * everywhere the registry is enumerated — in `--provider`'s legal values, in
 * the reference table, in the count of what this tool integrates with —
 * carrying a note that said, at length, that none of it applied. Naming a tool
 * you do not support is worse than silence: it reads as support to everyone
 * who does not open the entry. An unknown name already gets the list of what
 * IS supported, which is the answer that helps.
 */
export const doorTargets: Record<string, DoorTarget> = {
  agents: {
    door: 'AGENTS.md',
    kind: 'canonical',
    note: 'The canonical door. Every other target projects from this file.',
    source: 'https://agents.md/',
  },
  claude: {
    door: 'CLAUDE.md',
    kind: 'symlink',
    note: 'Claude Code reads CLAUDE.md, not AGENTS.md; its docs give `ln -s AGENTS.md CLAUDE.md` as the way to share one file. On Windows the symlink needs developer mode — use `@AGENTS.md` as the first line of CLAUDE.md instead.',
    source: 'https://code.claude.com/docs/en/memory',
    skill: '.claude/skills/multivac/SKILL.md',
    hookConfig: {
      path: '.claude/settings.json',
      shape:
        'hooks.SessionStart + hooks.PostToolUse -> mvac verify',
      postEdit: 'Edit|Write|MultiEdit',
      // MV-151, read in Claude Code 2.1.283's binary: hook processes receive
      // CLAUDE_PROJECT_DIR (the agent's own Bash tool does not); payloads carry
      // hook_event_name "SessionStart" with its source and "PostToolUse" with
      // tool_name and tool_input, beside session_id, transcript_path and cwd;
      // hooks for forwarded commands start in the home directory, where the
      // binary says a guard must use $CLAUDE_PROJECT_DIR or the cwd field.
      payload: { env: 'CLAUDE_PROJECT_DIR', event: 'hook_event_name', session: 'SessionStart', edit: 'PostToolUse', file: 'tool_input.file_path', cwd: 'cwd' },
    },
    detect: 'CLAUDE.md',
  },
  cursor: {
    door: 'AGENTS.md',
    kind: 'native',
    // MV-143. This was a `stub`: a second copy of the door under
    // .cursor/rules, pinned into every chat with `alwaysApply`. Cursor reads
    // AGENTS.md at the project root — its own docs say so, and the previous
    // note said so while projecting a file anyway — so the stub was a door
    // that could disagree with the canonical one. The file this target used
    // to write is retired below.
    note: 'Cursor reads AGENTS.md at the project root. Nothing to project beyond the canonical door; a rules file under .cursor/rules would be a second door that can disagree with it.',
    source: 'https://cursor.com/docs/context/rules',
    retired: {
      path: '.cursor/rules/multivac.mdc',
      head: '---\ndescription: multivac door — ecosystem law, brain location\nalwaysApply: true\n---',
    },
    detect: '.cursor',
  },
  opencode: {
    door: 'AGENTS.md',
    kind: 'native',
    note: 'opencode reads AGENTS.md at the project root and up the tree. Nothing to project beyond the canonical door; extra files would go under `instructions` in opencode.json, which multivac does not own.',
    source: 'https://opencode.ai/docs/rules/',
    detect: 'opencode.json',
  },
  codex: {
    door: 'AGENTS.md',
    kind: 'native',
    note: 'Codex reads AGENTS.md from the git root down to the working directory, concatenated, nearest last. Nothing to project beyond the canonical door; its own config is .codex/config.toml, which multivac does not write.',
    source: 'https://learn.chatgpt.com/docs/agent-configuration/agents-md',
    detect: '.codex',
  },
  windsurf: {
    door: 'AGENTS.md',
    kind: 'native',
    note: 'Cascade treats a root AGENTS.md as an always-on rule and a subdirectory one as a glob rule for that directory. Nothing to project beyond the canonical door; the legacy .windsurf/rules/*.md still works but needs its own frontmatter.',
    source: 'https://docs.windsurf.com/windsurf/cascade/agents-md',
    detect: '.windsurf',
  },
  gemini: {
    door: 'GEMINI.md',
    kind: 'symlink',
    note: 'Gemini CLI reads GEMINI.md by default. It can be pointed at AGENTS.md with `context.fileName` in .gemini/settings.json, but the symlink needs no settings file and no merge, so that is what multivac projects.',
    source: 'https://geminicli.com/docs/cli/gemini-md/',
    detect: '.gemini',
  },
  copilot: {
    door: '.github/copilot-instructions.md',
    kind: 'stub',
    note: 'Copilot reads AGENTS.md only in some surfaces (cloud agent, VS Code chat, Copilot CLI); .github/copilot-instructions.md is the one path supported everywhere, and it takes plain markdown with no frontmatter.',
    source: 'https://docs.github.com/en/copilot/reference/custom-instructions-support',
    detect: '.github/copilot-instructions.md',
  },
};

const sdd: Record<string, AdapterSpec> = {
  opsx: {
    kind: 'sdd',
    artifacts: ['openspec/specs', 'openspec/changes'],
    // What `openspec init` 1.13.0 writes (requirements study), reproduced by stubs.
    state: { dir: 'openspec', files: ['openspec/config.yaml', 'openspec/config.yml'], check: 'file' },
    shared: ['openspec/config.yaml', 'openspec/config.yml', 'openspec/specs/**'],
    local: [],
    // Measured on 1.13.2: its init wrote `openspec/` and, per tool, the
    // `openspec-*` skills and `opsx` commands under that harness's directory.
    leftover: 'delete openspec/ and the openspec-* skills and opsx commands its init wrote under each harness directory',
    ignore: [],
    env: { DO_NOT_TRACK: '1', OPENSPEC_TELEMETRY: '0' },
    binaries: ['openspec'],
    required: ['openspec'],
    installHint: 'npm i -g @fission-ai/openspec',
    // MV-147: it refreshes only the bodies a human installed. In a brain the
    // scaffold below made (`--tools none`) there are none, and 1.13.2 prints
    // `No configured tools found.`, exits 0 and writes nothing.
    refresh: 'openspec update',
    automation: 'sdd_auto',
    scaffold: {
      // MV-147, measured 2026-09-28 on openspec 1.13.2 with HOME isolated:
      // `--tools none` wrote openspec/config.yaml and the two gitkeeps, nothing
      // outside `openspec/` and nothing under HOME, whatever the doors. The
      // printed steps are openspec's own terminal verbs, which every harness
      // runs alike, so no command body is installed for them to need. Its
      // floor is 1.7.0, the first `--no-animation`.
      run: 'openspec init --tools none --no-animation .',
      // MV-130, measured 2026-09-16 on openspec 1.13.0 in a scratch repo with
      // DO_NOT_TRACK=1 and OPENSPEC_TELEMETRY=0: `openspec init --tools
      // claude,cursor --no-animation .` exited 0 and wrote openspec/config.yaml,
      // openspec/specs/.gitkeep, openspec/changes/archive/.gitkeep, and six
      // commands and six skills under each of .claude/ and .cursor/. The tool
      // keys are the ones its `init --help` lists; it names `windsurf` as an
      // accepted alias ("now devin").
      // MV-144, measured 2026-09-25 on openspec 1.13.2, one fresh git repo per
      // integration with HOME isolated: each wrote its own store under
      // `openspec/` plus the directories below, and nothing else.
      // MV-147: the record of what `openspec init --tools <key> --no-animation .`
      // writes, measured on 1.13.2; multivac no longer runs it — a human's
      // opt-in, or an earlier multivac's init, leaves these, which the code
      // gate reads (MV-144) and `doctor` names.
      integrations: {
        agents: { key: 'agents', safe: true, dirs: ['.agents'] },
        claude: { key: 'claude', safe: true, dirs: ['.claude'] },
        cursor: { key: 'cursor', safe: true, dirs: ['.cursor'] },
        codex: { key: 'codex', safe: true, dirs: ['.agents'] },
        gemini: { key: 'gemini', safe: true, dirs: ['.gemini'] },
        opencode: { key: 'opencode', safe: true, dirs: ['.opencode'] },
        copilot: { key: 'github-copilot', safe: true, dirs: ['.github/prompts', '.github/skills'] },
        windsurf: { key: 'windsurf', safe: true, dirs: ['.devin'] },
      },
      // MV-147, measured on openspec 1.13.2 for all eight keys, one fresh
      // repo each with HOME isolated: every entry an integration init wrote
      // outside `openspec/` is named `openspec-*` (the skills), `.openspec-*`
      // (the `.openspec-target` marker beside `.agents/skills/`), `opsx` (the
      // command directory) or `opsx-*` (a command or prompt file), one or two
      // levels under a directory above. `codex` wrote `.codex/skills` on 1.7.0
      // and `.agents/skills` from 1.8.0, so `.codex` is recorded here and not
      // in its integration. Names, not files: which workflows an init writes
      // is the vendor's to change, and the names held for claude, codex and
      // github-copilot on 1.10.0 and 1.13.0 as well.
      bodies: { names: ['openspec-*', '.openspec-*', 'opsx', 'opsx-*'], dirs: ['.codex'] },
      note: '`--tools none` writes openspec/config.yaml and the two gitkeeps and nothing outside `openspec/`, whatever the doors (1.13.2).',
    },
    // MV-135. OpenSpec's project context, not a constitution: `openspec init`
    // (1.13.0) writes `openspec/config.yaml` with `context:` commented out,
    // documented as optional, injected into every artifact's instructions, and
    // ignored above 51200 bytes (dist/core/project-config.js). Reported, never
    // gated: a gate would be stricter than the vendor that defines it.
    projectSteps: [
      {
        run: 'write `context:` in openspec/config.yaml — the tech stack, conventions and domain openspec injects into every artifact',
        artifact: 'openspec/config.yaml',
        revisit: 'when the stack or the conventions change; openspec defines no cadence and calls the field optional',
        reportOnly: { key: 'context', limit: 51200 },
      },
    ],
    // MV-147, measured 2026-09-28 on openspec 1.13.2: `new change` refused
    // `Fix_Auth` ("Change name must be lowercase (use kebab-case)"), `a--b`
    // ("Change name cannot contain consecutive hyphens"), `a.b`, `a_b`, `Ab`,
    // `a-b-` and `-ab`, and accepted `ab-c`, `1ab`, `a1` and `x`. In a brain
    // the scaffold made, which holds openspec/changes/archive/.gitkeep, `new
    // change archive` exits 1 "Change 'archive' already exists", and `status
    // --change archive` refuses "'archive' is reserved for archived changes".
    // The printed `new` step's first command would fail on either, so the
    // slug is refused before the change is opened, not after.
    slug: {
      pattern: '^[a-z0-9]+(-[a-z0-9]+)*$',
      reserved: ['archive'],
      why: "openspec 1.13.2's `new change` takes lowercase letters and digits in runs joined by single hyphens, and reserves `archive`",
    },
    // MV-147, measured 2026-09-28 on openspec 1.13.2, stdin closed: each step
    // is the vendor's own terminal verbs — `new change`, `status`,
    // `instructions` and `archive`, each listed by `openspec --help` — which
    // every harness runs alike. A step name is never a verb: `openspec
    // propose` and `openspec apply` exit 1, `unknown command`. `status` is
    // printed in text, the rest in `--json`, for their fields and codes. Each
    // `run` is one double-quoted line, so the flag leg reads it whole.
    steps: [
      {
        at: 'new',
        run: "in the brain checkout run `openspec new change <slug> --json`, then write each artifact `openspec status --change <slug>` marks `[ ]` from `openspec instructions <id> --change <slug> --json`; a material ambiguity is the human's question",
        // MV-147, read on openspec 1.13.2 with HOME isolated. Its
        // `.claude/commands/opsx/propose.md` — a body an init installed, which
        // no printed step names now — asked the human, before creating, about
        // ambiguity that would change scope, observable behaviour,
        // compatibility or acceptance (step 1, :42–:51; Guardrails, :168),
        // surfaced a conflict with an existing spec rather than deciding it
        // (:119), asked whether to continue a change of that name that already
        // exists (:169), and never created the root as a side effect (:36) —
        // which `new change --json` run outside any root does, reporting
        // `root.source` `implicit`. Its writing rules (`resolvedOutputPath`,
        // `template`, `instruction`; `context` and `rules` never copied in,
        // :110–:126) ride here too. `new change --json` and
        // `resolvedOutputPath` ship in 1.4.0, `archive --json` in 1.5.0.
        // Whether the agent asked is ungateable (MV-95).
        guide: "`already exists` for a change you did not open in this run is the human's question; otherwise go on. A `root.source` of `implicit` means you ran outside the brain checkout: delete the openspec/ it made. Write the file each instruction's `resolvedOutputPath` names from its `instruction` and `template`; its `context` and `rules` bind you and are never copied in. Before the proposal, ask the human about any ambiguity that would change scope, observable behaviour, compatibility or acceptance, and about any conflict with a main spec; assume and record the rest. `unknown option '--json'`: openspec is older than the 1.5.0 this flow needs — upgrade it",
        artifact: 'openspec/changes/<slug>/proposal.md',
        gate: 'plan',
      },
      {
        at: 'plan',
        run: "keep writing each artifact `openspec status --change <slug>` marks `[ ]` from `openspec instructions <id> --change <slug> --json` until tasks.md is written",
        // MV-147, measured on openspec 1.13.2: with design left unwritten,
        // text `status` shows `[ ] design` and `[-] tasks (blocked by:
        // design)`, while `instructions tasks --change <slug> --json` exits 0
        // and serves the tasks template. `status` ends on a `Next:` line (1.13.1
        // on) that, once planning is complete, names `instructions apply` —
        // `change apply`'s point, not this one's.
        guide: "design is optional where its instruction says so; skipped, write tasks from `openspec instructions tasks --change <slug> --json` though status marks it `[-]`. Its `Next:` apply is not yours before `change apply`",
        artifact: 'openspec/changes/<slug>/tasks.md',
        gate: 'apply',
        // OpenSpec's own definition of a well-formed change: delta headers,
        // one scenario per requirement, no conflict with the main specs.
        // Reimplementing it here would guarantee drift.
        validate: 'openspec validate <slug> --json --no-interactive',
        // MV-147, measured on openspec 1.13.2: a MODIFIED delta whose header
        // the main spec lacks validates with exit 0, `valid: true`, and one
        // INFO issue, "Archive would refuse this delta: … - not found". The
        // archive then fails only after the human's yes, so the gate prints
        // it where the delta can still be fixed, and still passes: the tool
        // itself calls the change valid.
        validateNotes: '^Archive would refuse',
      },
      {
        at: 'apply',
        run: "where openspec/changes/<slug>/ is (the brain's change worktree once `change apply` carried it there), run `openspec instructions apply --change <slug> --json` before the first task and after the last; tick `- [x]` only what is fully built, until its `state` is `all_done`; scope beyond the spec is the human's question",
        // MV-147, read on openspec 1.13.2. Its
        // `.claude/commands/opsx/apply.md` paused for the human on an unclear
        // task, a design issue the implementation reveals, work beyond what
        // the spec and tasks describe or a task narrowed, deferred or dropped
        // to make it fit ("do not absorb it silently"), and a blocker
        // (:110–:115). `instructions apply --json` at `all_done` says "All
        // tasks are complete! This change is ready to be archived." — the
        // archive is `change land`'s, after the merge, not the next thing here.
        guide: "an unclear task, a design issue the work reveals, work beyond the spec and tasks, a task you would narrow, defer or drop to make it fit, and a blocker are each the human's question, never absorbed silently. Its \"ready to be archived\" is `change land`'s, after the merge",
        ungateable:
          'apply leaves no artifact of its own — its only trace is `- [x]` in tasks.md, a character the agent types about its own work; nothing links a checkbox to a commit, a test, or a line of code',
      },
      {
        at: 'land',
        run: "after the merge, in the brain checkout (never a change worktree), run `openspec archive <slug> --json` to merge the deltas into openspec/specs/ and archive the change; `archive_confirmation_required` is the human's question, and a flag its `fix` names is never yours",
        // MV-147, measured 2026-09-28 on openspec 1.13.2, stdin closed:
        // `archive <slug> --json` never reads stdin (1.5.0 on). On a change
        // carrying deltas it exits 1 with `archive_confirmation_required`,
        // "Updating N spec(s) requires confirmation", and writes nothing; the
        // same code says "Skipping validation requires confirmation" only
        // after `--no-validate`, which no line lets the agent pass — and were
        // it passed, the run still makes the code the human's question.
        // `show <slug> --json --deltas-only` (1.3.0 on) previews the deltas
        // and writes nothing either. The three answers are the tool's own: its
        // interactive prompt archives without merging on `n`, which
        // `--skip-specs` is.
        guide: "`archive_confirmation_required` saying `Updating`: nothing was written; show the human the deltas from `openspec show <slug> --json --deltas-only`, which writes nothing either — yes: `openspec archive <slug> --json --yes`, then relay its `warnings`; archive without merging: `openspec archive <slug> --json --skip-specs`; anything else: stop. `archive_tasks_incomplete`: finish them where apply ran, or the human drops them from tasks.md; never tick to pass. Any other code: fix what it names and re-run with no flag, never `--no-validate`. `unknown option '--json'`: openspec is older than 1.5.0 — upgrade it",
        artifact: 'openspec/changes/archive/<n>-<n>-<n>-<slug>',
        gate: 'close',
        // `openspec archive --yes` prints `Warning: N incomplete task(s)
        // found. Continuing due to --yes flag.` in text mode, and `archive
        // <slug> --json --yes` archives over open tasks with exit 0 and no
        // warning at all (1.5.0 through 1.13.2, MV-147). The printed archive
        // carries no `--yes`, so openspec itself refuses open tasks first
        // (`archive_tasks_incomplete`); a human's `--yes` still archives them
        // open. The archived directory therefore proves the archive ran and
        // nothing else, so close reads the task list openspec itself just moved.
        unfinished: {
          artifact: 'openspec/changes/archive/<n>-<n>-<n>-<slug>/tasks.md',
          pattern: '^\\s*- \\[ \\]',
          why: 'openspec archived this change with tasks still unchecked — `--yes` archives over its own refusal, and under `--json` says nothing',
          gate: 'close',
        },
        // MV-146, measured 2026-09-28 on openspec 1.13.2: `openspec archive
        // <slug> --yes` moved openspec/changes/<slug>/ to the dated archive and
        // merged each specs/<cap>/spec.md delta into openspec/specs/<cap>/,
        // creating the capability when it was new. MV-147: only `spec.md` —
        // findSpecUpdates merges each capability's `spec.md` (discoverSpecFiles:
        // never one at the root of specs/, never under a dot-directory), and a
        // notes.md beside it stays where it was, unmerged.
        merges: { from: 'specs', into: 'openspec/specs', file: 'spec.md' },
      },
    ],
    // MV-147: disclosed by version, as measured (MV-121). No command prints
    // this; the tests read it and the site says the same in its own words.
    note: "The steps are openspec's own terminal verbs, run by the agent: `new change`, `status`, `instructions` and `archive`, each listed by `openspec --help` 1.13.2 and run there with stdin closed. The printed flow needs 1.5.0 or later (`archive --json`; `new change --json` and `resolvedOutputPath` ship in 1.4.0), the scaffold 1.7.0 (`--no-animation`). multivac itself runs only `openspec validate` and the scaffold, each with this entry's `env`. Network, measured with a fetch recorder and HOME isolated: 1.4.1 through 1.13.0 send one anonymous PostHog event to edge.openspec.dev from every command, `--json` included; 1.13.1 and 1.13.2 send nothing until a run without `--json` and without an opt-out shows the first-run notice, which writes ~/.config/openspec/config.json and sends, and every command from then on sends — the printed text `openspec status` is the first printed call that can. The agent's calls — 15 per change as printed, plus the `openspec list`, `openspec show` and `openspec validate` openspec's own output names — carry none of `env`: the opt-outs that reach them are OPENSPEC_TELEMETRY=0 or DO_NOT_TRACK=1 in the agent's own environment, either alone (measured 1.4.1 through 1.13.2), or `openspec config set telemetry.enabled false` from 1.10.0. A text-mode call whose stderr is a terminal writes `completionTipSeen` to ~/.config/openspec/config.json whatever the opt-outs (1.10.0 on), which OPENSPEC_NO_COMPLETIONS=1 stops. `openspec init` or `openspec update` run over installed workflow files writes that file too, and `openspec update` also checks registry.npmjs.org; the scaffold runs only where openspec/config.yaml is missing, and there it wrote nothing to HOME. Archive names its directory `YYYY-MM-DD-<slug>`, so the gate matches the slug suffix. `--yes`, `--skip-specs` and `skip_specs: true` are the tool's own escape hatches, which the human chooses: the printed archive carries none, and multivac gates on what landed on disk, not on how it got there.",
    source: 'https://github.com/Fission-AI/OpenSpec',
  },
  speckit: {
    kind: 'sdd',
    artifacts: ['.specify'],
    // Written by the init: 0.16.4's copy in this brain and 1.0.6's carry both
    // keys, and 1.0.6's `specify integration status` refuses without the file.
    state: {
      dir: '.specify',
      files: ['.specify/integration.json'],
      check: 'json',
      expect: { integration_state_schema: 1, installed_integrations: 'non-empty' },
    },
    shared: ['.specify/**'],
    // What spec-kit's own `.specify/.gitignore` already ignores.
    local: ['.specify/feature.json', '.specify/extensions/*/local-config.yml'],
    // MV-146, measured 2026-09-28 on spec-kit 1.0.11: `/speckit.specify`
    // persists `{"feature_directory":"specs/<n>-<name>"}` here, and the
    // vendor's scripts (common.sh) resolve the feature directory from it, so
    // with two changes open, `/speckit.plan` for one wrote into the other's.
    pointer: { path: '.specify/feature.json', key: 'feature_directory' },
    // Measured on 1.0.11: `specify integration uninstall <key>` removed that
    // integration's ten skills and left `.specify/` in place.
    leftover: 'delete .specify/ there; `specify integration uninstall <key>` removes its skills and leaves .specify/',
    ignore: [],
    env: {},
    binaries: ['specify'],
    required: ['specify'],
    installHint: 'uv tool install specify-cli',
    refresh: 'specify check',
    automation: 'sdd_auto',
    scaffold: {
      run: 'specify init --here --integration {key} --force --ignore-agent-tools',
      add: 'specify integration install {key}',
      // MV-130, measured 2026-09-16 on spec-kit 1.0.7 with `specify integration
      // list`: the key per harness and its "Multi-install Safe" column. In a
      // project holding claude, `specify integration install cursor-agent`
      // exited 0 and recorded both; `install opencode` refused, naming
      // `--force`, and changed nothing. agents.md has no spec-kit key: its
      // `generic` integration exits 1 without a `--commands-dir` no harness
      // here is known to read, so a brain with no harness door keeps claude.
      // MV-144, measured 2026-09-25 on spec-kit 1.0.11, one fresh git repo per
      // integration with HOME isolated: each wrote `.specify/**` plus the
      // directories below.
      integrations: {
        claude: { key: 'claude', safe: true, dirs: ['.claude'] },
        cursor: { key: 'cursor-agent', safe: true, dirs: ['.cursor'] },
        codex: { key: 'codex', safe: true, dirs: ['.agents'] },
        gemini: { key: 'gemini', safe: true, dirs: ['.gemini'] },
        opencode: { key: 'opencode', safe: false, dirs: ['.opencode'] },
        copilot: { key: 'copilot', safe: false, dirs: ['.github/skills'] },
      },
      fallback: 'claude',
      // MV-146, measured 2026-09-28 on spec-kit 1.0.11 with HOME isolated: its
      // resolvers read overrides/ before the core templates, a fresh init
      // creates no overrides/, and a second `specify init --here … --force`
      // leaves the directory byte-identical. 0.9.4's common.sh and 0.16.1's
      // resolve overrides/ first too, and both record `version` in
      // integration.json, which the floor is read from; 0.9.1 is not
      // installable from the index, so the floor is the lowest version run.
      skeleton: {
        dir: '.specify/templates/overrides',
        files: {
          'spec-template.md': SPEC_SKELETON,
          'plan-template.md': PLAN_SKELETON,
          'tasks-template.md': TASKS_SKELETON,
        },
        keeps: {
          'spec-template.md': [
            'User Scenarios & Testing *(mandatory)*', 'Requirements *(mandatory)*',
            'Success Criteria *(mandatory)*', 'Assumptions',
          ],
          'plan-template.md': ['Summary', 'Technical Context', 'Constitution Check', 'Project Structure', 'Complexity Tracking'],
          // The core set minus Notes, Path Conventions and the repeated sample phases.
          'tasks-template.md': [
            'Format: `[ID] [P?] [Story] Description`', 'Phase 1: Setup (Shared Infrastructure)',
            'Phase 2: Foundational (Blocking Prerequisites)', 'Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP',
            'Phase N: Polish & Cross-Cutting Concerns', 'Dependencies & Execution Order',
            'Parallel Example: User Story 1', 'Implementation Strategy',
          ],
        },
        measured: 'spec-kit 1.0.11', floor: '0.9.4',
        // What the init substitutes per integration (`__SPECKIT_COMMAND_<NAME>__`
        // becomes /speckit-plan on claude), and the spelling it becomes.
        tokens: ['__SPECKIT_COMMAND_', '/speckit'],
        // Measured on 1.0.11: `specify preset add` records `{ schema_version,
        // presets: { <id>: { enabled, priority, … } } }` in this file, and a
        // preset's own templates sit under its directory. `constitution-sync`
        // ships none: it propagates into the core templates the skeleton
        // shadows, so every override outranks it.
        presets: {
          registry: '.specify/presets/.registry',
          templates: '.specify/presets/<id>/templates',
          propagates: ['constitution-sync'],
        },
      },
      // Verified by running it in a scratch repo, not read off a README: it
      // writes `.specify/**` — scripts, templates, and memory/constitution.md
      // as the UNFILLED template — plus ten .claude/skills/speckit-*/SKILL.md.
      // It also rewrites .claude/settings.json (measured on 1.0.6): it drops
      // empty hook entries and re-serializes the rest with indent 2 and
      // non-ASCII escaped. A file multivac wrote stays byte-identical, one
      // formatted another way is rewritten, and one holding only
      // `{"hooks": {}}` is deleted.
      // `--here` initializes the current directory instead of creating a new
      // one, and `--force` lets it write into a directory that already has
      // files (every real repo). `--ignore-agent-tools` (MV-123): measured on
      // 1.0.6, without it and without `claude` on PATH the init exits 1 and
      // writes nothing, its cause boxed on stdout; with it the init exits 0.
      note: 'The selecting flag is `--integration`, not `--ai`; the integration name is what installs the harness\'s copy of the steps, and on Claude they land as hyphenated skills (/speckit-specify). Its templates ship inside the package (1.0.6 exits 0 with the network denied), but it writes them into the tree and on 1.0.6 a re-run reverts edited ones, so it runs from `init` and the change lifecycle, never from a report or a door. `--ignore-agent-tools` skips its check for the integration\'s own CLI: on 1.0.6, without the flag and without `claude` installed, the init exits 1 and writes nothing, so the flag is what lets a machine without that CLI scaffold at all. It writes the constitution as the unfilled template and nothing else claims to author it: the scaffold makes the steps runnable, the agent writes the document.',
    },
    projectSteps: [
      {
        run: 'run /speckit.constitution in your agent to write the project principles — spec-kit ships .specify/memory/constitution.md as an unfilled template, so an untouched repo has no constitution, only a placeholder',
        artifact: '.specify/memory/constitution.md',
        // Verified against a real `specify init` (1.0.7, 2026-09-16): the
        // installed file is the template, these 20 tokens and all, and
        // `.constitution-template.json` beside it records its sha256.
        // Existence alone would report a constitution nobody has written.
        placeholders: [
          '[PROJECT_NAME]', '[PRINCIPLE_1_NAME]', '[PRINCIPLE_1_DESCRIPTION]', '[PRINCIPLE_2_NAME]',
          '[PRINCIPLE_2_DESCRIPTION]', '[PRINCIPLE_3_NAME]', '[PRINCIPLE_3_DESCRIPTION]', '[PRINCIPLE_4_NAME]',
          '[PRINCIPLE_4_DESCRIPTION]', '[PRINCIPLE_5_NAME]', '[PRINCIPLE_5_DESCRIPTION]', '[SECTION_2_NAME]',
          '[SECTION_2_CONTENT]', '[SECTION_3_NAME]', '[SECTION_3_CONTENT]', '[GOVERNANCE_RULES]',
          '[GUIDANCE_FILE]', '[CONSTITUTION_VERSION]', '[RATIFICATION_DATE]', '[LAST_AMENDED_DATE]',
        ],
        templateRecord: '.specify/memory/.constitution-template.json',
        // MV-146, read from the vendor's own /speckit.constitution: through
        // 1.0.5 it said to produce the report and "prepend as an HTML comment
        // at top of the constitution file after update"; 1.0.6 through 1.0.12
        // call it "temporary scratch material for human review of the
        // amendment, not governance content; it is expected to be removed
        // before the amended constitution file is committed". Git keeps the
        // amendment record, and every committed report is read again by each
        // step that loads the constitution.
        revisit:
          'once at start, then on every principle change: amend it in place, bump CONSTITUTION_VERSION by semver (MAJOR removes/redefines, MINOR adds, PATCH clarifies); commit no Sync Impact Report. Spec-kit defines no cadence — `/speckit.plan`\'s Constitution Check and `/speckit.analyze` only surface drift, they never edit the file',
      },
    ],
    steps: [
      {
        at: 'new',
        run: 'run /speckit.specify in your agent to write the spec for <slug> — give it <slug> as the short name so the feature directory matches',
        artifact: 'specs/<n>-<slug>/spec.md',
        gate: 'plan',
      },
      {
        at: 'new',
        run: 'run /speckit.clarify if the spec still carries [NEEDS CLARIFICATION] markers',
        ungateable:
          'optional, and its `## Clarifications` session is written by the agent — an agent answering itself produces a byte-identical file, so the section proves text was added, never that a human answered',
      },
      {
        at: 'plan',
        run: 'run /speckit.plan in your agent to design <slug> (Constitution Check, research, data model, contracts)',
        artifact: 'specs/<n>-<slug>/plan.md',
        gate: 'apply',
        // setup-plan.sh writes the resolved template straight into plan.md
        // before /speckit.plan writes a byte, so existence proves the script
        // ran, not that anyone planned. The override path is spec-kit's own
        // documented precedence, so a project that customizes its template is
        // still checked against the file it actually copied.
        untouched: [
          '.specify/templates/plan-template.md',
          '.specify/templates/overrides/plan-template.md',
        ],
      },
      {
        at: 'plan',
        run: 'run /speckit.tasks in your agent to break <slug> into phased tasks',
        artifact: 'specs/<n>-<slug>/tasks.md',
        gate: 'apply',
      },
      {
        at: 'apply',
        run: 'run /speckit.analyze in your agent for the cross-artifact consistency pass before implementing',
        ungateable:
          '/speckit.analyze is STRICTLY READ-ONLY by its own spec — it writes zero bytes, so no file on disk can prove it ran',
      },
      {
        at: 'apply',
        run: 'run /speckit.implement in your agent to build <slug>',
        // Whether implement RAN is unprovable; whether its own task list still
        // has open boxes is a fact on disk. Same hole opsx's `--yes` opens,
        // reached the other way — implement simply stopping early.
        unfinished: {
          artifact: 'specs/<n>-<slug>/tasks.md',
          pattern: '^\\s*- \\[ \\]',
          why: 'spec-kit\'s own task list still has unchecked tasks — implement did not finish, or stopped without saying so',
          gate: 'close',
        },
        ungateable:
          'implement\'s only claim of completion is every task marked [X] in tasks.md — the agent grading its own homework, not evidence the code exists or works',
      },
      {
        at: 'apply',
        run: 'run /speckit.converge in your agent until it reports Converged',
        ungateable:
          'a clean converge is forbidden to touch tasks.md — the converged outcome is invisible to the filesystem, and its absence is indistinguishable from never having run it',
      },
      // No `close` step and no gate: spec-kit's flow ends at converge. It has
      // no archive equivalent, so `change close` says the gate does not exist
      // for this tool instead of inventing one.
    ],
    note: 'The agent flow is /speckit.constitution once, then per feature /speckit.specify → /speckit.clarify? → /speckit.plan → /speckit.tasks → /speckit.implement → /speckit.converge; spec-kit has no archive step. On Claude the CLI installs skills, so the separator is a hyphen (/speckit-specify) — the dotted ids are what the repo documents. The feature directory is `specs/<NNN>-<short-name>/`, numbered by spec-kit itself and independent of the git branch, so the gates match the slug as a suffix. Known hole: setup-plan.sh copies plan-template.md before the agent writes anything, so plan.md existing is weaker proof than the others.',
    source: 'https://github.com/github/spec-kit',
  },
};

export const sddNames: string[] = Object.keys(sdd);

export function sddSpec(name: string): AdapterSpec | undefined {
  return sdd[name];
}

/**
 * MV-123. The one line for a required binary that is not found: the binary,
 * the adapter, the install line, and whose tool it is — the entry's `source`.
 * Two packages can share a binary's name, and the install line alone cannot
 * say which is meant. Both places looked are named, because the lookup is not
 * PATH alone. Each call site keeps its own outcome around it.
 */
export function binaryMissing(name: string, spec: AdapterSpec, bins: string[], scope: string): string {
  const whose = spec.source ?? 'no vendor repository on record';
  return (
    `${bins.map((b) => `\`${b}\``).join(', ')} found on neither PATH nor ${scope}'s node_modules/.bin — ` +
    `install ${name}: ${spec.installHint} (${whose})`
  );
}
