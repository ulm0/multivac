# Contract — MV-120's legs

| # | Leg | Forbids / pins | At HEAD before | After |
| --- | --- | --- | --- | --- |
| 1 | `brain:{*.md,site/content/**,skills/**,.claude/skills/**} !CHANGELOG.md /(look for\|try) `?mvac`?( on `?PATH`?)? first\|`?mvac`? on `?PATH`?,? (then )?`?npx --no-install/ absent` | the inverted runner order in any root document, site page or skill | 4 lines (DESIGN.md, install.md ×2, hooks.md) | 0 |
| 2 | `brain:.multivac/invariants.md /runnable multivac in order — `mvac` on PATH/ absent` | MV-14's retired lead | 1 | 0 |
| 3 | `brain:.multivac/invariants.md /Amended 2026-09-13 by MV-120/ count=2` | the two amendment notes (MV-14, MV-111) | 0 | 2 |
| 4 | `brain:.specify/memory/constitution.md /^\*\*Version\*\*: 2\.0\.[01] \|/ absent` | a footer stuck on 2.0.0 or 2.0.1 | 1 | 0 |

## Must not match

These lines are correct or historical, and no leg may match them:

- `CHANGELOG.md`'s 0.8.0 entry, which records that the shim used to try `mvac` first.
- `.multivac/changes/archive/**` and `specs/**`, which are history.
- MV-14's amendment note, which quotes the retired order.
- Lines that name `mvac` on PATH as the last rung: hooks.md `**`mvac` on PATH** —`,
  the shim comment "then mvac on PATH.", and commands.md "(mvac on PATH)".
- Sync Impact Report lines, which carry no `**`.

## What no leg holds

These gaps are stated in MV-120's ceilings:

- Nothing ties a future release's entry to the rows it made law.
- Whether a later row changes an earlier one; `touches` stays a declaration.
- Equality between the footer and the newest report; only the measured stale
  values are forbidden.
