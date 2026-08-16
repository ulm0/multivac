# Interview: a brain from scratch

There is no code to read. The law lives in the person's head and the
interview is how it gets out. You are extracting decisions, not designing
the product for them. Ask, compress, read back, file as proposed.

## What to elicit, in this order

1. **The product's loop.** What happens, end to end, on the happy path?
   One paragraph in their words, then your read-back in one sentence. Until
   you can state the loop, ask nothing else — every later answer hangs off
   it.
2. **The boundaries.** What are the surfaces — services, stores, external
   APIs, clients? What talks to what? This becomes the first map page and,
   later, the repos in `.multivac/config.yml`. Names now, technology only
   if they volunteer it.
3. **The non-negotiables, and WHY.** "What must never happen, even if the
   code would allow it?" For each: who decided, and what breaks if it's
   violated. The WHY is the row's authority and the journal's first entry —
   a rule without a why is a convention, not law. Push once ("is that a
   preference or a promise?"), then take their answer.
4. **What is published or promised externally.** Pricing pages, API docs,
   contracts, SLAs. These outrank everything internal: the code can change
   by decision, a published promise only by a site change. Mark them with
   the project's highest authority.

## How to ask

- One question at a time. Concrete over abstract: "a user pays twice —
  what happens?" beats "what are your idempotency requirements?".
- Read back every candidate rule in your words and get a yes before filing
  it. A nod to their own words is worthless; a yes to your restatement is a
  validation.
- Capture the why verbatim when it's good. You will not reconstruct it
  later.

## When to stop

**Decide the first slice only — never spec ahead of reality.** Stop when
you have: the loop, the boundary list, the non-negotiables with their whys,
and enough to define one thin end-to-end slice. Everything else is decided
inside future changes, when reality pushes back. A speculative spec is a
brain that lies from day one — the exact thing verify exists to prevent.

## How output lands

- **Door sections**: the loop and the boundary list go into the brain
  door's managed block — what any agent must know before acting.
- **Map page**: the boundaries, one page.
- **Proposed claims**: every non-negotiable becomes a `proposed` row in the
  law table, authority suggested by you, enacted by the human
  (accept / correct / discard, same as discovery). Most rows have no
  anchor yet — there is no code to anchor to. That is legal and counted;
  anchors arrive with the code that makes the claim true.
- **The first change**:

  ```
  mvac change new "first slice"
  ```

  Declare the repos (they may not exist — greenfield apply creates them,
  first commit and door included), the landing order, and the claims the
  slice makes true with their anchors. From here follow the change
  lifecycle (`change.md`). The brain precedes the code, and the first
  session inside any new repo already knows the law.
