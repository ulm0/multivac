# Data model: The gate cannot be typoed

No runtime data. The entities are a command's declared surface and the refusal.

## Declared surface

What a command states it takes. Three parts, because they are consumed
differently:

| part | example | consumed as |
| --- | --- | --- |
| bare flag | `--strict` | one argument |
| valued flag | `--repo <key>` | two arguments |
| positional | `[dir]` | one argument, counted against a maximum |

`doors` and `doctor` have an empty surface but for `--strict`, which is the
whole reason this change exists.

## Refusal

| field | source |
| --- | --- |
| the offending argument | the command line |
| the command's name | the registry |
| what it does take | the declared surface |
| exit code | the documented usage code |

Emitted on stderr, before any side effect.

## Registry coverage

The invariant is over the **set of commands**, not over a list someone typed:

> for every command in the registry, an undeclared argument produces the usage
> exit and no file is written

An anchor cannot say "for every member of a registry, a behaviour holds" — that
is a claim about running code, not about text. It is a test, for the same reason
MV-72 and MV-77 are tests: the property is cross-cutting and behavioural, and no
regex over the tree decides it.
