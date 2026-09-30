# Feature Specification: A run reads the checkout that holds where it was asked, and says one line when nothing is off

**Feature Branch**: `078-verify-rooted-and-quiet` | **Created**: 2026-09-29 | **Status**: Draft
**Input**: User description: "verify reads the checkout that holds where it was asked, and says one line when nothing is off. From any directory of a brain, a brain change worktree, a mount, a consumer or a monorepo subproject, `verify` judges that checkout's root and prints the root's report plus one line naming the root; a brain change worktree reads each sibling in the change's own worktree for it, else where the main checkout does; a mount is judged as the brain checkout it is; outside a governed checkout nothing is walked and no advice names another directory; `count`, `doctor`, `doors`, `roadmap` and the version notice root the same way. Where a door declares its harness's hook payload, the post-edit gate follows the edited file into its checkout and a session start is quiet; `--quiet`, or `MULTIVAC_QUIET=1`, which the git shims export, prints one line when nothing is off and the whole report otherwise. Adds MV-151, amends MV-53, MV-112, MV-127 and MV-138, and MV-150 where change-file-cites enacted its consumer-floor ceiling. Builds on graph-answers-where-asked, codegraph-worktrees-and-verbs and change-file-cites, which land first."

## User Scenarios & Testing *(mandatory)*

<!-- Stories in priority order. US1–US3 are correctness (P1): a false red that advises a destructive command, a false green, and a mount that lost every brain gate in the design's first answer. US4 closes the lookups that still fail or advise another directory. US5 (quiet) comes before US6 because a session start is quiet only through US5's line. US7 reads the notice from US1's root; US8 roots the other commands. -->

### User Story 1 - A run from any directory is the run at its checkout's root (Priority: P1)

An operator or an agent runs `verify` from wherever it stands. Today `verify` takes that
directory for the root. From any subdirectory of this brain it exits 2 with 90–106 bytes
advising `multivac init .`, and following that advice git-inits a second brain there. A
consumer's subdirectory does the same (176 and 186 bytes). A subdirectory of a repo that
carries a door gets the init hint (181 bytes) where its root is reported unverified, exit 0.
Below a stale pin the init hint replaces the pin's own text. A monorepo subproject whose
directory holds its own mount keeps its verdict (exit 1, 611 bytes) only at that directory:
its `src` exits 2. A consumer whose brain declares `mount: docs/brain` is not verified at
its root, exits 2 from `src` and, from `docs`, is scoped to the wrong directory. A brain
fixture committed inside a consumer's tree is taken for the consumer's brain.

**Why this priority**: correctness first. The advice is destructive, and a verdict must not
depend on the directory it was asked from.

**Independent Test**: run `verify --check` from six subdirectories of this brain (read-only),
then from the subdirectories of scratch consumers — a plain mount, `mount: docs/brain`, a
monorepo subproject, a brain fixture in a consumer's tree, a door with no mount and a stale
pin — and compare each with the run at its root.

**Acceptance Scenarios**:

1. **Given** this brain, **When** `verify --check` runs from `src`, `src/commands`, `.multivac`, `.multivac/hooks`, `test/verify` or `.multivac/worktrees`, **Then** it exits 0 and prints the root's report plus one line `  root      <root> (asked from <dir>)`, and with that line removed the output is byte-identical to the run at the root.
2. **Given** the run is at the root, **When** `verify` prints its report, **Then** no `root` line is added.
3. **Given** a consumer with its brain mounted at `.brain`, **When** `verify` runs from `src` or `db/migrations`, **Then** it prints the consumer root's report and exit plus the root line.
4. **Given** a consumer whose brain declares `mount: docs/brain`, **When** `verify` runs from the consumer's root, `src` or `docs`, **Then** each run is scoped to the consumer's key.
5. **Given** a monorepo subproject `services/api` holding its own mount and a broken blocking leg in `services/api/src`, **When** `verify` runs from `services/api/src`, **Then** it prints the subproject's report and exit 1, plus the root line.
6. **Given** a brain fixture under a consumer's `test/fixtures`, **When** `verify` runs from `test/fixtures`, **Then** it is scoped to the consumer, never to the fixture.
7. **Given** a repo with a door and no mount, **When** `verify` runs from its `src`, **Then** it prints the door warning naming the repo's root and exits 0; **given** a stale pin, the pin's text plus ` Run it in <host>.`, exit 2.

---

### User Story 2 - A brain change worktree is its own brain, and reads the change's siblings (Priority: P1)

