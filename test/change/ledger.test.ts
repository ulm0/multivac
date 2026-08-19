// MV-110. The lifecycle commits what it wrote, refuses a slug it would
// overwrite, proves a step with that step's own artifact, and reports a failed
// tracker call as a failure.
//
// `commitBookkeeping`'s own docstring states the contract — "nothing is left
// floating" — and five of its writers did not keep it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { change } from '../../src/commands/change.js';
import { trackerEntry, trackerNames } from '../../src/adapters/tracker.js';

for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();

const capture = async (fn: () => Promise<number>): Promise<{ code: number; out: string }> => {
  const lines: string[] = [];
  const log = console.log;
  const err = console.error;
  console.log = (...a: unknown[]) => lines.push(a.map(String).join(' '));
  console.error = (...a: unknown[]) => lines.push(a.map(String).join(' '));
  try {
    return { code: await fn(), out: lines.join('\n') };
  } finally {
    console.log = log;
    console.error = err;
  }
};

function brain(): string {
  const e = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-ledger-')));
  writeFileSync(join(e.brain, '.multivac/config.yml'), 'doors: [agents]\nrepos:\n  brain: .\n');
  git(e.brain, 'add', '-A');
  git(e.brain, 'commit', '-q', '-m', 'config');
  return e.brain;
}

test('a slug whose archive exists is refused, and nothing is written', async () => {
  const b = brain();
  mkdirSync(join(b, '.multivac/changes/archive'), { recursive: true });
  writeFileSync(join(b, '.multivac/changes/archive/points-expire.md'), '---\nslug: points-expire\n---\n');
  git(b, 'add', '-A');
  git(b, 'commit', '-q', '-m', 'an archived change');

  const c = await capture(() => change.run(['new', 'points-expire', 'Again'], { cwd: b }));

  assert.equal(c.code, 1, c.out);
  assert.match(c.out, /already archived/);
  assert.equal(existsSync(join(b, '.multivac/changes/points-expire.md')), false, 'it wrote anyway');
});

test('the SDD proof names one feature: never a substring, never a tail', async () => {
  // Two defects, one line of registry data. The glob first wrapped the slug in
  // wildcards on both sides, so any older directory CONTAINING it proved the
  // step (MV-110). Narrowing it to `*-<slug>` ended that and left the tail:
  // `^.*-expire$` still took `030-points-expire`, because the `*` swallows
  // `030-points`. `<n>` cannot cross the separator, so both are dead (MV-113).
  const b = brain();
  writeFileSync(join(b, '.multivac/config.yml'), 'doors: [agents]\nsdd: speckit\nrepos:\n  brain: .\n');
  mkdirSync(join(b, '.specify/memory'), { recursive: true });
  writeFileSync(join(b, '.specify/memory/constitution.md'), '# Constitution\n\n## I. A principle\n\nReal text.\n');
  mkdirSync(join(b, 'specs/003-rapid-points-expire-rollout'), { recursive: true });
  writeFileSync(join(b, 'specs/003-rapid-points-expire-rollout/spec.md'), '# Someone else\n');
  git(b, 'add', '-A');
  git(b, 'commit', '-q', '-m', 'another change’s artifacts');
  await capture(() => change.run(['new', 'points-expire', 'Points expire'], { cwd: b }));

  const c = await capture(() => change.run(['plan', 'points-expire'], { cwd: b }));

  assert.match(c.out, /refused — specs\/<n>-points-expire\/spec\.md is missing/);
});

test('a tail is not a match, and a numbered directory still is — MV-113', async () => {
  // The half MV-110 claimed and did not deliver. `expire` is the tail of
  // `points-expire`, so the longer directory must not prove the shorter slug —
  // and the pair matters: a rule that refused everything would pass the first
  // assertion alone.
  const b = brain();
  writeFileSync(join(b, '.multivac/config.yml'), 'doors: [agents]\nsdd: speckit\nrepos:\n  brain: .\n');
  mkdirSync(join(b, '.specify/memory'), { recursive: true });
  writeFileSync(join(b, '.specify/memory/constitution.md'), '# Constitution\n\n## I. A principle\n\nReal text.\n');
  mkdirSync(join(b, 'specs/030-points-expire'), { recursive: true });
  writeFileSync(join(b, 'specs/030-points-expire/spec.md'), '# Another feature\n');
  git(b, 'add', '-A');
  git(b, 'commit', '-q', '-m', "another feature's spec");
  await capture(() => change.run(['new', 'expire', 'Expire'], { cwd: b }));

  const tail = await capture(() => change.run(['plan', 'expire'], { cwd: b }));
  assert.match(tail.out, /refused — specs\/<n>-expire\/spec\.md is missing/, 'a tail proved the step');

  mkdirSync(join(b, 'specs/031-expire'), { recursive: true });
  writeFileSync(join(b, 'specs/031-expire/spec.md'), '# The real one\n');
  const ok = await capture(() => change.run(['plan', 'expire'], { cwd: b }));
  assert.doesNotMatch(ok.out, /spec\.md is missing/, 'the numbered directory did not prove it');

  // And two of them is a refusal naming both, not a coin toss on sort order.
  mkdirSync(join(b, 'specs/032-expire'), { recursive: true });
  writeFileSync(join(b, 'specs/032-expire/spec.md'), '# A stray\n');
  const clash = await capture(() => change.run(['plan', 'expire'], { cwd: b }));
  assert.match(clash.out, /matches more than one place in brain/);
  assert.match(clash.out, /031-expire/);
  assert.match(clash.out, /032-expire/);
});

