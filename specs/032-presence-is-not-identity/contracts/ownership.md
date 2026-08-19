# Contract — what multivac claims as its own

## Files

| Path | multivac owns | multivac never touches |
| --- | --- | --- |
| `AGENTS.md`, native doors, stub doors | the region between the managed markers | every byte outside it |
| a hook carrying the shim header | the whole file — it says "regenerate, do not edit" | — |
| a hook without that header | nothing | the whole file; a fix line is printed instead |
| `.multivac/projected.yml` | written when absent, moved by `doors --adopt` | left alone by every other run |

## Execution

A multivac hook executes, in order:

1. `node "$root/dist/cli.js"` — **only when `$root/package.json` names multivac**
2. `npx --no-install multivac` — when the repo declares it as a dependency
3. `mvac` on PATH
4. nothing: warn on stderr, exit 0. An absent gate never blocks a commit.

Rung 1 without the name test is the tool executing an unrelated program under
its own name; it is the only rung whose subject is not already identified by
being called multivac.

## Reports

| Report | True when |
| --- | --- |
| "runs multivac" | the mention is on a non-comment line |
| "armed" (`doctor --strict`) | the shim exists AND runs multivac by the rule above |
| "wired" | a foreign hook runs multivac by the same rule |

## Invariants of the contract

1. A projection reads before it writes, always, whatever the file kind.
2. One predicate decides "runs multivac", read by the installer and by
   `doctor` — never two copies (MV-74, MV-104).
3. Ownership is stated by the artifact, not inferred from its presence.
4. Refusals keep exit 0 for hooks — enforcement degrades, it never locks anyone
   out (MV-86's precedent).
