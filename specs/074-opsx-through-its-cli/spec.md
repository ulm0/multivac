# Feature Specification: opsx runs through its own CLI

**Feature Branch**: `074-opsx-through-its-cli` | **Created**: 2026-09-28 | **Status**: Draft
**Input**: User description: "opsx runs through its own CLI: the agent runs openspec's terminal verbs, no command body is installed, the questions those bodies asked ride on the printed lines, and the archive goes to the human without a flag. A land step is proved in the brain checkout alone, close stages a merged main spec only when it carries the merge, change new and roadmap add refuse a slug openspec refuses, doctor names the bodies an earlier init left, and the opsx note discloses by version what the agent's own calls send and write. Adds MV-147, amends twelve rows (MV-142's note added at review)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The agent runs openspec's own CLI, and nothing installs the bodies (Priority: P1)

An operator declares `sdd: opsx`. Today the scaffold runs `openspec init --tools <keys>`
for the declared doors, which for `[agents, claude]` writes 19 files, 273,400 bytes, of
per-harness command bodies and skills. A change loads four of them, 58,089 bytes of
orchestration around the same CLI, and the lifecycle prints a slash spelling of the
steps that exists for claude and gemini alone: cursor, copilot, opencode and windsurf
spell it otherwise, and agents and codex get a skill only. The propose body tells the
agent to stop after planning, against the chain MV-95 prints; the archive body never
runs `openspec archive` and merges by hand. Driven through openspec's own terminal
verbs, the same two-capability change reads 24,329 bytes of vendor output over 15 calls,
where the bodies path read about 111,000.

**Why this priority**: the largest saving (about 21,000 tokens per change, about 440 per
claude session), a printed step that runs alike in every harness, and the end of a body
that contradicts MV-95.

**Independent Test**: in a fresh `init --sdd opsx` brain with openspec 1.13.2, list what
the scaffold wrote, then walk `change new` to `close` following only the printed lines.

**Acceptance Scenarios**:

1. **Given** a fresh repo, **When** `mvac init . --provider claude --sdd opsx` runs, **Then** the scaffold runs `openspec init --tools none --no-animation .`, `openspec/` holds `config.yaml` and two `.gitkeep`s, and the scaffold writes nothing outside `openspec/`, whatever the doors.
2. **Given** an opsx brain, **When** `change new`, `plan`, `apply` and `land` print their steps, **Then** each is openspec's own terminal verb with the slug in it: `openspec new change <slug> --json` in the brain checkout, then the `status` / `instructions` loop through `tasks.md`; `openspec instructions apply --change <slug> --json` before the first task and after the last; `openspec archive <slug> --json` after the merge, in the brain checkout.
3. **Given** a step carrying a guide, **When** the lifecycle prints the step at its point or a refusal re-prints it, **Then** the guide follows on the next line, indented, and the run-the-chain instruction stays the point's last line.
4. **Given** the brain door, `doctor`'s flow lines and flow.md, **When** they list the opsx steps, **Then** each carries its run and none carries a guide.
5. **Given** flow.md in an opsx brain, **When** it lists the ungateable apply step, **Then** it names `openspec instructions apply --change <slug> --json`.
6. **Given** a whole change walked from `new` to `close`, **When** every subprocess multivac starts is logged, **Then** there are two, the scaffold and the validator, each with the entry's opt-outs.

### User Story 2 - The archive question goes to the human, with no flag printed (Priority: P1)

openspec's archive asks before it merges a change's spec deltas into the main specs.
Under `--json` it never reads stdin: without `--yes` it writes nothing and exits 1, with
`archive_confirmation_required` (message `Updating…`) for a change carrying deltas and
`archive_tasks_incomplete` for open tasks (1.5.0 through 1.13.2), while `--json --yes`
archives over open tasks with exit 0 and no warning. The operator decided (2026-09-25)
that this question is the human's. Two holes were measured beside it: in a brain==code
change, an archive run in the change's worktree after the merge passes `close` and never
reaches the brain checkout; and an archive made without merging lets `close` stage a
human's edit to that capability's main spec.

