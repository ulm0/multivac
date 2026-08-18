---
slug: the-brain-door-has-one-rendering
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-91
    - MV-101
    - MV-57
  adds:
    - MV-102
  retires: []
claims:
  - id: MV-102
    statement: "The brain door has ONE rendering: `init` writes the bytes `doors` writes, from the config, so no agent ever reads a door that the next projection replaces."
---

# The brain door has one rendering

MV-101 stopped `init` and `doors` naming different ADAPTERS and stated the
ceiling it did not reach: the two commands still write different door BODIES.
This is that ceiling.

Measured on 0.7.0, in a fresh brain:

    $ mvac init --quiet .
    $ head -3 AGENTS.md
    <!-- multivac:begin -->
    # multivac
    This brain is empty on purpose. Load the multivac skill and fill it:

    $ mvac doors                       # nothing edited in between
    $ head -3 AGENTS.md
    <!-- multivac:begin -->
    ## multivac — brain door
    This repo is the brain: the source of law and change for its ecosystem.

**Why it happens.** `init.ts` carries `DOOR_BODY`, a hand-written copy of the
brain door, and appends its own SDD lines. `doors` calls `renderBrainDoor`,
which builds the same door from the config. Two renderings of one document.

**What it already cost.** The copy drifted, silently, in the direction that
matters: `renderBrainDoor` gained `grapherLines` (MV-90's graph block) and the
ecosystem's repo list; `DOOR_BODY` did not. So the door a fresh `init` leaves —
the one an agent reads FIRST, before anybody runs a second command — never
mentions the graph the door is supposed to point at. Every future edit to the
brain door has the same shape: made twice, or drifted again.

**The fix is a deletion.** `init` projects through `renderBrainDoor`, reading
the config it has just written or kept. `DOOR_BODY` goes, and with it the
second SDD-line assembly — MV-101's rule survives its expression, because
reading the config is what `renderBrainDoor` does.

**Three live rows are touched, because deleting code moves anchors.** MV-57's
init leg named `projectLawLines(sddName)` and now names the one rendering that
carries the project law into the door; MV-91 loses the leg that named the
deleted expression, keeping the refusal, the early config read and the report;
and MV-101 is amended in the same change, for two reasons: its anchors name the
expression this deletes, and its prose spends a paragraph re-arguing what MV-91
already says about not refusing. The rule does not change; the row gets shorter
and its anchors follow the code.
