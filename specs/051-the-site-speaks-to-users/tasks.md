---

description: "Task list for the-site-speaks-to-users"
---

# Tasks: The site speaks to users

**Input**: `specs/051-the-site-speaks-to-users/`

**Where**: the checkout `change apply the-site-speaks-to-users` prints (branch
`the-site-speaks-to-users`). In a scratch clone, where apply would run vendor
scaffolds, work on `main`. The decisions are in research.md: R1 the
constitution, R2 the note, R3 the row and legs, R4 the legs on touched lines,
R5 quoted output, R6 headings and links, R8 what the review corrected.

**Every rewrite**: keeps the behaviour, limit or reason the ID accompanied;
adds no claim; spells no version string (MV-84) and no retired phrase (MV-111,
MV-118, MV-120 … MV-125); keeps the phrase a leg in R4 matches.

## Phase 1: Setup

- [X] T001 Baseline: build, `verify --strict` (0 blocking), the suite (680 pass). `multivac count` gives 125 for `brain:site/content/** /mv-[0-9]+/i` and 1 for `brain:site/content/** /\]\(#\)/`
- [X] T002 `node dist/cli.js change apply the-site-speaks-to-users`, or `main` in a scratch clone (see above). Link `node_modules` if it is missing

## Phase 2: Foundational — the law moves first (US3, Principle III)

- [X] T003 [US3] .specify/memory/constitution.md: replace Principle I's first paragraph, and add the second paragraph and the rationale sentence, per R1. Prepend R1's Sync Impact Report. Footer: `**Version**: 3.0.0 | **Ratified**: 2026-08-16 | **Last Amended**: 2026-09-14`
- [X] T004 [US3] .multivac/invariants.md: insert R2's note in MV-111, after "…changes the restatement in the same commit."
- [X] T005 [US3] .multivac/invariants.md: replace the RESERVED MV-126 row with R3's statement, `specified | proposed | 2026-09-14`, and add R3's three legs under it, then R8's fourth on Principle I's paragraph. `verify --strict`: 0 blocking, MV-126 pending on legs 1 and 2 only

## Phase 3: US2 — headings and links (P1)

- [X] T006 [US2] Clean the 15 headings in R6: distribution.md:10, invariants.md:29 ("That rule is ungateable, and the law says so"), the-change.md:108, :153, commands.md:202, :338, :657, :885, :996, :1105, :1247, configuration.md:45, graphers-and-sdd.md:328, :350, hooks.md:26
- [X] T007 [US2] Fix the 4 links and the dead one per R6: claims-and-anchors.md:46, running-changes.md:55, graphers-and-sdd.md:337, hooks.md:227, and configuration.md:209 → `[the graph gate](../commands/#the-graph-gate)`. The build showed a bare `commands#…` resolves under the linking page's own URL, so the three links touched here take the `../commands/#…` form hooks.md already uses, and configuration.md:209's second link with them. R8 adds the three links in the-change.md that 404ed and commands.md's `#doctor`

## Phase 4: US1 — sentences and quotes (P1)

- [X] T008 [US1] Quoted output per R5's table: getting-started.md:118, commands.md:309, :310, :321, :642, :696, :1191, configuration.md:297, :509. The enact line elides only `MV-81's check` (`…composed; … reads the index against HEAD`), so what the check reads stays on the page
- [X] T009 [US1] Rewrite R0's 25 sentences built on an ID, page by page. composition.md:27–39 becomes a list led by bold phrases, and its lead-in drops "with IDs". install.md:103–105 names what is kept honest without an ID. graphers-and-sdd.md:468 drops the sentence that named where the version measured is kept; the measurement stays (R8)
- [X] T010 [US1] Delete the 71 trailing citations, including the pairs like `(MV-90, MV-125)`. Where a line re-wraps, only that paragraph moves
- [X] T011 [US1] _index.md:23: the comment says "The site's machine voice, typed." with no ID
- [X] T012 [US1] `multivac count` gives 0 for both of T001's legs. `git diff --stat` touches only the 16 content files, the constitution, invariants.md, the change file, research.md and this ledger

## Phase 5: Polish

- [X] T013 Fidelity pass (SC-007): read every changed hunk against its original. Restore any lost behaviour, limit, scope or qualifier, and remove any added claim
- [X] T014 Hugo build into the scratch `public/`. There, `grep -rlE 'MV-[0-9]+'` lists only the changelog page, the feeds and `en.search-data.json`; no heading `id=` contains `mv-<digits>`; the 5 R6 targets exist as ids in their pages, and every internal link and fragment resolves (SC-002, SC-003)
- [X] T015 Build, `verify --strict` (0 blocking broken, MV-126 `proposed`), the suite (all pass). A leg that breaks is re-pinned or retired with a note on its row (R4)
- [X] T016 Bite in a scratch clone of the branch, with MV-126 active and the change file moved aside. Re-adding `(MV-90)` to hooks.md gives exit 1 on `[absent]`, adding `[x](#)` gives exit 1, a whitespace-only control gives 0, and rewording Principle I's paragraph gives exit 1 on `[unique]` (SC-006)
- [X] T017 Commit by pathspec the 16 content files, the constitution, `.multivac/invariants.md`, the change file, research.md and this ledger. Never `graphify-out/` or `site/public`
- [X] T018 /speckit.converge until Converged (/speckit.analyze runs before implementing, as `change apply` prints)

## After the tasks — the lifecycle, not the ledger

1. Merge into main, then `change land the-site-speaks-to-users --landed brain`.
2. `change close the-site-speaks-to-users`: walk the ritual, then commit the archive.
3. Enacting MV-126 happens alone in its own commit (MV-81), by a human.

## Dependencies

- T001 and T002 precede everything.
- T003–T005 precede any page edit (Principle III).
- T006 precedes T007, because the links follow the new ids.
- T008, T009 and T010 share files, so they run in sequence.
- T012–T016 follow every edit, and T017 follows T015 and T016.

> T018 closed in the real lifecycle (2026-09-14): `change apply` created the worktree on branch `the-site-speaks-to-users`; the reviewed prep commit cherry-picked cleanly with `verify --strict` 0 blocking and the full suite green; the stage-4 verifier and stage-5b spec/plan/tasks fidelity review left no gap — converged.
