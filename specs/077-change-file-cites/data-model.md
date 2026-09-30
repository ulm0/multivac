# Data Model: The change file cites, never restates

No new file. The change file's `claims` gain a bare form and lose nothing they held; one parse
option, one pure predicate with eleven kinds, one abandon predicate, one channel helper and two
fields on verify's in-memory structures. Every `file:line` is `62d4588`'s, re-found at apply.

## The change file (src/change/file.ts)

```ts
export interface ChangeClaim {
  id: string;
  /**
   * Legacy (MV-150): a restatement of the row, read and written back
   * unchanged, never created. The row states the rule; a claim is its ID.
   */
  statement?: string;
}

/** MV-150: what a claim entry may hold — its ID, and a legacy statement read back unchanged. */
const CLAIM_KEYS = ['id', 'statement'];
/** Every frontmatter key the lifecycle carries through a rewrite. */
const KNOWN_KEYS = [ /* unchanged */ ];

/** How a reader treats a key inside a claim that is not in CLAIM_KEYS. */
type ClaimKeys = 'name' | 'refuse';

export function normalizeChange(raw: unknown, label: string, claimKeys: ClaimKeys = 'name'): ChangeFile;
export function parseChange(text: string, label = 'change file', opts: { claimKeys?: ClaimKeys } = {}): ParsedChange;
```

`CLAIM_KEYS` sits above `KNOWN_KEYS`' doc comment, so that comment stays on `KNOWN_KEYS`
(MV-117's `/const KNOWN_KEYS/` and MV-137's `/'claims', 'sdd_skipped',/` legs hold).

### Reading a claim entry

| Entry | Read as | Written back |
| --- | --- | --- |
| `MV-1` (a non-empty string) | `{ id: 'MV-1' }` | `- MV-1` |
| `{ id: MV-2 }` | `{ id: 'MV-2' }` | `- MV-2` |
| `{ id: MV-13, statement: "legacy: prose # kept" }` | `{ id, statement }` | the same map, byte for byte (`lineWidth: 0`, MV-15) |
| `{ id: MV-4, statment: … }` (a key outside `CLAIM_KEYS`) | `'name'`: `{ id: 'MV-4' }` and the notice; `'refuse'`: the error | never — only a `'refuse'` reader writes |
| not a list | error `"claims" must be a list of row IDs — claims: [<ID>]` | — |
| `""`, a number, a map with no non-empty string `id`, a non-string `statement` | error `each claim is a row ID — claims: [<ID>]; the row states the rule` | — |

