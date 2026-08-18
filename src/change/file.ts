// .multivac/changes/<slug>.md — the change file: YAML frontmatter + body.
// Parse/serialize/validate, load/save/archive, landing-order plan, close gate.

import { existsSync } from 'node:fs';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { CHANGES_DIR, LAW_PATH } from '../lib/config.js';
import type { VerifyReport } from '../types.js';

export class ChangeError extends Error {}

export const REPO_STATUSES = [
  'planned',
  'branched',
  'committed',
  'mr',
  'landed',
] as const;
export type RepoStatus = (typeof REPO_STATUSES)[number];

/** MV-89: how near an intention is. The whole ordering model — no dates, no
 * estimates, no rank, no dependencies between items. */
export const HORIZONS = ['now', 'next', 'later'] as const;
export type Horizon = (typeof HORIZONS)[number];

export interface ChangeClaim {
  id: string;
  statement: string;
}

export interface ChangeFile {
  slug: string;
  status: 'planned' | 'open' | 'archived';
  /** Set while planned; absence is legal in every state. */
  horizon?: Horizon;
  repos: Record<string, { status: RepoStatus }>;
  /** Ordered stages; repos in one stage may land in parallel. */
  landing_order: string[][];
  invariants: { touches: string[]; adds: string[]; retires: string[] };
  claims: ChangeClaim[];
}

export interface ParsedChange {
  change: ChangeFile;
  body: string;
}

export const changesDir = (brain: string): string => join(brain, CHANGES_DIR);
export const changePath = (brain: string, slug: string): string =>
  join(changesDir(brain), `${slug}.md`);
/** Brain-relative path, for messages: `.multivac/changes/<slug>.md`. */
export const changeRel = (slug: string): string => `${CHANGES_DIR}/${slug}.md`;

function strList(v: unknown, key: string, errs: string[]): string[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) {
    errs.push(`"${key}" must be a list of strings`);
    return [];
  }
  return v as string[];
}

/** Validate a parsed frontmatter object into a ChangeFile, or throw listing every problem. */
export function normalizeChange(raw: unknown, label: string): ChangeFile {
  const errs: string[] = [];
  const o = (
    raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  ) as Record<string, unknown>;
  if (o !== raw) errs.push('frontmatter must be a YAML mapping');

  let slug = '';
  if (typeof o.slug === 'string' && o.slug !== '') slug = o.slug;
  else errs.push('"slug" must be a non-empty string');

  // MV-89: `planned` is a change that has not started — declared, with no
  // branch and no reserved id. The same word `repos.<k>.status` already uses
  // for a repo declared but not branched, because it means the same thing one
  // scale down; a second word would imply a difference that does not exist.
  let status: ChangeFile['status'] = 'open';
  if (o.status === 'planned' || o.status === 'open' || o.status === 'archived') status = o.status;
  else errs.push('"status" must be "planned", "open" or "archived"');

  let horizon: Horizon | undefined;
  if (o.horizon !== undefined && o.horizon !== null) {
    if (HORIZONS.includes(o.horizon as Horizon)) horizon = o.horizon as Horizon;
    else errs.push(`"horizon" must be one of ${HORIZONS.join('|')}`);
  }

  const repos: ChangeFile['repos'] = {};
  const reposRaw = o.repos ?? {};
  if (typeof reposRaw !== 'object' || reposRaw === null || Array.isArray(reposRaw)) {
    errs.push('"repos" must be a mapping key -> { status }');
  } else {
    for (const [k, v] of Object.entries(reposRaw as Record<string, unknown>)) {
      const st = (v as { status?: unknown } | null)?.status;
      if (
        v === null ||
        typeof v !== 'object' ||
        !REPO_STATUSES.includes(st as RepoStatus)
      ) {
        errs.push(`repos.${k}.status must be one of ${REPO_STATUSES.join('|')}`);
        continue;
      }
      repos[k] = { status: st as RepoStatus };
    }
  }

  const lo: string[][] = [];
  const loRaw = o.landing_order ?? [];
  if (!Array.isArray(loRaw)) {
    errs.push('"landing_order" must be a list of stages, each a list of repo keys');
  } else {
    for (const stage of loRaw) {
      if (!Array.isArray(stage) || stage.some((x) => typeof x !== 'string')) {
        errs.push('each landing_order stage must be a list of repo keys');
        continue;
      }
      lo.push(stage as string[]);
    }
  }
  const seen = new Set<string>();
  for (const k of lo.flat()) {
    if (!repos[k]) errs.push(`landing_order names "${k}" which is not in repos`);
    if (seen.has(k)) errs.push(`landing_order lists "${k}" twice`);
    seen.add(k);
  }
  if (lo.length > 0) {
    for (const k of Object.keys(repos)) {
      if (!seen.has(k)) errs.push(`repo "${k}" missing from landing_order — add it to a stage`);
    }
  }

  let invariants: ChangeFile['invariants'] = { touches: [], adds: [], retires: [] };
  const invRaw = o.invariants;
  if (invRaw !== undefined && invRaw !== null) {
    if (typeof invRaw !== 'object' || Array.isArray(invRaw)) {
      errs.push('"invariants" must be a mapping { touches, adds, retires }');
    } else {
      const io = invRaw as Record<string, unknown>;
      invariants = {
        touches: strList(io.touches, 'invariants.touches', errs),
        adds: strList(io.adds, 'invariants.adds', errs),
        retires: strList(io.retires, 'invariants.retires', errs),
      };
    }
  }

  const claims: ChangeClaim[] = [];
  const claimsRaw = o.claims ?? [];
  if (!Array.isArray(claimsRaw)) {
    errs.push('"claims" must be a list of { id, statement }');
  } else {
    for (const c of claimsRaw) {
      const cc = c as { id?: unknown; statement?: unknown } | null;
      if (cc === null || typeof cc.id !== 'string' || typeof cc.statement !== 'string') {
        errs.push('each claim needs a string "id" and "statement"');
        continue;
      }
      claims.push({ id: cc.id, statement: cc.statement });
    }
  }

  if (errs.length > 0) {
    throw new ChangeError(`${label}: ${errs.join('; ')} — fix the frontmatter`);
  }
  return { slug, status, ...(horizon ? { horizon } : {}), repos, landing_order: lo, invariants, claims };
}

