# Feature Specification: The change file cites, never restates

**Feature Branch**: `077-change-file-cites` | **Created**: 2026-09-29 | **Status**: Draft
**Input**: User description: "The change file cites, never restates: a claim is its row's ID, and close checks what it cites. A change file's claim is the ID of the law row it makes true — `claims: [MV-150]` — and never a restatement of that row; a `{ id }` map is written back bare, a legacy `{ id, statement }` is kept byte for byte and never created, and a stray key inside a claim is named by every reader and refused by every command that rewrites the file. `change close` refuses, before anything is archived and in one run, a claim that cites no row, a row the change does not declare, a retired row it does not retire, a row another change reserved, a row that states no rule yet (saying pull when the brain's channel already states it), a claim anchored only in the change file, an added row already in the law, and a proposed row the change anchors but never claims; `--abandon` refuses a change whose own proposed row states a rule. 'Anchored' becomes the set `verify` parses. `verify`'s finished line, `land`'s last-repo lines and `plan` say what close's citation gate will refuse. Every copy of the sentence that close checks law and code ended consistent is corrected, the constitution by a PATCH. Adds MV-150, amends MV-15, MV-45, MV-80 and MV-117."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A claim is its row's ID, and nothing written before is lost (Priority: P1)

An agent opens a change. Today `change new` prints `3. claims: [{ id: <ID>, statement: "..." }]`
and the scaffold teaches claim prose, so the agent writes the rule twice: once in the row,
once in the change file. Nothing in multivac reads the second copy. On this brain all 160
claims carry a statement, 141 of them no longer match their row, and one archive no longer
parses because of its statement, which drops that change from the ecosystem graph. The row
is already the rule's one home, and the skill already says to cite by ID in change files.
The claim becomes the ID. Every file written before keeps working unchanged.

**Why this priority**: it removes a second copy of the law that silently drifts, and every
other story reads claims as IDs.

**Independent Test**: in a scratch brain, open a change, declare `claims: [<ID>]`, a
`{ id }` map and a legacy `{ id, statement }` side by side, run `change plan`, and read the
file back. Then add a stray key inside one claim and run `verify`, `roadmap`, `doors` and
`change plan`.

**Acceptance Scenarios**:

1. **Given** a fresh change, **When** `change new` runs, **Then** its third edit reads `3. claims: [<ID>]`, aligned with the first two and followed by `# the rows close verifies; each states its rule`, and neither its output nor the scaffolded file carries `statement` or "Statements are prose".
2. **Given** a change file whose claims are `- MV-1`, `- id: MV-2` and a legacy `- id: MV-13` with `statement: "legacy: prose # kept"`, **When** any lifecycle command rewrites the file, **Then** MV-1 stays bare, MV-2 is written back bare, and MV-13 comes back byte for byte.
3. **Given** a claims value that is not a list, or an entry that is an empty string, a number, a map without a non-empty string `id`, or a map whose statement is not a string, **When** any reader parses the file, **Then** it is refused with a message naming the form `claims: [<ID>]`.
4. **Given** an open change whose claim carries a key other than `id` and `statement` (say `note:`), **When** `verify`, `roadmap`, `doors` or the code gate read it, **Then** each names the key and reads the change without it: the change still holds its claims pending, still appears in flight, still has its node in the ecosystem graph, and a code commit on its branch is still its code. **When** `change new`, `plan`, `apply`, `land` or `close` (or `roadmap sync`) meet it, **Then** they refuse the file by naming the claim and the key, and write nothing.
5. **Given** a change with a legacy statement, **When** `change plan` runs, **Then** it prints one line per legacy claim naming the statement as a restatement of the row, kept as written, and gates nothing; it never asks the author to convert.

### User Story 2 - Close checks what each claim cites before anything is archived (Priority: P1)

Once the statement is gone, the row is the only home of the rule, and `close` must check it.
Today `close` checks a claim's anchors and never its row: of 16 bad declarations, 11 close
green, among them a claim whose row still reads `RESERVED by change <slug> — state the rule
here before close.`, a claim of no row, a claim of a row the change never declared, a claim
of a retired row, and a row the change added and anchored but never claimed. Close now
names each defect by claim, all in one run, before it writes anything.

