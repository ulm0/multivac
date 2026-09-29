# Research: The change file cites, never restates

Two investigations (`claims-cite`, `close-gate`), six adversarial verdicts (guarantee kept,
every adapter, the saving is real, for each), one merged design with a synthesis prototype
built and run on `92c4c08`, and a completeness critic whose 11 gaps the spec folds in
(checklists/requirements.md maps each). Who measured a figure is marked: **(inv)** an
investigator, **(ver)** a verifier, **(synth)** the design's prototype run, **(critic)** the
completeness critic, **(plan)** re-measured for this plan on main at `62d4588` (#4
`opsx-through-its-cli` merged and archived, #5 `graph-answers-where-asked` promoted and
applied). Tokens are bytes/4. Every `file:line` below is `62d4588`'s and is re-anchored at
apply time, once #5 and #6 have merged (plan.md, Composition).

The scratch behind the figures, for whoever re-runs them:

```bash
SCR=/tmp/claude-0/-home-user-multivac/2009d32c-ec8a-53c2-87bc-5b2df689ff4a/scratchpad/c78
# investigators: $SCR/claims-cite, $SCR/close-gate; verifiers: $SCR/verify-{claims-cite,close-gate}-{guarantee,cross-adapter,measurement}
# prototype: $SCR/synth/proto (10 files, +526/−74 over 92c4c08, $SCR/synth/proto.diff); walks: $SCR/synth/{lc.sh,sk.sh}
# critic: $SCR/critic/{xk.sh,lbp.sh,lbt.sh,orph.sh,adds-active.mjs,addlaw.py,merged}
# plan: $SCR/../c7/{main-build,roundtrip.mjs,anchsets.mjs,law/} — 62d4588 built from `git archive`
```

## R1. A claim is its row's ID

Nothing in multivac reads `claims[].statement`: the parser, the serializer, the scaffold and
`change new`'s example line touch it, and no gate, door, graph or report does
(src/change/file.ts:28-31, :176-189, :282, :303; src/commands/change.ts:913) **(inv, ver)**.
Yet every claim carries one:

| What | Figure | Command |
| --- | --- | --- |
| claims carrying a statement | 160 of 160, 136 restating a row the same change added | `node measure.mjs` (claims-cite) **(inv)** |
| statements no longer verbatim in their row | 141 of 160; 139 of 158 already differed at the archive commit, 61 of those rows amended later | same **(inv)** |
| statements written at a close after the history root that were an exact copy then | 0 of 32 | `node m1.mjs /home/user/multivac` (verify-claims-cite-measurement) **(ver)** |
| archives that no longer parse because of a statement | 1 (`everything-multivac-owns.md:16`), dropping one change node and its 2 edges to MV-32 from `ecosystem.json` (479 → 480 nodes, 1,600 → 1,602 links once repaired) | `node eco.mjs` (claims-cite) **(inv)** |
| claim entries carrying any key besides `id` and `statement` | 0 of 160 | `node forms.mjs` (claims-cite) **(inv)** |
| claims block, corpus | 54,819 B as written; 3,278 B as `{ id }` maps; 2,638 B as bare IDs | same **(inv)** |

The skill already says to cite by ID in change files (skills/multivac/SKILL.md:72-74); the
scaffold teaches the opposite.

**Decision**: the written form is the bare ID, `claims: [MV-150]` (FR-001). A `{ id }` map is
read and written back bare; a legacy `{ id, statement }` is read and written back byte for
byte, never created. `ChangeClaim.statement` becomes optional and documented legacy. The
scaffold's example line becomes `# claims: [<ID>] — the rows close verifies; each row states
its own rule` and its two "Statements are prose" lines go (FR-004); `change new`'s third edit
becomes `  3. claims: [<ID>]`, padded to column 48, then `# the rows close verifies; each
states its rule` (FR-005).

**Rationale**: the row is the only copy that gates; a second copy drifts (141 of 160) and can
break a parse. A median 370 B of claims block (mean 507; the statements alone a median 350 B) is
no longer written per new change, over the 30 closes since the history root (R19).

**Alternatives considered**: `{ id }` maps as the canonical form — 640 B more than bare IDs
over the corpus and nothing to carry (0 of 160 extra keys). Dropping a legacy statement at the
next rewrite — it would be an MV-117 drop notice firing on every verify and every render, and
it deletes the only text of a rule whose row is still RESERVED (#4's MV-147 was in that state
when designed). Refusing unknown top-level keys — MV-117 keeps those a notice.

**Round trip (plan)**, old reader `62d4588` against the prototype's new one, over every file
under `.multivac/changes/` and its archive:

```text
$ node c7/roundtrip.mjs $SCR/synth/proto
{"files":131,"identicalOldVsNew":130,"differ":0,"bothFail":1,"newSerializeEqualsDisk":122}
```

The one failure is the unparsable archive, under both readers (SC-002). The design measured
the same five numbers on `92c4c08` **(synth)**.

## R2. A stray claim key is named by every reader and refused by every writer

The design put the refusal of an unknown claim key inside the one parser every reader calls.
Six readers drop a file that fails to parse without a word (src/commands/verify.ts:112-114,
src/commands/roadmap.ts:75-79 and :226, src/doors/ecosystem.ts:91-93, src/lib/code-in-change.ts:125-133,
which returns null and then prints the blocking code line). Measured **(critic)** with
`$SCR/critic/xk.sh $SCR/critic/binold` against `$SCR/critic/xk.sh $SCR/critic/bin` (speckit,
brain==code, the claim given `note: why this matters` in the worktree, then a code commit):
the old build gives rc 0, `0 blocking broken · exit 0`; the design's build gives rc 1, `code 1
code path (kept.txt) on xk, which is no open change declaring brain — start a change … ·
blocking`. In `$SCR/critic/xkey` the same key on `ci-moves-to-github-actions` turns `roadmap`
from `in flight: 2 open changes` into `1 open change — opsx-through-its-cli`, and `verify` adds
`ecosystem .multivac/ecosystem.json is stale` (`xkey-old.out`, `xkey-new.out`). Only `change
plan` named the problem.

Planning found a seventh reader that writes: `roadmap sync` parses each change file
(src/commands/roadmap.ts:226) and serializes it back to record a new issue number (:271), so a
reader that drops the key there loses it on disk (plan, reading the code).

**Decision**: `parseChange`/`normalizeChange` take `claimKeys: 'name' | 'refuse'`, default
`'name'` (data-model.md). In both modes the key is reported by one message built once:
`claim <ID>: unknown key "<k>" — a claim is its row's ID; state the rule in the row`
(`CLAIM_KEYS = ['id', 'statement']` beside `KNOWN_KEYS`). `'name'` warns it beside MV-117's
top-level notice and reads the claim without the key; `'refuse'` makes it a `ChangeError`.
`loadChange`, the funnel of every `change` subcommand, passes `'refuse'`, and so does `roadmap
sync`; `verify`, the `roadmap` listing, `renderEcosystem` and the code gate keep the default
(FR-003).

**Rationale**: a writer that drops a key loses rule prose silently, which is the one thing
the refusal exists to stop; a reader that drops the whole file makes the change vanish from
the gates that protect it, which is worse than the key. `roadmap sync` skips a refused file
through its existing catch, like any file it cannot parse; naming that skip belongs with the
other silent readers to `unparsed-change-files-are-named` (a ceiling, spec Edge Cases).

