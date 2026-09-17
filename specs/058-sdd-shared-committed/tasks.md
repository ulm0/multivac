# Tasks: sdd-shared-committed
- [x] T001 change apply, worktree, build
- [x] T002 Tests test/change/carry.test.ts: untracked specs/<n>-<slug> carried onto the branch and gone from the checkout, merge of the branch clean; untracked .specify/** carried; nothing dirty → no commit; modified tracked artifact refused before the bump; ignored shared file refused; feature.json written in the worktree — 4 tests; .specify/** carried in the first; feature.json asserted there
- [x] T003 src/change/carry.ts and the two calls in cmdApply
- [x] T004 Law MV-133 with legs; bite — 7 legs, all bite
- [x] T005 Site: running-changes guide and commands.md apply
- [x] T006 Suites, verify --strict, dogfood on this change's own apply is not possible (old code); dogfood on the next change — 735/735 CI-like and host; verify --strict exit 0
- [x] T007 Commit, merge into integration, land, close
