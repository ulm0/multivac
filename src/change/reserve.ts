// Invariant ID allocation. The law table IS the registry — no second store:
// the next free ID is written straight back into .multivac/invariants.md as a
// `proposed` row, which verify already knows never blocks. It has to survive a
// concurrent run, so the read-append-write happens under an exclusive lock
// (`wx` — atomic across processes) and lands with a rename.

import { readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join, sep } from 'node:path';
import { LAW_PATH } from '../lib/config.js';
import { ChangeError, changeRel, type ChangeFile } from './file.js';
import { parseClaimRows } from '../anchor/parse.js';
import type { ClaimRow } from '../anchor/parse.js';

const lawPath = (brain: string): string => join(brain, LAW_PATH);

/**
 * A change file as the law table links it: the source column is relative to
 * invariants.md, and both live side by side under `.multivac/`.
 */
const lawRelChange = (slug: string): string => `changes/${slug}.md`;

// MV-119. There was a second parser of the law table here, counting its four
// cells from the left — `statement: cells[2]`, `state: cells[4]`,
// `date: cells[5]`, `source: cells[6]` — while `parseClaimRows`' docstring
// said a second parser is how the two eventually disagree about a row's state.
// They did: for a row whose statement quotes a pipe, this one read prose as
// the state, so the id-collision refusal below never fired. One parser now.

export async function readLaw(brain: string): Promise<{ text: string; rows: ClaimRow[] } | null> {
  let text: string;
  try {
    text = await readFile(lawPath(brain), 'utf8');
  } catch {
    return null;
  }
  return { text, rows: parseClaimRows(text) };
}

const owns = (row: ClaimRow, slug: string): boolean => row.source.includes(lawRelChange(slug));

/**
 * A row still carrying the statement `change new` scaffolds states no rule yet
 * (MV-45). The one place that text is tested for: the release below, the
 * citation gate and the channel read at close all ask this, so a second
 * spelling can never disagree with it.
 */
export const stillReserved = (r: ClaimRow): boolean => r.statement.startsWith('RESERVED by change ');

/**
 * MV-45's "never used", as one predicate: still proposed, still this change's,
 * named by no anchor, and still the scaffolded text. `releaseUnused` drops
 * exactly these rows, and the citation gate (MV-150) exempts exactly these, so
 * the two can never disagree about a reservation.
 */
const unused = (r: ClaimRow, slug: string, anchored: Set<string>): boolean =>
  r.state === 'proposed' && owns(r, slug) && !anchored.has(r.id) && stillReserved(r);

/** The slug a RESERVED statement names, as `reserveIdLocked` writes it — or null. */
const reservedBy = (r: ClaimRow): string | null =>
  /^RESERVED by change (\S+) — /.exec(r.statement)?.[1] ?? null;

