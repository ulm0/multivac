// Brain door: the block AGENTS.md carries at the brain's root.

import { ecosystemGraphLines } from './ecosystem.js';
import type { Config } from '../types.js';
import { doorTargets, grapherSpec, sddSpec, type AdapterSpec } from '../adapters/registry.js';
import { parseClaimRows } from '../anchor/parse.js';
import { adapterFor, askedGraphers, brainHoldsCode, brainRefreshGrapher } from '../adapters/detect.js';
import type { LeftoverGraph } from '../lib/repo-state.js';

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
/**
 * MV-143. The declared doors whose platform writes the vendor's own section
 * INTO the canonical door: `canonical` outright, or `own-door` where that
 * harness's door is a symlink to it, which `installHarness` now creates before
 * the vendor runs. The one rule two surfaces ask — the door, deciding whether
 * to cite that section, and `doctor`, deciding which install would write it.
 * Order follows the declared doors, so the first entry is the one to name.
 */
export function sectionDoors(config: Config, spec: AdapterSpec): string[] {
  const platforms = spec.harness?.platforms;
  if (!platforms) return [];
  return config.doors.filter((d) => {
    const p = platforms[d];
    if (!p) return false;
    if (p.section === 'canonical') return true;
    return p.section === 'own-door' && doorTargets[d]?.kind === 'symlink';
  });
}

/**
 * The door's one instruction to use the graph, without its period: each door
 * block ends it as its sentence needs (MV-61, MV-148). One constant, so the
 * words are spelled once whichever block prints them.
 */
const ASK = 'ASK IT BEFORE READING THE TREE RAW';

/**
 * MV-140: when a graph is refreshed, spelled once for every door block. "After
 * your edits" only where a hook is declared to make it true — a declared
 * harness's post-edit hook, and for a brain that holds no code, the one
 * grapher that hook runs (MV-148); elsewhere the lifecycle is the refresh.
 * Declared, never probed: the door is committed and makes no filesystem check
 * (MV-93), so whether this machine found the binary and wired the hook is
 * `doors`' notice and `doctor`'s refresh path — as a brain==code door's has
 * always been ("installed when the binary is present").
 */
function freshness(hooked: boolean): string {
  return hooked
    ? 'refreshed after your edits'
    : 'refreshed at `change land` and `change close`';
}

/** A grapher with no query verb, said once for every door block (MV-61). */
function noQueryLine(name: string, indent: string): string {
  return `${indent}- \`${name}\` has NO query command: the artifact is written but nothing reads it back. Do not invent one.`;
}

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
  const fresh = freshness(config.doors.some((d) => doorTargets[d]?.hookConfig?.postEdit));
  const lines = [
    `- A code graph is kept fresh for you by \`${name}\` at \`${spec.artifacts[0]}\` — ` +
      // A shared artifact is committed on the change's branch by `change land`
      // (MV-134). A local one is built in each checkout and never committed
      // (MV-124), so the door does not invite it.
      (spec.artifactKind === 'local'
        ? `${fresh}; it is built in each checkout, so never commit it.`
        : `${fresh}, and committed on the change branch by \`change land\`.`),
  ];
  const ask = `${ASK}.`;
  // MV-140 (I-55): where the tool's own install writes its section into a
  // declared door, that section carries the verbs and when to use them; the
  // door names the commands and points there instead of saying it twice.
  // MV-143: asked of the platforms that WRITE that section, not of any platform
  // at all. This brain's door cited it because `agents` was declared, while
  // graphify's `agents` platform writes only a skill — the section was there
  // because the `claude` platform wrote through the CLAUDE.md link, which is a
  // different root's accident away from being false.
  const cites = sectionDoors(config, spec).length > 0;
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
    lines.push(noQueryLine(name, '  '));
  }
  return lines;
}

