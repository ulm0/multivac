---
slug: the-sdd-arrives-with-its-own-scaffold
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-75
  retires: []
claims:
  - id: MV-75
    statement: An adapter declares the scaffold that makes its steps runnable, so declaring an SDD that is not installed yet is something the lifecycle resolves instead of a hole only --no-sdd gets out of.
---

# The SDD arrives with its own scaffold

Declaring `sdd: speckit` in a repo where spec-kit has never run makes the change
that installs spec-kit **unplannable**:

```
change plan <slug>  refuses without  specs/*<slug>*/spec.md
specs/*<slug>*/spec.md  comes from   /speckit.specify
/speckit.specify        exists only after  specify init
specify init            is what the blocked change was going to do
```

The only exits multivac offers are `--no-sdd` for one run and `sdd_auto: false`
forever — both of which turn the gate off in order to fix the very thing whose
absence made it fire. That is not a workaround, it is the tool having no answer.
MV-56 assumes the SDD is already installed; nothing states what happens on the
day it is declared.

## What an adapter should declare

The missing datum is the same shape as everything else in the registry: what the
vendor's own documentation says, verbatim, never derived from the name (the rule
MV-59 already holds graphers to). Two fields:

- the **scaffold artifact** whose absence means "this tool is not installed
  here" — for spec-kit, `.specify/`; openspec has its own,
- the vendor's **own init command**, verbatim and verified by running it:
  `specify init --here --integration claude --force`. Verified in a scratch
  repo: it writes `.specify/**` — scripts, templates, and
  `memory/constitution.md` as the unfilled template — plus ten
  `.claude/skills/speckit-*/SKILL.md`, and it does **not** touch
  `.claude/settings.json`. Note the flag is `--integration`, not `--ai`; the
  integration name is what selects the harness, and on Claude the steps install
  as hyphenated skills (`/speckit-specify`), which the registry note already
  records.

## Running it, not just naming it

Naming the command in the refusal is the minimum. Running it is the point: an
SDD declared and not installed is a declaration nobody has acted on, and the
lifecycle already has precedent for doing the network work you explicitly asked
for — `change plan` clones a declared repo that is missing locally, called out
in the manual as "the one place implicit cloning is allowed, because you
explicitly asked for an operation that needs it".

`specify init` downloads its templates, so this stays out of `verify`, `doctor`
and `doors`, which MV-01 forbids from touching the network. The lifecycle is
where it belongs, printed before it runs, and skipped entirely when the scaffold
artifact is already there.

## What this does NOT automate

The scaffold is the tool's own **terminal** command. It is not a step, and
declaring it changes nothing about MV-51: the steps stay chat commands the agent
runs, and multivac still never shells one out. `specify` ships exactly three
subcommands — `init`, `check`, `version` — so there is no
`specify constitution` to call even if the rule allowed it.

Three actors, and the middle one cannot be moved:

| | who | why |
| --- | --- | --- |
| `specify init` | multivac, here | a real vendor command |
| `/speckit-constitution` | the agent | authorship from the project's own context |
| "no longer the unfilled template" | multivac, MV-76 | whole-file equality, a fact on disk |

A scaffold that also tried to produce the document would leave the template
sitting there and call the step done, which is precisely the outcome MV-65
names: a present artifact that proves nothing is treated as missing.

Open for the spec: whether a scaffold command that fails leaves the gate closed
with the tool's own stderr (the shape MV-50 already uses for a failing grapher
refresh), and whether `doctor` should report a declared-but-unscaffolded SDD the
way it reports a missing constitution.

## Order

This one lands first. MV-73 and MV-74 are already declared and are sitting at
exactly the gate this change exists to open — until it lands, the honest way
through is one `--no-sdd`, stated out loud rather than configured away.
