# Feature Specification: The SDD lives in the brain and writes once

**Feature Branch**: `073-speckit-writes-once`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "The SDD lives in the brain alone and writes once: one install and one constitution per ecosystem, the code gate still governs every code repo through the brain's SDD, close lands the brain's specs whatever the flags say, a config whose `sdd:` resolves in no root is refused; skeleton templates where spec-kit resolves templates first; no committed Sync Impact Report; the run-the-chain instruction once per lifecycle point; the change body cites the SDD's directory instead of restating it. Adds MV-146, amends twenty rows."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One SDD, in the brain, and still no code outside a change (Priority: P1)

An operator declares `sdd: speckit` in a brain that governs two code repos. Today
the declaration reaches every repo: `repos sync` runs the vendor's init in each code
repo (30 files, 240,903 bytes each), each code repo's door carries a 2,796-byte SDD
block into every session, `change plan` refuses until every code repo has its own
constitution, and the first `apply` commits twenty vendor files onto each code
repo's branch. The specs of a change are written in the brain anyway. The operator
decided (2026-09-25) that in a multi-repo ecosystem the SDD lives in the brain
alone.

Taking the SDD out of the code repos must not take their protection with it: today
the code gate (MV-137) switches on only in a repo that resolves an SDD, so a naive
brain-only resolution switched it off in every code repo (`verify --strict` exit 1
became 0, measured). And a config that names an SDD nowhere it will run must say so
instead of silently doing nothing.

**Why this priority**: it is the binding decision, the largest saving (per code repo:
one install, one constitution, about 650 tokens of door per session), and the one
piece where a mistake loses a guarantee.

**Independent test**: in a scratch ecosystem of a brain and two code repos with
`sdd: speckit` and the real spec-kit, run `repos sync`, `doors`, then stage code on
`main` in a code repo and run `verify --strict`.

**Acceptance Scenarios**:

1. **Given** a brain declaring `sdd: speckit` and two code repos, **When** `repos sync` runs, **Then** the vendor's init runs in the brain only and no code repo gains a `.specify/` directory or a `speckit-*` skill.
2. **Given** the same ecosystem, **When** `doors` renders a code repo's door, **Then** it carries one line saying where the brain's SDD runs and where this repo's code belongs, and no SDD step block.
3. **Given** a code repo with no `sdd:` of its own, **When** code is staged on a branch that is no open change declaring it and `verify --strict` runs, **Then** it refuses, exactly as before.
4. **Given** a code repo whose entry says `sdd: none`, **When** code is staged on any branch, **Then** the code gate does not apply there.
5. **Given** a code repo entry naming a tool (`sdd: opsx`), a top-level tool contradicted by the brain's own entry, or an SDD name the registry does not know, **When** any command loads the brain's config, **Then** it exits 2 naming the key, the fix and the change the config edit needs — except `doctor`, `doors` and `init`, which report it as a config they cannot load and exit 1, as they do for any such config.
6. **Given** the same refused config read through a consumer's mounted brain, **When** `verify` runs in the consumer, **Then** it prints the refusal as a line that blocks only under `--strict`, because a mount can lag its brain.
7. **Given** a closing change in a brain that resolves an SDD, **When** `close` runs with `--no-sdd` or under `sdd_auto: false`, **Then** the brain's directories for that slug are still in the commit it prints.
8. **Given** an openspec archive that merged the change's capability specs into the main specs and moved the change directory, **When** `close` prints its commit, **Then** the archive, the moved-from directory and each merged main spec are staged, and none is named as dirty.
9. **Given** two changes open in one brain checkout, **When** `change plan` or `change apply` runs for one of them, **Then** spec-kit's feature pointer names that change's directory, and the command says so when it named another.
10. **Given** a code repo that an earlier release equipped with the SDD, **When** `doctor` or `repos check` runs, **Then** the leftover install is reported with how to remove it, and neither command fails over it; removing it is not code.
11. **Given** a missing spec for a change whose spec was written in a code repo by habit, **When** the gate refuses, **Then** it names the file it found there and says it is not read.
12. **Given** a change open across the upgrade whose task ledger sits only in a code repo, **When** `close` runs, **Then** it refuses, naming the ledger it found there unread, instead of passing over tasks it cannot see.

### User Story 2 - The templates are skeletons (Priority: P2)

`/speckit.specify`, `/speckit.plan` and `/speckit.tasks` read 18,004 bytes of
template per change, most of it guidance the agent deletes. spec-kit resolves every
template through `.specify/templates/overrides/<name>.md` first, and its own init
leaves that directory untouched. A fresh spec-kit scaffold should leave skeleton
templates there that keep every section the steps fill and drop the rest.

**Why this priority**: it saves about 3,450 tokens per change, every change, but only
in brains scaffolded from now on, and it rests on the vendor's resolver.

