# Research: The SDD lives in the brain and writes once

Measured 2026-09-28 in scratch ecosystems (a brain plus two code repos cloned from
local bare remotes), `HOME` and `GIT_CONFIG_GLOBAL` isolated, with the real vendors:
spec-kit 1.0.11 (and 0.9.4, 0.16.1 for the floor), openspec 1.13.2, graphify 0.9.29,
codegraph 1.6.0. Five investigations, each checked by three adversarial lenses
(guarantee kept, every adapter set, the saving is real) and a completeness critic.
Tokens are bytes/4 unless marked cl100k (tiktoken `cl100k_base`, a proxy, not
Claude's tokenizer). Baseline: `da4c4e6`, 788 tests (785 pass, 3 skipped).

## R1. What the cascade costs, per code repo

`adapterFor` (src/adapters/detect.ts) answers a repo's own value first and the
ecosystem's otherwise, so a top-level `sdd:` reaches every declared repo. Measured
with `sdd: speckit`, `doors: [agents, claude]`:

| Event | Cost per code repo | Command |
| --- | --- | --- |
| `repos sync` | 30 files, 240,903 B under `.specify/` and the skills | `find .specify .claude/skills/speckit-* -type f -printf '%s\n' \| awk '{s+=$1} END {print NR, s}'` |
| every session in the repo | the door's SDD block, 2,796 B (687 cl100k) | `wc -c` of the door in the cascade twin (3,925 B) vs a repo opted out (1,129 B) |
| every session, where the init ran | skill listing, 1,337 B | `grep -E '^(name\|description):'` over `speckit-*/SKILL.md` |
| once | one `/speckit.constitution` run (≈15.3 KB read) and a human interview, because `change plan` refused until each code repo's constitution was written | `mvac change plan` in the cascade twin |
| first `apply` | 20 vendor files committed onto the code repo's branch (≈2,595 insertions) | `git show --stat` on the branch |

openspec under the same doors: 22 files, 274,322 B per code repo, a 1,712-byte door
block.

**Decision**: the SDD resolves for the brain root only (binding decision of
2026-09-25). A code repo's `sdd:` takes `none` or nothing.

**Rationale**: the specs of a change are written in the brain; every byte above is
paid for a copy nobody writes into.

**Alternatives considered**: keeping per-repo opt-in (`repos.<k>.sdd: speckit`).
Rejected by the decision itself, and because a code repo resolving its own SDD
brings back every row above for that repo plus a second place a change's proof can
live, which MV-56's search set and MV-87's per-root gates exist to reconcile.

## R2. Fix (a): the code gate must not switch off

`codeInChangeLine` (src/lib/code-in-change.ts) returns null when the repo resolves
no SDD. With the resolver changed alone, staged code on `main` in a code repo went
from `verify --strict` exit 1 to exit 0 (measured on a patched build).

**Decision**: a second resolver, `sddGoverning(cfg, root)`, answers which SDD governs
a root's code: the brain's, unless the root's own entry says `none`. The gate reads
it. The non-code set gains the SDD's step-artifact directories and project documents
only in the brain; every KNOWN SDD's vendor state, shared paths, local paths and
harness directories stay not-code in every repo.

**Rationale**: `specs/` in a code repo can be real code (a test tree) and is no
SDD's directory there, so it must be judged as code. `.specify/**` and `openspec/**`
are vendor state wherever they appear; the completeness critic measured that
opsx's `artifacts` are the exact strings `openspec/specs` and `openspec/changes`,
which match no file below them, so without the whole `openspec/**` in the set,
deleting an opsx leftover (`openspec/changes/archive/.gitkeep`,
`openspec/config.yaml`) would be refused as code. Taking every known SDD, not only
the resolved one, is what makes removing ANY leftover free.

**Alternatives considered**: a code gate in a code-less brain. Rejected: a brain with
no code declares none, so every staged README or CI edit there would read as code.
`change plan` prints an instruction instead (R9) and the row states the ceiling.

## R3. Fix (b): close lands the brain's specs whatever the flags say

`sddPathsToLand` returns early under `sdd_auto: false` or `--no-sdd`, so
`close --no-sdd` left `specs/<n>-<slug>/` untracked (measured). After
`openspec archive --yes`, close staged the archive entry but left the moved-from
`openspec/changes/<slug>/` (reported deleted) and the merged
`openspec/specs/<cap>/` out, and named them as dirty.

**Decision**: the staging keys on `adapterFor(cfg, 'brain', 'sdd')` alone. It stages
the slug's directories (unchanged `slugArtifactDirs`), each slug-literal directory
git reports with deletions, and for a step declaring `merges`, `into/<cap>` for every
`<archive dir>/<from>/<cap>/` on disk. opsx's archive step records
`merges: { from: 'specs', into: 'openspec/specs' }`, measured on 1.13.2.
`--abandon` stages the same way.

**Rationale**: the flags skip the steps and their gates; they never meant "leave
what was written uncommitted". Staging keys on where the archive landed, never on
how it was invoked, so `opsx-through-its-cli` stays independent.

**Alternatives considered**: committing the brain's specs in `apply`'s bookkeeping
commit. Rejected: it puts unreviewed specs on the brain's trunk; close already lands
them with the archive (MV-144).

## R4. Fix (c): a config whose `sdd:` resolves in no root

**Decision**: `sddDeclarationRefusal(cfg)` in detect.ts refuses (i) a non-brain
entry's `sdd:` naming anything but `none` (the empty string stays unset, as
`optString` accepts it today and `adapterFor` treats it as unset); (ii) a top-level
tool while the brain's own entry, found by `isBrain` under any key, declares another
value; (iii) a brain-resolved name `sddSpec` does not know. `loadConfig` throws on it
(exit 2), naming the key, the fix and the change the config edit needs (MV-97).

