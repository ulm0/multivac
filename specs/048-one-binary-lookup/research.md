# Research: One binary lookup

Sources:
- Audit 2026-09-13 C08, C12, C46 and C57, and the 2026-09-14 requirements
  synthesis, §2.3 item 25, §3 R1 and §6 row 3.
- The change file's measurements: spec-kit 1.0.6 and graphify 0.9.29, run with
  HOME isolated and a constructed PATH, with their output recorded.
- This repo at `6833eac`. All line numbers below are from that commit.

## R1: The probes

- **Evidence**:
  - `binaryPresent` (detect.ts:162-167) asks `onPath` (:149-159), a PATH walk
    with `access(X_OK)`, for any of `spec.binaries`. Its callers are
    refresh.ts:93 and :258, doctor.ts:218 and :301, and doors.ts:193.
  - `toolVerdict` (sdd.ts:150-160), which serves the scaffold (:263) and the
    validator (:453), adds `existsSync(join(cwd, 'node_modules', '.bin', bin))`
    and never checks the executable bit.
  - Measured: with stubs only in the brain's `node_modules/.bin`, `doctor`
    printed `opsx @ brain: … binary missing` and
    `graphify @ brain: artifact ok · binary missing`.
- **Decision** (detect.ts):
  - `findBinary(bin, root, env = process)` returns the absolute path of the
    first regular, executable file (`stat().isFile()`, then `access(X_OK)`)
    among the non-empty PATH entries in order, then `localBin(root)`. It
    returns null when there is none. A relative PATH entry is resolved against
    `root`, where the command runs, so the path returned is the file executed.
  - `localBin(root) = join(root, 'node_modules', '.bin')`.
  - `missingRequired(spec, root)` lists the `required` binaries not found. It
    takes no `env`: only `findBinary` is tested with one.
  - `binaryPresent`, `toolVerdict`'s probe and `doctor`'s per-name caches
    (doctor.ts:202, :284) are deleted, because the answer now depends on the
    root.
- **Kept**: `onPath`, for `findRunner` (install.ts:66-92, MV-92),
  `preCommitGate` (:126) and `binaryReady` (tracker.ts:104). None of these is an
  adapter binary.
- **Rejected**:
  - Rebuilding `onPath` on `findBinary`, which would change MV-92's ladder on
    win32.
  - `command -v`, because `doctor` and `doors` spawn nothing (MV-01).
  - A `which` package (MV-02).

## R2: PATHEXT

- **Evidence**: inferred from source only (audit C46, "partially-confirmed").
  On win32 node reads `X_OK` as `F_OK`, so `specify.exe` never matches `specify`.
- **Decision**:
  - `env` is `{ platform, PATH, PATHEXT }`.
  - On win32, PATH splits on `;`. Each name is tried with each PATHEXT entry, in
    order, first as spelled and then lower-cased, in PATH and then in
    `localBin`. An empty PATHEXT tries the bare name.
  - Elsewhere PATH splits on `:` and PATHEXT is ignored.
- **Ceilings**:
  - Never run on win32.
  - Node 20.12.2 refuses to `execFile` a `.cmd` or `.bat` without a shell
    (documented, not run).
  - `refreshGraph`'s `sh -c` needs a POSIX shell.

## R3: `required`

- **Decision**:
  - `AdapterSpec.required: string[]`, where every binary listed must be found:
    speckit `['specify']`, opsx `['openspec']`, graphify `['graphify']`,
    codegraph `['codegraph']`.
  - A declared grapher gets `[decl.binary ?? decl.refresh.split(' ')[0]]`, the
    expression `binaries` uses (registry.ts:658).
  - A test asserts that each shipped command's first word is in `required`.
- **`binaries`**: it keeps its "any of" meaning, as the user decided. Its
  comment (registry.ts:240) stops claiming the run capability. After this
  change nothing reads it.
- **Rejected**: `claude` in `required`. The flag makes it unnecessary (R6).

## R4: What runs is what was found

- `toolVerdict(spec, cmd, cwd)` returns `{ kind: 'missing', bins }` when a
  required binary or the command's first word is not found. Otherwise it runs
  `execFileP(found, args, { cwd })`, so the PATH copy wins (US1 AS3).
- Close runs `execFileP('sh', ['-c', run], { cwd: dir, env: { ...process.env, PATH: PATH + delimiter + localBin(dir) } })`.
  MV-115's leg still matches.
