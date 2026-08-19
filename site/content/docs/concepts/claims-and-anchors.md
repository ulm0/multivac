---
title: Claims and anchors
weight: 3
---

The unit is not the document. It is the claim:

    statement + authority + anchor + state + date

The serialized home is the law table in `.multivac/invariants.md`, one row per claim —
`| ID | statement | authority | state | date | source |` — the exact format
`init` writes with zero rows. `state` and `date` live in the row because
`verify` reads them: `proposed` rows never block; `retired` rows evaluate
only their authored tombstone legs. Anchors are not columns — they are
comment lines under the row.

Authority levels are configurable per project (`authorities:` in
`.multivac/config.yml`). To the tool an authority is surfaced metadata plus
procedural review — printed with every claim, gating who may enact — never
interpreted mechanically by `verify`.

No database, no proprietary format. If the tool disappears, the brain still
works.

## The anchor

**Content-based, not line-based.** Lines move on the first commit. An anchor
says: "in that repo, in those files, something matches this". Verifying is
asking whether the matcher still hits. If the file moved, it is re-located;
if it disappeared, the claim becomes suspect — not silently false.

Anchors live inline in the markdown as HTML comments: invisible when
rendered, greppable, no parallel file to drift. One leg per line:

```
<!-- @anchor <CLAIM-ID> <repo>:<glob> [![<repo>:]<glob> …] /<regex>/[flags] [mode] -->
```

- **The claim ID is explicit, never inferred** from proximity. It is the join
  key for reporting and for `change close`.
