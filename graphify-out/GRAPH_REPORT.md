# Graph Report - brain  (2026-08-16)

## Corpus Check
- 238 files · ~248,842 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1638 nodes · 2640 edges · 149 communities (115 shown, 34 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.54)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `43d314cf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Implementation Plan: The project document is gated on existing
- file.ts
- reserve.ts
- package.json
- multivac — design
- Implementation Plan: core.hooksPath is read the way git reads it
- init.ts
- settings.ts
- doctor.ts
- common.sh
- commands.md
- The SDD arrives with its own scaffold
- adoption.md
- index.ts
- .multivac/invariants.md
- Every command shows its flags
- Design Decisions
- Top-level keys
- SDD adapters
- Implementation Plan: The release says what changed
- detect.ts
- Tasks: [FEATURE NAME]
- Contributor Covenant Code of Conduct
- integrations.md
- loadChange
- sdd-gates.test.ts
- compilerOptions
- Built with itself includes the door
- Existing ecosystem: seed → questions → interview → law
- tsconfig.test.json
- docs/_index.md
- claims-and-anchors.md
- writing-anchors.md
- hooks.md
- Anchors: the writing manual
- The ecosystem change
- Discovery: seed an existing ecosystem
- install.md
- Reading `mvac verify`
- Implementation Plan: doors prunes what it projects
- the-change.md
- running-changes.md
- change.ts
- install.ts
- Bug.md
- Default.md
- Each file answers: the universal quantifier
- distribution.md
- concepts/invariants.md
- philosophy.md
- Interview: a brain from scratch
- multivac — operating protocol
- Changes do not collide
- verify.ts
- The ledger and the link
- getting-started.md
- Integration.md
- init cannot lie: gitignored brains and disarmed hooks
- The gate cannot lie
- normalize.ts
- Five defects the prover found
- sdd.ts
- registry.ts
- apply-git-robustness.md
- brain-first-class.md
- c2-mit-license.md
- Anchors: the writing manual
- consumer-verify.md
- docs-and-headers.md
- doctor-untracked-build-files.md
- every-harness-has-an-entry.md
- everything-multivac-owns.md
- frontmatter-safety.md
- hook-shim-fallback.md
- lifecycle-polish.md
- repo-qualified-exclusions.md
- The ecosystem change
- site-quotes-the-binary.md
- sql-statement-scanner.md
- staleness-gates.md
- test-branch-determinism.md
- Discovery: seed an existing ecosystem
- the-door-for-contributors.md
- parse.ts
- the-gate-names-its-room.md
- Contributing to multivac
- Reading `mvac verify`
- the-panel-lights-up.md
- Interview: a brain from scratch
- the-ritual-has-a-home.md
- the-site-tells-the-whole-story.md
- multivac — operating protocol
- verify-untracked-and-pending.md
- Implementation Plan: The merge keeps what it did not write
- pre-commit
- pre-push
- ritual.md
- gitlab.com/ulm0/multivac/site
- CLAUDE.md
- speckit-analyze/SKILL.md
- The release says what changed
- git.ts
- Execution Steps
- config.ts
- evaluate.ts
- fixture.ts
- out.ts
- Feature Specification: [FEATURE NAME]
- repos.ts
- speckit-plan/SKILL.md
- doors.ts
- doors.test.ts
- The merge keeps what it did not write
- seed.ts
- speckit-specify/SKILL.md
- speckit-tasks/SKILL.md
- Core Principles
- Core Principles
- Implementation Plan: [FEATURE]
- speckit-checklist/SKILL.md
- speckit-clarify/SKILL.md
- speckit-implement/SKILL.md
- speckit-constitution/SKILL.md
- speckit-taskstoissues/SKILL.md
- [CHECKLIST TYPE] Checklist: [FEATURE NAME]
- The project document is gated on existing
- count.ts
- composition.md
- change.test.ts
- doors prunes what it projects
- sync-fetches-the-channel.md
- the-sdd-gates-its-own-flow.md
- core.hooksPath is read the way git reads it
- banner.ts
- brain-first-class.test.ts
- init.test.ts
- close-keeps-used-reservations.md
- the-ledger-keeps-itself.md
- two-graphers-and-what-each-one-answers.md

## God Nodes (most connected - your core abstractions)
1. `say()` - 37 edges
2. `run()` - 34 edges
3. `loadConfig()` - 29 edges
4. `warn()` - 28 edges
5. `makeScratchEcosystem()` - 27 edges
6. `multivac — design` - 23 edges
7. `pathExists()` - 22 edges
8. `loadChange()` - 21 edges
9. `saveChange()` - 21 edges
10. `runInit()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `runnerWith()` --calls--> `findRunner()`  [EXTRACTED]
  test/init/hook-shim.test.ts → src/hooks/install.ts
