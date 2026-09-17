# Tasks: graph-owned-and-committed
- [x] T001 change apply, worktree, build
- [x] T002 Scope: graphScopes(only), ensureGraphs, installHarness, graphGate, graphTrackedGate, equip, gateSdd and the lifecycle call sites
- [x] T003 land: commitGraph in the ready loop; refusal for ignored and detached
- [x] T004 close: load first, scoped gates, refresh before the recipe, brain graph in the pathspec, sibling recipe, graph-only worktree restored
- [x] T005 Tests: rewrite grapher-refresh (close no longer leaves it floating; sync builds an unnamed repo; new builds nothing there), grapher-gate:287 inverted, new land tests — 3 new tests in grapher-refresh; managed-repos, per-root and binary-lookup moved to `repos sync` where they meant every root
- [x] T006 Door wording, doctor refresh path, site (graphers-and-sdd, composition, commands, running-changes)
- [x] T007 Law MV-134 and notes on MV-50, MV-87, MV-90, MV-103; bite — 9 MV-134 legs and the 7 moved legs on MV-50, MV-87, MV-90 and MV-103 all bite
- [x] T008 Untrack the derived graphify outputs in this repo
- [x] T009 Suites, verify --strict, commit, merge, land, close — 738/738 CI-like and host; verify --strict exit 0