**Independent test**: in a fresh `init --sdd speckit` brain, resolve each template
through the vendor's own scripts and measure the bytes.

**Acceptance Scenarios**:

1. **Given** a brain whose scaffold just installed spec-kit at or above the recorded floor, **When** the scaffold finishes, **Then** the skeleton spec, plan and tasks templates are in the override directory and the scaffold says so.
2. **Given** a root where the override directory already exists, or spec-kit was installed before, or the recorded version is below the floor, or SDD automation is off, **When** anything runs, **Then** nothing is written there.
3. **Given** an installed core template missing a heading the skeleton keeps, **When** the scaffold would write that skeleton, **Then** that one file is skipped and the heading is named.
4. **Given** the skeletons in place, **When** the vendor's init runs again over the root, **Then** the skeletons are byte-identical afterwards.
5. **Given** a plan byte-identical to the plan skeleton, **When** `change apply` runs, **Then** it refuses, naming the skeleton, as it does for an untouched core template today.
6. **Given** an enabled spec-kit preset providing a template a skeleton outranks, **When** `doctor` runs, **Then** it says so and names the override to delete to let the preset win.

### User Story 3 - The flow is printed once (Priority: P3)

Every printed SDD step is followed by the same 180-byte instruction to run the chain
through, seven times per spec-kit change, and the brain door restates each
ungateable step's reason in every session.

**Why this priority**: a small saving per change and per session, with no guarantee at
stake as long as the instruction and its opt-out still reach the agent at each point.

**Independent test**: walk `change new`, `plan` and `apply` in a brain with spec-kit and
count the instruction lines.

**Acceptance Scenarios**:

1. **Given** a lifecycle point that prints SDD steps, **When** it prints them, **Then** the run-the-chain instruction, with its opt-out on the same line, appears once, after the last step.
2. **Given** a point that prints no step, or `sdd_auto: false`, **When** it runs, **Then** no instruction is printed.
3. **Given** the brain door, **When** it lists the steps, **Then** each ends with its proof path or `[ungateable]`, and the full reason stays in the lifecycle output, `doctor` and flow.md.
4. **Given** `sdd_auto: false`, **When** the door, flow.md and `doctor` describe the gates, **Then** none of them claims the lifecycle refuses anything.

### User Story 4 - The constitution commits no amendment report (Priority: P3)

The registry tells the agent to "prepend the Sync Impact Report" on every amendment.
spec-kit said that through 1.0.5; from 1.0.6 its own step calls the report scratch
"expected to be removed before the amended constitution file is committed". This
brain's constitution carries six stacked reports, 4,441 of its 12,120 bytes, read by
every step that loads it.

**Why this priority**: the tool is stating a vendor fact that stopped being true, and the
instance cost is large in this brain; at tool level the saving accrues per amendment.

**Independent test**: read the revisit text in the door and the brain's constitution.

**Acceptance Scenarios**:

1. **Given** a spec-kit brain, **When** the door, flow.md and `doctor` print the constitution's revisit, **Then** it says to commit no Sync Impact Report and never says to prepend one.
2. **Given** this brain, **When** the change lands, **Then** its constitution carries no Sync Impact Report and its amendment procedure says the report is removed before commit.

### User Story 5 - The change body cites its spec (Priority: P4)

With an SDD declared, the why, the design and the tasks of a change live in the SDD's
files, and the change body often restates them. Nothing in the archive links a change
file to its spec directory by machine.

**Why this priority**: the saving depends on the agent following an instruction; the
pointer's value is a durable link from the archive to the proof.

**Independent test**: close a change with a spec-kit directory and read the archived body.

**Acceptance Scenarios**:

1. **Given** a brain resolving an SDD, **When** `change new` runs, **Then** it says the why, the design and the tasks go into the SDD's files and that close cites the directory.
2. **Given** a closing change whose slug has a directory in the brain or its worktree, **When** `close` runs, **Then** the archived body ends with one line citing that directory and the SDD, and everything before it is byte for byte what the body held.
3. **Given** a body that already names the directory, **When** `close` runs, **Then** the body is unchanged.
4. **Given** no SDD in the brain, **When** `close` runs, **Then** the body is untouched.

### Edge Cases

