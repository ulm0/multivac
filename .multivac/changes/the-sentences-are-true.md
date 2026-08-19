---
slug: the-sentences-are-true
status: open
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-85
  adds:
    - MV-118
  retires: []
claims:
  - id: MV-118
    statement: "Where a sentence and the code disagree, the code moves — unless the sentence is the defect, and which one it is gets decided out loud: the documented exit contract is honoured by every command that reads a config, `doctor` gates on the law validity its own help promises, and no guide sends an operator's work into a block the tool regenerates."
---

# The sentences are true

The last of the audit's false sentences, and this time the direction is mostly
the other one: rather than correcting prose to match the code, the code moves
to honour what was written down, because what was written down is the design.

- **The exit contract is documented and not kept.** `configuration.md` says a
  config that does not load is an environment error and every command that
  reads it exits **2**, with `doors` and `doctor` named as the two exceptions.
  Measured: `verify` and `count` exit 2; `seed` and `repos` exit **1**; and
  `roadmap` exits **0**, having silently done nothing.
- **`doctor` promises an exit it never delivers.** Its own `--help` and the
  reference both say bare `doctor` exits 1 when the config **or law** is
  invalid. It collects the law's anchors with the parse diagnostics thrown
  away, so a law that does not parse reports clean.
- **`session-zero.md` still gives destructive advice.** It tells the interview
  to land its output in the brain door's managed block — the block `doors`
  regenerates from config on every run. The skill was corrected; the guide was
  not, and following it loses the work.
- **MV-85 describes a shape the code left behind.** Its body says `verify` and
  `change` "keep their own correct loops". Both call the shared refusal now,
  and so does `count`.
- **Self-heal, checked and dropped from scope.** The audit recorded that the
  one code path which WRITES the law file was stated by no row. MV-116 states
  it — "self-heal is the one code path that rewrites the law file" — as the
  opening of the row that fenced it, one change earlier. A second row saying
  the same thing is the copy MV-111 exists to prevent.