**Why this priority**: it is the binding decision, and each hole loses a guarantee the
previous change gave.

**Independent Test**: land a two-capability change in a brain==code scratch brain with
openspec 1.13.2, follow `land`'s lines, answer each of the three ways, and close.

**Acceptance Scenarios**:

1. **Given** every stage has landed, **When** `change land` prints the archive step, **Then** the step carries no `--yes`, `--skip-specs` or `--no-validate`, names `archive_confirmation_required` as the human's question and says a flag its `fix` names is never the agent's; the guide under it sends that code, when its message says `Updating`, to the human with the change's deltas from `openspec show <slug> --json --deltas-only`, which writes nothing, and the tool's own answers: yes (`--yes`), archive without merging (`--skip-specs`), or stop.
2. **Given** the human answered yes, **When** `close` runs, **Then** the archive, the moved-from directory and every main spec the archive merged into are staged, and after the printed commit no path of the slug is untracked.
3. **Given** an archive made without merging and a human's uncommitted edit in a capability's main spec, **When** `close` runs, **Then** that spec is named dirty and left out of the commit.
4. **Given** a merged delta whose file had CRLF line endings or trailing spaces, **When** `close` runs, **Then** the main spec openspec merged it into is still staged.
5. **Given** a brain==code change whose archive exists only in the change's worktree, **When** `close` runs, **Then** it refuses, naming that path and saying it never reaches the brain checkout; with the archive in the brain checkout it passes.
6. **Given** `archive_tasks_incomplete`, **When** the agent reads the guide, **Then** it is told to finish the tasks where apply ran or have the human drop them from `tasks.md`, never to tick them to pass; and a `tasks.md` archived open by a human's `--yes` is still refused at `close`, with a reason saying `--yes` archives over its own refusal.
7. **Given** any other error code from the archive, **When** the agent reads the guide, **Then** it is told to fix what the code names and re-run with no flag, never `--no-validate`.

### User Story 3 - The questions the bodies asked ride on the lines (Priority: P2)

With the bodies gone, MV-95's run-the-chain line would have the agent answer questions
openspec 1.13.2's own command bodies gave to the human: whether to create a change whose
scope is ambiguous or that conflicts with a main spec, whether to continue a change of
that name that already exists, and what to do with an unclear task, a design issue the
work reveals, work beyond the spec, a task that would have to be narrowed or dropped, or
a blocker. Whether the agent asked is ungateable; the printed words are the only carrier.

**Why this priority**: it keeps MV-95 whole, but nothing on disk can prove it held.

**Independent Test**: read the four opsx steps and their guides as the lifecycle prints them, then the door's runs alone.

**Acceptance Scenarios**:

1. **Given** `change new`, **When** it prints the step and its guide, **Then** the run names a material ambiguity as the human's question, and the guide says to ask, before the proposal, about any ambiguity that would change scope, observable behaviour, compatibility or acceptance and about any conflict with a main spec, to assume and record the rest, and that `already exists` for a change not opened in this run is the human's question.
2. **Given** `change plan`, **When** it prints the guide, **Then** the guide says design is optional where its instruction says so, tasks are written from `openspec instructions tasks --change <slug> --json` even though status marks them `[-]`, and the `Next:` apply openspec prints is not the agent's before `change apply`.
3. **Given** `change apply`, **When** it prints the step and its guide, **Then** the run says to tick `- [x]` only what is fully built and that scope beyond the spec is the human's question, and the guide adds an unclear task, a design issue the work reveals, a task the agent would narrow, defer or drop, and a blocker, and says openspec's "ready to be archived" belongs to `change land`, after the merge.
4. **Given** `sdd_auto: false`, `--no-sdd`, or a context reset, **When** only the door is read, **Then** each step's run still names the human's question on that step.

### User Story 4 - Brains scaffolded before this change shed the bodies (Priority: P2)

