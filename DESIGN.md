# multivac — design

> A **brain-driven development** tool: one brain repo from which an entire
> ecosystem is developed — the knowledge base, its verification, and the
> change that crosses repos. Destination: OSS. Status: design, zero code.
>
> **Named 2026-08-13** after Asimov's world-computer: the central brain
> humanity consults for every decision, accumulating all knowledge across
> generations — and, in "The Last Question", finally answering. CLI alias:
> **`mvac`**. `multivac` published on npm 2026-08-13 (0.0.1 placeholder, owner ulm0); unscoped `mvac` is blocked by npm's name-similarity rule and ships as a bin inside the `multivac` package instead.
> Formerly the placeholder "eco".
>
> Session log from 2026-08-12/13. The tool — CLI, code, docs, messages — is
> 100% English. The design was validated against a real production ecosystem
> — five repos, a ~5,400-line brain, operated brain-driven for months —
> whose details are private; it appears here only as **the reference
> ecosystem**. Its brain is not written in English, which is itself a design
> constraint: the parser can never assume the knowledge base's language.

## Where it comes from

From the reference ecosystem: a documentation repo — the brain — that governs
the development of five code repos. The owner opens an agent session in that
folder and iterates features and fixes for the whole system from there. It
works, and has worked for months.

The originating question: **can something like this be generated and
maintained for any ecosystem?**

Two starting points:

1. **From scratch.** The person describes what they want, iterates with the
   LLM as it needs more detail, and all subsequent development flows from that
   base as it evolves.
2. **Existing ecosystem.** The agent reads the services, generates the base,
   passes it through user validation, and future development happens from it.

It borrows ideas from OpenSpec and SpecKit, but for the SDLC of an **entire
ecosystem**. Those tools govern change within one repo; this wants to see the
whole and evolve it.

## The ulterior purpose: brain-driven development

This is not a documentation tool. It is a **way of developing**:

> You enter **only the brain repo** and from there develop features across the
> whole ecosystem, as the need dictates. It serves projects from scratch and
> existing ecosystems alike.

That reorders the center. Verification is not the product: it is the
**precondition**. If you develop *from* the brain, a lying brain doesn't
produce ugly docs — it produces confidently wrong code across N repos. The
reference ecosystem's worst drift — a retired mechanism that survived eleven
days in the docs, described in present tense — came one step short of exactly
that.

The product is the **verb**: the change that crosses repos, planned and
executed from the brain, which updates the brain when it closes.

### Entry from anywhere, one protocol

The brain is not a place — it is a protocol, because it travels:

- **Enter the brain repo** → the brain door says how to work on the whole
  ecosystem: where every repo lives, the law, the ritual (defined below),
  landing order.
- **Enter any code repo** → the brain is mounted there (today, in the
  reference ecosystem: a git submodule), and that repo's door says: consult
  the brain before any decision — and, crucially, **the feature you're
  building may not end in this repo**. The agent standing in one surface
  knows the change may need to cross into others, and the brain tells it
  which.

Both entry points converge on the same state: work planned against the brain,
executed across whatever surfaces the feature touches. This is how the
reference ecosystem already operates by hand.

### The ecosystem change

```
multivac change new "points expire"
multivac change plan     # which repos, in what order, which invariants it touches
multivac change apply    # a worktree per repo, branched from the newest default branch
multivac change land     # MRs respecting the declared order
multivac change close    # updates the brain and verifies
```

Four fields:

1. **Which repos it touches.**
2. **Landing order** — a graph, not a list: some land in parallel, some must
   not. The reference brain's documents already write this by hand: "the
   backend lands first", "the public site tells the truth before the feature
   ships".
3. **Which invariants it touches**, under the rule already written: an
   invariant is never relaxed in code — it is changed in the law first.
4. **Which claims it makes true**, and with them, their anchors.

A change is a **file in the brain**: `.multivac/changes/<slug>.md`, carrying the four
declared fields — repos, the landing-order graph, invariants touched, claims
made true with their anchors — plus per-repo status
(planned / branched / committed / MR / landed). That file is the state the
five subcommands read and write, across days and machines. `change close`
re-runs `verify` **scoped to the declared claims**; on success the file is
archived, not deleted.

### Two changes at once do not collide (MV-25, MV-26, MV-46)

The premise is agents working an ecosystem, often several at the same time, and
two of them in one checkout used to overwrite each other. Two rules keep them
apart, both mechanical:

- **A worktree per change.** `apply` never switches a shared working tree: each
  declared repo gets a linked git worktree at
  `.multivac/worktrees/<slug>/<repo>` (machinery, gitignored) and apply prints
  the path — that is where the agent works. `close` removes them. Where git
  cannot make one, apply says so and falls back to the same in-place switch it
  has always used, which **refuses** a tree whose uncommitted work the switch
  would overwrite (MV-13) instead of carrying it onto the wrong branch. The
  change's bookkeeping is committed before the branch exists, so every checkout
  inherits it from the base — nothing rides across uncommitted.
- **A reserved ID per change.** Invariant IDs are allocated by the tool, not by
  hand: `change new` takes the next free ID from the law table and writes it
  back immediately as a `proposed` row naming the change; `plan` reserves the
  IDs a declaration adds, and **fails** on an ID another change is holding —
  loudly, at declare time, not at merge. The table is the registry, so there is
  no second store to reconcile, and `proposed` rows already never gate verify.
  The read-append-write runs under an exclusive `.multivac/invariants.md.lock`
  (`wx` — atomic across processes); an unused reservation — still carrying the
  scaffolded RESERVED statement and anchored nowhere — is released at close.
  The row and the scaffolded declaration land as one commit on the current
  branch (`change open: <slug> — reserves <ID>`), so the shared tree stays
  clean and a concurrent `new` reads the committed table. Its ceiling:
  reservations are visible where their commit is — not across unmerged
  branches.
- **The ledger keeps itself (MV-46).** Nothing the lifecycle writes floats
  uncommitted in the shared checkout: `new` refuses a tree dirty at the
  bookkeeping paths (with the exact command), `apply` commits the status bump
  before branching, and every command `close` prints is scoped to the closing
  slug's paths. On a trunk with a remote, close prints the branch+MR variant —
  nothing lands on the trunk directly; only a solo brain with no origin is
  told the direct commit IS the landing, because there is no MR to open.

### The fourth field closes the loop

> **A change is not done when it merges. It is done when its anchors resolve.**

If the change declares up front the claims it will make true, `multivac change
close` doesn't ask whether someone updated the docs: **it checks that what the
change promised is now true**. Updating the documentation stops being
discipline and becomes mechanism — which is the reference brain's explicitly
confessed hole: *"it is discipline and nothing verifies it"*, paid twice in
its own history — once with six stale pages, once with two stale door files.

It falls out of the model for free: nothing new to invent, just declare before
what today gets checked after (when anyone remembers).

### The ritual: the half of the ceremony no tool can check

Closing a change is a **ceremony**, and only half of it is mechanical.
multivac executes that half: the landing order held, every declared claim
resolves, no invariant was relaxed in code instead of in the law. The other
half belongs to the team — who reviews what, who gets told, what ships before
what when the reason is not technical. No tool can invent those, and none can
check them.

So the team writes them, in **`.multivac/ritual.md`**, beside the config, and
`multivac change close` prints them verbatim at the end of a successful
close: a checklist in front of the agent and the user at the moment it
matters. **Printed, not verified.** Nothing gates on it, nothing parses it;
an empty or absent ritual prints nothing at all. `init` scaffolds the file
with one comment saying what belongs there, and the brain door names it.

Its own file rather than a section of the law, because the law is *parsed* —
`verify` reads its anchor lines, `change plan` reads its state cells — and
the ritual is prose the tool only ever prints. Free-form lines inside a
parsed table is how a parser learns to lie.

### Greenfield falls out of the same object

A change whose repos **don't exist yet**: `apply` creates them, with their
first commit and their door. The brain precedes the code — which is exactly
starting point 1. No second machinery needed; `apply` must know how to create,
not only edit.

### Branching is local-first, and says what it did

A brain that has never been pushed is the normal state of a young ecosystem,
so a merely-existing `origin/main` is not authority. `apply` bases each branch
on the **newer of the local default branch and its remote-tracking ref**,
decided by ancestry from refs git already has (no network, same offline rule
as staleness); diverged histories keep the local side. The chosen base is
**always printed with its sha and why** — a branch that silently starts ten
commits in the past is the expensive kind of surprise.

Two corollaries. The change's own declaration file (`changes/<slug>.md`) is
**carried across the switch**: the lifecycle wrote it, so it can never be the
thing that aborts the lifecycle. Anything else that would be overwritten is
refused by name with the exact command that unblocks it — never git's raw
stderr. And a branch that already exists is switched to and reported: `apply`
is re-runnable.

