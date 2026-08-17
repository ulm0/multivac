# Contract: the tokens `site/assets/css/custom.css` exposes

The site's only interface here is the set of custom properties defined on
`:root`. Anything else in the stylesheet is an implementation detail of this
feature and may be rearranged; these names may not, because a later change —
a component, a shortcode, a partial — will reference them.

## Existing, unchanged

Pinned by MV-33. This feature must not alter them.

```css
--primary-hue: 76deg;
--primary-saturation: 90%;
--primary-lightness: 60%;
```

## Added by this feature

```css
/* Voice — a family plus its fallback chain. Never write a family name
   in a surface rule; write one of these. */
--font-human: 'Archivo', ui-sans-serif, system-ui, 'Segoe UI', Helvetica, Arial, sans-serif;
--font-machine: 'Martian Mono', ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace;

/* Width — the axis that carries the human/machine split.
   Human widens as it climbs; machine sits narrow. */
--wdth-display: 112%;
--wdth-heading: 105%;
--wdth-body:    100%;
--wdth-machine:  85%;
```

## Rules a consumer of these tokens must follow

1. **No surface rule names a font family directly.** It uses `--font-human` or
   `--font-machine`. A rule that writes `'Archivo'` breaks the single point at
   which the fallback chain can be corrected.
2. **The width axis is set with `font-stretch`, using one of the four tokens.**
   Not `font-variation-settings: 'wdth' …` — that shorthand overrides the whole
   variation record and silently drops the weight the browser resolved from
   `font-weight`.
3. **`--wdth-machine` appears only on machine surfaces**, and no other width
   value is introduced. Four steps is the whole scale; a fifth makes the axis
   stop meaning anything.
4. **Nothing here may pin a `font-size` in `px` on a text surface.** The reader's
   own text scaling must keep working (spec Edge Cases).

## `@font-face`, and the one thing MV-83 reads

Both faces are declared in this same stylesheet, with sources that are absolute
repo-local paths:

```css
@font-face {
  font-family: 'Archivo';
  src: url('/fonts/archivo-latin.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-stretch: 62% 125%;
  font-display: swap;
}
```

The `url('/fonts/…')` literal is what MV-83's `present` leg matches. A change
that moves the fonts elsewhere must move the leg in the same commit — that is
Principle III, and it is why the path is a literal in a tracked file rather than
a value interpolated by a template (research D4).

**What no token can express**, and therefore what no anchor asserts: that the
result reads as two voices. That is checked by eye against `quickstart.md`.