- `refreshHookCmd` puts `PATH="$PATH:$PWD/node_modules/.bin";` after
  `REFRESH_HEAD`.
  - `ownsRefresh` (settings.ts:106) still owns the entry, and a `doors` re-run
    rewrites an old one in place.
  - `$PWD` is the directory the relative lock uses, so it has the lock's
    ceiling.
- `doors` asks `missingRequired(spec, dir)` for the root it projects into.
- **Ceiling**: a declared command whose first word is not its binary (`env X=1
  tool`) is looked up by the wrong name unless it declares `binary:` (MV-115).

## R5: The missing-binary line, and each outcome

`binaryMissing(name, spec, bins, scope)` sits in registry.ts beside
`unverifiedGrapher`, and prints:
`` `specify` found on neither PATH nor brain's node_modules/.bin — install speckit: uv tool install specify-cli (https://github.com/github/spec-kit) ``.
With no `source`, the parenthesis reads `declared in .multivac/config.yml
(graphers.<name>), no vendor repository on record`.

| site | today | after (outcome unchanged) |
| --- | --- | --- |
| runScaffold (sdd.ts:264-272) | warn once per binary: `is not on PATH … install it:` | warn once per root: `` `<run>` cannot be run — <line> `` |
| judgeSdd (sdd.ts:454-468) | refuse: `is not on PATH`, `install it:` | refuse: `` `<validate>` cannot be run — <line> ``, `--no-sdd` line kept |
| refreshGraph (refresh.ts:93-98) | say `binary not found — … skipped` | say `<build or refresh> skipped — <line>, then <run> there` |
| graphGate (refresh.ts:266-269) | `` `binaries[0]` is not on PATH `` | `<scope>: <line>, then <cmd> there`, still unevaluable |
| doctor (doctor.ts:232, :312, :314) | `binary missing → <hint>` | `binary missing → <line>` |
| projectInto (doors.ts:193) | no hook | no hook |

The scaffold's once-per-binary set, and its "fact about the machine" comment
(sdd.ts:232-235), go. The line names a root, so one line per root is the true
one.

## R6: `--ignore-agent-tools`

- **Measured** on 1.0.6:
  - `specify init --here --integration claude --force` with no `claude` exits
    1 and writes nothing. It prints 34 lines on stdout, where `claude not
    found` is line 28 and the tip naming the flag is line 32, and nothing on
    stderr.
  - With the flag it exits 0 and writes `.specify` and `.claude`.
- **Decision**:
  - The argv becomes `… --force --ignore-agent-tools`.
  - The note gives that reason and version.
  - MV-75's leg `specify init --here --integration claude` stays unique, so the
    note does not repeat it.
- **Rejected**:
  - `--non-interactive`, which is absent before 0.16.5 and unneeded without a
    TTY (synthesis §2.3 item 25).
  - A version floor, and `--integration` following `doors:` (later changes).

## R7: The failure quote

- **Recorded**:
  - spec-kit: the block logo is lines 1-6, and the error box is lines 26-34,
    with `claude not found` on line 28. Today's quote is lines 1-3.
  - graphify: stdout is `Re-extracting code files in . (no LLM needed)...`, and
    stderr is a 16-line traceback that ends in
    `PermissionError: [Errno 13] Permission denied: 'graphify-out/.rebuild.lock'`.
    Today's quote is its header and first `File "/Users/…"` frame.
- **Decision**: `quoteFailure(err)` in `src/lib/out.ts` reads the lines of
  `${stdout}\n${stderr}`:
  1. Split on `\r?\n`. Drop lines made only of U+2500–U+259F and whitespace,
     and trim that same range and whitespace off both ends of the rest, so a
     double or heavy box trims like a rounded one.
  2. After the last `Traceback (most recent call last):`, take the first line
     that does not start with whitespace.
  3. Else take the lines matching
     `/\berror\b|\brefus|\bdenied\b|\bnot found\b/i`.
  4. Else take the last lines.
  - Keep ≤ 3 lines, joined with `; `. With nothing left, use
    `message.split('\n')[0]`.
  - `toolVerdict`'s JSON branch (sdd.ts:167-180) runs first, unchanged.
- **Results**:
  - spec-kit gives `Agent Detection Error; claude not found`.
  - graphify gives the `PermissionError` line.
  - The existing `error: permission denied` fixtures (sdd-gates.test.ts:722,
    :898) and grapher-refresh's `ERROR: cannot write …` quote as themselves.
- **Order**: stdout first. The refresh read stderr first (refresh.ts:122), and
  one rule keeps one order.
