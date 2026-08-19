#!/usr/bin/env node
// Hand-rolled dispatch over the Command[] registry. No framework, on purpose.

import { realpathSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { commands, usageFor } from './commands/index.js';
import { ConfigError } from './lib/config.js';
import { warn, say } from './lib/out.js';
import { paint, selfVersion as version, versionNotice } from './lib/version.js';

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
  // MV-86, once and from here rather than in each command: nine call sites is
  // nine chances to forget, which is exactly how MV-85 happened. Before the
  // command runs, so a slow one still prints it up front. Never changes an exit
  // code, never writes.
  // The whole block is guarded: a NOTICE must never be able to take down the
  // command it decorates. Found by its own test, which runs from dist-test/
  // where `version()` cannot find package.json and threw for every command.
  try {
    const raw = readFileSync(join(cwd, '.multivac/config.yml'), 'utf8');
    const n = versionNotice(cwd, version(), raw);
    if (n) warn(paint(n));
  } catch {
    // Not a brain, or the version is unreadable. Either way there is nothing
    // to say, and saying nothing is correct — never a crash, never a guess.
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
  // A config that will not load is an environment error, not a failed check,
  // and the reference has said so since 0.7: every command that reads one
  // exits 2. `count` and `verify` caught it themselves and did; `seed`,
  // `repos` and `roadmap sync` let it out, and every rejection reaching the
  // entry point below was mapped to 1 — so a script could not tell a broken
  // environment from a gate that refused. One catch, where all of them
  // already pass. `doors` and `doctor` are the documented exceptions and
  // never reach it: for them an unloadable config IS the diagnosis they were
  // asked for, so they catch their own and keep exit 1.
  try {
    return await cmd.run(rest, { cwd });
  } catch (e) {
    if (!(e instanceof ConfigError)) throw e;
    warn(e.message);
    return 2;
  }
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
      process.exitCode = e instanceof ConfigError ? 2 : 1;
    },
  );
}
