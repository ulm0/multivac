# Phase 1 — Data model: The gate reads the commit it gates

## Ambient git environment

Not a stored entity: the process environment a hook inherits.

| Variable | Today | After |
| --- | --- | --- |
| `GIT_DIR` | dropped for every call | dropped for every call — it is what makes `-C` meaningless |
| `GIT_INDEX_FILE` | dropped for every call | **kept for the ambient repo only**; dropped for every other |
| `GIT_WORK_TREE`, `GIT_COMMON_DIR`, `GIT_OBJECT_DIRECTORY`, `GIT_ALTERNATE_OBJECT_DIRECTORIES`, `GIT_PREFIX` | dropped | dropped, unchanged |

**Ambient repo**: the repository whose absolute git directory equals the one the
ambient `GIT_DIR` resolves to. Resolved once per process; `GIT_DIR` unset means
there is no ambient repo and nothing changes.

## Staged paths

The set a commit is composed of. Same shape as today — `string[] | null`, null
meaning "could not be read" — but sourced from the ambient index when the target
IS the ambient repo.

## Row transition

Read from two parses of the same file, the HEAD blob and the index blob.

| At HEAD | In the index | Verdict |
| --- | --- | --- |
| absent | `active` | refused when it lands beside the code it anchors (MV-81, today) |
| `proposed` | `active` | same as above (today) |
| `active` | `active` | nothing to say |
| `active` | `retired` | allowed — the sanctioned exit |
| `active` | **absent** | **refused** (MV-107, new): retire it, do not delete it |
| `proposed` | absent | allowed — a reservation given back, which `close --abandon` does |
| anything | file absent from the index | **refused** (MV-107, new): the law file itself is being removed |

Unanswerable states — no HEAD, unreadable index, law not in this checkout —
report that they did not answer and never gate, exactly as MV-81 does today.
