// MV-85. A command refuses what it does not declare, rather than proceeding as
// if you had not passed it.
//
// The defect this exists to end: `mvac doctor --sttrict` ran without the strict
// assertion, printed a full report and exited 0 — a gate saying it checked,
// having checked nothing. Three of nine commands did it with flags, and two of
// those also did it with a directory: `doctor` declares no `[dir]` and calls
// `doctorReport(ctx.cwd)`, so naming another repo got you a truthful report
// about somewhere else, with nothing marking the substitution.
//
// Deliberately not a parser. `verify` and `change` already refuse correctly and
// keep their own loops; the surfaces here are zero to four flags, and reaching
// for a dependency to avoid ten lines is how the third runtime dependency gets
// in. MV-85 states the BEHAVIOUR, not that everyone calls this — a correct
// hand-rolled loop satisfies the row, and the registry test says so.

/** What a command states it takes. Anything else is refused. */
export interface Surface {
  /** Flags that stand alone: `--strict`. */
  flags?: string[];
  /** Flags that take the next argument as their value: `--repo <key>`. */
  valued?: string[];
  /** How many positionals the command declares. Default 0. */
  positionals?: number;
}

/**
 * Returns the refusal line, or null when every argument is declared.
 *
 * `--help`/`-h` never arrive: the dispatcher answers them before a command
 * runs, so no command has to know they exist.
 */
export function undeclared(name: string, argv: string[], s: Surface): string | null {
  const flags = s.flags ?? [];
  const valued = s.valued ?? [];
  const max = s.positionals ?? 0;
  const takes = surfaceOf(s);
  let seen = 0;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('-')) {
      if (valued.includes(a)) {
        // Its value is not a positional, whatever it looks like.
        i++;
        continue;
      }
      if (!flags.includes(a)) return `${name}: unknown flag "${a}" — ${name} takes ${takes}`;
      continue;
    }
    if (++seen > max) return `${name}: unexpected argument "${a}" — ${name} takes ${takes}`;
  }
  return null;
}

/** The declared surface, rendered for the refusal. Never "see --help". */
function surfaceOf(s: Surface): string {
  const parts: string[] = [];
  if ((s.positionals ?? 0) > 0) parts.push('[dir]');
  for (const f of s.valued ?? []) parts.push(`${f} <value>`);
  for (const f of s.flags ?? []) parts.push(f);
  return parts.length === 0 ? 'no arguments' : parts.join(' ');
}
