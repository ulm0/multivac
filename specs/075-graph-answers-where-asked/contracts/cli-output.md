# Contract: what the commands print and write

Lines are printed exactly; tests pin the load-bearing substrings. `<name>` is the grapher,
`<artifact>` its first artifact, `<k>` a config key, `<path>` a declared path, `<brain>`,
`<ws>`, `<abs>` absolute directories (single-quoted when they hold whitespace or a quote, an
embedded `'` written `'\''` as a shell reads it). Byte counts
are `wc -c` of the lines, each ending in a newline, with the synth ecosystem's example names
(research.md R6, R8). A brain that holds code, a consumer, and a brain with no grapher print
byte for byte what they printed before, except where a section below says otherwise.

## The brain door

### A brain that holds no code (in place of the grapher lines)

The head, then one group per grapher asked from the brain, in config order:

```
- This brain holds no code, so it keeps no code graph: each code repo keeps its own. ASK IT BEFORE READING THE TREE RAW, from here, with each verb's flag pointed at a repo below — in a change, the flag `change apply` printed under that repo's checkout; paths in its answers are relative to the checkout the flag names.
```

A shared artifact (graphify), its repos resolving it:
```
  - `graphify` at `graphify-out/graph.json` (web: `../web`, api: `../api`), refreshed after your edits there, and committed on the change branch by `change land`:
    - `graphify query "<question>" --graph <checkout>/graphify-out/graph.json` — a question in plain words — returns the subgraph that answers it, walked outward from the best-matching nodes
    - `graphify explain "<node>" --graph <checkout>/graphify-out/graph.json` — one node and its neighbours, described in prose
    - `graphify path "<A>" "<B>" --graph <checkout>/graphify-out/graph.json` — the shortest path between two nodes — how A actually reaches B
```

A local artifact (codegraph) — never `<checkout>`:
```
  - `codegraph` at `.codegraph/codegraph.db` (svc: `../svc`), refreshed after your edits there; built in each checkout, never committed — a change's worktree has none yet, and `-p` at it answers from the nearest index above it, or fails:
    - `codegraph query <symbol> -p <repo>` — symbol search by name — `--kind function|class` narrows it, `--limit N` bounds it, `--json` makes it machine-readable
```

The freshness is `refreshed after your edits there` only where a declared door has a post-edit
hook and the brain's hook is declared to run this grapher (`brainRefreshGrapher`); otherwise
`refreshed at \`change land\` and \`change close\``. Declarations alone (MV-93): the door is
the same bytes on a machine where `doors` could not wire that hook, and `doors` and `doctor` say so there. The repos are `<k>: \`<path>\`` joined by `, `. A grapher with no `queries` gets
`    - \`<name>\` has NO query command: the artifact is written but nothing reads it back. Do not invent one.`
under its group line.

A grapher no writable code repo resolves (no repo declared, or every one `managed: false` or
`grapher: none`), no verb:
```
  - `graphify` at `graphify-out/graph.json`: no writable code repo resolves it yet — each one that does gets its own when `repos sync` or a change reaches it
```

An unverified grapher: no line (the `doors` notice stays). No group rendered: no head.

Sizes (plan): head 321 B; the two-repo graphify block 954 B (967 B with the lifecycle
freshness); the codegraph block 728 B; the unresolved line 160 B. No line of the block cites a
`## <name>` section.

### A brain that holds code

