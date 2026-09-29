# Feature Specification: The graph the agent asks is one that answers

**Feature Branch**: `075-graph-answers-where-asked` | **Created**: 2026-09-29 | **Status**: Draft
**Input**: User description: "The graph the agent asks is one that answers: a brain that holds no code keeps no code graph and says where the code repos' graphs are asked from it, a change's checkout is named with the flag that reaches its graph, the brain's refresh follows edits into the code repos and never into a checkout of the brain, and the grapher's ignore lines are the root's non-code directories, landed with the graph. Adds MV-148, amends sixteen rows."

## User Scenarios & Testing *(mandatory)*

<!-- Stories ordered by priority, then by what each needs: US3 stops the brain resolving a grapher, and the door, flow.md, the ecosystem verbs and the post-edit hook of a brain that holds no code must already be true when it does (critic gap 1), so US1 and US2 come first. -->

### User Story 1 - The agent in the brain is told where to ask, and the answers' paths are placed (Priority: P1)

An agent works from the brain checkout. Today its door tells it to ask "the" graph with the
bare verb, which asks the graph in the session's directory: the brain's. In a brain whose
code lives in other repos that graph holds no code. After its first close it held 63 nodes,
60 of them graphify's own skill, and asked where the order total is computed it answered
from the skill; web's graph, asked from the brain with
`--graph ../web/graphify-out/graph.json`, answered `computeTotal()`, byte for byte as from
inside web. In a change, `change apply` hands out worktrees and says nothing of their
graphs: this brain's trunk graph lacked 27 source symbols of a change's worktree graph, and
73 of the 185 symbols that moved sit more than 60 lines from where the same path, read from
the brain, puts them. codegraph asked with `-p` at a path holding no index answered from the
nearest index above it, with exit 0.

**Why this priority**: it is correctness — the answer comes from a graph that holds the
code, for the checkout being read, and its paths are placed. It also carries the door lines
and ecosystem verbs a brain that holds no code must have before it stops graphing itself
(US3). No byte saving is claimed against a narrowed grep: asking the graph costs 2.1 to 2.6
times as much (stated, research.md R15).

**Independent Test**: in a scratch ecosystem of a code-less brain and two code repos with
graphify 0.9.29, render the brain door and ask web's graph from the brain with the door's
form; open a change naming web, run `change apply` and ask the graph it names; in a brain
that holds code, read the added line and ask a worktree's graph with it.

**Acceptance Scenarios**:

1. **Given** a brain no repos entry declares as code and two code repos resolving graphify, **When** `doors` renders the brain door, **Then** it says the brain holds no code and keeps no code graph, names graphify with each repo's declared path, gives each verb with `--graph <checkout>/graphify-out/graph.json` and its answer, says the answers' paths are relative to the checkout the flag names, and never cites graphify's own section.
2. **Given** the same brain, **When** the agent runs the door's form `graphify query "where is the order total computed" --graph ../web/graphify-out/graph.json` from the brain checkout, **Then** it answers with `computeTotal()`.
3. **Given** code repos resolving codegraph, **When** the door lists them, **Then** each verb carries `-p <repo>`, the line says a change's worktree has no index yet and that `-p` at one answers from the nearest index above it or fails, and no codegraph verb is paired with a change's checkout.
4. **Given** a change naming web whose worktree holds its graph, **When** `change apply` prints the workspace, **Then** the line under it is `its graph: --graph <worktree>/graphify-out/graph.json`, saying the answers' paths are relative to this checkout.
5. **Given** a change naming a repo whose worktree has no graph yet, **When** `change apply` prints the workspace, **Then** it names the repo checkout's graph as the base, without the branch's edits, with paths relative to that checkout; and where neither has a graph, that there is none yet and `change land` builds and commits one.
6. **Given** a codegraph repo, **When** `change apply` prints a worktree, **Then** it names the repo's index for the base and never `-p <worktree>`; for a repo branched in place it prints `its index: -p <repo>`.
7. **Given** a brain that holds code, **When** `doors` renders its door, **Then** the two grapher lines stay byte for byte and one line is added: the law, the changes and their specs are kept out of its graph, the ecosystem graph relates them, and a change's worktree has its own graph, as of its last refresh, asked with `--graph <worktree>/graphify-out/graph.json`, which `change apply` prints.
8. **Given** a brain that holds code with sibling code repos, **When** the door is rendered, **Then** the siblings are listed in the same form as a code-less brain's, under "The other code repos keep their own graphs".
9. **Given** a code-less brain with no repo declared yet and graphify declared, **When** the door is rendered, **Then** its three `--graph .multivac/ecosystem.json` verbs stay.
10. **Given** a change's worktree whose only uncommitted paths are the grapher's outputs (a query stamp, a refreshed graph), **When** `change close` runs, **Then** the worktree is removed.
11. **Given** a consumer, **When** `doors` renders its door, **Then** it is byte-identical to before.

