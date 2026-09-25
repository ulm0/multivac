# Quickstart: validating this feature

Run everything in a scratch directory with `HOME` and `GIT_CONFIG_GLOBAL`
pointed inside it. Never run the vendor installs in this repo.

## Prerequisites

- `node dist/cli.js` built from this branch: `pnpm build`
- `graphify` on PATH, 0.9.29 or the version the registry records
- a scratch ecosystem: a brain with one declared code repo, `doors: [agents, claude]`,
  `grapher: graphify`, `sdd: speckit`

## 1. The door reaches Claude in a code repo (FR-001, FR-003, SC-001)

```
node <repo>/dist/cli.js repos sync
ls -l <code-repo>/CLAUDE.md          # expect: CLAUDE.md -> AGENTS.md
grep -c '^## graphify' <code-repo>/AGENTS.md   # expect: 1
grep -c 'multivac:begin' <code-repo>/AGENTS.md # expect: 1
```

Expected: the link line in the run's output, the vendor's section inside
`AGENTS.md`, and the door block intact.

## 2. Nothing is overwritten (FR-002)

Put a regular `CLAUDE.md` in the code repo, run the same command, and expect the
file untouched plus the "exists as a regular file" line.

## 3. Hook paths stay portable (FR-004, SC-004)

```
sed -i '' 's|graphify hook-guard|/opt/x/graphify hook-guard|' <code-repo>/.claude/settings.json
node <repo>/dist/cli.js repos sync
grep -c '/opt/x/graphify' <code-repo>/.claude/settings.json   # expect: 0
```

Expected: the rewrite line, even though every platform's probe was already
present.

## 4. The door says only what is true (FR-005, FR-006, SC-003)

- With `doors: [agents]` only: the rendered door prints the verbs and does not
  cite `## graphify`.
- With `doors: [claude]`: the door cites the section.
- With the section deleted from `AGENTS.md`: `doctor` names a platform that
  writes it, never `--platform agents`.

## 5. The consumer door names the law where it is (FR-007, SC-005)

```
grep -n 'invariants.md' <code-repo>/AGENTS.md
```

Expected: every hit starts with the mount, for example `brain/.multivac/invariants.md`.

## 6. Cursor (FR-008, FR-009, SC-006)

With `doors: [agents, cursor]` and a pre-existing `.cursor/rules/multivac.mdc`:

```
node <repo>/dist/cli.js doors
ls <code-repo>/.cursor/rules/          # expect: no multivac.mdc
```

Then add a human line to a fresh `multivac.mdc`, re-run, and expect the file to
survive with that line and no managed block. With the section present in
`AGENTS.md`, expect the run to report the `cursor` platform skipped.

## 7. The law holds (FR-011, SC-007)

```
node dist/cli.js verify --strict
node --test test/
```

Expected: every claim of this change resolves, and the suite passes.
