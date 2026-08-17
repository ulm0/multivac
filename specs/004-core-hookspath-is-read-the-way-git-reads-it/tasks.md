# Tasks: core.hooksPath is read the way git reads it

**Input**: [plan.md](plan.md), [spec.md](spec.md)
**Branch**: `core-hookspath-is-read-the-way-git-reads-it`

Phases run in order. Within a phase, `[P]` marks tasks that touch different
files and can run in parallel.

## Phase 1: The law moves first (Principle III)

- [X] **T001** In `.multivac/invariants.md`, state MV-79: `core.hooksPath` is
  read the way git reads it — absolute names that directory, relative resolves
  against the worktree root, either spelling of this repo's own `.multivac/hooks`
  is recognised as multivac's, and one resolution serves `init` and `doctor`.
  Leave authority `open` / state `proposed`: a human enacts. (FR-001, FR-003,
  FR-004, FR-008)
- [X] **T002** In the same file, amend MV-37 in place: drop the half that is
  false for an absolute spelling, say the shim installs into the directory the
  hooksPath resolves to per MV-79, and say `doctor` reports from that same
  directory. Move the date to 2026-08-16 and repoint the source column at this
  change. Its six existing legs stay — re-check each one resolves after Phase 3.
  (FR-008)

Depends on: nothing. Blocks: Phase 4 (the legs T001 writes name files Phase 2
and Phase 3 create).

## Phase 2: Failing tests first (US1, US2, US3)

Every test here must fail against the current code, and each one is named so a
mutation proof can cite it.

- [X] **T003** In `test/init/coexist.test.ts`, add `an absolute foreign
  core.hooksPath: the shims land where git looks, not in a tree built by
  concatenation`. A repo whose `core.hooksPath` is a full path to a directory
  *outside* it: `installHooks` reports `alongside` with that directory, both
  shims exist and are executable there, `join(repo, abs)` does not exist, the
  configured value is untouched, and running the pre-commit shim with a stub
  `mvac` on PATH prints `mvac verify`. (US1, FR-001, FR-002, FR-005)
- [X] **T004** In the same file, add `an absolute foreign hooksPath reports and
  refuses exactly as a relative one does` — the taken-name refusal (`refused`
  carries the absolute path and the manual line, the file is byte-untouched), the
  already-wired case (no refusal, no rewrite), and `doctor` naming the same state
  with the same fix. (US2 scenario 3, FR-007)
- [X] **T005** In the same file, add `our own hooks dir spelled absolutely is
  ours, not a foreign gate` — `core.hooksPath` set to the absolute path of the
  repo's own `.multivac/hooks`: strategy is `fresh`, the shims are in
  `.multivac/hooks`, and the value is normalised to the relative spelling. Then
  the coexistence shapes under that same absolute spelling: a pre-existing
  `.git/hooks/pre-commit` makes it `chained` and its exit code still wins, and a
  `.pre-commit-config.yaml` with the binary present still reports the
  `pre-commit run` fallback. (US3, FR-004, FR-007)
- [X] **T006** In the same file, add `doctor reads the resolved directory: a
  worktree's inherited absolute hooksPath is not a missing shim` — shims present
  in an absolute foreign directory report as running multivac, `--strict` passes
  when a runner exists, and removing one shim from that directory puts
  `--strict` back to 1. (US2 scenarios 1 and 2, FR-003, FR-006)

Depends on: nothing. Blocks: Phase 3.

## Phase 3: The fix (US1, US2, US3)

- [X] **T007** In `src/hooks/install.ts`, add and export `resolveHooksPath(repo,
  configured)` returning `{ dir, own }`: `dir` is `resolve(repo, configured)` —
  git's rule, absolute as-is, relative against the worktree root — and `own` is
  `dir === resolve(repo, HOOKS_DIR)`. Document why `join` was wrong, so the next
  reader does not put it back. (FR-001, FR-003, FR-004)
- [X] **T008** In the same file, make `installAlongside` write into
  `resolveHooksPath(repo, dir).dir`: the `mkdir` and both per-hook paths. Leave
  the reported `dir` and every message as the configured spelling. (FR-002,
  FR-005)
- [X] **T009** In the same file, replace `hooksPath !== HOOKS_DIR` in
  `installHooks` with the resolved `own` test, and update the strategy comment
  block at the top of the file so it describes what the code does. (FR-004,
  FR-007)
