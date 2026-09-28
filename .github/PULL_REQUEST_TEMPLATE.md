## What landed

<!-- One paragraph. What is true after this that was not true before. -->

## Claims made true

<!-- The claim IDs this change declared, and their anchors. If it declared
     none, say why — some changes genuinely add no law. -->

## Landing order

<!-- Only if it crosses repos. Which stage lands first and what breaks if the
     order is ignored. Delete this section for a single-repo change. -->

## Verification

- [ ] `pnpm test` green
- [ ] `node dist/cli.js verify --strict` exit 0
- [ ] `node dist/cli.js change close <slug>` passed on its own claims
- [ ] The site says what the tool now does, if behavior changed

## Friction

<!-- Anything the tool did badly while you used it. A rough edge recorded here
     is worth more than a workaround nobody sees. Write "none" if none. -->
