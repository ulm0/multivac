// MV-110. The lifecycle commits what it wrote, refuses a slug it would
// overwrite, proves a step with that step's own artifact, and reports a failed
// tracker call as a failure.
//
// `commitBookkeeping`'s own docstring states the contract — "nothing is left
// floating" — and five of its writers did not keep it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { makeScratchEcosystem } from '../helpers/fixture.js';
import { SPECKIT_INTEGRATION_JSON } from '../helpers/recorded.js';
import { change } from '../../src/commands/change.js';
import { roadmap } from '../../src/commands/roadmap.js';
import { verify } from '../../src/commands/verify.js';
import { loadConfig } from '../../src/lib/config.js';
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
  writeFileSync(join(b, '.specify/integration.json'), SPECKIT_INTEGRATION_JSON);
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
  writeFileSync(join(b, '.specify/integration.json'), SPECKIT_INTEGRATION_JSON);
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
  // reaches the orphan check — so the anchor points at a real file. And it
  // must cite a stated row this change adds (MV-150), or close names that
  // first: the reserved ID, its rule written.
  writeFileSync(join(b, 'kept.txt'), 'the pattern lives here\n');
  await capture(() => change.run(['new', 'orphan-me', 'Orphan me'], { cwd: b }));
  const file = join(b, '.multivac/changes/orphan-me.md');
  const id = /adds:\n\s+- (\S+)/.exec(readFileSync(file, 'utf8'))![1];
  const law = join(b, '.multivac/invariants.md');
  writeFileSync(law, readFileSync(law, 'utf8').replace(/RESERVED by change orphan-me — [^|]*/, 'kept.txt keeps the pattern. '));
  writeFileSync(
    file,
    readFileSync(file, 'utf8')
      .replace('repos: {}', 'repos:\n  brain:\n    status: landed')
      .replace('claims: []', `claims:\n  - ${id}`)
      + `\n<!-- @anchor ${id} brain:kept.txt /the pattern/ -->\n`,
  );
  git(b, 'add', '-A');
  git(b, 'commit', '-q', '-m', 'a claim anchored only in its own change file');

  const c = await capture(() => change.run(['close', 'orphan-me'], { cwd: b }));

  assert.equal(c.code, 1, c.out);
  assert.match(c.out, /anchored ONLY in/);
  assert.match(c.out, new RegExp(`close refused — ${id} is anchored ONLY in`));
  assert.equal(existsSync(join(b, '.multivac/changes/archive/orphan-me.md')), false, 'it archived anyway');
});

/**
 * MV-150: a landed brain==code change `slug` whose reserved row is anchored at
 * kept.txt from the law, claimed as `claim` (`<ID>` stands for the reserved
 * ID), everything committed. Returns the brain, the ID and the paths.
 */
async function claimReserved(slug: string, claim = '  - <ID>\n'): Promise<{ b: string; id: string; file: string; law: string }> {
  const b = brain();
  writeFileSync(join(b, 'kept.txt'), 'the promise lives here\n');
  await capture(() => change.run(['new', slug, 'Cite it'], { cwd: b }));
  const file = join(b, '.multivac/changes', `${slug}.md`);
  const id = /adds:\n\s+- (\S+)/.exec(readFileSync(file, 'utf8'))![1];
  const law = join(b, '.multivac/invariants.md');
  writeFileSync(law, `${readFileSync(law, 'utf8')}<!-- @anchor ${id} brain:kept.txt /the promise/ -->\n`);
  writeFileSync(
    file,
    readFileSync(file, 'utf8')
      .replace('repos: {}', 'repos:\n  brain:\n    status: landed')
      .replace('claims: []', `claims:\n${claim.replaceAll('<ID>', id)}`),
  );
  git(b, 'add', '-A');
  git(b, 'commit', '-q', '-m', `${slug}: landed, claiming its reserved row`);
  return { b, id, file, law };
}

/** State the reserved row of `slug` in the law, as the author would before close. */
const stateRow = (law: string, slug: string): void =>
  writeFileSync(law, readFileSync(law, 'utf8').replace(new RegExp(`RESERVED by change ${slug} — [^|]*`), 'kept.txt keeps the promise. '));

