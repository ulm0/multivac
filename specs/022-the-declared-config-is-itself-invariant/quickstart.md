# Quickstart: the config gate

```bash
pnpm build
```

## Scenario 1 — refused with no change open (SC-001)

```bash
echo "# a comment" >> .multivac/config.yml
git add .multivac/config.yml
node dist/cli.js verify; echo "exit $?"
```

Expect the refusal naming both ways forward, and exit 1.

## Scenario 2 — allowed with a change open

```bash
node dist/cli.js change new probe "Probe"
git add .multivac/config.yml
node dist/cli.js verify; echo "exit $?"
```

Expect the allowed line naming the open change, and exit 0.

## Scenario 3 — a brain can be born (SC-002)

```bash
T=$(mktemp -d) && node dist/cli.js init "$T" && git -C "$T" add -A
node dist/cli.js verify "$T"; echo "exit $?"
```

Expect no refusal.

## Scenario 4 — silence when untouched (SC-003)

```bash
git reset && node dist/cli.js verify | grep -c config || echo "0 — correct"
```
