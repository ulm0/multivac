import test from 'node:test';
import assert from 'node:assert/strict';
import { sqlStatements } from '../../src/anchor/normalize.js';

const MIGRATION = `-- initial schema
CREATE TABLE accounts (
  id bigint PRIMARY KEY,
  balance numeric NOT NULL
);

GRANT
  SELECT,
  UPDATE
ON accounts
TO app_role;
`;

test('a GRANT split across lines is one normalized statement', () => {
  const stmts = sqlStatements(MIGRATION);
  assert.equal(stmts.length, 2);
  assert.equal(stmts[1].text, 'GRANT SELECT, UPDATE ON accounts TO app_role');
  // the per-line false-green vector: no source LINE contains this, the
  // statement does
  assert.match(stmts[1].text, /GRANT.*UPDATE ON accounts/);
});

test('line attribution points at each statement start', () => {
  const stmts = sqlStatements(MIGRATION);
  assert.equal(stmts[0].line, 2); // CREATE TABLE (comment line 1 stripped)
  assert.equal(stmts[1].line, 7); // GRANT
});

test('line and block comments are stripped', () => {
  const stmts = sqlStatements(
    'SELECT 1; -- grant update on secrets\n/* grant\nupdate */ SELECT 2;',
  );
  assert.deepEqual(
    stmts.map((s) => s.text),
    ['SELECT 1', 'SELECT 2'],
  );
  assert.equal(stmts[1].line, 3); // block comment newline counted
});

test('semicolon inside a string literal does not split', () => {
  const stmts = sqlStatements("insert into t values ('a;b');\nselect 1;");
  assert.equal(stmts.length, 2);
  assert.equal(stmts[0].text, "insert into t values ('a;b')");
});

test('trailing statement without semicolon is still emitted', () => {
  const stmts = sqlStatements('SELECT\n  1');
  assert.deepEqual(stmts, [{ text: 'SELECT 1', line: 1 }]);
});

test('whitespace-only and empty input yield no statements', () => {
  assert.deepEqual(sqlStatements(''), []);
  assert.deepEqual(sqlStatements('  \n;\n  ;'), []);
});

const FUNCTION = `CREATE FUNCTION debit(amount numeric) RETURNS void AS $$
BEGIN
  UPDATE accounts SET balance = balance - amount;
  GRANT UPDATE ON accounts TO app_role;
END;
$$ LANGUAGE plpgsql;

REVOKE UPDATE ON accounts FROM app_role;
`;

test('a function body keeps its semicolons in one statement', () => {
  const stmts = sqlStatements(FUNCTION);
  assert.equal(stmts.length, 2);
  assert.match(stmts[0].text, /CREATE FUNCTION debit.*LANGUAGE plpgsql$/);
  assert.match(stmts[0].text, /GRANT UPDATE ON accounts TO app_role;/);
  assert.equal(stmts[1].text, 'REVOKE UPDATE ON accounts FROM app_role');
  assert.equal(stmts[1].line, 8); // newlines inside the $$ body still counted
});

test('a tagged dollar body is closed by its own tag, not by $$', () => {
  const stmts = sqlStatements(
    "DO $body$ SELECT '$$'; SELECT 2; $body$; SELECT 3;",
  );
  assert.deepEqual(
    stmts.map((s) => s.text),
    ["DO $body$ SELECT '$$'; SELECT 2; $body$", 'SELECT 3'],
  );
});

test('$1 and a lone $ are not dollar quotes', () => {
  assert.deepEqual(
    sqlStatements('SELECT $1; SELECT cost$ ;').map((s) => s.text),
    ['SELECT $1', 'SELECT cost$'],
  );
});

test("'' escapes do not end the literal", () => {
  const stmts = sqlStatements("INSERT INTO t VALUES ('it''s; fine'); SELECT 1;");
  assert.deepEqual(
    stmts.map((s) => s.text),
    ["INSERT INTO t VALUES ('it''s; fine')", 'SELECT 1'],
  );
});

test('an unterminated literal swallows the rest instead of splitting wrong', () => {
  assert.deepEqual(
    sqlStatements("SELECT 'oops; still open").map((s) => s.text),
    ["SELECT 'oops; still open"],
  );
});

test('comments carrying semicolons and quotes do not confuse the scanner', () => {
  const stmts = sqlStatements(
    `-- don't split; here
SELECT 1 /* it's a ; comment */ FROM t;
SELECT 2;`,
  );
  assert.deepEqual(
    stmts.map((s) => s.text),
    ['SELECT 1 FROM t', 'SELECT 2'],
  );
  assert.equal(stmts[0].line, 2);
});

test('a $ inside an identifier opens no dollar body', () => {
  // `$b$` read as an opening tag finds no close and swallows the file: two
  // occurrences collapse into one statement, and a `unique` anchor over them
  // goes green on code that has two.
  const stmts = sqlStatements('SELECT a$b$c FROM t;\nSELECT a$b$c FROM u;');
  assert.deepEqual(
    stmts.map((s) => s.text),
    ['SELECT a$b$c FROM t', 'SELECT a$b$c FROM u'],
  );
  // a tag that does NOT follow an identifier character still opens a body
  assert.deepEqual(
    sqlStatements('CREATE FUNCTION f() AS $b$ SELECT 1; $b$;').map((s) => s.text),
    ['CREATE FUNCTION f() AS $b$ SELECT 1; $b$'],
  );
});

test('pathological input terminates without splitting wrong', () => {
  // Each of these used to be a candidate for a hang or a crash; none may be
  // either, and none may lose a statement it should have kept whole.
  for (const sql of [
    '$'.repeat(5000),
    "'".repeat(5000),
    '/*'.repeat(5000),
    `--${'x'.repeat(5000)}`,
    'CREATE FUNCTION f() AS $$ SELECT 1; SELECT 2;', // dollar body never closed
    'SELECT $$;$$; SELECT 2;',
  ]) {
    assert.ok(Array.isArray(sqlStatements(sql)));
  }
  assert.deepEqual(
    sqlStatements('SELECT $$;$$; SELECT 2;').map((s) => s.text),
    ['SELECT $$;$$', 'SELECT 2'],
  );
});
