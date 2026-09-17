# Tasks: repos-check
- [X] T001 change apply, worktree, build
- [X] T002 Tests test/repos/check.test.ts: all good exit 0; absent/not-a-repo/inside/unborn/remote-mismatch exit 1 named; sdd missing, state file not in HEAD, template and empty constitution, graph not in HEAD exit 1; managed:false clone only; no vendor on PATH; invalid config exit 2
- [X] T003 Tests: plan refuses a named present-but-not-cloned repo; doctor names an empty constitution empty
- [X] T004 normUrl to git.ts; repo-state.ts; reposCheck; doctor; refuseUncloned — cloneState asks no shallow question: MV-125 keeps that in readOnly, and verify said so
- [X] T005 Law MV-132 with legs; bite — 8 legs, 8 bites under --strict
- [X] T006 Site: commands.md repos check section with the CI recipe
- [X] T007 Suites, verify --strict, real run on this brain — 731 pass CI-like; on this brain repos check exits 0: speckit installed and committed, constitution written, graphify built and committed
- [X] T008 Commit, merge into integration, land, close
