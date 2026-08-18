# Contract: the hook shim

## Runner order

Tried in this order, first match wins:

1. `<root>/dist/cli.js` — the multivac built in this repository
2. `<root>/node_modules/multivac` — the multivac this repository declares
3. `mvac` on PATH — whatever the machine has

The repository's own gates run before any of them, and their exit code wins.

## Nothing runnable

Unchanged, and still never blocks:

```text
multivac: hooks INACTIVE — no runnable multivac, nothing was verified. Fix: install multivac (npm i -g multivac), or build it here (pnpm install && pnpm run build)
```

## A successful run says nothing about which runner it chose

The line would appear on every commit. The two cases that matter already speak
for themselves: nothing runnable prints the report above, and a version mismatch
between the brain and the running multivac is what MV-86's notice reports.

## The build

Clears its compiled output before compiling. Nothing is printed for it — a build
that quietly does the right thing needs no line.
