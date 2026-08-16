# Tasks: The release says what changed

**Input**: Design documents from `specs/002-the-release-says-what-changed/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md)

> Same honesty note as the plan: these tasks were written after the work was
> done, so the boxes below record what happened rather than directing what would
> happen. Every one of them was verified against the tree before being checked.

## Phase 1: The source document

- [X] T001 Write `CHANGELOG.md` at the repo root with an entry per released
      version, newest first, each `## <semver> — <date>` (FR-001)
- [X] T002 Fill the 0.1.1 entry from the archived changes it shipped — MV-71
      (ls-files deduplication and the mid-merge report), MV-69 (every command
      shows its flags), MV-70 (init projects what it declares), MV-28 (aider
      removed rather than kept as an unsupported stub) — each citing its row by
      ID (SC-002)
- [X] T003 Fill the 0.1.0 entry from `changes/the-first-release.md` — first
      release, OIDC publishing on a version tag, the `files` allowlist (MV-68)
      (SC-002)
- [X] T004 State in the file's own preamble that it is the only copy and that
      the site mounts it, citing MV-78

## Phase 2: The second surface

- [X] T005 Add `module.mounts` to `site/hugo.yaml` mounting `../CHANGELOG.md`
      to `content/docs/changelog.md` (FR-002, FR-003)
- [X] T006 Restate the default `content → content` mount beside it, since
      declaring any content mount replaces Hugo's default, and comment why
      (FR-004)
- [X] T007 Build the site and confirm the page renders at `/docs/changelog/`,
      carries `<h1>Changelog`, contains the entries, and is linked from the docs
      navigation — `hugo` exit 0, page present, 7 occurrences of `0.1.1`
      (SC-001)
- [X] T008 Confirm no file exists under `site/content/` for the changelog, so
      there is no second copy to drift (FR-003)

## Phase 3: The checks

- [X] T009 Write `test/invariants/changelog.test.ts` asserting the version
      `package.json` declares has an entry, naming the versions found when it
      does not (FR-005, FR-006, SC-004)
- [X] T010 Assert in the same file that `site/hugo.yaml` still mounts the
      changelog and still restates the default content mount (FR-003, SC-003)
- [X] T011 Assert entries are ordered newest first (FR-001)
- [X] T012 Run the three tests — 3 passed
- [X] T013 Run the full suite — 303 passed, 0 failed, after clearing stale
      `dist-test/` output left by another branch

## Phase 4: The law

- [X] T014 State MV-78 in `.multivac/invariants.md`, replacing the reserved
      placeholder, describing the mount, the entry format and why the declared
      version's entry is a test rather than a leg
- [X] T015 Anchor MV-78 to the two mount lines (`unique`), the entry-format
      regex, and the two test names
- [X] T016 Run `verify --strict` and confirm exit 0 with MV-78 held pending by
      its own open change

## Dependencies

T001–T004 before T005–T008 (nothing to mount otherwise). T005–T006 before T007.
T009–T011 before T012. T014–T015 before T016. Phases 1–3 before Phase 4 only
because the anchors point at files the earlier phases create.

## Not done here

- `change apply` was never run, so no worktree was used and the plan/tasks gate
  never fired. Recorded in the change file as a finding about the lifecycle
  rather than quietly skipped.
- The `<title>` nit from the plan is left as-is, deliberately.
