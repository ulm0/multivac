---
slug: init-says-what-it-ignored
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-70
  adds:
    - MV-91
  retires: []
claims:
  - id: MV-91
    statement: Re-running init on a brain that already has a config never silently disagrees with it — a flag naming a different adapter is refused with the disagreement named, and every re-run says which of its arguments the existing config already answered.
---

# init says what it ignored

`multivac init --sdd opsx .` on a brain whose config says `sdd: speckit`
prints one line — `config.yml kept — edit it directly` — and then writes a
door that says:

    Features gate through the `opsx` SDD, in that tool's OWN flow:

The config still says speckit. The door now says opsx. Nothing said they
disagree, and the door is the file the agent reads first.

Measured, not reasoned about: `init --sdd speckit --grapher graphify` in a
scratch repo, then `init --sdd opsx --grapher codegraph` in the same one.
Config unchanged, door changed.

**Why it happens.** `init` reads the adapter as `f.sdd ?? config.sdd` — the
flag first. On a first run that is right, because the flag is what wrote the
config a moment earlier. On a re-run the config is authoritative and the flag
is a request the command has already decided not to honour. Two lines apart,
the same value means two different things.

**Everything else about a re-run is already correct**, which is worth saying
because it is the part people fear: the config is kept, the law table, the
ritual, the changes directory and the .gitignore are all write-if-missing, the
door is a managed block that leaves surrounding content alone, an older layout
is migrated rather than clobbered, and the hooks install without displacing the
repo's own. Nothing is appended twice and nothing is destroyed. The defect is
narrow and it is about honesty, not damage.

**What MV-85 already decided.** A command refuses what it cannot honour rather
than proceeding as if you had not passed it. `doctor --sttrict` ran a
non-strict report and exited 0, and that row exists because a gate that says it
checked, having checked nothing, is the failure this project is about. A flag
that silently loses to a file is the same shape.

So: a flag that disagrees with the existing config is refused, naming both
values and the two ways forward — edit the config, or drop the flag. A flag
that agrees is accepted in silence, because there is nothing to report. And a
re-run says which arguments the config already answered, so nobody has to
diff their command line against a file to find out what happened.
