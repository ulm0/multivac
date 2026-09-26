---
slug: doors-reach-every-harness
status: open
horizon: now
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches:
    - MV-131
    - MV-140
  adds:
    - MV-143
  retires: []
claims:
  - id: MV-143
    statement: A declared door reaches its harness before any vendor writes there. Every door whose kind is a symlink to AGENTS.md is linked in each writable root before the grapher's own project install runs there, so the vendor's section lands in the canonical door instead of a regular file that hides it; the link is a door file, never code, and the operator commits it. A surface claims the vendor's own section only where a declared door's platform is one measured to write that section.
  - id: MV-131
    statement: "A declared grapher's own project install runs for each declared door, after the door it will write into exists: every symlink door is linked before the vendor runs, the absolute path to the binary in a hook file is rewritten to the bare name on every equip and not only on the run that installs, and a platform whose section another platform already wrote in AGENTS.md is skipped rather than writing a second copy."
  - id: MV-140
    statement: What a surface says about the graph is true where it says it. A door cites the vendor's own section only where a declared door's platform writes that section, doctor names a platform that writes it, and the consumer door names the law at the path the law has in that repo.
---

# Doors reach every harness and say the truth

A door nobody reads governs nothing. Three surfaces break that today, and the
2026-09-21 adapter-first audit measured each one.

**A Claude session in a consumer repo sees the vendor and not multivac.**
`installHarness` (src/adapters/refresh.ts) runs `graphify install --project
--platform claude` in a root where `CLAUDE.md` does not exist yet. graphify
writes a regular 772 B file, and `doors` then refuses to replace it with the
symlink it wants (src/commands/doors.ts) because MV-108 forbids overwriting a
file multivac did not write. The agent gets graphify's section and no brain
door. Linking first is enough: `Path.write_text` follows a symlink, so the
vendor's section lands in `AGENTS.md`. Measured cost of the gap: 1,123 to 1,216
tokens per Claude session started in a consumer with speckit, 376 to 426 with
no SDD, and about 1,127 per touched repo whose door is committed for a session
started in the brain.

**A door that promises the vendor's section where nothing writes it.** MV-140
lets `grapherLines` (src/doors/brain.ts) cite the `## graphify` section as soon
as the `agents` door is declared, but graphify's `agents` platform writes only
a skill. In this brain the section exists because the `claude` platform wrote
through the `CLAUDE.md` symlink, not because `agents` put it there. `doctor`
compounds it by naming `--platform agents` as the fix. A claim that holds by
accident is the drift MV-111 exists to stop.

**A consumer door that names the law where the law is not.** `projectLawLines`
(src/doors/brain.ts), rendered into consumer doors through
src/doors/consumer.ts, prints `.multivac/invariants.md` in repos where the law
is at `<mount>/.multivac/invariants.md`. It happens in every consumer door
whose SDD resolves.

Also here, because it is the same pass: Cursor reads `AGENTS.md`, so its door
target becomes `native` and `.cursor/rules/multivac.mdc` is retired by a
`doors` run; graphify's `--platform cursor` is skipped in roots whose
`AGENTS.md` already carries the section, after the platforms that write it run.
Worth 352 to 391 tokens per Cursor session, conditional on Cursor injecting
AGENTS.md into Agent chats.

This change is correction before saving: every later saving in a consumer door
assumes the door is the file the agent actually loads. Moves M24, M23 and M27
of the adapter-first design, plus the bare-binary pass that MV-131 already
requires and that only runs on the installing pass.

Spec, plan and tasks: `specs/070-doors-reach-every-harness/`.

**Walked, not assumed** (2026-09-25, scratch ecosystem of a brain plus two code
repos, real graphify 0.9.29, `HOME` and `GIT_CONFIG_GLOBAL` isolated):

- `repos sync` linked `CLAUDE.md -> AGENTS.md` in the cloned code repo **before**
  the vendor ran, and graphify's `## graphify` section landed in `AGENTS.md`,
  once. After `doors`, that same file carries multivac's block and the section,
  and `CLAUDE.md` is still the link: one file, read by the harness, with both.
- An absolute path written by hand into `.claude/settings.json` was rewritten to
  the bare name on the next `repos sync`, a run that installed nothing.
- A repo whose `CLAUDE.md` a human had written was left byte-identical and named
  in the report. graphify then appended its section into that regular file, which
  is the ceiling this change states rather than papers over: an already-broken
  repo stays broken until a human merges the file.
- The consumer door prints the law at `.brain/.multivac/invariants.md`, and the
  project-document law line takes the same prefix, covered by a test in
  `test/doors/doors.test.ts` because it needs an SDD declared.
- `node --test` is 781 green; `verify` reports 143 claims, 0 broken.

One gap this change found on its way and fixed: making the Cursor target native
took `.cursor/**` out of the non-code set, so the `doors` run that deletes the
retired rules file would have been refused as code outside a change (MV-137). A
target's `retired` path now counts as a door file, with its own leg and test.
