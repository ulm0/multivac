# Tasks: A pasted link renders as itself

**Tests**: included, per the constitution.

## Phase 1: Setup

- [X] T001 Confirm `pnpm test` green and `verify` at 0 blocking broken

## Phase 2: The declarations 🎯

- [X] T002 Draw the card image once and commit it to site/static/og.png — the mark on the site's ground, wordless, 1200x630
- [X] T003 Declare `params.description` in site/hugo.yaml — the site's own sentence, the fallback for any page without one
- [X] T004 Declare `params.images` in site/hugo.yaml pointing at the committed card
- [X] T005 Enable the crawler file in site/hugo.yaml
- [X] T006 Give the home page its own `description` in site/content/_index.md
- [X] T007 Give each documentation section landing page its own `description`

## Phase 3: The check

- [X] T008 [P] Test that every built page carries an image and a non-empty description, in test/site/cards.test.ts
- [X] T009 [P] Test that the card is declared in the large format, in test/site/cards.test.ts
- [X] T010 [P] Test that the committed image exists at the expected dimensions, in test/site/cards.test.ts
- [X] T011 [P] Test that the crawler file names the sitemap, in test/site/cards.test.ts

## Phase 4: The law

- [X] T012 Write MV-100's statement into .multivac/invariants.md, stating what it cannot check
- [X] T013 Amend MV-77 in place, dated: what the site carries for a reader who has not arrived yet
- [X] T014 Anchor MV-100 to the declarations, the committed image and the test
- [X] T015 Run `verify` and confirm MV-100 resolves

## Phase 5: Documentation

- [X] T016 Add the CHANGELOG entry

## Phase 6: Polish

- [X] T017 Run `pnpm test` and `verify --strict`
