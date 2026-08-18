# Data Model: The graph is part of the repository

## Per root, at close

| Grapher applies | Artifact | Tracked | Verdict |
|---|---|---|---|
| no | — | — | out of scope |
| unverified adapter | — | — | out of scope |
| yes | absent | — | **MV-90 refuses** — no graph |
| yes | present | yes | satisfied |
| yes | present | no, and ignored | **refused** — the rule is named |
| yes | present | no | **refused** — `git add` is named |

## What is asked of git

One question, read-only: is this path in the index. Asked with the repository's
own git, in the root that owns the artifact. Nothing is written by any path in
this table.
