---
slug: the-site-speaks-to-users
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-111
  adds:
    - MV-126
  retires: []
claims:
  - id: MV-126
    statement: The documentation site explains behaviour to users in plain words and names no law ID; a rule is stated and cited by ID in the law and in the brain's own records.
---

# The site speaks to users

The documentation site cites the law it was written from. Measured on
2026-09-14 over the 23 tracked pages under `site/content/`:

- 129 IDs on 121 lines of 14 pages. By line: 15 headings, 9 inside code
  blocks, 1 HTML comment, 71 with a trailing "(MV-n)", and 25 sentences built
  on an ID.
- 4 links point at a heading anchor spelled from an ID.
- None of the IDs links to its row. The one ID written as a link,
  `[MV-90](#)`, goes nowhere.

The decision: the site speaks to the people who use multivac. It names no ID
and binds nothing. The IDs stay where a rule binds: the law, the constitution,
change files, specs and the changelog.

- Each sentence loses its ID and keeps the behaviour it described.
- Each heading keeps its words, and every link to it follows the new anchor.
- The dead link now points at the section it meant.

Principle I is amended to say where IDs belong (3.0.0). MV-111 notes that
"everywhere else cites the ID" stops at the site. MV-126 states the rule and
pins it with an `absent` leg on an ID over `site/content/**`.

Out of scope:
- The changelog page, which `site/hugo.yaml` mounts from `CHANGELOG.md`. Its
  IDs stay: MV-120 requires an entry to name the rows it made law, and MV-78
  makes the page that one file rather than a copy that could drop them.
- Maintainer comments in `site/hugo.yaml`, `site/assets/` and `site/layouts/`.
- Everything outside `site/`, including the IDs the tool itself prints.
