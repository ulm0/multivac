# Changelog

What changed in each release, for the people who install multivac. The
reasoning behind each decision lives in `.multivac/changes/archive/` — that is
the brain's own ledger, written for the people changing the tool.

Every entry names the invariant it made true, because a rule quoted without its
ID does not bind.

This file is the only copy. The documentation site mounts it rather than
keeping a second one (MV-78).

## 0.10.0 — 2026-08-24

**Changed**

- **A red `verify` now reaches the agent in Claude Code, and after an edit the
  agent has to read it.** Claude Code feeds the model only exit-0 stdout at
  `SessionStart` and only exit-2 stderr at `PostToolUse`. Both projected
  entries ran bare `mvac verify`, which prints its findings to stdout and exits
  1 when it gates — so on the one occasion the gate had something to say, the
  model received none of it. `doors` now writes one command per event:
  `mvac verify 2>&1 || true` at session start, where the findings are the
  payload and nothing may block, and `mvac verify >&2 || exit 2` after an
  edit, where a red law, a config the edit broke and a missing binary all come
  back as the exit the harness hands to the model. The edit is already on
  disk, so this is a forced read in the same turn, not a revert. Re-running
  `doors` rewrites an existing bare entry in place instead of adding a second
  one beside it, and a `mvac verify --strict` you wrote stays yours. Only the
  `claude` target carries a hook config, and a brain that never re-runs
  `doors` keeps the old, mute command. (MV-112)
- **A commit that deletes the law is refused, the way a commit that enacts it
  is gated.** `git rm .multivac/invariants.md && git commit` printed
  `0 claims · 0 anchored` and exited 0, and deleting the one row whose
  tombstone was in the way passed just as quietly. A row that is `active` at
  HEAD and absent from the index is now refused with exit 1, naming the ids,
  and so is an index that removes the law file. Retiring a row stays allowed —
  it is how a rule stops applying in the open — and a `proposed` row may still
  disappear, because that is a reservation being given back. Where the
  question cannot be answered — no HEAD, an unreadable index, a consumer
  checkout, which carries no law — the check says so and does not gate.
  (MV-107) **Retired rows are covered too**: they are the record of what a
  rule used to be, so deleting one is refused exactly like deleting an active
  row. (MV-117)
- **An unknown config key or `--sdd` name is refused by name instead of read
  as declared.** `strict_prepush: true` loaded clean, armed nothing, and
  `doctor` still called the gate armed. A key multivac does not know is now
  refused at the top level, under `repos.<key>` and under `graphers.<name>`,
  naming the key it is near when only case or separators differ and listing
  the known keys otherwise. `init --sdd speckti` wrote the typo into the
  config and projected a door announcing a gate with zero steps; the name is
  now checked against the registry, and `--sdd=` exits 2 like any refused
  argument instead of 1. **If you run more than one version**: from this
  release on, a key a newer multivac knows is refused by an older one. And
  `init --grapher` is still not checked: an unknown name is written to the
  config, and `doors` and `doctor` report it as not verified. (MV-114)
- **Exit codes keep the documented contract in four more commands.** A config
  that will not load is an environment error, so every command that reads one
  exits 2 — but `seed`, `repos`, `repos sync` and `roadmap sync` exited 1, and
  a script could not tell a broken environment from a gate that refused. They
  exit 2 now. `doors` and `doctor` remain the documented exceptions; `init`,
  which now refuses a broken config instead of reading it as absent, exits 1
  too, though the reference does not list it; and bare `roadmap` still exits 0
  on a broken config because it never reads one. **Bare `doctor` now
  exits 1 when an anchor in the law does not parse**, as its own `--help` and
  the reference already said: it read the law's anchors and discarded the
  parse diagnostics on the same line, so a broken law reported clean. It
  prints a `law` line naming them. (MV-118, amending MV-85)

**Fixed**

- **`--flag=value` is accepted again.** 0.9.0 refused `init --provider=claude`,
  a line 0.8.0 accepted, because the refusal compared whole tokens while the
  parser behind it splits on `=`. A long flag written with `=` is matched by
  its name now. A declared valued flag whose value is missing, or is itself a
  flag, is refused naming the flag — `verify --repo --strict` used to read
  `--strict` as the repo's name, so the strict assertion never ran. And
  `change` and `count` read the same refusal as every other command, so
  `change land <slug> api` and `change land <slug> -landed api` no longer
  exit 0 having recorded nothing, and surplus arguments are counted per
  subcommand. (MV-105)
- **The commit gates read the commit being made, `git commit -a` included.**
  Git composes `git commit -a` in `.git/index.lock` and a pathspec commit in
  `.git/next-index-NNN.lock`, while the gates read the index on disk. Under
  `-a` they saw fewer paths than the commit contained, which walked the
  enactment and config checks straight past the most common way to commit;
  under a pathspec commit they saw more, which could refuse a commit over a
  path that was not in it. The index git hands the hook is honoured now, for
  the repository the hook runs in and no other — sibling repos are still read
  through their own. (MV-106)
