# Contract — what the harness gets back

## Per event

| Event | Command | Green | Red law | Broken config | No binary |
| --- | --- | --- | --- | --- | --- |
| `SessionStart` | `mvac verify 2>&1 \|\| true` | exit 0, quiet | exit 0, findings on stdout | exit 0, error on stdout | exit 0, `not found` on stdout |
| `PostToolUse` | `mvac verify >&2 \|\| exit 2` | exit 0, quiet | exit 2, findings on stderr | exit 2, error on stderr | exit 2, `not found` on stderr |

Exit 0 and silence on green is deliberate on both events: a gate that speaks
when there is nothing to say teaches the reader to stop reading it.

## What is never touched

1. A hook whose command is not in the exact ownership set.
2. Any `matcher` a user wrote — ours is written once, at creation.
3. Any key in `.claude/settings.json` outside the entries we own.

## Invariants of the contract

1. The mapping lives in the projection, not in `verify`: the command is one
   harness's contract, and `verify` serves every harness.
2. Running the projection twice changes nothing.
3. A failure after an edit reaches the model. Silence is reserved for green.