/** Prose that YAML cannot hold unquoted: a ": " mapping, a " #" comment, an indicator start. */
const UNSAFE_PLAIN = /:\s|\s#|^[-?:,[\]{}#&*!|>'"%@`]/;

/** `statement: staleness: block` -> `statement: "staleness: block"`, or undefined if that is not the problem. */
function quotedRewrite(line: string): string | undefined {
  const m = /^\s*(?:-\s+)?([\w.-]+):\s+(\S.*?)\s*$/.exec(line);
  if (!m || !UNSAFE_PLAIN.test(m[2])) return undefined;
  // JSON string escapes are a subset of YAML's double-quoted style.
  return `${m[1]}: ${JSON.stringify(m[2])}`;
}

/** Turn a raw YAML parser error into the line, the source, and the fix to type. */
function frontmatterError(label: string, fm: string, e: unknown): ChangeError {
  const err = e as { message?: string; linePos?: { line: number; col: number }[] };
  const fmLine = err.linePos?.[0]?.line;
  const src = fmLine === undefined ? undefined : fm.split('\n')[fmLine - 1];
  // Frontmatter starts on file line 2: line 1 is the opening ---.
  const fileLine = fmLine === undefined ? undefined : fmLine + 1;
  // The parser counts lines inside the frontmatter; drop its position so only ours is quoted.
  const why = (err.message ?? String(e))
    .split('\n')[0]
    .replace(/ at line \d+, column \d+:?$/, '');
  const out = [`${label}: invalid frontmatter YAML${fileLine ? ` at line ${fileLine}` : ''}: ${why}`];
  if (src !== undefined) out.push(`  ${fileLine} | ${src}`);
  const fix = src === undefined ? undefined : quotedRewrite(src);
  out.push(
    fix
      ? `  prose is not YAML — quote the value: ${fix}`
      : '  quote any value holding ": ", " #" or a leading -, or write it as a | block scalar',
  );
  return new ChangeError(out.join('\n'));
}

export function parseChange(text: string, label = 'change file'): ParsedChange {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!m) {
    throw new ChangeError(
      `${label}: missing YAML frontmatter — start the file with --- and declare slug/status/repos`,
    );
  }
  let raw: unknown;
  try {
    raw = parse(m[1]);
  } catch (e) {
    throw frontmatterError(label, m[1], e);
  }
  const body = text.slice(m[0].length).replace(/^\n/, '');
  return { change: normalizeChange(raw, label), body };
}

