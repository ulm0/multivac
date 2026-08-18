# Research: A roadmap item is a change that has not started yet

Phase 0. Every decision below was resolved against the existing code; nothing
is carried forward as NEEDS CLARIFICATION.

## D1 — The roadmap is a state on the change file, not a new artifact

**Decision**: add `planned` to the change file's `status` union and keep the
roadmap in `.multivac/changes/`.

**Rationale**: the change file already holds everything a roadmap entry needs —
a slug, a title, prose, and a place in git history. A second artifact would
have to be kept in agreement with the first, and the agreement would fail
silently: whichever list the tool does not read becomes fiction, which is the
exact failure this feature exists to prevent. Promotion becomes a status flip
instead of a translation, so intention and implementation share one document
and one history.

**Alternatives considered**: a `.multivac/roadmap.yml` holding entries that
`change new` consumes — rejected because it makes graduation a copy, and a copy
is where drift starts. A markdown checklist under `docs/` — rejected because
nothing would parse it, so nothing could report on it.

## D2 — `planned` is the word, reused deliberately from the repo vocabulary

**Decision**: name the state `planned`, the same word `REPO_STATUSES` already
uses for a repo declared in a change but not yet branched.

**Rationale**: the meaning is identical at both scopes — declared, not started.
Inventing a second word (`draft`, `queued`, `proposed`) would imply a
distinction that does not exist, and `proposed` is already spoken for by the
invariant row's own lifecycle. The two `status:` keys sit at different depths
in the frontmatter, so the reuse reads as consistency rather than collision.

**Alternatives considered**: `draft` — rejected, it collides with the spec
document's own Draft status. `queued` — rejected, it implies an execution order
the model deliberately does not have.

## D3 — Non-blocking falls out of an existing comparison, and must be pinned anyway

**Decision**: rely on `openChangeClaims` skipping any change whose status is not
`open` (`src/commands/verify.ts`), and pin that behaviour with a dedicated test
and an anchor leg on MV-89.

**Rationale**: the scan already reads `if (change.status !== 'open') continue`,
so a planned change contributes neither a pending claim nor a landed repo, and
`finishedChanges` can therefore never name it. The property the spec calls for
is satisfied by code that already exists — but it is satisfied by an
inequality, not by an intention, and an unintended pass is one refactor away
from becoming an unintended fail. The row states the rule and the test holds
the line; the code stays as it is.

**Alternatives considered**: an explicit `status === 'planned'` skip added
beside the existing one — rejected as a second place to be wrong about the same
question.

## D4 — `roadmap` is a top-level command, not a `change` subcommand

**Decision**: register `roadmap` in `src/commands/index.ts` alongside `change`,
with a bare listing form and an `add <slug> "<title>"` form.

**Rationale**: `change <sub> <slug>` reads as operations on one change that has
started. The roadmap is a view across many changes that have not. Nesting it
would put `change roadmap` next to `change close`, which suggests it is a step
in the lifecycle rather than the shelf the lifecycle draws from.

**Alternatives considered**: `change list --planned` — rejected because the
roadmap is the primary noun here, not a filter on a listing that does not exist.

## D5 — The horizon is three buckets and nothing else

**Decision**: `horizon: now | next | later`, optional in the file, defaulting to
`later` when the recording command is given none, refused when it holds any
other value.

**Rationale**: three buckets carry the only ordering information a roadmap
reliably has. Dates invite a promise the tool cannot keep and nobody updates;
estimates and priority numbers invite argument about the number instead of the
work. Defaulting to `later` means nothing becomes urgent by omission — the
operator has to say so.

The field is written to the frontmatter only when set, so no existing change
file grows a `horizon: null` line on its next rewrite.

**Alternatives considered**: a free-text milestone name — rejected, it becomes
a de facto date. An integer rank — rejected, it makes every insertion a
renumbering.

## D6 — Reservation stays at `change new`, and promotion is where it happens

**Decision**: `roadmap add` reserves no invariant id. `change new` reserves one
whether it scaffolds a new file or promotes a planned one, inside the same law
lock it already takes.

**Rationale**: ids are permanent and never reused (Principle III). An id spent
on an intention that never becomes work is a hole in the table that no later
change can fill. Reserving at promotion also keeps the lock discipline exactly
as it is: the dirty check, the reservation and the bookkeeping commit stay in
one critical section, so a concurrent run waits rather than reading a
half-written table.

`roadmap add` touches only the change file, never the law table, so it needs no
law lock at all — which is also why it is safe to run while another change is
mid-flight.

**Alternatives considered**: reserving at `roadmap add` so the id can be cited
in the roadmap entry — rejected on the hole-in-the-table argument. Reserving
lazily at `change plan` — rejected, it moves an existing behaviour for no gain
and would break every message that already names the reserved id at open.
