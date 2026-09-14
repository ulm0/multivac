# Research: One resolver per root

Sources:
- Audit 2026-09-13 C13, C14, C15 and C18, and the 2026-09-14 requirements
  synthesis, §3 "Adaptador resuelto" and §6 row 2.
- The change file's measurements.
- This repo at `5479c62`. All line numbers below are from that commit.

## R1: The twelve readers

- **Decision**: `adapterFor(cfg, root, kind)`, exported from
  `src/adapters/detect.ts`, replaces every read. Nothing else reads `sdd:` or
  `grapher:` to decide which adapter applies.
- **Evidence**: R8 leg 2 finds 43 lines in 9 files, spread over 12 functions:
  - `sddFor` (detect.ts:70-73).
  - `graphScopes` (refresh.ts:151, :155). The brain takes `cfg.grapher`.
  - `graphGate` (refresh.ts:231) and `graphTrackedGate` (tracked.ts:54).
  - `sddGate` (sdd.ts:305-306, :506) and `sddInstructions` (:571-572), which
    read the global value only.
  - `renderFlow` (flow.ts:53, :83) and `renderConsumerDoor` (consumer.ts:54-55).
  - `grapherLines` (brain.ts:65) and `sddLines` (brain.ts:104), which both fall
    back to the global value.
  - doors `run` (doors.ts:293, :326) and `ritualSeed` (ritual.ts:39).
- **Not resolution, left alone**:
  - init's MV-91 comparisons (init.ts:369-370, :414-419) and `renderConfig`
    (:133-141);
  - `detectAdapters` (detect.ts:170-173);
  - the parser (config.ts:240-243, :397-401).
- **Shape**:
  - `adapterFor` returns `string | undefined`. The entry is `cfg.repos[root]`,
    or the `isBrain` entry when `root === 'brain'`.
  - The value is `entry?.[kind] ?? cfg[kind]`, and `'none'` becomes
    `undefined`.
  - `cfg` is typed as the minimal `Pick`, so ritual.ts's structural config and
    ritual.test.ts:84 still type.
  - `adaptersByRoot(cfg, kind)` returns a `Map<name, rootKeys[]>` over `brain`
    and every declared non-brain key, absent repos included.
- **Alternatives considered**:
  - Merging `sddRoots` and `graphScopes`. Rejected: it touches four callers for
    no behaviour, so each keeps its shape and calls `adapterFor`.
  - Keeping the door helpers' fallback. Rejected: the fallback is the bug.

## R2: `none`, for both kinds

- **Decision**:
  - `NO_SDD` becomes `NO_ADAPTER = 'none'`, compared only in `adapterFor`.
  - config.ts imports it and refuses a `graphers:` key equal to it. detect.ts
    imports only registry.ts and types, so there is no cycle.
- **Evidence** (a scratch brain with top-level `grapher: none` and
  `sdd: none`):
  - `doctor` prints `none @ brain: grapher "none" is not verified`.
  - `doors` prints one `not verified` notice.
  - AGENTS.md:10 says "Features gate through the `none` SDD".
  - flow.md:12 and :31 call both unknown.
  - Read from source, not run: the close loop (change.ts:1103-1104) passes
    `'none'` to `refreshGraph`, which warns unverified (refresh.ts:84-87).
- **doctor**: `grapherLines` (doctor.ts:276) mirrors the SDD pass
  (:189, :196-201):
  - silent when no present root resolves a grapher;
  - otherwise a `none @ <scope>` line saying the root is out of scope.
  - MV-87's `unique` leg on `out of scope, not a gap` (invariants.md:667)
    means one helper renders both kinds.
- **init**: `--sdd none` is already refused. `--grapher none` is refused by R5,
  since `none` can be neither verified nor declared.

## R3: The SDD gate, per adapter

- **Decision**: `sddGate` groups the present roots from `sddRoots` by resolved
  name, in order of first appearance with the brain first. The body runs per
  group, with `name` for `cfg.sdd` and the group for `roots`.
  - `where` names the group, and the filter at sdd.ts:506 goes.
  - The unknown line prints once per name, and "not gated" once per adapter.
    The `--no-sdd` hint prints once, at the end.
  - `ok` is the AND of the groups (FR-005). A `none` root is in no group, so
    the step loop (sdd.ts:348) and the ledger loop (:444) never search it.
- **Byte-identity (FR-011)**:
  - A global-only config gives one group, equal to today's `roots`, so every
    line keeps its text and order.
  - The `!sddAuto || noSdd` return stays ahead of any fs read.
- **MV-113** applies within a group. **MV-56's strings**
  (invariants.md:377-388) stay verbatim.
- **Deferred**: judging only the adapters of the repos a change names
  (spec Assumptions).

## R4: Renderers

