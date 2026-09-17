// MV-137. Code lands inside a started change. With an SDD declared and its
// automation on, the lifecycle refuses to move without the SDD's artifacts —
// and nothing stopped a commit of code on `main`, a local merge of any branch,
// or a push made with `--no-verify`. This is the one place that decides, for
// the three readers: the commit being composed (pre-commit), the merge being
// composed (pre-merge-commit), and a CI range (`verify --range`).
//
// It proves the code went through the branch of an open change that declares
// the repo. It never proves the change is ABOUT that code, and a hook can be
// skipped: only a forge that requires the MR pipeline and protects the default
// branch makes the range reader binding, and that is not on disk (`doctor`).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import picomatch from 'picomatch';
import type { Config } from '../types.js';
import { changesDir, parseChange, type ChangeFile } from '../change/file.js';
import { adapterFor } from '../adapters/detect.js';
import { doorTargets, grapherSpec, sddSpec } from '../adapters/registry.js';
import { CHANGES_DIR } from './config.js';
import { dim, red } from './out.js';
import { currentBranch, run as git } from './git.js';

export interface CodeLine {
  text: string;
  gates: boolean;
}

/** Paths multivac, a door, the SDD or the grapher own: never "code" (MV-137). */
export function nonCodeGlobs(cfg: Config): string[] {
  // MV-142: `.gitignore` too. `init`, the SDD and the grapher write their
  // ignore lines there, and a fresh brain's step 0 commit carries it.
  const out = new Set<string>(['.multivac/**', '.gitmodules', `${cfg.mount}/**`, `${cfg.mount}`, '.husky/**', '.gitignore']);
  // A harness's own directory holds what its tools install for it — skills,
  // commands, rules, hook configs (spec-kit, OpenSpec and graphify all write
  // there) — so the directory is the harness's, not code. `.github` is not a
  // harness directory: only the door file inside it is.
  const harness = (p: string): void => {
    const top = p.split('/')[0];
    out.add(p.includes('/') && top.startsWith('.') && top !== '.github' ? `${top}/**` : p);
  };
  for (const t of Object.values(doorTargets)) {
    harness(t.door);
    if (t.skill) harness(t.skill);
    if (t.hookConfig) harness(t.hookConfig.path);
  }
  out.add('AGENTS.md');
  const names = new Set<string>();
  for (const key of ['brain', ...Object.keys(cfg.repos)]) {
    const s = adapterFor(cfg, key, 'sdd');
    const g = adapterFor(cfg, key, 'grapher');
    if (s) names.add(`sdd:${s}`);
    if (g) names.add(`grapher:${g}`);
  }
  for (const n of names) {
    const [kind, name] = n.split(':');
    const spec = kind === 'sdd' ? sddSpec(name) : grapherSpec(name, cfg.graphers);
    if (!spec) continue;
    for (const p of [...spec.shared, ...spec.local, ...spec.artifacts]) out.add(p);
    for (const step of spec.steps ?? []) if (step.artifact) out.add(`${step.artifact.split('/')[0]}/**`);
    for (const p of spec.projectSteps ?? []) out.add(p.artifact);
    if (spec.graphignoreFile) out.add(spec.graphignoreFile);
    for (const f of spec.harness?.hookFiles ?? []) harness(f);
    for (const pl of Object.values(spec.harness?.platforms ?? {})) harness(pl.probe);
  }
  return [...out];
}

async function readChange(brainDir: string, slug: string, rev: string | null, dir = CHANGES_DIR): Promise<ChangeFile | null> {
  const rel = `${dir}/${slug}.md`;
  try {
    const text = rev === null
      ? readFileSync(join(changesDir(brainDir), `${slug}.md`), 'utf8')
      : await git(brainDir, ['show', `${rev}:${rel}`]);
    return parseChange(text, `${slug}.md`).change;
  } catch {
    return null;
  }
}

async function commitPaths(repoDir: string, base: string, head: string): Promise<string[] | null> {
  const ok = await git(repoDir, ['rev-parse', '--verify', '-q', `${base}^{commit}`]).then(() => true, () => false);
  if (!ok) return null;
  const revs = (await git(repoDir, ['rev-list', '--no-merges', `${base}..${head}`]).catch(() => '')).split('\n').filter(Boolean);
  const paths = new Set<string>();
  for (const c of revs) {
    const t = await git(repoDir, ['diff-tree', '--no-commit-id', '--name-only', '-r', '-z', c]).catch(() => '');
    for (const p of t.split('\0').filter(Boolean)) paths.add(p);
  }
  return [...paths];
}

export interface CodeInChangeOpts {
  brainDir: string;
  cfg: Config;
  /** The declared repo being committed in; undefined when it holds no code (a brain that is not code). */
  repoKey: string | undefined;
  repoDir: string;
  /** A consumer reads a mounted brain, which can lag the change: it gates only under --strict. */
  consumer: boolean;
  strict: boolean;
  /** CI: judge the non-merge commits of `base..head` against `branch`. */
  range?: { base: string; head: string; branch: string };
}

