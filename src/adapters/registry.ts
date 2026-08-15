// Tool-shipped adapter/target registry — data, not code. Adding a harness,
// an SDD tool, or a grapher is ADDING AN ENTRY here (an MR to multivac),
// never a new module. Project config only SELECTS entries by name.
//
// Every entry carries the vendor doc it was read from. An entry whose format
// cannot be verified from a primary source is `unsupported` with the reason —
// an honest gap beats an invented door.

export type DoorKind =
  /** AGENTS.md itself — the one file every other kind projects from. */
  | 'canonical'
  /** The harness reads AGENTS.md itself: nothing to project, nothing to write. */
  | 'native'
  /** A second name for the same bytes. */
  | 'symlink'
  /** A tool-owned file: optional frontmatter, then the managed block. */
  | 'stub'
  /** No repo-level door multivac can own. `reason` says what the harness does read. */
  | 'unsupported';

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
  /** Why `doors` refuses this target. Required for kind 'unsupported'. */
  reason?: string;
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
   * Why this step can never be proven from the filesystem. Required whenever
   * `artifact` is absent: an ungateable step is STATED, never faked green.
   */
  ungateable?: string;
  /**
   * The tool's OWN validator for this artifact, `<slug>` interpolated. Run for
   * its verdict only — never to fake an agent-run step — and only when its
   * binary is present. Reusing the tool's verdict beats reimplementing rules
   * that would drift away from it.
   */
  validate?: string;
}

/**
 * A project-level document: written once, then AMENDED as the product moves.
 * Not per-change — `doctor` reports it, `init`/`doors` tell the agent to
 * create it if absent, and nothing ever gates on it: a constitution's content
 * cannot be machine-judged.
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
   */
  placeholder?: string;
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
  /** What the tool's own docs say, where it matters. */
  note?: string;
  /** Vendor doc this entry was verified against. */
  source?: string;
}

/**
 * Known harness targets. `agents` is the canonical door; the rest project or
 * declare they need no projection. Four of the eight harnesses read AGENTS.md
 * natively — for those the canonical door IS the integration.
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
  aider: {
    door: '.aider.conf.yml',
    kind: 'unsupported',
    note: 'aider auto-loads no conventions file. AGENTS.md reaches it only per run, `aider --read AGENTS.md` or `/read AGENTS.md`, or as a `read:` entry in .aider.conf.yml — a config file that also carries model and API settings.',
    reason:
      'aider has no door file multivac can own — run `aider --read AGENTS.md`, or add `read: [AGENTS.md]` to your own .aider.conf.yml, and drop aider from doors:',
    source: 'https://aider.chat/docs/usage/conventions.html',
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
        artifact: 'specs/*<slug>*/spec.md',
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
        artifact: 'specs/*<slug>*/plan.md',
        gate: 'apply',
      },
      {
        at: 'plan',
        run: 'run /speckit.tasks in your agent to break <slug> into phased tasks',
        artifact: 'specs/*<slug>*/tasks.md',
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
 * Graphers that do not fit the generic contract below. Everything omitted is
 * derived from the name, so an unknown grapher still works — these entries
 * exist only where the tool's own docs say otherwise.
 */
const knownGraphers: Record<string, Partial<AdapterSpec>> = {
  graphify: {
    note: 'Matches the generic contract exactly: graphify-out/graph.json, `graphify update .`.',
  },
  codegraph: {
    artifacts: ['.codegraph'],
    installHint: 'npm i -g @colbymchenry/codegraph',
    refresh: 'codegraph sync',
    create: 'codegraph init',
    note: 'Indexes into .codegraph/, not <name>-out/; `codegraph init` builds it, `codegraph sync` refreshes it.',
    source: 'https://github.com/colbymchenry/codegraph',
  },
};

/**
 * Graphers follow one generic contract: artifact at `<name>-out/graph.json`,
 * binary named `<name>`, refreshed with `<name> update .` — overridden per
 * tool by `knownGraphers` where the vendor's docs disagree.
 */
export function grapherSpec(name: string): AdapterSpec {
  return {
    kind: 'grapher',
    artifacts: [`${name}-out/graph.json`],
    binaries: [name],
    installHint: `npm i -g ${name}`,
    refresh: `${name} update .`,
    automation: 'grapher-refresh',
    ...knownGraphers[name],
  };
}
