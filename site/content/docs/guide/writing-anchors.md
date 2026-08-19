---
title: Writing anchors
weight: 4
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
<!-- @anchor <CLAIM-ID> <repo-key>:<glob> [![<repo-key>:]<glob> ...] /<regex>/[flags] [mode] -->
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
- **`!<repo-key>:<glob>`** excludes *in that repo only*. A bare exclusion is
  repo-relative and bites in every repo the leg evaluates, so under `*` it
  exempts the path's namesake everywhere; qualify it to exempt one repo:

  ```txt
  <!-- @anchor INV-77 *:**.md !brain:07-rules.md /PIN/ absent -->
  ```

  "no PIN in any markdown, anywhere — except the page in the brain that
  carries the tombstone". A `07-rules.md` in another repo is still checked.
  An exclusion naming an undeclared repo is a parse error naming the key;
  qualifying an exclusion in a single-repo leg is legal and redundant.
- **Flags**: `i` only.
- **mode**: `present` (default), `absent`, `unique`, `count=N`, `each`,
  `each!`.
- **One include glob per leg.** Alternate paths with braces —
  `api:{src,lib}/**/*.ts` — never with a second glob; only exclusions repeat.
- The whole grammar is one screen away: `mvac help anchor`. Before pinning a
  `count=N`, dry-run the leg with `mvac count '<repo>:<glob> /<regex>/'` —
  it prints the per-file breakdown through verify's own matcher, so the
  ratchet is right the first time.

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

Four more constructs are refused for the same reason — they mean something in
JavaScript and something else, or nothing, to `git grep` (MV-109):

| Written | Why it is refused |
| --- | --- |
| `(?=` `(?!` `(?:` | POSIX ERE has no lookaround and no non-capturing groups |
| `*?` `+?` `??` | POSIX ERE quantifiers are greedy; there is no lazy form |
| `\1` … `\9` | POSIX ERE has no backreferences |
| `\t` `\n`, any alphabetic escape | POSIX ERE escapes punctuation only |

And the mistake that used to compile: a character class needs BOTH pairs of
brackets. `[[:digit:]]` is the class; `[:digit:]` is a bracket expression whose
members are `:`, `d`, `i`, `g`, `t` — so `PIN[:digit:]` used to become
`PIN0-9`, matching that literal text and never `PIN4`. It is refused now, in
`git grep`'s own words: *character class syntax is `[[:digit:]]`, not
`[:digit:]`*.

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
- **`count=N` is a deletion ratchet, never a universal.** It counts matches
  across ALL files the glob matches: it catches removal, not a new file
  that omits the pattern. Measurement 2 proved it by injection — a
  `privileged: true` rogue container added to a default k8s manifest left
  fifteen anchors green at exit 0. "For every file, P" is `each`; "for no
  file, P" is `each!` — quantified per file, failing files named. The
  `count` dry-run nudges you here on purpose: every `count=N` summary ends
  by naming `each`/`each!`, so a universal-shaped rule is never pinned as a
  ratchet by accident.
- **Vacuous globs fail loudly.** A glob matching zero tracked files is a
  blocking failure for `absent`/`count`/`each` — a directory rename must not
  silently green a tombstone, and a universal over nothing proves nothing —
  and broken for `present`/`unique`:

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
| every matched file satisfies the rule ("every manifest declares limits") | `each` |
| no matched file carries the pattern, and the offender is named per file | `each!` |

`absent`, `count` and `each` block; `present` and `unique` report. Put the
teeth in the blocking modes and let `present` document the enactment. Without
that asymmetry every refactor turns the check red and someone disables the
tool in week three — lint-family tools die of noise, not of bugs.

### The universal: `each` and `each!`

`each` holds iff **every** file the glob matches (after exclusions) contains
at least one match; `each!` iff every such file contains none. A violation is
a hard failure and the failing files are **named**, first few + count:

```txt
broken    INV-90 [each] .multivac/invariants.md:9 · each: 1 of 4 files lack the pattern (k8s/rogue.yaml) — add it there, or exclude the file with !<glob>
```

Exempt a sanctioned file with an exclusion (`!api:k8s/debug.yaml`). Inside
matched `.sql` files the per-statement normalization applies as everywhere
else. Plain `absent` also says "nowhere in the glob"; reach for `each!` when
the report must name the offending file and an empty glob must fail. What
`each` cannot say — deliberately — is a **cross-file relation** ("the
vendored copy equals the root copy", "the env var matches the
containerPort"). That is a different primitive, not a quantifier; leave such
claims unanchored rather than fake them.

```markdown
| INV-90 | Every deployment is confined: limits declared, never privileged. | published | active | 2026-08-14 | map |
<!-- @anchor INV-90 api:k8s/*.yaml /limits:/ each -->
<!-- @anchor INV-90 api:k8s/*.yaml /privileged:[[:space:]]*true/ each! -->
```

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
