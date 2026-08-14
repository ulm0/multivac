// The ritual: the closing ceremony's unverifiable half, written by the team in
// .multivac/ritual.md. multivac never parses it and never gates on it — `change
// close` prints whatever the team wrote, at the moment it matters.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { RITUAL_PATH } from './config.js';

/** What `init` scaffolds: a heading, and one comment saying what belongs here. */
export const RITUAL_TEMPLATE = `# Ritual

<!-- The closing ceremony multivac cannot check: who reviews what, who gets
told, what ships before what when the reason is not technical. One line each;
\`multivac change close\` prints them as a checklist. Empty prints nothing. -->
`;

/**
 * The lines to print, in file order. Headings and comments are scaffolding,
 * not ritual: a brain that only ran `init` has nothing to say, and says it.
 */
export async function ritualChecklist(brain: string): Promise<string[]> {
  const text = await readFile(join(brain, RITUAL_PATH), 'utf8').catch(() => '');
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== '' && !l.startsWith('#'));
}
