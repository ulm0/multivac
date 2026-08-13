// Consumer-scoped verify: a code repo with the brain mounted at .brain/
// (or any brain-shaped subdirectory) runs verify scoped to its own anchors
// plus `*` anchors, on the same exit matrix.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gitInit, makeScratchEcosystem, type ScratchEcosystem } from '../helpers/fixture.js';
import { verify } from '../../src/commands/verify.js';

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', ['-C', cwd, ...args], { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
}

const HEADER = [
  '# Invariants',
  '',
  '| ID | statement | authority | state | date | source |',
  '| --- | --- | --- | --- | --- | --- |',
];

/** Brain with law committed, then mounted (local clone) at <api>/.brain. */
function mountedEco(...law: string[]): ScratchEcosystem & { mount: string } {
  const e = makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-consumer-')));
  writeFileSync(join(e.brain, '.multivac/invariants.md'), [...HEADER, ...law, ''].join('\n'));
  git(e.brain, 'add', '-A');
  git(e.brain, 'commit', '-q', '-m', 'law');
  const mount = join(e.repos.api, '.brain');
  execFileSync('git', ['clone', '-q', e.brain, mount], { stdio: 'ignore' });
  return { ...e, mount };
}

function runVerify(cwd: string, ...flags: string[]): Promise<number> {
  return verify.run(flags, { cwd });
}

async function captured(fn: () => Promise<number>): Promise<{ code: number; out: string }> {
  const lines: string[] = [];
  const orig = { log: console.log, error: console.error };
  console.log = console.error = (...a: unknown[]) => {
    lines.push(a.map(String).join(' '));
  };
  try {
    const code = await fn();
    return { code, out: lines.join('\n') };
  } finally {
    console.log = orig.log;
    console.error = orig.error;
  }
}

const LAW = [
  '| INV-C1 | accounts table exists | published | active | 2026-01-01 | x |',
  '<!-- @anchor INV-C1 api:db/migrations/*.sql /create[[:space:]]+table[[:space:]]+accounts/i -->',
  '| INV-C2 | web never says acme-web | published | active | 2026-01-01 | x |',
  '<!-- @anchor INV-C2 web:README.md /acme-web/ absent -->',
  '| INV-C3 | fluxcap flow removed | published | retired | 2026-01-01 | x |',
  '<!-- @anchor INV-C3 *:README.md /FLUXCAP/ absent -->',
];

test('verify from a consumer cwd is scoped to that repo: another repo’s broken tombstone does not gate it', async () => {
  const e = mountedEco(...LAW);
  // From the brain, INV-C2 is broken (web/README.md does say acme-web): exit 1.
  assert.equal(await runVerify(e.brain), 1);
  // From the api consumer, web’s anchors are out of scope: exit 0.
  const { code, out } = await captured(() => runVerify(e.repos.api));
  assert.equal(code, 0);
  assert.match(out, /scoped to repo "api"/);
  assert.doesNotMatch(out, /INV-C2/);
});

test('a * tombstone evaluates against the scoped consumer and gates it', async () => {
  const e = mountedEco(...LAW);
  writeFileSync(join(e.repos.api, 'README.md'), '# acme-api\n\nuses the FLUXCAP flow\n');
  git(e.repos.api, 'add', '-A');
  git(e.repos.api, 'commit', '-q', '-m', 'plant dead term');
  const { code, out } = await captured(() => runVerify(e.repos.api));
  assert.equal(code, 1);
  assert.match(out, /INV-C3/);
});

test('no config and no mount stays exit 2 with the init hint', async () => {
  const e = mountedEco(...LAW); // web has no mount
  assert.equal(await runVerify(e.repos.web), 2);
});

test('unmatchable checkout asks for --repo; the flag scopes it', async () => {
  const e = mountedEco(...LAW);
  // A consumer whose basename/path/url match nothing in the registry.
  const stray = join(mkdtempSync(join(tmpdir(), 'mvac-stray-')), 'checkout');
  gitInit(stray);
  execFileSync('git', ['clone', '-q', e.brain, join(stray, '.brain')], { stdio: 'ignore' });
  const { code, out } = await captured(() => runVerify(stray));
  assert.equal(code, 2);
  assert.match(out, /--repo <key>/);
  // Scoped by flag: api’s present leg finds nothing here — broken but
  // non-blocking; the * tombstone sees no README — vacuous, blocking.
  assert.equal(await runVerify(stray, '--repo', 'api'), 1);
});

test('consumer mode never rewrites a moved glob into the mount', async () => {
  const e = mountedEco(
    '| INV-C4 | port is fixed | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-C4 api:src/app/*.ts /port = 8080/ -->',
  );
  const before = readFileSync(join(e.mount, '.multivac/invariants.md'), 'utf8');
  const { code, out } = await captured(() => runVerify(e.repos.api));
  assert.equal(code, 0);
  assert.match(out, /moved/);
  assert.equal(readFileSync(join(e.mount, '.multivac/invariants.md'), 'utf8'), before);
});

test('the scoped header counts what it evaluated, not the whole brain', async () => {
  const e = mountedEco(...LAW);
  // Three brain claims, one of which anchors into api (plus the `*` leg).
  const { out } = await captured(() => runVerify(e.repos.api));
  assert.match(out, /2 of 3 brain claims anchor into "api"/);
  // No coverage percentage: the scoped denominator would read as a collapse.
  assert.doesNotMatch(out, /anchored \(/);
});
