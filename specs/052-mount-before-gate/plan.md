# Implementation Plan: A consumer is mounted before it is gated

**Branch**: `mount-before-gate` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/052-mount-before-gate/spec.md`

## Summary

`doors` arms a blocking pre-commit gate in every declared repo; nothing in multivac
creates the mount that gate reads. Three edits close it:

1. `repos sync` gains a mount pass — for each declared repo that is cloned, writable and
   carries no gitlink at `cfg.mount`, run `git submodule add <brain_url> <mount>` in that
   repo, leave it staged, never commit.
2. A new hand-authored top-level key `brain_url` holds the address consumers clone the
   brain from. Never derived from a remote. `init` writes it commented, carrying the
   detected origin as a suggestion.
3. `verify` in a checkout that carries a multivac-written hook shim, has no config and
   reaches no brain warns and exits 0 instead of 2 — the promise the shim already prints
   for a multivac it cannot run.

Plus the reporting tail: `doctor`'s pins line, the `doors` report and the consumer door
name `multivac repos sync` where they name a missing mount.

## Technical Context

**Language/Version**: TypeScript, Node ≥ 24, ESM, pnpm

**Primary Dependencies**: citty, picomatch, yaml — unchanged; this feature adds none

**Storage**: files — `.multivac/config.yml`, each consumer's `.gitmodules` and index

**Testing**: `node --test` over `test/`, scratch ecosystems from `test/helpers/fixture.ts`,
HOME isolated, git invoked through an argument vector

**Target Platform**: developer machines, macOS and Linux; the hook path also runs in CI

**Project Type**: single CLI

**Performance Goals**: `verify` stays sub-second (Principle IV). The mount pass runs only
inside `repos sync`, which already reaches the network and is not on the hook path.

**Constraints**: `verify`, `doctor` and `doors` make no network call. No new runtime
dependency. Git through `execFile`, never a shell. Tests must not depend on host
configuration — the mount tests use local-path "URLs" so no network is touched.

**Scale/Scope**: measured against 42 declared repos; the pass is one `ls-tree` per repo
plus one `submodule add` per missing mount.

## Constitution Check

*GATE: passed before Phase 0, re-checked after Phase 1.*

**I. A Claim Nobody Checks Decays** — one row, MV-127, states the rule and is anchored to
the source that makes it true: the mount call site, the `brain_url` read, the consumer
exit, and `absent` legs on the retired bare-git advice. Site pages under `site/content/`
gain the new key and the new behaviour in plain words and name no ID (MV-126, proposed —
this change follows the rule whether or not that row is enacted, since it costs nothing
either way).

**II. The Tool Never Claims More Than It Checked** — the tension is here, and it is
resolved, not waived. FR-001 makes a checkout with a door and no reachable brain exit 0,
where the principle says "a gate that cannot be evaluated refuses rather than passes".
The distinction the plan asserts: there is no gate in that checkout to evaluate. multivac
has no law, no anchors and no repo scope there — it cannot judge a single claim, pass or
fail. That is the same state the shim already names "hooks INACTIVE — no runnable
multivac, nothing was verified" and already exits 0 for. What the principle forbids is a
gate that *could* be judged reporting green because the judging failed; this reports
nothing was judged, loudly, in the same words, and names the command that makes judging
possible. A run that reaches a brain and then cannot evaluate a gate still refuses, and
this change does not touch that path (FR-003).

**III. The Law Changes Before The Code** — MV-127 is already reserved and proposed
(`change new`). Its statement lands in the same change as the behaviour. Nothing existing
is relaxed: the rows this touches (MV-123 quoting, MV-125 readOnly) are cited, not
amended. No existing row says the mount is manual — the claim lives only in prose and
advice text, so there is nothing to retire beyond those strings.

**IV. Deterministic, Offline, Small** — the only network the feature adds is inside
`repos sync`, the command that already declares it fetches. `verify`'s new branch is two
filesystem reads on a path it already stats, and only on the branch that today throws. No
new dependency. Git keeps running through `execFile` with an argument vector.

**V. An Invented Integration Is A Lie** — no adapter entry changes. `git submodule add` is
git's own documented command, run with the URL the operator declared, and the plan states
that it reaches the network.

**Post-Phase-1 re-check**: unchanged. The design adds one config key, one exported
predicate, one mount function and four message edits; nothing in it required a principle
to bend.

## Project Structure

### Documentation (this feature)

```text
specs/052-mount-before-gate/
├── plan.md              # This file
├── research.md          # Phase 0 — what was measured, and the options weighed
├── data-model.md        # Phase 1 — the config key, the mount state, the door predicate
├── quickstart.md        # Phase 1 — how to prove it end to end
├── contracts/
│   └── cli.md           # Phase 1 — the command surface and exit codes this changes
├── checklists/
│   └── requirements.md  # written by /speckit-specify
└── tasks.md             # Phase 2 — /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── commands/
│   ├── repos.ts         # mount pass inside reposSync; report lines
│   ├── verify.ts        # consumer branch: door + no brain -> warn, exit 0
│   ├── doctor.ts        # pins line names `multivac repos sync`
│   ├── doors.ts         # report repos with no mount
│   └── init.ts          # renderConfig writes `# brain_url:` with detected origin
├── lib/
│   ├── config.ts        # `brain_url` -> Config.brainUrl; refuseUnknown list
│   └── git.ts           # submoduleAdd, originUrl
├── hooks/
│   └── install.ts       # isOurShim already exported — reused, not changed
├── adapters/
│   └── detect.ts        # readOnly already exported — reused, not changed
└── types.ts             # Config.brainUrl

test/
├── repos/               # mount pass: creates, skips, fails, read-only, brain==code
├── verify/consumer.test.ts   # door + no brain -> exit 0; no door -> exit 2
├── init/                # renderConfig writes the commented key
└── doors/, cli/         # message edits

site/content/docs/reference/configuration.md   # `brain_url`, and `mount` stops saying manual
site/content/docs/...                          # guide pages that describe adding a repo
```

**Structure Decision**: single CLI, existing layout. No new module: the mount pass lives
in `src/commands/repos.ts` beside the clone it follows, and the two git verbs it needs go
in `src/lib/git.ts` with the rest.

## Phase 0 — Research

See [research.md](./research.md). It records the measurements the spec cites, and the
three decisions that were not forced by them: where the mount pass lives, what names a
projected door, and how the brain URL is declared.

## Phase 1 — Design

- [data-model.md](./data-model.md) — `brain_url`, the four mount states a declared repo
  can be in, and the door predicate.
- [contracts/cli.md](./contracts/cli.md) — the exact command surface: what `repos sync`
  prints per repo, what `verify` exits, what `doctor` and `doors` say.
- [quickstart.md](./quickstart.md) — the end-to-end proof, offline, in a scratch
  ecosystem.

## Complexity Tracking

No constitutional violation to justify. The one place this plan could have grown a
structure and did not is worth recording:

| Considered | Rejected because |
|---|---|
| A `repos mount` subcommand of its own | `repos sync` already means "make the declared repos usable, and yes it touches the network". A second verb would let a repo be cloned but unmounted by default, which is exactly today's drift. |
| `doors` refusing to project into an unmounted repo | It would need the gate's precondition checked in two places and would leave repos silently ungated. With `verify` warning and exiting 0, projecting is harmless; `doors` reports and moves on. |
| Deriving `brain_url` from `git remote get-url origin` when undeclared | Measured trap: the brain's own origin can be a machine-local SSH alias, and the guess is written into every consumer's `.gitmodules`. A wrong value propagates to everyone who clones. |
