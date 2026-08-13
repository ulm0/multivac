# The ecosystem change

A change is a file in the brain — `changes/<slug>.md` — that the five
subcommands read and write, across days and machines. It is not done when
it merges; it is done when its anchors resolve.

## The rhythm

```
mvac change new "points expire"
mvac change plan     # which repos, in what order, which invariants it touches
mvac change apply    # branch per repo from origin/main, edits, commits
mvac change land     # MRs respecting the declared order
mvac change close    # updates the brain and verifies the declared claims
```

## new — declare before you touch anything

`mvac change new` scaffolds the change file. Fill its four declared fields
before writing code:

1. **Repos it touches.** Registry keys. A repo that doesn't exist yet is
   legal — greenfield apply creates it.
2. **Landing order — a graph, not a list.** Declare edges with the reason:

   ```
   api -> web        # web claims the feature only after api serves it
   api -> worker     # worker consumes the new event
   ```

   No edge between two repos = they land in parallel. The order is law for
   `land`; write only the edges that are real constraints.
3. **Invariants it touches.** "amends INV-xx" for every rule the change
   relaxes or reshapes. An invariant is never relaxed in code — the row
   changes first (dated, in this change), the code follows in the same
   change.
4. **Claims it makes true**, with their anchors. This is the contract
   `close` verifies. Draft the anchors now (`anchors.md`), while you know
   exactly what the change promises — after merge nobody remembers.

The file also carries per-repo status
(`planned / branched / committed / MR / landed`); the subcommands move it.

## plan / apply / land

- **plan** resolves the declaration against reality: which declared repos
  are present, what the order implies, what the change touches. A declared
  repo missing locally gets cloned here — the one place implicit cloning
  is allowed, because you explicitly asked for an operation that needs it.
- **apply** branches each repo from `origin/main`, carries the edits and
  commits, and re-projects doors where the canonical door changed. A repo
  that doesn't exist is created: `git init`, first commit, consumer door
  with the brain mounted. If an SDD adapter is declared, its workflow runs
  inside apply automatically (`--no-sdd` to skip once).
- **land** opens the MRs respecting the graph: roots first, an edge's
  target only after its source lands. Parallel where no edge says
  otherwise. Each MR description cites the change file and its position in
  the order.

## close — the gate

`close` re-runs verify **scoped to the declared claims** and refuses to
archive until they hold:

- every claim in field 4 resolves ok on its new anchors,
- every "amends INV-xx" ended consistent — row and code agree,
- no blocking leg broke anywhere the change touched.

On success the brain is updated (rows enacted by the human, journal entry,
change file archived — never deleted). If close fails, the change is not
done: fix the code or fix the declaration, honestly.

Decisions made mid-change become claims at close: propose the row, the
human enacts. This is the organic birth path — the main one at steady
state.

## Retiring an invariant

Retirement is a change like any other, and the tombstone is **authored,
never derived**:

1. Open a change declaring "retires INV-xx".
2. Flip the row's state to `retired`. Keep the ID and the row — IDs are
   never renumbered, never reused; history stays in git.
3. Its existing legs stop being evaluated. **Do not invert them** —
   inverting an enactment leg would demand the enactment itself disappear,
   which is wrong in the general case.
4. Write NEW `absent` legs on that row for the dead mechanism's
   identifiers — the names someone would grep for, in every surface where
   they could resurface:

   ```markdown
   | INV-19 | RETIRED — cart reservation holds stock. | specified | retired | 2026-08-13 | journal |
   <!-- @anchor INV-19 api:src/**/*.ts /reserveStock/ absent -->
   <!-- @anchor INV-19 *:AGENTS.md /(^|[^[:alnum:]_])stock[[:space:]]+reservation([^[:alnum:]_]|$)/i absent -->
   ```

5. In the same change, remove the dead mechanism's remains from the code
   and the doors — the new legs will hold you to it at close.

The dead-terms dictionary is not a separate feature: it is these `absent`
legs, accumulated on retired rows, blocking forever.