/**
 * The declared SDD tool, its project-level document and its per-change flow.
 *
 * MV-93 made this one rendering for the brain's door and every consumer's, the
 * shape `grapherLines` established under MV-90. MV-146: the SDD runs in the
 * brain alone, so only the brain's door carries the block; a consumer door
 * says in one line where it runs (`renderConsumerDoor`).
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
 * MV-148. Where an agent in the brain asks each code repo's graph, as door
 * lines: per grapher in `groups` (`askedGraphers`, config order), the repos
 * that resolve it with their declared paths, and every verb with the flag
 * (`askAt`) that points it at a checkout. The bare verb asks the graph in the
 * session's directory, which is the brain; there a brain that keeps no code
 * graph has none to answer, and one that kept a graph answered questions
 * about the code from the skills and the specs. Asked with the flag, web's
 * graph answered from the brain byte for byte as from inside web.
 *
 * A committed graph is named at `<checkout>`: in a change, the worktree `change
 * apply` prints holds the branch's own. A local index is named at `<repo>`
 * and never at a change's worktree, which has none: asked there it answers
 * from the nearest index above it, silently, or fails. Every block says the
 * answers' paths are relative to the checkout the flag names, since a path
 * read from the brain would otherwise be taken as the brain's.
 *
 * `holds` picks the head: the brain holds code, and these are its siblings.
 * An unverified grapher gets no group (MV-59: `doors` prints the notice); a
 * grapher no writable code repo resolves gets one line and no verb; no group
 * rendered, no head. The vendor's own section is never cited here: it names
 * the bare verb.
 */
export function whereLines(config: Config, groups: Map<string, string[]>, holds: boolean): string[] {
  // "After your edits there" only where the brain's one hook is declared to
  // run this grapher (MV-140's rule, with MV-148's hook): elsewhere the
  // lifecycle refreshes it. Declarations only (MV-93): `freshness`.
  const postEdit = config.doors.some((d) => doorTargets[d]?.hookConfig?.postEdit);
  const hookRuns = brainRefreshGrapher(config);
  const lines: string[] = [];
  for (const [name, keys] of groups) {
    const spec = grapherSpec(name, config.graphers);
    if (!spec) continue;
    const at = `  - \`${name}\` at \`${spec.artifacts[0]}\``;
    if (keys.length === 0) {
      lines.push(`${at}: no writable code repo resolves it yet — each one that does gets its own when \`repos sync\` or a change reaches it`);
      continue;
    }
    const repos = keys.map((k) => `${k}: \`${config.repos[k]?.path}\``).join(', ');
    const fresh = postEdit && hookRuns === name ? `${freshness(true)} there` : freshness(false);
    const local = spec.artifactKind === 'local';
    const flag = spec.askAt?.split(' ')[0];
    lines.push(
      `${at} (${repos}), ${fresh}` +
        (local
          ? `; built in each checkout, never committed — a change's worktree has none yet${flag ? `, and \`${flag}\` at it answers from the nearest index above it, or fails` : ''}:`
          : ', and committed on the change branch by `change land`:'),
    );
    const aim = spec.askAt?.replace('{checkout}', local ? '<repo>' : '<checkout>');
    if (spec.queries && spec.queries.length > 0) {
      for (const q of spec.queries) lines.push(`    - \`${q.run}${aim ? ` ${aim}` : ''}\` — ${q.answers}`);
    } else {
      lines.push(noQueryLine(name, '    '));
    }
  }
  if (lines.length === 0) return [];
  const head = holds
    ? '- The other code repos keep their own graphs.'
    : '- This brain holds no code, so it keeps no code graph: each code repo keeps its own.';
  return [
    `${head} ${ASK}, from here, with each verb's flag pointed at a repo below — in a change, the flag \`change apply\` printed under that repo's checkout; paths in its answers are relative to the checkout the flag names.`,
    ...lines,
  ];
}

/**
 * MV-148. The line a brain that holds code adds under its own grapher lines —
 * after `grapherLines`, never inside it: every consumer door shares that
 * rendering (MV-90), and a consumer's graph is not the brain's. The brain's
 * graph leaves the law, the changes and their specs out where something keeps
 * them out — the grapher's ignore file, or a grapher measured to index no
 * Markdown (`codeOnly`); the ecosystem graph relates those. A change's
 * worktree holds the branch's own committed graph, which the bare verb in this
 * checkout never reads: measured, the trunk's graph lacked 27 source symbols
 * of a worktree's, and 73 of 185 moved ones sat more than 60 lines from where
 * the trunk put them. A local index has no copy in a worktree. A grapher with
 * no `askAt` gets the first sentence alone, and one with no query verb no
 * line: nothing reads its artifact back, as the line above it says (MV-61).
 */