- [X] **T010** In `src/commands/doctor.ts`, read both shims in `alongsideParts`
  from `resolveHooksPath(brain, dir).dir`, and in `hooksLine` decide both the
  foreign branch and the `armed` verdict on the resolved `own` instead of on
  string equality with `HOOKS_DIR`. (FR-003, FR-006)

Depends on: Phase 2. Blocks: Phase 4.

## Phase 4: Prose that could have caught it

- [X] **T011 [P]** In `DESIGN.md`, state the resolution rule where the three
  strategies are explained — one sentence, carrying the phrase MV-79's leg pins.
  (FR-008)
- [X] **T012 [P]** In `site/content/docs/reference/hooks.md`, state the same rule
  on the published "a repo that already has hooks" section, so the page a user
  reads says where the shim lands for an absolute setting. (FR-008)

Depends on: Phase 3.

## Phase 5: Proof

- [X] **T013** `pnpm run build && pnpm test` green.
- [X] **T014** Mutation-verify every behaviour claimed: for each of the four
  reverts (the `resolve` in `installAlongside`, the `own` test in `installHooks`,
  the resolved read in `alongsideParts`, the resolved `armed` in `hooksLine`),
  revert in the TypeScript source, rebuild, confirm the named test fails, restore,
  confirm it passes. The suite loads `dist-test/`, so a mutation in `dist/` proves
  nothing. (SC-004)
- [X] **T015** `node dist/cli.js verify --strict` exits 0, with every MV-79 leg
  and all six MV-37 legs resolving.
- [X] **T016** Re-run `node dist/cli.js doctor` in this worktree — the line that
  surfaced the defect must now name the shims as present rather than missing.
  (SC-002)

Depends on: Phase 4.

## What the proof runs actually said

- **T013**: 331 tests, 331 pass, 0 fail.
- **T014**: four reverts, four named failures, each restored and re-run green.
  1. `resolveHooksPath(repo, dir).dir` → `join(repo, dir)` in `installAlongside`
     ⇒ `an absolute foreign core.hooksPath: the shims land where git looks, not
     in a tree built by concatenation` FAILS (and two more with it).
  2. `!resolveHooksPath(repo, hooksPath).own` → `hooksPath !== HOOKS_DIR` in
     `installHooks` ⇒ `our own hooks dir spelled absolutely is ours, not a
     foreign gate` FAILS.
  3. `resolveHooksPath(brain, dir).dir` → `join(brain, dir)` in `alongsideParts`
     ⇒ `doctor reads the resolved directory: an inherited absolute hooksPath is
     not a missing shim` FAILS (and the refuses/wires test with it).
  4. `hp !== null && resolveHooksPath(brain, hp).own` → `hp === HOOKS_DIR` in
     `hooksLine` ⇒ `our own hooks dir spelled absolutely is ours, not a foreign
     gate` FAILS on the `--strict` assertion.
     **Corrected in Phase 6 (T021): this narration was wrong.** The revert
     fails on the EARLIER `assert.match(hooks, /core\.hooksPath ok/)` — the
     first of the two — not on the `--strict` assertion. Re-run and recorded
     under T021. The result held; the sentence describing it did not.
  Every revert was made in the TypeScript source and rebuilt, because the suite
  loads `dist-test/` — a mutation in `dist/` would have proved nothing.
- **T015**: `verify --strict` exit 0, 79 claims, 79 anchored, 79 ok. One leg had
  to move first: MV-47's `/hp === HOOKS_DIR && installed && runner/` pinned the
  exact expression T010 replaced and broke. Repointed at `/armed: ours &&
  installed && runner/`, the code that carries the same claim; MV-47's statement
  is unchanged and MV-47 is declared under the change's `touches` for the leg.
- **T016**: the line reads `core.hooksPath is /Users/…/multivac/.multivac/hooks
  (this repo's own gate …) · pre-commit runs multivac (…) · pre-push runs
  multivac (…) · active (mvac on PATH)`, and `doctor --strict` exits 0. Before
  the fix the same checkout said `pre-commit missing in …` twice.

## Phase 6: Second round — what the adversarial audit found

The first round shipped a resolver that was right and two call sites that fed
it the wrong input. Everything below was reproduced before it was fixed.

