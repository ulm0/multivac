---
slug: roadmap-is-a-change-not-yet-started
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-89
  retires: []
claims:
  - id: MV-89
    statement: A change may exist before it starts — planned is a change state, and a planned change reserves no invariant id, opens no branch and never counts as unclosed; starting one promotes the file that is already there rather than writing a second one.
---

# A roadmap item is a change that has not started yet

A roadmap is the list of things this ecosystem intends to do. multivac already
keeps that list — it just insists every entry has already started.

`.multivac/changes/<slug>.md` is born `open`: a branch is implied, an invariant
id is reserved, and `verify --strict` counts it against the next release
(MV-80). So the only way to write down an intention is to commit to it today.
The alternative is a second list somewhere else — a wiki page, a tracker, a
notes file — and two lists describing the same work drift apart within a week.
Whichever one is not the one the tool reads becomes fiction.

This change adds one state in front of the existing lifecycle:

    planned → open → landed → closed

`planned` is the same file, in the same directory, with the same schema. It
carries prose and a horizon and nothing else; it has no claims yet, because a
claim is what `change plan` produces once you know the law. Starting the work
is `change new <slug>` on a slug that already exists: the file is promoted, not
replaced, so the intention and the work are one document with one history
rather than two documents that have to be kept in agreement.

Three properties make the state safe rather than decorative:

**It reserves nothing.** An id reserved at `planned` is an id spent on work
that may never happen; the MV space would fill with rows nobody wrote. The
reservation stays where it is today, at `change new`.

**It blocks nothing.** MV-80 refuses to publish while a change is unclosed, and
that refusal is correct — an open change means work in flight. A planned change
means the opposite. If `planned` counted, the first roadmap entry would block
every release for as long as the roadmap has anything left on it, which is
forever. The row states the exclusion so a later reading cannot re-derive it
wrong.

**It is not a gate.** `change new` on a slug with no planned file works exactly
as it does today. Requiring a feature to appear on the roadmap first is
unverifiable intent — the same category as the ritual, which MV-27 keeps
print-only precisely because a ceremony cannot be checked. A gate everyone
learns to skip at three in the morning teaches people to work around the tool.

Projection to a tracker — issues, boards, labels — is deliberately not here.
That reaches the network and needs a declared adapter, and it is worth landing
on its own once the state it projects exists.

## The first entry this roadmap will hold

Recorded here because `roadmap add` does not exist yet, and the constitution
says a finding becomes a row, a change or a written backlog line — never a
workaround nobody sees.

**multivac should urge parallel agents wherever the work already isolates.**
It knows more about that than it says. Today it says nothing.

Four signals it already computes and does not act on:

- sibling stages in `landing_order` — `[[api, web], [mobile]]` states outright
  that api and web have no ordering dependency on each other;
- one worktree per repo, handed back by `change apply` — the isolation that
  makes concurrent edits safe is already built and already named;
- `[P]` markers in the SDD tool's task list, which mean exactly "different
  files, no dependency on incomplete work" and currently have no consumer;
- one phase per user story, which the SDD tool defines as an independently
  testable increment — the same unit chosen for tracker issues.

Two boundaries the row must carry. The same file is never parallel, because
two writers to one file is a lost update, so the line is drawn at isolation
rather than at topic. And the law does not parallelise: every change edits
`.multivac/invariants.md`, ids are reserved one at a time, and landing stages
serialise there by design. The parallelism is in the work, never in the edit
to the law.

It urges and never gates, for MV-27's reason: no artifact proves an agent ran
two things at once, so a gate would be checking a claim it cannot read. The
place to print it is `change apply`, the moment the worktrees exist.

Separate and not to be confused with it: multivac's own per-root work —
scaffolding N repos, building N graphs — is sequential I/O in one process.
That is a different change with a different shape.

## The second entry: the SDD chain runs unattended

The lifecycle prints each SDD step and refuses to move on without the artifact
that proves it ran. What it does not do is tell the agent to keep going. So an
operator who has already decided to follow the flow is asked, once per step, to
say "continue" — six times per feature, for a sequence that was never in doubt.

The fix is in what is printed, not in what is spawned. Principle II is
explicit that steps belonging to an agent are printed for the agent to run and
that multivac must never shell out a fake subcommand to simulate them; there is
no `speckit plan` binary to call, because the step is a prompt. So the change
is: the projected door instructs the agent to run the chain to completion
unattended, and each lifecycle step's output says so in the imperative rather
than describing the step in the third person. Automatic by default, with the
opt-out named on the same line — the inverse of today, where following the flow
is the thing that costs keystrokes.

If a future reading really does want multivac to execute those steps itself,
that is not this entry: it amends Principle II first, in its own change, and
only then touches code.

The rule generalises to all three adapters: SDD, grapher and tracker are
automatic by default, and the operator opts out rather than opting in. The
mechanism differs because the adapters differ. The grapher is a binary and is
already spawned by the lifecycle. The tracker will be a binary too, so it can
be spawned the same way — inside the change lifecycle only, never from
`verify`, `doctor` or `doors`, which MV-01 keeps offline. The SDD tool is the
exception: its steps are prompts with no binary behind them, so the only thing
that can carry them automatically is the door, telling the agent to run the
chain to completion. Same default, same opt-out, three mechanisms.

Chaining is the point: multivac carries the process, so the agent runs the
steps end to end and stops only where there is a real question — an unresolved
clarification marker, an ambiguity the artifacts do not settle — and puts that
question to the operator rather than guessing. Stopping to ask permission to
continue is not a question.
