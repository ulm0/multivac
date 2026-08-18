# Quickstart: the door two commands write

```bash
pnpm build
T=$(mktemp -d) && git -C "$T" init -q -b main
```

## Scenario 1 — the defect

```bash
node dist/cli.js init --quiet "$T"
node dist/cli.js init --sdd speckit "$T"
grep -c '^sdd:' "$T/.multivac/config.yml"          # 0 — the config declares none
grep -o 'Features gate through the `[a-z]*` SDD' "$T/AGENTS.md"
```

Before: the door names speckit while the run reported the flag as unanswered.
After: no match.

## Scenario 2 — the two commands agree (SC-001)

```bash
grep -o 'Features gate through the `[a-z]*` SDD' "$T/AGENTS.md" || echo "none"
node dist/cli.js doors
grep -o 'Features gate through the `[a-z]*` SDD' "$T/AGENTS.md" || echo "none"
```

Before: `init` named speckit and `doors` named none. After: both say `none`.
The door BODIES still differ between the two commands — `init` scaffolds, `doors`
projects — which is a separate question and deliberately not this one.

## Scenario 3 — a declared adapter still reaches the door

```bash
T2=$(mktemp -d) && git -C "$T2" init -q -b main
node dist/cli.js init --sdd speckit "$T2"          # first run: the flag writes the config
grep -o 'Features gate through the `[a-z]*` SDD' "$T2/AGENTS.md"
```

Expect speckit, unchanged.

## Scenario 4 — the refusal is untouched

```bash
node dist/cli.js init --sdd opsx "$T2"; echo "exit $?"
```

Expect the refusal and exit 1.
