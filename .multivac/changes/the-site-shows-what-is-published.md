---
slug: the-site-shows-what-is-published
status: open
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches:
    - MV-77
    - MV-84
  adds: []
  retires: []
claims:
  - id: MV-77
    statement: The site renders the last published tag. It states no version of its own, so it cannot advertise one nobody can install.
---

# The site shows what is published

The site deploys on every merge to `main`, and the badge is a literal held
equal to `package.json` by a test (MV-77). Both of those live at HEAD, and
**neither knows what npm serves**. So the release sequence has a hole in it:

```
bump 0.5.0 → merge to main → THE SITE NOW SAYS 0.5.0 → tag → publish
                             └──────── nobody can install it ────────┘
```

Worse than the window: **if the tag never comes** — release abandoned, publish
failed — the site advertises that version indefinitely, and MV-77 calls it
correct, because the manifest does declare it.

MV-77 pins the wrong pair. The badge should equal what is **published**, and
the offline, deterministic source of that is the last git tag: MV-68 already
refuses to publish under a tag that disagrees with the manifest, so the tag is
the published version by construction.

## Why not deploy the site from tags only

Because site-only corrections would then wait for a release nobody needs to
cut. The 33 prose corrections that landed today would still be unpublished.
Deployment stays on `main`; only the *number* changes its source.

## The one number

The site has exactly one version literal — the badge — because MV-84 pins it at
`count=1` over `site/content/**`. Every install instruction already says
`multivac@latest`. So this is one number, not a sweep through prose, and after
this change MV-84 tightens to **count=0**: the site names no version at all.

## And a stage order that would have reopened the hole

`stages: test → deploy → publish`. Adding pages to the tag pipeline as-is would
deploy the site **before** npm accepted the tarball — the same lie, one minute
long. The stages are reordered so the site follows the publish it describes.
