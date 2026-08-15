import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
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
  writeFileSync(join(brain, '.multivac/invariants.md'), [...HEADER, ...lines, ''].join('\n'));
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
  assert.match(readFileSync(join(e.brain, '.multivac/invariants.md'), 'utf8'), /api:src\/app\/\*\.ts/);
  // default rewrites in place
  assert.equal(await runVerify(e.brain), 0);
  const law = readFileSync(join(e.brain, '.multivac/invariants.md'), 'utf8');
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
  assert.match(readFileSync(join(e.brain, '.multivac/invariants.md'), 'utf8'), /api:README\.md /);
});

test('moved never rewrites the glob into .multivac: the law is not its own evidence', async () => {
  const e = eco();
  // brain==code, and the statement column quotes the pattern the leg looks
  // for. Delete the code and the only remaining match in the repo is the law
  // row itself: healing onto it would make the claim true by quoting itself.
  writeFileSync(join(e.brain, '.multivac/config.yml'), 'doors: [agents]\nrepos:\n  brain: .\n');
  mkdirSync(join(e.brain, 'src'), { recursive: true });
  commitFile(e.brain, 'src/pay.ts', 'export const pay = () => charge();\n');
  setLaw(
    e.brain,
    '| INV-06C | every payment goes through charge() | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-06C brain:src/pay.ts /charge\\(\\)/ -->',
  );
  assert.equal(await runVerify(e.brain, '--strict'), 0);

  commitFile(e.brain, 'src/pay.ts', 'export const pay = () => billCardDirectly();\n');
  const { code, out } = await captured(() => runVerify(e.brain, '--strict'));
  assert.equal(code, 1);
  assert.match(out, /broken/);
  assert.doesNotMatch(out, /moved/);
  assert.match(
    readFileSync(join(e.brain, '.multivac/invariants.md'), 'utf8'),
    /brain:src\/pay\.ts /,
  );
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
  assert.match(out, /submodule update --remote/);
});

/** Same fixture as the report test: brain mounted in api, pin one behind. */
function staleEco(): { e: ScratchEcosystem; branch: string } {
  const e = eco();
  const branch = git(e.brain, 'symbolic-ref', '--short', 'HEAD');
  const pin = git(e.brain, 'rev-parse', 'HEAD');
  git(e.repos.api, 'update-index', '--add', '--cacheinfo', `160000,${pin},.brain`);
  git(e.repos.api, 'commit', '-q', '-m', 'mount brain');
  commitFile(e.brain, 'notes.md', '# notes\n');
  setLaw(
    e.brain,
    '| INV-14 | accounts table exists | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-14 api:db/migrations/*.sql /create[[:space:]]+table/i -->',
  );
  return { e, branch };
}

test('staleness: block — a resolvable stale pin exits 1 with the command that moves the pin', async () => {
  const { e, branch } = staleEco();
  writeFileSync(
    join(e.brain, '.multivac/config.yml'),
    `staleness: block\nchannel: ${branch}\nrepos:\n  api: ../acme-api\n  web: ../acme-web\n`,
  );
  const { code, out } = await captured(() => runVerify(e.brain));
  assert.equal(code, 1);
  assert.match(out, new RegExp(`stale\\s+api: pin 1 behind ${branch}`));
  assert.match(out, /blocking \(staleness: block\)/);
  assert.match(out, /submodule update --remote/);
  assert.match(out, /1 stale pin blocking/);
});

test('staleness: block — unresolvable channel ref reports, never gates (offline)', async () => {
  const { e } = staleEco();
  writeFileSync(
    join(e.brain, '.multivac/config.yml'),
    'staleness: block\nchannel: origin/nowhere\nrepos:\n  api: ../acme-api\n  web: ../acme-web\n',
  );
  const { code, out } = await captured(() => runVerify(e.brain));
  assert.equal(code, 0); // offline never guesses, never gates
  assert.match(out, /stale\?\s+api: channel origin\/nowhere unknown locally/);
  assert.match(out, /repos sync/);
});

test('config rejects an unknown staleness value, naming the two allowed', async () => {
  const { e } = staleEco();
  writeFileSync(
    join(e.brain, '.multivac/config.yml'),
    'staleness: sometimes\nrepos:\n  api: ../acme-api\n  web: ../acme-web\n',
  );
  assert.equal(await runVerify(e.brain), 2);
});

