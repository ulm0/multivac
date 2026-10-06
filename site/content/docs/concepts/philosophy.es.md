---
title: Filosofía
weight: 1
---

Eres un agente. Alguien te pide cambiar un sistema que abarca más repos de
los que caben en tu contexto. Antes de escribir una línea, lees lo que el
proyecto dice de sí mismo: un `CLAUDE.md`, un archivo de reglas, una página de
wiki, la sección de "reglas innegociables" que alguien escribió al comienzo de
un servicio.

La pregunta que multivac existe para responder es: **¿sigue siendo verdad algo de eso?**

## Una paráfrasis envejece en silencio {#a-paraphrase-ages-silently}

Cada uno de esos documentos es una paráfrasis. Alguien leyó la restricción
real y la volvió a escribir, con sus propias palabras, en un segundo lugar. Esa
reescritura es el modo de fallo: el original puede cambiar y la copia no tiene
forma de enterarse. Nada se rompe. Ningún test se pone en rojo. La frase
simplemente empieza a mentir en silencio, y sigue cargándose en cada sesión,
primero, como contexto.

En el ecosistema contra el que se validó este diseño, las "reglas
innegociables" de cada repo consumidor eran transcripciones manuales de la ley
central. Un mecanismo que había sido retirado seguía descrito **en tiempo
presente** dentro de dos de esas secciones de reglas once días después de su
muerte, además de cinco archivos de especificación vigentes. Nadie fue
descuidado. La paráfrasis simplemente no tiene un mecanismo para envejecer.

La alternativa es una **cita**. No "las cuentas las crea una sola migración"
reescrito en cuatro repos, sino una afirmación (*claim*) con un ID y, en todos
los demás lugares, un puntero hacia ella. Una cita tiene una propiedad que una
paráfrasis nunca tiene: puede verificarse, de forma mecánica, ahora mismo, sin
conexión y sin ningún modelo de por medio.

```
| INV-02 | Account rows are created by exactly one migration. | specified | active | 2026-08-13 | ADR-4 |
<!-- @anchor INV-02 api:sql/migrations/*.sql /CREATE TABLE accounts/ unique -->
```

La fila es la afirmación. El comentario debajo es el ancla: una aserción
basada en contenido sobre el código: *en ese repo, en esos archivos, exactamente
una línea coincide con esto*. Ejecutado desde el brain, `mvac verify` lee cada
repo hermano tal como fue publicado, en su ref de canal (su árbol de trabajo
bajo `--worktree`, o cuando el ref no se resuelve aquí); ejecutado desde el
propio repo, lee el árbol de trabajo de ese checkout. Si alguien agrega una
segunda migración que crea cuentas, la afirmación se pone en rojo el mismo día,
no once días después.

Esa es toda la idea. Todo lo demás es la fontanería alrededor de ella.

## Tres capas, y cuáles de ellas puede escribir una máquina {#three-layers-and-which-of-them-a-machine-can-write}

Un brain tiene tres capas, y no todas se pueden derivar por igual:

| capa | qué es | ¿derivable del código? |
| --- | --- | --- |
| **Mapa** | qué existe, qué llama a qué, qué contrato expone cada cosa | **sí**, y bien: esto es lo que producen `mvac seed` y la búsqueda de tu propio agente en el árbol |
| **Ley** | qué es innegociable, y por qué | **no**: "un abogado validó esta frase" no vive en ningún AST |
| **Diario** | por qué se revirtió una decisión | **no**: se acumula hacia adelante, no se puede recalcular |

Esta tabla es la razón por la que multivac no es un generador de
documentación. Generar el mapa es un problema resuelto y la herramienta no
compite en eso: `mvac seed` inventaría dónde vive la arquitectura, y tu agente
lee el árbol para el resto. La ley es la parte que ningún análisis estático
alcanza, porque las restricciones interesantes son las que vienen de fuera del
código: un regulador, un contrato, un postmortem, una decisión que alguien
tomó en una sala. Y el diario es la única capa que no se puede regenerar en
absoluto, lo que lo convierte en el activo y no en el costo.

Así que el trabajo de la herramienta no es "leer el repo y escribir la
documentación". Es: **inventariar los límites, entrevistar para obtener la
ley y luego mantener la ley honesta frente al código para siempre.**

## Quién propone, quién promulga {#who-proposes-who-enacts}

Un agente puede redactar. Solo un humano promulga.

