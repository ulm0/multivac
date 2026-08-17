# Quickstart — proving it works

Two levels: the suite, which is what CI and the pre-commit hook run, and a hand
check against a real ecosystem, which is where this defect was found and is the
only place the cascade is visible at full size.

## Prerequisites

- Node >= 24, `corepack pnpm install` done in this repo.
- For the hand check only: `specify` and `graphify` on PATH. Without them the
  run still works — it reports the install hints and builds nothing, which is
  itself one of the scenarios worth seeing.

## 1. The suite

```bash
pnpm test
```

Expected: every test passes, including the ones this feature adds to
`test/change/sdd-gates.test.ts`, `test/doctor/adapters.test.ts` and
`test/change/grapher-refresh.test.ts`.

The scenarios that must be in there, stated as outcomes rather than as code —
`tasks.md` decides how each is built:

| Scenario | Expected |
| --- | --- |
| One repo has the SDD artifact, four roots do not | the four are scaffolded, the one is silent |
| Every root already has it | nothing runs, nothing is printed |
| A declared repo is absent from disk | not a root; nothing is created for it |
| A repo declares `sdd: none` | never scaffolded, never gated, no deficiency line |
| One root's init fails | reported in the tool's own words; the remaining roots are still attempted |
| An init exits 0 and writes nothing | that root is reported as still not equipped |
| `sdd_auto: false`, and `--no-sdd` | nothing scaffolds, nothing gates |
| Two roots lack the constitution | `change plan` refuses naming both |
| A root without the tool installed lacks the constitution | not asked, not refused |
| `doctor` over a mixed ecosystem | one line per root, each with its own verdict |
| A scope with no graph | built with `create ?? refresh` |
| A scope with a graph | refreshed, exactly as today |

## 2. The law and the anchors

```bash
node dist/cli.js verify
```

Expected: every claim anchored, `0 blocking broken`. MV-87's legs must resolve
against the code this change lands — a row that passes because nothing anchors
it is the failure mode Principle I exists to catch.

## 3. The hand check, against a real ecosystem

Any brain with more than one declared repo will do. The one this was measured
in has six roots, one of which was equipped by hand months ago.

```bash
cd <a brain with several declared repos>
mvac doctor | grep -E '^(sdd|grapher)'
```

**Before**: one `sdd <tool>: artifact ok` line for the whole ecosystem, and
`grapher … artifact missing` for every repo but the brain.

**After**: one `sdd` line per root, each naming its scope; the repos without the
tool say so and name what would install it.

Then open a change and watch the cascade:

```bash
mvac change new "prove the cascade"
```

**Expect**: the tool's own init announced and run in each root that lacks it,
one line per root, and the graph built once in each scope that has none. Run it
again — the second run is silent, because every artifact now exists.

Clean up the scratch change with `mvac change close prove-the-cascade`, or
delete `.multivac/changes/prove-the-cascade.md` and its reserved row by hand if
it never got that far.

## What "done" looks like

- `pnpm test` green, `verify` at `0 blocking broken`.
- In a six-root ecosystem, one lifecycle run leaves every declared, present root
  equipped — where today it leaves zero.
- No line in any output claims a root is equipped on the strength of another
  root's files.
- `verify`, `doctor` and `doors` still spawn no foreign tool and make no network
  call.
</content>
