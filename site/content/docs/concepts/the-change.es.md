---
title: El cambio
weight: 4
---

El cambio del ecosistema: se planifica en el brain, se ejecuta en cada repo
que la funcionalidad toca y se cierra de vuelta en el brain. El verbo al que
sirven los otros tres trabajos.

```
multivac change new "points expire"
multivac change plan <slug>     # which repos, in what order, which invariants it touches
multivac change apply <slug>    # branch per repo from its default branch, edits, commits
multivac change land <slug>     # MRs respecting the declared order
multivac change close <slug>    # updates the brain and verifies the declared claims
```

## Cuatro campos declarados {#four-declared-fields}

Un cambio declara, antes de tocar nada:

1. **Qué repos toca.** Claves del registro. Un repo que aún no existe es
   válido: `apply` en modo greenfield lo crea.
2. **Orden de aterrizaje: etapas ordenadas.** Cada etapa es una lista de
   claves de repo; los repos de la misma etapa aterrizan en paralelo; una
   etapa aterriza solo después de todas las anteriores:

   ```yaml
   landing_order:
     - [api]              # web and worker consume what api serves
     - [web, worker]
   ```

   El orden es ley para `land`; declara solo el orden que sea una restricción
   real: una lista vacía es una única etapa en paralelo.
3. **Qué invariantes toca**, bajo la regla: un invariante nunca se relaja en
   el código; se cambia primero en la ley, con fecha, dentro del mismo cambio.
4. **Qué filas hace verdaderas**: sus afirmaciones (*claims*), cada una el ID
   de una fila, con sus anclas. La fila enuncia la regla; la afirmación la cita
   y nunca la repite. Este es el contrato que `close` verifica. Redacta las
   anclas ahora, mientras la promesa está fresca: después del merge nadie la
   recuerda.

## El archivo del cambio {#the-change-file}

Un cambio es un **archivo en el brain**: `.multivac/changes/<slug>.md`, que
lleva los cuatro campos declarados más el estado por repo
(`planned / branched / committed / mr / landed`). Ese archivo es el estado que
los cinco subcomandos leen y escriben, a lo largo de días y máquinas. Al
cerrarse se archiva, nunca se borra.

## Terminado cuando sus anclas resuelven {#done-when-its-anchors-resolve}

> Un cambio no está terminado cuando se hace merge. Está terminado cuando sus anclas resuelven.

Como las afirmaciones se declararon desde el principio, `close` no pregunta si
alguien actualizó la documentación: vuelve a ejecutar `verify` **acotado a las
afirmaciones declaradas** y se rechaza a archivar hasta que:

- cada afirmación del campo 4 resuelva ok o moved en sus nuevas anclas,
- cada afirmación cite una fila que este cambio agrega, toca o retira, y esa
  fila enuncie su regla,
- cada repo declarado esté registrado como aterrizado,
- ninguna afirmación esté anclada solo en el archivo del cambio, que `close`
  archiva, y ninguna fila que el cambio agrega quede sin afirmar mientras está
  anclada o ya está en la ley,
- existan los artefactos propios del SDD, donde se haya declarado uno.

Ese alcance es deliberado y es más estrecho de lo que parece: `close` evalúa
los **IDs de afirmación que el cambio declaró**, no las filas bajo `touches` ni
`retires`, y nunca ejecuta un verify sin acotar. Una fila modificada que nadie
listó como afirmación no se vuelve a comprobar aquí: `verify` la reporta en
cada commit donde los hooks están armados. Un tramo de ella bloquea solo cuando
está roto o vacuo en un modo que bloquea (por defecto `absent`, `count` y
`each`), o en cualquier modo bajo `--strict`, como lo ejecuta el CI, y los
tramos de una fila `proposed` o `drift` solo se reportan. Una línea de ancla
que no se puede interpretar, o que nombra una clave de repo que la
configuración no declara, se rechaza en cualquier fila. Declara como
afirmaciones las filas que modificas si quieres que `close` sea quien
responda.

