---
slug: the-site-can-be-shared
status: archived
repos:
  brain:
    status: landed
landing_order:
  - - brain
invariants:
  touches:
    - MV-77
  adds:
    - MV-100
  retires: []
claims:
  - id: MV-100
    statement: Every page of the site carries a description and a card image, so a pasted link renders as itself — and the description is authored per page, never derived from whatever text happened to come first.
---

# The site can be shared

Pasting the site's URL into LinkedIn produced a bare link: no image, no title
worth reading, no summary. That is not LinkedIn being difficult. It is the head
this site actually serves:

    <meta name=description content>
    <meta property="og:description" content="
      ">
    <meta property="og:type" content="
      ">

The description is empty. `og:type` is whitespace where `website` belongs. And
there is **no `og:image` on any page** — which is the whole answer, because a
scraper that finds no image does not fall back to a favicon. It renders a link.

The documentation pages are worse: they carry `twitter:title` and nothing else.
No `og:` tags at all. Sharing a page of the docs — the thing anybody would
actually share — produces the least.

**None of this needs a template.** The theme already emits `og:image` from
`params.images`, and Hugo's own card partial upgrades the Twitter card to the
large format the moment an image exists. The description flows from
`params.description` for the home page and from each page's own front matter
everywhere else. What was missing was the declaration, not the machinery.

The card image is the mark on the site's ground, rasterised once and committed
— not generated at build time, because the rasteriser is not a build dependency
this project has, and adding one to draw a logo would be the third dependency
arriving through a side door.

It is deliberately wordless. The lockup renders its wordmark with a system font
stack, so rasterising it here would bake in whichever fonts this machine
happens to have — the same class of "differs by machine" the tool refuses
everywhere else. The card carries the mark; the title and the description sit
beside it, from the tags, where they can be read and corrected.
