# Phase 1 — Data model: The gate speaks the channel the harness reads

## Harness event

| Event | What reaches the model | Blocking possible | Projected command |
| --- | --- | --- | --- |
| `SessionStart` | stdout, only on exit 0 | no | `mvac verify 2>&1 \|\| true` |
| `PostToolUse` | stderr, only on exit 2 | yes | `mvac verify >&2 \|\| exit 2` |

## Ownership set

The exact strings multivac may rewrite. Anything else in the file belongs to
somebody else and is never touched.

| String | Why it is ours |
| --- | --- |
| `mvac verify 2>&1 \|\| true` | the session gate |
| `mvac verify >&2 \|\| exit 2` | the edit gate |
| `mvac verify` | every brain projected it before this row; recognising it is the upgrade path |

`mvac verify --strict`, or any hook a user wrote, is **not** in the set.

## Merge outcomes

| Existing entry | After `doors` |
| --- | --- |
| none | this event's command is added |
| the legacy bare command | rewritten in place to this event's command; matcher untouched |
| this event's command | unchanged (idempotent) |
| the other event's command | rewritten to this event's |
| two of ours on one event | both counted; the duplicate notice reports them |
| a foreign hook | untouched, and the gate is added beside it |
