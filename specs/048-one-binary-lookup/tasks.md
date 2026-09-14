---

description: "Task list for one-binary-lookup"
---

# Tasks: One binary lookup

**Input**: Design documents from `specs/048-one-binary-lookup/`

**Where the work happens**: in the checkout `change apply one-binary-lookup`
prints (branch `one-binary-lookup`). The decisions are in research.md R1–R8, the
notes in R9, the legs in R10 and the row in R11.

**Tests first**: every behaviour change begins with an assertion, built and seen
failing before its code.
- Every test written or touched here puts its stubs on a PATH it builds
  (`<bin>:/usr/bin:/bin`), never the host's.
- win32 runs only through `findBinary`'s `env` argument.
- Exit-code and outcome assertions are not edited (FR-007). Only retired wording
  moves.
- New test text never spells a phrase leg 13 forbids (leg 12 before T034).

## Phase 1: Setup

- [X] T001 Baseline: `pnpm run build`, then `node dist/cli.js verify --strict` (0 blocking broken), then `node --test "dist-test/**/*.test.js"`, all green. `multivac count` R10 legs 2, 3, 10 and 12 give 13, 2, 2 and 30
- [X] T002 `node dist/cli.js change apply one-binary-lookup`, then check the branch and link `node_modules` (untracked) if missing. In a scratch clone, where apply would run vendor scaffolds, work on `main` instead

## Phase 2: Foundational — the law moves first (Principle III)

- [X] T003 Replace the RESERVED MV-123 row in .multivac/invariants.md with the rule (R11): `specified | proposed | 2026-09-14`, source `changes/one-binary-lookup.md`, ≤ ~400 words, no pipe, no literal `Amended 2026-09-14 by MV-123`
- [X] T004 Add the thirteen legs under MV-123 in .multivac/invariants.md, exactly as in R10
- [X] T005 MV-50 in .multivac/invariants.md: append the R9 note, which WITHDRAWS "the TOOL'S own first stderr lines", and move legs :293 and :295 (R10)
- [X] T006 MV-52 in .multivac/invariants.md: append the R9 note and move leg :320 (R10)
- [X] T007 MV-66 in .multivac/invariants.md: append the R9 note and move legs :478 and :479 (R10)
- [X] T008 MV-75, MV-90 and MV-115 in .multivac/invariants.md: append the R9 notes. MV-115's WITHDRAWS "`binaryPresent`" as the probe's name, and the clause stays visible

## Phase 3: Foundational — one lookup, and what each adapter requires

- [X] T009 [P] [US1] [US4] Test first in test/doctor/adapters.test.ts, replacing the `binaryPresent` test (:37-49); it fails to build. With an explicit `env`, `findBinary`:
  - finds an executable only on PATH, and one only in `<root>/node_modules/.bin`;
  - returns the PATH copy when both exist;
  - finds nothing for a non-executable file, a directory, or another root's copy;
  - skips an empty PATH segment;
  - on win32 with `PATHEXT=.COM;.EXE`, finds `specify.exe`, in PATHEXT's order;
  - on darwin ignores PATHEXT.

  `missingRequired` with `required: ['a', 'b']` and only `a` found returns `['b']`. Shipped `required` is as FR-005 says, and it holds the first word of every shipped `refresh`, `create`, `scaffold.run` and `validate`. A declared grapher requires `binary`, or else the first word of `refresh`. `binaries` assertions (:69, :84) stay
- [X] T010 [P] [US3] Test first in test/doctor/adapters.test.ts; it fails. `binaryMissing` for each shipped adapter names the binary, the adapter, `installHint`, `source`, `PATH` and `node_modules/.bin`. For a declared grapher it says `declared in .multivac/config.yml` and names no URL
- [X] T011 [US1] src/adapters/detect.ts: add `findBinary`, `localBin` and `missingRequired` (R1, R2), delete `binaryPresent`, and rewrite the header (:1-2). T009's lookup cases pass
- [X] T012 [US4] src/adapters/registry.ts: add `required` to `AdapterSpec`, to the four entries and to the declared base (:658) (R3). Reword the `binaries` comment (:240), add `binaryMissing` (R5), and drop "on PATH" from `unverifiedGrapher`'s `binary:` line (:683). T009 and T010 pass

