// MV-92, second half: a test run reflects the tree it was started from.
//
// `tsc` never deletes output for a source that has gone, so `dist-test/`
// accumulated whatever any branch ever compiled. Both directions are real and
// the silent one is worse: measured after a rebase, five failures from a file
// absent from that branch — and the inverse, a deleted test still passing, is
// a green nobody earned.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { mkdtempSync } from 'node:fs';
import { join, relative } from 'node:path';

const repoRoot = join(import.meta.dirname, '../../..');
const outDir = join(repoRoot, 'dist-test/test');

/** Every compiled test under dist-test/test, repo-relative. */
function compiledTests(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const found: string[] = [];
  for (const e of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (e.isFile() && e.name.endsWith('.test.js')) found.push(join(e.parentPath, e.name));
  }
  return found;
}

test('every compiled test has a source in the tree', () => {
  // The property, not the script. A string assertion about package.json passes
  // while the behaviour is broken by a rename, a different entry point, or a
  // build run some other way; this fails whatever the cause.
  const compiled = compiledTests(outDir);
  assert.ok(compiled.length > 0, 'the suite compiled something to check');
  const orphans = compiled
    .filter((js) => !existsSync(join(repoRoot, 'test', relative(outDir, js).replace(/\.js$/, '.ts'))))
    .map((js) => relative(repoRoot, js));
  assert.deepEqual(orphans, [], 'compiled tests with no source — the build did not clear its output');
});

test('the clean the build runs removes output whose source is gone', () => {
  // The REAL script text, run against a scratch tree — never against this
  // repository. Running the actual build here would delete dist-test/ out from
  // under every other test file mid-run, which is how this test was first
  // written and how it took eight suites down with it.
  const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as {
    scripts: Record<string, string>;
  };
  const scratch = mkdtempSync(join(tmpdir(), 'mvac-clean-'));
  const orphan = join(scratch, 'dist-test/test/gone.test.js');
  mkdirSync(join(scratch, 'dist-test/test'), { recursive: true });
  mkdirSync(join(scratch, 'dist'), { recursive: true });
  writeFileSync(orphan, '// its source is gone\n');
  assert.ok(existsSync(orphan), 'the orphan was planted');

  execFileSync('sh', ['-c', pkg.scripts.prebuild], { cwd: scratch, stdio: 'ignore' });

  assert.equal(existsSync(orphan), false, 'the clean left an orphan behind');
  assert.equal(existsSync(join(scratch, 'dist')), false, 'the clean left dist behind');
  rmSync(scratch, { recursive: true, force: true });
});

test('the build clears both output directories before compiling', () => {
  // Beside the property above: this one names WHERE, so a failure points at the
  // script rather than at a mystery.
  const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as {
    scripts: Record<string, string>;
  };
  const pre = pkg.scripts.prebuild ?? '';
  assert.match(pre, /dist/, 'the build clears dist');
  assert.match(pre, /dist-test/, 'the build clears dist-test');
  assert.equal(/rm\s+-rf/.test(pre), false, 'no shell rm: the clean runs where the build runs');
});