- `landedChange()` --calls--> `saveChange()`  [EXTRACTED]
  test/change/ritual.test.ts → src/change/file.ts
- `run()` --calls--> `main()`  [EXTRACTED]
  test/cli/help.test.ts → src/cli.ts
- `merged()` --calls--> `mergeClaudeSettings()`  [EXTRACTED]
  test/doors/settings.test.ts → src/doors/settings.ts
- `ParseResult` --references--> `Anchor`  [EXTRACTED]
  src/anchor/parse.ts → src/types.ts

## Import Cycles
- None detected.

## Communities (149 total, 34 thin omitted)

### Community 0 - "Implementation Plan: The project document is gated on existing"
Cohesion: 0.05
Nodes (39): Content Quality, Feature Readiness, Notes, Requirement Completeness, Specification Quality Checklist: The project document is gated on existing, Complexity Tracking, Constitution Check, D1 — Recognize "nobody has written this" by the template's fill-in tokens, not by whole-file equality (+31 more)

### Community 1 - "file.ts"
Cohesion: 0.12
Nodes (20): ChangeClaim, ChangeError, ChangeFile, closeGate(), frontmatterError(), normalizeChange(), parseChange(), ParsedChange (+12 more)

### Community 2 - "reserve.ts"
Cohesion: 0.25
Nodes (16): insertRow(), lawPath(), lawRelChange(), LawRow, lawRows(), nextFreeId(), owns(), readLaw() (+8 more)

### Community 3 - "package.json"
Cohesion: 0.04
Nodes (44): bin, multivac, mvac, bugs, url, dependencies, picomatch, yaml (+36 more)

### Community 4 - "multivac — design"
Cohesion: 0.05
Nodes (44): Anchor to contracts, not implementations, Artifact ≠ binary, Asymmetric severity, Automation by default (owner decision, 2026-08-13), Branching is local-first, and says what it did, Build plan, CLI, Coverage, not completeness (+36 more)

### Community 5 - "Implementation Plan: core.hooksPath is read the way git reads it"
Cohesion: 0.05
Nodes (36): Content Quality, Feature Readiness, Notes, Requirement Completeness, Specification Quality Checklist: core.hooksPath is read the way git reads it, 1. One resolver, exported, called from both sides, 2. Identity is decided after resolution, never on the text, 3. The report keeps its wording; only the directory it reads changes (+28 more)

### Community 6 - "init.ts"
Cohesion: 0.19
Nodes (16): detectAdapters(), Detected, ensureVisibleToGit(), exists(), Flags, init, isRepoRoot(), migrateLegacy() (+8 more)

### Community 7 - "settings.ts"
Cohesion: 0.26
Nodes (13): drop(), duplicateNotice(), ensureEvent(), eventList(), Json, mergeClaudeSettings(), ourHooks(), Owned (+5 more)

### Community 8 - "doctor.ts"
Cohesion: 0.20
Nodes (22): pathExists(), alongsideParts(), branchesLine(), buildCritical(), doctorReport(), doorState(), fmtAge(), grapherLines() (+14 more)

### Community 9 - "common.sh"
Cohesion: 0.08
Nodes (17): check-prerequisites.sh script, check_dir(), check_file(), get_feature_paths(), get_repo_root(), has_jq(), _persist_feature_json(), resolve_specify_init_dir() (+9 more)