- [X] **T017** Reproduce the blocker: in a scratch repo with `core.hooksPath` =
  `~/mvac-tilde-hooks`, run `init` and show where the shims land, then compare
  `git config core.hooksPath` with `git config --path core.hooksPath`.
- [X] **T018** Read `core.hooksPath` with `git config --path` at BOTH call
  sites — `gitConfigPath` in `src/hooks/install.ts` and `hooksLine` in
  `src/commands/doctor.ts`. Root cause, not symptom: `resolveHooksPath` never
  changes, its input does.
- [X] **T019** Cover the tilde spelling in `test/init/coexist.test.ts`, with
  `$HOME` pinned to a scratch directory so the developer's real home is never
  written to.
- [X] **T020** Correct MV-79's statement: git expands a leading `~`/`~user`
  FIRST, then takes an absolute result whole and resolves anything else against
  the worktree root. State it in that order and name `--path`.
- [X] **T021** Correct the worktree-inheritance paragraph in `DESIGN.md` and
  `site/content/docs/reference/hooks.md` (and the same loose phrasing in the
  `resolveHooksPath` / `alongsideParts` comments), and re-run the mutation whose
  narration was wrong in Phase 5.
- [X] **T022** Mutation-verify the two new `--path` reads and re-run the
  mis-narrated one; `pnpm run build && pnpm test` green; `verify --strict` 0.

## What the second round's proof runs actually said

- **T017**: `git config core.hooksPath` → `~/mvac-tilde-hooks`;
  `git config --path core.hooksPath` → `/Users/ulm0/mvac-tilde-hooks`. `init`
  printed `hooks installed alongside into ~/mvac-tilde-hooks` and `doctor` said
  `pre-commit runs multivac (~/mvac-tilde-hooks/pre-commit) · … · active`, while
  the shims were at `<repo>/~/mvac-tilde-hooks/` — a directory named `~` inside
  the checkout — and `/Users/ulm0/mvac-tilde-hooks` did not exist. A hook placed
  by hand in `$HOME/mvac-tilde-hooks/pre-commit` ran on `git commit` and blocked
  it: git looks there, multivac wrote elsewhere, and both commands reported
  success. A false green over the same concatenation defect, one spelling down.
- **T018/T022**: after `--path`, the same repro puts both shims in
  `/Users/ulm0/mvac-tilde-hooks`, nothing under `<repo>/~`, and
  `git config core.hooksPath` still reads `~/mvac-tilde-hooks` — never repointed.
- **T022 mutations** (revert in `src/`, `pnpm run build`, named assertion fails,
  restore, passes):
  1. `['-C', repo, 'config', '--path', key]` → `['-C', repo, 'config', key]` in
     `gitConfigPath` ⇒ `a `~` core.hooksPath expands to $HOME: the shims land
     where git looks, not in a directory named `~`` FAILS on
     `assert.ok(existsSync(join(expanded, name)), 'pre-commit is where git will look')`
     — `actual: false, expected: true`.
  2. `['config', '--path', 'core.hooksPath']` → `['config', 'core.hooksPath']`
     in `hooksLine` ⇒ the same test FAILS on
     `assert.ok(hooks.includes(...), 'doctor names the path git will use')`
     — `actual: false, expected: true`.
  3. `const ours = hp !== null && resolveHooksPath(brain, hp).own` →
     `const ours = hp === HOOKS_DIR` in `hooksLine` ⇒ `our own hooks dir spelled
     absolutely is ours, not a foreign gate` FAILS on
     `assert.match(hooks, /core\.hooksPath ok/)` at `test/init/coexist.test.ts:637`
     — the actual line read `core.hooksPath is /var/…/.multivac/hooks (this
     repo's own gate — multivac installs alongside, never repoints) · …`. This is
     the proof Phase 5 narrated as failing on the `--strict` assertion at `:648`;
     it does not. Same verdict, correct sentence.
- **T021**: checked against a real linked worktree rather than reasoned about.
  Main checkout set to `.multivac/hooks`, the linked worktree reads
  `.multivac/hooks` and `installHooks` returns `strategy: fresh`,
  `dir: .multivac/hooks` — its own gate. Main checkout set to
  `<main>/.multivac/hooks`, the linked worktree reads that same absolute path
  and `installHooks` returns `strategy: alongside` pointed at the MAIN
  checkout's directory — a foreign gate, not "recognised as already ours". Both
  docs said the latter was the former; both now say what happens.
