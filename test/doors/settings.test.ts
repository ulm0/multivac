import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeClaudeSettings, refreshHookCmd, refreshKey, type RefreshHook } from '../../src/doors/settings.js';
import { grapherSpec } from '../../src/adapters/registry.js';

/** The merged text, for the tests that only care about the document. */
const merged = (raw: string | null, opts?: { refresh?: string | null; matcher?: string; env?: Record<string, string> }) =>
  mergeClaudeSettings(raw, opts).text;

test('absent settings file becomes hooks-only JSON', () => {
  const obj = JSON.parse(merged(null));
  assert.ok(Array.isArray(obj.hooks.SessionStart));
  assert.equal(obj.hooks.SessionStart[0].hooks[0].command, 'mvac verify 2>&1 || true');
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
  assert.equal(obj.hooks.SessionStart[1].hooks[0].command, 'mvac verify 2>&1 || true');
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
  assert.equal(mine.hooks[0].command, 'mvac verify >&2 || exit 2');
  assert.equal(mine.matcher, 'Edit|Write|MultiEdit');
  // Nothing of theirs moves on a second run either.
  assert.equal(merged(merged(raw)), merged(raw));
});

test('a gate under a matcher we do not own gets ours beside it, and says so', () => {
  // Exactly multivac's command, in an entry multivac did not write, on a
  // matcher of their own: ours by identity, theirs by grouping. Claiming it
  // and stopping there would leave the edit tools ungated — silently.
  const raw = JSON.stringify({
    hooks: { PostToolUse: [{ matcher: 'Bash', hooks: [{ command: 'mvac verify' }] }] },
  });
  const out = mergeClaudeSettings(raw);
  const post = JSON.parse(out.text).hooks.PostToolUse as {
    matcher: string;
    hooks: { command: string }[];
  }[];
  assert.equal(post.length, 2);
  assert.equal(post[0].matcher, 'Bash'); // their matcher is never rewritten
  assert.equal(post[1].matcher, 'Edit|Write|MultiEdit'); // the gate covers what it gates
  assert.equal(post[1].hooks[0].command, 'mvac verify >&2 || exit 2');
  assert.equal(out.notices.length, 1); // and the user is told, not left to find it
  assert.match(out.notices[0], /PostToolUse/);
  assert.match(out.notices[0], /Edit\|Write\|MultiEdit/);
  assert.match(out.notices[0], /added its own entry beside yours/);
  // A second run adds nothing more — the gate is covered — and the copy it
  // added last time is now reported as the duplicate it is.
  const again = mergeClaudeSettings(out.text);
  assert.equal(JSON.parse(again.text).hooks.PostToolUse.length, 2);
  assert.equal(again.notices.length, 1);
  assert.match(again.notices[0], /2 times/);
});

