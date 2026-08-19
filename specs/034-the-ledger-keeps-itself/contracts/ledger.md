# Contract — what the ledger promises

## After any lifecycle command

The bookkeeping paths — the change file, the law file — are either committed by
the command, or named in a command the operator can paste. Never dirty and
unmentioned, and never swept with `git add -A`.

## What a gate accepts as proof

| Step | Proof | Matched as |
| --- | --- | --- |
| `plan` | `specs/*-<slug>/spec.md` | directory ending in the slug |
| `apply` | `specs/*-<slug>/plan.md`, `tasks.md` | same |
| `close` | the tool's own ledger | same |

Another change's artifacts are never proof of this change's step.

## What the tracker reports

| Outcome | Line says |
| --- | --- |
| updated | `#N up to date` |
| closed | `#N closed` |
| the call failed | what failed, in the tool's own words |
| the issue is gone | that it was not found — and no second issue is created |

A tracker line never claims an outcome the tool did not report.
