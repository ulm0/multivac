# Quickstart: the parser changed and nothing else did

```bash
pnpm install && pnpm build
```

## Scenario 1 — the refusal still refuses (MV-85)

```bash
node dist/cli.js doctor --sttrict; echo "exit $?"
node dist/cli.js doors elsewhere;  echo "exit $?"
```

Expect the command's own wording and exit 2, both times — an unknown flag and
an argument a command declares no room for. Measured:

```txt
doctor: unknown flag "--sttrict" — doctor takes --strict          exit 2
doors: unexpected argument "elsewhere" — doors takes --adopt      exit 2
```

## Scenario 2 — declared arguments parse the same

```bash
node dist/cli.js verify --strict .
node dist/cli.js count 'brain:src/*.ts /export/' .
```

## Scenario 3 — `--help` is still the dispatcher's answer

```bash
node dist/cli.js seed --help; echo "exit $?"
```

Expect seed's own usage, exit 0, and no seed report written.

## Scenario 4 — one package, no more

```bash
pnpm ls --depth 0
```

Expect exactly three production dependencies: `citty@0.2.2`, `picomatch`, `yaml`.