`change apply` hands a brain change worktree back at `.multivac/worktrees/<slug>/brain`.
From its `src`, `verify --check --strict` exited 0 over a blocking row committed on the
worktree's branch: it judged the main checkout's law and printed `scoped to repo "brain"`.
In a brain with sibling repos the worktree's root exits 1 with 961 bytes naming every
sibling "not on disk" and advising `repos sync`, which, like `doctor`'s `git clone …
../acme-api`, clones the ecosystem into `.multivac/worktrees/`. And a fix that always reads
the main checkout's siblings instead would hide what the change wrote into its own sibling
worktree: in the default layout (`path: ../<key>`) that worktree is exactly where `../api`
points from the brain's worktree.

**Why this priority**: a false green on the change's own branch, and a detour that clones
an ecosystem into the worktrees folder.

**Independent Test**: in scratch, commit an active row with a leg that cannot match on a
brain change worktree's branch and verify from its `src`; then, in a brain with two
siblings, verify and `doctor` in its worktree, with and without the change's own sibling
worktree.

**Acceptance Scenarios**:

1. **Given** a brain change worktree whose branch adds an active blocking row that no file satisfies, **When** `verify --check --strict` runs from its `src`, **Then** it exits 1 naming that row `· blocking`, and prints no `scoped to repo`.
2. **Given** a code-less brain with two siblings on disk beside its main checkout, **When** `verify` runs in its change worktree, **Then** it reads both siblings at their channel with their fetch age, exits 0, and no line names `not on disk` or advises `repos sync`.
3. **Given** the change also has its own worktree for sibling `api`, on the change's branch, **When** `verify --check --worktree` runs in the brain's change worktree, **Then** it reads `api: working tree on <branch>` from that worktree and names a violation written there; `doctor` names `api: on <branch>`. This holds whether the sibling's path is `../<key>` or a path whose last segment is not the key.
4. **Given** a sibling missing both beside the main checkout and as the change's worktree, **When** `verify` runs in the brain's change worktree, **Then** its read line and legs say `` run `multivac repos sync` in <main checkout> ``, and `doctor` adds ` in <main checkout>` to its clone advice.
5. **Given** the slug directory `.multivac/worktrees/<slug>`, **When** `verify` runs there, **Then** it prints the main brain's report plus the root line, exit 0.
6. **Given** `doctor` runs in the brain's change worktree or its `notes` directory, **Then** it reads `repos      2/2 cloned` and exits 0, naming the root once from `notes`.

---

### User Story 3 - A mount is judged as the brain checkout it is (Priority: P1)

A consumer's mount (`acme-api/.brain`) holds a config: it is a checkout of the brain, and
a commit made in it goes to the brain's repository. Answered as its host consumer, every
brain gate disappears there: a verifier landed a real commit dropping an active row through
a mount. The mount therefore stays brain-scoped. What changes is the wording of a missing
sibling: `repos sync` typed inside a mount clones the ecosystem into the consumer, so the
run must never advise it there.

**Why this priority**: every brain gate must hold wherever the brain is checked out, and the
advice printed there must not clone an ecosystem into a consumer.

**Independent Test**: in a scratch ecosystem, stage the deletion of an active row inside a
consumer's mount and run `verify` from the mount and from its `.multivac`; then run it in a
mount whose siblings are not beside it.

**Acceptance Scenarios**:

1. **Given** a mount with a staged deletion of an active row, **When** `verify` runs from the mount or its `.multivac`, **Then** it prints `law REFUSED <id> was law and is gone · blocking` and exits 1, with the root line from `.multivac`.
2. **Given** a mount whose declared siblings are not beside it, **When** `verify` runs there, **Then** each missing sibling's read line names the host once — `not on disk beside this mount — nothing read; verify in <host> for its verdict, or from a brain checkout` — its legs say `repo not on disk beside this mount — verify from a brain checkout`, no line advises `repos sync`, and the exit is today's.
3. **Given** a mount whose config its SDD declaration refuses, **When** `verify` runs there, **Then** it exits 2 as today.

---

### User Story 4 - Ungoverned and failing lookups say where they are (Priority: P2)

Some lookups find no brain, and some fail. Below a git toplevel that no brain governs —
a dotfiles `$HOME` whose ignored `work/` holds an ecosystem — the advice would scaffold a
brain into `$HOME`. A repository git refuses for dubious ownership reads as "not a
repository": the root exits 1, and `src` gets the init hint. An inherited `GIT_DIR` makes
git answer for another repository. And from a brain's `src`, `change new`, `repos sync`
and `doors` all advised `init .`.

**Why this priority**: each is a wrong answer or advice aimed at another directory, but
none is a false verdict on a governed checkout.

**Independent Test**: run `verify` outside any repository, below a dotfiles toplevel, in a
submodule of a governed superproject, in a repository git refuses for ownership and under
an ambient `GIT_DIR`; run `change new` and `repos sync` from a brain's `src`.

**Acceptance Scenarios**:

1. **Given** a directory in no git repository, **When** `verify` runs, **Then** nothing is walked: it names a child brain it holds (`<dir> is in no git repository — nothing was verified; the brain at <child> verifies from there`), or prints today's init text byte-identical; exit 2.
2. **Given** a directory below a toplevel no brain governs, **When** `verify` runs, **Then** it prints `<dir> is inside <top>, which no brain governs — nothing was verified`, never `init`; exit 2. A directory there that holds a brain answers as that brain's consumer, as it does today.
3. **Given** the toplevel of an ungoverned repository, **When** `verify` runs, **Then** it prints today's text byte-identical.
4. **Given** a submodule of a superproject that holds a brain or a mount, **When** `verify` runs in it, **Then** it says the superproject verifies it and that nothing was verified here; **given** the superproject's stale pin is that submodule, MV-49's text with ` Run it in <superproject>.`; exit 2.
5. **Given** a consumer git refuses for dubious ownership, **When** `verify` runs at its root or in `src`, **Then** it exits 2 quoting git's line.
6. **Given** an ambient `GIT_DIR` pointing at another repository, **When** `verify` runs from this brain's `src`, **Then** it reads this brain.
7. **Given** a brain, **When** `change new zz` or `repos sync` runs from its `src`, **Then** each exits 2 naming the brain (`it is inside the brain at <brain>; run this there`) and never prints `multivac init`; at a toplevel with no brain the text is today's.

---

### User Story 5 - One line when nothing is off (Priority: P2)

A green report is 348 bytes at this brain's root, and it reached the model whole at every
session start (347 bytes delivered at one real resume) and at every agent commit through
the shims (406 bytes on an open change's branch). The harness already drops a green
post-edit gate's output (0 bytes delivered in 157 of 157 runs). A quiet run prints one line
that leads with the summary and carries the header, each plain read, the enact answer and
the change the code lands in; it prints the whole report, byte for byte, the moment
anything is off.

**Why this priority**: the saving is modest and recurring; nothing may be hidden to buy it.

**Independent Test**: run `verify --quiet` and `MULTIVAC_QUIET=1 verify` on this brain and
in scratch brains and consumers, green and in every "off" state, and compare each with the
run without quiet; commit through a fresh brain's shims.

**Acceptance Scenarios**:

1. **Given** this brain green, **When** `verify --quiet` or `MULTIVAC_QUIET=1 verify` runs at its root or in `src`, **Then** it prints one line starting `0 blocking broken · exit 0`, carrying the claim and anchor counts, the brain's read clause and `enact not answered (nothing staged)`, and no root line.
2. **Given** a code commit staged on an open change's branch, **When** the shim runs `verify`, **Then** the line ends `· enact none (law untouched) · code → <slug>`.
3. **Given** a fresh brain's shims, **When** the root commit, a law commit, a code-only commit and a commit weakening a row statement are made, **Then** only the code-only commit prints one line; the others print the whole report; a binary that predates the switch prints the whole report under the new shim, exit 0.
4. **Given** a sibling parked on a branch, never fetched here, behind its own channel, fallen back, mid-merge or not on disk, or `--worktree`, **When** the run is quiet and nothing else is off, **Then** it prints the one line and, beneath it, that read's full line.
5. **Given** pins behind the channel that do not gate, **When** the run is quiet, **Then** their `stale` lines print beneath the one line; a pin that gates prints the whole report.
6. **Given** any line that is off — a leg or count that is not `ok`, a finished change, a staged law, an enactment or refusal, any config line, law death, a mounted SDD refusal, a pending or drift summary, a code line naming no change or a skip, an unparsable open change file, an anchor naming no row, or any warning — **When** the run is quiet, **Then** the output equals the run without quiet, byte for byte, both streams in their order.
7. **Given** a consumer or a consumer's change worktree, **When** the run is quiet, **Then** the line keeps `brain at <dir>` with `(the change worktree for <slug>)` where it applies, and `enact not answered (decided in the brain)`.
8. **Given** any fixture, **When** the run is repeated with and without quiet, **Then** the exit code is the same.

---

### User Story 6 - The harness hook asks through its payload, and the gate strings never move (Priority: P2)

The claude door arms `mvac verify 2>&1 || true` at session start and `mvac verify >&2 ||
exit 2` after every edit. After an edit the gate judged the session's directory, never the
edited file's: 74 of 75 worktree edits verified the main checkout, and a violation of an
active blocking row written into a change worktree passed. The harness hands every hook the
event and the edited file's path on stdin, with `CLAUDE_PROJECT_DIR` in its environment.
Putting the switch in the command instead was measured to add 209 bytes to every red
delivery, which quotes the command, and to duplicate the gate under an older `doors`. A
hook the harness forwards starts in the user's home directory, where only the payload's
`cwd` says which checkout the session is in.

**Why this priority**: the frequent case (76 of 156 edits were in a worktree while the
session sat at the main checkout) costs nothing while green and delivers the catch when red.

**Independent Test**: pipe simulated session-start and edit payloads into the exact gate
commands with and without the marker variable, from the main checkout, a subdirectory, the
home directory and repositories no brain governs.

**Acceptance Scenarios**:

1. **Given** a session in the main checkout and an edit in a brain change worktree that breaks an active blocking leg, **When** the edit gate runs with the edit payload and `CLAUDE_PROJECT_DIR` set, **Then** it exits 2 and delivers the worktree's report with the root line naming the worktree; without the variable it exits 0 as today.
2. **Given** a session in a brain's `src` editing a file there, **When** the edit gate runs, **Then** it exits 0 and nothing is delivered.
3. **Given** an edited file outside any repository, in a repository no brain governs, or in one holding only `.multivac/cache`, **When** the edit gate runs, **Then** it verifies the session's own root, as today.
4. **Given** an edited file inside a brain nested below its repository's toplevel — a committed fixture brain — **When** the edit gate runs, **Then** it verifies the session's own root and the fixture's verdict is not delivered.
5. **Given** the session-start payload, **When** the session gate runs, **Then** it prints the one quiet line.
6. **Given** a hook started in the home directory with a payload whose `cwd` is the project, **When** either gate runs, **Then** it verifies the project, never the home directory, and gives no init advice.
7. **Given** a `[dir]` argument, or no marker variable, **When** `verify` runs, **Then** stdin is never read; an event other than the session start and the edit is ignored.
8. **Given** `.claude/settings.json`, **When** `doors` runs before and after this change, and an older `doors` runs over it, **Then** it is byte-identical, with one session gate and one edit gate.

---

### User Story 7 - The version notice reads the brain the run reads (Priority: P2)

A brain records the version it was brought to, and a binary that disagrees says so on
every run (MV-86). The notice read only the directory's own config, so from a subdirectory
and from a consumer the floor a brain declares (`requires:`) never reached the run.
change-file-cites recorded it as a ceiling of MV-150 and handed it here, to be taken if
this change resolves the root the notice must read. It does: the notice reads the brain of
the same root the command reads, because this change builds the one resolver the notice
needs and leaving it would keep a ceiling that resolver closes. In a consumer only the
floor speaks: the record's fix, `doors --adopt`, is run in the brain, and advice aimed at
another checkout is not printed.

**Why this priority**: a mixed-version team disagrees about what green means, and the floor
is the human's lever against it; it must reach every run that reads the brain.

**Independent Test**: declare `requires: ">=99.0.0"` in a scratch brain and its mount, then
run `verify` in the brain, its `.multivac`, the consumer, the consumer's `src` and a
subdirectory of a brain==code repository.

**Acceptance Scenarios**:

1. **Given** a brain and its mount declaring a floor above the binary, **When** `verify` runs in the brain, its `.multivac`, the consumer, the consumer's `src` or a brain==code subdirectory, **Then** the floor line prints exactly once in each.
2. **Given** a consumer whose mount carries no version record and no floor, **When** `verify` runs in the consumer's `src`, **Then** no notice prints there, while the brain and the mount, both brain checkouts, print the yellow one.
3. **Given** a resolution that fails, **When** the dispatcher reads the notice, **Then** it falls back to the directory's own config, and no exit code moves.

---

### User Story 8 - `count`, `doctor`, `doors` and `roadmap` root the same way (Priority: P3)

`count` reads what `verify` reads (MV-109), yet from `src` it exits 2. `doctor` from a
subdirectory says "config invalid" and exits 1, a false diagnosis. `roadmap` from a
subdirectory lists "empty" although a planned change exists. `doors` from a subdirectory
advises `init .`.

**Why this priority**: each is a wrong answer from a command that is not a gate.

**Independent Test**: run each command from a brain's `src`, a brain change worktree's
`src`, a consumer and a symlinked path to a brain's root.

**Acceptance Scenarios**:

1. **Given** a brain, **When** `count` runs from its `src` or its change worktree's `src`, **Then** it prints the read line and the per-file breakdown, exit 0.
2. **Given** a consumer or its change worktree, **When** `count 'api:<glob> /<re>/'` runs there, **Then** it reads the key as this checkout's working tree, with the sentence `verify` prints there.
3. **Given** a brain, **When** `doctor`, `doors` or `roadmap` runs from its `src`, **Then** each names the root once and answers for the brain: `doctor` exits 0, `roadmap` lists the planned change, `doors` projects the brain.
4. **Given** a symlinked path to a brain's root, **When** `verify`, `doctor`, `doors` or `roadmap` runs from it, **Then** none prints a root line.

---

### Edge Cases

- A mount its brain does not name by `mount:` is found only from the directory that holds it, and a nested mount only through `.gitmodules` (ceiling); below a consumer's toplevel its own mount is found first, so a brain fixture in its tree is never taken for its brain.
- A brain that is not its own git toplevel (a directory committed inside another repository) is found only from itself or below, and the post-edit gate never follows into it (ceiling).
- A harness whose door declares no payload keeps the session's directory and the full report after every edit; a pipe nobody closes is read for two seconds under the marker variable (ceiling).
- A hook wired by hand — husky, lefthook or the documented `mvac verify || exit 1` chain line — keeps the full report (ceiling).
- A branch cut before `doors` regenerated its shims keeps the full report; a binary older than this row prints the full report under the new shim, and its own `doors` rewrites the three tracked shims without the switch, so in a team that mixes versions the files flip until everyone is past this version; the version notice is the signal and a `requires:` floor the lever (ceiling).
- Under a harness hook the version notice reads the root of the hook process's own directory, never the followed file's or the payload's (ceiling).
- `change`, `repos`, `seed` and `init` are not rooted: in a consumer subdirectory their refusal still says `init .`; below a brain they name the brain; `repos sync` typed inside a mount still clones there (ceiling).
- A freshly cloned sibling reads "never fetched here", and a sibling that is a linked worktree always does; on a quiet run each prints beneath the line rather than folding (ceiling; fetch age is a freshness question).
- A consumer change worktree is judged by the main brain checkout's law, not by the change's own brain worktree (MV-138's ceiling, unchanged).
- `git rm .multivac/config.yml` in a brain takes MV-127's exit-0 door branch (unchanged by rooting).
- An explicit `mvac verify` stays loud; quiet is asked for.
- A git hook's stdin (pre-push's ref lines) is read only when the committer's environment carries the harness marker, and is then ignored as no payload.
- A repository whose only multivac trace is `.multivac/cache` is not governed: an edit there leaves the gate at the session's root.
- A mount inside a consumer's change worktree is its own git toplevel and is judged as the brain checkout it is.
- A directory below an ungoverned toplevel that holds a brain its `mount:` does not name — a workspace in a dotfiles repository's ignored directory — answers as that brain's consumer, as it did before: `matches no repo declared … --repo <key>`, exit 2, never `init`.
- A staged law, any config line, an unparsable open change file and an anchor on no row each print the whole report, so the quiet saving at a law commit is nothing.
- The payload's `cwd` absent or not a directory: the marker variable's value, else the process's directory, is the session's.
- A brain on a detached HEAD folds as `brain detached @ <sha> (working tree)`.
- A symlinked path to the root is the root: compared by real path, no root line.
- A missing sibling seen from a mount whose host's toplevel does not name it by `mount:` is worded as from any brain checkout.

## Requirements *(mandatory)*

### Functional Requirements

#### A run is its checkout's root

- **FR-001**: `verify` MUST resolve the root of the directory it is asked from — `[dir]` when given, which may be any directory inside a checkout, else the working directory — before it reads any config, and judge and report that root.
- **FR-002**: The checkout's git toplevel MUST be asked with the ambient `GIT_*` variables dropped from git's environment, so an inherited `GIT_DIR` never redirects it. Only git's "not a git repository" or "must be run in a work tree" MAY read as no work tree; FR-018 covers every other refusal.
- **FR-003**: The brain MUST be the first directory holding `.multivac/config.yml`, walking from the real path of the start up to and including its toplevel; with no toplevel only the start itself counts.
- **FR-004**: With no brain found, the root MUST be the first of: (1) MV-138's change-worktree path, read at the toplevel; (2) the nearest directory from the start up to, not including, the toplevel whose direct child brain names it by that brain's own `mount:` — a consumer rooted at that directory; (3) the toplevel's mount by today's rule (`.brain` outright, else a single child brain), else the one path `.gitmodules` records below the first level whose brain's `mount:` names it from the toplevel — a consumer rooted at the toplevel; (4) the start's own direct child brain, named or not — what that directory answered before; (5) MV-49's stale pin, looked for at the start and then at the toplevel — its text relative to the pin's host, plus ` Run it in <host>.` when the host is not the start, exit 2; (6) MV-127's door at the toplevel — its warning naming the toplevel, exit 0; (7) otherwise FR-014 to FR-017.
- **FR-005**: Every consumer found through a mount (FR-004 steps 2–4) MUST read its brain as a pin that can lag, as today's single mount branch does: the mounted SDD declaration is reported, not refused, and the code line takes its consumer form. `--repo`, the `--worktree` warning, a refused config's exit 2 and MV-138's undeclared-key text MUST keep their bytes.
- **FR-006**: When the root — a brain, or a consumer's checkout — is not the directory asked, compared by real path, a report printed in full MUST carry `  root      <root> (asked from <start>)` right after its header lines, `<start>` relative to the root when it lies inside it and absolute otherwise. The quiet line MUST carry none, and a run at its root adds nothing.

#### A brain change worktree

- **FR-007**: A brain change worktree holds a config, so it MUST be a brain from every directory in it; MV-138's path lookup MUST NOT be consulted for it.
- **FR-008**: Read from a brain change worktree, each declared sibling — never the brain's own entry — MUST be read in the change's own worktree for that key (`<main checkout>/.multivac/worktrees/<slug>/<key>`) when that checkout exists, else where the main checkout reads it, in the run's reads, its pin-staleness check and `doctor` alike. In the default layout (`path: ../<key>`) that is the directory the path already names from the worktree.
- **FR-009**: A sibling missing both ways, seen from a brain change worktree, MUST be named on its read line and in each leg's detail with `` run `multivac repos sync` in <main checkout> ``.
- **FR-010**: `doctor` MUST resolve siblings the same way at every site that reads one — the repos, branches, pins and untracked facts and the repo directories it searches — and its missing-repo advice MUST gain ` in <main checkout>` when read from a worktree.

#### A mount is a brain checkout

- **FR-011**: A brain found by FR-003 MUST be judged brain-scoped wherever it sits, a consumer's mount included: every brain gate — a staged law, enactment, config, law death, the code line — applies there as in any brain checkout.
- **FR-012**: Inside a mount — a brain checkout that is its own git toplevel and that its host's toplevel names by the brain's `mount:` — a missing sibling's read line MUST read `<key>: not on disk beside this mount — nothing read; verify in <host> for its verdict, or from a brain checkout`, and its legs `repo not on disk beside this mount — verify from a brain checkout`. The host MUST be named once per sibling, never per leg, and asked only when a sibling is missing; `repos sync` MUST NOT be advised there.
- **FR-013**: Exit codes inside a mount MUST be today's.

#### Ungoverned and failing lookups

- **FR-014**: Outside a work tree nothing MUST be walked. When the start holds a direct child brain the run prints `<start> is in no git repository — nothing was verified; the brain at <child> verifies from there`; otherwise today's `` no .multivac/config.yml in <start> — run `multivac init .` to create it ``, byte-identical; exit 2.
- **FR-015**: At the toplevel of an ungoverned repository that is no submodule of a governed one, the text MUST be today's, byte-identical.
- **FR-016**: Below such a toplevel the run MUST print `<start> is inside <top>, which no brain governs — nothing was verified` and MUST give no `init` advice; exit 2. A start that holds a direct child brain is answered by FR-004 step 4 first, as that brain's consumer, which is what it answered before.
- **FR-017**: When the toplevel is a submodule, its superproject asked with the ambient `GIT_*` dropped: if the superproject's stale pin is this submodule, MV-49's text MUST print relative to the superproject plus ` Run it in <superproject>.`; else, if the superproject holds a brain or a mount, `<top> is a submodule of <superproject>, which multivac verifies from there — nothing was verified here`; exit 2.
- **FR-018**: Any git refusal of the toplevel other than FR-002's MUST exit 2 quoting git's own line: `git rev-parse --show-toplevel failed in <dir>: <git's line>`, dubious ownership among them.
- **FR-019**: Any command refused because `.multivac/config.yml` is missing from the directory it was given MUST, when that directory lies below a brain in the same checkout — found by walking up without git, stopping at the first directory holding `.git` (a file or a directory), and at once when the directory itself holds one — print `no .multivac/config.yml in <dir> — it is inside the brain at <brain>; run this there`; otherwise today's text, byte for byte.