- **`repo` is the registry key** from `.multivac/config.yml` (`backend`),
  never the directory name (`acme-backend`). `*` covers every declared repo
  plus the brain itself. *Which bytes* of that repo a leg reads depends on
  who is asking: from the brain, the repo's channel ref — the ecosystem as
  published — and from a consumer repo, its own working tree. See
  [verify](../../reference/commands/#what-each-run-reads-mv-53).
- **The glob dialect is picomatch** over repo-relative, `/`-separated paths
  (`git ls-files` output): `**` crosses directories, `{a,b}` alternates,
  dotfiles match. Not shell globbing, not a regex.
- **`!<glob>` excludes**, applied after the include. The surviving file set
  is what gets matched — and what counts toward vacuity.
- **`!<repo>:<glob>` excludes in that repo only.** A bare exclusion is
  repo-relative and bites in every repo the leg evaluates — under `*` that
  exempts the path's namesake everywhere, which is rarely what a tombstone
  means. `*:**.md !brain:07-rules.md /PIN/ absent` says "nowhere, except the
  page in the brain that carries the tombstone"; the same filename in another
  repo is still checked. An exclusion naming an undeclared repo is a parse
  error naming the key; qualifying one in a single-repo leg is legal and
  redundant.
- **Flags**: `i` only.
- **One canonical regex dialect: POSIX ERE**, the lowest common engine —
  what macOS `git grep` actually executes. `\s`, `\b`, `\d`, `\w` are
  rejected when the anchor is parsed with a translation hint
  (`\s` → `[[:space:]]`, `\w` → `[[:alnum:]_]`), never silently accepted:
  macOS git grep drops them silently, which turns a tombstone into a vacuous
  pass. The dialect is pinned to that lowest common denominator even though
  multivac runs one matcher of its own — a `RegExp` compiled from the ERE, in
  process — so an anchor stays readable by `git grep` and by the next person,
  and passes the same way on every machine.

## Five modes, one mechanism

| mode | requires | what it's for |
| --- | --- | --- |
| `present` (default) | at least one match | the rule is implemented |
| `absent` | no match | **the tombstone** |
| `unique` | exactly one | single source of a value |
| `count=N` | exactly N | **the ratchet** |
| `each` / `each!` | every matched file contains a match / none | **the universal** |

`count=N` legs are also **derived numbers**: a number the brain states and
the code must still yield. Over append-only history, `count=N` is the
documented idiom for "never again" claims — the count pins today's total and
any new occurrence breaks it.

`count=N` is a **deletion ratchet, never a universal**: it counts across all
files together, so it catches removal, not a new file that omits the
pattern — measurement 2 proved a privileged rogue container invisible to
fifteen green count/absent anchors. "For every Deployment / container /
published package, P" is `each`: every file the glob matches must contain a
match (`each!`: must contain none), a glob matching zero files fails, and
the failing files are named in the report. What no mode says — deliberately —
is a cross-file **relation** (vendored copy == root copy, env var ==
containerPort): that is a different primitive, and such claims stay
honestly unanchored.

The dead-terms dictionary is not a separate feature: a dead term is an
`absent` anchor on the retired claim's row, and it can cross repos:

```markdown
<!-- @anchor INV-83 *:AGENTS.md /(^|[^[:alnum:]_])VOUCHER([^[:alnum:]_]|$)/ absent -->
```

The dead-terms guard, the count ratchet, and the invariant anchor are the
same primitive in different modes.

## Legs

A claim may carry several anchor lines — legs. **Legs AND together**: the
claim holds only when every leg holds. On failure the claim inherits the
worst failing leg's severity, and `verify` reports per leg, never only per
claim.

The canonical shape — enactment, tombstone, ratchet, bypass-killer:

```markdown
| INV-01 | Nobody has UPDATE on `balances`, not even the service role. | published | active | 2026-08-02 | [03](03-backend.md) |
<!-- @anchor INV-01 backend:db/migrations/*.sql /revoke[[:space:]]+update[[:space:]]+on[[:space:]]+[^[:space:]]*balances/i -->
<!-- @anchor INV-01 backend:db/migrations/*.sql /grant[[:space:]]+update[[:space:]]+on[[:space:]]+[^[:space:]]*balances/i absent -->
<!-- @anchor INV-01 backend:db/migrations/*.sql /update[[:space:]]+balances/i count=1 -->
<!-- @anchor INV-01 backend:db/migrations/*.sql /on[[:space:]]+conflict[^;]*balance/i absent -->
```

The `revoke` proves the rule was enacted; the `absent` grant is the
tombstone; the `count=1` ratchet pins the one sanctioned `update balances`
in append-only history; the last leg kills the upsert bypass.

## Matching rules

Two rules are normative, measured against real repos, not theorized:

- **Statement-normalized matching for SQL.** Real DDL splits one grant across
  lines; a per-line tombstone over DDL has an escape by construction. On `.sql`
  files the matcher normalizes per statement — whitespace runs, newlines
  included, collapse to one space — before the regex runs. Line-based `absent`
  over DDL is unsound and multivac does not offer it. **Only `.sql`**: every
  other file, config included, is matched per line, so a value split across
  lines in YAML or TOML still escapes a line-based tombstone. Write the leg
  against a shape that survives one line, or anchor the SQL instead.
- **Append-only history takes the latest definition or the ratchet.**
  `present` over `migrations/*.sql` proves "was built this way", never
  "still is"; `unique` and `count` conflate history with HEAD. Over an
  append-only surface a leg either targets the latest definition of the
  object it names, or uses `count=N` as the ratchet.

## Asymmetric severity

Modes differ not only in how they match but in what their failure means:

| mode | false positive | on failure |
| --- | --- | --- |
| `absent` | near impossible | **blocks** |
| `count` | low | **blocks** |
| `each` / `each!` | low — a named file either satisfies the predicate or not | **blocks** |
| `present` | high — the rule is true, the code moved | reports and self-heals |
| `unique` | medium | reports |

**The tombstone blocks; the presence check informs.** Without this, every
refactor turns the check red and someone disables the tool in week three.
Lint-family tools die of noise, not of bugs.

This table is the default of the `blocking:` key. Config may extend it;
loosening below `[absent]` — unblocking the tombstone — is refused.

## Self-healing, states, exit codes

When a `present` leg fails in its declared glob, the whole repo is searched
before reporting. Six states, not two:

- **ok** — every leg holds.
- **moved** — a `present` leg with exactly one match outside its glob of the include's own kind — the same trailing extension, never inside `.multivac/`: the
  glob is rewritten in place. Zero or many out-of-glob matches is not a
  move — it is `broken`, with the candidates listed.
- **broken** — the leg's requirement fails in place.
- **vacuous** — the glob, after `!` exclusions, matches zero tracked files.
  For `absent`/`count`/`each` this is a blocking failure: a directory rename
  would silently green every tombstone otherwise, and a universal quantified
  over nothing proves nothing. For `present`/`unique` it reports as broken.
- **pending** — a claim an open change declared before its code exists.
  Informational, never blocking, never self-healed.
- **unevaluated** — a declared repo is not on disk, so its legs were not read
  at all. Not a pass: `multivac repos sync`, then re-read.

One exit matrix, no second answer:

| result | default | `--strict` |
| --- | --- | --- |
| broken or vacuous leg in a blocking mode (`absent`, `count`, `each`) | **exit 1** | exit 1 |
| broken `present` / `unique` | reported, exit 0 | exit 1 |
| moved (self-healed) | exit 0 | exit 0 |

Git hooks and harness hooks run the default policy — only blocking modes
gate, so a mid-refactor commit never dies on a moved presence check.
`--strict` adds the presence and uniqueness legs to the gating set;
`strict_pre_push: true` arms it on the pre-push shim, for a team that wants
the last hop out of the machine held to a harder bar than a commit anyone can
still amend.

```txt
$ mvac verify
82 claims · 48 anchored (59%)
  unanchored: INV-03, INV-08, INV-11, … (34)
  read      backend: origin/main @ abc1234 — fetched 2h ago
  read      brain: working tree on main @ def5678 — the brain's own repo

  ok         44
  moved       3
  broken      1
  moved     INV-07 [present] .multivac/invariants.md:31 · glob rewritten to sql/002_roles.sql — review the diff
  broken    INV-15 [present] .multivac/invariants.md:52 · no match in backend — restore the code or retire the claim
  enact     no row enacted in this commit — 2 staged paths, no row reached active

0 blocking broken · exit 0
```

The broken `present` is reported, non-blocking; `--strict` turns it into
exit 1.

`moved` rewrites the anchor and exits 0; the diff lands in the same PR as
the refactor. A tool that fixes instead of accusing is what buys adoption.
Writing follows the `prettier` pattern: the rewrite lands in the working
tree, where a human reads the diff, and `--check` reports the `moved` leg
instead for any run that has nothing to commit to.

## Coverage, not completeness

Not every claim is anchorable. A formula anchors to a function body; a
meta-rule anchors to nothing. **A claim without an anchor is legal, and it
is counted.** You start at 0% and the tool is already useful. Coverage rises
when the team cares, and the report never pretends to have verified what
nobody anchored.

## Anchor to contracts, not implementations

> An ecosystem's boundaries are simultaneously the cheapest thing to read
> and the most stable thing to anchor to.

Migrations, API schemas, event names, config keys, route tables, GRANTs.
That is what the seeder reads to draw the map **and** what moves least under
an anchor — one design decision, not two. An anchor to a migration filename
is practically immortal; an anchor to a widget body breaks on Tuesday. If
you find yourself anchoring an implementation, first ask whether a contract
site exists for the claim; anchor the implementation only when there is
none, and expect churn.
