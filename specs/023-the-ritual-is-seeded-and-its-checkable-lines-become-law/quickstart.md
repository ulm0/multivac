# Quickstart: the seeded ritual

```bash
pnpm build
```

## Scenario 1 — a fresh brain gets candidates (SC-001)

```bash
T=$(mktemp -d) && node dist/cli.js init --sdd speckit "$T"
cat "$T/.multivac/ritual.md"
```

Expect candidate lines, every one commented.

## Scenario 2 — and still prints nothing (SC-002)

Open and close a change in that brain and confirm no ritual checklist is
printed.

## Scenario 3 — uncommenting adopts it

Uncomment one line, close a change, and confirm that line prints.

## Scenario 4 — an existing ritual is never overwritten (SC-004)

```bash
echo "- [ ] mine" > "$T/.multivac/ritual.md"
node dist/cli.js init "$T" && cat "$T/.multivac/ritual.md"
```

Expect exactly what was written.

## Scenario 5 — this repo's own ritual (SC-003)

```bash
cat .multivac/ritual.md
```

Every remaining line should be one no check could decide.
