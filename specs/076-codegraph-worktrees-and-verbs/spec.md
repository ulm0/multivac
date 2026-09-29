# Feature Specification: codegraph answers for the checkout it is asked in

**Feature Branch**: `076-codegraph-worktrees-and-verbs` | **Created**: 2026-09-29 | **Status**: Draft
**Input**: User description: "codegraph: an index in each checkout a change hands out, the verbs that were run with what each misses, one post-edit hook per grapher, and a consumer's index that keeps the mounted brain out. `change apply` builds a local index in each checkout it hands out and says so, `change land` syncs it and `change close` removes it; codegraph's door lists four measured verbs, each naming what it misses, and its entry discloses by version what the agent's own codegraph calls write and send; the brain's session gets one post-edit hook per grapher; codegraph's `codegraph.json` keeps the mounted brain out of a consumer's index, spliced, never re-serialised. Adds MV-149, amends ten rows. Extends graph-answers-where-asked (MV-148), which lands first."

## User Scenarios & Testing *(mandatory)*

<!-- Stories ordered by dependency, all P1. US1 builds the index every other story's worktree case reads; US2's hooks refresh the indexes US1 builds; US3 keeps the mount out before US4's verbs are printed to consumers, whose index would otherwise answer with the mounted brain's code (the design's "K comes first"). The design had "kept out" at P2; it rises to P1 because US4 depends on it. -->

### User Story 1 - A change's checkout has its own codegraph index, and nothing about it is silent (Priority: P1)

An agent works a change in a repository whose grapher is codegraph. Today `change apply`
hands out a worktree with no index, and codegraph asked there answers from the nearest index
above it with exit 0: on a real branch the trunk index lacked 19 of the branch's own symbols
and put 24 of 192 moved symbols more than 60 lines from where they now are, and a sibling's
worktree nested in a codegraph brain answered with the brain's code. The line `change apply`
prints under that worktree says it has no index and names the base. In a sibling repo whose
ignore line nobody committed, an index built in the worktree would show `?? .codegraph/`,
`git add -A` would stage codegraph's own `.codegraph/.gitignore`, and `change close` would keep
the worktree as holding uncommitted work. With codegraph's file watcher off, `codegraph init`
waits on a prompt, and multivac's runner left the child's stdin open: it had not returned after
30 seconds.

**Why this priority**: correctness. An answer about the branch comes from the branch, and the
line under each checkout says which index answers and how fresh it is. It is the change
graph-answers-where-asked deferred here, and its door and pointer lines flip only in the change
that builds the index.

**Independent Test**: in a scratch brain that holds code, on codegraph 1.6.0 with `HOME`
isolated, open a change, add a function on the branch, run `change apply` and ask the index it
names; then walk land and close in a sibling repo whose ignore line is uncommitted, and in one
whose `.gitignore` holds only `*.db`.

**Acceptance Scenarios**:

1. **Given** a brain that holds code on codegraph and a change naming it, **When** `change apply` runs, **Then** it prints `graph codegraph @ brain worktree: built (\`codegraph init\`) — local artifact, never committed`, and under the worktree `its index: -p <worktree> — <freshness>; paths in its answers are relative to this checkout`, and `codegraph query <symbol> -p <worktree>` finds a function that exists only on the branch.
2. **Given** a worktree left by an earlier apply, or a repo branched in place, **When** `change apply` runs again, **Then** it syncs the index there (`refreshed (\`codegraph sync\`)`) instead of building it.
3. **Given** a repo whose `.codegraph/` line is in an uncommitted `.gitignore`, or whose `.gitignore` holds only `*.db`, **When** `change apply` builds the worktree's index, **Then** it first appends `.codegraph/` to the repository's common `info/exclude` and says so in one line; the worktree's `git status --porcelain` is empty, the tracked `.gitignore` is byte-identical, and a second apply writes nothing.
4. **Given** a repo that already ignores `.codegraph/`, **When** `change apply` runs, **Then** no exclude line is written or printed.
5. **Given** a codegraph that waits on a prompt, **When** `change apply` runs it, **Then** the prompt reads end-of-file, apply returns with exit 0, and no git hook is installed.
6. **Given** a declared door with a post-edit hook and codegraph's hook wired, **When** the pointer is printed, **Then** its freshness is `refreshed after your edits`; **Given** no such door, **Then** it is `as of this apply, refreshed again at \`change land\``.
7. **Given** codegraph reachable only through the repo's own `node_modules/.bin`, which a worktree lacks, **When** `change apply` runs, **Then** it builds no worktree index, prints one line saying the binary is found on neither PATH nor the worktree's `node_modules/.bin`, and prints the fallback line that names the base; it never prints `-p <worktree>`.
8. **Given** a failing build, **When** `change apply` runs, **Then** it warns quoting the tool's cause, exits 0, and prints the fallback line.
9. **Given** an edit on the branch, **When** `change land` runs, **Then** it syncs the index in the checkout holding the change's branch and commits no index; where apply could not build, land builds after the same exclude step; on a detached HEAD or another branch it says nothing and does not refuse.
10. **Given** a merged change, **When** `change close` runs, **Then** the worktree and its index are removed with a plain removal.
11. **Given** a brain that holds code on codegraph, **When** `doors` renders its door, **Then** the line under the grapher lines says `change apply` builds each change worktree its own index and prints `its index: -p <worktree>`, that where `apply` printed no such line `-p` there answers from this checkout's index without the branch's edits, and never to run the `codegraph init` codegraph's notices suggest.
12. **Given** code repos resolving codegraph listed in a brain's door, **When** the door renders them, **Then** each verb carries `-p <checkout>`, and the group line says each change worktree's index is built by `change apply`, which prints `its index: -p <worktree>`, and that where `apply` printed no such line `-p` at that worktree answers from the nearest index above it, or fails.
13. **Given** a shared artifact (graphify), **When** `change apply` runs, **Then** nothing is built or refreshed in the worktree.

---

### User Story 2 - Every grapher the brain's session edits gets its own post-edit hook (Priority: P1)

An agent edits code from the brain's session, in a code repo or its change worktree. Today one
refresh hook serves a brain: a code-less brain whose repos resolve graphify and codegraph wires
none, and in a graphify brain that holds code an edit in a codegraph sibling's indexed worktree
refreshed the brain's graph and left the sibling's index without the edit.

**Why this priority**: without it, US1's worktree indexes in a mixed ecosystem are refreshed only
at `change land` and `change close`, and the door's freshness words for them have to say so.

**Independent Test**: in a code-less brain with `web` on graphify and `api` on codegraph, run
`doors`, then pipe three edit payloads — web, api, the brain — into the hooks with stub graphers,
and then with the real binaries.

**Acceptance Scenarios**:

1. **Given** a code-less brain whose repos resolve graphify and codegraph and a declared door with a post-edit hook, **When** `doors` runs, **Then** `.claude/settings.json` holds two refresh hooks, one per grapher, each wired only where its binary is reachable.
2. **Given** those hooks, **When** an edit in web, in api, or in the brain reaches them, **Then** only web's grapher runs for the web edit, only api's for the api edit, and nothing runs, and no lock is taken, for the brain edit.
3. **Given** a graphify brain that holds code with a codegraph sibling, **When** an edit in the sibling's indexed worktree reaches the hooks, **Then** the sibling's index holds the edit; the brain's own hook keeps its bytes.
4. **Given** a brain resolving one grapher, **When** `doors` re-runs, **Then** `.claude/settings.json` is byte-identical to before.
5. **Given** a settings file where a user added a command beside one of multivac's refresh hooks, **When** a repo's grapher is removed and `doors` runs, **Then** exactly that grapher's hook goes and the user's command stays.
6. **Given** a hook written by an earlier multivac, or a command a human typed that runs a grapher, **When** `doors` runs, **Then** the earlier hook is taken over in place, never doubled, and the human's command is never touched.
7. **Given** two declared graphers that write the same artifact, **When** `doors` runs, **Then** no follow hook is wired for the second and one notice says why and what refreshes it.
8. **Given** a repo holding the artifact of a grapher it does not resolve while that grapher's hook is wired, **When** `doctor` runs, **Then** it names the repo, the foreign artifact and its removal, with its exit code unchanged.
9. **Given** any brain, **When** the door's freshness words, the apply pointer, flow.md's refresh row and `doctor`'s refresh path speak of one grapher, **Then** all four give the same answer.

---

### User Story 3 - A consumer's codegraph index keeps the mounted brain out, and a human's config is theirs (Priority: P1)

An agent works in a consumer of a brain that holds code, the brain mounted at `.brain`. Today
codegraph indexes the mount: 2,247 of the consumer's 2,254 nodes, and `callers add` answers
with the brain's callers. A `.gitignore` line would keep it out but makes a later
`git submodule add` of the mount exit 128; re-serialising a human's `codegraph.json` dropped a
duplicate key, its CRLFs and a number's digits.

**Why this priority**: US4's verbs are printed to consumers; until the mount is out they answer
with the brain's code. Raised from the design's P2 for that reason.

**Independent Test**: a consumer of a brain that holds code with the brain mounted, after
`repos sync`; a human-written `codegraph.json` in every shape the splice must keep; `change land`
in a consumer whose committed `codegraph.json` lacks the line.

**Acceptance Scenarios**:

1. **Given** a consumer of a brain that holds code, **When** `repos sync` builds its index, **Then** a 38-byte `codegraph.json` excluding `/.brain/` is written first, and the index holds no node under `.brain/`.
2. **Given** a human's `codegraph.json` with CRLF line endings, a duplicate key, a number spelled `1.50` or no trailing newline, **When** multivac adds its line, **Then** every byte the human wrote is kept and the line is inserted into the `exclude` list.
3. **Given** a human's `codegraph.json` whose `exclude`, `include`, `includeIgnored` or `deprioritize` names the mount in any spelling, negated, or a path under it, **When** multivac would add the line, **Then** it adds nothing, and for the last three says which list names it.
4. **Given** a `codegraph.json` that does not parse to an object with a string list at `exclude`, **When** multivac would add a line, **Then** the file is left byte-identical and one notice names the line to add by hand.
5. **Given** a consumer whose committed `codegraph.json` lacks the line, **When** `change land` names it, **Then** the line is added in the checkout holding the change's branch and committed alone; a second land commits nothing.
6. **Given** a `codegraph.json` that git ignores, **When** `change land` would write it, **Then** it writes nothing and names the rule to inspect.
7. **Given** a consumer of a code-less brain, or a brain that holds code with no nested repo, **When** its index is built, **Then** no `codegraph.json` is created.
8. **Given** `mount: ./.brain`, **When** ignore lines are written, **Then** both codegraph's and graphify's say `/.brain/`.
9. **Given** a root's `codegraph.json`, **When** `doctor` runs, **Then** it names missing lines, an uncommitted file and a malformed one, and writes nothing.

---

### User Story 4 - The door lists the verbs that were run, and what each misses (Priority: P1)

An agent reads codegraph's block in a door. Today it lists one verb and says the graph answers
in one call what grep takes many; over this repository's 318 top-level functions,
`codegraph query` printed more than a narrowed definition grep for 311. The verbs that do
answer — who calls a symbol, what may break, its body — are not listed, and nothing says what
they miss. The entry says only that its `env` does not reach the query a door prints, not what
that query writes and sends.

**Why this priority**: the door is read every session; a claim the data refutes is the kind of
lie this tool exists to prevent, and the disclosure is owed by MV-121's note from
opsx-through-its-cli.

**Independent Test**: render a codegraph consumer's door and compare it byte for byte with a
pinned copy; read the registry entry's verbs and note; run the four verbs on codegraph 1.6.0 in
this repository.

**Acceptance Scenarios**:

1. **Given** a codegraph door, **When** it lists the verbs, **Then** they are `codegraph query <symbol>`, `codegraph callers <symbol>`, `codegraph impact <symbol>` and `codegraph node <symbol>`, each with what it answers and what it misses.
2. **Given** any door that lists a grapher's verbs, **When** it renders the header, **Then** the header claims no saving over grep.
3. **Given** a brain that holds code on codegraph with codegraph siblings, **When** the door lists the siblings, **Then** it says the verbs above apply with `-p <checkout>` appended instead of listing them again.
4. **Given** codegraph's registry entry, **When** it is read, **Then** its note says by version what the agent's own codegraph calls write and send, the npm shim's download included, with the opt-outs spelled for where the agent runs, in place of the sentence that said only that its `env` does not reach them.
5. **Given** the documentation, the skill and the tool's own comments, **When** they are searched, **Then** no copy says a sentence handed to codegraph returns nothing, or that one graph call answers what grep or a search takes many.

---

### Edge Cases

- This repository: a graphify brain that holds code, with no other repo. No codegraph index is built, no `codegraph.json` written; its door, its hook settings and its bytes do not change.
- A repo branched in place gets its index synced in place; the brain's own main checkout gets no pointer line, as before.
- codegraph reachable only through a repo's `node_modules/.bin`: no worktree index, since a worktree has no `node_modules` and neither the hook nor the agent's shell reaches that copy; the door names the bare `codegraph` (ceiling).
- An index is as fresh as the last apply, land, close or hook run: an edit made through Bash is not in it, and `callers` and `impact` asked while the hook's sync runs are partial — 31 of 35 callers in 12 of 12 trials; the refresh lock existing means a sync is running (ceiling).
- A worktree's mount is empty, so a worktree index never holds the mounted brain; a consumer indexed before this change holds the mount until `codegraph.json` reaches that checkout, and `codegraph sync` then purges it without a rebuild, the database file keeping its size until a full index (ceiling).
- `CODEGRAPH_DIR` set to another directory reads partial, so apply rebuilds each time, and `change close` keeps the worktree over that directory with its `--force` line (ceiling).
- apply's builds run one after another, one per named codegraph repo, and a repo's first apply builds twice, its checkout's and its worktree's: 1.1 to 7.0 seconds each by repo size (ceiling).
- A repo holding two graphers' artifacts: both follow hooks pass their guard and share one lock, so an edit refreshes one of them — 8 and 12 of 20 — and the other catches up at its next refresh; `doctor` names the repo and the removal (ceiling).
- A graphify brain that holds code keeps its own hook's bytes, so an edit in a sibling repo lacking the brain's artifact still refreshes the brain's graph in the background (ceiling).
- Two keyless copies of multivac's refresh hook, which the merge used to rewrite and keep, become one (stated behaviour change).
- Graphers declaring one artifact: no follow hook for the second; `change land` and `change close` refresh it.
- A line a human deletes from `codegraph.json` without negating it comes back at the next write; a human's entry naming a path under the mount keeps the mount line out (ceiling).
- A `codegraph.json` untracked in the repo's own checkout: land writes nothing and says nothing; `doctor` names it.
- A mount spelled absolute or starting with `..`: no mount line is written.
- `callers` lists 20 unless `--limit N` and counts what it lists; `callers` and `impact` merge same-named symbols and miss calls made through an aliased import; in Python `callers` missed method calls; `node -f` matches a path only as the index prints it, and a path outside the repo answers "No indexed file matches" with exit 0 (ceilings).
- The agent's own codegraph calls carry no opt-out unless its environment sets one; a later run without one sends what they queued; the disclosure is by version (ceiling).
- codegraph was measured on 1.6.0 alone; nothing re-measures on upgrade (MV-121).

## Requirements *(mandatory)*

### Functional Requirements

#### Indexed

- **FR-001**: For a grapher whose artifact is local, `change apply` MUST, in each checkout it hands out — the change's worktree or the repo branched in place — build the index where it is not installed or sync the one that is, through the grapher's one runner with the entry's environment under that checkout's refresh lock, after the read-only refusal, after the worktree is made and its files carried, and before it prints where to work. A re-run of `change apply` MUST sync again. A shared artifact MUST get nothing at apply. The build MUST never write the grapher's ignore file or `.gitignore`.
- **FR-002**: The binary lookup MUST be asked in the checkout the command runs in. Where it misses there, `change apply` MUST build nothing there and print the missing-binary line naming that checkout once — except where the repo's own checkout still has no index after equipping, whose lookup already printed that line for the repo; then it MUST print nothing more.
- **FR-003**: Before a build or sync the binary lookup allows, each line of the entry's ignore list that git does not ignore in that checkout — asked of the line itself — MUST be appended to the repository's common `info/exclude`, creating it where missing, never to a tracked file, with one line naming what was added, where, and that the file is never committed. A line already there, or ignored by the repository, MUST NOT be written again.
- **FR-004**: Every command the grapher runner spawns — build, refresh, rebuild and harness install — MUST have its stdin closed, so a vendor prompt reads end-of-file instead of waiting.
- **FR-005**: `change land`, for a local artifact, MUST in the checkout holding the change's branch run graph-answers-where-asked's ignore step for the grapher's own file (never `.gitignore`), then, where the binary is found there, FR-003's exclude step and the build or sync of the index, and MUST commit no index. Where the lookup misses there it MUST say nothing more. On a detached HEAD or another branch it MUST return without a refusal. The shared-artifact path MUST be unchanged.
- **FR-006**: `change close` MUST remove the worktree and its index with a plain removal; graph-answers-where-asked's forced removal of a worktree holding only the grapher's outputs MUST stay as the second defence.
- **FR-007**: `change apply` MUST print under a checkout whose local index is installed `its index: -p <checkout> — <freshness>; paths in its answers are relative to this checkout`, the freshness being `refreshed after your edits` where a declared door has a post-edit hook and the brain wires this grapher's hook (FR-016), else `as of this apply, refreshed again at \`change land\``. Where the index is not installed it MUST print graph-answers-where-asked's fallback line unchanged and never `-p <worktree>`. The brain's own main checkout MUST get no line.
- **FR-008**: A brain that holds code on codegraph MUST carry, in place of the line saying a change's worktree has no index, one line saying the law, the changes and their specs are kept out of its index, that `change apply` builds each change worktree its own index and prints `its index: -p <worktree>`, with paths relative to that worktree, that where `apply` printed no such line `-p` there answers from this checkout's index without the branch's edits, and never to run the `codegraph init` codegraph's notices suggest.
- **FR-009**: Where a door lists code repos resolving codegraph, each verb MUST carry `-p <checkout>`, and the group line MUST say the index is built in each checkout and never committed, each change worktree's by `change apply`, which prints `its index: -p <worktree>`, and that where `apply` printed no such line `-p` at that worktree answers from the nearest index above it, or fails. No door line MAY say a worktree has an index without that condition.
- **FR-010**: codegraph's registry entry MUST record the measured 1.6.0 layout: the database under `.codegraph/`, codegraph's own `.codegraph/.gitignore` (`*`, `!.gitignore`), write-ahead log files that may sit beside it, relative paths in the index, a worktree build writing nothing outside the worktree, and that `codegraph query` borrows the nearest index above silently while `codegraph status` warns.
- **FR-011**: Every surface that says what `change land` does with a graph MUST say, for a local artifact, that the index is built in each change worktree at `change apply`, synced at `change land` and never committed — flow.md's refresh row, `doctor`'s refresh path, the running-changes guide and the multivac skill included.

#### Followed

- **FR-012**: A refresh hook MUST be multivac's by its lock preamble, as today, and a given grapher's by the artifact its toplevel test names; a hook written before that test existed has no grapher. Identifying a hook MUST add no byte to it.
- **FR-013**: The settings merge MUST keep one refresh hook per wanted grapher: rewrite each of multivac's hooks whose grapher is wanted in place, copies included; let a wanted grapher still without one take over, inside its entry, a hook of multivac's naming no wanted grapher or none; add an entry for each wanted grapher still left; remove every other hook of multivac's and only the entries thereby left empty. An empty want MUST remove every refresh hook. A command a human typed MUST never be taken. Two keyless copies of multivac's become one.
- **FR-014**: The graphers the brain's session refreshes MUST be: in a brain that holds code, its own, with its hook's bytes unchanged, then each other grapher its writable code repos resolve, as a follow hook; in a code-less brain, each grapher its writable code repos resolve, as a follow hook. Repos resolving none, unverified graphers and repos marked `managed: false` MUST NOT count. A grapher whose artifact another listed grapher also writes MUST be left out, with one notice naming both and what refreshes the second.
- **FR-015**: Each hook MUST be wired only where the binary lookup finds its binary — the brain's own in the brain; a follow hook on PATH or in each writable code repo resolving it, as graph-answers-where-asked wires its one. A consumer MUST keep its one hook, byte for byte. The notice that one hook runs one command MUST go.
- **FR-016**: The door's freshness words, the apply pointer's freshness, flow.md's refresh row and `doctor`'s refresh path MUST ask one question: a declared door has a post-edit hook and the brain's session refreshes that grapher. `doctor`'s refresh path MUST name each grapher whose hook follows edits.
- **FR-017**: `doctor` MUST, for each writable repo holding the artifact of a known grapher it does not resolve while that grapher's hook is wired, append to that repo's grapher line the artifact, the grapher, that its hook refreshes it there, and its removal — `codegraph uninit --force` for codegraph, graph-answers-where-asked's removal for graphify — and nothing when that hook is not wired. The probe MUST stay offline and the exit code unchanged.

#### Kept out

- **FR-018**: codegraph's registry entry MUST declare `codegraph.json` as its ignore file, the `exclude` list as where lines go, `exclude`, `include`, `includeIgnored` and `deprioritize` as the lists any of which naming a line makes it the human's, and that only structural lines are written; and MUST record the 1.6.0 facts: the file sits at the project root, `exclude` holds gitignore-style patterns and wins over `include` and `deprioritize`, `sync` purges newly excluded files, a malformed file is ignored with a warning, `init` never creates it, `.gitignore` is honoured and `.git/info/exclude` is not.
- **FR-019**: codegraph's lines MUST be only the structural ones: in a code repo whose brain holds code, the mount; and each declared repo nested inside the root. Where the set is empty, nothing MUST be written and no file created.
- **FR-020**: Lines MUST be spliced into the file's text, never re-serialised: inserted into the last top-level `exclude` list (multi-line with the file's line ending and the previous element's indentation, inline, or empty), or, where the key is absent, added as a new member with the top-level members' indentation; a missing or empty file becomes `{\n  "exclude": [\n    "<line>"\n  ]\n}\n`. The output with the inserted span removed MUST equal the input. A file that does not parse to an object whose `exclude`, where present, is a list of strings MUST be left byte-identical, with one notice naming the line to add by hand.
- **FR-021**: A line `/x/` MUST be skipped when any of the four lists holds `x`, `x/`, `/x`, `/x/`, `x/**` or `/x/**`, negated or not, or names a path under `x`; a skip over `include`, `includeIgnored` or `deprioritize` MUST name that list.
- **FR-022**: The lines MUST be written where graph-answers-where-asked writes ignore lines — before a root's first build, and at `change land` in the checkout holding the change's branch under that change's rule — and never by apply's build in a change's checkout, `doors`, `doctor`, `verify` or `repos sync` over a built root. At land a `codegraph.json` git ignores MUST be refused by name with the command that shows the rule; when land appended, `codegraph.json` MUST be committed alone; where the rule does not let land write, land MUST say nothing for a local artifact.
- **FR-023**: `doctor`, per writable root whose grapher writes `codegraph.json`, MUST name, reading only, the lines missing and that the next land naming the root adds them, a `codegraph.json` not committed, and one that does not parse — and no node count, which would read the vendor's database.
- **FR-024**: A grapher's artifact MUST be parsed for recorded ignore lines only where its entry records a rebuild, so a local database is never read as JSON; and a grapher's ignore file MUST count as a leftover only beside that grapher's artifact or state directory, so a human's `codegraph.json` alone is never reported.
- **FR-025**: The mount MUST be written as git records it: normalised, without a leading `./` or a trailing `/`, for codegraph's and graphify's ignore lines alike; an absolute mount or one starting with `..` MUST get no line.

#### Asked

- **FR-026**: codegraph's recorded verbs MUST be `codegraph query <symbol>`, `codegraph callers <symbol>`, `codegraph impact <symbol>` and `codegraph node <symbol>`, each run on 1.6.0, each answer naming what that verb misses: that `callers` lists 20 unless `--limit N` and counts what it lists; that `callers` and `impact` merge same-named symbols and miss aliased imports; that `impact` is a lower bound; that `node -f <file>` takes the path as the answers print it. The entry MUST record why `explore`, `context`, `files`, `affected`, `callees` and `node -f <file> --symbols-only` were left out, that `--limit 1` is never printed, and that a sentence handed to codegraph returns name matches for its words.
- **FR-027**: The header above a listed grapher's verbs MUST say these are the tool's own verbs and each line says what it answers, and MUST claim no saving over grep.
- **FR-028**: Where a brain that holds code lists siblings on its own grapher and its lines above list that grapher's verbs, the siblings' group MUST say the verbs above apply with the pointing flag appended instead of listing them again; where the lines above cite the vendor's section instead, the verbs MUST be listed as before.
- **FR-029**: codegraph's note MUST disclose by version what the agent's own codegraph calls reach — the door's verbs, and the `codegraph init` and `codegraph uninit --force` that `doctor` and the graph gate print for a human: where the platform bundle is installed they open no socket and queue one count per command and day in `~/.codegraph/telemetry-queue.jsonl`; what sends that queue, and when; what `init`, `index` and `uninit` send at once; that without the bundle the npm shim downloads it from GitHub Releases on any command whatever `DO_NOT_TRACK` or `CODEGRAPH_TELEMETRY` say, and `CODEGRAPH_NO_DOWNLOAD=1` where the agent runs turns that off. It MUST replace the sentence saying only that the entry's `env` does not reach the printed query. The door MUST carry no telemetry text.
- **FR-030**: Every copy of the retired claims — that a sentence handed to codegraph gets nothing, and that one graph call answers what grep or a search takes many, in any wording — MUST be rewritten in the documentation, both copies of the multivac skill, the concepts page and the tool's own comments and door text, and no new text MAY quote them.

#### The law, this brain, the docs

- **FR-031**: MV-149 MUST state the rule with its measurements and its ceilings, every edge case above that states a limit among them, filed proposed; each of MV-52, MV-58, MV-61, MV-74, MV-121, MV-124, MV-128, MV-134, MV-140 and MV-148 MUST carry one dated note by MV-149 withdrawing or restating every sentence this change makes false, and no other row.
- **FR-032**: In this brain no codegraph index MUST be built and no `codegraph.json` written; its door and `.claude/settings.json` MUST be byte-identical after `multivac doors`; the skill's copy under `.claude/skills/` MUST be re-projected by `doors`, never hand-edited.
- **FR-033**: Every published sentence and source comment this change makes false MUST be amended — the site's graphers reference (with new sections on a change's own codegraph index and on one post-edit hook per grapher), its hooks, commands and configuration references, the running-changes guide, the concepts page, both copies of the multivac skill and its change reference, DESIGN.md and the tool's own comments — with no law ID and no version string on a site page and no new text matching an existing `absent` leg; the changelog's Unreleased section MUST record the change.