## Phase 4: US2 — the scaffold runs without `claude`, and a failure says why (P1)

- [X] T013 [P] [US2] Create test/helpers/recorded.ts: `SPECKIT_106_NO_CLAUDE` and `GRAPHIFY_0929_READONLY`, with paths redacted as R8 says
- [X] T014 [P] [US2] Test first in the new test/lib/out.test.ts; all fail:
  - spec-kit quotes `claude not found` with no U+2500–U+259F;
  - graphify quotes exactly its `PermissionError` line, with no `Traceback` or `File "`;
  - a chained traceback quotes its last exception;
  - output with no cause quotes its last ≤ 3 non-banner lines;
  - banner-only output quotes `message`;
  - `error: permission denied` quotes itself.
- [X] T015 [US2] Tests first in test/change/sdd-gates.test.ts:
  - `stubSpecify` checks argv against the registry (exit 97 on a mismatch). Without `--ignore-agent-tools` and with no `claude`, it prints the recording and exits 1, and :887 and :971 go through it via `failIn` (R8);
  - :114 builds its PATH;
  - new: `change new` with no `claude` exits 0, leaves `.specify`, and logs the flag (SC-003);
  - new: a stub failing with the recording is quoted as `claude not found` with no box-drawing character.
  :186-211 (JSON issues) are not edited. The new tests fail
- [X] T016 [P] [US2] Test first in test/change/grapher-refresh.test.ts: `withPath` (:97-106) builds its PATH. New: a grapher that prints `GRAPHIFY_0929_READONLY` and exits 1 is warned with its `PermissionError` line, no `Traceback` and no `File "`, and close exits 0. It fails
- [X] T017 [US2] src/lib/out.ts: `quoteFailure(err)` exactly as in R7. T014 passes
- [X] T018 [US2] Add `--ignore-agent-tools` to the speckit argv in src/adapters/registry.ts (:445-457). Its note gives the 1.0.6 reason without repeating MV-75's leg string. src/adapters/sdd.ts (:181-183) and src/adapters/refresh.ts (:121-127) use `quoteFailure(err)`, and refresh.ts keeps `said` and rewrites :116-120. doctor.test.ts:143's argv moves. T015 and T016 pass

## Phase 5: US1, US3 and US4 — every surface asks the lookup in its root (P1, P2)

- [X] T019 [US1] [US3] Tests first in the new test/change/binary-lookup.test.ts, on a constructed PATH; all fail:
  - opsx and graphify placed on PATH only, in `node_modules/.bin` only, in both, and nowhere. `doctor`, `change apply`'s validator, `change close`'s build, refresh and graph gate, and `doors`' post-edit entry agree (SC-002);
  - both: the PATH stub ran (a marker). `node_modules/.bin` only: close builds through it, and the settings refresh carries `$PWD/node_modules/.bin`;
  - nowhere, for all four shipped adapters: every missing line from the scaffold, the validator, the build or refresh, the graph gate and `doctor` names the binary, the adapter, the install line, `source`, `PATH` and `node_modules/.bin`. Exit codes are unchanged: new 0, apply 1, close 1, doctor 0 (SC-005);
  - a declared grapher says `declared in .multivac/config.yml`;
  - a copy in api's `node_modules/.bin` leaves the brain's missing.
- [X] T020 [P] [US1] Test first in test/doors/settings.test.ts: `refreshHookCmd`'s command, run by `sh -c` with `PATH=/usr/bin:/bin` in a dir whose `node_modules/.bin` holds a marker stub, writes the marker within 2 s. :167-197 are unedited. It fails
- [X] T021 [P] [US3] Move the retired wording (R8); the moved assertions fail:
  - sdd-gates :431-432, :458 and :752-753;
  - grapher-refresh :136 and :273;
  - grapher-gate :140;
  - doctor :107 (adds `source`);
  - doctor :297 builds its PATH, and doors.test.ts :238-245 uses a stub grapher on a built PATH, keeping its MV-52 title.
