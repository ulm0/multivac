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

export function sqlStatements(sql: string): SqlStatement[] {
  const out: SqlStatement[] = [];
  let buf = '';
  let startLine = 1;
  let hasContent = false;
  let line = 1;
  const push = (): void => {
    const text = buf.replace(/\s+/g, ' ').trim();
    if (text) out.push({ text, line: startLine });
    buf = '';
    hasContent = false;
  };
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const c = sql[i];
    if (c === '\n') {
      line++;
      buf += ' ';
      i++;
      continue;
    }
    if (c === '-' && sql[i + 1] === '-') {
      while (i < n && sql[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && sql[i + 1] === '*') {
      i += 2;
      while (i < n && !(sql[i] === '*' && sql[i + 1] === '/')) {
        if (sql[i] === '\n') line++;
        i++;
      }
      i += 2;
      continue;
    }
    if (c === "'") {
      // ponytail: naive quote scan — '' escapes read as two adjacent
      // strings, dollar-quoting not handled; matching-wise equivalent for
      // anchors. Upgrade if a real anchor needs $$ bodies.
      if (!hasContent) {
        startLine = line;
        hasContent = true;
      }
      buf += c;
      i++;
      while (i < n && sql[i] !== "'") {
        if (sql[i] === '\n') line++;
        buf += sql[i];
        i++;
      }
      if (i < n) {
        buf += "'";
        i++;
      }
      continue;
    }
    if (c === ';') {
      push();
      i++;
      continue;
    }
    if (!hasContent && !/\s/.test(c)) {
      startLine = line;
      hasContent = true;
    }
    buf += c;
    i++;
  }
  push();
  return out;
}
