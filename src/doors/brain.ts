// Brain door: the block AGENTS.md carries at the brain's root.

import type { Config } from '../types.js';

/**
 * Count non-retired data rows in the invariants.md law table.
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
  const repoLines = Object.entries(config.repos).map(
    ([key, r]) => `- ${key}: ${r.path}${r.url ? ` (${r.url})` : ''}`,
  );
  const lines = [
    '## multivac — brain door',
    '',
    'This repo is the brain: the source of law and change for its ecosystem.',
    ...(repoLines.length > 0 ? ['', 'Repos in this ecosystem:', ...repoLines] : []),
    '',
    '- Law lives in `invariants.md`. Cite rows by ID; a rule quoted without its ID does not bind.',
    '- Every ecosystem decision enters as a change: see `changes/` and run `multivac change`.',
    '- Check the law against the code before acting: `multivac verify`.',
  ];
  if (activeInvariants === 0) {
    lines.push('', 'brain empty — load the multivac skill to fill it.');
  }
  return lines.join('\n');
}
