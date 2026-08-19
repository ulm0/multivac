# Phase 0 — Research: The engine reads one way, round two

## Measurement 1 — what a heal may land on

`evaluate.ts`'s `moved` path searches every declared repo for the leg's pattern
and rewrites the glob when exactly one candidate survives. The only fence is
`.multivac/`. So `site/`, `docs/` and `specs/` — prose that quotes patterns —
are legal targets, and a heal onto prose retargets law at text that merely
describes it.

**Decision**: a second fence, derived from the leg itself — a candidate must
share the include's own trailing extension.

**Rationale**: it needs no new vocabulary and no configuration. The include
already says what kind of file it is about; the fence is that statement, read
back. Measured with the tool's own parser over this brain: 745 legs, 726 with a
trailing extension, and every one of the 440 present-mode legs — the only mode
that heals — carries one.

**Alternatives considered**: a denylist of prose directories (rejected — it is
a list somebody types, and the next repo's docs live somewhere else); an
allowlist of code extensions (rejected — same, and it makes the tool opinionated
about languages); something about the match itself, such as requiring the hit
to be outside a code fence (rejected — that is a markdown parser, and the
question is about the FILE, not the line).

**Ceiling**: an include with no trailing extension, or one ending in a brace
group, keeps only the `.multivac/` fence. There are none today; the row states
it for the future leg.

## Measurement 2 — a symlink's two verdicts

A working-tree read opens the path and follows the link; a ref read asks git
for the blob and gets the link TEXT. The same leg therefore answers differently
depending on which context evaluated it. This repo tracks exactly one symlink —
`CLAUDE.md → AGENTS.md`, which multivac installs itself — and no leg targets
it, so nothing is lost by refusing it.

**Decision**: filter git modes `120000` (symlink) and `160000` (gitlink) in
both enumerators, at the one point they share.

**Rationale**: neither is file text. A ref read cannot follow a link without
inventing a target that may not exist at that ref, so "follow it in both" is
not available; refusing is the answer both readers can give.

`ls-files -s` and `ls-tree -r` both carry the mode, so the filter is the same
parse in both, and the Set that dedupes merge stages replaces what
`--deduplicate` was doing (MV-71).

## Constitution and law

- **MV-71** — one entry per path during a merge. Kept, by the Set that now also
  reads the mode.
- **MV-109** — both ceilings it stated are closed here, and the row says so.
- **Constitution IV** — no dependency; two parses and one comparison.
