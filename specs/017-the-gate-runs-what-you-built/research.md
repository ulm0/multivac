# Research: The gate runs the code in this tree

## D1 — Most specific runner wins

**Decision**: repository build, then declared dependency, then machine install.

**Rationale**: the current order is the exact inverse and its comment states it
without justifying it — most likely because `command -v mvac` is the cheapest
probe and a global install is the common case. Speed is the wrong axis. A
repository that builds or declares a multivac has *stated* which one governs it;
a global install is whatever the machine happens to have, including a laptop
that has not updated in a year. Enforcing an older law table against a repo that
pinned something newer is the failure, and it is silent.

Measured here: committing in this repository printed `this brain was brought to
0.7.0 and you are running 0.5.0`. The version notice worked; the runner choice
did not.

**Alternatives considered**: keeping the order and warning on mismatch —
rejected, that reports a wrong choice rather than making the right one, and the
notice already exists and was ignored for exactly as long as it took to notice
it. Probing versions and picking the newest — rejected: newer is not the
question, *declared* is, and it would put a version comparison in a shell script.

## D2 — The build clears its output; the test proves the property, not the script

**Decision**: clear both output directories before compiling, and add a test
asserting no compiled test exists without a source.

**Rationale**: `tsc` never deletes output for a source that has gone, so
`dist-test/` accumulates whatever any branch ever compiled. Both failure
directions are real and the silent one is worse: a deleted test keeps passing
until someone notices its file is missing.

Testing the property beats asserting the script's text. A string assertion about
`package.json` passes while the behaviour is broken by a renamed script, a
different entry point, or a build run some other way; the property fails
whatever the cause.

**Alternatives considered**: `tsc --build --clean` — rejected, it depends on
build mode and incremental state the projects do not use. A `rimraf`-style
dependency — rejected on FR-006 and on the two-dependency invariant; the runtime
does the same work in one line.

## D3 — No announcement of which runner was chosen

**Decision**: the shim does not print its choice on a successful run.

**Rationale**: it fires on every commit, and a line nobody needs on every commit
is a line people stop reading. The two cases that matter already speak: nothing
runnable prints the INACTIVE report, and a version mismatch is exactly what
MV-86's notice is for. After the reorder that notice stops firing spuriously,
which is the point.

**Alternatives considered**: naming the runner always — rejected as noise on the
hot path. Naming it only on fallback — rejected as a rule with no clear
boundary: falling through to a declared dependency is normal, not a fallback.
