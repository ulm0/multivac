# Quickstart: check the corrections, and break them

## The blind leg, before and after *(gated)*

```sh
grep -n "add -A" src/commands/change.ts        # the comment the old leg matched
grep -n "'add', '-A'" src/commands/change.ts   # the call it could not see
mvac count 'brain:src/** /\[.add., .-A.\]/'    # after: 0 matches
```

Then write a sweep back into any lifecycle command and run
`mvac verify --strict`. It must refuse and name MV-46. Under the old leg it
stayed green — that is the whole finding.

## `--abandon` honours the condition *(gated)*

```sh
pnpm test -- --test-name-pattern="abandon"
```

Reverting the `--abandon` fix must fail a named test. The behaviour: a reserved
ID with an anchor written against it is **not** released, on either close path.

## The documents agree with the law *(gated)*

```sh
grep -rn "unsupported" CONTRIBUTING.md          # expect nothing instructive
grep -rn "ripgrep\|multivac/cache" DESIGN.md    # expect nothing
```

## The rows read against their code *(by eye)*

For each of MV-21, MV-31, MV-45, MV-46, MV-51, MV-56, MV-57: open the row and
open the code it names, and confirm the row states what the code does and where
it stops. This is the check that cannot be automated — a row can be green and
still say more than its legs prove, which is how all eight got here.

## The cleared one

```sh
grep -n "gates = gate && behind" src/commands/verify.ts
```

MV-10 says an unresolvable channel reports and never gates. `behind !== '?'` is
that guarantee. Examined, accurate, unchanged.