**Alternatives considered**: pulling `unparsed-change-files-are-named` into this change — it
reverses a documented decision (verify.ts:76-77, "never a reason for verify to say anything")
and needs its own row (MV-118). Dropping the key in every reader — MV-117's notice would be
the only trace and the next lifecycle rewrite would lose it; refused.

## R3. The legacy statement: kept, never created, named at plan

**Decision**: `change plan`'s claim loop prints, per legacy claim, `claim <ID>: its statement:
restates the row — kept as written; a claim is its ID, and the row states the rule (MV-111)`
(121 B, 0 for an ID-only claim), gates nothing and never asks for a conversion (FR-006).
`close` names the legacy case only where it matters: the `unstated` line of a legacy claim
says `move this claim's legacy statement: into the row` (R4).

**Rationale**: an older multivac cannot read the bare form (R13), so an in-flight change must
keep what it has; the notice teaches the form without costing the change anything.

**Alternatives considered**: a legacy notice at close — it adds bytes to every close of an
in-flight legacy change and teaches nothing new. A notice when `projected.yml` names an older
version — that file records who last projected the doors, not who reads the change files;
`requires:` (MV-86) is the declared lever. A printed row lead at plan or close to replace the
statement — bytes on every run (measurement verifier).

## R4. Close checks the citation: one pure predicate

Today close passes 11 of 16 bad declarations **(inv)** (`$SCR/close-gate/run.sh` s1…s6c): a
claim of no row, of a row the change neither adds nor touches, of a retired row, of a row
still reading `RESERVED by change <slug> — state the rule here before close.`, and a row the
change adds and anchors but never claims. History says the gate refuses no past close **(inv)**
(`measure.mjs`, claims-cite; `archive-stats.mjs`, close-gate): 0 of 158 archived claims had a
RESERVED row at their archive commit, 0 of 160 name a missing row, 0 fall outside `adds` ∪
`touches`, 0 are listed under `retires`, 136 of 136 added rows are claimed (SC-010).

