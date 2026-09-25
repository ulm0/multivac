# Contract: what the commands print

Lines are stable text other surfaces and tests match on. `<scope>` is the root
key, `<name>` the grapher.

## equip, through init, repos sync and the lifecycle

| condition | line |
| --- | --- |
| a symlink door was created | `graph <name> @ <scope>: linked <door> -> AGENTS.md before <name>'s own install` |
| the door exists as a regular file | `graph <name> @ <scope>: <door> exists as a regular file — merge it into AGENTS.md and remove it to get the symlink` |
| the link points elsewhere | `graph <name> @ <scope>: <door> is a symlink elsewhere — repoint it at AGENTS.md or remove it` |
| symlinks are not permitted | `graph <name> @ <scope>: symlink not permitted on this platform — read AGENTS.md directly, or enable developer mode to get <door>` |
| a platform is skipped as redundant | `graph <name> @ <scope>: <key> skipped — AGENTS.md already carries the \`## <name>\` section` |
| a hook file named the binary absolutely | `graph <name> @ <scope>: <file> named <bin> by an absolute path — rewritten to \`<bin>\`, found on PATH` (unchanged text) |

Nothing is printed when a link is already correct or a rewrite changes nothing.

## doctor

| condition | line fragment |
| --- | --- |
| an install is missing | ` · harness install missing for <keys> → <commands>` (unchanged) |
| the canonical door lacks the section | ` · AGENTS.md has no \`## <name>\` section, which the door cites → <command naming a platform whose section is canonical, or an own-door platform whose door is a symlink>` |
| no declared platform writes the section | the fragment above is not printed at all, because no door cites it |

## doors

| condition | line |
| --- | --- |
| a retired target's file carried only the managed block | `<path> removed — <harness> reads AGENTS.md` |
| it carried other text too | `<path>: managed block removed; the rest is yours` |

## The brain and consumer doors

- A door cites `## <name>` only where the derived rule in data-model.md holds;
  otherwise it prints the verbs, as it does today for a grapher with no harness
  section.
- Every law path in a consumer door starts with the mount.
