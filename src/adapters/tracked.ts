// Is the declared grapher's shared artifact part of the repository — in its
// committed HEAD — or only part of one checkout of it (MV-103, MV-124)?
//
// This lives beside `refresh.ts` rather than inside it because MV-50 carries an
// `absent` leg over that file for `git`: the module that runs a third-party
// tool in a loop must never be able to touch anybody's index. The committed
// question is read-only and asks git directly, so it is asked from here, and
// the file layout is what states the boundary to the next reader.
//
// Nothing in this file writes. The gate refuses and prints the command; the
// human runs it. A tool that quietly staged files on your behalf would be a
// worse tool than one that leaves a graph behind, and the diff would not say
// which of you decided.

import type { Config } from '../types.js';
import { grapherSpec } from './registry.js';
import { adaptersByRoot } from './detect.js';
import { graphScopes, type GateResult } from './refresh.js';
import { ignoredPaths, inHead } from '../lib/git.js';
import { initState } from '../lib/init-state.js';
import { CONFIG_PATH } from '../lib/config.js';

/**
 * Refuse while a declared root on disk that is not read-only (MV-125) keeps
 * its shared graph out of its repository. A read-only root is never judged:
 * its only fix is a commit where multivac may not write.
 *
 * MV-90 asks whether the artifact EXISTS, and an artifact that exists in one
 * working tree answers that while helping nobody else: the next clone has none,
 * and the door there tells every agent to ask a graph that is not present.
 * Declaring a grapher is a declaration about the repository, so a SHARED
 * artifact belongs in it — in HEAD, which is what a clone gets, never only in
 * the index (MV-124). A LOCAL artifact, codegraph's database, is never asked:
 * it is built in each checkout, and MV-90 already refuses where it is not.
 *
 * Two ways to fail, two messages, because they have different fixes: not
 * committed is an add and a commit away, and ignored is not — `git add` on an
 * ignored path does nothing an author is likely to read, and `-f` is the wrong
 * advice when the rule is the thing that is wrong.
 *
 * A root not installed is MV-90's refusal and is silent here: two refusals for
 * one root, one derived from the other, is noise.
 */
export async function graphTrackedGate(
  brain: string,
  cfg: Config,
  slug: string,
  noGrapher: boolean,
): Promise<GateResult> {
  if (adaptersByRoot(cfg, 'grapher').size === 0) return { ok: true, lines: [] };
  // The skip switches are the graph gate's, and they cover this half too: one
  // gate's escape hatch that left the other armed would be a switch nobody
  // could reason about. The graph gate prints the skip notice for both.
  if (noGrapher || !cfg.grapherAuto) return { ok: true, lines: [] };

  const uncommitted: string[] = [];
  const ignored: string[] = [];
  for (const s of await graphScopes(brain, cfg)) {
    const spec = s.name === undefined ? null : grapherSpec(s.name, cfg.graphers);
    if (spec === null) continue; // unverified or none: out of scope, as MV-90 has it
    if (s.readOnly) continue; // not multivac's to commit in (MV-125)
    if (spec.artifactKind === 'local') continue; // built in each checkout, never committed
    if ((await initState(spec, s.dir)).state !== 'installed') continue; // MV-90's refusal, not this one
    const art = spec.artifacts[0];
    if (await inHead(s.dir, art)) continue;
    const commit = `git -C ${s.dir} add ${art} && git -C ${s.dir} commit -m "chore: commit the graph" -- ${art}`;
    if ((await ignoredPaths(s.dir, [art])).length > 0) {
      ignored.push(`  ${s.scope}: ${art} is ignored by .gitignore — remove the rule, then \`${commit}\``);
    } else {
      uncommitted.push(`  ${s.scope}: ${art} is not committed — \`${commit}\``);
    }
  }
  if (uncommitted.length === 0 && ignored.length === 0) return { ok: true, lines: [] };

  // Every offending root in ONE message, the same rule the graph gate follows.
  const n = uncommitted.length + ignored.length;
  return {
    ok: false,
    lines: [
      `graph: \`change close ${slug}\` refused — ${n} root${n > 1 ? 's' : ''} keep${n > 1 ? '' : 's'} ` +
        `their graph out of the repository`,
      ...uncommitted,
      ...ignored,
      '  a graph only one checkout has is a graph the next clone does not have, while its door still points at one',
      `  or skip the gate without losing the tool: \`--no-grapher\` for one run, ` +
        `\`grapher_auto: false\` in ${CONFIG_PATH} for good`,
    ],
  };
}