### Community 10 - "commands.md"
Cohesion: 0.09
Nodes (22): `--abandon`, `apply`, `change <sub> <slug> [args]`, `close`, `count '<repo>:<glob> [!<glob> ...] /<regex>/[i]' [dir]`, `doctor [--strict]`, `doors`, `drift`: a recorded finding that does not gate (+14 more)

### Community 11 - "The SDD arrives with its own scaffold"
Cohesion: 0.33
Nodes (5): Order, Running it, not just naming it, The SDD arrives with its own scaffold, What an adapter should declare, What this does NOT automate

### Community 12 - "adoption.md"
Cohesion: 0.33
Nodes (5): Next, The arc, What changes per case, and what does not, What each phase buys, Where you start

### Community 13 - "index.ts"
Cohesion: 0.30
Nodes (10): main(), usage(), version(), doctorCommand, helpCommand, run(), TOPICS, usageFor() (+2 more)

### Community 14 - ".multivac/invariants.md"
Cohesion: 0.06
Nodes (17): Each scope verifies what it is responsible for, And the ignore rule that let a symlink through, ls-files counts each file once, Do not name what you do not support, seed finds the contracts, The chain arms in every order, The first release, The gaps that were not gaps (+9 more)

### Community 15 - "Every command shows its flags"
Cohesion: 0.40
Nodes (4): `agents` is not a provider, Every command shows its flags, `--help` said nothing, `init` told you to load a skill it had not installed

### Community 16 - "Design Decisions"
Cohesion: 0.04
Nodes (43): Content Quality, Feature Readiness, Notes, Requirement Completeness, Specification Quality Checklist: The SDD arrives with its own scaffold, 1. `scaffold` is a field on the adapter entry, not a new kind of step, 2. Two operative fields plus a note, and no defaulting, 3. Absent everywhere ⇒ scaffold the brain; present anywhere ⇒ silence (+35 more)

### Community 17 - "Top-level keys"
Cohesion: 0.12
Nodes (15): `authorities`, `blocking`, `channel`, `doors`, Errors are exit 2, `grapher`, `graphers`, Layout (+7 more)

### Community 18 - "SDD adapters"
Cohesion: 0.12
Nodes (16): Artifact ≠ binary, Automatic refresh, Detection at init, Each tool's own flow, not a fixed triple, Existence is the weakest proof, Graphers, SDD adapters, `sdd_auto` and `--no-sdd` (+8 more)

### Community 19 - "Implementation Plan: The release says what changed"
Cohesion: 0.05
Nodes (36): Content Quality, Feature Readiness, Notes, Requirement Completeness, Specification Quality Checklist: The release says what changed, Complexity Tracking, Constitution Check, Design decisions (+28 more)

### Community 20 - "detect.ts"
Cohesion: 0.17
Nodes (16): AdapterStatus, artifactPresent(), binaryPresent(), detect(), policy, SddRoot, execFileP, refreshGraph() (+8 more)

### Community 21 - "Tasks: [FEATURE NAME]"
Cohesion: 0.07
Nodes (26): Dependencies & Execution Order, Format: `[ID] [P?] [Story] Description`, Implementation for User Story 1, Implementation for User Story 2, Implementation for User Story 3, Implementation Strategy, Incremental Delivery, MVP First (User Story 1 Only) (+18 more)

### Community 22 - "Contributor Covenant Code of Conduct"
Cohesion: 0.15
Nodes (12): 1. Correction, 2. Warning, 3. Temporary Ban, 4. Permanent Ban, Attribution, Contributor Covenant Code of Conduct, Enforcement, Enforcement Guidelines (+4 more)

### Community 23 - "integrations.md"
Cohesion: 0.15
Nodes (12): `agents`, `claude`, `codex`, `copilot`, `cursor`, Detection, `gemini`, `opencode` (+4 more)

### Community 24 - "loadChange"
Cohesion: 0.10
Nodes (22): archiveChange(), changePath(), changesDir(), loadChange(), saveChange(), serializeChange(), change, blockWorktree() (+14 more)

