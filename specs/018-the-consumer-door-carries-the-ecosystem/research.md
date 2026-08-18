# Research: A door in a code repo names the ecosystem

## D1 — One rendering per block, used by both doors

**Decision**: extract the SDD block from `renderBrainDoor` into a function, the
way `grapherLines` already is, and call it from both.

**Rationale**: MV-90 established this with the graph block and the reason holds:
two renderings of one block is how the two come to disagree, and a door is the
surface where disagreement is least visible — nobody diffs two AGENTS.md files.

## D2 — A role is declared or omitted, never derived

**Decision**: an optional per-repository `role`, reduced to one line, rendered
when present.

**Rationale**: what a repository is *for* is not in its path. Deriving it from
the key would produce "api — api", which is worse than silence. Principle V's
rule about adapters is the same rule: state what was declared, omit what was
not.

Reduced to one line because the list is a list. A multi-line role would break
the shape of every entry after it.

## D3 — The list is of declarations, not of checkouts

**Decision**: every declared repository appears, whether or not it is on disk.

**Rationale**: a door that changed depending on which repositories happen to be
cloned would differ between two machines for reasons that have nothing to do
with the ecosystem, and the door is committed. It also keeps FR-009 easy: the
door probes nothing, so it cannot reach the filesystem by accident.

This differs from MV-87's per-root adapter work, which IS present-filtered
because it runs tools in directories. The row must say "each declared repo"
rather than "each declared, present repo", or it implies a check the door
refuses to make.

## D4 — The brain's handle is named explicitly

**Decision**: the list names the brain's handle alongside the declared
repositories.

**Rationale**: `brain` is an implicit anchor handle — the verifier skips it when
walking the declared repositories and accepts it as a known key regardless — so
it appears among them only when the brain is its own code repository, and that
entry is filtered out of a sibling list. A list headed "the keys anchors name"
that can never name the one key every consumer's anchors may use is the door
claiming a completeness it does not have.

Naming the handle is not giving the brain a consumer door; the brain keeps its
own.

## D5 — No list for a single declared repository

**Decision**: print the list only when more than one repository is declared.

**Rationale**: with one, the list is a heading and a row reading "(this repo)",
which is noise where the door is trying to be short.

## D6 — The refresh goes first, and says why

**Decision**: the mount refresh becomes the first instruction, carrying the
reason.

**Rationale**: it is the only instruction in that door with an ordering
requirement — everything else can be read in any order, and this one has to
happen before the rest is trustworthy. The pin stays where the last commit left
it, so a present mount is not a current one. It is currently the second of four
bullets.

## D7 — The scaffolding clause says what the lifecycle does, not less and not more

**Decision**: describe it as "the change lifecycle runs the tool's own init
where it is missing, or says why it could not", per root.

**Rationale**: naming one lifecycle step would be wrong four ways — the scaffold
runs from `new` and from the gate funnel covering plan, apply and close — and
claiming it always scaffolds would be wrong three more: no scaffold declared for
the adapter, the binary absent from PATH, and the init exiting without writing
the artifact all report instead. A door that overstates the tool is Principle II
broken in the file an agent reads first.