- [X] T022 [US1] [US3] src/adapters/sdd.ts:
  - `toolVerdict(spec, cmd, cwd)` asks `missingRequired` and `findBinary`, returns `bins: string[]`, and runs the found path;
  - `runScaffold` warns per root through `binaryMissing`, and `saidMissing` and :232-235 go;
  - `judgeSdd` (:454-468) refuses through it and keeps the `--no-sdd` line;
  - the `onPath` and `existsSync` imports go.
- [X] T023 [US1] [US3] src/adapters/refresh.ts: `refreshGraph` asks `missingRequired(spec, dir)`, says `skipped — ${binaryMissing(…)}`, and runs `sh -c` with PATH plus `localBin(dir)`, and :110-112 names `required`. `graphGate` (:258, :268) asks and prints the same
- [X] T024 [US1] [US3] src/commands/doctor.ts: ask `missingRequired` per root, delete both `binCache` (:202, :284), and print `binaryMissing` at :232, :312 and :314
- [X] T025 [US1] `projectInto` (:187-193) in src/commands/doors.ts asks `missingRequired(spec, dir)`. In src/doors/settings.ts, `refreshHookCmd` adds `PATH="$PATH:$PWD/node_modules/.bin";` after `REFRESH_HEAD`, and its doc says why (R4). T019–T021 pass

## Phase 6: US5 — the law says so (P3)

- [X] T026 [US5] `multivac count` the R10 legs, expecting 1, 0, 0, 4, 1, 1, each, 1, each, 0, each, 0 and 6. The five moved legs are green, and so are MV-66 :482-483, MV-75 :549, MV-115 :905 and MV-50 :294. Re-read MV-123 against the landed code (≤ ~400 words)
- [X] T027 [US5] Bite run (R12) in a scratch clone of the branch, never this repository: each of the five reintroductions gives exit 1

## Phase 7: Polish, copies and verification

