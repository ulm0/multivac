# Phase 0 — Research

All measurements 2026-09-16, against this build, git 2.55.0, and the `psr-brain`
ecosystem (42 declared repos). Scratch runs used an isolated `HOME`.

## What is true today

| Fact | How it was measured |
|---|---|
| `verify` in a repo with no config and no mount exits 2 | ran `mvac verify` in `pulsar-deploy-mock-env`: `no .multivac/config.yml in <dir> — run `multivac init .` to create it`, `EXIT=2` |
| The brain is resolved only as a subdirectory | `findMount`, `src/commands/verify.ts:714` — `.brain` preferred, else the single child directory that has `.multivac/config.yml` |
| Nothing mounts | `grep -rn "submodule add" src/` hits only advice text: `src/commands/doctor.ts:464`, `src/doors/consumer.ts:64`, `src/commands/verify.ts:1014` |
| `repos sync` clones and fetches only | `src/commands/repos.ts:45-102` |
| The mount is documented as manual | `site/content/docs/reference/configuration.md`, key `mount` |
| The manual step drifts | `mvac doctor` in `psr-brain`: 36 repos `pin … behind`/`pin ok`, 3 `no brain mount at .brain`, 2 `shallow, read-only — no mount expected`, 1 (`pulsar-deploy-mock-env`) `no brain mount` and no `.brain` on disk at all |
| The shim promises otherwise | `.multivac/hooks/pre-commit`: "No runnable multivac never blocks a commit: it warns loudly and exits 0" |
| A guessed URL would be wrong | `git -C psr-brain remote -v` → `git@gh-work:Cencosud-Cencommerce/psr-brain.git`; `git -C pulsar-pkg config -f .gitmodules --get-regexp` → `git@github.com:Cencosud-Cencommerce/psr-brain.git` |
| A symlinked mount already unblocks it | `ln -s ../psr-brain .brain` in `pulsar-deploy-mock-env` → `mvac verify` prints the scoped consumer report and `EXIT=0`. Removed again. |

## What `git submodule add` actually does

Measured in scratch, isolated `HOME`, git 2.55.0.

1. **Plain add, path URL, default config** → `fatal: transport 'file' not allowed`.
   git has blocked the `file` transport for submodules since the CVE-2022-39253 fix.
   Nothing is staged.
2. **With `protocol.file.allow=always`** → clones and stages:
   `A .brain`, `A .gitmodules`, and `git ls-files -s .brain` reports
   `160000 <sha> 0 .brain`. No commit is made.
3. **`git ls-tree HEAD -- .brain` is empty** right after the add — the gitlink is in the
   index, not in HEAD.
4. **A second add** → `fatal: '.brain' already exists in the index`.
5. **A directory that is already a clone of the brain** → `Adding existing repo at
   '.brain' to the index`, no re-clone, no network, and `.gitmodules` records the URL
   passed on the command line, not the existing clone's origin.
6. **A directory that exists and is not a git repo** → `fatal: '.brain' already exists
   and is not a valid git repo`; nothing staged.
7. `protocol.file.allow` set in the consumer's *repo-local* config does **not** take
   effect; the submodule clone runs as a child that does not read it. It works as a
   global config in an isolated `HOME`, or through `GIT_CONFIG_COUNT`/`GIT_CONFIG_KEY_0`
   in the environment.

Consequences carried into the design:

- **Idempotency must read the index, not HEAD.** Measurement 3 and 4 together mean a
  second `repos sync` before the human commits would fail on a mount it just made.
  `lsTreeGitlink` alone is not enough; the pass asks `git ls-files -s -- <mount>` too.
- **Measurement 5 repairs the middle state for free.** The three repos with a `.brain`
  directory and no gitlink get adopted into the index without a network round-trip, and
  with the declared URL rather than whatever their existing clone points at.
- **Measurement 6 is a real failure to quote, not a crash.** It is what a repo with a
  stray `.brain` directory gets, and the message names the cause.
- **multivac must not weaken git's transport policy.** Passing
  `-c protocol.file.allow=always` would re-open the vector that fix closed, on someone
  else's repo, to make a local-path URL convenient. Decision: never pass it. A
  local-path `brain_url` fails with git's own message, quoted. The test suite sets it in
  its own isolated environment, which is where it belongs.

## Decisions not forced by the measurements

### D1 — The mount pass lives in `repos sync`

Considered a separate `repos mount`. Rejected: `repos sync` already means "make the
declared repos usable, and yes it reaches the network" (its own header comment, and
Principle IV names it as the command that buys freshness). A second verb would leave
"cloned but unmounted" as the default outcome — which is the drift measured above.

Considered mounting from `doors`. Rejected: `doors` must make no network call
(Principle IV), and `git submodule add` clones.

### D2 — A projected door is recognised by the shim multivac wrote

`src/hooks/install.ts` already exports `SHIM_HEADER` and `isOurShim(text)`. The
predicate reads `.multivac/hooks/pre-commit` (and `pre-push`) and asks `isOurShim`.

Considered `existsSync('.multivac')`. Rejected: a human can create that directory, and
the whole point of the branch is to distinguish a repo multivac claimed from one it never
touched. A marker multivac itself writes is checkable; a path is a guess.

Considered a new pointer file written into each consumer. Rejected: it is a second source
of truth for something the mount already answers, and it would need its own staleness
story.

### D3 — `brain_url`, hand-authored

The brain's own clone URL has nowhere to live today: `psr-brain`'s config declares no
entry for itself, and this repo's declares `brain: .` with no `url`. A new top-level key
is the smallest home for it.

Never derived from `git remote get-url origin` — measurement above: the brain's origin
can be a machine-local SSH alias, and the derived value is written into every consumer's
`.gitmodules`, where everyone else reads it.

`requires` is the precedent for a hand-authored key the tool never writes
(`site/content/docs/reference/configuration.md`: "**Hand-authored — the tool never writes
this field**, because a floor is a decision"). `brain_url` is the same shape: an address
as other people see it is a decision. `init` may *suggest* it, commented, and a comment
is not a declaration.

### D4 — `verify` exits 0 where there is no brain to read

The constitutional argument is in [plan.md](./plan.md) under Principle II. The
engineering argument: the shim already exits 0 with a loud warning when it finds no
runnable multivac, and a multivac that runs but cannot reach the brain is the same state
from the committer's side — nothing was verified. Today the two states differ only in
which of them locks the repo, which is the inconsistency.

The blast radius is bounded by the door predicate (D2): a repo multivac never touched
still gets exit 2 and `multivac init .`.
