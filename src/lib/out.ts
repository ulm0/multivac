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

/** A line made only of block-element, box-drawing and space characters: drawing, not words. */
const DRAWN = /^[\s\u2500-\u259F]*$/;
/** A Python traceback's header. The exception that closes it is the cause. */
const TRACEBACK = 'Traceback (most recent call last):';
/** Words a tool states its cause in. English only — a ceiling (MV-123). */
const CAUSE = /\berror\b|\brefus|\bdenied\b|\bnot found\b/i;

/**
 * MV-123. The one quote of a failed vendor command: its cause, never its
 * logo. The first three lines used to stand in for it, which is spec-kit
 * 1.0.6's block logo (its cause is line 28 of 34, on stdout) and graphify
 * 0.9.29's traceback header and a path on this machine (its cause is the last
 * line). In order, over stdout then stderr:
 *   1. drawn lines dropped, box borders trimmed off the rest;
 *   2. after the last traceback header, the first unindented line;
 *   3. else the lines naming an error, a refusal, a denial or a thing not found;
 *   4. else the last lines.
 * At most three, joined by `; `. Nothing left is node's own first message line.
 */
export function quoteFailure(err: { stdout?: string; stderr?: string; message: string }): string {
  const lines = `${err.stdout ?? ''}\n${err.stderr ?? ''}`.split(/\r?\n/).filter((l) => !DRAWN.test(l));
  const tb = lines.lastIndexOf(TRACEBACK);
  const exception = tb === -1 ? undefined : lines.slice(tb + 1).find((l) => !/^\s/.test(l));
  // The same range DRAWN drops, so a double or heavy box trims like a rounded one.
  const kept = lines.map((l) => l.replace(/^[\s─-▟]+|[\s─-▟]+$/g, ''));
  const causes = kept.filter((l) => CAUSE.test(l));
  const quote = exception !== undefined ? [exception] : causes.length > 0 ? causes.slice(0, 3) : kept.slice(-3);
  return quote.join('; ') || err.message.split('\n')[0];
}
