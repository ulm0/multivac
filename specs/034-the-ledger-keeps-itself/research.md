# Phase 0 — Research: The ledger keeps itself

## Measurement 1 — the substring glob

`src/adapters/registry.ts` declares four artifacts as `specs/*<slug>*/…`, and
`artifactHit` turns each `*` into `.*`. The registry's own note, two hundred
lines below, says *the feature directory is `specs/<NNN>-<short-name>/` … so the
gates match the slug as a suffix.* The code and its note disagree.

In this repository `specs/` holds sixteen long kebab-case directories, so a
short slug matching one of them by accident is ordinary rather than contrived.

**Decision**: `specs/*-<slug>/…` — the separator is part of the match.

**Rationale**: it is the shape spec-kit produces, the shape the note claims, and
including the `-` stops `expire` being satisfied by `030-points-expire`.

**Alternatives considered**: exact `specs/<NNN>-<slug>/` (rejected — the number
is spec-kit's and multivac must not predict it); resolve through a recorded
path written at `change new` (rejected — invents state, and the artifact is the
proof, not a pointer to it).

## Measurement 2 — what the lifecycle leaves behind

`commitBookkeeping`'s docstring: *everything the lifecycle writes into the brain
— the declaration file, the reserved law row, a status bump — is committed by
the lifecycle … Nothing is left floating.*

- `cmdLand` calls `saveChange` and never calls `commitBookkeeping`.
- `cmdClose` prints a commit whose paths omit the law file, while
  `archiveChange` calls `repointLawLinks` on every close.
- `test/change/lifecycle-polish.test.ts` works around the first with
  `git add -A` — the sweep the docs forbid `close` itself to suggest.

**Decision**: commit the land bump; include the law path in close's printed
commit; make the test run the command that is printed.

**Rationale**: a test that sweeps the tree cannot see an uncommitted write, so
it was the thing keeping the defect invisible.

## Measurement 3 — the tracker flags

`gh issue edit --help` lists `--add-label` and `--remove-label`. There is no
`--label`. `glab issue update` does take `--label`. `updateIssue` sends
`--label` to both, so every GitHub update fails — and the failure is caught and
printed as *not found in the tracker*, which is a different fact from *the flag
does not exist*.

**Decision**: the flag becomes a registry field, because it differs per vendor
and adapters are data (Principle V). The failure is reported with the tool's own
message.

**Rationale**: putting the difference in code would be dispatching on a name,
which Principle V forbids by name.

**Alternatives considered**: send both flags (rejected — one of them always
fails); drop labels for GitHub (rejected — the status label is what the sync is
for).

**Ceiling**: `--add-label` adds without removing the previous status label, so a
GitHub issue accumulates `mvac:open`, `mvac:landed`. Removing the old one needs
the vendor's remove flag and a decision about which labels multivac may take
away; it is stated in the row rather than done here.

## Constitution and law

- **MV-46** — two changes at once do not collide. Amended: the archive is part
  of what a slug collides with.
- **Principle V** — adapters are data. The label flag joins the entry.
- **Constitution IV** — no dependency added.
