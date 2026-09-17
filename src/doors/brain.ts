// Brain door: the block AGENTS.md carries at the brain's root.

import { ecosystemGraphLines } from './ecosystem.js';
import type { Config } from '../types.js';
import { doorTargets, grapherSpec, sddSpec } from '../adapters/registry.js';
import { proofOf } from '../adapters/sdd.js';
import { parseClaimRows } from '../anchor/parse.js';
import { adapterFor } from '../adapters/detect.js';

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
 */
export function projectLawLines(sdd: string): string[] {
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
      `  - project law \`${p.artifact}\` — ${p.run}. CREATE IT IF ABSENT — \`change plan\` refuses while it is missing, empty or still the template.`,
    );
    lines.push(`    revisit: ${p.revisit}`);
  }
  if ((spec.projectSteps ?? []).length === 0) {
    lines.push('  - this tool has no project-level document — nothing to write once and amend');
  } else {
    // MV-135: which one wins, said where the document is named.
    lines.push('  - where a project document and an active row of `.multivac/invariants.md` disagree, the row wins: amend the document, or change the row through a change');
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
export function grapherLines(config: Config, name: string | undefined): string[] {
  // MV-90: the same rendering serves the brain's door and every consumer's, so
  // the two cannot drift. Every caller passes what `adapterFor` resolved for
  // THAT root (MV-122), the brain included; undefined, `none` too, renders
  // nothing.
  if (name === undefined) return [];
  // Unverified: `doors` already prints the full declare-it-yourself notice —
  // repeating a guess in the door is the one thing MV-59 forbids.
  const spec = grapherSpec(name, config.graphers);
  if (!spec) return [];
  // MV-140: "after your edits" only where a declared harness has the post-edit
  // hook that makes it true; elsewhere the lifecycle is the refresh.
  const fresh = config.doors.some((d) => doorTargets[d]?.hookConfig?.postEdit)
    ? 'refreshed after your edits'
    : 'refreshed at `change land` and `change close`';
  const lines = [
    `- A code graph is kept fresh for you by \`${name}\` at \`${spec.artifacts[0]}\` — ` +
      // A shared artifact is committed on the change's branch by `change land`
      // (MV-134). A local one is built in each checkout and never committed
      // (MV-124), so the door does not invite it.
      (spec.artifactKind === 'local'
        ? `${fresh}; it is built in each checkout, so never commit it.`
        : `${fresh}, and committed on the change branch by \`change land\`.`),
  ];
  const ask = 'ASK IT BEFORE READING THE TREE RAW.';
  // MV-140 (I-55): where the tool's own install writes its section into a
  // declared door, that section carries the verbs and when to use them; the
  // door names the commands and points there instead of saying it twice.
  const cites = spec.harness !== undefined && config.doors.some((d) => spec.harness!.platforms[d] !== undefined);
  if (spec.queries && spec.queries.length > 0 && cites) {
    lines.push(
      `  ${ask} ${spec.queries.map((q) => `\`${q.run.split(' "')[0]}\``).join(', ')} — how and when to use each is in the \`## ${name}\` section ${name}'s own install writes into this file.`,
    );
  } else if (spec.queries && spec.queries.length > 0) {
    lines.push(
      `  ${ask} It answers in one call what grep takes many, and it is this tool's verbs, not a generic one:`,
    );
    for (const q of spec.queries) lines.push(`  - \`${q.run}\` — ${q.answers}`);
  } else {
    lines.push(
      `  - \`${name}\` has NO query command: the artifact is written but nothing reads it back. Do not invent one.`,
    );
  }
  return lines;
}

/**
 * The declared SDD tool, its project-level document and its per-change flow.
 *
 * MV-93: one rendering, used by the brain's door and by every consumer's — the
 * shape `grapherLines` established under MV-90, and for the same reason. Two
 * renderings of one block is how the two come to disagree, and a door is the
 * surface where disagreement is least visible: nobody diffs two AGENTS.md.
 *
 * Every caller passes what `adapterFor` resolved for THAT root (MV-122), so a
 * root that resolves `none` gets no block rather than one about a tool of
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
  lines.push(...projectLawLines(name));
  // The per-change flow, in the tool's own order and length. Each line ends
  // with what proves it ran, or with why nothing ever can.
  for (const s of spec?.steps ?? []) {
    lines.push(`  - \`change ${s.at}\` → ${s.run} [${proofOf(s)}]`);
  }
  // MV-93, and stated exactly this weakly on purpose. The scaffold runs from
  // FOUR lifecycle points, not one, and on three paths it reports instead of
  // scaffolding: no scaffold declared for the adapter, a required binary that
  // MV-123's lookup does not find (PATH, then that root's node_modules/.bin),
  // and the init exiting without writing the artifact. A door that says
  // "`change plan` scaffolds it" is Principle II broken in the file an agent
  // reads first.
  lines.push(
    '  the change lifecycle runs the tool\'s own init where it is missing, or says why it could not',
  );
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
    ...ecosystemGraphLines(config, 'brain', ''),
    ...grapherLines(config, adapterFor(config, 'brain', 'grapher')),
  ];
  lines.push(...sddLines(config, adapterFor(config, 'brain', 'sdd')));
  if (activeInvariants === 0) {
    lines.push('', 'brain empty — load the multivac skill to fill it.');
  }
  return lines.join('\n');
}
