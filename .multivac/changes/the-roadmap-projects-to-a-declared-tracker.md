---
slug: the-roadmap-projects-to-a-declared-tracker
status: planned
horizon: next
repos: {}
landing_order: []
invariants:
  touches: []
  adds: []
  retires: []
claims: []
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