function holdsCodeLine(name: string, spec: AdapterSpec): string | null {
  if (!spec.queries || spec.queries.length === 0) return null;
  const first =
    spec.graphignoreFile !== undefined || spec.codeOnly
      ? '  It answers for this checkout, with the law, the changes and their specs kept out of it: the ecosystem graph above relates them.'
      : '  It answers for this checkout; the ecosystem graph above relates the law, the changes and their specs.';
  if (!spec.askAt) return first;
  return spec.artifactKind === 'local'
    ? `${first} A change's worktree has no index yet: \`${name}\` asked from here or there answers from this checkout's index, without the branch's edits.`
    : `${first} A change's worktree has its own, as of its last refresh: add \`${spec.askAt.replace('{checkout}', '<worktree>')}\` (\`change apply\` prints it); paths in its answers are relative to that worktree.`;
}

/**
 * MV-148. The brain door's code-graph block. A brain that holds no code
 * resolves no grapher of its own: the block is where each code repo's graph is
 * asked. One that holds code keeps its two grapher lines byte for byte, adds
 * its worktrees' form, and lists its sibling code repos the same way.
 */
function brainGraphLines(config: Config, holds: boolean): string[] {
  if (!holds) return whereLines(config, askedGraphers(config), false);
  const name = adapterFor(config, 'brain', 'grapher');
  const own = grapherLines(config, name);
  const spec = name === undefined ? null : grapherSpec(name, config.graphers);
  const line = own.length > 0 && spec ? holdsCodeLine(name!, spec) : null;
  if (line !== null) own.push(line);
  const siblings = new Map<string, string[]>();
  for (const [n, keys] of askedGraphers(config)) {
    const rest = keys.filter((k) => !config.repos[k]?.isBrain);
    if (rest.length > 0) siblings.set(n, rest);
  }
  return [...own, ...whereLines(config, siblings, true)];
}

/**
 * MV-148. The door line for a grapher install kept in a brain that holds no
 * code: the bare verb in the brain answers from it — from the skills and the
 * specs, not the code. Kept until a human removes it (`doctor` prints how);
 * the line goes with it. It names the artifact's top directory where the
 * artifact or that directory is there, else the first thing found. MV-143:
 * the vendor's section is named only where a platform found writes it into
 * this file — by the rule `sectionDoors` reads — and its hooks only where a
 * platform found writes one that sends the agent to the graph (`hooks`):
 * graphify's `agents` platform writes a skill and neither. `above` only where
 * the door lists a code repo's graph: with no grapher asked from the brain it
 * lists none, and the line pointed at graphs nowhere on the page.
 */
function leftoverLine(config: Config, left: LeftoverGraph, listed: boolean): string | null {
  const spec = grapherSpec(left.name, config.graphers);
  if (!spec) return null;
  const art = spec.artifacts[0];
  const top = art.includes('/') ? `${art.split('/')[0]}/` : art;
  const found = Object.entries(spec.harness?.platforms ?? {}).filter(([, p]) => left.platforms.includes(p.key));
  const at = left.artifact !== undefined || left.stateDir !== undefined ? top : (left.ignoreFile ?? found[0]?.[1].probe ?? top);
  const section = found.some(
    ([d, p]) => p.section === 'canonical' || (p.section === 'own-door' && config.doors.includes(d) && doorTargets[d]?.kind === 'symlink'),
  );
  const hooks = found.some(([, p]) => p.hooks);
  const points = section
    ? `the \`## ${left.name}\` section below${hooks ? ` and ${left.name}'s own hooks point` : ' points'} at it`
    : hooks
      ? `${left.name}'s own hooks point at it`
      : null;
  const ask = `ask the code repos' graphs${listed ? ' above' : ''} instead`;
  return points !== null
    ? `- \`${at}\` here is a leftover that holds no code: ${points} — ${ask}; \`multivac doctor\` prints its removal.`
    : `- \`${at}\` here is a leftover that holds no code — ${ask}; \`multivac doctor\` prints its removal.`;
}

/**
 * Render the brain door block body (no markers). `leftovers` is
 * `leftoverGraphs` over the brain, which BOTH `init` and `doors` pass, so the
 * two write one door (MV-102, MV-148).
 */
export function renderBrainDoor(config: Config, activeInvariants: number, leftovers: LeftoverGraph[] = []): string {
  const entries = Object.entries(config.repos);
  const brainIsCode = brainHoldsCode(config);
  const graphLines = brainGraphLines(config, brainIsCode);
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
    ...graphLines,
    ...leftovers.map((l) => leftoverLine(config, l, graphLines.length > 0)).filter((l): l is string => l !== null),
  ];
  lines.push(...sddLines(config, adapterFor(config, 'brain', 'sdd')));
  if (activeInvariants === 0) {
    lines.push('', 'brain empty — load the multivac skill to fill it.');
  }
  return lines.join('\n');
}
