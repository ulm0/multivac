# Quickstart: validating the roadmap state

Prerequisites: a checkout of this repo, `pnpm install`, and `pnpm test`
green on `main` before starting.

Build and run the local CLI, never a published one:

```bash
pnpm build
node dist/cli.js roadmap
```

## Scenario 1 — record an intention (SC-001)

```bash
node dist/cli.js roadmap add try-a-thing "Try a thing"
git status --porcelain
```

Expect: one line, the new `.multivac/changes/try-a-thing.md`, already committed
by the tool. Expect no new branch (`git branch --list try-a-thing` is empty), no
worktree, and no new row in `.multivac/invariants.md`.

## Scenario 2 — the listing (US1)

```bash
node dist/cli.js roadmap add later-thing "A later thing"
node dist/cli.js roadmap add now-thing "A now thing" --horizon now
node dist/cli.js roadmap
```

Expect: `now` before `later`, alphabetical within each group, no empty
horizon printed, and an `in flight:` line counting open changes separately.

## Scenario 3 — promotion preserves the prose (SC-002)

```bash
printf '\nA paragraph written when the idea was young.\n' >> .multivac/changes/try-a-thing.md
git add -A && git commit -m "edit the intention by hand"
node dist/cli.js change new try-a-thing
grep -c "written when the idea was young" .multivac/changes/try-a-thing.md
ls .multivac/changes/ | grep -c try-a-thing
```

Expect: `promoted`, an id reserved at that moment, the paragraph still present,
and exactly one file for the slug.

## Scenario 4 — a roadmap never delays a release (SC-003)

```bash
node dist/cli.js verify --strict
```

With planned changes present and no open change finished, expect zero unclosed
changes reported and exit 0. Add ten more planned changes and re-run: the
number must not move.

## Scenario 5 — the roadmap is not a gate (SC-004)

```bash
node dist/cli.js change new never-planned "Something nobody wrote down"
```

Expect: it works, with no mention of the roadmap.

```bash
grep -rn "on the roadmap" src/ | grep -i "refus\|must\|requir"
```

Expect: no match. MV-89's `absent` leg asserts the same thing in the law.

## Scenario 6 — refusals (US2, edge cases)

```bash
node dist/cli.js roadmap add try-a-thing "Again"          # already open
node dist/cli.js roadmap add later-thing "Again"          # already planned
node dist/cli.js change plan later-thing                  # planned, not started
node dist/cli.js roadmap add x "X" --horizon someday      # unknown horizon
```

Expect four distinct refusals, each naming the state it found and the command
that moves forward, per [contracts/cli-output.md](./contracts/cli-output.md).

## Cleanup

These scenarios write real change files and real commits. Run them in a
scratch clone, or reset afterwards:

```bash
git reset --hard origin/main && git clean -fd .multivac/changes
```
