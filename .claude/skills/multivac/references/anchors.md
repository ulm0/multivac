# Anchors: the writing manual

An anchor is a content-based claim about the code: "in that repo, in those
files, something matches this". Write anchors so that verify failing means the
claim is actually in doubt.

`mvac help anchor` prints the grammar, the POSIX ERE dialect with its
translations, how lines and `.sql` statements match, the globs and exclusions,
and the modes. `mvac count '<repo>:<glob> /<regex>/'` dry-runs a leg with
verify's own matcher. What they leave to you:

- **CLAIM-ID** is explicit, never inferred from proximity: it is the join key
  for reporting and for `change close`.
- **repo-key** is the registry key in `.multivac/config.yml` (`api`), never the
  directory name. `*` is every declared repo plus the brain, so under `*` a bare
  exclusion exempts that path everywhere; qualify it to exempt one repo:
  `*:**.md !brain:07-rules.md /PIN/ absent`.
- **Append-only surfaces lie to `present`.** Over migrations a match proves
  "was built this way", never "still is": target the latest definition, or use
  `count=N` as the ratchet.
- **A glob over nothing fails loudly**: blocking for `absent`, `count` and
  `each`, broken for `present` and `unique`. Keep the glob tight enough to go
  empty on a rename.
- **`moved` self-heals** only a `present` leg with exactly one match of the
  include's own extension, outside `.multivac/`. Review the rewrite.

## Choosing the mode

**Anchor to contracts, not implementations** — migrations, schemas, route
tables, config keys, GRANTs. A widget body breaks on Tuesday; anchor an
implementation only when no contract site exists, and expect churn.

| you are pinning | mode |
| --- | --- |
| the rule was enacted (the revoke, the constraint, the check exists) | `present` |
| a dead mechanism stays dead — the tombstone | `absent` |
| a single source of a value | `unique` |
| "never again" over append-only history; a sanctioned exception stays the only one | `count=N` |
| every matched file satisfies the rule ("every manifest declares limits") | `each` |
| no matched file carries the pattern, and the offender is named per file | `each!` |

Put the teeth in the blocking modes and let `present` document the enactment.
Exempt a sanctioned file with an exclusion (`api:k8s/*.yaml !api:k8s/debug.yaml`).
A **cross-file relation** ("the vendored copy equals the root copy") is not a
quantifier and nothing in the grammar says it, on purpose: leave it unanchored.

```markdown
| INV-90 | Every deployment is confined: limits declared, never privileged. | published | active | 2026-08-14 | map |
<!-- @anchor INV-90 api:k8s/*.yaml /limits:/ each -->
<!-- @anchor INV-90 api:k8s/*.yaml /privileged:[[:space:]]*true/ each! -->
```

## The legs pattern

One claim, several legs, all must hold — enactment, tombstone, ratchet:

```markdown
| INV-01 | Nobody has UPDATE on `accounts`, not even `admin_role`. | published | active | 2026-08-13 | map |
<!-- @anchor INV-01 api:db/migrations/*.sql /revoke[[:space:]]+update[[:space:]]+on[[:space:]]+[^[:space:]]*accounts/i -->
<!-- @anchor INV-01 api:db/migrations/*.sql /grant[[:space:]]+update[[:space:]]+on[[:space:]]+[^[:space:]]*accounts/i absent -->
<!-- @anchor INV-01 api:db/migrations/*.sql /update[[:space:]]+accounts/i count=1 -->
```

The `present` proves the rule was enacted; the `absent` kills the re-grant;
the `count=1` pins the one sanctioned `update accounts` in history.

A tombstone can cross repos:

```
<!-- @anchor INV-42 *:AGENTS.md /(^|[^[:alnum:]_])legacy_token([^[:alnum:]_]|$)/ absent -->
```

## Before committing an anchor: two self-checks

1. **Misfire — name a refactor that breaks it while the claim stays true.** A
   rename? Only a one-match `present` self-heals; an `absent` glob renames to
   vacuity and blocks. Equivalent SQL? Widen to the invariant part
   (`[^[:space:]]*accounts` survives schema-qualification).
2. **False green — name a violation that passes it.** `GRANT ALL` past an
   `absent` on `grant update`? Add a leg. A bypass that never says the guarded
   word (an upsert)? Kill it with its own `absent` leg.

If you cannot name either, you do not understand the claim yet: reread the
contract site.

## Not everything anchors

A meta-rule or a process rule anchors to nothing. Leave it unanchored: it is
legal and counted, and the report never pretends to have verified it. Never
invent a decorative anchor to move a coverage number.
