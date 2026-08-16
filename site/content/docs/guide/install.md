---
title: Install
weight: 1
---

multivac is **not published to npm yet**. The name is reserved, nothing is
released under it — `npm i -g multivac` today does not install this tool.
Build from source.

## Requirements

| requirement | why |
| --- | --- |
| **Node.js ≥ 24** | declared in `engines`; the CLI is ESM and uses modern `node:` APIs |
| **pnpm** | the repo pins it — `preinstall` runs `only-allow pnpm`, so `npm install` and `yarn` **fail on purpose** |
| **git** | `verify` shells out to `git ls-files`; the brain and every repo are git-native |

Nothing else. Two runtime dependencies, `picomatch` and `yaml`, and that
count is itself law — a third is a design change, not a convenience.

## Build from source

```sh
git clone https://gitlab.com/ulm0/multivac
cd multivac
pnpm install
pnpm run build
```

That produces `dist/cli.js`. To get it on your `PATH`:

```sh
pnpm link --global
```

`pnpm install` fails loudly if you reach for the wrong package manager:

```txt
$ npm install
ERROR: Use "pnpm install" for installation in this project.
```

If you would rather not link globally, every command in these docs works
with an explicit path — `node /path/to/multivac/dist/cli.js verify` — which
is also the last runner the hook shims try.

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
