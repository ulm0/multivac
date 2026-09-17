# Feature Specification: The grapher's own project install runs for each declared door

**Feature Branch**: `056-grapher-harness-install` | **Created**: 2026-09-16 | **Status**: Draft

**Input**: Change 8b of the 2026-09-14 plan and its addendum (I-56, I-57, I-58, I-59). The grapher has a project-level install per harness, and nothing runs it.

## Context: what was measured

Measured 2026-09-16 on graphify 0.9.29 in scratch repos, with `HOME` isolated.

1. **Nothing installs graphify into a harness.** `graphify install --project --platform <p>` exits 0 and writes nothing under `$HOME`. What it does write, per platform:
   - `claude`: `.claude/skills/graphify/SKILL.md`, `.claude/CLAUDE.md` and `.claude/settings.json` hooks.
   - `cursor`: `.cursor/rules/graphify.mdc`.
   - `codex`: `.codex/skills/graphify/SKILL.md` and `.codex/hooks.json`.
   - `opencode`: `.opencode/skills/graphify/SKILL.md`, `opencode.json` and a plugin.
   - `gemini`: `.gemini/skills/graphify/SKILL.md`, `.gemini/settings.json` and `GEMINI.md`.
   - `copilot`: `.copilot/skills/graphify/SKILL.md`.
   - `agents`: `.agents/skills/graphify/SKILL.md`.

   `windsurf` is not among its platforms. multivac runs none of these.
2. **The hooks it writes name the binary by an absolute path.** The claude, codex and gemini files record `/Users/<user>/.local/bin/graphify hook-guard …`. That path belongs to one machine, inside a file the repo versions.
3. **It keeps what is already there.** Over a `.claude/settings.json` holding multivac's hooks, it kept all three and added two `PreToolUse` hooks. It left `.claude/settings.json.graphify-bak` behind. A second run added nothing.

## User Scenarios & Testing

### US1 - A declared grapher is installed into each declared harness (P1)
1. **`grapher: graphify`, `doors: [agents, claude, cursor]`, none installed.** equip runs `graphify install --project --platform agents`, then `claude`, then `cursor`, each in the root.
2. **A platform already installed** (its probe file present): it does not run again.
3. **A read-only root:** nothing runs.
4. **`windsurf` declared:** named as a gap; nothing runs for it.

### US2 - A versioned hook never names one machine's path (P1)
1. **After an install,** every `…/graphify ` command in the hook files is rewritten to `graphify `, found on `PATH`, and the rewrite is reported.
2. **A hook file with no absolute graphify path** is left byte-identical.

### US3 - The backup the vendor leaves is ignored (P2)
1. **Before an install,** `.gitignore` gains `*.graphify-bak` if missing.

## Requirements
- **FR-001:** The grapher entry declares, per door, the vendor's platform and the file that proves it is installed, measured on a named version.
- **FR-002:** equip runs the install for each declared door whose probe is missing, in every writable root, after the first build.
- **FR-003:** equip rewrites absolute binary paths in the declared hook files to the bare binary name, and says so.
- **FR-004:** `doctor` reports a declared door whose harness install is missing, naming the command. It runs nothing.
- **FR-005:** No install is passed `--strict`.

## Assumptions
- codegraph's harness install is not measured on this machine, so it stays a named gap.
- Making multivac's door cite the vendor's `## graphify` section instead of repeating its verbs (I-55) is change 17.
