// Invariant ID allocation. The law table IS the registry — no second store:
// the next free ID is written straight back into .multivac/invariants.md as a
// `proposed` row, which verify already knows never blocks. It has to survive a
// concurrent run, so the read-append-write happens under an exclusive lock
// (`wx` — atomic across processes) and lands with a rename.

import { readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { LAW_PATH } from '../lib/config.js';
import { ChangeError, changeRel } from './file.js';
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
 * still unanchored, statement still the scaffolded RESERVED text, still
 * pointing here) leaves the table. A row the author stated is used, whether
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
    const dead = new Set(
      law.rows
        .filter(
          (r) =>
            r.state === 'proposed' &&
            owns(r, slug) &&
            !anchored.has(r.id) &&
            r.statement.startsWith('RESERVED by change '),
        )
        .map((r) => r.id),
    );
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
