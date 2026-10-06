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
unique, count, each — plans and lands cross-repo changes with declared landing
order, projects a single canonical agent door (`AGENTS.md`) to every harness,
and keeps the brain's distribution pinned but fresh. What it cannot verify it
surfaces: closing a change prints the team's ritual — who reviews, who is
told, what ships before what — as a checklist, never as a gate. Deterministic
core, no API key required; git is the enforcement floor.

Declare a spec-driven development tool (spec-kit or OpenSpec) and it carries its
own work while multivac adds the gate and the pointer: the tool is installed in
the brain, where every change's specs are written, and each change is gated on
its own artifacts. With the spec tool declared and its automation on, multivac
refuses code that reaches a repo outside a change; in a code repo, a branch no
open change names waits for CI's `verify --strict`, since its mounted brain can
lag, while one whose open change omits the repo is refused at once. Declare none
and it works as before: the lifecycle binds on its own and code is not refused
outside a change. multivac keeps no code graph; your agent searches the tree.

**Status: released, and early.** It is on npm — [CHANGELOG.md](CHANGELOG.md)
says what each release contained. The day-one capability is implemented and
tested — `init`, `verify`, `doors`, `doctor`, `repos`, `seed`, and the `change`
lifecycle — and multivac develops itself with it: this repo is its own brain,
its rules are anchored invariants, and CI re-verifies them on every push. What
it has not yet met is an ecosystem other than its author's.

```sh
npx multivac@latest init
```

Or from source, to work on it:

```sh
git clone git@github.com:ulm0/multivac.git && cd multivac
pnpm install && pnpm run build && pnpm link --global   # bins: multivac, mvac
```

Requires Node >= 24 and git; only the from-source route also needs pnpm. The
full design, including the anchorability measurement that validated the grammar
(95.1% of 82 real invariants anchorable), is in [DESIGN.md](DESIGN.md). Docs:
https://multivac.ulm0.com (English) and https://multivac.ulm0.com/es/ (Español)

## Contributing

Changes ship through multivac's own lifecycle — see
[CONTRIBUTING.md](CONTRIBUTING.md). If the tool fights you while you use it,
that is a bug report, not a bad day: most of what this project has fixed came
from writing that friction down. Participation is covered by the
[Code of Conduct](CODE_OF_CONDUCT.md).

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Pierre Ugaz.