**Why this priority**: without it, removing the statement would let a change archive a claim
whose rule is written nowhere.

**Independent Test**: in a scratch brain, declare one change per defect, land it, and run
`change close`: each refuses naming the defect and archives nothing; fix the named line
and close passes.

**Acceptance Scenarios**:

1. **Given** a landed change claiming only an ID whose row still reads RESERVED, **When** `change close` runs, **Then** it exits 1 with that claim's "its row states no rule yet" line and the summary line, and writes no archive; **When** the row is stated and close runs again, **Then** it exits 0, prints only `<ID>: ok` for the claim, and the archive holds `claims:` with the bare ID.
2. **Given** the same change whose claim is a legacy map, **When** close refuses, **Then** the line says to move the claim's legacy statement into the row.
3. **Given** a change with a claim whose anchor is red, a claim of no row and a claim of a row it neither adds, touches nor retires, **When** close runs, **Then** one run prints the red anchor's line, a line for each of the other two, and exactly two "close refused" lines, and exits 1.
4. **Given** a checkout that fetched but did not pull a commit stating the row, **When** close runs, **Then** it says the brain's channel states the row, how many commits this checkout lacks, and to pull — never to state it; after the pull close exits 0.
5. **Given** a brain whose own entry declares `channel: origin/trunk`, **When** close reads the channel for that pull, **Then** it reads `origin/trunk`, the ref `land` and `verify` read for that brain.
6. **Given** a change retiring a row it also claims, **When** the row is still in force, **Then** close refuses naming the retirement left to do; **When** the row reads retired with its tombstone and absent legs, **Then** close evaluates those legs as the claim and passes when they hold.
7. **Given** a change listing under `adds` a row already active, **When** close runs, **Then** it refuses saying the row is already in the law and belongs under `invariants.touches`, and never says to drop it from the law.
8. **Given** a claimed row whose every anchor is written inside the change file, **When** close runs, **Then** it refuses exactly as it does today, naming the claim anchored only in the file it would archive.
9. **Given** a row the change adds, stated but anchored nowhere, **When** close runs, **Then** it prints that the row enters the law stated but unanchored, and passes.
10. **Given** `change close --abandon` on a change whose own proposed row states a rule, **When** it runs, **Then** it exits 1 naming the row and archives nothing; over a row that still reads RESERVED, anchored or not, it abandons as today and keeps a row an anchor names.
11. **Given** a clean change, **When** plan, apply, land, `verify --strict`, close and the verify after it run, **Then** each prints byte for byte what it printed before this change.

### User Story 3 - Every surface that says "close" says what close will refuse (Priority: P1)

`verify --strict` in CI and `land` both tell the operator to run `change close <slug>`. If close
then refuses, the tool has printed an instruction it rejects, which is the defect MV-80 names.
Every surface that says "close" now names close's citation-gate refusal first.

**Why this priority**: a finished change otherwise turns CI red with an instruction that fails.

**Independent Test**: land a change whose claim cites an unstated row and read `land`,
`verify --strict` and `close`; state the row and read them again.

**Acceptance Scenarios**:

1. **Given** a finished change that close would refuse on its citation gate or its orphan check, **When** `verify` runs, **Then** its finished line reads `finished, not pending — close refuses until: <first line>[ (+N more)] — then: multivac change close <slug>`, still blocking under `--strict`, with the summary counts unchanged; **When** close would not refuse, **Then** the line is today's.
2. **Given** the last repo recorded landed, **When** `change land` runs, **Then** after the armed line it prints `  close refuses until: <line>` for each refusal, and its last line reads `all stages landed — fix the line close refuses on above, then: multivac change close <slug>` (`the <n> lines` for several); a clean land prints today's lines.
3. **Given** the brain's channel states the row and this checkout does not, **When** `land` records the last repo, **Then** its refusal line says pull, the same line close prints, never "state it".
4. **Given** a claim of no row, of a retired row this change does not retire, of a row it does not declare, or of a row another change reserved, **When** `change plan` runs, **Then** it prints `claim <line> — close refuses this` for each and gates nothing.
5. **Given** the same four shapes under speckit, opsx, graphify, codegraph and a code-less brain with two code repos, **When** the change is walked to land, **Then** land names the refusal, `verify --strict` exits 1 with the refusing finished line, close exits 1; once fixed, `verify --strict` prints the ordinary close line and close exits 0.

