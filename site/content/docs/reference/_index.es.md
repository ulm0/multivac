---
title: Referencia
weight: 3
description: >-
  Cada comando, cada clave de configuración, la escalera de hooks y las herramientas SDD que multivac ha verificado, con lo que cada una obliga.
---

La superficie completa, escrita contra el binario compilado. Cada bloque de salida
de estas páginas se capturó de una ejecución real; cada flag se leyó del parser
que lo consume.

{{< cards >}}
  {{< card link="commands" title="Comandos" subtitle="Los diez, cada flag, la matriz de códigos de salida, salida real de cada uno." >}}
  {{< card link="configuration" title="Configuración" subtitle=".multivac/config.yml clave por clave: tipo, valor por defecto, ejemplo, qué se rompe sin ella." >}}
  {{< card link="integrations" title="Integraciones de agentes" subtitle="Una sección por entrada del registro: qué archivo se escribe, cómo, y qué hacen las puertas por él." >}}
  {{< card link="sdd" title="Herramientas SDD" subtitle="Artefacto vs binario, la política de tres estados, el flujo y las compuertas propias de cada herramienta, sdd_auto y --no-sdd." >}}
  {{< card link="hooks" title="Hooks" subtitle="La escalera de cumplimiento: los hooks de git como piso, los hooks del harness como techo." >}}
{{< /cards >}}
