---
slug: a-boundary-refuses-what-it-cannot-honour
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-108
  adds:
    - MV-114
  retires: []
claims:
  - id: MV-114
    statement: A boundary refuses what it cannot honour — an unknown config key, an unknown adapter name, an empty flag value — by name and with the exit a refused argument gets. It never reads one as declared, and it never proceeds on a config it could not load.
---

# A boundary refuses what it cannot honour

MV-105 unified the FLAG boundary. Four more inputs are the same defect class at
the CONFIG and INIT-VALUE boundaries, which the shared guard never reaches.
Measured on this commit:

- **`init` on a broken config silently disarms a strict gate.** A brain with
  `strict_pre_push: true` has three `verify --strict` lines in its pre-push
  shim. Break the config, run `init .` — the line `doctor` itself prints — and
  the count is **0**, exit 0, no notice. `doors` in the same state exits 1 and
  leaves the gate armed. The difference is a `.catch(() => null)` that reads a
  broken config as no config, so every projection is re-rendered from nothing.
- **An unknown config key reads as declared.** `strict_prepush: true` loads
  clean and arms nothing, and `doctor` still calls the gate armed.
- **A `requires:` floor with a trailing comment enforces nothing.**
  `requires: ">=0.4.0" # floor for CI` is valid YAML on the one line the tool
  tells humans to write, and the regex refuses to see it — beside a comment
  naming this exact disease.
- **`init --sdd speckti` writes the typo into the config**, exit 0, and
  projects a door announcing that features gate through it. A gate claimed
  that can never fire. `--sdd=` exits 1, where a refused argument gets 2.
