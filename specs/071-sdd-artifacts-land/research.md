# Research: What the SDD writes in the brain lands with the change

## R1. Where the gap is, exactly

`cmdClose` builds its pathspec from four things (src/commands/change.ts, the
block that prints the archive commit): the archived change file, the change file
it replaces, the law table, any shared graph that moved, and the ecosystem graph.
Nothing about the SDD. The previous change closed with
`specs/070-doors-reach-every-harness/` untracked, and the only reason it reached
the branch is that a human read `git status`.

**Decision**: close stages the paths the brain's own status reports under the
artifact directories the closing slug owns.

**Rationale**: those directories are already derivable. `planCarry`
(src/change/carry.ts) computes them for the carry: for each step artifact
containing `<slug>`, resolve it on disk and keep the prefix up to and including
the segment that carries the slug. The same function answers "what does this slug
own here", so it is extracted rather than written twice.

**Alternatives considered**: staging `spec.shared` wholesale. Rejected: in
spec-kit that is `.specify/**`, which holds the constitution and the templates —
files a run did not write and MV-46 says never to stage on somebody's behalf.

## R2. Why not in apply as well

The first draft staged artifacts at apply too. Three independent reviews refused
it: in spec-kit the constitution is tracked and often modified in the same
working tree, MV-46 forbids staging what the run did not write, and two changes
applying near each other would stage each other's files. Close is the one point
where the slug's own directories are settled.

**Decision**: close only. Apply keeps carrying, which is what puts the artifacts
on the branch in a code repo.

## R3. openspec's archive leaves three kinds of path

`openspec archive` moves `openspec/changes/<slug>/` to
`openspec/changes/archive/<date>-<slug>/` and rewrites the capability specs the
change touched under `openspec/specs/<cap>/`. All three appear in status: the
move as a deletion plus an untracked directory, the rewrite as a modification.

**Decision**: the rule is "every status path under a directory this slug owns",
with the archive directory derived from the close step's own artifact pattern, so
the deletions land in the same commit as the additions.

## R4. Equip before carry

`cmdApply` runs one loop that clones or creates a missing repo, makes its
worktree and carries the SDD files out of the checkout, and calls `equip`
afterwards. So the vendor init runs over a checkout whose `.specify` was just
carried away, and writes a second copy of what the change already moved.

**Decision**: split the loop. Clone or create every missing repo first, `equip`
next, then branch and carry.

**Rationale**: `equip` is self-limiting — an installed tool runs nothing — so the
only change is the order. No amendment: MV-129 says every command that sets a
repo up equips it, and this makes that true earlier rather than later.

**Ceiling, stated rather than papered over**: with graphify declared, the
fast-forward merge in `land` still aborts over an untracked `graph.json` in the
checkout. That is a separate mechanism and is named in `land --landed`'s output,
not fixed here.

## R5. The harness directories are not a list, they are declarations

MV-142 made the harness directories non-code by walking `doorTargets`: the doors
multivac projects. A declared SDD installs its own commands and skills into
directories that have nothing to do with multivac's doors, so a brain that
declares openspec and no grapher is refused its own first commit over one of
them.

Measured 2026-09-25, one fresh git repo per integration, `HOME` and
`GIT_CONFIG_GLOBAL` isolated, listing what each wrote outside its own store:

| integration | openspec 1.13.2 | spec-kit 1.0.11 |
| --- | --- | --- |
| `agents` | `.agents/` | — |
| `claude` | `.claude/` | `.claude/` |
| `cursor` / `cursor-agent` | `.cursor/` | `.cursor/` |
| `codex` | `.agents/` | `.agents/` |
| `gemini` | `.gemini/` | `.gemini/` |
| `opencode` | `.opencode/` | `.opencode/` |
| `github-copilot` / `copilot` | `.github/prompts/`, `.github/skills/` | `.github/skills/` |
| `windsurf` | `.devin/` | not an integration |

Two of those are the reason a list would have been wrong: `codex` writes into
`.agents/`, not `.codex/`, and openspec's `windsurf` writes into `.devin/`.

**Decision**: each integration entry records the directories it writes, measured,
with the version named. `nonCodeGlobs` adds the directories of the integrations
that apply to the declared doors, plus the fallback when no declared door maps to
one — the same resolution the scaffold itself uses (MV-130).

**Alternatives considered**: deriving `.${key}` from the integration key.
Rejected by the two exceptions above. Adding every integration's directories
whether declared or not was also rejected: the set would claim a repo's
`.devin/` is not code in an ecosystem that never asked for windsurf.
