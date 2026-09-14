# Research: The site speaks to users

Sources: this repo at `d167f30` (`change open`), a Hugo build of it into a
scratch directory, and `multivac count` for every leg. The law for house style
is MV-111, MV-118 and MV-120, and the archived `the-record-earns-its-length`.

## R0: What is there

- **IDs**: `git grep -ohE 'MV-[0-9]+' -- site/content` finds 129 IDs on 121
  lines. `count 'brain:site/content/** /MV-[0-9]+/'` agrees: 121.

  | Page | IDs | Lines |
  | --- | --- | --- |
  | reference/commands.md | 52 | 46 |
  | reference/graphers-and-sdd.md | 30 | 29 |
  | reference/configuration.md | 14 | 14 |
  | reference/hooks.md | 7 | 7 |
  | concepts/composition.md | 6 | 6 |
  | reference/integrations.md | 6 | 5 |
  | concepts/invariants.md | 4 | 4 |
  | guide/install.md | 3 | 3 |
  | concepts/the-change.md | 2 | 2 |
  | _index.md, concepts/distribution.md, guide/getting-started.md, guide/session-zero.md, guide/writing-anchors.md | 1 each | 1 each |

- **By kind (lines)**:
  - 71 trailing citations: the sentence stands once `(MV-n)` is gone.
  - 25 sentences built on an ID, which need rewriting: composition.md:27–39
    (6), invariants.md:31, :43, install.md:103, :105, commands.md:30, :303,
    :313, :596, :634, :919, configuration.md:209,
    graphers-and-sdd.md:333, :343, :468, hooks.md:39, :277,
    integrations.md:11, :46, :128.
  - 15 headings (R6).
  - 9 inside code blocks (R5).
  - 1 HTML comment (`_index.md:23`), which the minified build strips.
- **Links**: `count 'brain:site/content/** /mv-[0-9]+/i'` finds 125 lines,
  which is the 121 plus 4 links to ID-spelled anchors (R6).
  `count 'brain:site/content/** /\]\(#\)/'` finds 1: `configuration.md:209`.
  `git grep -E '#[a-z0-9-]*mv-[0-9]+'` finds no link outside `site/content`
  except a done task in `specs/044`, which is a record.
- **The changelog**: `site/hugo.yaml` mounts `../CHANGELOG.md` at
  `content/docs/changelog.md`. `git ls-files site/content` lists 23 files, and
  none is the changelog. A glob over `site/content/**` cannot reach it.
- **Built output**: IDs appear in 19 built files today: 13 pages, the changelog
  page, 4 feeds (`docs/` and its three sections) and `en.search-data.json`.
  Heading ids spelled from an ID: 15.

## R1: Principle I is redefined, so MAJOR (3.0.0)

- **Decision**: amend Principle I in place, bump 2.0.2 → 3.0.0, prepend a Sync
  Impact Report, and set the footer to 3.0.0, last amended 2026-09-14 (MV-120).
- **Why MAJOR**: Governance says "MAJOR removes or redefines a principle, MINOR
  adds one or materially expands guidance". Principle I is NON-NEGOTIABLE, and
  its MUST ("cited by its ID") changes scope. For one class of document it is
  inverted: a site page that cited an ID complied yesterday and violates today.
  That is a redefinition. The precedent is 2.0.0, which this file called MAJOR
  for "a constraint is redefined".
- **MINOR, rejected**: the amendment does not only add guidance. It narrows a
  MUST and adds a prohibition. Calling that an expansion would hide the
  inversion from the next reader of the report.
- **The text** (replaces the first paragraph; the second paragraph and one
  rationale sentence are new):

  > Every rule this project states MUST be anchored to the source that makes it
  > true, and MUST be cited by its ID where rules are kept: the law table and
  > the brain's own records — this constitution, change files, specs, the
  > changelog, the doors, source and tests. A paraphrase ages silently; an ID
  > can be verified. Prose that restates a rule without naming it does not bind,
  > and an unanchored claim is named in `verify`'s output rather than counted as
  > passing.
  >
  > The documentation site is not one of those records. It explains behaviour to
  > the people who use multivac, in plain words: it names no law ID and binds
  > nothing. A rule changes at its row, never on a page, and the change that
  > moves a rule moves every page that explains it.
  >
  > Rationale: *(existing text)* An ID is worth its noise only to a reader who
  > can open the row it names, and the site's reader is using the tool, not
  > amending its law.