Donde `sdd_auto` está activado y un SDD gobierna un repo declarado (el brain
mismo, cuando se declara como uno), el código también llega a través del
cambio. En el checkout propio del brain y en los worktrees de un cambio, se
rechaza un commit o un merge de código fuera de la rama de un cambio abierto
que declare el repo, y también un merge request cuyos commits lo hagan,
cuando el pipeline ejecuta
`verify --strict --range <base>..<head> --branch <name>`. Un checkout
consumidor lee un brain montado que puede ir por detrás del cambio, así que
allí una rama que no es un cambio abierto solo se reporta y decide la
ejecución con `--range` en el CI, mientras que una rama cuyo cambio abierto no
declara el repo se rechaza en cualquier ejecución. Un cambio es la forma en que el código llega a un
repo, no una descripción escrita a su lado.

Actualizar la documentación deja de ser disciplina y se vuelve mecanismo.
No se inventa nada nuevo: el cambio declara antes lo que hoy se comprueba
después, cuando alguien lo recuerda.

## El ritual {#the-ritual}

Cerrar un cambio es una **ceremonia**, y solo la mitad es mecánica.
multivac ejecuta esa mitad: cada repo declarado aterrizado, cada afirmación
declarada resuelve y cita una fila de la ley que enuncia su regla. La otra
mitad es del equipo: quién revisa qué, a quién se avisa, qué sale antes de qué
cuando la razón no es técnica. Ninguna herramienta puede inventar eso, y
ninguna puede comprobarlo.

Así que el equipo lo escribe, una línea cada uno, en `.multivac/ritual.md`
junto a la ley, y `close` imprime esas líneas como una lista de verificación
una vez que la compuerta ha pasado y el cambio está archivado:

```txt
$ mvac change close points-expire
…
ritual (.multivac/ritual.md) — multivac cannot check these; walk them with the user:
  - [ ] tell support before the flag flips
  - [ ] the public site ships before the backend
```

