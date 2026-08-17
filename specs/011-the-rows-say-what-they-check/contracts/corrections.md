# Contract: what each correction says afterwards

## Code moves

**MV-46** — `greenfield()` stages the one file it wrote:

```ts
await gitRun(abs, ['add', 'AGENTS.md']);
```

and the leg stops looking for prose:

```
<!-- @anchor MV-46 brain:src/** /\['add', '-A'\]/ absent -->
```

The claim "`add -A` appears nowhere in the lifecycle" becomes literally true,
and the leg fails the moment anyone writes a sweep.

**MV-45** — `--abandon` reads what the other path reads, before archiving:

```ts
const anchored = await anchoredClaimIds(brain);
const dest = await archiveChange(brain, parsed);
const freed = await releaseUnused(brain, slug, anchored);
```

## Rows move

| row | withdrawn | replaced by |
| --- | --- | --- |
| MV-51 | "the ONE subprocess it may spawn is the validator" | two, named: the validator and the SDD's own init (MV-75), with the invariant that survives — no *fake step* is ever invoked |
| MV-56 | "shells out for validation only" | shells out for validation and for the declared scaffold, never to fake an agent-run step |
| MV-31 | "including the entries marked unsupported" | withdrawn with a dated note; MV-28 removed that kind |

## Rows gain their limit

| row | claim kept | limit added |
| --- | --- | --- |
| MV-57 | `doctor` reports STALE when the law outran the document | mtime-based, and git does not preserve mtimes: silent on a fresh clone, real only where the file was edited |
| MV-21 | build-critical untracked files are named | the script match is a substring test — it misses concatenated paths and matches a path inside a longer one |

## Documents

| file | was | is |
| --- | --- | --- |
| `CONTRIBUTING.md` | "mark it unsupported with the reason" | no entry at all, per MV-28 — an entry is how this tool says "supported" |
| `DESIGN.md` | `ripgrep` engine, sha-keyed cache in `.multivac/cache/` | one in-process `RegExp` per leg, no cache |

## What no correction may do

Change behaviour a user depends on, except where a row already promised the
corrected behaviour. Both code edits qualify: MV-46 and MV-45 describe what the
tool was always supposed to do.
