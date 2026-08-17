# Contract: what each command declares

Read from `mvac <command> --help`, which MV-69 already requires every command to
declare. This is the input to the refusal: anything not in a command's row is
undeclared, and undeclared is refused.

| command | flags | valued flags | positionals |
| --- | --- | --- | --- |
| `init` | `--quiet` | `--provider`, `--sdd`, `--grapher` | `[dir]` (1) |
| `seed` | — | — | `[dir]` (1) |
| `verify` | `--strict`, `--check`, `--worktree` | `--repo` | `[dir]` (1) |
| `count` | — | — | `'<spec>' [dir]` (2) |
| `doors` | — | — | **none** |
| `doctor` | `--strict` | — | **none** |
| `repos` | `--shallow` | — | `[sub]` (1) |
| `change` | `--no-sdd`, `--abandon` | `--landed` | `<sub> <slug> [args]` |
| `help` | — | — | `[topic]` (1) |

Two rows are the whole feature: `doors` and `doctor` declare **no positional**,
and both currently accept one and discard it.

## The refusal

```
<command>: unknown flag "--sttrict" — doctor takes [--strict]
```

Three parts, none optional: what was not understood, the command's name, and
what it does take. A refusal that omits the third makes the reader run
`--help` to learn what a machine already knew.

Exit **2**, which the reference already documents for a usage error. This
feature makes that table true; it does not edit it.

## What the refusal must not do

- **Run first, refuse second.** `init`, `doors` and `seed` write files. The
  refusal precedes every side effect, and the test asserts the directory is
  untouched rather than trusting the code order.
- **Consume a flag's value.** `--repo <key>` and `--landed <repo>` and
  `--provider a,b` pass a value that is not a positional.
- **See `--help`.** The dispatcher answers it before a command runs, so no
  command needs to know it exists.

## What this contract cannot state

That a command *honours* what it declares. The check compares the command line
against the declared surface; a command that declares `--strict` and then
ignores it passes every test here. MV-85 says so rather than letting the row be
read as more than it is.
