---
slug: every-command-shows-its-flags
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-69
    - MV-70
  retires: []
claims:
  - id: MV-69
    statement: Every command declares its own usage and --help prints it; registry-backed flags list what the tool ships.
  - id: MV-70
    statement: init projects the harnesses it declares, and agents is never a --provider value.
---

# Every command shows its flags

Declare repos, landing_order, invariants and claims in the frontmatter,
then run `multivac change plan every-command-shows-its-flags`. For example:

    # repos: { api: { status: planned } } — planned|branched|committed|mr|landed
    # landing_order: [[api]] — stages; earlier stages land first
    # claims: [{ id: <ID>, statement: "..." }] — what close verifies

Statements are prose: quote any value holding a colon —
`statement: "staleness: block"`.

multivac owns the frontmatter formatting: every lifecycle step rewrites it, so
hand-tuned layout will not survive. Values round-trip unchanged; the body,
below the closing ---, is yours.

Two bugs a first user hit within minutes of `npx multivac init`.

## `--help` said nothing

`multivac init --help` printed one line — its description — and nothing about
`[dir]`, `--provider`, `--sdd`, `--grapher` or `--quiet`. Five of nine commands
were the same, and `change` was worse: it *had* a usage block that only printed
on bad arguments, so asking for help got you less than typing it wrong.

The dispatcher was already correct — it answers `--help` before running
anything, which an earlier measurement had already forced. What was missing was
data. `Command.usage` existed and five commands did not fill it.

Where a flag's legal values come from the registry, they are now rendered from
the registry. `--provider`, `--sdd` and `--grapher` list what the tool actually
ships, so adding an adapter cannot leave the help behind.

MV-69 is an `each` leg over `src/commands/*.ts`, which is what that mode is
for. The next command cannot ship without a usage.

## `init` told you to load a skill it had not installed

`mvac init --provider claude` wrote `claude` into `doors:`, wrote `AGENTS.md`,
armed the git hooks — and then printed *"load the multivac skill"*, having
installed no skill. `mvac doors` was owed and nothing said so.

"Flags configure; they do not perform" described nothing that was true: `init`
already performed, twice. So it now projects what it declares, by calling the
same `doors` code path rather than growing a second one. With nothing declared
beyond the canonical door it does nothing, and that half is pinned too.

## `agents` is not a provider

Renaming `--agent` to `--provider` made an old category error visible: `agents`
sat in the same list as `claude` and `cursor`, and it is not a tool anyone
could install. It is [agents.md](https://agents.md/), the open format the other
doors project *from* — three of the eight harnesses read it natively and need
no projection at all. It is written unconditionally and is no longer offered as
a value.

The version in prose went with it. Four files hardcoded `0.1.0`, which is four
files to forget on every release; npm and `package.json` are the source of
truth, and the site says "early build" instead.