### The tool owns the frontmatter, so prose can be prose

A claim statement is a sentence, and sentences contain colons: `staleness:
block` typed into a value is valid prose and invalid YAML. Since the lifecycle
is the writer, **the writer does the quoting**: every save serializes through
one function that quotes what needs quoting and never folds a long statement
onto continuation lines, so a statement comes back exactly as written. When a
hand-edited file does break, the error is the teaching kind — the file line,
the offending source line, and the quoted rewrite to type — never the parser's
raw complaint about compact mappings.

### The tool already ran by hand, twice

On 2026-08-12 and 08-13, from a session opened **only** in the reference
brain, five foreign repos were changed: branch from `origin/main` in each,
edits, commits, six MRs with the landing order declared in every description,
and every repo returned to the branch it was found on. That is `multivac
change apply` + `land`, executed by fourteen agents in twenty minutes. Full
transcripts exist for both runs: it is a **behavioral** fixture, not just a
data fixture.

## The thesis

What makes the reference brain useful is not generated documentation — that's
commodity — but four things no generator infers from code:

- **Authority per claim**: published / specified / open. Every sentence
  carries where it comes from and how much it binds.
- **Tombstones**: a dead mechanism is declared dead where someone will look
  for it.
- **A single source, said out loud.** A wiki and a docs mirror were retired
  the same day, on purpose.
- **The ritual**: the closing ceremony a team writes for itself — who reviews,
  who is told, what ships before what. multivac executes its mechanical half
  and prints the rest (see *The ritual* above).

Hence the two hard limits of starting point 2:

| layer | derivable from code? |
| --- | --- |
| **Map** — what exists, what calls what, what contract it exposes | yes, and well |
| **Law** — what is non-negotiable and why | **no**. "A lawyer validated this sentence" lives in no AST |
| **Journal** — why a decision was reversed | **no**. It accumulates forward |

So starting point 2 is not "generate the base": it is **generate the map and
interview for the law**. The interview is not accessory — it is the product.

The interview is not an embedded model call: it is a **tool-shipped
protocol** — a **skill** multivac ships (see "The door") and the user's own
agent runs, in whatever harness they already use. Its output contract is fixed: proposed
law rows plus door and map sections. multivac **validates and files** that
output; it never calls a model itself.

And the journal is the asset, not the cost: it is the only one of the three
layers that cannot be regenerated. It is separated so it isn't always loaded,
not to archive it.

## Where it runs

**Home is the agent session, not CI.** The consumer of the output is an agent
about to write code, not a pipeline painting red for someone to look at
tomorrow. Design consequences, not presentation ones:

- **The message is the product, not the exit code.** Output says what is wrong
  *and what to do*. Exit codes remain for optional CI use.
- **Self-healing is the normal mode.** In a session the agent is already
  editing and reviews the diff on the spot; `moved` is not a special case.
- **Hard latency budget: under one second.** A hook that fires on every
  session start and takes five seconds gets uninstalled. Hence `git ls-files`
  + `ripgrep`, plus caching keyed by commit sha (in `.multivac/cache/`,
  gitignored).

And the point of application is **not the agent's goodwill**. If it only runs
when the agent remembers, the tool inherits exactly the failure mode it came
to fix: the dead mechanism survived eleven days because nothing ran on its
own. "It is discipline and nothing verifies it."

Decided 2026-08-13: the tool is **agent-agnostic** — any coding agent, no
privileged harness. That forbids putting enforcement in any one harness's
hook API. The universal choke point is not the harness: **it is git**. Every
agent — and the human — funnels through the commit.

The application ladder:

| layer | mechanism | coverage | strength |
| --- | --- | --- | --- |
| 0 | the door instructs: "run `multivac verify` before acting" | any agent that reads `AGENTS.md` | weak — obedience |
| 1 | **git hooks**: `pre-commit` and `pre-push` run `verify` (default policy: only blocking modes gate) | **universal** — everything that commits | strong |
| 2 | harness hooks (session start, post-edit) | per harness, **as data** in `targets.yml` | best UX: catches before the commit |
| 3 | CI | repos where humans commit | outer net |

Layers 1 and 2 catch **different failure modes**, which is why neither
replaces the other:

- **Harness hooks are the read side.** Session start catches a stale pin or a
  lying brain *before the agent conceives code on top of it*. Earliest
  possible intervention, best UX — a required layer from day 1; only its
  presence varies per harness.
- **Git hooks are the write side.** Commit time catches claims the edit broke,
  before they land. Later, but universal.

**The harness is the ceiling; git is the floor.** Where harness hooks exist,
95% gets caught early and the git hook rarely fires. Where they don't —
"any coding agent" includes harnesses with no hook API at all — the git hook
guarantees nothing false lands. Harness-only enforcement would quietly turn
"any agent" into "any agent with hooks".

Layer 2 ships as `targets.yml` data — whoever wants their harness contributes
an entry by MR, no core changes. Claude Code's is the first entry, since the
reference project already runs its hooks in production
(`.claude/settings.json`, `SessionStart` / `PostToolUse`).

**The no-git case is void by design, not ignored**: the whole model is
git-native — anchors evaluate via `git ls-files`, distribution is pin +
staleness, `change` is branch/MR. Without git you don't lose the hook, you
lose the product. So `multivac init` runs `git init` when missing, and `multivac
doctor` flags a gitless brain as degraded enforcement.

Implementation detail that matters: `.git/hooks/` is not versioned. `multivac
init` points `core.hooksPath` at a versioned directory —
`.multivac/hooks/` — so the hook travels with the clone and there is no
install step to forget.

But a repo multivac did not write often has gates of its own, and taking
`core.hooksPath` over them silently disarms the project's real enforcement
(measurement 2: saleor's pre-commit framework — ruff, mypy, semgrep —
stopped running and nothing said so). So `init` detects
`.git/hooks/<name>`, a foreign `core.hooksPath`, `.husky/`, `lefthook.yml`
and `.pre-commit-config.yaml` before touching anything, picks one of three
strategies, and prints which one it used. **Fresh**: nothing pre-exists —
shims in `.multivac/hooks/`, hooksPath ours. **Chained**: a `.git/hooks`
hook (or a manager that installs one) pre-exists — same shims, but each one
runs the repo's own hook first and preserves its exit code; the chain is
resolved at run time, so a manager that installs after init is chained too.
The chain arms in the other order as well — the fresh-clone shape, where
`.pre-commit-config.yaml` exists but `.git/hooks/pre-commit` does not (and
`pre-commit install` refuses to write it while `core.hooksPath` is set): the
shim falls back to `pre-commit run --hook-stage <stage>` directly, exit code
preserved; with no `pre-commit` binary it warns loudly and never blocks, and
`init` and `doctor` both name that state instead of claiming a chain that
cannot run.
**Alongside**: `core.hooksPath` already points elsewhere, or `.husky/` will
claim it on install — never repoint; the shim goes INTO that directory where
the hook name is free, and a taken name that does not run multivac is a
refusal carrying the exact line to add. `doctor` reports the coexistence
state either way.

A versioned hook still needs something to run. The shim resolves a runnable
multivac in a fixed order — `mvac` on PATH, then `npx --no-install multivac`
when the package sits in the repo's `node_modules`, then the repo-local build
`node <repo>/dist/cli.js` located from the hook's own path — so a
build-from-source clone enforces itself with no global install. When none of
the three exists the shim warns loudly on stderr and exits 0: a broken
install degrades enforcement, it never wedges a commit. Because "installed"
and "enforcing" are then two different states, `doctor` reports both — the
shims on disk, and whether anything can run them.

The sub-second latency budget, already in the design for session ergonomics,
becomes mandatory here: a slow `pre-commit` gets `--no-verify`'d once and
never comes back.

**The blind spot of a git-native model: the file nobody added.** Everything
here reads the tree through `git ls-files`, so a file that exists on disk and
was never `git add`ed does not exist for the tool — the repo builds on this
machine and fails on a fresh checkout, and no claim was ever false. `doctor`
closes it as a diagnosis, not a gate: it lists the untracked, non-ignored
files and names the ones that look build-critical — a config file at the repo
root (`tsconfig*`, `package*`, `*.config.*`, `.*rc`), a path a `package.json`
script names, or a path an anchor's include glob covers, that last one being
law about to evaluate against a file git cannot see. The line reads
`untracked — git add or ignore` and moves no exit code: deciding which of your
scratch files belongs in the repo is not the tool's call.

## The four jobs

1. **Change** — the ecosystem change, planned and executed from the brain.
   The verb the other three serve.
2. **Verify** — the claims against the code.
3. **Project** — the door toward each consumer, in each harness's format.
4. **Distribute** — how the brain reaches consumers, and how stale it gets.