#### Quiet

- **FR-020**: A run MUST be quiet only under `--quiet`, under `MULTIVAC_QUIET=1` in the environment the command is given, or under a session-start payload (FR-029): never because of a terminal, CI, an edit event or an explicit run.
- **FR-021**: Every line the report can print MUST decide its quiet form where it is made — nothing to add, a clause of the one line, or off — and every read MUST decide a clause or "not plain"; a line or a read that does not decide MUST fail to build, and every report line MUST pass through that decision.
- **FR-022**: A plain read MUST fold into a clause with the same ref or branch, sha and age: the brain's own read, and a brain==code key's, as `<key> <branch> @ <sha> (working tree)` or `<key> detached @ <sha> (working tree)`, plain only with a commit and no drift or merge suffix; a sibling's as `<key> <channel> @ <sha> (last fetch <age> ago)`, plain only at its channel, fetched here, not parked and not mid-merge; a consumer's as `<key> <branch> @ <sha> (working tree)`. Every other read — fell back, `--worktree`, off channel, parked, never fetched here, behind its own channel, mid-merge, not on disk, no commits, the brain read at its channel — MUST print its full line beneath the one line, as MUST each `stale` pin line that does not gate.
- **FR-023**: The whole report MUST print, byte-identical to the run without quiet, when any of these occurs: a parse diagnostic; any count or leg line other than `ok`; a finished-change line, change-file-cites' refusing variant included; a gating stale pin; an enact line saying the index is unreadable, that no row reached active (a staged law), or that enacts or refuses; any config line, MV-97's "new here" included; the mounted SDD refusal; law death; the pending or drift summaries; a code line other than "lands in open change <slug>" with nothing skipped; any warning during the run; a non-zero exit or blocking count.
- **FR-024**: An open change file that does not parse, and an anchor whose ID names no row, MUST each force the whole report, as change-file-cites asked; the full report stays silent about both, as today.
- **FR-025**: The one line MUST lead with the summary, so a reader anchored at a line start finds `<n> blocking broken · exit <n>` where the full report puts it. Brain form: `` <n> blocking broken · exit 0 · <n> claims · <m> anchored (<p>%)[ · unanchored: <ids>] · read <clauses> · <enact clause>[ · code → <slug>][ · .multivac/ecosystem.json stale|absent (`multivac doors`)] ``. Consumer form: `<summary> · <m> of <n> brain claims anchor into "<key>" · brain at <dir>[ (the change worktree for <slug>)] · read <clauses> · enact not answered (decided in the brain)`. Brain enact clauses: `enact not answered (nothing staged)`, `enact not answered (no commit here yet)`, `enact none (law untouched)`.
- **FR-026**: A quiet run MUST hold both output streams — its own lines and every callee's — in the order written, and count every warning from the run's start; printing in full MUST replay them in that order, so the run under `2>&1` reads byte for byte as the run without quiet. A run that throws MUST replay what it held and then fail as it would have; the hold MUST always be released; a run without quiet MUST hold nothing.
- **FR-027**: `doors` MUST write into each git shim, after the chain block and before the runners, `export MULTIVAC_QUIET=1` under two comment lines naming no law ID, no version and neither word MV-52's shim leg forbids; every shim keeps MV-108's header identity. The documented `mvac verify || exit 1` chain line and hooks wired by hand MUST be unchanged.

