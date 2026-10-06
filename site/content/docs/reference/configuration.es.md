---
title: Configuración
weight: 2
---

Un solo archivo: `.multivac/config.yml`, en el brain. Es un **registro, no un
sistema de plugins**: selecciona por nombre entradas que la herramienta ya
incluye, y declara dónde están los repos. Nunca define comportamiento.

`init` lo escribe. Todas las claves de abajo son opcionales; un archivo que
contenga solo `{}` se carga con todos los valores por defecto aplicados. Todo
error de validación nombra la clave y la solución, y una clave que multivac no
conoce —en el nivel superior o en la entrada de un repo— es uno de ellos:
`strict_prepush` se rechaza como `.multivac/config.yml: unknown
key "strict_prepush" — did you mean "strict_pre_push"?`, nunca se carga ni se
ignora.

Una configuración que escribió un release anterior puede seguir declarando un
grafo de código, en la raíz o en un repo. Esas claves se cargan y se ignoran
—multivac no mantiene ningún grafo de código— y `doctor` las nombra en una
línea, igual que `verify` en el checkout del brain, con la forma de eliminarlas.

Lo que `init` escribe sin flags, en un directorio vacío y sin remoto de git:

```yaml
# multivac configuration — seeded by `multivac init`.
# Edit directly; adopting a new agent later is one line here + `multivac doors`.
doors: [agents]
# brain_url:   # no git remote detected — the URL others clone the brain from, for `repos sync` to mount
# repos:
#   backend: ../backend   # bare string = { path }
```

Uno ya completado:

```yaml
doors:   [agents, claude, cursor]
sdd:     opsx
authorities: [published, specified, open]
blocking: [absent, count, each]
staleness: block
strict_pre_push: true
channel: origin/main
mount: .brain
repos:
  api: ../acme-api
  payments:
    url: git@example.com:acme/payments.git
    path: ../payments
    channel: origin/release
```

## Cambiarlo exige un cambio abierto {#changing-it-needs-an-open-change}

Este archivo decide qué repos existen, qué adaptadores se enlazan y qué
compuertas se ejecutan. Cada una de esas cosas es tan determinante como una
fila de la ley, así que una modificación en el stage se rechaza mientras no haya
ningún cambio abierto:

```txt
config    .multivac/config.yml is modified and no change is open — it decides which repos are verified and which gates run
          open one first (`multivac change new "<title>"`), or drop the edit
```

**Crearlo es gratis**: un brain tiene que empezar en alguna parte, e `init` es
lo único que escribe este archivo, y solo cuando no existe. Por eso la regla lee
lo que hace el commit y no quién dice haberlo hecho.

**Cualquier cambio abierto la satisface**, incluido uno abierto para esta misma
edición. La lectura más estricta —un cambio que *nombre* este archivo—
requeriría un campo que el archivo del cambio no tiene. Lo que se gana es que la
edición aterriza en una rama con un merge request que la describe.

Lee el índice, no el árbol de trabajo: el índice es lo que está a punto de
confirmarse.

## Claves de nivel superior {#top-level-keys}

### `doors` {#doors}

| | |
| --- | --- |
| tipo | lista de strings — nombres de destinos del registro |
| por defecto | `[]` |
| ejemplo | `doors: [agents, claude, cursor]` |

Qué destinos de puerta del harness proyecta `doors`, y sobre cuáles informa
`doctor`. Los nombres deben existir en el registro incluido; consulta
[Integraciones de agentes](../integrations) para ver las ocho entradas.

**`doors` y `--provider` no son la misma lista**, y por eso el flag suma a esta
clave en lugar de ser ella. `--provider` responde *qué agentes de programación
usas*: `claude`, `cursor`, `copilot`. `doors` registra *qué puertas se
proyectan*, y la lista que escribe `init` empieza con `agents`: el `AGENTS.md`
canónico, que no es un agente que nadie instale sino el formato desde el cual se
proyectan los demás. Llamar a esta clave `providers` pondría a algo que no es un
proveedor a la cabeza de esa lista.

