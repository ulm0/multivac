# Contract — the anchor dialect, and what reads a file

## Accepted at write time

`[[:alpha:]]` `[[:digit:]]` `[[:space:]]` `[[:alnum:]]` `[[:upper:]]`
`[[:lower:]]` `[[:blank:]]` `[[:xdigit:]]` `[[:punct:]]`, alternation, grouping
`( )`, quantifiers `* + ? {n,m}`, anchors `^ $`, bracket expressions including
negated ones, and the `i` flag.

## Refused at write time, with the fix in the message

| Written | Message names |
| --- | --- |
| `\s \d \w \b` … | the POSIX equivalent |
| `[:digit:]` outside brackets | that the syntax is `[[:digit:]]` |
| `[:nosuch:]` | the classes that exist |
| `\t`, `\n`, any alphabetic escape with no ERE meaning | that ERE has no such escape |
| `\1` | that ERE has no backreferences |
| `(?=` `(?!` `(?:` | that ERE has no lookaround or non-capturing groups |
| `*?` `+?` `??` | that ERE quantifiers are greedy, and how to restructure |
| flags other than `i` | which flags are allowed |

Every refusal is at PARSE time — before an anchor can ever report green.

## Reading a file

| Surface | Unit |
| --- | --- |
| `*.sql` | one normalised statement |
| everything else | one line, where a line ends at `\n` or `\r\n` |

## Reading a repo

`count` and `verify` resolve repos through one function and read each at the
same ref: a sibling at its channel (MV-53), the brain at its working tree. Both
print what they read.
