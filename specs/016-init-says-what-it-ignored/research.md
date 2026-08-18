# Research: init says what it ignored

## D1 — The config wins on a re-run, and the flag is refused rather than dropped

**Decision**: when a config exists and a flag names a different adapter, refuse.

**Rationale**: MV-85 already decided the shape — a command refuses what it does
not declare rather than proceeding as if you had not passed it — and that row
exists because `doctor --sttrict` ran a non-strict report and exited 0. A flag
that silently loses to a file is the same failure with a different surface.
Refusing beats warning here because the artifact being written is the door: an
agent reads it long before a human re-reads a warning that scrolled past.

**Alternatives considered**: let the flag rewrite the config — rejected, that
lets one command silently relax a declaration the law depends on, outside the
change lifecycle that exists to make such edits visible. Warn and continue —
rejected on the door argument above.

## D2 — The refusal writes nothing, which decides where the check goes

**Decision**: the comparison runs before the first write, not beside the door.

**Rationale**: `init` writes in a sequence — gitignore, config, door, law,
ritual, changes dir, hooks, projection. A check placed at the door leaves
everything before it already written, so a refused run is a half-run. The check
belongs immediately after the config is read and before anything is created.

## D3 — Agreement is silent; an unanswered flag is reported

**Decision**: a flag matching the config prints nothing. A flag naming an
adapter where the config declares none is reported, not refused.

**Rationale**: agreement is not an event and the output is already long. The
declares-none case is genuinely different: nothing disagrees, so refusing would
be wrong, but the flag still does not take effect — the config is never
rewritten — and silently dropping it is exactly the defect being fixed.

## D4 — One refusal for all disagreements

**Decision**: collect every disagreeing adapter and refuse once.

**Rationale**: the same rule the graph gate follows one change earlier: nobody
should re-run a command to discover the second half of the same problem.

## D5 — First-run behaviour is untouched

**Decision**: with no config, flags stay authoritative.

**Rationale**: on a first run the flag IS what writes the config, so
`flag ?? config` is correct there and the two never disagree. Changing it would
break `init --sdd speckit` on an empty directory, which is the command's
primary use.
