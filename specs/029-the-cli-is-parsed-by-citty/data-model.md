# Data Model: The CLI is parsed by citty

## One declaration per command

```ts
const ARGS = {
  dir:    { type: 'positional', required: false },
  strict: { type: 'boolean' },
  repo:   { type: 'string' },
} satisfies ArgsDef;
```

## Its two readers

| Reader | Reads | Produces |
|---|---|---|
| `undeclared()` (MV-85) | the declaration, as a surface | a refusal line, or null |
| citty `parseArgs` | the declaration | typed values |

## The order, which is the rule

```text
dispatcher: --help?  -> usage, exit 0, nothing ran
undeclared(argv)     -> refusal, exit 2, nothing ran
citty parseArgs      -> values
command body         -> work
```

A parser that never sees an undeclared argument cannot silently drop one.

## Surface derivation

| ArgsDef entry | Surface |
|---|---|
| `{ type: 'boolean' }` | a flag: `--name` |
| `{ type: 'string' }` | a valued flag: `--name <value>` |
| `{ type: 'positional' }` | one more positional |
| `alias: 'x'` | also `-x` |
