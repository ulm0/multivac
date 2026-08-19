# Phase 0 — Research: The gate speaks the channel the harness reads

## Measurement 1 — what each command actually delivers

Run with a stub `mvac` on a constructed PATH that prints one line to stdout,
one to stderr, and exits 1 — the shape of a red `verify`:

| projected command | exit | stdout | stderr |
| --- | ---: | --- | --- |
| `mvac verify` (today) | 1 | findings | warnings |
| `mvac verify 2>&1 \|\| true` | 0 | findings + warnings | — |
| `mvac verify >&2 \|\| exit 2` | 2 | — | findings + warnings |

And with **no** `mvac` on PATH at all, the post-edit form still exits 2 with
`command not found` on stderr, so a gate whose binary has gone refuses instead
of waving through.

**Decision**: one command per event — `2>&1 || true` at `SessionStart`,
`>&2 || exit 2` at `PostToolUse`.

**Rationale**: Claude Code feeds the model only exit-0 stdout at session start
and only exit-2 stderr after a tool call. Those are opposite channels, so one
command cannot serve both. `verify` stays harness-agnostic; the mapping lives
in the module whose whole job is this harness's contract.

**Alternatives considered**: a `verify --hook` mode (rejected — it is a new
declared CLI surface, with docs and refusal wiring, and it would need TWO modes
because the events map oppositely, baking a foreign harness's contract into the
gate itself); hook JSON output with `{"decision":"block"}` (rejected — the same
effect as exit 2 with strictly more machinery); blocking at session start
(rejected — the contract has no blocking there, and a gate that could would
lock a session out of the repair it was opened to make).

## Measurement 2 — why every failure maps to exit 2 after an edit

`verify` exits 2 for a `ConfigError`, 1 for a blocking finding, 0 for green.
`|| exit 2` collapses 1 and 2 and 127 into the one exit the harness returns to
the model. After an agent's edit each of those is the agent's to see: a red
law, a config the edit just broke, a binary that has gone. A gate whose binary
is missing must refuse rather than pass — that is the opposite of the shim's
rule, and deliberately: the shim protects a human's commit and degrades to a
warning, while this reports to the machine that just made the change.

## Measurement 3 — the upgrade path

`ownsVerify` is exact-string identity (MV-74: *a substring of somebody else's
command is not identity*). Every brain alive carries the bare `mvac verify`.
If the new strings alone were ours, the merge would treat the existing entry as
foreign, append the gate beside it, and then report a duplicate — a mess
multivac made about itself.

**Decision**: ownership is the three strings multivac has ever written — the
two gates and the bare engine.

**Rationale**: identity stays exact (`mvac verify --strict` is still not ours),
the existing in-place rewrite does the upgrade, it is idempotent, and it never
expires: a brain untouched for a year upgrades on its next `doors`.

**Alternatives considered**: a one-shot migration (rejected — code and state
for a string comparison); version-stamping the entries (rejected — same).

## Constitution and law

- **MV-74** — a substring of somebody else's command is not identity. Kept:
  the set is exact strings, not a pattern.
- **MV-86** — enforcement degrades, never locks anyone out. Honoured where the
  contract allows blocking at all: session start cannot block by design.
- **Constitution IV** — no dependency, no network; the change is three strings
  and a predicate.
