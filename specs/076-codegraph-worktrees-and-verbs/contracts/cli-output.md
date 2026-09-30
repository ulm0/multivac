# Contract: what the commands print and write

Lines are printed exactly; tests pin the load-bearing substrings. `<k>` is a config key,
`<ws>` the workspace `apply` prints, `<abs>` the repo checkout, `<common>` the repository's
common git directory, `<slug>` the change — absolute paths, single-quoted when they hold
whitespace (#5's rule). Byte counts are `wc -c` of the line with its newline (research.md R7,
R21; `node bytes.mjs`, plan). graph-answers-where-asked's lines (#5's contracts/cli-output.md)
are printed byte for byte except where a section below replaces one. A brain resolving one
grapher, a consumer's hook and this repository's door print what they printed before, but for the
hook's exit outside every repository (FR-034, *`doors`* below).

## `change apply`

Before `work here — one checkout per repo, nobody else's tree moves:`, per named key whose
grapher's artifact is local, in the workspace loop's order:

The exclude step, only where the binary is found and a build or sync follows, and only when it
appended (104 B + the length of `<common>`: 121 B for `/srv/eco/web/.git`):
```
<k>: .codegraph/ added to <common>/info/exclude — git ignored no index here, and that file is never committed
```
(`.codegraph/` is the entry's `ignore` lines appended, joined by a space.) Each line is asked as
git walks the tree: a directory line of the directory itself, `git check-ignore -- .codegraph`
with a directory standing there — made for the question where missing, and removed again — so
a `.gitignore` of `.codegraph/*`, `.codegraph/**`, `/.codegraph/*` or `**/.codegraph/*`, which
lets codegraph's own `!.gitignore` back in, gets the line, and one of `.codegraph`,
`/.codegraph/` or `**/.codegraph` does not.

The build or the sync (refreshGraph's own lines, scope `<k> worktree`, or `<k>` for a repo
branched in place; 93 B / 97 B):
```
graph codegraph @ <k> worktree: built (`codegraph init`) — local artifact, never committed
graph codegraph @ <k> worktree: refreshed (`codegraph sync`) — local artifact, never committed
```
A failure: refreshGraph's existing warning, `graph codegraph @ <k> worktree: build failed
(<cause>) — run \`codegraph init\` there by hand`; apply exits 0.

The binary not found from the worktree while the repo's own checkout is indexed (once; never
where `equip` just printed the same line for `<k>`):
```
graph codegraph @ <k> worktree: build skipped — `codegraph` found on neither PATH nor <k> worktree's node_modules/.bin — install codegraph: npm i -g @colbymchenry/codegraph (https://github.com/colbymchenry/codegraph), then `codegraph init` there
```

Under each `  <k>: <ws>` line, #5's pointer, with this change's local row (four spaces in):
```
    its index: -p <ws> — refreshed after your edits; paths in its answers are relative to this checkout
    its index: -p <ws> — as of this apply, refreshed again at `change land`; paths in its answers are relative to this checkout
```
147 B / 171 B for `/srv/eco/brain/.multivac/worktrees/totals/web`; 177 B / 201 B for this
repository's worktree path. The first where a declared door has a post-edit hook and the brain's
session is declared to refresh codegraph (the one predicate, declarations alone, MV-93 — a
machine that could not wire the hook reads it too, as the door and flow.md do); the second
otherwise. Printed only where the index is installed in
`<ws>` — a worktree, or the repo branched in place (`<ws>` = `<abs>`); never for the brain's own
main checkout. Where it is not installed, #5's lines are printed unchanged, e.g. (234 B):
```
    no codegraph index in this checkout — -p <abs> answers for the base, without this branch's edits; paths in its answers are relative to <abs>; -p at this checkout answers from the nearest index above it, or fails
```
Nothing is built or printed for a shared artifact (graphify) at apply.

## `change land`

