# Data model: The site shows what is published

## Three versions, which were being conflated

| version | lives in | moves when | what it is for |
| --- | --- | --- | --- |
| **declared** | `package.json` at HEAD | the bump merges | what the next release will be |
| **published** | the registry | the publish job succeeds | what a reader can install |
| **advertised** | the site | the site deploys | what a reader is told |

MV-77 held **advertised == declared**. The requirement is
**advertised == published**, and the two coincide only outside the release
window — which is exactly when nobody is looking.

## The stand-in for "published", offline

The registry cannot be asked (FR-006). The last git tag is the substitute, and
it is a good one: MV-68 refuses to publish under a tag that disagrees with the
manifest, so a tag *is* a published version — by refusal, not by inspection.

| state | last tag | advertised |
| --- | --- | --- |
| bump merged, not released | `v0.4.0` | `v0.4.0` — the previous release |
| released | `v0.5.0` | `v0.5.0` |
| no release ever | none | the fallback, which names itself |

## Deployment triggers

| trigger | why |
| --- | --- |
| merge to the default branch | site-only corrections reach readers without a release |
| a release tag, **after** the publish | the badge moves when the release completes, not at the next unrelated merge |

The ordering is the guarantee in FR-005 and is a stage order, not an assertion:
a failed publish leaves the deploy unrun.

## What the repository no longer contains

Any version literal under `site/content/`. MV-84 goes to `count=0`.

The property stops being *checked* and becomes *impossible*, which is the
stronger of the two and the reason the test that used to check it is deleted
rather than rewritten.
