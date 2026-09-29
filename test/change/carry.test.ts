// MV-133. `change apply` carries a change's SDD files onto its branch. On every
// change from 052 to 057 in this repository `specs/<n>-<slug>/` was copied into
// the worktree by hand, and the untracked copy left behind stopped `git merge`.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { initRepo } from '../helpers/fixture.js';
import { SPECKIT_INTEGRATION_JSON } from '../helpers/recorded.js';
import { change } from '../../src/commands/change.js';
import { loadChange, saveChange } from '../../src/change/file.js';
import { carriesMerge, closeOwnedDirs, pointFeature, slugArtifactDirs } from '../../src/change/carry.js';
import { sddSpec } from '../../src/adapters/registry.js';

process.env.PATH = [dirname(process.execPath), '/usr/bin', '/bin'].join(delimiter);
for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();

async function quiet(fn: () => Promise<number>): Promise<{ code: number; out: string }> {
  const lines: string[] = [];
  const orig = { log: console.log, error: console.error };
  console.log = console.error = (...a: unknown[]) => { lines.push(a.map(String).join(' ')); };
  try {
    return { code: await fn(), out: lines.join('\n') };
  } finally {
    console.log = orig.log;
    console.error = orig.error;
  }
}

const write = (root: string, rel: string, body = 'x\n'): void => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), body);
};

/** A brain==code repo with spec-kit installed and a written constitution, and a change `slug` declared on it. */
async function brainWithChange(slug: string): Promise<string> {
  const b = join(mkdtempSync(join(tmpdir(), 'mvac-carry-')), 'brain');
  initRepo(b, {
    '.multivac/config.yml': 'doors: [agents]\nsdd: speckit\nrepos:\n  brain: .\n',
    '.multivac/invariants.md': '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n',
    '.multivac/.gitignore': 'cache/\nworktrees/\n',
    '.specify/integration.json': SPECKIT_INTEGRATION_JSON,
    '.specify/memory/constitution.md': '# Acme Constitution\n\n### I. Law first\n',
    '.specify/.gitignore': 'feature.json\n',
  });
  assert.equal((await quiet(() => change.run(['new', slug, slug], { cwd: b }))).code, 0);
  const parsed = await loadChange(b, slug);
  parsed.change.repos = { brain: { status: 'planned' } };
  parsed.change.landing_order = [['brain']];
  parsed.change.invariants.adds = [];
  await saveChange(b, parsed);
  git(b, 'add', '-A');
  git(b, 'commit', '-qm', 'declare');
  return b;
}

const feature = (slug: string): string => `specs/001-${slug}`;

async function planned(b: string, slug: string): Promise<void> {
  write(b, `${feature(slug)}/spec.md`, '# spec\n');
  write(b, `${feature(slug)}/plan.md`, '# plan\n');
  write(b, `${feature(slug)}/tasks.md`, '- [x] T001 done\n');
  const p = await quiet(() => change.run(['plan', slug], { cwd: b }));
  assert.equal(p.code, 0, p.out);
}

test('apply carries the change\'s artifacts onto its branch, and the merge is clean — MV-133', async () => {
  const slug = 'carry-a';
  const b = await brainWithChange(slug);
  await planned(b, slug);
  write(b, '.specify/templates/new-template.md', '# vendor file\n');
  const a = await quiet(() => change.run(['apply', slug], { cwd: b }));
  assert.equal(a.code, 0, a.out);
  assert.match(a.out, /brain: carried 4 speckit files onto carry-a and committed them there$/m);

  const wt = join(b, '.multivac/worktrees', slug, 'brain');
  assert.match(git(wt, 'log', '-1', '--format=%s'), /change apply: carry-a — carry the speckit files onto the branch/);
  assert.equal(git(wt, 'ls-files', feature(slug)).split('\n').length, 3);
  assert.ok(git(wt, 'ls-files', '.specify/templates/new-template.md'));
  assert.equal(existsSync(join(b, feature(slug))), false, 'gone from the checkout');
  assert.equal(JSON.parse(readFileSync(join(wt, '.specify/feature.json'), 'utf8')).feature_directory, feature(slug));

  // Re-apply still passes: the gate finds the proofs on the change's worktree.
  assert.equal((await quiet(() => change.run(['apply', slug], { cwd: b }))).code, 0);
  // The merge no longer stops on an untracked copy.
  git(b, 'merge', '--no-ff', '-q', slug, '-m', 'merge');
  assert.ok(existsSync(join(b, feature(slug), 'tasks.md')));
});

