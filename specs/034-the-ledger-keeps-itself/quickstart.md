# Quickstart — proving the ledger keeps itself

## Before

```sh
# 1. another change's artifacts satisfy this change's gate
mkdir -p specs/003-rapid-points-expire-rollout && touch specs/003-rapid-points-expire-rollout/spec.md
mvac change new points-expire "Points expire"
mvac change plan points-expire         # proceeds — on somebody else's spec

# 2. an archived slug is reopened, and close overwrites the archive
ls .multivac/changes/archive/          # pick one
mvac change new <that-slug> "Again"    # accepted today

# 3. land leaves the tree dirty
mvac change land <slug> --landed brain
git status --porcelain .multivac       # not empty today
```

## After

1. `change plan` refuses: the directory does not END in the slug
2. `change new` refuses, naming the archive
3. `git status --porcelain .multivac` is empty — land committed its own bump
4. the commit `close` prints includes `.multivac/invariants.md`
5. `roadmap sync` against a failing tracker names the failure instead of
   guessing at its cause

## The suite

```sh
pnpm test
```

`test/change/lifecycle-polish.test.ts` no longer runs `git add -A` around the
land step: it runs the command the tool prints, which is what makes SC-004 an
assertion rather than a sweep.