/** The code-in-change verdict, or null when the check does not apply. */
export async function codeInChangeLine(o: CodeInChangeOpts): Promise<CodeLine | null> {
  const { cfg, repoKey } = o;
  if (repoKey === undefined || !cfg.sddAuto || adapterFor(cfg, repoKey, 'sdd') === undefined) return null;
  const label = 'code'.padEnd(9);
  const unanswered = (why: string): CodeLine => ({
    text: `  ${o.strict ? red(label) : dim(label)} not answered — ${why}${o.strict ? ' · blocking under --strict' : ''}`,
    gates: o.strict,
  });

  const paths = o.range
    ? await commitPaths(o.repoDir, o.range.base, o.range.head)
    : await git(o.repoDir, ['diff', '--cached', '--name-only', '-z'], true).then((t) => t.split('\0').filter(Boolean), () => null);
  if (paths === null) {
    return unanswered(o.range ? `base ${o.range.base} is not in this clone — fetch the whole history (GIT_DEPTH: 0)` : 'the index could not be read here');
  }
  const nonCode = picomatch(nonCodeGlobs(cfg), { dot: true });
  const code = paths.filter((p) => !nonCode(p));
  if (code.length === 0) return null;

  // Which change this commit claims to belong to: the branch, or for a merge
  // being composed, the branches at MERGE_HEAD.
  let candidates: string[];
  if (o.range) candidates = [o.range.branch];
  else {
    const merging = await git(o.repoDir, ['rev-parse', '-q', '--verify', 'MERGE_HEAD']).catch(() => '');
    // In `pre-merge-commit` git has not written MERGE_HEAD yet (measured on git
    // 2.5x: it appears only once the hook has passed or refused); what is being
    // merged is in GIT_REFLOG_ACTION, `merge <ref>...`, options left out.
    const action = /^merge (.+)$/.exec(process.env.GIT_REFLOG_ACTION ?? '');
    candidates = merging
      ? (await git(o.repoDir, ['for-each-ref', '--points-at', merging, '--format=%(refname:short)', 'refs/heads']).catch(() => '')).split('\n').filter(Boolean)
      : action
        ? action[1].split(/\s+/).filter((a) => a !== '' && !a.startsWith('-')).map((a) => a.replace(/^refs\/heads\//, ''))
        : [(await currentBranch(o.repoDir)) ?? ''].filter(Boolean);
  }
  const n = `${code.length} code path${code.length > 1 ? 's' : ''} (${code.slice(0, 3).join(', ')}${code.length > 3 ? ', …' : ''})`;
  const brainRepo = !o.consumer;
  for (const cand of candidates) {
    const closing = cand.startsWith('close-');
    const slug = closing ? cand.slice('close-'.length) : cand;
    // `close-<slug>` archives the change, so it is read where it was still open.
    const rev = brainRepo && closing ? (o.range ? o.range.base : 'HEAD') : brainRepo && o.range ? o.range.head : null;
    let ch = await readChange(o.brainDir, slug, rev);
    // MV-142: a change landed through one merge request is closed on its own
    // branch, so at the range's head it is archived. Archived at the head and
    // not at the base means it was open inside this range, which is where the
    // code came in; archived at the base means it was already closed.
    if (!ch && brainRepo && o.range && !closing) {
      const closedHere = await readChange(o.brainDir, slug, o.range.head, `${CHANGES_DIR}/archive`);
      const closedBefore = await readChange(o.brainDir, slug, o.range.base, `${CHANGES_DIR}/archive`);
      if (closedHere && !closedBefore) ch = { ...closedHere, status: 'open' };
    }
    if (!ch || ch.status !== 'open') continue;
    if (!(repoKey in ch.repos)) {
      return {
        text: `  ${red(label)} ${n} on ${cand}, whose change does not declare ${repoKey} — add ${repoKey} to its repos:, or commit this on the branch of a change that does · blocking`,
        gates: true,
      };
    }
    const skipped = ch.sdd_skipped?.length ? ` · SDD skipped at ${ch.sdd_skipped.join(', ')}` : '';
    return { text: `  ${dim(label)} ${n} lands in open change ${slug}${skipped}`, gates: false };
  }
  const where = o.range ? `branch ${o.range.branch}` : candidates.length > 0 ? `${candidates.join(', ')}` : 'a detached HEAD';
  const fix = `start a change (\`multivac change new <slug>\`, then \`change apply\`) and commit on its branch`;
  if (o.consumer && !o.strict) {
    return {
      text: `  ${dim(label)} ${n} on ${where}, which is no open change in the mounted brain — ${fix}; the mount can lag, so \`verify --strict\` in CI decides`,
      gates: false,
    };
  }
  return { text: `  ${red(label)} ${n} on ${where}, which is no open change declaring ${repoKey} — ${fix} · blocking`, gates: true };
}
