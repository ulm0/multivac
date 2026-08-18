# Research: The brain door has one rendering

## D1 — The projected rendering wins; the scaffolded copy is deleted

**Decision**: `init` calls `renderBrainDoor`; `DOOR_BODY` and the SDD-line
assembly beside it are removed.

**Rationale**: `renderBrainDoor` is the maintained one. It gained the graph
block (MV-90) and the ecosystem repo list; the copy in `init` gained neither,
which is the drift measured here. Keeping both and syncing them is the state
this change exists to leave.

**Alternatives considered**: keep `DOOR_BODY` for the empty case and project
later — rejected, that IS the current behaviour and it is what an agent reads
first. Extract a third shared helper — rejected, there is already a function
that renders this document.

## D2 — `init` reads the config it just wrote

**Decision**: after the config branch, `init` loads the config and renders from
it.

**Rationale**: MV-101 says the door names what the config declares. Reading the
config at the point of rendering is that rule, expressed once. On a first run
the config was written moments earlier from the flags, so the read returns what
the flags declared — the same answer, arrived at by the rule rather than beside
it.

## D3 — MV-101 is amended, and its anchors move

**Decision**: MV-101 keeps its rule, loses the paragraph that re-argues MV-91,
and re-anchors onto the surviving code.

**Rationale**: its `unique` legs name an expression this change deletes, so
leaving them would break a live claim; its `absent` leg still holds and stays.
The trimmed paragraph explained why the case is reported rather than refused,
which MV-91's row already says in the same words — prose that costs the next
reader twice for one rule.

## D4 — The test is byte equality, this time for real

**Decision**: scaffold, snapshot, project, compare the whole managed block.

**Rationale**: MV-101's test had to compare the adapter alone, because the
bodies genuinely differed. After this change the strong assertion is available
and it is the one that states the rule: one document, one rendering.
