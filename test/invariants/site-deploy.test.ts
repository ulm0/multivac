// MV-77. The site must never advertise a version the registry does not have.
//
// Two facts make that true, and neither is a single line, so neither can be an
// anchor: the scanner matches one line at a time, and both of these are
// relations. Anchoring the comments that explain them would be evidence that is
// a sentence about the code — the defect MV-46 was corrected for.
//
//   1. `pages` depends on `publish` (`needs: [publish]`), gated so a tag whose
//      publish job FAILED does not let the site deploy anyway, while a plain
//      default-branch push — where `publish` never runs — still proceeds.
//   2. `pages` runs on a tag AND on the default branch. Tag-only would hold
//      documentation corrections hostage to a release nobody needs to cut;
//      branch-only is what let a merged bump advertise an unpublished version.
//
// pnpm test runs from the repo root.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const CI = '.github/workflows/ci.yml';

function loadWorkflow() {
  return parse(readFileSync(CI, 'utf8'));
}

test('publish runs before deploy, so the site never precedes the package (MV-77)', () => {
  const workflow = loadWorkflow();
  const pages = workflow.jobs?.pages;
  assert.ok(pages, `${CI} declares no pages job this test can read`);

  const needs = Array.isArray(pages.needs) ? pages.needs : [pages.needs];
  assert.ok(
    needs.includes('publish'),
    `pages does not depend on publish (needs: ${JSON.stringify(pages.needs)}): deploying before publishing puts the site ahead of the package it describes`,
  );
  assert.match(
    String(pages.if),
    /needs\.publish\.result/,
    'pages does not check publish\'s result: a failed release would still let the site deploy',
  );
});

test('the site deploys on a release and on the default branch, not one or the other (MV-77)', () => {
  const workflow = loadWorkflow();
  const pages = workflow.jobs?.pages;
  assert.ok(pages, `${CI} declares no pages job this test can read`);

  const condition = String(pages.if);
  assert.match(
    condition,
    /github\.ref_type == 'tag'/,
    'pages does not run on a release: the badge would wait for the next unrelated merge',
  );
  assert.match(
    condition,
    /github\.event\.repository\.default_branch/,
    'pages does not run on the default branch: site-only corrections would wait for a release',
  );
});

// MV-154. GitHub Pages keys a deployment by its commit and answers a second
// deployment of a commit with the first, so a release commit deployed from its
// push to the default branch, before its tag existed, kept the old badge when
// the tag's run deployed it again. The pages job decides first, and nothing
// after that decision runs when it says no.
test('a default-branch push of an untagged version deploys nothing (MV-154)', () => {
  const workflow = loadWorkflow();
  const steps: Array<{ id?: string; if?: string; run?: string; uses?: string; name?: string }> =
    workflow.jobs?.pages?.steps ?? [];
  const gateAt = steps.findIndex((s) => s.id === 'gate');
  assert.ok(gateAt > 0, `${CI}'s pages job has no step with id: gate after its checkout`);

  const gate = String(steps[gateAt].run);
  assert.match(gate, /require\("\.\/package\.json"\)\.version/, 'the gate does not read the version package.json declares');
  assert.match(gate, /refs\/tags\/\$version/, 'the gate does not ask whether that version is tagged');
  assert.match(gate, /GITHUB_REF_TYPE" = tag/, 'the gate does not let a tag deploy');

  const after = steps.slice(gateAt + 1);
  assert.ok(after.length > 0, 'nothing follows the gate');
  for (const step of after) {
    assert.equal(
      step.if,
      "steps.gate.outputs.deploy == 'true'",
      `${step.name ?? step.uses} runs whatever the gate decided: an untagged release would deploy and freeze the badge`,
    );
  }
});