`grapherLines`' two lines, byte for byte, then one line — graphify (316 B):
```
  It answers for this checkout, with the law, the changes and their specs kept out of it: the ecosystem graph above relates them. A change's worktree has its own, as of its last refresh: add `--graph <worktree>/graphify-out/graph.json` (`change apply` prints it); paths in its answers are relative to that worktree.
```
codegraph (269 B):
```
  It answers for this checkout, with the law, the changes and their specs kept out of it: the ecosystem graph above relates them. A change's worktree has no index yet: `codegraph` asked from here or there answers from this checkout's index, without the branch's edits.
```
A grapher with no `askAt`: the first sentence alone. The first sentence says the law, the changes
and their specs are kept out only where the grapher has an ignore file (graphify) or is recorded to
index no Markdown (`codeOnly`, codegraph); another grapher's reads `  It answers for this checkout;
the ecosystem graph above relates the law, the changes and their specs.` A grapher with no query
verb gets no such line: the line above it says nothing reads its artifact back.

Sibling code repos resolving a grapher, after it, in the code-less form under this head (282 B):
```
- The other code repos keep their own graphs. ASK IT BEFORE READING THE TREE RAW, from here, with each verb's flag pointed at a repo below — in a change, the flag `change apply` printed under that repo's checkout; paths in its answers are relative to the checkout the flag names.
```

### The ecosystem verbs

For the brain, graphify's three `--graph .multivac/ecosystem.json` verbs, as today, where
graphify is among the graphers asked from the brain — a code-less brain with no repo and
`grapher: graphify` included. A consumer's are unchanged.

### A kept install

One line per grapher found, after the graph lines — graphify (210 B):
```
- `graphify-out/` here is a leftover that holds no code: the `## graphify` section below and graphify's own hooks point at it — ask the code repos' graphs above instead; `multivac doctor` prints its removal.
```
A grapher found with no harness platform probe present (codegraph, 138 B):
```
- `.codegraph/` here is a leftover that holds no code — ask the code repos' graphs above instead; `multivac doctor` prints its removal.
```
`init` and `doors` write the same bytes. `<dir>/` is the artifact's top directory, named where
the artifact or that directory is there; an artifact at the root is named as it is; with neither
there, the ignore file, else the first platform probe found (`.agents/skills/graphify/SKILL.md`).
The clause after the colon names the section only where a platform found writes it into this
door — `canonical`, or `own-door` for a declared door that is a symlink (the rule `sectionDoors`
reads) — and the hooks only where a platform found writes one that sends the agent to the graph
(`hooks`: claude's and gemini's on 0.9.29): `the \`## graphify\` section below points at it`,
`graphify's own hooks point at it`, both as above, or no clause (an `agents` skill alone).
Where the door lists no code repo's graph — no grapher is asked from the brain, or the one asked
is unverified — the line says `ask the code repos' graphs instead`, without `above`:
```
- `graphify-out/` here is a leftover that holds no code: graphify's own hooks point at it — ask the code repos' graphs instead; `multivac doctor` prints its removal.
```

## `change apply`

Under each `  <k>: <ws>` line of `work here — one checkout per repo, nobody else's tree moves:`,
at most one line, four spaces in (plan bytes with `/home/you/…` paths):

```
    its graph: --graph <ws>/graphify-out/graph.json — paths in its answers are relative to this checkout
    its index: -p <abs> — paths in its answers are relative to this checkout
    no graph in this checkout yet (`change land` commits one) — --graph <abs>/graphify-out/graph.json answers for the base, without this branch's edits; paths in its answers are relative to <abs>
    no codegraph index in this checkout — -p <abs> answers for the base, without this branch's edits; paths in its answers are relative to <abs>; -p at this checkout answers from the nearest index above it, or fails
    no graph here or in <abs> yet — `change land` builds and commits one here
    no codegraph index here or in <abs> yet — -p at either answers from the nearest index above it, or fails
    no graph here yet — `change land` builds and commits one here
    no codegraph index here yet — -p here answers from the nearest index above it, or fails
    its graph cannot be pointed at — <reason>
    its index cannot be pointed at — <reason>
```

156 B, 87 B, 214 B, 234 B, 88 B, 119 B for the first six. The flag is the entry's `askAt` with
`{checkout}` replaced; "graph"/"index" follows `artifactKind` (`shared`/`local`); "codegraph" is
`<name>`. Nothing is printed for a grapher that is none, unverified or has no `askAt`, or for the
brain's own main checkout. Which line prints: data-model.md *Pointer states*. Every line that
offers a flag aimed at a checkout says where its answers' paths are placed; the sixth and the
eighth name `-p` only to warn what it does where no index is, offer none, and carry no such
clause (FR-008, analyze I4). A `<reason>` read in the repo checkout rather than the workspace
ends ` in <abs>`.

## `change plan` (a change naming `brain`, a code-less brain)

