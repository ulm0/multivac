# Phase 0 — Research: A boundary refuses what it cannot honour

## Measurement 1 — the disarm

A scratch brain with `strict_pre_push: true`, projected by `doors`:

```txt
strict lines in .multivac/hooks/pre-push : 3
# break the config, then run the line doctor prints
$ mvac init --quiet .            → exit 0, no notice
strict lines in .multivac/hooks/pre-push : 0
$ mvac doors                     → exit 1, gate untouched
```

`init` loads the config three times, each `await loadConfig(dir).catch(() =>
null)`, so a config that will not load is indistinguishable from no config at
all — and every projection is re-rendered from nothing.

**Decision**: load once, distinguish absent from broken, and refuse on broken.

**Rationale**: `doors` already refuses in this state; the two commands
projecting the same artifacts must not disagree about whether a broken config
is a config. Loading once also deletes two of the three loads.

## Measurement 2 — the unknown key

`strict_prepush: true` loads clean and arms nothing. `version.ts` already
carries the words for this, about `requires:`: *silently dropping it would be
MV-85's defect relocated into a config file*.

**Decision**: refuse a stray key by name, at the top level and under
`repos.<key>` and `graphers.<name>`, and name the near miss when one exists.

**Rationale**: the alternative — a warning — leaves the reader believing a gate
is declared. `loadConfig` already throws `ConfigError` for other invalid
shapes, so this is the same door, not a new one.

**Alternatives considered**: warn and continue (rejected — it is exactly the
"declared but dark" state the finding is about); accept unknown keys for
forward compatibility (rejected — MV-85 accepted this cost for flags, and the
config is where the gates are declared).

## Measurement 3 — the floor with a comment

`/^\s*requires:\s*['"]?([^'"\n#]+)['"]?\s*$/m` requires end-of-line right after
the value, so any trailing comment makes the whole line invisible. Verified:
`requires: ">=0.4.0" # floor for CI`, the unquoted form, and a tab-separated
comment all exec to null today.

**Decision**: allow an optional trailing comment in the pattern.

**Rationale**: a comment on a config line is ordinary YAML, and the tool tells
humans to write this line by hand. A malformed floor with a comment then falls
into the existing refused-by-name notice instead of vanishing, which is the
behaviour the row already promises.

## Measurement 4 — the unchecked adapter name

```txt
$ mvac init --sdd speckti --quiet <dir>   → exit 0, config says `sdd: speckti`
$ mvac init --sdd= --quiet <dir>          → exit 1
```

The door then announces that features gate through `speckti` and REFUSE to move
on — over zero steps.

**Decision**: validate the name against the registry (plus any `graphers:` the
config declares) before anything is written, and refuse with exit 2.

**Rationale**: exit 2 is what a refused argument gets (MV-85), and the empty
string is simply a name no adapter has, so one check covers both findings.
`--sdd=` reaching `init` at all is MV-105 working as specified: the guard judges
the surface, and whether an empty value is a legal VALUE is the command's
question.

## Constitution and law

- **MV-85** — refuse, never ignore, before any side effect, exit 2.
- **MV-86** — enforcement degrades rather than locking anyone out. Weighed and
  overruled for a stray config key: the refusal names the key and its near
  miss, an editor is always available, and `doors` already refused here.
- **MV-108** — `init` installs hooks with the strictness the config declares.
  This makes that true when the config is unreadable, too.
