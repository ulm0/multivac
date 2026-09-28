// MV-133. A change's SDD files belong on the change's branch. `/speckit.specify`
// and its siblings write `specs/<n>-<slug>/` into the checkout, and `change
// apply` created the worktree from the last commit, where that directory does
// not exist: measured on every change from 052 to 057 in this repository, the
// directory was copied into the worktree by hand, and the untracked copy left
// behind stopped `git merge` until it was deleted by hand. An SDD that `equip`
// installed was left the same way, on no branch at all.

import { copyFile, mkdir, readdir, readFile, rm, rmdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import picomatch from 'picomatch';
import type { Config } from '../types.js';
import { adapterFor, artifactHit, readOnly } from '../adapters/detect.js';
import { sddSpec, type AdapterSpec } from '../adapters/registry.js';
import { withSlug } from '../adapters/sdd.js';
import { run as git } from '../lib/git.js';
import { initState } from '../lib/init-state.js';

/** What `change apply` will carry from one repo, or why it cannot. */
export interface CarryPlan {
  paths: string[];
  refusals: string[];
  /** The change's feature directory, for the tool's per-checkout pointer (MV-146). */
  featureDir?: string;
}

/**
 * The index of the path segment that carries the slug, read off the TEMPLATE.
 * Read off the substituted path it was the first segment CONTAINING the slug,
 * so slug `spec` found `specs`, `change` found `changes`, and `open` found
 * `openspec`: the pointer then named the root of every feature directory, and
 * close cited it and staged other changes' work in progress (MV-146).
 */
const slugSegment = (artifact: string): number => artifact.split('/').findIndex((p) => p.includes('<slug>'));

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
    const at = slugSegment(step.artifact);
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
 * they are committed where they are. Then the tool's per-checkout feature
 * pointer — spec-kit's, which `.specify/scripts/bash/common.sh` reads — names
 * the change's directory in `wt`.
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
  const spec = sddSpec(sdd);
  if (plan.featureDir && spec) await pointFeature(wt, spec, plan.featureDir);
  return plan.paths.length;
}

/**
 * MV-146. Point the tool's per-checkout feature pointer in `dir` at
 * `featureDir`, and return what it named before, or null. spec-kit's steps
 * resolve the directory they write into from `.specify/feature.json`, and two
 * changes open in one checkout share that file: `/speckit.plan` run for one
 * wrote into the other's directory, whose gate then passed.
 *
 * Read off the registry, never a tool name: a spec with no pointer is a no-op.
 * Nothing is written where the tool's state probe does not say installed
 * (MV-124): no script there reads the pointer, and the file alone keeps a
 * directory the probe then reads as a partial install, which the scaffold
 * never runs over — as happened when the carry moved every other file of an
 * untracked install onto a change's branch. The file's other keys are kept.
 */
export async function pointFeature(dir: string, spec: AdapterSpec, featureDir: string): Promise<string | null> {
  if (!spec.pointer) return null;
  if ((await initState(spec, dir)).state !== 'installed') return null;
  const file = join(dir, spec.pointer.path);
  let held: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(await readFile(file, 'utf8'));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) held = parsed as Record<string, unknown>;
  } catch {
    /* absent or unreadable: the pointer is written fresh */
  }
  const was = held[spec.pointer.key];
  const prev = typeof was === 'string' ? was : null;
  if (prev === featureDir) return prev;
  await writeFile(file, `${JSON.stringify({ ...held, [spec.pointer.key]: featureDir }, null, 2)}\n`);
  return prev;
}

/** The key of the entry that is the brain, `brain` when the brain is no declared entry. */
const brainKey = (cfg: Config): string => Object.entries(cfg.repos).find(([, e]) => e.isBrain)?.[0] ?? 'brain';

/**
 * MV-146. The slug's feature directory and the root holding it: the brain
 * checkout first, then the change's worktree named by the brain entry's key —
 * where the carry moved it in brain==code, until the landed branch reaches the
 * checkout. Null when neither holds one.
 */
export async function featureHome(
  brain: string,
  cfg: Config,
  spec: AdapterSpec,
  slug: string,
): Promise<{ root: string; dir: string } | null> {
  for (const root of [brain, join(brain, '.multivac', 'worktrees', slug, brainKey(cfg))]) {
    const [dir] = await slugArtifactDirs(root, spec, slug);
    if (dir !== undefined) return { root, dir };
  }
  return null;
}

/**
 * MV-146. Every directory `change close` stages for this slug in the brain,
 * whatever `sdd_auto` or `--no-sdd` say: the slug's artifact directories on
 * disk (MV-144's one derivation), each slug-literal one git reports a
 * deletion under — an archive moved it, and the deletion lands with the
 * addition that replaced it — and, for a step that records a merge, each main
 * spec file it merged into. Measured on openspec 1.13.2: after `openspec
 * archive`, close left the moved-from `openspec/changes/<slug>/` and the merged
 * `openspec/specs/<cap>/spec.md` out of its commit and named them dirty.
 */
export async function closeOwnedDirs(brainDir: string, spec: AdapterSpec, slug: string): Promise<string[]> {
  const dirs = new Set(await slugArtifactDirs(brainDir, spec, slug));
  const literal = new Set<string>();
  for (const step of spec.steps ?? []) {
    if (!step.artifact?.includes('<slug>')) continue;
    const parts = withSlug(step.artifact, slug).split('/');
    const top = parts.slice(0, slugSegment(step.artifact) + 1);
    if (!top.some((p) => p.includes('<n>'))) literal.add(top.join('/'));
    if (!step.merges) continue;
    // Where the step archived to, then each file it holds under `from`, at the
    // same place under `into`: the main spec it merged into. The file, never
    // its capability's directory — the archive merges `<cap>/spec.md`, and a
    // human's edit beside it in `<into>/<cap>/` is named dirty, never staged
    // (MV-46).
    for (const hit of await artifactHit(brainDir, top.join('/'))) {
      const from = join(brainDir, hit, step.merges.from);
      const held = await readdir(from, { recursive: true, withFileTypes: true }).catch(() => []);
      for (const f of held) {
        if (f.isFile()) dirs.add(`${step.merges.into}/${relative(from, join(f.parentPath, f.name)).split(sep).join('/')}`);
      }
    }
  }
  const gone = [...literal].filter((d) => !dirs.has(d));
  if (gone.length > 0) {
    const raw = await git(brainDir, ['status', '--porcelain=v1', '-z', '--', ...gone]).catch(() => '');
    const entries = raw.split('\0');
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry.length < 4) continue;
      // A rename's second NUL field is its old path, not an entry of its own.
      if (entry[0] === 'R' || entry[0] === 'C') i++;
      if (!entry.slice(0, 2).includes('D')) continue;
      for (const d of gone) if (entry.slice(3).startsWith(`${d}/`)) dirs.add(d);
    }
  }
  return [...dirs];
}