#### Hand-offs (added before apply)

- **FR-034**: A post-edit refresh hook MUST exit 0 and refresh nothing when the edited file resolves to no git repository; it MUST never fall back to the session's working directory (MV-140: "the repository of the file you edited"). Observed on today's brain==code hook: every write outside a repo refreshed the session directory's graph. This moves the brain==code hook bytes #5 pinned; MV-148's pin is amended by note.
- **FR-035**: Every copy of the sentence this change makes false — "built in each checkout, get no refresh and no commit" (site/content/docs/reference/graphers-and-sdd.md) — MUST be gone, with an `absent` leg on MV-149 over `site/content/**`; and the codegraph door's "It answers in one call what grep takes many" (src/doors/brain.ts) retired with its `src/**` leg.

### Key Entities

- **Worktree index**: a local grapher's index in a checkout a change hands out; built or synced at apply and land, removed at close, never committed.
- **Common exclude line**: a line of the grapher's ignore list appended to the repository's common `info/exclude`, shared by every checkout of it and never committed.
- **Index pointer**: the line `change apply` prints under a checkout naming the flag that reaches its index and how fresh it is.
- **Refresh hook**: one post-edit hook per grapher, multivac's by its lock preamble and a grapher's by the artifact its toplevel test names.
- **Structural ignore line**: a line that changes what a grapher indexes — the mount, a nested declared repo.
- **Human's lists**: the four `codegraph.json` pattern lists a human may write in; any of them naming a line makes it theirs.
- **Recorded verb**: a grapher verb run on a named version, with what it answers and what it misses.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a brain that holds code on codegraph, a function added only on the branch is found by `codegraph query <name> -p <worktree>` after `change apply` (today `[i] No results found`, exit 0), and apply prints the build line and `its index: -p <worktree>`.
- **SC-002**: In a sibling whose `.codegraph/` line is uncommitted, and in one whose `.gitignore` holds only `*.db`, after apply and again after land the worktree's `git status --porcelain` is empty; the tracked `.gitignore` is byte-identical; the common `info/exclude` holds `.codegraph/`; a second apply writes nothing; and after the merge `change close` prints `web: worktree removed` with a plain removal (today the worktree is kept).
- **SC-003**: With a stub codegraph whose build waits on a read of stdin, `change apply` returns within 20 seconds with exit 0 and the index exists; the real 1.6.0 `codegraph init` with its watcher off exits 0 in under a second with stdin closed (851 ms measured; killed at 12 s with stdin open) and adds no git hook.
- **SC-004**: With no post-edit door the pointer says `as of this apply, refreshed again at \`change land\``, and after an edit and `change land` the worktree's index answers the edited symbol (machine-readable answer non-empty).
- **SC-005**: With codegraph only in the repo's `node_modules/.bin`, `change apply` prints exactly one missing-binary line naming the worktree and the fallback line, and never `-p <worktree>`.
- **SC-006**: A shared artifact is never built or refreshed in a worktree at apply (a stub log shows no graphify run there).
- **SC-007**: Where apply could not build and land does, the worktree's porcelain is empty after land and the worktree is removed at close.
- **SC-008**: On a real branch of 148 files, the index asked at the change's worktree lacks 0 of the 19 branch-only symbols the trunk index lacked and puts 0 of 192 moved symbols more than 60 lines off (24 today).
- **SC-009**: In a code-less brain with web on graphify and api on codegraph, `.claude/settings.json` holds two refresh hooks; a web edit runs only graphify in web, an api edit only codegraph in api, and a brain edit neither, taking no lock — with stubs and with the real binaries (graph-answers-where-asked's no-hook outcome flipped).
- **SC-010**: In a graphify brain that holds code with a codegraph sibling, an edit in the sibling's indexed worktree makes that index answer the edited symbol (today it does not).
- **SC-011**: A single-grapher brain's `.claude/settings.json` is byte-identical before and after `doors`, for graphify and for codegraph with its environment; graph-answers-where-asked's pinned hook commands (492, 558, 540 and 606 bytes) are unchanged.
- **SC-012**: Removing api's grapher removes exactly the codegraph hook and keeps a user's command in the shared entry.
- **SC-013**: A repo resolving codegraph and holding a graphify graph gets `doctor`'s foreign-artifact line with its removal while graphify's hook is wired, and none without it; `doctor`'s exit code is unchanged.
- **SC-014**: A consumer of a brain that holds code, mounted at `.brain`, has after `repos sync` a 38-byte `codegraph.json` and an index with 0 nodes under `.brain/` (2,254 nodes today, 7 after).
- **SC-015**: A human's `codegraph.json` with CRLF, a duplicate key and `1.50` keeps every byte, with `"/.brain/"` inserted: the output minus the inserted span equals the input in 13 of 13 shapes, parses, and a second write changes nothing.
- **SC-016**: A consumer whose committed `codegraph.json` lacks the line gets it at land in one commit on the change branch holding only that file; a second land commits nothing.
- **SC-017**: A consumer of a code-less brain, and a brain that holds code without nested repos, get no `codegraph.json`.
- **SC-018**: `mount: ./.brain` gives `/.brain/` in both `codegraph.json` and `.graphifyignore`.
- **SC-019**: A human's `codegraph.json` whose `deprioritize` names `.brain/` is left byte-identical, with a notice naming `deprioritize` (the naive append would have dropped the human's 2,247 mount nodes to 0).
- **SC-020**: A codegraph consumer's door renders codegraph's block at 982 bytes with a post-edit door and 1,001 without (449 and 468 today), byte for byte against a pinned copy; a graphify door that lists its verbs shrinks by 6 bytes; this brain's door does not change.
- **SC-021**: The retired-claims check finds 0 lines (10 lines in 6 files on the base before graph-answers-where-asked), and the check that `codegraph query <symbol>` is recorded once still passes.
- **SC-022**: The adapter test reads, in codegraph's note, its version, the queue path, the GitHub Releases download, `CODEGRAPH_NO_DOWNLOAD=1 where the agent runs`, the `uninstall` event and the six-hour flush; the superseded sentence and the site's "not measured on the network" have 0 copies.
- **SC-023**: Every new site sentence carries no law ID and no version string, and no new text anywhere matches an existing `absent` leg.
- **SC-024**: In this repository, after `multivac doors`, `AGENTS.md`'s managed block and `.claude/settings.json` are byte-identical, and no `.codegraph/` or `codegraph.json` exists.
- **SC-025**: The full suite passes; `verify` reports every claim anchored and 0 blocking; the law carries exactly 10 dated notes by MV-149; and every `absent` leg in the law still matches nothing.

