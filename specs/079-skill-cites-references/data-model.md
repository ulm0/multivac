# Data Model: The skill carries what no command prints, and no page keeps a sentence the tool contradicts

No persisted format changes and no source type is added. The entities are the skill pack's
shape, the classification that produces it, the pointers it carries, the retired-sentence
families and the door fixtures that test it. Byte figures are the design prototype's on
`62d4588` (`c9/synth/pack/`); T006 re-derives every section on the merged tree, and a section
may grow by what a sibling change added that nothing prints (FR-010).

## The pack

```text
skills/multivac/                      (source; .claude/skills/multivac/ is its byte-identical copy, MV-72)
├── SKILL.md                          frontmatter (listed every Claude session) + body (loads when triggered)
└── references/
    ├── change.md                     the lifecycle's judgement
    ├── verify.md                     reading a run
    ├── anchors.md                    anchor judgement; grammar → `mvac help anchor`
    ├── discovery.md                  seeding existing code (named by the seed report)
    └── interview.md                  a brain from scratch (named by the seed report)
```

Validation: the five reference names never change (FR-009); `SKILL.md` names each one (the
pack test); every file is over 500 characters (the pack test, `references/verify.md`
included); at least six example anchor lines parse through `parseAnchors` (8 in the prototype:
anchors.md 6, change.md 2); no reference-ecosystem content; the frontmatter is byte-identical
(`name: multivac`, the description with `empty`, `seed`, `anchor`, `change`, `retir`).

## The core: SKILL.md (7,786 → 3,383 B body at 62d4588, prototype)

