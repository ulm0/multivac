# Contract: what the commands print and write

Lines are printed exactly; tests pin the load-bearing substrings. `<ID>` is a row ID, `<slug>`
the change's slug, `<ref>` the brain's channel (its own entry's `channel:`, else the global,
else `origin/main`), `<file>` a reader's label for a change file. Examples use a brain==code
brain keyed `brain` whose rows are `INV-nn`. A command that refuses nothing prints byte for byte
what it printed before this change; only `change new` grows (+25 B).

## The change file

### What every command writes

```yaml
claims:
  - INV-02                         # an ID-only claim, and a { id } map read from disk
  - id: INV-03                     # a legacy claim, written back byte for byte
    statement: "legacy: prose # kept"
```

No command creates a `statement:`. A planned change file keeps `claims: []`.

### The scaffold's body (`change new`)

```text
# <title>

Declare repos, landing_order, invariants and claims in the frontmatter,
then run `multivac change plan <slug>`. For example:

    # repos: { api: { status: planned } } — planned|branched|committed|mr|landed
    # landing_order: [[api]] — stages; earlier stages land first
    # claims: [<ID>] — the rows close verifies; each row states its own rule

multivac owns the frontmatter formatting: every lifecycle step rewrites it, so
hand-tuned layout will not survive, and a key it does not know is DROPPED
rather than carried through. Declared values round-trip unchanged; the body,
below the closing ---, is yours: with an SDD declared, `change close` only
appends the line citing its directory.
```