test('nothing uncommitted: apply carries nothing and makes no carry commit — MV-133', async () => {
  const slug = 'carry-b';
  const b = await brainWithChange(slug);
  await planned(b, slug);
  git(b, 'add', '-A');
  git(b, 'commit', '-qm', 'artifacts committed by hand');
  const a = await quiet(() => change.run(['apply', slug], { cwd: b }));
  assert.equal(a.code, 0, a.out);
  assert.doesNotMatch(a.out, /carried/);
  const wt = join(b, '.multivac/worktrees', slug, 'brain');
  assert.doesNotMatch(git(wt, 'log', '-1', '--format=%s'), /carry the/);
});

test('a tracked, modified artifact is refused before anything moves — MV-133', async () => {
  const slug = 'carry-c';
  const b = await brainWithChange(slug);
  await planned(b, slug);
  git(b, 'add', '-A');
  git(b, 'commit', '-qm', 'artifacts');
  write(b, `${feature(slug)}/tasks.md`, '- [x] T001 done\n- [x] T002 edited\n');
  const before = git(b, 'rev-parse', 'HEAD');
  const a = await quiet(() => change.run(['apply', slug], { cwd: b }));
  assert.equal(a.code, 1, a.out);
  assert.match(a.out, /cannot be carried onto the change branch \(MV-133\) — nothing was branched or bumped/);
  assert.match(a.out, /brain: specs\/001-carry-c\/tasks\.md is tracked and modified here/);
  assert.equal(git(b, 'rev-parse', 'HEAD'), before, 'no bookkeeping commit');
  assert.equal(existsSync(join(b, '.multivac/worktrees', slug)), false, 'no worktree');
});

test('an ignored shared file is refused, naming how to find the rule — MV-133', async () => {
  const slug = 'carry-d';
  const b = await brainWithChange(slug);
  await planned(b, slug);
  write(b, '.gitignore', '.specify/extras/\n');
  git(b, 'add', '.gitignore');
  git(b, 'commit', '-qm', 'ignore');
  write(b, '.specify/extras/hidden.md', '# never committable\n');
  const a = await quiet(() => change.run(['apply', slug], { cwd: b }));
  assert.equal(a.code, 1, a.out);
  assert.match(a.out, /\.specify\/extras\/hidden\.md is ignored, so it cannot be committed — `git -C .* check-ignore -v \.specify\/extras\/hidden\.md` names the rule/);
});

// --- MV-146: the feature pointer, and what close owns ---

test('pointFeature names the change\'s directory, returns what it named before, and keeps the file\'s other keys', async () => {
  const speckit = sddSpec('speckit')!;
  const d = mkdtempSync(join(tmpdir(), 'mvac-pointer-'));
  // Not installed: no script there reads the pointer, so nothing is written.
  mkdirSync(join(d, '.specify'), { recursive: true });
  assert.equal(await pointFeature(d, speckit, 'specs/001-alpha'), null);
  assert.equal(existsSync(join(d, '.specify/feature.json')), false);

  write(d, '.specify/integration.json', SPECKIT_INTEGRATION_JSON);
  assert.equal(await pointFeature(d, speckit, 'specs/001-alpha'), null, 'no pointer before');
  const read = (): Record<string, unknown> => JSON.parse(readFileSync(join(d, '.specify/feature.json'), 'utf8'));
  assert.deepEqual(read(), { feature_directory: 'specs/001-alpha' });

  write(d, '.specify/feature.json', JSON.stringify({ feature_directory: 'specs/002-beta', note: 'kept' }));
  assert.equal(await pointFeature(d, speckit, 'specs/001-alpha'), 'specs/002-beta');
  assert.deepEqual(read(), { feature_directory: 'specs/001-alpha', note: 'kept' });
  // Already there: said as what it was, and the file is not rewritten.
  const before = readFileSync(join(d, '.specify/feature.json'), 'utf8');
  assert.equal(await pointFeature(d, speckit, 'specs/001-alpha'), 'specs/001-alpha');
  assert.equal(readFileSync(join(d, '.specify/feature.json'), 'utf8'), before);

  // A tool that keeps no pointer: nothing to point.
  const opsx = sddSpec('opsx')!;
  assert.equal(opsx.pointer, undefined);
  assert.equal(await pointFeature(d, opsx, 'openspec/changes/alpha'), null);
});

