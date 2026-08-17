---

description: "Task list for the-docs-say-what-ships"
---

# Tasks: The docs say what ships

**Input**: Design documents from `/specs/008-the-docs-say-what-ships/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md),
[research.md](./research.md), [data-model.md](./data-model.md),
[contracts/release.md](./contracts/release.md),
[quickstart.md](./quickstart.md)

**Tests**: yes, but nothing new is written. Research D2 decides that MV-77's
existing `site-version.test.ts` already covers the half MV-84's leg cannot, and
that a second test would restate it.

## Format: `[ID] [P?] [Story] Description`

- **[P]** — can run in parallel; different files, no dependency
- **[Story]** — US1 (the install page tells the truth), US2 (the upgrader is
  warned), US3 (the rule holds next time)

---

## Phase 1: Setup

- [X] T001 Read `git diff --stat v0.2.0..main -- src/ test/` and confirm the
      changelog will describe **that** diff and not the change files' ambitions.
      Research D3 already found one trap here: `parse.ts`'s diff is a refactor,
      and crediting the release with a parser change would be a lie in the one
      file whose job is to be believed.

**Checkpoint**: the release's actual content is known, from the diff.

---

## Phase 2: Foundational (blocks the release)

- [X] T002 `package.json`: `0.2.0` → `0.3.0`. Nothing else in the manifest.
- [X] T003 `site/content/_index.md`: badge `v0.2.0` → `v0.3.0`.

**Checkpoint**: `pnpm test -- --test-name-pattern="version"` fails on the
changelog and passes on the badge — the entry does not exist yet, which is
exactly what MV-78 should be saying at this moment.

---

## Phase 3: US2 — the upgrader is warned (P1)

**Goal**: a person on 0.2.0 can say what will newly go red in their repository
before they upgrade.

- [X] T004 [US2] Write the `## 0.3.0 — 2026-08-17` entry at the top of
      `CHANGELOG.md`, newest first.
- [X] T005 [US2] Under **Changed — read before upgrading**: the anchor scanner
      (MV-82). State what used to happen (any line containing the substring
      `@anchor` was skipped), what happens now (a line is skipped only when it
      carries a complete anchor comment, opener and `-->`), and who is affected
      (any repo with a source line mentioning `@anchor` that is not a complete
      anchor comment — those lines were invisible and are now scanned, so a
      tombstone or a ratchet over them can start refusing). Say plainly that a
      new red here is the fix working, not a regression.
- [X] T006 [US2] State the ceiling in the entry as the row states it: a line
      carrying both the opener and `-->` still hides, anywhere on the line, in
      any file, well-formed or not. A release note that implies the hole is
      closed is the same failure as a row that does.
- [X] T007 [US2] Under **Documentation**: MV-83, the site self-hosting its two
      typefaces. Not under "read before upgrading" — an installed tool is
      unaffected by the website's typeface.
- [X] T008 [US2] Verify SC-004 by eye: read the entry as somebody running 0.2.0
      on their own repository.

**Checkpoint**: `pnpm test -- --test-name-pattern="changelog"` green — entry
exists for the declared version, newest first, and the site still mounts rather
than copies it.

---

## Phase 4: US1 — the install page tells the truth (P1)

**Goal**: no page claims a release state the manifest contradicts.

- [X] T009 [US1] `site/content/docs/guide/install.md`: the `mvac --version`
      block prints `1.0.0`. It has never printed that. Correct it, and check
      the surrounding `--help` output against what the binary prints today
      rather than assuming only the number is stale.
- [X] T010 [US1] `install.md`: the warning callout says the version is `1.0.0`
      "while the package is `private: true` and unreleased". There is no
      `private` field in `package.json` and three versions are published. The
      callout's whole premise is gone — remove it rather than patch its number,
      and say instead what is true: the version string is the manifest's, and
      MV-77 holds the site's copy equal to it.
- [X] T011 [US1] `install.md:45` "An early build, pre-release." — false since
      0.1.0. Replace with something true about maturity that does not restate a
      version (FR-005).
