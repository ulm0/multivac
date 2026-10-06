---
title: Afirmaciones y anclas
weight: 3
---

La unidad no es el documento. Es la afirmación (*claim*):

    statement + authority + anchor + state + date

El hogar serializado es la tabla de la ley en `.multivac/invariants.md`, una fila por afirmación —
`| ID | statement | authority | state | date | source |` — el formato exacto
que `init` escribe con cero filas. `state` vive en la fila porque `verify` lo
lee: los tramos de las filas `proposed` y de las filas `drift` (un hallazgo
registrado que aún no se puede corregir) nunca bloquean; las filas `retired` evalúan solo
sus tramos de lápida redactados. Las anclas no son columnas: son líneas de comentario bajo la fila.

Los niveles de autoridad son configurables por proyecto (`authorities:` en
`.multivac/config.yml`). Para la herramienta, una autoridad es una etiqueta y nada
más: ningún comando la imprime, la contrasta con esa lista ni bloquea según ella.
Sopesarla es trabajo de la revisión, nunca de `verify`.

Sin base de datos, sin formato propietario. Si la herramienta desaparece, el brain
sigue funcionando.

## El ancla {#the-anchor}

**Basada en contenido, no en líneas.** Las líneas se mueven desde el primer commit. Un ancla
dice: "en ese repo, en esos archivos, algo coincide con esto". Verificar es
preguntar si el patrón todavía acierta. Si el archivo se movió, se vuelve a ubicar;
si desapareció, la afirmación pasa a ser sospechosa, no falsa en silencio.

Las anclas viven en línea en el markdown del brain como comentarios HTML — cualquier
`*.md` de la raíz, `.multivac/*.md` o `.multivac/changes/*.md` — invisibles al
renderizar, fáciles de buscar con grep, sin un archivo paralelo que derive. Una línea dentro de un bloque de código, con
sangría de cuatro espacios o en cualquier otro directorio se omite sin avisar: la
afirmación simplemente figura como sin anclar. Un tramo por línea:

```
<!-- @anchor <CLAIM-ID> <repo>:<glob> [![<repo>:]<glob> …] /<regex>/[flags] [mode] -->
```

- **El ID de la afirmación es explícito, nunca se infiere** por cercanía. Es la
  clave de unión para el reporte y para `change close`.
