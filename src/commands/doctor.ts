// `multivac doctor` — what is declared, what was found, what is degraded,
// how to fix it. Read-only, never mutates, never clones, exit 0 unless the
// config itself is invalid.

import { lstat, readFile, readlink, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { Command, Config } from '../types.js';
import { CONFIG_PATH, ConfigError, loadConfig } from '../lib/config.js';
import * as git from '../lib/git.js';
import { say } from '../lib/out.js';
import {
  doorTargets,
  grapherSpec,
  sddNames,
  sddSpec,
  type AdapterSpec,
} from '../adapters/registry.js';
import {
  artifactPresent,
  binaryPresent,
  pathExists,
} from '../adapters/detect.js';

const BEGIN = '<!-- multivac:begin -->';
const label = (s: string): string => s.padEnd(11);

function fmtAge(ms: number): string {
  const m = Math.round(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

async function presentRepoDirs(brain: string, cfg: Config): Promise<string[]> {
  const dirs: string[] = [];
  for (const e of Object.values(cfg.repos)) {
    const d = resolve(brain, e.path);
    if (await pathExists(d)) dirs.push(d);
  }
  return dirs;
}

/** One door target's state: ok / stale / missing managed block / missing. */
async function doorState(brain: string, name: string): Promise<string> {
  const t = doorTargets[name];
  if (!t) {
    return `${name}: unknown target — known: ${Object.keys(doorTargets).join(', ')}; fix doors: in ${CONFIG_PATH}`;
  }
  const p = join(brain, t.door);
  const st = await lstat(p).catch(() => null);
  if (!st) {
    const fix = t.kind === 'canonical' ? 'multivac init .' : 'multivac doors';
    return `${name}: ${t.door} missing → run \`${fix}\``;
  }
  if (t.kind === 'symlink' && st.isSymbolicLink()) {
    const target = await readlink(p).catch(() => '');
    const canonical = doorTargets.agents.door;
    return resolve(dirname(p), target) === join(brain, canonical)
      ? `${name}: ${t.door} ok (symlink)`
      : `${name}: ${t.door} stale — symlink points at ${target}, expected ${canonical} → run \`multivac doors\``;
  }
  // canonical, stub, or a regular-file projection (--no-symlink): the tool's
  // content must live in the managed block.
  const text = await readFile(p, 'utf8').catch(() => '');
  if (!text.includes(BEGIN)) {
    return `${name}: ${t.door} missing managed block → run \`multivac doors\``;
  }
  return `${name}: ${t.door} ok`;
}

async function sddLines(brain: string, cfg: Config): Promise<string[]> {
  if (!cfg.sdd) return []; // not declared: silence
  const spec = sddSpec(cfg.sdd);
  if (!spec) {
    return [
      label('sdd') +
        `${cfg.sdd}: unknown adapter — known: ${sddNames.join(', ')}; fix sdd: in ${CONFIG_PATH}`,
    ];
  }
  let artifact = false;
  for (const d of [brain, ...(await presentRepoDirs(brain, cfg))]) {
    if (await artifactPresent(spec, d)) {
      artifact = true;
      break;
    }
  }
  const binary = await binaryPresent(spec);
  const art = artifact
    ? 'artifact ok'
    : `artifact missing (looked for ${spec.artifacts.join(', ')})`;
  const bin = binary ? 'binary ok' : `binary missing → ${spec.installHint}`;
  const auto = !cfg.sddAuto
    ? 'sdd_auto: false — workflow manual'
    : binary
      ? 'workflow automated in change lifecycle (sdd_auto)'
      : 'feature off until installed — not an error';
  return [label('sdd') + `${cfg.sdd}: ${art} · ${bin} · ${auto}`];
}

/** Artifact older than the repo's last commit = stale. Best-effort. */
async function graphStale(dir: string, spec: AdapterSpec): Promise<boolean> {
  for (const a of spec.artifacts) {
    const st = await stat(join(dir, a)).catch(() => null);
    if (!st) continue;
    const ct = Number(
      await git.run(dir, ['log', '-1', '--format=%ct']).catch(() => 'NaN'),
    );
    return Number.isFinite(ct) && st.mtimeMs < ct * 1000;
  }
  return false;
}

async function grapherLines(brain: string, cfg: Config): Promise<string[]> {
  const scopes: Array<{ scope: string; dir: string; name?: string }> = [
    { scope: 'brain', dir: brain, name: cfg.grapher },
  ];
  for (const [key, e] of Object.entries(cfg.repos)) {
    const dir = resolve(brain, e.path);
    if (await pathExists(dir)) {
      scopes.push({ scope: key, dir, name: e.grapher ?? cfg.grapher });
    }
  }
  const out: string[] = [];
  const binCache = new Map<string, boolean>();
  for (const s of scopes) {
    if (!s.name) continue; // not declared for this scope: silence
    const spec = grapherSpec(s.name);
    let bin = binCache.get(s.name);
    if (bin === undefined) {
      bin = await binaryPresent(spec);
      binCache.set(s.name, bin);
    }
    const art = await artifactPresent(spec, s.dir);
    let msg = `${s.name} @ ${s.scope}: `;
    if (!art) {
      msg += bin
        ? `artifact missing → run \`${spec.refresh}\` there`
        : `artifact missing · binary missing → ${spec.installHint}, then \`${spec.refresh}\``;
    } else if (!bin) {
      msg += `artifact ok · binary missing → ${spec.installHint} (graph cannot refresh)`;
    } else if (await graphStale(s.dir, spec)) {
      msg += `artifact ok · binary ok · graph STALE (older than last commit) → run \`${spec.refresh}\` there`;
    } else {
      msg += 'artifact ok · binary ok · fresh';
    }
    out.push(label('grapher') + msg);
  }
  return out;
}

async function reposLine(brain: string, cfg: Config): Promise<string> {
  const entries = Object.entries(cfg.repos);
  if (entries.length === 0) return `none declared — add repos: to ${CONFIG_PATH}`;
  const missing: string[] = [];
  let present = 0;
  for (const [key, e] of entries) {
    if (await pathExists(resolve(brain, e.path))) {
      present++;
    } else {
      missing.push(
        e.url
          ? `${key} missing → \`multivac repos sync\` (git clone ${e.url} ${e.path})`
          : `${key} missing, no url — add url: under repos.${key} in ${CONFIG_PATH}`,
      );
    }
  }
  return [`${present}/${entries.length} present`, ...missing].join(' · ');
}

async function pinsLine(brain: string, cfg: Config): Promise<string> {
  const entries = Object.entries(cfg.repos);
  if (entries.length === 0) return 'no repos declared';
  const parts: string[] = [];
  for (const [key, e] of entries) {
    const dir = resolve(brain, e.path);
    if (!(await pathExists(dir))) {
      parts.push(`${key}: not cloned`);
      continue;
    }
    const pin = await git.lsTreeGitlink(dir, cfg.mount).catch(() => null);
    if (!pin) {
      parts.push(
        `${key}: no brain mount at ${cfg.mount} — add the brain as a gitlink (git submodule add <brain-url> ${cfg.mount})`,
      );
      continue;
    }
    const channel = e.channel ?? cfg.channel;
    let chName = channel;
    let chSha: string | null = null;
    if (channel) {
      chSha = await git
        .run(brain, ['rev-parse', '--verify', channel])
        .catch(() => null);
    } else {
      const rt = await git.remoteTrackingRef(brain);
      if (rt) ({ name: chName, sha: chSha } = rt);
    }
    if (!chSha) {
      parts.push(
        `${key}: pin ${pin.slice(0, 7)} — no channel ref to compare; set channel: in ${CONFIG_PATH}`,
      );
      continue;
    }
    if (chSha === pin) {
      parts.push(`${key}: pin ok (${chName})`);
      continue;
    }
    const behind = await git
      .run(brain, ['rev-list', '--count', `${pin}..${chSha}`])
      .catch(() => '?');
    const age = await git.lastFetchAge(brain).catch(() => null);
    const fetched = age === null ? 'never fetched' : `last fetch ${fmtAge(age)} ago`;
    parts.push(
      `${key}: pin ${behind} behind ${chName}; ${fetched} → git -C ${e.path} submodule update --remote ${cfg.mount}`,
    );
  }
  return parts.join(' · ');
}

async function hooksLine(brain: string): Promise<string> {
  const hp = await git.run(brain, ['config', 'core.hooksPath']).catch(() => null);
  const parts: string[] = [
    hp === '.multivac/hooks'
      ? 'core.hooksPath ok'
      : hp
        ? `core.hooksPath is ${hp}, expected .multivac/hooks → git config core.hooksPath .multivac/hooks`
        : 'core.hooksPath unset → git config core.hooksPath .multivac/hooks',
  ];
  for (const shim of ['pre-commit', 'pre-push']) {
    parts.push(
      (await pathExists(join(brain, '.multivac/hooks', shim)))
        ? `${shim} ok`
        : `${shim} missing → run \`multivac init .\` to rewrite the shims`,
    );
  }
  return parts.join(' · ');
}

/** Build the full report. Exit 1 only when the config itself is invalid. */
export async function doctorReport(
  brainDir: string,
): Promise<{ lines: string[]; exit: number }> {
  let cfg: Config;
  try {
    cfg = await loadConfig(brainDir);
  } catch (e) {
    if (e instanceof ConfigError) {
      return { lines: [label('config') + `invalid — ${e.message}`], exit: 1 };
    }
    throw e;
  }
  const doorParts: string[] = [];
  for (const name of cfg.doors) doorParts.push(await doorState(brainDir, name));
  const lines: string[] = [
    label('doors') +
      (doorParts.join(' · ') ||
        `none declared — add doors: [agents] to ${CONFIG_PATH}`),
    ...(await sddLines(brainDir, cfg)),
    ...(await grapherLines(brainDir, cfg)),
    label('repos') + (await reposLine(brainDir, cfg)),
    label('pins') + (await pinsLine(brainDir, cfg)),
    label('hooks') + (await hooksLine(brainDir)),
  ];
  return { lines, exit: 0 };
}

export const doctorCommand: Command = {
  name: 'doctor',
  help: 'what is declared, what was found, what is degraded, how to fix it',
  async run(_argv, ctx) {
    const { lines, exit } = await doctorReport(ctx.cwd);
    for (const l of lines) say(l);
    return exit;
  },
};