A brain an earlier multivac scaffolded keeps its bodies, the propose body's stop among
them, and pays about 2,300 bytes of listing per claude session until they are removed.
Nothing prints them any more, so the operator must be told they are there and how to
remove them, and removing them must not be judged code.

**Why this priority**: the per-session saving reaches these brains only once the leftovers go.

**Independent Test**: commit a by-hand `openspec init --tools agents,claude --no-animation .` in an opsx brain, run `doctor`, run the removal it prints, commit through the installed hooks, and run `verify --strict`.

**Acceptance Scenarios**:

1. **Given** bodies an earlier init left under any directory an openspec integration writes, a door no longer declared and openspec 1.7.0's `.codex/skills/` included, **When** `doctor` runs, **Then** one line names them, siblings collapsed per parent, with `git rm -r <paths>` and that they are not code, and `doctor` does not fail over it.
2. **Given** no bodies left, **When** `doctor` runs, **Then** it prints no such line.
3. **Given** the printed removal, **When** it is committed through the hooks `init` installed, **Then** the commit succeeds and `verify --strict` exits 0.
4. **Given** such a brain, **When** the lifecycle runs, **Then** it prints the same lines as in a fresh brain and runs no init, since the probe reads the root as installed.

### User Story 5 - The first command does not fail, and the vendor facts stay true (Priority: P3)

`openspec new change` refuses uppercase, `_`, `.`, a doubled hyphen and the reserved name
`archive`, all of which `change new` and `roadmap add` accept today, so a change can be
opened that its first step cannot create. openspec 1.13.2's validator passes a delta its
own archive will refuse, saying so only at level INFO. And the entry's opt-outs reach the
runs multivac makes, never the commands it prints, so what the agent's own calls send
and write must be disclosed, by version.

**Why this priority**: each is a failure found late or a fact stated falsely, not a lost guarantee.

**Independent Test**: in an opsx brain, open changes and plan roadmap items with refused and accepted slugs; run `change apply` against a validator reporting the INFO issue; read the opsx entry's note and the site's openspec section.

**Acceptance Scenarios**:

