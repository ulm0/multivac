---
slug: the-gaps-that-were-not-gaps
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-50
    - MV-59
  adds: []
  retires: []
claims:
  - id: MV-59
    statement: "The registry states what the vendor documents and marks UNVERIFIED only what it does not. An entry whose install line, artifact, refresh or create command is published by the project carries it verbatim, with the primary source in `source`; UNVERIFIED is the answer to a real gap, never a default for a field nobody looked up, because an entry that hides a published fact sends the reader to guess the very name the fix exists to stop guessing (PyPI `axon` is not `axoniq`, the way npm `graphify` is not `graphifyy`). An artifact path multivac chose rather than the vendor is not only named as multivac's choice: the refresh command shipped beside it must write that path as-is in a repo that has never run the tool."
  - id: MV-50
    statement: A failing grapher refresh hands back the tool's OWN words. `refreshGraph`'s warning quotes the first lines of the tool's stderr, not node's `Command failed` line — which only repeats the command the same warning already prints and buries the cause the tool wrote down.
---

# The gaps that were not gaps

Four defects found by running the tool against the real binaries, all of them
the mirror image of the lie the previous change went after. That change stopped
the registry inventing contracts; these are the places it overcorrected into
saying "unknown" about something the vendor had written down, and the one place
it stated a path it never made true.

**Two gaps that were not gaps.** `code-review-graph`'s entry said "the project
documents no install line" — its README documents two, `pip install
code-review-graph` and `pipx install code-review-graph`, and PyPI serves the
package at 2.3.7 with the matching summary. `axon`'s said "no install line
published; build it from the repo" — its README publishes `pip install axoniq`
and PyPI serves it at 1.0.1. The second is the worse of the pair, and it is the
graphify trap exactly: the adapter is called `axon`, PyPI's `axon` is an
unrelated library for talking to visionmedia's axon, and an entry that declines
to name `axoniq` leaves the reader to guess from the adapter name — the guess
the registry exists to prevent.

**A path multivac chose and never made true.** The `dependency-cruiser` entry
picks its own artifact, `dependency-cruiser-out/graph.json`, and says so
honestly. But depcruise's `--output-to` does not create directories: in a repo
that has never run the tool the refresh dies with `ENOENT`, and `depcruise
--init` writes a config file, not that directory. Measured end to end — a
`change close` in a fixture brain with the entry declared reported `refresh
failed` every time. The artifact is multivac's to choose, so it is chosen where
the shipped command already writes it: `dependency-cruiser-graph.json` at the
repo root, the same shape as `scip-typescript`'s `index.scip` one row down.

**A failure that hid the cause.** The warning read `refresh failed (Command
failed: depcruise --output-type json --output-to ...)` — node's message, which
says only the command the rest of the same line already prints. depcruise had
written the real cause to stderr and multivac threw it away. This is the git
defect the previous change fixed (`fatal:` over the last line of advice) left
standing one module over; the tool's own first lines are quoted now, the way
`toolVerdict` has always quoted a validator's.

`depcruise`, `scip-typescript` and `graphify` were run for this change and the
PyPI entries for `code-review-graph` and `axoniq` fetched; nothing here is a
guess about a tool nobody ran.

MV-50 and MV-59 amended. No new law: MV-59 already said not to guess, and the
converse — do not plead ignorance either — belongs in the same sentence.