test('staleness: block — a pin ahead of the channel is not stale, never gates', async () => {
  const e = eco();
  git(e.brain, 'branch', 'chan'); // channel stays at current HEAD
  commitFile(e.brain, 'notes.md', '# notes\n');
  const pin = git(e.brain, 'rev-parse', 'HEAD'); // one ahead of chan
  git(e.repos.api, 'update-index', '--add', '--cacheinfo', `160000,${pin},.brain`);
  git(e.repos.api, 'commit', '-q', '-m', 'mount brain ahead of channel');
  writeFileSync(
    join(e.brain, '.multivac/config.yml'),
    'staleness: block\nchannel: chan\nrepos:\n  api: ../acme-api\n  web: ../acme-web\n',
  );
  setLaw(
    e.brain,
    '| INV-14 | accounts table exists | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-14 api:db/migrations/*.sql /create[[:space:]]+table/i -->',
  );
  const { code, out } = await captured(() => runVerify(e.brain));
  assert.equal(code, 0); // "behind" is the fact that gates; ahead is fine
  assert.doesNotMatch(out, /stale {5}api/);
});

test('config rejects the reserved repo keys "brain" and "*"', async () => {
  const e = eco();
  setLaw(e.brain);
  writeFileSync(
    join(e.brain, '.multivac/config.yml'),
    'repos:\n  brain: ../acme-api\n',
  );
  assert.equal(await runVerify(e.brain), 2);
  writeFileSync(join(e.brain, '.multivac/config.yml'), 'repos:\n  "*": ../acme-api\n');
  assert.equal(await runVerify(e.brain), 2);
});

// --- untracked files and pending claims (DOGFOOD-01 annoying 2 + 3) ---

/** Write a change file into the brain. dir "" = open changes/, "archive" = closed. */
function writeChange(
  brain: string,
  slug: string,
  claimIds: string[],
  opts: { status?: 'open' | 'archived'; dir?: string } = {},
): void {
  const dir = join(brain, '.multivac/changes', opts.dir ?? '');
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, `${slug}.md`),
    [
      '---',
      `slug: ${slug}`,
      `status: ${opts.status ?? 'open'}`,
      'repos:',
      '  api:',
      '    status: planned',
      'landing_order:',
      '  - - api',
      'invariants:',
      '  touches: []',
      '  adds: []',
      '  retires: []',
      'claims:',
      ...claimIds.flatMap((id) => [`  - id: ${id}`, '    statement: it will be true']),
      '---',
      '',
      `# ${slug}`,
      '',
    ].join('\n'),
  );
}

test('untracked file: the hint is `git add`, not "fix the glob"', async () => {
  const e = eco();
  // The code exists on disk — it was just never added. ls-files cannot see it.
  writeFileSync(join(e.repos.api, 'src/pricing.ts'), 'export const vatRate = 0.21;\n');
  setLaw(
    e.brain,
    '| INV-15 | vat rate lives in pricing | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-15 api:src/pricing.ts /vatRate/ -->',
  );
  const { out } = await captured(() => runVerify(e.brain, '--strict'));
  assert.match(out, /file exists but is untracked — `git add src\/pricing\.ts`/);
  assert.doesNotMatch(out, /fix the glob/);
  // and the correct glob is never self-healed away
  assert.match(readFileSync(join(e.brain, '.multivac/invariants.md'), 'utf8'), /api:src\/pricing\.ts /);
});

test('untracked file: blocking modes say it too (absent tombstone)', async () => {
  const e = eco();
  writeFileSync(join(e.repos.api, 'db/migrations/0002.sql'), 'SELECT 1;\n');
  setLaw(
    e.brain,
    '| INV-16 | no drops in migration 2 | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-16 api:db/migrations/0002.sql /drop[[:space:]]+table/i absent -->',
  );
  const { code, out } = await captured(() => runVerify(e.brain));
  assert.equal(code, 1); // a vacuous tombstone still gates
  assert.match(out, /untracked — `git add db\/migrations\/0002\.sql`/);
});

test('a claim an open change declares is pending: never blocks, not even blocking modes', async () => {
  const e = eco();
  writeChange(e.brain, 'expiring-points', ['INV-17']);
  setLaw(
    e.brain,
    '| INV-17 | points expire after a year | published | proposed | 2026-01-01 | x |',
    // count= is a blocking mode: without pendency this is exit 1, always.
    '<!-- @anchor INV-17 api:src/points.ts /expiresAt/ count=1 -->',
  );
  const { code, out } = await captured(() => runVerify(e.brain, '--strict'));
  assert.equal(code, 0);
  assert.match(out, /pending/);
  assert.match(out, /declared by open change expiring-points/);
  assert.match(out, /0 blocking broken · exit 0/);
});

