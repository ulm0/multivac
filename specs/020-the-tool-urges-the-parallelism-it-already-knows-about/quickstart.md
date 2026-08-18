# Quickstart: the urging

```bash
pnpm build
```

## Scenario 1 — two repos in one stage (SC-001)

Declare `landing_order: [[api, web]]` and apply:

```bash
node dist/cli.js change apply points-expire
```

Expect both checkouts named, then the line saying they are one stage and may be
worked at once, then the boundaries.

## Scenario 2 — one repo per stage (SC-002)

Declare `landing_order: [[api], [web]]` and apply. Expect no parallel line.

## Scenario 3 — the boundaries are always attached (FR-003)

Grep the output of scenario 1 for `never the same file` and `never the law`.

## Scenario 4 — the chain says continue (SC-003)

```bash
node dist/cli.js change new probe "Probe"
```

Expect each `sdd` step line followed by the continue clause naming the opt-out.

## Scenario 5 — the opt-out (FR-008)

```bash
node dist/cli.js change new probe2 "Probe" --no-sdd
```

Expect no step lines and no continue clause.

## Scenario 6 — nothing is refused (SC-004)

Every scenario above exits 0.