test('closeOwnedDirs adds a moved-from directory git reports deleted, and each main spec an archive merged into', async () => {
  const opsx = sddSpec('opsx')!;
  const b = join(mkdtempSync(join(tmpdir(), 'mvac-owned-')), 'brain');
  initRepo(b, {
    'openspec/changes/bill-weekly/proposal.md': '# proposal\n',
    'openspec/changes/bill-weekly/tasks.md': '- [x] 1.1 done\n',
    'openspec/changes/other/proposal.md': '# another change\n',
    'openspec/specs/billing/spec.md': '# billing\n',
    'openspec/specs/billing/design.md': '# billing design\n',
  });
  // Before the archive: the change's own directory, and nothing else.
  assert.deepEqual((await closeOwnedDirs(b, opsx, 'bill-weekly')).dirs, ['openspec/changes/bill-weekly']);

  // What `openspec archive bill-weekly --yes` does (1.13.2): move the directory
  // under a dated archive and merge each capability delta into the main specs.
  const arch = 'openspec/changes/archive/2026-09-28-bill-weekly';
  write(b, `${arch}/proposal.md`, '# proposal\n');
  write(b, `${arch}/tasks.md`, '- [x] 1.1 done\n');
  write(b, `${arch}/specs/billing/spec.md`, '# delta\n');
  write(b, `${arch}/specs/refunds/spec.md`, '# delta\n');
  rmSync(join(b, 'openspec/changes/bill-weekly'), { recursive: true });
  write(b, 'openspec/specs/billing/spec.md', '# billing, merged\n');
  write(b, 'openspec/specs/refunds/spec.md', '# refunds, new\n');
  // A human's edit beside the merged spec, in the same capability: not the archive's.
  write(b, 'openspec/specs/billing/design.md', '# billing design, v2 by a human\n');

  const { dirs: owned, uncarried } = await closeOwnedDirs(b, opsx, 'bill-weekly');
  // Each merged main spec is the FILE the delta names, never its capability's
  // directory, which would sweep the human's edit into the archive commit.
  assert.deepEqual(owned.sort(), [
    arch,
    'openspec/changes/bill-weekly',
    'openspec/specs/billing/spec.md',
    'openspec/specs/refunds/spec.md',
  ]);
  assert.ok(!owned.some((p) => p.includes('other')), 'another change is never this close\'s');
  assert.ok(!owned.some((p) => p === 'openspec/specs/billing' || p.endsWith('design.md')), owned.join(', '));
  // Deltas with no requirement block carry trivially: staged as MV-146 staged them.
  assert.deepEqual(uncarried, []);
  // The one derivation MV-144 pins is unchanged: only what is on disk.
  assert.deepEqual(await slugArtifactDirs(b, opsx, 'bill-weekly'), [arch]);
});

/**
 * MV-146. The slug's segment is found in the TEMPLATE. Found in the
 * substituted path, a slug inside a parent segment's name took the parent:
 * slug `spec` took `specs`, slug `change` took `openspec/changes`, and every
 * other change's directory came with it — the pointer named `specs`, close
 * cited it and staged another change's work in progress.
 */
test('a slug inside a parent directory\'s name owns its own directory, never the parent', async () => {
  const speckit = sddSpec('speckit')!;
  const opsx = sddSpec('opsx')!;
  const b = join(mkdtempSync(join(tmpdir(), 'mvac-owned-substr-')), 'brain');
  initRepo(b, { 'README.md': '# brain\n' });
  write(b, 'specs/001-other/spec.md', '# another change, work in progress\n');
  write(b, 'specs/002-spec/spec.md', '# the change called spec\n');
  assert.deepEqual(await slugArtifactDirs(b, speckit, 'spec'), ['specs/002-spec']);
  assert.deepEqual((await closeOwnedDirs(b, speckit, 'spec')).dirs, ['specs/002-spec']);

  write(b, 'openspec/changes/other/proposal.md', '# another change\n');
  write(b, 'openspec/changes/change/proposal.md', '# the change called change\n');
  assert.deepEqual(await slugArtifactDirs(b, opsx, 'change'), ['openspec/changes/change']);
  assert.deepEqual((await closeOwnedDirs(b, opsx, 'change')).dirs, ['openspec/changes/change']);
  // `open` is inside `openspec`: the same rule.
  write(b, 'openspec/changes/open/proposal.md', '# the change called open\n');
  assert.deepEqual((await closeOwnedDirs(b, opsx, 'open')).dirs, ['openspec/changes/open']);
});

