# The ecosystem change

A change is a file in the brain, `.multivac/changes/<slug>.md`. It is done
when its claims resolve, not when it merges.

`multivac change` lists the five steps. `new`, `apply` and `land` commit their
own bookkeeping, and `close` prints the archive commit for you to make on a
branch. Each step names the worktree, the push or the merge request that is
yours; each refusal names what it looked for and the command that fixes it. Run
what they print, and where they print the SDD chain, run it through without
asking to continue (MV-95).

## planned — the state before the rhythm starts (MV-89)

`mvac roadmap add <slug> "<title>"` records a change as `planned`, with a
`horizon` of `now`, `next` or `later`. It reserves no ID, opens no branch and
never counts as unclosed, so a roadmap of any length delays no release.
Starting one is `mvac change new <slug>` on that slug: never scaffold a second
change or copy its prose. It is never a precondition: `change new` on a slug
nobody planned is correct. These files are the source; a projection to an
issue tracker flows one way, and a change closes at `mvac change close` alone.

## new — declare before you touch anything

`change new` reserves the next free ID as a `proposed` row and commits it. Never
pick an ID by hand: two agents picking "the next one" pick the same one. Then
fill what it prints:

1. **Repos** — registry keys; one that does not exist yet is legal.
2. **Landing order** — stages, a list of lists: a stage lands in parallel, an
   earlier stage first. There is no edge form. Use as few stages as the real
   constraints need.
3. **Invariants it touches** — every row it amends or retires, changed first,
   dated, in this change.
4. **Claims** — the IDs of the rows it makes true: the row states the rule, the
   claim cites it and never restates it (MV-150). Draft the anchors now
   (`anchors.md`), while you know what the change promises.

## plan / apply / land

`apply` prints one worktree per repo. Write the code there, never in the shared
checkout: another agent may be running another change in the same repo. The
SDD files written before `apply` are **carried onto the branch** when the
change names the brain's own entry (MV-133); in a brain that holds no code they
stay in the checkout, and `close` names them in the archive commit it prints
(MV-144). `land` commits nothing on the branch; it prints the push and the
merge request, which are yours. `land --landed <repo>` records your statement that it merged.

## close — the gate

`close` refuses to archive until every claim resolves on its anchors and cites
a row the change adds, touches or retires that states its rule, and every row
the change adds and anchors is claimed (MV-150). A row the change only touches
is verified here only when it is claimed; `verify` reports every other row on
each commit where the hooks are armed, and refuses one only in a blocking mode
or under `--strict`. If close refuses, the change is not done: fix the code or
fix the declaration, honestly. Close enacts nothing; the human flips each row.

Close prints `.multivac/ritual.md` and checks none of it: take each line to the
human before calling the change done. An empty ritual is not permission to skip
a ceremony nobody wrote down: ask, then write the line.

Decisions made mid-change become claims at close: propose the row, the human
enacts. This is how most law is born at steady state.

## The SDD flow — the lifecycle instructs, YOU run, the gate checks

The brain door lists the tool's steps, each with its proof or `[ungateable]`,
and each lifecycle point prints its own (MV-51). Where the tool keeps a task
ledger, `close` refuses while it has open items. Run the ungateable steps
anyway: "ungateable" means the check is missing, not the obligation. Under
`sdd_auto: false` or `--no-sdd` nothing is printed or gated, and the flow still
binds: you carry it unprompted.

The project document is the brain's (MV-146). Write it from the human's
principles, never your own, and cite the rows it restates by ID. For spec-kit,
`doctor` reports the document missing, still-a-template, present, or **stale** —
older than the law's newest row, a report only. Its content is never judged
(MV-57). opsx's `context:` in `openspec/config.yaml` is reported, never gated.

## Retiring an invariant

Retirement is a change like any other, and the tombstone is **authored, never
derived**:

1. Open a change declaring the row in `invariants.retires`.
2. Flip the row's state to `retired`. Keep the ID and the row: IDs are never
   renumbered, never reused.
3. Its legs other than `absent` stop being evaluated. **Do not invert them**:
   inverting an enactment leg would demand the enactment itself disappear.
4. Write NEW `absent` legs on that row for the dead mechanism's identifiers, in
   every surface where they could resurface:

   ```markdown
   <!-- @anchor INV-19 api:src/**/*.ts /reserveStock/ absent -->
   <!-- @anchor INV-19 *:AGENTS.md /(^|[^[:alnum:]_])stock[[:space:]]+reservation([^[:alnum:]_]|$)/i absent -->
   ```

5. In the same change, remove the dead mechanism's remains from the code and
   the doors. From then on the new `absent` legs gate every run: a retired
   row's tombstone blocks by default.

These `absent` legs, accumulated on retired rows, are the dead-terms dictionary.
