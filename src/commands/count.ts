// multivac count — dry-run one anchor leg and print the per-file breakdown,
// so a count=N ratchet is right the first time. Same parse (parseAnchors)
// and same matcher (scanLeg) as verify, never a reimplementation — hand
// git-grep counts were wrong on 2 of 3 measurement-2 subjects because of
// dialect and glob differences.

import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseAnchors } from '../anchor/parse.js';
import { RepoScanner, scanLeg } from '../anchor/match.js';
import { loadConfig, ConfigError, CONFIG_PATH } from '../lib/config.js';
import { realPath } from '../lib/paths.js';
import { say, warn } from '../lib/out.js';
import { findMount } from './verify.js';
import type { Command, CommandContext } from '../types.js';

const USAGE = [
  "usage: multivac count '<repo>:<glob> [!<glob> ...] /<regex>/[i] [each|each!]' [dir]",
  'prints the match count and the per-file breakdown a count=N leg would see.',
  'with each/each!, the breakdown includes the zero-match files the universal would fail on.',
  'dry-run only: writes nothing, exits 0 even at zero matches. grammar: multivac help anchor',
];

async function run(argv: string[], ctx: CommandContext): Promise<number> {
  const args = argv.filter((a) => !a.startsWith('-'));
  if (argv.length !== args.length || args.length === 0 || args.length > 2) {
    for (const l of USAGE) warn(l);
    return 2;
  }
  const [spec, dir = '.'] = args;

  // The same parser verify runs — a spec that parses here parses as a leg.
  const { anchors, diagnostics } = parseAnchors(`<!-- @anchor COUNT ${spec} -->`, '(spec)');
  if (diagnostics.length > 0 || anchors.length !== 1) {
    for (const d of diagnostics) warn(`count: ${d.message}`);
    if (diagnostics.length === 0) warn(`count: "${spec}" is not <repo>:<glob> /<regex>/`);
    return 2;
  }
  const a = anchors[0];

  // Brain resolution, verify's rules: config here, or a mounted brain below.
  const startDir = resolve(ctx.cwd, dir);
  const brainDir = existsSync(join(startDir, CONFIG_PATH))
    ? startDir
    : (findMount(startDir) ?? startDir);
  let cfg;
  try {
    cfg = await loadConfig(brainDir);
  } catch (e) {
    if (e instanceof ConfigError) {
      warn(e.message);
      return 2;
    }
    throw e;
  }

  const declared = Object.keys(cfg.repos);
  if (a.repoKey !== '*' && a.repoKey !== 'brain' && !cfg.repos[a.repoKey]) {
    warn(
      `unknown repo key "${a.repoKey}" — declared: ${['brain', ...declared].join(', ')}, or *`,
    );
    return 2;
  }

  // Targets exactly as verify builds them: declared repos plus the brain,
  // one scan per real directory (an alias key is the same tree).
  const handles = [
    ...Object.entries(cfg.repos)
      .filter(([key]) => key !== 'brain')
      .map(([key, e]) => ({ key, dir: resolve(brainDir, e.path) })),
    { key: 'brain', dir: brainDir },
  ].filter((h) => existsSync(h.dir));
  const seen = new Set<string>();
  const targets = handles.filter((h) => {
    if (a.repoKey !== '*' && h.key !== a.repoKey) return false;
    if (a.repoKey === '*') {
      const p = realPath(h.dir);
      if (seen.has(p)) return false;
      seen.add(p);
    }
    return true;
  });
  if (targets.length === 0) {
    warn(`repo "${a.repoKey}" is declared but not on disk — run \`multivac repos sync\``);
    return 2;
  }

  let total = 0;
  let files = 0;
  let matched = 0;
  const each = a.mode === 'each';
  const star = a.repoKey === '*';
  for (const t of targets) {
    const scan = await scanLeg(a, new RepoScanner(t.dir), [t.key]);
    files += scan.globFiles.length;
    const perFile = new Map<string, number>();
    for (const m of scan.matches) perFile.set(m.file, (perFile.get(m.file) ?? 0) + 1);
    matched += perFile.size;
    // each is the per-file universal, so its author needs the zero-match
    // files — exactly the ones the summary line cannot name for them.
    const listed = each ? scan.globFiles : [...perFile.keys()];
    for (const file of listed) {
      const n = perFile.get(file) ?? 0;
      say(`  ${star ? `${t.key}:` : ''}${file}  ${n}`);
      total += n;
    }
  }
  const plural = (n: number): string => (n === 1 ? '' : 's');
  if (files === 0) {
    say(`glob matched no tracked files in ${a.repoKey} — an anchor on it would be vacuous`);
  } else if (each) {
    const failing = a.negated ? matched : files - matched;
    say(
      `${matched} of ${files} tracked file${plural(files)} match — ` +
        `each${a.negated ? '!' : ''} would fail on ${failing} file${plural(failing)} ` +
        `(${a.negated ? 'the ones with a match' : 'the ones without a match'})`,
    );
  } else {
    say(`${total} match${total === 1 ? '' : 'es'} in ${files} tracked file${plural(files)} — a ratchet pins count=${total}`);
  }
  return 0;
}

export const count: Command = {
  name: 'count',
  help: "dry-run an anchor leg: match count + per-file breakdown, verify's own matcher",
  usage: USAGE,
  run,
};

export default count;