#### The harness payload

- **FR-028**: A door target MAY declare its harness's hook payload: the environment variable set only in hook processes, the field naming the event, the session-start and after-edit event names, the path of the edited file and the session's directory. The claude target MUST declare `CLAUDE_PROJECT_DIR`, `hook_event_name`, `SessionStart`, `PostToolUse`, `tool_input.file_path` and `cwd`, citing beside them what was measured in Claude Code's binary and its version.
- **FR-029**: `verify` MUST read stdin only when no `[dir]` was given, some declared payload's variable is set in the environment the command is given, and the dispatcher passed a reader; the reader returns nothing on a terminal and gives up after two seconds on a pipe nobody closes. The payload is JSON: the session event makes the run quiet; the edit event with a non-empty file makes the run follow; anything else, unparsable input included, MUST be ignored.
- **FR-030**: Under a payload the session's directory MUST be the payload's `cwd` when it names an existing directory, else the marker variable's value when it names one, else the process's directory, and the run starts there. Following roots at the edited file's directory, resolved against the session's directory; the followed root MUST be taken when it is a consumer (through a mount or a change worktree), a door, or a brain that is its own git toplevel (a repository, a mount, a change worktree); otherwise — no root, or a brain nested below its toplevel — the session's own root MUST be verified. A refusal while following (a stale pin, dubious ownership) exits 2, which the harness delivers.
- **FR-031**: The session and edit gate commands, `doors`' ownership test for them and `.claude/settings.json` MUST keep their bytes: no switch rides in a gate string, and no refresh hook graph-answers-where-asked or codegraph-worktrees-and-verbs writes changes.
- **FR-032**: A command MUST read its environment and stdin only as the dispatcher passes them, and an in-process caller passes its own. No test MAY depend on `MULTIVAC_QUIET` or `CLAUDE_PROJECT_DIR` in the developer's environment: every test that spawns the CLI, or a git hook that runs it, MUST spawn it with both removed.