---

### User Story 2 - The brain's refresh follows edits into the code and never into a checkout of the brain (Priority: P1)

Today the brain's post-edit hook refreshes the graph of the edited file's repo when that repo
holds one, and otherwise runs in the session's directory — the brain — where one edit of a
brain file built a new graph after a human had removed the install. Once the brain keeps no
graph, this hook is the only refresh that follows an agent's edits, made from the brain
session, into a code repo's worktree; and an install a human kept must never be refreshed by
it.

**Why this priority**: without it, edits made from the brain session reach a code repo's
graph only at `change land` and `change close`; with today's fallthrough, a brain that holds
no code gets a graph again.

**Independent Test**: pipe four edit payloads into the brain's hook with a stub grapher, then
with real graphify: a brain file, a file in the brain's change worktree, a code repo file and
a file in that repo's change worktree.

**Acceptance Scenarios**:

1. **Given** a code-less brain whose code repos resolve graphify and a declared door with a post-edit hook, **When** an edit of a brain file or of a file in a checkout of the brain reaches the hook, **Then** nothing runs, and a graph left in the brain keeps its bytes.
2. **Given** the same hook, **When** an edit of a file in a code repo, or in that repo's change worktree, reaches it, **Then** that checkout's graph is refreshed.
3. **Given** a brain that holds code, or a consumer, **When** `doors` wires its hook, **Then** the hook's bytes are unchanged.
4. **Given** code repos resolving graphify and codegraph, **When** `doors` runs, **Then** no hook is wired and one notice says so; the door says their graphs are refreshed at `change land` and `change close`; flow.md claims no refresh after each edit; `doctor`'s refresh path says the brain's one hook runs none of them.
5. **Given** the grapher's binary reachable from one code repo only (in that repo's own `node_modules/.bin`, not on PATH), **When** `doors` runs, **Then** no hook is wired and it says why.
6. **Given** a code-less brain with the hook wired, **When** `doctor` prints the refresh path, **Then** it says the post-edit hook follows edits into the code repos' checkouts.

---

### User Story 3 - A brain that holds no code keeps no code graph, and nothing about that is silent (Priority: P1)

An operator runs a brain whose code lives in other repos. Today the brain resolves the
ecosystem's grapher for itself: `init` installed 23 graphify files, 170,619 bytes, and a
2-node graph of `CLAUDE.md`; the first close's archive commit carried 1,261 lines of a graph
that answers from graphify's own skill; codegraph built a 163,840-byte index of 0 nodes.
After a human removed that install, the next `change new` reinstalled it, `change close`
refused over it and `repos check` failed it. `init --grapher graphify` in an empty repo
exited 1 without graphify on PATH, and a repo whose source was not committed yet was taken
as holding none. The operator decided (2026-09-25) that an install already there is kept
until a human removes it, and that `doctor` only prints its removal.

**Why this priority**: the binding decision, and the largest repository and time saving for
brains that hold no code. It lands after US1 and US2, whose surfaces keep a code-less brain's
door, flow.md, ecosystem verbs and hook true once the brain resolves no grapher.

**Independent Test**: in the scratch ecosystem, run `init`, `repos sync` and a whole change,
first with the grapher stubbed and then with real graphify; then build a second brain with
today's release and walk its kept install and its removal.

**Acceptance Scenarios**:

