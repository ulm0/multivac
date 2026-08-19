# Contract — what an exit code means

| Code | Meaning |
| --- | --- |
| 0 | the command did what it was asked |
| 1 | a check failed — a gate refused, a claim is broken |
| 2 | the command could not be run as given: a refused argument, or an environment it cannot read |

An unloadable config is an environment error, so it is 2 — for every command
that reads one, with two exceptions the contract names: `doors` and `doctor`,
for which an unloadable config IS the diagnosis they were asked for.

`doctor` exits 1 when the config or the law is invalid, and that is a promise
its own `--help` makes.
