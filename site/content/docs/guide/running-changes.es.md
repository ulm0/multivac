---
title: Ejecutar cambios
weight: 5
---

Un cambio es un archivo en el brain — `.multivac/changes/<slug>.md` — que cinco
subcomandos leen y escriben, a lo largo de días y máquinas. No está terminado
cuando se fusiona; está terminado cuando sus anclas resuelven.

```sh
mvac change new "points expire"
mvac change plan points-expire
mvac change apply points-expire
mvac change land points-expire
mvac change close points-expire
```

Toda la salida que sigue es real, capturada de un ecosistema de prueba con dos
repos (`api` existente, `web` greenfield). Rutas acortadas.

## roadmap — anótalo sin iniciarlo {#roadmap--write-it-down-without-starting-it}

No toda intención está lista para convertirse en trabajo. `roadmap add` registra
una como un cambio en el estado `planned`: mismo archivo, mismo directorio, un
estado antes.

```txt
$ mvac roadmap add tracker-projects-the-roadmap "Issues and boards from the change files"
committed: roadmap: tracker-projects-the-roadmap planned (later)
recorded .multivac/changes/tracker-projects-the-roadmap.md — planned, horizon later
  no invariant id is reserved until it starts: multivac change new tracker-projects-the-roadmap
```

`--horizon now|next|later` indica qué tan cerca está; el valor por defecto es
`later`, así que nada se vuelve urgente por omisión. Para leer la lista de vuelta:

```txt
$ mvac roadmap
roadmap: 3 planned
  now
    tracker-projects-the-roadmap — Issues and boards from the change files
  next
    agents-run-in-parallel-where-work-isolates — Urge the fan-out the tool already knows about
  later
    ci-checks-every-repo — One CI job per declared repo
in flight: 1 open change — points-expire
```

Los horizontes se imprimen del más cercano al más lejano, los slugs van en orden
alfabético dentro de cada horizonte, y un horizonte vacío se omite en lugar de
imprimirse vacío. La línea `in flight:` va aparte a propósito: un roadmap leído
sin ella invita a confundir la intención con el progreso.

