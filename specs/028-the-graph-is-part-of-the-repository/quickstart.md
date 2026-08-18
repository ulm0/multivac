# Quickstart: a graph only one checkout has

```bash
pnpm build
```

## Scenario 1 — untracked is refused

```bash
# in a brain with a declared grapher and an open, landed change:
mvac change close <slug>
```

Expect a refusal naming the root, `graphify-out/graph.json`, and the `git add`.

## Scenario 2 — tracked passes

```bash
git add graphify-out/graph.json && git commit -qm "chore: track the graph"
mvac change close <slug>
```

Expect the close to proceed.

## Scenario 3 — ignored says which rule

```bash
echo 'graphify-out/' >> .gitignore
mvac change close <slug>
```

Expect *is ignored by .gitignore — remove the rule, then …*.

## Scenario 4 — the skip still skips

```bash
mvac change close <slug> --no-grapher
```

Expect the close to proceed, with the printed line saying the gate was skipped.
