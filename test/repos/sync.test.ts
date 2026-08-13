// repos list + sync against a local bare "remote" fixture.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { reposList, reposSync } from '../../src/commands/repos.js';

const tmp = mkdtempSync(join(tmpdir(), 'mvac-repos-'));

// A bare "remote" with one committed file.
const src = join(tmp, 'src');
mkdirSync(src);
for (const args of [
  ['init', '-q'],
  ['config', 'user.email', 'test@acme.example'],
  ['config', 'user.name', 'Acme Test'],
]) {
  execFileSync('git', ['-C', src, ...args], { stdio: 'ignore' });
}
writeFileSync(join(src, 'README.md'), '# acme-lib\n');
execFileSync('git', ['-C', src, 'add', '-A'], { stdio: 'ignore' });
execFileSync('git', ['-C', src, 'commit', '-q', '-m', 'init'], { stdio: 'ignore' });
const remote = join(tmp, 'remote.git');
execFileSync('git', ['clone', '--bare', '-q', src, remote], { stdio: 'ignore' });

function makeBrain(name: string, configYml: string): string {
  const brain = join(tmp, name);
  mkdirSync(join(brain, '.multivac'), { recursive: true });
  writeFileSync(join(brain, '.multivac/config.yml'), configYml);
  return brain;
}

test('sync clones missing repos with url, skips the rest, reports failures', async () => {
  const brain = makeBrain(
    'brain-full',
    `repos:
  lib:
    path: ../acme-lib
    url: file://${remote}
  bad:
    path: ../acme-bad
    url: file://${join(tmp, 'nope.git')}
  nourl: ../acme-nourl
`,
  );
  const { lines, exit } = await reposSync(brain, false);
  assert.equal(exit, 1); // the bad clone failed
  assert.ok(existsSync(join(tmp, 'acme-lib', 'README.md')), 'lib was cloned');
  assert.match(lines.join('\n'), /lib: cloned file:\/\//);
  assert.match(
    lines.join('\n'),
    /bad: clone failed — .*→ check repos\.bad\.url .* re-run `multivac repos sync`/,
  );
  assert.match(
    lines.join('\n'),
    /nourl: missing and no url — add url: under repos\.nourl/,
  );

  // second run: nothing to clone, lib now present, exit still 1 only for bad
  const again = await reposSync(brain, false);
  assert.match(again.lines.join('\n'), /lib: present at \.\.\/acme-lib/);

  const list = await reposList(brain);
  assert.match(list.join('\n'), /lib\s+present/);
  assert.match(list.join('\n'), /nourl\s+missing\s+.*no url, cannot sync/);
});

test('sync --shallow clones with --depth 1', async () => {
  const brain = makeBrain(
    'brain-shallow',
    `repos:
  lib:
    path: ../acme-lib-shallow
    url: file://${remote}
`,
  );
  const { lines, exit } = await reposSync(brain, true);
  assert.equal(exit, 0);
  assert.match(lines.join('\n'), /lib: cloned .*\(shallow\)/);
  const shallow = execFileSync(
    'git',
    ['-C', join(tmp, 'acme-lib-shallow'), 'rev-parse', '--is-shallow-repository'],
    { encoding: 'utf8' },
  ).trim();
  assert.equal(shallow, 'true');
});
