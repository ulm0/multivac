---
title: Instalación
weight: 1
---

```sh
npx multivac@latest init
```

Eso es todo. Sin instalar, sin clonar, sin global.

## Requisitos {#requirements}

| requisito | por qué |
| --- | --- |
| **Node.js ≥ 24** | declarado en `engines`; la CLI es ESM y usa APIs modernas de `node:` |
| **git** | `verify` invoca `git ls-files`; el brain y cada repo son nativos de git |

Nada más. Tres dependencias de ejecución — `picomatch`, `yaml` y `citty` — y esa cantidad es en sí misma ley: la tercera llegó como un cambio de diseño, con la fila y la constitución movidas antes que el paquete, y una cuarta enfrentaría lo mismo.

## Pruébalo y luego quédate con él {#try-it-then-keep-it}

`npx` descarga y ejecuta sin instalar nada, que es la forma adecuada para el primer comando que ejecutas contra un repo:

```sh
npx multivac@latest init          # write the brain
npx multivac@latest doctor        # what is declared, what was found
```

Cuando sepas que lo quieres, ponlo en tu `PATH` para que los hooks también lo encuentren:

```sh
npm i -g multivac@latest
# or: pnpm add -g multivac@latest
```

**A los hooks les importa cuál de las dos hiciste.** Los shims ejecutan el multivac más específico que encuentran: el build propio de este repositorio cuando el repositorio es multivac, luego el multivac que declara (`npx --no-install multivac`), luego `mvac` en el `PATH`. `npx --no-install` resuelve un paquete ya presente en el proyecto, no uno que tenga que descargar — así que una instalación global, o multivac como devDependency del brain, activan ambas el piso. `npx multivac@latest` escrito a mano no lo hace, porque nada persiste.

Publicado en npm, MIT, y lo bastante pequeño para leerlo: `npx multivac@latest` descarga el release actual. La superficie de la CLI que sigue es lo que se distribuye hoy, y las partes que aún cambian lo dicen donde aparecen.

## O desde el código fuente {#or-from-source}

Para trabajar en el propio multivac, o para ejecutar un commit sin publicar:

```sh
git clone https://github.com/ulm0/multivac
cd multivac
corepack pnpm install
pnpm run build
pnpm link --global      # optional; every command also works as `node /path/to/multivac/dist/cli.js`
```

El repo se desarrolla con pnpm y te lo dice si recurres a otro:

```txt
$ npm install
multivac develops with pnpm — run: corepack pnpm install
```

Esa protección se limita al repo. Instalar el paquete publicado con `npm` o `npx` es totalmente válido — una herramienta que rechazara el gestor de paquetes de sus propios usuarios sería una herramienta que nadie instala.

## Dos nombres, un binario {#two-names-one-binary}

```json
{
  "bin": {
    "multivac": "dist/cli.js",
    "mvac": "dist/cli.js"
  }
}
```

`multivac` y `mvac` son el mismo archivo. La documentación los usa de forma intercambiable: `multivac` en la prosa donde se lee mejor, `mvac` en los bloques de shell donde es más corto. **Los hooks buscan `mvac` al final** — los shims prueban el `dist/cli.js` propio de este repositorio (con su `node_modules` al lado, y solo cuando el repositorio es multivac), luego `npx --no-install multivac`, luego `mvac` en el `PATH`. Dentro del clon acierta el build; en un repositorio que ni es multivac ni lo declara, acierta el `mvac` enlazado. Si no resuelve ninguno de los tres, el shim avisa por stderr y sale con 0, sin verificar nada.
Consulta [Hooks](../../reference/hooks).

## Compruébalo {#check-it}

```txt
$ mvac --version
```

Imprime la versión del paquete que instalaste. Lo que mantiene honesta la versión publicada es el job de release: rechaza publicar bajo un tag que no coincide con el manifiesto.

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

{{< callout >}}
¿Lo compilaste desde el código fuente en lugar de instalarlo? Entonces la cadena de versión es lo que decía `package.json` en el commit que clonaste, y el commit es la identidad —
un build entre releases lleva el número del release anterior.
{{< /callout >}}

## Cada máquina necesita su propio ejecutor {#every-machine-needs-its-own-runner}

Los archivos de hook viajan con el clon — están versionados bajo `.multivac/hooks/`, y `multivac doors` apunta `core.hooksPath` hacia ellos en cada clon nuevo — a menos que el `core.hooksPath` del repo ya nombre un directorio propio, o que tenga `.husky/` y ningún `core.hooksPath`: entonces los shims van junto a los hooks del propio repo y `core.hooksPath` queda como estaba — pero el binario no viaja. En una máquina donde ninguno de los tres ejecutores se resuelve, el shim imprime una advertencia por stderr y sale con 0: el commit aterriza, sin verificar. Eso es deliberado, y es la razón por la que la instalación anterior es por máquina y por la que `multivac doctor` nombra el ejecutor que encontró, o dice `INACTIVE`. Consulta [Hooks](../../reference/hooks).

## Siguiente {#next}

Arma un brain: [Primeros pasos](../getting-started).
