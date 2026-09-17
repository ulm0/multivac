# Implementation Plan: door-integration-map

**Spec**: [spec.md](./spec.md)

## Summary
- `SddScaffold` gains `integrations`, `add` and `fallback`.
- The `run` field takes `{key}` or `{keys}`.
- `scaffoldCommands(scaffold, doors)` in `src/adapters/sdd.ts` returns the commands and the gaps.
- `runScaffold` runs the commands in order and stops at the first that does not succeed. The probe then decides, as before.
- `doctor` prints the same commands.
- opsx gains `scaffold` with `openspec init --tools {keys} --no-animation .`.

## Constitution Check
- **I.** The new row is MV-130. MV-75's leg on the literal claude init moves to the template.
- **II.** A gap is stated per door. An integration is never forced.
- **III.** The rows move in this change.
- **IV.** No offline surface runs a vendor.
- **V.** Every key and flag is measured on a named version (spec-kit 1.0.7, openspec 1.13.0) and recorded where it is declared.

## Complexity Tracking
| Considered | Rejected because |
|---|---|
| A function per vendor to build its argv | Adapters are data (Principle V). Two placeholders and an `add` template cover both tools. |
| Installing later-added doors into an installed root | That needs the vendor's installed-keys field read per tool. It is stated as a ceiling instead. |
