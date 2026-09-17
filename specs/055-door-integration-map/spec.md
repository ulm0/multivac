# Feature Specification: The SDD's own init installs the integration each declared door uses

**Feature Branch**: `055-door-integration-map` | **Created**: 2026-09-16 | **Status**: Draft

**Input**: Change 8 of the 2026-09-14 plan, split: the door→integration map for SDD tools (8a). The graphify project install is a follow-up change.

## Context: what was measured

Measured 2026-09-16, in scratch repos with `HOME` isolated.

1. **The spec-kit init installs claude whatever the team uses.** multivac runs `specify init --here --integration claude --force --ignore-agent-tools` in every root, regardless of `doors:` (`src/adapters/registry.ts`). A brain with `doors: [agents, cursor]` gets spec-kit's claude skills and nothing under `.cursor/`.
2. **spec-kit 1.0.7** (`specify integration list`):
   - **Keys per harness:** `claude`, `cursor-agent`, `codex`, `gemini`, `opencode`, `copilot`, plus a "Multi-install Safe" flag.
   - **Adding a safe integration works.** In a project that holds claude, `specify integration install cursor-agent` exited 0 and recorded both.
   - **Adding an unsafe one does not.** `install opencode` refused and named `--force`; nothing changed.
   - **There is no usable key for agents.md.** `generic` exits 1 without a `--commands-dir`.
3. **openspec 1.13.0** (`DO_NOT_TRACK=1`, `OPENSPEC_TELEMETRY=0`):
   - `openspec init --tools claude,cursor --no-animation .` exited 0.
   - It wrote `openspec/config.yaml`, the gitkeeps, and six commands plus six skills under each of `.claude/` and `.cursor/`.
   - `init --help` lists the tool keys, among them `agents`, `github-copilot`, and `windsurf` (as an alias).
   - multivac recorded no init for opsx at all, so an opsx brain was never set up.

## User Scenarios & Testing

### US1 - The integration matches the doors (P1)
1. **`doors: [agents, cursor]` with speckit.** The init runs `--integration cursor-agent`.
2. **`doors: [agents, claude, cursor]`.** `--integration claude`, then `specify integration install cursor-agent`.
3. **`doors: [agents, claude, opencode]`.** Only claude is installed. opencode is named as a gap that cannot be installed beside claude without forcing it; nothing is forced.
4. **`doors: [agents]` only.** The integration is claude, as before.
5. **A door with no verified integration (windsurf for speckit).** It is named as a gap.

### US2 - opsx is set up like speckit (P1)
1. **opsx declared and missing, `doors: [agents, claude]`.** `openspec init --tools agents,claude --no-animation .` runs, with the entry's opt-out environment.

### US3 - doctor names the same commands (P2)
1. **A missing speckit root.** doctor names the init it would run for these doors.

## Requirements
- **FR-001:** An SDD's scaffold carries a measured door→integration map, with the vendor's multi-install flag.
- **FR-002:** The commands are derived from `doors:` by one function, which `runScaffold` and `doctor` share.
- **FR-003:** An unsafe integration is never installed beside another, and no integration is forced.
- **FR-004:** opsx carries its measured init.
- **FR-005:** With no door mapped, speckit keeps claude. The fallback is declared in the entry, not implied by the code.

## Assumptions
- Adding an integration to a root where the tool is already installed, after a door is added later, is not covered: the probe says installed, and nothing runs. It is stated as a ceiling.
- The graphify project install (`graphify install --project --platform`) is a separate change.
