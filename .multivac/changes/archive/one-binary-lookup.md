---
slug: one-binary-lookup
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-50
    - MV-52
    - MV-66
    - MV-75
    - MV-90
    - MV-115
  adds:
    - MV-123
  retires: []
claims:
  - id: MV-123
    statement: "Every command multivac runs for an SDD or grapher adapter, and every surface that says whether that command can run, finds each of the adapter's `required` binaries through one lookup: PATH first, trying PATHEXT's extensions on win32, then the root's own `node_modules/.bin`. What runs is what that lookup found. A binary that is not found is named with its adapter, the registry's install line and the vendor's repository. The speckit scaffold passes `--ignore-agent-tools`. A vendor command that fails is quoted by its cause (a traceback's closing exception, else the lines naming an error, a refusal, a denial or something not found, else its last lines, at most three), and never by banner or box-drawing lines."
---

# One binary lookup

Two rules decide whether a vendor binary is there. A failed vendor command is
quoted by whatever it printed first. Measured on 2026-09-14 against this
build, in scratch repos with HOME isolated and a constructed PATH:

- **Two lookups disagree.** The validator and the scaffold look on PATH, then
  in the root's `node_modules/.bin`. `doctor`, `doors`, the refresh at close
  and the graph gate look on PATH alone. With `openspec` and `graphify` stubs
  only in the brain's `node_modules/.bin`, `doctor` printed
  `opsx @ brain: … binary missing → npm i -g @fission-ai/openspec` for a
  validator the apply gate runs from that very directory, and
  `graphify @ brain: artifact ok · binary missing`. `doors`, the refresh and the
  gate use the same PATH-only probe in their source.
- **Neither lookup knows PATHEXT.** On win32, `specify.exe` and
  `graphify.exe` read as absent. This is inferred from the source (audit C46)
  and was not reproduced: nothing here runs win32.
- **The scaffold needs `claude`.** spec-kit 1.0.6's
  `specify init --here --integration claude --force`, with `specify` on PATH
  and no `claude`, exits 1 and writes nothing. It prints 34 lines on stdout and
  nothing on stderr. `claude not found` is line 28, inside a box, next to a tip
  to pass `--ignore-agent-tools`. With that flag it exits 0 and writes
  `.specify` and `.claude`.
- **A failure quotes its banner.** In that brain, `change new` printed
  `left no .specify in brain — it said: ███████╗██████╗ …` and exited 0: the
  first three non-empty lines are spec-kit's logo. graphify 0.9.29
  `update .` with `graphify-out/` read-only exits 1 with a 16-line traceback.
  Its last line is the cause:
  `PermissionError: [Errno 13] Permission denied: 'graphify-out/.rebuild.lock'`.
  The refresh's quote, read from its source, is the first three lines:
  `Traceback (most recent call last):`, a `File` line holding this machine's
  absolute path, and `sys.exit(main())`. MV-50 promises "the TOOL'S own first
  stderr lines", and spec-kit writes nothing to stderr.
- **A missing binary never names its vendor.** Every shipped entry records a
  `source`, and no message prints it. `binaries` means "any of", which suits
  detection and cannot say "all of these must be found before this runs".

MV-123 makes one lookup answer for every adapter binary, in the root the
command runs in. It adds a `required` list to each entry, has the scaffold pass
`--ignore-agent-tools`, and quotes a failure by its cause. A command run through
a shell reaches the root's `node_modules/.bin` after PATH, so what runs is what
the lookup found.

Out of scope, on purpose:
- Refusing when a binary is missing. Each call site keeps its outcome: the
  scaffold and the refresh warn and go on, the gates refuse, `doctor` reports.
  `init` refusing before it writes is a later change that uses this lookup and
  this message.
- Which integration the scaffold installs: `--integration claude` still
  ignores `doors:`.
- Telemetry opt-outs in a spawned tool's environment, tool prerequisites such
  as a Python version, and a timeout on vendor commands.
- The multivac runner ladder (MV-92), the tracker CLIs and the pre-commit
  framework's binary. None of them is an adapter binary, and their probes stay.
