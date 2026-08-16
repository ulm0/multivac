# Graph Report - brain  (2026-08-16)

## Corpus Check
- 174 files · ~169,986 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1087 nodes · 2058 edges · 113 communities (77 shown, 36 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `447a65a4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- detect.ts
- fixture.ts
- evaluate.ts
- package.json
- multivac — design
- doctor.ts
- init.ts
- verify.ts
- git.ts
- loadChange
- commands.md
- change.ts
- file.ts
- doors.ts
- .multivac/invariants.md
- count.ts
- parse.ts
- Top-level keys
- SDD adapters
- reserve.ts
- index.ts
- match.ts
- Contributor Covenant Code of Conduct
- integrations.md
- settings.ts
- sdd-gates.test.ts
- compilerOptions
- types.ts
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
- Contributing to multivac
- the-change.md
- running-changes.md
- ritual.test.ts
- README.md
- Bug.md
- Default.md
- Each file answers: the universal quantifier
- distribution.md
- concepts/invariants.md
- philosophy.md
- Interview: a brain from scratch
- multivac — operating protocol
- Changes do not collide
- Every command shows its flags
- The ledger and the link
- getting-started.md
- Integration.md
- init cannot lie: gitignored brains and disarmed hooks
- The gate cannot lie
- Built with itself includes the door
- Five defects the prover found
- sync-fetches-the-channel.md
- sdd.ts
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
- the-gaps-that-were-not-gaps.md
- the-gate-names-its-room.md
- brain.ts
- Reading `mvac verify`
- the-panel-lights-up.md
- Interview: a brain from scratch
- the-ritual-has-a-home.md
- the-site-tells-the-whole-story.md
- multivac — operating protocol
- verify-untracked-and-pending.md
- ls-files-counts-each-file-once.md
- pre-commit
- pre-push
- ritual.md
- gitlab.com/ulm0/multivac/site
- CLAUDE.md
- registry.ts
- seed-finds-the-contracts.md
- no-mention-what-is-not-supported.md
- the-ledger-keeps-itself.md
- the-ramp-is-part-of-the-road.md
- the-small-lies-and-the-shared-lock.md

## God Nodes (most connected - your core abstractions)
1. `say()` - 35 edges
2. `run()` - 34 edges
3. `loadConfig()` - 29 edges
4. `makeScratchEcosystem()` - 27 edges
5. `warn()` - 26 edges
6. `multivac — design` - 23 edges
7. `loadChange()` - 21 edges
8. `saveChange()` - 21 edges
9. `pathExists()` - 20 edges
10. `runInit()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `declareBrain()` --calls--> `loadChange()`  [EXTRACTED]
  test/change/sdd-gates.test.ts → src/change/file.ts
- `landedChange()` --calls--> `saveChange()`  [EXTRACTED]
  test/change/ritual.test.ts → src/change/file.ts
- `declareBrain()` --calls--> `saveChange()`  [EXTRACTED]
  test/change/sdd-gates.test.ts → src/change/file.ts
- `run()` --calls--> `main()`  [EXTRACTED]
  test/cli/help.test.ts → src/cli.ts
- `runnerWith()` --calls--> `findRunner()`  [EXTRACTED]
  test/init/hook-shim.test.ts → src/hooks/install.ts

## Import Cycles
- None detected.

## Communities (113 total, 36 thin omitted)

### Community 0 - "detect.ts"
Cohesion: 0.14
Nodes (21): AdapterStatus, artifactPresent(), binaryPresent(), detect(), Detected, policy, SddRoot, execFileP (+13 more)

### Community 1 - "fixture.ts"
Cohesion: 0.07
Nodes (34): count, verify, eco(), git(), gitInit(), initRepo(), makeScratchEcosystem(), publishRepo() (+26 more)

### Community 2 - "evaluate.ts"
Cohesion: 0.18
Nodes (16): evalLeg(), evaluateAnchors(), EvaluateOptions, RANK, rewriteGlob(), TaggedMatch, Target, untrackedHint() (+8 more)

### Community 3 - "package.json"
Cohesion: 0.04
Nodes (44): bin, multivac, mvac, bugs, url, dependencies, picomatch, yaml (+36 more)

### Community 4 - "multivac — design"
Cohesion: 0.05
Nodes (44): Anchor to contracts, not implementations, Artifact ≠ binary, Asymmetric severity, Automation by default (owner decision, 2026-08-13), Branching is local-first, and says what it did, Build plan, CLI, Coverage, not completeness (+36 more)

### Community 5 - "doctor.ts"
Cohesion: 0.07
Nodes (44): pathExists(), stepsGating(), alongsideParts(), branchesLine(), buildCritical(), doctorReport(), doorState(), fmtAge() (+36 more)

### Community 6 - "init.ts"
Cohesion: 0.07
Nodes (41): detectAdapters(), ensureVisibleToGit(), exists(), Flags, init, isRepoRoot(), migrateLegacy(), parseFlags() (+33 more)

### Community 7 - "verify.ts"
Cohesion: 0.13
Nodes (29): RepoHandle, brainDrift(), Diagnostic, evaluate(), evaluateCore(), EvaluateOpts, findStaleMount(), fmtAge() (+21 more)

### Community 8 - "git.ts"
Cohesion: 0.18
Nodes (11): AMBIENT_GIT_ENV, catFileBlobs(), cleanEnv(), currentBranch(), execFileP, headSha(), lsTree(), remoteTrackingRef() (+3 more)

### Community 9 - "loadChange"
Cohesion: 0.10
Nodes (18): changePath(), changesDir(), loadChange(), saveChange(), blockWorktree(), brainWithStaleRemote(), declare(), git() (+10 more)

### Community 10 - "commands.md"
Cohesion: 0.09
Nodes (22): `--abandon`, `apply`, `change <sub> <slug> [args]`, `close`, `count '<repo>:<glob> [!<glob> ...] /<regex>/[i]' [dir]`, `doctor [--strict]`, `doors`, `drift`: a recorded finding that does not gate (+14 more)

### Community 11 - "change.ts"
Cohesion: 0.17
Nodes (36): changeRel(), landingPlan(), anchoredClaimIds(), baseNames(), blockedPaths(), BranchBase, clone(), cmdApply() (+28 more)

### Community 12 - "file.ts"
Cohesion: 0.13
Nodes (22): archiveChange(), ChangeClaim, ChangeError, ChangeFile, closeGate(), frontmatterError(), normalizeChange(), parseChange() (+14 more)

### Community 13 - "doors.ts"
Cohesion: 0.22
Nodes (13): doorsCommand, installHookConfig(), installSkill(), KNOWN_TARGETS, linkDoor(), packageRoot(), projectInto(), readOrNull() (+5 more)

### Community 14 - ".multivac/invariants.md"
Cohesion: 0.09
Nodes (11): Close keeps used reservations, Each scope verifies what it is responsible for, The chain arms in every order, The graph follows the agent, The graph refreshes itself, The mount explains itself, The SDD gates its own flow, The SDD tells the agent (+3 more)

### Community 15 - "count.ts"
Cohesion: 0.48
Nodes (5): run(), USAGE, findMount(), realPath(), samePath()

### Community 16 - "parse.ts"
Cohesion: 0.17
Nodes (14): ClaimRow, collectBrainAnchors(), nibble(), parseAnchors(), readClaimRows(), compileAnchorRegex(), ESCAPE_HINTS, POSIX_CLASSES (+6 more)

### Community 17 - "Top-level keys"
Cohesion: 0.12
Nodes (15): `authorities`, `blocking`, `channel`, `doors`, Errors are exit 2, `grapher`, `graphers`, Layout (+7 more)

### Community 18 - "SDD adapters"
Cohesion: 0.12
Nodes (15): Artifact ≠ binary, Automatic refresh, Detection at init, Each tool's own flow, not a fixed triple, Existence is the weakest proof, Graphers, SDD adapters, `sdd_auto` and `--no-sdd` (+7 more)

### Community 19 - "reserve.ts"
Cohesion: 0.28
Nodes (15): insertRow(), lawPath(), lawRelChange(), LawRow, lawRows(), nextFreeId(), owns(), readLaw() (+7 more)

### Community 20 - "index.ts"
Cohesion: 0.11
Nodes (25): main(), usage(), version(), doctorCommand, helpCommand, run(), TOPICS, usageFor() (+17 more)

### Community 21 - "match.ts"
Cohesion: 0.31
Nodes (7): LegScan, Match, matchesInFile(), dollarTag(), endOfQuoted(), SqlStatement, sqlStatements()

### Community 22 - "Contributor Covenant Code of Conduct"
Cohesion: 0.15
Nodes (12): 1. Correction, 2. Warning, 3. Temporary Ban, 4. Permanent Ban, Attribution, Contributor Covenant Code of Conduct, Enforcement, Enforcement Guidelines (+4 more)

### Community 23 - "integrations.md"
Cohesion: 0.15
Nodes (12): `agents`, `claude`, `codex`, `copilot`, `cursor`, Detection, `gemini`, `opencode` (+4 more)

### Community 24 - "settings.ts"
Cohesion: 0.52
Nodes (5): ensureEvent(), Json, mergeClaudeSettings(), ourEntry(), refreshHookCmd()

### Community 25 - "sdd-gates.test.ts"
Cohesion: 0.21
Nodes (8): artifact(), bin, brain, config(), ctx, declareBrain(), readyChange(), tmp

### Community 26 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, forceConsistentCasingInFileNames, module, moduleResolution, outDir, rootDir, skipLibCheck, strict (+3 more)

### Community 27 - "types.ts"
Cohesion: 0.31
Nodes (8): ParseDiagnostic, ParseResult, Evaluated, Anchor, ClaimResult, LegResult, LegState, VerifyReport

### Community 28 - "Existing ecosystem: seed → questions → interview → law"
Cohesion: 0.20
Nodes (9): 1. Seed, 2. Read by category, not by repo, 3. Take the open questions to a human, 4. Draft the map and the proposed law, 5. File everything as `proposed`, 6. Validate in blast-radius batches, 7. Project the doors, Existing ecosystem: seed → questions → interview → law (+1 more)

### Community 29 - "tsconfig.test.json"
Cohesion: 0.22
Nodes (8): test, ./tsconfig.json, compilerOptions, outDir, rootDir, extends, include, src

### Community 30 - "docs/_index.md"
Cohesion: 0.22
Nodes (7): Enforcement: the ladder, Entry from anywhere, one protocol, The session is home, Three layers, The four jobs, Three sections, Where to start

### Community 31 - "claims-and-anchors.md"
Cohesion: 0.22
Nodes (8): Anchor to contracts, not implementations, Asymmetric severity, Coverage, not completeness, Five modes, one mechanism, Legs, Matching rules, Self-healing, states, exit codes, The anchor

### Community 32 - "writing-anchors.md"
Cohesion: 0.22
Nodes (8): Before committing an anchor: two self-checks, Choosing the mode, Dialect: POSIX ERE, enforced, Grammar, Matching rules you must know, Not everything anchors, The legs pattern, The universal: `each` and `each!`

### Community 33 - "hooks.md"
Cohesion: 0.22
Nodes (8): A repo that already has hooks, Git hooks — the universal floor, Harness hooks — the early ceiling, Installed is not enforcing, Nothing here commits, Recommended ladder, What blocks and what informs, Why they live in `.multivac/hooks/`

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

### Community 39 - "Contributing to multivac"
Cohesion: 0.29
Nodes (7): Adding a harness, a grapher or an SDD tool, Contributing to multivac, Friction is a finding, Getting set up, Merge requests, The loop, What we ask

### Community 40 - "the-change.md"
Cohesion: 0.29
Nodes (6): Done when its anchors resolve, Four declared fields, Greenfield, The change file, The ritual, The subcommands

### Community 41 - "running-changes.md"
Cohesion: 0.29
Nodes (6): Amending and retiring, apply — a worktree per repo, or create, close — the gate, land — the order is law, new — declare before you touch anything, plan — resolve the declaration against reality

### Community 42 - "ritual.test.ts"
Cohesion: 0.17
Nodes (6): change, ritualChecklist(), ctx, eco, svc, tmp

### Community 43 - "README.md"
Cohesion: 0.33
Nodes (3): Contributing, License, multivac

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

### Community 53 - "Every command shows its flags"
Cohesion: 0.40
Nodes (4): `agents` is not a provider, Every command shows its flags, `--help` said nothing, `init` told you to load a skill it had not installed

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

### Community 59 - "Built with itself includes the door"
Cohesion: 0.33
Nodes (5): Built with itself includes the door, Friction found while doing this, Generated is not the same as disposable, The door was saying more than the law does, The reservation

### Community 62 - "sdd.ts"
Cohesion: 0.23
Nodes (17): artifactHit(), onPath(), sddRoots(), copiedFrom(), execFileP, flowLines(), GateResult, openItems() (+9 more)

### Community 66 - "Anchors: the writing manual"
Cohesion: 0.22
Nodes (8): Anchors: the writing manual, Before committing an anchor: two self-checks, Choosing the mode, Dialect: POSIX ERE, enforced, Grammar, Matching rules you must know, Not everything anchors, The legs pattern

### Community 76 - "The ecosystem change"
Cohesion: 0.22
Nodes (8): close — the gate, new — declare before you touch anything, plan / apply / land, Retiring an invariant, The ecosystem change, The graph — it follows YOUR edits, not the commit, The rhythm, The SDD flow — the lifecycle instructs, YOU run, the gate checks

### Community 81 - "Discovery: seed an existing ecosystem"
Cohesion: 0.22
Nodes (8): 1. Run the seeder, 2. Read the inventory BY CATEGORY, not by repo, 3. Take the open questions to a human, 4. Draft the map and the proposed law, 5. File everything as proposed, 6. Validate in blast-radius batches, 7. Project the doors, Discovery: seed an existing ecosystem

### Community 85 - "brain.ts"
Cohesion: 0.80
Nodes (4): sddSpec(), grapherLines(), projectLawLines(), renderBrainDoor()

### Community 86 - "Reading `mvac verify`"
Cohesion: 0.25
Nodes (7): `broken` is a fork, not an error, `moved` is where the thinking is, Reading `mvac verify`, Reporting a run to a human, The four outcomes, What gates and what only reports, Where it reads from

### Community 88 - "Interview: a brain from scratch"
Cohesion: 0.33
Nodes (5): How output lands, How to ask, Interview: a brain from scratch, What to elicit, in this order, When to stop

### Community 91 - "multivac — operating protocol"
Cohesion: 0.33
Nodes (5): Ask the graph before you read the tree, multivac — operating protocol, Session zero: pick the branch, Steady state: the rules, When you need the manual

### Community 106 - "registry.ts"
Cohesion: 0.12
Nodes (15): DoorKind, DoorTarget, GatePoint, GrapherEntry, GrapherQuery, knownGraphers, LifecyclePoint, sdd (+7 more)

## Knowledge Gaps
- **467 isolated node(s):** `name`, `version`, `description`, `license`, `type` (+462 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `makeScratchEcosystem()` connect `fixture.ts` to `init.ts`, `git.ts`, `loadChange`, `ritual.test.ts`, `registry.ts`, `doors.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `say()` connect `change.ts` to `detect.ts`, `doctor.ts`, `init.ts`, `verify.ts`, `doors.ts`, `count.ts`, `index.ts`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `multivac — design` connect `multivac — design` to `README.md`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _467 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `detect.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14333333333333334 - nodes in this community are weakly interconnected._
- **Should `fixture.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06578947368421052 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._