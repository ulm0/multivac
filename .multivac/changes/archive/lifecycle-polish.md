---
slug: lifecycle-polish
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-18
  retires: []
claims:
  - id: MV-18
    statement: "The lifecycle reports what it knows: `plan` checks `invariants.adds` against the law table the way it checks touches and retires; `land` records `--landed` against local evidence — the change branch merged into the default branch — and says `recording without evidence` when it has none; `close` ends by naming the commit that stores the archive."
---

# The lifecycle stops lying: plan, land and close say what is true

Three reporting defects from DOGFOOD-01 (polish 1-3), all in `change.ts`.

**plan** printed `new — add its row before close` for every id in
`invariants.adds`, whether or not the row was already written — the one list
that was never checked against `invariants.md`.

**land** knew exactly one way to land: push and open an MR, then `--landed`
recorded on pure trust. It now looks for the change branch inside the default
branch of each repo and records that as evidence; without it, the record still
happens (a merge can be squashed away) but says so out loud.

**close** renamed the change into `changes/archive/` and stopped, leaving the
tree dirty and the operator guessing. It now prints the commit to make.

Polish 4 (frontmatter round-trip) was settled by `frontmatter-safety`: prose
no longer reflows. The remaining layout is the YAML library's, and the tool
owns it — the scaffold body now says so, so nobody hand-formats against it.
