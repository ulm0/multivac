// Is the declared grapher's artifact part of the repository, or only part of
// one checkout of it (MV-103)?
//
// This lives beside `refresh.ts` rather than inside it because MV-50 carries an
// `absent` leg over that file for `git`: the module that runs a third-party
// tool in a loop must never be able to touch anybody's index. The tracked
// question is read-only and asks git directly, so it is asked from here, and
// the file layout is what states the boundary to the next reader.
//
// Nothing in this file writes. The gate refuses and prints the command; the
// human runs it. A tool that quietly staged files on your behalf would be a
// worse tool than one that leaves a graph behind, and the diff would not say
// which of you decided.

import { join } from 'node:path';
import type { Config } from '../types.js';
import { grapherSpec } from './registry.js';
import { artifactPresent, pathExists } from './detect.js';
import { graphScopes, type GateResult } from './refresh.js';
import { ignoredPaths, isTracked } from '../lib/git.js';
import { CONFIG_PATH } from '../lib/config.js';

/** The artifact this scope actually holds, or null where it holds none. */
export async function heldArtifact(artifacts: string[], dir: string): Promise<string | null> {
  for (const a of artifacts) {
    if (await pathExists(join(dir, a))) return a;
  }
  return null;
}

/**
 * Refuse while a declared, present root keeps its graph out of its repository.
 *
 * MV-90 asks whether the artifact EXISTS, and an artifact that exists in one
 * working tree answers that while helping nobody else: the next clone has none,
 * and the door there tells every agent to ask a graph that is not present.
 * Declaring a grapher is a declaration about the repository, so the artifact
 * belongs in it.
 *
 * Two ways to fail, two messages, because they have different fixes: untracked
 * is one `git add` away, and ignored is not — `git add` on an ignored path does
 * nothing an author is likely to read, and `-f` is the wrong advice when the
 * rule is the thing that is wrong.
 *
 * A missing artifact is MV-90's refusal and is silent here: two refusals for
 * one root, one derived from the other, is noise.
 */
export async function graphTrackedGate(
  brain: string,
  cfg: Config,
  slug: string,
  noGrapher: boolean,
): Promise<GateResult> {
  if (cfg.grapher === undefined && Object.values(cfg.repos).every((e) => e.grapher === undefined)) {
    return { ok: true, lines: [] };
  }
  // The skip switches are the graph gate's, and they cover this half too: one
  // gate's escape hatch that left the other armed would be a switch nobody
  // could reason about. The graph gate prints the skip notice for both.
  if (noGrapher || !cfg.grapherAuto) return { ok: true, lines: [] };

  const untracked: string[] = [];
  const ignored: string[] = [];
  for (const s of await graphScopes(brain, cfg)) {
    const spec = s.name === undefined ? null : grapherSpec(s.name, cfg.graphers);
    if (spec === null) continue; // unverified or none: out of scope, as MV-90 has it
    if (!(await artifactPresent(spec, s.dir))) continue; // MV-90's refusal, not this one
    const held = await heldArtifact(spec.artifacts, s.dir);
    if (held === null || (await isTracked(s.dir, held))) continue;
    const add = `git -C ${s.dir} add ${held}`;
    if ((await ignoredPaths(s.dir, [held])).length > 0) {
      ignored.push(`  ${s.scope}: ${held} is ignored by .gitignore — remove the rule, then \`${add}\``);
    } else {
      untracked.push(`  ${s.scope}: ${held} is untracked — \`${add}\``);
    }
  }
  if (untracked.length === 0 && ignored.length === 0) return { ok: true, lines: [] };

  // Every offending root in ONE message, the same rule the graph gate follows.
  const n = untracked.length + ignored.length;
  return {
    ok: false,
    lines: [
      `graph: \`change close ${slug}\` refused — ${n} root${n > 1 ? 's' : ''} keep${n > 1 ? '' : 's'} ` +
        `their graph out of the repository`,
      ...untracked,
      ...ignored,
      '  a graph only one checkout has is a graph the next clone does not have, while its door still points at one',
      `  or skip the gate without losing the tool: \`--no-grapher\` for one run, ` +
        `\`grapher_auto: false\` in ${CONFIG_PATH} for good`,
    ],
  };
}
