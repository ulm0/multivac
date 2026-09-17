# Feature Specification: The documentation tells the flow that ships, end to end

**Feature Branch**: `066-docs-end-to-end` | **Created**: 2026-09-16 | **Status**: Draft

**Input**: The final documentation pass the user asked for on 2026-09-14, run after changes 1 to 17 of the SDD and grapher plan.

## Context: what was measured

Measured on the integration branch, 2026-09-16, after change 17.

1. **The skill's change reference is stale.** It still says the graph refresh covers every declared repo. It says nothing is staged or committed, and that graph output lands only in chore commits. It omits the SDD carry at `apply`, the graph commit at `land`, and the code-in-change gate.
2. **The skill does not know the gate.** Its steady-state rules never say that code lands on a change's branch.
3. **Two pages claim the git hook guarantees nothing false lands.** They are `DESIGN.md` and the concept page. The hook can be skipped. Since MV-137, the merge request pipeline is the reader that binds.
4. **The three-state policy is stale.** Both the reference page and DESIGN still say a declared tool whose binary is absent is "notice, feature off, exit 0". Since MV-128 and MV-129, a command that would run the tool refuses with exit 1. Only `verify`, `doctor` and `doors` stay at exit 0.
5. **The hook directory lists two shims.** DESIGN's ladder and the configuration page's layout both do. There are three.
6. **The getting-started page is stale.** It shows a door that no longer renders, omits `pre-merge-commit`, `projected.yml` and `ecosystem.json`, and never names `repos check`.
7. **`init` names a file it never writes.** It writes the brain door, which names `.multivac/ecosystem.json`, but never writes that file, so `verify` reports it absent on a fresh brain.
8. **`repos` and `doctor` still say "present" from the path alone.** MV-132 left that alignment to this pass.
9. **The README does not say what an SDD and a grapher now bring.**

## Requirements
- **FR-001:** `init` writes `.multivac/ecosystem.json`.
- **FR-002:** `repos` lists each repo as cloned, missing, or not the declared clone, with the fix. `doctor` counts cloned repos and names the others.
- **FR-003:** The skill, its change and verify references, the guides, the concept pages, the reference pages, DESIGN and the README describe the shipped flow: equip, sync and check, session zero, carry, the graph committed at land, code in a change, and the ecosystem graph.
- **FR-004:** The stale sentences above are gone, and `absent` legs keep them gone.
- **FR-005:** The CHANGELOG is written at release, when the rows are enacted (MV-120). This pass does not touch it.