test('pendency is not self-heal: a pending claim never rewrites its glob', async () => {
  const e = eco();
  writeChange(e.brain, 'port-move', ['INV-18']);
  setLaw(
    e.brain,
    '| INV-18 | port is fixed | published | active | 2026-01-01 | x |',
    // The regex matches src/server.ts — self-heal would rewrite this glob.
    '<!-- @anchor INV-18 api:src/app/*.ts /port = 8080/ -->',
  );
  const { code, out } = await captured(() => runVerify(e.brain));
  assert.equal(code, 0);
  assert.match(out, /pending/);
  assert.doesNotMatch(out, /moved/);
  assert.match(readFileSync(join(e.brain, '.multivac/invariants.md'), 'utf8'), /api:src\/app\/\*\.ts/);
});

test('a closed change confers nothing: archived and non-open claims still gate', async () => {
  const e = eco();
  writeChange(e.brain, 'landed-already', ['INV-19'], { dir: 'archive', status: 'archived' });
  writeChange(e.brain, 'also-closed', ['INV-19'], { status: 'archived' });
  setLaw(
    e.brain,
    '| INV-19 | points expire after a year | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-19 api:src/points.ts /expiresAt/ count=1 -->',
  );
  const { code, out } = await captured(() => runVerify(e.brain));
  assert.equal(code, 1);
  assert.doesNotMatch(out, /pending/);
});

// --- MV-20: one predicate behind the printed line and the exit code --------

/**
 * The agreement itself: a line marked blocking exists exactly when the run
 * gated. Report text and exit code cannot disagree — the "pin 0 behind"
 * class of bug, where a line said blocking and the gate said otherwise.
 */
function agrees(code: number, out: string): boolean {
  const marked = out
    .split('\n')
    .filter((l) => l.endsWith(' · blocking') || l.includes('blocking (staleness: block)'));
  return (marked.length > 0) === (code === 1);
}

test('staleness: report text and exit code cannot disagree', async () => {
  // Stale pin, gating.
  const { e, branch } = staleEco();
  const cfg = (body: string): void =>
    writeFileSync(join(e.brain, '.multivac/config.yml'), body);
  cfg(`staleness: block\nchannel: ${branch}\nrepos:\n  api: ../acme-api\n  web: ../acme-web\n`);
  let r = await captured(() => runVerify(e.brain));
  assert.equal(r.code, 1);
  assert.ok(agrees(r.code, r.out), r.out);

  // Same pin, staleness: report — the line loses its marker with the gate.
  cfg(`channel: ${branch}\nrepos:\n  api: ../acme-api\n  web: ../acme-web\n`);
  r = await captured(() => runVerify(e.brain));
  assert.equal(r.code, 0);
  assert.ok(agrees(r.code, r.out), r.out);

  // Channel unknown locally: reported, never gated, never marked.
  cfg('staleness: block\nchannel: origin/nowhere\nrepos:\n  api: ../acme-api\n');
  r = await captured(() => runVerify(e.brain));
  assert.equal(r.code, 0);
  assert.ok(agrees(r.code, r.out), r.out);
});

test('vacuous: report text and exit code cannot disagree', async () => {
  const e = eco();
  setLaw(
    e.brain,
    // present is not in blocking: [absent, count] — vacuous here reports.
    '| INV-20 | the pricing table exists | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-20 api:pricing/**/*.sql /create[[:space:]]+table/ -->',
  );
  let r = await captured(() => runVerify(e.brain));
  assert.equal(r.code, 0);
  assert.match(r.out, /vacuous/);
  assert.match(r.out, /reported only/);
  assert.ok(agrees(r.code, r.out), r.out);

  // --strict promotes the same leg: marker and gate move together.
  r = await captured(() => runVerify(e.brain, '--strict'));
  assert.equal(r.code, 1);
  assert.match(r.out, / · blocking/);
  assert.ok(agrees(r.code, r.out), r.out);

  // A blocking mode marks and gates without --strict.
  setLaw(
    e.brain,
    '| INV-21 | no plaintext card numbers | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-21 api:pricing/**/*.sql /card_number/ absent -->',
  );
  r = await captured(() => runVerify(e.brain));
  assert.equal(r.code, 1);
  assert.match(r.out, / · blocking/);
  assert.ok(agrees(r.code, r.out), r.out);
});

