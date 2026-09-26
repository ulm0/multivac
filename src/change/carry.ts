// MV-133. A change's SDD files belong on the change's branch. `/speckit.specify`
// and its siblings write `specs/<n>-<slug>/` into the checkout, and `change
// apply` created the worktree from the last commit, where that directory does
// not exist: measured on every change from 052 to 057 in this repository, the
// directory was copied into the worktree by hand, and the untracked copy left
// behind stopped `git merge` until it was deleted by hand. An SDD that `equip`
// installed was left the same way, on no branch at all.

import { copyFile, mkdir, rm, rmdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import picomatch from 'picomatch';
import type { Config } from '../types.js';
import { adapterFor, artifactHit, readOnly } from '../adapters/detect.js';
import { sddSpec, type AdapterSpec } from '../adapters/registry.js';
import { withSlug } from '../adapters/sdd.js';
import { run as git } from '../lib/git.js';

/** What `change apply` will carry from one repo, or why it cannot. */
export interface CarryPlan {
  paths: string[];
  refusals: string[];
  /** The change's feature directory, for spec-kit's per-checkout pointer. */
  featureDir?: string;
}

/**
 * MV-144. The artifact directories this slug owns in one root: the part of each
 * step's artifact up to and including the segment that carries the slug,
 * resolved on disk, in declaration order so the first is the feature directory.
 *
 * Two callers, one answer: the carry moves these directories onto the change's
 * branch in a code repo, and `change close` stages what is inside them in the
 * brain. Deriving it twice is how the two would come to disagree about which
 * files a change owns.
 */
export async function slugArtifactDirs(
  repoDir: string,
  spec: AdapterSpec,
  slug: string,
): Promise<string[]> {
  const dirs = new Set<string>();
  for (const step of spec.steps ?? []) {
    if (!step.artifact?.includes('<slug>')) continue;
    const rel = withSlug(step.artifact, slug);
    const at = rel.split('/').findIndex((p) => p.includes(slug));
    if (at < 0) continue;
    for (const hit of await artifactHit(repoDir, rel)) {
      dirs.add(hit.split('/').slice(0, at + 1).join('/'));
    }
  }
  return [...dirs];
}

/**
 * The SDD files uncommitted in `repoDir` that belong on `slug`'s branch: under
 * the tool's `shared` globs (a `local` path only when it is itself a literal
 * `shared` entry), and under this change's own artifact directories. A tracked
 * file modified here cannot be moved without discarding the edit, and an
 * ignored one cannot be committed at all, so both are refusals, decided before
 * anything is written.
 */
export async function planCarry(repoDir: string, cfg: Config, key: string, slug: string): Promise<CarryPlan> {
  const name = adapterFor(cfg, key, 'sdd');
  const spec = name ? sddSpec(name) : null;
  if (!spec || (await readOnly(cfg, key, repoDir))) return { paths: [], refusals: [] };

  // MV-144: one derivation, asked here for the carry and at close for the brain.
  const dirs = await slugArtifactDirs(repoDir, spec, slug);
  const featureDir: string | undefined = dirs[0];

  const shared = picomatch(spec.shared, { dot: true });
  const local = spec.local.length > 0 ? picomatch(spec.local, { dot: true }) : () => false;
  const literal = new Set(spec.shared);
  const belongs = (p: string): boolean =>
    [...dirs].some((d) => p === d || p.startsWith(`${d}/`)) || (shared(p) && (literal.has(p) || !local(p)));

  const raw = await git(repoDir, ['status', '--porcelain=v1', '-z', '--untracked-files=all']).catch(() => '');
  const paths: string[] = [];
  const refusals: string[] = [];
  const parts = raw.split('\0');
  for (let i = 0; i < parts.length; i++) {
    const entry = parts[i];
    if (entry.length < 4) continue;
    const xy = entry.slice(0, 2);
    const path = entry.slice(3);
    if (xy[0] === 'R' || xy[0] === 'C') i++;
    if (!belongs(path)) continue;
    if (xy === '??') paths.push(path);
    else refusals.push(`${key}: ${path} is tracked and modified here — commit or stash it in ${repoDir}, then re-run`);
  }

  // Ignored files never show in `status`: ask about what is on disk under the
  // shared roots, the part before the first glob character.
  const roots = [...new Set(spec.shared.map((g) => g.split('/').filter((s) => !/[*?[{]/.test(s))[0]).filter(Boolean))];
  for (const r of roots) {
    const listed = await git(repoDir, ['ls-files', '--others', '--ignored', '--exclude-standard', '--', r]).catch(() => '');
    for (const p of listed.split('\n').filter(Boolean)) {
      if (!belongs(p)) continue;
      refusals.push(`${key}: ${p} is ignored, so it cannot be committed — \`git -C ${repoDir} check-ignore -v ${p}\` names the rule`);
    }
  }
  return { paths: paths.sort(), refusals, featureDir };
}

/**
 * Copy `plan.paths` from `repoDir` into `wt`, commit them on the branch there,
 * and remove the originals — so the files land by merge and the checkout no
 * longer holds an untracked copy that stops it. In place (`wt === repoDir`)
 * they are committed where they are. Then spec-kit's per-checkout feature
 * pointer, which `.specify/scripts/bash/common.sh` reads, is written in `wt`.
 */
export async function doCarry(repoDir: string, wt: string, slug: string, plan: CarryPlan, sdd: string): Promise<number> {
  if (plan.paths.length > 0) {
    if (wt !== repoDir) {
      for (const p of plan.paths) {
        await mkdir(dirname(join(wt, p)), { recursive: true });
        await copyFile(join(repoDir, p), join(wt, p));
      }
    }
    await git(wt, ['add', '--', ...plan.paths]);
    // Pathspec'd, and through the hooks like every bookkeeping commit.
    await git(wt, ['commit', '-q', '-m', `change apply: ${slug} — carry the ${sdd} files onto the branch`, '--', ...plan.paths]);
    if (wt !== repoDir) {
      for (const p of plan.paths) await rm(join(repoDir, p), { force: true });
      // And the directories that now hold nothing, deepest first, never the root.
      const parents = [...new Set(plan.paths.flatMap((p) => p.split('/').slice(0, -1).map((_, i, a) => a.slice(0, i + 1).join('/'))))];
      for (const d of parents.sort((a, b) => b.length - a.length)) await rmdir(join(repoDir, d)).catch(() => {});
    }
  }
  if (plan.featureDir && sdd === 'speckit') {
    await mkdir(join(wt, '.specify'), { recursive: true });
    await writeFile(join(wt, '.specify/feature.json'), `${JSON.stringify({ feature_directory: plan.featureDir }, null, 2)}\n`);
  }
  return plan.paths.length;
}
