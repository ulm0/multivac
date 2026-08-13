---
slug: c2-mit-license
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-22
  retires: []
claims:
  - id: MV-22
    statement: 'multivac is MIT licensed, stated in one place and echoed everywhere it matters — a LICENSE file carrying the MIT text and the copyright holder, `"license": "MIT"` in package.json, a README section pointing at the file, and the site footer.'
---

# The license is MIT

The design's open decision "License, and whether the LLM parts are optional"
was half a decision. The licensing half is resolved: **MIT**, owner's call,
2026-08-13. The LLM-optionality half stays open and stays listed.

MIT is the honest fit. The deterministic core is the product and it asks for
no API key; a copyleft licence would buy nothing and cost adoption at exactly
the moment the tool wants to be dropped into someone else's ecosystem.

This is a fact about the repo, not code, so it lands as law rather than as
behaviour: MV-21 anchors the licence into LICENSE, package.json, the README
and the site footer, and `test/invariants/license.test.ts` pins the two
machine-read halves (the file's text and the manifest field) so they cannot
drift apart silently.

Unblocks publishing the real package to npm — the 0.0.1 placeholder went out
as UNLICENSED on purpose.
