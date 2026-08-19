import type { GrapherDecl } from '../types.js';

// Tool-shipped adapter/target registry — data, not code. Adding a harness,
// an SDD tool, or a grapher is ADDING AN ENTRY here (an MR to multivac),
// never a new module. Project config only SELECTS entries by name.
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
   * matcher naming its file-editing tools. A target declaring `postEdit` is
   * where the grapher refresh is installed; a harness without one refreshes
   * at `change close` only.
   */
  hookConfig?: { path: string; shape: string; postEdit?: string };
  /** Path whose presence makes `init` propose this target. */
  detect?: string;
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
   * archives anyway — and gating on the artifact alone accepts that silently.
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
   * ERE matching a placeholder that only the SHIPPED TEMPLATE still carries.
   * Some tools scaffold the file unfilled, so its mere existence proves
   * nothing — spec-kit installs `constitution.md` byte-identical to the
   * template. A document still matching this has not been written yet.
   *
   * This is the pin MV-65 rejected for a per-step artifact, and it is the
   * right one here for the reason MV-65 gives: it rejected the pin because
   * `# Implementation Plan: [FEATURE]` is a line spec-kit never asks anyone to
   * change, so a finished plan keeps it. These tokens are the opposite —
   * `/speckit.constitution` explicitly instructs the author to replace
   * `[PROJECT_NAME]` and every `[PRINCIPLE_N_*]` — so a written document
   * carries none of them. Unlike whole-file equality it needs no template on
   * disk, so it cannot fail open when the template is gone.
   */
  placeholder?: string;
}

/**
 * The tool's OWN init, and the artifact that says it has already run here.
 *
 * The one command in this file multivac runs ITSELF. Every `SddStep` is a chat
 * command an agent runs and the lifecycle only prints (MV-51); a scaffold is a
 * terminal command with a vendor behind it, so it lives in its own field rather
 * than as a step nothing could tell apart at the point steps are printed.
 *
 * It exists because declaring an SDD in a repo where it has never run was a
 * deadlock: `plan` refuses without an artifact, the artifact comes from a chat
 * command, and the chat command does not exist until the tool's own init has
 * run — the change that would install it being the change its own gate refused.
 *
 * Both fields are STATED, never derived: not from the adapter's name, and not
 * from `artifacts[0]` even where the two coincide, because a default is how one
 * tool's layout silently becomes the answer for a tool whose init writes
 * somewhere else. An init nobody has run gets no entry at all (MV-59's rule),
 * and the lifecycle says so instead of guessing a command to run on someone
 * else's machine.
 */
export interface SddScaffold {
  /** Repo-relative path whose absence means "this tool has never run here". */
  artifact: string;
  /** The vendor's own init command, verbatim. Runs in the brain, not per-slug. */
  run: string;
  /** What running it actually wrote, and how that was established. */
  note: string;
}

/**
 * One question a grapher can answer about the code, once the graph exists.
 *
 * This is the half of a grapher multivac used to ignore. Build and refresh
 * keep an artifact current; `queries` is what makes the artifact worth
 * keeping — the agent asks the graph instead of grepping the tree. The verbs
 * are NOT interchangeable between tools and must never be paraphrased into a
 * common one: `graphify query` takes a question in words and walks outward
 * from the nodes matching it, while `codegraph query` is a symbol lookup by
 * name. A door telling an agent to "query the graph" without naming the tool
 * would be wrong for at least one of them.
 *
 * A tool with no query verb carries no `queries`, and the door says so. That
 * is a real state — an artifact nothing reads back — not a gap to paper over.
 */
export interface GrapherQuery {
  /** Exactly what the agent types. Placeholders are the agent's to fill. */
  run: string;
  /** What it answers, one line, printed in the door under `run`. */
  answers: string;
}

