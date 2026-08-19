# Contract — what a check sees, and what it refuses

## What a check sees

| Repo being read | Hook running? | Index used |
| --- | --- | --- |
| the repo the hook is for | yes | the ambient one — the commit being composed |
| a sibling repo | yes | that repo's own on-disk index |
| any repo | no | the on-disk index, as today |

Under every commit form — plain, `-a`, pathspec, amend — the first row means
"the paths this commit contains", and the second means "that repo's state", not
this commit's.

## What is refused, and what is not

| Index vs HEAD | Verdict | Message names |
| --- | --- | --- |
| a row reaching `active` beside code it anchors | refused, exit 1 | the row, the paths, the `git restore --staged` line (unchanged) |
| a row `active` at HEAD, absent from the index | refused, exit 1 | the row ids, and retirement as the alternative |
| `.multivac/invariants.md` removed by the index | refused, exit 1 | the file, and that a brain without law verifies nothing |
| a row `active` → `retired` | allowed | — |
| a row `proposed` → absent | allowed | — |
| no HEAD / unreadable index / law not in this checkout | not answered, never gates | why it could not answer |

## Invariants of the contract

1. A gate never reports on a set of paths other than the one being committed.
2. Dropping the ambient pointers stays the default; keeping the index pointer is
   the exception, and only for the repo the environment describes.
3. Deleting law is never how law stops applying. Retirement is (MV-40's
   procedure), and it stays reviewable.
4. Every new refusal exits 1, like every other blocking finding — never 2,
   which is a refused argument.
