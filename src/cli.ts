#!/usr/bin/env node
// Hand-rolled dispatch over the Command[] registry. No framework, on purpose.

import { realpathSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { commands, usageFor } from './commands/index.js';
import { warn, say } from './lib/out.js';

function version(): string {
  const pkg = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  ) as { version: string };
  return pkg.version;
}

function usage(): void {
  say('multivac <command> [args]');
  say('');
  say('commands:');
  if (commands.length === 0) {
    say('  (none wired yet)');
  }
  for (const c of commands) {
    say(`  ${c.name.padEnd(10)} ${c.help}`);
  }
}

/** Exported for tests: the whole dispatch, no process globals. */
export async function main(argv: string[], cwd: string): Promise<number> {
  const first = argv[0];
  if (first === undefined || first === '--help' || first === '-h') {
    usage();
    return first === undefined ? 2 : 0;
  }
  if (first === '--version' || first === '-v') {
    say(version());
    return 0;
  }
  const cmd = commands.find((c) => c.name === first);
  if (!cmd) {
    warn(`unknown command "${first}" — run \`multivac --help\` for the list`);
    return 2;
  }
  // --help is answered here, before any side effect: asking a command for
  // help must never run it (measurement 2: `seed --help` executed seed).
  const rest = argv.slice(1);
  if (rest.includes('--help') || rest.includes('-h')) {
    for (const line of usageFor(cmd)) say(line);
    return 0;
  }
  return cmd.run(rest, { cwd });
}

// Run only as an entry point (bin/direct node), never on import from a test.
const entry = process.argv[1];
let isEntry = false;
try {
  isEntry = entry !== undefined && realpathSync(entry) === fileURLToPath(import.meta.url);
} catch {
  isEntry = false;
}
if (isEntry) {
  main(process.argv.slice(2), process.cwd()).then(
    (code) => {
      process.exitCode = code;
    },
    (e: unknown) => {
      warn((e as Error).message ?? String(e));
      process.exitCode = 1;
    },
  );
}
