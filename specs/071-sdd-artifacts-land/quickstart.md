# Quickstart: validating this feature

## 1. close stages the slug's artifacts (FR-001, FR-002, SC-001)

In a scratch brain with speckit declared, run a change through to close with a
feature directory on disk, then:

```
node dist/cli.js change close <slug> | grep 'git add --'
```

Expected: the pathspec names `specs/<n>-<slug>`, and running the printed command
leaves `git status --porcelain` empty of anything under it.

## 2. A deletion inside the directory lands too (FR-001)

Delete a file inside the feature directory before closing; expect the printed
commit to cover it, and the deletion to be staged when the command runs.

## 3. What the run did not write is never staged (FR-003, SC-002)

Modify `.specify/memory/constitution.md` before closing. Expect a line naming it
and no mention of it in the pathspec.

## 4. With no SDD, nothing changes (FR-004)

Close a change in a brain with no `sdd:` declared. Expect the pathspec to be the
change file, the law, the graph and the ecosystem graph.

## 5. Equip runs before the carry (FR-005, SC-004)

Apply a change naming a repo that does not exist yet:

```
node dist/cli.js change apply <slug> 2>&1 | grep -n 'created\|installed\|carried'
```

Expected: the created line, then the equip lines, then the carry line, in that
order, and no duplicate copy of the carried artifacts in the checkout.

## 6. A fresh openspec brain commits its own step zero (FR-006, SC-003)

```
node dist/cli.js init --sdd opsx        # no grapher
git add -A && git -c core.hooksPath=.multivac/hooks commit -m 'multivac init'
```

Expected: the commit passes. Measured before this change: refused over
`.agents/**`.

## 7. The law holds (FR-007, SC-005)

```
node dist/cli.js verify --strict
node --test "dist-test/**/*.test.js"
```