The bare branch is spelled `if (typeof c === 'string' && c !== '')` (MV-150's leg). The stray-key
message is built once, `claim <ID>: unknown key "<k>" — a claim is its row's ID; state the rule in
the row`, and used by both modes (one `unique` leg): `'refuse'` pushes it into the errors thrown
as `<label>: … — fix the frontmatter`; `'name'` warns `<label>: <message> (read without it here;
every command that rewrites the file refuses it until it goes)` beside MV-117's top-level notice.
A malformed entry (the last two rows) is refused in both modes, as today.

**Who passes `'refuse'`**: `loadChange` (every `change` subcommand, `--abandon` and `change new`'s
promotion) and `roadmap sync` (src/commands/roadmap.ts:226, which writes the file back at :271).
Everyone else keeps `'name'`: verify's `openChangeClaims` (:99) and `openChangeSlugs` (:311), the
`roadmap` listing (:77) and `roadmap add`'s refusal of an existing file (:146), `renderEcosystem` (src/doors/ecosystem.ts:91) and the code gate's
`readChange` (src/lib/code-in-change.ts:131).

### Writing

`serializeChange` writes `claims: change.claims.map((c) => (c.statement === undefined ? c.id :
{ id: c.id, statement: c.statement }))`; `lineWidth: 0` and `quotedRewrite` stay (MV-15).

### The scaffold

`scaffoldChange`'s body: the example block's claim line becomes `    # claims: [<ID>] — the rows
close verifies; each row states its own rule`; the blank line and the two "Statements are prose"
lines after it go; MV-110's DROPPED sentence and MV-146's closing sentence stay byte for byte.
`scaffoldPlanned` (MV-89) is unchanged: `claims: []`.

## The citation predicate (src/change/reserve.ts)

```ts
import { ChangeError, changeRel, type ChangeFile } from './file.js'; // no cycle: reserve already imports file.js

/** A row still carrying the statement `change new` scaffolds states no rule yet (MV-45). */
export const stillReserved = (r: ClaimRow): boolean => r.statement.startsWith('RESERVED by change ');
/** MV-45's "never used", one predicate: releaseUnused drops it, citeLines exempts it. */
const unused = (r: ClaimRow, slug: string, anchored: Set<string>): boolean =>
  r.state === 'proposed' && owns(r, slug) && !anchored.has(r.id) && stillReserved(r);
/** The slug a RESERVED statement names, as `reserveId` writes it (:163). */
const reservedBy = (r: ClaimRow): string | null => /^RESERVED by change (\S+) — /.exec(r.statement)?.[1] ?? null;

export type CiteKind =
  | 'no-row' | 'short-row' | 'retired' | 'retiring' | 'undeclared' | 'reserved-elsewhere'
  | 'unstated' | 'orphan' | 'not-new' | 'unclaimed' | 'unanchored';

export interface CiteLine {
  id: string;
  kind: CiteKind;
  /** Refuses close; the others are said and never gate. */
  gates: boolean;
  /** `<ID>: <clause>` — contracts/cli-output.md. */
  text: string;
}

/** Where a parsed anchor names a row: its claim ID and the brain-relative file it is written in. */
export type AnchorSite = { claimId: string; file: string };

/** The declaration half: what `change plan` can say before anything is built or stated. */
export const DECLARATION_KINDS: readonly CiteKind[] = ['no-row', 'short-row', 'retired', 'undeclared', 'reserved-elsewhere'];

export function citeLines(rows: ClaimRow[], change: ChangeFile, anchors: readonly AnchorSite[]): CiteLine[];
export function abandonLines(rows: ClaimRow[], change: ChangeFile): string[];
```

`releaseUnused`'s filter becomes `.filter((r) => unused(r, slug, anchored))`, the same condition
as MV-45; its signature is unchanged. The literal `startsWith('RESERVED by change ')` exists only
inside `stillReserved` (MV-45's leg must not move).

### `citeLines`, per claim (first match, in order)

`byId` from `rows`; `declared = adds ∪ touches ∪ retires`; `anchored` = the set of `anchors`'
claim IDs; `outside` = the claim IDs of anchors whose `file`, '/'-separated first (a win32 `join`
is not; `changeRel` is), is not `changeRel(change.slug)`.

| # | kind | when | gates |
| --- | --- | --- | --- |
| 1 | `no-row` | no row with the ID | yes |
| 2 | `short-row` | `state === '' && statement === ''` (fewer than six columns, MV-119) | yes |
| 3 | `retired` | `state === 'retired'` and the ID is not under `retires` | yes |
| 4 | `retiring` | the ID is under `retires` and `state !== 'retired'` | yes |
| 5 | `undeclared` | the ID is not in `declared` | yes |
| 6 | `reserved-elsewhere` | `stillReserved` and `reservedBy` names another slug | yes |
| 7 | `unstated` | `statement === ''`, or `stillReserved` by this slug; the clause's tail depends on whether the claim carries a legacy statement | yes |
| 8 | `orphan` | the ID is in `anchored` and not in `outside` | yes |

A claim of a row under `retires` that reads `retired` passes 1–8 and is evaluated on its absent
legs by close's anchor gate, as today (research.md R5).

### `citeLines`, per owned row

`owned = adds ∪ { r.id | r.state === 'proposed' ∧ owns(r, slug) }`. For each owned ID that no
claim cites and that has no line yet, skipping IDs with no row:

| kind | when | gates |
| --- | --- | --- |
| (none) | `unused(r, slug, anchored)` — released at close | — |
| `not-new` | the ID is under `adds` and `state !== 'proposed'` | yes |
| `unclaimed` | `state === 'proposed'` and the ID is in `anchored` | yes |
| `unanchored` | `state === 'proposed'`, `statement !== ''` and not `stillReserved` | no |

### `abandonLines`

`owned = adds ∪ { r.id | owns(r, slug) }`; one line per row with `owned.has(id)`, `state ===
'proposed'`, `statement !== ''` and `!stillReserved(r)`. Pure.

## The lifecycle (src/commands/change.ts)

| Piece | Shape |
| --- | --- |
| imports | `abandonLines`, `citeLines`, `DECLARATION_KINDS`, `stillReserved`, `type AnchorSite` from `../change/reserve.js`; `collectBrainAnchors` and `parseClaimRows` in one import from `../anchor/parse.js`; `brainChannel` from `../lib/config.js`; `lsFiles` only while another caller uses it |
| `brainAnchorSites(brain)` | the one `await collectBrainAnchors(brain)`; returns `{ claimId, file }[]` (replaces `anchoredClaimIds`' text scan, :627-640) |
| `anchoredIds(sites)` | `new Set(sites.map((a) => a.claimId))` — for plan's "no anchor" line and both releases |
| `statedUpstream(brain, cfg, ids)` | `ref = brainChannel(cfg)`; `revParse`; `git show <sha>:.multivac/invariants.md`; `parseClaimRows`; the IDs stated there (non-empty, not `stillReserved`); `behind` from `git rev-list --count HEAD..<sha>`; `null` when the ref does not resolve, the file cannot be read, or none is stated. Returns `{ ref, behind, ids }` |
| `citeText(line, upstream)` | an `unstated` line whose ID `upstream` states becomes the pull clause; every other line is its `text`. The one place the pull clause is spelled, read by land and close |
| `channelEvidence` (:359) | `const ref = brainChannel(cfg);` in place of `cfg.channel ?? DEFAULT_CHANNEL` |
| `cmdNew` (:913) | the third edit, FR-005 |
| `cmdPlan` (:1004-1009) | one site read; the "no anchor" loop over `anchoredIds`; the legacy notice per legacy claim; `citeLines` filtered to `DECLARATION_KINDS`, each said as `claim <text> — close refuses this` |
| `cmdLand` (:1227-1287) | when every repo is landed: `citeLines` gating lines, `statedUpstream` when one is `unstated`, `  close refuses until: <citeText>` after the armed line, the final line's variant |
| `cmdClose --abandon` (:1306-1346) | after the claims refusal: `abandonLines` refuses; the anchor read stays before the archive and feeds `releaseUnused` |
| `cmdClose` (:1392-1426) | after the unlanded check: one site read; `readLaw`; `citeLines`, always — with no claims too, since `not-new` and `unclaimed` are per owned row; `statedUpstream` when one is `unstated`; `closeGate` over the claims with a row (none evaluated when no claim has one; `no claims declared — nothing to verify` only when `claims` is empty); the red line, or the MV-117 orphan text for the `orphan` lines; then non-gating lines (`say`), gating lines but `orphan` (`warn`, through `citeText`), the summary; return 1 once; the second anchor read (:1426) goes and `releaseUnused` takes `anchoredIds(sites)` |

## The channel (src/lib/config.ts)

```ts
/**
 * MV-150: the brain's own channel — its entry's `channel:` (the `brain` key, else the
 * brain==code entry), else the global, else origin/main, as MV-53 reads every other entry.
 */
export const brainChannel = (cfg: Config): string => {
  const own = cfg.repos.brain ?? Object.values(cfg.repos).find((e) => e.isBrain);
  return own ? channelRef(cfg, own) : cfg.channel ?? DEFAULT_CHANNEL;
};
```

Read by `channelEvidence` and `statedUpstream` (change.ts) and verify's `bChannel` (verify.ts:712).
A brain whose own entry names no `channel:` resolves exactly what it resolved before.

## Verify (src/commands/verify.ts)

```ts
interface OpenChanges {
  pendingBy: Map<string, string>;
  landed: Set<string>;
  /** The open change files themselves, by slug — what MV-80's line asks close's citation gate about. */
  changes: Map<string, ChangeFile>;
}

interface Evaluated {
  // ...existing
  /** MV-150: per finished slug, the lines `change close` would refuse on — empty when it would not. */
  closeRefusals: Map<string, string[]>;
}
```

`openChangeClaims` (:83-118) sets `out.changes.set(change.slug, change)` for open changes only;
the claim-scoped literal (:934-936) gains `changes: new Map()`. After `finished` (:944), when it is
non-empty, `closeRefusals` holds, per finished slug, `citeLines(rows, change, collected.anchors)`
filtered to gating lines, their `text`: the rows already read at :881, the full anchor list
already collected at :870, no extra IO. `finishedChanges`' signature is unchanged. The finished
line (:1184-1192) reads it: contracts/cli-output.md. Verify never reads the channel for it.

## The words

| Where | Change |
| --- | --- |
| src/doors/flow.ts:50 → .multivac/flow.md | the gate line of FR-017 |
| site/content/docs/guide/running-changes.md | :82, :121, :140-143, :160-162, after :300 (land names what close refuses), :369-370, :391 |
| site/content/docs/reference/commands.md | :1255, `plan` (the legacy notice and the declaration lines), :510 (the refusing finished variant), near :1534 (the land notice), after "Then re-verifies" ~:1564 (the citation block, its sample, the pull, the unanchored line, "every refusal in one run" — the site leg), `--abandon` ~:1642 (the stated-row refusal; MV-45's `used meaning the rule was stated` kept) |
| site/content/docs/concepts/the-change.md:57-61 | "every claim cites a row this change adds, touches or retires, and that row states its rule" joins the list |
| skills/multivac/references/change.md | :104-106 (field 4), :175-180 (what close refuses), :315 (the retire step) |
| skills/multivac/SKILL.md:76-78 | item 4's last sentence |
| DESIGN.md | :204-212 (heading and paragraph), :783-784, :163 (FR-021) |
| site/content/docs/concepts/philosophy.md:90, the-change.md:84 | the "relaxed in code instead of" copies of what close checks (FR-021) |
| .specify/memory/constitution.md | ONE amendment (FR-021, T069): Principle III, :47, and the Governance Compliance line, :132; Version 3.0.1 → 3.0.2; Last Amended 2026-09-29 |
| CHANGELOG.md | Unreleased, "Changed — read before upgrading" (FR-020), and its lead-in count |
| .claude/skills/multivac/** | re-projected by `multivac doors` from the rebuilt dist, never hand-edited |

## State transitions

A claim's row moves `RESERVED by change <slug>` → stated (the change states it) → enacted (a
human, MV-81). The citation gate reads the first two; close refuses while the row is RESERVED,
names the pull when the channel has already moved it, and passes once it is stated here. A
reservation that is never stated and never anchored is released at close (MV-45), and raises no
citation line.