- [X] T012 [US1] `site/content/_index.md` "Where this is": "An early build,
      pre-release, `npx multivac init` away." Same correction, same constraint.
- [X] T013 [US1] **Leave `install.md:50` alone** — "to run an unreleased commit"
      describes a commit somebody cloned, not the project's release state, and
      rewriting it makes the page worse (data-model).
- [X] T014 [US1] Verify SC-002:
      `grep -rniE "pre-release|prerelease|unreleased|private: true|early build" site/content/ README.md CONTRIBUTING.md`
      returns nothing but the legal `unreleased commit`.

**Checkpoint**: the install page can be read beside the released binary without
a contradiction.

---

## Phase 5: US1 continued — every other confirmed finding (P1)

**Goal**: nothing the audit confirmed is carried forward (FR-010, SC-005).

- [X] T015 [US1] Take the documentation audit's confirmed findings — each one
      quoting a line and citing the source or row that makes it false — and fix
      every one in this change.
- [X] T016 [US1] Record both counts in this file: how many were confirmed, how
      many fixed. SC-005 requires them equal. A finding deferred is written here
      with its reason, not dropped.
- [X] T017 [US1] Findings the audit **withdrew** under refutation are recorded
      too, briefly. A retracted finding is evidence the check works; deleting it
      leaves the next reader to raise it again.

---

## Phase 6: US3 — the rule holds next time (P2)