/**
 * MV-147. A main spec is staged by close only when it carries the merge. The
 * archive records every delta file whether or not it merged: `--skip-specs`
 * moves the change and leaves the main specs as they were, a human's
 * uncommitted edit included, and staging them all swept that edit into the
 * archive commit. Measured on openspec 1.13.2: `--json --yes` writes each
 * requirement block verbatim, CRLF turned to LF and a run of blank lines
 * collapsed to one.
 */
test('carriesMerge holds every ADDED and MODIFIED block, line endings and trailing whitespace aside', async () => {
  const b = join(mkdtempSync(join(tmpdir(), 'mvac-carries-')), 'brain');
  const block = [
    '### Requirement: Yearly invoice',
    'The system SHALL invoice yearly.',
    '',
    '#### Scenario: Invoice',
    '- **WHEN** a year ends',
    '- **THEN** one invoice is sent',
  ].join('\n');
  const added = [
    '### Requirement: Refund window',
    'The system SHALL refund within 30 days.',
    '',
    '#### Scenario: Refund',
    '- **WHEN** asked',
    '- **THEN** refunded',
  ].join('\n');
  const delta = `## MODIFIED Requirements\n\n${block}\n\n## ADDED Requirements\n\n${added}\n\n## REMOVED Requirements\n\n### Requirement: Old\n**Reason**: gone\n`;
  const merged = `# billing Specification\n\n## Purpose\nBilling.\n\n## Requirements\n\n${block}\n\n${added}\n`;
  initRepo(b, { 'openspec/specs/billing/spec.md': '# billing Specification\n\n## Requirements\n' });
  const d = 'openspec/changes/archive/2026-09-28-bill/specs/billing/spec.md';
  const t = 'openspec/specs/billing/spec.md';

  // No ADDED or MODIFIED block: nothing to carry, staged as before.
  write(b, d, '## REMOVED Requirements\n\n### Requirement: Old\n**Reason**: gone\n');
  assert.equal(await carriesMerge(b, d, t), true);
  write(b, d, '## MODIFIED Requirements\n');
  assert.equal(await carriesMerge(b, d, t), true);

  // Every block verbatim: carried.
  write(b, d, delta);
  write(b, t, merged);
  assert.equal(await carriesMerge(b, d, t), true);

  // A CRLF delta with trailing spaces, merged and written LF: carried.
  write(b, d, delta.split('\n').map((l) => (l.startsWith('- ') ? `${l}  ` : l)).join('\r\n'));
  assert.equal(await carriesMerge(b, d, t), true);
  // A run of blank lines inside a block, which the archive collapses: carried.
  write(b, d, delta.replace('invoice yearly.\n\n', 'invoice yearly.\n\n\n\n'));
  assert.equal(await carriesMerge(b, d, t), true);
  // A section title in another case is one openspec merges from too.
  write(b, d, `## Added Requirements\n\n${added}\n`);
  assert.equal(await carriesMerge(b, d, t), true);

  // A block missing — the archive merged nothing, or a human edited over it.
  write(b, d, delta);
  write(b, t, `# billing Specification\n\n## Requirements\n\n${block}\n`);
  assert.equal(await carriesMerge(b, d, t), false);
  write(b, d, `## Added Requirements\n\n${added}\n`);
  assert.equal(await carriesMerge(b, d, t), false);
  // …and a CRLF delta, or one a Windows editor gave a BOM, is read for its
  // blocks, never as a delta with none.
  write(b, d, delta.split('\n').join('\r\n'));
  assert.equal(await carriesMerge(b, d, t), false);
  write(b, d, `\uFEFF## ADDED Requirements\n\n${added}\n`);
  assert.equal(await carriesMerge(b, d, t), false);

  // An untracked target without the block — a human's draft of a new capability.
  write(b, d, delta);
  write(b, 'openspec/specs/refunds/spec.md', '# refunds, a draft\n');
  assert.match(git(b, 'status', '--porcelain', '-uall'), /^\?\? openspec\/specs\/refunds\/spec\.md$/m);
  assert.equal(await carriesMerge(b, d, 'openspec/specs/refunds/spec.md'), false);

  // An unreadable target carries nothing: named, never staged on a guess.
  assert.equal(await carriesMerge(b, d, 'openspec/specs/nowhere/spec.md'), false);
});

