// Load and validate .multivac/config.yml. Every error says how to fix it.

import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import { samePath } from './paths.js';
import type { Config, Mode, RepoEntry } from '../types.js';

export class ConfigError extends Error {}

const MODES: Mode[] = ['present', 'absent', 'unique', 'count'];
export const CONFIG_PATH = '.multivac/config.yml';

function fail(msg: string): never {
  throw new ConfigError(`${CONFIG_PATH}: ${msg}`);
}

function stringList(v: unknown, key: string): string[] {
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) {
    fail(`"${key}" must be a list of strings — e.g. ${key}: [a, b]`);
  }
  return v as string[];
}

function optString(v: unknown, key: string): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'string') fail(`"${key}" must be a string`);
  return v;
}

function repoEntry(key: string, v: unknown): RepoEntry {
  if (typeof v === 'string') return { path: v };
  if (v === null || typeof v !== 'object' || Array.isArray(v)) {
    fail(`repos.${key} must be a path string or { path, url?, grapher?, channel? }`);
  }
  const o = v as Record<string, unknown>;
  let path: string;
  if (typeof o.path === 'string' && o.path !== '') {
    path = o.path;
  } else if (typeof o.url === 'string' && o.url !== '') {
    // url-only: declared before cloned — unevaluated, not red. Default the
    // clone destination so `repos sync` knows where to put it.
    path = `../${key}`;
  } else {
    fail(`repos.${key} needs "path" or "url" — add path: ../${key}`);
  }
  return {
    path,
    url: optString(o.url, `repos.${key}.url`),
    grapher: optString(o.grapher, `repos.${key}.grapher`),
    channel: optString(o.channel, `repos.${key}.channel`),
  };
}

/** Load config from `<brainDir>/.multivac/config.yml`, defaults applied. */
export async function loadConfig(brainDir: string): Promise<Config> {
  const file = join(brainDir, CONFIG_PATH);
  let raw: string;
  try {
    raw = await readFile(file, 'utf8');
  } catch {
    throw new ConfigError(
      `no ${CONFIG_PATH} in ${brainDir} — run \`multivac init .\` to create it`,
    );
  }
  let doc: unknown;
  try {
    doc = parse(raw);
  } catch (e) {
    fail(`invalid YAML: ${(e as Error).message} — fix the syntax`);
  }
  if (doc === null || doc === undefined) doc = {};
  if (typeof doc !== 'object' || Array.isArray(doc)) {
    fail('top level must be a mapping of keys, not a list or scalar');
  }
  const o = doc as Record<string, unknown>;

  const blockingRaw = o.blocking ?? ['absent', 'count'];
  const blocking = stringList(blockingRaw, 'blocking') as Mode[];
  for (const m of blocking) {
    if (!MODES.includes(m)) {
      fail(`"blocking" has unknown mode "${m}" — allowed: ${MODES.join(', ')}`);
    }
  }
  if (!blocking.includes('absent')) {
    fail('"blocking" must include "absent" — the tombstone always blocks; add it back');
  }

  const sddAuto = o.sdd_auto ?? true;
  if (typeof sddAuto !== 'boolean') {
    fail('"sdd_auto" must be true or false');
  }

  const staleness = o.staleness ?? 'report';
  if (staleness !== 'report' && staleness !== 'block') {
    fail('"staleness" must be "report" or "block" — block makes a stale pin exit 1');
  }

  const strictPrePush = o.strict_pre_push ?? false;
  if (typeof strictPrePush !== 'boolean') {
    fail('"strict_pre_push" must be true or false');
  }

  const reposRaw = o.repos ?? {};
  if (typeof reposRaw !== 'object' || reposRaw === null || Array.isArray(reposRaw)) {
    fail('"repos" must be a mapping of key -> path or { path, ... }');
  }
  const repos: Record<string, RepoEntry> = {};
  for (const [k, v] of Object.entries(reposRaw as Record<string, unknown>)) {
    if (k === '*') {
      fail('repos."*" is a reserved key — "*" means every repo in anchor legs; rename the repo');
    }
    const entry = repoEntry(k, v);
    // brain==code: an entry whose path IS the brain root is the brain itself.
    // Through a symlink too — otherwise the brain is a "consumer repo" that
    // gets a consumer door, a mount nag, and a second scan of its own files.
    const isBrain = samePath(resolve(brainDir, entry.path), brainDir);
    if (isBrain) entry.isBrain = true;
    if (k === 'brain' && !isBrain) {
      // A "brain" key pointing elsewhere collides with the implicit brain
      // handle: consumer-scoped verify would evaluate the brain's own
      // anchors against a consumer checkout. `brain: .` is the one meaning.
      fail(
        `repos.brain must be the brain itself (path .) — it is "${entry.path}"; rename the repo`,
      );
    }
    repos[k] = entry;
  }

  return {
    doors: stringList(o.doors, 'doors'),
    sdd: optString(o.sdd, 'sdd'),
    sddAuto,
    grapher: optString(o.grapher, 'grapher'),
    authorities: stringList(o.authorities, 'authorities'),
    blocking,
    staleness,
    strictPrePush,
    channel: optString(o.channel, 'channel'),
    mount: optString(o.mount, 'mount') ?? '.brain',
    repos,
  };
}