- **Sync Impact Report**:

  ```text
  Version change: 2.0.2 → 3.0.0 (MAJOR — a principle is redefined: Principle
  I's citation duty stops at the documentation site, which now names no law ID)
  Modified principles:
    - I. A Claim Nobody Checks Decays: IDs are scoped to the law and the
      brain's own records. A new paragraph says the site explains behaviour in
      plain words, names no ID and binds nothing, and still moves with the rule
      it explains. MV-126 states the rule; MV-111 carries the amendment.
  Modified sections: Governance footer, now 3.0.0, last amended 2026-09-14.
  Templates requiring update: none — no template says where IDs are cited
  Follow-up TODOs: none
  ```

- **No retired phrase**: "MUST be cited by its ID" survives, now with a scope,
  so there is no dead sentence for an `absent` leg (MV-111). The only other
  copies, `AGENTS.md` and the brain door's "a rule quoted without its ID does
  not bind", stay true: the site binds nothing.

## R2: MV-111's note

- **Decision**: one inline note, placed after "…changes the restatement in the
  same commit." and before "**And the half that makes it mechanical**":

  > **Amended 2026-09-14 by MV-126**: *everywhere else cites the ID* stops at
  > the documentation site, which explains in plain words, names no ID and binds
  > nothing. A page there that explains a rule is still a restatement, so the
  > amendment that changes the rule still changes the page.

- **Rationale**: the rule's second half, and its `absent`-leg half, keep
  reaching the site. Only the citation clause stops there. MV-111's own
  `count=6` leg counts `Amended 2026-08-19 by MV-111` and is unaffected.

## R3: MV-126, the row and its legs

- **Statement** (331 words, no pipe, no `Amended … by MV-126` literal):

  > **The documentation site explains behaviour to users in plain words and
  > names no law ID; a rule is stated and cited by ID in the law and in the
  > brain's own records.** Measured 2026-09-14: the 23 tracked pages under
  > `site/content/` carried 129 IDs on 121 lines of 14 pages, 15 of them in
  > headings, and 4 links to anchors spelled from one. None linked to its row,
  > and the one written as a link, `[MV-90](#)`, went nowhere. **The rule.** A
  > page under `site/content/` says what multivac does and why, and binds
  > nothing. No page names an ID in prose, a heading, a comment or quoted
  > output, and no link targets `#` or an anchor spelled from an ID. Dropping an
  > ID never drops what it explained: the behaviour stays on the page, in words.
  > Quoted output keeps the tool's words and shows an ID it prints as `…`; a
  > reader's example row takes an `INV-` ID. A page that explains a rule is
  > still a copy of it, so it moves with the rule's row, and a retired phrase's
  > `absent` leg still reads `site/content/**` (MV-111). The changelog is not
  > such a page: `site/hugo.yaml` mounts `CHANGELOG.md` at build time,
  > `git ls-files site/content` does not list it, and MV-78 and MV-120 require
  > its IDs. Principle I of the constitution states the same split. **What is
  > mechanical**: a case-insensitive `absent` leg on an ID over
  > `site/content/**`, which also catches an anchor spelled from one; an
  > `absent` leg on a Markdown link to `#`; and a count on the note in MV-111.
  > **Ceilings.** The legs read tracked files under `site/content/` only, so a
  > layout, partial, shortcode or `hugo.yaml` that renders an ID passes, and so
  > would `CHANGELOG.md` copied in rather than mounted. An HTML `href="#"`
  > passes, and so does a link to a heading that no longer exists, since
  > nothing checks fragments. A page's copy of a rule is found by its words,
  > never again by its ID. The tool's own output still prints IDs.

- **Row**: `| MV-126 | <statement> | specified | proposed | 2026-09-14 | [changes/the-site-speaks-to-users.md](changes/the-site-speaks-to-users.md) |`.
  `change close` rewrites the link to the archive.