The repo line reads `brain: <brain> (the brain)` in place of `(brain==code)`, and, where a
grapher is declared (197 B):
```
brain: named by this change, but no repos entry is the brain — no code graph is built, gated or landed here; if the change lands code in the brain, declare `brain: .` under repos: in this change
```

## `change land`

The ignore step, when it appended (before the refresh):
```
graph graphify @ <k>: wrote .graphifyignore (+N) before the refresh at `change land`
```
When the file is neither committed at the branch checkout's HEAD nor absent there and in the
repo's own checkout — untracked there, or in the repo's own checkout:
```
<k>: .graphifyignore in <abs> is not committed — the graph on <slug> is built without it; commit it there the way that repo lands work
```
Committed in the repo's own checkout, on its branch, but not on the change's:
```
<k>: .graphifyignore is committed in <abs> but not on <slug> — the graph on <slug> is built without it; merge that commit into <slug>, or rebase <slug> onto it, then re-run land
```
Committed at the branch checkout's HEAD with an uncommitted edit there:
```
<k>: .graphifyignore in <abs> has uncommitted edits — multivac appends nothing over them, and the graph lands without it; commit or discard them there, then re-run land
```
Absent, and ignored by the branch checkout's own rules:
```
<k>: .graphifyignore is ignored in <abs> — the graph lands without it; `git -C <abs> check-ignore -v .graphifyignore` names the rule: remove it to land the lines multivac keeps out
```
In each of these four, nothing is written and the graph is committed alone.
The refresh, at land or close, while the graph holds a node under a recorded line (`rebuild
failed` and `rebuild skipped` in place of today's `refresh failed` and `refresh skipped` there):
```
graph graphify @ <k>: rebuilt (`graphify update . --force`) — artifact left uncommitted
```
When the rebuilt graph still holds a node under a line it just recorded:
```
graph graphify @ <k>: the rebuild left <N> node(s) under the lines just added to .graphifyignore — it is restored and not committed; the next `change land` naming <k> appends them again and rebuilds
```
Restored: checked out to its committed bytes where it was committed, deleted where land created
it. `change close` refreshes the repo's own checkout, whose file then records none of those
lines, so it never forces a rebuild for them: only a later land does.
The commit stages `graphify-out/graph.json .graphifyignore` (and `.multivac/ecosystem.json` in a
brain checkout). No `.gitignore` is written. When that commit fails, land names the command, as
`commitBookkeeping` always has, and prints no push or merge line for that repo; it exits 1.

## `change close`

A worktree whose every uncommitted path is under its grapher's `local` globs is removed with
`--force`, printing the existing `<k>: worktree removed (<wt>)`. In a code-less brain the archive
commit's pathspec names no brain graph.

## The ignore file

Appended, never rewritten; one record per append, after the lines it lists (data-model.md
*Ignore writing*):
```
/.agents/
/.claude/
…
/specs/
# multivac: kept out of the graph — /.agents/ /.claude/ /.codex/ /.copilot/ /.cursor/ /.gemini/ /.husky/ /.multivac/ /.opencode/ /.specify/ /openspec/ /specs/
```
(this brain at 92c4c08, re-derived at 116a719; a consumer: the same set without `/specs/`, plus `/.brain/`). The first
build prints, as today, `graph graphify @ <scope>: wrote .graphifyignore (+N) and .gitignore (+M)
before the first build`, N counting lines, never the record.

## `init`

In a code-less brain declaring a grapher (187 B):
```
init: graphify is declared, and this brain holds no code (no repos entry is the brain), so no graph is built here — each code repo gets its own when `repos sync` or a change reaches it
```
`init --grapher graphify` in an empty repo exits 0 with graphify off PATH (today exit 1,
`init refused — graphify: …`).

## `doctor` (label padded to 11 columns)

The fact line, a code-less brain where a grapher is asked from the brain or a leftover is found,
in place of `none @ brain: no grapher declared` (211 B):
```
grapher    brain: holds no code (no repos entry is the brain), so no code graph is built, gated or refreshed here — agents here ask the code repos' graphs; if this repo holds code, add `brain: .` under repos:
```

A kept graphify install (674 B for `[agents, claude]`):
```
grapher    leftover graphify install @ brain: platforms agents, claude and graphify-out/graph.json (tracked) — kept until you remove it; it graphs none of the code, and graphify's own section and hooks still send agents to it. Remove: cd <brain> && graphify uninstall --project --platform agents && graphify uninstall --project --platform claude && git rm -q --ignore-unmatch -- graphify-out/graph.json .graphifyignore && rm -rf graphify-out .graphifyignore; review `git diff` (the uninstall drops the whole hook group it wrote, commands you added to it included, and leaves an emptied hook list in each settings file it touched), then `multivac doors` and commit
```
With `gemini` among the platforms found, `graphify uninstall --project --platform gemini` comes
first; the rest follow in registry order. With no platform probe present, the `platforms …
and` part and the section clause go and the removal is the `git rm … && rm -rf …` part. The
clause names the section only where a platform found writes one (`section` not `none`) and the
hooks only where one writes a hook that sends the agent to the graph (`hooks`): `, and
graphify's own section still sends agents to it`, `…own hooks still send…`, both as above, or
none — an `agents` skill alone:
```
grapher    leftover graphify install @ brain: platforms agents (untracked) — kept until you remove it; it graphs none of the code. Remove: cd <brain> && graphify uninstall --project --platform agents && git rm -q --ignore-unmatch -- graphify-out/graph.json .graphifyignore && rm -rf graphify-out .graphifyignore; review `git diff` (…), then `multivac doors` and commit
```

A kept codegraph index (214 B):
```
grapher    leftover codegraph index @ brain: .codegraph/codegraph.db (local) — kept until you remove it; it indexes none of the code. Remove: cd <brain> && codegraph uninit --force, then `multivac doors`
```
A kept graph of a grapher under `graphers:`:
```
grapher    leftover <name> graph @ brain: <artifact> (tracked|untracked) — kept until you remove it; it graphs none of the code. Remove: cd <brain> && git rm -q --ignore-unmatch -- <artifact> && rm -f <artifact>, then `multivac doors` and commit
```
`doctor` never prints `graphify update .` or `graphify install` for a brain that holds no code;
its exit code is unchanged.

The refresh path, a code-less brain:
```
grapher    refresh path: <doors> post-edit hook follows your edits into the code repos' checkouts (installed when the binary is present) · `change land` commits it on the change branch · `change close` is the net · git hooks never refresh
grapher    refresh path: <doors> post-edit hook follows your edits into the code repos' checkouts (installed when the binary is present) · not into the change worktrees of <keys>: they reach <name> only in their own node_modules/.bin, which a worktree does not hold · `change land` commits it on the change branch · `change close` is the net · git hooks never refresh
grapher    refresh path: `change land` and `change close` only — the code repos resolve graphify and codegraph, and the brain's one post-edit hook runs one command · git hooks never refresh
grapher    refresh path: `change land` and `change close` only — `<bin>` is not reachable from every code repo that resolves <name> (PATH, or each one's node_modules/.bin) · git hooks never refresh
grapher    refresh path: none yet — no writable code repo resolves <name>, so the brain's post-edit hook has no checkout to follow edits into · git hooks never refresh
```
The second is the first where some of those repos reach the binary only in their own
`node_modules/.bin` and not on PATH (`brainHook`'s `local`, joined `a and b`): the hook is wired,
and a change worktree, which holds no untracked `node_modules`, gives it no binary, so an edit
there runs nothing — a stated ceiling. The fifth is a grapher declared that no writable code repo resolves — every fresh `init
--grapher <name>` in an empty repo (analyze U1); `<name>` reads `a grapher` where none is asked
at all. A name the registry does not know and `graphers:` does not declare, resolved by the code
repos or by none, is wired and refreshed by nothing (MV-59):
```
grapher    refresh path: none — <name> is not verified, so no post-edit hook, `change land` or `change close` runs it · git hooks never refresh
```
These answer for this machine: the door and flow.md, which read declarations alone (MV-93), say
"after your edits" of the grapher the hook is declared to run, where the first form is printed on
a machine that found the binary and the fourth on one that did not. The names of the third are joined `a and b` (`a, b and c`). A brain that holds code
keeps today's line, and with no declared door having a post-edit hook every brain prints today's
`refresh path: \`change land\` and \`change close\` only — no declared harness has a post-edit
hook · git hooks never refresh`. All six forms ask `brainHook` (detect.ts), the answer `doors`
wires by.

Ignore facts appended to an installed, writable root's grapher line, reading only:
```
 · .graphifyignore lacks N line(s) multivac keeps out of the graph (/.agents/, /.codex/) — the next `change land` naming <k> appends them, and rebuilds if the graph holds nodes under them
 · .graphifyignore is not committed — a clone or worktree graphs without it
 · the graph still holds N node(s) under .graphifyignore's lines — a plain refresh refuses to shrink; run `graphify update . --force` there
```

## `doors`

One notice, where no brain hook can be wired in a code-less brain:
```
brain: notice: no post-edit graph refresh here — the code repos resolve graphify and codegraph, and one hook runs one command; `change land` and `change close` refresh them
brain: notice: no post-edit graph refresh here — `<bin>` is not reachable from every code repo that resolves <name> (PATH, or each one's node_modules/.bin); `change land` and `change close` refresh them
brain: notice: no post-edit graph refresh here — no writable code repo resolves <name> yet, so there is no checkout to follow edits into; `multivac doors` wires it once one does
```
The third where a grapher is declared and no writable code repo resolves it (analyze U1). None
of the three prints where no declared door has a post-edit hook — nothing could be wired there in
any brain, and `doctor`'s refresh path says so — or where no grapher is asked from the brain.
Where that grapher is unverified, the third gives way to today's `brain: notice: grapher "<name>"
is not verified — …` (`unverifiedGrapher`), printed whether or not a door has a post-edit hook: no
`doors` run ever wires it. The door and flow.md do not change with these notices: they read
declarations alone (MV-93).

The code-less brain's hook command (graphify, 540 B; codegraph 606 B), backgrounded as today:
```sh
L=.multivac/cache/graph-refresh.lock; f=$(sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1); t=$(git -C "$(dirname "${f:-.}")" rev-parse --show-toplevel 2>/dev/null); [ -n "$t" ] && [ ! -e "$t/.multivac/config.yml" ] && [ -e "$t/graphify-out/graph.json" ] && cd "$t" || exit 0; PATH="$PATH:$PWD/node_modules/.bin"; find "$L" -maxdepth 0 -mmin +30 -exec rmdir {} + 2>/dev/null; mkdir -p .multivac/cache && mkdir "$L" 2>/dev/null || exit 0; { graphify update .; rmdir "$L"; } >/dev/null 2>&1 </dev/null & exit 0
```
The entry's `env` prefix is unchanged. A brain that holds code and a consumer keep today's
command (492 B; codegraph 558 B).

## `repos check`

The brain's line of a code-less brain never FAILs over a graph, and states a leftover:
```
brain      ok   cloned; leftover graphify install (tracked)
```
(appended as #3's SDD leftover is, `; leftover <name> <noun> (tracked|untracked)`, the noun
`doctor`'s line uses — `install` for a known grapher's shared artifact, `index` for a local one,
`graph` for one under `graphers:` (`leftoverNoun`, analyze I6)).

## flow.md

In a code-less brain:
```
- `change close` refuses while a repo the change names has no `graphify-out/graph.json`
- `graphify` is declared, and no writable code repo resolves it yet: the brain holds no code, so none here; each code repo that resolves it gets its own when `repos sync` or a change reaches it
```
(the second in place of `- no grapher is declared, so no graph is built or required` when the
top level declares one, and in place of the build, gate and query rows of a grapher only repos
marked `managed: false` resolve; an unverified top-level name gets `- \`<name>\` is declared as
the grapher but grapher "<name>" is not verified — …` instead). The automatic row says `after
each edit through the harness hook, and ` only for the grapher the brain's hook is declared to run
(`brainRefreshGrapher`), whether or not this machine could wire it; the brain is counted among a
grapher's roots only where it holds code.
