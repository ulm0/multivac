# Tasks: A consumer is mounted before it is gated

**Feature**: `specs/052-mount-before-gate/` | **Change**: `mount-before-gate` | **Row**: MV-127

Implementation happens in the change worktree at
`.multivac/worktrees/mount-before-gate/brain` after `multivac change apply`. Tests are
written before the behaviour they describe: this repo's suite is the only proof that
`verify`'s exit matrix did not move.

## Phase 1: Setup

- [X] T001 Run `multivac change apply mount-before-gate` and work in `.multivac/worktrees/mount-before-gate/brain`; symlink `node_modules` from the main checkout so `pnpm run build` and `node --test` run there
- [X] T002 Add a test helper that runs a block with `protocol.file.allow=always` set through `GIT_CONFIG_COUNT`/`GIT_CONFIG_KEY_0`/`GIT_CONFIG_VALUE_0` in `process.env`, restoring it after, in `test/helpers/fixture.ts` — the suite must not read or write host git config — done in `test/repos/mount.test.ts` as `withLocalSubmodules`, not in the shared fixture: it has one user, and a helper in `fixture.ts` would be scaffolding for later

## Phase 2: Foundational

- [X] T003 Add `brainUrl?: string` to `Config` in `src/types.ts`, documenting that it is hand-authored and never derived
- [X] T004 Parse `brain_url` in `src/lib/config.ts`: add it to the top-level `refuseUnknown` list, read it with `optString`, and refuse a whitespace-only value
- [X] T005 [P] Add `gitlinkInIndex(repo, path)` to `src/lib/git.ts` — `git ls-files -s -- <path>`, returning the sha of a `160000` entry or null
- [X] T006 [P] Add `submoduleAdd(repo, url, path)` to `src/lib/git.ts` — `git submodule add <url> <path>` through the existing argument-vector runner, never a shell, never with `-c protocol.file.allow`
- [X] T007 [P] Export `hasProjectedDoor(dir)` from `src/hooks/install.ts`, reading `.multivac/hooks/pre-commit` then `pre-push` and asking the existing `isOurShim`; absent or unreadable is false

## Phase 3: User Story 1 — a repo multivac cannot judge does not block its commits (P1)

**Goal**: `verify` in a door without a reachable brain warns and exits 0; everything else
keeps its exit code.

**Independent test**: `node --test test/verify/consumer.test.ts` — the new cases pass and
every existing case in that file is untouched.

- [X] T008 [US1] Write failing tests in `test/verify/consumer.test.ts`: (a) a checkout with a multivac-written `pre-commit` shim, no config, no mount → exit 0 and a warning naming the repo unverified and `multivac repos sync`; (b) the same checkout with the shim replaced by a foreign hook → exit 2 and today's `run multivac init .`; (c) a checkout with no `.multivac/` at all → exit 2, message byte-identical to today's
- [X] T009 [US1] Write a failing test that a checkout with a stale mount (`.brain` present, not a brain) still exits 2 with the submodule-update message, door or no door
- [X] T010 [US1] Implement the branch in `src/commands/verify.ts`: after `findMount` and `findStaleMount` both come back empty, ask `hasProjectedDoor`; if true, warn with the wording in `contracts/cli.md` and return 0
- [X] T011 [US1] Run the whole `test/verify/` directory and confirm no existing expectation changed

## Phase 4: User Story 3 — the brain's URL is declared, never guessed (P1)

**Goal**: `brain_url` exists, is refused when misspelled, is suggested but never written
as a declaration by `init`.

**Independent test**: `node --test test/init/ test/cli/` plus the config tests.

- [X] T012 [US3] Write failing tests: `brain_url: <value>` loads into `cfg.brainUrl`; `brain_ur1:` is refused as an unknown key; a whitespace-only value is refused
- [X] T013 [US3] Write a failing test that `renderConfig` emits `brain_url` commented out, carrying the detected origin, and that loading the config it produced leaves `brainUrl` undefined
- [X] T014 [US3] Implement the `init` side in `src/commands/init.ts`: detect the brain's origin offline, write the commented line with it, and write the same line with no value and a note when there is no origin