test('close refuses a claim whose row was never stated — MV-150', async () => {
  // The claim is an ID, so the row is the only place its rule is written. A
  // row still reading RESERVED archived green before: an anchor held, and the
  // rule the change made true was written nowhere.
  const { b, id, law } = await claimReserved('say-it');
  const before = git(b, 'status', '--porcelain');

  const refused = await capture(() => change.run(['close', 'say-it'], { cwd: b }));

  assert.equal(refused.code, 1, refused.out);
  assert.ok(
    refused.out.split('\n').includes(
      `${id}: its row states no rule yet — the row is the only place the rule is stated; state it in .multivac/invariants.md`,
    ),
    refused.out,
  );
  assert.match(refused.out, /^claims do not cite the law this change makes — close refused; fix the lines above, then re-run close$/m);
  assert.equal(existsSync(join(b, '.multivac/changes/archive/say-it.md')), false, 'it archived anyway');
  assert.equal(git(b, 'status', '--porcelain'), before, 'a refused close wrote something');

  stateRow(law, 'say-it');
  const closed = await capture(() => change.run(['close', 'say-it'], { cwd: b }));

  assert.equal(closed.code, 0, closed.out);
  assert.deepEqual(closed.out.split('\n').filter((l) => l.startsWith(`${id}:`)), [`${id}: ok`]);
  assert.match(readFileSync(join(b, '.multivac/changes/archive/say-it.md'), 'utf8'), new RegExp(`\\nclaims:\\n  - ${id}\\n`));
});

test('a legacy statement is told to move into its row, not restated again — MV-150', async () => {
  const { b, id } = await claimReserved('kept-prose', '  - id: <ID>\n    statement: "the promise is kept"\n');

  const c = await capture(() => change.run(['close', 'kept-prose'], { cwd: b }));

  assert.equal(c.code, 1, c.out);
  assert.ok(
    c.out.split('\n').includes(
      `${id}: its row states no rule yet — the row is the only place the rule is stated; move this claim's legacy statement: into the row`,
    ),
    c.out,
  );
  assert.doesNotMatch(c.out, /state it in \.multivac\/invariants\.md/);
});

test('every citation defect is named in one run, beside the red claims — MV-150', async () => {
  // Fix one, re-run, meet the next: that loop is what one run of every refusal
  // saves. The red claim, a claim of no row and an undeclared claim, together.
  const b = brain();
  writeFileSync(join(b, 'kept.txt'), 'the promise lives here\n');
  const law = join(b, '.multivac/invariants.md');
  writeFileSync(
    law,
    `${readFileSync(law, 'utf8')}| INV-01 | kept.txt holds the promise. | specified | active | 2026-01-01 | x |\n` +
      '<!-- @anchor INV-01 brain:kept.txt /the promise/ -->\n',
  );
  git(b, 'add', '-A');
  git(b, 'commit', '-q', '-m', 'INV-01 in force');
  await capture(() => change.run(['new', 'all-at-once', 'All at once'], { cwd: b }));
  const file = join(b, '.multivac/changes/all-at-once.md');
  const id = /adds:\n\s+- (\S+)/.exec(readFileSync(file, 'utf8'))![1];
  stateRow(law, 'all-at-once');
  writeFileSync(law, `${readFileSync(law, 'utf8')}<!-- @anchor ${id} brain:kept.txt /a promise broken/ -->\n`);
  const declare = (claims: string[]): void =>
    writeFileSync(
      file,
      readFileSync(file, 'utf8')
        .replace('repos: {}', 'repos:\n  brain:\n    status: landed')
        .replace(/claims:[\s\S]*?\n---\n/, `claims:\n${claims.map((c) => `  - ${c}\n`).join('')}---\n`),
    );
  declare([id, 'NOPE-99', 'INV-01']);
  git(b, 'add', '-A');
  git(b, 'commit', '-q', '-m', 'three claims, three defects');

  const c = await capture(() => change.run(['close', 'all-at-once'], { cwd: b }));

  assert.equal(c.code, 1, c.out);
  const lines = c.out.split('\n');
  assert.ok(lines.some((l) => l.startsWith(`${id}: broken`)), c.out);
  assert.ok(lines.includes('INV-01: ok'), c.out);
  assert.ok(lines.includes('claims are not green — close refused; fix the red claims, then re-run close'), c.out);
  assert.ok(
    lines.includes('NOPE-99: no row in .multivac/invariants.md — a claim cites a row of the law; add the row, or drop the claim'),
    c.out,
  );
  assert.ok(
    lines.includes(
      'INV-01: claimed, but this change neither adds, touches nor retires it — drop the claim, or list it under ' +
        'invariants.touches if this change amends that row',
    ),
    c.out,
  );
  assert.equal(lines.filter((l) => /close refused/.test(l)).length, 2, c.out);
  assert.equal(lines.at(-1), 'claims do not cite the law this change makes — close refused; fix the lines above, then re-run close');
  // A claim of no row is named once, by its citation line — never evaluated against anchors.
  assert.equal(lines.filter((l) => l.startsWith('NOPE-99:')).length, 1, c.out);
  assert.equal(existsSync(join(b, '.multivac/changes/archive/all-at-once.md')), false, 'it archived anyway');

  // Its only claim citing no row: nothing to evaluate, and it is not "no claims declared".
  declare(['NOPE-99']);
  const alone = await capture(() => change.run(['close', 'all-at-once'], { cwd: b }));
  assert.equal(alone.code, 1, alone.out);
  assert.doesNotMatch(alone.out, /no claims declared/);
  assert.deepEqual(alone.out.split('\n').filter((l) => l.startsWith('NOPE-99:')).map((l) => l.slice(0, 18)), ['NOPE-99: no row in']);
});

