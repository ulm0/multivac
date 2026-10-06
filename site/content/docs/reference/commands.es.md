---
title: Comandos
weight: 1
---

Un binario, dos nombres: `multivac` y `mvac`. Diez comandos.

```txt
$ mvac --help
multivac <command> [args]

commands:
  init       scaffold the brain: everything multivac owns under .multivac/
  seed       deterministic boundary inventory -> .multivac/seed-report.md
  verify     check anchors against the declared repos (deterministic, offline)
  count      dry-run an anchor leg: match count + per-file breakdown, verify's own matcher
  doors      project doors + install git hooks into the brain and declared repos
  doctor     what is declared, what was found, what is degraded, how to fix it
  repos      list declared repos; `repos sync [--shallow]` clones the missing, fetches the rest; `repos check` verifies them offline
  change     new/plan/apply/land/close — the ecosystem change lifecycle
  roadmap    the changes that have not started yet — list them, record one
  help       help <topic|command> — `help anchor` prints the anchor grammar on one screen
```

**[citty](https://github.com/unjs/citty) interpreta los argumentos y multivac
los rechaza.** Cada comando salvo `roadmap` y `help` declara una sola vez, como
datos, lo que acepta; citty interpreta esa declaración y el rechazo de más
abajo lee la misma, así que agregar un flag es una sola edición. `roadmap` le
entrega al rechazo su propia superficie, y `help` lee solo su primer
argumento. El rechazo no se delega: medido, citty convierte un flag no
declarado en una clave que nadie declaró y la entrega tal cual, que es
precisamente el silencio que el rechazo existe para terminar — por eso la
verificación corre primero, y el intérprete nunca ve un argumento que el
comando no declaró. `--help` sigue siendo de esta herramienta; el uso generado
por citty no se utiliza.

`--help` / `-h` imprime el bloque de arriba y sale con 0. `--version` / `-v`
imprime la versión y sale con 0, pero solo como primer argumento: después de un
comando se rechaza como flag desconocido (después de `help`, como tema
desconocido). Ejecutar `mvac` sin argumentos imprime el mismo uso y sale con
**2**.

**`--help` es una respuesta, nunca una acción.** En cualquier subcomando,
`--help` o `-h` en cualquier lugar de los argumentos lo responde el despachador
**antes de que el comando se ejecute**: el uso por stdout, salida 0, sin efecto
alguno en el árbol. `mvac seed --help` imprime lo que haría seed; nunca escribe
un informe de seed.

**El límite del LLM:** ningún comando de aquí llama a un modelo, y ninguno
necesita una clave de API. `verify`, `doctor` y `doors` nunca tocan la red.
Otros comandos sí la usan, y lo dicen: `repos sync` hace fetch, `roadmap sync`
escribe issues en el tracker declarado a través de su CLI, `change plan` y
`change apply` clonan un repo que el cambio nombra, que está ausente y tiene un
`url` (uno declarado `managed: false` se rechaza antes), y `init`,
`repos sync` y `change new`, `plan`, `apply` y `close` (pero no `close
--abandon`) ejecutan el scaffold propio de la herramienta SDD donde la
herramienta declarada nunca se ha ejecutado, lo que puede usar la red o enviar
telemetría — consulta [adaptadores SDD](../sdd). `seed` y la entrevista solo
redactan borradores que luego un humano promulga; el agente que redacta es
tuyo, no de multivac.

## `init [dir] [--provider a,b] [--sdd name] [--quiet]` {#init-dir---provider-ab---sdd-name---quiet}

Crea el scaffold del brain en `dir` (por defecto `.`).

```txt
$ ls
src
$ mvac init . --provider claude,cursor
  ╭───────────────╮
  │  ●   ●   ○    │   multivac
  │  ○   ◍   ●    │   brain-driven development
  ╰───────────────╯

init: git init — the brain is git-native
init: wrote .multivac/config.yml — brain==code (repos: brain: .); add sibling repos there
init: wrote AGENTS.md — the door; your agent reads it first
init: wrote .multivac/invariants.md — the law table, zero rows
init: wrote .multivac/ritual.md — candidates, all commented; uncomment what your team owes each other
init: hooks in .multivac/hooks (core.hooksPath) — verify runs on commit
brain: door + hooks updated
brain: .multivac/flow.md — what your declarations oblige, sorted; generated, binds nothing
brain: brain==code — the brain door is this repo's door

init: done — the brain is scaffolded and empty. Session zero fills it:
init:   before step 0, declare every repo this brain governs under `repos:` in .multivac/config.yml — once committed, the config changes only inside a change
init:   0. commit what was just written: git add -- .claude .multivac AGENTS.md CLAUDE.md && git commit -m "multivac init"
init:   1. load the multivac skill in your agent — it carries both protocols
init:   2. `multivac repos sync` — clones every declared repo and installs its declared tools
init:   3. discovery, for code that exists — `multivac seed` inventories it, then draft proposed claims from it ← this repo holds code
init:      interview, for code that does not — the law comes from a human, claim by claim
init:   4. a human enacts each row in .multivac/invariants.md, then `multivac doors` and `multivac verify`
```

En una terminal el informe se ve tenue y la línea `init: done` en color ácido:
las líneas del scaffold son un recibo, y la llamada a la acción es lo único
sobre lo que tienes que actuar. La salida por pipe y `NO_COLOR` reciben el
mismo texto sin ANSI.

Las líneas numeradas son la sesión cero, en orden, y nombran rutas y comandos
para el directorio de trabajo: después de `init some/dir`, haz `cd` ahí primero.
`repos:` va antes del primer commit, porque una config modificada después de él
necesita un cambio abierto. Se imprimen ambos flujos, y el que corresponde a
este directorio queda marcado: un brain que
contiene código significa descubrimiento, uno vacío significa entrevista. Un
brain nuevo para código que vive en otros repos está vacío, así que la marca es
una pista, no una elección. El
paso que escribe el documento de proyecto del brain aparece cuando el SDD
declarado lo bloquea; a ningún repo de código se le pide el suyo. Ambos
protocolos viven en el skill; `init` apunta a ellos y no repite ninguno.

**Que el brain contenga código se decide una sola vez.** `init` pregunta antes
de escribir nada: en un repositorio git, si git lista algún archivo fuera de
`.multivac/`, rastreado o sin rastrear y no ignorado; fuera de uno, si hay algo
además de `.multivac` y `.git`. En el ejemplo, `src/app.ts` lo hizo, así que la
config declara `brain: .` y el código propio del brain aterriza mediante
cambios como el de cualquier repo. Un repo que solo contiene un README, un
LICENSE o un `.gitignore` también cuenta como código. A una config conservada
no se le vuelve a preguntar: su brain contiene código cuando una entrada de
`repos:` es el brain. En un directorio vacío la config no declara ningún repo,
y la línea de `config.yml` lo dice:

```txt
init: wrote .multivac/config.yml — declare your repos under repos:
```

| flag | recibe | efecto |
| --- | --- | --- |
| `--provider a,b` | nombres de puertas separados por comas, sin validar | se agregan a `doors:` cuando `init` escribe la config (`agents` siempre se incluye) |
| `--sdd name` | `opsx` \| `speckit` | se escribe como `sdd:` en la config, y el init propio de la herramienta se ejecuta en el brain |
| `--quiet` | — | sin informe `init:`, sin banner; los rechazos siguen yendo a stderr. La ejecución de `doors` que inicia `--provider` y un scaffold SDD siguen imprimiendo |

**Declarado en init, instalado en init.** Con `--sdd`, o con una config que ya
declara uno, `init` termina ejecutando el init propio de la herramienta en el
brain, igual que lo hace `change`.
Una herramienta que ya está instalada ahí no se ejecuta de nuevo. Para
spec-kit, la ejecución que lo instala también escribe las plantillas de
esqueleto de multivac, como
[el scaffold](../sdd#the-scaffold-declaring-a-tool-that-has-never-run-here)
describe.

Una herramienta que `init` está por ejecutar y no encuentra se rechaza **antes
de escribir nada**, `git init` incluido, con salida 1 y dónde conseguirla:

```txt
init refused — speckit: `specify` found on neither PATH nor brain's node_modules/.bin — install speckit: uv tool install specify-cli (https://github.com/github/spec-kit)
  init runs the declared tools' own init in the brain, and nothing was written: install them and re-run, or leave the flag off and declare the tool later
```

No se exige nada para una herramienta que `init` no ejecutaría: una ya
instalada, o un SDD con `sdd_auto: false`.

**El paso 0 hace commit de lo que `init` escribió, y solo de eso.** Lista las
rutas que esta ejecución creó o cambió, dejando fuera las salidas por checkout
de las herramientas, de modo que tu trabajo sin commit nunca forma parte del
commit "multivac init". Dos bordes: las negaciones de `.gitignore` de más abajo
se escriben antes de la primera instantánea, así que el paso 0 nunca lista
`.gitignore`; y una ejecución que no cambia nada imprime
`nothing — everything init writes is already committed`, esté o no con commit.

El banner es la marca: las lámparas encendidas son afirmaciones (*claims*)
verificadas, las apagadas están sin anclar, la ácida es la afirmación en curso.
El patrón es un dibujo fijo, nunca una lectura — `init` se ejecuta antes de que
haya algo que verificar. `init` es el único comando que lo imprime; `verify`,
`doctor`, `doors` y `change` se ejecutan dentro de hooks de git y del harness,
donde sería ruido. Se omite cuando stdout no es una terminal, y `NO_COLOR`
conserva el dibujo y quita el color (`#` encendida, `.` apagada, `*` en curso).

Tanto `--flag value` como `--flag=value` funcionan, y se interpretan como el
mismo valor.
Un flag sin valor, o un flag desconocido, se rechaza:

```txt
init: unknown flag --providers — known: --provider <a,b>, --sdd <name>, --quiet
```

Un nombre de `--sdd` que nada puede honrar también se rechaza, con salida 2,
antes de crear nada: se comprueba contra el registro. `none` no es un nombre
ahí — omitir el flag declara que no hay SDD:

```txt
init: unknown --sdd nope — known: opsx, speckit
```

Los nombres de `--provider` no se comprueban. Uno desconocido se escribe en
`doors:` y la proyección que sigue imprime
`brain: notice: unknown door target "nope"` con los destinos conocidos; la
salida es 0.

Un flag con valor al que le falta el valor — o cuyo valor es a su vez un flag —
también se rechaza, en lugar de enlazar el token siguiente o una cadena vacía:

```txt
--repo needs a value — verify takes [dir], --strict, --check, --worktree, --repo <key>, --range <base>..<head>, --branch <name>, --quiet
```

La forma con igual es solo para nombres largos. El intérprete no divide un alias
corto, así que `-r=api` enlazaría el valor `"=api"`; se rechaza como flag
desconocido en lugar de aceptarlo como una forma que no funciona.

**Los flags configuran Y proyectan.** En una primera ejecución,
`--provider claude` escribe `claude` en `doors:` y lo proyecta en la misma ejecución — la
puerta, el skill, los hooks del harness. Antes se detenía en la config y
terminaba diciéndote que cargaras un skill que no había instalado. `mvac doors`
vuelve a ejecutar esa proyección después de que editas `doors:` o `sdd:` a mano.

`agents` no es un destino de `--provider`. [agents.md](https://agents.md/) es el
formato abierto desde el cual se proyecta cada otra puerta, no una herramienta
que alguien pueda instalar, y `AGENTS.md` se escribe siempre; nombrarlo se
acepta, no agrega nada a `doors:`, y aun así inicia la ejecución de `doors`.

**La puerta que escribe `init` es la que escribe `doors`** — un solo render,
construido a partir de la config, de modo que ya nombra el SDD declarado y su
flujo, y los repos del ecosistema. Ejecutar `mvac doors` justo después de
`init --provider …` no cambia nada, porque `init` ya lo ejecutó — salvo por los
ajustes del harness que el scaffold del SDD reescribió después de proyectar la
puerta, que esa ejecución fusiona por encima; tras un `init` simple escribe
`.multivac/flow.md`, que `init` no escribe. Antes reescribía
todo el bloque gestionado, porque `init` llevaba una segunda copia de la puerta
que había quedado por detrás de la primera.

Lo que `init` escribe por sí mismo, completo:

```txt
AGENTS.md                    the door — managed block only, never clobbered
.multivac/invariants.md      the law table, zero rows
.multivac/changes/           one file per ecosystem change (empty, .gitkeep)
.multivac/config.yml         the registry: repos, doors, adapters
.multivac/ritual.md          the closing ceremony, candidates all commented
.multivac/hooks/pre-commit   runs `mvac verify` on every commit
.multivac/hooks/pre-push     same, on push
.multivac/hooks/pre-merge-commit  same, on a local merge
.multivac/.gitignore         ignores .multivac/cache/ and .multivac/worktrees/
.multivac/projected.yml      the version that projected the doors, so drift can be told
.multivac/cache/             gitignored
```

más `git init` cuando el directorio aún no es la raíz de un repo,
`core.hooksPath` apuntando a `.multivac/hooks`, y las negaciones de `.gitignore`
de más abajo cuando el ignore propio del repo ocultaría una ruta del brain.
Donde el repo ya define su propio `core.hooksPath` o tiene `.husky/`, los shims
van en ese directorio y `core.hooksPath` se deja intacto (*Hooks existentes*,
más abajo).
`--provider` agrega lo que proyecta `doors` — `.multivac/flow.md`, los archivos
de cada puerta, el skill y los hooks del harness — y un SDD declarado agrega los
archivos de su propia herramienta.

`init` comprueba dos cosas antes de escribir, porque un init en verde que no
entregó nada es el modo de fallo que existe para prevenir:

- **`git check-ignore` sobre los siete archivos en los que se sostiene un
  brain:** `AGENTS.md`, la config, la tabla de la ley, el ritual,
  `changes/.gitkeep` y los hooks pre-commit y pre-push; no se pregunta por nada
  más. Un ignore a nivel de repo que se tragaría uno (un `.gitignore` que abre
  con `.*` se traga todo `.multivac/`) recibe negaciones explícitas agregadas
  bajo un comentario marcador — de forma idempotente, impresas línea por línea,
  y luego vueltas a comprobar:

  ```txt
  init: this repo's .gitignore would ignore .multivac/config.yml, … — an invisible brain commits nothing
  init: appended to .gitignore: !.multivac/  !.multivac/**
  init: re-checked — every brain path is visible to git
  ```

- **Hooks existentes.** Un repo que ya ejecuta `.git/hooks/<name>`, un
  `core.hooksPath` ajeno, `.husky/`, `lefthook.yml` o `.pre-commit-config.yaml`
  nunca se desarma en silencio: init encadena la compuerta existente (corre
  primero, su código de salida gana), o instala junto a ella en el directorio de
  hooks del propio repo, o rechaza con la línea exacta que hay que agregar — y
  dice qué estrategia usó.
  Consulta [Hooks](../hooks/).

  ```txt
  init: hooks in .multivac/hooks (core.hooksPath) — chained: .git/hooks/pre-commit runs first, its exit code wins, then verify
  ```

Sin flags de adaptador, `init` explora lo que ya hay en disco y escribe
**propuestas comentadas**, nunca claves habilitadas:

```yaml
doors: [agents]
# detected claude, cursor, gemini artifacts — to project the door there, use:
# doors: [agents, claude, cursor, gemini]
```

Volver a ejecutarlo es seguro e idempotente: una config existente se conserva,
un `AGENTS.md` existente conserva todo lo que está fuera del bloque gestionado,
los hooks se reescriben.

```txt
init: .multivac/config.yml kept — edit it directly, then `multivac doors`
```

### Volver a ejecutarlo {#re-running-it}

Es seguro, y acotado en lo que hará. Nada se agrega dos veces y nada se
destruye:

| qué | al volver a ejecutar |
| --- | --- |
| `.multivac/config.yml` | **se conserva, nunca se reescribe** — edítalo directamente y luego `multivac doors` |
| `AGENTS.md` | el bloque gestionado se refresca; tu propio contenido no se toca |
| `.multivac/invariants.md` | se conserva |
| `.multivac/ritual.md` | se conserva |
| `.multivac/.gitignore`, `changes/.gitkeep` | se conservan |
| un layout antiguo del brain | se migra, nunca se pisa |
| hooks de git | se reinstalan, sin desplazar nunca las compuertas propias del repo |

**Un `--sdd` que no coincide con la config se rechaza**, porque la config es la
autoridad una vez que existe:

```txt
init refused — .multivac/config.yml already declares sdd: speckit and --sdd says opsx
  the config is authoritative on a re-run; a flag cannot change it, and init will not write a door that disagrees with it
  change it in .multivac/config.yml then run `multivac doors`, or drop --sdd
```

Ese rechazo no escribe ningún archivo del brain, aunque un `git init` de un
directorio que aún no era un repo ya se haya ejecutado. Antes de que existiera,
la config se conservaba y el flag igual ganaba la puerta — así que la puerta le
indicaba al agente seguir una herramienta que la ley no declaraba, y nada lo
decía.

Un `--sdd` que **coincide** se acepta y se informa como redundante. Uno que
nombra un adaptador del que la config no declara ninguno se informa junto con
cómo hacer que quede, nunca se rechaza — nada discrepa, y la config solo se
edita a mano. `--provider` no recibe tal línea: en una config conservada no se
escribe, y la ejecución de `doors` que inicia proyecta solo las puertas que la
config ya declara, así que agrega una puerta editando `doors:` y ejecutando
`multivac doors`.

**La puerta nombra lo que la config declara, y nada más.** Eso incluye el caso
recién descrito: un `--sdd` al que la config no responde se informa y no llega a
la puerta, así que `init` y `doors` nunca nombran herramientas distintas en el
mismo repo. Antes sí lo hacían — `init --sdd speckit` sobre una config sin
`sdd:` escribía una puerta que bloqueaba mediante speckit mientras informaba que
el flag no estaba en la config, y el siguiente `mvac doors`, leyendo solo la
config, borraba el bloque de nuevo:

```txt
$ mvac init --sdd speckit .
init: .multivac/config.yml kept — edit it directly, then `multivac doors`
init:   --sdd speckit is not in it: add `sdd: speckit` there, then `multivac doors`
$ grep -c 'Features gate through' AGENTS.md
0
```

Para que un flag quede, pon la clave en `.multivac/config.yml` y ejecuta
`multivac doors` — los dos pasos que nombra el informe.
## `seed [dir]` {#seed-dir}

```txt
$ mvac seed
seed: wrote .multivac/seed-report.md — 1 repo(s) inventoried, 1 skipped
seed: next — take the open questions to a maintainer, then draft proposed claims (see the multivac skill)
```

La mitad determinista de la sesión cero: un inventario de dónde vive la
arquitectura de cada repo declarado y presente, escrito en `.multivac/seed-report.md`.
Las categorías son datos de patrones, no código — compuertas de políticas (semgrep, pre-commit,
eslint/biome/ruff, CODEOWNERS), grafo de workspace / build (pnpm-workspace,
turbo, go.work, `.sln`/`.csproj`), manifiestos de despliegue (kubernetes, helm,
kustomize, skaffold), decisiones / intención (ADRs, AGENTS.md, CONTRIBUTING),
modelos / esquema, migraciones, configuración de runtime y el resto. Los fixtures de prueba,
`examples/` y los árboles vendorizados quedan excluidos; cada categoría lista como máximo 25
archivos más un conteo. Sin LLM, sin interpretación. Los repos que no están en disco se listan
en una sección `skipped` con el comando de sincronización; `seed` nunca clona.

El brain también recibe una sección `### setup`: indica si el documento de proyecto
del SDD está escrito, con el comando que lo escribe. El documento es del brain, así que
se informa una sola vez — en la entrada propia del brain cuando este también es un repo de código,
o en una sección `## brain` aparte cuando no tiene código — y nunca para un
repo de código. `seed` lee los archivos del proveedor para esto y nunca
ejecuta un proveedor.

Una vez que un repo declarado está en disco, el reporte trae tres **preguntas abiertas** —
deuda o intención, ley o gusto, qué autoridad prevalece — instanciadas contra las
compuertas, la prosa, los stacks de despliegue y los documentos de proyecto escritos que encontró, y luego un
breve `## next`. Son el insumo de la entrevista: un maintainer las responde
antes de que cualquier fila propuesta se vuelva ley. Sin ningún repo declarado en disco no hay
ninguna, aunque `seed` igual imprime su línea que te dice que las lleves a un
maintainer.

Nada de lo que escribe es ley — el reporte lo dice en su propio encabezado. Tu agente
lo lee y redacta filas `proposed`. Consulta
[Sesión cero](../../guide/session-zero).

## `verify [dir] [--strict] [--check] [--worktree] [--repo <key>] [--range <base>..<head> --branch <name>] [--quiet]` {#verify-dir---strict---check---worktree---repo-key---range-basehead---branch-name---quiet}

El núcleo. Verifica cada ancla del brain contra los repos declarados.
Determinista, sin conexión, de menos de un segundo por diseño. `dir` es `.` por defecto y puede ser
cualquier directorio de un checkout: la ejecución lee el checkout que lo contiene — consulta
[Dónde se enraíza una ejecución](#where-a-run-roots).

```txt
$ mvac verify
4 claims · 4 anchored (100%)
  read      api: origin/main @ 1a2b3c4 — the channel, as published (last fetch 2h ago)
  read      web: origin/main @ 9f8e7d6 — the channel, as published (last fetch 2h ago) (this checkout is parked on wip/redesign @ 4d5e6f7, not read)
  read      docs: not on disk — nothing read; run `multivac repos sync`
  read      brain: working tree on main @ abc1234 — the brain's own repo, the commit this run gates

  ok          3
  unevaluated   1
  unevaluated INV-04 [present] .multivac/invariants.md:12 · repo not on disk — run `multivac repos sync` to clone it
  enact     no row enacted in this commit — 3 staged paths, no row reached active

0 blocking broken · exit 0
```

Dos de esas líneas las imprime **toda** ejecución, sin importar lo que digan las afirmaciones — en una
ejecución silenciosa, como cláusulas de su única línea. Una línea `read` por repo nombra la ref o
la rama y su sha, de modo que lo leído nunca se infiere. Y una línea `enact` pregunta si una fila se promulga sola en el
commit que se está componiendo: una fila que llega a `active` junto al código que ancla
se rechaza, una fila promulgada sola se nombra, y cuando no hay nada en staging la línea dice
que no se pudo hacer la pregunta en vez de insinuar una respuesta.

```txt
  enact     INV-07 → active, alone in this commit — the row is reviewable on its own
  enact     not answered — nothing staged, so no commit is being composed; … reads the index against HEAD
```

Junto a ella, y desde la misma lectura, una línea `law` hace la pregunta contraria:
si el commit quita ley, porque la muerte de la ley se bloquea igual que su
nacimiento. Una fila que era ley en HEAD, `active` o `retired`, y que desapareció del
índice rechaza el commit, y lo mismo hace un índice que elimina el archivo de la ley.
Retirar una fila no es morir — es la forma sancionada de que una regla deje de
aplicarse, y la fila retirada queda como su registro — y que una fila `proposed`
desaparezca es una reserva que se devuelve, lo que hace `change close --abandon`
por diseño. Ninguno de los dos se rechaza.

```txt
  law       REFUSED INV-07 was law and is gone · blocking — a row stops applying by being RETIRED, in the open, not by being deleted: set its state to retired and leave the row where a reader can find it
  law       REFUSED .multivac/invariants.md is removed by this commit · blocking — a brain with no law verifies nothing and says so in green. Restore it: git restore --staged --worktree -- .multivac/invariants.md
```

Cuatro líneas — `enact`, `config`, `law` y, fuera de un `--range`, `code` — leen el
índice en el que se está componiendo el commit, no el que está en disco. Los dos difieren:
medido en git 2.55, `git commit -a` compone en `.git/index.lock` y un
commit con pathspec en `.git/next-index-NNN.lock`, así que una verificación que lea `.git/index`
responde sobre un commit que nadie está haciendo.

| flag | efecto |
| --- | --- |
| `--strict` | todo tramo `broken` o `vacuous` de una fila que no sea `proposed` ni `drift` sale con 1, sea cual sea su modo de ancla, no solo los modos bloqueantes; un cambio terminado que no se cerró rechaza la ejecución; y donde un checkout consumidor lee el brain a través de su montaje, también bloquean la línea `code` y el rechazo del SDD del brain montado. `strict_pre_push` lo activa en el shim de pre-push, que no pasa `--range` y no pone nada en staging por sí mismo, así que ahí la línea `code` juzga solo lo que esté en staging en ese momento. |
| `--check` | nunca escribe: un tramo `moved` se informa en vez de autocorregirse. |
| `--worktree` | lee el **árbol de trabajo** de cada repo declarado en vez de su ref de canal — estado local de todo el ecosistema, a propósito. En un checkout consumidor se ignora con una advertencia: esa ejecución ya lee el árbol de trabajo. |
| `--repo <key>` | limita a un repo declarado. **Solo tiene sentido desde un repo consumidor** — desde un brain se ignora con una advertencia. |
| `--quiet` | una línea cuando nada falla; el reporte completo en caso contrario — ver abajo. `MULTIVAC_QUIET=1` pide lo mismo. |
| `--range <base>..<head>` y `--branch <name>` | el lector de CI: juzga los commits sin merge del rango, de modo que un commit hecho con `--no-verify` igual se detecta. Van juntos: uno sin el otro, o un rango que no sea `<base>..<head>`, sale con 2. |

### `--quiet`: una línea cuando nada falla {#--quiet-one-line-when-nothing-is-off}

Una ejecución silenciosa imprime **una línea** cuando cada línea del reporte tiene una
forma silenciosa, y el reporte completo, byte por byte, en cuanto algo falla:

```txt
$ mvac verify --quiet
0 blocking broken · exit 0 · 12 claims · 12 anchored (100%) · read api origin/main @ 1a2b3c4 (last fetch 2h ago), brain main @ abc1234 (working tree) · enact not answered (nothing staged)
```

El resumen va primero, así que un lector o un script que busque `<n> blocking broken
· exit <n>` al inicio de una línea lo encuentra donde el reporte completo lo pone. Luego el
encabezado, `unanchored: <ids>` cuando una afirmación no tiene ancla, cada lectura simple con la
misma ref o rama, sha y antigüedad del fetch, la respuesta de `enact` con su motivo, y
`code → <slug>` cuando el código del commit aterriza en un cambio abierto. Al final viene
`<keys> ignored (delete from .multivac/config.yml)` cuando la configuración aún tiene
una clave que un release anterior leía. La línea de un consumidor lleva `brain at <dir>` y
`enact not answered (decided in the brain)`.

Una lectura que no es simple — con fallback, `--worktree`, fuera de canal, estacionada, nunca
obtenida con fetch aquí, detrás de su propio canal, a mitad de un merge, no en disco — imprime su línea
`read` completa debajo de la única línea, y lo mismo hace un pin `stale` que no bloquea.
Todo lo demás que falla imprime el reporte completo, ambos flujos en el orden en que
se escribieron: una línea de tramo o de conteo distinta de `ok`, un cambio terminado, un
pin desactualizado que bloquea, una ley en staging, una promulgación o un rechazo, cualquier línea `config`
salvo la nota de clave descartada, un rechazo del SDD montado, la muerte de la ley, los resúmenes de pendientes y de deriva, una línea
`code` que no sea un aterrizaje limpio, un archivo de cambio abierto que no se parsea, un
ancla que no nombra ninguna fila, cualquier advertencia y un código de salida distinto de cero. El código de salida es el
mismo en ambos casos.

El modo silencioso se pide, nunca se infiere: `--quiet`; `MULTIVAC_QUIET=1` en el
entorno, que exportan los hooks de git que escribe `doors`, así que un commit limpio dice
una línea; o el hook de inicio de sesión del harness (consulta
[hooks](../hooks#harness-hooks--the-early-ceiling)). Un `mvac verify` simple sigue siendo
ruidoso: lee las líneas `read` antes de leer los veredictos.

### Qué lee cada ejecución {#what-each-run-reads}

**El brain verifica el ecosistema tal como está publicado; un consumidor verifica lo que
está por commitear.** Dos contextos, dos alcances:

| ejecución | qué lee | por qué |
| --- | --- | --- |
| **con alcance de brain** (ejecutada en cualquier parte del checkout del brain) | cada repo declarado en su **ref de canal** — `channel:` en la entrada, si no el global, si no `origin/main` | la ley del brain trata del estado que todos comparten. Un compañero a medio trabajo en una rama WIP de un repo hermano no es una violación |
| el **repo propio del brain**, en la misma ejecución | su **árbol de trabajo** | ahí está trabajando el autor, y la ley del brain debe bloquear el commit del propio brain |
| **con alcance de consumidor** (ejecutada en cualquier parte del checkout de un repo de código, con el brain montado en él) | su **árbol de trabajo** | ese es el contenido que está por commitearse *ahí* |

Antes de esto, cada repo se leía como árbol de trabajo, desde todas partes. Un
hermano estacionado en una rama ponía en rojo la ley del brain por un motivo que no tenía
nada que ver con el ecosistema — y una compuerta que da falsas alarmas se salta
con `--no-verify`, que es el piso de cumplimiento perdido porque la herramienta se equivocaba.

**Cada ejecución dice qué bytes leyó.** Una línea `read` por repo que nombra la
ref o la rama y su sha corto — en una ejecución silenciosa una lectura simple es una cláusula
de su única línea, con la misma ref, sha y antigüedad, y cualquier otra imprime su
línea completa; un checkout estacionado fuera de su canal se nombra como tal, de modo que un
repo fuera de canal es legible en vez de una premisa silenciosa tras un veredicto
misterioso.

**Una ref de canal es una instantánea local, así que su antigüedad va en la línea.** `verify` nunca
toca la red: `origin/main` es lo que obtuvo el último `mvac repos sync`,
y una corrección que se mergeó upstream hace una hora simplemente aún no está ahí. Sin
la antigüedad, eso se lee como un rojo en el ecosistema en vez de una ref desactualizada en esta
máquina.

El repo propio del brain recibe el espejo de la misma honestidad. Se lee como un
árbol de trabajo a propósito — pero un brain **detrás** de su propio canal juzga un
ecosistema actual con una ley desactualizada, lo que se ve idéntico a un ecosistema
roto:

```txt
  read      brain: working tree on main @ abc1234 — the brain's own repo, the commit this run gates; 2 behind its own channel origin/main @ def5678 — an out-of-date law judges a current ecosystem
```

*Detrás*, nunca simplemente *distinto*: trabajar en una rama de feature está fuera de canal
por construcción, y una línea que se dispara en cada ejecución deja de leerse.

Una ref de canal que no se puede resolver — sin remoto, o nunca obtenida con fetch — recurre
al árbol de trabajo **y lo dice**. El significado nunca cambia en
silencio:

```txt
  read      api: working tree on main @ 1a2b3c4 — channel origin/main does not resolve here (no remote, or never fetched) — FELL BACK to the working tree
```

`--worktree` pide el comportamiento antiguo a propósito — estado local de cada repo
declarado, para cuando esa es de verdad la pregunta:

```txt
$ mvac verify --worktree
  read      api: working tree on wip/refactor @ 4d5e6f7 — --worktree: local state, not the channel; OFF channel origin/main @ 1a2b3c4
```

En qué rama está estacionado cada repo, y si esa es su canal, también es
una línea de `doctor` — consulta [`doctor`](#doctor---strict) más abajo.

Estados por tramo:

| estado | significado |
| --- | --- |
| `ok` | el tramo se cumple |
| `moved` | un tramo `present` sin coincidencias dentro del glob cuyo patrón aparece en exactamente otro archivo del mismo tipo que el include — la misma extensión final, nunca dentro de `.multivac/`: el glob se reescribe en el lugar. Un archivo de otro tipo — prosa que cita el patrón — nunca es un destino, y solo se nombra cuando ningún archivo del tipo correcto tiene el patrón |
| `broken` | el requisito del tramo falla donde se le dijo que mirara |
| `vacuous` | el glob no coincidió con ningún archivo rastreado — la afirmación pasaba describiendo la nada |
| `unevaluated` | el repo del tramo está declarado pero no en disco — se cuenta, nunca en rojo |
| `pending` | la afirmación figura en un `changes/<slug>.md` abierto: falla, y ese cambio la está reteniendo — nunca bloquea, nunca se autocorrige |
| `parse` | la línea de ancla no se parsea |

Los diagnósticos de parseo se imprimen **encima** del resumen — el porcentaje nunca se lee como
titular sobre su propia causa. Y el resumen nombra sus filas: los ids de afirmaciones
sin anclar se listan, no solo se cuentan:

```txt
$ mvac verify
5 claims · 3 anchored (60%)
  unanchored: INV-02, INV-05
```

### `drift`: un hallazgo registrado que no bloquea {#drift-a-recorded-finding-that-does-not-gate}

Una fila de la tabla de la ley cuya columna de estado dice `drift` registra un **hallazgo
real, aún no corregible**: sus tramos se evalúan y se informan — el rojo sigue
visible, y el resumen nombra los ids — pero nunca bloquean, en ningún modo,
`--strict` incluido. Anotar un hallazgo verdadero no debe volver el repo
imposible de commitear por el hook de pre-commit; `drift` es el punto medio honesto
entre borrar la afirmación y vivir con una salida en rojo.

```txt
  broken    INV-09 [absent] .multivac/invariants.md:31 · forbidden pattern at brain:docs/CONTRIBUTING.md:12 — delete it, or retire/amend the claim first · drift row — recorded finding, never blocks

0 blocking broken · exit 0
  drift: INV-09 — recorded finding, tracked in the law table, not gating; fix the code or retire the row to clear it
```

Todos los demás estados de fila dejan la matriz de salida sin cambios. Corrige el código (los tramos
pasan a `ok`, la línea del resumen desaparece) o retira la fila; vuelve a poner el estado en
`active` para que bloquee de nuevo.

El mensaje es el producto, no el código de salida:

```txt
  broken    INV-03 [absent] .multivac/invariants.md:10 · forbidden pattern at api:src/legacy.ts:1 — delete it, or retire/amend the claim first · blocking
  vacuous   INV-05 [present] .multivac/invariants.md:14 · glob matched no tracked files and /async[[:space:]]+function/ found nowhere — fix the glob or retire the claim · reported only — "present" is not in blocking: and this run is not --strict
  parse     .multivac/invariants.md:16 — \s is not POSIX ERE — use [[:space:]]
```

Un glob que no coincide con nada rastreado, pero que *sí* coincidiría con un archivo que está en
disco, no es un glob malo — es un archivo que nadie agregó. En un árbol de trabajo
`verify` dice cuál de los dos casos es, y nunca reescribe el glob por eso:

```txt
  vacuous   INV-06 [present] .multivac/invariants.md:9 · file exists but is untracked — `git add src/loyalty.ts` · reported only — "present" is not in blocking: and this run is not --strict
```

Un hermano leído en su ref de canal no tiene lado sin rastrear, así que ahí la línea
solo dice que corrijas el glob, como lo hace `INV-05` arriba.

Una afirmación que un cambio abierto declara se retiene como pendiente: no bloquea, y el
resumen dice quién la retiene — el exit 0 es la gracia, el silencio no:

```txt
0 blocking broken · exit 0
  1 claim held pending by open change points-expire — not gating; close or delete the change to unmask them
```

**Un cambio terminado no es un cambio pendiente.** Esa gracia es para el trabajo aún no
escrito, así que termina donde eso deja de ser cierto: un cambio que declara al menos
una afirmación, cuyas afirmaciones declaradas se resuelven **todas** y cuyos repos declarados
están **todos** registrados como `landed`, está terminado — no queda nada salvo `close`,
y hasta que alguien lo ejecute cada afirmación que retiene sigue sin hacerse cumplir. `--strict`
rechaza la ejecución y nombra el slug:

```txt
  finished  points-expire — every declared claim resolves and every declared repo is landed (3 claims whose failure this run would not gate); finished, not pending — close it: multivac change close points-expire · blocking

1 blocking broken · exit 1 · 1 finished change unclosed
```

Cuando `close` aún rechazaría el cambio por lo que citan sus afirmaciones — una afirmación
cuya fila aún no enuncia ninguna regla, una afirmación anclada solo en su archivo de cambio — la
línea nunca te manda hacia allá: nombra la primera línea por la que close rechaza, y cuántas
más, antes del comando. Los conteos y la salida son los mismos:

```txt
  finished  points-expire — every declared claim resolves and every declared repo is landed (1 claim whose failure this run would not gate); finished, not pending — close refuses until: INV-02: its row states no rule yet — the row is the only place the rule is stated; state it in .multivac/invariants.md — then: multivac change close points-expire · blocking
```

La línea lee solo este checkout: un brain detrás de su canal se nombra en la
línea de lectura, y el pull le corresponde decirlo a `land` y a `close`.

Una ejecución por defecto imprime la misma línea, terminada en `· reported only — this run is not
--strict`, y sale con 0: un hook de pre-commit no es
el lugar donde te mandan a ejecutar otro comando. Un cambio que no declara afirmaciones
nunca está terminado — un universal sobre la nada es verdadero para un cambio recién
creado — y una ejecución con alcance de consumidor, con `--repo` o sin él, no llega a ningún veredicto,
porque leyó un subconjunto de los tramos.
### El código aterriza en un cambio {#code-lands-in-a-change}

Cuando un SDD gobierna un repo declarado y `sdd_auto` está activado, el código llega a ese repo
solo por la rama de un cambio abierto que lo declara. «Código» es toda ruta
fuera de lo que pertenece a multivac, a una puerta o a un SDD: `.multivac/**`, los archivos de puerta,
los directorios `.claude/` y `.cursor/` completos, el directorio de instalación de cada
SDD conocido (`.specify/` y `openspec/`, documento de proyecto incluido),
`.gitignore`, `.gitmodules`, el montaje y `.husky/`, los directorios que escribe el init de un
SDD conocido para las puertas que declara el brain (`.agents/`, `.gemini/`,
`.opencode/`, `.devin/`, `.github/prompts/`, `.github/skills/`), las entradas propias
del proveedor por nombre (`openspec-*`, `.openspec-*`, `opsx`, `opsx-*`) uno o dos
niveles bajo cualquiera de esos directorios, declarado o no, o bajo `.codex/` —
y toda ruta que las herramientas de grafo de código que configuró un release anterior escribieron allí, de modo que
quitarlas hace commit en cualquier rama. Todo eso rige en todos los repos. El
`specs/` de spec-kit, donde van los artefactos de sus pasos, queda exento solo en un brain que declara
spec-kit: en un repo de código es código.

`verify` pregunta en tres momentos:

- **Commit.** Las rutas en staging, contra la rama activa.
- **Merge local.** El `pre-merge-commit` del shim ejecuta el mismo verify, y la
  rama es la ref que se fusiona: git no ha escrito `MERGE_HEAD` dentro de ese
  hook, así que se lee del `merge <ref>` que git exporta como `GIT_REFLOG_ACTION`.
- **CI.** `--range <base>..<head> --branch <name>` juzga los commits que no son merge
  del rango, de modo que un commit hecho con `--no-verify` igual se detecta.

```txt
  code      2 code paths (src/points.ts, src/expire.ts) lands in open change points-expire
  code      1 code path (src/points.ts) on main, which is no open change declaring api — start a change (`multivac change new <slug>`, then `change apply`) and commit on its branch · blocking
```

Una rama `close-<slug>` se lee donde el cambio que archiva sigue abierto.
En un rango, una rama que cerró su propio cambio se lee desde el archivo: el
cambio está archivado en el head y no en la base, así que estuvo abierto dentro del
rango.
Un checkout consumidor lee el brain a través de su montaje, que puede ir por detrás
del cambio: allí una rama que no es un cambio abierto se rechaza solo con `--strict`,
mientras que una rama cuyo cambio abierto no declara el repo se rechaza en cualquier
ejecución. El worktree de cambio de un consumidor lee el brain mismo, así que su línea `code`
bloquea como en un checkout del brain. Un rango cuya base no está en el clon no se
responde, y se rechaza con `--strict`.

El job del merge request que hace esto vinculante, para GitLab:

```yaml
verify-mr:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
  variables:
    GIT_DEPTH: 0
  script:
    - mvac verify --strict --range "$CI_MERGE_REQUEST_DIFF_BASE_SHA..$CI_COMMIT_SHA" --branch "$CI_MERGE_REQUEST_SOURCE_BRANCH_NAME"
```

Solo vincula cuando el pipeline debe pasar obligatoriamente y nadie puede hacer push a
la rama por defecto. Esos son ajustes del forge, y `doctor` lo dice, porque
no se pueden leer del disco. La verificación prueba que el código pasó por la rama de
un cambio. Nunca prueba que el cambio trate sobre ese código.

`--no-sdd` en `plan`, `apply` o `close` queda registrado en el archivo del cambio como
`sdd_skipped`, y `close` lo imprime.

### La matriz de salida {#the-exit-matrix}

| resultado | por defecto | `--strict` |
| --- | --- | --- |
| tramo roto o vacuo en un modo bloqueante (por defecto `absent`, `count`, `each`) | **1** | **1** |
| tramo roto o vacuo en un modo no bloqueante (por defecto `present`, `unique`) | se informa, **0** | **1** |
| `moved` — autocorregido | **0** | **0** |
| `unevaluated` — repo no está en disco | **0** | **0** |
| un tramo que pertenece a una fila `proposed` | **0** | **0** |
| un tramo que pertenece a una fila `drift` — hallazgo registrado | **0** | **0** |
| una afirmación que declara un cambio abierto (`pending`) | **0** | **0** |
| un cambio **terminado** — toda afirmación declarada se resuelve, todo repo declarado aterrizó | se informa, **0** | **1** |
| error de análisis del ancla, en cualquier fila — incluida una `proposed` | **1** | **1** |
| `enact` rechazado — una fila que llega a `active` junto al código que ancla | **1** | **1** |
| `law` rechazado — se eliminó el archivo de la ley, o se borró una fila que estaba `active` o `retired` | **1** | **1** |
| `config` editado sin ningún cambio abierto (ejecución con alcance de brain) | **1** | **1** |
| `code` en una rama que no es un cambio abierto que declare el repo, en un checkout del brain o en un worktree de cambio de un consumidor | **1** | **1** |
| `code` en una rama cuyo cambio abierto no declara el repo, en un checkout consumidor | **1** | **1** |
| `code` en una rama que no es un cambio abierto en el brain montado, en un checkout consumidor | **0** | **1** |
| un rechazo de SDD de un brain montado, en un checkout consumidor | **0** | **1** |
| pin desactualizado, `staleness: report` | **0** | **0** |
| pin desactualizado, `staleness: block`, atrasado por un número contado de commits (ejecución con alcance de brain) | **1** | **1** |
| config inválida o ausente | **2** | **2** |

El modo del ancla decide si un *tramo* bloquea. Las líneas `enact`, `law`, `config`
y `code` bloquean sin importar lo que digan los modos: las tres primeras bloquean solo en una
ejecución con alcance de brain, y `code` solo donde `sdd_auto` está activado y un SDD gobierna el
repo, lo que en un checkout del brain significa que el brain es a su vez un repo declarado. El
conjunto bloqueante es la clave `blocking:`, por defecto `[absent, count, each]`. Ampliarlo
está permitido; quitar `absent` se rechaza.

### Autocorrección {#self-healing}

Un tramo `present` cuyo glob ya no coincide, pero cuyo contenido se encuentra en
exactamente otro archivo del mismo tipo —la extensión final del propio include, nunca dentro de `.multivac/`— es un renombrado, no una afirmación rota. Un archivo
de otro tipo nunca es un destino; solo se nombra cuando ningún archivo del tipo correcto
tiene el contenido. `verify` reescribe el glob:

```txt
$ mvac verify --check
  moved     INV-01 [present] .multivac/invariants.md:6 · match moved to src/loyalty.ts — rerun without --check to rewrite the glob

$ mvac verify
  moved     INV-01 [present] .multivac/invariants.md:6 · glob rewritten to src/loyalty.ts — review the diff
```

La línea del ancla en `invariants.md` ahora dice `api:src/loyalty.ts`.
Revísala como cualquier otro diff.

### De dónde toma su raíz una ejecución {#where-a-run-roots}

`verify` responde por el checkout que contiene el directorio desde el que se le consulta —
`[dir]`, o el directorio de trabajo— y resuelve esa raíz antes de leer cualquier
config. Desde cualquier directorio de un checkout, el veredicto y el informe son los
de la raíz. En orden:

1. **Un brain** — el `.multivac/config.yml` más cercano desde el directorio hacia arriba hasta
   su toplevel de git. Un subdirectorio de un brain, un worktree de cambio del brain y
   el montaje de un consumidor son todos brains, juzgados con alcance de brain con todas las compuertas del brain.
2. **Un worktree de cambio de un consumidor** — un toplevel en
   `<brain>/.multivac/worktrees/<slug>/<key>` (más abajo).
3. **Un consumidor a través de su montaje** — el directorio más cercano bajo el
   toplevel cuyo brain hijo lo nombra con su propio `mount:` (un
   subproyecto de monorepo que contiene su propio `.brain`); si no, el montaje del toplevel, `.brain`
   sin más o un único brain hijo; si no, la única ruta de `.gitmodules` bajo el
   primer nivel cuyo brain la nombra (`mount: docs/brain`); si no, el brain hijo propio
   del directorio.
4. **Un pin desactualizado**, en el directorio y luego en el toplevel; luego **una puerta**
   sin brain al alcance (más abajo).

Al toplevel se le consulta sin los punteros de repositorio ambientales de git (`GIT_DIR`,
`GIT_INDEX_FILE` y afines), de modo que un `GIT_DIR` heredado nunca
responde por otro repositorio. Un informe impreso
lejos de su raíz nombra la raíz en una línea tras su encabezado, porque
las rutas y los comandos que contiene son relativos a esa raíz. Una ruta simbólica a la
raíz es la raíz:

```txt
$ cd src && mvac verify
12 claims · 12 anchored (100%)
  root      /home/you/brain (asked from src)
  read      brain: working tree on main @ abc1234 — the brain's own repo, the commit this run gates
…
```

Un worktree de cambio del brain lee cada hermano en el worktree propio del cambio para
él, `<brain>/.multivac/worktrees/<slug>/<key>`, cuando existe —se encuentra por clave,
sea cual sea la ruta que declare el brain—; si no, donde lo lee el checkout principal. Un
hermano ausente de ambas formas dice `` run `multivac repos sync` in <main checkout> ``,
nunca en el worktree. Dentro del montaje de un consumidor, un hermano ausente nombra el host
una vez y nunca aconseja `repos sync`, que escrito allí clonaría el
ecosistema dentro del consumidor:

```txt
  read      web: not on disk beside this mount — nothing read; verify in /home/you/api for its verdict, or from a brain checkout
```

Donde nada gobierna el directorio, no se recorre nada y ningún consejo nombra
otro directorio; cada uno de estos sale con 2:

```txt
/home/you/work is in no git repository — nothing was verified; the brain at /home/you/work/brain verifies from there
/home/you/notes is inside /home/you, which no brain governs — nothing was verified
/home/you/api/vendor/lib is a submodule of /home/you/api, which multivac verifies from there — nothing was verified here
git rev-parse --show-toplevel failed in /home/you/api: fatal: detected dubious ownership in repository at '/home/you/api'
```

Los comandos que no se enraízan solos —`seed`, `change` y `repos`—
rechazan un `.multivac/config.yml` ausente bajo un brain nombrando el brain cuyo
checkout contiene el directorio, en lugar de aconsejar un `init` que crearía
un segundo brain dentro de él:

```txt
$ cd src && mvac change new points-expire "Points expire"
no .multivac/config.yml in /home/you/brain/src — it is inside the brain at /home/you/brain; run this there
```

### Desde un repo consumidor {#from-a-consumer-repo}

`verify` ejecutado en cualquier parte del checkout de un repo de código, sin `.multivac/config.yml`
entre el directorio y el toplevel, encuentra el brain montado en él —`.brain`
gana sin más— y se limita a las anclas de ese repo más las anclas `*`; desde
un subdirectorio el informe agrega su línea `root`:

```txt
$ cd ../api && mvac verify
scoped to repo "api" · brain at /home/you/api/.brain
3 of 4 brain claims anchor into "api"
  read      api: working tree on wip/refactor @ 4d5e6f7 — this checkout, the content about to be committed here

  ok          3
  enact     not answered — .multivac/invariants.md is not in this checkout's index; … is decided in the brain

0 blocking broken · exit 0
```

Un brain montado cuya config el propio brain rechazaría —una declaración de SDD
que no se resuelve en ninguna raíz, véase [`sdd`](../configuration#sdd)— no detiene
esta ejecución. El montaje puede ir por detrás de su brain, y la config es de su dueño para corregirla, así que
`verify` imprime el rechazo en una línea y bloquea por él solo con `--strict`;
`count` imprime la misma línea y cuenta:

```txt
  sdd       repos.web.sdd: opsx — REFUSED: the SDD lives in the brain alone, … — in the mounted brain's config; its owner fixes it
```

La clave del repo se resuelve comparando la ruta de la entrada, su `url` con
`origin`, o el nombre base del directorio. La ambigüedad es un error que dice qué
pasar; `--repo <key>` la anula. El modo consumidor nunca reescribe un
glob movido —el montaje suele ser un submódulo fijado, así que la corrección corresponde al
checkout del brain.

```txt
$ mvac verify --repo nope
--repo "nope" is not declared in the brain's config — declared: api, payments
```

Un worktree de cambio se encuentra primero por su ruta. `change apply` pone el
worktree de un repo hermano en `<brain>/.multivac/worktrees/<slug>/<key>`, y el
montaje del brain dentro de él es un submódulo que nadie inicializó. Así que en ese checkout,
desde cualquier directorio suyo, `verify` toma el brain, el cambio y la clave de la
ruta de su toplevel, y lee el brain mismo, que no va por detrás
como puede hacerlo un pin:

```txt
$ cd ~/eco/brain/.multivac/worktrees/points-expire/api && mvac verify
scoped to repo "api" · brain at /home/you/eco/brain (the change worktree for points-expire)
```

Un montaje que está presente pero **no** es un brain —un `.brain`/`.knowledge`
vacío cuyo submódulo nunca se inicializó, o un pin anterior a la migración del brain a
`.multivac/`— es un pin desactualizado, no un repo que necesite `init`. `verify`
lo dice, y nunca aconseja `init` (que crearía un segundo brain junto al
montaje). Sale con **2**, un error de entorno: el hook que ejecuta `verify`
rechaza el commit hasta que se actualice el submódulo o se corrija el pin. Solo esos
dos nombres se reconocen, porque el `mount:` del propio brain vive en la config
que el montaje desactualizado no puede proporcionar: con otro nombre la ejecución responde como si no
hubiera montaje, con la pista de `init` incluida.

```txt
$ cd ../api && mvac verify
.knowledge is mounted but is not a multivac brain — its pin predates the brain, or points at the wrong commit. Update the submodule (git submodule update --remote .knowledge) or fix the pin.
```

Un repo sin ningún montaje al alcance se divide en dos casos.

**Si multivac puso hooks allí** —`doors` lo hizo, y el brain nunca se montó—
no hay ley contra la cual comprobar el commit. `verify` dice que no se comprobó nada,
nombra la solución y sale con **0**, de modo que los commits del repo no queden bloqueados por hooks
que no pueden funcionar:

```txt
$ cd ../api && mvac verify
/home/you/api was NOT verified — it carries a multivac door but no brain is mounted here. Nothing in this checkout was checked against any law. Fix: run `multivac repos sync` in the brain, then commit the mount here.
```

Es lo mismo que ya hacen los hooks en una máquina donde multivac no está
instalado: advertir en voz alta y dejar pasar el commit. Se reconoce por la línea de
encabezado del script de hook que escribió multivac, así que un hook propio en
`.multivac/hooks/` no cuenta.

**En cualquier otro caso** —un repo que multivac nunca tocó— su toplevel recibe la
pista `run multivac init .`, y sale con 2; a un directorio bajo él se le dice que ningún
brain lo gobierna, y a un submódulo de un repositorio gobernado se le dice cuál
lo verifica (véase [Dónde se enraíza una ejecución](#where-a-run-roots)).

### Obsolescencia del pin {#pin-staleness}

Si se declara un `channel`, un `verify` con alcance de brain compara el gitlink
del montaje del brain de cada consumidor contra él —sin conexión, desde refs que ya están en el checkout
del brain. Una ejecución con alcance de consumidor nunca lo hace:

```txt
  stale     api: pin 12 behind origin/main · last fetch 3d ago — git -C ../api submodule update --remote .brain
```

Con `staleness: block` la misma línea gana `blocking (staleness: block);`
y sale con 1. Sin conexión nunca adivina y nunca bloquea: una ref del canal que no
se resuelve localmente no imprime nada con el `report` por defecto, y con `block`
una línea `stale?` que solo informa. Un pin cuyo commit el checkout del brain
no tiene se imprime como `pin ? behind` y tampoco bloquea nunca; un pin **adelantado**
respecto del canal, en un commit que el checkout sí tiene, no está desactualizado.

## `count '<repo>:<glob> [!<glob> ...] /<regex>/[i] [each|each!]' [dir]` {#count-repoglob-glob--regexi-eacheach-dir}

El ensayo del ratchet: evalúa un tramo de ancla —misma gramática, mismo dialecto POSIX-ERE,
mismos globs de picomatch, **el mismo analizador y comparador que ejecuta verify**,
nunca una reimplementación— e imprime el desglose por archivo más el total que vería un
tramo `count=N`. Los conteos de `git grep` hechos a mano difieren del comparador real
(dialecto, conjunto de globs, SQL por sentencia), así que fija lo que dice `count`, no lo que dijo
grep.

```txt
$ mvac count 'api:db/migrations/*.sql /balance/'
  read      api: origin/main @ 1a2b3c4 — the channel, as published (last fetch 2h ago)
  db/migrations/0001.sql  1
  db/migrations/0002.sql  1
2 matches in 2 tracked files — a ratchet pins count=2
for a rule that must hold in every file, use `each`; to forbid a pattern everywhere, `each!` — see `mvac help anchor`
```

Los mismos bytes también, no solo el mismo analizador: `count` resuelve los repos que lee
mediante la función que usa `verify`, así que un hermano se lee en su ref del canal y
el brain en su working tree, e imprime la misma línea `read` por
repo. Se enraíza igual también, desde cualquier directorio de un checkout: en un
consumidor, o en el worktree de cambio de un consumidor, su propia clave se lee como el
working tree del checkout, en la oración que `verify` imprime allí, y un repo
con una puerta pero sin brain al alcance no tiene contra qué contar, salida 2. Antes construía sus propios handles sin ref, así que leía working
trees mientras la compuerta leía canales, y un número fijado desde él podía discrepar
del número que bloquea, sin nada en pantalla que explicara la diferencia.

Solo ensayo: no escribe nada, sale con 0 incluso con cero coincidencias. Una especificación mal formada,
un atajo PCRE, una clave de repo desconocida, o un repo que está declarado pero no está en
disco (la respuesta nombra `repos sync`) es salida 2. Entrecomilla la
especificación: es un solo argumento. `*` como clave del repo cuenta en todos los repos
declarados más el brain, con cada archivo prefijado con su clave de repo.

El resumen de `count=N` termina con una línea que te apunta al universal que no
puede expresar: una regla que debe cumplirse en cada archivo es `each`, y prohibir
un patrón en todas partes es `each!` (`see mvac help anchor`). `count=N` es un
ratchet de borrado —detecta la eliminación de una coincidencia existente, nunca un archivo
**nuevo** que omita el patrón—, así que una propiedad «ningún archivo puede contener X» o «todo archivo
debe contener X» pertenece a `each`/`each!`, no a un conteo fijado.

```txt
$ mvac count 'api:k8s/*.yaml /limits:/'
  read      api: origin/main @ 1a2b3c4 — the channel, as published (last fetch 2h ago)
  k8s/api.yaml  1
  k8s/db.yaml  1
2 matches in 2 tracked files — a ratchet pins count=2
for a rule that must hold in every file, use `each`; to forbid a pattern everywhere, `each!` — see `mvac help anchor`
```

Con un `each` o `each!` al final, el tramo es el universal por archivo, y el
desglose cambia en consecuencia: se listan **todos** los archivos que el glob coincide
—incluidos los archivos con cero coincidencias en los que el universal fallaría— y el resumen
nombra el lado que falla (`3 of 5 tracked files match — each would fail on 2
files (the ones without a match)`; for `each!`, los que **sí** tienen una coincidencia).
No hay línea de ratchet: `each` no tiene un conteo que fijar. Cualquier otro modo final
se analiza y se ignora: `count` distingue `each` del resto y nada más.
## `doors` {#doors}

Recibe una sola flag, `--adopt`, y RECHAZA cualquier otra con código de salida 2: nada después de
`doors` se ignora.

| flag | efecto |
| --- | --- |
| `--adopt` | vuelve a proyectar **y** registra en `.multivac/projected.yml` la versión que lo hizo, que es lo que borra el aviso de que el binario y las proyecciones han derivado. `doors` a secas vuelve a proyectar y deja el registro intacto, a propósito: la gente ejecuta `doors` después de editar `doors:` o `sdd:`, y volver a sellar ahí haría desaparecer el aviso por una razón ajena a la actualización. |

```txt
$ mvac doors
brain: door + hooks updated
brain: .multivac/flow.md — what your declarations oblige, sorted; generated, binds nothing
api: door + hooks updated
api: notice: CLAUDE.md exists as a regular file — merge it into AGENTS.md and remove it to get the symlink
payments: notice: not found at ../payments — run `multivac repos sync` to clone it
ledger: not managed, read-only — nothing projected …
mounts     api: no brain mount at .brain — unverified there until `multivac repos sync`
```

Ejecutado desde un subdirectorio, `doors` proyecta el brain que lo contiene y lo dice
primero, `root: <brain> (asked from <dir>)`.

Para el brain y cada repo declarado que esté en disco: escribe el bloque gestionado en
`AGENTS.md`, proyecta cada destino de puerta declarado, instala la configuración de skill y de
hook del harness donde el destino la declara, y escribe los shims de los hooks de git con
`core.hooksPath` apuntando a ellos — o, donde el repo ya tiene un directorio de hooks
propio, dentro de ese directorio y sin tocar `core.hooksPath`.

Un repo de solo lectura — declarado `managed: false`, o un clon superficial — no recibe nada de
eso, y una línea lo dice. Una puerta o unos hooks proyectados ahí antes de que pasara a ser
de solo lectura se dejan donde están. Los repos que no están en disco se reportan y se omiten, con código de salida 0.
`doors` escribe working trees — nunca hace commit, nunca clona. Una configuración inválida
sale con **1** aquí (no con 2).

**Retira lo que escribió una release anterior, y solo eso.** Un hook posterior a la edición
que refrescaba un grafo de código, que una versión anterior de multivac escribió en un
`.claude/settings.json`, se elimina — ese hook solo, y una entrada que quede
vacía, nunca un hook que no escribió — y también el archivo de relaciones generado del brain,
que ya nada lee. Cada uno se informa una sola vez, y una segunda
ejecución no informa ninguno:

```txt
brain: notice: .claude/settings.json: removed 1 post-edit graph refresh hook an earlier multivac wrote — multivac keeps no code graph
brain: <relations file> removed — multivac no longer renders it; commit the removal
```

`doors --adopt` también imprime `brain: adopted <version> — recorded in
.multivac/projected.yml`.

Haz commit de la eliminación. Lo que escribió la instalación propia de un proveedor — su directorio de salida,
skills, sección de la puerta y hooks — se queda hasta que lo retires: `doctor` lo nombra
junto con la eliminación, y la puerta advierte donde sus skills o hooks aún envían a un
agente a un grafo que nada refresca.

Los hooks que instala leen la ley a través del montaje del brain, y `doors` nunca
crea ese montaje — no toca la red. La línea `mounts` nombra cada
repo que recibió hooks pero no tiene un montaje desde el cual leer; ejecuta
`multivac repos sync` para corregirlos. Detalle por destino:
[Integraciones con agentes](../integrations).

### `.multivac/flow.md` — lo que obligan tus declaraciones {#multivacflowmd--what-your-declarations-oblige}

`doors` escribe una página que ordena las obligaciones de este ecosistema en tres grupos:

- **Automático** — multivac lo hace, no tienes que pedirlo
- **Compuerta** — multivac rechaza sin ello
- **Tuyo** — nadie puede comprobarlo

Cada fila se *renderiza* a partir del registro de adaptadores y de tu configuración — los mismos
datos que leen las compuertas — por lo que no puede describir un comportamiento que la herramienta no tiene. Una
fila de compuerta comienza con el comando que rechaza y nombra el artefacto; un paso
imposible de probar lleva la razón del propio adaptador, textual, porque una paráfrasis
envejecería junto a su fuente.

**No cita ningún identificador de invariante.** Los ids se asignan desde la tabla propia de cada brain,
así que uno generado aquí nombraría una regla distinta, o ninguna, en cualquier otro
ecosistema.

Es **derivado**: se reescribe completo en cada proyección, a través del bloque
gestionado, así que lo que escribas fuera de los marcadores sobrevive. El ritual es lo
opuesto — escrito a mano, y nunca sobrescrito.

**No obliga a nada**, y lo dice en su propio encabezado. La ley obliga; esto
describe lo que la ley y tus adaptadores declarados ya hacen, para un lector que no
ha leído la tabla.

## `doctor [--strict]` {#doctor---strict}

Diagnóstico de solo lectura. Nunca modifica, nunca clona. Desde un subdirectorio
reporta el brain que lo contiene y lo nombra primero, `root      <brain> (asked
from <dir>)`; desde un worktree de cambio del brain, cada repo hermano es el que tiene el worktree
del propio cambio o el checkout principal, y el consejo de clonado de uno que falta nombra
el checkout principal.

```txt
$ mvac doctor
doors      agents: AGENTS.md ok · claude: CLAUDE.md ok (symlink) · cursor: AGENTS.md ok (read natively)
repos      2/3 cloned · brain: brain==code (this repo) · payments missing → `multivac repos sync` (git clone git@example.com:acme/payments.git ../payments)
branches   brain: on main @ abc1234 — brain==code, verify reads this working tree; 2 behind its own channel origin/main @ def5678 → git -C . pull · api: on wip/refactor @ 4d5e6f7 — OFF channel origin/main @ 1a2b3c4; verify reads the channel, not this tree · payments: not cloned
pins       api: no brain mount at .brain — run `multivac repos sync` to add it · payments: not cloned
hooks      core.hooksPath ok · pre-commit installed · pre-push installed · active (mvac on PATH)
enact      who enacts is not a fact on disk — multivac never fabricates git identity …, so an agent commits as the person … UNGATEABLE by design …, not an oversight; enforcement is the forge's merge button
law        118 anchors parse
untracked  nothing build-critical untracked
```

| línea | reporta |
| --- | --- |
| `doors` | una entrada por cada destino declarado: archivo presente, symlink correcto, bloque gestionado presente |
| `sdd` | el SDD del brain, que no corre en ningún otro lugar: el estado de la herramienta — installed, missing, partial o unevaluable, con la razón, leído de su propio archivo de estado — binario, si `sdd_auto` está activo. Cuando se declara un repo de código y `sdd_auto` está activo, una línea nombra los repos cuyo código gobierna y los exentos por `sdd: none`. Un repo de código escribible que aún conserva una instalación de cualquier SDD conocido de una release anterior recibe una línea `leftover` — su archivo de estado, si `HEAD` lo rastrea, y la eliminación — y nunca hace fallar a `doctor`. En un brain OpenSpec, los cuerpos de comandos que dejó allí un init anterior se nombran en una línea después de la línea de instalación, con el `git rm -r` que elimina los rastreados y los no rastreados que hay que borrar, y nunca hacen fallar a `doctor` (consulta [Cuerpos de comandos que dejó un init anterior](../sdd#command-bodies-an-earlier-init-left)). Un preset de spec-kit habilitado que las plantillas base de multivac superan se nombra, con la sobrescritura que hay que borrar. Luego: una línea `flow —` por cada paso de su propio flujo, cada una con el artefacto que lo prueba (o la razón de que nada pueda), una línea `gates —` que nombra qué comandos del ciclo de vida rechazan y por qué — o `not gated` bajo `sdd_auto: false` — y `project law @ brain:` para su documento a nivel de proyecto — faltante, con el comando que lo escribe, o presente con su fecha frente a la fila más reciente de la ley (STALE cuando la ley se movió y él no). **Se omite por completo cuando el brain no resuelve ningún `sdd`**: la instalación propia de un repo de código de una herramienta que el brain no declara en ninguna parte es de ese equipo, no un residuo |
| `config` | una configuración que no carga, con código de salida 1 (más abajo); y, en una configuración escrita por una release anterior, las claves de grafo de código que aún declara — cargan y se ignoran — con cómo borrarlas, un cambio abierto. Esa línea nunca hace fallar a `doctor` |
| `leftover` | lo que dejó la configuración de grafo de código de una release anterior, en cada raíz donde multivac puede escribir: el archivo de relaciones generado del brain y cada hook de refresco posterior a la edición que escribió en un `.claude/settings.json`, ambos eliminados por `doors`; y cada instalación de proveedor que encuentra allí — su directorio de salida, rastreado, no rastreado o local, su archivo de ignorados, las plataformas en las que se instalaron sus skills y hooks, y una copia de respaldo previa a la instalación — con la desinstalación propia del proveedor por plataforma, las rutas por borrar y las líneas por quitar de `.gitignore`, y luego commit. Se lee solo de archivos: no ejecuta ningún proveedor, nunca hace fallar a `doctor`, y no dice nada de un repo de solo lectura |
| `repos` | cuántos están presentes, el comando de clonado para cada uno que no lo está, y `<key>: not managed, read-only` o `<key>: shallow, read-only` para cada repo donde multivac no puede escribir |
| `branches` | la rama en la que está cada repo y su sha, y si esa rama **es** su canal — `= channel …`, `OFF channel … @ <sha>` (verify lee el canal, no ese árbol), o un canal que no se resuelve allí en absoluto (verify recurre al working tree). La entrada brain==code dice cuánto está **atrás** de su propio canal, si lo está — una ley desactualizada que juzga un ecosistema actual es la única obsolescencia que la lectura del canal no puede detectar. La línea que explica un resultado de `verify` de un vistazo |
| `pins` | el montaje del brain en cada consumidor, y cuánto está atrás de su canal. Un montaje que está en el índice y aún sin commit lo dice, en vez de llamarse faltante. Un repo de solo lectura reporta `<key>: not managed, read-only — no mount expected` (o `shallow`), ya que toda corrección ahí es una escritura |
| `hooks` | `core.hooksPath`, los shims de commit y push, la coexistencia con los hooks propios del repo (encadenados / en paralelo / sin conectar), y si algo puede realmente ejecutarlos |
| `forge` | se imprime cuando se declara un SDD y `sdd_auto` está activo: el código aterriza en un cambio solo donde el forge exige que el pipeline del merge request ejecute `verify --strict --range … --branch …` y nadie pueda hacer push a la rama por defecto. Imposible de bloquear desde el disco — multivac no puede leer ninguno de los dos ajustes |
| `layout` | se imprime solo, con código de salida 1, cuando el brain aún tiene el layout anterior a `.multivac/`; `init` lo mueve |
| `enact` | se imprime en cada ejecución, y reporta una **ausencia**: quién promulga una fila no es un hecho en disco. multivac nunca fabrica una identidad de git, y un hook corre con los permisos de quien lo invoca, así que una compuerta instalada aquí es una que el mismo proceso puede saltarse. Imposible de bloquear por diseño y no por omisión — la imposición es el botón de merge del forge, en manos de una cuenta que el agente no tiene. La mitad que SÍ se comprueba — que la promulgación aterrice en su propio commit — es la línea `enact` de `verify`, leída del índice |
| `untracked` | rutas del brain que un `.gitignore` se traga (WARNING — la ley no puede publicarse), luego archivos no rastreados y no ignorados que parecen críticos para el build |

**Instalado no es imponer.** Los shims salen con 0 cuando nada en la máquina
puede ejecutar multivac, así que `doctor` dice qué ejecutor encontró — o que no
hay ninguno:

```txt
hooks      core.hooksPath ok · pre-commit installed · pre-push installed · INACTIVE — no runnable multivac, the shims verify nothing → install multivac (npm i -g multivac), or build it here (pnpm install && pnpm run build)
```

Un archivo que nombra un script de `package.json`, un archivo de configuración en la raíz de un repo, o una
ruta que cubre el glob de inclusión de un ancla — no rastreado y no ignorado — compila
aquí y se rompe en un clon nuevo. `doctor` los nombra y nunca bloquea por
ellos:

```txt
untracked  WARNING 2 build-critical files untracked — git add or ignore: tsconfig.json (brain, root config), src/loyalty.ts (api, anchor glob)
```

Peor que no rastreado es **ignorado**: una ruta del brain que un `.gitignore` se traga
nunca puede publicarse, mientras `git add` guarda silencio. Eso es un WARNING con la corrección:

```txt
untracked  WARNING 6 brain paths IGNORED by .gitignore — .multivac/config.yml, … — the law cannot ship; fix: run `multivac init .` (appends !.multivac/ negations to .gitignore) · nothing build-critical untracked
```

`doctor` a secas sale con 0 en todos los estados degradados anteriores excepto un `layout` antiguo; su
única otra salida con 1 es una configuración o ley que no carga — detectar una compuerta
desarmada depende de que una persona lea el reporte.

**`doctor --strict` convierte ese reporte en una aserción.** Agrega una
condición y por lo demás imprime lo mismo.
Sale con 1 cuando la compuerta de imposición está desarmada — falta un shim de commit o de push,
`core.hooksPath` no es el de multivac y no hay ningún shim encadenado en paralelo, o no hay
ningún multivac ejecutable y los shims no hacen nada. Esos dos shims son lo único que lee: un
shim `pre-merge-commit` faltante, el que ejecuta `verify` en un merge local,
lo deja en verde. Ejecútalo donde se esté configurando una máquina, o desde
un hook de inicio de sesión — falla en el momento en que el piso cae, en lugar de
quedarse callado mientras nada se impone:

```txt
$ git config --unset core.hooksPath && mvac doctor --strict; echo $?
…
hooks      core.hooksPath unset → git config core.hooksPath .multivac/hooks · pre-commit installed · pre-push installed · active (mvac on PATH)
…
strict     FAIL — the enforcement gate is not armed; a commit here is not verified (see hooks above)
1
```

Una configuración o ley inválida sigue saliendo con 1 en ambos — la línea `law` nombra las anclas
que no se interpretan, y `doctor` a secas sale con 1 por ellas:

```txt
$ mvac doctor; echo $?
…
law        invalid — 1 anchor do not parse: .multivac/invariants.md:5 — missing or malformed /regex/ — <!-- @anchor <CLAIM-ID> <repo>:<glob> …
…
1
```

`doctor` a secas nunca bloquea por una compuerta desarmada — solo la describe.

## `repos` / `repos sync [--shallow]` {#repos--repos-sync---shallow}

```txt
$ mvac repos
api          cloned   ../api
payments     missing  ../payments  (git@example.com:acme/payments.git)
ledger       cloned   ../ledger — not managed, read-only
scratch      invalid  ../scratch — ../scratch exists but is not a git repository
```

Un repo está `cloned` solo cuando su ruta es su propio repositorio git con un
commit y, donde se declara una `url`, un remoto que coincide con ella. Un directorio
simple, un directorio dentro de otro repositorio, un repositorio sin commits
y un clon de otro remoto son `invalid`, con lo que está mal. `repos check`,
`doctor` y `change` cuentan de la misma manera.

Un repo declarado `managed: false`, o cuyo clon es superficial, se marca como
de solo lectura: multivac lo lee, lo verifica y hace fetch, y nunca escribe allí.

`repos` y `repos list` son lo mismo. `repos sync` clona cada repo
declarado que falta y tiene una `url`, y hace fetch de cada ruta que ya está
en disco, incluida una `invalid`, sobre la cual nunca clona:

```txt
$ mvac repos sync
api: present at ../api — fetched
api: brain mounted at .brain
payments: cloned git@example.com:acme/payments.git -> ../payments
payments: mounted the brain at .brain — staged in ../payments, commit it there (multivac does not commit in your repos)
```

El fetch es lo que mantiene honesto a `verify`: una ejecución con alcance de brain lee cada repo hermano
en su ref de canal, y ese ref es una instantánea de seguimiento remoto **local** —
`verify` nunca toca la red, así que solo está tan fresco como el último
`repos sync`. La línea `stale?`, que se imprime bajo `staleness: block` cuando el
ref del canal es desconocido localmente, nombra este comando porque `sync` es lo que
lo obtiene. Un pin que está
atrás del canal nombra en cambio `git submodule update --remote`: `repos sync`
hace fetch y nunca mueve un pin, así que solo la actualización del submódulo borra esa línea.

`--shallow` agrega `--depth 1` — suficiente para máquinas que solo verifican, no para
`change`, que necesita crear ramas. Un clon superficial es de solo lectura hasta
`git fetch --unshallow`: nada se genera, compila ni proyecta allí, ninguna
compuerta lo juzga, y un cambio que lo nombre es rechazado. La línea del clon lo dice:

```txt
payments: cloned git@example.com:acme/payments.git -> ../payments (shallow) — read-only: multivac will not write there
```

Un clon que falla se nombra, nunca se reintenta en silencio, y sale con 1:

```txt
payments: auth failed cloning git@example.com:acme/payments.git — fix your ssh key/token for this host, then re-run `multivac repos sync` (no retry was attempted)
```

Un *fetch* que falla reporta y nunca bloquea — sin conexión, por ejemplo, aún deja un
ref utilizable aunque más antiguo, y la línea `read` de `verify` lleva su antigüedad. La línea da
la primera línea `fatal:` propia de git después de `could not fetch:` (su última línea de
stderr cuando no imprimió ningún `fatal:`), dice que el ref del canal queda como se obtuvo por última vez, y nombra el `git -C <path> fetch` que lo reintenta.

### `repos check` {#repos-check}

Responde una pregunta para cada repo declarado, sin conexión y sin ninguna herramienta de proveedor
instalada: ¿es el clon que declara la configuración y, donde multivac puede escribir,
está configurado?

```txt
$ mvac repos check
brain     ok   cloned · speckit installed and committed · .specify/memory/constitution.md written
api       ok   cloned; leftover speckit install (tracked)
payments  FAIL absent at ../payments → `multivac repos sync`
ledger    ok   cloned — not managed, read-only: its tools are not checked
```

Un repo pasa cuando su ruta existe, es un repositorio git propio (no una
carpeta dentro de otro), tiene un commit y tiene un remoto que coincide con su `url:`
si declara una. Donde multivac puede escribir, el brain además necesita:

- el SDD declarado instalado y su archivo de estado con commit,
- su documento de proyecto escrito (no faltante, vacío ni todavía la plantilla).

El SDD es solo del brain, así que a un repo de código nunca se le pide. Donde el
brain declara uno, un repo de código que aún conserva una instalación de una release
anterior recibe `; leftover <tool> install` en su línea, rastreada o no, y
pasa o falla exactamente como lo haría sin ello; `doctor` nombra la eliminación.

Un repo que no es tuyo se comprueba solo por su clon. Sale con 0 cuando todos los repos
pasan, con 1 cuando uno no pasa, con 2 para una configuración inválida.

En CI, `multivac repos sync --shallow && multivac repos check` no necesita ninguna herramienta de
proveedor una vez que la instalación del SDD del brain tiene commit: un clon superficial es de solo lectura, así que
solo se comprueba su clon.

`change plan` y `change apply` rechazan un repo que nombran cuyo directorio está
ahí pero no es ese clon, antes de que se clone, se cree una rama o se suba la versión de nada.

### El SDD del brain {#the-brains-sdd}

`repos sync` también instala el SDD declarado en el brain: el init propio de la herramienta,
donde nunca se ha ejecutado. El SDD no llega a ningún repo de código — sus specs se
escriben en el brain — y un brain donde está instalado no ejecuta nada, que es
la razón por la que `repos sync --shallow` en una máquina de CI no necesita ninguna herramienta de proveedor una vez que la instalación
tiene commit. Bajo `sdd_auto: false` no instala nada y no dice nada del
SDD, así que `repos check` sigue fallando por la instalación faltante hasta que ejecutes el
init propio de la herramienta en el brain tú mismo.

Una herramienta que ejecutaría y no encuentra se nombra con dónde conseguirla, y la ejecución
sale con 1.

Lo que escribe la herramienta se deja en el working tree del brain, sin commit.

### El montaje del brain {#the-brain-mount}

`repos sync` también se asegura de que cada repo que encuentra en disco tenga el brain montado,
porque los hooks que `doors` instala allí leen la ley a través de ese montaje. Es
una reconciliación, no un paso de configuración único: un repo que declaras hoy y un repo
que declaraste hace meses reciben la misma comprobación en cada ejecución, y lo que esté fuera
de línea se corrige.

```txt
$ mvac repos sync
api: present at ../api — fetched
api: brain mounted at .brain
payments: cloned git@example.com:acme/payments.git -> ../payments
payments: mounted the brain at .brain — staged in ../payments, commit it there (multivac does not commit in your repos)
web: present at ../web — fetched
web: filled the empty brain mount at .brain
```

| lo que encuentra | lo que hace |
| --- | --- |
| ningún gitlink en `mount` | agrega el brain como submódulo desde [`brain_url`](../configuration/#brain_url). Un directorio que ya es un clon del brain se adopta, sin descarga |
| un gitlink, pero el directorio está vacío | lo llena (`git submodule update --init`) — así se ve un consumidor clonado sin `--recurse-submodules` |
| un gitlink cuyo directorio tiene archivos pero no es un brain | nada; lo reporta. Es un pin más antiguo que el brain, o uno que alguien movió, y actualizarlo es decisión tuya |
| un gitlink en el índice y sin commit | nada; te dice que le hagas commit |
| un gitlink cuya url registrada no es `brain_url` | nada; reporta la diferencia y el `git submodule set-url` que la cambiaría. Un consumidor puede apuntar a un fork a propósito |
| un repo de solo lectura | nada; dice que no se espera ningún montaje allí |
| el brain mismo | nada |

**Nunca hace commit.** El montaje se deja en el índice de cada consumidor, para que
quien sea dueño de ese repo lo revise y haga commit.

**Necesita `brain_url`.** Sin ella no se hace ningún montaje, y la clave faltante se
nombra una sola vez. multivac no toma en su lugar el `origin` propio del brain — consulta
[`brain_url`](../configuration/#brain_url) para ver por qué.

Un montaje que git rechaza se reporta por causa, los demás repos igual se sincronizan, y la
ejecución sale con 1:

```txt
web: could not mount the brain at .brain — fatal: '.brain' already exists and is not a valid git repo
```

Un subcomando desconocido sale con 2:

```txt
unknown subcommand "pull" — usage: multivac repos [sync [--shallow] | check]
```
## `roadmap [add <slug> "<title>"] [--horizon now|next|later] | sync` {#roadmap-add-slug-title---horizon-nownextlater--sync}

Los cambios que aún no han empezado. Sin argumentos los lista; con `add`
registra uno.

```txt
$ mvac roadmap
roadmap: 2 planned
  now
    tracker-projects-the-roadmap — Issues and boards from the change files
  later
    ci-checks-every-repo — One CI job per declared repo
in flight: 1 open change — points-expire
```

Los horizontes se imprimen en el orden `now`, `next`, `later`, del más cercano al
más lejano. Los slugs se ordenan por codepoint dentro de un horizonte, nunca por
locale, porque eso haría que el orden del listado fuera una propiedad de la
máquina que lo imprimió. Un horizonte sin nada se omite en lugar de imprimirse
vacío. La línea `in flight:` cuenta los cambios abiertos por separado, para que
la intención nunca se confunda con el avance. Desde un subdirectorio lista el
brain que lo contiene, tras una línea que lo nombra: `root: <brain>
(asked from <dir>)`.

Un roadmap vacío lo dice y nombra el comando que lo llena:

```txt
roadmap: empty — record an intention with `multivac roadmap add <slug> "<title>"`
in flight: no open change
```

Un archivo de cambio que no se puede analizar es omitido por el listado en lugar
de hacerlo fallar: un archivo de cambio roto es un diagnóstico que debe levantar
`change`, y un roadmap que no se imprime porque una entrada está malformada es
peor que uno con una línea de menos.

### `add <slug> "<title>" [--horizon now|next|later]` {#add-slug-title---horizon-nownextlater}

Escribe `.multivac/changes/<slug>.md` en el estado `planned` y lo confirma con un
commit. Si git rechaza el commit, `add` imprime `could not commit the bookkeeping`
con el comando que debes ejecutar a mano, deja el archivo en staging y aun así
sale con **0**. No reserva ningún id de invariante, no crea ninguna rama ni
ningún worktree: el id se asigna cuando el cambio empieza, porque uno gastado en
un trabajo que nunca ocurre es un hueco en la tabla de la ley que ningún cambio
posterior puede llenar.

```txt
$ mvac roadmap add tracker-projects-the-roadmap "Issues and boards from the change files"
committed: roadmap: tracker-projects-the-roadmap planned (later)
recorded .multivac/changes/tracker-projects-the-roadmap.md — planned, horizon later
  no invariant id is reserved until it starts: multivac change new tracker-projects-the-roadmap
```

`--horizon` es `later` por defecto, así que nada se vuelve urgente por omisión.
Se aplica solo a `add`: el listado lo rechaza, y `sync` ignora un valor conocido.

Los rechazos nombran el estado encontrado y el comando que permite avanzar. Los
tres primeros salen con **1**; un horizonte desconocido sale con **2**, y también
`--horizon` en un listado, que muestra todos los horizontes:

```txt
<slug> is already planned — see it with `multivac roadmap`, or start it with `multivac change new <slug>`
<slug> is already open — it started; nothing to record
<slug> is already archived at .multivac/changes/archive/<slug>.md — this change is closed; start a new one with a new slug, or read it there
roadmap: unknown horizon "someday" — use now, next, later
roadmap: --horizon applies to `roadmap add` — the listing shows every horizon
```

`roadmap sync` proyecta el roadmap al `tracker` declarado. Si no hay ninguno
declarado, imprime `sync: no tracker declared` y las claves que hay que agregar,
y sale con **0**; un tracker que multivac no ha verificado sale con **1**.

Un brain cuyo SDD acepta un slug más estricto rechaza el resto con salida **2**,
sin registrar nada; para OpenSpec, donde la línea impresa también nombra el
release en el que se midió:

```txt
roadmap add: `Fix_Auth`: the brain's SDD takes no such slug — openspec … `new change` takes lowercase letters and digits in runs joined by single hyphens, and reserves `archive`
```

### `sync` {#sync}

Proyecta los archivos de cambio al tracker declarado. **En un solo sentido,
siempre**: los archivos de cambio son la fuente, y nada de lo que diga el tracker
llega jamás a ellos. Un título editado a mano lo restituye el siguiente sync, y
un issue cerrado a mano sigue cerrado: sync nunca reabre uno.

```txt
sync gitlab: 3 changes to project
  planned  tracker-projects-the-roadmap → #41 created
  open     the-consumer-door-carries-the-ecosystem → #42 up to date
  archived the-gate-runs-what-you-built → #40 closed
recorded 1 issue number in .multivac/changes/ — commit them: the number is the identity
```

El **número** registrado en el archivo de cambio es la identidad. Sobrevive a la
edición de un título —que es lo que rompe la alternativa de buscar en el tracker
un título coincidente— y es un número y no un enlace porque el proyecto sale del
remoto del repo.

Solo agrega una etiqueta, `multivac::planned` o `multivac::open` según el estado
del cambio, y no quita ninguna: las etiquetas que un equipo puso a mano
sobreviven, y también un estado que el cambio ya dejó atrás. Un triage borrado
basta para que una proyección se apague de forma permanente.

La ausencia de `glab` o `gh` **rechaza**: una proyección que no puede ejecutarse
no debe informar éxito. Una creación que la herramienta no logra —sin sesión
iniciada, sin remoto— se dice en la línea de ese cambio, `could not be created; nothing recorded`,
y la ejecución aun así sale con **0**. Un número registrado cuyo issue ya no
existe se informa, nunca se vuelve a crear en silencio.

Un issue por cambio. Los issues a nivel de historia son la intención declarada y
aún no están construidos: necesitan un segundo lector de la lista de tareas de la
herramienta SDD.

### El roadmap nunca es una compuerta {#the-roadmap-is-never-a-gate}

Ningún comando rechaza una operación porque su sujeto no se registró antes. No
hay ningún flag para exigirlo ni ninguna clave de configuración para activarlo:
exigir un plan es una intención imposible de verificar, la misma categoría a la
que pertenece el ritual, y la ley lleva un tramo `absent` sobre `src/`, de modo
que el rechazo no puede introducirse sin que `verify` falle.

Empezar un cambio planificado es [`change new`](#new), que promueve el archivo
que ya está ahí. Cada paso posterior rechaza uno que no ha empezado, después de
cualquier compuerta del SDD que ejecute primero: con un SDD declarado, `plan` y
`apply` rechazan por el artefacto faltante antes de llegar a esta línea:

```txt
<slug> is planned, not started — start it first: multivac change new <slug>
```

## `change <sub> <slug> [args]` {#change-sub-slug-args}

```txt
$ mvac change
multivac change <sub> <slug> [args]
  new "<title>"          scaffold .multivac/changes/<slug>.md + reserve the next invariant id (one commit)
  new <slug> "<title>"   same, with an explicit slug
  plan <slug>            resolve repos, landing graph, reserve declared ids, claims
  apply <slug>           worktree per repo (greenfield repos get created)
  land <slug>            landing-order report; --landed <repo> records a merge
  close <slug>           verify claims, archive the change, print .multivac/ritual.md
flags: --no-sdd (skip the SDD steps AND their gates), --landed <repo> (land only),
       --abandon (close only: drop a change that landed nothing, give its id back)
```

Exactamente tres flags, todos listados arriba. `change` lee el mismo rechazo
compartido que lee cualquier otro comando, así que un flag desconocido, un token
de un solo guion y un posicional sobrante salen todos con 2:

```txt
change: unknown flag "--force" — change takes <sub> <slug> ["<title>"], --no-sdd, --landed <repo>, --abandon
change: unexpected argument "api" — change takes <sub> <slug> ["<title>"], --no-sdd, --landed <repo>, --abandon
```

La segunda línea es `change land <slug> api`, que quería decir `--landed api`.
Antes salía con **0** sin haber registrado nada.

Un slug empieza con una letra o un dígito y continúa con letras, dígitos, puntos,
guiones o guiones bajos. `change new "points expire"` deriva `points-expire`. Un brain cuyo SDD acepta un slug más estricto rechaza el
resto antes de escribir nada, digan lo que digan `sdd_auto` y `--no-sdd`, ya que
el cambio sobrevive a ambos: `change new` con salida 1, `roadmap add` con salida
2. OpenSpec acepta letras minúsculas y dígitos en secuencias unidas por guiones
simples, y reserva `archive`; la línea impresa nombra el release de openspec en
el que se midió donde esta página escribe `…`, ya que las páginas del sitio no
llevan cadena de versión:

```txt
`Fix_Auth`: the brain's SDD takes no such slug — openspec … `new change` takes lowercase letters and digits in runs joined by single hyphens, and reserves `archive`; `multivac change new "<title>"` derives one
```

### `new` {#new}

Sobre un slug que `roadmap add` ya registró, `new` promueve ese archivo en lugar
de escribir un segundo y imprime `promoted … — planned since it was recorded,
now open`; el título se ignora. Sobre un slug ya archivado rechaza y sale con
**1**.

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

Una afirmación (*claim*) es el ID de su fila: la fila enuncia la regla, y el
archivo de cambio la cita. Una afirmación heredada `{ id, statement }` aún se
analiza y se reescribe sin cambios; nada crea una.

Rechaza sobrescribir un archivo de cambio existente (salida 1). También toma el
siguiente ID de invariante libre de la tabla de la ley y lo escribe de vuelta de
inmediato como una fila `proposed` que nombra este cambio: nunca elijas un ID a
mano. Una fila `proposed` nunca bloquea `verify`, y `close` libera la reserva si
el cambio nunca la usó; usada significa que la regla se enunció en lugar del
texto RESERVED del andamiaje, o que un ancla nombra el ID. Luego, si el brain
declara un `sdd` y `sdd_auto` está activo, dice dónde va el razonamiento del
cambio, imprime los pasos del SDD ligados al punto `new` —cada uno con el
artefacto por el que será verificado— y, una vez tras el último, la instrucción
de ejecutarlos de corrido:

```txt
sdd speckit: the why, the design and the tasks go into its files — the change body keeps what it held while planned, or one sentence, and `change close` cites the directory; do not cite it yourself
sdd speckit: run /speckit.specify in your agent to write the spec for points-expire — … [proof: specs/<n>-points-expire/spec.md — `change plan` refuses without it]
sdd speckit: run /speckit.clarify if the spec still carries [NEEDS CLARIFICATION] markers [ungateable: …]
sdd speckit: run the chain through without asking to continue — stop only for a question the tool itself raises (`--no-sdd` for one run, `sdd_auto: false` to stop printing these)
```

Antes de escribir nada, `new` rechaza, con salida 1, cuando el init propio de ese
SDD tendría que ejecutarse en el brain y la herramienta no se encuentra: cada
paso que imprime necesita esa herramienta. Nombra dónde conseguirla, y
`--no-sdd` la omite por una ejecución.

`plan`, `apply` y `close` **rechazan** mientras falten esos
artefactos; consulta
[herramientas SDD](/docs/reference/sdd/#the-gate-what-the-tool-really-produces).

La declaración del andamiaje y la fila reservada se registran como **un commit en
la rama actual** (mensaje `change open: <slug> — reserves <ID>`, o
`change promoted: <slug> — reserves <ID>` para uno planificado): el árbol
compartido se mantiene limpio, los pulls nunca se bloquean por ediciones del
ciclo de vida, y un `new` concurrente lee la tabla confirmada. Un árbol ya sucio
en las dos rutas de contabilidad se rechaza con el comando exacto que lo
desbloquea:

```txt
cannot open points-expire — bookkeeping paths are untracked or modified: .multivac/invariants.md
  commit them first: git -C /home/you/brain add -- .multivac/invariants.md && git commit
  then re-run: multivac change new points-expire "points expire"
```

#### Un brain por detrás de su canal {#a-brain-behind-its-channel}

`new` y `apply` informan de cualquier repo declarado cuyo pin esté por detrás de
su canal, antes del trabajo que hacen. `apply` ejecuta primero su compuerta del
SDD, y un rechazo ahí termina la ejecución antes del informe:

```txt
brain pins behind their channel — refresh before deciding against the law:
  stale     api: pin 3 behind origin/main · last fetch 6d ago — git -C ../api submodule update --remote .brain
```

**Informa y nunca rechaza**. Sin conexión, un pin por detrás de su canal
significa que alguien aterrizó trabajo *o* que nadie hizo fetch, y desde aquí no
se pueden distinguir; rechazar con la segunda lectura haría fracasar una mañana
corriente. `staleness: block` aún hace que
[`verify`](#verify-dir---strict---check---worktree---repo-key---range-basehead---branch-name---quiet)
salga con 1 exactamente donde siempre lo hizo.

La lectura es sin conexión, así que dice lo que se obtuvo por última vez, nunca
lo que existe en el remoto; por eso una línea `stale` lleva la antigüedad del
fetch, y por eso una ref de canal que no se resuelve localmente nunca se adivina:
no imprime nada bajo el `report` por defecto, y una sola línea `stale?` que solo
informa bajo `block`.

Se ejecuta antes del commit de contabilidad, así que el pin que nombra es con el
que llegaste y no uno que el comando acaba de crear.

### `plan` {#plan}

Resuelve lo que el cambio declaró: qué repos existen, qué se clona, qué se crea
greenfield, el grafo de aterrizaje, y qué invariantes y afirmaciones aún faltan.

```txt
$ mvac change plan points-expire
api: /home/you/api
payments: missing at /home/you/payments, no url — greenfield; `change apply points-expire` creates it
landing order:
  stage 1: api
  stage 2: payments
invariant INV-01: active
invariant INV-07: reserved — proposed row in .multivac/invariants.md; state the rule before close
claim INV-07: no anchor — add <!-- @anchor INV-07 <repo>:<glob> /<regex>/ --> before close
```

Un cambio que no declara repos sale con 1. Un repo no declarado en la
configuración se nombra y sale con 1. `plan` **sí** clona un repo que el cambio
nombra, que falta y tiene un `url`; uno declarado `managed: false` se rechaza
primero, y no se clona nada.

Lo que `close` rechazará sobre la declaración misma se dice aquí, donde es más
barato corregirlo, y no bloquea nada: una afirmación sin fila, de una fila corta,
de una fila retirada que el cambio no retira, de una fila que el cambio ni agrega,
ni toca ni retira, o de una fila que reservó otro cambio. Un enunciado de
afirmación heredado se nombra como una reformulación, y se conserva:

```txt
claim NOPE-1: no row in .multivac/invariants.md — a claim cites a row of the law; add the row, or drop the claim — close refuses this
claim INV-03: its statement: restates the row — kept as written; a claim is its ID, and the row states the rule (…)
```

Una fila que aún no enuncia ninguna regla es el estado normal de un cambio en
`plan`, y una fila que se retira se retira más tarde: `close` pregunta esas cosas,
`plan` no.

Un cambio puede nombrar `brain`. Donde ninguna entrada de `repos:` es el brain,
este no contiene código, y `plan` lo nombra como el brain:

```txt
brain: /home/you/brain (the brain)
```

Donde una entrada es el brain, la línea dice `(brain==code)` y el código del
brain aterriza a través del cambio como el de cualquier repo.

Con un SDD declarado en el brain, `plan` también bloquea según los artefactos del
punto `new`, y luego imprime los pasos del punto `plan`. Para spec-kit, primero
apunta `.specify/feature.json` al directorio de este slug —la herramienta guarda
un puntero por checkout, y dos cambios abiertos de lo contrario planificarían uno
dentro del otro— y lo dice cuando nombraba otro. Para un cambio que nombra un
repo de código dice dónde va el código —dicho de los pasos impresos en `plan`,
que se ejecutan en el checkout del brain antes de que `apply` lleve el directorio
del slug:

```txt
sdd speckit: .specify/feature.json named specs/002-beta; it names specs/001-points-expire now
sdd speckit: its steps run from the brain checkout, which holds no code of this change — tasks name code paths under .multivac/worktrees/<slug>/<repo>/, and code is written only there
```
### `apply` {#apply}

```txt
$ mvac change apply points-expire
committed: change apply: points-expire — status branched
payments: created /home/you/payments — git init, door written, first commit
api: branched points-expire from main 58383ca — local main is ahead of origin/main
api: worktree /home/you/brain/.multivac/worktrees/points-expire/api
payments: branched points-expire from main 3105b42 — no origin/main known locally
payments: worktree /home/you/brain/.multivac/worktrees/points-expire/payments
work here — one checkout per repo, nobody else's tree moves:
  api: /home/you/brain/.multivac/worktrees/points-expire/api
  payments: /home/you/brain/.multivac/worktrees/points-expire/payments
then commit on branch points-expire and run `multivac change land points-expire`
```

Un **worktree** por repo declarado, en
`<brain>/.multivac/worktrees/<slug>/<repo>` — ignorado por git, e impreso porque
ahí es donde se hace el trabajo. El checkout compartido nunca se mueve: otro
agente puede estar ejecutando otro cambio en el mismo repo, y un árbol de
trabajo cambiado bajo sus pies pone sus ediciones en tu rama. `close` elimina
los worktrees.

La rama que cuelga de él se basa en **la más nueva entre la rama por defecto y
su ref de seguimiento remoto**, decidido sin conexión, por ancestría, a partir
de refs que git ya tiene; se imprimen el sha y la razón porque una base
silenciosa es una suposición que no puedes auditar. Qué rama es la rama por
defecto lo determina lo que git ya sabe: `origin/HEAD`, luego
`init.defaultBranch`, luego `main`, luego `master`, y solo si no hay ninguna de
ellas, `HEAD` — que dice de quién es la rama sobre la que se construye:

```txt
api: branched points-expire from HEAD 0d41a9c — no default branch found — branching from the checked-out branch somebodys-work; its commits come along
```

Un repo sin nada en disco se clona cuando tiene `url` y se crea como greenfield
cuando no la tiene — `git init`, puerta de consumidor, primer commit. El estado
de cada repo pasa a `branched` en el archivo del cambio. Luego viene el paso
`apply` del SDD.

Donde git no puede crear un worktree — un git antiguo, una rama ya activa en
otro lugar, un `add` que falla por cualquier motivo — apply lo dice y crea la
rama en el mismo lugar:

```txt
api: no worktree available — branching in place
```

La contabilidad del cambio — el archivo de declaración, la fila reservada, el
cambio de estado — se **confirma con un commit antes de crear cualquier rama**
(`committed: change apply:
<slug> — status branched`), de modo que cada checkout que apply entrega lo
hereda desde la base; nada cruza un cambio de rama sin confirmar. Donde apply
crea la rama en el mismo lugar, cualquier cosa **distinta** sin confirmar en
ese árbol se rechaza por su nombre, con el comando que la aparta:

```txt
api: cannot branch points-expire — /home/you/api carries uncommitted work: notes.md
  apply will not switch it to points-expire under another change
  commit it, or park it: git -C /home/you/api stash push -- notes.md
  then re-run: multivac change apply points-expire
```

Los archivos SDD del cambio se llevan a su rama cuando hay una a la que
llevarlos. Solo el brain contiene archivos SDD, así que eso aplica a un cambio
que nombra la entrada propia del brain — un brain que es su propio repo de
código. Antes del cambio de estado, `apply` selecciona los archivos sin
confirmar bajo las rutas compartidas del SDD y bajo los directorios de
artefactos de este cambio. Rechaza por su nombre uno rastreado y modificado, o
uno ignorado. Una vez que el worktree existe, copia el resto allí, los
confirma con un commit ahí y los elimina del checkout:

```txt
brain: carried 3 speckit files onto points-expire and committed them there
```

Para spec-kit escribe el propio `.specify/feature.json` del worktree; donde el
directorio se quedó en el checkout — un brain sin código — apunta en cambio el
del checkout, y lo dice cuando nombró otro. Las compuertas de `plan`, `apply` y
`close` buscan los artefactos del SDD en el checkout del brain, luego en el
worktree del cambio que lleva el nombre de la entrada propia del brain — salvo
un paso impreso en `land`, que corre después del merge, así que su prueba se
lee solo en el checkout del brain y una encontrada únicamente en el worktree se
rechaza por su nombre. En un brain sin código, el directorio de especificación
se queda en el checkout hasta que `close` lo confirma con un commit. El paso
apply de OpenSpec corre donde ahora está `openspec/changes/<slug>/`, lo cual
dice su línea impresa.

Una rama existente se reutiliza, no es un fallo:

```txt
api: branch points-expire already exists — switched to it, reusing
```

#### Qué se puede trabajar a la vez {#what-can-be-worked-at-once}

Cuando la etapa lista contiene más de un repo, `apply` lo dice:

```txt
these two are one stage: no ordering between them, and one checkout each — work them at once
  never the same file twice at once (a lost update), and never the law: ids are reserved one at a time and stages serialise there
```

No se infiere nada: los repos en una misma etapa de `landing_order` son tu
propia declaración de que no tienen dependencia de orden, y los checkouts de
arriba son el aislamiento que hace seguras las ediciones concurrentes. Las
etapas posteriores no se nombran — están bloqueadas por una anterior.

Los límites acompañan a la línea cada vez, porque son su mitad útil. Se imprime
y nunca se verifica: ningún artefacto prueba que un agente haya hecho dos cosas
a la vez.

### `land` {#land}

Informa el grafo de aterrizaje y registra los merges. `--landed <repo>` marca
un repo como aterrizado — se rechaza si su etapa sigue bloqueada por una
anterior.

Para un repo listo, `land` imprime el push y el merge request, y no confirma
nada en la rama del cambio: lo que aterriza es lo que confirmaste ahí.

```txt
$ mvac change land points-expire
stage 1 [ready] api:branched
  api: git -C /home/you/api push -u origin points-expire
  api: open MR points-expire -> main (state the landing order in the description)
  api: once merged: multivac change land points-expire --landed api
stage 2 [blocked] payments:branched
  waiting on an earlier stage — do not push yet
```

```txt
$ mvac change land points-expire --landed api
api: recorded as landed — points-expire is merged into main 330cc3b
committed: change land: points-expire — api landed
stage 1 [landed] api:landed
stage 2 [ready] payments:branched
  payments: git -C /home/you/payments push -u origin points-expire
  payments: open MR points-expire -> main (state the landing order in the description)
  payments: once merged: multivac change land points-expire --landed payments
```

`land` imprime comandos; nunca hace push y nunca abre un merge request.
`land --landed <repo>` es la única forma que escribe: registra la declaración
en el archivo del cambio y la confirma con un commit como
`change land: <slug> — <repo> landed`.

**`--landed` registra lo que le dices, y dice lo que pudo comprobar.** La
evidencia es local y sin conexión: la rama del cambio contenida en la rama por
defecto, que ya avanzó más allá de ella. Un squash, o un merge que solo ocurrió
en el remoto, no deja rastro local — así que la ausencia se informa, nunca se
rechaza:

```txt
api: recorded as landed — no local merge commit to confirm it (points-expire is not contained in main here); normal for an MR merged on the remote, or squashed
```

**El aterrizaje también se lee desde el canal**, que el squash no puede
destruir. `land` evalúa las afirmaciones declaradas del cambio contra la ref de
canal del brain: si se resuelven contra lo que `origin` publicó, el trabajo
está publicado, sin importar cómo llegó ahí. Ese veredicto es por **cambio**,
no por repo — una evaluación contra una ref, y un tramo `*` no pertenece a
ningún repo en particular — así que se imprime bajo su propia etiqueta
`channel:`, nunca tras la clave de repo que nombra `--landed`:

```txt
$ mvac change land points-expire
channel: every declared claim resolves at origin/main 330cc3b (last fetch 2h ago) — the work is published there, however it got in — record it: multivac change land points-expire --landed <repo>
```

La lectura **ofrece** la conclusión; nunca escribe el registro. Una ref de
canal solo es tan verdadera como el último fetch, así que el negativo dice las
dos cosas que puede significar, y el contenido publicado prueba la publicación
y no la autoría:

```txt
channel: not every declared claim resolves at origin/main 330cc3b (never fetched here) — not landed, or not fetched: `multivac repos sync`, then re-read
```

Un canal que no se resuelve en absoluto también lo dice, en lugar de quedarse
callado:

```txt
channel: origin/main does not resolve here (no remote, or never fetched) — nothing read, so landing is unverified either way: `multivac repos sync`, then re-read
```

Registrar el último repo arma `verify --strict`, y `land` lo dice — la CI corre
esa compuerta sobre el canal, así que un cambio que se deja abierto pone main
en rojo:

```txt
every repo is now landed — once every declared claim resolves, `verify --strict` refuses points-expire as unclosed …, here and in CI, until: multivac change close points-expire
```

En ese momento también dice qué rechazaría `close` sobre lo que citan las
afirmaciones — una línea cada una, después de la línea de armado — y la última
línea las nombra en lugar de un simple `change close`. Una fila que el canal
del brain ya declara y que este checkout no tiene se nombra como un pull, nunca
como una segunda declaración:

```txt
  close refuses until: INV-02: its row states no rule yet — the row is the only place the rule is stated; state it in .multivac/invariants.md
all stages landed — fix the line close refuses on above, then: multivac change close points-expire
```

```txt
  close refuses until: INV-02: its row states no rule here, but origin/main states it (2 commit(s) this checkout lacks) — pull, then re-run close
```

Cuando no hay nada que rechazar, la última línea sigue siendo
`` all stages landed — run `multivac change close points-expire` ``. El canal
del brain es el `channel:` de su propia entrada de `repos:`, si no el
`channel:` global, si no `origin/main` — la ref que leen la línea `channel:`,
el pull y la línea de lectura de `verify`.

A un repo sin `origin` se le indica aterrizar localmente en lugar de hacer
push:

```txt
  payments: no origin remote — land locally: git -C /home/you/payments switch main && git merge --no-ff points-expire
```

### `close` {#close}

La compuerta. Rechaza un cambio que no declaró repos, o que nombra uno que la
configuración no tiene — los mismos dos rechazos que hacen `plan` y `apply`,
porque una puerta más débil que las dos anteriores no es una compuerta:

```txt
$ mvac change close points-expire
.multivac/changes/points-expire.md declares no repos — declare them, then re-run close
  repos: { <key>: { status: landed } }   # every repo this change touched
  or give the reservation back: multivac change close points-expire --abandon
```

Rechaza mientras algún repo no haya aterrizado:

```txt
$ mvac change close points-expire
api: branched — land every stage first (multivac change land points-expire)
payments: branched — land every stage first (multivac change land points-expire)
```

Luego vuelve a verificar **solo las afirmaciones que este cambio declaró**, y
rechaza si alguna no está en verde:

```txt
INV-07: no anchors evaluated — add an anchor for the claim, then re-run close
claims are not green — close refused; fix the red claims, then re-run close
```

**Y rechaza una afirmación que no cita nada.** Una afirmación es el ID de su
fila, así que la fila es el único lugar donde se escribe su regla. Antes de
escribir, preparar, archivar o publicar cualquier cosa, `close` comprueba lo
que cita cada afirmación y nombra, por afirmación, la primera de estas: ninguna
fila; una fila a la que le faltan columnas de sus seis; una fila retirada que
el cambio no retira; una fila bajo `invariants.retires` que aún no está
retirada; una fila que el cambio ni agrega, ni toca, ni retira; una fila que
otro cambio reservó y no ha declarado; una fila que aún no declara ninguna
regla; una afirmación anclada solo en el archivo del cambio que archiva.
También rechaza una fila bajo `adds` que ya está en la ley, y una fila
propuesta que el cambio posee, que un ancla nombra y que ninguna afirmación
cita.

Las afirmaciones en rojo y las líneas de citas vienen en una misma ejecución.
La línea huérfana — una afirmación anclada solo en el archivo del cambio — se
comprueba únicamente cuando todas las afirmaciones están en verde, así que
puede hacer falta un segundo `close` para que aparezca. Una afirmación sin fila
se nombra una sola vez, por su línea de cita, y nunca se evalúa contra anclas:

```txt
INV-07: no anchors evaluated — add an anchor for the claim, then re-run close
INV-05: ok
claims are not green — close refused; fix the red claims, then re-run close
NOPE-99: no row in .multivac/invariants.md — a claim cites a row of the law; add the row, or drop the claim
INV-05: claimed, but this change neither adds, touches nor retires it — drop the claim, or list it under invariants.touches if this change amends that row
claims do not cite the law this change makes — close refused; fix the lines above, then re-run close
```

Una fila que el canal del brain ya declara — mergeada en la forja, con fetch,
sin pull — se nombra como un pull, nunca como una segunda declaración; el canal
se lee sin conexión, y solo ante un rechazo así:

```txt
INV-01: its row states no rule here, but origin/main states it (2 commit(s) this checkout lacks) — pull, then re-run close
```

Una regla que el cambio declara y que nada ancla igual entra en la ley — se
admite una cobertura por debajo del cien por ciento — y `close` lo dice sin
rechazar:

```txt
INV-02: enters the law stated but unanchored — nothing verifies it; claim and anchor it to have close verify it
```

A una afirmación heredada que aún conserva su `statement:` se le indica que lo
mueva a la fila cuando la fila aún no declara nada. La línea final de
`verify`, el último `land` y `plan` dicen qué rechazará esta compuerta antes de
que llegues aquí.

En verde: con un SDD declarado, `close` no imprime ningún paso por ejecutar —
el `archive` de OpenSpec se imprime en `land` — solo las líneas propias de la
compuerta y
`sdd <tool>: close — this tool has no agent-run close step; nothing to run`.
Rechaza hasta que exista el archivo de OpenSpec y, para cualquiera de las dos
herramientas, mientras la lista de tareas que lee (el `tasks.md` archivado de
OpenSpec, el propio de spec-kit) todavía tenga un `- [ ]` sin marcar. El
archivo del cambio se mueve a `.multivac/changes/archive/`, se eliminan los
worktrees y se imprime el ritual — sus líneas en el orden del archivo, con
sangría, sin sus encabezados, comentarios ni líneas en blanco. El ejemplo no
declara ningún SDD, así que no muestra ninguna de esas líneas.

```txt
$ mvac change close points-expire
INV-07: ok
archived -> .multivac/changes/archive/points-expire.md
archived — commit this: git -C /home/you/brain add -- .multivac/changes/archive/points-expire.md .multivac/changes/points-expire.md .multivac/invariants.md && git commit -m "Archive the points-expire change" (no origin remote — the direct commit is the landing)
api: worktree removed (/home/you/brain/.multivac/worktrees/points-expire/api)
payments: worktree removed (/home/you/brain/.multivac/worktrees/points-expire/payments)

ritual (.multivac/ritual.md) — multivac cannot check these; walk them with the user:
  - [ ] tell support before the flag flips
  - [ ] the public site ships before the backend
```

Un worktree se elimina cuando no tiene nada sin confirmar; uno que sí lo tiene
se conserva, con el comando que lo elimina.

#### `--abandon` {#--abandon}

El otro final. `change new` reserva un id de invariante antes de que se declare
nada, así que un cambio que abandonas antes de que toque un repo nunca puede
satisfacer las compuertas anteriores — y `close` es lo único que devuelve una
reserva. Sin una puerta, un cambio abandonado filtra su id para siempre, o
escribes un falso `status: landed` para pasar:

```txt
$ mvac change close points-expire --abandon
INV-07
abandoned -> .multivac/changes/archive/points-expire.md — nothing was verified; nothing landed
commit it: git -C /home/you/brain add -- .multivac/changes/archive/points-expire.md .multivac/changes/points-expire.md .multivac/invariants.md && git commit -m "Abandon the points-expire change"
```

No se verifica nada, a propósito: un cambio abandonado no hizo afirmaciones que
verificar. Un cambio que *sí* declaró afirmaciones se rechaza — quítalas
primero, o ciérralo como corresponde. Lo mismo ocurre con un cambio cuya propia
fila propuesta declara una regla: abandonarlo haría entrar esa regla como una
propuesta que nadie verificó. Una fila que aún dice RESERVED es lo que
`--abandon` devuelve, y nunca rechaza:

```txt
INV-07: states a rule this abandoned change never verified — delete the row from .multivac/invariants.md (a proposed row may be removed), or close the change properly
```

El commit impreso — al cerrar o al abandonar — está **limitado a las rutas del
cambio que se cierra**: el archivo archivado, la ruta antigua del cambio, la
tabla de la ley, y lo que el SDD declarado escribió en el brain para este slug,
sin importar lo que digan `sdd_auto` y `--no-sdd`: la especificación, el plan,
la lista de tareas, una propuesta archivada, incluidas las eliminaciones, y
cada especificación principal en la que un archivado hizo merge y que lleva ese
merge — una que no lo lleva, como tras un archivado hecho sin merge, se nombra
como sucia y no se prepara. Cada compuerta del ciclo de vida exigió uno de esos
archivos, así que dejarlos sin rastrear sería pedir la prueba y luego
descartarla; los interruptores omiten pasos y compuertas, nunca lo que ya se
escribió. Un archivo sucio de la herramienta que este cambio no escribió — un
documento del proyecto, la configuración propia de la herramienta — se nombra
en su propia línea y nunca se prepara. El commit impreso nunca es `add -A`, que
en un checkout compartido arrastraría archivos de otro cambio a este commit de
archivo.

Antes de escribir el archivo, el cuerpo del cambio gana una línea que cita el
directorio del slug — el primero encontrado en el checkout del brain, luego en
el worktree del cambio — a menos que el cuerpo ya lo nombre. No se escribe nada
más en el cuerpo:

```txt
Specified in `specs/001-points-expire/` (speckit).
```

Con la automatización activada y sin `--no-sdd`, un cierre que no encuentra
ningún directorio dice que no citó nada.

Dónde aterriza el commit que imprime `close` depende de dónde esté parado el
brain, y la redacción dice en qué caso estás:

- en una rama de trabajo: `archived — commit this on <branch> (it lands through
  that branch's MR): git -C <brain> add -- <paths> && git commit -m "..."`
- en el trunk de un brain **con** remoto, nada aterriza directamente — la receta
  es rama + MR:

  ```txt
  archived — commit this on a branch; nothing lands on main directly:
    git -C /home/you/brain switch -c close-points-expire && git add -- .multivac/changes/archive/points-expire.md .multivac/changes/points-expire.md .multivac/invariants.md && git commit -m "Archive the points-expire change" && git push -u origin close-points-expire
    then open MR close-points-expire -> main
  ```

- a un brain solo **sin** remoto origin se le dice que el commit directo ES el
  aterrizaje (el ejemplo de arriba) — no hay MR que abrir.

`--abandon` no tiene esos casos: siempre imprime la línea simple `commit it:`, y
dice `ALREADY LANDED: <repos> — that work stays landed` donde su ejemplo dice
`nothing landed` si algún repo ya había aterrizado.

El archivo es un renombrado en el árbol de trabajo como cualquier otra edición,
así que `close` nombra el commit que lo almacena en lugar de dejar que se note
después.

Un cambio sin afirmaciones lo dice y archiva:
`no claims declared — nothing to verify`. Un ritual vacío o ausente no imprime
nada. Recorrido completo: [Ejecutar cambios](../../guide/running-changes).
## `help [topic|command]` {#help-topiccommand}

La puerta de entrada. `mvac help anchor` imprime la gramática de las anclas en una pantalla: el
formato de línea, el dialecto exclusivo de POSIX-ERE con los reemplazos de `\s`/`\d`/`\w`/`\b`,
la coincidencia por línea (por sentencia en `.sql`), `count=N` como un trinquete de
eliminación sobre todo el glob, `each`/`each!` como el universal por archivo que nombra los archivos que fallan,
la regla de un solo glob de inclusión (llaves para las alternativas), las exclusiones calificadas por repo,
y dónde pueden vivir las anclas. `mvac
help <command>` imprime el uso de ese comando; `mvac help` a secas lista los temas
y los comandos.

## Códigos de salida {#exit-codes}

| código | significado |
| --- | --- |
| **0** | ok — incluidos estos estados degradados: repos sin evaluar, adaptadores ausentes, repos faltantes en `verify` y en el listado de `repos`, destinos de puerta no compatibles, tramos rotos no bloqueantes. No todos los estados degradados: un montaje del brain que no es un brain sale con 2 (abajo) |
| **1** | una verificación falló o una compuerta rechazó: tramo bloqueante roto o vacuo, error de análisis de un ancla, pin desactualizado con `staleness: block` (ejecución con alcance al brain), `close` antes de que todos los repos hayan aterrizado, una afirmación que no está en verde, un clon que falló, `repos check` que encuentra un repo ausente o sin configurar, `repos sync` sin poder encontrar una herramienta SDD declarada, configuración inválida **en `doors`, `doctor` y `init`**, una compuerta de cumplimiento desarmada bajo **`doctor --strict`**. Las otras líneas en las que `verify` rechaza están en [la matriz de salida](#the-exit-matrix) |
| **2** | uso o entorno: ningún comando, comando desconocido, **un argumento que la mayoría de los comandos no declaran** — una flag o un posicional —, subcomando desconocido, `.multivac/config.yml` ausente o inválido (excepto en `doors`, `doctor` y `init`, que salen con 1, en el listado de `roadmap`, que no lee ninguno, y en `roadmap add`, que continúa sin él), un montaje que no es un brain. El rechazo nombra el argumento y explica qué toma el comando, y ocurre antes de que el comando haga nada. |

La mayoría de los comandos toman lo que declaran y rechazan el resto. `mvac doctor --sttrict`
antes ejecutaba el reporte sin la aserción y salía con 0; `mvac doctor /other/repo`
antes reportaba sobre el directorio de trabajo, porque `doctor` no declara ningún directorio
y el argumento se descartaba. Ahora ambos se rechazan. Lo que cada comando declara es
su `--help`, y esa es la lista con la que se mide el rechazo.

Cuatro cosas se aceptan y no hacen nada. `mvac help` ignora los argumentos que siguen a
su tema, así que `mvac help anchor junk` imprime la gramática y sale con 0. En
`change`, `--landed <repo>` solo lo lee `land` y `--abandon` solo lo lee
`close`: `--landed` y `--abandon` son flags declaradas, así que otro subcomando
las acepta y las ignora. En `repos`, `--shallow` solo lo lee `sync`.
En `roadmap`, `--horizon` solo lo lee `add`: el listado lo rechaza, y
`sync` ignora un valor conocido. Un valor desconocido se rechaza en todos los subcomandos.

```txt
$ mvac doctor --sttrict
doctor: unknown flag "--sttrict" — doctor takes --strict
```

```txt
$ mvac frobnicate
unknown command "frobnicate" — run `multivac --help` for the list
```

```txt
$ mvac verify --loud
unknown flag "--loud" — verify takes [dir], --strict, --check, --worktree, --repo <key>, --range <base>..<head>, --branch <name>, --quiet
```

```txt
$ mvac verify
no .multivac/config.yml in /home/you/somewhere — run `multivac init .` to create it
```

Debajo de un brain, el mismo rechazo lo nombra en su lugar; debajo de un repositorio que ningún brain
gobierna, `verify` lo dice. Fuera de cualquier repositorio lo dice solo cuando un brain
está en un directorio hijo, y en caso contrario da el consejo de arriba — véase
[De dónde toma su raíz una ejecución](#where-a-run-roots):

```txt
$ mvac change new points-expire "Points expire"
no .multivac/config.yml in /home/you/brain/src — it is inside the brain at /home/you/brain; run this there
$ mvac verify
/home/you/notes is inside /home/you, which no brain governs — nothing was verified
```
