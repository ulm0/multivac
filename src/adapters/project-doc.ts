// MV-135. The one line that asks for a project document before `change plan`
// refuses over it. `change new` printed the per-change steps and nothing about
// a constitution still the template, so the next command was the first to
// mention it, as a refusal. This line carries no instruction to continue
// unattended (MV-95): the principles are the human's, and an agent that
// answers for them writes a document no gate can tell from theirs.

import type { Config } from '../types.js';
import { initState } from '../lib/init-state.js';
import { projectDocVerdict } from '../lib/repo-state.js';
import { sddRoots } from './detect.js';
import { sddSpec } from './registry.js';

/** One line per installed, writable root whose gated project document is not written. */
export async function projectDocLines(brain: string, cfg: Config): Promise<string[]> {
  const out: string[] = [];
  for (const r of await sddRoots(brain, cfg)) {
    const spec = r.sdd ? sddSpec(r.sdd) : null;
    if (!spec || r.readOnly || (await initState(spec, r.dir)).state === 'missing') continue;
    for (const doc of spec.projectSteps ?? []) {
      if (doc.reportOnly) continue;
      const { verdict, why } = await projectDocVerdict(r.dir, doc);
      if (verdict === 'written') continue;
      out.push(
        `sdd ${r.sdd} @ ${r.scope}: ${doc.artifact} is ${verdict}${why ? ` (${why})` : ''} — ${doc.run}. ` +
          'Ask the human for the principles and write their answers; `change plan` refuses until it is written',
      );
    }
  }
  return out;
}