### Community 25 - "sdd-gates.test.ts"
Cohesion: 0.13
Nodes (9): artifact(), bin, brain, config(), constitution, ctx, readyChange(), runLog (+1 more)

### Community 26 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, forceConsistentCasingInFileNames, module, moduleResolution, outDir, rootDir, skipLibCheck, strict (+3 more)

### Community 27 - "Built with itself includes the door"
Cohesion: 0.33
Nodes (5): Built with itself includes the door, Friction found while doing this, Generated is not the same as disposable, The door was saying more than the law does, The reservation

### Community 28 - "Existing ecosystem: seed → questions → interview → law"
Cohesion: 0.20
Nodes (9): 1. Seed, 2. Read by category, not by repo, 3. Take the open questions to a human, 4. Draft the map and the proposed law, 5. File everything as `proposed`, 6. Validate in blast-radius batches, 7. Project the doors, Existing ecosystem: seed → questions → interview → law (+1 more)

### Community 29 - "tsconfig.test.json"
Cohesion: 0.22
Nodes (8): test, ./tsconfig.json, compilerOptions, outDir, rootDir, extends, include, src

### Community 30 - "docs/_index.md"
Cohesion: 0.22
Nodes (7): Enforcement: the ladder, Entry from anywhere, one protocol, The session is home, Three layers, The four jobs, Three sections, and the changelog, Where to start

### Community 31 - "claims-and-anchors.md"
Cohesion: 0.22
Nodes (8): Anchor to contracts, not implementations, Asymmetric severity, Coverage, not completeness, Five modes, one mechanism, Legs, Matching rules, Self-healing, states, exit codes, The anchor

### Community 32 - "writing-anchors.md"
Cohesion: 0.22
Nodes (8): Before committing an anchor: two self-checks, Choosing the mode, Dialect: POSIX ERE, enforced, Grammar, Matching rules you must know, Not everything anchors, The legs pattern, The universal: `each` and `each!`

### Community 33 - "hooks.md"
Cohesion: 0.20
Nodes (9): A repo that already has hooks, Git hooks — the universal floor, Harness hooks — the early ceiling, Installed is not enforcing, Nothing here commits, Recommended ladder, What blocks and what informs, What "preserving" means here (+1 more)

### Community 34 - "Anchors: the writing manual"
Cohesion: 0.22
Nodes (8): Anchors: the writing manual, Before committing an anchor: two self-checks, Choosing the mode, Dialect: POSIX ERE, enforced, Grammar, Matching rules you must know, Not everything anchors, The legs pattern

### Community 35 - "The ecosystem change"
Cohesion: 0.22
Nodes (8): close — the gate, new — declare before you touch anything, plan / apply / land, Retiring an invariant, The ecosystem change, The graph — it follows YOUR edits, not the commit, The rhythm, The SDD flow — the lifecycle instructs, YOU run, the gate checks

### Community 36 - "Discovery: seed an existing ecosystem"
Cohesion: 0.22
Nodes (8): 1. Run the seeder, 2. Read the inventory BY CATEGORY, not by repo, 3. Take the open questions to a human, 4. Draft the map and the proposed law, 5. File everything as proposed, 6. Validate in blast-radius batches, 7. Project the doors, Discovery: seed an existing ecosystem

### Community 37 - "install.md"
Cohesion: 0.25
Nodes (7): Check it, Every machine needs its own runner, Next, Or from source, Requirements, Try it, then keep it, Two names, one binary

### Community 38 - "Reading `mvac verify`"
Cohesion: 0.25
Nodes (7): `broken` is a fork, not an error, `moved` is where the thinking is, Reading `mvac verify`, Reporting a run to a human, The four outcomes, What gates and what only reports, Where it reads from

### Community 39 - "Implementation Plan: doors prunes what it projects"
Cohesion: 0.05
Nodes (37): Content Quality, Feature Readiness, Notes, Requirement Completeness, Specification Quality Checklist: doors prunes what it projects, Compare path *and* kind, Complexity Tracking, Constitution Check (+29 more)

