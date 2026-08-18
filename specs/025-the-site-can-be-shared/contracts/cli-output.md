# Contract: the head of every page

## Before

```html
<meta name=description content>
<meta property="og:description" content="
  ">
<meta property="og:type" content="
  ">
<meta name=twitter:card content="summary">
```

No `og:image` anywhere. Documentation pages carried `twitter:title` and no
`og:` tags at all.

## After

```html
<meta name="description" content="<the page's own, or the site's>">
<meta property="og:title" content="…">
<meta property="og:description" content="<the page's own, or the site's>">
<meta property="og:image" content="https://multivac.ulm0.com/og.png">
<meta property="og:url" content="…">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="…">
<meta name="twitter:description" content="…">
```

Every page, including every documentation page.

## The image

`/og.png`, 1200×630, tracked. The mark on the site's ground, wordless.

## The crawler file

`/robots.txt` exists and names `/sitemap.xml`.

## What this does not promise

Whether a given network renders the card is that network's decision. What is
promised is that the page offers everything a scraper needs.
