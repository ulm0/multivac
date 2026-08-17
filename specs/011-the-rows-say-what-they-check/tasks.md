---

description: "Task list for the-rows-say-what-they-check"
---

# Tasks: The rows say what they check

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md),
[research.md](./research.md), [data-model.md](./data-model.md),
[contracts/corrections.md](./contracts/corrections.md),
[quickstart.md](./quickstart.md)

---

## Phase 1: The code moves (P1)

- [X] T001 [US1] `greenfield()` stages the one file it wrote —
      `['add', 'AGENTS.md']` — instead of sweeping with `-A`.
- [X] T002 [US1] Re-point MV-46's leg from `/add -A/ count=1`, which matched
      only a comment, to an `absent` over `src/**` for the argv form.
- [X] T003 [US1] **Demonstrate the new leg failing**: write a sweep back into a
      lifecycle command, `verify --strict` names MV-46, revert. The old leg
      stayed green through exactly this, which is why the demonstration is the
      deliverable and not the fix.
- [X] T004 [US1] `--abandon` reads the anchor set **before** archiving and
      passes it to `releaseUnused`, as the other close path does.
- [X] T005 [US1] Test: a reserved ID with an anchor naming it is not released by
      `--abandon`. Must fail without T004.
- [X] T006 [US1] Test: `greenfield` stages its door rather than the tree. Must
      fail without T001.

## Phase 2: The rows move (P1)

- [X] T007 MV-51: withdraw "the ONE subprocess"; name both — the tool's own
      validator and the declared scaffold (MV-75) — keeping the invariant that
      survives: no *fake step* is ever invoked.
- [X] T008 MV-56: same correction to "shells out for validation only".
- [X] T009 MV-31: withdraw "including the entries marked unsupported" with a
      dated note; MV-28 removed that kind.

## Phase 3: The rows gain their limit (P1)

- [X] T010 MV-57: keep the STALE claim, state that it is mtime-based and that
      git does not preserve mtimes — silent on a fresh clone, real only where
      the file was edited.
- [X] T011 MV-21: keep the claim, state that the script match is a substring
      test that misses concatenated paths and matches a path inside a longer one.

## Phase 4: Documents (P2)

- [X] T012 `CONTRIBUTING.md`: replace "mark it unsupported with the reason" with
      what MV-28 requires — no entry at all — and cite the row.
- [X] T013 `DESIGN.md`: remove the `ripgrep` engine and the sha-keyed cache;
      state the mechanism that exists.

## Phase 5: Close

- [X] T014 Record the cleared finding: MV-10 examined and accurate, with the
      line that cleared it.
- [X] T015 `pnpm run build && pnpm test && verify --strict`; changelog under
      Unreleased; land; close.

### After close

No row changes state. This change adds no law and enacts nothing.

## Notes

- **Direction before fix.** Two of the eight move the code, and correcting them
  in the table instead would be relaxing an invariant in code.
- Never `--no-verify`.

---

## What the run recorded

**Nine examined, eight confirmed, one cleared — and the counts match** (SC-001).
MV-10 is accurate: `verify.ts:208` is `gates = gate && behind !== '?'`, so an
unresolvable channel reports and never gates, including the part the audit
doubted. Recorded so the next reader does not re-raise it.

**Direction mattered for two of the eight.** The reflex on an audit finding is
to correct the prose; for MV-45 and MV-46 that would have been relaxing an
invariant in code, which the constitution forbids outright. Both rows state the
behaviour the tool should have, so the code moved to them.

**The mutations, both directions:**

- `--abandon`'s fix reverted → the named test fails. Restored → 10/10.
- The sweep written back into `greenfield` → MV-46's **new** leg names it at
  `change.ts:466`. Under the old leg this was green, which is the entire
  finding: `/add -A/ count=1` matched a comment reading "never `add -A`" while
  the call `['add', '-A']` was invisible to the pattern.

**One test was dropped as redundant.** A first pass asserted in TypeScript that
`src/commands/change.ts` contains no `['add', '-A']` — which is the `absent` leg
written a second time, in a language that cannot see the other repos the leg
covers. The leg does it, and it was demonstrated failing.

**Two test defects of my own, worth naming.** The first version of the
`--abandon` test matched `/\| (MV-\d+) \|/` against the scratch fixture, which
numbers its rows `INV-nn`; the regex never matched and the failure looked like a
product bug. The second shared the file's ecosystem with nine earlier tests and
failed on their leftover state. It now builds its own — the assertion is about a
reservation's fate, not about surviving its neighbours.

**MV-46 reports `pending` rather than blocking during this change**, because the
change declares it as a claim and MV-17 makes a declared claim pending. It
blocks from the moment this change closes.
