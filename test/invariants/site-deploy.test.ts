// MV-77. The site must never advertise a version the registry does not have.
//
// Two facts make that true, and neither is a single line, so neither can be an
// anchor: the scanner matches one line at a time, and both of these are
// relations. Anchoring the comments that explain them would be evidence that is
// a sentence about the code — the defect MV-46 was corrected for.
//
//   1. `publish` is an earlier stage than `deploy`. On a release both run; a
//      site deployed first would announce a package the registry has not
//      accepted, and a failed publish must leave the deploy unrun.
//   2. `pages` runs on a tag AND on the default branch. Tag-only would hold
//      documentation corrections hostage to a release nobody needs to cut;
//      branch-only is what let a merged bump advertise an unpublished version.
//
// pnpm test runs from the repo root.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const CI = '.gitlab-ci.yml';

test('publish runs before deploy, so the site never precedes the package (MV-77)', () => {
  const ci = readFileSync(CI, 'utf8');
  const stages = /^stages:\n((?:\s+- \w+\n)+)/m.exec(ci);
  assert.ok(stages, `${CI} no longer declares a stage list this test can read`);
  const order = [...stages[1].matchAll(/- (\w+)/g)].map((m) => m[1]);

  const publish = order.indexOf('publish');
  const deploy = order.indexOf('deploy');
  assert.notEqual(publish, -1, 'no publish stage');
  assert.notEqual(deploy, -1, 'no deploy stage');
  assert.ok(
    publish < deploy,
    `stages are ${order.join(' → ')}: deploying before publishing puts the site ahead of the package it describes`,
  );
});

test('the site deploys on a release and on the default branch, not one or the other (MV-77)', () => {
  const ci = readFileSync(CI, 'utf8');
  const pages = /^pages:\n([\s\S]*?)(?=\n[a-z#])/m.exec(ci);
  assert.ok(pages, `${CI} no longer declares a pages job this test can read`);

  assert.match(
    pages[1],
    /if: '\$CI_COMMIT_TAG'/,
    'pages does not run on a release: the badge would wait for the next unrelated merge',
  );
  assert.match(
    pages[1],
    /if: '\$CI_COMMIT_BRANCH == \$CI_DEFAULT_BRANCH'/,
    'pages does not run on the default branch: site-only corrections would wait for a release',
  );
});
