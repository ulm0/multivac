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

- **Existing code** → discovery flow, `references/discovery.md`: run
  `mvac seed`, draft the map and the proposed law from its inventory,
  validate with the human in blast-radius batches, then `mvac doors`.
- **From scratch** → interview flow, `references/interview.md`: draw the law
  out of the person's head, decide the first slice only, land it as the
  first change.

Both paths converge on the same steady state: an anchored law, doors in
every repo, every subsequent decision entering as a change. From there the
rhythm is always `mvac change new → plan → apply → land → close`
(`references/change.md`).

## Steady state: the rules

1. **Verify runs without you.** Hooks fire `mvac verify` at session start
   and at commit. Never skip it, never `--no-verify`. A broken blocking leg
   means the brain and the code disagree — resolve that before writing code
   on top of it. A lying brain does not produce ugly docs; it produces
   confidently wrong code across N repos.
2. **Cite claims by ID.** Write "per INV-12", never a restatement. A
   paraphrase ages silently; an ID can be verified. This applies to doors,
   specs, change files, commit messages — everywhere law is referenced.
3. **Never relax an invariant in code.** The law changes first: open a
   change that declares "amends INV-xx", update the row (dated), then change
   the code in the same change. `mvac change close` checks law and code
   ended consistent.
4. **You propose; the human enacts.** New claims are filed as `proposed`
   rows. Only a human flips a row to `active` — an authority label like
   "published" means someone answered for it, and you cannot answer for it.
5. **A change is done when its anchors resolve, not when it merges.**
   Declare up front which claims the change makes true; `close` re-runs
   verify scoped to exactly those and refuses to archive until they hold.
6. **Retiring is authored, never derived.** Mark the row `retired` (keep the
   ID — never renumber, never reuse), then write NEW `absent` legs for the
   dead mechanism's identifiers. Do not flip existing legs. Procedure in
   `references/change.md`.
7. **`moved` is normal, not an alarm.** When verify rewrites a glob in
   place, review the diff like any other edit and let it ride the same
   branch.

## When you need the manual

| about to | read |
| --- | --- |
| inventory an existing ecosystem, validate seed output | `references/discovery.md` |
| interview for a from-scratch brain | `references/interview.md` |
| write or repair an anchor, pick a mode | `references/anchors.md` |
| run new/plan/apply/land/close, amend or retire an invariant | `references/change.md` |
