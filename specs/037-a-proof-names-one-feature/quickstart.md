# Quickstart — proving a proof names one feature

## Before

```sh
mkdir -p specs/030-points-expire && touch specs/030-points-expire/spec.md
mvac change new expire "Expire"
mvac change plan expire      # proceeds — on another feature's spec
```

## After

```sh
mvac change plan expire
# refused — specs/<n>-expire/spec.md is missing — looked in brain

mkdir -p specs/031-expire && touch specs/031-expire/spec.md
mvac change plan expire      # proceeds

mkdir -p specs/032-expire && touch specs/032-expire/spec.md
mvac change plan expire
# refused — specs/<n>-expire/spec.md matches more than one place in brain:
#   specs/031-expire/spec.md, specs/032-expire/spec.md
```

## The suite

```sh
pnpm test
```
