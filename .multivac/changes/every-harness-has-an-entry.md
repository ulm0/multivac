---
slug: every-harness-has-an-entry
status: open
repos:
  self:
    status: branched
landing_order:
  - - self
invariants:
  touches: []
  adds:
    - MV-28
  retires: []
claims:
  - id: MV-28
    statement: "Every harness multivac integrates with is a registry entry in
      src/adapters/registry.ts: `doors` and `doctor` dispatch on the entry's
      `kind`, never on its name, a `native` entry projects nothing beyond the
      canonical AGENTS.md, and an `unsupported` entry is refused with the reason
      recorded in the data."
---

# Every harness has an entry

The registry ships entries for every harness the site is about to document —
claude, cursor, opencode, codex, gemini, copilot, windsurf — plus the honest
gap (aider). Each entry records what the vendor's own docs say the harness
reads, verified against a primary source URL kept in the data.

Harnesses that read `AGENTS.md` natively get kind `native`: the canonical door
is the whole integration, and the note says so instead of inventing a second
file. Harnesses with no repo-level door multivac can own get kind
`unsupported` with the reason — refused by `doors`, reported by `doctor`.

`doors` and `doctor` dispatch on the entry's `kind`, never on its name, so the
next harness is an entry and nothing else. Graphers keep the generic
`<name>-out/graph.json` contract; the known ones that do not fit it
(`codegraph`) carry their verified artifact, binary and refresh command.