### User Story 4 - "Anchored" is one set (Priority: P2)

`close` releases a reservation only when no anchor names its ID (MV-45), but it decides that
by scanning the text of every tracked file, while `verify` parses anchors from the brain's
root, `.multivac/` and `.multivac/changes/` only. The scan counts 221 IDs here where verify
parses 147. On a fresh `init --provider claude` brain it counts six IDs from the skill's own
examples where verify parses none, so the first reservation of that brain is never released.

**Why this priority**: the citation gate exempts exactly the rows release gives back, so both
must read one set; the defect it fixes is real but narrow.

**Independent Test**: on a fresh `init --provider claude` brain, open a change that adds
nothing, land it and close it.

**Acceptance Scenarios**:

1. **Given** a fresh `init --provider claude` brain and a change that adds nothing, **When** it closes, **Then** close prints `released unused reservation: INV-01` and the row is gone.
2. **Given** a reservation named only by anchor text in a file `verify` does not parse, **When** its change closes, **Then** the reservation is released.
3. **Given** `--abandon` over a change whose reserved row is anchored only in its own change file, **When** it runs, **Then** the anchor is read before the archive moves the file, and the row is kept.

### User Story 5 - The words say cite, in every copy (Priority: P3)

The flow page, the site, the skill, DESIGN.md and the constitution teach claim prose, and five
places say `close` checks that "law and code ended consistent" or that "no blocking leg broke
anywhere the change touched". Close never did either: a row the change only touches is checked
at close only when claimed, and by the pre-commit hook on every commit.

**Why this priority**: a wrong sentence is read every session, but the gate is what protects.

**Independent Test**: grep the published pages, the skill copies, DESIGN.md and the
constitution for the retired examples and phrases.

**Acceptance Scenarios**:

1. **Given** flow.md, **When** it is rendered, **Then** its gate line reads `` - `change close` refuses while a declared claim does not resolve, or cites no stated row this change adds, touches or retires ``.
2. **Given** the site's guide and reference pages, both copies of the multivac skill, DESIGN.md and the constitution, **When** they are read, **Then** none teaches a claim statement, none says close checks law and code ended consistent, and the retire sentences say the tombstone is verified at close when the change claims the row.
3. **Given** the constitution, **When** Principle III is corrected, **Then** its version moves by one PATCH, its amendment date is the day of that commit, and it carries no Sync Impact Report.

### User Story 6 - The upgrade is said, not discovered (Priority: P3)

An older multivac cannot read an ID-only claim: its `change` commands refuse the file, and its
`verify`, `roadmap` and `doors` skip it without a word. So the change reads as absent, its
claims stop pending, and a brain==code hook running an older build blocks the change's own
commits. The operator must learn this before a brain writes its first ID-only claim.

**Why this priority**: the harm is avoidable only by reading first.

**Independent Test**: read the changelog's Unreleased section; run an older build against an
ID-only change file.

**Acceptance Scenarios**:

1. **Given** the changelog, **When** an operator reads Unreleased, **Then** under "Changed — read before upgrading" it says an older multivac reads an ID-only change as absent, to upgrade every consumer's pinned and global multivac before the brain writes one, to set `requires:` to the release carrying this change, and that legacy statements keep working and in-flight changes are not converted.
2. **Given** this change's own branch, **When** it is merged, **Then** no `requires:` floor was set on it: the floor goes in with, or after, the release commit that bumps the version.

### Edge Cases

