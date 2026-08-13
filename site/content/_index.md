---
title: multivac
layout: hextra-home
---

{{< hextra/hero-headline >}}
Your agent verifies its own context before acting
{{< /hextra/hero-headline >}}

{{< hextra/hero-subtitle >}}
Brain-driven development: one brain repo — claims, law, ritual — from which an entire ecosystem of code repos is developed.
{{< /hextra/hero-subtitle >}}

{{< hextra/hero-button text="Get the concept" link="docs/concepts" >}} {{< hextra/hero-button text="GitLab" link="https://gitlab.com/ulm0/multivac" >}}

Named for Asimov's world-computer — the brain everyone consults, which in "The Last Question" finally answers. CLI alias: `mvac`.

{{< hextra/feature-grid >}}
  {{< hextra/feature-card
    title="Claims with anchors"
    subtitle="The unit is the claim, not the document: statement, authority, and a content-based anchor — `present`, `absent`, `unique`, `count` — inline in the markdown."
    link="docs/concepts"
  >}}
  {{< hextra/feature-card
    title="Deterministic verify"
    subtitle="`mvac verify` checks every anchor against the declared repos: no LLM, no network, offline. The tombstone blocks; the presence check reports and self-heals."
  >}}
  {{< hextra/feature-card
    title="The ecosystem change"
    subtitle="`change new → plan → apply → land → close`: a branch per repo, merge requests in declared landing order, and close verifies the claims the change promised."
  >}}
  {{< hextra/feature-card
    title="Doors for every harness"
    subtitle="One canonical `AGENTS.md`, projected to each harness as symlink or stub — plus git hooks, so everything that commits runs `verify`."
  >}}
  {{< hextra/feature-card
    title="Tombstones for the dead"
    subtitle="A retired mechanism is declared dead where someone will look for it: `absent` anchors that block, across every repo in the ecosystem."
  >}}
  {{< hextra/feature-card
    title="Adapters that automate"
    subtitle="SDD tools and graphers as declared adapters: proposed at `change new`, graphs refreshed on edit. An absent adapter degrades the feature, never the exit code."
  >}}
{{< /hextra/feature-grid >}}

Design validated against a real production ecosystem: 95.1% of 82 real invariants anchorable. The tool is an early build, pre-release.