The third appeared late, on discovering that the brain lives as a git
submodule inside the five reference repos: pinned, with three different SHAs,
up to 53 commits behind. It is the "ecosystem" part that neither OpenSpec nor
SpecKit touches.

## The model: the claim with an anchor

The unit is not the document. It is the claim:

    statement + authority + anchor + state + date

The serialized home is the law table in `.multivac/invariants.md`, one row per claim —
`| ID | statement | authority | state | date | source |` — the exact format
`init` writes with zero rows. `state` and `date` live in the row because
`verify` reads them: `proposed` rows never block, `retired` rows evaluate
only their authored tombstone legs. Anchors are not columns — they are the
comment lines under the row.

**The anchor is content-based, not line-based.** Lines move on the first
commit. An anchor says: "in that repo, in those files, something matches
this". Verifying is asking whether the matcher still hits. If the file moved,
it is re-located; if it disappeared, the claim becomes **suspect** — not
silently false.

Anchors live **inline in the markdown**, as HTML comments: invisible when
rendered, greppable, and with no parallel file to drift. The form is
explicit, one leg per line:

    <!-- @anchor <CLAIM-ID> <repo>:<glob> [![<repo>:]<glob> …] /<regex>/[flags] [mode] -->

- **The claim ID is in the comment, never inferred.** A follows-the-row
  proximity convention collapses for prose claims and survives no reformat;
  the explicit ID is the join key for reporting and for `change close`.
- **`repo` is the registry key from `.multivac/config.yml`** (`backend`),
  never the directory name (`acme-backend`). `*` covers every declared repo **plus
  the brain itself**.
- **The glob dialect is picomatch**, matched against repo-relative,
  `/`-separated paths as `git ls-files` prints them: `**` crosses directory
  boundaries, `{a,b}` alternates, and dotfiles match (`brain:**` sees
  `.multivac/config.yml`). It is not shell globbing and not a regex —
  `src/*.ts` does not see `src/lib/git.ts`; write `src/**/*.ts`. The parse
  errors that reject a glob say so.
- **`!<glob>` excludes**, applied after the include glob
  (`backend:** !db/tests/** /secret_key_/ absent`). The surviving file
  set is what gets matched — and what counts toward zero-file (vacuous)
  detection. Measured demand: "everywhere except X" needed fragile
  complementary-glob workarounds in 3+ of the reference 82.
- **An exclusion may name its repo: `!<repo>:<glob>`.** A bare exclusion is
  repo-relative, so under `*` it exempts that path in *every* repo — and
  there was no way to say "everywhere, except this one page in the brain",
  which is exactly the shape of an ecosystem-wide tombstone that must not
  flag the page carrying it:

      <!-- @anchor INV-77 *:**.md !brain:07-rules.md /PIN/ absent -->

  A `07-rules.md` in any other repo is still checked. The qualifier resolves
  by checkout, not by spelling: two keys naming one tree (`brain: .`) are one
  target, and either key names it. An exclusion naming an undeclared repo is
  refused when the anchor is parsed, with a message that names the key —
  a typo must not become a silent no-op. A qualifier in a single-repo leg is
  legal and redundant, and exclusions still count toward vacuity: a leg whose
  exclusions remove every candidate file is vacuous, not passing.
- **One canonical regex dialect: POSIX ERE** with `[[:space:]]`-style
  classes — what macOS `git grep` actually executes, the lowest common
  engine. Enforced at anchor-write time: `\s` and `\b` are **rejected with a
  translation hint** (`\s` → `[[:space:]]`,
  `\b` → `(^|[^[:alnum:]_])…([^[:alnum:]_]|$)`), never silently accepted —
  macOS git grep drops both silently, and four anchors in Measurement 1
  passed vacuously that way. ripgrep and the built-in fallback must
  implement the same accepted subset, so a passing anchor passes on every
  machine.
- **A claim may carry several anchor lines — legs. Legs AND together**: the
  claim holds only when every leg holds. On failure the claim inherits the
  **worst failing leg's severity**, and `verify` reports per-leg, never only
  per-claim.