#### The version notice

- **FR-033**: `verify`, `count`, `doctor`, `doors` and `roadmap` MUST be rooted, and for them the dispatcher MUST read MV-86's notice from the brain of the root the directory resolves to — a brain, or a consumer's mounted or change-worktree brain — instead of the directory's own config. The read stays guarded, a failed resolution falls back to the directory, and the notice never moves an exit code.
- **FR-034**: In a consumer only the floor MUST print (a `requires:` floor, or a malformed one); the record's `doors --adopt` advice MUST NOT print there.
- **FR-035**: Under a harness hook the notice MUST read the root of the hook process's own directory, never the followed file's or the payload's (a ceiling).

#### `count`, `doctor`, `doors`, `roadmap`

- **FR-036**: `count` MUST resolve through the same root: no root prints its message, exit 2; a door prints `<top> carries a multivac door but no brain is mounted here — nothing to count against`, exit 2; a brain refuses a refused SDD declaration and a consumer reports it; in a consumer, through a mount or a change worktree, the consumer's own key MUST be read as this checkout's working tree with the sentence `verify` prints there, and every other key as before.
- **FR-037**: `doctor`, `doors` and `roadmap` MUST take the brain half of the root — a brain root gives that brain, anything else the directory asked — and, when that brain is not the directory asked compared by real path, print one line before their own: `doctor` `root      <brain> (asked from <dir>)`, `doors` and `roadmap` `root: <brain> (asked from <dir>)`.

