# Contract: what the commands print and write

`<tool>` is the resolved SDD name, `<k>` a config key. Lines are printed exactly;
tests pin the load-bearing substrings.

## Config refusals (exit 2 from `loadConfig`)

`doctor`, `doors` and `init` keep their exit 1 over a config they cannot load; `doctor` prints the
text on its `config` line: `config     invalid — <refusal>`.

```
(i)   repos.<k>.sdd: <value> — REFUSED: the SDD lives in the brain alone, so a code repo's sdd: takes only none, which exempts its code from the change gate. Fix: remove repos.<k>.sdd or set it to none in .multivac/config.yml, then open a change for the config edit: `multivac change new <slug>`
(ii)  sdd: <tool> — REFUSED: the brain's own entry repos.<k>.sdd says <value>, so <tool> resolves in no root. Fix: make them agree in .multivac/config.yml, then open a change for the config edit: `multivac change new <slug>`
(iii) sdd: <name> — REFUSED: no SDD adapter is named <name> (known: opsx, speckit). Fix: correct sdd: in .multivac/config.yml, then open a change for the config edit: `multivac change new <slug>`
```

## Consumer `verify` / `count` over a refused mounted config

```
  sdd       <refusal text> — in the mounted brain's config; its owner fixes it[ · blocking under --strict]
```
Exit 0 without `--strict`; 1 with it. `count` prints the same line on stderr and counts.

## Scaffold (brain only)

```
sdd speckit: .specify is missing in brain — running the tool's own init there: `<init>`, then multivac writes its skeleton templates to .specify/templates/overrides
sdd speckit: scaffolded — brain:.specify is there now; its steps are runnable; skeleton: .specify/templates/overrides/{spec,plan,tasks}-template.md
sdd speckit: scaffolded — …; skeleton skipped: <reason>
```
Reasons: `.specify/templates/overrides exists`, `spec-kit <v> is below 0.9.4`,
`no recorded version`, `<file>: the installed template has no "## <heading>"`,
`<file>: the installed template is missing`, `<file>: <error code>` (a write that failed).

## Lifecycle

`change new` (brain resolves an SDD, automation on, no `--no-sdd`), after the
project-document line and before the steps:
```
sdd <tool>: the why, the design and the tasks go into its files — the change body keeps what it held while planned, or one sentence, and `change close` cites the directory; do not cite it yourself
```

Each point's steps, then once:
```
sdd <tool>: <step> [proof: <artifact> — `change <gate>` refuses without it]
sdd <tool>: <step> [ungateable: <reason>]
sdd <tool>: run the chain through without asking to continue — stop only for a question the tool itself raises (`--no-sdd` for one run, `sdd_auto: false` to stop printing these)
```

`change plan` / `change apply`, when the pointer named another directory:
```
sdd speckit: .specify/feature.json named <old>; it names <new> now
```

`change plan`, with the steps (automation on, no `--no-sdd`) and when the change names a
repo other than the brain's entry; `<repos>` is the one key the change names, or
`{<k>,<k>}` for several, the brain's own entry among them:
```
sdd <tool>: its steps run from the brain checkout, which holds no code of this change — tasks name code paths under .multivac/worktrees/<slug>/<repos>/, and code is written only there
```

A missing-proof refusal, per stray match found in a code repo or its worktree, read-only or not:
```
sdd <tool>:   <repo>: <path> — not read; the SDD runs only in the brain
```

A task ledger found only outside the brain, when the artifact loop has not already refused:
```
sdd <tool>: `change <gate> <slug>` refused — <ledger>, the task ledger it reads, is not in brain; the one found outside the brain is not read
sdd <tool>:   <repo>: <path> — not read; the SDD runs only in the brain
  move the slug's directory into the brain and finish its tasks there, then re-run: multivac change <gate> <slug>
```

`change close`, automation on, no `--no-sdd`, no directory found:
```
sdd <tool>: no directory for <slug> in the brain or its worktree — nothing cited
```

Appended to the archived body (and `--abandon`):
```
Specified in `<dir>/` (<tool>).
```

## Doors

Brain door step lines:
```
  - `change <at>` → <run> [proof: <artifact>]
  - `change <at>` → <run> [ungateable]
```
Under `sdd_auto: false` the project-document line keeps "CREATE IT IF ABSENT" and
drops "`change plan` refuses while …".

Consumer door (governed, automation on), replacing the SDD block and the
project-document line:
```
- The brain's `<tool>` SDD runs in the brain checkout, never in this mount: specs, plans and tasks are written there. Code here lands only on the branch of an open change declaring this repo; `verify --strict` refuses it anywhere else.
```

## doctor / repos check

The label is padded to 11 columns (`sdd` and eight spaces).
```
sdd        <tool> governs the code of <k>, <k> — its steps run in the brain[; exempt (sdd: none): <k>]
sdd        <tool> governs the code of no code repo — its steps run in the brain; exempt (sdd: none): <k>
sdd        leftover speckit install @ <k>: <state> (tracked|untracked) — delete .specify/ there; `specify integration uninstall <key>` removes its skills and leaves .specify/
sdd        leftover opsx install @ <k>: <state> (tracked|untracked) — delete openspec/ and the openspec-* skills and opsx commands its init wrote under each harness directory
sdd        preset <id> is outranked for <file> by .specify/templates/overrides/<file> — delete that override to let the preset win
```
`<state>` is the vendor's state file found there (`.specify/integration.json`,
`openspec/config.yaml`), else its directory (`.specify`, `openspec`). The governs line
prints only when a non-brain repo is declared and `sdd_auto` is on; the second form when
every code repo is exempt. Leftover lines print only when the brain resolves an SDD, and
never for a read-only repo; with no SDD in the brain `doctor` prints no `sdd` line.
`repos check` appends `; leftover <tool> install (<tracked|untracked>)` to the code repo's
line under the same condition; its exit code is unchanged.

The brain's state line, when the tool has never run there:
```
sdd        <tool> @ brain: missing (no <state>) — declared but never run here; `change new` runs the tool's own `<init>`, doctor never does (it writes the vendor's files into the tree); that run then writes multivac's skeleton templates to <dir> if it is absent · …
sdd        <tool> @ brain: missing (no <state>) — declared but never run here; under `sdd_auto: false` no command runs the tool's own `<init>`: run it there yourself, doctor never does (it writes the vendor's files into the tree) · …
```
The skeleton clause is for a tool that records a skeleton, with automation on.

flow.md under `sdd_auto: false`, in what is yours:
```
- the `<tool>` init, in the brain when its `<state>` is missing — not run (`sdd_auto: false`)
```
