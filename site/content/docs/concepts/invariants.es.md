---
title: Invariantes
weight: 5
---

La ley es una tabla de afirmaciones (*claims*) con un ciclo de vida:

    proposed → active → retired

Una enmienda no es un estado: es una edición de una fila `active`, hecha a través de un
cambio (ver Enmendar más abajo). Un cuarto estado, `drift`, registra un hallazgo real al que
el código no ha llegado todavía: sus tramos reportan y nunca bloquean.

## Tres caminos de nacimiento, una tabla {#three-birth-paths-one-table}

- **Sembrada** — `seed` inventaría los límites y el agente redacta
  candidatas a partir de ellos (un `revoke update` en una migración *sugiere* "nadie
  escribe saldos"). Nace `proposed`: no es ley hasta que un humano la valida.
- **Entrevistada** — el camino desde cero: el protocolo de entrevista extrae la
  ley de la cabeza de la persona.
- **Orgánica** — el camino principal en régimen estable: una decisión tomada dentro de un
  cambio se declara invariante al cierre.

## El agente propone; el humano promulga {#the-agent-proposes-the-human-enacts}

La etiqueta de autoridad lo exige: "publicada" significa que alguien con autoridad
respondió por ella, y un LLM no puede responder por ella solo. Las nuevas afirmaciones entran como
filas `proposed`, cuyos tramos nunca bloquean, y solo un humano cambia una fila a
`active`.
La validación de lo sembrado se hace por lotes ordenados por radio de impacto:
aceptar / corregir / descartar, y lo que quede sin validar permanece marcado como
`proposed`.

### Esa regla es imposible de bloquear, y la ley lo dice {#that-rule-is-ungateable-and-the-law-says-so}

`verify` no puede comprobar *quién* promulgó una fila, y la ley la declara **imposible de bloquear
con su razón** en lugar de fingir. Dos razones, ambas propiedades de la
herramienta y no carencias de ella. multivac nunca fabrica una identidad de git: se
ejecuta como quien lo ejecute, así que un agente que trabaja en tu máquina hace commits con tu
nombre y nada en el repositorio distingue a uno del otro. Y un hook de git se ejecuta
con los permisos de quien lo invoca, así que cualquier compuerta instalada en pre-commit es una compuerta que el
mismo proceso puede saltarse — una barrera de protección no puede estar del lado de aquello que
debe detener.

Donde *sí* se aplica es en la forja: el botón de merge, en manos de una cuenta que el
agente no tiene. Nada aterriza en `main` directamente.

La mitad que *sí* se comprueba no es **quién** sino **cuándo**. Una fila que llega a
`active` en el mismo commit que escribe el código al que está anclada es una regla que nadie
revisó por sí sola — la afirmación y su evidencia llegan juntas bajo una misma mano
— así que `verify` rechaza ese commit y nombra los archivos que hay que sacar del stage. Lo decide
a partir del índice contra `HEAD`, lo que significa que solo puede responder mientras se
compone un commit; fuera de uno imprime que no pudo responder en vez de
pasar en silencio. No es un límite de seguridad: nada aquí detiene a una persona
con permisos de push que decida saltárselo.

## Enmendar {#amend}

Una invariante **nunca se relaja en el código** — se cambia primero en la ley.
Un cambio lista la fila bajo `invariants.touches`, actualiza la fila (con fecha) en
ese cambio, y el código sigue en el mismo cambio. Declara la fila enmendada como una de las
**afirmaciones** del cambio y `change close` vuelve a ejecutar verify sobre ella antes de
archivar; si solo figura bajo `touches`, `verify` la reporta en cada commit
donde los hooks están armados, y solo se rechaza en un modo bloqueante o con
`--strict`, en lugar de ser comprobada por `close`.

## Retirar {#retire}

La fila no se borra — se marca `retired` y conserva su ID. En una fila retirada
`verify` evalúa solo los tramos `absent`; todos los demás modos dejan de
evaluarse, y un tramo `absent` que la fila ya tenía sigue bloqueando, porque
`verify` no puede distinguirlo de una lápida. La lápida es **escrita, no
derivada**: retirar escribe NUEVOS tramos `absent` en esa fila para los identificadores del
mecanismo muerto — los nombres que alguien buscaría con grep, en cada superficie
donde podrían reaparecer:

```markdown
| INV-19 | RETIRED — cart reservation holds stock. | specified | retired | 2026-08-13 | journal |
<!-- @anchor INV-19 api:src/**/*.ts /reserveStock/ absent -->
<!-- @anchor INV-19 *:AGENTS.md /(^|[^[:alnum:]_])stock[[:space:]]+reservation([^[:alnum:]_]|$)/i absent -->
```

Los tramos existentes nunca se invierten: invertir un tramo de promulgación exigiría que la
promulgación misma desapareciera, lo cual es incorrecto en el caso general. La misma
primitiva, tramos nuevos. En el mismo cambio, los restos del mecanismo muerto salen
del código y de las puertas — los nuevos tramos obligan al cambio a cumplirlo al cierre.

## IDs {#ids}

**Estables, nunca renumerados, nunca reutilizados.** La historia — quién, cuándo, por qué — es
git, no se duplica en metadatos.