### Community 40 - "the-change.md"
Cohesion: 0.29
Nodes (6): Done when its anchors resolve, Four declared fields, Greenfield, The change file, The ritual, The subcommands

### Community 41 - "running-changes.md"
Cohesion: 0.29
Nodes (6): Amending and retiring, apply — a worktree per repo, or create, close — the gate, land — the order is law, new — declare before you touch anything, plan — resolve the declaration against reality

### Community 42 - "change.ts"
Cohesion: 0.18
Nodes (35): changeRel(), landingPlan(), anchoredClaimIds(), baseNames(), blockedPaths(), BranchBase, clone(), cmdApply() (+27 more)

### Community 43 - "install.ts"
Cohesion: 0.19
Nodes (15): chainedHooks(), execFileP, gitConfig(), gitHooksDir(), HOOK_NAMES, HookName, HooksReport, installAlongside() (+7 more)

### Community 44 - "Bug.md"
Cohesion: 0.33
Nodes (5): Anything the tool should have told you, `multivac doctor`, What happened, What you expected, Your setup

### Community 45 - "Default.md"
Cohesion: 0.33
Nodes (5): Claims made true, Friction, Landing order, Verification, What landed

### Community 46 - "Each file answers: the universal quantifier"
Cohesion: 0.33
Nodes (5): Each file answers: the universal quantifier, Exit semantics, Syntax, justified, The mode, What now anchors, what still does not

### Community 47 - "distribution.md"
Cohesion: 0.33
Nodes (5): Doors, Pin + staleness, Skills: the third artifact class, The managed block, The mount

### Community 48 - "concepts/invariants.md"
Cohesion: 0.33
Nodes (5): Amend, IDs, Retire, The agent proposes; the human enacts, Three birth paths, one table

### Community 49 - "philosophy.md"
Cohesion: 0.33
Nodes (5): A paraphrase ages silently, The ritual, Three layers, and which of them a machine can write, What follows from all this, Who proposes, who enacts

### Community 50 - "Interview: a brain from scratch"
Cohesion: 0.33
Nodes (5): How output lands, How to ask, Interview: a brain from scratch, What to elicit, in this order, When to stop

### Community 51 - "multivac — operating protocol"
Cohesion: 0.33
Nodes (5): Ask the graph before you read the tree, multivac — operating protocol, Session zero: pick the branch, Steady state: the rules, When you need the manual

### Community 52 - "Changes do not collide"
Cohesion: 0.40
Nodes (4): Changes do not collide, Observed while running this change through the lifecycle, Reserved invariant IDs (MV-26), Worktree per change (MV-25)

### Community 53 - "verify.ts"
Cohesion: 0.16
Nodes (20): evaluateAnchors(), ParseDiagnostic, Diagnostic, evaluate(), evaluateCore(), Evaluated, EvaluateOpts, legGates() (+12 more)

### Community 54 - "The ledger and the link"
Cohesion: 0.40
Nodes (4): The escape hatch, The ledger and the link, The link, What the adversarial pass changed

### Community 55 - "getting-started.md"
Cohesion: 0.40
Nodes (4): `mvac init .`, Next, One repo? Say so, What the empty brain says

### Community 56 - "Integration.md"
Cohesion: 0.50
Nodes (3): The tool, What it reads, Why it cannot be verified, if it cannot

### Community 57 - "init cannot lie: gitignored brains and disarmed hooks"
Cohesion: 0.50
Nodes (3): 1. init vs .gitignore, 2. init vs existing hooks, init cannot lie: gitignored brains and disarmed hooks

### Community 58 - "The gate cannot lie"
Cohesion: 0.50
Nodes (3): 1. `doctor` must fail when the gate is disarmed (MV-47), 2. `count` must name `each` for universal-shaped legs (MV-48), The gate cannot lie

### Community 59 - "normalize.ts"
Cohesion: 0.53
Nodes (4): dollarTag(), endOfQuoted(), SqlStatement, sqlStatements()

### Community 61 - "sdd.ts"
Cohesion: 0.21
Nodes (19): artifactHit(), onPath(), sddRoots(), copiedFrom(), execFileP, flowLines(), GateResult, openItems() (+11 more)

