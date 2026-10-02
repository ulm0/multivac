# CLI Output Contract: multivac keeps no code graph

Exact strings. `<keys>` is `Config.dropped` joined with `, ` (data-model §2); `<dir>` is a root's
absolute path as the human types it (single-quoted when it holds whitespace or a quote);
`<scope>` is `brain` or a repo key. Lines marked *measured* were printed by the prototype in the
walks of quickstart.md W2 and W3 (`$S/w-gf-proto.txt`, `$S/w-cg-proto.txt`). No line here
changes an exit code.

## §1 `verify`

In the brain checkout only (not with `--repo`, not in a consumer): one line, after the `enact`
line, when `Config.dropped` is not empty.

```txt
  config    <keys> ignored — multivac keeps no code graph; delete it from .multivac/config.yml with a change open (`multivac change new <slug>`)
```

`it` becomes `them` for two keys or more. *Measured* (one key):

```txt
  config    grapher ignored — multivac keeps no code graph; delete it from .multivac/config.yml with a change open (`multivac change new <slug>`)
```

All four:

```txt
  config    grapher, grapher_auto, graphers, repos.web.grapher ignored — multivac keeps no code graph; delete them from .multivac/config.yml with a change open (`multivac change new <slug>`)
```

`verify --quiet` folds it into its one line as the last clause (MV-151), *measured*:

```txt
0 blocking broken · exit 0 · 0 claims · 0 anchored · read brain master @ eab50e1 (working tree) · enact not answered (nothing staged) · grapher ignored (delete from .multivac/config.yml)
```

**Removed**: the ecosystem staleness line and its quiet clause —
`  ecosystem .multivac/ecosystem.json is absent|stale — \`multivac doors\` renders it; reported, never gating`.

## §2 `doctor`

Lines in this order, after the existing head and before `repos`; label width as today.

```txt
config     <keys> ignored — multivac keeps no code graph; delete it from .multivac/config.yml with a change open (`multivac change new <slug>`)
leftover   .multivac/ecosystem.json — no longer rendered or read; `multivac doors` removes it
leftover   .claude/settings.json @ <scope>: <n> post-edit graph refresh hook(s) an earlier multivac wrote — `multivac doors` removes it|them
leftover   <vendor> @ <scope>: <found> — left by an earlier release; nothing refreshes|syncs it, so it answers for an older tree[, and graphify's own hooks still send agents to it]. Remove: cd <dir> && <steps>[; <tail>] — then commit
```

`<found>`: `<dir>/ (tracked|untracked|local)`, the ignore file where it sits beside it, `its <a>,
<b> and <c> install(s)` for the platforms found. `<steps>`: the vendor's own uninstall per platform
found (`graphify uninstall --project --platform <key>`, gemini first), then for graphify
`git rm -r -q --ignore-unmatch -- <paths> && rm -rf <paths>`, for codegraph `rm -rf .codegraph`.
`<tail>`: `drop <lines> from .gitignore`; `<file>.graphify-bak is your own pre-install copy: keep
\`*.graphify-bak\` in .gitignore while it is there`; for codegraph beside its config,
`codegraph.json is codegraph's own config: delete it, or drop from its "exclude" the lines an
earlier multivac added`; after an uninstall, `review \`git diff\` — each uninstall drops the whole
hook group it wrote`.

*Measured*, an old graphify brain (claude and agents installs, a backup copy):

