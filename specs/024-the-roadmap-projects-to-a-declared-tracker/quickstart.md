# Quickstart: projecting the roadmap

```bash
pnpm build
```

## Scenario 1 — declare and project (SC-001)

Add `tracker: gitlab` to `.multivac/config.yml`, then:

```bash
node dist/cli.js roadmap sync
grep -n "^issue:" .multivac/changes/*.md
```

Expect an issue per change and a number recorded in each file.

## Scenario 2 — idempotent

```bash
node dist/cli.js roadmap sync
```

Expect "up to date" and no new issues.

## Scenario 3 — one way (SC-002)

Close an issue by hand in the tracker, then sync. The change file must be
unchanged, and the issue restored to what the file says.

## Scenario 4 — labels survive (SC-003)

Add a label by hand, sync, and confirm it is still there.

## Scenario 5 — no tool installed

```bash
PATH=/usr/bin:/bin node dist/cli.js roadmap sync; echo "exit $?"
```

Expect the refusal naming the binary, and a non-zero exit.

## Scenario 6 — the offline three are untouched (SC-004)

```bash
grep -rn "trackerSync" src/commands/verify.ts src/commands/doctor.ts src/commands/doors.ts
```

Expect no match.
