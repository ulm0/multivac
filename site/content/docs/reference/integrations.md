---
title: Agent integrations
weight: 3
---

You write the door once. multivac projects it into whatever harness the
person in front of it happens to use.

The canonical door is **`AGENTS.md`** at the repo root — in the brain and in
every declared repo multivac may write in (not `managed: false`, not a shallow
clone). Everything else on this page is a projection of that one file. Adding a
harness is an entry in `src/adapters/registry.ts`, shipped inside the package:
`doors` and `doctor` dispatch on the entry's `kind`, never on its name, so a new
harness is data and nothing else. Every entry records the vendor doc it was
verified against.

Select them in `.multivac/config.yml`:

```yaml
doors: [agents, claude, cursor, opencode, codex, windsurf, gemini, copilot]
```

Then `mvac doors`. That is the whole adoption step — never re-run `init`.

## The four kinds

| kind | what `doors` writes | entries |
| --- | --- | --- |
| `canonical` | `AGENTS.md` itself — the source every other kind projects from | `agents` |
| `native` | **nothing.** The harness already reads `AGENTS.md`; a second file would be a paraphrase | `opencode`, `codex`, `windsurf`, `cursor` |
| `symlink` | a second name for the same bytes: `<door> → AGENTS.md` | `claude`, `gemini` |
| `stub` | a small tool-owned file, optional frontmatter, then the managed block, pointing at `AGENTS.md` | `copilot` |

There is no kind for "cannot be owned". A harness whose door multivac cannot
write gets **no entry**, because an entry is how this tool says *supported* —
it appears in `--provider`'s legal values, in the table above, and in the count
of what multivac integrates with. `aider` had one for a while, carrying a note
that explained at length why none of it applied; it read as support to anyone
who did not open it. An unknown name already gets the list of what is
supported, which is the answer that helps.

Cursor was a `stub` until multivac stopped projecting one: it reads `AGENTS.md` at the project root, so
the rules file was a second door that could disagree with the canonical one, and
graphify's own `cursor` platform wrote a third copy of the graph instructions
beside it. A target that retires a file it used to project takes it with it —
one `doors` run removes multivac's block from `.cursor/rules/multivac.mdc` and
deletes the file when nothing but the frontmatter multivac itself wrote is left,
saying which of the two it did. Lines you added there survive, and the file with
them stays.

Everything multivac writes into a file it does not fully own lands between
`<!-- multivac:begin -->` and `<!-- multivac:end -->`. Content outside that
block is yours and is never touched — including in a `stub` door, which reads
the file before it writes it and adds its frontmatter only when creating the
file. The stub kind used to write its file whole, which made that sentence false
for `.github/copilot-instructions.md` and `.cursor/rules/multivac.mdc`.

## What one run looks like

```txt
$ mvac doors
brain: door + hooks updated
```

```txt
$ mvac doctor
doors      agents: AGENTS.md ok · claude: CLAUDE.md ok (symlink) · cursor: AGENTS.md ok (read natively) · opencode: AGENTS.md ok (read natively) · codex: AGENTS.md ok (read natively) · windsurf: AGENTS.md ok (read natively) · gemini: GEMINI.md ok (symlink) · copilot: .github/copilot-instructions.md ok
```

---

## `agents`

| | |
| --- | --- |
| file written | `AGENTS.md` |
| kind | `canonical` |
| skill | — |
| hook config | — |
| source | <https://agents.md/> |

The canonical door. Every other target projects from this file, and `doors`
writes it whether or not `agents` is in your list. In the brain it carries
the law summary and the active-invariant count; in a consumer repo it carries
where the brain is mounted, what binds, and that a change may cross repos.

`init` is what creates it; `doors` refreshes its managed block.

## `claude`

| | |
| --- | --- |
| file written | `CLAUDE.md` |
| kind | `symlink` → `AGENTS.md` |
| skill | `.claude/skills/multivac/` |
| hook config | `.claude/settings.json` — `hooks.SessionStart` and `hooks.PostToolUse` → `mvac verify`, wrapped per event so a red run reaches the model |
| detected by | an existing `CLAUDE.md` |
| source | <https://code.claude.com/docs/en/memory> |

Claude Code reads `CLAUDE.md`, not `AGENTS.md`; its own docs give
`ln -s AGENTS.md CLAUDE.md` as the way to share one file, so that is exactly
what `doors` creates.

