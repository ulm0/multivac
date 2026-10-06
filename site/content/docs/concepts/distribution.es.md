---
title: Distribución
weight: 6
---

El brain lista repos; los repos apuntan al brain. Un brain = un ecosistema.
La distribución es la dirección inversa del registro: cómo el brain llega a
cada repo consumidor y cuán desactualizado se le permite quedar.

## Qué lleva la puerta del consumidor {#what-the-consumer-door-carries}

La puerta que se escribe en un repo consumidor solía ser de cuatro viñetas: la
ley, la actualización del montaje, "el cambio puede cruzar repos" y "ejecuta
verify". La puerta del brain listaba el ecosistema y llevaba los bloques de
adaptador; esta no llevaba ninguno de los dos, y es la puerta desde la que
parten la mayoría de las sesiones, porque el código es donde ocurre el trabajo.

Ahora lleva:

- **la actualización del montaje, primero**, con su razón. El pin queda donde lo
  dejó el último commit, así que un montaje presente no es un montaje actual. Es
  la única instrucción de esa puerta con un requisito de orden, y antes era la
  segunda de cuatro viñetas.
- **la lista del ecosistema** — cada repo declarado con su ruta, el repo en el
  que estás marcado, un `role` de una línea donde el operador declaró uno, y
  `brain` nombrado de forma explícita porque ese handle se puede usar en anclas
  y nunca puede aparecer en una lista construida a partir de `repos:`. No se
  imprime nada con menos de dos repos declarados.
- **el adaptador que aplica a este repo** — una línea, cuando un SDD lo gobierna
  y `sdd_auto` está activado, que dice que el SDD del brain se ejecuta en el
  checkout del brain y dónde va el código de este repo. La lista de pasos es
  exclusiva de la puerta del brain; ninguna puerta de consumidor la lleva.

La lista describe lo que el ecosistema **declara**, no lo que esta máquina tiene
clonado: una puerta que cambiara según qué repos estén clonados sería distinta
entre dos máquinas por motivos ajenos al ecosistema, y la puerta se commitea. La
generación no hace ninguna comprobación del sistema de archivos ni llamadas de
red.

## El montaje {#the-mount}

Cada repo de código que multivac gestiona monta el brain — carpeta por defecto
`.brain/`, configurable por ecosistema, como un submódulo de git que `repos sync`
agrega desde `brain_url` y deja para que tú lo commitees. Un agente que entra a
un repo consumidor encuentra ahí el brain, y la puerta del consumidor le dice qué
es vinculante y que el cambio puede cruzar repos.

Dos excepciones. La común en un proyecto único: cuando el brain ES el repo de
código (`repos: { brain: . }`, ve
[Primeros pasos](../../guide/getting-started/)), no hay nada que montar ni nada
que pinear. Ese repo conserva la puerta del brain, y las comprobaciones de
montaje, pin y desactualización lo omiten por completo. La otra es un repo de
solo lectura (`managed: false`, o un clon superficial): `repos sync` lo reporta
como de solo lectura y no agrega montaje ahí.

## Pin y desactualización {#pin--staleness}

Un montaje con pin da builds reproducibles y documentación desactualizada. Usar
siempre lo último da frescura y builds irreproducibles. La herramienta no elige:

> El pin se mantiene, y `verify` lo compara con el canal declarado
> (`channel:` en `.multivac/config.yml`, global o por repo). Reproducible
> *y* actualizado, con la deuda visible en lugar de silenciosa.

Por defecto, un pin desactualizado **reporta**. Con `staleness: block`, un pin
por detrás de su canal pasa a ser una falla bloqueante — código de salida 1, con
la solución en la línea:

```txt
  stale     api: pin 35 behind origin/main · last fetch 6d ago — blocking (staleness: block); git -C ../api submodule update --remote .brain
```

`change new`, `change apply` y `doctor` también reportan un pin por detrás de su
canal, pero solo un `verify` ejecutado en el checkout del brain puede fallar por
eso; una ejecución desde un repo consumidor, que es la que corren los hooks de
ese repo, se limita a ese repo y nunca compara un pin con su canal.

Sin conexión por construcción: la desactualización compara el pin con la ref de
seguimiento remoto conocida localmente — mejor esfuerzo, sin red — y el reporte
incluye la antigüedad del último fetch. Una ref de canal que no se resuelve
localmente sigue siendo un reporte incluso con `block`: sin conexión nunca
adivina y nunca bloquea. Solo `repos sync` hace fetch de refs de git. `change plan`
y `change apply` clonan un repo que el cambio nombra, que está ausente y tiene
`url` (`apply` crea desde cero uno sin `url`), y rechazan uno de solo lectura
(`managed: false`, o un clon superficial) antes de clonar nada; un clon que ya
existe nunca se actualiza con fetch, y `verify` y los hooks nunca hacen fetch.

## Puertas {#doors}

Dos tipos de puerta, no el mismo archivo con otro nombre:

