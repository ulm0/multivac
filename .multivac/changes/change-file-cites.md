---
slug: change-file-cites
status: open
horizon: next
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-15
    - MV-45
    - MV-80
    - MV-117
  adds:
    - MV-150
  retires: []
claims:
  - id: MV-150
    statement: The change file cites, never restates. A claim is its row's ID; a legacy statement round-trips and is never created; close refuses a claim of no row, an undeclared, retired or unstated row and an added row that is anchored but unclaimed, printing every refusal in one run, and every surface that says close says what close refuses.
---

# The change file cites, never restates

Nothing read a claim's statement, yet every change restated its row there and most of those restatements had drifted from the row they cite.

The `requires:` floor is not set on this branch: an older multivac reads an ID-only claim as absent, so the floor goes into `.multivac/config.yml` with or after the release commit that carries this change, never before it (MV-86; CHANGELOG, Unreleased). Until this brain's own `dist/` is rebuilt from the merged change, its change files keep their legacy `statement:`, this one included.

Walked 2026-09-29 in scratch with this branch's build, `HOME` and `GIT_CONFIG_GLOBAL` isolated, spec-kit 1.0.11, openspec 1.13.2, graphify 0.9.29 and codegraph 1.6.0 (specs/077-change-file-cites/quickstart.md):

- A (speckit, brain==code): `change new` prints `3. claims: [INV-01]`, no `statement` in its output or the scaffold; plan says no `close refuses this`; land prints the unstated line after the armed line and `fix the line close refuses on above`; `verify --strict` rc 1 with the refusing finished line; close rc 1 with the three lines, nothing archived, status unchanged; stated, `close it:` again, close rc 0, archive `claims:` `  - INV-01`, body ending with the speckit citation.
- B (openspec through its CLI): the same sequence around `openspec archive greet --json --yes`; close rc 1, then rc 0 with the archive directory, the merged spec and `openspec/changes/greet` in the printed pathspec.
- C (codegraph, clean twin against the base build at the same path): plan, apply, land, `verify --strict`, close and the verify after it byte-identical once shas are normalised; `change new` 544 → 569 B. Under graphify the unstated walk gives the same rc sequence and the passing close prints the refresh line.
- D (code-less brain, api and web): close prints exactly the three lines, 235 B, rc 1; stated, rc 0.
- E (fresh claude-door brain): the base build keeps `| INV-01 |`; this build prints `released unused reservation: INV-01`.
- F (brain behind its channel): land and close name the pull (`1 commit(s) this checkout lacks`), the read line says `1 behind its own channel origin/main`, the finished line says to state it (the stated ceiling); after `git pull`, close rc 0.
- G (a stray `note:` in a claim): `verify` rc unchanged plus the notice, doors leave nothing stale, `roadmap` lists the change in flight, a code commit on its branch passes the hook; plan and land refuse naming `unknown key "note"`, and close does once its SDD gate is passed (`--no-sdd`), status unchanged.
- H (refusals before close): the orphan named by land and the finished line, close keeping MV-117's text; every defect in one run with exactly two `close refused` lines; `not new; move it to invariants.touches`; a retiring claim refused while active, red on a broken tombstone leg, rc 0 once it holds; `--abandon` refused on a stated own row, rc 0 with the row RESERVED and anchored, the row kept.
- I (the skew): the base build refuses the ID-only change at plan, lists no change in flight and drops `change:wsk2` from `ecosystem.json`; with `requires: ">=0.15.0"` in scratch both builds print the floor line.
- J: 131 change files, 130 identical under the old and new reader, 0 differ, 1 fails under both; text scan 226 IDs against 150 parsed, none of multivac's own only in the scan; the "ended consistent" and retired-example phrases match nothing; `verify --strict` rc 0 with 150 claims anchored; `requires:` untouched.