## Phase 5: User Story 2 — the tool creates the mount it gates on (P1)

**Goal**: `repos sync` mounts, stages, never commits, skips what it must not write in,
and survives a second run.

**Independent test**: `node --test test/repos/` in a scratch ecosystem with local-path
URLs.

- [X] T015 [US2] Write failing tests in `test/repos/mount.test.ts` for the state table in `data-model.md`: missing → added and staged with `A .brain` and `A .gitmodules` and no new commit; already in HEAD → left alone; staged only → reported as staged, not re-added; `managed: false` → skipped by reason; shallow → skipped by reason; the brain entry → no line
- [X] T016 [US2] Write a failing test that a second `repos sync` immediately after the first neither fails nor re-adds — the case git answers with `fatal: '.brain' already exists in the index`
- [X] T017 [US2] Write a failing test that a `.brain` directory which is already a clone of the brain is adopted into the index with the declared URL, not the clone's own origin, and with no network
- [X] T018 [US2] Write a failing test that a `.brain` directory which is not a git repo produces a quoted failure naming the repo, that the remaining repos still sync, and that the exit is 1
- [X] T019 [US2] Write a failing test that with `brain_url` undeclared nothing is mounted, the message names the key and the file and says multivac will not guess it, and the exit is 0
- [X] T020 [US2] Implement the mount pass in `src/commands/repos.ts`: resolve the state per declared repo using `readOnly`, `entry.isBrain`, `pathExists`, `lsTreeGitlink` and the new `gitlinkInIndex`; call `submoduleAdd` only in the `missing` state; emit the lines from `contracts/cli.md`
- [X] T021 [US2] Quote a mount failure through `quoteFailure` (MV-123) and set exit 1 without aborting the loop

## Phase 6: User Story 4 — the fix is named by the tool that can perform it (P2)

- [X] T022 [P] [US4] Update the pins line in `src/commands/doctor.ts`: `no brain mount at <mount> — run \`multivac repos sync\` to add it`, plus the new staged-not-committed value; test it in `test/doors/` or `test/cli/` as that file's neighbours are tested — pins test in `test/doctor/doctor.test.ts`, plus a staged-not-committed case
- [X] T023 [P] [US4] Add the `mounts` report line to `src/commands/doors.ts` for declared, writable, cloned repos with no mount, with a test asserting `doors` still makes no network call
- [X] T024 [P] [US4] Update the consumer door in `src/doors/consumer.ts` to name `multivac repos sync` before the raw git command, and update the door snapshot tests

## Phase 7: Law

- [X] T025 Replace the reserved MV-127 row in `.multivac/invariants.md` with its statement, keeping it `proposed` — only a human enacts it (MV-81)
- [X] T026 Write MV-127's legs: `unique` on the mount call site, on the `brain_url` read and on the consumer exit branch; `each` on the surfaces that report a missing mount; `absent` on the retired advice strings that name a bare `git submodule add` as the only fix; and run `mvac verify` to confirm the legs read pending, not broken-by-accident — 15 legs; every one read pending, not broken, while the row is declared by this open change
- [X] T027 Bite each leg: break the anchored line in a scratch copy with the row temporarily activated, confirm `verify` fails, and restore — a leg that cannot fail is not a leg — bitten 2026-09-16 in a scratch copy with the row active and the open change removed: 16 breaking edits, 16 failures under `verify --strict` (the `unique` legs report and exit 0 without `--strict`, by design; CI runs `--strict`)

## Phase 8: Documentation

