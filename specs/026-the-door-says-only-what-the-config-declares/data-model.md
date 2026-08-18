# Data Model: The door says only what the config declares

## Resolution, after this change

| Config file | Declared | Requested | Door names | Report |
|---|---|---|---|---|
| absent | — | absent | nothing | — |
| absent | — | set | the requested tool | — (it became the declared value) |
| present | absent | absent | nothing | — |
| present | absent | **set** | **nothing** | the flag is unanswered, with how to make it stick |
| present | set | absent | the declared tool | — |
| present | set | same | the declared tool | already declared |
| present | set | different | *(refused, nothing written)* | refusal |
| present | unreadable | any | nothing | the config's own error |

Only the bolded row changes. Before it, the door named the requested tool while
the report said the flag had not taken effect, and the next `doors` run removed
the block.

## The invariant the table encodes

A configuration that exists is the only source for what the door names. A flag
is a source exactly once: on the run that writes the configuration.
