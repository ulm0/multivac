// Door files on disk: the symlink a harness reads, and what a door already says.
//
// MV-143. This lived in src/commands/doors.ts, where only `doors` could reach
// it. The grapher's own project install runs from `equip` — init, `repos sync`
// and the lifecycle — and it writes the harness's own door file. Running first
// in a root with no link, it leaves a regular CLAUDE.md that MV-108 then
// forbids replacing, so the harness reads the vendor and never the door. The
// link has to exist before the vendor writes, which means both callers need
// this function.

import { lstatSync, readlinkSync, symlinkSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** The canonical door every other target projects from. */
export const CANONICAL_DOOR = 'AGENTS.md';

export interface LinkResult {
  /** True only when this call created the link. */
  created: boolean;
  /** What a human has to resolve, or null when there is nothing to say. */
  notice: string | null;
}

/**
 * `<door>` -> `AGENTS.md` symlink, idempotent.
 *
 * A dangling link is fine and is left alone: measured on graphify 0.9.29, a
 * vendor writing through it creates the canonical door and the door block lands
 * there later. A regular file is never replaced (MV-108) — it is reported, and
 * the harness keeps reading it until a human merges it.
 */
export function linkDoor(dir: string, door: string): LinkResult {
  const link = join(dir, door);
  try {
    const st = lstatSync(link, { throwIfNoEntry: false });
    if (st?.isSymbolicLink()) {
      if (readlinkSync(link) === CANONICAL_DOOR) return { created: false, notice: null };
      return {
        created: false,
        notice: `${door} is a symlink elsewhere — repoint it at ${CANONICAL_DOOR} or remove it`,
      };
    }
    if (st) {
      return {
        created: false,
        notice: `${door} exists as a regular file — merge it into ${CANONICAL_DOOR} and remove it to get the symlink`,
      };
    }
    symlinkSync(CANONICAL_DOOR, link);
    return { created: true, notice: null };
  } catch {
    return {
      created: false,
      notice: `symlink not permitted on this platform — read ${CANONICAL_DOOR} directly, or enable developer mode to get ${door}`,
    };
  }
}

/**
 * Does this root's canonical door already carry the vendor's own section?
 *
 * MV-140: the one fact both surfaces that care about it ask here — `doctor`,
 * which offers the install that would write it, and `installHarness`, which
 * skips a platform whose file would only repeat it. A door that cannot be read
 * has no section.
 */
export async function hasGrapherSection(dir: string, name: string): Promise<boolean> {
  const door = await readFile(join(dir, CANONICAL_DOOR), 'utf8').catch(() => '');
  return new RegExp(`^## ${name}\\b`, 'm').test(door);
}
