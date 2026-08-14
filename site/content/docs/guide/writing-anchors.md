---
title: Writing anchors
weight: 3
---

An anchor is a content-based claim about the code: "in that repo, in those
files, something matches this". Lines move on the first commit; content
survives. Write anchors so that a verify failure means the claim is
actually in doubt.

## Grammar

One leg per line, an HTML comment directly under the claim's row in
`.multivac/invariants.md` — invisible when rendered, greppable, no parallel file to
drift:

```txt
<!-- @anchor <CLAIM-ID> <repo-key>:<glob> [!<glob> ...] /<regex>/[flags] [mode] -->
```

- **CLAIM-ID** is explicit, never inferred from proximity. It is the join
  key for reporting and for `change close`.
- **repo-key** is the registry key from `.multivac/config.yml` (`api`),
  never the directory name (`acme-api`). `*` = every declared repo plus the
  brain itself.
- **glob** is a picomatch pattern over repo-relative, `/`-separated paths
  (what `git ls-files` prints): `**` crosses directories, `{a,b}`
  alternates, dotfiles match. Not shell, not regex — `src/*.ts` misses
  `src/lib/git.ts`, so write `src/**/*.ts`.
- **`!<glob>`** excludes, applied after the include. The surviving file set
  is what gets matched — and what counts toward vacuity.
- **Flags**: `i` only.
- **mode**: `present` (default), `absent`, `unique`, `count=N`.

A claim may carry several legs; legs AND together. On failure the claim
inherits the worst failing leg's severity, and verify reports per leg.

## Dialect: POSIX ERE, enforced

The one dialect every engine on every machine executes the same way.
`\s` `\b` `\d` `\w` are rejected at parse time — macOS `git grep` drops
them silently, which turns a tombstone into a vacuous pass:

```txt
$ mvac verify
3 claims · 2 anchored (67%)

  ok          2
  parse     .multivac/invariants.md:12 — \s is not POSIX ERE — use [[:space:]]

0 blocking broken · exit 1 · 1 anchor parse errors
```

Translate:

| PCRE | POSIX |
| --- | --- |
| `\s` | `[[:space:]]` |
| `\d` | `[[:digit:]]` |
| `\w` | `[[:alnum:]_]` |
| `\b` | `(^|[^[:alnum:]_])` … `([^[:alnum:]_]|$)` |

## Matching rules you must know

- **`.sql` files match per statement, not per line.** Comments stripped,
  whitespace collapsed, split on `;`. Real DDL splits one GRANT across
  lines; a per-line tombstone over DDL has an escape by construction. Other
  files match per line — keep each leg's pattern on one physical line of
  the target.
- **Append-only surfaces (migrations) lie to `present`.** A match proves
  "was built this way", never "still is"; `unique`/`count` conflate history
  with HEAD. Over migrations either target the latest definition of the
  object, or use `count=N` as the ratchet.
- **Vacuous globs fail loudly.** A glob matching zero tracked files is a
  blocking failure for `absent`/`count` — a directory rename must not
  silently green a tombstone — and broken for `present`/`unique`:

  ```txt
  vacuous   INV-01 [absent] .multivac/invariants.md:7 · glob matched no tracked files — a rename greens this tombstone silently; fix the glob
  ```

- **`moved` self-heals.** A `present` leg with exactly one match outside
  its glob gets its glob rewritten in place, exit 0:

  ```txt
  moved     INV-01 [present] .multivac/invariants.md:6 · glob rewritten to sql/migrations/001_accounts.sql — review the diff
  ```

  Review the diff like any other edit and let it ride the same branch.
  Zero or many out-of-glob matches is not a move — it is broken, with
  candidates listed.

## Choosing the mode

**Anchor to contracts, not implementations** — migrations, schemas, route
tables, config keys, GRANTs. A contract site is simultaneously the cheapest
thing to read and the most stable thing to anchor to; a widget body breaks
on Tuesday. If you find yourself anchoring an implementation, first ask
whether a contract site exists for the claim; anchor the implementation
only when there is none, and expect churn.

| you are pinning | mode |
| --- | --- |
| the rule was enacted (the revoke, the constraint, the check exists) | `present` |
| a dead mechanism stays dead — the tombstone | `absent` |
| a single source of a value | `unique` |
| "never again" over append-only history; a sanctioned exception stays the only one | `count=N` |

`absent` and `count` block; `present` and `unique` report. Put the teeth in
the blocking modes and let `present` document the enactment. Without that
asymmetry every refactor turns the check red and someone disables the tool
in week three — lint-family tools die of noise, not of bugs.

## The legs pattern

One claim, several legs, all must hold. The canonical shape — enactment,
tombstone, ratchet:

```markdown
| INV-01 | Nobody has UPDATE on `accounts`, not even `admin_role`. | published | active | 2026-08-13 | map |
<!-- @anchor INV-01 api:db/migrations/*.sql /revoke[[:space:]]+update[[:space:]]+on[[:space:]]+[^[:space:]]*accounts/i -->
<!-- @anchor INV-01 api:db/migrations/*.sql /grant[[:space:]]+update[[:space:]]+on[[:space:]]+[^[:space:]]*accounts/i absent -->
<!-- @anchor INV-01 api:db/migrations/*.sql /update[[:space:]]+accounts/i count=1 -->
```

The `present` proves the rule was enacted; the `absent` kills the re-grant;
the `count=1` pins the one sanctioned `update accounts` in history — any
new occurrence breaks it. A tombstone can cross repos:

```txt
<!-- @anchor INV-42 *:AGENTS.md /(^|[^[:alnum:]_])legacy_token([^[:alnum:]_]|$)/ absent -->
```

The dead-terms dictionary is not a separate feature: it is these `absent`
legs, accumulated on retired rows, blocking forever.

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