- [X] T028 [P] Document `brain_url` in `site/content/docs/reference/configuration.md` and correct the `mount` entry, which currently presents the gitlink as a manual step
- [X] T029 [P] Update the guide page that describes adding a repo to an ecosystem so the sequence is declare → `repos sync` → commit the mount, with no hand-written git command
- [X] T030 [P] Update `site/content/docs/reference/` wherever `verify`'s exit codes are tabulated, so the door-without-a-brain case is listed
- [X] T031 [P] Add the 0.12.0 entry to `CHANGELOG.md` naming MV-127, what changed for someone upgrading, and the measured drift that motivated it — NOT done here, deliberately: this repository writes each CHANGELOG entry at release time, and MV-120 has the entry name the rows made active; MV-127 is proposed until a human enacts it. Carried to the next release
- [X] T032 Confirm no page under `site/content/` names an MV ID (MV-126's rule), and that the changelog keeps its IDs

## Phase 9: Verification and landing

- [X] T033 `pnpm run build && mvac verify --strict && node --test` in the worktree — the full suite, not a subset
- [X] T034 Walk `specs/052-mount-before-gate/quickstart.md` end to end in a scratch ecosystem with an isolated `HOME`, and record any step whose output differs from what the contract says — walked with the hook shim reaching this build through `PATH`; all nine steps matched. The quickstart itself was wrong at step 1 (an appended second `repos:` key is invalid YAML) and was corrected
- [X] T035 Adversarial review of the diff against `contracts/cli.md` and against MV-127's statement: every sentence of the row must be true of the shipped code, and every claim in the changelog must be measured — found and fixed two gaps: (1) a shim installed `alongside` a hooksPath the repo already claimed lives outside `.multivac/hooks`, so the door predicate missed it and such a repo still exited 2; (2) a mount holding files that are not a brain was "filled" with `update --init`, which checks out the recorded commit over it — now reported and left alone. Both have tests
- [X] T036 Commit on the change branch, merge with `--no-ff`, `multivac change land mount-before-gate --landed brain` — `bd7e484` feature and `3a44b34` graph refresh on the branch, merged `--no-ff` as `04ed81f`, and `change land --landed brain` recorded
- [X] T037 `multivac change close mount-before-gate`, then walk `.multivac/ritual.md` — closed by the `change close` this commit precedes; the ritual is walked in the session that ran it
- [X] T038 Report to the user what remains theirs: enacting MV-127 and MV-126, committing the staged mounts in the four repos measured in `research.md` — reported in the closing message of that session

## Dependencies

- Phase 2 blocks everything: T004 gates Phase 5, T005–T007 gate Phases 3 and 5.
- Phase 3 (US1) is independent of Phases 4 and 5 and ships value alone — it is the MVP.
- Phase 4 (US3) blocks Phase 5 (US2): the mount pass has no URL without it.
- Phase 6 (US4) depends on nothing but reads better after Phase 5.
- Phase 7 depends on the code being in its final shape; a leg anchored to a line that
  then moves is a leg that never bit.

## Parallel opportunities

- T005, T006, T007 — three files, no shared state.
- T022, T023, T024 — three surfaces, three test files.
- T028 through T031 — separate documents.

## MVP

Phase 3 alone. It unblocks every repo that is locked out today, and it is the half of the
change that needs no new configuration.

## Phase 10: Convergence

Added at the ecosystem owner's request during implementation (2026-09-16): `repos sync`
is a reconciliation, not a one-time setup step.

- [X] T039 Run the mount pass for every declared repo on disk on every `repos sync`, not only for a repo just cloned, in `src/commands/repos.ts` per FR-005a (missing)
- [X] T040 Fill a gitlink whose checkout is empty with `git submodule update --init -- <mount>`, and test it in `test/repos/mount.test.ts` per FR-005b (missing)
- [X] T041 Report a recorded submodule url that is not `brain_url`, with the `set-url` that would change it, and never rewrite it; test it in `test/repos/mount.test.ts` per FR-005c (missing)
- [X] T042 Quote a failed mount by cause without repeating the absolute path the key already names, in `src/commands/repos.ts` per contracts/cli.md (partial)
- [X] T043 Give the submodule checkout in `test/repos/mount.test.ts` its own git identity before committing there, per Constitution IV (contradicts) — CI (!129, pipeline 2855702138) failed with `git … .brain commit` exit 128: a fresh clone has none of the identity its parent repo was given, and the CI container cannot invent one from the hostname the way macOS does. Reproduced locally with an isolated `HOME` carrying `user.useConfigOnly = true`; green there and against the host afterwards
