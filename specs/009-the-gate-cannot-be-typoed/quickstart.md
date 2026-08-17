# Quickstart: typo it on purpose

## The one that matters

```sh
mvac doctor --sttrict ; echo "exit $?"
```

**Before**: a full report, exit 0. **After**: a refusal naming `--sttrict`, no
report, exit 2.

## Every command, measured — not sampled

Use a function, never an unquoted variable in a loop. In zsh `$c` does not
word-split, and a loop written that way measures "unknown command" nine times
(research D0):

```sh
probe() { node dist/cli.js "$@" >/dev/null 2>&1; echo "  mvac $* -> $?"; }
for f in init seed verify count doors doctor repos change help; do
  probe "$f" --zzz-not-a-flag
done
```

Expect **2** from all nine.

## The positional half

```sh
mvac doctor /tmp        ; echo "exit $?"   # refuses: doctor declares no dir
mvac doors  /tmp        ; echo "exit $?"   # refuses: doors takes no arguments
mvac seed   /tmp        ; echo "exit $?"   # proceeds: seed declares [dir]
```

## Nothing declared broke *(gated)*

```sh
pnpm test
node dist/cli.js verify --strict
node dist/cli.js doctor --strict ; echo "exit $?"
node dist/cli.js count 'brain:site/content/** /[0-9]+\.[0-9]+\.[0-9]+/'
```

## The refusal comes before the writing *(gated)*

```sh
d=$(mktemp -d) && cd "$d" && git init -q .
mvac init . --providers x ; echo "exit $?"
ls -a          # expect: . .. .git — no .multivac, no AGENTS.md
cd - && rm -rf "$d"
```

A command that refuses after writing has still written. This is FR-004, and the
registry test asserts it for every command rather than for the one that was
easiest to check.

## The tenth command *(gated)*

Add a command to the registry with no argument checking and run `pnpm test`. It
must fail and name that command. This is the only part of the change that
survives the author who forgets — which, on the evidence of three commands out
of nine, is the normal case.