Nada en el roadmap reserva un id, abre una rama ni retrasa un release, y nada te
obliga a usarlo — `change new` sobre un slug que nadie planificó se comporta
exactamente como siempre. Consulta [Planned](../../concepts/the-change/#planned--a-change-that-has-not-started)
para ver por qué cada una de esas decisiones es deliberada.

Cuando pasa a ser trabajo, `change new` **promueve** el archivo en lugar de
escribir un segundo archivo, y el id se reserva en ese momento:

```txt
$ mvac change new tracker-projects-the-roadmap
committed: change promoted: tracker-projects-the-roadmap — reserves INV-03
promoted .multivac/changes/tracker-projects-the-roadmap.md — planned since it was recorded, now open
  title ignored on promotion — the body already carries the one recorded with the intention
reserved INV-03 — proposed row in .multivac/invariants.md, declared in invariants.adds; drop it from both if this change adds no law
three edits before plan:
  1. repos: { api: { status: planned } }        # status: planned|branched|committed|mr|landed
  2. landing_order: [[api]]                     # stages; earlier stages land first
  3. claims: [INV-03]                           # the rows close verifies; each states its rule
```

Lo que hayas escrito en el cuerpo mientras la idea era joven se traslada byte
por byte. Desde aquí el flujo es el de más abajo, sin cambios.

## new — declara antes de tocar nada {#new--declare-before-you-touch-anything}

```txt
$ mvac change new "points expire"
committed: change open: points-expire — reserves INV-02
created .multivac/changes/points-expire.md — declare repos, landing_order, invariants, claims
reserved INV-02 — proposed row in .multivac/invariants.md, declared in invariants.adds; drop it from both if this change adds no law
three edits before plan:
  1. repos: { api: { status: planned } }        # status: planned|branched|committed|mr|landed
  2. landing_order: [[api]]                     # stages; earlier stages land first
  3. claims: [INV-02]                           # the rows close verifies; each states its rule
```

`new` también toma el siguiente ID de invariante libre de la tabla de la ley y
lo escribe de inmediato como una fila `proposed` que nombra este cambio. Nunca
elijas un ID a mano: dos agentes que eligen "el siguiente" eligen el mismo, y la
colisión solo aparece al fusionar. Una fila `proposed` nunca bloquea `verify`, y
`close` libera la reserva si el cambio nunca la usó — una fila cuya regla
enunciaste, o que nombra un ancla, se queda.

El andamio y la fila reservada aterrizan como **un solo commit en la rama
actual** (`change open: <slug> — reserves <ID>`): el árbol compartido se
mantiene limpio, y un `new` concurrente lee la tabla confirmada en lugar de una
edición flotante. Un árbol que ya está sucio en las rutas de contabilidad se
rechaza con el comando exacto que lo desbloquea.

El andamio:

```markdown
---
slug: points-expire
status: open
repos: {}
landing_order: []
invariants:
  touches: []
  adds:
    - INV-02
  retires: []
claims: []
---

# points expire

Declare repos, landing_order, invariants and claims in the frontmatter,
then run `multivac change plan points-expire`. For example:

    # repos: { api: { status: planned } } — planned|branched|committed|mr|landed
    # landing_order: [[api]] — stages; earlier stages land first
    # claims: [<ID>] — the rows close verifies; each row states its own rule

multivac owns the frontmatter formatting: every lifecycle step rewrites it, so
hand-tuned layout will not survive, and a key it does not know is DROPPED
rather than carried through. Declared values round-trip unchanged; the body,
below the closing ---, is yours: with an SDD declared, `change close` only
appends the line citing its directory.
```

El último párrafo es la regla: los comentarios y el formato no sobreviven a una
reescritura, y una clave que multivac no conoce se descarta con una advertencia.
Las notas van en el cuerpo.

Completa los cuatro campos declarados antes de escribir código:

1. **`repos`** — claves del registro, cada una con un `status`:
   `planned | branched | committed | mr | landed`. `apply` lo sube a
   `branched` y `land --landed` establece `landed`; nada escribe `committed` ni
   `mr`. Un repo que aún no existe es legal — apply en greenfield lo crea.
2. **`landing_order`** — etapas ordenadas, cada una una lista de claves de repo.
   Los repos de la misma etapa aterrizan en paralelo; una etapa aterriza solo
   después de todas las etapas anteriores. Lista vacía = todo en una sola etapa
   paralela. Todo repo declarado debe aparecer en una etapa — de lo contrario
   `plan` rechaza (`repo "web" missing from landing_order — add it to a stage`).
3. **`invariants`** — `touches` ("modifica INV-xx") para cada regla que el
   cambio relaja o remodela, `adds` para ley nueva (el ID que `new` reservó, o
   uno que declares — `plan` lo reserva y falla si otro cambio lo tiene),
   `retires` para dejar una lápida. Una
   invariante nunca se relaja en el código: la fila cambia primero, con fecha,
   en este cambio; el código la sigue en el mismo cambio.
4. **`claims`** — los IDs de las filas que este cambio vuelve verdaderas. Una
   afirmación (*claim*) es un ID y nada más: la fila enuncia la regla, así que
   enúnciala allí antes de cerrar. Redacta las anclas ahora, mientras sabes
   exactamente qué promete el cambio. `close` rechaza una afirmación sobre una
   fila inexistente, sobre una fila que el cambio no agrega, no modifica ni
   retira, sobre una fila retirada que no retira, o sobre una fila que todavía
   dice RESERVED, y una fila que agregas y anclas sin afirmarla.

Una declaración completa:

```yaml
repos:
  api:
    status: planned
  web:
    status: planned
landing_order:
  - [api]        # web claims the feature only after api serves it
  - [web]
invariants:
  touches: []
  adds: [INV-02]
  retires: []
claims: [INV-02]
```

Si se declara un adaptador SDD, `new` **imprime** el paso de propuesta de esa
herramienta para que lo ejecutes en tu agente, y nombra el artefacto que
demostrará que se ejecutó. El paso es tuyo; lo único que `new` ejecuta es el
`init` propio de la herramienta en el brain, donde la herramienta nunca se ha
ejecutado, y se niega a abrir el cambio si ese `init` no puede ejecutarse porque
no se encuentra el binario. Consulta [Herramientas SDD](../../reference/sdd).
`--no-sdd` omite la impresión y el `init` en esa ejecución; `plan`, `apply` y
`close` ejecutan cada uno su propia compuerta y aceptan su propio `--no-sdd`.

El SDD vive en el brain, así que sus pasos parten del checkout del brain y
escriben allí las especificaciones del cambio, sin importar qué repos nombre el
cambio; una vez que `apply` las ha llevado a la rama del cambio, el paso apply de
OpenSpec se ejecuta donde ahora están, y su línea lo dice. El porqué, el diseño
y las tareas van en esos archivos, no en el cuerpo del archivo del cambio: el
cuerpo conserva lo que tenía mientras estaba planificado, o una sola frase, y
`close` agrega la línea que apunta al directorio de la especificación.

## plan — resuelve la declaración contra la realidad {#plan--resolve-the-declaration-against-reality}

```txt
$ mvac change plan points-expire
api: ~/eco/acme-api
web: missing at ~/eco/acme-web, no url — greenfield; `change apply points-expire` creates it
landing order:
  stage 1: api
  stage 2: web
invariant INV-02: reserved — proposed row in .multivac/invariants.md; state the rule before close
claim INV-02: no anchor — add <!-- @anchor INV-02 <repo>:<glob> /<regex>/ --> before close
```

Qué repos declarados están presentes, qué implica el orden, qué falta todavía
para cerrar. Un repo declarado con `url` y sin clon local se clona aquí, y por
`apply` si aún falta — porque pediste explícitamente una operación que necesita
el repo.

## apply — un worktree por repo, o crear {#apply--a-worktree-per-repo-or-create}

```txt
$ mvac change apply points-expire
committed: change apply: points-expire — status branched
web: created ~/eco/acme-web — git init, door written, first commit
api: branched points-expire from main cba4d83 — no origin/main known locally
api: worktree ~/eco/brain/.multivac/worktrees/points-expire/api
web: branched points-expire from main a5d5c36 — no origin/main known locally
web: worktree ~/eco/brain/.multivac/worktrees/points-expire/web
work here — one checkout per repo, nobody else's tree moves:
  api: ~/eco/brain/.multivac/worktrees/points-expire/api
  web: ~/eco/brain/.multivac/worktrees/points-expire/web
then commit on branch points-expire and run `multivac change land points-expire`
```

Cada repo presente recibe su propio worktree de git para este cambio, con una
rama que lleva el nombre del slug. **Escribe la funcionalidad en las rutas
impresas**, no en el checkout compartido: otro agente puede estar ejecutando otro
cambio en el mismo repo, y un árbol de trabajo compartido que se cambia bajo sus
pies pone sus ediciones en tu rama. Un repo que no existe se crea primero:
clonado si declara una `url`, o si no `git init` y un primer commit que contiene
solo la puerta del consumidor, `AGENTS.md`. La puerta nombra dónde monta el brain
pero no lo monta: hasta que `multivac repos sync` lo haya hecho, la primera
sesión allí no puede leer la ley. Los estados pasan a `branched` en el archivo
del cambio; `close` elimina los worktrees.

Donde git no puede crear un worktree, apply crea la rama en el repo en su lugar,
como siempre lo hizo — pero rechaza si ese árbol tiene trabajo sin confirmar,
nombrando los archivos y el `git stash push` que lo libera. Nunca cambia un árbol
sucio a tu rama.

La contabilidad del cambio se confirma antes de crear cualquier rama (`committed:
change apply: <slug> — status branched`), de modo que cada checkout que apply
entrega la hereda de la base — nada viaja sin confirmar al cambiar de rama.

### Los archivos del SDD viajan a la rama {#the-sdd-files-ride-onto-the-branch}

Tu SDD escribe los artefactos de un cambio, como el `specs/<n>-<slug>/` de
spec-kit, en el checkout del brain, antes de que exista cualquier rama. Cuando el
brain también es un repo de código y el cambio lo nombra, `apply` los mueve a la
rama del cambio: los copia al worktree, los confirma allí y los elimina del
checkout. Los archivos compartidos del propio SDD que aún no están confirmados,
como un `.specify/` recién instalado, siguen el mismo camino.

```txt
brain: carried 3 speckit files onto points-expire and committed them there
```

Así el merge los aterriza, y no queda ninguna copia sin seguimiento que lo
detenga. Un archivo rastreado que modificaste en el checkout, o uno que git
ignora, no puede moverse de forma segura. `apply` lo nombra y se detiene antes de
incrementar nada:

```txt
brain: specs/004-points-expire/tasks.md is tracked and modified here — commit or stash it in ~/eco/brain, then re-run
```

Para spec-kit, el worktree también recibe su propio `.specify/feature.json`, de
modo que `/speckit.implement` ejecutado allí encuentra la funcionalidad. Para
OpenSpec, `openspec instructions apply` se ejecuta donde ahora está
`openspec/changes/<slug>/` — el worktree del cambio del brain — y el archivado se ejecuta después del merge, en
el checkout del brain, nunca en el worktree: un archivado que queda solo allí
nunca llega al brain, y `close` lo rechaza por su nombre.

Un brain sin código propio no tiene rama a la cual llevarlos: el directorio de
especificaciones se queda en el checkout del brain, y `close` lo nombra en el
commit de archivado que imprime. Los pasos siguen
ejecutándose desde allí, y el código va solo a los worktrees de los repos de
código — `plan` lo dice, indicando dónde. Con dos cambios abiertos en un mismo
brain, `plan` y `apply` también apuntan el `.specify/feature.json` de spec-kit al
directorio del cambio correcto antes de ejecutar sus pasos, y avisan cuando
nombró al otro.

## land — el orden es ley {#land--the-order-is-law}

```txt
$ mvac change land points-expire
channel: origin/main does not resolve here (no remote, or never fetched) — nothing read, so landing is unverified either way: `multivac repos sync`, then re-read
stage 1 [ready] api:branched
  api: git -C ~/eco/acme-api push -u origin points-expire
  api: open MR points-expire -> main (state the landing order in the description)
  api: once merged: multivac change land points-expire --landed api
stage 2 [blocked] web:branched
  waiting on an earlier stage — do not push yet
```

`land` informa etapa por etapa: qué está listo para push y MR ahora, qué está
bloqueado tras una etapa anterior. No confirma nada en la rama del cambio: lo que
haces push es lo que confirmaste allí. La línea `channel:` lee la ref publicada
del brain para las afirmaciones declaradas; sin remoto, como aquí, dice que no
leyó nada.

El código que haces push también se juzga. Donde un SDD gobierna el repo y
`sdd_auto` está activado, el código que no está en la rama de un cambio abierto
que declare el repo se rechaza en el commit y el merge por los hooks de git de un
brain que contiene código. El checkout propio de un repo de código lee un brain
montado que puede ir atrasado: una rama que no es un cambio abierto allí solo se
reporta en el commit y el merge (el worktree de cambio de un consumidor lee el
brain mismo y la rechaza), y el pipeline del merge request
`verify --strict --range <base>..<head> --branch <name>` la rechaza, mientras que
una rama cuyo cambio abierto no declara el repo se rechaza en cualquier
ejecución. Consulta [El código aterriza en un cambio](../../reference/commands/#code-lands-in-a-change).

Cuando un MR se fusiona, regístralo — la única forma de `land` que escribe,
confirmando en el brain el cambio de estado:

```txt
$ mvac change land points-expire --landed api
api: recorded as landed — points-expire is merged into main 8fd47c9
committed: change land: points-expire — api landed
channel: origin/main does not resolve here (no remote, or never fetched) — nothing read, so landing is unverified either way: `multivac repos sync`, then re-read
stage 1 [landed] api:landed
stage 2 [ready] web:branched
  ...
```

Cuando todas las etapas han aterrizado, la última línea del informe es:

```txt
all stages landed — run `multivac change close points-expire`
```

Si close aún rechazaría el cambio por lo que citan sus afirmaciones, el último
`land` lo dice en lugar de enviarte allá: nombra cada línea por la que close
rechaza, y termina con `all stages landed — fix the line close refuses on above, then:
multivac change close points-expire`.

```txt
  close refuses until: INV-02: its row states no rule yet — the row is the only place the rule is stated; state it in .multivac/invariants.md
```
## close — la compuerta {#close--the-gate}

`close` rechaza hasta que el trabajo esté realmente terminado. Cada repo que no ha aterrizado recibe una
línea, así que justo después de `apply` ocurre con ambos:

```txt
$ mvac change close points-expire
api: branched — land every stage first (multivac change land points-expire)
web: branched — land every stage first (multivac change land points-expire)
```

código de salida 1. Cuando todo ha aterrizado y las afirmaciones declaradas tienen sus filas y
anclas en `.multivac/invariants.md`, close vuelve a ejecutar verify **limitado a las afirmaciones
declaradas**:

```txt
$ mvac change close points-expire
INV-02: ok
archived -> .multivac/changes/archive/points-expire.md
archived — commit this: git -C ~/eco/brain add -- .multivac/changes/archive/points-expire.md .multivac/changes/points-expire.md .multivac/invariants.md && git commit -m "Archive the points-expire change" (no origin remote — the direct commit is the landing)
api: worktree removed (~/eco/brain/.multivac/worktrees/points-expire/api)
web: worktree removed (~/eco/brain/.multivac/worktrees/points-expire/web)

ritual (.multivac/ritual.md) — multivac cannot check these; walk them with the user:
  - [ ] tell support before the flag flips
  - [ ] the public site ships before the backend
```

El commit que se imprime se limita a las rutas del cambio que se cierra — nunca `add -A`,
que en un checkout compartido arrastraría archivos de otro cambio al commit de
archivo. Con un SDD declarado, esas rutas incluyen los directorios de especificación del cambio
en el brain, sin importar lo que dijeran `--no-sdd` o `sdd_auto: false`, y el
archivo de cambio archivado termina con una línea que apunta a ellos:

```txt
Specified in `specs/004-points-expire/` (speckit).
```

La redacción del commit impreso sigue el estado del brain: en una rama de trabajo el
commit aterriza mediante el MR de esa rama; en el trunk de un brain con remoto
la receta es rama + MR (`nothing lands on main directly`); solo a un brain
solitario sin origin se le dice que el commit directo ES el aterrizaje.

El archivo de cambio se archiva, nunca se borra; su `status` pasa a
`archived`. Los worktrees se van con él — uno que aún contenga trabajo sin commit
se reporta, nunca se fuerza. Si las anclas de una afirmación declarada no se sostienen, close falla: corrige el
código o corrige la declaración, con honestidad.

Close verifica cada afirmación declarada — sus anclas y su fila — y nada
más: una fila que solo enmiendas se comprueba aquí cuando el cambio la reclama, y en
cada commit mediante el hook de pre-commit. Antes de escribir nada también comprueba
lo que cita cada afirmación, y nombra cada rechazo en una sola ejecución — entre ellos una
afirmación sin fila, de una fila que este cambio ni agrega, ni toca, ni retira,
de una fila que aún no enuncia ninguna regla, o anclada solo en el archivo de cambio que archiva,
y una fila que agregaste y anclaste pero nunca reclamaste. Una fila que el canal del brain
ya enuncia y que este checkout no tiene se nombra como un pull, nunca como una segunda
enunciación.

La cola es el [ritual](../../concepts/the-change#the-ritual): la mitad de la
ceremonia de cierre que ninguna herramienta puede comprobar, escrita por el equipo en
`.multivac/ritual.md` e impresa aquí línea por línea, sin encabezados, comentarios
ni líneas en blanco — nunca verificada, nunca bloqueante. Un ritual vacío o ausente no imprime nada.

Las decisiones tomadas a mitad de un cambio se vuelven afirmaciones al cierre: propón la fila,
el humano promulga. Este es el camino orgánico de nacimiento — el principal en
régimen estable.

## Enmendar y retirar {#amending-and-retiring}

**Enmendar**: un invariante nunca se relaja en el código. Abre un cambio que lo declare
en `invariants.touches`, actualiza la fila (con fecha) en el mismo cambio y
cambia el código en el mismo cambio. Reclama la fila y close verifica sus
tramos enmendados; reclamada o no, `verify` los reporta en cada commit donde los
hooks están armados, y rechaza uno solo en un modo bloqueante o con `--strict`.

**Retirar**: un cambio como cualquier otro, y la lápida se escribe a mano, nunca se
deriva:

1. Declara la retirada en `invariants.retires`.
2. Cambia el estado de la fila a `retired`. Conserva el ID y la fila — los IDs
   nunca se renumeran, nunca se reutilizan; la historia queda en git.
3. Sus tramos distintos de `absent` dejan de evaluarse. No los inviertas —
   invertir un tramo de promulgación exigiría que desapareciera la promulgación misma.
4. Escribe tramos `absent` NUEVOS en esa fila para los identificadores del
   mecanismo muerto — los nombres que alguien buscaría con grep, en cada superficie donde
   podrían reaparecer:

   ```markdown
   | INV-19 | RETIRED — cart reservation holds stock. | specified | retired | 2026-08-13 | map |
   <!-- @anchor INV-19 api:src/**/*.ts /reserveStock/ absent -->
   <!-- @anchor INV-19 *:AGENTS.md /(^|[^[:alnum:]_])stock[[:space:]]+reservation([^[:alnum:]_]|$)/i absent -->
   ```

5. En el mismo cambio, elimina los restos del mecanismo muerto del código
   y de las puertas. Desde ese momento los nuevos tramos `absent` bloquean cada ejecución: la
   lápida de una fila retirada es bloqueante por defecto.
