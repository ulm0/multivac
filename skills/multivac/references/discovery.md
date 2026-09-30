# Discovery: seed an existing ecosystem

The brain is empty and the code exists. Turn the code's boundaries into a map
and a proposed law, get the human to enact it, and project doors:
**sync → seed → questions → interview → project document → law → doors**. The
seeder reads and asks; a human answers; you draft; the human enacts. Never skip
the human.

## 0. Sync

`mvac repos sync` clones every declared repo and equips it: the declared SDD in
the brain, each repo's grapher. Then `mvac repos check` names per repo what is
still missing. Draft no law over a repo that is not cloned, or, where a grapher
is declared, that has no graph to ask.

## 1. Run the seeder

`mvac seed` writes `.multivac/seed-report.md`: where the architecture lives, by
category per repo, and each repo's setup. Nothing in it is law. Start from the
**policy gates** (pre-commit, semgrep, linters, CODEOWNERS): each is a rule the
project already enforces, with its rationale, waiting to be lifted into a
claim. Read the **decisions** (ADRs, `AGENTS.md`, CONTRIBUTING) before drafting:
prior art, not competition.

## 2. Read the inventory BY CATEGORY, not by repo

All policy gates across repos, then all deploy manifests, then all models. A
category read surfaces the cross-repo contract (the API the web client calls,
the table two services share); a repo-by-repo read hides exactly that. Note
what exists, what talks to what, and what looks deliberate or accidental.

## 3. Take the open questions to a human

The report ends with three open questions, instantiated against what seed
found. Put them to a human through the interview protocol (`interview.md`),
question by question, before drafting: each is a five-second maintainer call,
and a guessed answer becomes wrong law no metric will show.

## 4. Draft the map and the proposed law

**Map pages**: what exists, what calls what, what contract each surface
exposes. Short and factual; no adjectives, no history you do not have.

**Proposed claims**: for each boundary that looks deliberate, a row plus a
tentative anchor on the contract site you inventoried (`anchors.md`). A
`REVOKE UPDATE` in a migration *suggests* "nobody writes accounts": file it as
`proposed` and let the human say why, or that it is an accident. Cite the source
document (the ADR, the `AGENTS.md` section, the gate) in the row.

## 5. File everything as proposed

Every drafted claim lands as `proposed`, which never blocks verify: the brain
is honest about what is validated. Do not mark anything `active` yourself.

## 6. Validate in blast-radius batches

Order the proposed rows by what breaks most if the claim is wrong: money and
data loss, then published promises, then internal contracts, then conventions.
Present small batches. Per row: **accept** (the human enacts, state `active`,
authority theirs), **correct** (fix and re-present), or **discard** (an
accident is not law). What the session does not reach stays `proposed`. Never
bulk-accept: an enacted lie is worse than an unvalidated truth.

## 7. Write the brain's project document

After the first batch, write the brain's project document where its SDD
declares one (the brain door names the command); no code repo has its own.
Write it from the human's answers, cite the rows it restates by ID, and never
invent a principle.

## 8. Project the doors

`mvac doors`, then `mvac verify` for the baseline. Every next decision enters
as `mvac change new`.
