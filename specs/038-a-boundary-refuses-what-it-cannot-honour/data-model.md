# Phase 1 — Data model: A boundary refuses what it cannot honour

## Config load, as `init` sees it

| On disk | Before | After |
| --- | --- | --- |
| absent | `null` → scaffold | unchanged |
| present, loads | the config | unchanged |
| present, will not load | **`null` → projects from nothing** | **refused, naming the error** |

`init` loaded three times; it loads once now, and that one truth answers the
door, the hooks and the report.

## Accepted config keys

| Level | Keys |
| --- | --- |
| top | `authorities`, `blocking`, `doors`, `grapher`, `graphers`, `grapher_auto`, `repos`, `requires`, `role`, `sdd`, `sdd_auto`, `staleness`, `strict_pre_push`, `tracker` |
| `repos.<key>` | `channel`, `grapher`, `path`, `role`, `sdd`, `url` |
| `graphers.<name>` | `artifact`, `binary`, `create`, `install`, `refresh` |

Anything else is refused by name. A stray whose case-and-separator-folded form
matches an accepted key is reported with that near miss.

## `requires:` line

| Written | Before | After |
| --- | --- | --- |
| `requires: ">=0.4.0"` | read | read |
| `requires: ">=0.4.0" # floor` | **invisible** | read |
| `requires: "^0.3" # nope` | **invisible** | refused by name |
| `# requires: ">=9.0.0"` | ignored | ignored |

## Adapter name, at `init`

| Value | Before | After |
| --- | --- | --- |
| a known name | written | written |
| a name declared under `graphers:` | written | written |
| an unknown name | **written, door claims a gate** | refused, exit 2, nothing written |
| the empty string | exit 1 | refused, exit 2 |