/** The number the summary line leads with, and the `· blocking` markers above it. */
function summaryVsMarkers(out: string): { summary: number; marked: number } {
  const m = /^(\d+) blocking broken · exit/m.exec(out);
  assert.ok(m, `no summary line in:\n${out}`);
  return {
    summary: Number(m[1]),
    marked: out
      .split('\n')
      .filter((l) => l.endsWith(' · blocking') || l.includes('blocking (staleness: block)')).length,
  };
}

test('the summary counts the same predicate the markers do — --strict included', async () => {
  const e = eco();
  // unique is not in blocking: [absent, count], so this leg gates only under
  // --strict. The old summary printed the non-strict tally: "0 blocking
  // broken · exit 1", printed under a line marked blocking.
  commitFile(e.repos.api, 'src/token.ts', 'export const TTL = 900;\nexport const TTL2 = 900;\n');
  setLaw(
    e.brain,
    '| INV-22 | one TTL | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-22 api:src/token.ts /TTL[0-9]* = 900/ unique -->',
  );
  const r = await captured(() => runVerify(e.brain, '--strict'));
  assert.equal(r.code, 1);
  const { summary, marked } = summaryVsMarkers(r.out);
  assert.equal(marked, 1);
  assert.equal(summary, 1, `summary says ${summary} under ${marked} blocking lines:\n${r.out}`);
  assert.ok(agrees(r.code, r.out), r.out);
});

test('a mixed run: every marked line is counted once, and only those', async () => {
  const e = eco();
  commitFile(e.repos.api, 'src/token.ts', 'export const TTL = 900;\nexport const TTL2 = 900;\n');
  setLaw(
    e.brain,
    // gates without --strict (absent over a vacuous glob)
    '| INV-23 | dead path stays dead | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-23 api:db/gone/** /anything/ absent -->',
    // gates only under --strict
    '| INV-24 | one TTL | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-24 api:src/token.ts /TTL[0-9]* = 900/ unique -->',
    // never gates: a proposed row is informational
    '| INV-25 | future law | published | proposed | 2026-01-01 | x |',
    '<!-- @anchor INV-25 api:src/nothing.ts /nope/ absent -->',
  );
  let r = await captured(() => runVerify(e.brain));
  assert.equal(r.code, 1);
  assert.deepEqual(summaryVsMarkers(r.out), { summary: 1, marked: 1 });

  r = await captured(() => runVerify(e.brain, '--strict'));
  assert.equal(r.code, 1);
  assert.deepEqual(summaryVsMarkers(r.out), { summary: 2, marked: 2 });
});

test('a pending claim is named in the summary, not only in the body', async () => {
  const e = eco();
  writeChange(e.brain, 'expiring-points', ['INV-26']);
  setLaw(
    e.brain,
    '| INV-26 | points expire after a year | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-26 api:src/points.ts /expiresAt/ count=1 -->',
  );
  const r = await captured(() => runVerify(e.brain, '--strict'));
  assert.equal(r.code, 0);
  // exit 0 is the grace; silence about what bought it is not.
  assert.match(r.out, /1 claim held pending by open change expiring-points — not gating/);
  assert.match(r.out, /close or delete the change to unmask them/);
});

test('nothing pending: the summary says nothing about pendency', async () => {
  const e = eco();
  setLaw(
    e.brain,
    '| INV-27 | accounts table exists | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-27 api:db/migrations/*.sql /create[[:space:]]+table[[:space:]]+accounts/i -->',
  );
  const r = await captured(() => runVerify(e.brain));
  assert.equal(r.code, 0);
  assert.doesNotMatch(r.out, /held pending/);
});

// --- repo-qualified exclusions ---

/** README.md in all three repos; PIN only in the two code repos. */
function readmesWithPin(e: ScratchEcosystem): void {
  commitFile(e.brain, 'README.md', '# acme brain\n');
  commitFile(e.repos.api, 'README.md', '# acme-api\n\nPIN 1234\n');
  commitFile(e.repos.web, 'README.md', '# acme-web\n\nPIN 5678\n');
}

