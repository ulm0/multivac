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
