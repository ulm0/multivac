<!--
Sync Impact Report
Version change: 1.0.0 → 1.0.1 (PATCH — a statement of fact corrected, no
principle added, removed or redefined)
Modified principles: none
Modified sections:
  - Governance / Compliance: this document's presence is no longer only
    reported. MV-76 gates `change plan` on it, and MV-57 was amended in the
    same change so its surviving claim is that the CONTENT is never
    machine-judged. Freshness is still a report and still not a gate.
Templates requiring update: none — no template states this
Follow-up TODOs: none

Sync Impact Report
Version change: none → 1.0.0 (initial ratification)
Modified principles: none — first constitution for this project
Added sections:
  - Core Principles I–V
  - Engineering Constraints
  - Development Workflow
  - Governance
Removed sections: none
Principle sources (derived, not invented):
  I   → philosophy.md "A paraphrase ages silently"; MV-42; skill rule 3
  II  → MV-16, MV-20, MV-51, MV-54, MV-56, MV-63, MV-65, MV-66
  III → CONTRIBUTING.md "What we ask"; MV-26, MV-45, MV-64; retirement procedure
  IV  → MV-01, MV-02, MV-03, MV-04, MV-13, MV-24; CONTRIBUTING.md "Sub-second verify"
  V   → MV-28, MV-59, MV-61, MV-62; CONTRIBUTING.md "Adding a harness, a grapher or an SDD tool"
Follow-up TODOs: none — no placeholder was deferred
-->

# multivac Constitution

## Core Principles

### I. A Claim Nobody Checks Decays (NON-NEGOTIABLE)

Every rule this project states MUST be anchored to the source that makes it
true, and MUST be cited by its ID. A paraphrase ages silently; an ID can be
verified. Prose that restates a rule without naming it does not bind, and an
unanchored claim is named in `verify`'s output rather than counted as passing.

Rationale: this repo is its own brain. A rule that lives only in someone's
memory is indistinguishable from a rule that was deleted, and the whole tool
exists because that difference matters.

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
same change that changes the behaviour — and `change close` verifies that law
and code ended consistent. Invariant IDs are allocated by the tool, never by
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
argument vector, never a shell. The runtime dependency count is two; a third is
a design change, not a convenience. Tests MUST NOT depend on host configuration.

Rationale: a gate that is slow gets bypassed, and a gate that reaches the
network fails for reasons that have nothing to do with the code it is judging.

### V. An Invented Integration Is A Lie

Adapters are data, not code: one entry per harness, grapher or SDD tool, and the
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

- **English everywhere** — code, comments, docs, the site, commit messages,
  change files. No exceptions.
- **Tests ship with behaviour.** `node:test`, no frameworks, no fixtures beyond
  the shared helpers. If it branches, loops, parses, or touches git, it ships
  with a test. A behaviour nothing would miss if reverted is not pinned.
- **Two runtime dependencies**, `yaml` and `picomatch`, with an invariant
  pinning the number.
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
materially expands guidance, PATCH clarifies wording — and prepend a Sync Impact
Report recording the change. An amendment that reflects a change in how the
project actually works MUST land in the same change as that work.

**Compliance.** Principles I–V are enforced by the law table in
`.multivac/invariants.md` and checked by `multivac verify` on every commit; a
principle with no row behind it is aspiration, and adding the row is how a
principle becomes real. This document's own *content* is deliberately never
machine-judged — no tool can decide whether a principle still fits — but its
PRESENCE is gated per MV-76: `change plan` refuses while this file is absent,
unreadable, empty, or still carrying the fill-in tokens spec-kit's template
ships. Its freshness stays a report, per MV-57: a version that never moves
while the law does is a signal to revisit rather than a failing grade.

**Version**: 1.0.1 | **Ratified**: 2026-08-16 | **Last Amended**: 2026-08-16
