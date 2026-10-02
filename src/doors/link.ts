// Door files on disk: the symlink a harness reads.
//
// MV-143. A harness's own door file that is a regular file is never replaced
// (MV-108), so the link is made before anything else writes there; `doors`
// makes it for every symlink target it projects.

import { lstatSync, readlinkSync, symlinkSync } from 'node:fs';
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
 * A dangling link is fine and is left alone: whatever writes through it
 * creates the canonical door, and the door block lands there later. A regular
 * file is never replaced (MV-108) — it is reported, and the harness keeps
 * reading it until a human merges it.
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
