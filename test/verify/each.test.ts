// The `each` mode — measurement 2's missing universal quantifier. The
// headline reproduction: a privileged rogue container injected into one of N
// k8s manifests turns verify red and NAMES the file, where count=N (a
// deletion ratchet) stayed green through the same injection.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeScratchEcosystem, type ScratchEcosystem } from '../helpers/fixture.js';
import { verify } from '../../src/commands/verify.js';

function eco(): ScratchEcosystem {
  return makeScratchEcosystem(mkdtempSync(join(tmpdir(), 'mvac-each-')));
}

function git(cwd: string, ...args: string[]): void {
  execFileSync('git', ['-C', cwd, ...args], { stdio: 'ignore' });
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

async function captured(brain: string, ...flags: string[]): Promise<{ code: number; out: string }> {
  const lines: string[] = [];
  const orig = console.log;
  console.log = (...a: unknown[]) => {
    lines.push(a.map(String).join(' '));
  };
  try {
    const code = await verify.run(flags, { cwd: brain });
    return { code, out: lines.join('\n') };
  } finally {
    console.log = orig;
  }
}

/** A confined acme deployment manifest. */
const manifest = (name: string): string =>
  [
    'apiVersion: apps/v1',
    'kind: Deployment',
    `metadata: { name: ${name} }`,
    'spec:',
    '  containers:',
    `    - name: ${name}`,
    '      securityContext:',
    '        privileged: false',
    '      resources:',
    '        limits: { cpu: 100m }',
    '',
  ].join('\n');

function manifests(api: string): void {
  const dir = join(api, 'k8s');
  execFileSync('mkdir', ['-p', dir]);
  for (const name of ['checkout', 'payment', 'frontend']) {
    writeFileSync(join(dir, `${name}.yaml`), manifest(name));
  }
  git(api, 'add', '-A');
  git(api, 'commit', '-q', '-m', 'add manifests');
}

const TOMBSTONE =
  '<!-- @anchor INV-90 api:k8s/*.yaml /privileged:[[:space:]]*true/ each! -->';
const ROW = '| INV-90 | no privileged containers | published | active | 2026-01-01 | x |';

test('each!: the measurement-2 rogue container turns verify red and is NAMED', async () => {
  const e = eco();
  manifests(e.repos.api);
  setLaw(e.brain, ROW, TOMBSTONE);
  // Clean fixture: green.
  assert.equal((await captured(e.brain)).code, 0);
  // Inject the rogue container measurement 2 proved invisible to count=N.
  commitFile(
    e.repos.api,
    'k8s/payment.yaml',
    manifest('payment') + '    - name: rogue\n      securityContext:\n        privileged: true\n',
  );
  const { code, out } = await captured(e.brain);
  assert.equal(code, 1);
  assert.match(out, /each!: forbidden pattern in 1 of 3 files/);
  assert.match(out, /k8s\/payment\.yaml:\d+/); // the failing file, at its line
});

test('each: a new manifest that omits the required pattern breaks the leg by name', async () => {
  const e = eco();
  manifests(e.repos.api);
  setLaw(
    e.brain,
    '| INV-91 | every deployment declares limits | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-91 api:k8s/*.yaml /limits:/ each -->',
  );
  assert.equal((await captured(e.brain)).code, 0);
  // Omission-on-addition: exactly what count=N never catches.
  commitFile(e.repos.api, 'k8s/rogue.yaml', 'kind: Deployment\n');
  const { code, out } = await captured(e.brain);
  assert.equal(code, 1);
  // The hit names its repo: `k8s/rogue.yaml` alone is ambiguous in an ecosystem.
  assert.match(out, /each: 1 of 4 files lack the pattern \(api:k8s\/rogue\.yaml\)/);
});

test('each over zero files is vacuous and blocks — the quantifier over nothing fails', async () => {
  const e = eco();
  setLaw(e.brain, ROW, TOMBSTONE); // no k8s/ dir exists at all
  const { code, out } = await captured(e.brain);
  assert.equal(code, 1);
  assert.match(out, /vacuous/);
  assert.match(out, /each! over nothing proves nothing/);
});

test('a qualified exclusion exempts the sanctioned file from each', async () => {
  const e = eco();
  manifests(e.repos.api);
  commitFile(
    e.repos.api,
    'k8s/debug.yaml',
    manifest('debug') + '      # sanctioned\n        privileged: true\n',
  );
  setLaw(e.brain, ROW, TOMBSTONE);
  assert.equal((await captured(e.brain)).code, 1);
  setLaw(
    e.brain,
    ROW,
    '<!-- @anchor INV-90 api:k8s/*.yaml !api:k8s/debug.yaml /privileged:[[:space:]]*true/ each! -->',
  );
  assert.equal((await captured(e.brain)).code, 0);
});

test('each matches per normalized statement inside .sql files', async () => {
  const e = eco();
  // The fixture migration holds one multi-line GRANT ... UPDATE ON accounts:
  // no single line matches, the normalized statement does. Per-line matching
  // would report the file as lacking the pattern.
  setLaw(
    e.brain,
    '| INV-92 | every migration grants app_role | published | active | 2026-01-01 | x |',
    '<!-- @anchor INV-92 api:db/migrations/*.sql /grant[^;]*to[[:space:]]+app_role/i each -->',
  );
  assert.equal((await captured(e.brain)).code, 0);
});
