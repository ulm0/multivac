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

test('the SDD proof matches the slug as a suffix, never as a substring', async () => {
  // The registry's own note said "the gates match the slug as a suffix" while
  // the glob wrapped the slug in wildcards on both sides — so any older
  // feature directory containing it satisfied plan, apply and close.
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

  assert.match(c.out, /refused — specs\/\*-points-expire\/spec\.md is missing/);
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
