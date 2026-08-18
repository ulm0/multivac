# Contract: CLI surface and output

## Refusal — a flag disagrees with the config

```text
mvac: init refused — .multivac/config.yml already declares sdd: speckit and --sdd says opsx
mvac:   the config is authoritative on a re-run; a flag cannot change it, and init will not write a door that disagrees with it
mvac:   change it in .multivac/config.yml then run `multivac doors`, or drop --sdd
```

Two disagreements, one refusal:

```text
mvac: init refused — .multivac/config.yml already declares sdd: speckit and --sdd says opsx
mvac: init refused — .multivac/config.yml already declares grapher: graphify and --grapher says codegraph
mvac:   the config is authoritative on a re-run; a flag cannot change it, and init will not write a door that disagrees with it
mvac:   change them in .multivac/config.yml then run `multivac doors`, or drop the flags
```

Exit 1. Nothing is written.

## Report — a flag the config already answers

```text
init: .multivac/config.yml kept — edit it directly, then `multivac doors`
init:   --sdd speckit and --grapher graphify are already what it declares — nothing to change
```

## Report — a flag the config does not answer

```text
init: .multivac/config.yml kept — edit it directly, then `multivac doors`
init:   --sdd speckit is not in it: add `sdd: speckit` there, then `multivac doors`
```

## Silence

A re-run with no flags reports only the line it reports today. A first run is
unchanged in every respect.