export function serializeChange(change: ChangeFile, body: string): string {
  const fm = stringify(
    {
      slug: change.slug,
      status: change.status,
      // Written only when set: an unconditional key would grow a `horizon: null`
      // line on every existing change file the next lifecycle step rewrites.
      ...(change.horizon ? { horizon: change.horizon } : {}),
      repos: change.repos,
      landing_order: change.landing_order,
      invariants: change.invariants,
      claims: change.claims,
    },
    // lineWidth: 0 — never fold prose onto continuation lines: the writer's
    // statement comes back the way it was written. Quoting is the library's job.
    { lineWidth: 0 },
  );
  const b = body === '' || body.endsWith('\n') ? body : `${body}\n`;
  return `---\n${fm}---\n\n${b}`;
}

export function scaffoldChange(slug: string, title: string): ParsedChange {
  return {
    change: {
      slug,
      status: 'open',
      repos: {},
      landing_order: [],
      invariants: { touches: [], adds: [], retires: [] },
      claims: [],
    },
    body: `# ${title}\n\nDeclare repos, landing_order, invariants and claims in the frontmatter,\nthen run \`multivac change plan ${slug}\`. For example:\n\n    # repos: { api: { status: planned } } — ${REPO_STATUSES.join('|')}\n    # landing_order: [[api]] — stages; earlier stages land first\n    # claims: [{ id: <ID>, statement: "..." }] — what close verifies\n\nStatements are prose: quote any value holding a colon —\n\`statement: "staleness: block"\`.\n\nmultivac owns the frontmatter formatting: every lifecycle step rewrites it, so\nhand-tuned layout will not survive. Values round-trip unchanged; the body,\nbelow the closing ---, is yours.\n`,
  };
}

/**
 * MV-89: the change file an intention starts as. Same directory, same schema,
 * one state earlier — so starting it is a status flip rather than a copy, and
 * the prose written when the idea was young survives into the work.
 *
 * Reserves nothing. The invariant id is allocated when the change starts, and
 * an id spent on work that never happens is a hole in the table no later
 * change can fill.
 */
export function scaffoldPlanned(slug: string, title: string, horizon: Horizon): ParsedChange {
  return {
    change: {
      slug,
      status: 'planned',
      horizon,
      repos: {},
      landing_order: [],
      invariants: { touches: [], adds: [], retires: [] },
      claims: [],
    },
    body: `# ${title}\n\nWhy this matters, written while you still remember. This file is the change\nit will become: starting it keeps this prose and adds the branch, the reserved\ninvariant id and the rest of the frontmatter.\n\n    multivac change new ${slug}\n\nUntil then it reserves nothing and blocks nothing.\n`,
  };
}

/**
 * MV-89: every lifecycle step after `new` refuses a change that has not
 * started. Without this, `plan` would resolve repos for an intention and
 * `close` would archive one, both of which read as progress on work nobody
 * began.
 */
export function assertStarted(change: ChangeFile): void {
  if (change.status !== 'planned') return;
  throw new ChangeError(
    `${change.slug} is planned, not started — start it first: multivac change new ${change.slug}`,
  );
}

export async function loadChange(brain: string, slug: string): Promise<ParsedChange> {
  const file = changePath(brain, slug);
  let text: string;
  try {
    text = await readFile(file, 'utf8');
  } catch {
    // Archived is not missing, and the difference matters: telling someone to
    // `change new` a slug that already closed scaffolds a duplicate and burns
    // a second reserved id.
    const archived = join(changesDir(brain), 'archive', `${slug}.md`);
    if (existsSync(archived)) {
      throw new ChangeError(
        `${slug} is already archived at ${CHANGES_DIR}/archive/${slug}.md — this change is closed; ` +
          `start a new one with a new slug, or read it there`,
      );
    }
    throw new ChangeError(
      `no ${changeRel(slug)} — run \`multivac change new ${slug} "<title>"\` first`,
    );
  }
  const parsed = parseChange(text, changeRel(slug));
  if (parsed.change.slug !== slug) {
    throw new ChangeError(
      `${changeRel(slug)}: frontmatter slug "${parsed.change.slug}" does not match the filename — fix the slug`,
    );
  }
  return parsed;
}

