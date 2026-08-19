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

An earlier reading of this table had `roadmap` at **0**. That was the probe:
the loop passed `roadmap sync` as ONE argument, because zsh does not word-split
an unquoted parameter — the same artefact MV-85 records. Bare `roadmap` does
exit 0, and correctly: it lists from `.multivac/changes/` and never opens the
config.

**Decision**: the code moves, and in ONE place — the dispatcher, which is where
all four already pass. It reads the error's type instead of mapping every
rejection to 1.

**Rationale**: the documented rule is coherent — an environment error is not a
failed check, and a script needs to tell them apart. Four catches in four
commands would be four chances to forget the fifth, which is how MV-85
happened; `doors` and `doctor` keep their own because their answer differs.

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

## Measurement 4 — one row that describes the past, and one that does not

MV-85's body: *`verify` and `change` … keep their own correct loops.* Both call
`undeclared` now, and `count` joined them.

The audit also recorded that no row states self-heal. Re-checked against the
corpus: MV-116 opens with *self-heal is the one code path that rewrites the law
file*, landed one change earlier. Dropped from scope — a second row saying it
is the copy MV-111 exists to prevent.

## Constitution and law

- **Philosophy** — *a paraphrase ages silently*. This is the third pass, and
  the last of the audit's list.
- **MV-85** — amended to describe the code that exists.
- **MV-111** — an amendment that retires a sentence ships a tombstone. Applied
  where a phrase is retired here.
