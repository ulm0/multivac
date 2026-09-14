# Research: Managed repos

Sources: the change file's measurements; the requirements study 2026-09-14
(§2.5 item 44, §6 row 5, D6) and audit N22; this repo at `22c9fa8`, whose line
numbers are cited below. Git facts were measured on git 2.55.0, HOME isolated,
in a scratch directory.

## R1: One place decides scope

- **Decision**: `readOnly(cfg, root, dir)` in `src/adapters/detect.ts`, beside
  `adapterFor` (:55), returns `'not managed' | 'shallow' | null`:
  - `null` for `brain`, an undeclared key or an `isBrain` entry, with no spawn;
  - `'not managed'` when the entry says `managed: false`, with no spawn;
  - `'shallow'` when `dir` exists and `isShallow(dir)` is true;
  - `null` otherwise.
- `isShallow(repo)` is new in `src/lib/git.ts`, next to `inHead` (:327). It runs
  `run(repo, ['rev-parse', '--is-shallow-repository'])` and treats an error as
  false. `run` drops the ambient git environment (:29-33, MV-106).
- `SddRoot` (detect.ts:20-30) and `GraphScope` (refresh.ts:149-153) gain
  `readOnly?`. `sddRoots` (:94-102) and `graphScopes` (:162-170) set it on each
  sibling. Every consumer reads that field, and doors, repos, doctor's repos
  line, change and sddGate's absent roots call `readOnly` directly.
- **Alternatives**:
  - Drop read-only roots inside the two enumerations. Rejected: `doctor`
    reports from the same lists (doctor.ts:197, :285), and a second enumeration
    for the report is the drift those comments exist to prevent.
  - A new `src/lib/scope.ts`. Rejected: one more file for one function that
    sits naturally beside `adapterFor`.
  - Memoise per process. Rejected: an in-process test that unshallows a clone
    would read the stale answer (US2 AS3).
- **Cost**: 4.2 ms per call (50 calls, measured). `change close` enumerates
  roots 7 times, so about 30 ms per present sibling. A brain-only config
  spawns nothing new.
- **Headers**: detect.ts:1-4 ("Pure checks, no subprocess") names the one git
  read. refresh.ts:1-3 keeps "never spawns git" (MV-50 leg) and says the
  scope read happens in git.ts and cannot stage.

## R2: The shallow question

