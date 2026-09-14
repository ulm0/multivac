# Data Model: The record matches the release

No runtime data. The entities are records in the repository, the states they
move between, and the legs that hold each state.

## Changelog entry

- **Where**: `CHANGELOG.md`, one `## <semver> — <date>` section per release,
  newest first (MV-78).
- **Fields**: version, date, groups (**Changed** / **Fixed** / **Added**) and
  bullets. Each bullet has a bold lead sentence and names its ID(s) as `(MV-x)`.
- **Rule** (MV-120): the entry names every row that reached `active` since the
  previous release, unless an earlier entry already named it. 0.1.0 is the
  baseline.
- **This change**:
  - 0.10.0: from 1 bullet (MV-50) to MV-50 plus MV-105 … MV-119.
  - 0.2.0: gains MV-72.

## Law row

- **Where**: `.multivac/invariants.md`, as
  `| ID | statement | authority | state | date | source |` followed by anchor
  lines.
- **Amendment note**: inline in the statement, `**Amended <date> by MV-x**: …`. A
  retired clause stays visible and is marked WITHDRAWN.
- **States**:
  - `open/proposed` (RESERVED by `change new`)
  - → `specified/proposed` (rule stated, legs added, this change)
  - → `specified/active` (a human, in its own commit; MV-81)
- **This change**:
  - MV-14: the lead cites MV-92, and a note is added.
  - MV-111: a WITHDRAWN note is added.
  - MV-120: RESERVED → stated, with 4 legs; the state stays `proposed`.

## Leg

- **Shape**: `<!-- @anchor MV-x brain:<glob> [!exclude] /<ERE>/ [absent|count=N|…] -->`
- **Semantics used here**:
  - `absent`: no matching line in any file under the glob.
  - `count=N`: exactly N matching lines. Anchor-comment lines are skipped.
- **Gating**: blocking at commit once the row is `active`. While the row is
  `proposed`, a broken leg reads pending and never blocks.

## Sync Impact Report / constitution version

- **Where**: HTML comments prepended to `.specify/memory/constitution.md`, newest
  first, and the footer `**Version**: X | **Ratified**: … | **Last Amended**: …`.
- **Rule**: the footer version equals the newest report's target version.
- **This change**: the 2.0.1 → 2.0.2 report is prepended; the footer changes from
  2.0.0 / 2026-08-18 to 2.0.2 / 2026-09-13.

## Relationships

- MV-120 → amends MV-14 and MV-111 (declared in the change's `invariants.touches`).
- MV-120 → pins `CHANGELOG.md`? No leg. That is a ceiling, stated in the row.
- MV-120 → forbids the retired phrases in documents, MV-14's old lead, and the
  stale footer values.
