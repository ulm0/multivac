# Quickstart — proving the boundary refuses

```sh
T=$(mktemp -d) && cd "$T" && git init -q .
mvac init --quiet .
printf 'strict_pre_push: true\n' >> .multivac/config.yml
mvac doors
grep -c 'verify --strict' .multivac/hooks/pre-push     # 3

printf 'repos: [not a map\n' >> .multivac/config.yml
mvac init --quiet .                                     # before: exit 0
grep -c 'verify --strict' .multivac/hooks/pre-push     # before: 0 — disarmed
# after: init refuses, and the count is still 3
```

And the other three:

```sh
printf 'strict_prepush: true\n' >> .multivac/config.yml   # refused, names strict_pre_push
printf 'requires: ">=0.4.0" # floor for CI\n' >> .multivac/config.yml  # read as a floor
mvac init --sdd speckti --quiet "$T2"                     # exit 2, nothing written
mvac init --sdd= --quiet "$T3"                            # exit 2, not 1
```

## The suite

```sh
pnpm test
```
