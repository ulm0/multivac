# Phase 1 — Data model: The engine reads one way, round two

## Heal candidate

| Candidate | Before | After |
| --- | --- | --- |
| same trailing extension as the include, outside `.multivac/` | heals | heals |
| a different extension — prose quoting the pattern | **heals** | refused, and named |
| inside `.multivac/` | refused | refused |
| include with no trailing extension | heals | heals — only the `.multivac/` fence applies (stated ceiling) |

## Enumerated entry

| git mode | Meaning | Before | After |
| --- | --- | --- | --- |
| `100644`, `100755` | file | listed | listed |
| `120000` | symlink | **listed, and read differently by each reader** | not listed |
| `160000` | gitlink | listed | not listed |
| a path at several merge stages | — | listed once | listed once |

## Report when nothing heals

| Situation | Line |
| --- | --- |
| no candidates at all | the pattern was found nowhere (as today) |
| candidates existed but every one was fenced | names what was refused, and why |