- **`repo` es la clave del registro** de `.multivac/config.yml` (`backend`),
  nunca el nombre del directorio (`acme-backend`). `*` cubre todos los repos
  declarados en disco más el propio brain. *Qué* lee un tramo depende de quién pregunta:
  desde el brain, cada repo hermano en su ref de canal — el ecosistema tal como está
  publicado — y desde un repo consumidor, solo su propio árbol de trabajo,
  así que allí `*` alcanza únicamente ese repo. Consulta
  [verify](../../reference/commands/#what-each-run-reads).
- **El dialecto de glob es picomatch** sobre rutas relativas al repo y separadas por `/`
  (salida de `git ls-files`): `**` cruza directorios, `{a,b}` alterna,
  los archivos ocultos coinciden. No es glob de shell, no es una regex.
- **`!<glob>` excluye**, y se aplica después de la inclusión. El conjunto de archivos
  que sobrevive es el que se evalúa, y el que cuenta para la vacuidad.
- **`!<repo>:<glob>` excluye solo en ese repo.** Una exclusión sin calificar es
  relativa al repo y actúa en cada repo que el tramo evalúa; bajo `*` eso
  exime en todas partes a los homónimos de la ruta, lo cual rara vez es lo que quiere una
  lápida. `*:**.md !brain:07-rules.md /PIN/ absent` dice "en ninguna parte, salvo
  la página del brain que lleva la lápida"; el mismo nombre de archivo en otro
  repo sigue verificándose. Una exclusión que nombra un repo no declarado es un error
  de análisis que nombra la clave; calificar una en un tramo de un solo repo es legal y
  redundante.
- **Flags**: solo `i`.
- **Un único dialecto de regex canónico: POSIX ERE**, el motor común más básico —
  lo que `git grep` en macOS ejecuta realmente. `\s`, `\b`, `\d`, `\w` se
  rechazan al analizar el ancla, con una sugerencia de traducción
  (`\s` → `[[:space:]]`, `\w` → `[[:alnum:]_]`), nunca se aceptan en silencio:
  git grep en macOS los descarta sin avisar, lo que convierte una lápida en un
  pase vacuo. El dialecto queda fijado en ese mínimo común denominador aunque
  multivac ejecuta un motor propio — una `RegExp` compilada desde la ERE, en
  proceso — para que un ancla siga siendo legible por `git grep` y por la próxima persona,
  y pase igual en todas las máquinas.

## Cinco modos, un mecanismo {#five-modes-one-mechanism}

| modo | exige | para qué sirve |
| --- | --- | --- |
| `present` (por defecto) | al menos una coincidencia | la regla está implementada |
| `absent` | ninguna coincidencia | **la lápida** |
| `unique` | exactamente una | fuente única de un valor |
| `count=N` | exactamente N | **el trinquete** |
| `each` / `each!` | cada archivo encontrado contiene una coincidencia / ninguna | **el universal** |

Los tramos `count=N` también son **números derivados**: un número que el brain declara y
que el código debe seguir produciendo. Sobre un historial de solo anexado, `count=N` es el
modismo documentado para las afirmaciones de "nunca más": el conteo fija el total de hoy y
cualquier ocurrencia nueva lo rompe.

`count=N` es un **trinquete de eliminación, nunca un universal**: cuenta sobre todos los
archivos juntos, así que detecta la eliminación, no un archivo nuevo que omite el
patrón — la medición 2 demostró que un contenedor privilegiado rebelde era invisible para
quince anclas count/absent en verde. "Para cada Deployment / contenedor /
paquete publicado, P" es `each`: cada archivo que el glob encuentra debe contener una
coincidencia (`each!`: no debe contener ninguna), un glob que no encuentra archivos falla, y
los archivos que fallan se nombran en el reporte. Lo que ningún modo dice — a propósito —
es una **relación** entre archivos (copia vendorizada == copia raíz, variable de entorno ==
containerPort): esa es otra primitiva, y esas afirmaciones se quedan
honestamente sin anclar.

El diccionario de términos muertos no es una función aparte: un término muerto es un
ancla `absent` en la fila de la afirmación retirada, y puede cruzar repos:

```markdown
<!-- @anchor INV-83 *:AGENTS.md /(^|[^[:alnum:]_])VOUCHER([^[:alnum:]_]|$)/ absent -->
```

La guarda de términos muertos, el trinquete de conteo y el ancla de invariante son la
misma primitiva en distintos modos.

## Tramos {#legs}

Una afirmación puede llevar varias líneas de ancla: tramos. **Los tramos se combinan con AND**: la
afirmación se sostiene solo cuando se sostiene cada tramo. Ante una falla, la afirmación hereda la
severidad del peor tramo que falla, y `verify` reporta por tramo, nunca solo por
afirmación.

La forma canónica — promulgación, lápida, trinquete, mata-bypass:

```markdown
| INV-01 | Nobody has UPDATE on `balances`, not even the service role. | published | active | 2026-08-02 | [03](03-backend.md) |
<!-- @anchor INV-01 backend:db/migrations/*.sql /revoke[[:space:]]+update[[:space:]]+on[[:space:]]+[^[:space:]]*balances/i -->
<!-- @anchor INV-01 backend:db/migrations/*.sql /grant[[:space:]]+update[[:space:]]+on[[:space:]]+[^[:space:]]*balances/i absent -->
<!-- @anchor INV-01 backend:db/migrations/*.sql /update[[:space:]]+balances/i count=1 -->
<!-- @anchor INV-01 backend:db/migrations/*.sql /on[[:space:]]+conflict[^;]*balance/i absent -->
```

El `revoke` prueba que la regla se promulgó; el grant `absent` es la
lápida; el trinquete `count=1` fija el único `update balances` sancionado
en el historial de solo anexado; el último tramo mata el bypass del upsert.

## Reglas de coincidencia {#matching-rules}

Dos reglas son normativas, medidas contra repos reales, no teorizadas:

- **Coincidencia normalizada por sentencia para SQL.** El DDL real reparte un grant en
  varias líneas; una lápida por línea sobre DDL tiene una vía de escape por construcción. En los archivos `.sql`
  el evaluador normaliza por sentencia — las secuencias de espacios en blanco, saltos de línea
  incluidos, se colapsan en un solo espacio — antes de ejecutar la regex. `absent` basado en líneas
  sobre DDL no es sólido y multivac no lo ofrece. **Solo `.sql`**: todos los
  demás archivos, configuración incluida, se evalúan línea por línea, así que un valor repartido en
  varias líneas en YAML o TOML todavía escapa a una lápida basada en líneas. Escribe el tramo
  contra una forma que sobreviva en una línea, o ancla el SQL en su lugar.
- **El historial de solo anexado toma la última definición o el trinquete.**
  `present` sobre `migrations/*.sql` prueba "se construyó así", nunca
  "sigue siéndolo"; `unique` y `count` confunden el historial con HEAD. Sobre una
  superficie de solo anexado, un tramo apunta a la última definición del
  objeto que nombra, o usa `count=N` como trinquete.

## Severidad asimétrica {#asymmetric-severity}

Los modos no difieren solo en cómo coinciden, sino en lo que significa su falla:

| modo | falso positivo | ante una falla |
| --- | --- | --- |
| `absent` | casi imposible | **bloquea** |
| `count` | bajo | **bloquea** |
| `each` / `each!` | bajo — un archivo nombrado cumple el predicado o no | **bloquea** |
| `present` | alto — la regla es cierta, el código se movió | reporta y se autocorrige |
| `unique` | medio | reporta |

**La lápida bloquea; la verificación de presencia informa.** Sin esto, cada
refactor pone el chequeo en rojo y alguien desactiva la herramienta en la tercera semana.
Las herramientas de la familia lint mueren de ruido, no de bugs.

Esta tabla es el valor por defecto de la clave `blocking:`. La configuración puede ampliarla;
aflojarla por debajo de `[absent]` — desbloquear la lápida — se rechaza.

## Autocorrección, estados, códigos de salida {#self-healing-states-exit-codes}

Cuando un tramo `present` falla en su glob declarado, se busca en todo el repo
antes de reportar. Seis estados, no dos:

- **ok** — cada tramo se sostiene.
- **moved** — un tramo `present` cuya coincidencia aparece en exactamente un archivo fuera
  de su glob, del mismo tipo que la inclusión — la misma extensión final, nunca
  dentro de `.multivac/`: el glob se reescribe en su lugar, en un checkout del brain y
  sin `--check`; cualquier otra ejecución solo reporta el movimiento. Ningún archivo así no es un
  movimiento: el tramo es `broken`, o `vacuous` si su glob no encontró ningún archivo rastreado.
  Varios archivos tampoco es un movimiento: el tramo es `broken` y nombra los primeros
  tres.
- **broken** — el requisito del tramo falla en su lugar.
- **vacuous** — el glob, tras las exclusiones `!`, no encuentra ningún archivo rastreado.
  Para `absent`/`count`/`each` es una falla bloqueante: de otro modo, el renombre de un directorio
  pondría en verde en silencio todas las lápidas, y un universal cuantificado
  sobre la nada no prueba nada. Para `present`/`unique` se reporta como
  `vacuous` y bloquea solo con `--strict`.
- **pending** — una afirmación que un cambio abierto declaró antes de que exista su código.
  Informativo, nunca bloqueante, nunca autocorregido.
- **unevaluated** — el único repo que nombra un tramo no está en disco, así que el tramo
  no se leyó en absoluto. No es un pase: `multivac repos sync`, y luego vuelve a leer. Un tramo `*`
  nunca queda sin evaluar; lee los repos presentes, y uno ausente
  solo aparece en su línea `read`.

El modo de ancla que falló decide si un tramo bloquea:

| resultado | por defecto | `--strict` |
| --- | --- | --- |
| tramo broken o vacuous en un modo bloqueante (`absent`, `count`, `each`) | **exit 1** | exit 1 |
| `present` / `unique` broken o vacuous | reportado, exit 0 | exit 1 |
| moved | exit 0 | exit 0 |
| unevaluated (repo no está en disco) | exit 0 | exit 0 |

Un tramo de una fila `proposed` o `drift` nunca bloquea, en ninguna de las dos ejecuciones. En una
ejecución por defecto — la que corren los hooks de git y los hooks del harness — solo los
modos bloqueantes bloquean entre los tramos, así que un commit a mitad de un refactor nunca muere por una verificación de presencia movida. Otras
líneas bloquean sea cual sea el modo: un ancla que no se analiza y, en un
checkout del brain (la ejecución acotada de un repo consumidor no calcula ninguna de estas), un rechazo de `enact` o
de `law`, un `.multivac/config.yml` modificado sin cambio abierto y un
pin desactualizado bajo `staleness: block`. También la línea de código,
cuando `sdd_auto` está activo y un SDD gobierna el repo: código fuera de la rama de un cambio abierto que declara
ese repo. Un repo consumidor lee un brain montado, que puede quedar rezagado, así que allí una
rama que no es un cambio abierto bloquea solo con `--strict`; el worktree de cambio de un consumidor lee el brain mismo
y lo bloquea en una ejecución por defecto, igual que un checkout del brain. Una rama cuyo cambio abierto no declara el repo
bloquea en una ejecución por defecto en todas partes. La referencia
tabula los tramos en [la matriz de salida](../../reference/commands/#the-exit-matrix) y trata
[la línea de código](../../reference/commands/#code-lands-in-a-change) por separado.
`--strict` amplía el conjunto, empezando por los tramos de presencia y unicidad; `strict_pre_push: true` lo arma en el shim de pre-push, para un
equipo que quiere que el último salto fuera de la máquina cumpla un estándar más exigente que
un commit que cualquiera aún puede enmendar.

```txt
$ mvac verify
15 claims · 12 anchored (80%)
  unanchored: INV-03, INV-08, INV-11
  read      backend: origin/main @ abc1234 — the channel, as published (last fetch 2h ago)
  read      brain: working tree on main @ def5678 — the brain's own repo, the commit this run gates

  ok         10
  moved       1
  broken      1
  moved     INV-07 [present] .multivac/invariants.md:31 · glob rewritten to sql/002_roles.sql — review the diff
  broken    INV-15 [present] .multivac/invariants.md:52 · no match in backend — restore the code or retire the claim · reported only — "present" is not in blocking: and this run is not --strict
  enact     no row enacted in this commit — 2 staged paths, no row reached active

0 blocking broken · exit 0
```

El `present` roto se reporta, no bloquea; `--strict` lo convierte en
exit 1.

`moved` sale con 0, y en un checkout del brain reescribe el ancla; el diff aterriza
en el mismo PR que el refactor. Una herramienta que arregla en vez de acusar es lo que
logra la adopción. La escritura sigue el patrón de `prettier`: la reescritura aterriza en el
árbol de trabajo, donde una persona lee el diff, y `--check` reporta el tramo
`moved` en su lugar. Lo mismo ocurre con una ejecución desde un repo consumidor: su montaje suele ser
un submódulo fijado, así que la corrección corresponde al checkout del brain.

## Cobertura, no completitud {#coverage-not-completeness}

No toda afirmación se puede anclar. Una fórmula se ancla al cuerpo de una función; una
metarregla no se ancla a nada. **Una afirmación sin ancla es legal, y se
cuenta.** Empiezas en 0% y la herramienta ya es útil. La cobertura sube
cuando al equipo le importa, y el reporte nunca finge haber verificado lo que
nadie ancló.

## Ancla a contratos, no a implementaciones {#anchor-to-contracts-not-implementations}

> Las fronteras de un ecosistema son a la vez lo más barato de leer
> y lo más estable a lo que anclarse.

Migraciones, esquemas de API, nombres de eventos, claves de configuración, tablas de rutas, GRANTs.
Eso es lo que el sembrador lee para dibujar el mapa **y** lo que menos se mueve bajo
un ancla: una decisión de diseño, no dos. Un ancla al nombre de un archivo de migración
es prácticamente inmortal; un ancla al cuerpo de un widget se rompe el martes. Si
te encuentras anclando una implementación, primero pregúntate si existe un sitio de
contrato para la afirmación; ancla la implementación solo cuando no hay
ninguno, y espera rotación.
