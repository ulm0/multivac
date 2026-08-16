---
title: Getting started
weight: 2
---

This page assumes the binary is on your `PATH`. If it is not,
[Install](../install) is three commands.

## `mvac init .`

Run it in the directory that will become the brain — the repo you develop
the whole ecosystem from:

```txt
$ mvac init .
init: git init — the brain is git-native
init: wrote .multivac/config.yml — declare your repos under repos:
init: wrote AGENTS.md — the door; your agent reads it first
init: wrote .multivac/invariants.md — the law table, zero rows
init: wrote .multivac/ritual.md — empty; what you write there, `change close` prints
init: hooks in .multivac/hooks (core.hooksPath) — verify runs on commit
init: done — load the multivac skill to fill the brain (see AGENTS.md)
```

Exactly these files, nothing else:

```txt
AGENTS.md                    the door — first thing any agent reads
.multivac/invariants.md      the law table, zero rows
.multivac/changes/           one file per ecosystem change (empty)
.multivac/config.yml         the registry: repos, doors, adapters
.multivac/ritual.md          the closing ceremony, empty but for one comment
.multivac/hooks/pre-commit   runs `mvac verify` on every commit
.multivac/hooks/pre-push     same, on push
.multivac/.gitignore         ignores .multivac/cache/ and .multivac/worktrees/
```

`AGENTS.md` is the one file multivac writes at the root, because that is
where harnesses read it; everything else it owns lives under `.multivac/`,
out of the way of your own content. `git init` runs only when
the directory is not already a repo. `core.hooksPath` is pointed at
`.multivac/hooks/`, so the hooks are versioned and travel with the clone —
no install step to forget.

On a repo that already has opinions, `init` checks before it writes: a
`.gitignore` that would swallow the brain gets explicit negations appended
(and the report says so), and an existing hook set-up — `.git/hooks/`,
husky, lefthook, the pre-commit framework — is chained or installed
alongside, never silently replaced. See
[Hooks](../../reference/hooks/) for the strategies.

Re-running `init` is safe: an existing `.multivac/config.yml` is kept, an
existing `AGENTS.md` is never clobbered — multivac only rewrites its managed
block, between `<!-- multivac:begin -->` and `<!-- multivac:end -->`. The
rest of the file is yours.

`init` also detects what is already in the directory — `CLAUDE.md`,
`.cursor/`, `openspec/`, `graphify-out/` — and writes commented proposals
into `config.yml` (`# doors: [agents, claude, cursor]`, `# sdd: opsx`,
`# grapher: graphify`). Flags enact instead of proposing:

```sh
mvac init . --provider claude,cursor --sdd opsx --grapher graphify
```

Flags are configuration, not one-shot magic: they land in
`.multivac/config.yml`. Adopting Cursor in three months is one line in that
file plus `mvac doors` — not re-running init. The default is `doors: [agents]`:
`AGENTS.md` alone, already read by Codex, opencode, Cursor, and Claude Code.
`--provider claude` is what adds the symlink.

## What the empty brain says

`AGENTS.md` after init — the whole file is one managed block:

```markdown
<!-- multivac:begin -->
# multivac

This brain is empty on purpose. Load the multivac skill and fill it:
- existing ecosystem: `multivac seed`, then validate the proposed rows
- from scratch: run the interview

The law lives in `.multivac/invariants.md` (anchored claims); every decision enters
as a `multivac change`. The ritual — the closing ceremony no tool can
check — is `.multivac/ritual.md`, printed by `change close`. Run
`multivac verify` before acting on anything you read here.
<!-- multivac:end -->
```

`.multivac/invariants.md` is the law table with its format and zero rows:

```markdown
# Invariants

| ID | statement | authority | state | date | source |
| --- | --- | --- | --- | --- | --- |
```

And `verify` is already honest about the emptiness:

```txt
$ mvac verify
0 claims · 0 anchored


0 blocking broken · exit 0
```

You start at zero and the tool is already useful. Coverage is counted, never
pretended.

## Next

Declare your repos in `.multivac/config.yml`:

```yaml
doors: [agents]
repos:
  api: ../acme-api          # bare string = shorthand for { path: ... }
  payments:
    path: ../payments
    url: git@example.com:acme/payments.git   # cloned by `repos sync` if missing
```

The key (`api`) is the registry name anchors use — never the directory name.

### One repo? Say so

When the brain IS the code repo — the usual shape for a single project —
declare it with the reserved `brain` key:

```yaml
doors: [agents]
# brain==code: this repo is both the brain and the code it governs.
repos:
  brain: .
```

`mvac init` writes exactly that when the repo it initializes already has
tracked source. Anchors then target `brain:<glob>`, `mvac change` branches
right here, and `doctor` stops looking for a brain mount there is no reason
to have — nothing is submoduled into itself. Sibling repos are more keys
alongside it whenever the project grows into an ecosystem.

Then fill the brain: [Session zero](../session-zero).