This is the only entry with all three artifact classes. Besides the symlink,
`doors` copies the packaged skill into `.claude/skills/multivac/` and merges
multivac's hook entries into `.claude/settings.json`, preserving every key
and entry it does not own:

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [ { "type": "command", "command": "mvac verify 2>&1 || true" } ] }
    ],
    "PostToolUse": [
      {
        "hooks": [ { "type": "command", "command": "mvac verify >&2 || exit 2" } ],
        "matcher": "Edit|Write|MultiEdit"
      }
    ]
  }
}
```

`SessionStart` catches a lying brain before the agent conceives code on top
of it, in one line when nothing is off and in full otherwise; `PostToolUse`
re-checks after every edit, in the checkout of the file written when a brain
governs it, and says nothing while it is green. Both run the **default**
policy, not `--strict`, and neither command carries a switch: `verify` reads
the harness's own hook payload (see
[hooks](/docs/reference/hooks/#harness-hooks--the-early-ceiling)).

The skill directory is a **mirror**, not an accretion: every run deletes
anything under `.claude/skills/multivac/` that the package no longer ships —
including a file you put there yourself, because nothing on disk says who
wrote it. Your own skills live beside it: `doors` never touches a sibling under
`.claude/skills/`, only the one directory it writes. What multivac owns here is
the individual command, matched exactly — never an entry that merely mentions it
— and the set it owns is the three commands multivac has written, so a brain
projected with the unwrapped command is upgraded in place rather than gaining a
second gate beside the mute one. The wrapping differs per event because Claude
Code reads each hook back on one channel only; the contract and its reasons are
in [hooks](/docs/reference/hooks/#harness-hooks--the-early-ceiling).
`mvac verify --strict` is your hook and stays
untouched, commands you add beside multivac's stay in place, and the matcher on
an entry is yours. The rule and the notice it prints are in
[hooks](/docs/reference/hooks/#what-preserving-means-here).

If `CLAUDE.md` already exists as a regular file, `doors` refuses to replace
it and says what to do:

```txt
api: notice: CLAUDE.md exists as a regular file — merge it into AGENTS.md and remove it to get the symlink
```

On Windows without developer mode the symlink is not permitted; the notice
tells you to put `@AGENTS.md` as the first line of `CLAUDE.md` instead.

## `cursor`

| | |
| --- | --- |
| file written | nothing — Cursor reads `AGENTS.md` natively |
| kind | `native` |
| detected by | an existing `.cursor/` directory |
| source | <https://cursor.com/docs/context/rules> |

Cursor reads `AGENTS.md` at the project root, so there is nothing to project:
a rules file under `.cursor/rules` would be a second door that could disagree
with the canonical one. The stub this target used to write is retired — see
[The four kinds](#the-four-kinds) for what one `doors` run does with it.

## `opencode`

| | |
| --- | --- |
| file written | none — `AGENTS.md` is the integration |
| kind | `native` |
| detected by | an existing `opencode.json` |
| source | <https://opencode.ai/docs/rules/> |

opencode reads `AGENTS.md` at the project root and up the tree. There is
nothing to project: extra instruction files would go under `instructions` in
`opencode.json`, which multivac does not own.

Declaring `opencode` in `doors:` changes no bytes on disk. It changes
`doctor`, which now reports the canonical door on opencode's behalf:

```txt
opencode: AGENTS.md ok (read natively)
```

If `AGENTS.md` is missing, the fix `doctor` names for a native entry is
`multivac init .`, not `multivac doors` — because `init` is what creates the
canonical file.

## `codex`

| | |
| --- | --- |
| file written | none — `AGENTS.md` is the integration |
| kind | `native` |
| detected by | an existing `.codex/` directory |
| source | <https://learn.chatgpt.com/docs/agent-configuration/agents-md> |

Codex reads `AGENTS.md` from the git root down to the working directory,
concatenated, nearest last. Nothing to project; its own config is
`.codex/config.toml`, which multivac does not write.

## `windsurf`

| | |
| --- | --- |
| file written | none — `AGENTS.md` is the integration |
| kind | `native` |
| detected by | an existing `.windsurf/` directory |
| source | <https://docs.windsurf.com/windsurf/cascade/agents-md> |

Cascade treats a root `AGENTS.md` as an always-on rule, and one in a
subdirectory as a glob rule for that directory. The legacy
`.windsurf/rules/*.md` mechanism still works but needs its own frontmatter,
so multivac stays with the canonical file.

## `gemini`

| | |
| --- | --- |
| file written | `GEMINI.md` |
| kind | `symlink` → `AGENTS.md` |
| detected by | an existing `.gemini/` directory |
| source | <https://geminicli.com/docs/cli/gemini-md/> |

Gemini CLI reads `GEMINI.md` by default. It *can* be pointed at `AGENTS.md`
with `context.fileName` in `.gemini/settings.json` — but the symlink needs no
settings file and no merge into someone else's JSON, so that is what
multivac projects.

## `copilot`

| | |
| --- | --- |
| file written | `.github/copilot-instructions.md` |
| kind | `stub`, no frontmatter |
| detected by | an existing `.github/copilot-instructions.md` |
| source | <https://docs.github.com/en/copilot/reference/custom-instructions-support> |

Copilot reads `AGENTS.md` in *some* surfaces — the cloud agent, VS Code chat,
Copilot CLI — but `.github/copilot-instructions.md` is the one path supported
everywhere. It takes plain markdown with no frontmatter, so the stub is the
managed block alone:

```markdown
<!-- multivac:begin -->
Read `AGENTS.md` at the repo root — the multivac door: what is law here, where the brain lives. Run `multivac verify` before you commit.
<!-- multivac:end -->
```


## Three artifact classes

Across all entries, multivac writes at most three kinds of thing — a door,
hooks and a skill — and they differ by *when the agent reads them*: the table
is on [Distribution](../../concepts/distribution/#skills-the-third-artifact-class).

Only `claude` currently has all three. Git hooks are installed for **every**
repo `doors` reaches, regardless of which harness entries you declared — see
[Hooks](../hooks).

## Detection

With no `--provider` flag, `init` probes for the `detect` path of every registry
entry and writes what it found as a **commented proposal**, never as an
enabled key:

```yaml
doors: [agents]
# detected claude, cursor artifacts — to project the door there, use:
# doors: [agents, claude, cursor]
```

Detect, then ask. multivac never enables an integration because a directory
happened to exist.
