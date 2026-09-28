---
slug: speckit-writes-once
status: archived
horizon: now
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-55
    - MV-56
    - MV-75
    - MV-76
    - MV-87
    - MV-93
    - MV-95
    - MV-120
    - MV-122
    - MV-125
    - MV-129
    - MV-130
    - MV-132
    - MV-133
    - MV-134
    - MV-135
    - MV-136
    - MV-137
    - MV-139
    - MV-140
    - MV-143
    - MV-144
  adds:
    - MV-146
  retires: []
claims:
  - id: MV-146
    statement: With an SDD declared, the SDD lives in the brain alone and what it costs is paid once. The SDD resolves for the brain root only, the code gate reads the SDD that governs a repo's code (the brain's, unless the repo says none), a config naming an SDD that resolves in no root is refused at load, close lands the brain's slug directories whatever the flags say, spec-kit's feature pointer follows the change being planned or applied, a fresh spec-kit scaffold writes skeleton templates where the tool resolves first, the revisit says to commit no Sync Impact Report, each lifecycle point prints the run-the-chain instruction once, and close cites the SDD's directory in the change body.
---

# The SDD lives in the brain and writes once

A declared SDD cost every code repo an install, a constitution and a door block,
while the specs of a change were written in the brain anyway; the user decided on
2026-09-25 that in a multi-repo ecosystem the SDD lives in the brain alone. The
same pass removes what the SDD writes or prints more than once: template guidance
the agent deletes every change, amendment reports stacked in the constitution, the
run-the-chain instruction after every step, and a change body that restates its
spec.

## Walked with the real vendors

2026-09-28, spec-kit 1.0.11, openspec 1.13.2 and graphify 0.9.29, HOME and
GIT_CONFIG_GLOBAL isolated; the base twin is the build at `70fe703`.

- Walk A (code-less brain, api and web). `init --sdd speckit` scaffolded the
  brain and wrote the three skeletons (3,795 bytes), and `specify preset
  resolve plan-template` named the project override as the top layer.
  `repos sync` ran no init and left 0 SDD files in either code repo (SC-001).
  api's door carried one SDD line and was 2,558 bytes under the twin's; the
  brain door's step lines were 902 bytes against 1,654 (SC-002, SC-013).
  `repos.web.sdd: opsx` exited 2 in the brain; through api's mount `verify`
  exited 0 with the line and 1 under `--strict` (SC-004). The vendor's
  `create-new-feature.sh` wrote a spec byte-identical to the skeleton; with
  `beta` open and the pointer on it, `change plan probe-sdd` repointed it and
  `setup-plan.sh` resolved `specs/001-probe-sdd` (SC-006); a plan still the
  skeleton refused `apply`, naming the override. `new`, `plan` and `apply`
  printed the instruction 3 times (SC-012). On api's `main`, staged
  `src/index.ts` and `specs/x.ts` exited 1 under `--strict`, `.specify/x` and
  `openspec/config.yaml` 0 (SC-003). `close --no-sdd` staged
  `specs/001-probe-sdd`, left `specs/002-beta` alone, and the archived body was
  its pre-close bytes plus the pointer line (SC-005, SC-015). A `specify init`
  in web gave doctor a leftover line, and `repos check` kept exit 0. A second
  init left the skeletons byte-identical (SC-010).
- Walk B (opsx). After `openspec archive`, close staged the archive entry and
  the two merged spec files, named a human's edit to
  `openspec/specs/billing/design.md` dirty without staging it, and after the
  printed commit only that edit was left (SC-005).
- Walk C (brain==code keyed `core`). `apply` carried the three spec-kit files
  into the `core` worktree; `close` refused over the one open task and, once it
  was ticked, cited `specs/001-keyed/` from that worktree (SC-007).
- Walk D (this repository's configuration, at `70fe703`). `doctor` differed
  from the twin's only in the revisit wording, `verify` not at all, and the
  brain door only in the step endings (SC-008).

Specified in `specs/073-speckit-writes-once/` (speckit).