1. **Given** an opsx brain, **When** `change new Fix_Auth "x"` or `change new archive "x"` runs, with or without `--no-sdd` or `sdd_auto: false`, **Then** it exits 1 naming the slug, why openspec refuses it and that `multivac change new "<title>"` derives one, and writes nothing; `change new fix-auth "x"` proceeds.
2. **Given** an opsx brain, **When** `roadmap add` is given a slug the brain's SDD refuses, **Then** it refuses it with the same reason and records nothing.
3. **Given** a speckit brain or a brain with no SDD, **When** either command gets `Fix_Auth`, **Then** it is accepted as today.
4. **Given** a validator that exits 0 reporting "Archive would refuse this delta: …", **When** `change apply` runs, **Then** it passes and prints the message as a note telling the agent to fix the delta before `change land`; an exit 0 with empty or non-JSON output passes with no note.
5. **Given** an opsx brain, **When** the operator reads the opsx registry entry's note or the site's openspec section (no command prints an adapter's note, and `doctor` gains no line for it), **Then** they state the version floors, what each openspec version sends, which printed call first runs without `--json`, what the agent's calls write under HOME, and the opt-outs that reach the agent's own environment — the note by release number, the site in its own words and with no version string, which MV-84 keeps off the site's pages, pointing to the note for the numbers.

### Edge Cases

- openspec 1.13.1 or later with no opt-out in the agent's environment: the printed text `status` is the first call that can show the first-run notice, write `~/.config/openspec/config.json` and send an event, and every later call sends. Disclosed, not covered (a stated ceiling).
- A text-mode call whose stderr is a terminal writes `completionTipSeen` to the same file whatever the opt-outs (1.10.0 on); `OPENSPEC_NO_COMPLETIONS=1` stops it. Disclosed.
- A harness PTY with no size: text `status` never finishes, streaming spinner codes; a sized terminal exits normally (ceiling).
- openspec older than 1.4.0 fails the first step with `unknown option '--json'`, and 1.4.x fails at the archive with the same message: both guides name the upgrade to 1.5.0 or later.
- `openspec new change` run outside the brain checkout creates an OpenSpec root there; the guide says to delete the `openspec/` it made (ceiling).
- A delta holding only REMOVED or RENAMED blocks: its merge targets are staged as today, a human's edit beside them included; a human's edit beside the blocks the archive really merged lands with the merge, and one inside a merged block leaves that spec named dirty and out of the commit (ceilings).
- An untracked human draft of a main spec beside an archive made without merging: named dirty, never staged.
- A slug planned before this change that openspec refuses: `change new` refuses to open it; the human re-plans it under a slug the SDD takes.
- The binary reachable only through `node_modules/.bin`: not on the agent's PATH, as it was not for the bodies (ceiling).
- Claude Code: each of the agent's openspec calls may ask permission, which the bodies' `allowed-tools` granted while they ran; no allow-rule is written (ceiling).
- A door added after the scaffold: opsx needs no per-door install and none is named missing.
- `openspec update` in a `--tools none` brain finds no configured tools and does nothing.
- A PowerShell harness: no printed command, the preview included, needs a POSIX redirection or an env prefix.
- `sdd_auto: false`: the door still lists the four runs; nothing is printed at the points or gated.
- A speckit brain: door, flow.md, `doctor` and lifecycle output are byte-identical to before.

## Requirements *(mandatory)*

### Functional Requirements

#### The steps are openspec's own verbs

- **FR-001**: opsx's steps MUST print openspec's own terminal verbs, `<slug>` interpolated: `new` — in the brain checkout, `openspec new change <slug> --json`, then each artifact `openspec status --change <slug>` marks `[ ]` written from `openspec instructions <id> --change <slug> --json`; `plan` — the same loop until `tasks.md` is written, stated so it can be acted on alone; `apply` — where `openspec/changes/<slug>/` is (the change's brain worktree once `change apply` carried it), `openspec instructions apply --change <slug> --json` before the first task and after the last; `land` — after the merge, in the brain checkout and never a change worktree, `openspec archive <slug> --json`. Each step's artifact, gate, validator, ledger and merge record MUST be unchanged.
- **FR-002**: A step MAY carry a guide. The lifecycle MUST print it, `<slug>` interpolated, on the line under the step, indented, at the step's point and in every refusal that re-prints the step; the run-the-chain instruction MUST stay the point's last line, unindented.
- **FR-003**: The brain door, `doctor` and flow.md MUST print a step's run alone, never its guide.
- **FR-004**: flow.md MUST name an ungateable step by the first backticked command in its run whose first word is a binary the entry requires, falling back to today's naming when there is none.
- **FR-005**: multivac MUST still spawn only the tool's validator and scaffold, each with the entry's `env` (MV-51).

#### No command body installed

- **FR-006**: opsx's scaffold MUST be `openspec init --tools none --no-animation .` for any set of doors, none included; a scaffold run with no door placeholder MUST run as written and name no door as a gap. spec-kit's per-door install MUST be unchanged.
- **FR-007**: The entry MUST keep, as a measured record, the directories `openspec init --tools <key>` writes for each door and the entry names those inits write there; the code gate MUST keep reading those directories as not code (MV-144).

#### The archive goes to the human

- **FR-008**: No step's run in any SDD entry may carry `--yes`, `--skip-specs` or `--no-validate`; a guide names them only as the human's answer or after "never".
- **FR-009**: The land run MUST name `archive_confirmation_required` as the human's question and say a flag its `fix` names is never the agent's. Its guide MUST say: that code with a message saying `Updating` means nothing was written, and goes to the human with `openspec show <slug> --json --deltas-only`, which writes nothing; the answers are the tool's own — yes: `openspec archive <slug> --json --yes`, then relay its `warnings`; archive without merging: `openspec archive <slug> --json --skip-specs`; anything else: stop; `archive_tasks_incomplete` is resolved by finishing the tasks where apply ran or by the human dropping them from `tasks.md`, never by ticking; any other code is fixed and re-run with no flag, never `--no-validate`; `unknown option '--json'` means openspec is older than 1.5.0 and must be upgraded.
- **FR-010**: A step printed at `land` MUST be proved in the brain checkout alone. A proof found only in the change's worktree — once or more, never read there as a clash — MUST be refused, naming its path and saying it never reaches the brain checkout, followed by the step, its guide and the re-run line; the ledger that step reads MUST NOT be read from such a hit.
- **FR-011**: `close` MUST stage a main spec a merging step records only when it carries the merge: with line endings normalised to LF, trailing whitespace stripped and each run of blank lines collapsed to one on both sides, its `## Requirements` section holds, whole and under the same name, every `### Requirement:` block under the archived delta's `## ADDED Requirements` and `## MODIFIED Requirements`, both read as openspec 1.13.2 reads them (a block runs to the next requirement header or `## ` line; a header inside a fenced code block is none), tracked or untracked alike. Otherwise it MUST name the spec dirty and leave it out. A delta with no such block MUST keep today's staging. A merging step records only the file the tool merges (`spec.md` in a capability's directory); no other file beside a delta maps to a main spec. (Whole blocks and the fence rule: found at review, where a substring test and a fence-blind reader each called a `--skip-specs` target carried or a real merge uncarried.)
- **FR-012**: The ledger refusal at `close` (MV-63) MUST say that `--yes` archives over its own refusal and, under `--json`, says nothing.

#### The questions ride on the lines

- **FR-013**: The new, apply and land runs MUST each name the human's question on that step, on every surface that prints them.
- **FR-014**: The new guide MUST say: `already exists` for a change not opened in this run is the human's question, otherwise go on; write the file each instruction's `resolvedOutputPath` names from its `instruction` and `template`, whose `context` and `rules` bind and are never copied in; before the proposal, ask about any ambiguity that would change scope, observable behaviour, compatibility or acceptance and about any conflict with a main spec, and assume and record the rest; an `openspec/` made by a run outside the brain checkout is deleted; `unknown option '--json'` means openspec is older than the 1.5.0 this flow needs.
- **FR-015**: The plan guide MUST say design is optional where its instruction says so, tasks are then written from `openspec instructions tasks --change <slug> --json` though status marks them `[-]`, and openspec's `Next:` apply is not the agent's before `change apply`.
- **FR-016**: The apply run MUST say to tick `- [x]` only what is fully built, until `state` is `all_done`. Its guide MUST name as the human's question, never absorbed silently, work beyond the spec and tasks, a task the agent would narrow, defer or drop, an unclear task, a design issue the work reveals and a blocker, and say openspec's "ready to be archived" is `change land`'s, after the merge.
- **FR-017**: Each vendor question a guide carries MUST be cited beside it by the vendor file's path and version (openspec 1.13.2's `.claude/commands/opsx/propose.md` and `apply.md`), never by a slash spelling.

#### Bodies an earlier init left

- **FR-018**: In an opsx brain, `doctor` MUST name the entries matching what openspec's inits write, under every directory any openspec integration writes (declared door or not) and under `.codex/`, where openspec 1.7.0's codex integration wrote, on one line, siblings collapsed to `<parent>/openspec-*` or `<parent>/opsx-*`, with `git rm -r <paths>` and that they are not code (MV-137). It MUST print nothing when none is left and MUST NOT fail over it.
- **FR-019**: Committing that removal MUST pass the code gate and the hooks `init` installed.

#### The slug, the validator, the note

- **FR-020**: An SDD entry MAY record a slug grammar with reserved names and the reason. opsx's MUST be lowercase letters and digits in runs joined by single hyphens, with `archive` reserved, as openspec 1.13.2's `new change` accepts.
- **FR-021**: `change new` MUST check the brain SDD's grammar before its other slug checks, whatever `sdd_auto` and `--no-sdd` say, and on a mismatch print `` `<slug>`: the brain's SDD takes no such slug — <why>; `multivac change new "<title>"` derives one ``, exit 1 and write nothing. `roadmap add` MUST refuse the same slugs with the same reason, as it refuses a malformed slug today, and record nothing. With no grammar recorded, both MUST accept what they accept today.
- **FR-022**: A step MAY name validator issue messages to surface. When the validator passes, the gate MUST print each matching issue as `` sdd opsx: `openspec validate <slug> --json --no-interactive` passes and notes: <message> — fix the delta before `change land` `` and refuse nothing; exit-0 output that is empty or not the vendor's JSON MUST pass with no note. opsx MUST name openspec's "Archive would refuse" on the step `change apply` validates.
- **FR-023**: The opsx note MUST state: the steps are terminal verbs `openspec --help` 1.13.2 lists, run there with stdin closed; the printed flow needs 1.5.0 or later (`archive --json`; `new change --json` and `resolvedOutputPath` ship in 1.4.0) and the scaffold 1.7.0 (`--no-animation`); multivac runs only the validator and the scaffold, each with the entry's `env`; 1.4.1 through 1.13.0 send one anonymous event to `edge.openspec.dev` from every command, `--json` included, while 1.13.1 and 1.13.2 send nothing until a run without `--json` and without an opt-out shows the first-run notice, which writes `~/.config/openspec/config.json` and sends, every later command sending, the printed text `status` being the first printed call that can; the agent's calls (15 per change as printed, plus the `list`, `show` and `validate` openspec's own output names) carry none of `env`, and the opt-outs that reach them are `OPENSPEC_TELEMETRY=0` or `DO_NOT_TRACK=1` in the agent's own environment, either alone (1.4.1 through 1.13.2), or `openspec config set telemetry.enabled false` from 1.10.0; a text-mode call whose stderr is a terminal writes `completionTipSeen` to that file whatever the opt-outs (1.10.0 on), which `OPENSPEC_NO_COMPLETIONS=1` stops; `openspec init` or `openspec update` over installed workflow files writes that file too, and `openspec update` checks `registry.npmjs.org`; `--yes`, `--skip-specs` and `skip_specs: true` are the tool's own escape hatches, which the human chooses. The note MUST match none of MV-121's or MV-124's retired phrases.
- **FR-024**: opsx's refresh fact MUST say `openspec update` refreshes only bodies a human installed and does nothing in a brain scaffolded with `--tools none`.

#### The law and the docs

- **FR-025**: MV-147 MUST state the rule with its measurements and its ceilings, every edge case above that states a limit marked a ceiling among them, filed proposed, and each of MV-51, MV-56, MV-63, MV-75, MV-95, MV-121, MV-124, MV-130, MV-133, MV-142, MV-144 and MV-146 MUST carry a dated note by MV-147 withdrawing every sentence this change makes false: MV-95's lists every question FR-013 to FR-016 carry, MV-121's the HOME writes and the first printed call without `--json`, MV-146's the merge test of FR-011. MV-55 and MV-137 are left alone. (MV-142 was left alone until review found its MV-144 note saying, in the present tense, that a declared SDD installs its own commands and skills, which opsx's `--tools none` scaffold no longer does.)
- **FR-026**: No file the MV-147 retired-phrase leg covers (the root Markdown files but the changelog, the source, the tests, the site's content and both copies of the multivac skill) may name openspec's steps by a slash spelling, say invoking a step name would do nothing silently, or call every SDD step a chat command; vendor sources are named by path and version.
- **FR-027**: Every published sentence and source comment this change makes false MUST be amended — in the site's reference, guide and concepts pages, DESIGN.md, both copies of the multivac skill and the tool's own comments: that every SDD step is a chat command; that a scaffold run is verbatim but for a door placeholder and a door missing from it is a gap; that the gates read the brain and the change's worktree at every point (a land step reads the brain checkout alone); that close stages every main spec an archive merged into (only one carrying the merge; others are named dirty); that every step runs in the brain checkout (apply runs where `openspec/changes/<slug>/` is); that each door gets the vendor's integration and a later door needs the vendor's own install (not for opsx); that whether openspec honours its opt-outs was read, not measured; and the init, flow, ungateable and refresh tables, the refusal and `doctor` samples and the ledger paragraph. The site MUST gain `### The question openspec asks at archive`, a section on bodies an earlier init left, and one on installing openspec's bodies by hand that discloses its HOME write. The changelog's Unreleased section MUST record the change.

### Key Entities

- **Step run**: the one line the agent runs for a step, with the human's question on it; printed by the door, the lifecycle, `doctor`, flow.md and refusals.
- **Step guide**: the rest of what the vendor's body told the agent, measured on a named version; printed only by the lifecycle and refusals.
- **Integration record**: per door, the directories `openspec init --tools <key>` writes and the entry names it writes there; read by the code gate and `doctor`, never run.
- **Slug grammar**: an SDD entry's pattern, reserved names and reason.
- **Validator note**: an issue a passing validator reports that a later step of the same tool will refuse.
- **Merge carry**: whether a main spec holds every ADDED and MODIFIED requirement block of the archived delta.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A fresh `init --sdd opsx` brain holds 0 files whose path matches `openspec-` or `opsx` outside `.git`, and `openspec/` holds `config.yaml` and two `.gitkeep`s, down from 19 files and 273,400 bytes for `[agents, claude]`; a claude session there lists no openspec command or skill (2,335 bytes today).
- **SC-002**: One change walked `new` → `plan` → `apply` → `land` → `close` with a logging stub makes multivac start exactly 2 openspec commands: `init --tools none --no-animation .` and `validate <slug> --json --no-interactive`, each with both opt-outs.
- **SC-003**: The brain door's opsx step lines contain the four runs and no guide text, and grow from 646 to at most 1,300 bytes, less than the 2,335 bytes of listing they replace in each claude session.
- **SC-004**: A two-capability change followed through the printed lines reads under 30,000 bytes of vendor output and `sdd opsx:` lines (the lines the four lifecycle points print for the SDD, not the change-file and commit lines around them), against about 111,000 through the bodies, in a brain whose absolute path is short: openspec's JSON repeats that path (45 times over the walk), so the total grows about 45 bytes per character of it — 28,054 B at 8 characters, 32,014 B at 96 (T062).
- **SC-005**: flow.md's apply row names `openspec instructions apply --change <slug> --json`; a speckit brain's door, flow.md, `doctor` and lifecycle output are byte-identical to before.
- **SC-006**: After every stage has landed, `change land`'s opsx output is three lines: the step naming `openspec archive <slug> --json` and no `--yes`, its guide starting with `archive_confirmation_required` saying `Updating`, and the run-the-chain instruction.
- **SC-007**: In brain==code with the archive only in the change's worktree, `close` exits 1 naming that path; with it in the brain checkout, `close` exits 0 and after the printed commit `git status --porcelain -uall` shows no path of the slug.
- **SC-008**: After `--skip-specs` with a human's uncommitted edit to a main spec, `close` names it dirty and its capability is not in the pathspec; an untracked draft beside it is named, not staged; the `--yes` twin, and its CRLF-delta twin, stage the archive, the moved-from directory and both merge targets.
- **SC-009**: An archived `tasks.md` holding `- [ ]` makes `close` refuse with a reason matching "archives over its own refusal".
- **SC-010**: No step's run in any entry matches `--(yes|skip-specs|no-validate)`; opsx's new, apply and land runs each contain "the human's question"; the apply run contains "tick `- [x]` only what is fully built"; the land run contains "a flag its `fix` names is never yours"; the land guide names `` saying `Updating` ``, `openspec show <slug> --json --deltas-only`, `--skip-specs`, "stop" and "never `--no-validate`"; the new guide names `already exists`; the apply guide names an unclear task, a design issue and "ready to be archived".
- **SC-011**: In a brain with bodies committed under `.claude/`, `.agents/` and `.codex/`, `doctor` prints one line naming each parent; its `git rm -r` committed through the hooks exits 0 and `verify --strict` exits 0; with none left, no line.
- **SC-012**: In an opsx brain `change new Fix_Auth "x"`, `change new archive "x"` and `roadmap add Fix_Auth "x"` each refuse and write nothing, and `change new fix-auth "x"` proceeds; a speckit brain accepts `Fix_Auth` in both commands.
- **SC-013**: A validator exiting 0 with the INFO issue "Archive would refuse this delta: …" lets `change apply` pass and print the note; one exiting 0 with empty output lets it pass with no note.
- **SC-014**: The opsx note names 1.4.0, 1.5.0, 1.7.0, `edge.openspec.dev`, 1.13.1, the first-run notice, `completionTipSeen`, `OPENSPEC_NO_COMPLETIONS=1`, `OPENSPEC_TELEMETRY=0`, `DO_NOT_TRACK=1` and `registry.npmjs.org`, and matches no retired phrase of MV-121 or MV-124.
- **SC-015**: The MV-147 retired-phrase leg counts 0 matches, down from 28 in 10 files (measured through picomatch at `7b849fa` and `6e2a265`).
- **SC-016**: The full test suite passes, `verify` reports every claim anchored and 0 blocking, and the law carries exactly 12 dated amendment notes by MV-147: MV-51, MV-56, MV-63, MV-75, MV-95, MV-121, MV-124, MV-130, MV-133, MV-142, MV-144 and MV-146 (FR-025; MV-142's added at review), as MV-147's `count=12` leg pins.

## Assumptions

- The binding decision of 2026-09-25 holds: the archive question is the human's. The other questions left to the human are taken at their conservative defaults: no harness permission allow-rule is written for openspec calls; the telemetry of the agent's own calls is disclosed by version, not covered by any harness `env` multivac writes; the scaffold is `--tools none`, so openspec's other bodies are gone for humans too and the site documents the hand install; the archive's answers are the tool's own three (`--yes`, `--skip-specs`, stop); a stray openspec config under a research machine's real HOME is not this feature's concern.
- Vendor facts are measured on openspec 1.13.2 with HOME isolated, and on 1.0.0 through 1.13.1 where a version is named; `show --json --deltas-only` and `new change --json` were checked present from 1.4.0 on. Nothing re-measures an upgrade (MV-121).
- MV-147 is reserved for this change (MV-26); `<date>` in each note is the day the commit that writes it is made (eleven notes 2026-09-28, with the law commit; MV-142's, added at review, 2026-09-29); the row is filed proposed and only a human enacts it (Principle III).
- `speckit-writes-once` (MV-146) is closed on this branch; this change builds on its surfaces — the door's `[proof: …]` / `[ungateable]` endings, the once-per-point instruction, close's merge staging and the code-repo leftover report, which stays as is. The design's line citations predate its landing and are re-anchored on the branch head in planning.
- MV-51's two subprocesses stand: multivac neither probes openspec's version from `doctor` nor runs `new change` itself, and prints no env prefix before a command.
- Out of scope, with owners: graphify's ignore of `.agents/` and a code-less brain's grapher (`graph-answers-where-asked`); measuring what the grapher queries a door prints send, and their opt-outs (`codegraph-worktrees-and-verbs`) — MV-121's amendment covers what every entry prints, so this change does say, on the codegraph entry's note and the site, that the entry's `env` never reaches the printed `codegraph query`; claims citing IDs (`change-file-cites`); `verify`'s root (`verify-rooted-and-quiet`); trimming the multivac skill beyond the sentences this change makes false (`skill-cites-references`).
- This repository declares speckit, so its own door and flow.md are byte-identical after this change.
