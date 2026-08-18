# Data Model: init says what it ignored

## Declared value

What `.multivac/config.yml` says about an adapter (`sdd`, `grapher`). Absent
when the file does not exist or does not name that adapter.

## Requested value

What a flag says (`--sdd`, `--grapher`). Absent when not passed.

## Resolution

| Config file | Declared | Requested | Outcome |
|---|---|---|---|
| absent | — | any | requested wins; it becomes the declared value |
| present | absent | absent | nothing to say |
| present | absent | set | **reported**: the config declares none, so the flag does not take effect; how to make it stick is named |
| present | set | absent | declared wins, silently |
| present | set | same | declared wins, and the flag is reported as already answered |
| present | set | different | **refused**: both values named, both ways forward stated |

Only the last row refuses, and only it stops the command. Every other row leaves
the existing behaviour exactly as it is.

The resolution happens once, before anything is written, and its result is what
the door projection reads. There is no second place where a flag can reach a
written artifact.
