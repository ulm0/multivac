# Phase 0 — Research: A paraphrase ages silently

## Measurement 1 — the retired sentence, counted

Searching this repository for the dependency count as prose, after MV-104
amended MV-02 to three:

| Where | Says |
| --- | --- |
| `.multivac/invariants.md` MV-02 | three — amended, dated, with the reason |
| `.specify/memory/constitution.md` Engineering Constraints | three — amended |
| `.specify/memory/constitution.md` Principle IV | **two** |
| `.multivac/invariants.md` MV-85 body | **two** |
| `.multivac/invariants.md` MV-86 body | **a third … a design change** |
| `CONTRIBUTING.md` | **two** |
| `site/content/docs/reference/configuration.md` | **two** |
| `test/invariants/deps.test.ts` header | **two** |

Six restatements, none anchored, all written before the amendment and none
touched by it. The constitution is the sharpest: its own Sync Impact Report says
principles I–V are *unchanged in wording and in force*, which is true of the
wording and false of the force.

**Decision**: correct all six, and add the mechanism that makes the next one
self-detecting.

**Rationale**: correcting six strings is a tidy; the class returns at the next
amendment without FR-008.

## Measurement 2 — rows that outlived their meaning

- **MV-68** claims *a tag runs that job and nothing else*. MV-77 made pages run
  on tags too, and MV-68's `count=2` leg pins the sentence into `.gitlab-ci.yml`
  — an anchor actively holding a false claim in place.
- **MV-84**'s bolded headline states the one-version rule its own body repealed.
  The headline is what gets cited.
- **MV-82** says *the five positive legs are what bite*; the row carries six.
- **MV-31** claims the reference documents the whole surface, and checks a
  frozen nine-command, eleven-key alternation — `requires`, `tracker`,
  `grapher_auto` and `role` are pinned by nothing.
- **MV-01**'s no-network tombstone covers three files while `verify`, `doctor`
  and `doors` import five directories it does not cover.

**Decision**: the corpus's own WITHDRAWN convention for the clauses, the leg
retargeted for MV-68, honest counts for MV-82, a broader glob for MV-01, and
MV-31's claim narrowed to what it checks.

**Rationale**: MV-29 and MV-31 already show the convention. Deleting a clause
loses the history of why it was ever true.

## Measurement 3 — the skill, which is copied everywhere

`skills/multivac/references/change.md` teaches `api -> web` edges; the parser
takes `landing_order` as a list of stages and its error never mentions edges.
`interview.md` directs session-zero output INTO the managed block, which the
next `doors` run regenerates from config. `change.md` says `change apply`
re-projects doors; no such call exists.

**Decision**: rewrite all three to what the tool does.

**Rationale**: `doors` mirrors this tree into every consumer repo, and agents
follow it literally. The interview instruction causes content loss by being
obeyed.

## Measurement 4 — the first minutes

`init` writes everything untracked. `change new` refuses while its bookkeeping
paths are unclean, and calls an untracked file *"carries uncommitted edits"*.
So the next command after `init` always refuses in a fresh brain, with the
wrong word for why.

**Decision**: name the commit in `init`'s closing report, and say *untracked or
modified*.

**Rationale**: the printed command is already correct; only the sentence and
the missing step are wrong.

## Constitution and law

- **Philosophy** — *a paraphrase ages silently* is the project's own line; this
  change applies it to the project.
- **MV-29, MV-31** — the WITHDRAWN convention, reused rather than invented.
- **Constitution III** — law moves before code, and the constitution itself is
  amended in place with its version bumped.
