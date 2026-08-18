# Quickstart: staleness at the start of work

```bash
pnpm build
```

## Scenario 1 — a pin behind is reported at new (SC-001)

In a scratch ecosystem with the brain mounted in `api`, land a commit in the
brain, leave `api`'s gitlink where it was, then:

```bash
node dist/cli.js change new points-expire "Points expire"
```

Expect a `stale` line naming `api`, the distance, the last-fetch age, and the
refresh command — and expect the change to be created regardless.

## Scenario 2 — and at apply (FR-002)

```bash
node dist/cli.js change apply points-expire
```

Expect the same report.

## Scenario 3 — current pins are silent (FR-007)

Refresh the gitlink, re-run either command, and expect no staleness output.

## Scenario 4 — never refused (SC-002, FR-003)

With a stale pin, confirm both commands exit 0 and the change file exists.

## Scenario 5 — offline (SC-004, FR-008)

Run both with the network unavailable and confirm identical output.
