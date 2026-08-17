---
slug: the-brain-knows-what-projected-it
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-29
    - MV-85
  adds:
    - MV-86
  retires: []
claims:
  - id: MV-86
    statement: A brain records the version it was deliberately brought to, and a binary that disagrees says so on every run. It never refuses.
---

# A brain knows what projected it

`npm i -g multivac@latest` updates the projector, not the projections. Nothing
re-runs and nothing says anything. The doors, the skill tree, the hook shims and
the harness settings in a brain were written by whatever binary ran `init` there
— possibly a year and four releases ago — and no file records which.

Three problems live under "the user upgraded", and conflating them is how
migration tooling goes wrong:

**(a) Regenerable projections.** Doors, `.claude/skills/`, hook shims, settings
entries. Pure functions of (registry, config). `mvac doors` already fixes them.
The gap is not migration, it is that nobody knows to run it. MV-79 is the live
case: anyone still on 0.1.x carries a shim that resolves `core.hooksPath` wrong,
with the gate disarmed in silence, and their repo has no way to tell them.

**(b) Schema evolution.** A new config key with a default, a renamed one. Needs a
real migration, and a migration needs to know *from which version*.

**(c) Changed meaning.** MV-82: the scanner now reads lines it used to skip. No
file changes; the interpretation of anchors already on disk does. **This cannot
be migrated.** It can only be warned about.

## The cost is not the migration, it is the skew

A brain governs N repos and M developers, each with their own binary. "The user
upgraded" is really "one machine upgraded".

This repo lived it: the global `mvac` ran 0.1.0 for weeks against a brain on
0.2.0, and when MV-82 was enacted that binary reported the row broken — because
under the old scanner the line `export const ANCHOR_LINE = /<!--\s*@anchor\b/;`
**hid itself**. Two people on different versions verifying the same brain do not
disagree about speed. They disagree about what green means.

## The shape

```yaml
# .multivac/config.yml   — a human decision; the tool never writes it
requires: ">=0.3.0"

# .multivac/projected.yml — a machine record; a human never edits it
version: 0.3.0
```

`version` is **not** "whatever binary last touched this". It is "the version this
brain was deliberately brought to". The difference decides the design: if `doors`
restamped on every run, the warning would vanish the moment somebody ran `doors`
for an unrelated reason — going quiet without the upgrade having happened. So the
stamp moves only under an explicit act, and everything else reads it.

Nothing refuses. Three severities, coloured, with the command that fixes each.
`verify` warns on every commit and **never** stamps: it runs inside somebody
else's commit.
