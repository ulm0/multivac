# Quickstart — proving the projection survives

```sh
# 1. a linked worktree runs the repo's own gate
git worktree add ../wt HEAD
printf '#!/bin/sh\ntouch /tmp/RAN\n' > .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
cd ../wt && git commit --allow-empty -m x && ls /tmp/RAN   # before: missing

# 2. a declared refresh with an operator
#    refresh: sh -c 'graphify update . && echo done'
mvac change close <slug>     # before: split on spaces, breaks

# 3. one mangled door among several repos
printf '<!-- multivac:begin -->\n' >> ../other-repo/AGENTS.md
mvac doors                   # before: the run stops there

# 4. a gutted shim
printf '#!/bin/sh\nexit 0\n' > .multivac/hooks/pre-commit
mvac doctor --strict         # before: armed
```
