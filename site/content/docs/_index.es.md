---
title: Documentación
description: >-
  Qué es multivac, cómo avanza un cambio guiado por el brain y cada comando y clave de configuración.
---

**multivac** (alias de la CLI `mvac`) es una herramienta de desarrollo guiado por el brain: un único
repo brain — afirmaciones (*claims*), ley y [ritual](concepts/philosophy#the-ritual) — desde el cual
se desarrolla todo un ecosistema de repos de código. Entras al brain, y el cambio
fluye hacia los repos que la funcionalidad toque. El núcleo es
determinista: sin clave de API, sin red, sin llamadas a un modelo en la ruta de verificación.

La herramienta no es un generador de documentación. Si desarrollas *desde* el brain, un
brain que miente no produce documentación fea: produce código con total seguridad equivocado
en N repos. La verificación es la condición previa; el producto es el cambio.

## Los cuatro trabajos {#the-four-jobs}

1. **Cambiar** — el cambio del ecosistema, planificado y ejecutado desde el brain. El
   verbo al que sirven los otros tres.
2. **Verificar** — las afirmaciones del brain contrastadas con el código, de forma determinista.
3. **Proyectar** — una puerta canónica (`AGENTS.md`), proyectada al formato de
   cada harness.
4. **Distribuir** — cómo el brain llega a los repos consumidores, con pin, y con
   la desactualización visible en lugar de silenciosa.

## Tres secciones y el changelog {#three-sections-and-the-changelog}

{{< cards >}}
  {{< card link="concepts" title="Conceptos" subtitle="El modelo: por qué existe, afirmaciones y anclas, el cambio entre repos, la distribución, cómo va la adopción." >}}
  {{< card link="guide" title="Guía" subtitle="El camino: instalar, init, llenar el brain, escribir anclas, ejecutar un cambio." >}}
  {{< card link="reference" title="Referencia" subtitle="La superficie: cada comando y flag, cada clave de configuración, cada integración." >}}
  {{< card link="changelog" title="Changelog" subtitle="Qué contuvo cada release. El CHANGELOG.md del propio repositorio, montado aquí en lugar de copiado." >}}
{{< /cards >}}

## Por dónde empezar {#where-to-start}

- **¿Eres nuevo aquí?** [Filosofía](concepts/philosophy) — el problema que esto existe para
  resolver, en una página.
- **¿Quieres verlo funcionando?** [Instalación](guide/install), luego
  [Primeros pasos](guide/getting-started).
- **¿Buscas un flag o una clave?** [Comandos](reference/commands) y
  [Configuración](reference/configuration).
- **¿Conectas un agente?** [Integraciones de agentes](reference/integrations) y
  [Hooks](reference/hooks).

[Conceptos](concepts) está escrito en orden de dependencia:

1. [Filosofía](concepts/philosophy) — por qué una paráfrasis envejece en silencio y una
   cita no; quién propone, quién promulga.
2. [Desarrollo guiado por el brain](concepts/brain-driven-development) — la
   práctica: el repo brain, sus tres capas y cómo se aplica el cumplimiento.
3. [Afirmaciones y anclas](concepts/claims-and-anchors) — la unidad de verdad y
   la gramática que la verifica.
4. [El cambio](concepts/the-change) — el ciclo de vida del cambio entre repos.
5. [Invariantes](concepts/invariants) — cómo la ley nace, se enmienda y se retira.
6. [Distribución](concepts/distribution) — montajes, pins, puertas y skills.
7. [Adopción](concepts/adoption) — el arco desde `init` hasta el estado estable, qué
   fase aporta qué, y cómo cambia el camino según la forma en que te encuentres.
8. [Composición](concepts/composition) — por qué se construye sobre las herramientas guiadas por
   especificaciones en lugar de competir con ellas, y por qué multivac no guarda un grafo de código.
