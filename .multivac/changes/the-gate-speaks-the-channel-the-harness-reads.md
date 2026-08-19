---
slug: the-gate-speaks-the-channel-the-harness-reads
status: open
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-112
  retires: []
claims:
  - id: MV-112
    statement: "The harness gate speaks the one channel the harness reads back: session-start findings ride exit-0 stdout into the model's context, and a red post-edit run returns as the exit-2 stderr the model must answer. Identity stays exact, and a `doors` re-run upgrades the mute command in place."
---

# The gate speaks the channel the harness reads

The tool's differentiator is that law reaches the agent at the moment of
action. It does not. Both harness entries in `.claude/settings.json` run bare
`mvac verify`, and Claude Code's hook contract feeds the model **only** exit-0
stdout at `SessionStart` and **only** exit-2 stderr at `PostToolUse`. `verify`
writes its findings to stdout and exits 1 when it gates — so on the one
occasion the gate has something to say, neither event delivers a byte of it.
The enforcement ladder's *caught in the same turn* rung fires only when
everything is green.

The projection now writes a command per event, because the two events read
back on opposite channels:

- `SessionStart` — `mvac verify 2>&1 || true`. Findings are the payload, and
  exit-0 stdout is the only thing that carries them into context. Forcing 0 is
  routing, not ignoring: the contract has no blocking at session start, and a
  gate that could block there would lock a session out of the repair it was
  opened to make.
- `PostToolUse` — `mvac verify >&2 || exit 2`. Every failure maps to the one
  exit the harness returns to the model: a red law, the `ConfigError` the edit
  itself just caused, a binary that has gone. The edit is already on disk, so
  the block is a forced read in the same turn, not a revert.

Ownership stays exact — MV-74's rule — and widens to the three strings multivac
has ever written, so a `doors` re-run rewrites the legacy bare command in place
instead of appending a second entry beside it.
