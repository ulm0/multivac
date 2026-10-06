---
title: multivac
layout: hextra-home
description: >-
  Tu agente verifica su contexto antes de actuar sobre él. Un repo brain
  guarda la ley como afirmaciones ancladas; multivac las contrasta con el
  código, sin conexión y sin un modelo. Por defecto, una afirmación absent,
  count o each rota detiene el commit; el --strict de CI hace fallar el build
  con una afirmación rota en cualquier otro modo también.
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
  The site's machine voice, typed. The commands cycled here are the tool's own
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
  Tu agente verifica su contexto antes de actuar sobre él.
{{< /hextra/hero-subtitle >}}
</div>

<div class="hx:mb-6">
{{< hextra/hero-button text="Lee la filosofía" link="docs/concepts/philosophy" >}}
{{< hextra/hero-button text="Instalar" link="docs/guide/install" style="background: transparent; color: inherit; box-shadow: inset 0 0 0 1px currentColor;" >}}
</div>

<div class="hx:mt-6"></div>

{{< hextra/feature-grid >}}
  {{< hextra/feature-card
    title="Afirmaciones, no documentos"
    subtitle="La unidad es la afirmación (*claim*): enunciado, autoridad y un ancla basada en el contenido — `present`, `absent`, `unique`, `count`, `each` — escrita en línea en el markdown. Una paráfrasis envejece en silencio; una cita se puede comprobar."
    link="docs/concepts/claims-and-anchors"
  >}}
  {{< hextra/feature-card
    title="Verify determinista"
    subtitle="`mvac verify`, ejecutado desde el brain, contrasta cada ancla con los repos declarados. Sin LLM, sin API key, sin red — los mismos bytes dan la misma respuesta, y cada ejecución dice qué bytes leyó."
    link="docs/reference/commands"
  >}}
  {{< hextra/feature-card
    title="Un cambio, N repos"
    subtitle="`change new → plan → apply → land → close`: una rama por repo, merge requests en el orden de aterrizaje declarado, y un cierre que rechaza hasta que cada afirmación que el cambio prometió se resuelva en verde."
    link="docs/guide/running-changes"
  >}}
  {{< hextra/feature-card
    title="Una puerta en cada harness"
    subtitle="Un `AGENTS.md` canónico, proyectado por harness como symlink, stub o nada en absoluto donde el harness ya lo lee. Ocho entradas, cada una verificada contra la documentación de su propio proveedor."
    link="docs/reference/integrations"
  >}}
  {{< hextra/feature-card
    title="Una exigencia que se degrada"
    subtitle="Los hooks de git son el piso universal, los hooks del harness el techo. Una máquina sin el binario hace commit con normalidad: la exigencia se degrada, nunca te deja afuera."
    link="docs/reference/hooks"
  >}}
  {{< hextra/feature-card
    title="Lápidas para lo muerto"
    subtitle="Un mecanismo retirado se declara muerto donde alguien lo va a buscar. Las anclas `absent` bloquean en cada repo del ecosistema, y la config rechaza desbloquearlas."
    link="docs/concepts/invariants"
  >}}
{{< /hextra/feature-grid >}}

<div class="hx:mt-12"></div>

{{< hextra/hero-section heading="h3" >}}
Por qué el nombre
{{< /hextra/hero-section >}}

El Multivac de Asimov es la computadora mundial que todos consultan; en *La
última pregunta* es la que por fin responde. La gracia es que este Multivac
no responde nada por sí solo — solo te dice si lo que ya crees sigue siendo
verdad. Alias de la CLI: `mvac`.

<div class="hx:mt-12"></div>

{{< hextra/hero-section heading="h3" >}}
Dónde está esto
{{< /hextra/hero-section >}}

Publicado en npm, a un `npx multivac init` de distancia. Es su
propio primer usuario: la ley de multivac vive en este repo, y cada cambio a ella
lo retienen los mismos hooks que instalarías; CI los vuelve a ejecutar como `mvac verify --strict`.
El diseño se validó contra un ecosistema real
de producción antes de que existiera el código — el 95,1 % de sus 82 invariantes
se podía anclar.