- An older multivac on an ID-only change: `change plan` refuses with `each claim needs a string "id" and "statement"`; `verify`, `roadmap` and `doors` drop the change without a word, so its claims stop pending and can gate, and a brain==code hook whose tier runs an older build refuses the change's own code commits (ceiling, US6).
- MV-86's `requires:` floor makes the brain loud and does not reach a consumer's run (ceiling; `verify-rooted-and-quiet` owns that notice).
- A stray key inside a claim: named by `verify`, `roadmap`, `doors` and the code gate wherever they name an unknown top-level key; `roadmap sync` skips the file the way it skips any file it cannot parse, and saying so is `unparsed-change-files-are-named`'s (ceiling).
- An archive whose statement does not parse (`.multivac/changes/archive/everything-multivac-owns.md`) stays unparsed and absent from the ecosystem graph; archives are never rewritten (ceiling).
- A legacy statement in an archive or in a change open at this row's birth is kept byte for byte; 48,835 bytes of archived statements stay (ceiling).
- The SDD, graph and tracked-graph gates `close` runs before its citation gate are not announced by `verify` or `land` (ceiling).
- `verify`'s finished line reads this checkout only: a brain behind its channel is named on its read line, and the pull is `land`'s and `close`'s to say (ceiling).
- The channel is read offline, only on a refusal, at the brain's own channel; a channel that does not resolve means no pull line, and close says to state the row.
- A stated row the change adds and anchors nowhere enters the law with its line: coverage below 100% is supported, and a process rule in a code-less brain can still enter (ceiling).
- An undeclared claim holds its row pending under MV-17 until `plan` or `close` names it (ceiling).
- A claim whose first defect is fixed may show the next at the following close: each claim gets the first reason in order, one line (by design).
- Rows a change only touches are checked at close only when claimed; the pre-commit hook checks them on every commit (stated, not extended).
- An unused reservation, RESERVED, owned and unanchored, raises no line and is released as before.
- Whether readers fetch the row a change file cites, costing a row read later, is not measured (ceiling).

## Requirements *(mandatory)*

### Functional Requirements

#### A claim is its row's ID

- **FR-001**: A change file's claim MUST be accepted as a non-empty row ID (the form every command writes), as a map holding only `id`, or as a legacy map `{ id, statement }` with string values. Written back, a claim MUST be its bare ID unless it carries a legacy statement, which MUST come back byte for byte and unreflowed (MV-15). No command may create a statement.
- **FR-002**: Every reader MUST refuse a `claims` value that is not a list with `"claims" must be a list of row IDs — claims: [<ID>]`, and any other entry (an empty string, a number, a map with no non-empty string `id`, a non-string statement) with `each claim is a row ID — claims: [<ID>]; the row states the rule`.
- **FR-003**: A key inside a claim other than `id` and `statement` MUST be named as `claim <ID>: unknown key "<k>" — a claim is its row's ID; state the rule in the row`. Every command that rewrites the change file (`change new` promoting it, `plan`, `apply`, `land`, `close`, `--abandon`, `roadmap sync`) MUST refuse the file on it and write nothing. Every other reader (`verify`, the `roadmap` listing, `doors` and its ecosystem graph, the code gate) MUST read the change without that key and name it the way it names an unknown top-level key (MV-117), so the change stays visible to them.
- **FR-004**: The scaffolded change file MUST teach the ID form with the one example line `# claims: [<ID>] — the rows close verifies; each row states its own rule` and no "Statements are prose" lines; its sentence that an unknown key is DROPPED (MV-110) and its closing sentence (MV-146) MUST stay byte for byte. A planned change file keeps `claims: []`.
- **FR-005**: `change new`'s third edit MUST read `  3. claims: [<ID>]`, padded to the column of the first two edits' comments, then `# the rows close verifies; each states its rule`.
- **FR-006**: `change plan` MUST print, once per legacy claim, `claim <ID>: its statement: restates the row — kept as written; a claim is its ID, and the row states the rule (MV-111)`, gate nothing on it, and never ask for a conversion.

#### Close checks the citation

