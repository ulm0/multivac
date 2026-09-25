# Data model: Doors reach every harness and say the truth

No persistent storage. The entities are the registry's declarations and the
per-root values the passes compute from them.

## DoorTarget (src/adapters/registry.ts, existing)

| field | change |
| --- | --- |
| `door` | for `cursor`, becomes `AGENTS.md` |
| `kind` | `canonical` \| `symlink` \| `stub` \| `native`; for `cursor`, `stub` becomes `native` |
| `retired` | NEW, optional: a path a `doors` run must unproject, used for `.cursor/rules/multivac.mdc` |

`kind: 'symlink'` is what the link pass keys on. It holds for `claude` and
`gemini` today.

## HarnessPlatform (src/adapters/registry.ts, existing `harness.platforms`)

| field | change |
| --- | --- |
| `key` | unchanged: the value passed to the vendor's install |
| `probe` | unchanged: the file that proves it installed |
| `section` | NEW: `canonical` \| `own-door` \| `none`, measured per platform in research.md R1 |
| `redundant` | NEW, optional: true where the platform's own file repeats what the canonical section already says, so it is skipped when the section is present |

`section` for graphify 0.9.29: `codex`, `opencode` and `amp` are `canonical`;
`claude` and `gemini` are `own-door`; `agents`, `cursor` and `copilot` are
`none`. `redundant` is set on `cursor` only.

## Derived: does a root's door cite the vendor's section

A declared door cites it when its platform's `section` is `canonical`, or when
the platform's `section` is `own-door` and that door's target kind is `symlink`,
because the vendor then writes through the link into the canonical door (R2).
`grapherLines` in src/doors/brain.ts computes this; today it asks only whether
a platform exists.

## Derived: the law prefix for a door

`projectLawLines` and `sddLines` in src/doors/brain.ts take a prefix, empty in
the brain and `<mount>/` in a consumer, so every law path a door prints is one
that repo can open. src/doors/consumer.ts passes the mount it already holds.

## Per-root pass order inside installHarness

1. skip when the root resolves no grapher, is read-only, or the grapher declares
   no harness map;
2. link every declared door whose target kind is `symlink`;
3. run the installs that are missing, skipping a `redundant` platform when the
   canonical door already carries the section, and running `canonical` platforms
   before that decision is taken;
4. rewrite absolute binary paths in the harness's hook files, always.
