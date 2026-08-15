---
slug: each-scope-verifies-its-own
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-03
    - MV-12
  adds:
    - MV-53
  retires: []
claims:
  - id: MV-53
    statement: "A brain-scoped verify reads each declared repo at its channel ref — `channel:` on the entry, else the global, else `origin/main` — through `git ls-tree` plus one `git cat-file --batch`, never that repo's working tree; the brain's own repo is the exception and is always read as a working tree, because that is the commit the run gates. An unresolvable channel ref falls back to the working tree and says so on that repo's line. A consumer-scoped run is unchanged: the working tree, the content about to be committed there. Every run prints one `read` line per repo naming the ref or the branch and its short sha, and marks a checkout parked off its channel; `--worktree` forces the whole-ecosystem working-tree read; `doctor` reports the branch each repo is parked on and whether it is its channel."
---

# Each scope verifies what it is responsible for

`verify` evaluated every declared repo against its **working tree**. So a
teammate parked on a WIP branch in a sibling repo painted the brain's law red
for a reason that had nothing to do with the ecosystem — and an agent, faced
with a gate that cried wolf, committed with `--no-verify`. The enforcement
floor was stepped over because the tool was wrong, which is the worst way to
lose a gate.

The principle: **the brain verifies the ecosystem as published; a consumer
verifies what it is about to commit.** Two contexts, two scopes, and neither
is a guess — every run names the bytes it read.

Two smaller repairs ride along, both about legibility rather than verdicts: a
repo parked off its channel is now named as such in both `verify` and
`doctor`, instead of being a silent premise behind a mysterious red.

MV-03 and MV-12 are touched, not retired: MV-03 now forbids the shell rather
than the word `spawn` (the channel read streams one `git cat-file --batch`
with an argument vector, exactly as safe as `execFile`), and MV-12's anchor
follows the dedupe key, which is now the directory **and** the ref read in it.
