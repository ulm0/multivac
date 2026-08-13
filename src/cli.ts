#!/usr/bin/env node
// Hand-rolled dispatch over the Command[] registry. No framework, on purpose.

import { readFileSync } from 'node:fs';
import { commands } from './commands/index.js';
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

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
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
  return cmd.run(argv.slice(1), { cwd: process.cwd() });
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (e: unknown) => {
    warn((e as Error).message ?? String(e));
    process.exitCode = 1;
  },
);
