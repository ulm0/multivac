---
slug: frontmatter-safety
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-15
  retires: []
claims:
  - id: MV-15
    statement: "Claim prose survives the frontmatter: any statement — colons like `staleness: block`, hashes, quotes, newlines, leading dashes — round-trips through serialize/parse unchanged and unreflowed, and a frontmatter YAML error names the offending line and the quoting fix instead of the raw parser message."
---

# Claim prose survives the frontmatter

Statements are prose. Prose contains colons. `staleness: block` inside a
frontmatter value dies with a raw `implicit map keys need to be followed by
map values` and no idea which line, which key, or what to type instead.

Two fixes, both in `change/file.ts` so every writer and reader routes through
them:

1. `serializeChange` disables line folding (`lineWidth: 0`). The `yaml`
   library already quotes what needs quoting; folding was the remaining way a
   statement came back looking different from how it went in.
2. `parseChange` translates the parser's error: file line number, the offending
   source line, and the quoted rewrite to type.

Anchors for MV-15 live on the invariants row; fixtures in
`test/change/file.test.ts`.
