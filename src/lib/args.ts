import type { ArgsDef } from 'citty';

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
// Deliberately not a parser — citty is (MV-104). It is not the refusal either,
// and that is the whole reason this file survived the dependency: measured on
// 0.2.2, citty parses `--nope` into a key nobody declared and hands it over,
// and the command runs having ignored it. That is MV-85's defect
// verbatim. So the order is refuse first, parse second, and a parser that never
// sees an undeclared argument cannot silently drop one.
//
// One declaration, two readers: `surfaceFrom` turns the ArgsDef citty parses
// into the surface this refuses against, so adding a flag is one edit and the
// two can no longer drift.

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
export function undeclared(
  name: string,
  argv: string[],
  s: Surface,
  /**
   * The surface as this command already words it. Optional, and only ever
   * cosmetic: what is LEGAL comes from `s`, which comes from the declaration
   * citty parses. Commands that shipped their own sentence keep it — the
   * refusal is documented output, and this change is about where parsing
   * happens, not about what a user reads (MV-104).
   */
  takes?: string,
): string | null {
  const flags = s.flags ?? [];
  const valued = s.valued ?? [];
  const max = s.positionals ?? 0;
  const rendered = takes ?? surfaceOf(s);
  let seen = 0;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('-')) {
      // Read the token the way the parser reads it (MV-105). citty splits
      // `--name=value`; comparing the WHOLE token instead refused
      // `init --provider=claude` as an unknown flag — a form 0.8.0 accepted
      // and 0.9.0 published a refusal for. Only after `--`, because citty
      // does not split a short alias: `-r=api` parses its value as "=api", so
      // accepting it here would hand the parser a token it mis-reads.
      const eq = a.startsWith('--') ? a.indexOf('=') : -1;
      const flag = eq === -1 ? a : a.slice(0, eq);
      if (valued.includes(flag)) {
        if (eq !== -1) continue; // the value came inside the token
        const value = argv[i + 1];
        // Never swallow the next flag. `verify --repo --strict` used to bind
        // repo to "--strict" and run NON-strict without a word — MV-85's own
        // `doctor --sttrict` defect, inside the guard that ends it. A missing
        // value is the same silence: citty binds it to "".
        if (value === undefined || value.startsWith('-')) {
          return `${name}: ${flag} needs a value — ${name} takes ${rendered}`;
        }
        i++; // its value is not a positional, whatever it looks like
        continue;
      }
      if (!flags.includes(flag)) return `${name}: unknown flag "${a}" — ${name} takes ${rendered}`;
      continue;
    }
    if (++seen > max) return `${name}: unexpected argument "${a}" — ${name} takes ${rendered}`;
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

/**
 * The surface a command declares, derived from the arguments citty parses.
 *
 * The point of the derivation is that there is nothing to keep in step: the
 * ArgsDef is the single declaration, `undeclared` reads it here, and citty
 * reads it to parse. A flag added to one is added to both.
 */
export function surfaceFrom(args: ArgsDef): Surface {
  const flags: string[] = [];
  const valued: string[] = [];
  let positionals = 0;
  for (const [name, def] of Object.entries(args)) {
    const d = def as { type?: string; alias?: string | string[] };
    if (d.type === 'positional') {
      positionals++;
      continue;
    }
    const names = [`--${name}`, ...[d.alias ?? []].flat().map((a) => `-${a}`)];
    (d.type === 'string' || d.type === 'enum' ? valued : flags).push(...names);
  }
  return { flags, valued, positionals };
}
