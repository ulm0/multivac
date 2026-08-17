# Contract: the notice and the two fields

## `.multivac/projected.yml`

```yaml
# Written by multivac, never by hand. The version this brain was deliberately
# brought to — not whatever binary last touched it.
version: 0.3.0
```

Written by `init` at creation. Moved by `mvac doors --adopt` and by nothing
else. A brain with no such file predates the record; that is an absence, not
version zero.

## `.multivac/config.yml`

```yaml
requires: ">=0.3.0"
```

Hand-authored. The tool **never** writes this field. Grammar is `>=X.Y.Z` and
nothing else — the field is a floor, so it takes a floor's grammar. Anything
else is refused, naming the accepted form.

## The three lines

```
mvac: this brain requires >=0.4.0 and you are running 0.3.0 — the gate is
      below the floor this team declared. npm i -g multivac@latest
```
red · the running binary is under `requires`

```
mvac: this brain was brought to 0.2.0 and you are running 0.3.0 —
      run `mvac doors --adopt` to re-project and record it
```
yellow · the record disagrees with the running binary

```
mvac: this brain has no record of the version it was brought to —
      run `mvac doors --adopt` to write one
```
yellow, mildest · no record

Silence when they agree. Every line names both versions and ends in a command.

## Invariants of the notice

- **It never changes an exit code.** Nothing is refused over a version.
- **It never writes anything.**
- **It is emitted once per run**, from the dispatcher, before the command runs.
- **It goes to stderr**, so machine-read stdout stays clean.
- **It survives `NO_COLOR`**: the words carry the severity, colour only makes it
  faster to see.

## What is deliberately not here

**What changed between the two versions.** That needs a per-release ledger of
brain effects — declared by the release author and checked against its own diff,
so a release touching the hook code cannot claim it changed nothing. It is a
later change, and this contract does not gesture at it as though it shipped.
