// SQL statement normalization. Line-based matching over DDL is unsound
// (a GRANT split across lines greens a tombstone falsely — Measurement 1),
// so *.sql is matched per statement: comments stripped, whitespace
// collapsed to single spaces, split on ";", with best-effort attribution
// to the statement's first source line.

export interface SqlStatement {
  /** Whitespace-collapsed statement text, no trailing ";". */
  text: string;
  /** 1-based line of the statement's first non-whitespace character. */
  line: number;
}

/**
 * `$$` or `$tag$` at `i`, or '' when this `$` opens no dollar-quote. A `$`
 * following an identifier character belongs to that identifier and opens
 * nothing — Postgres lexes it that way, and reading the `$b$` of `a$b$c` as a
 * tag finds no close and swallows every statement after it into one.
 */
function dollarTag(sql: string, i: number): string {
  if (i > 0 && /[A-Za-z0-9_$]/.test(sql[i - 1])) return '';
  const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i, i + 64));
  return m ? m[0] : '';
}

/** End of the single-quoted literal opening at `i`; `''` is an escape. */
function endOfQuoted(sql: string, i: number): number {
  let j = i + 1;
  while (j < sql.length) {
    if (sql[j] !== "'") j++;
    else if (sql[j + 1] === "'") j += 2;
    else return j + 1;
  }
  return sql.length;
}

export function sqlStatements(sql: string): SqlStatement[] {
  const out: SqlStatement[] = [];
  const n = sql.length;
  let buf = '';
  let startLine = 1;
  let hasContent = false;
  let line = 1;
  const mark = (): void => {
    if (!hasContent) {
      startLine = line;
      hasContent = true;
    }
  };
  const push = (): void => {
    const text = buf.replace(/\s+/g, ' ').trim();
    if (text) out.push({ text, line: startLine });
    buf = '';
    hasContent = false;
  };
  /** Copy sql[i..end) verbatim, counting the newlines it swallows. */
  const take = (i: number, end: number): number => {
    mark();
    const chunk = sql.slice(i, end);
    buf += chunk;
    line += chunk.split('\n').length - 1;
    return end;
  };
  let i = 0;
  while (i < n) {
    const c = sql[i];
    if (c === '\n') {
      line++;
      buf += ' ';
      i++;
    } else if (c === '-' && sql[i + 1] === '-') {
      while (i < n && sql[i] !== '\n') i++;
      buf += ' ';
    } else if (c === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2);
      const stop = end === -1 ? n : end + 2;
      line += sql.slice(i, stop).split('\n').length - 1;
      buf += ' ';
      i = stop;
    } else if (c === "'") {
      i = take(i, endOfQuoted(sql, i));
    } else if (c === '$' && dollarTag(sql, i)) {
      const tag = dollarTag(sql, i);
      const end = sql.indexOf(tag, i + tag.length);
      i = take(i, end === -1 ? n : end + tag.length);
    } else if (c === ';') {
      // the only split: a ";" reaching here is at depth zero — outside every
      // literal, dollar-quoted body and comment.
      push();
      i++;
    } else {
      if (!/\s/.test(c)) mark();
      buf += c;
      i++;
    }
  }
  push();
  return out;
}

// ponytail: double-quoted identifiers and E'\'' backslash escapes are scanned
// as ordinary text, so a ";" inside either still splits. Two more branches
// here if an anchor ever needs them.
