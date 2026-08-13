// The anchor regex dialect gate: POSIX ERE with [[:class:]] classes,
// compiled to a JS RegExp. PCRE shorthands are rejected at parse time with
// a translation hint — macOS git grep drops them silently, so accepting
// them here would let anchors pass vacuously elsewhere.

export class RegexDialectError extends Error {}

const ESCAPE_HINTS: Record<string, string> = {
  s: '\\s is not POSIX ERE — use [[:space:]]',
  S: '\\S is not POSIX ERE — use [^[:space:]]',
  d: '\\d is not POSIX ERE — use [[:digit:]]',
  D: '\\D is not POSIX ERE — use [^[:digit:]]',
  w: '\\w is not POSIX ERE — use [[:alnum:]_]',
  W: '\\W is not POSIX ERE — use [^[:alnum:]_]',
  b: '\\b is not POSIX ERE — use (^|[^[:alnum:]_])...([^[:alnum:]_]|$)',
  B: '\\B is not POSIX ERE — no equivalent, restructure the pattern',
};

// [:name:] -> character-set body usable inside a JS bracket expression.
const POSIX_CLASSES: Record<string, string> = {
  space: ' \\t\\r\\n\\v\\f',
  blank: ' \\t',
  digit: '0-9',
  alpha: 'a-zA-Z',
  alnum: 'a-zA-Z0-9',
  upper: 'A-Z',
  lower: 'a-z',
  xdigit: '0-9a-fA-F',
  punct: '!-/:-@\\[-`{-~',
};

/**
 * Compile an anchor regex. Throws RegexDialectError (message includes the
 * fix) on PCRE shorthands, unknown [:class:], flags other than "i", or
 * syntax errors.
 */
export function compileAnchorRegex(source: string, flags = ''): RegExp {
  if (!/^i?$/.test(flags)) {
    throw new RegexDialectError(
      `unsupported regex flags "${flags}" — only "i" is allowed, drop the rest`,
    );
  }
  for (let i = 0; i < source.length; i++) {
    if (source[i] === '\\') {
      const next = source[i + 1] ?? '';
      const hint = ESCAPE_HINTS[next];
      if (hint) throw new RegexDialectError(hint);
      i++; // skip the escaped char
    }
  }
  const translated = source.replace(/\[:([a-z]+):\]/g, (m, name: string) => {
    const body = POSIX_CLASSES[name];
    if (body === undefined) {
      throw new RegexDialectError(
        `unknown POSIX class ${m} — use one of [:${Object.keys(POSIX_CLASSES).join(':] [:')}:]`,
      );
    }
    return body;
  });
  try {
    return new RegExp(translated, flags);
  } catch (e) {
    throw new RegexDialectError(
      `invalid regex /${source}/${flags}: ${(e as Error).message} — fix the pattern in the anchor line`,
    );
  }
}
