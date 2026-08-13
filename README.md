# multivac

**Brain-driven development**: one brain repo — a knowledge base of claims,
law, and ritual — from which an entire ecosystem of code repos is developed.
You enter only the brain, and the change flows out across whatever repos the
feature touches. The practice was proven by hand for months on a real
production ecosystem of five repos and a ~5,400-line brain; multivac is the
tool that makes it mechanism instead of discipline.

The tool (CLI alias `mvac`, named after Asimov's world-computer) verifies the
brain's claims against the code with content-based anchors — present, absent,
unique, count — plans and lands cross-repo changes with declared landing
order, projects a single canonical agent door (`AGENTS.md`) to every harness,
and keeps the brain's distribution pinned but fresh. Deterministic core, no
API key required; git is the enforcement floor.

**Status: design phase, pre-code.** Nothing to install yet. The full design,
including the anchorability measurement that validated the grammar (95.1% of
82 real invariants anchorable), is in [DESIGN.md](DESIGN.md).
