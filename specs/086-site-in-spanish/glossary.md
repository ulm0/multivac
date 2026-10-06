# Glossary and style: English to Spanish (es-419)

One translator per chunk, many chunks, one voice. Follow this exactly.

## Voice
- Neutral Latin American Spanish. Second person singular, **tú** (never voseo: no `vos`, `tenés`, `podés`, `querés`, `mirá`; never `vosotros`). Often the imperative does the job: "ejecuta", "revisa", "confirma".
- No Spain-only words or forms (no "ordenador", "vale", "coger", "vosotros"). Plain, direct, technical; the English is already terse, stay terse.
- Spanish punctuation: `¿…?`, `¡…!`. Keep the source's straight quotes and em dashes.
- Do not add or drop content. A sentence in English is a sentence in Spanish.

## Never translate (copy byte for byte)
Fenced code blocks of any kind; inline code (`like this`); commands, flags, subcommands, config keys, file and directory names, paths, URLs, MV-/INV- ids, env vars, anchor modes, status values (`proposed`, `active`, `planned`, `landed` …) and every line the tool prints. Product names (multivac, mvac, Hugo, spec-kit, OpenSpec, GitHub, GitLab, Claude Code …). Shortcode names and attributes except the human-readable text attributes (`title`, `subtitle`, `description`, `badge` text) and the text between a shortcode's tags.

## Terms (English → Spanish; "keep" = leave in English)
| English | Spanish |
| --- | --- |
| brain (the repo) | brain (keep, masculine: "el brain") |
| brain-driven development | desarrollo guiado por el brain |
| ecosystem | ecosistema |
| law, law table | ley, tabla de la ley |
| invariant | invariante |
| row | fila |
| claim | afirmación (first use on a page: "afirmación (*claim*)") |
| anchor / anchored / unanchored | ancla / anclado / sin anclar |
| leg (of an anchor) | tramo |
| mode (absent, present, count, each, unique) | modo (the mode names stay in code) |
| tombstone | lápida |
| drift (state) | deriva (the word `drift` stays in code) |
| self-heal | autocorrección, autocorregir |
| change (the unit of work) | cambio |
| landing order / stage | orden de aterrizaje / etapa |
| land (verb), landed | aterrizar, aterrizado |
| roadmap | roadmap (keep) |
| ritual | ritual |
| door | puerta |
| hook, git hook | hook, hook de git |
| shim | shim (keep) |
| harness | harness (keep) |
| agent | agente |
| enact, enactment | promulgar, promulgación ("solo un humano promulga") |
| propose, proposed | proponer, propuesta |
| retire, retired | retirar, retirada |
| gate (verb) | bloquear |
| gate (noun) | compuerta |
| blocking / non-blocking | bloqueante / no bloqueante |
| ungateable | imposible de bloquear |
| refuse, refusal | rechazar, rechazo |
| verify | verificar |
| mount, mounted | montaje, montado |
| pin, stale pin | pin, pin desactualizado |
| channel | canal |
| consumer repo / code repo / declared repo / sibling | repo consumidor / repo de código / repo declarado / repo hermano |
| worktree, branch, tag, commit, push, fetch, clone | worktree (keep), rama, tag (keep), commit (keep), push (keep), fetch (keep), clonar |
| merge request (MR) | merge request (MR) |
| release, changelog | release (keep), changelog (keep) |
| SDD | SDD (desarrollo guiado por especificaciones) |
| greenfield | greenfield (keep) |
| deterministic / offline | determinista / sin conexión |
| exit code | código de salida |
| default | por defecto |
| strict (flag `--strict`) | estricto |
| session zero | sesión cero |
| inventory / interview | inventario / entrevista |
| project (verb: doors project files) | proyectar |
| tool / binary | herramienta / binario |
| site / docs | sitio / documentación |

## Mechanics (a script checks these)
- Same headings, same levels, same order. Translate the heading text; do NOT write `{#id}` — the assembler adds each heading's English id so every link works in both languages.
- Same front matter keys; translate `title` and `description` only. Same `weight`.
- Same fenced blocks, same order, byte-identical. Same shortcodes, same order.
- Same tables (columns and rows), lists, blockquotes and callouts.
- Links: keep every URL and relative path; translate only the link text.
- No law ID (MV-n, INV-n) is added to a page that does not already name one.
