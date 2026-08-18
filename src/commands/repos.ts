// `multivac repos` — list declared repos; `repos sync [--shallow]` clones
// every declared-with-url missing repo AND fetches every present one. The ONLY
// command besides `change` that touches the network. execFile git, clear
// auth-failure message, no retry.
//
// The fetch is not a nicety. Since MV-53 a brain-scoped `verify` judges each
// sibling at its channel ref — a LOCAL remote-tracking ref — so the whole
// ecosystem's verdict is only as true as the last fetch. Cloning alone left a
// day-old `origin/main` reading as "the ecosystem as published", and every
// staleness line in `verify` already names this command as the fix.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import type { Command } from '../types.js';
import { CONFIG_PATH, loadConfig } from '../lib/config.js';
import { pathExists } from '../adapters/detect.js';
import { gitFailure } from '../lib/git.js';
import { parseArgs, type ArgsDef } from 'citty';
import { surfaceFrom, undeclared } from '../lib/args.js';
import { say, warn } from '../lib/out.js';

const execFileP = promisify(execFile);

const AUTH_RE =
  /authentication failed|permission denied|could not read username|could not read password|publickey|access denied/i;

export async function reposList(brainDir: string): Promise<string[]> {
  const cfg = await loadConfig(brainDir);
  const entries = Object.entries(cfg.repos);
  if (entries.length === 0) {
    return [`no repos declared — add repos: to ${CONFIG_PATH}`];
  }
  const lines: string[] = [];
  for (const [key, e] of entries) {
    const there = await pathExists(resolve(brainDir, e.path));
    const url = e.url ? `  (${e.url})` : there ? '' : '  — no url, cannot sync';
    lines.push(`${key.padEnd(12)} ${there ? 'present' : 'missing'}  ${e.path}${url}`);
  }
  return lines;
}

export async function reposSync(
  brainDir: string,
  shallow: boolean,
): Promise<{ lines: string[]; exit: number }> {
  const cfg = await loadConfig(brainDir);
  const entries = Object.entries(cfg.repos);
  if (entries.length === 0) {
    return { lines: [`no repos declared — add repos: to ${CONFIG_PATH}`], exit: 0 };
  }
  const lines: string[] = [];
  let exit = 0;
  for (const [key, e] of entries) {
    const dest = resolve(brainDir, e.path);
    if (await pathExists(dest)) {
      // Refresh the remote-tracking refs verify reads. Best-effort: a repo with
      // no remote, or a machine offline, still has a usable — if older — ref,
      // and verify's `read` line carries its age. So a failed refresh reports
      // and never gates; only a repo we could not GET at all does that.
      try {
        await execFileP('git', ['-C', dest, 'fetch', '--quiet'], { maxBuffer: 16 * 1024 * 1024 });
        lines.push(`${key}: present at ${e.path} — fetched`);
      } catch (err) {
        const stderr = ((err as { stderr?: string }).stderr ?? String(err)).trim();
        // First `fatal:`, not the last line: git's tail is advice, not cause.
        const last = gitFailure(stderr, 'git fetch failed');
        lines.push(
          `${key}: present at ${e.path} — could not fetch: ${last}; ` +
            `its channel ref stays as last fetched (\`git -C ${e.path} fetch\`)`,
        );
      }
      continue;
    }
    if (!e.url) {
      lines.push(
        `${key}: missing and no url — add url: under repos.${key} in ${CONFIG_PATH}`,
      );
      continue;
    }
    const args = ['clone', ...(shallow ? ['--depth', '1'] : []), e.url, dest];
    try {
      await execFileP('git', args, { maxBuffer: 16 * 1024 * 1024 });
      lines.push(`${key}: cloned ${e.url} -> ${e.path}${shallow ? ' (shallow)' : ''}`);
    } catch (err) {
      exit = 1;
      const stderr = ((err as { stderr?: string }).stderr ?? String(err)).trim();
      const last = gitFailure(stderr, 'git clone failed');
      lines.push(
        AUTH_RE.test(stderr)
          ? `${key}: auth failed cloning ${e.url} — fix your ssh key/token for this host, then re-run \`multivac repos sync\` (no retry was attempted)`
          : `${key}: clone failed — ${last} → check repos.${key}.url in ${CONFIG_PATH}, then re-run \`multivac repos sync\``,
      );
    }
  }
  return { lines, exit };
}

/** What repos takes. One declaration: citty parses it, and the subcommand is a positional. */
const ARGS = {
  sub: { type: 'positional', required: false, description: 'list (default) or sync' },
  shallow: { type: 'boolean', description: 'sync only: --depth 1' },
} satisfies ArgsDef;

export const reposCommand: Command = {
  name: 'repos',
  help: 'list declared repos; `repos sync [--shallow]` clones the missing, fetches the rest',
  usage: [
    'usage: multivac repos [sync] [--shallow]',
    '  (no sub)    list every declared repo: present or missing, and its path',
    '  sync        clone the missing ones, fetch the rest so the channel ref is current',
    '  --shallow   sync only: --depth 1, for a repo you will read but never land in',
    'verify never fetches, so a channel ref is only as current as the last sync.',
  ],
  async run(argv, ctx) {
    // MV-85, before the config is read. `repos` used to answer an unknown FLAG
    // with its unknown-subcommand line, which happened to exit 2 and happened
    // to name it — true by accident of the first positional being whatever you
    // typed. Refusing against the declaration says it on purpose.
    const bad = undeclared('repos', argv, surfaceFrom(ARGS));
    if (bad) {
      warn(bad);
      return 2;
    }
    const a = parseArgs(argv, ARGS);
    const sub = a.sub;
    if (sub === undefined || sub === 'list') {
      for (const l of await reposList(ctx.cwd)) say(l);
      return 0;
    }
    if (sub === 'sync') {
      const { lines, exit } = await reposSync(ctx.cwd, a.shallow === true);
      for (const l of lines) say(l);
      return exit;
    }
    say(`unknown subcommand "${sub}" — usage: multivac repos [sync [--shallow]]`);
    return 2;
  },
};
