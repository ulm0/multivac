---
slug: site-quotes-the-binary
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-31
    - MV-43
  adds: []
  retires: []
claims:
  - id: MV-31
    statement: "The reference section documents the whole surface: one heading per shipped command, one per configuration key the loader reads, and one per harness entry in the registry — including the entries marked unsupported."
  - id: MV-43
    statement: "`each` is the universal quantifier: a leg in mode `each` holds iff every file its glob matches (after exclusions) contains at least one match, and `each!` iff every such file contains none. A glob matching zero tracked files is a blocking failure (a universal over nothing proves nothing), the failing files are named in the report (first few + count), `.sql` files match per normalized statement as everywhere else, and both forms gate by default alongside `absent` and `count` — `count=N` stays a deletion ratchet and the docs say which measured claims still need the cross-file relation that deliberately does not exist."
---

# The site quotes today's binary

The measurement-2 prover swept the site against the built binary after the
four on-ramp changes and found three quoted strings describing yesterday's
tool — the exact defect class this tool exists to prevent:

- `docs/guide/install.md` quotes a `mvac --help` block without the `count`
  and `help` commands the dispatcher ships.
- `docs/reference/configuration.md` quotes the `blocking` mode error as
  `allowed: present, absent, unique, count` — the binary says `, each` too.
- `_index.md`'s claims feature card lists the anchor modes without `each`.

Three line fixes, and three anchor legs on the rows that own those surfaces
(MV-31: the reference documents the surface; MV-43: `each` exists and the
docs say so), so the next surface change breaks verify instead of the reader.
No new law: the reserved MV-44 was returned.