- brain==code with no other repo (this repository): every surface behaves as before except the revisit wording, the door's step endings, the instruction count and flow.md's two rows that now say "in the brain" (the same roots, named for what they are); there is no code repo to govern or exempt.
- brain==code declared under a key other than `brain`: the worktree the proofs are looked for in is named by that key, so a task left open still refuses close.
- A code repo whose `sdd:` is the empty string: treated as unset, so not refused and its code governed; before this change an empty value stopped the top level at that root. An empty `grapher:` keeps doing that.
- A read-only repo (MV-125): never scaffolded, never searched for a stray spec's sake beyond naming, never named by the leftover report.
- An opsx leftover in a code repo: removing `openspec/` there is not code, like removing `.specify/`.
- A `specs/` directory in a code repo: code, since under this rule it is no SDD's directory there.
- Two changes' steps interleaved in one checkout: the pointer makes the sequential case right; the gate names the directory it read.
- A spec-kit feature directory named by `--timestamp` numbering: matches no `<n>` form, so it is neither gated nor cited (a stated ceiling, MV-113).
- An older multivac reading this config: it still cascades; only a `requires:` floor a human writes stops it (MV-86).

## Requirements *(mandatory)*

### Functional Requirements

#### In the brain alone

- **FR-001**: The SDD MUST resolve for the brain root only: the `brain` handle, or the entry marked as the brain under any key. Graphers MUST be unaffected.
- **FR-002**: One resolver MUST answer which SDD governs a root's code: the brain's, for the brain and every other root, unless that root's own entry says `none`.
- **FR-003**: Loading a brain's config MUST refuse, naming the key and the fix and the change the edit needs: a code repo's `sdd:` naming anything but `none` (the empty string stays unset); a top-level tool contradicted by the brain's own entry; an SDD name the registry does not know.
- **FR-004**: Every load of a mounted brain's config on a consumer's `verify` path, and a consumer's `count`, MUST report the refusal as one line instead of exiting 2; the line MUST gate only under `--strict`.
- **FR-005**: The code gate MUST switch on in a repo whenever the SDD governing its code resolves and SDD automation is on.
- **FR-006**: The SDD's step-artifact directories and project documents MUST be not-code in the brain, so spec-kit's `specs/` is code in a code repo; everything under a known SDD's install directory (`.specify/`, and `openspec/`, which holds opsx's step artifacts and both tools' project documents), and every known SDD's shared paths and harness directories, MUST stay not-code everywhere, so removing a leftover install of any known SDD is free.
- **FR-007**: `close`, and `close --abandon`, MUST stage the brain's directories for the slug whenever the brain resolves an SDD, whatever `sdd_auto` or `--no-sdd` say, including a slug directory git reports deleted and, for a step declaring a merge, each main spec the archive merged into.
- **FR-008**: A step's proof MUST be looked for in the brain and in the change's worktree named by the brain entry's own key.
- **FR-009**: When a proof is missing, the refusal MUST also name any match for the slug found in a declared, present code repo or its worktree, read-only or not, and say it is not read. When a step's task ledger is found only there, the gate that reads it MUST refuse, naming it unread.
- **FR-010**: `change plan` and `change apply` MUST point spec-kit's feature pointer at the slug's directory wherever it is, in a checkout where the tool's state probe says installed, and say so when it named another.
- **FR-011**: `change plan` MUST say, with the steps (SDD automation on, no `--no-sdd`) and when the change names a repo other than the brain's entry, that the steps run from the brain checkout and code is written only in the worktrees of the repos the change names, the brain's own entry among them.
- **FR-012**: A consumer door MUST carry one line saying where the brain's SDD runs and where this repo's code belongs, and no SDD step block or project-document line; a repo saying `sdd: none`, or SDD automation off, gets no line.
- **FR-013**: `doctor` MUST report the SDD's install, flow, gates and project document for the brain only; name the code repos the brain's SDD governs and those exempt, when there is any code repo and SDD automation is on; and, where the brain resolves an SDD, report a writable code repo's leftover install of any known SDD with whether it is tracked and how to remove it, never failing over it. With no SDD in the brain it prints no `sdd` line.
- **FR-014**: `repos check` MUST ask the SDD checks of the brain only and, where the brain resolves an SDD, add the leftover fact to a code repo's line without changing its exit code.
- **FR-015**: `seed`, flow.md, `ecosystem.json` and `init`'s printed step MUST describe the brain's SDD and the brain's project document, never a code repo's.

#### Written once

- **FR-016**: The registry entry of an SDD MAY carry a skeleton: the directory the tool resolves first, one body per template, the headings each keeps, the version measured and the floor below which none is written.
- **FR-017**: The scaffold MUST write the skeleton only on the run where its probe turns a root from missing to installed, only when the directory is absent, only at or above the floor, and per body only where the installed core template carries every heading the body keeps; it MUST never overwrite a file. `verify`, `doctor` and `doors` MUST never write it.
- **FR-018**: `doctor` MUST name an enabled preset whose template a skeleton outranks, and the override to delete to let it win.
- **FR-019**: The speckit revisit MUST say to commit no Sync Impact Report.
- **FR-020**: This brain MUST carry the skeletons and a constitution without Sync Impact Reports.

#### Printed once

