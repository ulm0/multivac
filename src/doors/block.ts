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
 * First occurrence of `marker` outside ``` / ~~~ code fences, or -1.
 * A fenced marker is the user documenting the block, not the block.
 */
function findMarker(text: string, marker: string): number {
  // ponytail: naive fence toggle — nested/indented-code cases ignored;
  // upgrade to a real markdown scanner if a door ever needs them.
  let inFence = false;
  let offset = 0;
  for (const line of text.split('\n')) {
    const t = line.trimStart();
    if (t.startsWith('```') || t.startsWith('~~~')) {
      inFence = !inFence;
    } else if (!inFence) {
      const i = line.indexOf(marker);
      if (i !== -1) return offset + i;
    }
    offset += line.length + 1;
  }
  return -1;
}

export function applyManagedBlock(existing: string | null, body: string): string {
  const block = renderBlock(body);
  if (existing === null) return block;

  const begin = findMarker(existing, BEGIN);
  const end = findMarker(existing, END);
  if (begin !== -1 && end !== -1 && end > begin) {
    const after = existing.slice(end + END.length).replace(/^\n/, '');
    return existing.slice(0, begin) + block + after;
  }
  if (begin !== -1 || end !== -1) {
    throw new Error(
      `managed block is malformed (found one marker without the other) — restore both "${BEGIN}" and "${END}" or delete the stray marker`,
    );
  }
  const sep = existing === '' ? '' : existing.endsWith('\n') ? '\n' : '\n\n';
  return existing + sep + block;
}
