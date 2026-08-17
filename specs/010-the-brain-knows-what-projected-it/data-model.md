# Data model: A brain knows what projected it

## The two fields

| field | file | owner | written by | read by |
| --- | --- | --- | --- | --- |
| `version` | `.multivac/projected.yml` | tool | `init`, `doors --adopt` | every command |
| `requires` | `.multivac/config.yml` | human | **nobody** — hand-authored | every command |

Nothing else writes either. `verify` in particular writes neither: it runs inside
somebody else's commit and inside hooks.

## Severity

Decided from three inputs — the running version, the record, the floor — and
never from the network.

| record | floor | running | severity |
| --- | --- | --- | --- |
| any | present, running below it | — | **red** |
| absent | absent or satisfied | — | **yellow**, mildest wording |
| ≠ running | absent or satisfied | — | **yellow** |
| = running | absent or satisfied | — | silent |

Red outranks yellow. A brain below the floor *and* out of date says the red
thing, because that is the one that changes what you should do first.

## Notice

| part | why it is not optional |
| --- | --- |
| running version | the reader may not know which binary is on their PATH |
| recorded version | the gap is the point |
| the command | a notice with no action is a nag |
| colour | the operator asked for a call to action, and severity has to be visible before the line is read |

Colour is suppressed exactly where `src/lib/out.ts` already suppresses it —
`NO_COLOR`, or a non-TTY. The line stays complete without it: the words carry
the severity too.

## What the record does not say

That the projection is **intact**. Someone can hand-edit a door and the record
stays as fresh as the day it was written. It is provenance, not integrity —
which version wrote these, never whether they still are what was written.

MV-86 states that limit. A row that let the stronger reading stand would be
claiming more than it checked, in a change whose whole subject is a claim
nobody was checking.
