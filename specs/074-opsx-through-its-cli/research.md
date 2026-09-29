# Research: opsx runs through its own CLI

Measured 2026-09-28 in scratch repos with `HOME` and `GIT_CONFIG_GLOBAL` isolated, with
openspec 1.13.2 on PATH and, where a version is named, the cached 1.0.0 through 1.13.1.
Three investigations (cli-vs-bodies, archive-confirm, registry-law), each checked by three
adversarial lenses (guarantee kept, every adapter and harness, the saving is real), merged
into one design and read by a completeness critic whose 17 gaps the spec folds in
(checklists/requirements.md maps each). Who measured a figure is marked: **(inv)** the
investigator, **(ver)** a verifier, **(synth)** the design's re-measurement, **(critic)** the
completeness critic, **(plan)** re-measured for this plan. Tokens are bytes/4. The design
cited change #3 at `723c052`; every `file:line` below is on this branch's head (`6e2a265`,
#3 merged at `293d2ba`).

The scratch walks behind **(plan)**, for whoever re-runs them:

```bash
SCR=<scratch>; export HOME=$SCR/home GIT_CONFIG_GLOBAL=$SCR/gitconfig OPENSPEC_TELEMETRY=0 DO_NOT_TRACK=1
cd $SCR/r && git init -q . && openspec init --tools none --no-animation . </dev/null
```

## R1. The steps become openspec's own terminal verbs

What a change costs today, `doors: [agents, claude]`, two capability deltas, claude harness:

| What | Figure | Command |
| --- | --- | --- |
| `openspec init --tools agents,claude --no-animation .` | 19 files, 273,400 B of command bodies and skills | `find … -printf '%s'` (inv) |
| the four bodies a change loads (propose, apply, archive, and the sync archive runs inline) | 58,089 B; 11 of 2,440 eight-word runs shared with `instructions` output | `wc -c .claude/commands/opsx/{propose,apply,archive,sync}.md` (inv, ver within 0.5%) |
| a claude session's listing of the twelve bodies | 2,335 B | frontmatter `name` + `description` of `.claude/{commands/opsx/*.md,skills/*/SKILL.md}` (inv, ver exact) |
| the bodies path per change | 111,258 B: bodies 58,089 + their CLI calls 50,811 + delta reads 701 + lifecycle lines 1,657 | `cli-vs-bodies/replay.sh body` (inv) |
| the printed CLI path per change | 15 calls, 24,329 B of vendor output + 4,077 B of lifecycle lines = 28,406 B | walk below (plan) |