- **Printed steps**: `sddInstructions` keeps its signature and iterates
  `adaptersByRoot(cfg, 'sdd')`. The label is `sdd <name>:` with one adapter, and
  `sdd <name> @ <roots>:` with more, doctor's `@` form (FR-007).
- **flow.md**: `renderFlow` iterates `adaptersByRoot` per kind.
  - An adapter resolved by every declared root renders today's rows.
  - Otherwise each row ends ` — in <roots>`, the build row's
    `, in every declared repo` becomes `, in <roots>`, and the unknown and
    unverified rows say `for <roots>`.
  - The no-adapter rows print only for an empty map (FR-009).
- **Doors**:
  - `grapherLines(config, name)` and `sddLines(config, name)` lose the
    fallback.
  - `renderBrainDoor` passes `adapterFor(config, 'brain', …)`, and the consumer
    door passes `adapterFor(config, repoKey, …)`.
  - doors.ts:293/:326 hand `projectInto` the same name, so the post-edit hook
    and the notice follow the root (FR-008).
  - init gets the brain's own resolution through `renderBrainDoor`
    (init.ts:462).
- **Ritual**: the spec candidate needs a non-empty `adaptersByRoot(…, 'sdd')`.
  The call `ritualSeed(declared ?? f)` is unchanged, so MV-98's leg
  (invariants.md:767) holds.
- **Rejected**: per-adapter sections in flow.md, which break MV-96's
  Automatic/Gate/Yours sort and FR-011.

## R5: `init --grapher`

- **Evidence**:
  - `init --grapher graphfy --quiet <new dir>` exits 0, writes
    `grapher: graphfy`, and creates `.git .multivac AGENTS.md`.
  - `init --sdd speckti` exits 2 and creates nothing.
  - init.ts:92-94 says the grapher is checked "after the config is read". It is
    not.
  - MV-114 (invariants.md:893) says "checked against the registry only".
- **Decision**: in `runInit`, after `parseFlags` and before `mkdir`
  (init.ts:302), when `f.grapher` is set, the vocabulary is:
  - `grapherNames` when no config is at the target;
  - `grapherNames` plus `Object.keys(graphers)` when the config reads;
  - nothing to judge when the config does not read. MV-114's refusal at
    :351-366 stands, after `mkdir`, as its ceiling says.
  - A name outside the vocabulary gets
    `init: unknown --grapher <name> — known: …` and exit 2.
- **The read**:
  - `loadConfig` throws the layout error first (config.ts:288-289), so a legacy
    brain would read as unreadable and its typo would pass once
    `migrateLegacy` ran.
  - `loadConfig` is therefore split into an exported `readConfig` (parse only)
    plus the layout check, and the pre-read uses `readConfig`.
- **Legs**:
  - MV-114 `unknown --\$\{key\}` absent (:895) means the message spells
    `--grapher`.
  - MV-69 `grapherNames\.join` unique (:503) means the list joins
    `[...grapherNames, ...declared]`.
- **Rejected**:
  - Checking in the synchronous `parseFlags`.
  - Moving the whole config read ahead of `mkdir`, which is a later change.
  - Reading `--grapher none` as "no grapher", when leaving the flag out already
    says that.

## R6: Dead code

- **Decision**:
  - Delete `AdapterStatus`, `Policy`, `policy()` and `detect()`
    (detect.ts:10-27, :182-195).
  - Delete their three tests (adapters.test.ts:52-83), the imports at :19-20,
    and the header comment at :1. `emptyDir` stays, because :111 uses it.
- **Evidence**:
  `git grep -nE '(^|[^[:alnum:]_])(policy|detect)\(|AdapterStatus' -- src test`
  finds 9 lines: the definitions and those tests.
- DESIGN.md:1156/:1232 and graphers-and-sdd.md:51-56 keep "notice, feature off,
  exit 0", which belongs to the binary change.

## R7: Law notes

Each note begins `**Amended 2026-09-14 by MV-122**:` and is appended at the
row's end.
- **MV-50**: "per-scope grapher falling back to the global one" is WITHDRAWN;
  each root is refreshed with the grapher `adapterFor` resolves, and not at
  all for `none`. The note also says "each declared+present repo the change
  touched" went stale with MV-90's note on MV-87. Leg 4 cannot see this row,
  because its glob never reaches `.multivac/`, so the sweep reads it by hand.
- **MV-56**: a step is looked for in the present roots that resolve to the
  adapter being judged. Each resolved adapter is judged by its own steps, a
  point passes only when all pass, and a `none` root is never searched. An
  adapter that only repos not on disk resolve refuses, naming them.
- **MV-59**: `none` is not a name. It resolves to no grapher before
  `grapherSpec` is asked, and `graphers.none` is refused at load.
