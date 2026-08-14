---
slug: seed-finds-the-contracts
status: open
repos:
  brain:
    status: planned
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-38
  retires: []
claims:
  - id: MV-38
    statement: "Seed knows where architecture lives, as registry data: policy gates, workspace/build graph, deploy manifests, runtime config, models/schema and decisions/intent are pattern entries in the category registry; fixture, example and vendored trees are excluded; and the report ends with the three open questions every cold adopter hit — debt or intent, law or taste, which authority wins — instantiated against what seed found and handed to the interview."
---

# seed finds the contracts

Measurement 2, §3: seed supplied the content of 9 of 52 rules and named zero
architecture files on two of three subjects. Every miss is a registry line —
policy gates (.semgrep/, .pre-commit-config.yaml), the workspace/build graph
(pnpm-workspace.yaml, turbo.json), deploy manifests (0 of 94 non-CI YAML files
surfaced on S2), runtime config (settings.py fed 5 of 16 invariants, absent
from the report), models/schema (1,459 migrations listed, the 42 models.py
they migrate invisible), decisions/intent (7 ADRs → 2 invariants). And the
noise: 415 of S3's 543 package.json are test fixtures.

The fix is data, not code: categories become picomatch pattern entries, the
next category is an entry. Excludes drop fixtures/, examples/ and vendored
trees before classification. Each category caps at 25 listed files plus a
count.

The handoff: the report now ends with the three questions all three cold
adopters baked into their laws as guesses — is this violation debt or intent,
which prose is law vs taste, which authority wins — instantiated against the
gates, prose and deploy stacks seed actually found, and pointed at the
interview protocol. Flow: seed → questions → interview → law.
