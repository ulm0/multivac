# Quickstart: validating the graph gate

Prerequisites: a checkout of this repo, `pnpm install`, `pnpm test` green.

```bash
pnpm build
```

## Scenario 1 — a missing graph refuses the close (SC-001, SC-002)

In a scratch ecosystem with `grapher: graphify` declared and two sibling repos:

```bash
rm -rf acme-api/graphify-out acme-web/graphify-out
node dist/cli.js change close points-expire
```

Expect: refusal, both repos named in one message, the build command printed for
each, and the two escape hatches on the following line. Expect the change file
still present and unarchived.

## Scenario 2 — the gate is evaluable or it refuses (SC-003)

```bash
PATH=/usr/bin:/bin node dist/cli.js change close points-expire
```

With the grapher's binary off the path, expect a refusal naming the binary and
the install hint — never a close that proceeds as though the check had passed.

## Scenario 3 — out of scope stays quiet (SC-004)

Set `grapher: none` on one repo, leave it with no graph:

```bash
node dist/cli.js change close points-expire
```

Expect: close succeeds, and that repo is described as out of scope rather than
as a gap. Repeat for a change with no grapher declared anywhere: expect nothing
about graphs at all.

## Scenario 4 — the switches work and say so

```bash
node dist/cli.js change close points-expire --no-grapher
```

Expect: close proceeds, and a line stating the gate was skipped. Repeat with
`grapher_auto: false` in `.multivac/config.yml` and expect the equivalent line.

## Scenario 5 — the refresh reaches every declared repo (FR-014)

Touch a file in a repo the change never named, then close:

```bash
echo "// touched" >> acme-web/src/index.ts
node dist/cli.js change close points-expire
```

Expect a refresh line for `web` even though the change declared only `api`.

## Scenario 6 — the door names the graph (US4)

```bash
node dist/cli.js doors
grep -A4 "code graph" AGENTS.md
```

Expect the tool and its artifact named, and the declared query verbs verbatim.
Remove `grapher:` from the config, re-run `doors`, and expect no graph block at
all.

## Scenario 7 — the offline commands are untouched (SC-005)

```bash
node dist/cli.js verify && node dist/cli.js doctor && node dist/cli.js doors
```

Expect no graph build, no refusal on the graph's account, and no foreign
process spawned by any of the three.

## Cleanup

```bash
git reset --hard origin/main && git clean -fd
```
