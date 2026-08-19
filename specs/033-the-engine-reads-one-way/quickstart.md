# Quickstart — proving the engine reads one way

## Prerequisites

```sh
corepack pnpm install && pnpm run build
```

## Before

```sh
# 1. the canonical class typo compiles to nonsense
node -e "import('./dist/lib/regex.js').then(m=>{const r=m.compileAnchorRegex('PIN[:digit:]');console.log(r.source, r.test('PIN4'))})"
# PIN0-9 false      ← matches only the literal text "PIN0-9"

# 2. a CRLF file never matches a $-anchored leg
printf 'alpha\r\nbeta\r\n' > /tmp/crlf.txt
node dist/cli.js count "brain:/tmp/crlf.txt /alpha$/"      # 0

# 3. count reads working trees, verify reads channels, and count says nothing
node dist/cli.js count "*:**.ts /export/"                  # no read line
```

## After

1. the typo is refused, naming `[[:digit:]]`
2. the CRLF file matches exactly as its LF twin does
3. `count` prints a `read` line per repo and agrees with `verify`

## The guard that makes the tightening safe

```sh
pnpm test
node dist/cli.js verify
```

Every anchor in this brain's own law must still compile — 108 rows of corpus is
the measurement, and it is the reason a widened gate can ship at all.
