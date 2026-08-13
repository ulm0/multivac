// Legs -> LegResult -> ClaimResult. AND semantics: every leg must hold,
// the claim inherits the worst leg. `moved` self-heals: a present leg with
// zero in-glob matches and exactly one match elsewhere rewrites its glob
// in the source markdown.

import { readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import type { Anchor, ClaimResult, LegResult, LegState } from '../types.js';
import { RepoScanner, scanLeg, scanWholeRepo } from './match.js';

/** A declared repo resolved for this run. dir null = not on disk. */
export interface RepoHandle {
  key: string;
  dir: string | null;
}

export interface EvaluateOptions {
  brainDir: string;
  /** false = --check: report moved without rewriting. */
  write: boolean;
}

const RANK: Record<LegState, number> = {
  ok: 0,
  unevaluated: 1,
  moved: 2,
  vacuous: 3,
  broken: 4,
};

interface Target {
  key: string;
  scanner: RepoScanner;
}

interface TaggedMatch {
  key: string;
  file: string;
  line: number;
}

/** Rewrite a moved leg's glob in place in its source markdown. */
async function rewriteGlob(a: Anchor, newGlob: string, brainDir: string): Promise<void> {
  const path = isAbsolute(a.file) ? a.file : join(brainDir, a.file);
  const lines = (await readFile(path, 'utf8')).split('\n');
  lines[a.line - 1] = lines[a.line - 1].replace(
    `${a.repoKey}:${a.include}`,
    `${a.repoKey}:${newGlob}`,
  );
  await writeFile(path, lines.join('\n'));
}

async function evalLeg(a: Anchor, targets: Target[], opts: EvaluateOptions): Promise<LegResult> {
  if (targets.length === 0) {
    return {
      anchor: a,
      state: 'unevaluated',
      detail: 'repo not on disk — run `multivac repos sync` to clone it',
    };
  }
  const star = a.repoKey === '*';
  const label = (m: TaggedMatch): string =>
    `${star ? `${m.key}:` : ''}${m.file}:${m.line}`;
  let globFileCount = 0;
  const matches: TaggedMatch[] = [];
  for (const t of targets) {
    const scan = await scanLeg(a, t.scanner);
    globFileCount += scan.globFiles.length;
    for (const m of scan.matches) matches.push({ key: t.key, ...m });
  }
  const n = matches.length;
  const list =
    matches.slice(0, 3).map(label).join(', ') + (n > 3 ? ` +${n - 3} more` : '');
  const where = star ? 'any declared repo' : a.repoKey;
  const leg = (state: LegState, detail?: string, movedTo?: string): LegResult => ({
    anchor: a,
    state,
    matchCount: n,
    movedTo,
    detail,
  });

  switch (a.mode) {
    case 'present': {
      if (n > 0) return leg('ok');
      // Self-heal: search the whole repo(s) for the one place it moved to.
      const candidates: TaggedMatch[] = [];
      for (const t of targets) {
        for (const m of await scanWholeRepo(a, t.scanner)) {
          candidates.push({ key: t.key, ...m });
        }
      }
      const files = [...new Set(candidates.map((c) => `${c.key}\0${c.file}`))];
      if (files.length === 1) {
        const movedTo = files[0].split('\0')[1];
        if (opts.write) {
          await rewriteGlob(a, movedTo, opts.brainDir);
          return leg('moved', `glob rewritten to ${movedTo} — review the diff`, movedTo);
        }
        return leg(
          'moved',
          `match moved to ${movedTo} — rerun without --check to rewrite the glob`,
          movedTo,
        );
      }
      if (files.length === 0) {
        return globFileCount === 0
          ? leg(
              'vacuous',
              `glob matched no tracked files and /${a.regexSource}/ found nowhere — fix the glob or retire the claim`,
            )
          : leg('broken', `no match in ${where} — restore the code or retire the claim`);
      }
      const fl = files.slice(0, 3).map((f) => f.split('\0')[1]).join(', ');
      return leg(
        'broken',
        `found in ${files.length} files (${fl}${files.length > 3 ? ', …' : ''}) — narrow the regex or split into per-file legs`,
      );
    }
    case 'absent': {
      if (globFileCount === 0) {
        return leg(
          'vacuous',
          'glob matched no tracked files — a rename greens this tombstone silently; fix the glob',
        );
      }
      if (n === 0) return leg('ok');
      return leg('broken', `forbidden pattern at ${list} — delete it, or retire/amend the claim first`);
    }
    case 'unique': {
      if (globFileCount === 0) {
        return leg('vacuous', 'glob matched no tracked files — fix the glob so the check can see');
      }
      if (n === 1) return leg('ok');
      if (n === 0) {
        return leg('broken', 'expected exactly one match, found none — restore it or fix the regex');
      }
      return leg(
        'broken',
        `expected exactly one match, found ${n} (${list}) — deduplicate, or use count=${n} if all are sanctioned`,
      );
    }
    case 'count': {
      if (globFileCount === 0) {
        return leg('vacuous', `glob matched no tracked files — count=${a.count} cannot ratchet; fix the glob`);
      }
      if (n === a.count) return leg('ok');
      return leg(
        'broken',
        `count=${a.count} pinned, found ${n} (${list || 'none'}) — revert the new occurrence, or ratchet to count=${n} in ${a.file}:${a.line}`,
      );
    }
  }
}

/**
 * Evaluate all legs across the resolved repos. "*" targets every handle
 * (the caller includes the brain as a handle). Results group by claim id
 * in first-seen order; worst leg wins.
 */
export async function evaluateAnchors(
  anchors: Anchor[],
  handles: RepoHandle[],
  opts: EvaluateOptions,
): Promise<ClaimResult[]> {
  const scanners = new Map<string, RepoScanner>();
  const scanner = (dir: string): RepoScanner => {
    let s = scanners.get(dir);
    if (!s) {
      s = new RepoScanner(dir);
      scanners.set(dir, s);
    }
    return s;
  };
  const claims = new Map<string, ClaimResult>();
  for (const a of anchors) {
    const wanted =
      a.repoKey === '*' ? handles : handles.filter((h) => h.key === a.repoKey);
    const targets: Target[] = wanted
      .filter((h): h is RepoHandle & { dir: string } => h.dir !== null)
      .map((h) => ({ key: h.key, scanner: scanner(h.dir) }));
    const result = await evalLeg(a, targets, opts);
    let claim = claims.get(a.claimId);
    if (!claim) {
      claim = { claimId: a.claimId, state: result.state, legs: [] };
      claims.set(a.claimId, claim);
    }
    claim.legs.push(result);
    if (RANK[result.state] > RANK[claim.state]) claim.state = result.state;
  }
  return [...claims.values()];
}
