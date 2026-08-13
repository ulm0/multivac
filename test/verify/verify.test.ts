import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem, type ScratchEcosystem } from '../helpers/fixture.js';
import { verify } from '../../src/commands/verify.js';

function eco(): ScratchEcosystem {
  return makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-verify-')));
}

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', ['-C', cwd, ...args], { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
}

function commitFile(repo: string, rel: string, content: string): void {
  writeFileSync(join(repo, rel), content);
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', `add ${rel}`);
}

const HEADER = [
  '# Invariants',
  '',
  '| ID | statement | authority | state | date | source |',
  '| --- | --- | --- | --- | --- | --- |',
];

function setLaw(brain: string, ...lines: string[]): void {
  writeFileSync(join(brain, 'invariants.md'), [...HEADER, ...lines, ''].join('\n'));
}

function runVerify(brain: string, ...flags: string[]): Promise<number> {
  return verify.run(flags, { cwd: brain });
}

async function captured(fn: () => Promise<number>): Promise<{ code: number; out: string }> {
  const lines: string[] = [];
  const orig = console.log;
  console.log = (...a: unknown[]) => {
    lines.push(a.map(String).join(' '));
  };
  try {
    const code = await fn();
    return { code, out: lines.join('\n') };
  } finally {
    console.log = orig;
  }
}

test('SQL normalization catches a GRANT split across lines (absent tombstone)', async () => {
  const e = eco();
  // No single LINE of 0001.sql contains "grant ... update on accounts";
  // the normalized statement does. Per-line matching would green this.
  setLaw(
    e.brain,
    '| INV-02 | no update grants on accounts | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-02 api:db/migrations/*.sql /grant[^;]*update[[:space:]]+on[[:space:]]+accounts/i absent -->',
  );
  assert.equal(await runVerify(e.brain), 1);
});

test('present leg over the same SQL is ok, exit 0', async () => {
  const e = eco();
  setLaw(
    e.brain,
    '| INV-03 | accounts table exists | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-03 api:db/migrations/*.sql /create[[:space:]]+table[[:space:]]+accounts/i -->',
  );
  const { code, out } = await captured(() => runVerify(e.brain));
  assert.equal(code, 0);
  assert.match(out, /1 claims · 1 anchored \(100%\)/);
  assert.match(out, /0 blocking broken · exit 0/);
});

test('vacuous absent glob blocks: a rename must not green the tombstone', async () => {
  const e = eco();
  setLaw(
    e.brain,
    '| INV-04 | dead path stays dead | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-04 api:db/oldname/** /anything/ absent -->',
  );
  assert.equal(await runVerify(e.brain), 1);
});

test('count=N ratchet: pinned total holds, a new occurrence breaks it', async () => {
  const e = eco();
  setLaw(
    e.brain,
    '| INV-05 | one sanctioned balance column | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-05 api:db/migrations/*.sql /balance/ count=1 -->',
  );
  assert.equal(await runVerify(e.brain), 0);
  commitFile(
    e.repos.api,
    'db/migrations/0002.sql',
    'ALTER TABLE accounts ADD COLUMN balance_cached numeric;\n',
  );
  assert.equal(await runVerify(e.brain), 1);
});

test('moved: one out-of-glob match rewrites the glob in place, exit 0', async () => {
  const e = eco();
  setLaw(
    e.brain,
    '| INV-06 | port is fixed | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-06 api:src/app/*.ts /port = 8080/ -->',
  );
  // --check reports but never writes
  assert.equal(await runVerify(e.brain, '--check'), 0);
  assert.match(readFileSync(join(e.brain, 'invariants.md'), 'utf8'), /api:src\/app\/\*\.ts/);
  // default rewrites in place
  assert.equal(await runVerify(e.brain), 0);
  const law = readFileSync(join(e.brain, 'invariants.md'), 'utf8');
  assert.match(law, /api:src\/server\.ts /);
  // and the healed anchor now verifies ok
  assert.equal(await runVerify(e.brain, '--strict'), 0);
});

test('moved never rewrites the glob to an excluded file', async () => {
  const e = eco();
  // The only match lives in a file the anchor explicitly excludes: that is
  // broken, not moved — rewriting into the exclusion would loop forever.
  setLaw(
    e.brain,
    '| INV-06B | port is fixed | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-06B api:README.md !src/server.ts /port = 8080/ -->',
  );
  const { code, out } = await captured(() => runVerify(e.brain, '--strict'));
  assert.equal(code, 1);
  assert.match(out, /broken/);
  assert.doesNotMatch(out, /moved/);
  assert.match(readFileSync(join(e.brain, 'invariants.md'), 'utf8'), /api:README\.md /);
});