/** Next unused ID, keeping the table's own prefix and zero padding (INV-01 default). */
export function nextFreeId(rows: ClaimRow[]): string {
  let prefix = 'INV';
  let width = 2;
  const taken = new Set(rows.map((r) => r.id));
  let max = 0;
  for (const r of rows) {
    const m = /^([A-Za-z][A-Za-z0-9]*)-([0-9]+)$/.exec(r.id);
    if (!m) continue;
    prefix = m[1];
    width = m[2].length;
    max = Math.max(max, Number(m[2]));
  }
  for (let n = max + 1; ; n++) {
    const id = `${prefix}-${String(n).padStart(width, '0')}`;
    if (!taken.has(id)) return id;
  }
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * Exclusive across processes: O_EXCL create is the one primitive that is.
 * Without it two runs read the same table and pick the same ID — the exact
 * collision this exists to stop. Exported so `change new` can reserve AND
 * commit under one lock: two racing `new` runs would otherwise collide on
 * git's own index.lock.
 */
export async function withLawLock<T>(brain: string, fn: () => Promise<T>): Promise<T> {
  const lock = `${lawPath(brain)}.lock`;
  // The critical section now includes the bookkeeping commit — git
  // subprocesses under load can hold the lock well past a second, so the
  // waiter gets ten before it accuses anyone of being stuck.
  for (let i = 0; i < 500; i++) {
    try {
      await writeFile(lock, `${process.pid}\n`, { flag: 'wx' });
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
      await sleep(20);
      continue;
    }
    try {
      return await fn();
    } finally {
      await unlink(lock).catch(() => {});
    }
  }
  throw new ChangeError(
    `${lock} is held by another multivac run — wait for it, or if none is running: rm ${lock}`,
  );
}

/** Append after the last table row / anchor line, so trailing prose survives. */
function insertRow(text: string, row: string): string {
  const lines = text.split('\n');
  let at = lines.length;
  for (let i = lines.length - 1; i >= 0; i--) {
    const t = lines[i].trim();
    if (t.startsWith('|') || t.startsWith('<!--')) {
      at = i + 1;
      break;
    }
  }
  lines.splice(at, 0, row);
  return lines.join('\n');
}

async function writeLaw(brain: string, text: string): Promise<void> {
  const tmp = `${lawPath(brain)}.${process.pid}.tmp`;
  await writeFile(tmp, text);
  await rename(tmp, lawPath(brain));
}

export interface Reservation {
  id: string;
  /** false = the row was already in the table. */
  written: boolean;
  /** State of the pre-existing row, when there was one. */
  state?: string;
}

/**
 * Reserve an ID for `slug`. Without `want`, the next free one. With `want`, that
 * exact ID — and a loud failure when another change is holding it, which is the
 * collision caught at declare time instead of at merge. A row that is already
 * law (any state but `proposed`) is reported back, not refused: it may well be
 * this change's own row, enacted on an earlier run.
 */
export async function reserveId(
  brain: string,
  slug: string,
  want?: string,
): Promise<Reservation> {
  return withLawLock(brain, () => reserveIdLocked(brain, slug, want));
}

/** The body of `reserveId`, for callers already holding the law lock. */
export async function reserveIdLocked(
  brain: string,
  slug: string,
  want?: string,
): Promise<Reservation> {
  const law = await readLaw(brain);
  if (!law) {
    throw new ChangeError(
      `no ${LAW_PATH} in ${brain} — the brain has no law table to allocate from; run \`multivac init\``,
    );
  }
  const id = want ?? nextFreeId(law.rows);
  const existing = law.rows.find((r) => r.id === id);
  if (existing) {
    if (!owns(existing, slug) && existing.state === 'proposed') {
      throw new ChangeError(
        `invariant ${id} is reserved by another change (${
          existing.source || 'unnamed'
        }) — declare ${nextFreeId(law.rows)} instead, in ${changeRel(slug)} and in its anchors`,
      );
    }
    return { id, written: false, state: existing.state };
  }
  const date = new Date().toISOString().slice(0, 10);
  const row =
    `| ${id} | RESERVED by change ${slug} — state the rule here before close. ` +
    `| open | proposed | ${date} | [${lawRelChange(slug)}](${lawRelChange(slug)}) |`;
  await writeLaw(brain, insertRow(law.text, row));
  return { id, written: true };
}

/**
 * Close-time cleanup: a reservation this change never used (still proposed,
 * named by no anchor `verify` parses — `anchored` is that set, MV-150 —
 * statement still the scaffolded RESERVED text, still pointing here) leaves
 * the table. A row the author stated is used, whether
 * or not an anchor names it — the ledger's own instruction is "state the rule
 * here before close", and a stated rule must never evaporate. Returns the IDs.
 */
export async function releaseUnused(
  brain: string,
  slug: string,
  anchored: Set<string>,
): Promise<string[]> {
  return withLawLock(brain, async () => {
    const law = await readLaw(brain);
    if (!law) return [];
    const dead = new Set(law.rows.filter((r) => unused(r, slug, anchored)).map((r) => r.id));
    if (dead.size === 0) return [];
    const kept = law.text
      .split('\n')
      .filter((line) => {
        const cells = line.trim().split('|').map((c) => c.trim());
        return !(line.trim().startsWith('|') && dead.has(cells[1] ?? ''));
      })
      .join('\n');
    await writeLaw(brain, kept);
    return [...dead];
  });
}

/** Where a parsed anchor names a row: its claim ID and the brain-relative file it is written in. */
export type AnchorSite = { claimId: string; file: string };

/** Why a citation line is said. data-model.md orders them; `citeLines` reads them in that order. */
export type CiteKind =
  | 'no-row'
  | 'short-row'
  | 'retired'
  | 'retiring'
  | 'undeclared'
  | 'reserved-elsewhere'
  | 'unstated'
  | 'orphan'
  | 'not-new'
  | 'unclaimed'
  | 'unanchored';

export interface CiteLine {
  id: string;
  kind: CiteKind;
  /** Refuses close; the others are said and never gate. */
  gates: boolean;
  /** `<ID>: <clause>`, as close prints it. */
  text: string;
}

/**
 * The declaration half: what `change plan` can already say, before anything is
 * built or stated. `retiring` is not in it — an unretired row is the ordinary
 * state of a retiring change at plan — nor is `not-new`, which plan's own
 * "already in … not new" line says there.
 */
export const DECLARATION_KINDS: readonly CiteKind[] = [
  'no-row',
  'short-row',
  'retired',
  'undeclared',
  'reserved-elsewhere',
];

/** Built once: the plain and the legacy `unstated` clauses share it. */
const UNSTATED = 'its row states no rule yet — the row is the only place the rule is stated; ';

/**
 * MV-150. Does every claim CITE the law this change makes? A claim is an ID,
 * so the row is the only place the rule is written: a claim of no row, of a
 * row this change never declared, of a retired row, or of a row still reading
 * RESERVED would archive green and cite nothing. One line per claim, the first
 * reason in order, because each later advice is wrong while an earlier one
 * holds. Then the rows this change owns that no claim cites: an added row
 * already in the law, and a proposed row anchored but unclaimed — a proposed
 * row never gates verify, so close is the one gate it meets — refuse; a stated
 * one nothing anchors is said and enters (a process rule in a code-less brain
 * has no code to anchor). A reservation MV-45 gives back raises nothing: the
 * gate exempts exactly what release drops.
 *
 * Pure, over the parsed anchor sites: `close`, `land`, `plan` and `verify`'s
 * finished line all read this one predicate, so no surface can promise what
 * close then refuses (MV-80).
 */
export function citeLines(
  rows: ClaimRow[],
  change: ChangeFile,
  anchors: readonly AnchorSite[],
): CiteLine[] {
  const { slug } = change;
  const byId = new Map(rows.map((r) => [r.id, r]));
  const { adds, touches, retires } = change.invariants;
  const declared = new Set([...adds, ...touches, ...retires]);
  const anchored = new Set(anchors.map((a) => a.claimId));
  // '/'-separated whatever the platform: `changeRel` is, and a win32 join is not.
  const own = changeRel(slug);
  const outside = new Set(
    anchors.filter((a) => a.file.split(sep).join('/') !== own).map((a) => a.claimId),
  );
  const out: CiteLine[] = [];
  const line = (id: string, kind: CiteKind, clause: string, gates = true): void => {
    out.push({ id, kind, gates, text: `${id}: ${clause}` });
  };
  const claimed = new Set<string>();
  for (const c of change.claims) {
    const { id } = c;
    claimed.add(id);
    const r = byId.get(id);
    if (!r) {
      line(id, 'no-row', `no row in ${LAW_PATH} — a claim cites a row of the law; add the row, or drop the claim`);
    } else if (r.state === '' && r.statement === '') {
      line(id, 'short-row', 'its row has fewer than six columns, so nothing is read from it (MV-119) — complete the row');
    } else if (r.state === 'retired' && !retires.includes(id)) {
      line(
        id,
        'retired',
        "retired, and this change does not retire it — drop the claim; its tombstone's absent legs gate every verify run",
      );
    } else if (retires.includes(id) && r.state !== 'retired') {
      line(
        id,
        'retiring',
        `listed under invariants.retires, but its row still reads ${r.state || '?'} — retire the row before ` +
          'close: state retired, its tombstone and absent legs, which this claim then verifies',
      );
    } else if (!declared.has(id)) {
      line(
        id,
        'undeclared',
        'claimed, but this change neither adds, touches nor retires it — drop the claim, or list it under ' +
          'invariants.touches if this change amends that row',
      );
    } else if (stillReserved(r) && (reservedBy(r) ?? slug) !== slug) {
      const by = reservedBy(r);
      line(id, 'reserved-elsewhere', `reserved by change ${by}, which has not stated it — close ${by} first, or drop the claim`);
    } else if (r.statement === '' || stillReserved(r)) {
      line(
        id,
        'unstated',
        UNSTATED +
          (c.statement !== undefined ? "move this claim's legacy statement: into the row" : `state it in ${LAW_PATH}`),
      );
    } else if (anchored.has(id) && !outside.has(id)) {
      line(id, 'orphan', `anchored only in ${own}, which close archives — move the anchor beside the code it pins`);
    }
  }
  const owned = new Set([
    ...adds,
    ...rows.filter((r) => r.state === 'proposed' && owns(r, slug)).map((r) => r.id),
  ]);
  for (const id of owned) {
    const r = byId.get(id);
    if (claimed.has(id) || !r || unused(r, slug, anchored)) continue;
    if (adds.includes(id) && r.state !== 'proposed') {
      line(id, 'not-new', `already in ${LAW_PATH} (${r.state || '?'}) — not new; move it to invariants.touches`);
    } else if (r.state === 'proposed' && anchored.has(id)) {
      line(
        id,
        'unclaimed',
        'added by this change and anchored, but claimed by nothing — close would enter it unverified; ' +
          'claim it, or drop it from invariants.adds and the law',
      );
    } else if (r.state === 'proposed' && r.statement !== '' && !stillReserved(r)) {
      line(
        id,
        'unanchored',
        'enters the law stated but unanchored — nothing verifies it; claim and anchor it to have close verify it',
        false,
      );
    }
  }
  return out;
}

/**
 * MV-150. `--abandon` verifies nothing, so a rule this change stated would
 * enter the law as a proposal nobody checked — and a proposed row never gates.
 * Refused by name; deleting the row is the human's, never this command's. A
 * row still reading RESERVED never refuses: that is the reservation abandon
 * exists to give back. Pure.
 */
export function abandonLines(rows: ClaimRow[], change: ChangeFile): string[] {
  const owned = new Set([
    ...change.invariants.adds,
    ...rows.filter((r) => owns(r, change.slug)).map((r) => r.id),
  ]);
  return rows
    .filter((r) => owned.has(r.id) && r.state === 'proposed' && r.statement !== '' && !stillReserved(r))
    .map(
      (r) =>
        `${r.id}: states a rule this abandoned change never verified — delete the row from ${LAW_PATH} ` +
        '(a proposed row may be removed), or close the change properly',
    );
}
