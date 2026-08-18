# Research: A config change needs a change that declares it

## D1 — Created is free, modified is not

**Decision**: the check fires only when the configuration exists in the previous
commit.

**Rationale**: it is also the whole exemption story. The design expected to have
to exempt the tool's own writes and to make that exemption unspoofable; in fact
exactly one path writes the configuration — initialisation, and only when the
file is absent. So the rule reads what the commit *does*, not who claims to have
done it, and there is nothing to forge.

## D2 — Any open change satisfies it

**Decision**: the weak reading, deliberately.

**Rationale**: the strong reading — a change that *names* the configuration —
would need a field the change file does not have, and adding one to make this
check stronger would be a schema change in service of a check rather than of the
work. What the weak reading actually buys is that the edit lands on a branch
with a merge request describing it, which is where a human reads it. The row
states that ceiling rather than implying more.

## D3 — It gates

**Decision**: blocking, in the pre-commit path.

**Rationale**: a reported-only version would be a line nobody acts on, which is
the exact failure the grapher had before it got a gate. Opening a change is one
command, and the thing being protected is the file that decides which repos are
verified at all.

## D4 — The index, never the working tree

**Decision**: read what is staged.

**Rationale**: the index is what is about to be committed. A working-tree read
would refuse a commit for an edit the operator deliberately left unstaged, and
would miss a staged edit made with the file since reverted. The enactment check
made this choice already and for the same reason.

## D5 — Silence unless it applies

**Decision**: nothing is printed when the configuration is untouched, when there
is no previous commit, or outside the brain.

**Rationale**: it runs on every commit. A line on every commit is a line nobody
reads, and this check's whole value is that its output is rare.
