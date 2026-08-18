# Research: The graph is part of the repository

## D1 — Refuse, never stage

**Decision**: the gate refuses and prints the command; multivac never runs it.

**Rationale**: MV-50 carries an `absent` leg over `src/adapters/refresh.ts` for
`git`, on purpose: a refresher that touches the index turns a background
convenience into something that edits your commit. Staging on the user's behalf
would also be indistinguishable, in a diff, from the user having chosen it.

## D2 — The check lives outside the refresh module

**Decision**: a new `src/adapters/tracked.ts`, called from the same place the
graph gate is called.

**Rationale**: MV-50's absent leg is scoped to `refresh.ts`. Putting a git call
there would break a live claim to save a file; putting it beside it costs one
module and states the boundary in the file layout, which is where the next
reader looks.

## D3 — Untracked and ignored are two messages

**Decision**: report them separately.

**Rationale**: `git add` fixes the first and does nothing visible for the
second — `git add` on an ignored path exits non-zero with a hint most people
never read, and `git add -f` is the wrong advice because the rule is the thing
that is wrong. A gate that names the wrong fix costs more than a gate that says
nothing.

## D4 — The artifact, not the directory

**Decision**: require the adapter's declared artifact to be tracked. Say so.

**Rationale**: the tool writes more than the artifact — caches, dated exports,
generated HTML — and this repository's own `.gitignore` excludes exactly those.
A rule that demanded the whole directory would be a rule its author already
breaks. The artifact is what MV-90 asks about, what the door points at, and what
a fresh clone needs.

## D5 — Missing beats untracked

**Decision**: a root with no artifact is MV-90's refusal, and this gate stays
quiet about it.

**Rationale**: two refusals for one root, one of them derived from the other, is
noise. The build-where-missing pass runs first anyway, so the ordinary case is
that the artifact exists by the time this question is asked.