test('a qualified exclusion exempts one repo, never its namesake elsewhere', async () => {
  const e = eco();
  readmesWithPin(e);
  // The whole ecosystem is checked; api's README is exempt by name — web's
  // README, same basename, is not.
  setLaw(
    e.brain,
    '| INV-70 | no PIN in the docs | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-70 *:README.md !api:README.md /PIN/ absent -->',
  );
  const r = await captured(() => runVerify(e.brain));
  assert.equal(r.code, 1);
  assert.match(r.out, /web:README\.md:3/);
  assert.doesNotMatch(r.out, /api:README\.md:/);

  // Exempt both, and the leg is green — the brain's README still gets read,
  // so this is ok, not vacuous.
  setLaw(
    e.brain,
    '| INV-70 | no PIN in the docs | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-70 *:README.md !api:README.md !web:README.md /PIN/ absent -->',
  );
  assert.equal(await runVerify(e.brain, '--strict'), 0);
});

test('a bare exclusion still bites in every repo — and empties the leg', async () => {
  const e = eco();
  readmesWithPin(e);
  setLaw(
    e.brain,
    '| INV-71 | no PIN in the docs | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-71 *:README.md !README.md /PIN/ absent -->',
  );
  const r = await captured(() => runVerify(e.brain));
  assert.equal(r.code, 1);
  // Exclusions count toward vacuity: nothing left to check is not a pass.
  assert.match(r.out, /vacuous/);
});

test('an exclusion naming an undeclared repo is refused, naming the key', async () => {
  const e = eco();
  readmesWithPin(e);
  setLaw(
    e.brain,
    '| INV-72 | no PIN in the docs | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-72 *:README.md !frontend:README.md /PIN/ absent -->',
  );
  const r = await captured(() => runVerify(e.brain));
  assert.equal(r.code, 1);
  assert.match(r.out, /unknown repo key "frontend"/);
  assert.match(r.out, /anchor parse errors/);
});

test('a qualified exclusion in a single-repo leg is legal and redundant', async () => {
  const e = eco();
  readmesWithPin(e);
  setLaw(
    e.brain,
    '| INV-73 | no PIN outside the readme | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-73 api:** !api:README.md /PIN/ absent -->',
  );
  assert.equal(await runVerify(e.brain, '--strict'), 0);
});

test('a drift row never gates — the recorded finding stays visible, named in the summary', async () => {
  const e = eco();
  // A true finding: the forbidden pattern IS in the code. state active gates;
  // state drift records it without making the repo un-committable.
  setLaw(
    e.brain,
    '| INV-80 | no accounts grants | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-80 api:db/migrations/*.sql /GRANT/ absent -->',
  );
  assert.equal(await runVerify(e.brain), 1, 'active row must keep the exit matrix');
  setLaw(
    e.brain,
    '| INV-80 | no accounts grants | published | drift | 2026-01-01 | x |',
    '<!-- @anchor INV-80 api:db/migrations/*.sql /GRANT/ absent -->',
  );
  const r = await captured(() => runVerify(e.brain, '--strict'));
  assert.equal(r.code, 0, `drift row gated:\n${r.out}`);
  assert.match(r.out, /drift row — recorded finding, never blocks/);
  assert.match(r.out, /drift: INV-80 — recorded finding/);
  assert.match(r.out, /0 blocking broken · exit 0/);
});

test('the unanchored claim ids are named, not only counted', async () => {
  const e = eco();
  setLaw(
    e.brain,
    '| INV-81 | anchored | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-81 api:README.md /acme-api/ -->',
    '| INV-82 | a process rule, unanchorable | published | active | 2026-01-01 | x |',
    '| INV-83 | another one | published | active | 2026-01-01 | x |',
  );
  const r = await captured(() => runVerify(e.brain));
  assert.equal(r.code, 0);
  assert.match(r.out, /3 claims · 1 anchored/);
  assert.match(r.out, /unanchored: INV-82, INV-83/);
});

test('parse diagnostics print above the summary, not below it', async () => {
  const e = eco();
  setLaw(
    e.brain,
    '| INV-84 | bad anchor | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-84 api:src/** /\\d+/ -->',
  );
  const r = await captured(() => runVerify(e.brain));
  assert.equal(r.code, 1);
  const parseAt = r.out.indexOf('is not POSIX ERE');
  const summaryAt = r.out.indexOf('claims ·');
  assert.ok(parseAt >= 0 && summaryAt >= 0, r.out);
  assert.ok(parseAt < summaryAt, `diagnostics below the summary:\n${r.out}`);
});