test('a hook of ours typed by hand is completed, not left malformed', () => {
  // `type` is a field multivac writes, so a hook that is ours by identity gets
  // it: the harness runs no hook whose type is missing, and claiming one
  // without repairing it would gate nothing at all.
  const raw = JSON.stringify({
    hooks: {
      PostToolUse: [{ matcher: 'Edit|Write|MultiEdit', hooks: [{ command: 'mvac verify' }] }],
    },
  });
  const out = mergeClaudeSettings(raw);
  const post = JSON.parse(out.text).hooks.PostToolUse as { hooks: { type?: string }[] }[];
  assert.equal(post.length, 1); // claimed, so no second copy is appended
  assert.equal(post[0].hooks[0].type, 'command');
  assert.deepEqual(out.notices, []);
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

test('a legacy bare gate is upgraded in place, per event — MV-112', () => {
  // Every brain alive carries the bare command. Ownership is exact-string
  // identity (MV-74), so if the new strings alone were ours the merge would
  // treat the existing entry as foreign, append the gate beside it, and then
  // report a duplicate about a mess multivac itself made.
  const raw = JSON.stringify({
    hooks: {
      SessionStart: [{ hooks: [{ type: 'command', command: 'mvac verify' }] }],
      PostToolUse: [{ matcher: 'Edit|Write|MultiEdit', hooks: [{ type: 'command', command: 'mvac verify' }] }],
    },
  });
  const out = mergeClaudeSettings(raw);
  const obj = JSON.parse(out.text);

  assert.equal(obj.hooks.SessionStart.length, 1, 'a second session entry was appended');
  assert.equal(obj.hooks.SessionStart[0].hooks[0].command, 'mvac verify 2>&1 || true');
  assert.equal(obj.hooks.PostToolUse.length, 1, 'a second edit entry was appended');
  assert.equal(obj.hooks.PostToolUse[0].hooks[0].command, 'mvac verify >&2 || exit 2');
  assert.equal(obj.hooks.PostToolUse[0].matcher, 'Edit|Write|MultiEdit', 'the matcher moved');
  assert.deepEqual(out.notices, [], 'an upgrade is not news');
  assert.equal(merged(out.text), out.text, 'the upgrade is not idempotent');
});

test('the projected commands map the harness channels — MV-112', async () => {
  // The defect was a command that looked right and delivered nothing, so this
  // RUNS the projected strings rather than reading them. The PATH is
  // constructed, never inherited: a globally installed mvac has masked a CI
  // failure in this project before.
  const { mkdtempSync, writeFileSync, chmodSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { spawnSync } = await import('node:child_process');

  const dir = mkdtempSync(join(tmpdir(), 'mvac-channel-'));
  // A red verify: findings on stdout, a warning on stderr, exit 1.
  writeFileSync(join(dir, 'mvac'), '#!/bin/sh\necho "MV-01 broken · blocking"\necho "a warning" >&2\nexit 1\n');
  chmodSync(join(dir, 'mvac'), 0o755);
  const run = (cmd: string, path: string) =>
    spawnSync('sh', ['-c', cmd], { env: { PATH: path }, encoding: 'utf8' });
  const withStub = `${dir}:/usr/bin:/bin`;

  const session = JSON.parse(merged(null)).hooks.SessionStart[0].hooks[0].command as string;
  const edit = JSON.parse(merged(null)).hooks.PostToolUse[0].hooks[0].command as string;

  // SessionStart carries findings into context, and never fails the session.
  const a = run(session, withStub);
  assert.equal(a.status, 0, 'the session gate failed the session');
  assert.match(a.stdout, /MV-01 broken/, 'findings did not reach stdout, the only channel read');
  assert.equal(a.stderr, '', 'anything left on stderr is discarded at session start');

  // PostToolUse returns the failure to the model, on the one channel it reads.
  const b = run(edit, withStub);
  assert.equal(b.status, 2, 'only exit 2 is fed back to the model');
  assert.match(b.stderr, /MV-01 broken/, 'findings did not reach stderr');
  assert.equal(b.stdout, '', 'stdout after a tool call reaches nobody');

  // A gate whose binary has gone refuses rather than waving through.
  const c = run(edit, '/usr/bin:/bin');
  assert.equal(c.status, 2, 'a missing binary passed silently');
  assert.notEqual(c.stderr, '', 'and said nothing about it');
});

test('the post-edit refresh reaches the tool in node_modules/.bin — MV-123', async () => {
  // `doors` wires the hook when the lookup finds the grapher, and the lookup
  // looks in the root's node_modules/.bin. A hook that searched PATH alone would
  // be wired for a binary it can never reach. Run, not read, on a built PATH.
  const { mkdtempSync, mkdirSync, writeFileSync, chmodSync, existsSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { spawnSync } = await import('node:child_process');

  const dir = mkdtempSync(join(tmpdir(), 'mvac-hook-local-'));
  mkdirSync(join(dir, 'node_modules', '.bin'), { recursive: true });
  const stub = join(dir, 'node_modules', '.bin', 'localgraph');
  writeFileSync(stub, '#!/bin/sh\necho ran > local-ran\n');
  chmodSync(stub, 0o755);
  const refresh = JSON.parse(merged(null, { refresh: 'localgraph update .' }))
    .hooks.PostToolUse.map((e: { hooks: { command: string }[] }) => e.hooks[0].command)
    .find((c: string) => c.includes('localgraph')) as string;

  const r = spawnSync('sh', ['-c', refresh], { cwd: dir, env: { PATH: '/usr/bin:/bin' }, encoding: 'utf8' });
  assert.equal(r.status, 0);
  const deadline = Date.now() + 2000;
  while (!existsSync(join(dir, 'local-ran')) && Date.now() < deadline) await new Promise((res) => setTimeout(res, 25));
  assert.ok(existsSync(join(dir, 'local-ran')), 'the backgrounded refresh never reached node_modules/.bin');
});

test('the post-edit refresh exports the entry opt-outs, outside the declared command — MV-124', async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, chmodSync, existsSync, readFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { spawnSync } = await import('node:child_process');

  // No env, no change: this brain's own hook keeps its bytes.
  const today =
    'L=.multivac/cache/graph-refresh.lock; PATH="$PATH:$PWD/node_modules/.bin"; ' +
    'find "$L" -maxdepth 0 -mmin +30 -exec rmdir {} + 2>/dev/null; ' +
    'mkdir -p .multivac/cache && mkdir "$L" 2>/dev/null || exit 0; ' +
    '{ x update .; rmdir "$L"; } >/dev/null 2>&1 </dev/null & exit 0';
  assert.equal(refreshHookCmd('x update .'), today);
  assert.equal(refreshHookCmd('x update .', {}), today);

  const env = { DO_NOT_TRACK: '1', CODEGRAPH_TELEMETRY: '0' };
  const cmd = refreshHookCmd('x update .', env);
  assert.ok(cmd.startsWith('L=.multivac/cache/graph-refresh.lock;'), 'the head that identifies our hook moved');
  const exported = cmd.indexOf('export DO_NOT_TRACK=1 CODEGRAPH_TELEMETRY=0; ');
  assert.ok(exported > 0 && exported < cmd.indexOf('find '), cmd);
  assert.match(cmd, /\{ x update \.; rmdir "\$L"; \}/, 'the declared refresh is unchanged');

  // Recognised as ours on the next merge: rewritten in place, never doubled.
  const once = merged(null, { refresh: 'x update .', env });
  const twice = merged(once, { refresh: 'x update .', env });
  assert.equal(twice, once);
  const refreshes = (JSON.parse(twice).hooks.PostToolUse as { hooks: { command: string }[] }[]).flatMap((e) =>
    e.hooks.filter((h) => h.command.includes('graph-refresh.lock')),
  );
  assert.deepEqual(refreshes.map((h) => h.command), [cmd]);

  // Run, not read: the refresh sees the variables with nothing set in its parent.
  const dir = mkdtempSync(join(tmpdir(), 'mvac-hook-env-'));
  mkdirSync(join(dir, 'node_modules', '.bin'), { recursive: true });
  writeFileSync(join(dir, 'node_modules', '.bin', 'x'), '#!/bin/sh\necho "$DO_NOT_TRACK $CODEGRAPH_TELEMETRY" > env-seen\n');
  chmodSync(join(dir, 'node_modules', '.bin', 'x'), 0o755);
  const r = spawnSync('sh', ['-c', cmd], { cwd: dir, env: { PATH: '/usr/bin:/bin' }, encoding: 'utf8' });
  assert.equal(r.status, 0);
  const seen = join(dir, 'env-seen');
  const deadline = Date.now() + 2000;
  while (!existsSync(seen) && Date.now() < deadline) await new Promise((res) => setTimeout(res, 25));
  assert.equal(readFileSync(seen, 'utf8'), '1 0\n');
});

// --- MV-149: one refresh hook per grapher, each known by its artifact ---

const G = 'graphify-out/graph.json';
const C = '.codegraph/codegraph.db';
const cgSpec = grapherSpec('codegraph')!;
const graphifyHook = (follow?: boolean): RefreshHook => ({ refresh: 'graphify update .', env: {}, artifact: G, follow });
const codegraphHook = (follow?: boolean): RefreshHook => ({ refresh: cgSpec.refresh, env: cgSpec.env ?? {}, artifact: C, follow });
type Post = { matcher?: string; hooks: { type?: string; command: string; timeout?: number }[] }[];
const post = (text: string): Post => JSON.parse(text).hooks.PostToolUse as Post;
const refreshCommands = (text: string): string[] =>
  post(text).flatMap((e) => e.hooks.map((h) => h.command)).filter((c) => c.startsWith('L=.multivac/cache/graph-refresh.lock;'));
const cmdOf = (w: RefreshHook): string => refreshHookCmd(w.refresh, w.env, w.artifact, w.follow);

test('one refresh hook per grapher, each re-rendered and removed by its artifact', () => {
  const both = [graphifyHook(true), codegraphHook(true)];
  const once = merged(null);
  const two = mergeClaudeSettings(once, { refreshes: both }).text;
  assert.deepEqual(refreshCommands(two), both.map(cmdOf));
  // Idempotent (T1), and stable when the config lists the graphers the other
  // way round (T6): each hook is rewritten in place, by its artifact.
  assert.equal(mergeClaudeSettings(two, { refreshes: both }).text, two);
  assert.equal(mergeClaudeSettings(two, { refreshes: [...both].reverse() }).text, two);
  // A user's command beside codegraph's hook, a timeout on it; the grapher
  // changes its command: rewritten in place, the rest kept.
  const obj = JSON.parse(two);
  const entry = (obj.hooks.PostToolUse as Post).find((e) => e.hooks[0]!.command === cmdOf(codegraphHook(true)))!;
  entry.hooks[0]!.timeout = 90;
  entry.hooks.push({ type: 'command', command: 'my-own-linter' });
  const shared = JSON.stringify(obj, null, 2) + '\n';
  const moved = mergeClaudeSettings(shared, { refreshes: [graphifyHook(true), { ...codegraphHook(true), refresh: 'codegraph sync --quiet' }] }).text;
  const kept = post(moved).find((e) => e.hooks.some((h) => h.command === 'my-own-linter'))!;
  assert.match(kept.hooks[0]!.command, /codegraph sync --quiet/);
  assert.equal(kept.hooks[0]!.timeout, 90);
  // Dropping codegraph removes its hook and nothing else (T3): the shared
  // entry keeps the user's command, graphify's hook stays as it was.
  const dropped = mergeClaudeSettings(shared, { refreshes: [graphifyHook(true)] }).text;
  assert.deepEqual(refreshCommands(dropped), [cmdOf(graphifyHook(true))]);
  const left = post(dropped).find((e) => e.hooks.some((h) => h.command === 'my-own-linter'))!;
  assert.deepEqual(left.hooks.map((h) => h.command), ['my-own-linter']);
  // No grapher wanted: every refresh hook goes, and only the emptied entries.
  const none = mergeClaudeSettings(shared, { refreshes: [] }).text;
  assert.deepEqual(refreshCommands(none), []);
  assert.ok(post(none).some((e) => e.hooks.some((h) => h.command === 'my-own-linter')));
});

test('a grapher command a human typed is never a hook of ours', () => {
  const human = ['graphify update .', 'codegraph sync', `test -e ${C} && codegraph sync`];
  const raw = JSON.stringify({
    hooks: { PostToolUse: [{ matcher: 'Edit|Write', hooks: human.map((command) => ({ type: 'command', command })) }] },
  });
  for (const wanted of [[], [graphifyHook()], [codegraphHook()], [graphifyHook(true), codegraphHook(true)]]) {
    const out = mergeClaudeSettings(raw, { refreshes: wanted }).text;
    const theirs = post(out).find((e) => e.matcher === 'Edit|Write')!;
    assert.deepEqual(theirs.hooks.map((h) => h.command), human, JSON.stringify(wanted));
    assert.deepEqual(refreshCommands(out), wanted.map(cmdOf));
  }
});

test("today's hook is taken over in place when a second grapher arrives", () => {
  // A hook written before MV-140's toplevel test names no artifact: keyless.
  const keyless = refreshHookCmd('graphify update .');
  assert.equal(refreshKey(keyless), undefined);
  const raw = JSON.stringify({
    hooks: { PostToolUse: [{ matcher: 'Edit', hooks: [{ type: 'command', command: keyless, timeout: 30 }, { type: 'command', command: 'my-own-linter' }] }] },
  });
  // One grapher wanted: the keyless hook is taken over in place (T4).
  const one = mergeClaudeSettings(raw, { refreshes: [graphifyHook()] }).text;
  assert.deepEqual(refreshCommands(one), [cmdOf(graphifyHook())]);
  assert.equal(post(one)[0]!.matcher, 'Edit');
  assert.equal(post(one)[0]!.hooks[0]!.timeout, 30);
  // A second grapher arrives: graphify keeps its hook, codegraph gets its own
  // entry — never a second graphify hook (T5).
  const two = mergeClaudeSettings(one, { refreshes: [graphifyHook(true), codegraphHook(true)] }).text;
  assert.deepEqual(refreshCommands(two), [cmdOf(graphifyHook(true)), cmdOf(codegraphHook(true))]);
  assert.equal(post(two)[0]!.hooks[0]!.command, cmdOf(graphifyHook(true)), 'rewritten where it sat');
  // Straight from the keyless hook to two graphers: the first takes it over.
  const straight = mergeClaudeSettings(raw, { refreshes: [codegraphHook(true), graphifyHook(true)] }).text;
  assert.deepEqual(refreshCommands(straight), [cmdOf(codegraphHook(true)), cmdOf(graphifyHook(true))]);
  assert.equal(post(straight)[0]!.hooks[1]!.command, 'my-own-linter');
});

test("one grapher keeps today's bytes", () => {
  // The merge's output for one grapher, fresh and over a file it wrote,
  // equals the one-hook merge's: the list of one and the sugar agree, and the
  // entry is spelled as ensureEvent always spelled one.
  const expected = (w: RefreshHook): string =>
    JSON.stringify(
      {
        hooks: {
          SessionStart: [{ hooks: [{ type: 'command', command: 'mvac verify 2>&1 || true' }] }],
          PostToolUse: [
            { hooks: [{ type: 'command', command: 'mvac verify >&2 || exit 2' }], matcher: 'Edit|Write|MultiEdit' },
            { hooks: [{ type: 'command', command: cmdOf(w) }], matcher: 'Edit|Write|MultiEdit' },
          ],
        },
      },
      null,
      2,
    ) + '\n';
  for (const w of [graphifyHook(), codegraphHook()]) {
    const fresh = mergeClaudeSettings(null, { refreshes: [w] }).text;
    assert.equal(fresh, expected(w));
    assert.equal(mergeClaudeSettings(null, { refresh: w.refresh, env: w.env, artifact: w.artifact }).text, fresh);
    // Keyed: a file holding this grapher's hook with an older command.
    const old = fresh.replace(JSON.stringify(cmdOf(w)).slice(1, -1), JSON.stringify(refreshHookCmd('old refresh', {}, w.artifact)).slice(1, -1));
    assert.notEqual(old, fresh);
    assert.equal(mergeClaudeSettings(old, { refreshes: [w] }).text, fresh);
  }
});

test('a keyed hook of a grapher no longer wanted is taken over in place by one without a hook', () => {
  // graphify's own hook, keyed by its artifact, in a user's entry: graphify
  // goes and codegraph arrives. codegraph takes that hook over where it sits —
  // the entry's matcher, the timeout and the user's command beside it kept —
  // rather than graphify's hook going and codegraph getting an entry of its own.
  const raw = JSON.stringify({
    hooks: {
      PostToolUse: [
        { matcher: 'Edit', hooks: [{ type: 'command', command: cmdOf(graphifyHook()), timeout: 30 }, { type: 'command', command: 'my-own-linter' }] },
      ],
    },
  });
  const out = mergeClaudeSettings(raw, { refreshes: [codegraphHook()] }).text;
  assert.deepEqual(refreshCommands(out), [cmdOf(codegraphHook())]);
  const [theirs, ...rest] = post(out);
  assert.equal(theirs!.matcher, 'Edit');
  assert.deepEqual(theirs!.hooks.map((h) => h.command), [cmdOf(codegraphHook()), 'my-own-linter']);
  assert.equal(theirs!.hooks[0]!.timeout, 30);
  // The gate's own entry, and no entry appended for codegraph.
  assert.deepEqual(rest.map((e) => e.hooks.map((h) => h.command)), [['mvac verify >&2 || exit 2']]);
});

test("every keyed copy of a wanted grapher's hook is rewritten in its entry, and a grapher wanted twice gets one", () => {
  // Two entries of a user's, each holding graphify's keyed hook with an older
  // command: both are rewritten where they sit and both kept — copies
  // included — each beside the user's own command.
  const old = refreshHookCmd('old refresh', {}, G);
  const raw = JSON.stringify({
    hooks: {
      PostToolUse: [
        { matcher: 'Edit', hooks: [{ type: 'command', command: old }, { type: 'command', command: 'lint-a' }] },
        { matcher: 'Write', hooks: [{ type: 'command', command: old }, { type: 'command', command: 'lint-b' }] },
      ],
    },
  });
  const out = mergeClaudeSettings(raw, { refreshes: [graphifyHook()] }).text;
  assert.deepEqual(refreshCommands(out), [cmdOf(graphifyHook()), cmdOf(graphifyHook())]);
  const [a, b] = post(out);
  assert.deepEqual(a!.hooks.map((h) => h.command), [cmdOf(graphifyHook()), 'lint-a']);
  assert.deepEqual(b!.hooks.map((h) => h.command), [cmdOf(graphifyHook()), 'lint-b']);
  // One grapher listed twice is one hook: two hooks with one key would trade
  // places on every run.
  assert.deepEqual(refreshCommands(mergeClaudeSettings(null, { refreshes: [graphifyHook(), graphifyHook()] }).text), [cmdOf(graphifyHook())]);
});

test('two keyless copies of ours become one', () => {
  const keyless = refreshHookCmd('graphify update .');
  const raw = JSON.stringify({
    hooks: {
      PostToolUse: [
        { matcher: 'Edit|Write|MultiEdit', hooks: [{ type: 'command', command: keyless }] },
        { matcher: 'Edit|Write|MultiEdit', hooks: [{ type: 'command', command: keyless }] },
      ],
    },
  });
  const out = mergeClaudeSettings(raw, { refreshes: [graphifyHook()] });
  assert.deepEqual(refreshCommands(out.text), [cmdOf(graphifyHook())]);
  assert.deepEqual(out.notices, [], 'the refresh is not the gate: nothing to report');
  assert.equal(mergeClaudeSettings(out.text, { refreshes: [graphifyHook()] }).text, out.text);
});

test('refreshKey reads the artifact from both hook forms, and the brain guard is not one', () => {
  for (const [w, art] of [
    [graphifyHook(), G],
    [graphifyHook(true), G],
    [codegraphHook(), C],
    [codegraphHook(true), C],
  ] as const) {
    assert.equal(refreshKey(cmdOf(w)), art, cmdOf(w));
  }
  // The follow form's guard names `.multivac/config.yml` behind a `!`: not a key.
  assert.ok(cmdOf(graphifyHook(true)).includes('[ ! -e "$t/.multivac/config.yml" ]'));
  assert.equal(refreshKey('[ ! -e "$t/.multivac/config.yml" ] && exit 0'), undefined);
  assert.equal(refreshKey(refreshHookCmd('graphify update .')), undefined, 'keyless: written before the test existed');
});