- [X] T028 [P] Docs and copies, each citing MV-123 where it states the rule:
  - site/content/docs/reference/graphers-and-sdd.md: :12 and :32 (run means every `required` binary, on PATH or in the root's `node_modules/.bin`), :90-91 and :250 (samples), :206 (hook), :358-383 (argv), :393-395 (one line per repo; the cause, not "the tool's own stderr"), and :503-510 (refusal; the lookup in every root);
  - site/content/docs/reference/commands.md:1246;
  - DESIGN.md:1271 and :1287;
  - skills/multivac/references/change.md:142 and :180, with the identical .claude/skills copy;
  - src/types.ts:35, grapher-refresh.test.ts:2 and doctor.test.ts:285.
- [X] T029 MV-111 sweep: `git grep -nE 'binaryPresent|on PATH|stderr lines|three-line|binary not found|fact about the machine|own stderr|claude --force|beside the artifact' -- ':!specs' ':!.multivac/changes' ':!CHANGELOG.md' ':!docs' ':!internal' ':!graphify-out'`, skills included. Classify every hit: only MV-92's ladder, `preCommitGate`, the trackers and the law notes may still say "on PATH"
- [X] T030 Run `pnpm run build`, then `node dist/cli.js verify --strict` (0 blocking broken, MV-123 `proposed`), then `node --test "dist-test/**/*.test.js"`. All must be green (SC-007). Commit by pathspec every file plan.md lists, plus specs/048-one-binary-lookup/, and never graphify-out/
- [X] T031 /speckit.converge until Converged; fix any drift on the branch (/speckit.analyze runs before implementing, as `change apply` prints)

## Phase 8: Review fixes

- [X] T032 MV-123 in .multivac/invariants.md no longer writes FR-007 into law: "every call site keeps its outcome and exit code" becomes "what a call site does next is its own row's (MV-50, MV-52, MV-66, MV-75, MV-90)", so a later change may make a missing binary refuse without withdrawing a clause here. FR-007, plan and R11 say it binds this change only. "`binaries` keeps its 'any of' meaning" becomes "no command reads `binaries`", in the row, FR-005, US4 scenario 4 and the registry comment, because nothing in src reads it
- [X] T033 `quoteFailure` trims the same U+2500–U+259F range it drops, so a double or heavy box trims like a rounded one, and splits on `\r?\n`, so a CRLF traceback is found. test/lib/out.test.ts gains both cases; R7 says so
- [X] T034 Leg 11 (`each` over settings.ts and refresh.ts) was satisfied by settings.ts's doc comment with the hook's PATH append deleted. It is two `unique` legs on the code spellings, `PATH="$PATH:$PWD/node_modules/.bin";` and `localBin(dir)]`, so MV-123 has fourteen legs and the old legs 12 and 13 are 13 and 14. The row's mechanical sentence names them and the `each` legs. MV-52's moved leg on `missingRequired(spec, dir)` is `unique`: unquantified, it self-healed onto refresh.ts when doors.ts stopped matching. R10 and plan say so
- [X] T035 `findBinary` resolves a relative PATH entry against the root, so the path it returns is absolute and is the file `toolVerdict` executes from that root. `missingRequired` drops its unused `env`. adapters.test.ts gains the relative-entry case; R1 says so
- [X] T036 The sdd-gates specify stub pins its argv as a literal instead of reading the registry, and checks it after the `claude` branch, so it verifies the argv the registry ships (C57)
- [X] T037 Copies: src/doors/brain.ts:123-124 (MV-93's "the binary absent from PATH", wrapped past T029's grep and leg 13) names MV-123's lookup; skills/multivac/references/change.md:142 and its .claude/skills copy cite MV-123; the change file's claim names the denial and the last-lines fallback. A line-joined sweep for `on|from|in|probed|absent|missing` ending a line before `PATH` finds only MV-92's ladder (install.md:90) and sdd.ts:153, both true
- [X] T038 `node dist/cli.js doors` in the brain, with a stub `graphify` on a built PATH, re-projects .claude/settings.json: the refresh hook gains `PATH="$PATH:$PWD/node_modules/.bin";` and nothing else changes. plan.md lists it and brain.ts
- [X] T039 Re-run the build, the suite and `verify --strict`. On a scratch copy with MV-123 active and the change file aside, legs 2, 3, 5, 10, 11, 12, 13 and 14 and MV-52's `unique` leg each give exit 1, and no glob is rewritten. On compiled code, the old trim class, a `\n` split, `join` for `resolve` and an argv without `--here` each fail a test

## After the tasks — the lifecycle, not the ledger

1. Merge `--no-ff`, then `change land one-binary-lookup --landed brain`.
2. `change close one-binary-lookup`: walk the ritual, and commit the archive with
   the pathspec it prints.
3. Enactment of MV-123 (alone in its own commit, MV-81) and any push belong to
   the human.

## Dependencies and parallel work

- T002 precedes every edit, and T003–T008 precede every source edit.
- T009–T010 precede T011–T012, which precede all later code.
- Tests precede their code: T013–T016 before T017–T018, and T019–T021 before
  T022–T025.
- T018 and T022 share sdd.ts, and T018 and T023 share refresh.ts.
- In parallel: T009 with T010; T013, T014 and T016; T020 with T021; T028 with
  T029.
- T026–T031 come last.

## Implementation strategy

US1 and US2 are P1: two lookups that disagree, and a scaffold that fails for a
reason nobody is shown. US3 and US4 follow from the same lookup and line. US5's
legs describe every edit, so the change lands only as a whole.

> T031 closed in the real lifecycle (2026-09-14): `change apply` created the worktree on branch `one-binary-lookup`; the reviewed prep commit cherry-picked cleanly with `verify --strict` 0 blocking and the full suite green; the stage-4 verifier and stage-5b spec/plan/tasks fidelity review left no gap — converged.
