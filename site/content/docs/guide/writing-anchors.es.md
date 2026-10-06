---
title: Escribir anclas
weight: 4
---

Un ancla es una afirmación (*claim*) basada en contenido sobre el código: "en ese repo, en esos
archivos, algo coincide con esto". Las líneas se mueven en el primer commit; el contenido
sobrevive. Escribe las anclas de modo que una falla de verify signifique que la afirmación
está realmente en duda.

## Gramática {#grammar}

Un tramo por línea, un comentario HTML justo debajo de la fila de la afirmación en
`.multivac/invariants.md`: invisible al renderizar, fácil de buscar con grep, sin un archivo paralelo que
derive. Verify las lee desde los `*.md` de la raíz del brain, `.multivac/*.md` y
`.multivac/changes/*.md`; un ancla dentro de un bloque de código, con sangría de cuatro espacios o
en un archivo de cualquier otro directorio se omite sin avisar, así que su afirmación simplemente
se lee como sin anclar y una lápida allí no bloquea nada:

```txt
<!-- @anchor <CLAIM-ID> <repo-key>:<glob> [![<repo-key>:]<glob> ...] /<regex>/[flags] [mode] -->
```

- **CLAIM-ID** es explícito, nunca se infiere por proximidad. Es la clave de unión
  para el reporte y para `change close`.
- **repo-key** es la clave del registro en `.multivac/config.yml` (`api`),
  nunca el nombre del directorio (`acme-api`). `*` = todos los repos declarados más
  el propio brain.
- **glob** es un patrón picomatch sobre rutas relativas al repo, separadas por `/`
  (lo que imprime `git ls-files`): `**` cruza directorios, `{a,b}`
  alterna, los dotfiles coinciden. No es shell, no es regex: `src/*.ts` no encuentra
  `src/lib/git.ts`, así que escribe `src/**/*.ts`.
- **`!<glob>`** excluye, y se aplica después de la inclusión. El conjunto de archivos que
  sobrevive es el que se evalúa, y el que cuenta para la vacuidad.
- **`!<repo-key>:<glob>`** excluye *solo en ese repo*. Una exclusión sin calificar es
  relativa al repo y actúa en cada repo que evalúa el tramo, así que bajo `*` exime
  al homónimo de la ruta en todas partes; califícala para eximir a un solo repo:

  ```txt
  <!-- @anchor INV-77 *:**.md !brain:07-rules.md /PIN/ absent -->
  ```

  "ningún PIN en ningún markdown, en ninguna parte, excepto la página del brain que
  lleva la lápida". Un `07-rules.md` en otro repo se sigue revisando.
  Una exclusión que nombra un repo no declarado es un error de análisis que nombra la clave;
  calificar una exclusión en un tramo de un solo repo es legal y redundante.
- **Flags**: solo `i`.
- **mode**: `present` (por defecto), `absent`, `unique`, `count=N`, `each`,
  `each!`.
- **Un solo glob de inclusión por tramo.** Alterna rutas con llaves:
  `api:{src,lib}/**/*.ts`, nunca con un segundo glob; solo las exclusiones se repiten.
- La gramática completa está a una pantalla de distancia: `mvac help anchor`. Antes de fijar un
  `count=N`, haz una prueba en seco del tramo con `mvac count '<repo>:<glob> /<regex>/'`:
  imprime el desglose por archivo con el mismo evaluador de verify, así que
  el ratchet queda bien a la primera.

Una afirmación puede llevar varios tramos; los tramos se combinan con AND. Si falla, la afirmación
hereda la severidad del peor tramo que falla, y verify reporta por tramo.

## Dialecto: POSIX ERE, impuesto {#dialect-posix-ere-enforced}

El único dialecto que todos los motores en todas las máquinas ejecutan igual.
`\s` `\b` `\d` `\w` se rechazan al analizar: `git grep` de macOS los descarta
en silencio, lo que convierte una lápida en un pase vacuo. El error se imprime
sobre el conteo de afirmaciones, y un error de análisis sale con 1 en todos los modos:

```txt
$ mvac verify
  parse     .multivac/invariants.md:10 — \s is not POSIX ERE — use [[:space:]]

3 claims · 2 anchored (67%)
  ...
```

La línea de resumen dice `0 blocking broken · exit 1 · 1 anchor parse errors`.

Tradúcelo así:

| PCRE | POSIX |
| --- | --- |
| `\s` | `[[:space:]]` |
| `\d` | `[[:digit:]]` |
| `\w` | `[[:alnum:]_]` |
| `\b` | `(^\|[^[:alnum:]_])` … `([^[:alnum:]_]\|$)` |

Otras cuatro construcciones se rechazan por la misma razón: significan algo en
JavaScript y otra cosa, o nada, para `git grep`:

