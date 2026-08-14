# Anchors: the writing manual

An anchor is a content-based claim about the code: "in that repo, in those
files, something matches this". Lines move on the first commit; content
survives. Write anchors so that verify failing means the claim is actually
in doubt.

## Grammar

One leg per line, an HTML comment directly under the claim's row:

```
<!-- @anchor <CLAIM-ID> <repo-key>:<glob> [![<repo-key>:]<glob> ...] /<regex>/[flags] [mode] -->
```

- **CLAIM-ID** is explicit, never inferred from proximity. It is the join
  key for reporting and for `change close`.
- **repo-key** is the registry key from `.multivac/config.yml` (`api`),
  never the directory name (`acme-api`). `*` = every declared repo plus the
  brain itself.
- **`!<glob>`** excludes, applied after the include. The surviving file set
  is what gets matched — and what counts toward vacuity.
- **`!<repo-key>:<glob>`** excludes in that repo only. Bare exclusions are
  repo-relative and bite in every repo the leg evaluates, so under `*` they
  exempt the path's namesake everywhere. Qualify to exempt one repo —
  `*:**.md !brain:07-rules.md /PIN/ absent` is "nowhere, except the page in
  the brain that carries the tombstone". An undeclared repo key is a parse
  error naming it; a qualifier in a single-repo leg is legal and redundant.
- **Flags**: `i` only.
- **mode**: `present` (default), `absent`, `unique`, `count=N`.
- **One include glob per leg** — alternate paths with braces
  (`api:{src,lib}/**/*.ts`); only exclusions repeat.
- `mvac help anchor` prints this grammar on one screen; `mvac count
  '<repo>:<glob> /<regex>/'` dry-runs a leg (per-file breakdown, verify's
  own matcher) so a `count=N` ratchet is right the first time.

## Dialect: POSIX ERE, enforced

The one dialect every engine on every machine executes the same way.
`\s` `\b` `\d` `\w` are **rejected at parse time** — macOS git grep drops
them silently, which turns a tombstone into a vacuous pass. Translate:

| PCRE | POSIX |
| --- | --- |
| `\s` | `[[:space:]]` |
| `\d` | `[[:digit:]]` |
| `\w` | `[[:alnum:]_]` |
| `\b` | `(^|[^[:alnum:]_])` … `([^[:alnum:]_]|$)` |

## Matching rules you must know

- **`.sql` files match per statement, not per line.** Comments stripped,
  whitespace collapsed, split on `;`. Real DDL splits one GRANT across
  lines; a per-line tombstone over DDL has an escape by construction.
  Other files match per line — so on non-SQL surfaces keep each leg's
  pattern on one physical line of the target.
- **Append-only surfaces (migrations) lie to `present`.** A match proves
  "was built this way", never "still is"; `unique`/`count` conflate history
  with HEAD. Over migrations either target the latest definition of the
  object, or use `count=N` as the ratchet.
- **Vacuous globs fail loudly.** A glob that matches zero tracked files is
  a blocking failure for `absent`/`count` (a directory rename must not
  silently green a tombstone) and broken for `present`/`unique`.
- **`moved` self-heals.** A `present` leg with exactly one match outside
  its glob gets its glob rewritten in place, exit 0. Review the diff.

## Choosing the mode

**Anchor to contracts, not implementations** — migrations, schemas, route
tables, config keys, GRANTs. A contract site is the most stable thing to
anchor to; a widget body breaks on Tuesday. If you find yourself anchoring
to an implementation, first ask whether a contract site exists for the
claim; only anchor the implementation when there is none, and expect churn.

| you are pinning | mode |
| --- | --- |
| the rule was enacted (the revoke, the constraint, the check exists) | `present` |
| a dead mechanism stays dead — the tombstone | `absent` |
| a single source of a value | `unique` |
| "never again" over append-only history; a sanctioned exception stays the only one | `count=N` |

`absent` and `count` block; `present` and `unique` report. Put the teeth in
the blocking modes and let `present` document the enactment.

## The legs pattern

One claim, several legs, all must hold. The canonical shape — enactment,
tombstone, ratchet, bypass-killer:

```markdown
| INV-01 | Nobody has UPDATE on `accounts`, not even `admin_role`. | published | active | 2026-08-13 | map |
<!-- @anchor INV-01 api:db/migrations/*.sql /revoke[[:space:]]+update[[:space:]]+on[[:space:]]+[^[:space:]]*accounts/i -->
<!-- @anchor INV-01 api:db/migrations/*.sql /grant[[:space:]]+update[[:space:]]+on[[:space:]]+[^[:space:]]*accounts/i absent -->
<!-- @anchor INV-01 api:db/migrations/*.sql /update[[:space:]]+accounts/i count=1 -->
```

The `present` proves the rule was enacted; the `absent` kills the re-grant;
the `count=1` pins the one sanctioned `update accounts` in history — any
new occurrence breaks it.

A tombstone can cross repos:

```
<!-- @anchor INV-42 *:AGENTS.md /(^|[^[:alnum:]_])legacy_token([^[:alnum:]_]|$)/ absent -->
```

## Before committing an anchor: two self-checks

Run both. An anchor that fails either is not ready.

1. **Misfire check — name a refactor that breaks it while the claim stays
   true.** File rename? The glob self-heals only for `present` with one
   match — an `absent` leg's glob renames to vacuity and blocks. Statement
   rewritten in equivalent SQL? Widen the pattern to the invariant part
   (`[^[:space:]]*accounts` survives schema-qualification; a literal
   `public.accounts` does not).
2. **False-green check — name a violation that passes it.** A grant via
   `GRANT ALL`? Your `absent` on `grant update` misses it — add a leg. A
   bypass that never says the guarded word (an upsert instead of an
   update)? Kill it with its own `absent` leg. A directory rename? Vacuity
   catches the glob, but only if the glob is tight enough to go empty.

If you cannot name either, you don't understand the claim yet — reread the
contract site before anchoring it.

## Not everything anchors

A meta-rule or a process rule anchors to nothing. Leave it unanchored: it
is legal and counted, and the report never pretends to have verified it.
Do not invent a decorative anchor to move a coverage number.
