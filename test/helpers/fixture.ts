// Scratch ecosystem for tests: one brain + two fake code repos, all real
// git repos with committed files. Neutral acme naming, no real-world content.

import { execFileSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { SPECKIT_INTEGRATION_JSON } from './recorded.js';

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

/**
 * Give `repo` an origin under `tmp` and push `main` to it, so `origin/main`
 * resolves there. A brain-scoped verify reads that ref, so any test about
 * published-vs-parked needs a repo that has actually been published — and
 * the bare remote goes through here for the same reason every other repo
 * does: the branch name is stated, never inherited from the host.
 */
export function publishRepo(repo: string, tmp: string, name: string): void {
  const bare = join(tmp, `${name}.git`);
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', bare], { stdio: 'ignore' });
  git(repo, 'remote', 'add', 'origin', bare);
  git(repo, 'push', '-q', 'origin', 'main');
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

/**
 * A `--depth 1` clone at `dest` of a two-commit repo made at `<dest>-src`,
 * whose first commit holds `files`. Through `file://`, because a clone from a
 * local path ignores `--depth`.
 */
export function shallowClone(dest: string, files: Record<string, string> = { 'README.md': '# one\n' }): void {
  const src = `${dest}-src`;
  initRepo(src, files);
  git(src, 'commit', '-q', '--allow-empty', '-m', 'two');
  execFileSync('git', ['clone', '-q', '--depth', '1', `file://${src}`, dest], { stdio: 'ignore' });
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

/**
 * MV-128. `specify` and `graphify` stubs that write what each vendor's state
 * probe reads, and a PATH made of them, node and the system dirs — never the
 * host's, where the real tools may be installed and would run. `runs` is a file
 * each stub appends its argv to. The graphify stub also writes a cache file,
 * which is `local` and must stay out of anything committed.
 */
export function vendorPath(
  tools: ('specify' | 'graphify' | 'openspec')[] = ['specify', 'graphify', 'openspec'],
): { path: string; runs: string } {
  const bin = mkdtempSync(join(tmpdir(), 'mvac-vendors-'));
  const runs = join(bin, 'runs.log');
  const stub = (name: 'specify' | 'graphify' | 'openspec', body: string): void => {
    if (!tools.includes(name)) return;
    const p = join(bin, name);
    writeFileSync(p, `#!/bin/sh\necho "${name} $*" >> '${runs}'\n${body}exit 0\n`);
    chmodSync(p, 0o755);
  };
  stub(
    'specify',
    `mkdir -p .specify/memory\n` +
      `printf '# [PROJECT_NAME] Constitution\\n' > .specify/memory/constitution.md\n` +
      `cat > .specify/integration.json <<'EOF'\n${SPECKIT_INTEGRATION_JSON}EOF\n`,
  );
  stub(
    'graphify',
    // MV-131: `install --project --platform <p>` writes that platform's probe.
    `if [ "$1" = install ]; then p=""; for a; do p="$a"; done\n` +
      `  case "$p" in cursor) mkdir -p .cursor/rules && printf 'x\\n' > .cursor/rules/graphify.mdc;;\n` +
      `  *) mkdir -p ".$p/skills/graphify" && printf 'x\\n' > ".$p/skills/graphify/SKILL.md";; esac\n` +
      `  exit 0\nfi\n` +
      `mkdir -p graphify-out/cache\n` +
      `printf '{"nodes":[],"links":[]}\\n' > graphify-out/graph.json\n` +
      `printf 'x\\n' > graphify-out/cache/entry\n`,
  );
  stub('openspec', `mkdir -p openspec/specs\nprintf 'schema: spec-driven\\n' > openspec/config.yaml\n`);
  return { path: [bin, dirname(process.execPath), '/usr/bin', '/bin'].join(delimiter), runs };
}