test('closeOwnedDirs leaves out a main spec the archive did not merge into', async () => {
  const opsx = sddSpec('opsx')!;
  const b = join(mkdtempSync(join(tmpdir(), 'mvac-uncarried-')), 'brain');
  initRepo(b, { 'openspec/specs/billing/spec.md': '# billing\n\nA human edits this.\n' });
  const arch = 'openspec/changes/archive/2026-09-28-bill-weekly';
  write(b, `${arch}/tasks.md`, '- [x] 1.1 done\n');
  write(b, `${arch}/specs/billing/spec.md`, '## MODIFIED Requirements\n\n### Requirement: Weekly\nThe system SHALL bill weekly.\n');
  write(b, `${arch}/specs/refunds/spec.md`, '## ADDED Requirements\n\n### Requirement: Refund\nThe system SHALL refund.\n');
  // `--skip-specs`: nothing merged; a human's edit and a human's draft beside it.
  write(b, 'openspec/specs/billing/spec.md', '# billing\n\nA human edits this, uncommitted.\n');
  write(b, 'openspec/specs/refunds/spec.md', '# refunds, a draft\n');
  const { dirs, uncarried } = await closeOwnedDirs(b, opsx, 'bill-weekly');
  assert.deepEqual(dirs, [arch]);
  assert.deepEqual(uncarried.sort(), ['openspec/specs/billing/spec.md', 'openspec/specs/refunds/spec.md']);
});

/**
 * MV-147, found at review against openspec 1.13.2, whose validator passed each
 * delta below. A block is compared whole, never as a substring, and the two
 * texts are read as openspec reads them: a block runs to the next unfenced
 * `### Requirement:` or `## ` line, keeping any other `### ` line, and a header
 * inside a fenced example is neither a section nor a requirement. Each case
 * below is a `--skip-specs` archive, or a real merge, that a looser reading
 * called the other.
 */
test('carriesMerge compares whole blocks, read as openspec reads them, fences included', async () => {
  const b = join(mkdtempSync(join(tmpdir(), 'mvac-carries-blocks-')), 'brain');
  initRepo(b, { 'README.md': '# brain\n' });
  const d = 'openspec/changes/archive/2026-09-29-x/specs/billing/spec.md';
  const t = 'openspec/specs/billing/spec.md';
  const spec = (...blocks: string[]): string =>
    `# billing Specification\n\n## Purpose\nBilling.\n\n## Requirements\n\n${blocks.join('\n\n')}\n`;
  const modified = (block: string): string => `## MODIFIED Requirements\n\n${block}\n`;

  // 1. A MODIFIED block that only drops the end of a line is a substring of
  //    the requirement it replaces: the unmerged spec does not carry it.
  const byPost = '### Requirement: Bill\nThe system SHALL bill.\n\n#### Scenario: Bill\n- **WHEN** a month ends\n- **THEN** one bill is sent by post';
  const sent = byPost.replace(' by post', '');
  write(b, t, spec(byPost));
  write(b, d, modified(sent));
  assert.equal(await carriesMerge(b, d, t), false, 'a truncating MODIFIED is not carried by the spec it would replace');
  write(b, t, spec(sent));
  assert.equal(await carriesMerge(b, d, t), true);

  // 2. A requirement holding a fenced sample with a `## ` line: the block runs
  //    past the fence, so the scenario added after it is looked for too.
  const format = '### Requirement: Invoice format\nThe system SHALL render invoices as:\n\n```markdown\n## Invoice\nTotal: 10\n```';
  const weekly = `${format}\n\n#### Scenario: Weekly invoice\n- **WHEN** a week ends\n- **THEN** an invoice is rendered`;
  write(b, t, spec(format));
  write(b, d, modified(weekly));
  assert.equal(await carriesMerge(b, d, t), false, 'a fenced `## ` line does not end the block');
  write(b, t, spec(weekly));
  assert.equal(await carriesMerge(b, d, t), true);

  // 3. A `### ` line that is no requirement stays inside its block.
  const noted = `${byPost}\n\n### Notes\nPost is slow.`;
  write(b, t, spec(byPost));
  write(b, d, modified(noted));
  assert.equal(await carriesMerge(b, d, t), false, 'a `### Notes` line does not end the block');
  write(b, t, spec(noted));
  assert.equal(await carriesMerge(b, d, t), true);

  // 4. A fenced `## ADDED Requirements` example under REMOVED is no section:
  //    the delta has no block to carry, and its real merge is staged.
  write(
    b,
    d,
    '## REMOVED Requirements\n\n### Requirement: Legacy format\n**Reason**: replaced\n**Migration**: write the new one as\n\n```markdown\n## ADDED Requirements\n### Requirement: <your requirement>\n```\n',
  );
  write(b, t, spec(byPost));
  assert.equal(await carriesMerge(b, d, t), true, 'a fenced example is not a block to carry');

  // 5. A block of the same text under another name is not the one merged.
  write(b, d, modified(byPost));
  write(b, t, spec(byPost.replace('Requirement: Bill', 'Requirement: Bill monthly')));
  assert.equal(await carriesMerge(b, d, t), false);
  // …nor is one outside the `## Requirements` section the archive rebuilds.
  write(b, t, `# billing Specification\n\n## Purpose\nBilling.\n\n## Requirements\n\n## Notes\n\n${byPost}\n`);
  assert.equal(await carriesMerge(b, d, t), false);
});

