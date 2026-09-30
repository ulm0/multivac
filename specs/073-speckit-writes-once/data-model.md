# Data Model: The SDD lives in the brain and writes once

No new persisted format. Four registry shapes grow, two resolvers are added, and one
line is appended to a change body at close.

## Resolution (src/adapters/detect.ts)

| Function | Answers | Rule |
| --- | --- | --- |
| `ownDecl(cfg, root, kind)` (private) | the raw `sdd`/`grapher` value a root's own entry declares | the ONE raw read of either key; an empty `sdd` reads as unset, an empty `grapher` stays `''`, which names nothing at that root and stops the top level there, as before |
| `adapterFor(cfg, root, 'sdd')` | the SDD that RUNS in a root | the brain's resolution for the brain root (the `brain` handle, or the entry `isBrain` under any key); `undefined` for every other root. Graphers unchanged |
| `sddGoverning(cfg, root)` | the SDD whose rules GOVERN a root's code | `adapterFor(cfg, 'brain', 'sdd')`, unless `ownDecl(cfg, root, 'sdd') === 'none'` for a non-brain root |
| `sddDeclarationRefusal(cfg)` | a declaration that resolves in no root | the first of: (i) a non-brain entry whose own `sdd` is set and not `none`; (ii) a top-level tool while the brain's own entry declares another value (a tool or `none`); (iii) a brain-resolved name `sddSpec` does not know. `null` otherwise |
| `sddRoots(...)` | the roots the SDD gate reads | each root gains `key`: the config key naming its worktree (the `isBrain` entry's key, else `brain`) |

Validation: `loadConfig` calls `sddDeclarationRefusal` once `isBrain` is derived and
throws `ConfigError` (exit 2) — unless called with `{ sddDeclaration: 'report' }`, which
records `cfg.sddRefusal` instead. Only a consumer's reads of a mounted brain use report.

## Registry (src/adapters/registry.ts)

```ts
interface SddScaffold {
  // ...existing fields
  skeleton?: {
    dir: string;                       // '.specify/templates/overrides'
    files: Record<string, string>;     // 'spec-template.md' -> body (src/adapters/skeletons.ts)
    keeps: Record<string, string[]>;   // per file, the H2 headings the body keeps
    measured: string;                  // 'spec-kit 1.0.11'
    floor: string;                     // '0.9.4' — lowest version measured to resolve overrides first
    tokens: string[];                  // strings no body may carry: '__SPECKIT_COMMAND_', '/speckit'
  };
}

interface SddStep {
  // ...existing fields
  merges?: { from: string; into: string }; // opsx archive: { from: 'specs', into: 'openspec/specs' }
}

interface SddSpec {
  // ...existing fields
  pointer?: { path: string; key: string }; // speckit: { path: '.specify/feature.json', key: 'feature_directory' }
}
```

speckit's `projectSteps[0].revisit` ends "; commit no Sync Impact Report." instead of
" and prepend the Sync Impact Report.".

## Close-owned directories (src/change/carry.ts)

`closeOwnedDirs(brainDir, spec, slug)` = `slugArtifactDirs`
∪ each slug-literal artifact directory (no `<n>`) git reports with a deletion
∪ for each step with `merges`, `into/<rel>` for every file `<archive dir>/<from>/<rel>` on
disk — the merged main spec file, never its capability's directory, so a human's edit
beside it stays named dirty (MV-46).

Both find the slug's path segment in the artifact TEMPLATE (the segment holding
`<slug>`), never in the substituted path: a slug inside a parent's name (`spec` in
`specs`, `change` in `openspec/changes`) would otherwise take the parent.

`pointFeature(dir, spec, featureDir): Promise<string | null>` writes `spec.pointer`
in `dir` and returns the previous value; a no-op returning null for a spec with no
pointer, and for a `dir` whose state probe (MV-124) does not say installed — no script
there reads the pointer, and the file alone would leave a directory the probe reads as
a partial install, which the scaffold never runs over.

## Change body (src/change/cite.ts)

`citeSpec(body, dir, sdd)`: when `body` does not contain `<dir>/`, returns
`body + '\nSpecified in `<dir>/` (<sdd>).\n'` without trimming `body`; otherwise `body`.
The feature directory is the first slug directory found in the brain checkout, then in
`.multivac/worktrees/<slug>/<brain key>/`.

## Preset precedence (doctor)

spec-kit 1.0.11 records presets in `.specify/presets/.registry`:
`{ schema_version, presets: { <id>: { enabled, priority, … } } }` (measured). For each
`<id>` with `enabled: true`, and each skeleton file `<file>` whose override exists, the
preset is outranked when `.specify/presets/<id>/templates/<file>` exists, or when `<id>` is
`constitution-sync` (which propagates into the core templates the skeleton shadows). One
line per outranked pair; nothing when the registry is absent or unreadable.

## States

A code repo's SDD state, as reported by `doctor`/`repos check`:

| State | Meaning | Reported as |
| --- | --- | --- |
| governed | no own `sdd:`; the brain resolves one | named in the one "governs" line (automation on) |
| exempt | own `sdd: none` | named in the same line as exempt (automation on) |
| leftover | the brain resolves an SDD, the repo is writable, and any known SDD's `initState` is not `missing` there | one line: state file, tracked or not, removal — never a failure |