- **multivac no longer takes "it is there" to mean "it is ours".** `doors`
  wrote a stub door such as `.github/copilot-instructions.md` whole, so every
  run destroyed whatever you had put in it; it writes only its managed block
  there now, and frontmatter only when it creates the file. The commit hook's
  first choice of runner — the repository's own build, first since 0.8.0
  (MV-92) — now requires the repository's `package.json` to name multivac,
  because `dist/cli.js` beside `node_modules` describes most Node CLI
  repositories, and one that builds its own CLI had that binary executed on
  every commit with `verify` as its argument. A hook that mentions multivac
  only on a comment line no longer reads as wired, so `doctor --strict` stops
  calling a gate armed that does not exist; a mention inside a quoted string
  on a real line still reads as wired, by design. multivac's own shim beside
  husky is recognised and rewritten, so `strict_pre_push` arms there and later
  shim fixes reach it. And `init .` — the line `doctor` prints — no longer
  downgrades a strict pre-push shim to a plain one, and no longer rewrites
  `.multivac/projected.yml` when it exists, which silenced the version-skew
  notice. A hand-edit to a hook multivac wrote is still lost when the hook is
  regenerated, and its header says so. (MV-108)
- **Hooks and projections survive the environments they land in.** In a
  linked worktree the shim looked for the repository's own hooks under
  `git rev-parse --git-dir`, which there names `.git/worktrees/<id>` and holds
  no `hooks/`, so the repository's own lefthook or hand-written gate never
  ran; it looks under `--git-common-dir` now, and `doctor` asks the same way.
  A declared grapher refresh ran through a shell after an edit but was split
  on spaces at `change close`, so quotes, redirects and `&&` worked in one
  place and broke in the other; both run it through a shell. One mangled
  managed file no longer ends a multi-repo run: that file gets a notice naming
  it and the repos after it still get their doors and hooks, and a file with
  two marker pairs is refused rather than half updated. `doctor` reads a shim
  instead of checking that it exists, so one edited down to `exit 0` reports
  that it does not run multivac rather than installed and armed. (MV-115)
- **A broken config no longer disarms a strict gate through `init`, and a
  commented `requires:` floor is read.** With `strict_pre_push: true` and a
  config that would not load, `init .` read the config as absent, re-rendered
  every projection from nothing and left no `verify --strict` in the pre-push
  shim, exit 0, while `doors` in the same state exited 1 and kept the gate.
  `init` now refuses a config it cannot load, with exit 1 as `doors` does,
  though it may already have run `git init` in a directory that was not a
  repository. And `requires: ">=0.4.0" # floor for CI` — ordinary YAML on the
  line the tool tells you to write — was ignored; a trailing comment no longer
  hides the floor, so a binary below it gets its notice, and a malformed floor
  with a comment is named in its own notice instead of vanishing. Neither
  notice changes an exit code. (MV-114)
- **The anchor engine reads one way.** A bare `[:digit:]` outside a bracket
  expression was translated anyway, so `PIN[:digit:]` compiled to `PIN0-9`
  and matched only that literal text — an `absent` leg written that way was
  green forever. It is refused now, in GNU grep's own wording; nested forms
  such as `[[:alpha:][:digit:]]` still compile, and an escaped `PIN\[:digit:]`,
  which 0.9.0 also rewrote into a pattern that matches nothing, is now the
  literal it means. The dialect gate also refuses `(?…)`, lazy quantifiers,
  backreferences, `\0` and alphabetic escapes with no ERE meaning, each by name:
  git grep already read those differently from multivac, so a leg using one had
  two answers. A line in a CRLF file is a line — a `$`-anchored or exact-line
  leg never matched there, so a `present` leg read broken and an `absent` leg
  read green; line numbers do not move, and a lone `\r` is still text. `count`
  reads the bytes `verify` reads — each sibling repo at its channel, not its
  working tree — and says what it read, so a `count=N` pinned from it agrees
  with the gate. (MV-109)
- **Self-heal stays inside the file kind a leg names, and a symlink is not
  file text.** A `present` leg whose pattern moved is healed by rewriting its
  glob, and the only fence was `.multivac/` — so a `.ts` glob could be
  rewritten onto a documentation page that happened to quote the pattern,
  pointing law at prose. A candidate must now share the include's trailing
  extension, and when that fence refuses every candidate the report now names
  the files it refused. An include with no trailing extension, or ending in a
  brace group, keeps only the `.multivac/` fence. Tracked symlinks and
  gitlinks are listed by neither reader: a working-tree read followed the link
  while a ref read saw the link text, so one leg got two verdicts — including
  over the `CLAUDE.md` link to `AGENTS.md` that multivac installs. A leg whose
  glob names only a symlink now matches no tracked file; point it at the
  link's target. (MV-116)
- **An SDD proof names exactly one feature.** The spec-kit proof was
  `specs/*<slug>*/spec.md`, so any other feature directory whose name merely
  contained the slug — `001-gate-b-login` for `gate-b`, `030-points-expire`
  for `expire` — satisfied `change plan`, `apply` and `close`. The artifact
  language has no wildcard now: `<n>` is one run of digits, so the proof is
  `specs/<n>-<slug>/spec.md` and an openspec archive is `<n>-<n>-<n>-<slug>`.
  When more than one directory proves one step, the gate refuses and names
  them instead of taking the first in sort order. A directory of the right
  shape written by hand still proves the step, and `<n>` accepts any digits,
  not only calendar dates. (MV-113)