- **Legs**, each dry-run with `multivac count` at `d167f30`:

  | # | Leg | Now | After |
  | --- | --- | --- | --- |
  | 1 | `<!-- @anchor MV-126 brain:site/content/** /mv-[0-9]+/i absent -->` | 125 lines, 14 files | 0 |
  | 2 | `<!-- @anchor MV-126 brain:site/content/** /\]\(#\)/ absent -->` | 1 | 0 |
  | 3 | `<!-- @anchor MV-126 brain:.multivac/invariants.md /Amended 2026-09-14 by MV-126/ count=1 -->` | 0 | 1 |

- **One leg, not two, for IDs and anchors**: `i` makes leg 1 catch
  `#the-graph-gate-mv-90` as well as `MV-90`. Today it matches nothing else:
  125 is exactly 121 plus the 4 links.

## R4: Legs that read the lines this change touches

- **Method**: every leg in the brain whose glob reaches a tracked file under
  `site/content/` was parsed with `collectBrainAnchors`, filtered with
  `makeMatcher`, and run through `matchesInFile`. That gives 56 legs.
- **An ID in the pattern**: 1. MV-121's `absent` alternation includes
  "`doors`, which MV-01 keeps", and it stays at 0.
- **An ID on a matched line**: 3 legs, 4 lines, and none breaks if its phrase
  stays:

  | Leg | Line | Keeps |
  | --- | --- | --- |
  | MV-53 `/What each run reads/` present | commands.md:338, the heading | the heading's words |
  | MV-79 `/the way git reads it/` present | hooks.md:192 | the phrase |
  | MV-81 `/ungateable/` present | invariants.md:29 (heading), :31 | "ungateable" at least once |

- **MV-31**: the three heading legs (`count=9`, `11`, `8`) match no line with an
  ID, and no command, config-key or harness heading is renamed.
- **Absent legs a rewrite could trip**: MV-84 (`[0-9]+\.[0-9]+\.[0-9]+`),
  MV-111, MV-118, and MV-120 … MV-125 over `site/content/**`. `verify --strict`
  after the edits is the check.
- **Decision (d)**: no leg is expected to break, so no row is re-pinned or
  retired. If one does, it is re-pinned to the surviving words, or retired, with
  a `2026-09-14 by MV-126` note on its row and MV-126's count raised to match.

## R5: Quoted output

- **Decision**: where the tool prints an ID about its own law, the ID becomes
  `…` and nothing else moves. A reader's example row takes an `INV-` ID, as the
  site's other examples do (INV-01 … INV-90). A config example drops its
  comment's ID.

  | Line | Today | After |
  | --- | --- | --- |
  | getting-started.md:118, commands.md:310 | `…composed; MV-81's check reads the index against HEAD` | `…composed; …` |
  | commands.md:309 | `enact     MV-91 → active, alone…` | `enact     INV-07 → active, alone…` |
  | commands.md:321 | `REFUSED MV-91 was active and is gone` | `REFUSED INV-07 was active and is gone` |
  | commands.md:642 | `…nothing projected (MV-125)` | `…nothing projected …` |
  | commands.md:696 | `…git identity (MV-04), so … by design (MV-81), not…` | `…git identity …, so … by design …, not…` |
  | commands.md:1191 | `…as unclosed (MV-80), here and in CI…` | `…as unclosed …, here and in CI…` |
  | configuration.md:297 | `…through a change (MV-97)` | `…through a change …` |
  | configuration.md:509 | `# …never written (MV-125)` | `# …never written` |

- **Rewording, rejected**: a quote that says what the tool does not print is a
  false quote. `…` is already the site's elision mark (commands.md:321, :696).
- **Changing the tool's output, rejected**: it is out of scope (outside
  `site/`), and it is a separate decision about what the CLI tells its users.

## R6: Headings and the links to them

