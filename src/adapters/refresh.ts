// Run a grapher's refresh in one directory. Execution only: this module
// never spawns git, so the refreshed artifact cannot be staged — graph
// output is regenerated locally and lands only in dedicated chore commits.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { grapherSpec } from './registry.js';
import { binaryPresent } from './detect.js';
import { say, warn } from '../lib/out.js';

const execFileP = promisify(execFile);

/**
 * Refresh the graph for one scope (the brain, or one declared repo).
 * Absent binary = notice with the install hint; a refresh that exits
 * non-zero = warning handing the command back. Never throws: a foreign
 * tool's failure is never the lifecycle's failure.
 */
export async function refreshGraph(name: string, dir: string, scope: string): Promise<void> {
  const spec = grapherSpec(name);
  if (!(await binaryPresent(spec))) {
    say(
      `graph ${name} @ ${scope}: binary not found — refresh skipped; ` +
        `${spec.installHint}, then \`${spec.refresh}\` there`,
    );
    return;
  }
  const [bin, ...args] = spec.refresh.split(' ');
  try {
    await execFileP(bin, args, { cwd: dir });
    say(`graph ${name} @ ${scope}: refreshed (\`${spec.refresh}\`) — artifact left uncommitted`);
  } catch (e) {
    warn(
      `graph ${name} @ ${scope}: refresh failed (${(e as Error).message.split('\n')[0]}) — ` +
        `run \`${spec.refresh}\` there by hand`,
    );
  }
}