- **The lifecycle commits what it wrote and reports what actually happened.**
  `change land --landed` wrote its status bump and committed nothing; it
  commits it now. The commit `change close` prints includes the law file its
  archive step edits, so the next `change new` is not refused over it.
  `--abandon` names repos that already landed instead of printing *nothing
  landed*, and prints the commit it needs. `change new` refuses a slug whose
  archive already exists, which the eventual close would have overwritten.
  `roadmap sync` passed `--label` to `gh issue edit`, which has no such flag,
  so every GitHub update failed and was reported as *not found in the
  tracker*, and a failed close was printed as *closed*; it passes
  `--add-label` now. A failed update or close is printed as *NOT updated* or
  *NOT closed*, followed by the command that failed rather than the tracker's
  own error, and a failed update still prints the *not found in the tracker*
  line after it. A GitHub issue still accumulates status labels, because
  adding one removes none, and `close`'s spec-kit ledger still passes when the
  artifact never existed. (MV-110)
- **`change close` loses nothing on the way to the archive.** It verified a
  change's claims against every anchor it could see, including anchors
  written inside the change file, then archived that file — which the parser
  never reads — so a claim could be green at close and unanchored from then
  on. It refuses now, naming the claim, so the anchor moves beside the code it
  pins. Two branches closing the same slug could overwrite an archived
  record; the archive write itself refuses now. And a frontmatter key the
  lifecycle does not know, which its next rewrite of the file drops, is named
  whenever a command reads the change file — `verify` and `roadmap` included
  — as a notice rather than a refusal. `--abandon` still reports rather than
  refuses over landed repos, on purpose. (MV-117)
- **A law row whose statement contains a pipe is read correctly.** Every
  reader of the law table counted cells from the front, so a statement
  quoting shell — `2>&1 ||` — moved the columns after it and the state was
  read out of the prose. Such a row could reach `active` without the
  enactment check naming it, gate as enacted while still `proposed`, and slip
  past `change plan`'s id-collision refusal, which printed the mangled prose
  as the state and exited 0; the brain door counted rows the same wrong way.
  The trailing columns are read from the end of the row now, by one parser,
  and a row missing them claims nothing rather than borrowing a neighbour's
  cell. (MV-119)
- **`init` tells you to commit what it wrote, and the skill stops teaching
  what the tool does not do.** A fresh brain's first `change new` is refused
  until the scaffold is committed, and `init` never said so; its closing
  steps now start with that commit, and the refusal says the paths are
  *untracked or modified* rather than calling a never-edited file
  *uncommitted edits*. The shipped skill taught an arrow-edge `landing_order`
  the parser refuses — it takes stages, a list of lists — told the interview
  to write the loop and the boundary list into the brain door's managed
  block, which `doors` regenerates whole on every run, and said `change apply`
  re-projects doors, which it does not. All three are corrected. (MV-111)
  The site's session-zero guide gave the same managed-block advice and is
  corrected too. (MV-118)
- **The brain door no longer implies the graph stays uncommitted.** Its line
  for a declared grapher said the artifact was "never staged or committed by
  multivac", which was confusing where the graph is tracked — and since 0.8.0
  `change close` refuses a declared graph that is not (MV-103). It now reads
  "refreshed after your edits; multivac never stages it, but you can track and
  commit it": the refresh touches no git, and the commit is yours. (MV-50)

## 0.9.0 — 2026-08-18

**Changed**