/**
 * MV-147, found at review. openspec 1.13.2 merges a capability's `spec.md`
 * alone (findSpecUpdates), so a notes file beside a delta maps to no main
 * spec, and a human's untracked file at the mirrored path is never staged.
 * Two archives of one slug can name one target: carried by either, it is
 * staged, and never also named uncarried.
 */
test('closeOwnedDirs maps only the file openspec merges, and a target carried by one of two archives is staged', async () => {
  const opsx = sddSpec('opsx')!;
  const b = join(mkdtempSync(join(tmpdir(), 'mvac-owned-file-')), 'brain');
  initRepo(b, { 'README.md': '# brain\n' });
  const refund = '### Requirement: Refund\nThe system SHALL refund.';
  const arch = 'openspec/changes/archive/2026-09-29-refunds';
  write(b, `${arch}/tasks.md`, '- [x] 1.1 done\n');
  write(b, `${arch}/specs/refunds/spec.md`, `## ADDED Requirements\n\n${refund}\n`);
  write(b, `${arch}/specs/refunds/notes.md`, '# notes kept beside the delta\n');
  write(b, `${arch}/specs/spec.md`, '## ADDED Requirements\n\n### Requirement: At the root\nNever merged.\n');
  write(b, `${arch}/specs/.hidden/spec.md`, '## ADDED Requirements\n\n### Requirement: Hidden\nNever merged.\n');
  write(b, 'openspec/specs/refunds/spec.md', `# refunds Specification\n\n## Purpose\nRefunds.\n\n## Requirements\n\n${refund}\n`);
  // A human's untracked file where the notes would mirror to.
  write(b, 'openspec/specs/refunds/notes.md', '# a human\'s notes, untracked\n');
  const one = await closeOwnedDirs(b, opsx, 'refunds');
  assert.deepEqual(one.dirs.sort(), [arch, 'openspec/specs/refunds/spec.md']);
  assert.deepEqual(one.uncarried, []);

  // A second dated archive of the slug whose delta the spec does not carry.
  const again = 'openspec/changes/archive/2026-09-30-refunds';
  write(b, `${again}/specs/refunds/spec.md`, '## ADDED Requirements\n\n### Requirement: Refund twice\nNever merged.\n');
  const two = await closeOwnedDirs(b, opsx, 'refunds');
  assert.ok(two.dirs.includes('openspec/specs/refunds/spec.md'), two.dirs.join(', '));
  assert.deepEqual(two.uncarried, [], 'carried by one archive, it is staged and not named uncarried');
});