The canonical example is INV-01 as it actually survived Measurement 1 —
four legs, not one (names invented; the real system's differ):

```markdown
| INV-01 | Nobody has UPDATE on `balances`, not even the service role. | published | active | 2026-08-02 | [03](03-backend.md) |
<!-- @anchor INV-01 backend:db/migrations/*.sql /revoke[[:space:]]+update[[:space:]]+on[[:space:]]+[^[:space:]]*balances/i -->
<!-- @anchor INV-01 backend:db/migrations/*.sql /grant[[:space:]]+update[[:space:]]+on[[:space:]]+[^[:space:]]*balances/i absent -->
<!-- @anchor INV-01 backend:db/migrations/*.sql /update[[:space:]]+balances/i count=1 -->
<!-- @anchor INV-01 backend:db/migrations/*.sql /on[[:space:]]+conflict[^;]*balance/i absent -->
```

The `revoke` proves the rule was enacted; the `absent` grant is the
tombstone; the `count=1` ratchet pins the one sanctioned `update balances`
in append-only history; the last leg kills the upsert bypass.

No database, no proprietary format. If the tool disappears, the brain still
works.

### Five modes, one mechanism

| mode | requires | what it's for |
| --- | --- | --- |
| `present` (default) | at least one match | the rule is implemented |
| `absent` | no match | **the tombstone** |
| `unique` | exactly one | single source of a value |
| `count=N` | exactly N | **the ratchet** |
| `each` / `each!` | every matched file contains a match / none | **the universal** |

`count=N` legs are also what `verify` calls **derived numbers**: a number
the brain states and the code must still yield — INV-01's `count=1` above.

`each` is the universal quantifier Measurement 2 proved missing: `count=N`
is a deletion ratchet — it counts across all files together, so it catches
removal, never omission-on-addition, and a `privileged: true` rogue
container injected into a default k8s manifest left fifteen anchors green at
exit 0. `each` quantifies **per file**: every file the glob matches (after
exclusions) must contain a match — `each!`, must contain none — a glob
matching zero files is a blocking failure (a universal over nothing proves
nothing), and the failing files are named in the report, first few + count.
Of Measurement 2's seven unanchorable claims the four universal-shaped ones
now anchor; the three **cross-file relation** claims (vendored proto == root
proto, engines floor == CI matrix, image name == skaffold artifact) still do
not, on purpose — a relation between two files' values is a different
primitive, not a quantifier, and a claim that needs it stays honestly
unanchored.

Two matching rules are normative, measured not theorized (Measurement 1,
defects 1–2):

- **Statement-normalized matching for SQL and config surfaces.** Real DDL
  splits one grant across lines; every single-line `absent` tombstone over
  SQL DDL had a demonstrated in-repo escape. On `.sql` and config files the
  matcher normalizes per statement — whitespace runs, newlines included,
  collapse to one space — before the regex runs. The statement boundary is a
  semicolon *outside* every literal, dollar-quoted body and comment: `''`
  keeps a literal open, a `$$`/`$tag$` body is closed only by its own tag,
  and a comment's semicolons and quotes are inert — otherwise a function
  body would be chopped into halves no tombstone was written against.
  Line-based `absent` over DDL is unsound and multivac does not offer it.
- **Append-only history takes the latest definition or the ratchet.**
  `present` over `migrations/*.sql` proves "was built this way", never
  "still is"; `unique` and `count` conflate history with HEAD. Over an
  append-only surface a leg either targets the **latest definition** of the
  object it names, or uses **`count=N` as the ratchet** — the documented
  idiom for "never again" claims: the count pins today's total and any new
  occurrence breaks it.

The result that justifies the design: **the dead-terms dictionary disappears**.
A dead term is an anchor in `absent` mode on the retired claim's row, and it
can cross repos:

```markdown
<!-- @anchor INV-83 *:AGENTS.md /(^|[^[:alnum:]_])VOUCHER([^[:alnum:]_]|$)/ absent -->
```

The dead-terms guard, the count ratchet, and the invariant anchor are the same
primitive in different modes. One mechanism instead of three.

### Asymmetric severity

Modes differ not only in how they match but in **what their failure means**:

| mode | false positive | on failure |
| --- | --- | --- |
| `absent` | near impossible | **blocks** |
| `count` | low | **blocks** |
| `each` / `each!` | low — a named file either satisfies the predicate or not | **blocks** |
| `present` | **high** — the rule is true, the code moved | reports and self-heals |
| `unique` | medium | reports |

**The tombstone blocks; the presence check informs.** Without this, every
refactor turns the check red and someone disables the tool in week three.
Lint-family tools die of noise, not of bugs.

This table is the **default** of the `blocking:` key. Config may extend it;
loosening below `[absent]` — unblocking the tombstone — is refused.

### Each context verifies what it is responsible for (MV-53)

An anchor names a repo. It does not name *which bytes of it* — and for the
first weeks the answer was always "the working tree", from everywhere. That
is wrong in one direction and right in the other, and the wrong half cost the
enforcement floor: a teammate left a sibling repo parked on a WIP branch, the
brain's law went red for a reason that had nothing to do with truth, and an
agent — reasoning correctly that the tool was crying wolf — committed with
`--no-verify`. A gate that is wrong is worse than a gate that is absent,
because it teaches people to route around it.

> **The brain verifies the ecosystem as published; a consumer verifies what
> it is about to commit.**

| run | reads | why |
| --- | --- | --- |
| brain-scoped, per declared repo | that repo's **channel ref** (`channel:`, else the global, else `origin/main`), via `git ls-tree` + one `git cat-file --batch` | the brain's law is a statement about the state everyone shares. Someone mid-task elsewhere is not a violation |
| brain-scoped, the **brain's own repo** | its **working tree** | the brain is where the author is working; its law must gate its own commit |
| consumer-scoped (cwd is a code repo with the brain mounted) | its **working tree** | that is the content about to be committed there |

Three properties keep it from becoming a second kind of lie:

- **Both runs state what they read.** One `read` line per repo, naming the
  ref or the branch and its short sha, on every run. This is the load-bearing
  half: the old behaviour was defensible, being silent about it was not. An
  operator must never wonder which bytes produced a verdict.
- **An unresolvable channel ref falls back to the working tree and says so**
  on that repo's line — no remote, never fetched, offline. Degrading is fine;
  degrading silently is the defect.
- **`--worktree` forces the old whole-ecosystem working-tree read**, for
  someone who genuinely wants to know the local state across repos.
- **"As published" carries its age.** A channel ref is a *local*
  remote-tracking snapshot and `verify` never touches the network, so the
  `read` line says when that ref was last fetched. Without it the second lie
  simply moves: a fix already on `main` reads as a red, and the operator
  concludes the gate is broken again. `repos sync` fetches every present repo
  — that is the command every staleness line names, and the only thing that
  makes "as published" true.
- **The brain says when it is behind its own channel.** It is the one repo read
  as a working tree, so it is the one repo the channel read cannot keep honest:
  an out-of-date law table judging a current ecosystem looks exactly like a red
  ecosystem. *Behind*, never merely *different* — a feature branch is off its
  channel by construction, and a line that fires every run stops being read.

The sibling defect, same root: a repo parked off its channel used to be an
invisible premise. Now `verify` names it on the `read` line and `doctor`
carries a `branches` line — the branch each repo sits on and whether that is
its channel — which is the diagnostic that would have explained the red
instantly.

Cost stays inside the budget: a ref-scoped scan is one `ls-tree` plus one
`cat-file --batch` per repo — one process, not one `git show` per file.

### Self-healing, states, exit codes

When a `present` fails in its declared glob, search the whole repo before
reporting. Four states, not two:

- **ok** — every leg holds.
- **moved** — a `present` leg with **exactly one** match outside its glob:
  the glob is rewritten in place. Zero or many out-of-glob matches is not a
  move — it is `broken`, with the candidates listed.
- **broken** — the leg's requirement fails in place.
- **vacuous** — the glob, after `!` exclusions, matches **zero tracked
  files**. For `absent`/`count`/`each` this is a **failure**, blocking: a
  directory rename silently greens every tombstone otherwise (verified live
  in Measurement 1), and a universal quantified over nothing proves nothing.
  For `present`/`unique` it reports as broken.
  Zero tracked files, but an **untracked** file on disk the same globs match,
  is a different sentence: `file exists but is untracked — git add <path>`.
  The glob is right; git cannot see the file. Self-heal stands down there.
- **pending** — the claim is listed by an **open** `changes/<slug>.md`: it was
  declared before its code exists, which is the lifecycle's flow, not a
  regression. Failing legs print the owning change, never gate (in any mode,
  strict included), and self-heal never chases them. A closed or archived
  change confers nothing, and `change close` still demands a genuine `ok`.

A law row may also be marked `drift` in its state column: a **real,
not-yet-fixable finding on the record**. Its legs evaluate and report — the
summary names the drifting ids — but never gate, in any mode, strict
included. Recording a true finding must not make the repo un-committable
through the pre-commit hook (measurement 2, finding 12); the way out is
fixing the code or retiring the row, never silence.

One exit matrix, no second answer:

| result | default | `--strict` |
| --- | --- | --- |
| broken or vacuous leg in a blocking mode (`absent`, `count`, `each`) | **exit 1** | exit 1 |
| broken `present` / `unique` | reported, exit 0 | exit 1 |
| moved (self-healed) | exit 0 | exit 0 |
| pending (claim of an open change) | exit 0 | exit 0 |
| leg of a `drift` law row (recorded finding) | exit 0 | exit 0 |

Who invokes what: git hooks (`pre-commit`, `pre-push`) and harness hooks run
the **default** policy — only blocking modes gate, so a mid-refactor commit
never dies on a moved presence check. CI runs `--strict`.

```
$ npx multivac verify
82 claims · 48 anchored (59%)

  ok        44
  moved      3   anchor rewritten in place, review the diff
  broken     1   INV-15 [present] · `on delete set null` not found in backend
                 reported, non-blocking · --strict exits 1

  0 blocking broken · exit 0
```

`moved` rewrites the anchor and **exits 0**. The diff lands in the same PR as
the refactor. A tool that fixes instead of accusing is what buys adoption.

Writing: rewrite locally, propose in CI (`--check` never writes). The
`prettier` pattern; nobody argues with it.

### Coverage, not completeness

Not every claim is anchorable. A formula anchors to a function body; a
meta-rule — "a published rule that stops being true forces a site change" —
anchors to nothing.

**A claim without an anchor is legal, and it is counted.** You start at 0% and
the tool is already useful. Coverage rises on its own when the team cares, and
it never pretends to have verified what nobody anchored.

### Anchor to contracts, not implementations

> **An ecosystem's boundaries are simultaneously the cheapest thing to read
> and the most stable thing to anchor to.**

Migrations, API schemas, event names, config keys, route tables, GRANTs. That
is what the seeder reads to draw the map **and** what moves least under an
anchor. Not two design decisions — one. It is the thesis that unifies the
product.

An anchor to a migration filename is practically immortal; an anchor to a
widget body breaks on Tuesday.

## Invariant lifecycle

Three birth paths, one table:

- **Seeded** — `seed` proposes candidates from boundaries (a `revoke update`
  in a migration *suggests* "nobody writes balances"). Born `proposed`: not
  law until a human validates.
- **Interviewed** — the from-scratch path.
- **Organic** — the main path at steady state: a decision made inside a
  `change` is declared an invariant at close. The reference ecosystem's 82
  were born this way — extracted from decisions already taken.

**The agent proposes; the human enacts.** The authority label demands it:
"published" means someone with authority answered for it — an LLM cannot
enact that alone.

States: `proposed → active → amended → retired`.

- **Amend**: never relaxed in code — changed in the law first, same change,
  dated. `multivac change` declares "amends INV-xx"; `close` checks law and code
  ended up consistent.
- **Retire**: the row is not deleted — it is marked `retired`, keeps its ID,
  and its existing legs stop being evaluated. The tombstone is **authored,
  not derived**: retiring writes new `absent` legs on that row for the dead
  mechanism's identifiers. Flipping an existing leg would be wrong in the
  general case — inverting INV-01's present leg would demand the `revoke`
  itself disappear. Same primitive, new legs.
- **IDs are stable, never renumbered, never reused.** History (who, when,
  why) is git — not duplicated in metadata.

## The ecosystem registry

**The brain is the registry**, and it splits **the user's content from
multivac's artifacts**. Everything the tool creates and manages lives under
`.multivac/`: `config.yml` (the registry below; supersedes the root
`multivac.yml` of earlier drafts), `invariants.md` (the law), `changes/`
(the open changes plus their `archive/`), `hooks/` (the `core.hooksPath`
target) and `cache/` (gitignored). The one exception is **`AGENTS.md` at the
repo root**, because that is where harnesses read it. Everything else at the
root belongs to the user and is never touched. Consumer repos get the same
shape: door at the root, everything else under `.multivac/`.

    <brain>/
      AGENTS.md                  the one exception
      <the user's own content>   untouched, wherever they keep it
      .multivac/
        config.yml
        invariants.md
        changes/  (+ archive/)
        hooks/
        cache/

The line is not "content vs machinery" — that split scattered the tool's own
files through the user's repo and made every path a judgement call. It is
**whose file is this**: multivac's artifacts are multivac's to move, and they
all live in one directory the user can ignore.

A brain written before the move keeps the law and `changes/` at the root.
`multivac init` migrates it: it prints every path it is about to move before
it moves any of them, uses `git mv` where the file is tracked so history
follows, and never moves onto a path that already exists. `doctor` names that
command and moves nothing itself; every other command refuses to read a
half-moved brain — reading it as-is would find zero claims and pass.

**The migration never touches a file multivac did not write.** `invariants.md`
and `changes/` are ordinary names and plenty of repos keep their own, so the
name proves nothing and only two things together do: the directory is already
a brain (`.multivac/config.yml` — it predates the move, so every brain has
one) **and** the content reads as multivac's own — the law table's six-column
header, or a `changes/` holding at least one parseable change file. An
ordinary repo that happens to have either is left completely alone, silently:
`init` scaffolds `.multivac/` beside their files and says nothing about them.

That also settles the steady state. A brain whose author keeps their own
`invariants.md` at the root next to `.multivac/invariants.md` is not an error
and never reports as one. Only two files that **both** read as multivac's law
are ambiguous, and that error names the one multivac uses and the one it
ignores, with the merge-or-rename fix. Ambiguity moves nothing at all: half a
migration is worse than none.

```yaml
# .multivac/config.yml
channel: origin/main           # staleness reference; per-repo override below
repos:
  backend:
    path: ../acme-backend
    url:  git@example.com:acme/backend.git
    grapher: graphify          # optional, inherits the global
    channel: origin/main       # optional, inherits the global
  payments:
    url:  git@...              # no path: not cloned — unevaluated, not red
```

`path` for the local layout, `url` for cloning where missing. The object
form is canonical; a bare string value is shorthand for `{ path: … }`.

**brain==code, the single-repo shape.** A repo entry whose `path` resolves to
the brain root IS the brain — the shape of every small project. `brain` is
the reserved key for it, and the blessed idiom is one line:

```yaml
# brain==code: this repo is both the brain and the code it governs.
repos:
  brain: .
```

Detection is by resolved path, not by key: any key pointing at `.` is the
brain. It carries the **brain door**, never a consumer door (there is no
mount to point at); `doctor` reports it as `brain==code (this repo)` and runs
no mount, pin or staleness check against it; `verify` reaches it through the
implicit `brain` handle, so `*` legs scan that directory once, not once per
key; `change` accepts `brain` as a repo key in the change file — declared in
the config or not — and branches in place. `init` writes the idiom above when
the repo it initializes already has tracked source, and the commented example
when it does not.

`brain` and `*` stay reserved: `*` is every repo in an anchor leg, and a
`brain` key pointing anywhere other than the brain root is refused (it would
let consumer-scoped verify evaluate the brain's law against a consumer
checkout). Reserved means *it works*, not merely *it errors*.

**Cloning: implicit paths never, explicit operations yes.** The "multivac never
installs anything" rule is about *tools* (graphify, speckit — foreign
software). Declared repos are the tool's own data: cloning them is in scope.
The line is implicit vs explicit:

