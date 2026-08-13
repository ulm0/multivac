// Tool-shipped adapter/target registry — data, not code. Adding a harness,
// an SDD tool, or a grapher is ADDING AN ENTRY here (an MR to multivac),
// never a new module. Project config only SELECTS entries by name.

export type DoorKind = 'canonical' | 'symlink' | 'stub-with-frontmatter';

/** One harness target: what `doors` writes for it. */
export interface DoorTarget {
  /** Door file, repo-relative. */
  door: string;
  /** How the canonical AGENTS.md projects into `door`. */
  kind: DoorKind;
  /** Frontmatter for stub-with-frontmatter targets. */
  frontmatter?: string;
  /** Where the multivac skill installs for this harness, if it has skills. */
  skill?: string;
  /** Harness hook config: file plus the shape of the entry written there. */
  hookConfig?: { path: string; shape: string };
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
  /**
   * Automation contract: sdd_auto — workflow runs inside the change lifecycle
   * unless sdd_auto: false / --no-sdd; grapher-refresh — artifact refreshed
   * after any edit via the hook path, stale graph + present binary = doctor
   * warning.
   */
  automation: 'sdd_auto' | 'grapher-refresh';
}

/** Known harness targets. `agents` is the canonical door; the rest project. */
export const doorTargets: Record<string, DoorTarget> = {
  agents: {
    door: 'AGENTS.md',
    kind: 'canonical',
  },
  claude: {
    door: 'CLAUDE.md',
    kind: 'symlink',
    skill: '.claude/skills/multivac/SKILL.md',
    hookConfig: {
      path: '.claude/settings.json',
      shape: 'hooks.SessionStart -> multivac verify',
    },
  },
  cursor: {
    door: '.cursor/rules/multivac.mdc',
    kind: 'stub-with-frontmatter',
    frontmatter: '---\ndescription: multivac door — ecosystem law, brain location\nalwaysApply: true\n---',
  },
};

const sdd: Record<string, AdapterSpec> = {
  opsx: {
    kind: 'sdd',
    artifacts: ['openspec/specs', 'openspec/changes'],
    binaries: ['openspec'],
    installHint: 'npm i -g @openspec/cli',
    refresh: 'openspec archive',
    automation: 'sdd_auto',
  },
  speckit: {
    kind: 'sdd',
    artifacts: ['.specify'],
    binaries: ['specify'],
    installHint: 'uv tool install specify-cli',
    refresh: 'specify check',
    automation: 'sdd_auto',
  },
};

export const sddNames: string[] = Object.keys(sdd);

export function sddSpec(name: string): AdapterSpec | undefined {
  return sdd[name];
}

/**
 * Graphers follow one generic contract: artifact at `<name>-out/graph.json`,
 * binary named `<name>`, refreshed with `<name> update .`.
 */
export function grapherSpec(name: string): AdapterSpec {
  return {
    kind: 'grapher',
    artifacts: [`${name}-out/graph.json`],
    binaries: [name],
    installHint: `npm i -g ${name}`,
    refresh: `${name} update .`,
    automation: 'grapher-refresh',
  };
}
