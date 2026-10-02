# Implementation Plan: release-badge-moves-at-tag

## Summary
- **ci.yml `pages`.** A gate step after checkout: `deploy=true` on a tag; on the default branch, `deploy=true` only when `refs/tags/v$(package.json version)` exists. Hugo setup, build, configure, upload and deploy carry `if: steps.gate.outputs.deploy == 'true'`. The job comment says why: Pages keys a deployment by its commit.
- **Law.** MV-77 gets a dated note and a leg on the gate step.
- **Test.** test/invariants/site-deploy.test.ts gains one test: every pages step after the gate is conditioned on its output, and the gate reads the tag of package.json's version.

## Constitution Check
- **I.** The rule is cited by ID (MV-77) in the workflow comment and the test title; the reserved id is released at close.
- **III.** MV-77's note is written before the workflow edit.
