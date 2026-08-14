# multivac

**Brain-driven development**: one brain repo — a knowledge base of claims,
law, and ritual (the closing ceremony of a change, written in
`.multivac/ritual.md`) — from which an entire ecosystem of code repos is
developed. You enter only the brain, and the change flows out across whatever
repos the feature touches. The practice was proven by hand for months on a real
production ecosystem of five repos and a ~5,400-line brain; multivac is the
tool that makes it mechanism instead of discipline.

The tool (CLI alias `mvac`, named after Asimov's world-computer) verifies the
brain's claims against the code with content-based anchors — present, absent,
unique, count — plans and lands cross-repo changes with declared landing
order, projects a single canonical agent door (`AGENTS.md`) to every harness,
and keeps the brain's distribution pinned but fresh. What it cannot verify it
surfaces: closing a change prints the team's ritual — who reviews, who is
told, what ships before what — as a checklist, never as a gate. Deterministic
core, no API key required; git is the enforcement floor.

**Status: early build, pre-release.** The day-one capability is implemented
and tested — `init`, `verify`, `doors`, `doctor`, `repos`, `seed`, and the
`change` lifecycle — and multivac develops itself with it: this repo is its
own brain, its rules are anchored invariants, and CI re-verifies them on every
push. It is not on npm yet, and it has not yet been run against a multi-repo
ecosystem — the shape it was designed for. Build from source:

```sh
git clone git@gitlab.com:ulm0/multivac.git && cd multivac
pnpm install && pnpm run build && pnpm link --global   # bins: multivac, mvac
```

Requires Node >= 24 and pnpm. The full design, including the anchorability
measurement that validated the grammar (95.1% of 82 real invariants
anchorable), is in [DESIGN.md](DESIGN.md). Docs: https://multivac.ulm0.com

## Contributing

Changes ship through multivac's own lifecycle — see
[CONTRIBUTING.md](CONTRIBUTING.md). If the tool fights you while you use it,
that is a bug report, not a bad day: most of what this project has fixed came
from writing that friction down. Participation is covered by the
[Code of Conduct](CODE_OF_CONDUCT.md).

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Pierre Ugaz.
