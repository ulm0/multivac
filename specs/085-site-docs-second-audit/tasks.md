# Tasks: site-docs-second-audit
- [ ] T001 change apply on the branch
- [X] T002 MV-156: write the rule on its row, then the ten `absent` legs over `site/content/**`; `verify` reports each forbidden pattern at its page and line before any page moves
- [ ] T003 [US1] [US2] [US3] commands.md: apply the rows of findings.md for it, in three passes by line range (1-640, 640-1214, 1214-end), reading each cited `src/` line first
- [ ] T004 [US1] [US3] configuration.md, sdd.md, hooks.md, integrations.md, reference/_index.md: apply their rows
- [ ] T005 [US1] concepts pages (the-change, claims-and-anchors, philosophy, brain-driven-development, invariants, distribution, adoption): apply their rows
- [ ] T006 [US2] guide pages (install, getting-started, session-zero, running-changes, writing-anchors), the landing page and the README: apply their rows
- [ ] T007 Drop any finding the code does not bear out and any finding on a released changelog entry; note each in the change body; list behaviour documented as it is that reads as a defect
- [ ] T008 A second agent per file re-checks every corrected statement against `src/`; fix what it refutes
- [ ] T009 Suite, Hugo build, verify --strict and verify --strict --range from main; commit on the branch
