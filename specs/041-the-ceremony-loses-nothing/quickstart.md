# Quickstart — proving the ceremony loses nothing

```sh
# 1. a claim anchored only in its own change file
mvac change close <slug>      # before: green, then unanchored forever
                              # after: refused, naming the claim

# 2. an archive that already exists
mvac change close <slug>      # before: overwrites it
                              # after: refused, naming the file

# 3. a retired row deleted
#    remove a `retired` row, stage it, commit
                              # before: green
                              # after: refused, like an active one

# 4. an unknown frontmatter key
#    add `owner: someone` to a change file and run any lifecycle step
                              # before: silently gone
                              # after: named as dropped
```