#### The law and the words

- **FR-038**: MV-151 MUST state the rule with its measurements and its ceilings, every edge case above that states a limit marked a ceiling among them, filed `proposed`. MV-53, MV-112, MV-127 and MV-138 MUST each carry a dated note by MV-151 withdrawing only the sentence this change makes false, and MV-150 one withdrawing "and does not reach a consumer's run" when its enacted text carries that sentence. MV-127's and MV-138's legs on the retired lookups MUST move with the calls. The change file MUST declare `claims: [MV-151]` in ID form, `adds: [MV-151]` and `touches` listing exactly the noted rows.
- **FR-039**: Every published sentence and source comment this change makes false MUST be amended in the same change: the site's commands, configuration and hooks references — where a run roots; the scope table's "cwd is …" wording; the consumer section; the change-worktree paragraph; the read-line sentences; a `--quiet` section; the `verify takes …` samples; the no-config samples and the `init .` hint sentence; the `count` section; the `root` lines of `doctor`, `doors` and `roadmap`; "A green run says nothing on either event"; the shim listing, copying the three new lines exactly — DESIGN.md, both copies of the multivac skill (the read-line sentences qualified, which skill-cites-references must keep) and `verify`'s usage. The site MUST name no law ID and no version string. The changelog's Unreleased section MUST record the change.

#### Hand-offs (added before apply)

- **FR-040**: Every copy of the sentence this change makes false about hooks and verify's output — DESIGN.md (the hooks line), site/content/docs/concepts/distribution.md, site/content/docs/reference/integrations.md, and the load-model table's hooks cell "never read — they fire" in every copy — MUST say what ships (a clean run is one quiet line; anything off prints in full), with an `absent` leg on MV-151 for the retired phrasing.

### Key Entities

- **Root**: what a run asked from a directory reads — a brain; a consumer through a mount (with the directory it is rooted at) or through a change worktree (with slug and key); a door with no brain; or none, with the message that says why. A brain root knows its git toplevel.
- **Root line**: the one line a full report printed away from its root carries, naming the root and where the run was asked from.
- **Quiet form**: each report line's decision — nothing to add, a clause, or off — and each read's clause or "not plain".
- **Hook payload contract**: a door target's declaration of how its harness tells a hook what fired it — marker variable, event field, the two event names, the edited file's path, the session's directory.
- **Sibling location**: for a brain read in a change worktree, the change's own worktree for a key when it exists, else the main checkout's sibling.
- **Enclosing brain**: the brain whose checkout holds a directory, found without git, never past the first `.git`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

Figures were measured on main at 62d4588 with the design's prototypes, in scratch with `HOME` and git configuration isolated; the bytes of this brain's own report are re-measured on the tree with the three earlier changes merged (plan.md).

