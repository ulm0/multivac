---
slug: the-door-for-contributors
status: open
repos:
  brain:
    status: planned
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-34
  retires: []
claims:
  - id: MV-34
    statement: "The project's governance is in the repo, not in someone's head: CONTRIBUTING.md and CODE_OF_CONDUCT.md at the root, Contributor Covenant 2.1 with reports routed to a confidential issue in this project, GitLab merge request and issue templates under .gitlab/, and both documents reachable from the README and the site — every command CONTRIBUTING prints is one the binary accepts."
---

# The door for contributors

The tool gates its own repo; the door someone walks in through should be
written down with the same care. Five files, all of them templates GitLab
picks up by convention.

`CONTRIBUTING.md` documents the loop as the binary actually runs it — clone,
`pnpm install`, build, `pnpm test`, `verify --strict`, then the five change
subcommands in the order `close` enforces. A CONTRIBUTING that prints a
command the binary refuses is the same defect as a site that names a flag that
does not exist (MV-29): every command in it was run before it shipped.

`CODE_OF_CONDUCT.md` is Contributor Covenant 2.1 verbatim, with one decision
made: there is no contact address, so reports go through a confidential issue
in this project — the exact path, and where the checkbox is, spelled out. A
reporting channel that does not say how to reach it privately is not a
reporting channel.

`.gitlab/merge_request_templates/Default.md` asks for what the ritual asks
for: what landed, which claims it made true, the landing order if it crosses
repos, and the friction the tool caused on the way. The two issue templates
split the two things outsiders actually bring — a bug, and a harness the
registry does not know yet. The integration template demands a primary source,
because an invented adapter entry is the lie the tool exists to prevent
(MV-28).

The README gains a Contributing line and an honest status: the tool is
dogfooded on itself — this repo is its own brain, its law is gated in CI — and
not yet on a multi-repo ecosystem. The site's documentation index links both
documents rather than restating them; a second copy of a code of conduct is a
copy that goes stale.
