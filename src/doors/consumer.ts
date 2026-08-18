// Consumer door: the block AGENTS.md carries in each declared code repo.
//
// MV-93. This door used to be four bullets — the law, the mount refresh,
// "the change may cross repos", and "run verify" — while the brain's door
// listed the ecosystem and carried every adapter block. An operator entering
// the ecosystem through a code repo, which is the normal case because code is
// where work happens, got an agent that never learned what else existed.
//
// It renders from DECLARATIONS ONLY: no filesystem check, no network. A door
// that changed with which repos happen to be cloned would differ between two
// machines for reasons unrelated to the ecosystem, and the door is committed.

import type { Config } from '../types.js';
import { grapherLines, sddLines } from './brain.js';

/**
 * The ecosystem, as the doors name it.
 *
 * `brain` gets its own line because it is an IMPLICIT anchor handle: verify
 * skips it when walking the declared repos and accepts it as a known key
 * regardless, so it appears among them only when the brain is its own code
 * repo — and that entry is filtered out here. A list promising "the keys
 * anchors name" that can never name the one key every consumer's anchors may
 * use would be claiming a completeness it does not have.
 *
 * Nothing when a single repo is declared: a heading over one row reading
 * "(this repo)" is noise where the door is trying to be short.
 */
export function ecosystemLines(config: Config, repoKey: string): string[] {
  const declared = Object.entries(config.repos).filter(([, e]) => !e.isBrain);
  if (declared.length < 2) return [];
  const rows = declared.map(([key, e]) => {
    const here = key === repoKey ? ' (this repo)' : '';
    const role = e.role === undefined ? '' : ` · ${e.role}`;
    return `- \`${key}\` — ${e.path}${here}${role}`;
  });
  return [
    '',
    'Repos in this ecosystem — these keys are what anchors and change files name:',
    '',
    `- \`brain\` — the brain itself, mounted here at \`${config.mount}/\``,
    ...rows,
  ];
}

/** Render the consumer door block body (no markers). */
export function renderConsumerDoor(config: Config, repoKey: string): string {
  const mount = config.mount;
  const gate =
    config.staleness === 'block' ? ' A pin behind its channel makes `verify` exit 1 here.' : '';
  // The adapters that apply HERE: this repo's override first, the ecosystem's
  // otherwise — the same resolution `graphScopes` and `sddFor` use.
  const entry = config.repos[repoKey];
  const graph = grapherLines(config, entry?.grapher ?? config.grapher);
  const sdd = sddLines(config, entry?.sdd ?? config.sdd);
  return [
    '## multivac — consumer door',
    '',
    `This repo belongs to an ecosystem; its brain is mounted at \`${mount}/\`.`,
    '',
    // First, not fourth. It is the only instruction here with an ordering
    // requirement: everything else can be read in any order, and this one has
    // to happen before the rest is trustworthy.
    `**First, before reading anything in it:** \`git submodule update --init --remote ${mount}\``,
    'The pin stays where the last commit left it, so a present mount is not a',
    `current one — unrefreshed, you decide against the law as it was weeks ago.${gate}`,
    '',
    `- Law: \`${mount}/.multivac/invariants.md\` binds this repo. Cite rows by ID, never paraphrase without one.`,
    '- The change may cross repos: check the brain before assuming a change is local to this repo.',
    '- Run `multivac verify` before acting; git hooks run it again at commit.',
    ...ecosystemLines(config, repoKey),
    ...(sdd.length > 0 ? ['', ...sdd] : []),
    ...(graph.length > 0 ? ['', ...graph] : []),
  ].join('\n');
}
