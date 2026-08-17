# Research: The gate cannot be typoed

Phase 0. Three decisions, and one measurement that corrected an earlier one.

---

## D0 — The earlier measurement was wrong, and the tool was not at fault

A first pass reported "init exits 1, everything else exits 2" from a shell loop:

```sh
for c in "init . --providers x" "doctor --sttrict" …; do node dist/cli.js $c; done
```

In **zsh**, unquoted `$c` does not word-split. Every iteration passed one
argument — the whole string — so every probe measured *unknown command*, which
correctly exits 2. The harness was lying, not the tool.

Re-measured with `probe() { node dist/cli.js "$@"; }`:

| command | undeclared argument | documented |
| --- | --- | --- |
| `doctor --sttrict` | **0** | 2 |
| `doors --x` | **0** | 2 |
| `seed --x` | **0** | 2 |
| `init . --providers x` | **1** | 2 |
| `verify --loud` | 2 | 2 |
| `change --bogus` | 2 | 2 |
| `count --x` | 2 | 2 |
| `help --x` | 2 | 2 |
| `repos bogus` | 2 | 2 |

Four commands wrong, not one. **Every number in this change is from the second
measurement**, and the first is recorded here rather than quietly replaced.

---

## D1 — Refuse undeclared *arguments*, not undeclared flags

Reading each command's declared usage against its code found the same defect in
a second shape.

`doctor` declares `usage: multivac doctor [--strict]` — no directory — and its
body is `doctorReport(ctx.cwd, strict)`. So `mvac doctor /other/repo` produces a
truthful report about the working directory, with nothing marking that the
argument was discarded. `doors` declares "No arguments" and takes `_argv`.

**Decision.** The rule is about arguments. A flag the command does not declare
and a positional the command does not declare are the same mistake with the same
consequence: it proceeded on a question you did not ask.

**Alternative rejected**: flags only. Smaller diff, and it leaves
`mvac doctor /other/repo` answering about somewhere else — which is the worse
half, because a wrong flag at least changes nothing and a wrong directory
changes the whole answer.

**Consequence, and it belongs in the changelog**: this can newly refuse a
command line that worked before. Anyone running `mvac doctor .` gets a refusal.
That is a behaviour change for an existing user and goes under *read before
upgrading*, not under *fixed*.

---

## D2 — One helper, three call sites, and the law states behaviour not mechanism

`verify` and `change` consume valued flags (`--repo <key>`, `--landed <repo>`),
so a helper that fits them is a real argument parser. They already refuse
correctly.

**Decision.** A ten-line helper for the simple surfaces; the four broken
commands use it or, for `init`, return 2 from the parser it already has. The
five correct commands are not rewritten.

MV-85 therefore states **the behaviour** — a command refuses what it does not
declare — and not "every command calls this function". A future command that
hand-rolls a correct loop satisfies the row, and the registry-walking test says
so.

**Alternative rejected**: a dependency. `yargs`, `commander`, `minimist` all do
this. The law pins two runtime dependencies and calls a third a design change.
For surfaces of zero-to-four flags this would be a library to avoid ten lines.

**Alternative rejected**: rewriting all nine onto one parser. Uniformity for its
own sake, a large diff over five working code paths, and a real regression risk
in `verify`, which runs in the pre-commit hook.

---

## D3 — The test walks the registry, because a list would go stale

The defect is that three of nine authors forgot. A test enumerating nine command
names would be written by someone who could equally forget the tenth.

**Decision.** The test imports the command registry and iterates it. A command
added later is covered without anyone remembering, which is the only mechanism
that survives the failure mode this change exists to fix.

**Side-effect safety, which is FR-004 and not a detail.** The test invokes every
command with a bogus argument. `init`, `doors` and `seed` all write files. If a
command refuses only after writing, the test's temp directory shows it — so the
test asserts the exit code *and* that the directory is unchanged. That is the
one assertion that makes SC-005 measured rather than assumed.
