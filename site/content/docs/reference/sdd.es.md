---
title: Herramientas SDD
weight: 4
---

Una herramienta **SDD** (desarrollo guiado por especificaciones) ejecuta su propio flujo de trabajo —para
OpenSpec: crear un cambio, escribir sus artefactos, aplicar sus tareas y
archivarlo— junto al ciclo de vida de cambios de multivac.

multivac nunca instala una. Lee lo que la herramienta deja en disco y, cuando
se lo pides, invoca el binario que encuentra en el `PATH` o en el
`node_modules/.bin` del propio repositorio. Instalar la herramienta es cosa tuya; ejecutar el `init` de la herramienta **en este repositorio**, una sola vez, es cosa del ciclo de vida: consulta
[el scaffold](#the-scaffold-declaring-a-tool-that-has-never-run-here).

```yaml
sdd: opsx
```

Igual que los destinos de las puertas, los adaptadores son **datos en un registro incluido**, no módulos.
Tu configuración elige uno por nombre; agregar uno es un merge request a multivac.

multivac no mantiene ningún grafo de código: no declara, construye, actualiza ni confirma ninguno,
y ninguna puerta apunta a un agente hacia uno. Una configuración que escribió un release anterior y
que aún declara uno se carga, y `verify` y `doctor` avisan que la clave se ignora
(consulta [`configuration`](../configuration)).

## Artefacto ≠ binario {#artifact--binary}

Esta es la distinción sobre la que gira todo el diseño. Cada adaptador declara dos
capacidades, y solo se apaga la mitad que falta:

| capacidad | significa | requiere |
| --- | --- | --- |
| **read** | multivac puede consumir lo que produjo la herramienta | la herramienta **instalada** en esa raíz: su propio archivo de estado pasa su verificación |
| **run** | multivac puede invocar la herramienta | todos los **binarios requeridos**, encontrados en el `PATH` o en el `node_modules/.bin` de esa raíz |

| adaptador | instalado cuando | artefacto | binario | actualización (registrada, nunca ejecutada) |
| --- | --- | --- | --- | --- |
| `opsx` | `openspec/config.yaml` o `openspec/config.yml` es un archivo | `openspec/specs`, `openspec/changes` | `openspec` | `openspec update` — actualiza solo los cuerpos de comandos que instaló un humano; en un brain cuyo scaffold los creó no hay ninguno, y no hace nada |
| `speckit` | `.specify/integration.json` se analiza correctamente, con `integration_state_schema` 1 y un `installed_integrations` no vacío | `.specify` | `specify` | `specify check` |

**Instalado es lo que escribió el proveedor, nunca una ruta que simplemente está ahí.** Una
sola sonda responde por todas las superficies —el scaffold, el traspaso a la rama de un cambio, la compuerta de documentos del proyecto, `repos check` y `doctor`— solo a partir de archivos,
sin lanzar ningún proceso. Da uno de cuatro estados:

| estado | significa |
| --- | --- |
| **installed** | un archivo de estado pasa su verificación |
| **missing** | no hay nada de la herramienta en esa raíz |
| **partial** | el directorio de la herramienta, o un archivo de estado, está ahí y falla — el motivo nombra la ruta y la verificación |
| **unevaluable** | un archivo de estado está ahí y no se puede leer — el motivo nombra la ruta y el error |

Un `.specify/` creado con `mkdir` es partial. El límite: una instalación de spec-kit
que nunca escribió `integration.json` se lee como partial.

**Una sola búsqueda encuentra un binario.** Toda superficie que ejecuta el
comando de un adaptador, o dice si puede hacerlo —`init`, el scaffold, el validador y
`doctor`— hace la misma pregunta en la raíz donde se ejecuta el comando: cada
directorio del `PATH` en orden (en Windows, con cada extensión que lista `PATHEXT`),
y luego el `node_modules/.bin` propio de esa raíz, donde un `npm i -D` local del proyecto
deja una herramienta. Una coincidencia es un archivo ejecutable, una copia en el `PATH` gana, y lo que
se ejecuta es lo que se encontró. La columna de binario de arriba es la lista `required`
de cada entrada: deben encontrarse todos. Un binario que falta en una raíz se nombra junto con
su adaptador, la línea de instalación y el repositorio del proveedor:

```txt
`specify` found on neither PATH nor brain's node_modules/.bin — install speckit: uv tool install specify-cli (https://github.com/github/spec-kit)
```

La parte de Windows se lee a partir del significado documentado de `PATHEXT` y nunca se ha
ejecutado allí.

Si clonaste un repo cuyos archivos SDD ya están confirmados, la mitad de lectura
funciona sin que la herramienta esté instalada. El binario solo hace falta para
*invocar* — y esa es la línea que multivac nunca cruza: lee artefactos
ajenos e invoca binarios declarados, pero nunca instala software
ajeno.

Los repos declarados son la excepción, porque son datos propios de la herramienta:
`repos sync` los clona, cuando se pide de forma explícita.


## La política de tres estados {#the-three-state-policy}

| estado | `verify`, `doctor`, `doors` | `init`, `repos sync`, `change` |
| --- | --- | --- |
| **no declarado** | nada, ni siquiera un aviso | nada |
| **declarado, binario ausente** | `doctor` nombra el binario, la línea de instalación y el proveedor; `verify` y `doors` no dicen nada; **código de salida 0** | `init` y `change new` rechazan con **código de salida 1**, nombrando lo mismo, antes de escribir nada, donde la herramienta se ejecutaría; `repos sync` hace primero su pasada de clonar, fetch y montaje, y luego sale con **1**; `change plan`, `apply` y `close` (no `close --abandon`) imprimen la línea del scaffold, y la compuerta que sigue decide por sus propios términos |
| **declarado, instalado** | adaptador activo | adaptador activo; no se vuelve a ejecutar nada |

Declarar significa "este proyecto la usa", lo cual sigue siendo cierto en una máquina que
todavía no la tiene. Las superficies que solo leen (`verify`, `doctor`, `doors`) nunca
se ponen en rojo por una herramienta ausente. Los comandos que configuran un repo ejecutan la herramienta, así que
lo dicen allí donde no puede ejecutarse: `init --sdd speckit` sin `specify` y un
`change new` cuyo SDD falta rechazan antes de escribir nada, y un
`repos sync` que equiparía al brain sale con 1 una vez terminado su otro trabajo. Un
SDD bajo `sdd_auto: false`, o una herramienta ya instalada, no es requerido.

Por eso no declarado y declarado-pero-ausente son estados distintos: el
primero es "no usamos ninguna", el segundo es "usamos una, no está aquí", y
solo el segundo merece una línea que te diga cómo conseguirla — `doctor` la imprime,
y también un comando que ejecutaría la herramienta.

## Adaptadores SDD {#sdd-adapters}

Dos entradas, elegidas por la clave del registro — que es el nombre que multivac da al
adaptador, no necesariamente el nombre del binario propio de la herramienta:

| clave | herramienta | binario | instalación |
| --- | --- | --- | --- |
| `opsx` | OpenSpec | `openspec` | `npm i -g @fission-ai/openspec` |
| `speckit` | GitHub Spec Kit | `specify` | `uv tool install specify-cli` |

```txt
$ mvac doctor
sdd        opsx @ brain: installed · binary ok · sdd_auto on — the lifecycle prints this tool's own steps and refuses to move on without their artifacts
sdd        opsx @ brain: an earlier init left command bodies no printed step names — `git rm -r .claude/commands/opsx .claude/skills/openspec-*` removes them; they are not code, so the commit needs no open change
sdd        opsx governs the code of api — its steps run in the brain
sdd        opsx flow — new: in the brain checkout run `openspec new change <slug> --json`, then write each artifact … [proof: openspec/changes/<slug>/proposal.md — `change plan` refuses without it]
sdd        opsx gates — change plan: refuses without openspec/changes/<slug>/proposal.md · change apply: refuses without openspec/changes/<slug>/tasks.md · change close: refuses without openspec/changes/archive/<n>-<n>-<n>-<slug>
sdd        opsx project law @ brain: openspec/config.yaml `context:` written — reported, never gated
```

Un nombre que multivac no conoce nunca llega a la línea `sdd`: la configuración se
rechaza al cargarse, y `doctor` lo dice en su línea `config`, con código de salida 1:

```txt
config     invalid — sdd: nope — REFUSED: no SDD adapter is named nope (known: opsx, speckit). Fix: correct sdd: in .multivac/config.yml, then open a change for the config edit: `multivac change new <slug>`
```

{{< callout >}}
Para OpenSpec, los pasos son los verbos de terminal propios de openspec — `new change`,
`status`, `instructions` y `archive` — que ejecuta tu agente; los comandos de terminal
que multivac ejecuta por sí mismo son `openspec validate` y el scaffold. Por eso
multivac nunca lanza los pasos por shell: imprime la instrucción, el agente
la ejecuta, y la compuerta revisa lo que dejó.
{{< /callout >}}

### El SDD vive en el brain {#the-sdd-lives-in-the-brain}

Con un SDD declarado, vive solo en el brain. Se instala allí, sus
pasos se imprimen allí, sus compuertas leen el brain y los worktrees del cambio — un paso
impreso en `change land` lee solo el checkout del brain — y su documento de proyecto es el del brain. Un repo de código no recibe nada de eso: ni instalación del
proveedor, ni constitución, ni bloque de pasos en su puerta — en su lugar, una línea
(ninguna bajo `sdd: none` o `sdd_auto: false`):

```txt
- The brain's `speckit` SDD runs in the brain checkout, never in this mount: specs, plans and tasks are written there. Code here lands only on the branch of an open change declaring this repo; `verify --strict` refuses it anywhere else.
```

Lo que el SDD del brain sí alcanza es el **código** de cada repo declarado: aterriza solo
en la rama de un cambio abierto (consulta
[El código aterriza en un cambio](../commands#code-lands-in-a-change)), a menos que el repo
diga `sdd: none` — el único valor que admite el `sdd:` propio de un repo. Una herramienta nombrada allí
se rechaza al cargarse la configuración; consulta [`sdd`](../configuration#sdd).

**Dónde se ejecutan los pasos.** Los pasos que imprime `change plan` se ejecutan desde el checkout
del brain, antes de que `change apply` lleve el directorio del slug a la rama del cambio. Para un cambio que nombra un repo de código, ese checkout no contiene nada
del código del cambio, y `change plan` lo dice:

```txt
sdd speckit: its steps run from the brain checkout, which holds no code of this change — tasks name code paths under .multivac/worktrees/<slug>/<repo>/, and code is written only there
```

Esa línea es una instrucción, no una compuerta. Un brain sin código propio
no declara código, así que el código escrito por error en su checkout no se rechaza
allí; `verify --strict` en el repo de código lo rechaza, porque el SDD del brain
gobierna el código de ese repo.
El paso apply de OpenSpec dice por sí mismo dónde se ejecuta: donde
está `openspec/changes/<slug>/`, que es el worktree del cambio en el brain una vez
que `change apply` lo llevó allí. Su archive se ejecuta después del merge, en el checkout
del brain.

**El puntero de la funcionalidad.** spec-kit mantiene un puntero por checkout,
`.specify/feature.json`, que nombra el directorio donde escriben sus scripts de plan y tareas.
Dos cambios abiertos en un mismo brain lo comparten, así que planificar uno justo después
de especificar el otro escribía en el directorio del otro — y la compuerta de ese directorio
entonces pasaba. `change plan` y `change apply` lo apuntan al directorio propio del slug,
y lo dicen cuando nombraba otro:

```txt
sdd speckit: .specify/feature.json named specs/002-beta; it names specs/001-probe-sdd now
```

Los pasos de dos cambios intercalados en un mismo checkout aún pueden cruzarse: el puntero
acierta en el caso secuencial, y la compuerta nombra el directorio que leyó.

**Una especificación escrita en un repo de código.** Una prueba se busca en el brain y en el
worktree del cambio que nombra la entrada propia del brain — solo en el checkout del brain
para un paso impreso en `change land`. Una especificación que un agente escribió en un
repo de código por costumbre no prueba nada, pero un rechazo que solo dijera "falta" lo
enviaría de vuelta al mismo checkout equivocado, así que el rechazo la nombra — y no
la lee:

```txt
sdd opsx: `change plan add-user-auth` refused — openspec/changes/add-user-auth/proposal.md is missing — looked in brain
sdd opsx:   api: openspec/changes/add-user-auth/proposal.md — not read; the SDD runs only in the brain
```

**Qué aterriza close, y la única línea que escribe.** `change close` — con abandono o
sin él — pone los directorios de slug del brain en el `git add` del commit que
imprime, sin importar lo que digan `sdd_auto` y `--no-sdd`: esos interruptores omiten los pasos
y sus compuertas, nunca lo que ya estaba escrito. Un directorio de slug que git informa
como eliminado también se lista, y también cada especificación principal que lleva el merge:
el archive de OpenSpec mueve `openspec/changes/<slug>/` bajo `archive/` y fusiona
su `specs/<cap>/spec.md` en `openspec/specs/<cap>/spec.md`, y todo
va en ese único commit. Una especificación principal lleva el merge cuando su sección `## Requirements`
contiene, completo y con el mismo nombre, cada bloque `### Requirement:`
de las secciones ADDED y MODIFIED del delta archivado — con los finales de línea, los
espacios finales y las secuencias de líneas en blanco normalizados en ambos lados, rastreada o
no rastreada por igual, y ambas leídas como las lee openspec: un bloque llega hasta el
siguiente requirement o encabezado `## `, y un encabezado dentro de un bloque de código cercado
no cuenta. Solo se fusiona `spec.md`, así que un archivo que guardes junto a un delta
no corresponde a nada bajo `openspec/specs/`. Una que no lo lleva — el archive
se hizo sin fusionar, o el archivo es un borrador tuyo — se nombra como sucia y se deja
fuera de ese commit:

```txt
sdd opsx: openspec/specs/billing/spec.md is dirty and was not staged — it is not this change's to commit
```

Un delta sin bloque ADDED ni MODIFIED se lista tal como lo dejó el archive. Solo
los archivos en los que el archive fusionó: una edición ajena junto a ellos en
`openspec/specs/<cap>/` se nombra como sucia y se deja para que la confirmes tú. Close luego
agrega una línea al cuerpo del cambio, nombrando el primer directorio de slug encontrado en
el checkout del brain, y luego en el worktree del cambio:

```txt
Specified in `specs/001-probe-sdd/` (speckit).
```

No escribe nada más en el cuerpo, y nada en absoluto cuando el cuerpo ya
nombra el directorio. `change new` lo dice antes del primer paso, de modo que el porqué, el
diseño y las tareas vayan a los archivos del SDD y no al cuerpo:

```txt
sdd speckit: the why, the design and the tasks go into its files — the change body keeps what it held while planned, or one sentence, and `change close` cites the directory; do not cite it yourself
```

**Instalaciones sobrantes.** Un repo de código que un release anterior equipó conserva los
archivos del proveedor hasta que alguien los quita. Mientras el brain declare un SDD, `doctor`
nombra cada uno en un repo donde multivac puede escribir, rastreado o no, con su
eliminación; `repos check` lo agrega a la línea de ese repo; ninguno falla por ello.
Sin SDD en el brain, la instalación propia de un repo de código es el uso que ese equipo hace de la
herramienta, y ningún comando la menciona. Las rutas de instalación de todo SDD conocido no son código en ningún repo, así que la eliminación
se confirma en cualquier rama:

```txt
sdd        leftover speckit install @ api: .specify/integration.json (tracked) — delete .specify/ there; `specify integration uninstall <key>` removes its skills and leaves .specify/
sdd        leftover opsx install @ web: openspec/config.yaml (untracked) — delete openspec/ and the openspec-* skills and opsx commands its init wrote under each harness directory
```

Hasta que se elimine, un sobrante rastreado sigue capturando la búsqueda de raíz propia del
proveedor en los worktrees de ese repo.

### El scaffold: declarar una herramienta que nunca se ha ejecutado aquí {#the-scaffold-declaring-a-tool-that-has-never-run-here}

Declarar `sdd: speckit` en un brain donde spec-kit nunca se ha ejecutado solía ser
un bloqueo mutuo. `change plan` rechaza sin `specs/<n>-<slug>/spec.md` — el slug
debe seguir exactamente una secuencia de dígitos y un `-`, de modo que el directorio de otro cambio
que simplemente contenga el slug no sirve como prueba del paso de este; ese archivo viene de `/speckit.specify`; ese comando de chat
no existe hasta que se ha ejecutado `specify init` — y `specify init` era justo lo que el
cambio bloqueado iba a hacer. Las únicas salidas eran `--no-sdd` y
`sdd_auto: false`, y ambas apagan la compuerta para arreglar el motivo por el que se activó.

Por eso un adaptador también declara su **scaffold**: el comando init del proveedor,
textual. Si ya se ejecutó en un repo lo dice el archivo de estado propio de la herramienta,
leído por la sonda de arriba, nunca un directorio que esté ahí.

| clave | instalado cuando | el init propio de la herramienta |
| --- | --- | --- |
| `speckit` | `.specify/integration.json` pasa su verificación | `specify init --here --integration <key> --force --ignore-agent-tools`, y luego `specify integration install <key>` para la integración de cada puerta adicional que sea segura junto a la primera |
| `opsx` | `openspec/config.yaml` o `openspec/config.yml` | `openspec init --tools none --no-animation .` |

Para spec-kit, la integración sigue tus `doors:`, a partir de un mapa medido
ejecutando la herramienta propia de cada proveedor. Para OpenSpec, el mapa registra lo que escribe `openspec
init --tools <key>`; multivac ejecuta `--tools none`, que escribe
`openspec/config.yaml` y dos `.gitkeep` y nada fuera de `openspec/`,
sean cuales sean las puertas, porque sus pasos son verbos de terminal que todo harness ejecuta
por igual y no necesitan cuerpo de comando:

| puerta | spec-kit | openspec |
| --- | --- | --- |
| `agents` | — | `agents` |
| `claude` | `claude` | `claude` |
| `cursor` | `cursor-agent` | `cursor` |
| `codex` | `codex` | `codex` |
| `gemini` | `gemini` | `gemini` |
| `opencode` | `opencode` (no es seguro junto a otra) | `opencode` |
| `copilot` | `copilot` (no es seguro junto a otra) | `github-copilot` |
| `windsurf` | — | `windsurf` |

spec-kit marca algunas integraciones como no seguras de instalar junto a otra. multivac
instala la integración de la primera puerta que tiene una, y luego cada una de las siguientes
solo cuando tanto ella como la primera son seguras, y nombra el resto; nunca pasa
`--force` para juntarlas. Una puerta sin integración de spec-kit se omite
y también se nombra, excepto `agents`. Si ninguna puerta tiene una, spec-kit recibe
`claude`: su integración `generic`
necesita un directorio de comandos que no se sabe que ningún harness de aquí lea. Una puerta que agregues después de instalar spec-kit
no se agrega a él; ejecuta la instalación propia del proveedor para ella. OpenSpec no
tiene ese vacío ni instalación posterior: una puerta agregada después no necesita nada de él.

`init`, `change new`, `change plan`, `change apply` y `change close` lo ejecutan **en
el brain** cuando la herramienta falta allí, lo imprimen primero, y lo omiten donde
está instalada; `change close --abandon` nunca lo ejecuta. `repos sync` hace lo mismo con el brain después de clonar y
hacer fetch, y nunca instala el SDD en un repo de código:

```txt
sdd speckit: .specify is missing in brain — running the tool's own init there: `specify init --here --integration claude --force --ignore-agent-tools`, then multivac writes its skeleton templates to .specify/templates/overrides
sdd speckit: scaffolded — brain:.specify is there now; its steps are runnable; skeleton: .specify/templates/overrides/{spec,plan,tasks}-template.md
```

Un brain donde la herramienta está **partial** o **unevaluable** — un `.specify/` hecho a
mano, un init que se detuvo a medias, un archivo de estado que no se puede leer — recibe
una advertencia y nunca se reinicializa, porque una nueva ejecución puede revertir archivos que alguien
editó:

```txt
sdd speckit: brain is partial — .specify is there and .specify/integration.json is not — the init is not run over it, since a re-run can revert edited files; run `specify init --here --integration claude --force --ignore-agent-tools` in brain yourself
```

`--ignore-agent-tools` está ahí porque spec-kit busca el CLI propio de la
integración antes de escribir nada: medido sin la bandera y sin
`claude` instalado, el init sale con 1 y no escribe nada; con ella, el init sale con
0.

Instalado es una pregunta del propio brain, respondida por su propio archivo de estado: un repo
de código que alguien inicializó a mano no responde nada por él, y se informa como
sobrante en lugar de contarse.

`verify`, `doctor` y `doors` **nunca** lo ejecutan: el init escribe los archivos del proveedor
en el árbol, y ejecutarlo de nuevo puede revertir skills y plantillas que
alguien editó — algo que ni una verificación, ni un reporte, ni una puerta pueden hacer. `doctor`
informa el estado y nombra el comando en su lugar:

```txt
sdd        speckit @ brain: missing (no .specify) — declared but never run here; `change new` runs the tool's own `specify init --here --integration claude --force --ignore-agent-tools`, doctor never does (it writes the vendor's files into the tree); that run then writes multivac's skeleton templates to .specify/templates/overrides if it is absent · binary ok · sdd_auto on …
sdd        speckit governs the code of api — its steps run in the brain; exempt (sdd: none): landing
```

Seis desenlaces, todos dichos en voz alta:

| estado | qué ocurre |
| --- | --- |
| instalado **en el brain** | no se ejecuta nada, no se imprime nada |
| partial o unevaluable | no se ejecuta nada; una advertencia nombra el motivo y el init que hay que ejecutar a mano |
| missing, sin init registrado para esa herramienta | se enuncia el vacío con la línea de instalación; **no se ejecuta nada** |
| missing, un binario requerido no encontrado | una línea que nombra el binario, la línea de instalación y el proveedor — la búsqueda lee el `node_modules/.bin` propio del brain |
| se ejecutó, ahora instalado | `scaffolded`, y el skeleton escrito o el motivo por el que no se escribió |
| se ejecutó, sigue sin instalarse | la causa de la herramienta, citada, y el comando devuelto — `left .specify partial (<reason>)` cuando escribió la mitad — y la compuerta que sigue aún rechaza por sus propios términos |

La última fila es la honesta: un código de salida es la afirmación de la herramienta, su archivo
de estado es el hecho, y la sonda lee el archivo.

`--no-sdd` y `sdd_auto: false` apagan el scaffold junto con todo lo demás;
no hay un interruptor aparte.

**Plantillas skeleton.** Los pasos specify, plan y tasks de spec-kit parten cada uno de
una plantilla, y sus plantillas base son largas: los tres pasos leen unos 18 KB de
guía por cambio que el agente luego borra. Todo resolvedor de plantillas
que incluye spec-kit lee `.specify/templates/overrides/<name>.md` antes que su plantilla
base, y su init nunca crea ese directorio. Así que la ejecución que lleva al
brain de missing a installed también escribe allí tres skeletons cortos —
`spec-template.md`, `plan-template.md` y `tasks-template.md` — cada uno conserva
los encabezados de sección de la plantilla base y ninguno de sus tokens de comando por integración,
y los pasos leen unos 4 KB en su lugar. Los escribe solo cuando el
directorio está ausente, solo cuando la versión que registró spec-kit es igual o superior a
la más baja medida que resuelve las tres a través de él, cada uno solo donde la
plantilla base instalada aún lleve todos los encabezados que conserva el skeleton, nunca
sobre un archivo, y nunca otra vez. Un brain instalado antes de esto, o uno cuyo
`overrides/` creó un humano, no recibe ninguno; un init posterior del proveedor los deja
como están. Cuando se omite uno, la línea `scaffolded` dice por qué:

```txt
sdd speckit: scaffolded — brain:.specify is there now; its steps are runnable; skeleton skipped: .specify/templates/overrides exists
```

Un override prevalece sobre todo preset de spec-kit, así que un preset instalado después
queda eclipsado para las plantillas que cubre el skeleton. `doctor` nombra cada preset
habilitado que lo está, con el override que hay que borrar para que gane el preset:

```txt
sdd        preset <id> is outranked for plan-template.md by .specify/templates/overrides/plan-template.md — delete that override to let the preset win
```

{{< callout >}}
Un scaffold **no es un paso**. Es el comando de terminal propio de la herramienta, ejecutado una vez
en el brain; los pasos siguen siendo lo que ejecuta tu agente, y nada del
scaffold satisface uno. `specify init` escribe `.specify/memory/constitution.md`
como la *plantilla sin completar* — escribir la constitución sigue siendo trabajo de
`/speckit.constitution`, y la verificación propia de multivac informa que un archivo idéntico a la
plantilla sigue siendo la plantilla sin completar.
{{< /callout >}}
### El flujo propio de cada herramienta, no un trío fijo {#each-tools-own-flow-not-a-fixed-triple}

Los pasos de un SDD son **comandos que ejecuta el agente**, nunca subcomandos
que multivac lance: comandos de chat para spec-kit, los verbos de terminal
propios de openspec para OpenSpec. El nombre de un paso no es un verbo:
`openspec propose` termina con código 1 y `unknown command`. Y las herramientas
no coinciden en cuáles *son* los pasos: OpenSpec crea un cambio, escribe sus
artefactos, aplica sus tareas y lo archiva; spec-kit tiene diez comandos y
ninguno de ellos archiva. Por eso el registro incluido lleva, por herramienta,
un **flujo ordenado de largo arbitrario**, con cada paso atado a un punto del
ciclo de vida y no a un nombre, y con el slug interpolado:

| herramienta | su flujo, tal como lo conduce multivac |
| --- | --- |
| `opsx` | `new`: `openspec new change <slug> --json`, luego el bucle `openspec status` / `openspec instructions` · `plan`: el mismo bucle hasta `tasks.md` · `apply`: `openspec instructions apply --change <slug> --json` · `land`: `openspec archive <slug> --json` |
| `speckit` | `new`: `/speckit.specify`, `/speckit.clarify` · `plan`: `/speckit.plan`, `/speckit.tasks` · `apply`: `/speckit.analyze`, `/speckit.implement`, `/speckit.converge` |

Cada punto del ciclo de vida imprime sus propios pasos, cada uno con lo que
prueba que se ejecutó y, al final, una sola vez, la instrucción de recorrerlos
de corrido; así, `change new` para spec-kit termina con:

```txt
sdd speckit: run /speckit.specify in your agent to write the spec for add-user-auth — give it add-user-auth as the short name so the feature directory matches [proof: specs/<n>-add-user-auth/spec.md — `change plan` refuses without it]
sdd speckit: run /speckit.clarify if the spec still carries [NEEDS CLARIFICATION] markers [ungateable: optional, and its `## Clarifications` session is written by the agent — …]
sdd speckit: run the chain through without asking to continue — stop only for a question the tool itself raises (`--no-sdd` for one run, `sdd_auto: false` to stop printing these)
```

La puerta del brain lista el mismo flujo con cada paso terminando en la ruta de
su prueba o en `[ungateable]`: el motivo por el que un paso no se puede probar
lo imprime, donde se ejecuta el paso, el ciclo de vida, y también lo imprimen
`doctor` y flow.md.

La línea de un paso de OpenSpec nombra además la pregunta del humano que le
corresponde, en todas las superficies, de modo que la puerta por sí sola ya dice
dónde detenerse. Lo demás que los cuerpos de comando propios de openspec le
decían al agente viaja en una **guía**, impresa bajo el paso en su punto del
ciclo de vida y en cualquier rechazo que la vuelva a imprimir, y nunca en la
puerta, en `doctor` ni en flow.md, que lee cada sesión. `change plan` para
OpenSpec termina con:

```txt
sdd opsx: keep writing each artifact `openspec status --change add-user-auth` marks `[ ]` from `openspec instructions <id> --change add-user-auth --json` until tasks.md is written [proof: openspec/changes/add-user-auth/tasks.md — `change apply` refuses without it]
sdd opsx:   design is optional where its instruction says so; skipped, write tasks from `openspec instructions tasks --change add-user-auth --json` though status marks it `[-]`. Its `Next:` apply is not yours before `change apply`
sdd opsx: run the chain through without asking to continue — stop only for a question the tool itself raises (`--no-sdd` for one run, `sdd_auto: false` to stop printing these)
```

Ningún paso de OpenSpec impreso lleva `--yes`, `--skip-specs` ni
`--no-validate`: esos flags responden las preguntas de la propia herramienta, y
la respuesta es tuya.

Spec-kit **no tiene paso de archivo**; el ciclo de vida lo dice en lugar de
inventar uno:

```txt
sdd speckit: close — this tool has no agent-run close step; nothing to run
```

### La compuerta: lo que la herramienta realmente produce {#the-gate-what-the-tool-really-produces}

Cada paso nombra el artefacto que **prueba** que se ejecutó, y el siguiente
comando del ciclo de vida rechaza sin él:

| rechaza | hasta que | opsx | speckit |
| --- | --- | --- | --- |
| `change plan` | exista el equivalente de propose | `openspec/changes/<slug>/proposal.md` | `specs/<n>-<slug>/spec.md` |
| `change apply` | exista el artefacto de plan/tareas | `openspec/changes/<slug>/tasks.md` | `specs/<n>-<slug>/plan.md`, `specs/<n>-<slug>/tasks.md` |
| `change close` | haya ocurrido el equivalente del archivo | `openspec/changes/archive/<n>-<n>-<n>-<slug>` | *no existe paso de archivo, pero mira el libro de registro más abajo* |

Más allá del artefacto, `change close` lee también la lista de tareas que cada
herramienta mantiene (el `tasks.md` archivado para opsx, `specs/<n>-<slug>/tasks.md`
para spec-kit) y rechaza mientras cualquiera de las dos siga con casillas
abiertas. Ese es [el libro de registro propio de la
herramienta](#the-tools-own-ledger), y es la razón por la que el cierre de
spec-kit se comprueba pese a no tener un paso de archivo que probar.

El rechazo nombra el comando, la ruta y dónde buscó, y las líneas que le siguen
traen el arreglo:

```txt
$ mvac change plan add-user-auth
sdd opsx: `change plan add-user-auth` refused — openspec/changes/add-user-auth/proposal.md is missing — looked in brain
  in the brain checkout run `openspec new change add-user-auth --json`, then write each artifact `openspec status --change add-user-auth` marks `[ ]` from `openspec instructions <id> --change add-user-auth --json`; a material ambiguity is the human's question
    `already exists` for a change you did not open in this run is the human's question; otherwise go on. …
  then re-run: multivac change plan add-user-auth
  (`--no-sdd` skips the SDD gates for one run; `sdd_auto: false` in .multivac/config.yml turns them off)
```

La compuerta busca en el checkout del brain y luego en el worktree del cambio,
nombrado según la propia entrada del brain, que es donde `change apply` lleva
los artefactos de un cambio que nombra al brain. Un paso impreso en
`change land` se ejecuta después de que todas las etapas se hayan fusionado, así
que su prueba se lee solo en el checkout del brain: un archivo encontrado solo
en el worktree del cambio nunca llegó al brain, y se rechaza por su nombre:

```txt
sdd opsx: `change close add-user-auth` refused — openspec/changes/archive/<n>-<n>-<n>-add-user-auth is only in the change's worktree, .multivac/worktrees/add-user-auth/brain/openspec/changes/archive/2026-08-16-add-user-auth, which never reaches the brain checkout
  after the merge, in the brain checkout (never a change worktree), run `openspec archive add-user-auth --json` …
    `archive_confirmation_required` saying `Updating`: …
  then re-run: multivac change close add-user-auth
```

— y de él no se lee ninguna lista de tareas.

El SDD vive solo en el brain, así que el checkout de ningún repo de código
prueba un paso (uno que contenga una coincidencia se nombra, nunca se lee; mira
[El SDD vive en el brain](#the-sdd-lives-in-the-brain)). Las dos mitades de esa
búsqueda se dicen en voz alta: el rechazo dice dónde buscó, y el éxito nombra el
artefacto que aceptó:

```txt
sdd opsx: brain: openspec/changes/add-user-auth/proposal.md ok
```

— la misma línea tanto si el archivo estaba en el checkout como en el worktree
del cambio; solo la línea de un libro de tareas nombra la ruta del worktree de
la que se leyó.

`<n>` en una ruta representa una tira de dígitos y nada más: spec-kit numera su
propio directorio de feature (`specs/003-add-user-auth/`) y OpenSpec le pone
fecha a su archivo (`archive/2026-08-15-add-user-auth`), de modo que el nombre
exacto lo elige la herramienta y su forma no. Un directorio que un comodín
aceptaría no prueba nada: `specs/030-points-add-user-auth/` no es el de
`add-user-auth`.

**El veredicto de la herramienta se reutiliza, nunca se reimplementa.**
OpenSpec incluye `openspec validate`, que sabe qué es un cambio bien formado:
encabezados de delta, un escenario por requisito, ningún conflicto con las
especificaciones principales. multivac lo ejecuta para obtener su veredicto y lo
cita tal cual:

```txt
sdd opsx: `change apply add-user-auth` refused — `openspec validate add-user-auth --json --no-interactive` says: Change must have at least one delta
  fix it in the tool, then re-run: multivac change apply add-user-auth
```

Un veredicto aprobado aún puede traer noticias. Cuando falta en la
especificación principal el encabezado de un requisito modificado,
`openspec validate` aprueba y avisa, en un problema de nivel INFO, que el
archivo rechazaría el delta, algo que de otro modo solo sabrías después de
responder que sí al archivar. La compuerta lo imprime y aun así aprueba, porque
la propia herramienta llama válido al cambio:

```txt
sdd opsx: brain: openspec/changes/add-user-auth/tasks.md ok
sdd opsx: `openspec validate add-user-auth --json --no-interactive` passes and notes: Archive would refuse this delta: billing MODIFIED failed for header "### Requirement: Yearly invoice" - not found — fix the delta before `change land`
```

Se invoca un proceso externo solo para la **validación** y el andamiaje. Un
paso en sí nunca se simula ejecutando algo que se le parezca.

**Una compuerta que no se puede evaluar rechaza.** Cuando no se encuentra el
binario del validador, la compuerta no recurre en silencio a "el archivo está,
con eso basta": sería el mismo comando poniéndose en verde en una máquina que no
puede comprobar nada:

```txt
sdd opsx: `change apply add-user-auth` refused — `openspec validate add-user-auth --json --no-interactive` cannot be run — `openspec` found on neither PATH nor brain's node_modules/.bin — install opsx: npm i -g @fission-ai/openspec (https://github.com/Fission-AI/OpenSpec)
  or skip the gates without losing the door: `--no-sdd` for one run, `sdd_auto: false` in .multivac/config.yml for good
```

Hace una sola búsqueda, en la raíz que contiene el artefacto: `PATH` y luego el
`node_modules/.bin` de esa raíz, de modo que un `npm i -D` local al proyecto se
encuentra cuando el artefacto está en el checkout. Si solo se encuentra en el
worktree del cambio (una nueva ejecución de `change apply` tras el traslado),
ese worktree es la raíz: una herramienta instalada solo en el checkout no se
encuentra allí, aunque `doctor` sí la encuentra, y el rechazo sigue nombrando el
`node_modules/.bin` del brain.

Nunca te dice que quites `sdd:`: esa clave también renderiza todo el flujo en la
puerta del brain, así que eliminarla borraría las instrucciones del agente junto
con la comprobación.

### La existencia es la prueba más débil {#existence-is-the-weakest-proof}

Que un archivo esté ahí no significa que alguien lo escribió. Hay dos maneras en
que un artefacto presente no prueba nada, y ambas se rechazan igual que uno
ausente.

**Vacío.** No hace falta declararlo: el artefacto de un paso nunca está
legítimamente vacío, sea cual sea la herramienta. El `setup-plan.sh` de
spec-kit recurre a `rm -f` y luego `touch` cuando no puede resolver una
plantilla, y eso solía pasar sin problema.

**Idéntico byte a byte a la plantilla de la que se copió.** `setup-plan.sh`
ejecuta `resolve_template_content "plan-template" > "$IMPL_PLAN"` como parte de
*iniciar* el paso, así que `plan.md` existe completo antes de que el agente
escriba una palabra:

```txt
sdd speckit: `change apply add-user-auth` refused — brain:specs/003-add-user-auth/plan.md is byte-identical to .specify/templates/plan-template.md: the scaffolding wrote it, nobody has
```

Se comparan archivos completos, nunca un marcador supuesto, y vale la pena
explicar el motivo porque el enfoque obvio es incorrecto. El pin tentador es el
propio encabezado `# Implementation Plan: [FEATURE]` de la plantilla, pero nada
en spec-kit le pide jamás a nadie que cambie esa línea, así que un plan real y
terminado la conserva y una regex sobre ella rechazaría para siempre un trabajo
honesto. La igualdad no tiene ningún falso positivo: un plan escrito nunca es
idéntico byte a byte a su plantilla. Se compara con la plantilla del núcleo y
con `.specify/templates/overrides/plan-template.md`, incluido el esqueleto que
multivac escribe allí:

```txt
sdd speckit: `change apply add-user-auth` refused — brain:specs/003-add-user-auth/plan.md is byte-identical to .specify/templates/overrides/plan-template.md: the scaffolding wrote it, nobody has
```

Lo que esto **no** detecta se dice en lugar de ocultarse: un agente que edita
una línea y se detiene, y un plan que se deja como el `plan-template.md` propio
de un preset, que nunca se compara.

### El libro de registro propio de la herramienta {#the-tools-own-ledger}

Toda herramienta SDD incluye una manera de terminar un paso pasando por encima
de su propia objeción. En modo texto, `openspec archive --yes` imprime `Warning: 4 incomplete task(s) found.
Continuing due to --yes flag.` y archiva igual; `openspec archive <slug>
--json --yes` archiva sobre tareas abiertas y no dice nada en absoluto. El
archivo impreso no lleva `--yes`, así que openspec rechaza primero por sí mismo
las tareas abiertas, con `archive_tasks_incomplete`; pero un `--yes` que tú des
las archiva abiertas igual, de modo que el directorio archivado prueba que el
archivo se ejecutó y nada más. `close` lee la lista de tareas que la propia
herramienta acaba de mover:

```txt
sdd opsx: `change close add-user-auth` refused — brain:openspec/changes/archive/2026-08-16-add-user-auth/tasks.md has 3 open item(s) — openspec archived this change with tasks still unchecked — `--yes` archives over its own refusal, and under `--json` says nothing
    - [ ] 1.2 Backfill existing rows
    - [ ] 1.3 Wire the nightly job
    - [ ] 1.4 Tell the customer
  finish them in the tool, then re-run: multivac change close add-user-auth
```

Esto no es reimplementar las reglas de la herramienta. La herramienta escribió
el archivo y ya decidió qué significa el marcador; multivac solo se niega a
ignorarlo.

La comprobación del libro de registro lleva su **propio** punto del ciclo de
vida, separado del del paso, y ese es todo el diseño. El implement de spec-kit
sigue siendo imposible de bloquear (que se *ejecutara* no deja rastro ni lo
dejará nunca), mientras que si su lista de tareas aún tiene casillas abiertas es
un hecho en disco. Dos preguntas distintas sobre un mismo paso, con respuestas
honestas distintas.

Aun así, no prueba que el trabajo se hiciera. `- [x]` es un carácter que un
agente escribe sobre su propio trabajo. Prueba que el libro de la propia
herramienta no dice UNDONE, lo cual es estrictamente más de lo que probaba el
artefacto antes.

### Los pasos imposibles de bloquear se declaran, nunca se simulan {#ungateable-steps-are-stated-never-faked}

Algunos pasos no dejan nada tras de sí, por su propio diseño. Esos se declaran
imposibles de bloquear, con el motivo, y simplemente no se bloquean: igual los
ejecutas.

| paso | por qué nada puede probarlo |
| --- | --- |
| `openspec instructions apply --change <slug> --json` | su único rastro es `- [x]` en `tasks.md`, un carácter que el agente escribe sobre su propio trabajo |
| `/speckit.clarify` | es opcional, y su sesión `## Clarifications` es texto del propio agente: nunca muestra que un humano respondió |
| `/speckit.analyze` | es ESTRICTAMENTE DE SOLO LECTURA según su propia especificación: escribe cero bytes |
| `/speckit.implement` | "todas las tareas `[X]`" es el agente calificando su propia tarea |
| `/speckit.converge` | un converge limpio tiene prohibido tocar `tasks.md`: el éxito es invisible en disco |

### La pregunta que openspec hace al archivar {#the-question-openspec-asks-at-archive}

El paso land imprime `openspec archive <slug> --json` sin ningún flag. En un
cambio que lleva deltas de especificación, openspec no archiva: termina con
código 1, no escribe nada y pregunta:

```json
{ "archive": null, "status": [ { "severity": "error", "code": "archive_confirmation_required",
  "message": "Updating 2 spec(s) requires confirmation: rerun with --yes.",
  "fix": "openspec archive <change-name> --json --yes" } ] }
```

Esa pregunta es **tuya**, nunca del agente, y la línea del paso lo dice en todas
las superficies: un flag que su `fix` nombra nunca lo agrega el agente. La guía
bajo el paso en `change land` le indica al agente qué hacer con ella:

- **Mostrarte primero los deltas.** `openspec show <slug> --json --deltas-only`
  imprime lo que se fusionaría en `openspec/specs/`, y tampoco escribe nada.
- **Ofrecer las tres respuestas de la propia herramienta.** Sí: `openspec archive <slug> --json
  --yes`, y luego transmitir sus `warnings`. Archivar sin fusionar: `openspec archive
  <slug> --json --skip-specs`, que es lo que hace el prompt interactivo de
  openspec con `n`. Cualquier otra cosa: detenerse.
- **Los demás códigos no son esa pregunta.** `archive_tasks_incomplete` se
  resuelve terminando las tareas donde corrió apply, o con que tú las quites de
  `tasks.md`, nunca marcando casillas para pasar. Cualquier otro código se
  corrige y el archivo se vuelve a ejecutar sin flag, nunca con `--no-validate`.
  `unknown option '--json'` significa que openspec es más antiguo de lo que este
  flujo necesita.

Un cambio sin delta de especificación se archiva de inmediato, así que no
pregunta nada. Si el agente preguntó, en lugar de agregar él mismo el flag, no
deja nada en disco; lo que aterriza es tu respuesta, y close sigue leyendo [el
libro de registro propio de la herramienta](#the-tools-own-ledger).

La respuesta `--skip-specs` del mismo paso deja las especificaciones principales
como estaban, así que `change close` no lista ninguna en su commit: una
especificación principal se lista solo cuando lleva la fusión (mira [Qué aterriza
close](#the-sdd-lives-in-the-brain)).

### Cuerpos de comando que dejó un init anterior {#command-bodies-an-earlier-init-left}

Un brain de OpenSpec generado antes de que los pasos pasaran a ser los verbos de
terminal de openspec recibió un cuerpo de comando por flujo de trabajo, por
harness: `.claude/commands/opsx/`, las skills `openspec-*` bajo
`.claude/skills/`, `.agents/skills/` y los demás directorios de harness. Ningún
paso impreso los nombra ahora, y una sesión aún lee su listado. `doctor` nombra
lo que queda en el brain, una línea después de la línea de instalación del
brain, y nunca falla por ello:

```txt
sdd        opsx @ brain: an earlier init left command bodies no printed step names — `git rm -r .agents/skills/.openspec-target .agents/skills/openspec-* .claude/commands/opsx .claude/skills/openspec-*` removes them; they are not code, so the commit needs no open change
```

Las entradas hermanas que comparten `openspec-` u `opsx-` se colapsan en un solo
patrón, que tu shell expande antes de que `git rm -r` lo vea; por eso un patrón
se imprime solo cuando todas las entradas que alcanza en disco están
rastreadas, o todas están sin rastrear, y en caso contrario las entradas se
listan una por una. Las entradas que git no rastrea se nombran aparte, para
borrarlas a mano, ya que `git rm -r` falla con una ruta que no rastrea:

```txt
sdd        opsx @ brain: an earlier init left command bodies no printed step names — `git rm -r .claude/commands/opsx` removes them, and .codex/skills/openspec-explore are untracked: delete them; they are not code, so the commit needs no open change
```

Toda entrada que un init de OpenSpec escribe bajo cualquier directorio de
harness, y bajo `.codex/`, **no es código**, sean cuales sean las puertas que el
brain declara hoy; por eso la eliminación se commitea en cualquier rama, sin
ningún cambio abierto. La coincidencia es por los nombres que dan los inits de
openspec (`openspec-*`, `.openspec-*`, `opsx`, `opsx-*`), así que una entrada
tuya bajo un nombre así se nombra junto con ellas.
### Instalar a mano los cuerpos de openspec {#installing-openspecs-bodies-by-hand}

Si quieres los cuerpos de comandos propios de openspec — sus flujos explore, sync o update, que el ciclo de vida nunca imprime — instálalos tú mismo:

```bash
openspec init --tools claude --no-animation .
```

Ejecutado sobre un brain generado por init, conserva `openspec/config.yaml` y agrega
solo los directorios de harness de las claves que nombres; las claves son las de
la tabla de integración de más arriba. Volver a ejecutarlo, o `openspec update`, sobre
cuerpos ya instalados escribe `~/.config/openspec/config.json` en tu directorio
home, y `openspec update` además consulta el registro de npm. Ningún paso impreso nombra esos
cuerpos, y `doctor` los nombra como restos de un init anterior.

### El documento a nivel de proyecto {#the-project-level-document}

Spec-kit lleva una constitución — `.specify/memory/constitution.md`, escrita
una vez y **enmendada** a medida que el producto avanza. Es del brain: el ecosistema
tiene una, y a ningún repo de código se le pide la suya. Viene como una plantilla sin completar, de modo que
un brain intacto tiene un marcador de posición y no una constitución. Ambas puertas del brain
llevan la instrucción de crearla si falta — `init` la escribe en la puerta que
genera init, `doors` en la puerta del brain, porque `doors` es un segundo comando y
una constitución que el agente solo conoce en el segundo comando es una que nadie
escribe — y `doctor` la reporta:

```txt
sdd        speckit project law @ brain: .specify/memory/constitution.md missing → run /speckit.constitution in your agent to write the project principles …
sdd        speckit project law — revisit: once at start, then on every principle change: amend it in place, bump CONSTITUTION_VERSION by semver (MAJOR removes/redefines, MINOR adds, PATCH clarifies); commit no Sync Impact Report. …
```

La revisión indica no hacer commit de ningún reporte de enmienda. `/speckit.constitution` escribe
uno para revisión, y el propio comando de spec-kit lo llama borrador que se elimina antes de que la
constitución enmendada se confirme con commit; git y el cambio que enmendó el documento
guardan el registro. Un reporte confirmado dentro de la constitución lo lee cada paso
que lee la constitución, en cada cambio posterior.

Que la herramienta la haya generado no equivale a que esté escrita. `specify init` instala `constitution.md`
idéntico byte a byte a su propia plantilla, así que el archivo existe en todo repo nuevo y
su existencia no prueba nada. Un documento sigue siendo la plantilla cuando es
idéntico byte a byte a la que spec-kit registró en
`.specify/memory/.constitution-template.json`, o cuando todavía lleva uno de
los tokens propios de la plantilla, como `[PROJECT_NAME]`. La línea dice cuál lo decidió
— aquí, la plantilla generada sin tocar; un archivo editado que conserva un token dice
`placeholders remain: [PROJECT_NAME]` en su lugar:

```txt
sdd        speckit project law @ brain: .specify/memory/constitution.md is still the unfilled template shipped by the tool (byte-identical to the template recorded in .specify/memory/.constitution-template.json) → run /speckit.constitution …
```

Una constitución escrita puede conservar los comentarios HTML de la plantilla, y puede citar
`[1]` o `[API]`: solo cuentan los tokens propios de la plantilla, fuera de los comentarios.

Esos estados también son una **compuerta**. `change plan` rechaza mientras el documento
falte, sea ilegible, esté vacío o siga siendo la plantilla. Los tokens son los que
`/speckit.constitution` pide explícitamente al autor reemplazar, así que una
constitución escrita no tiene ninguno:

```txt
sdd speckit: `change plan <slug>` refused — brain:.specify/memory/constitution.md is missing or unreadable
  run /speckit.constitution in your agent to write the project principles …
  then re-run: multivac change plan <slug>
```

Solo `plan`, y solo ese: el documento es lo que lee la propia Constitution Check de
`/speckit.plan`, así que es el primer punto en que su ausencia cambia
el trabajo. No se juzga nada del contenido del documento — tres líneas reales
pasan, y también una constitución con la que nadie está de acuerdo.

La desactualización es la mitad interesante: cuando la fila más nueva de la ley es más nueva que la
constitución, la ley del producto se movió y su constitución no.

```txt
sdd        speckit project law @ brain: .specify/memory/constitution.md present (last modified 2026-08-01) but the law's newest row is 2026-08-15 — STALE: the law moved while this did not; a report, never a gate
```

Sigue siendo un reporte. Si un principio todavía encaja con el producto es un juicio,
y ninguna fecha de modificación de archivo puede emitirlo.

`change new` pide el documento antes de que `change plan` rechace por su causa. Cuando
la herramienta está instalada en el brain y el documento no está escrito, imprime
una línea. Esa línea no le dice al agente que continúe sin supervisión: los
principios vienen de ti.

```txt
sdd speckit @ brain: .specify/memory/constitution.md is template (byte-identical to the template recorded in .specify/memory/.constitution-template.json) — run /speckit.constitution in your agent … Ask the human for the principles and write their answers; `change plan` refuses until it is written
```

Cuando un documento de proyecto y una fila activa de `.multivac/invariants.md`
no coinciden, gana la fila. Enmienda el documento, o cambia la fila mediante un cambio.
La puerta del brain lo dice.

El equivalente más cercano de OpenSpec es `context:` en `openspec/config.yaml`.
`openspec init` lo escribe comentado, openspec lo llama opcional, e
ignora uno de más de 51200 bytes. multivac lo reporta y nunca bloquea por él.

### `sdd_auto` y `--no-sdd` {#sdd_auto-and---no-sdd}

Dos formas de desactivarlo, en dos alcances. Ambas desactivan **los pasos y las compuertas**:

| | alcance | efecto |
| --- | --- | --- |
| `sdd_auto: false` en la config | permanente | el adaptador sigue declarado y reportado; no se imprime nada y nada se bloquea |
| `--no-sdd` en una invocación de `change` | esta ejecución | omite lo impreso y el rechazo una vez |

Ninguna impide que `change close` liste los directorios de slug del brain en el
commit que imprime y cite uno en el cuerpo del cambio: los interruptores omiten los pasos
y sus compuertas, nunca lo que ya estaba escrito. Con `sdd_auto: false`, la
puerta del brain, flow.md y `doctor` también dejan de decir que algo rechaza; flow.md y
`doctor` dicen que ningún comando ejecuta el init, y `doctor` no nombra ningún código que el SDD
gobierne, ya que la compuerta de código también está desactivada.

```txt
sdd        opsx @ brain: missing (no openspec) — declared but never run here; under `sdd_auto: false` no command runs the tool's own `openspec init --tools none --no-animation .`: run it there yourself, doctor never does (it writes the vendor's files into the tree) · binary ok · sdd_auto: false — the lifecycle prints nothing and gates nothing; run the steps yourself
```

Ese es el modo de exploración. `doctor` sigue reportando el adaptador en ambos casos —
desactivar la automatización no es lo mismo que dejar de declararlo; igual quieres
saber que la herramienta está instalada y que el binario está al día.

## Detección en init {#detection-at-init}

Cuando escribe la config y `--sdd` no nombra ninguno, `init` propone el adaptador que
encuentra, comentado, nunca habilitado — primero `openspec/`, de modo que un repo que tenga ambos
recibe solo `opsx`; una config que ya esté ahí se deja como está:

| encontrado en disco | propuesto |
| --- | --- |
| `openspec/` | `sdd: opsx` |
| `.specify/` | `sdd: speckit` |

```yaml
# detected speckit artifacts — uncomment to enable:
# sdd: speckit
```

Detectar, luego preguntar. Que exista un directorio es evidencia, no consentimiento.
