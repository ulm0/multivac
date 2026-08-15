import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeClaudeSettings } from '../../src/doors/settings.js';

test('absent settings file becomes hooks-only JSON', () => {
  const obj = JSON.parse(mergeClaudeSettings(null));
  assert.ok(Array.isArray(obj.hooks.SessionStart));
  assert.equal(obj.hooks.SessionStart[0].hooks[0].command, 'mvac verify');
  assert.equal(obj.hooks.PostToolUse[0].matcher, 'Edit|Write|MultiEdit');
});

test('merge preserves foreign keys and foreign hook entries', () => {
  const raw = JSON.stringify({
    model: 'opus',
    permissions: { allow: ['Bash(ls:*)'] },
    hooks: {
      SessionStart: [{ hooks: [{ type: 'command', command: 'echo hi' }] }],
      Stop: [{ hooks: [{ type: 'command', command: 'echo bye' }] }],
    },
  });
  const obj = JSON.parse(mergeClaudeSettings(raw));
  assert.equal(obj.model, 'opus');
  assert.deepEqual(obj.permissions, { allow: ['Bash(ls:*)'] });
  assert.equal(obj.hooks.Stop[0].hooks[0].command, 'echo bye');
  assert.equal(obj.hooks.SessionStart[0].hooks[0].command, 'echo hi');
  assert.equal(obj.hooks.SessionStart[1].hooks[0].command, 'mvac verify');
});

test('merge is idempotent', () => {
  const once = mergeClaudeSettings(null);
  assert.equal(mergeClaudeSettings(once), once);
});

test('invalid JSON throws instead of clobbering', () => {
  assert.throws(() => mergeClaudeSettings('{oops'), /not valid JSON/);
  assert.throws(() => mergeClaudeSettings('[]'), /must be an object/);
});

test('grapher refresh entry: backgrounded, coalesced, never a failure', () => {
  const obj = JSON.parse(mergeClaudeSettings(null, { refresh: 'graphify update .' }));
  const cmds = (obj.hooks.PostToolUse as { hooks: { command: string }[] }[]).map(
    (e) => e.hooks[0].command,
  );
  assert.equal(cmds.length, 2); // verify + refresh
  const refresh = cmds.find((c) => c.includes('graphify update .'))!;
  assert.match(refresh, /graph-refresh\.lock/); // skips when one is running
  assert.match(refresh, /& exit 0$/); // fire-and-forget, exit 0 always
  assert.doesNotMatch(refresh, /git /); // never commits, never stages
  // idempotent, and dropped again when the grapher goes away
  const once = mergeClaudeSettings(null, { refresh: 'graphify update .' });
  assert.equal(mergeClaudeSettings(once, { refresh: 'graphify update .' }), once);
  assert.doesNotMatch(mergeClaudeSettings(once), /graph-refresh\.lock/);
});
