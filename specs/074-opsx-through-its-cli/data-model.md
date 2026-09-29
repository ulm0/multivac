# Data Model: opsx runs through its own CLI

No new persisted format. Four registry fields are added, the opsx entry's data is rewritten,
one verdict grows a field, close's staging splits its merge targets in two, and two pure
derivations are shared across commands.

## Registry types (src/adapters/registry.ts)

```ts
interface SddStep {
  // ...existing: run, at, artifact, gate, untouched, ungateable, validate, unfinished, merges
  /**
   * MV-147. What the lifecycle prints on the line under this step — at its point and in
   * every refusal that re-prints it, never in the door, `doctor` or flow.md — `<slug>`
   * interpolated: the rest of what the vendor's own command body told the agent, measured
   * on a named version, where `run` has room only for the command and the human's
   * question. Whether the agent asked what it names is ungateable (MV-95).
   */
  guide?: string;
  /**
   * MV-147. An ERE over the issue messages of a PASSING `validate` verdict: each match is
   * printed as a note and refuses nothing — the tool said the artifact is valid and, in the
   * same output, what a later step of its own will refuse.
   */
  validateNotes?: string;
  /**
   * MV-146, with `file` added by MV-147 at review: the one name the tool merges, so a
   * file kept beside a delta maps to no main spec. opsx: `{ from: 'specs', into:
   * 'openspec/specs', file: 'spec.md' }`.
   */
  merges?: { from: string; into: string; file: string };
}

interface SddScaffold {
  // ...existing: run, add, integrations, fallback, skeleton, note
  /**
   * MV-147. What the vendor's integration inits write under a directory: `names` are globs
   * over an entry's name (depth one or two under the directory), `dirs` the directories an
   * earlier version wrote that `integrations` no longer records. The code gate reads the
   * entries as not code under every integration's `dirs` and these, declared door or not;
   * `doctor` names those left in the brain once the scaffold installs none.
   */
  bodies?: { names: string[]; dirs: string[] };
}

interface AdapterSpec {
  // ...existing
  /**
   * MV-147. SDD only: the slugs the tool's own create step accepts — an ERE, the names it
   * reserves, and the reason printed with a refusal. `change new` and `roadmap add` refuse
   * any other slug, whatever `sdd_auto` and `--no-sdd` say; absent, they accept what they
   * always did.
   */
  slug?: { pattern: string; reserved: string[]; why: string };
}
```

