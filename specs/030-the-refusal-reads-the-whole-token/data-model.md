# Phase 1 — Data model: The refusal reads the whole token

Two entities, both already in the code. Neither gains a field.

## Surface

What a command states it takes, derived once from the `ArgsDef` citty parses
(`surfaceFrom`).

| Field | Meaning | Change |
| --- | --- | --- |
| `flags` | flag names that stand alone, e.g. `--strict`, `-s` | none |
| `valued` | flag names that take a value, e.g. `--repo`, `-r` | none |
| `positionals` | how many positionals are declared | none |

The surface is unchanged by this feature. That is the point: the declaration
already said what was legal, and the guard was reading it against the wrong
thing.

## Token

One element of argv, as the guard sees it. Today the guard treats a token as
opaque. This feature gives it two parts.

| Part | Rule |
| --- | --- |
| `name` | for a token beginning with `--` and containing `=`, everything before the first `=`; otherwise the whole token |
| `inlineValue` | present only for the `--name=value` form; the parser reads it, the guard never inspects it |

Short-alias tokens (`-r=api`) are deliberately **not** split: citty does not
split them either, so the name/value pair would be a fiction the parser
disagrees with (research.md, measurement 1).

## State transitions — one pass over argv

For each token, in order:

1. Does it begin with `-`?
   - **No** → it is a positional. Increment the count; if it exceeds
     `positionals`, refuse: *unexpected argument*.
   - **Yes** → continue.
2. Resolve `name` (split on the first `=` only when the token begins with `--`).
3. Is `name` in `valued`?
   - **Yes, and the token carried an inline value** → accept, consume nothing.
   - **Yes, no inline value** → look at the next token. Missing, or beginning
     with `-` → refuse: *needs a value*. Otherwise consume it as the value and
     skip it, so a value is never counted as a positional.
   - **No** → continue.
4. Is `name` in `flags`? **Yes** → accept. **No** → refuse: *unknown flag*,
   naming the token as the user typed it, not the split name.

Every refusal returns a line and exits 2 at the call site, before any side
effect. There is no state carried between commands and nothing is written.
