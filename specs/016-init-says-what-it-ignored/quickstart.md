# Quickstart: re-running init

```bash
pnpm build
T=$(mktemp -d) && git -C "$T" init -q && echo x > "$T/a.ts"
git -C "$T" add -A && git -C "$T" -c user.email=t@i -c user.name=t commit -qm init
```

## Scenario 1 — the defect, before the fix

```bash
node dist/cli.js init --sdd speckit --grapher graphify "$T"
node dist/cli.js init --sdd opsx --grapher codegraph "$T"
grep -E "^sdd|^grapher" "$T/.multivac/config.yml"
grep -i "opsx\|speckit" "$T/AGENTS.md"
```

Before this change: the config says `speckit`, the door says `opsx`. After it:
the second command refuses and neither file moves.

## Scenario 2 — agreement is silent, and reported

```bash
node dist/cli.js init --sdd speckit "$T"
```

Expect the kept-config line plus one naming `--sdd speckit` as already
declared. Expect no refusal.

## Scenario 3 — nothing is written by a refusal (SC-002)

```bash
git -C "$T" status --porcelain > /tmp/before
node dist/cli.js init --sdd opsx "$T"; echo "exit $?"
git -C "$T" status --porcelain > /tmp/after
diff /tmp/before /tmp/after && echo "byte-identical"
```

## Scenario 4 — a first run is unchanged (SC-004)

```bash
T2=$(mktemp -d) && node dist/cli.js init --sdd speckit --grapher graphify "$T2"
grep -E "^sdd|^grapher" "$T2/.multivac/config.yml"
```

Expect both written, exactly as before.