In the checkout holding the change's branch, for a local artifact, before the push line, in
this order — the ignore step's line, the exclude line, the sync line, then the `codegraph.json`
commit (after the sync, which reads the file it commits). The ignore step is #5's `landIgnores`
(research.md R0, *#5 as landed*), one path for both artifact kinds, with T051's decision for a
local one: its one ignored-file check (`ignoredPaths`) runs first and prints the warning below
in place of #5's "the graph lands without it" line — first, because the copy the first build
wrote in the repo's own checkout is untracked too and would otherwise pass in silence — and
#5's behind, untracked and uncommitted lines are not printed ("the graph" would be false, and
the worktree's index is the same without the file: its mount is empty). A root whose derived
set is empty (a consumer of a code-less brain, a brain that holds code and nests no repo) runs
no check and says nothing. The shared path keeps #5's lines and order.

The ignore step (#5's call, `gitignore: false`), when it appended:
```
graph codegraph @ <k>: wrote codegraph.json (+N) before the refresh at `change land`
```
and its commit (below). Then, where the binary is found there, the exclude step as at apply,
when it appends (a build at land where apply built none), and the sync (or that build):
```
graph codegraph @ <k>: refreshed (`codegraph sync`) — local artifact, never committed
```
When the step appended, one commit on the change branch whose only path is `codegraph.json`
(60 B subject for one line), printed as `commitBookkeeping` prints:
```
committed: graph: <slug> — codegraph keeps /.brain/ out of its index
```
A `codegraph.json` git ignores there (a warning; nothing written; land goes on — 140 B with
`/srv/eco/web`):
```
<k>: codegraph.json is ignored in <dir> — `git -C <dir> check-ignore -v codegraph.json` names the rule; nothing was written
```
Silent, for a local artifact: a detached HEAD or another branch; a lookup miss; an empty line
set; a `codegraph.json` the rule does not let land write — untracked in the repo's own checkout
or in the branch checkout, committed on the repo's branch after the change's was cut, or
carrying uncommitted edits (`doctor` names the first; close names a file that keeps the
worktree). No index is committed, and no `.gitignore` is written. The shared path prints #5's
lines.

## `change close`

The worktree of a named codegraph repo is removed with a plain removal, printing the existing
```
<k>: worktree removed (<wt>)
```
#5's forced removal stays for a worktree whose every uncommitted path is under the grapher's
`local` globs.

## The brain door

### A brain that holds code, on codegraph

`grapherLines`' two lines (with the new header, below), then, in place of #5's codegraph line
(269 B), this one (441 B):
```
  It answers for this checkout, with the law, the changes and their specs kept out of it: the ecosystem graph above relates them. `change apply` builds each change worktree its own index and prints `its index: -p <worktree>`; paths in its answers are relative to that worktree. Where `apply` printed no such line, `-p` there answers from this checkout's index, without the branch's edits. Never run the `codegraph init` its notices suggest.
```
#5's graphify line (316 B) is unchanged.

### A code repo group on codegraph (a code-less brain's block, or a brain's siblings)

In place of #5's group line (240 B for one repo `svc`; 332 B now, 345 B with the lifecycle
freshness):
```
  - `codegraph` at `.codegraph/codegraph.db` (svc: `../svc`), refreshed after your edits there; built in each checkout, never committed — each change worktree's by `change apply`, which prints `its index: -p <worktree>`; where `apply` printed no such line, `-p` at that worktree answers from the nearest index above it, or fails:
    - `codegraph query <symbol> -p <checkout>` — a name's definitions and imports, each with kind, file:line and signature, best 10 first (`--limit N`)
    - `codegraph callers <symbol> -p <checkout>` — the functions calling it, with file:line, module-level callers as their file — 20 unless `--limit N`, counted as listed; aliased imports missed, same-named symbols merged
    - `codegraph impact <symbol> -p <checkout>` — what may break if it changes: symbols and tests within two calls, by file — a lower bound; aliased imports missed, same-named symbols merged
    - `codegraph node <symbol> -p <checkout>` — its body with line numbers, what it calls and its callers; `-f <file>`, spelled as answers print it, picks one of several same-named
```
The freshness is `refreshed after your edits there` only where a declared door has a post-edit
hook and the brain's session refreshes codegraph (the one predicate); otherwise `refreshed at
\`change land\` and \`change close\``. `{checkout}` renders `<checkout>` for every grapher; no
verb pairs codegraph with `<repo>` or `--limit 1`. A code-less brain's codegraph block (#5's head,
this group, one repo): 1,411 B (#5's 728 B).

A sibling group whose grapher is the brain's own, where `grapherLines` listed the verbs above
(no vendor section cited), prints its group line and, in place of the verbs (58 B):
```
    - the verbs above, each with `-p <checkout>` appended
```
(`--graph <checkout>/graphify-out/graph.json` for graphify.) A brain==code codegraph brain with
one codegraph sibling: that group 1,090 → 390 B. Where the brain's lines cite a vendor section,
the verbs are listed.

### What no door says

No door line names `-p <worktree>` or a worktree's index without "where `apply` printed no such
line" beside it; no verb pairs codegraph with `-p <repo>`; the header claims no saving over grep.

## The grapher list (`grapherLines`: consumer doors, and a brain whose doors cite no section)

The header (125 B, from 131 B):
```
  ASK IT BEFORE READING THE TREE RAW. These are this tool's own verbs, not a generic one — each line says what it answers:
```
codegraph's verbs under it:
```
  - `codegraph query <symbol>` — a name's definitions and imports, each with kind, file:line and signature, best 10 first (`--limit N`)
  - `codegraph callers <symbol>` — the functions calling it, with file:line, module-level callers as their file — 20 unless `--limit N`, counted as listed; aliased imports missed, same-named symbols merged
  - `codegraph impact <symbol>` — what may break if it changes: symbols and tests within two calls, by file — a lower bound; aliased imports missed, same-named symbols merged
  - `codegraph node <symbol>` — its body with line numbers, what it calls and its callers; `-f <file>`, spelled as answers print it, picks one of several same-named
```
codegraph's whole block, head line + header + verbs: **982 B** with a post-edit door (449 B
today), **1,001 B** without (468 B). graphify's list branch: −6 B. A door citing graphify's
section (this repository's) is unchanged.

## `doors`

In place of #5's "one hook runs one command" notice, which is removed, where two graphers the
brain's session would refresh write one artifact (185 B plus the names, `<a>` three times and
`<b>` twice, and the artifact beyond `graph/out.json`; 155 B plus each name once for the second;
3 or more names read `…, <b> and <c> all write`, `<b>'s and <c>'s repos` and `none is wired`):
```
brain: notice: <a> and <b> both write <artifact>, so one hook cannot tell their repos apart — <a> is wired, and an edit in <b>'s repos runs <a> there; `change land` and `change close` refresh <b>
brain: notice: <a> and <b> both write <artifact>, so one hook cannot tell their repos apart — neither is wired; `change land` and `change close` refresh them
```
The first where `<a>` is the brain's own grapher, whose hook — no follow hook — moves into any
toplevel holding its artifact; the second where neither is, since a follow hook for the first
would pass its toplevel test in the others' repos. The sentence after `notice: ` is
`clashSentence`'s, which `doctor`'s refresh path prints too (below). #5's unreachable notice is
printed per grapher; where the brain's session refreshes more than one grapher its head names
the grapher (220 B for codegraph, #5's 212 B head otherwise):
```
brain: notice: no post-edit refresh for codegraph here — `codegraph` is not reachable from every code repo that resolves codegraph (PATH, or each one's node_modules/.bin); `change land` and `change close` refresh them
```

`.claude/settings.json` (`PostToolUse`), a code-less brain with web on graphify and api on
codegraph: two refresh hooks, #5's follow form each (540 B graphify, 606 B codegraph, the
codegraph one with its `env` export), each in its own entry under the post-edit matcher, or
taken over in place inside an entry that held a hook of ours. A single-grapher brain and a
consumer: the hook it had with FR-034's exit — `[ -n "$t" ] || exit 0; ` in place of
`[ -n "$t" ] && ` — and nothing else (492 → 500 B graphify, 558 → 566 B codegraph); a second
`doors` changes no byte. Identity gains nothing: the grapher is read from
`[ -e "$t/<artifact>" ]`, already there in both forms.

