// Managed-block engine. Everything multivac writes into a pre-existing file
// lives between BEGIN/END markers; the rest of the file is the user's,
// byte-preserved. Missing file -> created whole with the block. Idempotent.

export const BEGIN = '<!-- multivac:begin -->';
export const END = '<!-- multivac:end -->';

/** The full block for a body: markers around trimmed content, trailing \n. */
export function renderBlock(body: string): string {
  return `${BEGIN}\n${body.trim()}\n${END}\n`;
}

/**
 * Apply the managed block to a file's content.
 * - existing === null (file absent): the block alone is the whole file.
 * - markers present: replace exactly the marker-to-marker span, bytes outside
 *   untouched.
 * - no markers: append the block at the end (one blank line separator).
 * Same input twice -> identical output.
 */
/**
 * Every occurrence of `marker` outside ``` / ~~~ code fences, in order.
 * A fenced marker is the user documenting the block, not the block.
 *
 * All of them, not the first: a file with two marker pairs used to have its
 * first pair updated and its second left, so an agent read two doors that
 * disagreed and nothing said so (MV-115).
 */
function findMarkers(text: string, marker: string): number[] {
  // ponytail: naive fence toggle — nested/indented-code cases ignored;
  // upgrade to a real markdown scanner if a door ever needs them.
  const found: number[] = [];
  let inFence = false;
  let offset = 0;
  for (const line of text.split('\n')) {
    const t = line.trimStart();
    if (t.startsWith('```') || t.startsWith('~~~')) {
      inFence = !inFence;
    } else if (!inFence) {
      const i = line.indexOf(marker);
      if (i !== -1) found.push(offset + i);
    }
    offset += line.length + 1;
  }
  return found;
}

export function applyManagedBlock(existing: string | null, body: string, where?: string): string {
  const block = renderBlock(body);
  if (existing === null) return block;

  const at = where ? `${where}: ` : '';
  const begins = findMarkers(existing, BEGIN);
  const ends = findMarkers(existing, END);
  // A second pair is refused rather than half-updated. The tool has no basis
  // for choosing which pair is the real one, and updating the first leaves a
  // reader with two versions of the same door (MV-115).
  if (begins.length > 1 || ends.length > 1) {
    throw new Error(
      `${at}managed block appears ${Math.max(begins.length, ends.length)} times — ` +
        `keep one "${BEGIN}" … "${END}" pair and delete the rest`,
    );
  }
  const begin = begins[0] ?? -1;
  const end = ends[0] ?? -1;
  if (begin !== -1 && end !== -1 && end > begin) {
    const after = existing.slice(end + END.length).replace(/^\n/, '');
    return existing.slice(0, begin) + block + after;
  }
  if (begin !== -1 || end !== -1) {
    throw new Error(
      `${at}managed block is malformed (found one marker without the other) — ` +
        `restore both "${BEGIN}" and "${END}" or delete the stray marker`,
    );
  }
  const sep = existing === '' ? '' : existing.endsWith('\n') ? '\n' : '\n\n';
  return existing + sep + block;
}
