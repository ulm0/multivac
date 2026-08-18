# Data Model: The brain door has one rendering

## The document

| Part | Comes from | Present when |
|---|---|---|
| heading and "this repo is the brain" | fixed | always |
| "It is also the code it governs" | `repos.brain` is `.` | brain==code |
| ecosystem repo list | `repos`, minus the brain entry | at least one sibling |
| law, change, ritual, verify pointers | fixed | always |
| graph block | `grapher` / `graphers` | a grapher applies |
| SDD block | `sdd` | an sdd is declared |
| "brain empty — load the multivac skill" | the law table | zero active rows |

One table, one function, two callers. Before this change the scaffolding caller
built its own version of rows 1, 4, 7 and the SDD block, and had no row 3, 5.

## Who reads what

| Command | Reads | Writes |
|---|---|---|
| `init` | the config it just wrote or kept | the managed block |
| `doors` | the config | the managed block |

Neither reads a flag. That is MV-101, and after this change it is stated once.
