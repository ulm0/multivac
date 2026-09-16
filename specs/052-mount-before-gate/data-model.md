# Phase 1 — Data model

Three things change shape: one config key, one derived state per declared repo, and one
predicate about a checkout.

## `brain_url` — the address consumers clone the brain from

| | |
|---|---|
| yml key | `brain_url` (top level) |
| `Config` field | `brainUrl?: string` |
| type | string, optional |
| default | none — absent means "not declared" |
| written by | a human. `init` writes it **commented**, never as a declaration. |
| read by | the mount pass in `repos sync`, and nothing else |

Rules:

- Added to `refuseUnknown`'s top-level key list in `src/lib/config.ts`, so a typo is
  refused rather than ignored, like every other key.
- Parsed with the existing `optString`.
- Never derived. No code path may fall back to `git remote get-url origin`, or to the URL
  recorded in some other repo's `.gitmodules`.
- Whitespace-only is not a declaration: it is refused at load with the same message shape
  as other bad values.

## Mount state of a declared repo

Derived per repo, offline, from three existing reads plus one new one. This is the state
the mount pass branches on and the state `doctor` and `doors` report.

| State | How it is decided | What `repos sync` does |
|---|---|---|
| `not-mine` | `readOnly(cfg, key, dir)` returns a reason — `managed: false` or shallow (MV-125) | nothing; names the reason |
| `brain` | `entry.isBrain` | nothing; there is no mount in the brain |
| `absent-clone` | the repo directory does not exist | nothing beyond today's clone/`no url` handling; no mount attempted in a repo that is not there |
| `committed` | `git ls-tree HEAD -- <mount>` yields a `160000` entry | nothing; reports the mount is present |
| `staged` | not in HEAD, but `git ls-files -s -- <mount>` yields a `160000` entry | nothing; reports it is staged and a human must commit it |
| `missing` | none of the above | `git submodule add <brain_url> <mount>` |
| `empty` | `committed` or `staged`, `<mount>/.multivac/config.yml` does not exist, and the directory is missing or has no entries | `git submodule update --init -- <mount>` |
| `stale` | `committed` or `staged`, not a brain, and the directory has entries | report the pin and `submodule update --remote`; never fill or move it |
| `drift` | a note on any gitlink state: `.gitmodules` records a url that is not `brain_url` | report it and the `set-url` that would change it; never rewrite |

`committed` is today's `lsTreeGitlink`. `staged` is the new read, and it exists because
of measurement 3/4 in [research.md](./research.md): right after the pass runs, the
gitlink is in the index and not in HEAD, so without it a second `repos sync` would fail
on its own work.

The `missing` branch itself has two outcomes git decides, not multivac:

- the mount directory does not exist → git clones it (network) and stages;
- the mount directory is already a clone of the brain → git adopts it into the index, no
  network, recording the declared URL.

and two failures it reports:

- the directory exists and is not a git repo → `fatal: '<mount>' already exists and is
  not a valid git repo`;
- anything else git refuses — transport policy, auth, no such remote.

Both are quoted by cause (MV-123's `quoteFailure`), name the repo, and do not abort the
remaining repos.

## Projected door — is this checkout one multivac claimed?

A predicate over a directory, used only on `verify`'s no-config path.

```
hasProjectedDoor(dir) =
  isOurShim(read(dir/.multivac/hooks/pre-commit))
  or isOurShim(read(dir/.multivac/hooks/pre-push))
```

`SHIM_HEADER` and `isOurShim` already exist in `src/hooks/install.ts` and are reused
unchanged. An unreadable or absent file is `false`.

The predicate is asked only after `findMount` and `findStaleMount` have both come back
empty — so it never changes a checkout where the brain is reachable, and never overrides
the stale-mount message.

## Resulting `verify` outcomes on the no-config path

| Checkout | Today | After |
|---|---|---|
| door, no mount, no stale mount | exit 2, `run multivac init .` | warning naming the repo unverified and `multivac repos sync`, exit 0 |
| no door, no mount | exit 2, `run multivac init .` | unchanged |
| stale mount (`.brain`/`.knowledge` present, not a brain) | exit 2, `update the submodule` | unchanged |
| mount reachable | scoped consumer report | unchanged |
