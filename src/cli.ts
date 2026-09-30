#!/usr/bin/env node
// Hand-rolled dispatch over the Command[] registry. No framework, on purpose.

import { realpathSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { commands, usageFor } from './commands/index.js';
import { ConfigError } from './lib/config.js';
import { warn, say } from './lib/out.js';
import { paint, selfVersion as version, versionNotice } from './lib/version.js';
import { resolveRoot } from './commands/verify.js';

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

/**
 * Exported for tests: the whole dispatch, no process globals. MV-151: `io` is
 * the environment and the stdin reader a command may read, and only as given —
 * the entry point passes the process's, an in-process caller its own or none.
 */
export async function main(
  argv: string[],
  cwd: string,
  io: { env?: Record<string, string | undefined>; stdin?: () => Promise<string | null> } = {},
): Promise<number> {
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
  const cmd = commands.find((c) => c.name === first);
  try {
    // MV-151: a rooted command reads the brain of the root it will read — from
    // a subdirectory, a change worktree or a consumer, the brain it verifies
    // against — so a floor that brain declares reaches every such run. A
    // resolution that fails reads this directory, as before.
    const root = cmd?.rooted ? await resolveRoot(cwd).catch(() => null) : null;
    const brain = root !== null && (root.kind === 'brain' || root.kind === 'consumer') ? root.brain : cwd;
    const raw = readFileSync(join(brain, '.multivac/config.yml'), 'utf8');
    const found = versionNotice(brain, version(), raw);
    // In a consumer only the floor speaks: the record's fix, `doors --adopt`,
    // runs in the brain, and advice aimed at another checkout is not printed.
    const n = root?.kind === 'consumer' && found?.level !== 'red' ? null : found;
    if (n) warn(paint(n));
  } catch {
    // Not a brain, or the version is unreadable. Either way there is nothing
    // to say, and saying nothing is correct — never a crash, never a guess.
  }
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
    return await cmd.run(rest, { cwd, env: io.env, stdin: io.stdin });
  } catch (e) {
    if (!(e instanceof ConfigError)) throw e;
    warn(e.message);
    return 2;
  }
}

/**
 * MV-151. stdin, whole, for a harness hook's payload: null on a terminal, and
 * null after two seconds on a pipe nobody closes rather than a gate that hangs.
 * Called only when `verify` asks, which it does only under a declared hook
 * payload's marker variable; the harness closes stdin at once.
 */
function readStdin(): Promise<string | null> {
  if (process.stdin.isTTY) return Promise.resolve(null);
  return new Promise((done) => {
    const chunks: Buffer[] = [];
    const t = setTimeout(() => {
      process.stdin.destroy();
      done(null);
    }, 2000);
    process.stdin.on('data', (c: Buffer) => chunks.push(c));
    process.stdin.on('end', () => {
      clearTimeout(t);
      done(Buffer.concat(chunks).toString('utf8'));
    });
    process.stdin.on('error', () => {
      clearTimeout(t);
      done(null);
    });
  });
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
  main(process.argv.slice(2), process.cwd(), { env: process.env, stdin: readStdin }).then(
    (code) => {
      process.exitCode = code;
    },
    (e: unknown) => {
      warn((e as Error).message ?? String(e));
      process.exitCode = e instanceof ConfigError ? 2 : 1;
    },
  );
}
