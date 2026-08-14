// Scratch ecosystem for tests: one brain + two fake code repos, all real
// git repos with committed files. Neutral acme naming, no real-world content.

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export interface ScratchEcosystem {
  brain: string;
  repos: { api: string; web: string };
}

function git(cwd: string, ...args: string[]): void {
  execFileSync('git', ['-C', cwd, ...args], { stdio: 'ignore' });
}

/**
 * Create `dir` and init a git repo on an explicit `main`.
 *
 * Every test that asserts on a branch name asserts on `main`, but the branch
 * `git init` picks comes from `init.defaultBranch` — commonly `main` in a
 * developer's global config, unset in CI images, where git falls back to
 * `master`. Passing `-b` makes the suite say what it means instead of
 * inheriting the host's opinion. All test repos go through here.
 */
export function gitInit(dir: string): void {
  mkdirSync(dir, { recursive: true });
  git(dir, 'init', '-q', '-b', 'main');
}

/** Init a git repo at `dir` with `files` committed. Exported for tests that
 * need trees shaped like real subjects (see test/seed). */
export function initRepo(dir: string, files: Record<string, string>): void {
  gitInit(dir);
  git(dir, 'config', 'user.email', 'test@acme.example');
  git(dir, 'config', 'user.name', 'Acme Test');
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(dir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'init');
}

const CONFIG_YML = `doors: [agents]
repos:
  api: ../acme-api
  web:
    path: ../acme-web
`;

const INVARIANTS_MD = `# Invariants

| ID | statement | authority | state | date | source |
| --- | --- | --- | --- | --- | --- |
`;

// Multi-line GRANT on purpose: exercises SQL statement normalization —
// a per-line matcher must NOT see this as "grant update on accounts".
const MIGRATION_SQL = `-- initial schema
CREATE TABLE accounts (
  id bigint PRIMARY KEY,
  balance numeric NOT NULL
);

GRANT
  SELECT,
  UPDATE
ON accounts
TO app_role;
`;

/** Create brain + acme-api + acme-web under tmpdir; returns absolute paths. */
export function makeScratchEcosystem(tmpdir: string): ScratchEcosystem {
  const brain = join(tmpdir, 'acme-brain');
  const api = join(tmpdir, 'acme-api');
  const web = join(tmpdir, 'acme-web');

  initRepo(brain, {
    '.multivac/config.yml': CONFIG_YML,
    'AGENTS.md': '# acme brain\n\nStart here.\n',
    '.multivac/invariants.md': INVARIANTS_MD,
  });

  initRepo(api, {
    'db/migrations/0001.sql': MIGRATION_SQL,
    'src/server.ts': 'export const port = 8080;\n',
    'README.md': '# acme-api\n',
  });

  initRepo(web, {
    'src/index.ts': 'export const app = "acme-web";\n',
    'README.md': '# acme-web\n',
  });

  return { brain, repos: { api, web } };
}
