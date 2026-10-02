---
name: multivac
description: Operating manual for brain-driven development with multivac. Load when the brain is empty (session zero), when validating mvac seed output, when writing or repairing anchors, when planning/applying/landing/closing an ecosystem change, or when amending or retiring an invariant.
---

# multivac — operating protocol

The brain door says where the law is, which repos exist, which SDD binds and
what each SDD step proves. The rhythm is `change new → plan → apply →
land → close` (`multivac change` lists it). Each step says what it did and what
it left to you, and each refusal names what it looked for and the command that
fixes it: run what they print. Where `plan` prints no next step, `apply` is
next. This skill carries what they do not.

**Where you are.** Behind a consumer door you are in a code repo, the brain
mounted at the path it names: write code in the worktree `change apply` printed
and run `verify` there; run `change`, `roadmap` and `seed` in the brain's own
checkout, never in the mount, and read the brain's door there. Never `multivac
init` a code repo, whatever a refusal there says.

## Session zero

The brain door says the brain is empty. Ask the human ONE question first:

> Does this ecosystem already exist as code, or are we starting from scratch?

Existing code → `references/discovery.md`. From scratch →
`references/interview.md`. Either way, declare `repos:` in `.multivac/config.yml` before the brain's
first commit; once committed, the config changes only inside a change.

## The rules

1. **Verify is never skipped.** Never `--no-verify`. A red blocking leg means
   the brain and the code disagree: resolve it before writing code on top.
2. **Read the `read` lines before you read the verdicts.** Each names the bytes
   judged and any fallback (MV-53); a quiet run folds the plain ones into its
   one line (MV-151). `references/verify.md` says what each asks before you
   believe a red.
3. **Cite claims by ID.** "per INV-12", never a restatement — in doors, specs,
   change files and commits: everywhere law is referenced. A paraphrase ages
   silently; an ID can be verified (MV-126).
4. **Never relax an invariant in code.** The row changes first, dated, in the
   same change as the code.
   `close` verifies only the rows the change claims, so claim the row you amend
   (MV-150).
5. **You propose; the human enacts.** You file `proposed` rows; only a human
   makes a row `active` (MV-81). `close` enacts nothing.
6. **Code lands on a change's branch.** Write code only in the worktree `change
   apply` prints. Where an SDD governs the repo and `sdd_auto` is on, the brain's
   own checkout refuses code elsewhere at commit; a code repo's hook reports it
   and CI's `verify --strict --range` refuses it (MV-137). `.multivac/`, the
   doors and the tools' own files are not code.
7. **The roadmap is never a gate.** `change new` on a planned slug PROMOTES the file rather than writing a second one (MV-89);
   on an unplanned slug it is just as correct.

## When to read what

| about to | read |
| --- | --- |
| inventory existing code, validate seed output | `references/discovery.md` |
| interview for a from-scratch brain | `references/interview.md` |
| write or repair an anchor | `references/anchors.md`; grammar: `mvac help anchor` |
| run a change, walk the ritual, amend or retire a row | `references/change.md` |
| judge a `moved`, `broken` or `read` line | `references/verify.md` |
