---
name: multivac
description: Operating manual for brain-driven development with multivac. Load when the brain is empty (session zero), when validating mvac seed output, when writing or repairing anchors, when planning/applying/landing/closing an ecosystem change, or when amending or retiring an invariant.
---

# multivac — operating protocol

The brain is the repo you work from; code repos are surfaces the change
passes through. The door told you where the brain is and what binds. This
skill is the manual for operating it.

## Session zero: pick the branch

The door says this brain is empty. Ask the human ONE question before
anything else:

> Does this ecosystem already exist as code, or are we starting from scratch?

- **Existing code** → discovery flow, `references/discovery.md`: `mvac repos
  sync` to clone and equip every declared repo, `mvac seed`, the open
  questions to the human, each repo's project document written from the
  human's principles, the proposed law validated in blast-radius batches, then
  `mvac doors`.
- **From scratch** → interview flow, `references/interview.md`: draw the law
  out of the person's head, write the project document from their
  non-negotiables, decide the first slice only, land it as the first change.

Whichever branch: declare `repos:` in `.multivac/config.yml` before the brain's
first commit. Once committed, the config changes only inside a change.

Both paths converge on the same steady state: an anchored law, doors in
every repo, every subsequent decision entering as a change. From there the
rhythm is always `mvac change new → plan → apply → land → close`
(`references/change.md`).

A decision that is not ready to become work is recorded, not left to memory:
`mvac roadmap add <slug> "<title>" [--horizon now|next|later]` writes it as a
change in the `planned` state, and `mvac roadmap` reads the list back with the
count in flight beside it. A planned change reserves no invariant id, opens no
branch and never counts as unclosed, so recording one costs nothing and delays
no release. Starting it is `mvac change new <slug>` on that same slug, which
PROMOTES the file rather than writing a second one — so never scaffold a fresh
change for something already on the roadmap. And never treat the roadmap as a
precondition: `change new` on a slug nobody planned is correct, and no command
refuses work for not having been planned first (MV-89).

## Steady state: the rules

1. **Verify runs without you.** Hooks fire `mvac verify` at session start
   and at commit. Never skip it, never `--no-verify`. A broken blocking leg
   means the brain and the code disagree — resolve that before writing code
   on top of it. A lying brain does not produce ugly docs; it produces
   confidently wrong code across N repos.
2. **Read the `read` lines before you read the verdicts.** Each context
   verifies what it is responsible for: from the brain, every sibling repo is
   judged at its **channel ref** — the ecosystem as published — while the
   brain's own repo is judged at its working tree; from a code repo with the
   brain mounted, its own working tree, the content you are about to commit
   there. verify prints one `read` line per repo naming the ref or branch and
   its sha, so you never have to guess which bytes a red came from. A
   sibling parked off its channel is named there and in `mvac doctor`'s
   `branches` line. `mvac verify --worktree` asks the other question on
   purpose: local state across every repo. If a `read` line says a channel
   ref could not be resolved and it FELL BACK to a working tree, that repo's
   verdict is about somebody's local branch — fetch before you believe it.
   Each channel `read` line also carries the ref's **age**: verify never
   fetches, so an old `origin/main` means a fix already merged upstream is
   simply not in the bytes that were judged — `mvac repos sync` refreshes
   every repo. And if the brain's own line says it is *behind its own
   channel*, an out-of-date law table is judging a current ecosystem: pull the
   brain before you believe any red.
3. **Cite claims by ID.** Write "per INV-12", never a restatement. A
   paraphrase ages silently; an ID can be verified. This applies to doors,
   specs, change files, commit messages — everywhere law is referenced.
4. **Never relax an invariant in code.** The law changes first: open a
   change that declares "amends INV-xx", update the row (dated), then change
   the code in the same change. `mvac change close` checks law and code
   ended consistent.
5. **You propose; the human enacts.** New claims are filed as `proposed`
   rows. Only a human flips a row to `active` — an authority label like
   "published" means someone answered for it, and you cannot answer for it.
6. **A change is done when its anchors resolve, not when it merges.**
   Declare up front which claims the change makes true; `close` re-runs
   verify scoped to exactly those and refuses to archive until they hold.
7. **Retiring is authored, never derived.** Mark the row `retired` (keep the
   ID — never renumber, never reuse), then write NEW `absent` legs for the
   dead mechanism's identifiers. Do not flip existing legs. Procedure in
   `references/change.md`.
8. **`moved` is normal, not an alarm.** When verify rewrites a glob in
   place, review the diff like any other edit and let it ride the same
   branch.
9. **Code lands on a change's branch.** With an SDD declared, a commit or a
   merge that changes code outside the branch of an open change declaring
   that repo is refused, at commit, at merge and in the merge request
   pipeline. Start the change, `apply` it, and write the code in the worktree
   it prints. Changes to `.multivac/`, the doors and the tools' own files are
   not code.
10. **Walk the ritual `close` prints.** `.multivac/ritual.md` is the team's
   half of the closing ceremony — reviews, announcements, what ships before
   what. multivac prints it and checks none of it; take each line to the
   human before calling the change done.

## When you need the manual

| about to | read |
| --- | --- |
| inventory an existing ecosystem, validate seed output | `references/discovery.md` |
| interview for a from-scratch brain | `references/interview.md` |
| write or repair an anchor, pick a mode | `references/anchors.md` |
| run new/plan/apply/land/close, amend or retire an invariant | `references/change.md` |
| read a verify run — `moved`, `broken`, what gates, where it read from | `references/verify.md` |

## Ask the graph before you read the tree

If the door names a grapher, a code graph is kept current for you: after every
edit where your harness has a post-edit hook, and at `change land`, which
commits it on the change's branch. Use it to orient before grepping — one call answers what a search
takes many — and use **that tool's own verbs**, which are not interchangeable:

| grapher | ask |
| --- | --- |
| `graphify` | `graphify query "<question>"` — a question in words, returns the subgraph that answers it; `explain "<node>"` for one node and its neighbours; `path "<A>" "<B>"` for how A reaches B |
| `codegraph` | `codegraph query <symbol>` — symbol lookup by name; `--kind function\|class` narrows, `--json` for machine output |

Hand `codegraph` a sentence and you get nothing; hand `graphify` a bare
identifier and you have thrown away what it is for. The door prints the exact
verbs for the grapher this brain declares — read them there rather than
guessing, and if it says the tool has no query command, believe it and grep.
Where the tool's own install wrote its section into the door file (graphify's
`## graphify`), that section is the manual for its verbs.

How the repos, law rows, anchors and changes relate is a second graph,
`.multivac/ecosystem.json`, rendered from the brain's declarations. With
graphify, ask it with `--graph .multivac/ecosystem.json`, for example
`graphify explain "INV-12" --graph .multivac/ecosystem.json`, before walking
the law table and the change files by hand.
