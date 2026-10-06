# multivac Constitution

## Core Principles

### I. A Claim Nobody Checks Decays (NON-NEGOTIABLE)

Every rule this project states MUST be anchored to the source that makes it
true, and MUST be cited by its ID where rules are kept: the law table and every
record the brain keeps outside the documentation site's own pages. A paraphrase
ages silently; an ID can be verified. Prose that restates a rule without naming
it does not bind, and an unanchored claim is named in `verify`'s output rather
than counted as passing.

The documentation site's own pages, everything under `site/content/`, are not
one of those records; the changelog the site mounts from `CHANGELOG.md` is, and
keeps its IDs. Those pages explain behaviour to the people who use multivac, in
plain words: they name no law ID and bind nothing. A rule changes at its row,
never on a page, and the change that moves a rule moves every page that
explains it.

Rationale: this repo is its own brain. A rule that lives only in someone's
memory is indistinguishable from a rule that was deleted, and the whole tool
exists because that difference matters. An ID is worth its noise only to a
reader who can open the row it names, and the site's reader is using the tool,
not amending its law.

### II. The Tool Never Claims More Than It Checked (NON-NEGOTIABLE)

Where something cannot be proven, multivac MUST say so instead of faking it. A
step that leaves no artifact is declared ungateable **with its reason**, never
gated and never silently passed. A gate that cannot be evaluated refuses rather
than passes. An artifact that is empty, or byte-identical to the template it was
copied from, counts as missing. A finding names the repo, the file and the ref
it was read from, and a stale or unresolvable read says which bytes it judged.
Steps that belong to an agent are printed for the agent to run; multivac MUST
NOT shell out a fake subcommand to simulate them, and the only subprocess it may
spawn on a tool's behalf is that tool's own validator or scaffold.

Rationale: the quietest way this tool could lie is to report green on a machine
that could check nothing. An honest gap is a feature; an invented pass is the
defect the project exists to prevent.

### III. The Law Changes Before The Code

An invariant MUST NOT be relaxed in code. The row changes first — dated, in the
same change that changes the behaviour — and `change close` verifies the rows
the change claims. Invariant IDs are allocated by the tool, never by
hand, and are never renumbered or reused. Retiring is authored, never derived:
the row is marked retired and new `absent` legs are written for the dead
mechanism's identifiers. New claims are filed `proposed`; only a human enacts
one.

Rationale: code that quietly outruns its stated rule turns the law table into
decoration. Ordering the edit the other way is what keeps a citation checkable.

### IV. Deterministic, Offline, Small

`verify`, `doctor` and `doors` MUST make no network calls and MUST invoke no
model; freshness is bought only in an explicit command that says it fetches.
`verify` MUST stay sub-second and enumerate through `git ls-files` rather than
walking the tree, because it runs in a pre-commit hook. Git MUST run through an
argument vector, never a shell. The runtime dependency count is pinned by an
invariant — MV-02 states the number and the names — and the next one is a
design change, not a convenience. Tests MUST NOT depend on host configuration.

Rationale: a gate that is slow gets bypassed, and a gate that reaches the
network fails for reasons that have nothing to do with the code it is judging.

### V. An Invented Integration Is A Lie

Adapters are data, not code: one entry per harness or SDD tool, and the
dispatch is on the entry's kind, never on its name. An entry MUST carry only
what the vendor's own documentation states, or what has been verified by running
the tool — never a value derived from the tool's name. A tool whose contract
cannot be verified is reported UNVERIFIED with the fields to declare, and gets no
entry rather than a guessed one. An entry MUST disclose any network its
automation performs, because that automation runs on someone else's machine.

Rationale: appearing in the supported list is a promise. A missing integration
is an honest gap; an invented one is the exact failure this tool was built to
catch, committed by the tool itself.

## Engineering Constraints

- **English everywhere** — code, comments, docs, commit messages, change files,
  and the site's source and default language. No exceptions
  except the published site, which is also published in Spanish (es-419): its
  Spanish pages translate the English ones, never the reverse.
- **Tests ship with behaviour.** `node:test`, no frameworks, no fixtures beyond
  the shared helpers. If it branches, loops, parses, or touches git, it ships
  with a test. A behaviour nothing would miss if reverted is not pinned.
- **Three runtime dependencies**, `yaml`, `picomatch` and `citty`, with an
  invariant pinning the number. The count is the constraint, not the names: a
  fourth is a change with a row moved before the package, which is how the
  third arrived.
- **Everything multivac creates lives under `.multivac/`**, with the canonical
  door at the repo root as the only exception.
- **The published tarball carries the tool and nothing else**, by allowlist.
  Releases are published by trusted publishing on a version tag, never by a
  long-lived token, and never as a side effect of a merge.
- **Development is pnpm-only**, guarded at preinstall, and that guard MUST NOT
  reach a consumer installing the published package.

## Development Workflow

- Every ecosystem decision enters as a change: `change new → plan → apply →
  land → close`. A change is done when its declared anchors resolve, not when
  it merges.
- Nothing lands on `main` directly. Work happens in the worktree `apply` hands
  back, so two changes in flight never share a checkout.
- `pnpm test` and `verify --strict` MUST be green before a merge request opens,
  and CI re-verifies both.
- The merge request states what landed, the landing order if it crosses repos,
  and every claim the change made true.
- **Friction is a finding.** If the tool fights you while you use it, that is a
  bug report: it becomes a row, a change, or a written backlog line — never a
  workaround nobody sees.
- The ritual in `.multivac/ritual.md` is the closing ceremony no tool can check.
  multivac prints it; walking it is a human obligation.

## Governance

This constitution supersedes convention and preference. Where it and a habit
disagree, the constitution wins until it is amended.

**Amendment procedure.** Amend this file in place, bump the version below by
semantic versioning — MAJOR removes or redefines a principle, MINOR adds one or
materially expands guidance, PATCH clarifies wording. The report
`/speckit.constitution` writes for review is removed before commit; git keeps
the amendment record. An amendment that reflects a change in how the project
actually works MUST land in the same change as that work.

**Compliance.** Principles I–V are enforced by the law table in
`.multivac/invariants.md`: `multivac verify` gates its blocking legs on every
commit where the pre-commit hook and CI run it, and reports the rest; a
principle with no row behind it is aspiration, and adding the row is how a
principle becomes real. This document's own *content* is deliberately never
machine-judged — no tool can decide whether a principle still fits — but its
PRESENCE is gated per MV-76: `change plan` refuses while this file is absent,
unreadable, empty, or still carrying the fill-in tokens spec-kit's template
ships. Its freshness stays a report, per MV-57: a version that never moves
while the law does is a signal to revisit rather than a failing grade.

**Version**: 3.1.0 | **Ratified**: 2026-08-16 | **Last Amended**: 2026-10-06
