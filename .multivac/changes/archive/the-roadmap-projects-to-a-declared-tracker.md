---
slug: the-roadmap-projects-to-a-declared-tracker
status: archived
horizon: next
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-99
  retires: []
claims:
  - id: MV-99
    statement: A declared tracker receives the roadmap as a one-way projection — one issue per change in the brain's own project, identified by the number recorded in the change file, labelled only in multivac's own namespace, and never read back as a source.
---

# Issues and boards from the change files, one way

Project the roadmap to an issue tracker as a declared adapter, the same shape as
`sdd:` and `grapher:` — a root-level `tracker: gitlab|github|none`, with registry
entries whose commands are the vendor's own CLI. No HTTP written here, no new
dependency, no token handling: `glab` and `gh` already solve auth.

Decisions already made, recorded in MV-89 and not to be relitigated:

- the change files are the SOURCE; issues are a projection and never a second
  source. One way. Closing an issue in a forge closes nothing.
- identity is the issue NUMBER in the change file's frontmatter, not a URL: the
  project is derivable from the git remote, the number is not.
- the unit is the user story from the SDD tool's task list — one issue per
  story, assignable and workable in parallel — never one per task. The tasks
  become a live checklist in the issue body, copied verbatim.
- issues live in the brain's own project.
- multivac writes only its own label namespace and never touches a label a
  human added; reconciling the whole set would wipe somebody's triage every run.
- it reaches the network, so it never runs from `verify`, `doctor` or `doors`.

Inspired by the SDD tool's own tasks-to-issues command, and deliberately unlike
it in three ways: that one is GitHub-only in hard code, re-derives its mapping
every run by regex over issue titles — edit a title and it duplicates
everything — and closes nothing, ever.

## Scoped to one unit, and the rest recorded

The design called for one issue per USER STORY, taken from the SDD tool's task
list. That stays the intent and is not built here.

A story-level projection means a second reader of `tasks.md` — a file that
already has exactly one consumer, in the tool that writes it. Adding a second
reader of somebody else's artifact is a coupling worth its own change and its
own row, not a paragraph inside this one.

What lands here is the layer under it, which story issues would need anyway:
the declared adapter, the one-way rule, the identity recorded in the change
file, the label namespace, and the reconciliation. A change gets one issue.
When story issues arrive they hang under it — the same shape a planned change
acquiring a spec already has.
