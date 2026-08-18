// MV-99: the roadmap, projected to a declared tracker. One way.
//
// The change files are the SOURCE and issues are their projection. Everything
// here is asserted against a STUBBED vendor CLI on PATH: the real one is not a
// test dependency, and the point being tested is what multivac asks for, not
// what a forge answers.
import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { roadmap } from '../../src/commands/roadmap.js';
import { parseChange, serializeChange } from '../../src/change/file.js';
import { trackerEntry, trackerNames, LABEL_PREFIX } from '../../src/adapters/tracker.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const capture = async (fn: () => Promise<number>): Promise<{ code: number; out: string }> => {
  const lines: string[] = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (l: string) => lines.push(String(l));
  console.error = (l: string) => lines.push(String(l));
  try {
    return { code: await fn(), out: lines.join('\n') };
  } finally {
    console.log = origLog;
    console.error = origErr;
  }
};

/** A stub `glab` that logs its argv and prints an issue URL. */
function stubGlab(bin: string, log: string, opts: { failEdit?: boolean } = {}): void {
  mkdirSync(bin, { recursive: true });
  const p = join(bin, 'glab');
  writeFileSync(
    p,
    [
      '#!/bin/sh',
      `printf '%s\\n' "$*" >> "${log}"`,
      opts.failEdit ? 'case "$*" in *"issue update"*) exit 1 ;; esac' : '',
      'echo "https://gitlab.example/acme/brain/-/issues/41"',
    ].join('\n'),
  );
  chmodSync(p, 0o755);
}

async function eco(cfgExtra: string[] = ['tracker: gitlab']) {
  const tmp = mkdtempSync(join(tmpdir(), 'mvac-track-'));
  const e = makeScratchEcosystem(tmp);
  writeFileSync(
    join(e.brain, '.multivac/config.yml'),
    ['doors: [agents]', ...cfgExtra, 'repos:', '  brain: .', ''].join('\n'),
  );
  return { brain: e.brain, ctx: { cwd: e.brain }, bin: join(tmp, 'bin'), log: join(tmp, 'argv.log') };
}

const changeFile = (brain: string, slug: string): string =>
  join(brain, '.multivac/changes', `${slug}.md`);

/** Write a change file directly: sync must not care how it got there. */
function planted(brain: string, slug: string, status: 'planned' | 'open', issue?: number): void {
  mkdirSync(join(brain, '.multivac/changes'), { recursive: true });
  const fm = [
    '---',
    `slug: ${slug}`,
    `status: ${status}`,
    ...(issue ? [`issue: ${issue}`] : []),
    'repos: {}',
    'landing_order: []',
    'invariants:',
    '  touches: []',
    '  adds: []',
    '  retires: []',
    'claims: []',
    '---',
    '',
    `# ${slug} title`,
    '',
  ].join('\n');
  writeFileSync(changeFile(brain, slug), fm);
}

// --- the registry ---

test('every declared tracker carries a binary, an install hint and its verbs', () => {
  assert.ok(trackerNames.length > 0);
  for (const n of trackerNames) {
    const e = trackerEntry(n)!;
    assert.ok(e.binary && e.installHint, `${n} is missing its binary or hint`);
    for (const verb of [e.create, e.edit, e.close]) assert.ok(verb.length > 0, `${n} verb empty`);
  }
  assert.equal(trackerEntry('acme-forge'), null, 'an unverified tracker gets no entry');
});

// --- US1: the projection ---

test('an undeclared tracker says so and does nothing', async () => {
  const { ctx } = await eco([]);
  const c = await capture(() => roadmap.run(['sync'], ctx));
  assert.equal(c.code, 0);
  assert.match(c.out, /no tracker declared — add `tracker: gitlab`/);
});

test('an absent binary refuses — a projection that cannot run must not report success', async () => {
  const { ctx, bin } = await eco();
  mkdirSync(bin, { recursive: true }); // empty: no glab in it
  const saved = process.env.PATH;
  process.env.PATH = `${bin}:/usr/bin:/bin`;
  try {
    const c = await capture(() => roadmap.run(['sync'], ctx));
    assert.equal(c.code, 1);
    assert.match(c.out, /sync refused — `glab` is not on PATH/);
    assert.match(c.out, /install it \(https:\/\/gitlab\.com\/gitlab-org\/cli\)/);
  } finally {
    process.env.PATH = saved;
  }
});

