# Contract: CLI surface and output

Nothing printed changes. This contract exists to say so, and to name what is
asserted about the file that is written.

## Unchanged — the report on a flag the config does not answer

```text
init: .multivac/config.yml kept — edit it directly, then `multivac doors`
init:   --sdd speckit is not in it: add `sdd: speckit` there, then `multivac doors`
```

Exit 0. After this change the second line is also true: nothing in the run acts
on `--sdd speckit`.

## Unchanged — the refusal, the agreement report, the first run

Byte for byte as MV-91 shipped them.

## The file, before and after

```text
$ mvac init --quiet .            # config declares no sdd
$ mvac init --sdd speckit .      # reported unanswered
$ grep -c 'Features gate through' AGENTS.md
0                                # was: 1
$ mvac doors                     # nothing edited
$ grep -c 'Features gate through' AGENTS.md
0                                # the second command names the same: none
```
