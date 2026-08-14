// Consumer door: the block AGENTS.md carries in each declared code repo.

import type { Config } from '../types.js';

/** Render the consumer door block body (no markers). */
export function renderConsumerDoor(config: Config): string {
  const mount = config.mount;
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
  ].join('\n');
}
