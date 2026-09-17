# Implementation Plan: ci-code-gate

## Summary
- **`code-in-change.ts`.** `readChange` takes the directory it reads. In range mode, a slug branch whose change is not open at the head is accepted when it is archived at the head and not at the base.
- **`.gitlab-ci.yml`.** Add a `change-gate` job, with rules on `merge_request_event`, `GIT_DEPTH: 0`, install, build, then verify.
- **Law.** New row MV-142, with notes on MV-137 (archived at the head) and MV-77 (a second full-depth clone).
- **Site.** The CI recipe notes the closed-on-branch case.
