# Contract: `multivac roadmap sync`

## Creating

```text
sync gitlab: 3 changes to project
  planned tracker-projects-the-roadmap → #41 created
  open    the-consumer-door-carries-the-ecosystem → #42 created
  archived the-gate-runs-what-you-built → #40 closed
recorded 2 issue numbers in .multivac/changes/ — commit them: the number is the identity
```

## Running again

```text
sync gitlab: 3 changes to project
  planned tracker-projects-the-roadmap → #41 up to date
  open    the-consumer-door-carries-the-ecosystem → #42 updated (state)
nothing recorded — every change already carries its issue number
```

Never a second issue for a change that has one.

## Nothing declared

```text
sync: no tracker declared — add `tracker: gitlab` or `tracker: github` to .multivac/config.yml
```

Exit 0. Nothing done.

## The tool is not installed

```text
mvac: sync refused — `glab` is not on PATH, so no issue can be created or updated
mvac:   install it (https://gitlab.com/gitlab-org/cli), or drop `tracker:` from .multivac/config.yml
```

A projection that cannot run must not report success.

## A recorded number whose issue is gone

```text
  open    points-expire → #37 not found in the tracker — reported, not re-created; clear `issue:` to make a new one
```

Silently creating a second issue is how a change ends up with two.

## Labels

Only `multivac::planned`, `multivac::open`, `multivac::archived` are written.
Every other label on the issue is left exactly as it was.

## What must never happen

Nothing the tracker says changes a change file, and this never runs from
`verify`, `doctor` or `doors`. MV-99 carries an `absent` leg over those three.