- **Rejected**:
  - stderr only, since spec-kit writes nothing there.
  - Last lines only, which give spec-kit's install link and tip.
  - ANSI stripping, since Rich prints none without a TTY.
- **Ceiling**: the cause words are English.

## R8: Tests and fixtures

- **Recordings**: `test/helpers/recorded.ts` holds `SPECKIT_106_NO_CLAUDE` and
  `GRAPHIFY_0929_READONLY`. Home paths become `/home/user`, and the wrapped
  working path becomes one `/tmp/repo` line. No quoted line changes, and spec-kit
  keeps line 28 of 34.
- **The `specify` stub (C57)**:
  - `stubSpecify` builds every sdd-gates specify script, including the inline
    ones at :887 and :971, through a `failIn` option.
  - Without the flag, and with no `claude` on its PATH, it prints the recording
    and exits 1.
  - Otherwise it compares `"$*"` with the argv pinned in the test, not read
    off the registry, and exits 97 on a mismatch.
- **Host PATH**: these four get `<bin>:/usr/bin:/bin`:
  - sdd-gates.test.ts:114;
  - grapher-refresh.test.ts:100;
  - doctor.test.ts:297;
  - doors.test.ts:238-245, whose `grapher: node` needs the host's `node`.
- **Wording moves (SC-006)**: sdd-gates :431-432, :458 and :752-753;
  grapher-refresh :136 and :273; grapher-gate :140; doctor :107 and :143.

## R9: Law notes

Each note begins `**Amended 2026-09-14 by MV-123**:` and is appended at the
row's end.
- **MV-50**:
  - "when the binary is on PATH" means found by MV-123's lookup in that root,
    and the shell reaches its `node_modules/.bin`.
  - "the TOOL'S own first stderr lines" is WITHDRAWN: spec-kit's cause is on
    stdout, and graphify's first stderr lines are a traceback header.
  - A failure is quoted by its cause, and the notice names the install line and
    the vendor's repository.
- **MV-52**: "its binary is present" means every `required` binary is found for
  the root projected into. The hook reaches `$PWD/node_modules/.bin` after PATH,
  with the lock's ceiling.
- **MV-66**:
  - "on `PATH` and then in `node_modules/.bin` beside the artifact" is now
    every adapter binary's lookup, with PATHEXT on win32, and a match must be an
    executable file.
  - The refusal names the vendor's repository, and a non-JSON failure is quoted
    by its cause.
- **MV-75**: the verbatim init gains `--ignore-agent-tools`. On 1.0.6, without
  it and without `claude`, init exits 1 and writes nothing.
- **MV-90**: "whose binary is not on PATH" means a `required` binary the lookup
  does not find. The refusal names it with the install line and the repository.
- **MV-115**: the first-word ceiling now describes a declared grapher's
  `required`, and "`binaryPresent`" is WITHDRAWN as the probe's name.

## R10: MV-123's legs

```text
<!-- @anchor MV-123 brain:src/adapters/detect.ts /export async function findBinary\(/ unique -->
<!-- @anchor MV-123 brain:{src,test}/** /binaryPresent/ absent -->
<!-- @anchor MV-123 brain:src/** !src/adapters/detect.ts !src/hooks/install.ts !src/adapters/tracker.ts /onPath\(|X_OK|'node_modules', '\.bin'/ absent -->
<!-- @anchor MV-123 brain:src/adapters/registry.ts /required: \['/ count=4 -->
<!-- @anchor MV-123 brain:src/adapters/registry.ts /--force --ignore-agent-tools'/ unique -->
<!-- @anchor MV-123 brain:src/adapters/registry.ts /found on neither PATH nor/ unique -->
<!-- @anchor MV-123 brain:src/{adapters/sdd,adapters/refresh,commands/doctor}.ts /binaryMissing\(/ each -->
<!-- @anchor MV-123 brain:src/lib/out.ts /export function quoteFailure\(/ unique -->
<!-- @anchor MV-123 brain:src/adapters/{sdd,refresh}.ts /quoteFailure\(err\)/ each -->
<!-- @anchor MV-123 brain:src/adapters/{sdd,refresh}.ts /filter\(Boolean\)\.slice\(0, 3\)|^[[:space:]]*\.slice\(0, 3\)$/ absent -->
<!-- @anchor MV-123 brain:src/doors/settings.ts /PATH="\$PATH:\$PWD\/node_modules\/\.bin";/ unique -->
<!-- @anchor MV-123 brain:src/adapters/refresh.ts /localBin\(dir\)\]/ unique -->
<!-- @anchor MV-123 brain:{*.md,src/**,test/**,site/content/**,skills/**,.claude/skills/**} !CHANGELOG.md !.claude/skills/speckit-*/** !src/adapters/tracker.ts !test/change/tracker.test.ts /is not on PATH|first stderr lines|three-line quote|binary not found —|a fact about the machine|the tool.s own stderr|[Bb]inary (probed )?on PATH|integration claude --force([^ ]|$)/ absent -->
<!-- @anchor MV-123 brain:.multivac/invariants.md /Amended 2026-09-14 by MV-123/ count=6 -->
```