- **FR-007**: Before anything is written, `change close` MUST name for each claim the first that applies, in this order: no row; a row with fewer than six columns (MV-119); a retired row this change does not retire; a row under this change's `retires` that is not retired yet; a row this change neither adds, touches nor retires; a row another change reserved and has not stated; a row that states no rule yet (empty, or RESERVED by this change), whose line says to state it in `.multivac/invariants.md` or, for a legacy claim, to move its statement into the row; a claimed row every parsed anchor of which sits in the change file close archives.
- **FR-008**: For each row the change owns (its `adds`, and every proposed row whose source names the change) that no claim cites and that has no line from FR-007, close MUST refuse a row under `adds` already in the law with any state but proposed (`already in .multivac/invariants.md (<state>) — not new; move it to invariants.touches`) and a proposed row a parsed anchor names (`added by this change and anchored, but claimed by nothing …`); it MUST say, without refusing, that a stated proposed row nothing anchors enters the law unverified; and it MUST say nothing of a row release gives back.
- **FR-009**: When a claim's row states no rule in this checkout but the brain's channel states it, close MUST print instead `<ID>: its row states no rule here, but <ref> states it (<n> commit(s) this checkout lacks) — pull, then re-run close`, read offline and only when that refusal exists.
- **FR-010**: Close MUST print its refusals in one run: the anchor verdicts of the claims whose row exists, `claims are not green — …` when red, otherwise today's orphan refusal (MV-117) unchanged for FR-007's last case; then the non-gating lines, then the gating ones, then `claims do not cite the law this change makes — close refused; fix the lines above, then re-run close`. It MUST exit 1 once, and print no SDD close step, write no archive, stage nothing and release nothing before. A claim of no row MUST be named once, by its citation line, never evaluated against anchors. A close that refuses nothing MUST print what it printed before.
- **FR-011**: `change close --abandon` MUST refuse, exit 1 and archive nothing when the change owns a proposed row that states a rule, printing `<ID>: states a rule this abandoned change never verified — delete the row from .multivac/invariants.md (a proposed row may be removed), or close the change properly`. A row that still reads RESERVED MUST NOT refuse, anchored or not.

#### What says close says what close refuses

- **FR-012**: `verify`'s finished line (MV-80) MUST, when close's citation gate or its orphan check would refuse a finished change, read `finished, not pending — close refuses until: <first line>[ (+N more)] — then: multivac change close <slug>` and stay blocking under `--strict`; otherwise it MUST print today's text. It MUST compute this from the rows and anchors it already read, only when a change is finished, with its summary counts and exit code unchanged.
- **FR-013**: `change land`, once every repo is landed, MUST print after the armed line `  close refuses until: <line>` for each refusal of FR-007 to FR-009, the pull included, and end with `all stages landed — fix the line close refuses on above, then: multivac change close <slug>` (`fix the <n> lines` for several) instead of ``all stages landed — run `multivac change close <slug>` ``. A land with nothing to refuse MUST print what it printed before.
- **FR-014**: `change plan` MUST print each of FR-007's first, second, third, fifth and sixth cases as `claim <line> — close refuses this`, gating nothing. It MUST NOT print the other cases, which are the ordinary state of a change being planned; its existing "already in … not new" line stays the one for an `adds` row already in the law.
- **FR-015**: The brain's channel, for `land`'s channel line, close's and land's pull and `verify`'s brain read line, MUST be the brain's own entry's `channel:`, else the global `channel:`, else `origin/main` (MV-53).

#### One anchored set

