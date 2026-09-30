# Research: The skill carries what no command prints, and no page keeps a sentence the tool contradicts

Measured 2026-09-29 on `62d4588` (main, with graph-answers-where-asked's apply commit) and,
where stated, on graph-answers-where-asked's branch at `e6f7994`, in scratch ecosystems with
`HOME` and `GIT_CONFIG_GLOBAL` isolated and the real vendors: spec-kit 1.0.11, openspec 1.13.2,
graphify 0.9.29, codegraph 1.6.0. Two investigations (`skill-pointers`, `docs-pass`), six
adversarial verdicts (guarantee kept, every adapter set, the saving is real, per
investigation), one synthesis prototype built and tested on `62d4588`, and a completeness
critic whose eleven gaps are all accepted. Tokens are cl100k (tiktoken `cl100k_base`, a proxy,
not Claude's tokenizer). Scratch paths are the design's (`c9/` under the session scratchpad;
`SYN` = `c9/synth`); they are reference, not inputs: the implementer re-derives on the merged
tree.

**Nothing in this file is copied forward as a result.** This change applies after
graph-answers-where-asked (MV-148), codegraph-worktrees-and-verbs (MV-149), change-file-cites
(MV-150) and verify-rooted-and-quiet (MV-151) merge, and each of them edits the skill and the
docs. Every byte figure, leg count and `file:line` below is re-measured by T001–T009 on the
merged tree, and the trimmed pack is re-derived there with the method of R1 (tasks.md, Phase 1).

## R0. Sources, ids and how the design maps

| Design | Spec | | Design | Spec |
| --- | --- | --- | --- | --- |
| FR-001 (body) | FR-001, FR-002, FR-003 | | FR-017 | FR-021 |
| FR-002 (change.md) | FR-004 | | FR-018 | FR-022 |
| FR-003 (verify.md) | FR-005 | | FR-019 | FR-023 |
| FR-004 (anchors.md) | FR-006 | | FR-020 | FR-024 |
| FR-005 (discovery.md) | FR-007, FR-016 | | FR-021 | FR-025 |
| FR-006 (interview.md) | FR-008 | | FR-022, §3.4 | FR-020, FR-028 |
| FR-007 (names) | FR-009 | | FR-023 | FR-029 |
| FR-008 (#5–#8 facts), M0 | FR-010 | | FR-024 | FR-030 |
| §6 restatement | FR-011 | | FR-025 | FR-031 |
| FR-009 (copy) | FR-012 | | FR-026 | FR-032 |
| FR-010 | FR-013 | | FR-027 | FR-033 |
| FR-011 | FR-014 | | FR-028 | FR-034 |
| FR-013 | FR-015 | | FR-029 | FR-035 |
| FR-014 | FR-016 | | FR-030 | FR-036 |
| §1.2 rhythm | FR-017 | | FR-031 | FR-037 |
| FR-015 | FR-018 | | FR-032 | FR-038 |
| FR-016 | FR-019 | | FR-033 | FR-039 |
| FR-012 (rule 6) | FR-003 | | FR-035 | FR-040 |
| §2.1 row | FR-042 | | FR-034 | FR-041 |
| §3 legs | FR-043 | | §2.2 | FR-044 |

Design SC-001 → SC-001/SC-002; SC-002 → SC-004; SC-003 → SC-005; SC-004 → SC-015; SC-005 →
SC-006; SC-006 → SC-007; SC-007 → SC-010; SC-008 → SC-013; SC-009 → SC-014. SC-003, SC-008,
SC-009, SC-011, SC-012 and SC-016 are the critic's and the walk's additions.

Critic gaps → where each lands: 1 → FR-018, R6; 2 → FR-034, FR-042, R2, R12; 3 → FR-034,
Assumptions, R2, R14; 4 → FR-026, R8 (A9); 5 → FR-040, R9; 6 → FR-027, R8, R10; 7 → FR-034, R9;
8 → FR-010, R7; 9 → FR-042, R12; 10 → FR-013, FR-015, R5; 11 → FR-043, R11.

Orchestrator decisions taken as given: the §1.3 hand-offs went into #6 (FR-034 the hook fix;
FR-035 "built in each checkout…" and "answers in one call"), #7 (FR-021: every "ended
consistent" copy and Principle III, 3.0.2 PATCH) and #8 (FR-040: the hooks and verify-output
sentences and the load-model hooks cell). #5's family (the graph's saving in composition.md,
SKILL.md and graphers-and-sdd.md) was not handed off: this change fixes what is left and pins it
on MV-152. This change is the backstop for every family (R7). The constitution's Principle III
amendment is #7's; this change verifies it. The optional body byte-ceiling test is not added.

## R1. What the pack costs, and what of it is said elsewhere

