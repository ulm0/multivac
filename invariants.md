# Invariants

The law of multivac itself: the brain is this repo, the code is this repo.
Every row is anchored to the source that makes it true; `multivac verify`
checks them on every commit.

| ID | statement | authority | state | date | source |
| --- | --- | --- | --- | --- | --- |
| MV-01 | `verify`, `doctor`, and `doors` never touch the network: no git clone/fetch in their source paths. | specified | active | 2026-08-13 | [DESIGN.md](DESIGN.md) |
<!-- @anchor MV-01 brain:src/commands/{verify,doctor,doors}.ts /'(clone|fetch)'/ absent -->
<!-- @anchor MV-01 brain:src/anchor/** /'(clone|fetch)'/ absent -->
<!-- @anchor MV-01 brain:src/lib/** /'(clone|fetch)'/ absent -->
| MV-02 | Exactly two runtime dependencies: picomatch and yaml. A third is a design change, not a convenience. | specified | active | 2026-08-13 | [DESIGN.md](DESIGN.md) |
<!-- @anchor MV-02 brain:package.json /"(picomatch|yaml)": "/ count=2 -->
<!-- @anchor MV-02 brain:package.json /"dependencies":/ unique -->
| MV-03 | Git runs via execFile with an argument vector, never through a shell. | specified | active | 2026-08-13 | [DESIGN.md](DESIGN.md) |
<!-- @anchor MV-03 brain:src/lib/git.ts /execFile/ -->
<!-- @anchor MV-03 brain:src/lib/git.ts /exec\(|execSync|spawn|shell:[[:space:]]*true/ absent -->
| MV-04 | multivac never fabricates git identity: no writes to user.name or user.email anywhere in the source. | specified | active | 2026-08-13 | [DESIGN.md](DESIGN.md) |
<!-- @anchor MV-04 brain:src/** /user\.(name|email)/ absent -->
| MV-05 | The anchor dialect gate rejects PCRE shorthand classes at write time with a translation hint. | specified | active | 2026-08-13 | [DESIGN.md](DESIGN.md) |
<!-- @anchor MV-05 brain:src/lib/regex.ts /is not POSIX ERE/ -->
<!-- @anchor MV-05 brain:src/lib/regex.ts /RegexDialectError/ -->
| MV-06 | A broken or vacuous leg in a blocking mode exits 1 — the exit matrix has no second answer. | specified | active | 2026-08-13 | [DESIGN.md](DESIGN.md) |
<!-- @anchor MV-06 brain:src/commands/verify.ts /blockingBroken > 0/ -->
| MV-07 | The tombstone cannot be unblocked: config refuses a `blocking:` list without `absent`. | specified | active | 2026-08-13 | [DESIGN.md](DESIGN.md) |
<!-- @anchor MV-07 brain:src/lib/config.ts /must include "absent"/ -->
| MV-08 | Installs are pnpm-only, guarded at preinstall. | specified | active | 2026-08-13 | [package.json](package.json) |
<!-- @anchor MV-08 brain:package.json /only-allow pnpm/ -->
| MV-09 | Verify in a repo without `.multivac/config.yml` resolves the brain through the mount, scopes to that repo's anchors plus `*` anchors, same exit matrix. | specified | active | 2026-08-13 | [DESIGN.md](DESIGN.md) |
<!-- @anchor MV-09 brain:src/commands/verify.ts /findMount/ -->
<!-- @anchor MV-09 brain:src/commands/verify.ts /resolveRepoKey/ -->
<!-- @anchor MV-09 brain:test/verify/consumer.test.ts /scoped/ -->
| MV-10 | With `staleness: block`, a pin behind the declared channel is a blocking verify failure (exit 1) naming the sync command; the default stays `report`, and an unresolvable channel ref reports, never gates. | specified | active | 2026-08-13 | [DESIGN.md](DESIGN.md) |
<!-- @anchor MV-10 brain:src/lib/config.ts /staleness/ -->
<!-- @anchor MV-10 brain:src/commands/verify.ts /staleness[[:space:]]*===[[:space:]]*'block'/ -->
<!-- @anchor MV-10 brain:test/verify/verify.test.ts /staleness:[[:space:]]*block/ -->
| MV-11 | `doors` installs the pre-push shim with `--strict` when `strict_pre_push: true`; the default remains the default-policy shim. | specified | active | 2026-08-13 | [DESIGN.md](DESIGN.md) |
<!-- @anchor MV-11 brain:src/lib/config.ts /strict_pre_push/ -->
<!-- @anchor MV-11 brain:src/commands/doors.ts /strictPrePush/ -->
<!-- @anchor MV-11 brain:test/doors/doors.test.ts /strict_pre_push/ -->