### Community 62 - "registry.ts"
Cohesion: 0.12
Nodes (16): DoorKind, doorTargets, GatePoint, GrapherEntry, GrapherQuery, knownGraphers, LifecyclePoint, sdd (+8 more)

### Community 66 - "Anchors: the writing manual"
Cohesion: 0.22
Nodes (8): Anchors: the writing manual, Before committing an anchor: two self-checks, Choosing the mode, Dialect: POSIX ERE, enforced, Grammar, Matching rules you must know, Not everything anchors, The legs pattern

### Community 76 - "The ecosystem change"
Cohesion: 0.22
Nodes (8): close — the gate, new — declare before you touch anything, plan / apply / land, Retiring an invariant, The ecosystem change, The graph — it follows YOUR edits, not the commit, The rhythm, The SDD flow — the lifecycle instructs, YOU run, the gate checks

### Community 81 - "Discovery: seed an existing ecosystem"
Cohesion: 0.22
Nodes (8): 1. Run the seeder, 2. Read the inventory BY CATEGORY, not by repo, 3. Take the open questions to a human, 4. Draft the map and the proposed law, 5. File everything as proposed, 6. Validate in blast-radius batches, 7. Project the doors, Discovery: seed an existing ecosystem

### Community 83 - "parse.ts"
Cohesion: 0.16
Nodes (15): ClaimRow, collectBrainAnchors(), nibble(), parseAnchors(), ParseResult, readClaimRows(), compileAnchorRegex(), ESCAPE_HINTS (+7 more)

### Community 85 - "Contributing to multivac"
Cohesion: 0.12
Nodes (13): 0.1.0 — 2026-08-16, 0.1.1 — 2026-08-16, Changelog, Adding a harness, a grapher or an SDD tool, Contributing to multivac, Friction is a finding, Getting set up, Merge requests (+5 more)

### Community 86 - "Reading `mvac verify`"
Cohesion: 0.25
Nodes (7): `broken` is a fork, not an error, `moved` is where the thinking is, Reading `mvac verify`, Reporting a run to a human, The four outcomes, What gates and what only reports, Where it reads from

### Community 88 - "Interview: a brain from scratch"
Cohesion: 0.33
Nodes (5): How output lands, How to ask, Interview: a brain from scratch, What to elicit, in this order, When to stop

### Community 91 - "multivac — operating protocol"
Cohesion: 0.33
Nodes (5): Ask the graph before you read the tree, multivac — operating protocol, Session zero: pick the branch, Steady state: the rules, When you need the manual

### Community 93 - "Implementation Plan: The merge keeps what it did not write"
Cohesion: 0.05
Nodes (37): Content Quality, Feature Readiness, Notes, Requirement Completeness, Specification Quality Checklist: The merge keeps what it did not write, 1. The unit of ownership is the hook object, not the entry, 2. Identity is exact, and there are two of them, 3. The matcher is written once, never rewritten (+29 more)

### Community 106 - "speckit-analyze/SKILL.md"
Cohesion: 0.08
Nodes (25): 1. Initialize Analysis Context, 2. Load Artifacts (Progressive Disclosure), 3. Build Semantic Models, 4. Detection Passes (Token-Efficient Analysis), 5. Severity Assignment, 6. Produce Compact Analysis Report, 7. Provide Next Actions, 8. Offer Remediation (+17 more)

### Community 107 - "The release says what changed"
Cohesion: 0.33
Nodes (5): Found while doing it, Scope, The release says what changed, The rule, Why a test again

### Community 108 - "git.ts"
Cohesion: 0.18
Nodes (16): brainDrift(), fmtAge(), resolveSources(), short(), stalenessLines(), worktreeAt(), AMBIENT_GIT_ENV, cleanEnv() (+8 more)

### Community 109 - "Execution Steps"
Cohesion: 0.12
Nodes (15): 1. Initialize Convergence Context, 2. Load Artifacts (Progressive Disclosure), 3. Build the Intent Inventory, 4. Assess the Codebase and Classify Findings, 5. Assign Severity, 6. Present the In-Session Findings Summary, 7. Append Convergence Tasks (or report converged), 8. Provide Next Actions (Handoff) (+7 more)