The walk the printed lines order, 1.13.2, stdin `</dev/null`, paths normalised (plan; the
design's walk, 22,678 B, printed `new change` without `--json` and a text archive preview):

| call | exit | bytes |
| --- | --- | --- |
| `new change add-greeting --json` | 0 | 293 |
| `status --change add-greeting` ×5 (text) | 0 | 348, 299, 293, 271, 304 |
| `instructions proposal --json` | 0 | 4,806 |
| `instructions specs --json` | 0 | 6,203 |
| `instructions design --json` | 0 | 3,039 |
| `instructions tasks --json` | 0 | 3,460 |
| `instructions apply --json` before / after | 0 | 1,243 / 1,250 |
| `archive add-greeting --json` | 1 | 338 (`archive_confirmation_required`) |
| `show add-greeting --json --deltas-only` (the preview) | 0 | 1,806 |
| `archive add-greeting --json --yes` (the human said yes) | 0 | 376 |
| **total, 15 calls** | | **24,329** |

Afterwards `git status -uall` held six `D openspec/changes/add-greeting/*`, six `??` archive
files and `?? openspec/specs/{greeting,farewell}/spec.md` — what #3's close stages — and
`HOME` was still empty.

The slash spelling the lines print exists for claude and gemini alone (`.claude/commands/opsx/`,
`.gemini/commands/opsx/`); cursor, opencode and windsurf write `opsx-<step>.md`, copilot
`opsx-<step>.prompt.md`, and agents and codex get skills only (ver, and the per-key listing in
R9). 1.13.2's propose body ends "stop after planning and wait for a new request", against
MV-95's chain; its archive body never runs `openspec archive` — it merges by hand and moves
the directory with `mv` (ver). `openspec propose` and `openspec apply` exit 1 with `error:
unknown command` (plan), so a step name is never a verb.

**Decision**: each opsx `run` is openspec's own verbs (FR-001, contracts/cli-output.md):
`new change <slug> --json` and the loop at `new`, the loop through `tasks.md` at `plan`,
`instructions apply --change <slug> --json` twice at `apply`, `archive <slug> --json` at
`land`. `status` is printed in text; `new change`, `instructions` and `archive` in `--json`,
for their fields and codes. Artifact, gate, validator, ledger and `merges` are unchanged.

**Rationale**: −82,852 B per change against the bodies path (−20.7k tokens, −74%); a step
that runs alike in every harness; no body that contradicts MV-95.

**Alternatives considered**: keeping the bodies and fixing the spelling per harness —
58 KB per change stays, and the propose body's stop stays. `status --json` — 2,423–2,735 B
against 270–348 B for text, about 11 KB more per change (ver, synth). A text-mode archive —
it never carries the literal code, hangs on an open stdin or a silent PTY (exit 124), and
exits 0 on "Archive cancelled." (inv). An `{env}` prefix on every printed command — Claude
Code 2.1.283 strips a leading `VAR=value` before allow-rule matching only for a fixed set of
37 names, neither variable among them; it is POSIX syntax, and cursor and copilot default to
PowerShell on Windows; and the vendor's own output names bare commands, so it protects less
than it says (ver). multivac running `new change` itself — a third subprocess MV-51 does
not allow.

## R2. A step carries a guide, printed only where the step comes up

The runs have room for the command and the human's question; what else the bodies told the
agent needs a second text. Measured with the texts of contracts/cli-output.md (plan,
`lines.mjs` in #3's formats):

| Surface | today | after | read |
| --- | --- | --- | --- |
| brain door, opsx step lines | 646 B | 1,220 B | every session |
| lifecycle lines, four points, slug `add-greeting` | 1,657 B | 4,077 B | once per change |
| `doctor`'s four flow lines | 987 B | 1,561 B (1,579 B with the plan-time runs; measured again after review, at the walk) | per `doctor` run |

**Decision**: `SddStep.guide?: string`. `stepLines` prints it under its step as
`sdd <tool>:   <guide>` (three spaces, #3's stray-line form); each refusal that re-prints a
step prints it under the run, indented four spaces; the run-the-chain instruction stays the
point's last line, unindented. The door, `doctor`'s flow lines and flow.md print `run` alone.

**Rationale**: a claude session in a fresh opsx brain goes from 2,981 B (door 646 + listing
2,335) to 1,220 B, −1,761 B ≈ −440 tokens, while every question the bodies asked is still
printed at its point.

**Alternatives considered**: the guide in the door — about 1,750 B more in every session. A
flow.md row per guide — "did it ask" is ungateable for every step alike; the field's doc
comment and the row state it once. A lifecycle-only question with no marker in `run` —
under `sdd_auto: false`, `--no-sdd` or after a context reset the door is the only surface,
and the vendor's own `fix` says `--yes` (R4); so the run itself names the question.

## R3. The scaffold installs no command body; the map stays as a record

`openspec init --tools none --no-animation .` on 1.13.2 wrote `openspec/config.yaml`,
`openspec/specs/.gitkeep` and `openspec/changes/archive/.gitkeep` and nothing else, for any
doors, and nothing under `HOME` (plan). 1.7.0 is the first with `--no-animation` (synth); the cached dist source lists `--tools none` from 1.4.0, so the scaffold's floor is 1.7.0 (plan, read not run below 1.13.2).
`openspec update` in such a brain prints `No configured tools found. Run "openspec init" to
set up tools.`, exits 0 and writes nothing (critic, plan).

**Decision**: opsx's `scaffold.run` is `openspec init --tools none --no-animation .`;
`scaffoldCommands` returns a run with no `{key}`/`{keys}` as written, with no gap, for any
doors including none; spec-kit's per-door path is unchanged. `integrations` keeps its
measured `dirs` under a comment saying what it now records. The refresh fact says `openspec
update` refreshes only bodies a human installed and does nothing here.

**Rationale**: 273,400 B not written per fresh brain; a door added later needs nothing.

**Alternatives considered**: emptying the map — the code gate would stop exempting
`.agents/`, `.devin/` and the rest in existing brains, so removing a leftover or running
`openspec update` would read as code, and MV-144's `count=3` and MV-142's real-vendor path
would break (ver). `doctor` printing the opt-in `openspec init --tools <keys>` — re-running
it over an install writes `~/.config/openspec/config.json` (ver); the site documents it for
a human, with that disclosure.

## R4. The archive question goes to the human, with no flag printed

Binding decision of 2026-09-25. `openspec archive <slug> --json` never reads stdin (1.5.0
through 1.13.2). On the two-capability change (plan):

```json
{ "archive": null, "status": [ { "severity": "error", "code": "archive_confirmation_required",
  "message": "Updating 2 spec(s) requires confirmation: rerun with --yes.",
  "fix": "openspec archive <change-name> --json --yes" } ] }
```

exit 1, `git status --porcelain` empty afterwards. With open tasks it answers
`archive_tasks_incomplete`, and `--json --yes` archives over open tasks with exit 0 and no
warning (inv). The same code also covers skipping validation, which is not the merge
question (inv): measured at implement, `archive <slug> --json --no-validate` answers
`archive_confirmation_required` with "Skipping validation requires confirmation: rerun with
--yes." and `fix` `openspec archive <change-name> --json --no-validate --yes`. No line lets the
agent pass `--no-validate`, and were it passed, the run still names the code the human's
question and its `fix` flags never the agent's, so the guide adds no clause for it (analyze
F3). The preview: `openspec show <slug> --json --deltas-only` exits 0 with the
deltas (1,806 B for add-greeting, 1,830 B for a MODIFIED + ADDED fixture) and leaves `git
status` unchanged; text `show --deltas-only` prints only the proposal (274 B); `show --json
--deltas-only` is present from 1.3.0 (critic; the 1.13.2 figures are plan's). `openspec archive <slug> </dev/null`
also previews but needs a POSIX redirection. Older binaries fail with `error: unknown option
'--json'`: `new change` below 1.4.0, `archive` below 1.5.0 (critic).

**Decision**: the land `run` carries no `--yes`, `--skip-specs` or `--no-validate`, names
`archive_confirmation_required` as the human's question and says a flag its `fix` names is
never the agent's; the guide routes the code saying `Updating` to the human with the `show`
preview and the tool's own three answers (yes → `--json --yes`, then relay `warnings`;
archive without merging → `--json --skip-specs`; anything else → stop); names what resolves
`archive_tasks_incomplete`; sends any other code to be fixed and re-run with no flag, never
`--no-validate`; names the upgrade on `unknown option '--json'`. An `absent` leg holds every
`run:` line of the registry free of the three flags.

**Rationale**: one human stop per change carrying deltas, none for a delta-less or
`skip_specs` change; the preview is the vendor's own and shell-neutral.

**Alternatives considered**: `--yes` printed — the decision itself. The text preview with
`</dev/null` — POSIX-only, the reason the env prefix was dropped. Offering only yes/stop —
openspec's own interactive prompt archives without merging on `n`, and the vendor body
offers "Archive without syncing"; the three answers mirror the tool.

## R5. A land step is proved in the brain checkout alone

In a brain==code change, `openspec archive` run in `.multivac/worktrees/<slug>/brain` after
the merge let `change close` exit 0 while `main` kept the change open with an empty
`openspec/specs/` (ver, end to end). `slugHits` (src/adapters/sdd.ts:468) falls back to the
change's worktree for every point, which is right before the merge and wrong after it.

**Decision**: in `judgeSdd`'s artifact loop (src/adapters/sdd.ts:608–633) the root the hit
came from is kept; a step with `at === 'land'` whose hit is in the worktree is refused,
naming the path relative to the brain and saying it never reaches the brain checkout, then
the run, the guide and the re-run line. The ledger loop (:708–770) reads no ledger from
such a hit. The two `slugHits` calls are untouched (MV-133's `count=2`).

**Alternatives considered**: printing `(in <absolute dir>)` on the lines — the door cannot
carry an absolute path, and the runs are self-locating ("in the brain checkout (never a
change worktree)"). Refusing the worktree fallback at every point — `plan` and `apply` read
the worktree legitimately once `apply` carried the directory (MV-133).

## R6. Close stages a merged main spec only when it carries the merge

`closeOwnedDirs` (src/change/carry.ts:209–245) stages, for a step with `merges`, the main
spec file under `openspec/specs/` for every delta file in the archive — whether or not the
archive merged. Measured (synth m1, m3, m4; critic `merge-variants.sh`):

| Archive | Main spec afterwards | Delta blocks in it |
| --- | --- | --- |
| `--json --yes`, MODIFIED into an existing spec | merged | every `### Requirement:` block verbatim |
| `--json --yes`, ADDED into a new capability | created | verbatim |
| `--json --skip-specs` | unchanged (`grep -c "due in 30 days"` → 0), a human's uncommitted note kept | none |
| `--json --yes`, delta with CRLF endings | merged, written LF | none byte-exact; all after CRLF→LF |
| `--json --yes`, extra whitespace in a `### Requirement:` header, ADDED or MODIFIED | merged | verbatim, header included (implement, 1.13.2) |
| `--json --yes`, a CRLF delta with trailing spaces | merged, written LF | trailing spaces kept; all after CRLF→LF and trailing whitespace stripped (implement) |
| `--json --yes`, a run of blank lines inside a block | merged | the run collapsed to one blank line; all after the same collapse (implement) |
| `--json --yes`, `## Added Requirements` (the title in another case) | merged | verbatim (implement) |

A `--skip-specs` next to an untracked human draft of the capability's main spec: an
"absent from HEAD means the merge created it" shortcut would stage the draft (critic).

**Decision**: `carriesMerge(brainDir, delta, target)`: true when the delta holds no
`### Requirement:` block under `## ADDED Requirements` or `## MODIFIED Requirements`
(today's staging kept, REMOVED/RENAMED-only deltas included); otherwise true only when every
such block, trailing blank lines trimmed, is a substring of the target, both sides with CRLF
turned to LF, trailing whitespace stripped per line and each run of blank lines collapsed to
one — tracked or untracked alike. Section titles fold case and the requirement header is read
as openspec's reader reads it (`^###\s*Requirement:`, any case), so a block the archive
merged is never taken for no block. A target that does not carry it is not staged and is
named by the existing `is dirty and was not staged` line, untracked included. Every row of
the table above carries by this rule, and the `--skip-specs` row does not (measured at
implement against the real 1.13.2 archives).

**Corrected at review** (measured against the real 1.13.2, whose validator passed every
delta below): the substring test called carried a MODIFIED block that only drops the end of
a line — it is a substring of the requirement it replaces — so a `--skip-specs` archive
staged a human's edit; a reader ending a block at any `### ` line or at a fenced `## ` line
compared only the block's unchanged head; a reader blind to fences took a fenced `## ADDED
Requirements` example under REMOVED for a block to carry, naming a real merge dirty; and
mapping every file under the archived `specs/` staged a human's untracked `notes.md` beside a
merged `spec.md`, which the archive never writes. The rule is now openspec's own reader,
ported, not approximated: its fence mask (parsers/code-fence.js), its sections and blocks
(parsers/requirement-blocks.js: a block runs to the next unfenced requirement header or
`## ` line, keeping other `### ` lines), and each delta block equal, whole, to the block of
the same name in the target's `## Requirements` section — still no merge reimplemented. The
step records only the file the tool merges (`merges.file`, `spec.md`, found as
discoverSpecFiles finds it).

**Rationale**: an archive the human chose to make without merging never stages somebody's
edit, and #3's guarantee holds for Windows line endings.

**Alternatives considered**: the `!inHead` shortcut — stages an untracked draft. Byte-exact
comparison — misses a CRLF delta and leaves a real merge out of close's commit. Reading the
archive's `specsUpdated` — close reads the disk, not a command's output nobody kept.
Re-parsing requirements semantically — reimplementing openspec's merge (MV-56).

## R7. The ledger's reason is true under `--json`

MV-63's printed reason says `--yes` "continues over its own warning"; under `--json` it
prints none (R4). Since the printed archive carries no `--yes`, openspec itself refuses
open tasks first; the ledger at close still sees tasks a human's `--yes` archived open.

**Decision**: `unfinished.why` reads "openspec archived this change with tasks still
unchecked — `--yes` archives over its own refusal, and under `--json` says nothing"; the
field's doc example says the warning is text mode's.

## R8. The questions the bodies asked ride on the lines

openspec 1.13.2's `.claude/commands/opsx/propose.md` asks, before creating, about material
ambiguity (step 1) and a conflict with a main spec (Guardrails), asks whether to continue a
change of that name that already exists (:169), and says never to create the root as a side
effect (:36); `.claude/commands/opsx/apply.md` pauses on an unclear task, a design issue the
work reveals, work beyond the spec, and a blocker (:110–115) (critic, ver). `instructions
apply --json` at `all_done` says "All tasks are complete! This change is ready to be
archived." (critic). Text `status` keys the loop on `[x]` / `[ ]` / `[-]`, identical from
1.0.0 to 1.13.2; `Next:` ships only from 1.13.1 and "All planning artifacts complete!" from
1.8.0 (ver, 15 versions). With design skipped, `status` shows `[ ] design` and `[-] tasks
(blocked by: design)` while `instructions tasks --json` exits 0 (synth). A `new change
--json` run outside any OpenSpec root exits 0, writes `openspec/config.yaml` and the change
there, and reports `"root": { "source": "implicit" }` where a run inside reports `"nearest"`
(plan).

**Decision**: the new, apply and land runs each name the human's question (FR-013); the
guides carry the rest (FR-014–FR-016), keyed on what the tool prints (`already exists`,
`root.source` `implicit`, `resolvedOutputPath`, `state`, "ready to be archived", `Next:`); a
registry comment beside each cites the vendor file by path and version, never by a slash
spelling (FR-017). The propose body's planning boundary goes with the body.

**Alternatives considered**: `openspec context --json` as a root pre-check (1.10.0–1.13.2,
exit 1 `no_openspec_root`) — one more call per change, and the run is already told to be
in the brain checkout; the guide names the symptom instead. Carrying the bodies' softer
advice (inspect the project first, re-read what an artifact depends on) — not a question,
stated as not carried. Two asks sit inside that inspection (propose.md :118, 1.13.2): a
target project that is unclear, and unavailable source that materially affects the plan;
the change's declared repos name its targets and `repos sync` clones them, so MV-147's
ceilings name both as not carried (found at review).

## R9. Bodies an earlier init left: named by `doctor`, and not code

What each integration's init wrote outside `openspec/` on 1.13.2 (inv, `r-t-*`), and codex
by version (critic `intv/`):

| key | entries |
| --- | --- |
| agents, codex (1.8.0–1.13.2) | `.agents/skills/openspec-*` (six), `.agents/skills/.openspec-target` |
| codex 1.7.0 | `.codex/skills/openspec-*` |
| claude | `.claude/skills/openspec-*`, `.claude/commands/opsx/` |
| gemini | `.gemini/skills/openspec-*`, `.gemini/commands/opsx/` |
| cursor | `.cursor/skills/openspec-*`, `.cursor/commands/opsx-*.md` |
| opencode | `.opencode/skills/openspec-*`, `.opencode/commands/opsx-*.md` |
| windsurf | `.devin/skills/openspec-*`, `.devin/workflows/opsx-*.md` |
| github-copilot | `.github/skills/openspec-*`, `.github/prompts/opsx-*.prompt.md` |

Every entry's name matches `openspec-*`, `.openspec-*`, `opsx` or `opsx-*`, at depth one or
two under a directory the map records or `.codex/`, and nothing else was written (critic,
all eight keys on 1.13.2; claude, codex and copilot on 1.10.0 and 1.13.0). A brain
scaffolded before this change pays 3,555 B per claude session (door 1,220 + listing 2,335),
+574 B over today's 2,981, until they go (synth's method, this plan's door). The code gate (src/lib/code-in-change.ts:43–110) exempts only the `dirs` of the
DECLARED doors' integrations, so `git rm -r .codex/skills/openspec-*`, or a door no longer
declared, is judged code on `main` of a brain==code brain. `git rm -r` expands a quoted
pathspec glob itself, so the printed removal needs no shell globbing; it fails outright on a
pathspec that matches no tracked file.

**Decision**: `SddScaffold.bodies = { names, dirs }` records the entry names and the extra
directories (`.codex`, 1.7.0). `bodyGlobs(scaffold)` derives, for every integration's `dirs`
plus `bodies.dirs` and each name, `<d>/<n>`, `<d>/<n>/**`, `<d>/*/<n>`, `<d>/*/<n>/**`. The
code gate adds them for every known SDD, declared door or not; `leftoverBodies` lists the
brain's entries matching them, siblings collapsed to `<parent>/openspec-*` or
`<parent>/opsx-*`, and `doctor` prints one line with `git rm -r` for the tracked ones and
names untracked ones to delete, never failing.

**Rationale**: the per-session saving reaches older brains only once the leftovers go, and
their removal must not be refused as code.

**Alternatives considered**: scanning the declared doors only — misses `.codex/` and a door
removed since. Exempting every integration directory whole — `.github/prompts/**` and
`.codex/**` would be not code in every brain, beyond what the inits wrote. One `git rm -r`
over tracked and untracked alike — it fails on the untracked pathspec, a printed command
that does not work.

## R10. `change new` and `roadmap add` refuse a slug openspec refuses

`openspec new change` 1.13.2 refused `Fix_Auth` ("Change name must be lowercase (use
kebab-case)"), `a--b` ("Change name cannot contain consecutive hyphens"), `a.b`, `a_b`, `Ab`,
`a-b-`, `-ab`, and accepted `ab-c`, `1ab`, `a1`, `x` — pattern `^[a-z0-9]+(-[a-z0-9]+)*$`
(synth, plan). In a `--tools none` brain, which holds `openspec/changes/archive/.gitkeep`,
`new change archive` exits 1 "Change 'archive' already exists", and `status --change
archive` refuses "'archive' is reserved for archived changes" (critic, plan). multivac
accepts `/^[a-z0-9][a-z0-9._-]*$/i` in both commands (src/commands/change.ts:1571,
src/commands/roadmap.ts:335). `slugify` (change.ts:1482) yields the grammar, or `archive`
from the title "Archive".

**Decision**: `AdapterSpec.slug = { pattern, reserved, why }`; `sddSlugWhy(cfg, slug)` reads
the brain's SDD's and returns the reason or null. `cmdNew` asks it first — before the
archived-slug and promotion checks, whatever `sdd_auto` and `--no-sdd` say, since the slug
outlives both — and exits 1 writing nothing; `roadmap add` loads the config as `roadmap
sync` does and refuses with exit 2, as it refuses a malformed slug. With no grammar recorded
both accept what they accept today.

**Alternatives considered**: lower-casing or rewriting the slug silently — renames the
change the human named. Checking only with the automation on — the change outlives the
switch and its first step would still fail.

## R11. The apply gate prints openspec's "Archive would refuse" note

On 1.13.2 (plan), a MODIFIED delta whose header the main spec lacks:

```json
{ "items": [ { "id": "bw", "valid": true, "issues": [ { "level": "INFO", "path": "billing/spec.md",
  "message": "Archive would refuse this delta: billing MODIFIED failed for header \"### Requirement: Yearly invoice\" - not found" } ] } ], … }
```

exit 0. The archive then fails only after the human's yes. The suite's stubs exit 0
printing nothing or a newline (`stubOpenspec(0)` in test/change/sdd-gates.test.ts:64, the
binary-lookup stubs), so a success path that parses must tolerate it (critic).

**Decision**: `SddStep.validateNotes?: string`, an ERE over a passing verdict's issue
messages; opsx's plan step (the one `change apply` validates) records `'^Archive would
refuse'`. `toolVerdict` (src/adapters/sdd.ts:159) parses stdout on exit 0 inside a try —
unparsable is no notes — and the gate prints each match as a note, refusing nothing.

**Alternatives considered**: refusing on it — stricter than the vendor, which calls the
change valid. Ignoring it — the human is asked to merge a delta that cannot merge.

## R12. What the agent's own calls send and write, by version

Measured with a fetch recorder, `HOME` isolated (ver, critic):

| Version | Network with no opt-out | HOME |
| --- | --- | --- |
| 1.4.1–1.13.0 | one anonymous PostHog event to `edge.openspec.dev` per command, `--json` included | — |
| 1.13.1, 1.13.2 | nothing until a run without `--json` and without an opt-out shows the first-run notice; that run sends, and every later command sends | the notice writes `~/.config/openspec/config.json` `{noticeSeen, anonymousId}` |
| 1.10.0 on | — | a text-mode call whose stderr is a terminal writes `completionTipSeen` there whatever the opt-outs, and spawns `ps`; `OPENSPEC_NO_COMPLETIONS=1` or `CI` stops it (absent in 1.9.0) |
| any | `openspec update` checks `registry.npmjs.org` | `init` or `update` over installed workflow files writes the same file; a `--tools none` init where `openspec/config.yaml` is missing writes nothing |

`OPENSPEC_TELEMETRY=0` or `DO_NOT_TRACK=1` alone left zero requests on every version
measured, 1.4.1–1.13.2; `openspec config set telemetry.enabled false` exists from 1.10.0. The
printed `new change --json` sends nothing and writes nothing (critic: the same call without
`--json` showed the notice, wrote the file and sent); the printed text `status` is the first
printed call that can. The vendor's own instructions name bare `openspec list`, `openspec
show` and `openspec validate`, and following them sent 3 events in 6 commands on a fresh
machine (ver). A PTY with no size makes text `status` stream spinner codes (200,924,423 B in
~120 s, killed); sized 120×40 it exits 0 with 627 B (critic). The binary found only in
`node_modules/.bin` is not on the agent's PATH, as it was not for the bodies. Every body
declared `allowed-tools: Bash(openspec:*)`; without them each call may ask permission in
Claude Code, and multivac writes no `permissions` today (src/doors/settings.ts).

**Decision**: disclose, by version, in the opsx note (FR-023) and the MV-121 and MV-124
notes; the entry's `env` stays on the two runs multivac makes; no printed prefix, no
allow-rule, no harness `env` (spec Assumptions). The note is checked against every MV-121
and MV-124 retired-phrase regex (0 hits).

**Alternatives considered**: a harness `env` (`OPENSPEC_TELEMETRY: "0"` in claude's
settings) or a printed `openspec config set telemetry.enabled false` — each a decision about
the user's machine, left to the human. A `doctor` version probe — a vendor spawn MV-51 does
not allow; the floors are stated instead.

## R13. flow.md names the ungateable step by its verb

src/doors/flow.ts:98 takes the first `/…` token of an ungateable run, or the point.
speckit's nine runs hold no backtick (synth), opsx's apply run holds `change apply` first,
then `openspec instructions apply --change <slug> --json`.

**Decision**: the verb is the first backticked span whose first word is in the entry's
`required`, then today's `/…` token, then the point: opsx's apply row names `openspec
instructions apply --change <slug> --json`, speckit's page is byte-identical.

## R14. Composition with #3, and the surfaces left alone

- `stepLines` (src/adapters/sdd.ts:899) returns `{ lines, ran }` and `sddInstructions`
  (:849) inserts the continue clause once after the point's last line: the guide goes inside
  the step's lines, so the clause stays last.
- The brain door's step line (src/doors/brain.ts:178) ends `[proof: …]` or `[ungateable]`;
  no guide is added there.
- `closeOwnedDirs` gains the carry condition on merge targets only; `leftoverSdds` and the
  entry's `leftover` removal for code repos (src/lib/repo-state.ts:136, doctor.ts:319–325)
  are unchanged; `leftoverBodies` is the brain's own, beside them.
- The SDD is brain-only: consumer doors print no step, so none changes.
- `change plan`'s "its steps run from the brain checkout" line (src/commands/change.ts:985–997)
  is said at `plan`, of the steps printed there, which run in the brain checkout before
  `change apply` carries the slug's directory; opsx's apply run names where it runs. The
  line is left as it is, so speckit's output stays byte-identical (SC-005), and MV-146's
  note by MV-147 says so.
- MV-142 (the map and its non-code set stay; its test keeps the title its leg reads), MV-55
  (`guide` is optional; order and the door's projection unchanged) and MV-137 (`nonCodeGlobs`
  stays the one derivation; the added globs make its "removing a leftover install of any known
  SDD is free" truer) take no note.
- Out of scope, with owners: graphify's ignore of `.agents/` and a code-less brain's grapher
  (graph-answers-where-asked); measuring what the grapher queries a door prints send, and
  their opt-outs (codegraph-worktrees-and-verbs) — that the codegraph entry's `env` never
  reaches its printed `codegraph query` is said here, since MV-121's note covers what every
  entry prints; claims citing IDs (change-file-cites); `verify`'s root (verify-rooted-and-quiet); trimming
  the multivac skill beyond the false sentences (skill-cites-references).

## R15. Legs

Dialect: POSIX ERE through `git grep`, `[[:space:]]` for `\s`
(skills/multivac/references/anchors.md). `present` is the default mode; `absent`, `count`
and `each` block.

**Dry-run today** (plan; recounted through picomatch at `7b849fa` and `6e2a265` by the walk): the retired-phrase regex over the leg's glob matches 28 lines in
10 files — src/adapters/registry.ts 5, src/adapters/sdd.ts 1, src/commands/change.ts 2,
test/change/sdd-gates.test.ts 5, test/doors/doors.test.ts 3, test/doctor/doctor.test.ts 2,
test/change/lifecycle-polish.test.ts 1, site/content/docs/reference/graphers-and-sdd.md 7,
skills/multivac/references/change.md 1, .claude/skills/multivac/references/change.md 1; 0
after. No `run:` line carries a flag today.

**New legs, MV-147** (written at T059, once every task they read has landed; a proposed row's legs never block, src/commands/verify.ts:844):

```text
<!-- @anchor MV-147 brain:src/adapters/registry.ts /guide\?: string;/ unique -->
<!-- @anchor MV-147 brain:src/adapters/registry.ts /validateNotes\?: string;/ unique -->
<!-- @anchor MV-147 brain:src/adapters/registry.ts /slug\?: \{ pattern: string; reserved: string\[\]; why: string \};/ unique -->
<!-- @anchor MV-147 brain:src/adapters/registry.ts /bodies\?: \{ names: string\[\]; dirs: string\[\] \};/ unique -->
<!-- @anchor MV-147 brain:src/adapters/registry.ts /in the brain checkout run `openspec new change <slug> --json`/ unique -->
<!-- @anchor MV-147 brain:src/adapters/registry.ts /tick `- \[x\]` only what is fully built/ unique -->
<!-- @anchor MV-147 brain:src/adapters/registry.ts /run `openspec archive <slug> --json` to merge/ unique -->
<!-- @anchor MV-147 brain:src/adapters/registry.ts /a flag its `fix` names is never yours/ unique -->
<!-- @anchor MV-147 brain:src/adapters/registry.ts /`archive_confirmation_required` saying `Updating`/ unique -->
<!-- @anchor MV-147 brain:src/adapters/registry.ts /openspec show <slug> --json --deltas-only/ unique -->
<!-- @anchor MV-147 brain:src/adapters/registry.ts /^[[:space:]]*run: .*--(yes|skip-specs|no-validate)/ absent -->
<!-- @anchor MV-147 brain:src/adapters/registry.ts /multivac no longer runs it/ unique -->
<!-- @anchor MV-147 brain:src/adapters/registry.ts /refreshes only the bodies a human installed/ unique -->
<!-- @anchor MV-147 brain:src/adapters/registry.ts /validateNotes: '\^Archive would refuse'/ unique -->
<!-- @anchor MV-147 brain:src/adapters/registry.ts /pattern: '\^\[a-z0-9\]\+\(-\[a-z0-9\]\+\)\*\$'/ unique -->
<!-- @anchor MV-147 brain:src/adapters/registry.ts /\.claude\/commands\/opsx\/propose\.md/ unique -->
<!-- @anchor MV-147 brain:src/adapters/registry.ts /\.claude\/commands\/opsx\/apply\.md/ unique -->
<!-- @anchor MV-147 brain:src/adapters/sdd.ts /a run with no placeholder installs no door's integration/ unique -->
<!-- @anchor MV-147 brain:src/adapters/sdd.ts /withSlug\(step\.guide, slug\)/ count=4 -->
<!-- @anchor MV-147 brain:src/adapters/sdd.ts /withSlug\(s\.guide, slug\)/ unique -->
<!-- @anchor MV-147 brain:src/adapters/sdd.ts /is only in the change's worktree/ unique -->
<!-- @anchor MV-147 brain:src/adapters/sdd.ts /passes and notes: / unique -->
<!-- @anchor MV-147 brain:src/adapters/sdd.ts /export function sddSlugWhy\(/ unique -->
<!-- @anchor MV-147 brain:src/adapters/detect.ts /export function bodyGlobs\(/ unique -->
<!-- @anchor MV-147 brain:src/lib/code-in-change.ts /bodyGlobs\(/ unique -->
<!-- @anchor MV-147 brain:src/change/carry.ts /export async function carriesMerge\(/ unique -->
<!-- @anchor MV-147 brain:src/change/carry.ts /await carriesMerge\(brainDir, / unique -->
<!-- @anchor MV-147 brain:src/doors/flow.ts /first backticked command of a required binary/ unique -->
<!-- @anchor MV-147 brain:src/lib/repo-state.ts /export async function leftoverBodies\(/ unique -->
<!-- @anchor MV-147 brain:src/commands/doctor.ts /await leftoverBodies\(/ unique -->
<!-- @anchor MV-147 brain:src/commands/{change,roadmap}.ts /the brain's SDD takes no such slug/ each -->
<!-- @anchor MV-147 brain:{*.md,src/**,test/**,site/content/**,skills/**,.claude/skills/multivac/**} !CHANGELOG.md /\/opsx:|would silently (skip|do nothing)|chat commands the agent runs/ absent -->
<!-- @anchor MV-147 brain:test/change/sdd-gates.test.ts /opsx: multivac spawns only the scaffold and the validator, new to close/ unique -->
<!-- @anchor MV-147 brain:test/change/sdd-gates.test.ts /opsx: land prints the archive with no flag, and the question under it/ unique -->
<!-- @anchor MV-147 brain:test/change/sdd-gates.test.ts /opsx: a land proof found only in the change's worktree is refused/ unique -->
<!-- @anchor MV-147 brain:test/change/sdd-gates.test.ts /change new refuses a slug the brain's SDD cannot create/ unique -->
<!-- @anchor MV-147 brain:test/change/sdd-gates.test.ts /the apply gate prints openspec's archive-would-refuse note and passes/ unique -->
<!-- @anchor MV-147 brain:test/change/lifecycle-polish.test.ts /a main spec the archive did not merge into is named, not staged/ unique -->
<!-- @anchor MV-147 brain:test/change/roadmap.test.ts /roadmap add refuses a slug the brain's SDD refuses/ unique -->
<!-- @anchor MV-147 brain:test/doors/doors.test.ts /the door carries each opsx command and no guide/ unique -->
<!-- @anchor MV-147 brain:test/doors/flow.test.ts /the ungateable verb is the first backticked command of a required binary/ unique -->
<!-- @anchor MV-147 brain:test/doors/registry.test.ts /no SDD step's run carries a flag that answers the tool's own question/ unique -->
<!-- @anchor MV-147 brain:test/doors/registry.test.ts /opsx's lines carry the questions its command bodies asked/ unique -->
<!-- @anchor MV-147 brain:test/init/equip.test.ts /bodies an earlier init left leave through any commit/ unique -->
<!-- @anchor MV-147 brain:test/doctor/doctor.test.ts /doctor names opsx bodies an earlier init left in the brain/ unique -->
<!-- @anchor MV-147 brain:test/verify/code-in-change.test.ts /the bodies an openspec init writes are not code under any integration's directory/ unique -->
<!-- @anchor MV-147 brain:site/content/docs/reference/graphers-and-sdd.md /^### The question openspec asks at archive$/ unique -->
<!-- @anchor MV-147 brain:.multivac/invariants.md /Amended [0-9]{4}-[0-9]{2}-[0-9]{2} by MV-147/ count=12 -->
```

At review: the retired-phrase alternative widened from `steps are chat commands the agent
runs` to `chat commands the agent runs`, since the site's retired sentence bolded it; the
count is twelve with MV-142's note; two carry test legs added (`carriesMerge compares whole
blocks, read as openspec reads them, fences included`, `closeOwnedDirs maps only the file
openspec merges`); MV-51's `new prints propose` moved to `new prints openspec new change`
with the renamed test; MV-146's `merges:` leg reads the record's `file: 'spec\.md'` too.

Notes: the flag leg needs each `run` on one source line, as registry.ts writes them; a
guide names the flags on a `guide:` line, which it does not read. The retired-phrase leg
scans `test/**`, so a test asserts absence with `/opsx[:]/`, whose source text does not
carry the literal, and no regex literal starts with `opsx:` (its source would read
`/opsx:`); the titles `'opsx: …'` are quoted strings and do not match. The runs and guides hold apostrophes, so they are double-quoted TS
strings; no leg anchors on the quote.

**Legs that move** (each by the task whose code makes the old one false: T004, T054, T030, T018):

| Row | Old | New | Why |
| --- | --- | --- | --- |
| MV-51 | `src/adapters/registry.ts /These are chat commands, not terminal subcommands/` | `src/adapters/registry.ts /the lifecycle prints them and gates on what they leave behind, and never spawns one/ unique` | the `steps` doc is reworded |
| MV-51 | `site/…/graphers-and-sdd.md /chat commands the agent runs/` | `site/…/graphers-and-sdd.md /steps are \*\*commands the agent runs\*\*/ unique` | the sentence is made true |
| MV-63 | `src/adapters/registry.ts /continues over its own warning/ unique` | `src/adapters/registry.ts /archives over its own refusal/ unique` | R7 |
| MV-130 | `src/adapters/registry.ts /run: 'openspec init --tools \{keys\} --no-animation \.'/ unique` | `src/adapters/registry.ts /run: 'openspec init --tools none --no-animation \.'/ unique` | R3 |

**Unchanged and still green**: MV-51's `INSTRUCT the agent, never shell out`, `A step is
never faked by shelling out`, `export const withSlug`, `spec-kit has no archive step`,
`flow — \$\{l\}` and the test title `new prints propose`; MV-56's refusal texts and test
titles; MV-63's `A ledger the TOOL ITSELF keeps` and its two test titles; MV-75's legs,
`declared but never run here` included; MV-95's `run the chain through without asking to
continue` (no guide spells it) and `the boundaries ride with the line, every time`; MV-121's
and MV-124's `absent` legs (the note matches none, `init / update / list / show /` included);
MV-124's `env: \{ DO_NOT_TRACK: '1'` `count=2` and `\.\.\.spec\.env` `each`; MV-130's map
type, `scaffoldCommands\(sc, cfg\.doors\)` `count=2`, `multivac never forces an integration`
and the site's `cursor` row; MV-133's `await slugHits\(brain, r, slug, want\)` `count=2`;
MV-142's `step zero passes its own gate` and `for \(const d of integration\.dirs\)`; MV-144's
`is dirty and was not staged` unique (the uncarried targets print through it) and `dirs:
\['\.agents'\]` `count=3`; MV-146's `merges: …`, `closeOwnedDirs`, test titles and `absent`
legs (no new text says "in every repo where … is installed").

## R16. The law as it will be written

**MV-147**, filed `open | proposed | <date> | [changes/opsx-through-its-cli.md](changes/opsx-through-its-cli.md)`,
one physical line: the bold title (the spec's input sentence); **measured** — R1's 19 files
and 273,400 B, the 58,089 B of four bodies and the 2,335 B listing, the per-harness spelling,
the propose body's stop and the archive body's hand merge, `archive --json`'s two codes and
`--json --yes` over open tasks (1.5.0–1.13.2), the 24,329 B over 15 calls against about
111,000, the worktree archive that passed close, the `--skip-specs` archive that staged a
human's edit, the CRLF merge left out, `new change`'s refusals and `archive`, and the
validator's INFO issue; **The rule** — *Printed* (the four runs; `run` names the human's
question on every surface; `guide` under the step at its point and in the refusal that names
it, never in the door, `doctor` or flow.md; no `run` carries `--yes`, `--skip-specs` or
`--no-validate`), *Asked* (R8's questions; the archive question with the `show` preview and
the three answers; any other code fixed, never flagged past), *Installed* (`--tools none`;
the map as the record the code gate reads; the bodies openspec's inits write, under every
integration directory and `.codex/`, are not code; `doctor` names those an earlier init left,
with their removal), *Landed* (the land proof in the brain checkout alone; the merge carry of
R6; the ledger's reason), *Refused early* (the slug grammar in `change new` and `roadmap add`;
the validator note), *Disclosed* (the entry's `env` reaches the runs multivac makes and none
it prints; the note by version); **What is mechanical** (R15); **Ceilings** — every edge case
of the spec marked a ceiling (1.13.1+ with no opt-out, text `status` first; `completionTipSeen`
on a terminal stderr; a PTY with no size; below 1.4.0 and 1.4.x; `new change` outside the
brain; REMOVED/RENAMED-only deltas and a human's edit to a spec the archive merged into; the
binary only in `node_modules/.bin`; Claude Code permission prompts), plus: whether the agent
asked, ticked only what it built or added a flag unasked is ungateable (MV-95, MV-63); a brain
scaffolded before this row keeps its bodies, and the propose body's stop, until removed; the
bodies' softer advice is not carried; nothing re-measures an upgrade (MV-121).

**The twelve notes** (MV-142's added at review), each `**Amended <date> by MV-147**: …` at the end of its row's
statement cell, `<date>` the day the commit writing it is made (2026-09-28 for eleven, 2026-09-29 for MV-142's):

| Row | What the note says |
| --- | --- |
| MV-51 | "chat instructions verified against each tool's own docs (the `/opsx:` commands …)" is WITHDRAWN for opsx: its steps are openspec's terminal verbs (`new change`, `status`, `instructions`, `archive`), verified against `openspec --help` 1.13.2 and run there with stdin closed; the agent runs them and the lifecycle prints them; speckit's stay chat commands; multivac still spawns only the validator and the scaffold; a printed verb is one the tool ships — `openspec propose` and `openspec apply` exit 1, `unknown command`. |
| MV-56 | a refusal also prints, under the step's command, the `guide` the step carries; a land step's proof found only in the change's worktree is refused by name; a passing verdict is still a pass, and the gate also prints each issue its step's `validateNotes` names (openspec 1.13.2's "Archive would refuse this delta"). |
| MV-63 | the example is text mode's: `openspec archive --json --yes` archives over open tasks with exit 0 and no warning (1.5.0–1.13.2); the printed archive carries no `--yes`, so openspec refuses open tasks itself with `archive_tasks_incomplete`; the ledger at close is the only check that sees tasks a human's `--yes` archived open, and its reason says `--yes` archives over the tool's own refusal. |
| MV-75 | the deadlock is spec-kit's: opsx's steps are terminal verbs present wherever the binary is, and `new change` creates a root where none resolves (1.13.2); its scaffold still runs where `openspec/config.yaml` is missing, so the brain gets the vendor's own `config.yaml` and the probe reads an init, not a side effect. |
| MV-95 | for opsx, "a question the tool itself raises" is printed with the step it comes from: openspec 1.13.2's bodies asked, and the lines now carry — before a proposal, an ambiguity that would change scope, observable behaviour, compatibility or acceptance, or a conflict with a main spec; `already exists` for a change not opened in this run; an unclear task, a design issue the work reveals, work beyond the spec and tasks, a task narrowed, deferred or dropped, a blocker; a task ticked only when fully built; "ready to be archived" is `change land`'s. `archive_confirmation_required` saying `Updating` goes to the human with `openspec show <slug> --json --deltas-only` and the tool's own answers; the same code about skipping validation, and every other code, is not that question and never gets a flag from the agent. The bodies' planning boundary (stop after planning) is a "may I continue" stop this row rejects, and goes with them. The continue instruction follows the point's last step and the guide under it. |
| MV-121 | the disclosure also covers what an entry PRINTS for the agent to run, and says the entry's `env` does not reach it: R12's table by version — 1.4.1–1.13.0 one event per command; 1.13.1–1.13.2 nothing until a run without `--json` and without an opt-out shows the notice, writing `~/.config/openspec/config.json`, every later command sending, the printed text `status` the first printed call that can; `completionTipSeen` on a terminal stderr whatever the opt-outs (1.10.0 on), stopped by `OPENSPEC_NO_COMPLETIONS=1`; `init` or `update` over installed workflow files writes the same file; a `--tools none` init where `config.yaml` is missing writes nothing there; the codegraph entry now says its `env` does not reach the `codegraph query` a door prints (the amendment covers every entry's printed commands), and measuring what those queries send is codegraph-worktrees-and-verbs'. |
| MV-124 | the entry's `env` applies to every run multivac makes and to none of the commands it prints; "whether a vendor honours its opt-out was read, not measured" no longer holds for openspec: either variable alone left zero requests on every version measured, 1.4.1–1.13.2. |
| MV-130 | "installs the integration each declared door uses" is WITHDRAWN for opsx: its scaffold is `openspec init --tools none --no-animation .`, writing `openspec/config.yaml` and two gitkeeps whatever the doors (1.13.2); `scaffoldCommands` returns a run with no placeholder as written and names no gap; the map stays as the record of what `--tools <key>` writes; spec-kit's is unchanged. |
| MV-133 | a step printed at `land` runs after every stage has merged, so its proofs, ledger included, are read in the checkout alone: a proof found only in the change's worktree, once or more, never reached the brain and is refused by name, and its ledger is not read from there. |
| MV-142 | (added at review) "a declared SDD installs its own commands and skills elsewhere" holds for spec-kit alone: opsx's `--tools none` scaffold installs none, so its integrations' directories exempt what a human's `openspec init --tools <key>`, or an earlier init, installed there, beside the entries openspec's inits write under every integration's directory and `.codex/`. |
| MV-144 | opsx's integration `dirs` now record what a key writes when a human installs its bodies by hand, or what an earlier multivac's init left; the code gate still reads them, and also reads as not code the entries openspec's inits write under every integration's directory and `.codex/`, declared door or not, so removing what `doctor` names is not code. |
| MV-146 | "a step's proof is looked for in the brain and in the change's worktree" holds for every point but `land` (MV-133's note); a main spec file a merging step records is staged only when it carries the merge — LF endings, trailing whitespace and blank-line runs normalised on both sides, it holds every `### Requirement:` block under the archived delta's ADDED and MODIFIED sections, tracked or untracked alike — and is named dirty otherwise; a delta with no such block is staged as before. |

`change.invariants.touches` lists these twelve (MV-142 added at review), `adds: [MV-147]`,
`retires: []` (.multivac/changes/opsx-through-its-cli.md, 6e2a265).

## R17. Ceilings, stated

Nothing re-measures openspec on upgrade (MV-121); the printed wording is true of 1.5.0
through 1.13.2, the scaffold of 1.7.0 on. The agent's calls carry none of the entry's
opt-outs. Whether the agent asked, ticked only what it built, or added a flag unasked leaves
nothing on disk: only the human's answer and the ledger do. A delta of REMOVED or RENAMED
blocks only is staged as today; a human's edit beside the blocks the archive really merged
lands with the merge. An untracked leftover body is named, and its removal is the
operator's; a body is matched by the names openspec's inits give, so a human's own entry
under such a name is named with them (data-model.md, `leftoverBodies`). A merge target
holding only some of the delta's blocks — a human's edit inside a merged block — is named
dirty and left out of close's commit (a header with extra whitespace is written verbatim,
measured at implement, R6). `openspec new change` run outside the brain creates a root there, which the
guide says to delete. A binary only in `node_modules/.bin` is not on the agent's PATH, and
each call may ask permission in Claude Code, where no allow-rule is written.
