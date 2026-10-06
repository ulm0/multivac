---
title: Composición
weight: 8
---

multivac guarda lo que debe seguir siendo verdad. No decide qué construir, y
no mapea tu código. Una herramienta de desarrollo guiado por especificaciones
responde lo primero, y multivac está hecho para ir encima de ella en vez de a
su lado; tu agente responde lo segundo leyendo el árbol.

| pregunta | la responde | alcance |
| --- | --- | --- |
| ¿Qué deberíamos construir, y con qué forma? | una **herramienta de desarrollo guiado por especificaciones** | una funcionalidad |
| ¿Dónde está esto, y qué llega hasta ahí? | **tu agente**, leyendo el árbol | un repo |
| ¿Qué debe seguir siendo verdad, y lo fue? | **multivac** | el ecosistema |

Tres preguntas distintas. Ninguna sustituye a otra, y una herramienta que
intentara responder las tres respondería dos de ellas peor que las herramientas
que ya existen.

## Adaptador primero, alternativa siempre {#adapter-first-fallback-always}

Declara una herramienta y el trabajo pasa por ella: multivac agrega la compuerta,
el puntero y los pocos archivos que dice escribir. No declares ninguna y funciona
como siempre ha funcionado.

- **Con un SDD**, cada cambio ejecuta el flujo propio de esa herramienta, desde el
  brain: la herramienta se configura una sola vez allí, y con la automatización
  activada sus pasos se imprimen una vez en cada punto del ciclo de vida y el
  siguiente comando rechaza sin sus artefactos. El archivo del cambio cita el
  directorio de la herramienta en lugar de repetirlo.

La razón es el contexto de tu agente: la herramienta ya trae su propio flujo, y
repetirlo se pagaría en cada cambio. multivac no mantiene ningún grafo de código,
así que ninguna puerta dirige a tu agente hacia uno y ningún hook reconstruye uno
tras cada edición: busca en el checkout donde trabaja.

## No competir es una regla aquí, no una postura {#not-competing-is-a-rule-here-not-a-posture}

Cada lugar donde multivac toca otra herramienta es un lugar donde pudo haberla
reimplementado y deliberadamente no lo hizo. Esos rechazos son ley, se verifican
en cada commit donde los hooks están armados, y en CI — lo cual es una
afirmación más fuerte que un párrafo en un README:

- **El agente ejecuta los pasos** — los pasos de un SDD *instruyen al agente*;
  multivac nunca ejecuta en la shell un falso `<binary> <step>` para simularlos.
- **El flujo propio de la herramienta** — un adaptador lleva una lista ordenada
  de los pasos reales de la herramienta, no un trío fijo de proponer/aplicar/archivar
  que multivac se inventó.
- **El veredicto propio de la herramienta** — donde una herramienta trae su propio
  validador, se reutiliza su veredicto. multivac no vuelve a litigar las reglas de
  otra herramienta.
- **Sin contrato adivinado** — el registro nunca inventa el contrato de una
  herramienta: las rutas que lee una entrada y los comandos que ejecuta son los
  documentados por el proveedor, nunca derivados del nombre de la herramienta.
- **La red, nombrada** — una entrada nombra cualquier red que sus comandos usen,
  porque se ejecutan en la máquina de otra persona.

Lo que multivac agrega es la parte que la herramienta no hace: **bloquea** sobre ella.
Cada paso del SDD declara el artefacto que prueba que se ejecutó, y el siguiente
comando del ciclo de vida rechaza sin él. Los pasos que no se pueden probar se
declaran imposibles de bloquear *con su razón* en lugar de simularse.

## Por qué se recomienda una herramienta SDD {#why-an-sdd-tool-is-recommended}

Sin una, el ciclo de vida igual obliga — solo que lo llevas sin avisos y sin
verificación. Eso es el modo de exploración, y es una configuración legítima
(`sdd_auto: false`); no es una mejor.

Con una declarada, cambian tres cosas:

1. La puerta del brain imprime el flujo real de esa herramienta al inicio de la
   sesión, de modo que el agente conoce la forma del trabajo antes de empezar a
   adivinar.
2. `change plan` y `change apply` rechazan hasta que existan los artefactos que
   prueban que cada paso se ejecutó — una especificación, un plan, una lista de
   tareas.
3. Donde la herramienta guarda un registro de su propio trabajo, `close` lo lee.
   Ambas herramientas SDD traen una forma de terminar un paso pasando por encima
   de su propia objeción; bloquear solo por el artefacto lo acepta en silencio.

**El costo, dicho claramente.** Declarar un SDD en un repo donde esa herramienta
nunca se ha ejecutado solía dejar sin poder planificarse el cambio que la
instala: `plan` quería un artefacto de un comando de chat que no existía hasta que
se ejecutara el `init` de la propia herramienta. Ahora el ciclo de vida ejecuta
ese init en el brain primero, y lo imprime. El costo son los archivos del
proveedor en tu árbol: los comandos y plantillas de spec-kit para tus puertas, y
para OpenSpec su directorio `openspec/` y nada más, ya que sus pasos son sus
propios verbos de terminal, que todo harness ejecuta igual. Recomendar una
herramienta sin decir eso sería venderte un hoyo.

## No es obligatorio {#not-required}

`verify`, `doctor` y `doors` funcionan sin ningún SDD declarado, no hacen llamadas
de red y no invocan ningún modelo. Sin ninguno declarado, el ciclo de vida igual
obliga por sí solo, el código no se rechaza fuera de un cambio, y tu agente busca
en el árbol. Agregar uno cambia qué tan barato resulta hacer bien el trabajo; no
es esencial para la ley en sí.

## Siguiente {#next}

Cómo configurar una, campo por campo, está en
[Herramientas SDD](../../reference/sdd).