1. **Given** a brain no repos entry declares as code, **When** `init`, `repos sync` and a change from `new` to `close` run, **Then** no grapher file is written in the brain and the archive commit names no brain graph.
2. **Given** an empty repo and graphify off PATH, **When** `init --grapher graphify` runs, **Then** it exits 0, writes no grapher file, and says graphify is declared, the brain holds no code, and each code repo gets its own graph.
3. **Given** a repo whose source is not committed yet, **When** `init --grapher graphify` runs, **Then** it declares the brain as code and builds its graph.
4. **Given** a code-less brain whose code repos resolve a grapher, **When** `doctor` runs, **Then** its grapher section says the brain holds no code, what is skipped, and how to declare it code, and never offers `graphify update .` or an install for the brain.
5. **Given** a change naming `brain` in a code-less brain, **When** `change plan` runs, **Then** the brain is labelled `(the brain)` and one line says no code graph is built, gated or landed there and how to declare it code in this change; `change land` commits no brain graph.
6. **Given** a graphify install kept from an earlier release, **When** `doctor` runs, **Then** it prints its removal — graphify's own uninstall for each platform found, gemini's first, then its files — asks the human to review `git diff`, names the emptied hook lists the uninstall leaves, and keeps its exit code; `repos check` states the leftover on the brain's line and exits 0; `change new`, `change close` and the post-edit hook neither reinstall it, refuse over it nor refresh it.
7. **Given** the same kept install, **When** `doors` or a re-run of `init` writes the brain door, **Then** both write, byte for byte, one line saying the leftover holds no code and that `doctor` prints its removal; after the human removes the install and runs `doors`, the line goes.
8. **Given** a kept codegraph index, **When** `doctor` runs, **Then** its removal is `codegraph uninit --force`.
9. **Given** a code repo keyed to the brain (`core: .`, or `core: { path: ., grapher: codegraph }`), **When** its grapher is resolved, **Then** it resolves as before.
10. **Given** a code-less brain, **When** flow.md is rendered, **Then** its gate row names only the repos a change names, the brain is not counted among the grapher's roots, and a declared grapher no writable code repo resolves gets a row saying the brain holds none.
11. **Given** this repository, **When** the change lands, **Then** the brain still resolves graphify and its door keeps both grapher lines byte for byte, with US1's line added.

---

### User Story 4 - The grapher's ignore lines keep out what is not code, reach existing repos, and land with the graph (Priority: P2)

This brain has no `.graphifyignore`: 62% of its 5,937 nodes come from `specs/`. A fresh
brain's fixed ignore lines missed `.agents/` and `.codex/` (228 of 305 nodes after one
refresh), a consumer's missed its brain mount (427 of 501 nodes), and a code repo's `specs/`
line hid its own `specs/*.spec.ts`. An ignore line appended over an existing graph made
every plain `graphify update .` exit 1, refusing to shrink, until `--force`; and an ignore
file left uncommitted never reached the worktree where `change land` refreshes: 1,460
nodes became 5,937 there.

**Why this priority**: the relevance and repository savings are large, and the rebuild is
driven by what the graph holds, so a failure heals; but it writes, at land, into other
teams' repos (Assumptions).

**Independent Test**: a fresh speckit brain that holds code with doors claude and codex; a
consumer after `repos sync`; `change land` over an installed graph whose committed ignore
file lacks derived lines, with a stub graphify that refuses to shrink without `--force`.

**Acceptance Scenarios**:

1. **Given** a fresh brain that holds code with doors claude and codex, **When** its graph is first built, **Then** no node comes from `.agents/` or `.codex/`.
2. **Given** a consumer, **When** `repos sync` builds its graph, **Then** its `.graphifyignore` carries `/.brain/` and no `/specs/`, and its own `specs/*.spec.ts` stays in its graph.
3. **Given** a root whose committed ignore file lacks derived lines, **When** `change land` names it, **Then** in the checkout holding the change's branch the lines are appended under one `# multivac:` record, the graph is rebuilt once, and both files are committed together; a second land appends nothing and forces nothing.
4. **Given** a rebuild that fails, **When** `change land` runs, **Then** the ignore file is restored and not committed, and the next land or close rebuilds.
5. **Given** a repo whose own checkout holds the ignore file untracked, **When** `change land` runs, **Then** it names the file and creates no copy.
6. **Given** `change new`, `plan`, `apply`, `repos sync`, `doors`, `doctor` or `verify` over installed roots, **When** they run, **Then** no main checkout's `git status` changes.
7. **Given** a line a human wrote for a derived directory — in any spelling, negated, or naming a path under it — **When** lines are appended, **Then** that directory's line is skipped.
8. **Given** `change land` in a checkout whose committed `.gitignore` lacks the grapher's lines, **When** it runs, **Then** it writes no `.gitignore` and leaves no modified `.gitignore` there.
9. **Given** `doctor` over an installed root, **When** it runs, **Then** it names the derived lines missing, an ignore file not committed, and a graph still holding nodes under an ignore line, and writes nothing.
10. **Given** this brain, **When** the change lands, **Then** its commit carries `.graphifyignore` and a graph holding no node under a recorded line.

---

### Edge Cases

