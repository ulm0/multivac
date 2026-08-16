// Brain door: the block AGENTS.md carries at the brain's root.

import type { Config } from '../types.js';
import { grapherSpec, sddSpec } from '../adapters/registry.js';
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

/**
 * The project-level document, as door lines: the law of the project, written
 * once and amended as the product moves. Shared with `init`, which writes the
 * empty-brain door long before the first `doors` run — a constitution the
 * agent is only told about on the SECOND command is a constitution nobody
 * writes.
 */
export function projectLawLines(sdd: string): string[] {
  const spec = sddSpec(sdd);
  if (!spec) return [];
  const lines: string[] = [];
  for (const p of spec.projectSteps ?? []) {
    lines.push(`  - project law \`${p.artifact}\` — ${p.run}. CREATE IT IF ABSENT.`);
    lines.push(`    revisit: ${p.revisit}`);
  }
  if ((spec.projectSteps ?? []).length === 0) {
    lines.push('  - this tool has no project-level document — nothing to write once and amend');
  }
  return lines;
}

/**
 * The grapher, as door lines: the artifact, and the verbs that READ it.
 *
 * The refresh half of a grapher was already automatic — a post-edit hook keeps
 * the artifact current whether or not anyone mentions it. What was missing is
 * the half that pays for it: an agent reading this door had no idea a graph
 * existed, so it grepped. The lines below name the tool's own query verbs,
 * never a paraphrase, because the verbs are not interchangeable —
 * `graphify query` takes a question and `codegraph query` takes a symbol.
 *
 * A tool with no query surface gets a line saying exactly that. Silence there
 * would read as "no graph"; an invented verb would be worse.
 */
export function grapherLines(config: Config): string[] {
  const name = config.grapher;
  if (name === undefined) return [];
  // Unverified: `doors` already prints the full declare-it-yourself notice —
  // repeating a guess in the door is the one thing MV-59 forbids.
  const spec = grapherSpec(name, config.graphers);
  if (!spec) return [];
  const lines = [
    `- A code graph is kept fresh for you by \`${name}\` at \`${spec.artifacts[0]}\` — ` +
      'refreshed after your edits, never committed.',
  ];
  if (spec.queries && spec.queries.length > 0) {
    lines.push(
      '  ASK IT BEFORE READING THE TREE RAW. It answers in one call what grep takes many, and it is this tool\'s verbs, not a generic one:',
    );
    for (const q of spec.queries) lines.push(`  - \`${q.run}\` — ${q.answers}`);
  } else {
    lines.push(
      `  - \`${name}\` has NO query command: the artifact is written but nothing reads it back. Do not invent one.`,
    );
  }
  return lines;
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
    ...grapherLines(config),
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
    lines.push(...projectLawLines(config.sdd));
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