### Community 111 - "config.ts"
Cohesion: 0.27
Nodes (14): BRAIN_PATHS, exists(), fail(), grapherDecl(), isChangeFile(), layoutError(), LEGACY, loadConfig() (+6 more)

### Community 112 - "evaluate.ts"
Cohesion: 0.15
Nodes (21): evalLeg(), EvaluateOptions, RANK, RepoHandle, rewriteGlob(), TaggedMatch, Target, untrackedHint() (+13 more)

### Community 113 - "fixture.ts"
Cohesion: 0.05
Nodes (39): count, verify, unmergedFiles(), eco(), git(), gitInit(), initRepo(), makeScratchEcosystem() (+31 more)

### Community 114 - "out.ts"
Cohesion: 0.31
Nodes (8): findStaleMount(), paint(), runVerify(), bold, dim, green, red, yellow

### Community 115 - "Feature Specification: [FEATURE NAME]"
Cohesion: 0.15
Nodes (12): Assumptions, Edge Cases, Feature Specification: [FEATURE NAME], Functional Requirements, Key Entities *(include if feature involves data)*, Measurable Outcomes, Requirements *(mandatory)*, Success Criteria *(mandatory)* (+4 more)

### Community 116 - "repos.ts"
Cohesion: 0.25
Nodes (8): execFileP, reposCommand, reposList(), reposSync(), gitFailure(), remote, src, tmp

### Community 117 - "speckit-plan/SKILL.md"
Cohesion: 0.18
Nodes (10): Completion Report, Done When, Key rules, Mandatory Post-Execution Hooks, Outline, Phase 0: Outline & Research, Phase 1: Design & Contracts, Phases (+2 more)

### Community 118 - "doors.ts"
Cohesion: 0.19
Nodes (17): DoorTarget, installHookConfig(), installSkill(), KNOWN_TARGETS, linkDoor(), mirror(), packagedSkill(), packageRoot() (+9 more)

### Community 119 - "doors.test.ts"
Cohesion: 0.22
Nodes (10): grapherSpec(), sddSpec(), grapherLines(), projectLawLines(), renderBrainDoor(), doorsWithSkills(), eco, projected (+2 more)

### Community 120 - "The merge keeps what it did not write"
Cohesion: 0.50
Nodes (3): Migration, The merge keeps what it did not write, What identity should be

### Community 121 - "seed.ts"
Cohesion: 0.20
Nodes (13): deployStacks(), nameSome(), openQuestions(), runSeed(), seed, lsFiles(), CATEGORIES, Category (+5 more)

### Community 122 - "speckit-specify/SKILL.md"
Cohesion: 0.18
Nodes (10): Completion Report, Done When, For AI Generation, Mandatory Post-Execution Hooks, Outline, Pre-Execution Checks, Quick Guidelines, Section Requirements (+2 more)

### Community 123 - "speckit-tasks/SKILL.md"
Cohesion: 0.18
Nodes (10): Checklist Format (REQUIRED), Completion Report, Done When, Mandatory Post-Execution Hooks, Outline, Phase Structure, Pre-Execution Checks, Task Generation Rules (+2 more)

### Community 124 - "Core Principles"
Cohesion: 0.18
Nodes (10): Core Principles, Development Workflow, Engineering Constraints, Governance, I. A Claim Nobody Checks Decays (NON-NEGOTIABLE), II. The Tool Never Claims More Than It Checked (NON-NEGOTIABLE), III. The Law Changes Before The Code, IV. Deterministic, Offline, Small (+2 more)

### Community 125 - "Core Principles"
Cohesion: 0.18
Nodes (10): Core Principles, Governance, [PRINCIPLE_1_NAME], [PRINCIPLE_2_NAME], [PRINCIPLE_3_NAME], [PRINCIPLE_4_NAME], [PRINCIPLE_5_NAME], [PROJECT_NAME] Constitution (+2 more)

