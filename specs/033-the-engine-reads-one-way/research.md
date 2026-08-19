# Phase 0 — Research: The engine reads one way

## Measurement 1 — the bare class, reproduced

```txt
$ node -e "import('./dist/lib/regex.js').then(m=>{const r=m.compileAnchorRegex('PIN[:digit:]');console.log(r.source, r.test('PIN4'))})"
PIN0-9 false
```

`PIN[[:digit:]]` compiles to `PIN[0-9]` and matches `PIN4`. The one-bracket
form compiles clean and matches only the literal text `PIN0-9`.

**Decision**: refuse a `[:name:]` that is not immediately wrapped in `[` `]`.

**Rationale**: it is a translation mistake, not a pattern. GNU grep ships a
dedicated error for this exact input — *character class syntax is [[:space:]],
not [:space:]* — and MV-05's whole claim is that the dialect gate catches
dialect mistakes at write time.

**Alternatives considered**: translate it anyway, as if the brackets were there
(rejected — guessing at intent, and the guess is invisible in the law);
warn and continue (rejected — a warning on a blocking tombstone is a false green
with a footnote).

## Measurement 2 — what else the gate lets through

The gate is an eight-entry denylist over escapes. Measured against the corpus of
this brain: **zero** anchors use `(?`, zero use a lazy quantifier, zero use a
backreference, and zero contain a bare `[:class:]`.

**Decision**: refuse `(?`, lazy quantifiers, backreferences, and alphabetic
escapes with no ERE meaning — and ship the measurement above as the reason it
is safe.

**Rationale**: each of them means something in JS and something else, or
nothing, to git grep. An anchor whose meaning depends on which engine reads it
is not a claim about the code.

**Alternatives considered**: an allowlist of ERE syntax (rejected — a
hand-written ERE parser is the third dependency in disguise); leave it
(rejected — the row advertises "POSIX ERE, enforced", and an eight-entry
denylist is not that).

## Measurement 3 — CRLF

`matchesInFile` splits on `'\n'`. Every line of a CRLF file therefore ends in
`\r`, so `/foo$/` never matches and an exact-line pattern never matches.

**Decision**: split on `/\r?\n/`.

**Rationale**: it is the smallest change that makes a line a line, and it leaves
line NUMBERS identical, which the verdict lines print.

**Alternatives considered**: strip `\r` from the text before splitting
(rejected — it would also alter the bytes an SQL statement scan sees); normalise
at read time in the scanner (rejected — the scanner's job is bytes, and two
readers would then disagree about what a byte is).

## Measurement 4 — count versus verify

`count` builds its own handles under the comment *"targets exactly as verify
builds them"*, and constructs `new RepoScanner(t.dir)` with no ref. `verify`
resolves each repo through `resolveSources`, which reads a sibling at its
channel ref (MV-53) and the brain at its working tree, and prints one `read`
line per repo.

**Decision**: export `resolveSources` and have `count` use it, ref included, and
print the same lines.

**Rationale**: the comment already says count is copying verify. Copying is what
drifted; calling is what cannot. It also deletes count's handle loop.

**Alternatives considered**: have count print a `read` line of its own saying it
read working trees (rejected — it documents the disagreement instead of ending
it, and the number still goes into the law wrong).

## Constitution and law

- **MV-05** — the dialect gate rejects PCRE shorthand at write time with a
  translation hint. Widened, and the row is amended to say what it now covers.
- **MV-53** — each context verifies what it is responsible for. `count` joins it
  rather than approximating it.
- **Constitution IV** — no dependency; one shared function replaces a copy.