- **The CLI is parsed by [citty](https://github.com/unjs/citty).** Every command
  declares what it takes once, as data; citty parses that declaration and the
  refusal reads the same one, so adding a flag is one edit instead of two that
  can drift. Nothing a user types behaves differently: same flags, same
  positionals, same refusals, same exit codes, and the existing suite passes
  unedited. The refusal is **not** delegated — measured, citty parses an
  undeclared flag into a key nobody declared and hands it to the command, which
  is the silence MV-85 exists to end, so the check still runs before the parser.
  `--help` stays this tool's own. Third runtime dependency, named in the law and
  in the constitution before the package was added: citty is one package with
  zero dependencies of its own. (MV-104, amending MV-02 and MV-85)

## 0.8.0 — 2026-08-18

**Added**

- **A declared grapher's graph has to be in the repository, not just on disk.**
  `change close` refuses while a declared, present root keeps its artifact
  untracked, naming each root, the path and the `git add` that ends it. An
  artifact matched by an ignore rule gets its own message, because `git add`
  does not fix that one. Existence was half the question: a graph that lives in
  one working tree passes the old gate and helps nobody who clones the repo,
  where the door still tells every agent to ask it. multivac stages nothing —
  the gate says, you commit — and `doctor` reports the same state per root
  without gating on it. (MV-103, amending MV-90)
- **`multivac roadmap sync` projects the change files to a declared tracker.**
  `tracker: gitlab` or `tracker: github`, using that vendor's own CLI so
  multivac holds no credentials and adds no dependency. **One way, always**: the
  change files are the source, and nothing the tracker says ever reaches them —
  closing an issue by hand closes nothing, and the next sync restores it. The
  identity is the issue **number**, recorded in the change file, so a title edit
  cannot duplicate anything. Only labels in multivac's own namespace are
  written, and none it does not own is ever removed. An absent CLI refuses
  rather than reporting success, and it never runs from `verify`, `doctor` or
  `doors`. One issue per change for now. (MV-99)
- **The ritual now arrives with candidates, all commented out.** `init` wrote it
  as a bare comment, and facing a blank page most people write nothing — so the
  closing step printed nothing forever. Candidates are drawn from what you
  declared and nothing is asserted on your behalf: a commented line never
  prints, so a fresh brain still prints nothing at close. Only things no check
  could decide are seeded; a declared grapher contributes none, because its work
  is automatic and already gated. (MV-98, amending MV-34)
- **Changing `.multivac/config.yml` now needs an open change.** It decides which
  repos exist, which adapters bind and which gates run — all as load-bearing as
  a law row, and all editable in a commit with no explanation and nobody
  noticing. A staged modification is refused while no change is open; creating
  one is free, because a brain has to start somewhere and `init` is the only
  thing that writes it. Any open change satisfies it, including one opened for
  that edit. (MV-97)
- **`multivac doors` now writes `.multivac/flow.md`** — one page sorting what
  your declarations oblige into what happens unasked, what refuses, and what no
  tool can check. A fresh brain had no place answering "what did I just sign up
  for": the law is dozens of rows, the ritual starts empty, and everything else
  scrolled past. Every row is rendered from the adapter registry and your
  config, so it cannot describe behaviour the tool does not have, and each
  unprovable step carries the adapter's own reason verbatim. It cites no
  invariant identifier — those are per-brain, so a generated one would be wrong
  in every other ecosystem. Derived and rewritten whole; anything you write
  outside the markers survives; it binds nothing and says so. (MV-96)
- **`change apply` now says what can be worked at once.** Repos in one stage of
  `landing_order` have no ordering dependency by the declaration's own meaning,
  and apply hands back an isolated checkout for each — it knew both and said
  neither. The line carries its boundaries: never the same file twice at once,
  and never the law. **And each printed SDD step now says to run the chain
  through** rather than waiting to be asked, with the opt-out on the same line;
  stopping is for a question the tool itself raises, not for permission. Both
  are printed and never checked — no artifact proves either happened. (MV-95)
- **`change new` and `change apply` now say when the brain is behind.** The pin
  each repo records for the mounted brain was already compared to its channel,
  offline, and reported by `verify` — but nothing said it at the moment work
  starts, which is the only moment "refresh before you start" is an instruction
  rather than a fact about the past. It reports and never refuses: offline a pin
  behind its channel means somebody landed work *or* nobody fetched, and
  refusing on the second reading would fail an ordinary morning. `staleness:
  block` still gates in `verify`, unchanged. (MV-94)
- **A door in a code repo now names the ecosystem it belongs to.** It carried
  the law and the mount and nothing else, while the brain's door listed the
  repos and every adapter — and the consumer door is the one most sessions start
  from. It now carries the list of declared repos with the one you are in
  marked, `brain` named as the handle anchors use, the adapters that apply to
  that repo, and an optional one-line `role` per repo. The mount refresh is now
  the first instruction rather than the second of four bullets, and carries its
  reason: the pin stays where the last commit left it, so a present mount is not
  a current one. (MV-93, amending MV-61 and MV-87)

**Fixed**

- **The door a fresh brain gets is the door the tool maintains.** `init` carried
  its own copy of the brain door and the copy had drifted: the projected door
  gained the graph block and the ecosystem's repo list, the copy gained neither.
  So the first file an agent reads — the only one it has before anybody runs a
  second command — never named the graph it tells you to ask before reading the
  tree. There is one rendering now: `init` writes the bytes `doors` writes, and
  running `doors` straight after `init` changes nothing. A config that will not
  load leaves the door alone rather than being written from nothing. (MV-102,
  amending MV-101 and MV-91)
- **The door no longer names an SDD the config does not declare.** On a brain
  whose config exists but declares no `sdd:`, `init --sdd speckit` reported the
  flag as not in the config — correctly — and then wrote a door gating through
  speckit anyway, because the door resolved the flag as a fallback. `doors`,
  which reads the config alone, deleted that block on its next run: two
  commands, one repo, two different doors, with nothing on disk recording the
  choice or explaining the revert. The door now takes the config's answer
  whenever a config exists, and a flag is the declaration exactly once — on the
  first run, which is what writes the config. The report, the refusal for a
  disagreeing flag and first-run behaviour are all unchanged. (MV-101, amending
  MV-91)
- **The commit hook now runs the multivac that governs the repository**, not
  whatever is installed on the machine. The shim tried `mvac` on PATH first and
  the repository's own build last; the order is now the exact inverse — this
  repository's build, then the multivac it declares, then PATH. A global install
  a year behind was enforcing an older law table against a repo that pinned
  something else, silently. Nothing runnable still never blocks a commit, and
  the repository's own gates still run first. (MV-92)
- **`pnpm test` no longer runs tests whose sources are gone.** `tsc` does not
  delete output for a deleted source, so the compiled suite accumulated whatever
  any branch ever built: measured after a rebase, five failures from a file
  absent from that branch — and silently, a deleted test that keeps passing. The
  build clears its output before compiling, and a test asserts the property
  rather than the script, so it fails whatever the cause. (MV-92)
- **A pasted link to the site now renders as a card.** The head served an empty
  description, a whitespace `og:type`, and **no `og:image` on any page** — and a
  scraper that finds no image does not fall back to a favicon, it renders a bare
  URL. Documentation pages carried `twitter:title` and no `og:` tags at all.
  Every page now carries a description and a 1200×630 card image, the Twitter
  card is the large format, and `robots.txt` names the sitemap it already had.
  No template was written: the machinery existed and had never been given
  anything to render. (MV-100, amending MV-77)
- **And the rest of the discoverability surface.** Sitemap entries now carry a
  `lastmod` derived from git rather than from a date field nobody would
  maintain; the empty `/categories/` and `/tags/` pages are no longer generated
  or indexed; `languageCode` replaces a `locale:` key Hugo never read; and the
  head gains `og:site_name`, `og:locale`, the card's dimensions and alt text,
  and JSON-LD saying what kind of thing each page is — a developer tool, not a
  shop — which the theme's microdata could not express. Every added tag is one
  the theme does not emit, because a duplicate is two sources for one fact.
- **The site's discoverability is now checked on every commit**, not fixed once.
  The check walks the content tree recursively, so a section added later is
  covered without anybody remembering — a listed set would pass forever while
  the next section shipped without a description. It states its ceilings: it
  cannot judge whether a description is good, and cannot decide whether a given
  network renders the card.

## 0.7.0 — 2026-08-18

**Fixed**

- **Re-running `init` no longer writes a door that disagrees with the config it
  kept.** `init --sdd speckit` followed by `init --sdd opsx` left `sdd: speckit`
  in `.multivac/config.yml` while `AGENTS.md` said the features gate through
  the `opsx` SDD, with nothing saying they disagreed — and the door is the first
  file an agent reads. The config is authoritative once it exists: a flag naming
  a different adapter is now refused, with both values named and both ways
  forward stated, and the refusal writes nothing at all. A flag that agrees is
  reported as redundant; a flag naming an adapter the config declares none of is
  reported with how to make it stick. Everything else about a re-run was already
  correct and is unchanged. (MV-91, amending MV-70)

**Added**

- **A declared grapher now obliges a graph.** `change close` refuses while any
  declared, present repo has no graph, naming every one of them in a single
  message with the command that builds one there. Declaring `grapher:` used to
  oblige nothing — the tool ran where it could and every failure was a notice
  that kept going, so a change could close with four repos ungraphed and say
  nothing. The cost was invisible by design: the door tells agents to ask the
  graph before reading the tree, so a missing graph never failed, it degraded
  into agents grepping. A root whose binary is not on PATH refuses too, because
  a gate that cannot be evaluated must not pass. The gate asks whether a graph
  exists and never whether it is current. `--no-grapher` skips it for one run,
  `grapher_auto: false` turns it off for good, and `--abandon` is exempt.
  (MV-90, amending MV-87)
- **The refresh at close reaches every declared repo**, not only the ones the
  change named. A repo moved by another change, a merge or a sync was left
  describing a tree that was gone.
- **The door projected into each declared repo now names the graph** — the tool,
  its artifact and its own query verbs — resolved with the grapher that applies
  to that repo. Only the brain's door carried this before, so an operator
  entering the ecosystem through a code repo got an agent that never learned a
  graph existed.
- **A change can now exist before it starts.** `planned` is a new change state
  in front of `open`, carried by the same `.multivac/changes/<slug>.md` file
  with the same schema, plus a `horizon` of `now`, `next` or `later`. That is
  the whole ordering model — no dates, no estimates, no rank, no dependencies
  between items. Keeping the roadmap in the change files rather than in a
  second list is the point: two lists describing the same work drift apart, and
  whichever one the tool does not read becomes fiction. (MV-89)
- **`multivac roadmap`** lists planned changes grouped by horizon, nearest
  first, and reports how many changes are actually in flight under its own
  label so intention is never read as progress. **`multivac roadmap add <slug>
  "<title>" [--horizon now|next|later]`** records one. It reserves no invariant
  id, opens no branch and creates no worktree.
- **`change new` on a planned slug promotes the file that is already there** —
  status flips to `open`, the invariant id is reserved at that moment, and the
  body is carried across byte for byte, so the prose written when the idea was
  young survives into the change that implements it. `change new` on a slug
  nobody planned behaves exactly as before: the roadmap is never a
  precondition, and no command anywhere refuses an operation because its
  subject was not recorded first.
- `plan`, `apply`, `land` and `close` refuse a change that has not started, and
  name `change new` as the step that comes first.

A roadmap of any length never delays a release: a planned change contributes no
pending claim and no landed repo, so `verify --strict` can never name it as
unclosed. Had it counted, the first entry recorded would have blocked every
release for as long as the roadmap was not empty.

## 0.6.0 — 2026-08-17

**Packaging — read if you verify what you install**

- **This release and the ones after it carry no provenance attestation.** npm
  generates one by default under trusted publishing, and its registry verifies
  a bundle only from a gitlab.com shared runner; this project's shared-runner
  minutes are exhausted and it publishes from a self-hosted one, so the release
  stopped on that check with a `422` after the tarball was already built and
  signed. Publishing is still trusted publishing over OIDC — the credential is
  short-lived and no long-lived token exists in the pipeline — but a tarball
  from here has no verifiable link back to the commit that built it. It comes
  back the day npm supports self-hosted runners, or the day this project runs
  on a shared runner again. (MV-88, amending MV-68)

**Fixed**

- **A declared adapter reached whichever repo answered first, and stopped
  there.** Measured in an ecosystem of six: one sibling repo that somebody had
  run `specify init` in by hand months earlier made the scaffold return before
  it touched anything — the brain included — because presence was asked of the
  whole repo list and answered by the first hit. `doctor` printed
  `speckit: artifact ok` over five unequipped repos for the same reason, and
  the project-document check accepted that one repo's constitution as the
  ecosystem's, so the gate passed on a document five repos had never seen.

  One rule replaces the three reads: a **root** is the brain plus every
  declared repo present on disk, and one root's artifact never answers for
  another's. The scaffold runs the tool's own init in every root that lacks
  it and stays silent in every root that has it, a root whose init fails is
  reported in the tool's own words while the roots after it are still
  attempted, `doctor` prints one line per root, and the project-document gate
  asks each root where the tool is installed and names every one that fails.
  (MV-87, amending MV-75 and MV-76)

- **The mark showed the old colour in the terminal.** The lamp in flight was
  still amber while the site had long since moved to the acid accent, and
  `lockup.svg` still carried the old hex — three copies of one identity
  disagreeing about its own colour. The accent is now defined once and gated
  twice: by the TTY check for ordinary output, by its own argument for the
  drawing `init` prints. (MV-33)

**Added**

- **A declared repo that no change has touched gets its graph.** The code graph
  was only ever built for repos a change explicitly touched, so a repo had to
  be worked on before it could be navigated — backwards for an agent that reads
  the graph in order to do the work. The lifecycle now builds it once in every
  declared, present repo that has none, using the adapter's own `create` where
  it declares one; refreshing an existing graph is unchanged. (MV-87)

- **A repo can declare its own `sdd:`,** mirroring the per-repo `grapher:` the
  config already carried. The literal `none` means that repo has no
  spec-driven flow: never scaffolded, never gated, never reported as lacking
  anything — out of scope, not a gap. (MV-87)

- **`init` closes on a call to action instead of a full stop.** It used to end
  with "load the multivac skill", leaving the reader to discover session zero —
  that there are two flows and which one is theirs — from the door. It now
  prints three numbered steps with the branch already decided: tracked source
  in the repo means discovery (`multivac seed`), an empty repo means the
  interview. On a terminal the scaffolding lines are dim and that closing line
  is acid; piped output and `NO_COLOR` are byte-identical to before.

## 0.5.0 — 2026-08-17

**Fixed**

- **The site advertised a version nobody could install.** It deploys on every
  merge to `main` and its badge was held equal to `package.json` — but both of
  those sit at HEAD, so the pair agreed with each other while neither knew what
  the registry serves. The release sequence is bump → merge → *the site
  deploys* → tag → publish, so every release advertised an unpublished version
  for as long as that took; and a release abandoned after the bump merged would
  have advertised it **forever**, with the rule calling it correct.

  The site now states no version at all: the badge renders a parameter the
  release pipeline sets from the last git tag, which is a published version
  because publishing refuses a tag that disagrees with the manifest. What is not
  written cannot drift.

  Deployment is unchanged — site-only corrections still reach readers on merge,
  without a release being cut — and the pipeline's stages were reordered so a
  release's site follows the publication it describes and does not run if that
  fails. (MV-77, tightening MV-84 to forbid version literals on the site
  outright)

- **`change close --abandon` no longer releases a reserved invariant ID that an
  anchor names.** It archived the change first and then released against an
  *empty* anchor set, so the condition the law states — release only when no
  anchor names the ID — was never evaluated on that path. The ID could return
  to the pool with a live reference pointing at it, and the next `change new`
  would hand it out: MV-26's collision by another road. Both close paths now
  read the anchor set before archiving. (MV-45)
- No lifecycle command sweeps a tree with `git add -A`. `change apply` did, when
  creating a greenfield repo — harmless in itself, a repo made seconds earlier
  holding one file, but the law said *nowhere*, and the leg meant to hold that
  claim matched only a **comment** saying "never `add -A`" while the real call
  spelled the flag differently and stayed invisible. (MV-46)

**Documentation**

- Eight claims an external audit found overstating their code are corrected, and
  the ninth is recorded as examined and accurate. Two moved the code, three
  withdrew a clause that described something removed, two gained the ceiling
  they were missing, and two documents stopped contradicting the law:
  `CONTRIBUTING.md` told contributors to add an entry marked unsupported, which
  MV-28 forbids, and `DESIGN.md` described a `ripgrep` matching engine and a
  commit-sha-keyed cache that were designed and never built.
  (MV-21, MV-31, MV-51, MV-56, MV-57)

## 0.4.0 — 2026-08-17

**Added**

- **A brain now records the version it was deliberately brought to**, in
  `.multivac/projected.yml`, and every command tells you when your binary
  disagrees — in colour, with the command that closes the gap. Upgrading the
  binary never upgraded a brain: `npm i -g multivac@latest` replaces the
  projector, not the doors, skills, hook shims and harness settings it already
  wrote. Nothing is refused over a version; enforcement degrades, it never locks
  you out.
  - `mvac doors --adopt` re-projects **and** records. Bare `mvac doors`
    re-projects and leaves the record alone on purpose, so the notice survives a
    run made for an unrelated reason rather than going quiet without the upgrade
    having been taken.
  - `requires: ">=X.Y.Z"` in `.multivac/config.yml`, hand-authored, declares the
    minimum your team will trust. A binary below it gets the loudest notice.
    The tool never writes this field.
  - Existing brains have no record, which reads as an absence and not as an
    ancient version: you get the mildest notice, once, with the command to fix
    it. (MV-86, amending MV-29)

**Changed — read before upgrading**

- A command now **refuses an argument it does not declare** and exits 2, where
  four of the nine used to accept one and carry on. This can refuse a command
  line that worked before, so read the list:
  - `mvac doctor --sttrict` used to run the report **without** the strict
    assertion and exit **0** — a pipeline going green over a gate nobody had
    asserted was armed. It now refuses and names the flag.
  - `mvac doctor <dir>` and `mvac doors <dir>` used to **discard the directory**
    and act on the working one. Neither command declares a directory. They now
    refuse rather than answering about somewhere else.
  - `mvac seed --anything` used to ignore the flag; `mvac init --badflag` exited
    1 where the reference documents 2.
  - `mvac count --anything` already exited 2 but printed only its usage; it now
    names the argument it did not understand.

  What each command takes is its `--help` (MV-69), and the refusal is measured
  against exactly that. If a script of yours passes an argument a command never
  read, it was already having no effect — the difference is that you are told.
  (MV-85, strengthening MV-29)

## 0.3.0 — 2026-08-17

One behaviour changed in a way that can newly refuse a repository that was
passing. Read the first item before upgrading.

**Changed — read before upgrading**

- The anchor scanner **skips a line only when that line carries a complete
  anchor comment** — the opener the grammar defines, and the `-->` that closes
  it. Until now it skipped any line containing the substring `@anchor`
  anywhere, so `const evade = "user.name"; // @anchor` in your source was
  invisible to every leg: an `absent` tombstone over that pattern reported
  green at exit 0, and the same line without the seven-character suffix broke
  it. Those lines are now scanned. **If your repository has source, fixtures or
  docs mentioning `@anchor` outside a real anchor comment, a tombstone or a
  `count=N` ratchet over them can start refusing — that is the defect being
  fixed, not a regression.** `mvac count '<the leg>'` shows you the new match
  set before you decide.

  The ceiling, stated rather than implied: a line carrying **both** the opener
  and `-->` still hides, anywhere on the line, in any file, whether or not it
  is a well-formed anchor. The scanner tests shape and never grammar, because
  the fixtures that quote whole anchors inside string literals must keep
  hiding and a forgery is byte-identical to them in shape. Closing that needs
  something which is not a test on one line's shape. (MV-82)

**Documentation**

- The site sets its own type, and serves it from its own origin. Two variable
  faces — one for human language, one for machine output — with the width axis
  carrying the distinction, both stored in the repository with their licences.
  No typeface is fetched from a third party at page load, which is the same
  promise `verify` makes about the network. Nothing an installed tool does
  changes. (MV-83)
- Twenty-one statements across the site, `DESIGN.md` and the shipped skill were
  found to contradict the code and were corrected. The install page told
  readers the binary prints `1.0.0`, that the package is `private: true` and
  that it is unreleased — none of which has ever been true of a published
  multivac. Others miscounted the door registry, the command list, the door
  kinds and the leg states, or quoted output the tool does not print. (MV-84)
- The site's pages now carry **exactly one** version string, and a test holds
  it equal to the manifest. The three pinned version sites — tag, manifest,
  badge — were already held equal by MV-68 and MV-77; nothing covered a version
  somebody typed into prose, which is how `1.0.0` survived on the install page
  under a law table with 83 anchored rows. (MV-84)

## 0.2.0 — 2026-08-17

Five of these change behaviour for anyone already running the tool. Read this
section before upgrading.

**Changed — read before upgrading**

- `verify --strict` now **refuses a change that is finished but not closed** —
  every declared claim resolving and every declared repo recorded landed — and
  names it with the command that fixes it. Until now such a change was
  indistinguishable from one opened seconds ago: both reported `pending`, and
  pending never blocks. That grace hid fourteen claims in this repo for weeks.
  If you carry finished-but-unclosed changes, `--strict` will start refusing
  them, in CI too. `change close <slug>` is the whole fix. A change declaring no
  claims is never finished, and staleness of any kind is untouched. (MV-80)
- `verify` now **refuses a commit that flips a law row to `active` alongside the
  code that row anchors**. A rule and its evidence arriving under one hand is a
  rule nobody reviewed on its own. Commit the law file alone, then the code. The
  check reads the index against `HEAD`, so it answers only while a commit is
  being composed, and says so when it cannot answer rather than passing
  silently. (MV-81)
- `change land` now reads whether the work landed from the **channel ref**
  instead of commit containment, which a squashing forge defeats every time, and
  reports the ref, its sha and how long ago it was fetched. It offers the
  conclusion; recording it stays yours. (MV-80)

- `change plan` now **refuses** while the SDD's project-level document is
  missing, empty, or still the unfilled template its own tool shipped. A repo
  that declares `sdd:` and has never written its constitution will start being
  refused where it used to pass. Staleness stays a report: a document older than
  the law's newest row is named, never gated. (MV-76, amending MV-57)
- The lifecycle now **runs the SDD's own init** when its scaffold is absent —
  for spec-kit, `specify init --here --integration <harness> --force`, which
  reaches the network. It runs only from `change`, never from `verify`,
  `doctor` or `doors`, which stay offline (MV-01). This closes a deadlock:
  declaring an SDD in a repo where that tool has never run used to make the
  change that installs it unplannable. (MV-75)
- `doors` now **deletes** files under the skill directory it projects when the
  source no longer ships them — including one you put there yourself, because
  nothing on disk records who wrote it. The prune is bounded to multivac's own
  skill directory and never its parent, so a sibling tool's skills are untouched.
  (MV-73)

**Fixed**

- `core.hooksPath` is read the way git reads it. An absolute or `~`-spelled
  value was joined onto the repo root, so the hook shims landed in a directory
  tree named after the machine's filesystem while `init` printed the real path
  as the place they went and `doctor` called them missing from the directory
  they were sitting in. **The enforcement gate was disarmed in silence** for any
  repo with an absolute hooksPath — every `git worktree` inherits one. Every
  read now goes through `git config --path`, and directory identity is decided
  after resolution rather than by comparing text. (MV-79, amending MV-37)
- The managed `.claude/settings.json` merge no longer replaces a hook entry it
  did not write. It claimed any entry whose command merely *contained*
  `mvac verify`, then overwrote that entry's whole hooks array and its matcher —
  deleting a user's own commands and flags. Ownership is now the individual
  hook, matched exactly; where that leaves an event ungated, multivac adds its
  own entry beside yours and says so. (MV-74, amending MV-52)

**Added**

- A changelog, on both surfaces. This file is the only copy; the documentation
  site mounts it rather than keeping a second one. (MV-78)
- The version the site advertises is pinned to the version the package declares.
  (MV-77)
- In multivac's own repository, the committed copy of the skill its harness
  reads, `.claude/skills/multivac/`, is held to the `skills/multivac/` the
  package ships by a test — same files, same bytes — because no anchor can
  compare two trees. (MV-72)
- `doctor` now states, in its own report, that who enacts a law row cannot be
  checked by this tool — identity is not a fact on disk — and names where it is
  enforced instead. Declared ungateable with its reason rather than left absent
  from the law. (MV-81)
- `Adoption` and `Composition` in the docs: the arc from `init` to steady state
  and which phase buys what, and why spec-driven tools and code graphers are
  built on rather than competed with.

## 0.1.1 — 2026-08-16

**Fixed**

- Enumeration counts each tracked file once. A tree mid-merge keeps three index
  entries per conflicted path, so every match inside such a file was counted
  three times: a `count=2` leg reported `found 6` and advised ratcheting to 6 —
  advice that, followed, would have written a corrupted number into the law over
  an unrelated merge. Runs taken mid-merge now say so instead of judging a tree
  nobody will commit. (MV-71)

**Added**

- `--help` on any command prints that command's own flags and arguments. Five of
  nine commands previously printed only a one-line description; `init --help`
  said nothing about `[dir]`, `--provider`, `--sdd`, `--grapher` or `--quiet`.
  Where a flag's legal values come from the adapter registry they are rendered
  from it, so a new adapter cannot leave the help behind. (MV-69)
- `init --provider <name>` now writes that harness's door, skill and hooks in the
  same run, instead of recording a name and leaving a second command to be
  discovered. (MV-70)

**Removed**

- `aider` is no longer an adapter entry. It sat there marked unsupported,
  carrying a note explaining at length why none of it applied, and read as
  support to everyone who did not open it. An unknown name already gets the list
  of what is supported, which is the answer that helps. (MV-28)

**Documentation**

- The integrations reference says why `doors` is a list of doors to project and
  not a list of providers to choose from.

## 0.1.0 — 2026-08-16

**Added**

- First release. `npx multivac init` scaffolds a brain, arms the git hooks, and
  writes the canonical `AGENTS.md` door.
- Published by trusted publishing (OIDC) on a `v<semver>` tag only, and the job
  refuses unless the tag equals the version in `package.json`. No long-lived
  publish token exists to leak or rotate, and a release is a decision somebody
  makes rather than a side effect of a merge. The published tarball carries
  `dist` and `skills` by allowlist — this repo's own brain, site and tests never
  ship. (MV-68)