- **FR-016**: "Anchored" MUST mean an anchor `verify` parses (the brain root's Markdown, `.multivac/*.md` and `.multivac/changes/*.md`), for `plan`'s "no anchor" line, the orphan check, the citation gate and both releases. Close and `--abandon` MUST read it once, before the archive moves the change file.

#### The words, the law and the upgrade

- **FR-017**: flow.md's gate line MUST read `` - `change close` refuses while a declared claim does not resolve, or cites no stated row this change adds, touches or retires ``.
- **FR-018**: Every published sentence and source comment this change makes false MUST be amended in the same change (MV-111): the site's guide, reference and concept pages, both copies of the multivac skill, DESIGN.md, the constitution's Principle III (a PATCH bump, no Sync Impact Report) and the tool's comments. None of them may show a claim statement or the claim form `{ id, statement }`, or say close checks that law and code ended consistent or that no blocking leg broke anywhere the change touched. The retire steps MUST say the tombstone's legs are verified at close when the change claims the row. The site's pages MUST name no row ID and no version string (MV-84).
- **FR-019**: The law MUST carry MV-150, filed proposed, stating the rule with its measurements and ceilings, every edge case above that states a limit marked a ceiling, and a dated note by MV-150 on each of MV-15, MV-45, MV-80 and MV-117 withdrawing only the sentences this change makes false. The change MUST declare exactly those four under `touches`, `[MV-150]` under `adds`, and nothing under `retires`.
- **FR-020**: The changelog's Unreleased section MUST say, under "Changed — read before upgrading", what an older multivac does with an ID-only change, to upgrade every consumer's pinned and global multivac first, to set `requires:` to the release carrying this change (MV-86), and that legacy statements keep working and in-flight changes are not converted. No `requires:` floor may be set on this change's branch.

#### Hand-offs (added before apply)

- **FR-021**: Every copy of the retired claim that `change close` verifies law and code "ended consistent" (close verifies only the rows the change claims) MUST be gone: DESIGN.md (two places), site/content/docs/concepts/philosophy.md, site/content/docs/concepts/the-change.md (two places), site/content/docs/guide/running-changes.md (two places), skills/multivac/SKILL.md (both copies), with the `absent` leg over `{*.md,.specify/memory/*.md,site/content/**,skills/**,.claude/skills/multivac/**} !CHANGELOG.md` on MV-150. The constitution is corrected once, in the same pass: Principle III's sentence ("`change close` verifies the rows the change claims") and the Governance Compliance line that says the law is "checked by `multivac verify` on every commit" (say what ships: verify gates the blocking legs on every commit and reports the rest) — version 3.0.2 (PATCH, re-gradable by the human), no Sync Impact Report committed.

### Key Entities

- **Claim**: a row ID a change file declares it makes true; legacy claims also carry a statement, read and written back, never created.
- **Citation line**: one per claim (the first defect in order) or per owned row, with whether it refuses close; read by close, land, plan and verify's finished line alike.
- **Declaration half**: the citation defects fixable before anything is built — no row, a short row, a retired row, an undeclared row, a row another change reserved — printed at plan.
- **Owned row**: a row the change adds, or a proposed row whose source names it.
- **Anchor site**: a parsed anchor's row ID and the brain-relative file it is written in.
- **Brain channel**: the ref the brain is published at — its own entry's `channel:`, else the global, else `origin/main`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A file holding `claims:\n  - MV-1\n` reads as one claim with no statement and writes back with no `statement`; a `{ id }` map writes back bare; a mixed list with `statement: "legacy: prose # kept"` round-trips byte for byte; each of six refused shapes names `claims: [<ID>]`; a claim carrying `statment:` is named by that key.
- **SC-002**: Over this brain's 131 change files, 130 write back identically under the old and the new reader, 0 differ, and the same 1 fails under both.
- **SC-003**: `change new` prints `3. claims: [ACME-2]` and the comment; the scaffold's claim lines shrink from 164 to 80 bytes; neither carries `statement` nor "Statements are prose".
- **SC-004**: With `note:` inside an open change's claim, `verify` exits as it did without the key and the ecosystem graph is not reported stale, `roadmap` lists the same open changes, and a code commit on the change's branch passes the code gate; `change plan`, `apply`, `land` and `close` each exit 1 naming `unknown key "note"`, with `git status` unchanged.
- **SC-005**: A landed change claiming only an ID whose row reads RESERVED makes close exit 1 with the unstated line and the summary and no archive; after the row is stated, close exits 0 and the archive holds `claims:\n  - <ID>`.
- **SC-006**: A red anchor, a claim of no row and an undeclared claim are named in one close run, with exactly two "close refused" lines.
- **SC-007**: A row stated at the brain's channel, fetched and not pulled, makes close and land name the pull and the count of commits lacking, never "state it"; after `git pull` close exits 0. With `channel: origin/trunk` on the brain's own entry, the line names `origin/trunk`.
- **SC-008**: `--abandon` over a stated own proposed row exits 1 and archives nothing; over a RESERVED row an anchor names it exits 0 and keeps the row.
- **SC-009**: A clean change's plan, apply, land, `verify --strict`, close and the verify after it print byte-identical output to the build before this change (257, 537, 520, 535, 655 and 298 bytes under codegraph); only `change new` grows, by 25 bytes.
- **SC-010**: Over this brain's history, 0 of 158 archived claims had a RESERVED row at their archive commit, 0 of 160 claims name a missing row, 0 fall outside `adds` ∪ `touches`, 0 are listed in `retires`, and 136 of 136 added rows are claimed: the gate would have refused none of the past closes.
- **SC-011**: A finished change whose claim is undeclared prints the refusing finished line under `--strict`, never "close it", and the printed summary agrees with the exit code.
- **SC-012**: Under speckit, opsx, graphify, codegraph and a code-less brain with two code repos, an unstated claim gives: land prints `close refuses until:`, `verify --strict` exits 1 with the refusing line, close exits 1; after the row is stated, `verify --strict` prints `close it` and close exits 0.
- **SC-013**: A claim anchored only in its change file is named by `land` and by `verify`'s finished line before close runs, and close's refusal text is unchanged.
- **SC-014**: An active row listed under `adds` makes close refuse with "not new; move it to invariants.touches", never "drop it from invariants.adds and the law".
- **SC-015**: A claim of a row the change retires refuses while the row is in force and, once the row reads retired, passes with its absent legs evaluated at close.
- **SC-016**: On a fresh `init --provider claude` brain, a change that adds nothing closes with `released unused reservation: INV-01` and the row is gone (today it is kept).
- **SC-017**: Moving `--abandon`'s anchor read after the archive fails the test that pins its order.
- **SC-018**: On this brain the text scan finds 221 IDs and the parse 147, and none of the 74 found only by the scan is an `MV-` ID, so no row of this brain changes fate.
- **SC-019**: Every leg of MV-150 and every leg added to the amended rows resolves; `verify --strict` exits 0 with nothing reported moved; the dated notes by MV-150 count 4; the retired-example leg goes from 7 matching lines to 0, and the "ended consistent" leg from 12 lines in 7 files to 0.
- **SC-020**: The changelog entry names MV-150 and the `requires:` floor, and the change's branch leaves `.multivac/config.yml` with no new `requires:`.

## Assumptions

- Enactment is the human's: MV-150 and the four notes are filed `proposed` and a human flips them in their own commit (MV-81). The notes and the row are dated 2026-09-29, or the day of the commit that writes them.
- The release number and the `requires:` floor are the release change's, not this one's: this change names the floor in the changelog as "the release carrying this change" and sets none.
- This brain keeps writing `statement:` in its own change files until `/home/user/multivac/dist` is rebuilt from the merged change and every build that reads the brain's change files is at least that release, because the brain==code hook runs the first build it finds and an older one reads an ID-only change as absent. So this change's own change file declares its claim as `- id: MV-150` with a `statement:`, and no in-flight change file is converted; a legacy statement is legal forever.
- The archived `.multivac/changes/archive/everything-multivac-owns.md` is not edited: it stays unparsed and absent from the ecosystem graph (a stated ceiling).
- `opsx-through-its-cli` (MV-147) closed with its row stated, so the case where its close would stop on an unstated MV-147 is moot. `graph-answers-where-asked` (#5, MV-148) and `codegraph-worktrees-and-verbs` (#6) merge before this change is applied, each stating its row before close, as their change files already declare.
- The row ID is MV-150; if `change new` reserves another, it is substituted everywhere, the count leg included.
- `verify-rooted-and-quiet` (#8) lands after this change and rebases on the finished line's refusing variant and the open-change map this change adds; the unparsed-change-file line is a follow-up (`unparsed-change-files-are-named`); trimming the multivac skill beyond the passages this change makes false is `skill-cites-references`' (#9), which keeps the corrected facts.
- Out of scope, with owners: rows a change only touches stay unverified at close unless claimed (decided, and the false sentence corrected instead); `claims` defaulting to `invariants.adds` (not planned); a released reservation still listed in an archive's `adds` (follow-up); anchors that name no row in verify's summary (#8 or an MV-20-family change).