- **Counts** from `multivac count` at `6833eac`, then as expected:

  | legs | at `6833eac` | expected |
  | --- | --- | --- |
  | 1, 5, 6, 8, 11, 12 | 0 | 1 |
  | 2 | 13 in 5 files | 0 |
  | 3 | 2, both in sdd.ts | 0 |
  | 4 | 0 | 4 |
  | 7, 9 | 0 | a match in every file |
  | 10 | 2 (sdd.ts:182, refresh.ts:126) | 0 |
  | 13 | 30 in 12 files | 0 |
  | 14 | 0 | 6 |

  Legs 11 and 12 match code, not prose: one `each` over both files was
  satisfied by settings.ts's doc comment with the hook's PATH append deleted.

  Leg 10 leaves sdd.ts:522's `open.slice(0, 3)` alone.
- **Leg 3** matches call syntax and the quoted join, never prose. The excluded
  files hold the lookup and the out-of-scope probes.
- **Leg 13** excludes the tracker files, and `.multivac/` is outside it, because
  the notes quote what they withdraw.
- **Moved**:
  - MV-50 :293 → `brain:src/adapters/refresh.ts /skipped — \$\{binaryMissing\(/ unique`.
  - MV-50 :295 → `brain:src/lib/out.ts /err\.stderr \?\? ''/ unique`.
  - MV-52 :320 → `brain:src/commands/doors.ts /missingRequired\(spec, dir\)/ unique`.
    A present leg with no quantifier self-heals: with doors.ts reverted it
    matched refresh.ts too and verify rewrote its glob there. `unique` never
    heals.
  - MV-66 :478 → `/kind: 'missing'; bins: string\[\]/ unique`.
  - MV-66 :479 → `brain:src/adapters/detect.ts /'node_modules', '\.bin'/ unique`.
- **Unmoved and still green**: MV-66 :482-483, MV-75 :549, MV-115 :905, and
  MV-50 :294 (`failed (${said})`, with `said = quoteFailure(err)`).

## R11: The row (≤ ~400 words, `specified | proposed | 2026-09-14`, no pipe)

- **Lead**: one lookup finds an adapter's binaries, a missing one names its
  vendor, and a failure is quoted by its cause.
- **Defects**: the change file's five, one clause each.
- **Rule**:
  - `findBinary` is the only adapter-binary lookup.
  - Surfaces ask `missingRequired` in the root the command runs in, run what was
    found, and a shell reaches that `node_modules/.bin`.
  - `required` is declared and `binaries` stays "any of".
  - The line names the binary, the adapter, the install line, and `source` or
    the declaration. What a call site does next stays with the row governing
    it (MV-50, MV-52, MV-66, MV-75, MV-90); FR-007 binds this change, not the law.
  - The scaffold passes `--ignore-agent-tools` (1.0.6).
  - `quoteFailure` is the one quote.
- **Mechanical**: the fourteen legs.
- **Ceilings**:
  - win32 was never run, and a `.cmd` is not spawned without a shell.
  - The cause words are English.
  - The hook runs from `$PWD`.
  - A declared grapher without `binary:` is looked up by its first word.
  - The legs see spellings, never a new probe under new names.

## R12: The bite while the change is open

A broken leg reads pending while MV-123 is `proposed` (047 R10). In a scratch
clone of the finished work, set MV-123 `active` and move the change file aside.
Then each of these must give exit 1:
- `binaryPresent` back in doors.ts (leg 2);
- `join(cwd, 'node_modules', '.bin', bin)` back in sdd.ts (leg 3);
- the `.slice(0, 3)` quote back in refresh.ts (leg 10);
- "is not on PATH" back in graphers-and-sdd.md (leg 13);
- a note removed (leg 14);
- the hook's `PATH="$PATH:$PWD/node_modules/.bin";` deleted from settings.ts
  (leg 11).