export async function saveChange(brain: string, parsed: ParsedChange): Promise<void> {
  await mkdir(changesDir(brain), { recursive: true });
  await writeFile(
    changePath(brain, parsed.change.slug),
    serializeChange(parsed.change, parsed.body),
  );
}

/**
 * Repoint every law row whose source column cites this change at its archived
 * path. Returns how many links moved.
 *
 * A row written while its change was open cites `changes/<slug>.md`, and the
 * moment that change closes the file is somewhere else — so the table ends up
 * disagreeing with its own schema: rows written after an archive already use
 * `changes/archive/<slug>.md`, rows written before it point at nothing. The
 * law is this tool's whole claim to being checkable, and a citation that
 * resolves to a missing file is exactly the rot anchors exist to prevent.
 *
 * Only the change being archived is rewritten, and only the `changes/<slug>`
 * form — an already-archived link is left alone, so this is idempotent.
 */
export async function repointLawLinks(brain: string, slug: string): Promise<number> {
  const law = join(brain, LAW_PATH);
  let md: string;
  try {
    md = await readFile(law, 'utf8');
  } catch {
    return 0; // no law file yet: a newborn brain archives nothing to repoint
  }
  // The link target as it is WRITTEN, which is relative to invariants.md's own
  // directory — `changes/<slug>.md`, not the brain-relative CHANGES_DIR. Only
  // inside `(...)`: the body of a row may legitimately name the change in
  // prose without citing it, and prose must not be rewritten.
  const from = `(changes/${slug}.md)`;
  const to = `(changes/archive/${slug}.md)`;
  const moved = md.split(from).length - 1;
  if (moved === 0) return 0;
  await writeFile(law, md.split(from).join(to));
  return moved;
}

/** Archive: status -> archived, file moves to <changes>/archive/<slug>.md. Returns dest path. */
export async function archiveChange(brain: string, parsed: ParsedChange): Promise<string> {
  parsed.change.status = 'archived';
  const dir = join(changesDir(brain), 'archive');
  await mkdir(dir, { recursive: true });
  const dest = join(dir, `${parsed.change.slug}.md`);
  await writeFile(dest, serializeChange(parsed.change, parsed.body));
  await unlink(changePath(brain, parsed.change.slug));
  // The move is only half the archive: the law still cites the old path.
  await repointLawLinks(brain, parsed.change.slug);
  return dest;
}

export type StageState = 'landed' | 'ready' | 'blocked';
export interface Stage {
  repos: string[];
  state: StageState;
}

/**
 * Landing plan: stages in declared order. A stage is landed when every repo in
 * it landed, ready when it is the first unlanded stage, blocked otherwise.
 * Empty landing_order = one stage of all repos.
 */
export function landingPlan(c: ChangeFile): Stage[] {
  const keys = Object.keys(c.repos);
  const stages = c.landing_order.length > 0 ? c.landing_order : keys.length > 0 ? [keys] : [];
  let earlierUnlanded = false;
  return stages.map((repos) => {
    const allLanded = repos.every((k) => c.repos[k]?.status === 'landed');
    const state: StageState = allLanded ? 'landed' : earlierUnlanded ? 'blocked' : 'ready';
    if (!allLanded) earlierUnlanded = true;
    return { repos, state };
  });
}

/** Close gate: every declared claim must verify ok (moved = self-healed, passes). */
export function closeGate(
  report: VerifyReport,
  claimIds: string[],
): { ok: boolean; lines: string[] } {
  const byId = new Map(report.claims.map((c) => [c.claimId, c]));
  const lines: string[] = [];
  let ok = true;
  for (const id of claimIds) {
    const c = byId.get(id);
    if (!c) {
      ok = false;
      lines.push(`${id}: no anchors evaluated — add an anchor for the claim, then re-run close`);
      continue;
    }
    if (c.state === 'ok' || c.state === 'moved') {
      lines.push(`${id}: ${c.state}`);
      continue;
    }
    ok = false;
    const detail = c.legs.map((l) => l.detail).filter(Boolean).join('; ');
    lines.push(
      `${id}: ${c.state}${detail ? ` — ${detail}` : ''} — make the claim true or fix the anchor, then re-run close`,
    );
  }
  return { ok, lines };
}