- **MV-87**: `none` is a token for `grapher:` as well as `sdd:`, at repo and top
  level, and the brain root reads its own entry for both kinds. `adapterFor`
  replaces `sddFor` and graphScopes' own reads, and `doctor` reports a `none`
  grapher root as out of scope.
- **MV-90**: the brain root's grapher is its own entry's in the gate, the build,
  the refresh and the brain door. "Declared anywhere" means some declared root
  resolves a grapher, so a top-level `grapher: none` is silence.
- **MV-114**: "`--grapher` is checked against the registry only" is WITHDRAWN.
  No check ran, and `init --grapher graphfy` exited 0. `init` now checks before
  it creates anything, against the verified graphers plus `graphers:` in a
  readable config already there, so a name meant for `graphers:` is declared
  first. The directory ceiling stands for the config refusal, which also skips
  the name check.

## R8: MV-122's legs

```text
<!-- @anchor MV-122 brain:src/adapters/detect.ts /export function adapterFor\(/ unique -->
<!-- @anchor MV-122 brain:src/** /(^|[^[:alnum:]_])(cfg|config|entry|e|brainEntry)\??\.(sdd|grapher)([^[:alnum:]_]|$)/ absent -->
<!-- @anchor MV-122 brain:{src,test}/** /sddFor|NO_SDD|export function policy|export async function detect\(|type Policy =/ absent -->
<!-- @anchor MV-122 brain:{*.md,src/**,test/**,site/content/**,skills/**,.claude/skills/**} !CHANGELOG.md !.claude/skills/speckit-*/** /where that vocabulary is known|`--grapher name` \| any tool name|the brain passes nothing|falling back to the global one/ absent -->
<!-- @anchor MV-122 brain:src/commands/init.ts /unknown --grapher \$\{/ unique -->
<!-- @anchor MV-122 brain:src/lib/config.ts /=== NO_ADAPTER/ unique -->
<!-- @anchor MV-122 brain:.multivac/invariants.md /Amended 2026-09-14 by MV-122/ count=6 -->
```

- **Counts**, from `multivac count` at `5479c62`, then as expected after the
  edits:
  - legs 1, 5 and 6: 0, then 1;
  - leg 2: 43 in 9 files, then 0;
  - leg 3: 17 in 4 files, then 0;
  - leg 4: 5 in 5 files, then 0;
  - leg 7: 0, then 6.
- **Leg 2** names the variables all 43 reads use, and it excludes nothing.
  config.ts reads `o.`, init.ts reads `declared`, `f` and `d`, and `adapterFor`
  reads by `[kind]`. Comments that quote a read (detect.ts:83) are rewritten,
  since no pattern can tell them from code.
- **Leg 4** matches the retired sentences on the half of each wrapped line:
  init.ts:94, commands.md:88, brain.ts:100, doors.ts:324 and
  graphers-and-sdd.md:232. Its glob takes `.claude/skills/**` too, minus the
  vendor's `speckit-*`, as MV-121's legs do. A sixth copy sits in MV-50, where
  no glob of this leg reaches; the note there withdraws it in place.
- **Moved legs**:
  - MV-87 :658 moves to `/export function adapterFor\(/ unique`, and :659 to
    `/export const NO_ADAPTER = 'none'/ unique`.
  - MV-90 :706 moves to
    `/grapherLines\(config, adapterFor\(config, repoKey, 'grapher'\)\)/ unique`.

## R9: The row (≤ ~400 words, `specified | proposed | 2026-09-14`, no pipe)

- A bold lead: one function resolves the adapter for a root, and `none` is a
  token for both kinds.
- The five measured defects, one clause each.
- **The rule**:
  - `adapterFor` is the only reader: the repo's value, then the ecosystem's, and
    the brain's own entry.
  - `none` is no adapter, and `graphers.none` is refused.
  - Every surface asks it.
  - Each adapter is judged in its own roots, and all must pass.
  - Renders name roots when they differ.
  - `init --grapher` checks its vocabulary.
  - A global-only config behaves as before.
- **What is mechanical**: the seven legs.
- **Ceilings**:
  - Leg 2 sees only dotted reads through its five names: a bracket read, a
    destructuring or another identifier passes it.
  - Every in-scope adapter must hold proof, including adapters of repos the
    change does not name, until scope narrows (`--no-sdd` skips it for one run).
  - An unreadable config skips the name check, and that refusal follows
    `mkdir`.

## R10: The bite while the change is open

As in 046 R7, a broken leg reads pending while MV-122 is `proposed`. In a
scratch clone of the finished branch, set MV-122 `active` and move the change
file aside. Then each of these must give exit 1:
- `config.grapher` back in consumer.ts (leg 2);
- `sddFor` back (leg 3);
- "any tool name" back in commands.md (leg 4);
- one note removed (leg 7).
