// Deterministic boundary classification over `git ls-files` output.
// No LLM, no interpretation — the agent reads the report and drafts claims.
//
// Categories are DATA: picomatch pattern lists, first match wins. Adding a
// category is adding an entry here, never new code. Patterns match the whole
// repo-relative path, case-insensitively; `**/x` means anywhere including the
// root, a bare `x` or `x/**` is root-relative on purpose (a root `config/` is
// runtime configuration; a `src/**/config/` is usually implementation).

import picomatch from 'picomatch';

const OPTS = { dot: true, nocase: true } as const;

/**
 * Noise dropped before classification (measurement 2 §3): test fixtures
 * flood the manifest count (415 of astro's 543 package.json), examples/ is
 * scaffolding, vendored trees are someone else's architecture, and Django's
 * `migrations/__init__.py` is packaging, not history.
 */
export const EXCLUDES: string[] = [
  '**/fixtures/**',
  '**/__fixtures__/**',
  '**/examples/**',
  '**/vendor/**',
  '**/third_party/**',
  '**/node_modules/**',
  '**/migrations/__init__.py',
];

export interface Category {
  name: string;
  patterns: string[];
}

/** Order matters: first match wins (migrations/*.sql lands in migrations, not sql). */
export const CATEGORIES: Category[] = [
  {
    // The project's law already written in machine form — the highest-density
    // rule source in measurement 2: each file is a pattern with a rationale.
    name: 'policy gates',
    patterns: [
      '.pre-commit-config.yaml',
      '**/.semgrep*',
      '.semgrep/**',
      'semgrep/**',
      '**/.eslintrc*',
      'eslint.config.*',
      '**/biome.json*',
      '**/ruff.toml',
      '**/.ruff.toml',
      '**/.flake8',
      '**/mypy.ini',
      '**/CODEOWNERS',
      '.husky/**',
      'lefthook.yml',
      'knip.*',
    ],
  },
  {
    // Workspace membership, task graph, cache contract, release policy.
    name: 'workspace / build graph',
    patterns: [
      'pnpm-workspace.yaml',
      'turbo.json',
      'nx.json',
      'lerna.json',
      'rush.json',
      'go.work',
      '**/settings.gradle',
      '**/settings.gradle.kts',
      '**/*.sln',
      '**/*.csproj',
      '.changeset/config.json',
    ],
  },
  {
    name: 'deploy manifests',
    patterns: [
      'kubernetes-manifests/**',
      '**/k8s/**',
      '**/helm-chart/**',
      '**/Chart.yaml',
      '**/values.yaml',
      '**/kustomization.yaml',
      '**/istio-manifests/**',
      '**/skaffold.yaml',
      '**/cloudbuild*.yaml',
      'deployment/**',
      '**/Dockerrun.aws.json',
    ],
  },
  {
    // Written intent: ADRs, agent docs, contribution law. Prior art, not
    // competition — when these exist the report says so and the open
    // questions ask which of their rules are law.
    name: 'decisions / intent',
    patterns: [
      'docs/adr/**',
      'docs/decisions/**',
      'docs/rfcs/**',
      'rfcs/**',
      '**/AGENTS.md',
      '**/CLAUDE.md',
      'CONTRIBUTING.md',
      'GOVERNANCE.md',
      '**/*architecture*.md',
      '**/*requirement*.md',
      '**/*purpose*.md',
      '**/*design*.md',
      'docs/*.md',
    ],
  },
  { name: 'migrations', patterns: ['**/migrations/**'] },
  {
    name: 'models / schema',
    patterns: [
      '**/models.py',
      '**/models/*.py',
      '**/schema.prisma',
      '**/entities/**',
    ],
  },
  { name: 'sql', patterns: ['**/*.sql'] },
  { name: 'api specs', patterns: ['**/openapi*', '**/swagger*'] },
  { name: 'protobuf', patterns: ['**/*.proto'] },
  { name: 'graphql', patterns: ['**/*.graphql'] },
  {
    name: 'docker',
    patterns: ['**/docker-compose*', '**/compose.{yml,yaml}', '**/Dockerfile*'],
  },
  { name: 'terraform', patterns: ['**/*.tf'] },
  { name: 'env examples', patterns: ['**/.env.example'] },
  {
    name: 'ci',
    patterns: [
      '.gitlab-ci.yml',
      '.travis.yml',
      'azure-pipelines.yml',
      '**/Jenkinsfile',
      '.github/workflows/**',
      '.circleci/**',
    ],
  },
  {
    name: 'package manifests',
    patterns: [
      '**/package.json',
      '**/go.mod',
      '**/Cargo.toml', // a Cargo workspace declares itself in the root manifest
      '**/pyproject.toml',
      '**/setup.py',
      '**/requirements.txt',
      '**/pom.xml',
      '**/build.gradle',
      '**/build.gradle.kts',
      '**/composer.json',
      '**/Gemfile',
      '**/mix.exs',
    ],
  },
  { name: 'routes', patterns: ['**/routes/**', '**/routes.{rb,ts,js,py}'] },
  {
    // Catch-alls last: root config/ only — deeper config/ dirs are usually
    // the implementation of somebody's config feature, not the project's.
    name: 'runtime config',
    patterns: [
      '**/settings.py',
      '**/settings/*.py',
      'config/**',
      '**/app.yaml',
      '**/Procfile',
      '**/*.config.{js,ts,mjs,cjs}',
      '**/application*.{yml,yaml,properties}',
      '**/conftest.py',
      '**/*.toml',
    ],
  },
];

const excluded = picomatch(EXCLUDES, OPTS);
const matchers = CATEGORIES.map((c) => ({
  name: c.name,
  match: picomatch(c.patterns, OPTS),
}));

/**
 * Bucket files by first matching category. Buckets come back in CATEGORIES
 * order, files in input (ls-files) order; excluded and unmatched files are
 * dropped.
 */
export function classify(files: string[]): Map<string, string[]> {
  const buckets = new Map<string, string[]>(CATEGORIES.map((c) => [c.name, []]));
  for (const f of files) {
    if (excluded(f)) continue;
    const cat = matchers.find((c) => c.match(f));
    if (cat) buckets.get(cat.name)!.push(f);
  }
  for (const [name, list] of [...buckets]) {
    if (list.length === 0) buckets.delete(name);
  }
  return buckets;
}
