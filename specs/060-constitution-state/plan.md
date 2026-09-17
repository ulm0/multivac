# Implementation Plan: constitution-state

## Summary
- **Registry.** `SddProjectStep.placeholder` becomes `placeholders` (the 20 tokens) plus `templateRecord` (the sidecar). opsx gets a report-only step on `openspec/config.yaml`, key `context`, limit 51200.
- **`src/lib/repo-state.ts`.** `projectDocVerdict(path, doc)` returns `{ verdict, why? }`.
- **`sdd.ts` gate.** Uses the verdict and skips report-only steps.
- **`doctor` and `repos`.** Use the verdict. A report-only step is a fact.
- **New `src/adapters/project-doc.ts`.** `projectDocLines`, called by `cmdNew`.
- **`flow.ts`.** Adds a gate row, and a yours row for report-only steps.
- **`brain.ts`.** `projectLawLines` adds the precedence line and the report-only wording.

## Constitution Check
- **I.** New row MV-135, with notes on MV-55, MV-57, MV-76, MV-95 and MV-96.
- **V.** Tokens and limits are measured and recorded in the registry.
