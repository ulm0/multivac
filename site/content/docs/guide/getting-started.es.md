---
title: Primeros pasos
weight: 2
---

Esta página supone que el binario está en tu `PATH`. Si no lo está,
[Instalación](../install) es un solo comando.

## `mvac init .` {#mvac-init-}

Ejecútalo en el directorio que se convertirá en el brain, el repo desde el que
desarrollas todo el ecosistema:

```txt
$ mvac init .
init: git init — the brain is git-native
init: wrote .multivac/config.yml — declare your repos under repos:
init: wrote AGENTS.md — the door; your agent reads it first
init: wrote .multivac/invariants.md — the law table, zero rows
init: wrote .multivac/ritual.md — candidates, all commented; uncomment what your team owes each other
init: hooks in .multivac/hooks (core.hooksPath) — verify runs on commit

init: done — the brain is scaffolded and empty. Session zero fills it:
init:   before step 0, declare every repo this brain governs under `repos:` in .multivac/config.yml — once committed, the config changes only inside a change
init:   0. commit what was just written: git add -- .multivac AGENTS.md && git commit -m "multivac init"
init:   1. load the multivac skill in your agent — it carries both protocols
init:   2. `multivac repos sync` — clones every declared repo and installs its declared tools
init:   3. discovery, for code that exists — `multivac seed` inventories it, then draft proposed claims from it
init:      interview, for code that does not — the law comes from a human, claim by claim ← this repo holds none
init:   4. a human enacts each row in .multivac/invariants.md, then `multivac doors` and `multivac verify`
```

El paso 3 es la bifurcación que activa [Sesión cero](../session-zero). `init`
imprime ambas y marca la que corresponde a este directorio: en una primera
ejecución, cualquier archivo que git no ignore implica descubrimiento y un repo
vacío implica la entrevista; una configuración conservada decide según si
declara el brain como uno de sus repos. Un brain nuevo para código que vive en
otros repos está vacío, y aun así requiere descubrimiento. Declara `repos:`
antes del primer commit: después de él, una configuración modificada necesita un
cambio abierto.

Exactamente estos archivos, nada más:

```txt
AGENTS.md                    the door — first thing any agent reads
.multivac/invariants.md      the law table, zero rows
.multivac/changes/           one file per ecosystem change (a `.gitkeep` for now)
.multivac/config.yml         the registry: repos, doors, adapters
.multivac/ritual.md          the closing ceremony, candidate lines all commented out
.multivac/projected.yml      the version this brain was brought to; only `doors --adopt` moves it
.multivac/hooks/pre-commit   runs `mvac verify` on every commit
.multivac/hooks/pre-push     same, on push
.multivac/hooks/pre-merge-commit  same, on a local merge
.multivac/.gitignore         ignores .multivac/cache/ and .multivac/worktrees/
```

`AGENTS.md` es el único archivo que multivac escribe en la raíz, porque ahí es
donde lo leen los harnesses; todo lo demás que le pertenece vive bajo
`.multivac/`, fuera del camino de tu propio contenido. `git init` se ejecuta
solo cuando el directorio aún no es un repo. `core.hooksPath` apunta a
`.multivac/hooks/`, de modo que los hooks están versionados y viajan con el
clon; `multivac doors` los arma en cada clon nuevo. La excepción es un repo cuyo
`core.hooksPath` ya nombra un directorio propio, o que tiene `.husky/` y no
tiene `core.hooksPath`: los shims van a ese directorio donde el nombre del hook
esté libre, y `core.hooksPath` queda como estaba. Un hook que ya esté ahí y no
ejecute multivac se deja intacto, e `init` imprime la línea que debes agregarle.

En un repo que ya tiene sus propias convenciones, `init` revisa antes de
escribir: a un `.gitignore` que se tragaría el brain se le agregan negaciones
explícitas (y el reporte lo dice), y una configuración de hooks existente
— `.git/hooks/`, husky, lefthook, el framework pre-commit — se encadena o se
instala al lado, nunca se reemplaza en silencio. Consulta
[Hooks](../../reference/hooks/) para ver las estrategias.

Volver a ejecutar `init` es seguro: un `.multivac/config.yml` existente se
conserva, un `AGENTS.md` existente nunca se pisa — multivac solo reescribe su
bloque gestionado, entre `<!-- multivac:begin -->` y `<!-- multivac:end -->`. El
resto del archivo es tuyo.

`init` también detecta lo que ya hay en el directorio — `CLAUDE.md`,
`.cursor/`, `openspec/`, `.specify/` — y escribe propuestas comentadas en
`config.yml` (`# doors: [agents, claude, cursor]`, `# sdd: opsx`). Los flags
promulgan en lugar de proponer:

```sh
mvac init . --provider claude,cursor --sdd opsx
```

