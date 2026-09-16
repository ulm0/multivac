# Contract — the command surface this feature changes

Wording below is the shape the implementation must keep; exact strings are fixed by the
tests and by MV-127's legs.

## `multivac repos sync [--shallow]`

Unchanged: clones a declared repo that is missing and has a `url`, fetches one that is
present, reports `no url, cannot sync`, exits 1 on a clone failure.

Added: after the clone/fetch step, one mount line per declared repo — on every run, for
every repo on disk, so the pass reconciles rather than sets up once.

| State | Line |
|---|---|
| mounted, in HEAD | `<key>: brain mounted at <mount>` |
| mounted, staged only | `<key>: brain mounted at <mount> — staged, commit it in that repo` |
| created now | `<key>: mounted the brain at <mount> — staged in <path>, commit it there (multivac does not commit in your repos)` |
| adopted an existing checkout | same line; git's own `Adding existing repo` is not re-printed |
| gitlink present, checkout empty | `<key>: filled the empty brain mount at <mount>` (runs `git submodule update --init -- <mount>`) |
| gitlink present, checkout has files but is not a brain | `<key>: brain mount at <mount> is not a multivac brain — its pin predates the brain, or points at the wrong commit; multivac does not move it (git -C <path> submodule update --remote <mount>)` — exit unaffected |
| recorded url differs from `brain_url` | the present/staged/filled line, plus `— recorded url <x> is not brain_url <y>; multivac does not rewrite it (git submodule set-url <mount> <y>)` |
| read-only | `<key>: <reason>, read-only — no mount expected` (the wording `doctor`'s pins line already uses) |
| the brain itself | no line |
| not cloned | no mount line; the existing clone/`no url` line stands alone |
| `brain_url` not declared | once, not per repo: `no brain_url in .multivac/config.yml — multivac will not guess it from a git remote; add the URL other people clone the brain from, then re-run \`multivac repos sync\`` |
| git refused | `<key>: could not mount the brain at <mount> — <quoted cause>`, e.g. `fatal: '.brain' already exists and is not a valid git repo` — the key names the repo, so no path is repeated |

Exit: 1 if any mount failed, as for a clone failure. A missing `brain_url` is exit 0 —
it is an undeclared value, not a failure.

`--shallow` is unchanged and unrelated: a shallow clone is read-only, so it takes the
read-only line.

## `multivac verify` run in a consumer checkout

Unchanged for every checkout where a brain is reachable, and for the stale-mount case.

New, only where the checkout has a projected door, no config, no mount and no stale
mount:

```
warn: <dir> was NOT verified — it carries a multivac door but no brain is mounted at
      <mount>. Nothing here was checked against any law.
      Fix: run `multivac repos sync` in the brain, then commit the mount here.
```

Exit 0.

Where the checkout has no door, today's message and exit 2 stand byte for byte:

```
no .multivac/config.yml in <dir> — run `multivac init .` to create it
```

## `multivac doctor`

The `pins` line keeps its shape and changes the fix it names:

```
<key>: no brain mount at <mount> — run `multivac repos sync` to add it
```

A mount that exists only in the index gains its own value, so a human is not told to
create what they already have:

```
<key>: brain mount staged, not committed — commit it in <path>
```

Everything else on that line — `pin ok`, `pin N behind`, `not cloned`, the read-only
reasons — is unchanged.

## `multivac doors`

Adds one report line where any declared, writable, cloned repo has no mount:

```
mounts     <key>, <key>: no brain mount — unverified until `multivac repos sync`
```

`doors` performs no clone, no submodule operation and no network call. It reads the same
offline state `doctor` does.

## `multivac init`

`renderConfig` writes, after the adapter keys:

```yaml
# brain_url: <detected origin>   # the URL others clone the brain from — uncomment to enable
```

With no detectable origin, the same line with no value and a note that multivac could not
detect one. The commented line is never read back as a declaration.

## The consumer door

Where the door tells a reader to make the mount usable, it names multivac's command
first and git's second:

```
**First, before reading anything in it:** if `<mount>` is empty, ask the brain's owner to
run `multivac repos sync`, or `git submodule update --init --remote <mount>` yourself.
```

## Invariants this contract must not break

- `verify`, `doctor` and `doors` make no network call.
- multivac makes no commit in a consumer repo.
- `readOnly` (MV-125) is the only definition of a repo multivac may not write in.
- A failed vendor command is quoted by `quoteFailure` (MV-123).
- Git runs through an argument vector, never a shell, and multivac never passes
  `-c protocol.file.allow=...`.
