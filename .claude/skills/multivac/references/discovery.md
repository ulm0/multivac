# Discovery: seed an existing ecosystem

You are standing in a brain that is empty while the code already exists.
Your job: turn the code's boundaries into a map and a proposed law, get the
human to enact it, and project doors. The flow is
**seed → questions → interview → law**: the seeder reads and asks; a human
answers; you draft; the human enacts. Never skip the human.

## 1. Run the seeder

```
mvac seed
```

Deterministic inventory of where the ecosystem's architecture lives, written
to `.multivac/seed-report.md`, grouped by category per declared repo:

- **policy gates** — the project's law already written in machine form:
  `.pre-commit-config.yaml`, semgrep rules, eslint/biome/ruff/mypy configs,
  CODEOWNERS. The highest-density rule source there is: each entry is a
  pattern with a rationale, waiting to be lifted into a claim.
- **workspace / build graph** — `pnpm-workspace.yaml`, `turbo.json`,
  `go.work`, `*.sln`/`*.csproj`: workspace membership and the cache contract.
- **deploy manifests** — kubernetes manifests, helm charts, kustomize,
  skaffold, cloudbuild.
- **decisions / intent** — ADRs, RFCs, `AGENTS.md`/`CLAUDE.md`,
  CONTRIBUTING. Prior art, not competition: read these before drafting.
- **models / schema, migrations, runtime config, routes, protobuf, graphql,
  sql, api specs, docker, terraform, ci, package manifests, env examples.**

Test fixtures, `examples/` and vendored trees are excluded; each category
lists at most 25 files plus a count. Nothing in the report is law. If a
declared repo is missing locally, seed reports it unevaluated; run
`mvac repos sync` first if you need full coverage.

## 2. Read the inventory BY CATEGORY, not by repo

Read all policy gates across repos, then all deploy manifests, then all
models. A category read surfaces the cross-repo contract (the API the web
client calls, the table two services share); a repo-by-repo read hides
exactly that. Take notes per category: what exists, what talks to what,
what looks deliberate vs accidental.

## 3. Take the open questions to a human

The report ends with three **open questions** — the ones every cold adopter
answers wrong when they guess, instantiated against what seed found:

- **Debt or intent?** The code violates a written rule — is the violation
  debt to fix, or is the rule dead? Grep HEAD for each candidate before
  filing it, then ask.
- **Law or taste?** Which prose rules are enforced and which are
  preferences? Only a maintainer knows.
- **Which authority wins?** semgrep vs AGENTS.md, helm vs kustomize vs raw
  manifests — when two sources disagree, the law table must name the winner.

These are the interview's input: run the interview protocol
(`interview.md`) against them, question by question, before drafting. Each
answer is a five-second maintainer call that is unresolvable without one;
a guessed answer becomes wrong law and no metric will show it.

## 4. Draft the map and the proposed law

**Map pages**: what exists, what calls what, what contract each surface
exposes. The map is the only layer that scales with the ecosystem — keep
each page short and factual. No adjectives, no history you don't have.

**Proposed claims**: for each boundary that looks deliberate, draft a claim
row plus a tentative anchor. Start from the policy gates — a semgrep rule or
pre-commit hook is a rule the project already enforces, with the rationale
attached. A `REVOKE UPDATE` in a migration *suggests* "nobody writes
accounts" — suggests, you do not know why it's there. File it as `proposed`
and let the human say why, or say it's an accident. Cite the source
document (the ADR, the AGENTS.md section, the gate) in the row.

Anchor grammar, one leg per line, in an HTML comment under the row
(full manual: `anchors.md`):

```
<!-- @anchor <CLAIM-ID> <repo-key>:<glob> [![<repo-key>:]<glob> ...] /<regex>/[flags] [mode] -->
```

- `repo-key` is the registry key from `.multivac/config.yml`; `*` means
  every declared repo plus the brain.
- An exclusion is repo-relative and bites everywhere the leg evaluates;
  `!<repo-key>:<glob>` bites in that one repo only.
- Dialect is POSIX ERE with `[[:space:]]`-style classes. `\s` `\b` `\d`
  `\w` are rejected at parse time.
- Modes: `present` (default), `absent`, `unique`, `count=N`.
- Anchor to the contract site you just inventoried (the migration, the
  schema, the route table) — that is both what you read and what moves
  least.

Example of a drafted proposed row:

```markdown
| INV-07 | Only `billing_role` may write `accounts.balance`. | proposed | proposed | 2026-08-13 | seed |
<!-- @anchor INV-07 api:db/migrations/*.sql /revoke[[:space:]]+update[[:space:]]+on[[:space:]]+accounts/i -->
```

## 5. File everything as proposed

Every drafted claim lands in the law table with state `proposed`.
`proposed` rows never block verify — the brain is honest about what is
validated and what is not. Do not mark anything `active` yourself.

## 6. Validate in blast-radius batches

Order the proposed rows by blast radius — what breaks the most if the claim
is wrong comes first: money and data-loss surfaces, then externally
published promises, then internal contracts, then conventions. Present them
to the human in small batches. Per row, three outcomes:

- **accept** — the human enacts: state → `active`, authority set by them.
- **correct** — the statement or the anchor was wrong; fix and re-present.
- **discard** — delete the row; an accident is not law.

Whatever the session doesn't reach stays `proposed`: visible, counted,
non-blocking. Never bulk-accept to finish faster — an enacted lie is worse
than an unvalidated truth.

## 7. Project the doors

```
mvac doors
```

Writes the brain door and each consumer repo's door (managed block only —
hand-written content around it is untouched), installs the hooks. From here
the ecosystem is in steady state: run `mvac verify` to see the baseline, and
every next decision enters as `mvac change new`.
