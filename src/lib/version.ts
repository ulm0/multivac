// MV-86. A brain records the version it was deliberately brought to, and a
// binary that disagrees says so on every run.
//
// `npm i -g multivac@latest` updates the projector, not the projections. The
// doors, the skill tree, the hook shims and the harness settings in a brain
// were written by whatever binary ran `init` there, and until now no file
// recorded which. This repository lived the consequence: a global `mvac` ran
// 0.1.0 for weeks against a brain on 0.2.0, and when MV-82 was enacted that
// binary called the row broken — because under its older scanner the line
// `export const ANCHOR_LINE = /<!--\s*@anchor\b/;` hid itself. Two people on
// different versions do not disagree about speed. They disagree about what
// green means.
//
// NOTHING HERE REFUSES. Three severities, and every one exits as it would
// have. The hook shim already sets the precedent: finding no runnable multivac
// at all it warns and exits 0 — enforcement degrades, it never locks you out,
// and a wrong version is a near neighbour of absence.
//
// This module NEVER writes. `init` writes the record at creation and
// `doors --adopt` moves it; nothing else may, because a record that moved as a
// side effect of any command would silence the notice without the upgrade
// having been taken — quiet, and looking resolved.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { red, yellow } from './out.js';

/** Where the record lives. Tool-owned; a human never edits it. */
export const PROJECTED_PATH = '.multivac/projected.yml';

/**
 * The floor's grammar is a floor's grammar. `^0.3`, `~0.3.1` and `>=0.3 <1`
 * are a semver RANGE parser, which is a third runtime dependency the law calls
 * a design change, or a hand-rolled one, which is worse. Every version this
 * project has published is plain three-number semver.
 */
const FLOOR = /^>=\s*(\d+)\.(\d+)\.(\d+)$/;
const SEMVER = /^(\d+)\.(\d+)\.(\d+)/;

/**
 * multivac's own version, read from its manifest.
 *
 * The manifest sits one level up from `dist/` and two from `dist-test/src/`,
 * so the distance is a property of the build and not of the code. Walking
 * until it is found is the one place that knows this; three callers used to
 * hardcode a depth, and two of them were wrong outside `dist/`.
 */
export function selfVersion(): string {
  for (const up of ['../package.json', '../../package.json', '../../../package.json']) {
    try {
      const pkg = JSON.parse(readFileSync(new URL(up, import.meta.url), 'utf8')) as {
        name?: string;
        version?: string;
      };
      if (pkg.name === 'multivac' && typeof pkg.version === 'string') return pkg.version;
    } catch {
      // keep walking
    }
  }
  throw new Error('multivac: cannot read its own package.json');
}

/** The record's file body — one writer's format, two callers. */
export function recordBody(version: string): string {
  return [
    '# Written by multivac, never by hand.',
    '# The version this brain was deliberately brought to — not whatever',
    '# binary last touched it. `mvac doors --adopt` is what moves it.',
    `version: ${version}`,
    '',
  ].join('\n');
}

export interface Notice {
  level: 'red' | 'yellow';
  line: string;
}

function triple(v: string): [number, number, number] | null {
  const m = SEMVER.exec(v.trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** -1, 0, 1. Pre-release and build metadata are ignored, never guessed at. */
function cmp(a: [number, number, number], b: [number, number, number]): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

function readRecord(brainDir: string): string | null {
  try {
    const doc = parse(readFileSync(join(brainDir, PROJECTED_PATH), 'utf8')) as
      | { version?: unknown }
      | null;
    const v = doc?.version;
    return typeof v === 'string' ? v : typeof v === 'number' ? String(v) : null;
  } catch {
    return null;
  }
}

/**
 * The notice, or null when there is nothing to say.
 *
 * `requires` is read from the raw config text rather than the parsed Config so
 * this stays usable before the config has been validated — a brain with a
 * broken config still deserves to be told its binary is stale.
 */
export function versionNotice(
  brainDir: string,
  running: string,
  rawConfig: string | null,
): Notice | null {
  const now = triple(running);
  if (!now) return null;

  // The floor first: it outranks staleness, because it changes what you do.
  if (rawConfig !== null) {
    // MV-114: a trailing comment is ordinary YAML on the one line the tool tells
  // humans to write, and the pattern demanded end-of-line right after the
  // value — so `requires: ">=0.4.0" # floor for CI` declared a floor that
  // enforced nothing, beside the comment naming this exact disease. A
  // malformed floor with a comment now falls into the refused-by-name notice
  // instead of vanishing.
  const decl = /^\s*requires:\s*['"]?([^'"\n#]+)['"]?\s*(?:#.*)?$/m.exec(rawConfig);
    if (decl) {
      const raw = decl[1].trim();
      const m = FLOOR.exec(raw);
      if (!m) {
        // Silently ignoring a mistyped floor is MV-85's defect relocated into
        // a config file: the reader believes a gate is declared that is not.
        return {
          level: 'red',
          line:
            `mvac: requires: "${raw}" is not a floor — write ">=X.Y.Z". ` +
            'It is the only form accepted, because a range grammar is a parser and MV-02 pins the dependency count',
        };
      }
      const floor: [number, number, number] = [Number(m[1]), Number(m[2]), Number(m[3])];
      if (cmp(now, floor) < 0) {
        return {
          level: 'red',
          line:
            `mvac: this brain requires >=${floor.join('.')} and you are running ${running} — ` +
            'the gate is below the floor this team declared. npm i -g multivac@latest',
        };
      }
    }
  }

  const record = readRecord(brainDir);
  if (record === null) {
    return {
      level: 'yellow',
      line:
        'mvac: this brain has no record of the version it was brought to — ' +
        'run `mvac doors --adopt` to write one',
    };
  }
  const was = triple(record);
  if (!was || cmp(was, now) === 0) return null;
  return {
    level: 'yellow',
    line:
      `mvac: this brain was brought to ${record} and you are running ${running} — ` +
      'run `mvac doors --adopt` to re-project and record it',
  };
}

/** Coloured for the terminal. The words carry the severity without colour. */
export function paint(n: Notice): string {
  return n.level === 'red' ? red(n.line) : yellow(n.line);
}