## `doctor` (label padded to 11 columns)

The refresh path, by what the brain's session refreshes. A local artifact's clause is
`` `change apply` builds the index in each change worktree and `change land` syncs it, never committed ``;
a shared artifact's is #5's `` `change land` commits it on the change branch ``. Where several
graphers are in play one clause names each: `` `change land` commits <g>'s graph on the change branch ``
for the shared, and `` syncs <g>'s index, which `change apply` builds in each change worktree, never committed ``
for the local, joined by ` and ` (FR-011: no shape drops the apply half).

A brain that holds code on codegraph (245 B with `claude`):
```
grapher    refresh path: claude post-edit hook (installed when the binary is present) · `change apply` builds the index in each change worktree and `change land` syncs it, never committed · `change close` is the net · git hooks never refresh
```
Several graphers hooked (358 B):
```
grapher    refresh path: claude post-edit hooks follow your edits — graphify's and codegraph's (each installed when its binary is present) · `change land` commits graphify's graph on the change branch and syncs codegraph's index, which `change apply` builds in each change worktree, never committed · `change close` is the net · git hooks never refresh
```
#5's code-less single-grapher line keeps its head and takes the land clause by artifact kind;
#5's `the code repos resolve graphify and codegraph, and the brain's one post-edit hook runs one
command` line is removed; #5's unreachable line is printed per grapher. One hook of several wired,
the others' reasons after it, and none wired:
```
grapher    refresh path: claude post-edit hook follows your edits — graphify's (installed when the binary is present) · no hook for codegraph: `codegraph` is not reachable from every code repo that resolves codegraph (PATH, or each one's node_modules/.bin) · `change land` commits graphify's graph on the change branch and syncs codegraph's index, which `change apply` builds in each change worktree, never committed · `change close` is the net · git hooks never refresh
grapher    refresh path: `change land` and `change close` only — `graphify` is not reachable from every code repo that resolves graphify (PATH, or each one's node_modules/.bin); `codegraph` is not reachable from every code repo that resolves codegraph (PATH, or each one's node_modules/.bin) · git hooks never refresh
```
#5's `local` clause, where several graphers are in play, names its grapher: ` · <g>'s hook: not
into the change worktrees of <repos>: they reach <g> only in their own node_modules/.bin, which
a worktree does not hold`.

Graphers writing one artifact are named in every shape of the line, ` · ` and `doors`' sentence
(`clashSentence`) after the hook clauses and before the land clause; where no hook is left at all
(a code-less brain whose only graphers clash):
```
grapher    refresh path: claude post-edit hook (installed when the binary is present) · graphify and outgraph both write graphify-out/graph.json, so one hook cannot tell their repos apart — graphify is wired, and an edit in outgraph's repos runs graphify there; `change land` and `change close` refresh outgraph · `change land` commits it on the change branch · `change close` is the net · git hooks never refresh
grapher    refresh path: no post-edit hook — graphify and outgraph both write graphify-out/graph.json, so one hook cannot tell their repos apart — neither is wired; `change land` and `change close` refresh them · git hooks never refresh
```

Appended to a writable root's grapher line, where the root holds the artifact of a known grapher
it does not resolve and that grapher's hook is wired (267 B with the graphify removal for
`/srv/eco/api`):
```
 · also holds graphify-out/graph.json of graphify, which it does not resolve — graphify's post-edit hook refreshes it there; remove it: cd /srv/eco/api && git rm -q --ignore-unmatch -- graphify-out/graph.json .graphifyignore && rm -rf graphify-out .graphifyignore
 · also holds .codegraph/codegraph.db of codegraph, which it does not resolve — codegraph's post-edit hook refreshes it there; remove it: cd <dir> && codegraph uninit --force