test('a change with no issue gets one, and the number is recorded', async () => {
  const { brain, ctx, bin, log } = await eco();
  planted(brain, 'points-expire', 'planned');
  stubGlab(bin, log);
  const saved = process.env.PATH;
  process.env.PATH = `${bin}:/usr/bin:/bin`;
  try {
    const c = await capture(() => roadmap.run(['sync'], ctx));
    assert.equal(c.code, 0);
    assert.match(c.out, /points-expire → #41 created/);
    assert.match(c.out, /recorded 1 issue number/);
    const { change } = parseChange(readFileSync(changeFile(brain, 'points-expire'), 'utf8'), 'x');
    assert.equal(change.issue, 41);
    // The label it asked for is its own, and only its own.
    assert.match(readFileSync(log, 'utf8'), new RegExp(`${LABEL_PREFIX}planned`));
  } finally {
    process.env.PATH = saved;
  }
});

test('a second run creates nothing — the recorded number is the identity', async () => {
  const { brain, ctx, bin, log } = await eco();
  planted(brain, 'points-expire', 'open', 41);
  stubGlab(bin, log);
  const saved = process.env.PATH;
  process.env.PATH = `${bin}:/usr/bin:/bin`;
  try {
    const c = await capture(() => roadmap.run(['sync'], ctx));
    assert.match(c.out, /points-expire → #41 up to date/);
    assert.match(c.out, /nothing recorded — every change already carries its issue number/);
    assert.equal(/issue create/.test(readFileSync(log, 'utf8')), false, 'it created a second issue');
  } finally {
    process.env.PATH = saved;
  }
});

test('a recorded number whose issue is gone is reported, never re-created', async () => {
  const { brain, ctx, bin, log } = await eco();
  planted(brain, 'points-expire', 'open', 99);
  stubGlab(bin, log, { failEdit: true });
  const saved = process.env.PATH;
  process.env.PATH = `${bin}:/usr/bin:/bin`;
  try {
    const c = await capture(() => roadmap.run(['sync'], ctx));
    assert.match(c.out, /#99 not found in the tracker — reported, not re-created/);
    assert.equal(/issue create/.test(readFileSync(log, 'utf8')), false);
    // And the file still says 99: nothing the tracker did reached it.
    const { change } = parseChange(readFileSync(changeFile(brain, 'points-expire'), 'utf8'), 'x');
    assert.equal(change.issue, 99);
  } finally {
    process.env.PATH = saved;
  }
});

// --- US2: one way ---

test('an archived change closes its issue, and nothing reads back', async () => {
  const { brain, ctx, bin, log } = await eco();
  mkdirSync(join(brain, '.multivac/changes/archive'), { recursive: true });
  planted(brain, 'done-thing', 'open', 7);
  const text = readFileSync(changeFile(brain, 'done-thing'), 'utf8');
  const parsed = parseChange(text, 'x');
  parsed.change.status = 'archived';
  writeFileSync(
    join(brain, '.multivac/changes/archive/done-thing.md'),
    serializeChange(parsed.change, parsed.body),
  );
  writeFileSync(changeFile(brain, 'done-thing'), ''); // remove the open copy
  const { unlinkSync } = await import('node:fs');
  unlinkSync(changeFile(brain, 'done-thing'));
  stubGlab(bin, log);
  const saved = process.env.PATH;
  process.env.PATH = `${bin}:/usr/bin:/bin`;
  try {
    const c = await capture(() => roadmap.run(['sync'], ctx));
    assert.match(c.out, /done-thing → #7 closed/);
    assert.match(readFileSync(log, 'utf8'), /issue close 7/);
  } finally {
    process.env.PATH = saved;
  }
});

// --- US3: only our labels ---

test('the update asks for its own label and never removes one it does not own', async () => {
  const { brain, ctx, bin, log } = await eco();
  planted(brain, 'points-expire', 'open', 41);
  stubGlab(bin, log);
  const saved = process.env.PATH;
  process.env.PATH = `${bin}:/usr/bin:/bin`;
  try {
    await capture(() => roadmap.run(['sync'], ctx));
    const argv = readFileSync(log, 'utf8');
    assert.match(argv, new RegExp(`--label ${LABEL_PREFIX}open`));
    // Nothing that removes a label: one wiped triage is enough to have this
    // turned off permanently.
    assert.equal(/--unlabel|--remove-label|--labels /.test(argv), false);
  } finally {
    process.env.PATH = saved;
  }
});

// --- MV-01: not from the offline three ---

test('the offline commands never reach the tracker', async () => {
  const { readFileSync: rf } = await import('node:fs');
  const root = join(import.meta.dirname, '../../..');
  for (const f of ['verify.ts', 'doctor.ts', 'doors.ts']) {
    const src = rf(join(root, 'src/commands', f), 'utf8');
    assert.equal(/tracker\.js|createIssue\(|closeIssue\(/.test(src), false, `${f} reaches the tracker`);
  }
});
