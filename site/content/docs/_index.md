---
title: Documentation
description: >-
  What multivac is, how a brain-driven change moves through it, and every command and configuration key, with the invariant behind each one.
---

**multivac** (CLI alias `mvac`) is a brain-driven development tool: one brain
repo — claims, law, and [ritual](concepts/philosophy#the-ritual) — from which
an entire ecosystem of code repos is developed. You enter the brain, and the
change flows out across whatever repos the feature touches. The core is
deterministic: no API key, no network, no model call in the verification path.

The tool is not a documentation generator. If you develop *from* the brain, a
lying brain doesn't produce ugly docs — it produces confidently wrong code
across N repos. Verification is the precondition; the product is the change.

## The four jobs

1. **Change** — the ecosystem change, planned and executed from the brain. The
   verb the other three serve.
2. **Verify** — the brain's claims checked against the code, deterministically.
3. **Project** — one canonical door (`AGENTS.md`), projected to each harness's
   format.
4. **Distribute** — how the brain reaches consumer repos, pinned, with
   staleness visible instead of silent.

## Three sections, and the changelog

{{< cards >}}
  {{< card link="concepts" title="Concepts" subtitle="The model: why it exists, claims and anchors, the cross-repo change, distribution, how adoption goes." >}}
  {{< card link="guide" title="Guide" subtitle="The path: install, init, fill the brain, write anchors, run a change." >}}
  {{< card link="reference" title="Reference" subtitle="The surface: every command and flag, every config key, every integration." >}}
  {{< card link="changelog" title="Changelog" subtitle="What each release contained. The repository's own CHANGELOG.md, mounted here rather than copied." >}}
{{< /cards >}}

## Where to start

- **New here?** [Philosophy](concepts/philosophy) — the problem this exists to
  solve, in one page.
- **Want it running?** [Install](guide/install), then
  [Getting started](guide/getting-started).
- **Looking up a flag or a key?** [Commands](reference/commands) and
  [Configuration](reference/configuration).
- **Wiring an agent?** [Agent integrations](reference/integrations) and
  [Hooks](reference/hooks).

[Concepts](concepts) is written in dependency order:

1. [Philosophy](concepts/philosophy) — why a paraphrase ages silently and a
   citation does not; who proposes, who enacts.
2. [Brain-driven development](concepts/brain-driven-development) — the
   practice: the brain repo, its three layers, and how enforcement runs.
3. [Claims and anchors](concepts/claims-and-anchors) — the unit of truth and
   the grammar that verifies it.
4. [The change](concepts/the-change) — the cross-repo change lifecycle.
5. [Invariants](concepts/invariants) — how law is born, amended, and retired.
6. [Distribution](concepts/distribution) — mounts, pins, doors, and skills.
7. [Adoption](concepts/adoption) — the arc from `init` to steady state, which
   phase buys what, and how the path differs by the shape you are in.
8. [Composition](concepts/composition) — why spec-driven tools and code
   graphers are built on rather than competed with.
