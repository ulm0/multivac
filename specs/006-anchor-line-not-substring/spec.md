# Feature Specification: The scan guard skips anchor lines, not every line saying @anchor

**Feature Branch**: `006-anchor-line-not-substring`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "Skip only genuine anchor comment lines when
scanning files for leg matches"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A forbidden pattern cannot be hidden by mentioning the anchor keyword (Priority: P1)

A rule forbids a pattern anywhere in a repository's source. Someone writes that
pattern anyway and appends a trailing comment that contains the word the anchor
grammar uses to introduce itself. The check reads the file, decides the line is
an anchor being written down rather than code, skips it, and reports the rule
satisfied. The gate is green and the forbidden thing is in the tree.

The same seven characters work on every rule of every forbidding kind, in every
file of every type, in every repository the tool checks. Nothing in the output
says a line was skipped, so the report is indistinguishable from a genuine pass.

**Why this priority**: This is the whole defect. The tool's single promise is
that a rule someone wrote down is actually checked against the code. A keyword
that switches the check off per line, silently, retracts that promise
everywhere at once — and it is easiest to reach for exactly when someone is
under pressure to make a gate go green.

**Independent Test**: Write a line that violates a forbidding rule and end it
with a comment containing the anchor keyword. Run the strict check: it must
fail and name the file and line. Remove the trailing comment: it must fail
identically. The two runs must not differ.

**Acceptance Scenarios**:

1. **Given** a source line that violates a forbidding rule and carries the
   anchor keyword in a trailing code comment, **When** the check runs, **Then**
   it reports the rule broken, names that file and that line, and exits failure.
2. **Given** the same line with the trailing comment removed, **When** the check
   runs, **Then** the verdict, the named file and the named line are the same as
   in scenario 1.
3. **Given** a source line that mentions the anchor keyword and matches a
   requiring rule, **When** the check runs, **Then** the match counts: the line
   is ordinary text and is read as such.

---

### User Story 2 - A written-down rule still does not count as the thing it describes (Priority: P1)

The stated law is a document, and every rule in it is followed by the lines
that say where to look and what to look for. Those lines contain the search
text itself. Other documents quote them too: the design document, the guide
page that teaches the grammar, and the check suite's own fixtures, which are
built by writing whole anchor lines into strings.

If those lines were read as ordinary content, the law would start checking
itself: a rule forbidding a word would find that word in the line that forbids
it, and a rule counting occurrences would count the line that describes the
count. Every such report would be about the rule being written down, not about
the code.

**Why this priority**: Equal to Story 1 and in tension with it. A fix that
closes Story 1 by reading everything would make the law unable to describe
itself, which is not a smaller failure — it is the same failure with the sign
flipped, and it would arrive as a wave of false reports that teach everyone to
ignore the tool.

**Independent Test**: Point a forbidding rule at a document that quotes the
anchor grammar, using search text that the quoted example itself contains. The
check must report the rule satisfied.

**Acceptance Scenarios**:

1. **Given** the stated law's own file and a rule whose search text appears
   only inside the lines that declare where to look, **When** the check runs,
   **Then** no match is reported from those lines.
2. **Given** a documentation page that quotes the grammar in an example, **When**
   a forbidding rule scans that page for text the example contains, **Then** the
   rule is reported satisfied.
3. **Given** a check-suite file that builds anchor lines as string literals,
   **When** any rule scans it, **Then** those lines contribute no matches, in
   the same way they contributed none before this feature.

---

### User Story 3 - The set of hidden lines and the set of declared anchors are the same set (Priority: P2)

Two parts of the system answer a question about the same line. The reader of
the law asks "does this line declare a rule's search instruction?". The scanner
asks "is this line an instruction rather than content?". Today those two
questions are answered by two independent tests written in two files, and they
disagree: the reader requires the grammar's comment form, the scanner requires
only the keyword.

Every line where they disagree is either a rule that is read but scanned — a
false report — or a line that is scanned by nobody while nobody declared it a
rule, which is the hole in Story 1.

**Why this priority**: It is the durable form of the fix rather than a symptom
of it. Ranked second because Stories 1 and 2 must hold on the day this ships
whether or not the two tests are physically the same expression; but if they
stay separate, the next person to adjust one reopens Story 1 without noticing.

**Independent Test**: Change the definition of what an anchor line looks like in
one place and observe that both the reading of the law and the scanning of files
change together.

**Acceptance Scenarios**:

1. **Given** the reader and the scanner, **When** either asks whether a line is
   an anchor line, **Then** both consult one definition, so no line can be
   declared a rule by one and content by the other.
2. **Given** that definition, **When** the stated law describes this behaviour,
   **Then** it is anchored to that definition, to the scanner's use of it, and
   to a check that fails if the old keyword test returns.

---

### Edge Cases

- A line that mentions the keyword inside a string literal in source code — for
  instance the reader's own error message, which quotes the grammar. It becomes
  ordinary content and is scanned. This is correct and it is a behaviour change
  that must be measured, not assumed harmless: if a rule now legitimately fires
  on such a line, that is a finding about the code.
