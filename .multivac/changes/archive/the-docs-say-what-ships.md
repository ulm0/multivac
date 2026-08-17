---
slug: the-docs-say-what-ships
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches: []
  adds:
    - MV-84
  retires: []
claims:
  - id: MV-84
    statement: The site's pages carry exactly one version string, and a test says what it must equal.
---

# 0.3.0, and the pages stop claiming a release state the manifest contradicts

Three versions are published. The install page tells a reader the binary prints
`1.0.0`, that the package is `private: true`, and that it is unreleased. None of
those has ever been true of a published multivac. The landing page calls the
project "an early build, pre-release" three releases in.

That happened under a law table with 83 anchored rows, and it is worth naming
why: MV-68 pins the tag to the manifest, MV-77 pins the site badge to the
manifest, MV-78 requires a dated changelog entry for the declared version. All
three hold *pinned* strings equal. **None of them says anything about a version
somebody typed into prose**, and prose is what the reader reads.

MV-84 is that rung. The site's pages carry exactly one version string — measured
at three today, one after these corrections — and MV-77's test says that one is
the badge and equals the manifest. Neither check says that alone.

## What 0.3.0 contains

Read from `git diff v0.2.0..main`, not from the change files: `parse.ts`'s diff
is a refactor and the release must not be credited with a parser change it did
not make.

- **MV-82**, the one behaviour change that can newly refuse an existing
  repository. The scanner used to skip any line containing the substring
  `@anchor`; it now skips a line only when it carries a complete anchor comment.
  Lines that were invisible are now scanned, so a tombstone over them can start
  refusing — which is the fix working.
- **MV-83**, the site serving its own type. Documentation; an installed tool is
  unaffected.

## What this change does not touch

Publishing. The tag is pushed after the manifest, the changelog and the badge
agree locally, so the publish job's own check confirms rather than discovers.
