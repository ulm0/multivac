# Contract: the config gate

## Refused — the configuration is modified and no change is open

```text
  config    .multivac/config.yml is modified and no change is open — it decides which repos are verified and which gates run · blocking
            open one first (`multivac change new "<title>"`), or drop the edit
```

Exit 1, from the pre-commit hook.

## Allowed — a change is open

```text
  config    .multivac/config.yml is modified, declared by open change <slug>
```

## Allowed — created rather than modified

```text
  config    .multivac/config.yml is new here — creating one is free; a brain has to start somewhere
```

## Silence

Nothing printed when the configuration is not staged, when there is no previous
commit, or when the checkout is not the brain.

## Unanswered

```text
  config    not answered — the index could not be read here
```

Never assumed clean.
