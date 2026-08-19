# Quickstart — proving the paraphrase stopped ageing

## Before

```sh
grep -rn "runtime dependency count is two\|Two runtime dependencies\|pins two runtime" \
  .specify CONTRIBUTING.md site .multivac/invariants.md test/
# six hits, none of them the amended row
```

## After

```sh
mvac count 'brain:** /pins two runtime dependencies/'      # 0
mvac count 'brain:** /dependency count is two/'            # 0
mvac verify                                                # 0 blocking broken
```

And the mechanism, which is the part that matters: MV-111's leg means the next
amendment that leaves a copy behind fails `verify` instead of surviving to an
audit.

## The skill

```sh
# the syntax it teaches must be the syntax the parser takes
grep -n 'landing_order' skills/multivac/references/change.md
mvac change plan <slug>    # after following it — parses
```

## The first minutes

```sh
T=$(mktemp -d) && cd "$T" && git init -q .
mvac init --quiet .
# the closing report now names the commit
mvac change new "points expire"    # succeeds after following it
```

## The suite

```sh
pnpm test
```
