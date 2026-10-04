# Feature Specification: The reference docs say what the code does

**Feature Branch**: `084-site-docs-match-code` | **Created**: 2026-10-04 | **Status**: Draft

**Input**: An audit of `site/content/docs/reference/*.md` and `site/content/_index.md` against `src/` (0.15.0, 2026-10-03) found the 0.15.0 graph removal reported honestly, and drift elsewhere: quoted output the code does not print, flags and lines the code has and the docs omit, and four statements that claim more than the code does. Docs change only; no code changes, and where a claim is false because the code is surprising (a mount that is not a brain blocks the commit), the doc says what the code does.

## User Scenarios & Testing

### US1 - A reader is not told a guarantee the code does not give (P1)
1. **Given** a machine whose brain mount is not a brain, **when** the reader looks up what `verify` does, **then** the docs say `verify` exits 2 there (verify.ts:1017-1020, 1488-1494) and that the git shim, which runs `verify`, blocks the commit — "never locks you out" is scoped to a machine without the binary.
2. **Given** `help`, `change --landed/--abandon` outside `land`/`close`, and `repos --shallow` outside `sync`, **when** the reader looks up undeclared arguments, **then** the docs name these as accepted and ignored, not refused (help.ts:48-69, change.ts:1587-1636).
3. **Given** a broken config, **when** the reader looks up which commands exit 1, **then** the docs name `doors`, `doctor` and `init` everywhere (init.ts:466-476, 490-500).
4. **Given** the hooks page, **when** the reader looks up what gates a commit, **then** it lists the lines that gate in any anchor mode: `enact` REFUSED, `law` death, `config` without an open change, `code` outside a change, a blocking stale pin, the strict-only finished-change line (verify.ts:1613-1620).
5. **Given** "every command here is deterministic" (commands.md:43-45), **when** read, **then** it says no model call, and names `repos sync`, `roadmap sync`, `plan`/`apply` clones, `init --sdd` and `change new` vendor inits as able to reach the network.

### US2 - Quoted output is output the code prints (P1)
1. **Given** a stale pin, **when** the docs quote the line, **then** it ends `git -C <path> submodule update --remote <mount>` (verify.ts:244-258) and `commands.md:1093` says only `stale?` names `repos sync`.
2. **Given** the `repos` unknown-subcommand usage, `roadmap`/`change` refusals and `change close`'s `archive` step, **when** quoted, **then** usage reads `[sync [--shallow] | check]` (repos.ts:382), refusals carry no `mvac: ` prefix (roadmap.ts:155-163, 331; change/file.ts:393), and `archive` is described as an instruction printed, never run (change.ts:1478).

### US3 - What the code does and the docs omit is documented (P2)
1. **Given** each omission found, **when** the reader looks it up, **then** it is in the doc: `verify --range`/`--branch` and their go-together refusal (verify.ts:1389-1396); `.multivac/projected.yml` among `init`'s side effects (init.ts:104, 530-531); `doctor`'s `forge` and `layout` lines (doctor.ts:827-833, 793); `roadmap sync` and its exits (roadmap.ts:194-200, 339-342); `change new`'s promotion and archived-slug refusal (change.ts:855-863, 887-888); `land --landed`'s bookkeeping commit (change.ts:1239-1243); `--abandon`'s final commit line (change.ts:1378); `doors`' takeback lines for `ecosystem.json` and `adopted` (doors.ts:305-309, 371-372); the stderr version/`requires:` notice (cli.ts:54-67).

## Requirements
- **FR-001:** Every correction is checkable against the `src/` line it cites in this spec; the doc states the behavior, not the line.
- **FR-002:** The dead phrasings are named by MV-155 as `absent` legs over `site/content/**`: the stale-pin sentence naming `repos sync`, the unconditional "exit 0 including every degraded state", "every command refuses undeclared arguments", "`doors` and `doctor` … exit 1" as an exhaustive pair, and "which anchor mode broke decides whether the exit code gates".
- **FR-003:** No file outside `site/content/` and `.multivac/`/`specs/` changes; no `src/` change.
- **FR-004:** The 0.15.0 migration notes about graphs stay as they are.

## Success Criteria
- **SC-001:** `verify --strict` and `verify --strict --range <main>..HEAD --branch site-docs-match-code` exit 0; the suite passes; the site builds.
- **SC-002:** A re-run of the audit against `commands.md`, `configuration.md`, `hooks.md`, `sdd.md` and `_index.md` finds none of its findings still true.

## Assumptions
- The stale-mount exit 2 is documented, not changed: whether it should degrade instead is a separate change if the human wants it.
- `philosophy.md:129` shares the "never locks you out" wording and is in scope with `_index.md:103`.
- Line numbers are those of 2026-10-03 on `c049518`.
