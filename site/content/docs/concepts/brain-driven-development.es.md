---
title: Desarrollo guiado por el brain
weight: 2
---

La práctica: **un solo repo brain desde el cual se desarrolla todo el ecosistema**.
El brain es una base de conocimiento — afirmaciones (*claims*), ley y el
[ritual](../the-change#the-ritual) — y los repos de código son
superficies por las que pasa el cambio. La práctica se operó a mano durante
meses en un ecosistema real de producción — cinco repos, un brain de ~5.400 líneas —
antes de que multivac la convirtiera en mecanismo en lugar de disciplina.

## Entrada desde cualquier lugar, un solo protocolo {#entry-from-anywhere-one-protocol}

El brain no es un lugar — es un protocolo, porque viaja:

- **Entra al repo brain** → la puerta del brain explica cómo trabajar en todo el
  ecosistema: dónde vive cada repo, la ley, cómo entra un cambio, el ritual
  (`.multivac/ritual.md`) y `verify`.
- **Entra a cualquier repo de código** → el brain está montado ahí, y la puerta
  de ese repo dice: consulta el brain antes de cualquier decisión — y la funcionalidad que estás
  construyendo puede no terminar en este repo. Un agente parado en una superficie sabe
  que el cambio puede cruzar a otras, y el brain le dice a cuáles.

Ambos puntos de entrada convergen en el mismo estado: trabajo planificado contra el brain,
ejecutado en todas las superficies que toque la funcionalidad.

## Tres capas {#three-layers}

| capa | contiene | ¿derivable del código? |
| --- | --- | --- |
| **Mapa** | qué existe, qué llama a qué, qué contrato expone | sí, y bien |
| **Ley** | qué es innegociable y por qué | **no** — "un abogado validó esta frase" no vive en ningún AST |
| **Diario** | por qué se revirtió una decisión | **no** — se acumula hacia adelante |

Solo el mapa se regenera. Para un ecosistema existente, el agente por lo tanto
redacta el mapa a partir del inventario de `seed` y **entrevista para obtener la ley** — la
entrevista es el producto, no un accesorio. El diario es el activo, no el costo: la única
capa que no se puede regenerar, separada para que no se cargue siempre.

Las afirmaciones están en el idioma en que escriba el equipo. La fila de encabezado
de la tabla de la ley (`ID | statement | authority | state | date | source`) y sus
palabras de estado son el esquema propio de multivac y se quedan como están.

## La sesión es el hogar {#the-session-is-home}

El consumidor de la salida es un agente a punto de escribir código, que lee la ejecución
en el mismo turno en que va a editar — el último momento en que le digan que una afirmación
es falsa todavía cambia lo que se escribe. Consecuencias de diseño:

- **El mensaje es el producto, no el código de salida.** La salida dice qué
  está mal *y qué hacer*. El código de salida es lo que lee el hook que invoca; el
  texto es lo que lee el agente.
- **La autocorrección es el modo normal.** El agente ya está editando y
  revisa el diff en el momento; `moved` no es un caso especial.
- **Presupuesto estricto de latencia: menos de un segundo.** Un hook que tarda cinco segundos
  termina desinstalado. De ahí `git ls-files` (`git ls-tree` para una ref) en lugar de
  recorrer el árbol, y la comparación en proceso — una sola `RegExp` compilada desde el
  POSIX ERE del ancla, ejecutada sobre los archivos enumerados. Sin subproceso por archivo (la
  lectura de una ref obtiene los blobs de cada tramo mediante un solo `git cat-file`), sin comparador
  externo y sin nada guardado entre ejecuciones: a este tamaño la lectura es más barata que la
  contabilidad que necesitaría un caché para mantenerse honesto a través de un rebase.

## Cumplimiento: la escalera {#enforcement-the-ladder}

Si la verificación solo se ejecuta cuando el agente se acuerda, la herramienta hereda el
modo de falla que vino a corregir. La herramienta es agnóstica al agente — sin harness
privilegiado — así que el cumplimiento no puede vivir en la API de hooks de un solo harness. El
punto de paso universal es **git**: todo agente, y el humano, pasa por
el commit.

| capa | mecanismo | cobertura | solidez |
| --- | --- | --- | --- |
| 0 | la puerta instruye: ejecuta `multivac verify` antes de actuar | cualquier agente que lea `AGENTS.md` | débil — obediencia |
| 1 | **hooks de git**: `pre-commit`, `pre-push` y `pre-merge-commit` ejecutan `verify`. Los tramos en modo bloqueante bloquean en todos los repos ([la matriz de salida](../../reference/commands/#the-exit-matrix)); una promulgación junto al código que ancla, la eliminación de ley y una edición de configuración hecha sin un cambio abierto bloquean en el checkout del brain; [el código fuera de un cambio](../../reference/commands/#code-lands-in-a-change) bloquea en un checkout del brain o en el worktree de cambio de un consumidor donde `sdd_auto` está activado y un SDD gobierna un repo declarado, el propio brain cuando está declarado; en el checkout propio de un consumidor, cuyo brain montado puede estar atrasado, una rama cuyo cambio abierto no declara el repo bloquea en cualquier ejecución y una rama que no es un cambio abierto solo bloquea con `--strict` | **universal** — todo lo que hace commit | fuerte |
| 2 | hooks del harness (inicio de sesión, post-edición), distribuidos como datos por harness | por harness | mejor experiencia — atrapa antes del commit |

Un peldaño pide y dos hacen cumplir; no hay un tercero, a propósito. Los dos peldaños
que hacen cumplir se activan dentro de la sesión, mientras el agente que rompió la afirmación sigue
ahí para corregirla — una verificación que corre después de terminada la sesión reporta
la mentira a quien la lea después, con el código ya escrito encima.

Los dos no son redundantes; atrapan modos de falla distintos:

- **Los hooks del harness son el lado de lectura.** El inicio de sesión atrapa un brain mentiroso —
  y, en el checkout del brain, un pin desactualizado — antes de que el agente conciba código
  encima.
- **Los hooks de git son el lado de escritura.** El momento del commit atrapa las afirmaciones que la edición
  rompió, antes de que aterricen.

**El harness es el techo; git es el piso.** Donde existen hooks del harness,
la mayor parte de la deriva se atrapa temprano y el hook de git rara vez se activa. Donde no existen —
"cualquier agente de código" incluye harnesses sin API de hooks — el hook de git
es el piso por el que pasa todo commit. Un hook se puede omitir, así que donde el forge
lo exige, el pipeline del merge request ejecuta
`verify --strict --range <base>..<head> --branch <name>` una vez, en el head (la punta de la rama).
Donde `sdd_auto` está activado y un SDD gobierna un repo declarado, el rango agrega una verificación:
el código de cada commit que no sea de merge debe haber pasado por la rama de un cambio
abierto que declare el repo. En el checkout propio de un consumidor, la verificación al momento del commit rechaza
una rama cuyo cambio abierto no declara el repo, y deja una rama que
ningún cambio abierto nombra a la ejecución de rango `--strict` del CI, porque el brain montado
puede estar atrasado; el worktree de cambio de un consumidor lee el brain directamente y rechaza ambos. Las verificaciones que leen un commit en composición — promulgación, configuración, eliminación
de ley — responden solo dentro de un commit.

Los hooks viajan con el clon: `multivac init` y `multivac doors` apuntan
`core.hooksPath` a un directorio versionado `.multivac/hooks/` en cada clon,
a menos que el repo ya reclame una ruta de hooks propia (un `core.hooksPath` o
husky) — entonces los shims se colocan al lado y `core.hooksPath` queda como estaba.
El modelo es nativo de git en todo — las anclas se evalúan mediante
`git ls-files`, la distribución es pin + obsolescencia, el cambio es rama/MR — así que
`init` ejecuta `git init` donde falta. Un brain sin git no tiene piso:
`multivac doctor` muestra sus hooks desarmados (`core.hooksPath unset`).
