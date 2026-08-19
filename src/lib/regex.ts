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
  // One walk, and it now knows where it is. The eight-entry denylist below was
  // the whole gate, so every construct nobody had thought to list compiled with
  // JS meaning and a different meaning — or none — to git grep. Worse, the
  // translation two lines down used to fire ANYWHERE, so `PIN[:digit:]` — the
  // canonical forgot-the-outer-bracket mistake — became `/PIN0-9/`, matching
  // only the literal text "PIN0-9" and never "PIN4". Written as an `absent`
  // leg that is green forever while real violations sit in the glob: the false
  // green this tool exists to prevent, produced by the gate meant to catch it.
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '\\') {
      const next = source[i + 1] ?? '';
      const hint = ESCAPE_HINTS[next];
      if (hint) throw new RegexDialectError(hint);
      if (next >= '1' && next <= '9') {
        throw new RegexDialectError(
          `\\${next} is a backreference — POSIX ERE has none; write the text out, or match it in two legs`,
        );
      }
      if (/[a-zA-Z]/.test(next)) {
        throw new RegexDialectError(
          `\\${next} has no meaning in POSIX ERE — escape punctuation only, or use a bracket expression`,
        );
      }
      i++; // skip the escaped char
      continue;
    }
    if (c === '[') {
      // A bracket expression. `[:` here is the mistake grep has its own error
      // for: the class lives INSIDE the expression, so it needs both.
      if (source[i + 1] === ':') {
        const close = source.indexOf(':]', i + 2);
        const name = close === -1 ? '' : source.slice(i + 2, close);
        throw new RegexDialectError(
          `character class syntax is [[:${name || 'name'}:]], not [:${name || 'name'}:] — ` +
            'the class needs its own brackets inside the bracket expression',
        );
      }
      let j = i + 1;
      if (source[j] === '^') j++;
      if (source[j] === ']') j++; // a literal ] is legal as the first member
      while (j < source.length) {
        // A class inside the expression, where it belongs: consume it whole so
        // its `]` does not read as the end of the expression.
        if (source[j] === '[' && source[j + 1] === ':') {
          const end = source.indexOf(':]', j + 2);
          if (end === -1) break; // unterminated: let RegExp report it
          j = end + 2;
          continue;
        }
        if (source[j] === ']') break;
        j++;
      }
      i = j;
      continue;
    }
    if (c === '(' && source[i + 1] === '?') {
      throw new RegexDialectError(
        'POSIX ERE has no `(?…)` — no lookaround, no non-capturing groups; use a plain group',
      );
    }
    if ((c === '*' || c === '+' || c === '?' || c === '}') && source[i + 1] === '?') {
      throw new RegexDialectError(
        `POSIX ERE quantifiers are greedy — \`${c}?\` is not lazy here; restructure the pattern`,
      );
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
