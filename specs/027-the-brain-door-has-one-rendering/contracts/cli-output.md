# Contract: CLI surface and output

No line changes. `init` reports the door exactly as it does today:

```text
init: wrote AGENTS.md — the door; your agent reads it first
init: updated the managed block in AGENTS.md — your content untouched
```

What changes is the file those lines describe.

## The door, after scaffolding

```text
$ mvac init --grapher graphify --quiet .
$ grep -c 'graphify' AGENTS.md
1            # was: 0 — the scaffolded copy never mentioned the graph
$ mvac doors
$ git diff --quiet AGENTS.md && echo "unmoved"
unmoved      # was: the whole managed block rewritten
```
