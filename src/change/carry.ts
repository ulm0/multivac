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
 * A text as the merge check compares it: a leading BOM dropped, CRLF (or a
 * lone CR) turned to LF, trailing whitespace stripped per line, and runs of
 * blank lines collapsed to one — what openspec 1.13.2 does to a block it
 * writes into a main spec, except that it keeps trailing whitespace, which is
 * stripped here on both sides so the two cannot disagree over it.
 */
const settled = (text: string): string =>
  text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

/** The two delta sections an archive merges from, their titles folded as openspec 1.13.2 folds them. */
const MERGED_SECTIONS = new Set(['added requirements', 'modified requirements']);
/** openspec 1.13.2's requirement header (parsers/requirement-blocks.js), any case. */
const REQUIREMENT = /^###\s*Requirement:\s*(.+)\s*$/i;
const SECTION = /^##\s+(.+)$/;

/**
 * Which lines sit in a fenced code block, fence lines included — openspec
 * 1.13.2's `buildCodeFenceMask` (parsers/code-fence.js): three or more
 * backticks or tildes, indented or not, open a fence that only a bare run of
 * the same character, at least as long, closes. A header inside one is an
 * example, never a section or a requirement, to the archive and so to this.
 */
function fenceMask(lines: string[]): boolean[] {
  const mask = new Array<boolean>(lines.length).fill(false);
  let open: { marker: string; length: number } | null = null;
  for (let i = 0; i < lines.length; i++) {
    if (!open) {
      const m = /^\s*(`{3,}|~{3,})/.exec(lines[i]);
      if (m) {
        open = { marker: m[1][0], length: m[1].length };
        mask[i] = true;
      }
      continue;
    }
    mask[i] = true;
    const close = /^\s*(`{3,}|~{3,})\s*$/.exec(lines[i]);
    if (close && close[1][0] === open.marker && close[1].length >= open.length) open = null;
  }
  return mask;
}

interface RequirementBlock {
  name: string;
  raw: string;
}

/**
 * The requirement blocks of `lines[from, to)` — a section's body, which holds
 * no unfenced `## ` line — read as openspec 1.13.2 reads them: each runs from
 * an unfenced `### Requirement:` line to the next one, trailing whitespace
 * trimmed, and keeps any other `### ` line inside it; its name loses a closing
 * run of `#`s. A delta's block is written into the main spec whole, so it is
 * compared whole.
 */
function blocksIn(lines: string[], mask: boolean[], from: number, to: number): RequirementBlock[] {
  const blocks: RequirementBlock[] = [];
  let block: { name: string; lines: string[] } | null = null;
  const end = (): void => {
    if (block) blocks.push({ name: block.name, raw: block.lines.join('\n').trimEnd() });
    block = null;
  };
  for (let i = from; i < to; i++) {
    const header = mask[i] ? null : REQUIREMENT.exec(lines[i]);
    if (header) {
      end();
      block = { name: header[1].replace(/[ \t]+#+[ \t]*$/, '').trim(), lines: [lines[i]] };
      continue;
    }
    block?.lines.push(lines[i]);
  }
  end();
  return blocks;
}

/**
 * Each requirement block under a delta's ADDED and MODIFIED sections, every
 * copy of either header included, as `parseDeltaSpec` finds them: sections
 * split at unfenced `## ` lines, titles folding case (`## Added Requirements`
 * is merged too), so a block the archive merged is never mistaken for no
 * block, and a header inside a fenced example is never taken for one.
 */
function deltaBlocks(text: string): RequirementBlock[] {
  const lines = text.split('\n');
  const mask = fenceMask(lines);
  const heads: { title: string; at: number }[] = [];
  lines.forEach((l, i) => {
    const m = mask[i] ? null : SECTION.exec(l);
    if (m) heads.push({ title: m[1].trim().toLowerCase(), at: i });
  });
  return heads.flatMap((h, k) =>
    MERGED_SECTIONS.has(h.title) ? blocksIn(lines, mask, h.at + 1, heads[k + 1]?.at ?? lines.length) : [],
  );
}

/**
 * The requirement blocks of a main spec's `## Requirements` section, as
 * `extractRequirementsSection` finds them — the section the archive rebuilds;
 * none when it has no such section.
 */
function specBlocks(text: string): RequirementBlock[] {
  const lines = text.split('\n');
  const mask = fenceMask(lines);
  const start = lines.findIndex((l, i) => !mask[i] && /^##\s+Requirements\s*$/i.test(l));
  if (start < 0) return [];
  let end = start + 1;
  while (end < lines.length && (mask[end] || !/^##\s+/.test(lines[end]))) end++;
  return blocksIn(lines, mask, start + 1, end);
}

/**
 * MV-147. Whether the main spec `target` carries the merge of the archived
 * `delta` (both relative to `brainDir`): every requirement block under the
 * delta's ADDED and MODIFIED sections is, whole, a block of the same name in
 * the target's `## Requirements` section, both texts `settled` and both read
 * as openspec 1.13.2 reads them. A delta with no such block — REMOVED or
 * RENAMED only, or none at all — carries trivially, and is staged as MV-146
 * staged it. An unreadable file carries nothing: it is named, never staged on
 * a guess.
 *
 * Whole blocks, never a substring: a MODIFIED block that only drops the end
 * of a line is a substring of the requirement it replaces, so after a
 * `--skip-specs` archive the unmerged spec read as carrying it and close
 * staged a human's edit beside it. Found at review, with openspec 1.13.2's
 * validator passing each delta: that one; a block holding a fenced `## `
 * sample, or a `### ` line that is not a requirement, which a reader stopping
 * at either compared by its unchanged head; and a fenced `## ADDED
 * Requirements` example under REMOVED, which a reader blind to fences took
 * for a block to carry, naming a real merge dirty.
 *
 * Measured on openspec 1.13.2: `archive --json --yes` writes each block
 * verbatim, CRLF turned to LF, a run of blank lines collapsed to one;
 * `--json --skip-specs` moves the change and leaves the main specs as they
 * were, a human's uncommitted edit included. Staging every target, as MV-146
 * did, swept that edit into the archive commit; staging a target that is new
 * to HEAD would sweep a human's untracked draft of it the same way, so
 * tracked and untracked are asked alike. Reading `specsUpdated` instead would
 * mean keeping output nobody kept: close reads the disk.
 */
export async function carriesMerge(brainDir: string, delta: string, target: string): Promise<boolean> {
  const text = await readFile(join(brainDir, delta), 'utf8').catch(() => null);
  if (text === null) return false;
  const blocks = deltaBlocks(settled(text));
  if (blocks.length === 0) return true;
  const into = await readFile(join(brainDir, target), 'utf8').catch(() => null);
  if (into === null) return false;
  const held = specBlocks(settled(into));
  return blocks.every((b) => held.some((h) => h.name === b.name && h.raw === b.raw));
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
 *
 * MV-147: a main spec file is in `dirs` only when it carries the merge
 * (`carriesMerge`); one the archive did not merge into — `--skip-specs`, or a
 * human's edit over the merge — is in `uncarried`, for close to name and
 * leave out.
 */
export async function closeOwnedDirs(
  brainDir: string,
  spec: AdapterSpec,
  slug: string,
): Promise<{ dirs: string[]; uncarried: string[] }> {
  const dirs = new Set(await slugArtifactDirs(brainDir, spec, slug));
  const uncarried = new Set<string>();
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
    //
    // MV-147: only the file the tool merges, found where the tool looks for
    // it — in a capability's directory, never at the root of `from` and never
    // under a dot-directory, as openspec 1.13.2's discoverSpecFiles walks.
    // Mapping every file there staged a human's untracked notes.md beside a
    // merged spec.md, a file no archive writes.
    for (const hit of await artifactHit(brainDir, top.join('/'))) {
      const from = join(brainDir, hit, step.merges.from);
      const held = await readdir(from, { recursive: true, withFileTypes: true }).catch(() => []);
      for (const f of held) {
        if (!f.isFile() || f.name !== step.merges.file) continue;
        const rel = relative(from, join(f.parentPath, f.name)).split(sep).join('/');
        const segs = rel.split('/');
        if (segs.length < 2 || segs.some((s) => s.startsWith('.'))) continue;
        const target = `${step.merges.into}/${rel}`;
        if (await carriesMerge(brainDir, `${hit}/${step.merges.from}/${rel}`, target)) dirs.add(target);
        else uncarried.add(target);
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
  // Two archives of one slug can name one target; carried by either, it is staged.
  return { dirs: [...dirs], uncarried: [...uncarried].filter((p) => !dirs.has(p)) };
}
