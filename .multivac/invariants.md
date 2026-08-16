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
| MV-03 | Git runs with an argument vector — `execFile` for a one-shot, `spawn` for a stream — never through a shell: no `exec(`, no `execSync`, no `shell: true`. | specified | active | 2026-08-15 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-03 brain:src/lib/git.ts /execFile/ -->
<!-- @anchor MV-03 brain:src/lib/git.ts /exec\(|execSync|shell:[[:space:]]*true/ absent -->
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
| MV-08 | **Development** is pnpm-only, guarded at preinstall — and the guard never reaches a consumer. It fires only when this package is itself the project being installed (`INIT_CWD` equals the package directory), so `npm i -g multivac` and `npx multivac` install normally while `npm install` inside the repo is refused with the pnpm line. The check is inline and offline: the previous guard shelled out to `npx only-allow pnpm`, which hit the registry on every install AND ran on every consumer's machine, refusing the install of a tool whose whole first instruction is `npx multivac init`. A tool that rejects its users' package manager is a tool nobody installs. | specified | active | 2026-08-16 | [changes/the-first-release.md](changes/the-first-release.md) |
<!-- @anchor MV-08 brain:package.json /INIT_CWD===process\.cwd\(\)/ unique -->
<!-- @anchor MV-08 brain:package.json /only-allow/ absent -->
<!-- @anchor MV-08 brain:site/content/docs/guide/install.md /That guard is scoped to the repo/ -->
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
<!-- @anchor MV-12 brain:src/anchor/evaluate.ts /const at = \(h: RepoHandle/ -->
<!-- @anchor MV-12 brain:src/commands/doors.ts /entry\.isBrain/ -->
<!-- @anchor MV-12 brain:src/commands/doctor.ts /brain==code/ -->
<!-- @anchor MV-12 brain:src/commands/change.ts /reserved handle for the brain/ -->
<!-- @anchor MV-12 brain:test/repos/brain-first-class.test.ts /brain==code/ -->
<!-- @anchor MV-12 brain:test/repos/brain-first-class.test.ts /a symlinked alias is the same tree/ -->
| MV-13 | `change apply` bases each branch on the newer of the default branch and its remote-tracking ref, offline, and prints the base with its sha and why. The default branch is what git already knows — `origin/HEAD`, then `init.defaultBranch`, then main, then master — and only with none of them does it fall back to HEAD, naming the checked-out branch it is building on. The change's bookkeeping is committed before any branch is made, so every checkout apply hands back inherits it from the base; anything uncommitted in a tree apply would switch is refused by name with the unblocking command, and an existing branch is reused. | specified | active | 2026-08-14 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-13 brain:src/commands/change.ts /merge-base.*--is-ancestor/ -->
<!-- @anchor MV-13 brain:src/commands/change.ts /function baseNames/ -->
<!-- @anchor MV-13 brain:src/commands/change.ts /branching from the checked-out/ -->
<!-- @anchor MV-13 brain:test/change/apply-base.test.ts /inherits the committed declaration/ -->
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
| MV-18 | The lifecycle reports what it knows: `plan` checks `invariants.adds` against the law table the way it checks touches and retires; `land` records `--landed` against local evidence — the change branch contained in the default branch — and, when it has none, says so as the ordinary fact it is ("no local merge commit to confirm it", normal for a squashed or remote-merged MR) rather than as a warning; `close` ends by naming the commit that stores the archive. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-18 brain:src/commands/change.ts /already in \$\{LAW_PATH\}/ -->
<!-- @anchor MV-18 brain:src/commands/change.ts /no local merge commit to confirm it/ -->
<!-- @anchor MV-18 brain:src/commands/change.ts /archived — commit this/ -->
<!-- @anchor MV-18 brain:test/change/lifecycle-polish.test.ts /no local merge commit to confirm it/ -->
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
| MV-26 | Invariant IDs are allocated by the tool, never by hand: `change new` reserves the next free ID as a `proposed` row in `.multivac/invariants.md` under an exclusive lock and commits it with the scaffolded declaration in one bookkeeping commit, so a concurrent `new` reads the committed table; `plan` refuses a declared ID another change is holding. | specified | active | 2026-08-14 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-26 brain:src/change/reserve.ts /reserveId/ -->
<!-- @anchor MV-26 brain:src/change/reserve.ts /flag: 'wx'/ -->
<!-- @anchor MV-26 brain:test/change/concurrency.test.ts /must not claim the same id/ -->
<!-- @anchor MV-26 brain:src/commands/change.ts /change open: / -->
<!-- @anchor MV-26 brain:test/change/concurrency.test.ts /both rows committed/ -->
| MV-27 | The ritual is the ecosystem's closing ceremony, written by the team in `.multivac/ritual.md`. multivac runs the verifiable half in `change close` and prints the rest verbatim as a checklist — never verified, never gating; an empty or absent ritual prints nothing. `init` scaffolds the file with one comment saying what belongs there. | specified | active | 2026-08-13 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-27 brain:src/lib/config.ts /RITUAL_PATH = '.multivac\/ritual.md'/ -->
<!-- @anchor MV-27 brain:src/lib/ritual.ts /ritualChecklist/ -->
<!-- @anchor MV-27 brain:src/commands/change.ts /ritualChecklist\(brain\)/ -->
<!-- @anchor MV-27 brain:src/commands/init.ts /RITUAL_TEMPLATE/ -->
<!-- @anchor MV-27 brain:test/change/ritual.test.ts /prints nothing/ -->
| MV-28 | Every harness multivac integrates with is a registry entry in `src/adapters/registry.ts`: `doors` and `doctor` dispatch on the entry's `kind`, never on its name, and a `native` entry projects nothing beyond the canonical `AGENTS.md`. **Every entry is one multivac can actually own** — there is no `unsupported` kind. A harness whose door cannot be written gets no entry, because an entry is how this tool says "supported": it appears in `--provider`'s legal values, in the reference table, and in the count of what multivac integrates with. `aider` sat there as `unsupported`, carrying a note that explained at length why none of it applied, and read as support to everyone who did not open it. An unknown name already gets the list of what IS supported, which is the answer that helps. | specified | active | 2026-08-16 | [changes/no-mention-what-is-not-supported.md](changes/no-mention-what-is-not-supported.md) |
<!-- @anchor MV-28 brain:src/commands/doors.ts /target === '[a-z]+'/ absent -->
<!-- @anchor MV-28 brain:src/commands/doctor.ts /t.kind === 'native'/ -->
<!-- @anchor MV-28 brain:src/adapters/registry.ts /a named tool reads as a supported one/ unique -->
<!-- @anchor MV-28 brain:src/adapters/registry.ts /^[[:space:]]+kind: 'unsupported',/ absent -->
<!-- @anchor MV-28 brain:src/adapters/registry.ts /\| 'unsupported'/ absent -->
<!-- @anchor MV-28 brain:test/doors/registry.test.ts /every entry is one multivac can actually own/ -->
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
<!-- @anchor MV-31 brain:site/content/docs/reference/integrations.md /^## `(agents|claude|cursor|opencode|codex|windsurf|gemini|copilot)`/ count=8 -->
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
| MV-33 | The identity is the console panel: the mark ships under `site/static/` and is wired as the favicon and as the navbar logo — one copy with its ink pinned, because an `<img>` cannot inherit `currentColor` and the site has one ground (dark only, acid accent). The terminal banner is reachable from `init` alone — `src/lib/banner.ts` is imported by `init` and by nothing else, so `verify`, `doctor`, `doors` and `change` cannot print it. It is suppressed by `--quiet` and when stdout is not a TTY; `NO_COLOR` drops the colour and keeps the drawing. The lamp pattern is a fixed drawing, never a live reading — `init` runs before there is anything to verify. | specified | active | 2026-08-15 | [DESIGN.md](../DESIGN.md) |
<!-- @anchor MV-33 brain:site/static/{mark,mark-dark,favicon,lockup}.svg /<svg/ count=4 -->
<!-- @anchor MV-33 brain:site/hugo.yaml /path: mark-dark.svg/ unique -->
<!-- @anchor MV-33 brain:site/hugo.yaml /displayToggle: false/ unique -->
<!-- @anchor MV-33 brain:site/assets/css/custom.css /--primary-hue: 76deg/ unique -->
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
| MV-39 | `multivac help anchor` teaches the whole grammar from the CLI in one screen: the anchor line, POSIX ERE only with the shorthand replacements named, per-line matching except `.sql` (per normalized statement), `count=N` counted across every file the glob matches (a deletion ratchet, never a universal), exactly one include glob (braces for alternatives), repo-qualified exclusions, and where anchors may live. | specified | active | 2026-08-14 | [changes/the-ramp-is-part-of-the-road.md](changes/archive/the-ramp-is-part-of-the-road.md) |
<!-- @anchor MV-39 brain:src/commands/help.ts /POSIX ERE only/ -->
<!-- @anchor MV-39 brain:src/commands/help.ts /deletion ratchet, never a universal/ -->
<!-- @anchor MV-39 brain:src/commands/help.ts /ONE include glob/ -->
<!-- @anchor MV-39 brain:test/cli/help.test.ts /one screen/ -->
| MV-40 | `multivac count '<repo>:<glob> /re/'` is a dry-run that prints the per-file breakdown and the total through the same parse and scan path verify uses — never a reimplementation — so a `count=N` ratchet is right the first time. It writes nothing and exits 0 when the spec evaluates. | specified | active | 2026-08-14 | [changes/the-ramp-is-part-of-the-road.md](changes/archive/the-ramp-is-part-of-the-road.md) |
<!-- @anchor MV-40 brain:src/commands/count.ts /scanLeg/ -->
<!-- @anchor MV-40 brain:src/commands/count.ts /parseAnchors/ -->
<!-- @anchor MV-40 brain:src/commands/count.ts /never a reimplementation/ -->
<!-- @anchor MV-40 brain:test/cli/count.test.ts /the total is the ratchet verify pins/ -->
| MV-41 | `--help`/`-h` on any subcommand is recognized by the dispatcher before the command runs: usage on stdout, exit 0, no side effect on the tree. | specified | active | 2026-08-14 | [changes/the-ramp-is-part-of-the-road.md](changes/archive/the-ramp-is-part-of-the-road.md) |
<!-- @anchor MV-41 brain:src/cli.ts /before any side effect/ -->
<!-- @anchor MV-41 brain:test/cli/help.test.ts /tree untouched/ -->
<!-- @anchor MV-41 brain:test/cli/help.test.ts /recognized before any side effect/ -->
| MV-42 | verify is readable at the summary: parse diagnostics print above it, the unanchored claim ids are named (never only counted), and a law row in state `drift` records a real, not-yet-fixable finding — its legs report but never gate, and the summary names the drifting ids. Every other row keeps the exit matrix unchanged. | specified | active | 2026-08-14 | [changes/the-ramp-is-part-of-the-road.md](changes/archive/the-ramp-is-part-of-the-road.md) |
<!-- @anchor MV-42 brain:src/commands/verify.ts /=== 'drift'/ -->
<!-- @anchor MV-42 brain:src/commands/verify.ts /unanchored: / -->
<!-- @anchor MV-42 brain:src/commands/verify.ts /ABOVE the summary/ -->
<!-- @anchor MV-42 brain:test/verify/verify.test.ts /a drift row never gates/ -->
<!-- @anchor MV-42 brain:site/content/docs/reference/commands.md /drift/ -->
| MV-43 | `each` is the universal quantifier: a leg in mode `each` holds iff every file its glob matches (after exclusions) contains at least one match, and `each!` iff every such file contains none. A glob matching zero tracked files is a blocking failure (a universal over nothing proves nothing), the failing files are named in the report (first few + count), `.sql` files match per normalized statement as everywhere else, and both forms gate by default alongside `absent` and `count` — `count=N` stays a deletion ratchet and the docs say which measured claims still need the cross-file relation that deliberately does not exist. | specified | active | 2026-08-14 | [changes/each-file-answers.md](changes/archive/each-file-answers.md) |
<!-- @anchor MV-43 brain:src/anchor/parse.ts /modeTok === 'each!'/ -->
<!-- @anchor MV-43 brain:src/anchor/evaluate.ts /case 'each':/ -->
<!-- @anchor MV-43 brain:src/anchor/evaluate.ts /over nothing proves nothing/ -->
<!-- @anchor MV-43 brain:src/lib/config.ts /'absent', 'count', 'each'/ -->
<!-- @anchor MV-43 brain:src/commands/help.ts /each is the universal/ -->
<!-- @anchor MV-43 brain:test/verify/each.test.ts /rogue container/ -->
<!-- @anchor MV-43 brain:site/content/docs/guide/writing-anchors.md /cross-file relation/ -->
<!-- @anchor MV-43 brain:site/content/docs/reference/configuration.md /allowed: present, absent, unique, count, each/ -->
<!-- @anchor MV-43 brain:site/content/_index.md /`present`, `absent`, `unique`, `count`, `each`/ unique -->
| MV-44 | The hook chain arms in every order: when `.pre-commit-config.yaml` exists and `.git/hooks/<name>` does not (the fresh-clone shape — `pre-commit install` refuses while core.hooksPath is set), the shim runs `pre-commit run --hook-stage <stage>` directly and preserves its exit code; with no pre-commit binary it warns loudly on stderr and never blocks; `init` and `doctor` name each arrangement's true state, including the uninstalled binary. | specified | active | 2026-08-15 | [changes/the-chain-arms-either-way.md](changes/archive/the-chain-arms-either-way.md) |
<!-- @anchor MV-44 brain:src/hooks/install.ts /pre-commit run --hook-stage/ -->
<!-- @anchor MV-44 brain:src/hooks/install.ts /preCommitGate/ -->
<!-- @anchor MV-44 brain:src/commands/init.ts /gate will not run until it is/ -->
<!-- @anchor MV-44 brain:src/commands/doctor.ts /preCommitGate/ -->
<!-- @anchor MV-44 brain:test/init/coexist.test.ts /config present, hook absent, binary present/ -->
<!-- @anchor MV-44 brain:test/init/coexist.test.ts /loud warning, never a block/ -->
<!-- @anchor MV-44 brain:test/init/coexist.test.ts /husky arrangement has no such trap/ -->
<!-- @anchor MV-44 brain:DESIGN.md /arms in the other order/ -->
<!-- @anchor MV-44 brain:site/content/docs/reference/hooks.md /arms in every order/ -->
| MV-45 | `change close` releases only reservations the change never used: a `proposed` row is released only when it still carries the scaffolded RESERVED statement, no anchor names its ID, and its source points at the closing change — and the anchor set is read before the archive moves the change file out of tracked sight. | specified | active | 2026-08-15 | [changes/archive/close-keeps-used-reservations.md](changes/archive/close-keeps-used-reservations.md) |
<!-- @anchor MV-45 brain:src/change/reserve.ts /startsWith\('RESERVED by change '\)/ -->
<!-- @anchor MV-45 brain:src/commands/change.ts /before archive moves the change file/ -->
<!-- @anchor MV-45 brain:test/change/concurrency.test.ts /a stated rule survives close/ -->
<!-- @anchor MV-45 brain:test/change/concurrency.test.ts /anchors are read before archive/ -->
<!-- @anchor MV-45 brain:site/content/docs/reference/commands.md /used meaning the rule was stated/ -->
| MV-46 | The lifecycle commits its own bookkeeping, scoped to the change that wrote it: `change new` commits the declaration and the reserved row as one commit on the current branch and refuses a tree that is dirty at those paths; `apply` commits the status bump before branching so every worktree inherits the post-bump truth; every command `close` prints is scoped to the closing slug's paths and picks branch+MR wording when the brain has a remote — `add -A` appears nowhere in the lifecycle. | specified | active | 2026-08-14 | [changes/archive/the-ledger-keeps-itself.md](changes/archive/the-ledger-keeps-itself.md) |
<!-- @anchor MV-46 brain:src/commands/change.ts /function commitBookkeeping/ -->
<!-- @anchor MV-46 brain:src/commands/change.ts /bookkeeping paths carry uncommitted edits/ -->
<!-- @anchor MV-46 brain:src/commands/change.ts /change apply: .* status branched/ -->
<!-- @anchor MV-46 brain:src/commands/change.ts /add -A/ count=1 -->
<!-- @anchor MV-46 brain:test/change/concurrency.test.ts /touch only the closing slug/ -->
<!-- @anchor MV-46 brain:test/change/lifecycle-polish.test.ts /the branch\+MR variant/ -->
| MV-47 | `doctor --strict` exits 1 when the enforcement gate is disarmed — the shim missing, `core.hooksPath` not multivac's with no shim chained, or no runnable multivac so the shim no-ops. Bare `doctor` stays a report that exits 0 and describes the degradation; its only other exit 1 is an invalid config/law. The exit contract is stated in `mvac doctor --help`, the site's doctor page and the CLI reference. | specified | active | 2026-08-15 | [changes/archive/the-gate-cannot-lie.md](changes/archive/the-gate-cannot-lie.md) |
<!-- @anchor MV-47 brain:src/commands/doctor.ts /enforcement gate is not armed/ -->
<!-- @anchor MV-47 brain:src/commands/doctor.ts /strict && !hooks\.armed/ -->
<!-- @anchor MV-47 brain:src/commands/doctor.ts /hp === HOOKS_DIR && installed && runner/ -->
<!-- @anchor MV-47 brain:test/doctor/doctor.test.ts /--strict exits 1 when the gate is disarmed/ -->
<!-- @anchor MV-47 brain:site/content/docs/reference/commands.md /exits 1 when the enforcement gate is disarmed/ -->
| MV-48 | `count`'s `count=N` summary names the universal it cannot pin: it ends with one line pointing a rule that must hold in every file at `each` and a forbid-everywhere rule at `each!`, via `mvac help anchor` — the deletion-ratchet hole `each` was built to close. The `each`/`each!` breakdown lists the zero-match files an each-author needs. `help anchor`, the site's writing-anchors guide and the count reference carry the same guidance. | specified | active | 2026-08-15 | [changes/archive/the-gate-cannot-lie.md](changes/archive/the-gate-cannot-lie.md) |
<!-- @anchor MV-48 brain:src/commands/count.ts /must hold in every file/ -->
<!-- @anchor MV-48 brain:src/commands/count.ts /each \? scan\.globFiles/ -->
<!-- @anchor MV-48 brain:src/commands/help.ts /must hold across files is each/ -->
<!-- @anchor MV-48 brain:test/cli/count.test.ts /count summary nudges toward each/ -->
<!-- @anchor MV-48 brain:site/content/docs/reference/commands.md /must hold in every file/ -->
<!-- @anchor MV-48 brain:site/content/docs/guide/writing-anchors.md /dry-run nudges you here on purpose/ -->
| MV-49 | `verify` from a consumer repo whose mount directory (`.brain` or `.knowledge`) is present but is not a brain — no `.multivac/config.yml`, because the submodule pin predates the brain's migration or points at the wrong commit — names the stale pin and says to update the submodule or fix the pin; it never advises `init`, which would scaffold a second brain beside the mount. `init` stays the hint only when no mount is in reach at all. The site's verify reference documents the stale-mount message. | specified | active | 2026-08-15 | [changes/archive/the-mount-explains-itself.md](changes/archive/the-mount-explains-itself.md) |
<!-- @anchor MV-49 brain:src/commands/verify.ts /function findStaleMount/ -->
<!-- @anchor MV-49 brain:src/commands/verify.ts /is mounted but is not a multivac brain/ -->
<!-- @anchor MV-49 brain:test/verify/consumer.test.ts /named as a bad pin, never told to run init/ -->
<!-- @anchor MV-49 brain:site/content/docs/reference/commands.md /is mounted but is not a multivac brain/ -->
| MV-50 | `change close` executes the declared grapher's refresh — in the brain and in each declared+present repo the change touched, per-scope grapher falling back to the global one — when the binary is on PATH; an absent binary degrades to the install notice and a failing refresh warns, never failing the close — and that warning quotes the TOOL'S own first stderr lines, not node's `Command failed: <cmd>`, which only repeats the command the same warning prints again and drops the cause the tool wrote down. The refresh module never invokes git, so the artifact is left uncommitted, to land only in dedicated chore commits. The git hook shims run `verify` only, and the site says there is no refresh on the git hook path; close is the safety net for edits made outside a harness, not the mechanism (MV-52). | specified | active | 2026-08-15 | [changes/archive/the-graph-refreshes-itself.md](changes/archive/the-graph-refreshes-itself.md) |
<!-- @anchor MV-50 brain:src/commands/change.ts /await refreshGraph\(s\.name, s\.dir, s\.scope, cfg\.graphers\)/ -->
<!-- @anchor MV-50 brain:src/adapters/refresh.ts /never spawns git/ -->
<!-- @anchor MV-50 brain:src/adapters/refresh.ts /'git'|gitRun/ absent -->
<!-- @anchor MV-50 brain:src/adapters/refresh.ts /binary not found — refresh skipped/ -->
<!-- @anchor MV-50 brain:src/adapters/refresh.ts /refresh failed/ -->
<!-- @anchor MV-50 brain:src/adapters/refresh.ts /err\.stderr \?\? ''/ unique -->
<!-- @anchor MV-50 brain:test/change/grapher-refresh.test.ts /doesNotMatch\(out, \/Command failed\// unique -->
<!-- @anchor MV-50 brain:test/change/grapher-refresh.test.ts /artifact changed and stays uncommitted/ -->
<!-- @anchor MV-50 brain:test/change/grapher-refresh.test.ts /never a failed close/ -->
<!-- @anchor MV-50 brain:site/content/docs/reference/graphers-and-sdd.md /no refresh on the git hook/ -->
<!-- @anchor MV-50 brain:site/content/docs/reference/graphers-and-sdd.md /never stages or commits the refreshed artifact/ -->
| MV-51 | SDD steps instruct the agent, never shell out: the registry's SDD adapter specs carry the tool's own steps — chat instructions verified against each tool's own docs (the `/opsx:` commands for opsx; `/speckit.*` for speckit, which has no archive equivalent — the gap is stated, never invented). The lifecycle prints the steps bound to its own point, `<slug>` interpolated, only when `sdd_auto` is on and `--no-sdd` was not passed; it never invokes a fake `<binary> <step>` subcommand, and the ONE subprocess it may spawn is the tool's own validator, run for its verdict (MV-56). The brain door carries the flow so the agent knows it at session start, and doctor reports whether `sdd_auto` is on plus what the agent is expected to run. | specified | active | 2026-08-15 | [changes/archive/the-sdd-tells-the-agent.md](changes/archive/the-sdd-tells-the-agent.md) |
<!-- @anchor MV-51 brain:src/adapters/registry.ts /These are chat commands, not terminal subcommands/ -->
<!-- @anchor MV-51 brain:src/adapters/registry.ts /spec-kit has no archive step/ -->
<!-- @anchor MV-51 brain:src/commands/change.ts /INSTRUCT the agent, never shell out/ -->
<!-- @anchor MV-51 brain:src/adapters/sdd.ts /export const withSlug/ -->
<!-- @anchor MV-51 brain:src/adapters/sdd.ts /A step is never faked by shelling out/ -->
<!-- @anchor MV-51 brain:src/commands/change.ts /execFileP\(bin,/ absent -->
<!-- @anchor MV-51 brain:src/commands/change.ts /\$\{step\} done/ absent -->
<!-- @anchor MV-51 brain:src/doors/brain.ts /Features gate through the/ -->
<!-- @anchor MV-51 brain:src/commands/doctor.ts /flow — \$\{l\}/ -->
<!-- @anchor MV-51 brain:test/change/sdd-gates.test.ts /new prints propose/ -->
<!-- @anchor MV-51 brain:skills/multivac/references/change.md /The SDD flow — the lifecycle instructs, YOU run, the gate checks/ -->
<!-- @anchor MV-51 brain:site/content/docs/reference/graphers-and-sdd.md /chat commands the agent runs/ -->
<!-- @anchor MV-51 brain:site/content/docs/reference/graphers-and-sdd.md /has no agent-run close step/ -->
| MV-52 | The graph refresh follows the agent, not the commit: `doors` installs it as a post-edit hook in every declared target whose registry entry carries `hookConfig.postEdit`, and only when a grapher is declared AND its binary is present — one more entry in the same managed `.claude/settings.json` merge that preserves foreign keys, removed again when the grapher goes away. The entry is fire-and-forget (backgrounded, stdio discarded, `exit 0` whatever the tool did) and coalesced behind an atomic lock directory under `.multivac/cache/`, so a per-edit harness cannot thrash a large repo. The git hook shims contain no grapher call at all, the refresh module never spawns git, and doctor names the live path — post-edit hook where the harness has one, `change close` as the net, git hooks never. | specified | active | 2026-08-15 | [changes/archive/the-graph-follows-the-agent.md](changes/archive/the-graph-follows-the-agent.md) |
<!-- @anchor MV-52 brain:src/hooks/install.ts /graph|refresh/ absent -->
<!-- @anchor MV-52 brain:src/doors/settings.ts /export function refreshHookCmd/ -->
<!-- @anchor MV-52 brain:src/doors/settings.ts /graph-refresh\.lock/ -->
<!-- @anchor MV-52 brain:src/doors/settings.ts /is the atomic lock/ -->
<!-- @anchor MV-52 brain:src/commands/doors.ts /binaryPresent\(spec\)/ -->
<!-- @anchor MV-52 brain:src/adapters/registry.ts /postEdit\?: string/ -->
<!-- @anchor MV-52 brain:src/adapters/refresh.ts /'git'|gitRun/ absent -->
<!-- @anchor MV-52 brain:src/commands/doctor.ts /refresh path: / -->
<!-- @anchor MV-52 brain:test/doors/settings.test.ts /backgrounded, coalesced, never a failure/ -->
<!-- @anchor MV-52 brain:test/doors/doors.test.ts /harness post-edit entry, git shim untouched/ -->
<!-- @anchor MV-52 brain:test/doors/doors.test.ts /no grapher declared: no refresh entry at all/ -->
<!-- @anchor MV-52 brain:site/content/docs/reference/graphers-and-sdd.md /harness post-edit hook/ -->
<!-- @anchor MV-52 brain:DESIGN.md /The graph refresh follows the agent, not the commit/ -->
<!-- @anchor MV-52 brain:skills/multivac/references/change.md /it follows YOUR edits, not the commit/ -->
| MV-53 | Each context verifies what it is responsible for. A brain-scoped `verify` reads every declared repo at its channel ref — `channel:` on the entry, else the global, else `origin/main` — resolved in that repo and read with `git ls-tree` plus one `git cat-file --batch`, never that repo's working tree: the brain's law is about the ecosystem as published, so a sibling parked on a WIP branch is mid-task, not a violation. The brain's OWN repo is the exception and is always read as a working tree, because that is the commit the run gates. A channel ref that does not resolve falls back to the working tree and says so. A consumer-scoped run is unchanged: the working tree, the content about to be committed there. Every run prints one `read` line per repo naming the ref or the branch and its short sha — for a channel read, how old that ref is (MV-54) — and names a checkout parked off its channel; `--worktree` forces the whole-ecosystem working-tree read; `doctor` carries a `branches` line saying where each repo is parked and whether that is its channel. | specified | active | 2026-08-15 | [changes/archive/each-scope-verifies-its-own.md](changes/archive/each-scope-verifies-its-own.md) |
<!-- @anchor MV-53 brain:src/commands/verify.ts /async function resolveSources/ -->
<!-- @anchor MV-53 brain:src/commands/verify.ts /the channel, as published/ -->
<!-- @anchor MV-53 brain:src/commands/verify.ts /FELL BACK to the working tree/ -->
<!-- @anchor MV-53 brain:src/commands/verify.ts /the brain's own repo, the commit this run gates/ -->
<!-- @anchor MV-53 brain:src/commands/verify.ts /const handles: RepoHandle\[\] = sources\.map/ -->
<!-- @anchor MV-53 brain:src/lib/config.ts /export const channelRef/ -->
<!-- @anchor MV-53 brain:src/lib/config.ts /DEFAULT_CHANNEL = 'origin\/main'/ -->
<!-- @anchor MV-53 brain:src/lib/git.ts /export async function lsTree/ -->
<!-- @anchor MV-53 brain:src/lib/git.ts /export async function catFileBlobs/ -->
<!-- @anchor MV-53 brain:src/anchor/match.ts /readonly ref\?: string/ -->
<!-- @anchor MV-53 brain:src/commands/doctor.ts /async function branchesLine/ -->
<!-- @anchor MV-53 brain:test/verify/scope.test.ts /a sibling parked on a WIP branch does not redden the brain/ -->
<!-- @anchor MV-53 brain:test/verify/scope.test.ts /--worktree reproduces the old whole-ecosystem working-tree behaviour/ -->
<!-- @anchor MV-53 brain:test/verify/scope.test.ts /an unresolvable channel falls back to the working tree and says so/ -->
<!-- @anchor MV-53 brain:test/doctor/doctor.test.ts /doctor names the branch each repo is parked on/ -->
<!-- @anchor MV-53 brain:DESIGN.md /Each context verifies what it is responsible for/ -->
<!-- @anchor MV-53 brain:site/content/docs/reference/commands.md /What each run reads/ -->
<!-- @anchor MV-53 brain:site/content/docs/reference/configuration.md /The ecosystem as published/ -->
<!-- @anchor MV-53 brain:skills/multivac/SKILL.md /Read the .read. lines before you read the verdicts/ -->
| MV-54 | A channel ref is only as true as the last fetch, and every surface says so. `repos sync` fetches every declared repo already on disk as well as cloning the missing ones — a failed clone gates, a failed fetch reports and never gates. A brain-scoped `verify` names the age of each channel ref it read (`last fetch 2h ago`, or `never fetched here`), and a brain==code tree behind its own channel is named on its `read` line and on `doctor`'s `branches` line. `verify`, `doctor` and `doors` still never touch the network (MV-01): freshness is bought only in the explicit command. | specified | active | 2026-08-15 | [changes/sync-fetches-the-channel.md](changes/archive/sync-fetches-the-channel.md) |
<!-- @anchor MV-54 brain:src/commands/repos.ts /'fetch', '--quiet'/ unique -->
<!-- @anchor MV-54 brain:src/commands/repos.ts /could not fetch/ -->
<!-- @anchor MV-54 brain:src/commands/verify.ts /async function brainDrift/ -->
<!-- @anchor MV-54 brain:src/commands/verify.ts /never fetched here/ -->
<!-- @anchor MV-54 brain:src/commands/verify.ts /an out-of-date law judges a current ecosystem/ -->
<!-- @anchor MV-54 brain:test/verify/scope.test.ts /a brain merely ON A BRANCH is not/ -->
<!-- @anchor MV-54 brain:src/commands/doctor.ts /behind its own channel/ -->
<!-- @anchor MV-54 brain:test/repos/sync.test.ts /origin\/main was refreshed by sync/ -->
<!-- @anchor MV-54 brain:test/verify/scope.test.ts /the brain behind its OWN channel says so/ -->
<!-- @anchor MV-54 brain:DESIGN.md /"As published" carries its age/ -->
<!-- @anchor MV-54 brain:site/content/docs/reference/commands.md /The fetch is what keeps `verify` honest/ -->
| MV-55 | An SDD adapter carries the tool's OWN flow, never a fixed triple: `projectSteps` (project-level documents, each with when to revisit) plus an ordered `steps` array of arbitrary length, every step bound to a lifecycle point (`new`/`plan`/`apply`/`land`/`close`) rather than to a propose/apply/archive name. The lifecycle prints the steps of its own point, in order, `<slug>` interpolated; the brain door and `doctor` project the same flow. OpenSpec declares no project-level document — the honest gap is stated, not invented — while spec-kit's constitution is declared with its amendment rule. | specified | active | 2026-08-15 | [changes/the-sdd-gates-its-own-flow.md](changes/archive/the-sdd-gates-its-own-flow.md) |
<!-- @anchor MV-55 brain:src/adapters/registry.ts /steps\?: SddStep\[\]/ -->
<!-- @anchor MV-55 brain:src/adapters/registry.ts /projectSteps\?: SddProjectStep\[\]/ -->
<!-- @anchor MV-55 brain:src/adapters/registry.ts /export type LifecyclePoint/ -->
<!-- @anchor MV-55 brain:src/adapters/registry.ts /OpenSpec has NO project-level document/ -->
<!-- @anchor MV-55 brain:src/adapters/registry.ts /run \/speckit\.constitution in your agent/ -->
<!-- @anchor MV-55 brain:src/adapters/sdd.ts /export const stepsAt/ -->
<!-- @anchor MV-55 brain:src/doors/brain.ts /in that tool's OWN flow/ -->
<!-- @anchor MV-55 brain:src/commands/doctor.ts /flow — \$\{l\}/ -->
<!-- @anchor MV-55 brain:test/doors/registry.test.ts /The flow is ORDERED/ -->
<!-- @anchor MV-55 brain:test/change/sdd-gates.test.ts /its own longer flow drives the lifecycle/ -->
<!-- @anchor MV-55 brain:DESIGN.md /in the SDD's own shape/ -->
<!-- @anchor MV-55 brain:site/content/docs/reference/graphers-and-sdd.md /Each tool's own flow, not a fixed triple/ -->
| MV-56 | Every SDD step declares the artifact that proves it ran, `<slug>` interpolated: `change plan` refuses while the propose-equivalent artifact is missing, `change apply` while the plan/tasks artifact is, `change close` while the archive-equivalent has not happened. Each refusal names the exact agent command to run, the artifact path it looked for and the repos it looked in — the brain plus every declared repo present on disk, since a change's specs often live in the code repo — and each pass names the repo the artifact was found in. A step the tool cannot leave an artifact for is declared `ungateable` with its reason and is never gated — the message says so instead of faking it, and a lifecycle point no step gates says the gate does not exist for this tool. Where the tool ships its own validator its verdict is REUSED (`openspec validate --json`), never reimplemented, and the lifecycle shells out for validation only, never to fake an agent-run step. `sdd_auto: false` and `--no-sdd` turn every gate off. | specified | active | 2026-08-15 | [changes/the-sdd-gates-its-own-flow.md](changes/archive/the-sdd-gates-its-own-flow.md) |
<!-- @anchor MV-56 brain:src/adapters/sdd.ts /export async function sddGate/ -->
<!-- @anchor MV-56 brain:src/adapters/sdd.ts /is missing — looked in \$\{where\}/ -->
<!-- @anchor MV-56 brain:src/adapters/detect.ts /each root carries the name the config gave it/ -->
<!-- @anchor MV-56 brain:test/change/sdd-gates.test.ts /the gate names the repo it searched/ -->
<!-- @anchor MV-56 brain:src/adapters/sdd.ts /refused — \$\{want\} is missing/ -->
<!-- @anchor MV-56 brain:src/adapters/sdd.ts /then re-run: multivac change \$\{gate\} \$\{slug\}/ -->
<!-- @anchor MV-56 brain:src/adapters/sdd.ts /is not gated — this tool declares no step whose artifact could prove it/ -->
<!-- @anchor MV-56 brain:src/adapters/sdd.ts /ungateable: \$\{step\.ungateable/ -->
<!-- @anchor MV-56 brain:src/adapters/sdd.ts /Reuse the tool's own verdict/ -->
<!-- @anchor MV-56 brain:src/commands/change.ts /gateSdd\(brain, cfg, 'plan', slug, noSdd\)/ -->
<!-- @anchor MV-56 brain:src/commands/change.ts /gateSdd\(brain, cfg, 'apply', slug, noSdd\)/ -->
<!-- @anchor MV-56 brain:src/commands/change.ts /gateSdd\(brain, cfg, 'close', slug, noSdd\)/ -->
<!-- @anchor MV-56 brain:src/adapters/detect.ts /export async function artifactHit/ -->
<!-- @anchor MV-56 brain:test/change/sdd-gates.test.ts /plan REFUSES until proposal\.md exists/ -->
<!-- @anchor MV-56 brain:test/change/sdd-gates.test.ts /the tool's own validator is the verdict, not a reimplementation/ -->
<!-- @anchor MV-56 brain:test/change/sdd-gates.test.ts /close still has no archive step, but its task ledger is read/ -->
<!-- @anchor MV-56 brain:test/change/sdd-gates.test.ts /--no-sdd turns off the steps AND the gates/ -->
<!-- @anchor MV-56 brain:test/doors/registry.test.ts /declare an artifact OR an ungateable reason/ -->
<!-- @anchor MV-56 brain:DESIGN.md /The steps are gated on what the tool really produces/ -->
<!-- @anchor MV-56 brain:site/content/docs/reference/graphers-and-sdd.md /The gate: what the tool really produces/ -->
| MV-57 | The project-level document is reported, never gated: `doctor` names it present or missing with the exact agent command that creates it, refuses to call a tool-scaffolded template "present" while its `placeholder` pattern still matches, and calls it STALE when the law's newest row is newer than the file — a product whose law moved while its constitution did not. It stays a report because a constitution's content cannot be machine-judged, and BOTH doors tell the agent to create it if absent — `init` writes the instruction into the door it scaffolds and `doors` into the brain door, because `doors` is a second command and a constitution the agent hears about only on the second command is one nobody writes. | specified | active | 2026-08-15 | [changes/the-sdd-gates-its-own-flow.md](changes/archive/the-sdd-gates-its-own-flow.md) |
<!-- @anchor MV-57 brain:src/commands/doctor.ts /Reported, never gated/ -->
<!-- @anchor MV-57 brain:src/doors/brain.ts /export function projectLawLines/ -->
<!-- @anchor MV-57 brain:src/commands/init.ts /projectLawLines\(sddName\)/ -->
<!-- @anchor MV-57 brain:test/init/init.test.ts /init carries the sdd project law into the door it writes/ -->
<!-- @anchor MV-57 brain:src/commands/doctor.ts /project law — \$\{found/ -->
<!-- @anchor MV-57 brain:src/commands/doctor.ts /STALE: the law moved while this did not/ -->
<!-- @anchor MV-57 brain:src/commands/doctor.ts /is still the unfilled template shipped by the tool/ -->
<!-- @anchor MV-57 brain:src/adapters/registry.ts /placeholder\?: string/ -->
<!-- @anchor MV-57 brain:src/commands/doctor.ts /project law — revisit: \$\{p\.revisit\}/ -->
<!-- @anchor MV-57 brain:src/doors/brain.ts /CREATE IT IF ABSENT/ -->
<!-- @anchor MV-57 brain:test/doctor/doctor.test.ts /reported present, missing and stale — never gated/ -->
<!-- @anchor MV-57 brain:skills/multivac/references/change.md /reports the document missing, still-a-template, present, or/ -->
<!-- @anchor MV-57 brain:site/content/docs/reference/graphers-and-sdd.md /The project-level document/ -->
| MV-58 | One grapher refresh runs at a time per directory. Every path that shells a grapher — the harness post-edit hook and `change close` — takes the same `.multivac/cache/graph-refresh.lock`, a `mkdir` on that scope's own checkout. The two paths differ in what they do when it is held: the hook SKIPS, because the refresh already running covers this edit; close WAITS on a bounded poll and then proceeds with a notice, because close is the net for edits made outside a harness and a skipped close leaves the graph stale with nobody left to refresh it. The 30-minute sweep in the hook is a ceiling, not a liveness check — it cannot tell a killed process from a slow one — and the code says so instead of claiming it clears stale locks. | specified | active | 2026-08-15 | [changes/the-small-lies-and-the-shared-lock.md](changes/archive/the-small-lies-and-the-shared-lock.md) |
<!-- @anchor MV-58 brain:src/doors/settings.ts /export const GRAPH_LOCK/ unique -->
<!-- @anchor MV-58 brain:src/doors/settings.ts /cannot tell a killed process from a grapher still indexing/ -->
<!-- @anchor MV-58 brain:src/adapters/refresh.ts /Take the SAME lock the post-edit hook takes/ -->
<!-- @anchor MV-58 brain:src/adapters/refresh.ts /await mkdir\(lock\)/ unique -->
<!-- @anchor MV-58 brain:src/adapters/refresh.ts /Where the hook SKIPS, close WAITS/ -->
<!-- @anchor MV-58 brain:test/change/grapher-refresh.test.ts /close takes the SAME lock the post-edit hook takes, and waits for it/ -->
<!-- @anchor MV-58 brain:site/content/docs/reference/graphers-and-sdd.md /grapher-refresh/ -->
| MV-59 | The registry never invents a grapher's contract. A name absent from `knownGraphers` and from the config's own `graphers:` declarations is UNVERIFIED: `grapherSpec` returns null and every caller — `doctor`, `doors`, `change close` — prints the exact fields to declare instead of deriving `<name>-out/graph.json`, `<name> update .` and `npm i -g <name>` from the name, a shape that matched exactly one of ~47 surveyed tools. An unknown tool becomes usable with no merge request against multivac by declaring `graphers.<name>` in `.multivac/config.yml` with `artifact` and `refresh` (optionally `create`, `binary`, `install`); the binary defaults to the first word of `refresh`, because a tool's binary name is not its adapter name (`depcruise` is not `dependency-cruiser`). An artifact path multivac chose rather than the vendor is named as multivac's choice in the entry's note, AND the refresh shipped beside it writes that exact path in a repo that has never run the tool — a chosen path the shipped command cannot write (`--output-to` creates no directories) is not a choice, it is the same invented path one layer down. A field the vendor's docs do not state says UNVERIFIED rather than carrying a guess; a field they DO state is carried verbatim, because UNVERIFIED on a published fact sends the reader to guess the very name this rule exists to stop guessing — PyPI's `axon` is not `axoniq` the way npm's `graphify` is not `graphifyy`. | specified | active | 2026-08-15 | [changes/the-gaps-that-were-not-gaps.md](changes/archive/the-gaps-that-were-not-gaps.md) |
<!-- @anchor MV-59 brain:src/adapters/registry.ts /export function grapherSpec/ unique -->
<!-- @anchor MV-59 brain:src/adapters/registry.ts /if \(!known && !decl\) return null/ unique -->
<!-- @anchor MV-59 brain:src/adapters/registry.ts /export function unverifiedGrapher/ unique -->
<!-- @anchor MV-59 brain:src/adapters/registry.ts /decl!\.binary \?\? decl!\.refresh\.split/ -->
<!-- @anchor MV-59 brain:src/lib/config.ts /multivac will not guess either/ -->
<!-- @anchor MV-59 brain:src/commands/{doctor,doors}.ts /unverifiedGrapher\(/ each -->
<!-- @anchor MV-59 brain:src/adapters/refresh.ts /unverifiedGrapher\(name\)/ -->
<!-- @anchor MV-59 brain:test/doctor/adapters.test.ts /an unknown grapher is UNVERIFIED — nothing is derived from the name/ -->
<!-- @anchor MV-59 brain:test/doctor/adapters.test.ts /a config-declared grapher is usable without a registry MR/ -->
<!-- @anchor MV-59 brain:test/doctor/adapters.test.ts /the table speaks two graphers, and everything else is UNVERIFIED/ -->
<!-- @anchor MV-59 brain:test/change/grapher-refresh.test.ts /an unverified grapher refuses at close/ -->
<!-- @anchor MV-59 brain:site/content/docs/reference/graphers-and-sdd.md /There is no generic contract/ -->
<!-- @anchor MV-59 brain:site/content/docs/reference/configuration.md /### `graphers`/ -->
| MV-60 | Every finding line names the repo it was found in. A leg's matches, the files that fail an `each`, and the candidate files of an ambiguous self-heal all print as `<repoKey>:<file>[:<line>]`, whether the leg is anchored to one repo or to `*` — an unprefixed `src/cli.ts:42` is ambiguous the moment a second repo is declared. | specified | active | 2026-08-15 | [changes/the-small-lies-and-the-shared-lock.md](changes/archive/the-small-lies-and-the-shared-lock.md) |
<!-- @anchor MV-60 brain:src/anchor/evaluate.ts /Every hit says which repo it came from/ -->
<!-- @anchor MV-60 brain:src/anchor/evaluate.ts /const at = \(key: string, file: string\): string/ unique -->
<!-- @anchor MV-60 brain:src/anchor/evaluate.ts /\$\{star \? `\$\{/ absent -->
<!-- @anchor MV-60 brain:test/verify/each.test.ts /pattern .+api:k8s/ -->
<!-- @anchor MV-60 brain:test/verify/scope.test.ts /pattern .+api:src/ -->
| MV-61 | A grapher multivac ships is one whose **query verbs** it knows, not merely one whose artifact it can rebuild. Every entry in `knownGraphers` carries `queries` — each verb exactly as the agent types it, with one line saying what it answers — and the brain door prints them under the artifact, telling the agent to ask the graph before reading the tree raw. The verbs are printed **verbatim per tool and never paraphrased into a common one**: `graphify query` takes a question in words, `codegraph query` takes a symbol by name, and a door saying "query the graph" is wrong for one of them with no way for the agent to tell which. A tool with no query verb carries no `queries`, and the door states that the artifact is written but nothing reads it back — silence there reads as "no graph", and an invented verb is worse than both. A verb enters the table only after being RUN against the shipped binary, never read off `--help`: graphify's `query` is absent from its own help output and is the most useful verb it has. A grapher declared in config gets no query lines at all, because multivac does not know its verbs and will not guess them. | specified | active | 2026-08-16 | [changes/two-graphers-and-what-each-one-answers.md](changes/archive/two-graphers-and-what-each-one-answers.md) |
<!-- @anchor MV-61 brain:src/adapters/registry.ts /export interface GrapherQuery/ unique -->
<!-- @anchor MV-61 brain:src/adapters/registry.ts /never be paraphrased into a/ -->
<!-- @anchor MV-61 brain:src/adapters/registry.ts /queries\?: GrapherQuery\[\]/ unique -->
<!-- @anchor MV-61 brain:src/adapters/registry.ts /absent from `graphify --help`/ -->
<!-- @anchor MV-61 brain:src/adapters/registry.ts /graphify query "<question>"/ unique -->
<!-- @anchor MV-61 brain:src/adapters/registry.ts /codegraph query <symbol>/ unique -->
<!-- @anchor MV-61 brain:src/doors/brain.ts /export function grapherLines/ unique -->
<!-- @anchor MV-61 brain:src/doors/brain.ts /ASK IT BEFORE READING THE TREE RAW/ unique -->
<!-- @anchor MV-61 brain:src/doors/brain.ts /has NO query command/ unique -->
<!-- @anchor MV-61 brain:test/doctor/adapters.test.ts /a grapher states its own query verbs — they are not interchangeable/ -->
<!-- @anchor MV-61 brain:site/content/docs/reference/graphers-and-sdd.md /### What the graph answers/ -->
| MV-62 | A shipped grapher entry names any network its refresh performs, because that refresh runs from a post-edit hook on every edit. `codegraph` sends anonymous telemetry by default, so its note says so, states what the vendor documents as never collected, and gives the opt-out verbatim. The table's contract — a path in the repo, one command safe to re-run, no model and no network — is a claim about what the entry has been made to be, not a hope; where a tool is only offline after an opt-out, the entry says which command makes it true. | specified | active | 2026-08-16 | [changes/two-graphers-and-what-each-one-answers.md](changes/archive/two-graphers-and-what-each-one-answers.md) |
<!-- @anchor MV-62 brain:src/adapters/registry.ts /TELEMETRY IS ON BY DEFAULT/ unique -->
<!-- @anchor MV-62 brain:src/adapters/registry.ts /codegraph telemetry off/ unique -->
<!-- @anchor MV-62 brain:test/doctor/adapters.test.ts /codegraph names its telemetry, because the refresh runs on every edit/ -->
| MV-63 | A step whose tool keeps a **ledger of its own work** is gated on that ledger, not only on the artifact proving the step ran. Every SDD tool here ships a way to finish a step over its own objection — `openspec archive --yes` prints `Warning: N incomplete task(s) found` and archives regardless — and gating on the artifact alone accepts that outcome silently. A step declaring `unfinished` names the ledger path, an ERE matching a line that means NOT DONE, and its own lifecycle gate; the refusal quotes the open items and names the repo they were found in. `unfinished` carries a gate SEPARATE from the step's, so an `ungateable` step is still checked: whether spec-kit's implement RAN leaves no trace and never will, while whether its task list still has open boxes is a fact on disk. This never claims the work happened — `- [x]` is a character the agent types about itself — only that the tool's own book does not say UNDONE. A missing ledger is neither pass nor fail: absence is not evidence of completion, and the artifact gate already covers a step that owed one. | specified | active | 2026-08-16 | [changes/the-ledger-and-the-link.md](changes/the-ledger-and-the-link.md) |
<!-- @anchor MV-63 brain:src/adapters/registry.ts /A ledger the TOOL ITSELF keeps/ unique -->
<!-- @anchor MV-63 brain:src/adapters/registry.ts /continues over its own warning/ unique -->
<!-- @anchor MV-63 brain:src/adapters/sdd.ts /export const stepsLedgered/ unique -->
<!-- @anchor MV-63 brain:src/adapters/sdd.ts /The ledger pass/ unique -->
<!-- @anchor MV-63 brain:src/adapters/sdd.ts /open item\(s\)/ unique -->
<!-- @anchor MV-63 brain:src/adapters/sdd.ts /Absence here is not evidence of completion/ unique -->
<!-- @anchor MV-63 brain:test/change/sdd-gates.test.ts /opsx: close refuses when the archived change still has open tasks/ -->
<!-- @anchor MV-63 brain:test/change/sdd-gates.test.ts /speckit: the ledger is checked even though implement stays ungateable/ -->
| MV-64 | Archiving a change **repoints the law at the file it just moved**. `close` moves `changes/<slug>.md` into `changes/archive/`, and every row whose source column cited the open path is rewritten to the archived one in the same operation. Only `(changes/<slug>.md)` as a markdown link target is rewritten — prose naming the change is left alone — and a link already pointing into `archive/` is skipped, so the rewrite is idempotent. A brain with no law file yet is a no-op, never an error. The rule exists because the table was disagreeing with its own schema: rows written after an archive used the archived path, rows written while the change was open pointed at nothing, and for a tool whose whole claim is that a citation can be checked, a citation resolving to a missing file is exactly the rot it exists to prevent. | specified | active | 2026-08-16 | [changes/the-ledger-and-the-link.md](changes/the-ledger-and-the-link.md) |
<!-- @anchor MV-64 brain:src/change/file.ts /export async function repointLawLinks/ unique -->
<!-- @anchor MV-64 brain:src/change/file.ts /The move is only half the archive/ unique -->
<!-- @anchor MV-64 brain:src/change/file.ts /prose must not be rewritten/ unique -->
<!-- @anchor MV-64 brain:test/change/file.test.ts /archiving rewrites every law row that cited the open change/ -->
<!-- @anchor MV-64 brain:test/change/file.test.ts /repointing a brain with no law file is a no-op, never a crash/ -->
| MV-65 | **A present artifact that proves nothing is treated as missing.** Existence is the weakest possible proof and some tools give it away: spec-kit's `setup-plan.sh` writes the resolved template straight into `plan.md` as part of STARTING the step, and falls back to `rm -f` + `touch` when it cannot resolve one. So a gated artifact also refuses when it is EMPTY — no declaration needed, a step's artifact is never legitimately empty whatever the tool — and when it is BYTE-IDENTICAL to a template named in the step's `untouched` list, which is checked against the paths the tool really copies from, overrides included. Whole-file equality, never a guessed placeholder: the obvious pin — spec-kit's own `# Implementation Plan: [FEATURE]` heading — is a line the tool never asks anyone to change, so a complete real plan keeps it and a regex on it would refuse honest work forever. What the check does not catch is stated in the entry rather than hidden: an agent that edits one line and stops. | specified | active | 2026-08-16 | [changes/the-ledger-and-the-link.md](changes/the-ledger-and-the-link.md) |
<!-- @anchor MV-65 brain:src/adapters/registry.ts /untouched\?: string\[\]/ unique -->
<!-- @anchor MV-65 brain:src/adapters/registry.ts /a line spec-kit NEVER asks anyone to change/ unique -->
<!-- @anchor MV-65 brain:src/adapters/sdd.ts /async function copiedFrom/ unique -->
<!-- @anchor MV-65 brain:src/adapters/sdd.ts /\$\{found\.rel\} is empty/ unique -->
<!-- @anchor MV-65 brain:src/adapters/sdd.ts /the scaffolding wrote it, nobody has/ unique -->
<!-- @anchor MV-65 brain:test/change/sdd-gates.test.ts /an artifact byte-identical to its template, or empty, is refused/ -->
| MV-66 | **A gate that cannot be evaluated refuses.** When a step declares the tool's own `validate` command and that binary cannot be found, `change` refuses and names the binary, the adapter's install line, and the two switches actually scoped to gating — `--no-sdd` for one run, `sdd_auto: false` for good. It never says "drop `sdd:`": that key also renders the whole SDD flow into the brain door, so removing it deletes the agent's instructions along with the check. Passing instead would leave the gate standing on artifact existence alone wherever the tool is not installed — the same command green on a machine that can check nothing, the quietest way this tool could lie. The binary is looked for on `PATH` and then in `node_modules/.bin` beside the artifact, because a project-local `npm i -D` is an ordinary install shape that never touches `PATH`. | specified | active | 2026-08-16 | [changes/the-ledger-and-the-link.md](changes/the-ledger-and-the-link.md) |
<!-- @anchor MV-66 brain:src/adapters/sdd.ts /A MISSING BINARY IS A FAILURE/ unique -->
<!-- @anchor MV-66 brain:src/adapters/sdd.ts /kind: 'missing'; bin: string/ unique -->
<!-- @anchor MV-66 brain:src/adapters/sdd.ts /node_modules', '\.bin'/ unique -->
<!-- @anchor MV-66 brain:src/adapters/sdd.ts /skip the gates without losing the door/ unique -->
<!-- @anchor MV-66 brain:src/adapters/registry.ts /is a REFUSAL, not a pass/ unique -->
<!-- @anchor MV-66 brain:test/change/sdd-gates.test.ts /a validator that is not installed REFUSES, naming the binary and the install line/ -->
<!-- @anchor MV-66 brain:test/change/sdd-gates.test.ts /a locally-installed validator is found in node_modules\/\.bin, not refused/ -->
| MV-67 | **`close` is no weaker than `plan` and `apply`, and abandonment has its own door.** A change declaring no repos is refused at close exactly as it is at plan and apply — the old check filtered the unlanded out of an empty map and found nothing to complain about, so a change that named no repo archived silently and released its reserved id. Every declared key is resolved through the same lookup its siblings use, because counting keys is not having repos: one invented name satisfied an emptiness test while `plan` and `apply` both reject it. And because `change new` reserves an id before anything is declared, `close --abandon` exists to give that id back: it archives a change that made no claims and landed nothing, verifying nothing, since there is nothing to verify. Without it the only routes out are leaking the id forever or writing a false `status: landed`. | specified | active | 2026-08-16 | [changes/the-ledger-and-the-link.md](changes/the-ledger-and-the-link.md) |
<!-- @anchor MV-67 brain:src/commands/change.ts /The gate is on the declaration, not on its leftovers/ unique -->
<!-- @anchor MV-67 brain:src/commands/change.ts /counting keys is not the same as having repos/ unique -->
<!-- @anchor MV-67 brain:src/commands/change.ts /Abandoning is the other ending/ unique -->
<!-- @anchor MV-67 brain:src/commands/change.ts /--abandon/ -->
<!-- @anchor MV-67 brain:src/change/file.ts /Archived is not missing/ unique -->
<!-- @anchor MV-67 brain:test/change/sdd-gates.test.ts /close refuses a repo key that plan and apply already refuse/ -->
<!-- @anchor MV-67 brain:test/change/sdd-gates.test.ts /--abandon gives the reservation back; the refusal points at it/ -->
| MV-68 | **The published tarball carries the tool and nothing else**, by an allowlist rather than by whatever `.gitignore` happens to exclude. `files` is `dist` and `skills`; npm adds `package.json`, `README.md` and `LICENSE`. `skills` ships because `doors` reads the packaged skill at runtime and says so when it is absent — it is code, not documentation. What must NEVER ship: `.multivac/` (this repo's own brain — its law, its open changes, its archive), `site/`, `test/`, `DESIGN.md`, `.gitlab/`. Before the allowlist a publish would have carried 214 files and 1.4MB of exactly that. **Releases are published by trusted publishing (OIDC), never a token**: GitLab mints a short-lived credential for this project and ref, so no long-lived publish token exists to leak or rotate. The job runs on a `v<semver>` tag only, and refuses unless the tag equals `package.json`'s version — a release is a decision somebody makes, never a side effect of a merge. **A tag runs that job and nothing else**: `test` and `selfverify` skip tags, and the publish job does not re-run them either. The commit a tag names already passed both on its way to main, so repeating them only delays the release and adds a second way for it to fail; the one check that could not have been made earlier is the tag-to-version match, and that is the one it keeps. | specified | active | 2026-08-16 | [changes/the-first-release.md](changes/the-first-release.md) |
<!-- @anchor MV-68 brain:package.json /"files":/ unique -->
<!-- @anchor MV-68 brain:.gitlab-ci.yml /aud: "npm:registry\.npmjs\.org"/ unique -->
<!-- @anchor MV-68 brain:.gitlab-ci.yml /CI_COMMIT_TAG =~/ unique -->
<!-- @anchor MV-68 brain:.gitlab-ci.yml /never a side effect of a merge/ -->
<!-- @anchor MV-68 brain:.gitlab-ci.yml /A tag runs the publish job and nothing else/ count=2 -->
<!-- @anchor MV-68 brain:.gitlab-ci.yml /when: never/ count=2 -->
<!-- @anchor MV-68 brain:.gitlab-ci.yml /NPM_TOKEN/ absent -->
| MV-69 | **Every command declares its own `usage`**, and `--help` prints it. A one-line description is a name, not documentation: `multivac init --help` printed nothing about `[dir]`, `--provider`, `--sdd`, `--grapher` or `--quiet`, and five of nine commands were the same. The dispatcher already answered `--help` before running anything; what was missing was data, so the fix is data. Where a flag's legal values come from the registry they are rendered FROM the registry — `--provider`, `--sdd` and `--grapher` list what the tool actually ships, so a new adapter cannot leave the help behind. The rule is enforced as an `each` leg over `src/commands/*.ts`, which is what that mode is for: the next command physically cannot ship without one. | specified | active | 2026-08-16 | [changes/every-command-shows-its-flags.md](changes/every-command-shows-its-flags.md) |
<!-- @anchor MV-69 brain:src/commands/*.ts !brain:src/commands/index.ts /^  usage:/ each -->
<!-- @anchor MV-69 brain:src/types.ts /usage\?: string\[\]/ unique -->
<!-- @anchor MV-69 brain:src/commands/init.ts /grapherNames\.join/ unique -->
<!-- @anchor MV-69 brain:test/cli/help.test.ts /every command prints its own flags and arguments/ -->
| MV-70 | **`init` projects what it declares.** A harness named with `--provider` gets its door, its skill and its harness hooks written in the same run — not a name in `doors:` and a second command the user has to discover. The old split ended with `init` printing "load the multivac skill" after installing no skill, which is the tool contradicting itself in its own last line. `init` already wrote AGENTS.md and armed the git hooks, so "flags configure, they never perform" described nothing that was true. It calls the same `doors` code path rather than growing a second one, and with nothing declared beyond the canonical door it does nothing. **`agents` is never a `--provider` value**: agents.md is the open format every door projects FROM, not a tool anyone could install, and AGENTS.md is written unconditionally. | specified | active | 2026-08-16 | [changes/every-command-shows-its-flags.md](changes/every-command-shows-its-flags.md) |
<!-- @anchor MV-70 brain:src/commands/init.ts /Project what was just declared/ unique -->
<!-- @anchor MV-70 brain:src/commands/init.ts /await doorsCommand\.run/ unique -->
<!-- @anchor MV-70 brain:src/commands/init.ts /never a --provider value/ unique -->
<!-- @anchor MV-70 brain:test/init/init.test.ts /init with no provider writes only the canonical door/ -->
<!-- @anchor MV-70 brain:src/commands/init.ts /'--agent'/ absent -->
| MV-71 | **Enumeration yields each tracked file exactly once, and a tree mid-merge says so.** git keeps three index entries for a conflicted path — base, ours, theirs — and `ls-files` prints one line per stage, so every match inside such a file was counted three times: a `count=2` leg reported `found 6` and advised "revert the new occurrence, or ratchet to count=6". Advice that, followed, writes a corrupted number into the law over a merge unrelated to the claim — a miscount arriving with confident advice is worse than a crash. `lsFiles` deduplicates, and every `read` line names any path still unresolved, because a verdict taken mid-merge is about a tree nobody will commit: some files one side, some the other. | specified | active | 2026-08-16 | [changes/ls-files-counts-each-file-once.md](changes/ls-files-counts-each-file-once.md) |
<!-- @anchor MV-71 brain:src/lib/git.ts /'--deduplicate'\]/ unique -->
<!-- @anchor MV-71 brain:src/lib/git.ts /one line per stage/ unique -->
<!-- @anchor MV-71 brain:src/lib/git.ts /export async function unmergedFiles/ unique -->
<!-- @anchor MV-71 brain:src/commands/verify.ts /MID-MERGE/ count=2 -->
<!-- @anchor MV-71 brain:test/lib/unmerged.test.ts /a conflicted file is listed once, not once per merge stage/ -->
<!-- @anchor MV-71 brain:test/lib/unmerged.test.ts /the mid-merge state is reported, not silently judged/ -->
<!-- @anchor MV-71 brain:.gitignore /^node_modules$/ unique -->
| MV-72 | **The skill this repo ships and the skill its own harness reads are one tree.** `doors` writes `.claude/skills/multivac/` as a copy of `skills/multivac/`, and this repo tracks both, so a clone is wired without running `doors` — at the price of two committed copies of one tree. An edit that lands in one and misses the other is invisible to git and to every text anchor here, because both copies still contain whatever string an anchor looks for. No anchor can compare two trees, so the comparison is a test: same file list, same bytes, checked from the source outward. | open | proposed | 2026-08-16 | [changes/built-with-itself-includes-the-door.md](changes/archive/built-with-itself-includes-the-door.md) |
<!-- @anchor MV-72 brain:test/invariants/skill-copy.test.ts /byte-identical to its source/ -->
<!-- @anchor MV-72 brain:skills/multivac/SKILL.md /^# multivac — operating protocol$/ unique -->
<!-- @anchor MV-72 brain:.claude/skills/multivac/SKILL.md /^# multivac — operating protocol$/ unique -->
| MV-73 | **`doors` removes what it stops projecting.** The skill install is a copy with no delete pass, so a file removed from the source survived in the projected directory forever — reproduced with a planted `references/STALE.md` that outlived every later run. Harmless while the copy was untracked scratch; MV-72 made both trees tracked, so the stale file is committed and the test that pins the two trees goes red for a file the tool itself refuses to remove. Projection is a mirror, not an accretion: every file under the projected skill directory that the source no longer has is deleted in the same run, bounded to that directory and never a parent. | open | proposed | 2026-08-16 | [changes/doors-prunes-what-it-projects.md](changes/doors-prunes-what-it-projects.md) |
<!-- @anchor MV-73 brain:src/commands/doors.ts /the projection is a mirror, not an accretion/ -->
<!-- @anchor MV-73 brain:test/doors/doors.test.ts /a file the source no longer has is deleted from the copy/ -->
| MV-74 | **The managed settings merge owns only the entry it wrote.** Claiming any hook entry whose command merely *contains* the marker, then replacing that entry's whole `hooks` array and rewriting its `matcher`, deleted a user's `--strict`, their second command and their `Bash` matcher in one run — and because the claim stops at the first match, multivac's own entry survived further down the list and `verify` then fired twice per edit. A substring of somebody else's command is not identity: the owned entry is recognised by something multivac writes and nobody types by accident, an update replaces only the hook object carrying it, and every sibling command and matcher is left alone. | open | proposed | 2026-08-16 | [changes/the-merge-keeps-what-it-did-not-write.md](changes/the-merge-keeps-what-it-did-not-write.md) |
<!-- @anchor MV-74 brain:src/doors/settings.ts /owns only the entry it wrote/ -->
<!-- @anchor MV-74 brain:src/doors/settings.ts /command\.includes\(marker\)/ absent -->
<!-- @anchor MV-74 brain:test/doors/settings.test.ts /a foreign entry that mentions the marker is left alone/ -->
| MV-75 | **An adapter declares the scaffold that makes its steps runnable.** Declaring an SDD in a repo where it has never run made the change that installs it unplannable: `plan` refuses without the propose artifact, that artifact comes from a chat command, and the chat command does not exist until the tool's own init has run — so the only exits were `--no-sdd` and `sdd_auto: false`, both of which turn the gate off to fix the reason it fired. An adapter therefore carries the scaffold artifact whose absence means "not installed here" and the vendor's own init command verbatim, verified by running it and never derived from the name (MV-59's rule). The lifecycle runs it when the scaffold is missing, prints it first, and skips when the artifact is there; `verify`, `doctor` and `doors` never do, because that command reaches the network and MV-01 binds them. | open | proposed | 2026-08-16 | [changes/the-sdd-arrives-with-its-own-scaffold.md](changes/the-sdd-arrives-with-its-own-scaffold.md) |
<!-- @anchor MV-75 brain:src/adapters/registry.ts /scaffold\?: SddScaffold/ unique -->
<!-- @anchor MV-75 brain:src/adapters/registry.ts /specify init --here --integration claude/ unique -->
<!-- @anchor MV-75 brain:src/adapters/sdd.ts /the scaffold is what makes the steps runnable/ -->
<!-- @anchor MV-75 brain:src/commands/{verify,doctor,doors}.ts /runScaffold|scaffoldSdd/ absent -->
<!-- @anchor MV-75 brain:test/change/sdd-gates.test.ts /a declared SDD that is not installed scaffolds itself/ -->
| MV-76 | **A project-level document is gated on existing, never on its content.** MV-57 made the whole document a report on the grounds that a constitution cannot be machine-judged — true of whether the principles are any good, false of whether the file is there at all. `doctor` already tells absent from still-the-unfilled-template from STALE, so the machinery exists and nothing acted on it: a door printing CREATE IT IF ABSENT in capitals, and four lifecycle commands running green without it. `change plan` refuses while a declared `projectStep`'s artifact is absent or still byte-identical to the template the tool ships — the same whole-file equality MV-65 uses, for the same reason. Staleness stays a report: the law moving is not proof the principles must. Amends MV-57. | open | proposed | 2026-08-16 | [changes/the-project-document-is-gated-on-existing.md](changes/the-project-document-is-gated-on-existing.md) |
<!-- @anchor MV-76 brain:src/adapters/sdd.ts /gated on existing, never on its content/ -->
<!-- @anchor MV-76 brain:src/commands/change.ts /gateProjectLaw/ -->
<!-- @anchor MV-76 brain:test/change/sdd-gates.test.ts /plan refuses while the project document is absent or still the template/ -->
<!-- @anchor MV-76 brain:test/change/sdd-gates.test.ts /a stale project document still reports, never gates/ -->
| MV-77 | **The version the site advertises is the version the package declares.** MV-68 pins the tag to the manifest; the site was the third corner and nothing held it, so the home badge said v0.1.0 while npm was already serving 0.1.1 — this repo stating a published fact wrongly, on its first release. No anchor can catch it: a stale badge is perfectly well-formed, and a leg pinned to the literal current version would need editing by the same hand that forgot the badge. The comparison is therefore a test, in the shape MV-02, MV-22 and MV-72 already use; the legs below prove only that the test still says what it was written to say and that the badge still has the shape the test parses. | open | proposed | 2026-08-16 | [changes/the-site-quotes-the-version-the-package-declares.md](changes/the-site-quotes-the-version-the-package-declares.md) |
<!-- @anchor MV-77 brain:test/invariants/site-version.test.ts /is the version the package declares/ -->
<!-- @anchor MV-77 brain:site/content/_index.md /<span>v[0-9]+\.[0-9]+\.[0-9]+ · npx multivac init<\/span>/ unique -->
<!-- @anchor MV-77 brain:package.json /"version": "[0-9]+\.[0-9]+\.[0-9]+"/ unique -->

