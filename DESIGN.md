# multivac — design

> A **brain-driven development** tool: one brain repo from which an entire
> ecosystem is developed — the knowledge base, its verification, and the
> change that crosses repos. Destination: OSS. Status: design, zero code.
>
> **Named 2026-08-13** after Asimov's world-computer: the central brain
> humanity consults for every decision, accumulating all knowledge across
> generations — and, in "The Last Question", finally answering. CLI alias:
> **`mvac`**. `multivac` and `mvac` both free on npm as of naming day.
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
  ecosystem: where every repo lives, the law, the ritual, landing order.
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
multivac change apply    # branch per repo from origin/main, edits, commits
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

A change is a **file in the brain**: `changes/<slug>.md`, carrying the four
declared fields — repos, the landing-order graph, invariants touched, claims
made true with their anchors — plus per-repo status
(planned / branched / committed / MR / landed). That file is the state the
five subcommands read and write, across days and machines. `change close`
re-runs `verify` **scoped to the declared claims**; on success the file is
archived, not deleted.

### The fourth field closes the loop

> **A change is not done when it merges. It is done when its anchors resolve.**

If the change declares up front the claims it will make true, `multivac change
close` doesn't ask whether someone updated the docs: **it checks that what the
change promised is now true**. The ritual stops being discipline and becomes
mechanism — which is the reference brain's explicitly confessed hole: *"it is
discipline and nothing verifies it"*, paid twice in its own history — once
with six stale pages, once with two stale door files.

It falls out of the model for free: nothing new to invent, just declare before
what today gets checked after (when anyone remembers).

### Greenfield falls out of the same object

A change whose repos **don't exist yet**: `apply` creates them, with their
first commit and their door. The brain precedes the code — which is exactly
starting point 1. No second machinery needed; `apply` must know how to create,
not only edit.

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
- **The ritual** that ties documentation updates to the close of every change.

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

The sub-second latency budget, already in the design for session ergonomics,
becomes mandatory here: a slow `pre-commit` gets `--no-verify`'d once and
never comes back.

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

The serialized home is the law table in `invariants.md`, one row per claim —
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

    <!-- @anchor <CLAIM-ID> <repo>:<glob> [!<glob> …] /<regex>/[flags] [mode] -->

- **The claim ID is in the comment, never inferred.** A follows-the-row
  proximity convention collapses for prose claims and survives no reformat;
  the explicit ID is the join key for reporting and for `change close`.
- **`repo` is the registry key from `.multivac/config.yml`** (`backend`),
  never the directory name (`acme-backend`). `*` covers every declared repo **plus
  the brain itself**.
- **`!<glob>` excludes**, applied after the include glob
  (`backend:** !db/tests/** /secret_key_/ absent`). The surviving file
  set is what gets matched — and what counts toward zero-file (vacuous)
  detection. Measured demand: "everywhere except X" needed fragile
  complementary-glob workarounds in 3+ of the reference 82.
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

### Four modes, one mechanism

| mode | requires | what it's for |
| --- | --- | --- |
| `present` (default) | at least one match | the rule is implemented |
| `absent` | no match | **the tombstone** |
| `unique` | exactly one | single source of a value |
| `count=N` | exactly N | **the ratchet** |

`count=N` legs are also what `verify` calls **derived numbers**: a number
the brain states and the code must still yield — INV-01's `count=1` above.

Two matching rules are normative, measured not theorized (Measurement 1,
defects 1–2):

- **Statement-normalized matching for SQL and config surfaces.** Real DDL
  splits one grant across lines; every single-line `absent` tombstone over
  SQL DDL had a demonstrated in-repo escape. On `.sql` and config files the
  matcher normalizes per statement — whitespace runs, newlines included,
  collapse to one space — before the regex runs. Line-based `absent` over
  DDL is unsound and multivac does not offer it.
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
| `present` | **high** — the rule is true, the code moved | reports and self-heals |
| `unique` | medium | reports |

**The tombstone blocks; the presence check informs.** Without this, every
refactor turns the check red and someone disables the tool in week three.
Lint-family tools die of noise, not of bugs.

This table is the **default** of the `blocking:` key. Config may extend it;
loosening below `[absent]` — unblocking the tombstone — is refused.

### Self-healing, states, exit codes

When a `present` fails in its declared glob, search the whole repo before
reporting. Four states, not two:

- **ok** — every leg holds.
- **moved** — a `present` leg with **exactly one** match outside its glob:
  the glob is rewritten in place. Zero or many out-of-glob matches is not a
  move — it is `broken`, with the candidates listed.
- **broken** — the leg's requirement fails in place.
- **vacuous** — the glob, after `!` exclusions, matches **zero tracked
  files**. For `absent`/`count` this is a **failure**, blocking: a directory
  rename silently greens every tombstone otherwise (verified live in
  Measurement 1). For `present`/`unique` it reports as broken.

One exit matrix, no second answer:

| result | default | `--strict` |
| --- | --- | --- |
| broken or vacuous leg in a blocking mode (`absent`, `count`) | **exit 1** | exit 1 |
| broken `present` / `unique` | reported, exit 0 | exit 1 |
| moved (self-healed) | exit 0 | exit 0 |

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

**The brain is the registry**, and it splits **content from machinery**.
Content — what a human or agent reads — lives at the root: `AGENTS.md`,
`invariants.md`, `changes/`. Machinery — what only the tool reads — lives
under `.multivac/`: `config.yml` (the registry below; supersedes the root
`multivac.yml` of earlier drafts), `hooks/` (the `core.hooksPath` target),
and `cache/` (gitignored). Consumer repos get the same split where
applicable: door at the root, machinery under `.multivac/`.

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

