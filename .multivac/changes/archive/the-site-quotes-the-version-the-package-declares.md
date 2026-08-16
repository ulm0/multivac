---
slug: the-site-quotes-the-version-the-package-declares
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-77
  retires: []
claims:
  - id: MV-77
    statement: The version the site advertises is the version the package declares, compared by a test because no anchor can compare two files.
---

# The site quotes the version the package declares

The home badge read `v0.1.0` while `package.json` said `0.1.1` and npm was
already serving `0.1.1`. The site stated a published fact wrongly — in a repo
whose thesis is that an unchecked claim decays, on the first release it ever
made.

MV-68 already pins one corner of this: the publish job refuses unless the git
tag equals `package.json`'s version. The site was the third corner and nothing
held it. It drifted immediately.

## Why this is a test, not an anchor

`v0.1.0` is a perfectly well-formed badge. There is nothing malformed for a
regex to catch, and an anchor pinned to the literal current version would have
to be edited by the same hand that just forgot to edit the badge — the guard and
the bug share an author. Only comparing the two files answers it, which is the
shape MV-02, MV-22 and MV-72 already use.

The anchors here do what anchors can: prove the test still says what it was
written to say, and prove the badge still has the shape the test parses. If
someone rewrites the badge markup, the `unique` leg goes red rather than the
test quietly matching nothing.

Verified negatively before landing: flipping the badge back to `v0.1.0` fails
with both values named. A guard that has never failed is not known to be a
guard.
