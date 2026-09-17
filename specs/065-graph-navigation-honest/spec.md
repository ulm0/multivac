# Feature Specification: What the graph promises is what happens

**Feature Branch**: `065-graph-navigation-honest` | **Created**: 2026-09-16 | **Status**: Draft

**Input**: Requirement 17 of the 2026-09-14 plan (R7c, I-55, I-58; clusters C24 to C29).

## Context: what was measured

1. **The door promises more than it delivers.** It says the graph is "refreshed after your edits" in every brain. Only a declared harness with a post-edit hook refreshes after an edit. Without one, the refresh happens at `change land` and `change close`.
2. **The refresh hook can refresh the wrong repo.** It runs in the session's working directory. An edit to a file in a named sibling's worktree refreshed the brain's graph and left the sibling's graph stale.
3. **flow.md claims more than the gate checks.** It still says `change close` refuses over "a declared, present repo". Since MV-134 the gate judges the brain and the repos the change names.
4. **Nothing says navigation is unchecked.** No surface states that asking the graph before reading the tree cannot be checked. graphify records a query only in an untracked `cache/last_query_stamp`, and a query that found nothing writes it too. graphify's own Claude hook nudges toward a query and blocks nothing.
5. **The door repeats graphify's section.** Where graphify's install runs for a declared door, it writes its own `## graphify` section with the verbs and rules. The multivac door repeated them.

## User Scenarios & Testing

### US1 - The door's promise follows the hooks (P1)
1. **Given** no declared door with a post-edit hook, **then** the door says the graph is refreshed at `change land` and `change close`.
2. **Given** a declared harness with a post-edit hook, **then** the door says the graph is refreshed after edits.

### US2 - The hook refreshes the edited file's repo (P1)
1. **Given** a post-edit payload naming a file inside another git repo that holds the grapher's artifact, **then** the refresh runs in that repo, under that repo's lock.
2. **Given** a file in a repo without the artifact, or no file, **then** it runs where it always did.

### US3 - Navigation is named as yours (P2)
1. flow.md and `doctor` say that asking the graph cannot be checked, and why.
2. flow.md's graph lines match what MV-134 does.

### US4 - The door cites graphify's section (P2)
1. **Given** a grapher whose own harness install covers a declared door, **then** the door names its query commands in one line and points to that tool's own section for their use.
2. `doctor` reports a door file where that section is missing.