| Escrito | Por qué se rechaza |
| --- | --- |
| `(?=` `(?!` `(?:` | POSIX ERE no tiene lookaround ni grupos sin captura |
| `*?` `+?` `??` | Los cuantificadores de POSIX ERE son voraces; no existe forma perezosa |
| `\1` … `\9` | POSIX ERE no tiene referencias hacia atrás |
| `\t` `\n`, cualquier escape alfabético | POSIX ERE solo escapa signos de puntuación |

Y el error que antes compilaba: una clase de caracteres necesita AMBOS pares de
corchetes. `[[:digit:]]` es la clase; `[:digit:]` es una expresión de corchetes cuyos
miembros son `:`, `d`, `i`, `g`, `t`, así que `PIN[:digit:]` antes se convertía en
`PIN0-9`, que coincidía con ese texto literal y nunca con `PIN4`. Ahora se rechaza, con las
palabras del propio `git grep`: *character class syntax is `[[:digit:]]`, not
`[:digit:]`*.

## Reglas de coincidencia que debes conocer {#matching-rules-you-must-know}

- **Los archivos `.sql` coinciden por sentencia, no por línea.** Se quitan los comentarios,
  se colapsan los espacios y se divide en `;`. El DDL real reparte un GRANT en
  varias líneas; una lápida por línea sobre DDL tiene una vía de escape por construcción. Los demás
  archivos coinciden por línea: mantén el patrón de cada tramo en una línea física
  del destino.
- **Las superficies de solo anexar (migraciones) le mienten a `present`.** Una coincidencia prueba
  "se construyó así", nunca "sigue siendo así"; `unique`/`count` confunden el historial
  con HEAD. Sobre migraciones, apunta a la última definición
  del objeto o usa `count=N` como ratchet.
- **`count=N` es un ratchet de borrado, nunca un universal.** Cuenta las coincidencias
  en TODOS los archivos que coinciden con el glob: detecta una eliminación, no un archivo nuevo
  que omite el patrón. La medición 2 lo probó por inyección: un
  contenedor `privileged: true` agregado a un manifiesto k8s por defecto dejó
  quince anclas en verde con código de salida 0. "Para cada archivo, P" es `each`; "para ningún
  archivo, P" es `each!`: cuantificado por archivo, con los archivos que fallan nombrados. La prueba en seco de
  `count` te empuja hacia aquí a propósito: todo resumen que ofrece un ratchet
  termina nombrando `each`/`each!`, así que una regla con forma de universal nunca se
  fija como ratchet por accidente.
- **Los globs vacuos fallan con ruido.** Un glob que no coincide con ningún archivo rastreado es
  `vacuous` para `absent`, `unique`, `count` y `each`, y para `present`
  cuando su regex tampoco tiene a dónde moverse (ver `moved`).
  `absent`/`count`/`each` bloquean: un cambio de nombre de directorio no debe poner en verde
  una lápida en silencio, y un universal sobre nada no prueba nada. `present`/`unique`
  se reportan y bloquean solo con `--strict`:

  ```txt
  vacuous   INV-01 [absent] .multivac/invariants.md:7 · glob matched no tracked files — a rename greens this tombstone silently; fix the glob · blocking
  ```

- **`moved` se autocorrige.** Un tramo `present` sin coincidencia dentro de su glob, cuyas
  coincidencias en otra parte caen en exactamente un archivo (del mismo tipo que la inclusión, es decir,
  la misma extensión final), nunca dentro de `.multivac/`, recibe su glob reescrito
  en el lugar, con código de salida 0. `verify --check` y una ejecución desde un repo consumidor reportan
  el movimiento y dejan el glob intacto:

  ```txt
  moved     INV-01 [present] .multivac/invariants.md:6 · glob rewritten to sql/migrations/001_accounts.sql — review the diff
  ```

  Revisa el diff como cualquier otra edición y deja que viaje en la misma rama.
  Sin tal archivo el tramo sigue roto: vacuo, si su glob está vacío.
  Con varios archivos también está roto, y se nombran los primeros tres.

## Elegir el modo {#choosing-the-mode}

**Ancla a contratos, no a implementaciones**: migraciones, esquemas, tablas de
rutas, claves de configuración, GRANTs. Un sitio de contrato es a la vez lo más barato
de leer y lo más estable para anclar; el cuerpo de un widget se rompe
el martes. Si te encuentras anclando una implementación, primero pregúntate
si existe un sitio de contrato para la afirmación; ancla la implementación
solo cuando no lo haya, y espera cambios constantes.

| lo que fijas | modo |
| --- | --- |
| la regla se promulgó (el revoke, la restricción, la verificación existe) | `present` |
| un mecanismo muerto sigue muerto: la lápida | `absent` |
| una única fuente de un valor | `unique` |
| "nunca más" sobre un historial de solo anexar; una excepción autorizada sigue siendo la única | `count=N` |
| cada archivo coincidente cumple la regla ("todo manifiesto declara límites") | `each` |
| ningún archivo coincidente lleva el patrón, y el infractor se nombra por archivo | `each!` |

