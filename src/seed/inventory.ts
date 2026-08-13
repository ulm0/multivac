// Deterministic boundary classification over `git ls-files` output.
// No LLM, no interpretation — the agent reads the report and drafts claims.

const MANIFESTS = new Set([
  'package.json',
  'go.mod',
  'Cargo.toml',
  'pyproject.toml',
  'setup.py',
  'requirements.txt',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'composer.json',
  'Gemfile',
  'mix.exs',
]);

const base = (p: string): string => p.slice(p.lastIndexOf('/') + 1);
const hasSeg = (p: string, seg: string): boolean => `/${p}`.includes(`/${seg}/`);

export interface Category {
  name: string;
  test(path: string): boolean;
}

/** Order matters: first match wins (migrations/*.sql lands in migrations, not sql). */
export const CATEGORIES: Category[] = [
  { name: 'migrations', test: (p) => hasSeg(p, 'migrations') },
  { name: 'sql', test: (p) => p.endsWith('.sql') },
  { name: 'api specs', test: (p) => /^(openapi|swagger)/i.test(base(p)) },
  { name: 'protobuf', test: (p) => p.endsWith('.proto') },
  { name: 'graphql', test: (p) => p.endsWith('.graphql') },
  {
    name: 'docker',
    test: (p) => base(p).startsWith('docker-compose') || base(p).startsWith('Dockerfile'),
  },
  { name: 'terraform', test: (p) => p.endsWith('.tf') },
  { name: 'env examples', test: (p) => base(p) === '.env.example' },
  {
    name: 'ci',
    test: (p) =>
      p === '.gitlab-ci.yml' ||
      p === '.travis.yml' ||
      p === 'azure-pipelines.yml' ||
      p === 'Jenkinsfile' ||
      p.startsWith('.github/workflows/') ||
      p.startsWith('.circleci/'),
  },
  { name: 'manifests', test: (p) => MANIFESTS.has(base(p)) },
  { name: 'routes/config', test: (p) => hasSeg(p, 'routes') || hasSeg(p, 'config') },
];

/**
 * Bucket files by first matching category. Buckets come back in CATEGORIES
 * order, files in input (ls-files) order; unmatched files are dropped.
 */
export function classify(files: string[]): Map<string, string[]> {
  const buckets = new Map<string, string[]>(CATEGORIES.map((c) => [c.name, []]));
  for (const f of files) {
    const cat = CATEGORIES.find((c) => c.test(f));
    if (cat) buckets.get(cat.name)!.push(f);
  }
  for (const [name, list] of [...buckets]) {
    if (list.length === 0) buckets.delete(name);
  }
  return buckets;
}
