# Quickstart: one door, two commands

```bash
pnpm build
T=$(mktemp -d) && git -C "$T" init -q -b main
```

## Scenario 1 — the graph reaches the first reader

```bash
node dist/cli.js init --grapher graphify --quiet "$T"
grep -c 'graphify' "$T/AGENTS.md"
```

Before: `0`. After: the door names the tool and its query verbs.

## Scenario 2 — projection does not move it (SC-001)

```bash
cp "$T/AGENTS.md" /tmp/door-before
(cd "$T" && node "$OLDPWD/dist/cli.js" doors)
diff /tmp/door-before "$T/AGENTS.md" && echo "byte-identical"
```

Before: the whole managed block was rewritten. After: no diff.

## Scenario 3 — an empty brain still says so

```bash
grep 'brain empty' "$T/AGENTS.md"
```

## Scenario 4 — user content is untouched

```bash
printf '\n## my notes\nkeep me\n' >> "$T/AGENTS.md"
(cd "$T" && node "$OLDPWD/dist/cli.js" doors)
grep -c 'keep me' "$T/AGENTS.md"
```

Expect `1`.
