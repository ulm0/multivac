# Contract: staleness at the start of work

## `multivac change new <slug>` and `multivac change apply <slug>`

When any declared repo pins the brain behind its channel:

```text
brain pins behind their channel — refresh before deciding against the law:
  stale     api: .knowledge pinned 3 behind origin/main (last fetch 6d ago) — `git -C ../acme-api submodule update --remote .knowledge`
```

The heading appears only when there is at least one line under it.

When a channel ref does not resolve locally:

```text
  stale?    api: channel origin/main unknown locally — reported only, cannot gate offline; `multivac repos sync` fetches it
```

## Silence

Every pin current, or nothing to pin: nothing is printed.

## What never happens

Neither command refuses on account of a pin. `staleness: block` still makes
`verify` exit 1, exactly where it already did — this feature adds no second
refusal, and MV-94 says so.