The claim lines go from 164 B (the `{ id, statement: "..." }` example and the two "Statements are
prose" lines) to 80 B. The last paragraph is unchanged byte for byte (MV-110, MV-146).

### Parse refusals (every reader; the lifecycle exits 1 with them)

```text
<file>: "claims" must be a list of row IDs — claims: [<ID>] — fix the frontmatter
<file>: each claim is a row ID — claims: [<ID>]; the row states the rule — fix the frontmatter
```

### A key inside a claim other than `id` and `statement`

Every command that rewrites the file — `change new` promoting it, `plan`, `apply`, `land`,
`close`, `close --abandon`, `roadmap sync` — refuses it (the `change` commands exit 1, writing
nothing; `roadmap sync` skips the file as it skips any file it cannot parse):

```text
.multivac/changes/<slug>.md: claim INV-02: unknown key "note" — a claim is its row's ID; state the rule in the row — fix the frontmatter
```

Every other reader — `verify`, the `roadmap` listing, `doors` and its ecosystem graph, the code
gate — reads the claim without the key and says, where it says MV-117's top-level notice:

```text
<file>: claim INV-02: unknown key "note" — a claim is its row's ID; state the rule in the row (read without it here; every command that rewrites the file refuses it until it goes)
```

## `change new`

```text
three edits before plan:
  1. repos: { api: { status: planned } }        # status: planned|branched|committed|mr|landed
  2. landing_order: [[api]]                     # stages; earlier stages land first
  3. claims: [INV-02]                           # the rows close verifies; each states its rule
```

The third line is `` `  3. claims: [${id}]`.padEnd(48) + '# the rows close verifies; each states its rule' ``
(95 B with a six-character ID, was 70 B).

## `change plan`

Per legacy claim, gating nothing (121 B with a five-character ID; the site's sample shows the row
ID in parentheses as `…`, as it does the armed line's `(MV-80)`):

```text
claim INV-03: its statement: restates the row — kept as written; a claim is its ID, and the row states the rule (MV-111)
```

Per declaration-half line (`no-row`, `short-row`, `retired`, `undeclared`, `reserved-elsewhere`),
gating nothing, after the "no anchor" lines:

```text
claim NOPE-1: no row in .multivac/invariants.md — a claim cites a row of the law; add the row, or drop the claim — close refuses this
```

The existing `invariant <ID>: already in .multivac/invariants.md (<state>) — not new; move it to
touches, or pick a free id` stays plan's only line for an `adds` row already in the law.

## The citation lines

`<ID>: ` then the clause. Per claim, the first that applies, in this order:

| kind | clause | gates |
| --- | --- | --- |
| `no-row` | `no row in .multivac/invariants.md — a claim cites a row of the law; add the row, or drop the claim` | yes |
| `short-row` | `its row has fewer than six columns, so nothing is read from it (MV-119) — complete the row` | yes |
| `retired` | `retired, and this change does not retire it — drop the claim; its tombstone's absent legs gate every verify run` | yes |
| `retiring` | `listed under invariants.retires, but its row still reads <state> — retire the row before close: state retired, its tombstone and absent legs, which this claim then verifies` | yes |
| `undeclared` | `claimed, but this change neither adds, touches nor retires it — drop the claim, or list it under invariants.touches if this change amends that row` | yes |
| `reserved-elsewhere` | `reserved by change <other>, which has not stated it — close <other> first, or drop the claim` | yes |
| `unstated` | `its row states no rule yet — the row is the only place the rule is stated; state it in .multivac/invariants.md` | yes |
| `unstated`, legacy claim | `its row states no rule yet — the row is the only place the rule is stated; move this claim's legacy statement: into the row` | yes |
| `orphan` | `anchored only in .multivac/changes/<slug>.md, which close archives — move the anchor beside the code it pins` | yes |

Per owned row no claim cites, with no line yet:

| kind | clause | gates |
| --- | --- | --- |
| `not-new` | `already in .multivac/invariants.md (<state>) — not new; move it to invariants.touches` | yes |
| `unclaimed` | `added by this change and anchored, but claimed by nothing — close would enter it unverified; claim it, or drop it from invariants.adds and the law` | yes |
| `unanchored` | `enters the law stated but unanchored — nothing verifies it; claim and anchor it to have close verify it` | no |

**The pull.** At `close` and `land`, an `unstated` line whose row the brain's channel states
becomes (125 B for `origin/main`, 2 commits):

```text
INV-01: its row states no rule here, but origin/main states it (2 commit(s) this checkout lacks) — pull, then re-run close
```

## `change close`

After the SDD, graph and tracked-graph gates, the repos checks and the unlanded check, all
unchanged. Nothing below is written, staged, archived or released when any line refuses.

A claim whose row states no rule (code-less brain, api and web; 235 B):

```text
INV-04: ok
INV-04: its row states no rule yet — the row is the only place the rule is stated; state it in .multivac/invariants.md
claims do not cite the law this change makes — close refused; fix the lines above, then re-run close
```

Every refusal in one run: a red claim, a claim of no row, an undeclared claim (the anchor verdict
lines are `closeGate`'s, unchanged; a claim of no row is not evaluated against anchors):

```text
INV-07: no anchors evaluated — add an anchor for the claim, then re-run close
claims are not green — close refused; fix the red claims, then re-run close
NOPE-99: no row in .multivac/invariants.md — a claim cites a row of the law; add the row, or drop the claim
INV-05: claimed, but this change neither adds, touches nor retires it — drop the claim, or list it under invariants.touches if this change amends that row
claims do not cite the law this change makes — close refused; fix the lines above, then re-run close
```

A claim anchored only in its change file, claims green: MV-117's refusal, byte for byte as before
(the `orphan` kind is not repeated in the block below it):

```text
INV-01: ok
close refused — INV-01 is anchored ONLY in .multivac/changes/orp.md, which this close archives: the claim would be green now and unanchored from the next run on. Move the anchor beside the code it pins, then re-run close
```

Order: the anchor verdicts of the claims that have a row; `claims are not green — …` when red,
else the MV-117 refusal for `orphan` lines; the non-gating citation lines (`say`); the gating ones
but `orphan` (`warn`), each through the pull when the channel states the row; the summary line
when that last group is not empty. Exit 1 once when anything refused.

A stated added row nothing anchors, otherwise clean: the line, then close goes on and exits 0:

```text
INV-02: enters the law stated but unanchored — nothing verifies it; claim and anchor it to have close verify it
```

A clean close is unchanged (655 B under codegraph in the walk), e.g.:

```text
INV-01: ok
archived -> .multivac/changes/archive/wsk.md
```

and the archive holds `claims:` with `  - INV-01`. An unused reservation is released as before:
`released unused reservation: INV-01`.

### `change close --abandon`

After the existing "declares N claim(s)" refusal, exit 1, nothing archived:

```text
INV-07: states a rule this abandoned change never verified — delete the row from .multivac/invariants.md (a proposed row may be removed), or close the change properly
```

A row that still reads RESERVED never refuses, anchored or not; the anchor set is read before the
archive, and a row an anchor names is kept.

## `change land`

Once every repo is landed. The channel line and the armed line are unchanged; the notice follows
the armed line, one per gating citation line, the pull included (144 B for an unstated line):

```text
channel: every declared claim resolves at origin/main 62b778c (last fetch 2m ago) — the work is published there, however it got in
every repo is now landed — once every declared claim resolves, `verify --strict` refuses wsk as unclosed (MV-80), here and in CI, until: multivac change close wsk
  close refuses until: INV-01: its row states no rule yet — the row is the only place the rule is stated; state it in .multivac/invariants.md
stage 1 [landed] brain:landed
```

and the last line, after the SDD's land step:

```text
all stages landed — fix the line close refuses on above, then: multivac change close wsk
all stages landed — fix the 2 lines close refuses on above, then: multivac change close wsk
```

With nothing to refuse the last line stays `` all stages landed — run `multivac change close wsk` ``.
Land before pull prints the pull instead of "state it":

```text
  close refuses until: INV-01: its row states no rule here, but origin/main states it (2 commit(s) this checkout lacks) — pull, then re-run close
```

## `verify`

The finished line, when close's citation gate or orphan check would refuse the change (the tail is
203 B instead of 61):

```text
  finished  wsk — every declared claim resolves and every declared repo is landed (1 claim whose failure this run would not gate); finished, not pending — close refuses until: INV-01: its row states no rule yet — the row is the only place the rule is stated; state it in .multivac/invariants.md — then: multivac change close wsk · blocking
```

With more than one refusal the first is followed by ` (+N more)`. Otherwise the line is today's,
`… finished, not pending — close it: multivac change close wsk · blocking` (or `· reported only —
this run is not --strict`). Counts and exit code are unchanged (`--strict`: `1 blocking broken ·
exit 1` with the finished change counted as today). The finished line never reads the channel;
the read line names a brain behind it (MV-54). A brain whose own entry declares `channel:` is read
at it on the read line:

```text
  read      brain: working tree on main @ 1a2b3c4 — the brain's own repo, the commit this run gates; 2 behind its own channel origin/trunk @ 62b778c — an out-of-date law judges a current ecosystem
```

## flow.md (rendered by `multivac doors`)

```text
- `change close` refuses while a declared claim does not resolve, or cites no stated row this change adds, touches or retires
```

(125 B, was 64 B; test/doors/flow.test.ts:135's `` /`change close` refuses while a declared claim does not
resolve/ `` is a prefix of it and still matches.)

## The changelog (Unreleased, "Changed — read before upgrading")

```markdown
- **A claim is its row's ID, and close checks what it cites (MV-150).** `change new` and the
  scaffold now write `claims: [<ID>]`; the row states the rule. A legacy `{ id, statement }`
  keeps working and is written back unchanged — do not convert a change in flight.
  - **An older multivac reads an ID-only change as absent**: its `change` commands refuse the
    file, and its `verify`, `roadmap` and `doors` skip it without a word, so the change's claims
    stop pending and a brain==code hook running it blocks the change's own commits. Upgrade
    every consumer's pinned and global multivac before the brain writes one, and set
    `requires:` in the brain's `.multivac/config.yml` to the release carrying this change
    (MV-86), with or after that release.
  - **`change close` refuses a claim that cites no stated row the change adds, touches or
    retires**, a claim anchored only in its change file, an added row already in the law, and a
    proposed row it anchors but never claims — all in one run, before anything is written.
    `--abandon` refuses a change whose own proposed row states a rule. `verify`'s finished line,
    `land` and `plan` say what close will refuse, and a row the brain's channel states and this
    checkout lacks is named as a pull.
  - **A key inside a claim other than `id` and `statement`** is refused by every command that
    rewrites the change file, and named by every other reader.
  - Close's reservation release reads the anchors `verify` parses; a fresh claude-door brain's
    first unused reservation is now released.
```

## Unchanged, byte for byte

a clean change's `plan` 257 B, `apply` 537, `land` 520, `verify --strict` 535, `close` 655 and
the verify after it 298 (under codegraph); `closeGate`'s lines; the channel line's texts; the
armed line; MV-117's orphan refusal; the "already in … not new" plan line; the release line;
`doctor`; the doors (this brain declares no claim text in them).
