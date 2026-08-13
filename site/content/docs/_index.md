---
title: Documentation
---

**multivac** (CLI alias `mvac`) is a brain-driven development tool: one brain
repo — claims, law, ritual — from which an entire ecosystem of code repos is
developed. You enter the brain, and the change flows out across whatever repos
the feature touches. The core is deterministic: no API key, no network, no
model call in the verification path.

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

## How to read these docs

[Concepts](concepts) explains the model, in dependency order:

1. [Brain-driven development](concepts/brain-driven-development) — the
   practice: the brain repo, its three layers, and how enforcement runs.
2. [Claims and anchors](concepts/claims-and-anchors) — the unit of truth and
   the grammar that verifies it.
3. [The change](concepts/the-change) — the cross-repo change lifecycle.
4. [Invariants](concepts/invariants) — how law is born, amended, and retired.
5. [Distribution](concepts/distribution) — mounts, pins, doors, and skills.

Command-level behavior is authoritative in the CLI itself: `multivac
<command>` prints usage for every subcommand.
