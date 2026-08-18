# Contract — the argument surface every command keeps

The CLI's external contract for this feature is what a user may type and what
they get back. It is stated here per form, and every row is a test.

## Accepted

| Form | Example | Result |
| --- | --- | --- |
| Valued flag, separated | `mvac verify --repo api` | runs, `repo = "api"` |
| Valued flag, equals | `mvac verify --repo=api` | runs, `repo = "api"` — identical |
| Valued flag, equals, empty | `mvac init --sdd=` | runs; an empty value is the command's business, not the guard's |
| Valued flag, equals, dash value | `mvac verify --repo=-x` | runs, `repo = "-x"` — the value is inside the token |
| Boolean, bare | `mvac verify --strict` | runs, `strict = true` |
| Boolean, equals | `mvac verify --strict=false` | runs, `strict = false` — citty owns negation |
| Declared positionals | `mvac change new points-expire "Points expire"` | runs |
| `change` negation spellings | `mvac change close x --no-sdd`, `--no-grapher` | run, unchanged |

## Refused — exit 2, before any side effect

| Form | Example | Message names |
| --- | --- | --- |
| Unknown flag | `mvac verify --loud` | `--loud` |
| Unknown flag, equals | `mvac verify --loud=1` | `--loud=1`, as typed |
| Unknown short flag | `mvac change land x -landed api` | `-landed` |
| Short alias with equals | `mvac verify -r=api` | `-r=api` — not a form the parser understands |
| Valued flag, no value | `mvac verify --repo` | `--repo`, needs a value |
| Valued flag, flag-shaped value | `mvac verify --repo --strict` | `--repo`, needs a value |
| Surplus positional | `mvac change land points-expire api` | `api` |
| Surplus positional elsewhere | `mvac doctor /other/repo` | `/other/repo` |

## Invariants of the contract

1. The refusal runs **before** the parser and before any write (MV-85,
   MV-104). A command that refuses after writing has still written.
2. The exit code for every refusal is **2**. Not 1, which is a failed gate.
3. The wording belongs to the command (MV-69). The guard supplies the shape;
   the command may supply its own `takes` sentence, and those in use today are
   unchanged.
4. `--help` and `-h` never reach a command: the dispatcher answers them first.
5. One reader. A command that hand-rolls a correct check would satisfy MV-85,
   but none does any more — after this change every command goes through
   `undeclared()`.