**Sin ella:** `doors` igualmente escribe el `AGENTS.md` canónico y los shims de
hooks de git en el brain y en todo repo en disco que no sea de solo lectura,
porque esa escritura es incondicional, pero no se instala ningún symlink, stub,
skill ni hook del harness para ningún proveedor. `doctor` lo dice:

```txt
doors      none declared — add doors: [agents] to .multivac/config.yml
```

Un nombre desconocido es un aviso de `doors` y una línea de `doctor`, nunca un
fallo:

```txt
doors      nope: unknown target — known: agents, claude, cursor, opencode, codex, windsurf, gemini, copilot; fix doors: in .multivac/config.yml
```

### `sdd` {#sdd}

| | |
| --- | --- |
| tipo | string — uno de `opsx`, `speckit` o `none` |
| por defecto | sin definir |
| ejemplo | `sdd: opsx` |

Selecciona el adaptador de desarrollo guiado por especificaciones cuyos propios
pasos se ejecutan dentro del ciclo de vida del cambio; para OpenSpec,
`openspec new change`, el bucle de `status` e `instructions`, `instructions apply` y
`archive`. Consulta [Herramientas SDD](../sdd). Se ejecuta solo en el brain
—se instala allí y sus pasos se imprimen allí— y gobierna el código de todo repo
declarado que no diga `sdd: none` (consulta
[`sdd:` por repo](#repos)). En un brain que es su propio repo de código, la
entrada del propio brain puede declararlo en su lugar. `none` no declara ningún
SDD.

Una declaración que no se resolvería en ninguna raíz se rechaza al cargar la
configuración, nombrando la clave y la solución: una herramienta en el `sdd:`
propio de un repo, una herramienta de nivel superior que la entrada del propio
brain contradice con otra herramienta o con `none`, o un nombre que multivac no
conoce. Los comandos que cargan la configuración salen con 2 ante ella; las
excepciones están en [Los errores son código de salida 2](#errors-are-exit-2).
`doctor` la informa en su línea `config invalid`:

```txt
repos.landing.sdd: opsx — REFUSED: the SDD lives in the brain alone, so a code repo's sdd: takes only none, which exempts its code from the change gate. Fix: remove repos.landing.sdd or set it to none in .multivac/config.yml, then open a change for the config edit: `multivac change new <slug>`
```

Un repo que monta el brain no es rechazado por la configuración de su brain:
`verify` allí imprime el mismo texto como una línea `sdd` que termina en *in the
mounted brain's config; its owner fixes it*, que bloquea solo con `--strict`, y
`count` la imprime y la cuenta.

**Sin ella, y con la entrada del propio brain sin declarar ninguno:** silencio.
No se ejecuta ningún paso de SDD y `doctor` no imprime ninguna línea `sdd`. No
declarar es distinto de declarar algo ausente: lo primero es «no usamos uno», lo
segundo es «usamos uno, no está en esta máquina».

### `sdd_auto` {#sdd_auto}

| | |
| --- | --- |
| tipo | booleano |
| por defecto | `true` |
| ejemplo | `sdd_auto: false` |

Si el adaptador `sdd` declarado imprime sus pasos en `change new`,
`change plan`, `change apply`, `change land` y `change close`, y bloquea según
sus artefactos en `change plan` y `change apply`, y en `change close` según el
archivo de la herramienta, donde lo tenga, y su registro de tareas. `false`
también elimina la comprobación de que el código aterriza solo en la rama de un
cambio abierto.

**Sin ella:** cada punto del ciclo de vida imprime sus pasos y el siguiente
comando rechaza continuar sin sus artefactos. Ponla en `false` para mantener el
adaptador declarado —`doctor` lo sigue informando— mientras ejecutas sus pasos a
mano:

```txt
sdd        opsx @ brain: installed · binary ok · sdd_auto: false — the lifecycle prints nothing and gates nothing; run the steps yourself
```

`--no-sdd` en una sola invocación de `change` omite los pasos y sus compuertas
una vez, sin editar la configuración; en `change plan`, `change apply` y
`change close` además registra la omisión en el archivo del cambio. Ninguno de
los dos impide que `change close` nombre los directorios de especificaciones del
brain para el cambio en el commit de archivo que imprime y los cite en su
cuerpo: el interruptor omite los pasos y sus compuertas, nunca lo que ya estaba
escrito.

### `tracker` {#tracker}

A qué gestor de incidencias se proyecta el roadmap: `gitlab`, `github` o ausente
(`none` se lee como ausente). Cualquier otro nombre se carga, y solo
`roadmap sync` lo rechaza.

```yaml
tracker: gitlab
```

Solo en el nivel raíz. A diferencia de `channel`, que un repo puede sobrescribir,
el tracker proyecta el **cambio**, y los cambios viven solo en el brain, así que
una sobrescritura por repo respondería una pregunta que nadie puede hacer.

La proyección es unidireccional y se ejecuta solo desde `multivac roadmap sync`.
Llega a la red, así que nunca se ejecuta desde `verify`, `doctor` ni `doors`.
Cada incidencia lleva una etiqueta `multivac::planned` o `multivac::open`,
agregada y nunca eliminada, de modo que una incidencia que fue ambas lleva ambas.

### `repos.<key>.role` {#reposkeyrole}

Opcional. Una línea que dice para qué **sirve** un repo, mostrada en la lista del
ecosistema que lleva la puerta de un repo una vez que hay dos repos declarados.

```yaml
repos:
  api:
    path: ../acme-api
    role: the contract every surface consumes
  web: ../acme-web
```

Declarado u omitido, nunca derivado: para qué sirve un repo no está en su ruta,
y `api — api` es peor que el silencio. Un repo sin `role` tiene su entrada
detenida en la ruta.

Un rol escrito en varias líneas se reduce a una, porque la lista es una lista.

### `repos.<key>.managed` {#reposkeymanaged}

| | |
| --- | --- |
| tipo | booleano |
| por defecto | `true` |
| ejemplo | `managed: false` |

Si multivac puede escribir en este repo. Declara un repo que pertenece a otro
equipo, con ramas protegidas, para que las anclas puedan leerlo, y di que no es
tuyo:

```yaml
repos:
  payments:
    path: ../payments
    managed: false
```

Un repo de solo lectura se lee, se verifica, se clona y se hace fetch, y nunca
se escribe: ni init de SDD, y `doors` no proyecta allí ninguna puerta, skill,
configuración de hook del harness, shim de hook de git ni `core.hooksPath`.
Ninguna compuerta exige un archivo allí: el SDD se ejecuta solo en el brain.
`doctor` y `repos` lo informan, la línea de pins de `doctor` no espera ningún
montaje allí, no nombra nada que un release anterior haya dejado allí, y el
código de salida de `doctor` no cambia:

```txt
pins       payments: not managed, read-only — no mount expected
```

Un cambio que lo nombra es rechazado por `change plan` y `change apply` antes de
clonar, ramificar o subir de versión cualquier cosa:

```txt
payments: not managed, read-only — drop it from .multivac/changes/points-expire.md, or remove `managed: false` through a change …
```

**El gemelo superficial.** Un clon que git informa como superficial (shallow)
—`repos sync --shallow` crea uno— es de solo lectura de la misma manera, sin
ninguna clave que escribir. Al clon mismo se le consulta
(`git rev-parse --is-shallow-repository`, sin conexión) en cada ejecución, así
que `git -C ../payments fetch --unshallow` lo devuelve al alcance sin editar
nada, y `doctor` dice `shallow, read-only`. Un clon completo del repo de otra
persona no se distingue de uno tuyo: para eso existe la clave.

**El brain siempre es gestionado**, superficial o no, y su entrada no puede
decir lo contrario bajo ninguna clave:

```txt
.multivac/config.yml: repos.brain.managed: false — brain is the brain, and the brain is always managed; remove the key
```

Cualquier valor distinto de `true` o `false` se rechaza por nombre. Una puerta o
unos hooks proyectados antes de que un repo pasara a ser de solo lectura se
dejan en su lugar: quitarlos también es una escritura.

### `authorities` {#authorities}

| | |
| --- | --- |
| tipo | lista de strings |
| por defecto | `[]` |
| ejemplo | `authorities: [published, specified, open]` |

El vocabulario del que se nutre la columna `authority` de tu tabla de la ley:
qué tan fuerte obliga una afirmación (*claim*), desde «publicada a los clientes»
hasta «todavía una pregunta abierta».

{{< callout type="warning" >}}
**Se lee, pero aún no se aplica.** El cargador interpreta y valida esta clave, y
nada en el build actual la consume: ningún comando rechaza una fila cuya
autoridad esté fuera de la lista. Declárala como documentación para tu equipo y
tu agente; no esperes que bloquee nada hoy.
{{< /callout >}}

### `blocking` {#blocking}

| | |
| --- | --- |
| tipo | lista de modos de ancla — de `present`, `absent`, `unique`, `count`, `each` |
| por defecto | `[absent, count, each]` |
| ejemplo | `blocking: [absent, count, each, unique]` |

Qué modos de ancla hacen que un tramo roto salga con 1 bajo la política **por
defecto**. Un tramo roto en cualquier otro modo se informa y sale con 0, salvo
que pases `--strict`. Decide solo sobre los tramos: las líneas sobre el commit
mismo (promulgación, eliminación de la ley, una edición de la configuración,
código fuera de un cambio) y un pin desactualizado bajo `staleness: block`
bloquean según sus propios términos.

**Sin ella:** las lápidas (`absent`), las afirmaciones contadas (`count`) y los
universales (`each`/`each!`) bloquean; la presencia y la unicidad informan. Esa
asimetría es la clave: un renombrado no debería matar tu commit, pero llamar a
un endpoint muerto sí.

Puedes ampliar el conjunto. No puedes reducirlo por debajo de la lápida:

```txt
$ mvac verify
.multivac/config.yml: "blocking" must include "absent" — the tombstone always blocks; add it back
```

Un modo desconocido se rechaza con la lista de los permitidos:

```txt
.multivac/config.yml: "blocking" has unknown mode "sometimes" — allowed: present, absent, unique, count, each
```
### `staleness` {#staleness}

| | |
| --- | --- |
| tipo | `report` o `block` |
| por defecto | `report` |
| ejemplo | `staleness: block` |

Qué ocurre cuando el pin del montaje del brain de un repo consumidor está
detrás del `channel` declarado. `report` imprime la línea y sale con 0; `block`
lo convierte en un fallo de verify.

**Sin ella:** los pins desactualizados se reportan, nunca bloquean. Con `block`,
un pin desactualizado sale con 1, y su línea trae el `git submodule update --remote`
que mueve el pin — pero un ref de canal que no se resuelve localmente, o un pin
cuyo commit el checkout del brain no tiene (la línea dice `pin ? behind`), solo
reporta de todos modos, porque sin conexión nunca se adivina y nunca se bloquea:

```txt
  stale?    api: channel origin/main unknown locally — reported only, cannot gate offline; `multivac repos sync` fetches it
```

Un pin **adelantado** respecto del canal no está desactualizado y nunca bloquea.
Cualquier otro valor de la clave se rechaza:

```txt
.multivac/config.yml: "staleness" must be "report" or "block" — block makes a stale pin exit 1
```

### `strict_pre_push` {#strict_pre_push}

| | |
| --- | --- |
| tipo | booleano |
| por defecto | `false` |
| ejemplo | `strict_pre_push: true` |

Si `doors` escribe el shim de pre-push como `mvac verify --strict` en lugar de
`mvac verify`.

**Sin ella:** cada shim de hook ejecuta `mvac verify`. Activarla deja los
commits y los merges con ese comportamiento y hace que un push también bloquee
ante un tramo roto en cualquier modo, presencia y unicidad incluidas, y ante un
cambio terminado que nadie ha cerrado — el último salto fuera de la máquina
sujeto a una vara más exigente que un commit que cualquiera aún puede enmendar.
Solo surte efecto la próxima vez que `doors` (o `init`) reescribe los shims.
Consulta [Hooks](../hooks).

### `channel` {#channel}

| | |
| --- | --- |
| tipo | string — un ref de git |
| por defecto | sin definir para la desactualización de pins; **`origin/main`** para lo que lee un `verify` con alcance de brain |
| ejemplo | `channel: origin/main` |

**El ecosistema tal como está publicado.** El `repos.<key>.channel` de cada repo
lo sobrescribe. La clave responde dos preguntas:

1. **Qué bytes juzga un `verify` con alcance de brain**. Cada repo declarado se
   lee en su ref de canal — resuelto *en ese repo* — y no en su working tree, de
   modo que un repo hermano estacionado en una rama WIP nunca enrojece la ley
   del brain. El repo del propio brain es la excepción: siempre su working tree,
   porque ese es el commit que la ejecución bloquea. Si no se declara, el valor
   por defecto es `origin/main`; un ref que no se resuelve ahí vuelve al working
   tree y lo dice en la línea `read` de ese repo. `--worktree` fuerza la lectura
   del working tree en todo el ecosistema. El ref es una instantánea
   **local** de rama de seguimiento remoto — `verify` nunca hace fetch — así que
   la línea `read` también indica qué antigüedad tiene; `mvac repos sync` es lo
   que la refresca.
2. **Contra qué se compara el pin del montaje del brain de cada consumidor**,
   resuelto **en el checkout del brain**. Esta no tiene valor por defecto: si no
   se declara, `verify` omite por completo la comprobación de desactualización
   para ese repo — no hay con qué comparar. `doctor` recurre a la rama de
   seguimiento remoto del brain si existe, y si no, dice qué agregar:

```txt
pins       api: pin 8f2a1cc — no channel ref to compare; set channel: in .multivac/config.yml
```

`doctor` también nombra la rama en que está estacionado cada repo y si es el
canal de ese repo — la línea que explica de un vistazo un resultado de `verify`:

```txt
branches   api: on wip/refactor @ 4d5e6f7 — OFF channel origin/main @ 1a2b3c4; verify reads the channel, not this tree
```

### `mount` {#mount}

| | |
| --- | --- |
| tipo | string — un directorio relativo al repo |
| por defecto | `.brain` |
| ejemplo | `mount: docs/brain` |

Dónde monta cada repo consumidor el brain, como submódulo de git. Tanto la
comprobación de desactualización como la línea `pins` de `doctor` leen el
gitlink en esta ruta. `multivac repos sync` lo crea, a partir de
[`brain_url`](#brain_url).

**Sin ella:** `.brain`, que también es el nombre que `verify` prefiere cuando se
ejecuta desde un repo consumidor y tiene que encontrar el brain. Si un repo no
tiene un gitlink ahí:

```txt
pins       api: no brain mount at .brain — run `multivac repos sync` to add it
```

### `brain_url` {#brain_url}

| | |
| --- | --- |
| tipo | string — una url de git |
| por defecto | ninguno |
| ejemplo | `brain_url: git@github.com:acme/brain.git` |

La dirección desde la que otras personas clonan el brain. `multivac repos sync`
la escribe en el `.gitmodules` de cada consumidor cuando monta el brain ahí, así
que tiene que ser la url a la que **todos** puedan llegar, no la de tu máquina.

**Escrita a mano — la herramienta nunca escribe este campo**, y nunca la deduce
de `git remote get-url origin`. El origin de un brain suele ser un alias ssh
local (`git@work-github:acme/brain.git`), y una suposición terminaría en el
`.gitmodules` de cada consumidor, rota para todos los demás. `multivac init`
escribe la clave comentada, con el origin que encontró como sugerencia:

```yaml
# brain_url: git@work-github:acme/brain.git   # the URL others clone the brain from — uncomment to let `repos sync` mount it
```

Léela, corrígela si es un alias y descoméntala. Un valor en blanco
(`brain_url: ""`) se rechaza cuando se carga la configuración: indica la URL o
quita la clave.

**Sin ella:** `repos sync` no monta nada, y lo dice una sola vez:

```txt
no brain_url in .multivac/config.yml — multivac will not guess it from a git remote; add the URL other people clone the brain from, then re-run `multivac repos sync`
```

Una url que git rechaza se reporta por su causa. Eso incluye una ruta local: git
bloquea el transporte `file` para submódulos, y multivac no desactiva esa
protección en tus repos.

### `requires` {#requires}

El multivac mínimo en el que este equipo confiará. **Escrito a mano — la
herramienta nunca escribe este campo**, porque un piso es una decisión y multivac
no responde por las decisiones de un humano.

```yaml
requires: ">=X.Y.Z"
```

La gramática es `>=X.Y.Z` y nada más. Un piso recibe la gramática de un piso:
`^0.3` o `>=0.3 <1` necesita un parser de rangos semver, que sería una cuarta
dependencia de runtime, y la ley fija la cantidad en tres. Un valor mal formado
se **rechaza por su nombre**, no se ignora — descartarlo en silencio te dejaría
creyendo que hay una compuerta declarada que no existe.

Un binario por debajo del piso recibe el aviso más fuerte en cada ejecución y
**no se rechaza**. Nada aquí cambia un código de salida: la aplicación de la
regla se degrada, nunca te deja fuera.

### `repos` {#repos}

| | |
| --- | --- |
| tipo | mapping de clave → string de ruta, o clave → `{ path, url, sdd, channel, role, managed }` |
| por defecto | `{}` |
| ejemplo | ver abajo |

El ecosistema. El prefijo `<repo>` de cada ancla es una de estas claves — más
dos integradas que no declaras: `brain` (el brain mismo) y `*` (todos los repos
declarados más el brain).

```yaml
repos:
  api: ../acme-api                     # bare string = { path: ../acme-api }
  payments:
    url: git@example.com:acme/payments.git
    path: ../payments                  # optional; defaults to ../<key>
    sdd: none                          # the one value a repo's sdd: takes — its code is not gated
    channel: origin/release            # overrides the global channel
  ledger:
    path: ../ledger
    managed: false                     # another team's: read and verified, never written
```

**`sdd:` por repo.** El SDD vive solo en el brain: se instala ahí, sus pasos se
imprimen ahí, y sus compuertas leen el brain y los worktrees del cambio — solo
el checkout del brain para un paso impreso en `change land`.
Ningún repo de código recibe andamiaje, ni se bloquea por un documento de
proyecto, ni se le dan los pasos del SDD en su puerta. Lo que el SDD del brain sí
alcanza es el CÓDIGO de cada repo declarado: aterriza solo en la rama de un
cambio abierto (consulta
[El código aterriza en un cambio](../commands#code-lands-in-a-change)). Un repo
cuyo código no debe someterse a eso lo dice en su propia entrada, con el único
valor que toma el `sdd:` de un repo:

```yaml
repos:
  landing:
    path: ../acme-landing
    sdd: none
```

`none` está fuera de alcance, no es una carencia: el código de ese repo no se
bloquea, `doctor` lo nombra como exento y nunca se reporta que le falte algo. Un
`sdd:` ausente significa que el SDD del brain gobierna el código del repo — no
significa none. Un nombre de herramienta ahí se rechaza cuando se carga la
configuración.

**La entrada del propio brain.** Sin una entrada con ruta `.`, el brain no
contiene código. Agrega `brain: .` — dentro de un cambio, una vez que la
configuración esté commiteada — cuando el brain empiece a contener código;
`init` lo escribe en una configuración que crea cuando el repo al que le hace
andamiaje contiene algún archivo propio, un README, un LICENSE o un
`.gitignore` incluidos — los archivos que git ignora no cuentan, y una
configuración que `init` conserva no se toca. Para el SDD, la entrada del brain
puede repetir la herramienta de nivel superior o declarar una donde el nivel
superior no tiene ninguna; una herramienta distinta, o `none` bajo una
herramienta de nivel superior, se rechaza:

```yaml
sdd: speckit
repos:
  brain:
    path: .
    sdd: speckit                       # repeats the top-level tool
  api: ../acme-api
```

Con `sdd: speckit` en el nivel superior y `landing` declarando `sdd: none`,
`doctor` reporta el SDD del brain y nombra el código de quién gobierna. Un repo
al que una release anterior equipó con el SDD conserva esa instalación hasta que
alguien la quite; `doctor` la nombra con la forma de quitarla y nunca falla por
ella:

```txt
sdd        speckit @ brain: installed · binary ok · sdd_auto on — the lifecycle prints this tool's own steps and refuses to move on without their artifacts
sdd        speckit governs the code of api — its steps run in the brain; exempt (sdd: none): landing
sdd        leftover speckit install @ api: .specify/integration.json (tracked) — delete .specify/ there; `specify integration uninstall <key>` removes its skills and leaves .specify/
```

Las rutas se resuelven relativas al directorio del brain. Una entrada con solo
una `url` es legal — el repo se declara antes de clonarse, y sus anclas reportan
`unevaluated` en lugar de rojo:

```txt
  unevaluated INV-04 [present] .multivac/invariants.md:12 · repo not on disk — run `multivac repos sync` to clone it
```

**Sin ella:** nada contra qué verificar salvo el propio handle `brain`.
`doctor` lo dice:

```txt
repos      none declared — add repos: to .multivac/config.yml
```

`seed` escribe el mismo hallazgo en su reporte — *No repos declared — add
them under `repos:` in `.multivac/config.yml`* — y `doors` proyecta solo en el
brain: su puerta, sus shims de hooks de git y `.multivac/flow.md`.

`*` está reservado de plano — ya significa "todos los repos" en un tramo de
ancla:

```txt
.multivac/config.yml: repos."*" is a reserved key — "*" means every repo in anchor legs; rename the repo
```

`brain` tiene exactamente un significado legal: `brain: .`, la declaración
brain==código que `init` escribe cuando el brain es su propio repo de código.
Apuntado a cualquier otro lado, dejaría que un `verify` con alcance de consumidor
evalúe las anclas del propio brain contra un checkout de consumidor, así que se
rechaza:

```txt
.multivac/config.yml: repos.brain must be the brain itself (path .) — it is "../elsewhere"; rename the repo
```

Una entrada sin `path` ni `url` no se puede ubicar:

```txt
.multivac/config.yml: repos.api needs "path" or "url" — add path: ../api
```

## Los errores son salida 2 {#errors-are-exit-2}

Una configuración que no carga es un error de entorno, no una comprobación
fallida. Todo comando que la lee sale con **2** e imprime una línea que nombra
la clave y la reparación. `doors`, `doctor` e `init` son las excepciones y salen
con 1: para `doors` y `doctor`, una configuración que no carga es el diagnóstico
que se les pidió, e `init` se detiene en lugar de volver a renderizar todas las
proyecciones desde una configuración que no pudo leer. `roadmap` a secas nunca la
lee y `roadmap add` la lee solo para comprobar el slug, así que ambos continúan
y salen con 0 cuando no carga o falta; solo `roadmap sync` sale con 2.

```txt
$ mvac verify
.multivac/config.yml: top level must be a mapping of keys, not a list or scalar
```

```txt
$ mvac verify
no .multivac/config.yml in /private/tmp — run `multivac init .` to create it
```

El consejo de `init` se da solo donde ningún brain contiene el directorio — el
propio `init` no mira hacia arriba, así que ejecutado bajo un brain crea un
segundo ahí. Bajo un brain, el rechazo nombra ese brain en su lugar, y `verify`,
que lee el checkout que contiene el lugar donde se le pide, dice dónde está
parado cuando nada lo gobierna — consulta [Dónde se enraíza una ejecución](../commands#where-a-run-roots):

```txt
$ cd src && mvac repos sync
no .multivac/config.yml in /home/you/brain/src — it is inside the brain at /home/you/brain; run this there
$ cd ~/notes && mvac verify
/home/you/notes is inside /home/you, which no brain governs — nothing was verified
$ cd /tmp/scratch && mvac verify
/tmp/scratch is in no git repository — nothing was verified; the brain at /tmp/scratch/brain verifies from there
```
## `.multivac/projected.yml` — no es configuración {#multivacprojectedyml--not-config}

Junto a la configuración vive un segundo archivo, y **no** te corresponde editarlo:

```yaml
# Written by multivac, never by hand.
# The version this brain was deliberately brought to — not whatever
# binary last touched it. `mvac doors --adopt` is what moves it.
version: X.Y.Z
```

Registra la versión a la que este brain fue **llevado deliberadamente**, no la
que haya tocado por última vez algún binario. `init` lo escribe; `mvac doors --adopt`
lo mueve; nada más lo hace. El `mvac doors` sin argumentos vuelve a proyectar y
lo deja intacto a propósito, para que el aviso sobreviva a una ejecución que
hiciste por otro motivo.

Actualizar el binario no actualiza un brain: `npm i -g multivac@latest`
reemplaza al proyector, no las proyecciones que ya escribió. El registro es lo
que permite a cada comando decirte que ambos han derivado, y nombrar el comando
que lo cierra. Es **procedencia, no integridad**: indica qué versión escribió
estos archivos, nunca que sigan siendo lo que se escribió.

## Estructura {#layout}

La configuración vive en `.multivac/config.yml`, y todo lo que multivac guarda
para sí mismo vive junto a ella: la ley, los cambios, el ritual, la caché y los
worktrees ignorados por git, y los shims de los hooks, a menos que el repo ya haya
reclamado un directorio de hooks, en cuyo caso van allí (consulta [Hooks](../hooks)). Las puertas son
la excepción, porque están donde los harness las buscan: `AGENTS.md` en la raíz
del repo, más los archivos que `doors`
proyecta para cada proveedor que listes (`CLAUDE.md`, `GEMINI.md`, `.claude/`,
`.github/copilot-instructions.md`). Tu propio contenido nunca está
bajo `.multivac/`: la línea divide los archivos del usuario de los artefactos de multivac.

```txt
AGENTS.md                  the door
.multivac/config.yml       this file
.multivac/invariants.md    the law table
.multivac/changes/         one file per ecosystem change
.multivac/ritual.md        the closing ceremony
.multivac/flow.md          what the declarations oblige; generated
.multivac/hooks/           pre-commit, pre-push and pre-merge-commit shims, unless the repo has its own hooks dir
.multivac/cache/           gitignored
.multivac/worktrees/       one checkout per repo a change names, from change apply until change close, gitignored
```

Un brain que todavía guarda `invariants.md` o `changes/` en su raíz tiene el
diseño anterior a `.multivac/`: todo comando que carga la configuración lo
rechaza y nombra `multivac init .`, que migra con `git mv` para que el historial
lo siga. Nunca mueve un archivo que multivac no haya escrito. Cuando existen
ambas copias y las dos parecen propias de multivac, esos comandos e `init .`
rechazan sin ofrecer la migración: integra a mano en `.multivac/` lo que quieras
del archivo de la raíz y luego borra el de la raíz.
