// Brain door: the block AGENTS.md carries at the brain's root.

import type { Config } from '../types.js';
import { sddSpec } from '../adapters/registry.js';
import { proofOf } from '../adapters/sdd.js';

/**
 * Count non-retired data rows in the law table.
 * Zero means session zero: the door must say the brain is empty.
 */
export function countActiveInvariants(md: string): number {
  const rows = md
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|'));
  if (rows.length === 0) return 0;
  const header = rows[0].split('|').map((c) => c.trim().toLowerCase());
  const stateCol = header.indexOf('state');
  let n = 0;
  for (const row of rows.slice(1)) {
    const cells = row.split('|').map((c) => c.trim());
    if (cells.every((c) => c === '' || /^:?-+:?$/.test(c))) continue; // separator
    if (stateCol !== -1 && cells[stateCol]?.toLowerCase() === 'retired') continue;
    n++;
  }
  return n;
}

/** Render the brain door block body (no markers). */
export function renderBrainDoor(config: Config, activeInvariants: number): string {
  const entries = Object.entries(config.repos);
  const brainIsCode = entries.some(([, r]) => r.isBrain);
  // brain==code entries are this repo: they belong in the sentence, not the list.
  const repoLines = entries
    .filter(([, r]) => !r.isBrain)
    .map(([key, r]) => `- ${key}: ${r.path}${r.url ? ` (${r.url})` : ''}`);
  const lines = [
    '## multivac — brain door',
    '',
    'This repo is the brain: the source of law and change for its ecosystem.' +
      (brainIsCode ? ' It is also the code it governs — anchors target `brain:<glob>`.' : ''),
    ...(repoLines.length > 0 ? ['', 'Repos in this ecosystem:', ...repoLines] : []),
    '',
    '- Law lives in `.multivac/invariants.md`. Cite rows by ID; a rule quoted without its ID does not bind.',
    '- Every ecosystem decision enters as a change: see `.multivac/changes/` and run `multivac change`.',
    '- The ritual — the closing ceremony no tool can check — is `.multivac/ritual.md`; `change close` prints it, you walk it.',
    '- Check the law against the code before acting: `multivac verify`.',
  ];
  if (config.sdd) {
    const spec = sddSpec(config.sdd);
    lines.push(
      `- Features gate through the \`${config.sdd}\` SDD, in that tool's OWN flow. ` +
        (config.sddAuto
          ? 'The lifecycle prints each step and REFUSES to move on without the artifact that proves it ran; YOU run the steps:'
          : '`sdd_auto: false` — nothing is printed and nothing is gated; run each step yourself:'),
    );
    // The project-level document: the law of the project, not of one change.
    // Written once, then amended as the product moves — so the door tells the
    // agent to create it when it is not there.
    for (const p of spec?.projectSteps ?? []) {
      lines.push(`  - project law \`${p.artifact}\` — ${p.run}. CREATE IT IF ABSENT.`);
      lines.push(`    revisit: ${p.revisit}`);
    }
    if (spec && (spec.projectSteps ?? []).length === 0) {
      lines.push('  - this tool has no project-level document — nothing to write once and amend');
    }
    // The per-change flow, in the tool's own order and length. Each line ends
    // with what proves it ran, or with why nothing ever can.
    for (const s of spec?.steps ?? []) {
      lines.push(`  - \`change ${s.at}\` → ${s.run} [${proofOf(s)}]`);
    }
  }
  if (activeInvariants === 0) {
    lines.push('', 'brain empty — load the multivac skill to fill it.');
  }
  return lines.join('\n');
}
