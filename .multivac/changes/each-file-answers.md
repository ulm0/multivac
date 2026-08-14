---
slug: each-file-answers
status: open
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-43
  retires: []
claims:
  - id: MV-43
    statement: "`each` is the universal quantifier: a leg in mode `each` holds iff every file its glob matches (after exclusions) contains at least one match, and `each!` iff every such file contains none. A glob matching zero tracked files is a blocking failure (same rationale as `absent`), the failing files are named in the report (first few + count), SQL statement normalization applies inside matched `.sql` files, and both forms gate by default alongside `absent` and `count`."
---

# Each file answers: the universal quantifier

Measurement 2's sharpest finding (internal/measurements/02-foreign-ecosystems.md,
finding 4, proven by injection on S2): a `privileged: true` rogue container
added to a default k8s manifest left all 15 anchors green at exit 0, because
`count=N` is a deletion ratchet — it catches removal, never omission-on-addition.
Four of the seven unanchorable claims needed a universal quantifier
("for every Deployment / container / published package, P").

## The mode

- `each` — every file the glob matches contains **at least one** match:
  "every service manifest declares `resources.limits`". A new manifest that
  omits the pattern breaks the leg, and the report names it.
- `each!` — every file the glob matches contains **no** match: "no manifest
  anywhere sets `privileged: true`". Plain `absent` already covers the
  whole-glob case; the per-file form earns its keep in the report — it names
  WHICH file carries the violation — and in vacuity: the quantifier over
  nothing is a failure, loudly.

## Syntax, justified

The mode slot stays **one token**: `each` and `each!`. Rejected alternatives:

- `each !` (two tokens) — the tail after the regex is a single mode token
  today; two tokens make the rejects mushy exactly where the parser is
  loudest, and `absent extra` must stay an error.
- `all` / `none` — a second vocabulary for the same quantifier; `none`
  collides with `absent` in every conversation about it.
- `each=0` — invites `each=N`, a per-file count nobody measured a need for.

`!` is already the grammar's negation sigil (exclusions negate the glob set);
`each!` negates the predicate with the same character, postfix so the mode
family stays alphabetized under "e" in every list.

## Exit semantics

`each` is a universal — a violation is a hard failure. It joins the default
`blocking:` set alongside `absent` and `count`; the severity table says so.
Vacuity (zero files after exclusions) is a blocking failure: a directory
rename must not silently green "every manifest is confined".

## What now anchors, what still does not

Of measurement 2's seven unanchorable claims, the four universal ones
("every Deployment sets resources.limits", "every container drops
capabilities", "no manifest sets privileged", "every published package
declares its files list") anchor with `each`/`each!`. The three cross-file
relation claims (vendored proto == root proto, engines floor == CI matrix,
image name == skaffold artifact) still do not — that gap stays, on purpose:
a relation between two files' values is a different primitive, not a
quantifier, and the docs say so plainly.
