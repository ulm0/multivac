# Data Model: A declared grapher leaves a graph, or close refuses

## Entity: Root (existing, unchanged)

The brain plus every declared repo present on disk, each carrying the grapher
that applies to it — the per-repo override first, the ecosystem's otherwise.
Produced by `graphScopes(brain, cfg)` and already the unit every part of this
adapter uses. This feature adds no second way to enumerate roots; it deletes
one.

| Field | Type | Meaning |
|---|---|---|
| `scope` | string | `brain`, or the repo's key in the configuration |
| `dir` | absolute path | where the tool runs |
| `name` | string, optional | the grapher that applies here; absent means none does |

## Entity: Gate verdict (new)

One verdict per root. Only two of the four refuse.

| Verdict | When | Refuses |
|---|---|---|
| `satisfied` | a grapher applies and its artifact is present | no |
| `missing` | a grapher applies, its binary runs, and the artifact is still absent | **yes** |
| `unevaluable` | a grapher applies but its binary is not on PATH | **yes** |
| `out-of-scope` | no grapher applies here, or the declared one is unverified | no |

`out-of-scope` covers two different situations that behave identically and are
worded differently: a repo opted out with `grapher: none` (or an ecosystem that
declared no grapher), and a declared name the tool has never verified. The
second is reported with the fields to declare — nothing is required of a tool
whose artifact path would have to be guessed.

## Configuration (one new key)

| Key | Type | Default | Meaning |
|---|---|---|---|
| `grapher_auto` | boolean | `true` | when false, the graph gate never refuses. Mirrors `sdd_auto` exactly, and is parsed by the same code path. |

The per-repo `grapher: none` opt-out is unchanged. `grapher_auto: false` keeps
the tool and drops the gate; `grapher: none` drops the tool for that repo. They
answer different questions and neither substitutes for the other.

## Command surface (one new flag)

| Flag | Command | Meaning |
|---|---|---|
| `--no-grapher` | `change close` | skip the graph gate for this run |

## Door projection (new lines, conditional)

When a grapher is declared, the projected door gains a block naming the tool and
where its graph lives, instructing the agent to consult it before reading the
tree. When the adapter declares query commands, they are carried verbatim; when
it does not, the block ends at the artifact's location. When no grapher is
declared, the door says nothing about graphs.

The registry's grapher entry gains one optional field for those commands. It is
filled only where the vendor documents them or where they have been verified by
running the tool — never derived from the tool's name (Principle V).