Live files (plan, `node $SCR/synth/live-cite.mjs $SCR/synth/proto` over `62d4588`): 6 files
under `.multivac/changes/`, 5 clean, and `graph-answers-where-asked` reading `unstated:
MV-148 … move this claim's legacy statement: into the row` — #5's row is RESERVED on main and
stated on its branch before its own close. (The design's run on `92c4c08` had 7 files, 6 clean,
#4 unstated; #4 closed with MV-147 stated.)

**Decision**: `src/change/reserve.ts` gains `stillReserved` (the one home of the literal
`startsWith('RESERVED by change ')`, exported for `statedUpstream`), `unused` (MV-45's
condition, which `releaseUnused` now filters on), `reservedBy`, the types `CiteKind` and
`CiteLine`, `DECLARATION_KINDS`, and the pure `citeLines(rows, change, anchors)` (FR-007,
FR-008), whose kinds and texts are data-model.md's and contracts/cli-output.md's. Per claim,
one line, the first reason in this order, because each later advice is wrong while an earlier
one holds: `no-row`, `short-row`, `retired`, `retiring`, `undeclared`, `reserved-elsewhere`,
`unstated`, `orphan`. Then, per owned row no claim cites and no line names: `not-new`,
`unclaimed`, `unanchored` (non-gating); a row `unused` releases raises none. Close evaluates
only the claims that have a row (FR-010), so a claim of no row is named once.

**Rationale**: one predicate read by close, land, plan and verify's finished line means no
surface can promise what close refuses (MV-80). Pure, so it is tested per kind without a brain.

**Alternatives considered**: extending the gate to every touched row — 139 of 163 historical
touches are unclaimed, so the ordinary change would be refused; the false sentence that says
close does it is corrected instead (R12). Making `claims` default to `adds` (equal in 110 of
123 changes) — it changes what close verifies, a semantic question, not planned.

## R5. A retiring change may claim the row it retires

The design refused every claim of a retired row and every row under `retires`. The critic
**(critic)** found that this removes close's check of a tombstone: today a claim of a row the
change retires evaluates the tombstone's absent legs at close, and
skills/multivac/references/change.md:315 and site/content/docs/guide/running-changes.md:391
say "the new legs hold you to it at close".

**Decision**: `retired` refuses a retired row the change does NOT retire; `retiring` refuses a
row under the change's own `retires` that is not retired yet, saying what retiring takes; a
claim of a row the change retires, once it reads `retired`, passes the declaration half and is
evaluated on its absent legs as today. `undeclared` reads `adds` ∪ `touches` ∪ `retires`.
`retiring` is not a declaration kind: an unretired row is the ordinary state of a retiring
change at plan (FR-014). Both retire sentences gain "when the change claims the row" (FR-018).

**Rationale**: it keeps the one guarantee close gave a retirement, and history shows no past
change relied on the other reading (0 of 160 claims under `retires`).

**Alternatives considered**: refusing both and rewording the sentences to name the pre-commit
hook — it narrows what close checks with nothing gained.

## R6. The orphan check is a citation kind; what stays unannounced

`$SCR/critic/orph.sh` **(critic)**: a claim whose only anchor is inside the change file, row
stated. `land` printed ``all stages landed — run `multivac change close orp` ``, `verify --strict`
printed `finished … close it: multivac change close orp · blocking`, and close exited 1 with
`close refused — INV-01 is anchored ONLY in .multivac/changes/orp.md …`.

**Decision**: `orphan` is `citeLines`' last per-claim kind: a claimed ID whose parsed anchors
all sit in `changeRel(slug)`. `citeLines` takes the parsed anchor sites (`{ claimId, file }`)
so it can tell. Verify's finished line and land read it like every other kind. Close keeps
printing its MV-117 text for it, byte for byte, when the claims are green, as today (MV-117's
`anchored ONLY in` leg stays `unique` in change.ts), and leaves orphan lines out of its
citation block so the claim is named once. The SDD gate, `graphGate` and `graphTrackedGate`,
which close runs before its citation gate, are not announced by verify or land; the row, the
MV-80 note and the savings say "its citation gate", and the ceiling names them (the design's
piece D narrowed; spec Edge Cases).

**Alternatives considered**: a second orphan predicate in verify — two predicates disagree the
day one moves; narrowing the words alone — leaves CI red over a line close was always going to
refuse.

## R7. Owned rows: unclaimed refuses, unanchored says, not-new refuses

`node $SCR/critic/adds-active.mjs $SCR/proto` **(critic)**: INV-01, active, anchored, listed
under `adds`, unclaimed, got the design's `unclaimed` line, `… claim it, or drop it from
invariants.adds and the law`. Deleting an active row is refused by law-death (MV-117's leg
`state === 'active' || state === 'retired'`), so the advice is one the tool rejects. `plan`
already names the case without gating (src/commands/change.ts:996, `already in … (<state>) —
not new; move it to touches, or pick a free id`), so it reaches close.

**Decision**: `unclaimed` and `unanchored` apply to proposed owned rows only. A row under
`adds` whose state is anything but proposed, with no line already, gets `not-new`: `already in
.multivac/invariants.md (<state>) — not new; move it to invariants.touches`, gating (FR-008).
It is not a declaration kind: plan's own line already says it there, and printing both would
say it twice. A stated proposed owned row nothing anchors prints `unanchored` and passes.

**Rationale**: a proposed row never gates verify, so close is the only gate an anchored,
unclaimed row meets. A stated rule nothing can anchor — a process rule in a code-less brain —
must still be able to enter the law.

**Alternatives considered**: refusing `unanchored` (the investigator's s6b) — such a rule could
enter by no path, and claiming it hits "no anchors evaluated"; measured today rc 0, the
investigator's gate rc 1 (u6, verify-close-gate-cross-adapter) **(ver)**. It also keeps MV-45's
test string "a stated rule survives close, anchored or not" true.

## R8. Stated upstream: the pull, at close and at land, at the brain's own channel

**Decision (close)**: when an `unstated` line exists, `statedUpstream(brain, cfg, ids)` reads
`git rev-parse <ref>`, `git show <sha>:.multivac/invariants.md` and `parseClaimRows`, and for
each unstated ID the channel states, the line becomes `<ID>: its row states no rule here, but
<ref> states it (<n> commit(s) this checkout lacks) — pull, then re-run close`, `n` from `git
rev-list --count HEAD..<sha>` (FR-009). Offline (MV-01), and only on that refusal. Measured
**(synth)**: test "a row stated upstream is pulled, not stated twice" prints `ACME-2: its row
states no rule here, but origin/main states it (1 commit(s) this checkout lacks) — pull, then
re-run close`; after `git pull`, close exits 0.

**Land before pull** `$SCR/critic/lbp.sh` **(critic)**: the row stated on the change branch,
merged on origin, local main fetched but 2 behind. `land --landed brain` printed `channel:
every declared claim resolves at origin/main 62b778c …`, then `close refuses until: INV-01: its
row states no rule yet — … state it in .multivac/invariants.md`; close printed the pull. Land
already resolves the same ref for its channel line (src/commands/change.ts:359-389).
**Decision**: land calls `statedUpstream` the same way and prints the same pull line through
the same helper (FR-013); `await statedUpstream(` appears twice.

**The brain's own channel** `$SCR/critic/lbt.sh` **(critic)**: `repos.brain = { path: .,
channel: origin/trunk }`, the row stated on `origin/trunk`, the brain 2 behind: close said
"state it". `statedUpstream` copied `cfg.channel ?? DEFAULT_CHANNEL` from `channelEvidence`
(src/commands/change.ts:365) and verify's `bChannel` (src/commands/verify.ts:712), where every
other entry is read at `channelRef(cfg, entry)` (src/lib/config.ts:65-66) and MV-53 says
"`channel:` on the entry, else the global, else `origin/main`". **Decision**: one
`brainChannel(cfg)` beside `channelRef` — the `brain` key's entry, else the brain==code entry,
read through `channelRef`, else `cfg.channel ?? DEFAULT_CHANNEL` — used by all three (FR-015).
A brain whose own entry declares no `channel:` reads what it read before, byte for byte; MV-53
and MV-54 need no note, since this makes the code do what MV-53 already says.

**Verify's finished line does not read the channel** (decision): verify's read line already
names a brain behind its channel (`brainDrift`, MV-54) in the same run, and the finished line
is the print site `verify-rooted-and-quiet` rebases on in the shape the design gave it. Adding
a drift clause there changes that shape; reading the channel there adds IO to every finished
run. The pull stays `land`'s and `close`'s, which is where a wrong "state it" is acted on; the
ceiling says so.

## R9. `--abandon` refuses a stated own row, never a RESERVED one

**Decision**: `abandonLines(rows, change)` returns, for each proposed row the change owns
(`adds` ∪ rows whose source names it) whose statement is non-empty and not `stillReserved`,
`<ID>: states a rule this abandoned change never verified — delete the row from
.multivac/invariants.md (a proposed row may be removed), or close the change properly`; the
`--abandon` path refuses on it after its existing claims refusal (FR-011). Deleting a proposed
row is legal: law-death refuses only active and retired rows.

**Rationale**: abandon verifies nothing, so a rule it stated would enter the law as a proposal
nobody checked, and a proposal never gates.

**Alternatives considered**: refusing over a RESERVED row an anchor names — that shape is
MV-45's own abandon test (test/change/concurrency.test.ts:240), where MV-45's read order is now
pinned (R10).

## R10. One anchored set (MV-45)

`anchoredClaimIds` (src/commands/change.ts:627-640) scans `@anchor[ \t]+(\S+)` in every tracked
file; verify parses the brain root's Markdown, `.multivac/*.md` and `.multivac/changes/*.md`
(`collectBrainAnchors`, src/anchor/parse.ts:193-213).

| Brain | text scan | parsed | only in the scan | `MV-` only in the scan | Source |
| --- | --- | --- | --- | --- | --- |
| this brain, `92c4c08` | 220 | 146 | 74 | 0 | `node anch2.mjs` **(synth)** |
| this brain, `62d4588` | 221 | 147 | 74 | 0 | `node c7/anchsets.mjs /home/user/multivac` **(plan)** |
| this brain, main `9c615ca` | 223 | 149 | 74 | 0 | `node c7/impl/anchsets.mjs <dist> /home/user/multivac` **(apply, T001)** |
| this brain, branch head `e61cf5f` | 225 | 149 | 76 | 1 (`MV-150`, quoted with `<ID>` by this change's own spec) | same, on the worktree **(apply, T001)** |
| fresh `init --provider claude` | 6 (the skill's examples, INV-01 among them) | 0 | 6 | — | `$SCR/synth/fresh2` against `fresh3` **(synth)**; the same at `e61cf5f`, `c7/impl/fresh` **(apply, T001)** |

On the fresh brain, `change new leak`, `repos: {brain: landed}`, close: today rc 0, no release
line, `| INV-01 | RESERVED by change leak …` still in the law; the prototype prints `released
unused reservation: INV-01` and the row is gone **(synth)** (SC-016).

**Decision**: one call site, `await collectBrainAnchors(brain)`, in a change.ts helper that
returns the anchor sites; the ID set is derived from them. It feeds plan's "no anchor" line,
the orphan kind, the citation gate and both releases (FR-016). Close reads it once, after its
unlanded check and before `runSdd('close')`, keeping the comment "before archive moves the
change file"; the second read before `releaseUnused` goes, and release takes the same set.
`--abandon` keeps its read before the archive. Mutation M1 (release reading anchors after the
archive on `--abandon`) fails the new test "--abandon reads anchors before archive moves the
change file" **(synth)**: concurrency 11 tests, 1 fail (SC-017).

**Rationale**: the gate exempts exactly what release gives back; two sets would disagree, and
the scan keeps every claude-door brain's first reservation forever.

## R11. The surfaces that say close

**Decision**: verify's `OpenChanges` gains `changes: Map<slug, ChangeFile>`, filled in
`openChangeClaims` for open changes only; `evaluateCore` computes `closeRefusals: Map<slug,
string[]>` for each finished slug from the `rows` it read and `collected.anchors`, only when
something is finished; `finishedChanges(claims, open)` is unchanged. The finished line
(src/commands/verify.ts:1184-1192) reads `finished, not pending — close refuses until: <first>[
(+N more)] — then: multivac change close <slug>` when refusals exist, today's text otherwise,
still blocking under `--strict`, with the counts unchanged (MV-20) (FR-012). `land`, once every
repo is landed, computes the gating lines, prints `  close refuses until: <line>` after the
unchanged armed line, and ends `all stages landed — fix the line close refuses on above, then:
multivac change close <slug>` (`fix the <n> lines` for several) (FR-013). `plan` prints each
declaration line as `claim <line> — close refuses this` (FR-014); `DECLARATION_KINDS` is
`no-row`, `short-row`, `retired`, `undeclared`, `reserved-elsewhere`.

Clean runs are unchanged **(synth)** (`lc.sh today|proto b-cg cln`, normalized md5): plan 257 B,
apply 537, land 520, `verify --strict` 535, close 655, verify-after 298, under codegraph; the
verifiers found the same under the other configurations (555/565/597, 601/611, 589/655/623 B).
`change new` grows 544 → 569 B (+25). `verify` on this brain: 348 B in both clones.

Refusals, only when refusing (plan, `node -e` over the literal strings): an unstated line 121 B,
the summary 103 B, a land notice 144 B, the finished-line tail 203 B instead of 61, a pull line
125 B, an orphan line 116 B, a not-new line 95 B.

**Alternatives considered**: excluding a change close would refuse from `finishedChanges` —
measured to make `verify --strict` exit 0 and say nothing about a finished change
(`rejected-finished-exclusion.patch`, claims-cite) **(inv)**, which reopens MV-80's hole.
Recording the MV-80 mismatch as a ceiling — a row contradicting active MV-80.

## R12. The words, in every copy (MV-111)

`git grep -n -i -E "ended (up )?consistent|anywhere the change touched|checks law and code"`
**(critic, plan)** finds the withdrawn claim about close outside `references/change.md` at
.specify/memory/constitution.md:45-47 (Principle III), DESIGN.md:783-784,
site/content/docs/guide/running-changes.md:369-370, skills/multivac/SKILL.md:77-78 and
.claude/skills/multivac/SKILL.md:77-78. Close verifies declared claims only; a broken touched
row closes rc 0 (close-gate s14) **(inv)**, and the site's concept page already says so
(site/content/docs/concepts/the-change.md:63-68).

**Decision**: correct every copy in the same commit (FR-018, FR-021), with ONE `absent` leg on
MV-150 — FR-021's glob `{*.md,.specify/memory/*.md,site/content/**,skills/**,.claude/skills/multivac/**} !CHANGELOG.md`
on `ended (up )?consistent|checks law and code|anywhere the change touched|relaxed in code instead of|got quietly relaxed`
(R15 leg 22, widened by the hand-off; analysis A1, B1): 15 lines in 9 files at `e61cf5f`
**(apply, T001)** — the two skill copies of SKILL.md 2 each and of references/change.md 2 each,
DESIGN.md 3 (:163, :783-784), the constitution 1, running-changes.md 1 (:414; `checks law and
code` catches its line-wrapped copy), philosophy.md 1 (:90) and the-change.md 1 (:84) — 0 after.
The draft's narrower glob and regex found 12 lines in 7 files **(plan)**, missing the three
"relaxed in code" copies; DESIGN.md:97 and the-change.md:37 ("never relaxed in code — it is
changed in the law first") state the amend rule, not what close checks, and the widened regex
does not match them. The constitution takes a PATCH, 3.0.1 → 3.0.2, its Last Amended
date the commit's, and no Sync Impact Report (MV-146's `absent` leg on `Sync Impact` holds;
MV-120's on `2\.0\.[01]` holds). The other surfaces are the design's list: flow.ts:50 and the
re-rendered flow.md gate line (FR-017, 64 → 125 B, read on demand, injected nowhere; flow.test's
regex at :135 is a prefix and still matches), running-changes.md (:82, :121, :140-143, :160-162,
after :300, and :391's retire sentence), commands.md (:1255, `plan`, :510, the land notice near
:1534, a citation block after "Then re-verifies" ~:1564, `--abandon` ~:1642 keeping MV-45's
`used meaning the rule was stated`), the-change.md:57-61, DESIGN.md:204-212 ("The tool owns the
frontmatter, and a claim is an ID"), references/change.md (:104-106, :175-180, :315), CHANGELOG.

The retired-example leg over `{site/content/**,skills/**,.claude/skills/multivac/**}` matches 7
lines today **(plan)**: running-changes.md 4 (:82, :121, :140, :162), commands.md 1 (:1255, the
design's :1237 moved by #4's +11-line hunk at :1225), and `**Claims it makes true**` once per
skill copy; 0 after. `.claude/skills/multivac/**` is a tracked copy (`git ls-files -s`: mode
100644), refreshed by `multivac doors` from the rebuilt dist before `verify --strict`.

## R13. The skew, and the upgrade said before it happens

An older multivac on an ID-only change **(ver)** (verify-claims-cite-guarantee S1,
verify-claims-cite-cross-adapter E1): `change plan` refuses with `each claim needs a string
"id" and "statement"`; `roadmap` prints `in flight: no open change`; `doors` drops
`change:<slug>` from `ecosystem.json`; in a consumer, `verify` exits 1 on a leg the new build
holds pending. Under openspec **(synth)** (`$SCR/synth/wox-out/wt-commit.out`), with the
pre-change `mvac` on PATH, the brain==code hook reached its third tier (`exec mvac verify`,
`.multivac/hooks/pre-commit`) and refused the change's own commit: `code 1 code path (kept.txt)
on greet, which is no open change declaring brain … · blocking`.

The hook's tier 1 runs `<root>/dist/cli.js` when `<root>/node_modules` holds a package named
multivac. A worktree that was never built falls through to `mvac`; one that was built runs its
own build **(critic)** (#4's worktree held both `dist/` and `node_modules/`). So the legacy-form
rule is keyed to every build that reads this brain's change files: main's `dist/`, an in-flight
worktree's pre-change build once it merges main, and every consumer's pinned and global
multivac.

`requires: ">=0.15.0"` in `$SCR/critic/xkey`'s config with a `0.14.1` build **(critic)**: every
command, every hook run included, printed `mvac: this brain requires >=0.15.0 and you are
running 0.14.1 — …`. A consumer with the floor in its mount printed 0 version lines and exited 1
(E1) **(ver)**: `versionNotice` reads only `<cwd>/.multivac/config.yml` (src/cli.ts:43-44).

**Decision**: the changelog, under "Changed — read before upgrading", says the four things of
FR-020; the floor is named as "the release carrying this change" and set with or after the
release commit that bumps `package.json`, never on this branch (SC-020). This brain keeps
`statement:` in its own change files until its dist is rebuilt from the merged change; this
change's own file declares `- id: MV-150` with its statement (spec Assumptions).

## R14. Savings, and what they cost

The case is correctness; the token effect is small and its sign depends on reader behaviour.

| What | Before | After | Command |
| --- | --- | --- | --- |
| claims-block bytes written per new change | median 366, mean 506 B at the 27 closes after the history root (corpus: median 305, mean 424) **(ver)**; median 370, mean 507 at the 30 closes at `e61cf5f` (the statements alone: median 350, mean 483) **(apply)** | 0 | `node m2.mjs` (its `save` column, which the design labelled statement bytes), `node m1.mjs` (verify-claims-cite-measurement) |
| tokens per new change | ~92–127 once, plus that per read-back (count not measured) | 0 | bytes/4 |
| scaffold claim lines, read at `change new` | 164 B | 80 B (−84) | `node -e` **(plan)**, `bytes.mjs` **(synth)** |
| `change new` stdout | 544 B | 569 B (+25) | `lc.sh` **(synth)** |
| archive of a change with one 45 B statement | 1,013 B | 884 B (−129) | same **(synth)** |
| clean plan / apply / land / `verify --strict` / close / verify-after | 257 / 537 / 520 / 535 / 655 / 298 B | identical | same **(synth)** |
| plan notice | — | 121 B per legacy claim per plan run | **(plan)** |
| flow.md gate line (read on demand) | 64 B | 125 B (+61) | **(plan)** |
| law growth, once | 416,889 B **(plan)**; 473,051 B at `e61cf5f` | +12,507 B (+3.0%) **(plan)**; +12,707 B (+2.7%) as written at apply: row line 5,451, notes 2,530, 33 MV-150 legs 3,550 (leg 22 widened), 11 legs on amended rows 1,176 | `wc -c` on c7/law/*, c7/impl/{row-head,notes-head}.txt **(apply)** |
| corpus, counterfactual | claims block 54,819 B | 2,638 B had bare IDs been used from the start; delivered on landing 0 B | `node forms.mjs` **(inv)** |

At 370 B per future change the law's growth is repaid in bytes after about 34 changes; the law
is read far less often than a live change file, so this overstates the cost. A claimed row is a
median 1,977.5 B against a median statement of 254 B (ratio 7.1, `node m2.mjs`) **(ver)**, and
`ecosystem.json` and graphify carry no row text (`graphify explain "MV-146"`: 1,945 B of edges,
no rule), so one extra row read per about 6 ID-only change files cancels the median saving; in
136 of 160 claims the writer added the row in the same change and already has it in context.
Whether readers fetch it is not measured (a ceiling).

## R15. Legs

Dialect: POSIX ERE through `git grep`, `[[:space:]]` for `\s` (skills/multivac/references/anchors.md);
a glob is matched through picomatch as `verify` matches it. `present` is the default; `absent`,
`count` and `each` block. A proposed row's legs never block (src/commands/verify.ts:844), so the
legs are written once every task they read has landed (tasks.md).

**New legs, MV-150** (33):

```text
<!-- @anchor MV-150 brain:src/change/file.ts /typeof c === 'string' && c !== ''/ unique -->
<!-- @anchor MV-150 brain:src/change/file.ts /c\.statement === undefined \? c\.id/ unique -->
<!-- @anchor MV-150 brain:src/change/file.ts /a claim is its row's ID; state the rule in the row/ unique -->
<!-- @anchor MV-150 brain:src/{change/file,commands/roadmap}.ts /claimKeys: 'refuse'/ count=2 -->
<!-- @anchor MV-150 brain:src/commands/change.ts /restates the row — kept as written/ unique -->
<!-- @anchor MV-150 brain:src/change/reserve.ts /export function citeLines\(/ unique -->
<!-- @anchor MV-150 brain:src/change/reserve.ts /the row is the only place the rule is stated/ unique -->
<!-- @anchor MV-150 brain:src/change/reserve.ts /which close archives — move the anchor beside the code it pins/ unique -->
<!-- @anchor MV-150 brain:src/change/reserve.ts /not new; move it to invariants\.touches/ unique -->
<!-- @anchor MV-150 brain:src/change/reserve.ts /export function abandonLines\(/ unique -->
<!-- @anchor MV-150 brain:src/commands/change.ts /citeLines\(/ count=3 -->
<!-- @anchor MV-150 brain:src/commands/verify.ts /citeLines\(/ unique -->
<!-- @anchor MV-150 brain:src/commands/change.ts /abandonLines\(/ unique -->
<!-- @anchor MV-150 brain:src/commands/change.ts /async function statedUpstream\(/ unique -->
<!-- @anchor MV-150 brain:src/commands/change.ts /await statedUpstream\(/ count=2 -->
<!-- @anchor MV-150 brain:src/lib/config.ts /export const brainChannel/ unique -->
<!-- @anchor MV-150 brain:src/commands/{change,verify}.ts /brainChannel\(cfg\)/ count=3 -->
<!-- @anchor MV-150 brain:src/commands/change.ts /await collectBrainAnchors\(brain\)/ unique -->
<!-- @anchor MV-150 brain:src/commands/change.ts /@anchor\[ \\t\]/ absent -->
<!-- @anchor MV-150 brain:src/** /statement: "\.\.\."|Statements are prose/ absent -->
<!-- @anchor MV-150 brain:{site/content/**,skills/**,.claude/skills/multivac/**} /statement: "\.\.\."|statements this change makes true|\*\*Claims it makes true\*\*|^[[:space:]]+statement:[[:space:]]/ absent -->
<!-- @anchor MV-150 brain:{*.md,.specify/memory/*.md,site/content/**,skills/**,.claude/skills/multivac/**} !CHANGELOG.md /ended (up )?consistent|checks law and code|anywhere the change touched|relaxed in code instead of|got quietly relaxed/ absent -->
<!-- @anchor MV-150 brain:test/change/file.test.ts /a claim is its row's ID/ -->
<!-- @anchor MV-150 brain:test/change/cite-lines.test.ts /one line per claim, the first reason in order/ -->
<!-- @anchor MV-150 brain:test/change/ledger.test.ts /close refuses a claim whose row was never stated/ -->
<!-- @anchor MV-150 brain:test/change/ledger.test.ts /--abandon refuses a change whose own row states a rule/ -->
<!-- @anchor MV-150 brain:test/change/ledger.test.ts /a retiring change's claim verifies its tombstone at close/ -->
<!-- @anchor MV-150 brain:test/change/lifecycle-polish.test.ts /a row stated upstream is pulled, not stated twice/ -->
<!-- @anchor MV-150 brain:test/change/lifecycle-polish.test.ts /land before pull names the pull, never a second statement/ -->
<!-- @anchor MV-150 brain:test/change/lifecycle-polish.test.ts /a brain entry's own channel is the ref land and close read/ -->
<!-- @anchor MV-150 brain:test/change/lifecycle-polish.test.ts /land and verify name a claim close would orphan/ -->
<!-- @anchor MV-150 brain:site/content/docs/reference/commands.md /claims do not cite the law this change makes/ unique -->
<!-- @anchor MV-150 brain:.multivac/invariants.md /Amended 2026-09-29 by MV-150/ count=4 -->
```

**Legs added to amended rows** (11):

| Row | Leg | Why |
| --- | --- | --- |
| MV-45 | `brain:src/change/reserve.ts /const unused = \(r: ClaimRow/ unique` | one release predicate, which the gate exempts |
| MV-45 | `brain:src/commands/change.ts /await collectBrainAnchors\(brain\)/ unique` | one parsed set |
| MV-45 | `brain:test/change/concurrency.test.ts /--abandon reads anchors before archive moves the change file/` | the read order, pinned where it is still observable |
| MV-45 | `brain:test/change/concurrency.test.ts /an unused reservation named only by anchor text outside the parsed files is released/` | the release reads the parse, not the text |
| MV-80 | `brain:src/commands/verify.ts /close refuses until: / unique` | the finished line's refusing variant |
| MV-80 | `brain:src/commands/change.ts /close refuses until: / unique` | land's notice |
| MV-80 | `brain:test/verify/verify.test.ts /a finished change names what close would refuse first/` | |
| MV-117 | `brain:src/commands/change.ts /claims do not cite the law this change makes/ unique` | the fifth thing |
| MV-117 | `brain:src/change/file.ts /const CLAIM_KEYS = \['id', 'statement'\]/ unique` | the claim-key set, one literal (MV-26's rule: not a runtime ternary) |
| MV-117 | `brain:test/change/ledger.test.ts /every citation defect is named in one run/` | |
| MV-117 | `brain:test/change/ledger.test.ts /a stray claim key is named by every reader and refused only by the writers/` | R2 |

MV-15 gains none: its three legs stay valid **(synth)** (`lineWidth:[[:space:]]*0` 2,
`quotedRewrite` 2, and file.test.ts's `statement: staleness: block`, kept as legacy coverage).
The investigator's `/still reads? RESERVED/` matched 0 in its own prototype and is not used.

**Dry-run today (plan)**: `@anchor\[ \\t\]` in change.ts 1 (:637); `statement: "\.\.\."|Statements
are prose` over `src/**` 2 (file.ts, change.ts); the retired-example leg 7 lines (R12); the
"ended consistent" leg 12 lines in 7 files (R12). **Re-run at apply (T001, through `verify`'s own
scanner)**: 1 (:812 at `e61cf5f`), 2, 7, and the widened leg 22 15 lines in 9 files (R19). Each `absent` leg has teeth today and matches
0 after; each `unique` leg matched 1 in the prototype tree **(synth)**; the legs the critic
added (the orphan and not-new clauses, `claimKeys: 'refuse'`, `statedUpstream` twice,
`brainChannel`) are dry-run at the task that writes them.

**Legs that must not move**:

- MV-45 `brain:src/change/reserve.ts /startsWith\('RESERVED by change '\)/`: the literal lives only inside the exported `stillReserved` in reserve.ts, 1 match over `src` **(synth)**; `statedUpstream` calls `stillReserved`, and neither change.ts nor verify.ts may spell the literal. Exporting it as a constant broke the leg (`verify --strict` rc 1, `broken MV-45 [present] … no match in brain`), and hoisting it in reserve.ts alone let it self-heal onto change.ts silently (`moved MV-45 … glob rewritten to src/commands/change.ts`) **(ver)**.
- MV-45 `/before archive moves the change file/` (the moved comment keeps it, 1 match); `/a stated rule survives close/` (concurrency.test.ts:182, unchanged, passing with one added `enters the law stated but unanchored` line); `/anchors are read before archive/` — moves within concurrency.test.ts from :206's assertion to the new `--abandon` test's; `/used meaning the rule was stated/` in commands.md.
- MV-80 `/refuses \$\{slug\} as unclosed \(MV-80\), here and in CI/` (1), `/finishedChanges\(claims, open\)/` (1: the signature is unchanged and the refusals are computed beside it), `/opts\.strict === true && finished\.length > 0/`, `/gating\.size \+ staleBlocking \+ finishedBlocking/`, `/the work is published there, however it got in/`, `/not landed, or not fetched/`, `` /`channel: \$\{ch\.line\}`/ ``, and the four lifecycle-polish test titles, bodies edited under the same titles.
- MV-117 `/anchored ONLY in/` unique in change.ts (close keeps its text; the orphan kind's clause is lower-case and lives in reserve.ts); `/const KNOWN_KEYS/` unique (`CLAIM_KEYS` sits above its doc comment); `/close refuses a claim it would orphan by archiving/` (title kept, fixture changed).
- MV-137 `/'claims', 'sdd_skipped',/` (1): `KNOWN_KEYS` unchanged.
- MV-139 `brain:src/doors/ecosystem.ts /statement/ absent`: ecosystem.ts is untouched.
- MV-146 legs on `citeSpec`, `landSdd` (`count=2`), `below the closing ---, is yours\.` absent, and the scaffold's closing sentence: untouched; the scaffold keeps that sentence byte for byte (file.test.ts:238 passes).
- MV-53 `/export const channelRef/` and `/DEFAULT_CHANNEL = 'origin\/main'/`, MV-54 `/async function brainDrift/`: `brainChannel` sits beside `channelRef` and calls it.
- MV-89 `/assertStarted\(/ count=5` in change.ts: no call added or removed.

`node dist/cli.js verify --strict` in the prototype clone: `147 claims · 146 anchored (99%)`,
`0 blocking broken · exit 0`, 348 B, nothing moved **(synth)**. With the design's row, notes and
legs written into a scratch law (`$SCR/critic/addlaw.py`): rc 0, `148 claims · 147 anchored`; the
only red lines were the expected ones (the site/skill leg before the docs, the unwritten
cite-lines.test.ts, the commands.md site leg), every leg on an amended row and every "must not
move" leg resolved, nothing moved **(critic)**.

## R16. The law as it will be written

**MV-150**, one physical line, `| open | proposed | 2026-09-29 | [changes/change-file-cites.md](changes/change-file-cites.md) |`,
5,451 B, statement cell 5,344 B **(apply)**, the text in `c7/impl/row-head.txt` — `c7/law/row.txt`
(5,444 B) with T001's figures (R19), as written by T002:

> **A change file cites the law it makes true and never restates it: a claim is its row's ID, and `change close` refuses until every claim cites a stated row the change adds, touches or retires, and every row the change adds and anchors is claimed.** Measured 2026-09-29 on this brain's 131 change files: nothing read `claims[].statement` but the parser, the serializer, the scaffold and `change new`'s example, yet all 164 claims carried one, 140 restating a row the same change added; 144 no longer sat verbatim in their row, and of the 35 written at a close commit after the history root none was an exact copy even then. One archive's statement no longer parses, which drops that change and its two edges to MV-32 from `ecosystem.json`. `close` checked a claim's anchors, never its row: of 16 bad declarations, 11 closed green — a claim of no row, of a row the change neither adds nor touches, of a retired row, of a row still reading `RESERVED by change <slug> — state the rule here before close.`, and an added, anchored, unclaimed row, which as a proposed row never gates. And `close`'s anchored set was a text scan of every tracked file — 223 IDs against the 149 `verify` parses here, six against none on a fresh `init --provider claude` brain, whose first reservation was therefore never released. **The rule.** *A claim is an ID.* `change new` prints `claims: [<ID>]` and the scaffold teaches it; a `{ id }` map is written back bare. A legacy `statement:` parses, is written back unchanged and is never created; `change plan` names it as a restatement, gates nothing and never asks an in-flight change to convert. A key inside a claim other than `id` and a legacy `statement` is named by every reader and refused by every command that rewrites the file, which would drop it; `verify`, `roadmap`, `doors` and the code gate still read the change. *Close checks the citation.* Before anything is archived, `change close` names for each claim the first of: no row; a row short of its six columns; a retired row the change does not retire; a row under its `retires` not yet retired; a row the change neither adds, touches nor retires; a row another change reserved and has not stated; a row that states no rule yet — to be stated there, or pulled when the brain's channel already states it; a claim anchored only in the change file it archives. It refuses a row under `adds` already in the law and a proposed row the change owns that an anchor names and no claim cites, and says without refusing that a stated owned row nothing anchors enters unverified. The red claims, these lines and the orphan line come in one run; an unused reservation is released as before; `--abandon` refuses a change whose own proposed row states a rule. "Anchored" is the set `verify` parses, read once before the archive. The brain's channel is its own entry's `channel:`, else the global, else `origin/main`, for `land`, `close` and `verify`'s read line alike. *What says close says what its citation gate refuses*: `verify`'s finished line (MV-80) names the first refusal before `change close <slug>`, still blocking under `--strict`; `land` prints the refusals, the pull included, when it records the last repo; `plan` prints the declaration half as notices. **What is mechanical**: `unique` legs on the bare read and write, the claim-key message and its refusal by the writers, the legacy notice, `citeLines` and its clauses, `abandonLines`, `statedUpstream` at `land` and `close`, `brainChannel`, the parsed anchor set and the finished line's reading, with `count=3` on `citeLines` in `change.ts`; `absent` legs on the text scan, the retired examples and phrases, and every copy of the sentence that close checks law and code ended consistent; test legs, a site leg and a count on the four amendment notes. **Ceilings.** An older multivac cannot read an ID-only claim: its `change` commands refuse the file, and its `verify`, `roadmap` and `doors` skip it without a word — the change reads as absent, its claims stop pending and can gate, a brain==code hook running an older build blocks the change's own commits, and the finished gate goes quiet; MV-86's `requires:` floor makes the brain loud and does not reach a consumer's run. Archives keep their 50,477 bytes of statements, the one that does not parse included, and a change open at this row's birth keeps its own. `roadmap sync` skips a file whose claim carries a stray key as it skips any file it cannot parse. The SDD, graph and tracked-graph gates `close` runs before its citation gate are not announced by `verify` or `land`, and `verify`'s finished line reads this checkout only: a brain behind its channel is named on its read line, and the pull is `land`'s and `close`'s to say. The channel is read offline, on a refusal only. A stated rule nothing anchors still enters the law, with its line: coverage below one hundred percent is supported. An undeclared claim still holds its row pending under MV-17 until `plan` or `close` names it. A change's contribution to a row it only touches belongs in that row's amendment note, its body or its spec, and whether they restate the row stays ungateable (MV-146). The saving is per future change, a median 370 bytes off the claims block at the 30 closes since the history root; whether an ID-only file costs a row read later is not measured.

The sentence "MV-86's `requires:` floor makes the brain loud and does not reach a consumer's
run." is kept verbatim: `verify-rooted-and-quiet` amends it by a note if it lands with it. The
row's figures are read at `e61cf5f` (R19) and dated by the row: 164 claims (140 restating a row
their change added, 144 no longer verbatim), 35 claims at 30 closes after the history root,
223 IDs against 149, 50,477 bytes of archived statements, a median 370 bytes of claims block.
The design's draft carried `92c4c08`'s 160, 136, 141, 32 at 27, 220 against 146, 48,835 (every
readable file's statements, live ones included and the unparsable archive's left out) and a
median 366 labelled "of statement" that was the claims-block saving (R14).

**The four notes**, each appended to the end of its row's statement cell, withdrawing only a
sentence this change makes false and quoting its row's own current sentence exactly (535, 631,
570 and 794 B as written at T003; 401, 632, 571 and 778 B drafted) **(apply)**:

| Row | Note |
| --- | --- |
| MV-15 | **Amended 2026-09-29 by MV-150**: "Claim prose survives the frontmatter" now speaks of a legacy `statement:` alone: a claim is its row's ID, and nothing scaffolds, prints or documents claim prose any more. A legacy `statement:` still parses and round-trips unchanged and unreflowed: 130 of this brain's 131 change files re-serialize byte-identically under the old and the new reader, and the one that fails fails under both. "a frontmatter YAML error names the offending line and the quoting fix" still stands for any hand-typed value. |
| MV-45 | **Amended 2026-09-29 by MV-150**: "no anchor names its ID" means an anchor `verify` parses — the collector's set from the brain's root, `.multivac/` and `.multivac/changes/` — and no longer `@anchor` text in any tracked file. On a fresh `init --provider claude` brain that scan counted six IDs from the skill's own examples, INV-01 among them, so the first reservation, never used, was never released. Close reads the set once, before its citation gate, and the gate exempts exactly the rows this release gives back. Close now refuses every row anchored only in the file it archives, so the read order is pinned on `--abandon`. |
| MV-80 | **Amended 2026-09-29 by MV-150**: "the gate's only output is `change close <slug>`" is WITHDRAWN. `close` also refuses on its citation gate and its orphan check, so when a finished change would be refused there, the line names the first refusal before `change close <slug>` and stays blocking under `--strict`. `land`, recording the last repo, prints the same refusals, a row the brain's channel states and this checkout lacks as a pull, and its closing line names them instead of a bare `change close`. The SDD and graph gates `close` runs first are not announced here. |
| MV-117 | **Amended 2026-09-29 by MV-150**: "four things went through it without a word" — a fifth did too. A claim whose row still read `RESERVED by change <slug> — state the rule here before close.` closed green, and so did a claim of no row, a claim of a row the change neither adds nor touches, a claim of a retired row, and a row the change added and anchored but never claimed. Close now refuses each by name before anything is archived, in the same run as the red claims and the orphan line, and the orphan check is the one predicate `verify`'s finished line and `land` read too. A key inside a claim other than `id` and a legacy `statement` can only be rule prose: every reader names it, and every command that rewrites the file refuses it rather than drop it. A top-level key stays a notice. |

`invariants.touches` lists exactly MV-15, MV-45, MV-80 and MV-117; `adds: [MV-150]`; `retires:
[]`. MV-111 is cited, not touched: this change applies it and makes none of its sentences false.
MV-53 and MV-54 are left alone (R8). Neither the notes nor the row match an `absent` leg that
reads `.multivac/invariants.md` (MV-118's and MV-120's phrases, checked **(plan)**), and the row
holds exactly seven `|`.

## R17. Composition, re-anchoring and neighbours

- **Base.** The design cites `92c4c08`. Merged since: #4 `opsx-through-its-cli` (MV-147), which changed src/commands/change.ts (`land`, `close`, the slug refusal in `cmdNew` and `roadmap add`), src/change/*, the registry and commands.md (+11 lines at :1225). #5 `graph-answers-where-asked` (MV-148, promoted at `49591e7`, applying) and #6 `codegraph-worktrees-and-verbs` merge before this change is applied: #5 edits land's and close's graph ignore steps, `commitGraph`, `removeWorktrees`, apply's pointer lines, flow.ts :58, :129-132, :141, and commands.md's close example (~:1575 here, :1558 at its design's base); #6 edits apply's, land's and close's index steps. None of them is on the lines this change edits, but every `file:line` here and in tasks.md is re-found at apply time, and the print sites of plan's claim loop, land's armed line and final line, close's gate block and verify's finished line are located by their text, not their number.
- **#8 `verify-rooted-and-quiet`** lands after this change and rebases on `OpenChanges.changes`, `Evaluated.closeRefusals` and the finished line's refusing variant, emitted there with `quiet: null`; the variant's name and shape stay as R11 gives them, and #8's design counts an unparsable open change file as "off" (its §1.5). `brainChannel` touches verify's `bChannel` line (:712), a separate site #8 should expect.
- **#9 `skill-cites-references`** trims the skill after this change and keeps the corrected facts (R12).
- **The prototype's defects** (critic gap 11), fixed in the implementation: `CLAIM_KEYS` goes above `KNOWN_KEYS`' doc comment ("Every frontmatter key …"), not between them; `lsFiles` stays imported in change.ts only while another caller uses it; the two imports from `../anchor/parse.js` become one.
- **Suite (apply, T001)**: the branch head `e61cf5f`, #5 and #6 merged, runs 933 tests, 930 pass, 3 skipped, 0 fail, in the worktree (152 s). **Suite (plan)**: `62d4588` built from `git archive` runs 852 tests, 847 pass, 3 skipped; the 2 failures need a git checkout (the roadmap-absence scan and the font check read `git ls-files`) and pass in the repository. The prototype went from 831 tests (824 pass, 4 fail as predicted from the code, 3 skipped) to 839 (836 pass, 0 fail) with its test edits **(synth)**; merged with #4 (`e4b09a7`, `git apply --3way`, all 10 files clean) it ran 858, 855 pass, 0 fail **(critic)**.

## R18. Ceilings, stated

An older multivac reads an ID-only change as absent (R13); MV-86's floor does not reach a
consumer's run. Archives and in-flight changes keep their statements; `everything-multivac-owns.md`
stays unparsed and out of the ecosystem graph. `roadmap sync` skips a file with a stray claim key
silently, as it skips any unparsable file. The SDD, graph and tracked-graph gates are not
announced by verify or land. Verify's finished line reads this checkout only. The channel is read
offline, only on a refusal. A stated rule nothing anchors enters the law with its line. An
undeclared claim holds its row pending until plan or close names it. Rows a change only touches
are checked at close only when claimed. Whether an ID-only file costs a row read later is not
measured.

## R19. Re-anchored and re-measured at apply (T001)

Read on the branch head `e61cf5f` (#5 and #6 merged, the speckit files carried), clean worktree,
`corepack pnpm run build` exit 0, `node dist/cli.js verify` `150 claims · 149 anchored`, `0
blocking broken`. `change new` reserved MV-150 (`92e0f18`). Scripts under
`/tmp/claude-0/-home-user-multivac/2009d32c-ec8a-53c2-87bc-5b2df689ff4a/scratchpad/c7/impl/`
**(apply)**:

```bash
I=/tmp/claude-0/-home-user-multivac/2009d32c-ec8a-53c2-87bc-5b2df689ff4a/scratchpad/c7/impl
W=/home/user/multivac/.multivac/worktrees/change-file-cites/brain
node --test "dist-test/**/*.test.js"                  # 933 tests, 930 pass, 3 skipped, 0 fail
node $I/../../c78/claims-cite/measure.mjs $W          # 131 files (127 archived, 1 unparsable); 163 readable claims, all stated; 144 diverge from their row
node $I/stmtbytes.mjs $W $W/dist                      # archives 49,723 B + the unparsable one's 754 B; 139 readable claims restate an added row
node $I/m2.mjs $W                                     # 30 closes after the root: claims-block saving median 370, mean 507.1; statements median 350; RESERVED at archive 0 of 161
node $I/afterroot.mjs $W $W/dist                      # those 30 closes hold 35 claims, 0 an exact copy of their row then
node $I/roundtrip.mjs $I/../../c78/synth/proto $W/dist $W   # the prototype reader against the head's: 131 files, 130 identical, 0 differ, 1 fails under both
node $I/anchsets.mjs $W/dist /home/user/multivac      # main 9c615ca: 223 scanned, 149 parsed, 74 only scanned, 0 MV-
node $I/anchsets.mjs $W/dist $W                       # branch head: 225, 149, 76, MV-150 (this change's own spec quotes it)
node $I/legdry.mjs $W/dist $W $I/t001-legs.md         # the legs below, through verify's own scanner
```

**The corpus, as MV-150's row now states it**: 131 change files; 164 claims, every one carrying a
statement (163 readable, and the unparsable archive's claim of MV-32); 140 restate a row their own
change added (139 readable, and MV-32); 144 no longer sit verbatim in their row (MV-32's still
does, normalized); the 30 closes after the history root hold 35 claims, none an exact copy of its
row at the archive commit; archives hold 50,477 B of statements, the unparsable one included; the
claims block of those 30 closes would have shrunk by a median 370 B. SC-010 re-run: 0 of 161
archived claims had a RESERVED row at their archive commit, 0 of 163 readable claims name a
missing row, 0 fall outside `adds` ∪ `touches`, 0 sit under `retires`, 137 of 137 rows an archived
change added are claimed. The fresh `init --provider claude` brain (built from `e61cf5f`, `HOME`
isolated): text scan 6, parsed 0.

**Dry-run through `verify`'s own scanner** (`legdry.mjs`: `parseAnchors` + `scanLeg`, so globs are
picomatch's and anchor lines are skipped):

| Leg | At `e61cf5f` |
| --- | --- |
| retired examples over `{site/content/**,skills/**,.claude/skills/multivac/**}` | 7 lines in 4 files: running-changes.md :82, :121, :140, :162; commands.md :1295; `**Claims it makes true**` at :104 of both references/change.md copies |
| R15's draft leg 22 (its glob and regex) | 12 lines in 7 files |
| FR-021's glob with the R15 regex | 12 lines in 7 files |
| FR-021's glob with the widened regex (the leg T065 writes) | 15 lines in 9 files: both SKILL.md :77-78, both references/change.md :206-207, constitution.md :47, DESIGN.md :163, :783, :784, philosophy.md :90, the-change.md :84, running-changes.md :414 |
| `statement: "\.\.\."\|Statements are prose` over `src/**` | 2: file.ts :303, change.ts :1088 |
| `@anchor\[ \\t\]` in change.ts | 1 (:812) |

A `git grep` dry-run with a bare `*.md` pathspec recurses and reports 44 lines in 16 files for
FR-021's glob; picomatch does not recurse, so dry-run through the scanner or with `:(glob)*.md`.

**Re-anchored lines**, after T002–T008 (the `wip(change-file-cites): S1` commit), for the tasks
that follow; print sites are still found by their text:

| Artifact line | Now |
| --- | --- |
| file.ts `ChangeClaim` :28-31 | :28-35 (statement optional, documented legacy) |
| file.ts `KNOWN_KEYS` and its doc :73-78 | `CLAIM_KEYS` :78-83, `KNOWN_KEYS` :84-87, `ClaimKeys` :89-95, `normalizeChange` :97-98 (the "Validate …" comment now on it) |
| file.ts claim reader :176-189 | :194-207 |
| file.ts MV-117 notice | :212-223 |
| file.ts `parseChange` :253 / `serializeChange` :282 / `scaffoldChange` :303 / `loadChange` :344-371 | :271 / :288 (its `claims:` at :300, `lineWidth` comment :303) / :311 (body :321) / :362 (`parseChange` call :382) |
| reserve.ts `owns` :39; `releaseUnused` filter :183-192 | `owns` :39, `stillReserved` :47, `unused` :55, `reservedBy` :59; `releaseUnused` :197, its filter :205 |
| config.ts `channelRef` :65 | :65; `brainChannel` :77 |
| change.ts `channelEvidence` ref :365 | :374 |
| change.ts `anchoredClaimIds` :627-640 | `brainAnchorSites` :812, `anchoredIds` :817, `anchoredClaimIds` :821-834 (regex :831) |
| change.ts `cmdNew` third edit :913 | :1107 |
| change.ts `cmdPlan` "already in … not new" :996 / claim loop :1004-1009 | :1199 / :1207-1212 |
| change.ts `cmdLand` :1227-1287 (armed line, final line) | :1537; armed line :1626-1629; final line :1665 |
| change.ts `--abandon` :1306-1346 | :1684-1728 (claims refusal :1687-1691, anchor read :1701, release :1707) |
| change.ts close unlanded check :1383-1390 / claims block :1392-1426 | :1764-1770 / :1771-1800; anchor read :1801-1805; `runSdd('close')` :1806; release :1821 |
| verify.ts `OpenChanges` :65-70, `openChangeClaims` :83-118, `bChannel` :712, `Evaluated` :849-864, claim-scoped literal :934-936, `finished` :944, finished line :1184-1192 | unchanged but the literal, :930 |
| roadmap.ts :77, :146, :226, :271; ecosystem.ts :91 | unchanged |
| code-in-change.ts `readChange` :131 | :214 |
| flow.ts gate line :50; flow.test.ts assertion :135 | :50; :174 |
| running-changes.md :300 (land), :369-370, :391 | land sample :349; "ended consistent" :414; retire sentence :436 |
| commands.md :510, :1255, near :1534, ~:1564, ~:1642 | finished line :538; three edits :1295; armed-line sample :1646; "Then re-verifies" :1676; `--abandon` :1760 |
| references/change.md :104-106, :175-180, :315 | :104-106, :206-207, :353 |
| DESIGN.md :204-212, :783-784 | :204, :782-784, and :163 |
| the-change.md :57-61 | :57, and :84 |
| constitution.md Principle III :45-47 | :47; Compliance line :132; Version line :141 (Last Amended 2026-09-28) |
