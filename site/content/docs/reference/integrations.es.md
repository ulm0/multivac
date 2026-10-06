---
title: Integraciones con agentes
weight: 3
---

Escribes la puerta una sola vez. multivac la proyecta en el harness que use
la persona que tenga delante.

La puerta canónica es **`AGENTS.md`** en la raíz del repo — en el brain y en
cada repo declarado donde multivac pueda escribir (sin `managed: false`, sin
clon superficial). Todo lo demás en esta página es una proyección de ese único
archivo. Agregar un harness es una entrada en `src/adapters/registry.ts`, que
viaja dentro del paquete: `doors` y `doctor` despachan según el `kind` de la
entrada, nunca según su nombre, así que un harness nuevo es solo datos. Cada
entrada registra la documentación del proveedor contra la que se verificó.

Selecciónalos en `.multivac/config.yml`:

```yaml
doors: [agents, claude, cursor, opencode, codex, windsurf, gemini, copilot]
```

Luego `mvac doors`. Ese es todo el paso de adopción: `init` conserva una
configuración existente, así que volver a ejecutarlo nunca recoge la entrada
nueva.

## Los cuatro tipos {#the-four-kinds}

| kind | qué escribe `doors` | entradas |
| --- | --- | --- |
| `canonical` | `AGENTS.md` mismo — la fuente desde la que se proyectan todos los demás tipos | `agents` |
| `native` | **nada.** El harness ya lee `AGENTS.md`; un segundo archivo sería una paráfrasis | `opencode`, `codex`, `windsurf`, `cursor` |
| `symlink` | un segundo nombre para los mismos bytes: `<door> → AGENTS.md` | `claude`, `gemini` |
| `stub` | un archivo pequeño en la ruta del harness: frontmatter opcional al crearlo, luego el bloque gestionado, que apunta a `AGENTS.md` | `copilot` |

No existe un tipo para "no se puede poseer". Un harness cuya puerta multivac no
puede escribir recibe **ninguna entrada**, porque una entrada es la forma en que
esta herramienta dice *compatible*: aparece en la ayuda de `init --provider`, en
la tabla de arriba y en el recuento de con qué se integra multivac. `aider` tuvo
una durante un tiempo, con una nota que explicaba largamente por qué nada de eso
aplicaba; para quien no la abría, se leía como compatibilidad. Un nombre
desconocido ya recibe la lista de lo que sí es compatible, que es la respuesta
que ayuda.

Cursor era un `stub` hasta que multivac dejó de proyectar uno: lee `AGENTS.md` en la raíz del proyecto, así que
el archivo de reglas era una segunda puerta que podía contradecir a la canónica. Un destino que retira un archivo que solía proyectar se lo lleva consigo:
una ejecución de `doors`, con `cursor` todavía en `doors:`, quita el bloque de multivac de `.cursor/rules/multivac.mdc` y
borra el archivo cuando solo queda el frontmatter que escribió el propio multivac,
y dice cuál de las dos cosas hizo. Las líneas que agregaste ahí sobreviven, y el archivo
se queda con ellas, frontmatter (`alwaysApply: true`) incluido.

Todo lo que multivac escribe en un archivo de puerta que no posee por completo queda entre
`<!-- multivac:begin -->` y `<!-- multivac:end -->`. El contenido fuera de ese
bloque es tuyo y nunca se toca — también en una puerta `stub`, que lee el
archivo antes de escribirlo y agrega su frontmatter solo al crear el
archivo. El tipo stub solía escribir su archivo completo, lo que hacía falsa esa frase
para `.github/copilot-instructions.md` y `.cursor/rules/multivac.mdc`.

## Cómo se ve una ejecución {#what-one-run-looks-like}

```txt
$ mvac doors
brain: door + hooks updated
brain: .multivac/flow.md — what your declarations oblige, sorted; generated, binds nothing
```

```txt
$ mvac doctor
doors      agents: AGENTS.md ok · claude: CLAUDE.md ok (symlink) · cursor: AGENTS.md ok (read natively) · opencode: AGENTS.md ok (read natively) · codex: AGENTS.md ok (read natively) · windsurf: AGENTS.md ok (read natively) · gemini: GEMINI.md ok (symlink) · copilot: .github/copilot-instructions.md ok
```

---

## `agents` {#agents}

| | |
| --- | --- |
| archivo escrito | `AGENTS.md` |
| tipo | `canonical` |
| skill | — |
| configuración de hooks | — |
| fuente | <https://agents.md/> |