- **SC-001**: In this brain `verify --check` from `src`, `src/commands`, `.multivac`, `.multivac/hooks`, `test/verify` and `.multivac/worktrees` each exits 0; with the root line removed each output is `cmp`-identical to the root's (348 B), and the root line is 49, 58, 55, 61, 57 and 65 B. Today each exits 2 with 90–106 B.
- **SC-002**: In a consumer, `src` and `db/migrations` print the consumer root's report (452 B) plus the root line, exit 0; today they exit 2 with 176 and 186 B.
- **SC-003**: With `mount: docs/brain`, the consumer's root, `src` and `docs` each print `scoped to repo "api"`, exit 0 (458 B, plus the root line from `src` and `docs`); today the root prints `NOT verified` (313 B), `src` exits 2 (178 B) and `docs` exits 1 scoped to the wrong directory (883 B).
- **SC-004**: A door with no mount, from `acme-web/src`, prints MV-127's warning naming `acme-web`, exit 0; today it exits 2 (181 B).
- **SC-005**: A stale pin prints 185 B from `acme-web`, identical to today; from `acme-web/src` the same text plus ` Run it in <acme-web>.`, exit 2; today `src` gets the init hint (179 B).
- **SC-006**: A monorepo's `mono/services/api` with its own `.brain` exits 1 with 611 B naming the broken blocking leg, identical to today; `mono/services/api/src` prints the same plus the root line, exit 1; today `src` exits 2 (184 B).
- **SC-007**: With a brain fixture at `acme-api/test/fixtures/brainx`, `test/fixtures` and `test/fixtures/other` scope to `api`, exit 0; today they exit 2 (238 B "matches no repo declared", and 195 B).
- **SC-008**: With an active row `MV-999` whose `unique` leg matches nothing committed on a brain change worktree's branch, `verify --check --strict` from `<wt>/src` exits 1 printing `broken MV-999 … · blocking`; today it exits 0 printing `scoped to repo "brain"`.
- **SC-009**: In a code-less brain with `api`, `web` and `channel: origin/main`, the change worktree exits 0 with 812 B, reading both siblings at `origin/main` with their fetch age; today it exits 1 with 961 B naming both "not on disk" and advising `repos sync`.
- **SC-010**: The slug directory prints the main brain's report plus the root line, exit 0 (this brain's `.multivac/worktrees`: 348 B plus a 65 B root line); today it exits 2 (239 B).
- **SC-011**: `doctor` in that worktree prints `repos      2/2 cloned` (1,188 B), where today it prints `` 0/2 cloned · api missing → `multivac repos sync` (git clone …) `` (1,316 B); from `<wt>/notes` it exits 0 naming the root, where today it exits 1 with "config invalid" (237 B).
- **SC-012**: With `path: ../<key>` and the change's own `api` worktree on the change's branch carrying a string an active blocking `absent` leg forbids, `verify --check --worktree` from the brain's change worktree exits 1 reading `api: working tree on <branch>` and naming the leg, as today, and `doctor` reads `api: on <branch>`; with `path: ../acme-api` and key `api`, the same. A prototype that always read the main checkout's siblings exited 0 reading `api: working tree on main`.
- **SC-013**: In a mount with a staged deletion of active `INV-2`, the run prints `law REFUSED INV-2 was law and is gone · blocking` and exits 1, from `.brain` (1,555 B) and from `.brain/.multivac` (1,706 B with the root line); the same holds in a brain==code mount.
- **SC-014**: Inside a mount whose siblings are not beside it, no line contains `repos sync`, each missing sibling names the host once, and the exit is 1 as today.
- **SC-015**: The existing test of a mount whose config the SDD declaration refuses (exit 2) passes unchanged.
- **SC-016**: In a dotfiles repository `dot` whose ignored `work/` holds the ecosystem, `dot/work/notes` exits 2 with `…/dot/work/notes is inside …/dot, which no brain governs — nothing was verified`, where today it advises `multivac init .`; `dot/work` itself, which holds the brain, keeps today's answer, `` this checkout matches no repo declared in the brain at …/dot/work/acme-brain — run `multivac verify --repo <key>` ``, exit 2; neither prints `init`.
- **SC-017**: A consumer git refuses for dubious ownership exits 2 from its root and its `src` with `git rev-parse --show-toplevel failed in … fatal: detected dubious ownership …` (314 and 318 B); today the root exits 1 and `src` gets the init hint.
- **SC-018**: Inside a stale-pin mount the run exits 2 with MV-49's text plus ` Run it in <host>.` (308 B); today it advises `init .`.
- **SC-019**: In a fresh brain, `change new zz` and `repos sync` from `src/` exit 2 naming the brain and printing no `multivac init` (117 B at this brain's `src`, against today's 90 B); at a toplevel with no brain and outside any repository the texts are today's; an ambient `GIT_DIR` pointing at another repository leaves the run from `src` this brain's.
- **SC-020**: This brain with `--quiet` or `MULTIVAC_QUIET=1`, from the root or from `src`, prints one line of 195 B: `0 blocking broken · exit 0 · 148 claims · 147 anchored (99%) · unanchored: MV-148 · read brain <branch> @ 62d4588 (working tree) · enact not answered (nothing staged)` (at 62d4588; re-measured at apply on 915889f: the same 195 B, reading `151 claims · 150 anchored (99%) · unanchored: MV-151` and `@ 915889f`).
- **SC-021**: A code commit on an open change's branch prints one line of 219 B, against 406 B in full, ending `· enact none (law untouched) · code → <slug>`.
- **SC-022**: Through a fresh brain's shims the root commit prints in full (370 B, config new here), a law commit in full (364 B), a code-only commit one line (188 B; 375 B in full), a commit weakening a row in full (363 B), and the binary that predates this change the full report under the new shim (375 B), exit 0.
- **SC-023**: A code-less brain of 42 repos with two parked prints 2,303 B in 3 lines, against 4,121 B.
- **SC-024**: Two pins one commit behind `origin/main` print 476 B — the one line and the two `stale … pin 1 behind` lines — against 714 B.
- **SC-025**: Every case FR-023 and FR-024 list, run quiet, is `cmp`-identical to the run without quiet; `--quiet --repo x` in a brain prints the warning and the full report (472 B); a planned change with an unknown frontmatter key warns before and during the report and the quiet run equals the loud one under `2>&1` (654 B); the exit code is the same with and without quiet on every fixture.
- **SC-026**: A consumer change worktree's quiet line keeps `(the change worktree for demo)` and `enact not answered (decided in the brain)`.
- **SC-027**: Replaying this brain's commits from `b5cdb63` to `62d4588` and graph-answers-where-asked's branch with the switch: 10 of 22 fold to one line; of the 13 agent-made commits 6 fold and 7 print in full, each because the law is staged; the realized saving is about 1,033 B at commits plus 152 B at the one real session resume.
- **SC-028**: A session in the main checkout, with `const x = 'fetch';` appended to a worktree source file MV-01's `absent` leg reads: the exact edit gate `mvac verify >&2 || exit 2`, given the edit payload and `CLAUDE_PROJECT_DIR`, exits 2 delivering the 508 B report naming `broken MV-01 [absent] … · blocking` plus the root line naming the worktree, and the quoted command stays 25 B; today it exits 0 and delivers nothing; without the variable it exits 0.
- **SC-029**: A session in `mv/src` editing a file there exits 0 and delivers 0 B; today it exits 2 delivering 169 B of init advice (90 B at the real path).
- **SC-030**: An edited file under `/nowhere`, in an ungoverned nested repository or in a repository holding only `.multivac/cache` and `graphify-out/graph.json` verifies the session's root: exit 0, 298 B, as today, not delivered; an edit inside a committed, deliberately red fixture brain below its repository's toplevel verifies the session's root and delivers nothing of the fixture.
- **SC-031**: A code-less brain session editing its own change worktree's law exits 0, reading the siblings at the channel on the change's branch; an edit in the consumer worktree `demo/api` gives the scoped run `(the change worktree for demo)`.
- **SC-032**: A hook process started in `$HOME` with a payload whose `cwd` is the project, as a forwarded hook starts: the session gate prints the project's quiet line, and an edit in the project verifies the project; no line names `$HOME` or advises `init`.
- **SC-033**: `.claude/settings.json` is byte-identical before and after this change's `doors` in this brain and in fixtures of the earlier changes' hook shapes (one grapher, a code-less brain's follow hook, two graphers); the pre-change binary's `doors` over this change's projection, and this change's over the pre-change one, leave it byte-identical with one session gate and one edit gate.
- **SC-034**: With `requires: ">=99.0.0"` the floor line prints exactly once in each of `acme-brain`, `acme-brain/.multivac`, `acme-api`, `acme-api/src` and `mv/src`; today it prints only at `acme-brain`.
- **SC-035**: A consumer whose mount carries no version record and no floor prints no notice line in `acme-api/src`, while `acme-brain` and `acme-api/.brain` print the yellow one; the consumer run from `db/migrations` equals the root run plus the root line.
- **SC-036**: `count` of a `brain:src/**/*.ts` leg whose pattern one file holds once, run from `mv/src` and from `<wt>/src`, exits 0, printing the read line and that one match in that one file; today both exit 2.
- **SC-037**: `count 'api:db/**/*.sql /accounts/'` from `acme-api` and from its change worktree's `src` exits 0, reading `api: working tree … — this checkout`; today it prints `repo "api" is declared but not on disk` (69 B) or exits 2.
- **SC-038**: `doctor` from `b/src` in a fresh brain exits 0 and prints the root line; today it exits 1 with "config invalid" (191 B).
- **SC-039**: With one planned change, `roadmap` from `b/src` prints the root line and then `roadmap: 1 planned`; today it prints `roadmap: empty …` (110 B).
- **SC-040**: From a symlinked path to a brain's root, `verify`, `doctor`, `doors` and `roadmap` print no root line.
- **SC-041**: The full test suite passes with no switch exported and with `MULTIVAC_QUIET=1 CLAUDE_PROJECT_DIR=/x` exported, with the same counts (the design's prototype: 852 tests, 849 pass, 3 skipped without; 1 failure with the switch exported before any test was scrubbed).
- **SC-042**: `verify --strict` in the change's worktree reports every claim anchored and 0 blocking; the law carries exactly 5 dated notes by MV-151 (4 when MV-150's is not written); each MV-151 leg counts what research.md R16 lists; the retired-phrase legs count 0, down from 1, 2, 1 and 3, and the load-model leg of FR-040 0, down from 3; MV-126's and MV-84's site legs and MV-52's shim-builder leg still count 0.

## Assumptions

- The design's human questions are taken at its defaults. **Enactment is the human's**: MV-151 is filed `proposed` and enacted in its own commit, never beside the code it anchors (MV-81); the forge merge stays the human's.
- **Two harness facts need a live session.** That a green session start's stdout reaches the model, and that the edit gate follows a worktree edit, were measured from Claude Code 2.1.283's binary and a simulated payload (one real resume transcript also shows 347 B delivered). quickstart.md's last walk is for the human to confirm both in a live session; the row's quiet line and the follow depend on the payload contract the claude door declares.
- **Quiet at session start and the post-edit follow are keyed on the harness's own environment and payload** — `CLAUDE_PROJECT_DIR`, `hook_event_name`, `tool_input.file_path`, and `cwd` for the session's directory — not on a flag visible in `.claude/settings.json`. The visible alternative was measured to duplicate the gate under an older `doors` and to add 209 bytes to every red delivery; the price is a switch not visible in the command.
- **The shims export `MULTIVAC_QUIET=1` for every committer**, so a human committing in a terminal also sees one line; anything off still prints in full. Quieting only agent commits by reading `CLAUDECODE` is not proposed.
- **MV-150's note**: change-file-cites' design states MV-150's ceiling "MV-86's `requires:` floor makes the brain loud and does not reach a consumer's run", so the note withdrawing its last clause is drafted (research.md R17). The enacted row is re-read before the law commit; if the sentence is absent, the note is not written, `touches` drops MV-150 and the notes' count leg reads 4.
- **MV-86 in a consumer is taken here** (US7): change-file-cites assigned it to this change on the condition that this change resolves the root the notice must read, which it does.
- **change-file-cites' request is kept**: an unparsable open change file and an anchor on no row count as "off"; naming them in the full report is its follow-up `unparsed-change-files-are-named`, and an anchor on no row an MV-20-family change.
- **Base.** The design measured main at 62d4588. graph-answers-where-asked (MV-148), codegraph-worktrees-and-verbs (MV-149) and change-file-cites (MV-150) land first; every `file:line`, hook byte count and report byte count in these artifacts is re-anchored and re-measured on the tree with the three merged (plan.md).
- **MV-151** is the ID `change new` is expected to reserve; if it reserves another, it is substituted everywhere, the count leg on the notes included. Notes and the row are dated 2026-09-29, or the day the commit that writes them is made.
- skill-cites-references (#9) must keep the qualifier this change adds to the read-line sentences of the multivac skill.
- Out of scope, with owners: `repos sync` typed inside a mount (`repos-knows-its-mount`); rooting `change`, `repos`, `seed` and `init` (one follow-up per command); `doctor`'s other directory-bound checks in a consumer (a follow-up); naming an unparsable change file and an anchor on no row in the full report (`unparsed-change-files-are-named`, an MV-20-family change); a removed brain config taking the door branch (MV-97 family); a consumer change worktree judged by the main brain checkout (MV-138's own ceiling); fetch age read from a linked worktree (`fetch-age-reads-every-fetch`); `/tmp/mvac-*` directories left by test runs (a test-hygiene follow-up); a quiet explicit `verify` by default (not planned).
