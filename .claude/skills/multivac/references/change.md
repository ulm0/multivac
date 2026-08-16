# The ecosystem change

A change is a file in the brain — `.multivac/changes/<slug>.md` — that the five
subcommands read and write, across days and machines. It is not done when
it merges; it is done when its anchors resolve.

## The rhythm

```
mvac change new "points expire"
mvac change plan     # which repos, in what order, which invariants it touches
mvac change apply    # a worktree per repo, branched from the newest default branch
mvac change land     # MRs respecting the declared order
mvac change close    # verifies the declared claims, archives, prints the ritual
```

## new — declare before you touch anything

`mvac change new` scaffolds the change file and **reserves the next free
invariant ID** for it — a `proposed` row in `.multivac/invariants.md` naming your change.
Never pick an ID by hand: two agents both picking "the next one" pick the same
one, and nobody finds out until the merge. Drop the reservation from
`invariants.adds` if the change adds no law — `close` releases an unused one.
`plan` reserves any ID you declare yourself and fails if another change holds
it, naming the next free one. The scaffold and the reserved row land as **one
commit on the current branch** — never edit the law table by hand, and never
leave lifecycle files uncommitted; if `new` refuses because the tree is dirty
at the bookkeeping paths, run the command it prints.

Fill the four declared fields before writing code:

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
- **apply** gives each declared repo its own **worktree** for this change —
  `.multivac/worktrees/<slug>/<repo>`, branched from the newer of the default
  branch and its remote-tracking ref — and prints the paths. It commits the
  status bump before branching, so every checkout inherits the change's
  bookkeeping from the base. **Work there, not in the shared checkout**: another agent
  may be running another change in the same repo, and a shared tree moves
  under them. It re-projects doors where the canonical door changed. A repo
  that doesn't exist is created: `git init`, first commit, consumer door
  with the brain mounted. If an SDD adapter is declared, apply **refuses**
  until that tool's plan/tasks artifact exists, then prints its apply-step
  instructions (`--no-sdd` to skip both once — see "The SDD flow" below).
  Where git cannot make
  a worktree, apply branches in place and refuses outright if the tree holds
  someone else's uncommitted work — commit or stash it, then re-run.
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
change file archived — never deleted), the change's worktrees are removed,
and a reserved ID it never used goes back to the pool. If close fails, the change is not
done: fix the code or fix the declaration, honestly. The commands close prints
are scoped to the closing slug's paths — follow the branch+MR variant when it
is printed; nothing lands on a remote-backed trunk directly.

Then close prints **the ritual** — `.multivac/ritual.md`, the half of the
closing ceremony no tool can check: who reviews what, who gets told, what
ships before what when the reason is not technical. multivac only prints it;
walking it is your job. Read the lines to the human and confirm each one
before you call the change done — and when the change taught the team a step
missing from that file, propose the line. An empty or absent ritual prints
nothing, which is not permission to skip a ceremony nobody has written down
yet: ask, then write it.

Decisions made mid-change become claims at close: propose the row, the
human enacts. This is the organic birth path — the main one at steady
state.

## The graph — it follows YOUR edits, not the commit

When a `grapher:` is declared and its binary is installed, `doors` wires the
refresh into your harness's **post-edit hook**, so the map is current for the
next question you ask it. It is backgrounded and silent: it never delays an
edit, never fails one, and skips when a refresh is already running. `change
close` runs the same refresh as the **safety net**, for edits made outside a
harness — taking the same lock, but waiting on it rather than skipping, since
close is the last chance to pick those edits up.

A `grapher:` multivac has not verified is reported as **unverified** and
nothing is run: it will not derive an artifact path or a refresh command from
a name. Declare the contract under `graphers:` in `.multivac/config.yml`
(`artifact` and `refresh`, optionally `create`/`binary`/`install`) and the tool
works with no merge request against multivac. **Git hooks never refresh** — the shims run `verify` only. Nothing is
staged or committed either way: graph output lands only in dedicated chore
commits, if your project commits it at all.

## The SDD flow — the lifecycle instructs, YOU run, the gate checks

When the brain door declares an SDD (`sdd:` in the config), features gate
through **that tool's own workflow, in that tool's own shape** — not through a
fixed propose/apply/archive triple. The steps are **chat commands you run in
the agent**, not terminal subcommands multivac could shell out, so the
lifecycle prints each one at its own moment and running it is your job.

The half that makes the printing mean something: **each step names the artifact
that proves it ran, and the next lifecycle command refuses without it.**

| refuses | until |
| --- | --- |
| `change plan` | the propose-equivalent artifact exists (`openspec/changes/<slug>/proposal.md`, `specs/*<slug>*/spec.md`) |
| `change apply` | the plan/tasks artifact exists (`.../tasks.md`, and for spec-kit `.../plan.md` too) |
| `change close` | the archive-equivalent has happened (`openspec/changes/archive/*-<slug>`) |

Every refusal names the path it looked for and the exact command to run, so
the fix is the line above the error. When the tool ships its own validator its
**verdict is reused** — `openspec validate` decides whether an OpenSpec change
is well-formed, multivac does not re-litigate its rules.

Some steps cannot be proven and are never gated — they say so instead:

- `/opsx:apply` leaves only `- [x]` in tasks.md, typed by the agent about its
  own work;
- `/speckit.analyze` is read-only by design and writes zero bytes;
- a clean `/speckit.converge` is forbidden to touch tasks.md.

Run those anyway. "Ungateable" means the check is missing, not the obligation.

**The project-level document.** spec-kit carries a constitution
(`.specify/memory/constitution.md`) — written once with `/speckit.constitution`
and **amended** as the product moves, version bumped, Sync Impact Report
prepended. Create it if it is absent — and "absent" includes the file spec-kit
scaffolds for you: `specify init` writes the template unfilled, so a repo can
carry a `constitution.md` full of `[ALL_CAPS]` placeholders and have no
constitution at all. Both doors say so at session start — `init` writes the
instruction into the door it scaffolds, `doors` into the brain door — and `doctor`
reports the document missing, still-a-template, present, or **stale** — older
than the law's newest row, which is the law moving while the constitution did
not. It is a report, never a gate: no machine can judge whether a principle
still fits.
OpenSpec has no such document, and multivac says that rather than inventing one.

`--no-sdd` turns the steps and the gates off for one run; `sdd_auto: false`
turns them off permanently. That is exploration mode — the flow still binds,
you just carry it unprompted and unchecked.

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
