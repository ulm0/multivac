# Contract: the surfaces the pack's pointers name, and the strings they rely on

This change prints nothing new: no source file changes. Its contract is the other way round —
every pointer the new pack carries names a surface, and that surface must print the string
below, in the configurations stated, on the merged tree. T005 renders the doors and T060 walks
the lifecycle to tick each row (SC-008); where the merged text differs from what is quoted here
(measured on `62d4588` and graph-answers-where-asked's `e6f7994`), the pointer is re-worded to
the merged text, never the other way round. `<…>` is a value; a line is quoted from its start.

## 1. The brain door (`AGENTS.md` / `CLAUDE.md`, src/doors/brain.ts), loaded every session

| Pointer in the pack | String relied on | Condition |
| --- | --- | --- |
| "The brain door says where the law is" | `- Law lives in \`.multivac/invariants.md\`. Cite rows by ID; a rule quoted without its ID does not bind.` | every brain door |
| "which repos exist" | `Repos in this ecosystem:` followed by one `- <key>: <path> (<url>)` per repo | a brain declaring repos |
| "The rhythm … (`multivac change` lists it)" | `- Every ecosystem decision enters as a change: see \`.multivac/changes/\` and run \`multivac change\`.` | every brain door |
| "what each SDD step proves" | `  - \`change <point>\` → <step> [proof: <artifact>]` and `… [ungateable]` (7 lines for spec-kit, 4 for openspec) | an SDD declared; under `sdd_auto: false` the lines stay and no refusal clause is printed |
| "the brain door lists the declared tool's steps" | as above, headed `- Features gate through the \`<sdd>\` SDD, in that tool's OWN flow.` | an SDD declared |
| the brain holds code | ` It is also the code it governs — anchors target \`brain:<glob>\`.` | `isBrain` (a `repos:` entry is the brain) |
| "names the grapher's own verbs" | graphify: `- A code graph is kept fresh for you by \`graphify\` at \`graphify-out/graph.json\` — refreshed after your edits, and committed on the change branch by \`change land\`.` then `  ASK IT BEFORE READING THE TREE RAW. \`graphify query\`, \`graphify explain\`, \`graphify path\` — …`; codegraph: its verbs as #6 renders them | a verified grapher; in a code-less brain, #5's `- This brain holds no code, so it keeps no code graph: each code repo keeps its own. ASK IT BEFORE READING THE TREE RAW, from here, with each verb's flag pointed at a repo below — …` |
| "or says it has none: then grep" | `- \`<name>\` has NO query command: the artifact is written but nothing reads it back. Do not invent one.` | a grapher declared under `graphers:` |
| "or names no grapher" | no grapher line at all | no grapher declared |
| "Ask `.multivac/ecosystem.json` the way the door says (where it names no verb, read the JSON)" | `- How the repos, the law's rows, their anchors and the changes relate is \`.multivac/ecosystem.json\`, rendered from the brain's declarations.` then `Ask it: \`graphify query "<question>" --graph .multivac/ecosystem.json\`, …` | the verbs only where graphify is declared; otherwise the first sentence alone |
| session zero: "The door says the brain is empty" | `brain empty — load the multivac skill to fill it.` | no rows yet (`renderBrainDoor(cfg, 0)`) |
| the project document (SDD flow section) | `  - project law \`<path>\` — run <step> …` and `  - where a project document and an active row of \`.multivac/invariants.md\` disagree, the row wins: amend the document, or change the row through a change` | spec-kit declared |

The pack restates none of these clauses (the restatement test); rule 3's cite-by-ID is worded
differently on purpose.

## 2. The consumer door (a code repo's `AGENTS.md`, src/doors/consumer.ts)

| Pointer | String relied on | Condition |
| --- | --- | --- |
| *Where you are*: "the brain mounted at the path the door names" | `This repo belongs to an ecosystem; its brain is mounted at \`<mount>/\`.` | every consumer door |
| "read the brain's door there" | `- Law: \`<mount>/.multivac/invariants.md\` binds this repo. …` (the law path, not the brain's door) | every consumer door |
| *Where you are*: "run `change`, `roadmap` and `seed` in the brain's own checkout, never in the mount" | `- The brain's \`<sdd>\` SDD runs in the brain checkout, never in this mount: specs, plans and tasks are written there. Code here lands only on the branch of an open change declaring this repo; \`verify --strict\` refuses it anywhere else.` | an SDD governs this repo, automation on; otherwise the paragraph is the only guide |

Absent from every consumer door, which is why every pointer says "the brain door": any
`[proof:` or `[ungateable]` step line, and `multivac change`.

## 3. `multivac change` (usage, 740 B at 62d4588)

```text
multivac change <sub> <slug> [args]
  new "<title>"          scaffold .multivac/changes/<slug>.md + reserve the next invariant id (one commit)
  …
  close <slug>           verify claims, archive the change, print .multivac/ritual.md
flags: --no-sdd (skip the SDD steps AND their gates), --no-grapher (close only:
       skip the graph gate), --landed <repo> (land only),
       --abandon (close only: drop a change that landed nothing, give its id back)
```

Relied on by: "`multivac change` lists it" (the core) and "`multivac change` lists the five
steps" (change.md).

## 4. The lifecycle's lines and refusals

| Pointer | String relied on | Where it prints |
| --- | --- | --- |
| "`new`, `apply` and `land` commit their own bookkeeping" | `committed: change open: <slug> — reserves <ID>`; `committed: change apply: <slug> — status branched`; `committed: graph: <slug> — refreshed on the change branch` | `new`, `apply`, `land` (graph only where a shared graph is declared) |
| "`close` prints the archive commit for you to make on a branch" | `archived — commit this on a branch; nothing lands on <trunk> directly:` then `  git -C <brain> switch -c close-<slug> && git add -- <paths> …` (variants: `archived — commit this on <branch> (it lands through that branch's MR): …`; `archived — commit this: … (no origin remote — the direct commit is the landing)`) | `close` |
| "`close` names them in the commit it prints" (a code-less brain's SDD files) | the `git add -- …` pathspecs of that line include `specs/<n>-<slug>/` | `close` with an SDD, code-less brain |
| "each refusal names what it looked for and the command that fixes it" | `sdd <tool>: \`change <point> <slug>\` refused — <artifact> is missing — looked in <roots>` then `  <step>` then `  then re-run: multivac change <point> <slug>` | a gated point with the proof missing |
| "where the tool keeps a task ledger, `close` refuses while it has open items" | `sdd <tool>: \`change close <slug>\` refused — <scope>:<ledger> has <n> open item(s) — <why>` | spec-kit's `tasks.md`, openspec's ledger |
| "the step prints the SDD chain … says how to turn it off" | `sdd <tool>: run the chain through without asking to continue — stop only for a question the tool itself raises (\`--no-sdd\` for one run, \`sdd_auto: false\` to stop printing these)` | once per point that printed a step |
| "`change apply` prints the flag that asks each worktree's graph" | `its graph: --graph <checkout>/graphify-out/graph.json — paths in its answers are relative to this checkout` / `its index: -p <checkout> — …` and the no-graph-yet variants (graph-answers-where-asked's `graphPointer`) | `apply`, where a grapher is declared with an `askAt`; nothing otherwise |
| "Write code only in the worktree `change apply` prints" | `work here — one checkout per repo, nobody else's tree moves:` then `  <repo>: <worktree>` | `apply` |
| "`land` commits a shared code graph on the branch, never a local index" | `committed: graph: <slug> — refreshed on the change branch` for graphify; no graph commit for codegraph | `land` |
| "The MR is yours, and `--landed` records your statement" | `  <repo>: open MR <slug> -> <trunk> (state the landing order in the description)` and `  <repo>: once merged: multivac change land <slug> --landed <repo>` | `land` |
| "Close prints `.multivac/ritual.md` and checks none of it" | the ritual's lines after the archive line | `close` |
| rhythm when `plan` prints no next step | `landing order:` / `  stage 1: <repo>` and no `sdd` step | `plan` with no SDD or `sdd_auto: false` — the core states `apply` comes next |

## 5. `verify`'s lines (src/commands/verify.ts)

| Pointer | String relied on |
| --- | --- |
| "Every verdict line names its state, whether it blocks, and the fix" | `ok`, `moved`, `broken`, `vacuous`, `unevaluated` lines, each with its mode and fix; `<n> blocking broken · exit <n>` |
| "A run prints a `read` line per repo" | `  read      <repo>: <ref> @ <sha> — …` |
| "or on a quiet run a clause of its one line" | verify-rooted-and-quiet's quiet line (its contract); dropped from the pack if #8 did not ship it |
| "FELL BACK to the working tree" | `channel <channel> does not resolve here (no remote, or never fetched) — FELL BACK to the working tree` |
| "An old `last fetch`" | `(last fetch <age> ago)` / `(never fetched here)` |
| "The brain behind its own channel" | `; <n> behind its own channel <channel> @ <sha>` |
| "`enact`, `code` and `ecosystem` … each says its fix" | `  enact     …`, `  code      …`, `  ecosystem …` |
| rule 6: "a code repo's hook reports it and CI's `verify --strict --range` refuses it" | the `code` line: reported on a plain run, `· blocking under --strict`; `verify --strict --range <base>..<head> --branch <name>` exit 1 on code outside a change's branch |

## 6. `mvac help anchor` and `mvac count`

`mvac help anchor` (1,787 B) prints, and anchors.md points to it for: `the anchor grammar — one
leg per line, an HTML comment in a brain .md file:`; `regex   POSIX ERE only, flag "i" only.`;
`match   per line — except *.sql, …`; `globs   picomatch over repo-relative paths: …`; `modes
present (default) · absent · unique · count=N · each · each!`; `where   anchors live in the
brain: …`; `dry-run a leg before pinning it:  multivac count '<repo>:<glob> /<regex>/'`.

## 7. The seed report, `seed`, `init`, `repos`

| Pointer | String relied on |
| --- | --- |
| discovery §1 "`mvac seed` writes `.multivac/seed-report.md`" | the report's categories, each repo's `### setup`, and `## open questions — the interview needs these answered` |
| the reference names | seed: `` Put them to a maintainer (interview protocol: the multivac skill, `references/interview.md`) before enacting anything: ``; `` multivac skill (`references/discovery.md`). ``; `seed: next — take the open questions to a maintainer, then draft proposed claims (see the multivac skill)` |
| "carries both protocols" | `init:   1. load the multivac skill in your agent — it carries both protocols` (printed even where no skill is installed: the `skill-reaches-every-harness` follow-up) |
| discovery §0 "clones every declared repo and equips it" | `repos sync`: `<key>: cloned <url> -> <path>`, the equip lines (`graph <grapher> @ <repo>: built …`, `installed into <target> …`, the brain's SDD scaffold) |
| "`mvac repos check` names per repo what is still missing" | `<head>ok   cloned · <facts>` or the missing line with its fix; exit 1 if not |

## 8. Doors: where the skill is written

`multivac doors` (the `claude` target only) mirrors `skills/multivac/` into
`.claude/skills/multivac/` of the brain and of every managed code repo; a `managed: false` or
shallow repo gets none; no other target gets a copy. The copy test's failure names its fix: `run
\`multivac doors\` to rewrite the copy from skills/multivac`.

## 9. The strings this change adds, pinned by MV-152

| Where | Exact text | Leg |
| --- | --- | --- |
| skills/multivac/SKILL.md | `run what they print` (once) | S1 `unique` |
| skills/multivac/SKILL.md | `**Where you are.** Behind a consumer door you are in a code repo` (once, at a line start) | S2 `unique` |
| skills/multivac/SKILL.md | `` `close` verifies only the rows the change claims `` (once, on one physical line) | S3 `unique` |
| skills/multivac/references/discovery.md | `clones every declared repo and equips it` (once, on one line) | S4 `unique` |
| skills/multivac/references/verify.md | `Pull the brain before you believe any red` (once, on one line) | S5 `unique` |
| DESIGN.md | `### Adapter first, fallback always (<date>)` | U1 `unique` |
| site/content/docs/concepts/composition.md | `## Adapter first, fallback always` | U2 `unique` |
| test/skill.test.ts | the test title `the pack restates no clause a door renders — MV-152` | T1 |
| test/skill.test.ts | `'references/verify.md',` in `FILES` (once) | T2 `unique` |

The test's failure message: `<fixture>: <clause>` per restated clause, and `<fixture>: the
door does not carry "<marker>" — the fixture does not render the shape it names` per missing
marker.
