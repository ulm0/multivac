# Quickstart: the consumer door

```bash
pnpm build
```

## Scenario 1 — the ecosystem list (SC-001)

In a scratch ecosystem declaring `api`, `web` and `mobile`:

```bash
node dist/cli.js doors
grep -A6 "Repos in this ecosystem" ../acme-api/AGENTS.md
```

Expect: the brain's handle, then all three repos, with `(this repo)` on `api`
and roles only where declared.

## Scenario 2 — roles are declared, never derived (FR-003)

Add `role: the contract every surface consumes` to `api`, re-project, and
confirm it appears beside that entry and nowhere else. Remove it and confirm the
line stops at the path.

## Scenario 3 — the refresh is first (SC-002)

```bash
head -12 ../acme-api/AGENTS.md
```

Expect the refresh instruction before the law, the list and the adapters, with
the reason attached.

## Scenario 4 — one repo, no list (FR-005)

Declare a single repo, re-project, and confirm no list is printed.

## Scenario 5 — a declared repo that is not on disk (FR-010, edge case)

```bash
mv ../acme-mobile /tmp/gone && node dist/cli.js doors
grep mobile ../acme-api/AGENTS.md
```

Expect `mobile` still listed. The list describes what the ecosystem declares,
not what this machine has.

## Scenario 6 — the door probes nothing (SC-004, FR-009)

```bash
grep -nE "(existsSync|readFileSync|readdir|statSync)\(" src/doors/consumer.ts
```

Expect no match.
