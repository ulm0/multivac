# Implementation Plan: Doors reach every harness and say the truth

**Branch**: `070-doors-reach-every-harness` | **Date**: 2026-09-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/070-doors-reach-every-harness/spec.md`

## Summary

Four corrections to the surfaces an agent reads, and one new rule that holds
them. The grapher's own project install runs before the door it writes into
exists, so a harness that reads its own door file gets the vendor and not
multivac: link every symlink door first, inside the pass that already walks the
right roots. The rewrite that keeps hook commands machine independent is
unreachable once every platform is installed: make it run on every equip. Two
door statements are false where they are read: the graph lines cite a vendor
section that only some platforms write, and the consumer door names the law at
the brain's own relative path. Cursor reads the canonical door, so its target
becomes native and the vendor's redundant rules file is skipped where the
section already exists. The law gains MV-143 and amends MV-131 and MV-140.

## Technical Context

**Language/Version**: TypeScript on Node 24, ES modules, compiled to `dist/`

**Primary Dependencies**: picomatch, yaml, citty. No new dependency (MV-02)

**Storage**: files in each root: door files, the vendor's hook files, the law table

**Testing**: `node --test test/`, node:test with the fixtures in `test/helpers/fixture.ts`

**Target Platform**: macOS and Linux developer machines and CI; Windows only where symlinks are unavailable, which is a reported condition

**Project Type**: single CLI package, brain==code

**Performance Goals**: no measurable change. The link pass is one `lstat` per declared door per root; the rewrite is one read per declared hook file per root

**Constraints**: offline and deterministic (MV-01); never shell out to an agent (MV-51); never overwrite a file multivac did not write (MV-108); doors render from declarations only, with no filesystem read

**Scale/Scope**: one brain plus N declared repos; 8 graphify platforms and 6 door targets in the registry

## Constitution Check

**I. A Claim Nobody Checks Decays** — every behavior here lands with an anchor
and a test. MV-143 anchors the link call, the platform `section` data and the
consumer prefix; MV-131 and MV-140 keep their existing anchors and gain the ones
for the rewrite's new position and the `cites` rule. This principle is also why
the feature exists: MV-140's `cites` claim is true in this brain by accident.

**II. The Tool Never Claims More Than It Checked** — the platform table in
research.md was measured on graphify 0.9.29 with an isolated home, not inferred
from platform names. Where a root's declared platforms write no section, the
door stops citing one. A root whose door was already replaced by a regular file
is reported, never silently repaired, and the spec says so in Assumptions.

**III. The Law Changes Before The Code** — MV-143's row and the amended wording
of MV-131 and MV-140 are written in this change, before the code that makes them
true, and `change close` re-runs verify scoped to those claims.

**IV. Deterministic, Offline, Small** — no network, no new dependency, no new
command. The link pass reuses `linkDoor`, moved rather than rewritten; the
rewrite reuses `bareBinary`; the retired Cursor file is unprojected by the
mechanism `doors` already has for a file the source stopped shipping (MV-73).

**V. An Invented Integration Is A Lie** — `section` and `redundant` are recorded
per platform from measurement, with the version named. The Cursor skip is not a
claim about Cursor's behavior: the door target's note already records that Cursor
reads the canonical file, and the saving that depends on Cursor injecting it is
marked as the human's to confirm.

**Gate**: passes. No violation to justify.

## Project Structure

### Documentation (this feature)

```
specs/070-doors-reach-every-harness/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/cli-output.md
├── checklists/requirements.md
└── tasks.md          # /speckit.tasks
```

### Source Code (repository root)

```
src/
├── adapters/
│   ├── refresh.ts     # installHarness: link pass, install step, rewrite always
│   └── registry.ts    # doorTargets.cursor -> native + retired path; platform section/redundant
├── doors/
│   ├── link.ts        # NEW: linkDoor, moved from src/commands/doors.ts
│   ├── brain.ts       # grapherLines cites rule; projectLawLines/sddLines prefix
│   └── consumer.ts    # passes the mount as the law prefix
└── commands/
    ├── doors.ts       # imports linkDoor; unprojects a retired target's file
    └── doctor.ts      # names a platform that writes the section

test/
├── doors/             # door text, cursor target, consumer law path
├── init/              # link pass through init and sync
└── adapters/          # installHarness order, rewrite on every run, redundant skip

.multivac/invariants.md   # MV-143 added; MV-131 and MV-140 amended
```

**Structure Decision**: no new module boundary. `linkDoor` moves into
`src/doors/` because two callers need it and `src/commands/` is where commands
live, not shared door mechanics. Everything else is edited in place.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| A third value for a platform's section instead of a boolean | claude and gemini write the section into their own root door file, which reaches the canonical door only through the link | a boolean would make the door's claim true or false for the wrong reason, which is the drift this change fixes |
| A `retired` path on a door target | Cursor's target already shipped a file that a native target must remove | leaving the file behind keeps a second, stale copy of the door, and MV-73 forbids a projection that accretes |