test('exit matrix: broken present reports at exit 0, gates under --strict', async () => {
  const e = eco();
  setLaw(
    e.brain,
    '| INV-07 | phantom rule | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-07 api:** /zz_missing_token_zz/ -->',
  );
  assert.equal(await runVerify(e.brain), 0);
  assert.equal(await runVerify(e.brain, '--strict'), 1);
});

test('planted dead term is caught by an absent leg across * repos', async () => {
  const e = eco();
  commitFile(e.repos.web, 'README.md', '# acme-web\n\nuses the FLUXCAP flow\n');
  setLaw(
    e.brain,
    '| INV-08 | fluxcap flow removed | published | retired | 2026-01-01 | x |',
    '<!-- @anchor INV-08 *:README.md /FLUXCAP/ absent -->',
  );
  assert.equal(await runVerify(e.brain), 1);
});

test('retired rows evaluate only their tombstone legs', async () => {
  const e = eco();
  setLaw(
    e.brain,
    '| INV-09 | old mechanism | published | retired | 2026-01-01 | x |',
    // present leg on a retired row would be broken — must be skipped
    '<!-- @anchor INV-09 api:** /zz_gone_mechanism_zz/ -->',
    '<!-- @anchor INV-09 api:** /zz_gone_mechanism_zz/ absent -->',
  );
  assert.equal(await runVerify(e.brain, '--strict'), 0);
});

test('proposed rows never block, not even under --strict', async () => {
  const e = eco();
  setLaw(
    e.brain,
    '| INV-10 | drafted rule | published | proposed | 2026-01-01 | x |',
    '<!-- @anchor INV-10 api:README.md /acme-api/ absent -->',
  );
  assert.equal(await runVerify(e.brain), 0);
  assert.equal(await runVerify(e.brain, '--strict'), 0);
});

test('declared repo missing on disk is unevaluated, never red', async () => {
  const e = eco();
  writeFileSync(
    join(e.brain, '.multivac/config.yml'),
    'repos:\n  api: ../acme-api\n  web: ../acme-web\n  ghost: ../nope\n',
  );
  setLaw(
    e.brain,
    '| INV-11 | ghost rule | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-11 ghost:** /whatever/ absent -->',
  );
  const { code, out } = await captured(() => runVerify(e.brain, '--strict'));
  assert.equal(code, 0);
  assert.match(out, /unevaluated/);
  assert.match(out, /repos sync/);
});

test('malformed anchor is a parse diagnostic and exits 1', async () => {
  const e = eco();
  setLaw(
    e.brain,
    '| INV-12 | dialect gate | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-12 api:db/** /\\sfoo/ absent -->',
  );
  const { code, out } = await captured(() => runVerify(e.brain));
  assert.equal(code, 1);
  assert.match(out, /invariants\.md:6/);
  assert.match(out, /\[\[:space:\]\]/);
});

test('unknown repo key is a diagnostic naming the config fix', async () => {
  const e = eco();
  setLaw(
    e.brain,
    '| INV-13 | typo key | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-13 backend:** /x/ absent -->',
  );
  const { code, out } = await captured(() => runVerify(e.brain));
  assert.equal(code, 1);
  assert.match(out, /unknown repo key "backend"/);
  assert.match(out, /\.multivac\/config\.yml/);
});

test('pin staleness reports offline: gitlink vs local channel ref + fetch age', async () => {
  const e = eco();
  const branch = git(e.brain, 'symbolic-ref', '--short', 'HEAD');
  const pin = git(e.brain, 'rev-parse', 'HEAD');
  // mount the brain in api as a gitlink at .brain, pinned to today's HEAD
  git(e.repos.api, 'update-index', '--add', '--cacheinfo', `160000,${pin},.brain`);
  git(e.repos.api, 'commit', '-q', '-m', 'mount brain');
  // brain moves ahead by one commit
  commitFile(e.brain, 'notes.md', '# notes\n');
  writeFileSync(
    join(e.brain, '.multivac/config.yml'),
    `channel: ${branch}\nrepos:\n  api: ../acme-api\n  web: ../acme-web\n`,
  );
  setLaw(
    e.brain,
    '| INV-14 | accounts table exists | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-14 api:db/migrations/*.sql /create[[:space:]]+table/i -->',
  );
  const { code, out } = await captured(() => runVerify(e.brain));
  assert.equal(code, 0); // staleness reports, never gates
  assert.match(out, new RegExp(`stale\\s+api: pin 1 behind ${branch}`));
  assert.match(out, /never fetched|last fetch/);
  assert.match(out, /repos sync/);
});