```txt
config     grapher ignored — multivac keeps no code graph; delete it from .multivac/config.yml with a change open (`multivac change new <slug>`)
leftover   .multivac/ecosystem.json — no longer rendered or read; `multivac doors` removes it
leftover   .claude/settings.json @ brain: 1 post-edit graph refresh hook an earlier multivac wrote — `multivac doors` removes it
leftover   graphify @ brain: graphify-out/ (tracked), .graphifyignore, its agents and claude installs — left by an earlier release; nothing refreshes it, so it answers for an older tree, and graphify's own hooks still send agents to it. Remove: cd <dir> && graphify uninstall --project --platform agents && graphify uninstall --project --platform claude && git rm -r -q --ignore-unmatch -- graphify-out .graphifyignore && rm -rf graphify-out .graphifyignore; drop `graphify-out/*` `!graphify-out/graph.json` from .gitignore; `.claude/settings.json.graphify-bak` is your own pre-install copy: keep `*.graphify-bak` in .gitignore while it is there; review `git diff` — each uninstall drops the whole hook group it wrote — then commit
```

*Measured*, an old codegraph ecosystem (brain and `web`):

```txt
leftover   codegraph @ brain: .codegraph/ (local) — left by an earlier release; nothing syncs it, so it answers for an older tree. Remove: cd <dir> && rm -rf .codegraph; drop `.codegraph/` from .gitignore — then commit
leftover   codegraph @ web: .codegraph/ (local), codegraph.json — left by an earlier release; nothing syncs it, so it answers for an older tree. Remove: cd <dir> && rm -rf .codegraph; drop `.codegraph/` from .gitignore; codegraph.json is codegraph's own config: delete it, or drop from its "exclude" the lines an earlier multivac added — then commit
```

After the removal, *measured*: the `config` line alone. A read-only repo, a `codegraph.json`
without `.codegraph/`, and a root with nothing left print nothing.

**Removed**: every `grapher` row (`<name> @ <scope>: …`, the unverified, out-of-scope, no-hook and
stale-graph lines, `navigation: ungateable — …`), and `repos check`'s graph facts.

## §3 `doors`

Per settings file that lost a hook (after `door + hooks updated`), *measured*:

```txt
brain: notice: .claude/settings.json: removed 1 post-edit graph refresh hook an earlier multivac wrote — multivac keeps no code graph
```

(`hooks` for two or more.) In the brain, where `.multivac/ecosystem.json` existed, *measured*:

```txt
brain: .multivac/ecosystem.json removed — multivac no longer renders it; commit the removal
```

A second run prints neither. **Removed**: `brain: .multivac/ecosystem.json — how repos, rows,
anchors and changes relate; generated`; every `no post-edit graph refresh here — …` and `no
post-edit refresh for <g> here — …` notice; the hook-clash notices about a grapher.

## §4 The door

One line, in the brain door's list or at the end of the consumer door, where `leftoverVendors`
finds a platform of a vendor's install beside it:

```txt
- graphify's own skills and hooks here still send you to `graphify-out/`, which multivac no longer refreshes: it answers for an older tree than the one you edit. Read the tree; `multivac doctor` prints their removal.
```

Variants: `skill` / `sends` for one platform without hooks; `skills` / `send` for several;
`skill and hooks` / `send` for one with hooks; where the output directory is gone, `… still
send(s) you to a graph that is not here. Read the tree; …`. No line for a vendor with no
platform found (codegraph never has one).

**Removed**: the ecosystem line, every graph and `ASK IT BEFORE READING THE TREE RAW` line, the
grapher's verbs, `--graph` and `its index:` pointers, the code-less and kept-install lines, and
graphify's door section pointer; `.multivac/flow.md`'s automatic, gate and yours rows for a graph.

This brain's door after the change (`AGENTS.md`, 2,638 bytes, *measured* in the prototype after
graphify's uninstall and `doors`) is the head and the SDD block alone:

```markdown
<!-- multivac:begin -->
## multivac — brain door

This repo is the brain: the source of law and change for its ecosystem. It is also the code it governs — anchors target `brain:<glob>`.

- Law lives in `.multivac/invariants.md`. Cite rows by ID; a rule quoted without its ID does not bind.
- Every ecosystem decision enters as a change: see `.multivac/changes/` and run `multivac change`.
- The ritual — the closing ceremony no tool can check — is `.multivac/ritual.md`; `change close` prints it, you walk it.
- Check the law against the code before acting: `multivac verify`.
- Features gate through the `speckit` SDD, in that tool's OWN flow. … (unchanged, nine lines)
  the change lifecycle runs the tool's own init where it is missing, or says why it could not
<!-- multivac:end -->
```

## §5 Refusals and usage

*Measured*:

```txt
$ multivac init <dir> --grapher graphify
init: unknown flag --grapher — known: --provider <a,b>, --sdd <name>, --quiet
$ multivac change close <slug> --no-grapher
change: unknown flag "--no-grapher" — change takes <sub> <slug> ["<title>"], --no-sdd, --landed <repo>, --abandon
```

Both exit 2 and write nothing. Usage:

```txt
usage: multivac init [dir] [--provider a,b] [--sdd <name>] [--quiet]
flags: --no-sdd (skip the SDD steps AND their gates), --landed <repo> (land only),
       --abandon (close only: drop a change that landed nothing, give its id back)
```

## §6 Lines and commits that no longer appear

- `init`: `graph <name> @ <scope>: wrote .graphifyignore (+n) and .gitignore (+n) before the first build`, `… built (\`graphify update .\`) — artifact left uncommitted`, `… installed into <platform> (…)`, `… named graphify by an absolute path — rewritten …`, the detection and code-less lines, `brain: .multivac/ecosystem.json — …`.
- `repos sync`, `change plan`: every `graph <name> @ <scope>: …` build, refresh and install line.
- `change apply`: `its graph: …`, `its index: …`, `--graph <worktree>/…`, and the codegraph index lines.
- `change land`: the graph and ignore-file lines, and the commits `graph: <slug> — refreshed on the change branch` and `graph: <slug> — <name> keeps … out of its index`.
- `change close`: the graph gate and tracked-graph gate lines and refusals, the refresh lines, the sibling `graph refreshed — commit it …` line; the archive commit's pathspec names no graph and no `.multivac/ecosystem.json`.
- `seed`: `- graph <name>: …` in the setup section.
