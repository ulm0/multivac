---
slug: site-docs-second-audit
status: open
repos:
  brain:
    status: branched
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-156
  retires: []
claims:
  - MV-156
---

# The pages say what the code does, second audit

A second audit of the site against the built 0.15.0 binary, 2026-10-05, found the pages still claiming more than the code does, and quoting output it does not print. This includes a sentence MV-155 itself wrote. The why, the design and the tasks are in `specs/085-site-docs-second-audit/`.

Findings dropped, not edited in: `F001` and `F002` fall on released `CHANGELOG.md` entries (the 0.15.0 byte figures are the MV-152 measurement as released; the 0.6.0 provenance note was true then), and a changelog is history. `F044` named a sentence on `reference/_index.md` that states the page's intent; its real defect, the `--help` block on `commands.md`, was fixed under its own row. Example law IDs in tutorial rows and sample output (`INV-02`, `INV-19`, `INV-xx`) are illustrative, not this repo's law, and stay.

Behaviour that reads as a code defect is documented as it is, never changed here: the candidates are in `specs/085-site-docs-second-audit/code-defects.md`, each one a lead to verify before the roadmap takes it.

Checked three ways: an audit of 2625 claims, then a writer and an independent checker per page over four rounds, then a final read-only pass that re-checked all 157 original findings against the new text (none still true) and re-read about 1750 statements. Later rounds find ever finer scoping of text the earlier rounds wrote; this change stops when the pass finds only that.
