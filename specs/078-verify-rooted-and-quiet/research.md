# Research: A run reads the checkout that holds where it was asked, and says one line when nothing is off

Measured 2026-09-29 on main at `62d4588`, in scratch with `HOME` and `GIT_CONFIG_GLOBAL`
isolated and telemetry off. Two investigations (`rooted`, `quiet`), each checked by three
adversarial lenses (guarantee kept, every adapter and harness, the saving is real), merged into
one design, prototyped twice, and read by a completeness critic whose 7 gaps the spec folds in
(checklists/requirements.md maps each). Who measured a figure is marked: **(s1)** the first
synthesis prototype, **(s2)** the second, which is s1 plus the design's fixes, **(critic)** the
completeness critic on s2, **(ver)** a verifier, **(inv)** an investigator, **(plan)**
re-measured for this plan. Tokens are bytes/4.

The scratch behind each mark, for whoever re-runs it (`<sp>` is the session scratchpad):

- s1: `<sp>/c78/synth8`, `proto.diff`. s2: `<sp>/c78/synth8b` (`$S`): `proto.diff` (14 files,
  +600/−156), the tree `$S/full`, `$S/r.sh <label> <dir> OLD|PROTO|NEW <args>` (exit code,
  bytes and output, ANSI stripped; OLD is main's `dist/cli.js`, PROTO s1, NEW s2),
  `$S/mkeco.sh <dir> [extra-config]` (a code-less brain, `acme-api`, `acme-web`, bare remotes),
  `$S/env.sh`, `$S/rt.mjs` (resolution latency), `$S/row151.txt`, `$S/notes.txt`.
- critic: `<sp>/c78/critic/v8` (`$SCR`): the tree `$SCR/tree` with s2 applied,
  `mkeco-same.sh` (keys equal to basenames), `hist.sh` (the per-commit replay), `sym.mjs`
  (symlinked cwd), `edits2.mjs` (transcript edits), `suite-quietenv.out`, `suite-cpd.out`.
- The verifiers' and investigators' scratch: `<sp>/c78/{rooted,quiet,verify-rooted-*,verify-quiet-*}`.

`verify --check` is read-only; readings of this brain itself used it. The post-edit gate,
which writes nothing but runs `verify` without `--check`, ran only on a `git clone --shared` of
this brain. During the synthesis `/` reached 0 MB free because `/tmp` held 45,215
`/tmp/mvac-*` directories test runs left behind; removing those older than two hours freed
19 GB. That is out of scope (R18).

## R0. Base, composition, and the design's ids

**Base.** The design's lines are on `62d4588`; this change lands after graph-answers-where-asked
(#5, MV-148), codegraph-worktrees-and-verbs (#6, MV-149) and change-file-cites (#7, MV-150).
plan.md lists what each edits in the files this change touches; T001 re-anchors every line and
re-measures every byte figure of this brain's own output and every hook byte count on the tree
with the three merged.

**Composition, change by change.**

- **#3 (MV-146, merged).** Its `count=3` leg on `sddDeclaration: 'report'` over
  `{verify,count}.ts` still counts 3: verify.ts 2, count.ts 1 **(s1)**. Its test of a refused
  config inside a mount (`code-in-change.test.ts:473`, exit 2) passes, because a mount stays
  brain-scoped. `mountedRefusalLine` gets `quiet: null`.
- **#4 (MV-147, merged).** No overlap.
- **#5 (MV-148).** This change does not touch `src/doors/settings.ts`, `refreshHookCmd` or
  `.claude/settings.json`. #5's follow guard is the only change on that line, MV-140's `unique`
  leg keeps one match, and #5's pinned refresh commands (492/558/540/606 B) keep their bytes.
  #5's refresh hook reads `file_path` from the same payload with `sed`; each hook process gets
  its own copy of stdin. #5's guard never refreshes a checkout of a code-less brain; this
  change's follow judges the brain checkout that governs an edit. They are inverse on purpose.
- **#6 (MV-149).** #6 edits settings.ts's refresh hooks, `ownsRefresh`, `installHookConfig`'s
  signature and codegraph's registry entry. This change adds a `HookPayload` type and one
  `payload:` field on the claude target's `hookConfig` (registry.ts:43, :535 on 62d4588).
  `installHookConfig` reads `hookConfig.path` and `hookConfig.postEdit` only, so the field is
  never serialised; #6's `hookRefreshes` reads `postEdit` only. Neither change touches gate
  identity (MV-112).
- **#7 (MV-150).** `openChangeClaims` gains #7's `changes` and this change's `unparsed`; #7's
  finished-line variant is emitted with `quiet: null` (rebased on #7's print site, as #7's §5
  step 4 asks); an unparsable open change file and an anchor on no row count as off, as #7
  asked; MV-150's consumer-floor ceiling is amended if #7 lands with it (R17); the change file
  declares `claims: [MV-151]` in ID form.
- **#9 (skill-cites-references).** This change qualifies SKILL.md:59 and
  references/verify.md:90; #9 must keep the qualifier.

**The design's ids, mapped.**

| Design | Spec | Design | Spec | Design | Spec |
| --- | --- | --- | --- | --- | --- |
| FR-R1–R6 | FR-001–FR-006 | SC-R1–R7 | SC-001–SC-007 | critic 1 | FR-008, SC-012 |
| FR-W1–W4 | FR-007–FR-010 | SC-W1–W4 | SC-008–SC-011 | critic 2 | FR-027, FR-039, SC-042 |
| FR-M1–M3 | FR-011–FR-013 | SC-M1–M3 | SC-013–SC-015 | critic 3 | FR-032, SC-041 |
| FR-U1–U6 | FR-014–FR-019 | SC-U1–U4 | SC-016–SC-019 | critic 4 | SC-027 |
| FR-Q1–Q8 | FR-020–FR-027 | SC-Q1–Q7 | SC-020–SC-026 | critic 5 | FR-039, SC-042 |
| FR-H1–H5 | FR-028–FR-032 | SC-H1–H4 | SC-028–SC-031 | critic 6 | FR-037, SC-040 |
| FR-N1–N3 | FR-033–FR-035 | SC-H5 | SC-033 | critic 7 | FR-028, FR-030, SC-030, SC-032 |
| FR-C1–C2 | FR-036–FR-037 | SC-N1–N2, SC-C1–C4 | SC-034–SC-039 | §2, §3, §7 | FR-038, FR-039, SC-042 |

## R1. The root is resolved before any config is read

What `verify` answers today, and after, by where it is asked:

| Where | Today | After | By |
| --- | --- | --- | --- |
| this brain: `src`, `src/commands`, `.multivac`, `.multivac/hooks`, `test/verify`, `.multivac/worktrees` | exit 2, 90–106 B, `` run `multivac init .` `` | exit 0, the root's 348 B + a 49, 58, 55, 61, 57, 65 B root line | `cd <d> && node $S/p/dist/cli.js verify --check \| wc -c` **(s2)** |
| consumer `acme-api/src`, `acme-api/db/migrations` | exit 2, 176 / 186 B | the root's 452 B + root line, exit 0 | `$S/r.sh` **(s1; s2 adds the root line)** |
| `mount: docs/brain`: root, `src`, `docs` | `NOT verified` 313 B; exit 2 178 B; exit 1 883 B scoped to the wrong directory | `scoped to repo "api"`, 458 B (+ root line below the root), exit 0 | **(s2)** |
| a door, no mount: `acme-web/src` | exit 2, 181 B | MV-127's warning naming `acme-web`, exit 0 | **(s1)** |
| a stale pin: `acme-web`, `acme-web/src` | 185 B; `src` gets the init hint (179 B) | 185 B, identical; `src` the same + ` Run it in <acme-web>.`, exit 2 | **(s2)** |
| monorepo `mono/services/api` (own `.brain`), and its `src` | exit 1, 611 B; `src` exit 2, 184 B | identical at `services/api`; `src` the same + root line, exit 1 | **(s2)**; s1 exited 2 at both (429 B, 278 B) |
| a brain fixture at `acme-api/test/fixtures/brainx`: `test/fixtures`, `test/fixtures/other` | exit 2, 238 B ("matches no repo declared"), 195 B | scoped to `api`, exit 0 | **(s2)** |

**Decision**: `resolveRoot(start)` (data-model.md) runs first and returns a `Root`. The brain is
the first directory holding `.multivac/config.yml` from `realpath(start)` up to and including
the toplevel (FR-003); otherwise, in order, MV-138's path at the toplevel; the nearest
directory below the toplevel whose child brain names it by its own `mount:` (`namedMount`); the
toplevel's mount by `findMount`'s rule, else `declaredMount(top)` — the one `.gitmodules` path
below the first level whose brain names it; the start's own child brain, unnamed; MV-49's stale
pin at the start, then at the toplevel; MV-127's door at the toplevel; else R7's answers
(FR-004). A mount-found consumer sets `lagging` (FR-005).

**Rationale**: every row the resolver serves keeps its meaning and gains every directory of
its checkout. MV-09's mount, MV-49's pin, MV-127's door and MV-138's path are asked of the
toplevel, never of a subdirectory, where they are not.

**Alternatives considered**:
- **s1's top-only mount lookup** turned the monorepo subproject's correct verdict into exit 2
  ("inside … which no brain governs", 429 B) **(s2, PROTO column)**; replaced by the
  nearest-first named walk.
- **An unrestricted `findMount` at every level** takes `test/fixtures/brainx`, or `docs/` above
  `mount: docs/brain`, for the consumer's brain and scope directory. Below the toplevel a
  mount must be named by its own `mount:`; the start's unnamed child brain is the last resort.
- **Answering a mount as its host consumer** — R6.

**Latency**: 3.4–7.2 ms per resolution (`node $S/rt.mjs <7 locations>`, 10 runs each,
**(s2)**), against about 1.1–1.3 s per `verify`.

## R2. The toplevel is asked without the ambient pointers, and refusals are quoted

With `GIT_DIR` pointing at another repository, plain `git rev-parse --show-toplevel` answers
from that repository's view of the cwd; through `cleanEnv()` `verify` from `mv/src` gives this
brain's run **(s1)**. A consumer git refuses for dubious ownership read, today, as "no
repository": the root exited 1 and `src` got the init hint **(s1)**.

**Decision**: `toplevel(dir)` in git.ts runs `git -C dir rev-parse --show-toplevel` with
`cleanEnv()` and returns null only when git's `fatal:` line says `not a git repository` or
`must be run in a work tree`; any other failure throws `ToplevelError` quoting `gitFailure`,
which `resolveRoot` turns into a `ConfigError` — exit 2 (FR-002, FR-018; MV-118). `superproject(top)`
runs `--show-superproject-working-tree` the same way. Dubious ownership: exit 2, 314 B at the
root and 318 B at `src`, naming `fatal: detected dubious ownership` **(s1)**.

**Alternatives considered**: reading every git failure as "no repository" — today's behaviour,
which answered an ownership refusal with init advice.

## R3. A report read away from its root names the root

A report printed from `src/` carries root-relative commands — MV-81's `git restore --staged
src/cli.ts`, MV-49's `git submodule update --remote .brain` — that fail from where it was
asked (ver rooted-guarantee).

**Decision**: when the root (a brain, or a consumer's scope directory) is not the directory
asked, compared by `samePath`, a report printed in full carries `  root      <root> (asked from
<start>)` after its header lines; `<start>` is relative to the root when inside it, absolute
otherwise (FR-006). The quiet line carries none: it holds no path and no command. MV-49's text
from below its host gains ` Run it in <host>.` (FR-004 step 5).

**Alternatives considered**: strict byte identity with the root's report (s1's promise) — the
commands in it would fail from the subdirectory.

## R4. A brain change worktree is a brain from every directory in it

From `<wt>/src`, `--strict` exited 0 over a blocking row committed on the worktree's branch,
printing `scoped to repo "brain"` and a false "not in this checkout's index" **(s1)**: today
`worktreeBrain(startDir)` is asked whenever the start holds no config, and a worktree's
subdirectory holds none. With sibling repos, the worktree's root exited 1 (961 B) naming both
"not on disk" and advising `repos sync`, and `doctor` advised `git clone … ../acme-api`, both of
which clone into `.multivac/worktrees/` (ver rooted-cross-adapter, blocking).

**Decision**: the worktree holds a config, so FR-003 finds it from every directory in it and
`worktreeBrain` is never consulted for it (FR-007). Siblings are read per R5. A sibling missing
both ways says `` run `multivac repos sync` in <main checkout> `` on its read line and, through
`EvaluateOptions.missing`, in its legs (FR-009); `doctor`'s five sites resolve the same way and
its missing advice gains ` in <main checkout>` (FR-010).

| Case | Today | After | By |
| --- | --- | --- | --- |
| MV-999 committed on the branch, `--check --strict` from `<wt>/src` | exit 0, `scoped to repo "brain"` | exit 1, `broken MV-999 … · blocking` | **(s1)** |
| code-less brain, `api`/`web`, `channel: origin/main`, the worktree | exit 1, 961 B, `repos sync` | exit 0, 812 B, both at `origin/main` with fetch age | `$S/r.sh wt <wt> OLD\|NEW verify --check` **(s2)** |
| the slug directory | exit 2, 239 B | the main brain's report + root line, exit 0 | **(s1)**; this brain's `.multivac/worktrees`: 348 + 65 B **(s2)** |
| `doctor` in the worktree | `0/2 cloned · api missing → … (git clone …/acme-api.git ../acme-api)`, 1,316 B | `repos      2/2 cloned`, 1,188 B | `$S/r.sh doc-wt <wt> OLD\|NEW doctor` **(s2)** |
| `doctor` from `<wt>/notes` | exit 1, "config invalid", 237 B | exit 0, root line | **(s2)** |

## R5. A brain change worktree reads the change's own siblings first

**Critic gap 1.** s2's `siblingBase(brainDir)` resolved every sibling against the main
checkout. configuration.md:557 defaults a repo's `path` to `../<key>`, and `worktreePath`
(change.ts:512) is `<brain>/.multivac/worktrees/<slug>/<key>`, so from a brain change worktree
`../api` today names **that change's own `api` worktree**. With keys equal to basenames
(`$SCR/mkeco-same.sh`), a brain worktree plus an `api` worktree on `demo`, and `FLUXCAP`
appended to the api worktree's README under an active blocking `absent` leg:

| Run from `<wt>/brain` | Today | s2 |
| --- | --- | --- |
| `verify --check --worktree` | exit 1, `api: working tree on demo`, `broken INV-3 … api:README.md:2 · blocking` | exit 0, `api: working tree on main` — the violation unseen |
| `doctor` branches | `api: on demo` | `api: on main` |

`stalenessLines` would likewise read main's pin rather than one the change bumped (not
measured). s2's own fixture used keys that differ from basenames (`api` → `../acme-api`), which
hid the layout.

**Decision**: `siblingDir(brainDir, key, path)` — for a brain read at a change worktree
(`worktreeBrain(brainDir)` non-null), the change's own worktree for `key`,
`<main>/.multivac/worktrees/<slug>/<key>`, when it exists; else `resolve(<main>, path)`; for any
other brain, `resolve(brainDir, path)` as today. `resolveSources`, `stalenessLines` and
`doctor`'s five sites call it for every entry that is not `isBrain` (FR-008, FR-010).
`siblingBase` stays, for the wording of a missing sibling (` in <main checkout>`).

**Rationale**: in the default layout this is the directory `../<key>` already names, so the
measured case keeps today's answer; asking by key also covers a layout whose paths do not end
in the key, where `resolve(brainDir, path)` would miss the change's worktree and read main's.
This goes one step beyond the critic's wording ("`resolve(brainDir, e.path)` when that directory
exists"), which is the same directory in the default layout and a stale clone's in no layout.

**Alternatives considered**: the critic's path-first rule — misses the change's worktree
whenever the path's last segment is not the key, and reads any directory that happens to exist
at `.multivac/worktrees/<slug>/<basename>` (a clone an earlier `repos sync` left there); s2's
main-only rule — the false green above.

## R6. A mount is judged as the brain checkout it is

The investigator answered a mount (`acme-api/.brain`) as its host consumer. A commit in a mount
goes to the brain's repository, and the consumer answer drops MV-107, MV-81, MV-137, MV-146,
MV-80 and every brain claim for it: the verifier's scratch landed a real `drop MV-20` commit
through a mount (ver rooted-guarantee, blocking). Typed inside a mount, `repos sync` clones the
ecosystem into the consumer (inv rooted).

**Decision**: a brain found by FR-003 is judged brain-scoped wherever it sits (FR-011). Only
the missing-sibling wording changes: `mountHost(brainDir, cfg)`, asked lazily and only when a
sibling is missing, returns the host when the brain is its own toplevel and the host's toplevel
resolves `cfg.mount` to it (`samePath`); the read line then names the host once and the legs
say `repo not on disk beside this mount — verify from a brain checkout` (FR-012). Exit codes are
today's (FR-013).

| Case | After | By |
| --- | --- | --- |
| staged deletion of active INV-2, from `.brain` / `.brain/.multivac` | `law REFUSED INV-2 was law and is gone · blocking`, exit 1, 1,555 B / 1,706 B (with root line) | **(s2)**; brain==code mount with MV-20 **(s1)** |
| siblings missing inside `acme-api/.brain` | no `repos sync`, exit 1 as today, 1,285 B at a 120-character host path (today 961 B) | **(s2)** |

**Alternatives considered**: the consumer answer (dropped, blocking); detecting a mount by a
string on its path (moot for verdicts, since a mount is a brain; the wording test is
`samePath(resolve(host, cfg.mount), brain)`); refusing `doors` inside a mount — `doors` there
arms the mount's own brain gate, today's useful behaviour.

## R7. Ungoverned lookups, and the refusal that names the enclosing brain

Below a toplevel no brain governs — a dotfiles `$HOME` whose ignored `work/` holds the
ecosystem — `init <top>` would scaffold a brain into `$HOME` (ver rooted-cross-adapter); today
the run prints "matches no repo declared …" (228 B) **(s1)**. From a brain's `src/`, `change
new`, `repos sync` and `doors` all advised `init .` (ver rooted-guarantee).

**Decision**: outside a work tree nothing is walked — a child brain is named, else today's text
(FR-014); at an ungoverned toplevel today's text, byte-identical, which `consumer.test.ts:175`
asserts (FR-015); below it `is inside <top>, which no brain governs — nothing was verified`
(FR-016) — a start holding a child brain having been answered first, by FR-004's last-resort
step, as that brain's consumer; in a submodule of a governed superproject, the superproject is named, or MV-49's text
with ` Run it in <superproject>.` when its stale pin is this submodule (FR-017).
`readConfig`'s no-config refusal, shared by every command, calls `enclosingBrain(dir)`: a walk
up without git that stops at the first directory holding `.git` (file or directory) and returns
null at once when `dir` holds one; with a brain found it prints `no .multivac/config.yml in
<dir> — it is inside the brain at <brain>; run this there` (FR-019).

| Case | Today | After | By |
| --- | --- | --- | --- |
| `dot/work/notes` in a dotfiles repo whose ignored `work/` holds the ecosystem | exit 2, `` run `multivac init .` `` | exit 2, `…/dot/work/notes is inside …/dot, which no brain governs — nothing was verified` (276 B at the scratch path) | **(plan)**, s2's build |
| `dot/work` itself, holding `acme-brain` | exit 2, `this checkout matches no repo declared in the brain at …/acme-brain — run …` (228 B in the design's scratch, 234 B in the plan's) | the same, unchanged | **(plan)**, s2's build; s1 printed `… is inside …/dot …; the brain at …/acme-brain verifies from there` |
| inside a stale-pin mount | `init .` | exit 2, MV-49's text + ` Run it in <host>.`, 308 B | **(s1)**; reproduced **(plan)** with s2's build (its `.multivac` moved aside) |
| `change new zz`, `repos sync` from `src/` of a fresh brain | exit 2, `` run `multivac init .` `` — 90 B at `/home/user/multivac/src`; 168 B in scratch | exit 2 naming the brain — 117 B at `/home/user/multivac/src`; 273 B in scratch | `printf … \| wc -c`; **(s2)** |

**A consistency fix (plan).** The design's FR-U3 adds `; the brain at <child> verifies from there`
when the start holds a child brain, and its SC-U1 quotes that clause at `dot/work` — measured on
s1. s2 then added FR-R4's last-resort step, "`findMount(start)` unnamed … what that directory
answered before", which runs first and takes any such start as the child brain's consumer, so
the clause can no longer be reached below a toplevel: s2's build answers `dot/work` with today's
"matches no repo declared … `verify --repo <key>`" and `dot/work/notes` with the bare "is inside"
line (both measured here, `$HOME` isolated). The spec keeps s2's order — it regresses no
directory's answer, and neither line advises `init` — and drops the unreachable clause below a
toplevel (FR-016, SC-016); outside a work tree the clause stays (FR-014), where it is reached.

**Alternatives considered**: `init <top>` as advice below an ungoverned toplevel — scaffolds
into `$HOME`; rooting `change`, `repos`, `seed` and `init` here — each writes files and needs
its own decision about the root of a lifecycle step (follow-ups; below a brain they now name the
brain, which removes the destructive detour).

## R8. The harness payload: the follow, the session's directory, never the command string

What the gate did (ver quiet, inv quiet): 74 of 75 worktree edits verified the main checkout; an
MV-01 violation written into a worktree passed. 76 of 156 edits were in a worktree while the
session sat at the root; subdirectory session cwds: **0** in 138 scanned transcripts (ver
rooted-measurement). From Claude Code 2.1.283's binary: hook processes receive
`CLAUDE_PROJECT_DIR`; payloads carry `hook_event_name:"PostToolUse",tool_name,tool_input` and
`hook_event_name:"SessionStart",source`, and `session_id…,transcript_path…,cwd:`; the harness
quotes the command into every red delivery (`hook_blocking_error … from command:
"${e.blockingError.command}"`); hooks for forwarded commands "start in your home directory with
a reduced environment: a guard that inspects the project must use $CLAUDE_PROJECT_DIR or the cwd
field on stdin" (critic); this session's Bash tool environment has no `CLAUDE_PROJECT_DIR`.

**Decision**:
- `DoorTarget.hookConfig.payload?: HookPayload` — `{ env, event, session, edit, file, cwd }`;
  the claude target declares `{ env: 'CLAUDE_PROJECT_DIR', event: 'hook_event_name', session:
  'SessionStart', edit: 'PostToolUse', file: 'tool_input.file_path', cwd: 'cwd' }` under a
  comment citing the 2.1.283 facts above (FR-028).
- `hookAsk(ctx)` reads `ctx.stdin()` only with no `[dir]`, a declared `env` set in `ctx.env`,
  and a reader passed; `readStdin` returns null on a TTY and after 2 s on an unclosed pipe; the
  session event makes the run quiet, the edit event with a non-empty file makes it follow,
  anything else is ignored (FR-029).
- **The session's directory (critic gap 7a)**: under a payload, `payload.cwd` when it names an
  existing directory, else `env[payload.env]` when it names one, else `ctx.cwd`; the run starts
  there (`hook.dir ?? ctx.cwd`) (FR-030).
- **The follow**: `resolveRoot(dirname(resolve(sessionDir, file)))`, taken when `followable` —
  a consumer (mount or worktree), a door, or a brain that is its own git toplevel; otherwise the
  session's root. **Critic gap 7b**: a committed fixture brain below its repository's toplevel
  is never followed into, so a deliberately red fixture is not delivered after each edit to it
  (none of 52 scratch-path edits in 145 transcripts hit a brain here, `$SCR/edits2.mjs`). A throw
  while following (stale pin, dubious ownership) is exit 2, and the harness delivers it.
- `SESSION_GATE`, `EDIT_GATE`, `ownsVerify` and `.claude/settings.json` keep their bytes;
  settings.ts is not edited (FR-031).
- `CommandContext` gains `env?` and `stdin?`; the dispatcher passes `process.env` and
  `readStdin`; an in-process caller passes its own (FR-032).

| Case | Today | After | By |
| --- | --- | --- | --- |
| session at main, `const x = 'fetch';` appended to `<wt>/src/commands/doctor.ts`, the exact `mvac verify >&2 \|\| exit 2` with payload + `CLAUDE_PROJECT_DIR` | exit 0, main verified, 0 B | exit 2, the 508 B report naming `broken MV-01 [absent] … doctor.ts:964 · blocking` + the root line (96 B at `/home/user/multivac`, slug `demo`; 254 B at the scratch path; 762 B in all); the quoted command stays 25 B | **(s2)**; without the variable: exit 0 |
| session in `mv/src`, editing `mv/src/cli.ts` | exit 2, 169 B of init advice delivered (90 B at the real path) | exit 0, 0 B | **(s2)** |
| edit under `/nowhere`, in an ungoverned nested repo, or in a repo holding only `.multivac/cache` and `graphify-out/graph.json` | the session root, exit 0, 298 B, not delivered | the same | **(s2, s1)** |
| code-less brain session editing its own worktree's law; an edit in `demo/api` | — | exit 0 reading siblings at the channel `on demo`; the scoped run `(the change worktree for demo)` | **(s1)** |
| 0.14.1's `doors` over an s1-projected brain; then the new `doors` | — | `.claude/settings.json` byte-identical, one SessionStart and one PostToolUse gate (`cmp`) | **(s1)** |

**Alternatives considered** (all dropped, measured):
- **A cd-form `EDIT_GATE`** (234 B of shell): the binary quotes it into every red delivery
  (+209 B each); an older `doors` does not own a changed string and appends a second gate
  (measured on `SESSION_GATE`: 550 B instead of 275 B, ver quiet-cross-adapter); its `[ -d
  "$t/.multivac" ]` test follows into any repo where MV-140's refresh hook created
  `.multivac/cache` and feeds it `init .` advice after every edit (ver rooted-guarantee,
  rooted-measurement); a second copy of the fragment breaks MV-140's `unique` leg, which #5
  also rewrites.
- **A `MULTIVAC_QUIET=1` prefix on `SESSION_GATE`**: the same skew duplicates it (blocking).
- **A `--edited` or `--quiet` flag in a projected command**: every binary up to 0.14.1 exits 2
  on an unknown flag (`mvac verify --quiet` → `unknown flag "--quiet"`), delivered after every
  edit, and in a shim it locks commits, which MV-86 forbids.
- **Following into any directory holding `.multivac/`**: `.multivac/cache` is not a brain; the
  follow keys on the resolver's kind.
- **`CLAUDE_PROJECT_DIR` alone as the session's directory**: under a forwarded hook it is the
  documented guard, but the payload's `cwd` is where the session actually is; the variable is
  the second choice.

## R9. Quiet: what folds, what prints beneath, what prints whole

**Decision** (FR-020–FR-025):
- **A required decision per line.** `Diagnostic.quiet: string | null` and `CodeLine.quiet:
  string | null` are required: `''` adds nothing, text is a clause, null is off.
  `RepoSource.clause: string | null` is required: a clause, or null for a read that is not
  plain. Every report line in `runVerify` goes through `emit(text, quiet)`; three direct `say(`
  remain in verify.ts, pinned by a `count=3` leg (today 22) (FR-021).
- **Folded reads** (FR-022): a plain brain or brain==code read `<key> <branch> @ <sha>
  (working tree)` / `<key> detached @ <sha> (working tree)` — a commit, no drift or merge
  suffix; a plain sibling `<key> <channel> @ <sha> (last fetch <age> ago)`; a consumer `<key>
  <branch> @ <sha> (working tree)`. Every other read prints its full line under the one line.
- **Beneath the line**: each read that is not plain, and each `stale` pin line that does not
  gate.
- **Whole report** (FR-023, FR-024): any line whose quiet is null, any warning, a non-zero exit
  or blocking count, an unparsable open change file (`OpenChanges.unparsed`, pushed in
  `openChangeClaims`' catch), an anchor whose ID names no row.
- **The line** leads with the summary (FR-025), so `/^(\d+) blocking broken · exit/m` still
  finds it at a line start.

| Case | Full | Quiet | By |
| --- | --- | --- | --- |
| this brain, root or `src`, `--quiet` / `MULTIVAC_QUIET=1` / session payload | 348 B | one line, 195 B: `0 blocking broken · exit 0 · 148 claims · 147 anchored (99%) · unanchored: MV-148 · read brain claude/amazing-franklin-mjvzu0 @ 62d4588 (working tree) · enact not answered (nothing staged)` | **(s2; critic reproduced 195 B root, 397 B `src` without quiet)** |
| code commit on an open change's branch | 406 B | 219 B, `… · enact none (law untouched) · code → graph-answers-where-asked` | **(s1)** |
| fresh brain, through the real shim: root commit / law commit / code-only / a weakened row / 0.14.1 under the new shim | 370 / 364 / 375 / 363 / 375 B | full / full / 188 B / full / full, exit 0 | **(s1)** |
| code-less brain, 42 repos, two parked | 4,121 B | 2,303 B, 3 lines | **(s1)** |
| two pins one commit behind `origin/main` | 714 B | 476 B: a 238 B line + two `stale … pin 1 behind` lines (s1 printed 714 B) | `$S/r.sh stale[-q] …` **(s2)** |
| broken frontmatter in an open change; an anchor `AC-99` naming no row | full | full | **(s1)** |
| `--quiet --repo x` in a brain | 472 B | warning + full, `cmp`-identical | **(s2)** |
| unknown frontmatter key in a planned change (warns before and during the report) | 654 B under `2>&1` | `cmp`-identical under `2>&1` | **(s2)** |

**Alternatives considered**:
- **All-or-nothing reads**: one parked sibling left the saving at 0 B in a 42-repo brain.
- **Stale pins forcing the whole report**: a brain with a `channel:` and mounted consumers
  carries non-gating `stale` lines after every law push until every consumer bumps (ver
  quiet-cross-adapter).
- **Folding "config … is new here"**: the only trace that MV-97's "creating one is free" was
  used, so it prints in full (ver quiet-guarantee).
- **Folding "no row reached active" as "no row enacted"**: a commit weakening an active row
  would read as a code-only commit.
- **The summary at the end of the line**: breaks line-start parsers (ver quiet-guarantee).
- **Dropping the passing code line**: kept as `code → <slug>` (ver quiet-measurement).
- **Quiet by default for an explicit `verify`**: would save 6.8–10.7 KB in this tree and give up
  "Read the `read` lines before you read the verdicts" on green runs; not planned.

## R10. Both streams, held in order

`console.error` cannot tell whether the run warned: callees warn. **Decision** (FR-026):
`out.ts` gains `tapOutput(t)` and a warning counter (`warnings()`); `say` and `warn` go through
the tap when one is set, and every `warn` counts. A quiet run records `warnedBefore` at its
start, installs the tap, holds both streams in order, and on any off line or new warning
removes the tap and replays them — the quiet run equals the non-quiet run under `2>&1` byte for
byte (654 B, **(s2)**). A throw replays what was held and rethrows; a `finally` always removes
the tap; a run without quiet holds nothing. Leg: `warnings\(\) !== warnedBefore` unique.

**Alternatives considered**: buffering only the report's own lines — callee warnings print out
of order before the report; checking "no warn()" on `console.error` — cannot be checked.

## R11. The switches: a flag, a variable the shims export, the payload

**Decision** (FR-020, FR-027): `--quiet` in `ARGS` and `TAKES`; `ctx.env.MULTIVAC_QUIET ===
'1'`; the session payload. Nothing else. `shim()` writes, after the chain block and before the
runners:

```sh
# One line when nothing is off; the full report otherwise. An env var, not a
# flag: a binary that predates it ignores it and prints in full.
export MULTIVAC_QUIET=1
```

**Critic gap 2.** s2's comment read "…the full report otherwise (MV-151). An env …".
hooks.md:69-103 reproduces `shim()` byte for byte and would copy it, and MV-126's `absent` leg
`brain:site/content/** /mv-[0-9]+/i` is blocking: after the insertion, `mvac count
'brain:site/content/** /mv-[0-9]+/i'` gave 1 match where the original gives 0 **(critic)**. No
string the shim emits carries a row ID today (grep over `shim()`'s strings: 0), and the shim is
written into every repo of every ecosystem, where MV-151 means nothing. The emitted comment
names no ID; `install.ts`'s own source comment may cite MV-151. An `absent` leg pins it on the
three shims (0 today, 0 after, **(plan)**). The comment holds neither `graph` nor `refresh`
(MV-52's blocking `absent` leg on install.ts, which matches inside words such as "paragraph";
`git grep -c -E 'graph|refresh' src/hooks/install.ts` → 0 today **(plan)**), no version string
and no second `--git-common-dir` (MV-115's `count=3`).

**Alternatives considered**: `MULTIVAC_QUIET=1` in `SESSION_GATE` (R8); a flag in the shim —
locks commits under an older binary; quieting only agent commits by reading `CLAUDECODE` — not
proposed (spec Assumptions). `MANUAL_CHAIN_LINE` (`mvac verify || exit 1`, hooks.md:214, :221)
keeps the full report: it is documented output.

## R12. The version notice reads the root's brain

change-file-cites handed this over: `versionNotice` reads only `<cwd>/.multivac/config.yml`
(cli.ts:43-44), so a mounted brain's `requires:` never reaches a consumer's run — a consumer
with `requires: ">=0.15.0"` in its mount printed 0 version lines and exited 1 (ver
claims-cite-cross-adapter, E1), recorded as MV-150's ceiling, "#8 … which resolves the root the
notice must read. If #8 declines, a follow-up change". From a subdirectory the floor line the
root prints went missing too (ver rooted-guarantee).

**Decision**: taken here (FR-033–FR-035). `Command.rooted?: true` on verify, count, doctor,
doors and roadmap; for them the dispatcher looks the command up first, reads the config of
`resolveRoot(cwd)`'s brain (brain or consumer) inside the existing guard, and falls back to
`cwd` on any throw; in a consumer only a `red` notice prints. The line `if (n) warn(paint(n))`
stays the one print site (MV-86's leg). Under a hook the notice reads the root of the process's
own directory (a ceiling: a forwarded hook starting in `$HOME` prints no notice).

**Rationale**: this change builds the one resolver the notice needs; the cost is a dozen lines
in the dispatcher, and declining would keep a ceiling of MV-150 that the resolver closes. The
record's `doors --adopt` advice is aimed at the brain checkout, so a consumer hears the floor
only.

| Case | Today | After | By |
| --- | --- | --- | --- |
| `requires: ">=99.0.0"`: `acme-brain`, `acme-brain/.multivac`, `acme-api`, `acme-api/src`, `mv/src` | one line at `acme-brain` only | one floor line in each | **(s1)** |
| a mount with no version record and no floor: `acme-api/src` / `acme-brain` / `acme-api/.brain` | — | nothing / yellow / yellow | **(s2)** |

## R13. `count`, `doctor`, `doors` and `roadmap`

From `src/`, `count` exits 2, `doctor` says "config invalid" (exit 1, a false diagnosis) and
`roadmap` lists "empty" although a planned change exists **(s2)**.

**Decision** (FR-036, FR-037): `count` resolves through `resolveRoot`; none and door print and
exit 2; `loadConfig`'s SDD mode is keyed on kind; in a consumer the own key is read by
`consumerSource`, the sentence `verify` prints. `doctor`, `doors` and `roadmap` call
`rootedBrain(ctx.cwd)` (the brain half) and print their root line when `!samePath(brain,
ctx.cwd)`.

**Critic gap 6.** s2's `doctor` compared `brain !== ctx.cwd` and `doors` `brainDir !==
ctx.cwd` as strings, while `rootedBrain` returns a real path; in-process with a symlinked cwd
(`$SCR/sym.mjs`) `doctor` at the brain root printed `root … (asked from …)` and `roadmap` and
`verify` did not — every in-process test on macOS, where `/var` resolves to `/private/var`
(CI is ubuntu-only). All three use `samePath`; a `count=3` leg pins the spelling.

| Case | Today | After | By |
| --- | --- | --- | --- |
| `count 'brain:src/**/*.ts /export async function resolveSources/'` from `mv/src`, `<wt>/src` | exit 2 | exit 0, the `read` line and `verify.ts 1` | **(s1)** |
| `count 'api:db/**/*.sql /accounts/'` from `acme-api`, its worktree's `src` | `repo "api" is declared but not on disk` (69 B), or exit 2 | exit 0, `api: working tree … — this checkout` | **(s1)** |
| `doctor` from `b/src` | exit 1, `config invalid` (191 B) | exit 0, root line | **(s2)** |
| `roadmap` from `b/src`, one planned change | `roadmap: empty …` (110 B) | root line, `roadmap: 1 planned` | **(s2)** |

## R14. Tests read no switch from the developer's shell

**Critic gap 3.** `MULTIVAC_QUIET=1 node --test "dist-test/test/**/*.test.js"` on s2: 852 tests,
848 pass, **1 fail** (`$SCR/suite-quietenv.out`): `code-in-change.test.ts:246`, "a real git merge
runs pre-merge-commit…", whose hand-written hook `exec node cli.js verify` inherits the ambient
environment, printed the one line ending `code → feat`, and `/lands in open change feat/`
failed. `CLAUDE_PROJECT_DIR=/x` alone stayed green (849 pass, `$SCR/suite-cpd.out`). The
design's "61 of 61" covered three files only.

**Decision** (FR-032): `test/helpers/fixture.ts` exports `scrubbedEnv(extra?)` — `process.env`
without `MULTIVAC_QUIET` and `CLAUDE_PROJECT_DIR`, merged with `extra` — and every test that
spawns the built CLI, directly or through a git hook it writes, spawns with it. On 62d4588 those
are (**(plan)**, `git grep -n -E "process\.execPath|exec node" -- test`):
test/init/equip.test.ts (the `mvac` wrapper's three hook environments at :137, :201, :226, and
the `spawnSync` at :281), test/verify/code-in-change.test.ts (the merge at :246–:262) and
test/verify/law-death.test.ts (the hooks at :107 and :130 and the commits that run them). The
critic counted 14 files with `git grep -l -E "dist/cli\.js|cli\.js'" -- test`; the other eleven
call `main` in-process, which passes no environment, or write a stand-in `dist/cli.js` that no
test executes as multivac, and need nothing. T001 re-lists them on the merged tree. A test that
commits through a regenerated shim runs quiet by design, since the shim exports the switch; s2's
suite passed that way (852, 849 pass). The suite is run twice at the end, with and without both
switches exported (SC-041). Constitution IV: tests MUST NOT depend on host configuration.

**Alternatives considered**: `unset MULTIVAC_QUIET` in the one failing hook — fixes the measured
case and leaves the next spawned test exposed; scrubbing `process.env` globally in a test
preamble — hides the switches from the in-process tests that set `env` on purpose.

## R15. What it saves, measured

This change is about correctness first: it closes a false green (R4), a false red with a
destructive detour (`init .` from a subdirectory), two more detours (`repos sync` in a worktree
and in a mount), a lost verdict in a monorepo subproject and a false "empty" roadmap. The token
effect is real but modest, stated per event with its command, realized separately from
conditional.

**Rooted.**

| Event | Today | After | Command |
| --- | --- | --- | --- |
| `verify` in a subdirectory, real paths | exit 2, 90–106 B (67 B + path) | exit 0, the root's 348 B + a 49–65 B root line | `cd /home/user/multivac/<d> && node $S/p/dist/cli.js verify --check \| wc -c` **(s2)**, OLD for today |
| post-edit gate in a subdirectory session, green | 90 B delivered per edit (exit 2) | 0 B (exit 0; the harness drops exit-0 output) | the exact gate with the payload on a clone **(s2)**; 169 B at the scratch path |
| SessionStart from a subdirectory | 90 B of init advice | the 195 B quiet line: +105 B against today, parity with a root session (348 B today) | same **(s2)** |
| post-edit gate, a worktree file edited from the main session, red | 0 B, the edit never seen | 508 B report + 96–115 B root line + 25 B command quote | same **(s2)** |
| worktree subdirectory, main's law diverged | up to 10,861 B, false red | the worktree's own run, 323 B at that state | (ver rooted-measurement) |
| `change new` / `repos sync` from `src` | exit 2, `init .`, 90 B | exit 2 naming the brain, 117 B | `printf … \| wc -c`; scratch 168 → 273 B **(s2)** |

Subdirectory session cwds: 0 in 138 transcripts, so the subdirectory rows apply only to such
sessions; the worktree follow is the frequent case, 0 B while green.

**Quiet, model-visible bytes per event.**

| Event | Full | Quiet | Δ | Command |
| --- | --- | --- | --- | --- |
| SessionStart, this brain | 348 B | 195 B | −153 B (≈38 tok) | payload through `mvac verify 2>&1 \|\| true` **(s2)** |
| agent code commit on an open change | 406 B | 219 B | −187 B (≈47 tok) | `MULTIVAC_QUIET=1 … verify --check` **(s1)** |
| code-only commit, fresh brain, real shim | 375 B | 188 B | −187 B | **(s1)** |
| consumer, 25-character brain path | 365 B | 194 B | −171 B | 452 → 281 B at the 112-character scratch path, rebased **(s1)** |
| code-less brain, two siblings | 478 B | 240 B | −238 B | **(s1)** |
| two consumer pins behind the channel | 714 B | 476 B | −238 B | **(s2)** |
| 42 repos, two parked | 4,121 B | 2,303 B | −1,818 B | **(s1)** |
| PostToolUse, green | 0 B | 0 B | 0 | 157 of 157 exit-0 runs dropped (ver quiet-measurement) |

**Realized in this workflow's tree (critic gap 4).** The design booked "13 real shim commits ×
≈187 B ≈ 2.4 KB"; that was never run. `$SCR/hist.sh` replays each commit from `b5cdb63` to
`62d4588` plus #5's branch (`checkout -B <branch> C && reset --soft C^`, then the new `verify
--check` with and without `MULTIVAC_QUIET=1`) **(critic)**:

| Commits | Fold to one line | Print in full |
| --- | --- | --- |
| all 22 | 10 | 12 — 10 with the law staged ("no row reached active"), 2 with a change finished at land |
| 9 made by the tool (`change promoted`, `status branched`, `graph:`, `land`) | 9 of the 10 folds | — their output goes through `commitBookkeeping` → `gitRun` (execFile) and never reaches the model |
| 13 made by an agent | 6 — 70fe703, 6e2a265, 7b849fa, e5d034f, 116a719, c8b8a1a (466 → 219 B, as SC-021) | 7, each with the law staged |

Realized: about **1,033 B** at commits, plus the one real resume (347 → 195 B, −152 B): about
1.2 KB ≈ 300 tokens. **Printing a staged law in full (R9) is what caps it**: every agent commit
that carried a law edit printed whole, by design. Startup delivered `/bin/sh: 1: mvac: not
found` once, which no change here touches.

**Where quiet does not apply**: a consumer code commit under an SDD carries the non-gating "no
open change in the mounted brain" line and prints in full; a brain behind its own channel prints
in full, correctly; explicit `mvac verify` runs (41 runs, 14,800 B in this tree) are untouched
on purpose.

**Law cost, paid once and read many times**: the row is 4,501 B with the critic's clauses
(`wc -c` of R17's text, **(plan)**; s2's was 4,081 B) and the notes 1,004 B. Every later design
touching verify pastes MV-53 and MV-112 into handoffs that 9–17 agents read (ver
quiet-measurement), so in this research-heavy tree the law's reads exceed the 1.2 KB saved; in
an ordinary session rows are rarely read while session starts and commits recur. The case rests
on correctness.

## R16. Legs

Dialect: POSIX ERE through `git grep`, per `skills/multivac/references/anchors.md`
(`[[:space:]]`, never `\s` or `\b`; one pattern on one physical line; `\|` matches a literal
`|`, a bare `|` alternates). Every `src` leg of s2 was dry-run with `git grep -c -E` in
`$S/full` **(s2)**, and every design leg and both moved legs gave the stated counts under `mvac
count` **(critic)**. Legs the critic's fixes add or respell are marked `(new)` in the counts
below; T070 dry-runs every leg on the final tree. Each `absent` leg matches today (it has teeth)
or pins a decision at 0.

**New legs, MV-151 — code**, exactly as written under the row:

```text
<!-- @anchor MV-151 brain:src/commands/verify.ts /export async function resolveRoot\(/ unique -->
<!-- @anchor MV-151 brain:src/commands/verify.ts /const m = await namedMount\(d\);/ unique -->
<!-- @anchor MV-151 brain:src/commands/verify.ts /const unnamed = findMount\(real\);/ unique -->
<!-- @anchor MV-151 brain:src/{cli,commands/verify,commands/count}.ts /await resolveRoot\(/ count=5 -->
<!-- @anchor MV-151 brain:src/commands/{doctor,doors,roadmap}.ts /await rootedBrain\(ctx\.cwd\)/ count=3 -->
<!-- @anchor MV-151 brain:src/lib/git.ts /\['-C', dir, 'rev-parse', '--show-toplevel'\]/ unique -->
<!-- @anchor MV-151 brain:src/lib/git.ts /not a git repository\|must be run in a work tree/ unique -->
<!-- @anchor MV-151 brain:src/commands/verify.ts /return worktreeBrain\(brainDir\)\?\.brain \?\? brainDir;/ unique -->
<!-- @anchor MV-151 brain:src/commands/verify.ts /export function siblingDir\(/ unique -->
<!-- @anchor MV-151 brain:src/commands/verify.ts /existsSync\(own\) \? own : resolve\(wt\.brain, path\)/ unique -->
<!-- @anchor MV-151 brain:src/commands/verify.ts /siblingDir\(brainDir, key, (e|entry)\.path\)/ count=2 -->
<!-- @anchor MV-151 brain:src/commands/doctor.ts /siblingDir\(brain, key, e\.path\)/ count=5 -->
<!-- @anchor MV-151 brain:src/commands/verify.ts /\(asked from \$\{askedFrom\}\)/ unique -->
<!-- @anchor MV-151 brain:src/lib/config.ts /const holder = enclosingBrain\(brainDir\);/ unique -->
<!-- @anchor MV-151 brain:src/commands/verify.ts /for its verdict, or from a brain checkout/ unique -->
<!-- @anchor MV-151 brain:src/adapters/registry.ts /payload: \{ env: 'CLAUDE_PROJECT_DIR', event: 'hook_event_name', session: 'SessionStart', edit: 'PostToolUse', file: 'tool_input\.file_path', cwd: 'cwd' \}/ unique -->
<!-- @anchor MV-151 brain:src/commands/verify.ts /async function hookAsk\(/ unique -->
<!-- @anchor MV-151 brain:src/commands/verify.ts /hook\.dir \?\? ctx\.cwd/ unique -->
<!-- @anchor MV-151 brain:src/commands/verify.ts /export function followable\(/ unique -->
<!-- @anchor MV-151 brain:src/cli.ts /\{ env: process\.env, stdin: readStdin \}/ unique -->
<!-- @anchor MV-151 brain:src/{commands/verify,lib/code-in-change}.ts /^  quiet: string \| null;$/ count=2 -->
<!-- @anchor MV-151 brain:src/commands/verify.ts /^  clause: string \| null;$/ unique -->
<!-- @anchor MV-151 brain:src/commands/verify.ts /ev\.unparsed\.length > 0 \|\| orphan/ unique -->
<!-- @anchor MV-151 brain:src/commands/verify.ts /warnings\(\) !== warnedBefore/ unique -->
<!-- @anchor MV-151 brain:src/lib/out.ts /export function tapOutput\(/ unique -->
<!-- @anchor MV-151 brain:src/commands/verify.ts /say\(\[summary, \.\.\.rest\]\.join\(' · '\)\)/ unique -->
<!-- @anchor MV-151 brain:src/commands/verify.ts /else if \(quiet\) unplain\.push\(d\.text\);/ unique -->
<!-- @anchor MV-151 brain:src/commands/verify.ts /[^a-zA-Z.]say\(/ count=3 -->
<!-- @anchor MV-151 brain:src/cli.ts /root\?\.kind === 'consumer' && found\?\.level !== 'red'/ unique -->
<!-- @anchor MV-151 brain:src/commands/count.ts /await consumerSource\(consumerKey, root\.dir\)/ unique -->
<!-- @anchor MV-151 brain:src/commands/{doctor,doors,roadmap}.ts /if \(!samePath\(brain(Dir)?, ctx\.cwd\)\) say\(/ count=3 -->
<!-- @anchor MV-151 brain:src/hooks/install.ts /'export MULTIVAC_QUIET=1'/ unique -->
<!-- @anchor MV-151 brain:.multivac/hooks/{pre-commit,pre-merge-commit,pre-push} /^export MULTIVAC_QUIET=1$/ each -->
<!-- @anchor MV-151 brain:.multivac/hooks/{pre-commit,pre-merge-commit,pre-push} /MV-[0-9]+/ absent -->
<!-- @anchor MV-151 brain:test/helpers/fixture.ts /export function scrubbedEnv\(/ unique -->
<!-- @anchor MV-151 brain:src/commands/{verify,count}.ts /existsSync\(join\(startDir, CONFIG_PATH\)\)/ absent -->
<!-- @anchor MV-151 brain:src/commands/{verify,count}.ts /findMount\(startDir\)|hasProjectedDoor\(startDir\)/ absent -->
<!-- @anchor MV-151 brain:src/commands/doctor.ts /resolve\(brain, e\.path\)/ absent -->
<!-- @anchor MV-151 brain:src/doors/settings.ts /MULTIVAC_QUIET/ absent -->
```

Counts, today → after:

- `resolveRoot\(` definition, `namedMount\(d\)`, `findMount\(real\)`: 0 → 1 each. `await
  resolveRoot\(` 0 → 5: cli.ts 1, count.ts 1, verify.ts 3 (the follow, the session's root,
  `rootedBrain`). `await rootedBrain\(ctx\.cwd\)` 0 → 3: doctor, doors, roadmap 1 each.
- The toplevel read and its refusal test: 0 → 1 each. The sibling base: 0 → 1. `siblingDir`
  `(new)`: its definition and its own-worktree test 0 → 1 each; its calls in verify.ts 0 → 2
  (`resolveSources`, `stalenessLines`), in doctor.ts 0 → 5 (`presentRepoDirs`, `reposLine`,
  `branchesLine`, `pinsLine`, `untrackedLine`) — replacing s2's `resolve\(siblingBase\(brain\),
  e\.path\)` leg.
- The root line, the enclosing-brain refusal, the mount wording: 0 → 1 each.
- The payload contract `(new: cwd added)`, `hookAsk`, the session directory `(new)`, `followable`
  `(new)`, the dispatcher's reader: 0 → 1 each.
- The required quiet fields 0 → 2 (verify.ts 1, code-in-change.ts 1); the read clause, the off
  test, the warning test, the tap, the one line, the stale-under rule: 0 → 1 each.
  `[^a-zA-Z.]say\(` in verify.ts: 22 → 3 (the non-quiet `emit`, the one line, the lines under
  it) **(plan: 22)** — a new direct `say(` breaks the count.
- The consumer notice, `count`'s consumer read: 0 → 1. The root-line comparisons `(new)`: 0 → 3.
- The shim builder's export 0 → 1; the three shims' export 0 → 1 each once `doors` regenerates
  them (the critic read 0 before, as expected); a row ID in the shims `(new)`: 0 → 0 **(plan)**;
  the test scrub `(new)`: 0 → 1.
- Retired lookups: `existsSync\(join\(startDir, CONFIG_PATH\)\)` 3 → 0 (verify.ts 2, count.ts 1);
  `findMount\(startDir\)|hasProjectedDoor\(startDir\)` 3 → 0; doctor's `resolve\(brain,
  e\.path\)` 5 → 0; `MULTIVAC_QUIET` in settings.ts 0 → 0, pinning that no switch rides in a gate
  string (all **(plan)** on 62d4588).

`for (let d = real; …)` occurs twice (the config walk and the mount walk), so the walk is pinned
on `namedMount`.

**New legs, MV-151 — retired phrases (MV-111), tests, site, notes**:

```text
<!-- @anchor MV-151 brain:site/content/docs/reference/hooks.md /A green run says nothing on either event/ absent -->
<!-- @anchor MV-151 brain:{skills/**,.claude/skills/**} /Every run prints a .read. line per repo/ absent -->
<!-- @anchor MV-151 brain:DESIGN.md /short sha, on every run/ absent -->
<!-- @anchor MV-151 brain:{DESIGN.md,site/content/**} /cwd is (the brain|a code repo with the brain mounted)/ absent -->
<!-- @anchor MV-151 brain:test/verify/rooted.test.ts /a run from any directory of a checkout prints its root's report and names the root/ unique -->
<!-- @anchor MV-151 brain:test/verify/rooted.test.ts /a consumer whose root is not a git toplevel keeps its verdict from every directory in it/ unique -->
<!-- @anchor MV-151 brain:test/verify/rooted.test.ts /a brain change worktree is its own brain from every directory in it/ unique -->
<!-- @anchor MV-151 brain:test/verify/rooted.test.ts /a brain change worktree reads each sibling in the change's own worktree, else where the main checkout does/ unique -->
<!-- @anchor MV-151 brain:test/verify/rooted.test.ts /a mount is judged as the brain it is, and never advises repos sync/ unique -->
<!-- @anchor MV-151 brain:test/verify/rooted.test.ts /the post-edit run roots at the edited file when a brain governs it/ unique -->
<!-- @anchor MV-151 brain:test/verify/rooted.test.ts /a hook starts where its payload says, and never follows into a nested brain/ unique -->
<!-- @anchor MV-151 brain:test/verify/rooted.test.ts /a symlinked path to the root is the root, and names no root/ unique -->
<!-- @anchor MV-151 brain:test/cli/rooted-refusal.test.ts /a command refused below a brain names that brain/ unique -->
<!-- @anchor MV-151 brain:test/verify/quiet.test.ts /anything off prints the whole report byte for byte/ unique -->
<!-- @anchor MV-151 brain:test/verify/quiet.test.ts /a read that is not plain and a pin that does not gate print under the one line/ unique -->
<!-- @anchor MV-151 brain:test/verify/quiet.test.ts /any warning prints the whole report, streams in their order/ unique -->
<!-- @anchor MV-151 brain:test/doors/settings.test.ts /an older doors over a newer projection leaves settings\.json byte-identical/ unique -->
<!-- @anchor MV-151 brain:test/cli/version-skew.test.ts /a subdirectory and a consumer hear the floor the brain declares/ unique -->
<!-- @anchor MV-151 brain:test/doors/doors.test.ts /every shim exports MULTIVAC_QUIET after its chain block and before its runners/ unique -->
<!-- @anchor MV-151 brain:site/content/docs/reference/commands.md /^### Where a run roots$/ unique -->
<!-- @anchor MV-151 brain:.multivac/invariants.md /Amended 2026-09-29 by MV-151/ count=5 -->
```

Counts, today → after (**(plan)** on 62d4588): hooks.md 1 → 0; the skill's sentence 2 → 0
(`skills/multivac/references/verify.md:90` and its `.claude/skills` copy, which `doors`
re-projects); DESIGN.md:631 1 → 0; the scope table's "cwd is …" `(new, critic gap 5)` 3 → 0
(DESIGN.md:626, commands.md:384 and :386). The fifteen test titles and the site heading 0 → 1
each (four titles `(new)`: the change's own sibling worktree, the hook's payload directory and
nested brain, the symlinked root, the shim export). The notes 0 → 5, or 4 without MV-150's.

**Moved legs** (each by the task that makes the old one false):

```text
MV-127  old: <!-- @anchor MV-127 brain:src/commands/verify.ts /if \(await hasProjectedDoor\(startDir\)\)/ unique -->
        new: <!-- @anchor MV-127 brain:src/commands/verify.ts /if \(await hasProjectedDoor\(top\)\) return \{ kind: 'door', top \};/ unique -->
MV-138  old: <!-- @anchor MV-138 brain:src/commands/verify.ts /const wt = existsSync\(join\(startDir, CONFIG_PATH\)\) \? null : worktreeBrain\(startDir\)/ unique -->
        new: <!-- @anchor MV-138 brain:src/commands/verify.ts /const wt = worktreeBrain\(top\);/ unique -->
```

The door is asked of the toplevel; MV-138's path is asked of the toplevel before any mount, as
MV-138 orders (s2: 1 each). Measured: `verify --check` in `$S/full` before these moves reports
exactly `broken MV-127 [unique] … found none` and `broken MV-138 [unique] … found none`, and
nothing else **(s2)**.

**Relied on, unchanged**: MV-146 `src/commands/{verify,count}.ts /sddDeclaration: 'report'/
count=3` (verify 2, count 1); MV-109 `count.ts /await resolveSources\(brainDir, cfg, false\)/
unique` (kept in `count`); MV-86 `cli.ts /if \(n\) warn\(paint\(n\)\)/ unique`; MV-52 `install.ts
/graph|refresh/ absent` (0 today, **(plan)**); MV-115 `install.ts /--git-common-dir/ count=3` (3
today, **(plan)**; the export line adds none); MV-09 (`findMount`, `resolveRepoKey`, `scoped`);
MV-49 (`function findStaleMount`, and `is mounted but is not a multivac brain` in verify.ts and
commands.md); MV-53's legs, `commands.md /What each run reads/`, `configuration.md /The ecosystem
as published/`, `SKILL.md /Read the .read. lines before you read the verdicts/` and `DESIGN.md
/Each context verifies what it is responsible for/` included; MV-112's five (`const SESSION_GATE
= `, `const EDIT_GATE = `, the identity expression, `ONLY exit-0 stdout at SessionStart`,
`.claude/settings.json /mvac verify >&2 \|\| exit 2/`); MV-127's `src/commands/{doctor,doors,repos}.ts
/multivac repos sync/ each` (doctor's advice keeps the phrase); MV-137's test title `a real git
merge runs pre-merge-commit before MERGE_HEAD exists` (T009 keeps it); MV-138's `export function
worktreeBrain\(`, `consumer: lagging,` and the site's `^A change worktree is found from its path
first\.`; MV-140's refresh leg; MV-126's and MV-84's site legs (no ID and no version on any page
this change edits); MV-141's `pre-commit and pre-push shims` phrase leg over DESIGN.md and the
site; MV-111's `skills/**` arrow leg.

## R17. The law as it will be written

**MV-151**, one physical line, filed `open | proposed | 2026-09-29`, 4,501 B with its newline
(`wc -c`, **(plan)**): the design's s2 text (4,081 B) with the critic's clauses folded in — the
change's own sibling worktree (gap 1), the session directory and the follow test (gap 7), "No
test reads either switch from the developer's shell." (gap 3), the shim and test legs in "What
is mechanical" (gaps 2, 3), and the follow ceiling (gap 7):

```text
| MV-151 | **A run reads the checkout that holds where it was asked, and says one line when nothing is off.** Measured 2026-09-29 on this brain, scratch ecosystems and Claude Code 2.1.283. `verify` took its starting directory for the root. From a brain or consumer subdirectory it exited 2 advising `multivac init .`, which git-inits a second brain there, as did `change`, `repos` and `doctor`, while `roadmap` listed nothing. From a brain change worktree's subdirectory it judged the main checkout's law and passed a blocking row the worktree added; the post-edit gate passed an MV-01 violation written into a worktree from the main checkout. A brain worktree resolved its siblings against itself and advised `repos sync`, which cloned them into `.multivac/worktrees/`, and inside a consumer's mount into the consumer. The MV-86 floor reached no subdirectory and no consumer. A green report went whole into every session start (348 bytes here) and every agent commit. **The rule.** `verify`, `count`, `doctor`, `doors`, `roadmap` and the dispatcher's notice root first. The brain is the nearest `.multivac/config.yml` from the start up to its git toplevel, asked with the ambient `GIT_*` dropped. Otherwise MV-138's path is read at the toplevel; MV-09's mount is the nearest one its brain names by `mount:` below the toplevel, else the toplevel's own, else a `.gitmodules` path its brain names, else the start's child brain; then MV-49's stale pin and MV-127's door. From any directory the verdict and the report are the root's, and a full report printed elsewhere names its root in one line. A mount is a brain checkout and is judged as one; a sibling missing beside it is named with its host, never with `repos sync`. A brain worktree reads each sibling in the change's own worktree for it, else where the main checkout does. A consumer hears the floor, not the record. Outside a work tree nothing is walked, a git refusal other than "not a git repository" is quoted, and no advice names a directory other than the one asked: a command refused below a brain names that brain. Where a door target declares its harness's hook payload, a hook starts in the session directory the payload names, a post-edit run roots at the edited file when a consumer, a door or a brain that is its own git toplevel governs it, and a session start is quiet. Quiet (also `--quiet`, or `MULTIVAC_QUIET=1`, which the git shims export) prints one line when every line has a quiet form: the summary first, then the header, each plain read with its ref or branch, sha and age, the enact answer with its reason and the change the code lands in. A read that is not plain and a pin that does not gate print in full beneath it. Anything else off prints the whole report, streams in their order: any warning, a staged law or config, an unparsable open change and an anchor on no row among them. No test reads either switch from the developer's shell. **What is mechanical**: `unique` legs on the resolver, its mount walk, the toplevel read and its refusal test, the sibling base and the sibling lookup, the root line, the enclosing-brain refusal, the mount wording, the payload contract, its reader, the session directory, the follow test, the required quiet fields, the off test, the output tap, the one line, the consumer notice, the shim export and the test scrub; `count` legs on the resolver's and the brain half's calls, the sibling lookups, the root-line comparisons and verify's direct `say(`; an `each` leg on the shims' export; `absent` legs on the directory-bound lookups, a switch in the gate strings, a row ID in the shims and the retired sentences; test legs; a site leg. **Ceilings.** A mount its brain does not name is found only from the directory holding it, and a nested one only through `.gitmodules`. A brain that is not a git toplevel is found only from itself or below, and no edit is followed into it. A harness whose door declares no payload keeps the session's directory and the full report, and an open pipe is read for two seconds. A hand-wired hook, a branch cut before `doors` regenerated its shims, and a binary older than this row keep the full report; that binary's `doors` rewrites the shims without the switch. Under a hook the notice reads the hook process's own directory. `change`, `repos`, `seed` and `init` are not rooted, and `repos sync` typed inside a mount still clones there. | open | proposed | 2026-09-29 | [changes/verify-rooted-and-quiet.md](changes/verify-rooted-and-quiet.md) |
```

The row holds exactly 7 `|`, the six columns' delimiters, and no phrase an `absent` leg over
`.multivac/invariants.md` forbids (MV-118's and MV-120's: 0, **(plan)**). It carries the rule and
names the facts; the tables live here and in the change body.

**The five notes**, each appended to the end of its row's statement cell, nothing else in those
rows changing (sizes `awk '{print length}' $S/notes.txt`: 247, 265, 161, 202, 129 B; 1,004 B):

```text
MV-53   **Amended 2026-09-29 by MV-151**: "Every run prints one `read` line per repo" holds except on a quiet run, which folds each plain read into a clause of its one line with the same ref or branch, sha and age; a read that is not plain keeps its line.
MV-112  **Amended 2026-09-29 by MV-151**: "a green run stays silent to the model by design" held after an edit only: at session start the whole green report reached the model. It is one line there now, keyed on the harness's hook payload, so both commands keep their bytes.
MV-127  **Amended 2026-09-29 by MV-151**: the door is asked of the checkout's git toplevel, so a consumer subdirectory gets this exit 0 too; the leg moves with the call.
MV-138  **Amended 2026-09-29 by MV-151**: `worktreeBrain` reads the checkout's git toplevel, so a brain change worktree, which holds a config, is a brain from every directory in it; the leg moves with the call.
MV-150  **Amended 2026-09-29 by MV-151**: "and does not reach a consumer's run" is WITHDRAWN: a mount's floor reaches its consumer's run.
```

Why each: MV-53's quoted sentence is false on a quiet run. MV-112's was already false at
SessionStart, where the whole green report was delivered (347 B at a real resume), and this
change owns that output. MV-127: no sentence becomes false; its leg moves. MV-138: "Where a
checkout has no `.multivac/config.yml`, `worktreeBrain` reads its real path first" stays true;
its leg moves. **MV-150 is conditional**: change-file-cites' design states, among MV-150's
ceilings, "MV-86's `requires:` floor makes the brain loud and does not reach a consumer's run";
T001 re-reads the enacted row, and if that sentence is absent the note is not written,
`touches` drops MV-150 and the count leg reads 4.

**Rows cited, unchanged**: MV-09 (now honoured from any directory, for a subproject that is not a
toplevel, and for the nested mount); MV-49 (`init` stays the hint only when no mount is in reach
at all — now also inside a stale mount and from a consumer subdirectory; from below the host its
text adds ` Run it in <host>.`); MV-20 (the quiet line starts with the same summary, from the same
`blocking` variable; a pending claim or a drift row forces the full report, so "silence is not"
the grace); MV-54 (the clause keeps `(last fetch <age> ago)`; `never fetched here` prints
beneath); MV-81 (the clause keeps "not answered" with its reason; any staged law prints in
full); MV-86 (still one print, from the dispatcher, guarded, never moving an exit code; now read
from the resolved brain, so "a binary that disagrees SAYS SO on every run" holds from
subdirectories and consumers); MV-97, MV-107, MV-137, MV-146 (every line of theirs is `quiet:
null`, and a mount stays brain-scoped, so all still gate there — MV-107 measured **(s2)**);
MV-108 (shim identity is the header line; `doors` regenerates the three shims with the export);
MV-109 (`count` calls the same resolver); MV-112's legs; MV-118 (environment errors, dubious
ownership included, exit 2); MV-140 (the refresh hook is untouched).

**The change file** (frontmatter; `change new` fills `repos`):

```yaml
repos: { brain: {} }        # brain==code
invariants:
  touches: [MV-53, MV-112, MV-127, MV-138, MV-150]   # MV-150 only if the condition above holds
  adds: [MV-151]
  retires: []
claims: [MV-151]
```

## R18. Ceilings, stated

A mount its brain does not name is found only from the directory holding it, and a nested one
only through `.gitmodules`. A brain that is not a git toplevel is found only from itself or
below, and the post-edit gate never follows into it. A harness whose door declares no payload
keeps the session's directory and the full report after an edit; a pipe nobody closes is read
for two seconds under the marker variable. A hand-wired hook (husky, lefthook,
`MANUAL_CHAIN_LINE`), a branch cut before `doors` regenerated its shims, and a binary older than
this row keep the full report; that binary's `doors` rewrites the three tracked shims without
the export, so the files flip in a team that mixes versions until everyone is past this version
(the MV-86 notice is the signal; a `requires:` floor the human's lever). Under a hook the notice
reads the hook process's own directory. `change`, `repos`, `seed` and `init` are not rooted, and
`repos sync` typed inside a mount still clones there (`repos-knows-its-mount`). A freshly cloned
sibling reads "never fetched here", and a linked-worktree sibling always does, because
`FETCH_HEAD` is per worktree; quiet prints either beneath its line (`fetch-age-reads-every-fetch`,
MV-54). A consumer change worktree is judged by the main brain checkout's law (MV-138's own
ceiling). `git rm .multivac/config.yml` in the brain takes MV-127's exit-0 branch (MV-97
family). An unparsable open change file and an anchor on no row keep a run from being quiet but
are still not named in the full report (`unparsed-change-files-are-named`, an MV-20-family
change). Test runs leave `/tmp/mvac-*` directories behind (a test-hygiene follow-up). Nothing
re-measures the harness on upgrade: the payload contract names the binary it was read from, and
the two facts it rests on await a live session (spec Assumptions).
