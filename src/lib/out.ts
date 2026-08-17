// Terse output helpers. Raw ANSI, NO_COLOR respected, nothing else.

const enabled =
  process.env.NO_COLOR === undefined && process.stdout.isTTY === true;

const wrap = (code: string) => (s: string) =>
  enabled ? `[${code}m${s}[0m` : s;

export const red = wrap('31');
export const green = wrap('32');
export const yellow = wrap('33');
export const dim = wrap('2');
export const bold = wrap('1');

/**
 * The identity's one accent: the site paints `#c3f53c`, the terminal paints
 * 256-colour index 191 (`#d7ff5f`), the nearest index every terminal renders.
 * Exported as the raw code too, because the mark `init` draws decides colour
 * from its own argument rather than from this module's TTY check — one
 * definition of the hue, two gates. 24-bit would hit the hex exactly and is
 * silently wrong where it is unsupported (Terminal.app).
 */
export const ACID = '38;5;191';
export const acid = wrap(ACID);

export function say(line: string): void {
  console.log(line);
}

export function warn(line: string): void {
  console.error(line);
}
