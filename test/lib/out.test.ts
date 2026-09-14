// MV-123: a failed vendor command is quoted by its cause. The quote used to be
// the first three non-empty lines, which for spec-kit 1.0.6 is its block logo
// and for graphify 0.9.29 is a traceback header and a path on this machine.
// Fed the recorded outputs, never a kinder stand-in.

import test from 'node:test';
import assert from 'node:assert/strict';
import { quoteFailure } from '../../src/lib/out.js';
import { GRAPHIFY_0929_READONLY, SPECKIT_106_NO_CLAUDE } from '../helpers/recorded.js';

const BOX = /[\u2500-\u259F]/;
const failed = (stdout: string, stderr = '') => ({ stdout, stderr, message: 'Command failed: tool run\nmore' });

test('spec-kit without claude is quoted by its cause, with no banner or box character', () => {
  const q = quoteFailure(failed(SPECKIT_106_NO_CLAUDE.stdout, SPECKIT_106_NO_CLAUDE.stderr));
  assert.match(q, /claude not found/);
  assert.doesNotMatch(q, BOX);
  assert.equal(q, 'Agent Detection Error; claude not found');
});

test("graphify's traceback is quoted by its closing exception, and nothing of the frames", () => {
  const q = quoteFailure(failed(GRAPHIFY_0929_READONLY.stdout, GRAPHIFY_0929_READONLY.stderr));
  assert.equal(q, "PermissionError: [Errno 13] Permission denied: 'graphify-out/.rebuild.lock'");
  assert.doesNotMatch(q, /Traceback|File "/);
});

test('a chained traceback is quoted by its last exception', () => {
  const stderr = [
    'Traceback (most recent call last):',
    '  File "/tmp/a.py", line 1, in <module>',
    'KeyError: \'x\'',
    '',
    'During handling of the above exception, another exception occurred:',
    '',
    'Traceback (most recent call last):',
    '  File "/tmp/a.py", line 3, in <module>',
    'RuntimeError: lock is held',
  ].join('\n');
  assert.equal(quoteFailure(failed('', stderr)), 'RuntimeError: lock is held');
});

test('a double or heavy box trims like a rounded one', () => {
  const double = ['╔══ Lock Error ══╗', '║  lock not found   ║', '╚═════════════════╝'].join('\n');
  assert.equal(quoteFailure(failed(double)), 'Lock Error; lock not found');
  const heavy = ['┏━━━━ Error ━━━━┓', '┃ boom denied ┃', '┗━━━━━━━━━━━━━━━┛'].join('\n');
  assert.equal(quoteFailure(failed(heavy)), 'Error; boom denied');
});

test('CRLF output is split on its line ends, so a traceback is still found', () => {
  // The frame names an error too, so only the traceback branch quotes just the exception.
  const stderr = 'Traceback (most recent call last):\r\n  File "C:\\app\\error.py", line 1\r\nOSError: denied\r\n';
  assert.equal(quoteFailure(failed('', stderr)), 'OSError: denied');
});

test('output that names no cause is quoted by its last three non-banner lines', () => {
  const stdout = ['╭────╮', 'one', 'two', '│ three │', 'four', '╰────╯', ''].join('\n');
  assert.equal(quoteFailure(failed(stdout)), 'two; three; four');
});

test("banner-only output is quoted by node's first message line", () => {
  assert.equal(quoteFailure(failed('███╗\n╚══╝\n   \n')), 'Command failed: tool run');
});

test('a line that is its own cause is quoted as itself', () => {
  assert.equal(quoteFailure(failed('', 'error: permission denied\n')), 'error: permission denied');
  assert.equal(
    quoteFailure(failed('', '\n  ERROR: cannot write out/graph.json: ENOENT\n')),
    'ERROR: cannot write out/graph.json: ENOENT',
  );
});