- This repository: a brain that holds code (`brain: .`) with no other repo. No guard fires; the door gains one line; the ignore file lands once, with a one-time forced rebuild.
- A code repo keyed to the brain (`core: .`): holds code, and resolves its own or the ecosystem's grapher, as before.
- A repo holding only a README, a LICENSE or a `.gitignore` — as a hosting provider creates one — is declared code at `init`; its operator removes `brain: .` to make it code-less (a stated ceiling, not a narrowed rule).
- A directory that is not yet a repository is judged at `init` by its entries, without ignore rules; source in a repo with no entry at `.` is not graphed until `brain: .` is added (ceilings).
- No repo declared, graphify declared: the door keeps the ecosystem verbs and says no writable code repo resolves the grapher yet, listing no verb.
- Repos declared, but every one `managed: false` or `grapher: none`: the same line; a shallow or unsynced repo is named though multivac builds nothing there (ceiling).
- An unverified grapher: no group in the door; `doors` prints its declare-it-yourself notice, as before.
- Code repos resolving several graphers: no post-edit hook in the brain (ceiling; one hook per grapher is `codegraph-worktrees-and-verbs`').
- The follow hook, like a brain-that-holds-code hook before it, refreshes any checkout holding the artifact that an edit made from the brain session reaches, a `managed: false` or `grapher: none` repo's included (ceiling).
- A graph edited only through Bash is stale, and existence is never freshness (ceiling).
- An answer's paths can still be read from the wrong checkout; a graphify query worded without the identifier missed one question in three (ceilings).
- A kept install: graphify's own section and hooks keep naming the bare verb in the session's directory until a human removes it — claude's on a search and an in-project read, gemini's on every read; codex's hook is a no-op, cursor and agents have none; the removal leaves emptied hook lists in the settings files it touched (ceilings).
- A change's worktree holds no graphify graph until `change land` commits one, and no codegraph index at all; codegraph's hook follows into repo checkouts only (ceiling until `codegraph-worktrees-and-verbs`).
- A line a human deletes along with its record is appended again at the next land; a `specs/` line an earlier multivac wrote into a code repo stays, and is theirs to delete; a negation re-includes a whole directory only; a code repo whose ignore file is untracked in its own checkout lands a graph built without it (ceilings).
- Adding a door whose SDD integration writes outside every door's own directory adds a line — windsurf's `/.devin/`; the next land appends it and rebuilds only if the graph holds nodes there.
- The lines are directories: a root's own Markdown files and documentation directories stay in its graph (this brain keeps `site/`, 213 nodes, about 104 nodes of root documents and 16 of `.github/`).
- The rebuild bypasses graphify's shrink guard only where recorded lines explain the shrink.
- A grapher declared under `graphers:`, and codegraph, get no ignore lines; codegraph in a consumer of a brain that holds code indexes the mount (ceiling until `codegraph-worktrees-and-verbs`).

## Requirements *(mandatory)*

### Functional Requirements

#### Where asked

- **FR-001**: The registry MUST record, for each verified grapher, how its verbs are pointed at another checkout, as measured with the real binary: graphify's `--graph <checkout>/graphify-out/graph.json` (byte-identical answers from any directory, 0.9.29) and codegraph's `-p <checkout>` (byte-identical, 1.6.0; with no index there it answers from the nearest index above it, exit 0, or fails with exit 1 when there is none). A grapher declared under `graphers:` records none.
- **FR-002**: The graphers an agent in the brain asks MUST be: the brain's own where it holds code, and each declared code repo's not marked `managed: false`, grouped by grapher in config order; when that is empty and the ecosystem declares a grapher, that grapher with no repo. "Writable" here means not `managed: false`: a shallow or unsynced clone is still named.
- **FR-003**: In a brain that holds no code, the brain door MUST, in place of its grapher lines, open with one line saying the brain holds no code and keeps no code graph, that each code repo keeps its own, and to ask it from here with each verb's flag pointed at a repo listed — in a change, the flag `change apply` printed under that repo's checkout — and that the answers' paths are relative to the checkout the flag names. Then, per grapher asked: one line naming it, its artifact, the repos with their declared paths and its freshness (FR-014), plus, for a committed artifact, that `change land` commits it on the change branch; under it every verb the grapher records, spelled as the tool spells it, the flag appended with `<checkout>` for a committed artifact and `<repo>` for a local one, and its answer. A local index's line MUST say it is built in each checkout and never committed, that a change's worktree has none yet, and that `-p` at one answers from the nearest index above it, or fails. It MUST NOT cite the vendor's own section.
- **FR-004**: A grapher with no registry entry MUST get no line in that block, and the opening line MUST appear only when some grapher's line does. A grapher no writable code repo resolves MUST be said to be resolved by none yet, with no verb listed.
- **FR-005**: A brain that holds code MUST keep its two grapher lines byte for byte and add one line under them, saying the law, the changes and their specs are kept out of its graph and the ecosystem graph relates them, and — for a committed graph — that a change's worktree has its own, as of its last refresh, asked with `--graph <worktree>/graphify-out/graph.json`, which `change apply` prints, its answers' paths relative to that worktree; for a local index, that a change's worktree has no index yet, and the grapher asked from here or there answers from this checkout's index, without the branch's edits. Its sibling code repos resolving a grapher MUST be listed in FR-003's form under "The other code repos keep their own graphs". No surface may say the graph holds code alone.
- **FR-006**: The brain door's ecosystem-graph verbs (`--graph .multivac/ecosystem.json`) MUST appear where graphify is among the graphers asked from the brain (FR-002), the ecosystem's own declaration included. A consumer door's check MUST be unchanged.
- **FR-007**: `change apply` MUST print, under each `<key>: <workspace>` line, at most one line naming what reaches that checkout's graph, from offline probes of the workspace and, when it differs, of the repo checkout: the flag at the workspace where its graph is there (a committed graph), or where a local index is there and the repo is branched in place; else, where the repo checkout's is there, that flag, for the base without this branch's edits; else that there is none yet and what builds one; a probe that is partial or unreadable prints its reason. For a local index it MUST never name the flag at a change's worktree. It MUST print nothing where the workspace's grapher is none, unverified or records no flag, and for the brain's own main checkout. Paths MUST be absolute, single-quoted when they hold whitespace.
- **FR-008**: Every pointer that names a flag — in the door and in `change apply` — MUST say the paths in its answers are relative to the checkout that flag names.
- **FR-009**: `change close` MUST remove a change's worktree whose every uncommitted path lies under its grapher's output paths (a query stamp, a refreshed graph, the outputs a refresh leaves), forcing the removal; any other path MUST keep the worktree, as today, and the committed graph's restore stays.
- **FR-010**: The consumer door MUST be byte-identical to before.

#### Followed

- **FR-011**: In a brain that holds no code, the post-edit hook MUST run the grapher's refresh only in the checkout holding the edited file, only when that checkout holds the grapher's artifact and has no `.multivac/config.yml`, and otherwise exit 0 having run nothing; it MUST never force a rebuild. A brain that holds code and a consumer MUST keep their hooks' bytes.
- **FR-012**: That hook MUST be wired with the one grapher every writable code repo that resolves a grapher resolves (repos resolving none do not disagree), and only when its binary is on PATH or in each such repo's `node_modules/.bin` — never on the strength of a copy in the brain or in one repo alone, which the hook cannot reach after it moves into another repo; otherwise no hook is wired and `doors` says why.
- **FR-013**: Where the writable code repos resolve several graphers, no hook MUST be wired, and `doors` MUST print one notice naming them.
- **FR-014**: The door's freshness words, flow.md's refresh row, `doctor`'s refresh path and `doors`' wiring MUST give one answer: "after your edits" only for the grapher the brain's hook runs, and "at `change land` and `change close`" for every other.
- **FR-015**: `doctor`'s refresh path in a code-less brain MUST say the post-edit hook follows edits into the code repos' checkouts where it is wired, and that `change land` and `change close` alone refresh them, and why, where it is not.

#### No code, no graph

- **FR-016**: A brain MUST hold code only where a repos entry is the brain. For a brain that does not, no grapher MUST resolve at the brain root, so no build, refresh, harness install, graph gate, tracked-graph gate, land commit, `repos check` graph line, `doctor` status line, `init` binary lookup or ecosystem graph node's grapher reaches it. A code repo keyed to the brain MUST resolve as before.
- **FR-017**: `init` MUST decide whether the repo holds code once, before any write: in a git repository, whether git lists any file outside `.multivac/`, tracked or untracked and not ignored; outside one, whether any entry but `.multivac` and `.git` is there. Only a repo holding code MUST get the grapher's binary lookup, install and first build on a first run. `init --grapher <name>` in an empty repo MUST exit 0 with the binary off PATH and write no grapher file.
- **FR-018**: `init` in a code-less brain that declares a grapher MUST print one line saying it is declared, the brain holds no code, and each code repo gets its own graph. `doctor`, in a code-less brain where some grapher is asked from the brain or a leftover is found, MUST print one grapher line saying the brain holds no code, that no code graph is built, gated or refreshed there, that agents there ask the code repos' graphs, and how to declare it code — in place of today's `none @ brain` line.
- **FR-019**: `change plan` for a change naming `brain` in a code-less brain MUST label it `(the brain)`, not `(brain==code)`, and, where a grapher is declared, print one line saying no code graph is built, gated or landed there and how to declare it code in this change; `change land` MUST commit no brain graph there.
- **FR-020**: A kept install MUST be discovered offline in a code-less brain, for every known grapher and every grapher under `graphers:`, by reading each one's artifact, state directory, ignore file and every harness platform's probe, declared door or not; no config key MUST choose among them.
- **FR-021**: `doctor` MUST print one line per grapher found: for graphify, the grapher's own uninstall for each platform found — gemini's first, then registry order — then removing its graph, ignore file and output directory; the line MUST ask the human to review `git diff` (the uninstall drops the whole hook group it wrote, commands a human added to it included) and name the emptied hook lists it leaves, then `multivac doors`; for codegraph, `codegraph uninit --force`; for a grapher under `graphers:`, removing its artifact. `doctor` MUST never offer the brain a refresh or an install, and its exit code MUST be unchanged.
- **FR-022**: The brain door MUST carry, while a leftover is found, one line saying it holds no code, that the vendor's section and hooks point at it, to ask the code repos' graphs instead, and that `doctor` prints its removal. `init` and `doors` MUST write that door byte for byte alike; the line goes once the install is removed and `doors` runs.
- **FR-023**: `repos check` MUST never fail a code-less brain over a graph, and MUST state a leftover as a fact on the brain's line.
- **FR-024**: The paths of every known grapher, and of every grapher under `graphers:`, MUST be not code in every repo, whichever grapher resolves there, so removing a kept install is free.
- **FR-025**: flow.md MUST count the brain among a grapher's roots only where it holds code, name the brain in the graph gate's row only there, and give a declared grapher no writable code repo resolves a row saying the brain holds no code, so none is built there, and that each code repo resolving it gets its own.

#### Kept out

- **FR-026**: A root's ignore lines MUST be derived, never listed: each top-level directory of the root's non-code set, written `/<dir>/`, except every known grapher's own output directory; in a code repo, the mount; and every declared repo whose path lies inside the root, relative. The fixed list MUST go. A grapher with no ignore file MUST get none. SDD step-artifact directories come in only where the non-code set holds them — the brain; `.specify/` and `openspec/` are vendor state in every root.
- **FR-027**: Lines MUST be appended under one record line, `# multivac: kept out of the graph — <lines>`, and a directory's line MUST be skipped when the file already holds `x/`, `/x/`, `x` or `/x`, negated or not, when a record line lists it, or when any line names a path under it. The printed `(+N)` counts ignore lines, never the record. The writer MUST report whether it appended.
- **FR-028**: The lines MUST be written before a root's first build (both files, as today) and at `change land`, in the checkout holding the change's branch, before its refresh — the grapher's ignore file alone, never `.gitignore` — and only when that ignore file is committed at that checkout's HEAD, or absent both there and in the repo's own checkout; otherwise land MUST name the file and write nothing. When land appended, it MUST stage the ignore file with the artifact; when the rebuilt graph still holds a node under a recorded line, it MUST restore the file (checkout when tracked, delete when multivac created it) and warn instead. equip over a built root, `repos sync`, `doors`, `doctor` and `verify` MUST never write them.
- **FR-029**: While a root's graph holds a node under a directory a record line lists and no negation re-includes, the refresh at land and close MUST run the grapher's recorded rebuild (`graphify update . --force`) instead of its refresh, with the same environment, lock and failure quoting; so a failed or interrupted rebuild is retried at the next land or close. The post-edit hook MUST never force.
- **FR-030**: `doctor`, per installed, writable root whose grapher is verified and has an ignore file and a committed artifact, MUST append to its grapher line, reading only: the derived lines missing and not skipped, and that the next land naming the root appends them and rebuilds only if the graph holds nodes under them; an ignore file not committed; the nodes the graph still holds under the file's directory lines, with the rebuild to run there.
- **FR-031**: codegraph MUST get no ignore lines in this change; its registry entry MUST state what was measured (1.6.0 indexes no Markdown, honours `.gitignore` through git, applies `codegraph.json`'s `exclude` on `sync`) in place of "no ignore file was verified", and record `codegraph uninit --force` as its removal.

#### The law, this brain, the docs

- **FR-032**: MV-148 MUST state the rule with its measurements and its ceilings, every edge case above that states a limit marked a ceiling among them, filed proposed; each of MV-25, MV-50, MV-52, MV-90, MV-103, MV-122, MV-124, MV-128, MV-129, MV-131, MV-132, MV-134, MV-137, MV-139, MV-140 and MV-143 MUST carry one dated note by MV-148 withdrawing every sentence this change makes false, and no other row.
- **FR-033**: This brain MUST carry, committed on the change branch, a `.graphifyignore` holding the record and the derived lines, and the graph rebuilt under it; its door, flow.md and ecosystem graph MUST be re-rendered by `multivac doors`, never hand-edited.
- **FR-034**: Every published sentence and source comment this change makes false MUST be amended — the site's graphers reference (with new sections on a brain that holds no code and on where to ask the graph), its commands and configuration references, the running-changes and getting-started guides, the composition concept, the README, both copies of the multivac skill and its change reference, DESIGN.md and the tool's own comments — with no law ID on a site page and no new text matching an existing `absent` leg; the changelog's Unreleased section MUST record the change.

### Key Entities

- **A brain that holds code**: a brain one of whose repos entries is the brain itself; only it resolves a grapher at the brain root.
- **The graphers asked from the brain**: per grapher, the writable code repos resolving it, or the ecosystem's declaration alone.
- **Pointer flag**: per verified grapher, how its verbs are aimed at another checkout, with `{checkout}` in it.
- **Pointer line**: what `change apply` prints under a workspace: the flag reaching that checkout's graph, the base's, or none.
- **Follow hook**: a code-less brain's post-edit hook, which runs only in a code repo's checkout holding the artifact.
- **Kept install**: grapher files in a code-less brain from an earlier release; reported with its removal, never removed.
- **Derived ignore lines**: a root's non-code top-level directories, anchored, with the mount and nested repos.
- **Ignore record**: the `# multivac:` line listing what multivac appended, which keeps a human's deletions and drives the rebuild.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From a code-less brain, the door's form `graphify query "where is the order total computed" --graph ../web/graphify-out/graph.json` answers with `computeTotal()`, and the bare query from the brain exits 1 (`graph file not found`) and creates nothing.
- **SC-002**: The code-less door's graph block for two graphify repos is at most 1,000 bytes (954 measured with a post-edit door), cites no `## graphify` section, and no codegraph verb in any door is paired with `<checkout>`.
- **SC-003**: On a first change to a freshly equipped repo, `change apply` prints the base line, and the printed `--graph <repo>/graphify-out/graph.json` answers from the brain checkout; no codegraph worktree is ever given `-p <worktree>`.
- **SC-004**: In a brain that holds code, the added line names the worktree form, and `graphify explain "sddGoverning()" --graph <worktree graph>` resolves where the trunk graph says `No node matching`.
- **SC-005**: A worktree whose only changes are `?? graphify-out/cache/` and ` M graphify-out/graph.json` is removed at close (today `git worktree remove` exits 128).
- **SC-006**: A code-less brain with no repo and `--grapher graphify` keeps the three `--graph .multivac/ecosystem.json` verbs in its door (3 today, 0 with the resolver change alone).
- **SC-007**: The consumer door is byte-identical to a pinned copy, and every printed pointer that names a flag carries "paths in its answers are relative to".
- **SC-008**: Of four edit payloads, a brain file and a brain-worktree file leave a kept graph's md5 unchanged, and a code repo file and a code repo worktree file refresh that checkout's graph — with a stub grapher and with graphify 0.9.29.
- **SC-009**: A brain-that-holds-code hook and a consumer hook are byte-identical before and after (492 bytes for graphify, 558 for codegraph); the follow hook is 540 and 606.
- **SC-010**: With web on graphify and api on codegraph, the brain wires no refresh hook, the door says `refreshed at \`change land\` and \`change close\``, flow.md says "after each edit" of neither, and `doctor` says the brain's hook runs none.
- **SC-011**: With the binary in one of two graphify repos' `node_modules/.bin` and not on PATH, `doors` wires no hook and prints why.
- **SC-012**: `init` → `repos sync` → a whole change in a code-less brain leaves 0 grapher files in the brain (23 files, 170,619 bytes today) and an archive commit naming no `graphify-out/graph.json`.
- **SC-013**: After a human's committed removal, `change new` reinstalls nothing, `change close` does not refuse over the brain, `repos check` exits 0, and `doctor` prints the brain's fact line and no `graphify update .` or `graphify install` for the brain.
- **SC-014**: `init` in a repo with an untracked `src/server.ts` writes `brain: .` and builds a graph that answers `computeTotal`.
- **SC-015**: `init --grapher graphify` in an empty repo with graphify off PATH exits 0 (1 today), and `graphify-out/`, `.graphifyignore`, graphify's skill and section are absent.
- **SC-016**: A kept graph keeps its md5 across `change new`, a brain-file post-edit payload, `change land` and `change close`.
- **SC-017**: With doors `[agents, codex, gemini]`, the printed removal starts with `--platform gemini`; with `[agents, claude]`, running it leaves 23 deletions and 2 modifications, `CLAUDE.md` still a link, and an emptied `PreToolUse` list the line named.
- **SC-018**: With a kept install, a re-run of `init` and `doors` write the same door, byte for byte.
- **SC-019**: In this repository the brain still resolves graphify, and the door's managed block keeps its two grapher lines byte for byte with exactly one line added.
- **SC-020**: A fresh speckit brain that holds code, with doors claude and codex, has no node from `.agents/` or `.codex/` after its first refresh (305 → 77 nodes measured; non-code nodes shown on code questions 57 of 254 → 0 of 265).
- **SC-021**: After `repos sync`, a consumer's `.graphifyignore` carries `/.brain/` and no `/specs/`, and its `specs/*.spec.ts` is in its graph.
- **SC-022**: A land over an installed graph missing a derived line makes one append, one rebuild and one commit carrying both files; a second land appends and forces nothing; a rebuild that fails once leaves the file restored, and the next land rebuilds.
- **SC-023**: `git status` in every main checkout is unchanged by `change new`, `plan`, `apply`, `repos sync`, `doors`, `doctor` and `verify` over installed roots, and after `change land` the branch checkout holds no modified `.gitignore`.
- **SC-024**: This brain's land commit carries `.graphifyignore` (the record and 12 lines, as derived on main at 92c4c08) and a graph with no node under a recorded line (1,460 nodes and 1,815,100 bytes measured on a clone of main, down from 5,937 and 5,854,764).
- **SC-025**: The full suite passes; `verify` reports every claim anchored and 0 blocking; the law carries exactly 16 dated notes by MV-148; and every `absent` leg in the law still matches nothing.

## Assumptions

- The binding decision of 2026-09-25 holds: an install already in a code-less brain is kept until a human removes it, and `doors` and `doctor` run no vendor, so `doctor` only prints the removal.
- The design's questions for the human are taken at its defaults: the land-time retrofit in code repos is yes, so the first land naming a repo whose committed ignore file lacks derived lines appends them, rebuilds with `--force` there and commits both; the kept-install door line is kept (about +800 bytes per session until the removal); the per-grapher hooks for code repos resolving several graphers, the codegraph exclude of a mounted brain that holds code, and the telemetry disclosure of the codegraph query a door prints belong to `codegraph-worktrees-and-verbs` (the next change, which extends this one's pointer flag, door block, apply pointer, follow hook, derived lines, ignore writer, leftover discovery and forced worktree removal under the same names); a change → spec-directory edge in the ecosystem graph is out of scope, with no owner; this brain's one-time graph diff (5,937 → about 1,460 nodes) is reviewed within this change.
- `init`'s test stays "any file git lists outside `.multivac/`": a brain created on a hosting provider with a README, LICENSE and `.gitignore` committed is code and keeps today's behaviour, so the savings for a new code-less brain reach only brains initialised empty; the rule is stated, not narrowed (critic gap 6).
- `change land` writes the grapher's ignore file alone; the `.gitignore` lines stay first-build-only, and the worktree's untracked outputs are what `change close`'s forced removal takes (critic gap 5).
- The derived lines leave out every known grapher's own output directory, so a graphify root gains no `/.codegraph/` and the counts stay those measured (critic gap 2); the lines' dependence on a door whose SDD integration writes outside every door's directory is stated, and the code gate's non-code set is not widened for it (critic gap 9).
- The follow hook's reach into a `managed: false` or `grapher: none` repo holding the artifact is stated as a ceiling, as it already is for a brain that holds code; MV-125 is not amended (research.md R20).
- MV-148 was reserved for this change by `change new` (MV-26; 49591e7), and `change.invariants` declares exactly the sixteen rows it touches (e5d034f); `<date>` in the notes is the day the law commit is made; the row is filed proposed and only a human enacts it.
- `speckit-writes-once` (MV-146) and `opsx-through-its-cli` (MV-147) are closed on the base this change is applied to; the design's line citations are on main at 92c4c08 and are re-anchored when the change is applied.
- Vendor facts are those measured on graphify 0.9.29 and codegraph 1.6.0, with mvac 0.14.1; nothing re-measures a vendor on upgrade (MV-121).
- Out of scope, with owners: a codegraph index per change worktree, codegraph's verbs and its ignore file (`codegraph-worktrees-and-verbs`); claims citing IDs (`change-file-cites`); `verify`'s root and quiet mode (`verify-rooted-and-quiet`); trimming the multivac skill beyond the sentences this change makes false (`skill-cites-references`); the vendor's own hook nudges and section (the vendor, a ceiling).
