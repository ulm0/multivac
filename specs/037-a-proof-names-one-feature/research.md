# Phase 0 — Research: A proof names one feature

## Measurement 1 — what the separator actually bought

`artifactHit` builds a regex from the wildcard segment: `*` becomes `.*`. So
`specs/*-expire/` is `^.*-expire$`, and:

| directory | `^.*-expire$` | `^[0-9]+-expire$` |
| --- | --- | --- |
| `030-points-expire` | **matches** | no |
| `031-expire` | matches | matches |
| `012-expire-dates` | no | no |

MV-110 narrowed `*<slug>*` to `*-<slug>`, which ended the SUBSTRING match —
`gate-b` is no longer proved by `001-gate-b-login`. The TAIL match survived,
and MV-110's row claimed otherwise.

**Decision**: delete `*` from the artifact language and add `<n>`, one run of
digits.

**Rationale**: the wildcard is the defect, not its position. The directory name
is unknowable in advance but its SHAPE is not — spec-kit numbers, openspec
dates — and `[0-9]+` cannot cross the `-`, which is exactly the property that
kills a tail match.

**Alternatives considered**: make `*` not match the separator (rejected —
changes glob semantics for one call site, and leaves a wildcard in a language
that does not need one); match the segment structure after the fact, requiring
the prefix to hold no separator (rejected — the same rule expressed twice, once
in the pattern and once in a check beside it); record the resolved directory at
`change new` and read it back (rejected — invents state, and the project's line
is that the artifact IS the proof rather than a pointer to it).

Verified in node after the change: `<n>-expire` rejects `030-points-expire` and
accepts `031-expire`; `<n>-<n>-<n>-gate-a` accepts `2026-08-15-gate-a`; `a*b`
compiles to `^a\*b$` and matches only the literal.

## Measurement 2 — the silent shadow

The probe returned on the first `readdir` hit, sorted. With two matching
directories the older one wins by name, and nothing on screen says which was
read.

**Decision**: return every hit; both gate loops refuse when there is more than
one, naming them and the root.

**Rationale**: choosing silently is the failure this project is built against.
The refusal is the gate's to make, not the probe's — so the probe reports and
the caller decides, which is also what lets the ledger gate use the same rule.

## Measurement 3 — what the token must not break

- `withSlug` replaces only `<slug>`, so `<n>` survives interpolation.
- `change` validates a slug as `[a-z0-9][a-z0-9._-]*`, so a slug cannot contain
  `<` or `>` and cannot forge the token.
- The escape class gains `*` and `?` so a future literal star is escaped rather
  than silently meaningful, and the escape runs BEFORE the token substitution.
- opsx's `openspec/changes/<slug>/proposal.md` has no token and takes the
  literal path, unchanged.

## Constitution and law

- **MV-110** — amended: the ceiling it stated as open is closed here, and the
  sentence that overclaimed is already corrected on main.
- **MV-56** — the SDD gate's refusal names what it wanted and where it looked.
  Kept; the clash refusal follows the same shape.
- **Principle V** — adapters are data. The artifact stays a declared string;
  only its language changed.
