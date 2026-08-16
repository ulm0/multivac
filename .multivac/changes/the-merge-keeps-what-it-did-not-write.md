---
slug: the-merge-keeps-what-it-did-not-write
status: open
repos:
  brain:
    status: planned
landing_order:
  - - brain
invariants:
  touches:
    - MV-52
  adds:
    - MV-74
  retires: []
claims:
  - id: MV-74
    statement: "The managed settings merge owns only the entry it wrote: a foreign entry whose command merely mentions the marker is left alone, hooks array and matcher intact."
---

# The merge keeps what it did not write

MV-52 says the post-edit refresh is "one more entry in the same managed
`.claude/settings.json` merge that preserves foreign keys". It preserves foreign
*keys*. It does not preserve foreign *entries*.

`ourEntry` claims any hook entry with a command that merely **contains** the
marker `mvac verify`, and the update branch then does
`mine.hooks = [{type: 'command', command}]` and `mine.matcher = matcher` —
replacing the whole array and rewriting the matcher. Reproduced against `dist/`:

```
before  { matcher: 'Bash',
          hooks: [{command: 'mvac verify --strict'}, {command: 'my-own-linter'}] }
after   { matcher: 'Edit|Write|MultiEdit',
          hooks: [{command: 'mvac verify'}] }
```

The `--strict`, the second command and the `Bash` matcher are gone. Nothing
warned. The same marker string is shared by `SessionStart` and `PostToolUse`, so
both events carry the hazard.

Second-order: the claim is `Array.find`, so it stops at the foreign entry it
just ate, and multivac's real entry survives further down the list. The tree
ends with **two** `mvac verify` entries and `verify` runs twice on every edit.

## What identity should be

A marker that is a substring of somebody else's command is not identity. The
entry multivac owns should be recognisable by something multivac writes and
nobody else would type by accident, and an update should replace only the hook
object carrying it — leaving sibling commands, and the matcher, alone.

MV-52 is touched, not weakened: the merge it describes is the merge that must
exist. What changes is that "preserves foreign keys" becomes true of entries as
well, which is what every reader already believed it said.

## Migration

Repos that already ran `doors` may carry the duplicate entry this bug created.
Whether the fix removes a duplicate it recognises, or reports it and lets a
human decide, is a real question for the spec — silently deleting a hook entry
is how this defect started.