test('--abandon refuses a change whose own row states a rule nobody verified — MV-150', async () => {
  // Abandon verifies nothing: a rule it left stated would enter the law as a
  // proposal nobody checked, and a proposed row never gates. A row still
  // reading RESERVED is what abandon exists to give back.
  const b = brain();
  await capture(() => change.run(['new', 'drop-it', 'Drop it'], { cwd: b }));
  const file = join(b, '.multivac/changes/drop-it.md');
  const id = /adds:\n\s+- (\S+)/.exec(readFileSync(file, 'utf8'))![1];
  const law = join(b, '.multivac/invariants.md');
  const reserved = readFileSync(law, 'utf8');
  stateRow(law, 'drop-it');
  git(b, 'commit', '-q', '-am', 'a rule stated, then the change dropped');

  const refused = await capture(() => change.run(['close', 'drop-it', '--abandon'], { cwd: b }));

  assert.equal(refused.code, 1, refused.out);
  assert.ok(
    refused.out.split('\n').includes(
      `${id}: states a rule this abandoned change never verified — delete the row from .multivac/invariants.md ` +
        '(a proposed row may be removed), or close the change properly',
    ),
    refused.out,
  );
  assert.equal(existsSync(join(b, '.multivac/changes/archive/drop-it.md')), false, 'it archived anyway');
  assert.equal(git(b, 'status', '--porcelain'), '');

  writeFileSync(law, reserved);
  const abandoned = await capture(() => change.run(['close', 'drop-it', '--abandon'], { cwd: b }));
  assert.equal(abandoned.code, 0, abandoned.out);
  assert.ok(existsSync(join(b, '.multivac/changes/archive/drop-it.md')));
});

