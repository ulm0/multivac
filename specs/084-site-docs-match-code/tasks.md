# Tasks: site-docs-match-code
- [ ] T001 change apply on the branch
- [ ] T002 MV-155: write the rule on its row, then the `absent` legs over `site/content/**` for the five dead phrasings; `verify` goes red on them before any page moves
- [ ] T003 [US1] Read each cited `src/` line, then correct site/content/docs/reference/commands.md (exit 0 in every degraded state, undeclared arguments, config exit 1, deterministic) and configuration.md:583, hooks.md:372-376, _index.md:102-103, philosophy.md:129
- [ ] T004 [US2] commands.md: stale-pin line and :1093, repos usage :1211, no `mvac: ` prefix :1269-1272 and :1324, `archive` is an instruction :1785
- [ ] T005 [US3] commands.md omissions: verify --range/--branch, init projected.yml, doctor forge and layout, roadmap sync, change new promotion and archived refusal, land --landed commit, --abandon commit line, doors takeback lines, stderr version/requires notice
- [ ] T006 Drop any finding the code does not bear out; note it in the change body
- [ ] T007 Suite, Hugo build, verify --strict and verify --strict --range from main; commit, land, close on the branch