Doc comments reworded (their sentences become false): `AdapterSpec.steps` (what the AGENT
runs — chat commands for spec-kit, the vendor's own terminal verbs for opsx — holding, on one
physical line, the text MV-51's moved leg reads: `the lifecycle prints them and gates on what
they leave behind, and never spawns one`); `SddScaffold` (every `SddStep` is run by
the agent and only printed here; the deadlock is spec-kit's); `SddScaffold.run` (a
`{key}`/`{keys}` placeholder when present; a run with neither is run as written and names no
door as a gap); `SddScaffold.integrations` (a door missing here is a gap only for a run with
a placeholder); `SddStep.unfinished` (the `Warning: … Continuing due to --yes flag.` example
is text mode's; under `--json` `--yes` says nothing).

## The opsx entry (data)

| Field | Value |
| --- | --- |
| `scaffold.run` | `openspec init --tools none --no-animation .` |
| `scaffold.integrations` | unchanged `dirs`, under the comment "MV-147: the record of what `openspec init --tools <key> --no-animation .` writes, measured on 1.13.2; multivac no longer runs it — a human's opt-in, or an earlier multivac's init, leaves these, which the code gate reads (MV-144) and `doctor` names" |
| `scaffold.bodies` | `{ names: ['openspec-*', '.openspec-*', 'opsx', 'opsx-*'], dirs: ['.codex'] }` — measured, research.md R9 |
| `scaffold.note` | `--tools none` writes openspec/config.yaml and the two gitkeeps and nothing outside `openspec/`, whatever the doors (1.13.2) |
| `refresh` | `openspec update`, with a comment: it refreshes only the bodies a human installed, and does nothing in a brain scaffolded with `--tools none` (1.13.2: "No configured tools found.", exit 0) |
| `steps[*].run`, `steps[*].guide` | contracts/cli-output.md, verbatim; each guide's vendor question cited in a comment by path and version (openspec 1.13.2's `.claude/commands/opsx/propose.md`, `.claude/commands/opsx/apply.md`) |
| `steps[plan].validateNotes` | `'^Archive would refuse'` |
| `steps[land].unfinished.why` | `openspec archived this change with tasks still unchecked — \`--yes\` archives over its own refusal, and under \`--json\` says nothing` |
| `slug` | `{ pattern: '^[a-z0-9]+(-[a-z0-9]+)*$', reserved: ['archive'], why: "openspec 1.13.2's \`new change\` takes lowercase letters and digits in runs joined by single hyphens, and reserves \`archive\`" }` |
| `note` | contracts/cli-output.md, *The opsx note* |

Unchanged: `artifacts`, `state`, `shared`, `local`, `leftover` (code repos, MV-146), `ignore`,
`env`, `binaries`, `required`, `installHint`, `automation`, `projectSteps`, every step's `at`,
`artifact`, `gate`, `validate`, `ungateable`, `unfinished.artifact`, `unfinished.pattern`,
`unfinished.gate` and `merges.from`/`merges.into`. The speckit entry is untouched: no `guide`, no
`validateNotes`, no `slug`, no `bodies`.

Validation (tests): no step's `run` in any entry matches `--(yes|skip-specs|no-validate)`; a
guide names those flags only after "never" or as the human's answer; every `slug.pattern`
compiles, and each `reserved` name is one the pattern alone would accept (`archive` is);
`bodies.names` are globs over one path segment.

## Verdicts (src/adapters/sdd.ts)

```ts
type Verdict =
  | { kind: 'ok'; notes: string[] }   // notes: messages of a passing verdict matching validateNotes
  | { kind: 'missing'; bins: string[] }
  | { kind: 'failed'; message: string };

toolVerdict(spec, cmd, cwd, notes?: string): Promise<Verdict>
```

On exit 0 with `notes` set, stdout is parsed inside a try as the vendor's JSON
(`items[].issues[].message`); empty, whitespace or unparsable output yields `notes: []`. The
scaffold calls it without `notes`.

## Shared derivations

| Function | Where | Answers |
| --- | --- | --- |
| `bodyGlobs(scaffold): string[]` | src/adapters/detect.ts | for each `d` in the union of every integration's `dirs` and `bodies.dirs`, and each `n` in `bodies.names`: `d/n`, `d/n/**`, `d/*/n`, `d/*/n/**`; `[]` without `bodies`. Pure. |
| `sddSlugWhy(cfg, slug): string \| null` | src/adapters/sdd.ts | the brain's SDD (`adapterFor(cfg, 'brain', 'sdd')`), then its `slug`: the `why` when `slug` misses `pattern` or is in `reserved`, else null; null with no SDD or no grammar. Pure. |
| `leftoverBodies(dir, spec): Promise<Body[]>` | src/lib/repo-state.ts | `Body = { path: string; tracked: boolean }`: every file `git ls-files -z --cached` and `git ls-files -z --others --exclude-standard` report under `bodyGlobs(spec.scaffold)`, reduced to its entry (`d[/<sub>]/<name>`), two or more siblings under one parent sharing a prefix `bodies.names` records as `<prefix>*` collapsed to `<parent>/<prefix>*` — for opsx `openspec-`, `.openspec-` and `opsx-`, derived from the entry, never written in repo-state.ts (converge, T066) — (a single one is named as it is) — and only when every entry that glob reaches is in the same list, so a shell expanding it hands `git rm -r` nothing untracked — `tracked` when git tracks every file under it (a mixed group splits). `[]` without `bodies`, or when git cannot answer. |
| `nonCodeGlobs(cfg, repoKey)` | src/lib/code-in-change.ts | as today, plus `bodyGlobs(scaffold)` for every known SDD's scaffold, in every repo |

## Close's staging (src/change/carry.ts, src/commands/change.ts)

```ts
carriesMerge(brainDir: string, delta: string, target: string): Promise<boolean>
closeOwnedDirs(brainDir, spec, slug): Promise<{ dirs: string[]; uncarried: string[] }>
```

`carriesMerge` (paths relative to `brainDir`): both texts are normalised first (a leading
BOM dropped, CRLF → LF, trailing whitespace stripped per line, each run of blank lines
collapsed to one — the archive writes a block with its blank runs collapsed), then read as
openspec 1.13.2 reads them. A fence mask comes first (`buildCodeFenceMask`: three or more
backticks or tildes open a fence that only a bare run of the same character, at least as
long, closes); a fenced line is never a header. The delta splits into sections at unfenced
`## ` lines; in every `## ADDED Requirements` and `## MODIFIED Requirements` (titles
case-folded, as openspec folds them) each block runs from an unfenced
`^###\s*Requirement:\s*(.+)` line (any case) to the next one or the section's end, trailing
whitespace trimmed, keeping any other `### ` line; its name loses a closing run of `#`s. No
such block → true. Otherwise every block must equal, whole, a block of the same name in the
target's `## Requirements` section (first unfenced `^##\s+Requirements\s*$`, to the next
unfenced `## `), read the same way; an unreadable delta or target → false. (Review: the
first cut compared substrings and stopped a block at any `### ` or fenced `## ` line, blind
to fences — each case called a `--skip-specs` target carried or a real merge uncarried.)

`closeOwnedDirs` keeps its derivation (slug directories, slug-literal deletions, each merge
target FILE `into/<rel>` for every `<archive>/<from>/<rel>` named `merges.file` — `spec.md`
for opsx, in a capability's directory, never at the root of `<from>` or under a
dot-directory, as openspec's discoverSpecFiles finds them), and routes each merge target
through `carriesMerge(brainDir, <archive>/<from>/<rel>, <into>/<rel>)`: carried → `dirs`,
otherwise → `uncarried`.

`sddPathsToLand` stages `dirs` as today and names each `git status` path in `uncarried` —
modified or untracked — through its one `is dirty and was not staged` line (MV-144's
`unique` leg), never staging it.

## Gate states (judgeSdd)

| Point | Proof found | Verdict |
| --- | --- | --- |
| `plan`, `apply`, `close` for a non-land step | brain checkout, or the change's worktree (MV-133) | read there, as today |
| `close` for a step with `at: 'land'` | brain checkout | read there |
| `close` for a step with `at: 'land'` | only the change's worktree, once or more | refused: "is only in the change's worktree, <path>[, <path>…], which never reaches the brain checkout", before any clash; that step's ledger is neither read nor a clash there |
| any, validator passes | — | `ok`, plus one note per `validateNotes` match |

## Slug checks

| Command | Order | Refusal | Exit |
| --- | --- | --- | --- |
| `change new` | the argument parser's format check (exit 2, unchanged), then `sddSlugWhy` first in `cmdNew`, before the archived and promotion checks, whatever `sdd_auto`/`--no-sdd` | contracts/cli-output.md | 1, nothing written |
| `roadmap add` | the format check (exit 2, unchanged), then the config is loaded (a refused SDD declaration reported, not thrown; a config that cannot be read is no grammar, as before — analysis C5) and `sddSlugWhy` asked, before the planned/open/archived checks | contracts/cli-output.md | 2, nothing recorded |