La puerta canónica. Todos los demás destinos se proyectan desde este archivo, y `doors`
lo escribe esté o no `agents` en tu lista. En el brain apunta a
la ley, los cambios, el ritual y `verify`, y dice que el brain está vacío
mientras la tabla de la ley no tenga ninguna fila que no esté retirada; en un repo consumidor indica dónde está montado
el brain, qué obliga y que un cambio puede cruzar repos.

`init` y `doors` lo escriben ambos: cualquiera de los dos lo crea cuando falta y
refresca su bloque gestionado cuando existe.

## `claude` {#claude}

| | |
| --- | --- |
| archivo escrito | `CLAUDE.md` |
| tipo | `symlink` → `AGENTS.md` |
| skill | `.claude/skills/multivac/` |
| configuración de hooks | `.claude/settings.json` — `hooks.SessionStart` y `hooks.PostToolUse` → `mvac verify`, envuelto por evento para que una ejecución en rojo llegue al modelo |
| detectado por | un `CLAUDE.md` existente |
| fuente | <https://code.claude.com/docs/en/memory> |

Claude Code lee `CLAUDE.md`, no `AGENTS.md`; su propia documentación da
`ln -s AGENTS.md CLAUDE.md` como la forma de compartir un solo archivo, así que eso es exactamente
lo que crea `doors`.

Esta es la única entrada con las tres clases de artefacto. Además del enlace simbólico,
`doors` copia el skill empaquetado en `.claude/skills/multivac/` y fusiona
las entradas de hooks de multivac en `.claude/settings.json`, preservando cada clave
y entrada que no le pertenece:

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