- **FR-021**: Each lifecycle point MUST print its steps and then, once, the run-the-chain instruction with its opt-out on the same line; none when no step printed.
- **FR-022**: The brain door MUST end each step with its proof path or `[ungateable]`.
- **FR-023**: Under `sdd_auto: false`, the door, flow.md and `doctor` MUST NOT say the lifecycle refuses, and flow.md and `doctor` MUST NOT say it runs the init or writes the skeleton.

#### Cited, never restated

- **FR-024**: `change new` MUST say, when the brain resolves an SDD with automation on, that the why, the design and the tasks go into the SDD's files and close cites the directory.
- **FR-025**: `close` and `close --abandon` MUST append `Specified in \`<dir>/\` (<sdd>).` to the body when the slug has a directory in the brain or its worktree and the body does not already name it; nothing else in a body is written, and a planned body stays byte for byte (MV-89).
- **FR-026**: When the brain resolves an SDD with automation on and no directory is found for the slug, `close` MUST say it cited nothing, without asserting the change has no record elsewhere.

#### The law

- **FR-027**: MV-146 MUST state the rule with its measurements and ceilings, and each amended row MUST carry a dated note withdrawing every sentence this change makes false, including MV-75's own copy of the cascade.

### Key Entities

- **Governing SDD**: the SDD whose rules a root's code falls under — the brain's, unless the root opts out with `none`.
- **Skeleton**: per SDD, a directory, a body per template, the headings kept, the version measured and the floor.
- **Feature pointer**: spec-kit's `.specify/feature.json` `feature_directory`, the directory its steps write into.
- **Leftover install**: a code repo's SDD state from an earlier release, reported with its removal when the brain resolves an SDD.
- **Spec pointer line**: the one line close appends to a change body.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After `repos sync` in a brain with `sdd: speckit` and two code repos, 0 SDD files exist in either code repo and the vendor's init ran once.
- **SC-002**: A code repo's door shrinks by at least 2,500 bytes against today's and names the SDD on exactly one line.
- **SC-003**: In a code repo on `main`, staged code and a staged `specs/` file are refused by `verify --strict`; a staged `.specify/` or `openspec/` file is not; with `sdd: none` staged code is not.
- **SC-004**: Each of the three refused configs makes `verify` in the brain exit 2 naming the key; through a consumer's mount `verify` exits 0 with the line and `verify --strict` exits 1.
- **SC-005**: `close --no-sdd` with spec-kit stages the slug's directory; an openspec close stages the archive, the moved-from directory and every merged main spec with no "dirty" line; after the printed commit no path of the slug is untracked.
- **SC-006**: With two changes open and the pointer naming the other, `change plan` repoints it and the vendor's own setup script then resolves the planned change's directory.
- **SC-007**: brain==code keyed `core` with one task open: `change close` refuses naming `tasks.md`.
- **SC-008**: This repository's configuration: `doctor` and `verify` output differ from today's only in the revisit wording and the door's step endings.
- **SC-009**: In a fresh spec-kit brain, the template bytes the specify, plan and tasks steps read total at most 4,300 bytes, down from about 18,000.
- **SC-010**: A second vendor init leaves every skeleton byte-identical.
- **SC-011**: No skeleton is written into an already-installed root, an existing override directory, a version below the floor, or under `sdd_auto: false`.
- **SC-012**: A spec-kit change prints the run-the-chain instruction 3 times across `new`, `plan` and `apply`, down from 7.
- **SC-013**: The brain door's step lines shrink from 1,654 to at most 910 bytes for spec-kit, and from 951 to at most 650 for openspec.
- **SC-014**: This brain's constitution contains no "Sync Impact"; no surface outside the vendor's own skills and the changelog tells the agent to prepend one.
- **SC-015**: An archived spec-kit change body ends with the pointer line, and its pre-close body is a byte prefix of it.
- **SC-016**: The full test suite passes (baseline 788 tests: 785 pass, 3 skipped) and `verify` reports every claim anchored and 0 blocking.

## Assumptions

- The binding decisions of 2026-09-25 hold: the SDD lives in the brain alone; openspec's archive wording belongs to `opsx-through-its-cli`; a code-less brain's grapher belongs to `graph-answers-where-asked`.
- Vendor facts are those measured on spec-kit 1.0.11 and openspec 1.13.2 (and spec-kit 0.9.4 and 0.16.1 for the skeleton floor, since 0.9.1 is not installable from the index); nothing re-measures a vendor when it upgrades (MV-121).
- Claims keep today's form; citing IDs only is `change-file-cites`' scope.
- The constitution amendment in this brain removes review scratch and clarifies the amendment procedure — no principle changes — so it is a PATCH, 3.0.0 → 3.0.1; the operator can re-grade it before enacting.
- No `requires:` floor is written: only a human sets it (MV-86).
- MV-143 and MV-144 are still proposed; the operator enacts them before or with MV-146.