| context | clones? | why |
| --- | --- | --- |
| `verify` / hooks | **never** | sub-second budget, may be offline; a hook that hits the network gets uninstalled. Degrades: unevaluated, not red |
| `change plan/apply` on a declared, absent repo | **yes, automatic** | the user explicitly asked for an operation that needs the repo — same contract as `git submodule update` |
| `repos sync` | all missing — **and fetches every present one** | the explicit machine-setup command (`--shallow` for verify-only machines; `change` needs full clones to branch). Since MV-53 the brain judges each sibling at a *local* remote-tracking ref, so this is the one command that makes "as published" true; a clone that fails gates, a fetch that fails only reports |
| `doctor` | no — reports and points at `repos sync` | diagnosis doesn't mutate |
| `doors` | no — absent repos skipped, reported | writes the **working trees** of declared repos, never commits on its own |

Steady-state consumer-door updates ride the change that changed the
canonical door: `change apply` carries the re-projection into each
consumer's branch, so door updates land with declared order like any other
edit.

`doors` also installs the enforcement floor where it projects: in each
consumer repo it writes the versioned hooks directory
(`.multivac/hooks/`, the same content/machinery split as the brain) and
points `core.hooksPath` at it — the same git-hook shim as the brain's, running
`verify` scoped to **that repo's anchors**. Layer 1's "everything that
commits" includes the code repos, not just the brain, precisely because the
breaking commits happen there.

Auth failures error clearly, no silent retry. Cloning is additive and
reversible; it never touches the remote.

The reverse direction is distribution: every code repo mounts the brain
(pin + staleness check). The mount folder name is configurable; `.brain/` is
the default — the reference ecosystem keeps its pre-existing mount name.
Brain lists repos; repos point at the brain. One brain = one ecosystem.

