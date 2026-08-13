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

export function say(line: string): void {
  console.log(line);
}

export function warn(line: string): void {
  console.error(line);
}
