// multivac help — the on-ramp. `help anchor` is the one-screen grammar
// reference measurement 2 found cold adopters learning from our TypeScript.

import { say, warn } from '../lib/out.js';
import type { Command, CommandContext } from '../types.js';

/** Usage block for one command: name, one-liner, extra lines if declared. */
export function usageFor(c: Command): string[] {
  return [`multivac ${c.name} — ${c.help}`, ...(c.usage ?? [])];
}

// One screen, on purpose. Everything a stranger needs before the first
// anchor, nothing else; the long form lives in the site and the skill.
const ANCHOR_HELP = `the anchor grammar — one leg per line, an HTML comment in a brain .md file:

  <!-- @anchor <CLAIM-ID> <repo>:<glob> [![<repo>:]<glob> ...] /<regex>/[i] [present|absent|unique|count=N|each|each!] -->

regex   POSIX ERE only, flag "i" only. PCRE shorthands are rejected — translate:
          \\s -> [[:space:]]   \\d -> [[:digit:]]   \\w -> [[:alnum:]_]
          \\b -> (^|[^[:alnum:]_]) ... ([^[:alnum:]_]|$)

match   per line — except *.sql, matched per normalized statement (comments
        stripped, whitespace collapsed, split on ;). On non-SQL surfaces the
        pattern must fit one physical line of the target.

globs   picomatch over repo-relative paths: ** crosses directories, {a,b}
        alternates, dotfiles match. Exactly ONE include glob per leg — braces
        are the way to alternate paths. !<glob> excludes in every repo the leg
        sees; !<repo>:<glob> excludes in that declared repo only.

modes   present (default) · absent · unique · count=N · each · each!
        absent, count and each block by default; present and unique gate only
        under --strict. count=N counts matches across ALL files the glob
        matches — a deletion ratchet, never a universal: it catches removal,
        not a new file that omits the pattern. each is the universal: EVERY
        matched file must contain a match (each!: must contain none) — the
        failing files are named, and a glob matching zero files fails.

where   anchors live in the brain: any root *.md, .multivac/*.md
        (invariants.md), .multivac/changes/*.md. Lines inside \`\`\` fences or
        indented 4+ spaces never parse.

dry-run a leg before pinning it:  multivac count '<repo>:<glob> /<regex>/'`;

const TOPICS = ['anchor'];

async function run(argv: string[], _ctx: CommandContext): Promise<number> {
  const topic = argv[0];
  if (topic === undefined) {
    say('multivac help <topic|command>');
    say('');
    say(`topics:   ${TOPICS.join(', ')}`);
    const { commands } = await import('./index.js');
    say(`commands: ${commands.map((c) => c.name).join(', ')}`);
    return 0;
  }
  if (topic === 'anchor') {
    say(ANCHOR_HELP);
    return 0;
  }
  const { commands } = await import('./index.js');
  const cmd = commands.find((c) => c.name === topic);
  if (cmd) {
    for (const line of usageFor(cmd)) say(line);
    return 0;
  }
  warn(`unknown help topic "${topic}" — topics: ${TOPICS.join(', ')}, or a command name`);
  return 2;
}

export const helpCommand: Command = {
  name: 'help',
  help: 'help <topic|command> — `help anchor` prints the anchor grammar on one screen',
  usage: ['usage: multivac help [anchor|<command>]'],
  run,
};

export default helpCommand;