Esa es la regla del proyecto, y `verify` no puede comprobar quién hizo un
commit; consulta [Invariantes](../invariants#that-rule-is-ungateable-and-the-law-says-so).
Lo que sí rechaza es el momento: una fila que pasa a `active` en el mismo
commit que el código que ancla. `mvac seed` produce un inventario determinista
de límites: sin interpretación, nada que sea ley. Tu agente lo lee y redacta
filas en estado `proposed`. Los tramos de una fila `proposed` los reporta
`verify` y **nunca bloquean**, ni siquiera con `--strict`. La fila pasa a
`active` cuando un humano mueve la celda de estado, en un commit propio.

La razón no es ceremonia. Un modelo que extrae invariantes de un código base
produce afirmaciones seguras, plausibles y erróneas, y una afirmación errónea
promovida a ley es peor que ninguna afirmación: ahora bloquea código correcto
y autoriza código incorrecto. Por eso el camino de verificación no contiene
ningún modelo: ni clave de API, ni llamada de red, ni inferencia; y el camino
de redacción no contiene autoridad. El agente que redacta es tuyo, corre en tu
harness, en tus términos; multivac valida y archiva lo que produce y nunca
llama a un modelo por sí mismo.

## El ritual {#the-ritual}

Cerrar un cambio tiene dos mitades. Una es mecánica, y multivac la ejecuta:
cada repo declarado aterrizó, y cada afirmación que el cambio prometió se
resuelve en verde y cita una fila de la ley que enuncia su regla. `mvac change close`
rechaza hasta que esa mitad pasa.

La otra mitad es del equipo, y ninguna herramienta puede inventarla ni
comprobarla: quién revisa qué, a quién se le avisa, qué sale antes que qué
cuando la razón no es técnica. Esa mitad vive en `.multivac/ritual.md`,
escrita por el equipo en prosa simple, y una vez que la compuerta pasa,
`change close` imprime sus líneas tal como están escritas, en el orden del
archivo, sin encabezados, comentarios ni líneas en blanco:

```txt
$ mvac change close points-expire
…
ritual (.multivac/ritual.md) — multivac cannot check these; walk them with the user:
  - [ ] Somebody who did not write it read it, and said so out loud.
  - [ ] What this taught that is not yet law is written down somewhere a person will find it.
```

Lo que `close` imprime antes del ritual está en la
[referencia de comandos](../../reference/commands/#close).

Se imprime, nunca se comprueba, nunca bloquea. Un ritual ausente, o uno con
solo encabezados y comentarios, no imprime nada. Tiene su propio archivo y no
una sección de la ley porque la ley es una tabla analizada por máquina:
`verify` lee sus anclas, `change plan` lee sus celdas de estado, y la prosa
libre dentro de una tabla analizada es la forma en que un parser aprende a
mentir.

## Qué se desprende de todo esto {#what-follows-from-all-this}

- **Determinista o nada.** `verify` usa `git ls-files` y un motor de
  expresiones regulares. Mismos bytes, misma respuesta, y cada ejecución
  imprime qué bytes leyó: el ref o la rama y el sha de cada repo y, para un
  hermano leído en su ref de canal, cuándo se hizo fetch por última vez aquí.
- **El mensaje es el producto, no el código de salida.** Un tramo en rojo dice
  qué archivo, qué línea y qué hacer al respecto. El consumidor es un agente a
  punto de actuar, no un panel que alguien revisa mañana.
- **Severidad asimétrica.** Una lápida ("esto está muerto, no lo llames")
  bloquea. Una verificación de presencia que falla porque se renombró un
  archivo se autocorrige y sale con 0. El ruido que bloquea se desactiva; una
  protección que nunca bloquea se ignora.
- **El cumplimiento forzado se degrada, nunca te deja fuera.** Una máquina sin el
  binario en el `PATH` hace commits con normalidad. Consulta [Hooks](../../reference/hooks).
- **Las afirmaciones sin anclar se cuentan, no se fingen verificadas.** Una
  ejecución de `verify` en el brain imprime el conteo y el porcentaje de
  ancladas en su línea de encabezado y nombra las filas sin anclar. Grep cubre
  lápidas, no semántica, y la herramienta lo dice en lugar de insinuar una
  cobertura que no tiene.

Siguiente: [Desarrollo guiado por el brain](../brain-driven-development) para
la práctica, o [Afirmaciones y anclas](../claims-and-anchors) para la gramática.
