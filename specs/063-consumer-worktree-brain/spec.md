# Feature Specification: A change worktree finds its brain from its own path

**Feature Branch**: `063-consumer-worktree-brain` | **Created**: 2026-09-16 | **Status**: Draft

**Input**: Requirement 15 of the 2026-09-14 plan: exit 2 measured in a consumer's change worktree.

## Context: what was measured

`change apply` creates each named sibling repo's worktree at `<brain>/.multivac/worktrees/<slug>/<key>`. The brain mount there is a submodule nobody initialised, so it is an empty directory.

Before this change, `verify` run in that worktree (as the pre-commit shim does) behaves as follows:
- It finds no `.multivac/config.yml` and no brain in a child directory.
- It exits 2 with the stale-pin error, or, with no mount directory at all, with "run `multivac init .`".
- So no commit can be made on the change's own branch in the checkout `apply` handed back.

The path already names everything verify needs: the brain, the slug and the repo key.

## User Scenarios & Testing

### US1 - Verify in a consumer change worktree (P1)
1. **Given** a worktree at `<brain>/.multivac/worktrees/<slug>/<key>` whose key is declared, **when** `verify` runs there, **then** it scopes to `<key>`, reads the brain at `<brain>`, and says it is the change worktree for `<slug>`.
2. **Given** an empty mount directory in that worktree, **then** the path still decides, and there is no stale-pin error.
3. **Given** a key the brain does not declare, **then** the error names the declared keys.
4. The code-in-change line reads the brain itself, so it gates as in the brain checkout.

## Requirements
- **FR-001:** `worktreeBrain(dir)` returns the brain, slug, key and worktree root when `dir` sits under a brain's `.multivac/worktrees/<slug>/<key>` and that brain has a config.
- **FR-002:** It is tried before the mount lookup. `--repo` still overrides the key.
