// MV-135. A project document's state is one verdict, measured against the
// tool's own template; `change new` asks for an unwritten one without urging;
// flow.md shows its gate; openspec's `context:` is reported, never gated; and
// the door says an active row outranks it.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { initRepo } from '../helpers/fixture.js';
import { SPECKIT_INTEGRATION_JSON } from '../helpers/recorded.js';
import { projectDocVerdict } from '../../src/lib/repo-state.js';
import { sddSpec } from '../../src/adapters/registry.js';
import { change } from '../../src/commands/change.js';
import { loadConfig } from '../../src/lib/config.js';
import { renderFlow } from '../../src/doors/flow.js';
import { renderBrainDoor } from '../../src/doors/brain.js';

process.env.PATH = [dirname(process.execPath), '/usr/bin', '/bin'].join(delimiter);
for (const [k, v] of Object.entries({
  GIT_AUTHOR_NAME: 'mvac-test', GIT_AUTHOR_EMAIL: 'test@invalid',
  GIT_COMMITTER_NAME: 'mvac-test', GIT_COMMITTER_EMAIL: 'test@invalid',
})) process.env[k] ??= v;

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

const put = (root: string, rel: string, body: string): void => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), body);
};

const constitution = sddSpec('speckit')!.projectSteps![0];
const context = sddSpec('opsx')!.projectSteps![0];
const CONST = '.specify/memory/constitution.md';

test('the template is the tool\'s own: its recorded sha256, or one of its tokens outside HTML comments — MV-135', async () => {
  const d = mkdtempSync(join(tmpdir(), 'mvac-docstate-'));
  assert.deepEqual(await projectDocVerdict(d, constitution), { verdict: 'missing' });
  put(d, CONST, '  \n');
  assert.equal((await projectDocVerdict(d, constitution)).verdict, 'empty');

  // A token still there, outside a comment: the template, and the token is named.
  put(d, CONST, '# Acme Constitution\n\n### [PRINCIPLE_1_NAME]\n');
  assert.deepEqual(await projectDocVerdict(d, constitution), { verdict: 'template', why: 'placeholders remain: [PRINCIPLE_1_NAME]' });

  // Written: the template's commented guidance kept, and brackets that are not its tokens.
  const written = '# Acme Constitution\n<!-- Example: [PRINCIPLE_1_NAME] -->\n\n### I. Law first [1]\nEvery [API] change cites a row.\n';
  put(d, CONST, written);
  assert.deepEqual(await projectDocVerdict(d, constitution), { verdict: 'written' });

  // Byte-identical to what the tool recorded: the template, tokens or none.
  put(d, '.specify/memory/.constitution-template.json', JSON.stringify({ sha256: createHash('sha256').update(written).digest('hex'), source: 'core' }));
  assert.deepEqual(await projectDocVerdict(d, constitution), {
    verdict: 'template',
    why: 'byte-identical to the template recorded in .specify/memory/.constitution-template.json',
  });
});

test('openspec\'s context is a YAML key, at most 51200 bytes — MV-135', async () => {
  const d = mkdtempSync(join(tmpdir(), 'mvac-docstate-opsx-'));
  assert.equal((await projectDocVerdict(d, context)).verdict, 'missing');
  // What `openspec init` 1.13.0 writes: the field commented out.
  put(d, 'openspec/config.yaml', 'schema: spec-driven\n\n# Project context (optional)\n#   context: |\n#     Tech stack: TypeScript\n');
  assert.deepEqual(await projectDocVerdict(d, context), { verdict: 'empty', why: 'no `context:`' });
  put(d, 'openspec/config.yaml', `schema: spec-driven\ncontext: "${'x'.repeat(51201)}"\n`);
  assert.equal((await projectDocVerdict(d, context)).why, '`context:` is over 51200 bytes, which the tool ignores');
  put(d, 'openspec/config.yaml', 'schema: spec-driven\ncontext: |\n  Tech stack: TypeScript\n');
  assert.deepEqual(await projectDocVerdict(d, context), { verdict: 'written' });
});

function brain(constitutionBody: string): string {
  const b = join(mkdtempSync(join(tmpdir(), 'mvac-docstate-new-')), 'brain');
  initRepo(b, {
    '.multivac/config.yml': 'doors: [agents]\nsdd: speckit\nrepos:\n  brain: .\n',
    '.multivac/invariants.md': '# Invariants\n\n| ID | statement | authority | state | date | source |\n| --- | --- | --- | --- | --- | --- |\n',
    '.multivac/.gitignore': 'cache/\nworktrees/\n',
    '.specify/integration.json': SPECKIT_INTEGRATION_JSON,
    [CONST]: constitutionBody,
  });
  return b;
}

test('change new asks for an unwritten project document, with the human and without urging — MV-135', async () => {
  const b = brain('# [PROJECT_NAME] Constitution\n');
  const { code, out } = await quiet(() => change.run(['new', 'ask-doc', 'Ask doc'], { cwd: b }));
  assert.equal(code, 0, out);
  const line = out.split('\n').find((l) => l.startsWith('sdd speckit @ brain: .specify/memory/constitution.md is template'));
  assert.ok(line, out);
  assert.match(line, /\(placeholders remain: \[PROJECT_NAME\]\) — run \/speckit\.constitution .*Ask the human for the principles and write their answers; `change plan` refuses until it is written$/);
  // The per-change steps urge; the project document's line does not, and nothing follows it that does.
  const i = out.split('\n').indexOf(line);
  assert.doesNotMatch(out.split('\n')[i + 1] ?? '', /without asking/);

  const done = brain('# Acme Constitution\n\n### I. Law first\n');
  const quietNew = await quiet(() => change.run(['new', 'ask-doc', 'Ask doc'], { cwd: done }));
  assert.doesNotMatch(quietNew.out, /constitution\.md is/);
});

test('the plan refusal names the token that remains — MV-135', async () => {
  const b = brain('# Acme Constitution\n\n**Version**: [CONSTITUTION_VERSION]\n');
  const { code, out } = await quiet(() => change.run(['plan', 'nope'], { cwd: b }));
  assert.equal(code, 1, out);
  assert.match(out, /brain:\.specify\/memory\/constitution\.md is still the unfilled template shipped by the tool \(placeholders remain: \[CONSTITUTION_VERSION\] — the tool asks the author to replace them\)/);
});

test('flow.md shows the project-document gate, and opsx\'s context as yours; the door says the row wins — MV-135', async () => {
  const b = brain('# Acme\n');
  const cfg = await loadConfig(b);
  assert.match(renderFlow(cfg), /^- `change plan` refuses while `\.specify\/memory\/constitution\.md` is missing, empty or still the template, in every repo where `speckit` is installed$/m);
  assert.match(renderBrainDoor(cfg, 0), /where a project document and an active row of `\.multivac\/invariants\.md` disagree, the row wins/);

  const opsx = { ...cfg, sdd: 'opsx' };
  const page = renderFlow(opsx);
  assert.match(page, /^- `openspec\/config\.yaml` `context:` — write `context:` .*; optional, reported and never gated$/m);
  assert.doesNotMatch(page, /refuses while `openspec\/config\.yaml`/);
});
