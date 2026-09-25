# Research: Doors reach every harness and say the truth

All measurements below were taken on 2026-09-25 against graphify 0.9.29, in
fresh git repos under a scratch directory with `HOME` and `GIT_CONFIG_GLOBAL`
pointed into that scratch, so nothing outside it was read or written. Each repo
carried an `AGENTS.md` with a multivac managed block and one source file, and a
graph was built before the install, because `installHarness` only runs where the
graph is installed.

## R1. Which platforms write the vendor's own section into the canonical door

| platform | `## graphify` in AGENTS.md | root door file it writes | hook file carrying an absolute path |
| --- | --- | --- | --- |
| `agents` | no | none | none |
| `claude` | no | `CLAUDE.md` (regular file) | `.claude/settings.json` |
| `cursor` | no | `.cursor/rules/graphify.mdc` | none |
| `codex` | **yes** | `AGENTS.md` | `.codex/hooks.json` |
| `gemini` | no | `GEMINI.md` (regular file) | `.gemini/settings.json` |
| `copilot` | no | none | none |
| `opencode` | **yes** | `AGENTS.md` | none |
| `amp` | **yes** | `AGENTS.md` | none |

**Decision**: the registry records, per platform, where the vendor's section
lands: `canonical` for codex, opencode and amp; `own-door` for claude and
gemini, which write their harness's own root file; `none` for agents, cursor and
copilot.

**Rationale**: MV-140's `cites` flag and doctor's repair line are true only for
a platform that writes the section. Today both are satisfied by any declared
door with a platform at all, which is why this brain's door cites a section that
the `agents` platform never wrote. The distinction has to be data, measured per
platform, not a guess from the platform's name.

**Alternatives considered**: a boolean `writesSection`. Rejected: it cannot
express the claude and gemini case, where the section lands in the canonical
door only because the harness's own door is a link to it. Reading the door file
at render time was also rejected: doors render from declarations only, with no
filesystem check, by the rule at the top of src/doors/consumer.ts.

## R2. Does a symlink door carry the vendor's section into the canonical door

Measured with `CLAUDE.md` and with `GEMINI.md` as symlinks to `AGENTS.md`,
running the matching install twice:

- the section appears in `AGENTS.md` exactly once after two runs;
- the multivac managed block survives untouched;
- the symlink is still a symlink afterwards, pointing at `AGENTS.md`.

**Decision**: linking before the vendor runs is the whole mechanism. Nothing
needs to move the section afterwards.

## R3. A dangling link

With `CLAUDE.md` linked to an `AGENTS.md` that does not exist yet, the install
created `AGENTS.md` through the link and wrote the section into it.

**Decision**: the link pass does not depend on the canonical door existing
first, so it can run before the door is written and in any order with it.

## R4. Where the link pass belongs

`installHarness` in src/adapters/refresh.ts already walks exactly the right
roots: it skips a root with no grapher, a read-only root (MV-125) and one whose
graph is not installed, and `equip` calls it from init, `repos sync` and the
lifecycle (src/adapters/equip.ts).

**Decision**: link inside that loop, per declared door whose target kind is
`symlink`, before the platform probe short-circuit. `linkDoor` moves from
src/commands/doors.ts into src/doors/link.ts so both callers share one
implementation, with `doors` keeping its current behavior.

**Alternatives considered**: linking in `doors` only. Rejected: `doors` is not
what runs before the vendor in a repo the lifecycle just cloned, which is the
case that loses the door. Repairing a regular file left by an earlier install
was also rejected: MV-108 forbids overwriting a file multivac did not write, so
that stays a reported condition.

## R5. Why the bare-binary rewrite misses

The rewrite at the end of `installHarness` is unreachable when every platform's
probe is already present, because the loop returns early at `todo.length === 0`.
A vendor install run by hand afterwards writes the absolute path again and
nothing normalizes it.

**Decision**: restructure the per-root body so the installs are one step and the
rewrite always runs after it, whatever the installs did. The rewrite is pure
text over the harness's declared hook files, needs no binary and no graph, and
stays silent when nothing changed.

## R6. Cursor

Cursor reads `AGENTS.md` at the project root, which the registry's own note
already records, and the vendor's `.cursor/rules/graphify.mdc` repeats the graph
instructions that the canonical door carries once the section is there.

**Decision**: the Cursor door target becomes `native`, and one `doors` run
removes multivac's managed block from an existing `.cursor/rules/multivac.mdc`,
deleting the file only if the removal leaves nothing behind (MV-73, MV-108). The
vendor's `cursor` platform is skipped in a root whose canonical door already
carries the section, after the platforms that write it have run in that root.

**Open, and confined**: whether Cursor injects `AGENTS.md` into Agent chats is
the human's to confirm. Only the saving depends on it; correctness does not.

## R7. The law

- MV-143 is the new rule: a door reaches its harness before any vendor writes
  there, and a surface claims the vendor's section only where a platform writes
  it.
- MV-131 is amended: the link runs before the install, the rewrite runs on every
  equip, and a redundant platform is skipped where the section already exists.
- MV-140 is amended: `cites` requires a platform that writes the section, doctor
  names such a platform, and a consumer door names the law at the path that repo
  can open.
- MV-131's existing anchors stay valid: the count of its 2026-09-16 amendment
  notes does not change, and its anchors on graphify's platform probes still
  match, because the platforms themselves are untouched.