| File | 62d4588 | `e6f7994` (#5) | prototype |
| --- | --- | --- | --- |
| SKILL.md frontmatter (listed every Claude session) | 314 | 314 | 314 |
| SKILL.md body (loads when the skill triggers) | 7,786 | 8,738 | 3,383 |
| references/change.md | 18,069 | 19,481 | 6,503 |
| references/anchors.md | 7,799 | 7,799 | 4,413 |
| references/discovery.md | 7,112 | 7,112 | 3,298 |
| references/interview.md | 3,793 | 3,793 | 3,198 |
| references/verify.md | 5,582 | 5,582 | 3,101 |
| **total** | **50,455** (12,557 tk) | **52,819** | **24,210** (6,131 tk) |

The pack is committed twice (`skills/multivac/` and `.claude/skills/multivac/`), 100,910 B →
48,420 B in the prototype.

**Method** (the one T006 repeats on the merged tree). Split each file into paragraphs at blank
lines outside code fences (`skill-pointers/paras.py`: 19 paragraphs in SKILL.md, 53 in
change.md, 29 in anchors.md and verify.md, 35 in discovery.md, 12 in interview.md). Class each
one, naming the evidence:

- **a — said elsewhere**: a surface prints it where it applies — the brain door (loaded every
  session through `AGENTS.md`/`CLAUDE.md`), a lifecycle line or refusal, a `verify` line,
  `mvac help anchor`, `mvac count`, the seed report, `multivac change`'s usage. Evidence: the
  log line or the door line, in a scratch ecosystem of the configuration it holds for.
- **b — only here**: judgement or procedure no command prints (the `moved` and `broken` forks,
  the legs pattern, the retire procedure, the blast-radius batches, the interview).
- **c — false or stale**: the code contradicts it. Evidence: the run that shows it.
- **mixed**: split and class each sentence.

Result at 62d4588 (`skill-pointers/classify.py`, paragraph bytes): said elsewhere 23,732 B
(47%), mixed 8,626 B (17%, mostly said elsewhere), only here 16,269 B (32%), false 1,167 B
(2%), frontmatter 313 B — about 60% of the pack restates a surface. Two door clauses were
verbatim (R6).

**Decision**: a becomes a pointer that names its surface and the condition it prints under, or
goes where the reader is already looking at the surface; b stays; c is corrected or goes; and a
fact a sibling change added stays unless the merged tree prints it (R3).

**Rationale**: the door, the lifecycle lines and the verify lines are loaded or printed anyway
(SessionStart runs `verify`), so a pointer to them costs the session nothing extra.

**Alternatives considered**: a byte budget per file (rejected: it trims judgement as readily as
restatement); moving the pack into the door (rejected: the door is paid in every session of
every harness).

## R2. Where the skill reaches

- **Only the `claude` door target projects it**: src/adapters/registry.ts:534 is the only
  `skill:` entry. `doors` writes it into `.claude/skills/multivac/` in the brain and in every
  managed code repo (src/commands/doors.ts:238, `projectInto`). Measured (Q1, a code-less brain
  with `web` and `api`): `diff -rq $SYN/pack $SYN/Q1/{brain,web,api}/.claude/skills/multivac`
  finds all three identical. A `managed: false` or shallow repo gets none. Nothing writes
  `.agents/skills/multivac`.
- So the skill loads behind the **consumer door** too, and in no codex, cursor or agents-only
  session.
- **Harness fact, as measured (critic gap 2)**: graphify's own install writes its skills into
  `.agents/skills`, `.codex/skills`, `.gemini/skills`, `.opencode/skills` and `.copilot/skills`
  (src/adapters/registry.ts:1084-1090; MV-131, MV-147; this repo tracks
  `.agents/skills/graphify/SKILL.md`). "The one harness that loads a skill" was never measured
  and is contradicted. The measured statement is "multivac projects its skill only into the
  `claude` target"; the pages say "multivac installs it only for Claude Code".
- **A brain with no `claude` target (critic gap 3)**: `init . --provider codex` writes no
  `SKILL.md` anywhere, yet prints `init:   1. load the multivac skill in your agent — it
  carries both protocols` (src/commands/init.ts:773), and the empty-brain door carries `brain
  empty — load the multivac skill to fill it.` (src/doors/brain.ts:220). MV-70 names this
  shape. The discovery and interview protocols are unreachable there.

**Decision**: the saving is stated as Claude Code's; the pages say multivac installs the skill
only for Claude Code and do not contradict the session-zero text; making the skill reach every
harness (projecting it to `.agents/skills/multivac`, or making the two lines conditional) is
the follow-up `skill-reaches-every-harness` (R14).

**Rationale**: moving a fact from the skill to the door or the lifecycle loses nothing for a
harness that never had the skill; fixing the codex session-zero line is tool behaviour with its
own row.

## R3. The core and its references

**Decision**: the prototype's shape (`$SYN/pack/`), re-derived on the merged tree:

- **Body**: the contract (the brain door says …; the rhythm, which `multivac change` lists;
  each step says what it did and what it left to you; each refusal names what it looked for and
  the command that fixes it: run what they print; this skill carries what they do not); *Where
  you are*; session zero; seven rules; *When to read what*; the grapher and ecosystem-graph
  pointers. data-model.md lists each section and what it keeps.
- **References**: change.md 18,069 → 6,503; verify.md 5,582 → 3,101; anchors.md 7,799 → 4,413;
  discovery.md 7,112 → 3,298; interview.md 3,793 → 3,198 (prototype).
- **The five reference names stay**: src/commands/seed.ts:57-58 and :195 print
  `references/interview.md` and `references/discovery.md`; init.ts:773 says the skill "carries
  both protocols".

**What the sibling changes put into the skill, and what happens to it** (FR-010; T006 checks
each on the merged tree):

| Change | Fact in the skill | Kept? |
| --- | --- | --- |
| #5 | SKILL.md's paragraph on asking each checkout's graph from a code-less brain (`--graph <checkout>/…`, `-p <repo>`, paths relative to the checkout) | goes: its door prints "This brain holds no code, so it keeps no code graph: each code repo keeps its own. ASK IT … with each verb's flag pointed at a repo below" and `apply` prints "its graph: … — paths in its answers are relative to this checkout" (`graphPointer`, src/commands/change.ts at e6f7994) |
| #5 | change.md: land appends ignore lines; a code-less brain commits no brain graph; the refresh follows only in the edited repo | each classed on the merged tree: land's lines print the ignore writes; what nothing prints stays |
| #6 | "give codegraph a symbol" | kept only if #6's rendered codegraph door does not name the symbol form |
| #6 | a worktree's local index | covered by "where a grapher is declared, `change apply` prints the flag that asks each worktree's graph" |
| #7 | claims are IDs (field 4); close's citation gate | kept (change.md's `new` and `close`) |
| #8 | the quiet fold in rule 2 and verify.md; verify.md's short "Quiet" paragraph | kept; the paragraph goes only if `verify --quiet` prints the same |

**IDs the pack cites (critic gap 8)**: MV-150 (the citation gate) and MV-151 (the quiet fold)
did not exist at 62d4588. T008 re-maps every ID the pack cites by grepping each row's legs on
the merged tree; a sentence true only once its owner's feature shipped carries the pre-feature
truth if it did not: rule 2 without the quiet clause; verify.md's read-line sentence without the
quiet clause; close without the citation clause ("refuses to archive until every claim resolves
on its anchors"); the apply-flag sentence dropped (grep).

**Alternatives considered**:

- **The investigator's trim, 22,278 B.** Rejected as it stood: four verdicts found pointers
  that dangle (R5). The verifiers' fixes cost +1,932 B: +750 in the body (the rhythm, *Where
  you are*, rule 6's conditions, rule 3's clause), +520 in change.md, +550 in verify.md (the
  read-line fixes and CI), +112 in discovery.md (equip).
- **Pinning "This skill carries only what no command prints".** Rejected: false for the pack
  itself — rule 3 restates the door's cite-by-ID on purpose because MV-126 relies on it. The
  pinned sentence is "run what they print".
- **"Each step prints the next one, commits its own bookkeeping".** Rejected: false for `plan`
  (no next command without an SDD: `skill-pointers/C-none/plan.log`,
  `verify-skill-pointers-cross-adapter/Y/plan.log`) and for `close` (it prints the commit:
  `D-cl-spk-gfy/close.log`, `?? specs/`).
- **Moving the anchor grammar out with no pointer.** Rejected: it stays reachable as `mvac help
  anchor` (1,787 B), named in the table.
- **"Claim the row to have close check it too" for a retired row.** Dropped: after #7,
  `citeLines` refuses a claim of a retired row or one under `retires`.

## R4. Savings, measured

`python3 $SYN/sessions.py <skills roots>` (cl100k). Net figures add the pointers the new pack
creates: `multivac change` usage 740 B / 194 tk, `mvac help anchor` 1,787 B / 460 tk, the
brain's `AGENTS.md` 4,341 B / 1,142 tk (Q1).

| Session | 62d4588 | prototype, gross | net of pointers | saving (net) |
| --- | --- | --- | --- | --- |
| change (body + change.md) | 25,855 B / 6,348 tk | 9,886 / 2,536 | + usage: 10,626 / 2,730 | **−15,229 B / −3,618 tk** |
| change in a **code repo** (+ reads the brain's door) | 25,855 / 6,348 | — | 14,967 / 3,872 | **−10,888 B / −2,476 tk** |
| change drafting anchors (+ anchors.md) | 33,654 / 8,436 | 14,299 / 3,715 | + usage + help: 16,826 / 4,369 | −16,828 B / −4,067 tk |
| discovery at session zero (+ discovery + anchors) | 22,697 / 5,794 | 11,094 / 2,861 | + help: 12,881 / 3,321 | −9,816 B / −2,473 tk |
| interview (+ interview) | 11,579 / 2,851 | 6,581 / 1,666 | — | −4,998 B / −1,185 tk |
| anchor writing (+ anchors) | 15,585 / 4,012 | 7,796 / 2,061 | + help: 9,583 / 2,521 | −6,002 B / −1,491 tk |
| verify reading (+ verify) | 13,368 / 3,272 | 6,484 / 1,650 | — | −6,884 B / −1,622 tk |
| **floor: body only** | 7,786 / 1,924 | 3,383 / 882 | — | **−4,403 B / −1,042 tk** |
| listing (frontmatter), every Claude session | 314 | 314 | — | 0 |

- **Against #5's branch this is a projection**: body + change.md there is 28,219 B, −18,333 B
  against the unrebased prototype. T002 measures the merged baseline; T024 the result.
- **Where it holds**: the −15.2 KB holds where change.md is read in a change session, which is
  what the table directs.
- **The worst case is a bare close**: an agent that got by on the old 7,786-byte body now reads
  body + change.md (9,886 B), +2,100 B.
- **The door, the lifecycle and verify lines cost 0 extra**: the door is loaded (CLAUDE.md →
  AGENTS.md, registry.ts:529-532), the lines print either way, and SessionStart runs `verify`.
- **Repository**: the two committed copies, −52,490 B.
- **Docs pass**: 0 tokens per session. Nothing agent-loaded points at DESIGN, the site or the
  README (`git grep -E 'DESIGN\.md|site/content|multivac\.ulm0\.com'` over AGENTS.md,
  CLAUDE.md, the skills and src/doors: 0). The constitution, read by the Constitution Check,
  moves by a few bytes.
- **Law**: the row and its legs are about 7 KB in a 416,889-byte invariants.md, which agents
  grep and never read whole; the verify summary grows by one claim, same shape.

## R5. Pointers that hold in every configuration

Each pointer's evidence, with the scenario that measured it (`skill-pointers/{A-spk-gfy,
B-ops-cg, C-none, D-cl-spk-gfy}`, `verify-skill-pointers-cross-adapter/{X, X2, X3, Y, G, G2}`,
`synth/Q1`):

| Finding | Measured | Decision |
| --- | --- | --- |
| The consumer door lists no SDD step and no `multivac change` | 0 `[proof`/`[ungateable` lines in consumer doors vs 7 / 4 / 7 in brain doors | every pointer says "the brain door" (FR-014) |
| A code repo's `change new` advises `multivac init .` | Q1: `change new fix` in `web` → "run `multivac init .`", rc 2; following it turns the consumer door into a brain door (X2) | *Where you are* (FR-013); the tool fix is #8's or the follow-up's |
| `change plan` prints no next step without an SDD | `C-none/plan.log`, `Y/plan.log` | the rhythm stated once in the core (FR-017) |
| A grapher declared under `graphers:` has no verbs | G's door: "`mygraph` has NO query command: the artifact is written but nothing reads it back. Do not invent one." | "or says it has none: then grep" |
| No grapher: the door says nothing about one; `apply` prints no flag (critic gap 10) | critic `render.mjs none` on e6f7994 | "or names no grapher"; "where a grapher is declared, `change apply` prints the flag" (FR-015) |
| The ecosystem graph has a verb only with graphify | B, C and Y doors name no verb | "(where it names no verb, read the JSON)" |
| A declared grapher's "no graph to ask" | Y: no grapher, `repos check` "ok cloned" | "or, where a grapher is declared, that has no graph to ask" (FR-016) |
| The `read` lines state a fact, not a fix | `C-none/v-states.log`: FELL BACK, last fetch, behind its own channel | three fix lines in verify.md (FR-005) |
| MV-141 names "describe equip" | the investigator's trim dropped it | discovery §0 "clones every declared repo and equips it" (FR-016) |
| Rule 6 dropped MV-137's conditions | X (code-less, spec-kit, from `web`): code commit on main rc 0, `verify --strict` exit 0, `verify --strict --range HEAD~1..HEAD --branch main` exit 1; Y (brain==code, `sdd_auto: false`): rc 0; code-in-change.ts:167 returns null unless `cfg.sddAuto` and `sddGoverning` | rule 6 names them (FR-003) |
| *Where you are* said "write code … here" (critic gap 10) | rule 6 says only in the worktree `apply` prints | "write code in the worktree `change apply` printed and run `verify` there" |
| A code-less brain with per-repo graphers has 0 grapher lines at 62d4588 | cross-adapter verdict | checked on the merged tree (FR-019); the critic found it passing on e6f7994: per-repo codegraph lists `codegraph query <symbol> -p <repo>` |

## R6. The restatement test

**Method** (prototyped in `$SYN/skill-door.proto.test.js`, against the real renderers):
`renderBrainDoor(config, 1)` and `renderConsumerDoor(config, repoKey)` (src/doors/brain.ts:197,
src/doors/consumer.ts:49) on literal `Config` objects built as test/doors/doors.test.ts:222
builds them; each door split into clauses on ` — `, `; ` and `. ` after trimming a leading `- `;
clauses of 30 or more characters kept; the pack's `.md` files joined and whitespace-normalised;
the test asserts no clause is a substring of the pack.

**Measured**: today's pack fails on 2 distinct clauses — "the closing ceremony no tool can
check" (change.md:192) and "`change plan` refuses while it is missing, empty or still the
template." (discovery.md:144); #5's pack fails on the same two. The prototype passes: 10 doors,
204 clauses, 0 restated. Over 17 rendered doors from the scenarios and Q1, `clauses.py` also
finds 0.

**Critic gap 1**: the prototype's three "brain==code" fixtures used `repos: { brain: { path:
'.' } }` with no `isBrain: true`; whether a brain holds code is decided only by `isBrain`
(src/doors/brain.ts:199 at 62d4588; src/adapters/detect.ts:213 on #5), which only `loadConfig`
sets. With `isBrain: true` the clause count moves 204 → 210 at 62d4588 and 220 → 232 on #5; on
#5 the "speckit+graphify brain==code" fixture had rendered "This brain holds no code, so it
keeps no code graph", and the declared-grapher fixture never rendered "has NO query command".
The pack still restated 0 with the fixtures fixed: coverage, not a failure.

**Decision**: the fixture set of FR-018, each fixture asserting its marker:

| Fixture | Renderer | Marker its door must carry |
| --- | --- | --- |
| spec-kit + graphify, brain holds code (`isBrain: true`), one code repo | brain | `It is also the code it governs` and `## graphify` |
| openspec + codegraph, brain holds code | brain | `It is also the code it governs` and `codegraph` |
| no adapter | brain | no `[proof:` line |
| code-less, spec-kit + graphify over `web` and `api` | brain | `holds no code` |
| spec-kit under `sdd_auto: false` | brain | a spec-kit step line, and no `REFUSES` |
| a grapher declared under `graphers:`, brain holds code | brain | `has NO query command` |
| empty brain (`renderBrainDoor(cfg, 0)`) | brain | `brain empty — load the multivac skill to fill it.` |
| code-less, per-repo graphers only | brain | each grapher's verb flag (`-p` / `--graph`) |
| code-less, mixed graphers | brain | each grapher's verb flag |
| one code repo under spec-kit | consumer `web` | `its brain is mounted at` |
| two code repos under spec-kit + graphify | consumer `web` | `graphify` |
| `sdd_auto: false` | consumer `api` | `its brain is mounted at` |
| codegraph declared per repo | consumer `web` | `codegraph` |

T005 of tasks.md records each marker from the merged tree's renderers; where a door's wording
moved, the marker follows the rendered text.

**Rationale**: a verbatim check over the doors the tool actually renders catches the drift
that matters most (a door edit that the skill then repeats), and costs nothing at run time.

**Alternatives considered**: a test that every `mvac help <topic>` the pack names exists
(rejected: the pack names one topic, and `TOPICS` is not exported, src/commands/help.ts:46); a
body byte ceiling (not added: orchestrator's decision, §10 of the design; the body is 3,383 B in
the prototype and #5 alone added +819 B, so a ratchet is the human's call); a site-sample replay
test (brittle: PATH-dependent graphify lines, the banner); a CHANGELOG number-word test (would
bind history: CHANGELOG.md:976 has the same shape).

## R7. Composition with #5–#8, and the backstop

MV-111 puts a retired sentence's copies in the change that retires it, and the leg on that
change's row. The hand-offs as the orchestrator wrote them, and the legs the owners' artifacts
plan (read from `c6/artifacts/076-*/research.md:805`, `c7/artifacts/077-*/research.md:452-453`,
`c8/artifacts/078-*/research.md:649` and their hand-off tasks):

| Family (R8) | Owner | Owner's planned leg | Alternatives it pins | Left for MV-152 unless M0 shows otherwise |
| --- | --- | --- | --- | --- |
| A1 close claim | #7, MV-150 (its FR-021 and T069) | `brain:{DESIGN.md,.specify/memory/constitution.md,site/content/**,skills/**,.claude/skills/multivac/**} /ended (up )?consistent\|checks law and code\|anywhere the change touched/ absent` | `ended (up )?consistent`, `checks law and code`, and "no blocking leg broke anywhere the change touched" through `anywhere the change touched` | `earlier and stricter place`, `relaxed in code instead of (amended )?in the law`; and any copy in a root `*.md` other than DESIGN.md, which MV-150's glob omits |
| A2 graph saving | not handed off (#5); #6's leg covers part | MV-149: `… /sentence and you get nothing\|sentence returns nothing\|in (one\|a single) call what (grep\|a search) takes many\|one call answers what a search\|^takes many/ absent` over `{*.md,src/**,test/**,site/content/**,skills/**,.claude/skills/**}` | the composition and skill copies, as worded at 62d4588 | `The half that pays for it is` (graphers-and-sdd.md), and `answers in (one\|a single) call` where not followed by "what (grep\|a search) takes many" |
| A3 skill-only phrases | #9 (running-changes.md:391 is also in #7's FR-021 list) | none | none | all four |
| A4 hooks cell | #8, MV-151 (its FR-040 and T074) | regex not drafted in #8's artifacts | read at T004 | whatever MV-151 does not pin |
| A5 slash shims, A6 Cursor stub, A7 install step, A9 close commits | #9 | none | none | all |
| A8 codegraph checkout sentence | #6, MV-149 (its FR-035 and T080) | `brain:site/content/** /built in each checkout, get no refresh/ absent` (hand-off) | the phrase | nothing, if MV-149 carries it |
| the codegraph door's "It answers in one call what grep takes many" (src/doors/brain.ts:163; 3 rendered doors at 62d4588) | #6, MV-149's `src/**` leg | above | the phrase | nothing; T005's door sweep checks 0 |

**Decision (FR-020)**: T004 decides per alternative on the merged tree:

1. Count the alternative with `mvac count` over its glob (the documents) and over the rendered
   doors and flow.md of the matrix (T005).
2. An alternative is **pinned** when a leg of a merged row reads every file its 62d4588 copies
   were in and its regex matches each of those copy lines (checked with `grep -E -i` of the
   owner's regex over the lines quoted in R8).
3. Pinned and 0 → nothing here. Hits → fixed here, pinned on MV-152, and the change body names
   the owner that missed them. 0 and unpinned → pinned on MV-152.

**Rationale**: the owners' regexes are narrower than the families (MV-149 pins the graph saving
only when followed by "takes many"), so a per-family rule would either double-pin or leave
alternatives unguarded.

**As merged** (read at T004 on `6cf0d06`): MV-150's leg is `brain:{*.md,.specify/memory/*.md,
site/content/**,skills/**,.claude/skills/multivac/**} !CHANGELOG.md /ended (up )?consistent|checks
law and code|anywhere the change touched|relaxed in code instead of|got quietly relaxed/ absent`, so
it reads every root `*.md` and pins "relaxed in code…" too: of A1 only `earlier and stricter place`
is left to MV-152. MV-151 carries A4's leg as drafted, and MV-149's `brain:site/content/** /get no
refresh and no commit/ absent` pins A8's copy line.

## R8. The retired-sentence families

`G` is `brain:{*.md,.specify/memory/*.md,site/content/**,skills/**,.claude/skills/multivac/**} !CHANGELOG.md`.
Picomatch reads `*.md` as root-only (src/lib/glob.ts), so no family leg reads
`.multivac/invariants.md` (whose MV-152 row quotes the phrases) or `specs/` (critic, checked).
Copies at 62d4588 (`git grep -n -i -E` over the glob):

| Id | Regex | Glob | Copies at 62d4588 | Replacement, worded from the code |
| --- | --- | --- | --- | --- |
| A1 | `checks law and code\|ended (up )?consistent\|no blocking leg broke anywhere\|earlier and stricter place\|relaxed in code instead of (amended )?in the law` `/i` | G | **16 in 9 files**: SKILL.md:77-78 ×2 each copy; change.md:179-180 ×2 each copy; constitution.md:47; DESIGN.md:163, :783-784; philosophy.md:90; the-change.md:67, :84; running-changes.md:369 | `close` verifies the rows the change claims, so claim the row you amend; `verify` reports every other row on each commit where the hooks are armed, and refuses one only in a blocking mode (by default `absent`, `count`, `each`: config.ts:373) or under `--strict` (verify.ts:838-846 `legGates`); the mechanical half is "the landing order held, every declared repo landed, every declared claim resolves" |
| A2 | `answers in (one\|a single) call\|one call answers what\|The half that pays for it is` `/i` | G | **4**: SKILL.md:117 each copy; composition.md:78; graphers-and-sdd.md:145 (:237-239 on #5, contradicting its own :327-328) | "A graph answers who calls a function and what an edit reaches, for the checkout you ask it about, as of its last refresh. It usually costs more bytes than a well-narrowed search; what it returns is the answer a search cannot give." / "The other half is the agent asking the graph instead of grepping the tree, for an answer about what reaches what rather than for fewer bytes." |
| A3 | `journal entry\|landing plan in graph order\|OpenSpec has no such document\|hold you to it at close` `/i` | G | **9**: change.md:137, :182, :287, :315 each copy; running-changes.md:391 | gone with the trim; running-changes: "from then on the new legs gate every run" |
| A4 | `never read — they fire` | `brain:{DESIGN.md,site/content/**}` | **3**: DESIGN.md:1002, distribution.md:135, integrations.md:278 | #8's wording; the design's, if #8 left one: "their output — each commit or push through the git shims; in Claude Code, session start and a failed check after an edit" |
| A5 | `` `pre-commit` ?\/ ?`pre-push`([^ \/]\| [^\/]\|$) `` | `brain:{DESIGN.md,site/content/**/*.md}` | **5**: DESIGN 2, brain-driven-development 1, distribution 1, integrations 1 | "`pre-commit`, `pre-push` and `pre-merge-commit`" |
| A6 | `cursor: \.cursor\/rules\/multivac\.mdc ok\|Cursor wants `?\.cursor\/rules\|file written \| `\.cursor\/rules\/multivac\.mdc`` | `brain:{DESIGN.md,site/content/**}` | **3**: distribution.md:88, commands.md:859, integrations.md (`cursor` section table) | Copilot as the stub example; `cursor: AGENTS.md ok (read natively)`; "file written \| nothing — Cursor reads `AGENTS.md` natively" |
| A7 | `no install step\|^install step to forget` `/i` | `brain:{*.md,site/content/**} !CHANGELOG.md` | **4**: DESIGN.md:352-354, :1147-1148; brain-driven-development.md:95-97; getting-started.md:59-60 | "the scripts travel with the clone, and `doors` arms them in each one (`core.hooksPath` is per-clone git config)" |
| A8 | `built in each checkout, get no refresh` | `brain:site/content/**` | **1** (graphers-and-sdd.md:402-403; :693 on #5), true until #6 | "is synced there at `change land` and commits no index; a read-only repo gets no refresh and no commit" |
| A9 | `` `?close`? commits (it\|them)\|`change close` from committing `` | G | **4** (critic): change.md:135 each copy; running-changes.md:262 (:277 on #5); configuration.md:165-166 | "`close` names it in the archive commit it prints" (change.ts:1470-1491: "archived — commit this on a branch"); configuration: "Neither stops `change close` from naming the brain's spec directories in the archive commit it prints and citing them in its body" |

**"on every commit" (critic gap 6)**, no leg: constitution.md:132 ("checked by `multivac verify`
on every commit"), composition.md:24 (:43 on #5), concepts/invariants.md:58, CONTRIBUTING.md:9.
A fresh clone has an empty `core.hooksPath` (checked on e6f7994), so each becomes "on each
commit where the hooks are armed" (and "and in CI" where the page is about CI's run). The phrase
is true in the hook listings (getting-started.md:49, commands.md:182: the shim "runs `mvac
verify` on every commit"), so a leg would forbid true text: a stated ceiling. src/doors/flow.ts:51
renders "`verify` refuses a commit whose anchors are broken", false for `present` and `unique`
legs ("reported only — "present" is not in blocking"): tool code, handed to
`doctor-names-every-gate`.

**Probes** (prototype): the A5 regex matched the two false shim lines and not a correct
`` `pre-commit` / `pre-push` / `pre-merge-commit` `` listing (a staged probe file, `node
dist/cli.js count`: 2 matches in 3 lines). The A6 alternatives leave integrations.md:46 and :56
alone, which name the retired path truthfully. The cursor alternative `git add -- [^&]*\.cursor `
was dropped: a real cursor + spec-kit init prints `.cursor`. `/no refresh and no commit/` was
narrowed to A8's phrase. Every replacement sentence was grepped against every family: 0. No
vendor text trips a phrase (graphify 0.9.29 site-packages: 0). Paraphrase legs are `/i`.

## R9. The docs pass: leftovers and one place

- **The hooks cell** (A4, #8's): the design's wording rests on commits printing 471 B green at
  62d4588 and 188 B after #8, a codex brain with no harness hooks 342 and 250 B,
  PostToolUse feeding only exit-2 stderr (src/doors/settings.ts:15-16), and graphify's
  hook-guard nudges (190 B, 402 B). Where #8 put its own wording, it stands.
- **integrations.md's third load table** becomes a link to distribution.md's, keeping "Only
  `claude` currently has all three … see [Hooks](../hooks)". Harmonising the three raised
  verbatim duplication (23,329 → 23,552 B).
- **Cursor**: integrations.md's `## \`cursor\`` section becomes native (−590 B prototype); the
  heading stays for MV-31's `count=8`.
- **composition.md's refresh and commit claims**: the codex+graphify door says "refreshed at
  `change land` and `change close`", and after an edit there `graphify query` finds no new
  symbol (docs cross-adapter verdict).
- **README**: the prototype's rewrite of the 62d4588 paragraph kept MV-141's unique phrase at 1;
  T045 rewrites the merged text, keeping #5's "in the brain when it holds code" clause.
- **"The skill carries…"** (DESIGN.md:1005-1010, distribution.md:138-141): "~60 lines" goes —
  the brain door measured 14–29 lines; "Only Claude Code loads it" becomes "multivac installs it
  only for Claude Code" (critic gap 2); DESIGN.md:1014-1016 and :1032-1033 "under the
  managed-block rule where the target format allows" become "`doors` mirrors the skill
  directory" (critic gap 7: MV-73, doors.ts:114-136 `mirror(...)`, integrations.md:129).
- **One place**: `$SYN/docs/design-section.md` (2,122 B) and `$SYN/docs/composition-section.md`
  (971 B). A per-row list, not a table of configuration cells: three verifiers found states a
  table had no cell for (`sdd_auto: false`, a declared grapher, an unverified grapher). Each row
  keeps its own numbers (MV-111). The DESIGN draft's last bullet says "Only Claude Code loads
  it" — rewritten per gap 2.
- **"never installs anything"**: multivac runs vendor installs, e.g. `graphify install
  --project --platform claude` (Q1 `sync.log`); graphers-and-sdd.md:12 already says "a tool's
  binary".
- **"no install step to forget"**: a fresh clone has an empty `core.hooksPath` and a commit
  prints 0 B; `installHooks` is called by `doors` (doors.ts:265) and `init` (init.ts:678).
- **Close samples**: commands.md:1581 and :1694-1696 pathspecs made to match change.ts:1470
  (the archive, the change file, `.multivac/invariants.md`, graphs, `.multivac/ecosystem.json`,
  SDD paths); the-change.md:98 and philosophy.md:104 cut to the `$` line, the ritual lines they
  discuss and a link (−662 B net, measurement verifier); each replayed in its own fixture after
  #5 (designed, not trialled).
- **configuration.md:153-154** (critic gap 5): "runs automatically" is false — steps instruct
  the agent and are never shelled out (MV-51); the registry's `at:` values are new, plan, apply
  and land (registry.ts:700-760, :944-998). Becomes "prints its steps and gates on their
  artifacts at `change new`, `change plan`, `change apply` and `change land`".
- **CHANGELOG**: one Unreleased entry naming MV-152 with the M7 figures; it names only the
  families MV-152 retires (the close claim, the hooks cell and codegraph's sentence are in their
  owners' entries). The intro's number word is recounted (#5 made it "three"; #7 may add one).

Prototype byte deltas (`wc -c` against `git show HEAD:`): DESIGN.md +2,595; composition.md
+1,382; README.md +255; distribution.md +263; integrations.md −589; philosophy.md −69;
constitution.md −8; the-change.md +60; running-changes.md +31; graphers-and-sdd.md +56;
brain-driven-development.md +17; getting-started.md +16; commands.md −1.

## R10. The constitution

- **Principle III** (constitution.md:44-50) said `change close` "verifies that law and code ended
  consistent". Close evaluates only the claimed IDs (src/commands/change.ts:1392,
  src/commands/verify.ts:877-880); a touched row whose `present` leg broke closed with rc 0
  (`skill-pointers/C-none`, change `third`), and the default hook only reports it (config.ts:373).
  The door's rule is "the row wins: amend the document". #7's FR-021 amends it: "… and `change
  close` verifies the rows the change claims", 3.0.1 → 3.0.2, Last Amended its day, no Sync
  Impact Report. **Decision**: T001 verifies it on the merged tree; this change makes it only as
  the backstop (same wording, PATCH), recording #7's miss.
- **The Compliance line** (:132, critic gap 6): "checked by `multivac verify` on every commit"
  becomes "checked by `multivac verify` on each commit where the hooks are armed, and in CI".
  #7's FR-021 does not list it. As merged (3.0.2) the line reads "`multivac verify` gates its
  blocking legs on every commit where the pre-commit hook and CI run it, and reports the rest":
  #7's PATCH took it, and T034 edits nothing. **Decision**: if #7's PATCH took it, nothing; otherwise this
  change amends it in place with a PATCH (3.0.2 → 3.0.3), Last Amended the day of the commit, no
  Sync Impact Report; the human re-grades. Folding it into #7's 3.0.2 is preferable (one
  amendment) and is the orchestrator's to hand off.
- MV-120's `2\.0\.[01]` leg, MV-126's Principle I leg and MV-146's `/Sync Impact/ absent` hold
  (prototype). `doctor` reports the recorded sha as moved (MV-135): a report, not a gate.
- `/speckit.plan`'s Constitution Check reads Principle III while this change's own plan runs;
  plan.md says so.

## R11. Legs

**New MV-152 legs** (prototype `$SYN/legs152.txt`; dry-run with `mvac count` at 62d4588 and
`node dist/cli.js count` in the prototype):

| Id | Leg | 62d4588 | prototype | Lands with |
| --- | --- | --- | --- | --- |
| S1 | `brain:skills/multivac/SKILL.md /run what they print/ unique` | 0 | 1 | T023 |
| S2 | `brain:skills/multivac/SKILL.md /\*\*Where you are\.\*\* Behind a consumer door you are in a code repo/ unique` | 0 | 1 | T030 |
| S3 | `` brain:skills/multivac/SKILL.md /`close` verifies only the rows the change claims/ unique `` | 0 | 1 | T023 |
| S4 | `brain:skills/multivac/references/discovery.md /clones every declared repo and equips it/ unique` | 0 | 1 | T030 |
| S5 | `brain:skills/multivac/references/verify.md /Pull the brain before you believe any red/ unique` | 0 | 1 | T030 |
| A1′ | G, the A1 alternatives T004 leaves to MV-152, `/i absent` | 16 | 0 | T033 |
| A2′ | G, the A2 alternatives T004 leaves to MV-152, `/i absent` | 4 | 0 | T035 |
| A3 | G `/journal entry\|landing plan in graph order\|OpenSpec has no such document\|hold you to it at close/i absent` | 9 | 0 | T036 |
| A4′ | `brain:{DESIGN.md,site/content/**} /never read — they fire/ absent`, only if MV-151 does not pin it | 3 | 0 | T041 |
| A5 | `` brain:{DESIGN.md,site/content/**/*.md} /`pre-commit` ?\/ ?`pre-push`([^ \/]\| [^\/]\|$)/ absent `` | 5 | 0 | T042 |
| A6 | `` brain:{DESIGN.md,site/content/**} /cursor: \.cursor\/rules\/multivac\.mdc ok\|Cursor wants `?\.cursor\/rules\|file written \| `\.cursor\/rules\/multivac\.mdc`/ absent `` | 3 | 0 | T043 |
| A7 | `brain:{*.md,site/content/**} !CHANGELOG.md /no install step\|^install step to forget/i absent` | 4 | 0 | T051 |
| A8′ | `brain:site/content/** /built in each checkout, get no refresh/ absent`, only after #6 and only if MV-149 does not pin it | 1 | 0 after #6 | T039 |
| A9 | G `` /`?close`? commits (it\|them)\|`change close` from committing/i absent `` | 4 | 2 → 0 with FR-026 | T037 |
| U1 | `brain:DESIGN.md /^### Adapter first, fallback always/ unique` | 0 | 1 | T048 |
| U2 | `brain:site/content/docs/concepts/composition.md /^## Adapter first, fallback always$/ unique` | 0 | 1 | T049 |
| T1 | `brain:test/skill.test.ts /the pack restates no clause a door renders/` | 0 | never dry-run (critic gap 11) | T023 |
| T2 | `brain:test/skill.test.ts /'references\/verify\.md'/ unique` | 0 | never dry-run (critic gap 11) | T023 |

The whole prototype set, attached to a scratch MV-152 set `active` so every leg gates, ran
`node dist/cli.js verify --strict --check`: `149 claims · 148 anchored · ok 148 · 0 blocking
broken · exit 0` (`$SYN/verify-legs.log`; MV-148 was still reserved).

**Order (FR-028)**: a declared leg that does not yet pass prints in full on every verify, and
after #8 a pending claim forces the full report. Attaching the docs legs before their edits
measured 348 → 2,934 B per verify (+2,586 B, about 647 tokens) at every session start. Each leg
lands in the commit whose edits turn it green.

**The 33 legs that read skill text at 62d4588** — every one **kept**, none moved or amended
(prototype counts equal; `python3 $SYN/legs.py $SYN/clone`, which T003 re-runs on the merged
tree, and the critic's `globlegs.mjs` found exactly these 33):

| Row | Mode | Glob and regex | Count | Kept by |
| --- | --- | --- | --- | --- |
| MV-38 | present | discovery.md `/questions/` | 3 → 3 | the order line, §3's heading and its pointer ("open questions") |
| MV-51 | present | change.md `/The SDD flow — the lifecycle instructs, YOU run, the gate checks/` | 1 → 1 | the SDD flow heading |
| MV-52 | present | change.md `/it follows YOUR edits, not the commit/` | 1 → 1 | the graph heading |
| MV-53 | present | SKILL.md `/Read the .read. lines before you read the verdicts/` | 1 → 1 | rule 2 |
| MV-57 | present | change.md `/reports the document missing, still-a-template, present, or/` | 1 → 1 | the SDD flow section |
| MV-72 | unique | SKILL.md `/^# multivac — operating protocol$/` | 1 → 1 | the H1 |
| MV-72 | unique | .claude/skills/multivac/SKILL.md, same | 1 → 1 | the copy |
| MV-89 | unique | change.md `/planned — the state before the rhythm starts/` | 1 → 1 | the `planned` heading |
| MV-89 | unique | SKILL.md `/PROMOTES the file rather than writing a second one/` | 1 → 1 | rule 7 |
| MV-111 | absent | `skills/**` `/^[[:space:]]*[a-z_-]+ -> [a-z_-]+/` | 0 → 0 | "There is no edge form" |
| MV-120 | absent | `{*.md,site/content/**,skills/**,.claude/skills/**}` the `mvac`-on-PATH phrasing | 0 → 0 | — |
| MV-121 ×4 | absent | the downloads / undocumented-query / `init / update / list / show` / settings.json phrasings | 0 → 0 | — |
| MV-122 | absent | the vocabulary phrasings | 0 → 0 | — |
| MV-123 | absent | the PATH / stderr phrasings | 0 → 0 | — |
| MV-124 | absent | the untracked / artifact phrasings | 0 → 0 | — |
| MV-125 | absent | "every declared, present repo" phrasings | 0 → 0 | — |
| MV-127 | absent | `git submodule add <brain-url>` | 0 → 0 | — |
| MV-128 | absent | "only the change lifecycle (calls\|runs) it" | 0 → 0 | — |
| MV-136 | unique | SKILL.md ``/declare `repos:` in `\.multivac\/config\.yml` before the brain's/`` | 1 → 1 | session zero |
| MV-136 | unique | discovery.md `/^## 0\. Sync$/` | 1 → 1 | §0 heading |
| MV-136 | unique | discovery.md `/^## 7\. Write the brain's project document$/` | 1 → 1 | §7 heading |
| MV-136 | unique | interview.md `/\*\*Project document\*\*: after you read back the non-negotiables/` | 1 → 1 | the interview's output |
| MV-141 | absent | `{skills/**/*.md,site/content/**/*.md}` `/lands only in dedicated chore/` | 0 → 0 | — |
| MV-141 | unique | SKILL.md `/\*\*Code lands on a change's branch\.\*\*/` | 1 → 1 | rule 6 |
| MV-141 | unique | verify.md `/^## The lines that are not claims$/` | 1 → 1 | the heading |
| MV-141 | unique | change.md `/are \*\*carried onto the branch\*\*/` | 1 → 1 | plan / apply / land |
| MV-146 ×3 | absent | the Sync Impact prepend, "below the closing ---", "in every repo where … is installed" | 0 → 0 | — |
| MV-147 | absent | `/\/opsx:\|would silently (skip\|do nothing)\|chat commands the agent runs/` | 0 → 0 | — |

**Legs the siblings add on `skills/**`** (all `absent`, all kept at 0 by the new pack; the
prototype gave 3 today → 0 for their union): MV-149 `sentence and you get nothing|sentence
returns nothing|in (one|a single) call what (grep|a search) takes many|one call answers what a
search|^takes many`; MV-150 `statement: "\.\.\."|statements this change makes true|\*\*Claims it
makes true\*\*|^[[:space:]]+statement:[[:space:]]` and `ended (up )?consistent|checks law and
code|anywhere the change touched`; MV-151 `Every run prints a .read. line per repo`. T003 lists
whatever `present`, `unique` or `count` legs they added on skill text; each is kept, or moved
by the task that rewrites its file (none expected).

**Page legs the edits keep** (all held in the prototype's strict run): MV-31 integrations.md
`` ^## `(agents|claude|cursor|…)` `` count=8; MV-80 DESIGN.md `every declared repo landed |
reported, exit 0 | exit 1` unique; MV-134 graphers-and-sdd.md `` ^\*\*`change land` commits the
graph\.\*\* `` unique (composition.md is a different page); MV-50 graphers-and-sdd.md `The
refresh module itself never runs git`; MV-52 DESIGN.md `The graph refresh follows the agent, not
the commit`; MV-141 README.md `refuses code that reaches a repo outside a change` unique; MV-126
`site/content/** /mv-[0-9]+/i absent` (the composition section names no ID; the DESIGN
subsection does, not being a site page); MV-84 `site/content/** /[0-9]+\.[0-9]+\.[0-9]+/ absent`;
MV-120 and MV-146 on the constitution.

## R12. The law as it will be written

**Declaration**: `repos: { brain }`, `landing_order: [[brain]]`, `invariants: { touches: [],
adds: [MV-152], retires: [] }`, `claims: [MV-152]` in #7's ID form. `change new
skill-cites-references` promotes the planned file `.multivac/changes/skill-cites-references.md`
and reserves the next free ID (MV-26, MV-89); if it is not MV-152, substitute it everywhere.

**No amendment notes** (FR-044): `grep -n -o -E 'never read[^.]*|they fire|no install
step|checks law and code|ended (up )?consistent' .multivac/invariants.md` finds no row stating
any of them at 62d4588; T011 re-runs it on the merged tree. Rows whose text depends on the skill
or the pages, and why each still holds in the prototype:

| Row | Its sentence | Why it holds |
| --- | --- | --- |
| MV-126 | the skill's rule 3 tells an agent to cite rows by ID wherever law is referenced | rule 3 is still rule 3 and says "everywhere law is referenced" |
| MV-141 | the skill describes equip, sync and check, session zero, the carry, the graph committed at land, code in a change and the ecosystem graph | discovery §0; SKILL.md; change.md; rule 6 and verify.md; SKILL.md's last paragraph; its three unique skill legs keep 1 |
| MV-136 | discovery orders sync, seed, questions, project document, law, doors | discovery keeps the order line and §0/§7; the interview keeps its project-document line |
| MV-53, MV-151 | the read line; the quiet fold | rule 2 keeps the sentence and #8's qualifier |
| MV-137 | with automation on … in a consumer only under `--strict` | rule 6 states it |
| MV-150 | close refuses a claim of a retired row | the retiring text no longer advises one |
| MV-120 | a document states the version its newest amendment recorded | the constitution footer moves with each amendment |
| MV-89, MV-51, MV-52, MV-57, MV-38, MV-72, MV-31, MV-80, MV-134, MV-50 | headings and phrases their legs read | every count kept (R11) |

**The row** (one physical line; 62d4588 figures shown; every slot in ⟨⟩ is filled by T010 with
the merged tree's before-figures and by T054 with the after-figures and the families MV-152
actually pins — critic gaps 2 and 9 applied):

```text
| MV-152 | **The skill carries what no command prints and names the surface that prints the rest, and a sentence the tool contradicts is retired from every page, skill and project document that copies it.** Measured ⟨date⟩ on ⟨base sha⟩ with spec-kit 1.0.11, openspec 1.13.2, graphify 0.9.29 and codegraph 1.6.0, in scratch ecosystems with HOME and GIT_CONFIG_GLOBAL isolated. The skill pack was ⟨50,455⟩ bytes, committed twice; its body, ⟨7,786⟩ bytes, loads in nearly every change session and the change reference with it, ⟨25,855⟩ bytes a session, and about 60% of the pack said again what the brain door, loaded every session, the lifecycle's lines and refusals, `verify`'s lines, `mvac help anchor` or the seed report print where they apply — ⟨two⟩ door clauses verbatim. multivac projects the skill only into the `claude` target, into the brain and every managed code repo, where the consumer door lists no SDD step and no `multivac change`, and `change new` advised `multivac init .`, which turns a code repo into a second brain. Its false or stale sentences included a journal entry nothing writes, rows close never enacts, a landing plan "in graph order" where `land` prints stages, "OpenSpec has no such document" beside the opsx door's `context:` line, a gate table without the task-ledger close gate, `close` committing a code-less brain's specs, `land` committing codegraph's local index and codegraph answering a sentence with nothing. Across the root documents and the site the graph's refuted saving had four copies, two shims of three in slash spelling five, the retired Cursor stub three, "no install step to forget" four and "`close` commits it" four ⟨— and each family T004 found left by its owner⟩. **The rule.** *The skill.* Its body states the rhythm, where you are — the brain's checkout, or a code repo behind a consumer door, where `change`, `roadmap`, `seed` and `init` never run — seven rules and where to read what. Its references carry the judgement no command prints: anchor judgement and the legs pattern, the `moved` and `broken` forks, what each kind of `read` line asks before a red is believed, retiring, seed validation and the interview; for the rest each names the surface that prints it — the brain door, the lifecycle's lines and refusals, `verify`'s lines, `mvac help anchor`, the seed report — and says when that surface prints nothing. It restates no clause a brain or consumer door renders; rule 3 keeps cite-by-ID on purpose (MV-126 reads it). It keeps a sentence for each thing MV-141 names, every leg that reads its text keeps its count, and the reference files keep the names `seed` and `init` print. *The retired sentences.* Every copy in the skill, the root documents, the constitution and the site is rewritten from what the code does: a graph answers what reaches what for the checkout asked, not in fewer bytes; the git shims are three, and the scripts travel with the clone and `doors` arms them; Cursor reads `AGENTS.md`; `close` names a code-less brain's spec directories in the archive commit it prints; `verify` checks on each commit where the hooks are armed. The close-consistency claim and Principle III are MV-150's, the hooks cell MV-151's, codegraph's checkout sentence MV-149's ⟨unless T004 found them left⟩. *One place.* DESIGN and the composition page each say once that a declared tool carries its own work, that multivac adds the gate, the pointer and the files it says it writes, and that with none the work runs as before, citing the rows instead of copying their numbers. **What is mechanical**: `unique` legs on the skill's pointer sentence, its where-you-are paragraph, rule 4's close sentence, the equip clause, a read-line fix and both one-place headings; `absent` legs over the root documents, the constitution, the site and both skill copies on ⟨the families MV-152 pins: the graph's saving, the skill's own phrases, `close` committing, the slash shims, the Cursor stub, the install step, and the alternatives the owners left⟩; a test that renders ⟨nine⟩ brain and ⟨four⟩ consumer doors, each asserting the marker of its shape, and finds none of their clauses in the pack; the MV-72 copy test. **Ceilings.** The restatement test is verbatim over clauses of thirty characters or more of the doors it renders: a paraphrase, a restated lifecycle or `verify` line, and a configuration it does not render all pass. The `absent` legs read one line at a time and keep only these phrases from returning; a reflowed copy or a new paraphrase passes, and "on every commit" has no leg because the hook listings say it truly. What the skill says instead is instruction: nothing checks that the rhythm is followed or that a red is believed only after its read line. The saving is realised only in the `claude` target, the one multivac projects the skill into — a brain without it is told to load a skill multivac never wrote, a follow-up — and holds as measured where an agent reads the reference the table names: a change session ⟨25,855 → 9,886⟩ bytes, ⟨10,626⟩ with `multivac change`'s usage; the body alone ⟨7,786 → 3,383⟩; a change session in a code repo that also reads the brain's door, ⟨14,967⟩; a bare close costs ⟨+2,100⟩. The constitution's content stays unjudged (MV-57). | open | proposed | ⟨date⟩ | [changes/skill-cites-references.md](changes/skill-cites-references.md) |
```

About 5 KB, within the house range (MV-143 ≈ 3.6 KB, MV-146 ≈ 11 KB, MV-151 4.1 KB). Before
it is written, T010 runs every active `absent` regex over the row line with `grep -E -i`: the
row sits in `.multivac/invariants.md`, outside every family glob, but no other row's leg may
match it either.

## R13. Ceilings, stated

- The restatement test is verbatim, over clauses of 30+ characters, over the doors it renders.
- The `absent` legs are line-local: a reflowed copy or a new paraphrase passes. No paraphrase
  detector is planned.
- "on every commit" has no leg (true in the hook listings).
- The skill's rhythm and its read-line advice are instruction; nothing checks they are followed.
- The saving is the `claude` target's alone and holds where the agent reads the reference the
  table names; a bare close costs more.
- The prototype's docs edits for FR-037, FR-039, FR-040 and FR-041 were designed, not trialled;
  their replacement strings match no family (`grep -ciE` over `$SYN/docs/untrialled.txt`: 0).
- A code repo's `change new` still advises `init .` until #8 or a follow-up names the enclosing
  brain; *Where you are* guards the agent meanwhile.

## R14. Out of scope, follow-ups, dropped

| Item | Owner | Reason |
| --- | --- | --- |
| doctor's spec-kit gates line says "change close: not gated" while close refuses on the ledger (doctor.ts:354-359); flow.md's gate list omits the same gate; doctor's hooks line checks 2 of 3 shims (doctor.ts:645, :711 vs install.ts:39 `HOOK_NAMES`); flow.ts:51 "`verify` refuses a commit whose anchors are broken" (critic gap 6) | follow-up `doctor-names-every-gate` | tool code with its own row (MV-118); the skill states the ledger gate itself |
| doctor's `refresh path` line says `change land` commits codegraph's graph | #6 (FR-H5) | its predicate is #6's |
| a code repo's `change new` advises `multivac init .`; `roadmap add` there commits into the code repo; `change new` in the mount reserves IDs the brain checkout cannot see | #8 where its rooting names the enclosing brain; else follow-up `consumer-commands-name-the-brain` | tool behaviour |
| `change plan` prints no next step without an SDD or under `sdd_auto: false` | follow-up `plan-names-apply` | tool output; the core states the rhythm |
| a brain with no `claude` target is told to load a skill multivac never wrote (critic gap 3) | follow-up `skill-reaches-every-harness` | tool behaviour (MV-70's shape) |
| the codegraph door's "It answers in one call what grep takes many" (src/doors/brain.ts:163) | #6 (MV-149's `src/**` leg) | door code |
| the brain door's grapher lines in a code-less brain with per-repo graphers | #5 (`askedGraphers`) | checked here (FR-019) |
| the commands.md `init` sample, README's graph clause, the CHANGELOG intro | #5, rewritten on its branch (6cae0ad) | re-derived at T009 |
| MV-145 has no CHANGELOG line | the release (MV-120; MV-141's precedent) | a release entry names the rows it made law |
| the anchors duplication between site pages and anchors.md | not planned | the skill ships offline into any brain; the trim halves anchors.md |

**Dropped**: the one-place table of configuration cells (R9); harmonising integrations.md's
third load table (R9); "refuses until that half passes" in the A1 family (true once the half is
stated truthfully); a dated note on MV-141 (equip is restored); the help-topic, site-sample and
CHANGELOG-number tests and the body byte ceiling (R6).
