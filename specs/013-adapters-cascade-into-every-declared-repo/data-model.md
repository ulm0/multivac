# Phase 1 — Data model

No storage, no schema. The entities here are the shapes the code passes around
and the one config key this feature adds.

## SddRoot (existing, `src/adapters/detect.ts`)

One directory the declared tooling may live in.

| Field | Type | Meaning |
| --- | --- | --- |
| `scope` | `string` | The name the config gave it: a repo key, or `brain` for the brain itself. Every message this feature adds prints this. |
| `dir` | `string` | Absolute path to the checkout. |

Produced by `sddRoots(brain, cfg)`: the brain first, then each declared repo
that is not the brain and exists on disk, in config order. Unchanged by this
feature — what changes is that consumers stop collapsing the list.

## RootAdapter (new, derived — not persisted)

The per-root answer to "which SDD applies here, and is it installed".

| Field | Type | Meaning |
| --- | --- | --- |
| `root` | `SddRoot` | The root this is about. |
| `sdd` | `string \| undefined` | `entry.sdd ?? cfg.sdd`, with the literal `none` resolving to `undefined`. Undefined means this root is out of scope: no scaffold, no gate, no deficiency line. |
| `installed` | `boolean` | The scaffold artifact is present in `root.dir`. Asked per root, never inherited from another. |

State transitions, per root, over one lifecycle run:

```text
out of scope        (sdd undefined)      -> silence, forever
not installed       (sdd set, no artifact) -> the tool's own init runs here
  -> artifact appears                    -> installed
  -> artifact does not appear            -> reported with the tool's own words;
                                            the gates still refuse on their own terms
installed           (sdd set, artifact)  -> silence; gates may now ask this root
                                            for the project-level document
```

## RepoEntry.sdd (new config key, `src/types.ts` + `src/lib/config.ts`)

```yaml
repos:
  backend: ../backend            # inherits the ecosystem's sdd:
  landing:
    path: ../landing
    sdd: none                    # this repo has no SDD flow
  legacy:
    path: ../legacy
    sdd: opsx                    # a different tool from the ecosystem's
```

- Parsed by `optString`, the same validator `repos.<key>.grapher` goes through.
- Absent = inherit `sdd:` from the ecosystem. This is the ordinary case.
- `none` = this repo has no SDD. Not an error, not a notice, not a gap.
- Any other value = a registry adapter name; an unknown one is reported with the
  known list, exactly as an unknown ecosystem-level `sdd:` is today.

## GrapherScope (existing shape, `src/commands/doctor.ts` and `src/commands/change.ts`)

`{ scope, dir, name }`, where `name` is `entry.grapher ?? cfg.grapher`. Already
per-scope in both places. This feature adds one fact the runner did not have:

| Condition | Command run |
| --- | --- |
| artifact missing in this scope | `spec.create ?? spec.refresh` — the build |
| artifact present in this scope | `spec.refresh` — the refresh, as today |

The distinction already exists in `doctor`'s wording; this moves it into
`refreshGraph` so the runner and the report agree.

## What is NOT modelled

- **No per-root state is persisted.** Every fact above is re-derived from the
  filesystem on each run. A cache would be a second source of truth about
  whether a tool is installed, which is exactly the class of claim Principle II
  forbids the tool from making without checking.
- **No ordering data.** Roots come out in `sddRoots` order (brain, then config
  order) and nothing here reorders them.
</content>