test('land commits its own status bump — nothing is left floating', async () => {
  const b = brain();
  await capture(() => change.run(['new', 'trust-me', 'Trust me'], { cwd: b }));
  const file = join(b, '.multivac/changes/trust-me.md');
  writeFileSync(
    file,
    readFileSync(file, 'utf8').replace('repos: {}', 'repos:\n  brain:\n    status: planned'),
  );
  git(b, 'add', '-A');
  git(b, 'commit', '-q', '-m', 'declare');
  await capture(() => change.run(['plan', 'trust-me'], { cwd: b }));
  await capture(() => change.run(['apply', 'trust-me'], { cwd: b }));

  await capture(() => change.run(['land', 'trust-me', '--landed', 'brain'], { cwd: b }));

  assert.equal(git(b, 'status', '--porcelain', '--', '.multivac/changes'), '', 'land left the bump uncommitted');
});

test("close's printed commit carries the law it repointed", async () => {
  const b = brain();
  // `change new` commits its own bookkeeping, so there is nothing to settle
  // here — which is the contract this whole file is about.
  await capture(() => change.run(['new', 'quiet-one', 'Quiet one'], { cwd: b }));

  const c = await capture(() => change.run(['close', 'quiet-one', '--abandon'], { cwd: b }));

  assert.match(c.out, /\.multivac\/invariants\.md/, 'the printed commit omits the law it edited');
});

test('every tracker states the label flag its own vendor documents', () => {
  // The flag was hard-coded as `--label`, which `gh issue edit` does not have —
  // it documents --add-label. Every GitHub update therefore failed, and the
  // failure was printed as "not found in the tracker", a different fact.
  assert.deepEqual(trackerNames.sort(), ['github', 'gitlab']);
  assert.equal(trackerEntry('gitlab')?.labelFlag, '--label');
  assert.equal(trackerEntry('github')?.labelFlag, '--add-label');
});

test('an abandoned change with a landed repo does not claim nothing landed', async () => {
  // The sentence was asserted, never checked. A change can be abandoned with
  // repos already merged, and writing the opposite into the permanent record
  // is a lie the archive keeps.
  const b = brain();
  await capture(() => change.run(['new', 'half-done', 'Half done'], { cwd: b }));
  const file = join(b, '.multivac/changes/half-done.md');
  writeFileSync(
    file,
    readFileSync(file, 'utf8').replace('repos: {}', 'repos:\n  brain:\n    status: landed'),
  );
  git(b, 'add', '-A');
  git(b, 'commit', '-q', '-m', 'declare');

  const c = await capture(() => change.run(['close', 'half-done', '--abandon'], { cwd: b }));

  assert.equal(c.code, 0, c.out);
  assert.doesNotMatch(c.out, /nothing landed/, 'it denied work that had landed');
  assert.match(c.out, /ALREADY LANDED: brain/);
});

test('close refuses a claim it would orphan by archiving — MV-117', async () => {
  // close verifies a claim against every anchor it can see, INCLUDING the ones
  // inside the change file, and then archives that file — and the parser never
  // walks changes/archive/. So the ceremony whose job is to stop a claim
  // nobody checks could create one, and report success doing it.
  const b = brain();
  // The claim must be GREEN, or close refuses at the claims gate and never
  // reaches the orphan check — so the anchor points at a real file.
  writeFileSync(join(b, 'kept.txt'), 'the pattern lives here\n');
  await capture(() => change.run(['new', 'orphan-me', 'Orphan me'], { cwd: b }));
  const file = join(b, '.multivac/changes/orphan-me.md');
  writeFileSync(
    file,
    readFileSync(file, 'utf8')
      .replace('repos: {}', 'repos:\n  brain:\n    status: landed')
      .replace('claims: []', 'claims:\n  - id: MV-01\n    statement: "anchored only here"')
      + '\n<!-- @anchor MV-01 brain:kept.txt /the pattern/ -->\n',
  );
  git(b, 'add', '-A');
  git(b, 'commit', '-q', '-m', 'a claim anchored only in its own change file');

  const c = await capture(() => change.run(['close', 'orphan-me'], { cwd: b }));

  assert.equal(c.code, 1, c.out);
  assert.match(c.out, /anchored ONLY in/);
  assert.match(c.out, /MV-01/);
  assert.equal(existsSync(join(b, '.multivac/changes/archive/orphan-me.md')), false, 'it archived anyway');
});

test('an existing archive is never overwritten — MV-117', async () => {
  const b = brain();
  await capture(() => change.run(['new', 'twice', 'Twice'], { cwd: b }));
  const { archiveChange, loadChange } = await import('../../src/change/file.js');
  const parsed = await loadChange(b, 'twice');
  // The archive appears AFTER the change was loaded — the parallel-branch
  // shape this project designs for, and the one the front-door guard (MV-110)
  // cannot see. So the write itself has to refuse.
  mkdirSync(join(b, '.multivac/changes/archive'), { recursive: true });
  writeFileSync(join(b, '.multivac/changes/archive/twice.md'), '---\nslug: twice\n---\nthe first record\n');

  await assert.rejects(() => archiveChange(b, parsed), /already exists/);
  assert.match(
    readFileSync(join(b, '.multivac/changes/archive/twice.md'), 'utf8'),
    /the first record/,
    'the archived record was overwritten',
  );
});

test('an unknown frontmatter key is named where it is dropped — MV-117', async () => {
  const b = brain();
  await capture(() => change.run(['new', 'stray-key', 'Stray key'], { cwd: b }));
  const file = join(b, '.multivac/changes/stray-key.md');
  writeFileSync(file, readFileSync(file, 'utf8').replace('status: open', 'status: open\nowner: someone'));

  const c = await capture(() => change.run(['plan', 'stray-key'], { cwd: b }));

  assert.match(c.out, /dropping frontmatter key/);
  assert.match(c.out, /owner/);
});