test("a retiring change's claim verifies its tombstone at close — MV-150", async () => {
  // Claiming the row a change retires is how its tombstone's absent legs get
  // checked at close: refused while the row is still in force, then verified.
  const b = brain();
  writeFileSync(join(b, 'kept.txt'), 'the promise lives here\n');
  const law = join(b, '.multivac/invariants.md');
  writeFileSync(
    law,
    `${readFileSync(law, 'utf8')}| INV-01 | kept.txt holds the promise. | specified | active | 2026-01-01 | x |\n` +
      '<!-- @anchor INV-01 brain:kept.txt /the promise/ -->\n',
  );
  git(b, 'add', '-A');
  git(b, 'commit', '-q', '-m', 'INV-01 in force');
  await capture(() => change.run(['new', 'retire-it', 'Retire it'], { cwd: b }));
  const file = join(b, '.multivac/changes/retire-it.md');
  writeFileSync(
    file,
    readFileSync(file, 'utf8')
      .replace('repos: {}', 'repos:\n  brain:\n    status: landed')
      .replace('retires: []', 'retires:\n    - INV-01')
      .replace('claims: []', 'claims:\n  - INV-01'),
  );
  git(b, 'add', '-A');
  git(b, 'commit', '-q', '-m', 'retire INV-01, claiming it');

  const inForce = await capture(() => change.run(['close', 'retire-it'], { cwd: b }));
  assert.equal(inForce.code, 1, inForce.out);
  assert.match(
    inForce.out,
    /^INV-01: listed under invariants\.retires, but its row still reads active — retire the row before close: state retired, its tombstone and absent legs, which this claim then verifies$/m,
  );

  const retire = (leg: string): void =>
    writeFileSync(
      law,
      readFileSync(law, 'utf8')
        .replace(/\| INV-01 \| .*\n/, '| INV-01 | kept.txt holds the promise. Retired: no promise is kept. | specified | retired | 2026-01-01 | x |\n')
        .replace(/<!-- @anchor INV-01 .*-->\n/, `<!-- @anchor INV-01 brain:kept.txt ${leg} absent -->\n`),
    );
  retire('/the promise/');
  const broken = await capture(() => change.run(['close', 'retire-it'], { cwd: b }));
  assert.equal(broken.code, 1, broken.out);
  assert.match(broken.out, /^claims are not green — close refused/m);
  assert.doesNotMatch(broken.out, /invariants\.retires/);

  retire('/a promise kept/');
  const closed = await capture(() => change.run(['close', 'retire-it'], { cwd: b }));
  assert.equal(closed.code, 0, closed.out);
  assert.match(closed.out, /^INV-01: ok$/m);
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

test('a stray claim key is named by every reader and refused only by the writers — MV-150', async () => {
  // A reader that drops a file it cannot parse drops the change from every
  // gate that protects it: its claims stop pending, and its branch's code stops
  // being its code. So the readers name the key and
  // read on; only the commands that write the file back — and would drop the
  // key, and the prose in it — refuse it.
  const b = brain();
  writeFileSync(join(b, '.multivac/config.yml'), 'doors: [agents]\nsdd: speckit\nrepos:\n  brain: .\n');
  writeFileSync(join(b, '.multivac/.gitignore'), 'cache/\nworktrees/\n');
  mkdirSync(join(b, '.specify'), { recursive: true });
  writeFileSync(join(b, '.specify/integration.json'), SPECKIT_INTEGRATION_JSON);
  // INV-01's leg is red: while the change holds it pending that gates nothing,
  // and a change read as absent would let it block.
  writeFileSync(join(b, 'kept.txt'), 'the pattern lives here\n');
  writeFileSync(
    join(b, '.multivac/invariants.md'),
    '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n' +
      '| INV-01 | kept.txt holds the promise. | specified | active | 2026-01-01 | x |\n' +
      '<!-- @anchor INV-01 brain:kept.txt /the promise/ -->\n',
  );
  mkdirSync(join(b, '.multivac/changes'), { recursive: true });
  const file = join(b, '.multivac/changes/stray.md');
  const withClaim = (extra: string): string =>
    '---\nslug: stray\nstatus: open\nrepos:\n  brain:\n    status: branched\nlanding_order:\n  - - brain\n' +
    `invariants:\n  touches: [INV-01]\n  adds: []\n  retires: []\nclaims:\n  - id: INV-01\n${extra}---\n\n# Stray\n`;
  writeFileSync(file, withClaim(''));
  git(b, 'add', '-A');
  git(b, 'commit', '-q', '-m', 'an open change');
  git(b, 'branch', 'stray');
  // --strict: a red leg outside a pending claim would block, so the exit code has teeth.
  const clean = await capture(() => verify.run(['--strict'], { cwd: b }));
  assert.match(clean.out, /INV-01/);

  writeFileSync(file, withClaim('    note: why this matters\n'));
  git(b, 'commit', '-q', '-am', 'a note inside the claim');
  const bytes = readFileSync(file, 'utf8');
  const notice = /stray\.md: claim INV-01: unknown key "note" — a claim is its row's ID; state the rule in the row \(read without it here; every command that rewrites the file refuses it until it goes\)/;

  // The readers: verify, the roadmap listing, the code gate.
  const read = await capture(() => verify.run(['--strict'], { cwd: b }));
  assert.equal(read.code, clean.code, read.out);
  assert.equal(read.code, 0, read.out);
  assert.match(read.out, notice);
  assert.doesNotMatch(read.out, /INV-01 .*· blocking/);
  const listed = await capture(() => roadmap.run([], { cwd: b }));
  assert.match(listed.out, /in flight: 1 open change — stray/);
  git(b, 'switch', '-q', 'stray');
  git(b, 'merge', '-q', '--ff-only', 'main');
  writeFileSync(join(b, 'code.ts'), 'export const promise = 1;\n');
  git(b, 'add', 'code.ts');
  const gated = await capture(() => verify.run([], { cwd: b }));
  assert.equal(gated.code, 0, gated.out);
  assert.match(gated.out, /lands in open change stray/);
  git(b, 'reset', '-q', '--hard');
  git(b, 'switch', '-q', 'main');

  // The writers: every change command that rewrites the file, --abandon too.
  const refusal = '.multivac/changes/stray.md: claim INV-01: unknown key "note" — a claim is its row\'s ID; state the rule in the row — fix the frontmatter';
  for (const args of [['plan'], ['apply'], ['land'], ['land', '--landed', 'brain'], ['close'], ['close', '--abandon']]) {
    const c = await capture(() => change.run([args[0], 'stray', ...args.slice(1), '--no-sdd'], { cwd: b }));
    assert.equal(c.code, 1, `${args.join(' ')}: ${c.out}`);
    assert.ok(c.out.split('\n').includes(refusal), `${args.join(' ')}: ${c.out}`);
    assert.equal(git(b, 'status', '--porcelain'), '', args.join(' '));
    assert.equal(readFileSync(file, 'utf8'), bytes, args.join(' '));
  }
  // ...and `change new` promoting a planned change, before it reserves anything.
  writeFileSync(
    join(b, '.multivac/changes/later.md'),
    '---\nslug: later\nstatus: planned\nhorizon: next\nrepos: {}\nlanding_order: []\ninvariants:\n  touches: []\n  adds: []\n  retires: []\n' +
      'claims:\n  - id: INV-01\n    because: prose\n---\n\n# Later\n',
  );
  git(b, 'add', '-A');
  git(b, 'commit', '-q', '-m', 'a planned change');
  const law = readFileSync(join(b, '.multivac/invariants.md'), 'utf8');
  const promoted = await capture(() => change.run(['new', 'later', '--no-sdd'], { cwd: b }));
  assert.equal(promoted.code, 1, promoted.out);
  assert.match(promoted.out, /later\.md: claim INV-01: unknown key "because" — .* — fix the frontmatter/);
  assert.equal(git(b, 'status', '--porcelain'), '');
  assert.equal(readFileSync(join(b, '.multivac/invariants.md'), 'utf8'), law, 'nothing reserved');

  // `roadmap sync` writes an issue number back: it skips the file, as any file it cannot parse.
  writeFileSync(join(b, '.multivac/config.yml'), 'doors: [agents]\nsdd: speckit\ntracker: gitlab\nrepos:\n  brain: .\n');
  const bin = mkdtempSync(join(tmpdir(), 'mvac-ledger-bin-'));
  writeFileSync(join(bin, 'glab'), '#!/bin/sh\necho "https://gitlab.example/acme/brain/-/issues/41"\n');
  chmodSync(join(bin, 'glab'), 0o755);
  const saved = process.env.PATH;
  process.env.PATH = [bin, dirname(process.execPath), '/usr/bin', '/bin'].join(delimiter);
  try {
    const synced = await capture(() => roadmap.run(['sync'], { cwd: b }));
    assert.equal(synced.code, 0, synced.out);
    assert.doesNotMatch(synced.out, /stray → #41/);
  } finally {
    process.env.PATH = saved;
  }
  assert.equal(readFileSync(file, 'utf8'), bytes, 'roadmap sync');
});