## Assumptions

- The design's questions for the human are taken at its defaults: `change apply` appends `.codegraph/` to a code repo's common `info/exclude` when git would list the index (yes); the agent's own codegraph calls are disclosed by version in the entry and on the site, no harness environment is written and the door carries no telemetry text — the same call as opsx-through-its-cli's, to be made together; apply builds each worktree's index synchronously, so the printed pointer is true when printed, and copy-then-sync has no owner; a brain that holds code whose siblings resolve another grapher gets a follow hook for it too (yes); a config-only `codegraph.json` commit at land in consumers (yes); the door keeps codegraph's four verbs (+533 bytes per codegraph session).
- The completeness critic's alternatives are taken as follows: where the binary is not found from a checkout, apply prints the missing-binary line once rather than nothing (critic gap 10); the exclude step asks git of each ignore line itself, not of the database path, which codegraph's own `.gitignore` un-ignores around (gap 2); the pointing-flag clauses a leg reads are quoted strings, never template literals (gap 3).
- graph-answers-where-asked (MV-148) is closed and merged before this change is applied, and its artifacts define the names this one extends: the pointing flag, the where-block, the apply pointer, the follow hook and its wiring on PATH or in each writable code repo, the derived ignore lines, the ignore writer that returns whether it appended, land's ignore step writing the grapher's file alone, leftover discovery, the forced worktree removal. Where the design and those artifacts disagreed on a name or a string, the artifacts win (research.md R0).
- speckit-writes-once (MV-146) and opsx-through-its-cli (MV-147) are merged on the base; the design's line citations are on main at 92c4c08 and are re-anchored on the tree with graph-answers-where-asked merged when the change is applied.
- MV-149 is allocated by `change new` once graph-answers-where-asked has closed (MV-26); if another change allocates first, the ID is substituted everywhere, the notes' count leg included. `<date>` in the notes is the day the law commit is made; the row is filed proposed and only a human enacts it.
- Vendor facts are those measured on codegraph 1.6.0 and graphify 0.9.29, with git 2.43.0 and mvac 0.14.1; nothing re-measures a vendor on upgrade (MV-121). The real-vendor test runs only where codegraph is installed, which CI does not do.
- Out of scope, with owners: copying the base index into a worktree and syncing it (no owner; the human decides); a graphify graph built in a worktree at apply (dropped); reaching a codegraph installed only in `node_modules/.bin` from a worktree (dropped, a ceiling); a mutual-exclusion guard in the follow hooks (dropped); more codegraph verbs (dropped, recorded in the registry); a telemetry clause in the door or opt-outs in the harness settings (the human); a timeout on the grapher runner (dropped); the SDD scaffold's runner (no owner); the code gate's own mount spelling (no owner); a hook-visible lock marking partial answers (a ceiling); claims citing IDs (`change-file-cites`), `verify`'s root and quiet mode (`verify-rooted-and-quiet`), trimming the multivac skill beyond the sentences this change makes false (`skill-cites-references`).
