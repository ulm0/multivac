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
is also what CI does.

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
  doors      project doors + install git hooks into the brain and declared repos
  doctor     what is declared, what was found, what is degraded, how to fix it
  repos      list declared repos; `repos sync [--shallow]` clones the missing ones
  change     new/plan/apply/land/close — the ecosystem change lifecycle
```

{{< callout type="warning" >}}
The version string is the `package.json` version, which is `1.0.0` while the
package is `private: true` and unreleased. Treat the build you cloned as the
identity, not that number.
{{< /callout >}}

## In CI

The brain repo needs the same build before it can verify. multivac's own
pipeline is the reference:

```yaml
selfverify:
  image: node:24
  before_script:
    - corepack enable
    - corepack prepare pnpm@10.20.0 --activate
  script:
    - pnpm install --frozen-lockfile
    - pnpm run build
    - node dist/cli.js verify --strict
```

`--strict` is the CI policy: presence and uniqueness failures gate too, not
just tombstones. See the [exit matrix](../../reference/commands#verify-dir---strict---check---repo-key).

## Next

Scaffold a brain: [Getting started](../getting-started).
