# Quickstart: the flow page

```bash
pnpm build
```

## Scenario 1 — it exists and sorts (SC-001)

```bash
node dist/cli.js doors && cat .multivac/flow.md
```

Expect three headings and every declared adapter's obligations under the right
one.

## Scenario 2 — no identifiers (SC-002)

```bash
grep -cE "MV-[0-9]+" .multivac/flow.md || echo "0 — correct"
```

## Scenario 3 — derived (SC-003)

Change `sdd:` in the config, re-run `doors`, and diff the page. It should have
changed without anyone editing it.

## Scenario 4 — your writing survives (SC-004)

Append a paragraph below the closing marker, re-run `doors`, and confirm it is
still there.

## Scenario 5 — a bare brain still gets one (FR-008)

`init` a scratch directory with no adapters and confirm the page exists with the
lifecycle's own entries.