**Empty repos.** An empty brain: `init` runs `git init` if needed, writes
the content files and the machinery; session zero fills it (see "Session
zero"). An empty *code* repo (greenfield): it is
declared in `.multivac/config.yml` **before existing**; `verify` treats it like an
uncloned repo (counted, not red); `multivac change apply` creates it — `git init`,
first commit, consumer door with the brain mounted — so the first agent
session in it already knows the law.

**No template gallery.** `init`'s content scaffolding is two root files and
nothing else (exact side-effect list in the CLI section); the
brain takes whatever shape the project needs. The reference brain's
numbered-pages form is form, not mechanism. A `--template` may exist later,
as data.

**No native graph, ever.** The grapher is a declared adapter, per repo or
global — and a *verified* one: the registry states each tool's artifact and
refresh, and refuses to derive either from a name. That derivation existed,
and a survey of ~47 graph tools found it described exactly one of them. An
unverified name is reported as unverified with the fields to declare, and
`graphers:` in the project config carries them, so an unknown tool needs no
merge request here. Present artifact → the consumer door points at it ("orient with the
graph before reading raw" — the reference ecosystem's hook, generalized).
Present binary → the `run` capability refreshes it. A newborn brain is two
content files; a graph of that is noise — `doctor` suggests a grapher past
a size threshold.

## Distribution

The pinned submodule gives reproducible builds and stale docs. Always-latest
gives freshness and irreproducible builds. The tool doesn't choose:

> **Pin + staleness check.** The pin stays, and `verify` checks it against
> the declared channel (`channel:` in `.multivac/config.yml`, global or per repo):
> a stale pin reports by default, and gates (exit 1) under `staleness: block`
> — flipping the default is an open owner decision. Reproducible *and* fresh,
> with the debt visible instead of silent. `strict_pre_push: true` installs
> the pre-push shim as `verify --strict`.

Offline by construction: staleness compares the pin against the **locally
known remote-tracking ref** — best-effort, no network — and the report
carries the last-fetch age ("pin 35 behind origin/main; last fetch 6 days
ago"). Fetching happens only in explicit operations (`repos sync`,
`change plan/apply`), never in `verify` or hooks.

## The door

There are **two kinds of door**, and they are not the same file renamed:

- **Brain door** — how to work on the ecosystem from here: where every repo
  lives, the law, the ritual (`.multivac/ritual.md`), the landing order.
- **Consumer door** — what is law in this repo, where the brain lives, and
  that **the change may cross repos**: an agent standing in one surface must
  know the feature may span others, and where to find out which.

`multivac doors` generates both. Both project under the same rule:

One canonical door, `AGENTS.md`, projected to the rest:

- **Symlink** when the format is identical (`CLAUDE.md`).
- **Three-line stub** when it isn't: Cursor wants `.cursor/rules/*.mdc` **with
  frontmatter**, Copilot wants `.github/copilot-instructions.md`. A symlink
  can't add frontmatter.
- `--no-symlink` for Windows, which needs developer mode.

Still a single source; only the projection varies.

### Door, hooks, skill — three artifact classes

What multivac installs into a repo comes in three classes, split by when
the agent reads them:

| class | loaded | carries |
| --- | --- | --- |
| **door** | always — first read of the session | pointers + law: where the brain is, what binds, run `verify` |
| **hooks** | never read — they fire | enforcement: `pre-commit` / `pre-push`, harness hooks |
| **skill** | on demand | the operating manual |

The skill carries everything procedural the door must not: how to write an
anchor, the change lifecycle, the retire/tombstone procedure, the `seed`
validation flow — and the **interview protocol**. The door stays ~60 lines
precisely because the manual moved out of it, loaded only when the agent is
about to operate multivac. The interview shipping as a skill run by the
user's own agent is the same no-embedded-LLM rule as everywhere else, now
with a uniform shape.

Skills live in the tool-shipped targets registry alongside doors and hooks;
`doors` installs and updates them, under the managed-block rule where the
target format allows.

### The managed block

`init` and `doors` never clobber an existing door. Everything multivac
writes into a pre-existing file lives between two markers:

    <!-- multivac:begin -->
    …generated content…
    <!-- multivac:end -->

The rest of the file is the user's. Regeneration replaces only the block; a
missing file is created whole, with the block. The motivating case is the
common one: consumer repos arrive with rich hand-written `AGENTS.md` files,
and a tool that overwrites them loses the adoption argument in the first
minute. The rule covers every file multivac writes into — doors, and skills
where the target format allows.

On the name `doors`: a metaphor coined in this session, not an established
term. It explains in one sentence — "the door is the file your agent reads
first" — and isn't taken. The boring correct alternative is `entrypoints`.
Rejected: `rules` (collides with the invariants, which literally are the
rules) and `project` (collides with "project").

## Session zero

After `init` the brain is empty on purpose. The door's managed block says
so — this brain is empty; load the multivac skill to fill it — and the
skill branches on the one question that matters:

- **Existing ecosystem** → the deterministic `seed` inventories where the
  architecture lives and ends with the open questions no cold reader can
  answer (debt or intent, law or taste, which authority wins); the
  interview puts them to a maintainer; the agent drafts the map and the
  `proposed` law rows; the human validates and enacts in blast-radius
  batches (accept / correct / discard); `doors` projects the result into
  every consumer repo. Flow: seed → questions → interview → law.
- **From scratch** → the interview protocol draws the law out of the
  person's head; the first `change` creates the repos — greenfield `apply`,
  first commit, consumer door already mounted.

Both paths converge on the same steady state: an anchored law, doors in
every repo, every subsequent decision entering as a `change`.

## CLI

```
multivac init .   --agent claude,cursor --sdd opsx --grapher graphify
multivac verify   # anchors + tombstones + derived numbers. No LLM, no network, deterministic
multivac count    # dry-run one anchor leg: match count + per-file breakdown, verify's own matcher
multivac help     # help anchor — the grammar on one screen; help <command> — usage
multivac seed     # reads boundaries, proposes law rows + map stubs (LLM-optional)
multivac anchor   # optional helper that proposes anchors (LLM-optional)
multivac doors    # projects AGENTS.md to the declared targets
multivac doctor   # what is declared, what was found, what is degraded, how to fix it
multivac repos    # sync — clone declared-but-missing repos (--shallow for verify-only machines)
multivac change   # new / plan / apply / land / close — the ecosystem change
```

`seed` reads where the ecosystem's architecture lives — policy gates
(semgrep, pre-commit, eslint/biome/ruff, CODEOWNERS: the project's law
already in machine form), the workspace/build graph, deploy manifests,
decisions/intent (ADRs, AGENTS.md — prior art, named as such), models,
migrations, schemas, runtime config, route tables — and writes the
categorized inventory to `.multivac/seed-report.md`, fixtures and vendored
noise excluded, every category capped. The report ends with the three open
questions no cold reader can answer — debt or intent, law or taste, which
authority wins — instantiated against what it found; the interview puts
them to a maintainer, and only then does the agent draft **`proposed` rows
in the law table**. Nothing seed writes is law until validated. The
validation flow is **accept / correct / discard**, in batches ordered by
blast radius (see Risks); whatever stays unvalidated remains marked
`proposed`, never blocking.

The LLM boundary, exhaustively: **LLM-optional** — `anchor` (proposes
anchors), `seed` (proposes rows), and the interview. **Guaranteed
deterministic, never a model call** — `verify`, `doors`, `doctor`, `repos`,
and the mechanics of `change` plan/apply/land/close. The tool works end to
end with no API key; the LLM-optional three only draft what a human then
enacts.

**The default is not `claude`.** If `AGENTS.md` is canonical and the rest are
projections, the default is **no projection**: `AGENTS.md` alone, already read
by Codex, opencode, Cursor, and Claude Code. `--agent claude` is what **adds**
the symlink. In an OSS project, a vendor-named default brands you as that
vendor's tool on day one.

`--sdd` and `--grapher` are off unless explicitly requested.

**Detect before asking.** `multivac init .` looks for `openspec/`, `.specify/`,
`graphify-out/`, `.cursor/`, `CLAUDE.md`, and proposes; flags override. Flags
still matter in non-interactive use.

**`init` configures; it doesn't perform.** Flags are configuration
seeds landing in `.multivac/config.yml`, not one-shot magic. Adopting Cursor in three months is one line in the
file plus `multivac doors` — not "re-run init", which nobody does.

```yaml
# .multivac/config.yml
doors:   [agents, claude]
sdd:     opsx
grapher: graphify
authorities: [published, specified, open, technical]   # the project's, not mine
blocking:    [absent, count, each]
repos:
  backend: ../acme-backend    # bare string = shorthand for { path: … }
```

`init`'s side effects, enumerated once and completely:

1. Writes **`AGENTS.md` at the root** — the door, and the only file multivac
   writes there; its managed block states the brain is empty and points at
   the skill (see "Session zero"). An existing `AGENTS.md` is never clobbered
   — only the managed block is written.
2. Writes **everything else under `.multivac/`**: `config.yml` (where the
   flags land), `invariants.md` (the law table with its format and zero
   rows), `ritual.md` (empty but for one comment saying what belongs there),
   `changes/` with a `.gitkeep` so the directory the lifecycle writes into
   survives the first clone, `hooks/`, and a gitignored `cache/`. A brain
   still holding **its own** `invariants.md` or `changes/` at the root is
   **migrated** here first — every path announced, `git mv` where it can, no
   move onto an existing path. Files that only share those names are never
   touched; two copies that both read as multivac's law are refused.
3. Runs **`git init`** when the directory is not already a git repo (the
   model is git-native; see "Where it runs"), then runs **`git check-ignore`
   on every path it is about to write**. A repo-level ignore that would
   swallow one (saleor's `.gitignore` opens with `.*`) gets explicit
   negations appended under a marker comment — idempotently, printed line by
   line, re-checked — because a brain git cannot see commits nothing while
   every command stays green. `doctor` reports a still-ignored brain path as
   a WARNING with the fix.
4. Points **`core.hooksPath`** at `.multivac/hooks/` and writes the
   `pre-commit` / `pre-push` scripts there, so the hooks travel with the
   clone and there is no install step to forget — unless the repo already
   has a hook set-up, in which case init chains it or installs alongside,
   and never repoints (see "Enforcement").

"One root file and not one more" is the whole scaffolding budget: no template
gallery, no empty sections, no per-agent folders. What lands under
`.multivac/` is not scaffolding — it is the enforcement floor. Empty
scaffolding is the noise that keeps a brain from being read.

Authority levels are **configurable**: published/specified/open comes from a
world where the published promise rules. A fintech wants
regulatory/contractual/internal; a library wants public-API/internal/
experimental. Small decision now, painful redesign later. To the tool an
authority is **surfaced metadata plus procedural review**: printed with
every claim in reports, and gating who may enact (the agent proposes, the
human enacts) — `verify` never interprets the labels mechanically.

## Dependencies

**`multivac` never installs anything, and no absent adapter turns `verify` red.**
If the core depended on graphify or speckit, it wouldn't run anywhere clean —
and the session hook must run everywhere.

| state | behavior |
| --- | --- |
| declared and present | adapter active |
| declared and absent | notice, feature off, **exit 0** |
| not declared | nothing, not even a notice |

### Artifact ≠ binary

Almost no adapter needs the executable; it needs what the executable left on
disk.

| adapter | what `multivac` reads | binary needed? |
| --- | --- | --- |
| openspec | `openspec/specs/`, `openspec/changes/` | no |
| speckit | `.specify/` | no |
| graphify | `graphify-out/graph.json` | no |
| codegraph | its on-disk index | no |

If you cloned the repo, the adapter works even with the tool not installed.
The binary is only needed to **invoke** (`graphify update`, `openspec
archive`). Each adapter declares two separate capabilities, `read` and `run`,
and only the missing half turns off.

`multivac init . --sdd speckit` with speckit absent writes the config anyway and
says how to install it: declaring means "this project uses speckit", true even
if this machine doesn't have it yet.

Adapters state which format they expect and **warn** on mismatch instead of
crashing (the pattern graphify itself uses: "skill is from 0.9.21, package is
0.9.29" — and keeps working).

### One registry, tool-shipped

`targets.yml` is **adapter data shipped inside the multivac package**, not a
project file: the harness door targets (`{ path, format, frontmatter? }`),
the skills, and the sdd/grapher adapters live in the same registry. Extending it is an
MR to multivac itself — adding Codex, or a new SDD tool, is an entry, not a
module. `.multivac/config.yml` never defines adapters; it only **selects**
them by
name (`doors: [agents, claude]`, `sdd: opsx`, `grapher: graphify`).

### Automation by default (owner decision, 2026-08-13)

Three normative rules, applying to the brain and to every declared repo:

- **SDD runs inside the change lifecycle, in the SDD's own shape.** When an
  adapter is declared, the lifecycle drives **that tool's flow** — not a fixed
  propose/apply/archive triple, which was OpenSpec's shape imposed on every
  other tool. The registry carries, per tool, an **ordered `steps` array of
  arbitrary length**, each step bound to a lifecycle point
  (`new`/`plan`/`apply`/`land`/`close`) rather than to a step name, plus
  **`projectSteps`** for a project-level document — spec-kit's constitution,
  written once and amended as the product moves; OpenSpec has none and the
  registry says so. Opt-out is explicit — `sdd_auto: false` in
  `.multivac/config.yml`, or `--no-sdd` on a single change. A
  declared-but-absent binary degrades as usual: notice, feature off, exit 0.
- **The steps are gated on what the tool really produces** (owner decision,
  2026-08-15). Printing an instruction nobody checks is the
  discipline-that-nothing-verifies this tool exists to end, so every step
  declares the **artifact that proves it ran** — `<slug>` interpolated, one
  `*` segment allowed for tools that number their own feature directory.
  `change plan` refuses without the propose-equivalent, `change apply` without
  the plan/tasks artifact, `change close` without the archive-equivalent, each
  refusal naming the exact agent command, the path it looked for and the repos
  it looked in — the brain and every declared repo present on disk, since a
  change's specs often live in the code repo — while a pass names the repo the
  artifact was found in. Three
  rules keep it honest: a step whose tool leaves nothing behind
  (`/speckit.analyze` writes zero bytes by design; a clean `/speckit.converge`
  is forbidden to touch `tasks.md`) is declared **ungateable** with its reason
  and is never gated, and a lifecycle point no step can prove **says so**
  instead of passing quietly; where a tool ships its own validator its
  **verdict is reused** (`openspec validate --json`), never reimplemented —
  the lifecycle shells out for validation only, never to fake an agent-run
  step; and the project-level document is **reported, never gated** — `doctor`
  calls it missing, present, or STALE against the law's newest row, because a
  constitution's content cannot be machine-judged, and BOTH doors carry the
  instruction to write it — `init`'s scaffolded door as well as the brain door
  `doors` renders, since `doors` is a second command and a constitution the
  agent hears about only on the second command is one nobody writes.
  `sdd_auto: false` and
  `--no-sdd` turn every gate off: that is exploration mode.
- **The graph refresh follows the agent, not the commit.** The grapher is a
  navigation aid, not enforcement: nothing lands wrong because the graph is
  stale, so the refresh belongs where the edits are. When a grapher is
  declared and its binary present, `doors` installs it as the **harness's
  post-edit hook** — for a harness that has one — fire-and-forget, coalesced
  behind a lock, never failing an edit and never adding latency to it.
  `change close` runs the same refresh as the **safety net**, for edits made
  outside a harness. **Git hooks never refresh**: the shims run `verify` only,
  because an ergonomic convenience does not belong on a gate. Nothing is ever
  staged or committed, and a stale graph next to a present binary is a
  `doctor` warning, never silence.

`multivac doctor` answers "what is declared, what was found, what is degraded, how
do I fix it":

```
$ multivac doctor
doors      AGENTS.md (canonical) · CLAUDE.md (symlink) · .cursor/rules/multivac.mdc (stub)
sdd        opsx        artifact ok (12 specs) · binary ok
grapher    graphify    artifact ok · binary missing  → uv tool install graphifyy
repos      4/5 present · payments not cloned (22 anchors unevaluated)
```

## Stack

**TypeScript on Node, published to npm, `npx multivac verify`.** Two reasons:
`npx` is the only zero-friction format for the first ten minutes, and the
contributor pool for this niche of dev-tool is overwhelmingly TS. Go would
give a static binary and instant startup, but trades `npx` for "download the
release", and startup is not the bottleneck of a tool whose heavy work is
reading files.

For large ecosystems the answer is not the language but **never walking the
tree**: `git ls-files` per repo — respects `.gitignore`, returns instantly —
and `ripgrep` when on PATH, with a built-in fallback.

**English** for code, CLI, docs, and messages. But the brain's content is in
whatever language the team writes: nothing in the parser may assume English
headings.

**Degradation when a repo is missing**: nobody has all eight services cloned.
`3 repos not available · 22 anchors unevaluated`, exit 0. Unevaluated is not
red.

## Scope

Owner's decision, 2026-08-13: **the full project from day 1**, not a drip of
versions. With multi-agent construction, traditional scoping doesn't apply —
six MRs across six repos in one afternoon with fourteen agents — so the
question is not "how much" but **what depends on what**.

Two axes that "full-fledged" conflates:

| axis | day 1 | why |
| --- | --- | --- |
| **Capability** — the whole loop: `init`, `seed`, `verify`, `anchor`, `doors`, `doctor`, hooks, **`change`** | **yes** | fixture and requirements exist; `change` ran by hand twice on 08-12/13 |
| **Compatibility** — 5 agents × 2 SDD × 2 graphers | **two adapters** | nine integrations on day 1 are nine to maintain on day 2, against APIs that change on their own |

And three things **don't accelerate with more agents**, because they are
measurements, not work. Building against the wrong assumption here changes the
design, not just the calendar:

1. What fraction of real rules turns out anchorable → anchor the reference
   ecosystem's 82.
2. How long validating a foreign ecosystem takes → time one.
3. Whether the seeder works on ecosystems the author didn't write.

They interleave: anchor the 82 while building `verify`, time a foreign
ecosystem while building `seed`.

### Out of day 1, on purpose

- The seven remaining adapters. They enter as **data** (`targets.yml`), not
  code, so adding them later redesigns nothing.
- UI, server, "platform".

(This list used to include "writing to other repos" and multi-repo
orchestration. Removed 08-13: brain-driven development is the ulterior
purpose, so `multivac change` — which writes to N repos with declared landing
order — is the center, not a later phase.)

## Risks

- **n=1.** Exactly one validated example, written by the author.
  The reference brain is unusual: literary non-English prose, five repos, one
  decision-maker, OpenSpec already adopted, a pre-existing documentation
  culture. Almost nobody arrives with that. The tool encodes the
  **mechanism**, never the **form**.
- **Volume.** A ~5,400-line brain is already at the edge of loadable. Pointed
  at 40 services, a naive generator spits 100,000 lines of nothing. Context
  budget as a design constraint: the door ~60 lines, the law ~150, everything
  else on demand. **Only the map scales with the ecosystem.**
- **Noise.** See asymmetric severity.
- **Adapter surface.** 5 agents × 2 SDD × 2 graphers + hooks is nine
  integrations on day one and nine to maintain on day two. OSS projects die
  of surface. Adapters **as data, not code**: a `targets.yml` with
  `{ path, format, frontmatter? }`. Adding Codex is an entry, not a module.
- **Validation cost.** For a large ecosystem, hand-validating claims can be
  weeks. Batches ordered by blast radius, accept / correct / discard, and the
  unvalidated **marked** rather than blocking.

## Positioning

> Backstage catalogs **services**, for humans, in a portal with a server.
> This catalogs **claims**, for agents, in git — and verifies them.

Against OpenSpec and SpecKit: they govern change within one repo; this
governs **change across repos and truth across repos**. Not competition —
integration. Say it explicitly in the README or someone reads it as redundant.

The practice's name, for the README: **brain-driven development**. The brain
is the repo you work from; the code repos are surfaces the change passes
through.

The adoption wedge, in one sentence: **your agent verifies its own context
before acting.** Zero methodology, zero migration, zero API key — and what it
verifies is documentation that lies about the code you already have.

## The mark

**The console panel.** A rounded frame of lamps: **lit** is a verified claim,
**unlit** is one nothing anchors yet, and the single **amber** lamp is the
claim in flight. The product's whole model in one drawing — a status board you
read at a glance, which is what a brain is for.

It ships three ways, all under `site/static/`: `mark.svg` (six lamps,
`currentColor`, so a page's own ink drives it), `favicon.svg` (four lamps,
heavier stroke, its own `prefers-color-scheme` block because a favicon inherits
nothing), and `lockup.svg` (mark, wordmark, tagline). Hextra takes the favicon
by name and the navbar logo from `params.navbar.logo`; the navbar renders one
`<img>` per theme, and an `<img>` is an isolated document where `currentColor`
falls back to black, so the dark slot carries `mark-dark.svg` — the same
drawing with its ink pinned.

In the terminal the panel is drawn in box characters by **`init`, and by no
other command**. `verify`, `doctor`, `doors` and `change` run inside git hooks
and in CI, where a banner is noise and `verify` has a sub-second budget to
spend on anchors. `--quiet` drops it with the rest of init's report, a pipe
drops it, and `NO_COLOR` keeps the drawing while dropping the colour — the
lamps fall back to `#` lit, `.` unlit, `*` in flight, because without ANSI the
amber lamp would be indistinguishable from a lit one.

**The lamp pattern is fixed.** `init` runs before there is anything to verify:
no law, no anchors, no claims. A banner that pretended to report the state of
the brain would be precisely the kind of lie this tool exists to prevent. It is
the logo, not a report.

## Build plan

1. **`multivac verify` first** — first in dependency order, not the whole
   scope: everything after consumes its output. Acceptance test gifted by
   history: check out the reference brain at its documented pre-incident
   state, run the verifier, and **it must find the six stale pages** the
   drift left behind. Known truth, real failure, objective measure. If it
   doesn't find them, the anchor design is wrong and you know before writing
   the rest.
2. **Anchor the 82 real invariants** of the reference brain against its five
   repos, and measure what fraction is anchorable. That number says whether
   the tool has a floor — and no competitor has it.
   **DONE 2026-08-13** — see "Measurement 1 results" below. 95.1% anchorable;
   the grammar stands, with five measured defects to fix.
3. **`multivac change`** — the `.multivac/changes/<slug>.md` format, the five
   subcommands, the close-time scoped verify. Acceptance test, also gifted
   by history: **replay the documented manual runs** from their full
   transcripts — same repos, same landing order, same MRs. The tool
   must reproduce what fourteen agents did by hand.
4. **`multivac seed --boundaries` against the reference ecosystem**, whose
   correct answer is already written by hand. Then against a foreign
   ecosystem, timing the validation:
   **that number decides whether starting point 2 exists as a product**.
5. **Three ecosystems the author didn't write** — a Django monolith, a k8s
   microservice mesh, a TS monorepo — public, before publishing. If the
   seeder spits garbage, better to find out before a stranger does.
6. The demo is not the reference brain: it is **the brain generated for an
   OSS project everyone knows**.

## Open decisions

- `doors` vs `entrypoints`.
- Whether the LLM parts are optional — they should be: requiring an API key at
  install shrinks the funnel. (This started life bundled with the licensing
  question; the licensing half is resolved below.)

Resolved 2026-08-13:

- **The license is MIT**, owner's decision. Copyright Pierre Ugaz, full text in
  `LICENSE`, declared in `package.json`, echoed in the README and the site
  footer, held as law by MV-22. The deterministic core needs no API key and
  wants to be dropped into other people's ecosystems, so copyleft would buy
  nothing and cost adoption. This unblocks publishing the real package — the
  `0.0.1` name placeholder went out as `UNLICENSED` deliberately.
- The tool lives in the **agent session**, CI as an optional net. Pitch:
  "your agent verifies its own context before acting."
- **Agent-agnostic, `AGENTS.md` canonical, no privileged second adapter.**
  Enforcement lives in **git hooks** (universal choke point); harness hooks
  are a required day-1 layer, per-harness in presence, shipped as
  `targets.yml` data. Claude Code's entry
  ships first because the reference project already runs it in production.
- **The name: `multivac`, alias `mvac`.** Asimov's world-computer — the brain
  everyone consults. Both names free on npm on naming day; reserve them
  before writing code. The consumer mount folder defaults to `.brain/` (the
  practice is brain-driven development; the tool is one implementation of
  it), name configurable per ecosystem. The config file is
  `.multivac/config.yml` (supersedes the earlier root `multivac.yml`).

## Measurement 1 results (2026-08-13)

Measured against the reference ecosystem; the full report quotes it
throughout and is therefore private. 9 read-only agents (6 anchor writers,
2 adversarial checkers — 6 downgrades, 8 upgrades — 1 synthesizer) over the
82 real invariants against the five reference repos. Every anchor was
actually run, no "would probably match".

**24 CLEAN + 54 PARTIAL = 78/82 = 95.1% anchorable; 4 UNANCHORABLE.** The design's
own bar was ~70%: the four-mode grammar stands. The 4 unanchorable are all
process rules (deploy order, cross-repo timing, untracked local tool state),
as predicted. The contracts-not-implementations thesis is confirmed by
gradient:

| group (by claim subject) | n | CLEAN | PARTIAL | UNANCH | % CLEAN |
| --- | --- | --- | --- | --- | --- |
| data & ledger | 19 | 8 | 11 | 0 | 42% |
| identity & session | 11 | 5 | 6 | 0 | 45% |
| plans & billing boundary | 12 | 5 | 7 | 0 | 42% |
| published copy | 14 | 2 | 11 | 1 | 14% |
| client surfaces | 14 | 4 | 10 | 0 | 29% |
| operations & process | 12 | 0 | 9 | 3 | 0% |

The three groups whose claims live at DB contract sites (GRANTs, named
constraints, unique indexes, function signatures, config keys) sit at 42–45%
CLEAN; published copy drops to 14%; process rules bottom out at 0% with all
four UNANCHORABLEs. Boundaries anchor; behavior partially anchors; process
does not anchor. Misfire risk concentrates exactly where an agent had to
anchor to an implementation for lack of a contract site.

**The anchors found six live doc↔code drifts during the feasibility study
itself** — the tool paid for itself before existing. README line.

Grammar defects, measured not theorized — each is now a design requirement:

1. **Line-based regex is the dominant false-green vector.** Real SQL splits
   grants across lines; all 6 checker downgrades trace to this or glob scope.
   Need statement-normalized matching for SQL DDL, or document line-based
   `absent`-over-DDL as unsound.
2. **Append-only migrations break `present` semantics**: it proves "was built
   this way", never "still is"; `unique`/`count` conflate history with HEAD.
   Need a latest-definition selector or schema-dump anchoring; until then the
   count-ratchet is the documented idiom for "never again" claims.
3. **Regex dialect must be enforced at anchor-write time**: macOS git grep
   POSIX ERE silently drops `\s` and `\b` — four anchors in the study passed
   vacuously. Translate `\s`→`[[:space:]]`, reject `\b`. The design's own
   original example anchors had the bug (fixed above).
4. **Empty-glob vacuity**: an `absent` anchor whose glob matches zero tracked
   files passes silently after a directory rename. Warn or fail on zero-file
   globs for `absent`/`count`. Verified live.
5. **Add `!glob` exclusion** — "everywhere except X" claims needed fragile
   complementary-glob workarounds in 3+ cases. Cheapest addition with
   measured demand.

Market datum: a hand-rolled shell checker in one of the reference repos
independently invented `absent` and `present` — but never `count`. The
ratchet is the non-obvious contribution. The candidate fifth mode named here
— config-pairing assertions ("every declared service block carries its
required auth key") — shipped after Measurement 2 proved the demand by
injection: it is `each`/`each!`, the per-file universal above.

Limits: single ecosystem, anchors written by capable agents rather than
average users, no longitudinal misfire data.

## Empirical evidence from the session

Real numbers, not hypotheses. All from the reference ecosystem's audit
sessions:

- **82 invariants** extracted from ~5,400 lines by five parallel agents. One
  adversarial refutation pass corrected **six**: two contradicting each other,
  three labeled "published" without being published — one claimed the exact
  opposite of what the product's public site states and keeps stating — and
  one stale since a new writer came online. No agent reviewing its own work
  would have caught them.
  → **LLM extraction needs adversarial refutation; the deterministic verifier
  is the only thing trustworthy without it.**
- **678 dead-term occurrences** across the five consumer repos. 485 (71%) in
  archived change history, legitimate. The rest included a mechanism retired
  days earlier, described **in present tense** inside the "non-negotiable
  rules" of two code repos, eleven days after dying, plus five live spec
  files.
  → **the tombstone must cross the repo boundary.** The guard only watched the
  documentation; the damage was outside.
- **Three different submodule pins**, 25, 35, and 53 commits behind. An agent
  in one repo read a brain snapshot missing three shipped feature areas.
  → **pin + staleness check.**
- Each consumer door's "non-negotiable rules" were hand transcriptions of the
  central law. That is why they aged silently.
  → **paraphrase ages without warning; a citation can be verified.** Hence
  citable IDs and `multivac doors`.
- The repo with **zero** dead terms still had two rules describing the
  boundary wrong.
  → **grep is not enough**: it covers tombstones, not semantics. Which is why
  unanchored claims are counted instead of pretended verified.
- One repo trips seven dead terms and **six are correctly written as
  tombstones**.
  → a repo that documents its dead well goes red anyway. No grep fixes that;
  it argues for the `absent` anchor with declared scope over a global
  dictionary.
