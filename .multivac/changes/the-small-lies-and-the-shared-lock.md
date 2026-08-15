---
slug: the-small-lies-and-the-shared-lock
status: open
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-58
    - MV-59
    - MV-60
  retires: []
claims:
  - id: MV-58
    statement: "One grapher refresh runs at a time per directory. Every path that shells a grapher — the harness post-edit hook and `change close` — takes the same `.multivac/cache/graph-refresh.lock`, a `mkdir` on the scope's own checkout. The two paths differ in what they do when it is held: the hook SKIPS (another refresh already covers this edit), close WAITS on a bounded poll and then proceeds with a notice, because close is the net for edits made outside a harness and a skipped close leaves the graph stale with nobody left to refresh it. The 30-minute sweep in the hook cannot tell a killed process from a slow one, and the code says so instead of claiming it clears stale locks."
  - id: MV-59
    statement: "The registry never invents a grapher's contract. A grapher name absent from `knownGraphers` and from the config's own `graphers:` declarations is UNVERIFIED: `grapherSpec` returns null, and every caller prints the exact fields to declare instead of deriving `<name>-out/graph.json`, `<name> update .` and `npm i -g <name>` from the name — a shape that matched exactly one of 47 surveyed tools. An unknown tool becomes usable without a registry MR by declaring `graphers.<name>` in `.multivac/config.yml` with `artifact` and `refresh` (and optionally `create`, `binary`, `install`); the binary defaults to the first word of `refresh`, because a tool's binary name is not its adapter name (`depcruise` != `dependency-cruiser`). Artifact paths multivac chose rather than the vendor are named as multivac's choice in the entry's note, and a field the vendor's docs do not state is marked UNVERIFIED rather than guessed."
  - id: MV-60
    statement: Every finding line names the repo it was found in. A leg's matches, the files that fail an `each`, and the candidate files of an ambiguous self-heal all print as `<repoKey>:<file>[:<line>]`, whether the leg is anchored to one repo or to `*` — an unprefixed `src/cli.ts:42` is ambiguous the moment a second repo is declared.
---

# The small lies and the shared lock

Five defects, each found by a prover or by running the tool for real.

**The shared lock was not shared.** `change close` called `refreshGraph`
without taking the lock the post-edit hook takes — measured: two
`graphify update .` processes 73ms apart, both writing the same directory.
Close now takes the same lock, but waits on it rather than skipping: the hook
skips because a running refresh already covers its edit, while close is the
last chance to refresh edits made outside a harness. And the hook's comment
claimed the 30-minute sweep "clears a lock left behind by a killed process" —
it cannot tell one from a slow refresh; the comment now says the real ceiling.

**The registry invented artifact paths.** `grapherSpec` derived
`<name>-out/graph.json`, `<name> update .` and `npm i -g <name>` from the name.
Across 47 surveyed tools that shape matched exactly one — graphify, the tool it
was written from. So an unknown grapher "worked" by the registry inventing its
contract: multivac's one unforgivable error, applied to itself. An unknown name
is now unverified, and the fix for the user is `graphers:` in their own config,
not a merge request against ours.

Four verified entries land with it — `code-review-graph`, `axon`,
`dependency-cruiser` (binary `depcruise`, artifact path ours not the vendor's)
and `scip-typescript` — with every field the vendor does not document marked
UNVERIFIED instead of guessed.

**Three messages that misdirected.** The pin-staleness line told the user to
run `repos sync`, which fetches but does not move a submodule pin; it now
prints the `git submodule update --remote` line `doctor` already knew. `land`
said "recording without evidence" on the normal path — a brain==code repo
landing through a squashed MR — reading as a warning for the common case. And
git failures printed the last line of stderr, which is where git puts its
advice ("and the repository exists."), not its cause; the first `fatal:` line
is the cause.

**Finding lines were ambiguous.** A single-repo leg printed `src/cli.ts:42`
while a `*` leg printed `api:src/cli.ts:42`. In a six-repo ecosystem the first
form does not say where to look.
