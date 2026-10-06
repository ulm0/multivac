---
title: Hooks
weight: 5
---

La aplicación de la ley es una escalera de dos peldaños, no un interruptor. Cada uno atrapa la mentira en un momento distinto, y los dos son deliberadamente desiguales en alcance y en rigor.

| peldaño | alcance | cuándo se dispara | política |
| --- | --- | --- | --- |
| **hooks de git** | **universal** — todo repo que toca `doors`, todo harness, incluso ningún harness | `pre-commit`, `pre-push`, `pre-merge-commit` | por defecto (`--strict` en el push, opcionalmente) |
| **hooks del harness** | solo los harnesses que los tienen — hoy, `claude` | al iniciar la sesión, después de cada edición | por defecto |

El piso es universal y tardío. El techo es angosto y temprano. Ninguno reemplaza al otro: el hook del harness atrapa a un brain mentiroso **antes** de que el agente conciba código sobre él, y el hook de git atrapa a todos los demás — un humano que escribe `git commit`, un script, un agente en un harness sin soporte de hooks.

Ambos se disparan mientras la sesión que rompió la afirmación sigue abierta — la única ventana en la que la respuesta todavía cambia lo que se escribe. La escalera se detiene ahí, deliberadamente: una verificación que corre cuando todos ya se fueron a casa le reporta la mentira a su siguiente lector, con el código ya escrito encima. Un pipeline de merge request puede respaldarla con
`verify --strict --range <base>..<head> --branch <name>`, que juzga lo que un hook omitido con `--no-verify` dejó pasar; eso es una configuración del forge que multivac no puede armar ni leer desde el disco (ver
[El código aterriza en un cambio](../commands#code-lands-in-a-change)).

## Qué multivac se ejecuta {#which-multivac-runs}

El shim prueba tres, de la más específica a la menos, y gana la primera disponible:

1. **`<repo>/dist/cli.js`** — el multivac construido en este repositorio, y solo cuando el `package.json` de ese repositorio nombra a multivac
2. **`<repo>/node_modules/multivac`** — el multivac que este repositorio declara
3. **`mvac` en el PATH** — lo que tenga la máquina

La prueba de nombre en el primer peldaño no es cautela, es identidad: `dist/cli.js` más `node_modules` describe a una enorme parte de los repositorios de CLI de Node, y sin ella un hook de multivac ejecutaba el binario **de ese proyecto** con `verify` como argumento. Lo que este orden elige es CUÁL multivac se ejecuta; no dice nada sobre si esa compilación está al día, y ese techo se declara en lugar de darlo por resuelto.

Un repositorio que construye o declara un multivac ha dicho cuál lo gobierna; lo que está instalado globalmente es lo que esa máquina tenga por casualidad. El orden solía ser exactamente el inverso, y el costo era silencioso: una instalación global con un año de retraso aplicando una tabla de la ley más antigua a un repo que fijó otra cosa.

Las compuertas propias del repositorio siguen corriendo antes que cualquiera de ellos, y su código de salida sigue ganando. Un repositorio sin ninguno de los tres nunca se bloquea — el shim dice claramente que no se verificó nada y sale con 0.

## Hooks de git — el piso universal {#git-hooks--the-universal-floor}

`init` los instala en el brain. `doors` los instala en el brain **y en cada repo declarado que esté en disco**, sin importar qué destinos de harness hayas declarado — excepto uno de solo lectura, declarado `managed: false` o un clon superficial, que no recibe nada:

```txt
$ mvac doors
brain: door + hooks updated
brain: .multivac/flow.md — what your declarations oblige, sorted; generated, binds nothing
api: door + hooks updated
payments: notice: not found at ../payments — run `multivac repos sync` to clone it
```

Tres archivos, `pre-commit`, `pre-push` y `pre-merge-commit`, todos este shim. El tercero ejecuta `verify` en un merge local, de modo que el merge de una rama que no es un cambio abierto se juzga como un commit en ella:

```sh
#!/bin/sh
# multivac hook shim — managed by `multivac doors`; regenerate, do not edit.
# Chains the repo's own .git/hooks hook first; its exit code wins.
# Runner order, most specific first: this repo's build, its declared
# dependency, then mvac on PATH. A repo that builds or declares a multivac
# has said which one governs it; PATH is whatever the machine has. No runnable
# multivac never blocks a commit: it warns loudly and exits 0.
case $0 in */*) hookdir=${0%/*} ;; *) hookdir=. ;; esac
root=$(CDPATH= cd -- "$hookdir/../.." && pwd) || exit 0
prev=$(git rev-parse --git-common-dir 2>/dev/null)/hooks/pre-commit
if [ -x "$prev" ]; then
  "$prev" "$@" || exit $?
elif [ -f "$root/.pre-commit-config.yaml" ]; then
  # fresh clone: `pre-commit install` refuses while core.hooksPath is
  # set, so run the config directly — the gate arms in every order.
  if command -v pre-commit >/dev/null 2>&1; then
    pre-commit run --hook-stage pre-commit || exit $?
  else
    echo "multivac: .pre-commit-config.yaml present but pre-commit is not installed — the project's gate did NOT run. Fix: install pre-commit (pipx install pre-commit, or brew install pre-commit)" >&2
  fi
fi
# One line when nothing is off; the full report otherwise. An env var, not a
# flag: a binary that predates it ignores it and prints in full.
export MULTIVAC_QUIET=1
# The build is used only when this repo IS multivac: `dist/cli.js` plus
# node_modules describes most Node CLI repos, and running THEIR binary as
# multivac is the tool executing somebody else's program under its own name.
if [ -f "$root/dist/cli.js" ] && [ -d "$root/node_modules" ] && \
   grep -q '"name"[[:space:]]*:[[:space:]]*"multivac"' "$root/package.json" 2>/dev/null && \
   command -v node >/dev/null 2>&1; then
  exec node "$root/dist/cli.js" verify
fi
if [ -f "$root/node_modules/multivac/package.json" ] && command -v npx >/dev/null 2>&1; then
  exec npx --no-install multivac verify
fi
if command -v mvac >/dev/null 2>&1; then
  exec mvac verify
fi
echo "multivac: hooks INACTIVE — no runnable multivac, nothing was verified. Fix: install multivac (npm i -g multivac), or build it here (pnpm install && pnpm run build)" >&2
exit 0
```

El `export` vuelve silenciosa la ejecución: un commit sin nada fuera de lugar imprime una línea, y cualquier cosa fuera de lugar imprime el reporte completo — ver
[`verify --quiet`](../commands#--quiet-one-line-when-nothing-is-off). Es una variable y no un flag para que un multivac más antiguo que el shim, que no la conoce, la ignore e imprima completo en lugar de rechazar un flag desconocido y bloquear el commit. Un hook que conectes a mano, como la línea de encadenamiento de más abajo, conserva el reporte completo.

El bloque `prev` es el encadenamiento: un repo que ya tenía un `.git/hooks/pre-commit` — una instalación del framework pre-commit, una de lefthook, una compuerta escrita a mano — lo conserva. El hook preexistente corre **primero**, y cuando falla, su código de salida es el código de salida del hook; verify nunca corre. El encadenamiento se resuelve en tiempo de ejecución, así que un gestor que instala en `.git/hooks/` *después* de multivac se recoge sin volver a ejecutar `init`.

El `elif` es el otro orden — el común. Un clon nuevo de un repo que usa el framework pre-commit tiene `.pre-commit-config.yaml` pero **todavía no** tiene `.git/hooks/pre-commit`, y `pre-commit install` se niega a escribir uno mientras `core.hooksPath` esté definido. Así que cuando la configuración existe y el hook no, el shim ejecuta la configuración directamente — `pre-commit run --hook-stage pre-commit` (`pre-push` en el shim del push, `pre-merge-commit` en el shim del merge) — y su código de salida gana, exactamente como si el hook estuviera instalado. El encadenamiento se arma en cualquier orden. Con la configuración presente pero sin binario `pre-commit` en el `PATH`, el shim avisa con fuerza por stderr y nunca bloquea — la misma postura que toma ante un ejecutor de multivac ausente — y tanto `init` como `doctor` nombran el estado:

```txt
hooks      core.hooksPath ok · pre-commit installed · pre-push installed · .pre-commit-config.yaml with no .git/hooks/pre-commit — the shim runs `pre-commit run --hook-stage <stage>` directly (`pre-commit install` refuses while core.hooksPath is set) · active (mvac on PATH)
```

```txt
hooks      core.hooksPath ok · pre-commit installed · pre-push installed · WARNING .pre-commit-config.yaml present, no .git/hooks/pre-commit and no pre-commit binary — the project's gate cannot run → install pre-commit (pipx install pre-commit, or brew install pre-commit) · active (mvac on PATH)
```

Husky y lefthook no tienen esta trampa: un `.husky/` con `core.hooksPath` todavía sin definir significa que multivac instala al lado y deja `core.hooksPath` para que lo reclame el `prepare` propio de husky, así que ambas compuertas se arman en cualquier orden; un `lefthook.yml` se encadena a través de
`.git/hooks/` en cuanto `lefthook install` escribe ahí.

| hook | ejecuta | cuando `strict_pre_push: true` |
| --- | --- | --- |
| `.multivac/hooks/pre-commit` | `mvac verify` | sin cambios — los commits siguen siendo permisivos |
| `.multivac/hooks/pre-push` | `mvac verify` | `mvac verify --strict` |
| `.multivac/hooks/pre-merge-commit` | `mvac verify` | sin cambios — los merges siguen siendo permisivos |

### Por qué viven en `.multivac/hooks/` {#why-they-live-in-multivachooks}

No en `.git/hooks/`. multivac escribe los shims en un directorio **versionado** y apunta git hacia él:

```sh
git config core.hooksPath .multivac/hooks
```

`.git/hooks/` no se clona, así que los hooks instalados ahí son un paso de configuración por máquina que alguien siempre olvida. `.multivac/hooks/` se commitea como cualquier otro archivo: viaja con el clon, y el único estado por máquina es la línea de `core.hooksPath`, que `doctor` revisa.

```txt
hooks      core.hooksPath ok · pre-commit installed · pre-push installed · active (mvac on PATH)
```

```txt
hooks      core.hooksPath unset → git config core.hooksPath .multivac/hooks · pre-commit installed · pre-push installed · active (node dist/cli.js)
```

```txt
hooks      core.hooksPath ok · pre-commit installed · pre-commit chains .git/hooks/pre-commit (runs first, its exit code wins) · pre-push installed · active (mvac on PATH)
```

`doctor` a secas reporta cada uno de estos estados y sale con 0 — incluidos los desarmados (`core.hooksPath` sin definir, un shim `pre-commit` o `pre-push` ausente, ningún multivac ejecutable). Lee solo esos dos shims; un shim `pre-merge-commit` ausente no se reporta. Eso es un reporte, y un humano tiene que leerlo. **`doctor --strict` convierte el piso en una aserción**: sale con 1 cuando la compuerta no está armada, de modo que un paso de configuración o un hook de inicio de sesión que ejecute `mvac doctor --strict` falla en el momento en que el piso cae, en lugar de quedarse callado mientras nada se aplica. Ver
[`doctor --strict`](../commands/#doctor---strict).

### Un repo que ya tiene hooks {#a-repo-that-already-has-hooks}

Tomar `core.hooksPath` por encima de la compuerta existente de un proyecto la desarmaría en silencio — el fallo que detectó la medición 2 en saleor, donde el framework pre-commit (ruff, mypy, semgrep) dejó de correr y nada lo avisó. Por eso, antes de tocar nada, `init` detecta `.git/hooks/<name>`, un `core.hooksPath` ajeno, `.husky/`, `lefthook.yml` y `.pre-commit-config.yaml`, elige una de tres estrategias y dice cuál usó:

| forma encontrada | estrategia | qué ocurre |
| --- | --- | --- |
| nada | **fresh** | shims en `.multivac/hooks/`, `core.hooksPath` apuntando ahí |
| `.git/hooks/<name>`, `.pre-commit-config.yaml`, `lefthook.yml` | **chained** | los mismos shims; cada uno ejecuta primero el hook propio del repo en `.git/hooks`, y su código de salida gana — y un `.pre-commit-config.yaml` sin hook instalado corre vía `pre-commit run` |
| `core.hooksPath` definido en otro lugar, o `.husky/` con `core.hooksPath` sin definir | **alongside** | nunca se reapunta — el shim se escribe DENTRO de ese directorio donde el nombre esté libre |

`core.hooksPath` se lee **como lo lee git**, con `git config --path`: un `~` o `~user` inicial se expande primero al directorio personal, y lo que queda nombra el directorio sin más si es absoluto; si no, se resuelve contra la raíz del árbol de trabajo, porque ahí está parado git cuando ejecuta un hook. Así, un repo que escribió su directorio de hooks como `/home/you/proj/.githooks` recibe el shim en `/home/you/proj/.githooks`; uno que lo escribió como `~/.githooks` lo recibe en `$HOME/.githooks`, no en un directorio llamado `~` dentro del checkout; y uno que escribió el directorio propio de multivac por el camino largo se reconoce como ya nuestro en lugar de tratarse como una compuerta ajena.

Un `git worktree` enlazado hereda tal cual el valor de su checkout principal a través de la configuración compartida, y a qué rama cae depende de la forma en que lo heredó: relativo, se resuelve contra la raíz del propio worktree, así que el worktree tiene su propio `.multivac/hooks`; absoluto, nombra el directorio del **checkout principal**, así que el worktree instala al lado, ahí. `init` escribe en el directorio que resolvió y `doctor` lee del mismo, de modo que el reporte trata del directorio que git realmente va a ejecutar.

Donde un nombre de hook ajeno está ocupado y no ejecuta multivac, `init` rechaza ese hook e imprime la línea exacta que hay que agregar:

```txt
init: .githooks/pre-commit exists and does not run multivac — NOT touched; append this line to .githooks/pre-commit: mvac verify || exit 1
```

`doctor` reporta el estado de convivencia — y nunca aconseja reapuntar un hooksPath que el repo posee:

```txt
hooks      core.hooksPath is .githooks (this repo's own gate — multivac installs alongside, never repoints) · WARNING .githooks/pre-commit does not run multivac → append: mvac verify || exit 1 · pre-push runs multivac (.githooks/pre-push)
```

### Instalado no es aplicado {#installed-is-not-enforcing}

El shim nunca bloquea un commit por falta de ejecutor. Prueba los tres ejecutores de [Qué multivac se ejecuta](#which-multivac-runs), del más específico al menos, y si no hay ninguno imprime una advertencia por stderr y sale con 0.

Eso es deliberado y es la diferencia entre una protección que la gente conserva y una que la gente borra. La aplicación **se degrada**; no te deja afuera. El costo es real y se paga a sabiendas: una máquina sin ejecutor no recibe ninguna verificación, y nada aguas abajo atrapará lo que dejó pasar — por eso `doctor` nombra el ejecutor que encontró, o dice `INACTIVE`, y por eso existe `doctor --strict`, para que ese estado falle en voz alta.

Lo local del repo cuenta solo cuando realmente puede ejecutarse: un `dist/` sin `node_modules` al lado no es un ejecutor, porque node sale con 1 en su primer import desnudo y esa salida bloquearía el commit.

## Hooks del harness — el techo temprano {#harness-hooks--the-early-ceiling}

La entrada `claude` del registro es la única que hoy lleva una configuración de hooks. `doors` fusiona estas entradas en `.claude/settings.json`, preservando cada clave y entrada que no le pertenece:

| evento | matcher | comando |
| --- | --- | --- |
| `SessionStart` | — | `mvac verify 2>&1 \|\| true` |
| `PostToolUse` | `Edit\|Write\|MultiEdit` | `mvac verify >&2 \|\| exit 2` |

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [ { "type": "command", "command": "mvac verify 2>&1 || true" } ] }
    ],
    "PostToolUse": [
      {
        "hooks": [ { "type": "command", "command": "mvac verify >&2 || exit 2" } ],
        "matcher": "Edit|Write|MultiEdit"
      }
    ]
  }
}
```

`SessionStart` es el primer momento útil: el agente está a punto de leer el brain, y esto le dice si el brain es verdadero en este momento. `PostToolUse` vuelve a verificar después de cada escritura, en el checkout del archivo escrito cuando un brain lo gobierna (se lee del payload del harness; el comando de arriba no cambia), de modo que un cambio que rompe una afirmación sale a la superficie en el mismo turno que lo hizo, no tres archivos después — incluida una edición hecha en un worktree de cambio desde una sesión que está en el checkout principal.

**Los wrappers son la entrega, no decoración.** Claude Code le da al modelo solo el stdout de salida 0 en `SessionStart` y solo el stderr de salida 2 en `PostToolUse`; toda otra salida te muestra el stderr a ti y no le da nada al modelo. Un `mvac verify` pelado escribe sus hallazgos en stdout y sale con 1 cuando bloquea — así que antes de los wrappers la compuerta no entregaba nada en la única ocasión en que tenía algo que decir. Por eso el comando de sesión fusiona stderr en stdout y siempre sale con 0, porque ahí los hallazgos son la carga útil y el contrato no tiene bloqueo al inicio de la sesión. El comando posterior a la edición envía todo a stderr y convierte **todo** fallo en salida 2 — una ley en rojo, una configuración que la propia edición acaba de romper, un binario que desapareció — porque después de la edición de un agente cada uno de esos casos le toca responderlo al agente. La edición ya está en disco: el bloqueo es una lectura forzada en el mismo turno, no una reversión.

Después de una edición el comando envía el reporte completo del binario a stderr, pero una ejecución en verde sale con 0, así que al modelo no se le entrega nada de él; al iniciar la sesión la ejecución es silenciosa y una en verde es una línea — resumen, encabezado, lecturas, promulgación. Una compuerta que habla largo cuando no tiene nada que decir le enseña al lector a dejar de leerla.

**Los comandos no llevan ningún interruptor.** Claude Code le entrega a cada hook el evento y, después de una edición, el archivo escrito, como JSON por stdin, y define `CLAUDE_PROJECT_DIR` solo en los procesos de hook. `verify` lee ese payload solo cuando la variable está definida y no se nombró ningún directorio: el evento de sesión vuelve silenciosa la ejecución y la inicia en el directorio de la sesión (el `cwd` del payload, porque un hook que el harness reenvía parte en tu directorio personal); el evento de edición ancla la ejecución en el archivo editado cuando lo gobierna un consumidor, una puerta o un brain que es su propio repositorio, y si no, en el directorio de la sesión. Un brain commiteado dentro de otro repositorio — un fixture de prueba, a menudo en rojo a propósito — nunca se sigue hacia adentro. Poner el interruptor en el comando, en cambio, lo citaría en cada entrega en rojo y, bajo un `doors` más antiguo, agregaría una segunda compuerta junto a la primera. Que el harness entregue la línea silenciosa y siga una edición en un worktree se leyó de su propio binario con un payload simulado; una sesión en vivo es la confirmación.

La fusión es idempotente — volver a ejecutar `doors` no duplica entradas — y defensiva. Un archivo de configuración que no es JSON válido se deja intacto y se reporta:

```txt
brain: notice: .claude/settings.json is not valid JSON — fix it, then rerun `multivac doors`
```
### Qué significa "preservar" aquí {#what-preserving-means-here}

El merge **es dueño solo del hook que escribió**, y la unidad de propiedad es el
comando individual, no la entrada que lo rodea. Una entrada es tu agrupación —
tu matcher, tu lista de comandos — así que:

- La identidad es exacta. `mvac verify` es de multivac; `mvac verify --strict`
  es tuyo y nunca se reclama.
- Una actualización reescribe un comando en su lugar, y completa el `type` que
  el propio multivac escribe si el hook se tipeó a mano sin él — un hook sin
  `type` nunca se ejecuta. Los comandos que agregaste a su lado se quedan, en
  orden, y los campos que multivac no escribe — un `timeout`, por ejemplo — se
  quedan con ellos.
- Un matcher se escribe una sola vez, cuando multivac crea su propia entrada, y
  después nunca se reescribe. El matcher de una entrada es tuyo.
- Un hook posterior a la edición que una release anterior escribió para
  refrescar un grafo de código se elimina, sea cual sea lo que declare la
  config: multivac no mantiene ningún grafo de código. Se reconoce por el
  preámbulo de bloqueo que multivac generó, que nada más escribe, así que un
  comando de refresco que tú mismo escribiste nunca es de multivac. Solo se va
  ese comando, no la entrada: una entrada que compartes con él sobrevive, con
  tus comandos, y solo se descarta una entrada que él deja vacía. `doors` lo
  dice una vez por archivo de settings.

Ser dueño de un comando no es lo mismo que cubrir un evento. Si el único
`mvac verify` en `PostToolUse` está en una entrada tuya con otro matcher —
`Bash`, por ejemplo — la compuerta no está en las herramientas de edición en
absoluto, y multivac no reescribirá tu matcher para llegar ahí. Agrega su
propia entrada al lado de la tuya y lo dice:

```txt
brain: notice: .claude/settings.json: hooks.PostToolUse already runs `mvac verify >&2 || exit 2`, but not on matcher `Edit|Write|MultiEdit` — the gate has to cover what it gates, so multivac added its own entry beside yours rather than rewrite a matcher it does not own. Delete whichever you do not want by hand.
```

Agregar es reversible y reescribir tu matcher no lo es, así que así se hace —
pero lo que no es negociable es la frase: una compuerta de edición que termina
conectada a nada sin que nadie lo note es el fallo que esta regla existe para
evitar.

Las versiones anteriores comparaban con una *subcadena* del comando y luego
reemplazaban la entrada completa, lo que podía borrar un hook escrito a mano y
dejar una segunda copia del comportamiento propio de multivac. `doors` informa
ese resto en lugar de corregirlo, porque el sobreviviente es idéntico byte a
byte a lo que multivac escribe y solo tú sabes cuál querías conservar:

```txt
brain: notice: .claude/settings.json: hooks.PostToolUse runs `mvac verify` 2 times — verify fires once per copy. Delete the entries you do not want by hand; multivac removes no hook entry it did not write, because doing that silently is the defect this notice reports.
```

## Qué bloquea y qué informa {#what-blocks-and-what-informs}

Cada peldaño ejecuta el mismo `verify`, así que la política es la misma en
todas partes. Para un tramo, el modo de ancla que se rompió decide si el código
de salida bloquea; la tabla de abajo es esa regla.

| resultado del tramo | por defecto (hooks) | `--strict` (el push, con `strict_pre_push`) |
| --- | --- | --- |
| `absent` roto/vacuo — una lápida | **bloquea** | bloquea |
| `count` roto/vacuo | **bloquea** | bloquea |
| `each` / `each!` roto/vacuo — un universal | **bloquea** | bloquea |
| `present` / `unique` roto/vacuo | informa, salida 0 | **bloquea** |
| `moved` — renombre autocorregido | informa, salida 0 | informa, salida 0 |
| `unevaluated` — repo no está en disco | informa, salida 0 | informa, salida 0 |
| un tramo de una fila `proposed` | informa, salida 0 | informa, salida 0 |
| un tramo de una fila `drift` — un hallazgo registrado | informa, salida 0 | informa, salida 0 |
| una afirmación que declara un cambio abierto — `pending` | informa, salida 0 | informa, salida 0 |
| error de análisis del ancla, también en una fila `proposed` | **bloquea** | bloquea |

El conjunto bloqueante es la clave `blocking:`, por defecto `[absent, count, each]`.
Puedes ampliarlo; no puedes quitar `absent`. Consulta
[Configuración](../configuration#blocking).

En un checkout del brain, algunas líneas bloquean sea cual sea el modo de ancla,
en una ejecución por defecto: una línea de `enact` que dice REFUSED, el archivo
de la ley eliminado o una fila que era ley borrada en lugar de retirada, un pin
desactualizado bajo `staleness: block`, un cambio a la config hecho sin un
cambio abierto, y, donde el brain es a su vez un repo declarado que un SDD
gobierna con `sdd_auto` activado, código fuera de la rama de un cambio abierto
que declara el repo. `--strict` agrega un cambio abierto que está terminado y no
cerrado. Un repo consumidor que lee un brain montado puede llevar dos de esas
líneas, código fuera de la rama de un cambio abierto (bajo la misma condición) y
el rechazo del SDD del brain montado. Ambas bloquean solo bajo `--strict`; una
ejecución por defecto las imprime, salvo el código en la rama de un cambio
abierto que no declara el repo, que bloquea en cualquier ejecución. Una línea
que bloquea dice `blocking` en su propio texto — la línea de la config dice en
cambio que está modificada y que no hay ningún cambio abierto — y el código de
salida lee el mismo hecho.

La asimetría es todo el diseño. Un commit a medio refactor que movió un archivo
no debería morir por una verificación de presencia — eso es ruido, y una guarda
que produce ruido se desactiva en una semana. Llamar a un mecanismo que fue
eliminado debería morir de inmediato — eso es daño, y es justo lo que nadie
nota a mano.

## Escalera recomendada {#recommended-ladder}

```yaml
# .multivac/config.yml
blocking: [absent, count, each]   # the default: tombstones and universals gate, renames do not
strict_pre_push: true             # the push gates on present/unique too, the commit stays permissive
```

Un commit es barato de enmendar, así que no debería morir por una verificación
de presencia que la siguiente edición arreglará de todos modos. Un push es el
último salto fuera de la máquina, y ese es el que vale la pena someter a la
vara más exigente.

Para una ejecución que no debe escribir — un checkout de solo lectura, una
pasada sobre una rama que solo estás revisando — agrega `--check`:

```sh
mvac verify --strict --check
```

`--check` informa un tramo `moved` en lugar de reescribir el glob. La
reescritura pertenece a un árbol de trabajo donde una persona puede leer el
diff, no a un lugar sin dónde hacer commit.

## Nada aquí hace commit {#nothing-here-commits}

`doors` e `init` escriben árboles de trabajo. Nunca hacen `git add`, nunca hacen
commit, nunca hacen push y nunca clonan. Lo que hayan cambiado es un diff que
revisas, en el brain y en cada repo consumidor al que llegaron.
