// `multivac repos` — list declared repos; `repos sync [--shallow]` clones
// every declared-with-url missing repo. The ONLY command besides `change`
// that clones. execFile git clone, clear auth-failure message, no retry.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import type { Command } from '../types.js';
import { CONFIG_PATH, loadConfig } from '../lib/config.js';
import { pathExists } from '../adapters/detect.js';
import { say } from '../lib/out.js';

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
      lines.push(`${key}: present at ${e.path}`);
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
      const last = stderr.split('\n').filter(Boolean).pop() ?? 'git clone failed';
      lines.push(
        AUTH_RE.test(stderr)
          ? `${key}: auth failed cloning ${e.url} — fix your ssh key/token for this host, then re-run \`multivac repos sync\` (no retry was attempted)`
          : `${key}: clone failed — ${last} → check repos.${key}.url in ${CONFIG_PATH}, then re-run \`multivac repos sync\``,
      );
    }
  }
  return { lines, exit };
}

export const reposCommand: Command = {
  name: 'repos',
  help: 'list declared repos; `repos sync [--shallow]` clones the missing ones',
  async run(argv, ctx) {
    const sub = argv[0];
    if (sub === undefined || sub === 'list') {
      for (const l of await reposList(ctx.cwd)) say(l);
      return 0;
    }
    if (sub === 'sync') {
      const { lines, exit } = await reposSync(ctx.cwd, argv.includes('--shallow'));
      for (const l of lines) say(l);
      return exit;
    }
    say(`unknown subcommand "${sub}" — usage: multivac repos [sync [--shallow]]`);
    return 2;
  },
};
