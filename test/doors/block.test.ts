import test from 'node:test';
import assert from 'node:assert/strict';
import { BEGIN, END, applyManagedBlock } from '../../src/doors/block.js';

test('absent file is created whole with the block', () => {
  const out = applyManagedBlock(null, 'hello door');
  assert.equal(out, `${BEGIN}\nhello door\n${END}\n`);
});

test('replace touches only the block; user bytes preserved exactly', () => {
  const before = '# My repo\n\ncustom intro\n\n';
  const after = '\n## user appendix\ntrailing  spaces  kept  \n';
  const v1 = applyManagedBlock(before + `${BEGIN}\nold\n${END}\n` + after, 'new body');
  assert.equal(v1, before + `${BEGIN}\nnew body\n${END}\n` + after);
});

test('idempotent: same body twice is a zero diff', () => {
  const v1 = applyManagedBlock('# user file\n', 'body v1');
  assert.equal(applyManagedBlock(v1, 'body v1'), v1);
  const whole = applyManagedBlock(null, 'x');
  assert.equal(applyManagedBlock(whole, 'x'), whole);
});

test('file without markers gets the block appended', () => {
  const out = applyManagedBlock('# hand-written\n', 'body');
  assert.ok(out.startsWith('# hand-written\n'));
  assert.ok(out.endsWith(`${BEGIN}\nbody\n${END}\n`));
});

test('markers inside a code fence are docs, not the block — no data loss', () => {
  const fenced = `# door\n\n\`\`\`\n${BEGIN}\nexample the user wrote\n${END}\n\`\`\`\n`;
  const v1 = applyManagedBlock(fenced, 'real body');
  assert.ok(v1.includes('example the user wrote')); // fenced example untouched
  assert.ok(v1.endsWith(`${BEGIN}\nreal body\n${END}\n`)); // real block appended
  const v2 = applyManagedBlock(v1, 'real body v2'); // and replaced, not duplicated
  assert.ok(v2.includes('example the user wrote'));
  assert.equal(v2.split('real body').length, 2);
});

test('one stray marker is an actionable error', () => {
  assert.throws(
    () => applyManagedBlock(`text\n${BEGIN}\nno end\n`, 'b'),
    /restore both/,
  );
});