| Section | Keeps | Pointer to | Legs that read it |
| --- | --- | --- | --- |
| frontmatter | byte-identical, 314 B | — | the pack test's triggers |
| `# multivac — operating protocol` | the H1 | — | MV-72 ×2 (`unique`, both copies) |
| contract paragraph | the brain door says where the law is, which repos exist, which grapher and SDD bind and what each SDD step proves; the rhythm `change new → plan → apply → land → close`; each step says what it did and what it left to you, each refusal names what it looked for and the command that fixes it: **run what they print**; this skill carries what they do not | the brain door; `multivac change` (usage); every lifecycle line and refusal | MV-152 S1 `run what they print` |
| **Where you are.** | behind a consumer door you are in a code repo, the brain mounted at the path the door names; write code in the worktree `change apply` printed and run `verify` there; `change`, `roadmap`, `seed` in the brain's own checkout, never in the mount; read the brain's door there; never `multivac init` a code repo, whatever a refusal there says | the consumer door's mount line | MV-152 S2 |
| `## Session zero` | the door says the brain is empty; ONE question; existing code → discovery, from scratch → interview; declare `repos:` before the brain's first commit | the empty-brain door line | MV-136 (`declare \`repos:\` …`) |
| `## The rules` | 1 verify never skipped; 2 read the `read` lines before the verdicts (MV-53; the quiet fold, MV-151, where shipped) → verify.md; 3 cite by ID "everywhere law is referenced" (MV-111, MV-126); 4 never relax an invariant in code — `close` verifies only the rows the change claims, so claim the row you amend; 5 you propose, the human enacts (MV-81), `close` enacts nothing; 6 **Code lands on a change's branch.** with MV-137's conditions; 7 the roadmap is never a gate, `change new` on a planned slug PROMOTES the file (MV-89) | verify's read lines; `change apply`'s worktree; the commit gate and CI's `--range` refusal | MV-53, MV-141, MV-89; MV-152 S3 (rule 4) |
| `## When to read what` | a five-row table: discovery, interview, anchors (grammar: `mvac help anchor`), change, verify | `mvac help anchor` | the pack test ("SKILL.md points at every reference file") |
| grapher and ecosystem paragraph | the brain door names the grapher's own verbs, says it has none, or names no grapher — grep in the last two; where a grapher is declared, `change apply` prints the flag that asks each worktree's graph; ask `.multivac/ecosystem.json` the way the door says (where it names no verb, read the JSON) before walking the law by hand | the door's grapher lines; `apply`'s `its graph:` / `its index:` lines | — (MV-141's "ecosystem graph" item) |
| verbs table (only under FR-019) | two rows, graphify and codegraph verbs, kept only if the merged code-less per-repo door names no verbs | — | — |

Goes from the core: the session-zero branch detail (the references carry it); the rules'
restatements of door clauses; the steady-state lifecycle walkthrough (the lifecycle prints it);
the "Ask the graph" section's verbs and #5's code-less paragraph (the door and `apply` print
them); every false sentence (research.md R8).

## The references

| File | 62d4588 → prototype | Keeps (only here) | Points to | Goes | Legs that read it |
| --- | --- | --- | --- | --- | --- |
| change.md | 18,069 → 6,503 | the intro (usage lists the steps; `new`, `apply`, `land` commit their own bookkeeping; `close` prints the archive commit; the run-the-chain sentence); `planned` (promotion, never a precondition, one-way projection); `new` (never pick an ID, four fields, stages with no edge form, claims as IDs); plan / apply / land (the worktree, the carry, a code-less brain's SDD files in the commit close prints, `land` commits a shared graph never a local index, the MR and `--landed`); close (the citation gate, a touched row verified only when claimed, every other row reported where the hooks are armed; enacts nothing; existence not freshness; the ritual; mid-change claims); the graph (pointer); the SDD flow (ledger gate, ungateable steps run anyway, the brain's project document, MV-57's phrase, opsx `context:`); retiring (5 steps, 2 example anchors) | `multivac change`; each step's lines and refusals; the brain door's step and grapher lines; `doctor`'s project-document line | "The rhythm" and "Run the chain" sections (the usage and the lines print them); the landing plan "in graph order"; the journal entry; "OpenSpec has no such document"; "hold you to it at close"; `close` committing; step-by-step output transcriptions | MV-51, MV-52, MV-57, MV-89, MV-141 (carry), MV-111 (absent) |
| verify.md | 5,582 → 3,101 | the lead (every verdict line names state, blocking and fix; `vacuous`/`unevaluated` never a pass); `moved` judgement; `broken` fork and the blocking asymmetry; where it reads from, the quiet clause, three fix lines; the lines that are not claims, CI's `--range`; reporting | verify's verdict and `read` lines; `mvac repos sync` | "The outcomes" table and "What gates and what only reports" (verify's lines print them) | MV-141 (heading); MV-151 (absent); MV-152 S5 |
| anchors.md | 7,799 → 4,413 | the claim ID; repo key vs directory; `*` and qualified exclusion; append-only surfaces; vacuity; when `moved` self-heals; contracts not implementations; the mode table; cross-file relations; the legs pattern (6 example anchors); two self-checks; not everything anchors | `mvac help anchor` (grammar, dialect, matching, globs, modes); `mvac count` | Grammar, Dialect, Matching sections | — |
| discovery.md | 7,112 → 3,298 | the order line; §0 Sync (equip clause, `repos check`, "where a grapher is declared"); §1 the seed report with policy gates and decisions; §2 by category; §3 open questions → interview; §4 map and proposed law; §5 file as proposed; §6 blast-radius batches; §7 the brain's project document; §8 doors | the seed report (`.multivac/seed-report.md`, its categories and `### setup`); `repos sync`/`repos check` lines; the door's project-document command | the seed category walkthrough; the anchor-grammar duplicate; the invented-row example; "`change plan` refuses while it is missing, empty or still the template." (a door clause) | MV-38 (`questions` ×3), MV-136 ×2 (§0, §7), MV-152 S4 |
| interview.md | 3,793 → 3,198 | almost whole: what to elicit and its order, how to ask, when to stop, how output lands with MV-136's project-document line | — | the greenfield detail `plan` and `apply` print | MV-136 |

## Paragraph classification (T006)

| Field | Meaning |
| --- | --- |
| `file#n` | file and paragraph number; paragraphs split at blank lines outside code fences |
| `lines`, `bytes` | its range and size on the merged tree |
| `class` | `a` said elsewhere · `b` only here · `c` false or stale · `mixed` (split per sentence) |
| `surface` | for `a`: the door line, the command and its printed line, with the configuration it prints in; for `c`: the run that contradicts it |
| `owner` | the change that added it (#5–#8), where one did |
| `decision` | `keep` · `pointer` (names the surface and its condition) · `drop` · `correct` |

Rules: an `a` paragraph whose surface prints only in some configurations becomes a conditional
pointer, never a drop; a `c` paragraph that a family's regex matches is dropped or corrected in
the same task that lands that family's leg; an owner's paragraph is dropped only if its surface
prints it on the merged tree (FR-010). The table is recorded in the change body.

## Pointer

| Field | Meaning |
| --- | --- |
| `sentence` | the pack's words |
| `surface` | the brain door, the consumer door, a lifecycle line or refusal, a `verify` line, `mvac help anchor`, `mvac count`, the seed report, `repos sync`/`repos check` |
| `string` | the exact text relied on (contracts/cli-output.md) |
| `condition` | when the surface prints it, and what the pack says otherwise |
| `walked in` | the quickstart scenarios that ticked it |

A pointer is valid only if every configuration of the matrix either prints its string or is
covered by its stated condition (SC-008).

## Retired-sentence family

| Field | Meaning |
| --- | --- |
| `id` | A1–A9 (research.md R8) |
| `alternatives` | the regex split at top-level `\|`; each decided on its own |
| `glob` | the leg's one include glob and its exclusions |
| `copies` | `file:line` at 62d4588, re-counted on the merged tree |
| `owner` | the row whose change retires it: MV-150 (A1), MV-151 (A4), MV-149 (A8), MV-152 (A2, A3, A5, A6, A7, A9) |
| `pinned by` | an owner leg whose glob reads every copy's file and whose regex matches each copy line |
| `decision` | `nothing` (pinned, 0) · `pin` (0, unpinned) · `fix+pin` (hits) |
| `replacement` | the sentence each copy becomes, worded from the code |

State transitions per alternative, at T004: `hits` → `fix+pin` → `0, pinned on MV-152`;
`0, unpinned` → `pin`; `0, pinned by owner` → `nothing`. An MV-152 leg is attached only in the
commit that makes its alternatives 0 (FR-028).

## Door fixture (the restatement test)

| Field | Meaning |
| --- | --- |
| `name` | the configuration (research.md R6's table) |
| `config` | a literal `Config`: `doors`, `sdd`, `sddAuto`, `grapher`, `grapherAuto`, `graphers`, `blocking`, `mount`, `repos` with `isBrain: true` on the entry that is the brain when the brain holds code |
| `render` | `renderBrainDoor(config, n)` (`n = 1`; `0` for the empty brain) or `renderConsumerDoor(config, repoKey)` |
| `marker` | a substring the rendered door must contain, proving the fixture has its shape |
| `clauses` | the door's lines split on ` — `, `; `, `. ` after trimming a leading `- `, whitespace-normalised, 30 or more characters |

Validation: each door contains its marker; no clause is a substring of the whitespace-normalised
concatenation of the pack's `.md` files. The failure message names the fixture and the clause.

## Session kinds (measurement, R4)

| Kind | Skill bytes loaded | Pointers it follows (net) |
| --- | --- | --- |
| floor | body | — |
| change | body + change.md | `multivac change` usage |
| change in a code repo | body + change.md | usage + the brain's `AGENTS.md` |
| change drafting anchors | body + change.md + anchors.md | usage + `mvac help anchor` |
| discovery at session zero | body + discovery.md + anchors.md | `mvac help anchor` |
| interview | body + interview.md | — |
| anchor writing | body + anchors.md | `mvac help anchor` |
| verify reading | body + verify.md | — |
| listing | frontmatter | — |