```
Not printed when that hook is not wired, or when its binary is not found from that repo, where
the hook looks once it has moved in. Exit code unchanged.

Appended to a writable root's grapher line whose grapher writes `codegraph.json`, reading only
(126 B, 105 B, 121 B; 160 B with `/srv/eco/api`):
```
 · codegraph.json lacks N line(s) multivac keeps out of the index (/.brain/) — the next `change land` naming <k> adds them
 · codegraph.json is not committed — a clone or worktree with its mount initialised indexes the mount
 · codegraph.json does not parse to an object with an "exclude" list — codegraph ignores it too; add /.brain/ by hand
 · codegraph.json is ignored in <dir> — `git -C <dir> check-ignore -v codegraph.json` names the rule; `change land` writes nothing while it is
```
One of the four, in this order: a file that does not parse; else one not committed at HEAD that
git ignores, present or not (land refuses it by name); else one present and not committed
at HEAD (land may not write beside it); else the lines it lacks — a file absent there lacks them
all, and land creates it. Only on an installed root, and only where the root's derived set is
non-empty. Where that set holds no mount line (a brain that holds code, nesting a declared repo),
the not-committed fact ends `— a clone or worktree indexes what it keeps out (/packages/api/)`.
No node count is printed (it would read codegraph's database). A human's `codegraph.json` alone,
with no `.codegraph/` beside it, is never a leftover in a code-less brain.

## flow.md

The automatic row keeps its shape; for a local artifact two clauses change (codegraph, a
post-edit door, the brain as the root):
```
- the code graph is built where `multivac repos sync` or a change reaches a repo with no `.codegraph/codegraph.db`, and in each change worktree at `change apply`, refreshed after each edit through the harness hook, and at `change land`, where it is synced and never committed, and at `change close`, in brain
```
`, and in each change worktree at \`change apply\`` is added after the artifact, and `where it is
synced and never committed` takes the place of the shared artifact's `where it is committed on the
change branch`, so the row still ends `…at \`change close\`, in <roots>`. `refreshed after each edit through the harness
hook, and ` appears only where the one predicate holds for that grapher; a shared artifact keeps
#5's row.

## The ignore writer's lines (`writeIgnores`, JSON branch)

