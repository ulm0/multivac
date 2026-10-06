---
title: Adopción
weight: 7
---

Se usan cuatro nombres para referirse a cómo empiezas — `init`, seed, descubrimiento, entrevista —
y dos de ellos son comandos mientras que los otros dos son conversaciones. Esa asimetría es
la razón por la que el orden suele adivinarse mal, así que parte por ahí:

| | qué es | quién lo ejecuta |
| --- | --- | --- |
| `mvac init` | un comando | tú, una vez |
| **descubrimiento** | un protocolo | el agente, siguiendo la skill |
| `mvac seed` | un comando, *dentro* del descubrimiento | el agente |
| **entrevista** | un protocolo, *después* de seed | el agente pregunta, un humano responde |
| `mvac doors` | un comando | el agente, al final |

No existe `mvac interview`. Seed nombra archivos; no puede decir qué significan.
La entrevista es donde un humano dice cuáles de esos archivos llevan reglas y por qué,
y ocurre **después** de seed en lugar de reemplazarlo — la salida de seed es la
entrada de la entrevista.

## El recorrido {#the-arc}

```
mvac init
   │
   └── session zero — one question: does this already exist as code?
          │
          ├── yes → discovery: seed → read by category → the three open
          │         questions → interview → map + proposed rows →
          │         validate in blast-radius batches → mvac doors
          │
          └── no  → interview: the loop → the boundaries → the
                    non-negotiables and their why → what is published
                    → the first slice, landed as the first change
          │
   steady state: change new → plan → apply → land → close
```

Las dos ramas son asimétricas a propósito. El descubrimiento termina en `doors`, porque
ya hay repos esperando una puerta. En el camino desde cero
aún no hay nada sobre lo que proyectar: `apply` en greenfield crea cada repo con
su primer commit y su puerta ya escritos, aunque la lista de cierre de `init`
sigue nombrando `doors`, que refresca la puerta del propio brain. Y si pasaste
`--provider` a `init`, esa proyección ya ocurrió en la misma ejecución —
`doors` sirve para adoptar un harness *más adelante*.

## Qué aporta cada fase {#what-each-phase-buys}

- **`init`** — el brain existe y los hooks de git quedan armados. `verify` ahora se ejecuta
  en cada commit sin que lo pidas; `--provider claude` añade una ejecución al inicio de la sesión.
  No lee tu código, no entrevista a nadie y escribe cero ley:
  la tabla está vacía a propósito, y la puerta lo dice.
- **seed** — un inventario determinista de dónde vive realmente la arquitectura:
  compuertas de políticas, grafo del workspace, manifiestos de despliegue, modelos, decisiones. Nada de
  eso es ley. Su valor es que es *aburrido y repetible*: los mismos archivos
  dan el mismo inventario. Coincide con un conjunto fijo de patrones, así que lo que no
  nombra queda a la lectura que tu agente haga del árbol.
- **la entrevista** — las razones, que no están en el código. Un `REVOKE UPDATE`
  en una migración sugiere una regla; solo una persona sabe si es una promesa o
  un accidente que nadie limpió.
- **filas propuestas, validadas por lotes** — ley por la que respondió un humano.
  Ordenadas por radio de impacto: primero dinero y pérdida de datos, luego promesas publicadas,
  luego contratos internos, luego convenciones.
- **`doors`** — cada repo y cada harness sabe dónde está el brain y qué
  obliga, en su propio formato, desde una única fuente canónica.
- **estado estable** — toda decisión entra como un cambio, y `close` rechaza
  archivar hasta que las afirmaciones (*claims*) que declaró se cumplan de verdad.

## Dónde empiezas {#where-you-start}

- **Un ecosistema que ya existe en código** — el caso común. `init`, luego
  el camino de descubrimiento. Espera que la entrevista sea la parte lenta; también es la
  parte que decide si la ley es verdadera.
- **Un repo que es a la vez brain y código** — mismo camino, `repos: { brain: . }`.
  Las anclas apuntan a `brain:<glob>` y no hay montaje ni pin que revisar. Este sitio
  y la herramienta que lo construye son ese caso.
- **Nada construido todavía** — el camino de la entrevista. Decide solo la primera porción.
  Una especificación especulativa es un brain que miente desde el primer día.

## Qué cambia según el caso, y qué no {#what-changes-per-case-and-what-does-not}

- **Un repo que ya tiene opiniones** — un `AGENTS.md`, husky, `pre-commit`, un
  `core.hooksPath` ajeno, un `.gitignore` que se tragaría el brain. `init`
  revisa antes de escribir, encadena un hook existente en lugar de reemplazarlo,
  rechaza en lugar de pisar, e imprime la estrategia que usó.
- **Un repo declarado que no está en disco** — seed lo lista en `skipped` en lugar de
  adivinar. `mvac repos sync` lo clona.
- **Un repo que no existe en absoluto** — es legal. Decláralo en un cambio;
  `apply` en greenfield lo crea.
- **Adoptar un harness tres meses después** — una línea en `.multivac/config.yml`
  (una vez que la configuración está commiteada, `verify` rechaza un commit que la edita
  a menos que haya un cambio abierto) más `mvac doors`. `init` conserva la configuración que
  encuentra, así que volver a ejecutarlo no recogería la línea.
- **Un repo consumidor** — sin configuración propia; resuelve el brain a través del
  montaje y verifica su propio árbol de trabajo, acotado a sus anclas.

Lo que **no** cambia es el estado estable. Todos los caminos anteriores convergen en los
mismos cinco subcomandos, y desde ahí la forma del trabajo es idéntica
sin importar cómo llegaste.

## Siguiente {#next}

La versión paso a paso de la sesión cero, con salida real, está en la guía:
[Sesión cero](../../guide/session-zero). Por qué multivac se apoya en herramientas
guiadas por especificaciones en lugar de reemplazarlas está en [Composición](../composition).
