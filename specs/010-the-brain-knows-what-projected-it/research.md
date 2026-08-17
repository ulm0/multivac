# Research: A brain knows what projected it

Phase 0. Four decisions, three of them settled by measurement or by the
operator, one reversed during design.

---

## D1 — Two files, because `doors` does not write `config.yml`

**Measured before deciding.** `grep` for writes to the config across `src/`
returns exactly one writer: `init`, rendering a template. `doors` reads it and
never writes it.

That matters because the first design put the record in `config.yml` and had
`doors` refresh it. `config.yml` as seeded is dense with hand-written comments
explaining each key; a YAML round-trip destroys them, and `doors` would have
become the first command to rewrite a file a human authors.

**Decision.** Two files, and the split lands on the project's own grain:

| file | owner | content |
| --- | --- | --- |
| `.multivac/config.yml` | human | `requires:` — the floor this team will trust |
| `.multivac/projected.yml` | tool | `version:` — what this brain was brought to |

The floor is a decision, so a person writes it. The record is a fact, so the
tool does. Neither writes the other's file.

**Key name.** `version:`, chosen by the operator over `multivac:`. The file name
already says whose it is; the key should say what it is.

---

## D2 — The record moves only under an explicit act, and this reversed the design

The first design had `doors` restamp on every run, on the reasoning that `doors`
re-projects and therefore brings the brain current.

**The operator rejected it, and the reason survives inspection.** People run
`doors` for unrelated causes — they edited `doors:` or `grapher:` in config. If
that restamps, the notice **disappears without the upgrade having been taken**.
Worse than no notice: it looks resolved. The nag must survive until someone says
"I have adopted this version".

**Decision.** `mvac doors --adopt` re-projects *and* records. Bare `mvac doors`
re-projects and leaves the record alone, so the notice persists.

**Why a flag and not a new command.** The work is exactly what `doors` already
does; a separate `upgrade` command would be `doors` plus one line, and a second
name for one action is how a CLI grows two ways to do the same thing. The flag is
declared, so MV-85's refusal covers a typo of it.

**Alternative rejected: the human edits the file.** It is tool-owned. Asking a
person to hand-edit a machine record is how the record stops being trustworthy.

---

## D3 — Warn always, refuse never — and the reason the first instinct was wrong

The first instinct was to refuse below a declared floor: a gate that cannot be
trusted should not report a verdict.

**The operator chose warn-loudly-and-constantly.** The existing posture agrees
with them and the instinct did not: the hook shim, finding no runnable multivac
at all, warns on stderr and **exits 0** — enforcement degrades, it never locks
you out. That principle is about the tool's absence, and a wrong version is a
near neighbour of absence, not of malice.

**Decision.** Three severities, no refusals:

| state | severity | line |
| --- | --- | --- |
| running < `requires` | **red** | this team declared a floor and this gate is under it |
| running ≠ record | **yellow** | which projected, which is running, what to run |
| no record | **yellow**, once, mildest wording | this brain predates the record |
| agreement | silent | — |

Every line ends in a command. A notice without an action is a nag, and a nag is
what people learn to scroll past.

---

## D4 — `>=X.Y.Z` and nothing else

`requires` invites a range grammar: `^0.3`, `>=0.3 <1`, `~0.3.1`. Supporting
those is a semver range parser — a third runtime dependency, which the law calls
a design change, or a hand-rolled parser, which is worse.

**Decision.** The field is a **floor**, so it gets a floor's grammar: `>=X.Y.Z`,
nothing else. Anything else is refused by name, with the accepted form printed —
MV-85's rule applied to a configuration field rather than a command line.

**Measured, so the choice is not theoretical**: every version this project has
published is plain three-number semver, and the comparison it needs is three
integer compares. A parser would exist to serve syntax nobody here writes.

---

## D5 — The notice is emitted once, from the dispatcher

MV-85 exists because three of nine commands forgot to do a thing each command
had to do for itself. Adding a notice to nine commands would repeat that setup
exactly.

**Decision.** One call in `main()`, before the command runs. Every command is
covered including ones added later, and a slow command still prints it up front
rather than after its work.

**Consequence to be honest about**: the notice reaches stderr on every run, and
`verify` runs on every commit. That is what "constantly" was asked for, and the
mitigation is not frequency but content — one line, coloured, naming the fix.