`SessionStart` atrapa a un brain que miente antes de que el agente conciba código encima
de él, en una línea cuando todo está en orden y completo en caso contrario; `PostToolUse`
vuelve a comprobar después de cada edición, en el checkout del archivo escrito cuando un brain
lo gobierna, y mientras esté en verde nada llega al modelo. Ambos ejecutan la política
**por defecto**, no `--strict`, y ningún comando lleva un interruptor: `verify` lee
el payload de hook propio del harness (consulta
[hooks](/docs/reference/hooks/#harness-hooks--the-early-ceiling)).

El directorio del skill es un **espejo**, no una acumulación: cada ejecución borra
todo lo que haya bajo `.claude/skills/multivac/` que el paquete ya no distribuya —
incluido un archivo que hayas puesto tú, porque nada en el disco dice quién
lo escribió. Tus propios skills viven a su lado: `doors` nunca toca un hermano bajo
`.claude/skills/`, solo el único directorio que escribe. Lo que multivac posee aquí es
el comando individual, coincidente de forma exacta — nunca una entrada que simplemente lo mencione
— y el conjunto que posee son los tres comandos que multivac ha escrito, de modo que un brain
proyectado con el comando sin envolver se actualiza en su lugar en vez de ganar una
segunda compuerta junto a la muda. El envoltorio difiere por evento porque Claude
Code lee cada hook de vuelta por un solo canal; el contrato y sus razones están
en [hooks](/docs/reference/hooks/#harness-hooks--the-early-ceiling).
`mvac verify --strict` es tu hook y queda
intacto, los comandos que agregues junto a los de multivac se quedan donde están, y el matcher de
una entrada es tuyo. La regla y el aviso que imprime están en
[hooks](/docs/reference/hooks/#what-preserving-means-here).

Si `CLAUDE.md` ya existe como archivo regular, `doors` se niega a reemplazarlo
y dice qué hacer:

```txt
api: notice: CLAUDE.md exists as a regular file — merge it into AGENTS.md and remove it to get the symlink
```

Donde no se puede crear el enlace simbólico — Windows sin modo desarrollador, por ejemplo —
`doors` no crea `CLAUDE.md` e imprime `symlink not permitted on this platform —
read AGENTS.md directly, or enable developer mode to get CLAUDE.md`.

## `cursor` {#cursor}

| | |
| --- | --- |
| archivo escrito | nada — Cursor lee `AGENTS.md` de forma nativa |
| tipo | `native` |
| detectado por | un directorio `.cursor/` existente |
| fuente | <https://cursor.com/docs/context/rules> |

Cursor lee `AGENTS.md` en la raíz del proyecto, así que no hay nada que proyectar:
un archivo de reglas bajo `.cursor/rules` sería una segunda puerta que podría contradecir
a la canónica. El stub que este destino solía escribir está retirado — consulta
[Los cuatro tipos](#the-four-kinds) para ver qué hace con él una ejecución de `doors`.

## `opencode` {#opencode}

| | |
| --- | --- |
| archivo escrito | ninguno — `AGENTS.md` es la integración |
| tipo | `native` |
| detectado por | un `opencode.json` existente |
| fuente | <https://opencode.ai/docs/rules/> |

opencode lee `AGENTS.md` en la raíz del proyecto y hacia arriba en el árbol. No hay
nada que proyectar: los archivos de instrucciones adicionales irían bajo `instructions` en
`opencode.json`, que multivac no posee.

`doors` no escribe nada para `opencode`. Declararlo cambia lo que
informa `doctor`, que es la puerta canónica en nombre de opencode:

```txt
opencode: AGENTS.md ok (read natively)
```

La declaración también llega al init propio de la herramienta SDD: cuando spec-kit está declarado
y aún no se ha ejecutado, `opencode` como primera puerta que mapea hace que ese init escriba
`.opencode/` ([el scaffold](../sdd#the-scaffold-declaring-a-tool-that-has-never-run-here)).

Si falta `AGENTS.md`, `doctor` nombra `multivac init .` para una entrada nativa,
igual que para la canónica. Nunca nombra `init .` para una entrada de enlace simbólico o stub:
esas reciben `multivac doors` cuando falta su propio archivo, el enlace simbólico
apunta a otra parte o el archivo carece del bloque gestionado.

## `codex` {#codex}

| | |
| --- | --- |
| archivo escrito | ninguno — `AGENTS.md` es la integración |
| tipo | `native` |
| detectado por | un directorio `.codex/` existente |
| fuente | <https://learn.chatgpt.com/docs/agent-configuration/agents-md> |

Codex lee `AGENTS.md` desde la raíz de git hasta el directorio de trabajo,
concatenados, el más cercano al final. Nada que proyectar; su propia configuración es
`.codex/config.toml`, que multivac no escribe.

## `windsurf` {#windsurf}

| | |
| --- | --- |
| archivo escrito | ninguno — `AGENTS.md` es la integración |
| tipo | `native` |
| detectado por | un directorio `.windsurf/` existente |
| fuente | <https://docs.windsurf.com/windsurf/cascade/agents-md> |

Cascade trata un `AGENTS.md` en la raíz como una regla siempre activa, y uno en un
subdirectorio como una regla glob para ese directorio. El mecanismo heredado
`.windsurf/rules/*.md` todavía funciona pero necesita su propio frontmatter,
así que multivac se queda con el archivo canónico.

## `gemini` {#gemini}

| | |
| --- | --- |
| archivo escrito | `GEMINI.md` |
| tipo | `symlink` → `AGENTS.md` |
| detectado por | un directorio `.gemini/` existente |
| fuente | <https://geminicli.com/docs/cli/gemini-md/> |

Gemini CLI lee `GEMINI.md` por defecto. *Se puede* apuntar a `AGENTS.md`
con `context.fileName` en `.gemini/settings.json` — pero el enlace simbólico no necesita
archivo de configuración ni fusionarse con el JSON de otra persona, así que eso es lo que
proyecta multivac.

## `copilot` {#copilot}

| | |
| --- | --- |
| archivo escrito | `.github/copilot-instructions.md` |
| tipo | `stub`, sin frontmatter |
| detectado por | un `.github/copilot-instructions.md` existente |
| fuente | <https://docs.github.com/en/copilot/reference/custom-instructions-support> |

Copilot lee `AGENTS.md` en *algunas* superficies — el agente en la nube, el chat de VS Code,
Copilot CLI — pero `.github/copilot-instructions.md` es la única ruta compatible
en todas partes. Acepta markdown simple sin frontmatter, así que el stub es el
bloque gestionado y nada más:

```markdown
<!-- multivac:begin -->
Read `AGENTS.md` at the repo root — the multivac door: what is law here, where the brain lives. Run `multivac verify` before you commit.
<!-- multivac:end -->
```


## Tres clases de artefacto {#three-artifact-classes}

En todas las entradas, multivac escribe como máximo tres tipos de cosa — una puerta,
hooks y un skill — y se distinguen por *cuándo los lee el agente*: la tabla
está en [Distribución](../../concepts/distribution/#skills-the-third-artifact-class).

Solo `claude` tiene hoy las tres. Los hooks de git se instalan para **cada**
repo al que llega `doors`, sin importar qué entradas de harness declaraste — consulta
[Hooks](../hooks).

## Detección {#detection}

`init` busca la ruta `detect` de cada entrada del registro que tenga una y
escribe lo que encontró, más allá de lo que `--provider` ya nombró, como una **propuesta comentada**,
nunca como una clave habilitada:

```yaml
doors: [agents]
# detected claude, cursor artifacts — to project the door there, use:
# doors: [agents, claude, cursor]
```

Detectar, luego preguntar. multivac nunca habilita una integración porque un directorio
haya existido por casualidad.