- [X] T018 [US3] Write the MV-84 row in `.multivac/invariants.md`, replacing the
      `RESERVED` placeholder. It must state the rule, the reason (`install.md`
      said `1.0.0` and `private: true` under a law table with 83 anchored rows,
      because no row covered prose about the release), the **scope** (the site's
      pages only — `DESIGN.md`'s versions are facts about other software), and
      the **division of labour**: `count` is a deletion ratchet and cannot notice
      the badge being swapped for a lie elsewhere; MV-77's test is what asserts
      the badge exists and equals the manifest. Name MV-68, MV-77, MV-78 by ID.
      Leave the row `proposed`.
- [X] T019 [US3] Add the leg
      `brain:site/content/** /[0-9]+\.[0-9]+\.[0-9]+/ count=1`, validated with
      `count` before it is written.
- [X] T020 [US3] Prove it in both directions per `quickstart.md`: append a
      version string to a concept page, `verify --strict` exits 1 naming MV-84
      and the file; revert, it passes. **A leg seen only green has not been
      tested.**
- [X] T021 [US3] Prove the other half too: delete the badge line, confirm
      `site-version.test.ts` fails with `no longer carries the version badge
      this test pins`, restore. The pair is the rule; demonstrate the pair.

---

## Phase 7: Ship

- [X] T022 `pnpm run build && pnpm test && node dist/cli.js verify --strict`.
- [X] T023 `pnpm run build && pnpm test && node dist/cli.js verify --strict` on
      the branch, then land it into `main`, `change land --landed brain`, and
      `change close the-docs-say-what-ships`.

### After close — the ship sequence, in order

These are not implementation tasks and are not checkboxes: they happen after
`close` archives the change, and `close` is one of them. Listed so the order is
on the record.

1. Push `main`; wait for CI green on that commit.
2. Tag `v0.3.0` on that commit and push the tag. The publish job re-checks
   `v$(package.json version)` against `$CI_COMMIT_TAG` and publishes by OIDC
   (MV-68). Nothing about publishing is modified by this change.
3. Watch the publish job. A red one means the four version sites did not agree;
   the fix is the manifest, never the check.
4. Confirm the artifact: `npm view multivac version` reports `0.3.0`. This is
   the one step that reaches the network, it is not a gate, and it runs after
   the fact.
5. MV-84 stays `proposed`. Only a human enacts a row — offer it, do not flip it.

---

## Dependencies

```
T001
 └─> T002, T003  (foundational)
       ├─> US2  T004–T008
       ├─> US1  T009–T014  [P] with US2
       │        └─> T015–T017  (needs the audit's confirmed list)
       └─> US3  T018–T021    [P] with both
             └─> Ship  T022–T028  (strictly sequential)
```

US1 and US2 are independent after T003. US3's leg depends on T009–T015 having
removed the extra version strings — written before them, the `count=1` would be
wrong and would have to be edited twice.

## Notes

- **Never `--no-verify`.** A refusing hook is the finding.
- The tag is pushed **after** the agreement exists locally, so the CI check
  confirms rather than discovers (research D4).
- `npm version` is not used: it writes the manifest and the tag under one hand
  and makes the CI check compare a value to itself.

---

## What the run recorded

### SC-005 — the counts

The audit ran as five parallel readers over disjoint slices, each finding
adversarially refuted by an independent agent told to default to *not a
finding*.

| | count |
| --- | --- |
| raised | **41** |
| refuted and withdrawn | 7 |
| confirmed by refutation | **21** |
| **never judged — the harness dropped them** | **13** |
| verified by hand afterwards and found true | 12 |
| verified by hand and deferred, with reason | 1 |
| **fixed in this change** | **33** |

**The harness silently truncated its own work, and that is worth writing down
rather than burying.** The verify stage was written `.slice(0, 6)` per slice —
a cap put there without thinking about what would exceed it. Four of the five
slices raised more than six, so 13 findings went to no verifier and would have
been reported as "21 confirmed, 7 withdrawn": a complete-looking answer over a
third of the work that never ran. It was caught only because the arithmetic did
not close — 21 + 7 is not 41.

Twelve of the thirteen were then verified by hand against the source, and every
one held. They were not marginal: `ripgrep` and a `.multivac/cache/`
sha-keyed cache named in the architecture page, neither of which exists
anywhere in `src/`; statement normalization claimed for "config surfaces" when
`src/anchor/normalize.ts` applies it to `.sql` alone; a `stale` line printing
`multivac repos sync`, which the code deliberately stopped printing because it
fetches and never moves the pin; `apply` documented as branching from
`origin/main` when it resolves `origin/HEAD` -> `init.defaultBranch` -> `main`
-> `master`; `new` documented as *running* the SDD's propose step when `runSdd`
(`src/commands/change.ts:89`) only prints it. A cap that drops a third of the
input is the same defect class this project exists to catch — **no silent
caps**, and the number dropped belongs in the report.

### The one deferred finding, with its reason

`site/content/docs/reference/commands.md:953` documents exit **2** for "unknown
flag". Measured:

```
$ mvac init . --providers x   ; echo $?   -> 1
$ mvac verify --bogus         ; echo $?   -> 2
$ mvac bogus                  ; echo $?   -> 2
```

`init` refuses an unknown flag by throwing, and the dispatcher maps a thrown
error to 1. **The documentation states the intended contract and the code is
inconsistent with it**, so this is a code defect wearing a documentation
finding's clothes. Editing the page to say "1, except when it is 2" would
enshrine the inconsistency in the law's own reference. Deferred to its own
change, which is a behaviour fix rather than a release note.

### T020/T021 — the pair, both directions

- **MV-84 bites**: appending `Built against 9.9.9.` to `philosophy.md` and
  simulating the post-close state (row `active`, no open change declaring it)
  gives `broken MV-84 [count] - count=1 pinned, found 2` naming both files, and
  **exit 1**. Reverted: exit 0. While the change is open the same violation
  reports `pending` and does not block — MV-17, working as written.
- **MV-77 covers what MV-84 cannot**: deleting the badge line drops the count to
  0, which MV-84 reads as satisfied, while `site-version.test.ts` fails with
  `no longer carries the version badge this test pins`. The ratchet cannot see a
  swap; the test can. Both were run.

### T001 — what the diff actually contained

`git diff --stat v0.2.0..main -- src/ test/` is four files. `src/anchor/parse.ts`
is a **refactor only** — the inline literal became the exported `ANCHOR_LINE`
and its behaviour is unchanged — so the changelog credits the release with one
behaviour change, not two.