- A line that carries an anchor comment *and* other text before it. It stays
  hidden in full, including the other text. The alternative — requiring the
  comment to begin the line — would expose roughly a hundred check-suite lines
  that quote whole anchors inside string literals, which is Story 2's failure.
- A line that forges the grammar's comment form inside a code comment. It stays
  hidden. This is the honest ceiling of a line-shaped test: it cannot tell a
  forged instruction from a quoted one, and the feature does not claim to.
- An anchor line written inside a fenced example block. The reader does not
  treat it as a live rule, but the scanner still hides it: hiding is about what
  a line looks like, not about whether the reader accepted it, and a fenced
  example is exactly the quotation Story 2 protects.
- Files split into statements rather than lines — the structured-query dialect
  the tool normalises before matching. Nothing there changes: that path never
  consulted the keyword test and does not consult the new one.
- A rule that counts occurrences over a file containing newly readable lines.
  Its number may change. The number is a fact about the code, so the recorded
  number is re-based and the rule's row says why.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When scanning a file line by line, the system MUST skip a line if
  and only if that line carries an anchor comment as the grammar defines one —
  the comment opener followed by the anchor keyword.
- **FR-002**: The system MUST NOT skip a line merely because the anchor keyword
  appears somewhere in it. A line of code, of prose, or of configuration that
  names the keyword MUST be read as ordinary content by every rule.
- **FR-003**: The test that decides FR-001 MUST be one definition consulted both
  where the stated law is read and where files are scanned, so the two cannot
  disagree about any line.
- **FR-004**: Every line that was hidden before this feature *and* carries an
  anchor comment MUST remain hidden — including quoted examples in
  documentation, in the design document, and in check-suite string literals.
- **FR-005**: The statement-oriented path for structured-query files MUST be
  unchanged: it neither gained nor lost a skip.
- **FR-006**: The behaviour MUST be covered by checks that fail when it is
  reverted: at minimum one for a code line that mentions the keyword being
  scanned, one for a genuine anchor comment line staying hidden, and one for a
  documentation page quoting the grammar not satisfying a rule.
- **FR-007**: The stated law MUST carry this behaviour as a dated row, saying
  what the guard is for and what it must not become, anchored to the definition
  itself, to the scanner's use of it, to the absence of the keyword test, and to
  the named check.
- **FR-008**: The full check of the project against its own law MUST be run
  after the change and every rule whose verdict moved MUST be reported and
  resolved on its merits — a rule that now fires legitimately is a finding, not
  a reason to widen the skip again.
- **FR-009**: The check MUST stay inside its existing operating constraints: it
  runs in a pre-commit hook and stays sub-second, it adds no runtime dependency,
  and it makes no network call.

### Key Entities

- **Anchor comment line** — a line carrying the grammar's instruction form: an
  HTML comment opener, the anchor keyword, then the rule identifier, where to
  look, and what to look for. It is an instruction about the code, never a
  sample of it.
- **Leg** — one instruction: a set of files and a search, evaluated in a mode
  that says what the result must be (present, absent, unique, a count, or one
  per file).
- **The guard** — the rule that anchor comment lines contribute no matches, so
  that an instruction's own search text never satisfies or breaks another
  instruction.
- **The reach** — how much the guard hides. Before this feature it was every
  line containing the keyword; it becomes every line carrying an anchor comment.

## Success Criteria *(mandatory)*

- **SC-001**: A line violating a forbidding rule is reported at the same file
  and line whether or not it carries a trailing comment naming the anchor
  keyword: the two runs produce the same verdict and the same exit code, in 100%
  of runs.
- **SC-002**: With the change in place, the project's own strict check over its
  own law exits success, and every rule whose verdict differs from before the
  change is enumerated with its cause.
- **SC-003**: Reverting the change in the source makes at least one named check
  fail, and the name of that check is stated.
- **SC-004**: A documentation page quoting the anchor grammar satisfies a
  forbidding rule whose search text the quoted example contains, in 100% of runs.
- **SC-005**: The project's own strict check completes in under one second on a
  developer machine, unchanged from before this feature.

## Assumptions

- **The guard's purpose is legitimate and stays.** The problem is its reach, not
  its existence. Removing it would make the stated law unable to describe itself
  and would produce false reports from the very document that defines the rules.
- **What counts as an anchor line is the grammar's business.** The definition
  already exists where the law is read; this feature does not invent a second
  one, it exports the one that exists. Any future change to the grammar's
  comment form therefore moves both answers together.
- **The comment may appear anywhere in the line.** Requiring it to begin the
  line would close a little more of the forgery ceiling, at the price of
  exposing about a hundred check-suite lines that quote whole anchor lines
  inside string literals — reopening the false-report class this guard exists to
  prevent, and making the scanner's answer differ from the reader's. The
  narrower reading is rejected for that reason and the residue is stated below.
- **A forged anchor comment in source code still hides its line.** No test on a
  line's shape can distinguish a forged instruction from a quoted one, so this
  feature does not claim to. What it removes is the case where an ordinary word
  in an ordinary comment does it — which is the case that happens by accident
  and the case that is deniable.
- **Newly readable lines are a fact to measure, not a risk to price in
  advance.** The count of them is small and enumerable before the change; which
  rules they move is decided by running the check, not by argument.
