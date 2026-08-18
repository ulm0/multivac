// The ritual: the closing ceremony's unverifiable half, written by the team in
// .multivac/ritual.md. multivac never parses it and never gates on it — `change
// close` prints whatever the team wrote, at the moment it matters.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { RITUAL_PATH } from './config.js';

/**
 * MV-98. What `init` scaffolds: the explanation, then candidates drawn from
 * what this brain declared — every one COMMENTED OUT.
 *
 * The file used to arrive holding the comment and nothing else, and facing a
 * blank page most people write nothing, so the closing step printed nothing
 * forever. Candidates remove the blank page without asserting anything on the
 * operator's behalf: an unadopted ceremony is not a ceremony, and writing
 * obligations into their file would be the tool deciding what their team owes
 * each other. The idiom is the one `init` already uses in the config it writes,
 * where detected adapters are suggested and a human enables them.
 *
 * A fresh brain therefore still prints NOTHING at close, exactly as before —
 * `ritualChecklist` strips comment blocks — so nothing changes until somebody
 * means it.
 *
 * Only what no check could decide. A declared grapher contributes none: its
 * work is automatic and a gate already requires its artifact, so seeding it
 * would move a checked thing onto a poster, which is the inversion this whole
 * change exists to undo.
 */
export function ritualSeed(config?: {
  sdd?: string;
  repos?: Record<string, unknown>;
  mount?: string;
}): string {
  const candidates = [
    'Somebody who did not write it read it, and said so out loud.',
    'What this taught that is not yet law is written down somewhere a person will find it.',
  ];
  if (config?.sdd) {
    candidates.push(
      'The spec is still true of the code: a better design found while implementing went back into the spec, with its reason.',
    );
  }
  if (Object.keys(config?.repos ?? {}).length > 1) {
    candidates.push(
      'The landing order was walked, not assumed: nothing shipped ahead of what it depends on.',
    );
    candidates.push(
      `The pin moved in every consumer after the merge, so nobody reads \`${config?.mount ?? '.brain'}/\` at yesterday's law.`,
    );
  }
  return `# Ritual

<!-- The closing ceremony multivac cannot check: who reviews what, who gets
told, what ships before what when the reason is not technical. One line each;
\`multivac change close\` prints them as a checklist. Empty prints nothing.

Candidates below, from what this brain declares. Uncomment what your team
actually owes each other and delete the rest — nothing here is asserted on your
behalf, and a commented line never prints. -->

${candidates.map((c) => `<!-- - [ ] ${c} -->`).join('\n')}
`;
}

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
