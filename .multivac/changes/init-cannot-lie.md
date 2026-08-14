---
slug: init-cannot-lie
status: open
repos:
  brain:
    status: planned
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-36
    - MV-37
  retires: []
claims:
  - id: MV-36
    statement: init runs git check-ignore on every path it writes; when a
      repo-level ignore would swallow one, init appends explicit negation
      lines to the repo's .gitignore under a marker comment, idempotently,
      and prints what it appended; doctor reports any git-ignored brain path
      as a WARNING naming the fix.
  - id: MV-37
    statement: init never silently disarms an existing hook set-up — before
      touching core.hooksPath it detects .git/hooks/<name>, a foreign
      core.hooksPath, .husky/, lefthook.yml and .pre-commit-config.yaml; the
      shim chains a pre-existing .git/hooks hook first and preserves its exit
      code; a foreign hooksPath is never repointed — the shim is installed
      alongside, or init refuses naming the exact manual step; init prints
      the strategy used and doctor reports the coexistence state.
---

# init cannot lie: gitignored brains and disarmed hooks

Measurement 2, friction #1 and #2 (blockers). Both fired on saleor.

## 1. init vs .gitignore

saleor's `.gitignore` line 2 is `.*` — it swallowed the entire `.multivac/`
brain. init and doctor reported success while everything written was
invisible to git: a stranger commits, pushes, and ships nothing.

Fix: init runs `git check-ignore` on every path it is about to write. Any
hit and init **appends explicit negations to the repo's `.gitignore`** under
a `# multivac:` marker comment, then re-checks and prints what it appended.

**Why append, not refuse:** init's contract is "scaffold and leave a working
brain"; a refusal converts a one-line mechanical fix into a manual step the
stranger performs wrong (the negation order matters: a directory must be
un-ignored before its contents can be). The append is scoped (only the
paths init owns), marked (one comment names the author and the reason),
visible (printed line by line), reversible (delete the block), and
idempotent (lines already present are never appended again; a clean repo is
never touched). A negation in the repo root `.gitignore` also outranks
`.git/info/exclude` and `core.excludesFile`, so it fixes every source git
consults for these paths. `.multivac/.gitignore` alone cannot: the ignore
lives in the parent.

doctor: a brain path that is *ignored* (not merely untracked) is a WARNING
with the fix — previously it printed the inverted "nothing build-critical
untracked".

## 2. init vs existing hooks

saleor enforces via the pre-commit framework in `.git/hooks/pre-commit`
(ruff, mypy, semgrep, migrations). init took `core.hooksPath` and silently
disarmed all of it.

Fix, by shape:
- **`core.hooksPath` unset or already ours** → shims in `.multivac/hooks/`,
  and every shim now **chains**: it runs the repo's own `.git/hooks/<name>`
  first (when present and executable), preserves a non-zero exit, then runs
  verify. Chaining is dynamic, so a hook manager that installs into
  `.git/hooks/` *after* init (lefthook, pre-commit) is still executed.
- **`core.hooksPath` set elsewhere** (husky et al.) → never repoint. The
  shim is installed INTO the existing hooksPath dir where `<name>` is free;
  where `<name>` is taken and does not already run multivac, init refuses
  that hook and prints the exact line to add.
- **`.husky/` present with hooksPath still unset** → husky owns hooksPath
  the moment its prepare script runs; repointing would be disarmed later.
  Same alongside-or-refuse treatment, into `.husky/`.

init prints which strategy was used. doctor reports the coexistence state
and no longer advises `git config core.hooksPath .multivac/hooks` when the
repo's own gate owns the path.
