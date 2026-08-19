# Phase 1 — Data model: A proof names one feature

## Artifact path

| Piece | Meaning |
| --- | --- |
| a literal segment | itself |
| `<slug>` | the change's slug, interpolated before matching |
| `<n>` | one run of digits, in exactly one segment |
| anything else | literal, including `*` |

| Declared | Before | After |
| --- | --- | --- |
| speckit spec/plan/tasks | `specs/*-<slug>/…` | `specs/<n>-<slug>/…` |
| opsx archive | `openspec/changes/archive/*-<slug>` | `openspec/changes/archive/<n>-<n>-<n>-<slug>` |
| opsx proposal/tasks | `openspec/changes/<slug>/…` | unchanged — no token |

## Resolver

| | Before | After |
| --- | --- | --- |
| returns | the first hit in sorted order, or null | every hit, sorted |
| two matches | one silently wins | both reported to the caller |

## Gate outcome, per root

Roots are searched in declaration order; the first holding ANY hit decides.

| Hits in the deciding root | Verdict |
| --- | --- |
| 0 (in every root) | refused: the artifact is missing, naming where it looked |
| 1 | proceeds |
| 2 or more | refused: names every match and the root they collide in |