Lo que `close` imprime antes del ritual (las afirmaciones, el archivo y el
commit por hacer) está en la [referencia de comandos](../../reference/commands/#close).

**Impreso, no verificado.** Nada bloquea por el ritual y nada lo comprueba;
los encabezados y los comentarios se omiten, así que un ritual vacío o ausente
no imprime nada en absoluto. `init` genera el archivo con una explicación y
líneas candidatas, todas comentadas, y la puerta del brain lo nombra.

Tiene su propio archivo y no una sección de la ley porque la ley se analiza:
`verify` lee sus anclas, `plan` lee sus celdas de estado; y el ritual es prosa
que la herramienta solo imprime.

## Planificado: un cambio que no ha comenzado {#planned--a-change-that-has-not-started}

Un roadmap es la lista de cosas que un ecosistema pretende hacer, y el brain
ya guarda esa lista. Todo archivo de cambio nace `open`, lo que significa que
se da por hecha una rama y se reserva un id de invariante. Así que, sin un
estado más, la única forma de anotar una intención es comprometerse a empezarla
hoy, y la alternativa a la que la gente recurre es una segunda lista en un wiki
o en un tracker, que se desvía de la primera en una semana. La lista que la
herramienta no lee se vuelve ficción.

`planned` se ubica antes del ciclo de vida:

```txt
planned → open → archived
```

Es el mismo archivo, en el mismo directorio, con el mismo esquema, más un
`horizon` de `now`, `next` o `later`. Ese es todo el modelo de orden: sin
fechas, sin estimaciones, sin ranking, sin dependencias entre elementos.
Empezar el trabajo es `change new <slug>` sobre un slug que ya está
planificado: el archivo se **promueve**, no se reemplaza, de modo que la prosa
escrita cuando la idea era joven sobrevive en el cambio que la implementa. Un
documento, una historia.

Tres propiedades hacen que el estado sea seguro de usar y no decorativo:

- **No reserva nada.** Un id asignado a un trabajo que quizá nunca ocurra es un
  hueco en la tabla de la ley que ningún cambio posterior puede llenar. La
  reserva se queda en `change new`, el momento en que el trabajo realmente
  comienza.
- **No bloquea nada.** `verify --strict` rechaza un cambio solo cuando ya está
  terminado y sigue sin cerrar: cada afirmación resuelve, cada repo declarado
  aterrizado. Un cambio planificado no tiene ninguna de las dos cosas, así que
  ninguna entrada del roadmap puede retener un release, por mucho que el
  roadmap siga sin estar vacío.
- **No es una compuerta.** `change new` sobre un slug que nadie planificó
  funciona exactamente como siempre. Exigir que una funcionalidad aparezca
  primero en el roadmap es una intención inverificable, de la misma categoría
  que el ritual, y por eso el ritual se imprime y nunca se comprueba. Una
  compuerta que todos aprenden a saltarse a las tres de la mañana enseña a la
  gente a esquivar la herramienta.

Todo paso posterior (`plan`, `apply`, `land`, `close`) rechaza un cambio que no
ha comenzado y nombra `change new` como el paso que va primero. Donde se declara
un SDD, `plan`, `apply` y `close` ejecutan su compuerta antes de esa
comprobación, así que su rechazo puede deberse a un artefacto faltante;
`close --abandon` no ejecuta ninguna compuerta, así que un cambio planificado
siempre recibe allí el rechazo de no iniciado.

Consulta [`roadmap`](../../reference/commands/#roadmap-add-slug-title---horizon-nownextlater--sync)
para el comando, y [Ejecutar cambios](../../guide/running-changes/#roadmap--write-it-down-without-starting-it)
para el flujo.

### El ritual llega con candidatos {#the-ritual-arrives-with-candidates}

`init` solía escribir el ritual como un comentario vacío, y ante una página en
blanco la mayoría no escribe nada, así que el paso de cierre no imprimía nada
nunca. Ahora trae candidatos sacados de lo que declaraste, **todos comentados**.

Una ceremonia no adoptada no es una ceremonia. Descomenta lo que tu equipo
realmente se debe y borra el resto; no se afirma nada en tu nombre, y una línea
comentada nunca se imprime. Un brain nuevo sigue sin imprimir nada al cerrar,
que es exactamente lo que hacía antes.

Solo se siembran cosas que ninguna comprobación podría decidir: poner algo
comprobado en el ritual lo llevaría a un póster.

El ritual es **de autoría propia**: lo escribes una vez tú y ningún comando lo
sobrescribe. Es lo opuesto a
[`flow.md`](../../reference/commands/#multivacflowmd--what-your-declarations-oblige),
que es derivado y se reescribe completo en cada proyección.

## Los subcomandos {#the-subcommands}

- **plan** resuelve la declaración contra la realidad: qué repos declarados
  están presentes, qué implica el orden, qué toca el cambio. Un repo declarado
  que falta en local y tiene `url` se clona aquí: una operación explícita que lo
  necesita, el mismo contrato que `git submodule update`.
- **apply** crea una rama en cada repo desde su rama por defecto, resuelta en
  este orden: a donde apunta `origin/HEAD`, luego el `init.defaultBranch` de
  esta máquina, luego `main`, luego `master`, nunca un nombre fijo; si no
  existe ninguna, crea la rama desde el HEAD actual y lo dice. Un repo que no
  existe se clona desde su `url`, o se crea con su puerta de consumidor cuando
  no tiene ninguna. Las ediciones y los commits son tuyos, en esas ramas. El
  paso apply de un adaptador SDD declarado se **imprime** aquí para que lo
  ejecutes (`--no-sdd` omite la impresión, el init propio de la herramienta en
  el brain y la compuerta de este paso por una ejecución; los pasos posteriores
  la necesitan de nuevo).
- **land** reporta el orden de MRs que dictan las etapas: qué está listo para
  hacer push ahora, qué está bloqueado detrás de una etapa anterior. No abre
  nada (multivac no tiene integración con ningún forge) y `--landed <repo>` sirve
  para que registres un merge.
- **close** es la compuerta de arriba. Si tiene éxito, el archivo del cambio se
  archiva; las filas que el cambio prometió ya están en la ley, promulgadas por
  el humano.

Las decisiones tomadas a mitad de un cambio se vuelven afirmaciones al cerrar:
el agente propone la fila, el humano la promulga. Esta es la vía orgánica de
nacimiento, la principal en régimen estable.

## Greenfield {#greenfield}

Un cambio cuyos repos aún no existen: `apply` los crea (`git init`, la puerta
del consumidor, un primer commit) para que la primera sesión del agente en
cada uno parta en una puerta que lo apunta a la ley; el brain mismo se monta
con `multivac repos sync`. El brain precede al código. Sin una segunda
maquinaria: `apply` sabe crear, no solo editar.
