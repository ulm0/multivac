# Data model: The rows say what they check

No runtime data. The entities are a finding and its correction direction.

## Finding

| field | values |
| --- | --- |
| claim | the row ID or the document line |
| verdict | `false` · `dead clause` · `true, ceiling unstated` · `accurate` |
| direction | `code moves` · `row moves` · `row gains its limit` · `nothing` |
| evidence | the source line that decided it |

**Direction is decided before the fix, never during it.** The natural reflex on
an audit finding is to correct the prose, and for two of these eight that would
be relaxing an invariant in code — the one direction the constitution forbids.

## Correction direction, by verdict

| verdict | direction | why |
| --- | --- | --- |
| the row states the better behaviour, the code drifted | **code moves** | a row is not softened to describe its own drift |
| the row describes something removed | **row moves** | the clause is withdrawn with a dated note, never silently deleted |
| the row is true, the mechanism is approximate | **row gains its limit** | withdrawing a true claim is as inaccurate as leaving it unqualified |
| the row is accurate | **nothing** | recorded as examined, so it is not re-raised |

## Blind leg

A leg that resolves against text other than the code its row is about. One in
this table: `/add -A/ count=1`, matching a comment that asserts the opposite of
the code.

A blind leg is worse than a missing one. A row with no leg is `unanchored` and
counted as such in every run; a blind leg reports **ok** and is counted as
covered.

Both blind legs found here are re-pointed and then **demonstrated failing** —
because the property that lets a leg be blind is precisely that nobody ever saw
it red.