- **Measured**:

  | Clone | `--is-shallow-repository` |
  | --- | --- |
  | `git clone --depth 1 file://…` | `true` |
  | `git clone --depth 1 <local path>` (warns `--depth is ignored in local clones`) | `false` |
  | full clone | `false` |
  | `mkdir full/nested` | `false` (the parent's answer) |
  | not a repository | exit 128, `fatal: not a git repository` |
  | full clone with `GIT_DIR` pointing at the shallow one | `true` |
  | after `fetch --unshallow` | `false` |

- **Therefore**: the environment must be dropped (row 6), an error means in
  scope, and test fixtures clone from `file://`. The nested-directory answer is
  a ceiling.
- **Alternatives**:
  - Read `<gitdir>/shallow`. Rejected: that is git's private format, and D6
    names the command.
  - Record `--shallow` in config at sync. Rejected as out of scope: unshallowing
    would need an edit, where git already keeps the fact.

## R3: The key

- `refuseUnknown` (config.ts:227) gains `'managed'`. `o.managed ?? true` is
  checked the way `sdd_auto` is (:345-348) and fails with
  `"repos.<key>.managed" must be true or false`. The shape hint (:222) names
  `managed?`.
- The entry carries `managed: false` only when the key is false. Leaving it off
  otherwise keeps scaffold.test.ts:39's `deepEqual` and every entry's shape
  unchanged (FR-010).
- In the repos loop (:395-409), after `isBrain` is set,
  `isBrain && entry.managed === false` fails with `repos.<key>.managed: false —
  <key> is the brain, and the brain is always managed`, under any key.
- `types.ts` `RepoEntry` (:42) gains `managed?: boolean`, with MV-125 in its doc.

## R4: The surfaces

| Surface | Where | After |
| --- | --- | --- |
| scaffold | sdd.ts:240 | `root.readOnly` → `continue`, silent |
| SDD gate | sdd.ts:325-333, :378-386 | read-only roots are neither searched nor in `where`. An adapter whose declared roots are all read-only prints `sdd <name>: \`change <gate> <slug>\` is not gated — every root that resolves <name> is read-only: api (not managed)`. The uncloned refusal names only managed roots |
| project document | sdd.ts:560-563 | follows `roots`, already filtered |
| build | refresh.ts:189 | `continue` |
| graph gate | refresh.ts:261-266 | `continue` |
| tracked gate | tracked.ts:57-59 | `continue` |
| close refresh | change.ts:1103-1105 | `if (s.name && !s.readOnly)`. MV-50's leg on the call stays |
| doors | doors.ts:318-336 | after the brain check, `<key>: <why>, read-only — nothing projected (MV-125)`, then `continue` |
| doctor | doctor.ts:63-64, :204-208, :257-262, :289-295, :349-370 | `outOfScope` takes a name and a reason, so `out of scope, not a gap` stays unique (MV-87). No project-law, NOT COMMITTED or IGNORED line. The repos line notes `<key>: <why>, read-only` |
| repos | repos.ts:35-39, :84, :112 | the list appends `— <why>, read-only`. After a clone, the line asks `readOnly` and appends `— read-only: multivac will not write there`. The usage says the same. The fetch line is unchanged (MV-54) |

- The graph gate has no adapter-level refusal, so its read-only roots are
  simply skipped, with no line (FR-005).

## R5: plan and apply refuse a named read-only repo

- **Decision**: add `refuseReadOnly(brain, cfg, slug, keys)` in change.ts. It
  asks `readOnly` for each key and warns one line per repo:
  - not managed: `drop it from <change>, or remove \`managed: false\` through a change (MV-97)`;
  - shallow: `drop it from <change>, or \`git -C <path> fetch --unshallow\``.
- It returns false if any repo was named. `cmdPlan` calls it after the
  empty-keys check (:658) and before the clone loop. `cmdApply` calls it after
  `entries` resolve (:736) and before the status bump (:744). Both then return 1.
- **Alternative**: refuse before `gateSdd`. Rejected: the change file would
  have to load before the SDD gate, which reorders refusals for every change.
  The scaffold and build that gate runs already skip read-only roots, so
  nothing is cloned, bumped, branched or committed first.

## R6: Law notes (FR-013)

Each note is appended in the row's cell as
`**Amended 2026-09-14 by MV-125**: …`:

- **MV-50**: the close refresh skips a read-only repo.
- **MV-56**: the repos a refusal looked in exclude read-only ones.
- **MV-87**: a read-only root is out of scope for the scaffold, the build, the
  project-document gate and the report's install state, and it is reported as
  read-only.
- **MV-90**: "every declared, present root" excludes read-only roots.
- **MV-103**: the tracked gate never judges a read-only root.
- **MV-122**: an adapter whose declared roots are all read-only is not gated
  and says so. The uncloned refusal applies to its managed roots.

## R7: Legs

A dry run at `22c9fa8` finds 0 for each, except leg 10, which finds 19 matches
in 13 files today:

1. `src/adapters/detect.ts /export async function readOnly\(/ unique`
2. `src/lib/config.ts /'channel', 'grapher', 'managed', 'path', 'role', 'sdd', 'url'/ unique`
3. `src/lib/config.ts /the brain is always managed/ unique`
4. `src/lib/git.ts /'rev-parse', '--is-shallow-repository'/ unique`
5. `src/** !src/lib/git.ts /'--is-shallow-repository'/ absent`
6. `src/** !src/lib/config.ts !src/lib/git.ts !src/adapters/detect.ts /\.managed([^[:alnum:]_]|$)|isShallow/ absent`
7. `src/{adapters/sdd,adapters/refresh,adapters/tracked,commands/doctor,commands/doors,commands/repos,commands/change}.ts /readOnly/ each`
8. `src/commands/doors.ts /read-only — nothing projected/ unique`
9. `src/commands/change.ts /await refuseReadOnly\(/ count=2`
10. `{*.md,src/**,test/**,site/content/**,skills/**,.claude/skills/**} !CHANGELOG.md !.claude/skills/speckit-*/** /every declared,? present (repo|root|scope)|declared\+present repo|every declared repo (that is )?present on disk|for a repo you will read but never land in/i absent`
11. `src/commands/repos.ts /multivac will not write there/ count=2`
12. `site/content/docs/reference/configuration.md /^### `repos\.<key>\.managed`$/ unique`
13. `.multivac/invariants.md /Amended 2026-09-14 by MV-125/ count=6`
14. `src/{adapters/refresh,adapters/sdd,adapters/tracked,commands/change}.ts /(s|root)\.readOnly\) continue;|s\.name && !s\.readOnly\)/ count=5` — leg 7 is per file, so a skip dropped from a file that still spells `readOnly` elsewhere passes it; this counts the skips themselves

MV-31's heading leg (`count=11`) does not match the new heading, so it holds.

Spelling rules that follow from the legs:
- Outside config.ts, git.ts and detect.ts, a message or comment writes
  `managed: false`, never `.managed` (leg 6).
- No test title or doc spells a leg 10 phrase.

## R8: The row (≤ ~400 words, trimmed at T003)

**A repo multivac does not own is read, never written: a declared repo whose
entry says `managed: false`, or whose clone git reports shallow, is out of
scope for every write and every gate that would demand a file there, and is
reported, not failed.**

- **Measured**: the change file's five findings.
- **The rule**:
  - `readOnly` is the one answer, and the shallow question is asked through
    git.ts with the environment dropped.
  - The brain is never read-only.
  - The R4 surfaces behave as listed there.
  - R5's refusal applies.
  - A config with neither behaves as before.
- **Mechanical**: R7.
- **Ceilings**:
  - A full clone someone else owns is in scope until its entry says otherwise.
  - A nested directory gets its parent's answer.
  - Git before 2.15 reads not shallow (read, not measured).
  - flow.md, the doors' ecosystem lists and the printed steps still name a
    read-only repo from declarations. FR-010 forbids changing flow.md's bytes.
  - Doors and hooks projected before a repo became read-only stay.
  - Worktrees `apply` made before a repo became read-only are removed at close.
  - `doctor`'s untracked line still reads such a repo.
  - About 4 ms per sibling per enumeration.
  - The legs see spellings, one line at a time: a copy wrapped across lines,
    or a new surface that walks the roots without asking, passes them.
