# Tasks: door-integration-map
- [X] T001 change apply, worktree, build
- [X] T002 Tests in test/change/door-integration.test.ts: cursor-only → cursor-agent; claude+cursor → init claude + integration install cursor-agent; claude+opencode → gap, no --force; agents-only → claude; windsurf → gap; opsx agents+claude → openspec init --tools agents,claude --no-animation . with opt-out env
- [X] T003 Update tests that pinned opsx as "no recorded init" (test/change/sdd-gates.test.ts, test/init/equip.test.ts) — six tests: two sdd-gates gap tests became opsx init tests, the vendor-state partial line names the real init, doctor names it, the equip test requires openspec, and binary-lookup's walk has opsx installed because it tests the lookup
- [X] T004 Registry: SddScaffold fields, speckit map + fallback, opsx scaffold
- [X] T005 sdd.ts scaffoldCommands + runScaffold loop; doctor uses it
- [X] T006 Law: MV-130 row and legs, MV-75 leg + note, MV-128 note (opsx now has an init); bite — 11 MV-130 legs plus the moved MV-75 leg, 12 bites under --strict
- [X] T007 Site: graphers-and-sdd scaffold table and outcomes — also fixed a stray comma change 7 left in the same paragraph, and dropped version literals the site may not carry (MV-84)
- [X] T008 Suites CI-like and host, verify --strict, real run with spec-kit 1.0.7 (cursor door) and openspec 1.13.0 — 719 pass CI-like; real spec-kit 1.0.7: cursor -> [cursor-agent], claude,cursor -> [claude, cursor-agent]; real openspec 1.13.0: init --tools agents,claude wrote config and six skills
- [X] T009 Commit, merge, land, close, MR — merged, landed, closed; MR from close-door-integration-map