Before a root's first build (92 B; `.gitignore (+M)` as #5 prints it):
```
graph codegraph @ <k>: wrote codegraph.json (+1) and .gitignore (+1) before the first build
```
A line another list names (108 B):
```
graph codegraph @ <k>: /.brain/ not added to codegraph.json — its "deprioritize" names it, which is yours
```
(`"include"`, `"includeIgnored"` or `"deprioritize"`; a line `exclude` already names is skipped
silently.) A malformed file (146 B), left byte-identical:
```
graph codegraph @ <k>: codegraph.json does not parse to an object with an "exclude" list — left as it is; add /.brain/ to its "exclude" by hand
```
An empty line set: nothing written, nothing printed, no file created.

## `codegraph.json`

Created where missing or empty (38 B):
```json
{
  "exclude": [
    "/.brain/"
  ]
}
```
Spliced into a human's file — every byte kept, the line inserted (illustrative: `⏎` is a CRLF, and
the separator a one-line file gets is the splice's; what tests pin is that the output minus the
inserted span equals the input, parses, and a second write adds nothing):
```text
{"deprioritize":["legacy/"],"exclude":["dist/"]}        →  {"deprioritize":["legacy/"],"exclude":["dist/", "/.brain/"]}
{⏎  "maxFileSize": 1.50,⏎  "exclude": [⏎    "dist/"⏎  ]⏎}   →  {⏎  "maxFileSize": 1.50,⏎  "exclude": [⏎    "dist/",⏎    "/.brain/"⏎  ]⏎}
{"include":["src/"]}                                    →  {"include":["src/"],"exclude":["/.brain/"]}
```
No `# multivac:` record (JSON holds none); a line deleted without negating it returns at the
next write; `!/.brain/` in any of the four lists keeps the mount indexed.

## The codegraph entry (registry data)

`queries`, in this order:
```ts
{ run: 'codegraph query <symbol>', answers: "a name's definitions and imports, each with kind, file:line and signature, best 10 first (`--limit N`)" },
{ run: 'codegraph callers <symbol>', answers: 'the functions calling it, with file:line, module-level callers as their file — 20 unless `--limit N`, counted as listed; aliased imports missed, same-named symbols merged' },
{ run: 'codegraph impact <symbol>', answers: 'what may break if it changes: symbols and tests within two calls, by file — a lower bound; aliased imports missed, same-named symbols merged' },
{ run: 'codegraph node <symbol>', answers: 'its body with line numbers, what it calls and its callers; `-f <file>`, spelled as answers print it, picks one of several same-named' },
```

`note`: the sentence "The `codegraph query` a door prints runs in the agent's own environment and
carries none of that `env`: the opt-outs above reach it only when set there (MV-147)." is
replaced, in place, by:

> The verbs the door prints, and the `codegraph init` and `codegraph uninit --force` that `doctor` and the graph gate print for a human, run outside multivac, and this entry's `env` reaches none of them. Measured 2026-09-29 on 1.6.0 with HOME isolated, a local recorder as its telemetry endpoint and strace, and read from its dist: where npm installed the platform bundle, `query`, `callers`, `impact` and `node` open no socket, and each appends one count per command name and UTC day to ~/.codegraph/telemetry-queue.jsonl. That queue is sent to telemetry.getcodegraph.com, with a machine id minted then, the version, OS, architecture, Node major and a CI flag, by the first `init`, `uninit`, `index`, `sync` or `upgrade` run without an opt-out once its day is past, by `codegraph install`, and by the MCP server it registers, at start and every six hours. `init` and `index` also send an `index` event (languages and coarse file-count and duration buckets) at once, and `uninit` an `uninstall` event. Where npm did not deliver the platform bundle, the npm shim downloads it from GitHub Releases into ~/.codegraph/bundles on any command, these verbs included, whatever DO_NOT_TRACK or CODEGRAPH_TELEMETRY say; CODEGRAPH_NO_DOWNLOAD=1 where the agent runs turns that off. multivac's own runs carry `env`, so they record and send nothing and leave the queue as it is. DO_NOT_TRACK=1 or CODEGRAPH_TELEMETRY=0 where the agent runs records nothing.

The rest of the note — `TELEMETRY IS ON BY DEFAULT`, `codegraph telemetry off`, the shim's
fallback and `CODEGRAPH_NO_DOWNLOAD=1`, the MCP server's update check — stays. The door carries
no telemetry text.

## The site (site/content/docs/reference/graphers-and-sdd.md)

- `### A change's own codegraph index`, after #5's `### Where to ask the graph`.
- `### One post-edit hook per grapher`, under `### Automatic refresh`.
- No law ID, no `x.y.z` version (it says "the version the registry entry records"), no copy of the
  row, a note or the entry's note verbatim, and no quote of a retired sentence.
