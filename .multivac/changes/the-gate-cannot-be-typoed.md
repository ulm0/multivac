---
slug: the-gate-cannot-be-typoed
status: open
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-85
  retires: []
claims:
  - id: MV-85
    statement: A command refuses an argument it does not declare, and exits 2. It never ignores one.
---

# An unknown flag is refused, not ignored

`mvac doctor --sttrict` exits **0**. The pipeline goes green and `--strict`
never ran: a gate reporting that it checked, having checked nothing. That is
the failure this tool exists to prevent, committed by this tool.

Measured across all nine commands, with the arguments actually split — an
earlier pass measured this wrong because unquoted `$c` does not word-split in
zsh, so every probe was testing "unknown command" instead:

| command | undeclared argument | documented |
| --- | --- | --- |
| `doctor --sttrict` | **0** | 2 |
| `doors --x` | **0** | 2 |
| `seed --x` | **0** | 2 |
| `init . --providers x` | **1** | 2 |
| verify, change, count, help, repos | 2 | 2 |

Three shapes of the same mistake: `doctor` reads `argv.includes('--strict')` and
discards the rest, `doors` takes `_argv` and never looks at it, `seed` takes the
first non-flag and ignores every flag. `init` refuses correctly but throws, and
a throw is mapped to 1 by the dispatcher.

## Positionals are the same lie

`doctor` declares `usage: multivac doctor [--strict]` — no directory — and calls
`doctorReport(ctx.cwd, strict)`. So `mvac doctor /other/repo` answers about the
working directory and says nothing. You asked about one repo and it reported on
another. `doors` declares "No arguments" and discards them all.

The rule is therefore about **arguments**, not flags: a command refuses what it
does not declare. Splitting flags from positionals would fix half a lie.

## Why one helper and not three patches

Each command hand-rolls its own argv loop; three of nine forgot to refuse. The
tenth command will forget too. One shared refusal, and a test that walks the
command registry so a command added later is covered without anyone remembering.
