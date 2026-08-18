# Quickstart: the card

```bash
cd site && hugo --gc --minify && cd ..
```

## Scenario 1 — every page has an image (SC-001)

```bash
grep -L 'og:image' site/public/index.html site/public/docs/index.html
```

Expect no output: every file listed has one.

## Scenario 2 — the large card (SC-002)

```bash
grep -o 'twitter:card" content="[^"]*' site/public/index.html
```

Expect `summary_large_image`.

## Scenario 3 — descriptions are non-empty (SC-001)

```bash
grep -o 'name="description" content="[^"]*' site/public/docs/index.html
```

Expect a sentence, not an empty attribute.

## Scenario 4 — the build draws nothing (SC-003)

```bash
git status --short site/static/og.png
```

Expect no change: the build did not touch it.

## Scenario 5 — the crawler file (SC-004)

```bash
cat site/public/robots.txt
```

Expect it to name the sitemap.

## Scenario 6 — the real thing

Paste the deployed URL into a link-unfurling surface. The card should carry the
mark, the title and the description.