### Community 126 - "Implementation Plan: [FEATURE]"
Cohesion: 0.22
Nodes (8): Complexity Tracking, Constitution Check, Documentation (this feature), Implementation Plan: [FEATURE], Project Structure, Source Code (repository root), Summary, Technical Context

### Community 127 - "speckit-checklist/SKILL.md"
Cohesion: 0.25
Nodes (7): Anti-Examples: What NOT To Do, Checklist Purpose: "Unit Tests for English", Example Checklist Types & Sample Items, Execution Steps, Post-Execution Checks, Pre-Execution Checks, User Input

### Community 128 - "speckit-clarify/SKILL.md"
Cohesion: 0.29
Nodes (6): Completion Report, Done When, Mandatory Post-Execution Hooks, Outline, Pre-Execution Checks, User Input

### Community 129 - "speckit-implement/SKILL.md"
Cohesion: 0.29
Nodes (6): Completion Report, Done When, Mandatory Post-Execution Hooks, Outline, Pre-Execution Checks, User Input

### Community 130 - "speckit-constitution/SKILL.md"
Cohesion: 0.33
Nodes (5): Outline, Post-Execution Checks, Pre-Execution Checks, Scope Guard, User Input

### Community 131 - "speckit-taskstoissues/SKILL.md"
Cohesion: 0.40
Nodes (4): Outline, Post-Execution Checks, Pre-Execution Checks, User Input

### Community 132 - "[CHECKLIST TYPE] Checklist: [FEATURE NAME]"
Cohesion: 0.40
Nodes (4): [Category 1], [Category 2], [CHECKLIST TYPE] Checklist: [FEATURE NAME], Notes

### Community 133 - "The project document is gated on existing"
Cohesion: 0.50
Nodes (3): The project document is gated on existing, What changes, What merging MV-75 found

### Community 134 - "count.ts"
Cohesion: 0.29
Nodes (8): run(), USAGE, findMount(), normUrl(), resolveRepoKey(), ConfigError, realPath(), samePath()

### Community 136 - "composition.md"
Cohesion: 0.33
Nodes (5): Neither is required, Next, Not competing is a rule here, not a posture, Why a grapher helps, Why an SDD tool is recommended

### Community 137 - "change.test.ts"
Cohesion: 0.29
Nodes (4): ctx, eco, svc, tmp

### Community 138 - "doors prunes what it projects"
Cohesion: 0.50
Nodes (3): doors prunes what it projects, Found alongside, NOT fixed here, Scope

### Community 142 - "core.hooksPath is read the way git reads it"
Cohesion: 0.33
Nodes (5): core.hooksPath is read the way git reads it, Drafted anchors, Friction, written down rather than worked around, What changes, What does NOT change

### Community 143 - "banner.ts"
Cohesion: 0.33
Nodes (5): BannerOptions, GLYPHS, Lamp, RIGHT, ROWS

### Community 144 - "brain-first-class.test.ts"
Cohesion: 0.40
Nodes (3): doorsCommand, BRAIN_IS_CODE, brainIsCode()

## Knowledge Gaps
- **825 isolated node(s):** `common.sh script`, `name`, `version`, `description`, `license` (+820 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `multivac — design` connect `multivac — design` to `Contributing to multivac`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `loadConfig()` connect `config.ts` to `count.ts`, `init.ts`, `doctor.ts`, `change.ts`, `git.ts`, `brain-first-class.test.ts`, `init.test.ts`, `out.ts`, `repos.ts`, `verify.ts`, `doors.ts`, `seed.ts`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `say()` connect `change.ts` to `count.ts`, `init.ts`, `doctor.ts`, `index.ts`, `out.ts`, `detect.ts`, `repos.ts`, `doors.ts`, `verify.ts`, `seed.ts`, `sdd.ts`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `common.sh script`, `name`, `version` to the rest of the system?**
  _825 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Implementation Plan: The project document is gated on existing` be split into smaller, more focused modules?**
  _Cohesion score 0.047619047619047616 - nodes in this community are weakly interconnected._
- **Should `file.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1168091168091168 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._