- **Puerta del brain** — cómo trabajar en el ecosistema desde aquí: dónde vive
  cada repo, la ley, cómo entra un cambio, [el ritual](../the-change#the-ritual),
  y los pasos del SDD cuando se declara uno.
- **Puerta del consumidor** — qué es ley en este repo, dónde vive el brain, y que
  el cambio puede cruzar repos.

`multivac doors` genera ambas, bajo una sola regla: una puerta canónica,
`AGENTS.md`, proyectada hacia el resto —

- **symlink** cuando el formato es idéntico (`CLAUDE.md`, `GEMINI.md`);
- **stub** cuando no lo es (`.github/copilot-instructions.md` de Copilot, un
  archivo que quizá ya mantengas, recibe un bloque gestionado que apunta a
  `AGENTS.md`);
- **nada en absoluto** cuando el harness ya lee `AGENTS.md` — un segundo archivo
  sería una paráfrasis, que es justo lo que esta herramienta existe para evitar.

Donde no se permite un symlink — Windows sin modo desarrollador — `doors` lo
dice y nombra la alternativa en lugar de escribir un enlace roto. Cada destino y
su proyección:
[Integraciones de agentes](../../reference/integrations).

Sigue siendo una única fuente; solo varía la proyección. Por defecto no se
proyecta nada: solo `AGENTS.md`, que la mayoría de los harnesses ya lee —
`doors: [agents, claude]` en la configuración es lo que agrega el symlink.

`doors` también instala el piso de cumplimiento donde proyecta: en cada repo
consumidor escribe los mismos shims de hooks de git que los del brain, y ejecutan
`verify` acotado a las anclas de ese repo. En un repo sin hooks configurados
quedan en el directorio versionado `.multivac/hooks/` con `core.hooksPath`
apuntando a él (un hook que ya esté en `.git/hooks/` se ejecuta primero). Donde
`core.hooksPath` ya nombra un directorio, o `.husky/` está presente con la ruta
sin definir, los shims van a ese directorio, siempre que el nombre del hook esté
libre o contenga un shim anterior de multivac, y `core.hooksPath` no se toca; un
hook ahí que no ejecuta multivac no se toca, y `doors` imprime la línea que debes
agregarle. Con `strict_pre_push: true` en la configuración, el shim de pre-push
ejecuta `verify --strict`; los demás shims siguen siendo un `verify` simple en
ambos casos. Los commits que rompen cosas ocurren en los repos de código, así que
"todo lo que commitea" los incluye. `doors` nunca commitea por su cuenta. Un repo
declarado que está ausente se omite y se reporta; uno de solo lectura
(`managed: false`, o un clon superficial) no recibe puerta, ni shims, ni
`core.hooksPath`.

## El bloque gestionado {#the-managed-block}

`init` y `doors` nunca pisan una puerta existente. Todo lo que multivac escribe
en un archivo de puerta preexistente vive entre dos marcadores:

```
<!-- multivac:begin -->
…generated content…
<!-- multivac:end -->
```

El resto del archivo es del usuario. La regeneración reemplaza solo el bloque; un
archivo ausente se crea completo, con el bloque. Los repos consumidores llegan
con archivos `AGENTS.md` escritos a mano y bien trabajados, y una herramienta que
los sobrescribe pierde el argumento de adopción en el primer minuto. La
configuración de hooks del harness, `.claude/settings.json`, no usa marcadores:
multivac integra sus hooks de `verify` en el JSON y conserva cada clave y hook
que no escribió, y retoma los hooks de actualización del grafo posteriores a la
edición que escribió un multivac anterior, con un aviso.

## Skills: la tercera clase de artefacto {#skills-the-third-artifact-class}

Lo que multivac instala en un repo se divide según cuándo lo lee el agente:

| clase | se carga | lleva |
| --- | --- | --- |
| **puerta** | siempre — primera lectura de la sesión | punteros + ley: dónde está el brain, qué es vinculante, ejecuta `verify` |
| **hooks** | se disparan, y se leen cuando hablan — una ejecución limpia es una línea silenciosa, cualquier anomalía se imprime completa | cumplimiento: los shims `pre-commit`, `pre-push` y `pre-merge-commit`, hooks del harness |
| **skill** | bajo demanda | el manual de operación |

El skill lleva lo que ningún comando imprime: cómo juzgar un ancla, las
bifurcaciones `moved` y `broken`, el procedimiento de retiro, la validación de la
semilla y el protocolo de entrevista. Para el resto nombra el comando o la línea
de la puerta que lo imprime. La puerta se mantiene corta justamente porque el
manual salió de ella. multivac instala el skill solo para Claude Code, en el
brain y en cada repo de código que gestiona; la puerta del brain vacío igual le
dice a tu agente que lo cargue. La entrevista distribuida como un skill que
ejecuta el propio agente del usuario responde a la misma regla de no incrustar un
LLM que rige en todo lo demás: multivac valida y archiva la salida; nunca llama a
un modelo por sí mismo.

Las puertas, los hooks del harness y los skills viven en un único registro de
destinos que distribuye la herramienta. `.multivac/config.yml` nunca define
destinos; solo los selecciona por nombre. Agregar un harness es una entrada en el
registro — un MR a multivac — no un módulo. `doors` replica el directorio del
skill completo: lo que la fuente no distribuye se elimina de la copia, incluido
un archivo que hayas agregado ahí.
