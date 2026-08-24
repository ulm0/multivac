---
title: multivac
layout: hextra-home
description: >-
  Your agent verifies its context before it acts on it. One brain repo holds
  the law as anchored claims; multivac checks them against the code, offline
  and without a model, and refuses the commit when they disagree.
---

{{< hextra/hero-badge link="docs/guide/install" >}}
  <div class="hx:w-2 hx:h-2 hx:rounded-full hx:bg-primary-400"></div>
  <span>v{{< param release >}}</span>
  {{< icon name="arrow-circle-right" attributes="height=14" >}}
{{< /hextra/hero-badge >}}

<div class="hx:mt-6 hx:mb-6">
<h1 class="not-prose hx:text-4xl hx:font-bold hx:leading-none hx:tracking-tighter hx:md:text-5xl hx:py-2 hx:bg-clip-text hx:text-transparent hx:bg-gradient-to-r hx:from-gray-900 hx:to-gray-600 hx:dark:from-gray-100 hx:dark:to-gray-400">
<code>multivac <span id="mvac-cmd"></span><span class="mvac-cursor" aria-hidden="true">_</span></code>
</h1>
</div>

<!--
  MV-83's machine voice, typed. The commands cycled here are the tool's own
  top-level surface (src/commands/*.ts) plus the change lifecycle's verbs —
  nothing invented for the demo. Vanilla, inline, no dependency: the site
  that tells you it refuses the network in the commands that gate work does
  not reach a CDN to animate its own headline.
-->
<script>
(function () {
  var el = document.getElementById('mvac-cmd');
  if (!el) return;
  var commands = [
    'init', 'seed', 'verify', 'verify --strict', 'doctor', 'doors',
    'change new', 'change plan', 'change apply', 'change land', 'change close',
    'roadmap', 'count', 'repos sync',
  ];
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = commands[0];
    return;
  }
  var TYPE_MS = 70, DELETE_MS = 40, HOLD_MS = 1400, GAP_MS = 300;
  var ci = 0, pos = 0, deleting = false;
  function tick() {
    var word = commands[ci];
    if (!deleting) {
      pos++;
      el.textContent = word.slice(0, pos);
      if (pos === word.length) { deleting = true; setTimeout(tick, HOLD_MS); return; }
      setTimeout(tick, TYPE_MS);
    } else {
      pos--;
      el.textContent = word.slice(0, pos);
      if (pos === 0) {
        deleting = false;
        ci = (ci + 1) % commands.length;
        setTimeout(tick, GAP_MS);
        return;
      }
      setTimeout(tick, DELETE_MS);
    }
  }
  setTimeout(tick, TYPE_MS);
})();
</script>

<div class="hx:mb-12">
{{< hextra/hero-subtitle >}}
  Your agent verifies its context before it acts on it.
{{< /hextra/hero-subtitle >}}
</div>

<div class="hx:mb-6">
{{< hextra/hero-button text="Read the philosophy" link="docs/concepts/philosophy" >}}
{{< hextra/hero-button text="Install" link="docs/guide/install" style="background: transparent; color: inherit; box-shadow: inset 0 0 0 1px currentColor;" >}}
</div>

<div class="hx:mt-6"></div>

{{< hextra/feature-grid >}}
  {{< hextra/feature-card
    title="Claims, not documents"
    subtitle="The unit is the claim: statement, authority, and a content-based anchor — `present`, `absent`, `unique`, `count`, `each` — written inline in the markdown. A paraphrase ages silently; a citation can be checked."
    link="docs/concepts/claims-and-anchors"
  >}}
  {{< hextra/feature-card
    title="Deterministic verify"
    subtitle="`mvac verify` checks every anchor against the declared repos. No LLM, no API key, no network — the same answer on your laptop, in the hook, and in your teammate's clone."
    link="docs/reference/commands"
  >}}
  {{< hextra/feature-card
    title="One change, N repos"
    subtitle="`change new → plan → apply → land → close`: a branch per repo, merge requests in declared landing order, and a close that refuses until every claim the change promised resolves green."
    link="docs/guide/running-changes"
  >}}
  {{< hextra/feature-card
    title="A door in every harness"
    subtitle="One canonical `AGENTS.md`, projected per harness as symlink, stub, or nothing at all where the harness already reads it. Eight entries, each verified against its vendor's own docs."
    link="docs/reference/integrations"
  >}}
  {{< hextra/feature-card
    title="Enforcement that degrades"
    subtitle="Git hooks are the universal floor, harness hooks the ceiling. A machine without the binary commits normally: enforcement degrades, it never locks you out."
    link="docs/reference/hooks"
  >}}
  {{< hextra/feature-card
    title="Tombstones for the dead"
    subtitle="A retired mechanism is declared dead where someone will look for it. `absent` anchors block across every repo in the ecosystem, and the config refuses to unblock them."
    link="docs/concepts/invariants"
  >}}
{{< /hextra/feature-grid >}}

<div class="hx:mt-12"></div>

{{< hextra/hero-section heading="h3" >}}
Why the name
{{< /hextra/hero-section >}}

Asimov's Multivac is the world-computer everyone consults; in *The Last
Question* it is the one that finally answers. The joke is that this Multivac
answers nothing on its own — it only tells you whether what you already
believe is still true. CLI alias: `mvac`.

<div class="hx:mt-12"></div>

{{< hextra/hero-section heading="h3" >}}
Where this is
{{< /hextra/hero-section >}}

Published on npm, `npx multivac init` away. It is its
own first user: multivac's law lives in this repo, and every change to it is
held by the same hooks you would install; CI re-runs them as `mvac verify --strict`.
The design was validated against a real
production ecosystem before the code existed — 82 invariants collected by
hand, 95.1% of them anchorable.