Los flags son configuración, no magia de un solo uso: quedan en
`.multivac/config.yml`. Adoptar Cursor dentro de tres meses es una línea en ese
archivo más `mvac doors`, no volver a ejecutar init. Por defecto es `doors: [agents]`:
solo `AGENTS.md`, que ya leen Codex, opencode y Cursor. Claude Code lee
`CLAUDE.md` y no `AGENTS.md`, que es toda la razón por la que la puerta `claude`
es un symlink — `--provider claude` es lo que la agrega.

## Qué dice el brain vacío {#what-the-empty-brain-says}

`AGENTS.md` después de init — el archivo completo es un único bloque gestionado:

```markdown
<!-- multivac:begin -->
## multivac — brain door

This repo is the brain: the source of law and change for its ecosystem.

- Law lives in `.multivac/invariants.md`. Cite rows by ID; a rule quoted without its ID does not bind.
- Every ecosystem decision enters as a change: see `.multivac/changes/` and run `multivac change`.
- The ritual — the closing ceremony no tool can check — is `.multivac/ritual.md`; `change close` prints it, you walk it.
- Check the law against the code before acting: `multivac verify`.

brain empty — load the multivac skill to fill it.
<!-- multivac:end -->
```

Con `--sdd`, la puerta también lleva el flujo de esa herramienta, e `init` lo
instala en el brain — o, si no encuentra el binario de la herramienta ni en el
`PATH` ni en el `node_modules/.bin` del brain, rechaza con salida 1 antes de
escribir nada. Un brain cuyo directorio ya contiene algún archivo que git no
ignora es también un repo de código, así que su nueva configuración recibe
`brain: .`; un brain nuevo para código que vive en otros repos está vacío, y
declara esos repos en su lugar. El SDD se queda en el brain: ahí se escriben las
especificaciones de cada cambio, y ningún repo de código lo instala. Para
spec-kit, la instalación también escribe tres plantillas esqueleto donde
spec-kit busca primero, y lo dice:

```txt
sdd speckit: scaffolded — brain:.specify is there now; its steps are runnable; skeleton: .specify/templates/overrides/{spec,plan,tasks}-template.md
```

`.multivac/invariants.md` es la tabla de la ley con su formato y cero filas:

```markdown
# Invariants

| ID | statement | authority | state | date | source |
| --- | --- | --- | --- | --- | --- |
```

Y `verify` ya es honesto con el vacío:

```txt
$ mvac verify
0 claims · 0 anchored
  read      brain: working tree on main — the brain's own repo, the commit this run gates

  enact     not answered — nothing staged, so no commit is being composed; … reads the index against HEAD

0 blocking broken · exit 0
```

Partes de cero y la herramienta ya es útil. La cobertura se cuenta, nunca se
aparenta.

## Siguiente {#next}

Declara tus repos en `.multivac/config.yml`, antes del primer commit. Una vez
que la configuración está commiteada, cambiarla requiere un cambio abierto:

```yaml
doors: [agents]
brain_url: git@example.com:acme/brain.git   # what every consumer mounts
repos:
  api: ../acme-api          # bare string = shorthand for { path: ... }
  payments:
    path: ../payments
    url: git@example.com:acme/payments.git   # cloned by `repos sync` if missing
```

La clave (`api`) es el nombre de registro que usan las anclas — nunca el nombre
del directorio.

Luego pon cada repo al día y dale a cada uno su puerta:

```bash
mvac repos sync   # clone what is missing, mount the brain, install the brain's SDD
mvac repos check  # offline: is each repo the declared clone, with its tools and documents set up
mvac doors        # write each repo's door and hooks
```

`repos sync` monta el brain en `.brain` en cada repo donde multivac puede
escribir y lo deja en staging; haz commit de él en cada uno. Un repo declarado
`managed: false`, y un clon superficial, son de solo lectura y no reciben
montaje. `brain_url` tiene que ser la dirección desde la que todos clonan el
brain — `init` sugiere tu `origin`, pero puede ser un alias ssh que solo conoce
tu máquina. Ejecuta los mismos comandos de nuevo cada vez que declares otro
repo: `repos sync` clona el nuevo, hace fetch de los repos que ya están en disco
y monta el brain en cada repo con permiso de escritura que aún no lo tenga.

### ¿Un solo repo? Dilo {#one-repo-say-so}

Cuando el brain ES el repo de código — la forma habitual de un proyecto único —
decláralo con la clave reservada `brain`:

```yaml
doors: [agents]
# brain==code: this repo is both the brain and the code it governs.
repos:
  brain: .
```

`mvac init` escribe esa entrada `brain: .`, con unas pocas líneas de comentario
alrededor, cuando escribe la configuración de un repo que ya contiene algún
archivo que git no ignora. Entonces las anclas apuntan a `brain:<glob>`, `mvac change` crea ramas
aquí mismo, y `doctor` deja de buscar un montaje del brain que no hay razón
para tener — nada se agrega como submódulo de sí mismo. Los repos hermanos son
más claves junto a esa cuando el proyecto crece hasta ser un ecosistema.

Luego llena el brain: [Sesión cero](../session-zero).
