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
  /** Harness hook config: file plus the shape of the entry written there. */
  hookConfig?: { path: string; shape: string };
  /** Why `doors` refuses this target. Required for kind 'unsupported'. */
  reason?: string;
  /** Path whose presence makes `init` propose this target. */
  detect?: string;
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
   * Automation contract: sdd_auto — workflow runs inside the change lifecycle
   * unless sdd_auto: false / --no-sdd; grapher-refresh — `change close` runs
   * the refresh in each touched scope (never committing the artifact), stale
   * graph + present binary = doctor warning.
   */
  automation: 'sdd_auto' | 'grapher-refresh';
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
      shape: 'hooks.SessionStart -> multivac verify',
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
    note: 'The terminal CLI is init/update/list/show/validate; propose, apply and archive are the /opsx: commands your agent runs in chat.',
    source: 'https://github.com/Fission-AI/OpenSpec',
  },
  speckit: {
    kind: 'sdd',
    artifacts: ['.specify'],
    binaries: ['specify'],
    installHint: 'uv tool install specify-cli',
    refresh: 'specify check',
    automation: 'sdd_auto',
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
