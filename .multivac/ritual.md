# Ritual

<!-- The closing ceremony multivac cannot check: who reviews what, who gets
told, what ships before what when the reason is not technical. One line each;
`multivac change close` prints them as a checklist. Empty prints nothing.

This file used to carry four lines, and every one of them was checkable. That
is not "the ceremony no tool can check" — it is debt wearing that phrase as a
costume, and a poster of things that could have been enforced teaches readers
to skim it. Three moved (MV-98):

  - "the branch is pushed and an MR is open" — `change close` already refuses
    until every declared repo is recorded landed.
  - "the MR states the landing order and names every claim" — the merge request
    template on disk prompts both, and MV-34 now anchors both rather than half.
  - "what this taught that is not yet law is a row or a backlog line" — the
    roadmap exists now (MV-89), and `multivac roadmap add` is where that goes.

The fourth is still checkable and still not checked. "The site says what the
tool now does" needs a diff against the fork point rather than against the
merge base, because at close the branch is already an ancestor of the trunk and
the merge-base diff is empty by construction. That mechanism is worth building;
it is not this file's job to pretend otherwise in the meantime. -->

- [ ] Somebody who did not write it read it, and said so out loud.
- [ ] The change is worth what it cost the next reader: the prose earns its
      length, or it gets shorter.