In a consumer, `verify` reads the MOUNTED brain's config, which can lag: every load
on that path — `runVerify` at the mount and `evaluateCore`'s second load, which the
critic found would still exit 2 — and `count`'s mount load take a report mode, print
one line, and gate only under `--strict`.

**Rationale**: a declaration that runs nowhere is the silent no-op MV-122 exists to
stop. A consumer's hooks must not break over its brain owner's typo.

**Alternatives considered**: a doctor-only report. Rejected: every other command
would then silently run with an SDD nobody gets.

## R5. The feature pointer

Two changes in one brain checkout share spec-kit's `.specify/feature.json`
(`feature_directory`); `/speckit.plan` run for one wrote into the other's directory,
whose gate then passed. `doCarry` already writes the pointer, but only after a carry
and behind a hard-coded `sdd === 'speckit'`.

**Decision**: the registry records the pointer (`{ path: '.specify/feature.json',
key: 'feature_directory' }`, measured 1.0.11); `pointFeature` writes it from the carry,
from `change plan` after its gate passes, and from `change apply` where the directory
stayed in the checkout, and says so when it named another directory.

**Alternatives considered**: printing `SPECIFY_FEATURE_DIRECTORY=<dir>` in the step
lines (measured to route correctly) — rejected, it needs the agent to wrap a slash
command's internal script in an environment variable; writing the file is equivalent
and needs no compliance. Naming `brain` in every change — rejected, the worktree only
exists after `apply`, so it does not isolate specify, plan or tasks.

## R6. Skeleton templates

Every template resolver spec-kit 1.0.11 ships (`resolve-template.sh`, `common.sh`,
the python `presets` module) reads `.specify/templates/overrides/<name>.md` first, and
`specify init --here --integration claude --force --ignore-agent-tools` leaves that
directory byte-identical (`md5sum -c` after a second init: OK). The critic confirmed
0.9.4's `common.sh:428` and 0.16.1's `:411` resolve overrides first; `0.9.1` is not
installable from the index (`uvx --from 'specify-cli==0.9.1'`: no such version), so the
floor is the lowest version measured, **0.9.4**. Both 0.9.4 and 0.16.1 write
`integration.json` with `version`.

Template bytes read by specify, plan and tasks per change: 18,004 with the core
templates, 4,188 with the skeletons (−13,816 B ≈ 3,454 tokens), measured as
`resolve-template.sh spec-template | wc -c` + `setup-plan.sh --json` then `wc -c plan.md`
+ `setup-tasks.sh --json | wc -c`. The skeletons keep every H2 the step bodies fill by
name: spec — User Scenarios & Testing *(mandatory)*, Requirements *(mandatory)*, Success
Criteria *(mandatory)*, Assumptions; plan — Summary, Technical Context, Constitution Check,
Project Structure, Complexity Tracking; tasks — the core set minus Notes, Path Conventions
and the repeated sample phases.

**Decision**: a scaffold entry may carry a skeleton; the scaffold writes it only on the
run whose probe turns the root from missing to installed, only when the directory is
absent, at or above the floor, per body only where the installed core template carries
every kept heading, with `wx` (never overwrite). `doctor` names an enabled preset a
skeleton outranks. This brain commits the three files by hand in this change.

