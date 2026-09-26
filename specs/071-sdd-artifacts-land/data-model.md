# Data model: What the SDD writes in the brain lands with the change

No storage. Two declarations gain a field, and one derivation is shared.

## ScaffoldIntegration (src/adapters/registry.ts, existing)

| field | change |
| --- | --- |
| `key` | unchanged: what the vendor's flag takes |
| `safe` | unchanged |
| `dirs` | NEW: the directories this integration writes outside the tool's own store, measured per version (research.md R5) |

## Derived: the artifact directories a slug owns

`slugArtifactDirs(repoDir, spec, slug)` — extracted from `planCarry` in
src/change/carry.ts, which already computed it for the carry. For each step
artifact containing the slug placeholder, resolve the pattern on disk and keep
the prefix up to and including the segment carrying the slug. Close asks it for
the brain; the carry asks it for each named repo, as before.

## Derived: the SDD paths close stages

Every path `git status --porcelain=v1 -z --untracked-files=all` reports in the
brain that lies inside one of those directories, deletions included. Built from
status, so the pathspec never names something git does not know about.

## Derived: what close reports but never stages

A tracked, dirty path that belongs to the SDD's shared set but not to a slug's
directory — the project document, the tool's config file. Named on its own line
(MV-46).

## Derived: the non-code globs

`nonCodeGlobs` adds, per declared SDD, the `dirs` of the integrations that the
declared doors resolve to, plus the fallback integration's when no door maps.
