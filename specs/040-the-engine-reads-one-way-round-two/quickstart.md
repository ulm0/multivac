# Quickstart — proving the engine reads one way

```sh
# 1. a heal must not land on prose
#    a .ts leg whose pattern also appears in a .md page
mvac verify        # before: the glob is rewritten to the .md file
                   # after: not healed, and the refused candidate is named

# 2. a symlink gets one verdict
ln -s AGENTS.md LINKED.md && git add LINKED.md
mvac verify --worktree ; mvac verify    # before: two different answers
                                        # after: not read at all, either way
```

## The suite

```sh
pnpm test
```
