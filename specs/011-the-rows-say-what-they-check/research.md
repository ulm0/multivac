# Research: The rows say what they check

Phase 0. Nine claims, each re-verified against the current code before being
accepted. **One was rejected.**

---

## The ledger

| # | claim | verdict | direction |
| --- | --- | --- | --- |
| 1 | MV-46: "`add -A` appears nowhere in the lifecycle" | **false** | code moves |
| 2 | MV-45: `--abandon` skips the anchor condition and inverts the ordering | **false** | code moves |
| 3 | MV-51: "the ONE subprocess it may spawn is the validator" | **false since MV-75** | row moves |
| 4 | MV-56: "shells out for validation only" | **false since MV-75** | row moves |
| 5 | MV-31: documents "entries marked unsupported" | **dead clause** | row moves |
| 6 | MV-57: STALE by mtime | **true, ceiling unstated** | row gains its limit |
| 7 | MV-21: "a path a `package.json` script names" | **true, ceiling unstated** | row gains its limit |
| 8 | `CONTRIBUTING.md`: "mark it unsupported" | **contradicts MV-28** | document moves |
| 9 | `DESIGN.md`: ripgrep engine, sha cache | **neither exists** | document moves |
| — | MV-10: staleness gating | **ACCURATE — cleared** | nothing |

---

## D1 — MV-46, and why the leg is worse than the claim

```
change.ts:461   await gitRun(abs, ['add', '-A']);      ← greenfield(), the real call
change.ts:874   // ... never `add -A`, which in a      ← the only line the leg sees
```

The leg is `/add -A/ count=1`. Those bytes appear once in the file — **in a
comment asserting the opposite of what the code does 400 lines above it.** The
call spells the flag as `['add', '-A']` and is invisible to the pattern.

So the row's most emphatic clause has been green on every commit since it was
written, on evidence that is a sentence about the code.

**Decision: the code moves.** `greenfield()` writes exactly one file, so it can
name it: `git add AGENTS.md`. The row's claim becomes literally true rather than
nearly true, and the leg becomes an `absent` over `src/**` for the argv form —
which is what someone would actually write if they swept a tree.

**Why not amend the row to "except in a repo it just created".** The exception
is real and harmless today, and it would still be an exception nobody can check:
`greenfield` growing a second written file would silently widen the sweep, with
the row's escape clause covering it. Naming the file costs one line and removes
the exception entirely.

---

## D2 — MV-45, and the hazard `--abandon` reopens

The normal close, `change.ts:859-869`:

```ts
const anchored = await anchoredClaimIds(brain);   // BEFORE the archive
const dest = await archiveChange(brain, parsed);
const released = await releaseUnused(brain, slug, anchored);
```

`--abandon`, `change.ts:816-818`:

```ts
const dest = await archiveChange(brain, parsed);        // archive FIRST
const freed = await releaseUnused(brain, slug, new Set<string>());   // EMPTY
```

The row states two things `--abandon` does not do: that release requires "no
anchor names its ID", and that the anchor set is read before the archive moves
the change file out of tracked sight.

**The counter-argument, and why it does not hold.** `--abandon` refuses a change
declaring any claims, so how could an anchor name the reserved ID? By hand. A
reserved ID with an anchor written against it, in a change that declared no
claims, is released back to the pool with a live reference pointing at it — and
the next `change new` hands that ID to somebody else. That is MV-26's collision
by another road, and the guard against it is a set the sibling path already
computes.

**Decision: the code moves.** `--abandon` reads the anchor set before archiving,
exactly as close does, and passes it. The row is already correct.

---

## D3 — MV-51 and MV-56 were true when written, and MV-75 made them false

Both say the lifecycle shells out for validation and nothing else; MV-51 calls
the validator "the ONE subprocess it may spawn".

MV-75 deliberately added a second: the SDD's own init, which reaches the
network, to break the deadlock where declaring an SDD made the change that
installs it unplannable.

`sdd.ts:191` already reads "besides the tool's own validator". **The code
documented the second subprocess; the two rows never caught up.**

**Decision: the rows move**, and gain the count and the reason rather than
losing the claim — the point they defend is that no *fake step* is ever
invoked, and that survives intact.

---

## D4 — Two ceilings, kept as claims

**MV-57's STALE** compares the file's mtime to the law's newest row date
(`doctor.ts:149`). Git does not record mtimes: a fresh clone stamps every file
at checkout, so the constitution always looks newer than the law and STALE
cannot fire — for the reader most likely to need it. It is a real signal on the
machine that edited the file and silent everywhere else.

**MV-21's script detection** is `scripts.includes(file)`, whose own `ponytail:`
comment says it "misses paths a script builds by concatenation". A substring
test also matches a path that merely appears inside a longer one.

**Decision: state the limit, keep the claim.** Both do what they say most of the
time, and withdrawing them would be as inaccurate as leaving them unqualified.
Principle II asks for the honest statement, which here is the claim plus where
it stops.

---

## D5 — MV-10 is accurate, and that is a result

`verify.ts:208` is `const gates = gate && behind !== '?'`. An unresolvable
channel yields `'?'`, so it reports and never gates — exactly what the row says,
including the part the audit doubted.

Recorded because a cleared finding that goes unwritten is one the next reader
raises again, with the same reasonable suspicion and the same cost.
