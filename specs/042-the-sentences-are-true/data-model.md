# Phase 1 — Data model: The sentences are true

## Exit codes on an unloadable config

| Command | Documented | Was | Is |
| --- | ---: | ---: | ---: |
| `verify`, `count` | 2 | 2 | 2 |
| `seed`, `repos` | 2 | **1** | 2 |
| `roadmap` | 2 | **0** | 2 |
| `doors`, `doctor` | 1 | 1 | 1 |

## `doctor`'s exit

| State | Was | Is |
| --- | ---: | ---: |
| everything fine | 0 | 0 |
| degraded (missing tool, stale pin) | 0 | 0 |
| config invalid | 1 | 1 |
| **law does not parse** | **0** | 1, naming the diagnostic |
| `--strict` with a disarmed gate | 1 | 1 |

## Sentences

| Where | Was | Is |
| --- | --- | --- |
| `session-zero.md` | interview output goes in the managed block | outside it, where `doors` does not write |
| MV-85's body | verify and change keep their own loops | they call the shared refusal, and so does count |
| the corpus | self-heal appears only in asides | MV-118 states it |
