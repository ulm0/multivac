# Phase 0 — Research: The sentences are true

## Measurement 1 — the exit contract

`configuration.md`: *A config that does not load is an environment error, not a
failed check. Every command that reads it exits **2** … `doors` and `doctor`
are the two exceptions and exit 1.*

Against a brain whose `config.yml` is `repos: [not a map`:

| command | documented | actual |
| --- | ---: | ---: |
| `verify` | 2 | 2 |
| `count` | 2 | 2 |
| `seed` | 2 | **1** |
| `repos` | 2 | **1** |
| `roadmap` | 2 | **0** |
| `doors` | 1 | 1 |
| `doctor` | 1 | 1 |

**Decision**: the code moves. `seed`, `repos` and `roadmap` catch `ConfigError`
and exit 2.

**Rationale**: the documented rule is coherent — an environment error is not a
failed check, and a script needs to tell them apart — and `roadmap`'s exit 0 is
indefensible on any reading: it reports a sync that did not happen.

## Measurement 2 — doctor's own promise

`doctor --help`: *exit 0 even when degraded; exit 1 only when the config/law is
invalid.* `doctorReport` calls `collectBrainAnchors(brain).then(r => r.anchors,
() => [])` — the diagnostics are discarded, so a law that does not parse
reports clean.

**Decision**: keep the diagnostics and gate on them.

**Rationale**: `doctor` already reads the law; honouring its own sentence is
keeping a value it currently throws away, not new machinery. Retracting the
sentence was the alternative, and it is worse: a diagnosis tool that will not
diagnose the law is a smaller tool for no reason.

## Measurement 3 — the destructive guide

`session-zero.md`: *Output lands as: the loop and boundary list in the brain
door's managed block.* `doors` regenerates that block whole from the config on
every run. The skill's `interview.md` was corrected in an earlier change; the
guide says the same thing and was not.

## Measurement 4 — two rows that describe the past

MV-85's body: *`verify` and `change` … keep their own correct loops.* Both call
`undeclared` now, and `count` joined them.

And searching the corpus for the rule about the tool editing its own law finds
self-heal mentioned only inside three other rows' asides. The one code path
that WRITES the law file is stated by nothing.

## Constitution and law

- **Philosophy** — *a paraphrase ages silently*. This is the third pass, and
  the last of the audit's list.
- **MV-85** — amended to describe the code that exists.
- **MV-111** — an amendment that retires a sentence ships a tombstone. Applied
  where a phrase is retired here.
