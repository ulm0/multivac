# Research: The door says only what the config declares

## D1 — Drop the fallback rather than widen the refusal

**Decision**: `declared?.sdd ?? f.sdd` becomes the config's answer whenever a
config exists. The declares-none case stays a report, never a refusal.

**Rationale**: MV-91 already decided this row. A flag naming an adapter the
config declares none of is *reported with how to make it stick, never refused,
because nothing disagrees* — and a flag that "does not take effect" must then
not take effect anywhere, including in the door written eleven lines later.
Refusing instead would break `init --sdd speckit` on a brain someone is
adopting adapter-by-adapter, which is the case the report exists to serve.

**Alternatives considered**: write the flag into the config so the door becomes
true — rejected, `init` never edits a config it kept (MV-91), and that edit
belongs to the change lifecycle. Leave the door and fix the report to admit the
flag half-worked — rejected, it describes the drift instead of ending it, and
the next `doors` still reverts the file.

## D2 — The one-line fix is the whole fix, because `doors` is already right

**Decision**: touch only the resolution in `init`; `doors` is not changed.

**Rationale**: `doors` reads the config and nothing else, which is what MV-70
says projection means. The two commands disagreed because one of them was
wrong, not because they need reconciling: making `init` read what `doors` reads
is what makes them agree, and it needs no shared helper to say so.

## D3 — The property to test is agreement between the two commands

**Decision**: the regression test runs `init`, then `doors`, and asserts the
door is byte-identical.

**Rationale**: asserting "the door does not contain speckit" tests the symptom
in one direction. Asserting the two commands agree tests the rule, catches the
mirror-image defect where `doors` grows a flag-shaped input, and reads as the
sentence the law states.

## D4 — MV-91 is amended, not contradicted

**Decision**: MV-101 states the rule; MV-91 gains a dated amendment where its
prose called the ordering belt and braces.

**Rationale**: MV-91's own words — *"after the refusal above the two can no
longer disagree, so this is belt and braces"* — are true for the row where the
config declares a value and false for the row where it declares none. The row
is not wrong about its subject; it is silent about one of its own cases, and
Principle III means the row moves before the code does.
