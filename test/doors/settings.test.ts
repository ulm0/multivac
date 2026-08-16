import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeClaudeSettings } from '../../src/doors/settings.js';

/** The merged text, for the tests that only care about the document. */
const merged = (raw: string | null, opts?: { refresh?: string | null; matcher?: string }) =>
  mergeClaudeSettings(raw, opts).text;

test('absent settings file becomes hooks-only JSON', () => {
  const obj = JSON.parse(merged(null));
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
  const obj = JSON.parse(merged(raw));
  assert.equal(obj.model, 'opus');
  assert.deepEqual(obj.permissions, { allow: ['Bash(ls:*)'] });
  assert.equal(obj.hooks.Stop[0].hooks[0].command, 'echo bye');
  assert.equal(obj.hooks.SessionStart[0].hooks[0].command, 'echo hi');
  assert.equal(obj.hooks.SessionStart[1].hooks[0].command, 'mvac verify');
});

test('merge is idempotent', () => {
  const once = merged(null);
  assert.equal(merged(once), once);
});

test('invalid JSON throws instead of clobbering', () => {
  assert.throws(() => mergeClaudeSettings('{oops'), /not valid JSON/);
  assert.throws(() => mergeClaudeSettings('[]'), /must be an object/);
});

test('a foreign entry that mentions the marker is left alone', () => {
  // The reproduction from the change file: a hand-written entry whose command
  // merely CONTAINS ours, beside a second command, on a matcher of their own.
  const raw = JSON.stringify({
    hooks: {
      PostToolUse: [
        {
          matcher: 'Bash',
          hooks: [
            { type: 'command', command: 'mvac verify --strict' },
            { type: 'command', command: 'my-own-linter' },
          ],
        },
      ],
    },
  });
  const obj = JSON.parse(merged(raw));
  const theirs = obj.hooks.PostToolUse[0];
  assert.equal(theirs.matcher, 'Bash'); // not rewritten
  assert.equal(theirs.hooks.length, 2); // not replaced
  assert.equal(theirs.hooks[0].command, 'mvac verify --strict'); // --strict kept
  assert.equal(theirs.hooks[1].command, 'my-own-linter'); // sibling kept
  // Ours is a new entry of our own, appended after theirs.
  const mine = obj.hooks.PostToolUse[1];
  assert.equal(mine.hooks[0].command, 'mvac verify');
  assert.equal(mine.matcher, 'Edit|Write|MultiEdit');
  // Nothing of theirs moves on a second run either.
  assert.equal(merged(merged(raw)), merged(raw));
});

test('an update rewrites one hook, not the entry around it', () => {
  const first = merged(null, { refresh: 'graphify update .' });
  // A user adds their own command, and a timeout, to the entry we wrote.
  const obj = JSON.parse(first);
  const ours = (obj.hooks.PostToolUse as { hooks: { command: string }[]; matcher: string }[]).find(
    (e) => e.hooks[0].command.includes('graphify update .'),
  )!;
  ours.hooks.push({ command: 'my-own-linter' } as never);
  (ours.hooks[0] as { timeout?: number }).timeout = 90;
  ours.matcher = 'Edit';
  // Now the declared grapher changes.
  const after = JSON.parse(merged(JSON.stringify(obj), { refresh: 'othergraph build' }));
  const entry = (
    after.hooks.PostToolUse as {
      hooks: { command: string; timeout?: number }[];
      matcher: string;
    }[]
  ).find((e) => e.hooks.some((h) => h.command.includes('othergraph build')))!;
  assert.equal(entry.matcher, 'Edit'); // their matcher survives an update
  assert.equal(entry.hooks.length, 2);
  assert.equal(entry.hooks[0].timeout, 90); // fields we do not write survive
  assert.doesNotMatch(entry.hooks[0].command, /graphify update \./); // stale command gone
  assert.equal(entry.hooks[1].command, 'my-own-linter'); // sibling survives
  const refreshes = (after.hooks.PostToolUse as { hooks: { command: string }[] }[]).flatMap((e) =>
    e.hooks.filter((h) => h.command.includes('graph-refresh.lock')),
  );
  assert.equal(refreshes.length, 1); // updated, not duplicated
});

test('a duplicate is reported, never deleted', () => {
  // What the old merge left behind: the foreign entry it ate, plus ours.
  const raw = JSON.stringify({
    hooks: {
      PostToolUse: [
        { matcher: 'Edit|Write|MultiEdit', hooks: [{ type: 'command', command: 'mvac verify' }] },
        { matcher: 'Edit|Write|MultiEdit', hooks: [{ type: 'command', command: 'mvac verify' }] },
      ],
    },
  });
  const out = mergeClaudeSettings(raw);
  assert.equal(out.notices.length, 1);
  assert.match(out.notices[0], /PostToolUse/);
  assert.match(out.notices[0], /2 times/);
  assert.match(out.notices[0], /by hand/); // says who removes it
  const obj = JSON.parse(out.text);
  assert.equal(obj.hooks.PostToolUse.length, 2); // both still there
  // One copy is not a duplicate.
  assert.deepEqual(mergeClaudeSettings(merged(null)).notices, []);
});

test('grapher refresh entry: backgrounded, coalesced, never a failure', () => {
  const obj = JSON.parse(merged(null, { refresh: 'graphify update .' }));
  const cmds = (obj.hooks.PostToolUse as { hooks: { command: string }[] }[]).map(
    (e) => e.hooks[0].command,
  );
  assert.equal(cmds.length, 2); // verify + refresh
  const refresh = cmds.find((c) => c.includes('graphify update .'))!;
  assert.match(refresh, /graph-refresh\.lock/); // skips when one is running
  assert.match(refresh, /& exit 0$/); // fire-and-forget, exit 0 always
  assert.doesNotMatch(refresh, /git /); // never commits, never stages
  // idempotent, and dropped again when the grapher goes away
  const once = merged(null, { refresh: 'graphify update .' });
  assert.equal(merged(once, { refresh: 'graphify update .' }), once);
  assert.doesNotMatch(merged(once), /graph-refresh\.lock/);
});

test('dropping the grapher takes our hook, not the entry a user shares with it', () => {
  const obj = JSON.parse(merged(null, { refresh: 'graphify update .' }));
  const ours = (obj.hooks.PostToolUse as { hooks: { command: string }[] }[]).find((e) =>
    e.hooks[0].command.includes('graphify update .'),
  )!;
  ours.hooks.push({ command: 'my-own-linter' } as never);
  const after = JSON.parse(merged(JSON.stringify(obj)));
  const entries = after.hooks.PostToolUse as { hooks: { command: string }[] }[];
  assert.equal(entries.length, 2); // the shared entry survives, emptied of ours
  const shared = entries.find((e) => e.hooks.some((h) => h.command === 'my-own-linter'))!;
  assert.equal(shared.hooks.length, 1);
  // An entry that held only our refresh is dropped whole.
  const bare = JSON.parse(merged(null, { refresh: 'graphify update .' }));
  assert.equal(JSON.parse(merged(JSON.stringify(bare))).hooks.PostToolUse.length, 1);
});