**Cloning: implicit paths never, explicit operations yes.** The "multivac never
installs anything" rule is about *tools* (graphify, speckit — foreign
software). Declared repos are the tool's own data: cloning them is in scope.
The line is implicit vs explicit:

| context | clones? | why |
| --- | --- | --- |
| `verify` / hooks | **never** | sub-second budget, may be offline; a hook that hits the network gets uninstalled. Degrades: unevaluated, not red |
| `change plan/apply` on a declared, absent repo | **yes, automatic** | the user explicitly asked for an operation that needs the repo — same contract as `git submodule update` |
| `repos sync` | all missing | the explicit machine-setup command (`--shallow` for verify-only machines; `change` needs full clones to branch) |
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
global. Present artifact → the consumer door points at it ("orient with the
graph before reading raw" — the reference ecosystem's hook, generalized).
Present binary → the `run` capability refreshes it. A newborn brain is two
content files; a graph of that is noise — `doctor` suggests a grapher past
a size threshold.

## Distribution

The pinned submodule gives reproducible builds and stale docs. Always-latest
gives freshness and irreproducible builds. The tool doesn't choose:

> **Pin + staleness check.** The pin stays, and `verify` fails if it is behind
> the declared channel (`channel:` in `.multivac/config.yml`, global or per repo).
> Reproducible *and* fresh, with the debt visible instead of silent.

Offline by construction: staleness compares the pin against the **locally
known remote-tracking ref** — best-effort, no network — and the report
carries the last-fetch age ("pin 35 behind origin/main; last fetch 6 days
ago"). Fetching happens only in explicit operations (`repos sync`,
`change plan/apply`), never in `verify` or hooks.

## The door

There are **two kinds of door**, and they are not the same file renamed:

- **Brain door** — how to work on the ecosystem from here: where every repo
  lives, the ritual, the law, the landing order.
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

- **Existing ecosystem** → the deterministic `seed` inventories the
  boundaries; the agent drafts the map and the `proposed` law rows; the
  human validates and enacts in blast-radius batches (accept / correct /
  discard); `doors` projects the result into every consumer repo.
- **From scratch** → the interview protocol draws the law out of the
  person's head; the first `change` creates the repos — greenfield `apply`,
  first commit, consumer door already mounted.

Both paths converge on the same steady state: an anchored law, doors in
every repo, every subsequent decision entering as a `change`.

## CLI

```
multivac init .   --agent claude,cursor --sdd opsx --grapher graphify
multivac verify   # anchors + tombstones + derived numbers. No LLM, no network, deterministic
multivac seed     # reads boundaries, proposes law rows + map stubs (LLM-optional)
multivac anchor   # optional helper that proposes anchors (LLM-optional)
multivac doors    # projects AGENTS.md to the declared targets
multivac doctor   # what is declared, what was found, what is degraded, how to fix it
multivac repos    # sync — clone declared-but-missing repos (--shallow for verify-only machines)
multivac change   # new / plan / apply / land / close — the ecosystem change
```

`seed` reads the ecosystem's boundaries — migrations, schemas, config keys,
route tables, GRANTs — and writes into the brain: **`proposed` rows in the
law table** plus map stubs. Nothing it writes is law until validated. The
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
blocking:    [absent, count]
repos:
  backend: ../acme-backend    # bare string = shorthand for { path: … }
```

`init`'s side effects, enumerated once and completely:

1. Writes the **content files at the root**: `AGENTS.md` (the door — its
   managed block states the brain is empty and points at the skill; see
   "Session zero") and `invariants.md` (the law table with its format and
   zero rows). An existing `AGENTS.md` is never clobbered — only the
   managed block is written.
2. Writes the **machinery** under `.multivac/`: `config.yml` (where the
   flags land), `hooks/`, and a gitignored `cache/`.
3. Runs **`git init`** when the directory is not already a git repo (the
   model is git-native; see "Where it runs").
4. Points **`core.hooksPath`** at `.multivac/hooks/` and writes the
   `pre-commit` / `pre-push` scripts there, so the hooks travel with the
   clone and there is no install step to forget.

"Two root files and not one more" scopes to **content scaffolding**: no
template gallery, no empty sections, no per-agent folders. The machinery
above is not content — it is the enforcement floor. Empty scaffolding is the noise
that keeps a brain from being read.

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

Two normative rules, applying to the brain and to every declared repo:

- **SDD runs inside the change lifecycle.** When an SDD adapter is declared
  and its `run` capability is present, its workflow is **automated**:
  propose at `change new`, apply during `change apply`, archive/sync at
  `change close`. Opt-out is explicit — `sdd_auto: false` in `.multivac/config.yml`,
  or `--no-sdd` on a single change. A declared-but-absent binary degrades as
  usual: notice, feature off, exit 0.
- **Grapher freshness is automatic.** When a grapher is declared and its
  binary present, the graph artifact is refreshed after **any change to that
  repo's files** — brain or code repo — via the post-edit/pre-commit hook
  path. A stale graph next to a present binary is a `doctor` warning, never
  silence.

`multivac doctor` answers "what is declared, what was found, what is degraded, how
do I fix it":

```
$ multivac doctor
doors      AGENTS.md (canonical) · CLAUDE.md (symlink) · .cursor/rules/multivac.mdc (stub)
sdd        opsx        artifact ok (12 specs) · binary ok
grapher    graphify    artifact ok · binary missing  → pipx install graphify
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
3. **`multivac change`** — the `changes/<slug>.md` format, the five
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
- License, and whether the LLM parts are optional — they should be: requiring
  an API key at install shrinks the funnel.

Resolved 2026-08-13:

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
ratchet is the non-obvious contribution. Candidate fifth mode with one
measured use case: config-pairing assertions ("every declared service block
carries its required auth key") — trying it by hand surfaced two undeclared
entries.

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
