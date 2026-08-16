---
title: Install
weight: 1
---

```sh
npx multivac init
```

That is the whole thing. No install, no clone, no global.

## Requirements

| requirement | why |
| --- | --- |
| **Node.js ≥ 24** | declared in `engines`; the CLI is ESM and uses modern `node:` APIs |
| **git** | `verify` shells out to `git ls-files`; the brain and every repo are git-native |

Nothing else. Two runtime dependencies, `picomatch` and `yaml`, and that
count is itself law — a third is a design change, not a convenience.

## Try it, then keep it

`npx` fetches and runs without installing anything, which is the right shape
for the first command you ever run against a repo:

```sh
npx multivac doctor        # what it would find here
npx multivac init          # write the brain
```

Once you know you want it, put it on your `PATH` so the hooks find it too:

```sh
npm i -g multivac
# or: pnpm add -g multivac
```

**The hooks care which one you did.** The shims try `mvac` on `PATH` first,
then `npx --no-install multivac`, then a repo-local build. `npx --no-install`
resolves a package already present in the project, not one it has to fetch —
so a global install, or multivac as a devDependency of the brain, both arm the
floor. `npx multivac` typed by hand does not, because nothing persists.

An early build: **0.1.0**, pre-release. The CLI surface below is what ships
today, and the parts still moving say so where they appear.

## Or from source

For working on multivac itself, or to run an unreleased commit:

```sh
git clone https://gitlab.com/ulm0/multivac
cd multivac
corepack pnpm install
pnpm run build
pnpm link --global      # optional; every command also works as `node /path/to/multivac/dist/cli.js`
```

The repo develops with pnpm and says so if you reach for another one:

```txt
$ npm install
multivac develops with pnpm — run: corepack pnpm install
```

That guard is scoped to the repo. Installing the published package with `npm`
or `npx` is entirely fine — a tool that refused its own users' package manager
would be a tool nobody installs.

## Two names, one binary

```json
"bin": {
  "multivac": "dist/cli.js",
  "mvac": "dist/cli.js"
}
```

`multivac` and `mvac` are the same file. The docs use them interchangeably:
`multivac` in prose where it reads better, `mvac` in shell blocks where it is
shorter. **The hooks look for `mvac` first** — the shims try `mvac` on
`PATH`, then `npx --no-install multivac`, then a repo-local `dist/cli.js`
with its `node_modules` beside it. Expose `mvac` and the first rung hits; with
none of the three the shim warns on stderr and exits 0, verifying nothing.
See [Hooks](../../reference/hooks).

## Check it

```txt
$ mvac --version
1.0.0
```

```txt
$ mvac --help
multivac <command> [args]

commands:
  init       scaffold the brain: everything multivac owns under .multivac/
  seed       deterministic boundary inventory -> .multivac/seed-report.md
  verify     check anchors against the declared repos (deterministic, offline)
  count      dry-run an anchor leg: match count + per-file breakdown, verify's own matcher
  doors      project doors + install git hooks into the brain and declared repos
  doctor     what is declared, what was found, what is degraded, how to fix it
  repos      list declared repos; `repos sync [--shallow]` clones the missing, fetches the rest
  change     new/plan/apply/land/close — the ecosystem change lifecycle
  help       help <topic|command> — `help anchor` prints the anchor grammar on one screen
```

{{< callout type="warning" >}}
The version string is the `package.json` version, which is `1.0.0` while the
package is `private: true` and unreleased. Treat the build you cloned as the
identity, not that number.
{{< /callout >}}

## Every machine needs its own runner

The hooks travel with the clone — `core.hooksPath` points at a versioned
`.multivac/hooks/` — but the binary does not. On a machine where none of the
three runners resolves, the shim prints one warning to stderr and exits 0:
the commit lands, unverified. That is deliberate, and it is why the install
above is per machine and why `multivac doctor` names the runner it found, or
says `INACTIVE`. See [Hooks](../../reference/hooks).

## Next

Scaffold a brain: [Getting started](../getting-started).