**Alternatives considered**: retrofitting into installed roots through `init` —
rejected: it shadows a team-edited core template (`grep -c 'TEAM RULE' plan.md` 1 → 0),
brings back MV-133's merge abort (an init mid-change writes untracked copies of
overrides already carried: `git merge --ff-only` exits 1), and re-creates files a human
deleted. A multivac spec-kit preset — rejected: an unmeasured vendor network run
(MV-121), a `.specify/presets/.registry` with an `installed_at` timestamp, and a path
MV-65 does not read.

## R7. No committed Sync Impact Report

`/speckit.constitution` said to prepend its report as an HTML comment through 1.0.5;
from 1.0.6 through 1.0.12 it calls the report "temporary scratch material … expected to
be removed before the amended constitution file is committed". The registry's revisit
still says "prepend the Sync Impact Report". This brain's constitution carried six
reports, 4,441 of its 12,120 bytes, read by up to six steps of every change (26,646 B,
≈6,660 tokens per change). No spec-kit command reads any other file in
`.specify/memory/`.

**Decision**: the revisit says "commit no Sync Impact Report"; this brain removes its
six reports and rewords its amendment procedure (PATCH, 3.0.0 → 3.0.1).

**Alternatives considered**: `constitution-history.md` or keeping the newest report —
both contradict the vendor from 1.0.6 on; every committed report is already in git
(16853a1, 53cc33e, a1163d5). An instance leg on the report heading — rejected: it fires
through MV-112's PostToolUse hook on the very Write `/speckit.constitution` makes, before
a human has read the report.

## R8. The flow printed once

Every printed step is followed by the 180-byte run-the-chain instruction: seven times
per spec-kit change (new 2, plan 2, apply 3). The brain door restates each ungateable
step's reason in every session (1,654 B of step lines for spec-kit, 951 B for openspec).

**Decision**: each point prints its steps and then, once, the instruction with its
opt-out on the same line (−732 B per spec-kit change); the door ends each step with
`[proof: <artifact>]` or `[ungateable]` (1,654 → 902 B; openspec 951 → 646 B). Under
`sdd_auto: false` no surface claims a refusal.

**Alternatives considered**: a door "chain line" citing flow.md — rejected: false under
`sdd_auto: false`, cites a file `init` never writes, misprints opsx's plan step. Grouping
project-document lines per verdict — 0 B saved once the SDD has one root.

## R9. The change body cites its spec

A median of 17% of an archived body's words sit in an eight-word run shared with its
spec directory (74 archived changes), so no byte comparison can tell a restatement from
a summary; the instruction is ungateable. Measured saving ≈0.8–1.1 KB per change body,
bimodal.

**Decision**: `change new` prints one line; close (and abandon) appends
``Specified in `<dir>/` (<sdd>).`` after the untrimmed body unless it already names
`<dir>/`, looking for the directory in the brain checkout then the change's worktree
(brain==code carries the specs into the worktree). With automation off or `--no-sdd`,
the pointer is still written when a directory exists, but no "nothing cited" line is
printed.

**Alternatives considered**: moving the pointer into the planned scaffold — MV-89 keeps
planned bodies byte for byte. Qualifying "in the brain at …" — every path in a change
file is brain-relative.

## R10. Legs that must not go red

- MV-125's `count=6` on read-only guards: the stray search (FR-009) takes no read-only
  guard — a read-only repo is never named by a change, so no slug directory can be
  there; the search only reads.
- MV-133's `await slugHits(brain, r, slug, want)` `count=2`: the stray search is its own
  helper, not a third proof read.
- MV-122's `config.ts /=== NO_ADAPTER/ unique`: the refusal logic lives in detect.ts;
  config.ts only calls it.
- MV-75's own copy of the cascade ("`repos sync` runs it too, in every declared repo")
  is withdrawn in its note; MV-51 has no sentence this change makes false.
- `test/doctor/doctor.test.ts`'s MV-75 span "…doctor never does (it writes the vendor's
  files into the tree)": the skeleton clause is appended after it.

## R11. Ceilings, stated

Interleaved steps of two changes in one checkout can still cross; a code-less brain's
specs sit in one checkout from specify to close; code an agent writes into a code-less
brain checkout is not gated; a tracked leftover still captures the vendor's root lookup
in that repo until removed; an older multivac cascades (MV-86, `requires:` is a human's
floor); the skeleton is frozen at the version measured and a later preset is outranked
(reported); spec-kit's `--timestamp` directories match no `<n>` (MV-113); whether an agent
commits a report or restates a spec is ungateable; nothing re-measures a vendor on
upgrade (MV-121).
