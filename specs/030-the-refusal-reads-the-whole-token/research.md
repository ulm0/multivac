# Phase 0 — Research: The refusal reads the whole token

Everything below was measured against the installed parser, `citty@0.2.2`, on
Node 24. Nothing here is recalled.

## Measurement 1 — what citty does with each token form

Declaration under test, the same shape every command uses:

```js
{ dir: { type: 'positional', required: false },
  strict: { type: 'boolean' },
  repo: { type: 'string', alias: 'r' } }
```

| argv | parsed |
| --- | --- |
| `--repo=api` | `repo: 'api'` |
| `--repo api` | `repo: 'api'` |
| `--repo --strict` | `repo: '--strict'` |
| `--repo` (last token) | `repo: ''` |
| `--repo=` | `repo: ''` |
| `--repo=-x` | `repo: '-x'` |
| `--strict=false` | `strict: false` |
| `--no-strict` | `strict: false` |
| `-r=api` | `repo: '=api'` |

**Decision**: the refusal splits on the first `=` **only for tokens beginning
with `--`**.

**Rationale**: the last row is the reason. citty does not split `=` after a
short alias — `-r=api` parses the value as `=api`. A refusal that accepted
`-r=api` because the name before the `=` is declared would hand the parser a
token it silently mis-parses, which is the class of defect this change exists
to close, not to relocate. Refusing `-r=api` as an unknown flag is the honest
answer: it is not a form the parser understands.

**Alternatives considered**: split on `=` for every dash-prefixed token
(rejected — creates the silent `=api` value above); teach the refusal to rewrite
short-alias equals forms into the long form before parsing (rejected — that
makes the refusal a parser, which MV-104 forbids by name).

## Measurement 2 — the missing value is not distinguishable after the fact

`--repo` as the last token parses to `repo: ''`, not `undefined`. A command
reading `parsed.repo` therefore cannot tell "not given" from "given empty", and
`verify --repo` today scopes to a repo key of `''` rather than refusing.

**Decision**: the refusal, not the command, answers this — a declared valued
flag with no following token, or with a following token beginning with `-`, is
refused naming the flag.

**Rationale**: it is one check in one place, and it runs before any side
effect. Pushing it into each command is nine chances to forget, which is how
MV-85 happened in the first place.

**Alternatives considered**: let each command validate its own flag values
(rejected — restores the per-command drift MV-104 deleted); treat `''` as
absent inside the commands (rejected — `--repo=` would then also mean absent,
and the two forms should not collapse).

## Measurement 3 — what the equals form costs today

Against a build of this commit:

```txt
$ mvac init --provider=claude   → exit 2, "unknown flag --provider=claude"
$ mvac init --sdd=speckit       → exit 2
$ mvac init --grapher=graphify  → exit 2
```

Against a build of `v0.8.0`, the first exits 0 and writes `claude` into the
config. `verify --repo=api`, `roadmap --horizon=now` and `change --landed=api`
are refused by both builds, because 0.8.0's hand-rolled loops did not split `=`
either — for those this is an inconsistency, not a regression, and it is fixed
in the same pass because it is the same line of code.

**Decision**: fix all valued flags, not only `init`'s three.

**Rationale**: the defect is in the shared guard. Fixing only the regression
would leave the guard still disagreeing with the parser behind it.

## Measurement 4 — where `change` stands

`change` never calls the shared guard. Its own check is
`argv.find(a => a.startsWith('--') && !CHANGE_FLAGS.includes(a))`, so:

```txt
$ mvac change land <slug> api          → exit 0, nothing recorded
$ mvac change land <slug> -landed api  → exit 0, nothing recorded
```

`change` also reads `--no-sdd` and `--no-grapher` literally from argv, because
citty owns the `--no-` prefix and turns them into `sdd: false` / `grapher:
false`; the flags the command declares never arrive. Those two tokens must stay
legal after the guard is shared.

**Decision**: delete the private check; call the shared guard with the declared
surface plus the two `--no-` spellings, and cap positionals per subcommand
(three for `new`, which takes `new <slug> "<title>"`; two otherwise).

**Rationale**: `change` is the one command that mutates the lifecycle record, so
it is the one where a silently dropped argument costs the most. Sharing the
guard is a deletion.

**Alternatives considered**: widen the private check to single-dash tokens and
positionals (rejected — it re-implements the guard a third time and leaves the
equals form still broken in `change`).

## Constitution and law

- **MV-104** — the refusal runs before the parser and is not delegated. This
  change keeps that order exactly; it widens what the refusal *sees*, and the
  parser is still never asked about an undeclared argument.
- **MV-85** — refuse, never ignore, before any side effect, exit 2. This change
  closes three places where the tool ignored.
- **MV-69** — each command keeps its own usage wording. The guard's optional
  `takes` argument already carries that, and is untouched.
- **Constitution IV** — no dependency is added; the diff is a net deletion.
