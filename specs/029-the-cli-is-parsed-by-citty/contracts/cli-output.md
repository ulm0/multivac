# Contract: CLI surface and output

Nothing changes. That is the contract.

## The refusal, unchanged (MV-85)

```text
doctor: unknown flag "--sttrict" — doctor takes --strict
doors: unexpected argument "elsewhere" — doors takes --adopt
```

(`seed` declares `[dir]`, so `seed elsewhere` is a declared argument and always
was. The refusal example has to come from a command that declares no
positional, which is what `doors` is.)

Exit 2, before anything runs.

## `--help`, unchanged (MV-69)

Answered by the dispatcher, printed from each command's own `usage` array,
exit 0, no side effect.

## Values, unchanged

`--repo api` and `--repo=api` both bind `api`. A value that looks like a
positional is still a value.

## What a reader can check

The whole existing suite, unedited. If a single test needed a new argument or a
changed expectation, this contract was broken.
