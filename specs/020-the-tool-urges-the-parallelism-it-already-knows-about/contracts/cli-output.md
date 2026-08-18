# Contract: what apply and the step instructions print

## `multivac change apply <slug>` — a stage with more than one repo

After the checkouts are handed back:

```text
work here — one checkout per repo, nobody else's tree moves:
  api: /path/to/worktrees/points-expire/api
  web: /path/to/worktrees/points-expire/web
these two are one stage: no ordering between them, and one checkout each — work them at once
  never the same file twice at once (a lost update), and never the law: ids are reserved one at a time and stages serialise there
```

Three repos in the stage reads `these three are one stage`.

## A stage with one repo

Nothing. There is nothing to say.

## The step instruction, with a declared tool

```text
sdd speckit: run /speckit.plan in your agent to design <slug> (Constitution Check, research, data model, contracts) [proof: specs/*<slug>*/plan.md — `change plan` refuses without it]
sdd speckit:   run the chain through without asking to continue — stop only for a question the tool itself raises (`--no-sdd` for one run, `sdd_auto: false` to stop printing these)
```

The continue clause appears once per lifecycle step, under the step it belongs
to.

## With the automation off

`sdd_auto: false` or `--no-sdd`: nothing about continuing is printed, because
nothing about the steps is.

## What never happens

Neither message is verified. No artifact proves an agent ran two things at once
or that it did not stop to ask, so gating either would be a check reading what
it cannot see — MV-27's reason, and MV-95 states it.
