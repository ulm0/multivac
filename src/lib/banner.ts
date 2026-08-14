// The mark, drawn for a terminal: the console panel, lit lamps and unlit, one
// amber lamp in flight.
//
// The lamp pattern is FIXED, not a live reading. `init` runs before there is
// anything to verify — no law, no anchors, no claims — so a banner that
// pretended to report the state of the brain would be exactly the kind of lie
// this tool exists to prevent. It is the logo, not a report.
//
// Printed by `init` alone. `verify`, `doctor`, `doors` and `change` run inside
// git hooks and in CI, where a banner is noise and verify has a sub-second
// budget to spend on anchors.

type Lamp = 'lit' | 'unlit' | 'flight';

const ROWS: readonly (readonly Lamp[])[] = [
  ['lit', 'lit', 'unlit'],
  ['unlit', 'flight', 'lit'],
];

const RIGHT = ['multivac', 'brain-driven development'];

// NO_COLOR keeps the banner and drops the colour: without ANSI the amber lamp
// is indistinguishable from a lit one, so the glyphs carry the difference.
const GLYPHS = {
  color: { lit: '●', unlit: '○', flight: '◍' },
  plain: { lit: '#', unlit: '.', flight: '*' },
} as const;

export interface BannerOptions {
  /** --quiet: init says nothing, banner included. */
  quiet: boolean;
  /** stdout is a terminal. A pipe or a log file gets no drawing. */
  tty: boolean;
  /** NO_COLOR unset: ANSI allowed. */
  color: boolean;
}

/** The banner, or null when this run must not print one. */
export function banner({ quiet, tty, color }: BannerOptions): string | null {
  if (quiet || !tty) return null;
  const g = color ? GLYPHS.color : GLYPHS.plain;
  const dim = (s: string): string => (color ? `\x1b[2m${s}\x1b[0m` : s);
  const amber = (s: string): string => (color ? `\x1b[33m${s}\x1b[0m` : s);
  const lamp = (l: Lamp): string => (l === 'flight' ? amber(g[l]) : g[l]);
  const row = (i: number): string =>
    `  ${dim('│')}  ${ROWS[i].map(lamp).join('   ')}    ${dim('│')}   ${RIGHT[i]}`;
  return [
    `  ${dim('╭───────────────╮')}`,
    row(0),
    row(1),
    `  ${dim('╰───────────────╯')}`,
    '',
  ].join('\n');
}
