# Contract: what the commands print and read

Lines are printed exactly; tests pin the load-bearing substrings. ANSI colour is stripped here:
`root`, like `read`, is printed dimmed. `<…>` is a placeholder; `…` elides text the line
already prints today. The samples of this brain are its main checkout's output (branch
`claude/amazing-franklin-mjvzu0`), drafted at `62d4588` and re-measured at apply (T001) on
`915889f`, the tree with the three earlier changes merged: 151 claims, 150 anchored, MV-151
unanchored while it is only reserved. Everything not named here prints byte for byte as before.

## Where a run roots

`verify` (and, through the same resolver, `count` and the dispatcher's notice) resolves the
directory it is asked from — `[dir]`, the payload's session directory under a hook, or the
working directory — before it reads any config.

| Asked from | Root | Prints | Exit |
| --- | --- | --- | --- |
| a brain's root | the brain | the report, no root line | as today |
| any directory inside a brain (`src`, `.multivac/hooks`, `.multivac/worktrees`, `.multivac/worktrees/<slug>`) | the brain (nearest `.multivac/config.yml` up to the toplevel) | the root's report + the root line | the root's |
| any directory of a brain change worktree `<brain>/.multivac/worktrees/<slug>/<key>` | that worktree, a brain | its own report, siblings read per *Siblings from a brain change worktree*; root line below its root | its own |
| a mount `<consumer>/.brain`, or below it | the mount, a brain | a brain-scoped report; a missing sibling worded per *Missing siblings*; root line below the mount's root | as today |
| a consumer's root or any directory in it (mount `.brain`, or a single child brain) | consumer, rooted at the toplevel | `scoped to repo "<key>" · brain at <mount>` report + root line below the root | the consumer's |
| a consumer whose brain declares `mount: docs/brain` (root, `src`, `docs`) | consumer, rooted at the toplevel (the `.gitmodules` path its brain names) | `scoped to repo "<key>"` + root line below the root | the consumer's |
| a monorepo subproject `services/api` holding a `.brain` its brain names, or below it | consumer, rooted at `services/api` | `scoped to repo "<key>"` + root line below `services/api` | the subproject's |
| a consumer directory holding an unnamed brain fixture (`test/fixtures`) | the consumer at the toplevel; the fixture only from inside it | `scoped to repo "<key>"` + root line | the consumer's |
| a consumer change worktree `<brain>/.multivac/worktrees/<slug>/<key>`, or below it | consumer via the worktree | `scoped to repo "<key>" · brain at <brain> (the change worktree for <slug>)` + root line below the worktree | the consumer's |
| a repository with a door and no brain in reach, any directory | door | `` <top> was NOT verified — it carries a multivac door but no brain is mounted here. Nothing in this checkout was checked against any law. Fix: run `multivac repos sync` in the brain, then commit the mount here. `` | 0 |
| a repository with a stale pin: its root / below it | — | MV-49's text / the same plus ` Run it in <host>.` | 2 |
| a submodule of a superproject holding a brain or a mount | — | `<top> is a submodule of <superproject>, which multivac verifies from there — nothing was verified here` | 2 |
| a submodule its superproject pins stale | — | MV-49's text relative to the superproject, plus ` Run it in <superproject>.` | 2 |
| the toplevel of a repository no brain governs | — | today's `` no .multivac/config.yml in <dir> — run `multivac init .` to create it `` | 2 |
| below such a toplevel | — | `<dir> is inside <top>, which no brain governs — nothing was verified` | 2 |
| below such a toplevel, a directory holding a brain its `mount:` does not name (a workspace) | consumer of that brain, rooted at the directory | today's `` this checkout matches no repo declared in the brain at <child> — run `multivac verify --repo <key>` (declared: …) `` | 2 |
| a directory in no git repository | — | `<dir> is in no git repository — nothing was verified; the brain at <child> verifies from there`, or today's no-config text when it holds no child brain | 2 |
| a repository git refuses (dubious ownership, …) | — | `git rev-parse --show-toplevel failed in <dir>: <git's fatal line>` | 2 |

MV-49's text, unchanged but for its tail:

```text
<rel> is mounted but is not a multivac brain — its pin predates the brain, or points at the wrong commit. Update the submodule (git submodule update --remote <rel>) or fix the pin. Run it in <host>.
```

`<rel>` is relative to `<host>`; ` Run it in <host>.` is added only when the run was asked from
somewhere other than `<host>`. An ambient `GIT_DIR`, `GIT_WORK_TREE` or `GIT_INDEX_FILE` never
changes any answer above.

## The root line

A report printed in full, when the root is not the directory asked (compared by real path),
carries one line after its header lines and before the first `read` line:

```text
  root      <root> (asked from <start>)
```

`<start>` is relative to `<root>` when it lies inside it, else absolute. A brain root from `src`
(this brain, 348 B + 49 B):

```text
151 claims · 150 anchored (99%)
  unanchored: MV-151
  root      /home/user/multivac (asked from src)
  read      brain: working tree on claude/amazing-franklin-mjvzu0 @ 915889f — the brain's own repo, the commit this run gates

  ok        150
  enact     not answered — nothing staged, so no commit is being composed; MV-81's check reads the index against HEAD

0 blocking broken · exit 0
```

A consumer from `db/migrations`:

```text
scoped to repo "api" · brain at /home/you/eco/acme-api/.brain
3 of 4 brain claims anchor into "api"
  root      /home/you/eco/acme-api (asked from db/migrations)
  read      api: working tree on main @ 1a2b3c4 — this checkout, the content about to be committed here
…
```

From a symlinked path to the root, no root line. The quiet line never carries one.

## Siblings from a brain change worktree

Read at `<brain>/.multivac/worktrees/<slug>/<brainKey>`, each sibling `<key>` is read in
`<brain>/.multivac/worktrees/<slug>/<key>` when that checkout exists, else where the main
checkout reads it (`resolve(<brain>, path)`). The read line is today's for whichever checkout
is read — e.g. `api: working tree on demo @ 4d5e6f7 — --worktree: local state, not the
channel` under `--worktree` when the change has its own `api` worktree, or `api: origin/main @
1a2b3c4 — the channel, as published (last fetch 3m ago)` from the main checkout's sibling.

## Missing siblings

| Read from | Read line | Each leg's detail |
| --- | --- | --- |
| a brain's main checkout (today) | `` <key>: not on disk — nothing read; run `multivac repos sync` `` | `` repo not on disk — run `multivac repos sync` to clone it `` |
| a brain change worktree | `` <key>: not on disk — nothing read; run `multivac repos sync` in <main checkout> `` | `` repo not on disk — run `multivac repos sync` in <main checkout> `` |
| a mount (its own toplevel, named by its host's `mount:`) | `<key>: not on disk beside this mount — nothing read; verify in <host> for its verdict, or from a brain checkout` | `repo not on disk beside this mount — verify from a brain checkout` |

`doctor`'s repos fact, read from a brain change worktree:
`` <key> missing → `multivac repos sync` in <main checkout> (git clone <url> <path>) ``; from the
main checkout, today's text.

## Refusals that name the enclosing brain

Every command's refusal for a missing `.multivac/config.yml`, when the directory lies below a
brain in the same checkout:

```text
no .multivac/config.yml in <dir> — it is inside the brain at <brain>; run this there
```

Otherwise today's `` no .multivac/config.yml in <dir> — run `multivac init .` to create it ``,
byte for byte (a checkout root with no brain; a directory whose own `.git` stops the walk). Exit 2,
as today. Measured: 117 B at `/home/user/multivac/src`.

## Quiet

Switched on by `--quiet`, by `MULTIVAC_QUIET=1` in the command's environment (the git shims
export it), or by the session-start payload. The run prints **one line** when every line has a
quiet form, then, beneath it, the full line of each read that is not plain and each `stale`
pin that does not gate. Anything else off prints the whole report, byte-identical to the run
without quiet, both streams in the order they were written.

**The brain form**:

```text
<n> blocking broken · exit 0 · <n> claims · <m> anchored (<p>%)[ · unanchored: <ids>] · read <clauses> · <enact clause>[ · code → <slug>][ · .multivac/ecosystem.json stale (`multivac doors`)]
```

(`absent` in place of `stale` when the file is missing.) This brain, from the root or `src`,
195 B:

```text
0 blocking broken · exit 0 · 151 claims · 150 anchored (99%) · unanchored: MV-151 · read brain claude/amazing-franklin-mjvzu0 @ 915889f (working tree) · enact not answered (nothing staged)
```

A code commit on an open change's branch, 215 B with this change's slug (219 B with graph-answers-where-asked's, as measured):

```text
0 blocking broken · exit 0 · 151 claims · 150 anchored (99%) · unanchored: MV-151 · read brain verify-rooted-and-quiet @ <sha> (working tree) · enact none (law untouched) · code → verify-rooted-and-quiet
```

A code-less brain with two siblings at their channel:

```text
0 blocking broken · exit 0 · 3 claims · 3 anchored (100%) · read api origin/main @ 1a2b3c4 (last fetch 3m ago), web origin/main @ 5d6e7f8 (last fetch 3m ago), brain main @ 9a8b7c6 (working tree) · enact not answered (nothing staged)
```

**The consumer form**:

```text
<n> blocking broken · exit 0 · <m> of <n> brain claims anchor into "<key>" · brain at <dir>[ (the change worktree for <slug>)] · read <key> <branch> @ <sha> (working tree) · enact not answered (decided in the brain)
```

**Read clauses**:

| Read | Clause |
| --- | --- |
| the brain's own, or a brain==code key's, with a commit and no drift or merge suffix | `<key> <branch> @ <sha> (working tree)`, or `<key> detached @ <sha> (working tree)` |
| a sibling at its channel, fetched here, not parked, not mid-merge | `<key> <channel> @ <sha> (last fetch <age> ago)` |
| a consumer's own checkout | `<key> <branch> @ <sha> (working tree)` |
| anything else — fell back, `--worktree`, OFF channel, parked, never fetched here, behind its own channel, MID-MERGE, not on disk, no commits, the brain read at its channel | none: its full `  read      …` line prints beneath the one line |

**Enact clauses**: `enact not answered (nothing staged)`, `enact not answered (no commit here
yet)`, `enact none (law untouched)`; in a consumer `enact not answered (decided in the brain)`.

**Beneath the line** — one parked sibling:

```text
0 blocking broken · exit 0 · 3 claims · 3 anchored (100%) · read web origin/main @ 5d6e7f8 (last fetch 3m ago), brain main @ 9a8b7c6 (working tree) · enact not answered (nothing staged)
  read      api: origin/main @ 1a2b3c4 — the channel, as published (last fetch 3m ago) (this checkout is parked on wip @ 0f1e2d3, not read)
```

and two pins one commit behind the channel (476 B in all): the one line, then the two
unchanged `  stale     <key>: … pin 1 behind …` lines.

**What always prints the whole report** (quiet or not, byte for byte):

- a parse diagnostic;
- any count line other than `ok`, and any leg line;
- a finished-change line, change-file-cites' "close refuses until" variant included;
- a `stale` pin that gates;
- an `enact` line saying the index is unreadable, that no row reached active (a staged law),
  that rows are enacted alone, or that enactment is refused;
- any `config` line, MV-97's "is new here" included;
- the mounted SDD refusal (`sdd … in the mounted brain's config`);
- law death (`law REFUSED …`);
- the pending summary (`… held pending by open change …`) and the drift summary;
- a `code` line other than `… lands in open change <slug>` with no `SDD skipped at`;
- an open change file that does not parse, and an anchor whose ID names no row (neither is
  named — the full report stays silent about both, as today);
- any warning during the run, before or during the report (`--repo` in a brain, an unknown
  frontmatter key, …);
- a non-zero exit or blocking count.

The exit code is the same with and without quiet.

## Harness hooks

`.claude/settings.json` is unchanged, byte for byte:

```text
SessionStart  → mvac verify 2>&1 || true
PostToolUse   → mvac verify >&2 || exit 2          (matcher Edit|Write|MultiEdit)
PostToolUse   → the grapher refresh hooks graph-answers-where-asked and codegraph-worktrees-and-verbs write, unchanged
```

What `verify` reads, only with no `[dir]` and `CLAUDE_PROJECT_DIR` set in its environment
(the claude target's declared payload):

| Payload | Effect |
| --- | --- |
| `{"hook_event_name":"SessionStart","source":"…","cwd":"<dir>",…}` | the run starts at `<dir>` and is quiet |
| `{"hook_event_name":"PostToolUse","tool_input":{"file_path":"<file>"},"cwd":"<dir>",…}` | the run follows `<file>`'s checkout when a consumer, a door or a brain that is its own git toplevel governs it; otherwise it verifies `<dir>`'s root |
| any other event, a payload that does not parse, a terminal | ignored: an ordinary run |

`cwd` missing or not a directory: `CLAUDE_PROJECT_DIR`'s value, else the process's directory.
A followed red delivers, after the harness's own prefix (`PostToolUse:Edit hook blocking error
from command: "mvac verify >&2 || exit 2": `), the followed root's full report with its root
line, which names the session's directory it was asked from — e.g. `  root      /home/user/multivac/.multivac/worktrees/demo/brain (asked from /home/user/multivac)`, 96 B with its newline.

## `count`

```text
<top> carries a multivac door but no brain is mounted here — nothing to count against
```

exit 2, where no brain is mounted; with no root at all, the resolver's message, exit 2. In a
consumer the consumer's own key reads `<key>: working tree <on branch @ sha> — this checkout,
the content about to be committed here`; every other key as before.

## `doctor`, `doors`, `roadmap`

When the brain that holds the directory is not the directory (compared by real path), each
prints one line before its own output:

```text
root      <brain> (asked from <dir>)          ← doctor
root: <brain> (asked from <dir>)              ← doors, roadmap
```

`doctor` from a brain change worktree: `repos      2/2 cloned` where the main checkout has both
siblings. `roadmap` from a brain's `src` with one planned change: the root line, then `roadmap:
1 planned` and its listing.

## The version notice

Unchanged text (MV-86), read from the brain of the root the directory resolves to, for
`verify`, `count`, `doctor`, `doors` and `roadmap`. In a consumer only the red lines print:

```text
mvac: this brain requires >=<floor> and you are running <version> — the gate is below the floor this team declared. npm i -g multivac@latest
mvac: requires: "<raw>" is not a floor — write ">=X.Y.Z". It is the only form accepted, because a range grammar is a parser and MV-02 pins the dependency count
```

The yellow record lines (`` … run `mvac doors --adopt` … ``) print in brain checkouts only, a
mount included. A failed resolution reads the directory's own config, as today; no exit code moves.

## `verify`'s surface

```text
$ mvac verify --loud
unknown flag "--loud" — verify takes [dir], --strict, --check, --worktree, --repo <key>, --range <base>..<head>, --branch <name>, --quiet
```

Usage lines (`multivac help verify`), changed lines only:

```text
usage: multivac verify [dir] [--strict] [--check] [--worktree] [--repo <key>] [--range <base>..<head> --branch <name>] [--quiet]
  --quiet       one line when nothing is off; the full report otherwise
                (also MULTIVAC_QUIET=1, which the git shims export)
[dir] is any directory of a checkout: the run reads the checkout that holds
it, and a full report printed away from that root names it in a root line.
```

and the closing sentence becomes "Every run prints a `read` line per repo — on a quiet run a
clause of its one line — naming the ref or branch and its sha, and one `enact` line (MV-81): …".

## The git shims

`.multivac/hooks/{pre-commit,pre-merge-commit,pre-push}`, regenerated by `multivac doors`, gain
three lines after the chain block and before `# The build is used only when this repo IS
multivac`:

```sh
# One line when nothing is off; the full report otherwise. An env var, not a
# flag: a binary that predates it ignores it and prints in full.
export MULTIVAC_QUIET=1
```

No emitted line names a row ID or a version. The documented manual chain line `mvac verify ||
exit 1` is unchanged and keeps the full report.
