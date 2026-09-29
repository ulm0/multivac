---
description: "Task list for change-file-cites"
---

# Tasks: The change file cites, never restates

**Input**: Design documents from `/specs/077-change-file-cites/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli-output.md, quickstart.md

Tests are included: every claim here lands with a check (Constitution I, "tests ship with
behaviour"). Work in the change's worktree, `.multivac/worktrees/change-file-cites/brain`.
Line numbers are `62d4588`'s and are re-found at T001 on the branch head, after #5 and #6 have
merged; a print site is found by its text (plan.md, Composition). A test whose title an existing
`@anchor` leg reads keeps that title, and the task says which leg; a leg a task makes false, or
a string a leg reads that a task moves, is kept whole by that same task.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Confirm a clean worktree and a green build from its root: `git status --porcelain` empty, `corepack pnpm build` exit 0, the suite's test/pass/skip counts from `node --test "dist-test/**/*.test.js"` recorded (852 tests, 3 skipped at `62d4588`, plus #5's and #6's); confirm `change new` reserved MV-150 (substitute the ID everywhere otherwise, the `count=4` leg included); re-find every `file:line` of research.md and data-model.md on the branch head, the print sites of plan.md's Composition by their text; and dry-run with `git grep -c -E` the retired-example regex over `{site/content/**,skills/**,.claude/skills/multivac/**}` (7 lines), the "ended consistent" regex over `{DESIGN.md,.specify/memory/constitution.md,site/content/**,skills/**,.claude/skills/multivac/**}` (12 lines in 7 files), `statement: "\.\.\."|Statements are prose` over `src/**` (2) and `@anchor\[ \\t\]` in src/commands/change.ts (1)

## Phase 2: Foundational (Blocking Prerequisites)

The law first (Constitution III), then the types, predicates and helpers every story reads.

- [ ] T002 Write MV-150 into its reserved row in .multivac/invariants.md verbatim from research.md R16 (the bold title, the measured facts, **The rule.** with *A claim is an ID*, *Close checks the citation* and *What says close says what its citation gate refuses*, **What is mechanical**, and **Ceilings** with every edge case of spec.md that states a limit, "MV-86's `requires:` floor makes the brain loud and does not reach a consumer's run." kept verbatim) — one physical line, exactly seven `|`, authority `open`, state `proposed`, the date of this commit
- [ ] T003 Append `**Amended <date> by MV-150**: …` at the end of the statement cell of MV-15, MV-45, MV-80 and MV-117 in .multivac/invariants.md, verbatim from research.md R16's table, each withdrawing only the sentence it quotes; check the row and the notes against MV-118's and MV-120's `absent` regexes over .multivac/invariants.md (0 matches)
- [ ] T004 Confirm .multivac/changes/change-file-cites.md declares `touches: [MV-15, MV-45, MV-80, MV-117]`, `adds: [MV-150]`, `retires: []`, and its claim as `- id: MV-150` WITH a `statement:` (the legacy form, spec Assumptions: the pre-change `mvac` still reads this brain), with `repos: { brain: … }` and `landing_order: [[brain]]`
- [ ] T005 [P] In src/change/file.ts make `ChangeClaim.statement` optional with the legacy doc comment of data-model.md, add `const CLAIM_KEYS = ['id', 'statement'];` with its MV-150 doc ABOVE the "Every frontmatter key the lifecycle carries through a rewrite." comment so that comment stays on `KNOWN_KEYS` (critic gap 11; MV-117's `/const KNOWN_KEYS/` and MV-137's `/'claims', 'sdd_skipped',/` stay unique), and add `type ClaimKeys = 'name' | 'refuse'`
- [ ] T006 [P] In src/change/reserve.ts import `type ChangeFile` from ./file.js, add after `owns` (:39) the exported `stillReserved`, and `unused` and `reservedBy` per data-model.md, and make `releaseUnused`'s filter (:183-192) `.filter((r) => unused(r, slug, anchored))` — the literal `startsWith('RESERVED by change ')` moves into `stillReserved` and stays the only copy in `src` (MV-45's leg `/startsWith\('RESERVED by change '\)/` reads reserve.ts; never export it as a constant, research.md R15)
- [ ] T007 [P] In src/lib/config.ts add `export const brainChannel` beside `channelRef` (:65) per data-model.md: the `brain` key's entry, else the brain==code entry, through `channelRef`, else `cfg.channel ?? DEFAULT_CHANNEL`; MV-53's `/export const channelRef/` and `/DEFAULT_CHANNEL = 'origin\/main'/` unchanged
- [ ] T008 In src/commands/change.ts add `brainAnchorSites(brain)` — the one `await collectBrainAnchors(brain)` in the file, returning `{ claimId, file }[]` — and the pure `anchoredIds(sites)`; import `collectBrainAnchors` and `parseClaimRows` in ONE import from `../anchor/parse.js` (critic gap 11), and `brainChannel` from `../lib/config.js`

**Checkpoint**: the law states the change; the claim type, the RESERVED predicate, the channel and the anchor sites exist — user story work can begin

## Phase 3: User Story 1 - A claim is its row's ID, and nothing written before is lost (Priority: P1) 🎯 MVP

**Goal**: the reader takes a bare ID, a `{ id }` map and a legacy map; the writer writes the bare ID and gives a legacy statement back byte for byte; a stray claim key is named by readers and refused by writers; the scaffold, `change new` and `change plan` teach the ID form.

**Independent Test**: spec US1's test; quickstart.md Walk A steps 1–2 and Walk G.

- [ ] T009 [P] [US1] In test/change/file.test.ts add "a claim is its row's ID — MV-150": `claims:\n  - MV-1\n` reads `[{ id: 'MV-1' }]` and writes back with no `statement`; `- id: MV-2` writes back `- MV-2`; a mixed list with `statement: "legacy: prose # kept"` round-trips byte for byte; the six refused shapes (`- statement: x`, `- 1`, `claims: MV-1`, a numeric statement, `- id: ""`, `- ""`) throw a `ChangeError` matching `/claims: \[<ID>\]/` in both modes; `statment:` throws naming `claim MV-1: unknown key "statment" — a claim is its row's ID; state the rule in the row` under `{ claimKeys: 'refuse' }` and, by default, reads `[{ id: 'MV-1' }]` with the notice captured; keep :65's prose round trip and :88's colon error (MV-15's leg `/statement:[[:space:]]staleness:[[:space:]]block/` reads this file) (FR-001–FR-003, SC-001)
- [ ] T010 [P] [US1] In test/change/lifecycle-polish.test.ts update "the scaffold teaches: commented example with the status enum, and new prints the three edits" (:68, no leg reads it): :79 becomes `/3\. claims: \[ACME-2\]\s+# the rows close verifies; each states its rule/`, and add `doesNotMatch(out, /statement/)` and `doesNotMatch(body, /statement:|Statements are prose/)` (FR-004, FR-005, SC-003)
- [ ] T011 [P] [US1] In test/change/ledger.test.ts add "a stray claim key is named by every reader and refused only by the writers — MV-150" after "an unknown frontmatter key is named where it is dropped — MV-117" (:224): an open, applied change whose claim map carries `note:` → `verify` exits as it does without the key and prints the notice naming `unknown key "note"`; the `roadmap` listing counts it in flight; `renderEcosystem` still holds its change node; the code gate reads the change (a code commit on its branch passes); `change plan`, `apply`, `land` and `close` each exit 1 with the refusal and leave `git status --porcelain` unchanged; `roadmap sync` with a stub tracker leaves the file byte-identical (FR-003, SC-004)
- [ ] T012 [P] [US1] In test/change/change.test.ts add "plan names a legacy statement as a restatement, and gates nothing — MV-150": one `restates the row — kept as written` line per legacy claim, none for an ID-only claim, rc as without it; the `statement` literal at :83 stays (it compiles, `statement` is optional) (FR-006)
- [ ] T013 [P] [US1] In test/doors/ecosystem-graph.test.ts extend the fixture writer (:42) with an ID-only change: its `claims` edge exists beside the legacy one's, and 'the graph holds declarations only …' (MV-139's leg `/the same bytes twice/` reads it) still asserts "no statement text" (FR-001)
- [ ] T014 [P] [US1] In test/change/lifecycle-polish.test.ts add "a legacy claim keeps its statement through apply, land and close — MV-15, MV-150": the archive's `statement:` is byte-equal to the declared one (FR-001)
- [ ] T015 [US1] In src/change/file.ts rewrite the claim reader of `normalizeChange` (:176-189) per data-model.md: the bare branch spelled `if (typeof c === 'string' && c !== '')`, the map branch refusing a missing or empty `id` and a non-string `statement`, the two refusal texts of contracts/cli-output.md, the stray-key message built once and used by both modes (`claimKeys` parameter, default `'name'`, warning beside MV-117's notice; `'refuse'` pushing it into the errors); give `parseChange` `opts: { claimKeys?: ClaimKeys }` and pass `{ claimKeys: 'refuse' }` from `loadChange` (:344-371) (FR-001–FR-003)
- [ ] T016 [US1] In src/change/file.ts make `serializeChange` (:282) write `change.claims.map((c) => (c.statement === undefined ? c.id : { id: c.id, statement: c.statement }))`; keep `lineWidth: 0` and reword its comment to "a legacy statement comes back the way it was written" (MV-15's `/lineWidth:[[:space:]]*0/` holds) (FR-001)
- [ ] T017 [US1] In src/change/file.ts `scaffoldChange` (:303) replace the claim example line and the two "Statements are prose" lines with `    # claims: [<ID>] — the rows close verifies; each row states its own rule`, keeping MV-110's DROPPED sentence and MV-146's closing sentence byte for byte (MV-146's `/below the closing ---, is yours\./` absent leg reads src/**, which the kept sentence satisfies as today; file.test.ts:238 passes); `scaffoldPlanned` unchanged (FR-004)
- [ ] T018 [US1] In src/commands/change.ts `cmdNew` (:913) make the third edit `` `  3. claims: [${reserved?.id ?? '<ID>'}]`.padEnd(48) + '# the rows close verifies; each states its rule' `` (FR-005)
- [ ] T019 [US1] In src/commands/change.ts `cmdPlan`'s claim loop (:1004-1009) print `claim ${c.id}: its statement: restates the row — kept as written; a claim is its ID, and the row states the rule (MV-111)` for each claim with a statement, gating nothing, under a comment that an older multivac cannot read the bare form (FR-006)
- [ ] T020 [US1] In src/commands/roadmap.ts `roadmap sync` (:226) parse with `{ claimKeys: 'refuse' }`, so its write-back (:271) never drops a stray claim key; the listing (:77) and `roadmap add` (:146) keep the default (FR-003)

**Checkpoint**: User Story 1 is functional and testable on its own

## Phase 4: User Story 2 - Close checks what each claim cites before anything is archived (Priority: P1)

**Goal**: close names every citation defect in one run before it writes anything, the pull when the brain's own channel states the row; `--abandon` refuses a stated own row.

**Independent Test**: spec US2's test; quickstart.md Walks A (steps 4–7), D, F and H.

- [ ] T021 [P] [US2] Create test/change/cite-lines.test.ts with "one line per claim, the first reason in order — MV-150": a pure `citeLines` call per kind of data-model.md — `no-row`, `short-row`, `retired` (not under `retires`), `retiring` (under `retires`, still active), a retired row under `retires` giving NO line, `undeclared`, `reserved-elsewhere` naming the other slug, `unstated` with and without a legacy statement, `orphan` (every site in `.multivac/changes/<slug>.md`) and not orphan with one site elsewhere, `not-new` for an active `adds` row and never "drop it from … the law", `unclaimed`, `unanchored` with `gates: false`, a RESERVED unanchored unclaimed add giving no line, one line per claim when two reasons hold; `abandonLines` over a stated own proposed row, a RESERVED one and an active one; `DECLARATION_KINDS` deep-equals the five of data-model.md (FR-007, FR-008, FR-011)
- [ ] T022 [P] [US2] In test/change/ledger.test.ts add "close refuses a claim whose row was never stated — MV-150": an ID-only claim of a RESERVED row → rc 1, the unstated line and the summary, no archive, `git status --porcelain` unchanged; the row stated → rc 0, the only `<ID>:` line is `<ID>: ok`, the archive holds `claims:\n  - <ID>` (FR-007, FR-010, SC-005)
- [ ] T023 [P] [US2] In test/change/ledger.test.ts add "a legacy statement is told to move into its row, not restated again — MV-150": the same with `- id: <ID>` and a statement → `move this claim's legacy statement: into the row` (FR-007)
- [ ] T024 [P] [US2] In test/change/ledger.test.ts add "every citation defect is named in one run, beside the red claims — MV-150": a claim with a red anchor, `NOPE-99` and a claim of an undeclared row → the red line, `claims are not green`, `NOPE-99: no row …`, the undeclared line, the summary; exactly two lines matching `close refused`; `NOPE-99` never evaluated against anchors (FR-007, FR-010, SC-006)
- [ ] T025 [P] [US2] In test/change/ledger.test.ts add "--abandon refuses a change whose own row states a rule nobody verified — MV-150": rc 1, the abandon line, nothing archived; with the row back to RESERVED, rc 0 (FR-011, SC-008)
- [ ] T026 [P] [US2] In test/change/ledger.test.ts add "a retiring change's claim verifies its tombstone at close — MV-150": a change retiring and claiming a row → rc 1 with the `retiring` line while the row is active; flipped to `retired` with a tombstone and a holding `absent` leg → rc 0; the leg broken → the claims are not green (FR-007, SC-015)
- [ ] T027 [US2] In test/change/ledger.test.ts keep the title "close refuses a claim it would orphan by archiving — MV-117" (:176; MV-117's leg `/close refuses a claim it would orphan by archiving/` reads it) and change its fixture to claim the reserved ID in bare form with its row stated — `MV-01` is no row in that fixture and would now stop at `no-row`; it still asserts rc 1, `anchored ONLY in`, the ID, and no archive (FR-007, SC-013)
- [ ] T028 [P] [US2] In test/change/lifecycle-polish.test.ts add "a row stated upstream is pulled, not stated twice — MV-150": `publishedBrain`, a second clone pushes the stated row, fetch without pull; close's stderr holds `its row states no rule here, but origin/main states it (1 commit(s) this checkout lacks) — pull, then re-run close` and never `state it in .multivac/invariants.md`; after `git pull`, rc 0 (FR-009, SC-007)
- [ ] T029 [P] [US2] In test/change/lifecycle-polish.test.ts add "a brain entry's own channel is the ref land and close read — MV-150": `repos: { brain: { path: ., channel: origin/trunk } }`, the row stated on `trunk` → close's pull line and land's channel line name `origin/trunk`; with no entry `channel:` both name `origin/main` as before (FR-015, SC-007)
- [ ] T030 [US2] In test/change/concurrency.test.ts update 'close keeps a reservation anchored in the change file it archives' (:206; no leg reads the title): close now returns 1 (reserved, anchored, claimed by nothing) and the row is kept (`a reservation an anchor names is never released`); then drop the anchor and `--abandon` kept-two and commit, so the shared brain is what the next test expects; and IN THIS SAME TASK add "--abandon reads anchors before archive moves the change file (MV-45)" on its own `makeScratchEcosystem`, asserting `anchors are read before archive moves the file` — MV-45's leg `/anchors are read before archive/` reads that string, which leaves :206's assertion here and must never be absent from the file; 'close keeps a reservation whose rule has been stated' (:182, MV-45's `/a stated rule survives close/`) stays unchanged (FR-008, FR-016, SC-017)
- [ ] T031 [US2] In src/change/reserve.ts append `CiteKind`, `CiteLine`, `AnchorSite`, `DECLARATION_KINDS` and the pure `citeLines(rows, change, anchors)` per data-model.md, every clause verbatim from contracts/cli-output.md, with its MV-150 doc comment — which says "the row is the only place the rule is written", never a clause's own words, since MV-150's `unique` legs read clauses in this file (FR-007, FR-008)
- [ ] T032 [US2] In src/change/reserve.ts append the pure `abandonLines(rows, change)` per data-model.md (FR-011)
- [ ] T033 [US2] In src/commands/change.ts add `statedUpstream(brain, cfg, ids)` and `citeText(line, upstream)` beside `channelEvidence` per data-model.md — `ref = brainChannel(cfg)`, `revParse`, `git show <sha>:.multivac/invariants.md` through `gitRun`, `parseClaimRows`, `stillReserved` (change.ts never spells the RESERVED literal), `rev-list --count HEAD..<sha>` — and make `channelEvidence`'s ref (:365) `brainChannel(cfg)` (FR-009, FR-015)
- [ ] T034 [US2] In src/commands/change.ts `cmdClose`'s `--abandon` path (:1306-1346), after the "declares N claim(s)" refusal, refuse on `abandonLines((await readLaw(brain))?.rows ?? [], parsed.change)` (each line warned, return 1), and read the anchors through `anchoredIds(await brainAnchorSites(brain))` before `archiveChange`, keeping the MV-45 comment (FR-011, FR-016)
- [ ] T035 [US2] In src/commands/change.ts `cmdClose`'s main path, after the unlanded check (:1383-1390): read the sites once under the moved comment (keep "before archive moves the change file" — MV-45's leg; say "a directory the collector never walks" instead of `lsFiles`), `readLaw`, `citeLines`, `statedUpstream` only when an `unstated` line exists; evaluate `closeGate` over the claims whose row exists; print its lines, then `claims are not green — …` when red, else MV-117's refusal for the `orphan` lines, byte for byte (`anchored ONLY in` stays unique in change.ts); then the non-gating lines (`say`), the gating ones but `orphan` (`warn`, through `citeText`), `claims do not cite the law this change makes — close refused; fix the lines above, then re-run close`; return 1 once, before `runSdd('close')`; delete the second anchor read (:1426) and pass `anchoredIds(sites)` to `releaseUnused` (FR-007–FR-010, FR-016)

**Checkpoint**: User Stories 1 and 2 work; close never archives a claim whose rule is written nowhere

## Phase 5: User Story 3 - Every surface that says "close" says what close will refuse (Priority: P1)

**Goal**: verify's finished line, land's last-repo lines and plan read the same predicate; land names the pull; the brain's own channel is read everywhere.

**Independent Test**: spec US3's test; quickstart.md Walks A (steps 4–5), B, C, F and H.

- [ ] T036 [P] [US3] In test/verify/verify.test.ts add "a finished change names what close would refuse first, never a bare close — MV-150" (MV-80's new leg): a landed change whose claim is undeclared → under `--strict` the finished line matches `close refuses until: <ID>: claimed, but this change neither adds, touches nor retires it` and `— then: multivac change close <slug>`, never `close it:`, and `agrees(code, out)` (:542) holds; a clean one prints today's line (FR-012, SC-011)
- [ ] T037 [US3] In test/verify/verify.test.ts give `writeChange` (:366-396) `touches: [<claimIds>]`, keeping its legacy `statement:` lines so the fixture still exercises the legacy read; the MV-80 tests it serves keep their titles (MV-80's legs read 'a finished change is refused as unclosed, not excused as pending' at :462, 'a change with work left is still pending, and still does not block', 'an empty declaration is not finished by vacuity, and neither is an unlanded one'); without this edit :476 fails (measured, research.md R17)
- [ ] T038 [P] [US3] In test/change/lifecycle-polish.test.ts add "landing the last repo names what close will refuse — MV-150": an unstated claim → `  close refuses until: <ID>: its row states no rule yet` after the armed line and the last line `all stages landed — fix the line close refuses on above, then: multivac change close <slug>`; two refusals → `fix the 2 lines`; a clean land prints `` all stages landed — run `multivac change close <slug>` `` (FR-013)
- [ ] T039 [P] [US3] In test/change/lifecycle-polish.test.ts add "land before pull names the pull, never a second statement — MV-150": the row stated on origin's main, local main fetched and behind → land's refusal line is the pull line, and no line says `state it in .multivac/invariants.md` (FR-013, SC-007)
- [ ] T040 [P] [US3] In test/change/lifecycle-polish.test.ts add "land and verify name a claim close would orphan — MV-150": the claim's only anchor in its change file, row stated → land prints `close refuses until: <ID>: anchored only in .multivac/changes/<slug>.md, which close archives`, `verify --strict`'s finished line names it, close refuses with MV-117's text unchanged (FR-007, FR-012, FR-013, SC-013)
- [ ] T041 [US3] In test/change/lifecycle-polish.test.ts make `claimAcme1` (:195-200) declare `touches = ['ACME-1']` and `claims = [{ id: 'ACME-1' }]`, so it models a clean change and land prints no refusal; the four MV-80 tests using it keep their titles (MV-80's legs read 'land reads landing from the channel: published bytes are the evidence a squash destroys', 'the channel verdict is per change, never behind the repo key --landed names', 'a channel that does not resolve says so, instead of going quiet about landing' and 'landing the last repo says the strict gate is now armed, and CI runs it'); the literal at :235 stays
- [ ] T042 [P] [US3] In test/change/change.test.ts add "plan names what close will refuse on the declaration, and gates none of it — MV-150": `NOPE-1` → `claim NOPE-1: no row in .multivac/invariants.md — … — close refuses this`, an undeclared claim likewise, a claim of a row under `retires` still active and an unstated claim → no such line; rc as without them (FR-014)
- [ ] T043 [US3] In src/commands/verify.ts add `OpenChanges.changes` (:65-70) filled in `openChangeClaims` (:83-118) for open changes only, `changes: new Map()` in the claim-scoped literal (:934-936), `Evaluated.closeRefusals` (:849-864), computed after `finished` (:944) only when it is non-empty — per finished slug, `citeLines(rows, change, collected.anchors)` gating lines' `text` — and returned (:973-986); `finishedChanges(claims, open)` unchanged (MV-80's `unique` leg) (FR-012)
- [ ] T044 [US3] In src/commands/verify.ts make the finished line (:1184-1192) print `finished, not pending — close refuses until: ${why[0]}${why.length > 1 ? ` (+${why.length - 1} more)` : ''} — then: multivac change close ${slug}` when `closeRefusals` holds lines for the slug, today's text otherwise, blocking under `--strict` as before — the name and shape `verify-rooted-and-quiet` rebases on; no second `close refuses until: ` in the file (MV-80's new `unique` leg) (FR-012)
- [ ] T045 [US3] In src/commands/verify.ts make `bChannel` (:712) `brainChannel(cfg)` (FR-015)
- [ ] T046 [US3] In src/commands/change.ts `cmdLand`, once every repo is landed, compute the gating `citeLines` over `readLaw` and `brainAnchorSites`, call `statedUpstream` when one is `unstated`, print `  close refuses until: ${citeText(l, upstream)}` after the unchanged armed line (MV-80's `refuses \$\{slug\} as unclosed \(MV-80\), here and in CI` holds), and end with the final line's variant of contracts/cli-output.md; nothing changes when there is nothing to refuse; no comment in the file spells `close refuses until: ` (MV-80's new `unique` leg) (FR-013)
- [ ] T047 [US3] In src/commands/change.ts `cmdPlan`, after the claim loop, print `claim ${l.text} — close refuses this` for each `citeLines` line whose kind is in `DECLARATION_KINDS`, gating nothing; the existing "already in … not new" line stays (FR-014)

**Checkpoint**: User Stories 1–3 work; nothing tells an operator to close a change close will refuse on its citation gate

## Phase 6: User Story 4 - "Anchored" is one set (Priority: P2)

**Goal**: plan's "no anchor" line, the gate and both releases read the anchors `verify` parses.

**Independent Test**: spec US4's test; quickstart.md Walk E.

- [ ] T048 [P] [US4] In test/change/concurrency.test.ts add "an unused reservation named only by anchor text outside the parsed files is released" (MV-45's new leg): a doc under a subdirectory carrying `<!-- @anchor <ID> … -->` for the reserved ID → close prints the release and the row is gone (FR-016)
- [ ] T049 [P] [US4] In test/init/equip.test.ts add "a fresh claude-door brain gives its first unused reservation back — MV-45, MV-150": `init --provider claude`, `change new leak`, `repos: { brain: { status: landed } }`, close → `released unused reservation: INV-01` and no `| INV-01 |` row (SC-016)
- [ ] T050 [US4] In src/commands/change.ts delete `anchoredClaimIds`' text scan (:627-640, the `@anchor[ \t]+` regex over `lsFiles`), route `cmdPlan`'s "no anchor" line through `anchoredIds(sites)` from the one `brainAnchorSites` read `cmdPlan` shares with T047, and drop `lsFiles` from the git import (:23), its only caller gone (critic gap 11) (FR-016)
- [ ] T051 [US4] Mutation check M1: move `--abandon`'s anchor read after `archiveChange` in src/commands/change.ts, rebuild, run test/change/concurrency.test.ts and see "--abandon reads anchors before archive moves the change file (MV-45)" fail (11 tests, 1 fail at the design's base); revert (SC-017)

**Checkpoint**: User Stories 1–4 work; the release and the gate read one set

## Phase 7: User Story 5 - The words say cite, in every copy (Priority: P3)

**Goal**: every surface teaches `claims: [<ID>]` and says what close really checks; the constitution's Principle III sentence is corrected by a PATCH.

**Independent Test**: spec US5's test; quickstart.md Walk J step 3.

- [ ] T052 [P] [US5] In test/doors/flow.test.ts (:135) assert the whole new gate line, `` /`change close` refuses while a declared claim does not resolve, or cites no stated row this change adds, touches or retires/ `` (the old regex is its prefix; no leg reads the test) (FR-017)
- [ ] T053 [US5] In src/doors/flow.ts (:50) make the gate line that of contracts/cli-output.md (FR-017)
- [ ] T054 [P] [US5] Amend site/content/docs/guide/running-changes.md: :82 and :121 to the contract's `3. claims: [INV-02]` and `# claims: [<ID>] — …` lines; :140-143 to "**`claims`** — the IDs of the rows this change makes true. A claim is an ID and nothing else: the row states the rule, so state it there before close. Draft the anchors now, while you know exactly what the change promises. `close` refuses a claim of no row, of a row the change neither adds, touches nor retires, of a retired row it does not retire, or of a row that still reads RESERVED, and a row you add and anchor without claiming it."; :160-162 to `claims: [INV-02]`; one sentence after :300 that the last `land` names what close would refuse; :369-370 without "checks law and code ended consistent" (close verifies each declared claim, its anchors and its row; a row you only amend is checked at close when you claim it, and on every commit by the hook); :391 "— the new legs hold you to it at close when the change claims the row"; no row ID, no version string (MV-84; MV-133's heading `### The SDD files ride onto the branch` kept) (FR-018)
- [ ] T055 [P] [US5] Amend site/content/docs/reference/commands.md: the three-edits sample (:1255); `plan` — the legacy notice and the declaration lines, non-gating; the finished line (:510) — add the refusing variant; after the armed-line sample (near :1534) — the `close refuses until:` notice and the final line's variant; `close`, after "Then re-verifies **only the claims this change declared**" (~:1564) — the citation block with the contract's code-less sample (carrying `claims do not cite the law this change makes`, MV-150's site leg), the pull variant, the unanchored line and "every refusal in one run"; `--abandon` (~:1642) — the stated-row refusal, keeping `used meaning the rule was stated` (MV-45's leg) and MV-80's matrix row; no row ID and no version string: a sample line that prints a row of multivac's own law (the legacy notice's `(MV-111)`, the short-row clause's `(MV-119)`) shows it as `…`, as the armed-line sample at :1534 already does, and every other ID is a user's `INV-nn` (MV-84) (FR-018)
- [ ] T056 [P] [US5] Amend site/content/docs/concepts/the-change.md (:57-61): add "every claim cites a row this change adds, touches or retires, and that row states its rule" to the list close refuses to archive until (FR-018)
- [ ] T057 [P] [US5] Amend skills/multivac/references/change.md: :104-106 to "4. **Claims** — the IDs of the rows it makes true. The row states the rule; the claim cites it and never restates it. This is the contract `close` verifies. Draft the anchors now (`anchors.md`), while you know exactly what the change promises — after merge nobody remembers."; :175-180 to what close refuses (every claim resolves ok on its anchors, cites a row this change adds, touches or retires that states its rule, and every row the change adds and anchors is claimed; a row the change only touches is verified here only when claimed, and by the pre-commit hook on every commit), withdrawing "every 'amends INV-xx' ended consistent" and "no blocking leg broke anywhere the change touched"; :315 "the new legs will hold you to it at close when the change claims the row"; MV-51's, MV-52's, MV-57's and MV-89's legs on this file hold (FR-018)
- [ ] T058 [P] [US5] Amend skills/multivac/SKILL.md (:76-78) item 4's last sentence to say close verifies each claim the change declares — its anchors resolve and its row states the rule — with no "checks law and code … consistent"; :72-74 (cite by ID) and MV-53's, MV-72's, MV-89's, MV-136's, MV-141's legs on this file unchanged (FR-018)
- [ ] T059 [P] [US5] Amend DESIGN.md: :204-212's heading "### The tool owns the frontmatter, so prose can be prose" to "### The tool owns the frontmatter, and a claim is an ID" with a paragraph saying a claim cites its row, the row is the statement (MV-111), and a legacy `statement:` still round-trips through the one serializer that never folds, a hand-edit's YAML error still teaching the quoted rewrite; :783-784 to "`close` verifies each declared claim against its anchors and its row" with no "ended up consistent" (MV-80's `every declared repo landed \| reported, exit 0 \| exit 1` and every other leg on DESIGN.md hold) (FR-018)
- [ ] T060 [P] [US5] Amend .specify/memory/constitution.md Principle III (:45-47): "`change close` verifies that law and code ended consistent" becomes that `change close` verifies each claim the change declares — its anchors resolve and its row, one the change adds, touches or retires, states the rule; bump `**Version**` 3.0.1 → 3.0.2 (PATCH, a clarification) and `**Last Amended**` to this commit's date; commit no Sync Impact Report (MV-146's `/Sync Impact/` absent leg, MV-120's `2\.0\.[01]` absent leg, MV-126's leg hold) (FR-018)
- [ ] T061 [P] [US5] Fix the source comments this change makes false: src/commands/change.ts's `anchoredClaimIds`/`brainAnchorSites` doc ("every claim ID an anchor `verify` parses names … never `@anchor` text in any tracked file" — no literal `@anchor[ \t]`), the MV-117 comment block in `cmdClose` (the orphan check reads the one predicate), and src/change/file.ts's "Validate a parsed frontmatter object" comment left above `CLAIM_KEYS`' doc (FR-018)

**Checkpoint**: User Stories 1–5 work; no surface teaches claim prose or overclaims close

## Phase 8: User Story 6 - The upgrade is said, not discovered (Priority: P3)

**Goal**: the changelog says what an older multivac does with an ID-only change before any brain writes one; no floor is set on this branch.

**Independent Test**: spec US6's test; quickstart.md Walks I and J step 5.

- [ ] T062 [US6] Record the change in CHANGELOG.md's Unreleased section under "**Changed — read before upgrading**", from contracts/cli-output.md's entry (MV-150: an older multivac reads an ID-only change as absent; upgrade every consumer's pinned and global multivac first; set `requires:` to the release carrying this change, with or after it; legacy statements keep working and in-flight changes are not converted; what close, `--abandon`, verify, land and plan now say), and update the section's lead-in count of behaviours that can newly refuse what used to pass (FR-020, SC-020)
- [ ] T063 [US6] Leave .multivac/config.yml's `requires:` unset on this branch and say in .multivac/changes/change-file-cites.md's body that the floor is the release change's (critic gap 7) (FR-020, SC-020)

**Checkpoint**: all six stories work

## Phase 9: Polish & Cross-Cutting Concerns

- [ ] T064 Run `multivac doors` with the rebuilt dist: .multivac/flow.md's gate line is FR-017's, .claude/skills/multivac/** is re-projected from T057–T058, .multivac/ecosystem.json, AGENTS.md and CLAUDE.md re-rendered, never hand-edited
- [ ] T065 Write MV-150's 33 legs and the 11 legs on MV-45, MV-80 and MV-117 of research.md R15 under their rows in .multivac/invariants.md, once every task they read has landed, and dry-run each with `git grep -c -E` (globs through picomatch, as `verify` matches them): every `unique` leg 1, `citeLines\(` 3 in change.ts, `await statedUpstream\(` 2, `brainChannel\(cfg\)` 3, `claimKeys: 'refuse'` 2, the dated notes 4, every `absent` leg 0 — the retired-example leg down from 7, the "ended consistent" leg from 12 lines in 7 files (SC-019); and the legs that must not move of research.md R15 still resolve where they did
- [ ] T066 Build and run the full suite (`corepack pnpm test`, against T001's counts plus this change's tests); `multivac verify --strict` exits 0 with every claim anchored and nothing reported `moved`; `grep -c 'Amended <date> by MV-150' .multivac/invariants.md` is 4 (SC-019)
- [ ] T067 Walk quickstart.md A–J in scratch with the real spec-kit 1.0.11, openspec 1.13.2, graphify 0.9.29 and codegraph 1.6.0, `HOME` isolated, each `cd` and mutating command in one `&&` chain, the `mvac` wrapper first on PATH, and record the results in .multivac/changes/change-file-cites.md's body (SC-002–SC-016, SC-018, SC-020)
- [ ] T068 Run `graphify update .` so graphify-out/graph.json matches the change; `change land` commits it on the change branch

## Dependencies & Execution Order

- **Phase 1 → Phase 2**: T001 before everything. T002 → T003 → T004 (the law before the code, Constitution III). T005, T006 and T007 run beside each other after T004; T008 after T007 (it imports `brainChannel`).
- **US1 (Phase 3)** needs T005. Its tests (T009–T014) are written first and fail; T015 → T016 → T017 (one file), then T018 → T019 (change.ts), T020 alone (roadmap.ts, after T015's option exists).
- **US2 (Phase 4)** needs T006, T007, T008 and US1's reader (T015): T031 → T032 (reserve.ts); T033 → T034 → T035 (change.ts, after T019). T030 carries the MV-45 string move and the new `--abandon` test in one task.
- **US3 (Phase 5)** needs T031 (`citeLines`) and T033 (`statedUpstream`, `citeText`): T043 → T044 → T045 (verify.ts); T046 → T047 (change.ts, after T035); T037 and T041 adjust fixtures the new predicate would otherwise refuse and go before running their files.
- **US4 (Phase 6)** needs T008 and T035; T050 after T047 (plan shares one site read); T051 after T034.
- **US5 (Phase 7)** needs nothing but the wording decisions: T052 → T053; T054–T061 in parallel.
- **US6 (Phase 8)** is independent: T062, T063.
- **Polish (Phase 9)** after every story: T064 after T057–T058 and T053; T065 after T064 (the retired-example and "ended consistent" legs read the re-projected skill copy); T066 after T065; T067 after T066; T068 last.
- Same-file tasks never run in parallel: .multivac/invariants.md (T002, T003, T065), src/change/file.ts (T005, T015–T017, T061), src/change/reserve.ts (T006, T031, T032), src/commands/change.ts (T008, T018, T019, T033–T035, T046, T047, T050, T061), src/commands/verify.ts (T043–T045), test/change/ledger.test.ts (T011, T022–T027), test/change/lifecycle-polish.test.ts (T010, T014, T028, T029, T038–T041), test/change/concurrency.test.ts (T030, T048), test/verify/verify.test.ts (T036, T037), test/change/change.test.ts (T012, T042).

## Parallel Example: User Story 1

```text
T009 test/change/file.test.ts          T010 test/change/lifecycle-polish.test.ts
T011 test/change/ledger.test.ts        T012 test/change/change.test.ts
T013 test/doors/ecosystem-graph.test.ts
then T015 → T016 → T017 (file.ts) beside T018 → T019 (change.ts); T020 (roadmap.ts)
```

User Story 2: T021 (new file) beside T022 (then T023–T027, one file) beside T028 (then T029) beside T030; then T031 → T032 beside T033 → T034 → T035.
User Story 3: T036 (then T037) beside T038 (then T039–T041) beside T042; then T043 → T044 → T045 beside T046 → T047.
User Story 5: T052, T054, T055, T056, T057, T058, T059, T060 together; then T053, T061.

## Implementation Strategy

MVP first: Phases 1–4. After T035 a claim is an ID, nothing written before is lost, and close
refuses every citation defect in one run before it writes anything — quickstart.md Walk A steps
1–2 and 6–7 pass and Walk H's cases refuse at close. Then US3, so CI and land stop printing an
instruction close rejects, before anyone relies on the new close; then US4, US5 and US6 in any
order. The change lands as one: `change close` verifies MV-150's legs, which need every story and
the Polish phase, and this change's own close runs the new gate on its own claim (MV-150, stated
by T002, anchored by T065).

## Coverage

| Requirement | Tasks |
| --- | --- |
| FR-001 | T005, T009, T013, T014, T015, T016 |
| FR-002 | T009, T015 |
| FR-003 | T009, T011, T015, T020 |
| FR-004 | T010, T017 |
| FR-005 | T010, T018 |
| FR-006 | T012, T019 |
| FR-007 | T021, T022, T023, T024, T026, T027, T031, T035, T040 |
| FR-008 | T021, T030, T031, T035 |
| FR-009 | T028, T033, T035 |
| FR-010 | T022, T024, T035 |
| FR-011 | T021, T025, T032, T034 |
| FR-012 | T036, T040, T043, T044 |
| FR-013 | T038, T039, T040, T046 |
| FR-014 | T042, T047 |
| FR-015 | T007, T029, T033, T045 |
| FR-016 | T008, T030, T034, T035, T048, T050 |
| FR-017 | T052, T053, T064 |
| FR-018 | T054, T055, T056, T057, T058, T059, T060, T061, T064, T065 |
| FR-019 | T002, T003, T004, T065 |
| FR-020 | T062, T063 |
| SC-001 | T009 |
| SC-002 | T001, T067 (Walk J) |
| SC-003 | T010, T067 (Walk A) |
| SC-004 | T011, T067 (Walk G) |
| SC-005 | T022, T067 (Walk A) |
| SC-006 | T024, T067 (Walk H) |
| SC-007 | T028, T029, T039, T067 (Walk F) |
| SC-008 | T025, T067 (Walk H) |
| SC-009 | T067 (Walk C) |
| SC-010 | research.md R4 (historical, re-run from its commands at T001) |
| SC-011 | T036 |
| SC-012 | T067 (Walks A–D) |
| SC-013 | T027, T040, T067 (Walk H) |
| SC-014 | T021, T067 (Walk H) |
| SC-015 | T021, T026, T067 (Walk H) |
| SC-016 | T049, T067 (Walk E) |
| SC-017 | T030, T051 |
| SC-018 | T001, T067 (Walk J) |
| SC-019 | T065, T066 |
| SC-020 | T062, T063, T067 (Walk J) |

## Notes

- **Where this plan goes beyond the design**, each recorded in research.md: `roadmap sync`
  refuses a stray claim key as a writer (R2); a claim of a row the change retires is allowed once
  retired (R5, the critic's first option); the orphan check is a citation kind while close keeps
  MV-117's text (R6); `brainChannel` also moves `channelEvidence` and verify's `bChannel` (R8);
  verify's finished line does not read the channel, a stated ceiling (R8).
- **No test title an `@anchor` leg reads is changed.** The one string a leg reads that moves is
  MV-45's `anchors are read before archive`, from concurrency.test.ts:206's assertion to the new
  `--abandon` test in the same file, by the same task (T030), so the leg never goes without a match.
- The retired-example leg reads `skills/**` and `.claude/skills/multivac/**`: no new text in those
  copies may carry `statement: "..."`, `**Claims it makes true**` or an indented `statement:`; the
  "ended consistent" leg reads the constitution and DESIGN.md too, so their rewrites avoid
  `checks law and code` and `ended (up )?consistent`.
- Site pages name no row ID of multivac's own law and no version string (MV-84; `git grep -c -E
  'MV-[0-9]+' -- 'site/content/**'` is 0 today and stays 0): the reference's sample output uses a
  user's `INV-nn` IDs, prints `…` where a line cites `(MV-111)` or `(MV-119)`, as the armed-line
  sample already elides `(MV-80)`, and never names a release; the changelog, which is not a site
  page, names MV-150.
- This change's own change file keeps its legacy `statement:` (T004); converting it waits for the
  rebuilt dist on this brain (spec Assumptions).

## Phase 10: Hand-offs (added before apply)

- [ ] T069 Retire every copy of "ended consistent" (close verifies the claimed rows) in DESIGN.md, site/content/docs/concepts/{philosophy,the-change}.md, site/content/docs/guide/running-changes.md, skills/multivac/SKILL.md, correct Principle III and the Governance Compliance line ("checked by `multivac verify` on every commit") in .specify/memory/constitution.md in one amendment (3.0.2, last amended the day of the commit, no Sync Impact Report), and add the `absent` leg on MV-150 in .multivac/invariants.md, per FR-021
