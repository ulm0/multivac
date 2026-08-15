# Invariants

The law of multivac itself: the brain is this repo, the code is this repo.
Paths in the `source` column are relative to this file, which lives where
everything multivac owns lives: under `.multivac/`.
Every row is anchored to the source that makes it true; `multivac verify`
checks them on every commit.

| ID | statement | authority | state | date | source |
| --- | --- | --- | --- | --- | --- |
| MV-01 | `verify`, `doctor`, and `doors` never touch the network: no git clone/fetch in their source paths. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-01 brain:src/commands/{verify,doctor,doors}.ts /'(clone|fetch)'/ absent -->
<!-- @anchor MV-01 brain:src/anchor/** /'(clone|fetch)'/ absent -->
<!-- @anchor MV-01 brain:src/lib/** /'(clone|fetch)'/ absent -->
| MV-02 | Exactly two runtime dependencies: picomatch and yaml. A third is a design change, not a convenience. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-02 brain:package.json /"(picomatch|yaml)": "/ count=2 -->
<!-- @anchor MV-02 brain:package.json /"dependencies":/ unique -->
<!-- @anchor MV-02 brain:test/invariants/deps.test.ts /'picomatch', 'yaml'/ -->
| MV-03 | Git runs via execFile with an argument vector, never through a shell. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-03 brain:src/lib/git.ts /execFile/ -->
<!-- @anchor MV-03 brain:src/lib/git.ts /exec\(|execSync|spawn|shell:[[:space:]]*true/ absent -->
| MV-04 | multivac never fabricates git identity: no writes to user.name or user.email anywhere in the source. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-04 brain:src/** /user\.(name|email)/ absent -->
| MV-05 | The anchor dialect gate rejects PCRE shorthand classes at write time with a translation hint. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-05 brain:src/lib/regex.ts /is not POSIX ERE/ -->
<!-- @anchor MV-05 brain:src/lib/regex.ts /RegexDialectError/ -->
| MV-06 | A broken or vacuous leg in a blocking mode exits 1 — the exit matrix has no second answer. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-06 brain:src/commands/verify.ts /cfg\.blocking\.includes/ -->
<!-- @anchor MV-06 brain:src/commands/verify.ts /gating\.size > 0/ -->
| MV-07 | The tombstone cannot be unblocked: config refuses a `blocking:` list without `absent`. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-07 brain:src/lib/config.ts /must include "absent"/ -->
| MV-08 | Installs are pnpm-only, guarded at preinstall. | specified | active | 2026-08-13 | [package.json](../package.json) |
<!-- @anchor MV-08 brain:package.json /only-allow pnpm/ -->
| MV-09 | Verify in a repo without `.multivac/config.yml` resolves the brain through the mount, scopes to that repo's anchors plus `*` anchors, same exit matrix. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-09 brain:src/commands/verify.ts /findMount/ -->
<!-- @anchor MV-09 brain:src/commands/verify.ts /resolveRepoKey/ -->
<!-- @anchor MV-09 brain:test/verify/consumer.test.ts /scoped/ -->
| MV-10 | With `staleness: block`, a pin behind the declared channel is a blocking verify failure (exit 1) naming the sync command; the default stays `report`, and an unresolvable channel ref reports, never gates. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-10 brain:src/lib/config.ts /staleness/ -->
<!-- @anchor MV-10 brain:src/commands/verify.ts /staleness[[:space:]]*===[[:space:]]*'block'/ -->
<!-- @anchor MV-10 brain:test/verify/verify.test.ts /staleness:[[:space:]]*block/ -->
| MV-11 | `doors` installs the pre-push shim with `--strict` when `strict_pre_push: true`; the default remains the default-policy shim. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-11 brain:src/lib/config.ts /strict_pre_push/ -->
<!-- @anchor MV-11 brain:src/commands/doors.ts /strictPrePush/ -->
<!-- @anchor MV-11 brain:test/doors/doors.test.ts /strict_pre_push/ -->
| MV-12 | A repo entry whose path resolves to the brain root IS the brain: brain door, never a consumer door, and no mount or pin check. `brain` is a first-class repo key in config, change files and anchors; `*` stays reserved. Spelling is not identity: two keys naming one tree — through `.`, `..` or a symlink — are one evaluation target, so a `*` leg never counts the same file twice. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-12 brain:src/lib/config.ts /const isBrain = samePath/ -->
<!-- @anchor MV-12 brain:src/lib/paths.ts /export const samePath/ -->
<!-- @anchor MV-12 brain:src/anchor/evaluate.ts /const key = realPath/ -->
<!-- @anchor MV-12 brain:src/commands/doors.ts /entry\.isBrain/ -->
<!-- @anchor MV-12 brain:src/commands/doctor.ts /brain==code/ -->
<!-- @anchor MV-12 brain:src/commands/change.ts /reserved handle for the brain/ -->
<!-- @anchor MV-12 brain:test/repos/brain-first-class.test.ts /brain==code/ -->
<!-- @anchor MV-12 brain:test/repos/brain-first-class.test.ts /a symlinked alias is the same tree/ -->
| MV-13 | `change apply` bases each branch on the newer of the default branch and its remote-tracking ref, offline, and prints the base with its sha and why. The default branch is what git already knows — `origin/HEAD`, then `init.defaultBranch`, then main, then master — and only with none of them does it fall back to HEAD, naming the checked-out branch it is building on. The change's own declaration file is carried into whichever checkout apply hands back, anything else uncommitted in a tree apply would switch is refused by name with the unblocking command, and an existing branch is reused. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-13 brain:src/commands/change.ts /merge-base.*--is-ancestor/ -->
<!-- @anchor MV-13 brain:src/commands/change.ts /function baseNames/ -->
<!-- @anchor MV-13 brain:src/commands/change.ts /branching from the checked-out/ -->
<!-- @anchor MV-13 brain:src/commands/change.ts /carried onto the branch/ -->
<!-- @anchor MV-13 brain:src/commands/change.ts /uncommitted work would be overwritten/ -->
<!-- @anchor MV-13 brain:test/change/apply-base.test.ts /local main is ahead/ -->
<!-- @anchor MV-13 brain:test/change/apply-base.test.ts /neither main nor master/ -->
| MV-14 | The hook shim resolves a runnable multivac in order — `mvac` on PATH, `npx --no-install multivac`, repo-local `node dist/cli.js` found from the hook itself — and with none of them warns on stderr and exits 0, never blocking the commit. Runnable means installed: a `dist/` with no `node_modules` beside it is not a runner, because node exits 1 on its first bare import and that exit blocks the commit. `doctor` reports the same order: hooks active (naming the runner) or INACTIVE with the fix. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-14 brain:src/hooks/install.ts /exec npx --no-install multivac/ -->
<!-- @anchor MV-14 brain:src/hooks/install.ts /root\/dist\/cli\.js/ -->
<!-- @anchor MV-14 brain:src/hooks/install.ts /-d "\$root\/node_modules"/ -->
<!-- @anchor MV-14 brain:src/commands/doctor.ts /findRunner/ -->
<!-- @anchor MV-14 brain:test/init/hook-shim.test.ts /never wedge a commit/ -->
<!-- @anchor MV-14 brain:test/init/hook-shim.test.ts /never a blocked commit/ -->
| MV-15 | Claim prose survives the frontmatter: any statement — colons like `staleness: block`, hashes, quotes, newlines, leading dashes — round-trips through serialize/parse unchanged and unreflowed, and a frontmatter YAML error names the offending line and the quoting fix instead of the raw parser message. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-15 brain:src/change/file.ts /lineWidth:[[:space:]]*0/ -->
<!-- @anchor MV-15 brain:src/change/file.ts /quotedRewrite/ -->
<!-- @anchor MV-15 brain:test/change/file.test.ts /statement:[[:space:]]staleness:[[:space:]]block/ -->
| MV-16 | When an anchor's glob matches no tracked file but an untracked file on disk would match it, verify says the file exists untracked and names `git add <path>`, never "fix the glob", and no self-heal rewrites that glob elsewhere. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-16 brain:src/lib/git.ts /--others/ -->
<!-- @anchor MV-16 brain:src/anchor/evaluate.ts /file exists but is untracked/ -->
<!-- @anchor MV-16 brain:test/verify/verify.test.ts /not "fix the glob"/ -->
| MV-17 | A claim listed by an open `.multivac/changes/<slug>.md` is pending: its failing legs report as pending naming that change, never block (not even under `--strict`, not even in a blocking mode), and are never chased by self-heal. A closed or archived change confers nothing. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-17 brain:src/commands/verify.ts /openChangeClaims/ -->
<!-- @anchor MV-17 brain:src/anchor/evaluate.ts /pendingBy/ -->
<!-- @anchor MV-17 brain:test/verify/verify.test.ts /confers nothing/ -->
| MV-18 | The lifecycle reports what it knows: `plan` checks `invariants.adds` against the law table the way it checks touches and retires; `land` records `--landed` against local evidence — the change branch contained in the default branch — and says "recording without evidence" when it has none; `close` ends by naming the commit that stores the archive. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-18 brain:src/commands/change.ts /already in \$\{LAW_PATH\}/ -->
<!-- @anchor MV-18 brain:src/commands/change.ts /recording without evidence/ -->
<!-- @anchor MV-18 brain:src/commands/change.ts /archived — commit this/ -->
<!-- @anchor MV-18 brain:test/change/lifecycle-polish.test.ts /recording without evidence/ -->
| MV-19 | The anchor include/exclude globs are picomatch patterns over repo-relative paths (`**` crosses directories, `{a,b}` alternates, dotfiles match) — stated in the design and the site's anchor grammar, and named in the parse error that rejects a malformed repo spec. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-19 brain:src/anchor/parse.ts /picomatch patterns/ -->
<!-- @anchor MV-19 brain:DESIGN.md /glob dialect is picomatch/ -->
<!-- @anchor MV-19 brain:site/content/docs/guide/writing-anchors.md /picomatch pattern/ -->
<!-- @anchor MV-19 brain:test/anchor/parse.test.ts /picomatch/ -->
| MV-20 | One predicate decides whether a diagnostic gates, and every printed number and the exit code read it: a line marked blocking always exits 1, a broken or vacuous leg that is not marked never gates on its own, and the summary line counts exactly the marked lines — `--strict` included. A claim an open change holds pending is named in that summary too: exit 0 is the grace, silence is not. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-20 brain:src/commands/verify.ts /function legGates/ -->
<!-- @anchor MV-20 brain:src/commands/verify.ts /gating\.has\(l\)/ -->
<!-- @anchor MV-20 brain:src/commands/verify.ts /const blocking = gating\.size \+ staleBlocking/ -->
<!-- @anchor MV-20 brain:src/commands/verify.ts /claim.*held pending/ -->
<!-- @anchor MV-20 brain:test/verify/verify.test.ts /cannot disagree/ -->
<!-- @anchor MV-20 brain:test/verify/verify.test.ts /the same predicate the markers do/ -->
| MV-21 | `doctor` names the untracked, non-ignored files that look build-critical — a config file at the repo root, a path a `package.json` script names, a path an anchor's include glob covers — as a warning saying `untracked — git add or ignore`. It never gates: doctor's exit code stays the config-validity answer. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-21 brain:src/commands/doctor.ts /untracked — git add or ignore/ -->
<!-- @anchor MV-21 brain:src/commands/doctor.ts /function buildCritical/ -->
<!-- @anchor MV-21 brain:test/doctor/doctor.test.ts /untracked — git add or ignore/ -->
| MV-22 | multivac is MIT licensed: `LICENSE` carries the MIT text and the copyright holder, `package.json` declares `"license": "MIT"`, and the README and the site footer say so and point at the file. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-22 brain:LICENSE /Copyright \(c\) 2026 Pierre Ugaz/ unique -->
<!-- @anchor MV-22 brain:package.json /"license": "MIT"/ -->
<!-- @anchor MV-22 brain:README.md /MIT — see \[LICENSE\]/ -->
<!-- @anchor MV-22 brain:site/i18n/en.yaml /MIT licensed/ -->
<!-- @anchor MV-22 brain:test/invariants/license.test.ts /license is MIT in both/ -->
| MV-23 | SQL statement splitting breaks only on a semicolon outside every literal, dollar-quoted body and comment: `''` escapes keep a literal open, a `$$`/`$tag$` body is closed by its own tag, and a comment's semicolons and quotes are inert. A `$` following an identifier character opens no body at all — it belongs to the identifier — so `a$b$c` does not swallow the rest of the file into one statement. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-23 brain:src/anchor/normalize.ts /function dollarTag/ -->
<!-- @anchor MV-23 brain:src/anchor/normalize.ts /function endOfQuoted/ -->
<!-- @anchor MV-23 brain:test/anchor/normalize.test.ts /a function body keeps its semicolons/ -->
<!-- @anchor MV-23 brain:test/anchor/normalize.test.ts /opens no dollar body/ -->
| MV-24 | Every git repo a test creates is initialised on an explicit `main` through the shared `gitInit` helper, so no assertion in the suite depends on the host's `init.defaultBranch`. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-24 brain:test/helpers/fixture.ts /export function gitInit/ unique -->
<!-- @anchor MV-24 brain:test/helpers/fixture.ts /'init', '-q', '-b', 'main'/ -->
<!-- @anchor MV-24 brain:test/** !test/helpers/fixture.ts /'init', '-q'/ absent -->
<!-- @anchor MV-24 brain:test/helpers/scaffold.test.ts /whatever the host init\.defaultBranch says/ -->
| MV-25 | `change apply` gives each change its own worktree under `.multivac/worktrees/<slug>/<repo>` and prints it; `close` removes it. Where git cannot make one, apply falls back in place and refuses a tree carrying another change's uncommitted work. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-25 brain:src/commands/change.ts /worktreePath/ -->
<!-- @anchor MV-25 brain:src/commands/change.ts /apply will not switch it/ -->
<!-- @anchor MV-25 brain:src/commands/change.ts /function removeWorktrees/ -->
<!-- @anchor MV-25 brain:test/change/concurrency.test.ts /both live at once/ -->
| MV-26 | Invariant IDs are allocated by the tool, never by hand: `change new` reserves the next free ID as a `proposed` row in `.multivac/invariants.md` under an exclusive lock, and `plan` refuses a declared ID another change is holding. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-26 brain:src/change/reserve.ts /reserveId/ -->
<!-- @anchor MV-26 brain:src/change/reserve.ts /flag: 'wx'/ -->
<!-- @anchor MV-26 brain:test/change/concurrency.test.ts /must not claim the same id/ -->
| MV-27 | The ritual is the ecosystem's closing ceremony, written by the team in `.multivac/ritual.md`. multivac runs the verifiable half in `change close` and prints the rest verbatim as a checklist — never verified, never gating; an empty or absent ritual prints nothing. `init` scaffolds the file with one comment saying what belongs there. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-27 brain:src/lib/config.ts /RITUAL_PATH = '.multivac\/ritual.md'/ -->
<!-- @anchor MV-27 brain:src/lib/ritual.ts /ritualChecklist/ -->
<!-- @anchor MV-27 brain:src/commands/change.ts /ritualChecklist\(brain\)/ -->
<!-- @anchor MV-27 brain:src/commands/init.ts /RITUAL_TEMPLATE/ -->
<!-- @anchor MV-27 brain:test/change/ritual.test.ts /prints nothing/ -->
| MV-28 | Every harness multivac integrates with is a registry entry in `src/adapters/registry.ts`: `doors` and `doctor` dispatch on the entry's `kind`, never on its name, a `native` entry projects nothing beyond the canonical `AGENTS.md`, and an `unsupported` entry is refused with the reason recorded in the data. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-28 brain:src/commands/doors.ts /target === '[a-z]+'/ absent -->
<!-- @anchor MV-28 brain:src/commands/doors.ts /t.kind === 'unsupported'/ unique -->
<!-- @anchor MV-28 brain:src/commands/doctor.ts /t.kind === 'native'/ -->
<!-- @anchor MV-28 brain:src/adapters/registry.ts /kind: 'unsupported'/ -->
<!-- @anchor MV-28 brain:test/doors/registry.test.ts /at least one honest gap/ -->
| MV-29 | The site names no flag the binary does not accept. `doors` takes no flags at all — `--no-symlink` was documentation-only and never parsed — so the string appears nowhere in the site or the source. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-29 brain:site/content/** /no-symlink/ absent -->
<!-- @anchor MV-29 brain:src/** /no-symlink/ absent -->
<!-- @anchor MV-29 brain:src/commands/doors.ts /async function run\(_argv: string\[\]/ unique -->
| MV-30 | Hextra's layout shortcodes emit wrapper HTML, so the site sets `markup.goldmark.renderer.unsafe: true`; without it the hero and the feature grid are stripped to bare text and the landing renders unstyled. | specified | active | 2026-08-13 | [hugo.yaml](../site/hugo.yaml) |
<!-- @anchor MV-30 brain:site/hugo.yaml /unsafe: true/ unique -->
<!-- @anchor MV-30 brain:site/content/_index.md /hextra\/feature-grid/ count=2 -->
| MV-31 | The reference section documents the whole surface: one heading per shipped command, one per configuration key the loader reads, and one per harness entry in the registry — including the entries marked unsupported. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-31 brain:site/content/docs/reference/commands.md /^## `(init|seed|verify|count|doors|doctor|repos|change|help)/ count=9 -->
<!-- @anchor MV-31 brain:site/content/docs/reference/configuration.md /^### `(doors|sdd|sdd_auto|grapher|authorities|blocking|staleness|strict_pre_push|channel|mount|repos)`$/ count=11 -->
<!-- @anchor MV-31 brain:site/content/docs/reference/integrations.md /^## `(agents|claude|cursor|opencode|codex|windsurf|gemini|copilot|aider)`/ count=9 -->
<!-- @anchor MV-31 brain:site/content/docs/concepts/philosophy.md /A paraphrase ages silently/ unique -->
<!-- @anchor MV-31 brain:site/content/docs/reference/hooks.md /universal floor/ -->
<!-- @anchor MV-31 brain:site/content/docs/guide/install.md /^  (count|help)[[:space:]]{2}/ count=2 -->
| MV-32 | Everything multivac creates lives under `.multivac/` — the law, the changes and the machinery; `AGENTS.md` at the repo root is the only exception. `init` migrates a brain that still keeps them at the root, announcing every path before it moves it and using `git mv` so history follows, and it refuses rather than overwrite an occupied target. It never moves a file multivac did not write: a root `invariants.md` or `changes/` counts as multivac's only in a directory that already has `.multivac/config.yml` AND whose file parses as multivac's own law table or change file. Only two files that both parse as multivac's law are ambiguous, and that error names the one that wins; `doctor` reports the legacy layout with the command that fixes it and moves nothing itself. | specified | active | 2026-08-14 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-32 brain:src/lib/config.ts /LAW_PATH = '.multivac\/invariants.md'/ -->
<!-- @anchor MV-32 brain:src/lib/config.ts /CHANGES_DIR = '.multivac\/changes'/ -->
<!-- @anchor MV-32 brain:src/lib/config.ts /export async function legacyLayout/ -->
<!-- @anchor MV-32 brain:src/lib/config.ts /looksLikeOurs/ -->
<!-- @anchor MV-32 brain:src/commands/init.ts /migrateLegacy/ -->
<!-- @anchor MV-32 brain:src/commands/init.ts /git mv, history preserved/ -->
<!-- @anchor MV-32 brain:src/** /join\(brain(Dir)?, 'invariants.md'\)/ absent -->
<!-- @anchor MV-32 brain:test/init/init.test.ts /never migrates files multivac did not write/ -->
<!-- @anchor MV-32 brain:test/init/init.test.ts /byte for byte/ -->
| MV-33 | The identity is the console panel: the mark ships under `site/static/` and is wired as the favicon and as the navbar logo (with a dark slot, because an `<img>` cannot inherit `currentColor`), and the terminal banner is reachable from `init` alone — `src/lib/banner.ts` is imported by `init` and by nothing else, so `verify`, `doctor`, `doors` and `change` cannot print it. It is suppressed by `--quiet` and when stdout is not a TTY; `NO_COLOR` drops the colour and keeps the drawing. The lamp pattern is a fixed drawing, never a live reading — `init` runs before there is anything to verify. | specified | active | 2026-08-14 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-33 brain:site/static/{mark,mark-dark,favicon,lockup}.svg /<svg/ count=4 -->
<!-- @anchor MV-33 brain:site/hugo.yaml /path: mark.svg/ unique -->
<!-- @anchor MV-33 brain:site/hugo.yaml /dark: mark-dark.svg/ unique -->
<!-- @anchor MV-33 brain:src/lib/banner.ts /pattern is FIXED, not a live reading/ -->
<!-- @anchor MV-33 brain:src/commands/init.ts /banner\(\{/ unique -->
<!-- @anchor MV-33 brain:src/** !src/lib/banner.ts !src/commands/init.ts /banner/ absent -->
<!-- @anchor MV-33 brain:test/init/banner.test.ts /never emitted by any other command/ -->
<!-- @anchor MV-33 brain:test/init/banner.test.ts /NO_COLOR drops the colour, not the banner/ -->
| MV-34 | Governance lives in the repo, not in someone's head: `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md` at the root, and GitLab's merge request and issue templates under `.gitlab/`, where GitLab reads them. | specified | active | 2026-08-14 | [CONTRIBUTING.md](../CONTRIBUTING.md) |
<!-- @anchor MV-34 brain:CONTRIBUTING.md /## The loop/ present -->
<!-- @anchor MV-34 brain:CODE_OF_CONDUCT.md /confidential issue/ present -->
<!-- @anchor MV-34 brain:.gitlab/merge_request_templates/*.md /Claims made true/ present -->
<!-- @anchor MV-34 brain:.gitlab/issue_templates/*.md /multivac doctor/ present -->
| MV-35 | An anchor exclusion may name the repo it applies to — `!<repo>:<glob>` — and then bites only in that declared repo; the bare `!<glob>` keeps its meaning, repo-relative in every repo the leg evaluates. An exclusion naming an undeclared repo is a parse-stage diagnostic that names the key, never a silent no-op; a qualifier in a single-repo leg is legal and redundant. Exclusions still count toward vacuity: a leg whose exclusions remove every candidate file is vacuous. | specified | active | 2026-08-14 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-35 brain:src/anchor/parse.ts /is not !<repo>:<glob>/ -->
<!-- @anchor MV-35 brain:src/lib/glob.ts /export function excludeGlobs/ -->
<!-- @anchor MV-35 brain:src/commands/verify.ts /excludes\.map/ -->
<!-- @anchor MV-35 brain:test/anchor/parse.test.ts /an exclusion may name its repo/ -->
<!-- @anchor MV-35 brain:test/verify/verify.test.ts /a qualified exclusion exempts one repo/ -->
<!-- @anchor MV-35 brain:DESIGN.md /An exclusion may name its repo/ -->
| MV-36 | `init` runs `git check-ignore` on every path it writes. When a repo-level ignore would swallow one, init appends explicit negation lines (`!.multivac/`, `!.multivac/**`, `!AGENTS.md` as needed) to the repo's `.gitignore` under a marker comment — idempotently, printing what it appended — and re-checks. `doctor` reports any still-ignored brain path as a WARNING naming the fix. An invisible brain that reports success is the defect. | specified | active | 2026-08-14 | [changes/archive/init-cannot-lie.md](changes/archive/init-cannot-lie.md) |
<!-- @anchor MV-36 brain:src/commands/init.ts /ensureVisibleToGit/ -->
<!-- @anchor MV-36 brain:src/lib/git.ts /check-ignore/ -->
<!-- @anchor MV-36 brain:src/commands/doctor.ts /IGNORED by \.gitignore/ -->
<!-- @anchor MV-36 brain:test/init/coexist.test.ts /saleor shape: a .* gitignore gets marked negations/ -->
<!-- @anchor MV-36 brain:test/init/coexist.test.ts /an ignored brain path is a WARNING/ -->
<!-- @anchor MV-36 brain:DESIGN.md /check-ignore/ -->
| MV-37 | `init` never silently disarms an existing hook set-up. Before touching `core.hooksPath` it detects `.git/hooks/<name>`, a foreign `core.hooksPath`, `.husky/`, `lefthook.yml` and `.pre-commit-config.yaml`; the shim chains a pre-existing `.git/hooks` hook first and preserves its exit code; a foreign hooksPath is never repointed — the shim installs alongside where the name is free, and a taken name is a refusal carrying the exact line to add. `init` prints the strategy used; `doctor` reports the coexistence state. | specified | active | 2026-08-14 | [changes/archive/init-cannot-lie.md](changes/archive/init-cannot-lie.md) |
<!-- @anchor MV-37 brain:src/hooks/install.ts /installAlongside/ -->
<!-- @anchor MV-37 brain:src/hooks/install.ts /exit code wins/ -->
<!-- @anchor MV-37 brain:src/commands/doctor.ts /never repoints/ -->
<!-- @anchor MV-37 brain:test/init/coexist.test.ts /the repo gate runs first and its exit code wins/ -->
<!-- @anchor MV-37 brain:test/init/coexist.test.ts /refusal names the exact step, file untouched/ -->
<!-- @anchor MV-37 brain:DESIGN.md /never repoint/ -->
| MV-38 | Seed knows where architecture lives, as registry data: policy gates, workspace/build graph, deploy manifests, runtime config, models/schema and decisions/intent are pattern entries in the category registry; fixture, example and vendored trees are excluded; and the report ends with the three open questions every cold adopter hit — debt or intent, law or taste, which authority wins — instantiated against what seed found and handed to the interview. | specified | active | 2026-08-14 | [changes/archive/seed-finds-the-contracts.md](changes/archive/seed-finds-the-contracts.md) |
<!-- @anchor MV-38 brain:src/seed/inventory.ts /'policy gates'/ -->
<!-- @anchor MV-38 brain:src/seed/inventory.ts /pnpm-workspace\.yaml/ -->
<!-- @anchor MV-38 brain:src/seed/inventory.ts /kustomization\.yaml/ -->
<!-- @anchor MV-38 brain:src/seed/inventory.ts /export const EXCLUDES/ -->
<!-- @anchor MV-38 brain:src/commands/seed.ts /open questions/ -->
<!-- @anchor MV-38 brain:src/commands/seed.ts /Debt or intent/ -->
<!-- @anchor MV-38 brain:skills/multivac/references/discovery.md /questions/ -->
<!-- @anchor MV-38 brain:test/seed/seed.test.ts /deploys via helm, kustomize, skaffold/ -->
| MV-39 | `multivac help anchor` teaches the whole grammar from the CLI in one screen: the anchor line, POSIX ERE only with the shorthand replacements named, per-line matching except `.sql` (per normalized statement), `count=N` counted across every file the glob matches (a deletion ratchet, never a universal), exactly one include glob (braces for alternatives), repo-qualified exclusions, and where anchors may live. | specified | active | 2026-08-14 | [changes/the-ramp-is-part-of-the-road.md](changes/the-ramp-is-part-of-the-road.md) |
<!-- @anchor MV-39 brain:src/commands/help.ts /POSIX ERE only/ -->
<!-- @anchor MV-39 brain:src/commands/help.ts /deletion ratchet, never a universal/ -->
<!-- @anchor MV-39 brain:src/commands/help.ts /ONE include glob/ -->
<!-- @anchor MV-39 brain:test/cli/help.test.ts /one screen/ -->
| MV-40 | `multivac count '<repo>:<glob> /re/'` is a dry-run that prints the per-file breakdown and the total through the same parse and scan path verify uses — never a reimplementation — so a `count=N` ratchet is right the first time. It writes nothing and exits 0 when the spec evaluates. | specified | active | 2026-08-14 | [changes/the-ramp-is-part-of-the-road.md](changes/the-ramp-is-part-of-the-road.md) |
<!-- @anchor MV-40 brain:src/commands/count.ts /scanLeg/ -->
<!-- @anchor MV-40 brain:src/commands/count.ts /parseAnchors/ -->
<!-- @anchor MV-40 brain:src/commands/count.ts /never a reimplementation/ -->
<!-- @anchor MV-40 brain:test/cli/count.test.ts /the total is the ratchet verify pins/ -->
| MV-41 | `--help`/`-h` on any subcommand is recognized by the dispatcher before the command runs: usage on stdout, exit 0, no side effect on the tree. | specified | active | 2026-08-14 | [changes/the-ramp-is-part-of-the-road.md](changes/the-ramp-is-part-of-the-road.md) |
<!-- @anchor MV-41 brain:src/cli.ts /before any side effect/ -->
<!-- @anchor MV-41 brain:test/cli/help.test.ts /tree untouched/ -->
<!-- @anchor MV-41 brain:test/cli/help.test.ts /recognized before any side effect/ -->
| MV-42 | verify is readable at the summary: parse diagnostics print above it, the unanchored claim ids are named (never only counted), and a law row in state `drift` records a real, not-yet-fixable finding — its legs report but never gate, and the summary names the drifting ids. Every other row keeps the exit matrix unchanged. | specified | active | 2026-08-14 | [changes/the-ramp-is-part-of-the-road.md](changes/the-ramp-is-part-of-the-road.md) |
<!-- @anchor MV-42 brain:src/commands/verify.ts /=== 'drift'/ -->
<!-- @anchor MV-42 brain:src/commands/verify.ts /unanchored: / -->
<!-- @anchor MV-42 brain:src/commands/verify.ts /ABOVE the summary/ -->
<!-- @anchor MV-42 brain:test/verify/verify.test.ts /a drift row never gates/ -->
<!-- @anchor MV-42 brain:site/content/docs/reference/commands.md /drift/ -->
| MV-43 | `each` is the universal quantifier: a leg in mode `each` holds iff every file its glob matches (after exclusions) contains at least one match, and `each!` iff every such file contains none. A glob matching zero tracked files is a blocking failure (a universal over nothing proves nothing), the failing files are named in the report (first few + count), `.sql` files match per normalized statement as everywhere else, and both forms gate by default alongside `absent` and `count` — `count=N` stays a deletion ratchet and the docs say which measured claims still need the cross-file relation that deliberately does not exist. | specified | active | 2026-08-14 | [changes/each-file-answers.md](changes/each-file-answers.md) |
<!-- @anchor MV-43 brain:src/anchor/parse.ts /modeTok === 'each!'/ -->
<!-- @anchor MV-43 brain:src/anchor/evaluate.ts /case 'each':/ -->
<!-- @anchor MV-43 brain:src/anchor/evaluate.ts /over nothing proves nothing/ -->
<!-- @anchor MV-43 brain:src/lib/config.ts /'absent', 'count', 'each'/ -->
<!-- @anchor MV-43 brain:src/commands/help.ts /each is the universal/ -->
<!-- @anchor MV-43 brain:test/verify/each.test.ts /rogue container/ -->
<!-- @anchor MV-43 brain:site/content/docs/guide/writing-anchors.md /cross-file relation/ -->
<!-- @anchor MV-43 brain:site/content/docs/reference/configuration.md /allowed: present, absent, unique, count, each/ -->
<!-- @anchor MV-43 brain:site/content/_index.md /`present`, `absent`, `unique`, `count`, `each`/ unique -->
| MV-44 | The hook chain arms in every order: when `.pre-commit-config.yaml` exists and `.git/hooks/<name>` does not (the fresh-clone shape — `pre-commit install` refuses while core.hooksPath is set), the shim runs `pre-commit run --hook-stage <stage>` directly and preserves its exit code; with no pre-commit binary it warns loudly on stderr and never blocks; `init` and `doctor` name each arrangement's true state, including the uninstalled binary. | specified | active | 2026-08-15 | [changes/the-chain-arms-either-way.md](changes/the-chain-arms-either-way.md) |
<!-- @anchor MV-44 brain:src/hooks/install.ts /pre-commit run --hook-stage/ -->
<!-- @anchor MV-44 brain:src/hooks/install.ts /preCommitGate/ -->
<!-- @anchor MV-44 brain:src/commands/init.ts /gate will not run until it is/ -->
<!-- @anchor MV-44 brain:src/commands/doctor.ts /preCommitGate/ -->
<!-- @anchor MV-44 brain:test/init/coexist.test.ts /config present, hook absent, binary present/ -->
<!-- @anchor MV-44 brain:test/init/coexist.test.ts /loud warning, never a block/ -->
<!-- @anchor MV-44 brain:test/init/coexist.test.ts /husky arrangement has no such trap/ -->
<!-- @anchor MV-44 brain:DESIGN.md /arms in the other order/ -->
<!-- @anchor MV-44 brain:site/content/docs/reference/hooks.md /arms in every order/ -->
| MV-45 | RESERVED by change close-keeps-used-reservations — state the rule here before close. | open | proposed | 2026-08-15 | [changes/close-keeps-used-reservations.md](changes/close-keeps-used-reservations.md) |
