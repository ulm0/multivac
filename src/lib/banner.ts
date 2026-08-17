// The mark, drawn for a terminal: the console panel, lit lamps and unlit, one
// acid lamp in flight.
//
// The lamp pattern is FIXED, not a live reading. `init` runs before there is
// anything to verify — no law, no anchors, no claims — so a banner that
// pretended to report the state of the brain would be exactly the kind of lie
// this tool exists to prevent. It is the logo, not a report.
//
// Printed by `init` alone. `verify`, `doctor`, `doors` and `change` run inside
// git hooks and harness hooks, where a banner is noise and verify has a
// sub-second
// budget to spend on anchors.

import { ACID } from './out.js';

type Lamp = 'lit' | 'unlit' | 'flight';

const ROWS: readonly (readonly Lamp[])[] = [
  ['lit', 'lit', 'unlit'],
  ['unlit', 'flight', 'lit'],
];

const RIGHT = ['multivac', 'brain-driven development'];

// NO_COLOR keeps the banner and drops the colour: without ANSI the acid lamp
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
  // The accent is defined once, in out.ts, and gated twice: there by the TTY
  // check, here by this function's own `color` argument.
  const acid = (s: string): string => (color ? `\x1b[${ACID}m${s}\x1b[0m` : s);
  const lamp = (l: Lamp): string => (l === 'flight' ? acid(g[l]) : g[l]);
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
