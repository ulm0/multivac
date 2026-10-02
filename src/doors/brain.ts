// Brain door: the block AGENTS.md carries at the brain's root.

import type { Config } from '../types.js';
import { sddSpec } from '../adapters/registry.js';
import { parseClaimRows } from '../anchor/parse.js';
import { adapterFor, brainHoldsCode } from '../adapters/detect.js';
import { leftoverDoorLine, type LeftoverVendor } from '../lib/dropped.js';

/**
 * Count non-retired data rows in the law table.
 * Zero means session zero: the door must say the brain is empty.
 */
export function countActiveInvariants(md: string): number {
  // MV-119. This read the header for the `state` column and then indexed the
  // DATA row at the position it found — right for a row whose statement has no
  // pipe, wrong for every row that quotes one, and the header can never have
  // one to warn you. The shared parser counts the trailing columns from the
  // end, so the count is about the states the authors wrote.
  return parseClaimRows(md).filter((r) => r.state.toLowerCase() !== 'retired').length;
}

/**
 * The project-level document, as door lines: the law of the project, written
 * once and amended as the product moves. Shared with `init`, which writes the
 * empty-brain door long before the first `doors` run — a constitution the
 * agent is only told about on the SECOND command is a constitution nobody
 * writes.
 *
 * MV-146: the brain's door alone prints these, so the law is named at the
 * brain's own path. Under `sdd_auto: false` nothing refuses over the
 * document, and the door no longer says anything does: the imperative stays,
 * because the document is the project's law whether or not a gate asks for it.
 */
export function projectLawLines(sdd: string, sddAuto = true): string[] {
  const spec = sddSpec(sdd);
  if (!spec) return [];
  const lines: string[] = [];
  for (const p of spec.projectSteps ?? []) {
    if (p.reportOnly) {
      lines.push(`  - project context \`${p.artifact}\` \`${p.reportOnly.key}:\` — ${p.run}. Optional: reported, never gated.`);
      lines.push(`    revisit: ${p.revisit}`);
      continue;
    }
    // The proof half, exactly as every per-change step line carries it: this
    // line said CREATE IT IF ABSENT in capitals and nothing checked it, which
    // is the gap MV-76 closes. Now it names what refuses.
    lines.push(
      sddAuto
        ? `  - project law \`${p.artifact}\` — ${p.run}. CREATE IT IF ABSENT — \`change plan\` refuses while it is missing, empty or still the template.`
        : `  - project law \`${p.artifact}\` — ${p.run}. CREATE IT IF ABSENT.`,
    );
    lines.push(`    revisit: ${p.revisit}`);
  }
  if ((spec.projectSteps ?? []).length === 0) {
    lines.push('  - this tool has no project-level document — nothing to write once and amend');
  } else {
    // MV-135: which one wins, said where the document is named — and only the
    // brain's door names it now (MV-146), at the path the brain opens.
    lines.push('  - where a project document and an active row of `.multivac/invariants.md` disagree, the row wins: amend the document, or change the row through a change');
  }
  return lines;
}

/**
 * The declared SDD tool, its project-level document and its per-change flow.
 *
 * MV-93 made this one rendering for the brain's door and every consumer's.
 * MV-146: the SDD runs in the brain alone, so only the brain's door carries
 * the block; a consumer door says in one line where it runs
 * (`renderConsumerDoor`).
 *
 * The caller passes what `adapterFor` resolved for the brain (MV-122), so a
 * brain that resolves `none` gets no block rather than one about a tool of
 * that name.
 */
export function sddLines(config: Config, name: string | undefined): string[] {
  if (!name) return [];
  const spec = sddSpec(name);
  const lines = [
    `- Features gate through the \`${name}\` SDD, in that tool's OWN flow. ` +
      (config.sddAuto
        ? 'The lifecycle prints each step and REFUSES to move on without the artifact that proves it ran; YOU run the steps:'
        : '`sdd_auto: false` — nothing is printed and nothing is gated; run each step yourself:'),
  ];
  // The project-level document: the law of the project, not of one change.
  // Written once, then amended as the product moves — so the door tells the
  // agent to create it when it is not there.
  lines.push(...projectLawLines(name, config.sddAuto));
  // The per-change flow, in the tool's own order and length. Each line ends
  // with the artifact that proves it ran, or `[ungateable]`. MV-146: the
  // reason nothing can prove a step is printed whole where the step comes up —
  // the lifecycle, `doctor` and flow.md — and no longer in every session's
  // door; nor is the refusing command, which the lifecycle names when it refuses.
  for (const s of spec?.steps ?? []) {
    lines.push(`  - \`change ${s.at}\` → ${s.run}${s.artifact ? ` [proof: ${s.artifact}]` : ' [ungateable]'}`);
  }
  // MV-93, and stated exactly this weakly on purpose. The scaffold runs from
  // FOUR lifecycle points, not one, and on three paths it reports instead of
  // scaffolding: no scaffold declared for the adapter, a required binary that
  // MV-123's lookup does not find (PATH, then that root's node_modules/.bin),
  // and the init exiting without writing the artifact. A door that says
  // "`change plan` scaffolds it" is Principle II broken in the file an agent
  // reads first. And under `sdd_auto: false` the scaffold does not run at all
  // (MV-146), so the door does not say it does.
  lines.push(
    config.sddAuto
      ? '  the change lifecycle runs the tool\'s own init where it is missing, or says why it could not'
      : '  under `sdd_auto: false` no command runs the tool\'s own init where it is missing — run it in the brain yourself',
  );
  return lines;
}

/**
 * Render the brain door block body (no markers). `leftovers` is what the
 * caller found of a vendor's install beside the door (MV-153): each one whose
 * own skill still sends an agent elsewhere gets one line in the list. The
 * caller probes; this reads no file.
 */
export function renderBrainDoor(config: Config, activeInvariants: number, leftovers: readonly LeftoverVendor[] = []): string {
  const entries = Object.entries(config.repos);
  const brainIsCode = brainHoldsCode(config);
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
    ...leftovers.flatMap((l) => leftoverDoorLine(l) ?? []),
  ];
  lines.push(...sddLines(config, adapterFor(config, 'brain', 'sdd')));
  if (activeInvariants === 0) {
    lines.push('', 'brain empty — load the multivac skill to fill it.');
  }
  return lines.join('\n');
}
