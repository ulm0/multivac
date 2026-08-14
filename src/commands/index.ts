import type { Command } from '../types.js';
import { init } from './init.js';
import { seed } from './seed.js';
import { verify } from './verify.js';
import { count } from './count.js';
import { doorsCommand } from './doors.js';
import { doctorCommand } from './doctor.js';
import { reposCommand } from './repos.js';
import { change } from './change.js';
import { helpCommand } from './help.js';

export { usageFor } from './help.js';

// Command registry. cli.ts dispatches over this list and renders --help from it.
export const commands: Command[] = [
  init,
  seed,
  verify,
  count,
  doorsCommand,
  doctorCommand,
  reposCommand,
  change,
  helpCommand,
];
