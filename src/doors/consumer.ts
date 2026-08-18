// Consumer door: the block AGENTS.md carries in each declared code repo.

import type { Config } from '../types.js';
import { grapherLines } from './brain.js';

/** Render the consumer door block body (no markers). */
export function renderConsumerDoor(config: Config, repoKey?: string): string {
  const mount = config.mount;
  // MV-90. The brain's door has always named the graph, its artifact and the
  // tool's own query verbs; this door named nothing about any adapter — four
  // bullets about the law and the mount. An operator entering the ecosystem
  // through a code repo, which is the normal case because code is where work
  // happens, got an agent that never learned a graph existed and grepped. The
  // grapher that applies HERE is this repo's override first, the ecosystem's
  // otherwise — the same resolution `graphScopes` uses.
  const entry = repoKey === undefined ? undefined : config.repos[repoKey];
  const graph = grapherLines(config, entry?.grapher ?? config.grapher);
  const gate =
    config.staleness === 'block' ? ' A pin behind its channel makes `verify` exit 1 here.' : '';
  return [
    '## multivac — consumer door',
    '',
    `This repo belongs to an ecosystem; its brain is mounted at \`${mount}/\`.`,
    '',
    `- Law: \`${mount}/.multivac/invariants.md\` binds this repo. Cite rows by ID, never paraphrase without one.`,
    `- Refresh the mount before trusting it: \`git submodule update --init --remote ${mount}\`.${gate}`,
    '- The change may cross repos: check the brain before assuming a change is local to this repo.',
    '- Run `multivac verify` before acting; git hooks run it again at commit.',
    ...graph,
  ].join('\n');
}
