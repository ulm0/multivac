# Phase 1 — Data model: The engine reads one way

## Anchor regex, as the gate sees it

| Construct | Today | After |
| --- | --- | --- |
| `[[:digit:]]` | translated to `[0-9]` | unchanged |
| `[:digit:]` (bare) | translated to `0-9` — a pattern matching literal text | **refused**, naming `[[:digit:]]` |
| `\s \S \d \D \w \W \b \B` | refused with a translation hint | unchanged |
| `\t \n \e` and other alphabetic escapes | compiled with JS meaning | **refused** — no ERE meaning |
| `\1`…`\9` | compiled as a backreference | **refused** — not ERE |
| `(?…)` | compiled as lookahead/non-capturing | **refused** — not ERE |
| `*? +? ??` | compiled as lazy | **refused** — not ERE |
| flags other than `i` | refused | unchanged |

The walk that already tracks escapes gains one more piece of state: whether it
is inside a bracket expression, which is what makes "bare" answerable.

## Line

| Input | Today | After |
| --- | --- | --- |
| `a\nb` | two lines, `a` and `b` | unchanged |
| `a\r\nb` | two lines, `a\r` and `b` | two lines, `a` and `b` |
| `a\rb` | one line | unchanged — a lone `\r` is text |

Line NUMBERS are unchanged in every case, because the number of separators is
unchanged.

## Repo source, for `count`

| | Today | After |
| --- | --- | --- |
| how repos are chosen | count's own loop over `cfg.repos` | `resolveSources`, the function verify calls |
| which bytes | working tree, always | the channel ref for a sibling, the working tree for the brain (MV-53) |
| what is printed | nothing about the source | one `read` line per repo, verify's own sentence |
