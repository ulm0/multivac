# Contract: CLI surface and output

## Refusal — a root keeps its graph out of the repository

```text
graph: `change close points-expire` refused — 2 roots keep their graph out of the repository
  api: graphify-out/graph.json is untracked — `git -C ../api add graphify-out/graph.json`
  web: graphify-out/graph.json is ignored by .gitignore — remove the rule, then `git -C ../web add graphify-out/graph.json`
  or skip the gate without losing the tool: `--no-grapher` for one run, `grapher_auto: false` in .multivac/config.yml for good
```

Exit 1. The change is not archived.

## `doctor` — the same state, without closing anything

```text
grapher    graphify @ api: artifact ok · binary ok · fresh · UNTRACKED → git -C ../api add graphify-out/graph.json
grapher    graphify @ web: artifact ok · binary ok · fresh · IGNORED by .gitignore → remove the rule, then git add
```

`doctor` reports; it does not gate. Bare `doctor` still exits 0.

## Unchanged

The missing-artifact refusal, the binary-not-on-PATH refusal, both skip
switches and their printed notice, and `--abandon`'s exemption.