`absent`, `count` y `each` bloquean por defecto; `present` y `unique` reportan
y bloquean solo con `--strict`. Pon los
dientes en los modos bloqueantes y deja que `present` documente la promulgación. Sin
esa asimetría cada refactor pone el chequeo en rojo y alguien desactiva la
herramienta en la tercera semana: las herramientas de la familia lint mueren de ruido, no de errores.

### El universal: `each` y `each!` {#the-universal-each-and-each}

`each` se cumple si **todos** los archivos que coinciden con el glob (tras las exclusiones) contienen
al menos una coincidencia; `each!` si todos esos archivos no contienen ninguna. Una violación es
una falla dura y los archivos que fallan se **nombran**: los primeros más el conteo:

```txt
broken    INV-90 [each] .multivac/invariants.md:9 · each: 1 of 4 files lack the pattern (api:k8s/rogue.yaml) — add it there, or exclude the file with !<glob> · blocking
```

Exime un archivo autorizado con una exclusión (`!api:k8s/debug.yaml`). Dentro de los
archivos `.sql` coincidentes se aplica la normalización por sentencia como en todo lo
demás. `absent` simple también dice "en ninguna parte del glob"; recurre a `each!` cuando
quieras el reporte por archivo (cada infractor una vez, como "N de M archivos") en lugar
de las primeras tres coincidencias. Lo que
`each` no puede decir, deliberadamente, es una **relación entre archivos** ("la
copia vendorizada es igual a la copia de la raíz", "la variable de entorno coincide con el
containerPort"). Eso es otra primitiva, no un cuantificador; deja esas
afirmaciones sin anclar en lugar de fingirlas.

```markdown
| INV-90 | Every deployment is confined: limits declared, never privileged. | published | active | 2026-08-14 | map |
<!-- @anchor INV-90 api:k8s/*.yaml /limits:/ each -->
<!-- @anchor INV-90 api:k8s/*.yaml /privileged:[[:space:]]*true/ each! -->
```

## El patrón de tramos {#the-legs-pattern}

Una afirmación, varios tramos, todos deben cumplirse. La forma canónica: promulgación,
lápida, ratchet:

```markdown
| INV-01 | Nobody has UPDATE on `accounts`, not even `admin_role`. | published | active | 2026-08-13 | map |
<!-- @anchor INV-01 api:db/migrations/*.sql /revoke[[:space:]]+update[[:space:]]+on[[:space:]]+[^[:space:]]*accounts/i -->
<!-- @anchor INV-01 api:db/migrations/*.sql /grant[[:space:]]+update[[:space:]]+on[[:space:]]+[^[:space:]]*accounts/i absent -->
<!-- @anchor INV-01 api:db/migrations/*.sql /update[[:space:]]+accounts/i count=1 -->
```

El `present` prueba que la regla se promulgó; el `absent` mata el re-grant;
el `count=1` fija el único `update accounts` autorizado en el historial: cualquier
ocurrencia nueva lo rompe. Una lápida puede cruzar repos:

```txt
<!-- @anchor INV-42 *:AGENTS.md /(^|[^[:alnum:]_])legacy_token([^[:alnum:]_]|$)/ absent -->
```

El diccionario de términos muertos no es una función aparte: son estos tramos
`absent`, acumulados en filas retiradas, bloqueando para siempre.

## Antes de confirmar un ancla: dos autochequeos {#before-committing-an-anchor-two-self-checks}

Ejecuta ambos. Un ancla que falla cualquiera de los dos no está lista.

1. **Chequeo de falsa alarma: nombra un refactor que la rompa mientras la afirmación
   sigue siendo verdadera.** ¿Cambio de nombre de archivo? El glob se autocorrige solo para `present` con un
   archivo coincidente: el glob de un tramo `absent` se renombra hasta la vacuidad y bloquea. ¿Sentencia
   reescrita en SQL equivalente? Amplía el patrón a la parte invariante
   (`[^[:space:]]*accounts` sobrevive a la calificación por esquema; un literal
   `public.accounts` no).
2. **Chequeo de falso verde: nombra una violación que lo pase.** ¿Un grant con
   `GRANT ALL`? Tu `absent` sobre `grant update` no lo detecta: agrega un tramo. ¿Un
   bypass que nunca dice la palabra protegida (un upsert en lugar de un
   update)? Mátalo con su propio tramo `absent`. ¿Un cambio de nombre de directorio? La vacuidad
   detecta el glob, pero solo si el glob es lo bastante estricto como para quedar vacío.

Si no puedes nombrar ninguno de los dos, aún no entiendes la afirmación: relee el
sitio de contrato antes de anclarla.

## No todo se ancla {#not-everything-anchors}

Una metarregla o una regla de proceso no se ancla a nada. Déjala sin anclar: es
legal y se cuenta, y el reporte nunca finge haberla verificado.
No inventes un ancla decorativa para mover un número de cobertura.