/** One sdd/grapher adapter: what to detect and what automation it carries. */
export interface AdapterSpec {
  kind: 'sdd' | 'grapher';
  /** Repo-relative paths; any present => artifact (read capability) present. */
  artifacts: string[];
  /** Binary names probed on PATH; any present => run capability present. */
  binaries: string[];
  /** Exact hint printed when the binary is missing. */
  installHint: string;
  /** Command that refreshes the artifact. */
  refresh: string;
  /** Command that builds the artifact the first time, when it differs. */
  create?: string;
  /**
   * Automation contract: sdd_auto — the change lifecycle prints the tool's
   * agent instruction at each step unless sdd_auto: false / --no-sdd;
   * grapher-refresh — the refresh follows the AGENT, not the commit: `doors`
   * installs it as a post-edit hook in every declared harness whose registry
   * entry has `hookConfig.postEdit`, when the grapher's binary is present
   * (fire-and-forget, coalesced, never failing the edit); `change close` runs
   * it in each touched scope as the safety net for edits made outside a
   * harness. Git hooks never refresh — they run `verify` only. Nothing is
   * ever committed; stale graph + present binary = doctor warning.
   */
  automation: 'sdd_auto' | 'grapher-refresh';
  /**
   * SDD only: the tool's OWN per-change flow, in order, verified against its
   * own docs. These are chat commands, not terminal subcommands — the
   * lifecycle prints them and gates on what they leave behind, it never shells
   * them out. A lifecycle point no step declares is a point this tool has no
   * equivalent for; the lifecycle says so honestly instead of inventing one.
   */
  steps?: SddStep[];
  /**
   * SDD only: project-level documents — the law of the project, written once
   * and amended as it moves. Empty/absent for a tool that has none; that gap
   * is stated, never papered over with an invented file.
   */
  projectSteps?: SddProjectStep[];
  /**
   * SDD only: the tool's own init, run by the LIFECYCLE when its artifact is
   * missing — never by `verify`, `doctor` or `doors`, which MV-01 keeps
   * offline. Optional because an init nobody verified by running it is a gap
   * this registry states rather than fills.
   */
  scaffold?: SddScaffold;
  /**
   * Grapher only: the tool's own query surface, in its own verbs. Absent ⇒ the
   * tool has none, and the door says that rather than inventing one.
   */
  queries?: GrapherQuery[];
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
        'hooks.SessionStart + hooks.PostToolUse -> mvac verify; hooks.PostToolUse -> the grapher refresh, when one is declared and installed',
      postEdit: 'Edit|Write|MultiEdit',
    },
    detect: 'CLAUDE.md',
  },
  cursor: {
    door: '.cursor/rules/multivac.mdc',
    kind: 'stub',
    note: 'Cursor reads AGENTS.md at the project root, so this target is optional. Take it when you want the door pinned into every chat: only .mdc files under .cursor/rules carry the frontmatter that sets alwaysApply.',
    source: 'https://cursor.com/docs/context/rules',
    frontmatter:
      '---\ndescription: multivac door — ecosystem law, brain location\nalwaysApply: true\n---',
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
    binaries: ['openspec'],
    installHint: 'npm i -g @fission-ai/openspec',
    refresh: 'openspec update',
    automation: 'sdd_auto',
    // NO `scaffold`. `openspec init` is in the CLI list the note below records,
    // but what it writes — and which flags a non-interactive run needs — was
    // never verified by running it, and MV-59 forbids a contract nobody read
    // from a primary source. A declared-but-absent opsx therefore gets the
    // stated gap and the install line; a guessed init command would run on
    // someone else's repo, which is the one place a guess costs more than a
    // wrong printout. Three verified lines close this whenever someone runs it.
    // OpenSpec has NO project-level document. `openspec/config.yaml`'s
    // `context:` is the nearest thing and it ships commented out, unvalidated
    // and never required — declaring it as a constitution would be a lie.
    projectSteps: [],
    steps: [
      {
        at: 'new',
        run: 'run /opsx:propose <slug> in your agent — it loops openspec\'s own artifact DAG (proposal → spec deltas → design → tasks)',
        artifact: 'openspec/changes/<slug>/proposal.md',
        gate: 'plan',
      },
      {
        at: 'plan',
        run: 'keep /opsx:propose <slug> going until its task list is written — openspec\'s own applyRequires is ["tasks"]',
        artifact: 'openspec/changes/<slug>/tasks.md',
        gate: 'apply',
        // OpenSpec's own definition of a well-formed change: delta headers,
        // one scenario per requirement, no conflict with the main specs.
        // Reimplementing it here would guarantee drift.
        validate: 'openspec validate <slug> --json --no-interactive',
      },
      {
        at: 'apply',
        run: 'run /opsx:apply <slug> in your agent to implement the tasks',
        ungateable:
          'apply leaves no artifact of its own — its only trace is `- [x]` in tasks.md, a character the agent types about its own work; nothing links a checkbox to a commit, a test, or a line of code',
      },
      {
        at: 'land',
        run: 'run /opsx:archive <slug> in your agent to merge the spec deltas into openspec/specs/ and archive the change',
        artifact: 'openspec/changes/archive/*-<slug>',
        gate: 'close',
        // `openspec archive --yes` prints `Warning: N incomplete task(s)
        // found. Continuing due to --yes flag.` and archives regardless. The
        // archived directory therefore proves the archive ran and nothing
        // else, so close reads the task list openspec itself just moved.
        unfinished: {
          artifact: 'openspec/changes/archive/*-<slug>/tasks.md',
          pattern: '^\\s*- \\[ \\]',
          why: 'openspec archived this change with tasks still unchecked — `--yes` continues over its own warning',
          gate: 'close',
        },
      },
    ],
    note: 'The terminal CLI is init/update/list/show/validate; propose, apply and archive are the /opsx: commands your agent runs in chat. Archive names its directory `YYYY-MM-DD-<slug>`, so the gate matches the slug suffix. `--yes`, `--skip-specs` and `skip_specs: true` are the tool\'s own escape hatches — multivac gates on what landed on disk, not on how it got there.',
    source: 'https://github.com/Fission-AI/OpenSpec',
  },
  speckit: {
    kind: 'sdd',
    artifacts: ['.specify'],
    binaries: ['specify'],
    installHint: 'uv tool install specify-cli',
    refresh: 'specify check',
    automation: 'sdd_auto',
    scaffold: {
      artifact: '.specify',
      run: 'specify init --here --integration claude --force',
      // Verified by running it in a scratch repo, not read off a README: it
      // writes `.specify/**` — scripts, templates, and memory/constitution.md
      // as the UNFILLED template — plus ten .claude/skills/speckit-*/SKILL.md,
      // and it leaves .claude/settings.json alone. `--here` initializes the
      // current directory instead of creating a new one, and `--force` lets it
      // write into a directory that already has files (every real repo).
      note: 'The selecting flag is `--integration`, not `--ai`; the integration name is what installs the harness\'s copy of the steps, and on Claude they land as hyphenated skills (/speckit-specify). It downloads its templates, so only the change lifecycle runs it. It writes the constitution as the unfilled template and nothing else claims to author it: the scaffold makes the steps runnable, the agent writes the document.',
    },
    projectSteps: [
      {
        run: 'run /speckit.constitution in your agent to write the project principles — spec-kit ships .specify/memory/constitution.md as an unfilled template, so an untouched repo has no constitution, only a placeholder',
        artifact: '.specify/memory/constitution.md',
        // Verified against a real `specify init`: the installed file is the
        // template, `[PROJECT_NAME]`/`[PRINCIPLE_1_NAME]` and all. Existence
        // alone would report a constitution nobody has written.
        placeholder: '\\[[A-Z0-9_]+\\]',
        revisit:
          'once at start, then on every principle change: amend it in place, bump CONSTITUTION_VERSION by semver (MAJOR removes/redefines, MINOR adds, PATCH clarifies) and prepend the Sync Impact Report. Spec-kit defines no cadence — `/speckit.plan`\'s Constitution Check and `/speckit.analyze` only surface drift, they never edit the file',
      },
    ],
    steps: [
      {
        at: 'new',
        run: 'run /speckit.specify in your agent to write the spec for <slug> — give it <slug> as the short name so the feature directory matches',
        artifact: 'specs/*-<slug>/spec.md',
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
        artifact: 'specs/*-<slug>/plan.md',
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
        artifact: 'specs/*-<slug>/tasks.md',
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
          artifact: 'specs/*-<slug>/tasks.md',
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

/** A verified grapher entry: every field stated, nothing derived. */
type GrapherEntry = Omit<AdapterSpec, 'kind' | 'automation' | 'steps' | 'projectSteps'>;

/**
 * The graphers multivac SPEAKS: two, each field read from a primary source and
 * each verb run against the shipped binary before it was written down.
 *
 * Two on purpose. The table once held six, and the extra four were verified
 * but not USED: nobody had run them in anger, so their entries described a
 * build and a refresh and stopped there — which is precisely the half of a
 * grapher that does not matter. Supporting a tool means knowing what it can
 * ANSWER (see `queries`), and that knowledge is earned per tool, not scaled by
 * adding rows. A short table nobody has to distrust beats a long one where the
 * reader cannot tell which entries were exercised. Everything dropped stays
 * reachable through `graphers:` in config, with no MR against multivac.
 *
 * There is no generic contract to fall back on, and the reason is measured:
 * `<name>-out/graph.json` + `<name> update .` + `npm i -g <name>` was derived
 * from graphify and, across ~47 surveyed tools (internal landscape study),
 * matched exactly one of them — and even for graphify the derived npm line was
 * wrong, since it installs from PyPI. Every other viable grapher overrides the
 * artifact and the refresh, usually the binary too (`depcruise` is not
 * `dependency-cruiser`), and half of them have no `update` verb at all because
 * build and refresh are the same idempotent command.
 *
 * What actually held across every tool that fits is narrower: a path in the
 * repo, file OR directory; ONE terminal command safe to re-run; no model and
 * no network inside it. A tool absent from this table is UNVERIFIED — see
 * `grapherSpec`. A field the vendor does not document says UNVERIFIED in its
 * own text rather than carrying a guess that reads like a fact.
 */
const knownGraphers: Record<string, GrapherEntry> = {
  graphify: {
    artifacts: ['graphify-out/graph.json'],
    binaries: ['graphify'],
    // NOT `npm i -g graphify`: the shipped binary is a Python console script
    // (`~/.local/bin/graphify` shebangs into the `graphifyy` uv tool). The
    // derived npm line pointed at an unrelated registry entirely.
    installHint: 'uv tool install graphifyy',
    refresh: 'graphify update .',
    // No separate create: `graphify extract` is the full AST+LLM build, which
    // a close hook must not run. `update .` builds and refreshes, AST-only.
    // `query` is REAL and absent from `graphify --help`, which lists only
    // install/uninstall/path/explain/diagnose/clone/merge-driver. It was run
    // against the shipped 0.9.29 binary and returns a BFS subgraph; taking the
    // help output as the whole surface would have dropped the one verb that
    // matters most.
    queries: [
      {
        run: 'graphify query "<question>"',
        answers:
          'a question in plain words — returns the subgraph that answers it, walked outward from the best-matching nodes',
      },
      {
        run: 'graphify explain "<node>"',
        answers: 'one node and its neighbours, described in prose',
      },
      {
        run: 'graphify path "<A>" "<B>"',
        answers: 'the shortest path between two nodes — how A actually reaches B',
      },
    ],
    note: 'Python tool, published as `graphifyy`. Writes graphify-out/graph.json; `graphify update .` is AST-only (no model, no network), which is what makes it safe in a close hook — `graphify extract` is the LLM path and is deliberately not wired here. Its query surface is question-shaped, and `query` is undocumented in the tool\'s own --help.',
    source: 'https://github.com/Graphify-Labs/graphify',
  },
  codegraph: {
    artifacts: ['.codegraph'],
    binaries: ['codegraph'],
    installHint: 'npm i -g @colbymchenry/codegraph',
    // `sync` is incremental (changes since the last index); `index` is the full
    // rebuild. The hook wants the cheap one — it fires on every edit.
    refresh: 'codegraph sync',
    create: 'codegraph init',
    // Symbol lookup, NOT a question. Handing this a sentence returns nothing
    // useful, which is exactly why the door names the tool's own verb instead
    // of telling the agent to "query the graph".
    queries: [
      {
        run: 'codegraph query <symbol>',
        answers:
          'symbol search by name — `--kind function|class` narrows it, `--limit N` bounds it, `--json` makes it machine-readable',
      },
    ],
    note: 'SQLite index under .codegraph/, not <name>-out/; `codegraph init` builds it and `codegraph sync` refreshes only what changed. TELEMETRY IS ON BY DEFAULT — anonymous usage stats (commands run, languages, file counts, platform), and the vendor documents that source code, file paths, repository URLs and symbol names are never collected. It is still network traffic on a refresh multivac fires after every edit, so `codegraph telemetry off` (or DO_NOT_TRACK=1, which it honors) is what makes the contract above literally true. It also ships `codegraph install`, which registers an MCP server — a second, richer surface than the CLI for harnesses that speak MCP.',
    source: 'https://github.com/colbymchenry/codegraph',
  },
};

/** The graphers multivac can speak for. Printed when a name is not one. */
export const grapherNames: string[] = Object.keys(knownGraphers);

/**
 * The spec for a declared grapher, or **null when the name is unverified**.
 *
 * Null is the whole point. Deriving a contract from a name is multivac's one
 * unforgivable error — inventing a path and printing it like a fact — and it
 * was in here, applied to multivac's own registry. A caller that gets null
 * prints `unverifiedGrapher(name)` and does nothing else: no probe of an
 * invented artifact, no refresh of an invented command.
 *
 * `decls` is the config's own `graphers:` map and wins over the table: the
 * operator knows their install, and their declaration is a statement, not a
 * guess.
 */
export function grapherSpec(
  name: string,
  decls: Record<string, GrapherDecl> = {},
): AdapterSpec | null {
  const known = knownGraphers[name];
  const decl = decls[name];
  if (!known && !decl) return null;
  const base: GrapherEntry = known ?? {
    artifacts: [decl!.artifact],
    binaries: [decl!.binary ?? decl!.refresh.split(' ')[0]],
    installHint:
      decl!.install ??
      `UNVERIFIED — no install line declared; add graphers.${name}.install to .multivac/config.yml`,
    refresh: decl!.refresh,
    create: decl!.create,
    note: `declared in .multivac/config.yml (graphers.${name}) — multivac did not verify this contract, the operator stated it`,
  };
  return { kind: 'grapher', automation: 'grapher-refresh', ...base };
}

/**
 * What to print when `grapherSpec` returns null: the exact fields to declare,
 * in the exact place they go. Refusing to guess is only honest if the refusal
 * is actionable.
 */
export function unverifiedGrapher(name: string): string {
  return (
    `grapher "${name}" is not verified — multivac will not guess its artifact path or its refresh command. ` +
    `Verified: ${grapherNames.join(', ')}. Declare yours in .multivac/config.yml:\n` +
    `  graphers:\n` +
    `    ${name}:\n` +
    `      artifact: <repo-relative file or directory the tool writes>\n` +
    `      refresh: <the one command safe to re-run>\n` +
    `      create: <build command, if it differs from refresh>   # optional\n` +
    `      binary: <binary on PATH, if not the first word of refresh>   # optional\n` +
    `      install: <install line to print when the binary is missing>   # optional\n` +
    `  — or open an MR adding it to knownGraphers in src/adapters/registry.ts`
  );
}