- **Decision**: each heading keeps its words without the ID. Hugo's ids after
  the change:

  | Page | Heading id after |
  | --- | --- |
  | concepts/distribution.md:10 | `what-the-consumer-door-carries` |
  | concepts/invariants.md:29 | "That rule is ungateable, and the law says so": `that-rule-is-ungateable-and-the-law-says-so`, keeping "ungateable" (R4) |
  | concepts/the-change.md:108 | `planned--a-change-that-has-not-started` |
  | concepts/the-change.md:153 | `the-ritual-arrives-with-candidates` |
  | reference/commands.md:202, :338, :657, :885, :996, :1105, :1247 | `re-running-it`, `what-each-run-reads`, `multivacflowmd--what-your-declarations-oblige`, `sync`, `a-brain-behind-its-channel`, `what-can-be-worked-at-once`, `the-graph-gate` |
  | reference/configuration.md:45 | `changing-it-needs-an-open-change` |
  | reference/graphers-and-sdd.md:328, :350 | `a-declared-grapher-obliges-something`, `and-it-is-part-of-the-repository` |
  | reference/hooks.md:26 | `which-multivac-runs` |

- **Collisions**: on each page, none of these headings duplicates another
  (measured), so Hugo adds no suffix.
- **Links**:

  | Link | After |
  | --- | --- |
  | concepts/claims-and-anchors.md:46 `commands/#what-each-run-reads-mv-53` | `#what-each-run-reads` |
  | guide/running-changes.md:55 `the-change#planned--a-change-that-has-not-started-mv-89` | `#planned--a-change-that-has-not-started` |
  | reference/graphers-and-sdd.md:337 `commands#the-graph-gate-mv-90` | `#the-graph-gate` |
  | reference/hooks.md:227 `#which-multivac-runs-mv-92` | `#which-multivac-runs` |
  | reference/configuration.md:209 `[MV-90](#)` | `[the graph gate](commands#the-graph-gate)` |

- **Check**: after the build, each target id is present in its page's HTML.

## R7: Considered and not done

- **An `absent` leg on `href="#"`**: no page has one, and a raw-HTML dead link
  is outside what the user named. Stated as a ceiling instead.
- **A `present` leg per fixed link**: it would pin 5 spellings that nobody
  would revert on purpose, while a heading renamed next week would still break
  its link. The ceiling says nothing checks fragments.
- **Extending MV-120's footer leg to forbid `2.0.2`**: MV-120 states that it
  forbids the values measured, not the relation. Moving its leg would be an
  amendment of MV-120 that this rule does not need.
- **A line in `CONTRIBUTING.md`'s "Touching the site"**: it is outside `site/`,
  and once MV-126 is active its leg refuses the commit and names the row,
  which is where a contributor meets it.
- **Keeping IDs in the HTML comment**: the build strips it, but the leg reads
  source files, and a maintainer comment belongs in `site/layouts/` or
  `site/assets/`, which stay out of scope.

## R8: What the review corrected

The quotes in R1 to R3 are the drafts; the committed text is the record.

- **Scope in every copy**: Principle I, its Sync Impact Report and MV-111's
  note said "the documentation site", whose changelog page carries IDs. Each
  now says the site's own pages, everything under `site/content/`, and
  Principle I adds that the mounted changelog keeps its IDs. Its list of
  records, which left out `DESIGN.md`, `CONTRIBUTING.md` and the skill, became
  the boundary itself: every record outside those pages. The report names the
  new rationale sentence.
- **MV-126**: the changelog keeps its IDs because MV-120 requires an entry to
  name the rows it made law, and MV-78 makes the page that one file. The
  ceiling on a copied-in `CHANGELOG.md` is gone: committed, leg 1 refuses it.
  A ceiling says the brain door and skill rule 3 still ask for IDs everywhere.
  A fourth leg pins Principle I's paragraph:

  `<!-- @anchor MV-126 brain:.specify/memory/constitution.md /^The documentation site's own pages, everything under/ unique -->`
  (1 match; bitten: reworded, exit 1).
- **Pages**: graphers-and-sdd.md drops "The version measured is recorded in
  multivac's own law", which pointed at a record the reader cannot follow.
  The `law` line's sentence asks its question in words, install.md names the
  release job as what refuses, bold lead sentences end inside the bold, and
  the paragraphs a rewrite left ragged are rewrapped. The-change.md's three
  links resolved under their own page and 404ed, and commands.md's `#doctor`
  matched no id; all four now land, the `flow.md` one on its heading.
